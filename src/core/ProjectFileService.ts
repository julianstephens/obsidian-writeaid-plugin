import { App } from "obsidian";
import { ChapterFileService } from "./ChapterFileService";
import { DraftFileService } from "./DraftFileService";

export class ProjectFileService {
  drafts: DraftFileService;
  chapters: ChapterFileService;

  constructor(app: App) {
    this.chapters = new ChapterFileService(app);
    this.drafts = new DraftFileService(app, this.chapters);
  }
}
