# RepoCharter: Learning Guide

This guide explains what RepoCharter is intended to become, why it is designed
this way, and how its major pieces will work together. It is written for learning and
orientation; [PLAN.md](./PLAN.md) remains the authoritative product and architecture
contract, while [TODO.md](./TODO.md) remains the authoritative implementation ledger.

## 1. Current state versus intended product

This distinction is essential.

### What exists now

The repository currently contains:

- the approved product plan and ordered implementation ledger;
- this learning guide and fictional planning/agent-contract examples;
- a Node.js 22+ ESM package and local `repo-charter` CLI;
- Phase 1 safe path resolution, atomic writes, ownership primitives, dry-run, and
  packed-artifact tests; and
- Phase 2 bounded static inspection, evidence records, candidate-command detection,
  redaction, and human/JSON inspection output; and
- Phase 3 agent registry, validated primary/secondary selection, safe session manifests,
  changed-file reinspection, and manual/JSON planning handoff; and
- Phase 4 evidence-aware project grill, decision frontier, contradiction handling,
  shared-understanding confirmation, and safe approved-specification primitives; and
- Phase 5 canonical document generation, conflict classification, preview summaries,
  explicit per-file reconciliation, atomic approved application, and idempotent reruns;
  and
- Phase 6 primary-source native-surface research, selected-agent adapter planning,
  compatibility diagnostics, and the installable RepoCharter workflow skill; and
- Phase 7 read-only integrity/document/adapter validation, stale-fact advice,
  observed-check recording, final reports, and human/JSON exit-code coverage.

The package is not published and the full setup workflow is not implemented yet. The
active coding agent still conducts the interview, and public CLI orchestration of an
approved specification remains planned work. Agent compatibility is not behavior-
verified for any target. Commands and generated-file examples in this guide describe
the approved design unless explicitly identified as implemented.

### What the project will become

RepoCharter will be a local-first initializer invoked with:

```bash
npx repo-charter init
```

It will inspect a repository, help a coding agent interview the developer about
project intent, generate project-specific collaboration and planning documents, apply
only approved changes, validate the result, and identify the next approved task.

The goal is not simply to create Markdown files. The goal is to give future coding
agents enough accurate context and process discipline to make useful changes without
inventing scope, losing decisions, or claiming unverified completion.

## 2. The problem this tool addresses

AI coding agents often begin with incomplete context. They can inspect code, but code
alone does not reliably reveal:

- why the product exists;
- who it serves;
- which capabilities are intentional or accidental;
- what should be built next;
- which future requirements affect today's architecture;
- which rules are security or business invariants;
- which commands are authoritative;
- what has actually been verified;
- how work should be handed to another agent.

Developers frequently compensate by repeating long prompts in every session. Those
prompts drift, omit decisions, and disappear when the conversation ends. Some teams
create an `AGENTS.md`, `CLAUDE.md`, or planning document, but those files may be
generic, duplicated across agents, or disconnected from actual repository evidence.

RepoCharter addresses this by combining four things:

1. **Inspection**: learn what can be established from the repository.
2. **Interview**: ask the developer only for intent that cannot be inferred safely.
3. **Durable documents**: record approved project truth and execution state.
4. **Validation**: prove that the setup is internally consistent and usable.

## 3. The core design principle: three authorities

The design separates responsibilities among three authorities.

### The CLI owns deterministic work

The CLI is responsible for operations that should produce the same result from the
same inputs:

- resolving paths;
- inspecting files safely;
- detecting manifests and commands;
- recording structured evidence;
- tracking setup stages;
- classifying file ownership and conflicts;
- calculating proposed changes;
- writing approved files atomically;
- checking integrity and traceability.

These tasks should not depend on an agent improvising filesystem logic each time.

### The coding agent owns contextual reasoning

The active agent is responsible for tasks that require judgment:

- deciding which repository facts matter;
- asking adaptive questions;
- noticing contradictions;
- explaining tradeoffs;
- connecting future scope to present architecture;
- drafting project-specific instructions and plans;
- presenting a shared-understanding summary.

The agent uses the CLI's evidence instead of rediscovering the repository through an
unstructured conversation.

### The developer owns intent and approval

The developer remains authoritative about:

- product goals;
- scope and exclusions;
- architectural tradeoffs that evidence cannot decide;
- conflict resolution;
- acceptable verification depth;
- approval of durable project documents.

