export class BackupService {
  backupIntervalMinutes = 10;
  maxBackups = 5;
  maxBackupAgeDays = 30;

  constructor() {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createBackup(draftFolder: string) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async listBackups(draftFolder: string): Promise<string[]> {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async restoreBackup(draftFolder: string, timestamp: string): Promise<boolean> {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async deleteBackup(draftFolder: string, timestamp: string): Promise<boolean> {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async clearOldBackups(draftFolder: string, maxAgeDays: number): Promise<void> {}
}
