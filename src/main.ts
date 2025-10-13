import { App, Modal, Plugin, PluginSettingTab, Setting, TFile, TFolder } from "obsidian";
import { slugifyDraftName } from './core/utils';
import { WriteAidManager } from "./manager";
import { WriteAidSettings } from './types';

const DEFAULT_SETTINGS: WriteAidSettings = {
  projectFileTemplate: "# {{projectName}}\n\nProject created with WriteAid",
  draftOutlineTemplate: "# Outline for {{draftName}}",
  planningTemplate: "# Planning: {{projectName}}\n\n- [ ] ...",
  chapterTemplate: "# {{chapterTitle}}\n\n",
  slugStyle: 'compact',
};

function normalizeSettings(data?: Partial<WriteAidSettings>): WriteAidSettings {
  return Object.assign({}, DEFAULT_SETTINGS, data || {});
}

export default class WriteAidPlugin extends Plugin {
  manager!: WriteAidManager;
  settings: WriteAidSettings = DEFAULT_SETTINGS;

  async loadSettings() {
    const data = await this.loadData();
    this.settings = normalizeSettings(data);
  }

  // (settings already normalized by top-level normalizeSettings)

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async onload() {
    console.log("Loading WriteAid Novel Multi-Draft Plugin");
  await this.loadSettings();
  this.manager = new WriteAidManager(this.app, this);

    this.addCommand({
      id: "create-new-draft",
      name: "Create New Draft",
  callback: () => this.manager.createNewDraftPrompt(),
    });

    this.addCommand({
      id: "create-new-project",
      name: "Create New Project",
  callback: () => this.manager.createNewProjectPrompt(),
    });

    this.addCommand({
      id: "convert-index-to-planning",
      name: "Convert Index to Planning Document",
  callback: () => this.manager.convertIndexToPlanningPrompt(),
    });

    this.addCommand({
      id: "switch-draft",
      name: "Switch Active Draft",
  callback: () => this.manager.switchDraftPrompt(),
    });

    this.addSettingTab(new WriteAidSettingTab(this.app, this));
  }

  onunload() {
    console.log("Unloading WriteAid Novel Multi-Draft Plugin");
  }
}

class WriteAidSettingTab extends PluginSettingTab {
  plugin: WriteAidPlugin;

  constructor(app: App, plugin: WriteAidPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "WriteAid Settings" });

    const plugin = this.plugin;

    new Setting(containerEl)
      .setName('Project file template')
      .setDesc('Template for the main project file. Use {{projectName}}')
      .addTextArea((ta) =>
        ta.setValue(plugin.settings.projectFileTemplate || '')
          .onChange((v) => {
            plugin.settings.projectFileTemplate = v;
            plugin.saveSettings();
          })
      )
      .addButton((btn) =>
        btn.setButtonText('Pick file...').onClick(() => {
          new FilePickerModal(this.app, (path) => {
            plugin.settings.projectFileTemplate = path;
            plugin.saveSettings();
            this.display();
          }).open();
        })
      );

    new Setting(containerEl)
      .setName('Draft outline template')
      .setDesc('Template for new draft outline files. Use {{draftName}}')
      .addTextArea((ta) =>
        ta.setValue(plugin.settings.draftOutlineTemplate || '')
          .onChange((v) => {
            plugin.settings.draftOutlineTemplate = v;
            plugin.saveSettings();
          })
      )
      .addButton((btn) =>
        btn.setButtonText('Pick file...').onClick(() => {
          new FilePickerModal(this.app, (path) => {
            plugin.settings.draftOutlineTemplate = path;
            plugin.saveSettings();
            this.display();
          }).open();
        })
      );

    new Setting(containerEl)
      .setName('Planning template')
      .setDesc('Template for planning documents. Use {{projectName}}')
      .addTextArea((ta) =>
        ta.setValue(plugin.settings.planningTemplate || '')
          .onChange((v) => {
            plugin.settings.planningTemplate = v;
            plugin.saveSettings();
          })
      )
      .addButton((btn) =>
        btn.setButtonText('Pick file...').onClick(() => {
          new FilePickerModal(this.app, (path) => {
            plugin.settings.planningTemplate = path;
            plugin.saveSettings();
            this.display();
          }).open();
        })
      );

    new Setting(containerEl)
      .setName('Chapter template')
      .setDesc('Template for newly created chapter files. Use {{chapterTitle}}')
      .addTextArea((ta) =>
        ta.setValue(plugin.settings.chapterTemplate || '')
          .onChange((v) => {
            plugin.settings.chapterTemplate = v;
            plugin.saveSettings();
          })
      )
      .addButton((btn) =>
        btn.setButtonText('Pick file...').onClick(() => {
          new FilePickerModal(this.app, (path) => {
            plugin.settings.chapterTemplate = path;
            plugin.saveSettings();
            this.display();
          }).open();
        })
      );

    new Setting(containerEl)
      .setName('Draft filename slug style')
      .setDesc('How per-draft main filenames are generated')
      .addDropdown((d) => {
        d.addOption('compact', 'compact (draft1)');
        d.addOption('kebab', 'kebab (draft-1)');
        d.setValue(plugin.settings.slugStyle || 'compact');
        d.onChange((v) => {
          plugin.settings.slugStyle = v as any;
          plugin.saveSettings();
          // update preview
          const prev = containerEl.querySelector('.wat-slug-preview');
          if (prev) prev.textContent = `Example: Draft 1 → ${slugifyDraftName('Draft 1', v as any)}.md`;
        });
      });

    // Preview line for slug style
    // sample draft name input + preview
    let sampleName = 'Draft 1';
    const sampleSetting = new Setting(containerEl)
      .setName('Sample draft name')
      .setDesc('Type a sample draft name to preview the generated filename')
      .addText((t) => t
        .setPlaceholder('Draft 1')
        .setValue(sampleName)
        .onChange((v) => {
          sampleName = v || 'Draft 1';
          const prev = containerEl.querySelector('.wat-slug-preview');
          if (prev) {
            const s = slugifyDraftName(sampleName, plugin.settings.slugStyle as any);
            prev.textContent = `Example: ${sampleName} → ${s}.md`;
          }
        })
      );

    const previewEl = containerEl.createDiv({ cls: 'wat-slug-preview' });
  const initialSlug = slugifyDraftName(sampleName, plugin.settings.slugStyle as any);
  previewEl.setText(`Example: ${sampleName} → ${initialSlug}.md`);
  }
}

