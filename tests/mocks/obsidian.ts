/**
 * Mock Obsidian API for unit tests
 * Only includes what's used by the utility functions
 */

export class Notice {
  constructor(_message: string, _timeout?: number) {
    // Mock - do nothing in tests
  }
}

export class App {}
export class Plugin {}
export class TFile {}
export class TFolder {}
export class TAbstractFile {}
export class Vault {}
export class DataAdapter {}
export class Modal {}
export class Setting {}
export class PluginSettingTab {}
export class ItemView {}

export interface ListedFiles {
  files: string[];
  folders: string[];
}

export function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}
