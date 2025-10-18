import {
    BYTES_PER_KILOBYTE,
    debug,
    DEBUG_PREFIX,
    FILE_SIZE_UNITS,
    getBackupsFolderName,
    getDraftsFolderName,
} from "@/core/utils";
import type { WriteAidManager } from "@/manager";
import { WriteAidError } from "@/types";
import { App, Notice, SuggestModal, TFolder } from "obsidian";
import { ConfirmOverwriteModal } from "./ConfirmOverwriteModal";
import { RenameRestoredDraftModal } from "./RenameRestoredDraftModal";

interface BackupItem {
  timestamp: string;
  size: number;
  displayText: string;
  draftName: string;
  draftFolder: string;
  draftId: string;
}

export class RestoreBackupModal extends SuggestModal<BackupItem> {
  private backups: BackupItem[] = [];
  private draftFolder: string = "";
  private draftName: string = "";
  private onRestoreComplete?: () => void;

  constructor(
    app: App,
    private manager: WriteAidManager,
    onRestoreComplete?: () => void,
  ) {
    super(app);
    this.onRestoreComplete = onRestoreComplete;
    this.setPlaceholder("Select a backup to restore...");
    this.setInstructions([
      { command: "↑↓", purpose: "to navigate" },
      { command: "↵", purpose: "to restore" },
      { command: "esc", purpose: "to cancel" },
    ]);
  }

  async onOpen() {
    const activeProjectPath = this.manager.activeProject;

    debug(`${DEBUG_PREFIX} RestoreBackupModal opened for project: ${activeProjectPath}`);

    if (!activeProjectPath) {
      new Notice("No active project found.");
      this.close();
      return;
    }

    const draftsFolderName = getDraftsFolderName(this.manager.settings);
    this.draftFolder = `${activeProjectPath}/${draftsFolderName}`;
    this.draftName = activeProjectPath; // Use project name for display

    // Get backup details for all drafts in the project
    this.backups = await this.getBackupDetails();

    debug(
      `${DEBUG_PREFIX} Found ${this.backups.length} backups for project: ${activeProjectPath}`,
    );

    if (this.backups.length === 0) {
      new Notice(WriteAidError.BACKUPS_NOT_FOUND_PROJECT);
      this.close();
      return;
    }

    // Set the modal title
    this.setTitle(`Restore Backup for Project "${activeProjectPath}"`);

    // Call parent onOpen to initialize the modal
    super.onOpen();
  }

