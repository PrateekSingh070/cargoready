import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const sourcePath = decodeURIComponent(
  new URL("./src", import.meta.url).pathname,
);

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": sourcePath.replace(/^\/([A-Za-z]:\/)/, "$1") } },
  test: { include: ["tests/**/*.test.ts"] },
});
