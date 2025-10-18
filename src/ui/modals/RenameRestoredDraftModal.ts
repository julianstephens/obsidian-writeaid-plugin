import { debug, DEBUG_PREFIX } from "@/core/utils";
import { App, Modal } from "obsidian";

export class RenameRestoredDraftModal extends Modal {
  oldName: string;
  onSubmit: (newName: string) => void;
  inputEl: HTMLInputElement | undefined;
  errorEl: HTMLElement | undefined;
  cancelBtn: HTMLButtonElement | undefined;

  constructor(app: App, oldName: string, onSubmit: (newName: string) => void) {
    super(app);
    this.oldName = oldName;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: `Rename Restored Draft` });
    contentEl.createEl("div", {
      text: `The original draft '${this.oldName}' no longer exists. Please provide a new name for the restored draft.`,
      cls: "wa-rename-info",
    });
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

    const btnRow = contentEl.createEl("div", { cls: "wa-rename-btn-row" });
    const confirmBtn = btnRow.createEl("button", { text: "Restore", cls: "mod-cta" });
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
    if (!value) {
      if (this.errorEl) {
        this.errorEl.textContent = "Draft name cannot be empty.";
        this.errorEl.style.display = "";
      }
      this.inputEl?.focus();
      return;
    }
    if (this.errorEl) this.errorEl.style.display = "none";
    debug(`${DEBUG_PREFIX} RenameRestoredDraftModal: restoring draft as "${value}"`);
    this.onSubmit(value);
    this.close();
  }

  onClose() {
    this.contentEl.empty();
  }
}
