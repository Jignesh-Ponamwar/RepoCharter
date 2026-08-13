# RepoCharter

> A local-first CLI and installable skill for setting up disciplined AI-assisted
> development in a repository.

RepoCharter helps a developer turn a new or existing repository into an agent-ready
workspace without blindly overwriting project files, running project commands during
inspection, or uploading repository content. It combines bounded static inspection,
an agent-led planning interview, explicit approval, generated collaboration documents,
and read-only validation.

```text
repository evidence + developer decisions
                ↓
public AGENTS.md + planning workspace + selected agent entry points
                ↓
scoped work, observed verification, and honest handoff
```

## Status

**Windows-first preview software.** `repo-charter@0.1.2` is published to npm. The
next patch prepares the skill-led CLI bootstrap workflow; no agent or non-Windows
platform support claim is implied.

Implemented and locally verified:

- safe Node.js 22+ CLI foundation, atomic writes, ownership records, and dry runs;
- bounded repository inspection with protected-content exclusions and redaction;
- selected-agent sessions, resumable safe state, and planning handoff;
- evidence-aware developer grill and approved-specification primitives;
- document generation, conflict preview, approval-gated application, and validation;
- thin Claude Code, GitHub Copilot, and Gemini CLI adapter templates;
- an installable RepoCharter skill that calls the shared implementation;
- `local-planning` and `shared-planning` workspace visibility policies.

All target agents remain **behavior-unverified**. RepoCharter does not advertise any
agent as supported until a fresh-agent evaluation is observed.

The Windows-first preview remains blocked on final release acceptance, any fresh-agent
evaluations needed for future support claims, and explicit authorization to publish.
macOS and Linux verification is deferred post-MVP and must not be treated as support.

## What RepoCharter creates

`AGENTS.md` is always the public repository contract. During setup, the developer
chooses one visibility mode:

| Mode | Committed/public | Local-only/ignored |
| --- | --- | --- |
| `local-planning` | `AGENTS.md` | `PLAN.md`, `TODO.md`, selected adapters/rules, `.repo-charter/` |
| `shared-planning` | `AGENTS.md`, `PLAN.md`, `TODO.md`, selected adapters/rules | `.repo-charter/` |

Credentials, secret-bearing environment files, and machine-specific state remain
local in both modes.

RepoCharter previews a managed ignore block before writing it. It never automatically
runs `git rm --cached`, stages files, creates commits, or pushes changes. If a file is
already tracked, adding it to `.gitignore` alone will not make it private.

## Current workflow

The public CLI creates/reuses a safe inspection and planning session. The active coding
agent conducts the interview, obtains confirmation, and uses the packaged skill
workflow to preview and apply an approved specification.

```text
repo-charter init
  → bounded inspection and selected-agent session
  → agent reads the handoff and interviews the developer
  → developer confirms decisions and workspace visibility
  → skill previews every document, adapter, and ignore-file change
  → developer approves safe writes and resolves conflicts
  → skill applies approved changes
  → repo-charter check reports integrity, warnings, and next task
```

The CLI intentionally does not execute project package scripts, lifecycle hooks,
migrations, services, containers, deployments, or external-system operations merely
because it inspected a repository.

## Local quick start

RepoCharter requires Node.js 22 or newer. Until publication, run it from this checkout:

```bash
# Inspect a repository and create a safe session without writing.
node bin/repo-charter.js init ../target-repository --dry-run --primary-agent codex

# Create or resume a selected-agent session and print the planning handoff.
node bin/repo-charter.js init ../target-repository --primary-agent claude-code --json
node bin/repo-charter.js resume ../target-repository --json

# Validate a setup without writing.
node bin/repo-charter.js check ../target-repository --json
```

After the developer confirms the agent-led interview, create a safe approved
specification containing `workspaceVisibility`, then use the skill workflow:

```bash
node skills/repo-charter/scripts/workflow.mjs preview \
  ../target-repository approved-spec.json

node skills/repo-charter/scripts/workflow.mjs apply \
  ../target-repository approved-spec.json approvals.json
```

