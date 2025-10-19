import { debug, DEBUG_PREFIX } from "@/core/utils";
import type { WriteAidManager } from "@/manager";

/**
 * Creates a command that prompts the user to switch to a different draft in the active project.
 * @param manager - The WriteAid manager instance containing draft management methods
 * @returns A function that executes the switch draft prompt
 */
export function switchDraftCommand(manager: WriteAidManager) {
  return () => {
    debug(`${DEBUG_PREFIX} Switch draft command called`);
    return manager.switchDraftPrompt();
  };
}
