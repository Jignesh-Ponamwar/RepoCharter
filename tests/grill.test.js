import assert from 'node:assert/strict';
import test from 'node:test';
import { buildDecisionFrontier, formatFrontierQuestions } from '../src/grill/decision-tree.js';
import { confirmSharedUnderstanding, createSharedUnderstanding, detectDecisionIssues } from '../src/grill/shared-understanding.js';
import { createApprovedSpecification, serializeApprovedSpecification } from '../src/grill/specification.js';

const observedEvidence = [{ fact: 'language', value: 'JavaScript', classification: 'observed' }];

function completeDecisions() {
  return {
    'workspace-visibility': 'local-planning',
    'project-goal': 'Help employees submit and resolve internal support requests.',
    'users-outcomes': 'Employees submit requests; agents resolve requests; admins manage assignments.',
    'current-pain': 'Requests are currently lost in unstructured chat channels.',
    'mvp-boundary': 'Submit, assign, and resolve a support request.',
    exclusions: 'Email notifications, organization-wide policy management.',
    'core-workflows': 'Create request, assign request, change status, and view authorized history.',
    'domain-rules': 'Only authorized roles may change assignment or status; events are append-only.',
    'architecture-constraints': 'Use the existing web stack and keep authorization server authoritative.',
    'data-security-privacy': 'Restrict request visibility by role and avoid logging request descriptions.',
    integrations: 'Use the existing identity provider; defer notification integrations.',
    'operations-deployment': 'Run migrations separately before deployment and expose a safe health check.',
    'quality-verification': 'Run authorization, workflow, migration, and browser checks before release.',
    'future-scope': 'Future team workflows require stable authorization and audit boundaries now.',
    'risks-dependencies': 'Identity-provider availability and migration rehearsal are release dependencies.',
    'assumptions-open-questions': 'Identity subjects are stable; no unresolved blocker remains.',
  };
}

test('decision frontier asks every unblocked decision in rounds and skips observed repository facts', () => {
  const initial = buildDecisionFrontier({ evidence: observedEvidence, decisions: {} });
  assert.deepEqual(initial.map((question) => question.id), ['workspace-visibility', 'project-goal']);

  const afterGoal = buildDecisionFrontier({
    evidence: observedEvidence,
    decisions: { 'project-goal': 'Give employees a reliable support workflow.' },
  });
  assert.deepEqual(afterGoal.map((question) => question.id), ['workspace-visibility', 'users-outcomes', 'current-pain']);
  const formatted = formatFrontierQuestions(afterGoal);
  assert.match(formatted, /❓ \*\*Q1\*\* - \*\*Planning workspace visibility\*\*/);
  assert.match(formatted, /➡️/);
});

test('greenfield and existing-undocumented evaluations ask only the applicable frontier', () => {
  const greenfield = buildDecisionFrontier({ evidence: [], decisions: {} });
  assert.deepEqual(greenfield.map((question) => question.id), ['workspace-visibility', 'current-project-state', 'project-goal']);

  const existingUndocumented = buildDecisionFrontier({
    evidence: [{ fact: 'repository-boundary', value: 'src', classification: 'observed' }],
    decisions: {},
  });
  assert.deepEqual(existingUndocumented.map((question) => question.id), ['workspace-visibility', 'project-goal']);
});

test('conflicting-documentation and future-scope evaluations prevent premature shared understanding', () => {
  const conflictingDocumentation = {
    ...completeDecisions(),
    exclusions: 'Submit, assign, and resolve a support request.',
  };
  const conflictIssues = detectDecisionIssues(conflictingDocumentation);
  assert.ok(conflictIssues.some((issue) => issue.id === 'mvp-exclusion-conflict'));

  const futureWithoutArchitecture = { ...completeDecisions(), 'architecture-constraints': undefined };
  const futureIssues = detectDecisionIssues(futureWithoutArchitecture);
  assert.ok(futureIssues.some((issue) => issue.id === 'future-scope-without-architecture'));

  const premature = createSharedUnderstanding({ evidence: observedEvidence, decisions: { 'project-goal': 'good' } });
  assert.equal(premature.readyForConfirmation, false);
  assert.throws(() => confirmSharedUnderstanding(premature, true), /incomplete or contains unresolved contradictions/);
});

test('shared understanding requires explicit approval and produces a safe approved specification', () => {
  const shared = createSharedUnderstanding({ evidence: observedEvidence, decisions: completeDecisions() });
  assert.equal(shared.readyForConfirmation, true);
  assert.throws(() => confirmSharedUnderstanding(shared, false), /explicit/);

  const confirmed = confirmSharedUnderstanding(shared, true);
  const specification = createApprovedSpecification({
    sharedUnderstanding: confirmed,
    selectedAgents: { primary: 'codex', secondary: ['claude-code'] },
    workspaceVisibility: 'local-planning',
    verificationDepth: 'approved-checks',
    proposedArtifacts: [
      { path: 'AGENTS.md', action: 'create' },
      { path: 'PLAN.md', action: 'reconcile' },
    ],
    conflictDecisions: { 'PLAN.md': 'ask-developer' },
    developerApproval: true,
  });

  assert.equal(specification.developerApproval, true);
  assert.equal(specification.verificationDepth, 'approved-checks');
  assert.equal(specification.workspaceVisibility, 'local-planning');
  assert.match(serializeApprovedSpecification(specification), /"schemaVersion": 2/);
});

test('approved specifications reject transcript-bearing decisions and unapproved input', () => {
  const unsafeShared = {
    ...confirmSharedUnderstanding(createSharedUnderstanding({ evidence: observedEvidence, decisions: completeDecisions() }), true),
    settledDecisions: { ...completeDecisions(), rawTranscript: 'developer said everything in a long chat' },
  };

  const input = {
    sharedUnderstanding: unsafeShared,
    selectedAgents: { primary: 'codex', secondary: [] },
    workspaceVisibility: 'local-planning',
    verificationDepth: 'static',
    proposedArtifacts: [],
    conflictDecisions: {},
    developerApproval: true,
  };
  assert.throws(() => createApprovedSpecification(input), /forbidden field: rawTranscript/);
  assert.throws(() => createApprovedSpecification({ ...input, workspaceVisibility: 'shared-planning' }), /must match the confirmed/);
  assert.throws(() => createApprovedSpecification({ ...input, workspaceVisibility: 'unknown' }), /requires workspaceVisibility/);
  assert.throws(() => createApprovedSpecification({ ...input, sharedUnderstanding: { ...unsafeShared, developerConfirmed: false } }), /requires explicit developer confirmation/);
});
