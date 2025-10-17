import {
  debug,
  DEBUG_PREFIX,
  FRONTMATTER_DELIMITER,
  FRONTMATTER_REGEX,
  getDraftsFolderName,
  MARKDOWN_FILE_EXTENSION,
  slugifyDraftName,
  suppressAsync,
} from "@/core/utils";
import type { WriteAidManager } from "@/manager";
import type { WriteAidSettings } from "@/types";
import { App, TFile, TFolder } from "obsidian";

export class ChapterFileService {
  app: App;
  manager: WriteAidManager | null;

  constructor(app: App) {
    this.app = app;
    this.manager =
      (
        this.app as unknown as {
          plugins: { getPlugin?: (id: string) => { manager?: WriteAidManager } };
        }
      ).plugins.getPlugin?.("obsidian-writeaid-plugin")?.manager ?? null;
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
    const draftsFolderName = this.getDraftsFolderName(project);
    if (!draftsFolderName) return false;
    const draftFolder = `${project}/${draftsFolderName}/${draftName}`;
    for (let i = 0; i < newOrder.length; i++) {
      const { chapterName } = newOrder[i];
      const filePath = `${draftFolder}/${chapterName}${MARKDOWN_FILE_EXTENSION}`;
      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (file && file instanceof TFile) {
        let content = await this.app.vault.read(file);
        if (content.match(FRONTMATTER_REGEX)) {
          content = content.replace(FRONTMATTER_REGEX, (match, fm) => {
            let cleanedFm = fm.replace(/^order:.*\n?/gm, "");
            if (!cleanedFm.endsWith("\n")) cleanedFm += "\n";
            cleanedFm += `order: ${i + 1}\n`;
            return `${FRONTMATTER_DELIMITER}\n${cleanedFm}${FRONTMATTER_DELIMITER}`;
          });
          await this.app.vault.modify(file, content);
        }
      }
    }
    return true;
  }

