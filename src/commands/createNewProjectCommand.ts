import type { WriteAidManager } from "../manager";

export function createNewProjectCommand(manager: WriteAidManager) {
  return () => manager.createNewProjectPrompt();
}
