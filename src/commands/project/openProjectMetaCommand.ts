import { debug, DEBUG_PREFIX, getMetaFileName } from "@/core/utils";
import type { WriteAidManager } from "@/manager";
import { Notice, TFile } from "obsidian";

/**
 * Creates a command that opens the project metadata file for the currently active project.
 * @param manager - The WriteAid manager instance containing active project information
 * @returns An async function that executes the open project meta command
 */
export function openProjectMetaCommand(manager: WriteAidManager) {
  return async () => {
    const activeProjectPath = manager.activeProject;

    debug(`${DEBUG_PREFIX} Open project meta command called`);

    if (!activeProjectPath) {
      new Notice("No active project.");
      return;
    }

    try {
      const metaFileName = getMetaFileName(manager.settings);
      const metaFilePath = `${activeProjectPath}/${metaFileName}`;

      const metaFile = manager.app.vault.getAbstractFileByPath(metaFilePath);
      if (!metaFile || !(metaFile instanceof TFile)) {
        new Notice(`Meta file not found: ${metaFileName}`);
        return;
      }

      // Open the meta file in the editor
      const leaf = manager.app.workspace.getLeaf();
      await leaf?.openFile(metaFile);
      debug(`${DEBUG_PREFIX} Opened project meta file: ${metaFilePath}`);
    } catch (error) {
      debug(`${DEBUG_PREFIX} Error opening project meta file:`, error);
      new Notice("Failed to open project meta file.");
    }
  };
}
