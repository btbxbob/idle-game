// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const isCI = !!process.env.CI;
const runAllBrowsers = isCI || process.env.PW_ALL_BROWSERS === '1';
const testPort = Number(process.env.PW_TEST_PORT || '8080');
const testBaseUrl = `http://localhost:${testPort}`;
const configuredWorkersRaw = process.env.PW_TEST_WORKERS;
const configuredRetriesRaw = process.env.PW_TEST_RETRIES;

let configuredWorkers;
if (configuredWorkersRaw !== undefined && configuredWorkersRaw !== '') {
  configuredWorkers = Number.parseInt(configuredWorkersRaw, 10);
  if (!Number.isInteger(configuredWorkers) || configuredWorkers < 1) {
    throw new Error(`PW_TEST_WORKERS must be a positive integer, got: ${configuredWorkersRaw}`);
  }
}

let configuredRetries;
if (configuredRetriesRaw !== undefined && configuredRetriesRaw !== '') {
  configuredRetries = Number.parseInt(configuredRetriesRaw, 10);
  if (!Number.isInteger(configuredRetries) || configuredRetries < 0) {
    throw new Error(`PW_TEST_RETRIES must be a non-negative integer, got: ${configuredRetriesRaw}`);
  }
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.test.js',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: configuredRetries ?? (isCI ? 1 : 0),
  workers: configuredWorkers ?? (isCI ? 2 : undefined),
  reporter: 'line',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: testBaseUrl,

    trace: process.env.PW_TRACE ? 'on-first-retry' : 'off',
  },

  /* Configure projects for major browsers */
  projects: runAllBrowsers
    ? [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
      ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: `python3 server.py --quiet --port ${testPort}`,
    url: testBaseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },

  /* Filter out monkey tests as they are too slow and intensive */
  grep: /^(?!.*Monkey).*$/i  // Exclude tests with "Monkey" in the name/description
});
