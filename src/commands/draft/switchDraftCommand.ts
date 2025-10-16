import type { WriteAidManager } from "@/manager";

export function switchDraftCommand(manager: WriteAidManager) {
  return () => manager.switchDraftPrompt();
}
