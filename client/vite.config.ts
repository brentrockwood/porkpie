import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["tasks.brentrockwood.net", "dh1.lab", "ws5.lab"],
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": process.env.VITE_DEV_PROXY_TARGET ?? "http://localhost:4000",
    },
  },
});