  private async getBackupDetails(): Promise<BackupItem[]> {
    const projectName = this.draftFolder.split("/")[0] || "unknown";
    const backupProjectDir = `${getBackupsFolderName(this.manager.settings)}/${projectName}`;

    try {
      const backupDetails: BackupItem[] = [];
      const draftsFolderName = getDraftsFolderName(this.manager.settings);

      // Find the actual drafts folder name in backups (case-insensitive)
      let actualBackupDraftsFolderName = draftsFolderName;
      try {
        const backupProjectContents = await this.app.vault.adapter.list(backupProjectDir);
        for (const folder of backupProjectContents.folders) {
          const folderName = folder.split("/").pop() || folder;
          if (folderName.toLowerCase() === draftsFolderName.toLowerCase()) {
            actualBackupDraftsFolderName = folderName;
            break;
          }
        }
      } catch {
        debug(
          `${DEBUG_PREFIX} Could not read backup project directory: ${backupProjectDir}`,
        );
      }

      // Look for the drafts folder in backups
      const draftsBackupDir = `${backupProjectDir}/${actualBackupDraftsFolderName}`;
      debug(`${DEBUG_PREFIX} Looking for backups in: ${draftsBackupDir}`);
      const draftsItems = await this.app.vault.adapter.list(draftsBackupDir);

      // For each draft ID folder in backups
      for (const draftIdFolderPath of draftsItems.folders) {
        // Extract just the folder name (which is now the draft ID)
        const draftId = draftIdFolderPath.split("/").pop() || draftIdFolderPath;

        // Get the draft name from the actual draft folder by finding which draft has this ID
        let draftName = draftId; // Fallback to ID if we can't find the name

        // List all drafts in the current project to find the one with this ID
        const draftsFolderPath = `${projectName}/${draftsFolderName}`;
        const drafts = this.manager.projectFileService.drafts.listDrafts(projectName);
        for (const draft of drafts) {
          const draftPath = `${draftsFolderPath}/${draft}`;
          const draftIdFromFolder =
            await this.manager.projectFileService.drafts.getDraftId(draftPath);
          if (draftIdFromFolder === draftId) {
            draftName = draft;
            break;
          }
        }

        const draftBackupDir = `${draftsBackupDir}/${draftId}`;
        const draftItems = await this.app.vault.adapter.list(draftBackupDir);

        // Get the actual draft folder path for restoration - need to find the real folder in the vault
        const projectFolder = this.app.vault.getAbstractFileByPath(projectName);
        let actualDraftsFolderName = draftsFolderName;
        
        if (projectFolder && projectFolder instanceof TFolder) {
          for (const child of projectFolder.children) {
            if (child instanceof TFolder && child.name.toLowerCase() === draftsFolderName.toLowerCase()) {
              actualDraftsFolderName = child.name;
              break;
            }
          }
        }
        
        const draftFolderPath = `${projectName}/${actualDraftsFolderName}/${draftName}`;

        for (const fileName of draftItems.files) {
          // adapter.list() returns full paths, extract just the filename
          const baseName = fileName.split("/").pop() || fileName;
          // Match the new backup filename format: YYYY-MM-DDTHH-MM-SS.zip
          const backupPattern = new RegExp(`^(\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2})\\.zip$`);
          const match = baseName.match(backupPattern);

          if (match) {
            // Get file stats using the full path
            const stat = await this.app.vault.adapter.stat(fileName);
            const size = stat?.size || 0;
            const timestamp = match[1];

            // Format the display text
            // Convert timestamp format from "2025-10-15T21-45-12" to "2025-10-15T21:45:12"
            const dateString = timestamp.replace(/T(\d{2})-(\d{2})-(\d{2})/, "T$1:$2:$3");
            const date = new Date(dateString);
            const formattedDate = date.toLocaleString();
            const sizeText = this.formatFileSize(size);

            backupDetails.push({
              timestamp,
              size,
              displayText: `${draftName}: ${formattedDate} (${sizeText})`,
              draftName,
              draftFolder: draftFolderPath,
              draftId,
            });
          }
        }
      }

      // Sort by timestamp (newest first)
      return backupDetails.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    } catch {
      debug(
        `${DEBUG_PREFIX} Backup directory does not exist yet for project '${backupProjectDir}' (this is normal for new projects)`,
      );
      return [];
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const i = Math.floor(Math.log(bytes) / Math.log(BYTES_PER_KILOBYTE));
    return (
      parseFloat((bytes / Math.pow(BYTES_PER_KILOBYTE, i)).toFixed(1)) + " " + FILE_SIZE_UNITS[i]
    );
  }

  getSuggestions(query: string): BackupItem[] {
    return this.backups.filter((backup) =>
      backup.displayText.toLowerCase().includes(query.toLowerCase()),
    );
  }

  renderSuggestion(backup: BackupItem, el: HTMLElement) {
    el.createEl("div", { text: backup.displayText });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onChooseSuggestion(backup: BackupItem, _evt: MouseEvent | KeyboardEvent) {
    const previousActiveDraft = this.manager.activeDraft;
    debug(`${DEBUG_PREFIX} Restoring backup: ${backup.draftName} (${backup.timestamp}), current active draft: ${previousActiveDraft}`);

    // Check if the draft folder already exists
    const draftFolderExists = this.app.vault.getAbstractFileByPath(backup.draftFolder);

    let finalDraftFolder = backup.draftFolder;
    let finalDraftName = backup.draftName;

    if (draftFolderExists && draftFolderExists instanceof TFolder) {
      // Show confirmation modal for overwrite
      const confirmModal = new ConfirmOverwriteModal(this.app, backup.draftFolder, true);
      const confirmed = await confirmModal.open();

      if (!confirmed) {
        debug(`${DEBUG_PREFIX} Backup restore cancelled by user`);
        return; // User cancelled
      }
    } else {
      // Draft folder doesn't exist - prompt for a new draft name
      const renameModal = new RenameRestoredDraftModal(this.app, backup.draftName, (newName) => {
        finalDraftName = newName;
      });
      
      await new Promise<void>((resolve) => {
        const onClose = renameModal.onClose;
        renameModal.onClose = () => {
          if (onClose) onClose.call(renameModal);
          resolve();
        };
        renameModal.open();
      });

      if (finalDraftName === backup.draftName && !draftFolderExists) {
        // User cancelled the rename modal
        debug(`${DEBUG_PREFIX} Backup restore cancelled by user (rename modal)`);
        return;
      }

      // Update the draft folder path with the new name
      const projectPath = backup.draftFolder.split("/").slice(0, -1).join("/");
      finalDraftFolder = `${projectPath}/${finalDraftName}`;
    }

    // Restore the backup
    const success = await this.manager.projectFileService.backups.restoreBackup(
      finalDraftFolder,
      backup.draftId,
      backup.timestamp,
      this.manager.settings,
    );

    if (success) {
      new Notice(
        `Backup restored successfully for "${finalDraftName}" from ${backup.displayText.split(": ")[1].split(" (")[0]}.`,
      );
      debug(
        `${DEBUG_PREFIX} Backup restore successful for: ${finalDraftName}, active draft preserved: ${previousActiveDraft} -> ${this.manager.activeDraft}`,
      );
      // Trigger refresh of the drafts section in the project panel
      // This does NOT change the active draft
      if (this.onRestoreComplete) {
        this.onRestoreComplete();
      }
    } else {
      new Notice("Failed to restore backup.");
      debug(`${DEBUG_PREFIX} Backup restore failed for: ${finalDraftName}`);
    }
  }
}
