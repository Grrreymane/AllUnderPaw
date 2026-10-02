'use strict';
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
for (const seed of [7, 42, 2026]) {
  const result = spawnSync(process.execPath, [path.join(__dirname, 'headless.cjs'), root, path.join(root, 'tests/regression.js'), '--seed', String(seed)], { encoding: 'utf8', timeout: 90000 });
  process.stdout.write(result.stdout || ''); process.stderr.write(result.stderr || '');
  if (result.status !== 0 || result.error) { console.error(result.error || 'Regression failed, seed ' + seed); process.exit(1); }
}
