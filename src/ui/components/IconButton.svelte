<script lang="ts">
  export let ariaLabel = "";
  export let variant: "ghost" | "default" = "default";
  export let disabled: boolean = false;
  export let title: string | undefined;
  export let onclick: ((e: MouseEvent) => void) | undefined = undefined;
  export let spinning: boolean = false;
</script>

<button
  class={`wa-icon-btn clickable-icon ${variant === "ghost" ? "ghost" : ""}`}
  aria-label={ariaLabel}
  {disabled}
  {title}
  {onclick}
>
  <span class={spinning ? "spinning" : ""}>
    <slot />
  </span>
</button>

<style>
  .spinning {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    100% {
      transform: rotate(360deg);
    }
  }
</style>
