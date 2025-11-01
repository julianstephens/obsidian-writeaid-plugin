import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TestVaultManager } from "../stubs";
import { updateMetaStats, readMetaFile, writeMetaFile } from "@/core/meta";
import { ProjectService } from "@/core/ProjectService";
import { TFile } from "obsidian";
import * as path from "path";

describe("meta.ts Integration", () => {
  let vaultManager: TestVaultManager;
  let projectPath: string;

  beforeEach(async () => {
    const templatePath = path.resolve(__dirname, "../fixtures/test-vault-template");
    vaultManager = new TestVaultManager();
    const app = await vaultManager.createTempVault(templatePath);

    const projectService = new ProjectService(app);
    projectPath =
      (await projectService.createProject("Test Project", false, "Draft 1", undefined, undefined)) ||
      "";
  });

  afterEach(async () => {
    await vaultManager.cleanup();
  });

  describe("updateMetaStats", () => {
    it("should update word counts and timestamps for all files in drafts", async () => {
      const app = vaultManager.getApp()!;

      // Create a draft with a chapter file
      const draftPath = `${projectPath}/drafts/Draft 1`;
      const chapterFile = `${draftPath}/chapter1.md`;

      const initialContent = `---
chapter_id: ch-1
order: 1
chapter_name: Chapter One
draft_id: draft-1
word_count: 0
last_updated: 2024-01-01T00:00:00.000Z
---

This is chapter one with ten words in it.`;

      await app.vault.create(chapterFile, initialContent);

      // Update meta stats
      await updateMetaStats(app, projectPath, "Draft 1");

      // Read the chapter file and check updated fields
      const file = app.vault.getAbstractFileByPath(chapterFile) as TFile;
      const updatedContent = await app.vault.read(file);

      expect(updatedContent).toContain("word_count: 10");
      expect(updatedContent).not.toContain("last_updated: 2024-01-01T00:00:00.000Z");
      expect(updatedContent).toContain("last_updated:");
    });

    it("should update total_chapters for active draft", async () => {
      const app = vaultManager.getApp()!;

      // Create multiple chapter files in active draft
      const draftPath = `${projectPath}/drafts/Draft 1`;

      for (let i = 1; i <= 3; i++) {
        const chapterFile = `${draftPath}/chapter${i}.md`;
        await app.vault.create(
          chapterFile,
          `---
chapter_id: ch-${i}
order: ${i}
chapter_name: Chapter ${i}
draft_id: draft-1
word_count: 0
last_updated: 2024-01-01T00:00:00.000Z
---

Chapter ${i} content.`,
        );
      }

      // Update meta stats with active draft
      await updateMetaStats(app, projectPath, "Draft 1");

      // Read meta.md and verify total_chapters
      const metadata = await readMetaFile(app, `${projectPath}/meta.md`);
      expect(metadata).not.toBeNull();
      expect(metadata!.total_chapters).toBe(3);
    });

    it("should update total_drafts count", async () => {
      const app = vaultManager.getApp()!;

      // Create additional draft folders
      await app.vault.createFolder(`${projectPath}/drafts/Draft 2`);
      await app.vault.createFolder(`${projectPath}/drafts/Draft 3`);

      await updateMetaStats(app, projectPath);

      const metadata = await readMetaFile(app, `${projectPath}/meta.md`);
      expect(metadata).not.toBeNull();
      expect(metadata!.total_drafts).toBe(3);
    });

    it("should generate Project Files section with wiki-links", async () => {
      const app = vaultManager.getApp()!;

      // Create some files in the project
      const draftPath = `${projectPath}/drafts/Draft 1`;
      await app.vault.create(`${draftPath}/draft1.md`, "Draft content");
      await app.vault.create(`${projectPath}/notes.md`, "Notes content");

      await updateMetaStats(app, projectPath, "Draft 1");

      // Read the meta file content
      const metaFile = app.vault.getAbstractFileByPath(`${projectPath}/meta.md`) as TFile;
      const content = await app.vault.read(metaFile);

      // Check for Project Files section
      expect(content).toContain("## Project Files");

      // Check for wiki-links (should contain at least some files)
      expect(content).toMatch(/\[\[.*\]\]/);
    });

    it("should update date_updated timestamp", async () => {
      const app = vaultManager.getApp()!;

      const initialMeta = await readMetaFile(app, `${projectPath}/meta.md`);
      const initialDateUpdated = initialMeta?.date_updated;

      // Wait a bit and update
      await new Promise((resolve) => setTimeout(resolve, 10));
      await updateMetaStats(app, projectPath);

      const updatedMeta = await readMetaFile(app, `${projectPath}/meta.md`);
      expect(updatedMeta?.date_updated).not.toBe(initialDateUpdated);
    });
  });

  describe("readMetaFile and writeMetaFile", () => {
    it("should round-trip metadata correctly", async () => {
      const app = vaultManager.getApp()!;

      const testMetadata = {
        version: "1.0.0",
        project_id: "test-123",
        project_name: "Round Trip Test",
        description: "Testing read/write",
        total_drafts: 5,
        target_word_count: 75000,
        total_chapters: 10,
      };

      const metaPath = `${projectPath}/meta.md`;
      await writeMetaFile(app, metaPath, testMetadata);

      const readBack = await readMetaFile(app, metaPath);

      expect(readBack).not.toBeNull();
      expect(readBack!.version).toBe(testMetadata.version);
      expect(readBack!.project_id).toBe(testMetadata.project_id);
      expect(readBack!.project_name).toBe(testMetadata.project_name);
      expect(readBack!.description).toBe(testMetadata.description);
      expect(readBack!.total_drafts).toBe(testMetadata.total_drafts);
      expect(readBack!.target_word_count).toBe(testMetadata.target_word_count);
      expect(readBack!.total_chapters).toBe(testMetadata.total_chapters);
    });
  });
});
