#!/usr/bin/env node
/**
 * Check version consistency across all project files.
 * Exits with code 1 if versions don't match.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const sources = {
  'Cargo.toml': () => {
    const content = fs.readFileSync(path.join(ROOT, 'Cargo.toml'), 'utf-8');
    const match = content.match(/^version\s*=\s*"([^"]+)"/m);
    return match ? match[1] : null;
  },
  'package.json': () => {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
    return data.version || null;
  },
  'README.md': () => {
    const content = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf-8');
    const match = content.match(/当前版本:\s*\*\*v([^*]+)\*\*/);
    return match ? match[1] : null;
  },
  'index.html (meta)': () => {
    const content = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');
    const match = content.match(/<meta\s+name="app-version"\s+content="([^"]+)"/);
    return match ? match[1] : null;
  },
  'index.html (footer)': () => {
    const content = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');
    const match = content.match(/游戏版本：v([^<]+)</);
    return match ? match[1] : null;
  }
};

const versions = {};
let hasError = false;

for (const [name, getter] of Object.entries(sources)) {
  try {
    versions[name] = getter();
  } catch (e) {
    console.error(`ERROR: Failed to read ${name}: ${e.message}`);
    hasError = true;
  }
}

const uniqueVersions = [...new Set(Object.values(versions).filter(v => v))];

if (uniqueVersions.length > 1) {
  console.error('ERROR: Version mismatch detected!\n');
  for (const [name, version] of Object.entries(versions)) {
    const marker = version === uniqueVersions[0] ? ' ' : '✗';
    console.error(`  ${marker} ${name}: ${version || '(not found)'}`);
  }
  console.error('\nRun: python scripts/sync-version.py <version>');
  hasError = true;
} else if (uniqueVersions.length === 1) {
  console.log(`Version check passed: v${uniqueVersions[0]}`);
} else {
  console.error('ERROR: Could not find any version information');
  hasError = true;
}

process.exit(hasError ? 1 : 0);
