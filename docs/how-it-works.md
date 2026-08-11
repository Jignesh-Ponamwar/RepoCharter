# How RepoCharter works

RepoCharter is local-first. It separates repository facts, developer decisions, and
durable filesystem changes so a coding agent cannot quietly turn an assumption into
project truth.

## Lifecycle

1. **Inspect** — `init` and `check` perform bounded static inspection. They respect
   `.gitignore`, hard-exclude secret-bearing files, redact captured command evidence,
   and never execute repository scripts.
2. **Select and resume** — a new setup records one primary agent and optional secondary
   agents in `.repo-charter/manifest.json`. `resume` reinspects changed safe paths before
   relying on an earlier snapshot.
3. **Grill** — the active coding agent uses the handoff to ask the complete unblocked
   decision frontier in rounds. It recommends answers, resolves contradictions, and
   obtains explicit shared-understanding confirmation. Raw chat is not persisted.
4. **Specify and preview** — an approved specification supplies confirmed decisions,
   selected agents, verification depth, proposed artifacts, conflict decisions, and
   developer approval. The internal skill workflow generates the canonical documents
   and previews every target before writing.
5. **Approve and apply** — missing or unchanged tool-owned files may be approved
   together. Project-owned or modified files require per-file preservation or explicit
   reconciled content. Approved writes use the shared atomic writer.
6. **Validate and hand off** — `check` is read-only. It reports integrity errors,
   advisory warnings, observed check outcomes, artifact status, blockers, and the first
   unchecked task.

## Manual CLI and skill flow

```bash
# Start a bounded inspection/session.
repo-charter init ../target --primary-agent codex --json

# Resume after an interruption or changed files.
repo-charter resume ../target --json

# After the developer has approved a safe specification, use the packaged skill path.
node skills/repo-charter/scripts/workflow.mjs preview ../target approved-spec.json
node skills/repo-charter/scripts/workflow.mjs apply ../target approved-spec.json approvals.json

# Inspect setup integrity without writing.
repo-charter check ../target --json
```

The public CLI does not yet accept an approved specification directly. The skill
workflow calls the same inspection, generation, preview, and application modules; it
does not maintain a second implementation.

## Safety boundaries

- Static inspection does not run installs, package scripts, migrations, services,
  containers, deployments, or external-system operations.
- RepoCharter does not upload repository content or collect telemetry.
- Candidate commands are evidence, not execution results.
- `observedChecks` records only separately approved executed checks or explicit skips;
  skipped checks are never reported as passed.
- A documented native adapter remains `unverified` until its fresh-agent behavior
  evaluation is recorded.

For generated-file ownership and recovery, read [generated-files.md](./generated-files.md).
For current native instruction-surface evidence, read
[agent-instruction-surfaces.md](./research/agent-instruction-surfaces.md).
