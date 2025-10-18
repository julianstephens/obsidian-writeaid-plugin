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

### Creating an Outline

1. Ensure you have an active draft
2. Open the command palette and search for **"Create Outline"**
3. A new `outline.md` file is created in your draft folder

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
4. Multi-file projects: chapters are automatically concatenated with section headings
5. Single-file projects: your draft file content is used

The manuscript is ready for export or formatting!

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

### Project Settings

- **Active Project** - Currently selected project
- **Slug Style** - How draft names are converted to filenames
  - `compact` (default): "Draft 1" → `draft1.md`
  - `kebab`: "Draft 1" → `draft-1.md`

### Backup Settings

- **Maximum backups per draft** - How many backups to keep (default: 5)
- **Maximum backup age (days)** - Retention period in days (default: 30)

### UI Settings

- **Panel refresh debounce** - Delay before refreshing panels (milliseconds)

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
