---
name: pr-description
description: Use when the user asks to "open a PR", "create a pull request", write
  or improve a PR description, or summarize what changed on this branch compared to
  its base. Produces a reviewable description in a fixed four-section format.
argument-hint: "[base-branch]"
allowed-tools: Read, Grep, Glob, Bash(git log:*), Bash(git diff:*), Bash(git status:*), Bash(git branch:*), Bash(gh pr:*)
---

# Pull request description

Base branch: `$1` — when empty, use `develop`.

## Gather first

Never write a description from the conversation alone. Read the actual change:

```
git log --oneline $1..HEAD      # what commits are here
git diff --stat $1...HEAD       # what files, how much
```

Use `...` (three dots) for the diff so you see this branch against its merge base,
not against wherever the base branch has since moved.

Read the interesting files if the stat output is not enough. A description written
without looking at the diff reads exactly like one, and reviewers can tell.

## Format

```markdown
## What changes

One paragraph a reviewer can understand without opening the diff. Describe the
behaviour that is different now. Avoid function and variable names here.

## Why

The problem that existed before. If there is an issue, `Closes #N`.

## How to test

Numbered steps someone else can follow in under two minutes. Exact commands.

## Risks

What could break, and what to do if it does. Write "None identified" only if you
actually looked for risks.
```

## Title

The PR title follows the commit convention: `type(scope): summary`. This repository
squash-merges, so the title becomes the permanent commit message on `develop` — an
untidy title cannot be cleaned up later.

## Rules

- **Never state a test result you did not produce.** "Tests pass" is a claim about
  something you ran. If you did not run them, write what you did instead, or say
  they were not run. A reviewer trusting a fabricated result is worse than a
  reviewer knowing nothing.
- **Say when the PR is too large.** If the diff exceeds roughly 400 lines across
  unrelated areas, say so and propose a split before writing anything. A reviewer
  who cannot hold the change in their head will approve it without really reading.
- **"Risks: none" needs to be earned.** Ask what happens on the failure path, with
  empty input, or on a rollback. If nothing surfaces, then write it.
- **No filler.** Delete a section heading rather than filling it with "N/A" — except
  Risks, where the explicit statement is the point.

## Checks before opening

Confirm the branch targets the right base. In this repository:

| Branch | Targets |
|---|---|
| `feature/NNN-slug` | `develop` |
| `release/*`, `hotfix/*` | `main` |

A feature branch aimed at `main` is rejected by CI, so catching it here saves a
round trip.

If `gh` is available, open with:

```
gh pr create --base $1 --title "type(scope): summary" --body "..."
```

Otherwise print the title and body for the user to paste.
