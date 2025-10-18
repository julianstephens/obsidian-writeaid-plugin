import { ProjectFileService } from "@/core/ProjectFileService";
import { ProjectService } from "@/core/ProjectService";
import { APP_NAME, debug, DEBUG_PREFIX, WRITE_AID_ICON_NAME } from "@/core/utils";
import type { WriteAidManager } from "@/manager";
import ProjectPanel from "@/ui/sidepanel/ProjectPanel.svelte";
import { ItemView, Notice, type App, type WorkspaceLeaf } from "obsidian";
import type { SvelteComponent } from "svelte";

export const VIEW_TYPE_PROJECT_PANEL = "writeaid-project-panel";

export class ProjectPanelView extends ItemView {
  app: App;
  manager: WriteAidManager;
  projectService: ProjectService;
  projectFileService: ProjectFileService;
  panelEl: HTMLElement | null = null;
  selectedProject: string | null = null;
  projectPanel: SvelteComponent | undefined;

  constructor(leaf: WorkspaceLeaf, app: App, manager: WriteAidManager) {
    super(leaf);
    this.app = app;
    this.manager = manager;
    this.projectService = new ProjectService(app);
    this.projectFileService = new ProjectFileService(app, this.projectService);
  }

  getViewType(): string {
    return VIEW_TYPE_PROJECT_PANEL;
  }

  getDisplayText(): string {
    return `${APP_NAME} Projects`;
  }

  getIcon(): string {
    return WRITE_AID_ICON_NAME;
  }

  async onOpen() {
    this.panelEl = this.contentEl.createEl("div", {
      cls: "writeaid-project-panel",
    });

    // Mount Svelte 5 component
    try {
      if (!this.manager) {
        debug(`${DEBUG_PREFIX} Manager not available in ProjectPanelView.onOpen`);
        new Notice(`${APP_NAME}: manager not available, cannot mount project panel.`);
        return;
      }

      debug(`${DEBUG_PREFIX} Mounting ProjectPanel with manager:`, !!this.manager);

      // Instantiate Svelte 4 component with props
      this.projectPanel = new ProjectPanel({
        target: this.panelEl,
        props: {
          manager: this.manager,
          projectService: this.projectService,
          projectFileService: this.projectFileService,
        },
      });

      debug(`${DEBUG_PREFIX} ProjectPanel mounted successfully`);
    } catch (err) {
      debug(`${DEBUG_PREFIX} failed to mount project panel:`, err);
      new Notice(`${APP_NAME}: failed to mount project panel. Check console for details.`);
    }
  }

  async onClose() {
    if (this.projectPanel) {
      try {
        // Destroy the Svelte 4 component
        this.projectPanel.$destroy();
      } catch (error) {
        debug(`${DEBUG_PREFIX} Error destroying project panel:`, error);
      }
      this.projectPanel = undefined;
    }
  }

  refreshDraftsSection() {
    if (this.projectPanel && typeof (this.projectPanel as any).refreshDrafts === 'function') {
      debug(`${DEBUG_PREFIX} Refreshing drafts section in project panel`);
      (this.projectPanel as any).refreshDrafts();
    }
  }
}
