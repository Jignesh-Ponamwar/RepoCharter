# RepoCharter: Project TODO

Task tracker derived from [PLAN.md](./PLAN.md). Phases run in order; each task has an
explicit checkbox and phase-end gates define completion. Check tasks only after both
implementation and relevant verification have finished.

**Legend:** `[ ]` pending | `[x]` done

---

## Phase 0: Product definition

> Goal: Establish the approved product contract before implementation.

- [x] **0.1 Create realistic planning references**: add fictional
      `examples/PLAN.example.md` and `examples/TODO.example.md` demonstrating durable
      decisions, traceable work, observed evidence, pending gates, and blockers.
- [x] **0.2 Complete the product grill**: settle target users, supported agents,
      conversation flow, safety boundaries, document ownership, CLI surface,
      distribution, testing, and release acceptance with explicit developer approval.
- [x] **0.3 Record the durable implementation contract**: create `PLAN.md` from the
      confirmed decisions and derive this execution ledger without claiming any
      unimplemented product capability.
- [x] **0.4 Clarify agent-specific output defaults**: make root `AGENTS.md` mandatory,
      generate native adapters only for selected agents, define the default output
      matrix, and explicitly exclude duplicated `.claude/rules/rules.md` and Markdown
      `.codex/rules/rules.md` files from default initialization.

**Phase gate: PASSED 2026-08-10**: the developer confirmed the shared-understanding
summary and adapter-output clarification; `PLAN.md` records the resulting durable
contract; this ledger leaves every implementation task unchecked.

---

## Phase 0A: Learning guide

> Goal: Make the approved product and its planned implementation understandable to a
> developer before coding begins.

- [x] **0A.1 Create the project learning guide**: add `LEARNING.md` explaining the
      problem, current state, confirmed product flow, architecture, CLI/agent boundary,
      evidence and session models, generated documents, adapter matrix, conflict and
      privacy rules, verification strategy, implementation phases, and key concepts;
      link to the authoritative plan and ledger without presenting planned behavior as
      already implemented. Verified all required topic sections, local document
      targets, current-versus-planned wording, and trailing whitespace.

**Phase gate: PASSED 2026-08-10**: `LEARNING.md` covers the approved architecture,
distinguishes current from future state, links to `PLAN.md` and `TODO.md`, and makes no
unsupported implementation claims.

---

## Phase 0B: Learning guide technical deepening

> Goal: Explain the planned implementation mechanics without representing unbuilt
> components or undecided implementation details as complete.

- [x] **0B.1 Expand the technical learning guide**: document the planned module
      boundaries, command/data flow, evidence and session representations, bounded
      inspection, atomic writes, ownership/reconciliation, validation, packaging, and
      test layers in `LEARNING.md`; retain explicit current-versus-planned wording and
      link to `PLAN.md` for authoritative decisions. Verified 2026-08-11: local
      `PLAN.md`/`TODO.md` links, contiguous sections 1-23, the technical walkthrough,
      and absence of trailing whitespace.

**Phase gate: PASSED 2026-08-11**: `LEARNING.md` now gives a technically oriented
reader a coherent planned execution model, preserves plan/TODO authority, and makes no
implementation claims beyond observed repository contents.

---

## Phase 0C: Multi-agent instruction example

> Goal: Provide a realistic canonical `AGENTS.md` example that lets multiple coding
> agents understand the same project, coordinate scoped work, and preserve verified
> planning state.

- [x] **0C.1 Add the Support Desk agent-contract example**: create
      `examples/AGENTS.example.md` as the vendor-neutral root contract for the
      existing fictional Support Desk plan and ledger; include repository ownership,
      verified-command expectations, domain/authorization invariants, planning rules,
      scoped multi-agent coordination and handoff rules, and verification standards
      without claiming the fictional project's pending work is complete. Verified
      2026-08-11: 245-line contract links to the paired examples, preserves the pending
      resolution-note decision, and includes the workflow invariant, handoff protocol,
      verification matrix, and whitespace check.

**Phase gate: PASSED 2026-08-11**: the example is consistent with the Support Desk
plan and ledger, gives concurrent agents clear non-overlapping workflows, and preserves
one canonical project contract rather than duplicating per-agent instructions.

---

## Phase 1: Project foundation and safe filesystem core

> Goal: Establish a packable cross-platform CLI that can plan and apply basic owned
> files without destructive behavior.

