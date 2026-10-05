// ==== ACT2 ==== 第二幕 · 仲父（咸阳）
// 前257秋–前238冬 (t22–99; t100 closes the act). You follow 子楚 to 咸阳 (or stay in 邯郸 and come later) and climb from
// 舍人 to 客卿, 相邦 and 仲父 while 吕不韦, 嫪毐, the 楚 party, the royal clan and a growing 政 pull the court their way. At
// 政's capping (t97) you pick a side; t99 settles how it ends (W.a2.end), t100 closes the act (W.act = 3).
// API for ACT3 and ACT2-content (plain calls, all defined in this section):
//   king() the reigning 秦王 (W.kingId, else the line of kings) · qm() 政's mother (the 太后 of the story) or null
//   inQin() the house lives in 咸阳 · a2Here() act two in 咸阳 · a2Hd() act two in 邯郸 · goCity(city) moves the house
//   W.a2 { line 'xy' 咸阳 | 'hd' 邯郸 line | 'free' stayed a merchant | 'zhao' the betrayer; wang 王权 0–100; yi 政's 忌惮 0–100
//     (−yi/2 on his opinion of you); lonely 太后寂寞; claim 成峤's claim; laoMen 嫪毐's men; laoIn 嫪毐 at court; lvDown 吕不韦
//     has fallen; xiang / zhongfu who holds 相邦 / 仲父 ('you' | 'lv' | an id | null); fief 封君; recs your men at court;
//     cx courtiers added in play; gone ids put out of court; side 冠礼 'king'|'lao'|'none'|'coup'; quell you put the revolt
//     down yourself; coup 'lao' when 嫪毐 won; end null (never served 秦) | 'E1' 'E2' 'E3' 'E3b' 'E4' 'E5' 'retire' (a 客卿
//     without office: 辞官, or called to 咸阳 after t100); blood (E3b: 政 knows he is a 狸); letterT the next 咸阳来信; taught }
//   COURT [{ id, w, in, out, lean: { leader: n }, bing }] (static; push rows at load) · addCourtier(id, w, lean, bing) and
//   outOfCourt(id) in play (saved) · courtSeats() → [{ c, w, lean, bing }] · LEAD { you lv wang chu zong lao } → { n, col,
//   ink, cat() } · leanOf(c) → leader key | null (neutral under 20) · powerOf(key) → 势
//   CHAR2 { id: { t: the turn they arrive by themselves (null: an event brings them), o: mkc fields } } · spawn2(id, loc)
//   a2Sched(t, id, cond) a story card on the calendar (also added to STORY_EV) · A2_NEWS.push([t, text]) news only ·
//   A2_ENVOY.push(evId) what an 出使 may bring back · lvFall(why) · laoFalls() · banish(c) · a2Doom(cause) E5 · a2Crown() E3 ·
//   endAs(k) · legit() · zhengBlood()
const inQin = () => !!W && W.city === 'xianyang';
const a2Here = () => !!W && W.act === 2 && W.city === 'xianyang';
const a2Hd = () => !!W && W.act === 2 && W.city === 'handan';
const QIN_KINGS = ['zhao', 'anguo', 'yiren', 'zheng', 'huhai', 'ziying'];
function king() { const k = W && W.kingId && C(W.kingId); return alive(k) ? k : W ? firstAlive(QIN_KINGS) : null; }
function qm() { const z = W && C('zheng'); return (z && z.mom && C(z.mom)) || null; }
const qmNpc = () => { const q = qm(); return alive(q) && q.id !== W.player ? q : null; };
const a2s = v => (v > 0 ? '+' : '') + v;
const rivalOf = (a, b) => { if (typeof mkRival === 'function') mkRival(a, b); else if (a && b) rel(a, b).tag = 'rival'; };

// ---------------------------------------------------------- 咸阳 (and 河南, the fief an exile goes to)
Object.assign(CITY.xianyang, { ruler: () => king(), locs: ['xmarket', 'xtavern', 'xpalace', 'hougong', 'xlvfu', 'camp', 'xgate', 'xianyang'],
  tabLoc: { market: 'xmarket', court: 'xpalace', people: 'xtavern', travel: 'xgate' },
  at: { market: 'xmarket', tavern: 'xtavern', palace: 'xpalace', gate: 'xgate', lvfu: 'xlvfu', pingyuan: 'xtavern', hostage: 'xtavern' } });
CITY.handan.tabLoc = { market: 'market', court: 'palace', people: 'tavern', travel: 'gate' };
CITY.henan = { n: '河南', court: '河南府', mkt: '河南市', gate: '河南城门', ruler: () => king(), locs: ['henan'], tabLoc: { market: 'henan', court: 'henan', people: 'henan', travel: 'henan' },
  at: { market: 'henan', tavern: 'henan', palace: 'henan', gate: 'henan', lvfu: 'henan', pingyuan: 'henan', hostage: 'henan' } };
Object.assign(LOCN, { xmarket: '咸阳市', xtavern: '客舍', xpalace: '咸阳宫', hougong: '后宫', xlvfu: '吕府', camp: '军营', xgate: '咸阳城门', yong: '雍城', henan: '河南', shu: '蜀地' });
Object.assign(ROBES, { han: ['#6f5a43', '#9ccb98'], yan: ['#27406b', '#dde6c8'], qi: ['#3f8a5e', '#ecd79a'] });
// Old code speaks 邯郸's words ('market', 'tavern'): a townsperson made there while the house lives elsewhere belongs to the
// house's city, and one sent there from this city stays here (flags.cy: the city a townsperson was last seen in)
const localLoc = loc => { const m = W && CITY[W.city] && CITY[W.city].at; return (m && m[loc]) || loc; };
const HD_LOCS = new Set(CITY.handan.locs);
{ const mk0 = mkc; mkc = o => { if (o && !o.hist && !o.id && W && o.loc && HD_LOCS.has(o.loc)) o.loc = localLoc(o.loc); return mk0(o); }; }
function locSweep() {
  if (!W) return; const here = W.city, m = CITY[here] && CITY[here].at;
  for (const c of Object.values(W.chars)) {
    if (c.dead !== null || c.hist) continue;
    if (c.loc === 'home' || cityOf(c) === here) { if (c.flags.cy !== here) c.flags.cy = here; }
    else if (m && c.flags.cy === here && m[c.loc]) c.loc = m[c.loc];
  }
}
function goCity(city) {
  if (!CITY[city] || !W || W.city === city) return;
  locSweep(); moveCity(city); W.loc = 'home'; PEOPLE_SCR.key = '';
  if (city === 'xianyang') { settleXy(); seedTown(); W.a2.xyT = W.t; }
  if (city === 'henan' || city === 'shu') seedPlace(city);
  // (政's mother when she is you: the boy comes along)
  const z = C('zheng'); if (alive(z) && z.mom === W.player && cityOf(z) !== city) z.loc = city === 'xianyang' ? 'hougong' : localLoc('hostage');
  locSweep(); PORT.clear(); MINI.clear();
}
// an exile's town (河南, 蜀) has a few people in it when the house arrives: a merchant, a 士, a neighbour
function seedPlace(city) {
  const A = W.a2; A.seedP = A.seedP || {}; if (A.seedP[city]) return; A.seedP[city] = 1;
  const st = city === 'shu' ? '蜀' : '秦';
  ['merchant', 'shi', 'commoner', 'commoner'].forEach((role, i) => {
    const female = i % 2 === 1, c = mkc({ sur: pick(SURS), name: pick(female ? GIV_F : GIV_M), female, born: W.t - 4 * (18 + Math.floor(Math.random() * 20)), loc: city, state: st, role });
    if (role !== 'commoner') c.robe = role;
  });
}
// a few people to meet when the house first comes to 咸阳 (social's newcomers fill the town up from there)
function seedTown() {
  if (W.a2.seeded) return; W.a2.seeded = true;
  ['xmarket', 'xtavern', 'xmarket', 'xtavern', 'xmarket', 'xtavern'].forEach((loc, i) => {
    const female = i % 2 === 1, c = mkc({ sur: pick(SURS), name: pick(female ? GIV_F : GIV_M), female, born: W.t - 4 * (18 + Math.floor(Math.random() * 16)), loc, state: '秦',
      role: loc === 'xtavern' && !female ? 'shi' : chance(.4) ? 'merchant' : 'commoner' });
    if (c.role !== 'commoner') c.robe = c.role;
  });
}

// ---------------------------------------------------------- the people of 秦 (CHAR2; st = [武, 政, 交, 谋])
Object.assign(HISTD, { fanju: 31, menga: 89, laoai: 98, chengping: 156, wangjian: 170 });
for (const id of ['zhao', 'anguo', 'yiren']) HIST_GONE.add(id);   // (their deaths are told by the story's cards: no 讣告)
const CHAR2 = {
  fanju: { t: 22, o: { disp: '范雎', sur: '范', name: '雎', born: bornAt(310), role: 'minister', robe: 'qin', state: '秦', loc: 'xpalace', tr: ['记仇', '狡诈', '野心'], st: [3, 14, 12, 17], g: { D: ['d', 'd'], A: ['a', 'a'], S: ['s', 's'], size: [-1, -1] } } },
  menga: { t: 22, o: { disp: '蒙骜', sur: '蒙', name: '骜', born: bornAt(300), role: 'general', robe: 'general', state: '秦', loc: 'camp', tr: ['勇猛', '诚实', '节制', '兵家'], st: [16, 8, 6, 11], g: { A: ['A', 'a'], S: ['S', 'S'] } } },
  caize: { t: 29, o: { disp: '蔡泽', sur: '蔡', name: '泽', born: bornAt(300), role: 'minister', robe: 'qin', state: '秦', loc: 'xpalace', tr: ['知足', '好客', '诚实', '纵横家'], st: [2, 11, 16, 10], g: { O: ['O'], S: ['S', 's'] } } },
  chengping: { t: 30, o: { disp: '昌平君', sur: '熊', name: '启', born: bornAt(271), role: 'minister', robe: 'chu', state: '秦', loc: 'xpalace', tr: ['多疑', '专一', '节制'], st: [9, 13, 12, 13], g: { A: ['a', 'a'], S: ['S', 's'], O: ['o'] } } },
  changwen: { t: 30, o: { disp: '昌文君', sur: '熊', name: '文', born: bornAt(268), role: 'minister', robe: 'chu', state: '秦', loc: 'xpalace', tr: ['诚实', '勇猛'], st: [10, 9, 10, 8] } },
  mengwu: { t: 70, o: { disp: '蒙武', sur: '蒙', name: '武', born: bornAt(276), dad: 'menga', role: 'general', robe: 'general', state: '秦', loc: 'camp', tr: ['诚实', '勤快'], st: [14, 8, 7, 9], g: { A: ['A', 'a'], S: ['S', 's'] } } },
  wangjian: { t: 89, o: { disp: '王翦', sur: '王', name: '翦', born: bornAt(285), role: 'general', robe: 'general', state: '秦', loc: 'camp', tr: ['知足', '狡诈', '节制', '兵家'], eduLv: 3, st: [19, 8, 9, 15], g: { B: ['b', 'b'], A: ['A', 'A'], size: [2, 2], body: [[1, 1], [1, 1]] } } },
  huanyi: { t: 90, o: { disp: '桓齮', sur: '桓', name: '齮', born: bornAt(272), role: 'general', robe: 'general', state: '秦', loc: 'camp', tr: ['勇猛', '记仇', '轻信'], st: [15, 5, 5, 8], g: { O: ['O'], S: ['S', 's'] } } },
  // (the story brings him: ACT2-content's 献嫪毐, or the 太后's household by t74 if nobody did)
  laoai: { t: null, o: { disp: '嫪毐', sur: '嫪', name: '毐', born: bornAt(272), role: 'shi', robe: 'shi', state: '秦', loc: 'hougong', tr: ['多情', '野心', '轻信'], st: [9, 3, 8, 5], g: { O: ['o'], A: ['A', 'A'], T: ['Tm', 'Tm'], I: ['I', 'I'], S: ['s', 's'], look: [[1, 1], [1, 1]] } } },
};
// (the table's arrays are copied: a cat's traits and stats change during play)
function spawn2(id, loc) {
  if (C(id)) return C(id);
  const d = CHAR2[id]; if (!d || (HISTD[id] !== undefined && W.t >= HISTD[id])) return null;
  return spawnHist(Object.assign({ id }, JSON.parse(JSON.stringify(d.o)), loc ? { loc } : {}));
}
// where 秦's people live in 咸阳 (act one and old saves keep them all at 'xianyang')
const XY_AT = { zhao: 'xpalace', anguo: 'xpalace', zixi: 'xpalace', yiren: 'xpalace', huayang: 'hougong', xiaji: 'hougong', lv: 'xlvfu', zhaoji: 'xlvfu' };
function settleXy() {
  for (const c of Object.values(W.chars)) if (alive(c) && c.loc === 'xianyang')
    c.loc = c.sp === 'yiren' || c.id === 'zheng' ? (c.role === 'ruler' ? 'xpalace' : 'hougong') : XY_AT[c.id] || (c.hist ? 'xpalace' : 'xmarket');
}
// 政 and his mother come home to 秦 in 前251 (the 归秦 card tells it; this is also the fallback when no card did)
const zhengInHandan = () => { const z = C('zheng'); return alive(z) && cityOf(z) === 'handan' && z.loc !== 'home'; };
function bringZheng() {
  const z = C('zheng'), q = qmNpc();
  for (const x of [z, q]) if (alive(x) && x.id !== W.player && cityOf(x) === 'handan' && x.loc !== 'home' && !household().includes(x)) x.loc = 'hougong';
  W.a2.guard = false;
}
// 政 must exist in act two (history needs him): a son for 子楚's wife, born the year he should have been
function ensureZheng() {
  if (C('zheng') || W.t < 12) return;
  const yr = C('yiren'); if (!alive(yr)) return;
  let m = yr.sp && C(yr.sp); if (!alive(m) || !m.female) m = C('zhaoji');
  if (!alive(m)) return;
  // A different marriage and its children are not a missing historical birth.
  if (m.sp && m.sp !== yr.id) return;
  if (m.sp !== yr.id && (m.house === 'in' || m.house === 'li' || (m.preg && m.preg.sp && m.preg.sp !== yr.id))) return;
  if (!yr.sp && !m.sp) marry(m, yr);
  if (m.preg) { Object.assign(m.preg, ZHENG); return; }
  const bio = m.id === 'zhaoji' ? C('lv') : yr;
  mkc({ id: 'zheng', name: '政', disp: '政', sur: '嬴', born: 12, mom: m.id, dad: 'yiren', bio: bio.id, g: breed(m.g, bio.g, Math.random, 'M'), female: false,
    loc: m.loc === 'home' ? 'hostage' : m.loc, role: 'noble', robe: 'qin', state: '秦', hist: true, immortal: true, dieT: HISTD.zheng, tr: randPers(Math.random, 2) });
  linkKids(); if (bio !== yr) addSecret('bastard', m.id, bio.id, 'zheng');
  logLine('秦公子政生在邯郸。', '#c8e0ff', true);
}