This prevents both blind automation and repetitive manual setup.

## 4. End-to-end initialization lifecycle

The intended lifecycle is a staged transaction:

```text
Developer invokes setup
        |
        v
CLI inspects repository safely
        |
        v
Developer selects primary and secondary agents
        |
        v
CLI produces structured evidence and an agent handoff
        |
        v
Agent conducts a dependency-aware project grill
        |
        v
Developer confirms shared understanding
        |
        v
Agent proposes AGENTS.md, PLAN.md, TODO.md, and adapters
        |
        v
Developer resolves conflicts and approves changes
        |
        v
CLI applies approved files atomically
        |
        v
CLI validates the completed setup
        |
        v
CLI reports exact changes and the next task
```

Each stage has a completion condition. The tool persists enough safe state to resume
after interruption without falsely treating an incomplete stage as finished.

## 5. Stage 1: repository inspection

Inspection answers factual questions before the developer is asked anything.

### What the inspector looks for

Examples include:

- languages and runtime versions;
- frameworks;
- package managers and lockfiles;
- source and test directories;
- monorepo packages;
- lint, type-check, test, build, and development commands;
- database schemas and migrations;
- CI workflows;
- containers and deployment configuration;
- README, architecture, decision, and planning documents;
- existing agent instructions;
- Git repository and worktree state.

### Evidence, not guesses

Every useful conclusion belongs to one of three categories:

| Category | Meaning | Example |
| --- | --- | --- |
| Observed | Supported by repository evidence | `package.json` defines `npm test` |
| Developer-approved | Confirmed product intent | Email delivery is excluded from MVP |
| Unknown | Not safely determined yet | Whether resolved requests may reopen |

This distinction prevents a common failure: describing intended features as if they
already exist, or treating an existing file as proof that its behavior works.

An evidence record will conceptually contain:

```json
{
  "fact": "The test command is npm test",
  "classification": "observed",
  "source": "package.json",
  "confidence": "high"
}
```

The exact schema will be finalized during implementation.

## 6. Inspection safety and privacy

The tool analyzes real repositories, so inspection must have a strict boundary.

By default it will:

- respect `.gitignore`;
- skip dependency directories and build outputs;
- avoid real `.env` files, credentials, private keys, and binary contents;
- inspect `.env.example` variable names without collecting secret values;
- limit the number and size of files it reads;
- redact token-like values from captured command output;
- keep analysis local;
- execute no package scripts merely to inspect a repository.

Finding a command is different from running it. For example, inspection may observe
that `package.json` defines `npm test`. Running that command happens later, under the
developer's approval or the active agent's established permission model.

No telemetry or repository-content upload belongs in the initial product.

## 7. Stage 2: coding-agent selection

The developer selects:

- one primary coding agent;
- zero or more secondary agents.

The primary agent determines the preferred conversation handoff and validation path.
Secondary selections determine which additional native entry files are needed.

A root `AGENTS.md` is always generated because it is the vendor-neutral project
contract. The initializer does not create directories for every supported agent.

## 8. Canonical instructions and native adapters

Maintaining the same full policy in many files creates drift and wastes agent context.
The design therefore uses one authoritative project contract with minimal adapters.

### Native files are the required entry layer

A selected agent must have a verified instruction surface that reliably brings it into
the repository's shared operating system. Native files and platform-specific rules are
therefore first-class entry points, not optional decoration:

```text
native agent entry point -> AGENTS.md -> PLAN.md + TODO.md -> scoped work and verification
```

The entry file must make the agent consult `AGENTS.md` before repository changes, then
use `PLAN.md` for durable scope and `TODO.md` for the next approved task and verified
progress. A thin adapter is still essential: “thin” describes its non-duplicated
content, not its importance. Optional path-scoped platform rules add behavior that the
root contract cannot express; they supplement rather than replace the canonical flow.

### Default generation matrix

