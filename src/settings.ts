import { slugifyDraftName } from "@/core/utils";
import type { WriteAidSettings } from "@/types";
import { App, Modal, Notice, PluginSettingTab, Setting, TFile, TFolder } from "obsidian";

// Keep the settings module decoupled from the full plugin implementation by
// describing only the small interface we need here. This avoids circular
// imports and makes the settings UI easier to test.
export interface MinimalPlugin {
  settings: WriteAidSettings;
  saveSettings: () => Promise<void> | void;
  manager?: { panelRefreshDebounceMs?: number };
  moveRibbon?: (to: "left" | "right") => void;
  refreshRibbonVisibility?: () => void;
}

const PANEL_DEBOUNCE_MIN = 0;
const PANEL_DEBOUNCE_MAX = 5000;
const PANEL_DEBOUNCE_DEFAULT = 250;

export class WriteAidSettingTab extends PluginSettingTab {
  plugin: MinimalPlugin;

  constructor(app: App, plugin: MinimalPlugin) {
    //@ts-expect-error 2345
    super(app, plugin as unknown as Plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "WriteAid Settings" });

    const plugin = this.plugin;

    containerEl.createEl("h3", { text: "Templates" });

    new Setting(containerEl)
      .setName("Include outline file on draft creation")
      .setDesc(
        "If enabled, each new draft will include an outline.md file using the outline template.",
      )
      .addToggle((toggle) =>
        toggle.setValue(!!plugin.settings.includeDraftOutline).onChange((v) => {
          plugin.settings.includeDraftOutline = v;
          plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Draft outline template")
      .setDesc("Template for new draft outline files. Use {{draftName}}")
      .addTextArea((ta) =>
        ta.setValue(plugin.settings.draftOutlineTemplate || "").onChange((v) => {
          plugin.settings.draftOutlineTemplate = v;
          plugin.saveSettings();
        }),
      )
      .addButton((btn) =>
        btn.setButtonText("Pick file...").onClick(() => {
          new FilePickerModal(this.app, (path) => {
            plugin.settings.draftOutlineTemplate = path;
            plugin.saveSettings();
            this.display();
          }).open();
        }),
      );

    new Setting(containerEl)
      .setName("Planning template")
      .setDesc("Template for planning documents. Use {{projectName}}")
      .addTextArea((ta) =>
        ta.setValue(plugin.settings.planningTemplate || "").onChange((v) => {
          plugin.settings.planningTemplate = v;
          plugin.saveSettings();
        }),
      )
      .addButton((btn) =>
        btn.setButtonText("Pick file...").onClick(() => {
          new FilePickerModal(this.app, (path) => {
            plugin.settings.planningTemplate = path;
            plugin.saveSettings();
            this.display();
          }).open();
        }),
      );

    new Setting(containerEl)
      .setName("Chapter template")
      .setDesc("Template for newly created chapter files. Use {{chapterTitle}}")
      .addTextArea((ta) =>
        ta.setValue(plugin.settings.chapterTemplate || "").onChange((v) => {
          plugin.settings.chapterTemplate = v;
          plugin.saveSettings();
        }),
      )
      .addButton((btn) =>
        btn.setButtonText("Pick file...").onClick(() => {
          new FilePickerModal(this.app, (path) => {
            plugin.settings.chapterTemplate = path;
            plugin.saveSettings();
            this.display();
          }).open();
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
          plugin.settings.slugStyle = v as WriteAidSettings["slugStyle"];
          plugin.saveSettings();
          const prev = containerEl.querySelector(".wat-slug-preview");
          if (prev)
            prev.textContent = `Example: Draft 1 → ${slugifyDraftName("Draft 1", v as WriteAidSettings["slugStyle"])}.md`;
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
              prev.textContent = `Example: ${sampleName} → ${s}.md`;
            }
          }),
      );

    const previewEl = containerEl.createDiv({ cls: "wat-slug-preview" });
    const initialSlug = slugifyDraftName(
      sampleName,
      plugin.settings.slugStyle as WriteAidSettings["slugStyle"],
    );
    previewEl.setText(`Example: ${sampleName} → ${initialSlug}.md`);

    containerEl.createEl("h3", { text: "UI & Startup" });

    new Setting(containerEl)
      .setName("Ribbon placement")
      .setDesc("Place the WriteAid icon on the left or right ribbon")
      .addDropdown((d) => {
        d.addOption("left", "Left");
        d.addOption("right", "Right");
        d.setValue(plugin.settings.ribbonPlacement || "left");
        d.onChange((v) => {
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
        "If enabled, the WriteAid ribbon icon will always be visible regardless of whether projects are detected",
      )
      .addToggle((t) =>
        t.setValue(Boolean(plugin.settings.ribbonAlwaysShow)).onChange((v) => {
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
        "If enabled, the WriteAid project panel will open on plugin load when an active project is saved",
      )
      .addToggle((t) =>
        t.setValue(Boolean(plugin.settings.autoOpenPanelOnStartup)).onChange((v) => {
          plugin.settings.autoOpenPanelOnStartup = v;
          plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Auto-select persisted project on startup")
      .setDesc(
        "If enabled, the persisted active project will be selected as the plugin's active project on load without opening the panel",
      )
      .addToggle((t) =>
        t.setValue(Boolean(plugin.settings.autoSelectProjectOnStartup)).onChange((v) => {
          plugin.settings.autoSelectProjectOnStartup = v;
          plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Enable WriteAid debug logs")
      .setDesc(
        "When enabled, WriteAid will set window.__WRITEAID_DEBUG__ to true to show verbose runtime logs useful during development.",
      )
      .addToggle((t) =>
        t.setValue(Boolean(plugin.settings.debug)).onChange((v) => {
          plugin.settings.debug = v;
          // Apply immediately to the global runtime toggle so logs take effect without reload
          (window as unknown as { __WRITEAID_DEBUG__?: boolean }).__WRITEAID_DEBUG__ = Boolean(v);
          plugin.saveSettings();
          // Show a brief visual confirmation so users know the change took effect
          if (v) {
            new Notice(
              "WriteAid: debug logs enabled — verbose logs will appear in the DevTools console.",
            );
          } else {
            new Notice("WriteAid: debug logs disabled.");
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
          plugin.settings.panelRefreshDebounceMs = clamped;
          try {
            const res = plugin.saveSettings();
            if (res && typeof (res as Promise<unknown>).catch === "function") {
              (res as Promise<unknown>).catch(() => {});
            }
          } catch (_e) {
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
          try {
            inputEl.insertAdjacentHTML("afterend", '<span class="wa-unit">ms</span>');
          } catch (_e) {
            // ignore
            // Ignore errors in saveSettings
          }

          // create a range slider and insert after the unit
          rangeEl = document.createElement("input");
          rangeEl.type = "range";
          rangeEl.min = String(PANEL_DEBOUNCE_MIN);
          rangeEl.max = String(PANEL_DEBOUNCE_MAX);
          rangeEl.step = "50";
          rangeEl.value = String(initial);
          rangeEl.className = "wa-debounce-range";
          try {
            // Insert after the unit span if present so order is: input -> unit -> range
            const unitNode = inputEl.nextSibling as HTMLElement | null;
            if (unitNode && unitNode.parentElement) {
              unitNode.insertAdjacentElement("afterend", rangeEl);
            } else {
              inputEl.insertAdjacentElement("afterend", rangeEl);
            }
          } catch (_e) {
            // ignore
            // fallback: append to the Setting's container element
            // Find the closest .setting-item container
            let settingItem = t.inputEl.closest(".setting-item");
            if (settingItem) {
              settingItem.appendChild(rangeEl);
            } else {
              // fallback: append to parent of inputEl
              t.inputEl.parentElement?.appendChild(rangeEl);
            }
          }

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
        } catch (_e) {
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

export class FilePickerModal extends Modal {
  onPick: (path: string) => void;
  currentFolder: TFolder | null = null;
  expanded: Record<string, boolean> = {};

  constructor(app: App, onPick: (path: string) => void) {
    super(app);
    this.onPick = onPick;
  }

  onOpen() {
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
              if (gc.path.toLowerCase().endsWith(".md")) {
                const subRow = sub.createDiv({ cls: "wat-row sub-file" });
                const a = subRow.createEl("a", { text: gc.name, href: "#" });
                a.onclick = (e) => {
                  e.preventDefault();
                  this.close();
                  this.onPick(gc.path);
                };
              }
            }
          }
        }
      } else if (child instanceof TFile) {
        if (child.path.toLowerCase().endsWith(".md")) {
          const row = list.createDiv({ cls: "wat-row file-row" });
          const a = row.createEl("a", { text: child.name, href: "#" });
          a.onclick = (e) => {
            e.preventDefault();
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
