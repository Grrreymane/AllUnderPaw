// ============================================================ pixel painter (from the workflow template)
class Grid {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Array(w * h).fill(null); }
  set(x, y, c) { x |= 0; y |= 0; if (c && x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c; }
  get(x, y) { return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? null : this.d[y * this.w + x]; }
  ell(cx, cy, rx, ry, c) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) this.set(x, y, typeof c === 'function' ? c(x, y) : c);
    }
  }
  rect(x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, typeof c === 'function' ? c(i, j) : c); }
  tri(ax, ay, bx, by, cx, cy, c) {
    const e = (px, py, qx, qy, rx, ry) => (qx - px) * (ry - py) - (qy - py) * (rx - px);
    const x0 = Math.floor(Math.min(ax, bx, cx)), x1 = Math.ceil(Math.max(ax, bx, cx));
    const y0 = Math.floor(Math.min(ay, by, cy)), y1 = Math.ceil(Math.max(ay, by, cy));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + .5, py = y + .5, w0 = e(bx, by, cx, cy, px, py), w1 = e(cx, cy, ax, ay, px, py), w2 = e(ax, ay, bx, by, px, py);
      if ((w0 >= 0 && w1 >= 0 && w2 >= 0) || (w0 <= 0 && w1 <= 0 && w2 <= 0)) this.set(x, y, typeof c === 'function' ? c(x, y) : c);
    }
  }
  map(fn) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const c = this.get(x, y); if (c) this.d[y * this.w + x] = fn(x, y, c) || c; } }
  outline(col = OUT) {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++)
      if (!this.get(x, y) && (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1))) add.push([x, y]);
    add.forEach(([x, y]) => this.set(x, y, col));
  }
  autoShade() {
    const src = this.d.slice(), at = (x, y) => (x < 0 || y < 0 || x >= this.w || y >= this.h) ? null : src[y * this.w + x];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const c = at(x, y); if (!c || c === OUT) continue;
      const u = at(x, y - 1), d = at(x, y + 1), l = at(x - 1, y), r = at(x + 1, y);
      if (u !== c && d !== c && l !== c && r !== c) continue;
      if (!u || (!l && u !== c)) this.d[y * this.w + x] = shade(c, 18);
      else if (!d || !r) this.d[y * this.w + x] = shade(c, -20);
    }
  }
  selOutline() {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y)) continue;
      const below = this.get(x, y + 1), n = below || this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1);
      if (n) add.push([x, y, mixHex(n, OUT, below ? .6 : .78)]);
    }
    add.forEach(([x, y, c]) => this.set(x, y, c));
  }
  canvas() {
    const c = mk(this.w, this.h), x = c.getContext('2d');
    for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) { const col = this.d[j * this.w + i]; if (col) { x.fillStyle = col; x.fillRect(i, j, 1, 1); } }
    return c;
  }
}
function paint(w, h, fn, outline = true) {
  const G = new Grid(w, h); fn(G);
  if (outline === 'plain') G.outline(); else if (outline) { G.autoShade(); G.selOutline(); }
  return G.canvas();
}
function shade(hex, a) { const n = parseInt(hex.slice(1), 16), c = v => clamp(v + a, 0, 255); return '#' + ((1 << 24) | (c(n >> 16) << 16) | (c((n >> 8) & 255) << 8) | c(n & 255)).toString(16).slice(1); }
function mixHex(a, b, t) {
  const p = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)], A = p(a), B = p(b);
  return '#' + A.map((v, i) => R(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
function lum(hex) { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * .3 + ((n >> 8) & 255) * .59 + (n & 255) * .11) / 255; }
function rows(rs, pal, outline = true) { return paint(rs[0].length + 2, rs.length + 2, G => rs.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) G.set(x + 1, y + 1, pal[ch]); })), outline && 'plain'); }
function eyeG(G, x, y, r, iris, pupil = 'round') {
  G.ell(x, y, r + 1, r + 1, OUT); G.ell(x, y, r, r, (px, py) => py + .5 > y + r * .25 ? shade(iris, -34) : iris);
  if (pupil === 'slit') G.rect(R(x - .5), R(y - r * .7), 1, Math.max(2, R(r * 1.4)), OUT); else if (pupil === 'round') G.ell(x + .3, y + .2, Math.max(.8, r * .45), Math.max(.8, r * .5), OUT);
}

// ============================================================ palette (docs/visual.md)
const PAL = {
  ink: '#16121a', xuan: '#2e2029', zibrown: '#4a3530', jiang: '#7a1f24', lacq: '#b5312a', cinna: '#e0513c', lead: '#e8864a',
  ochre: '#94562f', zhi: '#d6a23e', silk: '#ecd79a', su: '#f2ead4', hemp: '#b3a383', he: '#6f5a43', indigo: '#27406b',
  qing: '#4f78a8', piao: '#9dbbd6', shilv: '#3f8a5e', fenlv: '#9ccb98', purple: '#5e3f86', lpurple: '#9a7bbd',
  bronzeD: '#7d5a2e', bronze: '#c29a52', gold: '#f0cc5c', jade: '#a9c9a4', jadeW: '#dde6c8', earthD: '#8f6d48', earth: '#c7a574',
  wood: '#5e3524', tile: '#4d4e57', tileL: '#8a8c96',
};
