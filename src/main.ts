import { convertSingleToMultiFileProjectCommand } from "@/commands/convertSingleToMultiFileProjectCommand";
import { createNewDraftCommand } from "@/commands/createNewDraftCommand";
import { createNewProjectCommand } from "@/commands/createNewProjectCommand";
import { generateManuscriptCommand } from "@/commands/generateManuscriptCommand";
import { navigateToNextChapterCommand } from "@/commands/navigateToNextChapterCommand";
import { navigateToPreviousChapterCommand } from "@/commands/navigateToPreviousChapterCommand";
import { selectActiveProjectCommand } from "@/commands/selectActiveProjectCommand";
import { switchDraftCommand } from "@/commands/switchDraftCommand";
import { toggleProjectPanelCommand } from "@/commands/toggleProjectPanelCommand";
import { updateProjectMetadataCommand } from "@/commands/updateProjectMetadataCommand";
import { ProjectService } from "@/core/ProjectService";
import { APP_NAME, asyncFilter, debug, DEBUG_PREFIX, suppress, suppressAsync } from "@/core/utils";
import { WriteAidManager } from "@/manager";
import { WriteAidSettingTab } from "@/settings";
import stylesText from "@/styles/writeaid.css?inline";
import type { WriteAidSettings } from "@/types";
import { WRITE_AID_ICON_NAME } from "@/ui/components/icons";
import { ProjectPanelView, VIEW_TYPE_PROJECT_PANEL } from "@/ui/sidepanel/ProjectPanelView";
import { Plugin } from "obsidian";

// Helper function to truncate long project names for status bar display
function truncateProjectName(projectName: string, maxLength: number = 20): string {
  if (projectName.length <= maxLength) {
    return projectName;
  }
  return projectName.substring(0, maxLength - 3) + "...";
}

const DEFAULT_SETTINGS: WriteAidSettings = {
  draftOutlineTemplate: "# Outline for {{draftName}}",
  planningTemplate: "# Planning: {{projectName}}\n\n- [ ] ...",
  chapterTemplate: "# {{chapterTitle}}\n\n",
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
  draftsFolderName: "drafts",
  manuscriptsFolderName: "manuscripts",
  backupsFolderName: ".writeaid-backups",
  metaFileName: "meta.md",
  outlineFileName: "outline.md",
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
        console.error("Error in settings changed callback:", error);
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
        console.error("Error in settings changed callback:", error);
      }
    });
  }

  // Method to register callbacks that should be called when settings change
  registerSettingsChangedCallback(callback: () => void) {
    this.settingsChangedCallbacks.push(callback);
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
            `${DEBUG_PREFIX} activating saved project '${lastActive}' as it exists and has valid meta.md`,
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

    // Defer verbose loading message until persisted debug setting is applied below
    // Inject plugin styles into the document head so the compiled CSS is
    // applied inside Obsidian. Keep a reference so we can remove it on unload.
    suppress(() => {
      if (!this.waStyleEl) {
        this.waStyleEl = document.createElement("style");
        this.waStyleEl.setAttribute("data-writeaid-style", "");
        this.waStyleEl.textContent = stylesText as unknown as string;
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
    this.registerView(VIEW_TYPE_PROJECT_PANEL, (leaf) => new ProjectPanelView(leaf, this.app));

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
      name: "Convert Single-File Project to Multi-File",
      callback: () =>
        convertSingleToMultiFileProjectCommand(
          this.app,
          this.manager.activeProject || this.manager.getCurrentProjectPath?.() || undefined,
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
