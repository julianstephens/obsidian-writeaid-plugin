import { debug, DEBUG_PREFIX } from "@/core/utils";
import type { WriteAidManager } from "@/manager";

export function switchDraftCommand(manager: WriteAidManager) {
  return () => {
    debug(`${DEBUG_PREFIX} Switch draft command called`);
    return manager.switchDraftPrompt();
  };
}
