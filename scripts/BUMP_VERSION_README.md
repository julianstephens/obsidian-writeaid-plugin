# Version Bump Script

Automated script to bump the WriteAid plugin version and create release tags.

## Usage

```bash
npm run bump-version <major>.<minor>.<patch>
# or
pnpm bump-version <major>.<minor>.<patch>
```

## Example

```bash
npm run bump-version 0.1.2
```

## What It Does

The script performs the following steps:

1. **Validates Version Format** - Ensures the version is in `<major>.<minor>.<patch>` format
2. **Updates package.json** - Sets the new version at line 3
3. **Updates manifest.json** - Sets the new version at line 4
4. **Updates CHANGELOG.md** - Adds a new entry at the top with commits since last version
5. **Git Staging** - Stages the three modified files
6. **Git Commit** - Creates a commit with message "chore: bump version to X.Y.Z"
7. **Git Push** - Pushes the commit to the remote repository
8. **Git Tag** - Creates an annotated git tag with the changelog entry as message
9. **Git Push Tag** - Pushes the new tag to the remote repository

## Features

- **Automatic Commit Detection** - Retrieves commits between the old and new version
- **Version Validation** - Ensures proper semantic versioning format
- **Error Handling** - Clear error messages if anything fails
- **Color Output** - Pretty-printed console output with colors
- **Dry-Run Safe** - You can review changes before pushing

## Requirements

- Git must be configured and available in PATH
- You must be in a git repository
- The previous version must have a git tag (e.g., `v0.1.1`)

## Workflow

Typically, you would:

1. Make your code changes
2. Commit them to your branch
3. Run: `npm run bump-version 0.1.2`
4. Review the output
5. The script will automatically:
   - Update all version files
   - Commit the changes
   - Push to remote
   - Create and push the release tag

## Troubleshooting

**"Could not retrieve git history"**

- This is a warning, not an error
- Occurs if the previous version tag doesn't exist
- The script will still create the version bump with a generic changelog entry

**"Failed to push tag"**

- Ensure you have push permissions to the remote repository
- Check your git configuration and SSH keys
- You can manually push later with: `git push origin v<version>`

**Version already exists**

- If a version hasn't changed, the script will error
- This prevents accidental duplicate versions

## Manual Recovery

If something goes wrong after the tag is created, you can:

```bash
# Delete the local tag
git tag -d v0.1.2

# Delete the remote tag
git push origin --delete v0.1.2

# Fix the files and try again
npm run bump-version 0.1.2
```

## Notes

- The script automatically stages, commits, and pushes all changes
- Commits use the message: `chore: bump version to X.Y.Z`
- Tags are automatically pushed to keep versions in sync across environments
- Changes are committed to the current branch before tagging
