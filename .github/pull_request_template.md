<!--
PR title must follow Conventional Commits: type(scope): summary
This repository squash-merges, so the PR title becomes the commit message.
-->

## What changes

<!-- One paragraph in plain language. What is different after this merges? -->

## Why

<!-- The problem this solves. Link the issue if there is one: Closes #N -->

## Spec

<!-- Feature PRs: link the SDD artifacts. Delete this section for a release or hotfix. -->

- Spec directory: `specs/NNN-slug/`

## How to test

<!-- Numbered steps someone else can follow in under two minutes. -->

## Risks

<!-- What could break, and what to do if it does. Write "None identified" only if you looked. -->

---

## Checklist

- [ ] Branch name matches `feature/NNN-slug`, `release/*`, or `hotfix/*`
- [ ] Base branch is correct (`develop` for features; only `release/*` and `hotfix/*` may target `main`)
- [ ] `claude plugin validate .` passes, and passes for each plugin directory individually
- [ ] `node scripts/test-hooks.mjs` and `node scripts/lint-skills.mjs` both pass locally
- [ ] `/speckit-analyze` ran clean against spec, plan, and tasks *(feature PRs)*
- [ ] **Manually verified end to end in a real session** — not just green CI

> The last box is the one no automation can check. CI proves the manifests are
> well-formed; it cannot prove the plugin does the right thing when a model reads
> it. If you did not actually run it, say so in the PR rather than ticking the box.

<!-- Release PRs only: -->
<!-- - [ ] version bumped in BOTH plugin.json and the matching marketplace.json entry -->
<!-- - [ ] CHANGELOG.md updated -->
<!-- - [ ] merge-back PR into develop planned (main -> develop) -->
