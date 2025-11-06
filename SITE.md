# WriteAid — Obsidian Plugin for Multi‑Draft Novel Writing

A novel writing plugin for Obsidian supporting multiple drafts per project. Organize, compare, and manage different versions of your novel drafts with ease.

## Features

- Multiple drafts per writing project
- Single‑file or multi‑file project structures
- Draft‑aware chapter and scene navigation
- Outline and chapter templates
- Manuscript generation (Markdown)
- Project metadata management (`meta.md`)
- Project panel sidebar and status bar integration
- Backup and recovery tools per draft
- Keyboard shortcuts for common actions
- Sensible defaults with configurable settings (slug style, ribbon placement, auto‑select project, etc.)

## Example Project Structure

```
MyVault/
├── TheFantasticShortStory/
|   ├── meta.md
|   └── Drafts/
|       ├── Draft 1/
|       │   ├── outline.md    # created from outline template
|       │   └── draft1.md     # per-draft main file (slugified draft name)
|       └── Draft 2/
|           ├── outline.md
|           └── draft2.md
└── TheGreatNovel/
    ├── meta.md
    └── Drafts/
        ├── Draft 1/
        │   ├── outline.md
        │   ├── Chapter 1.md  # chapter files created from chapter template
        │   └── Chapter 2.md
        └── Draft 2/
            ├── outline.md
            ├── Chapter 1.md
            └── Chapter 2.md
```

### Draft filename slugging

- compact (default): remove whitespace and lowercase, e.g., “Draft 1” → `draft1.md`
- kebab: replace whitespace with dashes and lowercase, e.g., “Draft 1” → `draft-1.md`

Configure via plugin settings (`slugStyle`).

## Commands and Hotkeys

- Create New Draft — Mod+Alt+D
- Create Outline — Mod+Alt+O
- Create New Project — Mod+Shift+P
- Switch Active Draft — Mod+Alt+S
- Update Project Metadata — Mod+Alt+M
- Select Active Project — Mod+Alt+A
- Generate Manuscript — Mod+Shift+M
- Navigate to Next Chapter — Mod+Alt+N
- Navigate to Previous Chapter — Mod+Alt+P
- Convert Single‑File Project to Multi‑File
- Toggle Project Panel
- Initialize Draft File Metadata
- Create Backup
- List and Restore Backups
- Delete Oldest Backup
- Clear Old Backups
- Open Project Meta

All commands are available via the command palette and can be re‑keyed in Obsidian’s settings.

## Backup and Recovery

- Hierarchical storage: `.writeaid-backups/<project>/<drafts>/<draft>/`
- Automatic cleanup on startup based on retention settings (default: 30 days)
- Manual management: create, list/restore, delete oldest, and clear old backups
- Works per‑draft within the active project

## Documentation

- Getting started and workflows: [docs/UserGuide.md](https://github.com/julianstephens/obsidian-writeaid-plugin/blob/main/docs/UserGuide.md)
- All commands: [docs/CommandsReference.md](https://github.com/julianstephens/obsidian-writeaid-plugin/blob/main/docs/CommandsReference.md)
- Project structure and settings: [docs/ProjectStructureAndSettings.md](https://github.com/julianstephens/obsidian-writeaid-plugin/blob/main/docs/ProjectStructureAndSettings.md)
- Troubleshooting: [docs/Troubleshooting.md](https://github.com/julianstephens/obsidian-writeaid-plugin/blob/main/docs/Troubleshooting.md)
- Repository README: [README.md](https://github.com/julianstephens/obsidian-writeaid-plugin/blob/main/README.md)
