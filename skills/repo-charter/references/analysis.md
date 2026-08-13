# Repository analysis

Use `repo-charter init` for a new session and `repo-charter resume` for an existing
one. Treat the returned inspection as bounded static evidence: candidate commands were
detected, not executed. Do not read ignored, binary, credential, key, or real `.env`
content to fill gaps; record unknown facts as unknown.

For human terminal use, `repo-charter init` prompts for the primary agent. JSON,
non-interactive, and non-TTY invocation must provide `--primary-agent <agent>`.
Compatibility remains unverified even
when an agent has a documented native instruction file. Preserve the manifest’s agent
selection unless the developer deliberately starts a different setup.
