// ---------------------------------------------------------- character card
// an office at the 秦 court outranks the station a cat was born to (吕不韦 the 商贾 becomes 相邦)
function officeOf(c) {
  const A = W && W.a2; if (!A || !c || !alive(c) || !W.flags.act1Done) return '';
  const is = v => v === c.id || (v === 'lv' && c.id === 'lv');
  if (is(A.zhongfu)) return '仲父'; if (is(A.xiang)) return '相邦';
  if (c.id === 'lv') return A.lvDown ? '失势' : cityOf(c) === 'xianyang' ? '客卿' : '';
  return '';
}
const ROLEN = { ruler: '国君', noble: '贵族', minister: '重臣', shi: '士', hostage: '质子', general: '将军', merchant: '商贾', commoner: '平民', dancer: '舞姬' };
const SCN_LOCS = new Set(['home', 'market', 'hostage', 'lvfu', 'tavern', 'pingyuan', 'palace', 'gate']);
// where a cat is, in words: the city when it's in another one, else the place in town
function placeOf(c) {
  if (c.loc === 'away') return LOCN.away;
  const ct = cityOf(c);
  if (ct && ct !== W.city && CITY[ct]) return CITY[ct].n;
  return LOCN[c.loc] || '远方';
}
function pipRow(n, max, x, y, on, off) { for (let i = 0; i < max; i++) rect(x + i * 5, y, 4, 4, i < n ? on : off); }
// Groups fold actions into one button each on a card (an action's grp: '友' | '谋' | '家'; anything else gets its own group)
const ACTG = { 友: '交游', 谋: '计谋', 家: '家事', 更多: '更多' }, GORD = ['友', '谋', '家'];
function grpBtn(c, k, list) {
  return { n: (ACTG[k] || k) + ' ▾', gk: k, inner: list, open: true, look: list.some(a => actState(a).on) ? 'dark' : 'off', hint: list.map(a => a.n).join(' · '),
    fn: () => MODAL.push({ type: 'acts', c: c.id, k, title: nm(c) + ' · ' + (ACTG[k] || k) }) };
}
// A card's buttons, never more than 8: primary and gold actions, one button per group (a group of one shows the
// action itself), whatever still doesn't fit under 更多, and 族谱 last (its fn is set by the card).
function sheetButtons(c, ro) {
  const out = [], groups = new Map();
  for (const a of ro ? [] : charActions(c)) { if (!a.grp || a.gold) out.push(a); else { if (!groups.has(a.grp)) groups.set(a.grp, []); groups.get(a.grp).push(a); } }
  const ord = k => GORD.indexOf(k) + 1 || 9;
  for (const k of [...groups.keys()].sort((a, b) => ord(a) - ord(b))) { const l = groups.get(k); out.push(l.length === 1 ? l[0] : grpBtn(c, k, l)); }
  if (out.length > 7) { const rest = out.splice(6).flatMap(a => a.inner || [a]); out.push(grpBtn(c, '更多', rest)); }
  out.push({ n: '族谱', ap: 0, open: true, look: 'dark', hint: c.house === 'li' ? '狸氏' : c.sur + '氏', fn: () => {} });
  return out;
}
function drawSheet(m) {
  const c = C(m.id), p = P(); if (!c) { drop(m); return; }
  HITS = [];
  g.globalAlpha = .55; rect(0, 0, W_, H, '#0a0810'); g.globalAlpha = 1;
  paper(3, 18, 174, 300);
  btn(158, 22, 16, 14, '×', 'dark', () => drop(m));
  const me = c.id === W.player, live = alive(c), away = live && !me && !inCity(c);
  // their portrait sits in front of where they live (质子府, 吕府, …)
  const faceArt = drawPortrait(c, 10, 26, 2);
  if (faceArt) faceArt.cutouts = [[10, 80, 64, 10]];
  if (SCN_LOCS.has(c.loc) && !away) { g.drawImage(scene(c.loc), 58, 20, 64, 64, 10, 26, 64, 64); if (!faceArt) g.drawImage(portrait(c), 10, 26, 64, 64); }
  if (characterArtKey(c)) { btnFrame(10, 80, 64, 10, 'dark'); txt('查看立绘 ›', 42, 85, 5.5, '#fff6dc', 'center', null); hit(10, 26, 64, 64, () => openCharacterArt(c)); }
  // this season's energy, next to the close button
  const nPip = m.ro ? 0 : Math.max(apMax(p), W.ap);
  for (let k = 0; k < nPip; k++) g.drawImage(k < W.ap ? ICON.ap : ICON.apOff, 151 - (nPip - k) * 6, 27);
  txt(nm(c), 80, 32, fitSize(nm(c), 68 - nPip * 6, 10), '#3a2418', 'left', null);
  const L = catLook(c), rt = relTo(c);
  txt(`${ageOf(c)}岁 · ${c.female ? '女' : '男'} · ${L.coat}`, 80, 45, 6, '#5a3a20', 'left', null, 1, 1);
  const role = me ? RANKS[W.rank] : officeOf(c) || ROLEN[c.role] || '';
  const rl = [c.house === 'li' ? '狸氏' : c.state + '国', W.ret.includes(c.id) ? '门客' : role, rt ? '你的' + rt : '',
    c.dead !== null ? '已故' : away ? (c.loc === 'away' ? LOCN.away : '在' + placeOf(c)) : ''].filter(Boolean).join(' · ');
  txt(rl, 80, 55, fitSize(rl, 92, 6), rt ? '#94562f' : '#6a4a30', 'left', null);
  if (!me && live) {
    const o = opinion(c, p), s = '对你 ' + (o > 0 ? '+' : '') + o, ow = tw(s, 7);
    txt(s, 80, 67, 7, opCol(o), 'left', null);
    rect(82 + ow, 62, 9, 10, '#5a4a60'); txt('›', 86.5 + ow, 66.5, 7, '#ffffff', 'center', null);
    hit(78, 59, 90, 16, () => { const why = [], v = opinion(c, p, why); MODAL.push({ type: 'why', c: c.id, why, v }); });
  } else if (me) {
    // health, and 心烦 as pips: all three lit means a breakdown is coming
    const hp = R(c.health), sl = stressLv(c);
    g.drawImage(ICON.heart, 80, 63); txt(hp, 90, 67, 7, hp < 40 ? '#b0301f' : '#3a2418', 'left', null);
    txt('心烦', 112, 67, 6, '#6a4a30', 'left', null, 1, 1); pipRow(sl, 3, 126, 65, sl >= 2 ? '#c0304a' : '#d0608a', '#d8c8a8');
  }
  statRow(c, 80, 76);
  const btns = sheetButtons(c, m.ro), by0 = 312 - Math.ceil(btns.length / 2) * 23;
  btns[btns.length - 1].fn = () => { drop(m); openFamily(c.house === 'li' ? null : c.id, m.ro); };
  const lim = by0 - 4 - (away ? 10 : 0), sysRows = [];
  runSys('sheet', c, sysRows);
  const again = o => { drop(m); openSheet(o.id, m.ro); };
  // The info rows are laid out once without drawing; if they would reach the buttons they fold tighter:
  // lv 1 = one row per relation (+N opens the rest), one secret, statuses as chips; lv 2 = traits and fur in one row too.
  const body = lv => {
    let ty = chipFlow(traitsOf(c), 10, 96, 170, trLabel, traitCol, t => traitCard(t, c), lv >= 2 ? 1 : 9, r => toast(r.map(trLabel).join(' '), '#f2ead4')) + 2;
    // what anyone can read off the fur (the clues the genetics system uses)
    txt('相猫', 10, ty + 5, 6, LABC, 'left', null);
    ty = chipFlow(furTags(L), 34, ty, 172, t => t, () => '#7a7068', null, lv >= 2 ? 1 : 9, r => toast(r.join(' '), '#f2ead4')) + 4;
    const relLine = (label, ids) => {
      const cs = ids.map(C).filter(Boolean); if (!cs.length) return;
      txt(label, 10, ty + 5, 6, LABC, 'left', null);
      ty = chipFlow(cs, 34, ty, 172, o => nm(o), o => alive(o) ? (o.house === 'li' ? '#94562f' : '#5a5060') : '#8a8288', again, lv >= 1 ? 1 : 9, () => pickChar(nm(c) + '的' + label, cs, again));
    };
    relLine('配偶', c.sp ? [c.sp] : []);
    relLine('父母', [c.dad, c.mom].filter(Boolean));
    if (knownBio(c)) relLine('生父', [c.bio]);
    relLine('手足', Object.values(W.chars).filter(o => o !== c && ((c.dad && o.dad === c.dad) || (c.mom && o.mom === c.mom))).sort((x, y) => x.born - y.born).map(o => o.id));
    relLine('子女', visibleChildren(c).map(k => k.id));
    if (me || p.lov.includes(c.id)) relLine('情猫', c.lov.filter(id => me || id === W.player));
    const secs = secretsAbout(c).filter(s => knows(s)), nS = lv >= 1 ? 1 : 2;
    secs.slice(0, nS).forEach((s, i) => {
      const plus = i === nS - 1 && secs.length > nS, ls = wrapT(secretText(s), plus ? 128 : 150, 6, 1);
      img(ICON.seal, 10, ty + 1); ls.forEach((l, j) => txt(l, 20, ty + 5 + j * 9, 6, '#a03050', 'left', null, 1, 1));
      if (plus) chip('+' + (secs.length - nS), 152, ty, '#a03050', () => openList(nm(c) + '的秘密', secs.map(x => ({ icon: ICON.seal, t: secretText(x), wrap: true }))));
      ty += ls.length * 9 + 3;
    });
    const sts = statusOf(c).filter(x => x.n !== '有孕' || c.house === 'li' || me || c.sp === W.player || c.preg.f === W.player || ageOf(c) > 0);
    const say = st => toast(st.n + (st.d ? '：' + st.d : ''), '#f2ead4');
    if (lv >= 1) ty = chipFlow(sts, 10, ty, 170, st => st.n, st => st.col, say, 1, r => r.forEach(say));
    else for (const st of sts) { const w = chip(st.n, 10, ty, st.col, () => say(st)); if (st.d) txt(fitT(st.d, 154 - w, 5.5, 1), 16 + w, ty + 5, 5.5, '#6a4a30', 'left', null, 1, 1); ty += 12; }
    // a child's schooling so far: points per subject, stars on the one leading (the trait it becomes at 16)
    if (c.edu && ageOf(c) >= 3 && ageOf(c) < 16 && c.edu.some(v => v > 0)) {
      const w = chip('所学', 10, ty, '#3f8a5e'), best = c.edu.indexOf(Math.max(...c.edu)), pts = c.edu[best];
      const s = [0, 1, 2, 3].filter(i => c.edu[i] > 0).sort((a, b) => c.edu[b] - c.edu[a]).map(i => LESSON[i] + c.edu[i] + (i === best ? ' ' + '★'.repeat(pts >= 6 ? 3 : pts >= 3 ? 2 : 1) : '')).join(' · ');
      txt(fitT(s, 154 - w, 6, 1), 16 + w, ty + 5, 6, '#3a2418', 'left', null, 1, 1); ty += 12;
    }
    // rows from the systems: { chip, col, text, fn }
    for (const r of sysRows) {
      let x = 10;
      if (r.chip) x += chip(r.chip, 10, ty, r.col || '#5a5060', r.fn) + 4;
      if (r.text) txt(fitT(r.text, 170 - x, 6, 1), x, ty + 5, 6, r.tcol || '#3a2418', 'left', null, 1, 1);
      if (r.fn) hit(10, ty - 2, 160, 14, r.fn);
      ty += 12;
    }
    return ty;
  };
  DRY = true; let lv = 0, ty = body(0); while (ty > lim && lv < 2) ty = body(++lv); DRY = false;
  const cut = ty > lim;   // even folded it doesn't fit: clip it, never draw over the buttons
  if (cut) { g.save(); g.beginPath(); g.rect(4, 92, 172, lim - 92); g.clip(); TCLIP = [4, 92, 172, lim - 92]; HCLIP = [92, lim]; }
  const q0 = TQ.length; body(lv);
  if (cut) { g.restore(); TCLIP = HCLIP = null; txt('▼', 170, lim - 2, 5.5, LABC, 'center', null); }
  m.lv = lv; m.cut = cut; m.by0 = by0; m.nBtn = btns.length; m.tyMax = TQ.slice(q0).reduce((a, t) => Math.max(a, t.y + t.size / 2), 0);
  // (out of reach: only what goes by letter is on the buttons)
  if (away) txt((c.loc === 'away' ? LOCN.away : '人在' + placeOf(c)) + (btns.length > 1 ? '，只能书信往来' : '，见不到面'), 90, by0 - 8, 6, '#6a6058', 'center', null, 1, 1);
  btns.forEach((a, i) => actBtn(a, 9 + (i & 1) * 82, by0 + (i >> 1) * 23, 78, 20, { who: c }));
  TANCH = [by0 - 3, -1];
}
// rows scroll inside [y0, y1]; rows cut by the edges are drawn clipped. rowH: a number or it => number.
// Returns how many rows are (partly) below the viewport, for a '▼ 还有N' cue outside it.
function listRows(items, y0, y1, key, drawRow, rowH) {
  if (SCR.key !== key) { SCR.key = key; SCR.y = 0; }
  SCR.maxX = 0; SCR.minY = 0;
  const hOf = typeof rowH === 'function' ? rowH : () => rowH || 36;
  let total = 0; const tops = items.map(it => { const t = total; total += hOf(it); return t; });
  SCR.max = Math.max(0, total - (y1 - y0)); SCR.y = clamp(SCR.y, 0, SCR.max);
  g.save(); g.beginPath(); g.rect(0, y0, W_, y1 - y0); g.clip(); TCLIP = [0, y0, W_, y1 - y0]; HCLIP = [y0, y1];
  let more = 0;
  items.forEach((it, i) => {
    const y = y0 + tops[i] - SCR.y, h = hOf(it);
    if (y + h > y1 + 1) more++;
    if (y + h > y0 && y < y1) drawRow(it, y, h);
  });
  TCLIP = HCLIP = null; g.restore();
  if (SCR.max > 0) { const vh = y1 - y0, bh = Math.max(8, vh * vh / total); rect(174, R(y0 + (SCR.y / SCR.max) * (vh - bh)), 3, R(bh), '#6a4a30'); }
  return more;
}
// info(c) -> { txt, col } replaces the opinion number on the right
function charRow(c, y, fn, extra, info) {
  drawPortrait(c, 12, y + 2, 1);
  const inf = info ? info(c) : c.id !== W.player && alive(c) ? (o => ({ txt: (o > 0 ? '+' : '') + o, col: opCol(o) }))(opinion(c, P())) : null;
  txt(fitT(nm(c), 46, 7.5), 50, y + 10, 7.5, alive(c) ? '#3a2418' : '#6a6058', 'left', null);
  // the four stats at a glance, on the name line (so you can pick a retainer or a match without opening every card)
  // (a long note on the right, as in the court list, sends them down beside the traits)
  const low = !!(inf && inf.txt && 168 - tw(String(inf.txt), 6.5) < 153);
  if (alive(c)) for (let i = 0; i < 4; i++) txt(STATN[i] + stat(c, i), (low ? 116 : 98) + i * 13.5, y + (low ? 29 : 10), 5.5, STATC[i], 'left', null);
  txt(fitT(`${ageOf(c)}岁 ${c.female ? '女' : '男'} · ${catLook(c).coat}${c.preg && alive(c) ? ' · 有孕' : ''}${extra ? ' · ' + extra : ''}`, 120, 5.5, 1), 50, y + 20, 5.5, '#5a3a20', 'left', null, 1, 1);
  txt(fitT(traitsOf(c).slice(0, 4).join(' '), low ? 62 : 120, 5.5, 1), 50, y + 29, 5.5, LABC, 'left', null, 1, 1);
  if (inf && inf.txt) txt(inf.txt, 168, y + 10, 6.5, inf.col || '#3a2418', 'right', null);
  hit(8, y, 164, 34, fn);
}
function drawFamily(m) {
  HITS = [];
  g.globalAlpha = .55; rect(0, 0, W_, H, '#0a0810'); g.globalAlpha = 1;
  paper(3, 18, 174, 300);
  const f = m.focus && C(m.focus), ours = !f || f.house === 'li';
  txt(ours ? '狸氏族谱' : f.sur + '氏族谱', 10, 30, 9, '#3a2418', 'left', null);
  btn(158, 22, 16, 14, '×', 'dark', () => drop(m));
  if (ours) btn(122, 22, 32, 14, m.list ? '分支图' : '名册', 'dark', () => { m.list = !m.list; m.scr.key = ''; });
  if (m.list && ours) { drawFamilyList(m); return; }
  // zoom out for an overview (tap a cat there to zoom back in on it); 我 / 归位 re-centres the view
  btn(ours ? 96 : 130, 22, 24, 14, m.zoom ? '细看' : '全览', 'dark', () => { m.zoom = !m.zoom; });
  btn(ours ? 74 : 104, 22, ours ? 20 : 24, 14, ours ? '我' : '归位', 'dark', () => { m.center = null; m.scr.key = ''; });
  TANCH = [296, -1];
  drawTree(m, ours ? null : f);
}
function drawFamilyList(m) {
  SCR.maxX = 0; SCR.minY = 0;
  // the blood, their spouses, and a widowed spouse who stays on to raise 狸 children (homeTick keeps her while they are there)
  const wedLi = c => c.sp && C(c.sp) && C(c.sp).house === 'li';
  const liv = Object.values(W.chars).filter(c => c.house === 'li' || (c.house === 'in' && (wedLi(c) || (alive(c) && !c.sp && (c.loc === 'home' || c.flags.branch)))));
  liv.sort((a, b) => (b.id === W.player) - (a.id === W.player) || (alive(b) - alive(a)) || a.born - b.born);
  const items = liv.map(c => ({ c })).concat(W.ret.map(C).filter(alive).map(c => ({ c, ret: 1 })));
  const y0 = 40, y1 = 300, hn = heirNow();
  const more = listRows(items, y0, y1, 'family', (it, y) => {
    const c = it.c, fl = c.flags || {}, tag = c.id === W.player ? '家主' : it.ret ? '门客' : c.dead !== null ? '已故' : c.house === 'in' ? (c.sp ? '媳婿' : c.female ? '遗孀' : '鳏夫') : fl.branch ? '分户' : fl.left ? '离家' : c.disc >= 40 ? '不满' : c.loc !== 'home' ? '在外' : '';
    charRow(c, y, () => openSheet(c.id, m.ro), tag);
    if (c === hn) chip('嗣', R(53 + tw(fitT(nm(c), 92, 7.5), 7.5)), y + 5, HEIRC);   // the heir: a gold tag after the name
  });
  if (more) txt('▼ 还有' + more + '人', 90, 307, 5.5, LABC, 'center', null, 1, 1);
  TANCH = [y1 - 2, -1];
}
// CK-style branching tree of the 狸 bloodline; drag to pan in both directions.
// Each blood member stands with their partners to the right (current spouse, or the other parent of their children);
// children hang from the middle of the couple.
const NODE_W = 42, GEN_H = 58;
function bloodOf(f) {
  // everyone reachable from f through parents and children who carries f's surname
  const set = new Set([f.id]), todo = [f];
  while (todo.length) {
    const c = todo.pop();
    for (const id of [c.mom, c.dad, knownBio(c) ? c.bio : null].concat(visibleChildren(c).map(k => k.id))) { const o = C(id); if (o && !set.has(o.id) && o.sur === f.sur && o.house !== 'li') { set.add(o.id); todo.push(o); } }
  }
  return Object.values(W.chars).filter(c => set.has(c.id));
}
// NW / GH: node width and generation height (smaller for the zoomed-out overview).
// fold { ids, open, all }: in a big clan only the direct line of ids (ancestors and descendants) branches out; everyone
// else's children fold into a '+N' stub (n.fold) until opened (all: fold nothing, but keep the same order).
function treeLayout(focus, NW, GH, fold) {
  NW = NW || NODE_W; GH = GH || GEN_H;
  const li = focus ? bloodOf(focus) : Object.values(W.chars).filter(c => c.house === 'li');
  const mem = new Set(li.map(c => c.id));
  const isLi = id => mem.has(id);
  const kidsIn = c => c.kids.map(C).filter(k => k && mem.has(k.id) && (k.dad === c.id || k.mom === c.id));
  let line = null; const ancs = new Set();
  if (fold) {
    const all = new Set(fold.open || []);
    for (const id of fold.ids) {
      if (!id || !mem.has(id)) continue;
      const up = [C(id)], down = [C(id)];
      while (up.length) { const x = up.pop(); all.add(x.id); ancs.add(x.id); for (const q of [x.dad, x.mom]) if (q && mem.has(q) && !ancs.has(q)) up.push(C(q)); }
      while (down.length) { const x = down.pop(); all.add(x.id); for (const k of kidsIn(x)) down.push(k); }
    }
    if (li.length > 20 && !fold.all) line = all;
  }
  const count = c => kidsIn(c).reduce((t, k) => t + 1 + count(k), 0);
  const placed = new Set(), nodes = [];
  const partnersOf = c => {
    const ids = [c.sp].concat(c.kids.map(C).filter(Boolean).map(k => k.dad === c.id ? k.mom : k.mom === c.id ? k.dad : null));
    return [...new Set(ids)].filter(id => id && C(id) && !placed.has(id)).map(C).sort((a, b) => (b.id === c.sp) - (a.id === c.sp) || a.born - b.born);
  };
  const build = c => {
    placed.add(c.id);
    const ps = partnersOf(c); ps.forEach(q => placed.add(q.id));
    // partners sit on alternating sides so each is next to the member: 1st right, 2nd left, 3rd further right…
    const slot = i => i % 2 === 0 ? i / 2 + 1 : -(i + 1) / 2;
    const other = k => { const o = k.dad === c.id ? k.mom : k.dad, j = ps.findIndex(q => q.id === o); return j < 0 ? 0 : slot(j); };
    const kids = c.kids.map(C).filter(k => k && mem.has(k.id) && (k.dad === c.id || k.mom === c.id) && !placed.has(k.id)).sort((a, b) => other(a) - other(b) || a.born - b.born);
    const n = { c, ps, slots: ps.map((q, i) => slot(i)), kids: [] };
    if (line && !line.has(c.id) && kids.length) n.fold = count(c);
    else for (const k of kids) if (!placed.has(k.id)) { const kn = build(k); kn.via = other(k); n.kids.push(kn); }
    // stand your line's child in the middle of its siblings, so its parents sit right above it
    const lk = n.kids.length > 2 && n.kids.find(kn => ancs.has(kn.c.id));
    if (lk && n.kids.every(kn => kn.via === lk.via)) {
      const rest = n.kids.filter(kn => kn !== lk), tot = n.kids.reduce((t, kn) => t + kn.w, 0);
      let best = 0, bd = 1e9, left = 0;
      for (let i = 0; i <= rest.length; i++) { const d = Math.abs(left + lk.w / 2 - tot / 2); if (d < bd) { bd = d; best = i; } if (i < rest.length) left += rest[i].w; }
      rest.splice(best, 0, lk); n.kids = rest;
    }
    n.unit = NW * (1 + ps.length);
    // breathing room between sibling households; a lone leaf needs little
    n.w = Math.max(n.unit + R(NW * (ps.length || n.kids.length ? .24 : .1)), n.kids.reduce((t, k) => t + k.w, 0));
    return n;
  };
  const roots = li.filter(c => !isLi(c.dad) && !isLi(c.mom)).sort((a, b) => (b.female ? 0 : 1) - (a.female ? 0 : 1) || a.born - b.born);
  const trees = [];
  for (const r of roots) if (!placed.has(r.id)) trees.push(build(r));
  const place = (n, left, gen) => {
    n.x = left + n.w / 2; n.y = gen * GH;
    const leftN = n.slots.filter(v => v < 0).length;
    n.mx = n.x - n.unit / 2 + NW * leftN + NW / 2;   // the blood member; partner i sits at mx + slot * NW
    nodes.push(n);
    let l = left + (n.w - n.kids.reduce((t, k) => t + k.w, 0)) / 2;
    for (const k of n.kids) { place(k, l, gen + 1); l += k.w; }
  };
  let x = 0;
  for (const t of trees) { place(t, x, 0); x += t.w + 10; }
  return { nodes, w: x, h: nodes.reduce((m, n) => Math.max(m, n.y), 0) + GH, NW, GH };
}
function drawTree(m, focus) {
  const z = !!m.zoom, PS = z ? 16 : 32, k = PS / 32, fid = focus ? focus.id : W.player, S = SCR;
  m.open = m.open || [];
  const T0 = treeLayout(focus, z ? 22 : NODE_W, z ? 34 : GEN_H, { ids: [fid, m.center], open: m.open, all: z }), NW = T0.NW, GH = T0.GH;
  const vx = 6, vy = 40, vw = 168, vh = 258;
  const at = id => { for (const n of T0.nodes) { if (n.c.id === id) return [n, n.mx]; const i = n.ps.findIndex(q => q.id === id); if (i >= 0) return [n, n.mx + NW * n.slots[i]]; } return [null, 0]; };
  const fnode = at(fid)[0], pn = fnode && fnode.c.id === fid ? T0.nodes.find(q => q.kids.includes(fnode)) : null;
  const key = 'tree' + fid + (z ? 'z' : '') + (m.center || '');
  if (S.key !== key) {
    S.key = key;
    let [n, wx] = at(m.center || fid); if (!n) { n = T0.nodes[0]; wx = n ? n.mx : 0; }
    let wy = n ? n.y : 0;
    // open on you together with your parents when they fit side by side
    if (!m.center && pn && Math.abs(pn.mx - wx) < vw - 40) { wx = (pn.mx + wx) / 2; wy = (pn.y + wy) / 2; }
    S.x = wx + 10 - vw / 2; S.y = wy + 6 + PS / 2 - vh / 2;
  }
  S.maxX = Math.max(1, T0.w - vw + 20); S.max = Math.max(1, T0.h - vh + 20); S.minY = 0;
  S.x = clamp(S.x, 0, S.maxX); S.y = clamp(S.y, 0, S.max);
  const ox = vx + 10 - S.x, oy = vy + 6 - S.y, LINE = '#8a6a4a', hp = PS / 2;
  rect(vx, vy, vw, vh, '#e8dcc0');
  g.save(); g.beginPath(); g.rect(vx, vy, vw, vh); g.clip();
  // branches: from the middle of the couple down to each child
  for (const n of T0.nodes) {
    const y = R(oy + n.y);
    // marriage lines: double red for the current spouse, a single thin line for concubines and former partners
    n.ps.forEach((q, i) => {
      const sl = n.slots[i], a = R(ox + n.mx + (sl > 0 ? hp : sl * NW + hp)), b = R(ox + n.mx + (sl > 0 ? sl * NW - hp : -hp));
      if (n.c.sp === q.id) { rect(a, y + hp - 1, b - a, 1, PAL.lacq); rect(a, y + hp + 1, b - a, 1, PAL.lacq); } else rect(a, y + hp, b - a, 1, LINE);
    });
    // one branch per partner, dropping from the middle of that couple
    const groups = new Map();
    for (const kn of n.kids) { if (!groups.has(kn.via)) groups.set(kn.via, []); groups.get(kn.via).push(kn); }
    const ky = R(oy + n.y + GH - 3 * k), bar = y + PS + R(14 * k);
    for (const [j, ks] of groups) {
      const px = R(ox + n.mx + j * NW / 2), py = j ? y + hp + 2 : y + PS + R(8 * k);
      rect(px, py, 1, bar - py, LINE);
      const a = Math.min(px, R(ox + ks[0].mx)), b = Math.max(px, R(ox + ks[ks.length - 1].mx));
      rect(a, bar, b - a + 1, 1, LINE);
      for (const kn of ks) rect(R(ox + kn.mx), bar, 1, ky - bar, LINE);
    }
  }
  // cats (the heir wears a gold 嗣 tag on the corner; a gold dot when zoomed out)
  const hn = focus ? null : heirNow();
  const drawCat = (c, cx, cy) => {
    const x = R(cx - hp), y = R(cy), me = c.id === W.player, blood = focus ? c.sur === focus.sur : c.house === 'li';
    if (x < vx - 40 || x > vx + vw + 8 || y < vy - 50 || y > vy + vh + 8) return;
    const faceArt = drawPortrait(c, x, y, k, me ? PAL.gold : !alive(c) ? '#b8b0a8' : blood ? '#e8d4a8' : '#d4dcc4');
    if (me) { rect(x - 2, y - 2, PS + 4, 1, PAL.lacq); rect(x - 2, y + PS + 1, PS + 4, 1, PAL.lacq); rect(x - 2, y - 2, 1, PS + 4, PAL.lacq); rect(x + PS + 1, y - 2, 1, PS + 4, PAL.lacq); }
    if (c === hn) {
      if (z) { rect(x + PS - 4, y - 1, 5, 5, OUT); rect(x + PS - 3, y, 3, 3, PAL.gold); if (faceArt) faceArt.cutouts = [[x + PS - 4, y - 1, 5, 5]]; }
      else { const cw = chip('嗣', x + PS - 9, y - 3, HEIRC); if (faceArt) faceArt.cutouts = [[x + PS - 9, y - 3, cw, 10]]; }
    }
    if (!z) { const label = blood ? (c.disp || c.name) : nm(c); txt(label.length > 4 ? label.slice(0, 4) : label, x + hp, y + 38, 5.5, alive(c) ? '#3a2418' : '#6a6058', 'center', null, 1, 1); }
    const hx = Math.max(x, vx), hy = Math.max(y, vy), hw = Math.min(x + PS, vx + vw) - hx, hh = Math.min(y + PS, vy + vh) - hy;
    if (hw > 4 && hh > 4) hit(hx, hy, hw, hh, z ? () => { m.zoom = false; m.center = c.id; } : () => openSheet(c.id, m.ro));
  };
  TCLIP = [vx, vy, vw, vh];
  for (const n of T0.nodes) { drawCat(n.c, ox + n.mx, oy + n.y); n.ps.forEach((q, i) => drawCat(q, ox + n.mx + NW * n.slots[i], oy + n.y)); }
  TCLIP = null;
  g.restore();
  // folded households: '+N' under the member opens their branch
  for (const n of T0.nodes) if (n.fold) {
    const s = '+' + n.fold, w = tw(s, 6) + 6, x = R(ox + n.mx - w / 2), y = R(oy + n.y + PS + 11);
    if (x > vx && x + w < vx + vw && y > vy && y + 10 < vy + vh) chip(s, x, y, '#6a5a4a', () => m.open.push(n.c.id));
  }
  // parents off to one side: a chip at the edge of their row pans over to them
  if (pn) {
    const sx = ox + pn.mx, sy = clamp(R(oy + pn.y + hp - 5), vy + 2, vy + vh - 12), go = () => { S.x = clamp(pn.mx + 10 - vw / 2, 0, S.maxX); };
    if (sx < vx + 4) chip('‹ 父母', vx + 2, sy, '#6a5a4a', go);
    else if (sx > vx + vw - 4) chip('父母 ›', vx + vw - tw('父母 ›', 6) - 8, sy, '#6a5a4a', go);
  }
  if (T0.nodes.length === 1 && !T0.nodes[0].ps.length) txt('史书上没有记下' + ta(T0.nodes[0].c) + '的亲族', 90, 150, 6.5, LABC, 'center', null, 1, 1);
  txt(z ? '拖动查看 · 点头像放大' : '拖动查看 · 点头像看详情', 90, 306, 5.5, LABC, 'center', null, 1, 1);
}
function drawPick(m) {
  HITS = [];
  g.globalAlpha = .55; rect(0, 0, W_, H, '#0a0810'); g.globalAlpha = 1;
  const list = (m.show || m.list).map(C).filter(Boolean), h = Math.min(262, 40 + list.length * 36 + 24), y = R((H - h) / 2), y0 = y + 22, y1 = y + h - 26;
  paper(3, y, 174, h);
  txt(m.title, 90, y + 12, fitSize(m.title, 156, 7.5), '#3a2418', 'center', null);
  const more = listRows(list, y0, y1, 'pick', (c, ry) => {
    charRow(c, ry, () => { drop(m); m.fn(c); }, null, m.info);
    hit(12, ry + 2, 32, 32, () => openSheet(c.id, true));   // the portrait only looks; the rest of the row chooses
  });
  if (more) txt('▼ 还有' + more + '人', 12, y + h - 14, 5.5, LABC, 'left', null, 1, 1);
  txt('点头像看详情', 168, y + h - 14, 5.5, LABC, 'right', null, 1, 1);
  btn(60, y + h - 22, 60, 16, '算了', 'dark', () => drop(m));
  TANCH = offPaper(y, h);
}
function drawWhy(m) {
  const c = C(m.c); HITS = [];
  if (!c) { drop(m); return; }
  g.globalAlpha = .45; rect(0, 0, W_, H, '#0a0810'); g.globalAlpha = 1;
  const rowsN = Math.max(1, m.why.length), h = 36 + rowsN * 11 + 14 + 22, y = R((H - h) / 2);
  paper(18, y, 144, h);
  txt(nm(c) + '对你的看法', 90, y + 12, 7.5, '#3a2418', 'center', null);
  if (!m.why.length) txt('没什么特别的看法', 90, y + 30, 6.5, LABC, 'center', null);
  m.why.forEach(([l, v], i) => { txt(fitT(l, 100, 6.5, 1), 28, y + 28 + i * 11, 6.5, '#4a3020', 'left', null, 1, 1); txt((v > 0 ? '+' : '') + v, 152, y + 28 + i * 11, 6.5, opCol(v * 2), 'right', null); });
  // the total as the card shows it (CK-style); the terms can add up past the ±100 cap
  const sum = m.why.reduce((t, w) => t + w[1], 0), v = m.v === undefined ? sum : m.v, ty = y + 28 + rowsN * 11 + 3;
  rect(28, ty - 6, 124, 1, '#c8b088');
  txt('合计' + (sum !== v ? '（上限 ±100）' : ''), 28, ty, 6.5, '#3a2418', 'left', null, 1, 1);
  txt((v > 0 ? '+' : '') + v, 152, ty, 7, opCol(v), 'right', null);
  btn(60, y + h - 20, 60, 15, '好', 'dark', () => drop(m));
  hit(0, 0, W_, H, () => drop(m));
  HITS.unshift(HITS.pop());
  TANCH = [20, 1];
}
// notices for a centred window: under it when there is room for three, else above it (never over its rows)
const offPaper = (y, h) => y + h + 14 <= H ? [y + h + 3, 1] : [y - 3, -1];
// the list window (openList)
function drawList(m) {
  HITS = [];
  g.globalAlpha = .55; rect(0, 0, W_, H, '#0a0810'); g.globalAlpha = 1;
  const o = m.opt || {}, rows = (typeof m.rows === 'function' ? m.rows() : m.rows) || [];
  const tx = r => r.por ? 50 : r.icon ? 18 + r.icon.width : r.dot ? 21 : 12;
  const tW = r => (r.act ? 118 : r.right ? 164 - tw(r.right, 6.5) : 168) - tx(r);
  const hOf = r => r.h || (r.por ? 36 : r.wrap ? 8 + wrapT(r.t, tW(r), 6.5, 1).length * 9 + (r.s ? 8 : 0) : r.s ? 22 : 16);
  const total = rows.reduce((t, r) => t + hOf(r), 0), top0 = o.sub ? 32 : 22;
  const h = Math.min(272, top0 + Math.max(total, 24) + 28), y = R((H - h) / 2), y0 = y + top0, y1 = y + h - 26;
  paper(3, y, 174, h);
  txt(m.title, 90, y + 12, fitSize(m.title, 150, 7.5), '#3a2418', 'center', null);
  if (o.sub) txt(fitT(o.sub, 156, 5.5, 1), 90, y + 22, 5.5, LABC, 'center', null, 1, 1);
  if (!rows.length) txt(o.empty || '什么也没有', 90, y0 + 12, 6.5, LABC, 'center', null, 1, 1);
  const more = listRows(rows, y0, y1, 'list', (r, ry, rh) => {
    const x = tx(r);
    if (r.fn) hit(8, ry, 164, rh, () => { if (r.close) drop(m); r.fn(); });
    if (r.por) drawPortrait(r.por, 12, ry + 2, 1);
    else if (r.icon) g.drawImage(r.icon, 12, R(ry + (rh - r.icon.height) / 2));
    else if (r.dot) rect(13, R(ry + rh / 2 - 2), 4, 4, r.dot);
    if (r.wrap) wrapT(r.t, tW(r), 6.5, 1).forEach((l, i) => txt(l, x, ry + 8 + i * 9, 6.5, '#2a1a10', 'left', null, 1, 1));
    else txt(fitT(r.t, tW(r), 7), x, r.s ? ry + 8 : ry + rh / 2, 7, '#3a2418', 'left', null);
    if (r.s) txt(fitT(r.s, 168 - x, 5.5, 1), x, ry + rh - 7, 5.5, '#6a4a30', 'left', null, 1, 1);
    if (r.right) txt(r.right, 168, r.s || r.wrap ? ry + 8 : ry + rh / 2, 6.5, r.col || '#3a2418', 'right', null);
    if (r.act) actBtn(r.act, 122, R(ry + (rh - 18) / 2), 48, 18, { pre: r.close ? () => drop(m) : null });
    rect(10, ry + rh - 1, 160, 1, '#e0cfa8');
  }, hOf);
  if (more) txt('▼ 还有' + more + '项', 12, y + h - 14, 5.5, LABC, 'left', null, 1, 1);
  btn(60, y + h - 22, 60, 16, o.close || '关闭', 'dark', () => { drop(m); if (o.onClose) o.onClose(); });
  TANCH = offPaper(y, h);
}
// a group button's actions, as full-width rows with the same renderer
function drawActs(m) {
  const c = C(m.c); HITS = [];
  const b = c && alive(c) ? sheetButtons(c, false).find(x => x.gk === m.k) : null, list = b ? b.inner : [];
  if (!list.length) { drop(m); return; }
  g.globalAlpha = .55; rect(0, 0, W_, H, '#0a0810'); g.globalAlpha = 1;
  const rh = 25, h = Math.min(262, 30 + list.length * rh + 26), y = R((H - h) / 2), y0 = y + 22, y1 = y + h - 26;
  paper(3, y, 174, h);
  txt(m.title, 90, y + 12, fitSize(m.title, 150, 7.5), '#3a2418', 'center', null);
  const more = listRows(list, y0, y1, 'acts', (a, ry) => actBtn(a, 12, ry + 1, 156, 22, { who: c, pre: () => drop(m) }), rh);
  if (more) txt('▼ 还有' + more + '项', 12, y + h - 14, 5.5, LABC, 'left', null, 1, 1);
  btn(60, y + h - 22, 60, 16, '算了', 'dark', () => drop(m));
  TANCH = offPaper(y, h);
}
// the little conversation card after an interaction: you on the left, them on the right with a speech bubble
function drawTalk(m) {
  const c = C(m.c), p = P(), t = T - m.t0; HITS = [];
  if (t > 3.2 || !c) return;   // update() takes it away
  g.globalAlpha = .35; rect(0, 0, W_, H, '#0a0810'); g.globalAlpha = 1;
  const y = 186, e = Math.min(1, t * 5), bounce = R(Math.abs(Math.sin(Math.min(t, .6) * 10)) * 3 * (1 - Math.min(1, t * 1.6)));
  paper(8, y, 164, 82);
  drawPortrait(p, R(14 - (1 - e) * 20), y + 12, 1, '#e8d4a8');
  drawPortrait(c, R(134 + (1 - e) * 20), y + 12 - bounce, 1);
  const lines = wrapT(m.line, 76, 7, 1), bh = 10 + lines.length * 10;
  rect(50, y + 12, 80, bh, OUT); rect(51, y + 13, 78, bh - 2, '#ffffff');
  rect(130, y + 18, 3, 1, OUT); rect(129, y + 19, 3, 1, '#ffffff'); rect(130, y + 20, 3, 1, OUT);
  lines.forEach((l, i) => txt(l, 90, y + 18 + i * 10, 7, '#2a1a10', 'center', null, 1, 1));
  txt(nm(c) + (m.note ? ' · ' + m.note : ''), 90, y + 66, 6, '#6a4a30', 'center', null, 1, 1);
  // floating symbols: hearts for warmth, a fish arcing over for gifts, a question mark when it goes badly
  const ic = ICON[m.fx === 'q' ? 'qm' : m.fx];
  for (let i = 0; i < 4; i++) {
    const k = t * 1.2 - i * .18; if (k < 0 || k > 1) continue;
    g.globalAlpha = 1 - k * k;
    const fx = m.fx === 'fish' ? 40 + k * 94 : 146 + Math.sin(i * 2.1 + k * 6) * 6;
    const fy = m.fx === 'fish' ? y + 20 - Math.sin(k * Math.PI) * 28 : y + 10 - k * 30;
    g.drawImage(ic, R(fx), R(fy));
  }
  g.globalAlpha = 1;
  hit(0, 0, W_, H, () => drop(m));
}
const TOUR = [
  [[0, 0, 180, 17], '年份、小鱼干和名望。一回合是一季。'],
  [[0, 18, 118, 24], '当前目标。不知道做什么，就看这里。'],
  [[0, 42, 180, 86], '画面里的猫都能点。点开能看性情、和你的关系，还能互动。'],
  [[0, 129, 180, 40], '这是你。点头像看自己，「家族」看族谱。'],
  [[0, 170, 180, 98], '能做的事。每件花 1~2 点精力（◆）。'],
  [[0, 269, 180, 24], '精力用完就结束本季。大事和意外多在季末发生。'],
  // (the guide can be replayed with '?' long after act one, when the two have gone to 咸阳)
  [[0, 294, 180, 26], () => '家、市、宫、人、行。' + (W.act === 1 && !W.flags.act1Done ? '异人和吕不韦都在「人」里。' : '城里的人都在「人」里。')],
];
// m.steps (same shape as TOUR) shows a short tip instead of the full guide; a step's text may be a function
function drawTour(m) {
  HITS = [];
  const steps = m.steps || TOUR, [r, t0] = steps[m.i], text = typeof t0 === 'function' ? t0() : t0, [x, y, w, h] = r, many = steps.length > 1;
  g.fillStyle = 'rgba(10,8,16,.72)';
  g.fillRect(0, 0, W_, y); g.fillRect(0, y + h, W_, H - y - h); g.fillRect(0, y, x, h); g.fillRect(x + w, y, W_ - x - w, h);
  const a = .5 + .5 * Math.abs(Math.sin(T * 3));
  g.globalAlpha = a; rect(x, y, w, 1, '#ffd24a'); rect(x, y + h - 1, w, 1, '#ffd24a'); rect(x, y, 1, h, '#ffd24a'); rect(x + w - 1, y, 1, h, '#ffd24a'); g.globalAlpha = 1;
  const lines = wrapT(text, 144, 7, 1), bh = 22 + lines.length * 10 + (many ? 6 : 0), by = y + h + 6 + bh < H ? y + h + 6 : y - bh - 6;
  paper(10, by, 160, bh);
  lines.forEach((l, i) => txt(l, 18, by + 9 + i * 10, 7, '#2a1a10', 'left', null, 1, 1));
  txt((many ? (m.i + 1) + ' / ' + steps.length + '  ' : '') + '点任意处继续', 162, by + bh - 7, 5.5, LABC, 'right', null, 1, 1);
  const end = () => { drop(m); if (!m.steps) W.flags.tourDone = true; saveGame(); };
  hit(0, 0, W_, H, () => { m.i++; if (m.i >= steps.length) end(); });
  if (many) btn(16, by + bh - 15, 28, 11, '跳过', 'dark', end);   // registered after the full-screen tap, so it wins
}
function drawOpts(m) {
  HITS = [];
  g.globalAlpha = .55; rect(0, 0, W_, H, '#0a0810'); g.globalAlpha = 1;
  const oh = m.opts.some(o => o.s) ? 22 : 18, h = 34 + m.opts.length * (oh + 3) + 22, y = R((H - h) / 2);
  paper(10, y, 160, h);
  txt(m.title, 90, y + 12, fitSize(m.title, 140, 7.5), '#3a2418', 'center', null);
  m.opts.forEach((o, i) => btn(18, y + 24 + i * (oh + 3), 144, oh, o.n, o.style || 'jade', () => { drop(m); o.fn(); }, o.s));
  btn(60, y + h - 20, 60, 15, '算了', 'dark', () => drop(m));
  TANCH = [20, 1];
}
