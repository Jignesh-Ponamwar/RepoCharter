# Agent instruction surfaces: primary-source research

Research performed 2026-08-11 for RepoCharter Phase 6. This note records what the
vendor documentation establishes about **file discovery**. It does not claim that a
fresh coding-agent behavior evaluation has passed; every registry entry remains
`unverified` until that separate evaluation is recorded.

## Decision

RepoCharter generates one canonical `AGENTS.md` for every selected-agent setup. It
adds only these thin native entry adapters:

| Selected agent | Generated native entry point | Why |
| --- | --- | --- |
| Codex | none beyond `AGENTS.md` | OpenAI documents `AGENTS.md` as Codex custom instructions. |
| Claude Code | `CLAUDE.md` | Anthropic documents project `CLAUDE.md`; the adapter imports/routs to the canonical contract. |
| GitHub Copilot | `.github/copilot-instructions.md` | GitHub documents this repository-wide native instruction surface. |
| Cursor | none beyond `AGENTS.md` | Cursor documents `AGENTS.md` as an alternative to project rules. |
| Windsurf | none beyond `AGENTS.md` | Windsurf documents `AGENTS.md` project instructions. |
| Gemini CLI | `GEMINI.md` | Gemini CLI documents project context in `GEMINI.md` and imports. |
| Generic | none beyond `AGENTS.md` | `AGENTS.md` is the generic portable contract. |

No default template creates `.claude/rules/`, `.cursor/rules/`, `.windsurf/rules/`,
or `.codex/rules/`. Those surfaces either duplicate the root contract or need a
confirmed platform-specific scoping requirement. In particular, no Codex rule-file
mechanism is claimed from this research.

## Evidence by platform

### Codex

- **Discovery:** OpenAI’s Codex guide is explicitly titled “Custom instructions with
  AGENTS.md” and documents `AGENTS.md` as the project instruction mechanism.
- **Generated behavior:** a root `AGENTS.md` is the Codex entry point; no second native
  file is proposed.
- **Hierarchy/imports:** this implementation does not depend on a nested-file,
  precedence, or import behavior. Those require a separate compatibility evaluation
  before being used as an adapter feature.
- **Verification method:** use a fresh Codex context and verify it reads the generated
  root `AGENTS.md`, then follows its required `PLAN.md` and `TODO.md` sequence.
- **Source:** [OpenAI: Custom instructions with AGENTS.md](https://developers.openai.com/codex/guides/agents-md/).

### Claude Code

- **Discovery:** Anthropic documents persistent project instructions in `CLAUDE.md`.
- **Adapter:** the root `CLAUDE.md` template is a small `@AGENTS.md` import plus an
  explicit instruction to follow `AGENTS.md`, then `PLAN.md` and `TODO.md`.
- **Hierarchy/imports:** the Claude Code memory documentation includes `CLAUDE.md`
  import support. RepoCharter does not create scoped rules by default.
- **Verification method:** start a fresh Claude Code context at the repository root;
  ask it to name the canonical contract and first unchecked task after reading the
  generated entry point.
- **Source:** [Anthropic: How Claude remembers your project](https://docs.anthropic.com/en/docs/claude-code/memory).

### GitHub Copilot

- **Discovery:** GitHub documents repository-wide custom instructions in
  `.github/copilot-instructions.md`. The same documentation describes `AGENTS.md`
  support and says the nearest `AGENTS.md` in the directory tree takes precedence.
- **Adapter:** generate the repository-wide native file with a concise routing
  instruction to read root `AGENTS.md`, then `PLAN.md` and `TODO.md` before changes.
  The adapter intentionally does not rely on an undocumented Markdown-import syntax.
- **Hierarchy/imports:** do not assume the root adapter imports files. Use the documented
  native file as an explicit pointer; nested `AGENTS.md` semantics are not used for
  RepoCharter’s default output.
- **Verification method:** run a fresh Copilot coding-agent context and confirm the
  native entry point leads to all three canonical documents.
- **Source:** [GitHub Docs: Adding repository custom instructions](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot).

### Cursor

- **Discovery:** Cursor documents `AGENTS.md` as agent instructions in Markdown and a
  simple alternative to `.cursor/rules`.
- **Generated behavior:** use root `AGENTS.md` only. Do not create `.cursor/rules/`
  absent a confirmed scoping need.
- **Hierarchy/imports:** no Cursor-specific import, precedence, or nested-rule behavior
  is required by the default output.
- **Verification method:** use a fresh Cursor agent context and verify it loads the
  root contract and can identify the plan/ledger workflow.
- **Source:** [Cursor: Rules](https://cursor.com/docs/rules#agentsmd).

### Windsurf

- **Discovery:** Windsurf’s documentation has a dedicated `AGENTS.md` entry under the
  Cascade documentation.
- **Generated behavior:** use root `AGENTS.md` only. Do not create `.windsurf/rules/`
  unless confirmed scoping needs cannot be represented by the canonical contract.
- **Hierarchy/imports:** the default output does not rely on imports, precedence, or
  nested behavior beyond the documented root instruction surface.
- **Verification method:** use a fresh Windsurf context and verify the root contract
  is loaded and routes the agent to `PLAN.md` and `TODO.md`.
- **Source:** [Windsurf: AGENTS.md](https://docs.windsurf.com/windsurf/cascade/agents-md).

### Gemini CLI

- **Discovery:** Gemini CLI documents project context in `GEMINI.md`, including the
  context hierarchy and modularization through imports.
- **Adapter:** the root `GEMINI.md` template imports `AGENTS.md` and repeats only the
  required canonical routing sequence.
- **Hierarchy/imports:** the adapter uses only the documented project context/import
  feature, not assumed nested-file precedence.
- **Verification method:** start a fresh Gemini CLI context and verify the imported
  canonical contract is followed before it proposes a repository change.
- **Source:** [Gemini CLI: Provide context with GEMINI.md files](https://geminicli.com/docs/cli/gemini-md/#modularize-context-with-imports).

### Generic AGENTS.md consumer

- **Discovery:** `agents.md` describes `AGENTS.md` as a predictable dedicated place for
  coding-agent context.
- **Generated behavior:** root `AGENTS.md` is the only file proposed.
- **Verification method:** behavior must be tested against the particular generic
  consumer before it receives a compatibility claim.
- **Source:** [AGENTS.md](https://agents.md/).

## Behavior-evaluation status

The local environment exposed Claude Code `2.1.206`, Gemini CLI `0.36.0`, and Cursor
`3.13.10` at research time. Codex and Windsurf CLIs were not installed. No fresh-agent
matrix run is recorded in this phase because credentials and/or runnable clients were
not available for every target. Therefore RepoCharter advertises **no verified agent
compatibility**. The registry and diagnostics label all seven targets `unverified` and
point to this research rather than upgrading them to supported.

A future evaluation record must include agent version, adapter version, fixture,
observed canonical-document discovery, plan/TODO next-task selection, scoped change,
verification, ledger update, handoff, and limitations.
