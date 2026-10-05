'use strict';
// Packaging failures must not overwrite a playable build or silently omit a rule file.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { sync } = require('../tools/sync-inline.cjs');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'paw-source-layout-'));
const write = (file, text) => fs.writeFileSync(path.join(root, file), text);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const manifest = ['src/first.js', 'src/nested/second.js'];
const block = (file, body) => `// ==== source:${file} ====\n${body}// ==== end source:${file} ====\n`;
const initial = '<script>\n' + block(manifest[0], 'oldFirst();\n') + block(manifest[1], 'oldSecond();\n') + '</script>\n';
let checks = 0;
function reset() {
  write('src/modules.json', JSON.stringify(manifest));
  write(manifest[0], 'first();\n\n');
  write(manifest[1], 'second();\n');
  write('index.html', initial);
}
function rejects(change, pattern) {
  reset(); change(); const before = read('index.html');
  assert.throws(() => sync(root), pattern);
  assert.equal(read('index.html'), before, 'A rejected build must preserve the full published file');
  checks++;
}
try {
  fs.mkdirSync(path.join(root, 'src/nested'), { recursive: true });
  reset();
  assert.throws(() => sync(root, true), /stale/); assert.equal(read('index.html'), initial); checks++;
  assert.equal(sync(root), 2);
  const built = read('index.html');
  assert.equal(built, '<script>\n' + block(manifest[0], 'first();\n\n') + block(manifest[1], 'second();\n') + '</script>\n');
  sync(root); assert.equal(read('index.html'), built); sync(root, true); checks++;
  write('index.html', built.replace(/\n/g, '\r\n'));
  write(manifest[0], 'first();\r\n\r\n'); sync(root, true); checks++;
  rejects(() => write('src/modules.json', JSON.stringify([...manifest].reverse())), /order/);
  rejects(() => write('src/modules.json', JSON.stringify([manifest[0], manifest[0]])), /duplicate/);
  rejects(() => write('src/modules.json', JSON.stringify(['src/../outside.js'])), /Invalid/);
  rejects(() => write('index.html', initial.replace(block(manifest[1], 'oldSecond();\n'), '')), /boundaries/);
  rejects(() => write('index.html', initial + block(manifest[0], 'duplicate();\n')), /boundaries/);
  rejects(() => write(manifest[1], 'second();'), /newline/);
  rejects(() => write(manifest[1], block(manifest[0], 'nested();\n')), /markers/);
  rejects(() => fs.unlinkSync(path.join(root, manifest[1])), /ENOENT/);
  rejects(() => write('src/unregistered.js', 'forgottenRule();\n'), /Unregistered/);
  console.log(`PASS: ${checks} source layout checks; ordered assembly, stale output, missing/duplicate sources, line endings and failed-sync preservation.`);
} finally {
  // Only remove the exact fresh temporary directory created above.
  assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
  assert.ok(path.basename(root).startsWith('paw-source-layout-'));
  fs.rmSync(root, { recursive: true, force: true });
}
