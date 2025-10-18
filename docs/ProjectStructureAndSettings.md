# Project Structure & Settings Guide

This guide explains the folder structure, metadata format, and configuration options in WriteAid.

## Folder Structure Overview

### Basic Layout

Every WriteAid project follows this structure:

```
MyProject/
├── meta.md                          # Project metadata (auto-maintained)
├── Drafts/
│   ├── Draft 1/
│   │   ├── draft.md                 # Main file (single-file projects)
│   │   ├── chapter1.md              # Chapters (multi-file projects)
│   │   ├── chapter2.md
│   │   └── outline.md               # Optional outline
│   └── Draft 2/
│       ├── draft.md
│       └── outline.md
└── manuscripts/
    ├── Draft 1.md                   # Generated manuscripts
    └── Draft 2.md
```

### Hidden Backup Folder

Backups are stored in a hidden folder at the vault root:

```
.writeaid-backups/
├── MyProject/
│   └── Drafts/
│       ├── draft-1-uuid/
│       │   ├── 2025-01-15T14-30-45.zip
│       │   ├── 2025-01-14T10-15-20.zip
│       │   └── 2025-01-13T09-00-00.zip
│       └── draft-2-uuid/
│           └── 2025-01-15T14-35-00.zip
```

**Note:** This folder is typically hidden in Obsidian's file explorer. Use "Show hidden files" setting to view it.

---

## File Formats

### Project Metadata (meta.md)

Located at the root of your project folder. Auto-generated and maintained by WriteAid.

**Example:**

```yaml
---
project_name: The Great Adventure
project_type: multi-file
description: An epic fantasy novel
date_created: 2025-01-10
date_updated: 2025-01-15
total_chapters: 12
total_word_count: 58450
---
# Project Metadata

## Drafts Overview

### Draft 1
- Status: In Progress
- Word Count: 58,450
- Chapters: 12
- Last Updated: 2025-01-15

### Draft 2
- Status: Planning
- Word Count: 0
- Chapters: 0
- Last Updated: 2025-01-10

## Statistics

- Total Drafts: 2
- Average Draft Length: 29,225 words
- Most Recent Update: 2025-01-15 14:30:45
```

**Frontmatter Fields:**

- `project_name` (string): Your project name
- `project_type` (string): Either `single-file` or `multi-file`
- `description` (string, optional): Project description
- `date_created` (date): When project was created
- `date_updated` (date): Last modification time
- `total_chapters` (number): Count of chapters (multi-file only)
- `total_word_count` (number): Sum of all draft words

**Note:** These fields are automatically maintained. Manual edits may be overwritten.

---

### Draft Files

#### Single-File Project Draft

For single-file projects, the main draft file is `draft.md`:

```yaml
---
id: "abc123def456"
draft_name: "Draft 1"
project_id: "proj789"
word_count: 58450
last_updated: 2025-01-15T14:30:45Z
---

# Draft 1

Your story content goes here...

## Chapter 1: The Beginning

Once upon a time...
```

**Frontmatter Fields:**

- `id` (UUID): Unique identifier for this draft
- `draft_name` (string): Display name
- `project_id` (UUID): Links to parent project
- `word_count` (number): Auto-calculated
- `last_updated` (ISO 8601 timestamp): Auto-updated

---

#### Multi-File Project Chapters

Each chapter is a separate file with frontmatter:

```yaml
---
id: "ch001-uuid"
order: 1
chapter_name: "Chapter 1: The Beginning"
draft_id: "draft-uuid"
word_count: 4567
last_updated: 2025-01-15T14:30:45Z
---
# Chapter 1: The Beginning

Your chapter content...
```

**Frontmatter Fields:**

- `id` (UUID): Unique chapter identifier
- `order` (number): Chapter sequence (used for navigation)
- `chapter_name` (string): Display name
- `draft_id` (UUID): Links to parent draft
- `word_count` (number): Auto-calculated
- `last_updated` (ISO 8601 timestamp): Auto-updated

**Ordering:** Chapters are sorted by `order` value for navigation and manuscript generation.

---

### Outline File (outline.md)

Optional file for planning and organizing your draft:

```yaml
---
draft_id: "draft-uuid"
type: "outline"
---

# Outline for Draft 1

## Story Premise

The hero must save the kingdom from darkness.

## Main Plot Points

1. Hero discovers mysterious artifact
2. Hero learns of threat
3. Hero gathers companions
4. Hero faces trials
5. Final confrontation
6. Resolution

## Character Arcs

### Hero
- Starts as: Reluctant farm boy
- Ends as: Legendary warrior
- Key scenes: Discovery, Training, Sacrifice

### Mentor
- Starts as: Mysterious wanderer
- Ends as: Fallen guide
- Key scenes: Meeting, Teaching, Betrayal

## Key Scenes

- [ ] Market meeting (Chapter 1)
- [ ] Training montage (Chapter 4)
- [ ] Betrayal reveal (Chapter 8)
- [ ] Final battle (Chapter 12)

## Notes

- Consider adding romance subplot
- Flesh out antagonist motivations
- Plan pacing for Act 2
```

---

### Manuscript Files (manuscripts/)

Auto-generated compiled versions of your drafts.

**Single-File Project:**
Simply a copy of the draft file.

**Multi-File Project:**
All chapters concatenated with structure:

