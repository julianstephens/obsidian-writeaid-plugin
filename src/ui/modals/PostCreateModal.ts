import { App, Modal, Setting } from 'obsidian';

export class PostCreateModal extends Modal {
  projectPath: string;
  onOpenProject?: () => Promise<any>;

  constructor(app: App, projectPath: string, onOpenProject?: () => Promise<any>) {
    super(app);
    this.projectPath = projectPath;
    this.onOpenProject = onOpenProject;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Project created" });
    contentEl.createEl("p", { text: `Project '${this.projectPath}' was created.` });

    new Setting(contentEl).addButton((btn) =>
      btn.setButtonText("Open Project").setCta().onClick(async () => {
        this.close();
        if (this.onOpenProject) await this.onOpenProject();
      }),
    );

    new Setting(contentEl).addButton((btn) =>
      btn.setButtonText("Close").onClick(() => this.close()),
    );
  }

  onClose() {
    this.contentEl.empty();
  }
}
