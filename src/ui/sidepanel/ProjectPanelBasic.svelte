<script lang="ts">
  import type { ProjectFileService } from "@/core/ProjectFileService";
  import type { ProjectService } from "@/core/ProjectService";
  import { APP_NAME, debug, DEBUG_PREFIX } from "@/core/utils";
  import type { WriteAidManager } from "@/manager";

  debug(`${DEBUG_PREFIX} ProjectPanelBasic: Component script executing`);

  export let manager: WriteAidManager;
  export let projectService: ProjectService;
  export let projectFileService: ProjectFileService;
  
  debug(`${DEBUG_PREFIX} ProjectPanelBasic: Exports defined`);

  let projects: string[] = [];
  let selectedValue: string | null = null;
  let loadingProjects = false;
  let initialized = false;

  // Load projects whenever manager/projectService become available
  $: if (manager && projectService && !initialized) {
    initialized = true;
    debug(`${DEBUG_PREFIX} ProjectPanelBasic: Reactive statement triggered, loading projects`);
    loadProjects();
  }

  async function loadProjects() {
    debug(`${DEBUG_PREFIX} ProjectPanelBasic.loadProjects() called`);
    loadingProjects = true;
    try {
      // Use manager's listAllFolders like the manager does in selectActiveProjectPrompt
      const all = manager.listAllFolders();
      debug(`${DEBUG_PREFIX} ProjectPanelBasic: got ${all.length} folders from manager.listAllFolders()`);
      
      const filteredProjects: string[] = [];
      for (const folder of all) {
        if (await projectService.isProjectFolder(folder)) {
          filteredProjects.push(folder);
          debug(`${DEBUG_PREFIX} ProjectPanelBasic: ${folder} is a project`);
        }
      }
      
      projects = filteredProjects;
      debug(`${DEBUG_PREFIX} ProjectPanelBasic: found ${projects.length} total projects`);
      
      if (projects.length > 0) {
        selectedValue = projects[0];
        debug(`${DEBUG_PREFIX} ProjectPanelBasic: set initial selectedValue to ${selectedValue}`);
      }
    } catch (e) {
      debug(`${DEBUG_PREFIX} ProjectPanelBasic: Error loading projects:`, e);
    } finally {
      loadingProjects = false;
    }
  }
</script>

<div class="project-panel">
  <h2>{APP_NAME} Projects</h2>
  
  {#if loadingProjects}
    <p>Loading projects...</p>
  {:else if projects.length === 0}
    <p>No projects found.</p>
  {:else}
    <div>
      <p><strong>Projects ({projects.length}):</strong></p>
      <ul>
        {#each projects as project}
          <li>{project}</li>
        {/each}
      </ul>
      <p>Selected: {selectedValue || 'none'}</p>
    </div>
  {/if}
</div>

<style>
  :global(.writeaid-project-panel) {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  :global(.writeaid-project-panel) h2 {
    margin: 0 0 12px 0;
    padding: 0;
    font-size: 1.1em;
    font-weight: 600;
    color: var(--text-normal);
  }

  :global(.writeaid-project-panel) p {
    margin: 8px 0;
    padding: 0;
    color: var(--text-normal);
  }

  :global(.writeaid-project-panel) ul {
    list-style: none;
    padding: 0;
    margin: 8px 0;
  }

  :global(.writeaid-project-panel) li {
    padding: 6px 8px;
    margin: 2px 0;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.15s;
    color: var(--text-normal);
  }

  :global(.writeaid-project-panel) li:hover {
    background-color: var(--background-modifier-hover);
  }

  :global(.writeaid-project-panel) strong {
    font-weight: 600;
    color: var(--text-normal);
  }

  .project-panel {
    padding: 10px;
    font-family: var(--font-text);
  }

  h2 {
    margin-top: 0;
    font-size: 1.2em;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    padding: 5px 0;
  }
</style>
