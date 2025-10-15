// Define the expected shape of the WriteAid plugin's manager
interface WriteAidPluginManager {
  activeProject?: unknown;
  addActiveProjectListener?: (cb: (active: unknown) => void) => void;
}

interface WriteAidPlugin {
  manager?: WriteAidPluginManager;
}
// Runtime verbose logging flag. Default is off. Toggle by setting

import { DraftService } from "@/core/DraftService";
import { ProjectService } from "@/core/ProjectService";
import { WRITE_AID_ICON_NAME } from "@/ui/components/icons";
import ProjectPanel from "@/ui/sidepanel/ProjectPanel.svelte";
import { ItemView, Notice, type App, type WorkspaceLeaf } from "obsidian";
import { mount } from "svelte";

// window.__WRITEAID_DEBUG__ = true in the DevTools console at runtime.

export const VIEW_TYPE_PROJECT_PANEL = "writeaid-project-panel";

export class ProjectPanelView extends ItemView {
  app: App;
  projectService: ProjectService;
  draftService: DraftService;
  containerElInner: HTMLElement | null = null;
  selectedProject: string | null = null;
  svelteComponent:
    | {
        $destroy?: () => void;
        destroy?: () => void;
        $set?: (props: object) => void;
        set?: (props: object) => void;
        refreshPanel?: (() => void) | Promise<void>;
        setActiveProject?: ((active: unknown) => void) | ((p: string | null) => void);
        activeProject?: unknown;
        $on?: (event: string, callback: (...args: unknown[]) => void) => void;
      }
    | HTMLElement
    | null = null;

  constructor(leaf: WorkspaceLeaf, app: App) {
    super(leaf);
    this.app = app;
    this.projectService = new ProjectService(app);
    this.draftService = new DraftService(app);
  }

  getViewType(): string {
    return VIEW_TYPE_PROJECT_PANEL;
  }

  getDisplayText(): string {
    return "WriteAid Projects";
  }

  // Return the icon name for the workspace tab. Using 'book' to match the ribbon icon.
  getIcon(): string {
    return WRITE_AID_ICON_NAME;
  }

