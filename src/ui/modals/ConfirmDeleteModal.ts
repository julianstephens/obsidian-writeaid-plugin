import { App, Modal } from "obsidian";

export class ConfirmDeleteModal extends Modal {
  private draftName: string;
  private onConfirm: () => void;
  constructor(app: App, draftName: string, onConfirm: () => void) {
    super(app);
    this.draftName = draftName;
    this.onConfirm = onConfirm;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("wa-centered-modal");
    contentEl.createEl("h3", { text: `Delete draft '${this.draftName}'?` });
    contentEl.createEl("p", { text: "This will create a backup copy before deleting." });
    const buttonRow = contentEl.createDiv({ cls: "modal-button-row wa-button-group" });
    const confirmBtn = buttonRow.createEl("button", { text: "Delete", cls: "mod-cta wa-button" });
    const cancelBtn = buttonRow.createEl("button", { text: "Cancel", cls: "wa-button" });
    confirmBtn.onclick = async () => {
      this.close();
      await this.onConfirm();
    };
    cancelBtn.onclick = () => {
      this.close();
    };
  }
}
