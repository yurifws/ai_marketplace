# Team setup

How to give a team access to this marketplace, and what each approach actually
buys you. Written for the three questions people ask: *how do I install it*, *how
do I make it easy for my team*, and *how do we control what gets installed*.

## The honest summary first

**Nothing can force-install a plugin.** The documentation is explicit: a plugin
from an external source "still needs each person to install it once." No managed
setting overrides this, at any tier.

What you *can* do is remove the discovery step — a team member opens a project and
the marketplace is already registered, so they only run one install command instead
of finding, adding, and installing. Everything below is about shrinking that gap,
not eliminating it. Anyone telling a platform team otherwise will be found out on
first contact.

## 1. Individual install

```
/plugin marketplace add yurifws/ai_marketplace
/plugin install commit-craft@ai-marketplace
```

The suffix is `@ai-marketplace` — the `name` inside `marketplace.json`. The
repository is `ai_marketplace`, with an underscore. They differ by one character and
this catches everyone exactly once.

Outside a session:

```bash
claude plugin marketplace add yurifws/ai_marketplace
claude plugin install commit-craft@ai-marketplace
claude plugin list
```

### If your marketplace repo is private

Private repositories work, but **prefer SSH**:

```
/plugin marketplace add git@github.com:your-org/your-marketplace.git
```

Why it matters: private *HTTPS* marketplaces fail **background** auto-updates,
because credential helpers are disabled in that context. The initial add works, so
this looks fine on day one and quietly stops updating afterwards — the worst kind of
failure. SSH keys in `ssh-agent` work for background pulls.

If you must use HTTPS, embed a token in git config so background pulls can
authenticate:

```bash
git config --global \
  url."https://x-access-token:TOKEN@github.com/your-org/marketplace".insteadOf \
  "https://github.com/your-org/marketplace"
```

GitLab, Bitbucket, self-hosted git and AWS CodeCommit are all supported — use the
full URL with a `.git` suffix.

## 2. Declare the marketplace in a project

Commit a `.claude/settings.json` to any repository your team works in. This one is
checked into this repo as a working example:

```json
{
  "extraKnownMarketplaces": {
    "ai-marketplace": {
      "source": {
        "source": "github",
        "repo": "yurifws/ai_marketplace"
      }
    }
  },
  "enabledPlugins": {
    "commit-craft@ai-marketplace": true,
    "guard-rails@ai-marketplace": true
  }
}
```

**What this does:** once a team member trusts the folder, the marketplace is
registered with no prompt and no manual `marketplace add`.

**What this does not do:** install anything. A plugin from an external source such
as a GitHub repo does not load until that person installs it once. `enabledPlugins`
says *"turn this on when present"*, not *"fetch this"*.

So the realistic onboarding is:

1. Clone the repo, open Claude Code, trust the folder → marketplace appears
2. `/plugin install commit-craft@ai-marketplace` → **once per person, per machine**

If you want a plugin to load with no install step at all, it has to be committed
into the marketplace repo itself and referenced by a relative path — which means the
plugin lives in the same repository as the project, defeating the point of a shared
marketplace.

Note `.gitignore` in this repo uses `.claude/*` with `!.claude/settings.json` rather
than `.claude/`. Git cannot re-include a file whose parent directory is excluded, so
the `dir/*` form is required to track one file while ignoring the rest.

## 3. Organization control

For a security or platform team, `managed-settings.json` is deployed by IT via MDM,
Group Policy or Ansible, and cannot be overridden by individual users.

| OS | Path |
|---|---|
| Windows | `C:\Program Files\ClaudeCode\managed-settings.json` |
| macOS | `/Library/Application Support/ClaudeCode/managed-settings.json` |
| Linux / WSL | `/etc/claude-code/managed-settings.json` |

```json
{
  "strictKnownMarketplaces": [
    { "source": "github", "repo": "your-org/your-marketplace" }
  ],
  "blockedMarketplaces": [
    { "source": "github", "repo": "some/untrusted-marketplace" }
  ],
  "pluginTrustMessage": "Reviewed by Platform Engineering. Do not install others without approval.",
  "disableSideloadFlags": true
}
```

| Key | Effect |
|---|---|
| `strictKnownMarketplaces` | Allowlist. Only these marketplaces may be added. |
| `blockedMarketplaces` | Denylist for specific sources. |
| `pluginSuggestionMarketplaces` | Which marketplaces may be suggested to users. |
| `pluginTrustMessage` | Custom text appended to the plugin trust warning. |
| `disableSideloadFlags` | Blocks `--plugin-dir` and `--plugin-url`. |
| `disableCommandPluginSources` | Blocks command-based plugin sources. |

`disableSideloadFlags` is the one worth understanding: without it, anyone can bypass
the allowlist entirely by pointing `--plugin-dir` at a local folder.

A managed `CLAUDE.md` is a separate mechanism at the same paths, for
organization-wide *instructions*. Settings enforce; `CLAUDE.md` persuades. Use
settings for what must hold regardless of what the model decides.

## Updates

```
/plugin marketplace update ai-marketplace
```

Auto-update is **off by default** for third-party marketplaces, and can be enabled
per marketplace in `/plugin` → Marketplaces, or via `"autoUpdate": true` in a
managed `extraKnownMarketplaces` entry.

Versioning: if a marketplace entry declares `version`, users only see an update when
that version is bumped. Omit it and every commit is treated as an update. This repo
declares versions, and bumps them in both `plugin.json` and the catalog entry —
`scripts/check-versions.mjs` fails CI if the two disagree, because a mismatch
produces no error anywhere and leaves installed copies silently stale.

## What a reviewer should know

Everything here is plain text with no build step: hooks are dependency-free Node in
`plugins/*/hooks/*.mjs`, skills and agents are Markdown. Read it directly. See
[SECURITY.md](../SECURITY.md) for what is in scope and what this explicitly does not
promise.
