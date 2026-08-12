import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { generateCanonicalDocuments } from '../src/generation/documents.js';
import { applyApprovedDocumentChanges, formatDocumentPreview, previewDocumentChanges, summarizeDocumentPreview } from '../src/generation/reconciliation.js';
import { inspectRepository } from '../src/inspection/index.js';

function specification() {
  return {
    selectedAgents: { primary: 'codex', secondary: ['claude-code'] },
    workspaceVisibility: 'local-planning',
    confirmedDecisions: {
      'project-goal': 'Give support teams a reliable request workflow.',
      'users-outcomes': 'Employees create requests, agents resolve them, and administrators manage access.',
      'current-pain': 'Support work is currently lost across chat messages.',
      'mvp-boundary': 'Create, assign, and resolve support requests.',
      exclusions: 'Email automation and organization-wide policy management.',
      'core-workflows': 'Create requests, assign authorized owners, record status transitions, and review history.',
      'domain-rules': 'Only authorized roles may assign or resolve requests; history is append-only.',
      'architecture-constraints': 'Keep authorization server authoritative and preserve the existing Node.js layout.',
      'data-security-privacy': 'Restrict request access by role and do not log request descriptions.',
      integrations: 'Use the existing identity provider and defer notification providers.',
      'operations-deployment': 'Run migrations separately, expose a health check, and retain rollback instructions.',
      'quality-verification': 'Run workflow, authorization, migration, and browser checks before release.',
      'future-scope': 'Future team support requires durable authorization and audit boundaries now.',
      'risks-dependencies': 'Identity-provider availability and migration rehearsal are release dependencies.',
      'assumptions-open-questions': 'Identity subjects are stable; no unresolved implementation blocker remains.',
    },
    verificationDepth: 'approved-checks',
  };
}

async function temporaryRepository(prefix = 'repo-charter-generation-') {
  const target = await mkdtemp(path.join(os.tmpdir(), prefix));
  await mkdir(path.join(target, 'src'));
  await mkdir(path.join(target, 'tests'));
  await writeFile(path.join(target, 'src', 'index.js'), 'export const ready = true;\n');
  await writeFile(path.join(target, 'tests', 'index.test.js'), 'export {};\n');
  await writeFile(path.join(target, 'package.json'), JSON.stringify({ scripts: { lint: 'node lint.js', test: 'node --test' } }));
  return target;
}

async function documentsFor(target) {
  return generateCanonicalDocuments(specification(), await inspectRepository(target));
}

