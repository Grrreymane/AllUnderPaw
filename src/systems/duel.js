// ==== SYS:duel ==== 舌战 · 比剑
// One engine for every contest of words or blades: three rounds of rock-paper-scissors on a 7-cell tug bar.
// 舌战 理 > 诈 > 情 > 理 (理 is argued with 政, 诈 with 谋, 情 with 交); 比剑 劈 > 闪 > 守 > 劈 (all 武; 夜猫子 闪+2,
// 胆小 守+2). The knot starts (交 or 武 difference)/4 cells towards the stronger side (±2 at most). A won round pulls it
// one cell to the winner; the same move on both sides goes to whoever is better at it (equal: nobody moves). Knot on
// your side after round 3 = win; dead centre goes to whoever pulled last (three decisive rounds from a one-cell head
// start always end even, so without that a head start of one would be worth nothing). Losing only means the thing
// didn't work: callers never add a penalty of their own.
// startDuel(kind, opp, onEnd(win), opt) opens the 'duel' window (m.hold: story cards and notices wait under it); onEnd runs
// exactly once, also when the window goes away unplayed (a bot popping it, 认输) = lost. duelOdds(kind, opp, opt) -> 0–1.
// opt: { why: the stake line, title, bonus: extra start cells, side: who fights for you, auto: plays itself (bots) }
const DUEL = {
  '舌战': { mv: ['理', '诈', '情'], st: [1, 3, 2], key: 2, kind: 'debate', lean: { 高冷: 0, 诚实: 0, 狡诈: 1, 多疑: 1, 粘人: 2, 多情: 2 }, tip: 'tipDebate' },
  '比剑': { mv: ['劈', '闪', '守'], st: [0, 0, 0], key: 0, kind: 'duel', lean: { 勇猛: 0, 夜猫子: 1, 胆小: 2 }, plus: [null, '夜猫子', '胆小'], tip: 'tipSword' },
};
// the move their habits give away (first matching trait), -1 for none
function duelLean(kind, c) { const L = DUEL[kind].lean; for (const t of (c && c.tr) || []) if (L[t] !== undefined) return L[t]; return -1; }
// one side: the key stat and what each move is worth; a helper lends their better stats (毛遂 speaking for you)
function duelSide(kind, c, helper) {
  const K = DUEL[kind], v = i => Math.max(stat(c, i), helper && helper !== c ? stat(helper, i) : 0), tr = traitsOf(c);
  return { c, key: v(K.key), ms: K.st.map((s, i) => v(s) + (K.plus && K.plus[i] && tr.includes(K.plus[i]) ? 2 : 0)) };
}
// +1 you pull, -1 they pull, 0 nobody (a = your move, b = theirs; move i beats move i+1)
const duelOut = (A, B, a, b) => a === b ? Math.sign(A.ms[a] - B.ms[b]) : (a + 1) % 3 === b ? 1 : -1;
const duelWon = (pos, last) => pos > 0 || (pos === 0 && last > 0);
const duelStart = (A, B, bonus) => clamp(clamp(Math.trunc((A.key - B.key) / 4), -2, 2) + (bonus || 0), -2, 2);
// each round you may read what they are about to do: two rounds in five, always with 谋 12+
const duelTellP = () => stat(P(), 3) >= 12 ? 1 : .4;
// what they mean to do (their habit half the time) and what they then do (the intended move DUEL_ACC of the time, else
// another): tuned so that two equals come out a little better than even for a player who watches for the tell
const DUEL_ACC = .6;
const duelIntent = (kind, opp) => { const ln = duelLean(kind, opp); return [0, 1, 2].map(i => ln < 0 ? 1 / 3 : i === ln ? .5 : .25); };
const duelAct = x => [0, 1, 2].map(j => j === x ? DUEL_ACC : (1 - DUEL_ACC) / 2);
// one round [you pull, nobody, they pull] for a player who answers the tell when it shows, else answers their habit
function duelRound(kind, A, B) {
  const ln = duelLean(kind, B.c), I = duelIntent(kind, B.c), q = duelTellP(), r = [0, 0, 0];
  const add = (my, dist, wt) => dist.forEach((pp, j) => { const o = duelOut(A, B, my, j); r[o > 0 ? 0 : o < 0 ? 2 : 1] += wt * pp; });
  for (let x = 0; x < 3; x++) add((x + 2) % 3, duelAct(x), q * I[x]);
  const their = [0, 1, 2].map(j => I.reduce((s, ix, x) => s + ix * duelAct(x)[j], 0));
  if (ln >= 0) add((ln + 2) % 3, their, 1 - q); else for (let my = 0; my < 3; my++) add(my, their, (1 - q) / 3);
  return r;
}
// who speaks or fights for you: the caller's champion, else (舌战) 毛遂 when he has promised to (never against himself)
function duelChamp(kind, opp, opt) {
  const p = P(), s = opt && opt.side;
  if (s && alive(s) && s !== p && s !== opp) return s;
  if (kind === '舌战' && typeof proxyDebater === 'function') { const x = proxyDebater(); if (x && alive(x) && x !== p && x !== opp) return x; }
  return null;
}
// the odds the hints show are the odds of the duel that will really be fought (the same champion, the same start)
function duelOdds(kind, opp, opt) {
  opt = opt || {}; opp = typeof opp === 'string' ? C(opp) : opp;
  const p = W && P(); if (!DUEL[kind] || !opp || !p) return 0;
  const px = duelChamp(kind, opp, opt), A = duelSide(kind, px || p, px ? p : null), B = duelSide(kind, opp);
  return duelDP(duelStart(A, B, opt.bonus), duelRound(kind, A, B));
}
// three rounds from a start cell; state = knot position and who pulled last
function duelDP(start, [w, z, l]) {
  let S = new Map([[start + ',0', 1]]);
  const put = (M, pos, last, q) => { const k = clamp(pos, -3, 3) + ',' + last; M.set(k, (M.get(k) || 0) + q); };
  for (let r = 0; r < 3; r++) {
    const N = new Map();
    for (const [k, q] of S) { const [pos, last] = k.split(',').map(Number); put(N, pos + 1, 1, q * w); put(N, pos, last, q * z); put(N, pos - 1, -1, q * l); }
    S = N;
  }
  let win = 0; for (const [k, q] of S) { const [pos, last] = k.split(',').map(Number); if (duelWon(pos, last)) win += q; }
  return win;
}
// (a 比剑 you fight yourself galls the timid: growth's 心烦 for 胆小; 毛遂 speaking for you is named)
const duelHint = (kind, opp, opt, extra) => { const px = W && P() && duelChamp(kind, typeof opp === 'string' ? C(opp) : opp, opt);
  return [kind + (px ? '（' + nm(px) + '代' + (kind === '舌战' ? '辩' : '战') + '）' : '') + ' · 胜算 ' + R(duelOdds(kind, opp, opt) * 100) + '%', extra, kind === '比剑' && !px ? stressTip('胆小') : ''].filter(Boolean).join(' · '); };

