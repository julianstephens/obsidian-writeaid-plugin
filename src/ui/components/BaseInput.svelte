<script lang="ts">
  // Svelte 5 pattern: prefer callback props over createEventDispatcher.
  export let value: string | number = '';
  export let placeholder = '';
  export let type: string = 'text';
  export let onInput: ((v: string, e: Event) => void) | undefined = undefined;

  function handleInput(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    value = v;
    if (onInput) onInput(v, e);
  }
</script>

<input class="wa-input" {placeholder} value={value} on:input={handleInput} type={type} />
