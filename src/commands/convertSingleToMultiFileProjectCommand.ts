import { readMetaFile, writeMetaFile } from "@/core/meta";
import { getDraftsFolderName, PROJECT_TYPE, slugifyDraftName } from "@/core/utils";
import type { WriteAidSettings } from "@/types";
import { Notice, TFile, TFolder, type App } from "obsidian";

async function convertSingleToMultiFileProject(
  app: App,
  projectPath: string,
  settings?: WriteAidSettings,
) {
  const metaPath = `${projectPath}/meta.md`;
  const meta = await readMetaFile(app, metaPath);
  if (!meta || meta.project_type !== PROJECT_TYPE.SINGLE) {
    new Notice(`Project is not a ${PROJECT_TYPE.SINGLE} project.`);
    return false;
  }

  meta.project_type = PROJECT_TYPE.MULTI;
  await writeMetaFile(app, metaPath, meta);

  // Rename all draft files in Drafts/*/ to 'Chapter 1.md'
  const draftsFolderName = getDraftsFolderName(settings);
  const draftsFolder = app.vault.getAbstractFileByPath(`${projectPath}/${draftsFolderName}`);
  if (!draftsFolder || !(draftsFolder instanceof TFolder)) {
    new Notice("Drafts folder not found.");
    return false;
  }
  let renamed = false;
  for (const draftFolder of draftsFolder.children) {
    if (draftFolder instanceof TFolder) {
      // The main draft file should be <slug>.md where slug is the folder name slugified
      const slug = slugifyDraftName(draftFolder.name);
      const mainDraftFile = draftFolder.children.find(
        (f) => f instanceof TFile && f.name === `${slug}.md`,
      );
      if (mainDraftFile) {
        const newPath = `${draftFolder.path}/Chapter 1.md`;
        if (mainDraftFile.path !== newPath) {
          const content = await app.vault.read(mainDraftFile as TFile);
          await app.vault.create(newPath, content);
          await app.vault.delete(mainDraftFile);
          renamed = true;
        }
      }
    }
  }
  if (renamed) {
    new Notice('Converted to multi-file project. Draft files renamed to "Chapter 1.md".');
  } else {
    new Notice("Converted to multi-file project. No draft files needed renaming.");
  }
  return true;
}

export async function convertSingleToMultiFileProjectCommand(
  app: App,
  projectPath: string | undefined,
  settings?: WriteAidSettings,
) {
  if (!projectPath) {
    new Notice("No active project selected.");
    return;
  }
  await convertSingleToMultiFileProject(app, projectPath, settings);
}
