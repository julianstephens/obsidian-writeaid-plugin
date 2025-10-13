export interface WriteAidSettings {
  projectFileTemplate: string;
  draftOutlineTemplate: string;
  planningTemplate: string;
  chapterTemplate: string;
  // How to slugify per-draft main filenames
  slugStyle?: 'compact' | 'kebab';
}

// Minimal plugin-like interface used for typing in services
export interface PluginLike {
  settings?: WriteAidSettings;
}
