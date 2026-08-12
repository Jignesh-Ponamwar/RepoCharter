import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const skillRoot = path.resolve('skills/repo-charter');

test('installable RepoCharter skill has concise metadata and progressive references', async () => {
  const skill = await readFile(path.join(skillRoot, 'SKILL.md'), 'utf8');
  const manifest = await readFile(path.join(skillRoot, 'agents', 'openai.yaml'), 'utf8');
  assert.match(skill, /^---\nname: repo-charter\ndescription: /);
  assert.match(skill, /workflow\.mjs preview/);
  assert.match(manifest, /display_name: "RepoCharter"/);
  for (const reference of ['analysis.md', 'grill.md', 'reconciliation.md', 'compatibility.md']) {
    await readFile(path.join(skillRoot, 'references', reference), 'utf8');
  }
});

test('primary-source compatibility research documents every target without claiming support', async () => {
  const research = await readFile('docs/research/agent-instruction-surfaces.md', 'utf8');
  for (const source of [
    'developers.openai.com', 'docs.anthropic.com', 'docs.github.com', 'cursor.com',
    'docs.windsurf.com', 'geminicli.com', 'agents.md',
  ]) {
    assert.ok(research.includes(source), `Missing primary source: ${source}`);
  }
  assert.match(research, /No fresh-agent\s+matrix run is recorded/);
  assert.match(research, /advertises \*\*no verified agent\s+compatibility\*\*/);
});

test('skill workflow calls shared deterministic preview code without duplicating generation logic', async () => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'repo-charter-skill-'));
  const specificationPath = path.join(target, 'approved-spec.json');
  try {
    await writeFile(path.join(target, 'package.json'), JSON.stringify({ scripts: { test: 'node --test' } }));
    await writeFile(specificationPath, JSON.stringify({
      selectedAgents: { primary: 'claude-code', secondary: ['gemini-cli'] },
      workspaceVisibility: 'local-planning',
      verificationDepth: 'static',
      confirmedDecisions: {},
    }));
    const result = spawnSync(process.execPath, [
      path.join(skillRoot, 'scripts', 'workflow.mjs'), 'preview', target, specificationPath,
    ], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.type, 'preview');
    assert.deepEqual(output.preview.changes.map((change) => change.path), [
      'AGENTS.md', 'PLAN.md', 'TODO.md', 'CLAUDE.md', 'GEMINI.md', '.gitignore',
    ]);
    assert.ok(output.summary.requiresPerFileDecision === false);
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});
