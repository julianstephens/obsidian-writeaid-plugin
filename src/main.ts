import { ProjectService } from "@/core/ProjectService";
import { asyncFilter } from "@/core/utils";
import type { WriteAidSettings } from "@/types";
import { Notice, Plugin } from "obsidian";
import { convertIndexToPlanningCommand } from "./commands/convertIndexToPlanningCommand";
import { convertSingleToMultiFileProjectCommand } from "./commands/convertSingleToMultiFileProjectCommand";
import { createNewDraftCommand } from "./commands/createNewDraftCommand";
import { createNewProjectCommand } from "./commands/createNewProjectCommand";
import { selectActiveProjectCommand } from "./commands/selectActiveProjectCommand";
import { switchDraftCommand } from "./commands/switchDraftCommand";
import { toggleProjectPanelCommand } from "./commands/toggleProjectPanelCommand";
import { updateProjectMetadataCommand } from "./commands/updateProjectMetadataCommand";
import { WriteAidManager } from "./manager";
import { WriteAidSettingTab } from "./settings";

// Import the plugin CSS as inline text so we can inject it into the host
// document at runtime. Vite supports '?inline' to return the file contents
// as a string. This ensures the plugin styles are applied when the plugin
// is loaded in Obsidian even though the build emits a separate CSS asset.
// @ts-expect-error - import CSS as raw text via Vite
import stylesText from "./styles/writeaid.css?inline";
import { WRITE_AID_ICON_NAME } from "./ui/components/icons";
import { ProjectPanelView, VIEW_TYPE_PROJECT_PANEL } from "./ui/sidepanel/ProjectPanelView";

// Local debug helper for plugin-level logs. Uses the same runtime flag as the
// panel mount helper: window.__WRITEAID_DEBUG__
function debug(...args: unknown[]) {
  try {
    if ((window as unknown as { __WRITEAID_DEBUG__?: boolean }).__WRITEAID_DEBUG__) {
      (console.debug || console.log).apply(console, args as []);
    }
  } catch (e) {
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
    } catch (e) {
      // fallback to direct save if normalization fails
      await this.saveData(this.settings);
    }
  }

  async onload() {
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
    } catch (e) {
      console.warn("WriteAid: failed to inject styles into document head", e);
    }
    await this.loadSettings();
    // Apply persisted debug setting to the global runtime toggle so other modules
    // (panel mount helper / svelte components) can check window.__WRITEAID_DEBUG__
    try {
      // coerce to boolean and set global
      (window as unknown as { __WRITEAID_DEBUG__?: boolean }).__WRITEAID_DEBUG__ = Boolean(
        (this.settings as WriteAidSettings).debug,
      );
    } catch (e) {
      // Ignore errors in debug flag assignment
    }
    // Log load message only when debug is enabled so users don't see this in normal runs
    try {
      debug("Loading WriteAid Novel Multi-Draft Plugin");
    } catch (e) {
      // Ignore errors in debug logging
    }
    // instantiate manager, passing configured debounce value from settings
    this.manager = new WriteAidManager(
      this.app,
      this,
      typeof this.settings.panelRefreshDebounceMs === "number"
        ? this.settings.panelRefreshDebounceMs
        : undefined,
    );

    // register side panel view
    this.registerView(VIEW_TYPE_PROJECT_PANEL, (leaf) => new ProjectPanelView(leaf, this.app));

    // Add a ribbon icon (SVG) to open the project panel, placement and visibility controlled by settings
    const projectService = new ProjectService(this.app);
    const ribbonEl = this.addRibbonIcon(WRITE_AID_ICON_NAME, "WriteAid Projects", () => {});

    ribbonEl.classList.add("writeaid-ribbon");
    this.ribbonEl = ribbonEl;
    ribbonEl.setAttr("aria-label", "WriteAid Projects");

    // click behavior: reveal or create left panel
    ribbonEl.onclick = (evt: MouseEvent) => {
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
      } catch (e) {
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

    // If we have a persisted activeProject, ensure manager knows about it and open the panel so the UI shows it
    try {
      const persisted = this.settings?.activeProject;
      if (persisted) {
        // validate the path still points to a WriteAid project
        const isProject = await projectService.isProjectFolder(persisted);
        if (!isProject) {
          // clear persisted setting and notify the user
          (this.settings as WriteAidSettings).activeProject = undefined;
          try {
            await this.saveSettings();
          } catch (e) {
            // Ignore errors in settings save
          }
          new Notice(
            `Saved active project '${persisted}' not found. Clearing saved active project.`,
          );
        } else {
          // Ensure manager state and persistence are consistent
          // Set the active project in the manager if the user enabled auto-select on startup
          if (this.settings.autoSelectProjectOnStartup) {
            await this.manager.setActiveProject(persisted);
            try {
              new Notice(`WriteAid: active project restored: ${persisted}`);
            } catch (e) {
              // Ignore errors in Notice creation
            }
          }
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
        }
      }
    } catch (e) {
      // Ignore errors in event registration
    }

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
      const parent = this.ribbonEl.parentElement;
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
    } catch (e) {
      // Ignore errors in moveRibbon
    }
  }

  onunload() {
    try {
      debug("Unloading WriteAid Novel Multi-Draft Plugin");
    } catch (e) {
      // Ignore errors in debug logging
    }
    if (this.waStyleEl && this.waStyleEl.parentElement)
      this.waStyleEl.parentElement.removeChild(this.waStyleEl);
  }
}
