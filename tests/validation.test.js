import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { run, main } from '../src/cli.js';
import { generateSelectedAgentDocuments } from '../src/adapters/planning.js';
import { applyApprovedDocumentChanges, previewDocumentChanges } from '../src/generation/reconciliation.js';
import { inspectRepository } from '../src/inspection/index.js';
import { readSessionManifest, recordObservedCheck, setWorkspaceVisibility, writeSessionManifest } from '../src/session/manifest.js';

function specification() {
  return {
    selectedAgents: { primary: 'codex', secondary: [] },
    workspaceVisibility: 'local-planning',
    verificationDepth: 'static',
    confirmedDecisions: {},
  };
}

async function temporaryRepository() {
  const target = await mkdtemp(path.join(os.tmpdir(), 'repo-charter-validation-'));
  await writeFile(path.join(target, 'package.json'), JSON.stringify({ scripts: { lint: 'node lint.js', test: 'node --test' } }));
  return target;
}

async function generatedSetup(target) {
  await run(['init', '--primary-agent', 'codex'], target);
  const inspection = await inspectRepository(target);
  const preview = await previewDocumentChanges(target, generateSelectedAgentDocuments(specification(), inspection));
  await applyApprovedDocumentChanges(target, preview, { approveSafe: true });
}

test('check is read-only, returns warnings separately, and emits an exact next-task report in human and JSON forms', async () => {
  const target = await temporaryRepository();
  try {
    await generatedSetup(target);
    const before = await readFile(path.join(target, '.repo-charter', 'manifest.json'), 'utf8');
    const checked = await run(['check', '--json'], target);
    const after = await readFile(path.join(target, '.repo-charter', 'manifest.json'), 'utf8');
    assert.equal(checked.exitCode, 0);
    assert.equal(before, after);
    assert.ok(checked.output.diagnostics.some((item) => item.status === 'unverified'));
    assert.equal(checked.output.report.nextTask, '1.1 Implement core workflow');
    assert.deepEqual(checked.output.report.artifacts.map((artifact) => artifact.status), ['unchanged', 'unchanged', 'unchanged']);

    let stdout = '';
    const io = { stdout: { write: (text) => { stdout += text; } }, stderr: { write: () => {} }, exitCode: undefined };
    await main(['check', target], io);
    assert.match(stdout, /Final change report:/);
    assert.match(stdout, /Next approved task: 1\.1 Implement core workflow/);
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test('check validates the selected workspace mode without making Git tracking claims', async () => {
  const target = await temporaryRepository();
  try {
    await generatedSetup(target);
    const manifest = await readSessionManifest(target);
    await writeSessionManifest(target, setWorkspaceVisibility(manifest, 'local-planning'));
    const checked = await run(['check'], target);
    assert.ok(!checked.output.diagnostics.some((item) => item.category === 'visibility' && item.severity === 'error'));
    await writeFile(path.join(target, 'package.json'), JSON.stringify({ files: ['PLAN.md'] }));
    const packageRisk = await run(['check'], target);
    assert.ok(packageRisk.output.diagnostics.some((item) => /files allowlist may publish local artifact: PLAN.md/.test(item.message)));
    await writeFile(path.join(target, '.gitignore'), '# user-owned replacement\n');
    const missingPolicy = await run(['check'], target);
    assert.ok(missingPolicy.output.diagnostics.some((item) => item.category === 'visibility' && /ignore block is missing/.test(item.message)));
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test('check fails integrity and approved-check failures while stale facts remain advisory', async () => {
  const target = await temporaryRepository();
  try {
    await generatedSetup(target);
    await writeFile(path.join(target, 'AGENTS.md'), '# modified after ownership\n');
    const modified = await run(['check'], target);
    assert.equal(modified.exitCode, 1);
    assert.ok(modified.output.diagnostics.some((item) => /Managed artifact was modified/.test(item.message)));

    await generatedSetup(target);
    const manifest = await readSessionManifest(target);
    await writeSessionManifest(target, recordObservedCheck(manifest, {
      command: 'npm test', exitCode: 1, output: 'failed without secrets', verificationDepth: 'approved-checks',
    }));
    const failedCheck = await run(['check', '--json'], target);
    assert.equal(failedCheck.exitCode, 1);
    assert.ok(failedCheck.output.diagnostics.some((item) => /Approved check failed/.test(item.message)));

    const staleTarget = await temporaryRepository();
    try {
      await generatedSetup(staleTarget);
      await writeFile(path.join(staleTarget, 'AGENTS.md'), `${await readFile(path.join(staleTarget, 'AGENTS.md'), 'utf8')}\nUse \`npm run missing\`.\n`);
      const stale = await run(['check'], staleTarget);
      assert.equal(stale.exitCode, 1, 'ownership modification remains an integrity error');
      assert.ok(stale.output.diagnostics.some((item) => item.category === 'stale-facts' && item.severity === 'warning'));
    } finally {
      await rm(staleTarget, { recursive: true, force: true });
    }
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test('observed checks preserve passed, failed, and skipped truth without secrets', async () => {
  const target = await temporaryRepository();
  try {
    await run(['init', '--primary-agent', 'codex'], target);
    const manifest = await readSessionManifest(target);
    const withChecks = recordObservedCheck(recordObservedCheck(manifest, {
      command: 'npm test', exitCode: 0, output: 'all passed', verificationDepth: 'approved-checks',
    }), {
      command: 'npm run deploy TOKEN=ghp_123456789012345678901234567890', skipped: true, verificationDepth: 'full',
    });
    assert.deepEqual(withChecks.observedChecks.map((check) => check.status), ['passed', 'skipped']);
    assert.ok(!JSON.stringify(withChecks).includes('ghp_'));
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});
