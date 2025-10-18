import { ProjectFileService } from "@/core/ProjectFileService";
import { TemplateService } from "@/core/TemplateService";
import type { WriteAidManager } from "@/manager";
import type { WriteAidSettings } from "@/types";
import { App, normalizePath, Notice, TFile, TFolder } from "obsidian";
import { readMetaFile } from "./meta";
import {
  asyncFilter,
  debug,
  DEBUG_PREFIX,
  FRONTMATTER_DELIMITER,
  getDraftsFolderName,
  getManuscriptsFolderName,
  getMetaFileName,
  getOutlineFileName,
  MARKDOWN_FILE_EXTENSION,
  PROJECT_TYPE,
  type ProjectType,
} from "./utils";

export class ProjectService {
  app: App;
  manager: WriteAidManager | null;
  tpl: TemplateService;
  projectFileService: ProjectFileService;

  constructor(app: App) {
    this.app = app;
    this.manager =
      (
        this.app as unknown as {
          plugins: { getPlugin?: (id: string) => { manager?: WriteAidManager } };
        }
      ).plugins.getPlugin?.("obsidian-writeaid-plugin")?.manager ?? null;
    this.tpl = new TemplateService(app);
    this.projectFileService = new ProjectFileService(app, this);
  }

  /** Create a project folder, drafts folder and initial draft folder(s). Returns the project path. */
  async createProject(
    projectName: string,
    singleFile: boolean,
    initialDraftName?: string,
    parentFolder?: string,
    settings?: WriteAidSettings,
  ) {
    debug(
      `${DEBUG_PREFIX} createProject called: projectName=${projectName}, singleFile=${singleFile}`,
    );
    if (!projectName) {
      debug(`${DEBUG_PREFIX} createProject: project name is empty`);
      new Notice("Project name is required.");
      return null;
    }

    const projectPath =
      parentFolder && parentFolder !== "" ? `${parentFolder}/${projectName}` : projectName;
    const draftsFolder = `${projectPath}/${getDraftsFolderName(settings)}`;

    if (!this.app.vault.getAbstractFileByPath(projectPath)) {
      await this.app.vault.createFolder(projectPath);
    }

    if (!this.app.vault.getAbstractFileByPath(draftsFolder)) {
      await this.app.vault.createFolder(draftsFolder);
    }

    const metaPath = `${projectPath}/${getMetaFileName(settings)}`;
    if (!this.app.vault.getAbstractFileByPath(metaPath)) {
      const projectType = singleFile ? PROJECT_TYPE.SINGLE : PROJECT_TYPE.MULTI;
      const targetWordCount = singleFile
        ? (settings?.defaultSingleTargetWordCount ?? 20000)
        : (settings?.defaultMultiTargetWordCount ?? 50000);
      const metaContent = `${FRONTMATTER_DELIMITER}\nproject_type: ${projectType}\ntarget_word_count: ${targetWordCount}\n${FRONTMATTER_DELIMITER}\n`;
      await this.app.vault.create(metaPath, metaContent);
    }

    const draftName = initialDraftName || "Draft 1";
    await this.projectFileService.drafts.createDraft(draftName, undefined, projectPath, settings);

    return projectPath;
  }

  /** Try to open a sensible file in the project. Returns true if opened. */
  async openProject(projectPath: string) {
    const metaPath = `${projectPath}/${getMetaFileName(this.manager?.settings)}`;
    const metaFile = this.app.vault.getAbstractFileByPath(metaPath);
    if (metaFile && metaFile instanceof TFile) {
      const leaf = this.app.workspace.getLeaf();
      await leaf.openFile(metaFile);
      return true;
    }
    const outlineFileName = getOutlineFileName(this.manager?.settings);
    const candidates = [
      `${projectPath}/${projectPath}${MARKDOWN_FILE_EXTENSION}`,
      `${projectPath}/Chapter 1${MARKDOWN_FILE_EXTENSION}`,
      `${projectPath}/Chapter 01${MARKDOWN_FILE_EXTENSION}`,
      `${projectPath}/${outlineFileName}`,
      `${projectPath}/${getDraftsFolderName()}/Draft 1/${outlineFileName}`,
    ];
    for (const p of candidates) {
      const f = this.app.vault.getAbstractFileByPath(p);
      if (f && f instanceof TFile) {
        const leaf = this.app.workspace.getLeaf();
        await leaf.openFile(f);
        return true;
      }
    }
    new Notice("Could not find a file to open in the project.");
    return false;
  }

