// ==== SYS:social ==== 人情 · 活的世界
// 挚友 and 宿敌 are tags on a relation, set both ways (rel.tag); other code may still set a one-way 'rival' tag, so the
// checks look at both sides. On a cat's relation toward you: n counts what you have done together (didAct), hi / lo the
// seasons in a row they have liked you ≥60 / hated you ≤−50, lc a lover's cold seasons.
// W.soc: pid (the head these lists belong to), rv (rivals already announced), ym (rivals already beaten), debt (a loan
// from 郭纵), owe (who holds an unpaid debt over you — intrigue may turn it into a weak hook), shield (鲁仲连's 说情),
// proxy (毛遂's 代辩), guard (廉颇's men stay until this turn), xl (信陵君's door for the next caravan), fav1 (favours
// already used once), ask (rotates the kinds of favours friends ask).
const relTag = (a, b) => { const r = a && b && a.rel[b.id]; return r ? r.tag : undefined; };
function isFriend(a, b) { return !!a && !!b && a !== b && (relTag(a, b) === 'friend' || relTag(b, a) === 'friend'); }
function isRival(a, b) { return !!a && !!b && a !== b && (relTag(a, b) === 'rival' || relTag(b, a) === 'rival'); }
function tagBoth(a, b, t) {
  for (const [x, y] of [[a, b], [b, a]]) { const r = t ? rel(x, y) : x.rel[y.id]; if (!r) continue; if (t) r.tag = t; else delete r.tag; delete r.hi; delete r.lo; }
}
function befriend(a, b) { if (a && b && a !== b) tagBoth(a, b, 'friend'); }
function makeRival(a, b) { if (a && b && a !== b) tagBoth(a, b, 'rival'); }
// 鲁仲连's 说情: the next rumour or impeachment against you goes nowhere (whoever raises it calls this first)
function useShield() { const S = W && W.soc; if (!S || !S.shield) return false; S.shield = 0; logLine('鲁仲连替你说了话，这件事没闹起来', '#c8e0ff'); return true; }
// 廉颇's old soldiers watch the house for a year: the next thief, search or knife in the night meets them, once
// (guarded() asks; useGuard() is called where they actually step in, and sends them home)
function guarded() { const S = W && W.soc; return !!S && S.guard > W.t && alive(C('lianpo')); }
function useGuard() { if (!guarded()) return false; W.soc.guard = 0; logLine('廉颇的老兵挡了这一回，回营去了', '#c8e0ff', true); return true; }
// 毛遂 speaks for you in the next 舌战 (it is used up when a 'debate' is reported through didAct)
function proxyDebater() { const S = W && W.soc, c = S && S.proxy && C(S.proxy); return alive(c) ? c : null; }
const maxFriends = p => 3 + (p && p.tr.includes('好客') ? 1 : 0);
function friendsOf(p) { const out = []; if (p) for (const k in p.rel) if (p.rel[k].tag === 'friend') { const o = C(k); if (alive(o)) out.push(o); } return out; }
function rivalIds(p) { const out = []; if (p) for (const c of Object.values(W.chars)) if (alive(c) && c !== p && c.rel[p.id] && c.rel[p.id].tag === 'rival') out.push(c.id); return out; }
// everyone on either side of a feud with p (what the 人情 list and count show)
const rivalsOf = p => p ? Object.values(W.chars).filter(c => alive(c) && c !== p && isRival(c, p)) : [];
// (the three of the 立嗣 race stay out of friendships until it is over: that race is tuned on its own)
const raceThree = c => ['yiren', 'lv', 'zhaoji'].includes(c.id) && !W.flags.act1Done;
// stress relief that works with Phase 1's 0–3 心烦 and with growth's 0–100 (growth brings hasPerk and addStress(c, n, why))
function relieve(c, n, why) { if (!c) return; if (typeof hasPerk === 'function') addStress(c, -n, why); else c.stress = Math.max(0, (c.stress || 0) - (n >= 25 ? 2 : 1)); }
// someone you'd hear about: the famous, kin, and anyone you have dealt with more than once or who feels strongly about you
function knownCat(c) {
  const p = P(); if (!c || !p || c === p) return false;
  if (c.hist || relTo(c)) return true;
  const r = c.rel[p.id], q = p.rel[c.id];
  return !!((r && (r.n >= 2 || r.tag || Math.abs(r.op) >= 20)) || (q && q.tag));
}
// Offer the 知己 card now if c qualifies (intrigue's 笼络 may call this when it finishes)
// (far: by letter, for someone in another city, e.g. 信陵君 after the 虎符)
function offerFriend(c, far) {
  const p = P(); if (!alive(c) || !p || isFriend(c, p) || isRival(c, p) || raceThree(c) || friendsOf(p).length >= maxFriends(p) || W.queue.some(q => q.ev === 'zhiji')) return false;
  W.queue.push(Object.assign({ ev: 'zhiji', a: c.id }, far ? { far: 1 } : {})); return true;
}

