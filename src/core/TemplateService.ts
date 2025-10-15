import { App, TFile } from "obsidian";

export class TemplateService {
  app: App;

  constructor(app: App) {
    this.app = app;
  }

  /**
   * Render a template which may be either an inline template string
   * or a vault path to a markdown file. Performs simple {{key}} substitutions.
   */
  async render(templateOrPath: string, vars: Record<string, string> = {}): Promise<string> {
    let tpl = templateOrPath || "";
    try {
      const f = this.app.vault.getAbstractFileByPath(tpl);
      if (f && f instanceof TFile) {
        tpl = await this.app.vault.read(f);
      }
    } catch (_e) {
      // ignore }
      // ignore and treat as inline template
    }

    return tpl.replace(/{{\s*(\w+)\s*}}/g, (_m, k) => {
      return vars[k] ?? "";
    });
  }
}
