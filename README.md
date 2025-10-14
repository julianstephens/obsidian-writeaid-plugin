### Convert Single-File Project to Multi-File

You can convert a single-file project to a multi-file project using the command palette:

1. Open the command palette (Ctrl+P or Cmd+P).
2. Search for "Convert Single-File Project to Multi-File".
3. Run the command with your single-file project active.

This will update the project type in `meta.md` and rename all draft files to `Chapter 1.md` in each draft folder.

# Obsidian WriteAid Plugin

A novel writing plugin for Obsidian supporting multiple drafts per project. Organize, compare, and manage different versions of your novel drafts with ease.

## Features

- Multiple drafts per writing project
- Easy draft creation, duplication, and selection
- Draft-aware navigation for chapters and scenes
- Metadata and structure management for each draft
- (Planned) Draft comparison and merging

## Getting Started

1. Clone or download this repository.
2. Run `npm install` in the plugin folder.
3. Build with `npm run build`.
4. Load the dist folder as a community plugin in Obsidian.

## Example Project Structure

```
MyVault/
├── TheFantasticShortStory/
|   ├── meta.md               # created from projectFileTemplate
|   └── Drafts/
|       ├── Draft 1/
|       │   ├── outline.md    # created from draftOutlineTemplate
|       │   └── draft1.md      # per-draft main file (slugified draft name)
|       └── Draft 2/
|           ├── outline.md
|           └── draft2.md
└── TheGreatNovel/
    ├── meta.md
    └── Drafts/
        ├── Draft 1/
        │   ├── outline.md
        │   ├── chapter1.md   # chapter files created from chapterTemplate
        │   └── chapter2.md
        └── Draft 2/
            ├── outline.md
            ├── chapter1.md
            └── chapter2.md
```

## Draft filename slugging

Per-draft main files (the single-file draft main note inside a `Drafts/Draft N/` folder) are created using a slugified draft name. The plugin supports two styles:

- `compact` (default): remove whitespace and lowercase. "Draft 1" -> `draft1.md`
- `kebab`: replace whitespace with dashes and lowercase. "Draft 1" -> `draft-1.md`

Change the behavior via the plugin settings (`slugStyle`). The default is `compact`.

## Commands

The plugin registers the following commands (useable via the command palette or keybindings):

| Command ID                  | Command name                       | Description                                                                                                                                                                               | Suggested keybinding |
| --------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `create-new-draft`          | Create New Draft                   | Prompt to create a new draft for the current project (or choose a project). Creates a `Drafts/Draft N/` folder with an `outline.md` and, for single-file projects, a per-draft main file. | Ctrl/Cmd+Alt+D       |
| `create-new-project`        | Create New Project                 | Prompt to create a new project scaffold (project folder, `meta.md`, initial draft folder and sample files).                                                                               | Ctrl/Cmd+Alt+P       |
| `convert-index-to-planning` | Convert Index to Planning Document | Convert an index-style note into a planning document using the planning template.                                                                                                         | Ctrl/Cmd+Alt+L       |
| `switch-draft`              | Switch Active Draft                | Open a modal to select and switch the active draft for the current project.                                                                                                               | Ctrl/Cmd+Alt+S       |
| `update-project-metadata`   | Update Project Metadata            | Prompt to choose a project and recompute/update the project's `meta.md` (runs metadata/statistics update).                                                                                | Ctrl/Cmd+Alt+M       |
| `select-active-project`     | Select Active Project              | Open a modal to choose and persist the active project; subsequent operations (metadata update) default to this project.                                                                   | Ctrl/Cmd+Alt+A       |
