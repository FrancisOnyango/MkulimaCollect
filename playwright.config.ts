import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src',
  testMatch: /.*e2e.*|.*e2e_.*|.*e2e.spec.*/,
  timeout: 30_000,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
});