// people you only ever meet in a fight: made for the occasion, never added to the town (nor to anyone's relations)
const FOES = {
  bing: { disp: '赵兵', role: 'general', robe: 'zhao', w: [5, 3], tr: ['勇猛'] },
  zei: { disp: '蒙面贼', role: 'commoner', robe: 'qinPoor', w: [4, 4], tr: ['夜猫子'] },
  fei: { disp: '山贼', role: 'commoner', robe: 'general', w: [6, 4], tr: null },
};
function duelFoe(k) {
  const f = FOES[k], c = mkc({ sur: '', name: '', disp: f.disp, born: W.t - 4 * (20 + Math.floor(Math.random() * 16)), loc: 'away', role: f.role, robe: f.robe,
    st: [f.w[0] + Math.floor(Math.random() * f.w[1]), 3, 3, 4], tr: (f.tr || [pick(['勇猛', '胆小', '狠辣', '夜猫子'])]).slice() });
  delete W.chars[c.id];
  return c;
}
// 魏's envoy at the 帝秦 debate (a minor historical figure, spawned when he arrives)
const xinyuan = () => spawnHist({ id: 'xinyuan', disp: '辛垣衍', sur: '辛垣', name: '衍', born: bornAt(302), role: 'minister', robe: 'wei', state: '魏', loc: 'pingyuan',
  tr: ['胆小', '诚实'], st: [6, 11, 12, 9], g: { O: ['o'], A: ['A', 'a'], S: ['S', 's'] } });

