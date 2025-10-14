import type { App } from "obsidian";
import { Modal, Setting } from "obsidian";

export class CreateProjectModal extends Modal {
  onSubmit: (projectName: string, singleFile: boolean, initialDraftName?: string) => void;

  constructor(
    app: App,
    onSubmit: (projectName: string, singleFile: boolean, initialDraftName?: string) => void,
  ) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Create New Project" });

    let projectName = "";
    let singleFile = true;
    let initialDraftName = "Draft 1";

    new Setting(contentEl)
      .setName("Project folder name")
      .addText((text) => text.onChange((v) => (projectName = v)));

    new Setting(contentEl).setName("Project type").addDropdown((drop) => {
      drop.addOption("single", "Single-file project");
      drop.addOption("multi", "Multi-file project (chapters)");
      drop.onChange((v) => (singleFile = v === "single"));
    });

    new Setting(contentEl)
      .setName("Initial draft name (optional)")
      .addText((text) =>
        text.setPlaceholder("Draft 1").onChange((v) => (initialDraftName = v || "Draft 1")),
      );

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Create Project")
        .setCta()
        .onClick(() => {
          this.close();
          this.onSubmit(projectName, singleFile, initialDraftName || undefined);
        }),
    );
  }

  onClose() {
    this.contentEl.empty();
  }
}
