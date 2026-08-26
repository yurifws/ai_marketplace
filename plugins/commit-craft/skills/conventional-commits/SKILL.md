---
name: conventional-commits
description: Use when the user asks to "make a commit", "commit this", "commit my
  changes", "save my work", write or rewrite a commit message, split changes into
  separate commits, or review recent git history. Defines the commit message
  convention for this project.
allowed-tools: Read, Grep, Glob, Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*)
---

# Commit convention

## Format

```
<type>(<optional scope>): <summary>

<optional body: WHY this changed, not WHAT changed>

<optional footer: Refs #123, BREAKING CHANGE: ...>
```

The summary is at most **72 characters**, imperative mood, lowercase, and has no
trailing period. "add retry to the upload path", not "Added retries." or
"This commit adds retries to the upload path."

## Types

| Type | Use for |
|---|---|
| `feat` | New behaviour a user can observe |
| `fix` | A bug fix |
| `refactor` | Restructuring with no behaviour change |
| `perf` | Faster or lighter, with no behaviour change |
| `docs` | Documentation only |
| `test` | Tests only |
| `build` | Dependencies, packaging, CI, tooling |
| `chore` | Maintenance with no effect on production code |

Pick the type from what the change *does*, not from which files it touched. Editing
a `.md` file to fix wrong instructions is `fix`, not `docs`.

The scope is the area affected — a plugin name, a module, a subsystem. Omit it
rather than inventing one.

### Breaking changes

Put `!` before the colon and explain in the footer:

```
feat(api)!: remove the legacy userId field

BREAKING CHANGE: clients reading `userId` must switch to `user.id`.
The field was deprecated in 0.4.0 and returns null since 0.6.0.
```

## Procedure

1. Inspect before writing anything:
   - `git status --porcelain`
   - `git diff --staged` for what is staged
2. **If nothing is staged**, run `git diff` and show the user what exists. Do
   **not** run `git add -A` on your own initiative — staging everything is a
   decision about what belongs in this commit, and that is the user's call.
3. **If the diff mixes unrelated concerns**, propose a split before writing any
   message. One commit should have one reason to be reverted. Say which files go
   in which commit and wait for a decision.
4. Write the message and **show it to the user for approval**. Do not run
   `git commit` until they agree.
5. Commit only what was approved.

## Writing the body

The diff already shows *what* changed. The body exists to record *why*, because
that is the part that is impossible to reconstruct six months later.

Skip the body entirely when the summary is genuinely self-explanatory. A body that
restates the summary is worse than no body.

Weak:

```
fix: fix the parser

Changed the regex and added a null check.
```

Strong:

```
fix(parser): accept headers with no space after the colon

Older nginx builds emit "Content-Type:text/html" with no space. The previous
regex required \s+ and silently discarded the entire response, so uploads from
those servers failed with an empty-body error that pointed at the wrong layer.
```

## Hard rules

- **Never use `--no-verify`.** If a pre-commit hook fails, that hook is telling you
  something. Report the failure and fix the cause. Bypassing it moves the problem
  to CI, or to someone else's machine.
- **Never `git add -A` unprompted** (step 2).
- **Never commit without approval** (step 4).
- **Never claim a test passed** unless you ran it and saw it pass.

## Refuse these

Push back and propose better rather than complying:

- Vague summaries: `update`, `fixes`, `wip`, `changes`, `misc`, `stuff`
- One commit mixing a refactor, a feature, and reformatting
- Emoji in the summary
- An issue number in the summary — it belongs in the footer as `Refs #123`
- Past tense or third person: "Added…", "This commit adds…"

If the user explicitly insists after you have explained why, do as they ask. This
is guidance, not a gate.

## This repository

`ai_marketplace` uses this convention for PR titles too, because pull requests are
squash-merged and the PR title becomes the commit message on `develop`.

Release commits are `build(release): 0.1.0`.

See [CONTRIBUTING.md](../../../../CONTRIBUTING.md) for the branching model.
