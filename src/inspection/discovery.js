import { open, readdir, readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';

export const DEFAULT_MAX_FILES = 1000;
export const DEFAULT_MAX_FILE_BYTES = 256 * 1024;

const HARD_EXCLUDED_DIRECTORIES = new Set([
  '.git', '.repo-charter', 'node_modules', 'vendor', '.venv', 'venv', '__pycache__',
  '.cache', '.next', '.nuxt', '.output', 'coverage', 'dist', 'build', 'out', 'target',
  'secrets', 'private',
]);
const HARD_EXCLUDED_FILE_NAMES = new Set(['.env', 'id_rsa', 'id_dsa', 'id_ecdsa', 'id_ed25519', 'credentials', 'credentials.json']);
const HARD_EXCLUDED_EXTENSIONS = new Set(['.pem', '.key', '.p12', '.pfx', '.kdbx']);

function repoPath(value) {
  return value.split(path.sep).join('/');
}

function globExpression(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped.replaceAll('**', '.*').replaceAll('*', '[^/]*').replaceAll('?', '[^/]')}$`);
}

function parseIgnoreFile(content, basePath) {
  return content.split(/\r?\n/).flatMap((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return [];
    }

    const negated = trimmed.startsWith('!');
    const rawPattern = negated ? trimmed.slice(1) : trimmed;
    const directoryOnly = rawPattern.endsWith('/');
    const pattern = rawPattern.replace(/^\//, '').replace(/\/$/, '');
    if (!pattern) {
      return [];
    }

    return [{
      basePath,
      negated,
      directoryOnly,
      hasSlash: pattern.includes('/'),
      expression: globExpression(pattern),
    }];
  });
}

function matchesIgnoreRule(rule, relativePath, isDirectory) {
  if (rule.directoryOnly && !isDirectory) {
    return false;
  }

  if (!relativePath.startsWith(rule.basePath)) {
    return false;
  }

  const localPath = relativePath.slice(rule.basePath.length).replace(/^\//, '');
  if (!localPath) {
    return false;
  }

  if (rule.hasSlash) {
    return rule.expression.test(localPath);
  }

  return localPath.split('/').some((segment) => rule.expression.test(segment));
}

function isIgnored(rules, relativePath, isDirectory) {
  let ignored = false;
  for (const rule of rules) {
    if (matchesIgnoreRule(rule, relativePath, isDirectory)) {
      ignored = !rule.negated;
    }
  }
  return ignored;
}

function hardExclusion(relativePath, isDirectory) {
  const name = path.basename(relativePath);
  const normalized = repoPath(relativePath);

  if (isDirectory && HARD_EXCLUDED_DIRECTORIES.has(name)) {
    return 'hard-excluded-directory';
  }

  if (!isDirectory) {
    if (HARD_EXCLUDED_FILE_NAMES.has(name) || (name.startsWith('.env.') && name !== '.env.example')) {
      return 'hard-excluded-sensitive-file';
    }
    if (HARD_EXCLUDED_EXTENSIONS.has(path.extname(name).toLowerCase()) || /(?:secret|credential|private[_-]?key)/i.test(normalized)) {
      return 'hard-excluded-sensitive-file';
    }
  }

  return undefined;
}

function matchesPathList(relativePath, patterns) {
  return patterns.some((pattern) => globExpression(pattern.replace(/^\//, '')).test(relativePath));
}

async function readTextIfSafe(absolutePath, fileStats, maxFileBytes) {
  if (fileStats.size > maxFileBytes) {
    return { skipped: 'file-too-large' };
  }

  const handle = await open(absolutePath, 'r');
  try {
    const buffer = Buffer.alloc(Math.min(fileStats.size, 8192));
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    if (buffer.subarray(0, bytesRead).includes(0)) {
      return { skipped: 'binary-file' };
    }
  } finally {
    await handle.close();
  }

  return { content: await readFile(absolutePath, 'utf8') };
}

function sourceMetadata(relativePath, fileStats) {
  return {
    path: repoPath(relativePath),
    freshness: {
      modifiedAt: fileStats.mtime.toISOString(),
      sizeBytes: fileStats.size,
    },
  };
}

export async function discoverFiles(rootPath, options = {}) {
  const rootRealPath = await realpath(rootPath);
  const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;
  const maxFileBytes = options.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES;
  const includePaths = options.includePaths ?? [];
  const excludePaths = options.excludePaths ?? [];
  const files = [];
  const skipped = [];
  let ignoreRules = [];
  let fileLimitReached = false;

  async function addIgnoreFile(absolutePath, relativePath) {
    try {
      const content = await readFile(absolutePath, 'utf8');
      const parentPath = path.dirname(relativePath);
      ignoreRules = [...ignoreRules, ...parseIgnoreFile(content, parentPath === '.' ? '' : repoPath(parentPath))];
    } catch {
      skipped.push({ path: repoPath(relativePath), reason: 'unreadable-ignore-file' });
    }
  }

  async function walk(directoryPath, relativeDirectory) {
    if (fileLimitReached) {
      return;
    }

    const entries = await readdir(directoryPath, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      if (fileLimitReached) {
        return;
      }

      const relativePath = relativeDirectory ? path.join(relativeDirectory, entry.name) : entry.name;
      const normalizedPath = repoPath(relativePath);
      const absolutePath = path.join(directoryPath, entry.name);
      const exclusion = hardExclusion(relativePath, entry.isDirectory());

      if (exclusion) {
        skipped.push({ path: normalizedPath, reason: exclusion });
        continue;
      }
      if (matchesPathList(normalizedPath, excludePaths)) {
        skipped.push({ path: normalizedPath, reason: 'configured-exclusion' });
        continue;
      }
      if (isIgnored(ignoreRules, normalizedPath, entry.isDirectory())) {
        skipped.push({ path: normalizedPath, reason: 'gitignore' });
        continue;
      }

      if (entry.isDirectory()) {
        await walk(absolutePath, relativePath);
        continue;
      }
      if (!entry.isFile()) {
        skipped.push({ path: normalizedPath, reason: 'non-regular-file' });
        continue;
      }
      if (includePaths.length > 0 && !matchesPathList(normalizedPath, includePaths)) {
        skipped.push({ path: normalizedPath, reason: 'outside-configured-inclusion' });
        continue;
      }
      if (files.length >= maxFiles) {
        skipped.push({ path: normalizedPath, reason: 'file-count-limit' });
        fileLimitReached = true;
        return;
      }

      const fileStats = await stat(absolutePath);
      const text = await readTextIfSafe(absolutePath, fileStats, maxFileBytes);
      if (text.skipped) {
        skipped.push({ path: normalizedPath, reason: text.skipped });
        continue;
      }

      files.push({
        path: normalizedPath,
        absolutePath,
        content: text.content,
        source: sourceMetadata(relativePath, fileStats),
      });

      if (entry.name === '.gitignore') {
        await addIgnoreFile(absolutePath, relativePath);
      }
    }
  }

  await walk(rootRealPath, '');
  return { files, skipped, limits: { maxFiles, maxFileBytes } };
}
