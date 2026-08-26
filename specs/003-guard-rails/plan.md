# Implementation Plan: guard-rails

**Branch**: `feature/003-guard-rails` | **Date**: 2026-08-26 | **Spec**: [spec.md](./spec.md)

## Summary

Two hooks: one that **blocks**, one that **injects context**.

`check-secrets.mjs` runs on `PreToolUse` for every file-writing tool and refuses
writes containing recognisable credentials. `session-brief.mjs` runs on
`SessionStart` and puts the repository's state and rules into context before the
first message.

This is the first plugin here that can say *no*. `commit-craft` in feature 002 can
only recommend — the model is free to ignore it. This one is executed by the
harness and its exit code is obeyed. The pair is the clearest available
demonstration of what "rule" means in this ecosystem: `session-brief` says roughly
what a guidance skill would say, but runs unconditionally; `check-secrets` does
something no skill can do at all.

## Technical Context

**Language/Version**: Node.js 22 (ESM `.mjs`)

**Primary Dependencies**: None. Node stdlib only — `node:child_process` for git.

**Storage**: N/A

**Testing**: `scripts/test-hooks.mjs` against `hooks/fixtures.json`, plus live session verification.

**Target Platform**: Any OS with Node 22+. Node was chosen specifically for portability: `jq` and `pwsh` are both absent on the maintainer's Windows machine, so a bash-and-jq hook would fail there and a `shell: "powershell"` hook would fail everywhere it is not pwsh.

**Project Type**: Plugin — hooks only.

**Performance Goals**: `check-secrets.mjs` runs on *every* edit, so it must exit fast on the common path. Regex over a string buffer, no I/O beyond stdin.

**Constraints**: Must not block on malformed input. Must not echo matched values. Must double-quote `${CLAUDE_PLUGIN_ROOT}` for Windows paths.

**Scale/Scope**: Two hooks, roughly 150 lines of JavaScript.

## Constitution Check

*GATE: evaluated against `.specify/memory/constitution.md` v1.0.0.*

| Principle | Status |
|---|---|
| I. Every plugin is complete or it does not ship | **Satisfied** — manifest, README, LICENSE |
| II. Validation is a gate | **Satisfied** — validated individually; CI `plugins-gate` is now a required check |
| III. Hooks are Node, and they are tested (NON-NEGOTIABLE) | **The whole feature.** Node `.mjs`, `timeout` on every entry, fixtures covering both directions, exit codes as contract |
| IV. A skill description is its trigger | N/A — no skills |
| V. Portable, public, and small | **Satisfied** — `${CLAUDE_PLUGIN_ROOT}` not absolute paths; no real credentials in fixtures (only well-known documentation examples) |

**No violations.**

The principle doing real work here is III, specifically: *"A false positive in a
blocking hook is a defect of the same severity as a false negative. Both fail the
build."* That single line drives most of the design below. It would be trivial to
write a detector that catches more secrets; it would also be uninstalled within a
week. A guard nobody runs protects nothing, so precision is a feature, not a
compromise.

## Project Structure

```text
plugins/guard-rails/
├── .claude-plugin/plugin.json
├── hooks/
│   ├── hooks.json
│   ├── check-secrets.mjs
│   ├── session-brief.mjs
│   └── fixtures.json
├── README.md
└── LICENSE
```

## Design Decisions

**Node, not bash.** The maintainer's machine has neither `jq` nor `pwsh`. A
bash-and-jq hook would fail locally; `shell: "powershell"` invokes pwsh and would
fail too. Node is present, parses JSON natively, and behaves identically on every
platform. This is why the constitution names it rather than leaving it to taste.

**Placeholder allowlist checked before the pattern list.** `<YOUR_API_KEY_HERE>`,
`sk-xxxxx`, `AKIAIOSFODNN7EXAMPLE` (AWS's own documentation key), and similar must
pass. Documentation is exactly the context where credential-shaped strings are most
common and least dangerous, and blocking it is how the plugin gets disabled.

**Patterns are anchored to known credential formats**, not to entropy. An entropy
heuristic catches more and misfires constantly — on lockfile integrity hashes, on
minified code, on base64 data URIs. Every pattern here corresponds to a specific
issuer's documented format.

**Report the kind, never the value.** stderr is returned to the model and may be
logged. Saying "AWS Access Key ID" is enough to act on; echoing the key copies it
somewhere new, which is the exact opposite of the plugin's purpose.

**Fail open on malformed input.** Unparseable stdin exits `0`. Failing closed would
mean one unexpected payload shape bricks every write in the session — turning a
safety net into an outage.

**`session-brief.mjs` fails silently.** Not a git repo, git missing, command
errors — all exit `0` with no output. A context hook that errors on every session
start in a non-git directory is worse than no context hook.

**The session brief encodes this repository's own git-flow**: on `main`, `develop`,
or `release/*`, it instructs the agent to propose a feature branch before editing.
That catches the mistake at the moment of editing rather than at the push, which is
where branch protection catches it — after the work is already on the wrong branch.

## Phased Execution

1. Manifest, README, LICENSE; validate the directory.
2. `check-secrets.mjs` plus its fixtures — **blocking cases and allowing cases
   written together**, since precision is the harder half.
3. `session-brief.mjs` plus its fixture.
4. `hooks.json` last, once both scripts are proven at the terminal. A broken hook
   inside a session is far harder to diagnose than a broken script at a prompt.
5. Catalog entry; validate root and plugin.
6. Live session verification.

## Verification

`scripts/test-hooks.mjs` covers the fixtures. Beyond that:

- **A false-positive corpus**: ordinary source, a lockfile integrity hash, a data
  URI, and documentation placeholders must all pass. This matters more than the
  detection cases, because it is the failure mode that gets the plugin uninstalled.
- **Live block**: in a session with the plugin loaded, ask for a file containing an
  AWS key. The Write must be refused and the file must not exist afterward.
- **Live allow**: the same file with ordinary content must be created normally.
- **Live context**: a session in this repository shows branch and dirty count
  unprompted.
- **No leakage**: grep the hook's own stderr output to confirm the matched value
  never appears.
