import { lstat } from 'node:fs/promises';
import path from 'node:path';
import { createEvidence, createUnknownEvidence, EVIDENCE_CLASSIFICATION } from './evidence.js';
import { discoverFiles } from './discovery.js';
import { redactSensitiveText } from './redaction.js';

const EXTENSION_LANGUAGES = {
  '.c': 'C', '.cpp': 'C++', '.cs': 'C#', '.go': 'Go', '.java': 'Java', '.js': 'JavaScript',
  '.jsx': 'JavaScript', '.kt': 'Kotlin', '.mjs': 'JavaScript', '.php': 'PHP', '.py': 'Python',
  '.rb': 'Ruby', '.rs': 'Rust', '.swift': 'Swift', '.ts': 'TypeScript', '.tsx': 'TypeScript',
};
const FRAMEWORK_PACKAGES = {
  '@angular/core': 'Angular', '@sveltejs/kit': 'SvelteKit', 'next': 'Next.js', 'nuxt': 'Nuxt',
  'react': 'React', 'vue': 'Vue', 'express': 'Express', 'fastify': 'Fastify',
};
const LOCKFILE_MANAGERS = {
  'bun.lockb': 'bun', 'npm-shrinkwrap.json': 'npm', 'package-lock.json': 'npm',
  'pnpm-lock.yaml': 'pnpm', 'yarn.lock': 'yarn',
};

function findFile(files, filePath) {
  return files.find((file) => file.path === filePath);
}

function sourceForPath(files, filePath) {
  return findFile(files, filePath)?.source ?? { path: filePath, freshness: { modifiedAt: null, sizeBytes: 0 } };
}

function parseJson(file) {
  try {
    return JSON.parse(file.content);
  } catch {
    return undefined;
  }
}

function commandFor(packageManager, scriptName) {
  if (packageManager === 'pnpm') return `pnpm ${scriptName}`;
  if (packageManager === 'yarn') return `yarn ${scriptName}`;
  if (packageManager === 'bun') return `bun run ${scriptName}`;
  return `npm run ${scriptName}`;
}

function installCommandFor(packageManager) {
  if (packageManager === 'pnpm') return 'pnpm install';
  if (packageManager === 'yarn') return 'yarn install';
  if (packageManager === 'bun') return 'bun install';
  return 'npm install';
}

function commandKind(scriptName) {
  if (/^(dev|start)$/i.test(scriptName)) return 'development';
  if (/lint/i.test(scriptName)) return 'lint';
  if (/type.?check|types/i.test(scriptName)) return 'type-check';
  if (/test|spec/i.test(scriptName)) return 'test';
  if (/build/i.test(scriptName)) return 'build';
  if (/migrat|seed/i.test(scriptName)) return 'migration';
  if (/deploy|release/i.test(scriptName)) return 'deployment';
  return 'script';
}

function addCommand(commands, details) {
  const command = { ...details, command: redactSensitiveText(details.command) };
  if (!commands.some((existing) => existing.kind === command.kind && existing.command === command.command && existing.source === command.source)) {
    commands.push(command);
  }
}

function addEvidence(collection, seen, details) {
  const evidence = createEvidence(details);
  const key = JSON.stringify([evidence.fact, evidence.value, evidence.source.path]);
  if (!seen.has(key)) {
    seen.add(key);
    collection.push(evidence);
  }
}

function detectAgentSurface(filePath) {
  if (filePath === 'AGENTS.md') return 'AGENTS.md';
  if (filePath === 'CLAUDE.md' || filePath === '.claude/CLAUDE.md') return 'Claude Code';
  if (filePath === 'GEMINI.md') return 'Gemini CLI';
  if (filePath === '.github/copilot-instructions.md') return 'GitHub Copilot';
  if (filePath.startsWith('.claude/rules/')) return 'Claude Code rule';
  if (filePath.startsWith('.cursor/rules/')) return 'Cursor rule';
  if (filePath.startsWith('.windsurf/rules/') || filePath.startsWith('.devin/rules/')) return 'Windsurf rule';
  return undefined;
}

