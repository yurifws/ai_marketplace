---

description: "Task list for feature 002: commit-craft plugin"
---

# Tasks: commit-craft

**Input**: Design documents from `/specs/002-commit-craft/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md)

**Tests**: No hook fixtures — this plugin ships no hooks. Verification is
`lint-skills.mjs`, `claude plugin validate`, and manual activation testing, which
is the only check that proves a skill actually fires.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 (commit messages), US2 (PR descriptions)

---

## Phase 1: Setup

- [ ] T001 Create `plugins/commit-craft/.claude-plugin/` and `plugins/commit-craft/skills/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The plugin must be a valid, complete plugin before either skill means
anything. Constitution principle I: complete or it does not ship.

- [ ] T002 Write `plugins/commit-craft/.claude-plugin/plugin.json` — `name`
  (`commit-craft`, must equal the future catalog entry), `version` `0.1.0`,
  `description`, `author`, `license`, `homepage`, `repository`, `keywords`.
  Omit all path fields: components sit in default locations.
- [ ] T003 [P] Write `plugins/commit-craft/LICENSE` (MIT — plugins are distributed
  in isolation, so each carries its own)
- [ ] T004 Run `claude plugin validate plugins/commit-craft`. **Hard gate** — do
  not write skills against a manifest that does not validate.

**Checkpoint**: Valid, empty plugin

---

## Phase 3: User Story 1 - Commit messages follow one convention (Priority: P1) 🎯 MVP

**Goal**: Asking "commit this" produces a house-format message and waits for approval.

**Independent Test**: With staged changes, ask for a commit; check format, and that
nothing is committed before approval.

- [ ] T005 [US1] Write `plugins/commit-craft/skills/conventional-commits/SKILL.md`.
  Frontmatter: `name` matching the directory, a `description` quoting the phrases
  users actually type plus a "Use when" clause, and narrowly scoped
  `allowed-tools` (`Bash(git status:*)`, `Bash(git diff:*)`, `Bash(git log:*)`,
  `Bash(git add:*)`, `Bash(git commit:*)` — never blanket `Bash`).
  Body must cover: the `type(scope): summary` format with the 72-char limit; the
  permitted type table; `!` plus `BREAKING CHANGE:`; the procedure (inspect with
  `git status --porcelain` and `git diff --staged`, never `git add -A` unprompted,
  propose splitting a mixed diff, **show the message and wait for approval**, never
  `--no-verify`); a bad-versus-good body example showing that the body answers
  "why" because the diff already shows "what"; anti-patterns to refuse.
- [ ] T006 [US1] Run `node scripts/lint-skills.mjs` — must pass (depends on T005)

**Checkpoint**: US1 shippable on its own

---

## Phase 4: User Story 2 - PR descriptions are consistent (Priority: P2)

**Goal**: A PR description a reviewer can act on, in four sections.

**Independent Test**: On a branch ahead of its base, request a description; confirm
all four sections are present and specific.

- [ ] T007 [US2] Write `plugins/commit-craft/skills/pr-description/SKILL.md`.
  Frontmatter adds `argument-hint: "[base-branch]"`. Body: base is `$1` defaulting
  to `develop`; gather via `git log --oneline $1..HEAD` and
  `git diff --stat $1...HEAD`; emit **What changes** / **Why** / **How to test** /
  **Risks**; PR title follows the commit convention because squash-merge turns it
  into the commit message; suggest splitting past ~400 lines across unrelated
  areas; **never state a test result that was not produced by an executed command**.
- [ ] T008 [US2] Run `node scripts/lint-skills.mjs` — must pass for both skills

**Checkpoint**: Both skills complete

---

## Phase 5: Publish & Verify

- [ ] T009 Write `plugins/commit-craft/README.md` — what it does, what it does
  **not** do (no hooks, nothing blocked, no defaults changed), the two skills, and
  how to disable it
- [ ] T010 Append the `commit-craft` entry to `plugins[]` in
  `.claude-plugin/marketplace.json`: `name` (identical to `plugin.json`), `source`
  `"./plugins/commit-craft"` (the **directory**, never the `.json`), `description`,
  `version` `0.1.0` (must match the manifest), `author`, `license`,
  `category` `development`, `keywords`
- [ ] T011 Run `claude plugin validate .` — the root, now non-empty
- [ ] T012 Run `claude plugin validate plugins/commit-craft` — the plugin
  individually. **Not redundant**: a root validate does not descend into per-plugin
  manifests, so this is the only check that would catch a broken one before install.
- [ ] T013 Load with `claude --plugin-dir plugins/commit-craft`; confirm both
  skills are listed under `/`
- [ ] T014 **Activation test** — with staged changes, say "commit this" *without*
  naming the skill, and confirm `conventional-commits` fires and proposes the house
  format. This is the only task that tests the thing that actually matters: a skill
  that lints clean but never activates is a silent no-op.
- [ ] T015 **Restraint test** — confirm the skill stops at the proposed message and
  does not commit
- [ ] T016 Update root `README.md` plugin table and `CHANGELOG.md`
- [ ] T017 Open the PR into `develop`; confirm `validate-plugins` now **runs**
  rather than skipping — this is the first PR where the matrix has a subject

---

## Dependencies & Execution Order

- **T001** → **T002–T004** (gate) → everything else
- **US1 (T005–T006)** and **US2 (T007–T008)** are independent; either could ship alone
- **T009–T017** require both stories
- **T012** must not be skipped in favour of **T011** — they check different things

### Parallel Opportunities

- T003 alongside T002
- US1 and US2, if staffed separately

---

## Notes

- After this merges, `validate-plugins` stops skipping and can finally be added to
  the required status checks (deferred from feature 001 T018, where a check that
  never runs would have blocked every PR permanently)
- `version` lives in two files and both must agree, or `claude plugin update` will
  not notice a new release
- This plugin is deliberately incapable of enforcing anything. That limit is the
  point — feature 003 provides the contrast