// ---------------------------------------------------------- 求助: what each friend can do for you (every 4 seasons, no energy)
const FAVORS = {
  pingyuan: { n: '引荐', hint: () => '名望+8' + (!W.soc.fav1.pingyuan && typeof addMerit === 'function' ? ' · 功名+5' : ''),
    fn: c => { addPrest(8); if (!W.soc.fav1.pingyuan) { W.soc.fav1.pingyuan = 1; if (typeof addMerit === 'function') addMerit(5, nm(c) + '引荐'); } logLine(nm(c) + '在宾客面前引荐了你', '#c8e0ff', true); } },
  // (a loan left unpaid ends the credit line until it is paid back in fish)
  guozong: { n: '借钱', hint: () => '鱼干+200 · 8 季内还 240 · 逾期：好感-40 · 被拿住把柄', no: () => W.soc.debt ? '还欠着 ' + W.soc.debt.n : W.soc.owe === 'guozong' ? '旧账还没了结' : W.soc.bad.guozong ? '赖过账，他不肯再借' : '',
    fn: c => { addFish(200); W.soc.debt = { id: c.id, n: 240, due: W.t + 8 }; logLine('向' + nm(c) + '借了 200 鱼干，8 季内还 240', '#ffe08a'); } },
  lzl: { n: '说情', hint: () => '下回有人说你坏话，他出面', no: () => W.soc.shield ? '已经托过了' : '',
    fn: c => { W.soc.shield = 1; toast(nm(c) + '答应替你说话', '#c8e0ff'); } },
  maosui: { n: '代辩', need: () => typeof startDuel === 'function', hint: c => '下一场舌战由' + ta(c) + '出面 · 交' + stat(c, 2), no: () => W.soc.proxy ? '已经托过了' : '',
    fn: c => { W.soc.proxy = c.id; toast(nm(c) + '答应替你出面', '#c8e0ff'); } },
  lianpo: { n: '护卫', hint: () => '一年内，下回有贼、搜城或刺客，他的兵挡一次', no: () => guarded() ? '他的兵还在' : '',
    fn: c => { W.soc.guard = W.t + 4; logLine(nm(c) + '派了几个老兵守在狸宅', '#c8e0ff', true); } },
  zhaoji: { n: '吕府的消息', need: () => alive(C('lv')), hint: () => '吕不韦的功劳和打算', fn: c => lvNews(c) },
  xinling: { n: '大梁的门', remote: 1, hint: () => '下一趟远途商队多赚 60', no: () => W.soc.xl ? '已经托过了' : '',
    fn: c => { W.soc.xl = 1; toast(nm(c) + '会让大梁的人接应你的商队', '#c8e0ff'); } },
  // (the promise counts for merit once; after that it is a good word that raises your name a little)
  yiren: { n: '许诺', remote: 1, hint: () => !W.soc.fav1.yiren && typeof addMerit === 'function' ? '功名+10' : '名望+3',
    fn: c => { if (!W.soc.fav1.yiren && typeof addMerit === 'function') { W.soc.fav1.yiren = 1; addMerit(10, nm(c) + '许诺'); } else addPrest(3); toast(nm(c) + '：「他日必不相负。」', '#ffe08a'); } },
};
const FAVOR_ANY = { n: '打听', hint: c => ta(c) + '身边的秘密', fn: c => askAround(c) };
const favorOf = c => { const f = FAVORS[c.id]; return f && (!f.need || f.need()) ? f : FAVOR_ANY; };
// a friend passes on what they know about their own people (or, with nothing to tell, helps out with a little fish)
function askAround(c) {
  const circle = [c.id, c.sp, c.mom, c.dad].concat(c.lov, c.kids).filter(Boolean);
  const pool = W.secrets.filter(s => !s.exposed && !knows(s) && (knows(s, c.id) || [s.subj, s.other, s.kid].some(id => id && circle.includes(id))));
  if (pool.length) { const s = pick(pool); s.known.push(W.player); logLine('得知秘密：' + secretText(s), '#ffb0d0'); SFX.secret(); return; }
  addFish(30); toast(nm(c) + '没打听到什么，塞给你一包鱼干', '#dddddd');
}
function lvNews(c) {
  const lv = C('lv'), p = P(), a1 = W.act === 1 && !W.flags.act1Done;
  const plan = !a1 ? '他近来常往宫里跑。' : W.heir >= 100 ? '他在备出城的金子。' : W.flags.allied ? '他说这笔买卖和你一人一半。' :
    W.flags.lvRival ? '他让下人在外头说你的坏话。' : W.flags.lvCareless ? '他说你成不了事。' : '他又备了一车礼，要送去咸阳。';
  discoverSecret(['lv'], 0, true);
  showCard({ title: '吕府的消息', who: [c.id, 'lv'], text: `${nm(c)}趁吕不韦不在，压低了声音：「${a1 ? '立嗣的功劳，他记了 ' + W.credit.lv + '。' : ''}${plan}」\n吕不韦对你：${opinion(lv, p)}`,
    opts: [opt('「记下了。」', '', () => {})] });
}
const socHint = c => { const f = favorOf(c); return f.n + ' · ' + f.hint(c); };
SYS.acts.push((c, A) => {
  const p = P(), S = W.soc; if (!S || !p || !alive(c) || c === p) return;
  if (isFriend(c, p) && ageOf(c) >= 16 && (reach(c) || favorOf(c).remote)) {
    const f = favorOf(c), cd = 'fav_' + c.id;
    A.push(mkAct({ id: 'favor', kind: 'favor', n: '求助', ap: 0, grp: '友', remote: !!f.remote, hint: socHint(c),
      no: () => W.cool[cd] ? '刚求过，再等 ' + W.cool[cd] + ' 季' : (f.no && f.no()) || '',
      fn: () => { W.cool[cd] = 4; f.fn(c); didAct('favor', c, 2, true); } }));
  }
  // a loan is repaid on the lender's card (gold: it is the thing to do; a messenger can carry the money to another city)
  if (S.debt && S.debt.id === c.id) {
    const d = S.debt;
    A.push(mkAct({ id: 'repay', kind: 'repay', n: '还钱', ap: 0, fish: d.n, gold: true, hint: '还剩 ' + Math.max(0, d.due - W.t) + ' 季', no: () => W.fish < d.n ? '鱼干不够 ' + d.n : '',
      fn: () => { if (S.debt !== d || W.fish < d.n) return; addFish(-d.n); S.debt = null; addMemo(c, p, '守信', 10, 16); logLine('还清了' + nm(c) + '的钱', '#9fe89a', true); didAct('repay', c, 1, true); } }));
  }
});

// ---------------------------------------------------------- what the others remember (SYS.did)
// every friendly thing you do with a cat counts toward knowing them (rel.n); the big moments become memories
const HOSTILE = new Set(['spy', 'expose', 'blackmail', 'divorce', 'breakup', 'dismiss', 'disinherit', 'scheme', 'murder', 'frame', 'slander', 'rumor', 'extort']);
// a cure paid for by you (growth's 请医, whatever it calls the kind) is remembered as a life saved
const CURE = new Set(['heal', 'cure', 'doctor', 'physician']);
SYS.did.push((kind, t, st, ok) => {
  const p = P(), S = W.soc; if (!p || !S) return;
  if (kind === 'debate') S.proxy = null;
  if (kind === 'caravan' && ok && S.xl) { S.xl = 0; addFish(60); toast('信陵君的人在大梁接应了你的商队', '#ffe08a'); }
  if (!t || t === p) return;
  if (!HOSTILE.has(kind)) { const r = rel(t, p); r.n = Math.min(99, (r.n || 0) + 1); }
  const wasFriend = x => !!p.rel[x.id] && p.rel[x.id].tag === 'friend';
  // turning on a friend is remembered for life; beating a rival is 扬眉
  const betray = x => { addMemo(x, p, '背叛', -60); makeRival(x, p); };
  // (growth's own did hook eases 心烦 after talking with a friend; this is the fallback without it)
  if (kind === 'talk' && isFriend(t, p) && typeof isFriendG !== 'function') relieve(p, 10, '挚友');
  if (kind === 'hire' && ok) addMemo(t, p, '知遇', 5, 40);
  // saving someone from 重病 is remembered as a life saved; any other cure (and any cure of the people you live with) as care
  if (CURE.has(kind) && ok) { const home = household().includes(t) || t.id === p.sp;
    if (t.flags.cureK === '重病' && !home) addMemo(t, p, '救命', 30, 40); else addMemo(t, p, '照料', 10, 8); }
  if (kind === 'expose') {
    const s = W.secrets.slice().reverse().find(x => x.exposed && (x.subj === t.id || x.other === t.id));
    for (const [x, v] of [[s ? C(s.subj) : t, -40], [s && C(s.other), -20]]) {
      if (!x || x === p) continue;
      if (wasFriend(x)) betray(x);
      else if (S.rv.includes(x.id)) { S.rv = S.rv.filter(id => id !== x.id); if (!S.ym.includes(x.id)) { S.ym.push(x.id); W.queue.push({ ev: 'yangmei', a: x.id, k: 'beat' }); } }
      else addMemo(x, p, '揭发我', v, 40);
    }
  }
  if (kind === 'blackmail') { if (wasFriend(t)) betray(t); else if (ok) addMemo(t, p, '勒索我', -25, 20); }
  // the spouses who know about this affair don't forget it quickly
  if (kind === 'tryst') for (const x of [p, t]) {
    const sp = x.sp && C(x.sp), y = x === p ? t : p;
    if (!alive(sp) || sp === p || sp === t || memoOf(sp, p, '撞见私情')) continue;
    if (W.secrets.some(s => s.type === 'affair' && [s.subj, s.other].includes(x.id) && [s.subj, s.other].includes(y.id) && s.known.includes(sp.id))) addMemo(sp, p, '撞见私情', -30, 24);
  }
});

