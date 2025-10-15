import type { WriteAidManager } from "@/manager";
import { VIEW_TYPE_PROJECT_PANEL } from "@/ui/sidepanel/ProjectPanelView";
import type { App } from "obsidian";

export function toggleProjectPanelCommand(manager: WriteAidManager, app: App) {
  return () => {
    const viewState = {
      type: VIEW_TYPE_PROJECT_PANEL,
      active: true,
    };
    // try to find an existing leaf with our view
    const existing = app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT_PANEL);
    if (existing.length > 0) {
      const leaf = existing[0];
      app.workspace.revealLeaf(leaf);
    } else {
      let leaf = app.workspace.getRightLeaf(false);
      if (!leaf) leaf = app.workspace.getRightLeaf(true);
      leaf!.setViewState(viewState);
      app.workspace.revealLeaf(leaf!);
    }
  };
}
