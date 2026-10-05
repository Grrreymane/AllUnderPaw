// ==== ACT3 ==== 第三幕 · 一统 / 自由模式 / 尾声
// 前237–前221 (t100–164): 秦 takes the six states one by one. W.realm holds each state's strength (0–100). 秦's own
// armies march every year, in history's order, and a state that outlives its year in the books is worn down faster, so
// 天下 is one by about 前220 whatever the house does; what you do on the 行 tab (called 天下 in this act) makes it come
// sooner: 出征 (相邦 and up), 离间, 结好, 劝降 (客卿 and up). A house outside 秦 only watches, and hears the news. When
// the last state falls (or 前217 comes first) an ending card leads into free mode (W.act 4): the 尾声 on history's
// calendar to 前206, then the house goes on with 志向 (ambitions on the goal line), 子女出路 and 迁居.
// API (plain calls): realmOn() the fight for 天下 is on · rFallen(k) · a3Role() 'king' | 'lead' (相邦 仲父) | 'ke' (客卿) |
//   'low' (in 咸阳, below 客卿) | 'out' · fallRealm(k, how) · a3Spawn(id, loc) (CHAR2's entry, else A3_CHAR's)
//   W.realm { han zhao wei chu yan qi: { s, fallen (turn | null), friend (turn a pact lasts to), noGen, king (a ruler
//   the story put up) } } · W.a3 { guo 秦国力, uni (turn 天下 was one), end (the ending's key), amb (ambition) … }
const A3_REALM = {
  han: { n: '韩', s: 35, fallT: 128, war: 120, open: 112, kings: ['hanan'], gen: null },
  zhao: { n: '赵', s: 80, fallT: 136, war: 112, open: 104, kings: ['zhaoqian', 'daoxiang'], gen: 'limu' },
  wei: { n: '魏', s: 50, fallT: 148, war: 140, open: 132, kings: ['weijia', 'jingmin'], gen: null },
  chu: { n: '楚', s: 100, fallT: 156, war: 144, open: 140, kings: ['fuchu', 'youwang'], gen: 'xiangyan' },
  yan: { n: '燕', s: 45, fallT: 160, war: 148, open: 140, kings: ['yanxi'], gen: null },
  qi: { n: '齐', s: 60, fallT: 164, war: 156, open: 148, kings: ['qijian'], gen: null },
};
const A3_RK = Object.keys(A3_REALM);
// the people this act brings on stage (st = [武, 政, 交, 谋]); the six states' people live off stage in their capitals
const A3_CHAR = {
  hanan: { disp: '韩王安', sur: '韩', name: '安', born: bornAt(265), role: 'ruler', robe: 'han', state: '韩', loc: 'xinzheng', tr: ['胆小', '多疑'], st: [3, 7, 6, 6] },
  jingmin: { disp: '魏景湣王', sur: '魏', name: '增', born: bornAt(270), dad: 'anli', role: 'ruler', robe: 'wei', state: '魏', loc: 'daliang', tr: ['慵懒', '轻信'], st: [4, 6, 6, 5] },
  weijia: { disp: '魏王假', sur: '魏', name: '假', born: bornAt(250), dad: 'jingmin', role: 'ruler', robe: 'wei', state: '魏', loc: 'daliang', tr: ['胆小', '仁厚'], st: [3, 6, 7, 5] },
  youwang: { disp: '楚幽王', sur: '芈', name: '悍', born: bornAt(247), role: 'ruler', robe: 'chu', state: '楚', loc: 'shouchun', tr: ['轻信', '慵懒'], st: [3, 5, 6, 4] },
  fuchu: { disp: '楚王负刍', sur: '芈', name: '负刍', born: bornAt(265), role: 'ruler', robe: 'chu', state: '楚', loc: 'shouchun', tr: ['野心', '狠辣'], st: [8, 7, 7, 10] },
  xiangyan: { disp: '项燕', sur: '项', name: '燕', born: bornAt(275), role: 'general', robe: 'chu', state: '楚', loc: 'shouchun', tr: ['勇猛', '记仇', '诚实', '兵家'], st: [17, 7, 9, 12] },
  yanxi: { disp: '燕王喜', sur: '姬', name: '喜', born: bornAt(280), role: 'ruler', robe: 'yan', state: '燕', loc: 'ji', tr: ['胆小', '多疑'], st: [4, 6, 6, 7], g: { W: ['W', 'w'] } },
  dan: { disp: '太子丹', sur: '姬', name: '丹', born: bornAt(260), dad: 'yanxi', role: 'noble', robe: 'yan', state: '燕', loc: 'ji', tr: ['记仇', '勇猛', '粘人'], st: [6, 8, 10, 9], g: { W: ['W', 'w'] } },
  jingke: { disp: '荆轲', sur: '荆', name: '轲', born: bornAt(262), role: 'shi', robe: 'shi', state: '卫', loc: 'ji', tr: ['勇猛', '高冷', '诚实'], st: [15, 4, 9, 10], g: { A: ['a', 'a'], O: ['o'], L: ['l', 'l'], S: ['s', 's'] } },
  qijian: { disp: '齐王建', sur: '田', name: '建', born: bornAt(280), role: 'ruler', robe: 'qi', state: '齐', loc: 'linzi', tr: ['轻信', '慵懒', '知足'], st: [3, 5, 6, 4] },
  housheng: { disp: '后胜', sur: '后', name: '胜', born: bornAt(270), role: 'minister', robe: 'qi', state: '齐', loc: 'linzi', tr: ['贪吃', '狡诈', '野心'], st: [2, 8, 12, 10] },
  hanfei: { disp: '韩非', sur: '韩', name: '非', born: bornAt(280), role: 'shi', robe: 'han', state: '韩', loc: 'xtavern', tr: ['高冷', '诚实', '节制', '法家'], eduLv: 3, st: [1, 17, 4, 16], g: { D: ['d', 'd'], A: ['a', 'a'], O: ['o'] } },
  lisi: { disp: '李斯', sur: '李', name: '斯', born: bornAt(284), role: 'minister', robe: 'chu', state: '秦', loc: 'xpalace', tr: ['野心', '嫉妒', '勤快', '法家'], st: [3, 15, 15, 15], g: { A: ['A', 'a'], T: ['Tm', 'tb'], S: ['s', 's'], O: ['o'] } },
  weiliao: { disp: '尉缭', sur: '尉', name: '缭', born: bornAt(280), role: 'minister', robe: 'wei', state: '秦', loc: 'xpalace', tr: ['多疑', '高冷', '鬼谷门生'], st: [10, 10, 10, 17], g: { B: ['b', 'b'], D: ['d', 'd'], A: ['A', 'a'] } },
  wangben: { disp: '王贲', sur: '王', name: '贲', born: bornAt(258), dad: 'wangjian', role: 'general', robe: 'general', state: '秦', loc: 'camp', tr: ['勇猛', '诚实'], st: [16, 6, 6, 10] },
  lixin: { disp: '李信', sur: '李', name: '信', born: bornAt(255), role: 'general', robe: 'general', state: '秦', loc: 'camp', tr: ['勇猛', '野心', '轻信'], st: [14, 5, 6, 6] },
  fusu: { disp: '扶苏', sur: '嬴', name: '扶苏', born: bornAt(242), dad: 'zheng', role: 'noble', robe: 'qin', state: '秦', loc: 'xpalace', tr: ['仁厚', '诚实'], st: [6, 9, 10, 7] },
  liuji: { disp: '刘季', sur: '刘', name: '季', born: bornAt(256), role: 'shi', robe: 'shi', state: '楚', loc: 'xtavern', tr: ['好客', '多情', '轻信'], st: [8, 6, 14, 11] },
};
// the books' dates: two kings who die in 前228 and hand on to the next, the general who dies with 楚, and the last kings
// (kept safe until a little after their state's year; the fall itself takes them away, see fallRealm)
for (const [id, t] of [['jingmin', 136], ['youwang', 136], ['xiangyan', 156], ['hanan', 144], ['weijia', 160], ['fuchu', 168], ['yanxi', 172], ['qijian', 176]]) { if (HISTD[id] === undefined) HISTD[id] = t; HIST_GONE.add(id); }
// the generals live to their books' years (王贲 takes 燕 and 齐, 蒙武 楚), and the deaths the story tells get no 讣告
Object.assign(HISTD, { wangben: 204, mengwu: 172, dan: 145 });
for (const id of ['dan', 'chengping', 'huhai', 'ziying', 'zheng']) HIST_GONE.add(id);
Object.assign(LOCN, { xinzheng: '新郑', shouchun: '寿春', ji: '蓟', linzi: '临淄', youxue: '外地游学', fuyi: '外地服役' });
// (a child sent away: with the army ('away'), studying, or taken for the state's works; nowhere you can go)
const a3Away = c => ['away', 'youxue', 'fuyi'].includes(c.loc);
// (an exile's town, like ACT2's 河南: every place in it is the one place)
const a3One = l => ({ market: l, tavern: l, palace: l, gate: l, lvfu: l, pingyuan: l, hostage: l });
CITY.shu = { n: '蜀', court: '蜀郡府', mkt: '成都市', gate: '蜀道', ruler: () => king(), locs: ['shu'], tabLoc: { market: 'shu', court: 'shu', people: 'shu', travel: 'shu' }, at: a3One('shu') };
// 邯郸 and 大梁 answer to 咸阳 once their state has fallen (the realm decides that, not the book's year alone)
CITY.handan.ruler = () => firstAlive(['zhaowang', 'daoxiang', 'zhaoqian']) || (rFallen('zhao') || W.t >= HISTD.zhaoqian ? king() : null);
CITY.daliang.ruler = () => firstAlive(['anli', 'jingmin', 'weijia']) || (rFallen('wei') ? king() : null);

const realmOn = () => !!W && W.act >= 3 && !!W.realm && !!W.a3 && !W.a3.uni;
const rFallen = k => !!(W && W.realm && W.realm[k] && W.realm[k].fallen !== null);
const a3Fell = () => A3_RK.filter(rFallen).length;
function a3Role() {
  const p = W && P(); if (!alive(p) || !inQin()) return 'out';
  return W.kingId === W.player ? 'king' : W.rank >= 3 ? 'lead' : W.rank === 2 ? 'ke' : 'low';
}
const a3Court = () => ['king', 'lead', 'ke'].includes(a3Role());
const a3Lead = () => ['king', 'lead'].includes(a3Role());
const a3Ruler = k => { const r = W.realm && W.realm[k], x = r && r.king && C(r.king); return alive(x) ? x : firstAlive(A3_REALM[k].kings); };
// the general who holds a state together (李牧, 项燕), unless its king has been talked out of trusting him
const a3Gen = k => { const r = W.realm[k], id = A3_REALM[k].gen, c = id && C(id); return alive(c) && !r.noGen && cityOf(c) !== 'xianyang' ? c : null; };
function a3Spawn(id, loc) {
  if (C(id)) return C(id);
  if (CHAR2[id]) return spawn2(id, loc);
  const d = A3_CHAR[id]; if (!d || (HISTD[id] !== undefined && W.t >= HISTD[id])) return null;
  const o = Object.assign({ id }, JSON.parse(JSON.stringify(d)), loc ? { loc } : {});
  for (const k of ['dad', 'mom']) if (o[k] && !C(o[k])) delete o[k];
  return spawnHist(o);
}
// someone the story is done with: "从此没了消息" (quiet, whatever the books said)
function a3Gone(c) { if (!alive(c)) return; c.dieT = null; c.immortal = false; die(c, true); }
// the fall of 赵 settles 李牧 and the king; 胡亥 only hands on the crown if he wears it (扶苏 may, see 沙丘)
{ const l0 = HIST_NEXT.limu; HIST_NEXT.limu = c => rFallen('zhao') ? logLine('李牧死在了邯郸城下。', '#c8e0ff') : l0 && l0(c); }
{ const h0 = HIST_NEXT.huhai; HIST_NEXT.huhai = c => { if (h0 && (!W.kingId || W.kingId === 'huhai')) h0(c); }; }
Object.assign(HIST_NEXT, {
  // (the 太子丹 card tells it when it comes; see a3_dan)
  dan: () => { if (W.a3 && W.a3.danH) return; logLine(W.realm && rFallen('yan') ? '燕国亡后，太子丹再没有消息。' : '燕王喜杀了太子丹，把头送到秦军求和。', '#c8e0ff'); },
  chengping: c => logLine(c.flags.ci ? '昌平君死在了淮南。' : W.realm && W.realm.chu && W.realm.chu.king === c.id ? '昌平君战死在淮南。' : '昌平君去世了，享年' + ageOf(c) + '岁。', '#c8e0ff'),
  jingmin: () => { if (W.realm && !rFallen('wei')) { a3Spawn('weijia'); logLine('魏景湣王薨，太子假即位。', '#c8e0ff', true); } },
  youwang: () => { if (W.realm && !rFallen('chu')) { a3Spawn('fuchu'); logLine('楚幽王薨。负刍杀了哀王，自立为楚王。', '#c8e0ff', true); } },
  // (his year comes before 楚's fall: the army he held together breaks)
  xiangyan: () => { logLine('项燕兵败，自杀了。', '#c8e0ff'); const r = W.realm && W.realm.chu; if (r && r.fallen === null) { r.s = Math.max(0, r.s - 30); if (r.s <= 0) fallRealm('chu', 'ai'); } },
});
// (赵's line ends with 赵: no new king for a state that is gone)
{ const d0 = HIST_NEXT.daoxiang; HIST_NEXT.daoxiang = c => { if (d0 && !rFallen('zhao')) d0(c); }; }
// 吕不韦's end (前235) is the letter's, not old age's
if (!HIST_NEXT.lv) { HIST_NEXT.lv = () => { if (W.flags.act1Done) logLine('吕不韦接到迁蜀的信，喝下了鸩酒。', '#c8e0ff'); }; HIST_GONE.add('lv'); }