| Selected agent | Default generated project file |
| --- | --- |
| Generic consumer | `AGENTS.md` |
| Codex | No file beyond `AGENTS.md` |
| Claude Code | Thin `CLAUDE.md` routing to `AGENTS.md` |
| Gemini CLI | `GEMINI.md` importing `AGENTS.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Cursor | No file beyond `AGENTS.md` |
| Windsurf | No file beyond `AGENTS.md` |

### Why `.claude/rules/` is optional

Claude-specific rule files are appropriate when the repository needs genuine modular
or path-scoped Claude behavior. They should not be created merely to duplicate the
root contract. A normal Claude setup should need only a thin `CLAUDE.md` adapter.

### Why `.codex/rules/rules.md` is excluded

Codex project instructions belong in `AGENTS.md`. The initializer must not assume
that Markdown under `.codex/rules/` is an equivalent instruction mechanism. A future
`.codex` artifact is allowed only for a separately verified Codex-native purpose.

### Why Cursor and Windsurf do not get directories by default

Both are intended to rely on verified root `AGENTS.md` behavior. Their native rule
directories are generated only when platform-specific activation or scoping provides
a necessary behavior that the root contract cannot express reliably.

## 9. Stage 3: conversation handoff

The planning interview happens inside a coding-agent conversation, not inside a fixed
terminal questionnaire.

When an agent runs the CLI, it can consume structured JSON evidence. When a developer
runs the command manually, the CLI prints an exact prompt and points to safe evidence
that can be pasted into the selected agent.

The handoff tells the agent:

- which facts are already known;
- which agents were selected;
- which questions remain unresolved;
- how to conduct the interview;
- which privacy and approval constraints apply;
- what specification must be produced afterward.

This boundary keeps the CLI deterministic without reducing the interview to a rigid
form.

## 10. Stage 4: the project grill

The grill is a dependency-aware design interview.

### Decision tree and frontier

Some decisions depend on earlier answers. For example, detailed database questions
make little sense before deciding whether the product needs persistence. The agent
therefore models decisions as a tree and asks the current **frontier**: every question
whose prerequisites are already settled.

Each round should:

1. ask every currently unblocked decision;
2. explain the tradeoff;
3. recommend an answer;
4. wait for the developer;
5. recompute the next frontier.

### Topics the grill covers

When applicable:

- goals and users;
- current state and pain;
- MVP scope and exclusions;
- workflows and domain rules;
- architecture and technology constraints;
- data, privacy, security, and authorization;
- integrations and deployment;
- quality and verification expectations;
- future scope affecting present design;
- risks, assumptions, dependencies, and open questions.

The agent should not ask the developer for facts it can inspect. It should challenge
contradictions and vague success criteria rather than silently choosing an
interpretation.

### Approval gate

At the end, the agent presents a complete shared-understanding summary. Durable files
are proposed only after the developer confirms that summary. The raw conversation is
not stored.

## 11. Generated project documents

### `AGENTS.md`: operating contract

This file teaches supported agents how to work in the repository. It should normally
contain:

- project purpose and current phase;
- repository map and ownership boundaries;
- architecture and important flows;
- verified commands;
- domain and security invariants;
- coding and testing conventions supported by evidence;
- planning and TODO workflow;
- concurrent task ownership and handoff rules;
- required verification evidence;
- limitations, blockers, and open questions.

The target is approximately 150-250 lines. Longer product design belongs in
`PLAN.md`; large references belong in focused documents. This protects the context
budget because agent instructions may be loaded on every request.

### `PLAN.md`: durable project truth

The plan answers:

- What are we building and why?
- What architecture and constraints are approved?
- Which workflows and invariants must remain true?
- What is excluded?
- In what order should implementation proceed?
- What observable gate completes each stage?

It is not a changelog and should not be rewritten after every small task.

### `TODO.md`: execution ledger

The ledger answers:

- What work is complete?
- What is pending?
- What is blocked?
- What is the next approved task?
- Which phase gates have actually passed?

Tasks are checked only after implementation and verification. Existing repositories
may receive a concise completed baseline, but only when real evidence supports it.
The tool must not invent a fictional development history.

## 12. Ownership and conflict model

Before changing any target file, the tool classifies it:

| Classification | Meaning |
| --- | --- |
| `missing` | The file does not exist and may be proposed safely |
| `owned-current` | Tool-generated content still matches recorded ownership |
| `owned-modified` | Tool-generated content was edited after generation |
| `compatible-existing` | Project-owned content can remain without conflict |
| `merge-required` | Overlapping durable content needs human judgment |
| `blocked` | The file cannot be reconciled safely |

The developer sees the full proposed change set. Safe files can be approved together;
ambiguous files require individual decisions.

### Managed sections versus semantic documents

Small native adapters may use managed markers because their tool-owned boundary is
clear. `PLAN.md` and `TODO.md` are different: they contain project-owned meaning and
require content-aware reconciliation. Blindly replacing a marked block could erase a
developer's decisions or falsify progress.

### Atomicity and idempotency

An **atomic write** either completes or leaves the original intact. The CLI writes a
temporary sibling, validates it, and then replaces the final path safely.

**Idempotency** means that running initialization again against an unchanged completed
repository produces no additional diff. This is a core trust property for setup tools.

## 13. Resumable session model

Initialization may pause while the developer answers questions. Safe state under
`.repo-charter/` records:

- schema and package versions;
- current stage;
- selected agents;
- confirmed decisions;
- template versions;
- managed artifact hashes;
- safe repository snapshot metadata.

Conceptually:

```json
{
  "schemaVersion": 1,
  "packageVersion": "0.1.0",
  "stage": "inspected",
  "selectedAgents": {
    "primary": "codex",
    "secondary": ["claude-code"]
  },
  "confirmedDecisions": {},
  "templateVersions": {},
  "managedArtifacts": {},
  "repositorySnapshot": {}
}
```

On resume, the CLI checks whether relevant files changed. A changed file invalidates
affected evidence and is reinspected. The manifest never stores raw transcripts,
secrets, or unnecessary source bodies.

## 14. Technical implementation walkthrough

This section describes the **planned implementation mechanics**, not code that exists
in this repository today. It turns the product contract in [PLAN.md](./PLAN.md) into a
technical model an implementer can follow. Where the plan deliberately leaves a choice
open—for example ESM versus CommonJS, exact library selection, or internal type
shapes—this guide names the boundary instead of pretending that choice has been made.

### Planned module boundaries and dependency direction

The initial implementation is intended to be a Node.js 22+ command-line package. Its
modules have deliberately narrow responsibilities:

```text
bin/repo-charter
        |
        v
