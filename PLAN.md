# RepoCharter: Implementation Plan

RepoCharter is a local-first, open-source repository initializer for individual
developers adopting agentic development. A developer runs
`npx repo-charter init`; the tool inspects the repository, prepares an in-agent
planning interview, generates project-specific collaboration and planning documents,
applies only approved changes, validates the result, and identifies the next task.

The project prioritizes safe initialization of both new and existing repositories.
Its output must improve how coding agents understand, modify, verify, and hand off a
real project—not merely produce generic Markdown.

## 1. Product goals and success criteria

The initializer must help a developer establish an honest, durable operating system
for agent-assisted work. A successful setup allows a fresh supported coding agent to:

1. explain the project and its goals accurately;
2. locate important modules, ownership boundaries, and verified commands;
3. identify the next approved task from `TODO.md`;
4. reject or surface work outside the approved plan;
5. implement a small scoped change and run the correct verification;
6. record only observed evidence and honest blockers;
7. hand work to another agent without losing project state.

The first public release is a `0.1.0` preview. Preview status does not weaken the
non-destructive installation and privacy guarantees in this plan.

## 2. Users, scope, and supported environments

### Primary user

The initial product serves individual developers initializing their own new or
existing repositories. Generated files must still support clear collaboration when
the developer uses multiple agents or later shares the repository with a team.

### Supported coding agents

The target support matrix is:

- Codex;
- Claude Code;
- GitHub Copilot;
- Cursor;
- Windsurf;
- Gemini CLI;
- generic `AGENTS.md` consumers.

An agent is officially supported only when its current official instruction mechanism
is documented, the correct entry files are generated, the agent demonstrably follows
the project contract, known limitations are reported, and the behavior evaluation in
this plan passes. Shipping an unverified template does not qualify as support.

### Supported operating systems

- Windows;
- macOS;
- Linux.

WSL is treated as Linux. Implementation must use Node.js path and filesystem APIs
rather than shell-specific path construction.

### Explicit initial exclusions

- Team or organization-wide policy management;
- telemetry or repository-content uploads;
- automatic CI, cloud, or deployment mutations;
- automatic execution of dependency installation or package lifecycle scripts;
- `update`, `doctor`, or `eject` as stable public commands;
- a public third-party adapter or template plugin API;
- automatic nested instruction files for every monorepo package;
- a marketplace or agent-plugin release before core behavior is proven.

## 3. Stack decisions and distribution

- Use Node.js 22 or newer for cross-platform execution and modern built-in APIs.
- Use npm for distribution, provisionally under package name `repo-charter`.
- Expose the `repo-charter` binary, with `npx repo-charter init` as the primary entry
  point.
- Use built-in Node.js APIs by default. Add dependencies only when they materially
  reduce parsing, compatibility, or correctness risk.
- Implement the Phase 1 CLI as ESM JavaScript, using Node's built-in `node:test` and
  `node:assert/strict` for tests. Do not add runtime, build, lint, or test dependencies
  during the foundation phase.
- License the public project under MIT.
- Use semantic versioning. Manifest schema, ownership-marker, command-contract, or
  generated-file semantic breaks require migrations and may require a major release.
- Use `.repo-charter/` for local tool state and `repo-charter-ownership` for ownership
  markers. This pre-publication identity change needs no external-state migration;
  later published semantic breaks remain subject to the migration rule above.
- Keep repository analysis local. Network operations must be explicit and disclosed.
- Verify package-name availability immediately before publication; use a scoped npm
  package if necessary while retaining the binary name when possible.

## 4. Architecture and repository layout

The intended structure is:

```text
repo-charter/
|-- bin/                         # Public CLI entry point
|-- src/
|   |-- cli/                     # Argument parsing and command orchestration
|   |-- inspection/              # Safe repository discovery and evidence model
|   |-- session/                 # Staged and resumable setup state
|   |-- generation/              # AGENTS, PLAN, TODO, and adapter generation
|   |-- conflicts/               # Ownership and reconciliation classification
|   |-- validation/              # Deterministic checks and advisory diagnostics
|   `-- filesystem/              # Atomic writes and path-safe operations
|-- templates/                   # Versioned canonical and agent-native templates
|-- skill/
|   |-- SKILL.md                 # Concise agent-facing workflow
|   |-- agents/openai.yaml       # Skill UI metadata
|   |-- references/              # Conditional planning and compatibility guidance
|   `-- scripts/                 # Thin calls into the shared CLI implementation
|-- tests/
|   |-- unit/
|   |-- integration/
|   |-- fixtures/
|   `-- behavior/                # Fresh-agent outcome evaluations
|-- docs/                        # Human-facing lifecycle and support documentation
|-- examples/                    # Realistic generated-output references
|-- AGENTS.md                    # This repository's agent contract
|-- PLAN.md                      # Durable product and architecture contract
`-- TODO.md                      # Verified execution ledger
```

