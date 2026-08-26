#!/usr/bin/env node
// Asserts every plugin agrees with its catalog entry.
//
// A plugin's version lives in two files: its own .claude-plugin/plugin.json and its
// entry in .claude-plugin/marketplace.json. That pairing is what makes
// `claude plugin update` notice a new release. Bump one and forget the other and
// there is no error anywhere — installed copies simply stay on the old version
// forever, silently.
//
// The constitution requires bumping both. This is what makes that requirement real
// rather than aspirational.
//
// Also checks the reverse direction: a plugin directory that exists on disk but was
// never added to the catalog is invisible to every user, which looks identical to
// "not written yet" and is easy to ship by accident.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const CATALOG = join(ROOT, ".claude-plugin", "marketplace.json");
const PLUGINS_DIR = join(ROOT, "plugins");

const problems = [];
let checked = 0;

const catalog = JSON.parse(readFileSync(CATALOG, "utf8"));
const entries = Array.isArray(catalog.plugins) ? catalog.plugins : [];

const onDisk = existsSync(PLUGINS_DIR)
  ? readdirSync(PLUGINS_DIR).filter((n) => statSync(join(PLUGINS_DIR, n)).isDirectory())
  : [];

for (const entry of entries) {
  checked++;
  const where = `marketplace.json → ${entry.name}`;

  if (!entry.source) {
    problems.push(`${where}: no 'source'.`);
    continue;
  }
  if (entry.source.endsWith(".json")) {
    problems.push(
      `${where}: 'source' must point at the plugin DIRECTORY, not a manifest file ` +
        `(got ${entry.source}).`
    );
    continue;
  }

  const dir = join(ROOT, entry.source);
  const manifestPath = join(dir, ".claude-plugin", "plugin.json");

  if (!existsSync(manifestPath)) {
    problems.push(`${where}: no .claude-plugin/plugin.json at ${entry.source}.`);
    continue;
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (err) {
    problems.push(`${where}: manifest is invalid JSON — ${err.message}`);
    continue;
  }

  if (manifest.name !== entry.name) {
    problems.push(
      `${where}: manifest name is '${manifest.name}' but the catalog entry is ` +
        `'${entry.name}'. These must be identical.`
    );
  }
  if (manifest.version !== entry.version) {
    problems.push(
      `${where}: version mismatch — manifest ${JSON.stringify(manifest.version)} vs ` +
        `catalog ${JSON.stringify(entry.version)}. Bump BOTH, or clients never see ` +
        `the update.`
    );
  }

  // Constitution principle I: complete or it does not ship.
  for (const required of ["README.md", "LICENSE"]) {
    if (!existsSync(join(dir, required))) {
      problems.push(
        `${entry.name}: missing ${required}. Plugins are distributed in isolation, ` +
          `so each carries its own.`
      );
    }
  }
}

// A directory nobody can install looks exactly like one that was never written.
const listed = new Set(entries.map((e) => e.name));
for (const dir of onDisk) {
  if (!listed.has(dir)) {
    problems.push(
      `plugins/${dir}/ exists on disk but has no entry in marketplace.json — ` +
        `it is invisible to every user.`
    );
  }
}

console.log();
if (checked === 0 && onDisk.length === 0) {
  console.log("check-versions: no plugins yet — nothing to check.");
  process.exit(0);
}

if (problems.length) {
  console.error(`check-versions: ${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`  x  ${p}\n`);
  process.exit(1);
}

console.log(`check-versions: ${checked} plugin(s) consistent with the catalog.`);
process.exit(0);
