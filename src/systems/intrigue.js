// ==== SYS:intrigue ==== 计谋 · 把柄 · 门下
// Plots take seasons instead of one roll: progress, secrecy (a chance each season to be found out) and helpers who hate
// the same cat. Rivals plot back, unseen until you find them out. A secret you know, or a favour owed, is a hook (weak:
// one use; strong: again every 8 seasons). 门下: four seats with two tasks each, for retainers and grown kin.
// For the other systems (call through typeof): councilSeat(name), holdsHook(id), startScheme(type, target, opt),
// W.schemes, W.hooks; also giveHook(id, k, why) and exposeSec(secret, byId).
const hasPerkF = n => typeof hasPerk === 'function' && !!hasPerk(n);
const isFriendF = (a, b) => typeof isFriend === 'function' ? !!isFriend(a, b) : !!(a && b && a.rel[b.id] && a.rel[b.id].tag === 'friend');
const isRivalF = (a, b) => typeof isRival === 'function' ? !!isRival(a, b) : !!(a && b && a.rel[b.id] && a.rel[b.id].tag === 'rival');
// (turning a friend into an enemy is a betrayal they don't forget: social's 背叛, since its own check sees the new tag)
function mkRival(a, b) { if (!alive(a) || !b || a === b || a.id === W.player) return; if (b.id === W.player && isFriendF(a, b)) addMemo(a, b, '背叛', -60); if (typeof makeRival === 'function') makeRival(a, b); else rel(a, b).tag = 'rival'; }
function mkFriend(a, b) { if (typeof befriend === 'function') befriend(a, b); else { rel(a, b).tag = 'friend'; rel(b, a).tag = 'friend'; } }

// ---------------------------------------------------------- 门下: four seats, two tasks each (s = the seated cat's stat)
const SEATS = [
  { n: '家丁头', st: 0, t: ['护院', '押镖'], e: [s => ['-' + R(guardCut(s) * 100) + '%', '捉贼必胜 · 刺客得手 -' + R(guardCut(s) * 100) + '%'], s => ['+' + 3 * s + '%', '跑商队多赚 ' + 3 * s + '%']] },
  { n: '账房', st: 1, t: ['管账', '节用'], e: [s => ['+' + s, '每季鱼干 +' + s + estX(s)], s => ['-' + Math.min(30, 2 * s) + '%', '家用和门客开销 -' + Math.min(30, 2 * s) + '%' + estX(s)]] },
  { n: '说客', st: 2, t: ['交游', '游说'], e: [() => ['+2', '每季两位权贵好感 +2'], s => raceLobby() ? ['+' + lobbyGain(s), '你每遣使一回，立嗣再 +' + lobbyGain(s)] : ['+' + swayGain(s), '你的私事计谋每季 +' + swayGain(s) + (raceOn() ? ' · 立嗣还用不上' : '')]] },
  { n: '耳目', st: 3, t: ['打听', '防备'], e: [s => [Math.min(30, 2 * s) + '%', '每季 ' + Math.min(30, 2 * s) + '% 探得一件秘密'], s => ['-' + s, '暗算每季 -' + s + ' · 察觉 ' + s + '%']] },
];
// (either way a 账房 keeps the estates' books: they pay ×(1 + 政/20), see career's estMult)
const estX = s => typeof estKinds === 'function' && estKinds().length ? ' · 产业×' + (1 + s / 20).toFixed(2) : '';
// in act one a 说客 on 游说 goes along with each envoy you send to 咸阳 (+交/LOBBY_DIV to it: the seat alone moves
// nothing, your fish and energy still do the work); growth's 说客 perk (遣使、游说 +25%) makes both kinds go further
const LOBBY_DIV = 8;
const raceOn = () => W.act === 1 && !W.flags.act1Done && W.heir < 100;
const raceLobby = () => raceOn() && !!W.flags.knowHuayang && alive(C('yiren')) && opinion(C('yiren'), P()) >= 25;
const sayK = () => hasPerkF('说客') ? 1.25 : 1;
const lobbyGain = s => Math.floor(s / LOBBY_DIV * sayK());
// a seat filled for the first time starts on the task that matters now (the race, while it runs)
const defTask = n => n === '说客' && raceOn() ? 1 : 0;
const swayGain = s => R(s * sayK());
// 护院 cuts a killer's odds by 3% per point of 武 (at most by 60%); s given = for the hint, else the seated guard now
const guardCut = s => Math.min(.6, .03 * (s === undefined ? (seatOn('家丁头', 0) ? seatS('家丁头') : 0) : s));
// retainers and grown members of the household (spouse too) can sit; the head can't
function seatOk(c) { return alive(c) && c.id !== W.player && c.loc === 'home' && ageOf(c) >= 16 && (W.ret.includes(c.id) || household().includes(c)); }
function councilSeat(name) { const s = W && W.council && W.council[name], c = s && s.id ? C(s.id) : null; return c && seatOk(c) ? c : null; }
const seatDef = n => SEATS.find(S => S.n === n);
const seatS = n => { const c = councilSeat(n); return c ? stat(c, seatDef(n).st) : 0; };
const seatOn = (n, k) => !!councilSeat(n) && (W.council[n].task || 0) === k;
const seatOf = c => c && W.council ? SEATS.find(S => W.council[S.n] && W.council[S.n].id === c.id) || null : null;
const seatCands = () => adults(household()).concat(W.ret.map(C)).filter((c, i, a) => a.indexOf(c) === i && seatOk(c));
function unseat(n) {
  const cur = W.council[n]; if (!cur || !cur.id) return;
  const c = C(cur.id), p = P(), r = c && p && c.rel[p.id];
  if (r && r.m) { r.m = r.m.filter(x => x.k !== '受重用'); if (!r.m.length) delete r.m; }
  cur.id = null;
}
// a retainer just hired sits in the seat of their best stat if it is empty
function autoSeat(c) {
  if (!W.council || seatOf(c) || !seatOk(c)) return;
  const S = SEATS.slice().sort((a, b) => stat(c, b.st) - stat(c, a.st))[0];
  if (S && !councilSeat(S.n)) setSeat(S.n, c);
}
function setSeat(n, c) {
  const cur = W.council[n] || (W.council[n] = { id: null, task: defTask(n) });
  unseat(n); if (!c) return;
  const o = seatOf(c); if (o) unseat(o.n);
  cur.id = c.id; addMemo(c, P(), '受重用', 5);
  logLine(nm(c) + '做了你的' + n, '#9fe89a'); SFX.happy();
}

// ---------------------------------------------------------- hooks: W.hooks[id] = { k: 'weak'|'strong', cd: turn it can be used again, sid, fav }
function holdsHook(id) { const h = W && W.hooks && W.hooks[id]; return h && alive(C(id)) ? h.k : null; }
const hookWait = id => { const h = W.hooks[id]; return h && h.cd > W.t ? h.cd - W.t : 0; };
// the player gains a hook on id (a weak one never replaces a strong one); fav: a favour owed rather than dirt
function giveHook(id, k, why, sid, fav) {
  const c = C(id); if (!alive(c) || id === W.player || !W.hooks) return false;
  const h = W.hooks[id]; if (h && (h.k === 'strong' || h.k === k)) return false;
  W.hooks[id] = Object.assign({ k, cd: 0 }, sid ? { sid } : {}, fav ? { fav: 1 } : {});
  logLine(fav ? nm(c) + '欠你一个人情' + (why ? '（' + why + '）' : '') : '你握住了' + nm(c) + '的把柄（' + (k === 'strong' ? '强' : '弱') + (why ? ' · ' + why : '') + '）', '#ffb0d0');
  return true;
}
function useHook(c) {
  const h = W.hooks[c.id];
  if (!h || hookWait(c.id)) { toast('现在用不了', '#ff9a8a'); return false; }
  if (h.k === 'weak') delete W.hooks[c.id]; else h.cd = W.t + 8;
  return true;
}

// ---------------------------------------------------------- secrets: severity, and what their exposure costs
const SEV = { affair: 1, bastard: 2, fake: 2, murder: 3 };
const PREST_LOSS = [0, 5, 10, 40];
// who a secret shames: both lovers, the mother and the real father, the killer, the one framed
const guiltyOf = s => (s.type === 'murder' || s.type === 'fake' ? [s.subj] : [s.subj, s.other]).filter(Boolean);
// the new kinds of secret need words too
{ const st0 = secretText;
  secretText = s => s.type === 'murder' ? nm(C(s.subj)) + (s.try ? '派人行刺' : '害死了') + nm(C(s.other))
    : s.type === 'fake' ? nm(C(s.subj)) + (s.what || '有罪') + (s.maker ? '（伪证）' : '') : st0(s); }