This is an ownership map, not authorization to create every module immediately.
Modules should be introduced in build order with the minimum structure needed by the
current phase.

### Responsibility boundaries

- The CLI owns deterministic inspection, state transitions, filesystem changes,
  ownership detection, and validation.
- The active coding agent owns adaptive questioning, synthesis, contradiction
  detection, and proposing project-specific content.
- The developer owns product intent, unresolved tradeoffs, conflict resolution, and
  approval of durable project truth.
- The installable skill orchestrates the workflow but calls the same implementation
  as the CLI; it must not duplicate file-writing or validation logic.

## 5. Initialization lifecycle

Initialization is a staged, resumable transaction:

```text
Inspect repository
    -> detect technical and documentation evidence
    -> select primary and optional secondary agents
    -> create an in-agent handoff
    -> conduct the project grill
    -> confirm decisions and preview generated documents
    -> resolve conflicts and approve changes
    -> apply deterministic writes
    -> validate the setup
    -> print exact changes and next approved task
```

### Stage 1: Inspect

Resolve the requested path or current directory and inspect it without mutation.
Detect, where evidence exists:

- languages and versions;
- frameworks and project type;
- package managers and lockfiles;
- source, tests, and monorepo/package layout;
- lint, type-check, test, build, and development commands;
- database schemas and migrations;
- containers, CI, deployment, and runtime configuration;
- README, architecture, decision, planning, and agent documentation;
- Git repository and worktree state;
- existing target files and managed ownership markers.

Classify extracted information as observed evidence, developer-approved intent, or
unknown. File presence alone must not be represented as verified behavior.

### Stage 2: Select agents

Ask the developer to choose one primary agent and zero or more secondary agents from
the supported matrix. Always generate a detailed root `AGENTS.md`. Agent selection
determines native adapters, initialization handoff guidance, and compatibility checks.

### Stage 3: Handoff to the coding agent

The planning interview occurs entirely inside a coding-agent conversation. When the
developer invokes the CLI through an active agent, the agent consumes structured
inspection output directly. When the CLI is run manually, it prints an exact handoff
prompt and evidence location that the developer can paste into the selected agent.

### Stage 4: Grill project intent

The agent asks only questions that repository evidence cannot safely answer. It works
through dependent decisions in rounds, recommends an answer for each decision, and
challenges ambiguity or contradictions. The interview must cover, when applicable:

- project goal, users, and desired outcomes;
- current state and primary pain;
- MVP boundary and explicit exclusions;
- core workflows and domain rules;
- architecture and technology constraints;
- data, security, privacy, and authorization rules;
- integrations, infrastructure, and deployment;
- testing and quality expectations;
- future scope that affects present architecture;
- risks, dependencies, assumptions, and unresolved decisions.

The raw transcript is not persisted. Confirmed decisions become appropriate sections
of `PLAN.md`. The agent presents a shared-understanding summary and obtains explicit
developer confirmation before proposing durable files.

### Stage 5: Preview and approve

Generate or reconcile proposed `AGENTS.md`, `PLAN.md`, `TODO.md`, agent-native
adapters, and the local manifest. Present the complete proposed change set. Safe,
non-conflicting changes may be approved together; every unresolved file requires an
explicit decision. No durable project file is written before approval.

### Stage 6: Apply

Apply the approved specification through atomic, path-safe operations. Create only
missing or tool-owned artifacts and approved reconciliations. An interruption must
not leave a partially written file or falsely completed session stage.

### Stage 7: Validate and report

Run deterministic setup validation and any separately approved project checks. Print:

- every created, modified, unchanged, skipped, and conflicted file;
- validation errors and warnings;
- commands actually run and their observed outcomes;
- unresolved blockers;
- the first actionable unchecked task from `TODO.md`.

## 6. CLI contract and session state

### Initial public commands

```text
repo-charter init [path]
repo-charter check [path]
repo-charter resume [path]
```

### Initial options

```text
--dry-run
--primary-agent <agent>
--agents <agent,...>
--json
--non-interactive
```

Internal `inspect` and `apply` operations may support reliable orchestration without
being committed as stable public APIs in `0.1.0`.

### Stage behavior

