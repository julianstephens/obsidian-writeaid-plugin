import { debug, DEBUG_PREFIX } from "@/core/utils";
import type { App } from "obsidian";
import { Modal, Setting } from "obsidian";

export interface ConfirmReorderOptions {
  projectPath: string;
  currentOrder: string[]; // display names in current order
  proposedOrder: string[]; // display names in proposed order
}

export class ConfirmReorderModal extends Modal {
  opts: ConfirmReorderOptions;
  onConfirm: (createBackups: boolean) => void;
  onCancel?: () => void;
  createBackups: boolean = false;

  constructor(
    app: App,
    opts: ConfirmReorderOptions,
    onConfirm: (createBackups: boolean) => void,
    onCancel?: () => void,
  ) {
    super(app);
    this.opts = opts;
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Confirm Reorder" });
    contentEl.createEl("p", { text: `Project: ${this.opts.projectPath}` });

    contentEl.createEl("h4", { text: "Current order" });
    const cur = contentEl.createEl("ol");
    this.opts.currentOrder.forEach((n) => cur.createEl("li", { text: n }));

    contentEl.createEl("h4", { text: "Proposed order" });
    const prop = contentEl.createEl("ol");
    this.opts.proposedOrder.forEach((n) => prop.createEl("li", { text: n }));

    new Setting(contentEl)
      .addToggle((t) =>
        t
          .setValue(this.createBackups)
          .setTooltip("Create backup copies of chapters before renaming")
          .onChange((v) => {
            this.createBackups = v;
          }),
      )
      .setName("Create backups before renaming");

    new Setting(contentEl).addButton((b) =>
      b
        .setButtonText("Confirm")
        .setCta()
        .onClick(() => {
          debug(
            `${DEBUG_PREFIX} ConfirmReorderModal: confirmed reorder, createBackups: ${this.createBackups}`,
          );
          this.close();
          this.onConfirm(this.createBackups);
        }),
    );

    new Setting(contentEl).addButton((b) =>
      b.setButtonText("Cancel").onClick(() => {
        debug(`${DEBUG_PREFIX} ConfirmReorderModal: cancelled reorder`);
        this.close();
        if (this.onCancel) this.onCancel();
      }),
    );
  }

  onClose() {
    this.contentEl.empty();
  }
}