const fakeWhat = c => c.role === 'merchant' ? '私铸钱币' : ['ruler', 'noble', 'minister', 'general', 'hostage'].includes(c.role) ? (c.state === '秦' || cityOf(c) === 'xianyang' ? '私通赵国' : '私通秦国') : '贪墨公款';
// by: W.player (you told: 3×severity prestige, they hate you), another cat's id, or 'self' (the guilty confessed)
function exposeSec(s, by) {
  if (!s || s.exposed) return;
  s.exposed = true; SFX.secret();
  // (dirt the whole town knows holds nobody: the hook made of it is gone)
  for (const id in W.hooks || {}) if (W.hooks[id].sid === s.id) { delete W.hooks[id]; if (alive(C(id))) logLine('握着' + nm(C(id)) + '的把柄没用了', '#dddddd', true); }
  const p = P(), sev = SEV[s.type] || 1, gl = guiltyOf(s).map(C).filter(Boolean);
  logLine('秘密传开了：' + secretText(s), '#ffb0d0');
  if (s.type === 'affair') for (const g of gl) {
    const sp = alive(g) && g.sp && C(g.sp);
    if (alive(sp) && !gl.includes(sp)) { addMemo(sp, g, '私情', -20, 24); if (sp.id !== W.player && g.id !== W.player && chance(.3)) divorce(sp, g, true); }
  }
  if (s.kid && C(s.kid)) C(s.kid).flags.bastard = true;
  if (s.type === 'murder') {
    for (const g of gl) g.flags.infamy = W.t + (s.try ? 16 : 40);
    // the victim's family never forgives it
    const v = C(s.other);
    if (v && !s.try) for (const k of Object.values(W.chars)) if (alive(k) && !gl.includes(k) && k.id !== W.player && (k.id === v.sp || closeKin(k, v))) { addMemo(k, gl[0], '杀亲之仇', -40); mkRival(k, gl[0]); }
  }
  if (gl.some(g => g.id === W.player)) addPrest(-PREST_LOSS[sev]);
  if (by === W.player) {
    addPrest(3 * sev); addStress(p, '仁厚');
    gl.forEach((g, i) => { if (!alive(g) || g.id === W.player) return; addMemo(g, p, '揭发我', i ? -25 : -40, 40); if (!i) mkRival(g, p); });
  }
  // dirt on 吕不韦 during the race costs him his credit with 华阳夫人
  // (once: 华阳夫人 hears it the first time; a forgery weighs less than the truth)
  if (W.act === 1 && !W.flags.act1Done && !W.flags.lvShamed && gl.some(g => g.id === 'lv')) {
    const d = s.type === 'fake' ? 8 : 15; W.flags.lvShamed = true; W.credit.lv = Math.max(0, W.credit.lv - d); logLine('吕不韦名声坏了，立嗣功劳 -' + d, '#c8e0ff'); }
}

// ---------------------------------------------------------- schemes: W.schemes = [{ id, type, owner, target, prog, sec, agents, t0, third?, wit?, ai?, rate?, seen? }]
// k: 'p' personal (笼络 勾引) / 'h' hostile (构陷 离间 刺杀): you run at most one of each. 'ai': only rivals use it.
const SCH = {
  笼络: { k: 'p', st: 2, open: true, ico: 'cup' },
  勾引: { k: 'p', st: 2, sec: 80, ico: 'heart' },
  构陷: { k: 'h', st: 3, sec: 75, ico: 'fake' },
  离间: { k: 'h', st: 3, sec: 75, ico: 'split' },
  刺杀: { k: 'h', st: 3, sec: 60, ico: 'bone' },
  流言: { k: 'ai', ico: 'mouth' },
};
const IGI = {
  cup: [['X...X', 'XXXXX', '.XXX.', '..X..', '.XXX.'], { X: '#f0cc5c' }],
  heart: [['XX.XX', 'XXXXX', 'XXXXX', '.XXX.', '..X..'], { X: '#f08aa8' }],
  fake: [['WWWWW', 'WR.RW', 'W.R.W', 'WR.RW', 'WWWWW'], { W: '#f2ead4', R: '#e0513c' }],
  split: [['XX.XX', 'XX.XX', 'X...X', 'XX.XX', 'XX.XX'], { X: '#b89ad8' }],
  bone: [['.X.X.X', 'XXXXXX', '.X.X.X'], { X: '#e8e0d0' }],
  mouth: [['XXXXX', 'X.X.X', 'XXXXX', '.X...', 'X....'], { X: '#f2ead4' }],
  sealG: [['XXXXX', 'X.X.X', 'XXXXX', 'X.X.X', 'XXXXX'], { X: '#8a8288' }],
};
const igIco = k => ICON['ig_' + k] || (ICON['ig_' + k] = rows(IGI[k][0], IGI[k][1]));
const mySchemes = () => (W.schemes || []).filter(s => !s.ai && s.owner === W.player);
const schOf = id => (W.schemes || []).find(s => s.id === id);
function dropScheme(s) { W.schemes = W.schemes.filter(x => x !== s); }
const lookTier = c => { const l = congenital(c).find(t => t.k === 'look'); return l ? l.v : 0; };
// 笼络 is done in the open; so is courting when neither of you is married
function schOpen(s) {
  if (SCH[s.type].open) return true;
  if (s.type !== '勾引') return false;
  const o = C(s.owner), t = C(s.target); return !(o && o.sp) && !(t && t.sp);
}
const schSec = s => schOpen(s) ? 100 : clamp(s.sec - 5 * s.agents.length + (hasPerkF('暗桩') ? 15 : 0), 0, 100);
const schRisk = s => schOpen(s) ? 0 : (100 - schSec(s)) / 4;          // % chance a season to be found out
function schRate(s) {
  const o = C(s.owner), t = C(s.target); if (!o || !t) return 0;
  if (s.ai) return Math.max(3, (s.rate || 25) - (seatOn('耳目', 1) ? seatS('耳目') : 0));
  // nobody warms to a courtship while they dislike the one courting
  if (s.type === '勾引' && opinion(t, o) < 0) return 0;
  let r = s.type === '笼络' ? 15 + 3 * stat(o, 2)
    : s.type === '勾引' ? (10 + 2 * stat(o, 2) + 5 * lookTier(o)) * (t.tr.includes('专一') ? .5 : 1)
    : (s.type === '刺杀' ? 8 : 10) + 2 * stat(o, 3) - Math.floor(stat(t, 3) / 2);
  r += s.agents.length * (s.type === '刺杀' ? 10 : 6);
  if (SCH[s.type].k === 'p' && seatOn('说客', 1) && !raceLobby()) r += swayGain(seatS('说客'));
  return Math.max(5, R(r));
}
const killOdds = s => { const o = C(s.owner), t = C(s.target); return o && t ? clamp(.35 + .03 * (stat(o, 3) - stat(t, 3)) + .1 * s.agents.length + (s.wit ? .2 : 0), .1, .9) : 0; };
// helpers who join by themselves: they like you (20+) and not the target (0 or less); friends and retainers first
function recruit(s) {
  const p = C(s.owner), t = C(s.target); if (!p || !t) return;
  const okA = a => alive(a) && a !== p && a !== t && a.id !== s.third && a.id !== s.wit && inCity(a) && ageOf(a) >= 16 && opinion(a, p) >= 20 && opinion(a, t) <= 0;
  s.agents = s.agents.filter(id => okA(C(id)));
  if (s.agents.length >= 3) return;
  const pri = a => isFriendF(a, p) ? 0 : W.ret.includes(a.id) ? 1 : 2;
  const pool = Object.values(W.chars).filter(a => (a.rel[p.id] || W.ret.includes(a.id)) && !s.agents.includes(a.id) && okA(a)).sort((a, b) => pri(a) - pri(b));
  for (const a of pool) { if (s.agents.length >= 3) break; s.agents.push(a.id); }
}
// opt: { owner (an NPC's id: an AI scheme against you or your heir), third (离间: the one to turn them against), rate, seen }
function startScheme(type, target, opt) {
  opt = opt || {}; const T = SCH[type]; if (!T || !W || !W.schemes) return null;
  const t = typeof target === 'string' ? C(target) : target, o = opt.owner ? C(opt.owner) : P();
  if (!alive(t) || !alive(o) || t === o) return null;
  const ai = o.id !== W.player;
  if (!ai && (T.k === 'ai' || mySchemes().some(s => SCH[s.type].k === T.k || s.target === t.id))) return null;
  const s = { id: 'k' + (W.nid++), type, owner: o.id, target: t.id, prog: 0, sec: T.sec || 100, agents: [], t0: W.t };
  if (opt.third) s.third = typeof opt.third === 'string' ? opt.third : opt.third.id;
  if (ai) { s.ai = true; s.rate = opt.rate || 20 + Math.floor(Math.random() * 11); s.seen = !!opt.seen || hasPerkF('洞察'); }
  else if (T.k === 'h') recruit(s);
  W.schemes.push(s);
  return s;
}
function spot(s) {
  if (s.seen) return; s.seen = true;
  const o = C(s.owner), t = C(s.target);
  logLine('察觉：' + nm(o) + '在对' + (t.id === W.player ? '你' : who(t)) + '下手（' + s.type + '）', '#ff9a8a'); SFX.secret();
}
function unmask(s) {
  const o = C(s.owner); dropScheme(s); addPrest(10);
  if (alive(o)) addMemo(o, P(), '被揭穿', -15, 16);
  // (didAct kinds: growth trains 谋 on 'scheme'; social counts it as hostile, not as time spent together)
  logLine('你揭穿了' + nm(o) + '的' + s.type, '#9fe89a'); SFX.happy(); didAct('scheme', o, 3, true);
}
// your plan is ripe: its effect happens now, the card only reports it (and offers what to do next)
function schDone(s) {
  const p = P(), t = C(s.target), r = { ev: 'schDone', s: JSON.parse(JSON.stringify(s)) };
  if (s.type === '笼络') {
    addMemo(t, p, '笼络', 25, 16);
    // someone this close may become a friend for life: the card offers it (by social's rules when it is in); with nothing
    // to decide, a notice is enough
    const cap = typeof maxFriends === 'function' && typeof friendsOf === 'function' && friendsOf(p).length >= maxFriends(p);
    const race = typeof raceThree === 'function' && raceThree(t);
    if (opinion(t, p) >= 60 && !isFriendF(t, p) && !isRivalF(t, p) && !cap && !race && !W.cool['zj_' + t.id]) r.fr = true;
    else { logLine('笼络成了：' + nm(t) + '好感+25', '#9fe89a'); return; }
  }
  else if (s.type === '勾引') {
    if (!p.lov.includes(t.id)) { p.lov.push(t.id); t.lov.push(p.id); }
    r.sec = !!(p.sp || t.sp);
    if (r.sec) { addSecret('affair', p.sp ? p.id : t.id, p.sp ? t.id : p.id); addStress(p, '专一'); addStress(p, '诚实'); }
    logLine('你与' + nm(t) + '成了情人' + (r.sec ? '（秘密）' : ''), '#ffb0d0'); didAct('court', t, 2, true);
  } else if (s.type === '构陷') {
    const q = addSecret('fake', t.id, null); q.what = fakeWhat(t); q.maker = p.id; q.known = [p.id]; r.sid = q.id;
    logLine('伪证备齐：' + nm(t) + q.what, '#ffb0d0');
  } else if (s.type === '离间') {
    const x = C(s.third);
    if (alive(x)) { addMemo(t, x, '离间', -20, 24); addMemo(x, t, '离间', -20, 24); logLine(nm(t) + '和' + nm(x) + '生了嫌隙', '#ffb0d0'); }
  } else if (s.type === '刺杀') {
    r.ok = chance(killOdds(s));
    if (r.ok) {
      const q = addSecret('murder', p.id, t.id); for (const a of s.agents.concat(s.wit ? [s.wit] : [])) if (!q.known.includes(a)) q.known.push(a);
      logLine(nm(t) + '暴病身亡', '#dddddd'); die(t, true); homeTick(); addStress(p, '仁厚');
    } else {
      // half the time they know who sent the knife, and that is dirt they hold on you
      r.caught = chance(.5);
      if (r.caught) { addMemo(t, p, '暗算', -40, 40); mkRival(t, p); const q = addSecret('murder', p.id, t.id); q.try = true; }
    }
  }
  W.queue.push(r);
}
// a rival's plan is ripe
function aiResolve(s) {
  const o = C(s.owner), t = C(s.target);
  if (s.type === '流言') { W.queue.push({ ev: 'rumor', a: o.id, tg: t.id }); return; }
  if (s.type === '构陷') { W.queue.push({ ev: 'framed', a: o.id, tg: t.id, what: fakeWhat(t) }); return; }
  // 刺杀: a knife in the night. Guards, 廉颇 and the 护卫 perk make it miss; a hit costs health (a frail cat may die of it)
  // (廉颇's soldiers stop the knife at the door and take the man: that is what their favour promised)
  const g = (t.id === W.player || household().includes(t)) && typeof useGuard === 'function' && useGuard();
  let pr = clamp(.3 + .03 * (stat(o, 3) - stat(t, 3)), .1, .6) * (1 - guardCut());
  if (hasPerkF('护卫')) pr *= .5;
  const hurt = !g && chance(Math.max(.03, pr)), caught = g || chance(hurt ? .4 : .7);
  // (growth's addWound: -20 and a scar or a limp, on top of the knife's -20)
  if (hurt) { if (typeof addWound === 'function') { addHealth(t, -20); addWound(t); } else addHealth(t, -40); }
  if (caught) { const q = addSecret('murder', o.id, t.id); q.try = true; if (!q.known.includes(W.player)) q.known.push(W.player); }
  W.queue.push(Object.assign({ ev: 'assassin', a: o.id, tg: t.id, hurt, caught }, g ? { guard: 1 } : {}));
  if (hurt && t.health <= 0) { t.flags.cause = '夜里遇刺身亡'; die(t); homeTick(); }
  if (t.id === W.player && alive(t)) addStress(t, 15, '遇刺');
}
function schemeTick() {
  const p = P();
  for (const s of W.schemes.slice()) {
    const o = C(s.owner), t = C(s.target);
    // plans die with the people in them; a head's plans die with the head; a target out of town is out of reach
    let gone = !alive(o) || !alive(t) || (!!s.third && !alive(C(s.third)));
    if (!gone && s.ai && holdsHook(o.id) === 'strong') { dropScheme(s); logLine(nm(o) + '收了手（你握着' + ta(o) + '的把柄）', '#9fe89a'); continue; }
    if (!gone && s.ai) gone = !inCity(o) || !(t.id === W.player || (t.house === 'li' && inCity(t)));
    else if (!gone) gone = s.owner !== W.player || !inCity(t) || (s.type === '勾引' && (p.lov.includes(t.id) || p.sp === t.id)) ||
      (SCH[s.type].k === 'h' && (household().includes(t) || t.id === p.sp));   // (they married into the house meanwhile)
    if (gone) { dropScheme(s); if (!s.ai && s.owner === W.player && alive(t) && !p.lov.includes(t.id)) logLine('计谋作罢：' + s.type + ' · ' + nm(t), '#dddddd'); continue; }
    if (s.ai) {
      s.prog = Math.min(100, s.prog + schRate(s));
      if (!s.seen && (hasPerkF('洞察') || (seatOn('耳目', 1) && chance(seatS('耳目') / 100)))) spot(s);
      if (s.prog >= 100) { dropScheme(s); aiResolve(s); }
      continue;
    }
    if (SCH[s.type].k === 'h') recruit(s);
    s.prog = Math.min(100, s.prog + schRate(s));
    if (chance(schRisk(s) / 100)) { dropScheme(s); W.queue.push({ ev: 'schFound', s: JSON.parse(JSON.stringify(s)) }); continue; }
    if (s.prog >= 100) { dropScheme(s); schDone(s); }
  }
}
// rivals (and anyone who hates you) with some cunning start about one plot every 8 seasons; at most two at a time
function aiStartTick() {
  const p = P(); if (W.cool.aisch || W.schemes.filter(s => s.ai && s.owner !== 'lv').length >= 2) return;
  const cs = Object.values(W.chars).filter(c => c.rel[p.id] && alive(c) && c.id !== W.player && c.loc !== 'home' && c.id !== p.sp && !(c.id === 'lv' && !W.flags.act1Done) &&
    ageOf(c) >= 16 && inCity(c) && stat(c, 3) >= 6 && holdsHook(c.id) !== 'strong' && !W.schemes.some(s => s.owner === c.id) && (isRivalF(c, p) || opinion(c, p) <= -50));
  for (const c of cs) if (chance(1 / 8)) {
    const h = heirOf(p), t = h && alive(h) && ageOf(h) >= 16 && inCity(h) && chance(.25) ? h : p;
    const type = c.tr.includes('狠辣') && W.flags.act1Done && c.house !== 'li' && ageOf(t) >= 16 && chance(.2) ? '刺杀' : c.tr.includes('狡诈') ? '构陷' : '流言';
    startScheme(type, t, { owner: c.id }); W.cool.aisch = 4; return;
  }
}

