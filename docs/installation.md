# Installation

## For users

Register the marketplace once, from any Claude Code session:

```
/plugin marketplace add yurifws/ai_marketplace
```

Then install whichever plugins you want:

```
/plugin install commit-craft@ai-marketplace
/plugin install guard-rails@ai-marketplace
/plugin install focus-mode@ai-marketplace
```

> **The name after `@` is `ai-marketplace`, not `ai_marketplace`.**
> The install target uses the `name` declared in `marketplace.json`; the
> repository is called `ai_marketplace`. They differ by one character and it
> catches everyone exactly once.

Everything is optional and independently removable. Start with `commit-craft` if
you want to see how this works without changing any behaviour you would notice.

### Managing what you installed

```
/plugin list                                  # what is installed
/plugin disable focus-mode@ai-marketplace     # keep it, stop it running
/plugin uninstall focus-mode@ai-marketplace   # remove it
/plugin marketplace update ai-marketplace     # pull new versions
/reload-plugins                               # after editing a plugin locally
```

`focus-mode` is worth a specific warning: enabling it replaces the system prompt
of your main thread. That is the point of it, but it is also the most noticeable
change of the three. Try it last, and `/plugin disable` it if it is not for you.

### The same commands outside a session

```bash
claude plugin marketplace add yurifws/ai_marketplace
claude plugin marketplace list
claude plugin install commit-craft@ai-marketplace
claude plugin list
```

## For development

### Run a plugin without installing it

The fastest loop. Loads a single plugin directory into a throwaway session:

```bash
claude --plugin-dir ./plugins/guard-rails
```

Inside that session, `/hooks` lists the hooks the plugin registered, and typing `/`
shows its skills. Nothing is installed and nothing persists.

### Register the local clone as a marketplace

Closer to what a real user experiences, since it exercises the catalog too:

```bash
claude plugin marketplace add .
claude plugin install commit-craft@ai-marketplace
```

Remove it again with `claude plugin marketplace remove ai-marketplace` to avoid
confusing a local checkout with the published version.

### Run the checks CI will run

Do this before pushing. These are the same commands the pipeline runs, which is why
the test logic lives in `scripts/` rather than inline in the workflow:

```bash
claude plugin validate .                    # the catalog
claude plugin validate plugins/<name>       # each plugin, individually
node scripts/test-hooks.mjs                 # hook exit-code assertions
node scripts/lint-skills.mjs                # skill frontmatter and trigger quality
```

Validating the root is **not** a substitute for validating each plugin. A
root-level validate does not descend into per-plugin manifests, so a broken plugin
passes cleanly there and only fails later, at install time, with an unhelpful
error.

### Hooks do not hot-reload

After editing `hooks/hooks.json` or any hook script, run `/reload-plugins` or
restart the session. Forgetting this is the single most common reason for
"my hook does not work".

## Requirements

- Claude Code (any recent version)
- Node.js 22+ — only to run the check scripts; the plugins themselves need nothing
- Git

`claude plugin validate` works offline and needs no API key.

## Troubleshooting

**`/plugin install` says the plugin is not found.** Check the suffix is
`@ai-marketplace`. Then `claude plugin marketplace update ai-marketplace` — your
local copy of the catalog may predate the plugin.

**A plugin installed but nothing happens.** Skills fire when the model judges them
relevant, so try language matching the skill's description, or invoke it directly
as `/skill-name`. Hooks need `/reload-plugins` after any edit.

**Validation passes but installation fails.** Almost always a per-plugin manifest
problem that the root-level validate did not inspect. Run
`claude plugin validate plugins/<name>` directly.

**A hook is blocking something it should not.** Disable the plugin
(`/plugin disable guard-rails@ai-marketplace`), then open an issue with the file
and content that triggered it. A false positive is treated as a real bug here, not
as expected caution.
