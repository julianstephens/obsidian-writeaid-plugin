import { debug, DEBUG_PREFIX } from "@/core/utils";
import type { App } from "obsidian";
import { SuggestModal } from "obsidian";

/**
 * Modal for switching the active draft within the current project.
 * Uses SuggestModal for autocomplete and filtering capabilities.
 */
export class SwitchDraftModal extends SuggestModal<string> {
  drafts: string[];
  onSubmitCallback: (draftName: string) => void;

  constructor(app: App, drafts: string[], onSubmit: (draftName: string) => void) {
    super(app);
    this.drafts = drafts;
    this.onSubmitCallback = onSubmit;
    this.setPlaceholder("Search for a draft...");
  }

  getSuggestions(inputStr: string): string[] {
    const lowerInput = inputStr.toLowerCase();
    return this.drafts.filter((draft) => draft.toLowerCase().includes(lowerInput));
  }

  renderSuggestion(draft: string, el: HTMLElement): void {
    el.createEl("div", { text: draft });
  }

  onChooseSuggestion(draft: string, evt: MouseEvent | KeyboardEvent): void {
    debug(`${DEBUG_PREFIX} SwitchDraftModal: selected draft "${draft}"`);
    this.onSubmitCallback(draft);
  }
}
