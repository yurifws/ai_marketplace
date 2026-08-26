#!/usr/bin/env node
// PreToolUse hook: refuse writes that contain recognisable credentials.
//
// Contract with the harness:
//   exit 0  — allow (silent)
//   exit 2  — BLOCK; stderr is returned to the model as the reason
//   other   — non-blocking error; a warning is shown and the write proceeds
//
// Two design rules drive everything here, and they pull in opposite directions:
//
//   1. Blocking is the right default. A false positive costs the user one
//      interruption. A false negative can put a live credential in public git
//      history, where the only remedy is rotation — assuming anyone notices.
//
//   2. Precision is a feature, not a compromise. A guard that cries wolf gets
//      uninstalled, and an uninstalled guard protects nothing. So documentation
//      placeholders, example keys and lockfile hashes MUST pass.
//
// Consequences: patterns are anchored to specific issuers' documented formats
// rather than to entropy (entropy heuristics misfire constantly on integrity
// hashes, minified code and data URIs), the placeholder allowlist is checked
// first, and unparseable input fails OPEN — failing closed would let one
// unexpected payload shape brick every write in the session.

const MAX_SCAN_BYTES = 2_000_000;

// Obvious non-secrets. Applied to the MATCHED TEXT of each pattern, not to the
// whole file — checking the file globally would mean a single "# example config"
// comment anywhere silently whitelists a real credential further down.
const PLACEHOLDER_HINTS = [
  /EXAMPLE/i,                     // covers AWS's published AKIAIOSFODNN7EXAMPLE
  /<[A-Za-z_]{3,}>/,              // <YOUR_API_KEY_HERE>
  /your[-_ ]?(api[-_ ]?)?(key|token|secret)[-_ ]?here/i,
  /(xxxx+|yyyy+|zzzz+|\*{4,}|\.\.\.)/,
  /(placeholder|changeme|change_me|dummy|fake|sample|redacted|todo|insert[-_ ]?your)/i,
];

const looksLikePlaceholder = (s) => PLACEHOLDER_HINTS.some((re) => re.test(s));

// Anchored to documented credential formats. Each entry is a specific issuer.
const PATTERNS = [
  [/\bAKIA[0-9A-Z]{16}\b/, "AWS Access Key ID"],
  [/\bASIA[0-9A-Z]{16}\b/, "AWS temporary Access Key ID"],
  [/-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/, "private key block"],
  [/\bsk-ant-[A-Za-z0-9_-]{20,}/, "Anthropic API key"],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}\b/, "GitHub token"],
  [/\bgithub_pat_[A-Za-z0-9_]{50,}\b/, "GitHub fine-grained token"],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}/, "Slack token"],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, "Google API key"],
  [/\bSG\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/, "SendGrid API key"],
  [/\b(?:r|s)k_live_[A-Za-z0-9]{20,}\b/, "Stripe live key"],
  [/\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, "JSON Web Token"],
  [
    // A credential-looking assignment: password/secret/api_key/token = "<long literal>".
    // Requires quotes and length to avoid matching `token = next()` or `password: ""`.
    //
    // The lookbehind is (?<![A-Za-z]) rather than \b on purpose: \b would NEVER match
    // DB_PASSWORD or MY_API_KEY, because `_` is a word character so there is no
    // boundary between it and the keyword. That is the single most common way these
    // are actually named, so \b here would miss nearly every real case.
    /(?<![A-Za-z])(?:password|passwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret)\s*[:=]\s*["'][^"'\s]{12,}["']/i,
    "hardcoded credential assignment",
  ],
];

const ENV_FILE = /(?:^|[\\/])\.env(?:\.[A-Za-z0-9_-]+)?$/;

// Values that are plainly configuration rather than credentials. A .env holding
// PORT=3000 is completely ordinary, and blocking it is the kind of false positive
// that gets the whole plugin uninstalled.
//
// Note the deliberate absence of digits from the word branch. An earlier version
// allowed [A-Za-z][A-Za-z0-9 ._-]{0,24}, which matches virtually any alphanumeric
// string up to 25 characters — including the very keys this is meant to catch.
// Values that mix letters and digits are left to the length test below.
const BENIGN_ENV_VALUE =
  /^(?:\d+(?:\.\d+)*|true|false|null|none|localhost|[A-Za-z][A-Za-z._-]*)$/i;

