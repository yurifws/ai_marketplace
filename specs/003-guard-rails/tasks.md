---

description: "Task list for feature 003: guard-rails plugin"
---

# Tasks: guard-rails

**Input**: Design documents from `/specs/003-guard-rails/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md)

**Tests**: Mandatory here, unlike features 001–002. Constitution principle III
requires every hook to have both a passing and a blocking case, because this is
the first plugin that can refuse an action.

## Format: `[ID] [P?] [Story] Description`

- **[Story]**: US1 (block secrets), US2 (session context)

---

## Phase 1: Setup

- [ ] T001 Create `plugins/guard-rails/.claude-plugin/` and `plugins/guard-rails/hooks/`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T002 Write `plugins/guard-rails/.claude-plugin/plugin.json` — `name`
  `guard-rails`, `version` `0.1.0`, description that says plainly it can **block**
  writes, plus `author`, `license`, `homepage`, `repository`, `keywords`
- [ ] T003 [P] Copy `LICENSE` into the plugin
- [ ] T004 Run `claude plugin validate plugins/guard-rails` — **hard gate**

---

## Phase 3: User Story 1 - A credential cannot be written (Priority: P1) 🎯 MVP

**Goal**: A write containing a recognisable credential is refused before the file
exists.

**Independent Test**: Pipe a payload with an AWS key into the hook; assert exit `2`
and an explanatory stderr.

- [ ] T005 [US1] Write `plugins/guard-rails/hooks/check-secrets.mjs`:
  - Read stdin; on unparseable or empty input **exit 0** (fail open — failing
    closed would brick every write in the session on one unexpected payload)
  - Extract text from **all three payload shapes**: `tool_input.content` (Write),
    `tool_input.new_string` (Edit), and every `tool_input.edits[].new_string`
    (MultiEdit). Reading only one shape silently misses the others.
  - **Check the placeholder allowlist first** — `<YOUR_..._HERE>`, `xxxxx`,
    `AKIAIOSFODNN7EXAMPLE`, `example`, `changeme`. Documentation is where
    credential-shaped strings are most common and least dangerous.
  - Match anchored, issuer-specific patterns: AWS `AKIA[0-9A-Z]{16}`, private key
    headers, `sk-ant-`, `gh[pousr]_`, `xox[baprs]-`, JWT, and
    `password|secret|api_key|token` assigned a long literal. **No entropy
    heuristics** — they misfire on lockfile hashes and minified code.
  - Flag writes to `.env` paths regardless of content
  - On detection: **exit 2**, stderr naming the *kind* of credential and what to do
    instead. **Never echo the matched value** — stderr goes to the model and may be
    logged.
- [ ] T006 [US1] Write the blocking cases in `plugins/guard-rails/hooks/fixtures.json`:
  AWS key via `content`; private key via `new_string`; token inside `edits[]`;
  a `.env` path
- [ ] T007 [US1] Write the **allowing** cases — ordinary source, a lockfile
  integrity hash, a data URI, `<YOUR_API_KEY_HERE>`, empty stdin, malformed stdin.
  Constitution III: a false positive is as severe as a false negative. This is the
  half that decides whether anyone keeps the plugin installed.
- [ ] T008 [US1] Run `node scripts/test-hooks.mjs` — all cases pass (needs T005–T007)
- [ ] T009 [US1] Confirm no matched value ever appears in stderr

**Checkpoint**: US1 shippable alone — the protective half

---

## Phase 4: User Story 2 - The session starts knowing where it is (Priority: P2)

- [ ] T010 [US2] Write `plugins/guard-rails/hooks/session-brief.mjs`:
  - `git rev-parse --abbrev-ref HEAD`, `git status --porcelain`, `git log -1 --pretty=%s`
  - **Exit 0 silently** when not a git repo, when git is missing, or when any
    command fails. A context hook that errors on session start is worse than none.
  - Emit `{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"..."}}`
  - `additionalContext`: branch, uncommitted count, last commit subject, and the
    standing rules — including **on `main`, `develop` or `release/*`, propose a
    feature branch before editing.** This catches the mistake while editing, rather
    than at push time where branch protection catches it — after the work is
    already on the wrong branch.
- [ ] T011 [US2] Add its fixture: valid JSON on stdout containing `hookEventName`
- [ ] T012 [US2] Run `node scripts/test-hooks.mjs` — both hooks pass

---

## Phase 5: Wire up & Publish

- [ ] T013 Write `plugins/guard-rails/hooks/hooks.json` — `PreToolUse` matching
  `Write|Edit|MultiEdit|NotebookEdit` → `check-secrets.mjs`; `SessionStart` →
  `session-brief.mjs`. **Every entry needs a `timeout`** (a hook that hangs freezes
  the session), and `${CLAUDE_PLUGIN_ROOT}` must be **double-quoted** (on Windows it
  expands to a path with backslashes and possibly spaces).
  Written **last, deliberately**: a broken hook inside a session is far harder to
  diagnose than a broken script at a terminal.
- [ ] T014 Write `plugins/guard-rails/README.md` — states plainly that this plugin
  **blocks** actions, what it detects, that regex detection is a net and not a
  security boundary, and exactly how to disable it
- [ ] T015 Add the catalog entry to `.claude-plugin/marketplace.json`, `category`
  `security`, `version` `0.1.0` matching the manifest
- [ ] T016 Run `claude plugin validate .` and `claude plugin validate plugins/guard-rails`
- [ ] T017 Run `node scripts/check-versions.mjs`

---

## Phase 6: Live Verification

Fixtures prove the script behaves at a terminal. They do **not** prove the harness
actually invokes it, that the matcher fires on the right tools, or that a block
truly prevents the file from existing.

- [ ] T018 `claude --plugin-dir plugins/guard-rails` → `/hooks` lists both entries
- [ ] T019 **Live block**: ask for a file containing an AWS key → the Write is
  refused **and the file does not exist afterward**
- [ ] T020 **Live allow**: the same file with ordinary content → created normally.
  Without this, T019 passing could just mean everything is blocked.
- [ ] T021 **Live context**: a session in this repository reports branch and
  uncommitted count without being asked
- [ ] T022 Update root `README.md` and `CHANGELOG.md`
- [ ] T023 Open the PR into `develop`

---

## Dependencies & Execution Order

- **T001** → **T002–T004** (gate) → stories
- **US1 (T005–T009)** and **US2 (T010–T012)** are independent
- **T013 requires both scripts proven** — that ordering is the point
- **Phase 6 requires Phase 5**
- **T020 is not optional**: a blocker that blocks everything passes T019

### Parallel Opportunities

- T003 alongside T002
- US1 and US2

---

## Notes

- Fixtures must contain **no real credentials** — only well-known documentation
  examples such as AWS's published `AKIAIOSFODNN7EXAMPLE`. This repository is public
- Hooks do **not** hot-reload; `/reload-plugins` after any edit
- Exit codes are the contract: `0` allow, `2` block with stderr to the model,
  anything else a non-blocking error
