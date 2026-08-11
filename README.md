# RepoCharter

> A safe, local-first initializer for repositories that will be developed with coding
> agents.

RepoCharter is an open-source Node.js CLI intended to help individual developers
turn a new or existing repository into an **agent-ready development environment**. It
will inspect only safe local repository evidence, hand an adaptive planning interview
to a selected coding agent, generate project-specific collaboration documents, apply
only developer-approved changes, validate the setup, and report the next approved
task.

The goal is not to produce generic Markdown. The goal is to leave a repository with
accurate project context, explicit scope, safe change rules, reliable verification,
and an honest handoff model that multiple agents can follow.

## Status

**Pre-release; not published to npm.** The package name `repo-charter` is
provisional and the intended public command below is not yet available from npm:

```bash
npx repo-charter init
```

**Phases 1 through 7 are implemented.** The current CLI can safely inspect a
repository, initialize and validate ownership state, select one primary and optional
secondary agents, persist a safe resumable session, and emit bounded human or JSON
evidence without executing project code. Its handoff gives the active coding agent a
dependency-aware project grill, contradiction checks, a shared-understanding gate, and
approved-specification primitives. Internal generation APIs produce a canonical
`AGENTS.md`, `PLAN.md`, and `TODO.md`, preview each conflict classification, and apply
only explicit approvals. The packaged RepoCharter skill calls those same deterministic
paths and selected-agent planning produces only documented thin adapters. `check` now
validates setup integrity read-only and prints exact artifacts, observed checks,
blockers, warnings, and the next approved task. No coding-agent compatibility claim is
made.

The approved product contract is in [PLAN.md](./PLAN.md); the verified implementation
status and next task are in [TODO.md](./TODO.md).

## Why this exists

Coding agents can read code, but code alone rarely explains:

- why a product exists and who it serves;
- which features are approved versus accidental;
- which modules own a workflow or security decision;
- which commands are actually authoritative;
- what must be verified before a task is complete;
- what work is next and what is explicitly out of scope; or
- how a second agent can continue safely without reconstructing prior context.

Developers often repeat that context in prompts. Those prompts drift, disappear with a
conversation, and are not consistently shared between agent tools. RepoCharter is
designed to establish durable, project-specific source documents instead.

## Intended workflow

The following is the **planned** end-to-end lifecycle, not current functionality:

```text
Developer runs setup
  -> CLI safely inspects repository evidence without executing project code
  -> developer selects a primary agent and optional secondary agents
  -> CLI gives the selected agent structured evidence and a planning handoff
  -> agent interviews the developer about decisions evidence cannot establish
  -> developer confirms a shared understanding
  -> CLI previews project-specific documents and conflict outcomes
  -> developer approves safe changes and resolves ambiguities
  -> CLI applies approved files atomically
  -> CLI validates the result and reports the next approved TODO task
```

Three authorities remain separate throughout the workflow:

| Authority | Owns |
| --- | --- |
| CLI | deterministic inspection, filesystem operations, state, ownership, and validation |
| Coding agent | adaptive questions, synthesis, contradiction detection, and project-specific drafting |
| Developer | product intent, unresolved tradeoffs, conflict decisions, and approval |

## What is implemented today

Phases 1 through 7 provide a packable Node.js 22+ ESM CLI and installable skill with no runtime dependencies.

### Local development commands

```bash
# Requires Node.js 22 or newer.
node --version

# Syntax-check CLI, source, scripts, and tests.
npm run lint

# Run foundation and packed-artifact tests.
npm test

# Inspect package contents without creating a tarball.
npm pack --dry-run --json
```

### Local CLI usage

Until the package is published, invoke the binary from this checkout:

```bash
# Print command help.
node bin/repo-charter.js --help

# Safely inspect a target and preview its ownership/session initialization.
# A new session requires one selected primary agent. This writes nothing.
node bin/repo-charter.js init ../target-repository --dry-run --primary-agent codex

# Inspect a target, record selected agents, create safe ownership/session state,
# and print the exact planning handoff with its first decision frontier.
node bin/repo-charter.js init ../target-repository --primary-agent codex --agents claude-code

# Validate local state and emit read-only inspection evidence.
node bin/repo-charter.js check ../target-repository

# Reinspect a persisted session, invalidate changed evidence, and print its handoff.
node bin/repo-charter.js resume ../target-repository

# Consume the same evidence and handoff through a structured JSON contract.
node bin/repo-charter.js resume ../target-repository --json
```

