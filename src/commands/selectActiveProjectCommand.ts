import type { WriteAidManager } from "@/manager";

export function selectActiveProjectCommand(manager: WriteAidManager) {
  return () => manager.selectActiveProjectPrompt();
}
