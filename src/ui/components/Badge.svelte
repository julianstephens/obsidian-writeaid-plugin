<script lang="ts">
  export let text: string = '';
  export let color: string = '';
</script>

<span class="badge" style={color ? `background-color: ${color}` : ''}>
  <slot>{text}</slot>
</span>

<style>
</style>
