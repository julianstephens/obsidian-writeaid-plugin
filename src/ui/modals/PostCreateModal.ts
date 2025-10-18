import { debug, DEBUG_PREFIX } from "@/core/utils";
import type { App } from "obsidian";
import { Modal, Setting } from "obsidian";

export class PostCreateModal extends Modal {
  projectPath: string;
  onOpenProject?: () => Promise<unknown>;

  constructor(app: App, projectPath: string, onOpenProject?: () => Promise<unknown>) {
    super(app);
    this.projectPath = projectPath;
    this.onOpenProject = onOpenProject;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Project created" });
    contentEl.createEl("p", {
      text: `Project '${this.projectPath}' was created.`,
    });

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Open Project")
        .setCta()
        .onClick(async () => {
          debug(`${DEBUG_PREFIX} PostCreateModal: opening project "${this.projectPath}"`);
          this.close();
          if (this.onOpenProject) await this.onOpenProject();
        }),
    );

    new Setting(contentEl).addButton((btn) =>
      btn.setButtonText("Close").onClick(() => {
        debug(`${DEBUG_PREFIX} PostCreateModal: closed for project "${this.projectPath}"`);
        this.close();
      }),
    );
  }

  onClose() {
    this.contentEl.empty();
  }
}
