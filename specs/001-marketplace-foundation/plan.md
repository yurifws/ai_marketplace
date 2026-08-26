# Implementation Plan: Marketplace Foundation

**Branch**: `feature/001-marketplace-foundation` | **Date**: 2026-08-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-marketplace-foundation/spec.md`

## Summary

Ship the catalog, the gate, and the documentation — everything the marketplace
needs to exist and to stay correct, before any plugin content is written.

Three things land together because each is useless alone: a valid
`.claude-plugin/marketplace.json` with an empty `plugins` array (the distribution
channel), a CI pipeline that validates it and refuses malformed contributions (the
gate), and the documents that explain what the repository is (the map). Ordering
the gate before the content is deliberate: features 002 through 004 add plugins,
and each one is safer and faster to build because this feature already rejects
broken work automatically.

The technical approach is deliberately dependency-free. `claude plugin validate`
is a local schema check that needs no authentication, so CI requires no repository
secret. Test and lint logic lives in `scripts/*.mjs` rather than inline workflow
YAML, so the maintainer can run the exact CI checks locally before pushing.

## Technical Context

**Language/Version**: Node.js 22 (scripts and hooks); Bash (workflow steps, GitHub-hosted Linux runners)

**Primary Dependencies**: None at runtime. CI installs `@anthropic-ai/claude-code` globally for its `plugin validate` subcommand. No package manifest, no lockfile, no `node_modules`.

**Storage**: Files in Git. `marketplace.json` is the only catalog; there is no database and no server.

**Testing**: `scripts/test-hooks.mjs` (exit-code assertions against hook fixtures) and `scripts/lint-skills.mjs` (frontmatter and trigger-quality checks). Both plain Node with zero dependencies, run identically in CI and locally.

**Target Platform**: Consumers run any Claude Code installation. CI runs `ubuntu-latest`. The maintainer machine is Windows 11 with PowerShell 5.1 and git bash.

**Project Type**: Content repository — a plugin marketplace catalog plus its governance tooling. No application code.

**Performance Goals**: Full CI suite under five minutes, so the gate never discourages a small pull request.

**Constraints**: No repository secrets. No runtime dependencies. CI must pass with zero plugins present and keep passing, unmodified, as plugins are added. `pwsh` and `jq` are unavailable on the maintainer machine, so nothing local may depend on them.

**Scale/Scope**: Three plugins planned; the dynamic discovery approach imposes no ceiling.

## Constitution Check

*GATE: evaluated against `.specify/memory/constitution.md` v1.0.0.*

| Principle | Applies here? | Status |
|---|---|---|
| I. Every plugin is complete or it does not ship | No plugins in this feature | N/A — enforced from 002 onward by the matrix built here |
| II. Validation is a gate, not a suggestion | Directly | **This feature implements it.** Root validate plus per-plugin matrix, working around the upstream bug where a root validate skips per-plugin manifests |
| III. Hooks are Node, and they are tested | Partially | No hooks yet, but `scripts/test-hooks.mjs` is built now so 003 has a harness waiting rather than inventing one under pressure |
| IV. A skill description is its trigger | Partially | No skills yet; `scripts/lint-skills.mjs` is built now and must no-op cleanly on an empty set |
| V. Portable, public, and small | Directly | No absolute paths, no secrets, LF normalization enforced by `.gitattributes`, `.claude/` gitignored |

**No violations.** Two notes on principles this feature deliberately satisfies in
advance: the test and lint harnesses are written before there is anything to test.
That is intentional — a harness authored alongside its first real subject tends to
be shaped to pass, and the constitution treats a false positive in a blocking check
as equal in severity to a false negative.

One tension worth recording: the constitution forbids direct commits to `develop`,
yet the spec-kit bootstrap commit went straight there. Branch protection cannot be
applied before CI exists, or the first pull request could never go green. The
bootstrap commit is the single documented exception, and this feature closes the
hole permanently.

## Project Structure

### Documentation (this feature)

```text
specs/001-marketplace-foundation/
├── spec.md              # Feature specification
├── plan.md              # This file
└── tasks.md             # /speckit-tasks output
```

No `research.md`, `data-model.md`, or `contracts/` — there is nothing to research
(the environment facts were verified empirically before planning), no data model,
and no API surface.

### Source Code (repository root)

```text
.github/
├── workflows/
│   ├── ci.yml                    # discover → validate-marketplace, validate-plugins, test-and-lint
│   └── branch-policy.yml         # branch naming + git-flow topology
└── pull_request_template.md
.claude-plugin/
└── marketplace.json              # THE CATALOG — plugins: [] at this stage
scripts/
├── test-hooks.mjs                # exit-code assertions; no-op with zero hooks
└── lint-skills.mjs               # frontmatter + trigger quality; no-op with zero skills
docs/
├── concepts.md                   # the mental model: who fires what, and what each guarantees
└── installation.md               # install + local development commands
CONTRIBUTING.md                   # branching table, release procedure, PR conventions
CHANGELOG.md                      # Keep a Changelog format; 0.1.0 unreleased
README.md                         # what this is, install command, plugin table
LICENSE                           # MIT
```

## Design Decisions

**Dynamic plugin discovery over a hardcoded matrix.** A `discover` job emits the
plugin list at runtime. Hardcoding would mean editing `ci.yml` in every future
feature — a step that gets forgotten exactly when it matters, silently dropping a
plugin from validation. Discovery must emit an empty array cleanly, since that is
the state this feature ships in.

**`fail-fast: false` on the matrix.** Reporting only the first broken plugin turns
one CI round-trip into several. Cheap to set, and only noticeable on the day it
matters.

**Test logic in `scripts/`, not inline YAML.** Inline steps can only be exercised
by pushing. A repository script is runnable locally, which is what makes
"run the checks before you push" a real instruction instead of advice.

**Branch policy as a workflow, not branch protection.** Protection blocks direct
pushes but cannot express *which* branch may target *which* base. The topology
rules therefore live in `branch-policy.yml`, which must allow `develop` into `main`
and `main` into `develop` as head refs — otherwise the mandatory release merge-back
is rejected by the repository own rules.

**Approval count of zero.** GitHub does not permit approving your own pull request.
On a solo repository a count of one is a deadlock rather than a strict policy, so
the pull request requirement plus CI is the real gate. The value is documented in
`CONTRIBUTING.md` as the one line to change when a collaborator joins.

**Protection applied after merge, not before.** Applying it now would leave this
feature unable to merge, since its own required checks do not exist on `develop`
yet. `validate-plugins` is additionally kept out of the required contexts until a
plugin exists — a required check that never runs blocks every pull request forever.

## Phased Execution

1. **Catalog first.** Write `marketplace.json` with `plugins: []` and validate
   immediately. A schema mistake found against one file is obvious; the same
   mistake found across thirty is a search.
2. **Scripts second.** `test-hooks.mjs` and `lint-skills.mjs`, both verified to
   exit 0 on the empty repository.
3. **Workflows third.** `ci.yml` and `branch-policy.yml`, referencing scripts that
   already work.
4. **Documentation fourth.** `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`,
   `docs/`, `LICENSE`.
5. **Pull request.** Open into `develop`, confirm every check runs and passes.
6. **Protection last.** Apply to `develop` and `main` only after the merge, then
   verify by attempting a direct push and confirming rejection.

## Verification

Beyond CI going green, this feature is only done when the rules are shown to
*reject* things — the half that is normally skipped, and the half that proves the
gate is real:

- `claude plugin validate .` passes with an empty catalog.
- `node scripts/test-hooks.mjs` and `node scripts/lint-skills.mjs` exit 0 with
  nothing to check.
- `claude plugin marketplace add <repo>` registers `ai-marketplace`.
- A direct `git push origin develop` is rejected.
- A pull request from a badly named branch turns `branch-policy` red.
- A pull request into `main` from a feature branch turns `branch-policy` red.
- A pull request from `main` into `develop` passes, proving the release merge-back
  path is open.
