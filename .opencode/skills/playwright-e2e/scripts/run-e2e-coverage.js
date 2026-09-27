const { execSync } = require('child_process');
const path = require('path');

process.env.RUN_COVERAGE = 'true';

const root = path.join(__dirname, '..');

try {
  execSync('npx playwright test --project=chromium', {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, RUN_COVERAGE: 'true', NODE_NO_WARNINGS: '1' },
  });
} catch (error) {
  process.exit(error.status || 1);
}

execSync('node scripts/merge-e2e-coverage.js', {
  cwd: root,
  stdio: 'inherit',
});
