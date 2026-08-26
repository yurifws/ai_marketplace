# Security Policy

This repository publishes plugins that run inside other people's Claude Code
sessions, and one of them (`guard-rails`) is a credential blocker. That combination
deserves a stated policy rather than an implied one.

## Supported versions

Only the latest release. This is a personal marketplace, not a supported product —
there are no backports and no maintenance window. If you need a guarantee beyond
that, fork it.

| Version | Supported |
|---|---|
| latest release | yes |
| anything older | no |

## Reporting a vulnerability

Use **GitHub Security Advisories** — the *Report a vulnerability* button under the
[Security tab](https://github.com/yurifws/ai_marketplace/security/advisories/new).

**Do not open a public issue.** For a credential-detection bug in particular, a
public report is a description of exactly what slips past the filter, readable by
anyone before it is fixed.

There is no formal SLA. Best effort, from one maintainer.

## What is in scope

Anything where a plugin here behaves worse than its own documentation claims:

- **A `guard-rails` false negative** — a credential format that should plausibly be
  recognised but passes through. Include the *shape* of the string, never a live
  credential.
- **A `guard-rails` false positive** — a block on legitimate content. This is a real
  defect of the same severity, not excess caution. A guard that cries wolf gets
  uninstalled, and an uninstalled guard protects nothing. The plugin README already
  says this; here it is policy.
- **Secret leakage by the tooling itself** — if any hook, script or log echoes a
  matched credential value. The hooks are written to report the *kind* of secret and
  never the value; a violation of that is a bug.
- **Command injection or path traversal** in a hook or in `scripts/*.mjs`, including
  via a crafted tool payload on stdin.
- **Anything a plugin does that its README does not disclose** — particularly
  unexpected writes, network calls, or scope beyond what is described.

## What is out of scope

- **That pattern matching cannot catch every secret.** `guard-rails` matches known,
  documented credential formats. It will miss novel or unusual ones. That is a
  stated limitation, not a vulnerability.
- **That a skill can be ignored.** Skills are persuasion; the model may decline to
  apply one. Only hooks enforce. This is how the platform works.
- **That `focus-mode` changes agent behaviour.** Replacing the system prompt is its
  documented purpose.
- Vulnerabilities in Claude Code itself — report those to
  [Anthropic](https://github.com/anthropics/claude-code/security).

## What this is not

**`guard-rails` is a safety net, not a security boundary.**

It reduces the chance of an agent writing a credential into a file. It is not a
secret scanner, it does not inspect your git history or existing files, it does not
run outside a Claude Code session, and it can be disabled by anyone who has it
installed.

Do not remove other controls because it is present. Keep your pre-commit hooks, your
server-side secret scanning, and your credential rotation. If a secret does reach a
repository, rotate it — assume it is compromised regardless of how quickly it was
removed.

## For anyone deploying this internally

Two things a platform or security team will want to know:

- **Everything here is plain text you can read.** Hooks are dependency-free Node in
  `plugins/*/hooks/*.mjs`; skills and agents are Markdown. There is no build step and
  no bundled binary. Review it directly.
- **You can restrict what your developers may install.** `managed-settings.json`
  supports `strictKnownMarketplaces` to allowlist marketplaces, `blockedMarketplaces`
  to deny others, and `disableSideloadFlags` to block `--plugin-dir`. See
  [docs/team-setup.md](docs/team-setup.md).
