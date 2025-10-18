const { spawn } = require("child_process");
const fs = require("fs/promises");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const distDir = path.join(repoRoot, "dist");
const manifest = path.join(repoRoot, "manifest.json");
const pluginPath = ".obsidian/plugins/obsidian-writeaid-plugin";
const wslDest = path.join(repoRoot, "test-vault", pluginPath);
const windowsDest = path.join("/mnt/c/Users/leahs/Onedrive/Writing/WIP", pluginPath);
const destinations = [wslDest, windowsDest];

/**
 * @type {string | number | NodeJS.Timeout | null | undefined}
 */
let timeout = null;
async function copyDist() {
  for (const dest of destinations) {
    try {
      await fs.rm(dest, { recursive: true, force: true });
      await fs.mkdir(dest, { recursive: true });
      // copy dist contents if present
      await fs.cp(distDir, dest, { recursive: true });
      // ensure manifest is present at dest
      try {
        await fs.copyFile(manifest, path.join(dest, "manifest.json"));
      } catch (e) {
        // ignore if manifest doesn't exist
      }
      // Informational copy output (keep this visible by default)
      console.log("[dev-watch] Copied dist ->", dest);
    } catch (e) {
      console.error("[dev-watch] Copy failed to dest", dest, e);
    }
  }
}

function scheduleCopy() {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(() => copyDist().catch(console.error), 400);
}

async function main() {
  if (process.argv.includes("--once")) {
    await copyDist();
    return;
  }

  // spawn Vite build in watch mode
  // Use the package manager to execute the local Vite binary. Using pnpm exec
  // avoids relying on internal package subpaths that newer Vite versions don't
  // export (which caused ERR_PACKAGE_PATH_NOT_EXPORTED errors).
  const child = spawn("pnpm", ["exec", "vite", "build", "--watch"], {
    cwd: repoRoot,
    env: process.env,
    shell: false,
  });

  child.stdout.on("data", (d) => {
    process.stdout.write(d);
    scheduleCopy();
  });
  child.stderr.on("data", (d) => {
    process.stderr.write(d);
    scheduleCopy();
  });

  child.on("exit", (code) => {
    // Visible informational output when the child exits
    console.log("[dev-watch] vite exited", code);
    process.exit(code || 0);
  });

  // initial copy if dist exists
  try {
    await copyDist();
  } catch (e) {}
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
