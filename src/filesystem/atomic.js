import { randomUUID } from 'node:crypto';
import { rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ensureSafeParentDirectory, resolveSafeChildPath } from './paths.js';

export async function writeFileAtomically(rootPath, relativePath, content, options = {}) {
  const targetPath = resolveSafeChildPath(rootPath, relativePath);
  await ensureSafeParentDirectory(rootPath, targetPath);

  const temporaryPath = path.join(
    path.dirname(targetPath),
    `.${path.basename(targetPath)}.repo-charter-${randomUUID()}.tmp`,
  );

  try {
    await writeFile(temporaryPath, content, { encoding: 'utf8', flag: 'wx', flush: true });
    await ensureSafeParentDirectory(rootPath, targetPath);

    if (options.failAfterStage) {
      throw new Error('Simulated atomic write failure after staging.');
    }

    await rename(temporaryPath, targetPath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}
