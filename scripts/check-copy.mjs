// Quality gate for professional, advice-free, non-keyword-stuffed user-facing
// copy. It scans message catalogs under messages/ (added in the i18n milestone).
// Until catalogs exist this is a no-op that passes. Extend BANNED_PHRASES and the
// scope as UI copy lands. See CLAUDE.md "Non-negotiable style rules".

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const COPY_PREFIXES = ["messages/"]; // user-facing string catalogs

// Phrases that read as hype, fake enthusiasm, or advice. Extend over time.
const BANNED_PHRASES = [];

function trackedCopyFiles() {
  const out = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    encoding: "utf8",
  });
  return out
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((f) => COPY_PREFIXES.some((p) => f.startsWith(p)) && f.endsWith(".json"));
}

let violations = 0;
for (const file of trackedCopyFiles()) {
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const lower = content.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) {
      console.error(`${file}: banned copy phrase "${phrase}".`);
      violations += 1;
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck:copy failed with ${violations} violation(s).`);
  process.exit(1);
}
console.log("check:copy passed.");