// ---------------------------------------------------------- the season: friends, rivals, lovers, debts, and the town
let JB = [];   // this season's news for the 季报 card (built and shown within one endSeason, never saved)
let RV1 = false;   // a 宿敌 card already came this season (one a season; the rest go to the log)
function newRival(c, k) {
  const S = W.soc; if (!S.rv.includes(c.id)) S.rv.push(c.id);
  // a relative who walked out already said so on the 出走 card; a grieving family comes as one card, the others in the log
  if ((c.house === 'li' && c.flags.left) || RV1) { logLine(nm(c) + '从此与你为敌', '#ff9a8a', true); return; }
  if (!W.queue.some(q => q.ev === 'sudi' && q.a === c.id)) { W.queue.push({ ev: 'sudi', a: c.id, k }); RV1 = true; }
}
SYS.season.push(() => {
  JB = [];
  const p = P(), S = W.soc; if (!S || !alive(p)) return;
  // a new head of house starts without the old one's feuds (pid is null until the first season: the prologue picks the head)
  if (S.pid && S.pid !== p.id) { S.rv = rivalIds(p); S.ym = []; }
  S.pid = p.id;
  const all = Object.values(W.chars), fmax = maxFriends(p);
  let nf = friendsOf(p).length, offer = W.queue.some(q => q.ev === 'zhiji');
  RV1 = W.queue.some(q => q.ev === 'sudi');
  for (const c of all) {
    if (c === p || !alive(c)) continue;
    const r = c.rel[p.id]; if (!r) continue;
    const mine = p.rel[c.id];
    if (r.tag === 'rival') {
      if (mine && mine.tag === 'friend') delete mine.tag;   // someone else's rival tag (a failed blackmail …) ended the friendship
      delete r.hi; delete r.lo;
      // (a kit's grudge is announced the season it comes of age)
      if (!S.rv.includes(c.id) && !S.ym.includes(c.id) && ageOf(c) >= 16) newRival(c, 'act');
      continue;
    }
    if (r.tag === 'friend' || ageOf(c) < 16) continue;
    const o = opinion(c, p);
    if (o >= 60 && c.id !== p.sp && !p.lov.includes(c.id)) {
      r.hi = Math.min(9, (r.hi || 0) + 1);
      if (r.hi >= 4 && (r.n || 0) >= 4 && nf < fmax && !offer && !W.cool['zj_' + c.id] && reach(c) && !raceThree(c)) { W.queue.push({ ev: 'zhiji', a: c.id }); offer = true; nf++; }
    } else delete r.hi;
    if (o <= -50) { r.lo = (r.lo || 0) + 1; if (r.lo >= 4) { makeRival(c, p); newRival(c, 'low'); } }
    else delete r.lo;
  }
  // rivals who died: 扬眉 (not over your own blood: a son or brother who turned on you is mourned, not toasted)
  for (const id of S.rv.slice()) {
    const c = C(id), gone = () => { S.rv = S.rv.filter(x => x !== id); };
    if (!c) gone();
    else if (!alive(c)) { gone(); if (c.house === 'li' || closeKin(c, p)) logLine(nm(c) + '到死也没有跟你和好', '#dddddd', true); else W.queue.push({ ev: 'yangmei', a: id, k: 'die' }); }
    else if (!isRival(c, p)) gone();
  }
  // a lover who has gone cold for two seasons: 情断
  for (const id of p.lov) {
    const l = C(id); if (!alive(l)) continue;
    const r = rel(l, p);
    if (opinion(l, p) < 10) { r.lc = (r.lc || 0) + 1; if (r.lc >= 2) { delete r.lc; if (!W.queue.some(q => q.ev === 'qingduan' && q.a === id)) W.queue.push({ ev: 'qingduan', a: id }); } }
    else delete r.lc;
  }
  // 郭纵's loan
  if (S.debt) {
    const d = S.debt, c = C(d.id);
    if (!alive(c)) S.debt = null;
    else if (W.t >= d.due) { S.debt = null; S.owe = c.id; S.oweN = d.n; S.bad[c.id] = 1; addMemo(c, p, '赖账', -40, 40); logLine('欠' + nm(c) + '的钱没还上。' + ta(c) + '记下了这笔账', '#ff9a8a'); }
  }
  // what a friend borrowed comes back after a year
  if (S.lent && S.lent.length) S.lent = S.lent.filter(([id, n, t]) => { if (W.t < t) return true; const c = C(id); if (alive(c)) { addFish(n, true); logLine(nm(c) + '还了你 ' + n + ' 鱼干', '#ffe08a', true); } return false; });
  worldSeason(all);
});

