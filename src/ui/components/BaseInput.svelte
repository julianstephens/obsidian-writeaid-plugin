<script lang="ts">
  export let value: string | number = "";
  export let placeholder = "";
  export let type: string = "text";
  export let inputHandler: (() => void) | undefined;

  function handleInput() {
    if (inputHandler) inputHandler();
  }
</script>

<input class="base-input" {placeholder} bind:value on:input={handleInput} {type} />
