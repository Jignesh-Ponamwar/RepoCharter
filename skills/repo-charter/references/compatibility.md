# Agent compatibility

Read [the primary-source research](../../../docs/research/agent-instruction-surfaces.md)
before selecting adapter output. RepoCharter currently documents discovery mechanisms
for Codex, Claude Code, GitHub Copilot, Cursor, Windsurf, Gemini CLI, and generic
`AGENTS.md` consumers, but it advertises none as behavior-verified.

Generate `CLAUDE.md`, `GEMINI.md`, and `.github/copilot-instructions.md` only when the
corresponding agent is selected. Codex, Cursor, Windsurf, and generic selections use
root `AGENTS.md` alone. Do not create optional rule directories without a confirmed
platform-specific requirement. Treat a documented entry point as `unverified` until a
fresh-agent evaluation records the full canonical-contract workflow.