// ---------------------------------------------------------- the living world: the town marries, has children, strays, and new people move in
// Town couples (not the house's people: lifeTick already handles everyone relevant()) conceive while the city has room;
// a lover's child becomes a real bastard secret. A town short of grown-ups gets a newcomer each season.
const CITY_CAP = 45, TOWN_MIN = 14, NPC_SECRETS = 6;
const ORIGIN = [['临淄', '齐'], ['大梁', '魏'], ['郢', '楚'], ['新郑', '韩'], ['蓟', '燕'], ['洛阳', '周'], ['濮阳', '卫'], ['邯郸', '赵'], ['咸阳', '秦']];
function townAdults() { let n = 0; for (const c of Object.values(W.chars)) if (alive(c) && !c.hist && c.loc !== 'home' && cityOf(c) === W.city && ageOf(c) >= 16) n++; return n; }
function newcomer(quiet) {
  const here = CITY[W.city] ? CITY[W.city].n : '', [from, st] = pick(ORIGIN.filter(o => o[0] !== here));
  const female = chance(.45), x = Math.random(), role = x < .45 ? 'shi' : x < .75 ? 'merchant' : 'commoner';
  const loc = W.city !== 'handan' ? CITY[W.city].locs[0] : role === 'shi' ? (chance(.3) ? 'pingyuan' : 'tavern') : role === 'merchant' ? 'market' : pick(['market', 'tavern']);
  const c = mkc({ sur: pick(SURS), name: pick(female ? GIV_F : GIV_M), female, born: W.t - 4 * (18 + Math.floor(Math.random() * 16)), loc, role, state: st,
    robe: role === 'shi' ? 'shi' : role === 'merchant' ? 'merchant' : null });
  if (role === 'shi') { const b = c.st.indexOf(Math.max(...c.st)); c.st[b] += 3; }
  if (!quiet) { logLine(nm(c) + '从' + from + '来，在' + (LOCN[loc] || here) + '住下', '#dddddd', true); JB.push({ id: c.id, s: nm(c) + '从' + from + '来', k: 'new' }); }
  return c;
}
// live secrets among townsfolk only (not you, not the house): the town keeps at most NPC_SECRETS of them
function npcSecrets() {
  let n = 0;
  for (const s of W.secrets) {
    if (s.exposed || !alive(C(s.subj))) continue;
    if ([s.subj, s.other, s.kid].some(id => { const x = id && C(id); return !!x && (x.id === W.player || x.house === 'li' || x.house === 'in'); })) continue;
    n++;
  }
  return n;
}
function worldSeason(all) {
  const pop = {};
  // (cadet houses count as the clan, not as the town's crowd)
  for (const c of all) if (alive(c) && !(c.flags.branch && (c.house === 'li' || c.house === 'in'))) { const k = cityOf(c); if (k) pop[k] = (pop[k] || 0) + 1; }
  let sec = null;
  for (const c of all) {
    if (!alive(c) || !c.female || c.preg || c.hist || c.flags.barren || c.id === W.player) continue;
    const a = ageOf(c); if (a < 16 || a > 40) continue;
    const k = cityOf(c); if (!k || pop[k] >= CITY_CAP || relevant(c)) continue;
    const nk = c.kids.length, fert = (a > 34 ? .5 : 1) * (nk >= 4 ? .35 : nk >= 2 ? .7 : 1), sp = c.sp && C(c.sp);
    if (alive(sp) && !sp.hist && sameCity(sp, c) && chance(.05 * fert)) { setPreg(c, sp.id); pop[k]++; continue; }
    for (const id of c.lov) {
      const o = C(id); if (!alive(o) || o.female || o.hist || o.id === W.player || ageOf(o) < 16 || !sameCity(o, c)) continue;
      if (sec === null) sec = npcSecrets();
      if (sec < NPC_SECRETS && chance(.015 * fert)) { setPreg(c, o.id); pop[k]++; sec++; }
      break;
    }
  }
  if (townAdults() < TOWN_MIN) newcomer(false);
}
// the house's own people stray through npcAffair (lifeTick); these are the others
const houseSide = c => c.sp === W.player || (c.loc === 'home' && !c.flags.branch) || c.house === 'li' || c.house === 'in' || nearYou(c) || nearYou(C(c.sp));
function startAffair(c, world) {
  const pool = Object.values(W.chars).filter(o => alive(o) && o !== c && o.id !== c.sp && !o.hist && o.id !== W.player && o.female !== c.female && ageOf(o) >= 16 && ageOf(o) <= 50 &&
    !o.lov.length && o.loc !== 'home' && o.house !== 'li' && o.house !== 'in' && sameCity(o, c));
  for (let i = 0; i < 4 && pool.length; i++) {
    const o = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    if (closeKin(o, c)) continue;
    c.lov.push(o.id); o.lov.push(c.id); const s = addSecret('affair', c.id, o.id); if (world) s.w = 1;
    return true;
  }
  return false;
}
// how much two cats take to each other (cheap: their stored goodwill and their characters)
function likeScore(a, b) {
  let s = ((a.rel[b.id] || {}).op || 0) + ((b.rel[a.id] || {}).op || 0);
  for (const t of a.tr) { if (!TR[t] || TR[t].k) continue; if (b.tr.includes(t)) s += 5; if (TR[t].op && b.tr.includes(TR[t].op)) s -= 7; }
  return s;
}
// single townsfolk of 18–40 marry at 12% a year, each to the unmarried cat of the other sex in town they get on with best
function worldWeddings() {
  const ok = c => alive(c) && !c.sp && !c.hist && c.id !== W.player && c.loc !== 'home' && c.loc !== 'away' && c.house !== 'li' && c.house !== 'in' && c.house !== 'ret' &&
    !W.ret.includes(c.id) && ageOf(c) >= 18 && ageOf(c) <= 45 && !!cityOf(c);
  const pool = Object.values(W.chars).filter(ok), wed = new Set();
  for (const a of pool) {
    if (wed.has(a.id) || ageOf(a) > 40 || !chance(.12)) continue;
    let best = null, bs = -1e9;
    for (const b of pool) {
      // (同姓不婚: townsfolk of one surname count as one clan)
      if (b === a || wed.has(b.id) || b.female === a.female || b.sur === a.sur || cityOf(b) !== cityOf(a) || Math.abs(a.born - b.born) > 60) continue;
      const s = likeScore(a, b) + Math.random() * 20;
      if (s > bs && !closeKin(a, b)) { bs = s; best = b; }
    }
    if (!best || bs < 0) continue;
    wed.add(a.id); wed.add(best.id);
    const m = a.female ? best : a, f = a.female ? a : best;
    marry(m, f);
    if (f.loc !== m.loc && (m.loc === 'market' || m.loc === 'tavern')) f.loc = m.loc;
    if (knownCat(m) || knownCat(f)) { JB.push({ id: (knownCat(m) ? m : f).id, s: nm(m) + '娶了' + nm(f), k: 'wed', big: 1 }); logLine(nm(m) + '娶了' + nm(f), '#f2ead4', true); }
  }
}
// married townsfolk (not the story's protected figures, not the house) start affairs at 4% a year (多情 8%)
function worldAffairs() {
  let n = npcSecrets(); if (n >= NPC_SECRETS) return;
  for (const c of Object.values(W.chars)) {
    if (!alive(c) || !c.sp || c.lov.length || c.immortal || c.id === W.player || ageOf(c) < 16 || !cityOf(c) || houseSide(c)) continue;
    if (!alive(C(c.sp)) || !chance(c.tr.includes('多情') ? .08 : c.tr.includes('专一') ? .012 : .04)) continue;
    if (startAffair(c, true) && ++n >= NPC_SECRETS) return;
  }
}
// a townsfolk's kit grows up without a ceremony: a schooling trait from the best stat and one more trait of character
function npcComeOfAge(c) {
  const best = c.st.indexOf(Math.max(...c.st));
  c.tr = c.tr.filter(t => !EDU.includes(t)); c.tr.push(EDU[best]); c.eduLv = 1;
  const x = randPers(Math.random, 1, c.tr.concat(c.tr.map(t => TR[t] && TR[t].op)))[0];
  if (x && !c.tr.includes(x)) c.tr.push(x);
}
SYS.life.push(c => {
  if (!c.hist && c.house !== 'li' && (W.t - c.born) % 4 === 0 && ageOf(c) === 16 && !c.tr.some(t => EDU.includes(t))) { if (nearYou(c)) comeOfAge(c); else npcComeOfAge(c); }
  // your spouse strays about 1% a season: npcAffair's .6% plus this
  if (c.sp === W.player && !c.hist && !c.lov.length && ageOf(c) >= 16) {
    const p = P(); let pr = .004 * (c.tr.includes('多情') ? 3 : c.tr.includes('专一') ? .3 : 1);
    if (opinion(c, p) < 0) pr *= 2; if (!sameCity(c, p)) pr *= 2;
    if (chance(pr)) startAffair(c, false);
  }
});
SYS.yearly.push(() => {
  // townsfolk remarry: a long-dead cat kept for a living child may still name a later spouse whom pruneDead (same tick) let go
  for (const c of Object.values(W.chars)) if (c.sp && !W.chars[c.sp]) c.sp = null;
  const p = P(), S = W.soc; if (!S || !alive(p)) return;
  worldWeddings(); worldAffairs();
  // the town's affairs that died with the lovers, which you never heard of, are forgotten (so pruneDead can let them go)
  W.secrets = W.secrets.filter(s => !(s.w && !s.exposed && !knows(s) && (!alive(C(s.subj)) || !alive(C(s.other)))));
  S.ym = S.ym.filter(id => alive(C(id)));
  // a friend asks something of you once in a while (not the three of the 立嗣 race while it runs: that race is tuned on its own)
  const fs = friendsOf(p).filter(c => reach(c) && ageOf(c) >= 16 && !raceThree(c));
  if (fs.length && chance(.5)) { const c = pick(fs); W.queue.push({ ev: 'fask', a: c.id, k: (askKin(c) ? ['grave', 'time', 'word'] : ['loan', 'time', 'word'])[S.ask++ % 3] }); }
  // rivals make trouble: intrigue's schemes do this for the cunning ones (谋 6+), the rest come the plain way
  const rs = S.rv.map(C).filter(c => alive(c) && reach(c) && ageOf(c) >= 16 && c.loc !== 'home' && (typeof startScheme !== 'function' || stat(c, 3) < 6));
  if (rs.length && chance(.2)) W.queue.push({ ev: 'rivalhit', a: pick(rs).id, k: pick(['rumor', 'smash', 'steal']) });
});
// ---------------------------------------------------------- NPC wants (light): a notable cat may want one thing; help with it through the
// ordinary actions and they remember it (了却心愿 +30 for 16 seasons). c.want = { k, o (the cat they hate), u (until) }.
const WANTS = {
  wed: { n: '想成家', how: c => '提亲，把狸家的人许给' + ta(c), ok: c => !c.sp && ageOf(c) <= 45 && canWed(c) && !c.immortal && c.role !== 'ruler',
    done: (k, t, c) => (k === 'propose' || k === 'match') && t === c && !!c.sp },
  rich: { n: '手头紧', how: () => '送礼', ok: c => !c.hist || c.id === 'yiren', done: (k, t, c) => k === 'gift' && t === c },
  post: { n: '想出仕', how: () => '招为门客', ok: c => c.role === 'shi' && !c.hist, done: (k, t, c, ok) => k === 'hire' && t === c && ok },
  meet: { n: '想结交你', how: () => '交谈', memo: [15, 12], ok: c => { if (c.role === 'ruler') return false; const o = opinion(c, P()); return o >= 0 && o < 40 && !isFriend(c, P()); },
    done: (k, t, c) => (k === 'talk' || k === 'gift' || k === 'pay') && t === c },
  hate: { n: '想报仇', how: c => { const o = C(c.want.o); return o ? '揭发' + nm(o) : ''; }, ok: c => !!foeOf(c), done: (k, t, c) => (k === 'expose' || k === 'blackmail') && !!t && t.id === c.want.o },
};
// someone c hates who isn't you
function foeOf(c) { for (const k in c.rel) { const r = c.rel[k], o = C(k); if (o && alive(o) && o.id !== W.player && (r.tag === 'rival' || r.op <= -30)) return o; } return null; }
// (the three cats of the 立嗣 race want nothing extra while it runs: that race is tuned on its own)
const wantable = c => alive(c) && ageOf(c) >= 16 && inCity(c) && c.loc !== 'home' && c.id !== W.player && !W.ret.includes(c.id) && c.house !== 'li' && c.house !== 'in' &&
  !(['yiren', 'lv', 'zhaoji'].includes(c.id) && !W.flags.act1Done) && (c.hist || ['noble', 'minister', 'general', 'shi', 'merchant', 'hostage'].includes(c.role) || knownCat(c));
