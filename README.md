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

**Phases 1 and 2 are implemented.** The current CLI can safely inspect a repository,
initialize and validate its minimal ownership record, and emit bounded human or JSON
evidence without executing project code. It does **not** yet select agents, persist
sessions, run planning interviews, generate `AGENTS.md`/`PLAN.md`/`TODO.md`, create
agent adapters, or claim support for any coding agent.

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

Phases 1 and 2 provide a packable Node.js 22+ ESM CLI with no runtime dependencies.

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

# Safely inspect a target and preview its only current initialization change.
# This writes nothing.
node bin/repo-charter.js init ../target-repository --dry-run

# Inspect a target and create the safe Phase 1 ownership record.
node bin/repo-charter.js init ../target-repository

# Validate foundation ownership and emit read-only inspection evidence.
node bin/repo-charter.js check ../target-repository

# Consume the same evidence through a structured JSON contract.
node bin/repo-charter.js check ../target-repository --json
```

Current `init` performs bounded static inspection, then creates only:

```text
.repo-charter/ownership.json
```

Inspection detects safe repository facts such as languages, frameworks, package
managers, candidate commands, source/test/data/operations boundaries, planning and
agent-instruction surfaces, protected/skipped paths, and uncertainty. It never runs a
project script. The versioned ownership file contains a marker and integrity hash for
future tool-owned artifacts. A non-tool-owned or invalid file at that location blocks initialization;
it is never silently overwritten. A second unchanged initialization reports the record
as unchanged.

`--dry-run` calculates the proposed ownership-file creation without writing a target
file or session file. `check` is read-only. `resume` is present in the public command
surface but reports that resumable sessions begin in Phase 3.

The CLI already accepts `--primary-agent`, `--agents`, and `--non-interactive` as part
of the future command contract, but Phase 1 deliberately does not persist or act on
agent selections.

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

The implemented foundation and inspection phases verify atomic-write cleanup, dry-run
zero writes, conflict preservation, dirty-worktree preservation, bounded discovery,
`.gitignore` handling, hard protected-content exclusions, redaction, and an unchanged
second initialization. Session persistence, document generation, and agent behavior
validation are planned later phases.

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
3. **Sessions and handoff** — agent selection, resumable state, changed-file
   reinspection, and conversation handoff.
4. **Project grill** — evidence-aware decision tree, contradiction handling, developer
   approval, and an approved setup specification.
5. **Generation and reconciliation** — project-specific documents, conflict preview,
   approval, and idempotent application.
6. **Adapters and skill** — verified native instruction surfaces and fresh-agent
   behavior evaluations.
7. **Validation and handoff** — contract checks, stale-fact detection, output/exit-code
   behavior, and exact final reporting.
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
