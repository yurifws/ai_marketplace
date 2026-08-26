#!/usr/bin/env node
// SessionStart hook: put the repository's state and standing rules into context
// before the first message.
//
// This is the non-blocking half of guard-rails, and it is the clearest illustration
// of what a hook is for. The text it emits is roughly what a guidance skill would
// say — the difference is that it runs EVERY time, rather than when the model
// judges it relevant.
//
// It fails silently in every error case. Not a git repo, git missing, a command
// erroring: exit 0, emit nothing. A context hook that throws on session start is
// strictly worse than no context hook at all.

import { execFileSync } from "node:child_process";

function git(args) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true,
      timeout: 5000,
    }).trim();
  } catch {
    return "";
  }
}

const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);
if (!branch) process.exit(0); // not a git repository, or git unavailable

const status = git(["status", "--porcelain"]);
const dirty = status ? status.split("\n").filter(Boolean).length : 0;
const lastCommit = git(["log", "-1", "--pretty=%s"]);

const isProtected = branch === "main" || branch === "develop";
const isRelease = /^(release|hotfix)\//.test(branch);

const lines = [
  "## Repository context (injected by the guard-rails plugin)",
  "",
  `- Current branch: \`${branch}\``,
  `- Uncommitted files: ${dirty}`,
  `- Last commit: ${lastCommit || "(none)"}`,
  "",
  "## Standing rules for this session",
  "",
  "- Do not run `git commit` or `git push` unless explicitly asked.",
  "- Never use `--no-verify`, `--force`, or `git reset --hard` without being asked.",
  "- Never write credentials into files. Use environment variables.",
];

if (isProtected) {
  lines.push(
    "",
    `- **You are on \`${branch}\`, which is a protected branch.** Direct pushes are ` +
      "rejected by the remote, so any work committed here cannot be pushed. Before " +
      "the first file edit, propose creating a feature branch: " +
      "`git checkout -b feature/NNN-slug`."
  );
} else if (isRelease) {
  lines.push(
    "",
    `- **You are on \`${branch}\`, a release branch.** It should carry version bumps ` +
      "and changelog edits only. If a feature or fix is needed, it belongs on " +
      "`develop` instead."
  );
}

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: lines.join("\n"),
    },
  })
);
