import { updateMetaStats } from "@/core/meta";
import { ProjectFileService } from "@/core/ProjectFileService";
import { ProjectService } from "@/core/ProjectService";
import { APP_NAME, asyncFilter, debug, DEBUG_PREFIX, suppress, suppressAsync } from "@/core/utils";
import type { PluginLike, WriteAidSettings } from "@/types";
import { App, Notice } from "obsidian";

import { ConfirmExistingProjectModal } from "@/ui/modals/ConfirmExistingProjectModal";
import { CreateDraftModal } from "@/ui/modals/CreateDraftModal";
import { CreateProjectModal } from "@/ui/modals/CreateProjectModal";
import { SelectProjectModal } from "@/ui/modals/SelectProjectModal";
import { SwitchDraftModal } from "@/ui/modals/SwitchDraftModal";

export class WriteAidManager {
  app: App;
  activeDraft: string | null = null;
  activeProject: string | null = null;
  private activeProjectListeners: Array<(p: string | null) => void> = [];
  private activeDraftListeners: Array<(d: string | null) => void> = [];
  private panelRefreshListeners: Array<() => void> = [];
  private _panelRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  private _panelRefreshDebounceMs: number = 250;
  plugin?: PluginLike;
  settings?: WriteAidSettings;
  projectService: ProjectService;
  projectFileService: ProjectFileService;

  /**
   * @param app Obsidian app instance
   * @param plugin optional plugin-like object (for settings persistence)
   * @param panelRefreshDebounceMs optional debounce timeout for panel refresh notifications (ms)
   */
  constructor(app: App, plugin?: PluginLike, panelRefreshDebounceMs?: number) {
    this.app = app;
    this.plugin = plugin;
    this.settings = plugin?.settings;
    if (typeof panelRefreshDebounceMs === "number" && Number.isFinite(panelRefreshDebounceMs)) {
      this._panelRefreshDebounceMs = Math.max(0, Math.floor(panelRefreshDebounceMs));
    }
    this.activeProject = (this.settings as WriteAidSettings | undefined)?.activeProject || null;
    this.projectService = new ProjectService(app);
    this.projectFileService = new ProjectFileService(app, this.projectService, this.settings);
  }

  /**
   * Reorder chapters in a draft.
   * @param projectPath Project folder path
   * @param draftName Draft name
   * @param newOrder Array of chapter objects in new order
   */
  async reorderChapters(
    projectPath: string,
    draftName: string,
    newOrder: Array<{ chapterName: string; order: number }>,
  ) {
    return await this.projectFileService.chapters.reorderChapters(projectPath, draftName, newOrder);
  }

  async listChapters(projectPath: string, draftName: string) {
    return await this.projectFileService.chapters.listChapters(projectPath, draftName);
  }
  async createChapter(projectPath: string, draftName: string, chapterName: string) {
    return await this.projectFileService.chapters.createChapter(
      projectPath,
      draftName,
      chapterName,
      this.settings,
    );
  }
  async deleteChapter(projectPath: string, draftName: string, chapterName: string) {
    return await this.projectFileService.chapters.deleteChapter(
      projectPath,
      draftName,
      chapterName,
    );
  }
  async renameChapter(projectPath: string, draftName: string, oldName: string, newName: string) {
    return await this.projectFileService.chapters.renameChapter(
      projectPath,
      draftName,
      oldName,
      newName,
    );
  }
  async openChapter(projectPath: string, draftName: string, chapterName: string) {
    return await this.projectFileService.chapters.openChapter(projectPath, draftName, chapterName);
  }

  get panelRefreshDebounceMs(): number {
    return this._panelRefreshDebounceMs;
  }

  /** Set the panel refresh debounce timeout in milliseconds. Passing 0 disables debouncing. */
  set panelRefreshDebounceMs(ms: number) {
    if (typeof ms === "number" && Number.isFinite(ms)) {
      this._panelRefreshDebounceMs = Math.max(0, Math.floor(ms));
    }
  }

  addActiveProjectListener(fn: (p: string | null) => void) {
    this.activeProjectListeners.push(fn);
  }

