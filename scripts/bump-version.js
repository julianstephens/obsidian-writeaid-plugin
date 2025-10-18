#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const https = require("https");

// Configuration
const PACKAGE_JSON_PATH = path.join(__dirname, "../package.json");
const MANIFEST_JSON_PATH = path.join(__dirname, "../manifest.json");
const CHANGELOG_PATH = path.join(__dirname, "../CHANGELOG.md");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
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

// Gemini API helper
async function generateChangelogWithGemini(commits) {
  if (!GEMINI_API_KEY) {
    info("GEMINI_API_KEY not set, using raw commit messages");
    return commits
      .map((commit) => `- ${commit.replace(/^[a-f0-9]+ /, "")}`)
      .join("\n");
  }

  const commitMessages = commits
    .map((commit) => commit.replace(/^[a-f0-9]+ /, ""))
    .join("\n");

  const prompt = `You are a helpful assistant that summarizes git commits for changelog entries.

Given the following git commit messages, generate a concise CHANGELOG entry with a bulleted list of features, fixes, and enhancements.

Format the output as a bulleted list with full sentences describing what was changed.
Each line should start with "- " and describe the change in a user-friendly way.
Group related items together (features, fixes, enhancements, etc).
Keep descriptions concise but informative.

Git commits:
${commitMessages}

Generate the changelog entries:`;

  try {
    info("Generating changelog with Gemini API...");
    const response = await callGeminiAPI(prompt);
    success("Generated changelog with AI");
    return response;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    info(`Failed to generate changelog with Gemini: ${errMsg}, using raw commits`);
    return commits
      .map((commit) => `- ${commit.replace(/^[a-f0-9]+ /, "")}`)
      .join("\n");
  }
}

