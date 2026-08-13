import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const requiredDocs = {
  'docs/how-it-works.md': ['## Lifecycle', '## Safety boundaries', 'repo-charter workflow preview'],
  'docs/generated-files.md': ['## Ownership classification', '## Recovery', 'merge-required'],
  'docs/agent-support.md': ['no behavior-verified agent support', 'What a behavior evaluation must prove'],
  'CONTRIBUTING.md': ['## Requirements', '## Compatibility research and evaluation'],
  'docs/verification-status.md': ['Deferred post-MVP scope', 'npm registry/package identity'],
  'docs/windows-e2e-test.md': ['## 1. Preconditions and isolated harness', '## 5. Verify the installed skill uses the public CLI', 'repo-charter@0.1.3'],
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
  const copilot = await readFile('examples/.github/copilot-instructions.md', 'utf8');
  const gemini = await readFile('examples/GEMINI.md', 'utf8');
  assert.equal(
    copilot.slice(copilot.indexOf('\n')),
    gemini.slice(gemini.indexOf('\n')),
    'The Copilot example must retain the shared adapter rules verbatim after its platform-specific heading.',
  );
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
  assert.deepEqual(packageJson.bin, { 'repo-charter': 'bin/repo-charter.js' });
  assert.equal(packageJson.version, '0.1.5');
  assert.equal(packageJson.license, 'MIT');
});
