# RepoCharter: Implementation Plan

RepoCharter is a local-first, open-source repository initializer for individual
developers adopting agentic development. A developer runs
`npx repo-charter init`; the tool inspects the repository, prepares an in-agent
planning interview, generates one public repository contract plus a private local
agent workspace, applies only approved changes, validates the result, and identifies
the next task.

The project prioritizes safe initialization of both new and existing repositories.
Its output must improve how coding agents understand, modify, verify, and hand off a
real project—not merely produce generic Markdown.

## 1. Product goals and success criteria

The initializer must help a developer establish an honest, durable operating system
for agent-assisted work. A successful setup allows a fresh supported coding agent to:

1. explain the project and its goals accurately;
2. locate important modules, ownership boundaries, and verified commands;
3. identify the next approved task from local `TODO.md`, or request local
   RepoCharter initialization when no workspace exists;
4. reject or surface work outside the approved plan;
5. implement a small scoped change and run the correct verification;
6. record only observed evidence and honest blockers;
7. hand work to another agent without losing project state.

The first public release is a `0.1.0` preview. Preview status does not weaken the
non-destructive installation and privacy guarantees in this plan.

## 2. Users, scope, and supported environments

### Primary user

The initial product serves individual developers initializing their own new or
existing repositories. `AGENTS.md` is always a public, version-controlled repository
contract. During setup, the developer explicitly chooses either `local-planning` or
`shared-planning` for plans, task ledgers, selected agent adapters, and selected rules.
A developer who clones the repository can read the public contract and follow its
mode-appropriate planning instructions.

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
- a marketplace or agent-plugin release before core behavior is proven;
- publishing `.repo-charter/`, credentials, secret-bearing environment files, or
  machine-specific state as repository source; or
- publishing a developer's active plan, task ledger, selected native adapters, or
  rules when they selected the `local-planning` mode.

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
- Use `.repo-charter/` for ignored local tool state in both workspace modes and
  `repo-charter-ownership` for ownership markers. This pre-publication identity change
  needs no external-state migration; later published semantic breaks remain subject to
  the migration rule above.
- Keep repository analysis local. Network operations must be explicit and disclosed.
- Authenticated `npm publish --dry-run --access public` accepted
  `repo-charter@0.1.0`; real publication still requires separate explicit developer
  authorization.

## 4. Architecture and repository layout

The intended structure is:

```text
repo-charter/
|-- bin/                         # Public CLI entry point
|-- src/
|   |-- cli/                     # Argument parsing and command orchestration
|   |-- inspection/              # Safe repository discovery and evidence model
|   |-- session/                 # Staged and resumable setup state
|   |-- generation/              # Public AGENTS plus local workspace generation
|   |-- visibility/              # Artifact classification and ignore reconciliation
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

- The CLI owns deterministic inspection, state transitions, visibility classification,
  filesystem changes, ownership detection, and validation.
- The active coding agent owns adaptive questioning, synthesis, contradiction
  detection, and proposing project-specific content.
- The developer owns product intent, unresolved tradeoffs, conflict resolution, and
  approval of durable project truth.
- The visibility module is the single seam for applying the developer-confirmed
  `local-planning` or `shared-planning` policy and planning safe ignore-file
  reconciliation; generators, adapters, and validation consume that decision rather
  than reimplement it.
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
the supported matrix. Always generate or reconcile a detailed public root `AGENTS.md`.
Agent selection determines the local native adapters, local rules when explicitly
needed, initialization handoff guidance, and compatibility checks.

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
of `PLAN.md` in the selected workspace mode. The interview must ask the developer to
confirm `local-planning` (recommended for private active planning) or
`shared-planning` (for committed shared planning) before proposing durable files. The
agent presents a shared-understanding summary and obtains explicit developer
confirmation before proposing durable files.

### Stage 5: Preview and approve

Generate or reconcile the public `AGENTS.md`; mode-classified `PLAN.md`, `TODO.md`,
and selected agent-native adapters/rules; the always-local manifest; and any required
ignore-file changes. Present the complete proposed change set with each artifact's
visibility and selected workspace mode. Safe, non-conflicting changes may be approved
together; every unresolved file requires an explicit decision. No durable project file
is written before approval.

### Stage 6: Apply

Apply the approved specification through atomic, path-safe operations. Create only
missing or tool-owned artifacts and approved reconciliations. In `local-planning`,
write local-only artifacts only after their ignore protections are approved and
applied. In `shared-planning`, keep the planning documents and selected adapters
eligible for commit while `.repo-charter/` remains local. An interruption must not
leave a partially written file or falsely completed session stage.

### Stage 7: Validate and report

Run deterministic setup validation and any separately approved project checks. Print:

- every created, modified, unchanged, skipped, and conflicted file;
- validation errors and warnings;
- commands actually run and their observed outcomes;
- unresolved blockers;
- the first actionable unchecked task from local `TODO.md` when a workspace exists.

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
  "workspaceVisibility": "local-planning",
  "confirmedDecisions": {},
  "templateVersions": {},
  "managedArtifacts": {},
  "observedChecks": [],
  "repositorySnapshot": {}
}
```

