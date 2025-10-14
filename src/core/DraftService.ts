import { updateMetaStats } from "@/core/meta";
import { TemplateService } from "@/core/TemplateService";
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
      const draftOutlineTemplate = settings?.draftOutlineTemplate ?? "";
      const outlineContent = await this.tpl.render(draftOutlineTemplate, {
        draftName,
      });
      await this.app.vault.create(`${newDraftFolder}/outline.md`, outlineContent);

      // If the project is single-file (detected by presence of <projectName>.md or meta.md),
      // also create a main draft file inside the draft folder (e.g., draft1.md)
      const projectName = projectPathResolved.split("/").pop() || projectPathResolved;
      const singleFileCandidate = `${projectPathResolved}/${projectName}.md`;
      const metaCandidate = `${projectPathResolved}/meta.md`;
      const isSingleFileProject =
        !!this.app.vault.getAbstractFileByPath(singleFileCandidate) ||
        !!this.app.vault.getAbstractFileByPath(metaCandidate);

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

  suggestNextDraftName(projectPath?: string): string {
    const drafts = this.listDrafts(projectPath);
    // find highest Draft N
    let max = 0;
    for (const d of drafts) {
      const m = d.match(/^Draft\s*(\d+)$/i);
      if (m) {
        const n = parseInt(m[1], 10);
        if (!isNaN(n) && n > max) max = n;
      }
    }
    const next = max + 1 || 1;
    return `Draft ${next}`;
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
      for (const file of files) {
        const rel = file.path.substring(oldFolder.length + 1);
        const dest = `${newFolder}/${rel}`;
        const content = await this.app.vault.read(file);
        await this.app.vault.create(dest, content);
        await this.app.vault.delete(file);
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