// ---------------------------------------------------------- the season's upkeep of seats, favours, letters and forgeries
function councilTick() {
  const p = P();
  for (const S of SEATS) { const cur = W.council[S.n]; if (cur && cur.id && !councilSeat(S.n)) { const c = C(cur.id); unseat(S.n); if (alive(c) && c.id !== W.player) logLine(nm(c) + '不再做你的' + S.n, '#dddddd'); } }
  if (seatOn('说客', 0)) {
    const nb = Object.values(W.chars).filter(c => inCity(c) && c.loc !== 'home' && c.id !== W.player && ageOf(c) >= 16 && (c.hist || ['ruler', 'noble', 'minister', 'general'].includes(c.role)));
    for (let i = 0; i < 2 && nb.length; i++) addOp(nb.splice(Math.floor(Math.random() * nb.length), 1)[0], p, 2, true);
  }
  if (seatOn('耳目', 0) && chance(Math.min(30, 2 * seatS('耳目')) / 100)) discoverSecret(Object.values(W.chars).filter(c => inCity(c)).map(c => c.id), 0, true);
}
// hired hands who have come to dislike you walk out, and help themselves to the till
function retainerTick() {
  const p = P();
  for (const id of W.ret.slice()) {
    const r = C(id); if (!alive(r) || opinion(r, p) >= 0 || !chance(.15)) continue;
    W.ret = W.ret.filter(x => x !== id); r.loc = 'tavern'; if (r.house === 'ret') r.house = null;
    const take = Math.min(30, W.fish); addFish(-take, true);
    logLine('门客' + nm(r) + '走了' + (take ? '，卷走 ' + take + ' 鱼干' : ''), '#ff9a8a');
  }
}
// a favour remembered (藏匿之恩, 出城之恩; social's 救命, and 相助 for a friend's request you granted, a loan among them)
// is a weak hook, once per favour and head of house
const FAVK = ['藏匿之恩', '出城之恩', '救命', '相助'];
function favourTick() {
  const p = P(), hh = household();
  for (const c of Object.values(W.chars)) {
    const r = c.rel[p.id]; if (!r || !r.m || !alive(c)) continue;
    // (a son owes his father nothing that can be squeezed out of him; a kit's debt comes due at sixteen)
    if (hh.includes(c) || c.id === p.sp || closeKin(c, p) || ageOf(c) < 16) continue;
    for (const k of FAVK) { const key = c.id + '|' + k + '|' + p.id; if (memoOf(c, p, k) > 0 && !W.favs[key]) { W.favs[key] = 1; giveHook(c.id, 'weak', k, null, true); } }
  }
}
function hookClean() {
  for (const id in W.hooks) if (!alive(C(id)) || id === W.player) delete W.hooks[id];
  for (const id in W.hookedBy) if (!alive(C(id))) delete W.hookedBy[id];
}
// social's 郭纵 loan left unpaid (W.soc.owe): the note is his hook on you (W.hookedBy, debt), and he sends for it yearly
function oweTick() {
  const S = W.soc, id = S && S.owe; if (!id) return;
  if (!alive(C(id))) { S.owe = null; delete W.hookedBy[id]; return; }
  if (!W.hookedBy[id]) W.hookedBy[id] = { k: 'weak', t: W.t, debt: 1 };
}
// paid: the fish went back, so the grudge goes and he lends again; otherwise (worked off, a hook) the debt is gone but
// he remembers, and his purse stays shut
function clearOwe(c, paid) {
  const S = W.soc, p = P(); if (S && S.owe === c.id) { S.owe = null; S.oweN = 0; }
  delete W.hookedBy[c.id];
  if (paid) {
    const r = c.rel[p.id]; if (r && r.m) { r.m = r.m.filter(x => x.k !== '赖账'); if (!r.m.length) delete r.m; }
    addMemo(c, p, '守信', 10, 16); if (S && S.bad) delete S.bad[c.id];
  }
  logLine('欠' + nm(c) + '的账了结了', '#9fe89a');
}
const oweN = () => (W.soc && W.soc.oweN) || 240;
const repayOweAct = c => mkAct({ id: 'repayOwe', kind: 'repay', n: '还钱', ap: 0, fish: oweN(), gold: true, hint: '了结旧账 · 他还肯再借',
  no: () => W.fish < oweN() ? '鱼干不够 ' + oweN() : '', fn: () => { const n = oweN(); if (W.fish < n || W.soc.owe !== c.id) return; addFish(-n); clearOwe(c, true); didAct('repay', c, 1, true); } });
