// Wrapper to handle Svelte 5 custom element initialization issues
// This bypasses the custom element lifecycle to avoid reactivity crashes

export function createProjectPanelWrapper() {
  const wrapper = document.createElement('div');
  wrapper.className = 'writeaid-project-panel-wrapper';
  return wrapper;
}

export function initializeProjectPanel(
  element: HTMLElement,
  manager: any,
  projectService: any,
  projectFileService: any,
) {
  // Store references on the element for the component to find
  (element as any)._manager = manager;
  (element as any)._projectService = projectService;
  (element as any)._projectFileService = projectFileService;

  // Create the custom element
  const customElement = document.createElement('writeaid-project-panel');
  (customElement as any)._manager = manager;
  (customElement as any)._projectService = projectService;
  (customElement as any)._projectFileService = projectFileService;

  element.appendChild(customElement);
  return customElement;
}