src/cli                 parse command and orchestrate the use case
   |---------|----------|-----------|------------|
   v         v          v           v            v
filesystem inspection  session   generation  validation
                                     |
                                     v
                                 conflicts
```

- `bin/` should do almost nothing beyond starting the package's CLI entry point and
  forwarding arguments.
- `src/cli/` coordinates a command such as `init`; it should not contain low-level
  path traversal, template parsing, or direct file replacement logic.
- `src/filesystem/` owns path containment checks, temporary-file lifecycle, and
  atomic replacement. Every module that writes must use it rather than calling write
  APIs independently.
- `src/inspection/` produces evidence from bounded reads. It does not run package
  scripts or decide product intent.
- `src/session/` persists only the safe, resumable state necessary to continue the
  workflow.
- `src/generation/` converts confirmed evidence and decisions into proposed artifacts;
  it should be pure or close to pure until the approved apply step.
- `src/conflicts/` compares proposed artifacts with current files and managed-history
  metadata; it classifies rather than silently resolving ambiguity.
- `src/validation/` checks the resulting contract and reports errors or warnings. It
  must not mutate the target repository.

This direction is intentional: higher-level workflow modules depend on lower-level
safe operations, but the filesystem layer does not depend on templates, agents, or
product-specific interview logic. The installable skill will call the CLI rather than
reimplement these modules.

### A planned `init` execution trace

A successful initialization is a transaction-like sequence with distinct read, decide,
and write boundaries:

```text
arguments
  -> resolve target directory
  -> inspect safe repository surface
  -> select agents and create/resume safe session state
  -> produce agent handoff and collect approved specification
  -> generate proposed artifacts in memory
  -> classify conflicts and preview the complete change set
  -> obtain explicit approval for each ambiguous outcome
  -> atomically apply approved artifacts
  -> validate the final state
  -> report changes, observed checks, blockers, and next TODO task
