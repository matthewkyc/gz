#!/usr/bin/env node
// Blocks a commit when a place in the catalog has never been checked for a
// Google Maps photo + reviews. Run by the PreToolUse hook in .claude/settings.json.
// A place counts as checked once its id is in content/_parts/checked-media.json,
// whether a photo/reviews were found or not (not found = orange placeholder).
import fs from "node:fs";
import path from "node:path";

// Only gate `git commit`: the hook passes the Bash call as JSON on stdin.
if (!process.stdin.isTTY) {
  let cmd = "";
  try { cmd = JSON.parse(fs.readFileSync(0, "utf8") || "{}")?.tool_input?.command ?? ""; } catch { /* not hook input */ }
  if (cmd && !/\bgit\s+commit\b/.test(cmd)) process.exit(0);
}

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const PARTS = path.join(ROOT, "content/_parts");
const checkedFile = path.join(PARTS, "checked-media.json");
const checked = fs.existsSync(checkedFile) ? JSON.parse(fs.readFileSync(checkedFile, "utf8")) : {};

const missing = [];
for (const f of fs.readdirSync(PARTS).filter((f) => /^places-.*\.json$/.test(f))) {
  for (const p of JSON.parse(fs.readFileSync(path.join(PARTS, f), "utf8"))) {
    if (!checked[p.id]) missing.push(`${p.id} (${p.name?.zh ?? ""} / ${p.name?.en ?? ""}, ${p.city ?? ""})`);
  }
}

if (missing.length) {
  console.error(
    `Commit blocked: ${missing.length} place(s) have not been checked for a Google Maps photo and reviews:\n` +
    missing.map((m) => `  - ${m}`).join("\n") +
    `\n\nRun the place-media agent (model: haiku) on these ids, then \`npm run content:merge\` and commit again.` +
    `\nIt records every id in content/_parts/checked-media.json, found or not (not found = orange placeholder).`,
  );
  process.exit(2);
}