// ---------------------------------------------------------- the court: seats, leaders, lean, power
// A seat (w: its weight — a general's is 2) leans to the leader it thinks best of, counting where it leans anyway (lean);
// under 20 for everyone it is neutral. 势 = the seats leaning to you plus a leader's own weight (the king's 王权, your
// retainers and office, 吕不韦's three thousand guests, 嫪毐's men).
const COURT = [
  { id: 'fanju', w: 1, in: 22, out: 29 }, { id: 'caize', w: 1, in: 29 }, { id: 'menga', w: 2, in: 22, out: 89, lean: { wang: 10 }, bing: 1 },
  { id: 'zixi', w: 1, in: 22, out: 52, lean: { zong: 30 } }, { id: 'xiaji', w: 1, in: 22, out: 88, lean: { zong: 20 } },
  { id: 'chengping', w: 2, in: 30, lean: { chu: 30 } }, { id: 'changwen', w: 1, in: 30, lean: { chu: 25 } }, { id: 'mengwu', w: 1, in: 70, lean: { wang: 10 }, bing: 1 },
  { id: 'lisi', w: 1, in: 66 }, { id: 'ganluo', w: 1, in: 87 }, { id: 'wangjian', w: 2, in: 89, lean: { wang: 15 }, bing: 1 },
  { id: 'huanyi', w: 1, in: 90, out: 116, bing: 1 }, { id: 'maojiao', w: 1, in: 99 }, { id: 'weiliao', w: 1, in: 102 },
];
function addCourtier(id, w, lean, bing) { const A = W.a2; A.cx = A.cx.filter(r => r.id !== id).concat([{ id, w: w || 1, lean: lean || null, bing: bing ? 1 : 0 }]); delete A.gone[id]; CS.k = ''; }
function outOfCourt(id) { W.a2.gone[id] = 1; CS.k = ''; }
const qinCat = id => { const c = C(id); return alive(c) && cityOf(c) === 'xianyang' && !W.a2.gone[id] ? c : null; };
const LEAD = {
  you: { n: '你', col: '#e8b040', ink: '#8a5a10', cat: () => P() },
  lv: { n: '吕', col: '#9a7bbd', ink: '#5e3f86', cat: () => W.a2.lvDown ? null : qinCat('lv') },
  wang: { n: '王', col: '#e0604a', ink: '#a0301f', cat: () => { const k = king(); return k && k.id !== W.player ? k : null; } },
  chu: { n: '楚', col: '#4fa06e', ink: '#276a32', cat: () => (W.t < 128 && qinCat('huayang')) || qinCat('chengping') },
  zong: { n: '宗', col: '#a09aa8', ink: '#4a4250', cat: () => (W.t < 52 && qinCat('zixi')) || (W.t < 88 && qinCat('xiaji')) || qinCat('chengjiao') },
  lao: { n: '毐', col: '#e070a0', ink: '#a03060', cat: () => W.a2.laoIn ? qinCat('laoai') : null },
};
const LEAD_ORD = ['you', 'lv', 'wang', 'chu', 'zong', 'lao'];
// (worked out once a frame and after every action: the widget and the pickers ask all the time)
const CS = { k: '', w: null, v: [] };
function courtSeats() {
  const A = W && W.a2; if (!A) return [];
  const key = W.t + '|' + T + '|' + W.player; if (CS.k === key && CS.w === W) return CS.v;
  const out = [], seen = new Set();
  const add = (id, w, lean, bing) => { const c = C(id); if (seen.has(id) || !alive(c) || A.gone[id] || cityOf(c) !== 'xianyang' || c.id === W.player) return; seen.add(id); out.push({ c, w, bias: lean || {}, bing: !!bing }); };
  for (const r of COURT) if (W.t >= r.in && (r.out === undefined || W.t < r.out)) add(r.id, r.w, r.lean, r.bing);
  for (const r of A.cx) add(r.id, r.w, r.lean, r.bing);
  for (const id of A.recs) add(id, 1, { you: 10 });
  for (const s of out) s.lean = leanOf(s.c, s.bias);
  CS.k = key; CS.w = W; CS.v = out; return out;
}
// the leader c leans to (a strong hook you hold makes them yours); under 20 for everyone: neutral (null)
function leanOf(c, bias) {
  if (!c || !W || !W.a2) return null;
  if (bias === undefined) { const s = courtSeats().find(x => x.c === c); if (s) return s.lean; bias = {}; }
  if (typeof holdsHook === 'function' && holdsHook(c.id) === 'strong') return 'you';
  let best = null, bv = 19;
  for (const k of LEAD_ORD) { const L = LEAD[k].cat(); if (!L) continue; if (L === c) return k; const v = opinion(c, L) + (bias[k] || 0) + kinPoliticsScore(c, L); if (v > bv) { bv = v; best = k; } }
  return best;
}
function powerOf(k) {
  if (!W || !W.a2 || !LEAD[k] || !LEAD[k].cat()) return 0;
  let n = 0; for (const s of courtSeats()) if (s.lean === k) n += s.w;
  if (k === 'wang') n += Math.floor(W.a2.wang / 20);
  if (k === 'you') n += Math.floor(W.ret.filter(id => alive(C(id))).length / 3) + (W.rank >= 3 ? 1 : 0);
  if (k === 'lv') n += 1;
  if (k === 'lao') n += Math.floor(W.a2.laoMen);
  return n;
}
const courtFriend = () => courtSeats().some(s => s.lean === 'you') || opinion(C('huayang'), P()) >= 30;
// how much more opinion of you a courtier needs to lean your way (see leanOf): 20, and at least what they give any
// other side (a tie goes to you); 0 when already yours, null for a side's own head, who never comes over
function courtGap(s) {
  if (!s || s.lean === 'you') return 0;
  const b = s.bias || {}; let m = 20;
  for (const k of LEAD_ORD) { if (k === 'you') continue; const L = LEAD[k].cat(); if (!L) continue; if (L === s.c) return null; m = Math.max(m, opinion(s.c, L) + (b[k] || 0) + kinPoliticsScore(s.c, L)); }
  return Math.max(1, m - opinion(s.c, P()) - (b.you || 0) - kinPoliticsScore(s.c, P()));
}
// the one closest to coming over (华阳夫人 counts at 30): [cat, points short] or null
function courtNearest() {
  let best = null;
  for (const s of courtSeats()) { const g = courtGap(s); if (g && (!best || g < best[1])) best = [s.c, g]; }
  const hy = C('huayang'); if (alive(hy) && cityOf(hy) === 'xianyang') { const g = 30 - opinion(hy, P()); if (g > 0 && (!best || g < best[1])) best = [hy, g]; }
  return best;
}
const xiangName = () => { const x = W.a2.xiang; return x === 'you' ? '你' : x === 'lv' ? '吕不韦' : x && alive(C(x)) ? nm(C(x)) : '空着'; };
// 政's standing as 子楚's son (not saved: worked out from what the town knows)
function legit() {
  const z = C('zheng'); if (!z) return 100;
  const s = W.secrets.find(x => x.type === 'bastard' && x.kid === 'zheng'), yr = C('yiren'), m = C(z.mom);
  let v = 100;
  if (z.bio !== 'yiren' && s && s.known.length >= 3) v -= 20;
  if (s && s.exposed) v -= 40;
  if (z.bio !== 'yiren' && yr && m && checkParentage(z, m, yr).lvl >= 3) v -= 10;
  return v;
}
// 政 is of 狸 blood, and what you would say to him about it (null: nothing to say): { t: the line, mom: his mother is
// a 狸 (everyone knows that: what is asked is whether he owns the kinship) or false (his real father was one, a secret) }
function zhengBlood() {
  const z = C('zheng'), q = qm(); if (!alive(z)) return null;
  const bio = C(z.bio), s = W.secrets.find(x => x.type === 'bastard' && x.kid === 'zheng');
  if (bio && bio.house === 'li' && s && knows(s)) return { t: '「王上可知道自己的生父是谁？」', mom: false };
  if (alive(q) && q.house === 'li' && q.id !== W.player) return { t: '「王上身上，有一半是狸家的血。」', mom: true };
  return null;
}
const laoPow = () => { const lao = C('laoai'), q = qm(); return powerOf('lao') + (alive(lao) && alive(q) && q.lov.includes('laoai') ? 3 : 0); };
// the capital's garrison answers to the king's seal on the night: 王权/10, and the generals (and 昌平君, 昌文君) at court who
// aren't already counted for the king or 楚 nor held by 嫪毐 or you
const garrison = () => Math.floor(W.a2.wang / 10) + courtSeats().filter(s => (s.bing || s.c.id === 'chengping' || s.c.id === 'changwen') && !['wang', 'chu', 'lao', 'you'].includes(s.lean)).reduce((n, s) => n + s.w, 0);
const kingSide = () => powerOf('wang') + powerOf('chu') + garrison() + (W.a2.side === 'king' ? powerOf('you') : 0);
// the king's side wins as history has it, unless 嫪毐's is far the stronger
const kingWins = () => { const ks = kingSide(), ls = laoSide(); return !LEAD.lao.cat() || ks >= ls ? 1 : clamp(.35 + ks / (ks + ls), .5, .95); };
const laoSide = () => laoPow() + (W.a2.side === 'lao' ? powerOf('you') : 0);
// the gold road at the capping: 势 7 and more than the king and 楚 together, a general of weight 2 on your side, and 政's
// right to the throne in doubt
function coupOk() {
  const you = powerOf('you'), z = C('zheng');
  return W.rank >= 4 && you >= 7 && you >= powerOf('wang') + powerOf('chu') && courtSeats().some(s => s.bing && s.w >= 2 && s.lean === 'you') &&
    (legit() <= 60 || !alive(z) || W.kingId !== 'zheng');
}

// ---------------------------------------------------------- turns of fortune (other sections call these too)
function lvFall(why) {
  const A = W.a2, lv = C('lv'); if (!A || A.lvDown) return; A.lvDown = true;
  if (A.xiang === 'lv') A.xiang = null; if (A.zhongfu === 'lv') A.zhongfu = null;
  if (alive(lv) && cityOf(lv) === 'xianyang') lv.loc = 'henan';
  if (alive(lv)) logLine('吕不韦' + (why || '失了势') + '，回了河南的封地', '#c8e0ff');
}
function banish(c) { if (!alive(c)) return; outOfCourt(c.id); c.loc = 'shu'; logLine(nm(c) + '被逐出了咸阳', '#c8e0ff'); }
// 嫪毐 falls: he dies, his children are sent far away and never heard of again, the 太后 is moved to 雍城
function laoFalls() {
  const A = W.a2, lao = C('laoai'), q = qmNpc(); A.laoIn = false; A.laoMen = 0;
  if (!alive(lao)) return;
  for (const k of lao.kids.map(C)) if (alive(k) && ageOf(k) < 16) { k.dieT = null; k.immortal = false; die(k, true); }
  lao.dieT = null; lao.immortal = false; die(lao, true);
  if (q && cityOf(q) === 'xianyang') q.loc = 'yong';
  logLine('嫪毐伏诛。雍宫的孩子被送往远方，从此没有消息。' + (q ? '太后迁往雍城。' : ''), '#c8e0ff');
}
// E5: the head is put to death; the house flees to 邯郸 with half its fish and no rank (the heir plays on)
function a2Doom(cause) {
  const A = W.a2, p = P(); A.end = 'E5'; if (A.xiang === 'you') A.xiang = null; if (A.zhongfu === 'you') A.zhongfu = null;
  if (W.job && typeof endJob === 'function') endJob(false, '人不在了');
  W.rank = 0; W.patron = null; W.fish = Math.floor(W.fish / 2); A.fief = false;
  goCity('handan');
  if (alive(p)) { p.flags.cause = cause; die(p); }
  logLine('狸家连夜逃回了邯郸', '#ff9a8a');
}
// E3: you take the throne; 政 is never heard of again
function registerPlayerCrown(c) {
  if (!c) return;
  c.role = 'ruler'; c.state = '秦'; c.robe = 'qin';
  PORT.clear(); MINI.clear();
}
function a2Crown() {
  const A = W.a2, z = C('zheng');
  W.kingId = W.player; W.rank = 5; W.patron = null; A.end = 'E3'; A.xiang = A.zhongfu = null;
  registerPlayerCrown(P());
  if (A.laoIn) laoFalls();
  if (alive(z)) { z.dieT = null; z.immortal = false; die(z, true); }
  lvFall('');
  PORT.clear(); MINI.clear(); SFX.happy(); logLine('咸阳宫的王座上，坐的是你了。', '#ffe08a');
}
// 嫪毐 wins the night: 政 is gone, a child of his (else 成峤, else he himself) is king, and you are 仲父 beside him
function laoWins(against) {
  const A = W.a2, lao = C('laoai'), z = C('zheng');
  const h = (lao ? lao.kids.map(C).find(alive) : null) || qinCat('chengjiao') || lao;
  // (the crown moves first: 政's death then has no 二世 after it, see HIST_NEXT.zheng); a child of 雍宫 gets a king's name
  if (alive(h)) {
    if (lao && h.dad === lao.id) { h.sur = '嬴'; h.name = pick(['期', '怀', '桓']); }
    W.kingId = h.id; h.role = 'ruler'; h.disp = '秦王' + h.name; h.loc = 'xpalace'; PORT.clear();
  }
  if (alive(z)) { z.dieT = null; z.immortal = false; die(z, true); }
  // (he outlives his date in the books now: the story has changed)
  if (alive(lao)) { lao.dieT = null; lao.immortal = false; if (lao !== h) lao.disp = '假父'; }
  A.coup = 'lao'; lvFall('');
  logLine('政从此没了消息。' + (alive(h) ? nm(h) + '坐上了王座。' : ''), '#ff9a8a');
  if (against) return;
  if (W.rank < 4) { W.rank = 4; PORT.clear(); MINI.clear(); } A.zhongfu = A.xiang = 'you'; A.zfBy = W.player;
}
// the verdict of 清算 (t99), or a road taken earlier
function endAs(k, mom) {
  const A = W.a2, z = C('zheng'), p = P(); A.end = k;
  if (k === 'retire') { W.rank = Math.min(W.rank, 2); if (A.xiang === 'you') A.xiang = null; if (A.zhongfu === 'you') A.zhongfu = null; if (alive(z)) addMemo(z, p, '知进退', 20); logLine('你辞了官，王上准了', '#c8e0ff'); }
  if (k === 'E1' && alive(z)) addOp(z, p, 5);
  // (E3b: 'mom' — the king owns his mother's house, 外戚 — or true: he knows his real father was a 狸)
  if (k === 'E2' || k === 'E3b') { W.rank = Math.max(W.rank, 4); A.zhongfu = A.xiang = 'you'; A.zfBy = W.player; if (k === 'E3b') { A.blood = mom ? 'mom' : true; A.bloodBy = W.player; if (alive(z)) addMemo(z, p, mom ? '外戚' : '骨肉', mom ? 20 : 40); } }
  if (k === 'E4') { W.rank = 2; if (A.xiang === 'you') A.xiang = null; if (A.zhongfu === 'you') A.zhongfu = null; if (W.a3) { W.a3.exileBy = W.player; a3Ban(); } }
  if (k === 'E5') { a2Doom('被赐死'); return; }
  PORT.clear(); MINI.clear();
}
function becomeZhongfu() { const A = W.a2; if (W.rank < 4) promote(4, king()); A.zhongfu = A.xiang = 'you'; A.zfBy = W.player; }
// n neutral courtiers come over to you (they remember it for six years)
function courtSwing(n) { const L = courtSeats().filter(s => !s.lean); for (let i = 0; i < n && L.length; i++) addMemo(L.splice(Math.floor(Math.random() * L.length), 1)[0].c, P(), '归心', 25, 24); CS.k = ''; }

