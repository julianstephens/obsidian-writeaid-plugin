import {
  checkActive,
  debug,
  DEBUG_PREFIX,
  FRONTMATTER_DELIMITER,
  FRONTMATTER_REGEX,
  generateDraftId,
  getDraftsFolderName,
  MARKDOWN_FILE_EXTENSION,
} from "@/core/utils";
import type { WriteAidManager } from "@/manager";
import { App, Notice, SuggestModal, TFile, TFolder } from "obsidian";

interface DraftMetadata {
  id?: string;
  draft?: string;
  project?: string;
  created?: string;
}

interface FileItem {
  path: string;
  name: string;
  file: TFile;
}

/**
 * Extract metadata from frontmatter if it exists
 */
function extractMetadata(content: string): DraftMetadata {
  const metadata: DraftMetadata = {};
  const fmMatch = content.match(FRONTMATTER_REGEX);
  if (fmMatch) {
    const frontmatter = fmMatch[1];
    const idMatch = frontmatter.match(/^id:\s*(.+?)$/m);
    const draftMatch = frontmatter.match(/^draft:\s*(.+?)$/m);
    const projectMatch = frontmatter.match(/^project:\s*(.+?)$/m);
    const createdMatch = frontmatter.match(/^created:\s*(.+?)$/m);

    if (idMatch) metadata.id = idMatch[1].trim();
    if (draftMatch) metadata.draft = draftMatch[1].trim();
    if (projectMatch) metadata.project = projectMatch[1].trim();
    if (createdMatch) metadata.created = createdMatch[1].trim();
  }
  return metadata;
}

/**
 * Check if metadata is complete (has all required fields)
 */
function isMetadataComplete(metadata: DraftMetadata): boolean {
  return !!(metadata.id && metadata.draft && metadata.project && metadata.created);
}

/**
 * Ensure metadata object has all required fields, adding missing ones
 */
function ensureCompleteMetadata(
  metadata: DraftMetadata,
  draftName: string,
  projectName: string,
): DraftMetadata {
  return {
    id: metadata.id || generateDraftId(),
    draft: metadata.draft || draftName,
    project: metadata.project || projectName,
    created: metadata.created || new Date().toISOString(),
  };
}

/**
 * Update file content with complete metadata
 */
function updateFileWithMetadata(content: string, metadata: DraftMetadata): string {
  const fmMatch = content.match(FRONTMATTER_REGEX);

  if (fmMatch) {
    // File has frontmatter, update it
    const oldFrontmatter = fmMatch[1];
    const body = content.substring(fmMatch[0].length);

    // Parse existing lines
    const lines = oldFrontmatter.split("\n");
    const updatedLines: string[] = [];
    const fieldsSet = new Set<string>();

    for (const line of lines) {
      if (line.match(/^id:/i)) {
        updatedLines.push(`id: ${metadata.id}`);
        fieldsSet.add("id");
      } else if (line.match(/^draft:/i)) {
        updatedLines.push(`draft: ${metadata.draft}`);
        fieldsSet.add("draft");
      } else if (line.match(/^project:/i)) {
        updatedLines.push(`project: ${metadata.project}`);
        fieldsSet.add("project");
      } else if (line.match(/^created:/i)) {
        updatedLines.push(`created: ${metadata.created}`);
        fieldsSet.add("created");
      } else {
        updatedLines.push(line);
      }
    }

    // Add missing fields
    if (!fieldsSet.has("id")) updatedLines.push(`id: ${metadata.id}`);
    if (!fieldsSet.has("draft")) updatedLines.push(`draft: ${metadata.draft}`);
    if (!fieldsSet.has("project")) updatedLines.push(`project: ${metadata.project}`);
    if (!fieldsSet.has("created")) updatedLines.push(`created: ${metadata.created}`);

    const newFrontmatter = updatedLines.join("\n");
    return `${FRONTMATTER_DELIMITER}\n${newFrontmatter}\n${FRONTMATTER_DELIMITER}${body}`;
  } else {
    // No frontmatter, create it
    const fm = `${FRONTMATTER_DELIMITER}\nid: ${metadata.id}\ndraft: ${metadata.draft}\nproject: ${metadata.project}\ncreated: ${metadata.created}\n${FRONTMATTER_DELIMITER}\n\n`;
    return fm + content;
  }
}

/**
 * Modal for selecting a file to use as draft file
 */
class SelectDraftFileModal extends SuggestModal<FileItem> {
  private files: FileItem[] = [];

