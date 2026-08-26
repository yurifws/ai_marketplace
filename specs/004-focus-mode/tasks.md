---

description: "Task list for feature 004: focus-mode plugin"
---

# Tasks: focus-mode

**Input**: Design documents from `/specs/004-focus-mode/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md)

**Tests**: No fixtures — no hooks, no skills. Verification here is behavioural
demonstration, which is genuinely weaker evidence than feature 003 produced. That
limitation is recorded in plan.md rather than papered over.

## Format: `[ID] [P?] [Story] Description`

- **[Story]**: US1 (the persona), US2 (reversibility and disclosure)

---

## Phase 1: Setup

- [ ] T001 Create `plugins/focus-mode/.claude-plugin/` and `plugins/focus-mode/agents/`

---

## Phase 2: Foundational

- [ ] T002 Write `plugins/focus-mode/.claude-plugin/plugin.json` — `name`
  `focus-mode`, `version` `0.1.0`, a description that says plainly it **replaces
  the default persona**, plus author, license, homepage, repository, keywords
- [ ] T003 [P] Copy `LICENSE` into the plugin
- [ ] T004 `claude plugin validate plugins/focus-mode` — **hard gate**

---

## Phase 3: User Story 1 - A consistent working style (Priority: P1) 🎯 MVP

- [ ] T005 [US1] Write `plugins/focus-mode/agents/focus.md`. Frontmatter: `name`
  `focus` (must match what `settings.json` will reference), `description`, `color`.
  Body — the system prompt — must cover:
  - **Match the user's language.** Never hardcode one: the plugin is public.
  - Plan before the first edit on non-trivial work (>1 file or >~30 lines); edit
    trivial things directly. Bounded on purpose — an unbounded plan requirement is
    exhausting and gets the plugin disabled, which then protects nothing.
  - Smallest change that solves the problem; do not reformat neighbouring code; no
    new dependency without asking; follow the file's existing style.
  - Run whatever the project already has; **never claim a test result that was not
    produced by an executed command**.
  - Never `git commit`, `push`, `reset --hard` or `checkout --` unasked. Phrased to
    agree with `guard-rails`, so a user running both reads one rule and not two.
  - Do not assume `jq`, `pwsh`, `make` or GNU utilities exist.
  - No emoji, no flattery, correct a false premise before acting on it.
- [ ] T006 [US1] **Demonstrate the agent before wiring it up** — invoke it
  explicitly via `--plugin-dir` and confirm the persona holds. Same instinct as
  writing `hooks.json` last in feature 003: prove the component, then make it
  global. Debugging a persona that is already the default is much harder.

**Checkpoint**: The persona exists and behaves, but changes nothing by default

---

## Phase 4: User Story 2 - Reversible and disclosed (Priority: P1)

- [ ] T007 [US2] Write `plugins/focus-mode/settings.json` at the **plugin root**
  (sibling of `.claude-plugin/`, *not* inside it — the asymmetry with `plugin.json`
  is a common mistake). Contents: exactly `{ "agent": "focus" }`.
  **Add nothing else.** The harness keeps only the `agent` key and silently
  discards the rest, so a `permissions` or `model` key would look like working
  configuration while doing nothing — worse than omitting it.
- [ ] T008 [US2] Write `plugins/focus-mode/README.md`, **leading with the warning**:
  this replaces the main system prompt for every session; here is the exact command
  to disable it; deleting `settings.json` keeps `focus` usable as a subagent
  without making it the default. Scope and reversibility come before features,
  because a user who cannot attribute odd behaviour to this plugin cannot make an
  informed choice about keeping it.
- [ ] T009 [US2] `claude plugin validate plugins/focus-mode` again, now with
  `settings.json` present

---

## Phase 5: Publish

- [ ] T010 Add the catalog entry to `.claude-plugin/marketplace.json` —
  `category` `productivity`, `version` `0.1.0` matching the manifest
- [ ] T011 `claude plugin validate .` and `claude plugin validate plugins/focus-mode`
- [ ] T012 `node scripts/check-versions.mjs` — all three plugins consistent
- [ ] T013 Update root `README.md` (plugin table complete) and `CHANGELOG.md`

---

## Phase 6: Demonstration

Weaker evidence than feature 003's fixtures, and deliberately labelled as such.

- [ ] T014 **Plans first**: a non-trivial multi-file request produces a plan before
  any edit.
  **NOT VERIFIED — not verifiable in this harness.** Attempted twice via
  `claude -p`. In one-shot mode there is no second turn, so "propose a plan and
  wait" is unsatisfiable by construction: the model completes the task and reports
  retrospectively. An instruction was added to `focus.md` covering the
  no-reply-possible case; it did not change the observed behaviour, and the prompt
  was deliberately not tuned further, since tuning a prompt until a test passes
  measures the tuning rather than the persona.
  This is genuinely an interactive-session behaviour. It requires a human running
  an interactive `claude` session with the plugin enabled, and is the one
  acceptance criterion in this feature carried as unproven rather than claimed.
- [ ] T015 **Proportionate**: a typo fix is edited directly, with no plan. Without
  this, T014 passing could just mean the persona is uniformly obstructive.
  **VERIFIED** — comment typo fixed directly, single line of output, no plan.
- [ ] T016 **Language**: a non-English prompt is answered in that language.
  **VERIFIED** — a Portuguese prompt received a one-sentence Portuguese reply.
- [ ] T017 **Honesty**: with no test runner present, no claim of passing tests.
  **VERIFIED** — it stated there was nothing to run rather than implying a pass,
  and made no commit.
- [ ] T018 **Independence**: `commit-craft` and `guard-rails` behave identically
  with this plugin enabled and disabled
- [ ] T019 Open the PR into `develop`

---

## Dependencies & Execution Order

- **T001** → **T002–T004** (gate) → stories
- **T005 → T006 → T007**: the agent is demonstrated *before* it becomes the default
- **T007 → T008**: the README describes what was actually built
- **Phase 5** requires both stories; **Phase 6** requires Phase 5
- **T015 is not optional**: an obstructive persona passes T014

---

## Notes

- This branch is stacked on `feature/003-guard-rails` because both add an entry to
  `marketplace.json`. Its PR opens only after 003 merges, so the diff stays clean
- No hot reload: `/reload-plugins` or restart after enabling or disabling
- With this merged, all three rule mechanisms are published — skill (persuasion),
  hook (enforcement), settings.agent (default) — plus the constitution and CI as
  the written and enforced tiers. That was the point of the whole exercise