- `init` starts or resumes the staged setup after checking existing state.
- `resume` reloads a prior incomplete session, then re-inspects files changed since
  its snapshot before trusting stored evidence.
- `check` performs no repository writes and returns a non-zero status for actionable
  integrity or contract failures.
- `--dry-run` performs the full calculable workflow without repository writes.
- `--json` provides structured output for coding-agent orchestration while preserving
  meaningful exit statuses.
- `--non-interactive` may proceed only when every required decision is supplied and
  no ambiguous conflict requires judgment.

### Local manifest

Resumable state lives under `.repo-charter/`. Its versioned manifest records:

```json
{
  "schemaVersion": 1,
  "packageVersion": "0.1.0",
  "stage": "inspected",
  "selectedAgents": {
    "primary": "codex",
    "secondary": []
  },
  "confirmedDecisions": {},
  "templateVersions": {},
  "managedArtifacts": {},
  "repositorySnapshot": {}
}
```

The final schema may refine field shapes but must preserve these responsibilities.
State must not contain raw grill transcripts, secrets, credentials, or captured
private source contents.

## 7. Generated document contracts

Generated documents have stable semantic requirements but flexible section layouts.
Omit irrelevant sections rather than filling them with boilerplate. Preserve a
compatible existing structure when reconciling project-owned documentation.

### `AGENTS.md`

`AGENTS.md` is the detailed, vendor-neutral collaboration contract and authoritative
instruction source. Target approximately 150-250 lines, adjusted when project
complexity genuinely requires it. Include applicable content for:

- project purpose and current phase;
- repository map and module ownership;
- architecture and important data/control flows;
- verified install, development, lint, test, build, and deployment commands;
- domain, data, security, privacy, and authorization invariants;
- coding and testing conventions evidenced by the repository;
- `PLAN.md` and `TODO.md` operating protocol;
- task ownership, overlapping-edit avoidance, and handoff rules;
- evidence required before completion claims;
- safe-change and conflict rules;
- known limitations, blockers, and open questions.

Large architecture or product detail belongs in `PLAN.md` or focused reference docs.
The root contract must describe collaboration outcomes without assuming that every
agent platform exposes subagent or delegation tools.

### Agent-native adapters

Agent-native instruction files and rules are first-class **entry points** into the
agent-ready environment, not optional decoration. For every selected agent, the tool
must generate or verify a documented instruction surface that reliably leads the agent
through this required workflow:

```text
native agent entry point -> AGENTS.md -> PLAN.md + TODO.md -> scoped work and verification
```

The native entry point must establish that the agent reads the canonical contract before
repository changes, then follows the plan and ledger for approved scope, next-task
selection, verification, and handoff. A thin adapter means a small non-duplicated
bridge—not a lower-priority file or an excuse to omit this workflow.

Always generate the root `AGENTS.md`, regardless of which agent is selected. Generate
additional entry files only for selected agents and only when the agent needs a native
adapter to discover or reliably follow that contract. Do not create every supported
agent's directory in every client repository.

The default generation matrix is:

| Selected agent | Default project output |
| --- | --- |
| Generic `AGENTS.md` consumer | `AGENTS.md` only |
| Codex | `AGENTS.md` only |
| Claude Code | `CLAUDE.md` importing or routing to `AGENTS.md` |
| Gemini CLI | `GEMINI.md` importing `AGENTS.md` |
| GitHub Copilot | `.github/copilot-instructions.md` routing to the project contract |
| Cursor | `AGENTS.md` only |
| Windsurf | `AGENTS.md` only |

For Claude Code, the default `CLAUDE.md` should remain a thin adapter. Generate
`.claude/rules/*.md` only when the inspected repository and confirmed developer intent
require genuinely Claude-specific modular or path-scoped rules. Do not create a
generic duplicated `.claude/rules/rules.md` by default.

For Codex, use `AGENTS.md` as the project instruction surface. Do not generate
`.codex/rules/rules.md` or treat `.codex/rules/*.md` as Codex project instructions.
Any future `.codex` artifact must have a separately verified Codex-native purpose and
must not duplicate the canonical contract.

For Cursor and Windsurf, rely on their verified `AGENTS.md` support by default.
Generate `.cursor/rules/` or `.windsurf/rules/` only when confirmed platform-specific
activation, scoping, or behavior cannot be expressed reliably through the root
contract. GitHub Copilot receives its repository-wide native adapter because support
for `AGENTS.md` varies across Copilot environments.

