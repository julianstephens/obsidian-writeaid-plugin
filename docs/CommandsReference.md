# Commands Reference

This guide provides detailed information about all available WriteAid commands.

## Command Categories

### Project Management

#### Create New Project

- **Command ID:** `create-new-project`
- **Hotkey:** None (use command palette)
- **Description:** Create a new novel/writing project
- **Requirements:** None
- **What it does:**
  1. Prompts you to enter a project name
  2. Asks you to choose project type (single-file or multi-file)
  3. Creates project folder structure with initial draft
  4. Sets the new project as active

**Example:**

- Project name: `The Great Adventure`
- Type: `Multi-File`
- Result: Creates `/The Great Adventure/` with `Drafts/Draft 1/` folder

---

#### Select Active Project

- **Command ID:** `select-active-project`
- **Hotkey:** None
- **Description:** Switch between your projects
- **Requirements:** At least one project exists
- **What it does:**
  1. Opens a modal showing all projects in your vault
  2. Click to select a project
  3. Sets it as the active project for other commands

**Tip:** The active project is shown in the status bar at the bottom of the editor

---

#### Update Project Metadata

- **Command ID:** `update-project-metadata`
- **Hotkey:** None
- **Description:** Refresh project statistics and metadata
- **Requirements:** Active project selected
- **What it does:**
  1. Recalculates word counts for all drafts
  2. Updates chapter counts
  3. Updates `meta.md` with latest statistics
  4. Refreshes the Project Panel

**When to use:** After manually editing files outside of WriteAid

---

#### Open Project Meta

- **Command ID:** `open-project-meta`
- **Hotkey:** None
- **Description:** Open the active project's metadata file
- **Requirements:** Active project selected
- **What it does:**
  1. Opens the project's `meta.md` file in the editor
  2. Shows project statistics and configuration
  3. Allows direct editing of project metadata

**Meta file contains:**

```yaml
project_name: Your Project
description: Optional project description
total_chapters: 5
total_word_count: 45000
date_created: 2024-01-15
drafts:
  - Draft 1: 45000 words
```

---

#### Toggle Project Panel

- **Command ID:** `toggle-project-panel`
- **Hotkey:** None
- **Description:** Show/hide the Project Panel sidebar
- **Requirements:** None
- **What it does:**
  1. Opens or closes the Project Panel view
  2. The panel shows your project structure
  3. Click items to navigate or select them

---

#### Convert Single-File Project to Multi-File

- **Command ID:** `convert-single-to-multi-file-project`
- **Hotkey:** None
- **Description:** Transform a single-file project into a multi-file project
- **Requirements:** Active project must be single-file type
- **What it does:**
  1. Splits your draft content into multiple chapter files
  2. Creates chapter files from Markdown headings
  3. Moves chapters into organized folder structure
  4. Updates project metadata

**Warning:** This operation cannot be undone. Create a backup first!

---

### Draft Management

#### Create New Draft

- **Command ID:** `create-new-draft`
- **Hotkey:** None
- **Description:** Add a new draft version to your project
- **Requirements:** Active project selected
- **Options:**
  1. **Enter draft name:** Name your new draft (e.g., "Draft 2", "Revised Version")
  2. **Choose source:**
     - **Blank:** Create empty draft with outline template
     - **Duplicate:** Copy from existing draft

**What it creates:**

- For single-file projects: `Drafts/{DraftName}/draft.md`
- For multi-file projects: `Drafts/{DraftName}/` with outline

---

#### Switch Active Draft

- **Command ID:** `switch-active-draft`
- **Hotkey:** None
- **Description:** Change which draft you're working on
- **Requirements:** Active project with multiple drafts
- **What it does:**
  1. Opens modal showing all drafts in active project
  2. Click to select a draft
  3. Updates active draft (shown in status bar)
  4. Triggers word count calculation

---

#### Initialize Draft File

