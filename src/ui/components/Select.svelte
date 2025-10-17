<script lang="ts">
  import { autoUpdate, flip, offset, shift, size } from '@floating-ui/dom';
  import { ChevronDown, X } from 'lucide-svelte';
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';

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

  // Event dispatcher
  const dispatch = createEventDispatcher();

  // Reactive display label
  $: displayLabel = !value ? placeholder : typeof value === 'string' ? (items.find(i => i.value === value)?.label || value) : (value as any).label || placeholder;

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
        apply({ availableHeight }) {
          Object.assign(dropdownEl.style, {
            maxHeight: `${Math.min(availableHeight - 10, 350)}px`,
            width: `${triggerEl.offsetWidth}px`,
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

    // Dispatch select event using Svelte's event dispatcher
    dispatch('select', item);
  }

  // Clear selection
  function clearSelection(e: Event) {
    e.stopPropagation();
    value = null;
    closeDropdown();

    // Dispatch clear event using Svelte's event dispatcher
    dispatch('clear');
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

  // React to value changes from parent binding
  $: if (value !== undefined) {
    // Ensure selectedIndex is updated when value changes externally
    if (filteredItems.length > 0) {
      const currentValue = getValueString();
      selectedIndex = filteredItems.findIndex(item => item.value === currentValue);
    }
  }

  // Ensure dropdown width matches trigger width
  $: if (isOpen && dropdownEl && triggerEl) {
    dropdownEl.style.width = `${triggerEl.offsetWidth}px`;
    dropdownEl.style.top = `${triggerEl.offsetTop + triggerEl.offsetHeight + 6}px`;
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
        <span class="wa-select-label">{displayLabel}</span>
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
          <X />
        </button>
      {/if}
      {#if showChevron}
        <div class="wa-select-chevron" class:rotated={isOpen}>
          <ChevronDown />
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
