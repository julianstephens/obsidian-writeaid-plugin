<script lang="ts">
  // Compile this Svelte component as a custom element so it can be mounted
  // reliably inside the Obsidian ItemView using DOM APIs.
  // The tag name chosen is <wa-project-panel>.
  // Note: the Vite/Svelte build must enable customElement or svelte config.
  import { readMetaFile } from '@/core/meta';
  import type { ProjectService } from '@/core/ProjectService';
  import { asyncFilter } from '@/core/utils';
  import BaseButton from "@/ui/components/BaseButton.svelte";
  import "@/ui/components/components.css";
  import IconButton from '@/ui/components/IconButton.svelte';
  import { ConfirmDeleteModal } from '@/ui/modals/ConfirmDeleteModal';
  import { RenameDraftModal } from '@/ui/modals/RenameDraftModal';
  import { ArrowDown, ArrowUp, RotateCcw } from '@lucide/svelte';
  import { App, Notice } from 'obsidian';
  import { onMount } from 'svelte';
  import Select from 'svelte-select';

  export let projectService: ProjectService;
  export let manager: any;
  export let activeProject: string | null = null;
  export let draftService: any;

  let projects: string[] = [];
  // with svelte-select we may receive either the item object ({value,label}) or a primitive value
  let selected: any = undefined;
  // derived primitive value used by services and manager
  let selectedValue: string | undefined = undefined;
  let drafts: string[] = [];
  let loadingProjects = false;
  let projectOptions = [] as Array<{ value: string; label: string }>;
  let disabled = false;
  let loadingDrafts = false;
  let showCreateInline = false;
  let newDraftName = '';
  // copy-from select: may bind to an object; keep primitive copyFrom for service calls
  let copyFromSelected: any = undefined;
  let copyFrom: string = '';

  let draftMeta: Record<string, { created: number }> = {};
  let sortAsc = true;


  async function refresh(showNotifications = false) {
    loadingProjects = true;
    const minSpin = new Promise((resolve) => setTimeout(resolve, 400));
    const prevProjects = [...projects];
    const prevActive = activeProject;
    const allFolders: string[] = projectService.listAllFolders();
    let newProjects: string[] = [];
    try {
      newProjects = await asyncFilter(allFolders.filter((p) => !!p), (p) => projectService.isProjectFolder(p));
    } catch (e) {
      newProjects = [];
    }
    // Notify if projects were added or removed (only if showNotifications)
    const added = newProjects.filter(p => !prevProjects.includes(p));
    const removed = prevProjects.filter(p => !newProjects.includes(p));
    if (showNotifications && added.length > 0) {
      new Notice(`${added.length} new project${added.length > 1 ? 's' : ''} discovered.`);
    }
    if (showNotifications && removed.length > 0) {
      new Notice(`${removed.length} project${removed.length > 1 ? 's' : ''} removed.`);
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
    } else if (prevActive && !newProjects.includes(prevActive)) {
      // If the active project was removed, set the next available project as active
      activeProject = newProjects[0];
      selected = projectOptions[0];
      selectedValue = newProjects[0];
    } else {
      // Otherwise, keep the current selection ONLY if it still exists
      const found = projectOptions.find((o) => o.value === prevActive);
      if (found) {
        activeProject = prevActive;
        selected = found;
        selectedValue = found.value;
      } else {
        activeProject = null;
        selected = undefined;
        selectedValue = undefined;
      }
    }

    await minSpin;
    loadingProjects = false;
    // load drafts for the selected project (uses selectedValue)
    refreshDrafts();
  }

  function sortDrafts() {
    let sorted;
    if (Object.keys(draftMeta).length > 0) {
      sorted = drafts.slice().sort((a, b) => {
        const ca = draftMeta[a]?.created || 0;
        const cb = draftMeta[b]?.created || 0;
        return sortAsc ? ca - cb : cb - ca;
      });
    } else {
      sorted = drafts.slice().sort(sortAsc ? undefined : (a, b) => b.localeCompare(a));
    }
    drafts = sorted;
  }

  async function refreshDrafts() {
    loadingDrafts = true;
    const minSpin = new Promise((resolve) => setTimeout(resolve, 400));
    try {
      const draftList = draftService.listDrafts(selectedValue || undefined) || [];
      drafts = draftList;
      if (draftService.getDraftMeta) {
        draftMeta = {};
        for (const d of draftList) {
          draftMeta[d] = draftService.getDraftMeta(selectedValue, d) || { created: 0 };
        }
      } else {
        draftMeta = {};
      }
      sortDrafts();
      ensureDefaultDraftSelected(selectedValue ?? null);
    } catch (e) {
      drafts = [];
      draftMeta = {};
    }
    await minSpin;
    loadingDrafts = false;
  }

  onMount(async () => {
    console.debug('ProjectPanel.svelte mounted');
    await refresh(false);
  });


  // Expose a refresh method on the component instance so external code can request a refresh
  export function refreshPanel() {
    return refresh();
  }

  // Allow the host to programmatically set the active project after mount.
  // This is useful for cases where the manager's activeProject is restored
  // after the view has already mounted.
  export function setActiveProject(p: string | null) {
    try {
      activeProject = p;
      // Ensure selected reflects the newly-set activeProject
      selected = projectOptions.find((o) => o.value === p) ?? (p ? { value: p, label: p } : undefined);
      selectedValue = typeof selected === 'string' ? selected : selected ? selected.value : undefined;
      // refresh drafts for the selected project
      refreshDrafts();
      ensureDefaultDraftSelected(p);
    } catch (e) {}
  }



  // derive the primitive selectedValue used by services
  $: selectedValue = typeof selected === 'string' ? selected : selected ? selected.value : undefined;

  // derive copyFrom primitive
  $: copyFrom = typeof copyFromSelected === 'string' ? copyFromSelected : copyFromSelected ? copyFromSelected.value : '';

  // update drafts when selected project value changes
  $: if (selectedValue !== undefined) {
    refreshDrafts();
  }

  // reactive options mapping for BaseSelect
  $: projectOptions = projects.map((p) => ({ value: p, label: p }));

  $: if (typeof sortAsc !== 'undefined') {
    sortDrafts();
  }

  async function ensureDefaultDraftSelected(project: string | null) {
    if (!project) return;
    // If there is exactly one draft, always set it as active
    if (drafts.length === 1) {
      await manager.setActiveDraft(drafts[0], project, false);
      manager.activeDraft = drafts[0]; // Force Svelte update
    } else if (!manager.activeDraft && drafts.length > 0) {
      // Otherwise, if no active draft, set the latest
      const latestDraft = drafts[drafts.length - 1];
      if (latestDraft) {
        await manager.setActiveDraft(latestDraft, project, false);
        manager.activeDraft = latestDraft; // Force Svelte update
      }
    }
  }

  async function activate(p: string | null) {
    if (!p) return;
    new Notice(`Activating project ${p}`);
    await manager.setActiveProject(p);
    await ensureDefaultDraftSelected(p);
  }

  async function createDraft() {
    // Show inline draft creation for the active project
    if (!selectedValue) {
      new Notice('No active project selected.');
      return;
    }
    await refreshDrafts();
    showCreateInline = true;
    // Optionally focus the input after next tick
    setTimeout(() => {
      const input = document.querySelector('.create-inline input');
      if (input) (input as HTMLInputElement).focus();
    }, 0);
  }

  function switchDraft() {
    try { manager.switchDraftPrompt(); } catch (e) {}
  }

  async function createInlineDraft() {
    if (!selectedValue) return;
    const name = newDraftName && newDraftName.trim() ? newDraftName.trim() : draftService.suggestNextDraftName(selectedValue);
    try {
      // use manager wrapper so manager can notify panels to refresh
      await manager.createNewDraft(name, copyFrom || undefined, selectedValue);
      newDraftName = '';
      copyFrom = '';
      showCreateInline = false;
      refreshDrafts();
  new Notice(`Draft "${name}" created in ${selectedValue}.`);
    } catch (e) {
      new Notice('Failed to create draft');
    }
  }

  async function openDraft(draftName: string) {
    if (!selectedValue) return;
    try {
      await draftService.openDraft(selectedValue, draftName);
    } catch (e) {
      // ignore
    }
  }

  async function setActiveDraft(draftName: string) {
    try {
      await manager.setActiveDraft(draftName, selectedValue);
      // Force Svelte to update the UI by reassigning manager.activeDraft
      manager.activeDraft = draftName;
    } catch (e) {
      new Notice('Failed to set active draft');
    }
  }

  async function renameDraft(oldName: string) {
    const app = (window as any).app as App;
    let isSingleFile = false;
    if (selectedValue) {
      const metaPath = `${selectedValue}/meta.md`;
      const meta = await readMetaFile(app, metaPath);
      if (meta && meta.project_type === 'single-file') {
        isSingleFile = true;
      }
    }
    const modal = new RenameDraftModal(app, oldName, async (newName: string, renameFile: boolean) => {
      if (!newName || !newName.trim()) return;
      try {
        const ok = await manager.renameDraft(oldName, newName.trim(), selectedValue, renameFile);
        if (ok) refreshDrafts();
      } catch (e) {
        new Notice('Failed to rename draft');
      }
    }, isSingleFile);
    modal.open();
  }

  async function deleteDraftHandler(draftName: string) {
    return new Promise<void>((resolve) => {
      const app = (window as any).app as App;
      const modal = new ConfirmDeleteModal(app, draftName, async () => {
        try {
          const res = await manager.deleteDraft(draftName, selectedValue, true);
          if (res) refreshDrafts();
        } catch (e) {
          new Notice('Failed to delete draft');
        }
        resolve();
      });
      modal.open();
    });
  }
