import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { main, run } from '../src/cli.js';
import { discoverFiles, DEFAULT_MAX_FILE_BYTES } from '../src/inspection/discovery.js';
import { createEvidence, createUnknownEvidence, EVIDENCE_CLASSIFICATION } from '../src/inspection/evidence.js';
import { inspectRepository } from '../src/inspection/index.js';
import { redactSensitiveText } from '../src/inspection/redaction.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = path.join(packageRoot, 'tests', 'fixtures', 'inspection');

async function temporaryDirectory(prefix = 'repo-charter-inspection-') {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

async function removeDirectory(directory) {
  await rm(directory, { recursive: true, force: true });
}

function evidenceValues(result, fact) {
  return result.evidence.filter((item) => item.fact === fact).map((item) => item.value);
}

test('evidence schema preserves classification, source freshness, and unknown facts', () => {
  const observed = createEvidence({
    fact: 'language',
    value: 'TypeScript',
    classification: EVIDENCE_CLASSIFICATION.OBSERVED,
    confidence: 'high',
    evidenceType: 'compiler-config',
    source: { path: 'tsconfig.json', freshness: { modifiedAt: '2026-08-11T00:00:00.000Z', sizeBytes: 2 } },
  });
  const unknown = createUnknownEvidence('deployment-target', 'No deployment configuration was observed.');

  assert.equal(observed.classification, 'observed');
  assert.equal(observed.source.freshness.sizeBytes, 2);
  assert.equal(unknown.classification, 'unknown');
  assert.throws(() => createEvidence({ ...observed, classification: 'guessed' }), /Unsupported evidence classification/);
});

test('inspection detects Node.js stack, commands, architecture, operations, and documents', async () => {
  const target = await temporaryDirectory();

  try {
    await cp(path.join(fixtureRoot, 'node'), target, { recursive: true });
    await mkdir(path.join(target, 'tests'));
    await writeFile(path.join(target, 'tests', 'app.test.ts'), 'export {};\n');
    await mkdir(path.join(target, '.github', 'workflows'), { recursive: true });
    await writeFile(path.join(target, '.github', 'workflows', 'ci.yml'), 'name: ci\nrun: npm test\n');
    await mkdir(path.join(target, 'prisma'));
    await writeFile(path.join(target, 'prisma', 'schema.prisma'), 'generator client { provider = "prisma-client-js" }\n');
    await mkdir(path.join(target, 'migrations'));
    await writeFile(path.join(target, 'migrations', '001-initial.sql'), 'create table fixture ();\n');
    await mkdir(path.join(target, 'api'));
    await writeFile(path.join(target, 'api', 'health.js'), 'export const health = true;\n');
    await writeFile(path.join(target, 'Dockerfile'), 'FROM node:22\nRUN npm ci\n');
    await writeFile(path.join(target, 'README.md'), '# Fixture\nnpm run lint\n');

    const result = await inspectRepository(target);
    assert.ok(evidenceValues(result, 'language').includes('JavaScript'));
    assert.ok(evidenceValues(result, 'language').includes('TypeScript'));
    assert.ok(evidenceValues(result, 'framework').includes('Next.js'));
    assert.ok(evidenceValues(result, 'framework').includes('React'));
    assert.ok(evidenceValues(result, 'package-manager').includes('npm'));
    assert.ok(evidenceValues(result, 'repository-boundary').includes('src'));
    assert.ok(evidenceValues(result, 'test-boundary').includes('tests'));
    assert.ok(evidenceValues(result, 'data-boundary').includes('prisma'));
    assert.ok(evidenceValues(result, 'ci-boundary').includes('.github/workflows'));
    assert.ok(evidenceValues(result, 'operations').includes('container configuration'));
    assert.ok(evidenceValues(result, 'schema').includes('prisma/schema.prisma'));
    assert.ok(evidenceValues(result, 'migration').includes('migrations/001-initial.sql'));
    assert.ok(evidenceValues(result, 'health-check').includes('api/health.js'));
    assert.ok(evidenceValues(result, 'project-document').includes('README.md'));
    const manifestCommands = result.commands.filter((command) => command.source === 'package.json');
    assert.deepEqual(manifestCommands.map((command) => command.kind), ['build', 'development', 'install', 'lint', 'test']);
    assert.ok(manifestCommands.filter((command) => command.kind !== 'install').every((command) => command.command.startsWith('npm run ')));
    assert.ok(manifestCommands.some((command) => command.kind === 'install' && command.command === 'npm install'));
    assert.ok(result.commands.some((command) => command.kind === 'ci' && command.command === 'npm test'));
    assert.ok(result.commands.some((command) => command.kind === 'container' && command.command === 'npm ci'));
    assert.ok(result.commands.some((command) => command.kind === 'documented' && command.command === 'npm run lint'));
  } finally {
    await removeDirectory(target);
  }
});

test('inspection detects Python and monorepo evidence without requiring Git metadata', async () => {
  const target = await temporaryDirectory();

  try {
    await cp(path.join(fixtureRoot, 'python'), target, { recursive: true });
    await cp(path.join(fixtureRoot, 'monorepo'), target, { recursive: true });
    const result = await inspectRepository(target);

    assert.ok(evidenceValues(result, 'language').includes('Python'));
    assert.ok(evidenceValues(result, 'repository-structure').includes('monorepo workspace'));
    assert.ok(result.evidence.some((item) => item.fact === 'git-repository' && item.classification === 'unknown'));
  } finally {
    await removeDirectory(target);
  }
});

test('bounded discovery respects gitignore, hard exclusions, binary detection, limits, and configured filters', async () => {
  const target = await temporaryDirectory();

  try {
    await cp(path.join(fixtureRoot, 'ignored'), target, { recursive: true });
    await mkdir(path.join(target, 'node_modules', 'library'), { recursive: true });
    await writeFile(path.join(target, 'node_modules', 'library', 'index.js'), 'ignored');
    await writeFile(path.join(target, '.env'), 'TOKEN=real-secret');
    await writeFile(path.join(target, '.env.example'), 'TOKEN=example');
    await writeFile(path.join(target, 'private.key'), 'private-key');
    await writeFile(path.join(target, 'binary.js'), Buffer.from([0x00, 0x01, 0x02]));
    await writeFile(path.join(target, 'large.txt'), 'x'.repeat(DEFAULT_MAX_FILE_BYTES + 1));
    await mkdir(path.join(target, 'src'));
    await writeFile(path.join(target, 'src', 'included.js'), 'export default true;');
    await writeFile(path.join(target, 'outside.js'), 'export default false;');

    const discovered = await discoverFiles(target);
    const discoveredPaths = discovered.files.map((file) => file.path);
    assert.ok(discoveredPaths.includes('.env.example'));
    assert.ok(!discoveredPaths.includes('.env'));
    assert.ok(!discoveredPaths.includes('ignored/secret.txt'));
    assert.ok(!discoveredPaths.includes('visible.generated'));
    assert.ok(!discoveredPaths.includes('node_modules/library/index.js'));
    assert.ok(!discoveredPaths.includes('binary.js'));
    assert.ok(!discoveredPaths.includes('large.txt'));
    assert.deepEqual(
      discovered.skipped.filter((item) => ['.env', 'private.key', 'binary.js', 'large.txt'].includes(item.path)).map((item) => item.reason).sort(),
      ['binary-file', 'file-too-large', 'hard-excluded-sensitive-file', 'hard-excluded-sensitive-file'],
    );

    const narrowed = await discoverFiles(target, { includePaths: ['src/**'], excludePaths: ['src/ignored.js'] });
    assert.deepEqual(narrowed.files.map((file) => file.path), ['src/included.js']);

    const limited = await discoverFiles(target, { maxFiles: 1 });
    assert.equal(limited.files.length, 1);
    assert.ok(limited.skipped.some((item) => item.reason === 'file-count-limit'));
  } finally {
    await removeDirectory(target);
  }
});

test('inspection inventories agent/planning surfaces and redacts sensitive command evidence without executing scripts', async () => {
  const target = await temporaryDirectory();
  const marker = path.join(target, 'script-ran');
  const secret = 'ghp_123456789012345678901234567890';

  try {
    await cp(path.join(fixtureRoot, 'conflicting-documents'), target, { recursive: true });
    await writeFile(path.join(target, 'package.json'), JSON.stringify({
      scripts: { deploy: `TOKEN=${secret} node -e "require('fs').writeFileSync('${marker}', 'ran')"` },
    }));
    await writeFile(path.join(target, 'GEMINI.md'), '# Gemini\n');
    await mkdir(path.join(target, '.repo-charter'));
    await writeFile(path.join(target, '.repo-charter', 'ownership.json'), '{"safe":"metadata only"}\n');
    await mkdir(path.join(target, '.github'));
    await writeFile(path.join(target, '.github', 'copilot-instructions.md'), '# Copilot\n');

    const result = await inspectRepository(target);
    const serialized = JSON.stringify(result);
    assert.ok(result.repository.agentSurfaces.some((surface) => surface.agent === 'AGENTS.md'));
    assert.ok(result.repository.agentSurfaces.some((surface) => surface.agent === 'Claude Code'));
    assert.ok(result.repository.agentSurfaces.some((surface) => surface.agent === 'Gemini CLI'));
    assert.ok(result.repository.agentSurfaces.some((surface) => surface.agent === 'GitHub Copilot'));
    assert.ok(evidenceValues(result, 'managed-ownership-state').includes('present'));
    assert.ok(!serialized.includes(secret));
    assert.equal(redactSensitiveText(`TOKEN=${secret}`), 'TOKEN=[REDACTED]');
    assert.equal(result.commands[0].command, 'npm run deploy');
    await assert.rejects(readFile(marker, 'utf8'), { code: 'ENOENT' });
  } finally {
    await removeDirectory(target);
  }
});

test('check emits stable inspection data in direct, human, and JSON output without writing', async () => {
  const target = await temporaryDirectory();
  const output = [];
  const errors = [];
  const io = {
    stdout: { write: (value) => output.push(value) },
    stderr: { write: (value) => errors.push(value) },
    exitCode: undefined,
  };

  try {
    await writeFile(path.join(target, 'package.json'), '{"scripts":{"test":"node --test"}}');
    const first = await run(['check'], target);
    const second = await run(['check'], target);
    assert.deepEqual(first.output.inspection, second.output.inspection);
    assert.equal(first.exitCode, 0);
    assert.ok(first.output.inspection.commands.some((command) => command.kind === 'test'));

    await main(['check', target, '--json'], io);
    const jsonOutput = JSON.parse(output.join(''));
    assert.equal(jsonOutput.type, 'check');
    assert.ok(Array.isArray(jsonOutput.inspection.evidence));
    assert.deepEqual(errors, []);
    await assert.rejects(readFile(path.join(target, '.repo-charter', 'ownership.json'), 'utf8'), { code: 'ENOENT' });
  } finally {
    await removeDirectory(target);
  }
});
