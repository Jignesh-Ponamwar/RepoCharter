# Support Desk: Agent Collaboration Contract

This is the canonical, vendor-neutral instruction file for Support Desk. It is read by
all coding agents working in this repository. Agent-native adapters, if present, must
route here rather than duplicate these rules.

Support Desk is an internal application for employees to submit support requests and
for agents and administrators to process them. The initial release prioritizes a
complete request workflow, server-authoritative role-based access, and append-only
audit history.

## 1. Sources of truth and current status

Read documents in this order before changing code:

1. [PLAN.example.md](./PLAN.example.md) defines approved product scope, architecture,
   invariants, and phase gates.
2. [TODO.example.md](./TODO.example.md) is the execution ledger. It identifies
   verified completion, blockers, and the next approved task.
3. This file explains how agents work safely in the repository.

Do not treat the plan as a progress log or the TODO as a product specification.
Repository code establishes observable behavior, but it does not override an approved
plan without an explicit decision.

### Current phase

Phase 3, **Assignment and status workflow**, is partially complete. Before adding
further workflow behavior, resolve TODO task 3.4: whether a resolution note is required
when resolving a request. Do not silently choose a policy or implement it as an
assumption.

## 2. Repository map and module ownership

```text
app/
|-- requests/                 # Request list, creation, and detail UI
|-- admin/                    # Category and assignment administration UI
`-- api/                      # Server-side route handlers
lib/
|-- auth/                     # Session retrieval and role checks
|-- requests/                 # Workflow, validation, authorization, transactions
`-- db/                       # Prisma client and transaction helpers
prisma/
|-- schema.prisma             # Persistent model and database constraints
`-- migrations/               # Committed schema evolution
tests/
|-- unit/                     # Domain and validation tests
`-- e2e/                      # Critical browser workflows
```

### Ownership boundaries

- UI files collect input and render results. They must not decide whether a user may
  read, assign, or transition a request.
- `lib/auth/` owns session interpretation and role checks. Do not duplicate role logic
  in pages or client components.
- `lib/requests/` owns server-side workflow rules, authorization-aware queries, input
  validation, and transactions that change a request and its audit history together.
- `lib/db/` owns Prisma access and transaction helpers. Keep database details out of
  UI components.
- `prisma/schema.prisma` and migrations own persistent constraints. A database change
  requires an appropriate migration and schema-level verification.
- Route handlers coordinate HTTP input/output but delegate domain decisions to
  server-side functions.

## 3. Verified commands

Use package scripts rather than reconstructing command lines. For this example fixture,
the following commands have been verified and are the supported checks:

| Goal | Command | Use when |
| --- | --- | --- |
| Start development server | `npm run dev` | Manually inspect an affected UI flow |
| Lint | `npm run lint` | After a code change |
| Type-check | `npm run typecheck` | After TypeScript, route, or schema changes |
| Domain/unit tests | `npm test` | After domain, authorization, or validation changes |
| Browser workflows | `npm run test:e2e` | After critical UI or authorization-flow changes |
| Production build | `npm run build` | Before declaring a UI or release-facing change complete |
| Apply development migrations | `npx prisma migrate dev` | Only for an approved schema change |

Do not run migrations, start external services, or modify deployment configuration
without authority appropriate to the task. Report commands actually run, their exit
status, and relevant results; do not describe a command as passed because it was merely
recommended.

## 4. Domain model and non-negotiable rules

### Roles

- **Employee**: creates requests and reads only requests they created.
- **Agent**: sees unassigned requests and requests assigned to them; may claim an
  unassigned request for themselves.
- **Admin**: sees all requests, manages categories, and may assign or reassign to an
  active agent.

The server derives identity and role from the authenticated session. Never trust a
client-supplied requester ID, actor ID, role, assignee authority, status, or audit
actor.

### Request rules

- Titles are 5-120 characters; descriptions are 20-5,000 characters.
- A request has an immutable requester, an active category, an optional assignee, and
  a status of `open`, `in_progress`, or `resolved`.
- Normal status flow is `open -> in_progress -> resolved`.
- Only an admin may reopen `resolved` to `in_progress`.
- Employees cannot change request status.
- An agent may claim only an unassigned request; they cannot claim a request assigned
  to another agent.
- An admin may assign or reassign a request to any active agent.

### Audit and persistence invariants

`RequestEvent` is append-only. Creating a request, changing its assignment, or changing
its status creates exactly one event with the actor, event type, previous value, new
value, and server timestamp.

When a request mutation changes request state and audit history, both writes belong in
the same database transaction. A partial mutation or an event without its corresponding
state change is a correctness failure.