```

The key technical property is that no later stage is recorded as complete until its
completion condition is satisfied. For example, an `approved` session must not appear
in the manifest merely because an interview began, and a failed write must not leave a
manifest claiming a document was applied.

`--dry-run` follows the portion of this trace that is calculable without writes. It
must render the same proposed changes while creating neither output artifacts nor a
session manifest. `check` uses inspection and validation only. `resume` reloads a
prior incomplete manifest, verifies the safe repository snapshot, and invalidates
conclusions affected by changed files before proceeding.

### Inputs, internal records, and outputs

The tool has three conceptually different kinds of information. Keeping them separate
prevents the system from confusing source facts with intent or generated text.

| Record | Produced by | May contain | Must not contain |
| --- | --- | --- | --- |
| Evidence | static inspection | source path, kind, classification, confidence, freshness metadata, safe derived facts | unnecessary file bodies, secret values, claims not supported by evidence |
| Confirmed decision | developer through agent interview | product intent, exclusions, chosen tradeoffs, open questions | raw interview transcript or an inferred approval |
| Session manifest | CLI | schema/package versions, stage, selected agents, template versions, managed hashes, safe snapshot metadata | credentials, raw source capture, raw conversation history |
| Proposed artifact | generator | path, generated content, adapter/template version, ownership metadata | permission to overwrite an ambiguous existing file |
| Diagnostic | validator | severity, stable issue identity, relevant safe path, explanation, suggested correction | fabricated test results or unredacted secrets |

An evidence item needs provenance. At minimum, the eventual schema will distinguish
whether a statement was directly observed, approved by the developer, or is still
unknown. A generator can then say “the repository defines this command” differently
from “the developer selected this workflow.”

### Bounded repository inspection

Inspection is planned as a deterministic read pipeline, not a general code-execution
engine:

1. Resolve the requested target to an absolute directory using Node's path APIs.
2. Walk only eligible paths, respecting `.gitignore` and explicit limits.
3. Reject hard-excluded categories before parsing: dependency trees, caches, build
   output, binaries, private keys, credentials, and real environment files.
4. Apply file-count and byte-size limits; report skipped paths and the reason rather
   than quietly treating skipped content as absent.
5. Read only formats needed for safe detectors, such as package manifests, lockfiles,
   conventional configuration, CI definitions, and known documentation names.
6. Extract small facts—commands, runtime declarations, directory boundaries, or
   framework indicators—alongside their source paths and confidence.
7. Redact token-like values before data reaches human output, JSON output, or session
   storage.

The detectors are evidence accumulators. For example, a package manifest and a lockfile
can establish a likely package manager; a workflow can provide a candidate test command.
Neither proves that the command succeeds. That distinction is why the CLI will report
candidate/observed commands and separately record commands that were actually run.

### Session state and safe resumption

The manifest under `.repo-charter/` is planned as a versioned state machine. A
possible high-level transition model is:

```text
no session -> inspected -> agents selected -> handoff ready
           -> decisions confirmed -> changes approved -> applied -> validated
