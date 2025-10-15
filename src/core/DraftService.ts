import { TemplateService } from "@/core/TemplateService";
import { readMetaFile, updateMetaStats } from "@/core/meta";
import { slugifyDraftName } from "@/core/utils";
import type { WriteAidSettings } from "@/types";
import { App, Notice, TFile, TFolder } from "obsidian";

export class DraftService {
  app: App;
  tpl: TemplateService;

  constructor(app: App) {
    this.app = app;
    this.tpl = new TemplateService(app);
  }

  /**
   * Reorder chapters in a draft. Accepts an array of chapter objects in the new order.
   * Each object must have { chapterName, order }.
   */
  async reorderChapters(
    projectPath: string,
    draftName: string,
    newOrder: Array<{ chapterName: string; order: number }>,
  ) {
    const project = this.resolveProjectPath(projectPath);
    if (!project) return false;
    const draftFolder = `${project}/Drafts/${draftName}`;
    for (let i = 0; i < newOrder.length; i++) {
      const { chapterName } = newOrder[i];
      const filePath = `${draftFolder}/${chapterName}.md`;
      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (file && file instanceof TFile) {
        let content = await this.app.vault.read(file);
        // Replace order in frontmatter
        if (content.match(/^---\n([\s\S]*?)\n---/)) {
          content = content.replace(/^---\n([\s\S]*?)\n---/, (match, fm) => {
            let cleanedFm = fm.replace(/^order:.*\n?/gm, "");
            if (!cleanedFm.endsWith("\n")) cleanedFm += "\n";
            cleanedFm += `order: ${i + 1}\n`;
            return `---\n${cleanedFm}---`;
          });
          await this.app.vault.modify(file, content);
        }
      }
    }
    return true;
  }

  /**
   * Suggest the next draft name as 'Draft ${meta.total_drafts+1}' using meta.md.
   */
  async suggestNextDraftName(projectPath?: string): Promise<string> {
    const project = this.resolveProjectPath(projectPath);
    if (!project) return "Draft 1";
    const metaPath = `${project}/meta.md`;
    let totalDrafts = 0;
    try {
      const meta = await readMetaFile(this.app, metaPath);
      if (meta && typeof meta.total_drafts === "number") {
        totalDrafts = meta.total_drafts;
      }
    } catch (e) {
      // ignore error
    }
    return `Draft ${totalDrafts + 1}`;
  }

  /**
   * List chapters for a draft in a multi-file project. Returns array of { name, chapterName? }
   */
  async listChapters(
    projectPath: string,
    draftName: string,
  ): Promise<Array<{ name: string; chapterName?: string }>> {
    const project = this.resolveProjectPath(projectPath);
    if (!project) return [];
    const draftFolder = `${project}/Drafts/${draftName}`;
    const folder = this.app.vault.getAbstractFileByPath(draftFolder);
    const chapters: Array<{ name: string; chapterName?: string; order: number }> = [];
    if (folder && folder instanceof TFolder) {
      for (const file of folder.children) {
        if (file instanceof TFile && file.extension === "md") {
          try {
            const content = await this.app.vault.read(file);
            // Parse frontmatter for 'order' and 'chapter_name'
            const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
            let order: number | undefined = undefined;
            let chapterName: string | undefined = undefined;
            if (fmMatch) {
              const lines = fmMatch[1].split(/\r?\n/);
              for (const line of lines) {
                const mOrder = line.match(/^order:\s*(\d+)/i);
                if (mOrder) order = parseInt(mOrder[1], 10);
                const mChapterName = line.match(/^chapter_name:\s*(.*)$/i);
                if (mChapterName) {
                  // Remove quotes if present
                  let val = mChapterName[1].trim();
                  if (
                    (val.startsWith('"') && val.endsWith('"')) ||
                    (val.startsWith("'") && val.endsWith("'"))
                  ) {
                    val = val.slice(1, -1);
                  }
                  if (val.length > 0) chapterName = val;
                }
              }
            }
            if (
              typeof order === "number" &&
              !isNaN(order) &&
              chapterName &&
              chapterName.length > 0
            ) {
              chapters.push({ name: file.name.replace(/\.md$/, ""), chapterName, order });
            }
          } catch (e) {
            // ignore error
          }
        }
      }
    }
    chapters.sort((a, b) => a.order - b.order);
    return chapters.map(({ name, chapterName }) => ({ name, chapterName }));
  }