  addActiveDraftListener(fn: (d: string | null) => void) {
    this.activeDraftListeners.push(fn);
  }

  removeActiveDraftListener(fn: (d: string | null) => void) {
    this.activeDraftListeners = this.activeDraftListeners.filter((f) => f !== fn);
  }

  private notifyActiveDraftListeners(draft: string | null) {
    for (const fn of this.activeDraftListeners) {
      suppress(() => fn(draft));
    }
  }

  addPanelRefreshListener(fn: () => void) {
    this.panelRefreshListeners.push(fn);
  }

  removePanelRefreshListener(fn: () => void) {
    this.panelRefreshListeners = this.panelRefreshListeners.filter((f) => f !== fn);
  }

  notifyPanelRefresh() {
    try {
      if (this._panelRefreshTimer) {
        clearTimeout(this._panelRefreshTimer);
      }
      this._panelRefreshTimer = setTimeout(() => {
        for (const fn of this.panelRefreshListeners) {
          suppress(() => fn());
        }
        this._panelRefreshTimer = null;
      }, this._panelRefreshDebounceMs);
    } catch {
      // ignore
      // fallback: immediate notify
      for (const fn of this.panelRefreshListeners) {
        suppress(() => fn());
      }
    }
  }

  removeActiveProjectListener(fn: (p: string | null) => void) {
    this.activeProjectListeners = this.activeProjectListeners.filter((f) => f !== fn);
  }

