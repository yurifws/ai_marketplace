# Feature Specification: commit-craft

**Feature Branch**: `feature/002-commit-craft`

**Spec Directory**: `specs/002-commit-craft`

**Created**: 2026-08-26

**Status**: Draft

**Input**: User description: "Commit-craft plugin with conventional-commits and pr-description skills"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Commit messages follow one convention without being asked (Priority: P1)

A developer finishes a change and says "commit this". Instead of a generic
message, they get `type(scope): summary` in the house format, with a body that
explains *why* rather than restating the diff — and they are shown the message for
approval before anything is committed.

**Why this priority**: This is the plugin's reason to exist, and it is the
marketplace's first published example of a skill. If it fires reliably, the whole
mechanism is demonstrated; if it does not, nothing else in the plugin matters.

**Independent Test**: In a repository with staged changes, ask for a commit.
Observe the message format, and that no commit is created before approval.

**Acceptance Scenarios**:

1. **Given** a repository with staged changes, **When** the user says "commit
   this", **Then** the skill activates and proposes a message of the form
   `type(scope): summary`.
2. **Given** a proposed message, **When** it is shown, **Then** no commit has been
   created yet and the user is asked to approve.
3. **Given** a diff mixing unrelated concerns, **When** the skill runs, **Then** it
   proposes splitting into separate commits before writing any message.
4. **Given** nothing is staged, **When** the skill runs, **Then** it shows what is
   unstaged and does **not** run `git add -A` on its own initiative.
5. **Given** a change that breaks compatibility, **When** the message is written,
   **Then** it uses `!` before the colon and includes a `BREAKING CHANGE:` body
   section.

---

### User Story 2 - Pull request descriptions are consistent and reviewable (Priority: P2)

A developer opens a pull request and gets a description that a reviewer can act on:
what changed in plain language, why, how to test it, and what might break.

**Why this priority**: Valuable and frequently used, but a PR happens far less
often than a commit, so it delivers less per unit of effort. It is also the second
skill in the plugin, which is what demonstrates that a plugin is a *collection*.

**Independent Test**: On a branch with commits ahead of its base, ask for a PR
description and confirm all four sections are present and specific.

**Acceptance Scenarios**:

1. **Given** a branch ahead of `develop`, **When** the user asks for a PR
   description, **Then** the output contains **What changes**, **Why**, **How to
   test**, and **Risks**.
2. **Given** no base branch is supplied, **When** the skill runs, **Then** it
   defaults to `develop`.
3. **Given** a base branch is supplied as an argument, **When** the skill runs,
   **Then** that branch is used instead.
4. **Given** tests were not executed, **When** the description is written, **Then**
   it does not claim any test result.

---

### Edge Cases

- **Not a git repository.** The skill should say so plainly rather than producing a
  message for a diff it cannot read.
- **Empty diff.** Nothing staged and nothing modified — say so; do not invent a
  commit.
- **A generic request like "save my work".** The description must be specific
  enough to fire here, since this is the phrasing people actually use.
- **A pre-commit hook fails.** The skill must not reach for `--no-verify`; it must
  surface the failure.
- **Base branch does not exist.** Report it rather than producing a diff against
  nothing.
- **Name collision.** `commit` as a skill name would collide with built-ins and
  other marketplaces, so the skill is `conventional-commits`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The plugin MUST ship `.claude-plugin/plugin.json`, `README.md`, and
  `LICENSE`, per constitution principle I.
- **FR-002**: The plugin `name` MUST be `commit-craft` in both the plugin manifest
  and its `marketplace.json` entry.
- **FR-003**: Skills MUST live in `skills/<name>/SKILL.md` so that no path fields
  are needed in the manifest.
- **FR-004**: Each skill `description` MUST name the concrete phrases a user types
  and MUST include a "Use when" clause, so `scripts/lint-skills.mjs` passes.
- **FR-005**: `conventional-commits` MUST define the message format, the permitted
  type list, and the breaking-change notation.
- **FR-006**: `conventional-commits` MUST require explicit user approval before
  running `git commit`.
- **FR-007**: `conventional-commits` MUST NOT run `git add -A` unprompted.
- **FR-008**: `conventional-commits` MUST refuse `--no-verify`.
- **FR-009**: `conventional-commits` MUST propose splitting commits when a diff
  spans unrelated concerns.
- **FR-010**: `pr-description` MUST accept an optional base-branch argument via
  `argument-hint` and `$1`, defaulting to `develop`.
- **FR-011**: `pr-description` MUST emit the four-section template.
- **FR-012**: Both skills MUST declare `allowed-tools` narrowly enough that they
  cannot write files or run arbitrary commands.
- **FR-013**: Neither skill may state a test result that was not produced by an
  executed command.
- **FR-014**: The `marketplace.json` entry MUST be added with a matching `version`.
- **FR-015**: Skill names MUST NOT be on the reserved list enforced by the linter.

### Key Entities

- **Skill**: a `SKILL.md` with YAML frontmatter. Its `description` is the trigger
  the model matches against; its body is guidance loaded only once it fires.
- **Plugin manifest**: `.claude-plugin/plugin.json`, holding identity and version.
  Its `version` must mirror the `marketplace.json` entry or updates go unnoticed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Asking "commit this" in a repository with staged changes activates
  the skill without the user naming it.
- **SC-002**: 100% of proposed commit messages parse as
  `type(scope)!?: summary` with a summary of 72 characters or fewer.
- **SC-003**: No commit is ever created without an explicit approval step.
- **SC-004**: `claude plugin validate plugins/commit-craft` passes.
- **SC-005**: `node scripts/lint-skills.mjs` passes for both skills.
- **SC-006**: A PR description produced by the skill contains all four sections
  with no placeholder text left in.
- **SC-007**: Installing the plugin changes no behaviour a user has not asked for —
  it adds capability without altering defaults.

## Assumptions

- Users have `git` available; `gh` is optional and only used by `pr-description`
  when present.
- The default base branch is `develop`, matching this repository's git-flow. Users
  of other conventions pass their base as an argument.
- Conventional Commits is the target format, with the type list fixed by this spec
  rather than left open.
- The skills advise and draft; they never bypass a failing hook or force anything.
  Skills are persuasion, and this plugin deliberately stays within that boundary —
  enforcement is `guard-rails`' job in feature 003.
- Commit message bodies are written in English, matching the repository.
