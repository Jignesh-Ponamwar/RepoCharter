# Support Desk: Project TODO

Task tracker derived from [PLAN.example.md](./PLAN.example.md). Phases run in order;
tasks are checked only after implementation and verification have both completed.

**Legend:** `[ ]` pending | `[x]` done

---

## Phase 1: Foundation and schema

> Goal: Establish the application shell and enforce the persistent domain model.

- [x] **1.1 Initialize the application**: create the Next.js TypeScript application,
      add the documented development and test commands, and verify the default route
      starts locally.
- [x] **1.2 Add PostgreSQL and Prisma**: configure local database access, commit the
      initial Prisma configuration, and document required environment variables in
      `.env.example`.
- [x] **1.3 Implement the core schema**: add `User`, `Category`, `Request`, and
      append-only `RequestEvent` models with the constraints described in the plan.
- [x] **1.4 Verify clean database setup**: apply migrations to an empty test database
      and run schema tests covering uniqueness, required references, and prohibited
      deletion of referenced users and categories.

**Phase gate: PASSED 2026-06-14**: migrations applied successfully to an empty test
database and 12 schema integration tests passed.

---

## Phase 2: Authorization and request creation

> Goal: Let authenticated employees create and view only their own requests.

- [x] **2.1 Integrate identity sessions**: validate identity-provider sessions and
      expose a server-only current-user helper using the stable provider subject.
- [x] **2.2 Enforce request read authorization**: implement database-scoped list and
      detail queries for employee, agent, and admin visibility rules.
- [x] **2.3 Implement request creation**: validate request fields, derive the
      requester from the session, and atomically create the request and creation
      event.
- [x] **2.4 Add authorization tests**: cover anonymous access, cross-employee reads,
      agent queue visibility, and admin visibility.

**Phase gate: PASSED 2026-06-18**: 18 role-matrix tests and 6 request-creation
integration tests passed; direct cross-employee detail access returned `404`.

---

## Phase 3: Assignment and status workflow

> Goal: Allow authorized agents and admins to process requests with a complete audit
> history.

- [x] **3.1 Implement self-assignment**: allow an agent to claim an unassigned
      request and reject attempts to claim requests assigned to another agent.
- [x] **3.2 Implement admin reassignment**: allow admins to assign or reassign a
      request to an active agent and record the previous and new assignee.
- [x] **3.3 Implement status transitions**: enforce `open -> in_progress -> resolved`
      and admin-only reopening within a transaction that also records the event.
- [ ] **3.4 Decide resolution-note policy**: confirm whether resolving a request
      requires a note; update the relevant plan rule before implementing that
      requirement.
- [ ] **3.5 Complete workflow tests**: cover every allowed and rejected assignment
      and status transition, transaction rollback, and exactly-one-event behavior.

**Phase gate: PENDING**: the resolution-note decision remains open and the complete
workflow test matrix has not been run.

---

## Phase 4: User interface

> Goal: Expose the verified workflows through accessible role-appropriate pages.

- [ ] **4.1 Build the request list**: render only authorized rows with status and
      category filters and useful loading, empty, and error states.
- [ ] **4.2 Build request submission**: provide accessible field validation and show
      server-authoritative errors without losing valid entered data.
- [ ] **4.3 Build request detail and history**: display request facts, assignment,
      status actions, and the append-only event timeline according to the viewer's
      role.
- [ ] **4.4 Build category administration**: allow admins to create, rename, disable,
      and list categories while preserving categories referenced by requests.
- [ ] **4.5 Add browser workflow coverage**: test employee submission, agent handling,
      admin reassignment, filtering, and unauthorized navigation.

**Phase gate: PENDING**: all four UI surfaces must meet their authorization rules and
the critical Playwright workflows must pass on desktop and mobile viewports.

---

## Phase 5: Release readiness

> Goal: Demonstrate that the application can be deployed safely from a clean state.

- [ ] **5.1 Add operational configuration**: finalize `.env.example`, safe structured
      logging, and the non-sensitive `/api/health` response.
- [ ] **5.2 Rehearse database migration**: apply production-intended migrations to a
      clean database and verify application startup against the migrated schema.
- [ ] **5.3 Run the release verification suite**: execute lint, type checking, unit
      tests, integration tests, browser tests, and the production build.
- [ ] **5.4 Verify clean-environment startup**: install from the lockfile, configure
      documented environment variables, migrate, start, and exercise the health and
      core request routes.

**Phase gate: PENDING**: the release suite, migration rehearsal, and clean-environment
startup must pass with observed evidence recorded here.
