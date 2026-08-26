# Feature Specification: Team Readiness

**Feature Branch**: `feature/005-team-readiness`

**Created**: 2026-08-26

**Status**: Draft

**Input**: "Security policy and team onboarding documentation for internal adoption"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A colleague can adopt this without asking how (Priority: P1)

Someone is pointed at this repository and can get the plugins working in their own
environment, understand what will happen when they do, and know what is expected of
them if the repository is private.

**Why this priority**: This repository is a proof of concept for internal
distribution. Distribution that requires the author standing over someone's shoulder
has not proven anything.

**Independent Test**: A reader who has never used Claude Code plugins follows
`docs/team-setup.md` and installs successfully without asking a question.

**Acceptance Scenarios**:

1. **Given** `docs/team-setup.md`, **When** a colleague reads section 1, **Then**
   they can install with the correct `@ai-marketplace` suffix.
2. **Given** a private marketplace repo, **When** they read the private-repo note,
   **Then** they know to prefer SSH and why HTTPS breaks background updates.
3. **Given** a project with the committed `.claude/settings.json`, **When** they open
   and trust it, **Then** the marketplace is registered without a manual add.
4. **Given** the same document, **When** they read it, **Then** they understand a
   per-person `/plugin install` is **still required** and no setting removes it.

---

### User Story 2 - A platform team can evaluate and constrain it (Priority: P1)

A security or platform reviewer can determine what the plugins do, what is promised,
what is explicitly not promised, and how to restrict what developers may install.

**Why this priority**: Equal to US1. In a company, the reviewer is the gate. A
credential-blocking plugin published without a stated policy invites exactly the
scrutiny it cannot survive.

**Independent Test**: A reviewer reads `SECURITY.md` and can state what to report,
where, and what this tool does not guarantee.

**Acceptance Scenarios**:

1. **Given** `SECURITY.md`, **When** a reviewer reads it, **Then** they find a
   private reporting channel and an instruction not to open a public issue.
2. **Given** the same file, **When** they look for scope, **Then** a `guard-rails`
   **false positive** is listed as in scope alongside a false negative.
3. **Given** the same file, **When** they look for guarantees, **Then** it states
   plainly that the plugin is a safety net and not a security boundary.
4. **Given** `docs/team-setup.md` section 3, **When** they need to restrict
   installs, **Then** they find `managed-settings.json` paths per OS and the keys
   that allowlist, deny, and block sideloading.

### Edge Cases

- **Overstating auto-install.** Claiming a committed `.claude/settings.json`
  installs plugins is the fastest way to lose a platform team's trust, because it is
  disprovable in one minute.
- **`.claude/` is gitignored.** Git cannot re-include a file under an excluded
  directory, so the example needs the `.claude/*` + `!.claude/settings.json` form or
  it silently never ships.
- **Broken cross-links.** `SECURITY.md` references `docs/team-setup.md`; shipping
  them in separate features would leave a dead link in the interim.
- **Private HTTPS marketplaces appear to work.** The initial add succeeds and only
  background updates fail, so the defect surfaces days later.

## Requirements *(mandatory)*

- **FR-001**: `SECURITY.md` MUST exist at the repository root.
- **FR-002**: It MUST give a private reporting channel and forbid public issues for
  detection bugs.
- **FR-003**: It MUST list a `guard-rails` false positive as in scope, matching the
  plugin README's existing claim.
- **FR-004**: It MUST state that `guard-rails` is not a security boundary.
- **FR-005**: `docs/team-setup.md` MUST cover individual install, project-level
  declaration, and organization policy.
- **FR-006**: It MUST state explicitly that no setting can force-install a plugin.
- **FR-007**: It MUST document SSH preference for private repos and the reason.
- **FR-008**: It MUST give `managed-settings.json` paths for Windows, macOS and
  Linux, with the governing keys.
- **FR-009**: `.claude/settings.json` MUST be committed as a working example.
- **FR-010**: `.gitignore` MUST permit that file while still ignoring generated
  spec-kit skills.
- **FR-011**: `README.md` MUST link both documents.
- **FR-012**: All relative links MUST resolve.

## Success Criteria *(mandatory)*

- **SC-001**: A colleague installs successfully from the doc alone.
- **SC-002**: A reader can correctly state that a per-person install is still needed.
- **SC-003**: A reviewer can state what is in and out of scope after one read.
- **SC-004**: `git check-ignore -q .claude/settings.json` exits non-zero (tracked)
  while `.claude/skills` remains ignored.
- **SC-005**: No relative link in the new or edited documents is broken.
- **SC-006**: No plugin behaviour changes — this feature is documentation only.

## Assumptions

- The reader has Claude Code installed; nothing else is assumed.
- The audience is a colleague or a platform reviewer, not a contributor —
  contribution is `CONTRIBUTING.md`.
- Both files ship in one feature because `SECURITY.md` links to `docs/team-setup.md`.
  Splitting them to satisfy a one-concern-per-branch rule would ship a broken link,
  which is worse than the coupling.
- Cursor is out of scope by decision; this documents the Claude Code path only.
