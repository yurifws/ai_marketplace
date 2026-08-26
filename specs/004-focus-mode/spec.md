# Feature Specification: focus-mode

**Feature Branch**: `feature/004-focus-mode`

**Spec Directory**: `specs/004-focus-mode`

**Created**: 2026-08-26

**Status**: Draft

**Input**: User description: "Focus-mode plugin: a default working persona applied via plugin settings"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A consistent working style without asking for it (Priority: P1)

A developer enables the plugin. From then on, every session in every project
behaves the same way: it plans before touching more than one file, makes the
smallest change that solves the problem, runs whatever tests exist rather than
claiming they pass, and never commits without being asked.

**Why this priority**: This is the plugin. It is also the marketplace's third and
final rule mechanism — a `settings.json` that replaces the main thread's system
prompt. Where a skill fires when judged relevant and a hook fires on an event, this
applies to *everything*, unconditionally, for the whole session.

**Independent Test**: Enable the plugin, open a session, and give a non-trivial
multi-file task. Observe that a plan is proposed before any edit.

**Acceptance Scenarios**:

1. **Given** the plugin is enabled, **When** a session starts, **Then** the `focus`
   agent is the main thread's persona.
2. **Given** a non-trivial task, **When** it is requested, **Then** a short plan is
   proposed before the first file edit.
3. **Given** a trivial task such as a typo, **When** it is requested, **Then** the
   edit is made directly, without ceremony.
4. **Given** work is complete, **When** no test was executed, **Then** no claim
   about tests passing is made.
5. **Given** the user has not asked for it, **When** work finishes, **Then** no
   `git commit` or `git push` is run.
6. **Given** the user writes in a language other than English, **When** the model
   replies, **Then** it replies in that language.

---

### User Story 2 - The change is reversible and the user knows what it does (Priority: P1)

A developer can tell, before enabling, that this plugin replaces their default
persona, and can undo it in one command if they dislike it.

**Why this priority**: Equal to US1, and genuinely so. This is the most invasive
and least visible mechanism in the marketplace: nothing announces itself, the
change applies everywhere, and a user who does not like it may not immediately
connect the behaviour to the plugin. An invasive change that is hard to attribute
and hard to undo is a bad plugin regardless of how good the persona is.

**Independent Test**: Read the README before installing and confirm the scope of
the change is stated. Then disable the plugin and confirm default behaviour
returns.

**Acceptance Scenarios**:

1. **Given** the README, **When** a user reads it before installing, **Then** it
   states plainly that the plugin replaces the main system prompt.
2. **Given** the plugin is enabled, **When** the user runs `/plugin disable`,
   **Then** default behaviour returns after a reload.
3. **Given** a user who wants the persona only occasionally, **When** they read the
   README, **Then** they learn the `settings.json` can be deleted while keeping the
   agent available as a subagent.
4. **Given** the plugin is installed, **When** the other plugins are in use,
   **Then** neither is affected — the three are independent.

---

### Edge Cases

- **Only the `agent` key survives.** The harness keeps exactly one key from a
  plugin's `settings.json`. Anything else — permissions, model, env, hooks — is
  discarded silently, with no error to tell you.
- **The agent name must resolve.** A `settings.json` naming an agent that does not
  exist has no useful effect and produces no obvious diagnostic.
- **A persona that is too rigid becomes an obstacle.** Demanding a plan for a typo
  makes the plugin exhausting. The persona must scale ceremony to the task.
- **Hardcoding a language would be wrong.** The plugin is public. It must match the
  user's language rather than impose the maintainer's.
- **Combined with `guard-rails`.** Both may act in one session; neither should
  contradict the other. Both say "do not commit unasked", which must read as one
  rule rather than two conflicting ones.
- **No hot reload.** Enabling or disabling requires `/reload-plugins` or a restart.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The plugin MUST ship `.claude-plugin/plugin.json`, `README.md`, and
  `LICENSE`.
- **FR-002**: `settings.json` MUST be at the **plugin root**, not inside
  `.claude-plugin/`.
- **FR-003**: `settings.json` MUST contain only `{ "agent": "focus" }` — no other
  key is honoured, so including one would imply a guarantee that does not exist.
- **FR-004**: `agents/focus.md` MUST exist with a `name` of `focus` matching the
  `settings.json` reference.
- **FR-005**: The persona MUST match the user's language rather than fix one.
- **FR-006**: The persona MUST require a plan before the first edit on non-trivial
  work, and MUST allow trivial edits directly.
- **FR-007**: The persona MUST forbid claiming unexecuted test results.
- **FR-008**: The persona MUST forbid `git commit`, `git push`, `reset --hard` and
  `checkout --` unless asked.
- **FR-009**: The persona MUST NOT assume `jq`, `pwsh`, `make`, or GNU utilities
  exist.
- **FR-010**: The README MUST state that the plugin replaces the main system prompt,
  and give the exact command to disable it.
- **FR-011**: The README MUST document deleting `settings.json` to keep the agent
  as a subagent only.
- **FR-012**: The `marketplace.json` entry MUST be added with a matching `version`.
- **FR-013**: The plugin MUST ship no hooks and no skills — it is exactly one
  mechanism, for clarity.

### Key Entities

- **Agent definition**: `agents/focus.md`, frontmatter plus a body that becomes the
  system prompt.
- **Plugin settings**: `settings.json` at the plugin root. Only `agent` is honoured.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With the plugin enabled, a non-trivial multi-file task produces a
  plan before the first edit.
- **SC-002**: A trivial edit is made directly, with no plan.
- **SC-003**: A non-English prompt receives a reply in that language.
- **SC-004**: No commit is made without an explicit request.
- **SC-005**: `claude plugin validate plugins/focus-mode` passes.
- **SC-006**: Disabling the plugin restores default behaviour after a reload.
- **SC-007**: `commit-craft` and `guard-rails` behave identically whether or not
  this plugin is enabled.

## Assumptions

- The harness honours only the `agent` key from a plugin `settings.json`. This was
  verified directly against the installed binary, whose schema reads
  *"Only allowlisted keys are kept (currently: agent)"*. If that widens later, the
  plugin can grow; it will not silently break.
- The persona is opinionated on purpose. A neutral one would change nothing and be
  pointless to publish. The README therefore has to be honest about what is being
  imposed, so the choice is the user's.
- This ships as a **separate** plugin rather than being folded into another
  precisely so it can be disabled alone.
- Ceremony scales to task size. The plan requirement is bounded (more than one
  file, or more than roughly thirty lines) rather than universal.
- Verifying a persona is inherently softer than verifying a hook. Behavioural
  checks are demonstrations rather than proofs, and the spec does not pretend
  otherwise.
