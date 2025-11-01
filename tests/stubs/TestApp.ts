import { App } from "obsidian";
import { TestVault } from "./TestVault";

/**
 * Minimal App implementation for tests
 */
export class TestApp extends App {
  vault: TestVault;
  plugins: any;

  constructor(basePath: string) {
    super();
    this.vault = new TestVault(basePath);
    // Mock plugins object to prevent errors in services
    this.plugins = {
      getPlugin: () => null,
    };
  }

  /**
   * Initialize the app by refreshing the vault cache
   */
  async initialize(): Promise<void> {
    await this.vault.refreshCache();
  }
}
