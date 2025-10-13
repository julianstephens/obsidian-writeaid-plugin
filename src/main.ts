import {
  App,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  TFolder,
  Notice,
} from "obsidian";
import { DraftManager } from "./draftManager";

export default class WriteAidPlugin extends Plugin {
  draftManager: DraftManager;

  async onload() {
    console.log("Loading WriteAid Novel Multi-Draft Plugin");
    this.draftManager = new DraftManager(this.app);

    this.addCommand({
      id: "create-new-draft",
      name: "Create New Draft",
      callback: () => this.draftManager.createNewDraftPrompt(),
    });

    this.addCommand({
      id: "switch-draft",
      name: "Switch Active Draft",
      callback: () => this.draftManager.switchDraftPrompt(),
    });

    this.addSettingTab(new WriteAidSettingTab(this.app, this));
  }

  onunload() {
    console.log("Unloading WriteAid Novel Multi-Draft Plugin");
  }
}

class WriteAidSettingTab extends PluginSettingTab {
  plugin: WriteAidPlugin;

  constructor(app: App, plugin: WriteAidPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "WriteAid Settings" });

    // Add settings here as needed
  }
}
