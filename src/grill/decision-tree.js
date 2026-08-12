const DECISIONS = Object.freeze([
  {
    id: 'workspace-visibility',
    title: 'Planning workspace visibility',
    dependsOn: [],
    question: 'Should RepoCharter keep the active plan, task ledger, selected agent adapters, and selected rules local to this clone, or commit them for every developer and agent who clones the repository?',
    recommendation: 'Choose `local-planning` to keep active planning and agent configuration private, or `shared-planning` to commit shared planning documents and selected adapters. `.repo-charter/`, credentials, secret-bearing environment files, and machine-specific state stay local in both modes.',
  },
  {
    id: 'current-project-state',
    title: 'Current project state',
    dependsOn: [],
    skipWhenEvidence: true,
    question: 'What current product or delivery pain should this setup address beyond the repository facts already observed?',
    recommendation: 'Describe the pain in terms of developer or agent outcomes, not a guessed technical cause.',
  },
  {
    id: 'project-goal',
    title: 'Project goal',
    dependsOn: [],
    question: 'What is the product trying to achieve, for whom, and what outcome makes the first release valuable?',
    recommendation: 'State one primary user, one concrete outcome, and one measurable success signal.',
  },
  {
    id: 'users-outcomes',
    title: 'Users and outcomes',
    dependsOn: ['project-goal'],
    question: 'Which user roles matter in the first release, and what must each be able to accomplish?',
    recommendation: 'Name only roles that change permissions, workflow, or success criteria.',
  },
  {
    id: 'current-pain',
    title: 'Current pain',
    dependsOn: ['project-goal'],
    question: 'What currently fails, costs time, or creates risk, and how will the proposed work improve it?',
    recommendation: 'Prioritize the highest-cost pain instead of listing every possible improvement.',
  },
  {
    id: 'mvp-boundary',
    title: 'MVP boundary',
    dependsOn: ['users-outcomes'],
    question: 'What capability is required for the first useful release, and what is explicitly outside that boundary?',
    recommendation: 'Choose the smallest end-to-end workflow that proves product value.',
  },
  {
    id: 'exclusions',
    title: 'Explicit exclusions',
    dependsOn: ['mvp-boundary'],
    question: 'Which tempting features, integrations, automations, or user groups must not be built now?',
    recommendation: 'Record exclusions that prevent likely scope creep or affect architecture decisions.',
  },
  {
    id: 'core-workflows',
    title: 'Core workflows',
    dependsOn: ['mvp-boundary'],
    question: 'What are the critical user and system workflows, including their successful and rejected paths?',
    recommendation: 'Describe state changes and ownership boundaries before selecting implementation details.',
  },
  {
    id: 'domain-rules',
    title: 'Domain rules',
    dependsOn: ['core-workflows'],
    question: 'Which business terms, invariants, transitions, or permissions must always remain true?',
    recommendation: 'Write rules that can be tested or enforced, not general product aspirations.',
  },
  {
    id: 'architecture-constraints',
    title: 'Architecture constraints',
    dependsOn: ['mvp-boundary'],
    question: 'Which architectural boundaries, technology constraints, or existing-system limits are approved?',
    recommendation: 'Preserve observed repository facts; decide only constraints that evidence cannot safely establish.',
  },
  {
    id: 'data-security-privacy',
    title: 'Data, security, and privacy',
    dependsOn: ['core-workflows'],
    question: 'What data is stored or processed, who may access it, and what security or privacy rules apply?',
    recommendation: 'Identify authorization boundaries and protected data before choosing storage or UI details.',
  },
  {
    id: 'integrations',
    title: 'Integrations',
    dependsOn: ['core-workflows'],
    question: 'Which external systems are required, optional, deferred, or prohibited for this release?',
    recommendation: 'Treat each integration as a dependency with an owner, failure mode, and approval boundary.',
  },
  {
    id: 'operations-deployment',
    title: 'Operations and deployment',
    dependsOn: ['architecture-constraints'],
    question: 'What runtime, deployment, monitoring, migration, and recovery expectations apply?',
    recommendation: 'Decide only operational requirements that affect the current architecture or release gate.',
  },
  {
    id: 'quality-verification',
    title: 'Quality and verification',
    dependsOn: ['core-workflows'],
    question: 'What checks prove the critical workflows, authorization, and release claims are correct?',
    recommendation: 'Prefer observable gates with named checks over a vague request to test everything.',
  },
  {
    id: 'future-scope',
    title: 'Future scope with present impact',
    dependsOn: ['architecture-constraints'],
    question: 'Which future requirements genuinely change an architecture decision that must be made now?',
    recommendation: 'Record only future scope that affects a present boundary; defer speculative ideas.',
  },
  {
    id: 'risks-dependencies',
    title: 'Risks and dependencies',
    dependsOn: ['future-scope', 'operations-deployment', 'quality-verification'],
    question: 'What risks, external dependencies, or blocked decisions could prevent the planned outcome?',
    recommendation: 'Name the owner, trigger, and mitigation or explicit unblock condition for each material risk.',
  },
  {
    id: 'assumptions-open-questions',
    title: 'Assumptions and open questions',
    dependsOn: ['risks-dependencies'],
    question: 'Which assumptions were made, what remains unknown, and which unanswered items block implementation?',
    recommendation: 'Keep unknowns visible; do not convert an unanswered question into an implicit decision.',
  },
]);

function hasObservedProjectFacts(evidence) {
  return evidence.some((item) => item.classification === 'observed'
    && ['language', 'framework', 'repository-boundary', 'project-document', 'package-manager'].includes(item.fact));
}

function isSettled(decisions, id) {
  return Object.hasOwn(decisions, id) && decisions[id] !== undefined && decisions[id] !== null;
}

function isApplicable(node, evidence) {
  return !node.skipWhenEvidence || !hasObservedProjectFacts(evidence);
}

export function decisionTree() {
  return DECISIONS;
}

export function buildDecisionFrontier({ evidence = [], decisions = {} }) {
  return DECISIONS.filter((node) => isApplicable(node, evidence))
    .filter((node) => !isSettled(decisions, node.id))
    .filter((node) => node.dependsOn.every((dependency) => isSettled(decisions, dependency)))
    .map((node) => ({
      id: node.id,
      title: node.title,
      question: node.question,
      recommendation: node.recommendation,
    }));
}

export function missingDecisionIds({ evidence = [], decisions = {} }) {
  return DECISIONS.filter((node) => isApplicable(node, evidence))
    .filter((node) => !isSettled(decisions, node.id))
    .map((node) => node.id);
}

export function formatFrontierQuestions(frontier) {
  return frontier.map((node, index) => `❓ **Q${index + 1}** - **${node.title}**: ${node.question}\n\n➡️ ${node.recommendation}`).join('\n\n');
}
