import { readFile } from 'node:fs/promises';
import { inspectRepository } from './inspection/index.js';
import { generateSelectedAgentDocuments } from './adapters/planning.js';
import { applyApprovedDocumentChanges, previewDocumentChanges, summarizeDocumentPreview } from './generation/reconciliation.js';
import { createDriftAnchor } from './drift/index.js';
import { readSessionManifest, setDriftAnchor, setWorkspaceVisibility, writeSessionManifest } from './session/manifest.js';

async function jsonFile(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

export async function runWorkflow(target, operation, specificationPath, approvalsPath) {
  const specification = await jsonFile(specificationPath);
  const inspection = await inspectRepository(target);
  const proposal = await previewDocumentChanges(target, generateSelectedAgentDocuments(specification, inspection));
  if (operation === 'preview') return { type: 'preview', preview: proposal, summary: summarizeDocumentPreview(proposal) };
  const approvals = await jsonFile(approvalsPath);
  const application = await applyApprovedDocumentChanges(target, proposal, approvals);
  const session = await readSessionManifest(target);
  if (session) {
    const current = await inspectRepository(target);
    const visible = setWorkspaceVisibility(session, specification.workspaceVisibility);
    await writeSessionManifest(target, setDriftAnchor(visible, await createDriftAnchor(target, current.snapshot)));
  }
  return { type: 'apply', summary: summarizeDocumentPreview(proposal), application, drift: { status: 'reconciled' } };
}
