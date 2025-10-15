


class BackupService {
    backupIntervalMinutes = 10;
    maxBackups = 5;
    maxBackupAgeDays = 30;

    constructor() {
    }

    async createBackup(draftFolder: string) {
    }

    async listBackups(draftFolder: string): Promise<string[]> {
        return [];
    }

    async restoreBackup(draftFolder: string, timestamp: string): Promise<boolean> {
        return false;
    }

    async deleteBackup(draftFolder: string, timestamp: string): Promise<boolean> {
        return false;
    }

    async clearOldBackups(draftFolder: string, maxAgeDays: number): Promise<void> {
    }
}