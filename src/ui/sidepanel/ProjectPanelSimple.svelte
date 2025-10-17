<svelte:options customElement="writeaid-project-panel-simple" />

<script lang="ts">
  import { APP_NAME, debug, DEBUG_PREFIX } from "@/core/utils";
  import BaseButton from "@/ui/components/BaseButton.svelte";
  import { onDestroy } from "svelte";
  
  // Receive props as custom element attributes
  export let manager: any = undefined;
  export let projectService: any = undefined;
  export let projectFileService: any = undefined;

  let initialized = false;
  let projects: string[] = [];

  // Simple initialization
  try {
    const element = document.currentScript?.parentElement as any;
    if (element?._manager) {
      manager = element._manager;
      projectService = element._projectService;
      projectFileService = element._projectFileService;
      initialized = true;
      debug(`${DEBUG_PREFIX} ProjectPanelSimple initialized`);
    }
  } catch (e) {
    debug(`${DEBUG_PREFIX} Error in ProjectPanelSimple init:`, e);
  }

  onDestroy(() => {
    debug(`${DEBUG_PREFIX} ProjectPanelSimple destroyed`);
  });
</script>

<div class="project-panel-simple">
  <h3>{APP_NAME} Projects</h3>
  {#if initialized && manager}
    <div>Manager found: {manager?.constructor?.name || 'unknown'}</div>
    <div>Active project: {manager?.activeProject || 'none'}</div>
    <BaseButton clickHandler={() => debug(`${DEBUG_PREFIX} test button clicked`)}>
      Test Button
    </BaseButton>
  {:else}
    <div>Loading or waiting for initialization...</div>
  {/if}
</div>

<style>
  .project-panel-simple {
    padding: 8px;
  }
</style>