Current `init` performs bounded static inspection, then creates only:

```text
.repo-charter/ownership.json
.repo-charter/manifest.json
```

A new session requires `--primary-agent`; optional `--agents` values become secondary
agents. The manifest stores schema/package versions, stage, selected agents, empty
confirmed decisions/template/ownership maps, and safe path/mtime/size snapshot metadata.
It never stores repository source bodies, raw conversation transcripts, credentials, or
secrets. `resume` reinspects the target and updates the safe snapshot only when relevant
files changed.

Inspection detects safe repository facts such as languages, frameworks, package
managers, candidate commands, source/test/data/operations boundaries, planning and
agent-instruction surfaces, protected/skipped paths, and uncertainty. It never runs a
project script. The versioned ownership file contains a marker and integrity hash for
future tool-owned artifacts. A non-tool-owned or invalid file at that location blocks initialization;
it is never silently overwritten. A second unchanged initialization reports the record
as unchanged.

`--dry-run` calculates ownership and session creation without writing either file.
`check` is read-only. `resume` reloads a valid incomplete session, reinspects changed
files, and prints the next planning handoff. The handoff asks the active agent to work
its complete unblocked decision frontier in rounds, recommend answers, surface
contradictions, and require explicit shared-understanding confirmation before an
approved setup specification exists. `--non-interactive` remains rejected until a later
phase can supply every required planning decision.

## Safety guarantees

The product is being built around these guarantees:

- local repository analysis only; no telemetry or source-content uploads;
- no package scripts, lifecycle scripts, migrations, services, or external systems run
  merely because a repository is inspected;
- explicit developer approval before durable generated files are written;
- path-safe, atomic writes that preserve an original file when replacement fails;
- no silent replacement of ambiguous non-empty project files;
- redaction and exclusion rules for secrets, credentials, private keys, real `.env`
  files, dependencies, caches, and build output;
- resumable state that does not retain raw planning transcripts or secret values; and
- idempotent initialization: an unchanged completed setup produces no additional diff.

The implemented foundation, inspection, and session phases verify atomic-write cleanup,
dry-run zero writes, conflict preservation, dirty-worktree preservation, bounded
discovery, `.gitignore` handling, hard protected-content exclusions, redaction,
validated selected-agent sessions, corrupt-manifest rejection, changed-file
reinspection, an unchanged second initialization, generated-document context budget,
conflict classification, explicit preview approval, reconciliation, and an unchanged
second document application. Public document-generation orchestration and final
remaining release/distribution work is planned for Phase 8. Adapter discovery is
documented from primary sources, but every target agent remains behavior-unverified.
The grill framework
persists only confirmed structured decisions in an approved specification; it never
persists raw chat.

## Planned generated environment

A completed future setup will always generate a detailed root `AGENTS.md` as the
vendor-neutral collaboration contract. Every selected agent must also have a verified
native instruction entry point that leads it through the shared workflow:

```text
native agent entry point -> AGENTS.md -> PLAN.md + TODO.md -> scoped work and verification
```

These native files and optional platform-specific rules are essential on-ramps, not
cosmetic duplicates. A thin adapter is small because it avoids contract drift, not
because the agent may skip it. Depending on the developer's selected agents, the tool
may generate the smallest verified native adapter:

| Selected agent | Default planned project output |
| --- | --- |
| Generic `AGENTS.md` consumer | `AGENTS.md` |
| Codex | `AGENTS.md` |
| Claude Code | `CLAUDE.md` routing to `AGENTS.md` |
| Gemini CLI | `GEMINI.md` importing `AGENTS.md` |
| GitHub Copilot | `.github/copilot-instructions.md` routing to the canonical contract |
| Cursor | `AGENTS.md` |
| Windsurf | `AGENTS.md` |

These are **target platforms, not currently verified product support**. The tool will
not advertise an agent as supported until its official instruction mechanism is
documented and a fresh-agent behavior evaluation passes.

