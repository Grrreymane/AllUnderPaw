// ---------------------------------------------------------- 楚汉: after 大泽乡 the house can raise its own banner and fight for 天下
// Factions hold the map's seven regions; each has a strength (s) and a leader's 武 (gen). Every spring the strong fall on the
// weak; history leans 汉's way (韩信 from 前204, 楚 wearing down). You recruit, march, sow discord, ally and take surrenders
// from the 天下 tab or by tapping the map. Ends: you take it all (天子), your ally does (封王), or you fall (the house goes on).
const CH_F = {
  you: { n: '狸', col: '#d6a23e' },
  qinx: { n: '秦', col: '#5a3a44', home: 'qin', s: 70, gen: 10, lead: '秦二世' },
  chu: { n: '楚', col: '#b5503a', home: 'chu', s: 100, gen: 20, lead: '项羽' },
  liu: { n: '汉', col: '#a8407a', home: null, s: 45, gen: 11, lead: '刘季' },
  qi: { n: '齐', col: '#3f8a5e', home: 'qi', s: 40, gen: 10, lead: '田横' },
  yan: { n: '燕', col: '#7a6aa8', home: 'yan', s: 25, gen: 8, lead: '臧荼' },
  wei: { n: '魏', col: '#c29a52', home: 'wei', s: 30, gen: 9, lead: '魏豹' },
  zhao: { n: '赵', col: '#4f78a8', home: 'zhao', s: 35, gen: 11, lead: '张耳' },
  hanx: { n: '韩', col: '#8a8c96', home: 'han', s: 20, gen: 7, lead: '韩王信' },
};
const CH_SEAT = { handan: 'zhao', henan: 'han', xianyang: 'qin' }, CH_T0 = 214, CH_NEED = { ret: 3, prest: 150, fish: 500 };
const chOn = () => !!(W && W.ch && W.ch.on && !W.ch.end);
const chF = id => W.ch.f[id];
const chAI = () => Object.keys(W.ch.f).filter(k => k !== 'you' && !W.ch.f[k].dead);
const chLands = id => Object.keys(W.ch.own).filter(k => W.ch.own[k] === id);
const chName = id => CH_F[id].n + (id === 'you' ? '' : '（' + CH_F[id].lead + '）');
// your best sword leads the army: you, a grown relative at home, or a retainer
function chGen() { let b = P(); for (const c of adults(household()).concat(W.ret.map(C).filter(alive))) if (stat(c, 0) > stat(b, 0)) b = c; return b; }
const chPow = id => chF(id).s / 6 + (id === 'you' ? stat(chGen(), 0) : chF(id).gen) * .8;
const chOdds = (a, d) => a3Beat(chPow(a), chPow(d));
function chWhy() {
  const p = P(), N = CH_NEED;
  if (W.t < CH_T0 || (W.a3 && W.a3.fusu)) return '天下还没乱';
  if (W.kingId === W.player) return '你已经是王了';
  if (ageOf(p) < 16) return '你还没成年';
  if (!CH_SEAT[W.city] || (W.city === 'xianyang' && !(W.a3 && W.a3.qinFell))) return '要先迁居到邯郸或河南';
  if (W.ret.length < N.ret) return '门客要 ' + N.ret + ' 人（现有 ' + W.ret.length + '）';
  if (W.prest < N.prest) return '名望要 ' + N.prest;
  if (W.fish < N.fish) return '鱼干要 ' + N.fish;
  return '';
}
function chStart() {
  if (chWhy()) return;
  const p = P(), seat = CH_SEAT[W.city], fell = !!(W.a3 && W.a3.qinFell);
  addFish(-CH_NEED.fish);
  const f = {}; for (const k in CH_F) if (k !== 'you') f[k] = { s: CH_F[k].s, gen: CH_F[k].gen };
  const own = {}; for (const k in CH_F) if (CH_F[k].home) own[CH_F[k].home] = k;
  if (fell) { f.qinx.dead = true; own.qin = 'liu'; }
  // the lord of your own country comes over to you
  const old = own[seat], came = old && old !== 'liu' && f[old] && !f[old].dead, bonus = came ? R(f[old].s / 3) : 0;
  if (came) f[old].dead = true;
  // (if you sit in 关中 yourself, 刘季 holds 韩 instead)
  if (old === 'liu') { own.han = 'liu'; f.hanx.dead = true; }
  own[seat] = 'you';
  f.you = { s: clamp(25 + W.ret.length * 4 + Math.floor(W.prest / 12) + bonus, 30, 90) };
  W.ch = { on: true, end: null, t0: W.t, f, own, ally: null, seat, asked: 0 };
  const lj = C('liuji'); if (lj && memoOf(lj, p, '押宝')) W.ch.ally = 'liu';
  if (W.rank >= 1 && W.rank <= 4) { W.rank = 0; W.patron = null; }
  PORT.clear(); MINI.clear(); MAPC.clear(); SFX.happy();
  logLine('狸家在' + CITY[W.city].n + '竖起了旗', '#ffe08a');
  showCard({ title: '自立', who: [p.id], text: '门客们在院子里竖起一面旗，旗上只有一个字：狸。' + (came ? CH_F[old].lead + '带着人来投了你。' : '') + '\n从今天起，天下的事，狸家也算一份。',
    opts: [opt('「先活下来。」', '去地图：募兵、出征、结盟', () => { W.loc = 'travel'; })] });
}
function chAbsorb(a, b, how) {
  const A = chF(a), B = chF(b); B.dead = true; B.s = 0;
  for (const k of chLands(b)) W.ch.own[k] = a;
  A.s = Math.min(150, A.s + (a === 'you' ? 8 : 12));
  if (W.ch.ally === b) W.ch.ally = null;
  MAPC.clear();
  logLine(how || (CH_F[a].n + '灭了' + CH_F[b].n), a === 'you' ? '#ffe08a' : '#c8e0ff', a !== 'you');
}
function chFall(by) {
  const C0 = W.ch; C0.end = 'fall'; C0.f.you.dead = true; for (const k of chLands('you')) C0.own[k] = by; MAPC.clear();
  W.fish = Math.floor(W.fish / 2); addPrest(-30);
  W.queue.unshift({ ev: 'ch_end', k: 'fall', by });
}
function chCheck() {
  if (!chOn()) return;
  const C0 = W.ch, ai = chAI();
  if (!ai.length) { C0.end = 'win'; W.rank = 6; W.kingId = W.player; registerPlayerCrown(P()); addPrest(100); PORT.clear(); MINI.clear(); W.queue.unshift({ ev: 'ch_end', k: 'win' }); return; }
  if (ai.length === 1 && C0.ally === ai[0] && !C0.asked) { C0.asked = 1; W.queue.push({ ev: 'ch_last', a: ai[0] }); }
}
// the year's wars among the others (and against you)
function chYear() {
  if (!chOn()) return;
  const C0 = W.ch, f = C0.f, fell = !!(W.a3 && W.a3.qinFell);
  // 秦 on history's road wears away and is gone by 前206; 关中 goes to 刘季
  if (!f.qinx.dead && (fell || ['huhai', 'ziying'].includes(W.kingId) || !W.kingId)) {
    f.qinx.s -= 14;
    if (fell || f.qinx.s <= 0) { const to = f.liu.dead ? (f.chu.dead ? 'you' : 'chu') : 'liu'; f.qinx.dead = true; f.qinx.s = 0; for (const k of chLands('qinx')) C0.own[k] = to; MAPC.clear(); logLine('秦亡了。关中归了' + CH_F[to].n, '#c8e0ff', true); }
  }
  for (const k of chAI()) f[k].s = clamp(f[k].s + (k === 'liu' && f.qinx.dead ? 7 : k === 'chu' && W.t >= 232 ? -4 : 4), 5, 130);
  if (W.t >= 232 && !f.liu.dead && !f.liu.xin) { f.liu.xin = 1; f.liu.gen = 18; logLine('汉王拜韩信为大将', '#c8e0ff', true); }
  const order = chAI().sort((a, b) => f[b].s - f[a].s).slice(0, 2);
  for (const a of order) {
    if (f[a].dead) continue;
    const T = chAI().filter(k => k !== a).concat(C0.ally === a || W.t < C0.t0 + 4 ? [] : ['you']).filter(k => f[a].s >= f[k].s + 12).sort((x, y) => f[x].s - f[y].s)[0];
    if (!T || !chance(.6)) continue;
    if (T === 'you') { if (!W.queue.some(q => q.ev === 'ch_attack')) W.queue.push({ ev: 'ch_attack', a }); continue; }
    f[T].s -= 12 + Math.floor(Math.random() * 13); f[a].s = Math.max(5, f[a].s - 5);
    if (f[T].s <= 0) chAbsorb(a, T, T === 'chu' ? '垓下一战，项羽死在乌江边。' + CH_F[a].n + '灭了楚' : null);
    else logLine(CH_F[a].n + '攻' + CH_F[T].n + '，' + CH_F[T].n + '折了不少兵', '#c8e0ff', true);
  }
  chCheck();
}
// ---- what you do
const chTargets = () => chAI().filter(k => k !== W.ch.ally);
function chPick(title, list, row) { if (!list.length) { toast('眼下没有可以下手的', '#dddddd'); return; } pickOpt(title, list.map(row)); }
function chCamp(k) {
  if (!chOn() || chF(k).dead || !spendAp(1)) return;
  const me = chF('you'), T = chF(k), g = chGen(), a = chPow('you') + Math.random() * 8, d = chPow(k) + Math.random() * 8, win = a > d;
  if (win) { const dmg = clamp(R(8 + (a - d) * 1.2), 6, 20); T.s -= dmg; me.s = Math.max(5, me.s - 5); addPrest(3);
    if (T.s <= 0) chAbsorb('you', k, '你灭了' + CH_F[k].n + '。' + CH_F[k].lead + (k === 'chu' ? '死在乌江边' : '降了')); else toast(nm(g) + '胜了 · ' + CH_F[k].n + '-' + dmg, '#9fe89a'); }
  else { me.s -= 12; T.s = Math.max(5, T.s - 3); toast(nm(g) + '败了回来 · 兵-12', '#ff9a8a'); if (me.s <= 0) chFall(k); }
  didAct('campaign', null, 0, win); chCheck();
}
function chJian(k) {
  if (!chOn() || chF(k).dead || W.fish < 150 || !spendAp(1)) return; addFish(-150);
  const T = chF(k), ok = chk(3, 10 + Math.floor(T.s / 15));
  if (ok) { if (T.gen > 10 && !T.cut) { T.cut = 1; T.gen -= 5; toast(k === 'chu' ? '范增走了。项羽身边再没有出主意的人' : CH_F[k].lead + '和他的将军起了疑', '#9fe89a'); } else { T.s = Math.max(1, T.s - 12); toast(CH_F[k].n + '的人心散了 · -12', '#9fe89a'); } }
  else { addPrest(-3); toast('金子送出去，没有回音', '#ff9a8a'); }
  didAct('alienate', null, 3, ok);
}
function chAlly(k) {
  if (!chOn() || chF(k).dead || !spendAp(1)) return; const ok = chk(2, 11);
  if (ok) { W.ch.ally = k; W.ch.asked = 0; logLine('狸与' + CH_F[k].n + '结了盟', '#9fe89a'); } else toast(CH_F[k].lead + '没有答应', '#dddddd');
  didAct('ally', null, 2, ok);
}
function chXiang(k) {
  if (!chOn() || chF(k).dead || chF(k).s > 20 || !spendAp(1)) return; const ok = chk(2, 8 + Math.floor(chF(k).s / 4));
  if (ok) chAbsorb('you', k, CH_F[k].lead + '开城降了你'); else toast(CH_F[k].lead + '不肯降', '#dddddd');
  didAct('persuade', null, 2, ok); chCheck();
}
function chRecruit() {
  if (!chOn() || W.fish < 150 || !spendAp(1)) return; addFish(-150);
  const n = 6 + (stat(P(), 1) >= 12 ? 3 : 0); chF('you').s = Math.min(150, chF('you').s + n); toast('募到了兵 · +' + n, '#9fe89a'); didAct('recruit', null, 1, true);
}
const chRow = (k, s, fn, off) => ({ n: chName(k) + ' · ' + chF(k).s, s, style: off ? 'off' : 'jade', fn: off ? () => toast(off, '#ff9a8a') : fn });
function chMenu(k) {
  if (!chOn() || !k) return;
  if (k === 'you') { toast('狸 · 兵 ' + chF('you').s + ' · 领兵的是' + nm(chGen()), '#ffe08a'); return; }
  const T = chF(k); if (!T || T.dead) return;
  const al = W.ch.ally === k, pr = R(chOdds('you', k) * 100);
  pickOpt(chName(k) + ' · 兵 ' + T.s + (al ? ' · 盟友' : ''), [
    { n: '出征 ◆1', s: al ? '打他就是毁盟' : '胜算 ' + pr + '% · 胜也折兵 5 · 败则兵-12', style: 'jade', fn: () => { if (al) W.ch.ally = null; chCamp(k); } },
    { n: '离间 ◆1 · 鱼干150', s: W.fish < 150 ? '鱼干不够 150' : chkHint(3, 10 + Math.floor(T.s / 15)) + (T.gen > 10 && !T.cut ? ' · 去他一臂' : ' · 兵-12'), style: W.fish < 150 ? 'off' : 'jade', fn: () => chJian(k) },
    { n: '结盟 ◆1', s: al ? '已是盟友' : chkHint(2, 11) + ' · 互不相攻' + (W.ch.ally ? ' · 换掉旧盟' : ''), style: al ? 'off' : 'jade', fn: () => { if (!al) chAlly(k); } },
    { n: '劝降 ◆1', s: T.s > 20 ? '兵 20 以下才肯降' : chkHint(2, 8 + Math.floor(T.s / 4)), style: T.s > 20 ? 'off' : 'jade', fn: () => chXiang(k) }]);
}
// ---- cards
EV.ch_attack = e => {
  if (!chOn() || !e || !e.a || chF(e.a).dead) return null;
  const a = e.a, me = chF('you'), pr = Math.min(95, R(chOdds('you', a) * 100) + 20);
  return { title: '兵临城下', who: [chGen().id], text: CH_F[a].lead + '的兵到了' + CITY[W.city].n + '城下。',
    opts: [opt('「守。」', '成算 ' + pr + '% · 守住他兵-10 · 守不住你兵-22', () => {
        if (chance(pr / 100)) { chF(a).s = Math.max(5, chF(a).s - 10); me.s = Math.max(5, me.s - 5); addPrest(5); toast('守住了', '#9fe89a'); }
        else { me.s -= 22; toast('城外的营垒丢了 · 兵-22', '#ff9a8a'); if (me.s <= 0) chFall(a); } }),
      Object.assign(opt('「送金求和。」', '鱼干-300 · 他今年退兵', () => addFish(-300), () => W.fish >= 300), { no: () => '鱼干不够 300' }),
      opt('「开城，称臣。」', '结盟 · 你兵-10', () => { W.ch.ally = a; W.ch.asked = 0; me.s = Math.max(5, me.s - 10); logLine('狸向' + CH_F[a].n + '称了臣', '#dddddd'); })] };
};
EV.ch_last = e => {
  if (!chOn() || !e || !e.a || chF(e.a).dead) return null;
  const a = e.a;
  return { title: '天下二分', who: [W.player], text: '天下只剩下你和' + CH_F[a].lead + '。他派人来说：两家多年的交情，何必再打。',
    opts: [opt('「愿奉' + CH_F[a].n + '为天子。」', '封王 · 名望+60 · 鱼干+1000', () => { W.ch.end = 'vassal'; addPrest(60); addFish(1000); W.queue.unshift({ ev: 'ch_end', k: 'vassal', by: a }); }),
      opt('「天无二日。」', '毁盟，决战', () => { W.ch.ally = null; logLine('狸与' + CH_F[a].n + '断了盟', '#ff9a8a'); })] };
};
EV.ch_end = e => {
  const k = e && e.k, by = e && e.by, p = P(); if (!W.ch || !k || !CH_F[by || 'you']) return null;
  const T = { win: ['天子', '最后一座城也开了门。天下再没有别的旗，只有一个「狸」字。\n这一切，是从邯郸市集上的一条鱼开始的。'],
    vassal: ['封王', (by ? CH_F[by].lead : '') + '做了天子，封你为王。狸家的旗还在，只是比他的矮一头。'],
    fall: ['兵败', '旗倒了。' + (by ? CH_F[by].lead + '的兵进了城。' : '') + '狸家的人换了衣裳，散进市集里。铺子过些日子还会再开。'] }[k];
  if (!T) return null;
  if (k === 'fall') W.ch.on = false; MAPC.clear();
  return { title: T[0], who: [p.id], big: true, text: T[1] + '\n' + yearTxt(W.t) + ' · 名望 ' + W.prest + ' · 狸家 ' + family().length + ' 口',
    opts: [opt('继续经营狸家', '', () => {})] };
};
STORY_EV.add('ch_attack'); STORY_EV.add('ch_last'); STORY_EV.add('ch_end');
Object.assign(XP_KIND, { recruit: 1 });
// ---- hooks: 大计 row, the 天下 tab, the widget, the goal line, the yearly wars
DECISIONS.push({ id: 'zili', show: () => W.t >= CH_T0 && !W.ch && W.kingId !== W.player && !(W.a3 && W.a3.fusu), ico: () => ICON.seal, t: '自立',
  s: () => chWhy() || '鱼干-' + CH_NEED.fish + ' · 竖旗争天下', close: true,
  act: () => mkAct({ id: 'd_zili', n: '办', ap: 0, danger: '败了家产减半 · 鱼干-' + CH_NEED.fish, no: chWhy, fn: chStart }) });
