import type { WriteAidSettings } from "@/types";
import * as archiver from "archiver";
import { App, TFile, TFolder } from "obsidian";
import { getBackupsFolderName } from "./utils";

export class BackupService {
  backupIntervalMinutes = 10;
  maxBackups = 5;
  maxBackupAgeDays = 30;

  constructor(private app: App) {}

  async createBackup(draftFolder: string, settings?: WriteAidSettings): Promise<boolean> {
    try {
      const folder = this.app.vault.getAbstractFileByPath(draftFolder);
      if (!folder || !(folder instanceof TFolder)) {
        console.warn(`BackupService: Draft folder not found: ${draftFolder}`);
        return false;
      }

      // Get all files in the draft folder recursively
      const files = this.getAllFilesInFolder(folder);

      if (files.length === 0) {
        console.warn(`BackupService: No files to backup in: ${draftFolder}`);
        return false;
      }

      // Create backup directory path
      const projectPath = draftFolder.split('/').slice(0, -1).join('/');
      const backupDir = `${projectPath}/${getBackupsFolderName(settings)}`;

      // Ensure backup directory exists
      if (!this.app.vault.getAbstractFileByPath(backupDir)) {
        await this.app.vault.createFolder(backupDir);
      }

      // Generate timestamp for backup filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const draftName = draftFolder.split('/').pop() || 'unknown';
      const backupFileName = `${draftName}_${timestamp}.zip`;
      const backupPath = `${backupDir}/${backupFileName}`;

      // Create zip archive
      const archive = archiver.create('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      // Create a buffer to store the zip data
      const chunks: Uint8Array[] = [];
      archive.on('data', (chunk) => {
        chunks.push(chunk);
      });

      // Add all files to the archive
      for (const file of files) {
        const relativePath = file.path.substring(draftFolder.length + 1);
        const content = await this.app.vault.read(file);
        archive.append(content, { name: relativePath });
      }

      // Finalize the archive
      await new Promise<void>((resolve, reject) => {
        archive.on('end', () => resolve());
        archive.on('error', reject);
        archive.finalize();
      });

      // Combine chunks into a single buffer
      const zipBuffer = Buffer.concat(chunks);

      // Convert Buffer to ArrayBuffer for Obsidian API
      const arrayBuffer = zipBuffer.buffer.slice(
        zipBuffer.byteOffset,
        zipBuffer.byteOffset + zipBuffer.byteLength
      );

      // Write the zip file to the vault
      await this.app.vault.createBinary(backupPath, arrayBuffer);

      console.log(`BackupService: Created backup: ${backupPath}`);
      return true;
    } catch (error) {
      console.error('BackupService: Failed to create backup:', error);
      return false;
    }
  }

  async listBackups(draftFolder: string, settings?: WriteAidSettings): Promise<string[]> {
    try {
      const projectPath = draftFolder.split('/').slice(0, -1).join('/');
      const backupDir = `${projectPath}/${getBackupsFolderName(settings)}`;

      const folder = this.app.vault.getAbstractFileByPath(backupDir);
      if (!folder || !(folder instanceof TFolder)) {
        return [];
      }

      const draftName = draftFolder.split('/').pop() || 'unknown';
      const backups: string[] = [];

      for (const child of folder.children) {
        if (child instanceof TFile &&
            child.name.startsWith(`${draftName}_`) &&
            child.name.endsWith('.zip')) {
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
      console.error('BackupService: Failed to list backups:', error);
      return [];
    }
  }

  async restoreBackup(draftFolder: string, timestamp: string, settings?: WriteAidSettings): Promise<boolean> {
    try {
      const projectPath = draftFolder.split('/').slice(0, -1).join('/');
      const backupDir = `${projectPath}/${getBackupsFolderName(settings)}`;
      const draftName = draftFolder.split('/').pop() || 'unknown';
      const backupFileName = `${draftName}_${timestamp}.zip`;
      const backupPath = `${backupDir}/${backupFileName}`;

      const backupFile = this.app.vault.getAbstractFileByPath(backupPath);
      if (!backupFile || !(backupFile instanceof TFile)) {
        console.warn(`BackupService: Backup file not found: ${backupPath}`);
        return false;
      }

      // Read the zip file
      const zipData = await this.app.vault.readBinary(backupFile);

      // For now, we'll need to implement zip extraction
      // This is a placeholder - full implementation would require a zip extraction library
      console.warn('BackupService: Restore functionality not yet implemented');
      return false;
    } catch (error) {
      console.error('BackupService: Failed to restore backup:', error);
      return false;
    }
  }

  async deleteBackup(draftFolder: string, timestamp: string, settings?: WriteAidSettings): Promise<boolean> {
    try {
      const projectPath = draftFolder.split('/').slice(0, -1).join('/');
      const backupDir = `${projectPath}/${getBackupsFolderName(settings)}`;
      const draftName = draftFolder.split('/').pop() || 'unknown';
      const backupFileName = `${draftName}_${timestamp}.zip`;
      const backupPath = `${backupDir}/${backupFileName}`;

      const backupFile = this.app.vault.getAbstractFileByPath(backupPath);
      if (!backupFile || !(backupFile instanceof TFile)) {
        console.warn(`BackupService: Backup file not found: ${backupPath}`);
        return false;
      }

      await this.app.vault.delete(backupFile);
      console.log(`BackupService: Deleted backup: ${backupPath}`);
      return true;
    } catch (error) {
      console.error('BackupService: Failed to delete backup:', error);
      return false;
    }
  }

  async clearOldBackups(draftFolder: string, maxAgeDays: number, settings?: WriteAidSettings): Promise<void> {
    try {
      const backups = await this.listBackups(draftFolder, settings);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

      for (const timestamp of backups) {
        const backupDate = new Date(timestamp.replace(/-/g, ':'));
        if (backupDate < cutoffDate) {
          await this.deleteBackup(draftFolder, timestamp, settings);
        }
      }
    } catch (error) {
      console.error('BackupService: Failed to clear old backups:', error);
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
