import { DraftService } from "@/core/DraftService";
import { TemplateService } from "@/core/TemplateService";
import type { WriteAidSettings } from "@/types";
import { App, normalizePath, Notice, TFile, TFolder } from "obsidian";

export class ProjectService {
  app: App;
  tpl: TemplateService;
  draftService: DraftService;

  constructor(app: App) {
    this.app = app;
    this.tpl = new TemplateService(app);
    this.draftService = new DraftService(app);
  }

  /** Create a project folder, drafts folder and initial draft folder(s). Returns the project path. */
  async createProject(
    projectName: string,
    singleFile: boolean,
    initialDraftName?: string,
    parentFolder?: string,
    settings?: WriteAidSettings,
  ) {
    if (!projectName) {
      new Notice("Project name is required.");
      return null;
    }

    const projectPath =
      parentFolder && parentFolder !== "" ? `${parentFolder}/${projectName}` : projectName;
    const draftsFolder = `${projectPath}/Drafts`;

    if (!this.app.vault.getAbstractFileByPath(projectPath)) {
      await this.app.vault.createFolder(projectPath);
    }

    if (!this.app.vault.getAbstractFileByPath(draftsFolder)) {
      await this.app.vault.createFolder(draftsFolder);
    }

    const metaPath = `${projectPath}/meta.md`;
    if (!this.app.vault.getAbstractFileByPath(metaPath)) {
      const projectType = singleFile ? "single-file" : "multi-file";
      const metaContent = `---\nproject_type: ${projectType}\n---\n`;
      await this.app.vault.create(metaPath, metaContent);
    }

    const draftName = initialDraftName || "Draft 1";
    await this.draftService.createDraft(draftName, undefined, projectPath, settings);

    return projectPath;
  }

  /** Try to open a sensible file in the project. Returns true if opened. */
  async openProject(projectPath: string) {
    const metaPath = `${projectPath}/meta.md`;
    const metaFile = this.app.vault.getAbstractFileByPath(metaPath);
    if (metaFile && metaFile instanceof TFile) {
      const leaf = this.app.workspace.getLeaf();
      await leaf.openFile(metaFile);
      return true;
    }
    const candidates = [
      `${projectPath}/${projectPath}.md`,
      `${projectPath}/Chapter 1.md`,
      `${projectPath}/Chapter 01.md`,
      `${projectPath}/outline.md`,
      `${projectPath}/Drafts/Draft 1/outline.md`,
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

  // Simple heuristic to determine whether a folder looks like a project managed by WriteAid
  // We consider a folder a project if it contains a meta.md or a Drafts/ subfolder.
  async isProjectFolder(path: string): Promise<boolean> {
    if (!path || typeof path !== "string") return false;
    const base = path.trim().replace(/\\/g, "/").replace(/\/+$/, "");
    try {
      const metaPath = normalizePath(`${base}/meta.md`);
      const hasMeta = await this.app.vault.adapter.exists(metaPath);
      const hasDrafts = await this.app.vault.adapter.exists(normalizePath(`${base}/Drafts`));
      if (!hasMeta || !hasDrafts) return false;

      try {
        // Dynamically import to avoid circular deps
        const { readMetaFile, VALID_PROJECT_TYPES } = await import("./meta");
        const meta = await readMetaFile(this.app, metaPath);
        if (
          !meta ||
          !VALID_PROJECT_TYPES.includes(meta.project_type as import("./meta").ProjectType)
        ) {
          return false;
        }
      } catch (_e) {
        // ignore
        return false;
      }
      return true;
    } catch (_e) {
      // ignore
      return false;
    }
  }
}
