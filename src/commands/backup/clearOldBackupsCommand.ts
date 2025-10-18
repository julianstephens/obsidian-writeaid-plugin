import { checkActive, debug, DEBUG_PREFIX, getDraftsFolderName } from "@/core/utils";
import type { WriteAidManager } from "@/manager";
import { Notice } from "obsidian";

export function clearOldBackupsCommand(manager: WriteAidManager) {
  return async () => {
    const activeProjectPath = manager.activeProject;
    const activeDraftName = manager.activeDraft;

    debug(`${DEBUG_PREFIX} Clear old backups command called`);
    debug(`${DEBUG_PREFIX} Active project: ${activeProjectPath}, active draft: ${activeDraftName}`);

    if (!checkActive(activeProjectPath, activeDraftName)) {
      return;
    }

    const draftsFolderName = getDraftsFolderName(manager.settings);
    const draftFolder = `${activeProjectPath}/${draftsFolderName}/${activeDraftName}`;

    // Get the draft ID
    const draftId = await manager.projectFileService.drafts.getDraftId(draftFolder);
    if (!draftId) {
      new Notice("Failed to get draft ID.");
      return;
    }

    const maxAgeDays = manager.projectFileService.backups.maxBackupAgeDays;

    await manager.projectFileService.backups.clearOldBackups(
      draftFolder,
      draftId,
      manager.settings,
    );

    new Notice(`Old backups cleared (older than ${maxAgeDays} days).`);
  };
}
