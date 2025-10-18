<script lang="ts">
  import { readMetaFile } from "@/core/meta";
  import type { ProjectFileService } from "@/core/ProjectFileService";
  import type { ProjectService } from "@/core/ProjectService";
  import {
    APP_NAME,
    asyncFilter,
    debug,
    DEBUG_PREFIX,
    getMetaFileName,
    suppress,
  } from "@/core/utils";
  import type { WriteAidManager } from "@/manager";
  import type { Chapter } from "@/types";
  import BaseButton from "@/ui/components/BaseButton.svelte";
  import IconButton from "@/ui/components/IconButton.svelte";
  import Select from "@/ui/components/Select.svelte";
  import { ConfirmDeleteModal } from "@/ui/modals/ConfirmDeleteModal";
  import { DuplicateDraftModal } from "@/ui/modals/DuplicateDraftModal";
  import { RenameChapterModal } from "@/ui/modals/RenameChapterModal";
  import { RenameDraftModal } from "@/ui/modals/RenameDraftModal";
  import {
    ArrowDown,
    ArrowUp,
    BookOpenCheck,
    Copy,
    Eye,
    Pencil,
    RotateCcw,
    Trash,
  } from "lucide-svelte";
  import { Notice } from "obsidian";
  import { onDestroy } from "svelte";
  import { flip } from "svelte/animate";
  import { cubicOut } from "svelte/easing";

  // Props passed from parent ItemView - Svelte 4 style
  export let manager: WriteAidManager;
  export let projectService: ProjectService;
  export let projectFileService: ProjectFileService;

  // Local UI state
  let activeProject: string | null = null;
  let projects: string[] = [];
  let selected: any = undefined;
  let selectedValue: string | null = null;
  let drafts: string[] = [];
  let loadingProjects = false;
  let projectOptions: Array<{ value: string; label: string }> = [];
  let disabled = false;
  let loadingDrafts = false;
  let showCreateInline = false;
  let newDraftName = "";
  let copyFromSelected: any = undefined;
  let copyFrom = "";
  let draftMeta: any = {};
  let sortAsc = true;
  let activeDraft: string | null = null;
  let activeProjectListener: ((p: string | null) => void) | null = null;
  const ICON_SIZE = 20;

  // Chapter management state
  let chapters: Array<Chapter> = [];
  let loadingChapters = false;
  let showCreateChapter = false;
  let newChapterName = "";
  let newChapterNameValue = "";
  let isMultiFileProject = false;
  let initialized = false;

  // Initialize on component mount - use reactive to trigger on prop availability
  $: if (manager && projectService && projectFileService && !initialized) {
    initialized = true;
    debug(`${DEBUG_PREFIX} ProjectPanel initializing with manager`);
    activeDraft = manager.activeDraft ?? null;
    activeProject = manager.activeProject ?? null;

    const activeDraftListener = (draft: string | null) => {
      activeDraft = draft;
      debug(`${DEBUG_PREFIX} active draft updated -> ${draft}`);
      // Refresh chapters when active draft changes
      refreshChapters();
    };
    manager.addActiveDraftListener(activeDraftListener);

    activeProjectListener = (project: string | null) => {
      activeProject = project;
      debug(`${DEBUG_PREFIX} active project updated -> ${project}`);
      // Refresh everything when active project changes
      if (project) {
        refresh();
      } else {
        // Clear state when no project is active
        selected = undefined;
        selectedValue = null;
        drafts = [];
        chapters = [];
        isMultiFileProject = false;
      }
    };
    manager.addActiveProjectListener(activeProjectListener);

    // Load initial data
    refresh();
  }

  // Cleanup on destroy
  onDestroy(() => {
    try {
      if (manager && activeProjectListener) {
        manager.removeActiveProjectListener(activeProjectListener);
      }
    } catch (e) {
      // ignore
    }
  });

  // Load all projects and update UI
  async function refresh(showNotifications = false): Promise<string[]> {
    if (!projectService) return []; // Guard against null props

    loadingProjects = true;
    const minSpin = new Promise((resolve) => setTimeout(resolve, 400));
    const prevProjects = [...projects];
    const prevActive = activeProject;
    let allFolders: string[] = [];
    let newProjects: string[] = [];
    try {
      allFolders = projectService.listAllFolders();
      // Filter only valid project folders
      newProjects = [];
      for (const p of allFolders) {
        if (await projectService.isProjectFolder(p)) newProjects.push(p);
      }
    } catch (e) {
      newProjects = [];
    }
    // Notify if projects were added or removed (only if showNotifications)
    const added = newProjects.filter((p) => !prevProjects.includes(p));
    const removed = prevProjects.filter((p) => !newProjects.includes(p));
    if (showNotifications && added.length > 0) {
      new Notice(`${added.length} new project${added.length > 1 ? "s" : ""} discovered.`);
    }
    if (showNotifications && removed.length > 0) {
      new Notice(`${removed.length} project${removed.length > 1 ? "s" : ""} removed.`);
    }
    projects = newProjects;
    projectOptions = newProjects.map((p) => ({ value: p, label: p }));

    // If there are no projects, clear selection
    if (newProjects.length === 0) {
      activeProject = null;
      selected = undefined;
      selectedValue = null;
    } else if (newProjects.length === 1) {
      // If only one project exists, always set it as active
      activeProject = newProjects[0];
      selected = projectOptions[0];
      selectedValue = newProjects[0];
      // Debug: log project selection
      try {
        debug(`${DEBUG_PREFIX} panel refresh selected single project '${selectedValue}'`);
      } catch (e) {
        // ignore
      }
    } else if (prevActive && !newProjects.includes(prevActive)) {
      // If the active project was removed, set the next available project as active
      activeProject = newProjects[0];
      selected = projectOptions[0];
      selectedValue = newProjects[0];
      // Debug: log fallback selection
      try {
        debug(`${DEBUG_PREFIX} panel refresh selected fallback project '${selectedValue}'`);
      } catch (e) {
        // ignore
      }
    } else {
      // Otherwise, keep the current selection ONLY if it still exists
      const found = projectOptions.find((o) => o.value === prevActive);
      if (found) {
        activeProject = prevActive;
        selected = found;
        selectedValue = found.value;
        try {
          debug(`${DEBUG_PREFIX} panel refresh kept project '${selectedValue}'`);
        } catch (e) {
          // ignore
        }
      } else {
        activeProject = null;
        selected = undefined;
        selectedValue = null;
      }
    }

    await minSpin;
    loadingProjects = false;
    // Optionally, refresh drafts for the selected project
    if (selectedValue) await refreshDrafts();
    return newProjects;
  }

  // Refresh drafts list for the selected project
  async function refreshDrafts() {
    if (!projectFileService || !selectedValue) {
      drafts = [];
      return;
    }
    const previousActiveDraft = activeDraft;
    loadingDrafts = true;
    const minSpin = new Promise((resolve) => setTimeout(resolve, 400));
    try {
      // Use the new projectFileService for listing drafts
      drafts = projectFileService.drafts.listDrafts(selectedValue) || [];
      // apply sort
      drafts = Array.from(drafts);
      drafts.sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
      if (!sortAsc) drafts.reverse();
      // Preserve the active draft - do not change it during refresh
      // activeDraft is controlled by manager listeners, not by this function
      try {
        debug(
          `${DEBUG_PREFIX} refreshDrafts: loaded ${drafts.length} drafts, preserving active draft: ${previousActiveDraft}`,
        );
      } catch (e) {
        // ignore debug errors
      }
    } catch (e) {
      drafts = [];
    } finally {
      await minSpin;
      loadingDrafts = false;
    }
  }

  // Refresh chapters (multi-file projects)
  async function refreshChapters() {
    if (!manager || !projectFileService) return;

    loadingChapters = true;
    const minSpin = new Promise((resolve) => setTimeout(resolve, 400));
    try {
      if (!selectedValue) {
        chapters = [];
        isMultiFileProject = false;
        return;
      }
      // Check project type
      const metaPath = `${selectedValue}/${getMetaFileName(manager?.settings)}`;
      const meta = await readMetaFile(manager.app, metaPath);
      isMultiFileProject = meta?.project_type === "multi-file";
      if (!isMultiFileProject) {
        chapters = [];
        return;
      }
      if (!manager?.activeDraft) {
        chapters = [];
        return;
      }
      // Use the new projectFileService for chapter listing
      let ch: Chapter[] = [];
      ch = await projectFileService.chapters.listChapters(selectedValue, manager.activeDraft);
      chapters = Array.isArray(ch) ? ch : [];
    } catch (e) {
      chapters = [];
      isMultiFileProject = false;
    } finally {
      await minSpin;
      loadingChapters = false;
    }
  }

  // Minimal action handlers used by the template
  async function createInlineDraft() {
    if (!manager || !selectedValue || !newDraftName.trim()) return;

    const draftName = newDraftName.trim();

    try {
      await manager.createNewDraft(draftName, copyFrom || undefined, selectedValue);
      // Update the local activeDraft to reflect the newly created active draft
      activeDraft = manager.activeDraft;
      new Notice(`Draft "${draftName}" created.`);
    } catch (e) {
      debug(`${DEBUG_PREFIX} Failed to create draft:`, e);
      new Notice("Failed to create draft.");
    }
    newDraftName = "";
    showCreateInline = false;
    await refreshDrafts();
  }

  async function createDraft() {
    // open full modal - keep simple fallback to inline creation
    showCreateInline = true;
  }

  async function openDraft(draftName) {
    if (!projectFileService || !manager || !selectedValue) return;
    // Prefer manager.setActiveDraft to change active draft
    // Use the new projectFileService for opening drafts
    let opened = false;
    opened = await projectFileService.drafts.openDraft(selectedValue, draftName);
    if (!opened) {
      if (manager?.setActiveDraft) await manager.setActiveDraft(draftName, selectedValue);
    }
    await refreshDrafts();
    await refreshChapters();
  }

  async function duplicateDraft(draftName) {
    if (!manager || !selectedValue) return;
    const suggestedName = `${draftName} Copy`;
    new DuplicateDraftModal(manager.app, {
      sourceDraftName: draftName,
      suggestedName,
      onSubmit: async (newName) => {
        if (!manager) return;
        try {
          await manager.createNewDraft(newName, draftName, selectedValue || undefined);
          await refreshDrafts();
          new Notice(`Draft '${newName}' created as duplicate of '${draftName}'.`);
        } catch (e) {
          debug(`${DEBUG_PREFIX} Failed to duplicate draft:`, e);
          new Notice("Failed to duplicate draft.");
        }
      },
    }).open();
  }

  async function renameDraft(draftName) {
    if (!manager || !selectedValue) return;

    const modal = new RenameDraftModal(manager.app, draftName, async (newName, renameFile) => {
      try {
        debug(`${DEBUG_PREFIX} renameDraft: user entered: ${newName}, renameFile: ${renameFile}`);
        await manager.renameDraft(draftName, newName, selectedValue || undefined, renameFile);
        debug(`${DEBUG_PREFIX} renameDraft: rename successful, refreshing drafts`);
        await refreshDrafts();
        new Notice(`Draft '${draftName}' renamed to '${newName}'.`);
      } catch (e) {
        debug(`${DEBUG_PREFIX} renameDraft: error:`, e);
        new Notice("Failed to rename draft.");
      }
    });
    modal.open();
  }

  async function deleteDraftHandler(draftName) {
    if (!manager || !selectedValue) return;
    const modal = new ConfirmDeleteModal(
      manager.app,
      draftName,
      async () => {
        if (!manager) return;
        await manager.deleteDraft(draftName, selectedValue || undefined);
        await refreshDrafts();
      },
      "draft",
    );
    modal.open();
  }

  // Ensure project activation always updates manager and UI
  async function activate(projectPath) {
    if (!projectPath) return;
    if (manager?.setActiveProject) await manager.setActiveProject(projectPath);
    activeProject = projectPath;
    selectedValue = projectPath;
    activeDraft = manager?.activeDraft ?? null;
    await refreshDrafts();
    await refreshChapters();
  }

  function handleDraftNameInput(e: any) {
    const t = e.target as HTMLInputElement;
    if (t) newDraftName = t.value;
  }

  function handleChapterNameInput(e: any) {
    const t = e.target as HTMLInputElement;
    if (t) newChapterName = t.value;
  }

  // Ensure the manager's activeProject matches the given path (used on startup)
  async function ensureManagerActive(projectPath) {
    if (!projectPath || !manager) return;
    try {
      if (manager.activeProject !== projectPath && typeof manager.setActiveProject === "function") {
        await manager.setActiveProject(projectPath);
      }
      // keep local state in sync
      activeProject = projectPath;
      selectedValue = projectPath;
      activeDraft = manager?.activeDraft ?? null;
      await refreshDrafts();
      await refreshChapters();
    } catch (e) {
      // ignore
    }
  }

  // Helper to reorder chapters
  async function reorderChaptersUp(i: number) {
    if (i === 0 || !manager || !selectedValue || !manager.activeDraft) return;
    const newOrder = chapters.slice();
    [newOrder[i - 1], newOrder[i]] = [newOrder[i], newOrder[i - 1]];
    const ordered = newOrder.map((ch, idx) => ({
      chapterName: ch.chapterName || "",
      order: idx + 1,
    }));
    await manager.reorderChapters(selectedValue, manager.activeDraft, ordered as any);
    await refreshChapters();
  }

  async function reorderChaptersDown(i: number) {
    if (i === chapters.length - 1 || !manager || !selectedValue || !manager.activeDraft) return;
    const newOrder = chapters.slice();
    [newOrder[i], newOrder[i + 1]] = [newOrder[i + 1], newOrder[i]];
    const ordered = newOrder.map((ch, idx) => ({
      chapterName: ch.chapterName || "",
      order: idx + 1,
    }));
    await manager.reorderChapters(selectedValue, manager.activeDraft, ordered as any);
    await refreshChapters();
  }

  async function openChapterHandler(chapterName: string) {
    if (!selectedValue || !manager?.activeDraft) return;
    await manager.openChapter(selectedValue, manager.activeDraft, chapterName);
  }

  function renameChapterHandler(chapterName: string) {
    if (!selectedValue || !manager?.activeDraft) return;
    const modal = new RenameChapterModal(manager.app, chapterName, async (newName) => {
      if (!manager?.activeDraft || !selectedValue) return;
      await manager.renameChapter(selectedValue, manager.activeDraft, chapterName, newName);
      await refreshChapters();
    });
    modal.open();
  }

  function deleteChapterHandler(chapterName: string) {
    const modal = new ConfirmDeleteModal(
      manager.app,
      chapterName,
      async () => {
        if (!manager?.activeDraft || !selectedValue) return;
        await manager.deleteChapter(selectedValue, manager.activeDraft, chapterName);
        await refreshChapters();
      },
      "chapter",
    );
    modal.open();
  }

  // Ensure draft activation always updates manager and UI
  async function setActiveDraft(draftName) {
    if (!selectedValue) return;
    if (manager?.setActiveDraft) await manager.setActiveDraft(draftName, selectedValue);
    activeDraft = manager?.activeDraft ?? null;
    await refreshDrafts();
    await refreshChapters();
  }

  // Handle opening the create project modal
  async function handleCreateProjectClick() {
    if (!manager || !projectService) return;
    const app = manager.app;
    const { CreateProjectModal } = await import("@/ui/modals/CreateProjectModal");
    let projectPath: string | null = null;
    const modal = new CreateProjectModal(app, async (projectName, singleFile, initialDraftName) => {
      if (!projectName || !manager || !projectService) return;

      // Check if a project with this name already exists
      const allFolders = manager.listAllFolders();
      const existingProjects = await asyncFilter(allFolders, (p) =>
        manager.projectService.isProjectFolder(p),
      );
      const projectNames = existingProjects.map((p) => p.split("/").pop() || p);
      if (projectNames.includes(projectName)) {
        new Notice(
          `A project with the name "${projectName}" already exists. Please choose a different name.`,
        );
        return;
      }

      projectPath = await projectService.createProject(
        projectName,
        singleFile,
        initialDraftName,
        undefined,
        manager.settings,
      );
      if (!projectPath) return;
      // Wait for the new project to appear in the list
      let newProjects: string[] = [];
      let newProject: string | null = null;
      for (let i = 0; i < 20; i++) {
        await new Promise((res) => setTimeout(res, 100));
        newProjects = await refresh();
        const found = newProjects.find((p) => p === projectPath);
        newProject = typeof found === "string" ? found : null;
        if (newProject) break;
      }
      if (typeof newProject === "string" && newProject) {
        activeProject = newProject;
        selected = { value: newProject, label: newProject };
        selectedValue = newProject;
        // Set the new draft as active using manager API (draftName, projectPath)
        if (manager.setActiveDraft) {
          await manager.setActiveDraft(initialDraftName ?? "Draft 1", newProject);
        }
        await refreshDrafts();
        await refreshChapters();
      }
    });
    modal.open();
  }

  // activeDraft listener placeholder (populated in onMount)
  let activeDraftListener: any | null = null;

  // Cleanup on destroy — must be called at component init time, not inside onMount
  onDestroy(() => {
    suppress(() => {
      if (
        manager &&
        typeof manager.removeActiveDraftListener === "function" &&
        activeDraftListener
      ) {
        manager.removeActiveDraftListener(activeDraftListener);
      }
    });
    suppress(() => {
      if (
        manager &&
        typeof manager.removeActiveProjectListener === "function" &&
        activeProjectListener
      ) {
        manager.removeActiveProjectListener(activeProjectListener);
      }
    });
  });
