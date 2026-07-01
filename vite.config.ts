import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
  server: {
    // Allow the public tunnel hostname (e.g. *.trycloudflare.com) for mobile preview.
    allowedHosts: true,
  },
});
