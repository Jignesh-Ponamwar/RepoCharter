import { lstat, mkdir, realpath } from 'node:fs/promises';
import path from 'node:path';

export function normalizePathForPlatform(input, basePath, platform) {
  const pathApi = platform === 'win32' ? path.win32 : path.posix;
  return pathApi.resolve(basePath, input);
}

export function isPathInside(rootPath, candidatePath) {
  const relativePath = path.relative(rootPath, candidatePath);
  return relativePath === '' || (!relativePath.startsWith(`..${path.sep}`)
    && relativePath !== '..' && !path.isAbsolute(relativePath));
}

export async function resolveTargetDirectory(input = '.', cwd = process.cwd()) {
  const targetPath = path.resolve(cwd, input);
  let targetStats;

  try {
    targetStats = await lstat(targetPath);
  } catch {
    throw new Error(`Target directory does not exist: ${targetPath}`);
  }

  if (!targetStats.isDirectory()) {
    throw new Error(`Target must be a directory: ${targetPath}`);
  }

  return realpath(targetPath);
}

export function resolveSafeChildPath(rootPath, relativePath) {
  if (!relativePath || path.isAbsolute(relativePath)) {
    throw new Error('Managed file paths must be non-empty and relative.');
  }

  const targetPath = path.resolve(rootPath, relativePath);
  if (!isPathInside(rootPath, targetPath) || targetPath === rootPath) {
    throw new Error(`Managed path escapes the target directory: ${relativePath}`);
  }

  return targetPath;
}

async function nearestExistingAncestor(directory) {
  let current = directory;

  while (true) {
    try {
      await lstat(current);
      return current;
    } catch {
      const parent = path.dirname(current);
      if (parent === current) {
        throw new Error(`No existing ancestor for managed path: ${directory}`);
      }
      current = parent;
    }
  }
}

export async function ensureSafeParentDirectory(rootPath, targetPath) {
  const rootRealPath = await realpath(rootPath);
  if (!isPathInside(rootRealPath, targetPath)) {
    throw new Error(`Managed path escapes the target directory: ${targetPath}`);
  }

  const parentPath = path.dirname(targetPath);
  const existingAncestor = await nearestExistingAncestor(parentPath);
  const ancestorRealPath = await realpath(existingAncestor);
  if (!isPathInside(rootRealPath, ancestorRealPath)) {
    throw new Error(`Managed path resolves outside the target directory: ${targetPath}`);
  }

  await mkdir(parentPath, { recursive: true });
  const parentRealPath = await realpath(parentPath);
  if (!isPathInside(rootRealPath, parentRealPath)) {
    throw new Error(`Managed path resolves outside the target directory: ${targetPath}`);
  }
}
