# ai_marketplace

A personal [Claude Code](https://claude.com/claude-code) plugin marketplace —
skills, agents, and hooks by [@yurifws](https://github.com/yurifws), installable
in one command.

```
/plugin marketplace add yurifws/ai_marketplace
```

Then install whichever you want:

```
/plugin install commit-craft@ai-marketplace
```

> The name after `@` is `ai-marketplace`; the repository is `ai_marketplace`.
> They differ by one character, and that catches everyone exactly once.

## Plugins

| Plugin | What it does | Kind of rule |
|---|---|---|
| [commit-craft](plugins/commit-craft) | Conventional Commits and a consistent PR description format | Skill — the model applies it when relevant |

<!--
| [guard-rails](plugins/guard-rails) | Blocks secrets from being written; injects repo context at session start | Hook — the harness enforces it |
| [focus-mode](plugins/focus-mode) | A default working persona: plans first, minimal changes, never commits unasked | Agent default — replaces the system prompt |
-->

Each plugin is independent. Install one, all, or none, and remove any of them
without affecting the others.

## What a marketplace actually is

Not a website or a service — an ordinary Git repository with one extra file.
`/plugin marketplace add` clones the repo and reads
[`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json) to learn what
is on offer. Distribution costs nothing because Git *is* the distribution.

The more interesting question is what the components inside a plugin can actually
guarantee, because they differ more than they appear to:

| Component | Who invokes it | Guarantee |
|---|---|---|
| **Skill** | The model decides, by reading its `description` | None — it is persuasion |
| **Agent** | The model delegates to a subagent | None |
| **Hook** | The harness, deterministically | **Total** — the model cannot ignore it |
| **settings.json** | The harness, on enable | Total, but only swaps the persona |

Shorthand: **skill** = "how to do this well", **hook** = "do not let this be done
wrong", **settings.agent** = "who you are by default".

The three plugins here exist partly as one worked example of each, so the
difference can be observed rather than described.
[**docs/concepts.md**](docs/concepts.md) is the full explanation.

## Documentation

| | |
|---|---|
| [docs/concepts.md](docs/concepts.md) | The mental model — layers, components, and what each one guarantees |
| [docs/installation.md](docs/installation.md) | Installing, developing locally, troubleshooting |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Branching, releases, and the rules for adding a plugin |
| [.specify/memory/constitution.md](.specify/memory/constitution.md) | The principles every change is checked against |

## How this repository is built

Every feature goes through Spec-Driven Development with
[spec-kit](https://github.com/github/spec-kit), leaving a durable record in
[`specs/`](specs/). Branching is git-flow (`main` ← `release/*` ← `develop` ←
`feature/NNN-slug`), nothing is pushed directly to `main` or `develop`, and CI
validates every manifest, tests every hook, and lints every skill before a merge is
possible.

That is heavier than a repository of this size needs. It is deliberate: the
governance is itself one of the things being studied here, since a CI check and a
branch rule are simply two more kinds of "rule" sitting alongside skills and
hooks — differing mainly in what happens when someone ignores them.

## License

[MIT](LICENSE)
