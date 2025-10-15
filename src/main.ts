import { convertIndexToPlanningCommand } from "@/commands/convertIndexToPlanningCommand";
import { convertSingleToMultiFileProjectCommand } from "@/commands/convertSingleToMultiFileProjectCommand";
import { createNewDraftCommand } from "@/commands/createNewDraftCommand";
import { createNewProjectCommand } from "@/commands/createNewProjectCommand";
import { selectActiveProjectCommand } from "@/commands/selectActiveProjectCommand";
import { switchDraftCommand } from "@/commands/switchDraftCommand";
import { toggleProjectPanelCommand } from "@/commands/toggleProjectPanelCommand";
import { updateProjectMetadataCommand } from "@/commands/updateProjectMetadataCommand";
import { ProjectService } from "@/core/ProjectService";
import { asyncFilter } from "@/core/utils";
import { WriteAidManager } from "@/manager";
import { WriteAidSettingTab } from "@/settings";
import type { WriteAidSettings } from "@/types";
import { Plugin } from "obsidian";

// Import the plugin CSS as inline text so we can inject it into the host
// document at runtime. Vite supports '?inline' to return the file contents
// as a string. This ensures the plugin styles are applied when the plugin
// is loaded in Obsidian even though the build emits a separate CSS asset.
// @ts-expect-error - import CSS as raw text via Vite
import stylesText from "@/styles/writeaid.css?inline";
import { WRITE_AID_ICON_NAME } from "@/ui/components/icons";
import { ProjectPanelView, VIEW_TYPE_PROJECT_PANEL } from "@/ui/sidepanel/ProjectPanelView";

// Local debug helper for plugin-level logs. Uses the same runtime flag as the
// panel mount helper: window.__WRITEAID_DEBUG__
function debug(...args: unknown[]) {
  try {
    if ((window as unknown as { __WRITEAID_DEBUG__?: boolean }).__WRITEAID_DEBUG__) {
      (console.debug || console.log).apply(console, args as []);
    }
  } catch (_e) { // ignore }
    // Ignore errors in debug logging
  }
}