- [x] **1.1 Create the Node.js package**: add the minimum Node.js 22+ package manifest,
      lockfile, ESM or CommonJS decision, binary entry point, lint/test scripts, MIT
      license, and source/test layout required by the current phase. Implemented as an
      ESM package using only built-in Node.js APIs and `node:test`; verified by lint,
      tests, and package artifact inspection.
- [x] **1.2 Define the CLI contract**: implement argument parsing and help for `init`,
      `check`, `resume`, `--dry-run`, `--primary-agent`, `--agents`, `--json`, and
      `--non-interactive`, rejecting invalid combinations with actionable messages.
      Verified parser acceptance/rejection cases and packed-binary help output.
- [x] **1.3 Implement safe target resolution**: resolve explicit and current-directory
      targets, normalize Windows and POSIX paths, reject non-directory or unsafe
      targets, and avoid assuming that every target is a Git repository. Verified
      missing/file-target rejection, non-Git initialization, dirty Git preservation,
      and Windows/POSIX path-normalization cases.
- [x] **1.4 Implement atomic filesystem operations**: stage writes beside their final
      targets, validate paths again before replacement, clean only tool-owned
      temporary files, and preserve originals when a write fails. Verified a simulated
      post-stage failure preserves the original and removes the temporary file.
- [x] **1.5 Implement managed ownership primitives**: define versioned ownership
      markers and hashes without yet attempting content-aware reconciliation. Added
      versioned `.repo-charter/ownership.json` payload hashes and managed-artifact
      hash primitives; invalid existing ownership content blocks initialization.
- [x] **1.6 Implement zero-write dry run**: calculate proposed base changes and render
      human and JSON summaries while proving no target or session files are modified.
      Verified direct and packed-binary dry runs report the ownership-file creation
      without writing it.
- [x] **1.7 Add foundation fixtures and tests**: cover empty directories, Git and
      non-Git roots, dirty worktrees, existing non-empty targets, invalid paths,
      Windows/POSIX normalization, failed writes, and unchanged second initialization.
      Verified 11/11 Node tests, including conflict preservation and idempotency.
- [x] **1.8 Verify the packed CLI artifact**: create an npm pack artifact, install it
      into an isolated fixture, and run its help, dry-run, and base initialization
      paths using Node.js 22+. Verified the isolated packed artifact under Node
      v22.15.0; after the Phase 3 session modules were added,
      `npm pack --dry-run --json` was reverified with the expected 20 packaged files,
      including `README.md` and all runtime inspection/session modules.

**Phase gate: PASSED 2026-08-11**: Node v22.15.0 passed `npm run lint` and all 11 Node
tests. The isolated packed artifact ran help, dry-run, and base initialization; conflict
preservation, simulated atomic-write failure, zero-write dry-run, idempotent second
initialization, and Windows/POSIX path-normalization checks passed.

---

## Phase 1A: Repository tracking hygiene

> Goal: Make the repository safe to initialize and track in Git without committing
> generated local state, dependencies, credentials, logs, or editor/OS artifacts.

- [x] **1A.1 Add repository Git ignores**: create a focused `.gitignore` for Node
      dependencies, generated package artifacts, test coverage, local RepoCharter state and temporary files, credentials, logs, and common editor/OS files; retain
      `.env.example` as a tracked configuration template. Verified in an isolated Git
      fixture: `node_modules/`, `.repo-charter/`, `.env`, package tarballs,
      coverage, and `.DS_Store` are ignored; `.env.example` remains trackable.

**Phase gate: PASSED 2026-08-11**: isolated Git ignore checks exclude the intended
local/generated files while preserving the safe environment-variable template.

---

## Phase 1B: Agent-entry contract alignment

> Goal: Make the durable product contract and learning materials explicit that each
> selected coding agent needs a verified native entry point into the shared
> `AGENTS.md` → `PLAN.md` → `TODO.md` workflow.

- [x] **1B.1 Align the agent-entry contract documentation**: update `PLAN.md`,
      `LEARNING.md`, and `README.md` to define native agent files/rules as first-class
      entry points rather than optional decoration; clarify that thin adapters remain
      essential routing bridges and platform-specific rules supplement, rather than
      replace, the canonical contract; refine pending Phase 6 tasks accordingly.
      Verified 2026-08-11: all three documents contain the same native-entry-to-
      `AGENTS.md`-to-plan/ledger workflow; nine README links resolve; lint, 11 tests,
      and an 11-file packed-artifact check passed.

**Phase gate: PASSED 2026-08-11**: the plan, learning guide, README, and adapter tasks
state one consistent selected-agent entry-point, canonical-contract, plan/ledger,
scoped-work, and verification workflow without claiming unimplemented compatibility.

