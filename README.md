# RepoCharter

> A local-first CLI and installable skill for creating disciplined, evidence-backed
> workflows for AI-assisted software development.

RepoCharter prepares a new or existing repository for coding-agent work without
blindly overwriting project files, running repository scripts during inspection, or
uploading repository content. It combines bounded local inspection, a developer-led
planning conversation, explicit approval, deterministic document generation, validation,
and planning-context drift review.

```text
repository evidence + developer-approved decisions
                         ↓
AGENTS.md + a local or shared planning workspace + selected entry points
                         ↓
scoped changes + observed verification + durable handoff
```

## Contents

- [Status](#status)
- [Requirements](#requirements)
- [Install and start with the CLI](#install-and-start-with-the-cli)
- [Use the optional coding-agent skill](#use-the-optional-coding-agent-skill)
- [Workflow](#workflow)
- [Commands](#commands)
- [What RepoCharter creates](#what-repocharter-creates)
- [Safety and privacy](#safety-and-privacy)
- [Windows verification](#windows-verification)
- [Documentation](#documentation)
- [Development](#development)

## Status

**Windows-first preview.** The current public package is
[`repo-charter@0.1.3`](https://www.npmjs.com/package/repo-charter). The package and
its installable skill are usable preview software; behavior-verified support is not
claimed for any coding-agent platform.

### What is implemented

- Node.js 22+ CLI with safe path handling, atomic writes, ownership records, and
  zero-write dry runs;
- bounded local inspection with ignored/protected-content exclusions and redaction;
- selected-agent sessions, safe resumability, structured handoff, and developer grill;
- document preview, approval-gated reconciliation/application, and read-only `check`;
- `local-planning` and `shared-planning` workspace visibility modes;
- optional thin adapters for Claude Code, GitHub Copilot, and Gemini CLI;
- explicit read-only planning-context drift detection and acknowledgement; and
- an installable skill that guides an agent through the canonical CLI workflow.

### What is verified and what is not

| Area | Current status |
| --- | --- |
| Windows public package | Observed: public npm install, CLI help/init, workflow preview/apply, and `check` in new and existing fixtures for both workspace modes. |
| Windows Skills CLI install | Observed: global skill discovery/installation and installed-skill execution through the public CLI. PromptScript does not support global skill installation. |
| Agent behavior support | **Unverified:** no target is advertised as supported until a fresh-agent evaluation is recorded. |
| macOS and Linux | Deferred post-MVP; neither platform is claimed as supported. |
| Package scripts during inspection | Never run automatically. |

See [verification status](./docs/verification-status.md) for the recorded environment
and limits.

## Requirements

- **Node.js 22 or newer**
- **npm** (bundled with supported Node.js installations)
- **Windows PowerShell** for the documented Windows commands
- Git is optional for initialization. It is used only by explicitly invoked drift
  checks in a Git repository.

Check the local runtime:

```powershell
node --version
npm --version
```

## Install and start with the CLI

RepoCharter is **CLI-first**: the CLI owns inspection, persisted state, generation,
preview, approved writes, validation, and drift checks.

### One-command start

From the repository you want to set up, run:

```powershell
npx repo-charter init
```

RepoCharter prompts you to choose the primary coding agent, then creates a safe local
session and prints the planning handoff. It does **not** run candidate install, test,
build, migration, service, or deployment commands found in the repository.

Use the same short form for normal operations:

```powershell
npx repo-charter resume
npx repo-charter check
npx repo-charter drift-check
```

For scripts, CI, or coding-agent orchestration, supply an explicit selection and JSON
output instead:

```powershell
npx --yes repo-charter@0.1.5 init . --primary-agent codex --json
```

### Local-install fallback and source development

A normal project-local installation remains useful for repeated use, offline work after
installation, or source-checkout development:

```powershell
npm install --ignore-scripts repo-charter@0.1.5
.\node_modules\.bin\repo-charter.cmd init . --primary-agent codex --json
```

Use the direct `.cmd` binary when working inside this RepoCharter source checkout. npm
sees the checkout's own package name (`repo-charter`) and therefore does not download a
second temporary copy for `npx repo-charter`; that development-only name collision is
why the earlier `npx` test failed.

## Use the optional coding-agent skill

The optional skill teaches a coding agent how to operate RepoCharter correctly; it does
not replace the CLI or duplicate its implementation.

Install it with Skills CLI:

```powershell
npx skills add Jignesh-Ponamwar/RepoCharter@repo-charter -g -y --skill repo-charter
```

When invoked, the skill must:

1. check whether `repo-charter` is available;
2. ask the developer before any explicit CLI download or installation;
3. use the approved CLI to initialize/resume, conduct the planning grill, preview,
   apply approved changes, validate, and optionally review drift; and
4. report exactly what the CLI returns, including conflicts and blockers.

The skill never silently downloads, installs, or upgrades RepoCharter. A successful
skill installation proves that the skill can be discovered and invoked; it does not
prove that the host coding agent follows generated instructions. See
[agent support status](./docs/agent-support.md).

### Point an installed skill at a local Windows CLI

If the CLI is not on `PATH`, install it locally only after developer approval and set
the wrapper override for the current PowerShell session:

```powershell
npm install --ignore-scripts --no-save --no-package-lock repo-charter@0.1.5
$env:REPO_CHARTER_CLI = (Resolve-Path .\node_modules\.bin\repo-charter.cmd)
```

The skill wrapper then calls that CLI through its stable `workflow` contract. It also
supports `REPO_CHARTER_CLI_ARGS` for a deliberate wrapper such as Node executing a
local development checkout.

## Workflow

1. **Inspect or resume** — run `init` for a new session or `resume` for an incomplete
   one. Read the structured handoff before asking questions.
2. **Plan with the developer** — establish product intent, constraints, verification,
   and unresolved decisions. Do not ask for facts already observed by inspection.
3. **Choose workspace visibility** — the developer explicitly selects
   `local-planning` or `shared-planning`; RepoCharter never infers it.
4. **Confirm shared understanding** — do not create durable planning documents until
   the developer explicitly approves the proposed specification.
5. **Preview every change** — inspect generated files, visibility, ignore-file changes,
   conflicts, and proposed reconciliations.
6. **Apply only approved changes** — approve safe files together only when appropriate;
   preserve or explicitly reconcile project-owned conflicts.
7. **Validate and hand off** — run read-only `check`, report results honestly, and
   identify the next approved task.
8. **Review drift when needed** — use `drift-check` only by explicit request; it never
   changes plans, source files, or Git state automatically.

## Commands

Use the installed `.cmd` path in the examples below when the CLI is project-local.

| Command | Effect |
| --- | --- |
| `repo-charter init [path] --primary-agent <agent>` | Inspect a repository and create or reuse a safe session. |
| `repo-charter init [path] --dry-run --primary-agent <agent>` | Calculate base initialization without writing. |
| `repo-charter resume [path]` | Reinspect changed safe paths and resume an incomplete session. |
| `repo-charter check [path] --json` | Validate local RepoCharter state without writing. |
| `repo-charter workflow preview <path> <spec.json> --json` | Produce the deterministic document/change preview used by the skill. |
| `repo-charter workflow apply <path> <spec.json> <approvals.json> --json` | Atomically apply only approved proposed changes. |
| `repo-charter drift-check [path] --json` | Read-only planning-context drift report. |
| `repo-charter drift-acknowledge [path] --json` | Record a new safe anchor after explicit developer review. |

### Workflow specification and approvals

The coding agent normally creates the approved specification after the developer
confirms the planning conversation. It must contain no raw chat, source bodies,
credentials, or secrets. A minimal fixture specification looks like:

```json
{
  "selectedAgents": { "primary": "codex", "secondary": [] },
  "workspaceVisibility": "local-planning",
  "verificationDepth": "static",
  "confirmedDecisions": {}
}
```

Preview before writing:

```powershell
.\node_modules\.bin\repo-charter.cmd workflow preview . .\approved-spec.json --json
```

For a new fixture with no conflicts, the developer can approve safe creations with:

```json
{ "approveSafe": true }
```

Then apply:

```powershell
.\node_modules\.bin\repo-charter.cmd workflow apply . .\approved-spec.json .\approvals.json --json
```

For non-empty or project-owned files, read the preview and supply explicit preserve or
reconciled-content decisions. Do not use blanket approval to overwrite ambiguity.

## What RepoCharter creates

`AGENTS.md` is always the public repository contract. The developer chooses the
visibility of planning artifacts:

| Mode | Public/committed | Local-only/ignored |
| --- | --- | --- |
| `local-planning` | `AGENTS.md` | `PLAN.md`, `TODO.md`, selected adapters/rules, `.repo-charter/` |
| `shared-planning` | `AGENTS.md`, `PLAN.md`, `TODO.md`, selected adapters/rules | `.repo-charter/` |

Selected agent entry points are kept intentionally small:

| Selected target | Generated native entry point |
| --- | --- |
| Codex, Cursor, Windsurf, generic `AGENTS.md` consumer | `AGENTS.md` |
| Claude Code | `CLAUDE.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Gemini CLI | `GEMINI.md` |

RepoCharter previews a marked `.gitignore` block but never automatically untracks a
file, stages changes, commits, or pushes. Existing tracked files require a deliberate
manual migration decision.

## Safety and privacy

- Analysis stays local; RepoCharter sends no telemetry and uploads no repository
  content.
- Inspection respects `.gitignore`, skips dependency/build/cache directories and
  protected files, and redacts secret-like captured values.
- Static inspection never executes package scripts, lifecycle hooks, migrations,
  services, containers, deployments, or external-system operations.
- Raw chat transcripts, source bodies, credentials, tokens, and secret values are not
  persisted in `.repo-charter/` state.
- Every durable change is previewed and requires approval.
- Managed/project-owned content is preserved unless the developer explicitly approves
  a reconciliation.
- `check` and `drift-check` are read-only.

## Windows verification

For a reproducible public-consumer test of `repo-charter@0.1.3`, follow the
[Windows end-to-end verification guide](./docs/windows-e2e-test.md). It covers:

- a clean npm installation from the public registry;
- new and existing Git fixture workflows in both visibility modes;
- CLI preview, approved apply, `check`, and drift checks;
- global Skills CLI installation and use of the installed skill with the public CLI;
- cleanup and evidence to record.

## Documentation

- [How RepoCharter works](./docs/how-it-works.md)
- [Generated files, ownership, and recovery](./docs/generated-files.md)
- [Agent support status](./docs/agent-support.md)
- [Verification status](./docs/verification-status.md)
- [Windows end-to-end verification](./docs/windows-e2e-test.md)
- [Contribution guide](./CONTRIBUTING.md)
- [Implementation plan](./PLAN.md)
- [Project TODO](./TODO.md)
- [Technical learning guide](./LEARNING.md)
- [Fictional examples](./examples/)

## Development

From a source checkout:

```powershell
npm run lint
npm test
npm pack --dry-run --json
```

Keep changes inside the approved scope in `PLAN.md` and the next relevant unchecked
item in `TODO.md`. Record only verification actually observed. Do not claim agent,
platform, or release support that has not been tested.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for fixture and contribution conventions.

## License

[MIT](./LICENSE)
