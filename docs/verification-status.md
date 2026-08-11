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
| npm registry lookup for `repo-charter` | returned unauthenticated `E404`; this is not proof that the name can be reserved or published by this account |

## Not observed in this session

- clean installation and workflow verification on macOS;
- clean installation and workflow verification on Linux;
- full fresh-agent behavior evaluation for any target platform;
- npm publication or authenticated ownership of the `repo-charter` name.

These are blockers to a cross-platform release claim and npm publication. They remain
unchecked in `TODO.md` and must be recorded with exact commands, environment, and
observed results before the Phase 8 gate can pass.
