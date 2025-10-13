import { App, Modal, Setting } from 'obsidian';

export class SwitchDraftModal extends Modal {
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
