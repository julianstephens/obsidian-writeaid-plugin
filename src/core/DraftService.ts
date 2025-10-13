import { App, Notice, TFolder } from 'obsidian';
import { WriteAidSettings } from '../types';
import { updateMetaStats } from './meta';
import { TemplateService } from './TemplateService';
import { slugifyDraftName } from './utils';

export class DraftService {
  app: App;
  tpl: TemplateService;

  constructor(app: App) {
    this.app = app;
    this.tpl = new TemplateService(app);
  }

  private resolveProjectPath(projectPath?: string): string | null {
    if (projectPath && projectPath !== '') return projectPath;
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return null;
    const folder = activeFile.parent;
    return folder ? folder.path : null;
  }

  async createDraft(draftName: string, copyFromDraft?: string, projectPath?: string, settings?: WriteAidSettings) {
    const projectPathResolved = this.resolveProjectPath(projectPath);
    if (!projectPathResolved) {
      new Notice('No project folder detected. Please open a folder named after your project.');
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
      const files = this.app.vault
        .getFiles()
        .filter((file) => file.path.startsWith(sourceFolder));
      for (const file of files) {
        const relPath = file.path.substring(sourceFolder.length + 1);
        const destPath = `${newDraftFolder}/${relPath}`;
        const content = await this.app.vault.read(file);
        await this.app.vault.create(destPath, content);
      }
    } else {
      const draftOutlineTemplate = settings?.draftOutlineTemplate ?? '';
      const outlineContent = await this.tpl.render(draftOutlineTemplate, { draftName });
      await this.app.vault.create(`${newDraftFolder}/outline.md`, outlineContent);
      
        // If the project is single-file (detected by presence of <projectName>.md or meta.md),
        // also create a main draft file inside the draft folder (e.g., draft1.md)
        const projectName = projectPathResolved.split('/').pop() || projectPathResolved;
        const singleFileCandidate = `${projectPathResolved}/${projectName}.md`;
        const metaCandidate = `${projectPathResolved}/meta.md`;
        const isSingleFileProject = !!this.app.vault.getAbstractFileByPath(singleFileCandidate) || !!this.app.vault.getAbstractFileByPath(metaCandidate);

        if (isSingleFileProject) {
          const slug = slugifyDraftName(draftName, settings?.slugStyle as any);
          const draftFileName = `${slug}.md`;
          const draftMainPath = `${newDraftFolder}/${draftFileName}`;
          if (!this.app.vault.getAbstractFileByPath(draftMainPath)) {
            const fm = `---\ndraft: ${draftName}\nproject: ${projectName}\ncreated: ${new Date().toISOString()}\n---\n\n`;
            const projectContent = await this.tpl.render(settings?.projectFileTemplate ?? '', { projectName });
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
        .filter((child) => child instanceof TFolder)
        .map((child: any) => child.name);
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
}
