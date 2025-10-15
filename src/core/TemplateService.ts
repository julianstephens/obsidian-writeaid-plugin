import { debug, DEBUG_PREFIX, suppressAsync } from "@/core/utils";
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
    debug(`${DEBUG_PREFIX} TemplateService created`);
  }

  /**
   * Render a template which may be either an inline template string
   * or a vault path to a markdown file. Performs simple {{key}} substitutions
   * and supports moment.js date qualifiers.
   */
  async render(templateOrPath: string, vars: Record<string, string> = {}): Promise<string> {
    let tpl = templateOrPath || "";

    debug(
      `${DEBUG_PREFIX} TemplateService.render called with template: "${tpl.substring(0, 100)}${tpl.length > 100 ? "..." : ""}", vars:`,
      Object.keys(vars),
    );

    // Only try to read from file if the template doesn't contain template syntax
    if (!tpl.includes("{{") && !tpl.includes("}}")) {
      debug(
        `${DEBUG_PREFIX} Template doesn't contain template syntax, checking if it's a file path`,
      );
      await suppressAsync(async () => {
        const f = this.app.vault.getAbstractFileByPath(tpl);
        if (f && f instanceof TFile) {
          debug(`${DEBUG_PREFIX} Reading template from file: ${tpl}`);
          tpl = await this.app.vault.read(f);
          debug(`${DEBUG_PREFIX} Template loaded from file, length: ${tpl.length} chars`);
        } else {
          debug(
            `${DEBUG_PREFIX} Template path "${tpl}" is not a valid file, treating as inline template`,
          );
        }
      });
    } else {
      debug(`${DEBUG_PREFIX} Template contains template syntax, treating as inline template`);
    }

    // Perform template variable substitution
    debug(`${DEBUG_PREFIX} Performing template variable substitution`);
    tpl = tpl.replace(/{{\s*(\w+(?:[-:]\w+)*)\s*}}/g, (_m, k) => {
      // First check if it's a provided variable
      if (vars[k] !== undefined) {
        debug(`${DEBUG_PREFIX} Substituting variable {{${k}}} with provided value: "${vars[k]}"`);
        return vars[k];
      }
      // Otherwise, try to format it as a moment.js date format
      try {
        const formatted = window.moment().format(k);
        debug(`${DEBUG_PREFIX} Substituting {{${k}}} with moment.js format: "${formatted}"`);
        return formatted;
      } catch {
        // If moment.js formatting fails, return the key as-is
        debug(
          `${DEBUG_PREFIX} Neither variable nor moment.js format found for {{${k}}}, returning as-is`,
        );
        return k;
      }
    });

    debug(`${DEBUG_PREFIX} Template rendering complete, result length: ${tpl.length} chars`);
    return tpl;
  }
}
