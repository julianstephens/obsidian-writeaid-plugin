import { App, Notice, TFile, TFolder } from 'obsidian';

/**
 * Options for compiling a project into a manuscript
 */
export interface CompileOptions {
  /** Path to the project folder */
  projectPath?: string;
  /** Name of the draft to compile (defaults to active draft or first draft found) */
  draftName?: string;
  /** Output filename (defaults to 'Manuscript.md') */
  outputFilename?: string;
}

/**
 * Compile a project draft into a formatted manuscript
 * @param app Obsidian App instance
 * @param options Compilation options
 * @returns Promise that resolves to the path of the compiled manuscript
 */
export async function compileProject(app: App, options?: CompileOptions): Promise<string | null> {
  const projectPath = options?.projectPath || resolveProjectPath(app);
  if (!projectPath) {
    new Notice('No project folder detected. Please specify a project path or open a file in a project.');
    return null;
  }

  // Determine which draft to compile
  let draftName = options?.draftName;
  if (!draftName) {
    // Try to get active draft from meta.md, or use first draft found
    const activeDraft = await getActiveDraft(app, projectPath);
    if (activeDraft) {
      draftName = activeDraft;
    }
  }

  if (!draftName) {
    new Notice('No draft found to compile. Please specify a draft name or ensure the project has drafts.');
    return null;
  }

  const draftFolder = `${projectPath}/Drafts/${draftName}`;
  const draftFolderAbstract = app.vault.getAbstractFileByPath(draftFolder);
  
  if (!draftFolderAbstract || !(draftFolderAbstract instanceof TFolder)) {
    new Notice(`Draft folder not found: ${draftFolder}`);
    return null;
  }

  // Collect all markdown files from the draft folder
  const files = app.vault.getFiles()
    .filter(file => file.path.startsWith(draftFolder) && file.extension === 'md')
    .sort((a, b) => a.path.localeCompare(b.path));

  if (files.length === 0) {
    new Notice(`No markdown files found in draft: ${draftName}`);
    return null;
  }

  // Read and concatenate file contents
  const sections: string[] = [];
  for (const file of files) {
    const content = await app.vault.read(file);
    // Remove YAML frontmatter if present
    const cleanContent = stripFrontmatter(content);
    if (cleanContent.trim()) {
      sections.push(cleanContent.trim());
    }
  }

  // Format the manuscript
  const projectName = projectPath.split('/').pop() || projectPath;
  const manuscriptContent = formatManuscript(projectName, draftName, sections);

  // Write to project root
  const outputFilename = options?.outputFilename || 'Manuscript.md';
  const outputPath = `${projectPath}/${outputFilename}`;
  
  const existingFile = app.vault.getAbstractFileByPath(outputPath);
  if (existingFile && existingFile instanceof TFile) {
    await app.vault.modify(existingFile, manuscriptContent);
  } else {
    await app.vault.create(outputPath, manuscriptContent);
  }

  new Notice(`Manuscript compiled: ${outputPath}`);
  return outputPath;
}

/**
 * Resolve the current project path from the active file
 */
function resolveProjectPath(app: App): string | null {
  const activeFile = app.workspace.getActiveFile();
  if (!activeFile) return null;
  
  // Walk up the path to find a folder with a Drafts subfolder
  let current = activeFile.parent;
  while (current) {
    const draftsFolder = app.vault.getAbstractFileByPath(`${current.path}/Drafts`);
    if (draftsFolder && draftsFolder instanceof TFolder) {
      return current.path;
    }
    current = current.parent;
  }
  
  // Fallback to immediate parent
  return activeFile.parent ? activeFile.parent.path : null;
}

/**
 * Get the active draft name from meta.md or return the first draft found
 */
async function getActiveDraft(app: App, projectPath: string): Promise<string | null> {
  // Try to read active draft from meta.md
  const metaPath = `${projectPath}/meta.md`;
  const metaFile = app.vault.getAbstractFileByPath(metaPath);
  
  if (metaFile && metaFile instanceof TFile) {
    const content = await app.vault.read(metaFile);
    // The expected format in meta.md is a YAML-like line:
    // current_active_draft: "DraftName"
    // or
    // current_active_draft: DraftName
    // This regex matches the value of current_active_draft, whether or not it is quoted.
    const match = content.match(/current_active_draft:\s*"?([^"\n]+)"?/);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Fallback: use first draft found
  const draftsFolder = app.vault.getAbstractFileByPath(`${projectPath}/Drafts`);
  if (draftsFolder && draftsFolder instanceof TFolder) {
    const draftFolders = draftsFolder.children
      .filter(child => child instanceof TFolder)
      .map((child: TFolder) => child.name);
    
    if (draftFolders.length > 0) {
      return draftFolders[0];
    }
  }

  return null;
}

/**
 * Remove YAML frontmatter from content
 */
function stripFrontmatter(content: string): string {
  const fmMatch = content.match(/^---\s*\n[\s\S]*?\n---\s*\n/);
  if (fmMatch) {
    return content.substring(fmMatch[0].length);
  }
  return content;
}

/**
 * Format the manuscript with a title page and content
 */
function formatManuscript(projectName: string, draftName: string, sections: string[]): string {
  const lines: string[] = [];
  
  // Title page
  lines.push(`# ${projectName}`);
  lines.push('');
  lines.push(`*${draftName}*`);
  lines.push('');
  lines.push(`---`);
  lines.push('');
  
  // Content sections
  lines.push(sections.join('\n\n---\n\n'));
  lines.push('');
  
  return lines.join('\n');
}