// ---------------------------------------------------------- the six states: strength, the year's wars, falls
function a3Realm() {
  if (!W || !W.a3 || W.realm || W.act < 3 || !W.flags.act1Done) return W ? W.realm || null : null;
  // (a late save: states whose day has passed are gone already, the rest start weaker)
  const t = W.t; W.realm = {};
  for (const k of A3_RK) {
    const D = A3_REALM[k], left = clamp((D.fallT - t) / (D.fallT - 100), 0, 1);
    W.realm[k] = { s: R(D.s * (.3 + .7 * left)), fallen: t >= D.fallT + 4 ? D.fallT : null, friend: 0, noGen: false, king: null };
  }
  W.a3.guo = 100 + (W.flags.canal ? 20 : 0);
  for (const k of ['han', 'wei', 'chu', 'yan', 'qi']) if (!rFallen(k) && !a3Ruler(k)) { const L = A3_REALM[k].kings; a3Spawn(t < 136 ? L[L.length - 1] : L[0]); }
  if (!rFallen('chu')) a3Spawn('xiangyan');
  if (C('wangjian')) a3Spawn('wangben');
  return W.realm;
}
// the chance that a + U(0,8) beats d + U(0,8)
const a3Beat = (a, d) => { const x = d - a; return x >= 8 ? 0 : x <= -8 ? 1 : x >= 0 ? (8 - x) * (8 - x) / 128 : 1 - (8 + x) * (8 + x) / 128; };
// a state holds with its size and the general who leads it (李牧 or 项燕 count in full: they are why 赵 and 楚 last)
const a3Def = k => W.realm[k].s / 6 + (a3Gen(k) ? stat(a3Gen(k), 0) : 4);
const a3Atk = (g, k) => stat(g, 0) * .8 + W.a3.guo / 10 + (k === 'chu' ? W.a3.mtd || 0 : 0);
const a3CampP = (k, g) => a3Beat(a3Atk(g, k), a3Def(k));
function a3Battle(k, atk) { const a = atk + Math.random() * 8, b = a3Def(k) + Math.random() * 8; return { win: a > b, dmg: clamp(R(8 + (a - b) * 1.5), 8, 25) }; }
// 秦's own campaign of the year (王翦, 王贲, 内史腾 at the head); the ones whose time has come, the most overdue first
// (in the books' order; the first one still alive, else just 秦军)
const A3_AIG = { han: ['内史腾'], zhao: ['wangjian', 'wangben'], wei: ['wangben', 'wangjian'], chu: ['wangjian', 'mengwu', 'wangben'], yan: ['wangben', 'wangjian', 'lixin'], qi: ['wangben', 'lixin', 'mengwu'] };
const a3GenN = k => { for (const x of A3_AIG[k]) { if (!/^[a-z]/.test(x)) return x; const c = C(x); if (alive(c)) return nm(c); } return '秦军'; };
function a3AiWar(k) {
  const A = W.a3, r = W.realm[k], n = A3_REALM[k].n, gn = a3Gen(k), b = a3Battle(k, 16 + A.guo / 10);
  const g = a3GenN(k);
  if (b.win) { r.s = Math.max(0, r.s - b.dmg); A.guo = Math.max(0, A.guo - 6); a3News(g + '攻' + n + '，' + n + '军退了。'); }
  else { A.guo = Math.max(0, A.guo - 12); r.s = Math.min(100, r.s + 3); a3News((gn ? nm(gn) : n + '人') + '挡住了' + g + '。'); }
  a3ArmyKids(b.win);
  if (r.s <= 0) fallRealm(k, 'ai');
}
// the realm's news of the year: in the log, and the first of it on the screen (the rest waits in 近况)
const a3News = s => { logLine(s, '#c8e0ff', true); if (W.a3.newsN === W.t) return; W.a3.newsN = W.t; toast('天下：' + s, '#c8e0ff'); };
function a3World() {
  const A = W.a3, Rm = W.realm;
  A.guo = Math.min(150, A.guo + 10 + (W.flags.canal ? 5 : 0));
  for (const k of A3_RK) {
    const r = Rm[k]; if (r.fallen !== null) continue;
    if (!(r.friend > W.t)) r.s = Math.max(r.s, Math.min(A3_REALM[k].s, r.s + 2));
    // (history pushes a state that has outlived its year, harder after a year, unless it is bound to 秦 by a pact)
    const late = W.t - A3_REALM[k].fallT;
    if (late > 0 && !(r.friend > W.t)) r.s = Math.max(0, r.s - (late > 4 ? 20 : 10));
  }
  // one army a year, two from 前229 (王翦 and 王贲 on two fronts); none while 秦 itself is spent
  if (A.guo >= 30) {
    const L = A3_RK.filter(k => !rFallen(k) && W.t >= A3_REALM[k].war).sort((a, b) => A3_REALM[a].fallT - A3_REALM[b].fallT);
    for (const k of L.slice(0, W.t >= 132 ? 2 : 1)) if (!rFallen(k)) a3AiWar(k);
  }
  for (const k of A3_RK) if (!rFallen(k) && Rm[k].s <= 0) fallRealm(k, 'ai');
  // three strong states not bound to you: 合纵 (20% a year)
  const big = A3_RK.filter(k => !rFallen(k) && Rm[k].s >= 50 && !(Rm[k].friend > W.t));
  if (realmOn() && big.length >= 3 && W.t >= 104 && chance(.2)) {
    if (a3Lead()) W.queue.push({ ev: 'a3_hezong' });
    else { A.guo = Math.max(0, A.guo - 10); a3News(big.map(k => A3_REALM[k].n).join('、') + '合纵攻秦，在函谷关外退了兵。'); }
  }
}
const A3_FALLN = { han: '置颍川郡', zhao: '邯郸归了秦', wei: '大梁归了秦', chu: '楚地设了郡县', yan: '燕地归了秦', qi: '齐地归了秦' };
// how: 'war' (yours: g led it), 'ai', 'deal' (后胜's), 'yield' (劝降). A state you took counts to your name (灭国之功).
function fallRealm(k, how, g) {
  const r = W.realm && W.realm[k]; if (!r || r.fallen !== null) return;
  r.fallen = W.t; r.s = 0;
  const D = A3_REALM[k], ru = a3Ruler(k), gn = D.gen && C(D.gen), A = W.a3, ruId = alive(ru) ? ru.id : null;
  r.by = how; r.head = W.player;
  const own = how === 'war' || how === 'yield';
  const delta = Math.floor(D.fallT / 4) - Math.floor(W.t / 4);
  chronicle('realm', D.n + '国归秦', (how === 'yield' ? '你劝降了' + D.n + '国。' : own ? '你主持的战事攻下了' + D.n + '国。' : how === 'deal' ? '齐相劝降，齐王交出了国土。' : '秦军攻下了' + D.n + '国。') + (own ? '这份灭国之功记在狸家名下。' : '这次没有记作狸家的灭国之功。') + (delta > 0 ? '比史书记载早了' + delta + '年。' : delta < 0 ? '比史书记载晚了' + (-delta) + '年。' : '与史书记载同年。'));
  // (赵王迁's own line tells 邯郸's fall)
  if (!(k === 'zhao' && alive(C('zhaoqian')))) logLine('秦灭' + D.n + '，' + A3_FALLN[k] + '。', '#ffe08a');
  // the king is taken away (韩王安 waits for the card: he may yet live in 咸阳); the general who held out dies with it
  if (alive(ru)) { if (k === 'han') ru.loc = 'away'; else a3Gone(ru); }
  if (alive(gn)) a3Gone(gn);
  if (how === 'war' || how === 'yield') { A.gong = (A.gong || 0) + 1; A.gongK = (A.gongK || []).concat([k]); addMerit(20, '灭' + D.n); }
  if (how !== 'deal') W.queue.push({ ev: k === 'zhao' ? 'a3_handan' : 'a3_fall', k, how, g: g || null, ru: ruId });
  if (A3_RK.every(rFallen)) a3Unify();
}
function a3Unify() {
  const A = W.a3; if (A.uni) return; A.uni = W.t;
  logLine('六国都没了。天下是秦的了。', '#ffe08a');
  // (a house that had its ending already, 天下未定, only hears the news)
  const kg = king(); if (A.end && alive(kg) && kg.id !== W.player) kg.disp = '始皇帝';
  W.queue.push({ ev: a3Court() ? 'a3_chengdi' : 'a3_end' });
}
// sons and daughters who went with the army (子女出路 · 从军) come back from the next campaign, or don't
function a3ArmyKids(win) {
  for (const c of family()) if (c.flags.army && c.loc === 'away') {
    const x = Math.random(); delete c.flags.army; delete c.flags.path;
    if (x < (win ? .1 : .25)) { c.flags.cause = '在前线中箭身亡'; die(c); continue; }
    c.loc = a3Home(c);
    if (x > (win ? .4 : .8)) { c.st[0] += 2; addPrest(10); logLine(nm(c) + '在军中立了功，回来了 · 名望+10', '#ffe08a'); } else logLine(nm(c) + '从军中回来了', '#f2ead4', true);
  }
}

// ---------------------------------------------------------- what you can do: 出征 离间 结好 劝降 (the 天下 tab), 修渠屯田 (宫)
const A3N = { camp: '出征', jian: '离间', hao: '结好', xiang: '劝降' }, A3K = { camp: 'campaign', jian: 'alienate', hao: 'ally', xiang: 'persuade' };
const a3JianDC = k => 10 + Math.floor(W.realm[k].s / 10) - (W.a3.bribe ? 3 : 0);
const a3XiangDC = k => 10 + Math.floor(W.realm[k].s / 4);
// why kind can't be done now (against k, or at all): '' when it can
function a3No(kind, k) {
  const role = a3Role(), r = k && W.realm[k];
  if (!realmOn()) return '天下已定';
  if (role === 'out') return '人不在秦国';
  if (role === 'low') return '客卿以上才能议天下事';
  if (kind === 'camp' && role === 'ke') return '相邦以上才能领兵';
  if (k && r.fallen !== null) return A3_REALM[k].n + '已经灭了';
  if (kind === 'camp' && W.cool.camp) return '兵马未歇，再等 ' + W.cool.camp + ' 季';
  if (kind === 'camp' && W.a3.guo < 30) return '国力不足 30';
  if (kind === 'camp' && k && W.t < A3_REALM[k].open) return '要到前' + yearOf(A3_REALM[k].open) + '年才打得到';
  if (kind === 'jian' && W.cool.rjian) return '刚派过人，再等 ' + W.cool.rjian + ' 季';
  if (kind === 'jian' && W.fish < 150) return '鱼干不够 150';
  if (k && W.cool['r' + kind + k]) return '再等 ' + W.cool['r' + kind + k] + ' 季';
  if (kind === 'hao' && k && r.friend > W.t) return '已经结好';
  if (kind === 'xiang' && k && a3Gen(k)) return nm(a3Gen(k)) + '还在，劝不动';
  if (kind === 'xiang' && k && r.s > 20) return '实力 20 以下才能劝';
  return '';
}
// who can lead: 秦's generals in 咸阳, you, and retainers who can fight (武 10+)
function a3Gens() {
  const p = P(), L = Object.values(W.chars).filter(c => alive(c) && c !== p && c.role === 'general' && c.state === '秦' && cityOf(c) === 'xianyang' && ageOf(c) >= 16);
  for (const id of W.ret) { const c = C(id); if (alive(c) && ageOf(c) >= 16 && stat(c, 0) >= 10 && !L.includes(c)) L.push(c); }
  return (ageOf(p) >= 16 ? [p] : []).concat(L);
}
const a3Best = k => a3Gens().reduce((b, g) => !b || a3CampP(k, g) > a3CampP(k, b) ? g : b, null);
function a3Odds(kind, k) {
  const r = W.realm[k], gn = a3Gen(k);
  if (kind === 'camp') { const g = a3Best(k); return g ? nm(g) + '领兵 · 胜算 ' + R(a3CampP(k, g) * 100) + '%' : '没有人能领兵'; }
  if (kind === 'jian') return k === 'zhao' && gn && gn.id === 'limu' && alive(C('guokai')) ? '走郭开的门路 · 除掉李牧' : chkHint(3, a3JianDC(k)) + (gn ? ' · 除掉' + nm(gn) : ' · 实力-8');
  if (kind === 'hao') return chkHint(2, 10) + ' · 四年不长兵、不合纵';
  return chkHint(2, a3XiangDC(k)) + ' · 实力 ' + r.s + ' · 不战而降';
}
const a3Live = () => A3_RK.filter(k => !rFallen(k));
// the weakest state still standing (that your armies can reach, when open)
const a3Weak = open => a3Live().filter(k => !open || W.t >= A3_REALM[k].open).sort((a, b) => W.realm[a].s - W.realm[b].s)[0];
function a3Act(kind) {
  const w = a3Weak(kind === 'camp'), L = a3Live().filter(k => !a3No(kind, k));
  const hint = { camp: w ? '最弱：' + A3_REALM[w].n + ' ' + W.realm[w].s + ' · 国力-6' : '', jian: '除掉守将，或实力-8', hao: '四年不长兵、不合纵', xiang: '实力 20 以下、无守将的国' }[kind];
  const hc = kind === 'hao' ? a3Live().filter(k => !(W.realm[k].friend > W.t)).map(k => W.cool['rhao' + k] || 0) : [];
  const none = { camp: '眼下没有打得到的国', jian: '', hao: hc.length ? '再等 ' + Math.min(...hc) + ' 季' : '都结好了', xiang: '没有一国劝得动' }[kind];
  return mkAct({ id: 'r_' + kind, kind: A3K[kind], n: A3N[kind], ap: 1, fish: kind === 'jian' ? 150 : 0, hint,
    no: () => a3No(kind) || (L.length ? '' : none || '现在做不了'), fn: () => a3PickState(kind) });
}
function a3PickState(kind) {
  pickOpt(A3N[kind] + '哪一国？ ◆1', a3Live().map(k => { const why = a3No(kind, k); return { n: A3_REALM[k].n + ' · 实力 ' + W.realm[k].s, s: why || a3Odds(kind, k), style: why ? 'off' : 'jade', fn: () => a3Do(kind, k) }; }));
}
function a3Menu(k) {
  const r = W.realm[k]; if (!r || r.fallen !== null) return;
  pickOpt(A3_REALM[k].n + ' · 实力 ' + r.s, ['camp', 'jian', 'hao', 'xiang'].map(kind => { const why = a3No(kind, k); return { n: A3N[kind] + (kind === 'jian' ? ' · 鱼干150' : '') + ' ◆1', s: why || a3Odds(kind, k), style: why ? 'off' : 'jade', fn: () => a3Do(kind, k) }; }));
}
function a3Do(kind, k) {
  const why = a3No(kind, k) || (W.ap < 1 ? '这季没有精力了' : ''); if (why) { SFX.no(); toast(why, '#ff9a8a'); return; }
  // (the first march on 楚 is the question of how many men it takes: 六十万)
  if (kind === 'camp' && k === 'chu' && !W.a3.ls && a3Lead()) { const e = EV.a3_liushi(); if (e) { if (spendAp(1)) { W.cool.camp = 2; showCard(e); } return; } }
  if (kind === 'camp') pickChar('谁领兵攻' + A3_REALM[k].n + '？ ◆1', a3Gens(), g => a3Camp(k, g), g => { const v = a3CampP(k, g); return { txt: '胜算' + R(v * 100) + '%', col: v >= .6 ? '#276a32' : v >= .35 ? '#5f5236' : '#a0301f', v }; });
  else ({ jian: a3Jian, hao: a3Hao, xiang: a3Xiang })[kind](k);
}
function a3Camp(k, g) {
  if (a3No('camp', k) || !alive(g) || !spendAp(1)) return;
  const p = P(), r = W.realm[k], A = W.a3, me = g === p, n = A3_REALM[k].n, b = a3Battle(k, a3Atk(g, k));
  W.cool.camp = 2;
  if (b.win) {
    toast('攻' + n + '，胜 · ' + n + '实力-' + b.dmg + ' · 名望+4 功+6', '#9fe89a'); SFX.happy();
    r.s = Math.max(0, r.s - b.dmg); A.guo = Math.max(0, A.guo - 6); addPrest(4, true); addMerit(6, '出征', true);
    if (!me) addOp(g, p, 8, true); const kg = king(); if (alive(kg) && kg !== p) addOp(kg, p, 3, true);
    // a 仲父 (less so a 相邦) who wins wars is watched by the king he wins them for
    if (W.kingId === 'zheng' && W.a2) W.a2.yi = Math.min(100, W.a2.yi + (W.rank >= 4 ? (me ? 5 : 2) : me ? 2 : 0));
  } else {
    toast('攻' + n + '，败 · 国力-12', '#ff9a8a');
    A.guo = Math.max(0, A.guo - 12); r.s = Math.min(100, r.s + 3);
    if (me) addHealth(p, -10); else addOp(g, p, -5, true);
  }
  if (me) addStress(p, '胆小');
  a3ArmyKids(b.win);
  didAct(me ? 'campaign' : 'campaign2', me ? null : g, 0, b.win);
  if (r.s <= 0) fallRealm(k, 'war', g.id);
}
function a3Jian(k) {
  if (a3No('jian', k) || !spendAp(1)) return;
  const r = W.realm[k], gn = a3Gen(k), n = A3_REALM[k].n; W.cool['rjian' + k] = 8; W.cool.rjian = 2;
  // 李牧 falls to 郭开's tongue, and 郭开 names his own price (the card)
  if (k === 'zhao' && gn && gn.id === 'limu' && alive(C('guokai'))) { didAct('alienate', null, 3, true); const e = EV.a3_guokai({ via: 1 }); if (e) showCard(e); return; }
  addFish(-150);
  const ok = chk(3, a3JianDC(k));
  if (ok && gn) { r.noGen = true; logLine(n + '王夺了' + nm(gn) + '的兵权', '#9fe89a'); }
  else if (ok) { r.s = Math.max(0, r.s - 8); toast(n + '的朝中乱了 · 实力-8', '#9fe89a'); }
  else { toast('金子白花了 · 名望-3', '#ff9a8a'); addPrest(-3, true); }
  didAct('alienate', null, 3, ok);
  if (r.s <= 0) fallRealm(k, 'war');
}
function a3Hao(k) {
  if (a3No('hao', k) || !spendAp(1)) return;
  const ok = chk(2, 10), n = A3_REALM[k].n;
  if (ok) { W.realm[k].friend = W.t + 16; logLine('秦与' + n + '结好，四年为期', '#9fe89a'); } else { W.cool['rhao' + k] = 2; toast(n + '王没有答应 · 两季后再去', '#dddddd'); }
  didAct('ally', null, 2, ok);
}
function a3Xiang(k) {
  if (a3No('xiang', k) || !spendAp(1)) return;
  const ok = chk(2, a3XiangDC(k)), n = A3_REALM[k].n;
  if (ok) { addPrest(10, true); fallRealm(k, 'yield'); } else { W.cool['rxiang' + k] = 8; toast(n + '还想再守一守', '#dddddd'); }
  didAct('persuade', null, 2, ok);
}
const a3Tuntian = () => mkAct({ id: 'tuntian', kind: 'tuntian', n: '修渠屯田', ap: 1, hint: chkHint(1, 10) + ' · 国力+15',
  no: () => W.cool.tuntian ? '再等 ' + W.cool.tuntian + ' 季' : W.a3.guo >= 150 ? '国力已满' : '',
  fn: () => { if (!spendAp(1)) return; W.cool.tuntian = 4; const ok = chk(1, 10);
    if (ok) { W.a3.guo = Math.min(150, W.a3.guo + 15); toast('渠修成了 · 国力+15', '#9fe89a'); } else toast('这一季的工白做了', '#dddddd'); didAct('tuntian', null, 1, ok); } });
