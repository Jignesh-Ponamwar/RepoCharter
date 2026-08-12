import { readFile } from 'node:fs/promises';
import { diagnoseAdapterCompatibility } from '../adapters/diagnostics.js';
import { expectedInstructionPaths } from '../adapters/planning.js';
import { OWNERSHIP_PATH } from '../foundation.js';
import { hashContent, verifyOwnershipDocument } from '../ownership.js';
import { managedIgnorePaths } from '../visibility/ignore.js';
import { getWorkspacePolicy } from '../visibility/policy.js';

async function readIfPresent(targetPath, relativePath) {
  try {
    return await readFile(`${targetPath}/${relativePath}`, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    return undefined;
  }
}

function diagnostic(severity, message, category) {
  return { severity, message, category };
}

function firstUncheckedTask(todo) {
  return todo?.match(/^- \[ \] \*\*(.+?)\*\*:/m)?.[1];
}

function validateDocumentContracts(files, session) {
  const diagnostics = [];
  const required = session && ['applied', 'validated'].includes(session.stage);
  const missingSeverity = required ? 'error' : 'warning';
  const requiredPaths = session?.workspaceVisibility === 'local-planning' ? ['AGENTS.md'] : ['AGENTS.md', 'PLAN.md', 'TODO.md'];
  for (const path of requiredPaths) {
    if (files[path] === undefined) diagnostics.push(diagnostic(missingSeverity, `Generated contract is missing: ${path}.`, 'documents'));
  }
  if (session?.workspaceVisibility === 'local-planning') {
    for (const path of ['PLAN.md', 'TODO.md']) {
      if (files[path] === undefined) diagnostics.push(diagnostic('warning', `Local planning artifact is absent: ${path}. Initialize or resume RepoCharter before scoped work.`, 'documents'));
    }
  }
  if (files['AGENTS.md']) {
    for (const marker of ['Required planning workflow', 'PLAN.md', 'TODO.md', 'Verification']) {
      if (!files['AGENTS.md'].includes(marker)) diagnostics.push(diagnostic('error', `AGENTS.md is missing required contract content: ${marker}.`, 'documents'));
    }
  }
  if (files['PLAN.md']) {
    for (const marker of ['## 1.', '## 2.', '## 7.', '## 8.']) {
      if (!files['PLAN.md'].includes(marker)) diagnostics.push(diagnostic('error', `PLAN.md is missing durable plan section ${marker}.`, 'documents'));
    }
  }
  if (files['TODO.md']) {
    if (!/^- \[[ x]\] \*\*.+?\*\*:/m.test(files['TODO.md'])) diagnostics.push(diagnostic('error', 'TODO.md has no implementation-grade task.', 'documents'));
    if (!/\*\*Phase gate: (?:PENDING|PASSED)/.test(files['TODO.md'])) diagnostics.push(diagnostic('error', 'TODO.md has no observable phase gate.', 'documents'));
  }
  return diagnostics;
}

function staleFactDiagnostics(files, inspection) {
  const diagnostics = [];
  const allDocuments = Object.values(files).filter(Boolean).join('\n');
  const observedCommands = new Set(inspection.commands.map((command) => command.command));
  for (const match of allDocuments.matchAll(/`((?:npm|pnpm|yarn|bun|pytest|python)\s+[^`\n]+)`/g)) {
    if (!observedCommands.has(match[1])) diagnostics.push(diagnostic('warning', `Documented command is not currently observed: ${match[1]}.`, 'stale-facts'));
  }
  const paths = new Set(inspection.snapshot.files.map((file) => file.path));
  for (const match of allDocuments.matchAll(/`((?:src|app|lib|packages|test|tests)\/[^`\s]+)`/g)) {
    if (!paths.has(match[1])) diagnostics.push(diagnostic('warning', `Documented repository path is not currently observed: ${match[1]}.`, 'stale-facts'));
  }
  return diagnostics;
}

async function ownershipDiagnostics(targetPath) {
  const content = await readIfPresent(targetPath, OWNERSHIP_PATH);
  if (!content) return [];
  const verified = verifyOwnershipDocument(content);
  if (!verified.valid) return [diagnostic('error', verified.reason, 'ownership')];
  const diagnostics = [];
  for (const artifact of verified.document.managedArtifacts) {
    const current = await readIfPresent(targetPath, artifact.path);
    if (current === undefined) diagnostics.push(diagnostic('error', `Managed artifact is missing: ${artifact.path}.`, 'ownership'));
    else if (hashContent(current) !== artifact.contentHash) diagnostics.push(diagnostic('error', `Managed artifact was modified: ${artifact.path}.`, 'ownership'));
  }
  return diagnostics;
}

async function visibilityDiagnostics(targetPath, session) {
  if (!session?.workspaceVisibility) return [diagnostic('warning', 'Workspace visibility is not confirmed yet.', 'visibility')];
  const policy = getWorkspacePolicy(session.workspaceVisibility, session.selectedAgents);
  const content = await readIfPresent(targetPath, '.gitignore');
  const managed = managedIgnorePaths(content);
  if (!managed) return [diagnostic('error', 'RepoCharter workspace-visibility ignore block is missing.', 'visibility')];
  const diagnostics = [];
  for (const path of policy.localArtifacts) {
    if (!managed.includes(path)) diagnostics.push(diagnostic('error', `Local artifact is missing managed ignore coverage: ${path}.`, 'visibility'));
  }
  for (const path of policy.publicArtifacts) {
    if (managed.includes(path)) diagnostics.push(diagnostic('error', `Public artifact is incorrectly ignored by the managed block: ${path}.`, 'visibility'));
  }
  return diagnostics;
}

async function packageVisibilityDiagnostics(targetPath, session) {
  if (session?.workspaceVisibility !== 'local-planning') return [];
  const content = await readIfPresent(targetPath, 'package.json');
  if (!content) return [];
  try {
    const manifest = JSON.parse(content);
    if (!Array.isArray(manifest.files)) return [];
    const policy = getWorkspacePolicy(session.workspaceVisibility, session.selectedAgents);
    const included = policy.localArtifacts.filter((path) => manifest.files.includes(path) || manifest.files.includes(path.replace(/\/$/, '')) || manifest.files.includes('**'));
    return included.map((path) => diagnostic('warning', `package.json files allowlist may publish local artifact: ${path}.`, 'visibility'));
  } catch {
    return [diagnostic('warning', 'package.json could not be parsed for local artifact publication risks.', 'visibility')];
  }
}

async function adapterDiagnostics(targetPath, inspection, session) {
  if (!session || (!['applied', 'validated'].includes(session.stage) && !inspection.repository.agentSurfaces.some((surface) => surface.path === 'AGENTS.md'))) return [];
  const files = {};
  const expected = expectedInstructionPaths(session.selectedAgents);
  const paths = new Set(['AGENTS.md', ...expected.values(), ...inspection.repository.agentSurfaces.map((surface) => surface.path)]);
  for (const path of paths) {
    const content = await readIfPresent(targetPath, path);
    if (content !== undefined) files[path] = content;
  }
  return diagnoseAdapterCompatibility(session.selectedAgents, files).diagnostics.map((item) => ({
    severity: item.severity,
    message: item.message,
    category: 'adapters',
    status: item.status,
  }));
}

function observedCheckDiagnostics(session) {
  if (!session) return [];
  return session.observedChecks.flatMap((check) => {
    if (check.status === 'failed') return [diagnostic('error', `Approved check failed: ${check.command} (exit ${check.exitCode}).`, 'checks')];
    if (check.status === 'skipped') return [diagnostic('warning', `Approved check was skipped: ${check.command}.`, 'checks')];
    return [];
  });
}

export async function validateRepositorySetup(targetPath, inspection, session) {
  const files = Object.fromEntries(await Promise.all(['AGENTS.md', 'PLAN.md', 'TODO.md'].map(async (path) => [path, await readIfPresent(targetPath, path)])));
  const diagnostics = [
    ...await ownershipDiagnostics(targetPath),
    ...await visibilityDiagnostics(targetPath, session),
    ...await packageVisibilityDiagnostics(targetPath, session),
    ...await adapterDiagnostics(targetPath, inspection, session),
    ...validateDocumentContracts(files, session),
    ...staleFactDiagnostics(files, inspection),
    ...observedCheckDiagnostics(session),
  ];
  const artifacts = Object.entries(files).map(([path, content]) => ({ path, status: content === undefined ? 'missing' : 'unchanged' }));
  return {
    diagnostics,
    report: {
      artifacts,
      observedChecks: session?.observedChecks ?? [],
      blockers: diagnostics.filter((item) => item.severity === 'error').map((item) => item.message),
      warnings: diagnostics.filter((item) => item.severity === 'warning').map((item) => item.message),
      nextTask: firstUncheckedTask(files['TODO.md']),
    },
  };
}