// ---------------------------------------------------------- the court moves each season
function aiCourt() {
  const A = W.a2, p = P(); if (!alive(p)) return;
  const S = courtSeats(), lv = LEAD.lv.cat();
  // 吕不韦 works on the weightiest courtier not yet his, and keeps 子楚 close
  // (the heaviest seat first, and of those the one closest to coming over)
  if (lv && chance(.6)) { const m = S.filter(s => s.lean !== 'lv' && s.c !== lv).sort((a, b) => b.w - a.w || opinion(b.c, lv) - opinion(a.c, lv))[0]; if (m) addOp(m.c, lv, 3 + Math.floor(Math.random() * 4), true); }
  const yr = C('yiren'); if (lv && W.t < 61 && alive(yr) && opinion(yr, lv) < 60) addOp(yr, lv, 3, true);
  // behind you at court, he goes after the seat of yours that holds by the least
  if (lv && powerOf('lv') < powerOf('you')) {
    const m = S.filter(s => s.lean === 'you' && s.c !== lv && !(typeof holdsHook === 'function' && holdsHook(s.c.id) === 'strong')).sort((a, b) => (opinion(a.c, p) - opinion(a.c, lv)) - (opinion(b.c, p) - opinion(b.c, lv)))[0];
    if (m) addOp(m.c, lv, 4, true);
  }
  // 嫪毐's household grows a year at a time, and he insults someone at court now and then
  const lao = LEAD.lao.cat();
  if (lao) { if (W.t % 4 === 0) A.laoMen = Math.min(4, A.laoMen + 1); if (S.length && chance(.25)) addOp(pick(S).c, lao, -5, true); }
  // a widowed 太后 without a lover in 咸阳 grows lonely
  const q = qmNpc();
  if (W.t >= 61 && q) A.lonely = q.lov.some(id => { const o = C(id); return alive(o) && cityOf(o) === 'xianyang'; }) ? 0 : Math.min(100, A.lonely + 3);
  // 政 grows into his power, and watches the one who holds too much of it
  const z = C('zheng');
  if (W.t >= 61 && alive(z) && W.kingId === 'zheng') {
    A.wang = clamp(A.wang + 1 + (ageOf(z) >= 16 ? 1 : 0) + (z.tr.includes('勤快') || z.tr.includes('野心') ? 1 : 0), 0, 100);
    if (inQin() && W.rank >= 1) {
      let d = (powerOf('you') >= 6 ? 1 : 0) + (W.rank === 4 ? 1 : 0) + (S.some(s => s.bing && s.lean === 'you') ? 1 : 0);
      if (q && q.lov.includes(W.player) && W.secrets.some(s => s.type === 'affair' && [s.subj, s.other].includes(q.id) && [s.subj, s.other].includes(W.player) && knows(s, 'zheng'))) d += 2;
      // (the fear builds every other season; teaching him and his liking you each take a point off, every season)
      if (W.t % 2) d = 0;
      if (A.taught >= W.t - 1) d--;
      if (opinion(z, p) >= 60) d--;
      A.yi = clamp(A.yi + d, 0, 100);
    }
  }
  // 成峤's claim grows with the talk about 政's father
  const ck = C('chengjiao');
  if (W.t % 4 === 0 && alive(ck)) {
    const s = W.secrets.find(x => x.type === 'bastard' && x.kid === 'zheng');
    A.claim = clamp(A.claim + (s && s.known.length >= 3 ? 2 : 0) + (s && s.exposed ? 3 : 0) + (A.xiajiWish === false ? 2 : 0) - (alive(z) && opinion(ck, z) >= 20 ? 1 : 0), 0, 100);
  }
  // a leader who hates you and is no weaker moves against you at court
  if (a2Here() && W.rank >= 1 && !W.cool.tanhe) for (const k of ['lv', 'zong', 'lao', 'chu']) {
    const L = LEAD[k].cat(); if (!L || L.id === W.player) continue;
    if ((opinion(L, p) <= -20 || isRivalF(L, p)) && powerOf(k) >= powerOf('you') - 1 && chance(.25)) { W.queue.push({ ev: 'tanhe', a: k }); W.cool.tanhe = 4; break; }
  }
  // a minister the young king fears (忌惮 50) is impeached however strong he is: by the 宗室, else by the king's own men
  if (a2Here() && W.rank >= 3 && !W.cool.tanhe && W.kingId === 'zheng' && A.yi >= 50 && chance(.2)) {
    const zg = LEAD.zong.cat(); W.queue.push({ ev: 'tanhe', a: zg && zg.id !== W.player ? 'zong' : 'wang', yi: 1 }); W.cool.tanhe = 4;
  }
}
// 嫪毐 comes to court with or without a story to bring him: by t74 the 太后's household has found him
function laoFallback() {
  const q = qmNpc(); if (C('laoai') || !q || !alive(C('zheng')) || q.lov.includes(W.player)) return;
  const lao = spawn2('laoai', 'hougong'); if (!lao) return;
  if (!q.lov.includes(lao.id) && !q.sp) { q.lov.push(lao.id); lao.lov.push(q.id); addSecret('affair', q.id, lao.id); }
  addSecret('eunuch', lao.id, null);
  W.a2.laoIn = true; W.a2.laoMen = Math.max(1, W.a2.laoMen);
  logLine('太后宫里多了一个宦官，叫嫪毐。个子很高，胡子拔得很干净。', '#c8e0ff', !inQin());
}
// a king who dies off the books (嫪毐's line, a crown taken at the capping) leaves one: his eldest son, the old line, 成峤,
// else the 宗室 put up 子婴 (a 狸 king is followed by the next head of the house, see newHead)
function kingCheck() {
  const d = W.kingId && C(W.kingId); if (!d || alive(d) || d.house === 'li' || (W.a3 && W.a3.qinFell)) return;
  // (after 前206 there is no 子婴 left to put up: a line with no son ends 秦)
  const late = W.t >= HISTD.ziying;
  const nx = d.kids.map(C).filter(k => alive(k) && k.dad === d.id && !k.female).sort((a, b) => a.born - b.born)[0] || firstAlive(QIN_KINGS) || qinCat('chengjiao') ||
    (late ? null : spawnHist({ id: 'ziying', disp: '子婴', sur: '嬴', name: '婴', born: bornAt(240), role: 'ruler', robe: 'qin', state: '秦', loc: 'xpalace', tr: ['多疑', '节制'], st: [4, 7, 6, 9] }));
  if (!alive(nx)) { if (late) qinFall(nm(d) + '死了，没有留下儿子。宗室争了几年，秦就散了。'); return; }
  W.kingId = nx.id; nx.role = 'ruler'; if (nx.disp !== '子婴' && !/^秦/.test(nm(nx))) nx.disp = '秦王' + nx.name;
  logLine(nm(nx) + '即位。', '#c8e0ff', !inQin());
}
// a new head of the house: 相邦 and 仲父 are not inherited, a crown is (秦王世袭)
function newHead(was) {
  const A = W.a2;
  if (W.kingId === was) { W.kingId = W.player; W.patron = null; registerPlayerCrown(P()); logLine('你继承了王位。', '#ffe08a'); return; }
  if (A.xiang === 'you') A.xiang = null; if (A.zhongfu === 'you') A.zhongfu = null;
  // (a child head gives up every office: see headOffice)
  if (W.rank >= 3 && W.rank <= 4) { W.rank = 2; PORT.clear(); MINI.clear(); if (ageOf(P()) >= 16) logLine('相位不能传给后人。你是客卿。', '#c8e0ff'); }
}
// an old save whose head married 子楚 (the 讨要 option is gone): the house passes to the next 狸, and she goes to 秦's house
// (not a head who sits on the throne herself: she is the crown, and the crown passes with the house)
const royalHead = () => { const p = W && P(); return alive(p) && royalOut(p) && W.kingId !== W.player; };
EV.chujia = () => {
  const old = P(); if (!royalHead()) return null;
  let L = succCands(old).map(x => x[0]);
  if (!L.length) { L = [mkc({ sur: '狸', name: pick(GIV_M), born: W.t - 4 * 20, house: 'li', loc: 'home', role: 'merchant', g: randGenome(Math.random, 'M') })]; logLine('族里从乡下请来一个远房侄子。', '#f2ead4'); }
  const h = heirNow(old) || L[0], z = C('zheng'), show = [h].concat(L.filter(c => c !== h)).slice(0, 4);
  return { title: '出嫁', who: [old.id], big: true,
    text: '你嫁进了秦国的王家' + (alive(z) && z.mom === old.id ? '，是' + nm(z) + '的母亲' : '') + '。王家的人，不能再管一家商号。狸家要有新的家主。',
    opts: show.map(c => Object.assign(opt(nm(c) + '（' + ageOf(c) + '岁 ' + (c.female ? '女' : '男') + '）', (c === h ? '嗣 · ' : '') + traitsOf(c).slice(0, 2).join(' ') + ' · ' + STATN.map((s, i) => s + stat(c, i)).join(' ') + (kinSuccessionHint(c) ? ' · ' + kinSuccessionHint(c) : ''),
      () => handOver(old, c)), { look: c === h ? 'gold' : null })) };
};
function handOver(old, c) {
  if (!alive(c) || !royalHead()) return;
  kinOnSuccession(old, c);
  chronicle('succession', nm(c) + '接掌狸家', nm(old) + '嫁入王室，把家业交给了' + nm(c) + '。', c.id);
  W.player = c.id; PORT.clear(); MINI.clear();
  if (c.loc !== 'home' || c.flags.branch || c.flags.left) bringHome(c);
  for (const s of W.secrets) if (knows(s, old.id) && !knows(s, c.id) && chance(.5)) s.known.push(c.id);
  delete c.flags.disinh; W.heirId = null; W.regent = null; delete W.flags.minor;
  if (ageOf(c) < 16) { W.flags.minor = true; const r = pickRegent(c); if (r) { W.regent = r.id; W.queue.unshift({ ev: 'regency', a: r.id }); } }
  // (she lives with her husband's house from now on)
  old.flags.royal = true; old.flags.left = true; old.role = 'noble'; old.robe = 'qin';
  if (old.loc === 'home') old.loc = inQin() ? 'hougong' : localLoc('hostage');
  headOffice(old);
  W.ap = apMax(c); W.flags.skipAp = false; W.loc = 'home'; homeTick();
  logLine(nm(c) + '做了狸家的家主', '#ffe08a');
}

// ---------------------------------------------------------- the calendar (turn → story card)
// cond decides whether the card is for you this time (default: act two in 咸阳); story cards come first in a season
const A2_CAL = [
  [22, 'xianyang'], [46, 'zhaowangzu'], [47, 'guiqin', () => a2Here() || zhengInHandan()], [50, 'sanri'], [52, 'baixiang'], [61, 'zhuangxiang'],
  [96, 'guanqian'], [97, 'guanli', () => a2Here() && !!W.a2.side && !W.a2.end], [99, 'qingsuan', () => a2Here() && !W.a2.end], [100, 'act2end', () => W.act === 2],
];
const A2_NEWS = [], A2_ENVOY = [];
function a2Sched(t, id, cond, story) { A2_CAL.push([t, id, cond || null]); if (story !== false) STORY_EV.add(id); }
for (const x of A2_CAL.map(r => r[1]).concat(['zhongfu', 'laixin', 'keqing2', 'huanxiang', 'zhongfu2', 'chujia'])) STORY_EV.add(x);

