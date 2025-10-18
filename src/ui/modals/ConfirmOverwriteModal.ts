import { debug, DEBUG_PREFIX } from "@/core/utils";
import { App, ButtonComponent, Modal } from "obsidian";

export class ConfirmOverwriteModal extends Modal {
  private resolve!: (value: boolean) => void;

  constructor(
    app: App,
    private path: string,
    private isDraft: boolean = false,
  ) {
    super(app);
    this.setTitle("Confirm Overwrite");
  }

  onOpen() {
    const { contentEl } = this;
    const itemType = this.isDraft ? "draft folder" : "manuscript file";
    contentEl.createEl("p", {
      text: `The ${itemType} "${this.path}" already exists. Do you want to overwrite it?`,
    });

    const buttonContainer = contentEl.createDiv({ cls: "modal-button-container" });

    const cancelButton = new ButtonComponent(buttonContainer);
    cancelButton.setButtonText("Cancel").onClick(() => {
      debug(`${DEBUG_PREFIX} ConfirmOverwriteModal: cancelled overwrite for ${this.isDraft ? "draft" : "manuscript"} "${this.path}"`);
      this.resolve(false);
      this.close();
    });

    const overwriteButton = new ButtonComponent(buttonContainer);
    overwriteButton
      .setButtonText("Overwrite")
      .setCta()
      .onClick(() => {
        debug(`${DEBUG_PREFIX} ConfirmOverwriteModal: confirmed overwrite for ${this.isDraft ? "draft" : "manuscript"} "${this.path}"`);
        this.resolve(true);
        this.close();
      });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  open(): Promise<boolean> {
    return new Promise((resolve) => {
      this.resolve = resolve;
      super.open();
    });
  }
}
