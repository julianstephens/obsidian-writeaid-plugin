<script lang="ts">
  import { autoUpdate, flip, offset, shift, size } from '@floating-ui/dom';
  import { onDestroy, onMount } from 'svelte';

  // Props
  export let items: Array<{ value: string; label: string }> = [];
  export let value: { value: string; label: string } | string | null = null;
  export let placeholder = 'Select...';
  export let label = '';
  export let disabled = false;
  export let searchable = false;
  export let clearable = false;
  export let showChevron = true;
  export let name = '';
  export let containerStyles = '';

  // Local state
  let isOpen = false;
  let searchQuery = '';
  let filteredItems: Array<{ value: string; label: string }> = [];
  let selectedIndex = -1;

  // DOM references
  let triggerEl: HTMLElement;
  let dropdownEl: HTMLElement;
  let searchInputEl: HTMLInputElement;
  let cleanup: (() => void) | null = null;

  // Get display label
  function getDisplayLabel(): string {
    if (!value) return placeholder;
    if (typeof value === 'string') {
      const item = items.find((i) => i.value === value);
      return item ? item.label : value;
    }
    return (value as any).label || placeholder;
  }

  // Get value string
  function getValueString(): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return (value as any).value || '';
  }

  // Filter items based on search query
  function updateFilteredItems() {
    if (!searchQuery) {
      filteredItems = items;
    } else {
      filteredItems = items.filter(
        (item) =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.value.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    selectedIndex = -1;
  }

  // Open dropdown
  function openDropdown() {
    if (disabled || isOpen) return;
    isOpen = true;
    searchQuery = '';
    updateFilteredItems();

    // Focus search input if searchable
    if (searchable) {
      setTimeout(() => {
        if (searchInputEl) searchInputEl.focus();
      }, 0);
    }

    // Setup floating UI positioning
    if (triggerEl && dropdownEl) {
      setupFloatingUI();
    }
  }

  // Close dropdown
  function closeDropdown() {
    isOpen = false;
    searchQuery = '';
    selectedIndex = -1;
  }

  // Setup floating-ui
  function setupFloatingUI() {
    if (!triggerEl || !dropdownEl) return;

    const middleware = [
      offset(6),
      flip({
        padding: 8,
        fallbackAxisSideDirection: 'end',
      }),
      shift({ padding: 8 }),
      size({
        padding: 8,
        apply({ rects, availableHeight, availableWidth }) {
          Object.assign(dropdownEl.style, {
            maxHeight: `${Math.min(availableHeight - 10, 350)}px`,
            minWidth: `${rects.reference.width}px`,
            maxWidth: `${Math.max(availableWidth - 16, rects.reference.width)}px`,
          });
        },
      }),
    ];

    cleanup = autoUpdate(triggerEl, dropdownEl, async () => {
      const { computePosition } = await import('@floating-ui/dom');
      const { x, y, placement } = await computePosition(triggerEl, dropdownEl, {
        middleware,
        placement: 'bottom-start',
      });

      // Add data attribute to track placement for styling
      dropdownEl.setAttribute('data-placement', placement);

      Object.assign(dropdownEl.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
  }

  // Select an item
  function selectItem(item: { value: string; label: string }) {
    value = item;
    closeDropdown();
    
    // Dispatch custom select event
    const event = new CustomEvent('select', {
      detail: item,
      bubbles: true,
      cancelable: true,
    });
    triggerEl?.dispatchEvent(event);
  }

  // Clear selection
  function clearSelection(e: Event) {
    e.stopPropagation();
    value = null;
    closeDropdown();
    
    const event = new CustomEvent('clear', {
      bubbles: true,
      cancelable: true,
    });
    triggerEl?.dispatchEvent(event);
  }

  // Handle keyboard navigation
  function handleKeydown(e: KeyboardEvent) {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDropdown();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, filteredItems.length - 1);
        scrollToSelected();
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        scrollToSelected();
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          selectItem(filteredItems[selectedIndex]);
        } else {
          closeDropdown();
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeDropdown();
        break;
    }
  }

  // Scroll to selected item
  function scrollToSelected() {
    if (selectedIndex < 0) return;
    const selectedElement = document.querySelector(
      `[data-select-index="${selectedIndex}"]`
    ) as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }

  // Handle search input
  function handleSearchInput(e: Event) {
    searchQuery = (e.target as HTMLInputElement).value;
    updateFilteredItems();
  }

  // Click outside handler
  function handleClickOutside(e: MouseEvent) {
    if (isOpen && triggerEl && dropdownEl) {
      const target = e.target as Node;
      if (!triggerEl.contains(target) && !dropdownEl.contains(target)) {
        closeDropdown();
      }
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    updateFilteredItems();
  });

  onDestroy(() => {
    document.removeEventListener('click', handleClickOutside);
    if (cleanup) cleanup();
  });

  $: {
    updateFilteredItems();
  }
</script>

<div class="wa-select-container wa-select">
  {#if label}
    <label class="wa-select-label-text" for="wa-select-{name}">{label}</label>
  {/if}
  <div
    id="wa-select-{name}"
    class="wa-select-trigger"
    class:open={isOpen}
    class:disabled
    class:has-value={value}
    role="button"
    tabindex={disabled ? -1 : 0}
    bind:this={triggerEl}
    on:click={() => (isOpen ? closeDropdown() : openDropdown())}
    on:keydown={handleKeydown}
    style={containerStyles}
  >
    <div class="wa-select-value">
      {#if value}
        <span class="wa-select-label">{getDisplayLabel()}</span>
      {:else}
        <span class="wa-select-placeholder">{placeholder}</span>
      {/if}
    </div>

    <div class="wa-select-controls">
      {#if clearable && value}
        <button
          type="button"
          class="wa-select-clear"
          on:click={clearSelection}
          aria-label="Clear selection"
        >
          ✕
        </button>
      {/if}
      {#if showChevron}
        <div class="wa-select-chevron" class:rotated={isOpen}>
          ▼
        </div>
      {/if}
    </div>
  </div>

  {#if isOpen}
    <div class="wa-select-dropdown" bind:this={dropdownEl}>
      {#if searchable}
        <div class="wa-select-search">
          <input
            type="text"
            class="wa-select-search-input"
            placeholder="Search..."
            value={searchQuery}
            on:input={handleSearchInput}
            bind:this={searchInputEl}
          />
        </div>
      {/if}

      <div class="wa-select-list">
        {#if filteredItems.length === 0}
          <div class="wa-select-empty">No options available</div>
        {:else}
          {#each filteredItems as item, index (item.value)}
            <button
              type="button"
              class="wa-select-option"
              class:selected={selectedIndex === index}
              class:active={getValueString() === item.value}
              data-select-index={index}
              on:click={() => selectItem(item)}
              on:mouseenter={() => (selectedIndex = index)}
            >
              {item.label}
            </button>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .wa-select-container.wa-select {
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .wa-select-label-text {
    font-size: 0.9em;
    font-weight: 500;
    color: var(--select-text, var(--text-normal, #222));
  }

  .wa-select-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    border: 1px solid var(--select-border, var(--background-modifier-border, #ccc));
    border-radius: 6px;
    background: var(--select-bg, var(--background-primary, #fff));
    color: var(--select-text, var(--text-normal, #222));
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 38px;
    font-size: 1em;
  }

  .wa-select-trigger:hover:not(.disabled) {
    border-color: var(--select-border-focus, var(--interactive-accent, #7c5cff));
  }

  .wa-select-trigger.open {
    border-color: var(--select-border-focus, var(--interactive-accent, #7c5cff));
  }

  .wa-select-trigger.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: var(--disabled-background, #f3f3f3);
  }

  .wa-select-value {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .wa-select-label,
  .wa-select-placeholder {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .wa-select-placeholder {
    color: var(--select-placeholder, var(--text-muted, #888));
  }

  .wa-select-controls {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    margin-left: 8px;
  }

  .wa-select-clear {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    background: none;
    color: var(--select-chevron, var(--text-muted, #888));
    cursor: pointer;
    border-radius: 3px;
    transition: background 0.2s;
    font-size: 0.8em;
  }

  .wa-select-clear:hover {
    background: var(--background-modifier-hover, #f0f0f0);
  }

  .wa-select-chevron {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    color: var(--select-chevron, var(--text-muted, #888));
    font-size: 0.7em;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .wa-select-chevron.rotated {
    transform: rotate(180deg);
  }

  .wa-select-dropdown {
    position: fixed;
    z-index: 1000;
    background: var(--select-dropdown-bg, var(--background-secondary, #f6f6f6));
    border: 1px solid var(--select-dropdown-border, var(--background-modifier-border, #e0e0e0));
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.15s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Placement variants */
  .wa-select-dropdown[data-placement*='top'] {
    animation: slideInTop 0.15s ease-out;
  }

  @keyframes slideInTop {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .wa-select-search {
    padding: 8px;
    border-bottom: 1px solid var(--select-dropdown-border, var(--background-modifier-border, #e0e0e0));
  }

  .wa-select-search-input {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid var(--select-border, var(--background-modifier-border, #ccc));
    border-radius: 4px;
    background: var(--select-bg, var(--background-primary, #fff));
    color: var(--select-text, var(--text-normal, #222));
    font-size: 0.95em;
  }

  .wa-select-search-input:focus {
    outline: none;
    border-color: var(--select-border-focus, var(--interactive-accent, #7c5cff));
  }

  .wa-select-list {
    flex: 1;
    overflow-y: auto;
    max-height: 300px;
  }

  /* Custom scrollbar for webkit browsers */
  .wa-select-list::-webkit-scrollbar {
    width: 6px;
  }

  .wa-select-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .wa-select-list::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb-bg, rgba(0, 0, 0, 0.2));
    border-radius: 3px;
  }

  .wa-select-list::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover-bg, rgba(0, 0, 0, 0.3));
  }

  .wa-select-empty {
    padding: 12px 10px;
    text-align: center;
    color: var(--select-placeholder, var(--text-muted, #888));
    font-size: 0.95em;
  }

  .wa-select-option {
    width: 100%;
    padding: 8px 10px;
    border: none;
    background: transparent;
    color: var(--select-text, var(--text-normal, #222));
    text-align: left;
    cursor: pointer;
    transition: background 0.15s;
    font-size: 0.95em;
  }

  .wa-select-option:hover {
    background: var(--select-option-hover, var(--background-modifier-hover, #f0f0ff));
  }

  .wa-select-option.selected {
    background: var(--select-option-active, var(--background-modifier-active, #eaeaff));
  }

  .wa-select-option.active {
    background: var(--select-option-active, var(--background-modifier-active, #eaeaff));
    font-weight: 500;
  }

  /* Dark mode support */
  :global(.theme-dark) .wa-select-trigger {
    border-color: var(--select-border, var(--background-modifier-border, #333));
    background: var(--select-bg, var(--background-primary, #23232b));
    color: var(--select-text, var(--text-normal, #e0e0e0));
  }

  :global(.theme-dark) .wa-select-dropdown {
    background: var(--select-dropdown-bg, var(--background-secondary, #23233a));
    border-color: var(--select-dropdown-border, var(--background-modifier-border, #333));
  }

  :global(.theme-dark) .wa-select-search-input {
    background: var(--select-bg, var(--background-primary, #23232b));
    color: var(--select-text, var(--text-normal, #e0e0e0));
    border-color: var(--select-border, var(--background-modifier-border, #333));
  }
</style>