// someone who knows your secret and dislikes you writes; once you have paid they write every year
function letterTick() {
  const p = P(), hh = household(), cands = [], S = W.soc;
  if (S && S.owe && W.hookedBy[S.owe] && alive(C(S.owe)) && !W.queue.some(q => q.ev === 'dun')) W.queue.push({ ev: 'dun', a: S.owe });
  const paidBy = id => W.hookedBy[id] && !W.hookedBy[id].debt;
  for (const s of W.secrets) if (!s.exposed && guiltyOf(s).includes(p.id)) for (const id of s.known) {
    const c = C(id);
    if (!alive(c) || c === p || hh.includes(c) || c.id === p.sp || ageOf(c) < 16 || holdsHook(id) === 'strong' || cands.some(x => x[0] === c)) continue;
    if (paidBy(id) || opinion(c, p) < -20) cands.push([c, s]);
  }
  const paid = cands.find(([c]) => paidBy(c.id)), one = paid || (cands.length && chance(.2) ? pick(cands) : null);
  if (one) W.queue.push({ ev: 'bmletter', a: one[0].id, s: one[1].id });
}
// a forgery that has been used (told, or held over them) can come apart: 10% a year
const fakeUsed = q => q.exposed || Object.values(W.hooks).some(h => h.sid === q.id);
function fakeTick() {
  for (const q of W.secrets.slice()) if (q.type === 'fake' && q.maker && fakeUsed(q) && chance(.1)) {
    W.secrets = W.secrets.filter(x => x !== q);
    for (const id in W.hooks) if (W.hooks[id].sid === q.id) delete W.hooks[id];
    const t = C(q.subj), p = P(); addPrest(-20);
    if (alive(t)) { addMemo(t, p, '诬陷', -40, 40); mkRival(t, p); }
    logLine('你做的伪证被人看穿了：' + nm(t) + '是清白的', '#ff9a8a');
  }
}

// ---------------------------------------------------------- cards
EV.schDone = e => {
  const s = e && e.s, p = P(), t = s && C(s.target); if (!s || !t || !p) return null;
  const n = nm(t);
  if (s.type === '笼络') {
    if (!alive(t)) return null;
    const nf = typeof friendsOf === 'function' ? friendsOf(p).length + 1 + '/' + maxFriends(p) : '';
    const O = [opt('「以后常来往。」', n + '好感+25（16季） · 不结为挚友', () => { W.cool['zj_' + t.id] = 12; })];
    // (checked again now: another 知己 card shown in between may have filled the last place)
    const fr = e.fr && !isFriendF(t, p) && !isRivalF(t, p) && !(typeof maxFriends === 'function' && typeof friendsOf === 'function' && friendsOf(p).length >= maxFriends(p));
    if (fr) O.unshift(opt('「你我之间，不必见外。」', '结为挚友 · 好感+25 · 可求助' + (nf ? ' · 挚友 ' + nf : ''), () => { mkFriend(p, t); logLine('你与' + n + '结为挚友', '#ffe08a'); SFX.happy(); }));
    return { title: '笼络', who: [t.id], text: `这几季你常去${n}那里走动，逢事就帮一把。${ta(t)}如今很信得过你。`, opts: O };
  }
  if (s.type === '勾引') return alive(t) ? { title: '勾引', who: [t.id], text: `${n}托人带了句话：今晚后门不闩。` + (e.sec ? '这件事不能让人知道。' : ''), opts: [opt('去', e.sec ? '成为情人（秘密）' : '成为情人', () => {})] } : null;
  if (s.type === '构陷') {
    const q = W.secrets.find(x => x.id === e.sid); if (!q || q.exposed || !alive(t)) return null;
    return { title: '构陷', who: [t.id], text: `伪证备齐了：几页账目，一个肯开口的证人，都说${n}${q.what}。`,
      opts: [opt('先收着', '日后可揭发或要挟', () => {}), opt('当众揭发', withTip('名望+6 · ' + ta(t) + '结仇', '仁厚', '胆小'), () => { exposeSec(q, W.player); didAct('expose', t, 3, true); }),
        opt('拿来要挟' + ta(t), '强把柄 · 每8季可用', () => giveHook(t.id, 'strong', '伪证', q.id))] };
  }
  if (s.type === '离间') { const x = C(s.third); return x ? { title: '离间', who: [t.id, x.id], text: `${n}和${nm(x)}之间有了嫌隙，见了面也不说话。`, opts: [opt('「这就够了。」', '两人互相好感-20（24季）', () => {})] } : null; }
  if (s.type === '刺杀') return e.ok ? { title: '暴病', who: [t.id], text: `${n}夜里忽然发病，没等到天亮。` + (s.agents.length ? '知道内情的，只有你和帮你办事的人。' : '知道内情的，只有你。'), opts: [opt('……', '', () => {})] }
    : { title: '失手', who: [t.id], text: `你找的人失了手，${n}活了下来。` + (e.caught ? `${ta(t)}知道是谁派的人。` : '没人知道是谁派的。'), opts: [opt('……', e.caught ? n + '好感-40 · 结仇' : '', () => {})] };
  return null;
};
// your plan was found out
EV.schFound = e => {
  const s = e && e.s, p = P(), t = s && C(s.target); if (!s || !alive(t) || !p) return null;
  const x = s.third && C(s.third), kill = s.type === '刺杀', n = s.type === '勾引' ? 30 : 40;
  // who takes it badly: the target; when courting, the jealous spouses
  const vs = s.type === '勾引' ? [C(t.sp), C(p.sp)].filter(v => alive(v) && inCity(v) && v.id !== W.player) : [t];
  if (!vs.length) return null;
  const v = vs[0], dc = 10 + Math.floor(stat(v, 3) / 2), ag = s.agents.map(C).find(alive);
  // (a hired knife that talked is dirt on you in their hands)
  // (a courtship found out is coveting, not a plot)
  const mk = s.type === '勾引' ? '觊觎' : '暗算';
  const pen = (k, hard) => { for (const w of vs) { addMemo(w, p, mk, -k, 40); if (hard && kill) mkRival(w, p); } if (hard && kill) { addPrest(-10); addSecret('murder', p.id, t.id).try = true; } };
  const text = { 构陷: `${nm(t)}发现有人在四处搜罗${ta(t)}的罪证，一路查到了你。`, 离间: `${nm(t)}听说，是你在${ta(t)}和${x ? nm(x) : '别人'}之间搬弄是非。`,
    刺杀: `你找的人还没动手，就被${nm(t)}的家丁拿住了，供出了你。`, 勾引: `${who(v)}看出你对${nm(t)}存了心思。` }[s.type] || '';
  const O = [opt('「……」', ta(v) + '好感-' + n + (kill ? ' · 名望-10 · 结仇' : ''), () => pen(n, true))];
  if (ag) O.push(opt('推给' + nm(ag), withTip('好感只-' + (n >> 1) + ' · ' + nm(ag) + '恨你', '诚实'), () => { pen(n >> 1, false); addMemo(ag, p, '出卖', -60); mkRival(ag, p); addStress(p, '诚实'); }));
  O.push(opt('矢口否认', chkHint(3, dc) + ' · 成则好感只-10', () => { if (chk(3, dc)) pen(10, false); else { pen(n, true); addPrest(-5); } }, null, '狡诈'));
  return { title: '败露', who: [v.id].concat(ag ? [ag.id] : []), text, opts: O };
};
EV.framed = e => {
  const o = C(e && e.a), t = (e && e.tg && C(e.tg)) || P(); if (!o || !alive(t)) return null;
  if (typeof useShield === 'function' && useShield()) { logLine('有人替你说了话，' + nm(o) + '递的状子没人理', '#c8e0ff', true); return null; }
  const you = t.id === W.player, dc = 9 + Math.floor(stat(o, 3) / 3);
  if (you) addStress(t, 10, '构陷');
  return { title: '构陷', who: you ? [o.id] : [o.id, t.id],
    text: `有人拿着一本账到官府告状，说${you ? '你' : who(t)}${(e && e.what) || fakeWhat(t)}。状子是${nm(o)}的人递上去的。`,
    opts: [opt('「这是诬陷。」', chkHint(2, dc) + ' · 败则名望-15', () => { if (chk(2, dc)) { addPrest(3); toast('官府驳回了状子', '#9fe89a'); } else addPrest(-15); }),
      opt('拿钱打点', '鱼干-60', () => addFish(-60), () => W.fish >= 60),
      opt('不去争', '名望-10', () => addPrest(-10))] };
};
EV.assassin = e => {
  const o = C(e && e.a), t = (e && e.tg && C(e.tg)) || P(); if (!o || !t) return null;
  const you = t.id === W.player, at = you ? '你' : who(t);
  const text = e.guard ? `半夜有人翻墙进了狸宅，刚落地就被廉颇的老兵按住了。他供出是${nm(o)}派来的。`
    : `半夜有人翻墙进了狸宅，摸到${at}的屋里。` + (!e.hurt ? '被家丁撞见，丢下刀跑了。' : alive(t) ? `刀子扎进了${you ? '你' : ta(t)}的肩膀。` : `${nm(t)}没能挺过去。`) +
    (e.caught ? `人抓住了，供出是${nm(o)}派来的。` : '人没抓住。');
  // (what it cost is already done: the hint only says so, and only while the one who was hurt still lives)
  const cost = e.hurt && alive(t) ? (you ? '' : nm(t)) + '健康-40' : '';
  return { title: '刺客', who: e.caught ? [o.id, t.id] : [t.id], text,
    opts: [opt(e.caught ? '「这笔账记下了。」' : '加固门户', [e.caught ? '得知秘密 · 可揭发或要挟' : '', cost].filter(Boolean).join(' · '), () => {})] };
};
const letterWhat = s => s.type === 'affair' ? '你和' + nm(C(s.subj === W.player ? s.other : s.subj)) + '的事' : s.type === 'bastard' ? nm(C(s.kid)) + '是谁的孩子'
  : s.type === 'murder' ? (s.try ? '你派人行刺' + nm(C(s.other)) + '的事' : nm(C(s.other)) + '是怎么死的') : '你的事';