```

The exact stage names may evolve, but transitions must be one-way unless a safe
invalidation moves the workflow back to an earlier evidence-dependent stage. Resume
works from persisted metadata, not by trusting stale conclusions:

1. Load and schema-check the manifest.
2. Compare the current safe file snapshot with the recorded snapshot.
3. Determine which evidence records, proposed artifacts, or approval decisions depend
   on changed paths.
4. Reinspect only affected safe paths or return to an earlier stage when the change
   invalidates the prior decision boundary.
5. Require a new preview/approval when regenerated output differs materially.

The snapshot should describe files safely—for example, paths and metadata or hashes as
appropriate—without turning `.repo-charter/` into a copy of the repository.

### Safe writes, ownership, and reconciliation

The write layer is planned to treat repository content as untrusted and potentially
valuable. An apply operation should follow this shape:

1. Construct the complete approved content before touching the final target.
2. Revalidate that the final path remains within the selected repository and has not
   become an unsafe target.
3. Write a uniquely named temporary sibling in the target directory.
4. Flush/close the temporary file as required by the final implementation, then
   replace the target using a Node-supported operation suitable for the platform.
5. Record ownership metadata only after the replacement succeeds.
6. On failure, preserve the original and remove only a temporary file known to belong
   to this tool.

A managed artifact will be identified by versioned metadata and a content hash. Those
records make the meaningful ownership distinctions possible:

```text
missing                 no target exists
owned-current           target matches the managed version
owned-modified          target differs from the managed version
compatible-existing     project-owned target can remain unchanged
merge-required          overlapping meaning needs developer judgment
blocked                 safe reconciliation is impossible
```

Native adapters can sometimes use an explicitly delimited managed section because
there is a small, tool-owned boundary. Semantic documents such as `PLAN.md` and
`TODO.md` cannot safely be treated as replaceable templates: their content represents
project decisions and verified progress. Future template updates therefore need
three-way comparison between the last installed managed version, the current file,
and the new proposal, followed by developer approval for a meaningful conflict.

### Generation and validation pipeline

Generation should first produce an in-memory artifact plan. For each intended output,
it identifies its path, purpose, source evidence/decisions, template version, and
proposed content. Conflict classification then runs before any write. This permits the
CLI to give the developer one complete preview rather than interleaving irreversible
writes with questions.

Validation is a separate read-only pass over the manifest, generated files, and safe
current repository evidence. Its planned layers are:

1. parse and schema-check manifest/session state;
2. verify managed hashes and expected artifacts;
3. verify selected-agent entry points and canonical routing;
4. check required concepts in `AGENTS.md`, `PLAN.md`, and `TODO.md`;
5. check traceability from plan stages to TODO phases, tasks, and gates;
6. detect contradictions and unsupported completion claims where deterministic;
7. compare documented paths/commands with safe current evidence; and
8. include separately approved project-check results, distinguished from checks that
   were only proposed or skipped.

Diagnostics must preserve the difference between an **error** (integrity, safety, or
contract failure that makes `check` non-zero) and a **warning** (advisory drift or a
non-deterministic concern). The final report is an observable record, not a generic
“success” message.

### Packaging, runtime, and test strategy

The package will target Node.js 22+ and npm distribution. Phase 1 will make the still
open implementation choices that belong to package setup, including the module system
and the minimum lint/test tooling. Until that task is completed, this guide does not
claim TypeScript, JavaScript, a test runner, a bundler, or a dependency list as an
implemented decision.

The planned verification stack is layered because the risk is layered:

| Layer | Purpose | Representative checks |
| --- | --- | --- |
| Unit | Verify isolated pure logic | path containment, state transitions, ownership classification, redaction |
| Integration | Verify modules together in temp fixtures | dry run has no writes, failed writes preserve originals, resume reinspects changes |
| Package | Verify the distributed artifact | `npm pack`, isolated install, binary help/dry-run/base-init paths |
| Behavior | Verify downstream agent outcomes | agent understands generated contract, stays in scope, verifies work, updates ledger honestly |
| Platform | Verify OS-sensitive behavior | Windows and POSIX path handling; clean installation on Windows, macOS, Linux |

Tests must create isolated fixture directories rather than using the development
repository as a target. In particular, safety tests should assert the negative
properties the product promises: no project scripts executed during inspection, no
writes during dry-run or `check`, no secret values in output/state, no overwrite of
unapproved content, and no diff after an unchanged second initialization.

## 15. CLI design

The initial public interface is planned as:

```text
repo-charter init [path]
repo-charter check [path]
repo-charter resume [path]
```

Options include:

```text
--dry-run
--primary-agent <agent>
--agents <agent,...>
--json
--non-interactive
```

### Command responsibilities

- `init` starts or continues initialization.
- `resume` explicitly resumes an incomplete staged session.
- `check` validates without writing.
- `--dry-run` calculates changes without writing any repository or session files.
- `--json` gives agents structured output and stable exit behavior.
- `--non-interactive` works only when all required decisions are supplied and no
  conflict requires human judgment.

Internal inspection and application operations may exist without becoming stable
public APIs in the preview release.

## 16. Validation model

Validation operates in layers:

1. manifest schema and session consistency;
2. ownership hashes and managed-file integrity;
3. selected agent entry points;
4. `AGENTS.md` completeness;
5. `PLAN.md` durable decisions and open questions;
6. TODO-to-plan traceability;
7. unsupported completion claims;
8. stale paths, facts, or commands where detectable;
9. separately approved project checks.

Errors and warnings are different. Broken ownership, unsafe state, or a violated
document contract should fail `check`. A subjective documentation preference should
remain advisory.

The final report lists every created, modified, unchanged, skipped, and conflicted
file; commands actually run; observed outcomes; unresolved blockers; and the first
actionable unchecked task.

## 17. Testing strategy

The project needs more than ordinary unit tests because it handles untrusted and
highly varied repositories.

### Repository fixtures

Planned fixtures include:

- empty directory;
- new and existing Node.js applications;
- Python application;
- mixed-language monorepo;
- compatible and conflicting agent files;
- existing planning documents;
- dirty Git worktree;
- non-Git directory;
- ignored secrets and oversized files;
- Windows and POSIX path behavior.

They will test inspection, redaction, conflict preservation, dry-run, atomicity,
interruption, resume, validation statuses, and idempotency.

### Agent behavior evaluations

Each officially supported agent must be tested in a fresh context. It should be able
to explain the generated project, identify the next task, locate relevant modules,
surface out-of-scope work, make and verify a small change, update the ledger honestly,
and hand work off.

This is crucial: syntactically valid Markdown is not proof that the setup improves
agent behavior.

## 18. Implementation roadmap

The planned phases are deliberately ordered by risk.

### Phase 1: filesystem foundation — completed

The Node.js 22+ package, CLI surface, safe path handling, atomic writes, ownership
primitives, dry-run, base fixtures, and packed-artifact verification are implemented.

### Phase 2: repository inspection — completed

The evidence schema, bounded discovery, stack and command detection, protected-content
exclusions, redaction, representative fixtures, and human/JSON inspection output are
implemented. Inspection remains static: it detects candidate commands but does not run
them.

### Phase 3: agents and resumable state — completed

The agent registry, primary/secondary selection, versioned safe manifest, stage
transitions, changed-file reinspection, conversation handoff, and interruption/resume
tests are implemented. Compatibility remains unverified until the later agent behavior
evaluation phase.

### Phase 4: project grill — completed

The decision tree, complete-round frontier questioning, contradiction handling,
shared-understanding approval, and machine-readable approved-specification primitives
are implemented. The active coding agent uses the handoff to conduct the conversation;
raw transcripts are intentionally not persisted.

### Phase 5: document generation — completed

Canonical `AGENTS.md`, `PLAN.md`, and `TODO.md` generators now synthesize approved
decisions and observed evidence. The internal generation path classifies missing,
owned-current, owned-modified, compatible-existing, merge-required, and blocked
artifacts; produces human/JSON-safe preview summaries; requires explicit per-file
preserve or reconciled-content decisions for conflicts; and atomically applies only
approved changes. The public CLI does not yet accept an approved specification.

### Phase 6: agent adapters and skill — completed

Primary-source research records documented entry surfaces for all seven target agents.
Selected-agent planning generates only `CLAUDE.md`, `GEMINI.md`, or
`.github/copilot-instructions.md` when required; Codex, Cursor, Windsurf, and generic
selections use root `AGENTS.md`. Compatibility diagnostics distinguish unverified,
stale, degraded, unsupported, unnecessary, and unexpected states. The packaged skill
calls the shared deterministic paths and progressively discloses analysis, grill,
reconciliation, and compatibility guidance. No target is behavior-verified or
advertised as supported until the fresh-agent matrix is fully observed.

### Phase 7: validation and handoff — completed

`check` is now read-only and validates ownership hashes, session shape, selected-agent
entry surfaces, generated contract structure, approved observed-check truth, and
deterministically stale documented paths/commands. Integrity and failed approved checks
are errors; missing in-progress setup documents, unverified compatibility, stale facts,
and skipped checks remain warnings. Human and JSON output include exact artifact
statuses, observed checks, blockers, warnings, and the first unchecked task.

### Phase 8: preview distribution — partially verified

Lifecycle, generated-file, support-status, contribution, verification-status, and
realistic example documentation are present. The curated packed artifact and clean
Windows-local installation were observed. Authenticated npm name eligibility, clean
macOS/Linux installation, fresh-agent behavior evaluations, and explicit publication
authorization remain blocked; Phase 8 is not complete.

See [TODO.md](./TODO.md) for the exact tasks and current progress.

## 19. Important engineering concepts used

### Progressive disclosure

Keep the always-loaded `AGENTS.md` focused. Move detailed product design to `PLAN.md`
and conditional reference material to focused documents. Agents load detail when it
becomes relevant instead of paying the context cost on every request.

### Single source of truth

Each kind of information has one authority:

- `AGENTS.md`: how agents work here;
- `PLAN.md`: what is being built and why;
- `TODO.md`: how far implementation has progressed;
- manifest: what the setup tool owns and which stage it reached;
- repository/configuration: observable implementation facts.

Adapters route agents to the canonical contract rather than duplicating it.

### Evidence provenance

A statement is useful only when its origin is clear. The system distinguishes what it
observed, what the developer approved, and what remains unknown.

### State machine

Initialization has explicit stages and allowed transitions. This prevents an
interrupted interview from being mistaken for an approved configuration.

### Least authority

Inspection begins read-only. The tool gains permission for specific writes or command
execution only when the workflow reaches that requirement and the developer approves.

### Three-way reconciliation

Future updates compare:

1. the previously installed managed version;
2. the repository's current version;
3. the new template version.

This distinguishes upstream template changes from local developer edits.

### Behavioral evaluation

The project evaluates the downstream agent outcome, not only whether files were
created. This is the strongest test of whether generated instructions are useful.

## 20. Worked example

Imagine an existing Next.js project with:

```text
package.json
pnpm-lock.yaml
app/
lib/
tests/
.github/workflows/ci.yml
README.md
```

The developer runs:

```bash
npx repo-charter init --primary-agent codex --agents claude-code
```

The planned behavior is:

1. Detect Next.js, TypeScript, pnpm, test scripts, CI, and existing docs.
2. Skip `.env.local`, `.next/`, `node_modules/`, and binaries.
3. Ask about product goals, current phase, domain rules, deployment intent, future
   scope, and unresolved decisions not established by the repository.
4. Present a shared-understanding summary.
5. After confirmation, propose:

```text
AGENTS.md
CLAUDE.md
PLAN.md
TODO.md
.repo-charter/manifest.json
```

6. Classify every existing target before modifying it.
7. Preview the complete diff and request conflict decisions.
8. Apply approved files atomically.
9. Validate document traceability and adapters.
10. Report the exact changes and the first pending TODO task.

Because Codex uses the root contract, no `.codex/rules/rules.md` is generated. Because
Claude was selected, a thin `CLAUDE.md` routes Claude to the same contract.

## 21. How to read and contribute to this repository

For orientation:

1. Read this guide for the conceptual model.
2. Read [PLAN.md](./PLAN.md) for authoritative decisions and constraints.
3. Read [TODO.md](./TODO.md) for actual progress and the next approved task.
4. Read the example files under `examples/` to see the expected planning style.
5. Inspect implementation files only after the relevant TODO phase begins.

When contributing:

- work from the first relevant unchecked task unless explicitly directed elsewhere;
- update durable architecture in `PLAN.md` only when an approved decision changes it;
- keep `TODO.md` synchronized with real implementation and observed verification;
- preserve unowned repository content;
- test behavior proportionally to the risk of the change;
- never treat planned commands or components as already implemented.

## 22. Glossary

- **Adapter**: a small agent-native file that routes an agent to the canonical project
  contract.
- **Atomic write**: a write that completes fully or preserves the original file.
- **Canonical contract**: the authoritative root `AGENTS.md` for agent behavior.
- **Conflict classification**: the safety category assigned before changing a file.
- **Evidence**: a repository observation with a known source and confidence.
- **Frontier**: every currently answerable decision in the grill's dependency tree.
- **Idempotent**: safe to repeat without producing new changes from identical input.
- **Manifest**: local structured state describing setup stage and managed ownership.
- **Managed artifact**: content the tool can identify as its own through recorded
  metadata and hashes.
- **Native adapter**: an instruction file discovered through a specific agent's own
  supported mechanism.
- **Phase gate**: an observable verification boundary required to complete a phase.
- **Reconciliation**: combining approved generated changes with existing content while
  preserving developer-owned meaning.
- **Redaction**: removing secret-like values from captured or displayed data.
- **Structured evidence**: machine-readable repository facts used by the agent.

## 23. The central idea

The project is best understood as a compiler for agent-ready repository context:

```text
repository evidence + developer decisions + agent compatibility
                              |
                              v
       AGENTS.md + adapters + PLAN.md + TODO.md + manifest
```

Like a compiler, the deterministic layer should reject unsafe or ambiguous input
rather than quietly producing an unreliable result. The coding agent supplies
contextual reasoning, the developer approves intent, and the CLI guarantees that the
approved result is applied and validated consistently.

## 24. Workspace visibility modes

RepoCharter always keeps `AGENTS.md` public. The developer chooses
`local-planning` to keep `PLAN.md`, `TODO.md`, and selected adapters/rules in an
ignored local workspace, or `shared-planning` to commit them for cloned-repository
collaboration. `.repo-charter/`, credentials, secret-bearing environment files, and
machine-specific state remain local in both modes. The choice is confirmed during the
grill, not inferred from existing files; ignore changes are previewed and RepoCharter
never untracks files automatically.