- **Command ID:** `initialize-draft-file`
- **Hotkey:** None
- **Description:** Set up a new draft file with proper structure
- **Requirements:** Active draft selected
- **What it does:**
  1. Creates or resets the main draft file
  2. Adds frontmatter with metadata
  3. Applies template formatting

---

#### Create New Draft (Rename Modal)

- **Command ID:** `create-new-draft` (with modal)
- **Hotkey:** None
- **Description:** Create draft with custom naming
- **Requirements:** Active project
- **How it differs:** Uses a detailed modal with naming options

---

#### Rename Draft

- **Command ID:** `rename-draft`
- **Hotkey:** None
- **Description:** Change a draft's name
- **Requirements:** Active project with drafts
- **What it does:**
  1. Shows modal to select which draft to rename
  2. Prompts for new name
  3. Updates folder name and references

**Note:** Draft history (backups) is preserved

---

#### Duplicate Draft

- **Command ID:** `duplicate-draft`
- **Hotkey:** None
- **Description:** Create a copy of an existing draft
- **Requirements:** Active project with at least one draft
- **What it does:**
  1. Copies all files from selected draft
  2. Creates new draft with "-copy" suffix
  3. Maintains all chapter structure

---

---

### Outline & Manuscript

#### Create Outline

- **Command ID:** `create-outline`
- **Hotkey:** None
- **Description:** Generate an outline file for your draft
- **Requirements:** Active draft selected
- **What it does:**
  1. Creates `outline.md` in the draft folder
  2. Adds outline template with structure prompts
  3. For multi-file projects: auto-populates with chapter list

**Template includes sections for:**

- Story premise
- Main plot points
- Character arcs
- Key scenes

---

#### Generate Manuscript

- **Command ID:** `generate-manuscript`
- **Hotkey:** None
- **Description:** Create a compiled manuscript from your draft
- **Requirements:** Active draft selected
- **What it does:**

**For single-file projects:**

1. Copies the main draft file
2. Saves to `manuscripts/{DraftName}.md`

**For multi-file projects:**

1. Concatenates all chapters in order
2. Adds section breaks between chapters
3. Creates single file in `manuscripts/{DraftName}.md`
4. Includes title page with metadata

**Output file includes:**

- Story title and author
- All content in reading order
- Chapter headings
- Proper formatting for export

---

### Chapter Management (Multi-File Projects)

#### Navigate to Next Chapter

- **Command ID:** `navigate-next-chapter`
- **Hotkey:** `Ctrl+Alt+N` (Windows/Linux) or `Cmd+Alt+N` (Mac)
- **Description:** Jump to the next chapter in your draft
- **Requirements:** Multi-file project with multiple chapters
- **What it does:**
  1. Reads current chapter's `order` number
  2. Finds next chapter with `order + 1`
  3. Opens that chapter file

---

#### Navigate to Previous Chapter

- **Command ID:** `navigate-previous-chapter`
- **Hotkey:** `Ctrl+Alt+P` (Windows/Linux) or `Cmd+Alt+P` (Mac)
- **Description:** Jump to the previous chapter
- **Requirements:** Multi-file project with multiple chapters
- **What it does:**
  1. Reads current chapter's `order` number
  2. Finds chapter with `order - 1`
  3. Opens that chapter file

---

#### Rename Chapter

- **Command ID:** `rename-chapter`
- **Hotkey:** None
- **Description:** Change a chapter's name
- **Requirements:** Multi-file project with active draft
- **What it does:**
  1. Shows chapter selection modal
  2. Prompts for new chapter name
  3. Updates chapter `chapter_name` in frontmatter
  4. Refreshes Project Panel

---

---

### Backup & Recovery

#### Create Backup

- **Command ID:** `create-backup`
- **Hotkey:** None
- **Description:** Save a backup of your active draft
- **Requirements:** Active draft selected
- **What it does:**
  1. Creates timestamped `.zip` file of draft folder
  2. Stores in `.writeaid-backups/` folder
  3. Shows notification with backup info
  4. If max backups exceeded:
     - Shows confirmation modal
     - Deletes oldest backup if confirmed
     - Then creates new backup