Object.assign(XP_KIND, { ally: 2, persuade: 2, tuntian: 1 });
// the six states in one list: tap one for what you can do to it
function a3OpenRealm() {
  if (!a3Realm()) return;
  const role = a3Role(), on = a3Court();
  openList('天下 · 秦国力 ' + W.a3.guo, () => A3_RK.map(k => {
    const r = W.realm[k], D = A3_REALM[k];
    if (r.fallen !== null) return { dot: '#8a8288', t: D.n + ' · 已灭', s: '前' + yearOf(r.fallen) + '年', col: '#6a6268' };
    const ru = a3Ruler(k), gn = a3Gen(k);
    const s = [ru ? nm(ru) : '', gn ? '守将' + nm(gn) : '', r.friend > W.t ? '结好到前' + yearOf(r.friend) + '年' : ''].filter(Boolean).join(' · ');
    return { por: ru || null, dot: '#e8b040', t: D.n + ' · 实力 ' + r.s, s, right: r.s <= 20 && !gn ? '可劝降' : '', col: '#a0301f',
      fn: on ? () => a3Menu(k) : () => toast(role === 'low' ? '客卿以上才能议天下事' : '人不在秦国，只能看着', '#dddddd') };
  }), { sub: on ? '点一国：出征 · 离间 · 结好 · 劝降' : role === 'low' ? '客卿以上才能议天下事' : '人不在秦国，只能看着' });
}

// ---------------------------------------------------------- the 天下 widget (top right, act three)
function a3Widget() {
  if (!W.a3 || W.act < 3 || !W.flags.act1Done || !a3Realm() || W.a3.uni) return false;
  const Rm = W.realm;
  rect(118, 20, 59, 43, 'rgba(22,18,26,.75)');
  txt('天下', 121, 25, 5.5, '#f2ead4', 'left', null); txt('秦 ' + W.a3.guo, 174, 25, 5.5, '#ff9a80', 'right', null);
  A3_RK.forEach((k, i) => {
    const x = 119 + (i % 3) * 19, y = 30 + Math.floor(i / 3) * 14, r = Rm[k];
    if (r.fallen !== null) { txt(A3_REALM[k].n, x + 1, y + 3.5, 5.5, '#6a6268', 'left', null); rect(x + 1, y + 3, 7, 1, '#8a8288'); txt('灭', x + 17, y + 3.5, 5.5, '#6a6268', 'right', null); return; }
    const weak = r.s <= 20;
    txt(A3_REALM[k].n, x + 1, y + 3.5, 5.5, r.friend > W.t ? '#9fe89a' : '#f2ead4', 'left', null);
    txt(r.s, x + 17, y + 3.5, 5.5, weak ? '#ff9a8a' : '#ffe08a', 'right', null);
    rect(x + 1, y + 8, 16, 2, '#3a3040'); rect(x + 1, y + 8, R(16 * clamp(r.s, 0, 100) / 100), 2, weak ? '#e0604a' : '#e8b040');
  });
  const role = a3Role();
  txt(role === 'out' ? '只能看着' : '已灭 ' + a3Fell() + '/6', 147, 58.5, 5.5, '#c8e0ff', 'center', null);
  hit(118, 20, 59, 43, () => { if (W.loc === 'travel') a3OpenRealm(); else { W.loc = 'travel'; PEOPLE_SCR.key = ''; } });
  return true;
}
// the 行 tab becomes 天下 while the six states stand (its icon stays)
Object.defineProperty(TABS.travel, 'n', { get: () => realmOn() ? '天下' : '行', enumerable: true, configurable: true });
{ const a0 = areaName; areaName = tab => tab === 'travel' && realmOn() ? '天下' : a0(tab); }