function directoryEvidence(files, prefixes, fact, evidence, seen) {
  for (const prefix of prefixes) {
    const match = files.find((file) => file.path === prefix || file.path.startsWith(`${prefix}/`));
    if (match) {
      addEvidence(evidence, seen, { fact, value: prefix, source: match.source, evidenceType: 'repository-layout', confidence: 'medium' });
    }
  }
}

export async function inspectAffectedPaths(rootPath, paths) {
  return inspectRepository(rootPath, { includePaths: paths });
}

export async function inspectRepository(rootPath, options = {}) {
  const discovery = await discoverFiles(rootPath, options);
  const { files } = discovery;
  const evidence = [];
  const seenEvidence = new Set();
  const commands = [];
  const agentSurfaces = [];
  const paths = files.map((file) => file.path);
  const pathSet = new Set(paths);
  let packageManager = 'npm';
  for (const [lockfile, manager] of Object.entries(LOCKFILE_MANAGERS)) {
    if (pathSet.has(lockfile)) {
      packageManager = manager;
      break;
    }
  }

  const packageFile = findFile(files, 'package.json');
  if (packageFile) {
    const manifest = parseJson(packageFile);
    if (manifest) {
      addEvidence(evidence, seenEvidence, { fact: 'language', value: 'JavaScript', source: packageFile.source, evidenceType: 'package-manifest', confidence: 'high' });
      if (manifest.engines?.node) {
        addEvidence(evidence, seenEvidence, { fact: 'runtime.node', value: manifest.engines.node, source: packageFile.source, evidenceType: 'package-manifest', confidence: 'high' });
      }
      if (typeof manifest.packageManager === 'string') {
        packageManager = manifest.packageManager.split('@')[0];
        addEvidence(evidence, seenEvidence, { fact: 'package-manager', value: packageManager, source: packageFile.source, evidenceType: 'package-manifest', confidence: 'high' });
      }
      const dependencies = { ...manifest.dependencies, ...manifest.devDependencies };
      for (const [dependency, framework] of Object.entries(FRAMEWORK_PACKAGES)) {
        if (dependencies[dependency]) {
          addEvidence(evidence, seenEvidence, { fact: 'framework', value: framework, source: packageFile.source, evidenceType: 'package-manifest', confidence: 'high' });
        }
      }
      if (manifest.workspaces) {
        addEvidence(evidence, seenEvidence, { fact: 'repository-structure', value: 'JavaScript workspace', source: packageFile.source, evidenceType: 'package-manifest', confidence: 'high' });
      }
      addCommand(commands, {
        kind: 'install',
        command: installCommandFor(packageManager),
        source: packageFile.source.path,
        classification: EVIDENCE_CLASSIFICATION.OBSERVED,
        confidence: 'medium',
      });
      for (const scriptName of Object.keys(manifest.scripts ?? {}).sort()) {
        addCommand(commands, {
          kind: commandKind(scriptName),
          command: commandFor(packageManager, scriptName),
          source: packageFile.source.path,
          classification: EVIDENCE_CLASSIFICATION.OBSERVED,
          confidence: 'high',
        });
      }
    } else {
      addEvidence(evidence, seenEvidence, { fact: 'package-manifest', value: 'package.json could not be parsed', source: packageFile.source, evidenceType: 'parse-error', confidence: 'low' });
    }
  }

  for (const [lockfile, manager] of Object.entries(LOCKFILE_MANAGERS)) {
    if (pathSet.has(lockfile)) {
      packageManager = packageManager === 'npm' ? manager : packageManager;
      addEvidence(evidence, seenEvidence, { fact: 'package-manager', value: manager, source: sourceForPath(files, lockfile), evidenceType: 'lockfile', confidence: 'high' });
    }
  }

  if (pathSet.has('pyproject.toml') || pathSet.has('requirements.txt') || pathSet.has('Pipfile')) {
    const pythonSource = sourceForPath(files, pathSet.has('pyproject.toml') ? 'pyproject.toml' : pathSet.has('requirements.txt') ? 'requirements.txt' : 'Pipfile');
    addEvidence(evidence, seenEvidence, { fact: 'language', value: 'Python', source: pythonSource, evidenceType: 'language-manifest', confidence: 'high' });
  }
  if (pathSet.has('pnpm-workspace.yaml') || pathSet.has('lerna.json')) {
    const workspacePath = pathSet.has('pnpm-workspace.yaml') ? 'pnpm-workspace.yaml' : 'lerna.json';
    addEvidence(evidence, seenEvidence, { fact: 'repository-structure', value: 'monorepo workspace', source: sourceForPath(files, workspacePath), evidenceType: 'workspace-config', confidence: 'high' });
  }
  if (pathSet.has('tsconfig.json')) {
    addEvidence(evidence, seenEvidence, { fact: 'language', value: 'TypeScript', source: sourceForPath(files, 'tsconfig.json'), evidenceType: 'compiler-config', confidence: 'high' });
  }

  for (const file of files) {
    const language = EXTENSION_LANGUAGES[path.extname(file.path).toLowerCase()];
    if (language) {
      addEvidence(evidence, seenEvidence, { fact: 'language', value: language, source: file.source, evidenceType: 'source-extension', confidence: 'medium' });
    }
    if (/\b(?:schema\.(?:prisma|sql)|schema\.json)$/i.test(file.path)) {
      addEvidence(evidence, seenEvidence, { fact: 'schema', value: file.path, source: file.source, evidenceType: 'data-schema', confidence: 'high' });
    }
    if (/(?:^|\/)migrations?(?:\/|$)/i.test(file.path)) {
      addEvidence(evidence, seenEvidence, { fact: 'migration', value: file.path, source: file.source, evidenceType: 'migration', confidence: 'high' });
    }
    if (/health/i.test(path.basename(file.path))) {
      addEvidence(evidence, seenEvidence, { fact: 'health-check', value: file.path, source: file.source, evidenceType: 'operations-config', confidence: 'medium' });
    }
    const agent = detectAgentSurface(file.path);
    if (agent) {
      agentSurfaces.push({ agent, path: file.path, ownership: 'unknown' });
      addEvidence(evidence, seenEvidence, { fact: 'agent-instruction-surface', value: agent, source: file.source, evidenceType: 'instruction-file', confidence: 'high' });
    }
  }

  for (const file of files) {
    if (file.path.startsWith('.github/workflows/')) {
      for (const match of file.content.matchAll(/^\s*(?:-\s*)?run:\s*(.+)$/gm)) {
        addCommand(commands, {
          kind: 'ci',
          command: match[1].trim(),
          source: file.source.path,
          classification: EVIDENCE_CLASSIFICATION.OBSERVED,
          confidence: 'medium',
        });
      }
    } else if (file.path === 'Dockerfile' || file.path.endsWith('/Dockerfile')) {
      for (const match of file.content.matchAll(/^\s*(?:RUN|CMD)\s+(.+)$/gmi)) {
        addCommand(commands, {
          kind: 'container',
          command: match[1].trim(),
          source: file.source.path,
          classification: EVIDENCE_CLASSIFICATION.OBSERVED,
          confidence: 'medium',
        });
      }
    } else if (/^(README|CONTRIBUTING|DEVELOPMENT)\.md$/i.test(path.basename(file.path))) {
      for (const match of file.content.matchAll(/^\s*[$#]?\s*((?:npm|pnpm|yarn|bun|pytest|python)\s+[^\r\n]+)$/gm)) {
        addCommand(commands, {
          kind: 'documented',
          command: match[1].trim(),
          source: file.source.path,
          classification: EVIDENCE_CLASSIFICATION.OBSERVED,
          confidence: 'low',
        });
      }
    }
  }

  directoryEvidence(files, ['src', 'app', 'lib', 'packages'], 'repository-boundary', evidence, seenEvidence);
  directoryEvidence(files, ['test', 'tests', '__tests__', 'e2e'], 'test-boundary', evidence, seenEvidence);
  directoryEvidence(files, ['prisma', 'migrations', 'db'], 'data-boundary', evidence, seenEvidence);
  directoryEvidence(files, ['.github/workflows'], 'ci-boundary', evidence, seenEvidence);
  if (pathSet.has('Dockerfile') || pathSet.has('docker-compose.yml') || pathSet.has('docker-compose.yaml')) {
    const containerPath = pathSet.has('Dockerfile') ? 'Dockerfile' : pathSet.has('docker-compose.yml') ? 'docker-compose.yml' : 'docker-compose.yaml';
    addEvidence(evidence, seenEvidence, { fact: 'operations', value: 'container configuration', source: sourceForPath(files, containerPath), evidenceType: 'operations-config', confidence: 'high' });
  }
  for (const deploymentPath of ['vercel.json', 'netlify.toml', 'fly.toml', 'k8s', 'helm']) {
    const deploymentFile = files.find((file) => file.path === deploymentPath || file.path.startsWith(`${deploymentPath}/`));
    if (deploymentFile) {
      addEvidence(evidence, seenEvidence, { fact: 'operations', value: 'deployment configuration', source: deploymentFile.source, evidenceType: 'operations-config', confidence: 'medium' });
    }
  }
  for (const documentPath of ['README.md', 'PLAN.md', 'TODO.md', 'ARCHITECTURE.md', 'DECISIONS.md']) {
    if (pathSet.has(documentPath)) {
      addEvidence(evidence, seenEvidence, { fact: 'project-document', value: documentPath, source: sourceForPath(files, documentPath), evidenceType: 'documentation', confidence: 'high' });
    }
  }

  try {
    const ownershipStats = await lstat(path.join(rootPath, '.repo-charter', 'ownership.json'));
    addEvidence(evidence, seenEvidence, { fact: 'managed-ownership-state', value: 'present', source: { path: '.repo-charter/ownership.json', freshness: { modifiedAt: ownershipStats.mtime.toISOString(), sizeBytes: ownershipStats.size } }, evidenceType: 'managed-marker', confidence: 'high' });
  } catch {
    // Absence is not an inspection error; Phase 1 ownership state is optional.
  }

  try {
    const gitStats = await lstat(path.join(rootPath, '.git'));
    if (gitStats) {
      addEvidence(evidence, seenEvidence, { fact: 'git-repository', value: 'present', source: { path: '.git', freshness: { modifiedAt: gitStats.mtime.toISOString(), sizeBytes: gitStats.size } }, evidenceType: 'repository-metadata', confidence: 'high' });
      evidence.push(createUnknownEvidence('git-worktree-state', 'Static inspection does not execute Git commands.'));
    }
  } catch {
    evidence.push(createUnknownEvidence('git-repository', 'No Git metadata was observed.'));
  }

  evidence.sort((left, right) => `${left.fact}:${left.source.path}`.localeCompare(`${right.fact}:${right.source.path}`));
  commands.sort((left, right) => `${left.kind}:${left.command}`.localeCompare(`${right.kind}:${right.command}`));
  agentSurfaces.sort((left, right) => left.path.localeCompare(right.path));
  discovery.skipped.sort((left, right) => `${left.path}:${left.reason}`.localeCompare(`${right.path}:${right.reason}`));

  return {
    schemaVersion: 1,
    target: rootPath,
    evidence,
    commands,
    repository: {
      sourcePaths: paths.filter((filePath) => /^(src|app|lib|packages)\//.test(filePath)),
      testPaths: paths.filter((filePath) => /^(test|tests|__tests__|e2e)\//.test(filePath)),
      agentSurfaces,
    },
    skipped: discovery.skipped,
    limits: discovery.limits,
    snapshot: {
      files: files.map((file) => ({ path: file.source.path, freshness: file.source.freshness })),
    },
  };
}
