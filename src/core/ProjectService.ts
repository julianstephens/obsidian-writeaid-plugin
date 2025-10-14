import { updateMetaStats } from "@/core/meta";
import { TemplateService } from "@/core/TemplateService";
import {
  DEFAULT_MULTI_TARGET_WORD_COUNT,
  DEFAULT_SINGLE_TARGET_WORD_COUNT,
  DEFAULT_TOTAL_DRAFTS,
  slugifyDraftName,
} from "@/core/utils";
import type { WriteAidSettings } from "@/types";
import { App, normalizePath, Notice, TFile, TFolder } from "obsidian";

export class ProjectService {
  app: App;
  tpl: TemplateService;

  constructor(app: App) {
    this.app = app;
    this.tpl = new TemplateService(app);
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

    // Create project folder if it doesn't exist
    if (!this.app.vault.getAbstractFileByPath(projectPath)) {
      await this.app.vault.createFolder(projectPath);
    }

    // Create Drafts folder
    if (!this.app.vault.getAbstractFileByPath(draftsFolder)) {
      await this.app.vault.createFolder(draftsFolder);
    }

    // Create initial draft folder
    const draftName = initialDraftName || "Draft 1";
    const newDraftFolder = `${draftsFolder}/${draftName}`;
    if (!this.app.vault.getAbstractFileByPath(newDraftFolder)) {
      await this.app.vault.createFolder(newDraftFolder);
    }

    // Optionally create sample files in the project
    const projectFileTemplate = settings?.projectFileTemplate ?? "";
    const chapterTemplate = settings?.chapterTemplate ?? "";

    // Create a meta file at the project root (matches README example)
    const metaPath = `${projectPath}/meta.md`;
    if (!this.app.vault.getAbstractFileByPath(metaPath)) {
      // Use 20,000 as the default target word count for single-file projects
      const targetWordCount = singleFile
        ? DEFAULT_SINGLE_TARGET_WORD_COUNT
        : DEFAULT_MULTI_TARGET_WORD_COUNT;
      // Initialize meta.md with proper statistics and projectType
      await updateMetaStats(this.app, projectPath, draftName, {
        total_drafts: DEFAULT_TOTAL_DRAFTS,
        target_word_count: targetWordCount, // default target
        project_type: singleFile ? "single-file" : "multi-file",
      });
    }

    // Optionally create outline.md in the initial draft folder if enabled (must be strictly true)
    if (settings?.includeDraftOutline === true) {
      const draftOutlineTemplate = settings?.draftOutlineTemplate ?? "";
      const outlineContent = await this.tpl.render(draftOutlineTemplate, { draftName });
      const outlinePath = `${newDraftFolder}/outline.md`;
      if (!this.app.vault.getAbstractFileByPath(outlinePath)) {
        await this.app.vault.create(outlinePath, outlineContent);
      }
    }

    if (singleFile) {
      // For single-file projects, only create meta.md and a draft file inside the draft folder
      const slug = slugifyDraftName(
        draftName,
        settings?.slugStyle as import("@/core/utils").DraftSlugStyle,
      );
      const draftFileName = `${slug}.md`;
      const notePath = `${newDraftFolder}/${draftFileName}`;
      if (!this.app.vault.getAbstractFileByPath(notePath)) {
        const fm = `---\ndraft: ${draftName}\nproject: ${projectName}\ncreated: ${new Date().toISOString()}\n---\n\n`;
        const projectContent = await this.tpl.render(projectFileTemplate, {
          projectName,
        });
        await this.app.vault.create(notePath, fm + projectContent);
      }
    } else {
      const chapters = ["Chapter 1.md", "Chapter 2.md"];
      for (const ch of chapters) {
        const draftNotePath = `${newDraftFolder}/${ch}`;
        if (!this.app.vault.getAbstractFileByPath(draftNotePath)) {
          await this.app.vault.create(
            draftNotePath,
            await this.tpl.render(chapterTemplate, {
              chapterTitle: ch.replace(".md", ""),
            }),
          );
        }
      }
    }

    return projectPath;
  }

  /** Try to open a sensible file in the project. Returns true if opened. */
  async openProject(projectPath: string) {
    // Always try meta.md first
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
    // Normalize path: trim whitespace and strip trailing slashes
    if (!path || typeof path !== "string") return false;
    const base = path.trim().replace(/\\/g, "/").replace(/\/+$/, "");
    try {
      const metaPath = normalizePath(`${base}/meta.md`);
      const hasMeta = await this.app.vault.adapter.exists(metaPath);
      const hasDrafts = await this.app.vault.adapter.exists(normalizePath(`${base}/Drafts`));
      if (!hasMeta || !hasDrafts) return false;

      // Check meta.md for valid project_type
      try {
        // Dynamically import to avoid circular deps
        const { readMetaFile, VALID_PROJECT_TYPES } = await import("./meta");
        const meta = await readMetaFile(this.app, metaPath);
  if (!meta || !VALID_PROJECT_TYPES.includes(meta.project_type as import("./meta").ProjectType)) {
          return false;
        }
      } catch (e) {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }
}
