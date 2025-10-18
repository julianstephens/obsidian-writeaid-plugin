# Test Mode Guide for Version Bump Script

## Quick Start

Test the version bump script without making any changes:

```bash
npm run bump-version 0.1.3 -- --test
```

## What Test Mode Does

✅ Reads current versions from `package.json` and `manifest.json`  
✅ Retrieves git commit history  
✅ **Generates AI changelog** using Gemini API (if `GEMINI_API_KEY` is set)  
✅ Previews all changes in the console  
❌ **Does NOT** modify any files  
❌ **Does NOT** create git commits  
❌ **Does NOT** create git tags  
❌ **Does NOT** push anything to remote

## Example Output

```
🧪 TEST MODE - Changes will NOT be committed

ℹ Reading current versions...
ℹ Current version: 0.1.2
ℹ New version: 0.1.3
ℹ Retrieving git commits...
ℹ Found 3 commits since last version
ℹ Generating changelog with Gemini API...
✓ Generated changelog with AI
  [TEST] Would update package.json version to 0.1.3
  [TEST] Would update manifest.json version to 0.1.3
ℹ Updating CHANGELOG.md...
  [TEST] Would prepend to CHANGELOG.md:
---
# v0.1.3

- Intelligently generated changelog entry from commits
---
  [TEST] Would stage files for commit
  [TEST] Would create commit: chore: bump version to 0.1.3
  [TEST] Would push changes to remote
  [TEST] Would create annotated tag v0.1.3
  Tag message:
  ---
  Release v0.1.3

  - Intelligently generated changelog entry
  ---
  [TEST] Would push tag v0.1.3 to remote

✓ Version bump complete!
```

## Testing with Gemini API

To test changelog generation with Gemini:

```bash
export GEMINI_API_KEY=your-api-key
npm run bump-version 0.1.3 -- --test
```

To test without Gemini (uses raw commits):

```bash
npm run bump-version 0.1.3 -- --test
```

## Workflow

1. **Create some commits** on your branch
2. **Run test mode** to preview changelog and changes
3. **Review the output** - check if changelog looks good
4. **Run for real** (without `--test`) to create the release
5. **Verify on GitHub** that tag and release were created

## When to Use Test Mode

- ✨ **First time using the script** - see what it does before running for real
- 🤖 **Testing Gemini API integration** - verify AI-generated changelogs
- 🐛 **Debugging** - understand the flow without side effects
- 📋 **Validating git history** - ensure commits are detected correctly
- 👀 **Code review** - let teammates see what the release would look like

## Difference from Production Run

| Action             | Test Mode  | Production |
| ------------------ | ---------- | ---------- |
| Read versions      | ✅         | ✅         |
| Get git history    | ✅         | ✅         |
| Generate changelog | ✅         | ✅         |
| Update files       | 🔍 Preview | ✅ Write   |
| Git commit         | 🔍 Preview | ✅ Create  |
| Git tag            | 🔍 Preview | ✅ Create  |
| Git push           | 🔍 Preview | ✅ Execute |

## Safety

Test mode is **100% safe**:

- No files are modified
- No git history is changed
- No commits are created
- Nothing is pushed to remote
- You can run it unlimited times without consequences

It's perfect for learning and validating before running the real version bump!
