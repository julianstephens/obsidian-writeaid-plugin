# WriteAid Plugin Documentation

Welcome to the WriteAid documentation! This folder contains comprehensive guides for using the WriteAid plugin for Obsidian.

## 📚 Documentation Index

### [UserGuide.md](UserGuide.md) - **Start Here!**

Complete beginner-friendly guide covering:

- Getting started with WriteAid
- Creating your first project
- Managing drafts and chapters
- Working with manuscripts
- Backup and recovery basics
- Tips and tricks for writers

**Best for:** New users, understanding workflow, general usage

---

### [CommandsReference.md](CommandsReference.md) - Command Documentation

Detailed reference for all 17+ available commands:

- Project Management commands
- Draft Management commands
- Outline & Manuscript commands
- Chapter Navigation commands
- Backup & Recovery commands
- Command examples and workflows

**Best for:** Looking up specific commands, understanding what each does, command workflows

---

### [ProjectStructureAndSettings.md](ProjectStructureAndSettings.md) - Technical Details

In-depth guide covering:

- Folder structure and organization
- Project metadata format (meta.md)
- Draft and chapter file formats
- Outline and manuscript formats
- Complete settings reference
- Best practices
- Advanced manual project creation

**Best for:** Understanding the system, advanced customization, technical details

---

### [Troubleshooting.md](Troubleshooting.md) - Problem Solving

Comprehensive troubleshooting guide including:

- General issues (plugin not showing, commands not working)
- Project issues and fixes
- Draft & chapter problems
- Backup & recovery issues
- Word count troubleshooting
- UI/display issues
- Performance optimization
- Advanced debugging
- Known limitations

**Best for:** When something isn't working, performance issues, advanced fixes

---

### [Select.md](Select.md) - Component Documentation

Technical documentation for the Select component (for developers).

**Best for:** Developers extending the plugin

---

## 🚀 Quick Start

**New to WriteAid?** Follow these steps:

