type EnumExtract<T> = T[keyof T];

export interface WriteAidSettings {
  outlineTemplate: string;
  chapterTemplate: string;
  manuscriptNameTemplate: string;
  // How to slugify per-draft main filenames
  slugStyle?: "compact" | "kebab";
  // Persist the currently active project path (optional)
  activeProject?: string;
  // Ribbon placement and visibility
  ribbonPlacement?: "left" | "right";
  ribbonAlwaysShow?: boolean;
  // If enabled, reveal the WriteAid sidepanel automatically on plugin load when an active project exists
  autoOpenPanelOnStartup?: boolean;
  // If enabled, select (set) the persisted active project as the plugin's active project on load
  // This does not open the project panel; it only sets the active project in the manager.
  autoSelectProjectOnStartup?: boolean;
  // Debounce timeout for panel refresh notifications (milliseconds). 0 disables debouncing.
  panelRefreshDebounceMs?: number;
  // Developer runtime debug toggle. When true the plugin will enable verbose runtime
  // logging via window.__WRITEAID_DEBUG__ so the sidepanel view and mount helper
  // can emit diagnostics useful during development this.
  debug?: boolean;

  // If true, create an outline.md file when creating a new draft
  includeDraftOutline?: boolean;

  // If true, include frontmatter metadata in outline files
  includeOutlineMetadata?: boolean;

  // Which metadata fields to include in outline frontmatter
  outlineMetadataFields?: string[];

  // Customizable folder names
  draftsFolderName?: string;
  manuscriptsFolderName?: string;
  backupsFolderName?: string;

  // Customizable file names
  metaFileName?: string;
  outlineFileName?: string;

  // Default target word counts for new projects
  defaultMultiTargetWordCount?: number;
  defaultSingleTargetWordCount?: number;

  // Backup settings
  maxBackups?: number;
  maxBackupAgeDays?: number;

  // Manuscript settings
  authorName?: string;                          // Author name for manuscript metadata headers
  manuscriptSectionBreak?: 'horizontal' | 'asterisks' | 'dashes';  // Section break style between chapters
  manuscriptIncludeChapterList?: boolean;       // Include list of chapters in manuscript
}

// Minimal plugin-like interface used for typing in services
export interface PluginLike {
  settings?: WriteAidSettings;
}

export const WriteAidError = {
  ACTIVE_PROJECT_NOT_FOUND: "No active project found.",
  ACTIVE_DRAFT_NOT_FOUND: "No active draft found.",
  BACKUPS_NOT_FOUND_PROJECT: "No backups found for the current project.",
  BACKUPS_NOT_FOUND_DRAFT: "No backups found for the current draft.",
};
export type WriteAidErrorType = EnumExtract<typeof WriteAidError>;

export interface CallableFunction<T> {
  (...args: unknown[]): T;
}

export interface Chapter {
  name: string;
  chapterName?: string;
}

export interface ExceptionConstructor {
  new (...args: unknown[]): Error;
}

export interface SelectProjectModalProps {
  folders: string[];
  onSubmit: (projectPath: string) => void;
}

export interface CreateDraftModalProps {
  suggestedName: string;
  drafts: string[];
  projectPath?: string;
  onSubmit: (draftName: string, copyFrom?: string) => void;
}
