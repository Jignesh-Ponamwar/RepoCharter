import assert from 'node:assert/strict';
import test from 'node:test';
import { managedIgnorePaths, reconcileIgnoreContent } from '../src/visibility/ignore.js';
import { getWorkspacePolicy } from '../src/visibility/policy.js';

test('workspace policy keeps AGENTS public and changes only selected planning artifacts by mode', () => {
  const selectedAgents = { primary: 'claude-code', secondary: ['github-copilot'] };
  const local = getWorkspacePolicy('local-planning', selectedAgents);
  const shared = getWorkspacePolicy('shared-planning', selectedAgents);

  assert.deepEqual(local.publicArtifacts, ['AGENTS.md']);
  assert.ok(local.localArtifacts.includes('PLAN.md'));
  assert.ok(local.localArtifacts.includes('CLAUDE.md'));
  assert.ok(local.localArtifacts.includes('.github/copilot-instructions.md'));
  assert.ok(local.localArtifacts.includes('.repo-charter/'));

  assert.ok(shared.publicArtifacts.includes('PLAN.md'));
  assert.ok(shared.publicArtifacts.includes('CLAUDE.md'));
  assert.ok(shared.publicArtifacts.includes('.github/copilot-instructions.md'));
  assert.deepEqual(shared.localArtifacts, ['.repo-charter/']);
});

test('managed ignore reconciliation preserves user content and changes only its marked block', () => {
  const current = '# user rule\nnode_modules/\n';
  const planned = reconcileIgnoreContent(current, ['.repo-charter/', 'PLAN.md']);
  assert.match(planned.content, /^# user rule\nnode_modules\//);
  assert.deepEqual(managedIgnorePaths(planned.content), ['.repo-charter/', 'PLAN.md']);

  const updated = reconcileIgnoreContent(planned.content, ['.repo-charter/']);
  assert.match(updated.content, /^# user rule\nnode_modules\//);
  assert.deepEqual(managedIgnorePaths(updated.content), ['.repo-charter/']);
  assert.equal(reconcileIgnoreContent('# repo-charter: workspace visibility\n', []).status, 'blocked');
});