The final schema may refine field shapes but must preserve these responsibilities.
`observedChecks` records only separately approved commands actually run (or explicit
skips), their exit status, redacted relevant output, and verification depth; it must
never turn an unrun check into a success. State must not contain raw grill transcripts,
secrets, credentials, or captured private source contents.

## 7. Generated document contracts

Generated documents have stable semantic requirements but flexible section layouts.
Omit irrelevant sections rather than filling them with boilerplate. Preserve a
compatible existing structure when reconciling project-owned documentation.

### Artifact visibility

The initializer has one always-public artifact, one always-local class, and one
explicit developer-selected workspace policy:

- **Always public and version-controlled:** root `AGENTS.md`. It describes safe
  repository context and mode-appropriate planning behavior without exposing raw
  interview transcripts, credentials, secrets, or `.repo-charter/` state.
- **Always local-only and ignored:** `.repo-charter/`, credentials, secret-bearing
  environment files, and machine-specific state.
- **`local-planning` (recommended):** `PLAN.md`, `TODO.md`, selected native adapters
  (`CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`), and selected agent
  rule directories are local-only and ignored. This protects a developer's active plan,
  task ledger, and personal agent configuration.
- **`shared-planning`:** `PLAN.md`, `TODO.md`, selected native adapters, and selected
  agent rule directories are public and version-controlled alongside `AGENTS.md`.
  This supports shared planning after cloning; `.repo-charter/` remains local-only.

The developer confirms one mode during the grill; RepoCharter never infers it from
existing files. RepoCharter reconciles a clearly marked `.gitignore` block matching
that mode and must never add `AGENTS.md` or shared-planning artifacts to its
local-workspace block. For a target npm package it also inspects `.npmignore` and
`package.json` `files` allowlists, warns about possible unintended inclusion, and
requires approval before any relevant ignore-file write. It never automatically runs
`git rm --cached` or otherwise untracks an existing project file; a mode switch that
would require untracking is reported with safe manual instructions after explicit
developer review.

### `AGENTS.md`

`AGENTS.md` is the public, vendor-neutral repository contract and authoritative
instruction source. Target approximately 150-250 lines, adjusted when project
complexity genuinely requires it. Include applicable content for:

- shareable project purpose and repository map;
- module ownership and public collaboration boundaries;
- architecture and important data/control flows;
- verified install, development, lint, test, build, and deployment commands;
- domain, data, security, privacy, and authorization invariants;
- coding and testing conventions evidenced by the repository;
- the local `PLAN.md` and `TODO.md` operating protocol, including safe bootstrap when
  they are absent from a fresh clone;
- task ownership, overlapping-edit avoidance, and handoff rules;
- evidence required before completion claims;
- safe-change and conflict rules;
- known limitations, blockers, and open questions.

Large public architecture or repository detail belongs in focused public reference
material. In `local-planning`, developer-specific planning detail belongs only in local
`PLAN.md`; the root contract must state that local planning files and adapters are
uncommitted and direct an agent to ask the developer to initialize or resume
RepoCharter when they are absent. In `shared-planning`, the root contract requires
`PLAN.md` and `TODO.md` as committed shared sources of truth. Both forms must describe
collaboration outcomes without assuming that every agent platform exposes subagent or
delegation tools.

### Agent-native adapters

Agent-native instruction files and rules are first-class **entry points** into the
agent-ready environment, not optional decoration. For every selected agent, the tool
must generate or verify a documented instruction surface that reliably leads the agent
through this required workflow:

