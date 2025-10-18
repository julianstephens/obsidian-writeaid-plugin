import { clearOldBackupsCommand } from "@/commands/backup/clearOldBackupsCommand";
import { createBackupCommand } from "@/commands/backup/createBackupCommand";
import { deleteBackupCommand } from "@/commands/backup/deleteBackupCommand";
import { listBackupsCommand } from "@/commands/backup/listBackupsCommand";
import { createNewDraftCommand } from "@/commands/draft/createNewDraftCommand";
import { createOutlineCommand } from "@/commands/draft/createOutlineCommand";
import { generateManuscriptCommand } from "@/commands/draft/generateManuscriptCommand";
import { initializeDraftFileCommand } from "@/commands/draft/initializeDraftFileCommand";
import { switchDraftCommand } from "@/commands/draft/switchDraftCommand";
import { navigateToNextChapterCommand } from "@/commands/navigation/navigateToNextChapterCommand";
import { navigateToPreviousChapterCommand } from "@/commands/navigation/navigateToPreviousChapterCommand";
import { convertSingleToMultiFileProjectCommand } from "@/commands/project/convertSingleToMultiFileProjectCommand";
import { createNewProjectCommand } from "@/commands/project/createNewProjectCommand";
import { selectActiveProjectCommand } from "@/commands/project/selectActiveProjectCommand";
import { toggleProjectPanelCommand } from "@/commands/project/toggleProjectPanelCommand";
import { updateProjectMetadataCommand } from "@/commands/project/updateProjectMetadataCommand";
import { ProjectService } from "@/core/ProjectService";
import {
  APP_NAME,
  asyncFilter,
  debug,
  DEBUG_PREFIX,
  FILES,
  FOLDERS,
  getDraftsFolderName,
  suppress,
  suppressAsync,
  WRITE_AID_ICON_NAME,
} from "@/core/utils";
import { WriteAidManager } from "@/manager";
import { WriteAidSettingTab } from "@/settings";
import themesText from "@/styles/themes.css?inline";
import stylesText from "@/styles/writeaid.css?inline";
import type { WriteAidSettings } from "@/types";
import { ProjectPanelView, VIEW_TYPE_PROJECT_PANEL } from "@/ui/sidepanel/ProjectPanelView";
import { Plugin, TFolder } from "obsidian";

// Force browser environment for Svelte 5 compatibility
// Svelte 5 checks for server environment and disables client-side features in SSR mode
// We need to ensure it doesn't detect a server context in the Obsidian plugin environment
if (typeof globalThis !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const global = globalThis as any;
  if (!global.__BROWSER__) {
    global.__BROWSER__ = true;
  }
}

// Helper function to truncate long project names for status bar display
function truncateProjectName(projectName: string, maxLength: number = 20): string {
  if (projectName.length <= maxLength) {
    return projectName;
  }
  return projectName.substring(0, maxLength - 3) + "...";
}

const DEFAULT_SETTINGS: WriteAidSettings = {
  outlineTemplate: `# {{draftName}} Outline

## Overview
Brief description of the story goes here.

## Characters
- Character 1: Description
- Character 2: Description

## Plot Points
- Opening: 
- Middle: 
- Climax: 
- Resolution: 

## Chapters
- Chapter 1: Title
- Chapter 2: Title
- Chapter 3: Title`,
  chapterTemplate: `# {{chapterName}}

## Summary
Chapter summary goes here.

## Scene 1
Scene content goes here.

## Scene 2
Scene content goes here.`,
  manuscriptNameTemplate: "{{draftName}}",
  slugStyle: "compact",
  ribbonPlacement: "left",
  ribbonAlwaysShow: false,
  autoOpenPanelOnStartup: true,
  autoSelectProjectOnStartup: true,
  activeProject: undefined,
  panelRefreshDebounceMs: 250,
  debug: false,
  includeDraftOutline: false,
  draftsFolderName: FOLDERS.DRAFTS,
  manuscriptsFolderName: FOLDERS.MANUSCRIPTS,
  backupsFolderName: FOLDERS.BACKUPS,
  metaFileName: FILES.META,
  outlineFileName: FILES.OUTLINE,
  maxBackups: 5,
  maxBackupAgeDays: 30,
};

function normalizeSettings(data?: Partial<WriteAidSettings>): WriteAidSettings {
  return Object.assign({}, DEFAULT_SETTINGS, data ?? {});
}

export default class WriteAidPlugin extends Plugin {
  private statusBarEl?: HTMLElement;
  manager!: WriteAidManager;
  settings: WriteAidSettings = DEFAULT_SETTINGS;
  private waStyleEl?: HTMLStyleElement;
  private ribbonEl?: HTMLElement;
  private settingsChangedCallbacks: (() => void)[] = [];

