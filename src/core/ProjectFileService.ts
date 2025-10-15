import { App } from "obsidian";
import { ChapterFileService } from "./ChapterFileService";
import { DraftFileService } from "./DraftFileService";
import { ProjectService } from "./ProjectService";

export class ProjectFileService {
  drafts: DraftFileService;
  chapters: ChapterFileService;

  constructor(app: App, projectService: ProjectService) {
    this.chapters = new ChapterFileService(app);
    this.drafts = new DraftFileService(app, this.chapters, projectService);
  }
}
