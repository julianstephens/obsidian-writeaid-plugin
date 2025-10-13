import { App, Modal, Setting } from 'obsidian';
import { SelectProjectModalProps } from './modalTypes';

export class SelectProjectModal extends Modal {
  props: SelectProjectModalProps;

  constructor(app: App, props: SelectProjectModalProps) {
    super(app);
    this.props = props;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: 'Select Project for Draft' });

    let selected = '';
    const folders = this.props.folders || [];
    new Setting(contentEl).setName('Project folder').addDropdown((drop) => {
      drop.addOption('', '(Vault root)');
      for (const f of folders) drop.addOption(f, f || '(Vault root)');
      drop.onChange((v) => (selected = v));
    });

    new Setting(contentEl).addButton((btn) =>
      btn.setButtonText('Select').setCta().onClick(() => {
        this.close();
        this.props.onSubmit(selected || '');
      }),
    );
  }

  onClose() {
    this.contentEl.empty();
  }
}
