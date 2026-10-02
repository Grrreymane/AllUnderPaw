#!/usr/bin/env node
// Run a template-based game's logic in Node, without a browser, and inject a test script into its closure.
//
//   node tools/headless.cjs <gameDir> <script.js> [--seed N] [-- args...]
//
// The script is pasted in place of the /*TEST_HOOK*/ marker (right before the game loop starts), so it can call
// every function and read every variable of the game directly (newGame(), endSeason(), W, render() ...).
// Inside the script: console.log works; `ARGS` holds the extra args; call `done()` (optional) when finished.
// Canvas / DOM / fonts / audio are stubbed: drawing calls are no-ops, measureText gives CJK = 1em, ASCII = 0.55em.
// With --seed N, Math.random is replaced by a seeded generator so runs are reproducible.
// Logic checks use isolated DOM/storage stubs; real rendering is checked by tests/browser.cjs.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');

const argv = process.argv.slice(2);
const dd = argv.indexOf('--');
const extra = dd >= 0 ? argv.slice(dd + 1) : [];
const main = dd >= 0 ? argv.slice(0, dd) : argv;
let seed = null;
const si = main.indexOf('--seed'); if (si >= 0) { seed = +main[si + 1]; main.splice(si, 2); }
const [gameDir, scriptPath] = main;
if (!gameDir || !scriptPath) { console.error('usage: node headless.js <gameDir> <script.js> [--seed N] [-- args]'); process.exit(2); }

const html = fs.readFileSync(path.join(gameDir, 'index.html'), 'utf8');
// the game script is the <script> that contains the TEST_HOOK marker
const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = blocks.find(b => b.includes('/*TEST_HOOK*/'));
if (!code) { console.error('no <script> with /*TEST_HOOK*/ found'); process.exit(2); }
const test = fs.readFileSync(scriptPath, 'utf8');
code = code.replace('/*TEST_HOOK*/', '\n;(function(){ try {\n' + test + '\n} catch (e) { console.log("TEST ERROR: " + (e && e.stack || e)); process.exitCode = 1; } })(); return;\n');

// ------------------------------------------------------------------ stubs
const noop = () => {};
function ctx2d() {
  const c = {
    canvas: null, font: '10px sans-serif', fillStyle: '#000', strokeStyle: '#000', globalAlpha: 1, lineWidth: 1,
    imageSmoothingEnabled: false, globalCompositeOperation: 'source-over', textAlign: 'left', textBaseline: 'alphabetic', lineJoin: 'miter',
    measureText(s) { const px = parseFloat(this.font) || 10; let w = 0; for (const ch of String(s)) w += ch.charCodeAt(0) < 128 ? .55 : 1; return { width: w * px }; },
    getImageData(x, y, w, h) { return { width: w, height: h, data: new Uint8ClampedArray(Math.max(0, w * h * 4)) }; },
    createImageData(w, h) { return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }; },
    createLinearGradient() { return { addColorStop: noop }; }, createRadialGradient() { return { addColorStop: noop }; },
    createPattern() { return {}; },
  };
  for (const k of ['fillRect', 'clearRect', 'strokeRect', 'drawImage', 'fillText', 'strokeText', 'beginPath', 'closePath', 'moveTo', 'lineTo', 'arc', 'ellipse', 'rect',
    'fill', 'stroke', 'clip', 'save', 'restore', 'setTransform', 'translate', 'scale', 'rotate', 'putImageData', 'quadraticCurveTo', 'bezierCurveTo', 'resetTransform'])
    c[k] = noop;
  return c;
}
function element(tag) {
  const el = {
    tagName: String(tag).toUpperCase(), style: {}, width: 300, height: 150, children: [], textContent: '', innerHTML: '', id: '',
    appendChild(ch) { this.children.push(ch); return ch; }, removeChild: noop, remove: noop, setAttribute: noop, addEventListener: noop, removeEventListener: noop,
    getBoundingClientRect() { return { left: 0, top: 0, width: 360, height: 640, right: 360, bottom: 640 }; },
    click: noop, focus: noop,
  };
  if (el.tagName === 'CANVAS') { let cx = null; el.getContext = () => (cx || (cx = Object.assign(ctx2d(), { canvas: el }))); el.toDataURL = () => 'data:,'; el.toBlob = f => f && f(null); }
  return el;
}
const els = {};
const storage = new Map();
const document = {
  currentScript: { textContent: code },
  createElement: element,
  getElementById(id) { return els[id] || (els[id] = Object.assign(element(id === 'c' ? 'canvas' : 'div'), { id })); },
  querySelector: () => null, addEventListener: noop, removeEventListener: noop,
  body: element('body'), head: element('head'), hidden: false, title: '',
  fonts: { ready: Promise.resolve(), load: () => Promise.resolve(), addEventListener: noop, check: () => true },
};
class Image { constructor() { this.complete = false; this.naturalWidth = 0; this.onload = null; } set src(v) { this._src = v; } get src() { return this._src; } }
const window = {
  addEventListener: noop, removeEventListener: noop, devicePixelRatio: 1, innerWidth: 360, innerHeight: 640,
  AudioContext: undefined, webkitAudioContext: undefined, __gameErr: m => console.log('GAME ERR: ' + m),
};
const localStorage = { getItem: k => storage.has(k) ? storage.get(k) : null, setItem: (k, v) => storage.set(k, String(v)), removeItem: k => storage.delete(k), clear: () => storage.clear() };
let rng = null;
if (seed !== null) { let a = seed >>> 0; rng = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const MathX = Object.create(Math); if (rng) MathX.random = rng;
let clock = 0;
const sandbox = {
  window, document, localStorage, Image, navigator: { userAgent: 'headless', share: undefined, clipboard: undefined },
  location: { hash: '', href: 'http://localhost/', search: '', reload: noop },
  performance: { now: () => clock },
  requestAnimationFrame: noop, cancelAnimationFrame: noop,
  setTimeout: (f, ms) => setTimeout(f, 0), clearTimeout, setInterval: noop, clearInterval: noop,
  getComputedStyle: () => ({ paddingLeft: '0', paddingRight: '0', paddingTop: '0', paddingBottom: '0' }),
  console, Math: MathX, ARGS: extra, process, require,
  done: () => {},
  fetch: (u) => Promise.resolve({ text: () => Promise.resolve(fs.readFileSync(path.join(gameDir, String(u).split('?')[0]), 'utf8')), json: () => Promise.resolve(JSON.parse(fs.readFileSync(path.join(gameDir, String(u).split('?')[0]), 'utf8'))) }),
  Blob: class {}, URL: { createObjectURL: () => '' },
};
sandbox.globalThis = sandbox; window.document = document; window.localStorage = localStorage;
sandbox.tick = ms => { clock += ms; };
vm.createContext(sandbox);
try { vm.runInContext(code, sandbox, { filename: 'index.html', timeout: 60000 }); }
catch (e) { console.log('LOAD ERROR: ' + (e && e.stack || e)); process.exitCode = 1; }
