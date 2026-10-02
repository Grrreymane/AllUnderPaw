// Public family ties, negotiated succession support, and the price of keeping or breaking a promise.
// This system never reads bio, changes genes, or changes the legal order of succession.
const KIN_LIMIT = 20, KIN_TERM = 24;
const KIN_CACHE = { world: null, key: '', epoch: 0, graph: null };
function validateKinPolitics(d) {
  const K = d && d.kinPolitics;
  if (K === undefined) return true;
  const obj = x => x && typeof x === 'object' && !Array.isArray(x);
  const id = x => typeof x === 'string' && x.length > 0 && x.length <= 100;
  const turn = x => Number.isInteger(x) && x >= 0 && x <= 1000000;
  const name = x => typeof x === 'string' && x.length <= 100;
  if (!obj(K) || K.v !== 1 || !turn(K.from) || !turn(K.serial) || !obj(K.cool) || Object.keys(K.cool).length > 128) return false;
  if (!Array.isArray(K.marriages) || K.marriages.length > 128 || !Array.isArray(K.pledges) || K.pledges.length > 128 || !Array.isArray(K.effects) || K.effects.length > 64) return false;
  if (!Object.entries(K.cool).every(([k, t]) => id(k) && turn(t))) return false;
  if (!K.marriages.every(m => obj(m) && id(m.a) && id(m.b) && m.a !== m.b && turn(m.t) && (m.end === null || turn(m.end)) && (m.patron === null || id(m.patron)))) return false;
  if (!K.pledges.every(p => obj(p) && id(p.id) && id(p.head) && id(p.sponsor) && id(p.candidate) && p.head !== p.sponsor && p.head !== p.candidate && turn(p.t) &&
      name(p.sponsorName) && name(p.candidateName) && ['active', 'kept', 'broken', 'released', 'void'].includes(p.status) &&
      (p.observed === null || id(p.observed)) && (p.resolved === null || turn(p.resolved)) && typeof p.disturbed === 'boolean')) return false;
  if (!K.effects.every(e => obj(e) && id(e.from) && id(e.to) && Number.isInteger(e.n) && Math.abs(e.n) <= KIN_LIMIT && turn(e.until) && name(e.reason))) return false;
  if (K.from > d.t || new Set(K.pledges.map(p => p.id)).size !== K.pledges.length) return false;
  const activeKeys = K.pledges.filter(p => p.status === 'active').map(p => p.head + '|' + p.sponsor);
  if (new Set(activeKeys).size !== activeKeys.length) return false;
  if (!K.pledges.every(p => p.status !== 'active' || d.chars && d.chars[p.head] && d.chars[p.sponsor] && d.chars[p.candidate])) return false;
  if (!K.effects.every(e => e.until <= d.t || d.chars && d.chars[e.from] && d.chars[e.to])) return false;
  return true;
}
function kinDefaults() {
  if (!W) return;
  if (W.kinPolitics === undefined) W.kinPolitics = { v: 1, from: W.t, serial: 0, marriages: [], pledges: [], effects: [], cool: {} };
  if (!validateKinPolitics(W)) throw new Error('家族关系存档损坏');
  kinInvalidate();
}
function kinInvalidate() { KIN_CACHE.epoch++; KIN_CACHE.world = null; if (typeof CS !== 'undefined') CS.k = ''; }
function kinGraph() {
  const frame = typeof T === 'number' ? T : 0, key = W.t + '|' + frame + '|' + KIN_CACHE.epoch;
  if (KIN_CACHE.world === W && KIN_CACHE.key === key) return KIN_CACHE.graph;
  const chars = Object.values(W.chars), ancestors = new Map(), marriages = [], children = [], legalKids = new Map();
  const parents = c => c ? [c.mom, c.dad].filter(Boolean) : [];
  for (const c of chars) for (const pid of parents(c)) { if (!legalKids.has(pid)) legalKids.set(pid, []); legalKids.get(pid).push(c); }
  const livingDescendant = (c, depth, seen) => {
    if (!c || depth > 2 || seen.has(c.id)) return false;
    const next = new Set(seen); next.add(c.id);
    return (legalKids.get(c.id) || []).some(k => alive(k) || livingDescendant(k, depth + 1, next));
  };
  const map = c => {
    if (!c) return new Map();
    if (ancestors.has(c.id)) return ancestors.get(c.id);
    const A = new Map([[c.id, 0]]);
    const walk = (x, depth) => { if (!x || depth > 2) return; for (const pid of parents(x)) if (!A.has(pid) || A.get(pid) > depth) { A.set(pid, depth); walk(C(pid), depth + 1); } };
    walk(c, 1); ancestors.set(c.id, A); return A;
  };
  const related = (a, b) => {
    if (!a || !b) return false;
    const A = map(a), B = map(b);
    // Two generations: direct ancestors, siblings, aunts/uncles and first cousins, all as publicly recorded.
    for (const id of A.keys()) if (B.has(id) && A.get(id) + B.get(id) <= 4) return true;
    return false;
  };
  for (const c of chars) {
    const sp = c.sp && C(c.sp);
    if (alive(c) && alive(sp) && sp.sp === c.id && c.id < sp.id) marriages.push([c, sp]);
    if ((alive(c) || livingDescendant(c, 1, new Set())) && c.mom && c.dad && c.mom !== c.dad && C(c.mom) && C(c.dad)) children.push([C(c.mom), C(c.dad), c]);
  }
  const G = { chars, marriages, children, map, related };
  KIN_CACHE.world = W; KIN_CACHE.key = key; KIN_CACHE.graph = G; return G;
}
function kinPublicTie(a, b) {
  if (!W || !a || !b || a === b) return { n: 0, reason: '' };
  const G = kinGraph();
  const crosses = (x, y) => (G.related(a, x) && G.related(b, y)) || (G.related(a, y) && G.related(b, x));
  if (G.marriages.some(([x, y]) => crosses(x, y))) return { n: 8, reason: '婚姻相连' };
  if (G.related(a, b)) return { n: 6, reason: '公开亲族' };
  if (G.children.some(([x, y]) => crosses(x, y))) return { n: 4, reason: '后代续亲' };
  return { n: 0, reason: '' };
}
function kinPoliticsScore(c, leader) {
  if (!W || !alive(c) || !alive(leader) || c === leader) return 0;
  let n = kinPublicTie(c, leader).n;
  const K = W.kinPolitics;
  if (K) {
    for (const p of K.pledges) if (p.status === 'active' && p.head === leader.id && p.sponsor === c.id && alive(C(p.candidate))) n += p.disturbed ? -6 : 6;
    for (const e of K.effects) if (e.from === c.id && e.to === leader.id && e.until > W.t) n += e.n;
  }
  return clamp(n, -KIN_LIMIT, KIN_LIMIT);
}
function kinCandidates(head) {
  head = head || P(); if (!head) return [];
  return succCands(head).filter(([c, rank]) => rank < 9 && !c.flags.left && !c.flags.disinh && !royalOut(c)).map(([c]) => c);
}
function kinBackers(candidate) {
  if (!W || !candidate) return [];
  const G = kinGraph(), A = G.map(candidate), spouse = C(candidate.sp), SA = spouse && G.map(spouse);
  const weight = { ruler: 5, general: 4, minister: 3, noble: 2, merchant: 2, shi: 1, hostage: 2 };
  return G.chars.filter(c => alive(c) && c.id !== W.player && c !== candidate && c.house !== 'li' && c.house !== 'in' && ageOf(c) >= 16 &&
    (c.hist || ['ruler', 'general', 'minister', 'noble'].includes(c.role))).map(c => {
      let reason = A.has(c.id) && A.get(c.id) > 0 ? '亲族' : SA && SA.has(c.id) ? '姻亲' : '';
      if (!reason && W.kinPolitics && W.kinPolitics.marriages.some(m => m.patron === c.id && (A.has(m.a) || A.has(m.b)) &&
          (m.end === null && alive(C(m.a)) && alive(C(m.b)) && C(m.a).sp === m.b || G.children.some(([x, y]) => [x.id, y.id].includes(m.a) && [x.id, y.id].includes(m.b))))) reason = '媒家';
      return { c, reason, w: weight[c.role] || 1 };
    }).filter(x => x.reason).sort((a, b) => b.w - a.w || a.c.id.localeCompare(b.c.id));
}
function kinActivePledges(head) {
  const id = head ? head.id : W.player;
  return W.kinPolitics ? W.kinPolitics.pledges.filter(p => p.status === 'active' && p.head === id && alive(C(p.sponsor)) && alive(C(p.candidate))) : [];
}
function kinRecord(title, text) {
  if (typeof chronicle === 'function') chronicle('kinship', title, text);
  if (!CATCHUP && !SAVE_SUSPENDED) logLine(title + '。' + text, '#c8e0ff', true);
}
function kinOnMarriage(a, b, patron) {
  if (!W || !a || !b || a.sp !== b.id || b.sp !== a.id) return;
  if (!W.kinPolitics) kinDefaults();
  const K = W.kinPolitics;
  let m = K.marriages.find(x => x.end === null && [x.a, x.b].includes(a.id) && [x.a, x.b].includes(b.id));
  if (!m) { m = { a: a.id, b: b.id, t: W.t, end: null, patron: null }; K.marriages.push(m); }
  if (patron && patron.id !== a.id && patron.id !== b.id) m.patron = patron.id;
  if (K.marriages.length > 128) K.marriages.splice(0, K.marriages.length - 128);
  kinInvalidate();
}
function kinOnDivorce(a, b) {
  if (!W || !a || !b) return;
  if (!W.kinPolitics) kinDefaults();
  for (const m of W.kinPolitics.marriages) if (m.end === null && [m.a, m.b].includes(a.id) && [m.a, m.b].includes(b.id)) m.end = W.t;
  kinInvalidate();
  // A promise is to a living child, not ownership of a spouse: divorce does not silently erase it.
}
function kinOnBirth(mom, children) {
  kinInvalidate();
  for (const child of children || []) {
    const backers = kinBackers(child);
    if (child.house === 'li' && backers.length) kinRecord(nm(child) + '的亲族', backers.slice(0, 2).map(x => nm(x.c)).join('、') + '与这个孩子有公开亲缘。能否得到支持，还要另行商议。');
  }
}
function kinEffect(sponsor, head, n, reason, duration) {
  const K = W.kinPolitics;
  K.effects = K.effects.filter(e => !(e.from === sponsor.id && e.to === head.id && e.reason === reason));
  K.effects.push({ from: sponsor.id, to: head.id, n, until: W.t + (duration || KIN_TERM), reason });
  K.effects = K.effects.filter(e => e.until > W.t).slice(-64);
}
function kinResolve(p, status, head) {
  if (!p || p.status !== 'active') return false;
  p.status = status; p.resolved = W.t;
  const g = C(p.sponsor), child = C(p.candidate), next = head || P();
  if (alive(g) && next && status === 'kept') {
    addMemo(g, next, '继承守约', 15, KIN_TERM); kinEffect(g, next, 12, '继承守约');
    kinRecord('继承守约', p.sponsorName + '支持' + nm(next) + '接掌狸家。今后六年，旧约带来朝中支持。');
  } else if (alive(g) && next && status === 'broken') {
    addMemo(g, next, '继承失约', -25, KIN_TERM); kinEffect(g, next, -16, '继承失约');
    if (alive(child) && child !== next && ageOf(child) >= 16) passOver(child, Math.max(child.disc || 0, 25));
    kinRecord('继承失约', '曾答应' + p.sponsorName + '让' + p.candidateName + '接掌，却没有兑现。今后六年，对方会抵制' + nm(next) + '。');
  } else if (status === 'released') {
    if (alive(g) && next) addMemo(g, next, '商议解约', -5, 12);
    kinRecord('继承解约', '已与' + p.sponsorName + '解除关于' + p.candidateName + '的继承约定。');
  }
  kinInvalidate(); return true;
}
function kinOnSuccession(old, next) {
  if (!W || !old || !alive(next) || old === next) return;
  if (!W.kinPolitics) kinDefaults();
  for (const p of W.kinPolitics.pledges) if (p.status === 'active' && p.head === old.id) {
    kinResolve(p, !alive(C(p.sponsor)) || !alive(C(p.candidate)) ? 'void' : p.candidate === next.id ? 'kept' : 'broken', next);
  }
  W.queue = W.queue.filter(q => !['kin_request', 'kin_dispute'].includes(q.ev) || q.head !== old.id);
  kinInvalidate();
}
function kinOnHeirChange() {
  if (!W || !W.kinPolitics || !P()) return;
  const h = heirNow(), id = h ? h.id : null;
  for (const p of kinActivePledges()) if (p.observed !== id) { p.disturbed = id !== p.candidate; p.observed = id; }
  kinInvalidate();
}
function kinPromise(sponsor, candidate) {
  if (!W || !alive(P()) || !alive(sponsor) || !kinCandidates().includes(candidate)) return null;
  if (!W.kinPolitics) kinDefaults();
  if (kinActivePledges().some(p => p.sponsor === sponsor.id)) return null;
  const K = W.kinPolitics, h = heirNow();
  let id; do { id = 'kp' + (++K.serial); } while (K.pledges.some(p => p.id === id));
  const p = { id, head: W.player, sponsor: sponsor.id, candidate: candidate.id, sponsorName: nm(sponsor), candidateName: nm(candidate),
    t: W.t, status: 'active', observed: h ? h.id : null, disturbed: false, resolved: null };
  // Bound history without discarding a live promise.
  if (K.pledges.length >= 128) { const i = K.pledges.findIndex(x => x.status !== 'active'); if (i < 0) return null; K.pledges.splice(i, 1); }
  K.pledges.push(p); K.cool[sponsor.id] = W.t + 16; K.cool.offer = W.t + 12;
  kinRecord('继承之约', '你答应' + nm(sponsor) + '让' + nm(candidate) + '接掌狸家；家法与当前继承人不会因此自动改变。');
  kinInvalidate(); return p;
}
function kinOfferAllowed(g, child) {
  return alive(P()) && alive(g) && kinCandidates().includes(child) && kinBackers(child).some(x => x.c === g) &&
    opinion(g, P()) >= 0 && !kinActivePledges().some(p => p.sponsor === g.id) && !(W.kinPolitics && W.kinPolitics.cool[g.id] > W.t);
}
function kinOfferDone(g) { W.kinPolitics.cool[g.id] = W.t + 16; W.kinPolitics.cool.offer = W.t + 12; }
function kinCanName(c) { return W.law === '择贤' && ageOf(c) >= 16 && (c.dad === W.player || c.mom === W.player) && kinCandidates().includes(c); }
function kinCanDiscuss(p, h = heirNow()) {
  return !!p && p.status === 'active' && p.head === W.player && alive(C(p.sponsor)) && alive(C(p.candidate)) &&
    (p.disturbed || !h || p.candidate !== h.id);
}
EV.kin_request = e => {
  if (!e || e.head && e.head !== W.player) return null;
  const g = C(e.g), child = C(e.k), h = heirNow();
  if (!kinOfferAllowed(g, child)) return null;
  const promise = k => { if (!kinOfferAllowed(g, child) || !kinCandidates().includes(k)) return; kinPromise(g, k); };
  const O = [opt('答应让' + nm(child) + '接掌', '立下继承之约 · 政治倾向+6 · 未改家法', () => promise(child))];
  if (h && h !== child) O.push(opt('备礼，请他支持' + nm(h), '鱼干-60 · 支持现任嗣 · 同样需要守约', () => {
    if (W.fish < 60 || !kinOfferAllowed(g, child) || heirNow() !== h) return;
    const p = kinPromise(g, h); if (p) addFish(-60);
  }, () => W.fish >= 60 && heirNow() === h));
  O.push(opt('只谈培养，不许继承', '鱼干-40 · 孩子最高一项能力+1 · 不立约', () => {
    if (W.fish < 40 || !kinOfferAllowed(g, child)) return;
    addFish(-40); child.st[bestSt(child)] = Math.min(30, child.st[bestSt(child)] + 1); kinOfferDone(g);
    kinRecord('另择出路', '你婉拒' + nm(g) + '的继承请托，出资培养' + nm(child) + '。');
  }, () => W.fish >= 40));
  O.push(opt('狸家的继承，由狸家决定', nm(g) + '好感-8 · 不立约', () => { if (!kinOfferAllowed(g, child)) return; addOp(g, P(), -8); kinOfferDone(g); kinRecord('拒绝请托', '你没有向' + nm(g) + '许诺' + nm(child) + '的继承。'); }));
  return { title: '姻亲请托', who: [g.id, child.id], text: nm(g) + '替' + nm(child) + '说话，希望将来由这个孩子接掌狸家。' +
    (h ? '眼下按家法，继承人是' + nm(h) + '。' : '眼下还没有定下继承人。') + '亲缘只是来往的理由；一旦许诺，换家主时就要兑现。', opts: O };
};
EV.kin_dispute = e => {
  if (!e || e.head !== W.player || !W.kinPolitics) return null;
  const p = W.kinPolitics.pledges.find(x => x.id === e.p), g = p && C(p.sponsor), child = p && C(p.candidate), h = heirNow();
  if (!kinCanDiscuss(p, h)) return null;
  const valid = () => p.status === 'active' && p.head === W.player && alive(g) && alive(child);
  const reassure = () => {
    if (!valid()) return;
    p.disturbed = false; p.observed = heirNow() ? heirNow().id : null; W.kinPolitics.cool.dispute = W.t + 12;
    W.queue = W.queue.filter(q => q.ev !== 'kin_dispute' || q.p !== p.id || q.head !== W.player);
    kinInvalidate();
  };
  const O = [];
  if (kinCanName(child)) O.push(opt('现在立' + nm(child) + '为嗣', '按择贤家法改立 · 其他旧约仍需兑现', () => {
    if (!valid() || !kinCanName(child)) return;
    W.heirId = child.id; addMemo(child, P(), '立为嗣', 20); kinOnHeirChange(); reassure();
    logLine('你立' + nm(child) + '为嗣', '#ffe08a'); didAct('nameHeir', child, -1, true);
  }));
  O.push(opt('旧约仍在，交接时兑现', '保留承诺 · 当前继承顺序不变', reassure));
  O.push(opt('备礼解约，仍按家法', '鱼干-60 · ' + nm(g) + '好感-5 · 解除承诺', () => { if (!valid() || W.fish < 60) return; addFish(-60); kinResolve(p, 'released'); }, () => W.fish >= 60));
  O.push(opt('这份约定作罢', '失约 · ' + nm(g) + '好感-25 · 政治倾向-16，六年', () => { if (valid()) kinResolve(p, 'broken'); }));
  return { title: '继承之争', who: [g.id, child.id].concat(h && h !== child ? [h.id] : []), text: '你曾答应' + nm(g) + '，让' + nm(child) + '接掌狸家。' +
    (p.disturbed ? '如今继承人变成了' : '眼下继承人仍是') + (h ? nm(h) : '无人') + '，这与承诺尚未一致。家法不会被外家自动改写，但旧约也不会自行消失。', opts: O };
};
function kinSuccessionHint(candidate) {
  if (!candidate || !W) return '';
  const pledged = kinActivePledges().filter(p => p.candidate === candidate.id), missed = kinActivePledges().filter(p => p.candidate !== candidate.id);
  const b = kinBackers(candidate).slice(0, 2).map(x => nm(x.c));
  return [pledged.length ? '守约：' + pledged.map(p => p.sponsorName).join('、') : b.length ? '亲族：' + b.join('、') : '',
    missed.length ? '失约' + missed.length + '家' : ''].filter(Boolean).join(' · ');
}
function kinShowRequest(g, child) { const e = EV.kin_request({ g: g.id, k: child.id, head: W.player }); if (e) showEvent(e, 'kin_request'); }
function openKinPolitics() {
  if (!W) return; if (!W.kinPolitics) kinDefaults();
  const h = heirNow(), promises = kinActivePledges();
  const rows = [{ t: '现任嗣：' + (h ? nm(h) : '无人') + ' · ' + LAWN[W.law || '嫡长'], s: '亲缘与许诺影响支持，不会自动改写家法。', wrap: true }];
  for (const p of promises) {
    const discuss = kinCanDiscuss(p, h);
    rows.push({ t: p.sponsorName + '支持' + p.candidateName + (discuss ? ' · 商议 ›' : ''), s: (p.disturbed ? '继承人改变，旧约有争议' : '已许诺，等家主交接时兑现') + ' · ' + (h && h.id === p.candidate ? '与现任嗣一致' : '当前嗣并非此人'), wrap: true,
      close: discuss, fn: discuss ? () => { const e = EV.kin_dispute({ p: p.id, head: W.player }); if (e) showEvent(e, 'kin_dispute'); } : null });
  }
  for (const c of kinCandidates()) {
    const B = kinBackers(c); if (!B.length && c !== h) continue;
    rows.push({ t: nm(c) + (c === h ? ' · 嗣' : ''), s: B.length ? B.map(b => nm(b.c) + '（' + b.reason + '）').join('、') : '眼下没有显达亲族支持', wrap: true, close: true, fn: () => openSheet(c.id) });
    for (const { c: g } of B) if (kinOfferAllowed(g, c)) rows.push({ t: '与' + nm(g) + '商议' + nm(c) + '的继承 ›', s: '可许诺、调停，或拒绝；先听条件。', close: true, fn: () => kinShowRequest(g, c) });
  }
  for (const e of W.kinPolitics.effects.filter(e => e.to === W.player && e.until > W.t && alive(C(e.from)))) rows.push({ t: nm(C(e.from)) + ' · ' + e.reason, s: '政治倾向' + (e.n >= 0 ? '+' : '') + e.n + ' · 还有' + (e.until - W.t) + '季', wrap: true });
  for (const p of W.kinPolitics.pledges.filter(p => p.status !== 'active').slice(-6).reverse()) rows.push({ t: p.sponsorName + ' → ' + p.candidateName, s: ({ kept: '已守约', broken: '已失约', released: '已解约', void: '当事人去世，旧约终止' })[p.status], wrap: true });
  if (!promises.length) rows.push({ t: '尚无继承承诺。成亲不会自动替你许诺。', wrap: true });
  openList('姻亲与继承', rows, { sub: '婚姻相连 +8 · 后代续亲 +4 · 亲族 +6，取最高；总影响至多±20' });
}
function kinSheetRows(c, rows) {
  if (!W || !c || !alive(c)) return;
  if (c.id === W.player) { const P0 = kinActivePledges(); rows.push({ chip: '姻亲', col: '#8a5a10', text: (P0.length ? '继承承诺 ' + P0.length + '份' : '姻亲与继承') + ' ›', fn: openKinPolitics }); return; }
  const text = kinSuccessionHint(c);
  if (c.house === 'li' && text) rows.push({ chip: '后援', col: '#8a5a10', text: text + ' ›', fn: openKinPolitics });
  const tie = kinPublicTie(c, P()), score = kinPoliticsScore(c, P());
  if (c.house !== 'li' && (tie.n || score)) rows.push({ chip: '亲缘', col: '#6a5a8a', text: (tie.reason || '继承旧约') + ' · 对你政治倾向' + (score >= 0 ? '+' : '') + score + ' ›', fn: openKinPolitics });
}
function kinAgenda() {
  if (!W || !alive(P())) return null;
  const P0 = kinActivePledges(), h = heirNow(), conflict = P0.find(p => p.disturbed || !h || p.candidate !== h.id);
  if (conflict) return { pri: 35, title: '继承之约尚待安排', text: '你答应' + conflict.sponsorName + '让' + conflict.candidateName + '接掌；当前继承人却是' + (h ? nm(h) : '无人') + '。可以守约，也可以付出代价解约。', detail: '选择新家主前可查看每个候选人的守约与失约后果', fn: openKinPolitics };
  if (P0.length) return { pri: 55, title: '把继承旧约交给下一代', text: P0.map(p => p.sponsorName + '支持' + p.candidateName).join('；') + '。交接时守约，支持会跟随新家主六年；失约则反过来。', detail: '目前有' + P0.length + '份继承承诺', fn: openKinPolitics };
  return null;
}
function kinSeason() {
  if (!W || !W.kinPolitics) return;
  const K = W.kinPolitics;
  K.effects = K.effects.filter(e => e.until > W.t && C(e.from) && C(e.to));
  for (const key of Object.keys(K.cool)) if (K.cool[key] <= W.t) delete K.cool[key];
  for (const p of K.pledges) if (p.status === 'active' && (!alive(C(p.sponsor)) || !alive(C(p.candidate)))) kinResolve(p, 'void');
  kinOnHeirChange(); kinInvalidate();
  if (!alive(P()) || CATCHUP || SAVE_SUSPENDED || W.queue.some(q => ['kin_request', 'kin_dispute'].includes(q.ev))) return;
  const dispute = kinActivePledges().find(p => p.disturbed);
  if (dispute && !(K.cool.dispute > W.t)) { K.cool.dispute = W.t + 12; W.queue.push({ ev: 'kin_dispute', p: dispute.id, head: W.player }); return; }
  if (W.t < 8 || K.cool.offer > W.t) return;
  for (const c of kinCandidates()) {
    if (ageOf(c) < 6) continue;
    const b = kinBackers(c).find(x => opinion(x.c, P()) >= 0 && kinOfferAllowed(x.c, c));
    if (b) { K.cool.offer = W.t + 12; W.queue.push({ ev: 'kin_request', g: b.c.id, k: c.id, head: W.player }); return; }
  }
}
SYS.init.push(kinDefaults);
SYS.load.push(kinDefaults);
SYS.season.push(kinSeason);
SYS.sheet.push(kinSheetRows);
SYS.acts.push((c, acts) => {
  if (!W || !alive(c) || !alive(P()) || c.id === W.player || !reach(c)) return;
  const candidates = kinCandidates().filter(k => kinOfferAllowed(c, k));
  if (!candidates.length) return;
  acts.push(mkAct({ id: 'kinnegotiate', n: '商议继承', ap: 0, grp: '家', hint: '先听亲族的条件，再决定是否许诺', fn: () => {
    if (candidates.length === 1) kinShowRequest(c, candidates[0]);
    else pickChar('商议谁的继承？', candidates, child => kinShowRequest(c, child));
  } }));
});