// ---------------------------------------------------------- the story's cards (act three)
const a3Who = (...cs) => cs.filter(c => c && C(c.id)).map(c => c.id).slice(0, 4);
// resigning office (moving away, fleeing): 相邦 and 仲父 stay in 咸阳
function a3Resign() {
  const A2 = W.a2; if (A2 && A2.xiang === 'you') A2.xiang = null; if (A2 && A2.zhongfu === 'you') A2.zhongfu = null;
  if (W.rank >= 3 && W.rank <= 4) { W.rank = 2; PORT.clear(); MINI.clear(); }
}
// sent away by the king (ban): 咸阳 stays closed to the house while that king lives (not when you went of your own will)
function a3Ban() { if (W.a3 && W.kingId && W.kingId !== W.player && alive(king())) W.a3.banBy = W.kingId; }
function a3Banned() { return !!(W.a3 && W.a3.banBy && W.kingId === W.a3.banBy && alive(king())); }
function a3Exile(ban) {
  a3Resign(); goCity('henan'); W.a3.henan = true; W.a3.exileBy = W.player; if (ban === true) a3Ban();
  if (W.act === 2 && W.a2) W.a2.end = 'E4';
  logLine('狸家连夜搬去了河南', '#ff9a8a');
}
EV.a3_mianxiang = () => {
  const lv = C('lv'), p = P(), A = W.a3; if (!A || A.mx || W.act < 3 || !alive(lv) || !W.flags.allied || !inQin() || king() === p) return null; A.mx = 1;
  return { title: '免相', who: [lv.id], text: '吕不韦临走前派人来问你：一起走吗？',
    opts: [opt('「随他去河南。」', '离开秦廷 · 吕不韦+20', () => { addMemo(lv, p, '同进退', 20); a3Exile(); }),
      opt('「与他划清。」', '吕不韦成宿敌' + (alive(king()) ? ' · ' + nm(king()) + '+10' : ''), () => { rivalOf(lv, p); if (alive(king())) addOp(king(), p, 10); })] };
};
EV.a3_zhuke = () => {
  const A = W.a3, p = P(), kg = king(); if (!A || A.zhuke || W.act < 2 || !inQin() || !alive(kg) || !alive(p)) return null; A.zhuke = W.t;
  if (W.rank < 2) return null;
  const ls = C('lisi'), mine = W.ret.includes('lisi') && alive(ls), spy = W.secrets.some(s => s.type === 'spy' && s.exposed) || !!(W.a2 && W.a2.zhuke);
  const why = spy ? '韩国水工郑国是奸细的事传开了。' : '有人说外国来的客卿都是各国的奸细。';
  if (kg === p) return { title: '逐客令', who: a3Who(ls), text: why + '宗室上书，请你把外国来的客卿全赶出去。',
    opts: [opt('「准。」', '外国门客都得走 · 宗室+15', () => {
        for (const id of W.ret.slice()) { const r = C(id); if (r && r.state !== '秦') { W.ret = W.ret.filter(x => x !== id); r.loc = localLoc('tavern'); if (r.house === 'ret') r.house = null; } }
        const zg = LEAD.zong.cat(); if (zg && zg !== p) addOp(zg, p, 15); }),
      opt('「不准。」', '名望+10' + (alive(ls) ? ' · 李斯+20' : ''), () => { addPrest(10); if (alive(ls)) addOp(ls, p, 20); })] };
  const st = stat(p, 2) >= stat(p, 1) ? 2 : 1;
  return { title: '逐客令', who: a3Who(kg, ls), text: why + '宗室上书，要把外国来的客卿全赶出去。名单上有你。',
    opts: [opt('「上书。」', mine ? '你让李斯写 · 名望+20' : chkHint(st, 14) + ' · 成：名望+20', () => {
        if (mine || chk(st, 14)) { addPrest(20); addOp(kg, p, 5); logLine('王上读了你的上书，收回了逐客令', '#9fe89a'); } else { addPrest(-5); logLine('逐客令收回了。王上读的是李斯的那封信', '#c8e0ff'); } }),
      opt('「打点宗室。」', '鱼干-200', () => addFish(-200), () => W.fish >= 200),
      opt('连夜走', '去河南 · 从此不在朝中', () => a3Exile(true))] };
};
EV.a3_weiliao = () => {
  const A = W.a3; if (!A || A.wl || !realmOn() || !a3Court()) return null; A.wl = 1;
  const w = a3Spawn('weiliao', 'xpalace'), p = P(); if (!alive(w)) return null;
  return { title: '尉缭', who: [w.id], text: '大梁人尉缭来咸阳献策：六国的权臣都能买，三十万金就够了。说完，他收拾东西就要走。',
    opts: [opt('「照他说的办。」', '鱼干-200 · 离间从此容易些', () => { addFish(-200); A.bribe = true; }, () => W.fish >= 200),
      opt('「留住他，给他国尉。」', ta(w) + '好感+20 · 入朝', () => addMemo(w, p, '知遇', 20)),
      opt('「由他去。」', '', () => { outOfCourt(w.id); w.loc = 'away'; })] };
};
EV.a3_hanfei = () => {
  const A = W.a3; if (!A || A.hf || !realmOn() || !a3Court()) return null; A.hf = 1;
  const h = a3Spawn('hanfei', 'xtavern'), ls = a3Spawn('lisi', 'xpalace'), p = P(), kg = king(), me = kg === p; if (!alive(h) || !alive(kg)) return null;
  const fell = rFallen('han'), L = alive(ls) && ls !== p ? ls : null;
  return { title: '同门之毒', who: a3Who(h, L),
    text: (fell ? '韩国亡了，韩非被带到了咸阳。' : '韩王派韩非出使秦国。') + (me ? '你读过他的书。' : nm(kg) + '读过他的书，说能见这个人一面，死也无憾。') + (L ? '李斯和他同出荀子门下，这几天吃不下饭。' : ''),
    opts: [opt(me ? '「下狱。」' : '「进谗。」', withTip('韩非死在狱中' + (L ? ' · 李斯+20' : '') + ' · 名望-5', '仁厚'), () => {
        a3Gone(h); logLine('韩非死在了云阳的狱中', '#c8e0ff'); if (L) addOp(L, p, 20); addPrest(-5); addStress(p, '仁厚'); }),
      opt(me ? '「留他在身边。」' : '「荐他。」', '韩非入朝' + (L ? ' · 李斯-20' : ''), () => { h.loc = 'xpalace'; addCourtier(h.id, 1); if (!me) addOp(kg, p, 5); if (L) addOp(L, p, -20); }),
      opt('「送他回韩。」', '韩非+20' + (fell ? '' : ' · 与韩结好四年'), () => { addOp(h, p, 20); h.loc = 'xinzheng'; if (!fell) W.realm.han.friend = W.t + 16; })] };
};
// 郭开 takes gold from anyone (on the calendar in 前230, or when you set out to 离间 赵 while 李牧 lives)
EV.a3_guokai = e => {
  const A = W.a3, lm = C('limu'), gk = C('guokai'), p = P(); if (!A || !realmOn() || rFallen('zhao') || !alive(lm) || !alive(gk) || !a3Court() || (A.gk && !(e && e.via))) return null;
  const again = !!A.gk; A.gk = 1;
  return { title: '郭开的金子', who: a3Who(gk, lm), text: again ? '你派去的人在郭开府上等了三天。郭开开了价：一箱金子。' : '赵王的宠臣郭开收钱办事，从不问钱是谁的。赵国能打仗的，只剩一个李牧。',
    opts: [opt('送一箱金子去', '鱼干-150 · 李牧活不过明年', () => { addFish(-150); if (lm.dieT === null || lm.dieT > W.t + 2) { lm.dieT = W.t + 2; lm.immortal = true; } }, () => W.fish >= 150),
      opt('「打仗靠刀。」', '名望+5', () => addPrest(5))] };
};
// 荆轲 (前227): the map unrolls to its end in front of the king — who may be you
EV.a3_jingke = () => {
  const A = W.a3, kg = king(), p = P(); if (!A || A.jk || !realmOn() || rFallen('yan') || !alive(kg) || !alive(p)) return null; A.jk = W.t;
  const post = () => { const j = C('jingke'); if (alive(j)) j.loc = 'away'; const y = W.realm.yan; y.s = Math.max(0, y.s - 20); if (y.s <= 0) fallRealm('yan', 'ai'); };
  if (!a3Court()) { logLine('燕国的荆轲在咸阳宫刺秦王，没有得手。', '#c8e0ff'); post(); return null; }
  const jk = a3Spawn('jingke', 'xpalace'), d = C('dan'), z = C('zheng'); if (!alive(jk)) { post(); return null; }
  const bond = alive(d) && (opinion(d, p) >= 10 || (alive(z) && opinion(d, z) >= 10)), me = kg === p;
  const dan = bond ? opt('「丹，是你吗？」', chkHint(2, 12) + ' · 荆轲会迟疑', () => { if (chk(2, 12)) { toast('荆轲愣了一下，卫兵冲了上来', '#9fe89a'); if (!me) addOp(kg, p, 15); } else addHealth(p, me ? -30 : -10); }) : null;
  // (the box holds 樊於期's head: a face you know, if you know who he was)
  const hy = C('huanyi'), box = '燕国的使者荆轲献上两样东西：一只木匣，一卷督亢的地图。' + (alive(hy) && hy.disp === '樊於期' && W.secrets.some(s => s.type === 'alias' && s.subj === hy.id && knows(s)) ? '匣子里是樊於期的头。那张脸你认得，是桓齮。' : '');
  if (me) return { title: '图穷匕见', who: [jk.id], text: box + '地图在你面前一寸一寸展开，卷到头，露出一把匕首。他一把抓住了你的袖子。', post,
    opts: [opt('绕着柱子跑', withTip(chkHint(0, 10) + ' · 败则健康-30', '胆小'), () => { if (chk(0, 10)) toast('侍医夏无且扔出了药囊', '#9fe89a'); else addHealth(p, -30); addStress(p, '胆小'); }),
      opt('「卫兵上殿！」', '名望-5 · 保得住命', () => addPrest(-5)),
      Object.assign(opt('拔剑', duelHint('比剑', jk, null, '败则健康-30'), () => startDuel('比剑', jk, w => { if (w) addPrest(10); else addHealth(p, -30); }, { why: '胜：名望+10 · 败：健康-30' }), () => stat(p, 0) >= 12), { no: () => '武不到 12，剑拔不出来' }),
      dan].filter(Boolean) };
  const take = powerOf('you') >= 6;
  return { title: '图穷匕见', who: a3Who(jk, kg), text: box + '地图卷到头，露出一把匕首。' + nm(kg) + '的袖子被扯断了，殿上的人都没带兵器。', post,
    opts: [opt('挡在王上前面', duelHint('比剑', jk, null, '胜：救驾'), () => startDuel('比剑', jk, w => { if (w) addMemo(kg, p, '救驾', 40); else addHealth(p, -20); }, { why: '胜：' + nm(kg) + '「救驾」+40 · 败：健康-20' })),
      opt('「王负剑！」', nm(kg) + '+20', () => addOp(kg, p, 20)),
      opt('把药囊扔过去', nm(kg) + '+10', () => addOp(kg, p, 10)),
      Object.assign(opt('……慢了一步', take ? '王座是你的了' : '天下大乱 · 国力-30', a3SlowStep, () => W.rank >= 4, '野心'), { no: () => '要做到仲父' }),
      dan].filter(Boolean) };
};
// you let the knife land: with 势 6 the throne is yours, else 扶苏 takes it and 秦 reels
function a3SlowStep() {
  const kg = king(), p = P(); if (!alive(kg) || kg === p) return;
  const take = powerOf('you') >= 6, n = nm(kg);
  if (take) { W.kingId = W.player; W.rank = 5; W.patron = null; registerPlayerCrown(p); if (W.a2) W.a2.xiang = W.a2.zhongfu = null; }
  else { const f = a3Spawn('fusu', 'xpalace'); if (alive(f) && f !== kg) { W.kingId = f.id; f.role = 'ruler'; f.disp = '秦王扶苏'; } W.a3.guo = Math.max(0, W.a3.guo - 30); }
  a3Gone(kg); PORT.clear(); MINI.clear(); addStress(p, '仁厚');
  logLine(take ? n + '死在了殿上。王座上坐的是你了。' : n + '死在了殿上。扶苏即位，秦国乱了一阵。', take ? '#ffe08a' : '#ff9a8a');
}
EV.a3_dan = () => {
  const A = W.a3; if (!A || A.danH || !realmOn() || rFallen('yan')) return null; A.danH = 1;
  const d = C('dan'), p = P(), z = C('zheng'), bond = alive(d) && alive(z) && opinion(d, z) >= 10 && king() === z;
  const f = () => { if (alive(d)) a3Gone(d); const y = W.realm.yan; y.s = Math.max(0, y.s - 15); if (y.s <= 0) fallRealm('yan', 'ai'); };
  if (!a3Court() || !alive(d)) { if (alive(d)) logLine('燕王喜杀了太子丹，把头送到秦军求和。', '#c8e0ff'); f(); return null; }
  return { title: '太子丹', who: a3Who(d), text: '王翦打进了蓟城。燕王喜逃到辽东，杀了太子丹，把头装在匣子里送到秦军求和。', post: f,
    opts: [opt('「收下。」', bond ? '王上小时候和他在邯郸一起玩过' : '', () => { if (bond) addStress(p, 10, '故人'); })] };
};
EV.a3_liushi = () => {
  const A = W.a3, p = P(), wj = C('wangjian'); if (!A || A.ls || !realmOn() || rFallen('chu') || !a3Lead() || !alive(wj)) return null; A.ls = 1;
  const lx = a3Spawn('lixin', 'camp'), chu = W.realm.chu, hit = (n, g) => { chu.s = Math.max(0, chu.s - n); if (chu.s <= 0) fallRealm('chu', 'war', g); };
  return { title: '六十万', who: a3Who(wj, lx), text: '灭楚要多少人？王翦说六十万，李信说二十万就够。' + (king() === p ? '两个人都看着你。' : '王上问你怎么看。'),
    opts: [opt('「用王翦。」', '国力-30 · 楚-40', () => { A.guo = Math.max(0, A.guo - 30); hit(40, wj.id); W.queue.push({ ev: 'a3_meitian' }); }),
      opt('「用李信。」', '一半能成 · 败则国力-30', () => {
        if (chance(.5)) { hit(40, lx && lx.id); addPrest(5); toast('李信打下了平舆', '#9fe89a'); }
        else { A.guo = Math.max(0, A.guo - 30); wj.loc = 'away'; A.pin = W.t + 4; logLine('李信被项燕打得大败。王翦称病，回了频阳老家', '#ff9a8a'); } }),
      opt('「我自己带六十万。」', withTip(chkHint(0, 13) + ' · 成：楚-50', '胆小'), () => {
        if (chk(0, 13)) { hit(50, W.player); addPrest(20); toast('你打到了寿春城下', '#9fe89a'); } else { A.guo = Math.max(0, A.guo - 30); addHealth(p, -15); toast('你被项燕打退了', '#ff9a8a'); } addStress(p, '胆小'); })] };
};
EV.a3_meitian = () => {
  const A = W.a3, wj = C('wangjian'), p = P(); if (!A || A.mt || !realmOn() || !alive(wj) || rFallen('chu')) return null; A.mt = 1;
  return { title: '美田宅', who: [wj.id], text: '王翦出征前，第五次派人回来讨要良田美宅。旁人都说他贪。',
    opts: [opt('「给他。」', '王翦+20 · 攻楚更稳', () => { addOp(wj, p, 20); A.mtd = 4; }),
      opt('「他在怕什么？」', chkHint(3, 10) + ' · 看透了：王翦+10', () => { if (chk(3, 10)) { addOp(wj, p, 10); logLine('王翦怕的不是穷，是王上起疑', '#c8e0ff'); } else toast('你想不明白', '#dddddd'); }),
      opt('「削他兵权。」', '王翦-30 · 攻楚更难', () => { addOp(wj, p, -30); A.mtd = -6; })] };
};
EV.a3_changping = () => {
  const A = W.a3, cp = C('chengping'), p = P(); if (!A || A.cp || !realmOn() || rFallen('chu') || !alive(cp) || cp.id === W.player) return null; A.cp = 1;
  outOfCourt(cp.id); cp.loc = 'shouchun'; cp.role = 'ruler'; cp.state = '楚'; W.realm.chu.king = cp.id; PORT.clear();
  if (!a3Court()) { logLine('项燕在淮南立昌平君为楚王。', '#c8e0ff'); return null; }
  const chu = W.realm.chu, hit = n => { chu.s = Math.max(0, chu.s - n); if (chu.s <= 0) fallRealm('chu', 'war'); };
  return { title: '昌平君', who: [cp.id], text: '项燕在淮南立昌平君为楚王。这个在咸阳做了几十年官的人，如今站到了对面。',
    opts: [opt('写信劝降', chkHint(2, 13) + ' · 成：楚-20', () => { if (chk(2, 13)) { hit(20); toast('楚军里有人动摇了', '#9fe89a'); } else toast('信被原样退了回来', '#dddddd'); }),
      opt('派人刺杀', withTip(chkHint(3, 13) + ' · 成：楚-15', '仁厚'), () => { if (chk(3, 13)) { cp.flags.ci = true; a3Gone(cp); hit(15); addStress(p, '仁厚'); } else addPrest(-5); }),
      opt('「放他一马。」', '名望+5', () => addPrest(5))] };
};
EV.a3_housheng = () => {
  const A = W.a3; if (!A || A.hs || !realmOn() || rFallen('qi')) return null; A.hs = 1;
  const deal = () => { fallRealm('qi', 'deal'); logLine('齐王建出城投降，被送到了共城。', '#c8e0ff'); };
  if (!a3Court()) { deal(); return null; }
  const hs = a3Spawn('housheng'), qk = a3Ruler('qi');
  return { title: '后胜的金子', who: a3Who(hs, qk), text: '齐相后胜收了秦国的钱，劝齐王不战而降。他只要一样东西：五百里的封地。',
    opts: [opt('「许他五百里。」', '齐国不战而降', deal),
      opt('「打。」', rFallen('yan') ? a3GenN('qi') + '从燕地南下' : '秦军东进', () => { a3AiWar('qi'); if (!rFallen('qi')) toast('齐国还在守', '#dddddd'); })] };
};
EV.a3_hezong = () => {
  const A = W.a3, p = P(); if (!A || !realmOn() || !a3Lead()) return null;
  const big = A3_RK.filter(k => !rFallen(k) && W.realm[k].s >= 50); if (big.length < 3) return null;
  return { title: '合纵', who: [], text: big.map(k => A3_REALM[k].n).join('、') + '又合纵了，兵马聚在函谷关外。',
    opts: [opt('「出兵迎击。」', withTip(chkHint(0, 12) + ' · 败则国力-15', '胆小'), () => {
        if (chk(0, 12)) { for (const k of big) W.realm[k].s = Math.max(1, W.realm[k].s - 8); addPrest(10); toast('联军败了 · 各国实力-8', '#9fe89a'); } else A.guo = Math.max(0, A.guo - 15); addStress(p, '胆小'); }),
      opt('「遣使拆散。」', chkHint(2, 12) + ' · 败则国力-10', () => { if (chk(2, 12)) toast('联军散了', '#9fe89a'); else A.guo = Math.max(0, A.guo - 10); }),
      opt('「割地。」', '国力-25 · 名望-10', () => { A.guo = Math.max(0, A.guo - 25); addPrest(-10); })] };
};
// 君何功于秦: the letter to an exile in 河南, or to a 仲父 the king fears (忌惮 80)
const a3JunheDue = () => { const A2 = W.a2, z = C('zheng'); if (!A2 || A2.blood || (z && z.mom === W.player)) return false;
  return (W.city === 'henan' && W.t <= 124 && W.rank >= 2 && W.player === W.a3.exileBy) || (inQin() && W.rank === 4 && W.kingId !== W.player && A2.yi >= 80); };
const a3RiseP = () => clamp(.35 + .08 * (powerOf('you') - powerOf('wang')) + .015 * stat(P(), 3) + (courtSeats().some(x => x.bing && x.lean === 'you') ? .1 : 0), .05, .9);
EV.a3_junhe = () => {
  const A = W.a3, p = P(), kg = king(); if (!A || A.junhe || W.act < 3 || !alive(p) || !alive(kg) || kg === p || !a3JunheDue()) return null; A.junhe = W.t;
  const zf = W.a2.zfBy === W.player;
  return { title: '君何功于秦', who: [kg.id], text: '王上来信：「君何功于秦？' + (W.a2.fief ? '秦封君河南，食十万户。' : '') + (zf ? '君何亲于秦？号称仲父。' : '') + '」信的末尾，让你全家迁往蜀地。',
    opts: [opt('饮鸩', '你死 · 狸家保全', () => { logLine('你喝下了那杯酒。狸家保住了', '#ff9a8a'); p.flags.cause = '饮鸩而死'; die(p); }),
      opt('「迁蜀。」', '全家去蜀地', () => { a3Ban(); a3Resign(); goCity('shu'); A.shu = true; logLine('狸家搬去了蜀地', '#ff9a8a'); }),
      // (arms are decided by who holds the court and the generals, with a little for cunning — not by cunning alone)
      Object.assign(opt('起兵', '你势' + powerOf('you') + ' 王' + powerOf('wang') + ' · 成 ' + R(a3RiseP() * 100) + '% · 败则身死', () => {
        if (!chance(a3RiseP())) { a2Doom('起兵不成，兵败身死'); return; }
        const back = () => { if (W.a2) W.a2.yi = 40; addOp(kg, p, -20); logLine('王上收回了那封信', '#9fe89a'); };
        // with the court well in hand the palace gates stand open: stop here, or go in
        if (powerOf('you') >= powerOf('wang') + 2) showCard({ title: '宫门', who: [kg.id], text: '你的人围住了咸阳宫。宫门开着，里面没有人出来。',
          opts: [opt('「进宫。」', '你做秦王 · ' + nm(kg) + '从此没了消息', () => seizeThrone()), opt('「收兵。王上收回那封信就好。」', '仍做' + RANKS[W.rank] + ' · 忌惮降到 40', back)] });
        else back(); }, () => powerOf('you') >= 6), { no: () => '势不到 6，起不了兵' })] };
};
// you take the throne from whoever sits on it (E3); the story cards that needed him step aside on their own
function seizeThrone() {
  const k = king();
  a2Crown();
  if (alive(k) && k !== P()) { k.dieT = null; k.immortal = false; die(k, true); }
  W.kingId = W.player; if (W.a3) W.a3.junhe = W.a3.junhe || W.t;
}
// 废立: a standing way to the throne for a 相邦 or 仲父 who holds the court and a general (大计)
const coupWhy = () => { const y = powerOf('you'), w = powerOf('wang'); return ageOf(P()) < 16 ? '你还没成年' : y <= w ? '势要压过王方（你' + y + ' 王' + w + '）' : !courtSeats().some(x => x.bing && x.lean === 'you') ? '要有一位将军倾向你' : ''; };
DECISIONS.push({ id: 'coup', show: () => W.act >= 2 && W.t >= 61 && inQin() && W.rank >= 3 && W.rank <= 4 && alive(king()) && king() !== P(), ico: () => ICON.seal,
  t: '废立', s: () => coupWhy() || '你势' + powerOf('you') + ' 王' + powerOf('wang') + ' · 成 ' + R(a3RiseP() * 100) + '% · 你做秦王', close: true,
  act: () => mkAct({ id: 'd_coup', n: '办', ap: 0, danger: '败则身死 · 成 ' + R(a3RiseP() * 100) + '%', no: coupWhy,
    fn: () => { if (coupWhy()) return; if (chance(a3RiseP())) seizeThrone(); else a2Doom('废立不成，死在宫门外'); } }) });
