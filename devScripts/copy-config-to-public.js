#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '..', 'config', 'config.json');
const destDir = path.join(__dirname, '..', 'single-player', 'src', 'public', 'config');
const dest = path.join(destDir, 'config.json');

try {
  if (!fs.existsSync(source)) {
    console.warn(`[copy-config-to-public] Source not found: ${source}`);
    process.exit(0);
  }
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(source, dest);
  console.log(`[copy-config-to-public] Copied ${source} -> ${dest}`);
} catch (err) {
  console.error('[copy-config-to-public] Failed:', err);
  process.exit(1);
}


