import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/cocycle/",
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
  },
});
