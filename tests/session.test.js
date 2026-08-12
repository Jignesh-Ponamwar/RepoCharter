import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { run } from '../src/cli.js';
import { AGENT_REGISTRY, selectAgents } from '../src/session/agents.js';
import { createPlanningHandoff } from '../src/session/handoff.js';
import { createSessionManifest, readSessionManifest, setWorkspaceVisibility, transitionSession, writeSessionManifest } from '../src/session/manifest.js';
import { inspectionSnapshot } from '../src/session/snapshot.js';
import { inspectRepository } from '../src/inspection/index.js';

async function temporaryDirectory(prefix = 'repo-charter-session-') {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

async function removeDirectory(directory) {
  await rm(directory, { recursive: true, force: true });
}

test('agent registry models every target without claiming unverified compatibility', () => {
  assert.deepEqual(AGENT_REGISTRY.map((agent) => agent.id), [
    'codex', 'claude-code', 'github-copilot', 'cursor', 'windsurf', 'gemini-cli', 'generic',
  ]);
  assert.ok(AGENT_REGISTRY.every((agent) => agent.compatibility === 'unverified' && Array.isArray(agent.testedVersions)));
  assert.deepEqual(selectAgents('codex', ['claude-code']), { primary: 'codex', secondary: ['claude-code'] });
  assert.throws(() => selectAgents('unknown'), /Unsupported primary agent/);
  assert.throws(() => selectAgents('codex', ['codex']), /must not include the primary/);
});

test('new init requires and persists a valid primary agent without persisting source bodies or secrets', async () => {
  const target = await temporaryDirectory();
  const secret = 'ghp_123456789012345678901234567890';

  try {
    await writeFile(path.join(target, 'package.json'), JSON.stringify({ scripts: { deploy: `TOKEN=${secret} deploy` } }));
    await assert.rejects(run(['init'], target), /requires --primary-agent/);
    await assert.rejects(run(['init', '--primary-agent', 'unknown'], target), /Unsupported primary agent/);
    await assert.rejects(run(['init', '--primary-agent', 'codex', '--non-interactive'], target), /cannot create a session/);

    const initialized = await run(['init', '--primary-agent', 'codex', '--agents', 'claude-code'], target);
    assert.equal(initialized.output.session.stage, 'handoff-ready');
    assert.deepEqual(initialized.output.session.selectedAgents, { primary: 'codex', secondary: ['claude-code'] });
    assert.match(initialized.output.handoff, /Required interview procedure/);
    assert.ok(!initialized.output.handoff.includes(secret));

    const persisted = await readFile(path.join(target, '.repo-charter', 'manifest.json'), 'utf8');
    assert.ok(!persisted.includes(secret));
    assert.ok(!persisted.includes('rawTranscript'));
    const manifest = JSON.parse(persisted);
    assert.deepEqual(manifest.selectedAgents, { primary: 'codex', secondary: ['claude-code'] });
    assert.equal(manifest.stage, 'handoff-ready');
    assert.equal(manifest.workspaceVisibility, null);
    assert.ok(Array.isArray(manifest.repositorySnapshot.files));
    assert.ok(!/"content"\s*:/.test(persisted));
  } finally {
    await removeDirectory(target);
  }
});

test('resume re-inspects changed files, updates the safe snapshot, and rejects changed agent selections', async () => {
  const target = await temporaryDirectory();

  try {
    await writeFile(path.join(target, 'README.md'), '# Before\n');
    await run(['init', '--primary-agent', 'codex'], target);
    await writeFile(path.join(target, 'README.md'), '# Changed repository content\n');

    const resumed = await run(['resume'], target);
    assert.deepEqual(resumed.output.changedPaths, ['README.md']);
    assert.equal(resumed.output.session.stage, 'handoff-ready');
    assert.match(resumed.output.handoff, /"path": "README.md"/);

    await assert.rejects(
      run(['init', '--primary-agent', 'gemini-cli'], target),
      /do not match the existing setup session/,
    );
  } finally {
    await removeDirectory(target);
  }
});

test('manifest validation rejects corrupt or transcript-bearing state without exposing a session', async () => {
  const target = await temporaryDirectory();

  try {
    await mkdir(path.join(target, '.repo-charter'));
    await writeFile(path.join(target, '.repo-charter', 'manifest.json'), '{not json');
    const checked = await run(['check'], target);
    assert.equal(checked.exitCode, 1);
    assert.ok(checked.output.diagnostics.some((item) => /Invalid session manifest/.test(item.message)));
    await assert.rejects(run(['resume'], target), /Invalid session manifest/);

    const inspection = await inspectRepository(target);
    const transcriptManifest = createSessionManifest({ primary: 'codex', secondary: [] }, inspectionSnapshot(inspection));
    transcriptManifest.confirmedDecisions.rawTranscript = 'do not persist this';
    await assert.rejects(writeSessionManifest(target, transcriptManifest), /forbidden transcript/);
  } finally {
    await removeDirectory(target);
  }
});

test('workspace visibility remains unset until confirmed and migrates prior local state without inference', async () => {
  const target = await temporaryDirectory();

  try {
    const inspection = await inspectRepository(target);
    const manifest = createSessionManifest({ primary: 'codex', secondary: [] }, inspectionSnapshot(inspection));
    assert.equal(manifest.workspaceVisibility, null);
    const confirmed = setWorkspaceVisibility(manifest, 'shared-planning');
    assert.equal(confirmed.workspaceVisibility, 'shared-planning');
    assert.throws(() => setWorkspaceVisibility(manifest, 'public'), /must be local-planning or shared-planning/);

    await mkdir(path.join(target, '.repo-charter'));
    const legacy = { ...manifest, schemaVersion: 1 };
    delete legacy.workspaceVisibility;
    await writeFile(path.join(target, '.repo-charter', 'manifest.json'), `${JSON.stringify(legacy)}\n`);
    const migrated = await readSessionManifest(target);
    assert.equal(migrated.schemaVersion, 2);
    assert.equal(migrated.workspaceVisibility, null);
  } finally {
    await removeDirectory(target);
  }
});

test('stage transitions and resume remain safe from every valid persisted stage', async () => {
  const target = await temporaryDirectory();

  try {
    await writeFile(path.join(target, 'README.md'), '# Fixture\n');
    const inspection = await inspectRepository(target);
    const baseManifest = createSessionManifest({ primary: 'codex', secondary: [] }, inspectionSnapshot(inspection));
    assert.throws(() => transitionSession(baseManifest, 'validated'), /Invalid session transition/);

    let transitioned = { ...baseManifest, stage: 'inspected' };
    transitioned = transitionSession(transitioned, 'agents-selected');
    transitioned = transitionSession(transitioned, 'handoff-ready');
    assert.equal(transitioned.stage, 'handoff-ready');

    const stages = ['inspected', 'agents-selected', 'handoff-ready', 'decisions-confirmed', 'changes-approved', 'applied', 'validated'];
    for (const stage of stages) {
      const manifest = { ...baseManifest, stage };
      await writeSessionManifest(target, manifest);
      const resumed = await run(['resume'], target);
      assert.equal(resumed.exitCode, 0);
      assert.equal(resumed.output.session.stage, stage);
    }

    const handoff = createPlanningHandoff(baseManifest, inspection);
    assert.match(handoff, /developer explicitly confirms/);
    assert.match(handoff, /local-planning/);
    assert.match(handoff, /Do not persist raw conversation transcripts/);
  } finally {
    await removeDirectory(target);
  }
});
