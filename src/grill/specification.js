import { redactSensitiveText } from '../inspection/redaction.js';
import { PACKAGE_VERSION } from '../version.js';

const FORBIDDEN_KEY = /(?:transcript|conversation|credential|token|secret|source(?:Body|Content))/i;
const VERIFICATION_DEPTHS = new Set(['static', 'approved-checks', 'full']);
const ARTIFACT_ACTIONS = new Set(['create', 'reconcile', 'unchanged', 'skip']);

function assertSafeValue(value) {
  if (typeof value === 'string' && redactSensitiveText(value) !== value) {
    throw new Error('Approved specification contains a sensitive value.');
  }
  if (Array.isArray(value)) value.forEach(assertSafeValue);
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (FORBIDDEN_KEY.test(key)) {
        throw new Error(`Approved specification contains forbidden field: ${key}.`);
      }
      assertSafeValue(child);
    }
  }
}

export function createApprovedSpecification({ sharedUnderstanding, selectedAgents, verificationDepth, proposedArtifacts, conflictDecisions, developerApproval }) {
  if (!sharedUnderstanding?.developerConfirmed || developerApproval !== true) {
    throw new Error('An approved specification requires explicit developer confirmation of shared understanding.');
  }
  if (!selectedAgents?.primary || !Array.isArray(selectedAgents.secondary)) {
    throw new Error('Approved specification requires selected agents.');
  }
  if (!VERIFICATION_DEPTHS.has(verificationDepth)) {
    throw new Error('Approved specification has an unsupported verification depth.');
  }
  if (!Array.isArray(proposedArtifacts) || !proposedArtifacts.every((artifact) => typeof artifact.path === 'string' && ARTIFACT_ACTIONS.has(artifact.action))) {
    throw new Error('Approved specification contains invalid proposed artifacts.');
  }
  if (!conflictDecisions || typeof conflictDecisions !== 'object' || Array.isArray(conflictDecisions)) {
    throw new Error('Approved specification requires conflict decisions.');
  }

  const specification = {
    schemaVersion: 1,
    packageVersion: PACKAGE_VERSION,
    selectedAgents: { primary: selectedAgents.primary, secondary: [...selectedAgents.secondary] },
    confirmedDecisions: sharedUnderstanding.settledDecisions,
    verificationDepth,
    proposedArtifacts,
    conflictDecisions,
    developerApproval: true,
  };
  assertSafeValue(specification);
  return specification;
}

export function serializeApprovedSpecification(specification) {
  assertSafeValue(specification);
  return `${JSON.stringify(specification, null, 2)}\n`;
}
