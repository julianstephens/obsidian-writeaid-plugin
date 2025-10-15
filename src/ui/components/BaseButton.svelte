<script lang="ts">
  export let variant: "primary" | "ghost" | "default" = "default";
  export let disabled = false;
  export let style: string = "";
  export let title: string = "";
  export let onclick: ((e: MouseEvent) => void) | undefined = undefined;
</script>

<button
  class={`wa-button ${variant === "primary" ? "primary" : variant === "ghost" ? "ghost" : ""}`}
  aria-label={title}
  {disabled}
  {onclick}
  {style}
>
  <slot />
</button>
