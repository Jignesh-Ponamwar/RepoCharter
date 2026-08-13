# Preview verification status

Last updated: 2026-08-11.

## Observed in this Windows session

| Check | Result |
| --- | --- |
| Node runtime | Node `v22.15.0` |
| npm runtime | npm `11.7.0` |
| `npm run lint` | passed |
| `npm test` | passed; see `TODO.md` for the recorded test count of the current phase gate |
| `npm pack --dry-run --json` | inspected locally; package contents recorded in `TODO.md` |
| packed-artifact isolated installation | covered by the Node test suite |
| npm registry/package identity | authenticated publish completed for `repo-charter@0.1.0`; the Phase 9 patch is prepared as `0.1.1` and remains unpublished |

## Deferred post-MVP scope

- clean installation and workflow verification on macOS;
- clean installation and workflow verification on Linux.

These platforms must not be represented as supported until their deferred Phase 11
checks record exact commands, environments, and observed results.

## Still required for the Windows-first preview

- final Windows-first release acceptance;
- full fresh-agent behavior evaluation before any agent support claim;
- explicit npm publication authorization.
