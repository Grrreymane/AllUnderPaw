// A save from before the history calendar wakes up with decades of the famous overdue: they die now, quietly, each on
// the date the books give (so ages are right), successors included; one line says who is gone. Story cards their deaths
// queue still come.
function histCatchUp() {
  const gone = [];
  CATCHUP = true;
  try {
    for (let n = 0; n < 300; n++) {
      let c = null;
      for (const x of Object.values(W.chars)) if (x.hist && alive(x) && x.id !== W.player && x.dieT !== null && x.dieT !== undefined && x.dieT < W.t && (!c || x.dieT < c.dieT)) c = x;
      if (!c) break;
      die(c, true); c.dead = Math.max(c.dieT, c.born); gone.push(nm(c));
    }
  } finally { CATCHUP = false; }
  if (gone.length) logLine('你不在的这些年：' + gone.slice(0, 3).join('、') + (gone.length > 3 ? '等 ' + gone.length + ' 人' : '') + '相继去世', '#c8e0ff');
}
// saves made before the systems pass (W.v 1)
function migrate2() {
  W.v = 2; W.log = W.log || []; W.city = W.city || 'handan'; W.lastEcon = W.lastEcon || null;
  const p = P();
  for (const c of Object.values(W.chars)) {
    if (c.dieT === undefined) c.dieT = HISTD[c.id] !== undefined ? HISTD[c.id] : null;
    if (c.preg && c.preg.name && !c.preg.sex) c.preg.sex = 'M';
  }
  // nobody stays married to (or in love with) the dead: the old 长平 script killed 赵括 without telling his widow
  for (const c of Object.values(W.chars)) { if (!alive(c)) { c.lov = []; continue; } if (c.sp && !alive(C(c.sp))) c.sp = null; c.lov = c.lov.filter(id => alive(C(id))); }
  // 政 is a son
  { const z = C('zheng'); if (z && z.female) { z.female = false; z.g.sex = 'M'; z.g.O = [z.g.O[z.g.O.length - 1]]; } }
  // 华阳夫人 has no children of her own (the whole 立嗣 story rests on it)
  { const h = C('huayang'); if (h) { h.flags.barren = true; h.preg = null; } }
  // older saves renamed him at 立嗣; he is 异人 until he reaches 咸阳 at the end of act one
  { const y = C('yiren'); if (y && y.disp === '子楚' && !W.flags.act1Done) y.disp = '异人'; }
  // the mother of the first generation married in, like every later spouse
  for (const c of Object.values(W.chars)) if (c.house === 'li' && c.sur !== '狸' && !c.hist && c.id !== W.player) c.house = 'in';
  if (W.t > 9 || (C('yiren') && C('yiren').sp)) W.flags.meijiDone = true;
  if (W.flags.act1Done) for (const c of Object.values(W.chars)) if (c.hist && alive(c) && c.immortal && c.dieT === null) c.immortal = false;
  // before this version discontent only came from being passed over for head of the house
  for (const c of family()) if (c.disc > 0) c.flags.passed = true;
  // who lives where under the household model: relatives who walked out, and married 狸 other than the head and the heir
  // (the retired head and your other forebears are not a cadet branch: they stay home with their unmarried children)
  const heir = heirOf(p), elders = new Set([W.flags.elder].concat(p ? [...ancMap(p, 9).keys()] : []).filter(Boolean));
  for (const c of family()) {
    if (c.id === W.player || elders.has(c.id)) continue;
    if (c.loc === 'tavern' || c.loc === 'lvfu') { if (!c.sp) { c.flags.left = true; continue; } }
    if (c.sp && ageOf(c) >= 16 && c !== heir) {
      const s = C(c.sp);
      c.flags.branch = true; if (c.loc === 'home') c.loc = s && s.hist && cityOf(s) === W.city ? s.loc : 'market';
      if (s && !s.hist && s.house === 'in') { s.flags.branch = true; if (s.loc === 'home') s.loc = c.loc; }
      for (const k of c.kids.map(C)) if (alive(k) && k.house === 'li' && !k.sp && k.loc === 'home' && k.id !== W.player && k !== heir) { k.loc = c.loc; k.flags.branch = true; }
    }
  }
  // married-in spouses left without a husband or wife go home unless they raise 狸 children here
  for (const c of Object.values(W.chars)) if (alive(c) && c.house === 'in' && !c.sp && !c.kids.some(k => { const x = C(k); return alive(x) && x.house === 'li' && x.loc === c.loc; })) { c.house = null; delete c.flags.branch; if (c.loc === 'home') c.loc = 'market'; }
  // too many retainers for the new cap: the newest ones leave
  while (W.ret.length > RET_MAX) { const r = C(W.ret.pop()); if (r) { r.loc = 'tavern'; if (r.house === 'ret') r.house = null; } }
  // 郭纵's matchmade "children" who were older than him are only of his clan
  { const gz = C('guozong'); if (gz) for (const c of Object.values(W.chars)) if (c.dad === 'guozong' && c.born < gz.born + 4 * 18) { c.dad = null; if (c.bio === 'guozong') c.bio = null; gz.kids = gz.kids.filter(x => x !== c.id); } }
  // birth years corrected in the history data (parents were 10-13 at their children's birth)
  for (const [id, y] of [['weizhao', 325], ['xuan', 345], ['zixi', 284]]) { const c = C(id); if (c) c.born = bornAt(y); }
  // 政 doesn't live in your house (older saves put him there when you were his mother)
  { const z = C('zheng'); if (alive(z) && z.loc === 'home' && z.house !== 'li') z.loc = W.t >= 46 ? 'xianyang' : 'hostage'; }
  // 廉颇 came home after 长平; 赵括 died there
  { const l = C('lianpo'); if (alive(l) && l.loc === 'away' && W.t >= 8) l.loc = 'palace'; }
  // a history that has run on past a ruler's death: the successors
  for (const id of ['zhaowang', 'daoxiang']) { const c = C(id); if (c && !alive(c) && HIST_NEXT[id]) HIST_NEXT[id](c); }
}