SYS.yearly.push(() => {
  if (!W.soc || !alive(P())) return;
  let n = 0; const free = [];
  for (const c of Object.values(W.chars)) {
    if (c.want && (!alive(c) || c.want.u <= W.t || !WANTS[c.want.k] || !WANTS[c.want.k].ok(c) || (c.want.o && !alive(C(c.want.o))))) delete c.want;
    if (c.want) n++; else if (wantable(c)) free.push(c);
  }
  while (n < 12 && free.length) {
    const c = free.splice(Math.floor(Math.random() * free.length), 1)[0];
    if (!chance(.35)) continue;
    // (wanting your company is the easy one to meet, so it comes up half as often)
    const ks = Object.keys(WANTS).filter(k => WANTS[k].ok(c)).flatMap(k => k === 'meet' ? [k] : [k, k]);
    if (!ks.length) continue;
    const k = pick(ks); c.want = { k, u: W.t + 16 }; if (k === 'hate') c.want.o = foeOf(c).id;
    n++;
  }
});
SYS.did.push((kind, t, st, ok) => {
  const p = P(); if (!p || !W.soc) return;
  // (a revenge want is met by bringing down someone else, so everyone's want is checked, not only the target's)
  const cs = kind === 'expose' || kind === 'blackmail' ? Object.values(W.chars).filter(c => c.want && c.want.k === 'hate') : t && t.want ? [t] : [];
  for (const c of cs) {
    const w = WANTS[c.want.k]; if (!alive(c) || !w || !w.done(kind, t, c, ok)) continue;
    const mv = w.memo || [30, 16]; delete c.want; addMemo(c, p, '了却心愿', mv[0], mv[1]); toast(nm(c) + '了却了一桩心愿', '#9fe89a');
  }
});
SYS.sheet.push((c, rows) => {
  if (!c.want || !alive(c) || c.id === W.player || !WANTS[c.want.k]) return;
  const w = WANTS[c.want.k], how = w.how(c);
  rows.push({ chip: w.n, col: '#4a6a8a', text: how ? how + ' · 好感+' + (w.memo || [30])[0] : '' });
});

