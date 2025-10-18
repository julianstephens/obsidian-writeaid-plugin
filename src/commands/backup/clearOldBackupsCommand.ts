import { checkActive, debug, DEBUG_PREFIX, getDraftsFolderName } from "@/core/utils";
import type { WriteAidManager } from "@/manager";
import { Notice, TFolder } from "obsidian";

export function clearOldBackupsCommand(manager: WriteAidManager) {
  return async () => {
    const activeProjectPath = manager.activeProject;
    const activeDraftName = manager.activeDraft;

    debug(`${DEBUG_PREFIX} Clear old backups command called`);
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

    const maxAgeDays = manager.projectFileService.backups.maxBackupAgeDays;

    await manager.projectFileService.backups.clearOldBackups(
      draftFolder,
      draftId,
      manager.settings,
    );

    new Notice(`Old backups cleared (older than ${maxAgeDays} days).`);
  };
}
