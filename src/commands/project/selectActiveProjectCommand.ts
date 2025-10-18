import { debug, DEBUG_PREFIX } from "@/core/utils";
import type { WriteAidManager } from "@/manager";

export function selectActiveProjectCommand(manager: WriteAidManager) {
  return () => {
    debug(`${DEBUG_PREFIX} Select active project command called`);
    return manager.selectActiveProjectPrompt();
  };
}
