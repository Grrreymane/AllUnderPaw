// ============================================================ systems
// Each system lives between its own markers and plugs into SYS; keep code for one system inside its section.

// ==== SYS:growth ==== 修行 · 身心 · 家法
// The head gets better at what they keep doing (practice → stats, a chosen way 志 with perks, lessons from masters),
// wears down with age, illness and 心烦, and the house law (家法) decides who takes over and how.
// W: law ('嫡长' | '择贤'), heirId (named heir, 择贤), regent (id while the head is under 16), gr { fs, py } (fish and
// prestige last seen, for lifetime earnings and 野心), gv (1 = stress already on the 0–100 scale).
// Per cat: xp [4], focus { i, t }, les { masterId: n }, school { eduTrait: lv } (schools learned from masters), earn,
// ill { k, left }, flags.coT (last 陪伴/同宿), flags.lovS / lovN (lovers now / ever), flags.disinh, flags.mourned.

// ---------------------------------------------------------- 志: one way per stat, perks at base stat 10 / 14 / 18 while it is your focus
// (the perk that matters early comes first: 陶朱 while there is still land to buy, 说客 while the 立嗣 race can use it)
const FOCUS = [
  { n: '兵家', perks: [['健体', 10, '健康恢复翻倍，上限+10'], ['家丁', 14, '捉贼必胜 · 产业不失窃'], ['护卫', 18, '家人遇刺，对方成算减半']] },
  { n: '商道', perks: [['陶朱', 10, '置产-30%'], ['精打细算', 14, '家用-20%'], ['铺面', 18, '铺子每季+8']] },
  { n: '纵横', perks: [['巧舌', 10, '交游时对方好感再+2'], ['说客', 14, '遣使、游说+25%'], ['宾客', 18, '结交时两人任选']] },
  { n: '鬼谷', perks: [['耳目', 10, '刺探、打听+15%'], ['暗桩', 14, '计谋隐秘+15'], ['洞察', 18, '看得见针对你的计谋']] },
];
const FOCUS_CD = 8, XP_CAP = 18;
// practice needed for the next point: one more per point, and past 12 three more per point (the top takes teachers)
const xpNeed = s => 6 + s + 2 * Math.max(0, s - 12);
// other systems ask for perks with typeof hasPerk === 'function' && hasPerk('铺面')
function hasPerk(name) {
  const p = W && P(); if (!p || !p.focus) return false;
  const i = p.focus.i, k = FOCUS[i] && FOCUS[i].perks.find(x => x[0] === name);
  return !!k && p.st[i] >= k[1];
}
function openFocus() {
  const p = P(); if (!alive(p)) return;
  openList('立志', () => FOCUS.map((f, i) => {
    const cur = p.focus && p.focus.i === i, wait = p.focus ? p.focus.t + FOCUS_CD - W.t : 0;
    // the row says what the next perk on this road does (tap the row for all three)
    const nx = f.perks.find(k => !(cur && p.st[i] >= k[1]));
    return { dot: STATC[i], t: f.n + ' · ' + STATN[i] + ' ' + p.st[i], s: cutS(nx ? nx[0] + nx[1] + '：' + nx[2] : '三项专长都有了'),
      // the row itself tells what the three perks do
      fn: () => f.perks.forEach(k => toast(k[0] + '（' + STATN[i] + k[1] + '）' + k[2], '#f2ead4')),
      act: cur ? { n: '当前', open: true, look: 'gold', fn: () => {} } : mkAct({ n: '立志', ap: 0, no: () => wait > 0 ? '再等 ' + wait + ' 季' : '',
        fn: () => { p.focus = { i, t: W.t }; logLine('你立志走' + f.n + '这条路', '#ffe08a'); SFX.happy(); } }) };
  }), { sub: '点一行看三项专长 · 本项熟练多五成 · 8 季可改' });
}

// ---------------------------------------------------------- 修行: practice turns into stats
// which stat an action trains (kinds from didAct; other systems' kinds included where the spec names them)
// (笼络 and 勾引 are won with 交, so they train it; the plots against someone train 谋)
const XP_KIND = { trade: 1, caravan: 1, advise: 1, counsel: 1, policy: 1,
  talk: 2, gift: 2, pay: 2, court: 2, propose: 2, match: 2, feast: 2, banquet: 2, chuyu: 2, sway: 2, seduce: 2,
  spy: 3, ask: 3, venture: 3, blackmail: 3, expose: 3, scheme: 3, plot: 3, fabricate: 3, alienate: 3, murder: 3, extort: 3,
  duel: 0, drill: 0, guard: 0, escort: 0, army: 0, campaign: 0, battle: 0 };
// +1 per use, +1 more on success — for the ones that can fail; these never do, so they give +1 (keeps the 立嗣 race and
// the economy where the balance harness put them)
const DRILLS = [['习武', 'drill', 0], ['理账', 'drillZ', 1], ['练辞令', 'drillJ', 2], ['读阴符', 'drillM', 3]];
Object.assign(XP_KIND, { drillZ: 1, drillJ: 2, drillM: 3 });
const XP_SURE = new Set(['trade', 'caravan', 'talk', 'gift', 'pay', 'feast', 'banquet', 'expose', 'extort']);
let GFX = null;   // { i, t0 }: the star over a stat that just went up (not saved)
function gainXp(c, i, n) {
  if (!c || !(i >= 0 && i <= 3) || !n) return;
  c.xp = c.xp || [0, 0, 0, 0];
  if (c.st[i] >= XP_CAP) { c.xp[i] = 0; return; }   // practice alone goes no further
  c.xp[i] += n * (c.focus && c.focus.i === i ? 1.5 : 1);
  const need = xpNeed(c.st[i]);
  if (c.xp[i] >= need) {
    c.xp[i] = c.st[i] + 1 >= XP_CAP ? 0 : c.xp[i] - need; c.st[i]++;
    if (c.id === W.player) { toast(STATN[i] + ' +1', '#ffe08a'); SFX.happy(); GFX = { i, t0: T }; }
  }
}

