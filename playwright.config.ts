import { defineConfig, devices } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";

// Load .env.local for tests
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  // Auto-start dev server (or reuse an already running one on :6969).
  webServer: {
    command: "npm run dev -- -p 6969",
    url: "http://localhost:6969",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: {
    baseURL: "http://localhost:6969",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