Every generated adapter must be the smallest verified bridge to `AGENTS.md`. Prefer a
native import when supported; otherwise use a concise routing instruction or, only
when necessary, a versioned synchronized subset of essential rules. It must preserve
the native-entry-to-canonical-contract workflow above, including the requirement to
consult `PLAN.md` and `TODO.md` before work. Compatibility behavior must be backed by
current official documentation and agent-specific evaluation. The project must not
assume that all platforms interpret imports, pointers, precedence, or nested
instructions identically.

### `PLAN.md`

`PLAN.md` records durable project truth rather than progress. It must capture relevant
decisions and rationale, architecture, persistence, workflows, interfaces, security,
operations, explicit exclusions, build order, observable gates, assumptions, and open
questions. Developer-approved future scope may be recorded when it affects present
architecture, but it must not be mistaken for implemented behavior.

### `TODO.md`

`TODO.md` is derived from `PLAN.md` and acts as the execution ledger. It contains
ordered implementation-grade tasks, dependencies, blockers, and phase gates. Existing
capabilities may appear in a concise completed baseline only when supported by actual
evidence. Do not fabricate historical task sequences. A task remains unchecked until
implementation and relevant verification are complete.

## 8. Inspection privacy and execution safety

### Read boundary

- Respect `.gitignore` by default.
- Skip dependency caches, build outputs, binaries, private keys, credential files,
  and real `.env` files.
- Inspect names and documented placeholders in `.env.example` without collecting
  secret values.
- Apply configurable file-count and file-size limits. Default inspection permits at
  most 1,000 eligible files and reads at most 256 KiB from each text file.
- Permit explicit include/exclude overrides without weakening hard secret rules by
  accident.
- Record inspected paths and evidence metadata rather than unnecessary source bodies.
- Redact token-like or credential-like values from captured command output.

### Execution boundary

Static inspection identifies commands but does not execute package scripts. The agent
may propose lint, type-check, test, build, startup, or runtime checks. Execution occurs
only after developer approval or under the active agent's established permission
model. Dependency installation, lifecycle scripts, migrations, services, and external
systems always require clear authority.

### Local-only guarantee

The CLI collects no telemetry and uploads no repository content. Network access is
allowed only for explicit operations such as update checks or current compatibility
research, and must be disclosed separately from local inspection.

## 9. Ownership, conflicts, and reconciliation

Every target artifact is classified before mutation:

- `missing`: safe to propose creating;
- `owned-current`: tool-generated and unchanged since the recorded version;
- `owned-modified`: tool-generated but subsequently edited;
- `compatible-existing`: project-owned content that can remain without conflict;
- `merge-required`: overlapping instructions or planning truth require judgment;
- `blocked`: unsafe, invalid, or impossible to reconcile automatically.

The tool must never silently overwrite ambiguous non-empty files. Managed sections may
be used for agent entry adapters. `PLAN.md` and `TODO.md` require content-aware,
developer-approved reconciliation rather than blind marker replacement.

Future template updates use three-way reconciliation between the previously installed
managed version, the current repository version, and the new template. Unmodified
managed content may update after preview. Modified or project-owned content requires
explicit approval. Project facts must never be reset to generic defaults.

Atomic writes, validated target paths, and idempotency are hard invariants. Running
initialization twice against an unchanged completed setup must produce no diff.

## 10. Validation and diagnostics

`check` validates these layers:

1. manifest schema, state, ownership hashes, and managed-file integrity;
2. selected agent entry-point presence, canonical routing, and tested compatibility;
3. `AGENTS.md` completeness, required project-specific information, and the required
   `AGENTS.md` -> `PLAN.md`/`TODO.md` working sequence;
4. `PLAN.md` durable concepts, assumptions, exclusions, and unresolved decisions;
5. traceability between plan build stages, TODO phases, tasks, and gates;
6. unsupported or contradictory completion claims;
7. stale repository paths, facts, and documented commands where deterministically
   detectable;
8. results of separately selected repository checks.

Diagnostics distinguish errors from warnings. Integrity, safety, or contract failures
produce a non-zero exit status. Subjective style preferences remain advisory.

## 11. Test and evaluation strategy

### Repository fixtures

Maintain isolated fixtures for:

- an empty repository;
- a new Node.js application;
- an existing Node.js application;
- a Python application;
- a mixed-language monorepo;
- compatible existing agent instructions;
- conflicting existing agent instructions;
- existing `PLAN.md` and `TODO.md`;
- a dirty Git worktree;
- a directory that is not a Git repository;
- Windows and POSIX path behavior.