  /** Create a new chapter file in a draft folder. */
  async createChapter(
    projectPath: string,
    draftName: string,
    chapterName: string,
    // chapterNameValue?: string,
  ) {
    const project = this.resolveProjectPath(projectPath);
    if (!project) return false;
    const draftFolder = `${project}/Drafts/${draftName}`;
    const fileName = `${chapterName}.md`;
    const filePath = `${draftFolder}/${fileName}`;
    if (this.app.vault.getAbstractFileByPath(filePath)) return false;
    // Find max order among existing chapters
    let maxOrder = 0;
    const folder = this.app.vault.getAbstractFileByPath(draftFolder);
    if (folder && folder instanceof TFolder) {
      for (const file of folder.children) {
        if (file instanceof TFile && file.extension === "md") {
          try {
            const content = await this.app.vault.read(file);
            const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
            if (fmMatch) {
              const lines = fmMatch[1].split(/\r?\n/);
              for (const line of lines) {
                const m = line.match(/^order:\s*(\d+)/i);
                if (m) {
                  const ord = parseInt(m[1], 10);
                  if (!isNaN(ord) && ord > maxOrder) maxOrder = ord;
                }
              }
            }
          } catch (e) {
            /* ignore */
          }
        }
      }
    }
    const order = maxOrder + 1;
    let title = `# ${chapterName}`;
    const frontmatter = `---\norder: ${order}\nchapter_name: ${JSON.stringify(chapterName)}\n---\n`;
    await this.app.vault.create(filePath, `${frontmatter}\n${title}\n\n`);
    return true;
  }

