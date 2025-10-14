import { App, Modal } from "obsidian";

export class RenameDraftModal extends Modal {
  oldName: string;
  onSubmit: (newName: string, renameFile: boolean) => void;
  inputEl: HTMLInputElement | undefined;
  checkboxEl: HTMLInputElement | undefined;
  isSingleFile: boolean;
  errorEl: HTMLElement | undefined;
  cancelBtn: HTMLButtonElement | undefined;

  constructor(
    app: App,
    oldName: string,
    onSubmit: (newName: string, renameFile: boolean) => void,
    isSingleFile = false,
  ) {
    super(app);
    this.oldName = oldName;
    this.onSubmit = onSubmit;
    this.isSingleFile = isSingleFile;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: `Rename Draft` });
    contentEl.createEl("div", { text: `Current name: '${this.oldName}'`, cls: "wa-rename-info" });
    // Label and input
    const label = contentEl.createEl("label", { text: "New draft name", cls: "wa-rename-label" });
    this.inputEl = contentEl.createEl("input", {
      type: "text",
      value: this.oldName,
      placeholder: "Enter new draft name",
      cls: "wa-rename-input",
      attr: { "aria-label": "New draft name" },
    });
    label.appendChild(this.inputEl);
    // Error message
    this.errorEl = contentEl.createEl("div", { cls: "wa-rename-error" });
    this.errorEl.style.color = "var(--color-red, #d43c3c)";
    this.errorEl.style.display = "none";

    // Checkbox for single-file
    if (this.isSingleFile) {
      const cbLabel = contentEl.createEl("label", { cls: "wa-rename-checkbox-label" });
      this.checkboxEl = cbLabel.createEl("input", { type: "checkbox" });
      cbLabel.appendText(" Also rename the main draft file (filename)");
    }

    // Button row
    const btnRow = contentEl.createEl("div", { cls: "wa-rename-btn-row" });
    const confirmBtn = btnRow.createEl("button", { text: "Rename", cls: "mod-cta" });
    this.cancelBtn = btnRow.createEl("button", { text: "Cancel", cls: "mod-cancel" });

    // Focus/select input
    setTimeout(() => {
      this.inputEl?.focus();
      this.inputEl?.select();
    }, 0);

    // Keyboard accessibility
    this.inputEl?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.submit();
      } else if (e.key === "Escape") {
        this.close();
      }
    });
    confirmBtn.addEventListener("click", () => this.submit());
    this.cancelBtn.addEventListener("click", () => this.close());
  }

  submit() {
    const value = this.inputEl?.value.trim();
    const renameFile = this.isSingleFile && this.checkboxEl ? this.checkboxEl.checked : false;
    if (!value) {
      if (this.errorEl) {
        this.errorEl.textContent = "Draft name cannot be empty.";
        this.errorEl.style.display = "";
      }
      this.inputEl?.focus();
      return;
    }
    if (value === this.oldName) {
      if (this.errorEl) {
        this.errorEl.textContent = "Please enter a different name.";
        this.errorEl.style.display = "";
      }
      this.inputEl?.focus();
      return;
    }
    if (this.errorEl) this.errorEl.style.display = "none";
    this.onSubmit(value, renameFile);
    this.close();
  }
}
