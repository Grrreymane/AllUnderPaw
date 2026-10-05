// ============================================================ economy / checks / helpers
function addFish(n, quiet) { W.fish = Math.max(0, W.fish + n); if (!quiet && n) { toast('小鱼干 ' + (n > 0 ? '+' : '') + n, n > 0 ? '#ffe08a' : '#ff9a8a'); if (n > 0) SFX.coin(); } }
function addPrest(n, quiet) { W.prest = clamp(W.prest + n, 0, 999); if (n && !quiet) toast('名望 ' + (n > 0 ? '+' : '') + n, n > 0 ? '#c8e0ff' : '#ff9a8a'); }
// 心烦 runs 0–100 (growth). What acting against your nature costs: a trait named here is the one that minds (else 15).
const STRESS_T = { 仁厚: 20, 诚实: 15, 专一: 10, 胆小: 15, 勇猛: 10, 多疑: 10 };
// addStress(c, n, why) adds n (negative = relief). The older form addStress(c, trait) charges the head that trait's cost
// only when the head has it (the call sites in events and actions stay as they were).
function addStress(c, n, why) {
  if (!c || !W) return;
  if (typeof n === 'string') { if (c.id !== W.player || !c.tr.includes(n)) return; why = n; n = STRESS_T[n] || 15; }
  n = Math.round(n || 0); if (!n) return;
  const was = c.stress || 0; c.stress = clamp(was + n, 0, 100);
  if (c.id === W.player && c.stress !== was) toast('心烦 ' + (n > 0 ? '+' : '') + (c.stress - was) + (why ? '（' + why + '）' : ''), n > 0 ? '#ffb0d0' : '#c8e0ff');
}
// for hints: what a choice costs in 心烦 given your traits ('' when nothing), and a hint with that cost appended
const stressTip = (...trs) => { const p = W && P(), t = p ? trs.filter(x => p.tr.includes(x)) : []; return t.length ? '心烦+' + t.reduce((s, x) => s + (STRESS_T[x] || 15), 0) + '（' + t.join(' ') + '）' : ''; };
const withTip = (s, ...trs) => [s, stressTip(...trs)].filter(Boolean).join(' · ');
// 心烦 levels, shown as pips: 1 at 34, 2 at 67 (四项-1), 3 at 100 (四项-2, 健康-1/季, and the breakdown)
function stressLv(c) { const s = (c && c.stress) || 0; return s >= 100 ? 3 : s >= 67 ? 2 : s >= 34 ? 1 : 0; }
const pct = (st, dc) => clamp(.5 + (st - dc) * .07, .08, .95);
function chk(i, dc) { return Math.random() < pct(stat(P(), i), dc); }
const chkHint = (i, dc) => STATN[i] + ' ' + R(pct(stat(P(), i), dc) * 100) + '%';
function addHealth(c, n) { if (c) c.health = clamp((c.health || 0) + n, 0, 100); }
// news worth remembering goes to the 近况 log (last 40 lines) and shows as a notice (quiet: log only)
// (CATCHUP: an old save is catching up on history's overdue deaths, histCatchUp: nothing is said line by line)
let CATCHUP = false;
// What happened to a cat, kept on the cat (the last 8): the cards it was part of and the news that named it.
function note(c, s, t) { if (!c || !s) return; const L = c.log || (c.log = []), tt = t === undefined ? W.t : t; if (L.length && L[L.length - 1][1] === s) return; L.push([tt, s]); if (L.length > 8) L.shift(); }
// (only the cats the story or you have to do with, and the name list is built once a season)
let NOTE_K = -1, NOTE_L = [];
function noteNamed(s) {
  if (NOTE_K !== W.t * 1000 + W.nid) { NOTE_K = W.t * 1000 + W.nid; NOTE_L = Object.values(W.chars).filter(c => c.dead === null && c.id !== W.player && (c.hist || c.house || c.rel[W.player])).map(c => [nm(c), c]).filter(x => x[0].length >= 2); }
  for (const [n, c] of NOTE_L) if (s.includes(n)) note(c, s);
}
function logLine(s, col, quiet) { if (CATCHUP) return; noteNamed(s); W.log = W.log || []; W.log.push(col ? { t: W.t, s, col } : { t: W.t, s }); if (W.log.length > 40) W.log.splice(0, W.log.length - 40); if (!quiet) toast(s, col || '#f2ead4'); }
// energy a head of house gets each season (a head under 16 is ruled by a regent: 1 until twelve, then at most 2; see growth's 家法)
const apMax = p => {
  if (!p) return 2;
  const n = Math.max(1, 2 + (p.tr.includes('勤快') ? 1 : 0) - (p.tr.includes('慵懒') ? 1 : 0));
  return W && p.id === W.player && ageOf(p) < 16 ? (ageOf(p) < 12 ? 1 : Math.min(2, n)) : n;
};
// the bloodline: every living 狸 (succession, the tree, 讨要 …)
const family = () => Object.values(W.chars).filter(c => c.house === 'li' && alive(c));
// who lives under your roof and eats from the store: 狸 and married-in spouses at home, minus those who walked out or set up their own house
const household = () => Object.values(W.chars).filter(c => alive(c) && c.loc === 'home' && (c.house === 'li' || c.house === 'in') && !c.flags.left && !c.flags.branch);
// 狸 you can still arrange things for (说媒, 提亲, 讨要, 教导): the blood, minus the ones who walked out
const kinPool = () => family().filter(c => !c.flags.left);
const adults = list => list.filter(c => ageOf(c) >= 16);
// (a place named in 邯郸's words — 'market', 'palace', 'tavern' — is the same kind of place in the city the house lives in
// now: CITY[city].at, e.g. 咸阳's 'xmarket')
const hereList = loc => { const m = W && CITY[W.city] && CITY[W.city].at, l = (m && m[loc]) || loc; return Object.values(W.chars).filter(c => alive(c) && c.loc === l && c.id !== W.player); };
// c.disc is discontent with the head. A relative passed over for head of the house holds a grudge (flags.passed) that
// grows until they come round or walk out; grumbling over an empty store (no flag) fades by itself.
function passOver(c, n) { c.disc = Math.max(c.disc || 0, n); c.flags.passed = true; }
// the heir among the head's own children under the house law (W.law, growth's 家法). 立嫡长: eldest adult son, else
// eldest adult daughter, else the eldest child; bastards and those who walked out only if no one else is left, the
// disinherited (flags.disinh) never. 择贤: the child the head named (W.heirId), else the same order.
// (heirNow() in growth adds the rest of the clan when there are no children.)
function heirOf(h) {
  h = h || P(); if (!h) return null;
  const ks = h.kids.map(C).filter(k => alive(k) && k.house === 'li' && (k.dad === h.id || k.mom === h.id) && !k.flags.disinh && !royalOut(k));
  if (W.law === '择贤' && W.heirId && h.id === W.player) { const d = C(W.heirId); if (ks.includes(d)) return d; }
  const fit = ks.filter(k => !k.flags.left && !k.flags.bastard), L = (fit.length ? fit : ks).sort((a, b) => a.born - b.born);
  return L.find(k => ageOf(k) >= 16 && !k.female) || L.find(k => ageOf(k) >= 16) || L[0] || null;
}
// 异人 and 赵姬 are spoken for by history until 讨要 has happened (affairs stay possible); the mother of a reigning king
// is nobody's to marry off
const kingsMother = c => !!c && c.female && c.kids.some(id => { const k = C(id); return alive(k) && k.mom === c.id && k.role === 'ruler'; });
// a 狸 who married into a royal house (子楚's bride, a king's mother or wife) is that house's now: never head of this one
const royalOut = c => !!c && (!!c.flags.royal || (!!W.flags.liBride && c.id === W.flags.liBride) || kingsMother(c) || (!!c.sp && !!C(c.sp) && C(c.sp).role === 'ruler'));
const canWed = c => !c || !(((c.id === 'yiren' || c.id === 'zhaoji') && !W.flags.meijiDone && !W.flags.act1Done) || kingsMother(c));
// chance that c says yes to marrying f
function proposeChance(f, c) {
  return clamp(.25 + opinion(c, f) / 100 + (f.id === W.player && P().lov.includes(c.id) ? .35 : 0) + prestTier().i * .05 - (c.hist ? .35 : 0), .05, .95);
}
function knownBio(c) {
  return !!c && c.bio && c.bio !== c.dad && W.secrets.some(s => s.type === 'bastard' && s.kid === c.id && (s.exposed || knows(s)));
}
function visibleChildren(c) {
  return c ? c.kids.map(C).filter(k => k && (k.mom === c.id || k.dad === c.id || (k.bio === c.id && knownBio(k)))) : [];
}
function marry(a, b) {
  // an earlier marriage ends first, with a notice, so no link is ever left one-sided
  for (const [x, y] of [[a, b], [b, a]]) if (x.sp && x.sp !== y.id) { const o = C(x.sp); if (o && o.sp === x.id) divorce(x, o, true); else x.sp = null; }
  a.sp = b.id; b.sp = a.id;
  endAffair(a, b);
  // lovers who marry each other have nothing left to hide
  for (const q of W.secrets) if (q.type === 'affair' && !q.exposed && [q.subj, q.other].includes(a.id) && [q.subj, q.other].includes(b.id)) q.exposed = true;
  // lovers they already had become affairs the new spouse doesn't know about
  for (const x of [a, b]) for (const l of x.lov) if (alive(C(l)) && !W.secrets.some(q => q.type === 'affair' && !q.exposed && [q.subj, q.other].includes(x.id) && [q.subj, q.other].includes(l))) addSecret('affair', x.id, l);
  for (const x of [a, b]) if (W.ret.includes(x.id)) { W.ret = W.ret.filter(id => id !== x.id); if (x.house === 'ret') x.house = null; }
  wedHome(a, b); homeTick();
  kinOnMarriage(a, b);
}
// where a new couple lives: the head's and the heir's spouses move into 狸宅; any other 狸 sets up a cadet house in town (分户),
// or follows a spouse who is somebody important
// A famous spouse moves into 狸宅 too (so they are there to keep company, sit on the council and raise the children),
// unless they rule, are a hostage, or live in another city.
const histMovesIn = (o, k) => o.role !== 'ruler' && o.role !== 'hostage' && !['yiren', 'zheng'].includes(o.id) && sameCity(o, k);
function moveIn(o) {
  const was = o.loc;
  o.loc = 'home'; if (o.house !== 'li') o.house = 'in'; delete o.flags.branch; delete o.flags.left;
  // the 狸 children living with them come along
  for (const id of o.kids) { const k = C(id); if (alive(k) && k.house === 'li' && ageOf(k) < 16 && k.loc === was && !k.flags.branch) k.loc = 'home'; }
}
// (saves from before this rule: the head's famous spouse still lives across town)
function spouseHomeFix() { const p = P(), o = p && p.sp && C(p.sp); if (alive(p) && alive(o) && o.hist && o.loc !== 'home' && p.loc === 'home' && histMovesIn(o, p)) moveIn(o); }
SYS.load.push(spouseHomeFix);
function wedHome(a, b) {
  // (the heir: the one with the gold 嗣 tag, which may be a sibling or nephew when the head has no children)
  const hn = typeof heirNow === 'function' ? heirNow() : null;
  const keep = x => x.house === 'li' && (x.id === W.player || x === heirOf() || x === hn) && x.loc === 'home' && !x.flags.branch;
  const K = keep(a) ? a : keep(b) ? b : null;
  if (K) {
    const o = K === a ? b : a;
    if (!o.hist || histMovesIn(o, K)) moveIn(o);
    return;
  }
  if (a.house !== 'li' && b.house !== 'li') return;
  const h = [a, b].find(x => x.hist), spot = h ? (cityOf(h) === W.city ? h.loc : 'market') : 'market';
  for (const x of [a, b]) if (!x.hist && x.id !== W.player) { x.flags.branch = true; x.loc = spot; if (x.house !== 'li') x.house = 'in'; }
}
// a cadet 狸 who becomes head moves back into 狸宅 with spouse and children
function bringHome(c) {
  const fam = [c, C(c.sp)].concat(c.kids.map(C)).filter(x => alive(x) && (x === c || x.id === c.sp || (x.house === 'li' && !x.sp)));
  for (const x of fam) if (!x.hist) { x.loc = 'home'; delete x.flags.branch; delete x.flags.left; }
}
function addSecret(type, subj, other, kid) {
  const s = { id: 's' + (W.nid++), type, subj, other, kid: kid || null, known: [subj, other].filter(Boolean), exposed: false, t: W.t };
  W.secrets.push(s); return s;
}
const knows = (s, id) => s.known.includes(id || W.player);
function secretsAbout(c) { return W.secrets.filter(s => !s.exposed && (s.subj === c.id || s.other === c.id)); }
function secretText(s) {
  const a = C(s.subj), b = C(s.other), k = s.kid && C(s.kid);
  if (s.type === 'affair') return nm(a) + '和' + nm(b) + '有私情';
  if (s.type === 'bastard') return nm(k) + '的生父其实是' + nm(b);
  return '？';
}
