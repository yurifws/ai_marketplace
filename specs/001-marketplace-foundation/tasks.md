---

description: "Task list for feature 001: marketplace foundation"
---

# Tasks: Marketplace Foundation

**Input**: Design documents from `/specs/001-marketplace-foundation/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md)

**Tests**: This feature builds the test *harnesses* (`scripts/*.mjs`). They have
nothing to assert against yet — features 002 through 004 supply the subjects. Each
harness must exit 0 cleanly on an empty repository, which is itself the test here.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 (install), US2 (gate), US3 (documentation)

## Path Conventions

Content repository — no `src/`. Paths are repository-root relative, per plan.md.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Directories that later tasks write into.

- [ ] T001 Create `.claude-plugin/`, `.github/workflows/`, `scripts/`, `docs/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The catalog. Nothing else in this repository means anything until a
valid catalog exists — CI validates it, the docs describe it, plugins register in it.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 Write `.claude-plugin/marketplace.json` with `name: ai-marketplace`,
  `owner`, and `plugins: []`. Omit `$schema` and any root `description` — the
  installed validator rejects both keys.
- [ ] T003 Run `claude plugin validate .` and confirm it passes against the empty
  catalog. **Do not proceed past a failure here** — a schema mistake found against
  one file is obvious; the same mistake found across thirty is a search.

**Checkpoint**: Catalog valid — user story work can begin

---

## Phase 3: User Story 1 - A stranger installs the marketplace (Priority: P1) 🎯 MVP

**Goal**: The marketplace registers and resolves from a clean machine, with zero
plugins present.

**Independent Test**: `claude plugin marketplace add <repo>` then
`claude plugin marketplace list` shows `ai-marketplace`, no error.

- [ ] T004 [US1] Write root `LICENSE` (MIT, `Copyright (c) 2026 yurifws`)
- [ ] T005 [US1] Verify registration end-to-end:
  `claude plugin marketplace add C:\Users\yuri_\git\ai_marketplace`,
  then `claude plugin marketplace list`. Remove it afterward to leave a clean state.

**Checkpoint**: US1 complete — the marketplace is installable, though empty

---

## Phase 4: User Story 2 - A broken change cannot reach develop (Priority: P1)

**Goal**: Malformed contributions are rejected automatically, and the maintainer
cannot route around the rejection.

**Independent Test**: A deliberately broken manifest turns CI red; a direct
`git push origin develop` is rejected.

### Local check harnesses (built before the workflows that call them)

- [ ] T006 [P] [US2] Write `scripts/test-hooks.mjs` — discovers
  `plugins/*/hooks/*.mjs`, feeds each fixture payloads via stdin, asserts exit
  codes (`0` allow, `2` block). Must exit 0 with a clear "nothing to test" message
  when no hooks exist.
- [ ] T007 [P] [US2] Write `scripts/lint-skills.mjs` — walks
  `plugins/*/skills/*/SKILL.md`, asserts YAML frontmatter parses and `description`
  is present, non-empty, and not generic. Must exit 0 cleanly on an empty set.
- [ ] T008 [US2] Run both scripts locally; confirm each exits 0 (depends on T006, T007)

### CI workflows

- [ ] T009 [US2] Write `.github/workflows/ci.yml` with four jobs:
  `discover` (dynamic plugin list, must emit `[]` without erroring),
  `validate-marketplace`, `validate-plugins` (matrix, `fail-fast: false`,
  skipped when the list is empty), `test-and-lint` (both scripts plus a JSON
  parse sweep over every tracked `.json`). No secrets — `claude plugin validate`
  needs no authentication.
- [ ] T010 [US2] Write `.github/workflows/branch-policy.yml` enforcing
  `feature/NNN-slug`, `release/*`, `hotfix/*`, and the git-flow topology.
  **Must allow `develop` → `main` and `main` → `develop`** as head refs, or the
  mandatory release merge-back is rejected by our own rules.
- [ ] T011 [P] [US2] Write `.github/pull_request_template.md` — link the spec
  directory, confirm `/speckit-analyze` ran clean, confirm manual end-to-end
  verification was actually performed.

**Checkpoint**: CI defined; enforcement verified after merge in Phase 6

---

## Phase 5: User Story 3 - A newcomer understands the model (Priority: P2)

**Goal**: A reader can distinguish the mechanisms and their guarantees without
reading source.

**Independent Test**: A reader finishes `docs/concepts.md` and can say which
components block an action and which only suggest one.

- [ ] T012 [P] [US3] Write `docs/concepts.md` — the four layers
  (marketplace → plugin → components), and the "who fires what" table covering
  skill (model decides), agent (delegated), hook (harness, deterministic),
  settings.json (harness, `agent` key only), plus constitution and CI as the
  written and enforced tiers.
- [ ] T013 [P] [US3] Write `docs/installation.md` — install commands, the
  `<plugin>@ai-marketplace` naming trap (marketplace name ≠ repo name), and local
  development via `claude --plugin-dir`.
- [ ] T014 [P] [US3] Write `CONTRIBUTING.md` — branching table, release procedure
  including the merge-back, PR title convention, and the local pre-push command.
- [ ] T015 [P] [US3] Write `CHANGELOG.md` (Keep a Changelog format, `0.1.0` unreleased)
- [ ] T016 [US3] Write root `README.md` — what this is, the one-line install
  command, the plugin table (empty for now), links to `docs/concepts.md` and
  `CONTRIBUTING.md` (depends on T012, T014)

**Checkpoint**: All three user stories complete

---

## Phase 6: Enforcement & Verification

**Purpose**: Prove the rules reject things. This is the half normally skipped, and
the half that shows the gate is real rather than decorative.

- [ ] T017 Open the pull request into `develop`; confirm every check runs and passes
- [ ] T018 Merge, then apply branch protection to `develop` and `main`.
  `required_approving_review_count: 0` (a solo maintainer cannot approve their own
  PR — 1 is a deadlock, not a policy). **Omit `validate-plugins` from required
  contexts** until a plugin exists; a required check that never runs blocks every
  PR forever. All four top-level API fields must be present, even as null.
- [ ] T019 Verify rejection: `git push origin develop` directly → must be refused
- [ ] T020 Verify rejection: open a PR from a badly named branch → `branch-policy` red
- [ ] T021 Verify rejection: open a PR into `main` from a feature branch → `branch-policy` red
- [ ] T022 Verify acceptance: a `main` → `develop` PR passes, proving the release
  merge-back path is open (depends on T018)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)**: no dependencies
- **Foundational (T002–T003)**: blocks everything; T003 is a hard gate
- **US1 (T004–T005)**, **US2 (T006–T011)**, **US3 (T012–T016)**: all unblocked once
  T003 passes, and mutually independent
- **Phase 6 (T017–T022)**: requires all stories; T019–T022 require T018

### Within User Story 2

The harnesses (T006, T007) come before the workflow that calls them (T009). A
workflow referencing an unverified script fails in CI for reasons that look like
YAML problems and are not.

### Parallel Opportunities

- T006 and T007 — different files
- T012 through T015 — different files
- All three user stories, if staffed by different people

---

## Implementation Strategy

**MVP is T001–T005**: a registrable marketplace. Genuinely shippable alone, though
it would publish nothing.

**Recommended order is US1 → US2 → US3.** The gate before the documentation,
because features 002–004 depend on the gate existing and only benefit from the
documentation. Documentation written last is also more accurate — it describes what
was built rather than what was intended.

**Do not defer Phase 6.** Rules that have never been observed to reject anything
are indistinguishable from rules that do not work.

---

## Notes

- Commit per logical group, not per task
- The constitution forbids direct commits to `develop`; the spec-kit bootstrap
  commit is the single documented exception, and T018 closes that hole permanently
- Every path here is repository-root relative; no absolute paths in committed files
