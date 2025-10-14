<script lang="ts">
  // Svelte 5 pattern: prefer callback props over createEventDispatcher.
  export let ariaLabel = '';
  export let variant: 'ghost' | 'default' = 'default';
  export let disabled: boolean = false;
  export let title: string | undefined;
  export let onClick: ((e: MouseEvent) => void) | undefined = undefined;

  function handleClick(e: MouseEvent) {
    if (disabled) return;
    try {
      onClick && onClick(e);
    } catch (err) {}
  }
</script>

<button class={`wa-icon-btn clickable-icon ${variant === 'ghost' ? 'ghost' : ''}`} aria-label={ariaLabel} disabled={disabled} title={title} on:click={handleClick}>
  <slot />
</button>
