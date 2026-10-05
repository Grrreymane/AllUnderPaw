// ============================================================ how a cat looks (genome + seed -> stable details)
const LOOKC = new Map();
function catLook(c) {
  let L = LOOKC.get(c.id); if (L) return L;
  const p = phenotype(c.g), r = mulberry32(c.seed);
  L = Object.assign({}, p);
  L.euC = EU[p.eu]; L.redC = RED[p.red];
  const ORDER = ['chin', 'muzzle', 'blaze', 'cheeks', 'forehead', 'earBase', 'crown'];
  const amt = p.allWhite ? 7 : p.white === 0 ? (r() < .12 ? 1 : 0) : p.white === 1 ? 2 + Math.floor(r() * 3) : 5 + Math.floor(r() * 2);
  L.wz = ORDER.slice(0, amt);
  L.asym = r() < .5 ? -1 : 1;
  L.bias = .3 + r() * .4;
  L.cell = p.white > 0 ? 7 : 5;
  L.jit = Math.floor(r() * 2);
  L.eyeL = L.eyeR = p.eye;
  if (p.allWhite || p.white === 2) { const x = r(); if (x < .35) L.eyeL = L.eyeR = 'blue'; else if (x < .55) L[r() < .5 ? 'eyeL' : 'eyeR'] = 'blue'; }
  L.coat = coatName(p);
  L.seed2 = (c.seed >>> 8) & 0xffff;
  // the main colour used for tiny sprites and swatches
  L.main = p.allWhite ? WHITE : p.point ? '#efe4d2' : p.orange === 'all' ? L.redC : p.agouti ? (p.silver ? '#c9ccd2' : mixHex(L.euC, p.eu === 'black' ? '#b8905e' : '#d8c8b8', .5)) : L.euC;
  L.second = p.orange === 'tortie' ? L.redC : p.point ? L.euC : null;
  LOOKC.set(c.id, L); return L;
}
function isWhiteAt(L, x, y) {
  if (!L.wz.length) return false;
  const n = (vnoise(x, y, L.seed2 || 7, 3) - .5) * 2.2, cx = 16 + L.asym * .5;
  for (const z of L.wz) {
    if (z === 'chin' && y + n > 19.5 && Math.abs(x + .5 - cx) < 3.5) return true;
    if (z === 'muzzle') { const dx = (x + .5 - 16) / 4.6, dy = (y + .5 - 19.2) / 3; if (dx * dx + dy * dy < 1 + n * .2) return true; }
    if (z === 'blaze' && Math.abs(x + .5 - cx - L.asym * .5) < 1.3 + (y > 13 ? 1 : 0) && y > 7 && y < 19) return true;
    if (z === 'cheeks' && y + n > 16.5) return true;
    if (z === 'forehead' && y + n > 11.5 && Math.abs(x + .5 - cx) < 7) return true;
    if (z === 'earBase' && y + n > 9) return true;
    if (z === 'crown') return true;
  }
  return false;
}
// colour of the fur at a head pixel (portrait coordinates); region: 'head' | 'ear' | 'muzzle'
function furAt(L, x, y, region, seed) {
  if (L.allWhite) return WHITE;
  if (region !== 'ear' || L.wz.includes('crown')) { if (isWhiteAt(L, x, y)) return WHITE; }
  let base = L.euC, isOr = false;
  if (L.orange === 'all') { base = L.redC; isOr = true; }
  else if (L.orange === 'tortie' && vnoise(x, y, seed, L.cell) < L.bias) { base = L.redC; isOr = true; }
  let c = base;
  if (L.agouti && !isOr) c = L.silver ? '#c9ccd2' : mixHex(base, L.eu === 'black' ? '#b8905e' : '#d8c8b8', L.eu === 'black' ? .52 : .42);
  if (L.tabby || (isOr && L.orange === 'tortie')) {
    if (stripeAt(L, x, y, region)) c = isOr ? shade(L.redC, -42) : (L.agouti ? (L.silver ? '#4a4d57' : base) : shade(base, -18));
  }
  if (L.point) { const pd = region === 'ear' ? 1 : region === 'muzzle' ? .85 : clamp(1 - Math.hypot((x + .5 - 16) / 6, (y + .5 - 18) / 4.5), 0, .9); c = mixHex('#efe4d2', base, pd); }
  if (region === 'muzzle' && !L.point) c = mixHex(c, '#ffffff', .22);
  return c;
}
function stripeAt(L, x, y, region) {
  if (region !== 'head') return false;
  const j = L.jit, t = L.tabbyType;
  if (y >= 6 && y <= 11) {                     // the "M" on the forehead
    for (const sx of [13, 16, 19]) {
      if (t === 'spot') { if (x === sx && (y & 1)) return true; }
      else if (x === sx + (sx === 16 ? 0 : j * (sx < 16 ? -1 : 1)) || (t === 'tb' && x === sx + 1 && y > 7)) return true;
    }
  }
  const cheek = x <= 9 || x >= 23;
  if (cheek && (y === 15 || y === 17)) return t === 'spot' ? (x & 1) === 0 : true;
  return false;
}

