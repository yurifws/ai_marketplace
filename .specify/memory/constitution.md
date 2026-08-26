# ai_marketplace Constitution

This repository is a **Claude Code plugin marketplace**: a Git repo whose
`.claude-plugin/marketplace.json` catalog lets anyone run
`/plugin marketplace add yurifws/ai_marketplace` and install the plugins here.

Everything published from this repo runs inside other people's sessions. A broken
component is not a private bug — it is noise in a stranger's context window. The
principles below exist to keep that from happening.

## Core Principles

### I. Every plugin is complete or it does not ship

A plugin directory is only valid with all of:

- `.claude-plugin/plugin.json` carrying `name`, `version`, `description`, `author`, `license`
- `README.md` explaining what it does, what it changes, and how to turn it off
- `LICENSE` (plugins are distributed in isolation, so each carries its own)

The `name` in `plugin.json` MUST equal the `name` of its entry in
`marketplace.json`. Components live in default locations (`skills/`, `agents/`,
`hooks/hooks.json`) so that path fields can be omitted from the manifest — fewer
fields, fewer ways to be wrong.

### II. Validation is a gate, not a suggestion

`claude plugin validate` MUST pass for the marketplace root **and for every plugin
directory individually**. Validating only the root is insufficient: a known upstream
bug means a marketplace-level validate does not descend into per-plugin manifests,
so a broken plugin passes cleanly and then fails at install time with an opaque
error.

CI MUST be green before any merge. `enforce_admins` is disabled on the protected
branches so that a human can physically bypass this; doing so is a violation of
this constitution, not a feature of it.

### III. Hooks are Node, and they are tested (NON-NEGOTIABLE)

Hooks are the only component that can *block* an action, so a hook that misfires
is worse than no hook at all.

- Written as Node `.mjs`. Never bash-with-`jq`; never `shell: "powershell"` (that
  invokes `pwsh`, which is not present on the maintainer's machine).
- Every hook MUST have a passing case and a blocking case exercised by
  `scripts/test-hooks.mjs`, which runs identically in CI and locally.
- Every hook entry MUST declare a `timeout`. A hook that hangs freezes the session.
- Exit codes are a contract: `0` allows, `2` blocks and returns stderr to the model,
  anything else is a non-blocking error.
- A false positive in a blocking hook is a defect of the same severity as a false
  negative. Both fail the build.

### IV. A skill's description is its trigger

A skill is invoked when the model reads its `description` and decides it applies.
Therefore `description` MUST name the concrete phrases a user would actually type
("Use when the user asks to make a commit, commit this, write a commit message"),
not a topic ("Helps with git"). A generic description is a skill that never runs —
a silent no-op no schema validator will ever flag. `scripts/lint-skills.mjs`
enforces this.

Skill names MUST NOT collide with built-ins or common marketplace names: `review`,
`commit`, `test`, `plan`, `build`, `deploy` are forbidden. All names kebab-case.

`commands/` is legacy and MUST NOT be used. Skills supersede it.

### V. Portable, public, and small

- No absolute paths inside a plugin. Use `${CLAUDE_PLUGIN_ROOT}`,
  `${CLAUDE_PROJECT_DIR}`, `${CLAUDE_SKILL_DIR}`. On Windows these expand to paths
  containing backslashes and possibly spaces, so they MUST be double-quoted.
- This repo is public. No tokens, credentials, personal paths, or client names —
  including in examples and documentation.
- Prefer three tested plugins over ten half-finished ones. Scope that cannot be
  verified end-to-end this session does not get merged this session.

## Development Workflow

Work follows Spec-Driven Development. Each feature runs
`/speckit-specify` → `/speckit-clarify` → `/speckit-plan` → `/speckit-tasks` →
`/speckit-analyze` → `/speckit-implement`, producing `specs/NNN-slug/`.

`/speckit-clarify` runs BEFORE `/speckit-plan`. Planning against an ambiguous spec
produces a confident plan for the wrong thing.

**`/speckit-implement` does not verify its output against the spec.** It writes
code; nothing checks that the code satisfies `spec.md`. Manual end-to-end
verification is therefore a required step of every feature, never an optional one.

Branching is git-flow:

| Branch | Cut from | Merges into |
|---|---|---|
| `feature/NNN-slug` | `develop` | `develop` |
| `release/*` | `develop` | `main`, then back into `develop` |
| `hotfix/*` | `main` | `main`, then back into `develop` |

- No direct commits to `main` or `develop`. Every change arrives by pull request.
- Only `release/*` and `hotfix/*` may target `main`.
- A release branch carries no features — only version bumps and the changelog.
- After a release merges to `main`, it MUST be merged back into `develop`, or the
  next release starts from stale version numbers.
- Version bumps go in **both** `plugin.json` and the matching `marketplace.json`
  entry. Missing one leaves installed copies silently stale.
- PR titles follow Conventional Commits, because squash-merge turns the PR title
  into the commit message on `develop`.

## Governance

This constitution supersedes convenience. When a principle here conflicts with
finishing something faster, the principle wins or the principle gets amended — not
quietly ignored.

Amendments require a PR that states what changed and why, and bumps the version
below. Every spec and plan is checked against this document by `/speckit-analyze`;
a plan that violates a principle MUST either be revised or accompanied by an
explicit, written justification in `plan.md`.

**Version**: 1.0.0 | **Ratified**: 2026-08-26 | **Last Amended**: 2026-08-26