// ---------------------------------------------------------- 拜师: four masters, one stat each; kids can be sent too
const MASTERS = { lzl: 2, guozong: 1, lianpo: 0, yuqing: 3, limu: 0,
  // 咸阳's teachers
  caize: 2, lisi: 1, menga: 0, wangjian: 0, fanju: 3, chengping: 3, weiliao: 3 };
// 李牧: 赵's other great general, home from 雁门 after 长平 (a second 武 teacher who outlives 廉颇); 郭开's slander kills him
HISTD.limu = 132;
HIST_NEXT.limu = () => logLine('赵王迁' + (alive(C('guokai')) ? '听信郭开，' : '') + '杀了李牧。', '#c8e0ff'); HIST_GONE.add('limu');
// 郭开 lives to take 秦's gold for 李牧 (前229) and sees 邯郸 fall
HISTD.guokai = 150;
function spawnLimu() {
  if (C('limu') || W.t < 11 || W.t >= HISTD.limu) return;
  spawnHist({ id: 'limu', disp: '李牧', sur: '李', name: '牧', born: bornAt(292), role: 'general', robe: 'general', loc: 'palace',
    tr: ['勇猛', '多疑', '节制'], st: [17, 9, 7, 12], g: { O: ['o'], A: ['A', 'A'], S: ['s', 's'], D: ['D', 'D'] } });
}
// what the next lesson from m will bring beyond the practice: the school's trait, one ★ more, or nothing
function schoolGain(p, i) {
  const t = EDU[i];
  if (!p.tr.includes(t)) return '学成' + t;
  if (p.school && p.school[t]) return p.school[t] < 3 ? t + '★'.repeat(p.school[t] + 1) : '';
  return (p.eduLv || 1) < 3 ? t + '★'.repeat((p.eduLv || 1) + 1) : '';
}
const lessonGain = (p, m, i) => (((p.les && p.les[m.id]) || 0) + 1) % 3 ? '' : schoolGain(p, i);
const LESSON_SAY = [['「下盘稳了，再说出剑。」', '「守得住，才打得赢。」'], ['「账要天天算，别等到年底。」', '「贱买贵卖谁都会，难的是等。」'],
  ['「话要说到对方想听的地方。」', '「先听，再开口。」'], ['「先想清楚，对方要的是什么。」', '「一步棋，要看三步。」']];
// 虞卿, 赵's 上卿, a guest of 平原君 (the 谋 master)
function spawnYuqing() {
  if (C('yuqing')) return;
  mkc({ id: 'yuqing', disp: '虞卿', sur: '虞', name: '卿', born: bornAt(300), role: 'minister', robe: 'zhao', loc: 'pingyuan', hist: true, immortal: !W.flags.act1Done,
    tr: ['诚实', '仁厚', '高冷'], st: [4, 12, 11, 16], g: { O: ['o'], A: ['A', 'a'], D: ['d', 'd'], S: ['S', 's'] } });
}
// every third lesson from the same master: that school's trait (a second school starts at ★), then one ★ more, up to 3
function lesson(m, i) {
  const p = P(); p.les = p.les || {};
  const n = p.les[m.id] = (p.les[m.id] || 0) + 1, t = EDU[i];
  gainXp(p, i, 6); addOp(m, p, 2, true);
  let note = STATN[i] + '熟练+' + (6 * (p.focus && p.focus.i === i ? 1.5 : 1));
  if (n % 3 === 0) {
    if (!p.tr.includes(t)) { p.tr.push(t); p.school = p.school || {}; p.school[t] = 1; note = '学得' + t; logLine('你跟' + nm(m) + '学成了' + t, '#ffe08a'); }
    else if (p.school && p.school[t]) { if (p.school[t] < 3) { p.school[t]++; note = t + '★'.repeat(p.school[t]); } }
    else if ((p.eduLv || 1) < 3) { p.eduLv = (p.eduLv || 1) + 1; note = t + '★'.repeat(p.eduLv); }
  }
  if (state === 'game') MODAL.push({ type: 'talk', c: m.id, line: pick(LESSON_SAY[i]), note, ok: true, fx: 'star', t0: T });
  didAct('lesson', m, i, true);
}

// ---------------------------------------------------------- 身心: illness, age, 心烦, traits earned in life
const ILL = {
  风寒: { hp: -8, dur: 2, col: '#5a7098', d: '健康-8/季' },
  咳疾: { hp: -2, dur: 0, col: '#8a6a3a', d: '健康-2/季 · 四项-1 · 少有自愈' },
  重病: { hp: -15, dur: 0, col: '#a0304a', d: '健康-15/季 · 每季一成会死' },
};
const isIll = c => !!(c && c.ill && ILL[c.ill.k]);
const cureP = () => .5 + (hasPerk('健体') ? .2 : 0);
const atHome = c => c.loc === 'home' && (c.house === 'li' || c.house === 'in') && !c.flags.left && !c.flags.branch;
// 2% a season for grown-ups under your roof: ×2 in winter, ×2 past 50, ×1.5 when frail
const illP = c => .02 * (W.t % 4 === 3 ? 2 : 1) * (ageOf(c) > 50 ? 2 : 1) * (c.health < 50 ? 1.5 : 1);
function catchIll(c) {
  const r = Math.random(), k = r < .6 ? '风寒' : r < .9 ? '咳疾' : '重病';
  c.ill = { k, left: ILL[k].dur };
  // (only those under your roof fall ill here: a 重病 among them always gets its card)
  if (c.id === W.player || k === '重病') W.queue.push({ ev: 'ill', a: c.id });
  else logLine(nm(c) + '病了：' + k, '#c8b0a0');
}
function cure(c) {
  const ok = chance(cureP()), k = c.ill ? c.ill.k : '';
  if (ok) { c.ill = null; addHealth(c, 5); toast((c.id === W.player ? '' : nm(c)) + k + '治好了', '#9fe89a'); SFX.happy(); }
  else toast('药吃了，不见好', '#ff9a8a');
  // (social remembers a cure by what it was: saving someone from 重病 is not the same as curing a cold)
  c.flags.cureK = k; didAct('doctor', c, -1, ok); delete c.flags.cureK;
}
// 重病 is the one that kills: its button stands on the card by itself, in gold
const doctorAct = c => mkAct({ id: 'doctor', kind: 'doctor', n: '请医', ap: 1, fish: 40, grp: '家', gold: c.ill.k === '重病', hint: c.ill.k + ' · 治好' + R(cureP() * 100) + '%',
  no: () => W.fish < 40 ? '鱼干不够 40' : '', fn: () => { if (!spendAp(1)) return; addFish(-40); cure(c); } });
