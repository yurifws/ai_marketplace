# commit-craft

Consistent commit messages and pull request descriptions.

```
/plugin install commit-craft@ai-marketplace
```

## What it does

Two skills that activate on their own when the conversation calls for them.

### `conventional-commits`

Fires when you ask to commit. Produces `type(scope): summary` in Conventional
Commits format, with a body that explains *why* the change happened rather than
restating the diff.

It also follows a procedure that is arguably more useful than the format itself:

- Reads `git status` and `git diff --staged` before writing anything
- **Never runs `git add -A` on its own** — what belongs in a commit is your call
- Proposes splitting when a diff mixes unrelated concerns
- **Shows you the message and waits** — it does not commit until you agree
- Refuses `--no-verify`; if a hook fails, it reports the failure

### `pr-description`

Fires when you ask to open a pull request. Reads the actual diff against the base
branch and produces four sections: **What changes**, **Why**, **How to test**,
**Risks**.

Takes an optional base branch, defaulting to `develop`:

```
/pr-description main
```

It will not claim a test passed unless a test was run, and it will tell you when a
PR is too large to review properly.

## What it does not do

Worth being explicit, because plugins vary a lot in how invasive they are:

- **No hooks.** Nothing is blocked or intercepted.
- **No `settings.json`.** Your default persona and configuration are untouched.
- **No automatic commits.** Every commit still needs your approval.
- **No file writes.** `allowed-tools` is scoped to read-only inspection plus the
  git commands needed to stage and commit.

Installing this changes nothing you did not ask for. It adds capability and waits
to be relevant.

## Skills are persuasion, not enforcement

Worth understanding before you rely on it: a skill works by the model reading its
description, deciding it applies, and following the guidance. That is a strong
default, not a guarantee. Nothing here can *prevent* a badly formatted commit — it
can only make a well-formatted one the path of least resistance.

If you want a rule that genuinely cannot be bypassed, you need a hook. See
[guard-rails](../guard-rails) for that contrast, and
[docs/concepts.md](../../docs/concepts.md) for the full picture of which mechanism
guarantees what.

## Turning it off

```
/plugin disable commit-craft@ai-marketplace     # keep it, stop it running
/plugin uninstall commit-craft@ai-marketplace   # remove it
```

Or invoke a skill directly at any time with `/conventional-commits` or
`/pr-description`.

## License

[MIT](LICENSE)
