# Conflict resolution

The preview classifies each proposed artifact as `missing`, `owned-current`,
`owned-modified`, `compatible-existing`, `merge-required`, or `blocked`.

Approve missing and unchanged tool-owned artifacts together only after reviewing the
complete proposal. For `owned-modified` and `merge-required`, obtain a per-file
`preserve` decision or developer-approved reconciled content. Preserve content by
default when no decision exists. Never replace project-owned `PLAN.md` or `TODO.md`
with a generic template; reconciliation must be content-aware and explicit.

The workflow script applies only approved changes using the shared atomic writer and
reports the exact resulting status per path.