  async loadSettings() {
    const data = await this.loadData();
    this.settings = normalizeSettings(data);
    if (data && data.activeProject !== undefined) {
      this.settings.activeProject = data.activeProject;
    }

    // Update manager's settings reference to point to the loaded settings object
    if (this.manager) {
      this.manager.settings = this.settings;
    }

    // Notify any registered callbacks that settings have been loaded
    this.settingsChangedCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        debug(`${DEBUG_PREFIX} Error in settings changed callback:`, error);
      }
    });
  }

  async saveSettings() {
    const result = await suppressAsync(async () => {
      const toSave = normalizeSettings(this.settings);
      await this.saveData(toSave);
      this.settings = toSave;
    });

    if (result === undefined) {
      // Error was suppressed, try fallback
      await this.saveData(this.settings);
    }

    // Update manager's settings reference to point to the new settings object
    if (this.manager) {
      this.manager.settings = this.settings;
      debug(
        `${DEBUG_PREFIX} Updated manager settings reference, manuscript template: ${this.settings.manuscriptNameTemplate}`,
      );
    }

    // Notify any registered callbacks that settings have changed
    this.settingsChangedCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        debug(`${DEBUG_PREFIX} Error in settings changed callback:`, error);
      }
    });
  }

  // Method to register callbacks that should be called when settings change
  registerSettingsChangedCallback(callback: () => void) {
    this.settingsChangedCallbacks.push(callback);
  }

  // Run backup cleanup for all projects and drafts
  private async runBackupCleanup(): Promise<void> {
    if (!this.manager) {
      return;
    }

    try {
      const projectService = new ProjectService(this.app);
      const projects = await projectService.listProjects();

      for (const projectPath of projects) {
        const draftsFolderName = getDraftsFolderName(this.settings);
        const draftsFolderPath = `${projectPath}/${draftsFolderName}`;

        // Check if drafts folder exists
        const draftsFolder = this.app.vault.getAbstractFileByPath(draftsFolderPath);
        if (!draftsFolder || !(draftsFolder instanceof TFolder)) {
          continue;
        }

        // Clean up backups for each draft in the project
        for (const draftFolder of draftsFolder.children) {
          if (draftFolder instanceof TFolder) {
            const draftPath = `${draftsFolderPath}/${draftFolder.name}`;
            const draftId = await this.manager.projectFileService.drafts.getDraftId(draftPath);
            if (draftId) {
              await this.manager.projectFileService.backups.clearOldBackups(
                draftPath,
                draftId,
                this.manager.settings,
              );
            }
          }
        }
      }

      debug(`${DEBUG_PREFIX} Backup cleanup completed on startup`);
    } catch (error) {
      debug(`${DEBUG_PREFIX} Error during backup cleanup:`, error);
      // Don't throw - cleanup failure shouldn't prevent plugin from working
    }
  }

  async onload() {
    await this.loadSettings();
    this.manager = new WriteAidManager(
      this.app,
      this,
      typeof this.settings.panelRefreshDebounceMs === "number"
        ? this.settings.panelRefreshDebounceMs
        : undefined,
    );

    debug(`${DEBUG_PREFIX} Manager created:`, !!this.manager);

    // Only instantiate ProjectService once
    const projectService = new ProjectService(this.app);

    this.app.workspace.onLayoutReady(async () => {
      // Ensure an active project is always selected on startup if projects exist
      const projects = await projectService.listProjects();
      let toActivate: string | null = null;
      if (projects.length === 1) {
        toActivate = projects[0];
      } else if (projects.length > 1) {
        // Use last active if it exists in the list, else first
        const lastActiveRaw = this.settings.activeProject;
        const lastActive = lastActiveRaw?.trim().replace(/^\/+/, "").replace(/\/+$/, "");
        debug(
          `${DEBUG_PREFIX} lastActiveRaw='${lastActiveRaw}', normalized='${lastActive}', includes=${lastActive && projects.includes(lastActive)}`,
        );
        if (lastActive && projects.includes(lastActive)) {
          toActivate = lastActive;
        } else {
          toActivate = projects[0];
        }
      } else if (projects.length === 0) {
        // No valid projects found, but check if saved active project exists and has meta.md
        const lastActiveRaw = this.settings.activeProject;
        const lastActive = lastActiveRaw?.trim().replace(/^\/+/, "").replace(/\/+$/, "");
        const isValidProject = await projectService.isProjectFolder(lastActiveRaw || "");
        if (isValidProject) {
          debug(
            `${DEBUG_PREFIX} activating saved project '${lastActive}' as it exists and has valid meta file`,
          );
          toActivate = lastActive ?? null;
        }
      }
      debug(`${DEBUG_PREFIX} toActivate='${toActivate}'`);
      if (toActivate) {
        await this.manager.setActiveProject(toActivate);
        this.settings.activeProject = toActivate;
        await this.saveSettings();
        // open the panel only if user has enabled auto-open
        if (this.settings.autoOpenPanelOnStartup) {
          const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT_PANEL);
          if (existing.length > 0) {
            this.app.workspace.revealLeaf(existing[0]);
          } else {
            let leaf: ReturnType<typeof this.app.workspace.getLeftLeaf> | null = null;
            if (this.settings.ribbonPlacement === "right") {
              leaf = this.app.workspace.getRightLeaf(true);
            } else {
              leaf = this.app.workspace.getLeftLeaf(true);
            }
            const viewState = {
              type: VIEW_TYPE_PROJECT_PANEL,
              active: true,
            };
            leaf!.setViewState(viewState);
            this.app.workspace.revealLeaf(leaf!);
          }
        }
      } else {
        // No project to activate, clear any invalid active project
        await this.manager.setActiveProject(null);
        this.settings.activeProject = undefined;
        await this.saveSettings();
      }
    });
    this.statusBarEl = this.addStatusBarItem();
    this.statusBarEl.setText(`${APP_NAME}: No active project`);

    // Run backup cleanup on startup (non-blocking)
    this.runBackupCleanup().catch((error) => {
      debug(`${DEBUG_PREFIX} Failed to run backup cleanup on startup:`, error);
    });

    // Defer verbose loading message until persisted debug setting is applied below
    // Inject plugin styles into the document head so the compiled CSS is
    // applied inside Obsidian. Keep a reference so we can remove it on unload.
    suppress(() => {
      if (!this.waStyleEl) {
        this.waStyleEl = document.createElement("style");
        this.waStyleEl.setAttribute("data-writeaid-style", "");
        this.waStyleEl.textContent = themesText + stylesText;
        this.waStyleEl.classList.add("writeaid-plugin-style");
        document.head.appendChild(this.waStyleEl);
      }
    });
    await this.loadSettings();
    // Apply persisted debug setting to the global runtime toggle so other modules
    // (panel mount helper / svelte components) can check window.__WRITEAID_DEBUG__
    suppress(() => {
      // coerce to boolean and set global
      (window as unknown as { __WRITEAID_DEBUG__?: boolean }).__WRITEAID_DEBUG__ = Boolean(
        (this.settings as WriteAidSettings).debug,
      );
    });
    // Log load message only when debug is enabled so users don't see this in normal runs
    debug(`${DEBUG_PREFIX} Loading ${APP_NAME} Novel Multi-Draft Plugin`);

    this.manager.addActiveProjectListener((project) => {
      if (this.statusBarEl) {
        if (project) {
          this.statusBarEl.setText(`${APP_NAME}: ${truncateProjectName(project)}`);
          debug(`${DEBUG_PREFIX} active project updated -> ${project}`);
        } else {
          this.statusBarEl.setText(`${APP_NAME}: No active project`);
        }
      }
    });

    // Set initial status bar text if a project is already active
    if (this.manager.activeProject) {
      this.statusBarEl.setText(`${APP_NAME}: ${truncateProjectName(this.manager.activeProject)}`);
    }

    // register side panel view
    debug(`${DEBUG_PREFIX} Registering ProjectPanelView with manager:`, !!this.manager);
    this.registerView(VIEW_TYPE_PROJECT_PANEL, (leaf) => {
      debug(`${DEBUG_PREFIX} Creating ProjectPanelView instance with manager:`, !!this.manager);
      return new ProjectPanelView(leaf, this.app, this.manager);
    });

    const ribbonEl = this.addRibbonIcon(WRITE_AID_ICON_NAME, `${APP_NAME} Projects`, () => {});
    ribbonEl.classList.add("writeaid-ribbon");
    this.ribbonEl = ribbonEl;
    ribbonEl.setAttr("aria-label", `${APP_NAME} Projects`);

    // click behavior: reveal or create left panel
    ribbonEl.onclick = () => {
      const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT_PANEL);
      if (existing.length > 0) {
        const leaf = existing[0];
        this.app.workspace.revealLeaf(leaf);
      } else {
        let leaf = this.app.workspace.getLeftLeaf(false);
        if (!leaf) leaf = this.app.workspace.getLeftLeaf(true);
        const viewState: { type: string; active: boolean } = {
          type: VIEW_TYPE_PROJECT_PANEL,
          active: true,
        };
        leaf!.setViewState(viewState);
        this.app.workspace.revealLeaf(leaf!);
      }
    };

    // Control visibility: show based on settings and project detection
    const updateRibbonVisibility = async () => {
      const result = await suppressAsync(async () => {
        if (this.settings.ribbonAlwaysShow) {
          ribbonEl.style.display = "";
          return;
        }
        const all = projectService.listAllFolders();
        const projects = await asyncFilter(all, (p) => projectService.isProjectFolder(p));
        if (projects.length > 0) {
          ribbonEl.style.display = "";
        } else {
          ribbonEl.style.display = "none";
        }
      });

      if (result === undefined) {
        // Error was suppressed, set default visibility
        ribbonEl.style.display = "";
      }
    };
    // expose a refresh method on the plugin instance
    (this as unknown as { refreshRibbonVisibility?: () => void }).refreshRibbonVisibility =
      updateRibbonVisibility;

    // initial visibility and placement (run async)
    updateRibbonVisibility().catch(() => {});
    // move to right ribbon if requested
    if (this.settings.ribbonPlacement === "right") this.moveRibbon("right");

    // refresh when vault changes (files/folders created or deleted)
    this.registerEvent(
      this.app.vault.on("create", () => {
        updateRibbonVisibility().catch(() => {});
      }),
    );
    this.registerEvent(
      this.app.vault.on("delete", () => {
        updateRibbonVisibility().catch(() => {});
      }),
    );
    this.registerEvent(
      this.app.vault.on("modify", () => {
        updateRibbonVisibility().catch(() => {});
      }),
    );

    this.addCommand({
      id: "create-new-draft",
      name: "Create New Draft",
      callback: createNewDraftCommand(this.manager),
    });

    this.addCommand({
      id: "create-outline",
      name: "Create Outline",
      callback: () => createOutlineCommand(this.manager),
    });

    this.addCommand({
      id: "create-new-project",
      name: "Create New Project",
      callback: createNewProjectCommand(this.manager),
    });

    this.addCommand({
      id: "switch-draft",
      name: "Switch Active Draft",
      callback: switchDraftCommand(this.manager),
    });

    this.addCommand({
      id: "update-project-metadata",
      name: "Update Project Metadata",
      callback: updateProjectMetadataCommand(this.manager),
    });

    this.addCommand({
      id: "select-active-project",
      name: "Select Active Project",
      callback: selectActiveProjectCommand(this.manager),
    });

    this.addCommand({
      id: "generate-manuscript",
      name: "Generate Manuscript",
      callback: generateManuscriptCommand(this.manager),
    });

    this.addCommand({
      id: "toggle-project-panel",
      name: `Toggle ${APP_NAME} Project Panel`,
      callback: toggleProjectPanelCommand(this.manager, this.app),
    });
    this.addCommand({
      id: "convert-single-to-multi-file-project",
      name: `Convert Single-File Project to Multi-File`,
      callback: () =>
        convertSingleToMultiFileProjectCommand(
          this.app,
          this.manager.activeProject || this.manager.getCurrentProjectPath?.() || undefined,
          this.manager.settings,
        ),
    });
    this.addCommand({
      id: "navigate-to-next-chapter",
      name: "Navigate to Next Chapter",
      callback: navigateToNextChapterCommand(this.manager),
    });

    this.addCommand({
      id: "navigate-to-previous-chapter",
      name: "Navigate to Previous Chapter",
      callback: navigateToPreviousChapterCommand(this.manager),
    });

    this.addCommand({
      id: "create-backup",
      name: "Create Backup",
      callback: createBackupCommand(this.manager),
    });

    this.addCommand({
      id: "list-and-restore-backups",
      name: "List and Restore Backups",
      callback: listBackupsCommand(this.manager),
    });

    this.addCommand({
      id: "delete-backup",
      name: "Delete Oldest Backup",
      callback: deleteBackupCommand(this.manager),
    });

    this.addCommand({
      id: "clear-old-backups",
      name: "Clear Old Backups",
      callback: clearOldBackupsCommand(this.manager),
    });

    this.addCommand({
      id: "initialize-draft-file",
      name: "Initialize Draft File Metadata",
      callback: initializeDraftFileCommand(this.manager),
    });

    this.addSettingTab(new WriteAidSettingTab(this.app, this));
  }

  moveRibbon(to: "left" | "right") {
    suppress(() => {
      if (!this.ribbonEl) return;
      const rightRibbon = this.app.workspace.containerEl.querySelector(
        ".workspace-ribbon.mod-right",
      ) as HTMLElement | null;
      const leftRibbon = this.app.workspace.containerEl.querySelector(
        ".workspace-ribbon.mod-left",
      ) as HTMLElement | null;
      if (to === "right" && rightRibbon) {
        rightRibbon.appendChild(this.ribbonEl);
      } else if (to === "left" && leftRibbon) {
        leftRibbon.appendChild(this.ribbonEl);
      }
    });
  }

  onunload() {
    if (this.statusBarEl && this.statusBarEl.parentElement) {
      this.statusBarEl.parentElement.removeChild(this.statusBarEl);
    }
    debug(`${DEBUG_PREFIX} Unloading ${APP_NAME} Novel Multi-Draft Plugin`);
    if (this.waStyleEl && this.waStyleEl.parentElement)
      this.waStyleEl.parentElement.removeChild(this.waStyleEl);
  }
}
