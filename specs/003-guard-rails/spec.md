# Feature Specification: guard-rails

**Feature Branch**: `feature/003-guard-rails`

**Spec Directory**: `specs/003-guard-rails`

**Created**: 2026-08-26

**Status**: Draft

**Input**: User description: "Guard-rails plugin: block secrets on write and inject repository context at session start"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A credential cannot be written to a file (Priority: P1)

A developer is working with an agent that, for whatever reason, is about to write a
real API key into a source file. The write is refused before it happens, and the
agent is told why and what to do instead.

**Why this priority**: This is the only capability in the entire marketplace that
*prevents* rather than *suggests*. A secret committed to a public repository is
effectively permanent — rotating it is the only remedy, and that assumes someone
noticed. Everything else here is recoverable; this is not.

**Independent Test**: Feed the hook a payload containing an AWS access key on
stdin and assert it exits `2` with an explanatory message on stderr. No session
required.

**Acceptance Scenarios**:

1. **Given** a Write whose content contains an AWS access key ID, **When** the hook
   runs, **Then** it exits `2` and stderr explains what was found and what to do.
2. **Given** a Write of ordinary source code, **When** the hook runs, **Then** it
   exits `0` and produces no output.
3. **Given** an Edit whose `new_string` contains a private key header, **When** the
   hook runs, **Then** it exits `2`.
4. **Given** a MultiEdit where only one entry of `edits[]` contains a token,
   **When** the hook runs, **Then** it exits `2`.
5. **Given** a write to a path named `.env`, **When** the hook runs, **Then** it
   exits `2` regardless of content.
6. **Given** an obvious documentation placeholder such as `<YOUR_API_KEY_HERE>`,
   **When** the hook runs, **Then** it exits `0` — a guard that blocks
   documentation gets disabled, and a disabled guard protects nothing.
7. **Given** malformed or empty stdin, **When** the hook runs, **Then** it exits
   `0` rather than failing closed on every write in the session.

---

### User Story 2 - The session starts knowing where it is (Priority: P2)

A developer opens a session in a repository. Before saying anything, the agent
already knows the branch, whether the tree is dirty, and the rules that apply —
including that it must not edit directly on a protected branch.

**Why this priority**: Valuable but not protective. It improves every session
slightly rather than preventing a specific disaster. It also demonstrates the
*other* thing hooks can do — inject context deterministically, rather than block.

**Independent Test**: Run the hook with empty stdin inside a git repository and
assert it emits JSON containing `hookEventName` and the current branch.

**Acceptance Scenarios**:

1. **Given** a git repository, **When** the hook runs, **Then** stdout is valid
   JSON containing `hookSpecificOutput.hookEventName` = `SessionStart` and an
   `additionalContext` string.
2. **Given** a git repository, **When** the hook runs, **Then** `additionalContext`
   names the current branch and the count of uncommitted files.
3. **Given** the current branch is `main` or `develop`, **When** the hook runs,
   **Then** `additionalContext` instructs the agent to propose a feature branch
   before editing.
4. **Given** a directory that is not a git repository, **When** the hook runs,
   **Then** it exits `0` and emits nothing.
5. **Given** git is unavailable or a command fails, **When** the hook runs, **Then**
   it exits `0` without an error — a broken context hook must not break sessions.

---

### Edge Cases

- **A false positive blocks legitimate work.** This is the failure mode that kills
  the plugin: a guard that cries wolf gets uninstalled, and then it protects
  nothing. Documentation placeholders, example keys, and test fixtures must pass.
- **Base64 and long hashes.** Lockfile integrity hashes and inline data URIs look
  superficially like secrets. Blocking them makes the plugin unusable in any real
  project.
- **The payload shape varies by tool.** `Write` uses `content`; `Edit` uses
  `new_string`; `MultiEdit` uses `edits[].new_string`. Reading only one shape means
  silently missing the others.
- **The hook itself must not leak.** Its stderr is shown to the model and may be
  logged, so it must describe *what kind* of secret matched — never echo the
  matched value.