// ============================================================ portraits (32x32) and mini sprites
const PORT = new Map();
function stageOf(c) { const a = ageOf(c); return a < 16 ? 'kit' : a >= 55 ? 'elder' : 'adult'; }
const ROBES = {
  li: ['#94562f', '#d6a23e'], lv: ['#5e3f86', '#c29a52'], qin: ['#2e2029', '#b5312a'], qinPoor: ['#4a3d45', '#8a6a5a'],
  zhao: ['#4f78a8', '#27406b'], zhaoKing: ['#2e2029', '#7a1f24'], wei: ['#4f78a8', '#9dbbd6'], chu: ['#b5312a', '#ecd79a'],
  shi: ['#3f8a5e', '#27406b'], merchant: ['#6f5a43', '#b3a383'], commoner: ['#b3a383', '#6f5a43'], dancer: ['#7a1f24', '#ecd79a'],
  kid: ['#d6a23e', '#f2ead4'], general: ['#6f5a43', '#b5312a'],
};
// what the cat wears: robe/trim colours + headgear, from role, rank, age and sex
function dressOf(c) {
  const st = stageOf(c);
  let robe = ROBES[c.robe] || ROBES[c.house === 'li' ? 'li' : 'commoner'], hat = 'jin';
  if (st === 'kit') return { robe: c.house === 'li' ? ROBES.kid : [shade(robe[0], 20), PAL.su], hat: 'zong', key: 'k' };
  if (c.female) hat = (c.role === 'noble' || c.role === 'ruler' || c.role === 'dancer') ? 'ji' : 'ribbon';
  else if (c.id === W.player || (c.house === 'li' && c.id === W.player)) hat = RANK_HAT[W.rank] || 'jin';
  else hat = ({ ruler: 'gaoguan', noble: 'guan', minister: 'gaoguan', shi: 'bian', hostage: 'guan', general: 'he', merchant: 'jin', commoner: 'jin', dancer: 'ji' })[c.role] || 'jin';
  return { robe, hat, key: hat + robe[0] + st };
}
const RANK_HAT = ['jin', 'bian', 'guan', 'gaoguan', 'gaoguan', 'mian', 'mian'];
function portrait(c) {
  const illustrated = illustratedPortrait(c); if (illustrated) return illustrated;
  const d = dressOf(c), st = stageOf(c), key = c.id + '|' + d.key + (c.dead !== null ? 'x' : '');
  let cv = PORT.get(key); if (cv) return cv;
  const L = catLook(c), kit = st === 'kit', old = st === 'elder', seed = c.seed & 0xffff;
  const earH = clamp(L.ear, -2, 2) * .7, hx = kit ? 10.2 : 9.3 + clamp(L.size, -2, 2) * .35, hy = kit ? 8.6 : 7.7;
  const hcx = 16, hcy = kit ? 16 : 15;
  cv = paint(32, 32, G => {
    // robe + y-shaped crossed collar (outer lapel runs from the viewer's upper right to lower left)
    const [rc, tc] = d.robe;
    G.ell(16, kit ? 36 : 34.5, kit ? 10.5 : 13.5, kit ? 9 : 10, rc);
    G.tri(13.5, 24, 18.5, 24, 16, 28.5, PAL.su);
    for (let i = 0; i < 9; i++) { G.set(19 - i, 24 + i, tc); G.set(20 - i, 24 + i, tc); }
    for (let i = 0; i < 4; i++) { G.set(12 + i, 24 + i, tc); }
    if (!kit && (d.hat === 'gaoguan' || d.hat === 'mian' || d.hat === 'guan')) { G.set(7, 31, PAL.jade); G.set(8, 30, PAL.jade); }
    // back-of-head bun for noble ladies
    if (d.hat === 'ji') G.ell(16, 5.5, 4.2, 3, shade(furAt(L, 16, 5, 'ear', seed), -18));
    // head
    const f = (x, y) => furAt(L, x, y, 'head', seed);
    G.ell(hcx, hcy, hx, hy, f);
    if (L.long) { G.tri(hcx - hx - 1.5, hcy + 3, hcx - hx + 2, hcy + 1, hcx - hx + 2, hcy + 6, f); G.tri(hcx + hx + 1.5, hcy + 3, hcx + hx - 2, hcy + 1, hcx + hx - 2, hcy + 6, f); }
    // headgear that sits on the crown (ears poke through the cloth)
    if (d.hat === 'jin') G.ell(16, hcy - hy + 1.6, 5.2, 2.6, d.robe[1] === PAL.su ? PAL.he : shade(rc, -25));
    if (d.hat === 'bian') G.ell(16, hcy - hy + 1.2, 4.2, 2.8, PAL.xuan);
    // ears
    const ear = (sx) => {
      const bx = 16 + sx * (hx - 2.3), ix = 16 + sx * (hx - 7.2), tx = 16 + sx * (hx - 1.2), ty = hcy - hy - 4.2 - earH;
      G.tri(bx + sx * 1.6, hcy - 2.5, ix, hcy - hy + 1.5, tx, ty, (x, y) => furAt(L, x, y, 'ear', seed));
      G.tri(bx + sx * .2, hcy - 3.2, ix + sx * 1.6, hcy - hy + 2.4, tx - sx * .6, ty + 2.6, L.eu === 'black' && !L.allWhite ? '#b07a86' : '#f0a4ae');
    };
    ear(-1); ear(1);
    // muzzle
    G.ell(16, hcy + 4.2, 4.3, 2.6, (x, y) => furAt(L, x, y, 'muzzle', seed));
    // eyes
    const er = kit ? 2.4 : 2;
    eyeG(G, 12.4, hcy + .2, er, EYE[L.eyeL], kit ? 'round' : 'slit');
    eyeG(G, 19.6, hcy + .2, er, EYE[L.eyeR], kit ? 'round' : 'slit');
    if (old) { G.rect(10, hcy - 2.4 | 0, 5, 1, shade(f(12, 12), -30)); G.rect(18, hcy - 2.4 | 0, 5, 1, shade(f(20, 12), -30)); }
    // nose + mouth
    const ny = Math.round(hcy + 3);
    G.set(15, ny, '#e88a98'); G.set(16, ny, '#e88a98'); G.set(17, ny, '#e88a98'); G.set(16, ny + 1, '#c86a7a');
    const mc = lum(f(16, ny + 2)) > .55 ? '#8a6a70' : '#1b1622';
    G.set(15, ny + 2, mc); G.set(17, ny + 2, mc);
    // headgear in front
    if (d.hat === 'zong') { for (const sx of [12.3, 19.7]) { G.ell(sx, hcy - hy + 1.2, 1.8, 1.6, shade(f(sx | 0, 9), -15)); G.set(sx | 0, (hcy - hy + 2.6) | 0, PAL.lacq); } }
    if (d.hat === 'guan') { G.ell(16, hcy - hy + .4, 2.2, 2, shade(f(16, 9), -12)); G.rect(14, (hcy - hy - 3) | 0, 5, 3, PAL.ink); G.rect(11, (hcy - hy - 1) | 0, 11, 1, PAL.gold); }
    if (d.hat === 'gaoguan') { G.ell(16, hcy - hy + .4, 2.2, 2, shade(f(16, 9), -12)); G.tri(13.5, hcy - hy + 1, 19, hcy - hy + 1, 18.5, 0, PAL.ink); G.rect(14, (hcy - hy - 1) | 0, 5, 1, PAL.lacq); }
    if (d.hat === 'mian') { G.rect(7, 2, 19, 2, PAL.ink); G.rect(7, 2, 19, 1, PAL.lacq); for (let x = 9; x <= 23; x += 3) { G.rect(x, 4, 1, 3, PAL.ink); G.set(x, 7, PAL.jade); } }
    if (d.hat === 'ji') { G.rect(9, 5, 15, 1, PAL.gold); G.set(8, 5, PAL.jade); G.set(24, 5, PAL.lacq); }
    if (d.hat === 'ribbon') { const by = hcy - hy + 1.5; G.tri(12, by - 2, 16, by, 12, by + 2, '#f08aa8'); G.tri(20, by - 2, 16, by, 20, by + 2, '#f08aa8'); G.rect(15, R(by - 1), 2, 2, '#c8506e'); }
    if (d.hat === 'he') { G.ell(16, hcy - hy + 1.2, 4.2, 2.6, PAL.he); for (let i = 0; i < 5; i++) { G.set(20 + i, hcy - hy - i, PAL.xuan); G.set(12 - i, hcy - hy - i, PAL.xuan); } G.set(25, hcy - hy - 5, PAL.su); G.set(7, hcy - hy - 5, PAL.su); }
    if (old) G.map((x, y, c0) => (y > hcy + 2 && y < hcy + 7 && Math.abs(x - 16) < 5 && c0 !== '#e88a98' && hash2(x, y, seed) < .35) ? mixHex(c0, '#d8d8d8', .55) : null);
  });
  // whiskers go on after painting so the outline pass doesn't fatten them
  const x = cv.getContext('2d'), wl = 2 + clamp(Math.round(L.whisk), -1, 2) + (old ? 1 : 0), ny = Math.round(hcy + 4);
  const wc = old ? '#ffffff' : lum(L.main) > .6 ? '#8a7f86' : '#efe9df';
  x.fillStyle = '#ffffff'; x.fillRect(11, R(hcy - 1), 1, 1); x.fillRect(18, R(hcy - 1), 1, 1);
  x.fillStyle = wc;
  for (let i = 0; i < wl + 2; i++) { x.fillRect(11 - i, ny - (i >> 1), 1, 1); x.fillRect(21 + i, ny - (i >> 1), 1, 1); x.fillRect(11 - i, ny + 1 + (i >> 2), 1, 1); x.fillRect(21 + i, ny + 1 + (i >> 2), 1, 1); }
  if (c.dead !== null) { x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(40,36,48,.55)'; x.fillRect(0, 0, 32, 32); }
  if (PORT.size > 300) PORT.clear();
  PORT.set(key, cv); return cv;
}
// small full-body sprite for scenes (16x22)
const MINI = new Map();
function mini(c) {
  const d = dressOf(c), key = c.id + '|' + d.key;
  let cv = MINI.get(key); if (cv) return cv;
  const L = catLook(c), kit = stageOf(c) === 'kit', seed = c.seed & 0xffff;
  const hc = (x, y) => L.allWhite ? WHITE : (L.wz.length >= 5 && y > 7) ? WHITE : (L.second && hash2(x >> 1, y >> 1, seed) < L.bias) ? L.second : L.main;
  cv = paint(16, 22, G => {
    const top = kit ? 6 : 1;
    // tail
    for (let i = 0; i < 5; i++) G.set(12 + (i > 2 ? 1 : 0), 13 + i, L.main);
    // robe
    G.rect(4, top + 10, 8, kit ? 6 : 10, d.robe[0]);
    G.rect(3, top + 12, 10, kit ? 3 : 6, d.robe[0]);
    for (let i = 0; i < 5; i++) G.set(9 - i, top + 10 + i, d.robe[1]);
    G.rect(4, top + 14, 8, 1, d.robe[1]);
    G.set(5, kit ? 21 : 21, PAL.ink); G.set(10, 21, PAL.ink);
    // head
    G.ell(8, top + 6, 5, 4.4, hc);
    G.tri(3.5, top + 5, 6, top + 3, 3.8, top - .5, L.main); G.tri(12.5, top + 5, 10, top + 3, 12.2, top - .5, L.main);
    if (L.agouti && !L.allWhite) { G.set(7, top + 3, shade(L.main, -40)); G.set(9, top + 3, shade(L.main, -40)); }
    G.set(6, top + 6, OUT); G.set(10, top + 6, OUT);
    G.set(8, top + 7, '#e88a98');
    if (d.hat === 'jin' || d.hat === 'bian' || d.hat === 'he') G.rect(6, top + 1, 5, 2, d.hat === 'jin' ? shade(d.robe[0], -25) : PAL.xuan);
    if (d.hat === 'guan' || d.hat === 'gaoguan') G.rect(7, top - (d.hat === 'gaoguan' ? 3 : 1), 3, d.hat === 'gaoguan' ? 4 : 2, PAL.ink);
    if (d.hat === 'mian') { G.rect(3, top, 11, 1, PAL.ink); G.set(5, top + 1, PAL.jade); G.set(11, top + 1, PAL.jade); }
    if (d.hat === 'ji') G.rect(5, top + 1, 7, 1, PAL.gold);
    if (d.hat === 'ribbon') G.set(4, top + 3, PAL.lacq);
    if (d.hat === 'zong') { G.set(6, top + 1, PAL.lacq); G.set(10, top + 1, PAL.lacq); }
  });
  MINI.set(key, cv); return cv;
}