// ---------------------------------------------------------- act one's end: four roads
function act1Road(k) {
  const A = W.a2, p = P(), yr = C('yiren'), q = qmNpc();
  // (road A meets it in 咸阳's first card)
  if (W.flags.renamed && k !== 'A') logLine('异人回到咸阳，穿楚服拜见华阳夫人，改名子楚。', '#c8e0ff');
  delete W.flags.renamed;
  // (the house is in 咸阳 from this season on: its arrival card comes now, before anything done at 秦's court)
  if (k === 'A') { A.line = 'xy'; W.act = 2; goCity('xianyang'); if (W.rank < 1) W.rank = 1; W.patron = 'yiren'; addFish(80, true); logLine('邯郸的铺子盘了出去，得鱼干 80', '#ffe08a'); if (alive(yr)) addMemo(yr, p, '共患难', 10);
    W.queue = W.queue.filter(q => q.ev !== 'xianyang'); W.queue.unshift({ ev: 'xianyang' }); }
  if (k === 'B') { A.line = 'hd'; W.act = 2; A.guard = true; if (alive(yr)) addMemo(yr, p, '托付', 10); if (q) addMemo(q, p, '守护', 15); }
  if (k === 'C') { A.line = 'free'; W.act = 1.5; A.letterT = 47; }
  if (k === 'D') { A.line = 'zhao'; W.act = 1.5; A.letterT = 47; const zw = cityRuler(); if (alive(zw)) addOp(zw, p, 10); }
  PORT.clear(); MINI.clear();
}
function act1Roads() {
  const yr = C('yiren'), q = qmNpc(), bet = !!W.flags.betray, O = [];
  if (!bet) O.push(opt('「随公子入秦。」', '去咸阳 · ' + (W.rank < 1 ? '做' + nm(yr) + '的舍人 · ' : '') + '鱼干+80', () => act1Road('A')));
  if (!bet && q && cityOf(q) === 'handan') O.push(opt('「我留在邯郸，照看夫人和小公子。」', '邯郸线 · 前251年护送他们归秦', () => act1Road('B')));
  O.push(opt('「狸家的根在邯郸。」', '留在邯郸经商 · 日后还有入秦的机会', () => act1Road('C')));
  if (bet) O.push(opt('「我是赵国人。」', '留赵 · 赵王好感+10', () => act1Road('D')));
  return O;
}

