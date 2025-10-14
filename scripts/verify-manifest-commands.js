#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

// CLI debug helper — enable via WRITEAID_DEBUG=1 in the environment.
function debug() {
  try {
    if (process && process.env && process.env.WRITEAID_DEBUG) {
      // eslint-disable-next-line no-console
      console.debug(...Array.from(arguments));
    }
  } catch (e) {}
}

function readManifest() {
  const m = fs.readFileSync(
    path.join(__dirname, "..", "manifest.json"),
    "utf8",
  );
  try {
    return JSON.parse(m);
  } catch (e) {
    // @ts-ignore
    console.error("Failed to parse manifest.json:", e.message);
    process.exit(2);
  }
}

function scanSourceForCommands() {
  const srcDir = path.join(__dirname, "..", "src");
  const files = fs.readdirSync(srcDir).filter((f) => f.endsWith(".ts"));
  const ids = new Set();
  const regex = /id\s*:\s*["'`]([a-zA-Z0-9\-_:]+)["'`]/g;
  for (const file of files) {
    const content = fs.readFileSync(path.join(srcDir, file), "utf8");
    let m;
    while ((m = regex.exec(content))) {
      // look back a little to ensure this id belongs to addCommand block
      const idx = m.index;
      const context = content.slice(Math.max(0, idx - 60), idx + 60);
      if (context.includes("addCommand")) {
        ids.add(m[1]);
      }
    }
  }
  return Array.from(ids).sort();
}

function main() {
  const manifest = readManifest();
  // @ts-ignore
  const manifestIds = (manifest.commands || []).map((c) => c.id).sort();
  const srcIds = scanSourceForCommands();

  let ok = true;
  for (const id of srcIds) {
    if (!manifestIds.includes(id)) {
      console.error(`Missing command in manifest: ${id}`);
      ok = false;
    }
  }

  for (const id of manifestIds) {
    if (!srcIds.includes(id)) {
      console.warn(`Command in manifest not found in source: ${id}`);
    }
  }

  if (!ok) process.exit(1);
  debug("Manifest command verification passed.");
}

main();
