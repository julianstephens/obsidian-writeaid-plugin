import { debug, DEBUG_PREFIX } from "@/core/utils";
import { App, Modal } from "obsidian";

export class RenameDraftModal extends Modal {
  oldName: string;
  onSubmit: (newName: string, renameFile: boolean) => void;
  inputEl: HTMLInputElement | undefined;
  checkboxEl: HTMLInputElement | undefined;
  errorEl: HTMLElement | undefined;
  cancelBtn: HTMLButtonElement | undefined;

  constructor(app: App, oldName: string, onSubmit: (newName: string, renameFile: boolean) => void) {
    super(app);
    this.oldName = oldName;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: `Rename Draft` });
    contentEl.createEl("div", { text: `Current name: '${this.oldName}'`, cls: "wa-rename-info" });
    const label = contentEl.createEl("label", { text: "New draft name", cls: "wa-rename-label" });
    this.inputEl = contentEl.createEl("input", {
      type: "text",
      value: this.oldName,
      placeholder: "Enter new draft name",
      cls: "wa-rename-input",
      attr: { "aria-label": "New draft name" },
    });
    label.appendChild(this.inputEl);
    this.errorEl = contentEl.createEl("div", { cls: "wa-rename-error" });
    this.errorEl.style.color = "var(--color-red, #d43c3c)";
    this.errorEl.style.display = "none";

    const cbLabel = contentEl.createEl("label", { cls: "wa-rename-checkbox-label" });
    this.checkboxEl = cbLabel.createEl("input", { type: "checkbox", attr: { checked: "checked" } });
    cbLabel.appendText(" Also rename the main draft file (filename)");

    const btnRow = contentEl.createEl("div", { cls: "wa-rename-btn-row" });
    const confirmBtn = btnRow.createEl("button", { text: "Rename", cls: "mod-cta" });
    this.cancelBtn = btnRow.createEl("button", { text: "Cancel", cls: "mod-cancel" });

    setTimeout(() => {
      this.inputEl?.focus();
      this.inputEl?.select();
    }, 0);

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
    const renameFile = this.checkboxEl ? this.checkboxEl.checked : false;
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
    debug(
      `${DEBUG_PREFIX} RenameDraftModal: renaming draft from "${this.oldName}" to "${value}", renameFile: ${renameFile}`,
    );
    this.onSubmit(value, renameFile);
    this.close();
  }
}
