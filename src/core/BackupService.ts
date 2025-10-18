import type { WriteAidSettings } from "@/types";
import * as JSZip from "jszip";
import { App, TFile, TFolder } from "obsidian";
import {
  BACKUP_FILE_EXTENSION,
  BACKUP_TIMESTAMP_REGEX,
  debug,
  DEBUG_PREFIX,
  getBackupsFolderName,
} from "./utils";

export class BackupService {
  constructor(
    private app: App,
    private settings?: WriteAidSettings,
  ) {}

  get maxBackups(): number {
    return this.settings?.maxBackups ?? 5;
  }

  get maxBackupAgeDays(): number {
    return this.settings?.maxBackupAgeDays ?? 30;
  }

  /**
   * Check if creating a new backup will exceed the max backups limit.
   * Returns the number of backups that will be deleted to make room, or 0 if no cleanup needed.
   */
  async willExceedMaxBackups(
    draftFolder: string,
    draftId: string,
    settings?: WriteAidSettings,
  ): Promise<number> {
    const backups = await this.listBackups(draftFolder, draftId, settings);
    const currentCount = backups.length;
    const maxBackups = settings?.maxBackups ?? 5;

    // After creating a new backup, we'll have currentCount + 1 backups
    const countAfterCreate = currentCount + 1;

    // If the new total will exceed the max, calculate how many to delete
    if (countAfterCreate > maxBackups) {
      // We need to delete (countAfterCreate - maxBackups) backups
      return countAfterCreate - maxBackups;
    }

    return 0;
  }

  /**
   * Clean up excess backups by count (keeps the most recent ones).
   * This respects the maxBackups setting and deletes oldest backups first.
   */
  async cleanupExcessBackups(
    draftFolder: string,
    draftId: string,
    settings?: WriteAidSettings,
  ): Promise<number> {
    const backups = await this.listBackups(draftFolder, draftId, settings);
    const maxBackups = settings?.maxBackups ?? 5;

    debug(
      `${DEBUG_PREFIX} cleanupExcessBackups: found ${backups.length} backups, max allowed: ${maxBackups}`,
    );

    let deletedCount = 0;
    if (backups.length > maxBackups) {
      // Delete oldest backups (they're sorted newest first)
      for (let i = maxBackups; i < backups.length; i++) {
        debug(`${DEBUG_PREFIX} cleanupExcessBackups: deleting backup ${i + 1}/${backups.length}`);
        const deleted = await this.deleteBackup(draftFolder, draftId, backups[i], settings);
        if (deleted) {
          deletedCount++;
        }
      }
    }

    debug(`${DEBUG_PREFIX} cleanupExcessBackups: deleted ${deletedCount} backups`);
    return deletedCount;
  }

