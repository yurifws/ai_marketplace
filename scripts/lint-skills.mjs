#!/usr/bin/env node
// Lints every plugin SKILL.md for the one property that decides whether the skill
// ever runs: its description.
//
// A skill fires when the model reads its `description` and judges it applicable.
// So "Helps with git" is not a weak description — it is a skill that never
// activates, a silent no-op no schema validator will ever flag. This linter is the
// only thing standing between that and a published plugin.
//
// Checks per skill:
//   1. Frontmatter exists and parses.
//   2. `description` is present and non-empty.
//   3. `description` is specific: long enough, and not a bare topic label.
//   4. `name` is kebab-case and does not collide with a common built-in.
//   5. Directory name matches `name` when `name` is declared.

import { readdirSync, existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const PLUGINS_DIR = join(ROOT, "plugins");

// Names that collide with built-ins or are so generic that two marketplaces will
// inevitably fight over them. The short name is what the user types.
const RESERVED = new Set([
  "review", "commit", "test", "plan", "build", "deploy", "init", "run",
  "help", "search", "fix", "debug", "release", "docs", "lint",
]);

// A description must do more than name a topic. These openings describe a subject
// rather than a trigger, which is the difference between firing and not.
const VAGUE_OPENERS = [
  /^helps?\s+with\b/i,
  /^assists?\s+with\b/i,
  /^for\s+\w+ing\b/i,
  /^a\s+skill\s+(that|for)\b/i,
  /^utilit(y|ies)\s+for\b/i,
  /^tools?\s+for\b/i,
  /^manages?\s+\w+$/i,
];

const MIN_DESCRIPTION_LENGTH = 40;

let checked = 0;
const failures = [];

function listDirs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((n) => statSync(join(dir, n)).isDirectory());
}

function fail(where, message) {
  failures.push(`${where}\n    ${message}`);
}

// Minimal frontmatter reader: enough for the flat scalar keys we assert on,
// without pulling in a YAML dependency. Supports folded multi-line values.
function parseFrontmatter(text) {
  if (!text.startsWith("---")) return null;
  const end = text.indexOf("\n---", 3);
  if (end === -1) return null;
  const body = text.slice(text.indexOf("\n") + 1, end);

  const out = {};
  let currentKey = null;
  for (const rawLine of body.split("\n")) {
    if (!rawLine.trim() || rawLine.trim().startsWith("#")) continue;
    const m = rawLine.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m && !rawLine.startsWith(" ") && !rawLine.startsWith("\t")) {
      currentKey = m[1];
      out[currentKey] = m[2].trim();
    } else if (currentKey && /^\s+/.test(rawLine)) {
      // Continuation of a folded value.
      out[currentKey] = `${out[currentKey]} ${rawLine.trim()}`.trim();
    }
  }
  for (const k of Object.keys(out)) {
    out[k] = out[k].replace(/^["'](.*)["']$/, "$1").trim();
  }
  return out;
}

for (const plugin of listDirs(PLUGINS_DIR)) {
  const skillsDir = join(PLUGINS_DIR, plugin, "skills");
  if (!existsSync(skillsDir)) continue;

  for (const skill of listDirs(skillsDir)) {
    const skillFile = join(skillsDir, skill, "SKILL.md");
    const where = `plugins/${plugin}/skills/${skill}/SKILL.md`;

    if (!existsSync(skillFile)) {
      checked++;
      fail(`plugins/${plugin}/skills/${skill}/`, "Directory has no SKILL.md.");
      continue;
    }

    checked++;
    const text = readFileSync(skillFile, "utf8");
    const fm = parseFrontmatter(text);

    if (!fm) {
      fail(where, "No parseable YAML frontmatter (must open with '---' on line 1).");
      continue;
    }

    const problems = [];
    const name = fm.name;
    const description = fm.description;

    if (name !== undefined) {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
        problems.push(`name '${name}' must be kebab-case: lowercase, digits, single hyphens.`);
      }
      if (RESERVED.has(name)) {
        problems.push(
          `name '${name}' is reserved or too generic — it is what the user types, so it ` +
            `will collide with built-ins or another marketplace. Qualify it.`
        );
      }
      if (name !== skill) {
        problems.push(`name '${name}' does not match its directory '${skill}'.`);
      }
    }

    if (!description) {
      problems.push(
        "No 'description'. This field is the skill's only trigger — without it the " +
          "skill can never be selected by the model."
      );
    } else {
      if (description.length < MIN_DESCRIPTION_LENGTH) {
        problems.push(
          `description is ${description.length} chars; needs at least ${MIN_DESCRIPTION_LENGTH}. ` +
            `Name the concrete phrases a user would type, not the topic.`
        );
      }
      const vague = VAGUE_OPENERS.find((re) => re.test(description));
      if (vague) {
        problems.push(
          `description reads as a topic label, not a trigger (matched ${vague}). ` +
            `Write "Use when the user asks to ..." with the actual phrases.`
        );
      }
      if (!/\buse\s+when\b|\bwhen\s+the\s+user\b|\bwhen\s+asked\b/i.test(description)) {
        problems.push(
          "description does not state WHEN to use the skill. Include a 'Use when ...' " +
            "clause so the model has a trigger to match against."
        );
      }
    }

    if (problems.length) fail(where, problems.join("\n    "));
  }
}

console.log();
if (checked === 0) {
  console.log("lint-skills: no skills found yet — nothing to lint.");
  process.exit(0);
}

if (failures.length) {
  console.error(`lint-skills: ${failures.length} of ${checked} skill(s) failed:\n`);
  for (const f of failures) console.error(`  x  ${f}\n`);
  process.exit(1);
}

console.log(`lint-skills: ${checked} skill(s) passed.`);
process.exit(0);