The approved specification must use exactly one of:

```json
{ "workspaceVisibility": "local-planning" }
```

or:

```json
{ "workspaceVisibility": "shared-planning" }
```

## Install and use the CLI

RepoCharter is a **CLI-first** product. Install the published package for a project or
use a versioned `npx` invocation:

```powershell
npm install --ignore-scripts repo-charter@0.1.3
.\node_modules\.bin\repo-charter.cmd --help
.\node_modules\.bin\repo-charter.cmd init . --primary-agent codex
.\node_modules\.bin\repo-charter.cmd check . --json
```

The direct Windows `.cmd` invocation is the verified package path. If a Windows `npx`
command cannot resolve the executable, install the package as above rather than assuming
the published CLI is absent. `init` performs bounded local inspection and creates a
safe session; it does not run repository package scripts.

## Optional agent skill

The bundled RepoCharter skill guides compatible coding agents through the planning,
preview, and approval workflow. It does not replace the CLI, which remains responsible
for deterministic state, generation, writes, validation, and drift checks.

After the GitHub source is available, install the skill with:

```powershell
npx skills add Jignesh-Ponamwar/RepoCharter@repo-charter -g -y
```

The installed skill actively checks for the `repo-charter` CLI before it starts work.
If it is absent, it asks the developer to approve an explicit installation or versioned
`npx` invocation, explains that either may download the CLI, then uses the available
CLI to drive init/resume, the planning grill, preview, approved apply, check, and
explicit drift review. It does not silently download or install anything. A successful
skill installation only proves discovery and workflow availability, not behavior-
verified support for every agent platform.

## Selected agent entry points

RepoCharter always creates or reconciles public `AGENTS.md`. It adds only the smallest
native bridge required by a selected agent:

| Selected agent | Native entry point |
| --- | --- |
| Codex, Cursor, Windsurf, generic consumer | `AGENTS.md` |
| Claude Code | `CLAUDE.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Gemini CLI | `GEMINI.md` |

In local planning, selected adapters remain local. In shared planning, they are
committed alongside the plan and ledger. Optional rule directories are not generated
by default. Compatibility research is documented, but no generated template is a
behavior-support claim.

## Safety and privacy guarantees

- Repository analysis is local; RepoCharter collects no telemetry or source uploads.
- Inspection respects `.gitignore`, hard-excludes protected content, and redacts
  secret-like values from captured output.
- Raw chat transcripts, source bodies, credentials, tokens, and secrets are not stored
  in RepoCharter session state.
- Every durable write is previewed and requires approval.
- Project-owned or modified documents require preservation or explicit reconciliation.
- Writes use validated paths and atomic replacement.
- `check` is read-only and distinguishes errors, warnings, failed checks, and skipped
  checks.

## Development and verification

```bash
npm run lint
npm test
npm pack --dry-run --json
bash -n scripts/release-check.sh
```

The current local verification includes lint, automated tests, package dry-run
inspection, Windows-local packed-artifact workflows for new and existing repositories,
and packed skill previews for both workspace modes. It does not prove behavior support
for any coding agent. macOS and Linux are deferred post-MVP scope.

## Documentation

- [How RepoCharter works](./docs/how-it-works.md)
- [Generated files, ownership, and recovery](./docs/generated-files.md)
- [Agent support status](./docs/agent-support.md)
- [Verification status](./docs/verification-status.md)
- [Contribution guide](./CONTRIBUTING.md)
- [Implementation plan](./PLAN.md)
- [Project TODO](./TODO.md)
- [Technical learning guide](./LEARNING.md)
- [Fictional examples](./examples/)

## Contributing

Read `PLAN.md`, then find the first relevant unchecked task in `TODO.md`. Keep changes
inside approved scope, preserve project-owned content, record only observed verification
evidence, and do not claim platform, agent, or release results that were not observed.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for fixture and verification conventions.

## License

[MIT](./LICENSE)