// the 家 tab's 请医 for whoever is sick under your roof (you have your own button): one sick, straight to them; more, a pick
const sickHome = () => household().filter(c => c.id !== W.player && isIll(c)).sort((a, b) => (b.ill.k === '重病') - (a.ill.k === '重病'));
const famDoctorAct = () => { const L = sickHome(), one = L.length === 1 ? L[0] : null;
  return mkAct({ id: 'doctorFam', kind: 'doctor', n: one ? '给' + nm(one) + '请医' : '给家人请医', ap: 1, fish: 40, gold: L.some(c => c.ill.k === '重病'),
    hint: one ? one.ill.k + ' · 治好' + R(cureP() * 100) + '%' : L.length + ' 人病着 · 治好' + R(cureP() * 100) + '%', no: () => W.fish < 40 ? '鱼干不够 40' : '',
    fn: () => { const go = c => { if (W.fish < 40 || !isIll(c) || !spendAp(1)) return; addFish(-40); cure(c); };
      if (one) go(one); else pickChar('给谁请医？ ◆1', sickHome(), go, c => ({ txt: c.ill.k, col: ILL[c.ill.k].col, v: c.ill.k === '重病' ? 2 : c.ill.k === '咳疾' ? 1 : 0 })); } }); };
EV.ill = e => {
  const c = C(e && e.a); if (!alive(c) || !isIll(c)) return null;
  const me = c.id === W.player, k = c.ill.k;
  const TXT = { 风寒: '着了凉，咳个不停。', 咳疾: '落下了咳嗽的病根，夜里睡不好。', 重病: '病倒了，几天水米不进。' };
  return { title: k, who: [c.id], text: (me ? '你' : who(c)) + TXT[k],
    opts: [opt('请医', '鱼干-40 · 治好' + R(cureP() * 100) + '%', () => { addFish(-40); cure(c); }, () => W.fish >= 40),
      opt(me ? '熬过去' : '先养着', ILL[k].d, () => {})] };
};
// coping traits (from the breakdown card): while 心烦 lasts each takes 15 off it a season, at a price
const COPE = { 舔毛成癖: '心烦时健康-2/季', 暴食: '心烦时鱼干-10/季', 夜游: '谋+1', 拆家: '心烦时家人好感-3' };
// how much 心烦 fades by itself each season (tuned with the balance harness: hardships add up, rest and company take it off)
const STRESS_FADE = 2;
Object.assign(TR, {
  舔毛成癖: { s: [0, 0, 0, 0], k: 'cope' }, 暴食: { s: [0, 0, 0, 0], k: 'cope' }, 夜游: { s: [0, 0, 0, 1], k: 'cope' }, 拆家: { s: [0, 0, 0, 0], k: 'cope' },
  豪商: { s: [0, 2, 0, 0], k: 'life' }, 清望: { s: [0, 0, 2, 0], k: 'life' }, 情种: { s: [0, 0, 1, 0], k: 'life' }, 伤疤: { s: [1, 0, 0, 0], k: 'life' }, 跛足: { s: [-2, 0, 0, 0], k: 'life' },
});
// earned traits carry a dot on the card
const trLabel = t => TR[t] && (TR[t].k === 'life' || TR[t].k === 'cope') ? '·' + t : t;
function gainTrait(c, t, why) {
  if (!c || c.tr.includes(t)) return false;
  c.tr.push(t); if (c.id === W.player) logLine('获得特质：' + t + (why ? '（' + why + '）' : ''), '#ffe08a');
  return true;
}
// a wound (other systems: a lost fight, a failed murder): health -20, and a scar, or now and then a limp
function addWound(c) {
  if (!alive(c)) return; addHealth(c, -20);
  if (!c.tr.includes('跛足') && (c.tr.includes('伤疤') || chance(.25))) gainTrait(c, '跛足', '武-2'); else gainTrait(c, '伤疤', '武+1');
}
const EARN_TRAIT = 1000;
// lifetime earnings: every rise of the store between two looks counts (actions, seasons, windfalls)
function trackEarn() { const p = P(); if (!alive(p) || !W.gr) return; const d = W.fish - W.gr.fs; if (d > 0) p.earn = (p.earn || 0) + d; W.gr.fs = W.fish; }
const isFriendG = (a, b) => typeof isFriend === 'function' ? isFriend(a, b) : !!((a.rel[b.id] && a.rel[b.id].tag === 'friend') || (b.rel[a.id] && b.rel[a.id].tag === 'friend'));
let EAR = 0;   // 耳目: 谋 +2 (≈ +15%) while a 刺探 / 打听 is being rolled
function earWrap(a, dc) {
  const f = a.fn; a.fn = () => { EAR = 2; try { f(); } finally { EAR = 0; } };
  if (dc) { EAR = 2; const h = chkHint(3, dc); EAR = 0; a.hint = String(a.hint || '').replace(/谋 \d+%/, h); }
}
// 宾客: 结交 brings two new faces to choose from
function meetTwo() {
  const p = P(), pool = hereList('tavern').concat(hereList('market')).filter(c => !c.hist && Math.abs(rel(c, p).op) < 5), out = [];
  while (out.length < 2) {
    let c = pool.length && chance(.6) ? pool.splice(Math.floor(Math.random() * pool.length), 1)[0] : null;
    if (!c) {
      const female = chance(.5);
      c = mkc({ sur: pick(SURS), name: pick(female ? GIV_F : GIV_M), female, born: W.t - 4 * (17 + Math.floor(Math.random() * 16)), loc: 'tavern', role: chance(.5) ? 'shi' : 'commoner', robe: null });
      if (c.role === 'shi') c.robe = 'shi';
    }
    out.push(c);
  }
  pickChar('结交谁？ ◆1', out, c => { if (!spendAp(1)) return; addOp(c, p, 10 + Math.floor(stat(p, 2) / 2)); didAct('meet', c, 2, true); openSheet(c.id); });
}