// a duel leaves the window stack exactly once however it goes: its own buttons, drop(), or a test bot popping it
let duelWatched = false;
function duelWatch() {
  if (duelWatched) return; duelWatched = true;
  const pop0 = MODAL.pop, splice0 = MODAL.splice;
  MODAL.pop = function () { const m = pop0.call(this); duelGone(m); return m; };
  MODAL.splice = function () { const out = splice0.apply(this, arguments); for (const m of out) duelGone(m); return out; };
}
function startDuel(kind, opp, onEnd, opt) {
  opt = opt || {}; opp = typeof opp === 'string' ? C(opp) : opp;
  let done = false; const end = win => { if (done) return; done = true; if (onEnd) onEnd(!!win); };
  const p = W && P(), K = DUEL[kind];
  if (!K || !opp || !alive(p) || opp.dead !== null) { end(false); return null; }
  duelWatch();
  // someone may speak for you: the caller's champion, or 毛遂 once (social's favour, used up by this 舌战)
  const px = duelChamp(kind, opp, opt);
  const me = duelSide(kind, px || p, px ? p : null), os = duelSide(kind, opp);
  const why = [opt.why || '', kind === '比剑' && !px ? stressTip('胆小') : ''].filter(Boolean).join(' · ');
  const m = { type: 'duel', hold: true, kind, opp, me, os, px, onEnd: end, w0: W, auto: !!opt.auto, why, title: opt.title || kind + ' · ' + nm(opp),
    pos: duelStart(me, os, opt.bonus), last: 0, res: [], ph: 'pick', ta: T };
  m.from = m.pos;
  // the first 舌战 and the first 比剑 open with a one-step explanation
  if (!W.flags[K.tip] && !m.auto) { W.flags[K.tip] = true; m.ph = 'tip'; }
  m.upd = () => duelTick(m);
  duelRoll(m);
  MODAL.push(m); SFX.page();
  return m;
}
function duelRoll(m) {
  const ln = duelLean(m.kind, m.opp), x = Math.random();
  m.int = ln < 0 ? Math.min(2, Math.floor(x * 3)) : x < .5 ? ln : (ln + (x < .75 ? 1 : 2)) % 3;
  m.tell = chance(duelTellP()); m.mine = m.their = null;
}
function duelPick(m, i) {
  if (m.ph !== 'pick' || m.over) return;
  const x = Math.random(), their = x < DUEL_ACC ? m.int : (m.int + (x < (1 + DUEL_ACC) / 2 ? 1 : 2)) % 3, o = duelOut(m.me, m.os, i, their);
  m.mine = i; m.their = their; m.from = m.pos; m.pos = clamp(m.pos + o, -3, 3); m.res.push(o); if (o) m.last = o; m.ph = 'show'; m.ta = T;
  if (o > 0) SFX.happy(); else if (o < 0) SFX.no(); else SFX.click();
}
function duelNext(m) {
  if (m.over) return;
  if (m.ph === 'tip') { m.ph = 'pick'; m.ta = T; }
  else if (m.ph === 'show') {
    m.from = m.pos; m.ta = T;
    if (m.res.length >= 3) { m.ph = 'end'; m.win = duelWon(m.pos, m.last); if (m.win) SFX.happy(); else SFX.no(); }
    else { duelRoll(m); m.ph = 'pick'; }
  } else if (m.ph === 'end') duelClose(m, m.win);
}
function duelClose(m, win) { if (m.over) return; m.over = true; drop(m); duelReport(m, win); }
function duelGone(m) { if (m && m.type === 'duel' && !m.over) { m.over = true; duelReport(m, false); } }
// (not for a game that was replaced meanwhile; only a duel that was fought counts as having done something)
// (a 比剑 fought by your champion is theirs: no practice and no 心烦 for you; the game is saved once the outcome is in)
function duelReport(m, win) {
  if (W !== m.w0) return;
  if (m.res.length && !(m.px && m.kind === '比剑')) didAct(DUEL[m.kind].kind, W.chars[m.opp.id] === m.opp ? m.opp : null, DUEL[m.kind].key, !!win);
  m.onEnd(!!win);
  saveGame();
}
// a shown round moves on by itself; m.auto plays the whole thing at random (bots)
function duelTick(m) {
  const t = T - m.ta;
  if (m.auto) { if (t > .35) { if (m.ph === 'pick') duelPick(m, Math.floor(Math.random() * 3) % 3); else duelNext(m); } return; }
  if (m.ph === 'show' && t > 1.4) duelNext(m);
}
// an arrow from a to b, stopping short of both (the triangle in the first-use tip)
function duelArrow(a, b, col) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  for (let s = 12; s <= L - 14; s++) rect(R(a[0] + ux * s) - 1, R(a[1] + uy * s) - 1, 2, 2, col);
  const tx = b[0] - ux * 12, ty = b[1] - uy * 12;
  for (let s = 0; s <= 6; s++) for (let k = -s * .6; k <= s * .6; k += .5) rect(R(tx - ux * s - uy * k), R(ty - uy * s + ux * k), 1, 1, col);
}
function drawDuel(m) {
  const K = DUEL[m.kind], me = m.me.c, op = m.opp, ph = m.ph, t = T - m.ta, shown = ph === 'show' || ph === 'end', last = m.res[m.res.length - 1];
  rect(0, 17, W_, H - 17, '#1e1626'); rect(0, 46, W_, 104, '#261d30');
  if (ph === 'show') hit(0, 17, W_, H - 17, () => duelNext(m));
  // title and what is at stake
  rect(22, 20, 136, 15, OUT); rect(23, 21, 134, 13, PAL.lacq); rect(23, 21, 134, 1, PAL.cinna); rect(23, 33, 134, 1, PAL.jiang);
  txt(m.title, 90, 27.5, fitSize(m.title, 126, 8), '#fff6dc', 'center', PAL.jiang);
  if (m.why) txt(fitT(m.why, 170, 6, 1), 90, 41, 6, '#d8c8b8', 'center', null, 1, 1);
  // the two sides
  drawPortrait(me, 8, 50, 1, '#e8d4a8'); drawPortrait(op, 140, 50, 1);
  txt(fitT(nm(me), 46, 6), 24, 90, 6, '#ffe08a', 'center', null); txt(fitT(nm(op), 46, 6), 156, 90, 6, '#d0b0ff', 'center', null);
  if (m.px) txt('代你出面', 24, 98, 5.5, '#c8b8a8', 'center', null, 1, 1);
  const ln = duelLean(m.kind, op); if (ln >= 0) txt('惯用' + K.mv[ln], 156, 98, 5.5, '#c8b8a8', 'center', null, 1, 1);
  // three rounds: gold = you pulled, purple = they did, grey = nobody
  for (let i = 0; i < 3; i++) { const o = m.res[i]; rect(79 + i * 8, 49, 6, 6, OUT); rect(80 + i * 8, 50, 4, 4, o === undefined ? (i === m.res.length && ph === 'pick' ? '#a898c0' : '#3a3040') : o > 0 ? '#e8b040' : o < 0 ? '#9a7bbd' : '#a89888'); }
  // the moves: yours on the left; theirs in a speech bubble by their portrait (the tell) until both are shown
  rect(48, 58, 26, 26, OUT); rect(49, 59, 24, 24, shown ? '#4a3a1c' : '#2e2438'); rect(49, 59, 24, 2, shown ? '#e8b040' : '#4a3e58');
  if (shown) txt(K.mv[m.mine], 61, 71.5, 14, '#ffffff', 'center', OUT); else txt('?', 61, 71.5, 9, '#6a5a78', 'center', null);
  if (shown) { rect(106, 58, 26, 26, OUT); rect(107, 59, 24, 24, '#34284a'); rect(107, 59, 24, 2, '#9a7bbd'); txt(K.mv[m.their], 119, 71.5, 14, '#ffffff', 'center', OUT); }
  else {
    rect(106, 58, 26, 26, OUT); rect(107, 59, 24, 24, '#f2ead4'); rect(132, 67, 5, 5, OUT); rect(131, 68, 5, 3, '#f2ead4');
    if (m.tell && ph === 'pick') { txt(K.mv[m.int], 117, 71.5, 12, '#5a4a70', 'center', null); txt('?', 127, 63.5, 6, '#8a7a98', 'center', null); }
    else txt('…', 119, 70.5, 9, '#8a7a98', 'center', null);
  }
  if (shown) txt(last > 0 ? '胜' : last < 0 ? '负' : '平', 90, 71.5, 9, last > 0 ? '#ffe08a' : last < 0 ? '#d0b0ff' : '#c8b8a8', 'center', OUT);
  else txt('VS', 90, 71.5, 7, '#8a7aa0', 'center', null);
  // the tug bar: your half gold, theirs purple; the knot slides, the cells it has won light up
  const bx = 20, by = 108, e = clamp(t / .35, 0, 1), kp = m.from + (m.pos - m.from) * (1 - (1 - e) * (1 - e)), kr = Math.round(kp);
  rect(bx - 2, by - 2, 143, 18, OUT);
  for (let i = 0; i < 7; i++) {
    const cp = 3 - i, won = cp !== 0 && Math.sign(cp) === Math.sign(kr) && Math.abs(cp) <= Math.abs(kr);
    rect(bx + i * 20, by, 19, 14, won ? (cp > 0 ? '#c8962e' : '#7a5aa8') : cp > 0 ? '#4a3a1c' : cp < 0 ? '#34284a' : '#2e2830');
  }
  rect(bx, by + 6, 139, 2, '#c8a878');
  const kx = R(bx + (3 - kp) * 20 + 9.5);
  rect(kx - 4, by - 2, 9, 18, OUT); rect(kx - 3, by - 1, 7, 16, PAL.cinna); rect(kx - 3, by - 1, 7, 2, '#ff9a7a');
  txt('你这边', bx, by + 22, 6, '#ffe08a', 'left', null, 1, 1); txt('对方', bx + 139, by + 22, 6, '#d0b0ff', 'right', null, 1, 1);
  // what just happened / what to do
  const a = shown && K.mv[m.mine], b = shown && K.mv[m.their];
  const s = ph === 'pick' ? (m.tell ? ta(op) + '像是要出「' + K.mv[m.int] + '」' : '出一招') : ph === 'show'
    ? (m.mine === m.their ? '都出「' + a + '」，' + (last > 0 ? '你更胜一筹' : last < 0 ? ta(op) + '更胜一筹' : '相持不下') : last > 0 ? '「' + a + '」克「' + b + '」' : '「' + b + '」克「' + a + '」') : '';
  if (s) txt(s, 90, 144, 7, '#f2ead4', 'center', null, 1, 1);
  if (ph !== 'end') for (let i = 0; i < 3; i++) {
    // one big move button each: the move, what it beats, and what you have for it
    const x = 8 + i * 56, y = 160, on = ph === 'pick', st = on ? 'jade' : ph === 'show' && m.mine === i ? 'gold' : 'off';
    btnFrame(x, y, 52, 74, st);
    txt(K.mv[i], x + 26, y + 24, 22, '#ffffff', 'center', OUT);
    txt('克' + K.mv[(i + 1) % 3], x + 26, y + 45, 6, subCol(st), 'center', null, 1, 1);
    const si = K.st[i]; rect(x + 10, y + 55, 32, 11, OUT); rect(x + 11, y + 56, 30, 9, STATC[si]); txt(STATN[si] + ' ' + m.me.ms[i], x + 26, y + 60.5, 6, '#ffffff', 'center', null);
    if (on) hit(x, y, 52, 74, () => duelPick(m, i));
  }
  if (ph === 'show') txt('点屏幕继续', 90, 248, 5.5, '#8a7aa0', 'center', null, 1, 1);
  if (ph === 'pick') btn(126, 294, 48, 16, '认输', 'dark', () => duelClose(m, false));
  if (ph === 'end') {
    txt(m.win ? '胜' : '败', 90, 190, 30, m.win ? '#ffe08a' : '#c8b8d8', 'center', m.win ? PAL.jiang : OUT);
    txt(m.win ? '你赢了' : '你输了', 90, 218, 7, '#f2ead4', 'center', null, 1, 1);
    btn(55, 232, 70, 22, '好', m.win ? 'gold' : 'dark', () => duelNext(m));
  }
  // a star rises over the side that took the round, a question mark over the other
  const o = ph === 'end' ? (m.win ? 1 : -1) : ph === 'show' ? last : 0;
  if (o) for (const [ic, cx] of [[ICON.star, o > 0 ? 14 : 166], [ICON.qm, o > 0 ? 166 : 14]]) for (let i = 0; i < 3; i++) {
    const k = t * 1.2 - i * .2; if (k < 0 || k > 1) continue;
    g.globalAlpha = 1 - k * k; g.drawImage(ic, R(cx + Math.sin(i * 2.1 + k * 5) * 4 - ic.width / 2), R(64 - k * 20)); g.globalAlpha = 1;
  }
  if (ph === 'tip') {
    // first time: the triangle, and the rule in four short lines (its own layer, so the text underneath stays under)
    layerBreak();
    g.globalAlpha = .7; rect(0, 17, W_, H - 17, '#0a0810'); g.globalAlpha = 1;
    paper(14, 92, 152, 176);
    txt('怎么比', 90, 104, 8, '#3a2418', 'center', null);
    const V = [[90, 130], [124, 182], [56, 182]];
    for (let i = 0; i < 3; i++) duelArrow(V[i], V[(i + 1) % 3], '#b5312a');
    V.forEach(([x, y], i) => { rect(x - 10, y - 10, 20, 20, OUT); rect(x - 9, y - 9, 18, 18, '#3a2e48'); txt(K.mv[i], x, y + .5, 11, '#ffffff', 'center', null); });
    txt('箭头指向被克的一招', 90, 202, 6, LABC, 'center', null, 1, 1);
    ['赢一招，绳结往你这边拉一格。', '出同一招，本事高的赢。', '三招过后，绳结在你这边就赢；', '停在正中，算最后赢招的一方。'].forEach((l, i) => txt(l, 22, 214 + i * 10, 6.5, '#2a1a10', 'left', null, 1, 1));
    txt('点任意处开始', 158, 258, 5.5, LABC, 'right', null, 1, 1);
    hit(0, 0, W_, H, () => duelNext(m));
  }
}
SYS.modal.duel = drawDuel;

