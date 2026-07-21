import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: true,
    rollupOptions: {
      input: {
        background: "src/background.ts",
        content: "src/content.ts",
        popup: "popup.html",
        suspended: "suspended.html"
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
        format: "es"
      }
    }
  }
});
