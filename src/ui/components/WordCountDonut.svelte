<script lang="ts">
  export let current: number = 0;
  export let target: number = 0;
  export let size: number = 120; // total SVG size (px)
  export let strokeWidth: number = 12; // thickness of the ring

  // Derived values
  $: clampedCurrent = Math.max(0, Number.isFinite(current) ? current : 0);
  $: clampedTarget = Math.max(0, Number.isFinite(target) ? target : 0);
  $: pct =
    clampedTarget > 0 ? Math.min(100, Math.round((clampedCurrent / clampedTarget) * 100)) : 0;

  $: radius = (size - strokeWidth) / 2;
  $: circumference = 2 * Math.PI * radius;
  $: dash = (pct / 100) * circumference;
  $: gap = circumference - dash;
</script>

<svg
  width={size}
  height={size}
  viewBox={`0 0 ${size} ${size}`}
  class="wa-donut"
  aria-label="Word count progress"
  role="img"
>
  <!-- Background ring -->
  <circle
    cx={size / 2}
    cy={size / 2}
    r={radius}
    stroke-width={strokeWidth}
    class="wa-donut-track"
    fill="none"
    stroke="var(--background-modifier-border, #ddd)"
  />

  <!-- Progress ring -->
  <circle
    cx={size / 2}
    cy={size / 2}
    r={radius}
    stroke-width={strokeWidth}
    class="wa-donut-progress"
    fill="none"
    stroke="var(--interactive-accent, #6aa0ff)"
    stroke-dasharray={`${dash} ${gap}`}
    transform={`rotate(-90 ${size / 2} ${size / 2})`}
  />

  <g class="wa-donut-center" transform={`translate(${size / 2}, ${size / 2})`}>
    <text
      class="wa-donut-value"
      fill="var(--text-title, var(--text-normal, #222))"
      font-weight="bold"
      dy="4"
      text-anchor="middle">{pct}%</text
    >
  </g>
</svg>

<style>
  .wa-donut {
    display: block;
  }
  .wa-donut-track {
    fill: none;
    stroke: var(--background-modifier-border, #ddd);
    opacity: 0.65;
  }
  .wa-donut-progress {
    fill: none;
    stroke: var(--interactive-accent, #6aa0ff);
    stroke-linecap: round;
    transition: stroke-dasharray 160ms ease-out;
  }
  .wa-donut-center {
    pointer-events: none;
  }
</style>
