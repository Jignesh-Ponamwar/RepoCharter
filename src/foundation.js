import { lstat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { writeFileAtomically } from './filesystem/atomic.js';
import { resolveSafeChildPath } from './filesystem/paths.js';
import { createOwnershipDocument, verifyOwnershipDocument } from './ownership.js';

export const OWNERSHIP_PATH = '.repo-charter/ownership.json';

async function readIfPresent(filePath) {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}

export async function planFoundationInitialization(targetPath) {
  const ownershipPath = resolveSafeChildPath(targetPath, OWNERSHIP_PATH);
  const currentContent = await readIfPresent(ownershipPath);

  if (currentContent === undefined) {
    return {
      changes: [{ path: OWNERSHIP_PATH, status: 'create', content: createOwnershipDocument() }],
      conflicts: [],
    };
  }

  const verification = verifyOwnershipDocument(currentContent);
  if (!verification.valid) {
    return {
      changes: [],
      conflicts: [{ path: OWNERSHIP_PATH, reason: verification.reason }],
    };
  }

  return {
    changes: [{ path: OWNERSHIP_PATH, status: 'unchanged' }],
    conflicts: [],
  };
}

export async function applyFoundationPlan(targetPath, plan) {
  if (plan.conflicts.length > 0) {
    throw new Error(`Cannot initialize because ${plan.conflicts[0].path} is unsafe: ${plan.conflicts[0].reason}`);
  }

  for (const change of plan.changes) {
    if (change.status === 'create') {
      await writeFileAtomically(targetPath, change.path, change.content);
    }
  }
}

export async function checkFoundation(targetPath) {
  const ownershipDirectory = path.join(targetPath, '.repo-charter');
  const ownershipPath = path.join(targetPath, OWNERSHIP_PATH);
  let content;

  try {
    const directoryStats = await lstat(ownershipDirectory).catch((error) => {
      if (error.code === 'ENOENT') {
        return undefined;
      }
      throw error;
    });
    if (directoryStats && !directoryStats.isDirectory()) {
      return {
        valid: false,
        diagnostics: [{ severity: 'error', message: 'Foundation ownership directory is not a directory.' }],
      };
    }
    content = await readIfPresent(ownershipPath);
  } catch (error) {
    return {
      valid: false,
      diagnostics: [{ severity: 'error', message: `Cannot read foundation ownership state: ${error.code ?? error.message}` }],
    };
  }

  if (content === undefined) {
    return {
      valid: true,
      diagnostics: [{ severity: 'warning', message: 'Foundation ownership state is not initialized.' }],
    };
  }

  const verification = verifyOwnershipDocument(content);
  if (!verification.valid) {
    return {
      valid: false,
      diagnostics: [{ severity: 'error', message: verification.reason }],
    };
  }

  return { valid: true, diagnostics: [] };
}
