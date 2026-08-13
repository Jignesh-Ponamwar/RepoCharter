import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { driftReport, createDriftAnchor } from '../src/drift/index.js';
import { inspectRepository } from '../src/inspection/index.js';
import { createSessionManifest, setDriftAnchor, writeSessionManifest } from '../src/session/manifest.js';
import { run } from '../src/cli.js';

async function temporaryRepository() {
  const target = await mkdtemp(path.join(os.tmpdir(), 'repo-charter-drift-'));
  await writeFile(path.join(target, 'package.json'), '{"name":"fixture"}\n');
  await writeFile(path.join(target, 'PLAN.md'), '# Plan\n');
  await writeFile(path.join(target, 'TODO.md'), '- [ ] **1.1 Task**: pending\n');
  return target;
}

test('drift reports non-Git planning changes without writing or source capture', async () => {
  const target = await temporaryRepository();
  try {
    const initial = await inspectRepository(target);
    const anchor = await createDriftAnchor(target, initial.snapshot);
    const clean = await driftReport(target, await inspectRepository(target), anchor);
    assert.equal(clean.status, 'in-sync');

    await writeFile(path.join(target, 'PLAN.md'), '# Changed plan\n');
    const changed = await driftReport(target, await inspectRepository(target), anchor);
    assert.equal(changed.status, 'review-required');
    assert.deepEqual(changed.classifications, [{ path: 'PLAN.md', classification: 'planning-relevant' }]);
    assert.equal(changed.git.repository, 'non-git');
    assert.ok(!JSON.stringify(anchor).includes('Changed plan'));
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test('drift supports local-planning absence, shared-planning changes, and repeated no-op checks', async () => {
  const localTarget = await temporaryRepository();
  const sharedTarget = await temporaryRepository();
  try {
    await rm(path.join(localTarget, 'PLAN.md'));
    await rm(path.join(localTarget, 'TODO.md'));
    const localInspection = await inspectRepository(localTarget);
    const localAnchor = await createDriftAnchor(localTarget, localInspection.snapshot);
    assert.equal((await driftReport(localTarget, await inspectRepository(localTarget), localAnchor)).status, 'in-sync');
    assert.equal((await driftReport(localTarget, await inspectRepository(localTarget), localAnchor)).status, 'in-sync');

    const sharedInspection = await inspectRepository(sharedTarget);
    const sharedAnchor = await createDriftAnchor(sharedTarget, sharedInspection.snapshot);
    await writeFile(path.join(sharedTarget, 'TODO.md'), '- [ ] **1.1 Changed shared task**: review required\n');
    const shared = await driftReport(sharedTarget, await inspectRepository(sharedTarget), sharedAnchor);
    assert.equal(shared.status, 'review-required');
    assert.deepEqual(shared.classifications, [{ path: 'TODO.md', classification: 'planning-relevant' }]);
  } finally {
    await Promise.all([localTarget, sharedTarget].map((target) => rm(target, { recursive: true, force: true })));
  }
});

test('drift reports committed, uncommitted, untracked, and unreachable Git anchors without writing', async () => {
  const target = await temporaryRepository();
  const git = (...argumentsList) => {
    const result = spawnSync('git', ['-C', target, ...argumentsList], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  try {
    git('init');
    git('config', 'user.email', 'fixture@example.invalid');
    git('config', 'user.name', 'Fixture');
    git('add', '.');
    git('commit', '-m', 'anchor');
    const anchor = await createDriftAnchor(target, (await inspectRepository(target)).snapshot, 'approved-application', git('rev-parse', 'HEAD'));

    await writeFile(path.join(target, 'package.json'), '{"name":"changed"}\n');
    git('add', 'package.json');
    git('commit', '-m', 'manifest change');
    const committed = await driftReport(target, await inspectRepository(target), anchor);
    assert.equal(committed.status, 'review-required');
    assert.ok(committed.git.committed.includes('package.json'));

    await writeFile(path.join(target, 'PLAN.md'), '# Uncommitted plan\n');
    await writeFile(path.join(target, 'notes.txt'), 'untracked\n');
    const working = await driftReport(target, await inspectRepository(target), anchor);
    assert.ok(working.git.uncommitted.includes('PLAN.md'));
    assert.ok(working.git.untracked.includes('notes.txt'));
    assert.equal(working.status, 'review-required');

    const unreachable = await driftReport(target, await inspectRepository(target), { ...anchor, gitRevision: '0'.repeat(40) });
    assert.equal(unreachable.status, 'anchor-unavailable');
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test('explicit drift acknowledgement refreshes the anchor after review', async () => {
  const target = await temporaryRepository();
  try {
    const inspection = await inspectRepository(target);
    const manifest = setDriftAnchor(
      createSessionManifest({ primary: 'codex', secondary: [] }, inspection.snapshot),
      await createDriftAnchor(target, inspection.snapshot),
    );
    await writeSessionManifest(target, manifest);
    await writeFile(path.join(target, 'PLAN.md'), '# Reviewed change\n');
    assert.equal((await run(['drift-check'], target)).output.report.status, 'review-required');
    const acknowledged = await run(['drift-acknowledge'], target);
    assert.equal(acknowledged.exitCode, 0);
    assert.equal(acknowledged.output.anchor.reason, 'developer-acknowledged-drift');
    assert.equal((await run(['drift-check'], target)).output.report.status, 'in-sync');
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test('drift-check is read-only and reports an unavailable anchor', async () => {
  const target = await temporaryRepository();
  try {
    const inspection = await inspectRepository(target);
    const manifest = setDriftAnchor(
      createSessionManifest({ primary: 'codex', secondary: [] }, inspection.snapshot),
      await createDriftAnchor(target, inspection.snapshot),
    );
    const before = JSON.stringify(manifest);
    const unavailable = await run(['drift-check', '--json'], target);
    assert.equal(unavailable.exitCode, 1);
    assert.equal(unavailable.output.report.status, 'anchor-unavailable');
    assert.equal(JSON.stringify(manifest), before);
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});
