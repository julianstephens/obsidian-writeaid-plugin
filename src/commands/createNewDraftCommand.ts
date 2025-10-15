import type { WriteAidManager } from "@/manager";

export function createNewDraftCommand(manager: WriteAidManager) {
  return () => manager.createNewDraftPrompt();
}
