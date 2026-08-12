# Contributing to RepoCharter

## Requirements

- Node.js 22 or newer
- npm included with that Node installation
- no runtime, build, or test dependencies beyond Node built-ins

## Local verification

```bash
npm run lint
npm test
npm pack --dry-run --json
```

The test suite uses Node’s built-in test runner and isolated temporary directories.
Do not run repository scripts merely to inspect a fixture.

## Fixture conventions

- Keep static fixtures under `tests/fixtures/` small and purpose-specific.
- Use temporary directories for writes, packed-artifact installation, and conflict
  scenarios.
- Test the observable status, output, and filesystem result; do not encode a hidden
  conclusion in fixture names or source content.
- Preserve protected-content, redaction, atomicity, dry-run, and idempotency coverage
  when changing inspection or application code.

## Compatibility research and evaluation

Adapter decisions require current primary-source vendor documentation. Record source
URLs, discovery assumptions, import/precedence limits, and a concrete fresh-agent
verification method in `docs/research/`.

Do not label an agent supported after documentation research alone. A behavior
evaluation must run in a fresh context and record the agent version, adapter version,
fixture, native-entry discovery, plan/ledger workflow, scoped implementation,
verification, honest TODO update, handoff, and limitations.

## Workspace visibility fixtures

Cover both `local-planning` and `shared-planning` when changing generation, adapters,
ignore reconciliation, or validation. `AGENTS.md` is public in both modes and
`.repo-charter/` is local in both modes. Preserve user-owned ignore content and never
test by running Git untracking commands.

## Change discipline

Read `PLAN.md` and `TODO.md` before code changes. Keep work inside the active approved
phase, make surgical edits, and update `TODO.md` with only verification actually run.
Do not publish packages, run external systems, or claim cross-platform results without
explicit developer authority and observed evidence.