// the 季报 card: shown at the start of a season, only when someone you know married, had a child or died
SYS.sched.push(() => {
  const p = P(), rows = JB; JB = [];
  if (!W.soc || !alive(p)) return;
  const moms = new Set();
  for (const c of Object.values(W.chars)) {
    if (c.born === W.t && c.house !== 'li' && !c.hist && c.mom && !moms.has(c.mom)) {
      const m = C(c.mom), n = m ? m.kids.filter(k => { const x = C(k); return x && x.born === W.t; }).length : 0;
      if (m && (knownCat(m) || knownCat(C(c.dad))) && !W.queue.some(q => q.ev === 'born' && q.ids && q.ids.includes(c.id))) {
        moms.add(c.mom); rows.push({ id: m.id, s: nm(m) + '生了' + (n > 1 ? n + '个孩子' : c.female ? '个女儿' : '个儿子'), k: 'born', big: 1 });
      }
    }
    // (deaths the notices already told: the famous, retainers, the clan; and a death your own plot is about to report)
    if (c.dead === W.t && c !== p && c.house !== 'li' && c.house !== 'ret' && !c.hist && knownCat(c) && !W.queue.some(q => (q.ev === 'death' && q.a === c.id) || (q.ev === 'schDone' && q.s && q.s.target === c.id)))
      rows.push({ id: c.id, s: nm(c) + '去世了', k: 'die', big: 1 });
  }
  const big = rows.filter(r => r.big);
  if (!big.length || W.queue.some(q => q.ev === 'succession')) return;
  // one death alone is a notice; the card is for a wedding, a birth, or a season with more to tell
  if (big.length < 2 && !big.some(r => r.k === 'wed' || r.k === 'born')) { logLine(big[0].s, '#dddddd'); return; }
  rows.sort((a, b) => (b.big || 0) - (a.big || 0));
  W.queue.push({ ev: 'jibao', rows: rows.slice(0, 4), t: W.t });
});
// (queued like a card so the story comes first; it opens its own window)
EV.jibao = e => { if (e && e.rows && e.rows.length) MODAL.push({ type: 'jibao', hold: true, rows: e.rows.filter(r => C(r.id)), t: e.t }); return null; };