async function callGeminiAPI(prompt) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    });

    const options = {
      hostname: "generativelanguage.googleapis.com",
      path: `/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          if (res.statusCode === 200) {
            const parsed = JSON.parse(data);
            const content = parsed.candidates[0].content.parts[0].text;
            resolve(content);
          } else {
            reject(new Error(`API returned status ${res.statusCode}: ${data}`));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

// Get version from command line argument
const newVersion = process.argv[2];
const testMode = process.argv.includes("--test") || process.argv.includes("-t");

if (!newVersion) {
  error(
    "Please provide a version in the format: <major>.<minor>.<patch>\nUsage: npm run bump-version 0.1.2\n\nOptions:\n  --test, -t    Test mode (simulate without modifying files or creating commits)"
  );
}

// Validate version format
const versionRegex = /^\d+\.\d+\.\d+$/;
if (!versionRegex.test(newVersion)) {
  error(`Invalid version format: "${newVersion}". Expected format: <major>.<minor>.<patch>`);
}

log(colors.bright, "\n=== WriteAid Version Bump ===\n");
if (testMode) {
  log(colors.yellow, "🧪 TEST MODE - Changes will NOT be committed\n");
}

// Start async main function
(async () => {
  try {
    // 1. Read current versions
    info("Reading current versions...");
    let packageJson;
    let manifestJson;

    try {
      packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf8"));
      manifestJson = JSON.parse(fs.readFileSync(MANIFEST_JSON_PATH, "utf8"));
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      error(`Failed to read JSON files: ${errMsg}`);
    }

    const oldVersion = packageJson.version;
    info(`Current version: ${oldVersion}`);
    info(`New version: ${newVersion}`);

    if (oldVersion === newVersion) {
      error("New version is the same as current version");
    }

    // 2. Get git log between versions
    info("Retrieving git commits...");
    let commits = [];
    try {
      const lastTag = `v${oldVersion}`;
      const gitLog = execSync(`git log ${lastTag}..HEAD --oneline`, { encoding: "utf-8" }).trim();

      if (gitLog) {
        commits = gitLog.split("\n").filter((line) => line.trim());
      }
    } catch (err) {
      info("Note: Could not retrieve git history (tag may not exist)");
    }

    // 3. Generate changelog description using Gemini API
    let changelogDescription = "";
    if (commits.length > 0) {
      info(`Found ${commits.length} commits since last version`);
      changelogDescription = await generateChangelogWithGemini(commits);
    } else {
      info("No commits found.");
      changelogDescription = "- Release v" + newVersion;
    }

    // 4. Update package.json
    info("Updating package.json...");
    packageJson.version = newVersion;
    if (!testMode) {
      try {
        fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2) + "\n", "utf8");
        success("Updated package.json");
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        error(`Failed to update package.json: ${errMsg}`);
      }
    } else {
      log(colors.cyan, "  [TEST] Would update package.json version to " + newVersion);
    }

    // 5. Update manifest.json
    info("Updating manifest.json...");
    manifestJson.version = newVersion;
    if (!testMode) {
      try {
        fs.writeFileSync(MANIFEST_JSON_PATH, JSON.stringify(manifestJson, null, 2) + "\n", "utf8");
        success("Updated manifest.json");
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        error(`Failed to update manifest.json: ${errMsg}`);
      }
    } else {
      log(colors.cyan, "  [TEST] Would update manifest.json version to " + newVersion);
    }

    // 6. Update CHANGELOG.md
    info("Updating CHANGELOG.md...");
    const changelogEntry = `# v${newVersion}\n\n${changelogDescription}\n\n`;
    if (!testMode) {
      try {
        const currentChangelog = fs.readFileSync(CHANGELOG_PATH, "utf8");
        fs.writeFileSync(CHANGELOG_PATH, changelogEntry + currentChangelog, "utf8");
        success("Updated CHANGELOG.md");
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        error(`Failed to update CHANGELOG.md: ${errMsg}`);
      }
    } else {
      log(colors.cyan, "  [TEST] Would prepend to CHANGELOG.md:");
      console.log("---");
      console.log(changelogEntry);
      console.log("---");
    }

    // 7. Git add files
    info("Staging changes for git...");
    if (!testMode) {
      try {
        execSync(`git add ${PACKAGE_JSON_PATH} ${MANIFEST_JSON_PATH} ${CHANGELOG_PATH}`, {
          stdio: "inherit",
        });
        success("Staged files");
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        error(`Failed to stage files: ${errMsg}`);
      }
    } else {
      log(colors.cyan, "  [TEST] Would stage files for commit");
    }

    // 8. Git commit
    info("Creating commit...");
    const commitMessage = `chore: bump version to ${newVersion}`;
    if (!testMode) {
      try {
        execSync(`git commit -m "${commitMessage}"`, { stdio: "inherit" });
        success(`Created commit: ${commitMessage}`);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        error(`Failed to create commit: ${errMsg}`);
      }
    } else {
      log(colors.cyan, "  [TEST] Would create commit: " + commitMessage);
    }

    // 9. Git push
    info("Pushing changes to remote...");
    if (!testMode) {
      try {
        execSync("git push origin", { stdio: "inherit" });
        success("Pushed changes to remote");
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        error(`Failed to push changes: ${errMsg}`);
      }
    } else {
      log(colors.cyan, "  [TEST] Would push changes to remote");
    }

    // 10. Create git tag
    info("Creating annotated git tag...");
    const tagMessage = `Release v${newVersion}\n\n${changelogDescription}`;
    if (!testMode) {
      try {
        // Check if tag or branch already exists with this name
        try {
          execSync(`git rev-parse v${newVersion}`, { stdio: "ignore" });
          info(`Reference v${newVersion} already exists locally, deleting and recreating...`);
          // Try to delete as tag first
          try {
            execSync(`git tag -d v${newVersion}`, { stdio: "ignore" });
          } catch (e) {
            // If tag delete fails, try as branch
            try {
              execSync(`git branch -d v${newVersion}`, { stdio: "ignore" });
            } catch (e2) {
              // Neither worked, continue anyway
            }
          }
        } catch (e) {
          // Reference doesn't exist, continue
        }
        execSync(
          `git tag -a v${newVersion} -m "${tagMessage.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`,
          {
            stdio: "inherit",
          },
        );
        success(`Created tag v${newVersion}`);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        error(`Failed to create tag: ${errMsg}`);
      }
    } else {
      log(colors.cyan, "  [TEST] Would create annotated tag v" + newVersion);
      console.log("  Tag message:");
      console.log("  ---");
      console.log(tagMessage.split("\n").map((line) => "  " + line).join("\n"));
      console.log("  ---");
    }

    // 11. Push tag
    info("Pushing tag to remote...");
    if (!testMode) {
      try {
        execSync(`git push origin v${newVersion} --force-with-lease`, { stdio: "inherit" });
        success("Pushed tag to remote");
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        error(`Failed to push tag: ${errMsg}`);
      }
    } else {
      log(colors.cyan, "  [TEST] Would push tag v" + newVersion + " to remote");
    }

    log(colors.bright + colors.green, "\n✓ Version bump complete!\n");
    info(`Version updated from ${oldVersion} to ${newVersion}`);
    log(colors.cyan, "Next steps:");
    console.log(`  1. Review the changes: git show v${newVersion}`);
    console.log(`  2. Update package.json version if needed`);
    console.log(`  3. Create a release on GitHub\n`);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    error(`Unexpected error: ${errMsg}`);
  }
})();
