import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

export default defineConfig(({ command }) => {
  return {
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    css: {
      transformer: "lightningcss",
    },
    plugins: [
      tsconfigPaths() as any,
      tailwindcss() as any,
      tanstackStart({
        server: { entry: "server" },
      }) as any,
      react(),
      command === "build" ? nitro({ defaultPreset: "cloudflare-module" }) : null,
    ].filter(Boolean) as any,
  };
});