const DEFAULT_SETTINGS: WriteAidSettings = {
  projectFileTemplate: "# {{projectName}}\n\nProject created with WriteAid",
  draftOutlineTemplate: "# Outline for {{draftName}}",
  planningTemplate: "# Planning: {{projectName}}\n\n- [ ] ...",
  chapterTemplate: "# {{chapterTitle}}\n\n",
  slugStyle: "compact",
  ribbonPlacement: "left",
  ribbonAlwaysShow: false,
  autoOpenPanelOnStartup: true,
  autoSelectProjectOnStartup: true,
  // Persisted active project (may be undefined)
  activeProject: undefined,
  // Debounce timeout for panel refresh notifications. 0 disables debouncing.
  panelRefreshDebounceMs: 250,
  // Developer debug logs disabled by default
  debug: false,
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

  async loadSettings() {
    const data = await this.loadData();
    this.settings = normalizeSettings(data);
    // Ensure activeProject is set correctly
    if (data && data.activeProject !== undefined) {
      this.settings.activeProject = data.activeProject;
    }
  }

  async saveSettings() {
    // Normalize before saving to ensure all expected keys are present
    try {
      const toSave = normalizeSettings(this.settings);
      await this.saveData(toSave);
      // keep the in-memory settings object in sync with what we saved
      this.settings = toSave;
    } catch (_e) { // ignore }
      // fallback to direct save if normalization fails
      await this.saveData(this.settings);
    }
  }

  async onload() {
    await this.loadSettings();
    // instantiate manager, passing configured debounce value from settings
    this.manager = new WriteAidManager(
      this.app,
      this,
      typeof this.settings.panelRefreshDebounceMs === "number"
        ? this.settings.panelRefreshDebounceMs
        : undefined,
    );

    // Only instantiate ProjectService once
    const projectService = new ProjectService(this.app);

    // Wait for layout to be ready before checking for projects
    this.app.workspace.onLayoutReady(async () => {
      // Ensure an active project is always selected on startup if projects exist
      const allFolders: string[] = projectService.listAllFolders();
      const filteredFolders = allFolders.filter((p) => !!p);
      const projects = await asyncFilter(filteredFolders, (p) => projectService.isProjectFolder(p));
      try {
        if ((this.settings as WriteAidSettings).debug) {
          console.debug(`WriteAid debug: allFolders:`, allFolders);
          console.debug(`WriteAid debug: filteredFolders:`, filteredFolders);
          console.debug(
            `WriteAid debug: found ${filteredFolders.length} folders, ${projects.length} projects:`,
            projects,
          );
        }
      } catch (_e) { // ignore }
        // ignore
      }
      let toActivate: string | null = null;
      if (projects.length === 1) {
        toActivate = projects[0];
      } else if (projects.length > 1) {
        // Use last active if it exists in the list, else first
        const lastActiveRaw = this.settings.activeProject;
        const lastActive = lastActiveRaw?.trim().replace(/^\/+/, "").replace(/\/+$/, "");
        try {
          if ((this.settings as WriteAidSettings).debug) {
            console.debug(
              `WriteAid debug: lastActiveRaw='${lastActiveRaw}', normalized='${lastActive}', includes=${lastActive && projects.includes(lastActive)}`,
            );
          }
        } catch (_e) { // ignore }
          // ignore
        }
        if (lastActive && projects.includes(lastActive)) {
          toActivate = lastActive;
        } else {
          toActivate = projects[0];
        }
      } else if (projects.length === 0) {
        // No valid projects found, but check if saved active project exists and has meta.md
        const lastActiveRaw = this.settings.activeProject;
        const lastActive = lastActiveRaw?.trim().replace(/^\/+/, "").replace(/\/+$/, "");
        if (lastActive && (await this.app.vault.adapter.exists(lastActive))) {
          const metaPath = `${lastActive}/meta.md`;
          if (await this.app.vault.adapter.exists(metaPath)) {
            try {
              if ((this.settings as WriteAidSettings).debug) {
                console.debug(
                  `WriteAid debug: activating saved project '${lastActive}' as it exists and has meta.md`,
                );
              }
            } catch (_e) { // ignore }
              // ignore
            }
            toActivate = lastActive;
          }
        }
      }
      try {
        if ((this.settings as WriteAidSettings).debug) {
          console.debug(`WriteAid debug: toActivate='${toActivate}'`);
        }
      } catch (_e) { // ignore }
        // ignore
      }
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
    // Add status bar item for active project
    this.statusBarEl = this.addStatusBarItem();
    this.statusBarEl.setText("WriteAid: No active project");

    // Defer verbose loading message until persisted debug setting is applied below
    // Inject plugin styles into the document head so the compiled CSS is
    // applied inside Obsidian. Keep a reference so we can remove it on unload.
    try {
      if (!this.waStyleEl) {
        this.waStyleEl = document.createElement("style");
        this.waStyleEl.setAttribute("data-writeaid-style", "");
        this.waStyleEl.textContent = stylesText as unknown as string;
        this.waStyleEl.classList.add("writeaid-plugin-style");
        document.head.appendChild(this.waStyleEl);
      }
    } catch (_e) { // ignore
      console.warn("WriteAid: failed to inject styles into document head", _e);
    }
    await this.loadSettings();
    // Apply persisted debug setting to the global runtime toggle so other modules
    // (panel mount helper / svelte components) can check window.__WRITEAID_DEBUG__
    try {
      // coerce to boolean and set global
      (window as unknown as { __WRITEAID_DEBUG__?: boolean }).__WRITEAID_DEBUG__ = Boolean(
        (this.settings as WriteAidSettings).debug,
      );
    } catch (_e) { // ignore }
      // Ignore errors in debug flag assignment
    }
    // Log load message only when debug is enabled so users don't see this in normal runs
    try {
      debug("Loading WriteAid Novel Multi-Draft Plugin");
    } catch (_e) { // ignore }
      // Ignore errors in debug logging
    }

    // Listen for active project changes to update status bar
    this.manager.addActiveProjectListener((project) => {
      if (this.statusBarEl) {
        if (project) {
          this.statusBarEl.setText(`WriteAid: ${project}`);
          try {
            if (this.settings && (this.settings as WriteAidSettings).debug) {
              console.debug(`WriteAid debug: active project updated -> ${project}`);
            }
          } catch (_e) { // ignore }
            // ignore
          }
        } else {
          this.statusBarEl.setText("WriteAid: No active project");
        }
      }
    });

    // Set initial status bar text if a project is already active
    if (this.manager.activeProject) {
      this.statusBarEl.setText(`WriteAid: ${this.manager.activeProject}`);
    }

    // register side panel view
    this.registerView(VIEW_TYPE_PROJECT_PANEL, (leaf) => new ProjectPanelView(leaf, this.app));

    const ribbonEl = this.addRibbonIcon(WRITE_AID_ICON_NAME, "WriteAid Projects", () => {});
    ribbonEl.classList.add("writeaid-ribbon");
    this.ribbonEl = ribbonEl;
    ribbonEl.setAttr("aria-label", "WriteAid Projects");

    // click behavior: reveal or create left panel
    ribbonEl.onclick = (_evt: MouseEvent) => {
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
      try {
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
      } catch (_e) { // ignore }
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
      id: "convert-index-to-planning",
      name: "Convert Index to Planning Document",
      callback: convertIndexToPlanningCommand(this.manager),
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
      id: "toggle-project-panel",
      name: "Toggle WriteAid Project Panel",
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
    this.addSettingTab(new WriteAidSettingTab(this.app, this));
  }

  moveRibbon(to: "left" | "right") {
    try {
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
    } catch (_e) { // ignore }
      // Ignore errors in moveRibbon
    }
  }

  onunload() {
    if (this.statusBarEl && this.statusBarEl.parentElement) {
      this.statusBarEl.parentElement.removeChild(this.statusBarEl);
    }
    try {
      debug("Unloading WriteAid Novel Multi-Draft Plugin");
    } catch (_e) { // ignore }
      // Ignore errors in debug logging
    }
    if (this.waStyleEl && this.waStyleEl.parentElement)
      this.waStyleEl.parentElement.removeChild(this.waStyleEl);
  }
}
