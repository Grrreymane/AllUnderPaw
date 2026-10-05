// ============================================================ constants
const W_ = 180, H = 320, OUT = '#1b1622';          // logical pixels (portrait); everything is drawn at this size
const SAVE = 'all-under-paw-';                      // localStorage key prefix — unique per game
const FONT = '"Fusion Pixel","PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",sans-serif';   // Fusion Pixel 12px (proportional) for every text in the game
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const pick = a => a[Math.floor(Math.random() * a.length)];
const chance = p => Math.random() < p;
const R = Math.round;
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function load(k, d) { try { const v = localStorage.getItem(SAVE + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
function save(k, v) { try { localStorage.setItem(SAVE + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function hash2(x, y, s) { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function vnoise(x, y, s, cell) {
  const gx = x / cell, gy = y / cell, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0, sm = t => t * t * (3 - 2 * t);
  const u = sm(fx), v = sm(fy);
  return lerp(lerp(hash2(x0, y0, s), hash2(x0 + 1, y0, s), u), lerp(hash2(x0, y0 + 1, s), hash2(x0 + 1, y0 + 1, s), u), v);
}