```text
local native agent entry point -> public AGENTS.md -> local PLAN.md + TODO.md -> scoped work and verification
```

The native entry point must establish that the agent reads the public contract before
repository changes, then follows the mode-classified plan and ledger for approved scope,
next-task selection, verification, and handoff. In `local-planning`, when local
planning is absent it must ask the developer to initialize or resume RepoCharter rather
than creating or committing planning files without approval. In `shared-planning`, it
must read the committed plan and ledger. A thin adapter means a small non-duplicated
bridge—not a lower-priority file or an excuse to omit this workflow.

Always generate the public root `AGENTS.md`, regardless of which agent is selected.
Generate additional entry files only for selected agents and only when the agent needs
a native adapter to discover or reliably follow that contract. They are local-only in
`local-planning` and public in `shared-planning`. Do not create every supported agent's
directory in every client repository.

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
consult local `PLAN.md` and `TODO.md` before work when they exist. Compatibility behavior must be backed by
current official documentation and agent-specific evaluation. The project must not
assume that all platforms interpret imports, pointers, precedence, or nested
instructions identically.

### `PLAN.md`

`PLAN.md` records durable project truth rather than progress. It is local-only in
`local-planning` and committed in `shared-planning`. It must capture relevant decisions
and rationale, architecture, persistence, workflows, interfaces, security, operations,
explicit exclusions, build order, observable gates, assumptions, and open questions.
Developer-approved future scope may be recorded when it affects present architecture,
but it must not be mistaken for implemented behavior.

### `TODO.md`

`TODO.md` is derived from `PLAN.md` and acts as the execution ledger. It is local-only
in `local-planning` and committed in `shared-planning`. It contains ordered
implementation-grade tasks, dependencies, blockers, and phase gates. Existing
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
research, and must be disclosed separately from local inspection. In
`local-planning`, local-only generated artifacts must be protected by approved ignore
configuration before creation and must not be copied into public `AGENTS.md`, logs,
package metadata, or package contents. In `shared-planning`, only the always-local
class receives that protection; public documents remain subject to the developer's
normal repository and package-publication decisions.

## 9. Ownership, conflicts, and reconciliation

Every target artifact is classified before mutation:

- `missing`: safe to propose creating;
- `owned-current`: tool-generated and unchanged since the recorded version;
- `owned-modified`: tool-generated but subsequently edited;
- `compatible-existing`: project-owned content that can remain without conflict;
- `merge-required`: overlapping instructions or planning truth require judgment;
- `blocked`: unsafe, invalid, or impossible to reconcile automatically.

The tool must never silently overwrite ambiguous non-empty files. Managed sections may
be used for agent entry adapters and the mode-specific `.gitignore` workspace block.
Public `AGENTS.md` and mode-classified `PLAN.md`/`TODO.md` require content-aware,
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
2. developer-confirmed workspace mode, public/local artifact classification, managed
   ignore coverage, and the rule that `AGENTS.md` is not ignored by RepoCharter's
   managed block;
3. selected agent entry-point presence, canonical routing, and tested compatibility
   under the selected mode;
4. public `AGENTS.md` completeness, mode-appropriate bootstrap instructions, and
   absence of raw transcripts, secrets, and `.repo-charter/` state;
5. `PLAN.md` durable concepts, assumptions, exclusions, and unresolved decisions when
   required by the selected mode;
6. traceability between plan build stages, TODO phases, tasks, and gates when required
   by the selected mode;
7. unsupported or contradictory completion claims;
8. stale repository paths, facts, and documented commands where deterministically
   detectable;
9. results of separately selected repository checks.

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
- existing `.gitignore`, `.npmignore`, and `package.json` `files` allowlists;
- both `local-planning` and `shared-planning` artifact sets for every selected adapter;
- a mode switch and an already tracked artifact requiring manual migration guidance;
- Windows and POSIX path behavior.

Fixtures must verify dry-run, interruption, resume, atomicity, conflict preservation,
redaction, validation exit statuses, and a no-diff second initialization.

### Supported-agent behavior evaluation

For every claimed agent, use a fresh context against a generated fixture and verify
that it can:

1. load its selected native entry point and follow it to the canonical `AGENTS.md`;
2. explain the project correctly;
3. identify the next approved task from `TODO.md` after consulting `PLAN.md` in
   `shared-planning`, or safely request local initialization when those files are
   absent in `local-planning`;
