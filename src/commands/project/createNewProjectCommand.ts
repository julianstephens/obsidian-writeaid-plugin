import { debug, DEBUG_PREFIX } from "@/core/utils";
import type { WriteAidManager } from "@/manager";

export function createNewProjectCommand(manager: WriteAidManager) {
  return () => {
    debug(`${DEBUG_PREFIX} Create new project command called`);
    return manager.createNewProjectPrompt();
  };
}