1. **Read:** [UserGuide.md - Getting Started](UserGuide.md#getting-started)
   - Learn installation and basic setup

2. **Learn:** [UserGuide.md - Creating Your First Project](UserGuide.md#creating-your-first-project)
   - Create your first novel/story project

3. **Explore:** [CommandsReference.md](CommandsReference.md)
   - Understand available commands and workflows

4. **Refer:** Keep [ProjectStructureAndSettings.md](ProjectStructureAndSettings.md) handy
   - Reference for settings and customization

---

## 🔍 Find What You Need

### By Use Case

**"I want to create a novel"**
→ [UserGuide.md - Creating Your First Project](UserGuide.md#creating-your-first-project)

**"I want to understand all available commands"**
→ [CommandsReference.md](CommandsReference.md)

**"I need to back up my work"**
→ [UserGuide.md - Backup Management](UserGuide.md#backup-management)
or
→ [CommandsReference.md - Backup Section](CommandsReference.md#backup--recovery)

**"Something isn't working"**
→ [Troubleshooting.md](Troubleshooting.md)

**"I want to customize settings"**
→ [ProjectStructureAndSettings.md - Plugin Settings](ProjectStructureAndSettings.md#plugin-settings)

**"I need to understand project structure"**
→ [ProjectStructureAndSettings.md](ProjectStructureAndSettings.md)

**"I want advanced features"**
→ [CommandsReference.md - Converting Projects](CommandsReference.md#convert-single-file-project-to-multi-file)

---

## 📖 Documentation by Topic

### Getting Started

- [UserGuide - Getting Started](UserGuide.md#getting-started)
- [UserGuide - Creating Your First Project](UserGuide.md#creating-your-first-project)

### Projects & Drafts

- [UserGuide - Project Structure](UserGuide.md#project-structure)
- [UserGuide - Managing Drafts](UserGuide.md#managing-drafts)
- [ProjectStructureAndSettings - Folder Structure](ProjectStructureAndSettings.md#folder-structure-overview)
- [CommandsReference - Project Management](CommandsReference.md#project-management)
- [CommandsReference - Draft Management](CommandsReference.md#draft-management)

### Chapters (Multi-File Projects)

- [UserGuide - Working with Chapters](UserGuide.md#working-with-chapters-multi-file-projects)
- [CommandsReference - Chapter Management](CommandsReference.md#chapter-management-multi-file-projects)
- [ProjectStructureAndSettings - Chapter Files](ProjectStructureAndSettings.md#multi-file-project-chapters)

### Manuscripts & Outlines

- [UserGuide - Manuscript Generation](UserGuide.md#manuscript-generation)
- [CommandsReference - Outline & Manuscript](CommandsReference.md#outline--manuscript)
- [ProjectStructureAndSettings - Manuscript Files](ProjectStructureAndSettings.md#manuscript-files-manuscripts)

### Backups & Recovery

- [UserGuide - Backup Management](UserGuide.md#backup-management)
- [CommandsReference - Backup & Recovery](CommandsReference.md#backup--recovery)
- [ProjectStructureAndSettings - Backup Folder](ProjectStructureAndSettings.md#hidden-backup-folder)
- [Troubleshooting - Backup Issues](Troubleshooting.md#backup-issues)

### Navigation

- [UserGuide - Navigation](UserGuide.md#navigation)
- [CommandsReference - Navigate Commands](CommandsReference.md#navigate-to-next-chapter)

### Settings & Configuration

- [UserGuide - Settings](UserGuide.md#settings)
- [ProjectStructureAndSettings - Plugin Settings](ProjectStructureAndSettings.md#plugin-settings)
- [ProjectStructureAndSettings - Recommended Settings](ProjectStructureAndSettings.md#recommended-settings-for-different-workflows)

### Troubleshooting & Help

- [Troubleshooting Guide](Troubleshooting.md)
- [UserGuide - Troubleshooting](UserGuide.md#troubleshooting)
- [UserGuide - Getting Help](UserGuide.md#getting-help)

### Advanced Topics

- [ProjectStructureAndSettings - Advanced Manual Project Structure](ProjectStructureAndSettings.md#advanced-manual-project-structure)
- [ProjectStructureAndSettings - Best Practices](ProjectStructureAndSettings.md#best-practices)
- [Troubleshooting - Advanced Troubleshooting](Troubleshooting.md#advanced-troubleshooting)

---

## ❓ FAQ

**Q: Do I have to use multi-file projects?**
A: No! Single-file projects are great for short stories and novellas. Choose what works for you.
→ [UserGuide - Project Structure](UserGuide.md#project-structure)

**Q: How many backups should I keep?**
A: Default is 5 per draft. For heavy editing, try 10. For casual writing, 3 is fine.
→ [ProjectStructureAndSettings - Backup Settings](ProjectStructureAndSettings.md#maximum-backups-per-draft)

**Q: Can I move my projects around?**
A: Yes, but you need to update the active project in settings after moving.
→ [Troubleshooting - Project Not Found](Troubleshooting.md#project-not-found-after-vault-move)

**Q: What happens if I exceed my backup limit?**
A: You'll see a confirmation dialog. Accept to delete the oldest backup and create the new one.
→ [CommandsReference - Create Backup](CommandsReference.md#create-backup)

**Q: Can I manually edit chapter files?**
A: Yes! Just be careful with the frontmatter and run "Update Project Metadata" afterward.
→ [ProjectStructureAndSettings - Multi-File Chapters](ProjectStructureAndSettings.md#multi-file-project-chapters)

**Q: How do I export to Word or PDF?**
A: Generate a manuscript (Markdown), then use Pandoc or Word's import feature.
→ [ProjectStructureAndSettings - Best Practices](ProjectStructureAndSettings.md#best-practices)

---

## 📞 Getting Help

### If Something Doesn't Work

1. Check the relevant guide section
2. Try the [Troubleshooting Guide](Troubleshooting.md)
3. Search [GitHub Issues](https://github.com/julianstephens/obsidian-writeaid-plugin/issues)

### If You Found a Bug

1. Note the exact steps to reproduce
2. Include your Obsidian and WriteAid versions
3. Report on [GitHub Issues](https://github.com/julianstephens/obsidian-writeaid-plugin/issues)

### If You Have a Feature Request

1. Check if similar request exists in [GitHub Issues](https://github.com/julianstephens/obsidian-writeaid-plugin/issues)
2. Create a new issue with your idea
3. Describe the use case and expected behavior

---

## 📋 Documentation Structure

```
docs/
├── README.md (this file)
├── UserGuide.md                    # Beginner's guide
├── CommandsReference.md            # All commands
├── ProjectStructureAndSettings.md  # Technical details
├── Troubleshooting.md              # Problem solving
└── Select.md                       # Component docs
```

---

## 💡 Tips for Using This Documentation

- **Use the search feature** in your editor to find keywords (e.g., Ctrl+F → "backup")
- **Click links** to jump between related topics
- **Check the table of contents** at the top of each guide
- **Use command palette** (Ctrl+P) to search guides while editing
- **Bookmark** this README for quick access

---

## 🎯 Version Information

This documentation is for **WriteAid Plugin version 1.0+**

- **Latest version:** Check [GitHub Releases](https://github.com/julianstephens/obsidian-writeaid-plugin/releases)
- **Compatibility:** Obsidian v0.15.0+
- **Last updated:** 2025-01-15

---

## 📝 Writing Tips

Check these sections for writing-specific advice:

- [UserGuide - Tips & Tricks](UserGuide.md#tips--tricks)
- [ProjectStructureAndSettings - Best Practices](ProjectStructureAndSettings.md#best-practices)

---

## 🚀 Ready to Start?

Begin with the [UserGuide.md](UserGuide.md) and follow the "Quick Start" section!

**Happy writing! 📚✨**
