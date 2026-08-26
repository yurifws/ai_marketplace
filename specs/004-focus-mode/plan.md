# Implementation Plan: focus-mode

**Branch**: `feature/004-focus-mode` | **Date**: 2026-08-26 | **Spec**: [spec.md](./spec.md)

## Summary

One agent definition and a three-line `settings.json`. The smallest plugin in the
marketplace by file count, and the largest in blast radius: enabling it replaces
the system prompt of the main thread for every session.

It completes the set. `commit-craft` demonstrates a skill — persuasion, applied
when the model judges it relevant. `guard-rails` demonstrates a hook — enforcement,
applied deterministically at an event. This demonstrates the third mechanism:
`settings.agent`, applied unconditionally to everything, with no trigger at all.

## Technical Context

**Language/Version**: Markdown with YAML frontmatter, plus one JSON file. No executable code.

**Primary Dependencies**: None.

**Storage**: N/A

**Testing**: `claude plugin validate`, `check-versions.mjs`, plus behavioural demonstrations. Behavioural checks are weaker evidence than hook fixtures, and the plan says so rather than implying parity.

**Target Platform**: Any Claude Code session, any OS.

**Project Type**: Plugin — one agent, applied as a default.

**Performance Goals**: N/A. The persona is resident for the session by design; that is the mechanism, not a cost to optimise.

**Constraints**: `settings.json` at the **plugin root**, not inside `.claude-plugin/`. Only the `agent` key is honoured. No hardcoded language.

**Scale/Scope**: Four files.

## Constitution Check

*GATE: evaluated against `.specify/memory/constitution.md` v1.0.0.*

| Principle | Status |
|---|---|
| I. Every plugin is complete or it does not ship | **Satisfied** — manifest, README, LICENSE |
| II. Validation is a gate | **Satisfied** — validated individually; `plugins-gate` is a required check |
| III. Hooks are Node, and they are tested | N/A — no hooks |
| IV. A skill description is its trigger | N/A — no skills |
| V. Portable, public, and small | **Satisfied** — no absolute paths; explicitly language-neutral because the repo is public |

**No violations**, but one honest limitation to record.

The constitution says nothing merges without manual end-to-end verification, and
that is harder to satisfy here than anywhere else in this repository. A hook either
exits `2` or it does not. A persona "plans before editing" only in the sense that it
reliably tends to. Feature 003 could be proven; this can only be demonstrated. The
verification section below is written as demonstrations, and the honest reading is
that this plugin's correctness rests more on the clarity of its prompt and the
honesty of its README than on its test evidence.

## Project Structure

```text
plugins/focus-mode/
├── .claude-plugin/plugin.json
├── settings.json              ← plugin ROOT, not inside .claude-plugin/
├── agents/focus.md
├── README.md
└── LICENSE
```

## Design Decisions

**`settings.json` contains only `{ "agent": "focus" }`.** Not minimalism for its
own sake: the harness keeps exactly one key and silently discards the rest. Adding
`permissions` or `model` would look like configuration while doing nothing, which
is worse than omitting it — a reader would reasonably assume it worked.

**A separate plugin, not folded into another.** This is the most invasive and least
visible change available. Bundling it with `commit-craft` would mean accepting a
persona replacement in order to get commit messages, and disabling one would cost
the other.

**Match the user's language; never hardcode one.** The maintainer works in
Portuguese and English, but the plugin is public. "Reply in the language the user
wrote in" serves everyone; "reply in Portuguese" serves one person and confuses the
rest.

**Ceremony scales to the task.** The plan requirement is bounded — more than one
file, or more than roughly thirty lines. An unbounded version that demands a plan
for a typo is exhausting, gets disabled within a day, and then protects nothing.
Same reasoning as the false-positive rule in `guard-rails`.

**The persona reinforces rather than contradicts `guard-rails`.** Both say "do not
commit unasked". That is deliberate: the layers agree, so a user running both reads
one rule rather than two competing ones. The persona is the soft statement, the
branch protection is the hard one.

**The README leads with the warning.** Reversibility and scope come before
features, because a user who cannot attribute unexpected behaviour to this plugin
cannot make an informed choice about keeping it.

## Phased Execution

1. Manifest, README, LICENSE; validate the directory.
2. `agents/focus.md` — the persona itself, the substance of the feature.
3. Behavioural demonstration of the agent **before** wiring `settings.json`, so the
   prompt is judged in isolation from the global switch.
4. `settings.json` last. Only then does the plugin change anything by default.
5. Catalog entry; validate root and plugin; `check-versions`.
6. Documentation; open the PR.

Step 3 before step 4 is the same instinct as writing `hooks.json` last in feature
003: prove the component, then wire it up. Debugging a persona that is already
global is considerably harder than testing one you invoked deliberately.

## Verification

- `claude plugin validate plugins/focus-mode` passes.
- `settings.json` sits at the plugin root and contains only the `agent` key.
- The agent name resolves to `agents/focus.md`.
- `check-versions.mjs` confirms catalog parity.
- **Demonstration — plans first**: a non-trivial multi-file request produces a plan
  before any edit.
- **Demonstration — proportionate**: a typo fix is edited directly, with no plan.
- **Demonstration — language**: a non-English prompt is answered in that language.
- **Demonstration — honesty**: with no test runner present, no claim of passing
  tests is made.
- **Independence**: `commit-craft` and `guard-rails` behave identically with this
  plugin enabled and disabled.
