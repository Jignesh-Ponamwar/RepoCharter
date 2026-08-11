<!-- Fictional generated example; not evidence for this repository. -->

# Agent Collaboration Contract

## Purpose and current scope

This repository exists to: Give support teams a reliable request workflow.

Primary pain addressed: Support work is lost across chat messages.

MVP boundary: Create, assign, and resolve support requests.

Explicit exclusions: Email automation and organization-wide policy management.

This contract is the canonical collaboration entry point. All agents, regardless of platform, must read it before making repository changes.
Selected collaboration agents: claude-code. Their platform compatibility must remain accurately qualified until evaluated.
Current setup state: approved project intent is documented; implementation begins only from the first unchecked approved task.

## Required planning workflow

1. Read this file before inspecting or changing implementation files.
2. Read `PLAN.md` for durable product and architecture decisions.
3. Read `TODO.md` to find the first relevant unchecked approved task.
4. Confirm the requested work is inside the approved plan and current phase.
5. Inspect only the files needed for that task; do not assume undocumented behavior.
6. Make the smallest change that satisfies the approved task.
7. Run the task’s approved verification or record why it could not run.
8. Update `TODO.md` only with observed implementation and verification evidence.
9. Leave a concise handoff naming changed files, checks, results, and blockers.

Do not bypass `PLAN.md` or `TODO.md` because an instruction file, chat request, or nearby code suggests broader work.

## Repository map

Observed languages: TypeScript.

Observed frameworks: Next.js.

Observed repository structure: single repository or unknown.

Source boundaries:
- `app`
- `lib`

Test boundaries:
- `tests`

Treat unobserved architecture, data flow, and runtime behavior as unknown until verified or explicitly approved.

## Verified commands

The following are candidates observed during static inspection. They are not proof that a command has been run successfully.

- `npm run lint` — observed lint command (package.json).
- `npm test` — observed test command (package.json).

Do not execute dependency installation, lifecycle scripts, migrations, services, containers, deployment, or external-system commands without appropriate developer authority.

## Product and domain rules

Users and outcomes: Employees create requests, agents resolve them, and administrators manage access.

Core workflows: Create requests, assign authorized owners, record status transitions, and review history.

Domain invariants: Only authorized roles may assign or resolve requests; history is append-only.

Data, privacy, and authorization rules: Restrict request access by role and do not log request descriptions.

Integration boundary: Use the existing identity provider and defer notification providers.

Preserve these decisions unless the developer explicitly approves a durable plan change before implementation.

## Architecture and operations

Approved architecture constraints: Keep authorization server authoritative and preserve the existing Node.js layout.

Operations and deployment expectations: Run migrations separately, expose a health check, and retain rollback instructions.

Future scope with present impact: Future team support requires durable authorization and audit boundaries now.

Do not add speculative abstractions, integrations, data stores, services, or deployment infrastructure for deferred scope.

## Change ownership and coordination

Claim a task before editing shared files and keep ownership focused on the smallest coherent surface.
Avoid overlapping edits; coordinate before changing a file another agent may be modifying.
Do not rewrite unrelated formatting, comments, generated output, or project-owned documentation.
Preserve user-authored content and surface conflicts instead of silently replacing it.
Use atomic, path-safe writes for approved generated artifacts.
Do not store raw chat transcripts, credentials, tokens, secrets, or unnecessary source bodies in RepoCharter state.

## Planning and ledger protocol

`PLAN.md` answers what the project is building, why its durable decisions exist, and in what order major work is verified.
`TODO.md` is the execution ledger derived from `PLAN.md`; it records current tasks, blockers, and observed phase-gate evidence.
Do not use `PLAN.md` as a changelog or invent a completed history in `TODO.md`.
Before coding, find the relevant unchecked task or add an approved, actionable task in the correct phase.
Keep a task unchecked while implementation, review, or verification is incomplete.
A completed task must name real verification evidence when that evidence materially supports the claim.
Do not mark a phase gate passed merely because its individual tasks are checked.
If an approved request changes durable scope, workflow, interface, security rule, or architecture, update the relevant plan section first.
If evidence exposes a conflict with the plan, stop and obtain a developer decision instead of silently changing either source of truth.
Preserve historical completed tasks and gate evidence when adding a follow-up task.

## Coding and review conventions

Match the repository’s observed language, module, naming, and test conventions in the files you touch.
Avoid speculative configuration, dependencies, abstractions, and future-phase behavior.
Keep changes surgical: every modified line must trace to the approved task.
Remove imports, variables, and files made unused by your own change, but do not clean unrelated code without approval.
Treat input, authorization, persistence, and state-transition boundaries as correctness-sensitive even when tests are sparse.
Review user-visible errors, failure paths, and changed ownership boundaries before declaring work complete.
When no relevant check can run, record the concrete reason and the exact follow-up verification required.
Do not infer success from static inspection, a clean diff, or an unexecuted candidate command.
Keep requested user-facing behavior, invariants, and error conditions aligned with the approved task.
Prefer deterministic checks that demonstrate the specific risk introduced by the change.
Inspect the final diff for accidental scope expansion before handoff.
Do not modify generated artifacts manually when their ownership or reconciliation state is unresolved.
Escalate a conflict when two approved tasks require overlapping incompatible changes.
Record a new blocker immediately when it changes the next safe action.
Use the smallest available test fixture or isolated reproduction when verifying a focused behavior.

## Verification and completion evidence

Approved verification depth: approved-checks.

Required quality evidence: Run workflow, authorization, migration, and browser checks before release.

A task is complete only when the requested implementation is present, relevant checks have been run or explicitly blocked, and `TODO.md` records only observed evidence.
Never claim tests, commands, compatibility, deployment, migration, or user approval that did not occur.
Keep warnings and unresolved blockers visible rather than converting them into success claims.

## Safe change and conflict rules

Before applying generated documentation, review the complete proposed change set.
Missing or tool-owned unchanged artifacts may be approved together.
Modified or project-owned artifacts require an explicit per-file preservation or content-aware reconciliation decision.
Never blindly replace project-owned `PLAN.md` or `TODO.md`.
A blocked artifact remains unchanged until its safety or ownership issue is resolved.

## Handoff requirements

Every handoff states the approved task, changed paths, verification run, observed result, unresolved risks, and the next approved action.
When work stops mid-task, state the exact completed boundary and preserve the task as incomplete.
When repository evidence conflicts with this contract, stop and ask for a durable decision instead of guessing.

## Limitations and open questions

Risks and dependencies: Identity-provider availability and migration rehearsal are release dependencies.

Assumptions and open questions: Identity subjects are stable; no unresolved implementation blocker remains.

Agent compatibility remains unverified until a later compatibility evaluation records observed behavior.
This contract describes approved intent; it does not claim that planned capabilities are already implemented.

