<script lang="ts">
  export let title = '';
  export let description = '';
  export let actionLabel = '';
  export let onAction: (() => void) | null = null;
</script>

<div class="wa-empty">
  {#if title}<div class="wa-empty-title">{title}</div>{/if}
  {#if description}<div class="wa-empty-desc">{description}</div>{/if}
  {#if actionLabel && onAction}
    <div><button class="wa-button primary" on:click={() => onAction && onAction()}>{actionLabel}</button></div>
  {/if}
</div>