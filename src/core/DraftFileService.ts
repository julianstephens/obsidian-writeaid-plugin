import { TemplateService } from "@/core/TemplateService";
import { readMetaFile, updateMetaStats } from "@/core/meta";
import {
  countWords,
  debug,
  DEBUG_PREFIX,
  FRONTMATTER_DELIMITER,
  FRONTMATTER_REGEX,
  generateDraftId,
  getDraftsFolderName,
  getManuscriptsFolderName,
  getMetaFileName,
  getOutlineFileName,
  MARKDOWN_FILE_EXTENSION,
  PROJECT_TYPE,
  slugifyDraftName,
  suppressAsync,
} from "@/core/utils";
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

  constructor(
    app: App,
    chapters: ChapterFileService,
    projectSvc: ProjectService,
    backupSvc: BackupService,
  ) {
    this.app = app;
    this.tpl = new TemplateService(app);
    this.projectSvc = projectSvc;
    this.backupSvc = backupSvc;
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

  private getDraftsFolderName(project: string): string | null {
    const projectFolder = this.app.vault.getAbstractFileByPath(project);
    const draftsName = getDraftsFolderName(this.manager?.settings);
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
    const metaPath = `${project}/${getMetaFileName(this.manager?.settings)}`;
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
    debug(
      `${DEBUG_PREFIX} createDraft called with draftName: ${draftName}, copyFromDraft: ${copyFromDraft}`,
    );
    const projectPathResolved = this.resolveProjectPath(projectPath);
    if (!projectPathResolved) {
      debug(`${DEBUG_PREFIX} createDraft: no project path resolved`);
      new Notice("No project folder detected. Please open a folder named after your project.");
      return;
    }

    // Check for existing drafts folder (handles legacy "Drafts" vs standard "drafts")
    const existingDraftsFolderName = this.getDraftsFolderName(projectPathResolved);
    const draftsFolderName =
      existingDraftsFolderName || getDraftsFolderName(this.manager?.settings);
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
      debug(`${DEBUG_PREFIX} createDraft: copying from draft ${copyFromDraft}`);
      const sourceFolder = `${draftsFolder}/${copyFromDraft}`;
      const files = this.app.vault.getFiles().filter((file) => file.path.startsWith(sourceFolder));

      // Check if this might be a single-file project by looking for the main draft file
      const sourceSlug = slugifyDraftName(
        copyFromDraft,
        settings?.slugStyle as import("@/core/utils").DraftSlugStyle,
      );
      const expectedSourceFile = `${sourceSlug}${MARKDOWN_FILE_EXTENSION}`;

      for (const file of files) {
        let relPath = file.path.substring(sourceFolder.length + 1);

        // If this is the main draft file for a single-file project, rename it
        if (relPath === expectedSourceFile) {
          const newSlug = slugifyDraftName(
            draftName,
            settings?.slugStyle as import("@/core/utils").DraftSlugStyle,
          );
          relPath = `${newSlug}${MARKDOWN_FILE_EXTENSION}`;
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
        const outlineTemplate = settings?.outlineTemplate ?? "";
        const outlineContent = await this.tpl.render(outlineTemplate, {
          draftName,
        });
        await this.app.vault.create(
          `${newDraftFolder}/${getOutlineFileName(this.manager?.settings)}`,
          outlineContent,
        );
      }

      // Determine project type
      const projectType = await this.projectSvc.getProjectType(projectPathResolved);
      const isSingleFileProject = projectType === PROJECT_TYPE.SINGLE;

      if (isSingleFileProject) {
        const slug = slugifyDraftName(
          draftName,
          settings?.slugStyle as import("@/core/utils").DraftSlugStyle,
        );
        const draftFileName = `${slug}${MARKDOWN_FILE_EXTENSION}`;
        const draftMainPath = `${newDraftFolder}/${draftFileName}`;
        if (!this.app.vault.getAbstractFileByPath(draftMainPath)) {
          const draftId = generateDraftId();
          const fm = `${FRONTMATTER_DELIMITER}\ndraft: ${draftName}\nid: ${draftId}\nproject: ${projectName}\ncreated: ${new Date().toISOString()}\n${FRONTMATTER_DELIMITER}\n\n`;
          const projectContent = await this.tpl.render("# {{draftName}}", {
            draftName,
          });
          await this.app.vault.create(draftMainPath, fm + projectContent);
        }
      } else {
        // Multi-file project: ensure at least one valid chapter exists
        const folder = this.app.vault.getAbstractFileByPath(newDraftFolder);
        let hasValidChapter = false;
        if (folder && folder instanceof TFolder) {
          for (const file of folder.children) {
            if (file instanceof TFile && file.extension === MARKDOWN_FILE_EXTENSION.slice(1)) {
              await suppressAsync(async () => {
                const content = await this.app.vault.read(file);
                // Check if this is a valid chapter (has all required fields: id, order, chapter_name)
                if (this.chapters.isValidChapter(content)) {
                  hasValidChapter = true;
                }
              });
              if (hasValidChapter) break;
            }
          }
        }
        if (!hasValidChapter) {
          // Create Chapter 1 with a draft ID
          const draftId = generateDraftId();
          await this.chapters.createChapter(
            projectPathResolved,
            draftName,
            "Chapter 1",
            settings,
            draftId,
          );
        }
      }
    }

    await updateMetaStats(
      this.app,
      projectPathResolved,
      draftName,
      undefined,
      this.manager?.settings,
    );
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
   * Get the draft ID from a draft folder by reading the frontmatter of any markdown file.
   * Returns null if the draft ID cannot be found.
   */
  async getDraftId(draftFolderPath: string): Promise<string | null> {
    debug(`${DEBUG_PREFIX} getDraftId called for draftFolder: ${draftFolderPath}`);
    try {
      const files = this.app.vault.getFiles().filter((f) => f.path.startsWith(draftFolderPath));
      for (const file of files) {
        if (file.extension === MARKDOWN_FILE_EXTENSION.slice(1)) {
          const content = await this.app.vault.read(file);
          const fmMatch = content.match(FRONTMATTER_REGEX);
          if (fmMatch) {
            const frontmatter = fmMatch[1];
            const idMatch = frontmatter.match(/^id:\s*(.+?)$/m);
            if (idMatch) {
              const draftId = idMatch[1].trim();
              debug(`${DEBUG_PREFIX} getDraftId found: ${draftId}`);
              return draftId;
            }
          }
        }
      }
      debug(`${DEBUG_PREFIX} getDraftId: no draft ID found in ${draftFolderPath}`);
      return null;
    } catch (error) {
      debug(`${DEBUG_PREFIX} getDraftId error:`, error);
      return null;
    }
  }

  /**
   * Ensure all chapters in a draft have the draft ID in their frontmatter.
   * This is useful for multi-file projects where chapters may not have been created with a draft ID.
   */
  async ensureChaptersDraftId(projectPath: string, draftName: string): Promise<void> {
    const project = this.resolveProjectPath(projectPath);
    if (!project) return;
    const draftsFolderName = this.getDraftsFolderName(project);
    if (!draftsFolderName) return;

    const draftFolder = `${project}/${draftsFolderName}/${draftName}`;
    const draftId = await this.getDraftId(draftFolder);
    if (!draftId) {
      debug(`${DEBUG_PREFIX} ensureChaptersDraftId: no draft ID found for draft ${draftName}`);
      return;
    }

    try {
      const files = this.app.vault.getFiles().filter((f) => f.path.startsWith(draftFolder));
      for (const file of files) {
        if (file.extension === MARKDOWN_FILE_EXTENSION.slice(1)) {
          const content = await this.app.vault.read(file);
          const fmMatch = content.match(FRONTMATTER_REGEX);
          if (fmMatch) {
            const frontmatter = fmMatch[1];
            // Check if the chapter already has an id
            if (!frontmatter.match(/^id:\s*/m)) {
              // Add the draft ID to the frontmatter
              const body = content.substring(fmMatch[0].length);
              const lines = frontmatter.split("\n");
              lines.push(`id: ${draftId}`);
              const updatedFrontmatter = lines.join("\n");
              const updatedContent = `${FRONTMATTER_DELIMITER}\n${updatedFrontmatter}\n${FRONTMATTER_DELIMITER}${body}`;
              await this.app.vault.modify(file, updatedContent);
              debug(`${DEBUG_PREFIX} ensureChaptersDraftId: added draft ID to ${file.path}`);
            }
          }
        }
      }
    } catch (error) {
      debug(`${DEBUG_PREFIX} ensureChaptersDraftId error:`, error);
    }
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

    // Check project type to determine what file to open
    const metaPath = `${project}/${getMetaFileName(this.manager?.settings)}`;
    const metadata = await readMetaFile(this.app, metaPath);
    const projectType = metadata?.project_type || PROJECT_TYPE.MULTI;

    if (projectType === PROJECT_TYPE.SINGLE) {
      // Single-file project: open the main draft file
      const slug = slugifyDraftName(draftName, this.manager?.settings?.slugStyle);
      const draftFilePath = `${project}/${draftsFolderName}/${draftName}/${slug}${MARKDOWN_FILE_EXTENSION}`;
      const draftFile = this.app.vault.getAbstractFileByPath(draftFilePath);

      if (draftFile && draftFile instanceof TFile) {
        const leaf = this.app.workspace.getLeaf();
        await leaf.openFile(draftFile);
        return true;
      }
    } else {
      // Multi-file project: open the most recent chapter
      const chapters = await this.chapters.listChapters(project, draftName);
      if (chapters.length > 0) {
        // The last chapter in the sorted list is the most recent
        const mostRecentChapter = chapters[chapters.length - 1];
        const chapterFilePath = `${project}/${draftsFolderName}/${draftName}/${mostRecentChapter.name}${MARKDOWN_FILE_EXTENSION}`;
        const chapterFile = this.app.vault.getAbstractFileByPath(chapterFilePath);

        if (chapterFile && chapterFile instanceof TFile) {
          const leaf = this.app.workspace.getLeaf();
          await leaf.openFile(chapterFile);
          return true;
        }
      }
    }

    // Fallback: try to open outline file if it exists
    const outlinePath = `${project}/${draftsFolderName}/${draftName}/${getOutlineFileName(this.manager?.settings)}`;
    const outlineFile = this.app.vault.getAbstractFileByPath(outlinePath);
    if (outlineFile && outlineFile instanceof TFile) {
      const leaf = this.app.workspace.getLeaf();
      await leaf.openFile(outlineFile);
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
    debug(
      `${DEBUG_PREFIX} renameDraft called: ${oldName} -> ${newName}, renameFile: ${renameFile}`,
    );
    const project = this.resolveProjectPath(projectPath);
    if (!project) {
      debug(`${DEBUG_PREFIX} renameDraft: no project resolved`);
      return false;
    }
    const draftsFolderName = this.getDraftsFolderName(project);
    if (!draftsFolderName) {
      debug(`${DEBUG_PREFIX} renameDraft: no drafts folder found`);
      return false;
    }
    const oldFolder = `${project}/${draftsFolderName}/${oldName}`;
    const newFolder = `${project}/${draftsFolderName}/${newName}`;
    try {
      // create new folder if needed
      if (!this.app.vault.getAbstractFileByPath(newFolder)) {
        await this.app.vault.createFolder(newFolder);
      }
      const files = this.app.vault.getFiles().filter((f) => f.path.startsWith(oldFolder));

      // Compute slugs for main draft file
      let newSlug = "";
      if (renameFile) {
        const slugStyle = settings?.slugStyle;
        newSlug = slugifyDraftName(newName, slugStyle);
      }

      // Find the main draft file (any .md file directly in the draft folder, not in subfolders)
      let mainDraftFile: TFile | null = null;
      for (const file of files) {
        const rel = file.path.substring(oldFolder.length + 1);
        // Check if file is directly in the draft folder (no path separators)
        if (file.extension === MARKDOWN_FILE_EXTENSION.slice(1) && !rel.includes("/")) {
          mainDraftFile = file;
          break;
        }
      }

      for (const file of files) {
        let rel = file.path.substring(oldFolder.length + 1);
        let dest = `${newFolder}/${rel}`;

        // If this is the main draft file and renameFile is true, rename it to the new slug
        if (renameFile && newSlug && file === mainDraftFile && !rel.includes("/")) {
          rel = `${newSlug}${MARKDOWN_FILE_EXTENSION}`;
          dest = `${newFolder}/${rel}`;
        }

        let content = await this.app.vault.read(file);
        // If this is a Markdown file, update its frontmatter draft property
        if (file.extension === MARKDOWN_FILE_EXTENSION.slice(1)) {
          // Replace or insert draft: <newName> in YAML frontmatter
          content = content.replace(
            new RegExp(`^(${FRONTMATTER_DELIMITER}\\s*\\n[\\s\\S]*?\\n)(draft:.*\\n)?`, "m"),
            (match, p1) => {
              // Remove any existing draft: line
              let fm = p1.replace(/^draft:.*\n/m, "");
              // Insert new draft line after ---\n
              // If there's already a draft: line, replace it; otherwise, insert after ---\n
              return fm.replace(
                new RegExp(`^(${FRONTMATTER_DELIMITER}\\s*\\n)`),
                `$1draft: ${newName}\n`,
              );
            },
          );
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
        await import("./meta").then((meta) =>
          meta.updateMetaStats(this.app, project, newName, undefined, this.manager?.settings),
        );
      });

      // Update meta.md in the renamed draft folder if it exists
      const draftMetaPath = `${newFolder}/${getMetaFileName(this.manager?.settings)}`;
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
   * Delete a draft folder. If createBackup is true, copy the draft folder to .writeaid-backups using draft ID before deleting.
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
        // Get the draft ID before deleting
        const draftId = await this.getDraftId(draftFolder);
        if (draftId) {
          await this.backupSvc.createBackup(draftFolder, draftId, this.manager?.settings);
        }
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

    const manuscriptFolder = `${project}/${getManuscriptsFolderName(this.manager?.settings)}`;
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
    const manuscriptPath = `${manuscriptFolder}/${manuscriptBaseName}${MARKDOWN_FILE_EXTENSION}`;

    let manuscriptContent = `# Manuscript for ${draftName}\n\n`;

    if (projectType === PROJECT_TYPE.SINGLE) {
      const draftFileName = `${draftSlug}${MARKDOWN_FILE_EXTENSION}`;
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

  /**
   * Get the outline file for a draft, if it exists.
   */
  getOutlineFile(projectPath: string, draftName: string): TFile | null {
    const project = this.resolveProjectPath(projectPath);
    if (!project) return null;
    const draftsFolderName = this.getDraftsFolderName(project);
    if (!draftsFolderName) return null;
    const outlinePath = `${project}/${draftsFolderName}/${draftName}/${getOutlineFileName(this.manager?.settings)}`;
    const outlineFile = this.app.vault.getAbstractFileByPath(outlinePath);
    return outlineFile && outlineFile instanceof TFile ? outlineFile : null;
  }

  /**
   * Create an outline file for a draft using the outline template.
   */
  async createOutline(projectPath: string, draftName: string, template: string): Promise<void> {
    const project = this.resolveProjectPath(projectPath);
    if (!project) throw new Error("Project not found");
    const draftsFolderName = this.getDraftsFolderName(project);
    if (!draftsFolderName) throw new Error("Drafts folder not found");
    const draftFolder = `${project}/${draftsFolderName}/${draftName}`;
    const outlinePath = `${draftFolder}/${getOutlineFileName(this.manager?.settings)}`;

    // Check if outline already exists
    const existingFile = this.app.vault.getAbstractFileByPath(outlinePath);
    if (existingFile) {
      throw new Error("Outline file already exists");
    }

    // Render the template
    const outlineContent = await this.tpl.render(template, { draftName });

    // Create the outline file
    await this.app.vault.create(outlinePath, outlineContent);
  }

  /**
   * Calculate the total word count for a draft.
   * For multi-file projects: sums word counts from all valid chapter files
   * For single-file projects: counts words in the draft file
   */
  async calculateDraftWordCount(projectPath: string, draftName: string): Promise<number> {
    const project = this.resolveProjectPath(projectPath);
    if (!project) {
      debug(`${DEBUG_PREFIX} No project path found for word count calculation`);
      return 0;
    }

    try {
      const draftsFolderName = this.getDraftsFolderName(project);
      if (!draftsFolderName) {
        debug(`${DEBUG_PREFIX} No drafts folder found in project`);
        return 0;
      }

      const draftFolder = `${project}/${draftsFolderName}/${draftName}`;
      const projectFolder = this.app.vault.getAbstractFileByPath(project);
      if (!projectFolder || !(projectFolder instanceof TFolder)) {
        debug(`${DEBUG_PREFIX} Project folder not found at: ${project}`);
        return 0;
      }

      // Check project type
      const metaPath = `${project}/${getMetaFileName(this.manager?.settings)}`;
      const metadata = await readMetaFile(this.app, metaPath);
      const projectType = metadata?.project_type || PROJECT_TYPE.MULTI;
      debug(
        `${DEBUG_PREFIX} Calculating word count for ${projectType} project, draft: ${draftName}`,
      );

      if (projectType === PROJECT_TYPE.SINGLE) {
        // Single-file project: count words in the main draft file
        const slug = slugifyDraftName(draftName, this.manager?.settings?.slugStyle);
        const draftFilePath = `${draftFolder}/${slug}${MARKDOWN_FILE_EXTENSION}`;
        const draftFile = this.app.vault.getAbstractFileByPath(draftFilePath);
        debug(`${DEBUG_PREFIX} Looking for single-file draft at: ${draftFilePath}`);

        if (draftFile && draftFile instanceof TFile) {
          const content = await this.app.vault.read(draftFile);
          const bodyContent = stripFrontmatter(content);
          const wordCount = countWords(bodyContent);
          debug(`${DEBUG_PREFIX} Single-file draft word count: ${wordCount}`);
          return wordCount;
        }
        debug(`${DEBUG_PREFIX} Draft file not found for single-file project`);
      } else {
        // Multi-file project: sum word counts from all valid chapter files
        const draftFolderObj = this.app.vault.getAbstractFileByPath(draftFolder);
        if (!draftFolderObj || !(draftFolderObj instanceof TFolder)) {
          debug(`${DEBUG_PREFIX} Draft folder not found at: ${draftFolder}`);
          return 0;
        }

        let totalWords = 0;
        for (const file of draftFolderObj.children) {
          if (file instanceof TFile && file.extension === "md") {
            const content = await this.app.vault.read(file);
            // Only count valid chapters (have all required fields: id, order, chapter_name)
            if (this.chapters.isValidChapter(content)) {
              const bodyContent = stripFrontmatter(content);
              const wordCount = countWords(bodyContent);
              debug(`${DEBUG_PREFIX} Chapter "${file.name}" word count: ${wordCount}`);
              totalWords += wordCount;
            }
          }
        }
        debug(`${DEBUG_PREFIX} Multi-file draft total word count: ${totalWords}`);
        return totalWords;
      }
    } catch (error) {
      debug(`${DEBUG_PREFIX} Error calculating draft word count:`, error);
    }

    return 0;
  }
}

/** Remove frontmatter from a string */
function stripFrontmatter(content: string): string {
  return content.replace(FRONTMATTER_REGEX, "").trim();
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
  const fmMatch = content.match(FRONTMATTER_REGEX);
  if (!fmMatch) {
    return content; // No frontmatter to update
  }

  const frontmatter = fmMatch[1];
  const body = content.substring(fmMatch[0].length);

  // Split frontmatter into lines
  const lines = frontmatter.split("\n");
  const updatedLines: string[] = [];
  let hasId = false;

  for (const line of lines) {
    // Update draft name
    if (line.match(/^draft:/i)) {
      updatedLines.push(`draft: ${draftName}`);
    }
    // Generate a new draft ID for the duplicate
    else if (line.match(/^id:/i)) {
      updatedLines.push(`id: ${generateDraftId()}`);
      hasId = true;
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

  // If there was no id in the frontmatter, add one
  if (!hasId) {
    updatedLines.push(`id: ${generateDraftId()}`);
  }

  // Reconstruct the content
  const updatedFrontmatter = updatedLines.join("\n");
  return `${FRONTMATTER_DELIMITER}\n${updatedFrontmatter}\n${FRONTMATTER_DELIMITER}${body}`;
}
