import { TAbstractFile, TFile, TFolder, Vault } from "obsidian";
import { TestAdapter } from "./TestAdapter";
import * as fs from "fs";
import * as path from "path";

/**
 * Minimal TFile implementation for tests
 */
export class TestTFile extends TFile {
  constructor(vault: Vault, filePath: string) {
    super();
    this.vault = vault;
    this.path = filePath;
    this.name = path.basename(filePath);
    this.basename = this.name.replace(/\.[^.]+$/, "");
    this.extension = path.extname(filePath).slice(1);
    this.parent = null; // Simplified for tests
  }

  vault: Vault;
  path: string;
  name: string;
  basename: string;
  extension: string;
  parent: TFolder | null;
  stat = { ctime: Date.now(), mtime: Date.now(), size: 0 };
}

/**
 * Minimal TFolder implementation for tests
 */
export class TestTFolder extends TFolder {
  constructor(vault: Vault, folderPath: string) {
    super();
    this.vault = vault;
    this.path = folderPath;
    this.name = path.basename(folderPath);
    this.parent = null; // Simplified for tests
    this.children = [];
  }

  vault: Vault;
  path: string;
  name: string;
  parent: TFolder | null;
  children: TAbstractFile[];
  isRoot(): boolean {
    return this.path === "/";
  }
}

/**
 * Filesystem-backed test vault that implements the Obsidian Vault interface
 */
export class TestVault extends Vault {
  adapter: TestAdapter;
  private fileCache: Map<string, TestTFile>;
  private folderCache: Map<string, TestTFolder>;

  constructor(basePath: string) {
    super();
    this.adapter = new TestAdapter(basePath);
    this.fileCache = new Map();
    this.folderCache = new Map();
  }

  /**
   * Refresh the file/folder cache by scanning the filesystem
   */
  async refreshCache(): Promise<void> {
    this.fileCache.clear();
    this.folderCache.clear();

    const scanDir = async (dirPath: string) => {
      const listed = await this.adapter.list(dirPath);

      for (const folderPath of listed.folders) {
        const folder = new TestTFolder(this, folderPath);
        this.folderCache.set(folderPath, folder);
        await scanDir(folderPath);
      }

      for (const filePath of listed.files) {
        const file = new TestTFile(this, filePath);
        this.fileCache.set(filePath, file);
      }
    };

    await scanDir("");

    // After scanning, populate children arrays for folders
    this.populateFolderChildren();
  }

  /**
   * Populate children arrays for all folders based on cached files/folders
   */
  private populateFolderChildren(): void {
    // Clear all children first
    for (const folder of this.folderCache.values()) {
      folder.children = [];
    }

    // Add folders as children of their parent
    for (const folder of this.folderCache.values()) {
      const parentPath = path.dirname(folder.path).replace(/\\/g, "/");
      if (parentPath === ".") {
        // Root level folder
        continue;
      }
      const parent = this.folderCache.get(parentPath);
      if (parent) {
        parent.children.push(folder);
      }
    }

    // Add files as children of their parent
    for (const file of this.fileCache.values()) {
      const parentPath = path.dirname(file.path).replace(/\\/g, "/");
      if (parentPath === ".") {
        // Root level file
        continue;
      }
      const parent = this.folderCache.get(parentPath);
      if (parent) {
        parent.children.push(file);
      }
    }
  }

  /**
   * Get root folder
   */
  getRoot(): TFolder {
    return new TestTFolder(this, "");
  }

  /**
   * Get file or folder by path
   */
  getAbstractFileByPath(path: string): TAbstractFile | null {
    // Normalize path
    const normalPath = path.replace(/^\//, "").replace(/\/$/, "");

    if (normalPath === "") {
      return this.getRoot();
    }

    // Check file cache first
    if (this.fileCache.has(normalPath)) {
      return this.fileCache.get(normalPath)!;
    }

    // Check folder cache
    if (this.folderCache.has(normalPath)) {
      return this.folderCache.get(normalPath)!;
    }

    // If not in cache, return null (don't re-scan filesystem)
    // This prevents deleted items from being re-added to cache
    return null;
  }

  /**
   * Get all markdown files
   */
  getMarkdownFiles(): TFile[] {
    return Array.from(this.fileCache.values()).filter((f) => f.extension === "md");
  }

  /**
   * Get all files
   */
  getFiles(): TFile[] {
    return Array.from(this.fileCache.values());
  }

  /**
   * Read file contents
   */
  async read(file: TFile): Promise<string> {
    return await this.adapter.read(file.path);
  }

  /**
   * Read file as binary
   */
  async readBinary(file: TFile): Promise<ArrayBuffer> {
    return await this.adapter.readBinary!(file.path);
  }

  /**
   * Modify file contents
   */
  async modify(file: TFile, data: string): Promise<void> {
    await this.adapter.write(file.path, data);
  }

  /**
   * Create a new file
   */
  async create(path: string, data: string): Promise<TFile> {
    await this.adapter.write(path, data);
    const file = new TestTFile(this, path);
    this.fileCache.set(path, file);
    // Auto-refresh to ensure other methods see the new file
    await this.refreshCache();
    return file;
  }

  /**
   * Create a folder
   */
  async createFolder(path: string): Promise<TFolder> {
    await this.adapter.mkdir(path);
    const folder = new TestTFolder(this, path);
    this.folderCache.set(path, folder);
    // Auto-refresh to ensure other methods see the new folder
    await this.refreshCache();
    return folder;
  }

  /**
   * Delete a file
   */
  async delete(file: TFile | TFolder, _force?: boolean): Promise<void> {
    if (file instanceof TFile) {
      await this.adapter.remove(file.path);
      this.fileCache.delete(file.path);
    } else if (file instanceof TFolder) {
      await this.adapter.rmdir(file.path, true);
      this.folderCache.delete(file.path);
    }
    // Auto-refresh to ensure deletion is reflected
    await this.refreshCache();
  }

  /**
   * Rename a file or folder
   */
  async rename(file: TAbstractFile, newPath: string): Promise<void> {
    await this.adapter.rename(file.path, newPath);

    if (file instanceof TFile) {
      this.fileCache.delete(file.path);
      file.path = newPath;
      file.name = path.basename(newPath);
      file.basename = file.name.replace(/\.[^.]+$/, "");
      this.fileCache.set(newPath, file as TestTFile);
    } else if (file instanceof TFolder) {
      this.folderCache.delete(file.path);
      file.path = newPath;
      file.name = path.basename(newPath);
      this.folderCache.set(newPath, file as TestTFolder);
    }
  }

  /**
   * Copy a file
   */
  async copy(file: TFile, newPath: string): Promise<TFile> {
    await this.adapter.copy!(file.path, newPath);
    const newFile = new TestTFile(this, newPath);
    this.fileCache.set(newPath, newFile);
    return newFile;
  }
}
