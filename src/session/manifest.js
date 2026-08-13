import { readFile } from 'node:fs/promises';
import { writeFileAtomically } from '../filesystem/atomic.js';
import { PACKAGE_VERSION } from '../version.js';
import { redactSensitiveText } from '../inspection/redaction.js';
import { selectAgents } from './agents.js';
import { isWorkspaceVisibility } from '../workspace-visibility.js';

export const SESSION_PATH = '.repo-charter/manifest.json';
export const SESSION_SCHEMA_VERSION = 3;
export const SESSION_STAGES = Object.freeze([
  'inspected',
  'agents-selected',
  'handoff-ready',
  'decisions-confirmed',
  'changes-approved',
  'applied',
  'validated',
]);

const NEXT_STAGES = Object.freeze({
  inspected: ['agents-selected'],
  'agents-selected': ['handoff-ready'],
  'handoff-ready': ['decisions-confirmed'],
  'decisions-confirmed': ['changes-approved'],
  'changes-approved': ['applied'],
  applied: ['validated'],
  validated: [],
});
const MANIFEST_KEYS = new Set([
  'schemaVersion', 'packageVersion', 'stage', 'selectedAgents', 'workspaceVisibility',
  'confirmedDecisions', 'templateVersions', 'managedArtifacts', 'observedChecks',
  'repositorySnapshot', 'driftAnchor',
]);
const FORBIDDEN_KEY = /(?:raw.*(?:transcript|conversation)|(?:transcript|conversation)$|credential|token|secret|source(?:Body|Content))/i;

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function containsForbiddenKey(value) {
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, child]) => FORBIDDEN_KEY.test(key) || containsForbiddenKey(child));
}

function validateSnapshot(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.files)) {
    throw new Error('Session manifest is missing a safe repository snapshot.');
  }
  for (const file of snapshot.files) {
    if (typeof file.path !== 'string' || !file.freshness || typeof file.freshness.modifiedAt !== 'string' || !Number.isFinite(file.freshness.sizeBytes)) {
      throw new Error('Session manifest contains an invalid repository snapshot entry.');
    }
  }
}

export function createSessionManifest(selectedAgents, repositorySnapshot) {
  selectAgents(selectedAgents.primary, selectedAgents.secondary);
  validateSnapshot(repositorySnapshot);
  return {
    schemaVersion: SESSION_SCHEMA_VERSION,
    packageVersion: PACKAGE_VERSION,
    stage: 'handoff-ready',
    selectedAgents: {
      primary: selectedAgents.primary,
      secondary: [...selectedAgents.secondary],
    },
    workspaceVisibility: null,
    confirmedDecisions: {},
    templateVersions: {},
    managedArtifacts: {},
    observedChecks: [],
    repositorySnapshot,
    driftAnchor: null,
  };
}

