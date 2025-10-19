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

For single-file projects, each draft is stored as a single markdown file with metadata in YAML frontmatter:

**File:** `Project Name/drafts/Draft 1.md` (or per configured slug style)

**Frontmatter Format:**

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

**Frontmatter Fields (5 fields required):**

| Field          | Type     | Purpose                              | Example                |
| -------------- | -------- | ------------------------------------ | ---------------------- |
| `id`           | UUID     | Unique identifier for this draft     | `"abc123def456"`       |
| `draft_name`   | String   | Display name of the draft            | `"Draft 1"`            |
| `project_id`   | UUID     | ID of the parent project             | `"proj789"`            |
| `word_count`   | Number   | Current word count (auto-calculated) | `58450`                |
| `last_updated` | ISO 8601 | Last modification timestamp          | `2025-01-15T14:30:45Z` |

**Field Details:**

- **`id`** (UUID)
  - **Generated:** Automatically on draft creation
  - **Immutable:** Should not be changed
  - **Purpose:** Unique identifier for draft-to-project relationships

- **`draft_name`** (String)
  - **Generated:** From user input during draft creation
  - **Editable:** Can be changed by user
  - **Purpose:** Display name shown in UI
  - **Note:** Always stored as JSON string if contains special characters

- **`project_id`** (UUID)
  - **Generated:** From parent project metadata on draft creation
  - **Immutable:** Should not be changed
  - **Purpose:** Links draft to parent project for programmatic access
  - **Storage:** Always a UUID (not project name)

- **`word_count`** (Number)
  - **Initial Value:** 0 when draft created
  - **Updated:** Automatically when draft content changes
  - **Calculation:** Counts words in body content (excludes frontmatter and markdown syntax)
  - **Purpose:** Tracks current draft length

- **`last_updated`** (ISO 8601 Timestamp)
  - **Generated:** ISO 8601 UTC format on draft creation (e.g., `2025-01-15T14:30:45.123Z`)
  - **Updated:** Automatically whenever draft content is modified
  - **Format:** Always UTC with `Z` suffix (timezone-independent)
  - **Purpose:** Tracks last modification time for auditing and sorting

**Metadata Maintenance:**

- Fields are automatically maintained by WriteAid
- Manual editing of `id` and `project_id` not recommended
- `word_count` and `last_updated` are auto-updated
- If fields become corrupted, draft can be recovered by updating project metadata

**Backward Compatibility:**

WriteAid supports reading old field names for existing single-file drafts:

- `draft` (old) → `draft_name` (new)
- `project` (old) → `project_id` (new)
- `created` (old) → `last_updated` (new)

Old drafts are automatically migrated to the new schema on next modification.

---

#### Multi-File Project Chapters

Each chapter is a separate file with frontmatter:

#### Multi-File Project Chapters

Each chapter is a separate file with frontmatter containing comprehensive metadata:

````yaml
---
chapter_id: "ch-[uuid]"
order: 1
chapter_name: "Chapter 1: The Beginning"
draft_id: "draft-[uuid]"
word_count: 0
last_updated: 2025-01-15T14:30:45Z
---
# Chapter 1: The Beginning

Your chapter content...

**Frontmatter Fields:**

- `chapter_id` (UUID): Unique chapter identifier with `ch-` prefix (e.g., `ch-a1b2c3d4...`)
  - **Purpose**: Distinguishes chapter files from other file types
  - **Generated**: Automatically on chapter creation
  - **Format**: `ch-` followed by UUID-style string

- `order` (number): Chapter sequence number for navigation and manuscript generation
  - **Purpose**: Controls chapter ordering in navigation and manuscript output
  - **Generated**: Automatically calculated from existing chapters (starts at 1)
  - **Used By**: Navigation commands, manuscript generation

- `chapter_name` (string): Display name shown in UI and navigation
  - **Purpose**: Human-readable chapter title
  - **Generated**: From user input during chapter creation
  - **Format**: Can contain spaces and special characters

- `draft_id` (UUID): Links chapter to parent draft
  - **Purpose**: Establishes chapter-to-draft relationship for programmatic access
  - **Generated**: Inherited from parent draft automatically
  - **Used By**: Multi-chapter draft organization, manuscript assembly

