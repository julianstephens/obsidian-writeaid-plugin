import { checkActive, debug, DEBUG_PREFIX, getDraftsFolderName } from "@/core/utils";
import type { WriteAidManager } from "@/manager";
import { WriteAidError } from "@/types";
import { Notice, TFolder } from "obsidian";

export function deleteBackupCommand(manager: WriteAidManager) {
  return async () => {
    const activeProjectPath = manager.activeProject;
    const activeDraftName = manager.activeDraft;

    debug(`${DEBUG_PREFIX} Delete backup command called`);
    debug(`${DEBUG_PREFIX} Active project: ${activeProjectPath}, active draft: ${activeDraftName}`);

    if (!checkActive(activeProjectPath, activeDraftName)) {
      return;
    }

    if (!activeProjectPath || !activeDraftName) {
      new Notice("Active project or draft not found.");
      return;
    }

    // Find the actual drafts folder name (case-insensitive)
    const configuredDraftsFolderName = getDraftsFolderName(manager.settings);
    const projectFolder = manager.app.vault.getAbstractFileByPath(activeProjectPath);
    let actualDraftsFolderName = configuredDraftsFolderName;

    if (projectFolder && projectFolder instanceof TFolder) {
      for (const child of projectFolder.children) {
        if (child instanceof TFolder && child.name.toLowerCase() === configuredDraftsFolderName.toLowerCase()) {
          actualDraftsFolderName = child.name;
          break;
        }
      }
    }

    const draftFolder = `${activeProjectPath}/${actualDraftsFolderName}/${activeDraftName}`;

    // Get the draft ID
    const draftId = await manager.projectFileService.drafts.getDraftId(draftFolder);
    if (!draftId) {
      new Notice("Failed to get draft ID.");
      return;
    }

    const backups = await manager.projectFileService.backups.listBackups(
      draftFolder,
      draftId,
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
      draftId,
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
