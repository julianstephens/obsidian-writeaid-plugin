import { debug, DEBUG_PREFIX } from "@/core/utils";
import type { WriteAidManager } from "@/manager";
import { RestoreBackupModal } from "@/ui/modals/RestoreBackupModal";
import type { ProjectPanelView } from "@/ui/sidepanel/ProjectPanelView";
import { VIEW_TYPE_PROJECT_PANEL } from "@/ui/sidepanel/ProjectPanelView";

export function listBackupsCommand(manager: WriteAidManager) {
  return async () => {
    debug(`${DEBUG_PREFIX} List backups command called`);

    // Get the ProjectPanelView to refresh drafts after restore
    let onRestoreComplete: (() => void) | undefined;
    const projectPanelLeaves = manager.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT_PANEL);
    if (projectPanelLeaves.length > 0) {
      const projectPanelView = projectPanelLeaves[0].view as ProjectPanelView;
      onRestoreComplete = () => {
        projectPanelView.refreshDraftsSection();
      };
    }

    const modal = new RestoreBackupModal(manager.app, manager, onRestoreComplete);
    modal.open();
  };
}
