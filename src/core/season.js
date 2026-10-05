// ============================================================ the season tick
function endSeason() {
  if (busy()) return;
  historyFlushPending();
  SFX.page();
  aiLv();
  // this season's books: [label, n] lines, so the breakdown can be shown (W.lastEcon) and systems can add their own
  const pp = P(), siegeNow = W.flags.siege && !W.flags.siegeOver;
  const hh = household(), kids = hh.filter(c => ageOf(c) < 16).length, rets = W.ret.filter(id => alive(C(id))).length;
  const inc = [[siegeNow ? '铺子（围城减半）' : '铺子', R((8 + stat(pp, 1)) * (siegeNow ? .5 : 1))]];
  // (the salary by rank, estates and treasures come from the career system's econ hook)
  // during the siege a stocked cellar feeds the house
  const cost = [[siegeNow && W.flags.stock ? '家用（吃存粮）' : '家用', siegeNow && W.flags.stock ? 0 : (hh.length - kids) * 3 + kids]];
  if (rets) cost.push(['门客', rets * 6]);
  runSys('econ', inc, cost);
  const tin = inc.reduce((t, x) => t + x[1], 0), tout = cost.reduce((t, x) => t + x[1], 0);
  W.lastEcon = { t: W.t, inc, cost, tin, tout };
  addFish(tin - tout, true);
  toast('本季 收入 +' + tin + ' 开销 -' + tout, '#f2ead4');
  if (W.fish === 0 && tout > tin) {
    // an empty store: the grown-ups at home grumble, and hired hands who go unpaid walk out
    addPrest(-2); W.news.push('鱼干见底了。家里人开始抱怨。');
    for (const c of hh) if (c.id !== W.player && ageOf(c) >= 16) { addOp(c, pp, -3, true); if (c.house === 'li' && c.id !== W.flags.elder) c.disc = clamp((c.disc || 0) + 2, 0, 100); }
    for (const id of W.ret.slice()) if (chance(.3)) { const r = C(id); W.ret = W.ret.filter(x => x !== id); if (r) { r.loc = 'tavern'; if (r.house === 'ret') r.house = null; logLine('门客' + nm(r) + '领不到饭钱，走了', '#ff9a8a'); } }
  }
  if (W.prest > 150) W.prest--;           // fame fades unless it is kept up
  W.t++;
  if (W.t % 8 === 0) pruneDead();
  for (const k in W.cool) if (--W.cool[k] <= 0) delete W.cool[k];
  lifeTick();
  // the new head is chosen before any other news of the same season
  { const i = W.queue.findIndex(q => q.ev === 'succession'); if (i > 0) W.queue.unshift(W.queue.splice(i, 1)[0]); }
  homeTick();
  const p = P(), live = alive(p);
  // discontent: a passed-over grudge grows (faster in the ambitious) until they like you again; other grumbling fades
  if (live) for (const c of family()) if (c.disc > 0 && c.id !== W.player) {
    c.disc = clamp(c.disc + (c.flags.passed ? (c.tr.includes('野心') ? 3 : 1) : -1) - (opinion(c, p) > 40 ? 2 : 0), 0, 100);
    if (!c.disc) delete c.flags.passed;
    if (c.disc >= 60 && chance(.25) && c.loc === 'home' && !c.flags.left && ageOf(c) >= 16 && !(c.flags.stay > W.t)) W.queue.push({ ev: 'leave', a: c.id });
  }
  // stored opinions slowly fade (a friend's goodwill doesn't); memories expire on their own clock and keep the relation
  // alive; how often you met (n) is kept while both live
  for (const c of Object.values(W.chars)) for (const k in c.rel) {
    const r = c.rel[k];
    if (r.op && !(r.op > 0 && r.tag === 'friend')) r.op = r.op > 0 ? Math.max(0, r.op - 1) : Math.min(0, r.op + 1);
    if (r.m) { r.m = r.m.filter(x => x.u === null || x.u > W.t); if (!r.m.length) delete r.m; }
    if (!r.op && !r.m && !r.tag && !r.hi && !r.lo && !r.lc && (!r.n || !alive(c) || !alive(C(k)))) delete c.rel[k];
  }
  // cards that waited a season (a full season before) come back first, so the systems see them queued
  if (W.later && W.later.length) { for (const q of W.later) if (!W.queue.some(x => x.ev === q.ev && x.a === q.a)) W.queue.push(q); W.later = []; }
  runSys('season');
  if (W.t % 4 === 0) runSys('yearly');
  scheduleEvents();
  orderQueue();
  // a dead head's traits and troubles don't pass to the heir (the succession card sets the new head's energy)
  if (live) {
    W.ap = apMax(p);
    // (a head with one point of energy pays it too: '下季精力-1' is never free)
    if (W.flags.skipAp) { W.ap = Math.max(0, W.ap - 1); W.flags.skipAp = false; }
    // 心烦 at 100 (growth's season hook doesn't let it fade on the edge): the breakdown card
    if (stressLv(p) >= 3 && !W.queue.some(q => q.ev === 'breakdown')) W.queue.push({ ev: 'breakdown' });
  }
  saveGame();
}
function lifeTick() {
  const all = Object.values(W.chars);
  // cadet branches have fewer children as the clan grows (full rate up to 30 living 狸, none from 50): the far ends of a
  // big clan stop being the house's business, and the 人 list stays readable
  const brK = clamp((50 - family().length) / 20, 0, 1);
  for (const c of all) {
    if (!alive(c)) continue;
    const age = ageOf(c);
    // the history books decide when the famous die
    if (histDue(c)) { die(c, HIST_GONE.has(c.id)); continue; }
    // births; a mother doesn't conceive again in the season she gives birth
    const due = c.preg && W.t >= c.preg.due;
    if (due) giveBirth(c);
    // new pregnancies (only for cats the story cares about; a cadet branch only while it is still close kin of the head)
    if (!due && c.female && !c.preg && !c.flags.barren && age >= 16 && age <= 40 && relevant(c) && (!c.flags.branch || branchNear(c))) {
      let partners = [];
      const sp = c.sp && C(c.sp);
      if (alive(sp) && sameCity(sp, c)) partners.push([sp, c.flags.branch || sp.flags.branch ? .03 * brK : .08]);
      for (const l of c.lov) { const o = C(l); if (alive(o) && sameCity(o, c) && !o.female) partners.push([o, c.flags.branch || o.flags.branch ? .02 * brK : .05]); }
      // historical figures only have the children history gives them, unless the father is you or a 狸
      if (c.hist) partners = partners.filter(([f]) => f.id === W.player || f.house === 'li');
      const nk = c.kids.length, fert = (age > 34 ? .5 : 1) * (nk >= 4 ? .35 : nk >= 2 ? .7 : 1);
      for (const [f, p] of partners) if (!f.female && ageOf(f) >= 16 && chance(p * fert)) { setPreg(c, f.id); break; }
    }
    // coming of age
    if (age === 16 && (W.t - c.born) % 4 === 0 && c.house === 'li') comeOfAge(c);
    // fur settles at age one: odd colours may betray a secret
    if (age === 1 && (W.t - c.born) % 4 === 0 && c.bio && c.dad && c.bio !== c.dad && c.mom) furCheck(c);
    // death (a mother carrying 政 is safe until he is born)
    if (!c.immortal && age >= 16 && !(c.preg && c.preg.id === 'zheng')) {
      let yr = age < 40 ? .006 : age < 50 ? .015 : age < 60 ? .04 : age < 70 ? .09 : .2;
      const cg = congenital(c).map(t => t.n);
      if (cg.includes('孱弱')) yr *= 2; else if (cg.includes('体弱')) yr *= 1.5; else if (cg.includes('健壮') || cg.includes('虎背熊腰')) yr *= .7;
      if (cg.includes('先天不足')) yr *= 1.6;
      if (c.health < 40) yr *= 2;
      if (chance(yr / 4)) { die(c); continue; }
    }
    if (c.health < 75 && chance(c.flags.postpartum > W.t ? .2 : .5)) addHealth(c, 1);
    npcAffair(c);
    // (a hook may end a life, e.g. growth's 重病: the later hooks leave the dead alone)
    for (const f of SYS.life) { if (!alive(c)) break; f(c); }
  }
}
// A cadet branch keeps having children while it is close kin of the head (siblings, nephews and nieces and their
// children, see closeKin); further out it drifts away from the house and the clan stops growing there.
function branchNear(c) {
  const p = P(); if (!p) return true;
  return closeKin(c, p) || (!!c.sp && alive(C(c.sp)) && closeKin(C(c.sp), p));
}
// married cats close to the house sometimes stray, so 冷落/味道/表哥 and the fur clues have something to find
function npcAffair(c) {
  if (c.hist || c.id === W.player || c.lov.length || ageOf(c) < 16) return;
  const sp = c.sp && C(c.sp); if (!alive(sp)) return;
  // only where the house can find out: your spouse, the household, your children and grandchildren and their spouses
  if (!(c.sp === W.player || (c.loc === 'home' && !c.flags.branch) || nearYou(c) || nearYou(sp))) return;
  let pr = .006;
  if (c.tr.includes('多情')) pr *= 3; else if (c.tr.includes('专一')) pr *= .3;
  if (opinion(c, sp) < 0) pr *= 2;
  if (!sameCity(c, sp)) pr *= 2;
  if (!chance(pr)) return;
  const pool = Object.values(W.chars).filter(o => alive(o) && o !== sp && !o.hist && o.id !== W.player && o.female !== c.female && ageOf(o) >= 16 && ageOf(o) <= 50 &&
    !o.lov.length && sameCity(o, c) && !closeKin(o, c) && o.loc !== 'home');
  if (!pool.length) return;
  const o = pick(pool);
  c.lov.push(o.id); o.lov.push(c.id); addSecret('affair', c.id, o.id);
}
// married-in widows stay while they raise 狸 children under the same roof; otherwise they go back to their own people
function homeTick() {
  for (const c of Object.values(W.chars)) if (alive(c) && c.house === 'in' && !c.sp && c.id !== W.player) {
    if (c.kids.some(k => { const x = C(k); return alive(x) && x.house === 'li' && x.loc === c.loc && !x.flags.left; })) continue;
    leaveHouse(c);
  }
}
function leaveHouse(c) {
  const wasHome = c.loc === 'home';
  // (no longer family: 'walked out' no longer means anything, and must not follow them if they are hired later)
  c.house = null; delete c.flags.branch; delete c.flags.left; if (wasHome) c.loc = 'market';
  if (wasHome) logLine(nm(c) + '搬出了狸宅', '#dddddd');
}
// Forget background cats who died long ago and tie into nothing we show (keeps the save small over many generations).
function pruneDead() {
  const keep = new Set();
  for (const c of Object.values(W.chars)) {
    if (c.house === 'li' || c.hist || alive(c) || W.t - c.dead < 80) keep.add(c.id);
    if (alive(c) || c.house === 'li') for (const k of [c.mom, c.dad, c.bio, c.sp]) if (k) keep.add(k);
  }
  for (const sc of W.secrets) if (!sc.exposed) for (const k of [sc.subj, sc.other, sc.kid]) if (k) keep.add(k);
  const gone = Object.keys(W.chars).filter(id => !keep.has(id));
  if (!gone.length) return;
  const g2 = new Set(gone);
  for (const id of gone) delete W.chars[id];
  for (const c of Object.values(W.chars)) { c.kids = c.kids.filter(k => !g2.has(k)); c.lov = c.lov.filter(k => !g2.has(k)); for (const k in c.rel) if (g2.has(k)) delete c.rel[k]; }
  // unexposed secrets keep their people alive above, so only exposed ones can lose someone here
  W.secrets = W.secrets.filter(sc => ![sc.subj, sc.other, sc.kid].some(k => k && g2.has(k)));
}
function relevant(c) {
  if (c.hist || c.house === 'li' || c.house === 'in') return true;
  const p = P(), s = c.sp && C(c.sp);
  return c.sp === W.player || c.lov.includes(W.player) || (s && s.house === 'li') || (p && p.lov.includes(c.id));
}
// family news the head hears in person: themselves, spouse, lovers, their own children and grandchildren (bastards included)
function nearYou(c) {
  const p = P(); if (!p || !c) return false;
  if (c.id === p.id || c.id === p.sp || p.lov.includes(c.id)) return true;
  const par = [c.mom, c.dad, c.bio];
  if (par.includes(p.id)) return true;
  return par.some(id => { const x = id && C(id); return x && [x.mom, x.dad, x.bio].includes(p.id); });
}
function setPreg(mom, f, extra) {
  if (mom.preg || mom.flags.barren) return;
  // sp = her husband when the child was conceived (decides who the legal father is)
  mom.preg = Object.assign({ f, sp: mom.sp || null, due: W.t + 3 }, extra || {});
  // a card only when the baby will be yours or your grandchild, or the mother is you, your spouse or a lover
  const p = P(), youOrKid = x => !!x && (x.id === W.player || [x.mom, x.dad, x.bio].includes(W.player));
  if (youOrKid(mom) || youOrKid(C(f)) || youOrKid(C(mom.sp)) || (p && (mom.id === p.sp || p.lov.includes(mom.id)))) W.queue.push({ ev: 'pregnant', a: mom.id });
}
// the mother's condition is shown on her card like a CK modifier
function statusOf(c) {
  const out = [];
  if (c.preg && alive(c)) out.push({ n: '有孕', col: '#d0608a', d: '还有 ' + Math.max(1, c.preg.due - W.t) + ' 季临盆 · 武-3' });
  if (c.flags.postpartum && W.t < c.flags.postpartum && alive(c)) out.push({ n: '产后体虚', col: '#8a7a9a', d: '健康恢复慢 · 武-2 · 还有 ' + (c.flags.postpartum - W.t) + ' 季' });
  if (alive(c) && c.health < 40) out.push({ n: '体弱', col: '#8a7a9a', d: '健康 ' + c.health + ' · 寿数减半 · 闭门休养可恢复' });
  runSys('status', c, out);
  return out;
}
function giveBirth(mom) {
  const pg = mom.preg, bio = C(pg.f), special = pg.name;
  if (!bio) { mom.preg = null; return; }
  const n = special ? 1 : (chance(.7) ? 1 : chance(.8) ? 2 : 3);
  // the legal father: the husband at conception if the child is his (even if he has died since), else her husband now
  const hus = pg.sp && C(pg.sp);
  const dad = hus && hus === bio ? bio : (mom.sp && alive(C(mom.sp)) ? C(mom.sp) : bio);
  const born = [];
  for (let i = 0; i < n; i++) {
    const g = breed(mom.g, bio.g, Math.random, pg.sex || (special ? 'M' : undefined));
    // a child takes the father's house; a 狸 mother passes hers on when she is the head, or when the father is a nobody
    const dh = dad.house === 'in' || dad.house === 'ret' ? null : dad.house;
    const house = special ? dh : (mom.house === 'li' && (mom.id === W.player || (dad.house !== 'li' && !dad.hist))) ? 'li' : dh;
    // a child of the father's house grows up where the father lives
    const loc = house !== 'li' && mom.house === 'li' && cityOf(dad) ? dad.loc : mom.loc;
    const k = mkc({ id: special ? pg.id : undefined, sur: house === 'li' ? '狸' : dad.sur, name: '', female: g.sex === 'F', born: W.t, mom: mom.id, dad: dad.id, bio: bio.id,
      g, house, loc, role: dad.role === 'ruler' || dad.role === 'hostage' ? 'noble' : dad.role === 'dancer' ? 'commoner' : dad.role,
      robe: dad.robe === 'qinPoor' ? 'qin' : dad.robe, state: dad.state, tr: [] });
    k.tr = randPers(Math.random, 2);
    k.st = [0, 1, 2, 3].map(i2 => Math.round((dad.st[i2] + mom.st[i2]) / 4 + 1 + Math.random() * 4));
    if (special) { k.disp = pg.disp; k.name = pg.name; k.hist = true; k.immortal = true; k.dieT = HISTD[k.id] !== undefined ? HISTD[k.id] : null; } else k.name = orderName(k);
    if (house === 'li' && loc !== 'home') k.flags.branch = true;
    mom.kids.push(k.id); dad.kids.push(k.id); if (bio !== dad) bio.kids.push(k.id);
    if (bio !== dad) addSecret('bastard', mom.id, bio.id, k.id);
    born.push(k);
  }
  mom.preg = null;
  kinOnBirth(mom, born);
  mom.flags.postpartum = W.t + 4; mom.health = Math.max(20, mom.health - 10);
  // a card for your children and grandchildren (bastards too) and for the babies of your spouse and lovers; the rest of the clan in the log
  const p = P(), hers = p && (mom.id === p.id || mom.id === p.sp || p.lov.includes(mom.id));
  if (born.some(k => k.hist || nearYou(k)) || hers) W.queue.unshift({ ev: 'born', ids: born.map(k => k.id) });
  else if (born.some(k => k.house === 'li') || mom.house === 'li') logLine(nm(mom) + '生下了' + (n > 1 ? n + '个孩子' : born[0].female ? '一个女儿' : '一个儿子'), '#f2ead4', true);
}
// who takes over when a ruler dies (story acts may take a death over by clearing its dieT; see HISTD)
function spawnHist(o) {
  if (C(o.id)) return C(o.id);
  // protected only while the history books still owe them a date; after act one a successor without one lives like anyone
  const c = mkc(Object.assign({ hist: true, immortal: HISTD[o.id] !== undefined || !W.flags.act1Done }, o));
  c.dieT = HISTD[c.id] !== undefined ? HISTD[c.id] : null;
  for (const pid of [c.dad, c.mom]) { const pa = C(pid); if (pa && !pa.kids.includes(c.id)) pa.kids.push(c.id); }
  return c;
}
// 秦 is gone: no king, and its offices, fiefs and 郎官 go with it. A state, not a date (W.a3.qinFell): a king off
// history's line after 前206 still gets an heir (kingCheck), and 秦 falls only when a line runs out.
function qinFall(s) {
  W.kingId = null; if (W.a3) W.a3.qinFell = true; logLine(s, '#c8e0ff');
  if (W.a2) W.a2.fief = false;
  if (W.rank >= 1 && W.rank <= 4) { W.rank = 0; W.patron = null; if (W.a2) W.a2.xiang = W.a2.zhongfu = null; PORT.clear(); MINI.clear(); logLine('秦亡了。狸家的官，也跟着没了', '#ff9a8a'); }
  for (const c of family()) if (c.flags.path === 'lang') {
    delete c.flags.path; if (c.id !== W.player) { c.loc = c.flags.left || c.flags.branch ? localLoc('tavern') : 'home'; c.role = 'merchant'; }
    if (W.a2 && W.a2.gone) W.a2.gone[c.id] = 1;
  }
  if (typeof CS !== 'undefined') CS.k = '';
}
// The 秦 kings: W.kingId follows the crown (see king() in ACT2). Their deaths are quiet (HIST_GONE): in 咸阳 act two's
// cards tell them (the log line stays quiet then); 政 and his mother come home in 前251 (ACT2's 归秦).
const HIST_NEXT = {
  zhao: () => {
    W.kingId = 'anguo';
    const a = C('anguo'); if (alive(a)) { a.disp = '秦孝文王'; a.role = 'ruler'; }
    const h = C('huayang'); if (alive(h)) h.disp = '华阳王后';
    logLine('秦昭王薨。安国君即位，是为秦孝文王。', '#c8e0ff', a2Here());
  },
  anguo: () => {
    W.kingId = 'yiren';
    const y = C('yiren'); if (alive(y)) { y.disp = '秦庄襄王'; y.role = 'ruler'; y.loc = cityOf(y) === 'xianyang' ? 'xpalace' : y.loc; }
    for (const [id, d] of [['huayang', '华阳太后'], ['xiaji', '夏太后']]) { const c = C(id); if (alive(c)) c.disp = d; }
    logLine('秦孝文王薨。子楚即位，是为秦庄襄王。', '#c8e0ff', a2Here());
  },
  yiren: () => {
    W.kingId = 'zheng'; if (W.a2) W.a2.wang = Math.max(W.a2.wang, 20);
    const z = C('zheng'); if (alive(z)) { z.disp = '秦王政'; z.role = 'ruler'; if (cityOf(z) === 'xianyang') z.loc = 'xpalace'; }
    const q = qm(); if (alive(q) && q.id === 'zhaoji') q.disp = '帝太后';
    logLine('秦庄襄王薨。太子政即位。', '#c8e0ff', a2Here());
  },
  zheng: c => {
    // (a 政 who left the story before his time — the night of his capping — has no 二世 after him)
    if (W.kingId && W.kingId !== 'zheng') return;
    spawnHist({ id: 'huhai', disp: '秦二世', sur: '嬴', name: '胡亥', born: bornAt(230), dad: 'zheng', role: 'ruler', robe: 'qin', state: '秦', loc: 'xpalace', tr: ['轻信', '慵懒', '狠辣'], st: [3, 3, 4, 3] });
    W.kingId = 'huhai';
    // (at court, the 沙丘 card asks who reigns next)
    const told = typeof a3Court === 'function' && a3Court() && W.a3 && W.a3.uni;
    logLine((W.a3 && W.a3.uni ? '始皇帝死在东巡的路上。' : nm(c) + '死在了巡行的路上。') + (told ? '' : '少子胡亥即位，是为秦二世。'), '#c8e0ff');
  },
  huhai: () => {
    spawnHist({ id: 'ziying', disp: '子婴', sur: '嬴', name: '婴', born: bornAt(240), role: 'ruler', robe: 'qin', state: '秦', loc: 'xpalace', tr: ['多疑', '节制'], st: [4, 7, 6, 9] });
    W.kingId = 'ziying'; logLine('赵高逼死了秦二世，立子婴为秦王。', '#c8e0ff');
  },
  ziying: () => qinFall('项羽进了咸阳，杀了子婴，烧了秦宫。'),
  zhaowang: () => {
    spawnHist({ id: 'daoxiang', disp: '赵悼襄王', sur: '赵', name: '偃', born: bornAt(266), dad: 'zhaowang', role: 'ruler', robe: 'zhaoKing', loc: 'palace', tr: ['轻信', '多情'], st: [5, 6, 7, 5] });
    spawnHist({ id: 'guokai', disp: '郭开', sur: '郭', name: '开', born: bornAt(282), role: 'minister', robe: 'zhao', loc: 'palace', tr: ['贪吃', '狡诈', '嫉妒'], st: [3, 8, 10, 14], g: { O: ['O'], size: [2, 2] } });
    logLine('赵孝成王薨。太子偃即位，是为赵悼襄王。宠臣郭开跟着进了宫。', '#c8e0ff');
  },
  daoxiang: () => {
    spawnHist({ id: 'zhaoqian', disp: '赵王迁', sur: '赵', name: '迁', born: bornAt(250), dad: 'daoxiang', role: 'ruler', robe: 'zhaoKing', loc: 'palace', tr: ['轻信', '慵懒'], st: [4, 5, 6, 4] });
    logLine('赵悼襄王薨。公子迁即位。', '#c8e0ff');
  },
  // (the realm decides when 赵 falls: see ACT3's season hook, which keeps him until then)
  zhaoqian: () => { if (!W.realm || rFallen('zhao')) logLine('秦军破邯郸，赵王迁被俘，押往房陵。邯郸从此归了秦。', '#c8e0ff'); },
};
// a 讣告 card only for people who matter to you; everyone else of note goes to the 近况 log
function deathCard(c) {
  const p = P(); if (!p) return false;
  if (nearYou(c) || closeKin(c, p) || (c.loc === 'home' && (c.house === 'li' || c.house === 'in'))) return true;
  if (c.lov.includes(p.id) || (c.rel[p.id] && c.rel[p.id].tag === 'friend') || (p.rel[c.id] && p.rel[c.id].tag === 'friend')) return true;
  // (the ruler of the city you live in; the rest of the world's kings are news)
  if (c.role === 'ruler' && cityRuler() === c) return true;
  return !!W.patron && c.id === W.patron;
}
function die(c, quiet) {
  // decide who hears about it before the links are cut
  const rl = relTo(c), wasRet = W.ret.includes(c.id), card = !quiet && c.id !== W.player && deathCard(c);
  c.dead = W.t; c.preg = null;
  const sp = c.sp && C(c.sp);
  if (sp && sp.sp === c.id) sp.sp = null;
  for (const l of c.lov.slice()) { const o = C(l); if (o) endAffair(c, o); }
  W.ret = W.ret.filter(id => id !== c.id);
  PORT.clear();
  if (c.id === W.player) { W.queue.unshift({ ev: 'succession' }); return; }
  if (HIST_NEXT[c.id]) HIST_NEXT[c.id](c);
  if (quiet) return;
  if (card) W.queue.unshift({ ev: 'death', a: c.id, rel: rl });
  else if (c.hist || c.house === 'li' || wasRet) logLine((wasRet ? '门客' : '') + nm(c) + '去世了，享年' + ageOf(c) + '岁', '#dddddd');
}
function comeOfAge(c) {
  const e = c.edu || [0, 0, 0, 0];
  let best = 0; for (let i = 1; i < 4; i++) if (e[i] > e[best]) best = i;
  const pts = e[best];
  if (!pts) best = c.st.indexOf(Math.max(...c.st));
  c.tr = c.tr.filter(t => !EDU.includes(t)); c.tr.push(EDU[best]);
  c.eduLv = pts >= 6 ? 3 : pts >= 3 ? 2 : 1;
  const extra = randPers(Math.random, 1, c.tr.concat(c.tr.map(t => TR[t] && TR[t].op)))[0];
  if (extra && !c.tr.includes(extra)) c.tr.push(extra);
  if (nearYou(c)) W.queue.push({ ev: 'coming', a: c.id });
  else logLine(nm(c) + '行了' + (c.female ? '笄礼' : '冠礼'), '#f2ead4', true);
}
function furCheck(k) {
  const mom = C(k.mom), dad = C(k.dad); if (!mom || !dad) return;
  const r = checkParentage(k, mom, dad);
  if (r.lvl < 3) return;
  const mine = k.dad === W.player || k.bio === W.player || k.mom === W.player || k.house === 'li' || k.hist;
  if (!mine) return;
  W.queue.push({ ev: 'furclue', a: k.id, why: r.why[0] });
}
