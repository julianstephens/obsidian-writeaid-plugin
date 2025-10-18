import { debug, DEBUG_PREFIX } from "@/core/utils";
import type { CreateDraftModalProps } from "@/types";
import { Modal, Setting } from "obsidian";

export class CreateDraftModal extends Modal {
  props: CreateDraftModalProps;

  constructor(app: import("obsidian").App, props: CreateDraftModalProps) {
    super(app);
    this.props = props;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Create New Draft" });

    const suggestedName = this.props.suggestedName;
    let draftName = "";
    let copyFrom = "";

    new Setting(contentEl)
      .setName("Draft name")
      .addText((text) =>
        text.setPlaceholder(suggestedName).onChange((value) => (draftName = value)),
      );

    const drafts = this.props.drafts;
    if (drafts.length > 0) {
      new Setting(contentEl).setName("Copy from existing draft").addDropdown((drop) => {
        drop.addOption("", "Start blank");
        for (const d of drafts) drop.addOption(d, d);
        drop.onChange((value) => (copyFrom = value));
      });
    }

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Create")
        .setCta()
        .onClick(() => {
          const finalName = draftName && draftName.trim() ? draftName.trim() : suggestedName;
          debug(`${DEBUG_PREFIX} CreateDraftModal: creating draft "${finalName}", copyFrom: "${copyFrom || "none"}"`);
          this.close();
          this.props.onSubmit(finalName, copyFrom || undefined);
        }),
    );
  }

  onClose() {
    this.contentEl.empty();
  }
}
