import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './event-tests/specs',
  // Kafka needs más tiempo por el handshake del broker
  timeout: 60_000,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/kafka', open: 'never' }],
  ],
});
