export interface WriteAidSettings {
  draftOutlineTemplate: string;
  planningTemplate: string;
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
  // can emit diagnostics useful during development.
  debug?: boolean;

  // If true, create an outline.md file when creating a new draft
  includeDraftOutline?: boolean;

  // Customizable folder names
  draftsFolderName?: string;
  manuscriptsFolderName?: string;
  backupsFolderName?: string;

  // Customizable file names
  metaFileName?: string;
  outlineFileName?: string;
}

// Minimal plugin-like interface used for typing in services
export interface PluginLike {
  settings?: WriteAidSettings;
}

export interface WriteAidPluginManager {
  activeProject?: unknown;
  addActiveProjectListener?: (cb: (active: unknown) => void) => void;
}

export interface Chapter {
  name: string;
  chapterName?: string;
}

export interface CallableFunction<T> {
  (...args: unknown[]): T;
}

export interface ExceptionConstructor {
  new (...args: unknown[]): Error;
}
