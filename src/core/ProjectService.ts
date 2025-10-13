import { App, Notice, TFile, TFolder } from 'obsidian';
import { WriteAidSettings } from '../types';
import { TemplateService } from './TemplateService';

export class ProjectService {
  app: App;
  tpl: TemplateService;

  constructor(app: App) {
    this.app = app;
    this.tpl = new TemplateService(app);
  }

  /** Create a project folder, drafts folder and initial draft folder(s). Returns the project path. */
  async createProject(projectName: string, singleFile: boolean, initialDraftName?: string, parentFolder?: string, settings?: WriteAidSettings ) {
    if (!projectName) {
      new Notice('Project name is required.');
      return null;
    }

    const projectPath = parentFolder && parentFolder !== '' ? `${parentFolder}/${projectName}` : projectName;
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
    const draftName = initialDraftName || 'Draft 1';
    const newDraftFolder = `${draftsFolder}/${draftName}`;
    if (!this.app.vault.getAbstractFileByPath(newDraftFolder)) {
      await this.app.vault.createFolder(newDraftFolder);
    }

    // Optionally create sample files in the project
  const projectFileTemplate = settings?.projectFileTemplate ?? '';
  const chapterTemplate = settings?.chapterTemplate ?? '';

    if (singleFile) {
      const filePath = `${projectPath}/${projectName}.md`;
      if (!this.app.vault.getAbstractFileByPath(filePath)) {
  const content = await this.tpl.render(projectFileTemplate, { projectName });
        await this.app.vault.create(filePath, content);
      }

      // Link file to draft via frontmatter in the draft folder
      const notePath = `${newDraftFolder}/${projectName}.md`;
      if (!this.app.vault.getAbstractFileByPath(notePath)) {
        const fm = `---\ndraft: ${draftName}\nproject: ${projectName}\ncreated: ${new Date().toISOString()}\n---\n\n`;
  const projectContent = await this.tpl.render(projectFileTemplate, { projectName });
        await this.app.vault.create(notePath, fm + projectContent);
      }
    } else {
      const chapters = ['Chapter 1.md', 'Chapter 2.md'];
      for (const ch of chapters) {
        const path = `${projectPath}/${ch}`;
        if (!this.app.vault.getAbstractFileByPath(path)) {
          await this.app.vault.create(path, await this.tpl.render(chapterTemplate, { chapterTitle: ch.replace('.md','') }));
        }
        // Also copy into draft folder as starting point
        const draftNotePath = `${newDraftFolder}/${ch}`;
        if (!this.app.vault.getAbstractFileByPath(draftNotePath)) {
          await this.app.vault.create(draftNotePath, await this.tpl.render(chapterTemplate, { chapterTitle: ch.replace('.md','') }));
        }
      }
    }

    return projectPath;
  }

  /** Try to open a sensible file in the project. Returns true if opened. */
  async openProject(projectPath: string) {
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
    new Notice('Could not find a file to open in the project.');
    return false;
  }

  /** List all folder paths in the vault (root represented as empty string) */
  listAllFolders(): string[] {
    const root = this.app.vault.getRoot();
    const out: string[] = [''];

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
}
