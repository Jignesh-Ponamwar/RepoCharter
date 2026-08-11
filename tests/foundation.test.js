import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { run, parseArguments } from '../src/cli.js';
import { writeFileAtomically } from '../src/filesystem/atomic.js';
import { normalizePathForPlatform } from '../src/filesystem/paths.js';
import { OWNERSHIP_PATH } from '../src/foundation.js';
import { verifyOwnershipDocument } from '../src/ownership.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const gitCommand = process.platform === 'win32' ? 'git.exe' : 'git';

async function temporaryDirectory(prefix = 'repo-charter-test-') {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

async function removeDirectory(directory) {
  await rm(directory, { recursive: true, force: true });
}

function runProcess(command, argumentsList, options = {}) {
  const result = spawnSync(command, argumentsList, {
    cwd: options.cwd,
    encoding: 'utf8',
    env: { ...process.env, ...options.env },
    shell: process.platform === 'win32',
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

test('argument parsing accepts the documented init surface and rejects invalid combinations', () => {
  assert.deepEqual(parseArguments(['init', 'repo', '--dry-run', '--primary-agent', 'codex', '--agents', 'claude-code,cursor', '--json', '--non-interactive']), {
    command: 'init',
    target: 'repo',
    dryRun: true,
    json: true,
    nonInteractive: true,
    primaryAgent: 'codex',
    agents: ['claude-code', 'cursor'],
  });
  assert.throws(() => parseArguments(['check', '--dry-run']), /only valid with init/);
  assert.throws(() => parseArguments(['init', '--agents', 'cursor']), /requires --primary-agent/);
  assert.throws(() => parseArguments(['init', '--primary-agent', 'Cursor']), /lowercase agent identifier/);
  assert.throws(() => parseArguments(['unknown']), /Unknown command/);
});

test('dry run previews ownership initialization without creating files', async () => {
  const target = await temporaryDirectory();

  try {
    const result = await run(['init', '--dry-run', '--primary-agent', 'codex'], target);
    assert.equal(result.exitCode, 0);
    assert.deepEqual(result.output.changes, [
      { path: OWNERSHIP_PATH, status: 'create' },
      { path: '.repo-charter/manifest.json', status: 'create' },
    ]);
    await assert.rejects(readFile(path.join(target, OWNERSHIP_PATH), 'utf8'), { code: 'ENOENT' });
    await assert.rejects(readFile(path.join(target, '.repo-charter/manifest.json'), 'utf8'), { code: 'ENOENT' });
  } finally {
    await removeDirectory(target);
  }
});

test('foundation init is idempotent and preserves an existing project file', async () => {
  const target = await temporaryDirectory();
  const fixturePath = path.join(packageRoot, 'tests', 'fixtures', 'existing-file');

  try {
    await cp(fixturePath, target, { recursive: true });
    const first = await run(['init', '--primary-agent', 'codex'], target);
    assert.equal(first.exitCode, 0);
    assert.deepEqual(first.output.changes, [
      { path: OWNERSHIP_PATH, status: 'create' },
      { path: '.repo-charter/manifest.json', status: 'create' },
    ]);

    const ownershipContent = await readFile(path.join(target, OWNERSHIP_PATH), 'utf8');
    assert.equal(verifyOwnershipDocument(ownershipContent).valid, true);
    assert.equal(await readFile(path.join(target, 'README.md'), 'utf8'), '# Existing project file\n\nThis fixture must be preserved by foundation initialization.\n');

    const second = await run(['init'], target);
    assert.equal(second.exitCode, 0);
    assert.deepEqual(second.output.changes, [
      { path: OWNERSHIP_PATH, status: 'unchanged' },
      { path: '.repo-charter/manifest.json', status: 'unchanged' },
    ]);
    assert.equal(await readFile(path.join(target, OWNERSHIP_PATH), 'utf8'), ownershipContent);
  } finally {
    await removeDirectory(target);
  }
});

test('check never writes and reports invalid ownership metadata', async () => {
  const target = await temporaryDirectory();

  try {
    const emptyCheck = await run(['check'], target);
    assert.equal(emptyCheck.exitCode, 0);
    assert.equal(emptyCheck.output.diagnostics[0].severity, 'warning');

    await writeFile(path.join(target, '.repo-charter'), 'not a directory');
    const invalidCheck = await run(['check'], target);
    assert.equal(invalidCheck.exitCode, 1);
    assert.equal(invalidCheck.output.diagnostics[0].severity, 'error');
  } finally {
    await removeDirectory(target);
  }
});

test('init preserves a conflicting existing ownership file', async () => {
  const target = await temporaryDirectory();
  const ownershipDirectory = path.join(target, '.repo-charter');
  const ownershipFile = path.join(target, OWNERSHIP_PATH);

  try {
    await mkdir(ownershipDirectory);
    await writeFile(ownershipFile, 'project-owned content\n');
    await assert.rejects(run(['init', '--primary-agent', 'codex'], target), /Initialization blocked/);
    assert.equal(await readFile(ownershipFile, 'utf8'), 'project-owned content\n');
  } finally {
    await removeDirectory(target);
  }
});

test('target resolution rejects missing paths and files', async () => {
  const target = await temporaryDirectory();

  try {
    await assert.rejects(run(['init', 'missing'], target), /does not exist/);
    await writeFile(path.join(target, 'file.txt'), 'not a directory');
    await assert.rejects(run(['init', 'file.txt'], target), /must be a directory/);
  } finally {
    await removeDirectory(target);
  }
});

test('path normalization remains explicit for Windows and POSIX inputs', () => {
  assert.equal(normalizePathForPlatform('project/../target', '/workspace', 'linux'), '/workspace/target');
  assert.equal(normalizePathForPlatform('project\\..\\target', 'C:\\workspace', 'win32'), 'C:\\workspace\\target');
});

test('atomic writes preserve originals and clean staged files after failure', async () => {
  const target = await temporaryDirectory();

  try {
    await writeFile(path.join(target, 'contract.txt'), 'original');
    await assert.rejects(
      writeFileAtomically(target, 'contract.txt', 'replacement', { failAfterStage: true }),
      /Simulated atomic write failure/,
    );
    assert.equal(await readFile(path.join(target, 'contract.txt'), 'utf8'), 'original');
    assert.deepEqual((await readdir(target)).filter((name) => name.includes('.repo-charter-')), []);
  } finally {
    await removeDirectory(target);
  }
});

test('initialization preserves an existing dirty Git worktree', async (context) => {
  if (spawnSync(gitCommand, ['--version']).status !== 0) {
    context.skip('Git is unavailable in this environment.');
    return;
  }

  const target = await temporaryDirectory();

  try {
    runProcess(gitCommand, ['init'], { cwd: target });
    runProcess(gitCommand, ['config', 'user.email', 'fixture@example.com'], { cwd: target });
    runProcess(gitCommand, ['config', 'user.name', 'Fixture'], { cwd: target });
    await writeFile(path.join(target, 'README.md'), 'clean\n');
    runProcess(gitCommand, ['add', 'README.md'], { cwd: target });
    runProcess(gitCommand, ['commit', '-m', 'fixture'], { cwd: target });
    await writeFile(path.join(target, 'README.md'), 'dirty\n');

    const dirtyDiff = runProcess(gitCommand, ['diff', '--', 'README.md'], { cwd: target }).stdout;
    await run(['init', '--primary-agent', 'codex'], target);
    assert.equal(runProcess(gitCommand, ['diff', '--', 'README.md'], { cwd: target }).stdout, dirtyDiff);
    assert.equal(await readFile(path.join(target, 'README.md'), 'utf8'), 'dirty\n');
    assert.match(runProcess(gitCommand, ['status', '--short'], { cwd: target }).stdout, /\?\? \.repo-charter\//);
  } finally {
    await removeDirectory(target);
  }
});

test('resume rejects a target without a persisted session', async () => {
  const target = await temporaryDirectory();

  try {
    await assert.rejects(run(['resume'], target), /No resumable setup session exists/);
  } finally {
    await removeDirectory(target);
  }
});

test('packed artifact installs in isolation and runs help, dry run, and base initialization', async () => {
  const workspace = await temporaryDirectory('repo-charter-pack-');
  const packageDirectory = path.join(workspace, 'package');
  const targetDirectory = path.join(workspace, 'target');

  try {
    await cp(packageRoot, packageDirectory, {
      recursive: true,
      filter: (source) => !source.includes(`${path.sep}node_modules${path.sep}`),
    });
    const packed = runProcess(npmCommand, ['pack', '--json', '--pack-destination', workspace], { cwd: packageDirectory });
    assert.equal(packed.status, 0, packed.stderr);
    const tarball = path.join(workspace, JSON.parse(packed.stdout)[0].filename);

    await writeFile(path.join(workspace, 'package.json'), '{"private":true}\n');
    const installed = runProcess(npmCommand, ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarball], { cwd: workspace });
    assert.equal(installed.status, 0, installed.stderr);

    const binary = path.join(workspace, 'node_modules', '.bin', process.platform === 'win32' ? 'repo-charter.cmd' : 'repo-charter');
    const help = runProcess(binary, ['--help'], { cwd: workspace });
    assert.equal(help.status, 0, help.stderr);
    assert.match(help.stdout, /Usage: repo-charter/);

    await mkdir(targetDirectory);
    const dryRun = runProcess(binary, ['init', targetDirectory, '--dry-run', '--primary-agent', 'codex'], { cwd: workspace });
    assert.equal(dryRun.status, 0, dryRun.stderr);
    await assert.rejects(readFile(path.join(targetDirectory, OWNERSHIP_PATH), 'utf8'), { code: 'ENOENT' });

    const initialized = runProcess(binary, ['init', targetDirectory, '--primary-agent', 'codex'], { cwd: workspace });
    assert.equal(initialized.status, 0, initialized.stderr);
    assert.equal(verifyOwnershipDocument(await readFile(path.join(targetDirectory, OWNERSHIP_PATH), 'utf8')).valid, true);
  } finally {
    await removeDirectory(workspace);
  }
});
