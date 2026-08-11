# RULES.md

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

* State your assumptions explicitly. If uncertain, ask.
* If multiple interpretations exist, present them - don't pick silently.
* If a simpler approach exists, say so. Push back when warranted.
* If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

* No features beyond what was asked.
* No abstractions for single-use code.
* No "flexibility" or "configurability" that wasn't requested.
* No error handling for impossible scenarios.
* If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

* Don't "improve" adjacent code, comments, or formatting.
* Don't refactor things that aren't broken.
* Match existing style, even if you'd do it differently.
* If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

* Remove imports/variables/functions that YOUR changes made unused.
* Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

* "Add validation" → "Write tests for invalid inputs, then make them pass"
* "Fix the bug" → "Write a test that reproduces it, then make it pass"
* "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Follow PLAN.md and Maintain TODO.md

**The repository's existing `PLAN.md` and `TODO.md` files define the approved project scope, implementation phases, and current work status. Refer to them before making changes.**

Before implementing:

* Read `PLAN.md` to understand the project goals, architecture, scope, constraints, and development phases.
* Read `TODO.md` to understand completed work, active tasks, pending tasks, dependencies, and the next approved implementation step.
* Treat `PLAN.md` as the source of truth for what belongs in the project.
* Treat `TODO.md` as the source of truth for what should be worked on next.
* Do not implement features, refactors, infrastructure, abstractions, or improvements that are outside the documented plan or current phase.
* If a requested change conflicts with `PLAN.md`, exceeds the current phase, or is not represented in `TODO.md`, surface the conflict before implementing.
* Do not silently expand the scope based on assumptions about what the project may need later.

Develop the project in the phases defined in `PLAN.md`:

* Complete the current phase before starting work from a later phase unless explicitly instructed otherwise.
* Respect dependencies and sequencing between phases.
* Avoid partially implementing future-phase functionality.
* Ensure each phase reaches its documented success criteria before progressing.
* Verify that new work supports the current phase's goals and does not introduce unnecessary future-facing complexity.

Maintain `TODO.md` throughout development:

* Add newly approved tasks before beginning implementation if they are not already listed.
* Mark a task as in progress when work begins, using the existing TODO format.
* Mark tasks as complete only after implementation and verification are finished.
* Add any discovered blockers, dependencies, or follow-up work that directly affects the approved scope.
* Do not add speculative ideas, optional improvements, or out-of-scope features to the active TODO list unless explicitly approved.
* Keep task descriptions specific, actionable, and aligned with `PLAN.md`.
* Preserve the existing structure, wording style, and formatting conventions of `TODO.md`.

After completing work:

* Confirm that the implementation matches the relevant section of `PLAN.md`.
* Run the appropriate verification steps.
* Update `TODO.md` to accurately reflect what was completed, what remains, and any verified blockers.
* Do not modify `PLAN.md` unless explicitly requested.
* Ensure no work from later phases or outside the documented scope was introduced.

The test: Every implementation task should trace to an approved item in `PLAN.md` and an actionable item in `TODO.md`.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## 6. PLAN.md and TODO.md Operating Protocol

**`PLAN.md` defines the durable implementation contract. `TODO.md` is the execution ledger derived from that plan. Keep both accurate as part of the implementation itself, not as optional documentation work at the end.**

The two files have deliberately different responsibilities:

- `PLAN.md` answers **what are we building, why is it designed this way, what must remain true, in what order should it be built, and how is each major step verified?**
- `TODO.md` answers **what concrete work exists right now, what has already been completed, what remains, what is blocked, and has the current phase actually passed its verification gate?**
- Do not turn `PLAN.md` into a changelog or task tracker.
- Do not turn `TODO.md` into an architecture document or idea backlog.
- `TODO.md` must be traceable to `PLAN.md`; `PLAN.md` does not need to mirror every implementation detail from `TODO.md`.

### 6.1 Bootstrap rule: create them when missing

For any request that will change repository code, behavior, data, UI, infrastructure, dependencies, tests, or project documentation:

1. Check for `PLAN.md` and `TODO.md` before implementation.
2. If both exist, read both before touching implementation files.
3. If `PLAN.md` is missing, create it from the user's requirements and the repository's current reality before implementing substantial work.
4. If `TODO.md` is missing, create it from the approved `PLAN.md` before implementing.
5. If one exists and the other does not, preserve the existing file and create only the missing counterpart.
6. Never fabricate completed work while bootstrapping. Existing implementation may be recorded as complete only when it can be verified from the repository and, where relevant, by running the appropriate checks.

Do not create planning files for a purely conversational question that makes no repository change.

### 6.2 How to create and maintain PLAN.md

`PLAN.md` should look like an implementation plan/specification, not a generic project brief. It should capture durable decisions with enough specificity that another engineer or agent can continue the project without re-deriving the architecture.

Use the following structure where applicable; omit sections that genuinely do not apply rather than filling them with boilerplate:

```markdown
# <Project>: Implementation Plan

<Short statement of what is being built, source requirements, and the priority/order
that should drive implementation.>

## 1. Stack decisions (and why)
<Concrete technology choices, alternatives intentionally not used, and rationale.>

## 2. Architecture & repo layout
<Important modules/files, ownership boundaries, data/control flow, and repository map.>

## 3. Data model / state / persistence
<Schema, entities, constraints, storage rules, migrations, invariants.>

## 4. Core workflows / domain rules
<State transitions, permissions, business rules, critical algorithms.>

## 5. Validation / security / correctness rules
<Server-authoritative validation, authz, integrity, failure behavior.>

## 6. Interfaces / routes / APIs / UI surfaces
<Externally meaningful interfaces and expected behavior.>

## 7. Reporting / integrations / special logic
<Only when relevant to the project.>

## 8. Infrastructure / deployment / operations
<Runtime, Docker, cloud, CI, health checks, deployment constraints, etc.>

## 9. Build order: each step has a verification gate
1. **<Step>** → gate: <observable verification>
2. **<Step>** → gate: <observable verification>

## 10. Assumptions & open questions
<Explicit assumptions, intentional exclusions, unresolved decisions.>
```

The exact numbering and section names may follow an existing project's conventions. Preserve an existing plan's structure instead of forcing this template onto it.

#### PLAN.md content rules

- Record **decisions and rationale**, not just a list of features.
- Describe important constraints and invariants explicitly.
- Include concrete architecture/repository ownership when known.
- Capture important data models, workflows, interfaces, authorization boundaries, integrations, and operational constraints when relevant.
- State what is explicitly **not** being built or used when that protects scope or explains a design decision.
- End major build stages with **observable verification gates**, not vague statements such as "make sure it works."
- Keep assumptions and open questions visible instead of silently deciding them.
- Prefer concrete file/module/route/table names once the project has them.
- Keep the plan implementation-oriented; avoid product-marketing prose.

#### When PLAN.md must change

Update `PLAN.md` only when the approved repository change alters durable project truth, such as:

- project scope or an explicitly supported capability;
- architecture or module ownership;
- stack/dependency choices that affect how the system is built;
- schema, persistence, state model, or migration strategy;
- core workflow/state transitions/business rules;
- public routes, APIs, integration contracts, or important UI flows;
- authorization/security/integrity rules;
- infrastructure, deployment, runtime, or operational constraints;
- implementation sequencing or a major verification gate;
- a previously open assumption that has now been decided.

A normal bug fix, text tweak, styling polish, isolated test, or implementation detail does **not** require a plan rewrite unless it changes one of those durable truths.

When a user explicitly requests a change that modifies durable project truth, that request authorizes the **minimum necessary update** to the relevant `PLAN.md` sections so the plan does not become stale. This does not authorize unrelated scope expansion.

#### How to edit PLAN.md

- Make surgical edits to the relevant section; do not regenerate the whole file.
- Preserve still-valid decisions, rationale, constraints, and historical context.
- Do not rewrite sections merely to make the prose prettier.
- If implementation reveals that an existing plan statement is factually wrong, update that statement and make the correction explicit where useful.
- Do not mark progress in `PLAN.md`; progress belongs in `TODO.md`.
- Do not append every finished task or test run to `PLAN.md`.
- Do not silently change a plan to match an accidental implementation. Either bring implementation back to plan or document an approved decision change first.

### 6.3 How to create and maintain TODO.md