EV.bmletter = e => {
  const c = C(e && e.a), s = e && W.secrets.find(x => x.id === e.s); if (!alive(c) || !s || s.exposed || !P()) return null;
  const again = !!W.hookedBy[c.id], dc = 8 + Math.floor(stat(c, 3) / 2);
  const O = [opt('放下 40 鱼干', '明年还会来', () => { addFish(-40); W.hookedBy[c.id] = { k: 'weak', t: W.t }; }, () => W.fish >= 40),
    opt('查是谁写的', chkHint(3, dc) + ' · 败则可能传开', () => {
      if (chk(3, dc)) { delete W.hookedBy[c.id]; logLine('写信的是' + nm(c), '#ffb0d0'); giveHook(c.id, 'weak', '勒索信'); }
      else if (chance(.4)) exposeSec(s, c.id); else toast('没查出来', '#dddddd'); }),
    opt('自己说出来', '秘密公开 · 名望-' + PREST_LOSS[SEV[s.type] || 1], () => { delete W.hookedBy[c.id]; exposeSec(s, 'self'); })];
  if (again) O.push(opt('不再给了', '六成会传开', () => { delete W.hookedBy[c.id]; if (chance(.6)) exposeSec(s, c.id); else toast('信没有再来', '#dddddd'); }));
  return { title: '勒索信', who: [],
    text: again ? '又是那个人的信。还是 40 鱼干，还是老地方。' : `门缝里塞进来一封信，没有落款。写信的人知道${letterWhat(s)}，要 40 鱼干，放在市集东头的槐树底下。`, opts: O };
};
// the creditor you never paid (social's 郭纵 loan) sends for it once a year
EV.dun = e => {
  const c = C(e && e.a), S = W.soc; if (!alive(c) || !S || S.owe !== c.id || !P()) return null;
  const n = oweN(), half = Math.min(n, 120);
  return { title: '讨债', who: [c.id], text: `${nm(c)}的账房上门了，手里捏着你按过手印的借据：「${n} 鱼干。东家说，不能再拖了。」`,
    opts: [opt('把钱还上', '鱼干-' + n + ' · 了结 · ' + ta(c) + '还肯再借', () => { addFish(-n); clearOwe(c, true); }, () => W.fish >= n),
      opt('替' + ta(c) + '跑一趟，抵一半的账', '下季精力-1 · ' + (n - half > 0 ? '还欠 ' + (n - half) : '了结，' + ta(c) + '不再借给你'), () => {
        W.flags.skipAp = true; S.oweN = n - half; if (S.oweN <= 0) clearOwe(c); else logLine('跑了一趟，欠' + nm(c) + '的还剩 ' + S.oweN, '#dddddd', true); }),
      opt('「再宽限些时日。」', '名望-8', () => { addPrest(-8); logLine(nm(c) + '在外头说你欠债不还', '#ff9a8a', true); })] };
};
// 家丁头 on 护院: the thief never gets away (wraps the RANDOM 'thief' card, whoever owns it)
const guardCard = () => { const g0 = councilSeat('家丁头'); return { title: '夜里', who: g0 ? [g0.id] : [], text: '半夜库房里有动静。' + (g0 ? nm(g0) : '家丁') + '带人摸过去，把贼按在了鱼干堆上。',
  opts: [opt('「送官。」', '鱼干+20 · 名望+3', () => { addFish(20); addPrest(3); }), opt('「打一顿，放了。」', '鱼干+20', () => addFish(20))] }; };

