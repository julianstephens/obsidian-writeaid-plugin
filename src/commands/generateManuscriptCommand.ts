import type { WriteAidManager } from "@/manager";
import { Notice } from "obsidian";

export function generateManuscriptCommand(manager: WriteAidManager) {
  return async () => {
    const draftService = manager.draftService;
    const activeProjectPath = manager.activeProject;
    const activeDraftName = manager.activeDraft;

    if (!activeProjectPath || !activeDraftName) {
      new Notice("No active project or draft found.");
      return;
    }

    const success = await draftService.generateManuscript(
      activeProjectPath,
      activeDraftName,
      manager.settings,
    );

    if (success) {
      new Notice("Manuscript generated successfully.");
    } else {
      new Notice("Failed to generate manuscript.");
    }
  };
}
