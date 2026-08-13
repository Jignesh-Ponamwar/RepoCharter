import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { inspectAffectedPaths } from '../inspection/index.js';
import { changedSnapshotPaths } from '../session/snapshot.js';

const execFileAsync = promisify(execFile);
const PLANNING_FACTS = new Set([
  'project-document', 'managed-ownership-state', 'operations', 'database-schema',
  'migration', 'agent-instruction', 'ci-configuration', 'container-configuration',
]);

function digest(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

async function documentHashes(targetPath) {
  const hashes = {};
  for (const path of ['PLAN.md', 'TODO.md']) {
    try {
      hashes[path] = createHash('sha256').update(await readFile(`${targetPath}/${path}`)).digest('hex');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return hashes;
}

export async function createDriftAnchor(targetPath, snapshot, reason = 'approved-application', gitRevision = null) {
  return {
    reason,
    snapshot,
    snapshotDigest: digest(snapshot.files),
    planningHashes: await documentHashes(targetPath),
    gitRevision,
  };
}

export function classifyDriftPath(path, inspection) {
  const known = inspection.snapshot.files.some((file) => file.path === path);
  if (!known) return 'unknown';
  const evidence = inspection.evidence.filter((item) => item.source.path === path);
  const commandSource = inspection.commands.some((command) => command.source === path);
  return commandSource || evidence.some((item) => PLANNING_FACTS.has(item.fact))
    ? 'planning-relevant'
    : 'ordinary';
}

export async function currentGitRevision(targetPath) {
  try {
    const { stdout } = await execFileAsync('git', ['-C', targetPath, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
    return stdout.trim();
  } catch {
    return null;
  }
}

async function gitObservation(targetPath, anchor) {
  try {
    const { stdout: revision } = await execFileAsync('git', ['-C', targetPath, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
    const { stdout: porcelain } = await execFileAsync('git', ['-C', targetPath, 'status', '--porcelain'], { encoding: 'utf8' });
    const uncommitted = porcelain.split('\n').filter(Boolean).map((line) => line.slice(3));
    const untracked = porcelain.split('\n').filter((line) => line.startsWith('?? ')).map((line) => line.slice(3));
    let committed = [];
    let anchorReachable = true;
    if (anchor.gitRevision) {
      try {
        await execFileAsync('git', ['-C', targetPath, 'cat-file', '-e', `${anchor.gitRevision}^{commit}`], { encoding: 'utf8' });
        const result = await execFileAsync('git', ['-C', targetPath, 'diff', '--name-only', `${anchor.gitRevision}..HEAD`], { encoding: 'utf8' });
        committed = result.stdout.split('\n').filter(Boolean);
      } catch {
        anchorReachable = false;
      }
    }
    return { repository: 'git', revision: revision.trim(), uncommitted, untracked, committed, anchorReachable };
  } catch {
    return { repository: 'non-git', uncommitted: [], untracked: [], committed: [], anchorReachable: true };
  }
}

export async function driftReport(targetPath, inspection, anchor) {
  if (!anchor) {
    return { status: 'anchor-unavailable', changedPaths: [], classifications: [], git: { repository: 'unknown' }, message: 'No approved drift anchor is available.' };
  }
  const snapshotPaths = changedSnapshotPaths(anchor.snapshot, inspection.snapshot);
  const hashes = await documentHashes(targetPath);
  const hashPaths = [...new Set([...Object.keys(anchor.planningHashes), ...Object.keys(hashes)])]
    .filter((path) => anchor.planningHashes[path] !== hashes[path]);
  const git = await gitObservation(targetPath, anchor);
  const changedPaths = [...new Set([...snapshotPaths, ...hashPaths, ...git.committed, ...git.uncommitted, ...git.untracked])].sort();
  const safePaths = changedPaths.filter((path) => inspection.snapshot.files.some((file) => file.path === path));
  const affectedInspection = safePaths.length > 0 ? await inspectAffectedPaths(targetPath, safePaths) : inspection;
  const classifications = changedPaths.map((path) => ({ path, classification: classifyDriftPath(path, affectedInspection) }));
  const reviewRequired = classifications.some((item) => item.classification !== 'ordinary');
  const status = !git.anchorReachable ? 'anchor-unavailable'
    : changedPaths.length === 0 ? 'in-sync'
      : reviewRequired ? 'review-required' : 'drift-detected';
  return { status, changedPaths, classifications, git, message: status === 'review-required' ? 'Planning-relevant drift requires developer review before reconciliation.' : undefined };
}
