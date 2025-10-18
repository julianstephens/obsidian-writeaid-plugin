import { checkActive, debug, DEBUG_PREFIX, getDraftsFolderName } from "@/core/utils";
import type { WriteAidManager } from "@/manager";
import { App, Modal, Notice, Setting, TFolder } from "obsidian";

/**
 * Modal to confirm backup creation when it will exceed max backups
 */
class ConfirmBackupCleanupModal extends Modal {
  private result: boolean = false;
  private resolvePromise: ((value: boolean) => void) | null = null;
  private draftName: string;
  private backupsToDelete: number;

  constructor(app: App, draftName: string, backupsToDelete: number) {
    super(app);
    this.draftName = draftName;
    this.backupsToDelete = backupsToDelete;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Confirm Backup Creation" });

    contentEl.createEl("p", {
      text: `Creating a new backup for draft "${this.draftName}" will exceed the maximum number of backups allowed. The following will happen:`,
    });

    contentEl.createEl("ul").createEl("li", {
      text: `${this.backupsToDelete} oldest backup(s) will be deleted to make room for the new one.`,
    });

    contentEl.createEl("p", {
      text: "Do you want to continue?",
    });

    new Setting(contentEl)
      .addButton((btn) =>
        btn.setButtonText("Cancel").onClick(() => {
          this.result = false;
          this.close();
        }),
      )
      .addButton((btn) =>
        btn
          .setButtonText("Continue")
          .setCta()
          .onClick(() => {
            this.result = true;
            this.close();
          }),
      );
  }

  onClose() {
    if (this.resolvePromise) {
      this.resolvePromise(this.result);
    }
  }

  /**
   * Show the modal and return a promise that resolves to true if user confirms
   */
  showModal(): Promise<boolean> {
    return new Promise((resolve) => {
      this.resolvePromise = resolve;
      this.open();
    });
  }
}

export function createBackupCommand(manager: WriteAidManager) {
  return async () => {
    const activeProjectPath = manager.activeProject;
    const activeDraftName = manager.activeDraft;

    debug(`${DEBUG_PREFIX} Create backup command called`);
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
        if (
          child instanceof TFolder &&
          child.name.toLowerCase() === configuredDraftsFolderName.toLowerCase()
        ) {
          actualDraftsFolderName = child.name;
          break;
        }
      }
    }

    const draftFolder = `${activeProjectPath}/${actualDraftsFolderName}/${activeDraftName}`;

    // Get the draft ID
    const draftId = await manager.projectFileService.drafts.getDraftId(draftFolder);
    if (!draftId) {
      new Notice("Failed to get draft ID for backup.");
      return;
    }

    // Check if creating a backup will exceed the max backups limit
    const backupsToDelete = await manager.projectFileService.backups.willExceedMaxBackups(
      draftFolder,
      draftId,
      manager.settings,
    );

    // If creating a backup will require cleanup, ask user for confirmation
    if (backupsToDelete > 0) {
      const confirmed = await new ConfirmBackupCleanupModal(
        manager.app,
        activeDraftName,
        backupsToDelete,
      ).showModal();

      if (!confirmed) {
        debug(`${DEBUG_PREFIX} User cancelled backup creation due to cleanup`);
        new Notice("Backup creation cancelled.");
        return;
      }
    }

    const success = await manager.projectFileService.backups.createBackup(
      draftFolder,
      draftId,
      manager.settings,
    );

    if (success) {
      debug(`${DEBUG_PREFIX} Backup created successfully, backupsToDelete=${backupsToDelete}`);
      // If we needed to clean up backups, do it now
      if (backupsToDelete > 0) {
        debug(
          `${DEBUG_PREFIX} Starting cleanup of ${backupsToDelete} excess backups for ${draftId}`,
        );
        const deleted = await manager.projectFileService.backups.cleanupExcessBackups(
          draftFolder,
          draftId,
          manager.settings,
        );
        debug(`${DEBUG_PREFIX} Cleanup complete, deleted ${deleted} backups`);
      }
      new Notice("Backup created successfully.");
    } else {
      debug(`${DEBUG_PREFIX} Backup creation failed`);
      new Notice("Failed to create backup.");
    }
  };
}