// ---------------------------------------------------------- cards
// someone under your roof (or your spouse): the friend, favour and rival cards speak of home, not of calling round
const homeCat = c => !!c && (household().includes(c) || c.id === P().sp);
// kin who ask something of you ask it as kin (no loans from the store you share)
const askKin = c => homeCat(c) || !!relTo(c) || closeKin(c, P());
EV.zhiji = e => {
  const c = C(e.a), p = P(); if (!alive(c) || !p || isFriend(c, p) || isRival(c, p) || friendsOf(p).length >= maxFriends(p) || raceThree(c)) return null;
  const king = c.role === 'ruler', meK = !!W.kingId && W.kingId === W.player && !homeCat(c);
  if (king) return { title: '知己', who: [c.id], text: `${nm(c)}退朝以后把你留下，一直说到掌灯。「${Ime(c)}身边，肯说真话的人不多。」`,
    opts: [opt('「臣记下了。」', '结为挚友 · 好感+25 · 挚友 ' + (friendsOf(p).length + 1) + '/' + maxFriends(p), () => { befriend(c, p); logLine('你与' + nm(c) + '结为挚友', '#ffe08a'); SFX.happy(); }),
      opt('「臣不敢当。」', '不结为挚友', () => { W.cool['zj_' + c.id] = 12; const r = c.rel[p.id]; if (r) delete r.hi; })] };
  const line = meK ? `散朝以后，${who(c)}没有走，等到殿里只剩你们两个：「王上有事，只管吩咐。」` : c.id === 'yiren' && c.loc === 'hostage' ? `${nm(c)}送你到质子府门口，站了很久才开口：「在邯郸，肯来看我的只有你。他日我回了秦国，你有事，只管来找我。」` :
    c.id === 'xinling' ? `${nm(c)}托门客带来一封信：「邯郸之围，你的车队帮了大忙。他日到大梁，我的门为你开着。」` :
    homeCat(c) ? `晚饭后，${who(c)}留你说了很久的话。「家里的事，有我。」` :
    (c.tr.includes('高冷') ? `${who(c)}很少留人吃饭。今天留了你，还开了一坛好酒。` : c.tr.includes('粘人') ? `${who(c)}拉着你说到半夜，送到门口又说了半天。` : `${who(c)}送你到巷口，站了一会儿才开口。`) + '「以后有事，来找我。」';
  return { title: '知己', who: [c.id], text: line,
    opts: [opt(meK ? '「寡人记下了。」' : '「你也一样。」', '结为挚友 · 好感+25 · 可求助 · 挚友 ' + (friendsOf(p).length + 1) + '/' + maxFriends(p), () => { befriend(c, p); logLine('你与' + nm(c) + '结为挚友', '#ffe08a'); SFX.happy(); }),
      opt('「多谢。」', '不结为挚友', () => { W.cool['zj_' + c.id] = 12; const r = c.rel[p.id]; if (r) delete r.hi; })] };
};
EV.sudi = e => {
  const c = C(e.a), p = P(); if (!alive(c) || !p || !isRival(c, p)) return null;
  const home = homeCat(c);
  const text = home ? `饭桌上，${who(c)}一句话也没跟你说。家里人都看得出来。` : e.k === 'low' ? `${who(c)}在酒肆里当着众人说，狸家的事，${ta(c)}管定了。` : `${who(c)}托人带话给你：这笔账，${ta(c)}记下了。`;
  return { title: '宿敌', who: [c.id], text: text + '\n从此你们是宿敌。',
    opts: [opt('「那就走着瞧。」', '', () => {}),
      home ? opt('备一桌酒，请' + ta(c) + '坐下来', '鱼干-30 · 好感+15', () => { addFish(-30); addOp(c, p, 15); }, () => W.fish >= 30)
        : opt('托人送一份厚礼', '鱼干-50 · 好感+15', () => { addFish(-50); addOp(c, p, 15); }, () => W.fish >= 50),
      opt('登门赔罪', chkHint(2, 12) + ' · 成则化解 · 败则名望-3', () => {
        if (chk(2, 12)) { tagBoth(c, p, null); addMemo(c, p, '化解', 10, 16); logLine('你与' + nm(c) + '化解了恩怨', '#9fe89a'); } else { addPrest(-3); toast(nm(c) + '没有开门', '#ff9a8a'); } }, null, '仁厚')] };
};
EV.yangmei = e => {
  const c = C(e.a), p = P(); if (!c || !p) return null;
  const text = e.k === 'beat' ? `${nm(c)}的事传遍了${(CITY[W.city] || CITY.handan).n}。${ta(c)}再也没在你面前抬起过头。` : `${nm(c)}死了。这些年处处跟你作对的人，不在了。`;
  return { title: '扬眉', who: [c.id], text, opts: [opt('倒一杯酒', '名望+15 · 心烦↓', () => { addPrest(15); relieve(p, 30, '扬眉'); })] };
};
EV.qingduan = e => {
  const l = C(e.a), p = P(); if (!alive(l) || !p || !p.lov.includes(l.id)) return null;
  return { title: '情断', who: [l.id], text: `${nm(l)}这阵子总找借口不见你。上回见面，${ta(l)}一句话也没说。`,
    opts: [opt('「就到这里吧。」', '断绝私情', () => { endAffair(p, l); logLine('你与' + nm(l) + '断了往来', '#dddddd', true); didAct('breakup', l, -1, true); }),
      opt('送一份厚礼挽回', '鱼干-40 · 好感+20', () => { addFish(-40); addOp(l, p, 20); }, () => W.fish >= 40)] };
};
// a loan comes back a year later with a little more; what it is for depends on who asks
const lend = c => { addFish(-50); W.soc.lent = (W.soc.lent || []).concat([[c.id, 60, W.t + 4]]); };
const ASKS = {
  loan: c => ({ text: `${who(c)}来找你，` + (c.role === 'merchant' ? '说今年的货压在了手里' : ['noble', 'minister', 'ruler'].includes(c.role) ? '说府里一时周转不开' : c.role === 'shi' ? '说要出一趟远门，盘缠不够' : '说家里一时周转不开') + '，想借五十条鱼干，一年后还。',
    yes: ['「拿去吧。」', '鱼干-50 · 一年后还 60', () => lend(c), () => W.fish >= 50], no: '「我手头也紧。」' }),
  time: c => homeCat(c) ? { text: `${who(c)}想让你陪${ta(c)}回一趟娘家，住几天。`, yes: ['「好，我陪你去。」', '下季精力-1', () => { W.flags.skipAp = true; }], no: '「这阵子走不开。」' }
    : { text: `${who(c)}家里办喜事，请你一定去坐坐。`, yes: ['「一定到。」', '下季精力-1', () => { W.flags.skipAp = true; }], no: '「那几天走不开。」' },
  word: c => askKin(c) ? { text: `${who(c)}跟族里的人起了争执，想请你出面说句话。`, yes: ['「我去说。」', '名望-2', () => addPrest(-2)], no: '「自家人的事，你们自己说开。」' }
    : { text: `${who(c)}跟人起了争执，想请你出面说句公道话。`, yes: ['「我去说。」', '名望-2', () => addPrest(-2)], no: '「这事我不便插手。」' },
  grave: c => ({ text: `${who(c)}说快到祭日了，想让你陪${ta(c)}去给祖宗上坟。`, yes: ['「一起去。」', '下季精力-1', () => { W.flags.skipAp = true; }], no: '「今年你替我去吧。」' }),
};
EV.fask = e => {
  const c = C(e.a), p = P(); if (!alive(c) || !p || !isFriend(c, p) || !reach(c) || c.role === 'ruler' || (W.kingId && W.kingId === W.player)) return null;
  const A = (ASKS[e.k] || ASKS.time)(c);
  return { title: '请托', who: [c.id], text: A.text,
    opts: [opt(A.yes[0], A.yes[1] + ' · ' + ta(c) + '好感+10', () => { A.yes[2](); addMemo(c, p, '相助', 10, 16); }, A.yes[3]),
      opt(A.no, ta(c) + '好感-15', () => addMemo(c, p, '推托', -15, 16))] };
};
// a rival makes trouble (only while intrigue's own schemes aren't there to do it)
EV.rivalhit = e => {
  const r = C(e.a), p = P(); if (!alive(r) || !p || !isRival(r, p)) return null;
  if (e.k === 'rumor') {
    if (useShield()) return null;
    addStress(p, 10, '流言');
    return { title: '流言', who: [r.id], text: `城里在传狸家的秤不准，短斤少两。街坊说，话是从${nm(r)}那边出来的。`,
      opts: [opt('拿钱堵住这些嘴', '鱼干-40', () => addFish(-40), () => W.fish >= 40),
        opt('让人也说说' + nm(r), chkHint(3, 11) + ' · 成则名望+3 · 败则名望-6', () => { if (chk(3, 11)) { addPrest(3); addOp(r, p, -5, true); } else addPrest(-6); }, null, '狡诈'),
        opt(`「随${ta(r)}说。」`, '名望-5', () => addPrest(-5))] };
  }
  if (e.k === 'smash') {
    if (useGuard()) { logLine('夜里有人想砸你的铺子，被廉颇的老兵撵走了', '#c8e0ff'); return null; }
    return { title: '砸铺子', who: [r.id], text: `夜里有人砸了你的铺子，柜台劈成了两半。有人看见是${nm(r)}家的伙计。`,
      opts: [opt('认了，把铺子修好', '鱼干-50', () => addFish(-50)),
        opt('去官府告' + ta(r), chkHint(1, 10) + ' · 成则' + ta(r) + '赔 40 · 败则鱼干-50', () => {
          if (chk(1, 10)) { addFish(40); addOp(r, p, -10, true); toast(nm(r) + '赔了钱', '#ffe08a'); } else { addFish(-50); toast('官府不管这种事', '#ff9a8a'); } }),
        opt('带人上门讨个说法', chkHint(0, 10) + ' · 名望+6 · 败则健康-10', () => { if (chk(0, 10)) addPrest(6); else addHealth(p, -10); }, null, '勇猛')] };
  }
  return { title: '抢主顾', who: [r.id], text: `${nm(r)}在你的铺子对面压价，这一季的主顾少了一半。`,
    opts: [opt('跟着降价', '鱼干-40', () => addFish(-40)),
      opt('登门讲和', chkHint(2, 12) + ' · 成则' + ta(r) + '好感+20', () => { if (chk(2, 12)) addMemo(r, p, '讲和', 20, 8); else addOp(r, p, -5); }),
      opt(`「由${ta(r)}去。」`, '鱼干-20', () => addFish(-20))] };
};
// (鲁仲连's 说情 against the 吕府 rumour: intrigue's EV.rumor calls useShield itself)