`TODO.md` is the **single source of truth for implementation progress**. It is derived from `PLAN.md` and organized in the same execution order.

Use the style below for a new file:

```markdown
# <Project>: Project TODO

Task tracker derived from [PLAN.md](./PLAN.md). Phases run in order; each task has
an explicit checkbox and phase-end gates define "done". Mark tasks as work is
verified: this file is the single source of truth for progress.

**Legend:** `[ ]` pending · `[x]` done

---

## Phase 1: <Phase name>

> Goal: <one concrete outcome this phase must achieve.>

- [ ] **1.1 <Task name>**: <specific implementation scope, important files/components,
      behavioral constraints, and expected result.>
- [ ] **1.2 <Task name>**: <specific implementation scope and expected result.>

**Phase gate: PENDING**: <exact checks that must pass before this phase can be
considered complete.>

---

## Phase 2: <Phase name>

> Goal: <phase outcome.>

- [ ] **2.1 <Task name>**: ...
```

Preserve the existing file's naming, numbering, wrapping, and phase conventions if it already exists.

#### TODO task design rules

Each TODO item should be implementation-grade, not a vague reminder. A strong task normally identifies:

- the concrete behavior or deliverable;
- the important files/modules/surfaces when known;
- non-obvious constraints that must remain true;
- dependencies or sequencing when relevant;
- enough detail to verify whether the task is actually finished.

Prefer:

```markdown
- [ ] **3.4 Request detail view**: render request facts, stored payload, status,
      authorization-safe audit trail, and mismatch indicators in the existing
      detail template; preserve server-side ownership checks.
```

over:

```markdown
- [ ] Finish request page
```

Split work when independently verifiable pieces have different risks or dependencies. Do not atomize trivial edits into dozens of meaningless checkboxes.

#### Starting any repository change

Before editing implementation files for a user-requested change:

1. Read the current phase and nearby tasks in `TODO.md`.
2. Find the existing task that covers the requested change.
3. If no task covers it, add a new **unchecked** task in the correct phase before implementation.
4. If the requested work changes durable scope/architecture/rules, update `PLAN.md` first, then derive or adjust the TODO task from that plan change.
5. If the work comes after a phase whose gate has already passed, do not rewrite history just to squeeze the change into an old completed task. Add a clearly named follow-up/post-phase task or a new phase/sub-phase when that better represents the work.
6. Keep the task `[ ]` while implementation or verification is incomplete. The standard tracker uses only `[ ]` and `[x]`; do not invent `[~]`, `[-]`, or other checkbox states unless the repository already defines them.

The existence of an unchecked task is enough to represent active work. Add prose such as `Status: in progress` only if the repository's existing TODO convention already uses it or if concurrent work requires explicit ownership/state.

#### While implementing

Keep `TODO.md` synchronized as reality changes:

- Add newly approved subtasks when the implementation proves they are necessary to complete the requested scope.
- Add a dependency or blocker when it is real and directly affects the approved task.
- If a blocker prevents completion, leave the task unchecked and record the blocker immediately, including what condition would unblock it when known.
- If the user's requirements change mid-task, update the task description before continuing so it describes the work now being performed.
- If a discovered issue is unrelated to the requested/approved scope, mention it separately; do not silently add it as active work.
- Never pre-check tasks because the code "looks done."
- Never write test counts, dates, browser results, deployment status, or other verification evidence that was not actually observed.

A blocked task can be represented in the existing style, for example:

```markdown
- [ ] **3A.2B Confirm rendered desktop/mobile visuals**: blocked in this session
      because no browser runtime is available. Capture and inspect the required
      routes in a browser-capable session before sign-off.
```

#### Completing a task

A task changes from `[ ]` to `[x]` **only after**:

1. the requested implementation is complete;
2. relevant tests/checks have been run or the best available verification has been performed;
3. observed failures caused by the change have been resolved, or remaining blockers are explicitly documented;
4. the implementation still conforms to `PLAN.md` and repository invariants.

When useful, enrich the completed task with concise verification evidence:

```markdown
- [x] **2.11 Tests**: ...
      Verified 54/54 tests, route-level authorization, and end-to-end HTTP flows.
```

Verification notes must report facts, not intentions.

#### Phase gates