</script>

<style>
  .project-list { padding: 8px; }
  .project-select-row { display:flex; gap:8px; align-items:center; }
  .create-inline { display:flex; gap:8px; margin-bottom:8px; align-items:center; }
  .wa-panel { padding:8px; height: 100%; border-radius: 0; }
  .wa-panel-header { display:flex; flex-direction: column;}
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
    100% { transform: rotate(360deg); }
  }
</style>


<div class="project-list wa-panel">
  <div class="wa-row justify-between">
    <div class="wa-title">WriteAid Projects</div>
    <div>
      <IconButton ariaLabel="Refresh projects" onclick={() => refresh(true)} title={undefined} spinning={loadingProjects}>
        <RotateCcw />
      </IconButton>
    </div>
  </div>

  <div class="wa-row" style="margin: 18px 0 10px 0;">
    <BaseButton onclick={async () => {
      const before = projects.length;
      await manager.createNewProjectPrompt();
      // After project creation, refresh and auto-select if it was the first
      await refresh();
      if (before === 0 && projects.length === 1) {
        // Set the new project as active
        activeProject = projects[0];
        selected = { value: projects[0], label: projects[0] };
        selectedValue = projects[0];
        refreshDrafts();
      }
    }} variant="primary">New Project</BaseButton>
  </div>

  {#if projects.length === 0}
    <div class="wa-muted">No projects found.</div>
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
          disabled={disabled}
          clearable={false}
          searchable={false}
          placeholder="Choose a project..."
          containerStyles="background: var(--select-bg); color: var(--select-text); border: 1px solid var(--select-border); border-radius: none; min-height: 38px; box-shadow: none; font-size: 1em; transition: border 0.2s;"
          bind:value={selected}
          on:select={(e) => {
            const item = e.detail;
            selected = item;
            selectedValue = typeof item === 'string' ? item : item ? item.value : undefined;
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
            <IconButton ariaLabel="Toggle draft sort order" title={undefined} onclick={() => { sortAsc = !sortAsc; }}>
              {#if sortAsc}
                <ArrowUp />
              {:else}
                <ArrowDown />
              {/if}
            </IconButton>
          </div> 
          <div class="wa-button-group">
            <BaseButton onclick={createDraft} variant="primary">New</BaseButton>
            <IconButton ariaLabel="Refresh drafts" title={undefined} onclick={refreshDrafts} disabled={loadingDrafts} spinning={loadingDrafts}>
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
            on:input={(e) => { const t = e.target as HTMLInputElement | null; if (t) newDraftName = t.value; }}
          />
          <BaseButton onclick={createInlineDraft} variant="primary">Create</BaseButton>
        </div>
      {/if}
      {#if drafts.length === 0}
        <div>No drafts found.</div>
      {/if}
      {#if drafts.length > 0}
        <div class="wa-draft-list">
          {#each drafts as d}
            <div class="wa-draft-item {manager?.activeDraft === d ? 'active' : ''}">
              <div class="wa-draft-name">
                {#if manager?.activeDraft === d}
                  <span class="wa-draft-active-indicator" title="Active draft">●</span>
                {/if}
                {d}
              </div>
              <div class="wa-draft-actions">
                <BaseButton onclick={() => openDraft(d)}>Open</BaseButton>
                {#if manager?.activeDraft !== d}
                  <BaseButton onclick={() => setActiveDraft(d)}>Set Active</BaseButton>
                {/if}
                <BaseButton onclick={() => renameDraft(d)}>Rename</BaseButton>
                <BaseButton onclick={() => deleteDraftHandler(d)}>Delete</BaseButton>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>