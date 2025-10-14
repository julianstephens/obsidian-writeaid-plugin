<script lang="ts">
  // Compile this Svelte component as a custom element so it can be mounted
  // reliably inside the Obsidian ItemView using DOM APIs.
  // The tag name chosen is <wa-project-panel>.
  // Note: the Vite/Svelte build must enable customElement or svelte config.
  import type { ProjectService } from '@/core/ProjectService';
  import { asyncFilter } from '@/core/utils';
  import BaseButton from "@/ui/components/BaseButton.svelte";
  import BaseInput from "@/ui/components/BaseInput.svelte";
  import "@/ui/components/components.css";
  import IconButton from '@/ui/components/IconButton.svelte';
  import { RotateCcw } from '@lucide/svelte';
  import { Notice } from 'obsidian';
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

  async function refresh() {
    loadingProjects = true;
    const allFolders: string[] = projectService.listAllFolders();
    // filter asynchronously to detect projects
    try {
      projects = await asyncFilter(allFolders.filter((p) => !!p), (p) => projectService.isProjectFolder(p));
    } catch (e) {
      projects = [];
    }
    // compute projectOptions synchronously from freshly loaded projects
    const opts = projects.map((p) => ({ value: p, label: p }));
    projectOptions = opts;

    // Ensure selected reflects manager or incoming activeProject (primitive + option object)
    const initial = activeProject ?? (manager && manager.activeProject) ?? undefined;
    if (initial) {
      selectedValue = initial;
      selected = opts.find((o) => o.value === initial) ?? { value: initial, label: initial };
    } else {
      selected = undefined;
      selectedValue = undefined;
    }

    loadingProjects = false;
    // load drafts for the selected project (uses selectedValue)
    refreshDrafts();
  }

  function refreshDrafts() {
    loadingDrafts = true;
    try {
      drafts = draftService.listDrafts(selectedValue || undefined) || [];
    } catch (e) {
      drafts = [];
    }
    loadingDrafts = false;
  }

  onMount(async () => {
    await refresh();
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
    } catch (e) {}
  }

  // react to prop changes: set selected option when activeProject prop changes
  $: if (activeProject !== undefined) {
    selected = projectOptions.find((o) => o.value === activeProject) ?? (activeProject ? { value: activeProject, label: activeProject } : undefined);
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

    async function activate(p: string | null) {
      if (!p) return;
      new Notice(`Activating project ${p}`);
      await manager.setActiveProject(p);
    }

    function createDraft() {
      // delegate to manager prompt to keep behavior consistent
      try { manager.createNewDraftPrompt(); } catch (e) {}
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
      } catch (e) {
        new Notice('Failed to set active draft');
      }
    }

    async function renameDraft(oldName: string) {
      const newName = window.prompt(`Rename draft '${oldName}' to:` , oldName);
      if (!newName || !newName.trim()) return;
      try {
        const ok = await manager.renameDraft(oldName, newName.trim(), selectedValue);
        if (ok) refreshDrafts();
      } catch (e) {
        new Notice('Failed to rename draft');
      }
    }

    async function deleteDraftHandler(draftName: string) {
      const ok = window.confirm(`Delete draft '${draftName}'? This will create a backup copy before deleting.`);
      if (!ok) return;
      try {
        const res = await manager.deleteDraft(draftName, selectedValue, true);
        if (res) refreshDrafts();
      } catch (e) {
        new Notice('Failed to delete draft');
      }
    }
</script>

<style>
  .project-list { padding: 8px; }
  .project-select-row { display:flex; gap:8px; align-items:center; }
  .create-inline { display:flex; gap:8px; margin-bottom:8px; align-items:center; }
  .wa-panel { padding:8px; height: 100%; }
</style>

<div class="project-list wa-panel">
  <div class="wa-panel-header">
    <div class="wa-title">WriteAid Projects</div>
    <div>
      <IconButton ariaLabel="Refresh projects" on:click={refresh} title={undefined}>
        <RotateCcw />
      </IconButton>
    </div>
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
          items={projectOptions}
          showChevron={true}
          disabled={disabled}
          clearable={false}
          placeholder="Choose a project..."
          searchable={false}
          bind:value={selected}
          on:select={(e) => {
            const item = e.detail;
            // svelte-select emits the selected item in detail
            selected = item;
            selectedValue = typeof item === 'string' ? item : item ? item.value : undefined;
            activate(selectedValue ?? null);
          }}
        />
      </div>
    </div>
  {/if}

  {#if selectedValue}
    <div class="draft-controls" style="margin-top:16px;">
      <div class="wa-panel-header">
        <div class="wa-title">Drafts</div>
        <div class="wa-row">
          <BaseButton onClick={createDraft} variant="primary">New</BaseButton>
          <IconButton ariaLabel="Refresh drafts" title={undefined} on:click={refreshDrafts} disabled={loadingDrafts}>
            <RotateCcw />
          </IconButton>
        </div>
      </div>
      {#if showCreateInline}
        <div class="create-inline">
          <BaseInput placeholder="Draft name" bind:value={newDraftName} />
          <Select class="wa-select" label="Copy from draft" bind:value={copyFromSelected} items={[{value: '', label: 'Start blank'}, ...drafts.map(d => ({ value: d, label: d }))]} clearable={false} placeholder="Start blank or choose a draft" on:select={(e) => {
            const it = e.detail;
            copyFromSelected = it;
            copyFrom = typeof it === 'string' ? it : it ? it.value : '';
          }} />
          <BaseButton onClick={createInlineDraft} variant="primary">Create</BaseButton>
        </div>
      {/if}
      {#if drafts.length === 0}
        <div>No drafts found.</div>
      {/if}
      {#if drafts.length > 0}
        <div class="wa-draft-list">
          {#each drafts as d}
            <div class="wa-draft-item">
              <div class="wa-draft-name">{d}</div>
              <div class="wa-draft-actions">
                <BaseButton onClick={() => openDraft(d)}>Open</BaseButton>
                <BaseButton onClick={() => setActiveDraft(d)}>Set Active</BaseButton>
                <BaseButton onClick={() => renameDraft(d)}>Rename</BaseButton>
                <BaseButton onClick={() => deleteDraftHandler(d)} variant="ghost">Delete</BaseButton>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
