import { debug, DEBUG_PREFIX } from "@/core/utils";
import type { WriteAidManager } from "@/manager";

/**
 * Creates a command that prompts the user to create a new draft in the active project.
 * @param manager - The WriteAid manager instance containing project and draft management methods
 * @returns A function that executes the create new draft prompt
 */
export function createNewDraftCommand(manager: WriteAidManager) {
  return () => {
    debug(`${DEBUG_PREFIX} Create new draft command called`);
    return manager.createNewDraftPrompt();
  };
}
