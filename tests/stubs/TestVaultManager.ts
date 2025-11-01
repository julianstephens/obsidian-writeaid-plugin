import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { TestApp } from "./TestApp";

/**
 * Manages temporary test vault copies for integration tests
 */
export class TestVaultManager {
  private tempDir: string | null = null;
  private app: TestApp | null = null;

  /**
   * Create a temporary copy of the test vault template
   * @param templatePath Path to the test-vault-template directory
   * @returns TestApp instance pointing to the temporary vault
   */
  async createTempVault(templatePath: string): Promise<TestApp> {
    // Create a unique temporary directory
    this.tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "watest-"));

    // Copy the template vault to the temp directory
    await this.copyDir(templatePath, this.tempDir);

    // Create and initialize the test app
    this.app = new TestApp(this.tempDir);
    await this.app.initialize();

    return this.app;
  }

  /**
   * Clean up the temporary vault
   */
  async cleanup(): Promise<void> {
    if (this.tempDir) {
      try {
        await fs.promises.rm(this.tempDir, { recursive: true, force: true });
      } catch (error) {
        console.warn(`Failed to cleanup temp directory ${this.tempDir}:`, error);
      }
      this.tempDir = null;
      this.app = null;
    }
  }

  /**
   * Get the temporary vault path
   */
  getTempPath(): string | null {
    return this.tempDir;
  }

  /**
   * Get the test app instance
   */
  getApp(): TestApp | null {
    return this.app;
  }

  /**
   * Recursively copy a directory
   */
  private async copyDir(src: string, dest: string): Promise<void> {
    await fs.promises.mkdir(dest, { recursive: true });
    const entries = await fs.promises.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDir(srcPath, destPath);
      } else {
        await fs.promises.copyFile(srcPath, destPath);
      }
    }
  }
}