// ---------------------------------------------------------- the story's cards
EV.xianyang = () => {
  const yr = C('yiren'), hy = C('huayang'), xj = C('xiaji'), fj = C('fanju'), p = P(); if (!a2Here() || W.a2.line !== 'xy' || !alive(yr) || W.flags.xyCard) return null;
  W.flags.xyCard = true;
  return { title: '咸阳', who: ['yiren', 'huayang', 'xiaji'].filter(id => alive(C(id))),
    text: '异人穿着一身楚服去见华阳夫人。夫人拉着他的手，说了很久的楚语。第二天，太子宫里的人都改口叫他子楚。你被安排在市东的一座小院里。',
    opts: [opt('「给公子再备几身楚服。」', '鱼干-40 · 华阳+15 · ' + nm(yr) + '+5', () => { addFish(-40); addOp(hy, p, 15); addOp(yr, p, 5); }, () => W.fish >= 40),
      opt('「公子该去看看夏夫人。」', nm(xj) + '+20 · ' + nm(yr) + '+8 · 华阳-5', () => { addOp(xj, p, 20); addOp(yr, p, 8); addOp(hy, p, -5); }),
      alive(fj) ? opt('「先去拜见应侯。」', '范雎+15 · 名望+3', () => { addOp(fj, p, 15); addPrest(3); }) : null].filter(Boolean) };
};
EV.zhaowangzu = () => {
  const yr = C('yiren'), hy = C('huayang'), p = P(), q = qmNpc(); if (!a2Here() || !alive(yr)) return null;
  // 太子举荐: the new heir speaks for his man
  const up = W.rank === 1 && opinion(yr, p) >= 30 && (W.merit || 0) >= 40 && ageOf(p) >= 16;
  return { title: '昭王薨', who: ['zhao', 'anguo', 'huayang', 'yiren'].filter(id => C(id)),
    text: '秦王在位五十六年，今年秋天死了。安国君守丧，华阳夫人成了王后，' + nm(yr) + '成了太子。宫里的人一夜之间都换了脸色。' + (up ? '\n太子在新王面前提了你。你做了客卿。' : ''),
    pre: () => { if (up) promote(2, yr); },
    opts: [q && cityOf(q) === 'handan' ? opt('「请太子派人去邯郸接夫人和小公子。」', nm(yr) + '+10 · ' + nm(q) + '+10', () => { addOp(yr, p, 10); addOp(q, p, 10); }) : null,
      opt('「先稳住宗室。」', chkHint(1, 11) + ' · 名望+5', () => { if (chk(1, 11)) { const zg = LEAD.zong.cat(); if (zg) addMemo(zg, p, '安抚', 20, 16); addPrest(5); } else toast('宗室的人没给你好脸色', '#dddddd'); }),
      opt('「给王后备一份厚礼。」', '鱼干-60 · 华阳+15', () => { addFish(-60); addOp(hy, p, 15); }, () => W.fish >= 60)].filter(Boolean) };
};
// 前251: 赵 lets 子楚's wife and son go home. In 咸阳 you meet them; in 邯郸 you may take them there (the way back to 秦)
EV.guiqin = () => {
  const z = C('zheng'), q = qmNpc(), p = P(), yr = C('yiren'), A = W.a2; if (!alive(z)) return null;
  const who = (q ? [q.id] : []).concat([z.id]), them = (q ? nm(q) + '和' : '') + nm(z);
  if (a2Here()) {
    if (!zhengInHandan()) return null;
    return { title: '归秦', who, text: `秦赵讲和，赵王放${them}回秦。${nm(z)}${ageOf(z)}岁，头一回看见函谷关。`, pre: bringZheng,
      opts: [opt('「我去函谷关接。」', '下季精力-1 · ' + nm(z) + '+15' + (q ? ' · ' + nm(q) + '+10' : ''), () => { W.flags.skipAp = true; addOp(z, p, 15); if (q) addOp(q, p, 10); }),
        opt('「备一辆好车。」', '鱼干-50 · ' + (q ? nm(q) : nm(z)) + '+10', () => { addFish(-50); addOp(q || z, p, 10); }, () => W.fish >= 50),
        alive(yr) && alive(C('lv')) ? opt('「让吕公去接。」', nm(yr) + '对吕不韦+5', () => addOp(yr, C('lv'), 5, true)) : null].filter(Boolean) };
  }
  if (!zhengInHandan()) return null;
  // (a save from before act two is always asked: it is its way into 秦)
  const hd = A.line === 'hd', can = hd || A.line === 'zhao' || A.old || (alive(yr) && opinion(yr, p) >= 20);
  // (not asked: they leave without you, and the next chance is a letter in 前237)
  if (!can) { bringZheng(); logLine(them + '回了秦国', '#c8e0ff'); A.letterT = 100; return null; }
  const keq = q && opinion(q, p) >= 40;
  const bet = A.line === 'zhao', they = q ? '他们' : '他';
  return { title: '归秦', who, text: `秦赵讲和，赵王放${them}回秦。` + (hd ? '这几年，是你护着' + they + '。' : bet ? '上路那天，来送行的只有你。' + (a2c().soldZ ? '当年是你把' + they + '交给了赵王。' : '')
      : nm(yr) + '来信，托你送' + (q ? '他们' : nm(z)) + '一程。'),
    opts: [opt('「我送' + they + '回去。」', '去咸阳 · ' + nm(yr) + '「护子之功」+40' + (keq ? ' · 客卿' : ''), () => {
        A.old = false; bringZheng(); if (alive(yr)) { addMemo(yr, p, '护子之功', 40); for (const r of [yr.rel[p.id], p.rel[yr.id]]) if (r && r.tag === 'rival') delete r.tag; }
        enterQin(1, yr); if (keq) promote(2, yr); }),
      opt('「我留在邯郸。」', '前237年还有一次入秦的机会', () => { A.old = false; bringZheng(); W.act = 1.5; if (hd) A.line = 'free'; A.letterT = 100; })] };
};
// 咸阳来信: the way into 秦 for a house that stayed in 邯郸 (前251 from 子楚, 前237 from the king, then now and then)
function enterQin(rank, by) {
  const A = W.a2;
  goCity('xianyang');
  // (a 客卿 of 赵 starts over as a 舍人 and faces 章台 like anyone)
  if (W.flags.zhaoRank && W.rank > rank) { W.rank = rank; logLine('赵国给的官，到了咸阳不算数', '#c8e0ff'); }
  delete W.flags.zhaoRank;
  if (W.rank < rank) W.rank = rank;
  // (only someone who will have you: a betrayed 子楚 is won back by deeds first, see patronLost)
  if (alive(by) && !patronLost(by)) W.patron = by.id;
  A.line = 'xy'; if (W.t >= 100) { W.act = 3; if (!A.end) A.end = 'retire'; } else W.act = 2;
  PORT.clear(); MINI.clear(); logLine('狸家搬到了咸阳', '#ffe08a');
}
EV.laixin = () => {
  const A = W.a2; if (!A || inQin() || W.act === 2) return null;
  const late = W.t >= 100, yr = C('yiren'), from = !late && alive(yr) ? yr : king(), p = P();
  if (late && W.a3 && W.a3.uni) { A.letterT = null; return null; }
  if (!alive(from) || !alive(p)) return null;
  if (!A.old && opinion(from, p) < (late ? 40 : 20)) { A.letterT = late ? W.t + 24 : 100; return null; }
  return { title: '咸阳来信', who: [from.id], text: '咸阳来了一封信，封泥上是' + (from.role === 'ruler' ? '秦王' : nm(from)) + '的印。' + (late ? '秦国缺懂买卖的人。狸家若愿意，可来咸阳做客卿。' : '「邯郸故人，可来咸阳一见。」'),
    opts: [opt('「收拾行李。」', late ? '去咸阳 · 做客卿' : '去咸阳 · 做舍人', () => { A.old = false; enterQin(late ? 2 : 1, from); }),
      opt('「狸家走不开。」', late ? '' : '前237年还有一次', () => { A.old = false; A.letterT = late ? W.t + 24 : 100; })] };
};
EV.sanri = () => {
  const zx = qinCat('zixi'), yr = C('yiren'), p = P(); if (!a2Here() || !alive(yr)) return null;
  return { title: '三日秦王', who: ['anguo', yr.id].concat(zx ? [zx.id] : []),
    text: '安国君守满一年丧，十月正式即位，第三天就死了。御膳房的人全被关了起来，有人说那碗鱼汤放了一夜。',
    opts: [opt('「太子该即位了，别查了。」', nm(yr) + '+10', () => { addOp(yr, p, 10); addSecret('poison', null, null); }),
      opt('「彻查。」', chkHint(3, 12) + ' · 或查到子傒的人 · 名望+5', () => { if (chk(3, 12) && zx) { banish(zx); addPrest(8); } else { addPrest(5); toast('查了一个月，没有结果', '#dddddd'); } }),
      zx ? opt('「查出来的人，交给我。」', withTip('栽赃子傒 · 宗室记恨', '仁厚'), () => { banish(zx); addMemo(zx, p, '栽赃', -30); const xj = qinCat('xiaji'); if (xj) addMemo(xj, p, '栽赃', -30); addStress(p, '仁厚'); }, null, '狠辣') : null,
      opt('「谁最想让太子早点即位？」', '也许能查到吕不韦', () => {
        if (chance(.5) && alive(C('lv'))) { const s = addSecret('poison', 'lv', null); if (!knows(s)) s.known.push(W.player); logLine('得知秘密：' + secretText(s), '#ffb0d0'); SFX.secret(); }
        else toast('线索断了', '#dddddd'); }, null, '多疑')].filter(Boolean) };
};
// 拜相 (t52): a contest of 势 (×4), with what the king thinks (/3) and fame (吕不韦: his three thousand guests, 20)
function xiangScore(k) {
  const kg = king(), c = k === 'you' ? P() : LEAD.lv.cat(); if (!alive(c) || !alive(kg)) return 0;
  return R(4 * powerOf(k) + opinion(kg, c) / 3 + (k === 'you' ? W.prest / 10 : 20));
}
// in the running for 相邦: a 客卿 who has been in 咸阳 two years (a newcomer's name means nothing at court yet)
const xiangIn = () => W.rank >= 2 && W.t - (W.a2.xyT || 0) >= 8;
EV.baixiang = () => {
  const p = P(), lv = LEAD.lv.cat(), kg = king(), A = W.a2; if (!a2Here() || !alive(kg) || A.xiang) return null;
  // (a tie goes to 吕不韦: he is the one everyone expected)
  const ally = !!W.flags.allied, ok2 = xiangIn(), sy = xiangScore('you'), sl = lv ? xiangScore('lv') : 0, win = ok2 && (!lv || sy > sl);
  if (!lv && !ok2) { A.xiang = null; return null; }
  const text = !ok2 ? '新王在章台宫拜相，相印给了吕不韦。' + (W.rank < 2 ? '你还不是客卿，这件事轮不到你。' : '你到咸阳还不满两年，这件事轮不到你。')
    : '新王在章台宫拜相。满朝都知道只有两个人选。' + `\n你 ${sy} · 吕不韦 ${sl}\n` + (win ? '王上把相印递给了你。' : '相印给了吕不韦。');
  const fief = () => { if (ok2) { A.fief = true; addPrest(10); logLine('你封了君，每季多 20 鱼干', '#ffe08a'); } };
  const O = win ? [opt('「臣领命。」', '相邦 · 名望+20' + (lv && !ally ? ' · 吕不韦成宿敌' : ''), () => { A.xiang = 'you'; promote(3, kg); addPrest(20); if (lv && !ally) rivalOf(lv, p); }),
      lv ? opt('「请吕公为相，臣为副。」', '封君 · 吕「让相」+30 · 结盟', () => { A.xiang = 'lv'; fief(); addMemo(lv, p, '让相', 30); W.flags.allied = true; }) : null]
    : [opt('「恭喜吕公。」', (ok2 ? '封君 · 每季鱼干+20 · ' : '') + '吕不韦+10', () => { A.xiang = 'lv'; fief(); addOp(lv, p, 10); }),
      opt('「这相位，他坐不久。」', '吕不韦-20 · 宿敌 · 名望+5', () => { A.xiang = 'lv'; fief(); addOp(lv, p, -20); rivalOf(lv, p); addPrest(5); }, null, '野心')];
  return { title: '拜相', who: [kg.id].concat(lv ? [lv.id] : []).concat([p.id]), text, opts: O.filter(Boolean) };
};
EV.zhuangxiang = () => {
  const z = C('zheng'), q = qmNpc(), A = W.a2; if (!a2Here() || !alive(z)) return null;
  return { title: '庄襄王薨', who: ['yiren', z.id].concat(q ? [q.id] : []),
    text: `子楚做了三年秦王，五月死在宫里。${z.name}即位，年十三。` + (q ? '太后抱着他坐上王座，王座太大了。' : '他一个人坐上王座，王座太大了。'),
    opts: [opt('「臣请辅佐新王。」', z.name + '+5' + (W.rank >= 3 ? ' · 也许能当仲父' : ''), () => addOp(z, P(), 5)),
      q ? opt('「请太后临朝。」', '太后+15 · 王权-5', () => { addOp(q, P(), 15); A.wang = Math.max(0, A.wang - 5); }) : null,
      opt('什么也不说', '', () => {})].filter(Boolean),
    post: () => { if (!W.queue.some(x => x.ev === 'zhongfu')) W.queue.unshift({ ev: 'zhongfu' }); } };
};
EV.zhongfu = () => {
  const z = C('zheng'), q = qmNpc(), p = P(), lv = LEAD.lv.cat(), A = W.a2; if (!a2Here() || !alive(z) || A.zhongfu) return null;
  if (A.xiang === 'you' && W.rank >= 3 && (!q || opinion(q, p) >= 20) && (powerOf('you') >= 5 || (q && opinion(q, p) >= 40))) return { title: '仲父', who: [z.id].concat(q ? [q.id] : []),
    text: (q ? '太后' : '宗室') + '说王上年少，要尊相邦为仲父，国事都听你的。' + nm(z) + '看着你，没说话。',
    opts: [opt('「臣不敢当。」', '留任相邦 · ' + nm(z) + '+10 · 忌惮-10', () => { addOp(z, p, 10); A.yi = Math.max(0, A.yi - 10); }),
      opt('「臣领受。」', '仲父 · 名望+20 · 忌惮+10 · 宗室-10', () => { becomeZhongfu(); addPrest(20); A.yi = Math.min(100, A.yi + 10); const zg = LEAD.zong.cat(); if (zg) addOp(zg, p, -10); }),
      opt('「从今天起，国事由我。」', '仲父 · 王权-10 · 忌惮+20 · 两人归你', () => { becomeZhongfu(); A.wang = Math.max(0, A.wang - 10); A.yi = Math.min(100, A.yi + 20); courtSwing(2); }, null, '野心')] };
  if (lv) return { title: '仲父', who: [lv.id, z.id], pre: () => { A.zhongfu = 'lv'; },
    text: (q ? '太后' : '宗室') + '说王上年少，要尊吕不韦为仲父，国事都听他的。' + nm(z) + '看着吕不韦，没说话。',
    opts: [opt('「恭喜仲父。」', '吕不韦+10', () => addOp(lv, p, 10)),
      opt('「王上还小。这天下是谁的？」', nm(z) + '+5，他会记住 · 吕不韦-10', () => { addMemo(z, p, '一句话', 5); addOp(lv, p, -10); }, null, '野心')] };
  return null;
};
// who speaks for a 舍人 in 秦: 子楚 while he lives and isn't king, else the king himself
const keqBy2 = () => { const yr = C('yiren'); return alive(yr) && W.kingId !== 'yiren' ? yr : king(); };
// 章台: the king asks why a merchant from 赵 should stay (客卿 in 秦; a 舌战, and a lost one waits four seasons)
EV.keqing2 = () => {
  const k = king(), p = P(), yr = C('yiren'); if (!a2Here() || W.rank !== 1 || !alive(k)) return null;
  const end = w => { if (w) promote(2, k); else { W.cool.promo = 2; toast(nm(k) + '没有再说话', '#dddddd'); } };
  const b1 = stat(p, 3) >= 12 ? 1 : 0, b2 = stat(p, 1) >= 12 ? 1 : 0, sure = alive(yr) && yr !== k && opinion(yr, p) >= 60;
  const duel = b => () => startDuel('舌战', k, end, { bonus: b, why: '胜：客卿 · 败：两季后再来' });
  return { title: '章台', who: [k.id], text: nm(k) + '在章台宫召见你。他问：「赵国来的商人，凭什么留在秦国？」',
    opts: [opt('「臣知道赵国的底细。」', duelHint('舌战', k, { bonus: b1 }, b1 ? '谋占先' : ''), duel(b1)),
      opt('「臣能替秦国赚钱。」', duelHint('舌战', k, { bonus: b2 }, b2 ? '政占先' : ''), duel(b2)),
      alive(yr) && yr !== k ? opt('「' + (yr.role === 'ruler' ? '王上' : W.t >= 46 ? '太子' : '公子' + nm(yr)) + '知道臣。」', sure ? '必成 · 客卿' : duelHint('舌战', k, null, nm(yr) + '好感 60 必成'), sure ? () => promote(2, k) : duel(0)) : null].filter(Boolean) };
};
EV.huanxiang = () => {
  const k = king(), p = P(), A = W.a2, lv = LEAD.lv.cat(); if (!a2Here() || W.rank !== 2 || !alive(k) || A.xiang === 'you') return null;
  const lvX = A.xiang === 'lv' && lv, h = A.xiang && A.xiang !== 'lv' && alive(C(A.xiang)) ? C(A.xiang) : null;
  return { title: '换相', who: [k.id].concat(lvX ? [lv.id] : h ? [h.id] : []), text: (lvX ? '吕不韦回了封地。' : h ? nm(h) + '称病辞了相位。' : '相位空了很久。') + nm(k) + '派人把相印送到你府上。',
    opts: [opt('「臣领命。」', '相邦' + (lvX ? ' · 吕不韦结仇' : ''), () => { if (lvX) { lvFall('交出了相印'); rivalOf(lv, p); } A.xiang = 'you'; promote(3, k); }),
      opt('「臣才疏，请另择贤能。」', nm(k) + '+10' + (W.kingId === 'zheng' ? ' · 忌惮-10' : ''), () => {
        if (lvX) lvFall('交出了相印'); addOp(k, p, 10); A.yi = Math.max(0, A.yi - 10); W.cool.promo = 12; const cp = qinCat('chengping'); if (cp && !h) A.xiang = 'chengping'; })] };
};
EV.zhongfu2 = () => {
  const z = C('zheng'), q = qmNpc(), A = W.a2; if (!a2Here() || W.rank !== 3 || A.zhongfu === 'you' || !alive(z)) return null;
  return { title: '仲父之位', who: (q ? [q.id] : []).concat([z.id]), text: (q ? '太后召你进宫。她说' : '宗室的老臣来你府上。他们说') + '王上还小，朝中不能没有一个说了算的人。',
    opts: [opt('「臣领受。」', '仲父 · 忌惮+10', () => { becomeZhongfu(); A.yi = Math.min(100, A.yi + 10); }),
      opt('「臣不敢当。」', nm(z) + '+5', () => { addOp(z, P(), 5); W.cool.promo = 8; })] };
};
// 弹劾: a leader who hates you moves against you at court (鲁仲连's word stops it first)
const TANHE = {
  lv: ['吕不韦的门客在朝上说，你在邯郸时和赵王走得太近。', '吕府的人在朝上翻你的旧账：邯郸那几年，你的买卖一半是跟赵国人做的。', '吕不韦的门客上书，说你门下的人在市上强买强卖。'],
  zong: ['几位宗室老臣联名上书：秦国的事，不该让外国来的商人插手。', '宗室的人在朝上说，狸家的门客，比公子们的还多。'],
  lao: ['长信侯的门客在市上打了你的家丁，说是替你教教规矩。', '长信侯在太后面前说，你在宫门口安了眼线。'],
  chu: () => [alive(C('xiaji')) ? '宫里传出话来：你近来去夏太后那里去得太勤了。' : '宫里传出话来：你近来和宗室的人走得太近了。', '宫里传出话来：你送去的礼，一年比一年薄了。'],
  // (忌惮: the young king's fear of an overmighty minister)
  yi: ['宗室的老臣们联名上书：相邦府的门客，比王上的卫士还多。', '有人在朝上念了一段商君的旧事：功劳太大的人，都没有好下场。'],
};
EV.tanhe = e => {
  const k = e && e.a, L = k && LEAD[k] && LEAD[k].cat(), p = P(), A = W.a2; if (!a2Here() || !L || L.id === W.player || (!TANHE[k] && !(e && e.yi))) return null;
  if (typeof useShield === 'function' && useShield()) return null;
  const secs = secretsAbout(L).filter(s => knows(s) && guiltyOf(s).includes(L.id)), T = jv(TANHE[e.yi ? 'yi' : k]), X = a2c();
  // (each side's lines in turn)
  const i = X['th' + k] = ((X['th' + k] || 0) + 1) % T.length, t0 = T[i];
  const cut = (lean, to, n) => { const S = courtSeats().filter(s => s.lean === lean && s.c !== to); if (!S.length) return; const s = pick(S); addMemo(s.c, to, '弹劾', -n, 16); CS.k = ''; logLine(nm(s.c) + '对' + (to.id === W.player ? '你' : nm(to)) + '冷了几分', '#c8e0ff'); };
  // a lost one while 吕不韦 is the stronger may cost you the seal
  const seal = () => { if (k === 'lv' && A.xiang === 'you' && W.rank === 3 && powerOf('lv') > powerOf('you') && chance(.35)) { A.xiang = 'lv'; W.rank = 2; PORT.clear(); MINI.clear(); logLine('相印回到了吕不韦手里', '#ff9a8a'); } };
  const him = ta(L);
  return { title: '弹劾', who: [L.id], text: (k === 'chu' && !e.yi ? nm(L) : '') + t0,
    opts: [opt('「当庭辩驳。」', duelHint('舌战', L, null, '胜：' + him + '失一人心 · 败：你失，望-5'), () => startDuel('舌战', L, w => { if (w) cut(k, L, 10); else { cut('you', p, 10); addPrest(-5); seal(); } },
        { why: '胜：' + him + '的一个人冷了 · 败：你的一个人冷了 · 名望-5' })),
      opt('「送礼平息。」', '鱼干-60 · ' + nm(L) + '+10', () => { addFish(-60); addOp(L, p, 10); }, () => W.fish >= 60),
      secs.length ? opt('「拿出' + him + '的把柄。」', fitT('弹劾：' + secretText(secs[0]), 140, 5.5, 1), () => exposeSec(secs[0], W.player)) : null,
      e.yi && W.kingId === 'zheng' ? opt('「臣的门客，请王上收编。」', '王权+10 · 忌惮-10 · 你的一位朝臣改投王上', () => { wangAdd(10); yiAdd(-10); swingTo('wang', 1, 'you', true); }) : null,
      opt('「让' + him + '闭嘴。」', withTip(chkHint(3, 12) + ' · 结仇', '仁厚'), () => {
        if (chk(3, 12)) { addOp(L, p, -30); rivalOf(L, p); cut(k, L, 20); addStress(p, '仁厚'); toast(nm(L) + '的人不再说话了', '#9fe89a'); } else { addPrest(-5); addOp(L, p, -10); } }, null, '狠辣')].filter(Boolean) };
};
EV.guanqian = () => {
  const A = W.a2, z = C('zheng'), lao = LEAD.lao.cat(), cp = qinCat('chengping'); if (!a2Here() || !alive(z) || A.end) return null;
  if (ageOf(P()) < 16) return null;
  const O = [opt('「我站在王上这边。」', '王方多你的势', () => { A.side = 'king'; })];
  if (lao) O.push(opt('「我站在长信侯这边。」', '毐方多你的势 · 败则身死', () => { A.side = 'lao'; }));
  O.push(opt('「两边都不帮，我守咸阳。」', '', () => { A.side = 'none'; }));
  if (coupOk()) O.push(Object.assign(opt('「让他们两败俱伤。」', '篡位 · 冠礼那夜 ' + chkHint(3, 12), () => { A.side = 'coup'; }), { look: 'gold' }));
  return { title: '冠礼之前', who: [z.id].concat(lao ? [lao.id] : []).concat(cp ? [cp.id] : []),
    text: (lao ? '王上下个月去雍城加冠。长信侯的人和昌平君的人前后脚来了你府上。' : '王上下个月去雍城加冠。宗室和楚系的人前后脚来了你府上，都想知道你站在哪边。') +
      `\n王方 势${kingSide()}` + (lao ? ` · 毐方 势${laoPow()}` : '') + ` · 你 势${powerOf('you')}`, opts: O };
};
EV.guanli = () => {
  const A = W.a2, z = C('zheng'), p = P(), lao = LEAD.lao.cat(), q = qmNpc(); if (!a2Here() || !A.side || A.end || !alive(z)) return null;
  const ks = kingSide(), ls = laoSide(), O = [], cp = qinCat('chengping'), pk = kingWins(), odds = pk < 1 ? ' · 王方胜算 ' + R(pk * 100) + '%' : '';
  // (王方 may lose the night when 嫪毐's side is far the stronger: 政 is gone, and so are you)
  const kingNight = f => () => { if (chance(pk)) { f(); laoFalls(); } else { laoWins(true); a2Doom('死在了蕲年宫外'); } };
  if (A.side === 'king') {
    if (lao) O.push(opt('「我领兵去。」', withTip(chkHint(0, 11) + ' · 成：' + nm(z) + '+20 名望+20' + odds, '胆小'), kingNight(() => {
      if (chk(0, 11)) { A.quell = true; addOp(z, p, 20); addPrest(20); } else { addHealth(p, -15); addPrest(-5); toast('乱是昌平君平的', '#dddddd'); } addStress(p, '胆小'); })),
      opt('「请昌平君出兵。」', (pk < 1 ? '' : '稳妥 · ') + nm(z) + '+5' + odds, kingNight(() => { if (cp) addOp(cp, p, 10); addOp(z, p, 5); })));
    else O.push(opt('「恭贺王上。」', nm(z) + '+5', () => addOp(z, p, 5)));
  }
  if (A.side === 'none') O.push(lao ? opt('「关城门，谁也不放。」', nm(z) + '-10 · 忌惮+10', () => { addOp(z, p, -10); A.yi = Math.min(100, A.yi + 10); laoFalls(); }) : opt('「恭贺王上。」', '', () => {}));
  if (A.side === 'lao') {
    const pl = ls / Math.max(1, ls + ks);
    O.push(opt('「开宫门。」', `毐方 ${ls} · 王方 ${ks} · 胜算 ${R(pl * 100)}% · 败则身死`, () => { if (chance(pl)) laoWins(); else { laoFalls(); a2Doom('随嫪毐伏诛'); } }));
    O.push(opt('「按兵不动。」', nm(z) + '-10 · 忌惮+10', () => { A.side = 'none'; addOp(z, p, -10); A.yi = Math.min(100, A.yi + 10); laoFalls(); }));
  }
  if (A.side === 'coup') O.push(opt(lao ? '「趁乱夺宫。」' : '「趁王上在雍城，夺宫。」', chkHint(3, 12) + ' · 成则为王 · 败则身死', () => { if (chk(3, 12)) a2Crown(); else { if (A.laoIn) laoFalls(); a2Doom('夺宫不成，死在宫门外'); } }));
  if (!O.length) return null;
  return { title: '冠礼之夜', who: [z.id].concat(lao ? [lao.id] : []).concat(q && lao ? [q.id] : []),
    text: lao ? `${nm(z)}在雍城加冠佩剑。同一天，嫪毐拿太后的玺调了县卒和门客，往蕲年宫去了。` : `${nm(z)}在雍城加冠佩剑。咸阳城里很静，城门关得比平时早。`, opts: O };
};
EV.qingsuan = () => {
  const A = W.a2, z = C('zheng'), p = P(); if (!a2Here() || A.end || !alive(p)) return null;
  const k = king();
  // 嫪毐 won the night: he sits beside the new king and wants you there too
  if (A.coup === 'lao') return { title: '假父', who: [...new Set([k ? k.id : p.id].concat(alive(C('laoai')) ? ['laoai'] : []))],
    text: k && k.id === 'laoai' ? '嫪毐坐上了王座，袖口上还有血。他看着你：「往后，这朝堂还要你来撑着。」' : '新王坐在王座上，脚还够不着地。嫪毐站在一旁，笑着看你：「往后，我们一起辅佐王上。」',
    opts: [opt('「国事由我。」', '仲父摄政', () => endAs('E2')), opt('「臣请辞。」', '功成身退', () => endAs('retire'))] };
  if (!alive(z)) { A.end = 'E1'; return null; }
  // (a child head, or a house below 客卿, was never at court for him to judge)
  if (W.rank < 2 || ageOf(p) < 16) { A.end = 'E1'; return null; }
  const op = opinion(z, p), off = W.rank >= 3 ? '相位' : '官', b = zhengBlood();
  // 忌惮 first: a minister the king fears goes unless he loves him; one he hates goes too
  const stay = (A.yi >= 80 && op < 60) || op <= -60 ? 'E5' : (A.yi >= 50 && op < 80) || op < 0 ? 'E4' : 'E1', young = A.quell && op >= 50 && powerOf('you') > powerOf('wang'), strong = powerOf('you') > powerOf('wang');
  const O = [opt('「臣请辞' + off + '。」', '功成身退 · ' + nm(z) + '+20', () => endAs('retire')),
    // (a minister whose side outweighs the king's cannot be sent away tonight: he stays, and the king keeps the grudge for act three)
    strong && stay !== 'E1' ? opt('「臣还能为王上做事。」', '你势' + powerOf('you') + ' 王' + powerOf('wang') + ' · 他眼下动不了你', () => { logLine('王上没有再问下去。这笔账，他记着', '#ff9a8a'); endAs('E1'); })
      : opt('「臣还能为王上做事。」', { E1: '多半留任', E4: '多半外放', E5: '凶多吉少' }[stay], () => endAs(stay))];
  if (W.rank >= 4) O.push(opt('「王上还年轻。」', young ? '仲父摄政' : '凶多吉少', () => endAs(young ? 'E2' : 'E5'), null, '野心'));
  // (his mother's house: he owns the kinship only if he loves you and doesn't fear you; his father: a secret he may not forgive)
  if (b) { const ok = b.mom ? op >= 80 && A.yi < 30 : op >= 60; O.push(opt(b.t, ok ? '他会认你' : b.mom ? '多半外放' : '凶多吉少', () => endAs(ok ? 'E3b' : b.mom ? 'E4' : 'E5', b.mom))); }
  return { title: '清算', who: [z.id, p.id], text: '王上把你叫到章台宫，屋里只有你们两个。他问：「这些年，你替寡人做了什么？」\n' + nm(z) + ' 对你 ' + a2s(op), opts: O };
};
const END_TXT = { E1: '政亲政了。你还站在朝上，替他看着天下。', E2: '王上还年轻。国事仍旧由你来定。', E3: '咸阳宫的王座上坐的是你。政从此没了消息。',
  E3b: '政认了你。这件事，只有你们两个知道。', E4: '王上让你离开咸阳，去河南住。你名义上还是客卿。', E5: '狸家的家主死在了咸阳。其余的人连夜逃回了邯郸。', retire: '你辞了官。王上说，你知进退。' };