// ---------------------------------------------------------- 家法: the heir, the law, succession and regency
const LAWN = { 嫡长: '立嫡长', 择贤: '择贤' }, HEIRC = '#9a7424';
// by custom: children, then grandchildren, siblings, siblings' children, other 狸; parents last (never "by custom");
// those who walked out or were disinherited only if nobody else is left
function succRank(old) {
  const childOf = (a, b) => !!a && !!b && (a.dad === b.id || a.mom === b.id);
  const sib = x => x !== old && ((old.dad && x.dad === old.dad) || (old.mom && x.mom === old.mom));
  return c => {
    let r = childOf(c, old) ? 0 : [c.dad, c.mom].some(id => childOf(C(id), old)) ? 1 : sib(c) ? 2
      : [c.dad, c.mom].some(id => { const x = C(id); return x && sib(x); }) ? 3 : childOf(old, c) || c.id === W.flags.elder ? 9 : 4;
    if ((c.flags.left || c.flags.disinh) && r < 9) r += 5;
    return r;
  };
}
// [cat, rank] for every living 狸 but the head, best first
function succCands(old) {
  const rk = succRank(old);
  return family().filter(c => c.id !== old.id && !royalOut(c)).map(c => [c, rk(c)])
    .sort((a, b) => a[1] - b[1] || (ageOf(b[0]) >= 16) - (ageOf(a[0]) >= 16) || (a[0].female - b[0].female) || a[0].born - b[0].born);
}
// who would take over if the head died now: the law's heir among the children unless someone ranks above them, else the
// first by custom. This is the cat with the gold 嗣 tag.
function heirNow(old) {
  old = old || P(); if (!old) return null;
  const L = succCands(old), h0 = heirOf(old), best = L.find(x => x[1] < 9), r0 = h0 && L.find(x => x[0] === h0);
  return r0 && (!best || r0[1] <= best[1]) ? h0 : best ? best[0] : null;
}
const succInfo = (old, h) => { const rk = succRank(old), RN = ['子女', '孙辈', '手足', '侄辈', '族人'];
  return c => { const r = rk(c); return { txt: c === h ? '嗣' : r >= 9 ? '长辈' : r >= 5 ? (c.flags.disinh ? '已废' : '离家') : RN[r], col: c === h ? HEIRC : '#5f5236', v: c === h ? 1 : -r }; }; };
// a head under 16: the surviving parent under your roof, else the eldest grown 狸 at home, else any grown-up there
function pickRegent(c) {
  const hh = household().filter(x => x !== c && ageOf(x) >= 16), par = [c.mom, c.dad].map(C).filter(x => alive(x) && ageOf(x) >= 16);
  // (else a grown 狸 of a cadet house: an uncle in town before one far away)
  const kin = family().filter(x => x !== c && ageOf(x) >= 16 && !royalOut(x)).sort((a, b) => !!inCity(b) - !!inCity(a) || a.born - b.born);
  return par.find(x => hh.includes(x)) || hh.filter(x => x.house === 'li').sort((a, b) => a.born - b.born)[0] || par[0] || hh[0] || kin[0] || null;
}
function takeOver(old, c, h) {
  if (!alive(c)) return;
  kinOnSuccession(old, c);
  chronicle('succession', nm(c) + '接掌狸家', '前任家主：' + nm(old) + '。名望承接七成，家业继续。', c.id);
  W.player = c.id; PORT.clear(); MINI.clear();
  if (h && h !== c && alive(h) && ageOf(h) >= 16) { passOver(h, 45); logLine(nm(h) + '被越过了。' + ta(h) + '不会忘记这件事。', '#ff9a8a'); }
  // a head from a cadet house (or one who had walked out) moves back into 狸宅 with their family
  if (c.loc !== 'home' || c.flags.branch || c.flags.left) bringHome(c);
  // the new head learns about half of what the old one knew
  for (const s of W.secrets) if (knows(s, old.id) && !knows(s, c.id) && chance(.5)) s.known.push(c.id);
  delete c.flags.disinh; W.heirId = null; W.regent = null;
  // the name was the old head's as much as the house's; a new head starts over part of the way, and grieves
  const pr = W.prest; W.prest = R(W.prest * .7); if (pr > W.prest) toast('名望 -' + (pr - W.prest) + '（家主换人）', '#ff9a8a');
  if (W.gr) W.gr.py = W.prest;
  addStress(c, 20, '丧亲'); c.flags.coT = W.t;
  // a child head: a regent minds the house until sixteen (W.flags.minor: the 亲政 card comes even if no regent is left by then)
  delete W.flags.minor;
  if (ageOf(c) < 16) { W.flags.minor = true; const r = pickRegent(c); if (r) { W.regent = r.id; W.queue.unshift({ ev: 'regency', a: r.id }); } else logLine('家里没有大人了，你自己当家', '#c8e0ff'); }
  headOffice(old);
  W.ap = apMax(c); W.flags.skipAp = false; W.loc = 'home';
  homeTick();
}
// what a new head keeps of the old one's place: a crown passes on, 相邦 and 仲父 don't (ACT2's newHead), and a child holds
// no office at all until sixteen (the house keeps a 舍人's place; 客卿 comes back through the court's own cards)
function headOffice(old) {
  if (typeof newHead === 'function' && W.a2 && W.flags.act1Done) { newHead(old.id); W.a2.pid = W.player; }
  if (ageOf(P()) < 16 && W.rank > 1 && W.kingId !== W.player) { W.rank = 1; PORT.clear(); MINI.clear(); logLine('新家主年纪还小，官位交了回去', '#c8e0ff'); }
}
EV.regency = e => {
  const r = C(e && e.a), p = P(); if (!alive(r) || !alive(p)) return null;
  return { title: '摄政', who: [p.id, r.id], text: `你才${ageOf(p)}岁。到你十六岁之前，家里的事由${who(r)}替你拿主意。`,
    opts: [opt('「是。」', '每季精力 1 · 十二岁起 2 · 到十六岁', () => {})] };
};
// the regent keeps the books, not always straight
EV.regent = e => {
  const r = C(e && e.a), p = P(); if (!alive(r) || !alive(p) || W.regent !== r.id) return null;
  return { title: '账目', who: [r.id], text: `${who(r)}替你管着家。这一年的账上，少了四十条鱼干。`,
    opts: [opt('「算了，都是自家人。」', '鱼干-40 · ' + ta(r) + '好感+5', () => { addFish(-40); addOp(r, p, 5); }),
      opt('「把账本拿来。」', chkHint(3, 9) + ' · 败则鱼干-40 · ' + ta(r) + '好感-15', () => {
        if (chk(3, 9)) { addOp(r, p, -5); toast('鱼干找回来了', '#9fe89a'); } else { addFish(-40); addOp(r, p, -15); toast(nm(r) + '把账本摔在你面前', '#ff9a8a'); } })] };
};
EV.qinzheng = e => {
  const r = C(e && e.a), p = P(); if (!alive(p)) return null;
  const R0 = alive(r) ? r : null;
  return { title: '亲政', who: [p.id].concat(R0 ? [R0.id] : []), text: '你十六岁了。' + (R0 ? who(R0) + '把账本和钥匙交到你手里。' : '家里的账本和钥匙，从今天起归你管。'),
    opts: [opt('「这些年辛苦了。」', R0 ? ta(R0) + '好感+10' : '', () => { if (R0) addOp(R0, p, 10); }),
      opt('「从今天起，我说了算。」', '名望+5' + (R0 ? ' · ' + ta(R0) + '好感-5' : ''), () => { addPrest(5); if (R0) addOp(R0, p, -5); })] };
};

