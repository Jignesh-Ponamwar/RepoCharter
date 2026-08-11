import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const requiredDocs = {
  'docs/how-it-works.md': ['## Lifecycle', '## Safety boundaries', 'workflow.mjs preview'],
  'docs/generated-files.md': ['## Ownership classification', '## Recovery', 'merge-required'],
  'docs/agent-support.md': ['no behavior-verified agent support', 'What a behavior evaluation must prove'],
  'CONTRIBUTING.md': ['## Requirements', '## Compatibility research and evaluation'],
  'docs/verification-status.md': ['Not observed in this session', 'npm registry lookup'],
  'examples/initialization-output.example.md': ['fictional, annotated composite', 'merge-required', 'nextTask'],
};

test('preview documentation, examples, and release record state verified limits clearly', async () => {
  for (const [file, markers] of Object.entries(requiredDocs)) {
    const content = await readFile(file, 'utf8');
    for (const marker of markers) assert.ok(content.includes(marker), `${file} is missing ${marker}`);
  }
  const generated = await readFile('examples/generated-AGENTS.example.md', 'utf8');
  assert.ok(generated.split('\n').length >= 150);
  assert.match(generated, /Fictional generated example/);
});

test('package metadata includes runtime plus required preview documentation assets', async () => {
  const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
  for (const path of [
    'bin', 'src', 'scripts', 'skills', 'docs', 'examples/generated-AGENTS.example.md',
    'examples/initialization-output.example.md', 'CONTRIBUTING.md', 'LICENSE',
  ]) {
    assert.ok(packageJson.files.includes(path), `package files omits ${path}`);
  }
  assert.equal(packageJson.name, 'repo-charter');
  assert.equal(packageJson.version, '0.1.0');
  assert.equal(packageJson.license, 'MIT');
});