// ---------------------------------------------------------- actions on a character sheet
// didAct kinds: growth trains 谋 on all of them; social counts 'scheme'/'murder' as hostile and sway/seduce as time spent together
const SCH_KIND = { 笼络: 'sway', 勾引: 'seduce', 构陷: 'scheme', 离间: 'scheme', 刺杀: 'murder' };
function schAct(type, c) {
  const T = SCH[type], p = P(), hostile = T.k === 'h';
  const probe = { type, owner: p.id, target: c.id, prog: 0, sec: T.sec || 100, agents: [] }, risk = schRisk(probe);
  const done = { 笼络: '成则好感+25', 勾引: '成则情人', 构陷: '成则得伪证', 离间: '让' + ta(c) + '疏远一人', 刺杀: '成算' + R(killOdds(probe) * 100) + '%' }[type];
  const hint = '进度+' + schRate(probe) + '%/季 · ' + done + (risk ? ' · 败露' + R(risk) + '%' : '');
  const no = () => {
    if (type === '刺杀' && c.immortal) return '守卫森严';
    if (type === '勾引' && opinion(c, p) < 0) return '好感需 0 以上';
    if (mySchemes().some(s => s.target === c.id)) return '已在对' + ta(c) + '用计';
    if (mySchemes().some(s => SCH[s.type].k === T.k)) return hostile ? '已有一件密谋在办' : '已有一件私事在办';
    if (type === '离间' && !liCands(c).length) return '找不到可挑拨的人';
    return '';
  };
  const go = x => {
    if (!spendAp(1)) return;
    const s = startScheme(type, c, { third: x }); if (!s) { toast('这件事办不成', '#dddddd'); return; }
    if (type === '构陷' || type === '离间') addStress(p, '诚实');
    toast(type + '：' + nm(c) + ' · 进度+' + schRate(s) + '%/季', '#ffe08a'); SFX.secret(); didAct(SCH_KIND[type], c, T.st, true);
  };
  const ids = { 笼络: 'sway', 勾引: 'court', 构陷: 'frame', 离间: 'sow', 刺杀: 'murder' };
  return mkAct({ id: ids[type], kind: SCH_KIND[type], n: type, ap: 1, grp: hostile ? '谋' : '友', hint: type === '勾引' && (p.sp || c.sp) ? withTip(hint, '专一', '诚实') : hint, no,
    danger: type === '刺杀' ? withTip('杀人 · 败露则结仇', '仁厚', '胆小') : '',
    fn: () => type === '离间' ? pickChar('让' + nm(c) + '疏远谁？', liCands(c), x => go(x.id), x => { const v = opinion(c, x); return { txt: (v > 0 ? '+' : '') + v, v, col: opCol(v) }; }) : go() });
}
// whom a 离间 can turn them against: the people they know, closest first
function liCands(c) {
  const ids = new Set([c.sp, c.mom, c.dad].concat(c.lov, c.kids, Object.keys(c.rel)));
  for (const x of Object.values(W.chars)) if (x.rel[c.id]) ids.add(x.id);   // (and whoever cares about them: 吕不韦 ↔ 异人)
  return [...ids].map(C).filter(x => alive(x) && x !== c && x.id !== W.player && inCity(x) && ageOf(x) >= 16).sort((a, b) => opinion(c, b) - opinion(c, a)).slice(0, 12);
}
function spyAct(c) {
  const p = P(), dc = 11 - (hasPerkF('耳目') ? 2 : 0);
  return mkAct({ id: 'spy', kind: 'spy', n: '刺探', ap: 1, grp: '谋', hint: chkHint(3, dc) + ' · 失败' + ta(c) + '好感-10', fn: () => { if (!spendAp(1)) return;
    const ok = chk(3, dc);
    if (ok) {
      if (c.id === 'lv' && !W.flags.act1Done) toast('立嗣功劳：吕 ' + W.credit.lv + ' / 你 ' + W.credit.you, '#c8e0ff');
      const sc = W.schemes.find(s => s.ai && s.owner === c.id && !s.seen), got = discoverSecret([c.id], 0, true);
      if (sc) spot(sc); else if (!got) toast('没发现什么', '#dddddd');
    } else { addOp(c, p, -10); react(c, 'spy', false); }
    didAct('spy', c, 3, ok); } });
}
const unmaskAct = s => mkAct({ id: 'unmask', kind: 'unmask', n: '揭穿', ap: 1, grp: '谋', gold: true, hint: '名望+10 · ' + s.type + '作罢', fn: () => { if (!spendAp(1)) return; unmask(s); } });
const pickSecret = (list, fn) => list.length === 1 ? fn(list[0]) : pickOpt('哪件事？', list.map(s => ({ n: secretText(s), fn: () => fn(s) })));
function exposeAct(c, secs) {
  const sev = Math.max(...secs.map(s => SEV[s.type] || 1));
  return mkAct({ id: 'expose', kind: 'expose', n: '揭发', ap: 1, grp: '谋', hint: secs.length > 1 ? secs.length + ' 件事可说' : secretText(secs[0]), danger: withTip('结仇 · 名望+' + 3 * sev, '仁厚', '胆小'),
    fn: () => pickSecret(secs, s => { if (!spendAp(1)) return; exposeSec(s, W.player); didAct('expose', c, 3, true); }) });
}
const hookK = s => s.type === 'affair' ? 'weak' : 'strong';
const canHold = (c, s) => { const h = holdsHook(c.id); return !h || (h === 'weak' && hookK(s) === 'strong'); };
function bmAct(c, secs) {
  // (a secret is held over someone once: a weak hook spent is spent, it does not grow back from the same dirt)
  const use = secs.filter(s => !s.paid || (!s.held && canHold(c, s)));
  return mkAct({ id: 'blackmail', kind: 'blackmail', n: '勒索', ap: 1, grp: '谋', hint: withTip('要钱 · 或握为把柄', '诚实', '仁厚', '胆小'), no: () => use.length ? '' : '钱要过了，把柄也握过了',
    fn: () => pickSecret(use, s => bmMenu(c, s)) });
}
function bmMenu(c, s) {
  const p = P(), dc = 7 + Math.floor(stat(c, 3) / 2), gain = c.hist ? 100 : 40 + stat(c, 1) * 3, O = [];
  if (!s.paid) O.push({ n: '要钱', s: chkHint(3, dc) + ' · 得' + gain + ' · 败则结仇', fn: () => {
    if (!spendAp(1)) return;
    s.paid = true; const ok = chk(3, dc);
    if (ok) { addFish(gain); addMemo(c, p, '勒索我', -25, 20); addStress(p, '诚实'); addStress(p, '仁厚'); if (c.tr.includes('记仇')) mkRival(c, p); }
    else { addPrest(-5); addMemo(c, p, '勒索我', -40, 20); mkRival(c, p); if (chance(.4)) { toast(nm(c) + '抢先把事情说了出去', '#ff9a8a'); exposeSec(s, c.id); } else toast(nm(c) + '不吃这一套', '#ff9a8a'); }
    didAct('blackmail', c, 3, ok); } });
  if (!s.held && canHold(c, s)) { const k = hookK(s); O.push({ n: '握为把柄', style: 'gold', s: (k === 'strong' ? '强：每8季可用一次' : '弱：只能用一次') + ' · ' + ta(c) + '好感-25', fn: () => {
    if (!spendAp(1)) return;
    s.held = true; giveHook(c.id, k, null, s.id); addMemo(c, p, '勒索我', -25, 20); addStress(p, '诚实'); didAct('blackmail', c, 3, true); } }); }
  pickOpt('勒索' + nm(c), O);
}
// what a hook on c can make them do right now
function hookUses(c) {
  const p = P(), U = [], adult = ageOf(c) >= 16, fav = !!(W.hooks[c.id] && W.hooks[c.id].fav), done = () => didAct(fav ? 'favor' : 'extort', c, 3, true);
  if (adult && !c.sp && canWed(c) && c.house !== 'li') {
    const cs = adults(kinPool()).filter(f => !f.sp && f.female !== c.female && !closeKin(f, c) && canWed(f) && inCity(f));
    if (cs.length) U.push({ n: '逼婚', s: '让' + ta(c) + '娶或嫁你家的人', fn: () => pickChar('让谁娶/嫁' + nm(c) + '？', cs, f => {
      if (f.sp || c.sp || !useHook(c)) return; marry(f, c); addMemo(c, p, '逼婚', -20, 24); logLine(nm(f) + '与' + nm(c) + '成亲了', '#ffe08a'); SFX.happy(); done(); }) });
  }
  if (adult && !c.hist && c.house !== 'li' && c.house !== 'in' && !W.ret.includes(c.id) && c.sp !== W.player && W.ret.length < RET_MAX)
    U.push({ n: '逼' + ta(c) + '效力', s: '做你的门客 · 每季 6 鱼干', fn: () => { if (useHook(c) && hire(c)) { addMemo(c, p, '被迫', -10, 24); done(); } } });
  // calling in a favour for money is bad form, not blackmail; and nobody squeezes the people they live with
  if (!household().includes(c) && c.id !== p.sp)
    U.push({ n: '要钱', s: '鱼干+100 · ' + ta(c) + '好感-' + (fav ? 10 : 25), fn: () => { if (!useHook(c)) return; addFish(100); if (fav) addMemo(c, p, '讨人情', -10, 16); else addMemo(c, p, '勒索我', -25, 20); done(); } });
  if (W.soc && W.soc.owe === c.id) U.push({ n: '勾销旧账', s: '欠' + ta(c) + '的钱一笔勾销', fn: () => { if (useHook(c)) { clearOwe(c); done(); } } });
  const ai = W.schemes.find(s => s.ai && s.seen && s.owner === c.id);
  if (ai) U.push({ n: '让' + ta(c) + '住手', s: ai.type + '作罢', fn: () => { if (!useHook(c)) return; dropScheme(ai); logLine(nm(c) + '收了手', '#9fe89a'); done(); } });
  const mine = mySchemes().find(s => SCH[s.type].k === 'h' && s.target !== c.id && s.third !== c.id && !s.wit);
  if (mine) U.push({ n: '为我作证', s: mine.type + (mine.type === '刺杀' ? ' 成算+20%' : ' 进度+20'), fn: () => {
    if (!useHook(c)) return; mine.wit = c.id; mine.agents = mine.agents.filter(id => id !== c.id); if (mine.type !== '刺杀') mine.prog = Math.min(100, mine.prog + 20);
    toast(nm(c) + '答应替你作证', '#ffe08a'); done(); } });
  return U;
}
function hookMenu(c) {
  const U = hookUses(c), h = W.hooks[c.id];
  if (!h) return;
  if (hookWait(c.id)) { toast(hookWait(c.id) + ' 季后才能再用', '#ff9a8a'); return; }
  pickOpt(nm(c) + '：用' + (h.fav ? '人情' : '把柄') + '（' + (h.k === 'strong' ? '强' : '弱') + '）', U.map(u => ({ n: u.n, s: u.s, style: 'gold', fn: u.fn })));
}
const hookAct = c => { const h = W.hooks[c.id], U = hookUses(c); return mkAct({ id: 'hook', kind: 'hook', n: h.fav ? '人情' : '把柄', ap: 0, grp: '谋', hint: (h.k === 'strong' ? '强' : '弱') + ' · ' + (U.length ? U.map(u => u.n).join(' ') : '眼下用不上'),
  no: () => hookWait(c.id) ? hookWait(c.id) + ' 季后才能再用' : !U.length ? '眼下用不上' : '', fn: () => hookMenu(c) }); };
const schHint = s => '进度+' + schRate(s) + '%/季' + (schOpen(s) ? '' : ' · 败露' + R(schRisk(s)) + '%');

// ---------------------------------------------------------- the scheme card and the 门下 window
function openScheme(id) { if (!schOf(id)) return; MODAL.push({ type: 'scheme', sid: id, hold: true }); SFX.page(); }
function openCouncil() { if (!W || !W.council) return; W.flags.councilSeen = true; MODAL.push({ type: 'council' }); SFX.page(); }
const pressKind = s => SCH[s.type].k === 'h' ? 'scheme' : SCH_KIND[s.type];
const pressAct = s => mkAct({ id: 'press', kind: pressKind(s), n: '加紧', ap: 1, hint: '进度+20' + (schOpen(s) ? '' : ' · 隐秘-10'), no: () => s.prog >= 100 ? '季末见分晓' : '',
  fn: () => { if (!spendAp(1)) return; s.prog = Math.min(100, s.prog + 20); if (!schOpen(s)) s.sec = Math.max(0, s.sec - 10); toast(s.type + '进度 +20', '#ffe08a'); didAct(pressKind(s), C(s.target), SCH[s.type].st, true); } });