// the fall of a state, as its card tells it (赵's is 邯郸旧怨)
EV.a3_fall = e => {
  const k = e && e.k, A = W.a3; if (!A || !A3_REALM[k] || !rFallen(k) || !a3Court()) return null;
  // who took it (your general, you, else 秦's own), and whether the king opened his gates (劝降)
  const yl = e.how === 'yield', gc = e.g && C(e.g), gn = gc ? (gc.id === W.player ? '你' : nm(gc)) : a3GenN(k), rn = e.ru && C(e.ru) ? nm(C(e.ru)) : A3_REALM[k].n + '王';
  if (k === 'han') {
    const h = C('hanan');
    return { title: '灭韩', who: a3Who(h), text: yl ? rn + '开了城门，捧着玺出来投降。韩地成了秦的颍川郡。' : '秦军进了新郑。' + rn + '出城投降，韩地成了秦的颍川郡。',
      opts: alive(h) ? [opt('「迁他到咸阳。」', '他在咸阳住下', () => { h.loc = 'xmarket'; h.role = 'noble'; }), opt('「让他留在新郑。」', '新郑人会念着他', () => { h.loc = 'xinzheng'; A.xz = W.t + 16; })] : [opt('知道了', '', () => {})] };
  }
  const T = (yl ? { wei: rn + '开了城门，捧着玺出来投降。大梁没有淹。', chu: rn + '出城投降。楚地从此设了郡县。', yan: rn + '派人送来降表。燕国没了。', qi: rn + '出城投降，被送到了共城。' }
    : { wei: (gn === '王贲' ? '王贲引河水灌大梁，泡了三个月，城墙塌了。' : gn + '攻破了大梁。') + rn + '出城投降。',
      chu: gn + '攻进寿春，' + rn + '被俘。' + (alive(C('xiangyan')) ? '项燕兵败，自杀了。' : '') + '楚地从此设了郡县。',
      yan: gn + '打到辽东，俘了' + rn + '。燕国的宗庙，一把火烧了。',
      qi: gn + (rFallen('yan') ? '从燕地南下' : '东进') + '，齐国没有一兵一卒出来迎战。' + rn + '被送到了共城。' })[k];
  if (!T) return null;
  const TT = ['灭' + A3_REALM[k].n, T];
  const O = [opt('知道了', '', () => {})];
  if (k === 'wei' && !yl && gn === '王贲') O.push(opt('「收殓城里淹死的人。」', '鱼干-40 · 名望+5', () => { addFish(-40); addPrest(5); }, () => W.fish >= 40));
  if (k === 'chu') O.push(opt('「给项燕立一座衣冠冢。」', '名望+3', () => addPrest(3)));
  return { title: TT[0], who: [], text: TT[1], opts: O };
};
// 邯郸 falls: the king goes there to settle old scores (the ones who wronged 政 and his mother; or yours)
EV.a3_handan = () => {
  const A = W.a3; if (!A || !rFallen('zhao') || A.hd) return null;
  const p = P(), kg = king(), z = C('zheng'), hd = W.city === 'handan';
  if (!alive(p) || (!a3Court() && !hd)) return null; A.hd = 1;
  const listed = !!W.flags.betray || (alive(z) && kg === z && (memoOf(z, p, '邯郸之仇') < 0 || isRival(z, p)));
  const foes = rivalsOf(p).filter(c => cityOf(c) === 'handan' && c.house !== 'li' && c.house !== 'in' && c.id !== W.player);
  const purge = () => { for (const c of foes) { logLine(nm(c) + '从此没了消息', '#dddddd'); a3Gone(c); } };
  if (listed && alive(kg) && kg !== p) return { title: '邯郸旧怨', who: [kg.id], text: '邯郸破了。' + nm(kg) + '亲自去了一趟，要找当年欺负过他们母子的人家。名单上有狸家。',
    opts: [opt('连夜逃走', (inQin() ? '逃去蜀地 · ' : '') + '鱼干减半 · 名望-10', () => { W.fish = Math.floor(W.fish / 2); addPrest(-10); if (inQin()) { a3Ban(); a3Resign(); goCity('shu'); A.shu = true; } logLine('狸家连夜逃走了', '#ff9a8a'); }),
      opt('「去求王上。」', opinion(kg, p) >= 0 ? ta(kg) + '还念一点旧情' : '凶多吉少', () => {
        if (opinion(kg, p) >= 0) logLine(nm(kg) + '把狸家从名单上划掉了', '#9fe89a'); else { p.flags.cause = '被秦兵带走，再没回来'; die(p); } })] };
  if (!a3Court()) return { title: '邯郸破城', who: [], text: '秦军进了邯郸。秦王亲自来了一趟，城里有几户人家，从此没了消息。',
    opts: [opt('关上铺门', '', () => {}), opt('开门做秦兵的生意', '鱼干+60 · 名望-5', () => { addFish(60); addPrest(-5); })] };
  if (kg === p) return { title: '邯郸旧怨', who: a3Who(...foes.slice(0, 3)), text: '邯郸破了。当年在邯郸和狸家作对的人家，都还住在原处。',
    opts: [foes.length ? opt('「列名单。」', withTip('仇家没了消息 · 名望-10', '仁厚'), () => { purge(); addPrest(-10); addStress(p, '仁厚'); }) : null, opt('「算了。」', '名望+5', () => addPrest(5))].filter(Boolean) };
  const mom = alive(kg) && kg.id === 'zheng';
  return { title: '邯郸旧怨', who: a3Who(kg), text: '邯郸破了。' + (mom ? nm(kg) + '亲自去了一趟，要找当年欺负过他们母子的人家。' : '秦王亲自去了一趟，城里有几户人家从此没了消息。'),
    opts: [mom ? opt('「列名单。」', nm(kg) + '+10 · 名望-10', () => { addOp(kg, p, 10); addPrest(-10); addStress(p, '仁厚'); }, null, '狠辣') : null,
      mom ? opt('「劝王上宽恕。」', nm(kg) + '-10 · 名望+10', () => { addOp(kg, p, -10); addPrest(10); }, null, '仁厚') : null,
      foes.length ? opt('「顺手把我的仇人也写上。」', withTip(chkHint(3, 11) + ' · 败则王上-10', '仁厚'), () => { if (chk(3, 11)) { purge(); addStress(p, '仁厚'); } else if (alive(kg)) addOp(kg, p, -10); }) : null,
      alive(kg) ? opt('「臣陪王上去。」', nm(kg) + '+5', () => addOp(kg, p, 5)) : null, opt('不说话', '', () => {})].filter(Boolean) };
};
EV.a3_chengdi = () => {
  const A = W.a3, p = P(), kg = king(); if (!A || !A.uni || A.cd || !alive(p)) return null; A.cd = 1;
  const post = () => { if (!W.queue.some(q => q.ev === 'a3_end')) W.queue.unshift({ ev: 'a3_end' }); };
  const T0 = '六国都没了。群臣在咸阳宫议名号。李斯说古有天皇、地皇、泰皇，泰皇最贵。';
  if (kg === p) return { title: '称帝', who: [p.id], text: T0 + '他们都在等你开口。', post,
    opts: [opt('「称皇帝。」', '身份：皇帝 · 名望+30', () => { W.rank = 6; addPrest(30); PORT.clear(); MINI.clear(); logLine('你称了皇帝', '#ffe08a'); }), opt('「王就够了。」', '名望+10', () => addPrest(10))] };
  if (!alive(kg) || !a3Court()) { post(); return null; }
  return { title: '称帝', who: [kg.id], text: T0 + nm(kg) + '问你的意思。', post,
    opts: [opt('「皇帝。」', nm(kg) + '+10', () => addOp(kg, p, 10)), opt('「泰皇。」', '', () => toast('王上想了想，还是叫了皇帝', '#dddddd'))] };
};
// the endings: a card, a line of numbers, and the house goes on
const A3_END = {
  emperor: ['始皇帝', '六国都没了。从函谷关到东海，天下都是你的。'],
  wang: ['秦王', '六国都没了。你没有称帝，天下还是你的。'],
  blood: ['狸血天子', '天下一统了。坐在咸阳宫里的皇帝，身上流着狸家的血。'],
  waiqi: ['外戚', '天下一统了。皇帝的母亲是狸家的女儿，他记着这门亲。'],
  sheren: ['舍人', '天下一统了。你在咸阳做一个舍人，朝上的事，离狸家还远。'],
  zaiye: ['在野', '天下一统了。你不在秦廷。'],
  xiang: ['丞相', '天下一统了。你站在群臣的最前面，替皇帝管着天下的郡县。'],
  zhongfu: ['仲父', '天下一统了。皇帝还叫你仲父，只是叫得越来越少了。'],
  ke: ['客卿', '天下一统了。你在咸阳有一座宅子，一个客卿的名分。'],
  buyi: ['布衣', '天下一统了。'],
  weiding: ['天下未定', '到了前217年，函谷关外还有'],
};
function a3EndKey() {
  const role = a3Role();
  if (!W.a3.uni) return 'weiding';
  if (role === 'king') return W.rank >= 6 ? 'emperor' : 'wang';
  if (W.a2 && W.a2.blood && W.kingId === 'zheng' && alive(C('zheng'))) return W.a2.blood === 'mom' ? 'waiqi' : 'blood';
  return role === 'lead' ? (W.rank >= 4 ? 'zhongfu' : 'xiang') : role === 'ke' ? 'ke' : role === 'low' ? 'sheren' : W.rank === 0 ? 'buyi' : 'zaiye';
}
const CNN = '零一两三四五六';
// the ending in words: its text, the conquests that were yours (two or more: a 列侯 and a fief), the year
function a3EndTxt(k) {
  const A = W.a3, [, s] = A3_END[k], role = a3Role(), n = A.gong || 0, hou = n >= 2 && role !== 'king';
  let t = s + (k === 'buyi' ? CITY[W.city].n + '狸家的铺子照常开门。' : '') + (k === 'weiding' ? CNN[Math.max(1, a3Live().length)] + '国在撑着。天下还没有定。' : '');
  if (k === 'blood' && W.a2.bloodBy === W.player) t += '这件事，只有你们两个知道。';
  if (n) t += '你亲手灭了' + CNN[n] + '国' + (hou ? '，封了列侯。' : '。');
  return t;
}
EV.a3_end = e => {
  const A = W.a3, p = P(); if (!A || !alive(p) || A.end || W.act < 3 || !W.realm) return null;
  if (!A.uni && !(e && e.k === 'weiding')) return null;
  const k = a3EndKey(), kg = king(); A.end = k;
  if (A.uni && alive(kg) && kg !== p) kg.disp = '始皇帝';
  // a house that took two states or more is made a 列侯, with a fief
  if ((A.gong || 0) >= 2 && a3Role() !== 'king' && W.a2 && !W.a2.fief) { W.a2.fief = true; logLine('你封了列侯，每季多 20 鱼干', '#ffe08a'); }
  const [t] = A3_END[k], title = '第三幕 · ' + t;
  return { title, who: [p.id].concat(alive(kg) && kg !== p ? [kg.id] : []), big: true,
    text: a3EndTxt(k) + `\n身份：${RANKS[W.rank]}` + (A.uni ? ` · 前${yearOf(A.uni)}年一统` : '') + `\n狸家 ${family().length} 口 · 鱼干 ${W.fish} · 名望 ${W.prest}`,
    opts: [opt('「继续经营狸家。」', '尾声 · 天下事照旧，狸家的日子接着过', () => { W.act = 4; }),
      Object.assign(opt('分享战绩', '存一张战绩图', () => { W.act = 4; makeShare(t); }), { look: 'blue' })] };
};
// 前206: the 尾声 is over; the house goes on (the same share card)
EV.a4_end = () => {
  const p = P(), A = W.a3; if (!a4On() || A.a4e || !alive(p)) return null; A.a4e = 1;
  return { title: '尾声', who: [p.id], big: true, text: (A.ljCalm ? '天下还是秦的。狸家还在。' : '秦亡了，朝廷也没了。狸家还在。') + `\n身份：${RANKS[W.rank]} · 狸家 ${family().length} 口 · 鱼干 ${W.fish} · 名望 ${W.prest}`,
    opts: [opt('「日子接着过。」', '自由经营', () => {}), Object.assign(opt('分享战绩', '存一张战绩图', () => makeShare('尾声 · 狸家仍在')), { look: 'blue' })] };
};