export function validateSessionManifest(manifest) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('Session manifest must be a JSON object.');
  }
  for (const key of Object.keys(manifest)) {
    if (!MANIFEST_KEYS.has(key)) {
      throw new Error(`Session manifest contains an unsupported field: ${key}.`);
    }
  }
  if (manifest.schemaVersion !== SESSION_SCHEMA_VERSION || typeof manifest.packageVersion !== 'string') {
    throw new Error('Session manifest has an unsupported schema or package version.');
  }
  if (!SESSION_STAGES.includes(manifest.stage)) {
    throw new Error(`Session manifest has an invalid stage: ${manifest.stage}.`);
  }
  if (!manifest.selectedAgents || !Array.isArray(manifest.selectedAgents.secondary)) {
    throw new Error('Session manifest is missing selected agents.');
  }
  selectAgents(manifest.selectedAgents.primary, manifest.selectedAgents.secondary);
  if (manifest.workspaceVisibility !== null && !isWorkspaceVisibility(manifest.workspaceVisibility)) {
    throw new Error('Session manifest has an invalid workspace visibility.');
  }
  for (const key of ['confirmedDecisions', 'templateVersions', 'managedArtifacts']) {
    if (!manifest[key] || typeof manifest[key] !== 'object' || Array.isArray(manifest[key])) {
      throw new Error(`Session manifest is missing ${key}.`);
    }
  }
  if (!Array.isArray(manifest.observedChecks) || !manifest.observedChecks.every((check) => check && typeof check.command === 'string' && ['passed', 'failed', 'skipped'].includes(check.status) && ['static', 'approved-checks', 'full'].includes(check.verificationDepth) && (check.status === 'skipped' || Number.isInteger(check.exitCode)))) {
    throw new Error('Session manifest contains invalid observed checks.');
  }
  validateSnapshot(manifest.repositorySnapshot);
  if (manifest.driftAnchor !== null) {
    const anchor = manifest.driftAnchor;
    if (!anchor || typeof anchor !== 'object' || typeof anchor.reason !== 'string' || typeof anchor.snapshotDigest !== 'string' || typeof anchor.gitRevision !== 'string' && anchor.gitRevision !== null || !anchor.planningHashes || typeof anchor.planningHashes !== 'object') {
      throw new Error('Session manifest contains an invalid drift anchor.');
    }
    validateSnapshot(anchor.snapshot);
  }
  if (containsForbiddenKey(manifest)) {
    throw new Error('Session manifest contains forbidden transcript, credential, secret, token, or source-content data.');
  }
  return manifest;
}

function migrateSessionManifest(manifest) {
  if (manifest?.schemaVersion === 1 && !Object.hasOwn(manifest, 'workspaceVisibility')) {
    manifest = { ...manifest, schemaVersion: 2, workspaceVisibility: null };
  }
  if (manifest?.schemaVersion === 2) {
    return { ...manifest, schemaVersion: SESSION_SCHEMA_VERSION, driftAnchor: manifest.driftAnchor ?? null };
  }
  return manifest;
}

export async function readSessionManifest(targetPath) {
  let content;
  try {
    content = await readFile(`${targetPath}/.repo-charter/manifest.json`, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw new Error(`Cannot read session manifest: ${error.code ?? error.message}`);
  }

  try {
    return validateSessionManifest(migrateSessionManifest(JSON.parse(content)));
  } catch (error) {
    throw new Error(`Invalid session manifest: ${error.message}`);
  }
}

export async function writeSessionManifest(targetPath, manifest) {
  validateSessionManifest(manifest);
  await writeFileAtomically(targetPath, SESSION_PATH, stableJson(manifest));
}

export function setWorkspaceVisibility(manifest, workspaceVisibility) {
  validateSessionManifest(manifest);
  if (!isWorkspaceVisibility(workspaceVisibility)) {
    throw new Error('Workspace visibility must be local-planning or shared-planning.');
  }
  return { ...manifest, workspaceVisibility };
}

export function setDriftAnchor(manifest, driftAnchor) {
  validateSessionManifest(manifest);
  return validateSessionManifest({ ...manifest, driftAnchor });
}

export function recordObservedCheck(manifest, { command, exitCode, output = '', verificationDepth = 'approved-checks', skipped = false }) {
  validateSessionManifest(manifest);
  if (typeof command !== 'string' || command.length === 0 || !['static', 'approved-checks', 'full'].includes(verificationDepth)) {
    throw new Error('Observed check requires a command and supported verification depth.');
  }
  if (!skipped && !Number.isInteger(exitCode)) {
    throw new Error('Executed observed check requires an integer exit code.');
  }
  const check = skipped
    ? { command: redactSensitiveText(command), status: 'skipped', verificationDepth }
    : { command: redactSensitiveText(command), exitCode, status: exitCode === 0 ? 'passed' : 'failed', output: redactSensitiveText(output), verificationDepth };
  return { ...manifest, observedChecks: [...manifest.observedChecks, check] };
}

export function transitionSession(manifest, nextStage) {
  validateSessionManifest(manifest);
  if (!NEXT_STAGES[manifest.stage].includes(nextStage)) {
    throw new Error(`Invalid session transition: ${manifest.stage} -> ${nextStage}.`);
  }
  return { ...manifest, stage: nextStage };
}
