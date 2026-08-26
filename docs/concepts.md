# Concepts

Everything you need to understand a Claude Code plugin marketplace before you
build one — or before you install somebody else's.

## The four layers

```
Marketplace   → a Git repo holding a catalog (.claude-plugin/marketplace.json)
  └── Plugin      → a folder with a manifest (.claude-plugin/plugin.json) + components
        └── Components → skills / agents / hooks / settings / mcpServers
```

A **marketplace** is not a website or a service. It is an ordinary Git repository
with one extra file. When someone runs `/plugin marketplace add owner/repo`, Claude
Code clones the repo and reads `.claude-plugin/marketplace.json` to learn what is on
offer. Distribution costs nothing because Git is the distribution.

A **plugin** is a directory containing a manifest and some components. It is the
unit people install and uninstall. Plugins are distributed in isolation, which is
why each carries its own `README.md` and `LICENSE`.

**Components** are the things that actually change how a session behaves.

## Who fires what

This is the distinction that matters most, and the one that is easiest to get
wrong. Different components offer fundamentally different guarantees.

| Component | Who invokes it | Guarantee | Context cost |
|---|---|---|---|
| **Skill** | The *model* decides, by reading the `description`. Or you, via `/name`. | None — it is persuasion | Zero until it fires |
| **Agent** | The model delegates a task to a subagent with its own context | None | Zero until it fires |
| **Hook** | The *harness* — the program itself, deterministically | **Total** — the model cannot ignore it | Only what the script prints |
| **settings.json** | The harness, when the plugin is enabled | Total, but only the `agent` key today | Replaces the main system prompt |

A useful shorthand:

- **skill** = "here is how to do this well"
- **hook** = "do not let this be done wrong"
- **settings.agent** = "this is who you are by default"

### Skills persuade

A skill is a Markdown file with YAML frontmatter. The model reads its
`description`, decides whether it applies, and if so loads the body as guidance.

That decision is the whole mechanism, which makes `description` the single most
important field in the file. `"Helps with git"` describes a topic, and a topic is
not a trigger — a skill described that way will essentially never fire. Write the
phrases a person actually types:

```yaml
description: Use when the user asks to "make a commit", "commit this", write a
  commit message, or split changes into separate commits.
```

Skills cost nothing until they fire. Only the description sits in context; the body
loads on activation. That is why many small, well-described skills beat one large
one.

### Hooks enforce

A hook is a program the harness runs at a lifecycle event — before a tool call,
at session start, when a file changes. It is not asked for an opinion. It runs.

Hooks communicate through exit codes:

| Exit code | Meaning |
|---|---|
| `0` | Allow. Anything on stdout may be structured JSON the harness acts on. |
| `2` | **Block.** stderr is returned to the model as the reason. |
| anything else | Non-blocking error. Surfaces as a warning; execution continues. |

This is the only mechanism that can *prevent* something. A skill saying "never
commit secrets" is advice. A `PreToolUse` hook that scans writes and exits `2` is a
wall.

The tradeoff is that hooks have no judgment. A hook with an overly broad pattern
blocks legitimate work, and there is no arguing with it — which is why a false
positive in a blocking hook is as serious a defect as a missed detection.

Two practical notes: hooks do **not** hot-reload (run `/reload-plugins` after
editing one), and a hook without a `timeout` can hang a session.

### settings.json replaces

A plugin may ship a `settings.json` at its root. Today the harness keeps exactly
one key from it — `agent` — which swaps the persona of the main thread:

```json
{ "agent": "focus" }
```

Everything else placed in that file is silently discarded. This is the strongest
and least reversible of the mechanisms: it changes the system prompt for the whole
session. A plugin that does this should be a *separate* plugin, so it can be
disabled without losing anything else.

## Two more kinds of rule

Beyond the components themselves, this repository uses two governance mechanisms
that behave like rules but live outside any plugin.

**The constitution** (`.specify/memory/constitution.md`) is project-scoped,
human-authored, and always loaded. It is persuasive like a skill, but it never has
to be triggered — it is simply present. Every spec and plan in this repository is
checked against it.

**Branch protection and CI** are enforced by a machine nobody controls at the
moment of the merge. They apply to everyone, including whoever wrote them. This is
the only kind of rule that still works when nobody is paying attention.

So there are five mechanisms in total, in increasing order of how hard they are to
ignore:

1. **Constitution / CONTRIBUTING** — always present, binds nothing
2. **Skill** — fires when the model judges it relevant
3. **Agent default (`settings.agent`)** — shapes every response in the session
4. **Hook** — the harness enforces it, deterministically
5. **CI and branch protection** — enforced after the fact, on everyone

Choosing the right one is mostly a question of what happens when someone ignores
it. If the answer is "a slightly worse commit message", a skill is right. If the
answer is "a credential is now in public Git history", it needs to be a hook.

## Where files go

The layout has one genuinely confusing asymmetry, worth memorizing:

```
repo-root/
├── .claude-plugin/
│   └── marketplace.json          ← catalog: ONLY at the repo root
└── plugins/
    └── my-plugin/
        ├── .claude-plugin/
        │   └── plugin.json       ← manifest: INSIDE .claude-plugin/
        ├── settings.json         ← settings: at the PLUGIN ROOT, not inside .claude-plugin/
        ├── skills/<name>/SKILL.md
        ├── agents/<name>.md
        ├── hooks/hooks.json
        ├── README.md
        └── LICENSE
```

`plugin.json` goes inside `.claude-plugin/`; `settings.json` does not. There is no
principle behind it — just remember it.

Components placed in the default locations (`skills/`, `agents/`, `hooks/hooks.json`)
need no path declarations in the manifest at all. Fewer fields, fewer ways to be
wrong.

## Gotchas worth knowing up front

- **The marketplace name is not the repo name.** You install
  `<plugin>@ai-marketplace`, taken from the `name` in `marketplace.json` — not from
  the repository, which is `ai_marketplace`. This catches everyone once.
- **`$schema` and a root-level `description` are rejected** by the validator. A
  marketplace description belongs under `metadata.description`.
- **Validating the marketplace root is not enough.** A root-level validate does not
  descend into per-plugin manifests, so a broken plugin passes cleanly and fails
  later at install time with an opaque error. Validate each plugin directory too.
- **Skill names are what users type.** Avoid `review`, `commit`, `test`, `plan`,
  `build`, `deploy` — they collide with built-ins and with other marketplaces.
- **`commands/` is legacy.** Skills supersede it and do strictly more.
- **Version bumps go in two places** — the plugin's `plugin.json` and its entry in
  `marketplace.json`. Miss one and installed copies stay silently stale.
- **Remote installs read the default branch.** Nothing merged only to `develop` is
  installable by anyone else.

## Further reading

- [installation.md](./installation.md) — installing and developing locally
- [../CONTRIBUTING.md](../CONTRIBUTING.md) — branching, releases, and conventions
- [Claude Code plugin documentation](https://docs.claude.com/en/docs/claude-code/plugins)
