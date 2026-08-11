export const DOCUMENT_TEMPLATE_VERSION = 1;

function lines(...values) {
  return values.flatMap((value) => Array.isArray(value) ? value : [value]);
}

function value(decisions, id, fallback = 'Not yet confirmed.') {
  const result = decisions[id];
  if (Array.isArray(result)) return result.join(', ');
  return typeof result === 'string' && result.trim() ? result.trim() : fallback;
}

function observed(inspection, fact) {
  return inspection.evidence
    .filter((item) => item.classification === 'observed' && item.fact === fact)
    .map((item) => item.value)
    .filter((item, index, values) => values.indexOf(item) === index);
}

function evidenceList(inspection, fact, fallback) {
  const values = observed(inspection, fact);
  return values.length > 0 ? values.join(', ') : fallback;
}

function commandLines(inspection) {
  const commands = inspection.commands.filter((command) => command.classification === 'observed');
  if (commands.length === 0) return ['- No verified project commands were observed. Do not invent commands.'];
  return commands.map((command) => `- \`${command.command}\` — observed ${command.kind} command (${command.source}).`);
}

function evidencePaths(inspection, fact) {
  const values = observed(inspection, fact);
  return values.length > 0 ? values.map((item) => `- \`${item}\``) : ['- No matching path was observed.'];
}

