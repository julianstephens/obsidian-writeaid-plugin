<script lang="ts">
  export let variant: "primary" | "ghost" | "default" = "default";
  export let disabled = false;
  export let style: string = "";
  export let title: string = "";
  export let clickHandler: ((e: MouseEvent) => void) | undefined = undefined;
</script>

<button
  class={`wa-button ${variant === "primary" ? "primary" : variant === "ghost" ? "ghost" : ""}`}
  aria-label={title}
  {disabled}
  on:click={clickHandler}
  {style}
>
  <slot />
</button>
