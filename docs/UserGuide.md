# WriteAid User Documentation

Welcome to the WriteAid Plugin for Obsidian! This guide will help you get started with organizing and managing your novel writing projects.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Creating Your First Project](#creating-your-first-project)
4. [Managing Drafts](#managing-drafts)
5. [Working with Chapters (Multi-File Projects)](#working-with-chapters-multi-file-projects)
6. [Manuscript Generation](#manuscript-generation)
7. [Backup Management](#backup-management)
8. [Navigation](#navigation)
9. [Settings](#settings)

## Getting Started

### Installation

1. Open Obsidian Settings
2. Go to Community Plugins and search for "WriteAid"
3. Click Install, then Enable
4. The plugin is now ready to use

### First Steps

1. Open the command palette (Ctrl+P / Cmd+P)
2. Search for "Create New Project"
3. Enter your project name (e.g., "My Novel", "The Great Adventure")
4. The plugin will create your project structure automatically

## Project Structure

WriteAid supports two project types:

### Single-File Projects

Best for short stories or novellas. Each draft has one main file.

```
MyProject/
├── meta.md
└── Drafts/
    ├── Draft 1/
    │   └── draft1.md
    └── Draft 2/
        └── draft2.md
```

### Multi-File Projects

Best for novels with multiple chapters. Each chapter is a separate file.

```
MyNovel/
├── meta.md
└── Drafts/
    ├── Draft 1/
    │   ├── chapter1.md
    │   ├── chapter2.md
    │   └── chapter3.md
    └── Draft 2/
        ├── chapter1.md
        ├── chapter2.md
        └── chapter3.md
```

## Creating Your First Project

1. Open the command palette (Ctrl+P / Cmd+P)
2. Search for and run **"Create New Project"**
3. Enter your project name
4. Choose your project type:
   - **Single-File**: One main file per draft (for short stories)
   - **Multi-File**: Multiple chapter files per draft (for novels)
5. The project folder is created with:
   - `meta.md` - Project metadata and statistics
   - `Drafts/Draft 1/` - Your first draft

## Managing Drafts

### Creating a New Draft

1. Make sure you have a project active (use "Select Active Project" command if needed)
2. Open the command palette and search for **"Create New Draft"**
3. Enter the draft name (e.g., "Draft 2", "Revised Version")
4. Choose between creating:
   - **Blank** - Empty draft with outline
   - **Duplicate** - Copy from an existing draft

### Switching Between Drafts

1. Open the command palette and search for **"Switch Active Draft"**
2. Select the draft you want to work on from the modal
3. The active draft is now displayed in the status bar

### Draft Metadata Management

Each draft automatically includes metadata that helps WriteAid track and manage your work.

**Single-File Draft Metadata:**

When you create a single-file draft, WriteAid automatically generates this metadata:

```yaml
---
id: "abc123def456"
draft_name: "Draft 1"
project_id: "proj789"
word_count: 58450
last_updated: 2025-01-15T14:30:45Z
---
```

**What each field does:**

- **`id`** - Unique identifier for this draft (auto-generated on creation)
- **`draft_name`** - Display name of your draft
- **`project_id`** - Links this draft to its parent project
- **`word_count`** - Automatically updated as you edit
- **`last_updated`** - Automatically updated whenever you modify the draft

**Metadata Maintenance:**

- WriteAid **automatically maintains** `word_count` and `last_updated`
- **Don't manually edit** `id` and `project_id` - these should stay fixed
- You **can edit** `draft_name` if you want to rename it (though use the "Rename Draft" command instead)
- **Corrupted metadata?** Run "Update Project Metadata" to repair it

**Backward Compatibility:**

If you have old drafts created before metadata improvements, WriteAid automatically updates them to the new format when you next modify them.

### Creating an Outline

Outlines help you organize your story before diving into writing. WriteAid creates comprehensive outline files with structured sections.

1. Ensure you have an active draft
2. Open the command palette and search for **"Create Outline"**
3. A new `outline.md` file is created in your draft folder with:
   - Frontmatter metadata linking it to your draft
   - Six structured sections for comprehensive planning
   - Template variables automatically filled in

**Outline sections include:**

- **Story Premise** - Central concept and hook
- **Main Plot Points** - Key story beats and structure
- **Character Arcs** - How characters develop and change
- **Key Scenes** - Important moments with chapter references
- **Thematic Elements** - Central themes and motifs
- **Notes** - Pacing, research needs, and TODO items

**Outline metadata:**
The outline file includes frontmatter that links it to your draft:

```yaml
---
draft_id: "draft-abc123def456"
type: "outline"
created: "2025-01-15T14:30:45.123Z"
---
```

This makes outlines machine-readable and trackable across your project.

### Outline Best Practices

**When to create outlines:**

- **Before writing** - Plan your story structure first
- **After first draft** - Identify plot holes and pacing issues
- **Before revisions** - Organize changes and improvements

**Using the outline template:**

1. **Story Premise** - Write 1-2 sentences capturing your core concept
2. **Main Plot Points** - List 5-7 major turning points in order
3. **Character Arcs** - Define starting and ending states for key characters
4. **Key Scenes** - Note memorable moments and where they occur
5. **Thematic Elements** - Identify central themes and supporting motifs
6. **Notes** - Track research needed, pacing concerns, or structural ideas

**Outline customization:**

- **Template variables** - Use `{{draftName}}` in custom templates
- **Metadata control** - Toggle frontmatter generation in settings

---

- **Field selection** - Choose which metadata fields to include
- **Template editing** - Customize the outline structure in settings

**Outline workflow tips:**

- Update outlines as you write to track progress
- Use checkboxes `[ ]` for scenes to mark completion
- Reference chapter numbers in key scenes section
- Keep outlines updated during revisions
- Use outlines to communicate story structure to beta readers

## Working with Chapters (Multi-File Projects)

### Adding Chapters

1. Open the Project Panel (toggle with **"Toggle Project Panel"** command)
2. Navigate to your active draft
3. Right-click on the draft folder and select "Create Chapter"
4. Enter the chapter name (e.g., "Chapter 1", "The Beginning")

### Chapter Metadata

Each chapter file includes frontmatter with:

- `id` - Unique identifier (auto-generated)
- `order` - Chapter sequence number
- `chapter_name` - Display name
- `draft_id` - Links chapter to its draft

Example:

```yaml
---
id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
order: 1
chapter_name: "Chapter 1"
draft_id: "xyz789"
---
```

### Navigating Chapters

1. Open a chapter file
2. Use **"Navigate to Next Chapter"** (Ctrl+Alt+N) to jump to the next chapter
3. Use **"Navigate to Previous Chapter"** (Ctrl+Alt+P) to jump to the previous chapter

### Reordering Chapters

1. In the Project Panel, drag chapters to reorder them
2. The `order` field in each chapter's frontmatter is automatically updated

## Manuscript Generation

Generate a compiled manuscript from your active draft:

1. Ensure you have an active draft
2. Open the command palette and search for **"Generate Manuscript"**
3. A new file is created in the `manuscripts/` folder
4. Multi-file projects: chapters are automatically concatenated with section breaks
5. Single-file projects: your draft file content is compiled

### Manuscript Features

Each generated manuscript includes a professional metadata header with:

- **Project title** - Your project name
- **Draft name** - Which draft version this is
- **Author name** - Configured in plugin settings
- **Generation date** - When the manuscript was created
- **Word count** - Total word count formatted with commas
- **Chapter count** - Number of chapters (or 1 for single-file projects)

### Manuscript Example

**Single-File Project:**

```markdown
# My Project

**Draft:** Draft 1
**Author:** Jane Doe
**Generated:** October 19, 2025 at 3:45 PM
**Word Count:** 25,000
**Chapters:** 1

---

Your draft content here...
```

**Multi-File Project:**

```markdown
# The Great Adventure

**Draft:** Draft 1
**Author:** John Smith
**Generated:** October 19, 2025 at 3:45 PM
**Word Count:** 58,450
**Chapters:** 12

---

## Chapter 1: The Beginning

Chapter 1 content...

---

## Chapter 2: The Journey

Chapter 2 content...

---

## Chapter 3: The Challenge

Chapter 3 content...
```

### Configuring Manuscript Settings

Open plugin settings (Obsidian Settings → Community Plugins → WriteAid):

#### Author Name

1. Go to **Manuscript Settings** section
2. Enter your name in **Author name for manuscripts**
3. This name appears in all generated manuscripts
4. Leave blank for "Unknown Author" default

#### Section Break Style

1. In **Manuscript Settings**, select **Manuscript section break style**
2. Choose from:
   - **Horizontal Rule** (---) - Professional solid lines
   - **Asterisks** (***) - Eye-catching triple asterisks
   - **Dashes** (---) - Alternative dash style

Each style renders the same but may appear different in different markdown editors.

#### Manuscript Filename Template

1. Go to **Manuscript Settings**
2. Set **Manuscript name template**
3. Available variables:
   - `{{draftName}}` - Draft folder name
   - `{{projectName}}` - Project folder name
   - `{{draftSlug}}` - Slugified draft name (removes spaces)
   - Date variables: `{{YYYY-MM-DD}}`, `{{YYYY}}`, `{{MM}}`, `{{DD}}`

**Examples:**

- `{{draftName}}` → `Draft 1.md`
- `{{projectName}} - {{draftName}}` → `MyNovel - Draft 1.md`
- `{{draftSlug}}-{{YYYY-MM-DD}}` → `draft-1-2025-10-19.md`

### Exporting Your Manuscript

Once generated, your manuscript is saved as a Markdown file that you can:

- **Export to PDF** - Use Obsidian's PDF export or external tools
- **Format in Word** - Copy content to Microsoft Word for formatting
- **Send to agents** - Share the manuscript with publishers or agents
- **Self-publish** - Upload to self-publishing platforms
- **Print** - Print directly from Obsidian or other tools

## Backup Management

### Creating Backups

1. Ensure you have an active draft
2. Open the command palette and search for **"Create Backup"**
3. A backup is created and stored automatically
4. If you exceed the backup limit, a confirmation modal appears
5. Confirm to delete old backups and create the new one

### Viewing and Restoring Backups

1. Open the command palette and search for **"List and Restore Backups"**
2. Choose your project from the modal
3. Select a backup to restore
4. The backup contents are restored to your draft folder

### Backup Settings

In the plugin settings, you can configure:

- **Maximum backups per draft** - Number of backups to keep (default: 5)
- **Maximum backup age** - Days to keep backups (default: 30 days)

Old backups are automatically cleaned up on plugin startup.

### Managing Backups Manually

- **Delete Oldest Backup** - Remove the oldest backup for the current draft
- **Clear Old Backups** - Remove all backups older than the retention period

## Navigation

### Project Panel

The Project Panel (toggle via command) shows:

- All projects in your vault
- Drafts within each project
- Chapters within each draft (multi-file projects)

Click to select projects, drafts, or chapters.

### Status Bar

The status bar at the bottom displays:

- Active project name
- Active draft name
- Current word count

### Quick Access to Project Metadata

Open the command palette and search for **"Open Project Meta"** to quickly view and edit your project's `meta.md` file.

## Settings

Access settings via Obsidian Settings → Community Plugins → WriteAid:

### Template Settings

- **Include outline file on draft creation** - Automatically create outline.md for new drafts
- **Include metadata in outline files** - Add YAML frontmatter to outline files
- **Outline metadata fields** - Which metadata fields to include in outlines
- **Outline template** - Custom template for new outline files
- **Chapter template** - Custom template for new chapter files
- **Manuscript name template** - Filename template for generated manuscripts

### Filenames

- **Draft filename slug style** - How draft names convert to filenames
  - `compact` (default): "Draft 1" → `draft1.md`
  - `kebab`: "Draft 1" → `draft-1.md`

### Folders & Files

- **Drafts folder name** - Name of the drafts folder (default: `drafts`)
- **Manuscripts folder name** - Name of the manuscripts folder (default: `manuscripts`)
- **Backups folder name** - Name of the backups folder (default: `.writeaid-backups`)
- **Meta file name** - Name of the project metadata file (default: `meta.md`)
- **Outline file name** - Name of the outline file (default: `outline.md`)

### Word Count Targets

- **Default target word count for multi-file projects** - Target for new novels (default: 50,000)
- **Default target word count for single-file projects** - Target for new stories (default: 20,000)

### Manuscript Settings

- **Author name for manuscripts** - Your name in manuscript headers (default: "Unknown Author")
- **Manuscript name template** - Filename template with variables
- **Manuscript section break style** - Style for breaks between chapters
  - Horizontal Rule (---)
  - Asterisks (***)
  - Dashes (---)
- **Include chapter list in manuscript** - Toggle for future TOC feature

### Backup Settings

- **Maximum backups per draft** - How many backups to keep (default: 5)
- **Maximum backup age (days)** - Retention period in days (default: 30)

### UI & Startup

- **Ribbon placement** - Left or right sidebar (default: left)
- **Always show ribbon** - Always show WriteAid icon (default: off)
- **Auto-open project panel on startup** - Open panel with active project (default: off)
- **Auto-select persisted project on startup** - Auto-select last used project (default: off)
- **Enable WriteAid debug logs** - Show verbose logs in DevTools console (default: off)

### Panel Performance

- **Panel refresh debounce** - Delay before refreshing panels in milliseconds (default: 500ms)

## Tips & Tricks

### Converting Project Types

If you have a single-file project and want to convert it to multi-file:

1. Open the command palette
2. Search for **"Convert Single-File Project to Multi-File"**
3. Chapter files are automatically created from your draft content

### Word Count Tracking

- Word counts are automatically calculated when you:
  - Switch drafts
  - Create new drafts
  - Update project metadata
- View your progress in the status bar

### Template Customization

The plugin uses templates for new files. Edit these in the plugin settings to customize:

- Outline template
- Chapter template
- Draft file template

### Backup Strategy

- Create regular backups before major revisions
- Use the manuscript generation to keep clean copies
- Export your work regularly for external backup

## Troubleshooting

### "No active project" message

1. Open the command palette
2. Search for "Select Active Project"
3. Choose a project from the modal

### Chapter order seems wrong

1. Check the `order` field in each chapter's frontmatter
2. Use the Project Panel to reorder chapters (drag and drop)
3. Run "Update Project Metadata" to refresh

### Backups not created

1. Ensure you have an active draft
2. Check that the `.writeaid-backups` folder is created in your vault
3. Verify your backup settings allow creation (max backups limit)

### Word count not updating

1. Make sure you've switched to the draft you want to count
2. Run "Update Project Metadata" to manually refresh
3. Check that chapter files have proper frontmatter

## Getting Help

For issues or feature requests:

1. Visit the [GitHub Repository](https://github.com/julianstephens/obsidian-writeaid-plugin)
2. Check existing issues
3. Create a new issue with details about your problem

Happy writing! 📝