const quitAct = s => mkAct({ id: 'quit', kind: 'quit', n: '收手', ap: 0, danger: '计谋作废', fn: () => { dropScheme(s); toast('你收了手', '#dddddd'); } });
function drawSchemeCard(m) {
  const s = schOf(m.sid), o = s && C(s.owner), t = s && C(s.target);
  if (!s || !o || !t) { drop(m); return; }
  const mine = !s.ai, face = mine ? t : o, x = 10, w = 160, h = 150, y = R((H - h) / 2);
  g.globalAlpha = .55; rect(0, 0, W_, H, '#0a0810'); g.globalAlpha = 1;
  paper(x, y, w, h);
  rect(x + 24, y + 6, w - 48, 12, mine ? PAL.lacq : PAL.purple); rect(x + 24, y + 17, w - 48, 1, PAL.jiang);
  const title = mine ? s.type + ' · ' + nm(t) : nm(o) + '的' + s.type;
  txt(title, x + w / 2, y + 12, fitSize(title, w - 56, 8), '#fff6dc', 'center', PAL.jiang);
  drawPortrait(face, x + 8, y + 24, 1); hit(x + 8, y + 24, 32, 32, () => openSheet(face.id, true));
  const bx = x + 46, bar = (lab, v, col, yy, right) => {
    txt(lab, bx, yy + 2.5, 6, LABC, 'left', null); rect(bx + 20, yy, 66, 5, '#d8c8a8'); rect(bx + 20, yy, R(66 * clamp(v, 0, 100) / 100), 5, col);
    txt(right, x + w - 7, yy + 2.5, 6, '#3a2418', 'right', null); };
  const line = !mine ? '冲着' + (t.id === W.player ? '你' : who(t)) + '来' : s.third ? '挑拨' + ta(t) + '和' + nm(C(s.third))
    : { 笼络: '成后：' + ta(t) + '好感+25', 勾引: '成后：你们成为情人', 构陷: '成后：握一份伪证', 刺杀: '成后：' + ta(t) + '暴病而死' }[s.type] || '';
  txt(fitT(line, 104, 6, 1), bx, y + 28, 6, '#3a2418', 'left', null, 1, 1);
  bar('进度', s.prog, mine ? '#d6a23e' : '#c0304a', y + 36, R(s.prog) + '%');
  if (mine && !schOpen(s)) bar('隐秘', schSec(s), '#4f78a8', y + 46, String(R(schSec(s))));
  else txt(mine ? '明着来，不怕人知道' : '不管它，它就会成', bx, y + 48.5, 6, LABC, 'left', null, 1, 1);
  const info = mine ? '进度 +' + schRate(s) + '%/季' + (schOpen(s) ? '' : ' · 败露 ' + R(schRisk(s)) + '%/季') + (s.type === '刺杀' ? ' · 成算 ' + R(killOdds(s) * 100) + '%' : '')
    : '进度 +' + schRate(s) + '%/季' + (seatOn('耳目', 1) ? '（耳目挡了 ' + seatS('耳目') + '）' : '');
  txt(fitT(info, w - 16, 6, 1), x + 8, y + 64, 6, '#3a2418', 'left', null, 1, 1);
  const ay = y + 72;
  if (mine && SCH[s.type].k === 'h') {
    txt('同谋', x + 8, ay + 8, 6, LABC, 'left', null);
    const ag = s.agents.map(C).filter(Boolean).concat(s.wit && C(s.wit) ? [C(s.wit)] : []);
    ag.forEach((a, i) => { drawPortrait(a, x + 32 + i * 20, ay, .5); hit(x + 31 + i * 20, ay - 1, 18, 18, () => openSheet(a.id, true)); });
    if (!ag.length) txt('没有人帮你（有人恨' + ta(t) + '又信你，会自己来）', x + 32, ay + 8, 5.5, '#8a7a6a', 'left', null, 1, 1);
    else if (s.wit) txt(nm(C(s.wit)) + '作证', x + 34 + ag.length * 20, ay + 8, 5.5, LABC, 'left', null, 1, 1);
  } else if (mine) txt(s.type === '勾引' && opinion(t, o) < 0 ? ta(t) + '对你没有好感，毫无进展' : seatOn('说客', 1) && !raceLobby() ? '说客在帮你游说，每季多 ' + swayGain(seatS('说客'))
    : s.type === '勾引' && t.tr.includes('专一') ? ta(t) + '专一，进展慢一半' : '门下的说客能帮你游说', x + 8, ay + 8, 6, LABC, 'left', null, 1, 1);
  else txt(holdsHook(o.id) === 'strong' ? '你握着' + ta(o) + '的把柄，季末' + ta(o) + '就会收手' : holdsHook(o.id) ? '你握着' + ta(o) + '的把柄，可以让' + ta(o) + '住手' : '揭穿它：名望+10，' + s.type + '作罢', x + 8, ay + 8, 6, LABC, 'left', null, 1, 1);
  const by = y + 96;
  if (mine) { actBtn(pressAct(s), x + 8, by, 70, 22); actBtn(quitAct(s), x + 82, by, 70, 22, { who: t }); }
  else {
    actBtn(unmaskAct(s), x + 8, by, 70, 22);
    if (holdsHook(o.id)) actBtn(mkAct({ id: 'hookstop', n: '让' + ta(o) + '住手', ap: 0, hint: '用掉把柄', no: () => hookWait(o.id) ? hookWait(o.id) + ' 季后才能用' : '',
      fn: () => { const fav = W.hooks[o.id] && W.hooks[o.id].fav; if (useHook(o)) { dropScheme(s); logLine(nm(o) + '收了手', '#9fe89a'); didAct(fav ? 'favor' : 'extort', o, 3, true); } } }), x + 82, by, 70, 22);
  }
  btn(x + 50, y + h - 24, 60, 16, '关闭', 'dark', () => drop(m));
  TANCH = [y + h + 3, 1];
}
function dashBox(x, y, w, h) {
  rect(x, y, w, h, '#e8dcc0');
  for (let i = 0; i < w; i += 4) { rect(x + i, y, 2, 1, LABC); rect(x + i, y + h - 1, 2, 1, LABC); }
  for (let j = 0; j < h; j += 4) { rect(x, y + j, 1, 2, LABC); rect(x + w - 1, y + j, 1, 2, LABC); }
  txt('+', x + w / 2, y + h / 2, 10, LABC, 'center', null);
}
function seatPick(n) {
  const S = seatDef(n), c = councilSeat(n), list = seatCands().filter(x => x !== c);
  const choose = () => {
    if (!list.length) { toast('没有人手：招门客，或等孩子长大', '#dddddd'); return; }
    pickChar(n + '（看' + STATN[S.st] + '）', list, x => setSeat(n, x), x => { const v = stat(x, S.st); return { txt: STATN[S.st] + ' ' + v, v, col: '#3a2418' }; });
  };
  if (c) pickOpt(n + '：' + nm(c), [{ n: '换人', fn: choose }, { n: '撤下', style: 'dark', fn: () => { unseat(n); toast(nm(c) + '不做' + n + '了', '#dddddd'); } }]);
  else choose();
}
function drawCouncil(m) {
  g.globalAlpha = .55; rect(0, 0, W_, H, '#0a0810'); g.globalAlpha = 1;
  paper(3, 18, 174, 298);
  txt('门下', 10, 30, 9, '#3a2418', 'left', null);
  txt('点头像选人 · 点差事切换', 36, 31, 5.5, LABC, 'left', null, 1, 1);
  btn(158, 22, 16, 14, '×', 'dark', () => drop(m));
  SEATS.forEach((S, i) => {
    const y = 40 + i * 63, cur = W.council[S.n] || { id: null, task: defTask(S.n) }, c = councilSeat(S.n), s = c ? stat(c, S.st) : 0, tk = cur.task || 0;
    rect(10, y, 9, 9, STATC[S.st]); txt(STATN[S.st], 14.5, y + 4.5, 6, '#ffffff', 'center', null);
    txt(S.n, 22, y + 5, 7.5, '#3a2418', 'left', null);
    if (c) txt(S.e[tk](s)[0], 170, y + 5, 8, '#276a32', 'right', null);
    const py = y + 12;
    if (c) drawPortrait(c, 10, py, 1); else dashBox(10, py, 32, 32);
    hit(9, py - 1, 34, 34, () => seatPick(S.n));
    txt(c ? fitT(nm(c), 120, 7) : '空缺', 48, py + 5, 7, c ? '#3a2418' : '#8a7a6a', 'left', null);
    const sub = c ? STATN[S.st] + ' ' + s + (W.ret.includes(c.id) ? ' · 门客' : relTo(c) ? ' · ' + relTo(c) : '') : '点左边的框选人';
    txt(sub, 48, py + 14, 5.5, LABC, 'left', null, 1, 1);
    S.t.forEach((tn, k) => btn(48 + k * 62, py + 20, 58, 14, tn, tk === k ? 'gold' : 'dark', () => { cur.task = k; W.council[S.n] = cur; }));
    txt(fitT(c ? S.e[tk](s)[1] : S.t[tk] + '：还没有人', 124, 5.5, 1), 48, py + 41, 5.5, c ? '#3f6a1c' : '#8a7a6a', 'left', null, 1, 1);
    if (i < 3) rect(10, y + 60, 160, 1, '#e0cfa8');
  });
  TANCH = [311, -1];   // (notices sit in the paper's bottom margin)
}
// one row: type icon, gold bar (red for a plot against you), red dots for the risk of being found out (ROW_H tall)
function schRow(s, x, y) {
  const mine = !s.ai, ic = igIco(SCH[s.type].ico), risk = schRisk(s), h = ROW_H - 1, my = y + (h >> 1);
  rect(x, y, 59, h, mine ? 'rgba(22,18,26,.8)' : 'rgba(96,22,34,.88)');
  img(ic, x + 1, R(y + (h - ic.height) / 2));
  rect(x + 11, my - 1, 30, 3, '#3a3040'); rect(x + 11, my - 1, R(30 * clamp(s.prog, 0, 100) / 100), 3, mine ? '#e8b040' : '#ff6a5a');
  if (mine) { const d = risk >= 15 ? 3 : risk >= 10 ? 2 : risk > 0 ? 1 : 0; for (let i = 0; i < 3; i++) rect(x + 45 + i * 4, my - 1, 3, 3, i < d ? '#ff5a5a' : '#4a3a50'); }
  else txt('!', x + 50, my + .5, 6.5, '#ffd0c0', 'center', null);
  hit(x, y, 59, ROW_H + 1, () => openScheme(s.id));
}
// the rows that don't fit fold into one: 计谋 N 件 › opens them as a list
function schFold(L, x, y) {
  rect(x, y, 59, ROW_H - 1, L.some(s => s.ai) ? 'rgba(96,22,34,.88)' : 'rgba(22,18,26,.8)');
  txt('计谋 ' + L.length + ' 件 ›', x + 29.5, y + 6, 5.5, '#ffe08a', 'center', null);
  hit(x, y, 59, ROW_H + 1, () => openList('计谋', () => L.filter(s => schOf(s.id)).map(s => { const o = C(s.owner), t = C(s.target); return { icon: igIco(SCH[s.type].ico),
    t: s.ai ? nm(o) + '的' + s.type : s.type + ' · ' + nm(t), s: '进度 ' + R(s.prog) + '%' + (s.ai ? ' · 冲着' + (t.id === W.player ? '你' : nm(t)) + '来' : ''), fn: () => openScheme(s.id), close: true }; })));
}
SYS.modal.scheme = drawSchemeCard;
SYS.modal.council = drawCouncil;

