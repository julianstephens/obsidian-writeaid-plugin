import { debug, DEBUG_PREFIX } from "@/core/utils";
import type { WriteAidManager } from "@/manager";

/**
 * Creates a command that prompts the user to update the metadata for the currently active project.
 * @param manager - The WriteAid manager instance containing project metadata update methods
 * @returns A function that executes the update project metadata prompt
 */
export function updateProjectMetadataCommand(manager: WriteAidManager) {
  return () => {
    debug(`${DEBUG_PREFIX} Update project metadata command called`);
    return manager.updateProjectMetadataPrompt();
  };
}