---

## Phase 1C: RepoCharter identity

> Goal: Establish the pre-publication RepoCharter identity consistently across the
> package, binary, local ownership state, documentation, tests, examples, and Git
> hygiene without introducing later-phase functionality.

- [x] **1C.1 Rename the pre-release project identity**: apply the RepoCharter and
      `repo-charter` identity across product documents, package metadata, binary
      naming, CLI output/help, local state and ownership markers, tests, examples,
      license attribution, and `.gitignore`; retain the package name as provisional
      pending registry verification and update Phase 1 verification evidence after the
      renamed artifact passes. Verified 2026-08-11: no legacy references remain;
      `repo-charter` help, dry-run, and initialization create `.repo-charter/` state;
      lint and all 11 tests pass; `repo-charter@0.1.0` packs with 11 expected files.

**Phase gate: PASSED 2026-08-11**: no repository file retains the old
project/package/local-state name; the renamed Node v22.15.0 package, binary, dry-run,
foundation initialization, 11 tests, and packed artifact work under RepoCharter.

---

## Phase 2: Repository inspection and evidence model

> Goal: Produce trustworthy repository evidence without executing project code or
> collecting protected content.

- [x] **2.1 Define the evidence schema**: represent discovered facts with source path,
      evidence type, confidence/classification, freshness metadata, and the distinction
      between observed, developer-approved, and unknown information. Added versioned
      evidence records and explicit observed/developer-approved/unknown classifications
      with source freshness metadata; verified schema validation and unknown evidence.
- [x] **2.2 Implement bounded file discovery**: respect `.gitignore`, file-count and
      size limits, binary detection, explicit include/exclude configuration, and hard
      exclusions for credentials, private keys, real environment files, dependencies,
      caches, and build outputs. Implemented 1,000-file/256-KiB defaults, hard
      exclusions that overrides cannot weaken, and bounded traversal; verified ignored,
      binary, oversized, configured-filter, and file-limit cases.
- [x] **2.3 Detect languages and frameworks**: inspect manifests, conventional source
      files, and configuration to identify languages, versions, frameworks, package
      managers, lockfiles, and monorepo structure without overclaiming certainty.
      Verified Node.js/TypeScript/Next.js/React, Python, npm, and pnpm-workspace
      evidence against representative fixtures.
- [x] **2.4 Detect development commands**: extract candidate install, development,
      lint, type-check, test, build, migration, and deployment commands from manifests,
      CI, containers, and documentation without running them. Added candidate extraction
      from package scripts, CI `run` entries, Docker instructions, and documented
      commands; adversarial tests prove scripts are not executed.
- [x] **2.5 Detect architecture and operations evidence**: inventory source/test
      boundaries, schemas and migrations, CI, containers, deployment definitions,
      health checks, and existing planning or architecture documents. Verified source,
      test, Prisma schema, migration, CI, container, deployment, health, and document
      evidence on fixtures.
- [x] **2.6 Detect existing agent and planning surfaces**: inventory `AGENTS.md`,
      agent-native instruction files, `PLAN.md`, `TODO.md`, and managed markers while
      preserving their ownership status for later reconciliation. Added instruction-
      surface inventory with `unknown` ownership and safe `.repo-charter` marker
      presence detection; verified conflicting-document fixtures.
- [x] **2.7 Implement sensitive-output redaction**: prevent token-like values,
      credentials, and secret contents from appearing in evidence, logs, state, or JSON
      output; add adversarial fixtures for common credential formats. Redacts assignment,
      bearer, GitHub, OpenAI-style, and AWS-style tokens; hard-excludes sensitive paths;
      verified no adversarial token or source-content field reaches JSON output.
- [x] **2.8 Emit human and JSON inspection results**: produce stable structured output
      suitable for agent orchestration and a concise human summary with uncertainty
      and skipped-path reporting. `init` and read-only `check` now emit stable
      inspection records in `--json` and concise language/framework/candidate-command
      summaries for humans.
- [x] **2.9 Add representative inspection fixtures**: cover new/existing Node.js,
      Python, mixed-language monorepo, ignored content, oversized files, deceptive
      extensions, conflicting documentation, and missing Git metadata. Added Node,
      Python, monorepo, ignored, and conflicting-document fixture trees plus dynamic
      oversized/binary/secret/missing-Git cases; verified all 17 Node tests.

