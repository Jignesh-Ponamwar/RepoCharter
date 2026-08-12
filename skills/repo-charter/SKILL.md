---
name: repo-charter
description: Initialize or resume safe multi-agent repository setup when a developer asks to prepare a repository for coding agents, establish AGENTS.md/PLAN.md/TODO.md, or reconcile an agent-ready setup.
---

# RepoCharter

Use this workflow to establish an evidence-backed collaboration environment. Keep the
conversation-led decisions with the developer; call RepoCharter for deterministic
inspection, state, preview, and approved writes.

## 1. Inspect and select

Run `repo-charter init <target> --primary-agent <agent> --json` for a new session, or
`repo-charter resume <target> --json` for an existing one. Read the returned handoff.
Do not execute candidate repository commands during inspection.

**Done when:** the session is valid, selected agents are recorded, and the handoff has
an evidence-backed current decision frontier.

## 2. Conduct the grill

Follow [the grill reference](./references/grill.md). Ask every question in the current
frontier, recommend an answer, wait for the developer’s answers, then recompute. Find
repository facts yourself; ask the developer only for decisions.

Ask the developer to choose `local-planning` or `shared-planning`. Recommend
`local-planning` for private active planning; never infer the choice from repository
files. `.repo-charter/` remains local in both modes.

**Done when:** every applicable decision is settled, contradictions are resolved, and
the developer explicitly confirms the shared-understanding summary.

## 3. Create and preview the approved specification

Create a safe approved-specification JSON file without raw chat, source bodies, or
secrets. Use the shared workflow script to preview the complete proposed document set:

```bash
node skills/repo-charter/scripts/workflow.mjs preview <target> <approved-spec.json>
```

Read [the reconciliation reference](./references/reconciliation.md) before asking for
approval. Present every change and conflict; safe changes may be approved together,
but every conflict needs a preserve or explicit reconciled-content decision.

**Done when:** the developer has approved all intended safe changes and made an
explicit decision for every conflict.

## 4. Apply and hand off

Write the approval JSON, then run:

```bash
node skills/repo-charter/scripts/workflow.mjs apply <target> <approved-spec.json> <approvals.json>
```

Report created, modified, unchanged, preserved, pending, and blocked paths exactly as
returned. Do not claim final contract validation or platform compatibility; those are
separate RepoCharter phases.

**Done when:** only approved files were written and the developer has the exact result
and remaining blockers.

## References

- [Repository analysis](./references/analysis.md) — evidence boundary and session use.
- [Project grill](./references/grill.md) — round-based adaptive questioning.
- [Conflict resolution](./references/reconciliation.md) — preview and approval rules.
- [Agent compatibility](./references/compatibility.md) — documented surfaces and honest
  compatibility status.