4. find the relevant modules and commands;
5. surface a deliberately out-of-scope request;
6. make a small scoped change and run appropriate verification;
7. update local `TODO.md` with honest evidence;
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
- `examples/`: realistic, explicitly fictional workflow outputs. Existing example
  bodies are preserved; only minimal appended visibility notes identify whether each
  scenario uses `local-planning` or `shared-planning` and which artifacts are
  committed.

### Deferred public repository context

After the local-workspace lifecycle is proven, RepoCharter may generate or reconcile
additional public repository context for anyone cloning a repository, such as a
repository map, architecture and data-flow references, domain glossary, command
reference, and decision records under a deliberate public path such as
`docs/agent-context/`. This later work must derive only shareable repository facts,
link from public `AGENTS.md`, use evidence and approval gates, and never promote
`local-planning` artifacts, `.repo-charter/` state, or private interview answers into
public context. Graph-based codebase mapping is deferred until its source data, update cost,
privacy boundary, and agent-consumption contract are specified.

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
   a public project-specific `AGENTS.md`, local evidence-based `PLAN.md`, local
   traceable `TODO.md`, and safe conflict classifications with a no-diff second
   application.
5. **Agent adapters and installable skill** -> gate: skill validation passes and each
   claimed local adapter passes its supported-agent behavior evaluation with
   limitations recorded.
6. **Validation and developer handoff** -> gate: `check` reports deterministic errors
   and advisory warnings correctly, and completed setup prints the exact change set,
   verification evidence, blockers, and next approved task.
7. **Workspace visibility modes** -> gate: fixture initialization preserves a public
   `AGENTS.md`; applies the developer-confirmed `local-planning` or `shared-planning`
   policy to plans, ledgers, selected adapters, and rules; always protects
   `.repo-charter/`; never automatically untracks existing files; and reports
   npm-package inclusion risks accurately.
8. **Preview distribution** -> gate: the packed `0.1.0` npm artifact installs and
   completes documented local-planning and shared-planning workflows in clean Windows,
   macOS, and Linux environments.
9. **Deferred public repository context** -> gate: only after preview behavior is
   proven, evidence-backed public context generation has an approved privacy model,
   update contract, and fresh-agent usefulness evaluation.

## 14. Release acceptance criteria

The first preview is usable only after observing all of the following:

- clean installation from the packed npm artifact;
- initialization of representative new and existing repositories;
- zero-write dry-run behavior;
- preservation and accurate reporting of conflicts;
- interruption and resume from persisted safe state;
- idempotent second initialization;
- valid detailed public project-specific `AGENTS.md` with mode-appropriate planning
  behavior;
- developer-approved evidence-based `PLAN.md` and matching traceable `TODO.md` whose
  visibility matches the developer-confirmed mode;
- selected adapters and rule directories whose visibility matches the developer-
  confirmed mode;
- `.repo-charter/` protected from public exposure in both modes;
- verified native behavior for every claimed supported agent;
- no secret contents in state, logs, or generated output;
- passing fresh-agent behavior evaluations;
- verified Windows, macOS, and Linux path behavior;
- exact final reporting and next-task identification.

## 15. Confirmed assumptions and deferred decisions

- The developer runs the conversation-led flow through a capable coding agent; manual
  CLI use produces a handoff rather than launching or authenticating an agent.
- One primary agent and optional secondary agents are selected per repository.
- A public root `AGENTS.md` is always generated or reconciled. The developer confirms
  `local-planning` or `shared-planning` before plans, ledgers, selected native agent
  files, and rules are generated; nested files are explicitly approved follow-up work
  when monorepo boundaries genuinely require different instructions.
- Confirmed interview decisions are retained through mode-classified `PLAN.md` and
  safe structured state; raw conversations are not retained.
- `.repo-charter/`, credentials, secret-bearing environment files, and machine-
  specific state are always local-only regardless of workspace mode.
- Public repository context beyond `AGENTS.md` is deferred until after the preview;
  it must be independently evidence-backed, approved, and safe to share.
- Repository verification depth is selected during setup, defaulting to static
  inspection plus existing non-destructive checks proposed for approval.
- `repo-charter@0.1.0` passed an authenticated public npm publication dry-run; it
  remains unpublished until explicitly authorized.
- Exact native adapter formats and import strategies remain evidence-driven and may
  change as supported agent documentation and behavior evolve.
