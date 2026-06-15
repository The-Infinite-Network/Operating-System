import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: ["inos.theinfinitenetwork.com"],
    proxy: {
      "/mcp": {
        target: "http://localhost:3002",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mcp/, ""),
      },
      "/api": {
        target: "http://localhost:3005",
        changeOrigin: true,
      },
    },
  },
});