test('canonical document generation is project-specific, traceable, and within the AGENTS context budget', async () => {
  const target = await temporaryRepository();
  try {
    const documents = await documentsFor(target);
    const agents = documents.find((document) => document.path === 'AGENTS.md').content;
    const plan = documents.find((document) => document.path === 'PLAN.md').content;
    const todo = documents.find((document) => document.path === 'TODO.md').content;

    assert.ok(agents.split('\n').length >= 150 && agents.split('\n').length <= 250);
    assert.match(agents, /Give support teams a reliable request workflow/);
    assert.match(agents, /npm run lint/);
    assert.match(agents, /If local `PLAN.md` exists/);
    assert.match(agents, /local-planning/);
    assert.match(agents, /Selected collaboration agents: codex, claude-code/);
    assert.match(plan, /intended behavior/);
    assert.match(plan, /Create, assign, and resolve support requests/);
    assert.match(todo, /\*\*1\.1 Implement core workflow\*\*/);
    assert.match(todo, /Phase gate: PENDING/);
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test('empty fixtures apply approved safe documents atomically and an unchanged second run produces no changes', async () => {
  const target = await temporaryRepository();
  try {
    const preview = await previewDocumentChanges(target, await documentsFor(target));
    assert.deepEqual(preview.changes.map((change) => change.status), ['missing', 'missing', 'missing', 'missing']);
    assert.deepEqual(preview.changes.map((change) => change.path), ['AGENTS.md', 'PLAN.md', 'TODO.md', '.gitignore']);
    assert.match(formatDocumentPreview(preview), /missing: AGENTS.md/);
    const summary = summarizeDocumentPreview(preview);
    assert.deepEqual(summary.blocked, []);
    assert.doesNotThrow(() => JSON.stringify(summary));

    const applied = await applyApprovedDocumentChanges(target, preview, { approveSafe: true });
    assert.deepEqual(applied.results.map((result) => result.status), ['created', 'created', 'created', 'created']);
    assert.equal(applied.ownershipChanged, true);
    assert.match(await readFile(path.join(target, 'AGENTS.md'), 'utf8'), /Agent Collaboration Contract/);

    const secondPreview = await previewDocumentChanges(target, await documentsFor(target));
    assert.deepEqual(secondPreview.changes.map((change) => change.status), ['owned-current', 'owned-current', 'owned-current', 'owned-current']);
    const secondApply = await applyApprovedDocumentChanges(target, secondPreview, { approveSafe: true });
    assert.deepEqual(secondApply.results.map((result) => result.status), ['unchanged', 'unchanged', 'unchanged', 'unchanged']);
    assert.equal(secondApply.ownershipChanged, false);
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test('compatible, user-modified, contradictory, and blocked fixtures preserve unapproved project content', async () => {
  const fixtureRoot = path.resolve('tests/fixtures/generation');
  const compatibleTarget = await mkdtemp(path.join(os.tmpdir(), 'repo-charter-compatible-'));
  const modifiedTarget = await mkdtemp(path.join(os.tmpdir(), 'repo-charter-modified-'));
  const conflictTarget = await mkdtemp(path.join(os.tmpdir(), 'repo-charter-conflict-'));
  const blockedTarget = await mkdtemp(path.join(os.tmpdir(), 'repo-charter-blocked-'));
  try {
    for (const target of [compatibleTarget, modifiedTarget, conflictTarget, blockedTarget]) {
      await cp(path.join(fixtureRoot, 'base'), target, { recursive: true });
    }

    const compatibleDocuments = await documentsFor(compatibleTarget);
    await writeFile(path.join(compatibleTarget, 'AGENTS.md'), compatibleDocuments[0].content);
    const compatiblePreview = await previewDocumentChanges(compatibleTarget, compatibleDocuments);
    assert.equal(compatiblePreview.changes[0].status, 'compatible-existing');

    const initialPreview = await previewDocumentChanges(modifiedTarget, await documentsFor(modifiedTarget));
    await applyApprovedDocumentChanges(modifiedTarget, initialPreview, { approveSafe: true });
    await writeFile(path.join(modifiedTarget, 'AGENTS.md'), '# User modified contract\n');
    const modifiedPreview = await previewDocumentChanges(modifiedTarget, await documentsFor(modifiedTarget));
    assert.equal(modifiedPreview.changes[0].status, 'owned-modified');
    const pendingModified = await applyApprovedDocumentChanges(modifiedTarget, modifiedPreview, { approveSafe: true });
    assert.equal(pendingModified.results[0].status, 'pending-approval');
    const preserved = await applyApprovedDocumentChanges(modifiedTarget, modifiedPreview, {
      approveSafe: true,
      artifacts: { 'AGENTS.md': { action: 'preserve' } },
    });
    assert.equal(preserved.results[0].status, 'preserved');
    assert.equal(await readFile(path.join(modifiedTarget, 'AGENTS.md'), 'utf8'), '# User modified contract\n');

    await writeFile(path.join(conflictTarget, 'PLAN.md'), '# Existing project plan\n');
    const conflictPreview = await previewDocumentChanges(conflictTarget, await documentsFor(conflictTarget));
    assert.equal(conflictPreview.changes[1].status, 'merge-required');
    const pending = await applyApprovedDocumentChanges(conflictTarget, conflictPreview, { approveSafe: true });
    assert.equal(pending.results[1].status, 'pending-approval');
    assert.equal(await readFile(path.join(conflictTarget, 'PLAN.md'), 'utf8'), '# Existing project plan\n');
    const reconciled = await applyApprovedDocumentChanges(conflictTarget, conflictPreview, {
      approveSafe: true,
      artifacts: { 'PLAN.md': { action: 'reconcile', content: '# Reconciled project plan\n' } },
    });
    assert.equal(reconciled.results[1].status, 'modified');
    assert.equal(await readFile(path.join(conflictTarget, 'PLAN.md'), 'utf8'), '# Reconciled project plan\n');

    await mkdir(path.join(blockedTarget, 'TODO.md'));
    const blockedPreview = await previewDocumentChanges(blockedTarget, await documentsFor(blockedTarget));
    assert.equal(blockedPreview.changes[2].status, 'blocked');
  } finally {
    await Promise.all([compatibleTarget, modifiedTarget, conflictTarget, blockedTarget].map((target) => rm(target, { recursive: true, force: true })));
  }
});