</script>

<div class="project-list wa-panel">
  <div class="wa-row justify-between">
    <div class="wa-title">{APP_NAME} Projects</div>
    <div>
      <IconButton
        ariaLabel="Refresh projects"
        clickHandler={() => refresh(true)}
        title={undefined}
        spinning={loadingProjects}
      >
        <RotateCcw />
      </IconButton>
    </div>
  </div>

  <div class="wa-row" style="margin: 18px 0 10px 0;">
    <BaseButton
      title="Create New Project"
      clickHandler={handleCreateProjectClick}
      variant="primary"
      style="width: 40%; margin: 0 auto;">New Project</BaseButton
    >
  </div>

  {#if projects.length === 0}
    <div class="wa-muted" style="margin: 4rem auto 0; font-size: 18px; width: fit-content;">
      No projects found.
    </div>
  {/if}
  {#if projects.length > 0}
    <div style="margin:20px 0;">
      <label for="wa-project-select">Select project</label>
      <div class="wa-row">
        <Select
          name="wa-project-select"
          value={selected}
          items={projectOptions}
          placeholder="Choose a project..."
          showChevron={true}
          {disabled}
          clearable={false}
          searchable={false}
          on:select={(e) => {
            const item = e.detail;
            selected = item;
            selectedValue = typeof item === "string" ? item : item ? item.value : undefined;
            activeProject = selectedValue ?? null;
            activate(selectedValue ?? null);
          }}
        />
      </div>
    </div>
  {/if}

  {#if selectedValue}
    <div class="draft-controls" style="margin-top:16px;">
      <div class="wa-panel-header">
        <div class="wa-row justify-between">
          <div class="wa-button-group">
            <div class="wa-title">Drafts</div>
            <IconButton
              ariaLabel="Toggle draft sort order"
              title={undefined}
              clickHandler={() => {
                sortAsc = !sortAsc;
                refreshDrafts();
              }}
            >
              {#if sortAsc}
                <ArrowUp />
              {:else}
                <ArrowDown />
              {/if}
            </IconButton>
          </div>
          <div class="wa-button-group">
            <BaseButton title="New draft" clickHandler={createDraft} variant="primary"
              >New Draft</BaseButton
            >
            <IconButton
              ariaLabel="Refresh drafts"
              title={undefined}
              clickHandler={refreshDrafts}
              disabled={loadingDrafts}
              spinning={loadingDrafts}
            >
              <RotateCcw />
            </IconButton>
          </div>
        </div>
      </div>
      {#if showCreateInline}
        <div class="create-inline wa-row">
          <input
            class="wa-create-draft-input"
            type="text"
            placeholder="Draft name"
            bind:value={newDraftName}
          />
          <BaseButton clickHandler={createInlineDraft} variant="primary">Create</BaseButton>
          <BaseButton
            clickHandler={() => {
              showCreateInline = false;
              newDraftName = "";
            }}>Cancel</BaseButton
          >
        </div>
      {/if}
      {#if drafts.length === 0}
        <div>No drafts found.</div>
      {/if}
      {#if drafts.length > 0}
        <div class="wa-draft-list">
          {#each drafts as d}
            <div class="wa-draft-item {activeDraft === d ? 'active' : ''}">
              <div class="wa-draft-name wa-row">
                {#if activeDraft === d}
                  <span class="wa-draft-active-indicator" title="Active draft">●</span>
                {/if}
                {d}
              </div>
              <div class="wa-draft-actions">
                <IconButton
                  ariaLabel="Open draft"
                  title={undefined}
                  clickHandler={() => openDraft(d)}
                >
                  <Eye size={ICON_SIZE} />
                </IconButton>
                {#if activeDraft !== d}
                  <IconButton
                    ariaLabel="Set active draft"
                    title={undefined}
                    clickHandler={() => setActiveDraft(d)}
                  >
                    <BookOpenCheck size={ICON_SIZE} />
                  </IconButton>
                {/if}
                <IconButton
                  ariaLabel="Rename draft"
                  title={undefined}
                  clickHandler={() => renameDraft(d)}
                >
                  <Pencil size={ICON_SIZE} />
                </IconButton>
                <IconButton
                  ariaLabel="Duplicate draft"
                  title={undefined}
                  clickHandler={() => duplicateDraft(d)}
                >
                  <Copy size={ICON_SIZE} />
                </IconButton>
                <IconButton
                  ariaLabel="Delete draft"
                  title={undefined}
                  clickHandler={() => deleteDraftHandler(d)}
                >
                  <Trash size={ICON_SIZE} />
                </IconButton>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  {#if selectedValue && manager?.activeDraft && isMultiFileProject}
    <div class="chapter-controls" style="margin-top:18px;">
      <div class="wa-panel-header">
        <div class="wa-row justify-between">
          <div class="wa-title">Chapters</div>
          <div class="wa-button-group">
            <BaseButton
              clickHandler={() => (showCreateChapter = !showCreateChapter)}
              variant="primary">New Chapter</BaseButton
            >
          </div>
        </div>
      </div>
      {#if showCreateChapter}
        <div class="create-inline wa-row">
          <input
            class="wa-create-draft-input"
            type="text"
            placeholder="Chapter name"
            bind:value={newChapterName}
          />
          <BaseButton
            clickHandler={async () => {
              if (!selectedValue || !manager?.activeDraft || !newChapterName.trim()) return;
              await manager.createChapter(
                selectedValue,
                manager.activeDraft,
                newChapterName.trim(),
              );
              newChapterName = "";
              newChapterNameValue = "";
              showCreateChapter = false;
              await refreshChapters();
            }}
            variant="primary">Create</BaseButton
          >
          <BaseButton
            clickHandler={() => {
              showCreateChapter = false;
              newChapterName = "";
              newChapterNameValue = "";
            }}>Cancel</BaseButton
          >
        </div>
      {/if}
      {#if loadingChapters}
        <div>Loading chapters...</div>
      {:else if chapters.length === 0}
        <div style="margin-top: 1em;">No chapters found.</div>
      {:else}
        <div class="wa-draft-list">
          {#each chapters as ch, i (ch.chapterName)}
            <div class="wa-draft-item" animate:flip={{ duration: 500, easing: cubicOut }}>
              <div class="wa-draft-name">
                {ch.chapterName}
              </div>
              <div class="wa-draft-actions">
                <BaseButton
                  title="Move chapter up"
                  clickHandler={() => reorderChaptersUp(i)}
                  disabled={i === 0}><ArrowUp /></BaseButton
                >
                <BaseButton
                  title="Move chapter down"
                  clickHandler={() => reorderChaptersDown(i)}
                  disabled={i === chapters.length - 1}><ArrowDown /></BaseButton
                >
                <IconButton
                  ariaLabel="Open chapter"
                  title={undefined}
                  clickHandler={() => openChapterHandler(ch.name)}
                >
                  <Eye size={ICON_SIZE} />
                </IconButton>
                <IconButton
                  ariaLabel="Rename chapter"
                  title={undefined}
                  clickHandler={() => renameChapterHandler(ch.chapterName || "")}
                >
                  <Pencil size={ICON_SIZE} />
                </IconButton>
                <IconButton
                  ariaLabel="Delete chapter"
                  title={undefined}
                  clickHandler={() => deleteChapterHandler(ch.chapterName || "")}
                >
                  <Trash size={ICON_SIZE} />
                </IconButton>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
