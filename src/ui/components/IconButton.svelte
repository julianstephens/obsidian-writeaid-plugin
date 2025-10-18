<script lang="ts">
  export let ariaLabel = "";
  export let variant: "ghost" | "default" = "default";
  export let disabled: boolean = false;
  export let title: string | undefined;
  export let clickHandler: ((e: MouseEvent) => void) | undefined = undefined;
  export let spinning: boolean = false;
</script>

<button
  class={`wa-icon-btn clickable-icon ${variant === "ghost" ? "ghost" : ""} ${spinning ? "spinning" : ""}`}
  aria-label={ariaLabel}
  {disabled}
  {title}
  on:click={clickHandler}
>
  <slot />
</button>
