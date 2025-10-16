import type { WriteAidSettings } from "@/types";
import { App, TFile, TFolder } from "obsidian";
import { debug, DEBUG_PREFIX, FRONTMATTER_DELIMITER, getDraftsFolderName, getMetaFileName, type ProjectType } from "./utils";

/**
 * Project metadata tracked in meta.md
 */
export interface ProjectMetadata {
  current_active_draft?: string;
  total_drafts: number;
  target_word_count?: number;
  active_draft_last_modified?: string; // ISO 8601 timestamp
  total_word_count?: number;
  average_draft_word_count?: number;
  project_type?: ProjectType;
  draft?: string; // for per-draft meta.md
}

/**
 * Read and parse metadata from meta.md file
 * @param app Obsidian App instance
 * @param filePath Path to the meta.md file
 * @returns Parsed metadata or null if file doesn't exist or parsing fails
 */
export async function readMetaFile(app: App, filePath: string): Promise<ProjectMetadata | null> {
  const file = app.vault.getAbstractFileByPath(filePath);
  if (!file || !(file instanceof TFile)) {
    return null;
  }

  try {
    const content = await app.vault.read(file);
    const metadata = parseFrontmatter(content);
    return metadata;
  } catch (error) {
    debug(`${DEBUG_PREFIX} Error reading meta file:`, error);
    return null;
  }
}

/**
 * Write metadata to meta.md file with YAML frontmatter and human-readable section
 * @param app Obsidian App instance
 * @param filePath Path to the meta.md file
 * @param metadata Metadata to write
 */
export async function writeMetaFile(
  app: App,
  filePath: string,
  metadata: ProjectMetadata,
): Promise<void> {
  const content = formatMetaContent(metadata);

  const file = app.vault.getAbstractFileByPath(filePath);
  if (file && file instanceof TFile) {
    await app.vault.modify(file, content);
  } else {
    await app.vault.create(filePath, content);
  }
}

/**
 * Update project statistics in meta.md
 * @param app Obsidian App instance
 * @param projectPath Path to the project folder
 * @param activeDraft Optional name of the active draft
 * @param options Optional additional metadata to update
 */
export async function updateMetaStats(
  app: App,
  projectPath: string,
  activeDraft?: string,
  options?: Partial<ProjectMetadata>,
  settings?: WriteAidSettings,
): Promise<void> {
  const metaPath = `${projectPath}/${getMetaFileName(settings)}`;

  // Read existing metadata or create new
  let metadata = await readMetaFile(app, metaPath);
  if (!metadata) {
    metadata = {
      total_drafts: 0,
    };
  }

  // Count drafts in the Drafts folder
  const draftsFolderName = getDraftsFolderName(settings);
  const draftsFolder = app.vault.getAbstractFileByPath(`${projectPath}/${draftsFolderName}`);
  if (draftsFolder && draftsFolder instanceof TFolder) {
    const draftFolders = draftsFolder.children.filter((child) => child instanceof TFolder);
    metadata.total_drafts = draftFolders.length;
  }

  // Update active draft if provided
  if (activeDraft !== undefined) {
    metadata.current_active_draft = activeDraft;
    metadata.active_draft_last_modified = new Date().toISOString();
  }

  // Apply optional metadata updates
  if (options) {
    Object.assign(metadata, options);
  }

  // Calculate optional statistics
  if (metadata.total_drafts > 0 && metadata.total_word_count) {
    metadata.average_draft_word_count = Math.round(
      metadata.total_word_count / metadata.total_drafts,
    );
  }

  await writeMetaFile(app, metaPath, metadata);
}

/**
 * Parse frontmatter from markdown content
 */
function parseFrontmatter(content: string): ProjectMetadata | null {
  const fmMatch = content.match(new RegExp(`${FRONTMATTER_DELIMITER}\\s*\\n([\\s\\S]*?)\\n${FRONTMATTER_DELIMITER}`));
  if (!fmMatch) {
    return null;
  }

  const yamlContent = fmMatch[1];
  const metadata: Partial<ProjectMetadata> = {};

  const lines = yamlContent.split("\n");
  for (const line of lines) {
    const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)$/);
    if (match) {
      const key = match[1];
      let value: string | number = match[2].trim();

      // Parse numbers
      // Only parse as number if the entire value is a valid number
      if (/^-?\d+(\.\d+)?$/.test(value)) {
        value = Number(value);
      }
      // Remove quotes from strings
      else if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      metadata[key] = value;
    }
  }

  return metadata as ProjectMetadata;
}

/**
 * Format metadata as markdown with YAML frontmatter and human-readable section
 */
function formatMetaContent(metadata: ProjectMetadata): string {
  const lines: string[] = [FRONTMATTER_DELIMITER];

  // Write YAML frontmatter
  if (metadata.current_active_draft !== undefined) {
    lines.push(`current_active_draft: "${metadata.current_active_draft}"`);
  }
  lines.push(`total_drafts: ${metadata.total_drafts}`);
  if (metadata.target_word_count !== undefined) {
    lines.push(`target_word_count: ${metadata.target_word_count}`);
  }
  if (metadata.active_draft_last_modified !== undefined) {
    lines.push(`active_draft_last_modified: "${metadata.active_draft_last_modified}"`);
  }
  if (metadata.total_word_count !== undefined) {
    lines.push(`total_word_count: ${metadata.total_word_count}`);
  }
  if (metadata.average_draft_word_count !== undefined) {
    lines.push(`average_draft_word_count: ${metadata.average_draft_word_count}`);
  }
  if (metadata.project_type !== undefined) {
    lines.push(`project_type: ${metadata.project_type}`);
  }

  lines.push(FRONTMATTER_DELIMITER);
  lines.push("");

  // Add human-readable section
  lines.push("# Project Statistics");
  lines.push("");
  if (metadata.current_active_draft) {
    lines.push(`**Active Draft:** ${metadata.current_active_draft}`);
  }
  lines.push(`**Total Drafts:** ${metadata.total_drafts}`);
  if (metadata.target_word_count) {
    lines.push(`**Target Word Count:** ${metadata.target_word_count.toLocaleString()}`);
  }
  if (metadata.active_draft_last_modified) {
    const date = new Date(metadata.active_draft_last_modified);
    lines.push(`**Last Modified:** ${date.toLocaleString()}`);
  }
  if (metadata.total_word_count) {
    lines.push(`**Total Word Count:** ${metadata.total_word_count.toLocaleString()}`);
  }
  if (metadata.average_draft_word_count) {
    lines.push(
      `**Average Draft Word Count:** ${metadata.average_draft_word_count.toLocaleString()}`,
    );
  }
  lines.push("");

  return lines.join("\n");
}
