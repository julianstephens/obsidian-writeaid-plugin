import { checkActive, debug, DEBUG_PREFIX, getDraftsFolderName } from "@/core/utils";
import type { WriteAidManager } from "@/manager";
import { WriteAidError } from "@/types";
import { Notice } from "obsidian";

export function deleteBackupCommand(manager: WriteAidManager) {
  return async () => {
    const activeProjectPath = manager.activeProject;
    const activeDraftName = manager.activeDraft;

    debug(`${DEBUG_PREFIX} Delete backup command called`);
    debug(`${DEBUG_PREFIX} Active project: ${activeProjectPath}, active draft: ${activeDraftName}`);

    if (!checkActive(activeProjectPath, activeDraftName)) {
      return;
    }

    const draftsFolderName = getDraftsFolderName(manager.settings);
    const draftFolder = `${activeProjectPath}/${draftsFolderName}/${activeDraftName}`;
    const backups = await manager.projectFileService.backups.listBackups(
      draftFolder,
      manager.settings,
    );

    if (backups.length === 0) {
      new Notice(WriteAidError.BACKUPS_NOT_FOUND_DRAFT);
      return;
    }

    // Delete the oldest backup
    const oldestBackup = backups[backups.length - 1];
    const success = await manager.projectFileService.backups.deleteBackup(
      draftFolder,
      oldestBackup,
      manager.settings,
    );

    if (success) {
      new Notice(`Backup deleted successfully: ${oldestBackup}.`);
    } else {
      new Notice("Failed to delete backup.");
    }
  };
}
