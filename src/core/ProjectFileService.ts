import type { WriteAidSettings } from "@/types";
import { App } from "obsidian";
import { BackupService } from "./BackupService";
import { ChapterFileService } from "./ChapterFileService";
import { DraftFileService } from "./DraftFileService";
import { ProjectService } from "./ProjectService";

export class ProjectFileService {
  drafts: DraftFileService;
  chapters: ChapterFileService;
  backups: BackupService;

  constructor(app: App, projectService: ProjectService, settings?: WriteAidSettings) {
    this.chapters = new ChapterFileService(app);
    this.backups = new BackupService(app, settings);
    this.drafts = new DraftFileService(app, this.chapters, projectService, this.backups);
  }
}
