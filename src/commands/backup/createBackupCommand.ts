import { checkActive, debug, DEBUG_PREFIX, getDraftsFolderName } from "@/core/utils";
import type { WriteAidManager } from "@/manager";
import { Notice } from "obsidian";

export function createBackupCommand(manager: WriteAidManager) {
  return async () => {
    const activeProjectPath = manager.activeProject;
    const activeDraftName = manager.activeDraft;

    debug(`${DEBUG_PREFIX} Create backup command called`);
    debug(`${DEBUG_PREFIX} Active project: ${activeProjectPath}, active draft: ${activeDraftName}`);

    if (!checkActive(activeProjectPath, activeDraftName)) {
      return;
    }

    const draftsFolderName = getDraftsFolderName(manager.settings);
    const draftFolder = `${activeProjectPath}/${draftsFolderName}/${activeDraftName}`;

    // Get the draft ID
    const draftId = await manager.projectFileService.drafts.getDraftId(draftFolder);
    if (!draftId) {
      new Notice("Failed to get draft ID for backup.");
      return;
    }

    const success = await manager.projectFileService.backups.createBackup(
      draftFolder,
      draftId,
      manager.settings,
    );

    if (success) {
      new Notice("Backup created successfully.");
    } else {
      new Notice("Failed to create backup.");
    }
  };
}
