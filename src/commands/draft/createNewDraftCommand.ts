import { debug, DEBUG_PREFIX } from "@/core/utils";
import type { WriteAidManager } from "@/manager";

export function createNewDraftCommand(manager: WriteAidManager) {
  return () => {
    debug(`${DEBUG_PREFIX} Create new draft command called`);
    return manager.createNewDraftPrompt();
  };
}