- `word_count` (number): Current word count of the chapter content
  - **Purpose**: Tracks chapter length for statistics
  - **Initial Value**: 0 when chapter created
  - **Updated**: When chapter content is modified

- `last_updated` (ISO 8601 timestamp): Creation and modification timestamp
  - **Purpose**: Tracks when chapter was created or last modified
  - **Generated**: ISO 8601 format (e.g., `2025-01-15T14:30:45Z`)
  - **Format**: UTC time with `Z` suffix (always timezone-independent)
  - **Updated**: Automatically when chapter is modified

**Ordering:** Chapters are sorted by `order` value for navigation and manuscript generation. When creating a new chapter, the order is automatically set to one more than the highest existing chapter order.

**Metadata Maintenance:** The `last_updated` and `word_count` fields are automatically maintained by WriteAid as chapters are created and edited.

**Note on Timestamps:** All timestamps are stored in UTC (the `Z` suffix means Zulu/UTC time). Your editor may display them in your local timezone, which could appear different from UTC. See [TIMEZONE_NOTES.md](TIMEZONE_NOTES.md) for details.

---

### Outline File (outline.md)

Optional file for planning and organizing your draft. Created automatically when "Create Outline" command is used or when creating new drafts with outline enabled.

**Frontmatter Fields:**

- `draft_id` (UUID): Links outline to parent draft for tracking
- `type` (string): Always "outline" to identify file type
- `created` (ISO 8601 timestamp): When the outline was created

```yaml
---
draft_id: "draft-abc123def456"
type: "outline"
created: "2025-01-15T14:30:45.123Z"
---

# Outline for Draft 1

## Story Premise

The hero must save the kingdom from darkness.

## Main Plot Points

1. Setup: Introduce the world and protagonist
2. Inciting Incident: The event that starts the story
3. Rising Action: Complications and obstacles
4. Climax: The turning point
5. Resolution: How things are resolved

## Character Arcs

### Protagonist
- Starting State: How they begin
- Motivation: What drives them
- Transformation: How they change
- Ending State: Who they become

### Supporting Characters
- Character Name: Key traits and role

## Key Scenes

- [ ] Scene Title (Chapter X)
- [ ] Scene Title (Chapter X)

## Thematic Elements

- Central theme: [Description]
- Supporting themes: [List]

## Notes

- Pacing considerations
- Structural notes
- Research needed
- TODO items
```

**Metadata Control:**

- Frontmatter generation controlled by "Include metadata in outline files" setting
- Which fields are included controlled by "Outline metadata fields" setting
- Template content customizable via "Outline template" setting
- Use `{{draftName}}` variable for dynamic draft name insertion

---

### Manuscript Files (manuscripts/)

Auto-generated compiled versions of your drafts ready for export, printing, or sharing.

**Single-File Project:**

The manuscript is compiled from your draft file with metadata header added.

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

All chapters are concatenated in order with section breaks:

```markdown
# The Great Adventure

**Draft:** Draft 1
**Author:** [Author Name From Settings]
**Generated:** 2025-01-15 at 2:45 PM
**Word Count:** 58,450
**Chapters:** 12

---

## Chapter 1: The Beginning

[Chapter 1 content...]

---

## Chapter 2: The Journey

[Chapter 2 content...]

---

## Chapter 3: The Challenge

[Chapter 3 content...]

...

---

## Chapter 12: The Resolution

[Chapter 12 content...]
```

**Metadata Header Format:**

- **Title**: Project name (H1)
- **Draft**: Which draft version this is
- **Author**: Author name from plugin settings (customizable)
- **Generated**: Date and time in locale format
- **Word Count**: Total word count with thousand separators
- **Chapters**: Chapter count (1 for single-file projects)
- **Section break**: Configured style (horizontal rule, asterisks, or dashes)

**Generation Details:**

