// ============================================================ main screens
let logSeen = '';   // the newest 近况 line when the list was last opened (not saved: after a reload it counts as read)
const logKey = () => { const L = W && W.log, e = L && L[L.length - 1]; return e ? e.t + '|' + e.s : ''; };
function openLog() {
  logSeen = logKey();
  const L = (W.log || []).slice().reverse();
  openList('近况', [{ t: '狸家纪事 ›', s: '历任家主、关键选择和灭国之功', fn: openChronicle, close: true }].concat(L.map(e => ({ t: e.s, s: typeof e.t === 'number' ? yearTxt(e.t) + ' ' + SEASON[((e.t % 4) + 4) % 4] : '', dot: e.col ? mixHex(e.col, '#3a2418', .45) : '#c29a52', wrap: true }))), { empty: '还没有什么消息' });
}
// last season's income and costs (W.lastEcon), line by line
function openEcon() {
  const E = W.lastEcon; if (!E) { toast('过完一季才有账目', '#dddddd'); return; }
  const row = sign => ([l, n]) => ({ t: l, right: (n ? sign : '') + n, col: sign === '+' ? '#276a32' : '#a0301f' });
  openList('上季账目', E.inc.map(row('+')).concat(E.cost.map(row('-'))), { sub: '收入 +' + E.tin + ' · 开销 -' + E.tout + ' · 小鱼干 ' + W.fish });
}
function drawTopBar() {
  // on the title only the sound icon sits over the key art
  if (state === 'title') { btn(4, 3, 34, 14, '存档', 'dark', openSaveManager); g.globalAlpha = .55; rect(163, 2, 14, 12, PAL.ink); g.globalAlpha = 1; g.drawImage(muted ? ICON.mute : ICON.snd, 166, 4); return; }
  rect(0, 0, W_, 16, PAL.ink); rect(0, 16, W_, 1, OUT);
  if (W) {
    txt(`${yearTxt(W.t)} ${SEASON[W.t % 4]}`, 4, 8.5, 7, '#f2ead4', 'left', null);
    if (SAVE_STATUS.error) { rect(3, 14, 50, 1, '#ff6a5a'); txt('!', 51, 8, 7, '#ff9a8a'); }
    hit(0, 0, 54, 16, () => { if (!holding()) openSaveManager(); });
    g.drawImage(ICON.fish, 58, 4); txt(W.fish, 75, 8.5, 7, '#ffe08a', 'left', null);
    txt('望' + W.prest, 104, 8.5, 6.5, '#c8e0ff', 'left', null);
    // the fish count opens last season's books
    if (state === 'game' && !MODAL.length) hit(55, 0, 46, 16, openEcon);
  }
  g.drawImage(muted ? ICON.mute : ICON.snd, 166, 4);
  if (W && state === 'game') {
    // 近况: the news log; a red dot while there is something new in it
    g.drawImage(ICON.scroll, 133, 4); if (W.log && W.log.length && logKey() !== logSeen) rect(141, 3, 3, 3, '#ff6a5a');
    hit(128, 0, 16, 16, () => { if (!holding() && !MODAL.some(m => m.type === 'list' && m.title === '近况')) openLog(); });
    g.drawImage(ICON.qm, 150, 4); hit(145, 0, 17, 16, () => { if (MODAL.length || W.queue.length) return; pickOpt('手边的事', [{ n: '眼下的事', s: '看目标、缘由和去处', fn: openObjective }, { n: '狸家纪事', s: '回看历代的选择', fn: openChronicle }, { n: '画卷图鉴', s: '剧情插画与人物立绘', fn: openArtGallery }, { n: '存档', s: '导出、导入和恢复备份', fn: openSaveManager }, { n: '怎么玩', fn: () => { W.loc = 'home'; MODAL.push({ type: 'tour', i: 0 }); } }]); });
  }
}
const siegeOn = () => !!(W.flags.siege && !W.flags.siegeOver);
// the name of the place a tab shows, in the current city
function areaName(tab) {
  const CT = CITY[W.city] || CITY.handan;
  return tab === 'home' ? (W.city === 'handan' ? '狸宅' : '狸宅 · ' + CT.n) : tab === 'market' ? CT.mkt : tab === 'court' ? CT.court : tab === 'travel' ? CT.gate : CT.n;
}
// who stands in a scene; at home the spouse first, then young kids, grown kids, retainers, the rest
function sceneCats(tab) {
  const p = P();
  if (tab === 'home') {
    const seen = new Set(), list = household().concat(W.ret.map(C)).filter(c => alive(c) && c.id !== W.player && !seen.has(c.id) && seen.add(c.id));
    const rank = c => c.id === p.sp ? 0 : (c.mom === p.id || c.dad === p.id) ? (ageOf(c) < 16 ? 1 : 2) : W.ret.includes(c.id) ? 3 : 4;
    return list.sort((a, b) => rank(a) - rank(b) || opinion(b, p) - opinion(a, p));
  }
  return tab === 'market' ? hereList('market') : tab === 'court' ? hereList('palace') : [];
}
// ---------------------------------------------------------- the map on the 行 tab
// The seven states as painted regions (nearest-seed with a little noise for the borders), the cities the house can live
// in as dots. It is the same rules with a face on them: tap a city to move there (迁居), tap a state in act three to
// march on it or work against it (the 天下 list).
const MAP_ST = {
  qin: { n: '秦', c: '#5a3a44', lx: 30, ly: 56, seeds: [[16, 46], [44, 66], [30, 90], [14, 106], [52, 48]] },
  zhao: { n: '赵', c: '#4f78a8', lx: 86, ly: 36, seeds: [[78, 36], [104, 46]] },
  yan: { n: '燕', c: '#7a6aa8', lx: 146, ly: 22, seeds: [[134, 20], [160, 26]] },
  qi: { n: '齐', c: '#3f8a5e', lx: 156, ly: 54, seeds: [[152, 52], [168, 62]] },
  wei: { n: '魏', c: '#c29a52', lx: 132, ly: 76, seeds: [[98, 70], [124, 72]] },
  han: { n: '韩', c: '#8a8c96', lx: 80, ly: 86, seeds: [[76, 82]] },
  chu: { n: '楚', c: '#b5503a', lx: 132, ly: 100, seeds: [[92, 102], [130, 96], [164, 88], [60, 110]] },
  hu: { c: '#6f7a5a', seeds: [[24, 10], [70, 8], [108, 12]] },
  sea: { c: '#5a86a8', seeds: [[182, 40], [184, 74], [182, 104]] },
};
const MAP_CITY = { xianyang: [40, 72], handan: [96, 52], daliang: [100, 66], henan: [70, 68], shu: [18, 102] };
const MAPC = new Map();
const mapFallen = k => typeof rFallen === 'function' && rFallen(k);
const mapCh = () => typeof chOn === 'function' && chOn();
function mapImg() {
  const ch = mapCh(), key = ch ? 'ch' + Object.keys(MAP_ST).map(k => W.ch.own[k] || '').join(',') : Object.keys(MAP_ST).map(k => mapFallen(k) ? 1 : 0).join('');
  let c = MAPC.get(key); if (c) return c;
  c = mk(180, 112); const x2 = c.getContext('2d'), own = new Array(180 * 112);
  const S = []; for (const k in MAP_ST) for (const [sx, sy] of MAP_ST[k].seeds) S.push([sx, sy, k]);
  for (let y = 0; y < 112; y++) for (let x = 0; x < 180; x++) {
    let best = 1e9, bk = 'hu';
    for (const [sx, sy, k] of S) { const d = Math.hypot(x - sx, (y - sy) * 1.15) + vnoise(x, y, hashStr(k) & 255, 9) * 12; if (d < best) { best = d; bk = k; } }
    own[y * 180 + x] = bk;
  }
  const col = k => ch && W.ch.own[k] ? CH_F[W.ch.own[k]].col : mapFallen(k) ? mixHex(MAP_ST[k].c, MAP_ST.qin.c, .72) : MAP_ST[k].c;
  for (let y = 0; y < 112; y++) for (let x = 0; x < 180; x++) {
    const k = own[y * 180 + x], edge = (x < 179 && own[y * 180 + x + 1] !== k) || (y < 111 && own[(y + 1) * 180 + x] !== k);
    x2.fillStyle = edge ? shade(col(k), -38) : hash2(x, y, 5) < .08 ? shade(col(k), 10) : col(k); x2.fillRect(x, y, 1, 1);
  }
  if (MAPC.size > 12) MAPC.clear();
  MAPC.set(key, c); return c;
}
function mapMove(k) {
  const nmC = CITY[k] ? CITY[k].n : '';
  if (k === W.city) { toast('狸家就住在' + nmC, '#f2ead4'); return; }
  if (typeof a3MoveAct !== 'function' || W.act < 3) { toast(nmC + ' · 眼下走不开', '#dddddd'); return; }
  if (W.kingId === W.player) { toast('王不离咸阳', '#dddddd'); return; }
  const a = a3MoveAct(), why = a.no ? a.no() : '';
  if (why) { toast(why, '#ff9a8a'); return; }
  if (k === 'xianyang' && a3Banned()) { toast('王上不许你回咸阳', '#ff9a8a'); return; }
  if (!a3Cities().includes(k)) { toast(nmC + '没有狸家的落脚处', '#dddddd'); return; }
  pickOpt('搬去' + nmC + '？', [{ n: '搬家', s: (a.danger ? a.danger + ' · ' : '') + A3_MOVE[k] + ' · 八季内不能再搬', style: a.danger ? 'red' : 'jade', fn: () => a3MoveTo(k) }]);
}
function mapState(k) {
  const D = MAP_ST[k];
  if (mapCh()) { chMenu(W.ch.own[k]); return; }
  if (k === 'qin') { toast('秦' + (W.a3 && typeof realmOn === 'function' && realmOn() ? ' · 国力 ' + W.a3.guo : ''), '#f2ead4'); return; }
  if (typeof realmOn !== 'function' || !realmOn()) { toast(mapFallen(k) ? D.n + ' · 已灭' : D.n + '国', '#f2ead4'); return; }
  if (mapFallen(k)) { toast(D.n + ' · 已灭', '#dddddd'); return; }
  if (a3Court()) a3Menu(k); else toast(D.n + ' · 实力 ' + W.realm[k].s + (a3Role() === 'low' ? ' · 客卿以上才能议天下事' : ' · 人不在秦国，只能看着'), '#dddddd');
}
function drawMap() {
  g.drawImage(mapImg(), 0, 17);
  const live = typeof realmOn === 'function' && realmOn();
  const ch = mapCh(), seen = {};
  for (const k in MAP_ST) {
    const D = MAP_ST[k]; if (!D.n) continue;
    // 楚汉: each region wears its holder's colour; the holder's name and strength sit on the first region it holds
    if (ch) { const o = W.ch.own[k], x = D.lx, y = 17 + D.ly; hit(x - 13, y - 8, 26, 22, () => mapState(k)); if (!o || seen[o]) continue; seen[o] = 1;
      txt(CH_F[o].n + (W.ch.ally === o ? '·盟' : ''), x, y, 9, o === 'you' ? '#ffe08a' : '#fff6dc', 'center', OUT); txt(chF(o).s, x, y + 9, 6, '#ffe08a', 'center', OUT); continue; }
    const f = mapFallen(k), x = D.lx, y = 17 + D.ly;
    txt(D.n, x, y, 9, f ? '#b0a8a8' : '#fff6dc', 'center', OUT);
    if (live && k !== 'qin' && !f) txt(W.realm[k].s, x, y + 9, 6, '#ffe08a', 'center', OUT);
    if (live && k === 'qin') txt(W.a3.guo, x, y + 9, 6, '#ffe08a', 'center', OUT);
    hit(x - 13, y - 8, 26, 22, () => mapState(k));
  }
  // (a faction without land yet — 刘季 before he takes 关中 — camps at 沛, in the east of 楚)
  if (ch) for (const o of chAI()) if (!seen[o]) { txt(CH_F[o].n + (W.ch.ally === o ? '·盟' : ''), 160, 17 + 80, 8, '#ffd0e8', 'center', OUT); txt(chF(o).s, 160, 17 + 88, 6, '#ffe08a', 'center', OUT); hit(148, 17 + 73, 24, 20, () => chMenu(o)); break; }
  for (const k in MAP_CITY) {
    if (!CITY[k]) continue;
    const [cx, cy0] = MAP_CITY[k], cy = 17 + cy0, here = k === W.city;
    if (here) { g.globalAlpha = .45 + .4 * Math.abs(Math.sin(T * 2)); rect(cx - 4, cy - 4, 9, 9, PAL.gold); g.globalAlpha = 1; }
    rect(cx - 2, cy - 2, 5, 5, OUT); rect(cx - 1, cy - 1, 3, 3, here ? PAL.gold : '#f2ead4');
    txt(CITY[k].n, cx + 5, cy + 1, 5.5, here ? '#ffe08a' : '#f2ead4', 'left', OUT);
    hit(cx - 7, cy - 7, 30, 15, () => mapMove(k));
  }
  if (ch) txt('点一家出手', 176, 124, 5.5, '#f2ead4', 'right', OUT);
  else if (W.act >= 3) txt(live ? '点城迁居 · 点国出手' : '点城迁居', 176, 124, 5.5, '#f2ead4', 'right', OUT);
}

