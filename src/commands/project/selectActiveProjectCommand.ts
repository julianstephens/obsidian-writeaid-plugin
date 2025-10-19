import { debug, DEBUG_PREFIX } from "@/core/utils";
import type { WriteAidManager } from "@/manager";

/**
 * Creates a command that prompts the user to select an active project from available projects.
 * @param manager - The WriteAid manager instance containing project selection methods
 * @returns A function that executes the select active project prompt
 */
export function selectActiveProjectCommand(manager: WriteAidManager) {
  return () => {
    debug(`${DEBUG_PREFIX} Select active project command called`);
    return manager.selectActiveProjectPrompt();
  };
}
