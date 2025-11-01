import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TestVaultManager } from "../stubs";
import { DraftFileService } from "@/core/DraftFileService";
import { ProjectService } from "@/core/ProjectService";
import { ChapterFileService } from "@/core/ChapterFileService";
import { BackupService } from "@/core/BackupService";
import { countWords, FRONTMATTER_REGEX } from "@/core/utils";
import { TFile } from "obsidian";
import * as path from "path";

describe("DraftFileService Integration", () => {
  let vaultManager: TestVaultManager;
  let draftService: DraftFileService;
  let projectPath: string;

  beforeEach(async () => {
    const templatePath = path.resolve(__dirname, "../fixtures/test-vault-template");
    vaultManager = new TestVaultManager();
    const app = await vaultManager.createTempVault(templatePath);

    const projectService = new ProjectService(app);
    const chapterService = new ChapterFileService(app);
    const backupService = new BackupService(app);

    draftService = new DraftFileService(app, chapterService, projectService, backupService);

    // Create a test project
    projectPath =
      (await projectService.createProject("Test Project", true, "Draft 1", undefined, undefined)) ||
      "";
  });

  afterEach(async () => {
    await vaultManager.cleanup();
  });

  describe("calculateDraftWordCount", () => {
    it("should calculate word count for single-file draft", async () => {
      const app = vaultManager.getApp()!;
      const draftName = "Draft 1";
      const draftPath = `${projectPath}/drafts/${draftName}`;

      // Create a draft file with content
      const draftFile = `${draftPath}/draft1.md`;
      const content = `---
draft_id: test-id
draft_name: Draft 1
project_id: test-project
word_count: 0
last_updated: 2024-01-01T00:00:00.000Z
---

This is a test draft with some content.
It has multiple lines to count.
Let's make sure the word count is accurate.`;

      await app.vault.create(draftFile, content);

      // Calculate word count
      const wordCount = await draftService.calculateDraftWordCount(projectPath, draftName);

      // Body has: "This is a test draft with some content. It has multiple lines to count. Let's make sure the word count is accurate."
      // That's about 25 words
      expect(wordCount).toBeGreaterThan(20);
      expect(wordCount).toBeLessThan(30);
    });

    it("should calculate total word count for multi-file draft", async () => {
      const app = vaultManager.getApp()!;
      const draftName = "Draft 2";
      const draftPath = `${projectPath}/drafts/${draftName}`;

      await app.vault.createFolder(draftPath);

      // Create multiple chapter files
      const chapter1 = `${draftPath}/chapter1.md`;
      const chapter2 = `${draftPath}/chapter2.md`;

      await app.vault.create(
        chapter1,
        `---
chapter_id: ch-1
order: 1
chapter_name: Chapter One
draft_id: draft-2
word_count: 0
last_updated: 2024-01-01T00:00:00.000Z
---

First chapter content here.`,
      );

      await app.vault.create(
        chapter2,
        `---
chapter_id: ch-2
order: 2
chapter_name: Chapter Two
draft_id: draft-2
word_count: 0
last_updated: 2024-01-01T00:00:00.000Z
---

Second chapter with more words for testing.`,
      );

      const wordCount = await draftService.calculateDraftWordCount(projectPath, draftName);

      // Total: "First chapter content here." (4) + "Second chapter with more words for testing." (7) = 11
      expect(wordCount).toBe(11);
    });

    it("should exclude frontmatter from word count", async () => {
      const app = vaultManager.getApp()!;
      const draftName = "Draft 3";
      const draftPath = `${projectPath}/drafts/${draftName}`;

      await app.vault.createFolder(draftPath);

      const draftFile = `${draftPath}/draft3.md`;
      const content = `---
draft_id: test-id
draft_name: Draft 3
project_id: test-project
word_count: 999
last_updated: 2024-01-01T00:00:00.000Z
extra_field: This should not be counted in word count
another_field: More text that should not count
---

Only these five words count.`;

      await app.vault.create(draftFile, content);

      const wordCount = await draftService.calculateDraftWordCount(projectPath, draftName);
      expect(wordCount).toBe(5);
    });
  });

  describe("createDraft", () => {
    it("should create a new draft folder with frontmatter", async () => {
      const app = vaultManager.getApp()!;
      const draftName = "New Test Draft";

      await draftService.createDraft(draftName, undefined, projectPath);

      // Verify draft folder exists
      const draftFolder = app.vault.getAbstractFileByPath(`${projectPath}/drafts/${draftName}`);
      expect(draftFolder).not.toBeNull();
    });
  });

  describe("deleteDraft", () => {
    it("should delete draft folder", async () => {
      const app = vaultManager.getApp()!;
      const draftName = "Draft To Delete";

      // Create a draft first
      await draftService.createDraft(draftName, undefined, projectPath);

      let draftFolder = app.vault.getAbstractFileByPath(`${projectPath}/drafts/${draftName}`);
      expect(draftFolder).not.toBeNull();

      // Delete the draft (without backup)
      await draftService.deleteDraft(draftName, false, projectPath);

      // Refresh cache to reflect deletion
      await app.vault.refreshCache();

      // Verify it's deleted
      draftFolder = app.vault.getAbstractFileByPath(`${projectPath}/drafts/${draftName}`);
      expect(draftFolder).toBeNull();
    });
  });
});
