import { debug, DEBUG_PREFIX } from "@/core/utils";
import type { App } from "obsidian";
import { Modal, Setting } from "obsidian";

export class ConfirmExistingProjectModal extends Modal {
  path: string;
  onCreateAnyway: (createAnyway: boolean) => void;
  onOpenExisting: () => void;

  constructor(
    app: App,
    path: string,
    onCreateAnyway: (createAnyway: boolean) => void,
    onOpenExisting: () => void,
  ) {
    super(app);
    this.path = path;
    this.onCreateAnyway = onCreateAnyway;
    this.onOpenExisting = onOpenExisting;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Project already exists" });
    contentEl.createEl("p", {
      text: `A folder named '${this.path}' already exists in the vault.`,
    });

    new Setting(contentEl).addButton((btn) =>
      btn.setButtonText("Open Existing").onClick(() => {
        debug(
          `${DEBUG_PREFIX} ConfirmExistingProjectModal: opening existing project "${this.path}"`,
        );
        this.close();
        this.onOpenExisting();
      }),
    );

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Create Anyway")
        .setCta()
        .onClick(() => {
          debug(
            `${DEBUG_PREFIX} ConfirmExistingProjectModal: creating new project anyway "${this.path}"`,
          );
          this.close();
          this.onCreateAnyway(true);
        }),
    );

    new Setting(contentEl).addButton((btn) =>
      btn.setButtonText("Cancel").onClick(() => {
        debug(`${DEBUG_PREFIX} ConfirmExistingProjectModal: cancelled for project "${this.path}"`);
        this.close();
      }),
    );
  }

  onClose() {
    this.contentEl.empty();
  }
}
