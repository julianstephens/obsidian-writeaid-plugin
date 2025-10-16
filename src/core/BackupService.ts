import type { WriteAidSettings } from "@/types";
import * as JSZip from "jszip";
import { App, TFile, TFolder } from "obsidian";
import { debug, DEBUG_PREFIX, getBackupsFolderName } from "./utils";

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

  async createBackup(draftFolder: string, settings?: WriteAidSettings): Promise<boolean> {
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

      // Create backup directory path - match draft location exactly
      const projectName = draftFolder.split("/")[0] || "unknown";
      const draftsFolderName = draftFolder.split("/")[1] || "drafts";
      const draftName = draftFolder.split("/").pop() || "unknown";
      const backupDir = `${getBackupsFolderName(settings)}/${projectName}/${draftsFolderName}/${draftName}`;

      // Ensure backup directory exists
      const dirExists = await this.app.vault.adapter.exists(backupDir);
      if (!dirExists) {
        await this.app.vault.createFolder(backupDir);
      }

      // Generate timestamp for backup filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
      const backupFileName = `${draftName}_${timestamp}.zip`;
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

  async listBackups(draftFolder: string, settings?: WriteAidSettings): Promise<string[]> {
    try {
      const projectName = draftFolder.split("/")[0] || "unknown";
      const draftsFolderName = draftFolder.split("/")[1] || "drafts";
      const draftFolderName = draftFolder.split("/").pop() || "unknown";
      const backupDir = `${getBackupsFolderName(settings)}/${projectName}/${draftsFolderName}/${draftFolderName}`;

      const folder = this.app.vault.getAbstractFileByPath(backupDir);
      if (!folder || !(folder instanceof TFolder)) {
        return [];
      }

      const draftName = draftFolder.split("/").pop() || "unknown";
      const backups: string[] = [];

      for (const child of folder.children) {
        if (
          child instanceof TFile &&
          child.name.startsWith(`${draftName}_`) &&
          child.name.endsWith(".zip")
        ) {
          // Extract timestamp from filename (format: draftName_YYYY-MM-DDTHH-MM-SS.zip)
          const timestampMatch = child.name.match(/_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})\.zip$/);
          if (timestampMatch) {
            backups.push(timestampMatch[1]);
          }
        }
      }

      // Sort by timestamp (newest first)
      return backups.sort().reverse();
    } catch (error) {
      debug(`${DEBUG_PREFIX} Failed to list backups:`, error);
      return [];
    }
  }

  async restoreBackup(
    draftFolder: string,
    timestamp: string,
    settings?: WriteAidSettings,
  ): Promise<boolean> {
    try {
      const projectName = draftFolder.split("/")[0] || "unknown";
      const draftsFolderName = draftFolder.split("/")[1] || "drafts";
      const draftName = draftFolder.split("/").pop() || "unknown";
      const backupDir = `${getBackupsFolderName(settings)}/${projectName}/${draftsFolderName}/${draftName}`;
      const backupFileName = `${draftName}_${timestamp}.zip`;
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
    timestamp: string,
    settings?: WriteAidSettings,
  ): Promise<boolean> {
    try {
      const projectName = draftFolder.split("/")[0] || "unknown";
      const draftsFolderName = draftFolder.split("/")[1] || "drafts";
      const draftName = draftFolder.split("/").pop() || "unknown";
      const backupDir = `${getBackupsFolderName(settings)}/${projectName}/${draftsFolderName}/${draftName}`;
      const backupFileName = `${draftName}_${timestamp}.zip`;
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

  async clearOldBackups(draftFolder: string, settings?: WriteAidSettings): Promise<void> {
    try {
      const backups = await this.listBackups(draftFolder, settings);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.maxBackupAgeDays);

      for (const timestamp of backups) {
        const backupDate = new Date(timestamp.replace(/-/g, ":"));
        if (backupDate < cutoffDate) {
          await this.deleteBackup(draftFolder, timestamp, settings);
        }
      }
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
