import { redactValue } from '../inspection/redaction.js';
import { buildDecisionFrontier, missingDecisionIds } from './decision-tree.js';
import { isWorkspaceVisibility } from '../workspace-visibility.js';

function list(value) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') return value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
  return [];
}

function hasOverlap(left, right) {
  return left.some((item) => right.includes(item));
}

function isVague(value) {
  return typeof value === 'string' && /^(good|better|fast|secure|high quality|all users)$/i.test(value.trim());
}

export function detectDecisionIssues(decisions) {
  const issues = [];
  const mvp = list(decisions['mvp-boundary']);
  const exclusions = list(decisions.exclusions);
  if (hasOverlap(mvp, exclusions)) {
    issues.push({ severity: 'error', id: 'mvp-exclusion-conflict', message: 'An MVP capability is also listed as an exclusion.' });
  }
  for (const id of ['project-goal', 'mvp-boundary', 'quality-verification']) {
    if (isVague(decisions[id])) {
      issues.push({ severity: 'error', id: `vague-${id}`, message: `${id} is too vague to verify.` });
    }
  }
  if (list(decisions['future-scope']).length > 0 && !decisions['architecture-constraints']) {
    issues.push({ severity: 'error', id: 'future-scope-without-architecture', message: 'Future scope affects present architecture before architecture constraints are settled.' });
  }
  if (!isWorkspaceVisibility(decisions['workspace-visibility'])) {
    issues.push({ severity: 'error', id: 'invalid-workspace-visibility', message: 'workspace-visibility must be local-planning or shared-planning.' });
  }
  if (decisions.completionClaim && !decisions['quality-verification']) {
    issues.push({ severity: 'error', id: 'unverifiable-completion', message: 'A completion claim has no verification decision.' });
  }
  return issues;
}

export function createSharedUnderstanding({ evidence = [], decisions = {} }) {
  const missing = missingDecisionIds({ evidence, decisions });
  const issues = detectDecisionIssues(decisions);
  const frontier = buildDecisionFrontier({ evidence, decisions });
  return {
    schemaVersion: 1,
    settledDecisions: redactValue(decisions),
    missingDecisionIds: missing,
    issues,
    nextFrontier: frontier,
    readyForConfirmation: missing.length === 0 && !issues.some((issue) => issue.severity === 'error'),
    developerConfirmed: false,
  };
}

export function confirmSharedUnderstanding(sharedUnderstanding, developerApproval) {
  if (!sharedUnderstanding.readyForConfirmation) {
    throw new Error('Shared understanding is incomplete or contains unresolved contradictions.');
  }
  if (developerApproval !== true) {
    throw new Error('Developer confirmation must be explicit.');
  }
  return { ...sharedUnderstanding, developerConfirmed: true };
}
