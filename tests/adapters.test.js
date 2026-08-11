import assert from 'node:assert/strict';
import test from 'node:test';
import { diagnoseAdapterCompatibility } from '../src/adapters/diagnostics.js';
import { generateSelectedAgentDocuments, planSelectedAgentOutputs } from '../src/adapters/planning.js';
import { claudeAdapter, copilotAdapter, geminiAdapter } from '../src/adapters/templates.js';

const ALL_SELECTION = {
  primary: 'codex',
  secondary: ['claude-code', 'github-copilot', 'cursor', 'windsurf', 'gemini-cli', 'generic'],
};

test('selected-agent planning generates only documented thin adapters and never optional rule directories', () => {
  const plan = planSelectedAgentOutputs(ALL_SELECTION);
  assert.equal(plan.canonicalPath, 'AGENTS.md');
  assert.deepEqual(plan.artifacts.map((artifact) => [artifact.agentId, artifact.path]), [
    ['claude-code', 'CLAUDE.md'],
    ['github-copilot', '.github/copilot-instructions.md'],
    ['gemini-cli', 'GEMINI.md'],
  ]);
  assert.deepEqual(plan.optionalRuleDirectories, []);
  assert.match(claudeAdapter(), /@AGENTS\.md/);
  assert.match(geminiAdapter(), /@\.\/AGENTS\.md/);
  assert.match(copilotAdapter(), /Read `AGENTS\.md`/);
  assert.ok(!plan.artifacts.some((artifact) => artifact.path.startsWith('.codex/')));
});

test('combined output always includes the canonical contract and only selected native adapters', () => {
  const documents = generateSelectedAgentDocuments({
    selectedAgents: { primary: 'claude-code', secondary: ['gemini-cli'] },
    verificationDepth: 'static',
    confirmedDecisions: {},
  }, { evidence: [], commands: [] });
  assert.deepEqual(documents.map((document) => document.path), ['AGENTS.md', 'PLAN.md', 'TODO.md', 'CLAUDE.md', 'GEMINI.md']);
});

test('adapter diagnostics distinguish unverified, degraded, stale, unexpected, and unnecessary surfaces', () => {
  const selection = { primary: 'claude-code', secondary: [] };
  const complete = diagnoseAdapterCompatibility(selection, {
    'AGENTS.md': '# Canonical\n',
    'CLAUDE.md': claudeAdapter(),
  });
  assert.equal(complete.status, 'unverified');
  assert.equal(complete.diagnostics[0].status, 'unverified');

  const degraded = diagnoseAdapterCompatibility(selection, { 'CLAUDE.md': claudeAdapter() });
  assert.equal(degraded.status, 'degraded');

  const stale = diagnoseAdapterCompatibility(selection, {
    'AGENTS.md': '# Canonical\n',
    'CLAUDE.md': '# Edited adapter\n',
    '.claude/rules/api.md': '# Unneeded\n',
    '.github/copilot-instructions.md': copilotAdapter(),
  });
  assert.equal(stale.status, 'stale');
  assert.ok(stale.diagnostics.some((diagnostic) => diagnostic.status === 'unnecessary'));
  assert.ok(stale.diagnostics.some((diagnostic) => diagnostic.status === 'unexpected'));
});