function drawCity() {
  if (!TABS[W.loc]) W.loc = 'home';
  const tab = W.loc, p = P();
  TANCH = [64, 1];   // notices go under the widget (and its rows), over the backdrop
  if (tab === 'people') drawPeople(); else {
    // backdrop + the cats you can see here
    const isMap = tab === 'travel';
    if (isMap) drawMap(); else g.drawImage(scene(TABS[tab].scene), 0, 17);
    runSys('scene', tab);
    const an = areaName(tab);
    txt(an, 5, 25, 8, '#fff6dc', 'left', OUT);
    if (siegeOn()) chip('围城', R(5 + tw(an, 8) + 4), 20, '#b0301f', () => toast('围城：收入减半，商队出不了城', '#ff9a8a'));
    const goal = objective(); if (goal) wrapGoal(goal, 103, 5.5).forEach((l, i) => txt(l, 5, 36 + i * 7, 5.5, '#ffe08a', 'left', OUT));
    txt('›', 113, 39, 7, '#ffe08a', 'center', OUT);
    hit(3, 30, 112, 18, openObjective);
    const all = isMap ? [] : sceneCats(tab), here = all.slice(0, 7), more = all.length - here.length;
    const sp = Math.min(24, 160 / Math.max(1, here.length + 1 + (more ? 1 : 0)));
    const drawOne = (c, x, yb) => { rect(R(x - 6), R(yb - 1), 12, 2, 'rgba(20,12,24,.28)'); rect(R(x - 4), R(yb + 1), 8, 1, 'rgba(20,12,24,.2)'); g.drawImage(mini(c), R(x - 8), R(yb - 22)); hit(x - 9, yb - 23, 18, 24, () => openSheet(c.id)); };
    if (!isMap) drawOne(p, 18, 124);
    here.forEach((c, i) => drawOne(c, 40 + i * sp + (i & 1) * 2, 120 + (i & 1) * 4));
    if (more) {
      const mx = R(40 + here.length * sp + 4);
      txt('+' + more, mx, 110, 6.5, '#fff6dc', 'center', OUT);
      hit(mx - 8, 100, 17, 22, tab === 'home' ? () => { openFamily(); top().list = true; } : () => { W.loc = 'people'; PEOPLE_SCR.key = ''; });
    }
    if (!isMap) g.drawImage(ICON.ap, 15, 93 + Math.sin(T * 3) * 1.2);
    // top-right widget (118,19,59,≈45): Act 1's race first, then whichever system has something to show;
    // under it (from y 64, or 19 with no widget) the systems' rows (SYS.rows), and the notices below those. The rows stop
    // at a floor (lim) so they never cover the cats in the scene; what doesn't fit, a system folds into one row.
    // (the map keeps its whole face: no widget or rows over the north-east)
    const drewW = !isMap && (raceWidget() || SYS.widget.some(f => f())), wy0 = drewW ? 64 : 19, lim = drewW ? 94 : 60;
    let wy = wy0;
    if (!isMap) for (const f of SYS.rows) wy += f(wy, lim) || 0;
    // with rows on the right (an errand, schemes) the notices keep left of them instead of sliding down onto the card
    TANCH = isMap ? [126, -1] : wy > wy0 ? [66, 1, 58, 112] : [Math.max(64, wy + 2), 1];   // (on the map the notices rise from its foot)
    // player card. Slots the systems draw into (SYS.card, after this): merit bar y152–153 x42–136,
    // xp bars y166–167 (20 px under each stat), button slot B (140,151,36,14)
    rect(0, 129, W_, 191, '#2a2030'); rect(0, 129, W_, 1, OUT);
    drawPortrait(p, 5, 133, 1, '#e8d4a8'); hit(4, 132, 34, 34, () => openSheet(p.id));
    txt(nm(p), 42, 138, 8, '#fff6dc', 'left', null);
    txt(`${ageOf(p)}岁 · ${RANKS[W.rank]}`, 42, 149, 6, '#c8b8a8', 'left', null);
    // health (red below 40) and 心烦 pips (all three lit: a breakdown is coming)
    const hp = R(p.health), sl = stressLv(p);
    g.drawImage(ICON.heart, 97, 144); txt(hp, 107, 149, 6, hp < 40 ? '#ff8a8a' : '#f2ead4', 'left', null);
    pipRow(sl, 3, 124, 147, sl >= 2 ? '#ff5a7a' : '#e08aa8', '#4a3a50');
    hit(95, 141, 45, 14, () => toast('健康 ' + hp + ' · 心烦 ' + sl + '/3', '#f2ead4'));
    for (let i = 0; i < 4; i++) { rect(42 + i * 24, 156, 9, 9, STATC[i]); txt(STATN[i], 46.5 + i * 24, 160.5, 6, '#fff', 'center', null); txt(stat(p, i), 53 + i * 24, 160.5, 6.5, '#f2ead4', 'left', null); }
    btn(140, 133, 36, 16, '家族', 'gold', () => openFamily());
    runSys('card', p);
    // up to 4 actions as full rows, 5–8 in two columns
    const acts = tabActions(tab).slice(0, 8);
    acts.forEach((a, i) => acts.length <= 4 ? actBtn(a, 5, 172 + i * 24, 170, 21) : actBtn(a, 5 + (i & 1) * 86, 172 + (i >> 1) * 24, 84, 21));
  }
  // end of season
  rect(5, 272, 50, 18, '#1b1622');
  txt('精力', 9, 281, 6, '#c8b8a8', 'left', null);
  for (let k = 0, n = Math.max(apMax(p), W.ap); k < n; k++) g.drawImage(k < W.ap ? ICON.ap : ICON.apOff, 29 + k * 6, 278);
  btn(60, 271, 115, 20, W.ap ? '结束本季 ▸' : '结束本季 ▸▸', W.ap ? 'dark' : 'red', () => endSeason());
  // five fixed tabs
  rect(0, 294, W_, 26, PAL.ink);
  const hl = W.ap > 0 ? hintTab() : null;
  TAB_ORDER.forEach((k, i) => {
    const x = i * 36, on = tab === k;
    if (on) { rect(x + 1, 295, 34, 24, '#5a4a30'); rect(x + 1, 295, 34, 1, PAL.gold); }
    const ic = ICON['tab_' + k]; g.drawImage(ic, R(x + 18 - ic.width / 2), 297);
    txt(TABS[k].n, x + 18, 314, 6, on ? '#ffe08a' : '#a89888', 'center', null);
    if (hl === k && !on) { g.globalAlpha = .4 + .5 * Math.abs(Math.sin(T * 3)); rect(x + 1, 295, 34, 1, '#ffd24a'); rect(x + 1, 318, 34, 1, '#ffd24a'); rect(x + 1, 295, 1, 24, '#ffd24a'); rect(x + 34, 295, 1, 24, '#ffd24a'); g.globalAlpha = 1; }
    hit(x, 294, 36, 26, () => { W.loc = k; PEOPLE_SCR.key = ''; });
  });
}
function raceWidget() {
  if (!(W.act === 1 && W.flags.metYiren && alive(C('yiren')) && !W.flags.act1Done)) return false;
  const p = P(), yr = C('yiren'), a = clamp(opinion(yr, p), 0, 100), b = clamp(opinion(yr, C('lv')), 0, 100);
  rect(118, 20, 59, 34, 'rgba(22,18,26,.75)');
  txt(nm(yr) + '好感', 147, 25, 5.5, '#f2ead4', 'center', null);
  txt('你', 122, 32, 5.5, '#ffe08a', 'left', null); rect(130, 30, 44, 4, '#3a3040'); rect(130, 30, R(a * .44), 4, '#e8b040');
  txt('吕', 122, 39, 5.5, '#d0b0ff', 'left', null); rect(130, 37, 44, 4, '#3a3040'); rect(130, 37, R(b * .44), 4, '#9a7bbd');
  // 立嗣: who has done the lobbying so far (gold = you, purple = 吕不韦), out of 100
  const cy = clamp(W.credit.you, 0, 100), cl = clamp(W.credit.lv, 0, 100 - cy);
  txt('立嗣', 122, 47, 5.5, '#c8e0ff', 'left', null); rect(136, 45, 38, 4, '#3a3040'); rect(136, 45, R(cy * .38), 4, '#e8b040'); rect(136 + R(cy * .38), 45, R(cl * .38), 4, '#9a7bbd');
  rect(118, 54, 59, 9, 'rgba(22,18,26,.75)'); txt('你 ' + W.credit.you + ' · 吕 ' + W.credit.lv, 147, 58.5, 5.5, W.credit.you >= W.credit.lv ? '#ffe08a' : '#d0b0ff', 'center', null);
  return true;
}
// a cadet house's people who are no longer close kin (and their spouses): one row in the 人 list, not dozens
// (worked out once a season: kinship doesn't change in between, and the list is drawn every frame)
const FARC = { t: -1, pid: null, m: new Map() };
function farCadet(c) {
  if (!c.flags.branch || (c.house !== 'li' && c.house !== 'in')) return false;
  if (FARC.t !== W.t || FARC.pid !== W.player) { FARC.t = W.t; FARC.pid = W.player; FARC.m.clear(); }
  let v = FARC.m.get(c.id); if (v !== undefined) return v;
  const p = P(); v = !closeKin(c, p) && !(c.sp && closeKin(C(c.sp), p)); FARC.m.set(c.id, v); return v;
}
const icoWant = () => ICON.want || (ICON.want = rows(['BBBBB', 'BBWBB', 'BBWBB', 'BBBBB', 'BBWBB', '.B...'], { B: '#4a6a8a', W: '#ffffff' }));
// marks on a portrait in the 人 list: 挚/敌 top-left, a want top-right, the errand's letter bottom-right
function peopleMarks(c, y, jw) {
  const p = P(), fr = typeof isFriend === 'function' ? isFriend(c, p) : false, rv = typeof isRival === 'function' ? isRival(c, p) : false;
  if (fr || rv) chip(fr ? '挚' : '敌', 9, y, fr ? '#b08a2a' : '#a0301f');
  if (c.want) img(icoWant(), 38, y);
  if (jw.includes(c.id)) img(icoJob(), 36, y + 27);
}
// the 人 tab: everyone in town in one list; what you can do with them lives on their card
const PEOPLE_G = ['亲友', '权贵', '士', '百姓'];
let PEOPLE_F = 0;   // which group the 人 list shows (0 = all, with headings)
// 取名: you name yourself and your own line (the browser's own text box, so any phone keyboard works)
function askName(c) {
  if (typeof prompt !== 'function') return;
  let v = null; try { v = prompt('给' + nm(c) + '取个名字（1~3 个字，姓「' + c.sur + '」不用写）', c.name); } catch (e) { return; }
  if (v === null) return;
  v = [...String(v).replace(/[\s\u0000-\u007f，。！？、；：「」（）《》·…]/g, '')].slice(0, 3).join('');
  if (v.startsWith(c.sur) && v.length > c.sur.length) v = v.slice(c.sur.length);
  if (!v || v === c.name) return;
  const old = nm(c); c.name = v; if (c.disp && !c.hist) delete c.disp;
  NOTE_K = -1; logLine(old + '改名叫' + nm(c), '#ffe08a'); saveGame();
}
SYS.acts.push((c, A) => {
  const p = P(); if (!alive(c) || c.hist || c.house !== 'li') return;
  const mine = c.id === W.player || c.dad === p.id || c.mom === p.id || (ageOf(c) < 16 && p.kids.some(k => { const x = C(k); return x && (c.dad === x.id || c.mom === x.id); }));
  if (mine) A.push(mkAct({ id: 'rename', n: '取名', ap: 0, grp: c.id === W.player ? null : '家', hint: '换一个名字', fn: () => askName(c) }));
});
// 往事: a row on every card that has a past; tap it for the list
SYS.sheet.push((c, rows) => {
  const L = c.log; if (!L || !L.length) return;
  rows.push({ chip: '往事', col: '#6a5a4a', text: L[L.length - 1][1] + ' ›', fn: () => openList(nm(c) + ' · 往事', () => L.slice().reverse().map(([t, x]) => ({ t: x, s: yearTxt(t) + SEASON[t % 4] }))) });
});
function drawPeople() {
  rect(0, 17, W_, 277, '#2a2030');
  const all = townsfolk(), far = all.filter(farCadet), p = P();
  // close relatives, friends and rivals first (townsfolk sorts them up); the far cadets fold into one row after them
  // four groups, each under its own heading: yours (kin, friends, rivals), the great, the 士, the townsfolk;
  // the chips above the list show one group at a time
  const seatSet = typeof courtSeats === 'function' && W.a2 && W.city === 'xianyang' && W.act >= 2 ? new Set(courtSeats().map(s => s.c)) : null;
  const grp = c => relTo(c) || c.house === 'li' || (c.rel[p.id] || {}).tag === 'friend' || (p.rel[c.id] || {}).tag === 'friend' ? 0   // (a 宿敌 stays in his own group, marked 敌)
    : (seatSet && seatSet.has(c)) || ['ruler', 'noble', 'general', 'minister', 'hostage'].includes(c.role) || (!W.flags.act1Done && ['yiren', 'lv', 'zhaoji'].includes(c.id)) || (officeOf(c) && officeOf(c) !== '失势') ? 1 : c.role === 'shi' ? 2 : 3;
  const near = all.filter(c => !far.includes(c)), G = [[], [], [], []];
  for (const c of near) G[grp(c)].push(c);
  if (far.length) G[0].push({ fold: far });
  if (PEOPLE_F > 0 && !G[PEOPLE_F - 1].length) PEOPLE_F = 0;
  const list = [];
  G.forEach((L, i) => { if (!L.length || (PEOPLE_F && PEOPLE_F - 1 !== i)) return; if (!PEOPLE_F) list.push({ head: PEOPLE_G[i] + ' ' + L.length }); list.push(...L); });
  const jw = W.job && typeof jobWho === 'function' ? jobWho(W.job) || [] : [];
  const seats = typeof courtSeats === 'function' && W.a2 && W.city === 'xianyang' && W.act >= 2 ? new Map(courtSeats().map(s => [s.c, s])) : null;
  txt(areaName('people') + ' · 人物 ' + all.length, 6, 25, 7.5, '#fff6dc', 'left', null);
  const goal = objective(); if (goal) wrapGoal(goal, 78, 5.5).forEach((l, i) => txt(l, 6, 34 + i * 7, 5.5, '#ffe08a', 'left', null));
  txt('›', 89, 38, 7, '#ffe08a', 'center', null);
  hit(3, 29, 89, 17, openObjective);
  const pa = peopleActions(), bw = pa.length > 2 ? Math.floor(82 / pa.length) - 2 : 40;
  pa.forEach((a, i) => actBtn(a, 96 + i * (bw + 2), 19, bw, 22));
  paper(3, 46, 174, 223);
  ['全部'].concat(PEOPLE_G).forEach((n, i) => {
    const x = 9 + i * 33, on = PEOPLE_F === i, has = !i || G[i - 1].length;
    rect(x, 50, 31, 12, OUT); rect(x + 1, 51, 29, 10, on ? '#b5312a' : has ? '#d8c8a0' : '#e8dcc0');
    txt(n, x + 15.5, 56, 6, on ? '#fff6dc' : has ? '#3a2418' : '#a89878', 'center', null);
    if (has) hit(x, 48, 32, 15, () => { PEOPLE_F = i; PEOPLE_SCR.y = 0; });
  });
  const more = listRows(list, 64, 258, 'people' + PEOPLE_F, (c, y) => {
    if (c.head) { rect(8, y + 2, 164, 9, '#d8c8a0'); txt(c.head, 12, y + 7, 6, '#5a3a20', 'left', null); return; }
    if (c.fold) {
      const L = c.fold; rect(12, y + 5, 32, 24, '#e8d4a8'); L.slice(0, 3).forEach((x, i) => img(mini(x), 13 + i * 9, y + 6));
      txt('狸氏分家 ' + L.length + ' 人 ›', 50, y + 13, 7.5, '#3a2418', 'left', null); txt('远房的族人和他们的配偶', 50, y + 24, 5.5, LABC, 'left', null, 1, 1);
      hit(8, y, 164, 34, () => openList('狸氏分家', () => L.filter(alive).map(x => { const o = opinion(x, P()); return { por: x, t: nm(x), s: ageOf(x) + '岁 · ' + (LOCN[x.loc] || '') + ' · ' + (GROUPN[x.role] || ''), right: (o > 0 ? '+' : '') + o, col: opCol(o), fn: () => openSheet(x.id) }; })));
      return;
    }
    const s = seats && seats.get(c), lk = s && s.lean, head = s && lk && lk !== 'you' && LEAD[lk].cat() === c;
    charRow(c, y, () => openSheet(c.id), (typeof MASTERS !== 'undefined' && MASTERS[c.id] !== undefined ? '名师·' + STATN[MASTERS[c.id]] + ' · ' : '') + (c.house === 'li' ? '狸氏 · ' : '') + (s ? (head ? (lk === 'wang' ? '王' : lk === 'zong' ? '宗室之首' : LEAD[lk].n + '系之首') : lk ? (lk === 'you' ? '你的人' : '倾向' + LEAD[lk].n) : '朝中中立') : (LOCN[c.loc] || '') + ' · ' + (officeOf(c) || GROUPN[c.role] || '')));
    // (a seat at court: a square in its leader's colour, hollow while neutral)
    if (s) { rect(5, y + 27, 5, 5, lk ? LEAD[lk].ink : '#6a6268'); rect(6, y + 28, 3, 3, lk ? LEAD[lk].col : '#e8d4a8'); }
    peopleMarks(c, y, jw);
  }, it => it.head ? 13 : 36);
  if (more) txt('▼ 还有' + more + '人', 90, 263, 5.5, LABC, 'center', null, 1, 1);
  TANCH = [256, -1];
}
// The goal line: Act 1's built-in goals and the systems' goals (SYS.goal -> { s, tab, pri }) compete, lowest pri wins;
// with nothing else going on, free mode picks a concrete goal from the family's state.
// The tab named in the last （…） is the tab that pulses, so the two never disagree.
const TAB_OF = { 家: 'home', 市: 'market', 宫: 'court', 人: 'people', 行: 'travel' };
function actOneGoal() {
  if (W.act !== 1 || W.flags.act1Done) return '';
  // (the night of the escape: the gold is paid or not, and the cards that follow tell the rest)
  if (W.flags.escapeLead) return '目标：熬过这一夜（家）';
  const yr = C('yiren'); if (!alive(yr)) return '';
  const n = nm(yr);
  if (!W.flags.metYiren) return '目标：结识秦国质子' + n + '（人）';
  if (!W.flags.knowHuayang) return '目标：打听秦国后宫（人 · 打听）';
  // the escape at the end of the siege costs 300 in gold: save up once the siege starts or 立嗣 is done
  if ((W.heir >= 100 || W.flags.siege) && !W.flags.escapeLead) return W.fish < 300 ? '目标：备出城的金子 ' + W.fish + '/300（市）' : '目标：护住' + n + '，等到出城（人）';
  if (opinion(yr, P()) < 25) return '目标：' + n + '对你的好感到 25（人）';
  // (from 前260 the gold for the night is said too: the siege comes in 前259)
  const gate = W.t >= 10 ? ' · 出城要备 300' : '';
  if (W.fish < RACE.fish) return '目标：攒够 ' + RACE.fish + ' 鱼干，遣使咸阳' + gate + '（市）';
  if (W.heir < 100) return '目标：遣使咸阳，压过吕不韦' + gate + '（行）';
  return '目标：护住' + n + '，等到出城（人）';
}
function freeGoal() {
  const p = P(), fam = household().filter(c => c.house === 'li');
  if (W.fish < 30) return '目标：经商，攒些鱼干（市）';
  if (ageOf(p) >= 16 && ageOf(p) <= 45 && !p.sp) return '目标：成家（家 · 说媒）';
  const single = adults(fam).find(c => c.id !== W.player && !c.sp && ageOf(c) <= 40);
  if (single) return '目标：给' + nm(single) + '说媒（家）';
  // (the same children the 教导 button offers, and only while their schooling is still thin)
  const kid = kinPool().find(c => c.id !== W.player && ageOf(c) >= 3 && ageOf(c) < 16 && (c.edu || [0, 0, 0, 0]).reduce((a, b) => a + b, 0) < 6);
  if (kid) return '目标：教导' + nm(kid) + '（家）';
  const sp = p.sp && C(p.sp);
  // (陪伴 only reaches the household: a spouse who lives elsewhere, e.g. 子楚 in 咸阳, is no goal for the 家 tab)
  if (sp && household().includes(sp) && opinion(sp, p) < 20) return '目标：多陪陪' + relTo(sp) + '（家）';
  if (W.fish < 80) return '目标：攒够 80 鱼干（市）';
  if (W.prest < 20) return '目标：拜谒权贵，攒名望（人）';
  const k = cityRuler(), tc = 80 * (1 + prestTier().i);
  if (alive(k) && k !== p) return W.fish >= tc ? '目标：进献，提高名望（宫）' : '目标：经商，攒够进献的 ' + tc + ' 鱼干（市）';
  return '目标：经商，攒些鱼干（市）';
}
// priorities (spec): story 10, urgent health 15, 差事 20, schemes 30, ambitions 50, free-mode hints 90
function topGoal() {
  const out = [], a1 = actOneGoal(), pr = r => r.pri === undefined ? 60 : r.pri;
  if (a1) out.push({ s: a1, pri: household().some(c => isIll(c) && c.ill.k === '重病') ? 25 : 10 });
  for (const f of SYS.goal) { const r = f(); if (r && r.s) out.push(r); }
  if (!a1) out.push({ s: freeGoal(), pri: 90 });
  return out.reduce((b, r) => pr(r) < pr(b) ? r : b);
}
function objective() {
  const r = topGoal();
  return r.tab && TABS[r.tab] && !r.s.includes('（') ? r.s + '（' + TABS[r.tab].n + '）' : r.s;
}
function hintTab() { const s = objective(), i = s.lastIndexOf('（'); return i >= 0 ? TAB_OF[s[i + 1]] || null : null; }
// the goal line in two lines at most, broken at its ' · ' joints (never inside '（…）'; the tab tag stays with the last
// piece), so no line starts or ends on the dot; when that would take more than two lines, a plain wrap
function wrapGoal(s, maxW, size) {
  const segs = []; let cur = '', depth = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '（') depth++; else if (ch === '）') depth = Math.max(0, depth - 1);
    if (!depth && s.startsWith(' · ', i)) { segs.push(cur); cur = ''; i += 2; continue; }
    cur += ch;
  }
  segs.push(cur);
  const out = []; let line = '';
  for (const seg of segs) {
    const t = line ? line + ' · ' + seg : seg;
    if (tw(t, size) <= maxW) { line = t; continue; }
    if (line) out.push(line);
    if (tw(seg, size) <= maxW) line = seg; else { const L = wrapT(seg, maxW, size); line = L.pop(); out.push(...L); }
  }
  if (line) out.push(line);
  if (out.length <= 2) return out;
  // (too long either way: a plain wrap, the second line cut short so the tab tag still shows)
  const m = s.match(/（[^（）]*）$/), tag = m ? m[0] : '', L = wrapT(tag ? s.slice(0, -tag.length) : s, maxW, size);
  return L.length < 2 ? [L[0] + tag] : [L[0], fitT(L.slice(1).join(''), maxW - tw(tag, size), size) + tag];
}
// The title screen shows the painted key art (art/title.jpg) at full resolution behind the pixel UI
const TITLE_IMG = new Image(); TITLE_IMG.src = 'art/title.jpg';
function drawTitleArt() {
  if (!(TITLE_IMG.complete && TITLE_IMG.naturalWidth)) return;
  const iw = TITLE_IMG.naturalWidth, ih = TITLE_IMG.naturalHeight, sc = Math.max(cv.width / iw, cv.height / ih);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(TITLE_IMG, (cv.width - iw * sc) / 2, 0, iw * sc, ih * sc);
  ctx.imageSmoothingEnabled = false;
}