// ---------------------------------------------------------- the 尾声 (前220–前206): history's calendar, as a house under the empire meets it
const a4On = () => !!W && !!W.a3 && !!W.a3.uni && W.act >= 3;
const a4Emp = () => W.kingId === W.player;
// a grown son at home the state can take (not the head; the unmarried first)
const a4Men = () => household().filter(c => c.house === 'li' && !c.female && c.id !== W.player && ageOf(c) >= 16 && ageOf(c) <= 50 && !a3Lone(c)).sort((a, b) => !!a.sp - !!b.sp || b.born - a.born);
function a4Draft(c, n, k) { if (!alive(c)) return; c.loc = 'fuyi'; c.flags.draft = W.t + n; if (k) c.flags.draftK = k; logLine(nm(c) + '被官府征走了', '#ff9a8a'); }
const a4Pay = n => Object.assign(opt('出钱', '鱼干-' + n, () => addFish(-n), () => W.fish >= n), { no: () => '鱼干不够 ' + n });
const a4Duck = () => opt('托人免了', chkHint(3, 10) + ' · 败则名望-5 鱼干-50', () => { if (!chk(3, 10)) { addPrest(-5); addFish(-50); toast('没免成，还挨了罚', '#ff9a8a'); } });
EV.a4_chidao = () => {
  if (!a4On() || a4Emp()) return null;
  const m = a4Men()[0];
  return { title: '驰道', who: a3Who(m), text: '官府来征人修驰道。狸家要出一个成年男丁，或者交两百鱼干。',
    opts: [Object.assign(opt('出人', m ? nm(m) + '离家八季' : '', () => a4Draft(m, 8), () => !!m), { no: () => '家里没有能去的男丁' }), a4Pay(200), a4Duck()] };
};
EV.a4_xufu = () => {
  if (!a4On()) return null;
  return { title: '徐福', who: [], text: '一个叫徐福的方士说东海里有仙山，要带三千童男童女出海求药。他在城里挨家化缘，要一船鱼干。',
    opts: [Object.assign(opt('资助他', '鱼干-100 · 他一去不回', () => { addFish(-100); addPrest(3); }, () => W.fish >= 100), { no: () => '鱼干不够 100' }), opt('「不信。」', '', () => {})] };
};
EV.a4_bolang = () => {
  if (!a4On()) return null;
  const p = P();
  if (!a4Emp()) { logLine('有人在博浪沙用大铁锤砸皇帝的车，砸错了一辆。', '#c8e0ff'); return null; }
  return { title: '博浪沙', who: [], text: '你东巡走到博浪沙，道旁飞出一个大铁锤，砸碎了前面的一辆车。',
    opts: [opt('伏下', withTip(chkHint(0, 10) + ' · 败则健康-30', '胆小'), () => { if (!chk(0, 10)) addHealth(p, -30); else toast('铁锤没碰到你', '#9fe89a'); }),
      opt('「搜！」', '名望-3 · 一个韩国人跑了', () => addPrest(-3))] };
};
EV.a4_changcheng = () => {
  if (!a4On() || a4Emp()) return null;
  const m = a4Men()[0];
  return { title: '长城', who: a3Who(m), text: '蒙恬北击匈奴，要修长城。官府又来征人了，这回一去要三年。',
    opts: [Object.assign(opt('出人', m ? nm(m) + '离家十二季 · 未必回得来' : '', () => a4Draft(m, 12, 'wall'), () => !!m), { no: () => '家里没有能去的男丁' }), a4Pay(300), a4Duck()] };
};
EV.a4_fenshu = () => {
  if (!a4On()) return null;
  const p = P();
  if (a4Emp()) return { title: '焚书', who: a3Who(C('lisi')), text: '李斯上书，请把秦记以外的史书和百家语都烧了，敢私下谈诗书的，弃市。',
    opts: [opt('「准。」', '名望-5', () => addPrest(-5)), opt('「医药、卜筮、种树的书留下。」', '', () => {})] };
  return { title: '焚书', who: [], text: '郡守来收书。你家有一部《吕氏春秋》，还有几卷诗。',
    opts: [opt('交出去', '', () => {}), opt('藏进夹墙', chkHint(3, 10) + ' · 败则名望-10', () => { if (!chk(3, 10)) { addPrest(-10); W.flags.skipAp = true; toast('书被搜了出来', '#ff9a8a'); } }), opt('烧一半，交一半', '', () => {})] };
};
// 沙丘: the emperor dies on the road; 赵高 and 李斯 rewrite his will (you may send the real one to 扶苏)
EV.a4_shaqiu = () => {
  const z = C('zheng'), p = P(); if (!a4On() || a4Emp() || !z || alive(z) || W.t - z.dead > 1 || W.kingId !== 'huhai' || !a3Court()) return null;
  const hh = C('huhai');
  return { title: '沙丘', who: a3Who(hh, C('lisi')), text: '皇帝死在了沙丘。赵高和李斯要改遗诏：立少子胡亥，赐死长子扶苏。',
    opts: [opt('「照他们说的办。」', '', () => hhKing()),
      opt('把真遗诏送去上郡', chkHint(3, 14) + ' · 成则扶苏即位', () => {
        if (!chk(3, 14)) { addPrest(-10); addHealth(p, -20); toast('送信的人被截住了，你下了狱', '#ff9a8a'); hhKing(); return; }
        const f = a3Spawn('fusu', 'xpalace'); if (!alive(f)) return;
        W.kingId = f.id; f.role = 'ruler'; f.disp = '秦二世扶苏'; W.a3.fusu = true;
        if (alive(hh)) { hh.dieT = null; hh.immortal = false; hh.role = 'noble'; hh.disp = '胡亥'; }
        addMemo(f, p, '遗诏', 40); logLine('扶苏回到咸阳，做了皇帝', '#ffe08a'); }),
      opt('「告病回家。」', '辞官', () => { a3Resign(); hhKing(); })] };
};
const hhKing = () => logLine('胡亥即位，是为秦二世。', '#c8e0ff');
EV.a4_daze = () => {
  if (!a4On() || W.a3.fusu) return null;
  const p = P();
  if (a4Emp()) return { title: '大泽乡', who: [], text: '九百个戍卒误了期，在大泽乡杀了押送的军官，反了。领头的叫陈胜。',
    opts: [opt('「发兵去平。」', withTip(chkHint(0, 11) + ' · 成：名望+10', '胆小'), () => { if (chk(0, 11)) { addPrest(10); toast('陈胜死在了逃亡的路上', '#9fe89a'); } else { addPrest(-10); toast('反的人越来越多了', '#ff9a8a'); } }),
      opt('「派人去招安。」', chkHint(2, 12), () => { if (chk(2, 12)) toast('一半人散了', '#9fe89a'); else addPrest(-5); })] };
  return { title: '大泽乡', who: [], text: '九百个戍卒误了期，在大泽乡杀了押送的军官，反了。领头的叫陈胜，自称陈王。',
    opts: [opt('「守着家。」', '', () => {}), opt('投陈王', '名望+10 · 日后或被清算', () => { addPrest(10); W.a3.chen = W.t; })] };
};
EV.a4_chen = () => {
  const A = W.a3; if (!a4On() || !A.chen || A.chenD || !chance(.5)) return null; A.chenD = 1;
  return { title: '株连', who: [], text: '陈王死了。投过他的人家，一户一户被翻了出来。',
    opts: [opt('花钱消灾', '鱼干少三成', () => addFish(-R(W.fish * .3))), opt('躲出去', '名望-10', () => addPrest(-10))] };
};
// 前206: the next 奇货 (a 亭长 from 沛县), as the story began
EV.a4_liuji = () => {
  const A = W.a3, p = P(); if (!a4On() || A.lj) return null; A.lj = 1;
  // (秦 only falls on history's line, 胡亥 then 子婴: a throne that left it — 扶苏, 嫪毐's, 成峤's, yours — still stands)
  const calm = !!(A.fusu || a4Emp() || !['huhai', 'ziying'].includes(W.kingId)); A.ljCalm = calm;
  const text = calm ? '天下还算太平。沛县有个亭长叫刘季，押送刑徒的路上把人全放了，自己躲进了芒砀山。有人说他头顶上常有云气。'
    : '子婴出城投降了。沛县的亭长刘季先进了咸阳，项羽的四十万兵还在路上。';
  const bet = () => { const l = a3Spawn('liuji', 'xtavern'); if (alive(l)) { addMemo(l, p, '押宝', 30); logLine('你押了刘季。又一件奇货', '#ffe08a'); } };
  return { title: calm ? '芒砀山' : '秦亡', who: [], text, post: () => { if (!W.queue.some(q => q.ev === 'a4_end')) W.queue.push({ ev: 'a4_end' }); },
    opts: [opt('「押他。」', '又一件奇货 · 刘季记着你', bet), calm ? null : opt('「押项羽。」', '名望+5', () => addPrest(5)), opt('「守着狸家。」', '', () => {})].filter(Boolean) };
};
const A3_NEWS = [[124, '韩国南阳的假守腾献了地，做了秦的内史。', () => !rFallen('han')], [220, '赵高牵来一头鹿，说是马。朝上没有人敢说不是。', () => W.kingId === 'huhai']];
const hdHere = () => !!W.flags.act1Done && W.city === 'handan' && alive(P());
EV.hd_lianpo = () => {
  const lp = C('lianpo'), p = P(); if (!hdHere() || !alive(lp)) return null;
  return { title: '廉颇', who: [lp.id], text: '廉颇在朝上受了气，连夜出城，投奔魏国去了。他的老兵在城门口站了一上午。',
    opts: [opt('「送他一程。」', '鱼干-30 · 廉颇+20 · 名望+3', () => { addFish(-30); addOp(lp, p, 20); addPrest(3); }, () => W.fish >= 30), opt('关上铺门', '', () => {})] };
};
EV.hd_guokai = () => {
  const gk = C('guokai'), p = P(); if (!hdHere() || !alive(gk) || (W.realm && rFallen('zhao'))) return null;
  return { title: '郭开', who: [gk.id], text: '赵王的宠臣郭开到你的铺子里挑东西。挑完了，他说记在账上。',
    opts: [opt('「记在账上。」', '鱼干-60 · 郭开+15', () => { addFish(-60); addOp(gk, p, 15); }, () => W.fish >= 60),
      opt('「送给大人了。」', '鱼干-80 · 郭开+30', () => { addFish(-80); addOp(gk, p, 30); }, () => W.fish >= 80),
      opt('「小本生意，概不赊账。」', '郭开-20 · 名望+3', () => { addOp(gk, p, -20); addPrest(3); })] };
};
EV.hd_xianyang = () => {
  const p = P(), kg = king(), A = W.a2, lao = C('laoai'), bits = []; if (!hdHere() || W.act < 3) return null;
  if (A && A.coup === 'lao') bits.push('冠礼那夜，嫪毐赢了。');
  else if (lao && !alive(lao)) bits.push('嫪毐在雍城作乱，伏诛了。');
  if (alive(kg) && kg !== p) bits.push(nm(kg) + (A && A.coup === 'lao' ? '坐上了王座。' : '亲政了。'));
  if ((A && A.lvDown) || !alive(C('lv'))) bits.push('吕不韦免了相，回了河南。');
  if (!bits.length) return null;
  return { title: '咸阳的消息', who: alive(kg) && kg !== p ? [kg.id] : [], text: '咸阳来的商队带来了消息：' + bits.join(''),
    opts: [opt('「秦国的事，离邯郸远。」', '', () => {}),
      alive(kg) && kg !== p ? opt('托商队给咸阳带一份礼', '鱼干-40 · ' + nm(kg) + '+10', () => { addFish(-40); addOp(kg, p, 10); }, () => W.fish >= 40) : null].filter(Boolean) };
};
EV.hd_limu = () => {
  const lm = C('limu'), p = P(); if (!hdHere() || !alive(lm) || (W.realm && rFallen('zhao'))) return null;
  return { title: '肥下', who: [lm.id], text: '李牧在肥下大破秦军，秦将桓齮逃了。邯郸城里的酒肆，三天没关门。',
    opts: [opt('「备酒去劳军。」', '鱼干-50 · 名望+8 · 李牧+10', () => { addFish(-50); addPrest(8); addOp(lm, p, 10); }, () => W.fish >= 50),
      opt('「秦国人不会就此罢手。」', '', () => {})] };
};
const A3_CAL = [[68, 'hd_lianpo'], [76, 'hd_guokai'], [100, 'hd_xianyang'], [116, 'hd_limu'], [101, 'a3_mianxiang'], [101, 'a3_zhuke'], [102, 'a3_weiliao'], [116, 'a3_hanfei'], [128, 'a3_guokai'], [140, 'a3_jingke'], [144, 'a3_dan'], [148, 'a3_liushi'],
  [168, 'a4_chidao'], [172, 'a4_xufu'], [176, 'a4_bolang'], [188, 'a4_changcheng'], [196, 'a4_fenshu'], [210, 'a4_shaqiu'], [214, 'a4_daze'], [216, 'a4_chen'], [224, 'a4_liuji']];
for (const x of A3_CAL.map(r => r[1]).concat(['a3_fall', 'a3_handan', 'a3_chengdi', 'a3_end', 'a3_junhe', 'a3_housheng', 'a3_meitian', 'a3_changping', 'a3_zhaoxian', 'a3_baixiang', 'a4_end'])) STORY_EV.add(x);

// ---------------------------------------------------------- promotions and errands in act three (career's tables)
const a3XiangHeld = () => { const x = W.a2 && W.a2.xiang; return !!x && x !== 'you' && x !== 'lv' && alive(C(x)); };
PROMO.push(
  { to: 2, ev: 'a3_zhaoxian', ok: () => W.rank === 1 && inQin() && W.act >= 3 && alive(king()) && king() !== P(),
    need: () => { const k = king(); return [['功', W.merit || 0, 60], ['望', W.prest, 50], [alive(k) ? nm(k) : '王', alive(k) ? opinion(k, P()) : 0, 20]]; } },
  { to: 3, ev: 'a3_baixiang', ok: () => W.rank === 2 && inQin() && W.act >= 3 && alive(king()) && king() !== P() && !a3XiangHeld(),
    need: () => { const k = king(); return [['功', W.merit || 0, 150], ['望', W.prest, 100], [alive(k) ? nm(k) : '王', alive(k) ? opinion(k, P()) : 0, 50]]; } },
);
EV.a3_zhaoxian = () => {
  const k = king(), p = P(); if (!W.a3 || W.act < 3 || W.rank !== 1 || !inQin() || !alive(k) || k === p) return null;
  const ls = C('lisi'), by = alive(ls) && ls !== p ? ls : null;
  return { title: '客卿', who: a3Who(k, by), text: (by ? nm(by) + '在王上面前提了你：「狸家在秦国这么多年，早就是自己人了。」' : '') + nm(k) + '赐了你冠带，让你做客卿。',
    opts: [opt('「谢王上。」', '身份：客卿 · 能议天下事', () => promote(2, k)), opt('「臣只是个商人。」', '', () => { W.cool.promo = 8; })] };
};
EV.a3_baixiang = () => {
  const k = king(), p = P(); if (!W.a3 || W.act < 3 || W.rank !== 2 || !inQin() || !alive(k) || k === p || a3XiangHeld()) return null;
  return { title: '拜相', who: [k.id], text: nm(k) + '在章台宫召见你：「相邦的位子空着。你来坐。」',
    opts: [opt('「臣领命。」', '身份：相邦 · 可以领兵', () => { W.a2.xiang = 'you'; promote(3, k); }), opt('「臣才疏。」', nm(k) + '+5', () => { addOp(k, p, 5); W.cool.promo = 12; })] };
};
JOBS.push(
  { id: 'a3_zhan', patron: '*', title: '督战', task: '出征一次', tab: 'travel', due: 4, w: .8, goal: { kind: ['campaign', 'campaign2'], any: 1 },
    reward: { merit: 12, prest: 3 }, ok: gv => realmOn() && a3Role() === 'lead' && !!gv && gv.role === 'ruler', line: '「兵马都备好了，就等一个人拿主意。」' },
  { id: 'a3_jian', patron: '*', title: '用间', task: '离间一国', tab: 'travel', due: 4, w: .6, goal: { kind: 'alienate', any: 1 },
    reward: { merit: 10, fish: 60 }, ok: () => realmOn() && a3Court() && W.fish >= 150, line: '「六国的权臣都有价钱。你去问问。」' },
  { id: 'a3_hao', patron: '*', title: '远交', task: '与一国结好', tab: 'travel', due: 4, w: .6, goal: { kind: 'ally', any: 1 },
    reward: { merit: 8, prest: 3 }, ok: () => realmOn() && a3Court() && a3Live().some(k => !a3No('hao', k)), line: '「远处的先稳住，近处的才好打。」' },
);
// a married 狸 at home (not the head nor the heir) who can take a household out
const fenCand = () => { const h = typeof heirNow === 'function' ? heirNow() : heirOf(); return household().filter(c => c.house === 'li' && c.id !== W.player && c !== h && c.sp && ageOf(c) >= 20 && !royalOut(c)).sort((a, b) => b.born - a.born)[0] || null; };
function branchOut(c) {
  const sp = C(c.sp), spot = localLoc('market');
  for (const x of [c, sp].concat(c.kids.map(C))) if (alive(x) && x.loc === 'home' && (x === c || x === sp || (x.house === 'li' && !x.sp))) { x.flags.branch = true; x.loc = spot; }
  logLine(nm(c) + '一家搬出狸宅，另立了门户', '#dddddd'); homeTick();
}
RANDOM.push(
  { id: 'a3_fenjia', w: 3, cd: 16, ok: () => W.act >= 3 && household().filter(c => c.house === 'li').length > 12 && !!fenCand(), b: () => {
    const c = fenCand(); return { title: '分家', who: [c.id], text: '狸宅住不下了。' + who(c) + '说想带着一家人搬出去，自己立个门户。',
      opts: [opt('「好。」', ta(c) + '一家另立门户', () => branchOut(c)), opt('「一家人，挤一挤。」', ta(c) + '好感-5', () => addOp(c, P(), -5))] }; } },
  { id: 'a3_zuren', w: 3, cd: 24, ok: () => W.act >= 2 && !!W.flags.act1Done && family().length <= 2, b: () => {
    const f = chance(.4), c = mkc({ sur: '狸', name: pick(f ? GIV_F : GIV_M), female: f, born: W.t - 4 * (17 + Math.floor(Math.random() * 6)), house: 'li', loc: 'home', role: 'merchant', g: randGenome(Math.random, f ? 'F' : 'M') });
    return { title: '族人', who: [c.id], text: '乡下来了一个远房的族人，叫' + nm(c) + '。家里遭了灾，想投奔狸家。',
      opts: [opt('「住下吧。」', ta(c) + '成了家里人', () => { logLine(nm(c) + '住进了狸宅', '#ffe08a'); homeTick(); }),
        opt('给些路费', '鱼干-20', () => { addFish(-20); delete W.chars[c.id]; })] }; } },
  { id: 'a3_liang', w: 2, cd: 24, ok: () => realmOn() && inQin() && W.fish >= 80, b: () => ({ title: '军粮', who: [], text: '前线催粮。郡守挨家挨户地劝捐，到了你家门口。',
    opts: [opt('「捐一批。」', '鱼干-80 · 名望+5 · 国力+5', () => { addFish(-80); addPrest(5); W.a3.guo = Math.min(150, W.a3.guo + 5); }), opt('「家里也紧。」', '名望-2', () => addPrest(-2))] }) },
  { id: 'a4_tax', w: 2, cd: 16, ok: () => a4On() && W.act >= 4 && !a4Emp(), b: () => { const n = 10 + 5 * household().length;
    return { title: '赋税', who: [], text: pick(['郡里的小吏来收赋税，按人头算，比去年又多了两成。', '郡里的小吏来收口赋。他翻着户籍，一个一个地数。', '修驰道的钱摊到了各家，郡里的小吏挨门来收。']),
      opts: [opt('交', '鱼干-' + n, () => addFish(-n)), opt('少报几口人', chkHint(3, 10) + ' · 败则罚一倍', () => { if (!chk(3, 10)) { addFish(-2 * n); addPrest(-5); toast('被查出来了', '#ff9a8a'); } })] }; } },
  { id: 'a4_dan', w: 2, cd: 32, ok: () => a4On() && W.act >= 4 && W.fish >= 60, b: () => ({ title: '方士', who: [], text: '一个方士登门，说他炼的丹药能让人多活二十年，一粒六十鱼干。',
    opts: [opt('买一粒', '鱼干-60 · 吃了才知道', () => { addFish(-60); const p = P(); if (chance(.5)) { addHealth(p, 10); toast('吃完精神了许多', '#9fe89a'); } else { addHealth(p, -15); toast('吃完吐了一夜', '#ff9a8a'); } }), opt('请他出去', '', () => {})] }) },
);