export function generateAgentsDocument(specification, inspection) {
  const decisions = specification.confirmedDecisions;
  const selectedAgents = specification.selectedAgents
    ? [specification.selectedAgents.primary, ...(specification.selectedAgents.secondary ?? [])].filter(Boolean).join(', ')
    : 'not recorded';
  const sourcePaths = evidencePaths(inspection, 'repository-boundary');
  const testPaths = evidencePaths(inspection, 'test-boundary');
  const commands = commandLines(inspection);
  const linesOut = lines(
    '# Agent Collaboration Contract',
    '',
    '## Purpose and current scope',
    '',
    `This repository exists to: ${value(decisions, 'project-goal')}`,
    '',
    `Primary pain addressed: ${value(decisions, 'current-pain')}`,
    '',
    `MVP boundary: ${value(decisions, 'mvp-boundary')}`,
    '',
    `Explicit exclusions: ${value(decisions, 'exclusions')}`,
    '',
    'This contract is the canonical collaboration entry point. All agents, regardless of platform, must read it before making repository changes.',
    `Selected collaboration agents: ${selectedAgents}. Their platform compatibility must remain accurately qualified until evaluated.`,
    'Current setup state: approved project intent is documented; implementation begins only from the first unchecked approved task.',
    '',
    '## Required planning workflow',
    '',
    '1. Read this file before inspecting or changing implementation files.',
    '2. Read `PLAN.md` for durable product and architecture decisions.',
    '3. Read `TODO.md` to find the first relevant unchecked approved task.',
    '4. Confirm the requested work is inside the approved plan and current phase.',
    '5. Inspect only the files needed for that task; do not assume undocumented behavior.',
    '6. Make the smallest change that satisfies the approved task.',
    '7. Run the task’s approved verification or record why it could not run.',
    '8. Update `TODO.md` only with observed implementation and verification evidence.',
    '9. Leave a concise handoff naming changed files, checks, results, and blockers.',
    '',
    'Do not bypass `PLAN.md` or `TODO.md` because an instruction file, chat request, or nearby code suggests broader work.',
    '',
    '## Repository map',
    '',
    `Observed languages: ${evidenceList(inspection, 'language', 'none detected')}.`,
    '',
    `Observed frameworks: ${evidenceList(inspection, 'framework', 'none detected')}.`,
    '',
    `Observed repository structure: ${evidenceList(inspection, 'repository-structure', 'single repository or unknown')}.`,
    '',
    'Source boundaries:',
    sourcePaths,
    '',
    'Test boundaries:',
    testPaths,
    '',
    'Treat unobserved architecture, data flow, and runtime behavior as unknown until verified or explicitly approved.',
    '',
    '## Verified commands',
    '',
    'The following are candidates observed during static inspection. They are not proof that a command has been run successfully.',
    '',
    commands,
    '',
    'Do not execute dependency installation, lifecycle scripts, migrations, services, containers, deployment, or external-system commands without appropriate developer authority.',
    '',
    '## Product and domain rules',
    '',
    `Users and outcomes: ${value(decisions, 'users-outcomes')}`,
    '',
    `Core workflows: ${value(decisions, 'core-workflows')}`,
    '',
    `Domain invariants: ${value(decisions, 'domain-rules')}`,
    '',
    `Data, privacy, and authorization rules: ${value(decisions, 'data-security-privacy')}`,
    '',
    `Integration boundary: ${value(decisions, 'integrations')}`,
    '',
    'Preserve these decisions unless the developer explicitly approves a durable plan change before implementation.',
    '',
    '## Architecture and operations',
    '',
    `Approved architecture constraints: ${value(decisions, 'architecture-constraints')}`,
    '',
    `Operations and deployment expectations: ${value(decisions, 'operations-deployment')}`,
    '',
    `Future scope with present impact: ${value(decisions, 'future-scope')}`,
    '',
    'Do not add speculative abstractions, integrations, data stores, services, or deployment infrastructure for deferred scope.',
    '',
    '## Change ownership and coordination',
    '',
    'Claim a task before editing shared files and keep ownership focused on the smallest coherent surface.',
    'Avoid overlapping edits; coordinate before changing a file another agent may be modifying.',
    'Do not rewrite unrelated formatting, comments, generated output, or project-owned documentation.',
    'Preserve user-authored content and surface conflicts instead of silently replacing it.',
    'Use atomic, path-safe writes for approved generated artifacts.',
    'Do not store raw chat transcripts, credentials, tokens, secrets, or unnecessary source bodies in RepoCharter state.',
    '',
    '## Planning and ledger protocol',
    '',
    '`PLAN.md` answers what the project is building, why its durable decisions exist, and in what order major work is verified.',
    '`TODO.md` is the execution ledger derived from `PLAN.md`; it records current tasks, blockers, and observed phase-gate evidence.',
    'Do not use `PLAN.md` as a changelog or invent a completed history in `TODO.md`.',
    'Before coding, find the relevant unchecked task or add an approved, actionable task in the correct phase.',
    'Keep a task unchecked while implementation, review, or verification is incomplete.',
    'A completed task must name real verification evidence when that evidence materially supports the claim.',
    'Do not mark a phase gate passed merely because its individual tasks are checked.',
    'If an approved request changes durable scope, workflow, interface, security rule, or architecture, update the relevant plan section first.',
    'If evidence exposes a conflict with the plan, stop and obtain a developer decision instead of silently changing either source of truth.',
    'Preserve historical completed tasks and gate evidence when adding a follow-up task.',
    '',
    '## Coding and review conventions',
    '',
    'Match the repository’s observed language, module, naming, and test conventions in the files you touch.',
    'Avoid speculative configuration, dependencies, abstractions, and future-phase behavior.',
    'Keep changes surgical: every modified line must trace to the approved task.',
    'Remove imports, variables, and files made unused by your own change, but do not clean unrelated code without approval.',
    'Treat input, authorization, persistence, and state-transition boundaries as correctness-sensitive even when tests are sparse.',
    'Review user-visible errors, failure paths, and changed ownership boundaries before declaring work complete.',
    'When no relevant check can run, record the concrete reason and the exact follow-up verification required.',
    'Do not infer success from static inspection, a clean diff, or an unexecuted candidate command.',
    'Keep requested user-facing behavior, invariants, and error conditions aligned with the approved task.',
    'Prefer deterministic checks that demonstrate the specific risk introduced by the change.',
    'Inspect the final diff for accidental scope expansion before handoff.',
    'Do not modify generated artifacts manually when their ownership or reconciliation state is unresolved.',
    'Escalate a conflict when two approved tasks require overlapping incompatible changes.',
    'Record a new blocker immediately when it changes the next safe action.',
    'Use the smallest available test fixture or isolated reproduction when verifying a focused behavior.',
    '',
    '## Verification and completion evidence',
    '',
    `Approved verification depth: ${specification.verificationDepth}.`,
    '',
    `Required quality evidence: ${value(decisions, 'quality-verification')}`,
    '',
    'A task is complete only when the requested implementation is present, relevant checks have been run or explicitly blocked, and `TODO.md` records only observed evidence.',
    'Never claim tests, commands, compatibility, deployment, migration, or user approval that did not occur.',
    'Keep warnings and unresolved blockers visible rather than converting them into success claims.',
    '',
    '## Safe change and conflict rules',
    '',
    'Before applying generated documentation, review the complete proposed change set.',
    'Missing or tool-owned unchanged artifacts may be approved together.',
    'Modified or project-owned artifacts require an explicit per-file preservation or content-aware reconciliation decision.',
    'Never blindly replace project-owned `PLAN.md` or `TODO.md`.',
    'A blocked artifact remains unchanged until its safety or ownership issue is resolved.',
    '',
    '## Handoff requirements',
    '',
    'Every handoff states the approved task, changed paths, verification run, observed result, unresolved risks, and the next approved action.',
    'When work stops mid-task, state the exact completed boundary and preserve the task as incomplete.',
    'When repository evidence conflicts with this contract, stop and ask for a durable decision instead of guessing.',
    '',
    '## Limitations and open questions',
    '',
    `Risks and dependencies: ${value(decisions, 'risks-dependencies')}`,
    '',
    `Assumptions and open questions: ${value(decisions, 'assumptions-open-questions')}`,
    '',
    'Agent compatibility remains unverified until a later compatibility evaluation records observed behavior.',
    'This contract describes approved intent; it does not claim that planned capabilities are already implemented.',
    '',
  );
  return `${linesOut.join('\n')}\n`;
}

