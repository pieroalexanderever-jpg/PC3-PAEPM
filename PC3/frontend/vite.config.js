import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Las peticiones a /api se reenvían al backend: no hace falta configurar CORS en el navegador
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
