import { debug, DEBUG_PREFIX } from "@/core/utils";
import type { WriteAidManager } from "@/manager";

export function updateProjectMetadataCommand(manager: WriteAidManager) {
  return () => {
    debug(`${DEBUG_PREFIX} Update project metadata command called`);
    return manager.updateProjectMetadataPrompt();
  };
}