Fixtures must verify dry-run, interruption, resume, atomicity, conflict preservation,
redaction, validation exit statuses, and a no-diff second initialization.

### Supported-agent behavior evaluation

For every claimed agent, use a fresh context against a generated fixture and verify
that it can:

1. load its selected native entry point and follow it to the canonical `AGENTS.md`;
2. explain the project correctly;
3. identify the next approved task from `TODO.md` after consulting `PLAN.md`;
4. find the relevant modules and commands;
5. surface a deliberately out-of-scope request;
6. make a small scoped change and run appropriate verification;
7. update `TODO.md` with honest evidence;
8. produce a usable handoff without losing state.

Record agent version, adapter version, fixture, observed result, and limitations.
Compatibility must be rechecked before releases that alter adapters. Stale or failed
compatibility must be reported rather than silently advertised.

## 12. Human-facing and skill documentation

The repository should eventually include:

- `README.md`: value proposition, quick start, supported agents, and safety model;
- `LEARNING.md`: a human-oriented explanation of the product, architecture,
  lifecycle, concepts, safety model, and implementation roadmap that clearly
  distinguishes current repository state from planned behavior;
- `docs/how-it-works.md`: the inspection-to-validation lifecycle;
- `docs/generated-files.md`: ownership and conflict behavior;
- `docs/agent-support.md`: verified adapters, versions, and limitations;
- `CONTRIBUTING.md`: local development and fixture testing;
- `examples/`: realistic generated `AGENTS.md`, `PLAN.md`, and `TODO.md` outputs.

The installable skill remains concise and procedural. Conditional repository-analysis,
planning, conflict, and compatibility guidance belongs in directly linked references.
Templates and deterministic scripts are shared assets rather than duplicated prose.

## 13. Build order and verification gates

1. **Project foundation and safe filesystem core** -> gate: the packed CLI starts on
   Node.js 22+, resolves paths cross-platform, performs atomic writes, and proves
   no-write dry-run and idempotent initialization on base fixtures.
2. **Inspection and evidence model** -> gate: fixtures accurately detect supported
   repository facts, skip protected content, redact sensitive output, and emit stable
   human and JSON evidence without executing project scripts.
3. **Agent selection, sessions, and handoff** -> gate: primary/secondary selection,
   manifest persistence, interruption, changed-file reinspection, resume, and manual
   conversation handoff work without storing transcripts or secrets.
4. **Document generation and reconciliation** -> gate: approved fixture inputs create
   detailed project-specific `AGENTS.md`, evidence-based `PLAN.md`, traceable
   `TODO.md`, and safe conflict classifications with a no-diff second application.
5. **Agent adapters and installable skill** -> gate: skill validation passes and each
   claimed adapter passes its supported-agent behavior evaluation with limitations
   recorded.
6. **Validation and developer handoff** -> gate: `check` reports deterministic errors
   and advisory warnings correctly, and completed setup prints the exact change set,
   verification evidence, blockers, and next approved task.
7. **Preview distribution** -> gate: the packed `0.1.0` npm artifact installs and
   completes documented workflows in clean Windows, macOS, and Linux environments.

## 14. Release acceptance criteria

The first preview is usable only after observing all of the following:

- clean installation from the packed npm artifact;
- initialization of representative new and existing repositories;
- zero-write dry-run behavior;
- preservation and accurate reporting of conflicts;
- interruption and resume from persisted safe state;
- idempotent second initialization;
- valid detailed project-specific `AGENTS.md`;
- developer-approved evidence-based `PLAN.md`;
- matching traceable `TODO.md`;
- verified native behavior for every claimed supported agent;
- no secret contents in state, logs, or generated output;
- passing fresh-agent behavior evaluations;
- verified Windows, macOS, and Linux path behavior;
- exact final reporting and next-task identification.

## 15. Confirmed assumptions and deferred decisions

- The developer runs the conversation-led flow through a capable coding agent; manual
  CLI use produces a handoff rather than launching or authenticating an agent.
- One primary agent and optional secondary agents are selected per repository.
- A root `AGENTS.md` is always generated; nested agent files are explicitly approved
  follow-up work when monorepo boundaries genuinely require different instructions.
- Confirmed interview decisions are retained through `PLAN.md` and safe structured
  state; raw conversations are not retained.
- Repository verification depth is selected during setup, defaulting to static
  inspection plus existing non-destructive checks proposed for approval.
- `repo-charter` remains a provisional npm package name until registry verification.
- Exact native adapter formats and import strategies remain evidence-driven and may
  change as supported agent documentation and behavior evolve.