// the act's verdict as it reads now (the head who earned it may be gone; a house below 客卿 was never at court)
function endTxt() {
  const A = W.a2, k = A.end;
  if (k === 'E1' && W.rank < 2) return '政亲政了。朝上的事，离狸家还远。';
  if ((k === 'E2' || k === 'E3b') && W.rank < 4) return '先代家主做过仲父。如今王上身边，已经没有狸家的位子。';
  if (k === 'E3b' && A.blood === 'mom') return '政认了狸家这门亲。你还是仲父。';
  if (k === 'E3b' && A.bloodBy !== W.player) return '政认了狸家的血。知道这件事的那一辈人，已经不在了。';
  return END_TXT[k];
}
// the act's last card: where things stand. 吕不韦 leaves office now if he still holds it; an exile goes to 河南.
EV.act2end = () => {
  const A = W.a2, p = P(); if (W.act !== 2 || !A || !alive(p)) return null;
  if (!A.closed) {
    A.closed = true;
    if (!A.end) A.end = inQin() ? 'E1' : null;
    if (!A.lvDown && alive(C('lv'))) lvFall('免了相');
    // (the king makes a 客卿 he likes his 相邦; one he doesn't like stays a 客卿)
    if (A.end === 'E1' && W.rank === 2 && ageOf(p) >= 16 && (!A.xiang || !alive(C(A.xiang))) && alive(C('zheng')) && opinion(C('zheng'), p) >= 40) { A.xiang = 'you'; promote(3, king()); }
    if (A.end === 'E4') goCity('henan');
  }
  const z = C('zheng'), zo = alive(z) && A.end !== 'E3' ? nm(z) + '对你 ' + a2s(opinion(z, p)) + ' · ' : '';
  return { title: '第二幕 · 仲父', who: [p.id].concat(alive(z) ? [z.id] : alive(king()) && king() !== p ? [king().id] : []), big: true,
    text: (A.end ? endTxt() : '秦国换了三个王。狸家还在邯郸。') + `\n身份：${RANKS[W.rank]} · ${zo}势 ${powerOf('you')}\n狸家 ${family().length} 口 · 鱼干 ${W.fish}`,
    opts: [opt('「看天下。」', '第三幕 · 一统', () => { W.act = 3; })] };
};

// ---------------------------------------------------------- actions: 宫 (进言, 荐贤), 行 (出使, 领兵, 静候一年), on cards
const recCands = () => W.ret.map(C).filter(c => alive(c) && ageOf(c) >= 16 && [0, 1, 2, 3].some(i => stat(c, i) >= 12));
const bestSt = c => [0, 1, 2, 3].reduce((b, i) => stat(c, i) > stat(c, b) ? i : b, 0);
// (under the young 政 what you say at court builds up the throne (王权) more than his liking for you)
const zhengKing = () => W.kingId === 'zheng' && alive(C('zheng'));
const minorNo = () => ageOf(P()) < 16 ? '年纪还小' : '';
function memoAct() {
  const dc = 8 + 2 * W.rank, k = king();
  return mkAct({ id: 'memorial', kind: 'memorial', n: '上朝进言', ap: 1, hint: chkHint(1, dc) + ' · 功+2 望+3 · ' + (zhengKing() ? '王权+3 忌惮-1' : (k ? nm(k) : '王') + '+6'),
    no: () => minorNo() || (W.rank < 1 ? '要先当上舍人' : W.cool.memo ? '这季说过了' : !alive(king()) ? '朝中无王' : ''),
    fn: () => { const k2 = king(); if (!k2 || !spendAp(1)) return; W.cool.memo = 1; const ok = chk(1, dc);
      if (ok) { if (zhengKing()) { W.a2.wang = Math.min(100, W.a2.wang + 3); addOp(k2, P(), 2); W.a2.yi = Math.max(0, W.a2.yi - 1); } else addOp(k2, P(), 6); addPrest(3); addMerit(2, '进言'); toast(nm(k2) + '点了点头', '#9fe89a'); } else { addOp(k2, P(), -2); toast('没人接你的话', '#dddddd'); }
      didAct('memorial', k2, 1, ok); } });
}
function recAct() {
  return mkAct({ id: 'recommendQ', kind: 'recommendQ', n: '荐贤入朝', ap: 1, hint: '门客入朝为官 · 算你一席',
    no: () => minorNo() || (!alive(king()) ? '朝中无王' : W.rank < 2 ? '客卿才能荐人' : W.a2.recs.filter(id => alive(C(id))).length >= 2 ? '已经荐了两人' : !recCands().length ? '门客没有一项到 12' : ''),
    fn: () => pickChar('荐谁入朝？ ◆1', recCands(), c => {
      if (!spendAp(1)) return;
      W.ret = W.ret.filter(x => x !== c.id); if (c.house === 'ret') c.house = null; c.loc = 'xpalace'; c.role = 'minister'; c.robe = 'qin';
      W.a2.recs = W.a2.recs.filter(id => alive(C(id))).concat([c.id]); addMemo(c, P(), '举荐之恩', 25); CS.k = '';
      logLine(nm(c) + '入朝做了官', '#9fe89a'); SFX.happy(); didAct('recommendQ', c, 2, true); }, c => { const i = bestSt(c); return { txt: STATN[i] + stat(c, i), col: STATC[i], v: stat(c, i) }; }) });
}
function envoyAct() {
  return mkAct({ id: 'envoy', kind: 'envoy', n: '出使', ap: 1, hint: chkHint(2, 11) + ' · 名望+8' + (zhengKing() ? ' · 王权+3' : king() === P() ? '' : ' · 王+5'),
    no: () => minorNo() || (W.rank < 1 ? '要先当上舍人' : W.cool.envoy ? '再等 ' + W.cool.envoy + ' 季' : ''),
    fn: () => { if (!spendAp(1)) return; W.cool.envoy = 3; const ok = chk(2, 11), k = king();
      if (ok) { addPrest(8); if (zhengKing()) W.a2.wang = Math.min(100, W.a2.wang + 3); else if (alive(k) && k !== P()) addOp(k, P(), 5); toast('出使回来，事情办成了', '#9fe89a'); if (A2_ENVOY.length && chance(.2)) W.queue.push({ ev: pick(A2_ENVOY) }); }
      else toast('对方没有松口', '#dddddd');
      didAct('envoy', null, 2, ok); } });
}
function armyAct() {
  return mkAct({ id: 'army', kind: 'army', n: '领兵', ap: 2, hint: withTip(chkHint(0, 12) + ' · 名望+10 · 将军们+10', '胆小'),
    no: () => minorNo() || (W.rank < 2 ? '客卿才能领兵' : W.cool.army ? '再等 ' + W.cool.army + ' 季' : ''),
    fn: () => { if (!spendAp(2)) return; W.cool.army = 4; const ok = chk(0, 12), p = P();
      if (ok) { addPrest(10); for (const s of courtSeats()) if (s.bing) addOp(s.c, p, 10, true); if (W.kingId === 'zheng') W.a2.yi = Math.min(100, W.a2.yi + 2); addMerit(6, '领兵'); toast('打了胜仗', '#9fe89a'); }
      else { addHealth(p, -10); addPrest(-5); toast('吃了败仗', '#ff9a8a'); }
      addStress(p, '胆小'); didAct('army', null, 0, ok); } });
}
// a quiet year goes by at once: it stops for a story card, a birth or death in the family, a new head, an illness — not
// for errands, requests and flavour cards (W.flags.waiting keeps them from coming), nor before an errand falls due
const WAIT_SKIP = new Set(['rand', 'joboffer', 'fask', 'zhiji', 'jibao']);
const waitAct = () => mkAct({ id: 'wait', kind: 'wait', n: '静候一年', ap: 0, hint: '一季一季过去 · 有大事才停', no: () => W.queue.length ? '先把眼前的事办完' : '',
  fn: () => {
    W.flags.waiting = true;
    try {
      for (let i = 0; i < 4 && !busy(); i++) {
        endSeason();
        W.queue = W.queue.filter(q => !WAIT_SKIP.has(q.ev)); if (W.later) W.later = W.later.filter(q => !WAIT_SKIP.has(q.ev));
        if (W.queue.length || (W.job && W.job.due <= W.t + 1)) break;
      }
    } finally { delete W.flags.waiting; }
  } });

