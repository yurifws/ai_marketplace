# Implementation Plan: Team Readiness

**Branch**: `feature/005-team-readiness` | **Date**: 2026-08-26 | **Spec**: [spec.md](./spec.md)

## Summary

Two documents and one example file. No plugin changes, no code.

This is what turns the repository from a personal experiment into something that can
be handed to a colleague or a platform reviewer — the actual point of the proof of
concept. The plugins already work; what was missing is the answer to "how do I use
this" and "what are you promising me".

## Technical Context

**Language/Version**: Markdown and one JSON file. No executable code.

**Primary Dependencies**: None.

**Testing**: Link resolution, `git check-ignore` behaviour, and the existing suite proving nothing regressed.

**Target Platform**: Documentation. The `managed-settings.json` paths cover Windows, macOS and Linux.

**Project Type**: Documentation only.

**Constraints**: Every claim must be true and checkable. This document will be read by someone whose job is to find the gap between what it says and what the tool does.

**Scale/Scope**: `SECURITY.md`, `docs/team-setup.md`, `.claude/settings.json`, plus links from `README.md` and a `CHANGELOG.md` entry.

## Constitution Check

*Evaluated against `.specify/memory/constitution.md` v1.0.0.*

| Principle | Status |
|---|---|
| I. Every plugin is complete or it does not ship | N/A — no plugin changes |
| II. Validation is a gate | **Satisfied** — the full suite runs; this must not regress anything |
| III. Hooks are Node, and they are tested | N/A — no hooks |
| IV. A skill description is its trigger | N/A — no skills |
| V. Portable, public, and small | **Satisfied** — three files, no secrets, no absolute paths outside documented OS locations |

**No violations.**

One deviation from the approved plan, made deliberately: it specified two features,
`005-security-policy` and `006-team-onboarding`. They ship as one because
`SECURITY.md` links to `docs/team-setup.md`. Splitting them to honour
one-concern-per-branch would put a dead link on `develop` for however long the second
PR took. The coupling is real, so the branch reflects it.

## Design Decisions

**Lead with the limitation.** `docs/team-setup.md` opens by stating that nothing can
force-install a plugin, before describing any mechanism. The temptation is to present
project-level declaration as "your team gets it automatically" — that is disprovable
in about a minute, and being caught overstating once costs more credibility than the
limitation itself ever would.

**A false positive is in scope, in writing.** `guard-rails`' README already claims
this; `SECURITY.md` makes it policy. A credential blocker whose failure mode is
annoying people gets uninstalled, and then protects nothing — so precision genuinely
is a security property here, not a nicety.

**Say what is not promised.** `SECURITY.md` states plainly that `guard-rails` is a
safety net, not a security boundary, and that other controls should stay in place.
A public repository shipping a credential blocker either says this or implies
something false by omission.

**Explain *why* SSH, not just "use SSH".** Private HTTPS marketplaces add
successfully and only fail background updates. Without the reason, a reader who
already has HTTPS working sees no cause to change, and the failure surfaces days
later as "updates stopped".

**The example is a real committed file**, not a fenced block. It can be copied
verbatim, and CI parses it along with every other tracked JSON.

## Verification

- Every relative link in the new and edited documents resolves.
- `git check-ignore -q .claude/settings.json` reports it tracked; `.claude/skills`
  stays ignored. Verified with `-q`, not `-v`: the verbose form exits 0 when *any*
  pattern matches, including a negation, so it reports success for a file that is in
  fact excluded.
- `git add -A -n` shows `.claude/settings.json` and nothing else from `.claude/`.
- The full existing suite passes — four manifests, 22 hook fixtures, skill lint,
  catalog parity — confirming a documentation change regressed nothing.
- Read `docs/team-setup.md` against the actual behaviour: the marketplace registers
  on trust, and an install is still required. If the document and the tool disagree,
  the document is wrong.
