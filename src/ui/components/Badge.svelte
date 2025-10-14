<script lang="ts">
  export let text: string = '';
  export let accent: boolean = false;
</script>

<span class={`wa-badge ${accent ? 'accent' : ''}`}>{text}</span>
