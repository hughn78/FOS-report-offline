import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    tsconfigPaths(),
    electron([
      {
        entry: "electron/main.ts",
        onstart: (options) => {
          if (options.startup) {
            options.startup();
          }
        },
      },
      {
        entry: "electron/preload.ts",
        onstart: (options) => {
          options.reload();
        },
      },
    ]),
    renderer(),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
