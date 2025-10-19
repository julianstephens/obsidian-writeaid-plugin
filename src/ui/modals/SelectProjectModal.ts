import { debug, DEBUG_PREFIX } from "@/core/utils";
import type { SelectProjectModalProps } from "@/types";
import type { App } from "obsidian";
import { SuggestModal } from "obsidian";

/**
 * Modal for selecting a project from available projects in the vault.
 * Uses SuggestModal for autocomplete and filtering capabilities.
 */
export class SelectProjectModal extends SuggestModal<string> {
  folders: string[];
  onSubmitCallback: (projectPath: string) => void;

  constructor(app: App, props: SelectProjectModalProps) {
    super(app);
    this.folders = props.folders || [];
    this.onSubmitCallback = props.onSubmit;
    this.setPlaceholder("Search for a project...");
  }

  getSuggestions(inputStr: string): string[] {
    const lowerInput = inputStr.toLowerCase();
    return this.folders.filter((folder) => folder.toLowerCase().includes(lowerInput));
  }

  renderSuggestion(folder: string, el: HTMLElement): void {
    el.createEl("div", { text: folder || "(Vault root)" });
  }

  onChooseSuggestion(folder: string, evt: MouseEvent | KeyboardEvent): void {
    debug(`${DEBUG_PREFIX} SelectProjectModal: selected project "${folder}"`);
    this.onSubmitCallback(folder);
  }
}
