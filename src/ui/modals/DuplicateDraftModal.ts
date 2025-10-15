import { Modal, Setting } from "obsidian";

export interface DuplicateDraftModalProps {
  sourceDraftName: string;
  suggestedName: string;
  onSubmit: (draftName: string) => void;
}

export class DuplicateDraftModal extends Modal {
  props: DuplicateDraftModalProps;

  constructor(app: import("obsidian").App, props: DuplicateDraftModalProps) {
    super(app);
    this.props = props;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: `Duplicate Draft: ${this.props.sourceDraftName}` });

    let draftName = "";

    new Setting(contentEl).setName("New draft name").addText((text) =>
      text
        .setPlaceholder(this.props.suggestedName)
        .setValue(this.props.suggestedName)
        .onChange((value) => (draftName = value)),
    );

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Duplicate")
        .setCta()
        .onClick(() => {
          this.close();
          const finalName =
            draftName && draftName.trim() ? draftName.trim() : this.props.suggestedName;
          this.props.onSubmit(finalName);
        }),
    );
  }

  onClose() {
    this.contentEl.empty();
  }
}
