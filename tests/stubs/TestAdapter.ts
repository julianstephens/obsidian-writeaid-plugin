import { DataAdapter, ListedFiles } from "obsidian";
import * as fs from "fs";
import * as path from "path";

/**
 * Filesystem-backed test adapter that implements the Obsidian DataAdapter interface
 * Uses Node.js fs module to perform real disk operations on a temporary vault copy
 */
export class TestAdapter implements Partial<DataAdapter> {
  basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  /**
   * Resolve a vault path to an absolute filesystem path
   */
  private resolvePath(normalPath: string): string {
    return path.join(this.basePath, normalPath);
  }

  /**
   * Check if a file or folder exists
   */
  async exists(normalPath: string): Promise<boolean> {
    try {
      await fs.promises.access(this.resolvePath(normalPath));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read file contents as string
   */
  async read(normalPath: string): Promise<string> {
    return await fs.promises.readFile(this.resolvePath(normalPath), "utf8");
  }

  /**
   * Write file contents
   */
  async write(normalPath: string, data: string): Promise<void> {
    const fullPath = this.resolvePath(normalPath);
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, data, "utf8");
  }

  /**
   * Read file as binary
   */
  async readBinary(normalPath: string): Promise<ArrayBuffer> {
    const buffer = await fs.promises.readFile(this.resolvePath(normalPath));
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  }

  /**
   * Write file as binary
   */
  async writeBinary(normalPath: string, data: ArrayBuffer): Promise<void> {
    const fullPath = this.resolvePath(normalPath);
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, Buffer.from(data));
  }

  /**
   * Get file stats
   */
  async stat(normalPath: string): Promise<{ ctime: number; mtime: number; size: number } | null> {
    try {
      const stats = await fs.promises.stat(this.resolvePath(normalPath));
      return {
        ctime: stats.ctimeMs,
        mtime: stats.mtimeMs,
        size: stats.size,
      };
    } catch {
      return null;
    }
  }

  /**
   * List files and folders in a directory
   */
  async list(normalPath: string): Promise<ListedFiles> {
    const fullPath = this.resolvePath(normalPath);
    const files: string[] = [];
    const folders: string[] = [];

    try {
      const entries = await fs.promises.readdir(fullPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(normalPath, entry.name).replace(/\\/g, "/");
        if (entry.isDirectory()) {
          folders.push(entryPath);
        } else if (entry.isFile()) {
          files.push(entryPath);
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }

    return { files, folders };
  }

  /**
   * Remove a file
   */
  async remove(normalPath: string): Promise<void> {
    await fs.promises.unlink(this.resolvePath(normalPath));
  }

  /**
   * Remove a folder recursively
   */
  async rmdir(normalPath: string, recursive: boolean): Promise<void> {
    await fs.promises.rm(this.resolvePath(normalPath), { recursive, force: true });
  }

  /**
   * Create a folder
   */
  async mkdir(normalPath: string): Promise<void> {
    await fs.promises.mkdir(this.resolvePath(normalPath), { recursive: true });
  }

  /**
   * Rename/move a file or folder
   */
  async rename(normalPath: string, normalNewPath: string): Promise<void> {
    const oldPath = this.resolvePath(normalPath);
    const newPath = this.resolvePath(normalNewPath);
    await fs.promises.mkdir(path.dirname(newPath), { recursive: true });
    await fs.promises.rename(oldPath, newPath);
  }

  /**
   * Copy a file
   */
  async copy(normalPath: string, normalNewPath: string): Promise<void> {
    const oldPath = this.resolvePath(normalPath);
    const newPath = this.resolvePath(normalNewPath);
    await fs.promises.mkdir(path.dirname(newPath), { recursive: true });
    await fs.promises.copyFile(oldPath, newPath);
  }
}
