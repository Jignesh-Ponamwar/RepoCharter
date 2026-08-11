# Illustrative initialization, conflict, approval, and validation output

This is a **fictional, annotated composite** of RepoCharter’s deterministic JSON
structures. It demonstrates the expected shape of a full workflow; it is not a record
of a real project run and must not be treated as verification evidence.

## 1. Session handoff

```json
{
  "type": "init",
  "changes": [
    { "path": ".repo-charter/ownership.json", "status": "create" },
    { "path": ".repo-charter/manifest.json", "status": "create" }
  ],
  "session": {
    "stage": "handoff-ready",
    "selectedAgents": { "primary": "claude-code", "secondary": [] }
  },
  "warnings": [
    "Claude Code compatibility is unverified; no support claim is made."
  ]
}
```

## 2. Document preview and approval

```json
{
  "summary": {
    "changes": [
      { "path": "AGENTS.md", "status": "missing" },
      { "path": "PLAN.md", "status": "merge-required" },
      { "path": "TODO.md", "status": "compatible-existing" },
      { "path": "CLAUDE.md", "status": "missing" }
    ],
    "requiresPerFileDecision": true,
    "blocked": []
  },
  "approval": {
    "approveSafe": true,
    "artifacts": {
      "PLAN.md": { "action": "reconcile", "content": "developer-approved reconciled plan" }
    }
  }
}
```

The safe `AGENTS.md` and `CLAUDE.md` creations may be approved together. The existing
`PLAN.md` requires explicit reconciled content. The compatible existing `TODO.md`
remains unchanged.

## 3. Validation handoff

```json
{
  "type": "check",
  "report": {
    "artifacts": [
      { "path": "AGENTS.md", "status": "unchanged" },
      { "path": "PLAN.md", "status": "unchanged" },
      { "path": "TODO.md", "status": "unchanged" }
    ],
    "observedChecks": [
      { "command": "npm test", "exitCode": 0, "status": "passed", "verificationDepth": "approved-checks" }
    ],
    "blockers": [],
    "warnings": [
      "Claude Code entry point is documented but has no recorded behavior evaluation."
    ],
    "nextTask": "1.1 Implement core workflow"
  }
}
```

A warning does not become a success claim. A failed approved check, invalid ownership
hash, or missing managed file is reported as an error and gives `check` a non-zero exit
status.