- **Windows paths.** `${CLAUDE_PLUGIN_ROOT}` expands to a path with backslashes and
  possibly spaces; unquoted, the command breaks.
- **A hang freezes the session.** Every hook entry needs a `timeout`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The plugin MUST ship `.claude-plugin/plugin.json`, `README.md`, and
  `LICENSE`.
- **FR-002**: Hooks MUST be Node `.mjs` — never bash with `jq`, never
  `shell: "powershell"` (which invokes `pwsh`, absent on the maintainer's machine).
- **FR-003**: `hooks/hooks.json` MUST register `check-secrets.mjs` on `PreToolUse`
  matching `Write|Edit|MultiEdit|NotebookEdit`, and `session-brief.mjs` on
  `SessionStart`.
- **FR-004**: Every hook entry MUST declare a `timeout`.
- **FR-005**: Hook commands MUST reference `${CLAUDE_PLUGIN_ROOT}` and MUST
  double-quote it.
- **FR-006**: `check-secrets.mjs` MUST inspect `content`, `new_string`, and every
  `edits[].new_string`.
- **FR-007**: `check-secrets.mjs` MUST exit `2` on detection, writing an
  actionable explanation to stderr.
- **FR-008**: `check-secrets.mjs` MUST NOT echo the matched secret value.
- **FR-009**: `check-secrets.mjs` MUST exit `0` on recognised placeholders.
- **FR-010**: `check-secrets.mjs` MUST exit `0` on malformed or empty stdin.
- **FR-011**: `session-brief.mjs` MUST emit `hookSpecificOutput` JSON with
  `hookEventName: "SessionStart"` and `additionalContext`.
- **FR-012**: `session-brief.mjs` MUST exit `0` silently outside a git repository
  or when any git command fails.
- **FR-013**: `hooks/fixtures.json` MUST cover every hook, with at least one
  blocking and one allowing case for `check-secrets.mjs`, so
  `scripts/test-hooks.mjs` passes.
- **FR-014**: The `marketplace.json` entry MUST be added with a matching `version`.
- **FR-015**: The README MUST state plainly that this plugin can block actions and
  how to disable it.

### Key Entities

- **Hook**: a program the harness runs at a lifecycle event. Communicates by exit
  code — `0` allow, `2` block with stderr returned to the model, anything else a
  non-blocking error.
- **Hook payload**: the JSON on stdin describing the pending tool call. Its shape
  varies by tool, which is the main source of silent misses.
- **Fixture**: a declared test case in `hooks/fixtures.json`. The constitution
  requires one per hook because an untested blocking hook is a defect waiting to
  happen.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the blocking fixtures exit `2`; 100% of the allowing fixtures
  exit `0`.
- **SC-002**: Zero false positives across a corpus of ordinary source, lockfile
  hashes, and documentation placeholders.
- **SC-003**: In a live session, a Write containing an AWS key is refused and the
  file is not created.
- **SC-004**: In a live session, a Write of ordinary code succeeds unimpeded.
- **SC-005**: `check-secrets.mjs` completes in well under its timeout on a typical
  payload, since it runs on every single edit.
- **SC-006**: A session opened in this repository shows the branch and uncommitted
  count without the user asking.
- **SC-007**: The hook never prints a matched secret value.
- **SC-008**: `claude plugin validate plugins/guard-rails` and
  `node scripts/test-hooks.mjs` both pass.

## Assumptions

- Node 22+ is available; it is what runs the hooks. This is the plugin's only
  runtime dependency and it is the reason for choosing Node over bash.
- Regex detection is a net, not a proof. It catches well-known credential formats
  and will miss novel ones. The plugin is a safety net, not a security boundary,
  and the README must say so rather than implying guarantees.
- Blocking is the correct default for a detection. A false positive costs a user
  one interruption; a false negative can cost a permanently leaked credential.
  That asymmetry justifies the default — but only while false positives stay rare
  enough that nobody disables the plugin.
- `PreToolUse` fires before the write, so blocking prevents the file from ever
  existing.
- Users can disable the plugin at any time. This is a guard, not a jail.
