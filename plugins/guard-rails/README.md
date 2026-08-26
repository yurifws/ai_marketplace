# guard-rails

Refuses writes that contain credentials, and tells every session where it is.

```
/plugin install guard-rails@ai-marketplace
```

> **This plugin can block actions.** Unlike a skill, which the model may or may not
> apply, a hook is executed by the harness and its verdict is final. That is the
> point of it — but you should install it knowing that, and knowing how to turn it
> off (see the bottom of this file).

## What it does

### `check-secrets` — blocks writes containing credentials

Runs before every `Write`, `Edit`, `MultiEdit`, and `NotebookEdit`. If the content
contains something that looks like a live credential, the write is refused and the
agent is told what kind of thing was found and what to do instead.

Detects: AWS access key IDs, private key blocks, Anthropic keys, GitHub tokens
(classic and fine-grained), Slack tokens, Google API keys, SendGrid keys, Stripe
live keys, JWTs, and hardcoded credential assignments such as
`DB_PASSWORD = "..."`.

In a `.env` file the bar is lower, because the base rate of secrets there is high:
a value that is long and mixes letters with digits is treated as a credential, as
is any URL carrying `user:password@`. Ordinary configuration is left alone —
`PORT=3000`, `NODE_ENV=production`, `AWS_REGION=us-east-1`, `VERSION=1.2.3-beta.4`
and plain URLs all pass.

It never prints the matched value — only its kind. The message goes to the model
and may be logged, so echoing the secret would just copy it somewhere new.

### `session-brief` — injects repository context at session start

Puts the current branch, the number of uncommitted files, and the last commit into
context before you say anything, along with standing rules (don't commit unasked,
never `--no-verify` or `--force`).

If you are on a protected branch it says so explicitly and asks the agent to
propose a feature branch before the first edit — catching the mistake while you are
editing rather than at push time, when the work is already on the wrong branch.

Outside a git repository it does nothing at all.

## What it does not do

**It is a safety net, not a security boundary.** Detection is pattern matching
against known credential formats. It will catch the common cases and it will miss a
novel or unusual one. Do not treat a passing write as proof there is no secret in
it, and do not remove other controls because this is installed.

It also does not scan your existing files, your git history, or anything you write
outside a Claude Code session.

## False positives are treated as bugs

A guard that cries wolf gets uninstalled, and an uninstalled guard protects nothing.
So precision is deliberately valued as highly as detection here:

- Documentation placeholders (`<YOUR_API_KEY_HERE>`) pass.
- AWS's own published example key (`AKIAIOSFODNN7EXAMPLE`) passes.
- Lockfile integrity hashes, base64 data URIs, and minified code pass.
- Placeholder detection is judged on the *matched text*, not the whole file — so a
  doc example near the top does not whitelist a real key further down.

If it blocks something legitimate, that is a defect worth reporting, not expected
caution. Please open an issue with the content that triggered it.

## Design notes

Both hooks are Node `.mjs`. That is not a style preference: bash-with-`jq` fails on
machines without `jq`, and `shell: "powershell"` invokes `pwsh` rather than Windows
PowerShell. Node parses JSON natively and behaves the same everywhere.

`check-secrets` **fails open** on malformed or empty input. Failing closed would
mean one unexpected payload shape blocks every write for the rest of the session —
turning a safety net into an outage.

`session-brief` fails silently on every error, for the same reason.

Exit codes are the contract with the harness: `0` allows, `2` blocks and returns
stderr to the model, anything else is a non-blocking error.

Every case is covered by [`hooks/fixtures.json`](hooks/fixtures.json) and run in CI
by `scripts/test-hooks.mjs` — including the allow cases, which are the half that
decides whether anyone keeps this installed.

## Turning it off

```
/plugin disable guard-rails@ai-marketplace     # keep it, stop it running
/plugin uninstall guard-rails@ai-marketplace   # remove it
```

Hooks do **not** hot-reload. After enabling, disabling, or editing, run
`/reload-plugins` or restart the session.

## License

[MIT](LICENSE)