// ---------------------------------------------------------- free mode: 志向 (ambitions), 子女出路, 迁居
const a3Kids = p => p ? p.kids.map(C).filter(k => alive(k) && k.house === 'li' && (k.dad === p.id || k.mom === p.id)) : [];
const a3Grand = p => a3Kids(p).reduce((t, k) => t + k.kids.filter(id => alive(C(id))).length, 0);
const a3Known = () => W.secrets.filter(s => knows(s)).length;
// t: what to want, tab: where it is done, can(): worth wanting now, base(): the count it starts from, done(a), prog(): n/N
const A3_AMB = {
  wed: { t: '给一个孩子成家', tab: '家', can: () => a3Kids(P()).some(k => ageOf(k) >= 16 && !k.sp && k.loc === 'home'), base: () => a3Kids(P()).filter(k => k.sp).length,
    done: a => a3Kids(P()).filter(k => k.sp).length > a.base, rew: ['名望+5', () => addPrest(5)] },
  ret: { t: '门客满四人', tab: '人', can: () => W.ret.length < 4, done: () => W.ret.length >= 4, prog: () => W.ret.length + '/4', rew: ['名望+5', () => addPrest(5)] },
  hoard: { t: '攒下 500 鱼干', tab: '市', can: () => W.fish < 300, done: () => W.fish >= 500, prog: () => Math.min(W.fish, 500) + '/500', rew: ['家人好感+5', () => { for (const c of household()) addOp(c, P(), 5, true); }] },
  star: { t: '教出一个三星的孩子', tab: '家', keep: () => kinPool().some(c => ageOf(c) >= 10 && ageOf(c) < 16), can: () => kinPool().some(c => ageOf(c) >= 10 && ageOf(c) < 14), done: a => family().some(c => ageOf(c) >= 16 && (c.eduLv || 0) >= 3 && c.born + 64 >= a.t0), rew: ['名望+8', () => addPrest(8)] },
  lang: { t: '送一个孩子入朝', tab: '家', keep: () => alive(king()), can: () => W.act >= 3 && alive(king()) && a3Kids(P()).some(k => ageOf(k) >= 16 && !k.sp && !k.flags.path),
    base: () => a3Kids(P()).filter(k => k.flags.path === 'lang').length, done: a => a3Kids(P()).filter(k => k.flags.path === 'lang').length > a.base, rew: ['名望+8', () => addPrest(8)] },
  secret: { t: '找出一件秘密', tab: '人', can: () => W.secrets.some(s => !s.exposed && !knows(s)), base: a3Known, done: a => a3Known() > a.base, rew: ['心烦清零', () => { const p = P(); if (p) p.stress = 0; }] },
  king: { t: () => (alive(king()) ? nm(king()) : '王') + '对你的好感到 60', tab: '宫', keep: () => alive(king()) && king() !== P() && inQin() && opinion(king(), P()) > -20, can: () => inQin() && alive(king()) && king() !== P() && opinion(king(), P()) >= 0 && opinion(king(), P()) < 40,
    done: () => alive(king()) && king() !== P() && opinion(king(), P()) >= 60, prog: () => Math.max(0, alive(king()) ? opinion(king(), P()) : 0) + '/60', rew: ['名望+10', () => addPrest(10)] },
  grand: { t: '添一个孙辈', tab: '家', can: () => a3Kids(P()).some(k => k.sp && ageOf(k) <= 38), base: () => a3Grand(P()), done: a => a3Grand(P()) > a.base, rew: ['名望+5', () => addPrest(5)] },
  // (only while someone can still marry or have children: an unmarried grown 狸, or a wife young enough)
  clan: { t: '狸家满十二口', tab: '家', keep: () => kinPool().some(c => ageOf(c) >= 16 && ageOf(c) <= 40 && !c.sp && canWed(c)) || household().some(c => c.female && c.sp && ageOf(c) >= 16 && ageOf(c) <= 40), can: () => family().length >= 6 && family().length < 12 && (kinPool().some(c => ageOf(c) >= 16 && ageOf(c) <= 40 && !c.sp && canWed(c)) || household().some(c => c.female && c.sp && ageOf(c) >= 16 && ageOf(c) <= 38)), done: () => family().length >= 12, prog: () => family().length + '/12', rew: ['族谱挂匾 · 名望+10', () => addPrest(10)] },
  land: { t: '置下三处产业', tab: '市', can: () => estKinds().length < 3, done: () => estKinds().length >= 3, prog: () => estKinds().length + '/3', rew: ['名望+5', () => addPrest(5)] },
};
// one ambition at a time for the head; done: its reward and the next one (a wish that came to nothing in six years gives way)
function a3AmbTick() {
  const A = W.a3, p = P(); if (!alive(p)) return;
  let a = A.amb; const d = a && A3_AMB[a.id];
  // (a wish is the head's own, and lapses however the season goes: a new head, six years, no way left)
  if (a && (!d || a.pid !== W.player || W.t - a.t0 >= 24 || (d.keep && !d.keep()))) { A.ambLast = a.id; A.amb = a = null; }
  if (ageOf(p) < 16 || a2Here()) return;
  if (a && d.done(a)) { A.amb = null; A.ambLast = a.id; A.ambN = (A.ambN || 0) + 1; d.rew[1](); logLine('志向达成：' + jv(d.t) + ' · ' + d.rew[0], '#ffe08a'); SFX.happy(); return; }
  if (!a) { const L = Object.keys(A3_AMB).filter(k => k !== A.ambLast && A3_AMB[k].can()); if (L.length) { const id = pick(L), D = A3_AMB[id]; A.amb = { id, t0: W.t, pid: W.player, base: D.base ? D.base() : 0 }; } }
}
// 子女出路 for a grown, unmarried child of the head: 入仕 (a 郎 at 咸阳's court), 从军 (the next campaign), 游学 (eight seasons)
// where someone coming back lives: at home, unless they had left the house meanwhile
const a3Home = c => c.flags.left || c.flags.branch ? localLoc('tavern') : 'home';
// a widowed parent who married in stays only while a child lives at home (core's homeTick): the last one can't be sent away
const a3Lone = c => [c.mom, c.dad].map(C).find(m => alive(m) && m.house === 'in' && !m.sp && m.loc === 'home' && !m.kids.some(k => { const x = C(k); return x && x !== c && alive(x) && x.house === 'li' && x.loc === 'home' && !x.flags.left; })) || null;
function a3SetPath(c, k) {
  if (!alive(c) || c.flags.path || a3Away(c) || a3Lone(c)) return;
  if (k === 'lang' && !alive(king())) { toast('朝中无王', '#ff9a8a'); return; }
  if (k === 'army' && !realmOn()) { toast('眼下没有仗打', '#ff9a8a'); return; }
  if (!spendAp(1)) return;
  c.flags.path = k;
  if (k === 'lang') { c.loc = 'xpalace'; c.role = 'minister'; c.robe = 'qin'; addCourtier(c.id, 1, { you: 20 }); logLine(nm(c) + '去咸阳做了郎官', '#ffe08a'); }
  if (k === 'army') { c.loc = 'away'; c.flags.army = W.t; logLine(nm(c) + '从军去了', '#f2ead4'); }
  if (k === 'study') { c.loc = 'youxue'; c.flags.study = W.t + 8; logLine(nm(c) + '出门游学去了', '#f2ead4'); }
  PORT.clear(); didAct('path', c, -1, true);
}
// the ones who went away come back (or, from the wall, don't)
function a3Paths() {
  for (const c of family()) {
    const f = c.flags;
    // (someone called home early, e.g. to head the house, is simply home)
    if ((f.study || f.army || f.draft) && !a3Away(c)) { delete f.study; delete f.army; delete f.draft; delete f.draftK; if (f.path !== 'lang') delete f.path; continue; }
    if (f.study && W.t >= f.study) {
      delete f.study; delete f.path; c.loc = a3Home(c);
      if ((c.eduLv || 1) < 3) c.eduLv = Math.min(3, (c.eduLv || 1) + 2); else c.st[bestSt(c)] += 2;
      logLine(nm(c) + '游学回来了 · ' + (c.tr.find(t => EDU.includes(t)) || '学识') + '★'.repeat(c.eduLv || 1), '#ffe08a');
    }
    if (f.army && (!realmOn() || W.t - f.army >= 12)) { delete f.army; delete f.path; c.loc = a3Home(c); logLine(nm(c) + '从军中回来了', '#f2ead4', true); }
    if (f.draft && W.t >= f.draft) {
      const wall = f.draftK === 'wall'; delete f.draft; delete f.draftK;
      if (wall && chance(.2)) { c.flags.cause = '死在了长城脚下'; die(c); continue; }
      c.loc = a3Home(c); if (wall && chance(.5) && !c.tr.includes('勇猛')) { c.tr = c.tr.filter(t => t !== '胆小'); gainTrait(c, '勇猛'); }
      logLine(nm(c) + (wall ? '从北边回来了' : '修完驰道回来了'), '#f2ead4');
    }
  }
}
// (a garden and a charity field once per head, and 秦's 纳粟拜爵 three times: 800, 1600, 2400)
const jueCost = () => 800 * ((W.flags.jue || 0) + 1);
DECISIONS.push(
  { id: 'garden', show: () => W.act >= 3, ico: () => icoDec('feast'), t: '修园子', s: '鱼干2000 · 名望+15 · 家人心烦-30', close: true,
    act: () => mkAct({ id: 'd_garden', n: '办', ap: 0, no: () => W.flags.garden === W.player ? '这一代修过了' : W.fish < 2000 ? '鱼干不够 2000' : '',
      fn: () => { if (W.fish < 2000 || W.flags.garden === W.player) return; addFish(-2000); addPrest(15); W.flags.garden = W.player; for (const c of household()) if (typeof relieve === 'function') relieve(c, 30, '园子'); logLine('狸宅后面修了一座园子', '#ffe08a'); } }) },
  { id: 'yitian', show: () => W.act >= 3, ico: () => icoEst('farm'), t: '置义田', s: () => W.flags.yitian ? '已置 · 每季+10' : '鱼干1500 · 族人好感+10 · 每季+10', close: true,
    act: () => mkAct({ id: 'd_yitian', n: '办', ap: 0, no: () => W.flags.yitian ? '已经置过了' : W.fish < 1500 ? '鱼干不够 1500' : '',
      fn: () => { if (W.fish < 1500 || W.flags.yitian) return; addFish(-1500); W.flags.yitian = true; for (const c of family()) if (c.id !== W.player) addOp(c, P(), 10, true); logLine('狸家置了义田，族里的孤寡有了着落', '#ffe08a'); } }) },
  { id: 'najue', show: () => W.act >= 3 && inQin() && (W.flags.jue || 0) < 3, ico: () => ICON.seal, t: () => '纳粟拜爵 · ' + (W.flags.jue || 0) + '/3', s: () => '鱼干' + jueCost() + ' · 名望+15', close: true,
    act: () => mkAct({ id: 'd_najue', n: '办', ap: 0, no: () => W.fish < jueCost() ? '鱼干不够 ' + jueCost() : '',
      fn: () => { const n = jueCost(); if (W.fish < n) return; addFish(-n); W.flags.jue = (W.flags.jue || 0) + 1; addPrest(15); logLine('狸家纳粟，拜爵一级', '#ffe08a'); } }) },
);
const a3Cities = () => ['handan', 'xianyang'].concat(W.a3.henan || (W.a2 && (W.a2.fief || W.a2.end === 'E4')) ? ['henan'] : [], W.a3.shu ? ['shu'] : []).filter(k => k !== W.city);
const A3_MOVE = { handan: '狸家的老家', xianyang: '天子脚下', henan: '封地', shu: '山高皇帝远' };
function a3MoveTo(k) {
  if (W.cool.move || W.kingId === W.player || !CITY[k] || k === W.city || (k === 'xianyang' && a3Banned())) return;
  const was = W.rank; if (inQin()) a3Resign(); if (W.rank < was) logLine('你辞了' + RANKS[was], '#dddddd');
  // (a rank 赵 gave counts for nothing in 秦, as on the letter's road: enterQin)
  if (k === 'xianyang' && W.flags.zhaoRank) { if (W.rank > 1) { W.rank = 1; PORT.clear(); MINI.clear(); logLine('赵国给的官，到了咸阳不算数', '#c8e0ff'); } delete W.flags.zhaoRank; }
  goCity(k); W.cool.move = 8; if (k === 'henan') W.a3.henan = true; if (k === 'shu') W.a3.shu = true;
  logLine('狸家搬到了' + CITY[k].n, '#ffe08a'); didAct('move', null, -1, true);
}
const a3MoveAct = () => mkAct({ id: 'move', kind: 'move', n: '迁居', ap: 0, hint: '换一座城住 · 八季一次', danger: inQin() && W.rank >= 3 && W.rank <= 4 ? '辞去' + RANKS[W.rank] : null,
  no: () => W.kingId === W.player ? '王不离咸阳' : W.cool.move ? '再等 ' + W.cool.move + ' 季' : W.queue.length ? '先把眼前的事办完' : '',
  fn: () => pickOpt('搬去哪里？', a3Cities().map(k => k === 'xianyang' && a3Banned() ? { n: CITY[k].n, s: '王上不许你回咸阳', style: 'off', fn: () => toast('王上不许你回咸阳', '#ff9a8a') }
    : { n: CITY[k].n, s: A3_MOVE[k], fn: () => a3MoveTo(k) })) });

