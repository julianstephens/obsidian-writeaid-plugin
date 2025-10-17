# Custom Select Component Documentation

## Overview

A custom select/dropdown component built with Svelte 4 and `@floating-ui/dom` for precise dropdown positioning. This component replaces the previous `svelte-select` dependency with a lightweight, fully customizable alternative.

## Features

- **Floating UI Integration**: Uses `@floating-ui/dom` for intelligent dropdown positioning with automatic placement adjustment
- **Keyboard Navigation**: Full support for arrow keys, Enter, Escape, and Tab
- **Search Functionality**: Optional searchable mode to filter options
- **Dark Mode Support**: Automatic Obsidian light/dark theme detection
- **Accessible**: Proper ARIA roles and keyboard event handling
- **Clearable**: Optional clear button to reset selection
- **Customizable**: Extensive prop-based configuration

## File Location

```
src/ui/components/Select.svelte
```

## Props

| Prop              | Type                       | Default       | Description                            |
| ----------------- | -------------------------- | ------------- | -------------------------------------- |
| `items`           | `Array<{value, label}>`    | `[]`          | Array of selectable options            |
| `value`           | `string \| object \| null` | `null`        | Currently selected value               |
| `placeholder`     | `string`                   | `"Select..."` | Placeholder text when nothing selected |
| `label`           | `string`                   | `""`          | Optional label displayed above select  |
| `disabled`        | `boolean`                  | `false`       | Disable the select                     |
| `searchable`      | `boolean`                  | `false`       | Enable search filtering                |
| `clearable`       | `boolean`                  | `false`       | Show clear button                      |
| `showChevron`     | `boolean`                  | `true`        | Show dropdown chevron icon             |
| `name`            | `string`                   | `""`          | HTML name attribute                    |
| `containerStyles` | `string`                   | `""`          | Inline styles for container            |

## Events

| Event    | Detail           | Description                     |
| -------- | ---------------- | ------------------------------- |
| `select` | `{value, label}` | Fired when an item is selected  |
| `clear`  | -                | Fired when selection is cleared |

## Usage Example

```svelte
<script>
  import Select from "@/ui/components/Select.svelte";

  let selected = null;
  let items = [
    { value: "draft-1", label: "Draft 1" },
    { value: "draft-2", label: "Draft 2" },
  ];

  function handleSelect(e) {
    console.log("Selected:", e.detail);
  }
</script>

<Select
  {items}
  bind:value={selected}
  placeholder="Choose a draft..."
  showChevron={true}
  clearable={true}
  on:select={handleSelect}
/>
```

## CSS Variables (Theming)

The component uses CSS variables for styling and integrates with Obsidian's theme system:

```css
--select-bg: Background color --select-text: Text color --select-placeholder: Placeholder text color
  --select-border: Border color --select-border-focus: Border color when focused
  --select-dropdown-bg: Dropdown background --select-dropdown-border: Dropdown border
  --select-option-hover: Hover state background --select-option-active: Active/selected state
  background --select-chevron: Chevron icon color;
```

These all fall back to Obsidian CSS variables:

- `var(--background-primary, #fff)`
- `var(--text-normal, #222)`
- `var(--text-muted, #888)`
- etc.

## Keyboard Shortcuts

- **Arrow Down**: Navigate to next option
- **Arrow Up**: Navigate to previous option
- **Enter**: Select highlighted option
- **Escape**: Close dropdown
- **Space/Enter** (closed): Open dropdown

## Floating Dropdown Features

The dropdown uses `@floating-ui/dom` for intelligent positioning with the following capabilities:

### Positioning Middleware

1. **Offset** (6px): Maintains consistent spacing between trigger and dropdown
2. **Flip**: Automatically flips dropdown to opposite side if it would overflow viewport
3. **Shift**: Horizontally shifts dropdown to keep it within viewport bounds
4. **Size**: Dynamically adjusts dropdown dimensions based on available viewport space

### Adaptive Behavior

- **Dynamic Height**: Maximum height adapts to available viewport space (max 350px)
- **Width Matching**: Dropdown width matches or exceeds trigger element width
- **Placement Detection**: Automatically tracks placement (top/bottom) for optimized animations
- **Auto-Update**: Repositions in real-time as viewport/trigger changes

### Visual Enhancements

- **Smooth Animations**:
  - Slide-in from top or bottom depending on placement
  - 150ms cubic-bezier animation for smooth appearance
  - Chevron rotates smoothly on open/close
- **Custom Scrollbar**: Styled scrollbar for long option lists
- **Enhanced Shadow**: Multi-layer shadow for depth perception
- **Border Radius**: 8px rounded corners for modern look

- **Custom Events**: Uses `CustomEvent` API for `select` and `clear` events
- **Click Outside**: Closes dropdown when clicking outside
- **Auto-Update**: Positions dropdown reactively with `autoUpdate` from floating-ui

## Browser Compatibility

Works with all modern browsers supporting:

- ES6+ JavaScript
- CSS Grid/Flexbox
- `floating-ui/dom` (all modern browsers)

## Performance Considerations

- **Lazy Positioning**: Dropdown positioning only calculated when open
- **Cleanup**: Floating UI subscriptions properly cleaned up on unmount
- **Filtered List**: Search filters items client-side without re-rendering all DOM

## Integration with ProjectPanel

The Select component is now used in `ProjectPanel.svelte`:

```svelte
<Select
  name="wa-project-select"
  bind:value={selected}
  items={projectOptions}
  placeholder="Choose a project..."
  showChevron={true}
  {disabled}
  clearable={false}
  searchable={false}
  containerStyles="width: 100%;"
  on:select={(e) => {
    const item = e.detail;
    selected = item;
    selectedValue = typeof item === "string" ? item : item.value;
    activeProject = selectedValue ?? null;
    activate(selectedValue ?? null);
  }}
/>
```

## Dependencies

- `@floating-ui/dom`: ^1.7.4
- `svelte`: ^4.2.20

## Future Enhancements

Potential improvements:

- [ ] Virtual scrolling for large lists
- [ ] Multi-select support
- [ ] Option grouping
- [ ] Custom option rendering (slots)
- [ ] Async option loading
- [ ] Type-ahead search
