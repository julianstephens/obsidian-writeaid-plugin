<script lang="ts">
  // Svelte 5 pattern: prefer callback props over createEventDispatcher.
  // Expose an optional `onClick` callback prop consumers can pass.
  export let variant: 'primary' | 'ghost' | 'default' = 'default';
  export let disabled = false;
  export let title = '';
  export let onClick: ((e: MouseEvent) => void) | undefined = undefined;

  function handleClick(e: MouseEvent) {
    if (disabled) return;
    try {
      onClick && onClick(e);
    } catch (err) {}
  }
</script>

<button class={`wa-button ${variant === 'primary' ? 'primary' : variant === 'ghost' ? 'ghost' : ''}`} {disabled} title={title} on:click={handleClick}>
  <slot />
</button>
