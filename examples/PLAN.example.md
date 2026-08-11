# Support Desk: Implementation Plan

Support Desk is a small internal web application for submitting, assigning, and
resolving employee support requests. The initial release prioritizes a complete
request workflow, role-based authorization, and an auditable status history.

## 1. Stack decisions (and why)

- Use Next.js with TypeScript for the web application and server-side route handlers.
- Use PostgreSQL for durable relational data and transactional status changes.
- Use Prisma for schema migrations and type-safe database access.
- Use the existing company identity provider through OpenID Connect; do not build
  password authentication.
- Use Vitest for domain tests and Playwright for critical browser workflows.

## 2. Architecture and repository layout

```text
app/
|-- requests/                 # Request list, creation, and detail pages
|-- admin/                    # Category and assignment administration
`-- api/                      # Server-authoritative route handlers
lib/
|-- auth/                     # Session and role checks
|-- requests/                 # Request workflow and authorization rules
`-- db/                       # Prisma client and transaction helpers
prisma/
|-- schema.prisma
`-- migrations/
tests/
|-- unit/
`-- e2e/
```

UI components may collect input, but authorization and workflow decisions belong in
server-side domain functions under `lib/requests/`.

## 3. Data model and persistence

### User

- `id`: identity-provider subject
- `email`: unique normalized email
- `role`: `employee`, `agent`, or `admin`

### Request

- `id`: generated UUID
- `title`: 5-120 characters
- `description`: 20-5,000 characters
- `categoryId`: required category reference
- `requesterId`: immutable creator reference
- `assigneeId`: nullable agent reference
- `status`: `open`, `in_progress`, or `resolved`
- `createdAt` and `updatedAt`: server timestamps

### RequestEvent

- Records request creation, assignment changes, and status transitions.
- Stores actor, event type, previous value, new value, and timestamp.
- Events are append-only and cannot be edited through application routes.

Deleting users or categories referenced by requests is prohibited. Historical
requests must remain readable.

## 4. Core workflows and domain rules

### Submit a request

An authenticated employee submits a valid title, description, and active category.
The server derives the requester from the session, creates the request with `open`
status, and records a creation event in one transaction.

### Assign a request

An agent may assign an unassigned request to themselves. An admin may assign or
reassign a request to any active agent. Assignment records an event.

### Change status

Allowed transitions are:

```text
open -> in_progress -> resolved
```

An admin may reopen a resolved request to `in_progress`. Employees cannot change
request status. Every transition and its event must commit atomically.

### View requests

- Employees see only requests they created.
- Agents see unassigned requests and requests assigned to them.
- Admins see all requests.

## 5. Validation, security, and correctness

- Every route requires an authenticated session.
- Server-side authorization must be applied before reading or mutating a request.
- Client-provided requester IDs, roles, statuses, and audit actors are ignored.
- Request mutations use database transactions when request state and audit history
  change together.
- Invalid input returns field-level errors without exposing internal exceptions.
- Request list queries enforce access rules in the database query rather than
  filtering unauthorized rows after retrieval.

## 6. Interfaces and UI surfaces

- `/requests`: role-appropriate request list with status and category filters.
- `/requests/new`: employee request form.
- `/requests/[id]`: request facts, current assignment, status actions, and history.
- `/admin/categories`: admin-only category management.
- `POST /api/requests`: create a request.
- `PATCH /api/requests/[id]/assignment`: assign or reassign a request.
- `PATCH /api/requests/[id]/status`: perform an allowed status transition.

All mutation interfaces return the updated request and its newly created event.

## 7. Infrastructure and operations

- Runtime configuration comes from environment variables documented in
  `.env.example`.
- Database migrations run as a separate deployment step before the application is
  promoted.
- `/api/health` reports application availability without exposing secrets or
  database contents.
- Logs include request IDs and actor IDs but never request descriptions.

## 8. Build order and verification gates

1. **Foundation and schema** -> gate: migrations apply to an empty database and
   schema-level tests pass.
2. **Authorization and request creation** -> gate: role matrix tests and request
   creation integration tests pass.
3. **Assignment and status workflow** -> gate: allowed transitions succeed,
   forbidden transitions fail, and every mutation creates one audit event.
4. **User interface** -> gate: Playwright covers employee submission, agent handling,
   admin reassignment, and unauthorized access.
5. **Release readiness** -> gate: production build, migration rehearsal, health
   check, and clean-environment startup all pass.

## 9. Assumptions and open questions

- The identity provider supplies a stable subject and verified email address.
- Admin roles are provisioned outside this application for the initial release.
- Email notifications are excluded from the initial release.
- Decide whether resolved requests require a resolution note before Phase 3 begins.
