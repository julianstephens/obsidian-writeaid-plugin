#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PACKAGE_JSON_PATH = path.join(__dirname, '../package.json');
const MANIFEST_JSON_PATH = path.join(__dirname, '../manifest.json');
const CHANGELOG_PATH = path.join(__dirname, '../CHANGELOG.md');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message) {
  console.error(`${colors.red}✗ Error: ${message}${colors.reset}`);
  process.exit(1);
}

function success(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function info(message) {
  console.log(`${colors.cyan}ℹ ${message}${colors.reset}`);
}

// Get version from command line argument
const newVersion = process.argv[2];

if (!newVersion) {
  error('Please provide a version in the format: <major>.<minor>.<patch>\nUsage: npm run bump-version 0.1.2');
}

// Validate version format
const versionRegex = /^\d+\.\d+\.\d+$/;
if (!versionRegex.test(newVersion)) {
  error(`Invalid version format: "${newVersion}". Expected format: <major>.<minor>.<patch>`);
}

log(colors.bright, '\n=== WriteAid Version Bump ===\n');

// 1. Read current versions
info('Reading current versions...');
let packageJson;
let manifestJson;

try {
  packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  manifestJson = JSON.parse(fs.readFileSync(MANIFEST_JSON_PATH, 'utf8'));
} catch (err) {
  error(`Failed to read JSON files: ${err.message}`);
}

const oldVersion = packageJson.version;
info(`Current version: ${oldVersion}`);
info(`New version: ${newVersion}`);

if (oldVersion === newVersion) {
  error('New version is the same as current version');
}

// 2. Get git log between versions
info('Retrieving git commits...');
let commits = [];
try {
  const lastTag = `v${oldVersion}`;
  const gitLog = execSync(`git log ${lastTag}..HEAD --oneline`, { encoding: 'utf-8' }).trim();
  
  if (gitLog) {
    commits = gitLog.split('\n').filter(line => line.trim());
  }
} catch (err) {
  info('Note: Could not retrieve git history (tag may not exist)');
}

// 3. Prompt for changelog description if no commits
let changelogDescription = '';
if (commits.length > 0) {
  info(`Found ${commits.length} commits since last version`);
  changelogDescription = commits
    .map(commit => `- ${commit.replace(/^[a-f0-9]+ /, '')}`)
    .join('\n');
} else {
  info('No commits found. Please provide changelog description:');
  changelogDescription = '- Release v' + newVersion;
}

// 4. Update package.json
info('Updating package.json...');
packageJson.version = newVersion;
try {
  fs.writeFileSync(
    PACKAGE_JSON_PATH,
    JSON.stringify(packageJson, null, 2) + '\n',
    'utf8'
  );
  success('Updated package.json');
} catch (err) {
  error(`Failed to update package.json: ${err.message}`);
}

// 5. Update manifest.json
info('Updating manifest.json...');
manifestJson.version = newVersion;
try {
  fs.writeFileSync(
    MANIFEST_JSON_PATH,
    JSON.stringify(manifestJson, null, 2) + '\n',
    'utf8'
  );
  success('Updated manifest.json');
} catch (err) {
  error(`Failed to update manifest.json: ${err.message}`);
}

// 6. Update CHANGELOG.md
info('Updating CHANGELOG.md...');
const changelogEntry = `# v${newVersion}\n\n${changelogDescription}\n\n`;
try {
  const currentChangelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');
  fs.writeFileSync(
    CHANGELOG_PATH,
    changelogEntry + currentChangelog,
    'utf8'
  );
  success('Updated CHANGELOG.md');
} catch (err) {
  error(`Failed to update CHANGELOG.md: ${err.message}`);
}

// 7. Git add files
info('Staging changes for git...');
try {
  execSync(`git add ${PACKAGE_JSON_PATH} ${MANIFEST_JSON_PATH} ${CHANGELOG_PATH}`, { stdio: 'inherit' });
  success('Staged files');
} catch (err) {
  error(`Failed to stage files: ${err.message}`);
}

// 8. Git commit
info('Creating commit...');
const commitMessage = `chore: bump version to ${newVersion}`;
try {
  execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
  success(`Created commit: ${commitMessage}`);
} catch (err) {
  error(`Failed to create commit: ${err.message}`);
}

// 9. Git push
info('Pushing changes to remote...');
try {
  execSync('git push origin', { stdio: 'inherit' });
  success('Pushed changes to remote');
} catch (err) {
  error(`Failed to push changes: ${err.message}`);
}

// 10. Create git tag
info('Creating annotated git tag...');
const tagMessage = `Release v${newVersion}\n\n${changelogDescription}`;
try {
  execSync(`git tag -a v${newVersion} -m "${tagMessage.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`, {
    stdio: 'inherit',
  });
  success(`Created tag v${newVersion}`);
} catch (err) {
  error(`Failed to create tag: ${err.message}`);
}

// 11. Push tag
info('Pushing tag to remote...');
try {
  execSync(`git push origin v${newVersion}`, { stdio: 'inherit' });
  success('Pushed tag to remote');
} catch (err) {
  error(`Failed to push tag: ${err.message}`);
}

log(colors.bright + colors.green, '\n✓ Version bump complete!\n');
info(`Version updated from ${oldVersion} to ${newVersion}`);
log(colors.cyan, 'Next steps:');
console.log(`  1. Review the changes: git show v${newVersion}`);
console.log(`  2. Update package.json version if needed`);
console.log(`  3. Create a release on GitHub\n`);
