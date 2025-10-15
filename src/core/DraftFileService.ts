import { TemplateService } from "@/core/TemplateService";
import { readMetaFile, updateMetaStats } from "@/core/meta";
import { debug, DEBUG_PREFIX, PROJECT_TYPE, slugifyDraftName, suppressAsync } from "@/core/utils";
import type { WriteAidManager } from "@/manager";
import type { WriteAidSettings } from "@/types";
import { ConfirmOverwriteModal } from "@/ui/modals/ConfirmOverwriteModal";
import { App, Notice, TFile, TFolder } from "obsidian";
import { BackupService } from "./BackupService";
import { ChapterFileService } from "./ChapterFileService";
import { ProjectService } from "./ProjectService";

export class DraftFileService {
  app: App;
  tpl: TemplateService;
  projectSvc: ProjectService;
  backupSvc: BackupService;
  chapters: ChapterFileService;
  manager: WriteAidManager | null;

  constructor(app: App, chapters: ChapterFileService, projectSvc: ProjectService) {
    this.app = app;
    this.tpl = new TemplateService(app);
    this.projectSvc = projectSvc;
    this.backupSvc = new BackupService();
    this.chapters = chapters;
    this.manager =
      (
        this.app as unknown as {
          plugins: { getPlugin?: (id: string) => { manager?: WriteAidManager } };
        }
      ).plugins.getPlugin?.("obsidian-writeaid-plugin")?.manager ?? null;
  }

  resolveProjectPath(projectPath?: string): string | null {
    return projectPath || this.manager?.activeProject || null;
  }

  private getFolderName(
    key: keyof Pick<
      WriteAidSettings,
      "draftsFolderName" | "manuscriptsFolderName" | "backupsFolderName"
    >,
  ): string {
    const settings = (this.manager?.settings || {}) as WriteAidSettings;
    switch (key) {
      case "draftsFolderName":
        return settings.draftsFolderName || "drafts";
      case "manuscriptsFolderName":
        return settings.manuscriptsFolderName || "manuscripts";
      case "backupsFolderName":
        return settings.backupsFolderName || ".writeaid-backups";
      default:
        return "drafts";
    }
  }

  private getFileName(
    key: keyof Pick<WriteAidSettings, "metaFileName" | "outlineFileName">,
  ): string {
    const settings = (this.manager?.settings || {}) as WriteAidSettings;
    switch (key) {
      case "metaFileName":
        return settings.metaFileName || "meta.md";
      case "outlineFileName":
        return settings.outlineFileName || "outline.md";
      default:
        return "meta.md";
    }
  }

  private getDraftsFolderName(project: string): string | null {
    const projectFolder = this.app.vault.getAbstractFileByPath(project);
    const draftsName = this.getFolderName("draftsFolderName");
    if (projectFolder && projectFolder instanceof TFolder) {
      for (const child of projectFolder.children) {
        if (child instanceof TFolder && child.name.toLowerCase() === draftsName.toLowerCase()) {
          return child.name;
        }
      }
    }
    return null;
  }

  /**
   * Suggest the next draft name as 'Draft ${meta.total_drafts+1}' using meta.md.
   */
  async suggestNextDraftName(projectPath?: string): Promise<string> {
    const project = this.resolveProjectPath(projectPath);
    if (!project) return "Draft 1";
    const metaPath = `${project}/${this.getFileName("metaFileName")}`;
    let totalDrafts = 0;
    await suppressAsync(async () => {
      const meta = await readMetaFile(this.app, metaPath);
      if (meta && typeof meta.total_drafts === "number") {
        totalDrafts = meta.total_drafts;
      }
    });
    return `Draft ${totalDrafts + 1}`;
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

    // Check for existing drafts folder (handles legacy "Drafts" vs standard "drafts")
    const existingDraftsFolderName = this.getDraftsFolderName(projectPathResolved);
    const draftsFolderName = existingDraftsFolderName || this.getFolderName("draftsFolderName");
    const draftsFolder = `${projectPathResolved}/${draftsFolderName}`;
    const newDraftFolder = `${draftsFolder}/${draftName}`;

    const projectName = projectPathResolved.split("/").pop() || projectPathResolved;

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

      // Check if this might be a single-file project by looking for the main draft file
      const sourceSlug = slugifyDraftName(
        copyFromDraft,
        settings?.slugStyle as import("@/core/utils").DraftSlugStyle,
      );
      const expectedSourceFile = `${sourceSlug}.md`;

      for (const file of files) {
        let relPath = file.path.substring(sourceFolder.length + 1);

        // If this is the main draft file for a single-file project, rename it
        if (relPath === expectedSourceFile) {
          const newSlug = slugifyDraftName(
            draftName,
            settings?.slugStyle as import("@/core/utils").DraftSlugStyle,
          );
          relPath = `${newSlug}.md`;
        }

        const destPath = `${newDraftFolder}/${relPath}`;

        // Create any subfolders needed for the destination path
        const destDir = destPath.substring(0, destPath.lastIndexOf("/"));
        if (destDir !== newDraftFolder && !this.app.vault.getAbstractFileByPath(destDir)) {
          await this.app.vault.createFolder(destDir);
        }

        let content = await this.app.vault.read(file);

        content = updateDuplicatedFileMetadata(content, draftName, projectName);

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

      // Determine project type
      const projectType = await this.projectSvc.getProjectType(projectPathResolved);
      const isSingleFileProject = projectType === PROJECT_TYPE.SINGLE;

      if (isSingleFileProject) {
        const slug = slugifyDraftName(
          draftName,
          settings?.slugStyle as import("@/core/utils").DraftSlugStyle,
        );
        const draftFileName = `${slug}.md`;
        const draftMainPath = `${newDraftFolder}/${draftFileName}`;
        if (!this.app.vault.getAbstractFileByPath(draftMainPath)) {
          const fm = `---\ndraft: ${draftName}\nproject: ${projectName}\ncreated: ${new Date().toISOString()}\n---\n\n`;
          const projectContent = await this.tpl.render("# {{draftName}}", {
            draftName,
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
              await suppressAsync(async () => {
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
              });
              if (hasChapter) break;
            }
          }
        }
        if (!hasChapter) {
          // Create Chapter 1
          await this.chapters.createChapter(projectPathResolved, draftName, "Chapter 1", settings);
        }
      }
    }

    await updateMetaStats(this.app, projectPathResolved, draftName);
  }

