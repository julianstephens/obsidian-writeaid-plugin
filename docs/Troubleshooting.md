# Troubleshooting Guide

Common issues and solutions for the WriteAid plugin.

## Table of Contents

1. [General Issues](#general-issues)
2. [Project Issues](#project-issues)
3. [Draft & Chapter Issues](#draft--chapter-issues)
4. [Backup Issues](#backup-issues)
5. [Word Count Issues](#word-count-issues)
6. [UI/Display Issues](#uidisplay-issues)
7. [Performance Issues](#performance-issues)
8. [Advanced Troubleshooting](#advanced-troubleshooting)

---

## General Issues

### Plugin Not Showing Up

**Problem:** WriteAid doesn't appear in the Community Plugins list

**Solutions:**

1. Ensure you're in an Obsidian vault (not just opening a folder)
2. Go to Settings → Community Plugins
3. Disable "Restricted mode" if enabled
4. Search for "WriteAid" (exact name)
5. Restart Obsidian completely

**If still not found:**

- Clear Obsidian cache: Delete `.obsidian` folder and reopen vault
- Check internet connection (plugin list requires download)
- Try incognito/private browsing to rule out caching issues

---

### Commands Not Appearing

**Problem:** Commands don't show in command palette

**Solutions:**

1. Make sure WriteAid is **enabled** (not just installed)
   - Settings → Community Plugins → Look for "WriteAid"
   - Should show toggle button (should be ON)

2. Reload plugin:
   - Go to Settings → Community Plugins
   - Click reload icon next to WriteAid
   - Or restart Obsidian

3. Check command palette:
   - Press Ctrl+P (or Cmd+P)
   - Type "WriteAid" to see all commands
   - If nothing appears, plugin may not be loaded

---

### "No active project" Error

**Problem:** Most commands show error "No active project"

**Solution:**

1. Open command palette (Ctrl+P)
2. Search for "Select Active Project"
3. Choose a project from the modal
4. Try your command again

**If no projects exist:**

1. Run "Create New Project" command
2. Enter a project name
3. Choose project type
4. Now it's set as active

**If you want to disable this error:**

- Settings → Community Plugins → WriteAid Settings
- Toggle "Auto-Select Project on Startup" to ON
- Plugin will remember last active project

---

### Plugin Conflicts

**Problem:** Other plugins interfering with WriteAid

**Solutions:**

1. Try disabling other file-creation plugins:
   - Templater
   - Folder Note
   - Note Refactor
2. Check for conflicting hotkeys:
   - Settings → Hotkeys
   - Search for conflicting keybinds
   - Reassign custom hotkeys as needed

3. Safe mode test:
   - Obsidian Settings → About
   - Toggle "Restricted mode" ON
   - Disable all community plugins
   - Enable only WriteAid
   - Test the problematic feature
   - If it works, re-enable plugins one by one to find conflict

---

## Project Issues

### Project Not Found After Vault Move

**Problem:** Active project shows "not found" after moving vault

**Solution:**

1. The stored project path is invalid
2. Go to Settings → Community Plugins → WriteAid
3. Change "Active Project" dropdown to your project
4. Run "Update Project Metadata" to refresh

**Prevention:**

- After moving vault, always update active project in settings
- Consider using relative paths (included in next version)

---

### Can't Create New Project

**Problem:** "Create New Project" command doesn't work

**Possible causes:**

1. Insufficient vault permissions
   - Check folder permissions in your file system
   - Ensure vault folder is writable

2. Invalid project name
   - Avoid special characters: `< > : " / \ | ? *`
   - Use letters, numbers, spaces, hyphens, underscores
   - Example good names: `My Novel`, `Story-Draft-1`, `The_Adventure`

3. Folder already exists
   - Project name must be unique
   - Choose a different name

**Solution:**

- Try with a simple test name: `TestProject`
- Check vault folder is writable
- Ensure no same-named folder exists
- Try again

---

### Project Metadata Corrupted

**Problem:** `meta.md` shows errors or invalid data

**Solutions:**

1. **Auto-fix:**
   - Run "Update Project Metadata" command
   - Plugin will regenerate metadata

2. **Manual fix:**
   - Open project's `meta.md` file
   - Check frontmatter for syntax errors:
     - Ensure `---` markers at start and end
     - Check YAML syntax (proper indentation, colons)
     - Example valid frontmatter:
       ```yaml
       ---
       project_name: My Novel
       project_type: multi-file
       total_word_count: 50000
       ---
       ```
   - Save and run "Update Project Metadata"

3. **Rebuild from scratch:**
   - Rename current `meta.md` to `meta.md.backup`
   - Run "Update Project Metadata" command
   - Plugin will create new `meta.md`

---

### Project Panel Not Showing

**Problem:** Project Panel sidebar doesn't appear

**Solutions:**

1. Run "Toggle Project Panel" command
   - This opens/closes the panel view

2. Check if panel is closed:
   - Look for panel icon in right sidebar
   - Click to open WriteAid Project Panel

3. Reset panel:
   - Restart Obsidian
   - Run "Toggle Project Panel" twice (off, then on)

4. Advanced: Check view registry
   - This should only be necessary if panel is corrupted
   - Restart Obsidian (usually fixes automatically)

---

## Draft & Chapter Issues

### Can't Create New Draft

**Problem:** "Create New Draft" shows error or modal hangs

**Solutions:**

1. Ensure active project is set
   - Run "Select Active Project"
   - Choose your project

2. Check project structure:
   - Navigate to project folder
   - Verify `Drafts/` folder exists
   - If missing, create it manually

3. Check file permissions:
   - Ensure `Drafts/` folder is writable
   - Check OS file permissions

4. Try simple draft name:
   - Use plain name: `Draft 2` (not `Draft 2 - Revision A`)
   - Avoid special characters

---

### Draft Name Shows Incorrectly

**Problem:** Draft displays as folder name instead of display name

**Solution:**

1. The draft metadata isn't properly loaded
2. Run "Update Project Metadata" command
3. Metadata should now display correctly

**Prevention:**

- Use consistent draft naming format
- Avoid renaming folders manually (use "Rename Draft" command)

---

### Chapters Not Appearing in Navigation

**Problem:** "Navigate to Next Chapter" doesn't work or skips chapters

**Possible causes:**

1. Chapter `order` fields are wrong
   - Solution: Reorder chapters using Project Panel
   - Or manually fix `order` field in frontmatter

2. Chapters in wrong folder
   - For multi-file projects, chapters must be in draft folder
   - Path: `Drafts/{DraftName}/chapter.md`

3. Missing frontmatter
   - Chapters need YAML frontmatter with `order` field
   - Example:
     ```yaml
     ---
     order: 1
     chapter_name: "Chapter 1"
     ---
     ```

**Solution:**

1. Run "Update Project Metadata" command
2. This validates all chapters and updates frontmatter
3. Try navigation again

---

### Reordering Chapters Doesn't Work

**Problem:** Drag-and-drop in Project Panel doesn't reorder chapters

**Possible causes:**

1. Multi-file project not detected
   - Ensure project type is `multi-file` in `meta.md`
   - Or use "Convert Single to Multi-File" command

2. Permission issues
   - Check folder permissions
   - Ensure WriteAid can modify chapter files

3. Panel not refreshing
   - Try toggling Project Panel off and on
   - Or restart Obsidian

**Solution:**

1. Try manual reordering:
   - Edit chapter frontmatter directly
   - Update `order` field numbers
   - Run "Update Project Metadata" after changes
2. Verify project structure:
   - Ensure chapters have proper frontmatter
   - All should have unique `order` values

---

### Renaming Chapter Fails

**Problem:** "Rename Chapter" command doesn't work

**Solutions:**

1. Ensure multi-file project:
   - Project must be `multi-file` type
   - If it's `single-file`, use "Convert to Multi-File" first

2. Verify active draft is set:
   - Run "Switch Active Draft" command
   - Select the correct draft

3. Check chapter frontmatter:
   - Manually open chapter file
   - Verify frontmatter exists with `chapter_name` field
   - Run "Update Project Metadata" to fix

---

## Backup Issues

### Backup Creation Fails

**Problem:** "Create Backup" command shows error

**Possible causes:**

1. Insufficient disk space
   - Clear some files or external storage
   - Backups require 2× draft size free space

2. Permissions error
   - Check vault folder permissions
   - Ensure `.writeaid-backups` folder is writable

3. Active draft not found
   - Verify active draft exists
   - Check draft folder location: `Drafts/{DraftName}/`

**Solutions:**

1. Check available disk space
   - On Linux: `df -h /path/to/vault`
   - Should have at least 1 GB free

2. Verify draft exists:
   - Navigate to project → Drafts → check your draft folder

3. Try creating simple test draft:
   - Run "Create New Draft" with name "TestDraft"
   - Try backing up test draft
   - If successful, issue is with original draft

4. Check file permissions:
   - If on Linux: `chmod 755 .writeaid-backups`
   - If on Mac: Check System Preferences → Security

---

### Backup Cleanup Dialog Keeps Appearing

**Problem:** Every backup shows "Cleanup needed" prompt

**Cause:** Maximum backups setting is too low for your usage

**Solutions:**

1. **Increase backup limit:**
   - Settings → WriteAid Settings
   - Increase "Maximum Backups Per Draft"
   - Try setting to 10 or higher

2. **Accept and clean up:**
   - Click "Yes" on cleanup prompt
   - Old backups are deleted before new one is created
   - This is normal behavior when limit is exceeded

3. **Check backup frequency:**
   - If creating multiple backups per session, increase limit
   - Example: 5 limit is for ~1 backup/day writers
   - If you backup 5+ times/day, increase to 15-20

---

### Can't Restore Backup

**Problem:** "Restore Backup" command fails or doesn't work

**Solutions:**

1. Verify backups exist:
   - Run "List Backups" command
   - Check if any backups appear
   - If none, none exist yet

2. Check backup location:
   - Backups are in hidden folder: `.writeaid-backups/`
   - May need to enable "Show hidden files" to see
   - Settings → Files and Links → Toggle "Show hidden files"

3. Try test restore:
   - Create a test backup first
   - Immediately try restoring it
   - If this works, issue is with old backups

4. Check disk space:
   - Restore needs 2× backup size free space
   - Run `df -h` (Linux) or check Mac/Windows storage

**Advanced fix:**

- Manually extract backup file
- Navigate to `.writeaid-backups/{ProjectName}/Drafts/{DraftId}/`
- Right-click on `YYYY-MM-DDTHH-MM-SS.zip`
- Extract here
- Copy extracted files to your draft folder

---

### Backup File Corrupted

**Problem:** Backup file shows error when restoring

**Possible causes:**

1. Incomplete backup (interrupt during creation)
2. File system corruption
3. Accidental file modification

**Solutions:**

1. Delete corrupted backup:
   - Navigate to `.writeaid-backups/{ProjectName}/Drafts/{DraftId}/`
   - Delete the problematic `.zip` file
   - Restore from older backup instead

2. Try another backup:
   - Run "List Backups" to see all available
   - Try older backup
   - Work backwards until one restores successfully

3. Manual recovery:
   - Check draft files in the problematic backup folder
   - If compressed in `.zip`, extract with system zip tool
   - Copy extracted files manually to current draft

---

### Backups Taking Too Much Space

**Problem:** `.writeaid-backups` folder is very large

**Solutions:**

1. **Reduce backup count:**
   - Settings → WriteAid Settings
   - Lower "Maximum Backups Per Draft" to 3-5
   - Existing backups won't auto-delete; do manually:

2. **Clear old backups:**
   - Run "Clear Old Backups" command
   - Set "Maximum Backup Age (Days)" to 14 (keeps 2 weeks)
   - Run command again to clean older ones

3. **Manual cleanup:**
   - Navigate to `.writeaid-backups/`
   - Delete oldest `.zip` files manually
   - Keep recent ones

4. **Check file sizes:**
   - Right-click backup file → Properties
   - Large backups suggest lots of images/assets
   - Consider storing assets outside vault

---

## Word Count Issues

### Word Count Not Updating

**Problem:** Status bar shows old word count

**Solutions:**

1. Switch drafts and back:
   - Run "Switch Active Draft"
   - Choose another draft
   - Switch back to original
   - Word count should update

2. Manual refresh:
   - Run "Update Project Metadata" command
   - Forces recalculation of all word counts

3. Check that changes are saved:
   - Make sure files are saved (Ctrl+S)
   - Word count only updates for saved files

---

### Word Count Seems Incorrect

**Problem:** Word count doesn't match actual content

**Possible causes:**

1. Different word count methods (some count syllables, some tokens)
   - WriteAid counts "words" as space-separated tokens
   - This is standard for most writing software

2. Frontmatter is counted
   - YAML frontmatter is included in count
   - This is intentional (metadata is part of file)

3. Multi-file project chapters not all counted
   - Some chapters may not be in draft folder
   - Or chapter frontmatter is missing

**Verify count:**

1. Run "Update Project Metadata" to recalculate
2. Count should be accurate after recalculation
3. If still wrong, check individual chapter frontmatter
4. Ensure all chapters are in draft folder

---

## UI/Display Issues

### Project Panel Not Refreshing

**Problem:** Project Panel shows old structure (deleted files still visible, new files missing)

**Solutions:**

1. Toggle panel:
   - Run "Toggle Project Panel" command (closes it)
   - Run again (reopens it)
   - Structure should refresh

2. Refresh files in Obsidian:
   - Press F5 (or Cmd+R on Mac)
   - Forces Obsidian to reload file tree

3. Increase debounce delay:
   - Settings → WriteAid Settings
   - Increase "Panel Refresh Debounce" to 1000ms
   - This helps if panel is flashing or slow

4. Restart Obsidian:
   - Close and reopen Obsidian
   - Panel will refresh completely

---

### Commands in Command Palette Duplicated

**Problem:** Command appears twice or with weird names

**Cause:** Plugin didn't fully unload/reload

**Solutions:**

1. Reload plugin:
   - Settings → Community Plugins
   - Find WriteAid
   - Click reload icon

2. Restart Obsidian:
   - Fully close and reopen
   - Duplicates should disappear

3. Check extensions folder:
   - In vault: `.obsidian/plugins/obsidian-writeaid-plugin/`
   - Delete `main.js.map` file if corrupted
   - Restart Obsidian

---

### Status Bar Not Showing Project Info

**Problem:** Status bar is empty or doesn't show active project

**Solutions:**

1. Check if status bar is visible:
   - Look at bottom right of editor
   - May be hidden if window is narrow

2. Widen window:
   - If narrow, status bar content is hidden
   - Expand window width

3. Toggle panel to refresh:
   - Run "Toggle Project Panel" command
   - Should trigger status bar update

4. Restart Obsidian:
   - Status bar is cleared on startup
   - Should populate when active project is loaded

---

## Performance Issues

### Plugin Feels Slow or Laggy

**Problem:** Commands take long time to execute, UI feels sluggish

**Possible causes:**

1. Large vault with many files
2. Large projects with many chapters
3. Refresh debounce too low (causing frequent updates)
4. Other plugins using resources

**Solutions:**

1. **Increase debounce delay:**
   - Settings → WriteAid Settings
   - Increase "Panel Refresh Debounce" to 1000ms or higher
   - This reduces update frequency

2. **Split large projects:**
   - For 100+ chapters, consider splitting into multiple projects
   - Or organize by part: `Project - Part 1`, `Project - Part 2`

3. **Disable unnecessary plugins:**
   - Settings → Community Plugins
   - Toggle off plugins you don't use
   - Check which ones are impacting performance

4. **Clear cache:**
   - Navigate to vault folder
   - Delete `.obsidian/cache` folder
   - Restart Obsidian
   - This forces cache rebuild

5. **Monitor system resources:**
   - Check if Obsidian is using excessive RAM/CPU
   - Close other applications to free resources

---

### Backup Creation Takes Long Time

**Problem:** "Create Backup" command is very slow

**Possible causes:**

1. Draft has many large files
2. Slow disk (external storage, network drive)
3. Antivirus scanning files during backup

**Solutions:**

1. Check vault location:
   - If on network drive, back up to local storage
   - Network backups are slow
   - Try moving vault locally

2. Exclude from antivirus:
   - Add vault folder to antivirus exclusions
   - Speeds up file operations significantly

3. Break up large projects:
   - If 50+ MB per draft, split into multiple projects
   - Smaller backups complete faster

4. Manual backup:
   - As alternative, copy draft folder manually
   - Zip the folder manually using OS tools

---

## Advanced Troubleshooting

### Debug Logging

To gather detailed information for support, enable debug logging:

1. **Browser console (if using web Obsidian):**
   - Press F12 to open developer tools
   - Go to Console tab
   - Look for messages starting with "WriteAid:"

2. **Desktop Obsidian (requires code inspection):**
   - Not directly accessible
   - Check `.obsidian/plugins/obsidian-writeaid-plugin/` folder
   - Look for debug output files (if any)

### File Permissions Issues

**On Linux:**

```bash
# Fix folder permissions
chmod 755 ~/.obsidian/plugins/obsidian-writeaid-plugin

# Fix backup folder permissions
chmod 755 .writeaid-backups

# Fix vault permissions
chmod 755 ~/Documents/vault
```

**On Mac:**

- Settings → Security & Privacy → Files and Folders
- Ensure Obsidian has read/write access to vault
- Restart Obsidian after changing permissions

---

### Manually Fix Project Structure

If automated fixes fail, you can manually restore:

1. **Missing meta.md:**

   ```yaml
   ---
   project_name: MyProject
   project_type: multi-file
   date_created: 2025-01-10
   date_updated: 2025-01-15
   total_chapters: 5
   total_word_count: 50000
   ---
   ```

2. **Missing chapter frontmatter:**

   ```yaml
   ---
   id: "unique-id"
   order: 1
   chapter_name: "Chapter Name"
   draft_id: "draft-id"
   ---
   ```

3. **After manual fixes:**
   - Run "Update Project Metadata" command
   - Plugin validates and corrects everything

---

### Getting Help

If you can't resolve the issue:

1. **Check documentation:**
   - [UserGuide.md](UserGuide.md) - General usage
   - [CommandsReference.md](CommandsReference.md) - All commands
   - [ProjectStructureAndSettings.md](ProjectStructureAndSettings.md) - Settings

2. **Report on GitHub:**
   - Go to https://github.com/julianstephens/obsidian-writeaid-plugin/issues
   - Click "New Issue"
   - Include:
     - WriteAid version
     - Obsidian version
     - Your OS (Windows/Mac/Linux)
     - Exact steps to reproduce
     - Error messages (from console if available)

3. **Provide details:**
   - Describe what you expected to happen
   - Describe what actually happened
   - Include screenshots if helpful
   - Attach example project structure if relevant

---

## Known Limitations

### Current Limitations

1. **Single vault only:** Plugin operates on one vault at a time
2. **Relative paths:** Project locations must not move between Obsidian vault upgrades
3. **File size limits:** Very large projects (50+ chapters with images) may perform slowly
4. **Export formats:** Manuscripts export as Markdown only (no PDF/Word support built-in)
5. **Collaboration:** No built-in multi-user sync (use Obsidian Sync or Git)

### Workarounds

1. **Multiple vaults:** Create separate Obsidian vaults for each major project
2. **Export to Word:** Generate Markdown manuscript, then use Pandoc to convert to Word/PDF
3. **Performance:** Archive old projects to separate folders
4. **Sync:** Use Obsidian Sync or Git to sync vault across devices

---

## Still Need Help?

- Consult the main [README.md](../README.md) for overview
- Check the [GitHub Issues](https://github.com/julianstephens/obsidian-writeaid-plugin/issues) for similar problems
- Create a new issue with detailed description