// ---------------------------------------------------------- where duels happen
// 吕府: small talk that keeps him from watching you (吕府夜宴, and his 一叙 invitation)
function lvSmallTalk() {
  startDuel('舌战', 'lv', win => { if (win) { W.flags.lvCareless = true; addOp(C('lv'), P(), 5); toast('吕不韦不再留意你', '#c8e0ff'); } else toast('吕不韦笑了笑，没有接话', '#dddddd'); },
    { why: '胜：吕不韦不再留意你' });
}
{ const r = RANDOM.find(x => x.id === 'lvprobe'); if (r) { const b0 = r.b; r.b = () => { const e = b0(), o = e && e.opts.find(x => x.t === '只谈风月'); if (o) { o.hint = duelHint('舌战', C('lv'), null, '让他放下戒心'); o.fx = lvSmallTalk; } return e; }; } }
// 搜城: a good hiding place (谋) keeps them out; a soldier who finds the cellar has to be dealt with
const cellarBonus = () => typeof guarded === 'function' && guarded() ? 1 : 0;
// who holds the lamp: you, or while you are a child, the regent or the eldest grown-up at home
function nightChamp() {
  const p = P(); if (ageOf(p) >= 16) return null;
  const r = W.regent && C(W.regent); if (alive(r) && household().includes(r)) return r;
  return adults(household()).filter(c => c !== p).sort((a, b) => a.born - b.born)[0] || null;
}
// the chance to stay hidden, all told: not found (谋), or found and the soldier beaten
// (廉颇's soldiers at the door: nobody gets to the cellar at all)
const cellarHint = bing => { if (cellarBonus()) return withTip('藏住 100%（廉颇的老兵守着门）', '胆小');
  const a = pct(stat(P(), 3), 8), d = duelOdds('比剑', bing, {});
  return withTip('藏住 ' + R((a + (1 - a) * d) * 100) + '%（谋，搜到就比剑）', '胆小'); };
