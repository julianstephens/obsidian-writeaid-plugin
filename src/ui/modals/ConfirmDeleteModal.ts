import { debug, DEBUG_PREFIX } from "@/core/utils";
import { App, Modal } from "obsidian";

export class ConfirmDeleteModal extends Modal {
  private name: string;
  private onConfirm: () => void;
  private type: "draft" | "chapter";
  constructor(app: App, name: string, onConfirm: () => void, type: "draft" | "chapter" = "draft") {
    super(app);
    this.name = name;
    this.onConfirm = onConfirm;
    this.type = type;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("wa-centered-modal");
    const label = this.type === "chapter" ? "chapter" : "draft";
    contentEl.createEl("h3", { text: `Delete ${label} '${this.name}'?` });
    if (this.type === "draft") {
      contentEl.createEl("p", { text: "This will create a backup copy before deleting." });
    }
    const buttonRow = contentEl.createDiv({ cls: "modal-button-row wa-button-group" });
    const confirmBtn = buttonRow.createEl("button", { text: "Delete", cls: "mod-cta wa-button" });
    const cancelBtn = buttonRow.createEl("button", { text: "Cancel", cls: "wa-button" });
    confirmBtn.onclick = async () => {
      debug(`${DEBUG_PREFIX} ConfirmDeleteModal: confirmed delete for ${this.type} "${this.name}"`);
      this.close();
      await this.onConfirm();
    };
    cancelBtn.onclick = () => {
      debug(`${DEBUG_PREFIX} ConfirmDeleteModal: cancelled delete for ${this.type} "${this.name}"`);
      this.close();
    };
  }
}
