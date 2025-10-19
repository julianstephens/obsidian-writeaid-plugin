import { debug, DEBUG_PREFIX } from "@/core/utils";
import type { App } from "obsidian";
import { Modal, Setting, TextAreaComponent } from "obsidian";

/**
 * Modal for creating a new writing project.
 * Collects project name, type (single-file or multi-file), initial draft name, description, and parent folder.
 */
export class CreateProjectModal extends Modal {
  onSubmit: (
    projectName: string,
    singleFile: boolean,
    initialDraftName?: string,
    description?: string,
    parentFolder?: string,
  ) => void;

  constructor(
    app: App,
    onSubmit: (
      projectName: string,
      singleFile: boolean,
      initialDraftName?: string,
      description?: string,
      parentFolder?: string,
    ) => void,
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
    let descriptionTextArea: TextAreaComponent;

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

    new Setting(contentEl)
      .setName("Description (optional)")
      .setDesc("Add a brief description for your project")
      .addTextArea((text) => {
        descriptionTextArea = text;
        text
          .setPlaceholder("e.g., An epic fantasy novel exploring themes of courage and redemption")
          .inputEl.style.setProperty("min-height", "80px");
      });

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Create Project")
        .setCta()
        .onClick(() => {
          const description = descriptionTextArea.getValue();
          debug(
            `${DEBUG_PREFIX} CreateProjectModal: creating project "${projectName}", singleFile: ${singleFile}, initialDraftName: ${initialDraftName}, description: ${description}`,
          );
          this.close();
          this.onSubmit(
            projectName,
            singleFile,
            initialDraftName || undefined,
            description || undefined,
            undefined, // parentFolder - optional, not supported by basic modal
          );
        }),
    );
  }

  onClose() {
    this.contentEl.empty();
  }
}