function cellar(bing, ok, fail) {
  if (useGuard() || chk(3, 8)) { ok(); return; }
  startDuel('比剑', bing, win => win ? ok() : fail(), { why: '他掀开了地窖的盖板 · 胜则藏住' });
}
// 夜里: someone in the storeroom
// (the 家丁头 on 护院 has intrigue's own card, guardCard: this one is for a house without a watch)
function duelThief() {
  const bonus = typeof guarded === 'function' && guarded() ? 1 : 0, men = typeof hasPerk === 'function' && hasPerk('家丁'), zei = duelFoe('zei');
  const caught = () => { addFish(20); addPrest(3); };
  const O = [], side = nightChamp();
  // a house with guards doesn't need its head holding the lamp
  if (men) O.push(opt('带家丁去堵门', '鱼干+20 · 名望+3', caught));
  // (廉颇's soldiers catch him: that is the one time they step in)
  if (bonus) O.push(opt('叫廉颇的老兵去堵', '鱼干+20 · 名望+3', () => { useGuard(); caught(); }));
  else O.push(opt(side ? '叫' + nm(side) + '提灯去看' : '提灯去看', duelHint('比剑', zei, { side }, '鱼干+20 · 名望+3'), () => {
    startDuel('比剑', zei, win => { if (win) caught(); else { addFish(-15); toast('贼翻墙跑了', '#ff9a8a'); } }, { why: '胜：鱼干+20 · 名望+3', side }); }));
  // (staying in bed galls the brave: growth's 心烦 for 勇猛)
  if (!men) O.push(opt('喊醒家丁', withTip('鱼干-15', '勇猛'), () => { addFish(-15); addStress(P(), '勇猛'); }));
  O.push(opt('明天再说', withTip('鱼干-40', '勇猛'), () => { addFish(-40); addStress(P(), '勇猛'); }));
  return { title: '夜里', who: [], text: '半夜，库房里有动静。', opts: O };
}
// 跑远途商队: bandits one trip in eight or so; your 家丁头 fights them if he is the better blade
// (the 家丁头 rides along only on 押镖; a robbed trip is a failed one: no bonuses ride on it)
function caravanRoad(g) {
  if (!chance(.12)) return false;
  const fei = duelFoe('fei'), p = P(), head = typeof seatOn === 'function' && seatOn('家丁头', 1) ? councilSeat('家丁头') : null;
  const side = alive(head) && head !== p && stat(head, 0) > stat(p, 0) ? head : null;
  startDuel('比剑', fei, win => { addFish(win ? g + 20 : R(g / 2)); if (!win) toast('山贼抢走了一半的货', '#ff9a8a'); didAct('caravan', null, 1, win); },
    { title: '比剑 · 山贼', why: '商队路上遇到山贼 · 败则丢一半的货', side });
  return true;
}
// 提亲 refused: one more try, argued out (called from propose(); true when it offers the retry). Only for a close call
// (a 20%+ offer), once a year per family asked, and someone who dislikes the suitor starts ahead in the argument.
const retryBonus = (f, c) => -clamp(Math.floor(-opinion(c, f) / 25), 0, 2);
const retryOk = (f, c) => proposeChance(f, c) >= .2 && !W.cool['re_' + c.id] && alive(c) && reach(c);
// the chance of a yes, all told: the offer, and when it fails, the argument after it (the pickers show this)
function wedOdds(f, c) { const p0 = proposeChance(f, c); return p0 + (1 - p0) * (retryOk(f, c) ? duelOdds('舌战', c, { bonus: retryBonus(f, c) }) : 0); }
function proposeRetry(f, c, wed, kind) {
  if (!alive(c) || !alive(f) || !retryOk(f, c)) return false;
  W.cool['re_' + c.id] = 4; SFX.no();
  const bonus = retryBonus(f, c);
  pickOpt(nm(c) + '：' + sayLine(c, 'propose', false), [{ n: '再争取一次', s: duelHint('舌战', c, { bonus }, '胜则成亲'), style: 'gold', fn: () => startDuel('舌战', c, win => {
    if (win && alive(f) && alive(c) && !f.sp && !c.sp && canWed(f) && canWed(c) && !closeKin(f, c)) { wed(); didAct(kind || 'propose', c, 2, true); } else if (!win) toast(nm(c) + '还是没有答应', '#dddddd');
  }, { why: '胜：' + (f.id === W.player ? '你' : nm(f)) + '与' + nm(c) + '成亲', bonus }) }]);
  top().hold = true;   // (it answers the refusal: the next story card waits for it)
  return true;
}
SYS.acts.push((c, A) => {
  const p = P(); if (!p || !alive(c) || c.id === W.player || !reach(c)) return;
  // 招为门客: someone who doesn't like you can still be talked round
  const i = A.findIndex(a => a.id === 'hire');
  if (i >= 0 && opinion(c, p) < 0) A[i] = Object.assign({}, A[i], { hint: duelHint('舌战', c) + ' · 每季 6 鱼干', fn: () => { if (!spendAp(1)) return;
    startDuel('舌战', c, win => { const ok = win && hire(c); react(c, 'hire', !!ok); didAct('hire', c, 2, !!ok); }, { why: '胜：' + ta(c) + '入你门下' }); } });
  // 论辩: a 士 to argue with, for the town to talk about
  if (c.role === 'shi' && ageOf(c) >= 16 && ageOf(p) >= 16 && c.loc !== 'home' && !W.ret.includes(c.id)) {
    const cd = 'deb_' + c.id;
    A.push(mkAct({ id: 'debate', kind: 'debate', n: '论辩', ap: 1, grp: '友', hint: duelHint('舌战', c, null, '胜则名望+3'), no: () => W.cool[cd] ? '刚论辩过，再等 ' + W.cool[cd] + ' 季' : '',
      fn: () => { if (!spendAp(1)) return; W.cool[cd] = 4;
        startDuel('舌战', c, win => { if (win) { addPrest(3); addOp(c, P(), 5); } else toast(nm(c) + '不以为然', '#dddddd'); }, { why: '胜：名望+3 · ' + ta(c) + '好感+5' }); } }));
  }
});
// ---- end duel
