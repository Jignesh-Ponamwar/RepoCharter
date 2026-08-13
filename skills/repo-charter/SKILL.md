---
name: repo-charter
description: Initialize, resume, validate, or reconcile an agent-ready repository with the RepoCharter CLI when a developer asks to prepare a repository for coding agents, establish AGENTS.md/PLAN.md/TODO.md, or review planning-context drift.
---

# RepoCharter

Use this skill to actively guide the developer through the complete RepoCharter
workflow. The CLI is the canonical owner of inspection, sessions, generation, writes,
validation, and drift checks; this skill conducts the developer conversation and invokes
those operations in the right order.

## 1. Ensure the CLI is available

First run `repo-charter --help`. If it works, use that CLI for every command below.

If it is absent, tell the developer that RepoCharter needs the published CLI and ask
for approval before any network operation. Offer this Windows-safe project-local
installation (it does not run lifecycle scripts or write a lockfile):

```powershell
npm install --ignore-scripts --no-save --no-package-lock repo-charter@0.1.3
$env:REPO_CHARTER_CLI = (Resolve-Path .\node_modules\.bin\repo-charter.cmd)
```

The developer may instead explicitly approve a versioned `npx` or global installation.
State that either option may download the package. Never silently install, download, or
upgrade the CLI. If the developer declines, stop and explain that the deterministic
RepoCharter operations cannot be performed without it.

For the workflow script, preserve `REPO_CHARTER_CLI` when the CLI is not on `PATH`.
The script also supports `REPO_CHARTER_CLI_ARGS` for a deliberate wrapper such as Node
running a local checkout. Do not import repository-relative `src/` modules.

## 2. Inspect or resume

For a new session, run:

```bash
repo-charter init <target> --primary-agent <agent> --json
```

For an existing incomplete session, run:

```bash
repo-charter resume <target> --json
```

Read the returned handoff. Do not execute candidate repository commands during
inspection. If the selected CLI uses a direct path rather than `PATH`, invoke that same
path instead of the command shown above.

**Done when:** the session is valid, selected agents are recorded, and the handoff has
an evidence-backed current decision frontier.

## 3. Conduct the grill

Follow [the grill reference](./references/grill.md). Ask every question in the current
frontier, recommend an answer, wait for the developer’s answers, then recompute. Find
repository facts yourself; ask the developer only for decisions.

Ask the developer to choose `local-planning` or `shared-planning`. Recommend
`local-planning` for private active planning; never infer the choice from repository
files. `.repo-charter/` remains local in both modes.

**Done when:** every applicable decision is settled, contradictions are resolved, and
the developer explicitly confirms the shared-understanding summary.

## 4. Preview and obtain approval

Create a safe approved-specification JSON file without raw chat, source bodies, or
secrets. Preview the complete proposed document set through the CLI workflow:

```bash
node skills/repo-charter/scripts/workflow.mjs preview <target> <approved-spec.json>
```

Read [the reconciliation reference](./references/reconciliation.md) before asking for
approval. Present every change and conflict; safe changes may be approved together,
but every conflict needs a preserve or explicit reconciled-content decision.

**Done when:** the developer has approved all intended safe changes and made an
explicit decision for every conflict.

## 5. Apply, validate, and review drift

Write the approval JSON, then run:

```bash
node skills/repo-charter/scripts/workflow.mjs apply <target> <approved-spec.json> <approvals.json>
repo-charter check <target> --json
```

Report created, modified, unchanged, preserved, pending, and blocked paths exactly as
returned. Run `repo-charter drift-check <target> --json` only when the developer asks
to review planning-context drift. `drift-acknowledge` requires explicit developer
review and acknowledgement; it is never an automatic repair.

Do not claim platform compatibility or behavior-verified agent support. This skill
provides the intended RepoCharter workflow; each target remains unverified until a
fresh-agent behavior evaluation is observed.

**Done when:** only approved files were written, `check` has been reported, and the
developer has the exact result and remaining blockers.

## References

- [Repository analysis](./references/analysis.md) — evidence boundary and session use.
- [Project grill](./references/grill.md) — round-based adaptive questioning.
- [Conflict resolution](./references/reconciliation.md) — preview and approval rules.
- [Agent compatibility](./references/compatibility.md) — documented surfaces and honest
  compatibility status.
