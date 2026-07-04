import { defineConfig } from "@playwright/test";

const origin = "http://127.0.0.1:4179";

export default defineConfig({
  testDir: "./tests/browser",
  reporter: "list",
  use: { baseURL: origin, trace: "retain-on-failure" },
  projects: [
    {
      name: "mobile-360",
      use: {
        browserName: "chromium",
        viewport: { width: 360, height: 800 },
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: "tablet-768",
      use: { browserName: "chromium", viewport: { width: 768, height: 1024 } },
    },
    {
      name: "desktop-1280",
      use: { browserName: "chromium", viewport: { width: 1280, height: 900 } },
    },
  ],
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4179 --strictPort",
    url: origin,
    timeout: 30_000,
  },
});
