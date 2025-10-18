import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import builtins from "builtin-modules";
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    svelte({
      // Use standard Svelte component mode (not custom elements)
      preprocess: vitePreprocess(),
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/main.ts"),
      formats: ["cjs"],
      fileName: "main",
    },
    rollupOptions: {
      external: ["obsidian", ...builtins],
    },
    sourcemap: true,
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  // Force browser environment for Svelte
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    global: "globalThis",
  },
});
