# Feature Specification: Marketplace Foundation

**Feature Branch**: `feature/001-marketplace-foundation`

**Spec Directory**: `specs/001-marketplace-foundation`

**Created**: 2026-08-26

**Status**: Draft

**Input**: User description: "Marketplace catalog, root documentation, CI pipeline and branch governance"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A stranger installs the marketplace (Priority: P1)

Someone reads about this repository, runs one command in their own Claude Code
session, and the marketplace is registered and browsable. At this stage it may
legitimately contain zero plugins — the catalog existing and resolving is the
value, because nothing else in this repo can be published until it does.

**Why this priority**: Every later feature adds an entry to this catalog. Without
a valid, resolvable `marketplace.json` there is no distribution channel at all,
and no plugin can be tested end-to-end.

**Independent Test**: Run `claude plugin marketplace add <path-to-repo>` and then
`claude plugin marketplace list`. The marketplace appears by name with an empty
plugin list and no error. Fully testable with zero plugins present.

**Acceptance Scenarios**:

1. **Given** a clone of this repository, **When** a user runs
   `claude plugin marketplace add <repo-path>`, **Then** the marketplace is
   registered under the name `ai-marketplace` and no error is reported.
2. **Given** the marketplace is registered, **When** the user runs
   `claude plugin marketplace list`, **Then** `ai-marketplace` is listed.
3. **Given** the repository at any commit on `develop` or `main`, **When**
   `claude plugin validate .` is run, **Then** validation passes with no errors.

---

### User Story 2 - A broken change cannot reach develop (Priority: P1)

The maintainer opens a pull request containing a malformed manifest, a hook that
fails its own test, or a skill whose description would never trigger. CI marks the
pull request red and the merge is blocked. The maintainer cannot push the change
directly to `develop` to get around it.

**Why this priority**: This repository publishes into other people's sessions. A
broken component is not a private bug — it is noise in a stranger's context
window. Shipping the gate before shipping content is what makes every subsequent
feature safe to build quickly.

**Independent Test**: Open a pull request that deliberately breaks a manifest and
confirm CI reports failure; separately, attempt `git push origin develop` and
confirm the push is rejected. Both testable with zero plugins present.

**Acceptance Scenarios**:

1. **Given** branch protection is applied, **When** the maintainer pushes directly
   to `develop` or `main`, **Then** the push is rejected by the remote.
2. **Given** a pull request whose `marketplace.json` is invalid, **When** CI runs,
   **Then** the `validate-marketplace` check fails.
3. **Given** a pull request from a branch named `bad-name`, **When** CI runs,
   **Then** the `branch-policy` check fails with a message naming the expected
   format.
4. **Given** a pull request into `main` from a branch that is not `release/*`,
   `hotfix/*`, or `develop`, **When** CI runs, **Then** the `branch-policy` check
   fails.
5. **Given** a pull request into `develop` from `feature/001-marketplace-foundation`,
   **When** CI runs, **Then** the `branch-policy` check passes.

---

### User Story 3 - A newcomer understands the model before touching anything (Priority: P2)

Someone lands on the repository — including the maintainer six months from now —
and can determine what a marketplace is, how a plugin differs from a skill, agent,
or hook, and what guarantees each mechanism actually provides, without reading
source code.

**Why this priority**: This repository exists partly to learn the plugin model.
Documentation that explains the *distinctions* is the durable output; the plugins
themselves are the worked examples. It is P2 rather than P1 because the catalog
and the gate must exist first for the documentation to describe anything true.

**Independent Test**: A reader who has never used Claude Code plugins reads
`README.md` and `docs/concepts.md` and can correctly answer: which components can
block an action, and which merely suggest one.

**Acceptance Scenarios**:

1. **Given** the repository root, **When** a reader opens `README.md`, **Then**
   they find the one-line install command and a link to the concepts document.
2. **Given** `docs/concepts.md`, **When** a reader finishes it, **Then** they can
   state which components are enforced by the harness and which depend on the
   model choosing to apply them.
3. **Given** `CONTRIBUTING.md`, **When** a contributor reads it, **Then** they can
   determine the branch name to use and the branch to target.

---

### Edge Cases

- **The catalog is empty.** CI must pass with `plugins: []`. A plugin matrix that
  errors on an empty list would block every pull request until the first plugin
  exists, which inverts the intended order of work.
- **A required status check never runs.** If a check that only executes when
  plugins exist is marked required while none do, every pull request is blocked
  indefinitely with no way to satisfy it.
- **The release merge-back is skipped.** If `release/*` merges only into `main`,
  `develop` retains stale version numbers and the next release inherits them.
  Branch policy must therefore permit `main` into `develop` as a pull request.