The canonical generated environment is planned to include:

```text
AGENTS.md                    # how agents work in the repository
PLAN.md                      # durable product and architecture truth
TODO.md                      # verified execution ledger
.repo-charter/manifest.json  # safe resumable setup state
```

`AGENTS.md` will describe repository ownership, architecture, verified commands,
invariants, multi-agent coordination, handoff expectations, and completion evidence.
`PLAN.md` will record approved scope and durable decisions. `TODO.md` will identify
the next approved work and retain only observed completion evidence.

## Repository layout

```text
bin/                         # CLI executable
src/
|-- cli.js                   # argument parsing and orchestration
|-- foundation.js            # Phase 1 ownership initialization/checking
|-- ownership.js             # versioned markers and hashes
|-- filesystem/
|   |-- atomic.js            # atomic, path-safe writes
|   `-- paths.js             # target and managed-path safety
`-- errors.js                # CLI error type
scripts/lint.js              # cross-platform syntax linting
tests/                       # Node built-in test suite and fixtures
examples/                    # fictional generated-document examples
PLAN.md                      # durable product/architecture contract
TODO.md                      # implementation ledger
LEARNING.md                  # technical orientation guide
```

For a detailed explanation of the planned implementation mechanics, read
[LEARNING.md](./LEARNING.md). For fictional examples of the planning and multi-agent
contract documents the tool should eventually generate, see [examples/](./examples/).

## Roadmap

The product is intentionally built in safety-first phases:

1. **Foundation** — completed: packable CLI, safe paths, atomic writes, ownership,
   dry-run, fixtures, and packed-artifact verification.
2. **Inspection** — completed: safe bounded discovery, evidence provenance, command
   detection, redaction, protected-content exclusions, and human/JSON evidence output.
3. **Sessions and handoff** — completed: validated agent selection, safe resumable
   state, changed-file reinspection, and manual/JSON planning handoff.
4. **Project grill** — completed: evidence-aware decision tree, contradiction
   handling, explicit shared-understanding confirmation, and safe approved-specification
   primitives.
5. **Generation and reconciliation** — completed: project-specific documents, conflict
   preview, explicit approval, reconciliation, and idempotent application.
6. **Adapters and skill** — completed: documented native entry planning, thin adapter
   templates, compatibility diagnostics, and an installable workflow skill. Fresh-agent
   behavior evaluation remains required before any support claim.
7. **Validation and handoff** — completed: read-only integrity and document checks,
   stale-fact advice, observed-check reporting, output/exit-code behavior, and exact
   next-task reporting.
8. **Preview distribution** — user documentation, cross-platform clean installation,
   acceptance testing, and an explicitly approved npm publication.

See [TODO.md](./TODO.md) for implementation-grade tasks and phase-gate evidence.

## Git and GitHub hygiene

This repository includes a focused [`.gitignore`](./.gitignore) for dependencies,
temporary package artifacts, coverage, local tool state, atomic-write remnants, logs,
local environment files, and common editor/OS files. It deliberately keeps
`.env.example` trackable as a safe configuration template.

Before the first commit, inspect exactly what will be tracked:

```bash
git status --short
git check-ignore -v --no-index node_modules/example/index.js .env .env.example
```

Do not commit credentials, generated `.repo-charter/` state, `node_modules/`, or
package tarballs. No Git repository initialization, remote configuration, commit, or
GitHub push is performed by this project automatically.

## Contributing

- Start with [PLAN.md](./PLAN.md), then locate the first relevant unchecked task in
  [TODO.md](./TODO.md).
- Make the smallest change that satisfies an approved task.
- Update `PLAN.md` only when an approved change alters durable scope, architecture,
  workflow, security, interface, or operational truth.
- Update `TODO.md` only with completed work backed by observed verification or an
  honest blocker.
- Keep generated/local artifacts out of Git and preserve project-owned files during
  tool operations.
- Run `npm run lint` and `npm test` for changes that affect Phase 1 code.

The project has not been published and does not yet accept a stable compatibility or
support promise for any agent platform.

## License

[MIT](./LICENSE)
