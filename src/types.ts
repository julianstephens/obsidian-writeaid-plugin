export interface WriteAidSettings {
  projectFileTemplate: string;
  draftOutlineTemplate: string;
  planningTemplate: string;
  chapterTemplate: string;
}

// Minimal plugin-like interface used for typing in services
export interface PluginLike {
  settings?: WriteAidSettings;
}
