# focus-mode

A default working persona: plans before editing, changes the minimum, verifies
instead of claiming, and never commits unasked.

> ## Read this before installing
>
> **This plugin replaces the system prompt of your main thread.** Every session, in
> every project, for everything you ask — not just when some trigger matches.
>
> That makes it the most invasive plugin in this marketplace and also the least
> visible one: nothing announces itself, so if you dislike the behaviour later you
> may not connect it back to here. Hence this warning sitting above the features.
>
> Undo it at any time:
>
> ```
> /plugin disable focus-mode@ai-marketplace
> /reload-plugins
> ```

```
/plugin install focus-mode@ai-marketplace
```

## What the persona does

**Plans before editing — proportionately.** More than one file, or more than about
thirty lines, gets a short plan first: which files, what changes, how it will be
checked. A typo gets fixed. Demanding a plan for a one-line change is friction, not
caution, and it trains you to stop reading.

**Changes the minimum.** Smallest fix that solves the actual problem. No
reformatting code it was not asked to touch, no new dependencies without asking, no
new file where an existing one is the natural home. It matches the style already in
the file even where it would have chosen otherwise.

**Verifies rather than claims.** Runs whatever the project already has. If there is
no test runner, it says so instead of implying it checked. It will not tell you
tests pass unless it ran them and watched them pass — a confident wrong report is
worse than an honest uncertain one, because it stops you looking.

**Leaves git alone.** No `commit`, `push`, `reset --hard`, or `checkout --` unless
you ask. No `--no-verify`, no `--force`.

**Assumes nothing about your machine.** Does not reach for `jq`, `pwsh`, `make`, or
GNU coreutils without checking, which matters on Windows.

**Talks like a colleague.** No emoji, no flattery, no "great question". Says when it
does not know. Corrects a wrong assumption before doing the work rather than after.
Disagrees once, clearly, then does what you asked.

## The persona is opinionated, on purpose

A neutral persona would change nothing and be pointless to publish. This one makes
choices you might not share — that is the point of it being a separate, disableable
plugin rather than something bundled into another.

If you want most of it but not all of it, fork the repository and edit
[`agents/focus.md`](agents/focus.md). It is one Markdown file.

## Using it as a subagent instead

If you want the persona available but not as your default, delete
[`settings.json`](settings.json) from the installed plugin. The `focus` agent
remains defined and you can invoke it deliberately, while your main thread stays
untouched.

## How this works, mechanically

Two files do the whole job:

```
settings.json     { "agent": "focus" }
agents/focus.md   the persona, as an agent definition
```

`settings.json` sits at the **plugin root** — not inside `.claude-plugin/`, where
`plugin.json` lives. That asymmetry is confusing and worth remembering if you write
your own plugin.

It contains only the `agent` key because that is the only key the harness keeps. The
schema says so literally: *"Only allowlisted keys are kept (currently: agent)."*
Anything else you put there — permissions, model, env — is discarded silently, with
no error. Adding such a key would look like working configuration while doing
nothing, so this file deliberately contains nothing else.

## The third kind of rule

This marketplace publishes one plugin per mechanism, so the differences can be
compared rather than described:

| Plugin | Mechanism | Applies |
|---|---|---|
| [commit-craft](../commit-craft) | Skill | When the model judges it relevant |
| [guard-rails](../guard-rails) | Hook | Deterministically, at a specific event |
| **focus-mode** | `settings.agent` | **Unconditionally, to everything** |

A skill can be passed over. A hook fires only on the event it is bound to. This has
no trigger at all — which is exactly why it needs the warning at the top of this
file. [docs/concepts.md](../../docs/concepts.md) covers all of it.

## Turning it off

```
/plugin disable focus-mode@ai-marketplace     # keep it, stop it applying
/plugin uninstall focus-mode@ai-marketplace   # remove it
```

Run `/reload-plugins` or restart the session afterwards — plugin changes do not hot
reload.

## License

[MIT](LICENSE)
