// Quality gate: fail if any long-dash character appears in a tracked text file.
// CUTURA style rule: use only the ASCII hyphen-minus (U+002D). The em dash
// U+2014 is explicitly banned everywhere (code, comments, docs, UI copy, commit
// messages, test names, seed data, markdown). We also reject the other long
// dashes so they cannot sneak in. See CLAUDE.md "Non-negotiable style rules".

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// figure dash, en dash, em dash, horizontal bar, minus sign
const BANNED = {
  "‒": "U+2012 figure dash",
  "–": "U+2013 en dash",
  "—": "U+2014 em dash",
  "―": "U+2015 horizontal bar",
  "−": "U+2212 minus sign",
};
const BANNED_RE = /[‒–—―−]/;

// Binary or generated files we never scan.
const SKIP_EXT = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".ico",
  ".svg",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".eot",
  ".pdf",
  ".zip",
  ".gz",
  ".lock",
]);
// The detector itself necessarily contains the banned characters (the lookup
// table and regex), so it is excluded from its own scan.
const SKIP_FILE = new Set(["pnpm-lock.yaml", "package-lock.json", "yarn.lock", "check-dashes.mjs"]);

function trackedFiles() {
  // Tracked plus untracked-but-not-ignored, so new files are checked pre-commit.
  // Static argument array, no shell, no interpolation.
  const out = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    encoding: "utf8",
  });
  return out
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

let violations = 0;
for (const file of trackedFiles()) {
  const dot = file.lastIndexOf(".");
  const ext = dot >= 0 ? file.slice(dot).toLowerCase() : "";
  const base = file.split("/").pop() ?? file;
  if (SKIP_EXT.has(ext) || SKIP_FILE.has(base)) continue;

  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  if (!BANNED_RE.test(content)) continue;

  const lines = content.split("\n");
  lines.forEach((line, i) => {
    for (const ch of line) {
      if (BANNED[ch]) {
        console.error(`${file}:${i + 1}: ${BANNED[ch]} found. Use the ASCII hyphen "-".`);
        violations += 1;
      }
    }
  });
}

if (violations > 0) {
  console.error(`\ncheck:dashes failed with ${violations} long-dash violation(s).`);
  process.exit(1);
}
console.log("check:dashes passed: no long-dash characters in tracked files.");