  /** List all folder paths in the vault (root represented as empty string) */
  listAllFolders(): string[] {
    const root = this.app.vault.getRoot();
    const out: string[] = [""];

    function walk(folder: TFolder) {
      for (const child of folder.children) {
        if (child instanceof TFolder) {
          out.push(child.path);
          walk(child);
        }
      }
    }

    walk(root);
    return out;
  }

  /** List all folders that look like WriteAid projects */
  async listProjects(): Promise<string[]> {
    const folders = this.listAllFolders();
    const filteredFolders = folders.filter((p) => !!p);
    debug(`${DEBUG_PREFIX} allFolders:`, folders);
    debug(`${DEBUG_PREFIX} filteredFolders:`, filteredFolders);
    const projects = await asyncFilter(filteredFolders, (p) => this.isProjectFolder(p));
    debug(
      `${DEBUG_PREFIX} found ${filteredFolders.length} folders, ${projects.length} projects:`,
      projects,
    );
    return projects;
  }

  /** Get the project type ("single-file" or "multi-file") from meta.md, or null if not found/invalid */
  async getProjectType(projectPath: string): Promise<ProjectType | null> {
    const metaPath = `${projectPath}/${getMetaFileName()}`;
    const metaContent = await readMetaFile(this.app, metaPath);
    if (metaContent && metaContent.project_type) {
      const pt = metaContent.project_type as ProjectType;
      if (Object.values(PROJECT_TYPE).includes(pt)) {
        return pt;
      }
    }
    return null;
  }

  /** Get the Drafts folder TFolder object, or null if not found */
  getDraftsFolder(projectPath: string): TFolder | null {
    // First try the configured drafts folder name
    const draftsPath = `${projectPath}/${getDraftsFolderName()}`;
    let draftsFolder = this.app.vault.getAbstractFileByPath(draftsPath);
    if (draftsFolder && draftsFolder instanceof TFolder) {
      return draftsFolder;
    }

    // If not found, try capitalized "Drafts" for backward compatibility
    const capitalizedDraftsPath = `${projectPath}/Drafts`;
    draftsFolder = this.app.vault.getAbstractFileByPath(capitalizedDraftsPath);
    if (draftsFolder && draftsFolder instanceof TFolder) {
      return draftsFolder;
    }

    return null;
  }

  /** Get the Manuscripts folder TFolder object, or null if not found */
  async getManuscriptsFolder(projectPath: string): Promise<TFolder | null> {
    const manuscriptsPath = `${projectPath}/${getManuscriptsFolderName()}`;
    const manuscriptsFolder = this.app.vault.getAbstractFileByPath(manuscriptsPath);
    if (manuscriptsFolder && manuscriptsFolder instanceof TFolder) {
      return manuscriptsFolder;
    }
    return null;
  }

  // Simple heuristic to determine whether a folder looks like a project managed by WriteAid
  // We consider a folder a project if it contains a meta.md file or a Drafts/ subfolder.
  async isProjectFolder(path: string): Promise<boolean> {
    debug(`${DEBUG_PREFIX} isProjectFolder called with path: ${path}`);
    if (!path || typeof path !== "string") {
      debug(`${DEBUG_PREFIX} isProjectFolder: invalid path`);
      return false;
    }
    const base = path.trim().replace(/\\/g, "/").replace(/\/+$/, "");
    try {
      const metaPath = normalizePath(`${base}/${getMetaFileName()}`);
      const hasMeta = await this.app.vault.adapter.exists(metaPath);

      // Check for drafts folder - try configured name first
      const draftsPath = normalizePath(`${base}/${getDraftsFolderName()}`);
      let hasDrafts = await this.app.vault.adapter.exists(draftsPath);

      // If configured name doesn't exist, check for capitalized "Drafts" for backward compatibility
      if (!hasDrafts) {
        const capitalizedDraftsPath = normalizePath(`${base}/Drafts`);
        hasDrafts = await this.app.vault.adapter.exists(capitalizedDraftsPath);
      }

      // Accept folder as project if it has meta.md OR drafts folder
      if (!hasMeta && !hasDrafts) {
        debug(`${DEBUG_PREFIX} isProjectFolder ${path}: no meta.md or drafts folder found`);
        return false;
      }

      // If it has meta.md, validate its content
      if (hasMeta) {
        try {
          // Dynamically import to avoid circular deps
          const { readMetaFile } = await import("./meta");
          const { VALID_PROJECT_TYPES } = await import("./utils");
          const meta = await readMetaFile(this.app, metaPath);
          if (
            !meta ||
            !VALID_PROJECT_TYPES.includes(meta.project_type as import("./utils").ProjectType)
          ) {
            return false;
          }
        } catch {
          // ignore
          return false;
        }
      }

      return true;
    } catch {
      // ignore
      return false;
    }
  }
}
