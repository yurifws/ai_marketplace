# Contributing

This repository publishes plugins that run inside other people's Claude Code
sessions. A broken component is not a private bug — it is noise in a stranger's
context window. The rules below exist for that reason.

Two documents govern this project. This one is for humans. The
[constitution](.specify/memory/constitution.md) is for the agent: every spec and
plan is checked against it.

## Development process

Work follows Spec-Driven Development using [spec-kit](https://github.com/github/spec-kit).
Each feature produces a durable record in `specs/NNN-slug/`.

```
/speckit-specify   <description>   →  specs/NNN-slug/spec.md
/speckit-clarify                   →  resolves ambiguity  (before planning)
/speckit-plan                      →  plan.md
/speckit-tasks                     →  tasks.md
/speckit-analyze                   →  cross-artifact consistency check
/speckit-implement                 →  writes the files
```

Two things about this that are easy to get wrong:

**Run `/speckit-clarify` before `/speckit-plan`, not after.** Planning against an
ambiguous spec produces a confident plan for the wrong thing, and confident is
worse than obviously incomplete.

**`/speckit-implement` does not verify its own output against the spec.** It writes
code; nothing checks that the code satisfies `spec.md`. Manual end-to-end
verification is a required step of every feature, never an optional one.

Note that spec-kit does not create git branches in this setup — the spec directory
name and the branch name are independent. You create the branch yourself, matching
the spec directory:

```bash
git checkout develop && git pull
git checkout -b feature/002-commit-craft    # matches specs/002-commit-craft/
```

## Branching

```
main            ────●──────────────────────●──────────>   tagged releases only
                   ╱                      ╱
release/0.1.0   ──●──────                ╱                version bumps only
                 ╱        ╲             ╱
develop         ●──────────●───────────●─────────────>    integration branch
                 ╲    ╱ ╲   ╲    ╱
                  ●──●   ●───●──●                         feature/NNN-slug
```

| Branch | Cut from | Merges into | Format |
|---|---|---|---|
| `feature/NNN-slug` | `develop` | `develop` | `feature/002-commit-craft` |
| `release/*` | `develop` | `main`, then back into `develop` | `release/0.1.0` |
| `hotfix/*` | `main` | `main`, then back into `develop` | `hotfix/broken-manifest` |

- **Nothing is pushed directly to `main` or `develop`.** Both are protected.
- **Only `release/*` and `hotfix/*` may target `main`.** A feature PR aimed at
  `main` is rejected by CI.
- **A release branch carries no features** — only version bumps and the changelog.
  If you are writing a feature on one, it belongs on `develop`.

CI enforces the branch *prefix*; semver in release names is convention, not a
machine check. `release/0.2.0-rc1` is equally valid.

## Pull requests

Every change arrives by pull request. Direct pushes to `main` and `develop` are
rejected by the remote.

**PR titles follow [Conventional Commits](https://www.conventionalcommits.org/):**
`type(scope): summary`. This repository squash-merges, so the PR title becomes the
commit message on `develop` — an untidy title is permanent.

```
feat(commit-craft): add pr-description skill
fix(guard-rails): stop flagging placeholder keys in docs
build(release): 0.1.0
```

**On approvals.** GitHub does not allow approving your own pull request — there is
no owner or admin exemption. On a solo repository, requiring one approval is a
deadlock rather than a strict policy, so `required_approving_review_count` is set
to `0`. The pull request requirement and CI are the real gate. **That count is the
single setting to change** the day a second contributor joins.

`enforce_admins` is `false`, which means a maintainer *can* physically bypass CI.
The constitution says not to. That is deliberate: it is the right place for a rule
that should bind judgment rather than mechanism.

## Before you push

Run the same checks CI will run. They live in `scripts/` precisely so you can:

```bash
claude plugin validate .                # the catalog
claude plugin validate plugins/<name>   # each plugin, individually
node scripts/test-hooks.mjs
node scripts/lint-skills.mjs
```

Validating the root is not a substitute for validating each plugin — a root-level
validate does not descend into per-plugin manifests, so a broken plugin passes
there and fails only at install time.

## Adding a plugin

A plugin directory is only valid with all of:

```
plugins/<name>/
├── .claude-plugin/plugin.json    # name, version, description, author, license
├── README.md                     # what it does, what it changes, how to turn it off
└── LICENSE                       # plugins are distributed alone; each carries its own
```

Then add the matching entry to `plugins[]` in `.claude-plugin/marketplace.json`.
The `name` in `plugin.json` **must equal** the `name` in that entry, and `source`
points at the **directory** (`"./plugins/<name>"`), never at a `.json` file.

Rules that the linters enforce, and why:

- **A skill's `description` is its only trigger.** `"Helps with git"` is a skill
  that never fires. Name the phrases a user actually types:
  `"Use when the user asks to make a commit, commit this, write a commit message"`.
- **Hooks are Node `.mjs`** — never bash with `jq`, never `shell: "powershell"`
  (that invokes `pwsh`, which is not present on the maintainer's machine).
- **Every hook needs a fixture** in `plugins/<name>/hooks/fixtures.json` with at
  least one case. An untested hook that can block is a defect waiting to happen,
  and a false positive is as serious as a missed detection.
- **Every hook entry needs a `timeout`.** A hook that hangs freezes the session.
- **No absolute paths.** Use `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PROJECT_DIR}`,
  `${CLAUDE_SKILL_DIR}`, and double-quote them — on Windows they expand to paths
  with backslashes and possibly spaces.
- **Avoid generic skill names.** `review`, `commit`, `test`, `plan`, `build`,
  `deploy` collide with built-ins and other marketplaces.
- **`commands/` is legacy.** Use skills.

## Releasing

```bash
git checkout develop && git pull
git checkout -b release/0.1.0

# bump "version" in every plugins/*/.claude-plugin/plugin.json
# bump the matching "version" in each plugins[] entry of marketplace.json
# write the CHANGELOG.md entry

git commit -am "build(release): 0.1.0"
git push -u origin release/0.1.0
gh pr create --base main --title "build(release): 0.1.0"

# CI green → merge → tag
git checkout main && git pull
git tag -a v0.1.0 -m "v0.1.0" && git push origin v0.1.0

# merge back — do not skip this
gh pr create --base develop --head main --title "chore: sync release 0.1.0 back to develop"
```

**Bump the version in both places.** `plugin.json` *and* the marketplace entry —
that pairing is what makes `claude plugin update` notice there is something new.
Miss one and installed copies stay silently stale.

**Do not skip the merge-back.** A release merged only into `main` leaves `develop`
holding stale version numbers, and the next release branch inherits them. This is
the step that gets forgotten.

Remote installs read the **default branch**, so nothing is installable by anyone
else until it reaches `main`.

## Reporting problems

Open an issue. For a hook false positive, include the file path and the content
that triggered it — that is treated as a real bug here, not as expected caution.