**Phase gate: PASSED 2026-08-11**: Node v22.15.0 passed `npm run lint` and all 17 Node
tests. Fixture evidence detects supported facts and uncertainty, skips protected
content, redacts adversarial token values, emits human/JSON inspection output, and
never executes the fixture package script or lifecycle hooks.

---

## Phase 3: Agent selection, resumable sessions, and conversation handoff

> Goal: Connect deterministic CLI inspection to an adaptive in-agent planning session
> without storing sensitive conversation history.

- [x] **3.1 Define the supported-agent registry**: model agent IDs, display names,
      native instruction surfaces, compatibility status, tested versions, limitations,
      and adapter template versions without claiming unverified support. Added the
      seven target-agent registry with explicit `unverified` compatibility and no tested
      versions or support claims.
- [x] **3.2 Implement primary and secondary selection**: require one primary agent,
      accept optional secondary agents, validate selections, and persist the result in
      the local session manifest. New `init` requires a valid primary agent, validates
      unique secondaries, persists selection, and rejects mismatched later selections.
- [x] **3.3 Implement the versioned session manifest**: store schema/package versions,
      current stage, confirmed decisions, selected agents, template versions, managed
      artifacts, and safe repository snapshot metadata under `.repo-charter/`. Added
      schema validation and atomic manifest writes with paths/mtime/size metadata only.
- [x] **3.4 Implement staged transitions**: enforce valid movement through inspection,
      agent selection, interview handoff, approval, application, and validation; never
      persist a later stage before its completion criterion is met. Added a validated
      one-way stage transition map and tests for valid/invalid transitions.
- [x] **3.5 Implement changed-file reinspection**: compare safe snapshot metadata on
      resume, invalidate affected evidence, and re-inspect changed paths before using
      stored conclusions. `resume` re-inspects every safe file, reports changed paths,
      updates only changed snapshots, and resets later stages to handoff-ready.
- [x] **3.6 Generate the conversation handoff**: output an exact agent prompt containing
      structured evidence, settled selections, interview procedure, privacy rules, and
      required approval gates without embedding unnecessary source content. Added a
      deterministic handoff with redacted evidence, selection metadata, and explicit
      confirmation/no-transcript rules.
- [x] **3.7 Support manual and agent-driven invocation**: make the handoff usable when
      printed to a terminal and directly consumable through `--json` when an active
      coding agent runs the CLI. Verified terminal and JSON `init`/`resume` handoffs.
- [x] **3.8 Add interruption and resume tests**: stop safely at every stage, resume
      unchanged sessions, re-inspect changed repositories, reject corrupt manifests,
      and confirm that raw conversation or secrets are never persisted. Added session
      tests for all seven valid stages, changed files, corrupt/transcript manifests,
      unchanged resume, and absent source/secret data.

**Phase gate: PASSED 2026-08-11**: Node v22.15.0 passed `npm run lint` and all 22 Node
tests. Validated agent selection, manifest stages, changed-file reinspection, manual
and JSON handoff, corrupt-manifest rejection, and no persisted transcripts, source
bodies, or secrets.

---

## Phase 4: Project grill and approved specification

> Goal: Give the active coding agent a rigorous, adaptive process for learning project
> intent and producing an explicitly approved generation specification.

- [ ] **4.1 Define the decision tree**: cover project goals, users, current pain, MVP
      boundary, workflows, architecture, data, security, integrations, operations,
      quality, future scope, risks, dependencies, assumptions, and open questions.
- [ ] **4.2 Define evidence-aware questioning rules**: prohibit asking developers for
      repository facts already available, ask the complete currently unblocked
      decision frontier in rounds, recommend answers, and follow dependencies rather
      than using a fixed questionnaire.
- [ ] **4.3 Define contradiction and ambiguity handling**: require agents to challenge
      incompatible goals, unverifiable completion claims, vague success criteria, and
      future requirements that alter present architecture.
- [ ] **4.4 Define the shared-understanding gate**: summarize every settled branch,
      expose remaining unknowns, and require explicit developer confirmation before
      generating an applicable specification.
- [ ] **4.5 Define the approved setup specification**: create a versioned machine-
      readable contract for confirmed decisions, selected verification depth, proposed
      artifacts, conflict decisions, and developer approval without storing the raw
      interview.
- [ ] **4.6 Add grill workflow evaluations**: test greenfield, existing undocumented,
      conflicting-documentation, and future-scope scenarios for unnecessary questions,
      missed branches, premature completion, and unapproved assumptions.

**Phase gate: PENDING**: representative sessions must reach explicit shared
understanding, ask only non-inferable decisions, expose contradictions, retain no raw
transcript, and emit a complete approved specification.

