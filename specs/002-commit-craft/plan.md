# Implementation Plan: commit-craft

**Branch**: `feature/002-commit-craft` | **Date**: 2026-08-26 | **Spec**: [spec.md](./spec.md)

## Summary

The marketplace's first published plugin: two skills that standardise commit
messages and pull request descriptions.

It is deliberately the safest plugin to ship first. It blocks nothing, changes no
global default, and registers no hooks — installing it adds capability without
altering behaviour the user did not ask for. That makes it the right place to prove
the plumbing (manifest, catalog entry, validation, linting, install) before feature
003 introduces a component that can actually *block* an action.

It is also the plugin this repository uses on itself: `CONTRIBUTING.md` requires
Conventional Commits for PR titles, so this is the tooling that satisfies our own
rule.

## Technical Context

**Language/Version**: Markdown with YAML frontmatter. No executable code.

**Primary Dependencies**: None. `git` at runtime; `gh` optionally, for `pr-description`.

**Storage**: N/A

**Testing**: `scripts/lint-skills.mjs` (frontmatter and trigger quality), `claude plugin validate plugins/commit-craft` (manifest schema), plus manual activation testing via `claude --plugin-dir`.

**Target Platform**: Any Claude Code session, any OS. Nothing here is platform-specific.

**Project Type**: Plugin — skills only.

**Performance Goals**: Zero context cost until a skill fires. Only descriptions stay resident.

**Constraints**: `allowed-tools` must be narrow enough that neither skill can write files or run arbitrary commands. Skill names must avoid the reserved list.

**Scale/Scope**: Two skills, roughly 200 lines of guidance total.

## Constitution Check

*GATE: evaluated against `.specify/memory/constitution.md` v1.0.0.*

| Principle | Status |
|---|---|
| I. Every plugin is complete or it does not ship | **Satisfied** — `plugin.json`, `README.md`, `LICENSE`; `name` matches the catalog entry; components in default locations so no path fields |
| II. Validation is a gate | **Satisfied** — validated as a directory in its own right, not just via the marketplace root |
| III. Hooks are Node, and they are tested | N/A — no hooks |
| IV. A skill description is its trigger | **Directly load-bearing.** Both descriptions name real phrases and carry a "Use when" clause |
| V. Portable, public, and small | **Satisfied** — no absolute paths, no secrets, two skills rather than a suite |

**No violations.**

One boundary worth stating explicitly, since it shapes every design decision below:
a skill is *persuasion*. It cannot prevent anything. So `conventional-commits` can
say "never use `--no-verify`" and the model will almost always comply — but nothing
enforces it. That is not a defect to work around here; it is the honest limit of
the mechanism, and it is exactly the contrast feature 003 exists to demonstrate.

## Project Structure

```text
plugins/commit-craft/
├── .claude-plugin/plugin.json
├── skills/
│   ├── conventional-commits/SKILL.md
│   └── pr-description/SKILL.md
├── README.md
└── LICENSE
```

Plus one entry appended to `plugins[]` in `.claude-plugin/marketplace.json`.

## Design Decisions

**`conventional-commits`, not `commit`.** The short name is what the user types, so
a generic one collides with built-ins and with every other marketplace that had the
same idea. `scripts/lint-skills.mjs` enforces this via a reserved list; the name was
chosen to satisfy it rather than to work around it.

**Descriptions quote real phrasing.** `"Use when the user asks to make a commit,
commit this, write a commit message"` beats any topic summary, because the
description *is* the trigger — the model matches against it and nothing else. A
skill described as "helps with git" is a skill that never runs.

**Narrow `allowed-tools`.** Scoped `Bash(git status:*)`, `Bash(git diff:*)`,
`Bash(git log:*)`, `Bash(git add:*)`, `Bash(git commit:*)` rather than blanket
`Bash`. A commit-message skill has no business writing files, and the least
surprising plugin is one that cannot do things its description never mentioned.

**Approval before committing, stated as procedure.** The skill produces a message
and stops. Auto-committing would make the plugin something the user has to defend
against rather than reach for — and a bad commit is annoying to undo.

**`$1` with a `develop` default in `pr-description`.** Demonstrates
`argument-hint` and positional arguments, which is useful for anyone reading this
repo as a worked example. The default matches this repository's git-flow; other
users pass their own base.

**Two skills, not one.** They fire at genuinely different moments and one is much
more frequent than the other. Merging them would mean the commit guidance loads
context every time someone asks about a PR, and vice versa.

## Phased Execution

1. Manifest, `README.md`, `LICENSE`; validate the plugin directory immediately.
2. `conventional-commits/SKILL.md`; run the linter.
3. `pr-description/SKILL.md`; run the linter.
4. Append the catalog entry; validate the marketplace root.
5. Load with `claude --plugin-dir` and confirm both skills are listed and fire.
6. Open the PR into `develop`.

## Verification

Automated checks are necessary but not sufficient here — they prove the frontmatter
is well-formed, not that the skill activates on the words a person would use. The
manual step is the real test:

- `claude plugin validate plugins/commit-craft` passes.
- `node scripts/lint-skills.mjs` passes for both skills.
- Marketplace root still validates with the new entry.
- Via `claude --plugin-dir plugins/commit-craft`: both skills appear under `/`.
- **Activation**: with staged changes, "commit this" triggers `conventional-commits`
  without the user naming the skill. This is the only check that tests what actually
  matters.
- **Restraint**: the skill proposes a message and waits, rather than committing.