  /**
   * List all drafts in a project.
   * @param projectPath - The path to the project.
   * @returns An array of draft names.
   */
  listDrafts(projectPath?: string): string[] {
    const project = this.resolveProjectPath(projectPath);
    debug(
      `${DEBUG_PREFIX} listDrafts called with projectPath:`,
      projectPath,
      "resolved to:",
      project,
    );
    if (!project) return [];
    const folder = this.projectSvc.getDraftsFolder(project);
    debug(
      `${DEBUG_PREFIX} getDraftsFolder for ${project} returned:`,
      folder?.path,
      folder?.children?.length,
    );
    if (folder && folder instanceof TFolder) {
      const draftNames = folder.children
        .filter((child): child is TFolder => child instanceof TFolder)
        .map((child) => child.name);
      debug(`${DEBUG_PREFIX} found drafts:`, draftNames);
      return draftNames;
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
    const draftsFolderName = this.getDraftsFolderName(project);
    if (!draftsFolderName) return false;
    const outlinePath = `${project}/${draftsFolderName}/${draftName}/${this.getFileName("outlineFileName")}`;
    const outlineFile = this.app.vault.getAbstractFileByPath(outlinePath);
    const outlineOpened = await suppressAsync(async () => {
      if (outlineFile && outlineFile instanceof TFile) {
        const leaf = this.app.workspace.getLeaf();
        await leaf.openFile(outlineFile);
        return true;
      }
      return false;
    });
    if (outlineOpened) return true;

    // fallback: open first file inside the draft folder
    const folderPath = `${project}/${draftsFolderName}/${draftName}`;
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
    const draftsFolderName = this.getDraftsFolderName(project);
    if (!draftsFolderName) return false;
    const oldFolder = `${project}/${draftsFolderName}/${oldName}`;
    const newFolder = `${project}/${draftsFolderName}/${newName}`;
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
      await suppressAsync(async () => {
        await import("./meta").then((meta) => meta.updateMetaStats(this.app, project, newName));
      });
      // Update meta.md in the renamed draft folder if it exists
      const draftMetaPath = `${newFolder}/${this.getFileName("metaFileName")}`;
      const draftMetaFile = this.app.vault.getAbstractFileByPath(draftMetaPath);
      if (draftMetaFile) {
        await suppressAsync(async () => {
          // Read, update the draft property, and write back
          const { readMetaFile, writeMetaFile } = await import("./meta");
          const meta = await readMetaFile(this.app, draftMetaPath);
          if (meta) {
            meta.draft = newName;
            await writeMetaFile(this.app, draftMetaPath, meta);
          }
        });
      }
      return true;
    } catch {
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
    const draftsFolderName = this.getDraftsFolderName(project);
    if (!draftsFolderName) return false;
    const draftFolder = `${project}/${draftsFolderName}/${draftName}`;
    try {
      const files = this.app.vault.getFiles().filter((f) => f.path.startsWith(draftFolder));
      if (createBackup) {
        await this.backupSvc.createBackup(draftFolder);
      }
      // delete original files
      for (const file of files) {
        await suppressAsync(async () => {
          await this.app.vault.delete(file);
        });
      }
      // delete the draft folder itself if it's now empty
      const folder = this.app.vault.getAbstractFileByPath(draftFolder);
      if (folder && folder instanceof TFolder) {
        await suppressAsync(async () => {
          await this.app.vault.delete(folder);
        });
      }
      return true;
    } catch {
      return false;
    }
  }

  async generateManuscript(
    projectPath: string,
    draftName: string,
    settings?: WriteAidSettings,
  ): Promise<boolean> {
    const project = this.resolveProjectPath(projectPath);
    if (!project) return false;
    const draftsFolderName = this.getDraftsFolderName(project);
    if (!draftsFolderName) return false;
    const projectType = await this.projectSvc.getProjectType(project);
    const draftFolder = `${project}/${draftsFolderName}/${draftName}`;
    if (!this.app.vault.getAbstractFileByPath(draftFolder)) {
      new Notice(`Draft folder ${draftFolder} does not exist.`);
      return false;
    }

    const manuscriptFolder = `${project}/${this.getFolderName("manuscriptsFolderName")}`;
    if (!this.app.vault.getAbstractFileByPath(manuscriptFolder)) {
      await this.app.vault.createFolder(manuscriptFolder);
    }

    // Generate manuscript filename using template
    const projectName = project.split("/").pop() || project;
    const manuscriptNameTemplate = settings?.manuscriptNameTemplate || "{{draftName}}";

    debug(
      `${DEBUG_PREFIX} DraftFileService.generateManuscript - manuscriptNameTemplate: "${manuscriptNameTemplate}"`,
    );
    debug(`${DEBUG_PREFIX} DraftFileService.generateManuscript - settings object:`, settings);

    const draftSlug = slugifyDraftName(
      draftName,
      settings?.slugStyle as import("@/core/utils").DraftSlugStyle,
    );

    const manuscriptBaseName = await this.tpl.render(manuscriptNameTemplate, {
      draftName,
      projectName,
      draftSlug,
    });
    const manuscriptPath = `${manuscriptFolder}/${manuscriptBaseName}.md`;

    let manuscriptContent = `# Manuscript for ${draftName}\n\n`;

    if (projectType === PROJECT_TYPE.SINGLE) {
      const draftFileName = `${draftSlug}.md`;
      const draftMainPath = `${draftFolder}/${draftFileName}`;
      const draftFile = this.app.vault.getAbstractFileByPath(draftMainPath);
      if (draftFile && draftFile instanceof TFile) {
        const content = await this.app.vault.read(draftFile);
        manuscriptContent += stripHeadings(stripFrontmatter(content));

        // Create or overwrite the manuscript file
        const existingFile = this.app.vault.getAbstractFileByPath(manuscriptPath);
        if (existingFile && existingFile instanceof TFile) {
          const modal = new ConfirmOverwriteModal(this.app, manuscriptPath);
          const shouldOverwrite = await modal.open();
          if (!shouldOverwrite) {
            return false; // User cancelled
          }
          debug(`${DEBUG_PREFIX} Overwriting existing manuscript: ${manuscriptPath}`);
          await this.app.vault.modify(existingFile, manuscriptContent);
        } else {
          debug(`${DEBUG_PREFIX} Creating new manuscript: ${manuscriptPath}`);
          await this.app.vault.create(manuscriptPath, manuscriptContent);
        }
      } else {
        new Notice(`Main draft file ${draftMainPath} not found.`);
        return false;
      }
    }

    return true;
  }
}

/** Remove frontmatter from a string */
function stripFrontmatter(content: string): string {
  return content.replace(/^---\n([\s\S]*?)\n---/, "").trim();
}

/** Remove top-level headings from a string */
function stripHeadings(content: string): string {
  return content.replace(/^#{1,6} .*\n/, "").trim();
}

/**
 * Update metadata in duplicated files to reflect the new draft
 */
function updateDuplicatedFileMetadata(
  content: string,
  draftName: string,
  projectName: string,
): string {
  // Check if the content has frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    return content; // No frontmatter to update
  }

  const frontmatter = fmMatch[1];
  const body = content.substring(fmMatch[0].length);

  // Split frontmatter into lines
  const lines = frontmatter.split("\n");
  const updatedLines: string[] = [];

  for (const line of lines) {
    // Update draft name
    if (line.match(/^draft:/i)) {
      updatedLines.push(`draft: ${draftName}`);
    }
    // Update project name
    else if (line.match(/^project:/i)) {
      updatedLines.push(`project: ${projectName}`);
    }
    // Update created date to current timestamp
    else if (line.match(/^created:/i)) {
      updatedLines.push(`created: ${new Date().toISOString()}`);
    }
    // Keep other lines as-is
    else {
      updatedLines.push(line);
    }
  }

  // Reconstruct the content
  const updatedFrontmatter = updatedLines.join("\n");
  return `---\n${updatedFrontmatter}\n---${body}`;
}
