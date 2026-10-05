// ---------------------------------------------------------- relations & opinion
function rel(a, b) { return a.rel[b.id] || (a.rel[b.id] = { op: 0 }); }
function addOp(a, b, n, quiet) {
  if (!a || !b || a === b) return;
  const r = rel(a, b); r.op = clamp(r.op + n, -100, 100);
  if (!quiet && b.id === W.player && n) toast(nm(a) + '好感 ' + (n > 0 ? '+' : '') + n, n > 0 ? '#9fe89a' : '#ff9a8a');
}
// memories: opinion that doesn't fade with time (u = expiry turn, null = for life). Same k replaces; at most 6 per pair.
function addMemo(a, b, k, v, dur) {
  if (!a || !b || a === b) return;
  const r = rel(a, b), m = r.m || (r.m = []);
  const i = m.findIndex(x => x.k === k); if (i >= 0) m.splice(i, 1);
  m.push({ k, v, u: dur ? W.t + dur : null });
  if (m.length > 6) { m.sort((x, y) => Math.abs(y.v) - Math.abs(x.v)); m.length = 6; }
}
const memoOf = (a, b, k) => { const r = a && b && a.rel[b.id]; const x = r && r.m && r.m.find(q => q.k === k); return x ? x.v : 0; };
const isKin = (a, b) => a.mom === b.id || a.dad === b.id || b.mom === a.id || b.dad === a.id || a.bio === b.id || b.bio === a.id ||
  (a.mom && a.mom === b.mom) || (a.dad && a.dad === b.dad);
// ancestors up to `max` generations: id -> generation (1 = parent). Pruned ancestors still count by id.
function ancMap(c, max) {
  const m = new Map();
  const walk = (x, d) => { if (!x || d > max) return; for (const pid of [x.mom, x.dad, x.bio]) if (pid && !(m.get(pid) <= d)) { m.set(pid, d); walk(C(pid), d + 1); } };
  walk(c, 1); return m;
}
// too close to court or marry: ancestor/descendant within 3 generations, siblings and half-siblings, aunts/uncles and
// nieces/nephews (a shared ancestor that is the parent of one of them). First cousins are allowed, as in CK3.
function closeKin(a, b) {
  if (!a || !b) return false; if (a === b) return true;
  const A = ancMap(a, 3), B = ancMap(b, 3);
  if (A.has(b.id) || B.has(a.id)) return true;
  for (const [id, d] of A) if (B.has(id) && Math.min(d, B.get(id)) === 1) return true;
  return false;
}
// opinion of a toward b; pass an array as `why` to get the CK-style breakdown [[reason, value], ...]
function opinion(a, b, why) {
  if (!a || !b) return 0;
  if (a === b) return 100;
  let v = 0;
  const add = (label, n) => { n = Math.round(n); if (!n) return; v += n; if (why) why.push([label, n]); };
  const r = a.rel[b.id];
  add('交情', r ? r.op : 0);
  if (r && r.m) for (const x of r.m) if (x.u === null || x.u > W.t) add(x.k, x.v);
  const tA = traitsOf(a), tB = traitsOf(b);
  for (const t of tA) { if (!TR[t] || TR[t].k) continue; if (tB.includes(t)) add('都' + t, 5); if (TR[t].op && tB.includes(TR[t].op)) add(t + '看不惯' + TR[t].op, -7); }
  const lk = congenital(b).find(t => t.k === 'look'); if (lk) add(lk.n, lk.v * 4);
  if (a.sp === b.id) add('夫妻', 15);
  if (a.mom === b.id || a.dad === b.id || b.mom === a.id || b.dad === a.id) add('骨肉', 20);
  else if ((a.mom && a.mom === b.mom) || (a.dad && a.dad === b.dad)) add('手足', 8);
  if (a.lov.includes(b.id)) add('情人', 25);
  const tag = r && r.tag;
  if (tag === 'friend') add('挚友', 25); if (tag === 'rival') add('宿敌', -35);
  // fame counts in tiers (career: 有名 +5 … 名动天下 +20)
  if (b.id === W.player) { const pt = prestTier(); add('名望·' + pt.n, pt.op); }
  if (a.house === 'li' && b.id === W.player && a.disc) add(a.flags.passed ? '被越过继承' : '家里断粮', -a.disc / 2);
  // an exposed bastard knows what the town says about them, and blames the house
  if (a.flags.bastard && b.id === W.player) add('私生', -10);
  runSys('opinion', a, b, add);
  return clamp(Math.round(v), -100, 100);
}
// how c is related to the player, for text like 你的哥哥狸伯鱼
function relTo(c) {
  const p = W && P(); if (!c || !p || c === p) return '';
  if (p.sp === c.id) return c.female ? '妻子' : '丈夫';
  if (c.id === p.dad) return '父亲'; if (c.id === p.mom) return '母亲';
  if (c.dad === p.id || c.mom === p.id) return c.female ? '女儿' : '儿子';
  if ((c.mom && c.mom === p.mom) || (c.dad && c.dad === p.dad)) return c.born < p.born ? (c.female ? '姐姐' : '哥哥') : (c.female ? '妹妹' : '弟弟');
  const pk = visibleChildren(p);
  if (pk.some(k => k.sp === c.id)) return c.female ? '儿媳' : '女婿';
  if (pk.some(k => c.dad === k.id || c.mom === k.id)) return c.female ? '孙女' : '孙子';
  if (p.lov.includes(c.id)) return '情人';
  if (W.ret.includes(c.id)) return '门客';
  return '';
}
const who = c => (relTo(c) ? '你的' + relTo(c) : '') + nm(c);
