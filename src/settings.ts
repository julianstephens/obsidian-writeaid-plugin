import {
  APP_NAME,
  debug,
  DEBUG_PREFIX,
  FILES,
  MARKDOWN_FILE_EXTENSION,
  PANEL_DEBOUNCE_DEFAULT,
  PANEL_DEBOUNCE_MAX,
  PANEL_DEBOUNCE_MIN,
  PROJECT_TYPE,
  slugifyDraftName,
  suppress,
} from "@/core/utils";
import type { WriteAidSettings } from "@/types";
import { App, Modal, Notice, PluginSettingTab, Setting, TFile, TFolder } from "obsidian";

// Keep the settings module decoupled from the full plugin implementation by
// describing only the small interface we need here. This avoids circular
// imports and makes the settings UI easier to test.
interface MinimalPlugin {
  settings: WriteAidSettings;
  saveSettings: () => Promise<void> | void;
  manager?: { panelRefreshDebounceMs?: number };
  moveRibbon?: (to: "left" | "right") => void;
  refreshRibbonVisibility?: () => void;
  registerSettingsChangedCallback?: (callback: () => void) => void;
}

export class WriteAidSettingTab extends PluginSettingTab {
  plugin: MinimalPlugin;

  constructor(app: App, plugin: MinimalPlugin) {
    //@ts-expect-error 2345
    super(app, plugin as unknown as Plugin);
    this.plugin = plugin;

    debug(`${DEBUG_PREFIX} Settings tab created`);

    // Register a callback to refresh the settings UI when settings change externally
    if (typeof plugin.registerSettingsChangedCallback === "function") {
      plugin.registerSettingsChangedCallback(() => {
        debug(`${DEBUG_PREFIX} Settings changed externally, refreshing UI`);
        // Only refresh if this tab is currently displayed
        if (this.containerEl && this.containerEl.parentElement) {
          this.display();
        }
      });
    }
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: `${APP_NAME} Settings` });

    debug(`${DEBUG_PREFIX} Displaying settings UI`);

    const plugin = this.plugin;

    containerEl.createEl("h3", { text: "Templates" });

    new Setting(containerEl)
      .setName("Include outline file on draft creation")
      .setDesc(
        "If enabled, each new draft will include an outline file using the outline template.",
      )
      .addToggle((toggle) =>
        toggle.setValue(!!plugin.settings.includeDraftOutline).onChange((v) => {
          debug(`${DEBUG_PREFIX} Include draft outline changed: ${v}`);
          plugin.settings.includeDraftOutline = v;
          plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Outline template")
      .setDesc("Template for outline files. Use {{draftName}}")
      .addTextArea((ta) => {
        ta.setValue(plugin.settings.outlineTemplate || "");
        ta.inputEl.setAttribute("data-setting", "outline");
      })
      .addButton((btn) =>
        btn.setButtonText("Pick file...").onClick(() => {
          debug(`${DEBUG_PREFIX} Opening file picker for outline template`);
          new FilePickerModal(this.app, (path) => {
            debug(`${DEBUG_PREFIX} Outline template selected: ${path}`);
            plugin.settings.outlineTemplate = path;
            this.display();
          }).open();
        }),
      );

    new Setting(containerEl)
      .setName("Outline template")
      .setDesc("Template for outline documents. Use {{draftName}}")
      .addTextArea((ta) => {
        ta.setValue(plugin.settings.outlineTemplate || "");
        ta.inputEl.setAttribute("data-setting", "outline");
      })
      .addButton((btn) =>
        btn.setButtonText("Pick file...").onClick(() => {
          debug(`${DEBUG_PREFIX} Opening file picker for outline template`);
          new FilePickerModal(this.app, (path) => {
            debug(`${DEBUG_PREFIX} Outline template selected: ${path}`);
            plugin.settings.outlineTemplate = path;
            this.display();
          }).open();
        }),
      );

    new Setting(containerEl)
      .setName("Chapter template")
      .setDesc("Template for newly created chapter files. Use {{chapterTitle}}")
      .addTextArea((ta) => {
        ta.setValue(plugin.settings.chapterTemplate || "");
        ta.inputEl.setAttribute("data-setting", "chapter");
      })
      .addButton((btn) =>
        btn.setButtonText("Pick file...").onClick(() => {
          debug(`${DEBUG_PREFIX} Opening file picker for chapter template`);
          new FilePickerModal(this.app, (path) => {
            debug(`${DEBUG_PREFIX} Chapter template selected: ${path}`);
            plugin.settings.chapterTemplate = path;
            this.display();
          }).open();
        }),
      );

    new Setting(containerEl)
      .setName("Manuscript name template")
      .setDesc(
        "Template for manuscript filenames. Use {{draftName}}, {{projectName}}, and moment.js date qualifiers like {{YYYY-MM-DD}}",
      )
      .addText((t) => {
        t.setValue(plugin.settings.manuscriptNameTemplate || "{{draftName}}");
        t.inputEl.setAttribute("data-setting", "manuscript");
      });

    // Save Templates button
    new Setting(containerEl).addButton((btn) =>
      btn
        .setButtonText("Save Templates")
        .setCta()
        .onClick(async () => {
          debug(`${DEBUG_PREFIX} Save Templates button clicked`);
          // Get current values from the form inputs
          const outlineInput = containerEl.querySelector(
            'textarea[data-setting="outline"]',
          ) as HTMLTextAreaElement;
          const chapterInput = containerEl.querySelector(
            'textarea[data-setting="chapter"]',
          ) as HTMLTextAreaElement;
          const manuscriptInput = containerEl.querySelector(
            'input[data-setting="manuscript"]',
          ) as HTMLInputElement;

          debug(
            `${DEBUG_PREFIX} Found inputs - outline: ${!!outlineInput}, chapter: ${!!chapterInput}, manuscript: ${!!manuscriptInput}`,
          );
          debug(`${DEBUG_PREFIX} Manuscript input value: "${manuscriptInput?.value}"`);

          if (outlineInput) plugin.settings.outlineTemplate = outlineInput.value;
          if (chapterInput) plugin.settings.chapterTemplate = chapterInput.value;
          if (manuscriptInput) plugin.settings.manuscriptNameTemplate = manuscriptInput.value;

          debug(
            `${DEBUG_PREFIX} Saving templates: outline=${plugin.settings.outlineTemplate?.substring(0, 50)}..., chapter=${plugin.settings.chapterTemplate?.substring(0, 50)}..., manuscript=${plugin.settings.manuscriptNameTemplate}`,
          );

          await plugin.saveSettings();
          new Notice("Templates saved successfully!");
        }),
    );

    containerEl.createEl("h3", { text: "Filenames" });

    new Setting(containerEl)
      .setName("Draft filename slug style")
      .setDesc("How per-draft main filenames are generated")
      .addDropdown((d) => {
        d.addOption("compact", "compact (draft1)");
        d.addOption("kebab", "kebab (draft-1)");
        d.setValue(plugin.settings.slugStyle || "compact");
        d.onChange((v) => {
          debug(`${DEBUG_PREFIX} Slug style changed: ${v}`);
          plugin.settings.slugStyle = v as WriteAidSettings["slugStyle"];
          plugin.saveSettings();
          const prev = containerEl.querySelector(".wat-slug-preview");
          if (prev)
            prev.textContent = `Example: Draft 1 → ${slugifyDraftName("Draft 1", v as WriteAidSettings["slugStyle"])}${MARKDOWN_FILE_EXTENSION}`;
        });
      });

    let sampleName = "Draft 1";
    new Setting(containerEl)
      .setName("Sample draft name")
      .setDesc("Type a sample draft name to preview the generated filename")
      .addText((t) =>
        t
          .setPlaceholder("Draft 1")
          .setValue(sampleName)
          .onChange((v) => {
            sampleName = v || "Draft 1";
            const prev = containerEl.querySelector(".wat-slug-preview");
            if (prev) {
              const s = slugifyDraftName(
                sampleName,
                plugin.settings.slugStyle as WriteAidSettings["slugStyle"],
              );
              prev.textContent = `Example: ${sampleName} → ${s}${MARKDOWN_FILE_EXTENSION}`;
            }
          }),
      );

    const previewEl = containerEl.createDiv({ cls: "wat-slug-preview" });
    const initialSlug = slugifyDraftName(
      sampleName,
      plugin.settings.slugStyle as WriteAidSettings["slugStyle"],
    );
    previewEl.setText(`Example: ${sampleName} → ${initialSlug}${MARKDOWN_FILE_EXTENSION}`);

    containerEl.createEl("h3", { text: "Folders & Files" });

    new Setting(containerEl)
      .setName("Drafts folder name")
      .setDesc("Name of the folder containing draft subfolders (default: drafts)")
      .addText((t) =>
        t.setValue(plugin.settings.draftsFolderName || "drafts").onChange((v) => {
          debug(`${DEBUG_PREFIX} Drafts folder name changed: ${v}`);
          plugin.settings.draftsFolderName = v || "drafts";
          plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Manuscripts folder name")
      .setDesc("Name of the folder containing generated manuscripts (default: manuscripts)")
      .addText((t) =>
        t.setValue(plugin.settings.manuscriptsFolderName || "manuscripts").onChange((v) => {
          debug(`${DEBUG_PREFIX} Manuscripts folder name changed: ${v}`);
          plugin.settings.manuscriptsFolderName = v || "manuscripts";
          plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Backups folder name")
      .setDesc("Name of the folder containing draft backups (default: .writeaid-backups)")
      .addText((t) =>
        t.setValue(plugin.settings.backupsFolderName || ".writeaid-backups").onChange((v) => {
          debug(`${DEBUG_PREFIX} Backups folder name changed: ${v}`);
          plugin.settings.backupsFolderName = v || ".writeaid-backups";
          plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Meta file name")
      .setDesc(`Name of the project metadata file (default: ${FILES.META})`)
      .addText((t) =>
        t.setValue(plugin.settings.metaFileName || FILES.META).onChange((v) => {
          debug(`${DEBUG_PREFIX} Meta file name changed: ${v}`);
          plugin.settings.metaFileName = v || FILES.META;
          plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Outline file name")
      .setDesc(`Name of the draft outline file (default: ${FILES.OUTLINE})`)
      .addText((t) =>
        t.setValue(plugin.settings.outlineFileName || FILES.OUTLINE).onChange((v) => {
          debug(`${DEBUG_PREFIX} Outline file name changed: ${v}`);
          plugin.settings.outlineFileName = v || FILES.OUTLINE;
          plugin.saveSettings();
        }),
      );

    containerEl.createEl("h3", { text: "Word Count Targets" });

    new Setting(containerEl)
      .setName("Default target word count for multi-file projects")
      .setDesc("Target word count automatically set for new multi-file projects (chapters)")
      .addText((t) =>
        t
          .setValue(String(plugin.settings.defaultMultiTargetWordCount ?? 50000))
          .setPlaceholder("50000")
          .onChange((v) => {
            const num = parseInt(v, 10);
            if (!isNaN(num) && num > 0) {
              debug(`${DEBUG_PREFIX} Default multi-file target word count changed: ${num}`);
              plugin.settings.defaultMultiTargetWordCount = num;
              plugin.saveSettings();
            }
          }),
      );

    new Setting(containerEl)
      .setName(`Default target word count for ${PROJECT_TYPE.SINGLE} projects`)
      .setDesc(`Target word count automatically set for new ${PROJECT_TYPE.SINGLE} projects`)
      .addText((t) =>
        t
          .setValue(String(plugin.settings.defaultSingleTargetWordCount ?? 20000))
          .setPlaceholder("20000")
          .onChange((v) => {
            const num = parseInt(v, 10);
            if (!isNaN(num) && num > 0) {
              debug(
                `${DEBUG_PREFIX} Default ${PROJECT_TYPE.SINGLE} target word count changed: ${num}`,
              );
              plugin.settings.defaultSingleTargetWordCount = num;
              plugin.saveSettings();
            }
          }),
      );

    containerEl.createEl("h3", { text: "Backup Settings" });

    new Setting(containerEl)
      .setName("Maximum number of backups per draft")
      .setDesc("Maximum number of backup files to keep per draft (default: 5)")
      .addText((t) =>
        t
          .setValue(String(plugin.settings.maxBackups ?? 5))
          .setPlaceholder("5")
          .onChange((v) => {
            const num = parseInt(v, 10);
            if (!isNaN(num) && num >= 0) {
              debug(`${DEBUG_PREFIX} Max backups changed: ${num}`);
              plugin.settings.maxBackups = num;
              plugin.saveSettings();
            }
          }),
      );

    new Setting(containerEl)
      .setName("Maximum backup age (days)")
      .setDesc("Automatically delete backups older than this many days (default: 30)")
      .addText((t) =>
        t
          .setValue(String(plugin.settings.maxBackupAgeDays ?? 30))
          .setPlaceholder("30")
          .onChange((v) => {
            const num = parseInt(v, 10);
            if (!isNaN(num) && num >= 0) {
              debug(`${DEBUG_PREFIX} Max backup age changed: ${num}`);
              plugin.settings.maxBackupAgeDays = num;
              plugin.saveSettings();
            }
          }),
      );

    containerEl.createEl("h3", { text: "UI & Startup" });

    containerEl.createEl("p", {
      text: "Most settings take effect immediately. Settings marked with ⚠️ require a plugin reload to take effect.",
      cls: "setting-item-description",
    });

    new Setting(containerEl)
      .setName("Ribbon placement")
      .setDesc(`Place the ${APP_NAME} icon on the left or right ribbon`)
      .addDropdown((d) => {
        d.addOption("left", "Left");
        d.addOption("right", "Right");
        d.setValue(plugin.settings.ribbonPlacement || "left");
        d.onChange((v) => {
          debug(`${DEBUG_PREFIX} Ribbon placement changed: ${v}`);
          plugin.settings.ribbonPlacement = v as WriteAidSettings["ribbonPlacement"];
          plugin.saveSettings();
          if (typeof this.plugin.moveRibbon === "function" && (v === "left" || v === "right")) {
            this.plugin.moveRibbon(v);
          }
          this.display();
        });
      });

    new Setting(containerEl)
      .setName("Always show ribbon")
      .setDesc(
        `If enabled, the ${APP_NAME} ribbon icon will always be visible regardless of whether projects are detected`,
      )
      .addToggle((t) =>
        t.setValue(Boolean(plugin.settings.ribbonAlwaysShow)).onChange((v) => {
          debug(`${DEBUG_PREFIX} Always show ribbon changed: ${v}`);
          plugin.settings.ribbonAlwaysShow = v;
          plugin.saveSettings();
          if (typeof this.plugin.refreshRibbonVisibility === "function") {
            this.plugin.refreshRibbonVisibility();
          }
        }),
      );

    new Setting(containerEl)
      .setName("Auto-open project panel on startup")
      .setDesc(
        `If enabled, the ${APP_NAME} project panel will open on plugin load when an active project is saved. ⚠️ Requires plugin reload to take effect.`,
      )
      .addToggle((t) =>
        t.setValue(Boolean(plugin.settings.autoOpenPanelOnStartup)).onChange((v) => {
          debug(`${DEBUG_PREFIX} Auto-open panel on startup changed: ${v}`);
          plugin.settings.autoOpenPanelOnStartup = v;
          plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Auto-select persisted project on startup")
      .setDesc(
        "If enabled, the persisted active project will be selected as the plugin's active project on load without opening the panel. ⚠️ Requires plugin reload to take effect.",
      )
      .addToggle((t) =>
        t.setValue(Boolean(plugin.settings.autoSelectProjectOnStartup)).onChange((v) => {
          debug(`${DEBUG_PREFIX} Auto-select project on startup changed: ${v}`);
          plugin.settings.autoSelectProjectOnStartup = v;
          plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName(`Enable ${APP_NAME} debug logs`)
      .setDesc(
        `When enabled, ${APP_NAME} will set window.__${APP_NAME.toUpperCase()}__ to true to show verbose runtime logs useful during development.`,
      )
      .addToggle((t) =>
        t.setValue(Boolean(plugin.settings.debug)).onChange((v) => {
          debug(`${DEBUG_PREFIX} Debug logs setting changed: ${v}`);
          plugin.settings.debug = v;
          // Apply immediately to the global runtime toggle so logs take effect without reload
          (window as unknown as { __WRITEAID_DEBUG__?: boolean }).__WRITEAID_DEBUG__ = Boolean(v);
          plugin.saveSettings();
          // Show a brief visual confirmation so users know the change took effect
          if (v) {
            new Notice(
              `${APP_NAME}: debug logs enabled — verbose logs will appear in the DevTools console.`,
            );
          } else {
            new Notice(`${APP_NAME}: debug logs disabled.`);
          }
        }),
      );

    containerEl.createEl("h3", { text: "Panel performance" });

    const debounceSetting = new Setting(containerEl)
      .setName("Panel refresh debounce (ms)")
      .setDesc(
        "Debounce timeout (milliseconds) for side-panel refresh notifications. Lower values mean more frequent refreshes; 0 disables debouncing.",
      );

    // Add a numeric text input, a synchronized range slider, and a Reset button
    debounceSetting
      .addText((t) => {
        const current = plugin.settings.panelRefreshDebounceMs;
        const initial = Number(current ?? PANEL_DEBOUNCE_DEFAULT);
        t.setPlaceholder(String(PANEL_DEBOUNCE_DEFAULT));
        t.setValue(String(initial));

        // range element (declared here so closures can access it)
        let rangeEl: HTMLInputElement | null = null;

        const applyValue = (raw: number) => {
          const n = Number(raw);
          if (!Number.isFinite(n) || n < PANEL_DEBOUNCE_MIN) {
            new Notice(`Please enter a valid number ≥ ${PANEL_DEBOUNCE_MIN}.`);
            return;
          }
          const clamped = Math.min(Math.floor(n), PANEL_DEBOUNCE_MAX);
          debug(`${DEBUG_PREFIX} Panel refresh debounce changed: ${clamped}ms`);
          plugin.settings.panelRefreshDebounceMs = clamped;
          try {
            const res = plugin.saveSettings();
            if (res && typeof (res as Promise<unknown>).catch === "function") {
              (res as Promise<unknown>).catch(() => {});
            }
          } catch {
            // ignore
          }
          if (
            this.plugin.manager &&
            typeof this.plugin.manager === "object" &&
            "panelRefreshDebounceMs" in this.plugin.manager
          ) {
            (this.plugin.manager as { panelRefreshDebounceMs: number }).panelRefreshDebounceMs =
              clamped;
          }

          // update visible inputs
          (t.inputEl as HTMLInputElement).value = String(clamped);
          if (rangeEl) rangeEl.value = String(clamped);
        };

        // make the native input a number field for better UX and accessibility
        try {
          const inputEl = t.inputEl as HTMLInputElement;
          inputEl.setAttribute("type", "number");
          inputEl.setAttribute("min", String(PANEL_DEBOUNCE_MIN));
          inputEl.setAttribute("max", String(PANEL_DEBOUNCE_MAX));
          inputEl.setAttribute("step", "50");
          inputEl.setAttribute("aria-label", "Panel refresh debounce in milliseconds");
          // append a small unit suffix after the input for clarity (CSS handles spacing)
          suppress(() => {
            inputEl.insertAdjacentHTML("afterend", '<span class="wa-unit">ms</span>');
          });

          // create a range slider and insert after the unit
          rangeEl = document.createElement("input");
          rangeEl.type = "range";
          rangeEl.min = String(PANEL_DEBOUNCE_MIN);
          rangeEl.max = String(PANEL_DEBOUNCE_MAX);
          rangeEl.step = "50";
          rangeEl.value = String(initial);
          rangeEl.className = "wa-debounce-range";
          suppress(() => {
            // Insert after the unit span if present so order is: input -> unit -> range
            const unitNode = inputEl.nextSibling as HTMLElement | null;
            if (unitNode && unitNode.parentElement) {
              unitNode.insertAdjacentElement("afterend", rangeEl!);
            } else {
              inputEl.insertAdjacentElement("afterend", rangeEl!);
            }
          });

          // wire events: text input → applyValue, range → sync & applyValue
          t.onChange((v: string) => {
            const n = Number(v);
            applyValue(n);
          });

          rangeEl.addEventListener("input", (ev) => {
            const v = Number((ev.target as HTMLInputElement).value);
            (t.inputEl as HTMLInputElement).value = String(v);
            applyValue(v);
          });
        } catch {
          // ignore
          // if anything fails, fall back to simple text behavior
          t.onChange((v: string) => {
            const n = Number(v);
            if (!Number.isFinite(n) || n < PANEL_DEBOUNCE_MIN) {
              new Notice(`Please enter a valid number ≥ ${PANEL_DEBOUNCE_MIN}.`);
              return;
            }
            const clamped = Math.min(Math.floor(n), PANEL_DEBOUNCE_MAX);
            plugin.settings.panelRefreshDebounceMs = clamped;
            plugin.saveSettings();
            if (
              this.plugin.manager &&
              typeof this.plugin.manager === "object" &&
              "panelRefreshDebounceMs" in this.plugin.manager
            ) {
              (this.plugin.manager as { panelRefreshDebounceMs: number }).panelRefreshDebounceMs =
                clamped;
            }
          });
        }
      })
      .addButton((b) =>
        b
          .setButtonText("Reset")
          .setTooltip(`Reset to default (${PANEL_DEBOUNCE_DEFAULT} ms)`)
          .onClick(() => {
            const def = PANEL_DEBOUNCE_DEFAULT;
            plugin.settings.panelRefreshDebounceMs = def;
            plugin.saveSettings();
            // update manager and UI
            if (
              this.plugin.manager &&
              typeof this.plugin.manager === "object" &&
              "panelRefreshDebounceMs" in this.plugin.manager
            ) {
              (this.plugin.manager as { panelRefreshDebounceMs: number }).panelRefreshDebounceMs =
                def;
            }
            // refresh the settings display to update the input value
            this.display();
          }),
      );
  }
}

class FilePickerModal extends Modal {
  onPick: (path: string) => void;
  currentFolder: TFolder | null = null;
  expanded: Record<string, boolean> = {};

  constructor(app: App, onPick: (path: string) => void) {
    super(app);
    this.onPick = onPick;
    debug(`${DEBUG_PREFIX} FilePickerModal created`);
  }

  onOpen() {
    debug(`${DEBUG_PREFIX} FilePickerModal opened`);
    const root = this.app.vault.getRoot();
    this.currentFolder = root;
    this.expanded = {};
    this.render();
  }

  render() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Select template file" });

    if (!this.currentFolder) return;

    // Breadcrumbs
    const parts = this.currentFolder.path ? this.currentFolder.path.split("/") : [];
    const bc = contentEl.createDiv({ cls: "wat-breadcrumbs" });
    const rootLink = bc.createEl("a", { text: "(Vault root)", href: "#" });
    rootLink.onclick = (e) => {
      e.preventDefault();
      this.currentFolder = this.app.vault.getRoot() as TFolder;
      this.render();
    };
    let acc = "";
    for (const p of parts) {
      acc = acc ? `${acc}/${p}` : p;
      bc.createDiv({ text: " / " });
      const link = bc.createEl("a", { text: p, href: "#" });
      const path = acc;
      link.onclick = (e) => {
        e.preventDefault();
        const f = this.app.vault.getAbstractFileByPath(path);
        if (f && f instanceof TFolder) {
          this.currentFolder = f;
          this.render();
        }
      };
    }

    // Controls: up one level
    const controls = contentEl.createDiv({ cls: "wat-controls" });
    const up = controls.createEl("button", { text: "Up" });
    up.onclick = (e) => {
      e.preventDefault();
      if (!this.currentFolder) return;
      const parentPath = this.currentFolder.parent?.path || "";
      const parent = parentPath
        ? this.app.vault.getAbstractFileByPath(parentPath)
        : this.app.vault.getRoot();
      if (parent && parent instanceof TFolder) {
        this.currentFolder = parent;
        this.render();
      }
    };

    // Folder and file list (show immediate children)
    const list = contentEl.createDiv({ cls: "wat-list" });
    for (const child of this.currentFolder.children) {
      if (child instanceof TFolder) {
        const row = list.createDiv({ cls: "wat-row folder-row" });
        const foldBtn = row.createEl("button", {
          text: this.expanded[child.path] ? "▾" : "▸",
        });
        foldBtn.onclick = (e) => {
          e.preventDefault();
          this.expanded[child.path] = !this.expanded[child.path];
          this.render();
        };
        const name = row.createEl("a", { text: child.name, href: "#" });
        name.onclick = (e) => {
          e.preventDefault();
          this.currentFolder = child;
          this.render();
        };
        if (this.expanded[child.path]) {
          const sub = list.createDiv({ cls: "wat-sub" });
          for (const gc of child.children) {
            if (gc instanceof TFolder) {
              const subRow = sub.createDiv({ cls: "wat-row sub-folder" });
              const subName = subRow.createEl("a", {
                text: gc.name,
                href: "#",
              });
              subName.onclick = (e) => {
                e.preventDefault();
                this.currentFolder = gc;
                this.render();
              };
            } else if (gc instanceof TFile) {
              if (gc.path.toLowerCase().endsWith(MARKDOWN_FILE_EXTENSION)) {
                const subRow = sub.createDiv({ cls: "wat-row sub-file" });
                const a = subRow.createEl("a", { text: gc.name, href: "#" });
                a.onclick = (e) => {
                  e.preventDefault();
                  debug(`${DEBUG_PREFIX} File selected from file picker: ${gc.path}`);
                  this.close();
                  this.onPick(gc.path);
                };
              }
            }
          }
        }
      } else if (child instanceof TFile) {
        if (child.path.toLowerCase().endsWith(MARKDOWN_FILE_EXTENSION)) {
          const row = list.createDiv({ cls: "wat-row file-row" });
          const a = row.createEl("a", { text: child.name, href: "#" });
          a.onclick = (e) => {
            e.preventDefault();
            debug(`${DEBUG_PREFIX} File selected from file picker: ${child.path}`);
            this.close();
            this.onPick(child.path);
          };
        }
      }
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}
