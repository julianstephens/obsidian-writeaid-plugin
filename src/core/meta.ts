import type { WriteAidSettings } from "@/types";
import { App, TFile, TFolder } from "obsidian";
import {
  buildFrontmatter,
  debug,
  DEBUG_PREFIX,
  extractFrontmatterFields,
  FRONTMATTER_DELIMITER,
  FRONTMATTER_REGEX,
  getDraftsFolderName,
  getMetaFileName,
  isValidChapterFrontmatter,
  type ProjectType,
  WRITEAID_VERSION,
} from "./utils";

/**
 * Project metadata tracked in meta.md
 */
export interface ProjectMetadata {
  version?: string; // WriteAid project version for compatibility
  project_id?: string; // UUID unique identifier for the project
  project_name?: string; // User-friendly project name
  description?: string; // Optional project description/notes
  date_created?: string; // ISO 8601 creation date
  date_updated?: string; // ISO 8601 last update date
  current_active_draft?: string;
  current_draft_word_count?: number; // Word count of the currently activated draft
  total_drafts: number;
  target_word_count?: number;
  active_draft_last_modified?: string; // ISO 8601 timestamp
  total_word_count?: number;
  average_draft_word_count?: number;
  total_chapters?: number; // Count of chapters in active draft
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
    let metadata = parseFrontmatter(content);

    if (!metadata) {
      return null;
    }

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
      version: WRITEAID_VERSION,
      total_drafts: 0,
    };
  }

  // Always update date_updated timestamp
  metadata.date_updated = new Date().toISOString();

  // Count drafts in the Drafts folder
  const draftsFolderName = getDraftsFolderName(settings);
  const draftsFolder = app.vault.getAbstractFileByPath(`${projectPath}/${draftsFolderName}`);
  if (draftsFolder && draftsFolder instanceof TFolder) {
    const draftFolders = draftsFolder.children.filter((child) => child instanceof TFolder);
    metadata.total_drafts = draftFolders.length;

    // Update last_updated timestamp on all draft and chapter files
    const now = new Date().toISOString();
    for (const draftFolder of draftFolders) {
      if (draftFolder instanceof TFolder) {
        // Update timestamps on all markdown files in this draft
        for (const file of draftFolder.children) {
          if (file instanceof TFile && file.extension === "md") {
            try {
              const content = await app.vault.read(file);
              const fmMatch = content.match(FRONTMATTER_REGEX);
              if (fmMatch) {
                // Extract existing frontmatter fields using utility function
                const frontmatterContent = fmMatch[1];
                const fields = extractFrontmatterFields(frontmatterContent);

                // Update the last_updated field
                fields.last_updated = now;

                // Rebuild frontmatter with updated timestamp using utility function
                const updatedFrontmatter = buildFrontmatter(fields);
                const body = content.substring(fmMatch[0].length);
                const updatedContent = `${updatedFrontmatter}${body}`;

                await app.vault.modify(file, updatedContent);
              }
            } catch (error) {
              debug(`Error updating metadata for ${file.path}:`, error);
            }
          }
        }
      }
    }
  }

  // Update active draft if provided
  if (activeDraft !== undefined) {
    metadata.current_active_draft = activeDraft;
    metadata.active_draft_last_modified = new Date().toISOString();

    // Calculate total_chapters for the active draft
    const draftFolderPath = `${projectPath}/${draftsFolderName}/${activeDraft}`;
    const draftFolder = app.vault.getAbstractFileByPath(draftFolderPath);
    if (draftFolder && draftFolder instanceof TFolder) {
      let chapterCount = 0;
      for (const file of draftFolder.children) {
        if (file instanceof TFile && file.extension === "md") {
          try {
            const content = await app.vault.read(file);
            // Check if this is a valid chapter (has required fields: chapter_id, order, chapter_name)
            const fmMatch = content.match(FRONTMATTER_REGEX);
            if (fmMatch && isValidChapterFrontmatter(fmMatch[1])) {
              chapterCount++;
            }
          } catch (error) {
            debug(`Error checking chapter validity for ${file.path}:`, error);
          }
        }
      }
      metadata.total_chapters = chapterCount;
    } else {
      // If draft folder doesn't exist, set to 0
      metadata.total_chapters = 0;
    }
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
  const fmMatch = content.match(
    new RegExp(`${FRONTMATTER_DELIMITER}\\s*\\n([\\s\\S]*?)\\n${FRONTMATTER_DELIMITER}`),
  );
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
  // Build frontmatter fields
  const fields: Record<string, string | number> = {};

  if (metadata.version !== undefined) {
    fields.version = metadata.version;
  }
  if (metadata.project_id !== undefined) {
    fields.project_id = metadata.project_id;
  }
  if (metadata.project_name !== undefined) {
    fields.project_name = metadata.project_name;
  }
  if (metadata.description !== undefined) {
    fields.description = metadata.description;
  }
  if (metadata.date_created !== undefined) {
    fields.date_created = metadata.date_created;
  }
  if (metadata.date_updated !== undefined) {
    fields.date_updated = metadata.date_updated;
  }
  if (metadata.current_active_draft !== undefined) {
    fields.current_active_draft = metadata.current_active_draft;
  }
  if (metadata.current_draft_word_count !== undefined) {
    fields.current_draft_word_count = metadata.current_draft_word_count;
  }
  fields.total_drafts = metadata.total_drafts;
  if (metadata.target_word_count !== undefined) {
    fields.target_word_count = metadata.target_word_count;
  }
  if (metadata.active_draft_last_modified !== undefined) {
    fields.active_draft_last_modified = metadata.active_draft_last_modified;
  }
  if (metadata.total_word_count !== undefined) {
    fields.total_word_count = metadata.total_word_count;
  }
  if (metadata.average_draft_word_count !== undefined) {
    fields.average_draft_word_count = metadata.average_draft_word_count;
  }
  if (metadata.total_chapters !== undefined) {
    fields.total_chapters = metadata.total_chapters;
  }
  if (metadata.project_type !== undefined) {
    fields.project_type = metadata.project_type;
  }

  const lines: string[] = [buildFrontmatter(fields)];

  // Add human-readable section
  lines.push("# Project Statistics");
  lines.push("");
  if (metadata.project_name) {
    lines.push(`**Project Name:** ${metadata.project_name}`);
  }
  if (metadata.description) {
    lines.push(`**Description:** ${metadata.description}`);
  }
  if (metadata.date_created) {
    const date = new Date(metadata.date_created);
    lines.push(`**Created:** ${date.toLocaleString()}`);
  }
  if (metadata.date_updated) {
    const date = new Date(metadata.date_updated);
    lines.push(`**Last Updated:** ${date.toLocaleString()}`);
  }
  if (metadata.current_active_draft) {
    lines.push(`**Active Draft:** ${metadata.current_active_draft}`);
  }
  if (metadata.current_draft_word_count !== undefined) {
    lines.push(
      `**Current Draft Word Count:** ${metadata.current_draft_word_count.toLocaleString()}`,
    );
  }
  lines.push(`**Total Drafts:** ${metadata.total_drafts}`);
  if (metadata.total_chapters !== undefined) {
    lines.push(`**Total Chapters:** ${metadata.total_chapters}`);
  }
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