// ---------------------------------------------------------- hooks
SYS.init.push(W => {
  W.law = '嫡长'; W.heirId = null; W.regent = null; W.gr = { fs: W.fish, py: W.prest }; W.gv = 1;
  spawnYuqing();
});
SYS.load.push(W => {
  if (W.law === undefined) W.law = '嫡长';
  if (W.heirId === undefined) W.heirId = null;
  if (W.regent === undefined) W.regent = null;
  if (!W.gr) W.gr = { fs: W.fish, py: W.prest };
  if (!W.gv) {
    // saves from before growth: 心烦 ran 0–3, and a child could be head without anyone minding the house
    for (const c of Object.values(W.chars)) if (c.stress > 0 && c.stress <= 3) c.stress = Math.min(100, c.stress * 33);
    const p = P(); if (alive(p) && ageOf(p) < 16 && !W.regent) { const r = pickRegent(p); if (r) W.regent = r.id; }
    W.gv = 1;
  }
  if (!C('yuqing') && W.t < 60) spawnYuqing();
  spawnLimu();
  // the life trait for fame was called 名士, the same as career's fame tier: now 清望
  for (const c of Object.values(W.chars)) { const i = c.tr.indexOf('名士'); if (i >= 0) c.tr[i] = '清望'; }
  // a child head from before W.flags.minor
  { const p = P(); if (alive(p) && ageOf(p) < 16 && W.regent) W.flags.minor = true; }
});
SYS.did.push((kind, t, st, ok) => {
  const p = P(); if (!alive(p)) return;
  trackEarn();
  const i = kind === 'debate' ? st : XP_KIND[kind];
  if (i >= 0 && i <= 3) gainXp(p, i, ok && !XP_SURE.has(kind) ? 2 : 1);
  if (i === 2 && ok && t && t !== p && alive(t) && hasPerk('巧舌')) addOp(t, p, 2, true);
  // 心烦: company and the company of friends ease it; acting against your nature adds to it
  if (kind === 'company') { addStress(p, p.tr.includes('粘人') ? -20 : -10, '陪伴'); p.flags.coT = W.t; }
  if (kind === 'night') p.flags.coT = W.t;
  if (kind === 'tryst') { if (p.tr.includes('专一')) addStress(p, 10, '专一'); if (p.tr.includes('多情')) addStress(p, -15, '多情'); }
  if (kind === 'talk' && t && isFriendG(p, t)) addStress(p, -10, '挚友');
  if (['blackmail', 'expose', 'duel', 'murder'].includes(kind)) addStress(p, '胆小');
  // losing an argument or a fight in front of people stings
  if ((kind === 'debate' || kind === 'duel') && !ok) addStress(p, 5, '落败');
  { const dr = DRILLS.find(x => x[1] === kind); if (dr) toast(STATN[dr[2]] + '熟练 +' + (p.focus && p.focus.i === dr[2] ? 3 : 2), '#ffe08a'); }
  // you ended it yourself: no grief over it at the season's end
  if (kind === 'breakup' && t && p.flags.lovS) p.flags.lovS = p.flags.lovS.filter(x => x !== t.id);
  if (kind === 'lobby' && hasPerk('说客') && W.act === 1 && !W.flags.act1Done) {
    const b = Math.max(1, R(sendGain() * .25)); W.heir += b; W.credit.you += b; if (W.flags.allied) W.credit.lv += b >> 1; toast('说客：立嗣 +' + b, '#ffe08a');
  }
});
SYS.life.push(c => {
  const age = ageOf(c), me = c.id === W.player;
  // from 55, each birthday: 25% 武-1, 15% another stat -1 (never below 1)
  if (age >= 55 && (W.t - c.born) % 4 === 0) {
    const down = [];
    if (chance(.25) && c.st[0] > 1) { c.st[0]--; down.push(0); }
    if (chance(.15)) { const i = 1 + Math.floor(Math.random() * 3); if (c.st[i] > 1) { c.st[i]--; down.push(i); } }
    if (me && down.length) toast('年纪不饶人：' + down.map(i => STATN[i] + '-1').join(' '), '#ff9a8a');
  }
  if (isIll(c)) {
    const I = ILL[c.ill.k]; addHealth(c, I.hp);
    if (c.ill.k === '风寒' && --c.ill.left <= 0) { c.ill = null; if (me) toast('风寒好了', '#9fe89a'); }
    // a chronic cough now and then clears up by itself (5% a season); 请医 is the sure way
    else if (c.ill.k === '咳疾' && chance(.05)) { c.ill = null; if (me) toast('咳疾好了', '#9fe89a'); }
    else if (c.ill.k === '重病' && chance(c.health <= 0 ? .3 : .1)) { die(c); return; }
  } else if (age >= 16 && atHome(c) && chance(illP(c))) catchIll(c);
  if (me) {
    if (c.health < 85 && hasPerk('健体') && chance(.5)) addHealth(c, 1);
    if (stressLv(c) >= 3) addHealth(c, -1);
    if (c.tr.includes('舔毛成癖') && c.stress > 0) addHealth(c, -2);
  }
});
SYS.season.push(() => {
  const p = P(); if (!alive(p)) return;   // (a succession is pending: the new head starts fresh)
  trackEarn();
  if (p.flags.coT === undefined) p.flags.coT = W.t;
  spawnLimu();
  // regency: a regent who dies is replaced; at sixteen the head takes the keys (also when no regent was left by then)
  if (W.regent || W.flags.minor) {
    if (ageOf(p) >= 16) { W.queue.push({ ev: 'qinzheng', a: W.regent }); W.regent = null; delete W.flags.minor; }
    else if (W.regent && !alive(C(W.regent))) { const r = pickRegent(p); W.regent = r ? r.id : null; logLine(r ? nm(r) + '接着替你管家' : '家里没有大人了，你自己当家', '#c8e0ff'); }
  }
  // what the season cost you, given who you are
  if (W.ap > 0 && p.tr.includes('勤快')) addStress(p, 6, '勤快');
  if (W.fish < 30 && p.tr.includes('贪吃')) addStress(p, 8, '贪吃');
  // and what it cost anyone: an empty store, the city under siege
  if (W.fish === 0 && W.lastEcon && W.lastEcon.tout > W.lastEcon.tin) addStress(p, 8, '断粮');
  if (W.flags.siege && !W.flags.siegeFelt) { W.flags.siegeFelt = true; addStress(p, 10, '围城'); }
  for (const c of Object.values(W.chars)) if (c.dead !== null && W.t - c.dead <= 1 && c.id !== p.id && !c.flags.mourned && (c.sp === p.id || [c.mom, c.dad, c.bio].includes(p.id))) {
    c.flags.mourned = true; addStress(p, 30, c.sp === p.id ? '丧偶' : c.female ? '丧女' : '丧子');
  }
  for (const id of p.flags.lovS || []) if (!p.lov.includes(id) && p.sp !== id) addStress(p, 15, '情断');
  p.flags.lovS = p.lov.slice();
  const seen = p.flags.lovN || (p.flags.lovN = []); for (const id of p.lov) if (!seen.includes(id)) seen.push(id);
  // traits earned in life
  if ((p.earn || 0) >= EARN_TRAIT) gainTrait(p, '豪商', '政+2');
  if (W.prest >= 150) gainTrait(p, '清望', '交+2');
  if (seen.length >= 3) gainTrait(p, '情种', '交+1');
  // 心烦 fades by STRESS_FADE a season (15 more per coping trait), except at 100: then the breakdown comes first
  if (p.stress > 0 && p.stress < 100) p.stress = Math.max(0, p.stress - STRESS_FADE - 15 * Object.keys(COPE).filter(t => p.tr.includes(t)).length);
});
SYS.yearly.push(() => {
  const p = P(); if (!alive(p)) return;
  if (p.tr.includes('野心') && W.gr && W.prest <= W.gr.py) addStress(p, 10, '野心');
  if (W.gr) W.gr.py = W.prest;
  if (p.tr.includes('粘人') && W.t - p.flags.coT >= 4) addStress(p, 10, '粘人');
  if (W.regent && alive(C(W.regent)) && ageOf(p) < 16 && chance(.2)) W.queue.push({ ev: 'regent', a: W.regent });
});
SYS.stat.push((c, i) => {
  let v = 0;
  if (c.ill && c.ill.k === '咳疾') v--;
  const s = c.stress || 0; if (s >= 100) v -= 2; else if (s >= 67) v--;
  // a school learned from a master counts at its own ★, not the one from coming of age
  if (c.school) for (const t in c.school) if (TR[t] && c.tr.includes(t)) v += TR[t].s[i] * (c.school[t] - (c.eduLv || 1));
  if (EAR && i === 3 && c.id === W.player) v += EAR;
  return v;
});
SYS.opinion.push((a, b, add) => {
  if (b.id === W.player && b.tr.includes('拆家') && b.stress > 0 && atHome(a)) add('拆家', -3);
});
SYS.econ.push((inc, cost) => {
  const p = P(); if (!alive(p)) return;
  if (hasPerk('铺面')) inc.push(['铺面', 8]);
  if (hasPerk('精打细算')) { const u = cost.filter(x => String(x[0]).startsWith('家用')).reduce((t, x) => t + x[1], 0); if (u >= 5) inc.push(['精打细算', R(u * .2)]); }
  if (p.tr.includes('暴食') && p.stress > 0) cost.push(['暴食', 10]);
});
SYS.status.push((c, out) => {
  if (!alive(c)) return;
  if (isIll(c)) { const I = ILL[c.ill.k]; out.push({ n: c.ill.k, col: I.col, d: I.d + (c.ill.k === '风寒' ? ' · 还有 ' + c.ill.left + ' 季' : '') + ' · 请医可治' }); }
  const lv = stressLv(c);
  if (lv) out.push({ n: ['', '心烦', '焦躁', '崩溃'][lv], col: ['', '#b0608a', '#c0406a', '#a0203a'][lv],
    d: '心烦 ' + R(c.stress) + '/100' + (lv >= 2 ? ' · 四项-' + (lv - 1) : '') + (lv >= 3 ? ' · 健康-1/季' : ' · 闭门休养、陪伴可消') });
});
SYS.sheet.push((c, rows) => {
  if (!alive(c)) return;
  const p = P();
  if (c.id === W.player) {
    const f = c.focus ? FOCUS[c.focus.i] : null;
    rows.push(f ? { chip: '志·' + f.n, col: STATC[c.focus.i], text: f.perks.map(k => k[0] + (c.st[c.focus.i] >= k[1] ? '✓' : k[1])).join(' '), fn: openFocus }
      : { chip: '立志', col: HEIRC, text: '选一条路：兵家 商道 纵横 鬼谷 ›', fn: openFocus });
    const h = heirNow(), r = W.regent && C(W.regent);
    rows.push({ chip: '嗣', col: HEIRC, text: (h ? nm(h) : '无人可继') + ' · ' + LAWN[W.law || '嫡长'] + (h ? ' ›' : ''), fn: h ? () => openSheet(h.id) : null });
    if (alive(r)) rows.push({ chip: '摄政', col: '#6a5a8a', text: nm(r) + ' · 到你十六岁 ›', fn: () => openSheet(r.id) });
  } else if (c.house === 'li' && c === heirNow()) rows.push({ chip: '嗣', col: HEIRC, text: W.law === '择贤' && W.heirId === c.id ? '你立的继承人' : '狸家的继承人' });
  const mi = MASTERS[c.id];
  if (mi !== undefined && c.id !== W.player && p) {
    const n = (p.les && p.les[c.id]) || 0, g = schoolGain(p, mi), left = 3 - (n % 3), can = p.st[mi] < c.st[mi];
    const what = !can ? ta(c) + '教不了你更多了' : opinion(c, p) < 30 ? '好感 30 可求教' : n ? '求教 ' + n + ' 次' : '可以求教';
    rows.push({ chip: '名师·' + STATN[mi], col: '#3f8a5e', text: what + (can && g ? ' · ' + (left === 1 ? '下次' : '再 ' + left + ' 次') + g : '') });
  }
});
SYS.goal.push(() => {
  const p = P(); if (!alive(p)) return null;
  // (a doctor costs 40: with less in the store, the market comes first)
  const doc = (who, pri) => W.fish < 40 ? { s: '目标：攒够 40 鱼干，' + (who ? '给' + nm(who) : '') + '请医（市）', pri } : { s: '目标：' + (who ? '给' + nm(who) + '请医' : '请医治病') + '（家）', pri };
  if (isIll(p) && p.ill.k === '重病') return doc(null, 15);
  const sick = household().find(c => c !== p && isIll(c) && c.ill.k === '重病');
  if (sick) return doc(sick, 15);
  if (stressLv(p) >= 2) return { s: '目标：闭门休养，消消心烦（家）', pri: 45 };
  // a cough that won't go away: a gentler nudge than 重病
  if (isIll(p) && p.ill.k === '咳疾') return doc(null, 80);
  const cough = household().find(c => c !== p && isIll(c) && c.ill.k === '咳疾');
  if (cough) return doc(cough, 80);
  if (!p.focus && W.flags.act1Done) return { s: '目标：点自己的头像，立志（家）', pri: 85 };
  // a master of the way you chose who would take you on (and has something left to teach), until your first lesson
  if (W.flags.act1Done && p.focus && !(p.les && Object.keys(p.les).length) && ageOf(p) >= 16 && W.fish >= 20) for (const id in MASTERS) {
    const m = C(id), i = MASTERS[id];
    if (i === p.focus.i && inCity(m) && ageOf(m) >= 16 && p.st[i] < m.st[i] && !W.cool['les_' + id] && opinion(m, p) >= 30) return { s: '目标：向' + nm(m) + '求教（人）', pri: 89 };
  }
  return null;
});
SYS.card.push(p => {
  // xp bars under the four stats (the way you chose sits on gold); tap a stat for the numbers
  const xp = p.xp || [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) {
    const x = 42 + i * 24, need = xpNeed(p.st[i]), full = p.st[i] >= XP_CAP, foc = p.focus && p.focus.i === i, w = full ? 20 : R(20 * clamp(xp[i] / need, 0, 1));
    rect(x, 166, 20, 2, foc ? '#7a6030' : '#3a3040'); if (w > 0) rect(x, 166, w, 2, STATC[i]);
    hit(x - 1, 155, 23, 14, () => toast(STATN[i] + ' ' + stat(p, i) + ' · 熟练 ' + (full ? '已满' : xp[i] + '/' + need) + (foc ? ' · 志' : ''), '#f2ead4'));
  }
  // 心烦: the next pip fills from the bottom as it grows
  const s = p.stress || 0, lv = stressLv(p);
  if (lv < 3) { const a = [0, 34, 67][lv], b = [34, 67, 100][lv], hh = Math.floor(4 * (s - a) / (b - a)); if (hh > 0) rect(124 + lv * 5, 151 - hh, 4, hh, '#9a5a78'); }
  hit(95, 141, 45, 14, () => toast('健康 ' + R(p.health) + (isIll(p) ? '（' + p.ill.k + '）' : '') + ' · 心烦 ' + R(s) + '/100', '#f2ead4'));
  // a stat that just went up: a star rises off it
  if (GFX && T - GFX.t0 < 1.4) { const k = (T - GFX.t0) / 1.4; g.globalAlpha = 1 - k * k; img(ICON.star, 44 + GFX.i * 24, R(150 - k * 16)); g.globalAlpha = 1; }
});
SYS.tab.push((tab, A) => {
  const p = P(); if (!alive(p)) return;
  if (tab === 'home') {
    const i = A.findIndex(a => a.id === 'rest');
    if (i >= 0) A[i] = mkAct({ id: 'rest', kind: 'rest', n: '闭门休养', ap: 1, hint: '健康+15 · 心烦-25',
      fn: () => { if (!spendAp(1)) return; addHealth(p, 15); toast('健康 +15', '#c8e0ff'); addStress(p, -25, '休养'); didAct('rest', null, -1, true); } });
    // 武 has its own practice: the yard, a wooden sword, an hour every morning
    const wf = p.focus && p.focus.i === 0;
    // (and so has every other stat: a season at the books, at speeches, at the old stratagems)
    A.push(mkAct({ id: 'drill', kind: 'drill', n: '修习', ap: 1, hint: '武 政 交 谋 选一项 · 熟练+2',
      no: () => ageOf(p) < 8 ? '年纪太小' : '', fn: () => pickOpt('修习哪一项？ ◆1', DRILLS.map(([n, k, i]) => { const top = p.st[i] >= XP_CAP, f = p.focus && p.focus.i === i;
        return { n: n + ' · ' + STATN[i] + ' ' + p.st[i], s: top ? '已到顶 · 找「人」里标着名师的求教' : '熟练+' + (f ? 3 : 2) + (f ? '（志）' : '') + ' · 还差 ' + Math.max(0, xpNeed(p.st[i]) - ((p.xp || [])[i] || 0)), style: top ? 'off' : 'jade',
          fn: () => { if (top || !spendAp(1)) return; didAct(k, null, i, true); } }; })) }));
    if (isIll(p)) A.push(doctorAct(p));
    if (sickHome().length) A.push(famDoctorAct());
  }
  if (tab === 'people') {
    const m = A.find(a => a.id === 'meet'); if (m && hasPerk('宾客')) { m.hint = '两人任选'; m.fn = meetTwo; }
    const a = A.find(x => x.id === 'ask'); if (a && hasPerk('耳目')) earWrap(a);
  }
});
SYS.acts.push((c, A) => {
  const p = P(); if (!alive(p) || !alive(c) || !reach(c)) return;
  const spy = A.find(a => a.id === 'spy'); if (spy && hasPerk('耳目')) earWrap(spy, 11);
  // masters: 求教 for you, 送孩子来学 for the kids
  const mi = MASTERS[c.id];
  if (mi !== undefined && ageOf(c) >= 16 && ageOf(p) >= 16) {
    const op = opinion(c, p), cd = 'les_' + c.id, kids = () => kinPool().filter(k => ageOf(k) >= 6 && ageOf(k) < 16);
    const n = (p.les && p.les[c.id]) || 0, gain = 6 * (p.focus && p.focus.i === mi ? 1.5 : 1);
    const lg = lessonGain(p, c, mi);
    A.push(mkAct({ id: 'lesson', kind: 'lesson', n: '求教', ap: 1, fish: 20, grp: '友', hint: STATN[mi] + '熟练+' + gain + (lg ? ' · 这次' + lg : ''),
      no: () => op < 30 ? '好感需 30' : W.cool[cd] ? '再等 ' + W.cool[cd] + ' 季' : p.st[mi] >= c.st[mi] ? ta(c) + '教不了你更多了' : W.fish < 20 ? '鱼干不够 20' : '',
      fn: () => { if (!spendAp(1)) return; addFish(-20); W.cool[cd] = 2; lesson(c, mi); } }));
    A.push(mkAct({ id: 'lessonKid', kind: 'lessonKid', n: '送孩子来学', ap: 1, fish: 30, grp: '友', hint: '孩子' + LESSON[mi] + '+2',
      no: () => op < 30 ? '好感需 30' : !kids().length ? '没有 6~15 岁的孩子' : W.cool['kid' + cd] ? '再等 ' + W.cool['kid' + cd] + ' 季' : W.fish < 30 ? '鱼干不够 30' : '',
      fn: () => pickChar('送谁去' + nm(c) + '那里学？ ◆1', kids(), k => {
        if (!spendAp(1)) return; addFish(-30); W.cool['kid' + cd] = 2; k.edu = k.edu || [0, 0, 0, 0]; k.edu[mi] += 2; addOp(k, c, 5, true);
        toast(nm(k) + ' ' + LESSON[mi] + '+2', '#ffe08a'); didAct('lessonKid', k, mi, true); }) }));
  }
  // the head's own children: the house law
  if (c.house === 'li' && (c.dad === W.player || c.mom === W.player)) {
    const h = heirNow();
    if (W.law === '择贤' && c !== h && ageOf(c) >= 16) A.push(mkAct({ id: 'nameHeir', kind: 'nameHeir', n: '立为嗣', ap: 0, grp: '家', hint: '择贤 · ' + ta(c) + '好感+20',
      no: () => c.flags.disinh ? '已被废过' : c.flags.left ? ta(c) + '已离家' : '',
      fn: () => { W.heirId = c.id; kinOnHeirChange(); addMemo(c, p, '立为嗣', 20); logLine('你立' + nm(c) + '为嗣', '#ffe08a'); SFX.happy(); didAct('nameHeir', c, -1, true); } }));
    // (a child set aside remembers it, but doesn't yet plot or walk out over it)
    const grown = ageOf(c) >= 16;
    // (only when someone else would then inherit: with nobody else left the same cat stays heir, and each press would cost again)
    const nextIfOut = () => { const was = c.flags.disinh; c.flags.disinh = true; const nh = heirNow(); if (was) c.flags.disinh = was; else delete c.flags.disinh; return nh; };
    if (c === h) A.push(mkAct({ id: 'disinherit', kind: 'disinherit', n: '废嗣', ap: 0, grp: '家', hint: '换下一个人继承', danger: grown ? '名望-30 · 结仇' : '名望-30 · ' + ta(c) + '会记得',
      no: () => { const nh = nextIfOut(); return !nh || nh === c ? '没有别人可以继承' : ''; },
      fn: () => {
        const nh0 = nextIfOut(); if (!nh0 || nh0 === c) return;
        c.flags.disinh = true; if (W.heirId === c.id) W.heirId = null;
        kinOnHeirChange();
        addPrest(-30); addMemo(c, p, '废嗣', grown ? -30 : -15);
        if (grown) { passOver(c, clamp((c.disc || 0) + 50, 0, 100)); if (typeof makeRival === 'function') makeRival(c, p); else rel(c, p).tag = 'rival'; }
        const nh = heirNow(); logLine(nm(c) + '不再是嗣' + (nh ? '。嗣：' + nm(nh) : ''), '#ff9a8a'); didAct('disinherit', c, -1, true);
      } }));
  }
  if (isIll(c) && (c.house === 'li' || c.house === 'in')) A.push(doctorAct(c));
});
// ---- end growth
