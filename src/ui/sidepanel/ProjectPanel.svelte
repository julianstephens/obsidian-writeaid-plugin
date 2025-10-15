<script>
  // Compile this Svelte component as a custom element so it can be mounted
  // reliably inside the Obsidian ItemView using DOM APIs.
  // The tag name chosen is <wa-project-panel>.
  // Note: the Vite/Svelte build must enable customElement or svelte config.
  import { readMetaFile } from "@/core/meta";
  import BaseButton from "@/ui/components/BaseButton.svelte";
  import "@/ui/components/components.css";
  import IconButton from "@/ui/components/IconButton.svelte";
  import { ConfirmDeleteModal } from "@/ui/modals/ConfirmDeleteModal";
  import { ArrowDown, ArrowUp, BookOpenCheck, Eye, Pencil, RotateCcw, Trash } from "@lucide/svelte";
  import { onDestroy, onMount } from "svelte";
  import Select from "svelte-select";
  import { flip } from "svelte/animate";
  import { cubicOut } from "svelte/easing";

  export let draftService;
  export let projectService;
  export let manager;
  export let activeProject = null;

  // Local UI state
  let projects = [];
  let selected = undefined; // bind target for svelte-select
  let selectedValue = undefined; // primitive project path
  let drafts = [];
  let loadingProjects = false;
  let projectOptions = [];
  let disabled = false;
  let loadingDrafts = false;
  let showCreateInline = false;
  let newDraftName = "";
  let copyFromSelected = undefined;
  let copyFrom = "";
  let draftMeta = {};
  let sortAsc = true;
  // Local reactive copy of manager.activeDraft for Svelte reactivity
  let activeDraft = manager?.activeDraft ?? null;
  let activeProjectListener = null;

  // Chapter management state
  let chapters = [];
  let loadingChapters = false;
  let showCreateChapter = false;
  let newChapterName = "";
  let newChapterNameValue = "";
  let editingChapterIndex = null;
  let editingChapterNameValue = "";
  let editingName = "";
  let isMultiFileProject = false;

  // Load all projects and update UI
  async function refresh(showNotifications = false) {
    loadingProjects = true;
    const minSpin = new Promise((resolve) => setTimeout(resolve, 400));
    const prevProjects = [...projects];
    const prevActive = activeProject;
    let allFolders = [];
    let newProjects = [];
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
      new window.Notice(`${added.length} new project${added.length > 1 ? "s" : ""} discovered.`);
    }
    if (showNotifications && removed.length > 0) {
      new window.Notice(`${removed.length} project${removed.length > 1 ? "s" : ""} removed.`);
    }
    projects = newProjects;
    projectOptions = newProjects.map((p) => ({ value: p, label: p }));

    // If there are no projects, clear selection
    if (newProjects.length === 0) {
      activeProject = null;
      selected = undefined;
      selectedValue = undefined;
    } else if (newProjects.length === 1) {
      // If only one project exists, always set it as active
      activeProject = newProjects[0];
      selected = projectOptions[0];
      selectedValue = newProjects[0];
      // Debug: log project selection
      try {
        if (manager && manager.settings && manager.settings.debug) {
          console.debug(`WriteAid debug: panel refresh selected single project '${selectedValue}'`);
        }
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
        if (manager && manager.settings && manager.settings.debug) {
          console.debug(
            `WriteAid debug: panel refresh selected fallback project '${selectedValue}'`,
          );
        }
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
        // Debug: log kept selection
        try {
          if (manager && manager.settings && manager.settings.debug) {
            console.debug(`WriteAid debug: panel refresh kept project '${selectedValue}'`);
          }
        } catch (e) {
          // ignore
        }
      } else {
        activeProject = null;
        selected = undefined;
        selectedValue = undefined;
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
    loadingDrafts = true;
    try {
      if (!selectedValue) {
        drafts = [];
        return;
      }
      // Prefer draftService for listing drafts to avoid duplicating logic
      if (draftService && typeof draftService.listDrafts === "function") {
        drafts = draftService.listDrafts(selectedValue) || [];
      } else {
        // fallback to manager API
        drafts = manager?.listDrafts ? manager.listDrafts(selectedValue) || [] : [];
      }
      // apply sort
      drafts = Array.from(drafts);
      drafts.sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
      if (!sortAsc) drafts.reverse();
      // set active draft UI state if manager has one
      // isMultiFileProject detection can be deferred
    } catch (e) {
      drafts = [];
    } finally {
      loadingDrafts = false;
    }
  }

  // Refresh chapters (multi-file projects)
  async function refreshChapters() {
    loadingChapters = true;
    try {
      if (!selectedValue) {
        chapters = [];
        isMultiFileProject = false;
        return;
      }
      // Check project type
      const metaPath = `${selectedValue}/meta.md`;
      const meta = await readMetaFile(app, metaPath);
      isMultiFileProject = meta?.project_type === "multi-file";
      if (!isMultiFileProject) {
        chapters = [];
        return;
      }
      if (!manager?.activeDraft) {
        chapters = [];
        return;
      }
      // Prefer draftService for chapter listing
      let ch = [];
      if (draftService && typeof draftService.listChapters === "function") {
        ch = await draftService.listChapters(selectedValue, manager.activeDraft);
      } else if (manager && typeof manager.listChapters === "function") {
        ch = await manager.listChapters(selectedValue, manager.activeDraft);
      }
      chapters = Array.isArray(ch) ? ch : [];
    } catch (e) {
      chapters = [];
      isMultiFileProject = false;
    } finally {
      loadingChapters = false;
    }
  }

  // Minimal action handlers used by the template
  async function createInlineDraft() {
    if (!selectedValue || !newDraftName.trim()) return;
    try {
      // Prefer manager for creating drafts to ensure notifications and panel updates
      if (manager && typeof manager.createNewDraft === "function") {
        await manager.createNewDraft(newDraftName.trim(), copyFrom || undefined, selectedValue);
      } else if (draftService && typeof draftService.createDraft === "function") {
        await draftService.createDraft(newDraftName.trim(), copyFrom || undefined, selectedValue);
      }
    } catch (e) {
      // ignore
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
    // Prefer manager.setActiveDraft to change active draft
    if (!selectedValue) return;
    // If draftService can open drafts, use it (opens files). Otherwise, fall back to manager.setActiveDraft.
    let opened = false;
    if (draftService && typeof draftService.openDraft === "function") {
      try {
        opened = await draftService.openDraft(selectedValue, draftName);
      } catch (e) {
        opened = false;
      }
    }
    if (!opened) {
      if (manager?.setActiveDraft) await manager.setActiveDraft(draftName, selectedValue);
    }
    await refreshDrafts();
    await refreshChapters();
  }

  async function renameDraft(draftName) {
    // For now, prompt simple rename via browser prompt (modal would be better)
    const newName = window?.prompt
      ? window.prompt(`Rename draft '${draftName}' to:`, draftName)
      : null;
    if (!newName || !selectedValue) return;
    try {
      await manager.renameDraft(draftName, newName, selectedValue, false);
      await refreshDrafts();
    } catch (e) {
      // ignore
    }
  }

  async function deleteDraftHandler(draftName) {
    if (!selectedValue) return;
    const app = window && window.app ? window.app : manager?.app;
    const modal = new ConfirmDeleteModal(
      app,
      draftName,
      async () => {
        await manager.deleteDraft(draftName, selectedValue);
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

  // Ensure draft activation always updates manager and UI
  async function setActiveDraft(draftName) {
    if (!selectedValue) return;
    if (manager?.setActiveDraft) await manager.setActiveDraft(draftName, selectedValue);
    activeDraft = manager?.activeDraft ?? null;
    await refreshDrafts();
    await refreshChapters();
  }
  // activeDraft listener placeholder (populated in onMount)
  let activeDraftListener = null;

  onMount(async () => {
    // Initial refresh to populate projects and drafts
    await refresh(false);

    // Activate the selected project to ensure manager state is synced
    if (selectedValue) {
      await activate(selectedValue);
    }

    // Retry once after a short delay to handle timing issues where the
    // manager may not have finished initializing when the panel mounted.
    // This is a single-shot re-sync only.
    setTimeout(async () => {
      try {
        if (selectedValue && manager && manager.activeProject !== selectedValue) {
          await ensureManagerActive(selectedValue);
        }
      } catch (e) {
        // ignore
      }
    }, 200);

    // Subscribe to manager activeDraft changes so we can update the UI indicator
    try {
      if (manager && typeof manager.addActiveDraftListener === "function") {
        activeDraftListener = (d) => {
          activeDraft = d;
          refreshDrafts().catch(() => {});
          refreshChapters().catch(() => {});
        };
        manager.addActiveDraftListener(activeDraftListener);
        // Also set initial value
        activeDraft = manager.activeDraft ?? null;
      }
    } catch (e) {
      // ignore
    }

    // Subscribe to manager activeProject changes so we can update the UI
    try {
      if (manager && typeof manager.addActiveProjectListener === "function") {
        activeProjectListener = (p) => {
          activeProject = p;
          selectedValue = p;
          refresh().catch(() => {});
          refreshDrafts().catch(() => {});
          // Update selected to the option object
          selected = projectOptions.find((o) => o.value === p) || undefined;
        };
        manager.addActiveProjectListener(activeProjectListener);
        // Also set initial value
        activeProject = manager.activeProject ?? null;
        selectedValue = activeProject;
        refreshDrafts().catch(() => {});
        // Update selected to the option object
        selected = projectOptions.find((o) => o.value === activeProject) || undefined;
        refreshChapters().catch(() => {});
      }
    } catch (e) {
      // ignore
    }
  });

  // Cleanup on destroy — must be called at component init time, not inside onMount
  onDestroy(() => {
    try {
      if (
        manager &&
        typeof manager.removeActiveDraftListener === "function" &&
        activeDraftListener
      ) {
        manager.removeActiveDraftListener(activeDraftListener);
      }
    } catch (e) {
      // ignore
    }
    try {
      if (
        manager &&
        typeof manager.removeActiveProjectListener === "function" &&
        activeProjectListener
      ) {
        manager.removeActiveProjectListener(activeProjectListener);
      }
    } catch (e) {
      // ignore
    }
  });
</script>

<div class="project-list wa-panel">
  <div class="wa-row justify-between">
    <div class="wa-title">WriteAid Projects</div>
    <div>
      <IconButton
        ariaLabel="Refresh projects"
        onclick={() => refresh(true)}
        title={undefined}
        spinning={loadingProjects}
      >
        <RotateCcw />
      </IconButton>
    </div>
  </div>

  <div class="wa-row" style="margin: 18px 0 10px 0;">
    <BaseButton
      onclick={async () => {
      const beforeProjects = [...projects];
      const app = (window && window.app) ? window.app : manager.app;
      const { CreateProjectModal } = await import('@/ui/modals/CreateProjectModal');
      const initialDraftName = 'Draft 1';
      let projectPath = null;
      const modal = new CreateProjectModal(app, async (projectName, singleFile, initialDraftName) => {
        if (!projectName) return;
        projectPath = await projectService.createProject(
          projectName,
          singleFile,
          initialDraftName,
          undefined,
          manager.settings
        );
        if (!projectPath) return;
        // Wait for the new project to appear in the list
  let newProjects = [];
  let newProject = null;
        for (let i = 0; i < 20; i++) {
          await new Promise(res => setTimeout(res, 100));
          newProjects = await refresh();
          const found = newProjects.find(p => p === projectPath);
          newProject = typeof found === 'string' ? found : null;
          if (newProject) break;
        }
        if (typeof newProject === 'string' && newProject) {
          activeProject = newProject;
          selected = { value: newProject, label: newProject };
          selectedValue = newProject;
          // Set the new draft as active
          if (manager.setActiveDraft) {
            await manager.setActiveDraft(newProject, initialDraftName);
          } else {
            manager.activeDraft = initialDraftName;
          }
          await refreshDrafts();
          await refreshChapters();
        }
      });
      modal.open();
      return;
    }}
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
      <div class="project-select-row">
        <Select
          name="wa-project-select"
          class="wa-select"
          items={projectOptions}
          showChevron={true}
          {disabled}
          clearable={false}
          searchable={false}
          placeholder="Choose a project..."
          containerStyles="background: var(--select-bg); color: var(--select-text); border: 1px solid var(--select-border); border-radius: none; min-height: 38px; box-shadow: none; font-size: 1em; transition: border 0.2s;"
          bind:value={selected}
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
              onclick={() => {
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
            <BaseButton onclick={createDraft} variant="primary">New</BaseButton>
            <IconButton
              ariaLabel="Refresh drafts"
              title={undefined}
              onclick={refreshDrafts}
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
            value={newDraftName}
            on:input={(e) => {
              const t = e.target;
              if (t) newDraftName = t.value;
            }}
          />
          <BaseButton onclick={createInlineDraft} variant="primary">Create</BaseButton>
          <BaseButton
            onclick={() => {
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
                <IconButton ariaLabel="Open draft" title={undefined} onclick={() => openDraft(d)}>
                  <Eye size={18} />
                </IconButton>
                {#if activeDraft !== d}
                  <IconButton
                    ariaLabel="Set active draft"
                    title={undefined}
                    onclick={() => setActiveDraft(d)}
                  >
                    <BookOpenCheck size={18} />
                  </IconButton>
                {/if}
                <IconButton
                  ariaLabel="Rename draft"
                  title={undefined}
                  onclick={() => renameDraft(d)}
                >
                  <Pencil size={18} />
                </IconButton>
                <IconButton
                  ariaLabel="Delete draft"
                  title={undefined}
                  onclick={() => deleteDraftHandler(d)}
                >
                  <Trash size={18} />
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
            <BaseButton onclick={() => (showCreateChapter = !showCreateChapter)} variant="primary"
              >New Chapter</BaseButton
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
            value={newChapterName}
            on:input={(e) => {
              const t = e.target;
              if (t) newChapterName = t.value;
            }}
          />
          <BaseButton
            onclick={async () => {
              if (!selectedValue || !manager?.activeDraft || !newChapterName.trim()) return;
              await manager.createChapter(
                selectedValue,
                manager.activeDraft,
                newChapterName.trim(),
                newChapterNameValue.trim() || undefined,
              );
              newChapterName = "";
              newChapterNameValue = "";
              showCreateChapter = false;
              await refreshChapters();
            }}
            variant="primary">Create</BaseButton
          >
          <BaseButton
            onclick={() => {
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
                  onclick={async () => {
                    if (i === 0) return;
                    // Move chapter up
                    const newOrder = chapters.slice();
                    [newOrder[i - 1], newOrder[i]] = [newOrder[i], newOrder[i - 1]];
                    // Ensure order property is correct
                    const ordered = newOrder.map((ch, idx) => ({ ...ch, order: idx + 1 }));
                    await manager.reorderChapters(selectedValue, manager.activeDraft, ordered);
                    await refreshChapters();
                  }}
                  disabled={i === 0}>↑</BaseButton
                >
                <BaseButton
                  onclick={async () => {
                    if (i === chapters.length - 1) return;
                    // Move chapter down
                    const newOrder = chapters.slice();
                    [newOrder[i], newOrder[i + 1]] = [newOrder[i + 1], newOrder[i]];
                    // Ensure order property is correct
                    const ordered = newOrder.map((ch, idx) => ({ ...ch, order: idx + 1 }));
                    await manager.reorderChapters(selectedValue, manager.activeDraft, ordered);
                    await refreshChapters();
                  }}
                  disabled={i === chapters.length - 1}>↓</BaseButton
                >
                <IconButton
                  ariaLabel="Open chapter"
                  title="Open chapter"
                  onclick={async () => {
                    if (!selectedValue || !manager?.activeDraft) return;
                    await manager.openChapter(selectedValue, manager.activeDraft, ch.chapterName);
                  }}
                >
                  <Eye size={18} />
                </IconButton>
                <IconButton
                  ariaLabel="Rename chapter"
                  title="Rename chapter"
                  onclick={() => {
                    editingChapterIndex = i;
                    editingName = ch.chapterName;
                    editingChapterNameValue = ch.chapterName || "";
                  }}
                >
                  <Pencil size={18} />
                </IconButton>
                <IconButton
                  ariaLabel="Delete chapter"
                  title="Delete chapter"
                  onclick={async () => {
                    if (!selectedValue || !manager?.activeDraft) return;
                    const app = window && window.app ? window.app : manager.app;
                    const modal = new ConfirmDeleteModal(
                      app,
                      ch.chapterName,
                      async () => {
                        await manager.deleteChapter(
                          selectedValue,
                          manager.activeDraft,
                          ch.chapterName,
                        );
                        await refreshChapters();
                      },
                      "chapter",
                    );
                    modal.open();
                  }}
                >
                  <Trash size={18} />
                </IconButton>
              </div>
              {#if editingChapterIndex === i}
                <div class="create-inline wa-row">
                  <input
                    class="wa-chapter-rename-input"
                    type="text"
                    placeholder="Chapter name"
                    value={editingName}
                    on:input={(e) => {
                      const t = e.target;
                      if (t) editingName = t.value;
                    }}
                  />
                  <BaseButton
                    onclick={async () => {
                      if (!selectedValue || !manager?.activeDraft) return;
                      await manager.renameChapter(
                        selectedValue,
                        manager.activeDraft,
                        ch.chapterName,
                        editingName.trim(),
                        editingChapterNameValue.trim() || undefined,
                      );
                      editingChapterIndex = null;
                      await refreshChapters();
                    }}
                    variant="primary">Save</BaseButton
                  >
                  <BaseButton
                    onclick={() => {
                      editingChapterIndex = null;
                    }}>Cancel</BaseButton
                  >
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .project-list {
    padding: 8px;
  }
  .project-select-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .create-inline {
    margin-top: 8px;
    justify-content: center;
  }
  .wa-panel {
    padding: 8px;
    height: 100%;
    border-radius: 0;
  }
  .wa-panel-header {
    display: flex;
    flex-direction: column;
  }
  .wa-draft-item.active .wa-draft-name {
    font-weight: bold;
    color: var(--color-accent, #3b82f6);
  }
  .wa-draft-active-indicator {
    color: var(--color-accent, #3b82f6);
    font-size: 1em;
    vertical-align: middle;
  }
  @keyframes spin {
    100% {
      transform: rotate(360deg);
    }
  }
  .wa-chapter-rename-input {
    padding: 6px 12px;
    font-size: 1em;
    border: 2px solid var(--color-accent, #3b82f6);
    border-radius: 6px;
    outline: none;
    background: var(--background-secondary, #f8fafc);
    color: var(--text-normal, #222);
    transition:
      border 0.2s,
      box-shadow 0.2s;
    box-shadow: 0 1px 4px rgba(60, 120, 240, 0.07);
    margin-right: 8px;
  }
  .wa-chapter-rename-input:focus {
    border-color: var(--color-accent, #2563eb);
    box-shadow: 0 0 0 2px var(--color-accent, #2563eb33);
    background: var(--background-modifier-hover, #e0e7ef);
  }
</style>
