// ============================================================ drawing helpers
const TQ = [];
// TCLIP [x, y, w, h]: text queued while it is set is clipped to it (rows cut by a scrolling viewport).
// DRY: lay a panel out without drawing anything, to measure it first (rect / txt / hit / img do nothing).
let TCLIP = null, DRY = false;
// f = 1 draws in the plain body font (easier to read in long passages); default is the display font
// (a few old characters the pixel font lacks — 子傒, 桓齮, 魏安釐王 … — put the whole string in the body font, so a name
// is never half one font and half the other; tw/fitT measure it the same way)
const NOPIX = /[傒湣蟜遬鄗釐齮]/;
function txt(s, x, y, size, col, align, stroke, alpha, f) { if (DRY) return; s = String(s); TQ.push({ s, x, y, size: size || 8, col: col || '#ffffff', align: align || 'center', stroke: stroke === undefined ? OUT : stroke, alpha: alpha === undefined ? 1 : alpha, f: f || NOPIX.test(s) ? 1 : 0, clip: TCLIP }); }
function img(c, x, y) { if (!DRY) g.drawImage(c, x, y); }
const BODY = FONT;   // long passages use the same pixel font now
// glyph widths measured with the real font (per 100px), so wrapping matches what gets drawn
const MCX = mk(1, 1).getContext('2d'), CWID = new Map();
let fontReady = false;
try { (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { fontReady = true; CWID.clear(); }); } catch (e) { fontReady = true; }
function chW(ch, f) {
  const k = f ? '' + ch : ch; let w = CWID.get(k);
  if (w === undefined) { MCX.font = '100px ' + (f ? BODY : FONT); w = MCX.measureText(ch).width / 100; if (fontReady) CWID.set(k, w); }
  return w;
}
const tw = (s, size, f) => { s = String(s); if (!f && NOPIX.test(s)) f = 1; let w = 0; for (const ch of s) w += chW(ch, f) * size; return w; };
// Chinese line breaking: a closing mark never starts a line (one may hang past the edge), an opening mark never ends
// one, and a paragraph doesn't end on a one- or two-character orphan. Line counts stay what a plain wrap gives.
const CLOSE = '，。！？、；：」）》…』”', OPEN = '（「《“『';
const NUMCH = /[0-9A-Za-z+\-\/%.]/, NOLAB = /[\s·，。、：；（）()「」]/;
function wrapT(s, maxW, size, f) {
  const out = [], cw = ch => chW(ch, f) * size, wid = t => { let w = 0; for (const ch of t) w += cw(ch); return w; };
  for (const para of String(s).split('\n')) {
    const p0 = out.length; let line = '', w = 0;
    for (const ch of para) {
      const c = cw(ch);
      if (w + c > maxW && line && NUMCH.test(ch)) {
        // (the digits before this one, and the word they count, go down with it)
        let k = 0; while (k < line.length && NUMCH.test(line[line.length - 1 - k])) k++;
        const lab = line.length - k - 1; if (lab >= 0 && !NOLAB.test(line[lab])) k++;
        if (k > 0 && k < line.length) { out.push(line.slice(0, line.length - k)); line = line.slice(line.length - k) + ch; w = wid(line); continue; }
      }
      if (w + c > maxW && line) {
        if (CLOSE.includes(ch) && !CLOSE.includes(line[line.length - 1])) { line += ch; w += c; continue; }
        // a mark already hangs: carry the last real character (and its marks) down with this one
        let k = 0;
        if (CLOSE.includes(ch)) { k = 1; while (k < line.length - 1 && CLOSE.includes(line[line.length - k])) k++; }
        while (line.length - k > 1 && OPEN.includes(line[line.length - k - 1])) k++;
        out.push(line.slice(0, line.length - k)); line = line.slice(line.length - k) + ch; w = wid(line);
        continue;
      }
      line += ch; w += c;
    }
    if (line) out.push(line);
    const n = out.length;
    if (n - p0 >= 2 && [...out[n - 1]].length <= 2 && [...out[n - 2]].length >= 5) {
      const prev = [...out[n - 2]];
      for (let k = 1; k <= 4 && k < prev.length - 2; k++) {
        const mv = prev.slice(-k).join(''), rem = prev.slice(0, -k);
        if (CLOSE.includes(mv[0]) || OPEN.includes(rem[rem.length - 1])) continue;
        if (wid(mv + out[n - 1]) <= maxW + cw('。')) { out[n - 2] = rem.join(''); out[n - 1] = mv + out[n - 1]; }
        break;
      }
    }
  }
  return out;
}
// cut a string to maxW with …
function fitT(s, maxW, size, f) {
  s = String(s); if (!f && NOPIX.test(s)) f = 1; if (tw(s, size, f) <= maxW) return s;
  const ell = chW('…', f) * size; let out = '', w = 0;
  for (const ch of s) { const c = chW(ch, f) * size; if (w + c + ell > maxW) break; out += ch; w += c; }
  return out + '…';
}
// the largest size ≤ max at which s fits in maxW (never below 5.5)
const fitSize = (s, maxW, max, f) => Math.max(5.5, Math.min(max, max * maxW / Math.max(1, tw(s, max, f))));
function rect(x, y, w, h, c) { if (DRY) return; g.fillStyle = c; g.fillRect(x, y, w, h); }
function paper(x, y, w, h) {
  rect(x, y, w, h, OUT); rect(x + 1, y + 1, w - 2, h - 2, PAL.wood); rect(x + 2, y + 2, w - 4, h - 4, PAL.ochre); rect(x + 3, y + 3, w - 6, h - 6, OUT);
  rect(x + 4, y + 4, w - 8, h - 8, '#f1e4c3'); rect(x + 4, y + 4, w - 8, 1, '#fff6dc');
}
const BTN = { red: ['#7a1f24', '#b5312a', '#e0513c'], jade: ['#2c5a40', '#2f7a50', '#6fb88a'], dark: ['#1b1622', '#3a3040', '#5a4a60'], gold: ['#7d5a2e', '#c29a52', '#f0cc5c'], off: ['#3a3438', '#6a6268', '#7a7278'], blue: ['#1f3a6a', '#2f5a9a', '#6f9ad8'] };
function btnFrame(x, y, w, h, style) {
  const s = BTN[style || 'red'];
  rect(x, y, w, h, OUT); rect(x + 1, y + 1, w - 2, h - 2, s[0]); rect(x + 1, y + 1, w - 2, h - 3, s[1]); rect(x + 2, y + 2, w - 4, 1, s[2]);
}
const subCol = style => style === 'off' ? '#e4dce0' : style === 'gold' ? '#3a2418' : '#ffecc8';
// a label shrinks rather than running out of its button; a long subtitle is cut with …; padR keeps room on the right
function btn(x, y, w, h, label, style, fn, sub, padR) {
  btnFrame(x, y, w, h, style);
  if (sub) { txt(label, x + 6, y + h / 2 - 3.5, fitSize(label, w - 12 - (padR || 0), 7), '#ffffff', 'left', OUT); txt(fitT(sub, w - 12, 5.5, 1), x + 6, y + h / 2 + 4.5, 5.5, subCol(style), 'left', null, 1, 1); }
  else txt(label, x + (w - (padR || 0)) / 2, y + h / 2 - .5, fitSize(label, w - 8 - (padR || 0), 7.5), '#ffffff', 'center', OUT);
  if (fn) hit(x, y, w, h, fn);
}
const ICON = {};
function icons() {
  ICON.fish = rows(['...YYYYY...DD', '.YYDYYDYYY.D.', 'YEYYBBBBBYD..', '.BBBBBBBBB.D.', '...BBBBB...DD'], { Y: '#d89a4a', D: '#a8642e', B: '#f2d49a', E: '#1b1622' });
  ICON.heart = rows(['.RR.RR.', 'RPRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'], { R: '#e8506e', P: '#ffc0d0' });
  ICON.qm = rows(['.XXX.', 'X...X', '...X.', '..X..', '.....', '..X..'], { X: '#f2ead4' });
  ICON.star = rows(['..Y..', '.YYY.', 'YYYYY', '.Y.Y.'], { Y: '#ffe14a' });
  ICON.ap = rows(['.X.', 'XXX', '.X.'], { X: '#ffd24a' });
  ICON.apOff = rows(['.X.', 'X.X', '.X.'], { X: '#6a6268' });
  ICON.snd = rows(['..X.X', '.XX..', 'XXX.X', '.XX..', '..X.X'], { X: '#f2ead4' });
  ICON.mute = rows(['..X..', '.XX..', 'XXX.X', '.XX..', '..X..'], { X: '#8a8288' });
  ICON.seal = rows(['XXXXX', 'X.X.X', 'XXXXX', 'X.X.X', 'XXXXX'], { X: '#e0513c' });
  ICON.scroll = rows(['BWWWWWB', '.WLLLW.', '.WWWWW.', '.WLLW..', '.WWWWW.', '.WLLLW.', 'BWWWWWB'], { B: '#c29a52', W: '#f2ead4', L: '#8a7a6a' });
  const L = { home: ['....XX....', '..XXXXXX..', 'XXXXXXXXXX', '.WWWWWWWW.', '.WW.DD.WW.', '.WW.DD.WW.', '.WWWDDWWW.'],
    market: ['....XX....', '...XXXX...', '....WW....', '.RRR..BBB.', 'RRRRRBBBBB', '.W.W..W.W.', '.W.W..W.W.'],
    hostage: ['.G..G...G.', 'WWWWWWWWWW', 'WW.WWW.WWW', 'W.W.RR.W.W', 'WWWWRRWWWW', 'WW.WRRW.WW', 'WWWWRRWWWW'],
    lvfu: ['..XXXXXX..', 'XXXXXXXXXX', '.P.WWWW.P.', '.P.WDDW.P.', '.P.WDDW.P.', '.P.WDDW.P.', 'WWWWWWWWWW'],
    tavern: ['RR........', 'RR..XXX...', 'RR.XWWWX..', 'R..XWWWX..', '...XWWWX..', '...XWWWX..', '....XXX...'],
    pingyuan: ['XX......XX', 'XX.XXXX.XX', 'WW.WWWW.WW', 'WW.W..W.WW', 'WW.W..W.WW', 'WW.W..W.WW', 'WWWWWWWWWW'],
    palace: ['...XXXX...', '..XXXXXX..', '...W..W...', '.WWWWWWWW.', '.WWWWWWWW.', 'WWWWWWWWWW', 'WWWWWWWWWW'],
    gate: ['X.X.XX.X.X', 'XXXXXXXXXX', 'WWWWWWWWWW', 'WWW....WWW', 'WWW....WWW', 'WWW....WWW', 'WWW....WWW'] };
  const pal = { X: '#4d4e57', W: '#c7a574', D: '#5e3524', R: '#b5312a', B: '#4f78a8', G: '#6fb05a', P: '#5e3f86' };
  for (const k in L) ICON[k] = rows(L[k], pal);
  ICON.tab_home = ICON.home; ICON.tab_market = ICON.market; ICON.tab_court = ICON.palace; ICON.tab_travel = ICON.gate;
  ICON.tab_people = rows(['..XX...XX.', '.XXXX.XXXX', '.XXXX.XXXX', '..XX...XX.', '.RRRR.BBBB', 'RRRRRRBBBB', 'RRRRRRBBBB'], { X: '#e8b060', R: '#b5312a', B: '#4f78a8' });
}
// floating notices: at most 3 on screen, the rest wait their turn (nothing is dropped). Each layer sets TANCH to a
// band where they cover nothing you need: [y, 1] stacks down from y, [y, -1] stacks up from y.
const TOASTS = [], TPEND = [];
let TANCH = [64, 1];
function toast(s, col) {
  if (CATCHUP) return;
  s = String(s);
  const same = TOASTS.find(t => t.s === s); if (same) { same.life = Math.max(same.life, 1.6); return; }
  if (TPEND.some(t => t.s === s)) return;
  TPEND.push({ s, col: col || '#ffffff', life: 2.6 });
  if (TPEND.length > 60) TPEND.shift();   // only a script firing hundreds of notices without frames gets here
}
