import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './api-tests/specs',
  timeout: 15_000,
  retries: 1,
  workers: 4,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/api', open: 'never' }],
    ['json', { outputFile: 'reports/api/results.json' }],
  ],
  use: {
    baseURL: process.env.API_BASE_URL ?? 'https://dummyjson.com',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    trace: 'on-first-retry',
  },
});
