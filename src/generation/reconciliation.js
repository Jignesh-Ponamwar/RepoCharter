import { lstat, readFile } from 'node:fs/promises';
import { writeFileAtomically } from '../filesystem/atomic.js';
import { resolveSafeChildPath } from '../filesystem/paths.js';
import { createManagedArtifact, createOwnershipDocument, hashContent, verifyOwnershipDocument } from '../ownership.js';
import { OWNERSHIP_PATH } from '../foundation.js';
import { reconcileIgnoreContent } from '../visibility/ignore.js';
import { getWorkspacePolicy } from '../visibility/policy.js';

const SAFE_STATUSES = new Set(['missing', 'owned-current']);
const CONFLICT_STATUSES = new Set(['owned-modified', 'merge-required']);

async function currentArtifact(targetPath, relativePath) {
  const absolutePath = resolveSafeChildPath(targetPath, relativePath);
  try {
    const stats = await lstat(absolutePath);
    if (!stats.isFile()) return { status: 'blocked', reason: 'Target exists but is not a regular file.' };
    return { status: 'present', content: await readFile(absolutePath, 'utf8') };
  } catch (error) {
    if (error.code === 'ENOENT') return { status: 'missing' };
    return { status: 'blocked', reason: `Cannot inspect target: ${error.code ?? error.message}` };
  }
}

async function ownershipState(targetPath) {
  const current = await currentArtifact(targetPath, OWNERSHIP_PATH);
  if (current.status === 'missing') return { artifacts: [], content: undefined };
  if (current.status !== 'present') return { error: current.reason };
  const verification = verifyOwnershipDocument(current.content);
  if (!verification.valid) return { error: verification.reason };
  return { artifacts: verification.document.managedArtifacts, content: current.content };
}

function classify(generated, current, managed) {
  if (current.status === 'blocked') {
    return { path: generated.path, status: 'blocked', reason: current.reason, permittedActions: [] };
  }
  if (current.status === 'missing') {
    return { path: generated.path, status: 'missing', reason: 'No target file exists.', permittedActions: ['approve-safe-create'] };
  }
  if (managed) {
    if (hashContent(current.content) === managed.contentHash) {
      return {
        path: generated.path,
        status: 'owned-current',
        reason: current.content === generated.content ? 'Owned artifact already matches the generated document.' : 'Owned artifact is unchanged since RepoCharter recorded it.',
        permittedActions: current.content === generated.content ? ['unchanged'] : ['approve-safe-update'],
      };
    }
    return { path: generated.path, status: 'owned-modified', reason: 'RepoCharter-owned artifact was edited after generation.', permittedActions: ['preserve', 'reconcile'] };
  }
  if (current.content === generated.content) {
    return { path: generated.path, status: 'compatible-existing', reason: 'Project-owned artifact already matches the proposed document.', permittedActions: ['preserve'] };
  }
  return { path: generated.path, status: 'merge-required', reason: 'Project-owned non-empty artifact differs from the proposed document.', permittedActions: ['preserve', 'reconcile'] };
}

export async function previewDocumentChanges(targetPath, generatedDocuments) {
  const ownership = await ownershipState(targetPath);
  const changes = [];
  for (const generated of generatedDocuments) {
    const current = await currentArtifact(targetPath, generated.path);
    const managed = ownership.artifacts?.find((artifact) => artifact.path === generated.path);
    const classified = classify(generated, current, managed);
    changes.push({ ...classified, content: generated.content, templateVersion: generated.templateVersion, visibility: generated.visibility ?? 'unmanaged' });
  }

  const metadata = generatedDocuments[0];
  if (metadata?.workspaceVisibility && metadata.selectedAgents) {
    const policy = getWorkspacePolicy(metadata.workspaceVisibility, metadata.selectedAgents);
    for (const path of ['.gitignore', '.npmignore']) {
      const current = await currentArtifact(targetPath, path);
      if (path === '.npmignore' && current.status === 'missing') continue;
      if (current.status === 'blocked') {
        changes.push({ path, status: 'blocked', reason: current.reason, permittedActions: [], visibility: 'public' });
        continue;
      }
      const ignored = reconcileIgnoreContent(current.status === 'present' ? current.content : undefined, policy.localArtifacts);
      if (ignored.status === 'blocked') {
        changes.push({ path, status: 'blocked', reason: ignored.reason, permittedActions: [], visibility: 'public' });
        continue;
      }
      const generated = { path, content: ignored.content, templateVersion: 1 };
      const managed = ownership.artifacts?.find((artifact) => artifact.path === path);
      const classified = classify(generated, current, managed);
      changes.push({ ...classified, content: ignored.content, templateVersion: 1, visibility: 'public', kind: 'ignore-policy' });
    }
  }
  if (ownership.error) {
    changes.push({ path: OWNERSHIP_PATH, status: 'blocked', reason: `Ownership state is invalid: ${ownership.error}`, permittedActions: [] });
  }
  return { changes, ownership };
}

