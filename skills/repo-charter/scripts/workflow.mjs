import { readFile } from 'node:fs/promises';
import { resolveTargetDirectory } from '../../../src/filesystem/paths.js';
import { inspectRepository } from '../../../src/inspection/index.js';
import { generateSelectedAgentDocuments } from '../../../src/adapters/planning.js';
import { applyApprovedDocumentChanges, previewDocumentChanges, summarizeDocumentPreview } from '../../../src/generation/reconciliation.js';

async function jsonFile(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function preview(target, specification) {
  const inspection = await inspectRepository(target);
  const documents = generateSelectedAgentDocuments(specification, inspection);
  return previewDocumentChanges(target, documents);
}

export async function runWorkflow(argumentsList, cwd = process.cwd()) {
  const [operation, targetArgument, specificationPath, approvalsPath] = argumentsList;
  if (!['preview', 'apply'].includes(operation) || !targetArgument || !specificationPath || (operation === 'apply' && !approvalsPath)) {
    throw new Error('Usage: workflow.mjs <preview|apply> <target> <approved-spec.json> [approvals.json]');
  }
  const target = await resolveTargetDirectory(targetArgument, cwd);
  const specification = await jsonFile(specificationPath);
  const proposal = await preview(target, specification);
  if (operation === 'preview') {
    return { type: 'preview', preview: proposal, summary: summarizeDocumentPreview(proposal) };
  }
  const approvals = await jsonFile(approvalsPath);
  const application = await applyApprovedDocumentChanges(target, proposal, approvals);
  return { type: 'apply', summary: summarizeDocumentPreview(proposal), application };
}

try {
  const result = await runWorkflow(process.argv.slice(2));
  process.stdout.write(`${JSON.stringify(result)}\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