export function generatePlanDocument(specification, inspection) {
  const decisions = specification.confirmedDecisions;
  const title = value(decisions, 'project-goal', 'Project').replace(/[.]+$/, '');
  const sections = [
    ['# Implementation Plan', `${title}. This plan records approved intended behavior; observed repository evidence is not an implementation claim.`],
    ['## 1. Stack decisions and repository evidence', `Observed languages: ${evidenceList(inspection, 'language', 'none detected')}.`, `Observed frameworks: ${evidenceList(inspection, 'framework', 'none detected')}.`, `Approved constraints: ${value(decisions, 'architecture-constraints')}`],
    ['## 2. Product scope', `Users and outcomes: ${value(decisions, 'users-outcomes')}`, `MVP boundary: ${value(decisions, 'mvp-boundary')}`, `Explicit exclusions: ${value(decisions, 'exclusions')}`],
    ['## 3. Architecture and workflows', `Core workflows: ${value(decisions, 'core-workflows')}`, `Domain rules: ${value(decisions, 'domain-rules')}`, 'Preserve observed repository boundaries unless an approved task changes them.'],
    ['## 4. Data, security, and integrations', `Data, privacy, and authorization: ${value(decisions, 'data-security-privacy')}`, `Integrations: ${value(decisions, 'integrations')}`],
    ['## 5. Operations and quality', `Operations and deployment: ${value(decisions, 'operations-deployment')}`, `Verification expectations: ${value(decisions, 'quality-verification')}`, `Approved verification depth: ${specification.verificationDepth}.`],
    ['## 6. Future scope and exclusions', `Future scope with present architectural impact: ${value(decisions, 'future-scope')}`, 'Deferred work remains excluded until it receives an approved plan task.'],
    ['## 7. Build order and verification gates', '1. **Core workflow** → gate: the MVP workflow and authorization rules have observable verification.', '2. **Operational readiness** → gate: approved deployment and recovery expectations are represented and checked.', '3. **Release verification** → gate: required quality checks pass or documented blockers remain visible.'],
    ['## 8. Assumptions, risks, and open questions', `Risks and dependencies: ${value(decisions, 'risks-dependencies')}`, `Assumptions and open questions: ${value(decisions, 'assumptions-open-questions')}`],
  ];
  return `${sections.flatMap(([heading, ...body]) => [heading, '', ...body, '']).join('\n')}\n`;
}

export function generateTodoDocument(specification, inspection) {
  const decisions = specification.confirmedDecisions;
  const observedCommands = inspection.commands.filter((command) => command.classification === 'observed');
  const baseline = observedCommands.length > 0
    ? observedCommands.map((command) => `- [x] **Observed command baseline**: \`${command.command}\` is a static inspection candidate from \`${command.source}\`; it has not been claimed as executed.`)
    : ['- [x] **Observed baseline**: No executable project command was inferred during static inspection.'];
  return `# Project TODO\n\nTask tracker derived from [PLAN.md](./PLAN.md). Mark work complete only after implementation and observed verification.\n\n**Legend:** \`[ ]\` pending · \`[x]\` done\n\n---\n\n## Verified baseline\n\n${baseline.join('\n')}\n\n---\n\n## Phase 1: Core MVP workflow\n\n> Goal: deliver the approved MVP boundary: ${value(decisions, 'mvp-boundary')}\n\n- [ ] **1.1 Implement core workflow**: implement the approved workflow: ${value(decisions, 'core-workflows')}\n- [ ] **1.2 Enforce domain rules**: preserve these invariants: ${value(decisions, 'domain-rules')}\n\n**Phase gate: PENDING**: the MVP workflow and authorization-sensitive paths meet the verification expectations in \`PLAN.md\`.\n\n---\n\n## Phase 2: Data, security, and integrations\n\n> Goal: enforce approved data and external-system boundaries.\n\n- [ ] **2.1 Protect data and access**: implement ${value(decisions, 'data-security-privacy')}\n- [ ] **2.2 Integrate only approved systems**: implement or explicitly defer ${value(decisions, 'integrations')}\n\n**Phase gate: PENDING**: data, authorization, and integration behavior are verified at the approved depth.\n\n---\n\n## Phase 3: Operations and release verification\n\n> Goal: satisfy approved operational and quality requirements without introducing excluded scope.\n\n- [ ] **3.1 Prepare operations**: implement ${value(decisions, 'operations-deployment')}\n- [ ] **3.2 Run approved verification**: perform ${value(decisions, 'quality-verification')}\n\n**Phase gate: PENDING**: required checks are observed or blockers are recorded honestly.\n\n---\n\n## Open questions\n\n- [ ] **Confirm assumptions and blockers**: ${value(decisions, 'assumptions-open-questions')}\n`;
}

export function generateCanonicalDocuments(specification, inspection) {
  return [
    { path: 'AGENTS.md', content: generateAgentsDocument(specification, inspection), templateVersion: DOCUMENT_TEMPLATE_VERSION },
    { path: 'PLAN.md', content: generatePlanDocument(specification, inspection), templateVersion: DOCUMENT_TEMPLATE_VERSION },
    { path: 'TODO.md', content: generateTodoDocument(specification, inspection), templateVersion: DOCUMENT_TEMPLATE_VERSION },
  ];
}