  async onOpen() {
    this.containerElInner = this.containerEl.createDiv({
      cls: "writeaid-project-panel",
    });

    // mount svelte component (handle both default and direct exports)
    try {
      const Component = (ProjectPanel as { default?: unknown })?.default ?? ProjectPanel;
      if (!Component) {
        new Notice("WriteAid: failed to load project panel component.");
        return;
      }
      // dynamic constructor: Svelte component or custom element
      const props = {
        app: this.app,
        manager: (
          this.app as unknown as { plugins: { getPlugin?: (id: string) => { manager?: unknown } } }
        ).plugins.getPlugin?.("obsidian-writeaid-plugin")?.manager,
        projectService: this.projectService,
        draftService: this.draftService,
      };

      // Prefer mounting as a DOM custom element when possible. This avoids
      // calling into minified Svelte factory shapes and works well when the
      // component is compiled with `customElement: true`.
      let mounted = false;
      let looksLikeHTMLElementClass = false;

      if (looksLikeHTMLElementClass) {
        try {
          // construct custom element instance
          const el = new (Component as { new (): HTMLElement })();
          // set props directly on the element instance
          try {
            (el as { projectService?: ProjectService }).projectService = this.projectService;
          } catch (_e) {
            // ignore }
            /* ignore error */
          }
          try {
            (el as { manager?: unknown }).manager = (
              this.app as unknown as {
                plugins: { getPlugin?: (id: string) => { manager?: unknown } };
              }
            ).plugins.getPlugin?.("obsidian-writeaid-plugin")?.manager;
          } catch (_e) {
            // ignore }
            /* ignore error */
          }
          try {
            (el as { draftService?: DraftService }).draftService = this.draftService;
          } catch (_e) {
            // ignore }
            /* ignore error */
          }
          try {
            (el as { activeProject?: unknown }).activeProject =
              (
                this.app as unknown as {
                  plugins: {
                    getPlugin?: (id: string) => { manager?: { activeProject?: unknown } };
                  };
                }
              ).plugins.getPlugin?.("obsidian-writeaid-plugin")?.manager?.activeProject ?? null;
          } catch (_e) {
            // ignore }
            /* ignore error */
          }
          this.svelteComponent = el;
          mounted = true;
        } catch (elErr) {
          console.warn("WriteAid: creating custom element instance failed:", elErr);
        }
      }

      // If not mounted yet, try to create by known tag name if registered
      if (!mounted && typeof customElements !== "undefined") {
        try {
          const tagName = "wa-project-panel";
          if (customElements.get(tagName)) {
            const el = document.createElement(tagName) as HTMLElement & {
              projectService?: ProjectService;
              manager?: unknown;
              draftService?: DraftService;
              activeProject?: unknown;
            };
            try {
              el.projectService = this.projectService;
            } catch (_e) {
              // ignore }
              /* ignore error */
            }
            try {
              el.manager = (
                this.app as unknown as {
                  plugins: { getPlugin?: (id: string) => { manager?: unknown } };
                }
              ).plugins.getPlugin?.("obsidian-writeaid-plugin")?.manager;
            } catch (_e) {
              // ignore }
              /* ignore error */
            }
            try {
              el.draftService = this.draftService;
            } catch (_e) {
              // ignore }
              /* ignore error */
            }
            try {
              el.activeProject =
                (
                  this.app as unknown as {
                    plugins: {
                      getPlugin?: (id: string) => { manager?: { activeProject?: unknown } };
                    };
                  }
                ).plugins.getPlugin?.("obsidian-writeaid-plugin")?.manager?.activeProject ?? null;
            } catch (_e) {
              // ignore }
              /* ignore error */
            }
            this.svelteComponent = el;
            mounted = true;
          }
        } catch (tagErr) {
          console.warn("WriteAid: attempting to create by tag failed:", tagErr);
        }
      }

      // If custom element mounting didn't work, fall back to a clean runtime mount
      if (!mounted) {
        try {
          // Try Svelte 5 mount API first
          this.svelteComponent = mount(Component as typeof ProjectPanel, {
            target: this.containerElInner!,
            props,
          });
          mounted = true;
        } catch (mountErr) {
          console.warn("WriteAid: svelte.mount failed; trying constructor:", mountErr);
          try {
            this.svelteComponent = new (Component as {
              new (args: { target: HTMLElement; props: object }): unknown;
            })({
              target: this.containerElInner,
              props,
            }) as typeof this.svelteComponent;
            mounted = true;
          } catch (ctorErr) {
            console.error(
              "WriteAid: failed to mount ProjectPanel (mount + constructor failed)",
              ctorErr,
            );
            try {
              console.error("WriteAid: component snapshot:", Component);
            } catch (_e) {
              // ignore }
              /* ignore error */
            }
            new Notice("WriteAid: error mounting project panel component. See console.");
            return;
          }
        }
      }

      // Normalize instance API: some factories return an object with destroy(),
      // others use Svelte's $destroy and $set naming. Provide a thin adapter so
      // the rest of the code can call $destroy/$set/refreshPanel reliably.
      if (this.svelteComponent) {
        // Adapter for destroy
        if (typeof (this.svelteComponent as { destroy?: () => void }).destroy === "function") {
          (this.svelteComponent as { $destroy?: () => void; destroy?: () => void }).$destroy = (
            this.svelteComponent as { destroy?: () => void }
          ).destroy?.bind(this.svelteComponent);
        }
        if (typeof (this.svelteComponent as { set?: (props: object) => void }).set === "function") {
          (
            this.svelteComponent as {
              $set?: (props: object) => void;
              set?: (props: object) => void;
            }
          ).$set = (this.svelteComponent as { set?: (props: object) => void }).set?.bind(
            this.svelteComponent,
          );
        }
        // Some factories return an object with `refreshPanel` directly, others
        // expose methods on the component instance — no change needed.
      }
      // Ensure the component receives the current active project initially
      try {
        const plugin = (
          this.app as App & { plugins?: { getPlugin?: (id: string) => WriteAidPlugin } }
        ).plugins?.getPlugin?.("obsidian-writeaid-plugin");
        const initialActive = plugin?.manager?.activeProject ?? null;
        if (initialActive !== null && this.svelteComponent) {
          // If it's a Svelte instance, prefer $set
          if (
            typeof (this.svelteComponent as { $set?: (props: object) => void }).$set === "function"
          ) {
            try {
              (this.svelteComponent as { $set: (props: { activeProject: unknown }) => void }).$set({
                activeProject: initialActive,
              });
            } catch (_e) {
              // ignore }
              /* ignore error */
            }
          } else if (this.svelteComponent instanceof HTMLElement) {
            try {
              (this.svelteComponent as { activeProject?: unknown }).activeProject = initialActive;
            } catch (_e) {
              // ignore }
              /* ignore error */
            }
          } else if (
            typeof (this.svelteComponent as { set?: (props: object) => void }).set === "function"
          ) {
            try {
              (this.svelteComponent as { set: (props: { activeProject: unknown }) => void }).set({
                activeProject: initialActive,
              });
            } catch (_e) {
              // ignore }
              /* ignore error */
            }
          }
          // If the component exposes a setActiveProject helper, call it as a stronger hook
          if (
            typeof (this.svelteComponent as { setActiveProject?: (active: unknown) => void })
              .setActiveProject === "function"
          ) {
            try {
              (
                this.svelteComponent as { setActiveProject: (active: unknown) => void }
              ).setActiveProject(initialActive);
            } catch (_e) {
              // ignore }
              /* ignore error */
            }
          }
        }
      } catch (_e) {
        // ignore }
        /* ignore error */
      }

      try {
        if (
          this.svelteComponent &&
          typeof (this.svelteComponent as { refreshPanel?: () => void }).refreshPanel === "function"
        ) {
          try {
            (this.svelteComponent as { refreshPanel: () => void }).refreshPanel();
          } catch (_e) {
            // ignore }
            /* ignore error */
          }
        }
        // Some hosts may set the manager.activeProject slightly after the view mounts.
        // Re-apply the active project on the next tick to handle that timing window.
        setTimeout(() => {
          try {
            const plugin = (
              this.app as App & { plugins?: { getPlugin?: (id: string) => WriteAidPlugin } }
            ).plugins?.getPlugin?.("obsidian-writeaid-plugin");
            const deferredActive = plugin?.manager?.activeProject ?? null;
            if (deferredActive && this.svelteComponent) {
              if (
                typeof (this.svelteComponent as { $set?: (props: object) => void }).$set ===
                "function"
              ) {
                try {
                  (
                    this.svelteComponent as { $set: (props: { activeProject: unknown }) => void }
                  ).$set({
                    activeProject: deferredActive,
                  });
                } catch (_e) {
                  // ignore }
                  /* ignore error */
                }
              } else if (this.svelteComponent instanceof HTMLElement) {
                try {
                  (this.svelteComponent as { activeProject?: unknown }).activeProject =
                    deferredActive;
                } catch (_e) {
                  // ignore }
                  /* ignore error */
                }
              } else if (
                typeof (this.svelteComponent as { set?: (props: object) => void }).set ===
                "function"
              ) {
                try {
                  (
                    this.svelteComponent as { set: (props: { activeProject: unknown }) => void }
                  ).set({
                    activeProject: deferredActive,
                  });
                } catch (_e) {
                  // ignore }
                  /* ignore error */
                }
              }
              try {
                if ((this.svelteComponent as { refreshPanel?: () => void }).refreshPanel) {
                  (this.svelteComponent as { refreshPanel: () => void }).refreshPanel();
                }
              } catch (_e) {
                // ignore }
                /* ignore error */
              }
            }
          } catch (_e) {
            // ignore }
            /* ignore error */
          }
        }, 0);
      } catch (_e) {
        // ignore }
        /* ignore error */
      }

      // Register listener to refresh when active project changes
      try {
        const plugin = (
          this.app as App & { plugins?: { getPlugin?: (id: string) => WriteAidPlugin } }
        ).plugins?.getPlugin?.("obsidian-writeaid-plugin");
        if (
          plugin &&
          plugin.manager &&
          typeof plugin.manager.addActiveProjectListener === "function"
        ) {
          plugin.manager.addActiveProjectListener(this.onActiveProjectChanged.bind(this));
        }
      } catch (_e) {
        // ignore }
        /* ignore error */
      }
    } catch (_e) {
      // ignore }
      // Ignore errors in onOpen
    }
  }

  // Add missing method to resolve error
  onActiveProjectChanged() {
    // TODO: Implement active project change handling if needed
  }
}
