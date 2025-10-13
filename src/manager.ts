import { App, Notice, TFile } from "obsidian";
import { DraftService } from './core/DraftService';
import { ProjectService } from './core/ProjectService';
import { TemplateService } from './core/TemplateService';
import { PluginLike, WriteAidSettings } from './types';

import { ConfirmExistingProjectModal } from './ui/modals/ConfirmExistingProjectModal';
import { ConvertIndexModal } from './ui/modals/ConvertIndexModal';
import { CreateDraftModal } from './ui/modals/CreateDraftModal';
import { CreateProjectModal } from './ui/modals/CreateProjectModal';
import { PostCreateModal } from './ui/modals/PostCreateModal';
import { SelectProjectModal } from './ui/modals/SelectProjectModal';
import { SwitchDraftModal } from './ui/modals/SwitchDraftModal';

export class WriteAidManager {
  app: App;
  activeDraft: string | null = null;
  plugin?: PluginLike;
  settings?: WriteAidSettings;
  projectService: ProjectService;
  draftService: DraftService;

  constructor(app: App, plugin?: PluginLike) {
    this.app = app;
    this.plugin = plugin;
    this.settings = plugin?.settings;
    this.projectService = new ProjectService(app);
    this.draftService = new DraftService(app);
  }

  async createNewProjectPrompt() {
    new CreateProjectModal(
      this.app,
      async (
        projectName: string,
        singleFile: boolean,
        initialDraftName?: string,
        parentFolder?: string,
      ) => {
        if (!projectName) {
          new Notice("Project name is required.");
          return;
        }

        const fullPath = parentFolder && parentFolder !== "" ? `${parentFolder}/${projectName}` : projectName;
        const existing = this.app.vault.getAbstractFileByPath(fullPath);
        if (existing) {
          // Ask user what to do: open existing, create anyway, or cancel
          new ConfirmExistingProjectModal(
            this.app,
            fullPath,
            async (createAnyway: boolean) => {
              if (createAnyway) {
                await this.createNewProject(projectName, singleFile, initialDraftName, parentFolder);
                new PostCreateModal(this.app, fullPath, async () => await this.openProject(fullPath)).open();
              }
            },
            async () => {
              // open existing project
              await this.openProject(fullPath);
            },
          ).open();
        } else {
          await this.createNewProject(projectName, singleFile, initialDraftName, parentFolder);
          new PostCreateModal(this.app, fullPath, async () => await this.openProject(fullPath)).open();
        }
      },
    ).open();
  }

  async openProject(projectPath: string) {
    return await this.projectService.openProject(projectPath);
  }

  async createNewProject(projectName: string, singleFile: boolean, initialDraftName?: string, parentFolder?: string) {
    return await this.projectService.createProject(projectName, singleFile, initialDraftName, parentFolder, this.settings);
  }

  // Helper to list all folder paths in the vault for the parent-folder chooser
  listAllFolders(): string[] {
    return this.projectService.listAllFolders();
  }

  async convertIndexToPlanningPrompt() {
    new ConvertIndexModal(this.app, {
      folders: this.listAllFolders(),
      onSubmit: async (projectPath: string, asChecklist: boolean) => {
        await this.convertIndexToPlanning(projectPath, asChecklist);
        new Notice(`Planning document created for ${projectPath}`);
      },
    }).open();
  }

  async convertIndexToPlanning(projectPath: string, asChecklist = true) {
    // Locate index file: projectName.md or outline.md
    const projectName = projectPath.split('/').pop() || projectPath;
    const candidates = [
      `${projectPath}/${projectName}.md`,
      `${projectPath}/outline.md`,
    ];
    let sourceFile: TFile | null = null;
    for (const c of candidates) {
      const f = this.app.vault.getAbstractFileByPath(c);
      if (f && f instanceof TFile) {
        sourceFile = f;
        break;
      }
    }

    if (!sourceFile) {
      new Notice('No index or outline file found for project ' + projectPath);
      return;
    }

    const content = await this.app.vault.read(sourceFile);

    // Simple transform: extract H1/H2 headings and create planning sections
    const lines = content.split(/\r?\n/);
    const autoPlanLines: string[] = [];
    autoPlanLines.push(`# Planning: ${projectName}`);
    autoPlanLines.push('');

    for (const line of lines) {
      const m = line.match(/^(#{1,3})\s+(.*)/);
      if (m) {
        const level = m[1].length;
        const text = m[2].trim();
        if (asChecklist && level <= 2) {
          autoPlanLines.push(`- [ ] ${text}`);
        } else if (level <= 2) {
          autoPlanLines.push(`## ${text}`);
        } else {
          autoPlanLines.push(`${'  '.repeat(level-3)}- ${text}`);
        }
      }
    }

  const planningTemplateSetting = this.settings?.planningTemplate || `{{content}}`;
  const tplSvc = new TemplateService(this.app);

    // If the template contains a {{content}} placeholder we'll inject the autoPlan
    let finalContent = await tplSvc.render(planningTemplateSetting, { projectName });
    if (finalContent.includes('{{content}}')) {
      finalContent = finalContent.replace(/{{\s*content\s*}}/g, autoPlanLines.join('\n'));
    }

    const outPath = `${projectPath}/Planning.md`;
    await this.app.vault.create(outPath, finalContent);
  }

  async createNewDraftPrompt() {
    // First ask the user which project to create the draft for
    new SelectProjectModal(this.app, {
      folders: this.listAllFolders(),
      onSubmit: async (projectPath: string) => {
        new CreateDraftModal(this.app, {
          suggestedName: this.suggestNextDraftName(projectPath),
          drafts: this.listDrafts(projectPath),
          projectPath,
          onSubmit: async (draftName: string, copyFrom?: string) => {
            await this.draftService.createDraft(draftName, copyFrom, projectPath, this.settings);
            new Notice(`Draft "${draftName}" created in ${projectPath}.`);
          },
        }).open();
      },
    }).open();
  }

  async switchDraftPrompt() {
    const drafts = this.listDrafts();
    if (drafts.length === 0) {
      new Notice("No drafts found in the current project.");
      return;
    }
    new SwitchDraftModal(this.app, drafts, (draftName: string) => {
      this.activeDraft = draftName;
      new Notice(`Switched to draft: ${draftName}`);
    }).open();
  }

  async createNewDraft(draftName: string, copyFromDraft?: string, projectPath?: string) {
    return await this.draftService.createDraft(draftName, copyFromDraft, projectPath, this.settings);
  }

  listDrafts(projectPath?: string): string[] {
    return this.draftService.listDrafts(projectPath);
  }

  suggestNextDraftName(projectPath?: string): string {
    return this.draftService.suggestNextDraftName(projectPath);
  }

  

  getCurrentProjectPath(): string | null {
    // Naive: Use the current active file's parent folder as the project folder
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return null;
    const folder = activeFile.parent;
    return folder ? folder.path : null;
  }

}

