import type { WriteAidManager } from "../manager";

export function convertIndexToPlanningCommand(manager: WriteAidManager) {
  return () => manager.convertIndexToPlanningPrompt();
}