SYS.init.push(W => { W.ch = null; });
SYS.load.push(W => { if (W.ch === undefined) W.ch = null; });
SYS.yearly.push(() => { if (chOn() && W.t > W.ch.t0) chYear(); });
// a lord taxes what he holds
SYS.econ.push(inc => { if (chOn()) inc.push(['赋税', 20 * chLands('you').length]); });
SYS.season.push(() => { if (chOn()) chCheck(); });
SYS.tab.push((tab, A) => {
  if (tab !== 'travel' || !chOn()) return;
  for (const id of ['move', 'realm']) { const i = A.findIndex(a => a.id === id); if (i >= 0) A.splice(i, 1); }   // a lord doesn't move house; the old 天下 list is history
  const tg = () => chTargets().sort((a, b) => chF(a).s - chF(b).s);
  A.unshift(
    mkAct({ id: 'ch_recruit', kind: 'recruit', n: '募兵', ap: 1, fish: 150, hint: '兵+' + (6 + (stat(P(), 1) >= 12 ? 3 : 0)) + ' · 现有 ' + chF('you').s, no: () => W.fish < 150 ? '鱼干不够 150' : chF('you').s >= 150 ? '兵已满' : '', fn: chRecruit }),
    mkAct({ id: 'ch_camp', n: '出征', ap: 1, hint: '点地图上的一家也行', fn: () => chPick('打谁？ ◆1', tg(), k => chRow(k, '胜算 ' + R(chOdds('you', k) * 100) + '%', () => chCamp(k))) }),
    mkAct({ id: 'ch_jian', n: '离间', ap: 1, fish: 150, hint: '去他一臂，或散他的兵', no: () => W.fish < 150 ? '鱼干不够 150' : '', fn: () => chPick('离间谁？ ◆1', chAI(), k => chRow(k, chkHint(3, 10 + Math.floor(chF(k).s / 15)), () => chJian(k))) }),
    mkAct({ id: 'ch_ally', n: '结盟', ap: 1, hint: W.ch.ally ? '盟友：' + CH_F[W.ch.ally].n : '找一家互不相攻', fn: () => chPick('与谁结盟？ ◆1', chAI().filter(k => k !== W.ch.ally), k => chRow(k, chkHint(2, 11), () => chAlly(k))) }),
    mkAct({ id: 'ch_xiang', n: '劝降', ap: 1, hint: '兵 20 以下的才肯降', fn: () => chPick('劝谁降？ ◆1', tg(), k => chRow(k, chF(k).s > 20 ? '兵太多，不肯降' : chkHint(2, 8 + Math.floor(chF(k).s / 4)), () => chXiang(k), chF(k).s > 20 ? '兵 20 以下才肯降' : '')) }));
});
SYS.widget.push(() => {
  if (!chOn()) return false;
  const L = ['you'].concat(chAI().sort((a, b) => chF(b).s - chF(a).s)).slice(0, 5);
  rect(118, 20, 59, 43, 'rgba(22,18,26,.75)'); txt('争天下', 121, 25, 5.5, '#f2ead4', 'left', null);
  L.forEach((k, i) => { const y = 32 + i * 6.2; rect(120, y - 2, 4, 4, CH_F[k].col); txt(CH_F[k].n + (W.ch.ally === k ? '·盟' : ''), 126, y, 5.5, k === 'you' ? '#ffe08a' : '#f2ead4', 'left', null); txt(chF(k).s, 174, y, 5.5, '#ffe08a', 'right', null); });
  hit(118, 20, 59, 43, () => { W.loc = 'travel'; });
  return true;
});
SYS.goal.push(() => {
  if (!chOn()) return null;
  const ai = chAI().sort((a, b) => chF(b).s - chF(a).s), top1 = ai[0];
  return { s: '目标：争天下 · 狸' + chF('you').s + (top1 ? ' ' + CH_F[top1].n + chF(top1).s : '') + ' · 还剩 ' + ai.length + ' 家（行）', pri: 12 };
});
// ---- end act3
