import { DEBUG_PREFIX, debug } from "@/core/utils";
import type { WriteAidManager } from "@/manager";
import { Notice } from "obsidian";

export async function createOutlineCommand(manager: WriteAidManager): Promise<void> {
  debug(`${DEBUG_PREFIX} createOutlineCommand called`);

  try {
    const activeProjectPath = manager.activeProject;
    const activeDraftName = manager.activeDraft;

    if (!activeProjectPath || !activeDraftName) {
      new Notice("No active project or draft selected. Please select a project and draft first.");
      return;
    }

    // Check if outline already exists
    const outlineFile = manager.projectFileService.drafts.getOutlineFile(
      activeProjectPath,
      activeDraftName,
    );
    if (outlineFile) {
      new Notice(`Outline file already exists: ${outlineFile.path}`);
      return;
    }

    // Create the outline using the outline template
    await manager.projectFileService.drafts.createOutline(
      activeProjectPath,
      activeDraftName,
      manager.settings!.outlineTemplate,
    );

    new Notice(`Outline created for draft: ${activeDraftName}`);
    debug(`${DEBUG_PREFIX} Outline created successfully for draft: ${activeDraftName}`);
  } catch (error) {
    debug(`${DEBUG_PREFIX} Error creating outline:`, error);
    new Notice(`Failed to create outline: ${(error as Error).message}`);
  }
}
