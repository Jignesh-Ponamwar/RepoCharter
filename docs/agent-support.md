# Agent support status

## Current status

RepoCharter advertises **no behavior-verified agent support**. The registry accepts the
target IDs below so a developer can record intended entry surfaces, but every selected
agent remains `unverified` until a fresh-agent behavior evaluation is observed.

| Target | Documented native surface | Default generated output | Tested versions | Status |
| --- | --- | --- | --- | --- |
| Codex | `AGENTS.md` | `AGENTS.md` | none | unverified |
| Claude Code | `CLAUDE.md` | `AGENTS.md` + `CLAUDE.md` | none | unverified |
| GitHub Copilot | `.github/copilot-instructions.md` | root contract + native adapter | none | unverified |
| Cursor | `AGENTS.md` | `AGENTS.md` | none | unverified |
| Windsurf | `AGENTS.md` | `AGENTS.md` | none | unverified |
| Gemini CLI | `GEMINI.md` | `AGENTS.md` + `GEMINI.md` | none | unverified |
| Generic consumer | `AGENTS.md` | `AGENTS.md` | none | unverified |

The native discovery sources, import/precedence limitations, and required future
verification method are recorded in
[agent-instruction-surfaces.md](./research/agent-instruction-surfaces.md).

## What a behavior evaluation must prove

For a target to become supported, a fresh isolated context must demonstrate that it can:

1. discover its selected native entry point and reach `AGENTS.md`;
2. read `PLAN.md` and identify the first relevant unchecked `TODO.md` task;
3. explain observed project facts and approved scope correctly;
4. reject deliberately out-of-scope work;
5. make a small scoped change and run appropriate approved verification;
6. update the ledger with only observed evidence; and
7. provide a usable handoff without losing required state.

The recorded evaluation must name the agent version, adapter template version, fixture,
generated file set, outcomes, and limitations. Documentation discovery alone is not a
support claim.
