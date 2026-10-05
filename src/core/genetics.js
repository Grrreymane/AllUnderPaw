// ============================================================ genetics (docs/genetics_family.md)
// Coat colour follows real cat genetics so that a kid's fur can betray who the father really is.
// Each locus is a pair [from dad, from mom]; O is X-linked (toms carry one copy).
const FREQ = { O: .22, b: .08, d: .28, A: .55, Tm: .65, Sp: .12, S: .32, W: .012, cs: .04, I: .05, l: .22 };
function randGenome(r, sex, f) {
  const F = Object.assign({}, FREQ, f || {}), al = (p, a, b) => r() < p ? a : b;
  const g = { sex };
  g.O = sex === 'F' ? [al(F.O, 'O', 'o'), al(F.O, 'O', 'o')] : [al(F.O, 'O', 'o')];
  g.B = [al(F.b, 'b', 'B'), al(F.b, 'b', 'B')];
  g.D = [al(F.d, 'd', 'D'), al(F.d, 'd', 'D')];
  g.A = [al(F.A, 'A', 'a'), al(F.A, 'A', 'a')];
  g.T = [al(F.Tm, 'Tm', 'tb'), al(F.Tm, 'Tm', 'tb')];
  g.Sp = [al(F.Sp, 'Sp', 'sp'), al(F.Sp, 'Sp', 'sp')];
  g.S = [al(F.S, 'S', 's'), al(F.S, 'S', 's')];
  g.W = [al(F.W, 'W', 'w'), 'w'];
  g.C = [al(F.cs, 'cs', 'C'), al(F.cs, 'cs', 'C')];
  g.I = [al(F.I, 'I', 'i'), al(F.I, 'I', 'i')];
  g.L = [al(F.l, 'l', 'L'), al(F.l, 'l', 'L')];
  g.eye = [+r().toFixed(2), +r().toFixed(2)];
  for (const k of ['size', 'ear', 'whisk']) g[k] = [+(r() * 4 - 2).toFixed(2), +(r() * 4 - 2).toFixed(2)];
  const ta = () => { const x = r(); return x < .12 ? 1 : x < .24 ? -1 : 0; };
  for (const k of ['wit', 'body', 'look']) g[k] = [[ta(), ta()], [ta(), ta()]];
  g.hid = [0, 1, 2, 3].map(() => [r() < .07 ? 1 : 0, r() < .07 ? 1 : 0]);
  return g;
}
const MUT = { color: .004, W: .001, regress: .1, trait: .03 };
const ALLELES = { B: ['B', 'b'], D: ['D', 'd'], A: ['A', 'a'], T: ['Tm', 'tb'], Sp: ['Sp', 'sp'], S: ['S', 's'], C: ['C', 'cs'], I: ['I', 'i'], L: ['L', 'l'] };
function gamete(g, r) {
  const pk = pair => pair[r() < .5 ? 0 : 1], x = {};
  for (const k in ALLELES) { let a = pk(g[k]); if (r() < MUT.color) a = pick(ALLELES[k]); x[k] = a; }
  x.W = r() < MUT.W ? 'W' : pk(g.W);
  x.O = g.O.length === 2 ? pk(g.O) : g.O[0];
  for (const k of ['eye', 'size', 'ear', 'whisk']) x[k] = +(pk(g[k]) + (r() + r() - 1) * .15).toFixed(2);
  const ta = v => { if (v !== 0 && r() < MUT.regress) return 0; if (r() < MUT.trait) return clamp(v + (r() < .5 ? -1 : 1), -1, 1); return v; };
  for (const k of ['wit', 'body', 'look']) x[k] = g[k].map(loc => ta(pk(loc)));
  x.hid = g.hid.map(loc => pk(loc));
  return x;
}
function breed(mom, dad, r, sex) {
  const m = gamete(mom, r), d = gamete(dad, r);
  sex = sex || (r() < .5 ? 'M' : 'F');
  const k = { sex };
  for (const key of Object.keys(ALLELES).concat(['W', 'eye', 'size', 'ear', 'whisk'])) k[key] = [d[key], m[key]];
  k.eye = k.eye.map(v => clamp(v, 0, 1)); for (const key of ['size', 'ear', 'whisk']) k[key] = k[key].map(v => clamp(v, -2, 2));
  if (sex === 'F') k.O = [d.O, m.O];
  else k.O = [m.O];                                       // a son's X always comes from his mother
  for (const key of ['wit', 'body', 'look']) k[key] = d[key].map((a, i) => [a, m[key][i]]);
  k.hid = d.hid.map((a, i) => [a, m.hid[i]]);
  return k;
}
const has = (pair, a) => pair.includes(a);
function phenotype(g) {
  const p = {}, dil = !has(g.D, 'D'), choc = !has(g.B, 'B');
  p.eu = dil ? (choc ? 'lilac' : 'blue') : (choc ? 'choco' : 'black');
  p.red = dil ? 'cream' : 'red';
  const oc = g.O.filter(a => a === 'O').length;
  p.orange = oc === 0 ? 'none' : (g.O.length === 1 || oc === 2) ? 'all' : 'tortie';
  p.agouti = has(g.A, 'A');
  p.tabby = p.agouti || p.orange === 'all';
  p.tabbyType = has(g.T, 'Tm') ? (has(g.Sp, 'Sp') ? 'spot' : 'Tm') : 'tb';
  p.silver = has(g.I, 'I');
  p.point = !has(g.C, 'C');
  p.white = g.S.filter(a => a === 'S').length;
  p.allWhite = has(g.W, 'W');
  p.long = !has(g.L, 'L');
  const e = (g.eye[0] + g.eye[1]) / 2;
  p.eye = e < .25 ? 'copper' : e < .5 ? 'gold' : e < .75 ? 'hazel' : 'green';
  if (p.point) p.eye = 'blue';
  const avg = k => (g[k][0] + g[k][1]) / 2;
  p.size = avg('size'); p.ear = avg('ear'); p.whisk = avg('whisk');
  const sc = k => g[k].flat().reduce((s, v) => s + v, 0);
  p.wit = sc('wit'); p.body = sc('body'); p.look = sc('look');
  p.sickly = g.hid.filter(l => l[0] && l[1]).length;
  return p;
}
const EU = { black: '#2f2a36', blue: '#7a8496', choco: '#5f3d2c', lilac: '#ab9ca6' };
const RED = { red: '#e38a3e', cream: '#f0cf9a' };
const WHITE = '#f4f0e8';
const EYE = { copper: '#d9772b', gold: '#e8b93a', hazel: '#b3aa3c', green: '#7fb85a', blue: '#6fb4ec' };
// visible fur facts, in the words the 相猫 (cat-reading) clues use
function furTags(p) {
  if (p.allWhite) return ['一身雪白'];
  const t = [];
  t.push(p.orange === 'all' ? '橘色' : p.orange === 'tortie' ? '黑橘相间' : '不带橘');
  if (p.orange !== 'all') t.push(p.agouti ? '虎斑' : '纯色');
  t.push(p.white ? (p.white === 2 ? '大片白' : '有白斑') : '无白');
  if (p.silver) t.push('银毛');
  if (p.point) t.push('重点色');
  if (p.long) t.push('长毛');
  if (p.eu === 'blue' || p.eu === 'lilac' || (p.orange === 'all' && p.red === 'cream')) t.push('淡色');
  return t;
}
function coatName(p) {
  if (p.allWhite) return '白猫';
  const wh = p.white > 0;
  if (p.point) return '重点色';
  if (p.orange === 'all') return p.red === 'cream' ? (wh ? '奶油白' : '奶油猫') : (wh ? '橘白' : '橘猫');
  if (p.orange === 'tortie') return wh ? (p.eu === 'blue' ? '淡三花' : '三花') : (p.eu === 'blue' ? '淡玳瑁' : '玳瑁');
  if (p.agouti) {
    if (p.silver) return wh ? '银虎斑白' : '银虎斑';
    const n = { black: '狸花', blue: '蓝虎斑', choco: '棕虎斑', lilac: '丁香虎斑' }[p.eu];
    return wh ? n + '白' : n;
  }
  if (p.eu === 'black') return wh ? '奶牛' : '黑猫';
  return ({ blue: '蓝猫', choco: '巧克力', lilac: '丁香' })[p.eu] + (wh ? '白' : '');
}
// A kid whose fur is impossible for its official parents gives the secret away. 0 = fine, 1 = odd (recessive), 3 = proof.
function checkParentage(kid, mom, dad) {
  const k = phenotype(kid.g), m = phenotype(mom.g), d = phenotype(dad.g);
  let lvl = 0; const why = [];
  // (a son's orange comes only from his mother, and O never mutates, so a son can't betray his father this way)
  if (kid.female && !k.allWhite && k.orange !== 'none' && m.orange === 'none' && d.orange === 'none') { lvl = 3; why.push('橘'); }
  if (kid.female && !k.allWhite && k.orange === 'none' && d.orange === 'all') { lvl = 3; why.push('橘'); }
  // an all-orange daughter got an O from each parent
  if (kid.female && !k.allWhite && k.orange === 'all' && (m.orange === 'none' || d.orange === 'none') && !why.length) { lvl = 3; why.push('全橘'); }
  // dilute is recessive: two dilute parents can't have a dense kit
  if (k.red === 'red' && m.red === 'cream' && d.red === 'cream' && !k.allWhite && !m.allWhite && !d.allWhite) { lvl = 3; why.push('淡'); }
  if (k.allWhite && !m.allWhite && !d.allWhite) { lvl = 3; why.push('白'); }
  if (k.silver && !m.silver && !d.silver) { lvl = 3; why.push('银'); }
  if (k.white > 0 && !k.allWhite && m.white === 0 && d.white === 0 && !m.allWhite && !d.allWhite) { lvl = 3; why.push('白斑'); }
  if (k.agouti && k.orange === 'none' && !m.agouti && !d.agouti && m.orange === 'none' && d.orange === 'none') { lvl = 3; why.push('虎斑'); }
  if (!lvl && ((k.point && !m.point && !d.point) || (k.long && !m.long && !d.long))) { lvl = 1; why.push('隐性'); }
  return { lvl, why };
}
const CLUE_TXT = { '橘': '父母都不带橘色，这孩子却有橘毛', '全橘': '女儿一身全橘，可爹娘总有一个身上没有一根橘毛', '淡': '父母的毛色都是淡的，这孩子却是浓色', '白': '父母都不是白猫，这孩子却一身雪白', '银': '父母都没有银毛，这孩子却有', '白斑': '父母身上一点白都没有，这孩子却白了下巴和胸口', '虎斑': '父母都是纯色，这孩子却长出了虎斑' };