**Backup naming:** `YYYY-MM-DDTHH-MM-SS.zip` (e.g., `2025-01-15T14-30-45.zip`)

**Backup storage:**

```
.writeaid-backups/
├── ProjectName/
│   └── Drafts/
│       └── DraftId/
│           ├── 2025-01-15T14-30-45.zip
│           ├── 2025-01-14T10-15-20.zip
│           └── ...
```

---

#### List and Restore Backups

- **Command ID:** `restore-backup`
- **Hotkey:** None
- **Description:** View and restore from a backup
- **Requirements:** At least one backup exists
- **What it does:**
  1. Shows project selection modal
  2. Shows list of available backups with timestamps
  3. Click to restore
  4. Extracted backup files overwrite current draft
  5. Shows confirmation that backup was restored

---

#### Delete Backup

- **Command ID:** `delete-backup`
- **Hotkey:** None
- **Description:** Manually remove a specific backup
- **Requirements:** At least one backup exists
- **What it does:**
  1. Shows project selection modal
  2. Shows list of backups
  3. Click to delete
  4. Confirms deletion and removes backup file

---

#### List Backups

- **Command ID:** `list-backups`
- **Hotkey:** None
- **Description:** View all backups for your projects
- **Requirements:** At least one backup exists
- **What it does:**
  1. Shows project selection modal
  2. Lists all backups with timestamps and sizes
  3. Information only (view, don't restore)

---

#### Clear Old Backups

- **Command ID:** `clear-old-backups`
- **Hotkey:** None
- **Description:** Remove backups exceeding age limit
- **Requirements:** `Maximum backup age` setting configured
- **What it does:**
  1. Calculates age of all backups
  2. Compares against `Maximum backup age (days)` setting
  3. Deletes backups older than threshold
  4. Shows count of deleted backups

**Example:** If age limit is 30 days, backups older than 30 days are deleted

---

## Command Access

### Method 1: Command Palette

1. Press `Ctrl+P` (Windows/Linux) or `Cmd+P` (Mac)
2. Type command name (e.g., "Create New Project")
3. Press Enter

### Method 2: Custom Hotkeys

Some commands have default hotkeys:

- **Navigate Next Chapter:** `Ctrl+Alt+N`
- **Navigate Previous Chapter:** `Ctrl+Alt+P`

You can add custom hotkeys in Obsidian Settings → Hotkeys

### Method 3: Project Panel

Click items in the Project Panel to:

- Select active project
- Switch active draft
- Open chapter files

---

## Command Workflow Examples

### Creating Your First Novel

1. **"Create New Project"**
   - Name: `My Novel`
   - Type: `Multi-File`

2. **"Create New Draft"** (automatically in Draft 1)
   - Creates `Drafts/Draft 1/`

3. **"Create Outline"** (optional)
   - Plans out your story

4. **Toggle Project Panel**
   - See your project structure

5. **Add chapters** (via Project Panel right-click)
   - Or manually create chapter files

6. **"Create Backup"** (before major editing)
   - Saves current state

7. **"Generate Manuscript"**
   - Creates final compiled version

### Iterating on Drafts

1. **"Create New Draft"** with `Duplicate` option
   - Copies Draft 1 to Draft 2

2. **"Switch Active Draft"**
   - Choose Draft 2

3. Edit chapters...

4. **"Create Backup"** (periodically)
   - Saves progress

5. **"Generate Manuscript"**
   - Creates final version for Draft 2

### Recovering from Mistakes

1. **"List and Restore Backups"**
   - Choose your project
   - Select a recent backup
   - Files are restored to current state

2. Continue editing with recovered content

---

## Tips

- **Use meaningful backup moments:** Create backups before major revisions or at daily endpoints
- **Keep outlines updated:** Use "Create Outline" early to organize your thoughts
- **Organize chapters:** Use clear naming like "Chapter 1 - The Beginning"
- **Monitor word count:** Check status bar for progress tracking
- **Regular metadata updates:** Run "Update Project Metadata" if editing outside WriteAid