// ---------------------------------------------------------- hooks into the core
const igInit = W => { W.schemes = W.schemes || []; W.hooks = W.hooks || {}; W.council = W.council || {}; W.hookedBy = W.hookedBy || {}; W.favs = W.favs || {}; };
SYS.init.push(igInit);
// (a save from before 门下: the retainers it had take their seats, instead of the bonus they used to give quietly;
// money already squeezed out of a secret under the old rules counts as its one 要钱)
SYS.load.push(w => {
  const old = !w.council; igInit(w);
  if (old && alive(P())) for (const id of w.ret || []) { const c = C(id); if (c) autoSeat(c); }
  for (const s of w.secrets || []) if (s.bmN && !s.paid) s.paid = true;
});
SYS.season.push(() => {
  if (!W.schemes || !alive(P())) return;
  retainerTick(); councilTick(); schemeTick(); aiStartTick(); favourTick(); oweTick(); hookClean();
});
SYS.yearly.push(() => { if (!W.schemes || !alive(P())) return; letterTick(); fakeTick(); });
SYS.acts.push((c, A) => {
  if (!W.schemes) return;
  const p = P(), at = id => A.findIndex(a => a.id === id);
  const swap = (id, a) => { const i = at(id); if (i < 0) return; if (a) A.splice(i, 1, a); else A.splice(i, 1); };
  swap('expose'); swap('blackmail');
  // 遣散 also frees the seat
  const d = A.find(a => a.id === 'dismiss'), S = seatOf(c);
  if (d && S) { const f0 = d.fn; d.fn = () => { f0(); unseat(S.n); }; d.danger += ' · 离开门下'; }
  if (!reach(c)) return;
  // (the plan already running on this cat shows as its progress button, not a second grey starter of the same name)
  const run = mySchemes().find(s => s.target === c.id), ai = W.schemes.find(s => s.ai && s.seen && s.owner === c.id);
  const sch = type => run && run.type === type ? [] : [schAct(type, c)];
  if (at('court') >= 0) swap('court', sch('勾引')[0]);       // 示好 is now a scheme
  if (at('spy') >= 0) swap('spy', spyAct(c));
  // whatever is running on this cat comes first
  if (run) A.push(mkAct({ id: 'scheme', n: run.type + ' ' + R(run.prog) + '%', ap: 0, open: true, gold: true, hint: schHint(run), fn: () => openScheme(run.id) }));
  if (ai) A.push(unmaskAct(ai));
  const secs = secretsAbout(c).filter(s => knows(s) && guiltyOf(s).includes(c.id) && !guiltyOf(s).includes(W.player));
  if (secs.length) A.push(exposeAct(c, secs), bmAct(c, secs));
  if (holdsHook(c.id)) A.push(hookAct(c));
  if (W.soc && W.soc.owe === c.id) A.push(repayOweAct(c));
  if (ageOf(c) < 16 || ageOf(p) < 16) return;
  A.push(...sch('笼络'));
  // no plots against the people you live with, and no knife for your own blood
  if (household().includes(c) || c.id === p.sp) return;
  A.push(...sch('构陷'), ...sch('离间'));
  if (!closeKin(c, p) && c.house !== 'li') A.push(...sch('刺杀'));
});
SYS.rows.push((y, lim) => {
  if (!W.schemes || !W.schemes.length) return 0;
  const L = W.schemes.filter(s => s.ai ? s.seen : s.owner === W.player); if (!L.length) return 0;
  // as many rows as fit above the floor; the rest fold into the last one
  const n = lim ? Math.max(0, Math.floor((lim - y + 1) / ROW_H)) : 4; if (!n) return 0;
  const fold = L.length > n, show = fold ? L.slice(0, n - 1) : L;
  show.forEach((s, i) => schRow(s, 118, y + i * ROW_H));
  if (fold) schFold(L.slice(n - 1), 118, y + (n - 1) * ROW_H);
  const h = Math.min(L.length, n) * ROW_H;
  // the first time plots show up here, pumpQueue explains the rows in one step (TIPR: where they are)
  if (!W.flags.schTip) TIPR = [118, y, 59, h - 1];
  return h;
});
SYS.card.push(() => { if (W.council) btn(140, 151, 36, 14, '门下', 'gold', openCouncil); });
// on a card: a seal by the name when you hold a hook (red strong, grey weak), and rows for hooks, plots and seats
SYS.sheet.push((c, rows) => {
  if (!W.schemes || c.id === W.player) return;
  const m = MODAL.slice().reverse().find(x => x.type === 'sheet' && x.id === c.id), live = !!m && !m.ro && alive(c) && reach(c);
  const k = holdsHook(c.id);
  if (k) {
    const h = W.hooks[c.id], wt = hookWait(c.id);
    if (m) {
      const nPip = m.ro ? 0 : Math.max(apMax(P()), W.ap), sz = fitSize(nm(c), 68 - nPip * 6, 10), sx = 80 + tw(nm(c), sz) + 3;
      img(k === 'strong' ? ICON.seal : igIco('sealG'), sx + 7 <= 150 - nPip * 6 ? R(sx) : 66, sx + 7 <= 150 - nPip * 6 ? 28 : 27);
    }
    rows.push({ chip: h.fav ? '人情' : '把柄', col: k === 'strong' ? '#b0301f' : '#7a7078', text: (k === 'strong' ? '强 · 每8季可用一次' : '弱 · 只能用一次') + (wt ? ' · ' + wt + '季后可用' : ''), fn: live ? () => hookMenu(c) : null });
  }
  const s = W.schemes.find(x => (!x.ai && x.owner === W.player && x.target === c.id) || (x.ai && x.seen && x.owner === c.id));
  if (s) rows.push({ chip: s.type, col: s.ai ? '#8a2040' : '#94562f', text: s.ai ? '在对' + (s.target === W.player ? '你' : nm(C(s.target))) + '下手 · ' + R(s.prog) + '%' : '进度 ' + R(s.prog) + '%' + (schOpen(s) ? '' : ' · 败露 ' + R(schRisk(s)) + '%/季'), fn: m && !m.ro ? () => openScheme(s.id) : null });
  const S = seatOf(c); if (S && councilSeat(S.n) === c) rows.push({ chip: S.n, col: '#3f8a5e', text: '门下 · ' + S.t[W.council[S.n].task || 0], fn: m && !m.ro ? openCouncil : null });
  // (an anonymous letter-writer stays anonymous; a creditor doesn't)
  const hb = W.hookedBy[c.id]; if (hb && hb.debt) rows.push({ chip: '借据', col: '#6a5a70', text: ta(c) + '握着你的借据 · 欠 ' + oweN() + ' · 每年来讨' });
});
SYS.econ.push((inc, cost) => {
  if (!W.council) return;
  if (seatOn('账房', 0)) inc.push(['账房管账', seatS('账房')]);
  if (seatOn('账房', 1)) { const k = Math.min(30, 2 * seatS('账房')) / 100; for (const x of cost) if (x[0].startsWith('家用') || x[0] === '门客') { const d = R(x[1] * k); if (d > 0) { x[1] -= d; x[0] += '（节省' + d + '）'; } } }
});
SYS.did.push((kind, t, st, ok) => {
  if (!W.schemes) return;
  // 打听 around town can turn up a plot against you
  if (kind === 'ask') { const hid = W.schemes.filter(s => s.ai && !s.seen); if (hid.length && chance(.35)) spot(pick(hid)); }
  // the 说客 goes along with your envoy to 咸阳
  if (kind === 'lobby' && seatOn('说客', 1) && raceLobby()) {
    const g = lobbyGain(seatS('说客'));
    if (g) { W.heir += g; W.credit.you += g; if (W.flags.allied) W.credit.lv += g >> 1; toast('说客：立嗣 +' + g, '#ffe08a'); if (W.heir >= 100 && !W.flags.zichu && !W.queue.some(q => q.ev === 'zichu')) W.queue.push({ ev: 'zichu' }); }
  }
  if (kind === 'caravan' && ok && seatOn('家丁头', 1)) { const b = R((55 + stat(P(), 1) * 5) * .03 * seatS('家丁头')); if (b > 0) { addFish(b, true); toast('押镖 多赚 ' + b, '#ffe08a'); } }
});
// a known killer is shunned
SYS.opinion.push((a, b, add) => { if (b.flags && b.flags.infamy > W.t) add('凶名', -20); });
SYS.goal.push(() => {
  const s = W.schemes && W.schemes.find(x => x.ai && x.seen), o = s && C(s.owner);
  if (o) return { s: '目标：揭穿' + nm(o) + '的' + s.type + '（人）', pri: 30 };
  // an empty seat while someone could take it (until you have looked at the 门下 window once)
  if (W.council && W.flags.act1Done && !W.flags.councilSeen && SEATS.some(S => !councilSeat(S.n)) && seatCands().some(c => !seatOf(c) || !councilSeat(seatOf(c).n))) return { s: '目标：点门下，安排人手（家）', pri: 87 };
  return null;
});
// the thief card, whoever wrote it, ends well when a 家丁头 keeps watch (wrapped lazily so it survives the other sections)
SYS.sched.push(() => {
  const th = RANDOM.find(r => r.id === 'thief');
  if (th && !th.b.igWrap) { const b0 = th.b; th.b = (...a) => seatOn('家丁头', 0) ? guardCard() : b0(...a); th.b.igWrap = true; }
});
// ---- end intrigue
