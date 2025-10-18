import { debug, DEBUG_PREFIX, getDraftsFolderName, MARKDOWN_FILE_EXTENSION } from "@/core/utils";
import type { WriteAidManager } from "@/manager";
import { Notice } from "obsidian";

export function navigateToPreviousChapterCommand(manager: WriteAidManager) {
  return async () => {
    debug(`${DEBUG_PREFIX} Navigate to previous chapter command called`);
    const activeFile = manager.app.workspace.getActiveFile();
    if (!activeFile) {
      debug(`${DEBUG_PREFIX} navigateToPreviousChapter: no active file`);
      new Notice("No file is currently open.");
      return;
    }

    const path = activeFile.path;
    const draftsFolderName = getDraftsFolderName(manager.settings);
    const match = path.match(
      new RegExp(`^(.+)/${draftsFolderName}/(.+)/(.+)\\${MARKDOWN_FILE_EXTENSION}$`),
    );
    if (!match) {
      debug(`${DEBUG_PREFIX} navigateToPreviousChapter: file is not a chapter`);
      new Notice("The current file is not a chapter.");
      return;
    }

    const projectPath = match[1];
    const draftName = match[2];
    const chapterFileName = match[3];

    try {
      debug(
        `${DEBUG_PREFIX} navigateToPreviousChapter: looking for previous chapter before ${chapterFileName}`,
      );
      const chapters = await manager.projectFileService.chapters.listChapters(
        projectPath,
        draftName,
      );
      const currentIndex = chapters.findIndex((ch) => ch.name === chapterFileName);
      if (currentIndex === -1) {
        debug(`${DEBUG_PREFIX} navigateToPreviousChapter: current chapter not found`);
        new Notice("Unable to find the current chapter in the draft.");
        return;
      }

      if (currentIndex <= 0) {
        debug(`${DEBUG_PREFIX} navigateToPreviousChapter: already at first chapter`);
        return;
      }

      const previousChapter = chapters[currentIndex - 1];
      await manager.openChapter(projectPath, draftName, previousChapter.name);
    } catch (error) {
      debug(`${DEBUG_PREFIX} Failed to navigate to previous chapter:`, error);
      new Notice("Failed to navigate to previous chapter.");
    }
  };
}