// ---------------------------------------------------------- hooks
// (banBy: the king who sent the house away, a3Ban · qinFell: 秦 is gone, qinFall)
const a3Fresh = () => ({ guo: 100, uni: null, end: null, amb: null, ambLast: null, ambN: 0, banBy: null, qinFell: false });
SYS.init.push(W => { W.a3 = a3Fresh(); TAB_OF['天'] = 'travel'; lastHook('tab', noCourtTab); });
SYS.load.push(W => {
  const F = a3Fresh(); if (!W.a3) W.a3 = F; else for (const k in F) if (W.a3[k] === undefined) W.a3[k] = F[k]; TAB_OF['天'] = 'travel'; lastHook('tab', noCourtTab);
  // (a save from before the fall was a flag: 子婴 dead and nobody on the throne is the fall)
  const zy = W.chars.ziying; if (zy && zy.dead !== null && zy.dead !== undefined && !W.kingId) W.a3.qinFell = true;
  // (the books' dates moved: 郭开, 王贲 and 蒙武 are kept to theirs; 政, 丹 and 子婴 a season or two later)
  for (const id of ['guokai', 'wangben', 'mengwu', 'dan', 'zheng', 'ziying']) {
    const c = W.chars[id]; if (!c || c.dead !== null || !(HISTD[id] > W.t)) continue;
    if (c.dieT === null || c.dieT === undefined ? ['guokai', 'wangben', 'mengwu'].includes(id) : c.dieT < HISTD[id]) { c.dieT = HISTD[id]; c.immortal = true; }
  }
});
SYS.season.push(() => {
  const A = W.a3, p = P(); if (!A || !W.flags.act1Done || !alive(p)) return;
  a3Paths(); a3AmbTick();
  // (a house past its act-three ending stays in free mode: a late 咸阳来信 (ACT2's enterQin) sets act three again)
  if (A.end && W.act === 3) W.act = 4;
  if (W.act < 3 || !a3Realm()) return;
  const q = id => W.queue.some(x => x.ev === id);
  // (the realm decides when 赵's last king falls: the book's year gives way)
  // (kept a year ahead of his date, protected, until the realm takes 赵: only fallRealm ends him)
  const zq = C('zhaoqian'); if (alive(zq) && !rFallen('zhao')) { zq.dieT = Math.max(HISTD.zhaoqian, W.t + 4); zq.immortal = true; }
  // (昌平君, once he is 楚's king, likewise stands until 楚 falls)
  { const c = C('chengping'); if (alive(c) && !rFallen('chu') && W.realm.chu.king === c.id) { c.dieT = Math.max(HISTD.chengping, W.t + 4); c.immortal = true; } }
  // those the story is done with leave the stage the season after: 荆轲 and the head he carried
  if (A.jk) for (const id of ['jingke', 'huanyi']) { const c = C(id); if (alive(c) && (id === 'jingke' ? c.loc === 'away' : c.disp === '樊於期')) a3Gone(c); }
  if (A.pin && W.t >= A.pin) { A.pin = 0; const wj = C('wangjian'); if (alive(wj) && wj.loc === 'away') { wj.loc = 'camp'; logLine('王上亲自去频阳，把王翦请了回来', '#c8e0ff'); } }
  if (A.xz && W.t >= A.xz) { A.xz = 0; const h = C('hanan'); if (alive(h) && h.loc === 'xinzheng') { logLine('新郑的旧韩人反了，很快被平了。韩王安没能活过这一年', '#c8e0ff'); a3Gone(h); } }
  if (!A.uni && A3_RK.every(rFallen)) a3Unify();
  if (!A.junhe && W.t >= 108 && a3JunheDue() && !q('a3_junhe')) W.queue.push({ ev: 'a3_junhe' });
  if (!A.hs && !rFallen('qi') && !A.uni && (W.t >= 164 || a3Fell() >= 5) && !q('a3_housheng')) W.queue.push({ ev: 'a3_housheng' });
  // 项燕 crowns 昌平君 once 楚 is reeling (or in 前224, the books' year)
  if (!A.cp && !rFallen('chu') && alive(C('chengping')) && ((A.ls && W.realm.chu.s <= 60) || W.t >= 152) && !q('a3_changping')) W.queue.push({ ev: 'a3_changping' });
  if (!A.end && !A.uni && W.t >= 180 && !q('a3_end')) W.queue.push({ ev: 'a3_end', k: 'weiding' });
  if (!A.end && A.uni && !q('a3_end') && !q('a3_chengdi')) W.queue.push({ ev: 'a3_end' });
});
SYS.yearly.push(() => { if (realmOn() && W.t > 100) a3World(); });
SYS.sched.push(() => {
  const A = W.a3; if (!A || !W.flags.act1Done) return;
  const q = id => W.queue.some(x => x.ev === id);
  for (const [t, id] of A3_CAL) if (t === W.t && !q(id)) W.queue.push({ ev: id });
  // the 逐客令 comes early when 郑国's secret got out (ACT2's courtFallout sets W.a2.zhuke)
  if (!A.zhuke && W.a2 && W.a2.zhuke && W.t >= W.a2.zhuke && W.t < 101 && !q('a3_zhuke')) W.queue.push({ ev: 'a3_zhuke' });
  for (const [t, s, c] of A3_NEWS) if (t === W.t && W.act >= 3 && (!c || c())) logLine(s, '#c8e0ff');
  // 燕太子丹: a hostage in 咸阳 from 前236, home to 燕 in 前232 (from wherever he was)
  const dn = C('dan');
  if (W.t === 104 && alive(dn) && cityOf(dn) !== 'xianyang' && W.realm && !rFallen('yan')) { dn.loc = 'xtavern'; logLine('燕太子丹到咸阳做了质子。', '#c8e0ff', !inQin()); }
  if (W.t === 120 && alive(dn) && W.realm && !rFallen('yan')) { const was = cityOf(dn) === 'xianyang'; dn.loc = 'ji'; logLine(was ? '燕太子丹从咸阳逃回了燕国。' : '燕太子丹回了燕国。', '#c8e0ff'); }
  // 桓齮 beaten by 李牧 flees to 燕 under another name (the same cat: fur tells)
  if (W.t === 116 && realmOn()) { const h = C('huanyi'); if (alive(h) && cityOf(h) === 'xianyang' && !rFallen('zhao')) { outOfCourt(h.id); h.loc = 'ji'; h.disp = '樊於期'; addSecret('alias', h.id, null); logLine('桓齮败给了李牧，不敢回咸阳，改了名逃去燕国', '#c8e0ff'); } }
});
SYS.widget.push(a3Widget);
SYS.tab.push((tab, A) => {
  if (!W.a3 || !W.flags.act1Done || !alive(P()) || W.act < 3) return;
  if (tab === 'travel') {
    if (a3Realm() && !W.a3.uni) { const L = [mkAct({ id: 'realm', n: '天下 · 已灭 ' + a3Fell() + '/6', ap: 0, open: true, hint: a3Court() ? '看六国 · 点一国出手' : '只能看着', fn: a3OpenRealm })];
      if (a3Role() !== 'out') for (const k of ['camp', 'jian', 'hao', 'xiang']) L.push(a3Act(k));
      A.unshift(...L); }
    if (W.kingId !== W.player) A.push(a3MoveAct());
  }
  if (tab === 'court' && realmOn() && a3Lead()) A.push(a3Tuntian());
});
SYS.acts.push((c, A) => {
  const p = P(); if (!W.a3 || W.act < 3 || !alive(c) || !alive(p)) return;
  if (c.house !== 'li' || (c.dad !== p.id && c.mom !== p.id) || ageOf(c) < 16 || c.sp || c.flags.path || c.loc !== 'home' || c.flags.left || c.flags.branch) return;
  const lone = a3Lone(c);
  A.push(mkAct({ id: 'path', kind: 'path', n: '安排出路', ap: 1, grp: '家', hint: '入仕 · 从军 · 游学', no: () => lone ? '得留在家陪' + (lone.female ? '寡母' : '鳏父') : '', fn: () => pickOpt(nm(c) + '的出路 ◆1', [
    { n: '入仕', s: alive(king()) ? '去咸阳做郎官 · 每季+10鱼干 · 朝中多一席' : '朝中无王', style: alive(king()) ? 'jade' : 'off', fn: () => a3SetPath(c, 'lang') },
    { n: '从军', s: realmOn() ? '随下一次出征 · 或立功，或战死' : '眼下没有仗打', style: realmOn() ? 'jade' : 'off', fn: () => a3SetPath(c, 'army') },
    { n: '游学', s: '离家八季 · 回来学识+2星', fn: () => a3SetPath(c, 'study') }]) }));
});
SYS.econ.push((inc, cost) => {
  if (!W.a3) return;
  const n = alive(king()) ? family().filter(c => c.flags.path === 'lang' && cityOf(c) === 'xianyang' && c.loc !== 'home').length : 0;
  if (n) inc.push(['郎官俸禄', 10 * n]);
  // (free mode never starves a house out: the clan sends a little when the store is bare)
  if (W.act >= 3 && W.fish < 20) inc.push(['族人接济', 10]);
  if (W.flags.yitian) inc.push(['义田', 10]);
  // 家赀: after act one a fortune past 2000 pays a fiftieth of the rest each season
  if (W.flags.act1Done && W.fish > 2000) cost.push(['家赀', Math.floor((W.fish - 2000) / 50)]);
});
SYS.status.push((c, out) => {
  const f = c.flags; if (!alive(c) || !W.a3) return;
  if (f.study && a3Away(c)) out.push({ n: '游学', col: '#4f78a8', d: '还有 ' + Math.max(1, f.study - W.t) + ' 季回来' });
  if (f.army && c.loc === 'away') out.push({ n: '从军', col: '#a0503a', d: '跟着下一次出征' });
  if (f.draft && a3Away(c)) out.push({ n: f.draftK === 'wall' ? '戍边' : '服役', col: '#8a6a3a', d: '还有 ' + Math.max(1, f.draft - W.t) + ' 季回来' });
  if (f.path === 'lang' && c.house === 'li' && c.loc !== 'home') out.push({ n: '郎官', col: '#7a1f24', d: '在咸阳做官 · 每季给家里 10 鱼干' });
});
SYS.sheet.push((c, rows) => {
  if (!W.a3 || c.id !== W.player || !W.flags.act1Done) return;
  if (realmOn()) rows.push({ chip: '天下', col: '#a0301f', text: '已灭 ' + a3Fell() + '/6 · 秦国力 ' + W.a3.guo + ' ›', fn: a3OpenRealm });
  const a = W.a3.amb, d = a && A3_AMB[a.id]; if (d) rows.push({ chip: '志向', col: '#94562f', text: jv(d.t) + ' · ' + d.rew[0] });
});
// the goal line: the realm for those at court (a deadly illness at home keeps its own line), else the ambition
// something to do on the 天下 list this season (kind: one you can do to some state)
const a3Can = kind => !a3No(kind) && a3Live().some(k => !a3No(kind, k));
// when the next thing opens up, in words (the goal line while every realm button is grey)
function a3When() {
  if (a3Lead()) {
    if (W.cool.camp) return '出征要再等 ' + W.cool.camp + ' 季';
    const o = a3Live().filter(k => A3_REALM[k].open > W.t).sort((a, b) => A3_REALM[a].open - A3_REALM[b].open)[0];
    if (o) return A3_REALM[o].n + '要到前' + yearOf(A3_REALM[o].open) + '年才打得到';
  }
  if (W.cool.rjian) return '离间要再等 ' + W.cool.rjian + ' 季';
  if (W.fish < 150) return '离间要 150 鱼干（市）';
  return '眼下没有能做的';
}
SYS.goal.push(() => {
  if (!W.a3 || !W.flags.act1Done || !alive(P()) || !realmOn()) return null;
  if (household().some(c => isIll(c) && c.ill.k === '重病')) return null;
  const role = a3Role(), w = a3Weak(true), nf = a3Fell(), p = P(), can = ['camp', 'jian', 'hao', 'xiang'].some(a3Can);
  if (ageOf(p) < 16 && role !== 'king') return { s: '目标：长到十六岁再议天下事 · 还有 ' + Math.max(1, p.born + 64 - W.t) + ' 季（家）', pri: 40 };
  // (every realm button grey: say when, and let an ambition have the line meanwhile)
  if ((role === 'king' || role === 'lead' || role === 'ke') && !can) return { s: '目标：天下 · 已灭' + nf + '/6 · ' + a3When() + (a3When().includes('（') ? '' : '（天下）'), pri: 60 };
  if (role === 'king' || role === 'lead') return { s: '目标：一统天下 · 已灭' + nf + '/6' + (w ? ' · 最弱 ' + A3_REALM[w].n + W.realm[w].s : '') + '（天下）', pri: 10 };
  if (role === 'ke') return { s: '目标：结好远国，离间近国 · 已灭' + nf + '/6（天下）', pri: 40 };
  if (role === 'low') {
    if (W.rank < 1) return { s: '目标：结交权贵，做人的舍人（人）', pri: 40 };
    if (!W.patron && (W.merit || 0) < 60) { const b = bestLord(); return { s: '目标：先找个门路 · ' + (b ? nm(b[0]) + ' ' + b[1] + '/' + LORD_OP : '权贵好感到 ' + LORD_OP) + '（人）', pri: 40 }; }
    if (promoReady()) return { s: '目标：求官，升客卿（宫 · 大计）', pri: 40 };
    const L = lackTxt(); return { s: '目标：做到客卿，才能议天下事' + (L ? ' · ' + L.s + '（' + L.tab + '）' : '（宫）'), pri: 40 };
  }
  return null;
});
SYS.goal.push(() => {
  const a = W.a3 && W.a3.amb, d = a && A3_AMB[a.id]; if (!d || a.pid !== W.player || !W.flags.act1Done || !alive(P())) return null;
  return { s: '志向：' + jv(d.t) + (d.prog ? ' ' + d.prog() : '') + '（' + d.tab + '）', pri: 50 };
});