  /**
   * List chapters for a draft in a multi-file project. Returns array of { name, chapterName? }
   */
  async listChapters(
    projectPath: string,
    draftName: string,
  ): Promise<Array<{ name: string; chapterName?: string }>> {
    debug(
      `${DEBUG_PREFIX} ChapterFileService.listChapters: projectPath=${projectPath}, draftName=${draftName}`,
    );
    const project = this.resolveProjectPath(projectPath);
    if (!project) {
      debug(`${DEBUG_PREFIX} ChapterFileService.listChapters: no project resolved`);
      return [];
    }
    // Find the drafts folder, case-insensitively
    const draftsFolderName = this.getDraftsFolderName(project);
    if (!draftsFolderName) {
      debug(
        `${DEBUG_PREFIX} ChapterFileService.listChapters: no drafts folder found in project ${project}`,
      );
      return [];
    }
    const draftFolder = `${project}/${draftsFolderName}/${draftName}`;
    debug(
      `${DEBUG_PREFIX} ChapterFileService.listChapters: resolved project=${project}, draftsFolder=${draftsFolderName}, draftFolder=${draftFolder}`,
    );
    const folder = this.app.vault.getAbstractFileByPath(draftFolder);
    const chapters: Array<{ name: string; chapterName?: string; order: number }> = [];
    if (folder && folder instanceof TFolder) {
      debug(
        `${DEBUG_PREFIX} ChapterFileService.listChapters: found folder with ${folder.children.length} children`,
      );
      for (const file of folder.children) {
        if (file instanceof TFile && file.extension === MARKDOWN_FILE_EXTENSION.slice(1)) {
          debug(`${DEBUG_PREFIX} ChapterFileService.listChapters: processing file ${file.path}`);
          await suppressAsync(async () => {
            const content = await this.app.vault.read(file);
            debug(
              `${DEBUG_PREFIX} ChapterFileService.listChapters: content length ${content.length}`,
            );
            const fmMatch = content.match(FRONTMATTER_REGEX);
            let order: number | undefined = undefined;
            let chapterName: string | undefined = undefined;
            if (fmMatch) {
              debug(`${DEBUG_PREFIX} ChapterFileService.listChapters: found frontmatter`);
              const lines = fmMatch[1].split(/\r?\n/);
              for (const line of lines) {
                const mOrder = line.match(/^order:\s*(\d+)/i);
                if (mOrder) order = parseInt(mOrder[1], 10);
                const mChapterName = line.match(/^chapter_name:\s*(.*)$/i);
                if (mChapterName) {
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
            } else {
              debug(`${DEBUG_PREFIX} ChapterFileService.listChapters: no frontmatter`);
            }
            debug(
              `${DEBUG_PREFIX} ChapterFileService.listChapters: parsed order=${order}, chapterName=${chapterName}`,
            );
            const chapName =
              chapterName && chapterName.length > 0
                ? chapterName
                : file.name.replace(new RegExp(`\\${MARKDOWN_FILE_EXTENSION}$`), "");
            const chapOrder = typeof order === "number" && !isNaN(order) ? order : 0;
            debug(
              `${DEBUG_PREFIX} ChapterFileService.listChapters: adding chapter ${file.name} with name ${chapName}, order ${chapOrder}`,
            );
            chapters.push({
              name: file.name.replace(new RegExp(`\\${MARKDOWN_FILE_EXTENSION}$`), ""),
              chapterName: chapName,
              order: chapOrder,
            });
          });
        }
      }
    } else {
      debug(`${DEBUG_PREFIX} ChapterFileService.listChapters: no folder found`);
    }
    chapters.sort((a, b) => a.order - b.order);
    debug(`${DEBUG_PREFIX} ChapterFileService.listChapters: returning ${chapters.length} chapters`);
    return chapters.map(({ name, chapterName }) => ({ name, chapterName }));
  }

  /** Create a new chapter file in a draft folder. */
  async createChapter(
    projectPath: string,
    draftName: string,
    chapterName: string,
    settings?: WriteAidSettings,
  ) {
    const project = this.resolveProjectPath(projectPath);
    if (!project) return false;
    // Find the drafts folder, case-insensitively
    const draftsFolderName = this.getDraftsFolderName(project);
    if (!draftsFolderName) return false;
    const draftFolder = `${project}/${draftsFolderName}/${draftName}`;
    const slug = slugifyDraftName(
      chapterName,
      settings?.slugStyle as import("@/core/utils").DraftSlugStyle,
    );
    const fileName = `${slug}${MARKDOWN_FILE_EXTENSION}`;
    const filePath = `${draftFolder}/${fileName}`;
    if (this.app.vault.getAbstractFileByPath(filePath)) return false;
    let maxOrder = 0;
    const folder = this.app.vault.getAbstractFileByPath(draftFolder);
    if (folder && folder instanceof TFolder) {
      for (const file of folder.children) {
        if (file instanceof TFile && file.extension === MARKDOWN_FILE_EXTENSION.slice(1)) {
          await suppressAsync(async () => {
            const content = await this.app.vault.read(file);
            const fmMatch = content.match(FRONTMATTER_REGEX);
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
          });
        }
      }
    }
    const order = maxOrder + 1;
    let title = `# ${chapterName}`;
    const frontmatter = `${FRONTMATTER_DELIMITER}\norder: ${order}\nchapter_name: ${JSON.stringify(chapterName)}\n${FRONTMATTER_DELIMITER}\n`;
    await this.app.vault.create(filePath, `${frontmatter}\n${title}\n\n`);
    return true;
  }

  /** Delete a chapter file from a draft folder. */
  async deleteChapter(projectPath: string, draftName: string, chapterName: string) {
    const project = this.resolveProjectPath(projectPath);
    if (!project) return false;
    // Find the drafts folder, case-insensitively
    const draftsFolderName = this.getDraftsFolderName(project);
    if (!draftsFolderName) return false;
    const draftFolder = `${project}/${draftsFolderName}/${draftName}`;
    const fileName = `${chapterName}${MARKDOWN_FILE_EXTENSION}`;
    const filePath = `${draftFolder}/${fileName}`;
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file && file instanceof TFile) {
      await this.app.vault.delete(file);
      // After deletion, reassign order for all remaining chapters using listChapters
      const chapters = await this.listChapters(projectPath, draftName);
      for (let i = 0; i < chapters.length; i++) {
        const { name } = chapters[i];
        const chapterFilePath = `${draftFolder}/${name}${MARKDOWN_FILE_EXTENSION}`;
        const chapterFile = this.app.vault.getAbstractFileByPath(chapterFilePath);
        if (chapterFile && chapterFile instanceof TFile) {
          let content = await this.app.vault.read(chapterFile);
          if (content.match(FRONTMATTER_REGEX)) {
            content = content.replace(FRONTMATTER_REGEX, (match, fm) => {
              let cleanedFm = fm.replace(/^order:.*\n?/gm, "");
              if (!cleanedFm.endsWith("\n")) cleanedFm += "\n";
              cleanedFm += `order: ${i + 1}\n`;
              return `${FRONTMATTER_DELIMITER}\n${cleanedFm}${FRONTMATTER_DELIMITER}`;
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
    // Find the drafts folder, case-insensitively
    const draftsFolderName = this.getDraftsFolderName(project);
    if (!draftsFolderName) return false;
    const draftFolder = `${project}/${draftsFolderName}/${draftName}`;
    const oldFile = `${draftFolder}/${oldName}${MARKDOWN_FILE_EXTENSION}`;
    const newFile = `${draftFolder}/${newName}${MARKDOWN_FILE_EXTENSION}`;
    const file = this.app.vault.getAbstractFileByPath(oldFile);
    if (!file || !(file instanceof TFile)) return false;
    let content = await this.app.vault.read(file);
    let title = `# ${newName}`;

    if (content.match(FRONTMATTER_REGEX)) {
      content = content.replace(FRONTMATTER_REGEX, (match, fm) => {
        let cleanedFm = fm.replace(/^chapter_name:.*\n?/gm, "");
        if (!cleanedFm.endsWith("\n")) cleanedFm += "\n";
        cleanedFm += `chapter_name: ${JSON.stringify(newName)}\n`;
        return `${FRONTMATTER_DELIMITER}\n${cleanedFm}${FRONTMATTER_DELIMITER}`;
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

  /**
   * Open a chapter file in Obsidian.
   * @param projectPath The project path
   * @param draftName The draft name
   * @param chapterName The chapter name
   * @returns true if the file was opened successfully
   */
  async openChapter(
    projectPath: string | undefined,
    draftName: string,
    chapterName: string,
  ): Promise<boolean> {
    const project = this.resolveProjectPath(projectPath);
    if (!project) return false;
    const draftsFolderName = this.getDraftsFolderName(project);
    if (!draftsFolderName) return false;
    const filePath = `${project}/${draftsFolderName}/${draftName}/${chapterName}${MARKDOWN_FILE_EXTENSION}`;
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file && file instanceof TFile) {
      await suppressAsync(async () => {
        const leaf = this.app.workspace.getLeaf();
        await leaf.openFile(file);
      });
      return true;
    }
    return false;
  }

  private resolveProjectPath(projectPath?: string): string | null {
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
}
