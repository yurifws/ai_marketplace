---

description: "Task list for feature 005: team readiness documentation"
---

# Tasks: Team Readiness

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md)

**Tests**: No fixtures — documentation only. Verification is link resolution,
gitignore behaviour, and proving the existing suite still passes.

---

## Phase 1: Security policy (US2)

- [x] T001 Write `SECURITY.md`: supported versions (latest only, no maintenance
  promise), private reporting via GitHub Security Advisories with an explicit
  instruction not to open a public issue, in-scope list including **false positives
  alongside false negatives**, out-of-scope list covering the limits of pattern
  matching, and a plain statement that `guard-rails` is a safety net and not a
  security boundary.

## Phase 2: Team onboarding (US1)

- [x] T002 Write `.claude/settings.json` as a real, committed example declaring the
  marketplace and enabling two plugins.
- [x] T003 Fix `.gitignore` so that file is tracked while spec-kit's generated
  skills stay ignored. Requires the `.claude/*` + `!.claude/settings.json` form —
  git cannot re-include a file whose parent directory is excluded.
- [x] T004 Write `docs/team-setup.md`: **lead with the fact that nothing can
  force-install**, then individual install (with the `@ai-marketplace` vs
  `ai_marketplace` trap), private repos (SSH preferred, *with the reason*),
  project-level declaration (and precisely what it does not do), organization policy
  (`managed-settings.json` paths for three OSes plus the governing keys), and
  updates/versioning.

## Phase 3: Wire up

- [x] T005 Link both documents from `README.md`
- [x] T006 Add the `CHANGELOG.md` entry

## Phase 4: Verify

- [x] T007 Every relative link resolves — **verified**, no broken links
- [x] T008 `git check-ignore -q` confirms `.claude/settings.json` tracked and
  `.claude/skills` ignored — **verified**. Note `-v` is unsuitable: it exits 0 when
  any pattern matches, negations included, so it reports success for an excluded
  file.
- [x] T009 Full suite passes — **verified**: 4 manifests, 22 hook fixtures, 2 skills,
  3 plugins consistent
- [ ] T010 Open the PR into `develop`

---

## Notes

- Ships as one feature rather than the two the approved plan named, because
  `SECURITY.md` links to `docs/team-setup.md` and splitting them would leave a dead
  link on `develop` in between
- No plugin behaviour changes; if any check that is not a link or ignore rule
  changes result, something is wrong