```markdown
# The Great Adventure

**Author:** [Your Name]
**Draft:** Draft 1
**Date Generated:** 2025-01-15
**Word Count:** 58,450
**Chapters:** 12

---

# Chapter 1: The Beginning

[Chapter 1 content...]

---

# Chapter 2: The Journey

[Chapter 2 content...]

---

# Chapter 3: The Challenge

[Chapter 3 content...]

...

---

# Chapter 12: The Resolution

[Chapter 12 content...]
```

**Generation Details:**

- Generated at: `manuscripts/{DraftName}.md`
- Includes: Title page, all chapters in order, section breaks
- Format: Standard Markdown for export compatibility
- Overwrites: Previous manuscript with same name

---

## Plugin Settings

Access WriteAid settings via Obsidian Settings → Community Plugins → WriteAid.

### Project Settings

#### Active Project

- **Type:** Dropdown selector
- **Description:** Currently active project (used by most commands)
- **Default:** None (must select)
- **How to change:** Use "Select Active Project" command or change here

#### Project Slug Style

- **Type:** Dropdown (`compact` or `kebab`)
- **Description:** How draft names convert to folder names
- **Examples:**
  - `compact`: "Draft 1" → `draft1/`
  - `kebab`: "Draft 1" → `draft-1/`
- **Default:** `compact`
- **Note:** Only applies to new drafts; existing folders unaffected

---

### Backup Settings

#### Maximum Backups Per Draft

- **Type:** Number (0-50)
- **Description:** How many backup versions to keep per draft
- **Default:** 5
- **When used:**
  - Creating a backup triggers cleanup if exceeded
  - Oldest backups deleted first
  - Set to 0 to disable backup limits
- **Example:** With max=5, keeping 6th backup deletes the oldest

#### Maximum Backup Age (Days)

- **Type:** Number (1-365)
- **Description:** How long to keep backups (days)
- **Default:** 30
- **When used:**
  - "Clear Old Backups" command
  - Automatic cleanup on plugin startup
- **Example:** With max_age=30, backups older than 30 days are deleted

---

### UI Settings

#### Panel Refresh Debounce

- **Type:** Number (milliseconds)
- **Description:** Delay before refreshing Project Panel after file changes
- **Default:** 500ms
- **When used:** After creating/deleting chapters or switching drafts
- **Tip:** Increase if experiencing lag; decrease for faster updates

#### Auto-Select Project on Startup

- **Type:** Toggle (on/off)
- **Description:** Automatically activate last used project on plugin startup
- **Default:** ON (true)
- **Behavior:**
  - ON: Opens last active project automatically
  - OFF: Plugin starts with no active project (must select manually)

---

## Recommended Settings for Different Workflows

### Heavy Drafting (Multiple Revisions)

```
Maximum Backups Per Draft: 10
Maximum Backup Age (Days): 60
Panel Refresh Debounce: 300ms
Auto-Select Project on Startup: ON
```

Good for: Writers doing lots of revisions and edits

### Casual Writing (Occasional Backups)

```
Maximum Backups Per Draft: 3
Maximum Backup Age (Days): 14
Panel Refresh Debounce: 500ms
Auto-Select Project on Startup: ON
```

Good for: Writers who backup occasionally and want minimal storage

### Archive/Preservation Mode

```
Maximum Backups Per Draft: 20
Maximum Backup Age (Days): 365
Panel Refresh Debounce: 500ms
Auto-Select Project on Startup: ON
```

Good for: Keeping comprehensive backup history

---

## Advanced: Manual Project Structure

You can manually create projects if needed, following this structure:

```
MyProject/
├── meta.md              # Required; will be created if missing
└── Drafts/
    ├── Draft 1/
    │   └── draft.md     # For single-file
    │                    # OR chapter files (for multi-file)
    └── Draft 2/
        └── draft.md
```

**Minimum requirements:**

- Project folder with any name
- `Drafts/` subfolder
- At least one draft folder inside `Drafts/`
- At least one markdown file per draft

**To use manually-created project:**

1. Create the structure above
2. Run "Select Active Project" command
3. Choose your project
4. Run "Update Project Metadata" to generate `meta.md`

---

## Backup File Format

Backups are stored as ZIP archives with this naming:

- **Format:** `YYYY-MM-DDTHH-MM-SS.zip`
- **Example:** `2025-01-15T14-30-45.zip` (January 15, 2025, 2:30:45 PM)
- **Contents:** Complete draft folder as it was at backup time

**Restore process:**

1. Extract ZIP contents
2. Copy files to current draft folder
3. Overwrite existing files

**Storage calculation:**

- Typical chapter file: 5-20 KB
- Typical draft backup: 50-500 KB (depending on chapter count)
- Full project with 10 drafts, 5 backups each: 2-5 MB

---

## Best Practices

### File Naming

- Use descriptive chapter names: `Chapter 1 - The Beginning` (not just `ch1`)
- Use consistent draft naming: `Draft 1`, `Draft 2`, `Revision A`, `Final`, etc.
- Avoid special characters in project/draft names

### Metadata Maintenance

- Run "Update Project Metadata" after manual file edits
- Don't manually edit frontmatter unless you understand the format
- Let WriteAid maintain `word_count` and `last_updated` fields

### Backup Strategy

- Create backups before major revisions
- Use "Clear Old Backups" monthly to manage storage
- Export manuscripts for external backup
- Consider cloud sync for vault folder

### Project Organization

- Use one project per novel/manuscript
- Create new drafts rather than editing originals
- Keep outline updated as you write
- Use chapters for better organization

### Performance

- For novels with 50+ chapters, consider pagination
- Refresh panel debounce: increase if experiencing lag
- Consider archiving completed projects to separate folders