---

## Phase 5: Document generation and reconciliation

> Goal: Generate project-specific collaboration and planning documents while
> preserving project-owned content and reporting every conflict.

- [ ] **5.1 Create the canonical `AGENTS.md` generator**: synthesize project purpose,
      repository map, architecture, commands, invariants, conventions, plan/TODO
      protocol, multi-agent ownership and handoffs, verification rules, limitations,
      and open questions from confirmed evidence; omit irrelevant boilerplate.
- [ ] **5.2 Enforce the instruction context budget**: target a focused 150-250 line
      root contract, retain immediate commands and invariants, and link detailed
      product or reference material without weakening required behavior.
- [ ] **5.3 Create the evidence-based `PLAN.md` generator**: record approved durable
      decisions, rationale, architecture, workflows, correctness, interfaces,
      operations, exclusions, ordered gates, assumptions, and open questions while
      distinguishing intended from implemented behavior.
- [ ] **5.4 Create the traceable `TODO.md` generator**: derive ordered phases and
      implementation-grade tasks from the plan, create observable phase gates, and
      identify the first actionable task.
- [ ] **5.5 Reconstruct verified baselines carefully**: group existing capabilities
      into concise completed baseline items only when supported by observed checks or
      explicit developer confirmation; never fabricate historical sequencing.
- [ ] **5.6 Implement conflict classification**: classify every artifact as missing,
      owned-current, owned-modified, compatible-existing, merge-required, or blocked
      and attach evidence and permitted actions.
- [ ] **5.7 Implement preview and approval**: present one complete proposed change set,
      allow safe files to be approved together, and require a per-file decision for
      unresolved reconciliations.
- [ ] **5.8 Implement approved application**: atomically create or reconcile only
      approved content, use managed sections only where suitable, and never blindly
      replace project-owned `PLAN.md` or `TODO.md`.
- [ ] **5.9 Add generation and conflict fixtures**: verify empty, compatible,
      tool-modified, user-modified, contradictory, blocked, and unchanged-second-run
      scenarios with human and JSON summaries.

**Phase gate: PENDING**: approved fixtures must produce detailed project-specific
documents, preserve all unapproved content, report every conflict, maintain
plan-to-TODO traceability, and produce no diff on a second unchanged application.

---

## Phase 6: Agent adapters and installable skill

> Goal: Make the project contract reliably available to every agent claimed as
> supported and package the conversational workflow as a reusable skill.

- [ ] **6.1 Research current native instruction mechanisms**: capture primary-source
      evidence for Codex, Claude Code, GitHub Copilot, Cursor, Windsurf, Gemini CLI,
      and generic `AGENTS.md` behavior, including imports, hierarchy, precedence,
      limitations, and verification methods; confirm explicitly that every proposed
      file is actually discovered by its target agent.
- [ ] **6.2 Implement selected-agent output planning**: always propose root
      `AGENTS.md`, then add only the adapters required by the chosen primary and
      secondary agents according to the plan's default generation matrix; require each
      selected agent to have a verified native entry point into the
      `AGENTS.md` -> `PLAN.md`/`TODO.md` workflow before it is advertised as supported.
- [ ] **6.3 Implement versioned adapter templates**: generate a thin but essential
      `CLAUDE.md`, a `GEMINI.md` import adapter, and repository-wide
      `.github/copilot-instructions.md` as applicable; each adapter must route the
      selected agent to the canonical contract and its required plan/ledger workflow.
      Rely on verified root `AGENTS.md` behavior for Codex, Cursor, Windsurf, and
      generic consumers by default.
- [ ] **6.4 Guard optional rule directories**: create `.claude/rules/`,
      `.cursor/rules/`, or `.windsurf/rules/` only for confirmed platform-specific
      scoping needs that supplement the canonical contract; never generate Markdown
      `.codex/rules/rules.md` as project instructions or duplicate the canonical
      contract into generic rule files.
- [ ] **6.5 Implement adapter compatibility diagnostics**: report unverified, stale,
      degraded, unsupported, unnecessary, or unexpectedly present adapter files and
      prevent the CLI from silently advertising full compatibility.
- [ ] **6.6 Scaffold the installable skill**: create concise `SKILL.md` instructions,
      accurate trigger metadata, `agents/openai.yaml`, and only required scripts,
      references, and assets.
- [ ] **6.7 Share deterministic implementation**: make skill scripts call the same CLI
      inspection, state, generation, application, and validation paths instead of
      duplicating them.
