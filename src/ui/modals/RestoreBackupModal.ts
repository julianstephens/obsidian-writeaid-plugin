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

interface BackupItem {
  timestamp: string;
  size: number;
  displayText: string;
  draftName: string;
  draftFolder: string;
}

export class RestoreBackupModal extends SuggestModal<BackupItem> {
  private backups: BackupItem[] = [];
  private draftFolder: string = "";
  private draftName: string = "";

  constructor(
    app: App,
    private manager: WriteAidManager,
  ) {
    super(app);
    this.setPlaceholder("Select a backup to restore...");
    this.setInstructions([
      { command: "↑↓", purpose: "to navigate" },
      { command: "↵", purpose: "to restore" },
      { command: "esc", purpose: "to cancel" },
    ]);
  }

  async onOpen() {
    const activeProjectPath = this.manager.activeProject;

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
      // First, list all items in the project backup directory
      // const projectItems = await this.app.vault.adapter.list(backupProjectDir);

      const backupDetails: BackupItem[] = [];
      const draftsFolderName = getDraftsFolderName(this.manager.settings);

      // Look for the drafts folder
      const draftsBackupDir = `${backupProjectDir}/${draftsFolderName}`;
      const draftsItems = await this.app.vault.adapter.list(draftsBackupDir);

      // For each draft folder in backups
      for (const draftFolderFullPath of draftsItems.folders) {
        // Extract just the folder name from the full path
        const draftFolderName = draftFolderFullPath.split("/").pop() || draftFolderFullPath;

        const draftBackupDir = `${draftsBackupDir}/${draftFolderName}`;
        const draftItems = await this.app.vault.adapter.list(draftBackupDir);

        // Get the actual draft folder path for restoration
        const draftFolderPath = `${projectName}/${draftsFolderName}/${draftFolderName}`;

        for (const fileName of draftItems.files) {
          // adapter.list() returns full paths, extract just the filename
          const baseName = fileName.split("/").pop() || fileName;
          // More flexible matching: look for files that contain the draft name followed by underscore and timestamp
          const draftNamePattern = draftFolderName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escape special regex chars
          const backupPattern = new RegExp(
            `^${draftNamePattern}_(\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2})\\.zip$`,
          );
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
              displayText: `${draftFolderName}: ${formattedDate} (${sizeText})`,
              draftName: draftFolderName,
              draftFolder: draftFolderPath,
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
    // Check if the draft folder already exists
    const draftFolderExists = this.app.vault.getAbstractFileByPath(backup.draftFolder);

    if (draftFolderExists && draftFolderExists instanceof TFolder) {
      // Show confirmation modal
      const confirmModal = new ConfirmOverwriteModal(this.app, backup.draftFolder, true);
      const confirmed = await confirmModal.open();

      if (!confirmed) {
        return; // User cancelled
      }
    }

    // Restore the backup
    const success = await this.manager.projectFileService.backups.restoreBackup(
      backup.draftFolder,
      backup.timestamp,
      this.manager.settings,
    );

    if (success) {
      new Notice(
        `Backup restored successfully for "${backup.draftName}" from ${backup.displayText.split(": ")[1].split(" (")[0]}.`,
      );
    } else {
      new Notice("Failed to restore backup.");
    }
  }
}