- **Generated at:** `manuscripts/{DraftName}.md` (customizable via template)
- **Includes:** Metadata header, all chapters in order, section breaks
- **Format:** Standard Markdown for export compatibility
- **Overwrites:** Previous manuscript with confirmation modal
- **Customizable settings:**
  - Author name (default: "Unknown Author")
  - Section break style (horizontal, asterisks, or dashes)
  - Filename template (with variables: `{{draftName}}`, `{{projectName}}`, `{{draftSlug}}`, `{{YYYY-MM-DD}}`)

**Customizable Filename Template:**

Use the "Manuscript name template" setting to customize filenames:

- `{{draftName}}` → `Draft 1.md`
- `{{projectName}} - {{draftName}}` → `MyNovel - Draft 1.md`
- `{{draftSlug}}-{{YYYY-MM-DD}}` → `draft-1-2025-10-19.md`
- `{{projectName}}_{{draftName}}_v{{YYYY}}.md` → `MyNovel_Draft 1_v2025.md`

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

### Template Settings

#### Include Outline File on Draft Creation

- **Type:** Toggle (on/off)
- **Description:** Automatically create outline.md when creating new drafts
- **Default:** OFF (false)
- **When used:** Creating new drafts via "Create New Draft" command

#### Include Metadata in Outline Files

- **Type:** Toggle (on/off)
- **Description:** Include frontmatter metadata in outline files
- **Default:** ON (true)
- **Fields included:** Controlled by "Outline metadata fields" setting

#### Outline Metadata Fields

- **Type:** Text input (comma-separated)
- **Description:** Which metadata fields to include in outline frontmatter
- **Default:** `draft_id, type, created`
- **Available fields:**
  - `draft_id`: UUID linking to parent draft
  - `type`: Always "outline"
  - `created`: ISO 8601 timestamp
- **Example:** `draft_id, type` (excludes created timestamp)

#### Outline Template

- **Type:** Multi-line text editor
- **Description:** Template for new outline files
- **Default:** Comprehensive 6-section template (see Outline File section above)
- **Variables:** `{{draftName}}` - replaced with actual draft name
- **File picker:** Button to load template from existing file

#### Chapter Template

- **Type:** Multi-line text editor
- **Description:** Template for newly created chapter files
- **Default:** Basic structure with summary and scene placeholders
- **Variables:** `{{chapterName}}` - replaced with actual chapter name
- **File picker:** Button to load template from existing file

#### Manuscript Name Template

- **Type:** Text input
- **Description:** Template for manuscript filenames
- **Default:** `{{draftName}}`
- **Variables:**
  - `{{draftName}}`: Draft folder name
  - `{{projectName}}`: Project folder name
  - `{{draftSlug}}`: Slugified draft name
  - Date qualifiers: `{{YYYY-MM-DD}}`, `{{YYYY}}`, etc.
- **Examples:**
  - `{{draftName}}` → `Draft 1.md`
  - `{{projectName}} - {{draftName}}` → `MyNovel - Draft 1.md`
  - `{{draftSlug}}-{{YYYY-MM-DD}}` → `draft-1-2025-01-15.md`

---

### Manuscript Settings

#### Author Name for Manuscripts

- **Type:** Text input
- **Description:** Your name to appear in manuscript metadata headers
- **Default:** "Unknown Author" (if left blank)
- **Used in:** Manuscript metadata header
- **Example:** "Jane Doe" or "John Smith"
- **When used:** Every time a manuscript is generated

#### Manuscript Section Break Style

- **Type:** Dropdown
- **Description:** Visual style for breaks between chapters in manuscripts
- **Options:**
  - **Horizontal Rule** (---) - Professional solid lines (default)
  - **Asterisks** (***) - Eye-catching triple asterisks
  - **Dashes** (---) - Alternative dash style
- **Default:** "horizontal"
- **When used:** Between each chapter in multi-file project manuscripts
- **Note:** All styles render as breaks; appearance may vary in different editors

#### Include Chapter List in Manuscript

- **Type:** Toggle (on/off)
- **Description:** Include a table of contents at the start of manuscripts
- **Default:** OFF (false)
- **When used:** When generating manuscripts (future feature)
- **Note:** Currently a toggle for future enhancement; TOC generation not yet implemented

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
````