function approvalFor(approvals, path) {
  return approvals.artifacts?.[path];
}

export function summarizeDocumentPreview(preview) {
  const changes = preview.changes.map(({ path, status, reason, permittedActions, visibility }) => ({
    path, status, reason, permittedActions, visibility,
  }));
  return {
    changes,
    requiresPerFileDecision: changes.some((change) => CONFLICT_STATUSES.has(change.status)),
    blocked: changes.filter((change) => change.status === 'blocked').map((change) => change.path),
  };
}

export function formatDocumentPreview(preview) {
  return summarizeDocumentPreview(preview).changes
    .map((change) => `${change.status}: ${change.path} (${change.visibility ?? 'unmanaged'}) — ${change.reason}`)
    .join('\n');
}

export async function applyApprovedDocumentChanges(targetPath, preview, approvals = {}) {
  const results = [];
  const ownership = preview.ownership;
  if (ownership.error) {
    return { results: preview.changes.map((change) => ({ path: change.path, status: change.status, reason: change.reason })), ownershipChanged: false };
  }

  const managed = new Map(ownership.artifacts.map((artifact) => [artifact.path, artifact]));
  for (const change of preview.changes) {
    if (change.path === OWNERSHIP_PATH) continue;
    if (change.status === 'blocked' || change.status === 'compatible-existing') {
      results.push({ path: change.path, status: change.status === 'compatible-existing' ? 'unchanged' : 'blocked', reason: change.reason });
      continue;
    }
    if (change.status === 'owned-current' && change.permittedActions.includes('unchanged')) {
      results.push({ path: change.path, status: 'unchanged', reason: change.reason });
      continue;
    }

    let content;
    let owned = false;
    if (SAFE_STATUSES.has(change.status)) {
      if (approvals.approveSafe !== true) {
        results.push({ path: change.path, status: 'pending-approval', reason: 'Safe change was not approved.' });
        continue;
      }
      content = change.content;
      owned = true;
    } else if (CONFLICT_STATUSES.has(change.status)) {
      const approval = approvalFor(approvals, change.path);
      if (!approval) {
        results.push({ path: change.path, status: 'pending-approval', reason: 'A conflict requires an explicit per-file decision.' });
        continue;
      }
      if (approval.action === 'preserve') {
        results.push({ path: change.path, status: 'preserved', reason: 'Existing project content was preserved.' });
        continue;
      }
      if (approval.action !== 'reconcile' || typeof approval.content !== 'string' || approval.content.length === 0) {
        results.push({ path: change.path, status: 'pending-approval', reason: 'A conflict requires explicit preserve or reconciled content.' });
        continue;
      }
      content = approval.content;
      owned = change.status === 'owned-modified' && approval.takeOwnership === true;
    }

    await writeFileAtomically(targetPath, change.path, content);
    if (owned) {
      managed.set(change.path, createManagedArtifact(change.path, content, change.templateVersion));
    }
    results.push({ path: change.path, status: change.status === 'missing' ? 'created' : 'modified' });
  }

  const nextOwnership = createOwnershipDocument([...managed.values()].sort((left, right) => left.path.localeCompare(right.path)));
  const ownershipChanged = ownership.content !== nextOwnership;
  if (ownershipChanged) await writeFileAtomically(targetPath, OWNERSHIP_PATH, nextOwnership);
  return { results, ownershipChanged };
}
