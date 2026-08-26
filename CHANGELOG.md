# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Plugin versions are bumped in two places on every release — the plugin's own
`.claude-plugin/plugin.json` and its entry in `.claude-plugin/marketplace.json`.
Both must match, or `claude plugin update` will not notice the new version.

## [Unreleased]

### Added

- Marketplace catalog at `.claude-plugin/marketplace.json` (`ai-marketplace`),
  currently publishing no plugins.
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
Planned for 0.1.0:
  - commit-craft   (skills: conventional-commits, pr-description)
  - guard-rails    (hooks: check-secrets, session-brief)
  - focus-mode     (agent: focus, via settings.json)
-->

[Unreleased]: https://github.com/yurifws/ai_marketplace/compare/main...develop
