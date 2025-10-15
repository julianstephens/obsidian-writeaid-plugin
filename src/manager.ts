// ...existing code...
import { DraftService } from "@/core/DraftService";
import { readMetaFile, updateMetaStats } from "@/core/meta";
import { ProjectService } from "@/core/ProjectService";
import { TemplateService } from "@/core/TemplateService";
import { asyncFilter } from "@/core/utils";
import type { PluginLike, WriteAidSettings } from "@/types";
import { App, Notice, TFile } from "obsidian";

import { ConfirmExistingProjectModal } from "@/ui/modals/ConfirmExistingProjectModal";
import { CreateDraftModal } from "@/ui/modals/CreateDraftModal";
import { CreateProjectModal } from "@/ui/modals/CreateProjectModal";
import { PostCreateModal } from "@/ui/modals/PostCreateModal";
import { SelectProjectModal } from "@/ui/modals/SelectProjectModal";
import { SwitchDraftModal } from "@/ui/modals/SwitchDraftModal";

export class WriteAidManager {
  app: App;
  activeDraft: string | null = null;
  // track the currently selected active project path
  activeProject: string | null = null;
  private activeProjectListeners: Array<(p: string | null) => void> = [];
  private activeDraftListeners: Array<(d: string | null) => void> = [];
  private panelRefreshListeners: Array<() => void> = [];
  private _panelRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  private _panelRefreshDebounceMs: number = 250;
  plugin?: PluginLike;
  settings?: WriteAidSettings;
  projectService: ProjectService;
  draftService: DraftService;

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
    // initialize activeProject from persisted settings if present
    this.activeProject = (this.settings as WriteAidSettings | undefined)?.activeProject || null;
    this.projectService = new ProjectService(app);
    this.draftService = new DraftService(app);
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
    return await this.draftService.reorderChapters(projectPath, draftName, newOrder);
  }

  /** Get the current panel refresh debounce timeout in milliseconds */

  // Chapter management API
  async listChapters(projectPath: string, draftName: string) {
    return await this.draftService.listChapters(projectPath, draftName);
  }
  async createChapter(projectPath: string, draftName: string, chapterName: string) {
    return await this.draftService.createChapter(projectPath, draftName, chapterName);
  }
  async deleteChapter(projectPath: string, draftName: string, chapterName: string) {
    return await this.draftService.deleteChapter(projectPath, draftName, chapterName);
  }
  async renameChapter(projectPath: string, draftName: string, oldName: string, newName: string) {
    return await this.draftService.renameChapter(projectPath, draftName, oldName, newName);
  }
  async openChapter(projectPath: string, draftName: string, chapterName: string) {
    return await this.draftService.openChapter(projectPath, draftName, chapterName);
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
      try {
        fn(draft);
      } catch (_e) {
        // ignore }
        // ignore
      }
    }
  }

  addPanelRefreshListener(fn: () => void) {
    this.panelRefreshListeners.push(fn);
  }

  removePanelRefreshListener(fn: () => void) {
    this.panelRefreshListeners = this.panelRefreshListeners.filter((f) => f !== fn);
  }

  notifyPanelRefresh() {
    // Debounce multiple notifications into a single refresh
    try {
      if (this._panelRefreshTimer) {
        clearTimeout(this._panelRefreshTimer);
      }
      this._panelRefreshTimer = setTimeout(() => {
        for (const fn of this.panelRefreshListeners) {
          try {
            fn();
          } catch (_e) {
            // ignore }
            // Ignore errors in panel refresh listeners
          }
        }
        this._panelRefreshTimer = null;
      }, this._panelRefreshDebounceMs);
    } catch (_e) {
      // ignore }
      // fallback: immediate notify
      for (const fn of this.panelRefreshListeners) {
        try {
          fn();
        } catch (_e) {
          // ignore }
          // Ignore errors in panel refresh listeners
        }
      }
    }
  }

  removeActiveProjectListener(fn: (p: string | null) => void) {
    this.activeProjectListeners = this.activeProjectListeners.filter((f) => f !== fn);
  }

  async setActiveProject(path: string | null) {
    // Normalize path: trim and remove leading/trailing slashes
    if (path) {
      path = path.trim().replace(/^\/+/, "").replace(/\/+$/, "");
    }
    // Debug: log when setActiveProject is called
    try {
      const dbg = (this.settings as WriteAidSettings | undefined)?.debug || false;
      if (dbg) {
        console.debug(`WriteAid debug: setActiveProject called with '${path}'`);
      }
    } catch (_e) {
      // ignore }
      // ignore
    }
    this.activeProject = path;
    // Persist into plugin settings if available
    try {
      if (this.plugin) {
        // Use type guard to check for settings property
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
    } catch (_e) {
      // ignore }
      // Ignore save errors
    }
    for (const l of this.activeProjectListeners) {
      try {
        l(path);
      } catch (_e) {
        // ignore }
        // Ignore errors in active project listeners
      }
    }

    // Ensure an active draft is set for the newly activated project.
    try {
      if (!path) {
        this.activeDraft = null;
        // notify listeners that active draft cleared
        try {
          this.notifyActiveDraftListeners(null);
        } catch (_e) {
          // ignore }
          // ignore
        }
        return;
      }
      const drafts = this.listDrafts(path);
      if (!drafts || drafts.length === 0) {
        this.activeDraft = null;
        return;
      }
      if (drafts.length === 1) {
        await this.setActiveDraft(drafts[0], path, false);
        // Debug: log single draft selection
        try {
          const dbg = (this.settings as WriteAidSettings | undefined)?.debug || false;
          if (dbg) {
            console.debug(
              `WriteAid debug: auto-selected single draft '${drafts[0]}' for project '${path}'`,
            );
          }
        } catch (_e) {
          // ignore }
          // ignore
        }
        return;
      }

      // Multiple drafts: prefer meta.md's current_active_draft when valid
      try {
        const meta = await readMetaFile(this.app, `${path}/meta.md`);
        if (meta && meta.current_active_draft && drafts.includes(meta.current_active_draft)) {
          await this.setActiveDraft(meta.current_active_draft, path, false);
          // Debug: log meta draft selection
          try {
            const dbg = (this.settings as WriteAidSettings | undefined)?.debug || false;
            if (dbg) {
              console.debug(
                `WriteAid debug: auto-selected meta draft '${meta.current_active_draft}' for project '${path}'`,
              );
            }
          } catch (_e) {
            // ignore }
            // ignore
          }
          return;
        }
      } catch (_e) {
        // ignore }
        // ignore and fall back
      }

      // Fallback: choose the draft with the most recently modified file inside it
      let bestDraft: string | null = null;
      let bestMtime = 0;
      const files = this.app.vault.getFiles();
      for (const d of drafts) {
        const folderPrefix = `${path}/Drafts/${d}/`;
        let maxM = 0;
        for (const f of files) {
          if (f.path.startsWith(folderPrefix)) {
            // f.stat may be undefined in some hosts; guard access
            const m = f.stat && typeof f.stat.mtime === "number" ? f.stat.mtime : 0;
            if (m > maxM) maxM = m;
          }
        }
        if (maxM > bestMtime) {
          bestMtime = maxM;
          bestDraft = d;
        }
      }
      if (!bestDraft) bestDraft = drafts[0];
      // Optionally surface debug notice when debug setting is enabled so we can
      // observe what draft was auto-selected during startup.
      try {
        const dbg = (this.settings as WriteAidSettings | undefined)?.debug || false;
        if (dbg) {
          console.debug(`WriteAid debug: auto-selected draft '${bestDraft}' for project '${path}'`);
        }
      } catch (_e) {
        // ignore }
        // ignore
      }
      await this.setActiveDraft(bestDraft, path, false);
    } catch (_e) {
      // ignore }
      // Ignore errors selecting active draft
    }
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
                new PostCreateModal(
                  this.app,
                  fullPath,
                  async () => await this.openProject(fullPath),
                ).open();
              }
            },
            async () => {
              // open existing project
              await this.openProject(fullPath);
            },
          ).open();
        } else {
          await this.createNewProject(projectName, singleFile, initialDraftName, parentFolder);
          new PostCreateModal(
            this.app,
            fullPath,
            async () => await this.openProject(fullPath),
          ).open();
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
      try {
        this.notifyPanelRefresh();
      } catch (_e) {
        // ignore }
        // Ignore errors in notifyPanelRefresh
      }
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
    new SwitchDraftModal(this.app, drafts, async (draftName: string) => {
      this.activeDraft = draftName;
      new Notice(`Switched to draft: ${draftName}`);

      // Update meta.md with the new active draft
      const projectPath = this.getCurrentProjectPath();
      if (projectPath) {
        await updateMetaStats(this.app, projectPath, draftName);
      }
    }).open();
  }

  async updateProjectMetadataPrompt() {
    // If we have an active project, operate on it immediately
    if (this.activeProject) {
      await updateMetaStats(this.app, this.activeProject);
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
          await updateMetaStats(this.app, projectPath);
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
      new Notice("No WriteAid projects found in the vault.");
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
    const res = await this.draftService.createDraft(
      draftName,
      copyFromDraft,
      projectPath,
      this.settings,
    );
    try {
      this.notifyPanelRefresh();
    } catch (_e) {
      // ignore }
      // Ignore errors in notifyPanelRefresh
    }
    return res;
  }

  listDrafts(projectPath?: string): string[] {
    return this.draftService.listDrafts(projectPath);
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
    try {
      await updateMetaStats(this.app, project, draftName);
    } catch (_e) {
      // ignore }
      // Ignore errors in updateMetaStats
    }
    // notify listeners about the active draft change
    try {
      this.notifyActiveDraftListeners(this.activeDraft);
    } catch (_e) {
      // ignore }
      // ignore
    }
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
    const ok = await this.draftService.renameDraft(
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
    const ok = await this.draftService.deleteDraft(project, draftName, createBackup);
    if (ok) {
      new Notice(`Deleted draft ${draftName}`);
      return true;
    }
    new Notice("Failed to delete draft.");
    return false;
  }

  async suggestNextDraftName(projectPath?: string): Promise<string> {
    return await this.draftService.suggestNextDraftName(projectPath);
  }

  getCurrentProjectPath(): string | null {
    // Naive: Use the current active file's parent folder as the project folder
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return null;
    const folder = activeFile.parent;
    return folder ? folder.path : null;
  }
}
