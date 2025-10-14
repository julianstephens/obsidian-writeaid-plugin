<script lang="ts">
  export let value: string | number = '';
  export let placeholder = '';
  export let type: string = 'text';
  export let oninput: ((event: InputEvent) => void) | undefined;

  function handleInput(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    value = v;
    if (oninput) oninput(e as InputEvent);
  }
</script>

<input
  class="base-input"
  {placeholder}
  bind:value
  oninput={handleInput}
  type={type}
/>