class FilePickerModal extends Modal {
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
    contentEl.createEl('h2', { text: 'Select template file' });

    if (!this.currentFolder) return;

    // Breadcrumbs
    const parts = this.currentFolder.path ? this.currentFolder.path.split('/') : [];
    const bc = contentEl.createDiv({ cls: 'wat-breadcrumbs' });
    const rootLink = bc.createEl('a', { text: '(Vault root)', href: '#' });
    rootLink.onclick = (e) => { e.preventDefault(); this.currentFolder = this.app.vault.getRoot() as TFolder; this.render(); };
    let acc = '';
    for (const p of parts) {
      acc = acc ? `${acc}/${p}` : p;
      bc.createDiv({ text: ' / ' });
      const link = bc.createEl('a', { text: p, href: '#' });
      const path = acc;
      link.onclick = (e) => { e.preventDefault(); const f = this.app.vault.getAbstractFileByPath(path); if (f && f instanceof TFolder) { this.currentFolder = f; this.render(); } };
    }

    // Controls: up one level
    const controls = contentEl.createDiv({ cls: 'wat-controls' });
    const up = controls.createEl('button', { text: 'Up' });
    up.onclick = (e) => {
      e.preventDefault();
      if (!this.currentFolder) return;
      const parentPath = this.currentFolder.parent?.path || '';
      const parent = parentPath ? this.app.vault.getAbstractFileByPath(parentPath) : this.app.vault.getRoot();
      if (parent && parent instanceof TFolder) { this.currentFolder = parent; this.render(); }
    };

    // Folder and file list (show immediate children)
    const list = contentEl.createDiv({ cls: 'wat-list' });
    for (const child of this.currentFolder.children) {
      if (child instanceof TFolder) {
        const row = list.createDiv({ cls: 'wat-row folder-row' });
        const foldBtn = row.createEl('button', { text: this.expanded[child.path] ? '▾' : '▸' });
        foldBtn.onclick = (e) => { e.preventDefault(); this.expanded[child.path] = !this.expanded[child.path]; this.render(); };
        const name = row.createEl('a', { text: child.name, href: '#' });
        name.onclick = (e) => { e.preventDefault(); this.currentFolder = child; this.render(); };
        if (this.expanded[child.path]) {
          const sub = list.createDiv({ cls: 'wat-sub' });
          for (const gc of child.children) {
            if (gc instanceof TFolder) {
              const subRow = sub.createDiv({ cls: 'wat-row sub-folder' });
              const subName = subRow.createEl('a', { text: gc.name, href: '#' });
              subName.onclick = (e) => { e.preventDefault(); this.currentFolder = gc; this.render(); };
            } else if (gc instanceof TFile) {
              if (gc.path.toLowerCase().endsWith('.md')) {
                const subRow = sub.createDiv({ cls: 'wat-row sub-file' });
                const a = subRow.createEl('a', { text: gc.name, href: '#' });
                a.onclick = (e) => { e.preventDefault(); this.close(); this.onPick(gc.path); };
              }
            }
          }
        }
      } else if (child instanceof TFile) {
        if (child.path.toLowerCase().endsWith('.md')) {
          const row = list.createDiv({ cls: 'wat-row file-row' });
          const a = row.createEl('a', { text: child.name, href: '#' });
          a.onclick = (e) => { e.preventDefault(); this.close(); this.onPick(child.path); };
        }
      }
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}
