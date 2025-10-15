import { debug, DEBUG_PREFIX, getDraftsFolderName } from "@/core/utils";
import type { WriteAidManager } from "@/manager";
import { Notice } from "obsidian";

export function restoreBackupCommand(manager: WriteAidManager) {
  return async () => {
    const activeProjectPath = manager.activeProject;
    const activeDraftName = manager.activeDraft;

    debug(`${DEBUG_PREFIX} Restore backup command called`);
    debug(`${DEBUG_PREFIX} Active project: ${activeProjectPath}, active draft: ${activeDraftName}`);

    if (!activeProjectPath || !activeDraftName) {
      new Notice("No active project or draft found.");
      return;
    }

    const draftsFolderName = getDraftsFolderName(manager.settings);
    const draftFolder = `${activeProjectPath}/${draftsFolderName}/${activeDraftName}`;
    const backups = await manager.projectFileService.backups.listBackups(draftFolder, manager.settings);

    if (backups.length === 0) {
      new Notice("No backups found for the current draft.");
      return;
    }

    // Restore the most recent backup
    const latestBackup = backups[0];
    const success = await manager.projectFileService.backups.restoreBackup(draftFolder, latestBackup, manager.settings);

    if (success) {
      new Notice(`Backup restored successfully from ${latestBackup}.`);
    } else {
      new Notice("Failed to restore backup.");
    }
  };
}