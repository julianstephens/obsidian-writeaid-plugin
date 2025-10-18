import { debug, DEBUG_PREFIX } from "@/core/utils";
import type { SelectProjectModalProps } from "@/types";
import type { App } from "obsidian";
import { Modal, Setting } from "obsidian";

export class SelectProjectModal extends Modal {
  props: SelectProjectModalProps;

  constructor(app: App, props: SelectProjectModalProps) {
    super(app);
    this.props = props;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Select Project for Draft" });

    let selected = "";
    const folders = this.props.folders || [];
    new Setting(contentEl).setName("Project folder").addDropdown((drop) => {
      drop.addOption("", "(Vault root)");
      for (const f of folders) drop.addOption(f, f || "(Vault root)");
      drop.onChange((v) => (selected = v));
    });

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Select")
        .setCta()
        .onClick(() => {
          debug(
            `${DEBUG_PREFIX} SelectProjectModal: selected project "${selected || "(Vault root)"}"`,
          );
          this.close();
          this.props.onSubmit(selected || "");
        }),
    );
  }

  onClose() {
    this.contentEl.empty();
  }
}
