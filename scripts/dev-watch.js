const { spawn } = require('child_process');
const fs = require('fs/promises');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const distDir = path.join(repoRoot, 'dist');
const manifest = path.join(repoRoot, 'manifest.json');
const dest = path.join(repoRoot, '..', 'dev-workspace', '.obsidian', 'plugins', 'obsidian-writeaid-plugin');

/**
 * @type {string | number | NodeJS.Timeout | null | undefined}
 */
let timeout = null;
async function copyDist() {
  try {
    await fs.rm(dest, { recursive: true, force: true });
    await fs.mkdir(dest, { recursive: true });
    // copy dist contents if present
    await fs.cp(distDir, dest, { recursive: true });
    // ensure manifest is present at dest
    try {
      await fs.copyFile(manifest, path.join(dest, 'manifest.json'));
    } catch (e) {
      // ignore if manifest doesn't exist
    }
    console.log('[dev-watch] Copied dist ->', dest);
  } catch (e) {
    console.error('[dev-watch] Copy failed', e);
  }
}

function scheduleCopy() {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(() => copyDist().catch(console.error), 400);
}

async function main() {
  if (process.argv.includes('--once')) {
    await copyDist();
    return;
  }

  // spawn webpack in watch mode
  let webpackBin;
  try {
    webpackBin = require.resolve('webpack/bin/webpack.js', { paths: [repoRoot] });
  } catch (e) {
    console.error('[dev-watch] Could not resolve webpack binary. Make sure deps are installed.');
    process.exit(1);
  }

  const child = spawn(process.execPath, [webpackBin, '--mode', 'development', '--watch'], {
    cwd: repoRoot,
    env: process.env,
  });

  child.stdout.on('data', (d) => {
    process.stdout.write(d);
    scheduleCopy();
  });
  child.stderr.on('data', (d) => {
    process.stderr.write(d);
    scheduleCopy();
  });

  child.on('exit', (code) => {
    console.log('[dev-watch] webpack exited', code);
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