// ---------------------------------------------------------- the 朝堂 widget (top right) and the courtier list
const COURT_TIP = '朝堂：一格是一席，颜色是他倾向谁。金是你，紫是吕不韦，红是王，绿是楚系，灰是宗室。朝臣对你好感到 20，又高过对别家的，就倒向你。点开看各差几点。';
function openCourt() {
  const L = courtSeats(); if (!L.length) { toast('朝中还没有人', '#dddddd'); return; }
  const p = P();
  pickChar('朝堂 · 你 势' + powerOf('you') + ' · 相邦 ' + xiangName(), L.map(s => s.c), c => openSheet(c.id), c => {
    const s = courtSeats().find(x => x.c === c), k = s && s.lean;
    const head = k && k !== 'you' && LEAD[k].cat() === c;
    // (how far each is from coming over: 差N)
    const gp = s && !head && k !== 'you' ? courtGap(s) : 0;
    return { txt: (s && s.w > 1 ? '二席 ' : '') + (head ? (k === 'wang' ? '王' : k === 'zong' ? '宗室之首' : LEAD[k].n + '系之首') : k ? (k === 'you' ? '你的人' : '倾向' + LEAD[k].n) : '中立') + ' · 你' + a2s(opinion(c, p)) + (gp ? ' 差' + gp : ''), col: k ? LEAD[k].ink : '#5f5236', v: !s || k === 'you' || head ? -999 : -(gp || 999) }; });
}
function courtWidget() {
  const A = W.a2; if (!A || W.act !== 2 || !W.flags.act1Done) return false;
  const p = P(), z = C('zheng');
  // the 邯郸 line: what 政 thinks of you is what matters there
  if (!inQin()) {
    if (!alive(z) || !a2Hd()) return false;
    const o = opinion(z, p);
    rect(118, 20, 59, 19, 'rgba(22,18,26,.75)'); txt(nm(z) + ' 对你 ' + a2s(o), 147, 25, 5.5, '#f2ead4', 'center', null);
    rect(121, 31, 53, 4, '#3a3040'); rect(121, 31, R(clamp(o, 0, 100) * .53), 4, '#e8b040');
    hit(118, 20, 59, 19, () => openSheet(z.id)); return true;
  }
  const S = courtSeats(), units = [];
  for (const s of S) for (let i = 0; i < s.w; i++) units.push(s.lean);
  units.sort((a, b) => (a ? LEAD_ORD.indexOf(a) : 9) - (b ? LEAD_ORD.indexOf(b) : 9));
  rect(118, 20, 59, 34, 'rgba(22,18,26,.75)');
  txt('朝堂', 121, 25, 5.5, '#f2ead4', 'left', null); txt('席 ' + units.length, 174, 25, 5.5, '#a89888', 'right', null);
  // (eleven squares fit a row; more seats, smaller squares: fourteen at 3 px)
  const big = units.length <= 11, pitch = big ? 5 : 4, sz = big ? 4 : 3;
  units.slice(0, 14).forEach((k, i) => { const x = 120 + i * pitch; if (k) rect(x, 29, sz, sz, LEAD[k].col); else { rect(x, 29, sz, sz, '#8a7a6a'); if (big) rect(x + 1, 30, 2, 2, '#1e1826'); else rect(x + 1, 30, 1, 1, '#1e1826'); } });
  // (王权 once 政 is king; before that, what the king thinks of you)
  const kg = king(), wv = W.kingId === 'zheng' ? A.wang : kg && kg !== p ? opinion(kg, p) : 100;
  txt(W.kingId === 'zheng' ? '王权' : '王对你', 121, 39, 5.5, '#ffb0a0', 'left', null); rect(140, 37, 34, 4, '#3a3040'); rect(140, 37, R(clamp(wv, 0, 100) * .34), 4, W.kingId === 'zheng' ? '#c0503a' : '#e8b040');
  // you, then the two strongest others, each in its colour
  // (from 前239, with 嫪毐 at court: the sums the capping card will count — the king's side, his, yours)
  const top = W.t >= 90 && LEAD.lao.cat() ? [['you', powerOf('you')], ['wang', kingSide()], ['lao', laoPow()]]
    : LEAD_ORD.filter(k => k === 'you' || LEAD[k].cat()).map(k => [k, powerOf(k)]).sort((a, b) => (b[0] === 'you') - (a[0] === 'you') || b[1] - a[1]).slice(0, 3);
  let x = 121; for (const [k, n] of top) { const s = LEAD[k].n + n; txt(s, x, 48, 5.5, LEAD[k].col, 'left', null); x += tw(s, 5.5) + 5; }
  rect(118, 54, 59, 9, 'rgba(22,18,26,.75)');
  const t2 = W.kingId === 'zheng' && alive(z) ? z.name + ' 对你 ' + a2s(opinion(z, p)) : '相邦 ' + xiangName();
  txt(fitT(t2, 55, 5.5), 147, 58.5, 5.5, '#ffe08a', 'center', null);
  hit(118, 20, 59, 44, openCourt);
  return true;
}
// the first season at court the widget gets one step of explanation (queued: the builder opens the guide itself)
EV.courtTip = () => { if (!a2Here()) return null; W.loc = 'home'; MODAL.push({ type: 'tour', i: 0, steps: [[[118, 19, 59, 45], COURT_TIP]] }); return null; };

// ---------------------------------------------------------- the goal line
// what the next rank still asks for, in one short line, and the tab where the first gap is closed (null: nothing missing)
// (朝中: who is closest to leaning your way, and by how much; 功 with an errand in hand: the errand's own tab)
function lackTxt() {
  const x = nextPromo(); if (!x) return null;
  const miss = x.need().filter(([, v, n]) => v < n); if (!miss.length) return null;
  const num = miss.filter(([l]) => l !== '朝中').map(([l, v, n]) => ['功', '望', '势'].includes(l) ? l + (n - Math.max(0, v)) : l + '好感' + (n - v)).join(' ');
  const nr = miss.some(([l]) => l === '朝中') ? courtNearest() : null;
  const court = miss.some(([l]) => l === '朝中') ? (nr ? '朝中：' + nm(nr[0]) + '差' + nr[1] : '朝中无人') : '';
  const j = W.job, d = j && jobDef(j.id), f = miss[0][0];
  const job = f === '功' && d && TABS[d.tab] ? TABS[d.tab].n : null;
  return { s: [num ? '还差 ' + num : '', job ? '先办差事' : '', court].filter(Boolean).join(' · '), tab: job || (['功', '望'].includes(f) ? '宫' : '人') };
}
function a2Goal() {
  const A = W.a2, z = C('zheng'), p = P(), t = W.t;
  if (a2Hd() && t < 47 && alive(z)) { const o = opinion(z, p); return o >= 60 ? '目标：前251归秦 · 还有 ' + (47 - t) + ' 季 · 攒些鱼干（市）' : '目标：护住政母子到前251 · ' + nm(z) + ' ' + a2s(o) + '（人）'; }
  if (!a2Here()) return '';
  if (ageOf(p) < 16) return '目标：长到十六岁再入朝 · 还有 ' + Math.max(1, p.born + 64 - t) + ' 季（家）';
  if (A.end) return '目标：朝局已定 · 等前237年（行 · 静候一年）';
  const you = powerOf('you'), lao = LEAD.lao.cat(), vs = ' · 势 你' + you + (LEAD.lv.cat() ? '/吕' + powerOf('lv') : ''), zo = alive(z) ? z.name + a2s(opinion(z, p)) : '';
  if (t >= 97) return '目标：等王上召见 · ' + zo + (A.yi ? ' 忌惮' + A.yi : '') + '（人）';
  if (t === 96) return '目标：冠礼在即，想好站哪边 · 王方' + kingSide() + (lao ? ' 毐方' + laoPow() : '') + ' 你' + you + '（人）';
  if (W.rank < 2) {
    if (W.cool.promo) return '目标：章台失利 · ' + W.cool.promo + ' 季后再求官（人）';
    if (promoReady()) return '目标：求官，升客卿（宫 · 大计）';
    const L = lackTxt(); return '目标：当上客卿' + (L ? ' · ' + L.s + '（' + L.tab + '）' : '（宫 · 大计）');
  }
  if (t < 46) return '目标：笼络朝臣，压过吕不韦' + vs + '（人）';
  if (t < 52) return xiangIn() ? '目标：拜相 · 你' + xiangScore('you') + ' / 吕' + xiangScore('lv') + '（人）' : '目标：笼络朝臣' + vs + '（人）';
  if (promoReady() && !W.cool.promo) return '目标：求官，升' + RANKS[W.rank + 1] + '（宫 · 大计）';
  if (t < 61) return A.xiang === 'you' ? '目标：坐稳相位 · 笼络朝臣' + vs + '（人）' : LEAD.lv.cat() ? '目标：扳倒吕不韦，找他的把柄' + vs + '（人）' : '目标：笼络朝臣' + vs + '（人）';
  // (from 前239 the capping's two sides, in the card's own numbers)
  if (t >= 90 && lao) return '目标：冠礼前握住朝堂 · 王方' + kingSide() + ' 毐方' + laoPow() + ' 你' + you + '（人）';
  return '目标：冠礼前握住朝堂 · 势' + you + (zo ? ' · ' + zo : '') + (A.yi >= 40 ? ' 忌惮' + A.yi : '') + '（人）';
}

// ---------------------------------------------------------- promotions and court errands (career's tables)
PROMO.push(
  { to: 2, ev: 'keqing2', ok: () => W.rank === 1 && a2Here() && ageOf(P()) >= 16,
    need: () => { const by = keqBy2(); return [['功', W.merit || 0, 60], ['望', W.prest, 50], [alive(by) ? nm(by) : '王', alive(by) ? opinion(by, P()) : 0, 40], ['朝中', courtFriend() ? 1 : 0, 1]]; } },
  { to: 3, ev: 'huanxiang', ok: () => W.rank === 2 && a2Here() && W.t > 52 && W.a2.xiang !== 'you',
    need: () => { const k = king(), lv = LEAD.lv.cat(), o = alive(k) ? opinion(k, P()) : 0;
      return [['功', W.merit || 0, 90], ['势', powerOf('you'), lv ? powerOf('lv') + 1 : 2], [alive(k) ? nm(k) : '王', o, Math.max(30, lv && alive(k) ? opinion(k, lv) + 1 : 30)]]; } },
  { to: 4, ev: 'zhongfu2', ok: () => W.rank === 3 && a2Here() && W.t > 61 && W.a2.zhongfu !== 'you' && !(W.a2.zhongfu === 'lv' && LEAD.lv.cat()),
    need: () => { const q = qmNpc(), k = king(), w = q || k; return [['功', W.merit || 0, 180], [q ? '太后' : '王', alive(w) ? opinion(w, P()) : 0, 40], ['势', powerOf('you'), 5]]; } },
);
// a courtier who isn't yours yet and doesn't think much of you (for 拉拢)
const courtTarget = gv => { const L = courtSeats().filter(s => s.lean !== 'you' && s.c !== gv && s.c.loc !== 'hougong' && opinion(s.c, P()) < 40); return L.length ? pick(L).c : null; };
JOBS.push(
  { id: 'q_jinyan', patron: '*', title: '进言', task: '上朝进言一次', tab: 'court', due: 3, w: .8, goal: { kind: 'memorial', any: 1 },
    reward: { merit: 8, prest: 2 }, ok: () => a2Here() && W.rank >= 1, line: '「朝上的人都不肯先开口。明天你站出来说几句。」' },
  { id: 'q_lalong', patron: '*', title: '拉拢', task: j => '与' + nm(C(j.tgt)) + '走动两回', tab: 'people', due: 4, w: .8, goal: { kind: ['talk', 'gift', 'pay'], target: j => [j.tgt], n: 2 },
    reward: { merit: 10 }, ok: gv => a2Here() && !!courtTarget(gv), pre: (q, gv) => { const c = courtTarget(gv); q.tgt = c ? c.id : null; },
    line: j => '「' + nm(C(j.tgt)) + '在朝上从不表态。你去走动走动，让' + ta(C(j.tgt)) + '记得你。」' },
  { id: 'q_chushi', patron: '*', title: '出使', task: '出使一趟', tab: 'travel', due: 4, w: .6, goal: { kind: 'envoy', any: 1 },
    reward: { merit: 10, prest: 4 }, ok: () => a2Here() && W.rank >= 1, line: '「韩国的使者走了三天了。回访的人，你去。」' },
  { id: 'q_dujun', patron: '*', title: '督军', task: '领兵一次', tab: 'travel', due: 6, w: .5, goal: { kind: 'army', any: 1 },
    reward: { merit: 14 }, ok: () => a2Here() && W.rank >= 2, line: '「前线要一个自己人看着。你去一趟。」' },
  { id: 'q_jianxian', patron: '*', title: '荐贤', task: '荐一名门客入朝', tab: 'court', due: 6, w: .5, goal: { kind: 'recommendQ' },
    reward: { merit: 12, prest: 5 }, ok: () => a2Here() && W.rank >= 2 && recCands().length > 0 && W.a2.recs.length < 2, line: '「朝里的人都老了。你门下要是有能办事的，荐上来。」' },
  { id: 'q_tanxiang', patron: '*', title: '探相', task: '刺探吕不韦', tab: 'people', due: 3, w: .5, goal: { kind: 'spy', target: ['lv'] }, odds: () => chkHint(3, 11),
    reward: { merit: 8 }, ok: gv => a2Here() && !!LEAD.lv.cat() && W.t >= 52 && !!gv && gv.id !== 'lv' && pct(stat(P(), 3), 11) >= .25,
    line: '「吕不韦府上的门客越来越多了。你去看看，他们都在说什么。」' },
);
// 子楚's letters about 政 in 邯郸 are 邯郸 errands; a 秦 king doesn't say 赵国无人
for (const id of ['zhaokan', 'kaimeng']) { const d = jobDef(id); if (d) { const ok0 = d.ok; d.ok = g => W.city === 'handan' && ok0(g); } }
{ const d = jobDef('lunbian'); if (d) { const l0 = d.line; d.line = (j, gv) => gv && gv.role === 'ruler' && gv.state === '秦' ? '「客舍里那些士，说秦国只有刀没有笔。你去跟他们辩一辩。」' : l0(j, gv); } }
Object.assign(XP_KIND, { memorial: 1, envoy: 2, recommendQ: 2, teachKing: 1 });

