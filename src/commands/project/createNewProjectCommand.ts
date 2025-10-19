import { debug, DEBUG_PREFIX } from "@/core/utils";
import type { WriteAidManager } from "@/manager";

/**
 * Creates a command that prompts the user to create a new project.
 * @param manager - The WriteAid manager instance containing project management methods
 * @returns A function that executes the create new project prompt
 */
export function createNewProjectCommand(manager: WriteAidManager) {
  return () => {
    debug(`${DEBUG_PREFIX} Create new project command called`);
    return manager.createNewProjectPrompt();
  };
}