  /** Delete a chapter file from a draft folder. */
  async deleteChapter(projectPath: string, draftName: string, chapterName: string) {
    const project = this.resolveProjectPath(projectPath);
    if (!project) return false;
    const draftFolder = `${project}/Drafts/${draftName}`;
    const fileName = `${chapterName}.md`;
    const filePath = `${draftFolder}/${fileName}`;
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file && file instanceof TFile) {
      await this.app.vault.delete(file);
      // After deletion, reassign order for all remaining chapters using listChapters
      const chapters = await this.listChapters(projectPath, draftName);
      for (let i = 0; i < chapters.length; i++) {
        const { name } = chapters[i];
        const chapterFilePath = `${draftFolder}/${name}.md`;
        const chapterFile = this.app.vault.getAbstractFileByPath(chapterFilePath);
        if (chapterFile && chapterFile instanceof TFile) {
          let content = await this.app.vault.read(chapterFile);
          // Replace order in frontmatter
          if (content.match(/^---\n([\s\S]*?)\n---/)) {
            content = content.replace(/^---\n([\s\S]*?)\n---/, (match, fm) => {
              let cleanedFm = fm.replace(/^order:.*\n?/gm, "");
              if (!cleanedFm.endsWith("\n")) cleanedFm += "\n";
              cleanedFm += `order: ${i + 1}\n`;
              return `---\n${cleanedFm}---`;
            });
            await this.app.vault.modify(chapterFile, content);
          }
        }
      }
      return true;
    }
    return false;
  }

  /** Rename a chapter file and/or update its short name. */
  async renameChapter(projectPath: string, draftName: string, oldName: string, newName: string) {
    const project = this.resolveProjectPath(projectPath);
    if (!project) return false;
    const draftFolder = `${project}/Drafts/${draftName}`;
    const oldFile = `${draftFolder}/${oldName}.md`;
    const newFile = `${draftFolder}/${newName}.md`;
    const file = this.app.vault.getAbstractFileByPath(oldFile);
    if (!file || !(file instanceof TFile)) return false;
    let content = await this.app.vault.read(file);
    let title = `# ${newName}`;

    if (content.match(/^---\n([\s\S]*?)\n---/)) {
      content = content.replace(/^---\n([\s\S]*?)\n---/, (match, fm) => {
        // Remove all chapter_name lines
        let cleanedFm = fm.replace(/^chapter_name:.*\n?/gm, "");
        // Ensure cleanedFm ends with a newline
        if (!cleanedFm.endsWith("\n")) cleanedFm += "\n";
        // Add the new chapter_name at the end
        cleanedFm += `chapter_name: ${JSON.stringify(newName)}\n`;
        return `---\n${cleanedFm}---`;
      });
    }
    content = content.replace(/^#.*$/m, title);
    if (oldName !== newName) {
      await this.app.vault.create(newFile, content);
      await this.app.vault.delete(file);
    } else {
      await this.app.vault.modify(file, content);
    }
    return true;
  }

  private resolveProjectPath(projectPath?: string): string | null {
    if (projectPath && projectPath !== "") return projectPath;
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return null;
    const folder = activeFile.parent;
    return folder ? folder.path : null;
  }

  async createDraft(
    draftName: string,
    copyFromDraft?: string,
    projectPath?: string,
    settings?: WriteAidSettings,
  ) {
    const projectPathResolved = this.resolveProjectPath(projectPath);
    if (!projectPathResolved) {
      new Notice("No project folder detected. Please open a folder named after your project.");
      return;
    }

    const draftsFolder = `${projectPathResolved}/Drafts`;
    const newDraftFolder = `${draftsFolder}/${draftName}`;

    // Create drafts and draft folders if needed
    if (!this.app.vault.getAbstractFileByPath(draftsFolder)) {
      await this.app.vault.createFolder(draftsFolder);
    }
    if (!this.app.vault.getAbstractFileByPath(newDraftFolder)) {
      await this.app.vault.createFolder(newDraftFolder);
    }

    // Optionally copy from an existing draft
    if (copyFromDraft) {
      const sourceFolder = `${draftsFolder}/${copyFromDraft}`;
      const files = this.app.vault.getFiles().filter((file) => file.path.startsWith(sourceFolder));
      for (const file of files) {
        const relPath = file.path.substring(sourceFolder.length + 1);
        const destPath = `${newDraftFolder}/${relPath}`;
        const content = await this.app.vault.read(file);
        await this.app.vault.create(destPath, content);
      }
    } else {
      // Only create outline.md if enabled in settings (must be strictly true)
      if (settings?.includeDraftOutline === true) {
        const draftOutlineTemplate = settings?.draftOutlineTemplate ?? "";
        const outlineContent = await this.tpl.render(draftOutlineTemplate, {
          draftName,
        });
        await this.app.vault.create(`${newDraftFolder}/outline.md`, outlineContent);
      }

      // Determine project type from meta.md frontmatter
      const projectName = projectPathResolved.split("/").pop() || projectPathResolved;
      const metaCandidate = `${projectPathResolved}/meta.md`;
      let isSingleFileProject = false;
      if (this.app.vault.getAbstractFileByPath(metaCandidate)) {
        try {
          const metaFile = this.app.vault.getAbstractFileByPath(metaCandidate);
          if (metaFile instanceof TFile) {
            const metaContent = await this.app.vault.read(metaFile);
            const fmMatch = metaContent.match(/^---\n([\s\S]*?)\n---/);
            if (fmMatch) {
              const lines = fmMatch[1].split(/\r?\n/);
              for (const line of lines) {
                const mType = line.match(/^project_type:\s*(.*)$/i);
                if (mType) {
                  const val = mType[1].trim();
                  if (val === "single-file") isSingleFileProject = true;
                  if (val === "multi-file") isSingleFileProject = false;
                  break;
                }
              }
            }
          }
        } catch (e) {
          // fallback: treat as multi-file
        }
      } else {
        // fallback: old heuristic
        const singleFileCandidate = `${projectPathResolved}/${projectName}.md`;
        isSingleFileProject = !!this.app.vault.getAbstractFileByPath(singleFileCandidate);
      }

      if (isSingleFileProject) {
        const slug = slugifyDraftName(
          draftName,
          settings?.slugStyle as import("@/core/utils").DraftSlugStyle,
        );
        const draftFileName = `${slug}.md`;
        const draftMainPath = `${newDraftFolder}/${draftFileName}`;
        if (!this.app.vault.getAbstractFileByPath(draftMainPath)) {
          const fm = `---\ndraft: ${draftName}\nproject: ${projectName}\ncreated: ${new Date().toISOString()}\n---\n\n`;
          const projectContent = await this.tpl.render(settings?.projectFileTemplate ?? "", {
            projectName,
          });
          await this.app.vault.create(draftMainPath, fm + projectContent);
        }
      } else {
        // Multi-file project: ensure at least one chapter exists
        const folder = this.app.vault.getAbstractFileByPath(newDraftFolder);
        let hasChapter = false;
        if (folder && folder instanceof TFolder) {
          for (const file of folder.children) {
            if (file instanceof TFile && file.extension === "md") {
              try {
                const content = await this.app.vault.read(file);
                const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
                if (fmMatch) {
                  const lines = fmMatch[1].split(/\r?\n/);
                  for (const line of lines) {
                    const m = line.match(/^order:\s*(\d+)/i);
                    if (m && !isNaN(parseInt(m[1], 10))) {
                      hasChapter = true;
                      break;
                    }
                  }
                }
              } catch (e) {
                /* ignore */
              }
              if (hasChapter) break;
            }
          }
        }
        if (!hasChapter) {
          // Create Chapter 1
          await this.createChapter(projectPathResolved, draftName, "Chapter 1");
        }
      }
    }

    // Update meta.md statistics after creating a draft
    await updateMetaStats(this.app, projectPathResolved, draftName);
  }

  listDrafts(projectPath?: string): string[] {
    const project = this.resolveProjectPath(projectPath);
    if (!project) return [];
    const draftsFolder = `${project}/Drafts`;
    const folder = this.app.vault.getAbstractFileByPath(draftsFolder);
    if (folder && folder instanceof TFolder) {
      return folder.children
        .filter((child): child is TFolder => child instanceof TFolder)
        .map((child) => child.name);
    }
    return [];
  }

  /**
   * Open a draft in the workspace. Tries outline.md first, then falls back to the first file in the draft folder.
   * Returns true if a file was opened.
   */
  async openDraft(projectPath: string | undefined, draftName: string): Promise<boolean> {
    const project = this.resolveProjectPath(projectPath);
    if (!project) return false;
    const outlinePath = `${project}/Drafts/${draftName}/outline.md`;
    const outlineFile = this.app.vault.getAbstractFileByPath(outlinePath);
    try {
      if (outlineFile && outlineFile instanceof TFile) {
        const leaf = this.app.workspace.getLeaf();
        await leaf.openFile(outlineFile);
        return true;
      }
    } catch (e) {
      // ignore and try fallback
    }

    // fallback: open first file inside the draft folder
    const folderPath = `${project}/Drafts/${draftName}`;
    const files = this.app.vault.getFiles().filter((f) => f.path.startsWith(folderPath));
    if (files.length > 0) {
      const leaf = this.app.workspace.getLeaf();
      await leaf.openFile(files[0]);
      return true;
    }
    return false;
  }

  /**
   * Rename a draft folder by copying files to the new folder name and removing the old files.
   * Returns true on success.
   */
  async renameDraft(
    projectPath: string | undefined,
    oldName: string,
    newName: string,
    renameFile: boolean = false,
    settings?: WriteAidSettings,
  ): Promise<boolean> {
    const project = this.resolveProjectPath(projectPath);
    if (!project) return false;
    const oldFolder = `${project}/Drafts/${oldName}`;
    const newFolder = `${project}/Drafts/${newName}`;
    try {
      // create new folder if needed
      if (!this.app.vault.getAbstractFileByPath(newFolder)) {
        await this.app.vault.createFolder(newFolder);
      }
      const files = this.app.vault.getFiles().filter((f) => f.path.startsWith(oldFolder));
      // Compute old and new slug for main draft file
      let oldSlug = "";
      let newSlug = "";
      if (renameFile) {
        const slugStyle = settings?.slugStyle;
        oldSlug = slugifyDraftName(oldName, slugStyle);
        newSlug = slugifyDraftName(newName, slugStyle);
      }
      for (const file of files) {
        let rel = file.path.substring(oldFolder.length + 1);
        let dest = `${newFolder}/${rel}`;
        // Only rename the main draft file (oldSlug.md) if requested
        if (renameFile && oldSlug && newSlug && rel === `${oldSlug}.md`) {
          rel = `${newSlug}.md`;
          dest = `${newFolder}/${rel}`;
        }
        let content = await this.app.vault.read(file);
        // If this is a Markdown file, update its frontmatter draft property
        if (file.extension === "md") {
          // Replace or insert draft: <newName> in YAML frontmatter
          content = content.replace(/^(---\s*\n[\s\S]*?\n)(draft:.*\n)?/m, (match, p1) => {
            // Remove any existing draft: line
            let fm = p1.replace(/^draft:.*\n/m, "");
            // Insert new draft line after ---\n
            // If there's already a draft: line, replace it; otherwise, insert after ---\n
            return fm.replace(/^(---\s*\n)/, `$1draft: ${newName}\n`);
          });
        }
        await this.app.vault.create(dest, content);
        await this.app.vault.delete(file);
      }
      // Remove the old draft folder if it exists (force delete, even if not empty)
      const oldFolderObj = this.app.vault.getAbstractFileByPath(oldFolder);
      if (oldFolderObj && oldFolderObj instanceof TFolder) {
        await this.app.vault.delete(oldFolderObj, true);
      }
      // Update meta.md in the project root
      try {
        await import("./meta").then((meta) => meta.updateMetaStats(this.app, project, newName));
      } catch (e) {
        // Ignore errors updating project meta
      }
      // Update meta.md in the renamed draft folder if it exists
      const draftMetaPath = `${newFolder}/meta.md`;
      const draftMetaFile = this.app.vault.getAbstractFileByPath(draftMetaPath);
      if (draftMetaFile) {
        try {
          // Read, update the draft property, and write back
          const { readMetaFile, writeMetaFile } = await import("./meta");
          const meta = await readMetaFile(this.app, draftMetaPath);
          if (meta) {
            meta.draft = newName;
            await writeMetaFile(this.app, draftMetaPath, meta);
          }
        } catch (e) {
          // Ignore errors updating draft meta
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Delete a draft folder. If createBackup is true, copy the draft folder to .writeaid-backups/<ts>/<name> before deleting.
   */
  async deleteDraft(
    projectPath: string | undefined,
    draftName: string,
    createBackup = true,
  ): Promise<boolean> {
    const project = this.resolveProjectPath(projectPath);
    if (!project) return false;
    const draftFolder = `${project}/Drafts/${draftName}`;
    const ts = Date.now();
    const backupBase = `${project}/.writeaid-backups/${ts}`;
    try {
      const files = this.app.vault.getFiles().filter((f) => f.path.startsWith(draftFolder));
      if (createBackup) {
        for (const file of files) {
          const rel = file.path.substring(draftFolder.length + 1);
          const dest = `${backupBase}/${draftName}/${rel}`;
          const content = await this.app.vault.read(file);
          // ensure parent folders will be created by vault when creating files with nested paths
          await this.app.vault.create(dest, content);
        }
      }
      // delete original files
      for (const file of files) {
        try {
          await this.app.vault.delete(file);
        } catch (e) {
          // Ignore errors when deleting files
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  }
}