const URL_WITH_CREDENTIALS = /^[a-z][a-z0-9+.-]*:\/\/[^@\s/]+@/i;
const PLAIN_URL = /^[a-z][a-z0-9+.-]*:\/\/\S*$/i;

function isBenignEnvValue(value) {
  if (BENIGN_ENV_VALUE.test(value)) return true;
  // A URL is ordinary configuration — unless it carries userinfo, which is how
  // database passwords most often end up in a .env.
  if (URL_WITH_CREDENTIALS.test(value)) return false;
  if (PLAIN_URL.test(value)) return true;
  return false;
}

// Inside a .env the base rate of secrets is high, so the bar is lower than in
// source: an assigned value that is long AND mixes letters with digits looks far
// more like a key than like configuration.
function envLooksSecret(text) {
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const value = m[2].trim().replace(/^["'](.*)["']$/, "$1").trim();
    if (!value || isBenignEnvValue(value)) continue;
    if (looksLikePlaceholder(value)) continue;
    // A URL carrying userinfo is a credential regardless of length.
    if (URL_WITH_CREDENTIALS.test(value)) return true;
    const opaque = value.length >= 16 && /[A-Za-z]/.test(value) && /\d/.test(value);
    if (opaque) return true;
  }
  return false;
}

async function readStdin() {
  let data = "";
  try {
    for await (const chunk of process.stdin) {
      data += chunk;
      if (data.length > MAX_SCAN_BYTES) break;
    }
  } catch {
    return "";
  }
  return data;
}

const raw = await readStdin();

let payload;
try {
  payload = JSON.parse(raw || "{}");
} catch {
  // Unexpected payload shape. Allow rather than block — see rule 2 above.
  process.exit(0);
}

const input = payload?.tool_input ?? {};
const filePath = String(input.file_path ?? input.path ?? input.notebook_path ?? "");

// Gather every shape a write can take. Reading only `content` silently misses
// Edit (new_string) and MultiEdit (edits[].new_string).
const parts = [input.content, input.new_string];
if (Array.isArray(input.edits)) {
  for (const e of input.edits) parts.push(e?.new_string);
}
const text = parts.filter((p) => typeof p === "string").join("\n").slice(0, MAX_SCAN_BYTES);

const findings = [];

if (ENV_FILE.test(filePath) && envLooksSecret(text)) {
  findings.push("a credential-looking value in a .env file");
}

if (text) {
  for (const [re, label] of PATTERNS) {
    const hit = text.match(re);
    // Judge the matched text itself, not the surrounding file. A doc example and a
    // live credential can sit in the same file, and only one of them should block.
    if (hit && !looksLikePlaceholder(hit[0])) findings.push(label);
  }
}

if (findings.length === 0) process.exit(0);

// Describe the KIND of secret only. stderr is returned to the model and may be
// logged, so echoing the matched value would copy the credential somewhere new —
// the exact opposite of this hook's purpose.
const unique = [...new Set(findings)];
process.stderr.write(
  `[guard-rails] Write BLOCKED${filePath ? ` to "${filePath}"` : ""}.\n` +
    `Detected: ${unique.join("; ")}.\n\n` +
    `What to do:\n` +
    `  - Real credential: move it to an environment variable and reference it by\n` +
    `    name (process.env.MY_KEY, os.environ["MY_KEY"]). Never write the value\n` +
    `    into a file in the repository.\n` +
    `  - Documentation or an example: use an obviously fake placeholder such as\n` +
    `    <YOUR_API_KEY_HERE>. This hook allows those.\n` +
    `  - False positive: tell the user what matched and ask before retrying.\n` +
    `    Do not work around this by renaming the file or splitting the string.\n`
);
process.exit(2);
