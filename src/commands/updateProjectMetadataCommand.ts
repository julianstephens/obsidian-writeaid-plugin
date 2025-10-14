import type { WriteAidManager } from "../manager";

export function updateProjectMetadataCommand(manager: WriteAidManager) {
  return () => manager.updateProjectMetadataPrompt();
}
