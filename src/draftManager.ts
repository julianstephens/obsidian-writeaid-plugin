import { App, TFolder, TFile, Notice, Modal, Setting } from "obsidian";

export class DraftManager {
  app: App;
  activeDraft: string | null = null;

  constructor(app: App) {
    this.app = app;
  }

  async createNewDraftPrompt() {
    new CreateDraftModal(
      this.app,
      async (draftName: string, copyFrom?: string) => {
        await this.createNewDraft(draftName, copyFrom);
        new Notice(`Draft "${draftName}" created.`);
      },
      this,
    ).open();
  }

  async switchDraftPrompt() {
    const drafts = this.listDrafts();
    if (drafts.length === 0) {
      new Notice("No drafts found in the current project.");
      return;
    }
    new SwitchDraftModal(this.app, drafts, (draftName: string) => {
      this.activeDraft = draftName;
      new Notice(`Switched to draft: ${draftName}`);
    }).open();
  }

  async createNewDraft(draftName: string, copyFromDraft?: string) {
    const projectPath = this.getCurrentProjectPath();
    if (!projectPath) {
      new Notice(
        "No project folder detected. Please open a folder named after your project.",
      );
      return;
    }
    const draftsFolder = `${projectPath}/Drafts`;
    const newDraftFolder = `${draftsFolder}/${draftName}`;

    // Create drafts and draft folders if needed
    if (!this.app.vault.getAbstractFileByPath(draftsFolder)) {
      await this.app.vault.createFolder(draftsFolder);
    }
    if (!this.app.vault.getAbstractFileByPath(newDraftFolder)) {
      await this.app.vault.createFolder(newDraftFolder);
    }

    // Optionally copy from an existing draft
    if (copyFromDraft) {
      const sourceFolder = `${draftsFolder}/${copyFromDraft}`;
      const files = this.app.vault
        .getFiles()
        .filter((file) => file.path.startsWith(sourceFolder));
      for (const file of files) {
        const relPath = file.path.substring(sourceFolder.length + 1);
        const destPath = `${newDraftFolder}/${relPath}`;
        const content = await this.app.vault.read(file);
        await this.app.vault.create(destPath, content);
      }
    } else {
      await this.app.vault.create(
        `${newDraftFolder}/outline.md`,
        `# Outline for ${draftName}`,
      );
    }
  }

  listDrafts(): string[] {
    const projectPath = this.getCurrentProjectPath();
    if (!projectPath) return [];
    const draftsFolder = `${projectPath}/Drafts`;
    const folder = this.app.vault.getAbstractFileByPath(draftsFolder);
    if (folder && folder instanceof TFolder) {
      return folder.children
        .filter((child) => child instanceof TFolder)
        .map((child) => child.name);
    }
    return [];
  }

  getCurrentProjectPath(): string | null {
    // Naive: Use the current active file's parent folder as the project folder
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return null;
    const folder = activeFile.parent;
    return folder ? folder.path : null;
  }
}

class CreateDraftModal extends Modal {
  onSubmit: (draftName: string, copyFrom?: string) => void;
  draftManager: DraftManager;

  constructor(
    app: App,
    onSubmit: (draftName: string, copyFrom?: string) => void,
    draftManager: DraftManager,
  ) {
    super(app);
    this.onSubmit = onSubmit;
    this.draftManager = draftManager;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Create New Draft" });

    let draftName = "";
    let copyFrom = "";

    new Setting(contentEl)
      .setName("Draft name")
      .addText((text) => text.onChange((value) => (draftName = value)));

    const drafts = this.draftManager.listDrafts();
    if (drafts.length > 0) {
      new Setting(contentEl)
        .setName("Copy from existing draft")
        .addDropdown((drop) => {
          drop.addOption("", "Start blank");
          for (const d of drafts) drop.addOption(d, d);
          drop.onChange((value) => (copyFrom = value));
        });
    }

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Create")
        .setCta()
        .onClick(() => {
          this.close();
          this.onSubmit(draftName, copyFrom || undefined);
        }),
    );
  }

  onClose() {
    this.contentEl.empty();
  }
}

class SwitchDraftModal extends Modal {
  onSubmit: (draftName: string) => void;
  drafts: string[];

  constructor(
    app: App,
    drafts: string[],
    onSubmit: (draftName: string) => void,
  ) {
    super(app);
    this.drafts = drafts;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Switch Active Draft" });

    for (const draft of this.drafts) {
      new Setting(contentEl).setName(draft).addButton((btn) =>
        btn.setButtonText("Select").onClick(() => {
          this.close();
          this.onSubmit(draft);
        }),
      );
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}
