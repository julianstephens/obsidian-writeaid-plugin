import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TestVaultManager } from "../stubs";
import { ProjectService } from "@/core/ProjectService";
import { readMetaFile } from "@/core/meta";
import * as path from "path";

describe("ProjectService Integration", () => {
  let vaultManager: TestVaultManager;
  let projectService: ProjectService;

  beforeEach(async () => {
    const templatePath = path.resolve(__dirname, "../fixtures/test-vault-template");
    vaultManager = new TestVaultManager();
    const app = await vaultManager.createTempVault(templatePath);
    projectService = new ProjectService(app);
  });

  afterEach(async () => {
    await vaultManager.cleanup();
  });

  describe("createProject", () => {
    it("should create a single-file project with correct metadata", async () => {
      const app = vaultManager.getApp()!;
      const projectName = "Test Single Project";
      const description = "A test single-file project";

      const projectPath = await projectService.createProject(
        projectName,
        true, // single-file
        "Draft 1",
        undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { defaultSingleTargetWordCount: 20000 } as any,
        description,
      );

      expect(projectPath).toBe(projectName);

      // Verify folder structure
      const projectFolder = app.vault.getAbstractFileByPath(projectPath!);
      expect(projectFolder).not.toBeNull();

      const draftsFolder = app.vault.getAbstractFileByPath(`${projectPath}/drafts`);
      expect(draftsFolder).not.toBeNull();

      // Verify meta.md exists and has correct fields
      const metaPath = `${projectPath}/meta.md`;
      const metadata = await readMetaFile(app, metaPath);

      expect(metadata).not.toBeNull();
      expect(metadata!.project_name).toBe(projectName);
      expect(metadata!.description).toBe(description);
      expect(metadata!.project_type).toBe("single-file");
      expect(metadata!.target_word_count).toBe(20000);
      expect(metadata!.total_drafts).toBeGreaterThanOrEqual(1);
      expect(metadata!.project_id).toBeDefined();
      expect(metadata!.date_created).toBeDefined();
      expect(metadata!.date_updated).toBeDefined();
    });

    it("should create a multi-file project with correct metadata", async () => {
      const app = vaultManager.getApp()!;
      const projectName = "Test Multi Project";
      const description = "A test multi-file project";

      const projectPath = await projectService.createProject(
        projectName,
        false, // multi-file
        "Draft 1",
        undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { defaultMultiTargetWordCount: 50000 } as any,
        description,
      );

      expect(projectPath).toBe(projectName);

      // Verify meta.md with multi-file settings
      const metaPath = `${projectPath}/meta.md`;
      const metadata = await readMetaFile(app, metaPath);

      expect(metadata).not.toBeNull();
      expect(metadata!.project_name).toBe(projectName);
      expect(metadata!.description).toBe(description);
      expect(metadata!.project_type).toBe("multi-file");
      expect(metadata!.target_word_count).toBe(50000);
      expect(metadata!.total_drafts).toBeGreaterThanOrEqual(1);
    });

    it("should create project in parent folder when specified", async () => {
      const app = vaultManager.getApp()!;
      const projectName = "Nested Project";
      const parentFolder = "Projects";

      // Create parent folder first
      await app.vault.createFolder(parentFolder);

      const projectPath = await projectService.createProject(
        projectName,
        true,
        "Draft 1",
        parentFolder,
        undefined,
        "Nested test project",
      );

      expect(projectPath).toBe(`${parentFolder}/${projectName}`);

      const projectFolder = app.vault.getAbstractFileByPath(projectPath!);
      expect(projectFolder).not.toBeNull();
    });

    it("should initialize with Draft 1 folder", async () => {
      const app = vaultManager.getApp()!;
      const projectName = "Draft Init Project";

      const projectPath = await projectService.createProject(
        projectName,
        true,
        "Draft 1",
        undefined,
        undefined,
        undefined,
      );

      // Check that Draft 1 folder was created
      const draft1Folder = app.vault.getAbstractFileByPath(`${projectPath}/drafts/Draft 1`);
      expect(draft1Folder).not.toBeNull();
    });
  });
});
