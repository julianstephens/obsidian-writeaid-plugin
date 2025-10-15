import { App, ButtonComponent, Modal } from "obsidian";

export class ConfirmOverwriteModal extends Modal {
  private resolve!: (value: boolean) => void;

  constructor(
    app: App,
    private manuscriptPath: string,
  ) {
    super(app);
    this.setTitle("Confirm Overwrite");
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("p", {
      text: `The manuscript file "${this.manuscriptPath}" already exists. Do you want to overwrite it?`,
    });

    const buttonContainer = contentEl.createDiv({ cls: "modal-button-container" });

    const cancelButton = new ButtonComponent(buttonContainer);
    cancelButton.setButtonText("Cancel").onClick(() => {
      this.resolve(false);
      this.close();
    });

    const overwriteButton = new ButtonComponent(buttonContainer);
    overwriteButton
      .setButtonText("Overwrite")
      .setCta()
      .onClick(() => {
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
