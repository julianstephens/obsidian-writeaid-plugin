import { App, TFile } from "obsidian";

declare global {
  interface Window {
    moment: {
      (): {
        format: (format: string) => string;
      };
    };
  }
}

export class TemplateService {
  app: App;

  constructor(app: App) {
    this.app = app;
  }

  /**
   * Render a template which may be either an inline template string
   * or a vault path to a markdown file. Performs simple {{key}} substitutions
   * and supports moment.js date qualifiers.
   */
  async render(templateOrPath: string, vars: Record<string, string> = {}): Promise<string> {
    let tpl = templateOrPath || "";
    try {
      const f = this.app.vault.getAbstractFileByPath(tpl);
      if (f && f instanceof TFile) {
        tpl = await this.app.vault.read(f);
      }
    } catch (_e) {
      // ignore
    }

    // First handle moment.js date qualifiers
    tpl = tpl.replace(/{{\s*(\w+)\s*}}/g, (_m, k) => {
      // Check if it's a moment.js date format
      if (this.isMomentFormat(k)) {
        // Use global moment from Obsidian
        return window.moment().format(k);
      }
      // Otherwise use provided variables
      return vars[k] ?? "";
    });

    return tpl;
  }

  /**
   * Check if a string is a valid moment.js date format
   */
  private isMomentFormat(str: string): boolean {
    // Common moment.js format tokens
    const momentTokens = [
      'YYYY', 'YY', 'Y', 'Q', 'MMMM', 'MMM', 'MM', 'M', 'DD', 'D', 'Do', 'dddd', 'ddd', 'dd', 'd',
      'HH', 'H', 'hh', 'h', 'mm', 'm', 'ss', 's', 'A', 'a', 'X', 'x', 'Z', 'zz', 'ZZ'
    ];

    // Check if the string contains any moment.js format token
    return momentTokens.some(token => str.includes(token));
  }
}
