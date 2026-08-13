# Preview verification status

Last updated: 2026-08-13.

## Observed in this Windows session

| Check | Result |
| --- | --- |
| Node runtime | Node `v22.15.0` |
| npm runtime | npm `11.7.0` |
| `npm run lint` | passed |
| `npm test` | passed; see `TODO.md` for the recorded test count of the current phase gate |
| `npm pack --dry-run --json` | inspected locally; package contents recorded in `TODO.md` |
| packed-artifact isolated installation | covered by the Node test suite |
| npm registry/package identity | `npm view repo-charter@0.1.3 version --prefer-online` returned `0.1.3` |
| public npm package workflow | From a clean directory outside the source checkout, `npx --yes repo-charter@0.1.3 init . --primary-agent codex --json` created a handoff-ready session. `npm install --ignore-scripts --no-save --no-package-lock --prefix <temp>/harness repo-charter@0.1.3`, installed `.cmd` help, `init`, `workflow preview`, approved `workflow apply`, and `check` passed for new and existing Git fixtures in both `local-planning` and `shared-planning` |
| visibility behavior from public package | `.repo-charter/` ignored and `AGENTS.md` public in both modes; `PLAN.md` ignored only in `local-planning` |
| Skills CLI installation | `npx skills add Jignesh-Ponamwar/RepoCharter@repo-charter -g -y --skill repo-charter` installed the global `repo-charter` skill for Codex-visible agents; the installer reported a PromptScript-specific global-install limitation |
| installed skill workflow | global `~\.agents\skills\repo-charter\scripts\workflow.mjs` drove public-package `workflow preview`, approved `workflow apply`, and `check` through `REPO_CHARTER_CLI` |

## Deferred post-MVP scope

- clean installation and workflow verification on macOS;
- clean installation and workflow verification on Linux.

These platforms must not be represented as supported until their deferred Phase 11
checks record exact commands, environments, and observed results.

## Still required for the Windows-first preview

- full fresh-agent behavior evaluation before any agent support claim;
- final Windows-first release acceptance.