Do not delete a user or category referenced by a request. Historical requests and audit
events must remain readable.

## 5. Authorization and security rules

- Require an authenticated session before reading or mutating application data.
- Apply authorization in server-side domain functions before a request is read or
  changed.
- Constrain list/detail queries at the database-query boundary. Do not fetch broader
  data and filter unauthorized records in the UI.
- Return field-level validation errors for invalid input; do not expose internal
  exceptions to clients.
- Keep request descriptions and credentials out of logs. Logs may include request IDs
  and actor IDs.
- Runtime configuration belongs in documented environment variables. Never commit real
  secrets or copy them into tests, plans, or handoffs.

## 6. Working from the plan and ledger

Before implementation:

1. Read the relevant `PLAN.md` section and nearby `TODO.md` tasks.
2. Identify an unchecked task that covers the requested work.
3. If no task covers it, add a specific unchecked task in the correct phase before
   coding. Update `PLAN.md` first only when durable scope, architecture, workflow, or
   public contract changes.
4. State any unresolved assumption or conflict before selecting an implementation.

While implementing:

- Make the smallest change that satisfies the approved task.
- Preserve unrelated files, formatting, and other contributors' edits.
- Do not start future-phase functionality merely because a current change touches a
  nearby module.
- Keep a task unchecked until implementation and relevant verification are complete.

After implementation:

1. Run checks proportionate to the risk of the change.
2. Update `TODO.md` with only observed evidence or a real blocker.
3. Mark the task complete only after checks pass or the remaining blocker is recorded.
4. Re-read the relevant plan rule to confirm that the implementation remains in scope.

## 7. Multi-agent coordination

This contract applies whether the contributors are people, coding agents, or a mix.
Do not assume a particular platform supports subagents, task locks, or shared memory.

### Before editing

- Announce the task, files/modules you intend to touch, and verification you expect to
  run in the active handoff or coordination channel.
- Divide work by ownership boundary where possible: for example, one contributor owns
  a migration/domain transaction while another owns its isolated tests or UI, not the
  same lines of the same file.
- Read active edits and current file contents immediately before writing. Never replace
  a file from a stale copy.
- If two tasks require the same module, sequence them or assign one contributor to
  integrate. Do not make competing broad refactors.

### During implementation

- Keep changes scoped to the announced task and avoid reformatting unrelated lines.
- Do not overwrite or discard changes that you did not make.
- If an adjacent problem is outside the approved task, report it separately rather
  than silently expanding scope.
- Escalate conflicts over domain rules, authorization, schema shape, or task priority
  to the developer; these are decisions, not merge conflicts for an agent to guess at.

### Handoff format

A handoff must contain:

```text
Task: <TODO identifier and outcome>
Changed: <files and ownership boundaries>
Decisions: <approved decisions made; unresolved items>
Verification: <commands actually run and observed results>
Ledger: <TODO change or reason it remains unchecked>
Next: <first actionable follow-up or explicit blocker>
```

A handoff is not complete if it claims success without naming the verification that was
actually performed.

## 8. Verification expectations

Use tests to protect the rule that changed:

| Change | Minimum expected verification |
| --- | --- |
| Input validation | Unit tests for accepted and rejected boundaries |
| Authorization/query visibility | Role-matrix tests, including forbidden access |
| Assignment or status mutation | Allowed/rejected transition tests and event assertions |
| Transactional request change | Rollback/atomicity test and exactly-one-event test |
| Prisma schema or migration | Clean database migration and constraint coverage |
| User-facing workflow | Relevant browser flow plus lint/type-check/build as appropriate |

A successful test suite does not authorize a change that violates the plan. Conversely,
an unrun required check is an honest blocker, not a passing result.

## 9. Open decisions and explicit exclusions

- The resolution-note policy is unresolved. Do not require, store, or display a
  resolution note until the developer decides the policy and the plan/ledger reflect
  it.
- Email notifications are excluded from the initial release.
- Password authentication is excluded; identity comes from the existing OpenID Connect
  provider.
- Admin roles are provisioned outside this application for the initial release.

## 10. Completion standard

Before declaring work complete, confirm all of the following:

- The change traces to an approved TODO task and respects `PLAN.md`.
- Server-side authorization and transaction rules remain intact.
- The relevant commands were run, or unavailable checks are recorded as blockers.
- `TODO.md` reports only observed results.
- The handoff names changed files, verification, and the next actionable task.

When this file conflicts with a documented security invariant or an explicit developer
instruction, preserve the stronger safety requirement and surface the conflict.
