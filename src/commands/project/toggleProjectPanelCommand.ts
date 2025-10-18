import { debug, DEBUG_PREFIX } from "@/core/utils";
import type { WriteAidManager } from "@/manager";
import { VIEW_TYPE_PROJECT_PANEL } from "@/ui/sidepanel/ProjectPanelView";
import type { App } from "obsidian";

export function toggleProjectPanelCommand(manager: WriteAidManager, app: App) {
  return () => {
    debug(`${DEBUG_PREFIX} Toggle project panel command called`);
    const viewState = {
      type: VIEW_TYPE_PROJECT_PANEL,
      active: true,
    };
    const existing = app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT_PANEL);
    if (existing.length > 0) {
      debug(`${DEBUG_PREFIX} Revealing existing project panel`);
      const leaf = existing[0];
      app.workspace.revealLeaf(leaf);
    } else {
      debug(`${DEBUG_PREFIX} Creating new project panel`);
      let leaf = app.workspace.getRightLeaf(false);
      if (!leaf) leaf = app.workspace.getRightLeaf(true);
      leaf!.setViewState(viewState);
      app.workspace.revealLeaf(leaf!);
    }
  };
}