// a small 咸阳 pool (ACT2-content adds more): 秦's law and 秦's ranks, as a merchant house meets them
RANDOM.push(
  { id: 'xy_lian', w: 2, cd: 32, ok: () => inQin(), b: () => ({ title: '连坐', who: [], text: pick(['隔壁人家的儿子犯了法。里正上门来说，按秦法五家连坐，你家也在里面。', '同一伍的人家有人逃了役。里正拿着名册上门，说五家都要受罚。']),
    opts: [opt('「按规矩，该罚就罚。」', '鱼干-30', () => addFish(-30)),
      opt('去找里正通融', chkHint(2, 10) + ' · 败则鱼干-60', () => { if (chk(2, 10)) toast('里正收了礼，这件事算了', '#9fe89a'); else addFish(-60); })] }) },
  { id: 'xy_jue', w: 2, cd: 32, ok: () => inQin(), b: () => ({ title: '军功', who: [], text: pick(['街口的屠户从前线回来，拿两颗首级换了一级爵位。整条街都去他家喝酒。', '隔壁的小兵斩了一个首级，得了一顷田、一处宅子。他家摆了三天酒。']),
    opts: [opt('备一份礼去', '鱼干-20 · 名望+3', () => { addFish(-20); addPrest(3); }, () => W.fish >= 20), opt('「不去。」', '', () => {})] }) },
);

// ---------------------------------------------------------- secrets of the court, and what telling them does at court
Object.assign(SEV, { poison: 3, eunuch: 2, spy: 2, plot: 3, alias: 2 });
{ const st1 = secretText;
  secretText = s => s.type === 'poison' ? (s.subj ? nm(C(s.subj)) + '在孝文王的鱼汤里下了东西' : '孝文王死在一碗鱼汤上') : s.type === 'eunuch' ? nm(C(s.subj)) + '不是宦官'
    : s.type === 'spy' ? nm(C(s.subj)) + '是韩国派来的' : s.type === 'plot' ? nm(C(s.subj)) + '与' + nm(C(s.other)) + '有密约' : s.type === 'alias' ? nm(C(s.subj)) + '就是桓齮' : st1(s); }
// 弹劾 = exposing a courtier's or a leader's secret: those who leaned to them cool on them; some secrets bring more down
function courtFallout(s, by) {
  const A = W.a2; if (!A || !W.flags.act1Done) return;
  const gl = guiltyOf(s).map(C).filter(Boolean), z = C('zheng'), q = qm();
  if (by === W.player && inQin()) for (const g of gl) { const k = LEAD_ORD.find(x => x !== 'you' && LEAD[x].cat() === g); if (k) for (const st of courtSeats()) if (st.lean === k) addMemo(st.c, g, '弹劾', -15, 24); }
  if (s.type === 'affair' && gl.some(g => g.id === 'lv') && q && gl.includes(q) && alive(z) && ageOf(z) >= 16) lvFall('和太后的事传开了');
  if (s.type === 'eunuch' && A.laoIn) { if (powerOf('lao') < powerOf('wang')) laoFalls(); else if (by === W.player && alive(C('laoai'))) rivalOf(C('laoai'), P()); }
  if (s.type === 'bastard' && s.kid === 'zheng') { A.claim = Math.min(100, A.claim + 30); const b = by && C(by); if (alive(z) && alive(b) && b !== z) addMemo(z, b, '揭我身世', -60); }
  if (s.type === 'spy') A.zhuke = W.t + 1;   // (act three: the 逐客令 comes early)
  CS.k = '';
}
{ const ex0 = exposeSec; exposeSec = (s, by) => { const was = !s || s.exposed; ex0(s, by); if (!was && s.exposed) courtFallout(s, by); }; }

// ---------------------------------------------------------- hooks
function a2Fresh() {
  return { line: null, wang: 0, yi: 0, lonely: 0, claim: 0, laoMen: 0, laoIn: false, lvDown: false, xiang: null, zhongfu: null, fief: false, recs: [], cx: [], gone: {},
    side: null, quell: false, coup: null, end: null, blood: false, letterT: null, taught: -9, guard: false, seeded: false, pid: null, closed: false, free: false, old: false, xyT: null };
}
// (the card's portrait sits in its place: 咸阳's places are painted too)
const a2Once = () => { for (const l of ['xmarket', 'xtavern', 'xpalace', 'hougong', 'xlvfu', 'camp', 'xgate']) SCN_LOCS.add(l); };
SYS.init.push(W => { W.a2 = a2Fresh(); W.kingId = 'zhao'; a2Once(); settleXy(); });
SYS.load.push(W => {
  a2Once();
  // (成蟜 is written 成峤 now: the pixel font has 峤; old saves keep his name, the log keeps the old lines)
  { const cj = W.chars.chengjiao; if (cj) { if (cj.name === '蟜') cj.name = '峤'; if (cj.disp) cj.disp = cj.disp.replace(/蟜/g, '峤'); } }
  const F = a2Fresh();
  if (!W.a2) {
    // a save from before act two: a house that stayed in 邯郸 gets its letter from 咸阳 at the next due date
    W.a2 = F;
    if (W.flags.act1Done) { F.old = true; F.line = W.act === 2 ? 'xy' : W.flags.betray ? 'zhao' : 'free'; if (W.act < 2) F.letterT = W.t < 47 ? 47 : W.t + 1; if (W.t >= 61) F.wang = clamp(20 + W.t - 61, 0, 100); }
  } else for (const k in F) if (W.a2[k] === undefined) W.a2[k] = F[k];
  // (a save already in 咸阳 has been there long enough)
  if (W.a2.xyT === null && W.city === 'xianyang') W.a2.xyT = 0;
  const pendingCrown = W.kingId === W.player && C(W.player) && !alive(P());
  if ((!W.kingId || !alive(C(W.kingId))) && !pendingCrown) { const k = firstAlive(QIN_KINGS); W.kingId = k ? k.id : null; }
  if (W.kingId === W.player) registerPlayerCrown(P());
  if (W.kingId && W.kingId === W.player) { W.patron = null; if (W.job && W.job.from === W.player) W.job = null; }
  { const ca = C('changanz'); if (ca && ca.disp === '长安君') ca.disp = '赵长安君'; const zj = C('zhaoji'); if (zj && zj.disp === '赵太后') zj.disp = '帝太后'; }
  // 子楚's 狸 bride belongs to 秦's house (saves from before royalOut)
  const b = W.flags.liBride && C(W.flags.liBride);
  if (alive(b) && b.id !== W.player) { b.flags.royal = true; b.flags.left = true; if (b.loc === 'home') b.loc = cityOf(C('yiren')) === 'xianyang' || W.city === 'xianyang' ? 'hougong' : 'hostage'; }
  settleXy();
});
SYS.season.push(() => {
  const A = W.a2; if (!A) return;
  locSweep();
  if (!W.flags.act1Done) return;
  const p = P();
  if (alive(p) && A.pid !== W.player) { if (A.pid) newHead(A.pid); A.pid = W.player; }
  // history brings 秦's people to 咸阳 on its own schedule, and seats them at court when their time comes
  for (const id in CHAR2) if (CHAR2[id].t !== null && CHAR2[id].t <= W.t && !C(id)) spawn2(id);
  for (const r of COURT) if (r.in === W.t) { const c = C(r.id); if (alive(c) && cityOf(c) === 'xianyang' && !['xpalace', 'hougong', 'camp'].includes(c.loc)) c.loc = (CHAR2[r.id] && CHAR2[r.id].o.loc) || 'xpalace'; }
  if (W.t >= 48 && zhengInHandan()) bringZheng();
  kingCheck();
  if (a2Here() && !W.flags.courtTip && W.flags.tourDone && courtSeats().length) { W.flags.courtTip = true; W.queue.push({ ev: 'courtTip' }); }
  if (W.t >= 74 && W.t < 96 && !C('laoai')) laoFallback();
  aiCourt();
  // act three begins for everyone in 前237 (the act's last card does it for those still in act two)
  if (W.t >= 100 && W.act === 1.5) W.act = 3;
  if (W.t >= 102 && W.act === 2) W.act = 3;
});
// (a head who married into 秦's house hands the house on first, in any act)
SYS.sched.push(() => { if (royalHead() && !W.queue.some(q => q.ev === 'chujia')) W.queue.unshift({ ev: 'chujia' }); });
SYS.sched.push(() => {
  // (a head who died this season still gets the story: 'succession' goes first in the queue, the cards come to the heir)
  const A = W.a2; if (!A || !W.flags.act1Done) return;
  for (const [t, id, cond] of A2_CAL) if (t === W.t && (cond ? cond() : a2Here()) && !W.queue.some(q => q.ev === id)) W.queue.push({ ev: id });
  if (A.letterT !== null && W.t >= A.letterT && !inQin() && W.act !== 2 && !W.queue.some(q => q.ev === 'laixin' || q.ev === 'guiqin')) {
    if (zhengInHandan()) A.letterT = 100; else { A.letterT = null; W.queue.push({ ev: 'laixin' }); }
  }
  for (const [t, s, c] of A2_NEWS) if (t === W.t && (!c || c())) logLine(s, '#c8e0ff');
});
SYS.widget.push(courtWidget);
SYS.goal.push(() => {
  if (!W.a2 || !W.flags.act1Done || !alive(P())) return null;
  // (a deadly illness at home keeps its own line)
  if (household().some(c => isIll(c) && c.ill.k === '重病')) return null;
  const s = a2Goal(); return s ? { s, pri: 10 } : null;
});
SYS.opinion.push((a, b, add) => { if (a.id === 'zheng' && b.id === W.player && W.a2 && W.a2.yi >= 1) add('忌惮', -W.a2.yi); });
SYS.econ.push((inc, cost) => {
  if (!W.a2) return;
  if (W.a2.fief) inc.push(['封邑', 20]);
  if (inQin() && W.rank >= 3 && W.rank <= 4) cost.push(['相府开销', W.rank * 5]);
});
SYS.did.push(() => { CS.k = ''; if (W.a2) locSweep(); });
// (秦 is gone: nobody to present gifts to, advise or petition; 大计 stays. Runs after the systems that add those: ACT3's
// init and load hooks move it last)
function noCourtTab(tab, A) {
  if (tab !== 'court' || !W.a3 || !W.a3.qinFell || W.kingId || alive(cityRuler())) return;
  for (const id of ['audience', 'tribute', 'advise', 'memorial', 'recommendQ', 'askJob']) { const i = A.findIndex(a => a.id === id); if (i >= 0) A.splice(i, 1); }
  A.unshift(mkAct({ id: 'nocourt', n: '朝廷', ap: 0, hint: '秦亡了，没有朝廷', no: () => '秦亡了，没有朝廷', fn: () => {} }));
}
SYS.tab.push(noCourtTab);
SYS.tab.push((tab, A) => {
  if (!W.a2 || !W.flags.act1Done || !alive(P())) return;
  if (tab === 'court' && inQin() && W.act >= 2) {
    // a king doesn't pay court to himself
    const me = king() === P();
    if (me) for (const id of ['audience', 'tribute', 'advise']) { const i = A.findIndex(a => a.id === id); if (i >= 0) A.splice(i, 1); }
    if (!me) A.push(memoAct()); A.push(recAct());
  }
  if (tab === 'travel') { if (a2Here()) A.push(envoyAct(), armyAct()); A.push(waitAct()); }
});
SYS.acts.push((c, A) => {
  if (!W.a2 || !alive(c) || !inQin()) return;
  const p = P();
  // the inner palace is closed to a 舍人 who is not family
  if (c.loc === 'hougong' && W.rank < 2 && !relTo(c) && !closeKin(c, p)) { for (let i = A.length - 1; i >= 0; i--) if (!A[i].remote) A.splice(i, 1); return; }
  // at court, telling a secret is an impeachment
  const ex = A.find(a => a.id === 'expose'); if (ex && (courtSeats().some(s => s.c === c) || LEAD_ORD.some(k => k !== 'you' && LEAD[k].cat() === c))) ex.n = '弹劾';
  // the young king's lessons: 相邦 and 仲父 (or his 傅) teach him
  const tg = () => { const o = opinion(c, p); return o < 40 ? 5 : o < 70 ? 2 : 0; };
  if (c.id === 'zheng' && reach(c) && ageOf(c) < 22 && (W.rank >= 3 || W.a2.fu)) A.push(mkAct({ id: 'teachKing', kind: 'teachKing', n: c.role === 'ruler' ? '教导王上' : '教导' + nm(c), ap: 1, grp: '友',
    hint: (tg() ? nm(c) + '+' + tg() + ' · ' : '') + '忌惮-4', no: () => minorNo() || (W.a2.taught >= W.t - 1 ? '刚教过，隔一季再教' : ''),
    fn: () => { if (!spendAp(1)) return; W.a2.taught = W.t; addOp(c, p, tg()); W.a2.yi = Math.max(0, W.a2.yi - 4);
      const i = bestSt(p); if (ageOf(c) < 16) { c.edu = c.edu || [0, 0, 0, 0]; c.edu[i]++; } react(c, 'teach', true, LESSON[i]); didAct('teachKing', c, i, true); } }));
});
SYS.sheet.push((c, rows) => {
  if (!W.a2 || !alive(c) || !inQin() || !W.flags.act1Done) return;
  if (c.id === W.player) { if (W.act === 2) rows.push({ chip: '朝堂', col: '#8a5a10', text: '势 ' + powerOf('you') + ' · 相邦 ' + xiangName() + ' ›', fn: openCourt }); return; }
  const s = courtSeats().find(x => x.c === c), lk = LEAD_ORD.find(k => k !== 'you' && LEAD[k].cat() === c);
  if (lk) rows.push({ chip: '首领', col: LEAD[lk].ink, text: (LEAD[lk].n === '王' ? '王' : LEAD[lk].n + '系') + ' · 势 ' + powerOf(lk) });
  else if (s) { const gp = courtGap(s); rows.push({ chip: '朝臣', col: s.lean ? LEAD[s.lean].ink : '#6a6268', text: (s.lean ? '倾向' + (s.lean === 'you' ? '你' : LEAD[s.lean].n) : '中立') + ' · ' + (s.w > 1 ? '二席' : '一席') + (s.bing ? ' · 将军' : '') + (gp ? ' · 好感再+' + gp + '倒向你' : '') }); }
  if (c.loc === 'hougong' && W.rank < 2 && !relTo(c) && !closeKin(c, P())) rows.push({ chip: '后宫', col: '#7a5a6a', text: '客卿以上才进得去' });
});
