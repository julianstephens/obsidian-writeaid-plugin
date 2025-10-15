import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import builtinModules from "builtin-modules";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    svelte({
      preprocess: vitePreprocess(),
      compilerOptions: {
        // Enable compiling components as custom elements when a top-level
        // <svelte:options tag="..." /> is used in the component source.
        customElement: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
      "@/": path.resolve(process.cwd(), "src") + "/",
    },
  },
  ssr: {
    noExternal: ["svelte-select", "svelte-floating-ui"],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: path.resolve(process.cwd(), "src/main.ts"),
      name: "WriteAid",
      fileName: () => "main",
      formats: ["cjs"],
    },
    rollupOptions: {
      external: ["obsidian", ...builtinModules],
      input: path.resolve(process.cwd(), "src/main.ts"),
      output: {
        entryFileNames: "main.js",
        assetFileNames: "styles.css",
      },
    },
  },
});