  constructor(
    app: App,
    files: FileItem[],
    private onSelect: (file: FileItem) => Promise<void>,
  ) {
    super(app);
    this.files = files;
    this.setPlaceholder("Select a file to initialize as draft file...");
    this.setInstructions([
      { command: "↑↓", purpose: "to navigate" },
      { command: "↵", purpose: "to select" },
      { command: "esc", purpose: "to cancel" },
    ]);
    this.setTitle("Select File for Draft Metadata");
  }

  getSuggestions(): FileItem[] {
    return this.files;
  }

  renderSuggestion(file: FileItem, el: HTMLElement) {
    el.createEl("div", { text: file.name });
  }

  async onChooseSuggestion(file: FileItem) {
    await this.onSelect(file);
  }
}

export function initializeDraftFileCommand(manager: WriteAidManager) {
  return async () => {
    const activeProjectPath = manager.activeProject;
    const activeDraftName = manager.activeDraft;

    debug(`${DEBUG_PREFIX} Initialize draft file command called`);
    debug(`${DEBUG_PREFIX} Active project: ${activeProjectPath}, active draft: ${activeDraftName}`);

    if (!checkActive(activeProjectPath, activeDraftName)) {
      return;
    }

    if (!activeProjectPath || !activeDraftName) {
      new Notice("Active project or draft not found.");
      return;
    }

    const draftsFolderName = getDraftsFolderName(manager.settings);
    const draftFolder = `${activeProjectPath}/${draftsFolderName}/${activeDraftName}`;
    const projectName = activeProjectPath.split("/").pop() || activeProjectPath;

    // Get all files in the draft folder
    const draftFolderObj = manager.app.vault.getAbstractFileByPath(draftFolder);
    if (!draftFolderObj || !(draftFolderObj instanceof TFolder)) {
      new Notice("Draft folder not found.");
      return;
    }

    // Get markdown files directly in the draft folder (not in subfolders)
    const files = draftFolderObj.children
      .filter((child): child is TFile => child instanceof TFile && child.extension === "md")
      .filter((file) => !file.path.includes("/Chapters/") && file.name !== "outline.md");

    debug(`${DEBUG_PREFIX} Found ${files.length} markdown files in draft folder`);

    if (files.length === 0) {
      // Create a new draft file
      debug(`${DEBUG_PREFIX} No files found, creating new draft file`);
      const metadata = ensureCompleteMetadata({}, activeDraftName, projectName);
      const newContent = updateFileWithMetadata("", metadata);
      const fileName = `${activeDraftName}${MARKDOWN_FILE_EXTENSION}`;

      await manager.app.vault.create(`${draftFolder}/${fileName}`, newContent);
      new Notice(`Draft file created with metadata for "${activeDraftName}".`);
      return;
    }

    if (files.length === 1) {
      // Check if the file already has complete metadata
      const file = files[0];
      const content = await manager.app.vault.read(file);
      const metadata = extractMetadata(content);

      if (isMetadataComplete(metadata)) {
        new Notice(`"${file.name}" already has complete draft metadata.`);
        return;
      }

      // Add missing metadata
      debug(`${DEBUG_PREFIX} Adding missing metadata to ${file.name}`);
      const completeMetadata = ensureCompleteMetadata(metadata, activeDraftName, projectName);
      const updatedContent = updateFileWithMetadata(content, completeMetadata);

      await manager.app.vault.modify(file, updatedContent);
      new Notice(`Draft metadata added to "${file.name}".`);
      return;
    }

    // Multiple files - show modal for selection
    debug(`${DEBUG_PREFIX} Multiple files found, showing selection modal`);
    const fileItems: FileItem[] = files.map((file) => ({
      path: file.path,
      name: file.name,
      file,
    }));

    const modal = new SelectDraftFileModal(manager.app, fileItems, async (selectedItem) => {
      const file = selectedItem.file;
      const content = await manager.app.vault.read(file);
      const metadata = extractMetadata(content);

      // Check if already complete
      if (isMetadataComplete(metadata)) {
        new Notice(`"${file.name}" already has complete draft metadata.`);
        return;
      }

      // Add missing metadata
      debug(`${DEBUG_PREFIX} Adding missing metadata to ${file.name}`);
      const completeMetadata = ensureCompleteMetadata(metadata, activeDraftName, projectName);
      const updatedContent = updateFileWithMetadata(content, completeMetadata);

      await manager.app.vault.modify(file, updatedContent);
      new Notice(`Draft metadata added to "${file.name}".`);
    });

    modal.open();
  };
}