  async setActiveProject(path: string | null) {
    if (path) {
      path = path.trim().replace(/^\/+/, "").replace(/\/+$/, "");
    }
    debug(`${DEBUG_PREFIX} setActiveProject called with '${path}'`);
    this.activeProject = path;
    await suppressAsync(async () => {
      if (this.plugin) {
        const pluginWithSettings = this.plugin as {
          settings?: WriteAidSettings;
          saveSettings?: () => Promise<void>;
        };
        if (!pluginWithSettings.settings) pluginWithSettings.settings = {} as WriteAidSettings;
        pluginWithSettings.settings.activeProject = path ?? undefined;
        if (typeof pluginWithSettings.saveSettings === "function") {
          await pluginWithSettings.saveSettings();
        }
      }
    });
    for (const l of this.activeProjectListeners) {
      suppress(() => l(path));
    }
    // Do not change activeDraft automatically here. Active draft should only
    // be modified via explicit user actions: switching, creating, or deleting
    // drafts. The UI or callers can choose to call setActiveDraft when desired.
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

        // Check if a project with this name already exists
        const allFolders = this.listAllFolders();
        const existingProjects = await asyncFilter(allFolders, (p) =>
          this.projectService.isProjectFolder(p),
        );
        const projectNames = existingProjects.map((p) => p.split("/").pop() || p);
        if (projectNames.includes(projectName)) {
          new Notice(
            `A project with the name "${projectName}" already exists. Please choose a different name.`,
          );
          return;
        }

        const fullPath =
          parentFolder && parentFolder !== "" ? `${parentFolder}/${projectName}` : projectName;
        const existing = this.app.vault.getAbstractFileByPath(fullPath);
        if (existing) {
          // Ask user what to do: open existing, create anyway, or cancel
          new ConfirmExistingProjectModal(
            this.app,
            fullPath,
            async (createAnyway: boolean) => {
              if (createAnyway) {
                await this.createNewProject(
                  projectName,
                  singleFile,
                  initialDraftName,
                  parentFolder,
                );
                // Automatically open the project's meta.md file after creation
                await this.openProject(fullPath);
              }
            },
            async () => {
              // open existing project
              await this.openProject(fullPath);
            },
          ).open();
        } else {
          await this.createNewProject(projectName, singleFile, initialDraftName, parentFolder);
          // Automatically open the project's meta.md file after creation
          await this.openProject(fullPath);
        }
      },
    ).open();
  }

  async openProject(projectPath: string) {
    return await this.projectService.openProject(projectPath);
  }

  async createNewProject(
    projectName: string,
    singleFile: boolean,
    initialDraftName?: string,
    parentFolder?: string,
  ) {
    const path = await this.projectService.createProject(
      projectName,
      singleFile,
      initialDraftName,
      parentFolder,
      this.settings,
    );
    // set as active project by default after successful creation
    if (path) {
      await this.setActiveProject(path as string);
      // Set the created draft as active draft
      const draftName = initialDraftName || "Draft 1";
      await this.setActiveDraft(draftName, path as string);
      // notify panels so UI can refresh
      suppress(() => this.notifyPanelRefresh());
    }
    return path;
  }

  // Helper to list all folder paths in the vault for the parent-folder chooser
  listAllFolders(): string[] {
    return this.projectService.listAllFolders();
  }

  async createNewDraftPrompt() {
    // First ask the user which project to create the draft for
    const all = this.listAllFolders();
    const projects = await asyncFilter(all, (p) => this.projectService.isProjectFolder(p));
    new SelectProjectModal(this.app, {
      folders: projects,
      onSubmit: async (projectPath: string) => {
        const suggestedName = await this.suggestNextDraftName(projectPath);
        new CreateDraftModal(this.app, {
          suggestedName,
          drafts: this.listDrafts(projectPath),
          projectPath,
          onSubmit: async (draftName: string, copyFrom?: string) => {
            await this.createNewDraft(draftName, copyFrom, projectPath);
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
    new SwitchDraftModal(this.app, drafts, async (draftName: string) => {
      // Use the manager API so the active draft change is centralized and persistent
      const ok = await this.setActiveDraft(draftName);
      if (ok) {
        new Notice(`Switched to draft: ${draftName}`);
      }
    }).open();
  }

  async updateProjectMetadataPrompt() {
    // If we have an active project, operate on it immediately
    if (this.activeProject) {
      await updateMetaStats(this.app, this.activeProject, undefined, undefined, this.settings);
      new Notice(`Metadata updated for ${this.activeProject}`);
      return;
    }

    // Otherwise ask the user to pick a project folder, then run updateMetaStats
    // We need to filter asynchronously because isProjectFolder is async
    (async () => {
      const all = this.listAllFolders();
      const projects = await asyncFilter(all, (p) => this.projectService.isProjectFolder(p));
      new SelectProjectModal(this.app, {
        folders: projects,
        onSubmit: async (projectPath: string) => {
          await updateMetaStats(this.app, projectPath, undefined, undefined, this.settings);
          new Notice(`Metadata updated for ${projectPath}`);
        },
      }).open();
    })();
  }

  async selectActiveProjectPrompt() {
    // Show only folders that look like WriteAid projects
    const all = this.listAllFolders();
    const projects = await asyncFilter(all, (p) => this.projectService.isProjectFolder(p));
    if (projects.length === 0) {
      new Notice(`No ${APP_NAME} projects found in the vault.`);
      return;
    }
    new SelectProjectModal(this.app, {
      folders: projects,
      onSubmit: async (projectPath: string) => {
        await this.setActiveProject(projectPath);
        new Notice(`Active project set to ${projectPath}`);
      },
    }).open();
  }

  async createNewDraft(draftName: string, copyFromDraft?: string, projectPath?: string) {
    const project = projectPath || this.activeProject || this.getCurrentProjectPath();
    if (!project) {
      new Notice("No project folder detected. Please open a folder named after your project.");
      return;
    }

    // Check if draft name already exists
    const existingDrafts = this.listDrafts(project);
    if (existingDrafts.includes(draftName)) {
      new Notice(`Draft with name "${draftName}" already exists. Please choose a different name.`);
      return;
    }

    await this.projectFileService.drafts.createDraft(
      draftName,
      copyFromDraft,
      project,
      this.settings,
    );
    // Notify panels and set the newly created draft as active (creation scenario)
    suppress(() => this.notifyPanelRefresh());
    if (project && draftName) {
      // Best-effort: set active draft to the created draft
      try {
        await this.setActiveDraft(draftName, project, false);
      } catch {
        // ignore failures to set active draft
      }
    }
    return;
  }

  listDrafts(projectPath?: string): string[] {
    return this.projectFileService.drafts.listDrafts(projectPath);
  }

  /**
   * Set the active draft programmatically for the current project.
   */
  async setActiveDraft(draftName: string, projectPath?: string, showNotice = true) {
    const project = projectPath || this.activeProject || this.getCurrentProjectPath();
    if (!project) {
      if (showNotice) new Notice("No project selected to set active draft on.");
      return false;
    }
    this.activeDraft = draftName;
    // Update meta.md with the new active draft
    await suppressAsync(async () => {
      await updateMetaStats(this.app, project, draftName, undefined, this.settings);
    });
    // notify listeners about the active draft change
    this.notifyActiveDraftListeners(this.activeDraft);
    if (showNotice) new Notice(`Active draft set to ${draftName}`);
    return true;
  }

  async renameDraft(
    oldName: string,
    newName: string,
    projectPath?: string,
    renameFile: boolean = false,
  ) {
    const project = projectPath || this.activeProject || this.getCurrentProjectPath();
    if (!project) {
      new Notice("No project selected to rename draft.");
      return false;
    }
    const wasActive = this.activeDraft === oldName;
    const ok = await this.projectFileService.drafts.renameDraft(
      project,
      oldName,
      newName,
      renameFile,
      this.settings,
    );
    if (ok) {
      if (wasActive) {
        this.activeDraft = newName;
      }
      new Notice(`Renamed draft ${oldName} → ${newName}`);
      return true;
    }
    new Notice("Failed to rename draft.");
    return false;
  }

  async deleteDraft(draftName: string, projectPath?: string, createBackup = true) {
    const project = projectPath || this.activeProject || this.getCurrentProjectPath();
    if (!project) {
      new Notice("No project selected to delete draft.");
      return false;
    }
    const ok = await this.projectFileService.drafts.deleteDraft(project, draftName, createBackup);
    if (ok) {
      new Notice(`Deleted draft ${draftName}`);

      // Handle active draft management after deletion
      const remainingDrafts = this.listDrafts(project);
      if (remainingDrafts.length > 0) {
        // If the deleted draft was active, or if no active draft is set, set a new active draft
        if (this.activeDraft === draftName || !this.activeDraft) {
          let nextActiveDraft: string;

          if (remainingDrafts.length === 1) {
            // Only one draft remains, set it as active
            nextActiveDraft = remainingDrafts[0];
          } else {
            // Multiple drafts remain, find the next one in alphabetical order
            // Sort drafts alphabetically (ascending, like the UI default)
            const sortedDrafts = [...remainingDrafts].sort((a, b) => a.localeCompare(b));

            if (this.activeDraft === draftName) {
              // Find the position of the deleted draft in the sorted list
              const deletedIndex = sortedDrafts.findIndex((d) => d === draftName);
              if (deletedIndex !== -1) {
                // Set the next draft in alphabetical order, or the first one if it was the last
                const nextIndex = deletedIndex < sortedDrafts.length - 1 ? deletedIndex : 0;
                nextActiveDraft = sortedDrafts[nextIndex];
              } else {
                // Fallback: set the first draft alphabetically
                nextActiveDraft = sortedDrafts[0];
              }
            } else {
              // Keep the current active draft if it's still available
              nextActiveDraft = this.activeDraft!;
            }
          }

          await this.setActiveDraft(nextActiveDraft, project, false);
        }
      } else {
        // No drafts remain, clear active draft
        this.activeDraft = null;
        this.notifyActiveDraftListeners(null);
      }

      return true;
    }
    new Notice("Failed to delete draft.");
    return false;
  }

  async suggestNextDraftName(projectPath?: string): Promise<string> {
    return await this.projectFileService.drafts.suggestNextDraftName(projectPath);
  }

  getCurrentProjectPath(): string | null {
    // Naive: Use the current active file's parent folder as the project folder
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return null;
    const folder = activeFile.parent;
    return folder ? folder.path : null;
  }
}
