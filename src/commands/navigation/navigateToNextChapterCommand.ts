import { debug, DEBUG_PREFIX, getDraftsFolderName, MARKDOWN_FILE_EXTENSION } from "@/core/utils";
import type { WriteAidManager } from "@/manager";
import { Notice } from "obsidian";

export function navigateToNextChapterCommand(manager: WriteAidManager) {
  return async () => {
    const activeFile = manager.app.workspace.getActiveFile();
    if (!activeFile) {
      new Notice("No file is currently open.");
      return;
    }

    const path = activeFile.path;
    const draftsFolderName = getDraftsFolderName(manager.settings);
    const match = path.match(new RegExp(`^(.+)/${draftsFolderName}/(.+)/(.+)\\${MARKDOWN_FILE_EXTENSION}$`));
    if (!match) {
      new Notice("The current file is not a chapter.");
      return;
    }

    const projectPath = match[1];
    const draftName = match[2];
    const chapterFileName = match[3];

    try {
      const chapters = await manager.projectFileService.chapters.listChapters(
        projectPath,
        draftName,
      );
      const currentIndex = chapters.findIndex((ch) => ch.name === chapterFileName);
      if (currentIndex === -1) {
        new Notice("Unable to find the current chapter in the draft.");
        return;
      }

      if (currentIndex >= chapters.length - 1) {
        return;
      }

      const nextChapter = chapters[currentIndex + 1];
      await manager.openChapter(projectPath, draftName, nextChapter.name);
    } catch (error) {
      debug(`${DEBUG_PREFIX} Failed to navigate to next chapter:`, error);
      new Notice("Failed to navigate to next chapter.");
    }
  };
}
