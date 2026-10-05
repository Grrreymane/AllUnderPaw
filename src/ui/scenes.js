// ============================================================ scenes (180x112, painted once per place+season)
const SCN = new Map();
function scene(loc) {
  const season = W ? W.t % 4 : 0, key = loc + season + (W && W.city || '');
  let c = SCN.get(key); if (c) return c;
  c = mk(180, 112); const s = c.getContext('2d');
  // 咸阳 (its own places, and every tab while the house lives there) is 邯郸's painter in 秦's colours: black-lacquer
  // roofs, vermilion pillars, loess ground under a dusty sky, black banners
  const XS = { xmarket: 'market', xpalace: 'palace', xgate: 'gate', xtavern: 'tavern', xlvfu: 'lvfu', hougong: 'lvfu', camp: 'gate' };
  const QC = ['xianyang', 'henan', 'shu'], shu = !!W && W.city === 'shu';
  const place = loc, qin = !!XS[loc] || (!!W && QC.includes(W.city) && ['home', 'market', 'palace', 'tavern', 'gate'].includes(loc));
  loc = XS[loc] || loc;
  const TI = qin ? '#26212c' : PAL.tile, TL = qin ? '#4e4858' : PAL.tileL, LQ = qin ? '#cc3a20' : PAL.lacq;
  const F = (x, y, w, h, col) => { s.fillStyle = col; s.fillRect(x, y, w, h); };
  let sky = [['#9dbbd6', '#b8d0e2', '#d4e2ea'], ['#8ab8e0', '#a8cce8', '#cfe4f0'], ['#c9b89a', '#dccaa8', '#ecdcc0'], ['#a8b0bc', '#c0c6ce', '#d8dce2']][season];
  if (qin) sky = sky.map(x => mixHex(x, shu ? '#a8c8b0' : '#e6cc98', .3));
  // Art direction (after the 光速逃亡 pass): light from the upper left; every material is a ramp of 3–4 flat tones with
  // hard edges; tone changes are dithered (4x4 Bayer), never blurred; things touch the ground with a contact shadow;
  // far things are paler and bluer. All of it is painted once per place and season, then cached.
  const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], bay = (x, y) => BAY[(y & 3) * 4 + (x & 3)] / 16;
  // a vertical ramp between colours, dithered where the tones meet
  const ramp = (x0, y0, w, h, cols) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const t = y / Math.max(1, h - 1) * (cols.length - 1), i = Math.min(cols.length - 1, Math.floor(t + bay(x0 + x, y0 + y) * .999)); F(x0 + x, y0 + y, 1, 1, cols[i]); } };
  const SH = a => 'rgba(20,12,24,' + a + ')', HL = a => 'rgba(255,244,214,' + a + ')';
  ramp(0, 0, 180, 60, [sky[0], sky[0], sky[1], sky[2], sky[2]]); F(0, 60, 180, 52, sky[2]);
  if (loc !== 'tavern') {
    // a pale sun (a low white one in winter), flat-bottomed clouds, two ranges of hills
    const sx = 150, sy = season === 3 ? 16 : 11; s.fillStyle = season === 2 ? '#ffe9b0' : '#fff8e0'; s.beginPath(); s.arc(sx, sy, 5, 0, 7); s.fill(); s.fillStyle = HL(.25); s.beginPath(); s.arc(sx, sy, 8, 0, 7); s.fill();
    const cloud = (cx, cy, n, sd) => { for (let i = 0; i < n; i++) { const w = 8 + (hash2(i, sd, 21) * 12 | 0), h = 2 + (hash2(i, sd, 22) * 3 | 0), ox = (hash2(i, sd, 23) * 22 | 0) - 11; F(cx + ox - (w >> 1), cy - h, w, h, mixHex(sky[2], '#ffffff', .75)); } F(cx - 14, cy, 28, 1, mixHex(sky[1], '#ffffff', .35)); };
    cloud(34, 14, 5, 1); cloud(96, 9, 4, 2); if (season !== 1) cloud(128, 22, 3, 3);
    const hills = (base, amp, col, sd) => { for (let x = 0; x < 180; x++) { const h = R(amp * (.55 + .45 * Math.sin(x / 23 + sd) * Math.sin(x / 9.5 + sd * 2)) + vnoise(x, sd, 31, 6) * 3); F(x, base - h, 1, h + 112 - base, col); } };
    hills(40, 9, mixHex(sky[1], qin ? '#b89868' : '#7888a0', .35), 1.3); hills(44, 6, mixHex(sky[1], qin ? '#a08050' : '#5f7a6a', .5), 4.1);
    // the plain between the hills and the place itself: pale earth, so nothing floats
    ramp(0, 52, 180, 60, [mixHex(qin ? '#d6b676' : '#b89868', sky[1], .45), mixHex(qin ? '#d6b676' : '#b89868', sky[1], .2)]);
  }
  const ram = (x, y, w, h, dark) => {
    const c = dark ? PAL.earthD : PAL.earth, ln = dark ? '#7a5a3a' : PAL.earthD;
    F(x, y, w, h, c);
    for (let j = y + 3; j < y + h; j += 4) { F(x, j, w, 1, ln); if (j + 1 < y + h) F(x, j + 1, w, 1, shade(c, 9)); }
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const n = hash2(x + i, y + j, 41); if (n < .06) F(x + i, y + j, 1, 1, shade(c, -16)); else if (n > .95) F(x + i, y + j, 1, 1, shade(c, 14)); }
    F(x, y, w, 1, shade(c, 22)); F(x, y, 1, h, shade(c, 12));
    F(x + w - 2, y + 1, 2, h - 1, SH(.14)); for (let j = 0; j < 3; j++) for (let i = 0; i < w; i++) if (bay(x + i, y + h - 3 + j) < (j + 1) / 4) F(x + i, y + h - 3 + j, 1, 1, SH(.22));
  };
  const roof = (x, y, w, h, over, col) => {
    const tc = col || TI, t2 = shade(tc, 14), t3 = shade(tc, -14);
    for (let j = 0; j < h; j++) {
      const inset = R((h - j) * over / h), x0 = x + inset - over, ww = w - 2 * inset + 2 * over;
      F(x0, y + j, ww, 1, j === 0 ? TL : tc);
      // round tiles running down the slope: a light and a dark column every 3 px, shifted on alternate rows
      if (j > 0) for (let i = (j & 1); i < ww; i += 3) { F(x0 + i, y + j, 1, 1, t2); if (i + 1 < ww) F(x0 + i + 1, y + j, 1, 1, t3); }
      if (j > 0 && j < h - 1) { F(x0, y + j, 1, 1, t2); F(x0 + ww - 1, y + j, 1, 1, t3); }
    }
    // the ridge and its upturned ends, the eave's tile ends, and the shadow the eave throws on the wall
    if (h >= 6) { F(x + over, y - 1, w - 2 * over, 1, shade(TL, 10)); F(x + over - 1, y - 2, 2, 2, TL); F(x + w - over - 1, y - 2, 2, 2, TL); F(x - over, y + h - 2, 2, 1, TL); F(x + w + over - 2, y + h - 2, 2, 1, TL); }
    for (let i = x - over + 1; i < x + w + over - 1; i += 3) F(i, y + h, 2, 1, TL);
    F(x - over + 2, y + h + 1, w + 2 * over - 4, 2, SH(.3)); for (let i = x - over + 2; i < x + w + over - 2; i++) if (bay(i, y + h + 3) < .5) F(i, y + h + 3, 1, 1, SH(.3));
    if (season === 3) { for (let i = x - over + 1; i < x + w + over - 1; i++) { const d = hash2(i, y, 51) < .3 ? 1 : 2; F(i, y - 1, 1, d + (h >= 6 ? 1 : 0), '#f4f6fa'); } F(x - over + 2, y + h - 1, w + 2 * over - 4, 1, '#e4eaf2'); }
  };
  const pillar = (x, y, h, col) => { col = col || LQ; F(x, y, 3, h, col); F(x, y, 1, h, shade(col, 28)); F(x + 2, y, 1, h, shade(col, -26));
    F(x - 2, y, 7, 1, shade(col, -34)); F(x - 1, y + 1, 5, 1, shade(col, -18)); F(x - 1, y + h - 2, 5, 2, '#9a8e80'); F(x - 1, y + h - 2, 5, 1, '#bcb0a0'); F(x + 3, y + 2, 1, h - 4, SH(.18)); };
  const ground = (y, col) => { col = qin ? (shu ? '#a8a070' : '#d6b676') : col || '#b89868'; ramp(0, y, 180, 112 - y, [shade(col, 12), col, col, shade(col, -10)]);
    F(0, y, 180, 2, SH(.22)); for (let i = 0; i < 180; i++) if (bay(i, y + 2) < .5) F(i, y + 2, 1, 1, SH(.18));
    for (let i = 0; i < 46; i++) { const px = hash2(i, 1, 9) * 180 | 0, py = y + 3 + (hash2(i, 2, 9) * (109 - y) | 0); F(px, py, 2, 1, shade(col, -20)); F(px, py - 1, 1, 1, shade(col, 16)); }
    if (loc !== 'tavern') for (let i = 0; i < 22; i++) {
      const px = hash2(i, 3, 9) * 178 | 0, py = y + 4 + (hash2(i, 4, 9) * (106 - y) | 0);
      if (season === 3) { F(px, py, 5 + (i & 3), 1, '#eef2f8'); F(px + 1, py - 1, 3, 1, '#ffffff'); }
      else if (season === 2) { F(px, py, 2, 1, i & 1 ? '#c8702a' : '#d8a040'); }
      else { const gc = qin ? '#8a9a4a' : season === 0 ? '#7ab85a' : '#5a9a46'; F(px, py, 1, 2, gc); F(px + 1, py - 1, 1, 3, shade(gc, -14)); F(px + 2, py, 1, 2, gc); if (season === 0 && i % 5 === 0) F(px + 1, py - 2, 1, 1, '#f4b0c8'); }
    }
  };
  // a black 秦 banner on a pole, two vermilion bands
  const banner = (x, y, h) => { F(x, y - 3, 1, h + 14, PAL.wood); F(x + 1, y, 7, h, '#16121a'); F(x + 2, y + 2, 5, 1, LQ); F(x + 2, y + h - 3, 5, 1, LQ); F(x + 1, y + h, 2, 2, '#16121a'); F(x + 6, y + h, 2, 2, '#16121a'); };
  const jar = (x, y, sz, col) => { F(x - sz, y + sz, sz * 2 + 2, 2, SH(.25)); s.fillStyle = OUT; s.beginPath(); s.ellipse(x, y, sz + 1, sz * 1.1 + 1, 0, 0, 7); s.fill(); s.fillStyle = col || '#8a5a3a'; s.beginPath(); s.ellipse(x, y, sz, sz * 1.1, 0, 0, 7); s.fill(); F(x - sz * .5, y - sz * 1.2, sz, 2, OUT); F(x - sz * .6, y - sz * .6, 2, sz * .7, shade(col || '#8a5a3a', 25)); };
  const tree = (x, y) => {
    const lc = [['#8fd070', '#6fb05a', '#4f9044'], ['#74b858', '#5aa04a', '#3a7a38'], ['#f0c058', '#e0a040', '#b86a28'], ['#9a8a7a', '#8a7a6a', '#6a5a4a']][season];
    F(x - 1, y, 3, 18, PAL.wood); F(x - 1, y, 1, 18, shade(PAL.wood, 22)); F(x + 2, y + 2, 1, 16, SH(.25));
    for (let i = 0; i < 6; i++) { F(x - 2 - i, y - i, 2, 1, PAL.wood); F(x + 2 + i, y + 2 - i, 2, 1, PAL.wood); }
    F(x - 5, y + 18, 12, 2, SH(.22));
    if (season === 3) { for (let i = 0; i < 6; i++) { F(x - 2 - i, y - 1 - i, 2, 1, '#f4f6fa'); F(x + 2 + i, y + 1 - i, 2, 1, '#f4f6fa'); } return; }
    for (let i = 0; i < 44; i++) { const a = hash2(i, x, 5) * 6.28, r = Math.sqrt(hash2(i, y, 6)) * 11, px = x + Math.cos(a) * r * 1.25 - 2 | 0, py = y - 6 + Math.sin(a) * r * .75 | 0, lit = (px - x) + (py - y + 6) * 1.4;
      F(px, py, 4, 3, lit < -5 ? lc[0] : lit > 5 ? lc[2] : lc[1]); }
    if (season === 0) for (let i = 0; i < 9; i++) F(x - 12 + (hash2(i, x, 7) * 24 | 0), y - 13 + (hash2(i, y, 8) * 13 | 0), 1, 1, '#ffd0e0');
    if (season === 2) for (let i = 0; i < 6; i++) F(x - 10 + (hash2(i, x, 9) * 22 | 0), y + 17 + (i % 3), 2, 1, i & 1 ? '#e0a040' : '#c07830');
  };
  const fishRack = (x, y) => { F(x, y, 2, 30, PAL.wood); F(x + 34, y, 2, 30, PAL.wood); F(x, y + 2, 36, 1, PAL.wood); for (let i = 0; i < 6; i++) { F(x + 4 + i * 5, y + 3, 1, 3, '#555'); F(x + 3 + i * 5, y + 6, 3, 7, '#d8a060'); F(x + 3 + i * 5, y + 12, 3, 2, '#b07838'); F(x + 4 + i * 5, y + 8, 1, 1, OUT); } };
  const snow = () => { if (season !== 3 || loc === 'tavern') return; for (let i = 0; i < 70; i++) F(hash2(i, 7, 11) * 180 | 0, hash2(i, 8, 11) * 100 | 0, 1, 1, '#ffffff'); };
  if (loc === 'home') {
    ram(0, 44, 180, 30); roof(0, 40, 180, 4, 0);
    tree(160, 30);
    ram(24, 50, 92, 38, true); F(26, 52, 88, 34, PAL.earth);
    for (let j = 55; j < 86; j += 4) F(26, j, 88, 1, PAL.earthD);
    roof(22, 34, 96, 14, 8);
    F(60, 62, 20, 26, PAL.wood); F(61, 63, 8, 24, '#7a4a30'); F(71, 63, 8, 24, '#7a4a30'); F(69, 74, 2, 2, PAL.bronze);
    F(61, 63, 8, 1, '#9a6a48'); F(71, 63, 8, 1, '#9a6a48'); F(68, 63, 1, 24, SH(.3)); F(58, 86, 24, 2, '#9a8e80'); F(58, 86, 24, 1, '#bcb0a0');
    for (const wx of [36, 90]) { F(wx, 60, 14, 12, PAL.wood); F(wx + 1, 61, 12, 10, '#e8d8a8'); for (let i = 0; i < 3; i++) { F(wx + 3 + i * 4, 61, 1, 10, PAL.wood); F(wx + 1, 63 + i * 3, 12, 1, PAL.wood); } F(wx + 1, 61, 12, 1, SH(.2)); }
    pillar(30, 50, 38, PAL.wood); pillar(108, 50, 38, PAL.wood);
    ground(88, '#c8aa7a');
    fishRack(130, 58);
    jar(10, 96, 6, '#7a4a2a'); jar(22, 99, 5, '#8a5a3a');
  } else if (loc === 'market') {
    tree(12, 34);
    // market tower with drum
    ram(74, 40, 32, 30); roof(70, 28, 40, 7, 5); F(78, 36, 24, 6, PAL.wood); F(84, 37, 12, 5, '#a04030'); F(86, 38, 8, 3, '#d0c090'); roof(72, 14, 36, 8, 4);
    F(78, 22, 2, 8, PAL.lacq); F(100, 22, 2, 8, PAL.lacq);
    if (!qin) { F(118, 16, 1, 30, PAL.wood); F(119, 16, 10, 12, PAL.lacq); F(120, 17, 8, 1, '#e06050'); }
    ground(70, '#c4a270');
    const stall = (x, col) => { for (let j = 0; j < 8; j++) F(x - j, 64 + j, 40 + 2 * j, 1, j & 1 ? col : shade(col, 20)); F(x - 6, 72, 52, 2, shade(col, -30)); F(x - 5, 74, 50, 3, SH(.25)); F(x - 8, 94, 56, 2, SH(.2)); F(x - 4, 74, 2, 20, PAL.wood); F(x + 42, 74, 2, 20, PAL.wood); F(x - 5, 86, 50, 8, PAL.wood); F(x - 5, 86, 50, 1, '#8a5a3a'); };
    stall(12, PAL.lacq); stall(128, PAL.qing);
    for (let i = 0; i < 5; i++) { F(12 + i * 7, 81, 5, 4, '#d8a060'); F(13 + i * 7, 82, 1, 1, OUT); }
    jar(134, 82, 4, '#7a6a5a'); jar(146, 82, 4, '#8a5a3a'); F(156, 79, 10, 6, PAL.silk); F(156, 81, 10, 1, PAL.zhi);
  } else if (loc === 'hostage') {
    F(0, 0, 180, 48, mixHex(sky[0], '#a0a0a8', .4));
    ram(0, 36, 180, 44, false);
    for (let i = 0; i < 12; i++) F(hash2(i, 3, 4) * 170 | 0, 34, 2, 2 + (i & 1), '#6fa04a');
    // cracks
    const crack = (x, y) => { for (let j = 0; j < 14; j++) F(x + ((j * 7) % 3) - 1, y + j, 1, 1, '#6a4a2a'); };
    crack(30, 44); crack(142, 50); crack(118, 40);
    F(64, 46, 52, 34, PAL.wood); roof(60, 38, 60, 6, 4);
    F(68, 50, 20, 30, PAL.lacq); F(92, 50, 20, 30, PAL.lacq);
    for (let i = 0; i < 18; i++) F(68 + (hash2(i, 5, 2) * 44 | 0), 50 + (hash2(i, 6, 2) * 28 | 0), 3, 2, PAL.earth);
    F(89, 50, 2, 30, OUT);
    ground(80, '#a89070');
    F(20, 92, 16, 3, PAL.tile); F(150, 96, 12, 2, PAL.tile);
  } else if (loc === 'lvfu') {
    ram(0, 42, 180, 38, false); roof(0, 38, 180, 4, 0);
    F(40, 40, 100, 44, '#e8d8b8'); roof(34, 26, 112, 14, 10);
    for (const x of [44, 70, 108, 134]) pillar(x, 40, 44);
    F(80, 52, 20, 32, PAL.wood); F(82, 54, 16, 30, '#3a2030');
    F(52, 48, 14, 20, PAL.purple); F(114, 48, 14, 20, PAL.purple); F(52, 48, 14, 2, PAL.gold); F(114, 48, 14, 2, PAL.gold);
    // bronze lamps
    for (const x of [22, 158]) { F(x, 62, 2, 26, PAL.bronzeD); F(x - 3, 60, 8, 3, PAL.bronze); F(x, 57, 2, 3, '#ffd070'); }
    ground(84, '#cdb488');
    F(0, 84, 180, 2, PAL.earthD);
  } else if (loc === 'tavern') {
    F(0, 0, 180, 112, '#5a3a2a'); for (let x = 0; x < 180; x += 12) F(x, 0, 1, 80, '#4a2e22');
    F(0, 0, 180, 6, PAL.wood);
    // wine flag
    F(20, 6, 2, 40, PAL.wood); F(22, 8, 16, 26, PAL.su); F(22, 8, 16, 2, PAL.lacq); F(22, 32, 16, 2, PAL.lacq);
    // lamp glow
    for (let i = 0; i < 90; i++) F(hash2(i, 1, 61) * 180 | 0, hash2(i, 2, 61) * 78 | 0, 1, 3 + (i % 4), i & 1 ? '#4a2e22' : '#6a4632');
    for (let y = 8; y < 78; y++) for (let x = 80; x < 162; x++) { const d = Math.hypot(x - 120, (y - 42) * 1.1); if (d < 36 && bay(x, y) > d / 36) F(x, y, 1, 1, 'rgba(255,196,96,.22)'); }
    F(119, 44, 2, 22, PAL.bronzeD); F(115, 42, 10, 3, PAL.bronze); F(119, 38, 2, 4, '#ffe080');
    for (let i = 0; i < 4; i++) jar(150 + (i & 1) * 12, 56 + (i >> 1) * 14, 6, i & 1 ? '#6a4a30' : '#7a5a3a');
    ramp(0, 80, 180, 32, ['#9a7a54', '#8a6a48', '#7a5c3e']); for (let x = 0; x < 180; x += 16) { F(x, 80, 1, 32, '#5a3e28'); F(x + 1, 80, 1, 32, '#a8865e'); } F(0, 80, 180, 2, SH(.3));
    F(44, 82, 50, 6, PAL.wood); F(44, 82, 50, 1, PAL.ochre); F(48, 76, 5, 6, PAL.lacq); F(58, 77, 4, 5, PAL.lacq); F(76, 76, 6, 6, '#3a2a2a');
  } else if (loc === 'pingyuan') {
    ram(0, 46, 180, 34); roof(0, 42, 180, 4, 0);
    for (const x of [20, 136]) { ram(x, 20, 24, 60, true); roof(x - 2, 12, 28, 8, 4); }
    F(60, 44, 60, 36, PAL.wood); roof(54, 30, 72, 12, 8); pillar(64, 44, 36); pillar(114, 44, 36);
    F(76, 52, 28, 28, '#2a1a20');
    for (const x of [48, 128]) { F(x, 22, 1, 30, PAL.wood); F(x + 1, 22, 6, 14, PAL.qing); }
    ground(80, '#c0a478'); for (let i = 0; i < 4; i++) F(70 - i * 4, 80 + i * 4, 40 + i * 8, 4, i & 1 ? '#a88a60' : '#b8986a');
  } else if (loc === 'palace') {
    tree(10, 70); tree(170, 70);
    ram(10, 76, 160, 20, true); ram(30, 58, 120, 18, false); ram(50, 42, 80, 16, true);
    F(78, 58, 24, 38, '#a88a5a'); for (let j = 58; j < 96; j += 3) { F(78, j, 24, 1, '#8a6a40'); F(78, j + 1, 24, 1, '#c0a070'); } F(77, 58, 1, 38, '#6a4a30'); F(102, 58, 1, 38, '#6a4a30');
    F(56, 26, 68, 16, '#e8d8b8'); roof(50, 10, 80, 16, 10); for (const x of [60, 74, 104, 118]) pillar(x, 26, 16);
    ground(96, '#b89868');
  } else if (loc === 'gate') {
    ram(0, 34, 180, 60, false);
    for (let x = 0; x < 180; x += 8) { F(x, 30, 5, 4, PAL.earth); F(x, 30, 5, 1, shade(PAL.earth, 22)); F(x + 4, 31, 1, 3, SH(.2)); }
    F(66, 54, 48, 40, '#2a1e18'); F(62, 50, 56, 5, PAL.wood); F(62, 50, 56, 1, shade(PAL.wood, 30));
    F(66, 54, 4, 40, '#1a120e'); F(110, 54, 4, 40, '#3a2a22'); F(70, 58, 19, 36, '#5a3020'); F(91, 58, 19, 36, '#4a2618'); F(89, 58, 2, 36, '#1a120e');
    for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) { F(73 + i * 6, 62 + j * 7, 1, 1, PAL.bronze); F(94 + i * 6, 62 + j * 7, 1, 1, PAL.bronze); }
    F(70, 22, 40, 12, PAL.wood); roof(64, 8, 52, 14, 8); pillar(72, 22, 12, LQ); pillar(106, 22, 12, LQ);
    ground(94, '#b09070');
    for (let i = 0; i < 6; i++) F(80 + i * 3, 94 + i * 3, 20 - i, 3, '#a08060');
  }
  if (qin) {
    if (loc === 'market') { banner(118, 16, 13); banner(56, 20, 10); }
    else if (loc === 'palace') { banner(26, 44, 14); banner(146, 44, 14); F(86, 30, 8, 12, LQ); F(89, 32, 2, 8, PAL.gold); }
    else if (loc === 'gate') {
      for (const x of [16, 36, 136, 156]) banner(x, 20, 10);
      // 军营: tents before the wall
      if (place === 'camp') for (const x of [22, 50, 130, 158]) { for (let j = 0; j < 9; j++) F(x - j, 99 + j, 2 * j + 1, 1, j ? '#9a8a66' : '#16121a'); F(x, 102, 1, 6, OUT); }
    }
    else if (loc === 'lvfu' && place === 'hougong') { for (const x of [52, 114]) { F(x, 48, 14, 20, '#3f8a5e'); F(x, 48, 14, 2, PAL.gold); F(x + 6, 50, 2, 18, '#9ccb98'); } }
    else if (loc === 'tavern') banner(60, 8, 12);
    else if (loc === 'home') { pillar(30, 50, 38, LQ); pillar(108, 50, 38, LQ); banner(10, 44, 12); }
  }
  snow();
  SCN.set(key, c); return c;
}
