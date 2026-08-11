# Generated files, ownership, and recovery

RepoCharter proposes a canonical collaboration set:

```text
AGENTS.md
PLAN.md
TODO.md
CLAUDE.md                         # only when Claude Code is selected
GEMINI.md                         # only when Gemini CLI is selected
.github/copilot-instructions.md   # only when GitHub Copilot is selected
.repo-charter/ownership.json
.repo-charter/manifest.json
```

`AGENTS.md` is the canonical contract. Native adapters are thin entry points that route
the selected agent through `AGENTS.md`, then `PLAN.md` and `TODO.md`. Codex, Cursor,
Windsurf, and generic selections use the root contract alone by default. RepoCharter
does not create optional rule directories without a confirmed scoped need.

## Ownership classification

Before mutation, each proposed document is classified:

| Status | Meaning | Allowed action |
| --- | --- | --- |
| `missing` | No target file exists. | Approve safe creation. |
| `owned-current` | Recorded tool content is unchanged. | Approve safe update or leave unchanged. |
| `owned-modified` | Recorded tool content changed after generation. | Preserve or provide reconciled content. |
| `compatible-existing` | Project-owned content already matches. | Preserve unchanged. |
| `merge-required` | Project-owned non-empty content differs. | Preserve or provide reconciled content. |
| `blocked` | Target is unsafe or cannot be reconciled automatically. | Resolve the blocker first. |

`PLAN.md` and `TODO.md` are semantic project documents. RepoCharter never blindly
replaces them. Reconciliation requires developer-approved content for that exact file.

## Local state

`.repo-charter/ownership.json` records hashes for tool-owned artifacts. `check` compares
those hashes with the current files and reports missing or modified managed artifacts as
errors.

`.repo-charter/manifest.json` records safe session state: selected agents, current
stage, confirmed structured decisions, template/managed-artifact metadata, safe file
snapshot metadata, and redacted observed-check results. It does not store source bodies,
raw transcripts, credentials, tokens, or secret values.

## Recovery

- **Interrupted before approval:** rerun `resume`; it reinspects changed files and
  returns the current handoff.
- **Conflict in preview:** preserve the existing file or provide explicit reconciled
  content. Do not delete the file to force a safe classification.
- **Managed artifact modified:** keep the modification, then reconcile deliberately;
  do not overwrite it through a blanket approval.
- **Invalid ownership/manifest state:** run `repo-charter check` for the exact
  diagnostic. Preserve the invalid file for investigation; do not replace it manually
  with guessed JSON.
- **Stale documented fact:** treat the warning as a review prompt. Verify whether the
  code, document, or approved decision should change before editing either one.

Run `repo-charter check <target> --json` after recovery to obtain the current artifact
report, blockers, warnings, observed checks, and next approved task.