Every meaningful phase should end with a phase gate defining what "done" means for the phase as a whole.

- A new/incomplete phase uses `**Phase gate: PENDING**` followed by the required checks.
- Do not mark a phase gate passed merely because every checkbox is checked; run the phase-level verification.
- When the gate is actually verified, replace the pending gate with a concise evidence-based result such as `**Phase gate: PASSED YYYY-MM-DD**` and the checks that were observed.
- Preserve useful verification history in passed gates. Do not erase it during later work.
- If later work invalidates a previously passed gate, add the new regression/follow-up task and re-verify the affected gate or create a new follow-up gate; do not pretend the regression never happened.
- Dates are evidence metadata: include them only when the verification was actually performed on that date.

### 6.4 Automatic PLAN/TODO synchronization lifecycle

For every repository-changing request, use this loop without waiting for the user to separately ask for planning-file maintenance:

```text
1. READ        → Read requirements, relevant repo files, PLAN.md, TODO.md.
2. RECONCILE   → Identify the current phase/task and detect scope conflicts.
3. PLAN-SYNC   → If durable project truth changes, surgically update PLAN.md.
4. TODO-SYNC   → Ensure an unchecked, actionable task exists before coding.
5. IMPLEMENT   → Make only the changes required for that task.
6. VERIFY      → Run the task's relevant checks/tests/inspection.
7. RECORD      → Update task details with real blockers or verification evidence.
8. COMPLETE    → Change `[ ]` to `[x]` only when implementation + verification are done.
9. GATE        → If the phase is complete, run and record the phase gate.
10. CONTINUE   → Move to the next approved task; repeat from the current repository state.
```

Do not postpone all TODO maintenance until the end of a long implementation. The tracker must remain useful if work stops between tasks.

### 6.5 Handling new requests after earlier phases are complete

When a user asks for additional work after the documented plan has already progressed:

- First determine whether the request is a correction/refinement inside existing scope or a genuine scope expansion.
- For a small correction/refinement, add the next numbered task under the most relevant current/post-phase section without rewriting already-completed task descriptions.
- For a coherent body of new work, create a new phase or sub-phase (for example `Phase 3A`) with its own goal, numbered tasks, and phase gate.
- If the new work changes durable architecture/scope/workflows, update the relevant `PLAN.md` sections and build-order/gate language as needed.
- Preserve previously passed gates and completed tasks as historical execution evidence.
- Never renumber the entire historical TODO solely to make a later addition look cleaner.

### 6.6 Resuming work in a later session or with another agent

When starting from an existing repository:

1. Read `PLAN.md` for the durable contract.
2. Read `TODO.md` from top to bottom far enough to identify the latest passed gate and the first relevant unchecked task.
3. Inspect the implementation and verification state of that task rather than assuming an unchecked task means zero work has been done.
4. Continue from the first incomplete approved task unless the user explicitly directs work elsewhere.
5. Reuse recorded verification evidence as history, but re-run checks affected by new changes.
6. Do not reopen completed work without a concrete reason.

### 6.7 Conflict and precedence rules

When sources disagree, use this order:

1. the user's current explicit request;
2. hard repository invariants/security/correctness constraints;
3. approved durable decisions in `PLAN.md`;
4. execution state in `TODO.md`;
5. existing implementation details.

If the user's request intentionally changes the plan, update the plan and TODO to reflect the new approved reality before or alongside implementation. If it appears to conflict accidentally with a critical invariant, surface that conflict instead of silently breaking correctness.

### 6.8 Final consistency check before finishing a repository task

Before reporting completion, confirm all of the following:

- the implementation matches the user's latest request;
- `PLAN.md` still describes the durable project accurately;
- `TODO.md` contains the work that was actually performed;
- completed tasks are checked only after verification;
- blockers remain unchecked and are described accurately;
- phase gates contain only observed evidence;
- no speculative/unapproved work was added;
- no historical completion evidence was erased;
- no later-phase work was silently introduced;
- the next unchecked task, if any, is genuinely the next known piece of approved work.

The test: **an engineer opening only `PLAN.md`, `TODO.md`, and the repository should be able to understand the intended system, see exactly how far implementation has progressed, trust the recorded verification, and continue from the correct next task without reconstructing history from chat.**