  async createBackup(
    draftFolder: string,
    draftId: string,
    settings?: WriteAidSettings,
  ): Promise<boolean> {
    try {
      const folder = this.app.vault.getAbstractFileByPath(draftFolder);
      if (!folder || !(folder instanceof TFolder)) {
        debug(`${DEBUG_PREFIX} Draft folder not found: ${draftFolder}`);
        return false;
      }

      // Get all files in the draft folder recursively
      const files = this.getAllFilesInFolder(folder);

      if (files.length === 0) {
        debug(`${DEBUG_PREFIX} No files to backup in: ${draftFolder}`);
        return false;
      }

      // Create backup directory path using draft ID instead of draft name
      const projectName = draftFolder.split("/")[0] || "unknown";
      const draftsFolderName = draftFolder.split("/")[1] || "drafts";
      const backupDir = `${getBackupsFolderName(settings)}/${projectName}/${draftsFolderName}/${draftId}`;

      // Ensure backup directory exists
      const dirExists = await this.app.vault.adapter.exists(backupDir);
      if (!dirExists) {
        await this.app.vault.createFolder(backupDir);
      }

      // Generate timestamp for backup filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
      const backupFileName = `${timestamp}${BACKUP_FILE_EXTENSION}`;
      const backupPath = `${backupDir}/${backupFileName}`;

      // Create zip archive
      const zip = new JSZip.default();

      // Add all files to the archive
      for (const file of files) {
        const relativePath = file.path.substring(draftFolder.length + 1);
        const content = await this.app.vault.read(file);
        zip.file(relativePath, content);
      }

      // Generate the zip file with maximum compression
      const zipBuffer = await zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 9 },
      });

      // Convert Buffer to ArrayBuffer for Obsidian API
      const arrayBuffer = new Uint8Array(zipBuffer).buffer;

      // Write the zip file to the vault
      await this.app.vault.createBinary(backupPath, arrayBuffer);

      debug(`${DEBUG_PREFIX} Created backup: ${backupPath}`);
      return true;
    } catch (error) {
      debug(`${DEBUG_PREFIX} Failed to create backup:`, error);
      return false;
    }
  }

  async listBackups(
    draftFolder: string,
    draftId: string,
    settings?: WriteAidSettings,
  ): Promise<string[]> {
    debug(
      `${DEBUG_PREFIX} listBackups called for draftFolder: ${draftFolder}, draftId: ${draftId}`,
    );
    try {
      const projectName = draftFolder.split("/")[0] || "unknown";
      const draftsFolderName = draftFolder.split("/")[1] || "drafts";
      const backupDir = `${getBackupsFolderName(settings)}/${projectName}/${draftsFolderName}/${draftId}`;

      debug(`${DEBUG_PREFIX} listBackups checking backupDir: ${backupDir}`);

      // Check if directory exists using adapter
      const exists = await this.app.vault.adapter.exists(backupDir);
      if (!exists) {
        debug(`${DEBUG_PREFIX} listBackups backupDir does not exist on disk`);
        return [];
      }

      const backups: string[] = [];

      // Use adapter to list files directly instead of relying on vault cache
      try {
        const files = await this.app.vault.adapter.list(backupDir);
        debug(
          `${DEBUG_PREFIX} listBackups adapter found ${files.files.length} files, ${files.folders.length} folders`,
        );

        for (const filepath of files.files) {
          // adapter.list returns full paths, extract just the filename
          const filename = filepath.split("/").pop() || "";
          debug(
            `${DEBUG_PREFIX} listBackups examining file: ${filename}, endsWith .zip: ${filename.endsWith(BACKUP_FILE_EXTENSION)}`,
          );
          if (filename.endsWith(BACKUP_FILE_EXTENSION)) {
            // Extract timestamp from filename (format: YYYY-MM-DDTHH-MM-SS.zip)
            const timestampMatch = filename.match(BACKUP_TIMESTAMP_REGEX);
            debug(
              `${DEBUG_PREFIX} listBackups match for ${filename}: ${timestampMatch?.[1] ?? "no match"}`,
            );
            if (timestampMatch) {
              backups.push(timestampMatch[1]);
            }
          }
        }
      } catch (e) {
        debug(`${DEBUG_PREFIX} listBackups error reading backup directory: ${e}`);
        return [];
      }

      // Sort by timestamp (newest first)
      const sortedBackups = backups.sort().reverse();
      debug(
        `${DEBUG_PREFIX} listBackups found ${sortedBackups.length} backups for ${draftId}: [${sortedBackups.join(", ")}]`,
      );
      return sortedBackups;
    } catch (error) {
      debug(`${DEBUG_PREFIX} Failed to list backups:`, error);
      return [];
    }
  }

  async restoreBackup(
    draftFolder: string,
    draftId: string,
    timestamp: string,
    settings?: WriteAidSettings,
  ): Promise<boolean> {
    debug(
      `${DEBUG_PREFIX} restoreBackup called for draftFolder: ${draftFolder}, draftId: ${draftId}, timestamp: ${timestamp}`,
    );
    try {
      const projectName = draftFolder.split("/")[0] || "unknown";
      const draftsFolderName = draftFolder.split("/")[1] || "drafts";
      const backupDir = `${getBackupsFolderName(settings)}/${projectName}/${draftsFolderName}/${draftId}`;
      const backupFileName = `${timestamp}${BACKUP_FILE_EXTENSION}`;
      const backupPath = `${backupDir}/${backupFileName}`;

      // Check if backup file exists using adapter
      const backupStat = await this.app.vault.adapter.stat(backupPath);
      if (!backupStat) {
        debug(`${DEBUG_PREFIX} Backup file not found: ${backupPath}`);
        return false;
      }

      // Read the zip file using adapter
      const zipData = await this.app.vault.adapter.readBinary(backupPath);

      // Load the zip file with JSZip
      const zip = await JSZip.default.loadAsync(zipData);

      // Ensure the draft folder exists
      const draftFolderExists = this.app.vault.getAbstractFileByPath(draftFolder);
      if (!draftFolderExists) {
        await this.app.vault.createFolder(draftFolder);
      }

      // Extract all files
      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) {
          // Create directory if it doesn't exist
          const fullPath = `${draftFolder}/${relativePath}`;
          if (!this.app.vault.getAbstractFileByPath(fullPath)) {
            await this.app.vault.createFolder(fullPath);
          }
        } else {
          // Extract file content
          const content = await zipEntry.async("text");
          const fullPath = `${draftFolder}/${relativePath}`;

          // Ensure parent directory exists
          const parentDir = fullPath.substring(0, fullPath.lastIndexOf("/"));
          if (!this.app.vault.getAbstractFileByPath(parentDir)) {
            await this.app.vault.createFolder(parentDir);
          }

          // Create or overwrite the file
          const existingFile = this.app.vault.getAbstractFileByPath(fullPath);
          if (existingFile && existingFile instanceof TFile) {
            await this.app.vault.modify(existingFile, content);
          } else {
            await this.app.vault.create(fullPath, content);
          }
        }
      }

      debug(`${DEBUG_PREFIX} Restored backup: ${backupPath}`);
      return true;
    } catch (error) {
      debug(`${DEBUG_PREFIX} Failed to restore backup:`, error);
      return false;
    }
  }

  async deleteBackup(
    draftFolder: string,
    draftId: string,
    timestamp: string,
    settings?: WriteAidSettings,
  ): Promise<boolean> {
    debug(
      `${DEBUG_PREFIX} deleteBackup called for draftFolder: ${draftFolder}, draftId: ${draftId}, timestamp: ${timestamp}`,
    );
    try {
      const projectName = draftFolder.split("/")[0] || "unknown";
      const draftsFolderName = draftFolder.split("/")[1] || "drafts";
      const backupDir = `${getBackupsFolderName(settings)}/${projectName}/${draftsFolderName}/${draftId}`;
      const backupFileName = `${timestamp}${BACKUP_FILE_EXTENSION}`;
      const backupPath = `${backupDir}/${backupFileName}`;

      // Check if backup file exists using adapter
      const backupStat = await this.app.vault.adapter.stat(backupPath);
      if (!backupStat) {
        debug(`${DEBUG_PREFIX} Backup file not found for deletion: ${backupPath}`);
        return false;
      }

      // Delete the backup file using adapter
      await this.app.vault.adapter.remove(backupPath);
      debug(`${DEBUG_PREFIX} Deleted backup: ${backupPath}`);
      return true;
    } catch (error) {
      debug(`${DEBUG_PREFIX} Failed to delete backup:`, error);
      return false;
    }
  }

  async clearOldBackups(
    draftFolder: string,
    draftId: string,
    settings?: WriteAidSettings,
  ): Promise<void> {
    debug(
      `${DEBUG_PREFIX} clearOldBackups called for draftFolder: ${draftFolder}, draftId: ${draftId}`,
    );
    try {
      const backups = await this.listBackups(draftFolder, draftId, settings);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.maxBackupAgeDays);

      let deletedCount = 0;
      for (const timestamp of backups) {
        const backupDate = new Date(timestamp.replace(/-/g, ":"));
        if (backupDate < cutoffDate) {
          await this.deleteBackup(draftFolder, draftId, timestamp, settings);
          deletedCount++;
        }
      }
      debug(`${DEBUG_PREFIX} clearOldBackups removed ${deletedCount} old backups for ${draftId}`);
    } catch (error) {
      debug(`${DEBUG_PREFIX} Failed to clear old backups:`, error);
    }
  }

  private getAllFilesInFolder(folder: TFolder): TFile[] {
    const files: TFile[] = [];

    function walk(currentFolder: TFolder) {
      for (const child of currentFolder.children) {
        if (child instanceof TFile) {
          files.push(child);
        } else if (child instanceof TFolder) {
          walk(child);
        }
      }
    }

    walk(folder);
    return files;
  }
}
