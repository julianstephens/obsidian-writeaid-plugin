import type { ConvertIndexModalProps } from "@/ui/modals/modalTypes";
import { Modal, Setting } from "obsidian";

export class ConvertIndexModal extends Modal {
  props: ConvertIndexModalProps;

  constructor(app: import('obsidian').App, props: ConvertIndexModalProps) {
    super(app);
    this.props = props;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Convert Index to Planning Document" });

    let selected = "";
    let asChecklist = true;

    const folders = this.props.folders || [];
    new Setting(contentEl).setName("Project folder").addDropdown((drop) => {
      drop.addOption("", "(Vault root)");
      for (const f of folders) {
        drop.addOption(f, f || "(Vault root)");
      }
      drop.onChange((v) => (selected = v));
    });

    new Setting(contentEl)
      .setName("Create as checklist")
      .addToggle((t) => t.setValue(true).onChange((v) => (asChecklist = v)));

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Convert")
        .setCta()
        .onClick(() => {
          this.close();
          this.props.onSubmit(selected || "", asChecklist);
        }),
    );
  }

  onClose() {
    this.contentEl.empty();
  }
}
