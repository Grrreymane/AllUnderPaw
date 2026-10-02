'use strict';
// The HTML remains directly playable. Only these marked modules are maintained in src/.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'index.html');
const original = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
let html = original;
for (const name of ['art-manifest', 'art', 'dynasty', 'persistence']) {
  const start = '// ==== source:src/' + name + '.js ====';
  const end = '// ==== end source:src/' + name + '.js ====';
  const a = html.indexOf(start), b = html.indexOf(end, a);
  if (a < 0 || b < 0) throw new Error('Missing inline boundaries for ' + name);
  const source = fs.readFileSync(path.join(root, 'src', name + '.js'), 'utf8').replace(/\r\n/g, '\n').trimEnd();
  html = html.slice(0, a) + start + '\n' + source + '\n' + html.slice(b);
}
if (process.argv.includes('--check')) {
  if (html !== original) { console.error('Inline modules are stale. Run npm run sync.'); process.exitCode = 1; }
  else console.log('Inline modules match src/.');
} else { fs.writeFileSync(file, html); console.log('Updated inline modules in index.html.'); }
