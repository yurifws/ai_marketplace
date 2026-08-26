#!/usr/bin/env node
// Runs every plugin hook against its declared fixtures and asserts exit codes.
//
// Hooks are the only component that can BLOCK an action, so a misfiring hook is
// worse than no hook at all. The constitution therefore requires every hook to
// have at least one exercised case, and treats a false positive as exactly as
// severe as a false negative.
//
// Each plugin declares its cases in plugins/<name>/hooks/fixtures.json:
//
//   [
//     {
//       "name": "blocks an AWS access key",
//       "hook": "check-secrets.mjs",
//       "stdin": { "tool_name": "Write", "tool_input": { ... } },
//       "expectExit": 2,
//       "expectStderrContains": "BLOCKED"
//     }
//   ]
//
// Optional per-case keys: expectStdoutContains, expectStdoutJson (asserts stdout
// parses as JSON and contains the given key path).
//
// Runs identically here and in CI, which is the point: `node scripts/test-hooks.mjs`
// before pushing tells you what CI is about to say.

import { readdirSync, existsSync, readFileSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const PLUGINS_DIR = join(ROOT, "plugins");

const results = { passed: 0, failed: 0, hooks: 0 };
const failures = [];

function listDirs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((n) => statSync(join(dir, n)).isDirectory());
}

function fail(where, message) {
  results.failed++;
  failures.push(`${where}\n    ${message}`);
}

for (const plugin of listDirs(PLUGINS_DIR)) {
  const hooksDir = join(PLUGINS_DIR, plugin, "hooks");
  if (!existsSync(hooksDir)) continue;

  const hookFiles = readdirSync(hooksDir).filter((f) => f.endsWith(".mjs"));
  if (hookFiles.length === 0) continue;

  const fixturesPath = join(hooksDir, "fixtures.json");
  if (!existsSync(fixturesPath)) {
    for (const h of hookFiles) {
      results.hooks++;
      fail(
        `${plugin}/hooks/${h}`,
        `No fixtures.json in ${plugin}/hooks/. Every hook must declare at least ` +
          `one test case — an untested hook that blocks is a defect waiting to happen.`
      );
    }
    continue;
  }

  let fixtures;
  try {
    fixtures = JSON.parse(readFileSync(fixturesPath, "utf8"));
  } catch (err) {
    fail(`${plugin}/hooks/fixtures.json`, `Invalid JSON: ${err.message}`);
    continue;
  }
  if (!Array.isArray(fixtures)) {
    fail(`${plugin}/hooks/fixtures.json`, "Expected a JSON array of test cases.");
    continue;
  }

  // Every hook file must be covered by at least one case.
  for (const h of hookFiles) {
    results.hooks++;
    if (!fixtures.some((c) => c.hook === h)) {
      fail(
        `${plugin}/hooks/${h}`,
        `No case in fixtures.json targets this hook. Add at least one.`
      );
    }
  }

  for (const [i, c] of fixtures.entries()) {
    const label = `${plugin}/hooks/${c.hook ?? "?"} — ${c.name ?? `case ${i}`}`;
    const hookPath = join(hooksDir, c.hook ?? "");

    if (!c.hook || !existsSync(hookPath)) {
      fail(label, `Case targets '${c.hook}', which does not exist in ${plugin}/hooks/.`);
      continue;
    }
    if (typeof c.expectExit !== "number") {
      fail(label, "Case is missing a numeric 'expectExit'.");
      continue;
    }

    const proc = spawnSync(process.execPath, [hookPath], {
      input: typeof c.stdin === "string" ? c.stdin : JSON.stringify(c.stdin ?? {}),
      encoding: "utf8",
      timeout: 15000,
    });

    if (proc.error) {
      fail(label, `Failed to run: ${proc.error.message}`);
      continue;
    }

    const problems = [];
    if (proc.status !== c.expectExit) {
      problems.push(`expected exit ${c.expectExit}, got ${proc.status}`);
    }
    if (c.expectStderrContains && !(proc.stderr ?? "").includes(c.expectStderrContains)) {
      problems.push(
        `stderr should contain ${JSON.stringify(c.expectStderrContains)}; got ${JSON.stringify(
          (proc.stderr ?? "").slice(0, 200)
        )}`
      );
    }
    if (c.expectStdoutContains && !(proc.stdout ?? "").includes(c.expectStdoutContains)) {
      problems.push(
        `stdout should contain ${JSON.stringify(c.expectStdoutContains)}; got ${JSON.stringify(
          (proc.stdout ?? "").slice(0, 200)
        )}`
      );
    }
    if (c.expectStdoutJson) {
      try {
        const parsed = JSON.parse(proc.stdout);
        for (const path of c.expectStdoutJson) {
          const found = path
            .split(".")
            .reduce((acc, k) => (acc == null ? undefined : acc[k]), parsed);
          if (found === undefined) problems.push(`stdout JSON is missing '${path}'`);
        }
      } catch {
        problems.push(
          `stdout should be valid JSON; got ${JSON.stringify((proc.stdout ?? "").slice(0, 200))}`
        );
      }
    }

    if (problems.length) {
      fail(label, problems.join("\n    "));
    } else {
      results.passed++;
      console.log(`  ok  ${label}`);
    }
  }
}

console.log();
if (results.hooks === 0) {
  console.log("test-hooks: no hooks found yet — nothing to test.");
  process.exit(0);
}

if (results.failed > 0) {
  console.error(`test-hooks: ${results.failed} failure(s) across ${results.hooks} hook(s):\n`);
  for (const f of failures) console.error(`  x  ${f}\n`);
  process.exit(1);
}

console.log(`test-hooks: ${results.passed} case(s) passed across ${results.hooks} hook(s).`);
process.exit(0);
