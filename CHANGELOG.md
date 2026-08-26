# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Plugin versions are bumped in two places on every release — the plugin's own
`.claude-plugin/plugin.json` and its entry in `.claude-plugin/marketplace.json`.
Both must match, or `claude plugin update` will not notice the new version.

## [Unreleased]

### Added

- **guard-rails 0.1.0** — the first plugin that can *refuse* an action. Two hooks:
  `check-secrets` (`PreToolUse` on `Write`/`Edit`/`MultiEdit`/`NotebookEdit`, exits
  `2` on recognisable credentials, reporting the kind of secret and never its
  value) and `session-brief` (`SessionStart`, injects branch, uncommitted count and
  standing rules; warns when on a protected or release branch). Both fail open, so
  a malformed payload or a missing git cannot brick a session.
- **commit-craft 0.1.0** — first published plugin. Two skills:
  `conventional-commits` (Conventional Commits authoring; proposes a message and
  waits for approval, never runs `git add -A` unprompted, refuses `--no-verify`)
  and `pr-description` (four-section PR descriptions against a configurable base
  branch, defaulting to `develop`).
- `scripts/check-versions.mjs` — asserts each plugin's `version` and `name` match
  its catalog entry, that every plugin ships a README and LICENSE, and that no
  plugin directory is missing from the catalog. A version bumped in only one of
  the two files produces no error anywhere; installed copies simply stay stale.
- Marketplace catalog at `.claude-plugin/marketplace.json` (`ai-marketplace`).
- Spec-Driven Development workflow via spec-kit, with the project constitution
  at `.specify/memory/constitution.md`.
- CI pipeline (`.github/workflows/ci.yml`): marketplace validation, per-plugin
  validation via a dynamically discovered matrix, hook tests, skill linting, and
  a JSON parse sweep. Runs without any repository secret.
- Branch policy workflow (`.github/workflows/branch-policy.yml`) enforcing
  `feature/NNN-slug`, `release/*`, and `hotfix/*` naming plus the git-flow
  topology.
- `scripts/test-hooks.mjs` and `scripts/lint-skills.mjs` — the same checks CI
  runs, runnable locally before pushing.
- Documentation: `README.md`, `CONTRIBUTING.md`, `docs/concepts.md`,
  `docs/installation.md`.

<!--
Still to land before 0.1.0:
  - focus-mode     (agent: focus, via settings.json)
-->

[Unreleased]: https://github.com/yurifws/ai_marketplace/compare/main...develop