- [ ] **6.8 Add progressive skill references**: provide directly linked guidance for
      repository analysis, grill execution, planning, conflict resolution, and agent
      compatibility while keeping the main skill workflow compact.
- [ ] **6.9 Validate and forward-test the skill**: pass structural skill validation
      and use fresh isolated contexts to initialize representative fixtures without
      leaking expected conclusions.
- [ ] **6.10 Run the supported-agent behavior matrix**: for every claimed agent,
      record agent version, adapter version, generated file set, fixture, outcomes,
      and limitations across project explanation, next-task discovery, scoped
      implementation, verification, ledger updates, and handoff.

**Phase gate: PENDING**: skill validation must pass and every advertised agent must
follow its generated contract through the full behavior evaluation with limitations
recorded honestly.

---

## Phase 7: Validation and final developer handoff

> Goal: Detect broken or stale setups and leave the developer with an exact, actionable
> result after initialization.

- [ ] **7.1 Validate manifest and ownership integrity**: check schema versions, stage
      consistency, ownership hashes, managed sections, template versions, and missing
      or unexpectedly modified artifacts.
- [ ] **7.2 Validate agent entry points**: check selected native files, canonical
      routing, compatibility status, and platform limitations.
- [ ] **7.3 Validate generated document contracts**: check `AGENTS.md` completeness,
      `PLAN.md` durable concepts, `TODO.md` task quality, phase gates, plan traceability,
      blockers, and unsupported completion claims.
- [ ] **7.4 Detect stale repository facts**: compare documented paths and commands to
      safe current inspection evidence and distinguish deterministic errors from
      advisory drift warnings.
- [ ] **7.5 Integrate approved repository checks**: record commands actually run,
      exit statuses, relevant redacted output, and verification depth without
      converting skipped checks into successes.
- [ ] **7.6 Produce the final change report**: print every created, modified, unchanged,
      skipped, and conflicted artifact; observed checks; warnings; blockers; and the
      first actionable unchecked task.
- [ ] **7.7 Verify exit-code and output contracts**: cover clean, warning, invalid,
      blocked, and partially completed states in both human and JSON modes.

**Phase gate: PENDING**: `check` must distinguish failures from advice, avoid writes,
report observed evidence faithfully, and every completed initialization must print an
exact change summary and correct next task.

---

## Phase 8: Documentation and preview distribution

> Goal: Publish a locally verifiable `0.1.0` preview that developers can understand,
> install, and trust.

- [x] **8.1 Create the user README**: document the product value, `npx` quick start,
      supported agents, conversation handoff, privacy boundary, conflict behavior,
      limitations, and preview status. Added `README.md` with clear Phase 1 versus
      planned-product boundaries, local commands, safety guarantees, planned outputs,
      roadmap, Git/GitHub hygiene, and contributing guidance. Verified nine local
      links, required status sections, package contents, lint, and all 11 tests.
- [ ] **8.2 Document the lifecycle and generated files**: add
      `docs/how-it-works.md` and `docs/generated-files.md` covering stages, ownership,
      resumption, approval, reconciliation, and recovery.
- [ ] **8.3 Document verified agent support**: add `docs/agent-support.md` with tested
      versions, native surfaces, adapter behavior, limitations, and last verification
      evidence.
- [ ] **8.4 Add contribution guidance**: document Node.js requirements, local commands,
      fixture conventions, compatibility research standards, and behavior-evaluation
      expectations in `CONTRIBUTING.md`.
- [ ] **8.5 Complete realistic examples**: retain the planning examples and add a
      generated `AGENTS.md` plus at least one full initialization output showing
      evidence, conflicts, approvals, validation, and next-task reporting.
- [ ] **8.6 Verify package identity and contents**: confirm npm name availability,
      package only runtime and required documentation assets, verify license and
      metadata, and inspect the packed artifact contents.
- [ ] **8.7 Run clean cross-platform installation**: install the packed artifact in
      clean Windows, macOS, and Linux environments and complete the documented new-
      and existing-repository flows.
- [ ] **8.8 Run the full preview acceptance suite**: verify every release criterion in
      `PLAN.md`, record actual commands and results, and leave failures or unavailable
      environments explicitly blocked.
- [ ] **8.9 Publish only after approval**: present the final package evidence and
      request explicit authorization before performing the external npm publication.

**Phase gate: PENDING**: the packed `0.1.0` artifact must satisfy every release
acceptance criterion on supported environments; publishing remains a separate
explicitly authorized external action.
