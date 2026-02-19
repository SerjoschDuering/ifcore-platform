import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "path";

export default defineConfig({
  plugins: [
    TanStackRouterVite({ routesDirectory: "src/routes", generatedRouteTree: "src/routeTree.gen.ts" }),
    react(),
    cloudflare(),
  ],
  resolve: {
    alias: [
      { find: /^@\//, replacement: `${path.resolve(__dirname, "src")}/` },
      // Route only the bare "web-ifc" import to our shim.
      // Keep subpath imports (e.g. web-ifc/*.wasm) resolving to the package.
      { find: /^web-ifc$/, replacement: path.resolve(__dirname, "src/lib/web-ifc-shim.ts") },
    ],
  },
  optimizeDeps: {
    exclude: ["@thatopen/components", "@thatopen/components-front", "@thatopen/fragments"],
  },
});