// ---------------------------------------------------------- on the sheets
const icoBud = () => ICON.bud || (ICON.bud = rows(['G...G', 'GG.GG', '.GGG.', '..G..', '..G..'], { G: '#5a9a4a' }));
const icoCandle = () => ICON.candle || (ICON.candle = rows(['.O.', '.Y.', 'WWW', 'WWW', 'WWW', 'WWW'], { O: '#ff8a3a', Y: '#ffe14a', W: '#f2ead4' }));
const icoPack = () => ICON.pack || (ICON.pack = rows(['....S', '...S.', 'BBBB.', 'BBBB.', '.BB..'], { S: '#8a5a3a', B: '#c7a574' }));
const JBI = { wed: () => ICON.heart, born: icoBud, die: icoCandle, new: icoPack };
const sgn = v => (v > 0 ? '+' : '') + v;
function openBonds() {
  const p = P(), S = W.soc;
  const fr = friendsOf(p).map(c => { const cd = W.cool['fav_' + c.id], o = opinion(c, p); return { por: c, t: nm(c), s: '挚友 · ' + (!reach(c) && !favorOf(c).remote ? '人在' + placeOf(c) : cd ? '求助再等 ' + cd + ' 季' : '可以求助：' + favorOf(c).n), right: sgn(o), col: opCol(o), fn: () => openSheet(c.id) }; });
  const rv = rivalsOf(p).map(c => { const o = opinion(c, p); return { por: c, t: nm(c), s: '宿敌 · ' + placeOf(c), right: sgn(o), col: opCol(o), fn: () => openSheet(c.id) }; });
  openList('人情', fr.concat(rv), { sub: '挚友 ' + fr.length + '/' + maxFriends(p) + ' · 宿敌 ' + rv.length, empty: '还没有挚友，也没有宿敌' });
}
SYS.sheet.push((c, rows) => {
  const p = P(), S = W.soc; if (!S || !p) return;
  if (c === p) {
    const nf = friendsOf(p).length, nr = rivalsOf(p).length;
    if (nf || nr) rows.push({ chip: '人情', col: '#8a6a3a', text: '挚友 ' + nf + '/' + maxFriends(p) + (nr ? ' · 宿敌 ' + nr : '') + ' ›', fn: openBonds });
    return;
  }
  if (isFriend(c, p)) { const cd = W.cool['fav_' + c.id]; rows.push({ chip: '挚友', col: '#b08a2a', text: !alive(c) ? '' : !reach(c) && !favorOf(c).remote ? '人在' + placeOf(c) + ' · 书信往来' : cd ? '求助：再等 ' + cd + ' 季' : '可以求助：' + socHint(c) }); }
  else if (isRival(c, p)) rows.push({ chip: '宿敌', col: '#a0301f', text: alive(c) ? ta(c) + '处处跟你作对' : '' });
  else if (alive(c)) {
    const r = c.rel[p.id];
    if (r && r.hi > 0) rows.push({ chip: '投缘', col: '#4a8a5a', text: friendsOf(p).length >= maxFriends(p) ? '挚友已满 ' + maxFriends(p) + ' 人' :
      r.hi < 4 ? '好感保持 60 以上，再 ' + (4 - r.hi) + ' 季或成知己' : (r.n || 0) < 4 ? '多来往几次，或成知己' : '或成知己' });
    else if (r && r.lo > 0) rows.push({ chip: '积怨', col: '#96461a', text: '再 ' + (4 - r.lo) + ' 季，' + ta(c) + '就成了你的宿敌' });
  }
  if (S.debt && S.debt.id === c.id) rows.push({ chip: '欠债', col: '#a0301f', text: '欠' + ta(c) + ' ' + S.debt.n + ' 鱼干 · 还剩 ' + Math.max(0, S.debt.due - W.t) + ' 季' });
});
SYS.goal.push(() => {
  const d = W.soc && W.soc.debt; if (!d || d.due - W.t > 3) return null;
  // (in the last two seasons it goes before the story line: a default costs the lender's goodwill and a hook)
  return { s: '目标：还' + nm(C(d.id)) + ' ' + d.n + ' 鱼干，还剩 ' + Math.max(0, d.due - W.t) + ' 季（人）', pri: d.due - W.t <= 2 ? 9 : 25 };
});
// the 季报 window: up to 4 rows (who, what, an icon); tap a row to look at them, anywhere else to close
SYS.modal.jibao = m => {
  g.globalAlpha = .55; rect(0, 0, W_, H, '#0a0810'); g.globalAlpha = 1;
  const rs = m.rows, x = 16, w = 148, h = 34 + rs.length * 24 + 24, y = R((H - h) / 2);
  hit(0, 0, W_, H, () => drop(m));
  paper(x, y, w, h);
  rect(x + 44, y + 6, w - 88, 12, PAL.lacq); rect(x + 44, y + 17, w - 88, 1, PAL.jiang);
  txt('季报', 90, y + 12, 8, '#fff6dc', 'center', PAL.jiang);
  txt(yearTxt(m.t) + ' ' + SEASON[((m.t % 4) + 4) % 4], 90, y + 25, 5.5, LABC, 'center', null, 1, 1);
  rs.forEach((r, i) => {
    const c = C(r.id), ry = y + 31 + i * 24;
    if (c) {
      rect(x + 8, ry, 20, 23, '#e8dcc0');
      if (!alive(c)) g.globalAlpha = .45;
      img(mini(c), x + 10, ry + 1); g.globalAlpha = 1;
      hit(x + 6, ry, w - 12, 23, () => openSheet(c.id, true));
    }
    txt(fitT(r.s, w - 58, 6.5, 1), x + 33, ry + 12, 6.5, '#2a1a10', 'left', null, 1, 1);
    const ic = JBI[r.k] && JBI[r.k](); if (ic) img(ic, x + w - 11 - ic.width, R(ry + 12 - ic.height / 2));
    if (i < rs.length - 1) rect(x + 8, ry + 23, w - 16, 1, '#e0cfa8');
  });
  btn(60, y + h - 21, 60, 15, '好', 'dark', () => drop(m));
};

// ---------------------------------------------------------- new game / old saves
const socFresh = () => ({ pid: null, rv: [], ym: [], debt: null, owe: null, oweN: 0, bad: {}, lent: [], shield: 0, proxy: null, guard: 0, xl: 0, fav1: {}, ask: 0 });
SYS.init.push(() => {
  W.soc = socFresh();
  // the town starts with enough grown-ups to marry, hire and gossip about
  for (let i = 0; i < 12 && townAdults() < TOWN_MIN; i++) newcomer(true);
});
SYS.load.push(() => {
  const had = !!W.soc;
  W.soc = Object.assign(socFresh(), W.soc || {});
  // an old save's feuds are already known: no 宿敌 cards for them
  if (!had) W.soc.rv = rivalIds(P());
  // (a loan left unpaid before the credit line could close: it is closed now, until paid in fish)
  if (W.soc.owe && !W.soc.bad[W.soc.owe]) W.soc.bad[W.soc.owe] = 1;
});
// ---- end social