- **The repository name and marketplace name differ.** The install target is
  `<plugin>@ai-marketplace`, not `@ai_marketplace`. Documentation must show the
  literal string to avoid a first-use failure.
- **Line endings.** Shell scripts committed from Windows with CRLF fail at runtime
  with a carriage-return command-not-found error. Normalization must be enforced
  by the repository, not by developer discipline.
- **Validation gives a false pass.** A marketplace-level validate does not descend
  into per-plugin manifests, so a broken plugin can pass the root check and fail
  only at install time.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST contain `.claude-plugin/marketplace.json` at its
  root, declaring `name`, `owner`, and a `plugins` array.
- **FR-002**: The catalog MUST NOT declare `$schema` or a root-level `description`,
  as the installed validator rejects both.
- **FR-003**: `claude plugin validate` MUST pass against the repository root with
  an empty `plugins` array.
- **FR-004**: CI MUST validate the marketplace root on every pull request
  targeting `develop` or `main`.
- **FR-005**: CI MUST validate each plugin directory individually, discovered
  dynamically rather than hardcoded, and MUST tolerate zero plugins.
- **FR-006**: CI MUST report every failing plugin in a single run rather than
  stopping at the first.
- **FR-007**: CI MUST execute hook tests and skill linting via scripts stored in
  the repository, so the identical checks can be run locally before pushing.
- **FR-008**: CI MUST parse every tracked JSON file and fail on malformed syntax.
- **FR-009**: CI MUST reject a pull request whose head branch does not match
  `feature/NNN-slug`, `release/*`, or `hotfix/*`.
- **FR-010**: CI MUST reject a pull request into `main` whose head is not
  `release/*`, `hotfix/*`, or `develop`.
- **FR-011**: CI MUST permit `main` into `develop` pull requests to allow the
  mandatory release merge-back.
- **FR-012**: CI MUST run without any repository secret. No workflow may require
  an API key.
- **FR-013**: `main` and `develop` MUST reject direct pushes; all changes arrive by
  pull request.
- **FR-014**: The repository MUST provide `README.md`, `docs/concepts.md`,
  `docs/installation.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, and a root `LICENSE`.
- **FR-015**: `docs/concepts.md` MUST distinguish which components are enforced by
  the harness from those that depend on model judgment.
- **FR-016**: The repository MUST normalize line endings so committed shell scripts
  use LF regardless of contributor platform.
- **FR-017**: The generated agent folder MUST be excluded from version control.

### Key Entities

- **Marketplace catalog**: `.claude-plugin/marketplace.json`. Holds the marketplace
  identity (`name`, `owner`) and one entry per published plugin. The single source
  of truth for what this repository distributes; later consumed unchanged by the
  Phase 2 showcase site.
- **Plugin entry**: an element of `plugins[]`, keyed by `name`, pointing at a
  plugin directory via `source`. Its `version` must mirror the version inside that
  plugin's own manifest.
- **Governance rule**: a constraint expressed at one of three levels — written
  (`CONTRIBUTING.md`, constitution), mechanical (branch protection), or enforced
  (CI workflow). Each level offers a different guarantee.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user with no prior knowledge of this repository can register the
  marketplace with a single command, with no manual configuration step.
- **SC-002**: Every pull request into `develop` or `main` receives an automated
  pass/fail verdict without human intervention.
- **SC-003**: Direct pushes to `main` and `develop` fail 100% of the time.
- **SC-004**: A pull request with an incorrectly named branch, or aimed at the
  wrong base, is rejected automatically in 100% of cases.
- **SC-005**: The full CI suite completes in under five minutes, so the gate does
  not discourage small pull requests.
- **SC-006**: CI passes with zero plugins present and continues to pass, without
  workflow edits, as plugins are added in later features.
- **SC-007**: A contributor can run the exact checks CI will run using a single
  documented command before pushing.

## Assumptions

- The audience is Claude Code users who can run a slash command; no other tooling
  or account is assumed.
- The maintainer is solo. GitHub does not permit approving your own pull request,
  so the approval count is set to zero: the pull request requirement and CI are the
  gate, not human review. This is the single setting to revisit if a collaborator
  joins.
- The repository stays public and free; distribution is Git itself, with no server,
  database, or hosting cost.
- GitHub-hosted Linux runners are used, so standard Unix tooling is available in
  workflows even though the maintainer machine is Windows and lacks some of it.
- `claude plugin validate` remains authentication-free. If that changes, the CI
  design must be revisited.
- Plugin content is deliberately out of scope here. This feature ships the catalog,
  the gate, and the documentation; features 002 through 004 add the plugins.
- Branch protection is applied after this feature merges, since protecting
  `develop` before CI exists would leave the first pull request unable to pass.
