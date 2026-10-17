// Configuracion de Playwright para las pruebas end-to-end (tests/e2e)
const { defineConfig, devices } = require('@playwright/test');

const PORT = process.env.E2E_PORT || 3100;

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // levanta el servidor real del chat antes de las pruebas y lo cierra al terminar
  webServer: {
    command: 'node server.js',
    url: `http://localhost:${PORT}`,
    env: { PORT: String(PORT) },
    reuseExistingServer: false,
    timeout: 30000,
  },
});
