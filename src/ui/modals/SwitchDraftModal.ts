import { debug, DEBUG_PREFIX } from "@/core/utils";
import type { App } from "obsidian";
import { Modal, Setting } from "obsidian";

/**
 * Modal for switching the active draft within the current project.
 * Displays a dropdown list of available drafts for selection.
 */
export class SwitchDraftModal extends Modal {
  onSubmit: (draftName: string) => void;
  drafts: string[];

  constructor(app: App, drafts: string[], onSubmit: (draftName: string) => void) {
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
          debug(`${DEBUG_PREFIX} SwitchDraftModal: selected draft "${draft}"`);
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
