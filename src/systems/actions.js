// ============================================================ player actions
function spendAp(n) { if (W.ap < n) { toast('这季没有精力了', '#ff9a8a'); SFX.no(); return false; } W.ap -= n; return true; }
// An action: { id, n, ap, fish, hint, ok(), no(), fn, grp, danger, gold, kind, remote }. ok() stays a boolean (the bots call it);
// no() gives the short reason it can't be done right now ('' when it can).
function mkAct(o) { if (o.no && !o.ok) o.ok = () => !o.no(); return o; }
// Five fixed tabs, the same in every city. Where a cat lives (c.loc) only decides which list and backdrop they show up in.
const TABS = { home: { n: '家', scene: 'home' }, market: { n: '市', scene: 'market' }, court: { n: '宫', scene: 'palace' }, people: { n: '人', scene: 'tavern' }, travel: { n: '行', scene: 'gate' } };
const TAB_ORDER = ['home', 'market', 'court', 'people', 'travel'];
const LOCN = { home: '狸宅', market: '市集', hostage: '质子府', lvfu: '吕府', tavern: '酒肆', pingyuan: '平原君府', palace: '赵王宫', gate: '城门', away: '出征在外', xianyang: '咸阳', daliang: '大梁' };
function cityRuler() { return CITY[W.city] ? CITY[W.city].ruler() : null; }
const LESSON = ['兵法', '理财', '辞令', '权术'];
function tabActions(tab) {
  const p = P(), yr = C('yiren'), A = [];
  const siege = W.flags.siege && !W.flags.siegeOver;
  if (tab === 'home') {
    const others = () => household().filter(c => c.id !== W.player);
    const pupils = () => kinPool().filter(c => c.id !== W.player && ageOf(c) >= 3 && ageOf(c) < 16);
    // (only kin in town: a daughter who married into another city's court is not yours to marry off again)
    const singles = () => adults(kinPool()).filter(c => !c.sp && inCity(c) && canWed(c));
    A.push(mkAct({ id: 'company', kind: 'company', n: '陪伴家人', ap: 1, hint: '好感↑ 心烦↓', no: () => others().length ? '' : '家里没有别人',
      fn: () => pickChar('陪谁？', others(), c => {
        if (!spendAp(1)) return; addOp(c, p, 8 + Math.floor(stat(p, 2) / 3)); addOp(p, c, 5, true); SFX.happy(); react(c, 'company', true);
        didAct('company', c, 2, true); }) }));
    A.push(mkAct({ id: 'teach', kind: 'teach', n: '教导孩子', ap: 1, hint: '传授你的本事', no: () => pupils().length ? '' : '没有 3~15 岁的孩子',
      fn: () => pickChar('教谁？ ◆1', pupils(), c => {
        pickOpt('教' + nm(c) + '？ ◆1', STATN.map((s, i) => ({ n: LESSON[i] + ' · 你的' + s + ' ' + stat(p, i) + (stat(p, i) >= 12 ? ' ×2' : ''), fn: () => {
          if (!spendAp(1)) return; c.edu = c.edu || [0, 0, 0, 0]; c.edu[i] += 1 + (stat(p, i) >= 12 ? 1 : 0); c.st[i] += chance(.5) ? 1 : 0; addOp(c, p, 5); react(c, 'teach', true, LESSON[i]);
          didAct('teach', c, i, true); } })));
      }) }));
    A.push(mkAct({ id: 'rest', kind: 'rest', n: '闭门休养', ap: 1, hint: '健康+15 · 心烦清零', fn: () => { if (!spendAp(1)) return; addHealth(p, 15); p.stress = 0; toast('健康 +15', '#c8e0ff'); didAct('rest', null, -1, true); } }));
    A.push(mkAct({ id: 'match', kind: 'match', n: '说媒', ap: 1, hint: '为自己或家人找亲事', no: () => singles().length ? '' : '没有未婚的成年家人',
      fn: () => pickChar('给谁说媒？ ◆1', singles(), f => {
        pickChar('给' + nm(f) + '挑人 ◆1', matchCands(f), c => { if (!spendAp(1)) return; propose(f, c, 'match'); }, chanceInfo(c => wedP(f, c))); }) }));
  }
  if (tab === 'market') {
    A.push(mkAct({ id: 'trade', kind: 'trade', n: '经商', ap: 1, hint: siege ? '赚小鱼干 · 围城减半' : '赚小鱼干（政）', fn: () => { if (!spendAp(1)) return;
      let g = 22 + stat(p, 1) * 3; g = R(g * rand(.75, 1.3) * (siege ? .55 : 1)); addFish(g); didAct('trade', null, 1, true); } }));
    A.push(mkAct({ id: 'venture', kind: 'venture', n: '贩奇货', ap: 1, fish: 60, hint: chkHint(3, 9) + ' · 成得150', no: () => W.fish < 60 ? '鱼干不够 60' : '',
      fn: () => { if (!spendAp(1)) return; addFish(-60, true); const ok = chk(3, 9); if (ok) { addFish(150); toast('奇货到手，转手大赚', '#ffe08a'); } else toast('货砸在手里了……', '#ff9a8a'); didAct('venture', null, 3, ok); } }));
  }
  if (tab === 'court') {
    const k = cityRuler();
    if (alive(k)) A.push(mkAct({ id: 'audience', n: '觐见' + nm(k), ap: 0, hint: '查看国君', fn: () => openSheet(k.id) }));
    // the better known the house, the more a gift to the throne has to be worth
    const tc = 80 * (1 + prestTier().i);
    A.push(mkAct({ id: 'tribute', kind: 'tribute', n: '进献', ap: 1, fish: tc, hint: '名望+12 · 国君好感+10',
      no: () => !alive(cityRuler()) ? '宫里没有国君' : W.prest < 20 ? '需名望 20' : W.fish < tc ? '鱼干不够 ' + tc : '',
      fn: () => { if (W.fish < tc || !spendAp(1)) return; const r = cityRuler(); addFish(-tc); addPrest(12); addOp(r, p, 10); didAct('tribute', r, 1, true); } }));
  }
  if (tab === 'travel') {
    // the 立嗣 envoys only matter until 华阳夫人 has adopted him
    if (W.act === 1 && !W.flags.act1Done && W.heir < 100) A.push(mkAct({ id: 'lobby', kind: 'lobby', n: '遣使咸阳', ap: 1, fish: RACE.fish,
      hint: W.flags.knowHuayang ? '立嗣+' + sendGain() + ' · 你' + W.credit.you + ' / 吕' + W.credit.lv : '还不知道该找谁',
      no: () => !W.flags.knowHuayang ? '还不知道该找谁' : opinion(yr, p) < 25 ? '异人好感需 25' : W.fish < RACE.fish ? '鱼干不够 ' + RACE.fish : '',
      fn: () => { if (!spendAp(1)) return; addFish(-RACE.fish); const d = sendGain(); W.heir += d; W.credit.you += d; if (W.flags.allied) W.credit.lv += d >> 1; toast('立嗣进度 +' + d, '#ffe08a');
        addOp(yr, p, 4); addOp(C('huayang'), p, 3, true); lvNotice(); if (W.heir >= 100 && !W.flags.zichu) W.queue.push({ ev: 'zichu' }); didAct('lobby', yr, 2, true); } }));
    A.push(mkAct({ id: 'caravan', kind: 'caravan', n: '跑远途商队', ap: 2, hint: siege ? '城门关了' : '大赚一笔（政） · 偶遇山贼', no: () => siege ? '围城中出不了城' : '',
      fn: () => { if (!spendAp(2)) return; const g = R((55 + stat(p, 1) * 5) * rand(.8, 1.3));
        // now and then bandits wait on the road (比剑); otherwise the goods come home
        if (caravanRoad(g)) return;
        addFish(g); didAct('caravan', null, 1, true); } }));
  }
  if (tab !== 'people') runSys('tab', tab, A);
  return A;
}
function peopleActions() {
  const A = [mkAct({ id: 'meet', kind: 'meet', n: '结交', ap: 1, fn: () => { if (!spendAp(1)) return; meetSomeone(); } }),
    mkAct({ id: 'ask', kind: 'ask', n: '打听', ap: 1, fn: () => { if (!spendAp(1)) return;
      if (!W.flags.knowHuayang && W.act === 1) { const ok = chk(3, 5); if (ok) { W.flags.knowHuayang = true; logLine('得知：华阳夫人无子', '#ffe08a'); logLine('解锁：行「遣使咸阳」', '#c8e0ff'); } else toast('没打听到什么', '#dddddd'); didAct('ask', null, 3, ok); return; }
      const ok = discoverSecret(); if (!ok) toast('没打听到什么', '#dddddd'); didAct('ask', null, 3, ok); } })];
  runSys('tab', 'people', A);
  return A;
}
// everyone in town except your own household, the ones that matter first
// (each cat's place in the list and opinion are worked out once, then sorted: a big clan makes this list long)
function townsfolk() {
  const p = P(), tag = c => { const r = c.rel[p.id], q = p.rel[c.id], t = (r && r.tag) || (q && q.tag); return t === 'friend' || t === 'rival' ? 1 : 0; };
  // (in 咸阳 the seated courtiers come before the town: act two's work is winning them)
  const seat = typeof courtSeats === 'function' && W.a2 && W.city === 'xianyang' && W.act >= 2 ? new Set(courtSeats().map(s => s.c)) : null;
  const rank = c => (['yiren', 'lv', 'zhaoji'].includes(c.id) ? 0 : ['ruler', 'noble', 'general', 'minister', 'hostage'].includes(c.role) ? 1 : c.role === 'shi' ? 2 : c.role === 'merchant' ? 3 : 4) - (relTo(c) ? 5 : 0) - tag(c) * 5 - (seat && seat.has(c) ? 3 : 0);
  return Object.values(W.chars).filter(c => inCity(c) && c.id !== W.player && c.loc !== 'home' && ageOf(c) >= 3).map(c => [c, rank(c), opinion(c, p)])
    .sort((a, b) => a[1] - b[1] || b[2] - a[2]).map(x => x[0]);
}
const GROUPN = { ruler: '国君', noble: '权贵', general: '将军', minister: '重臣', hostage: '质子', shi: '士', merchant: '商贾', commoner: '平民', dancer: '舞姬' };
function lvNotice() { const lv = C('lv'); if (!W.flags.allied && !W.flags.lvCareless && alive(lv) && chance(.35)) addOp(lv, P(), -2, true); }
// unmarried adults of the other sex around town (not your own clan); the matchmaker finds a few more if the town is thin
function matchCands(f) {
  const ok = c => alive(c) && c !== f && c.id !== W.player && ageOf(c) >= 16 && ageOf(c) <= 45 && !c.sp && c.female !== f.female && !closeKin(c, f) && inCity(c) &&
    (!c.hist || !!WOMEN_CAST[c.id]) && canWed(c) && c.house !== 'li' && c.house !== 'in' && !W.ret.includes(c.id);
  let list = Object.values(W.chars).filter(ok);
  for (let i = list.length; i < 4; i++) {
    const c = mkc({ sur: pick(SURS), name: pick(f.female ? GIV_M : GIV_F), female: !f.female, born: f.born + Math.floor(Math.random() * 24) - 12, loc: 'market', role: chance(.5) ? 'merchant' : 'commoner' });
    if (ageOf(c) < 16) c.born = W.t - 4 * 17;
    list.push(c);
  }
  // the six most likely to say yes to f (the picker shows their chances)
  const sorted = list.map(c => [c, proposeChance(f, c)]).sort((a, b) => b[1] - a[1]).map(x => x[0]);
  return [...new Set(sorted.slice(0, 6).concat(sorted.filter(c => WOMEN_CAST[c.id])))];
}
const RET_MAX = 6;
function hire(c) {
  if (W.ret.length >= RET_MAX) { toast('门客已满 ' + RET_MAX + ' 人', '#ff9a8a'); return false; }
  W.ret.push(c.id); c.loc = 'home'; c.house = c.house || 'ret'; addOp(c, P(), 10); logLine(nm(c) + '成了你的门客', '#9fe89a'); SFX.happy();
  // a new hand takes the empty 门下 seat that fits the skill they came with (会使剑 → 家丁头 …)
  if (typeof autoSeat === 'function') autoSeat(c);
  return true;
}
// learn a secret you didn't know; limit = only about these cats; dc = the 谋 check (noRoll when the caller already rolled)
function discoverSecret(limit, dc, noRoll) {
  const pool = W.secrets.filter(s => !s.exposed && !knows(s) && (!limit || limit.includes(s.subj) || limit.includes(s.other) || limit.includes(s.kid)));
  if (!pool.length) return false;
  const s = pick(pool);
  if (!noRoll && !chk(3, dc || 10)) return false;
  s.known.push(W.player); logLine('得知秘密：' + secretText(s), '#ffb0d0'); SFX.secret(); return true;
}
function meetSomeone() {
  const p = P();
  const pool = hereList('tavern').concat(hereList('market')).filter(c => !c.hist && Math.abs(rel(c, p).op) < 5);
  let c = pool.length && chance(.6) ? pick(pool) : null;
  if (!c) {
    const female = chance(.5);
    c = mkc({ sur: pick(SURS), name: pick(female ? GIV_F : GIV_M), female, born: W.t - 4 * (17 + Math.floor(Math.random() * 16)), loc: 'tavern', role: chance(.5) ? 'shi' : 'commoner', robe: null });
    if (c.role === 'shi') c.robe = 'shi';
  }
  addOp(c, p, 10 + Math.floor(stat(p, 2) / 2));
  didAct('meet', c, 2, true);
  openSheet(c.id);
}

// ============================================================ things you can do to / with one cat (character sheet)
// grp: '友' | '谋' | '家' collapse into group buttons on the sheet; danger: consequence text, asks once before doing it
function charActions(c) {
  const p = P(), A = [];
  if (!alive(c)) return A;
  // (your own card: only what the systems add for yourself, e.g. 取名)
  if (c.id === W.player) { runSys('acts', c, A); return A.filter(x => x.id === 'rename'); }
  const op = opinion(c, p), adult = ageOf(c) >= 16, isLov = p.lov.includes(c.id), isSp = p.sp === c.id;
  const breakup = mkAct({ id: 'breakup', kind: 'breakup', n: '断绝私情', ap: 0, grp: '家', danger: '好感-25', remote: true,
    fn: () => { endAffair(p, c); addOp(c, p, -25); toast('你与' + nm(c) + '断了往来', '#dddddd'); didAct('breakup', c, -1, true); } });
  if (!reach(c)) {
    // out of town: only what can be done by letter
    if (isLov) A.push(breakup);
    runSys('acts', c, A); return A;
  }
  // the hostage is starved for company, so visits count for more (and 吕不韦 notices)
  const hostage = c.id === 'yiren' && c.loc === 'hostage';
  const talkN = hostage ? 5 + Math.floor(stat(p, 2) / 2) : 3 + Math.floor(stat(p, 2) / 4);
  A.push(mkAct({ id: 'talk', kind: 'talk', n: hostage ? '拜访' : '交谈', ap: 1, hint: '好感+' + talkN + '（交）', fn: () => { if (!spendAp(1)) return;
    addOp(c, p, talkN); react(c, hostage ? 'visit' : 'talk', true); if (hostage) { W.flags.metYiren = true; lvNotice(); } else if (chance(.25)) discoverSecret([c.id]);
    didAct('talk', c, 2, true); } }));
  const giftN = (hostage ? 15 : 10) + (c.tr.includes('贪吃') ? 5 : 0);
  A.push(mkAct({ id: 'gift', kind: 'gift', n: '送礼', ap: 1, fish: 30, hint: '好感+' + giftN, no: () => W.fish < 30 ? '鱼干不够 30' : '',
    fn: () => { if (!spendAp(1)) return; addFish(-30); addOp(c, p, giftN); react(c, 'gift', true); if (hostage) { W.flags.metYiren = true; lvNotice(); } didAct('gift', c, 2, true); } }));
  if (['noble', 'ruler', 'general', 'minister'].includes(c.role) && !isKin(c, p)) {
    const pr = 3 + Math.floor(stat(p, 2) / 4), cd = 'pay_' + c.id;
    A.push(mkAct({ id: 'pay', kind: 'pay', n: '拜谒', ap: 1, grp: '友', hint: '名望+' + pr + ' · ' + ta(c) + '好感+4', no: () => W.cool[cd] ? '刚拜谒过，再等 ' + W.cool[cd] + ' 季' : '',
      fn: () => { if (!spendAp(1)) return; addPrest(pr); addOp(c, p, 4); W.cool[cd] = 4; react(c, 'pay', true); didAct('pay', c, 2, true); } }));
  }
  if (adult && !closeKin(c, p) && c.sp !== W.player) A.push(mkAct({ id: 'spy', kind: 'spy', n: '刺探', ap: 1, grp: '谋', hint: chkHint(3, 11) + ' · 失败' + ta(c) + '好感-10',
    fn: () => { if (!spendAp(1)) return;
      const ok = chk(3, 11);
      if (ok) { if (c.id === 'lv' && !W.flags.act1Done) toast('立嗣功劳：吕 ' + W.credit.lv + ' / 你 ' + W.credit.you, '#c8e0ff'); if (!discoverSecret([c.id], 0, true)) toast('没发现什么', '#dddddd'); }
      else { addOp(c, p, -10); react(c, 'spy', false); }
      didAct('spy', c, 3, ok); } }));
  if (adult && ageOf(p) >= 16 && !closeKin(c, p) && c.female !== p.female && !isSp && !isLov) {
    const need = 20, pr = clamp(.2 + (op - 20) / 80 + (c.tr.includes('多情') ? .2 : 0) + (p.tr.includes('多情') ? .1 : 0), .05, .9);
    A.push(mkAct({ id: 'court', kind: 'court', n: '示好', ap: 1, grp: '友', hint: '成' + R(pr * 100) + '%' + (p.sp || c.sp ? ' · ' + withTip('私情', '专一', '诚实') : ''), no: () => op < need ? '好感需 ' + need : '',
      fn: () => { if (!spendAp(1)) return; court(c, pr); } }));
  }
  if (adult && !c.sp && canWed(c) && c.house !== 'li') {
    const cands = adults(kinPool()).filter(f => !f.sp && f.female !== c.female && !closeKin(f, c) && canWed(f) && inCity(f));
    if (cands.length) A.push(mkAct({ id: 'propose', kind: 'propose', n: '提亲', ap: 1, grp: '友', hint: '为自己或家人',
      fn: () => pickChar('让谁娶/嫁' + nm(c) + '？', cands, f => { if (!spendAp(1)) return; propose(f, c); }, chanceInfo(f => wedP(f, c))) }));
  }
  if (adult && c.role === 'shi' && !c.hist && !W.ret.includes(c.id) && c.house !== 'li' && c.house !== 'in' && c.sp !== W.player)
    A.push(mkAct({ id: 'hire', kind: 'hire', n: '招为门客', ap: 1, grp: '友', hint: (op >= 0 ? '愿意' : chkHint(2, 9)) + ' · 每季 6 鱼干', no: () => W.ret.length >= RET_MAX ? '门客已满 ' + RET_MAX + ' 人' : '',
      fn: () => { if (!spendAp(1)) return; const ok = (op >= 0 || chk(2, 9)) && hire(c); react(c, 'hire', !!ok); didAct('hire', c, 2, !!ok); } }));
  const pair = adult && ageOf(p) >= 16 && c.female !== p.female;
  if (pair && (isSp || isLov)) A.push(mkAct({ id: isSp ? 'night' : 'tryst', kind: isSp ? 'night' : 'tryst', n: isSp ? '同宿' : '幽会', ap: 1, grp: '家',
    hint: ((c.female ? c : p).preg ? '好感↑ · 已有身孕' : '好感↑ 容易有孕') + (isSp ? '' : ' · 可能被撞破'), fn: () => { if (!spendAp(1)) return; night(c, isSp); } }));
  if (isLov) A.push(breakup);
  if (isSp) {
    // an unfaithful spouse can be put aside without losing face
    const just = W.secrets.some(s => s.type === 'affair' && (s.subj === c.id || s.other === c.id) && s.subj !== W.player && s.other !== W.player && knows(s));
    A.push(mkAct({ id: 'divorce', kind: 'divorce', n: '和离', ap: 1, grp: '家', hint: just ? ta(c) + '不忠在先 · 名望不减' : '名望-8', danger: just ? '好感-40' : '好感-40 · 名望-8',
      fn: () => { if (!spendAp(1)) return; divorce(p, c, just); didAct('divorce', c, -1, true); } }));
  }
  for (const s of secretsAbout(c)) if (knows(s) && s.subj !== W.player && s.other !== W.player) {
    A.push(mkAct({ id: 'expose', kind: 'expose', n: '揭发', ap: 1, grp: '谋', hint: secretText(s), danger: withTip('结仇 · 名望+6', '仁厚'), fn: () => { if (!spendAp(1)) return; expose(s); didAct('expose', c, 3, true); } }));
    const wait = s.bm != null ? 8 - (W.t - s.bm) : 0;
    A.push(mkAct({ id: 'blackmail', kind: 'blackmail', n: '勒索', ap: 1, grp: '谋', hint: withTip(chkHint(3, blackmailDC(s, c)) + ' · 败则结仇', '诚实', '仁厚'), no: () => wait > 0 ? '刚勒索过，再等 ' + wait + ' 季' : '',
      fn: () => { if (!spendAp(1)) return; blackmail(s, c); } }));
    break;
  }
  // a relative who walked out can be asked back once the anger has cooled
  // (married ones other than the heir set up their own house in town, like any cadet branch)
  if (c.flags.left && c.house === 'li' && !royalOut(c)) A.push(mkAct({ id: 'recall', kind: 'recall', n: '请回家', ap: 1, grp: '家', hint: '不再记仇', no: () => op < 20 ? '好感需 20' : '',
    fn: () => { if (!spendAp(1)) return;
      const out = !!c.sp && heirOf() !== c, sp = c.sp && C(c.sp);
      for (const x of [c, sp]) if (alive(x) && (x === c || x.flags.left)) { delete x.flags.left; x.loc = out ? 'market' : 'home'; if (out) x.flags.branch = true; else delete x.flags.branch; }
      if (c.rel[p.id] && c.rel[p.id].tag === 'rival') delete c.rel[p.id].tag;
      react(c, 'company', true); logLine(nm(c) + (out ? '与狸家和好了' : '搬回了狸宅'), '#9fe89a'); didAct('recall', c, 2, true); } }));
  if (W.ret.includes(c.id)) A.push(mkAct({ id: 'dismiss', kind: 'dismiss', n: '遣散', ap: 0, grp: '家', danger: '好感-15',
    fn: () => { W.ret = W.ret.filter(x => x !== c.id); c.loc = 'tavern'; if (c.house === 'ret') c.house = null; addOp(c, p, -15); didAct('dismiss', c, -1, true); } }));
  runSys('acts', c, A);
  return A;
}
// ---------------------------------------------------------- reactions: a line of dialogue and a little animation after you do something with a cat
const SAY = {
  talk: [['「有事？」', '「我还有事。」', '「嗯。」'], ['「难得你有空。」', '「今天市面上怎么样？」', '「坐吧。」'], ['「你来了。坐。」', '「上回的事，我想了想，你说得对。」', '「正想找你。」']],
  visit: [['「……你来了。」'], ['「你又来了。」', '「府里没什么可招待的，喝碗汤吧。」', '「秦国那边，还是没有信来。」'], ['「你来了，我就不闷了。」', '「今天说说咸阳的事吧。」', '「这世上肯来看我的，只有你。」']],
  gift: [['「……放那吧。」'], ['「这怎么好意思。」', '「多谢。」'], ['「你总是记着我。」', '「又让你破费了。」']],
  pay: [['「有话直说。」'], ['「坐吧。」', '「你就是狸家的那个？」'], ['「常来走动。」']],
  spy: [['「你在打听什么？」', '「这不是你该问的。」']],
  court: [['「你想多了。」', '「请回吧。」'], ['「……我也是。」', '「你总算说出来了。」']],
  propose: [['「这门亲事，我们高攀不起。」', '「再说吧。」'], ['「好。」', '「就这么定了。」']],
  hire: [['「我另有打算。」'], ['「愿为家主效力。」']],
  company: [['「你还记得回来。」'], ['「今天不忙？」', '「陪我坐一会儿。」'], ['「你好久没陪我了。」', '「今天天好，出去走走吧。」']],
  teach: [['「这个好难。」'], ['「记住了。」', '「再讲一遍嘛。」']],
  night: [['「我累了。」'], ['「今天回来得早。」', '「灯留着吧。」'], ['「你总算想起我了。」', '「别走了。」']],
  tryst: [['「这里不方便。」'], ['「小心，别让人看见。」', '「你怎么才来。」'], ['「我等了你一整天。」', '「下回还在这儿。」']],
};
function sayLine(c, kind, ok) {
  if (kind === 'gift' && c.tr.includes('贪吃')) return '「这鱼干晒得正好。」';
  if (c.tr.includes('高冷') && kind === 'talk') return '「嗯。」';
  const pools = SAY[kind] || SAY.talk;
  if (kind === 'court' || kind === 'propose' || kind === 'hire') return pick(pools[ok ? 1 : 0]);
  if (!ok) return pick(pools[0]);
  const o = opinion(c, P()) + (c.tr.includes('粘人') ? 15 : 0), tier = Math.min(pools.length - 1, o >= 40 ? 2 : o >= 5 ? 1 : 0);
  return pick(pools[tier]);
}
function react(c, kind, ok, note) {
  if (!c || !W || state !== 'game') return;
  const fx = !ok || kind === 'spy' ? 'q' : kind === 'gift' ? 'fish' : kind === 'teach' ? 'star' : 'heart';
  MODAL.push({ type: 'talk', c: c.id, line: sayLine(c, kind, ok), note: note ? '学了' + note : '', ok, fx, t0: T });
  if (!ok) SFX.no();
}
function night(c, wed) {
  const p = P(), mom = c.female ? c : p, dad = c.female ? p : c;
  addOp(c, p, wed ? 6 : 8);
  if (!mom.preg && ageOf(mom) >= 16 && ageOf(mom) <= 41 && chance(.3 * (ageOf(mom) > 34 ? .5 : 1))) setPreg(mom, dad.id);   // (born by 43 at the latest)
  react(c, wed ? 'night' : 'tryst', true);
  if (!wed) {
    // someone's spouse may notice
    for (const x of [p, c]) {
      const sp = x.sp && C(x.sp);
      if (sp && alive(sp) && sp !== p && sp !== c && sameCity(sp, x) && chance(.15 + (sp.tr.includes('多疑') ? .15 : 0))) {
        const sc = W.secrets.find(q => q.type === 'affair' && (q.subj === x.id || q.other === x.id) && !q.exposed);
        if (sc && !sc.known.includes(sp.id)) sc.known.push(sp.id);
        addOp(sp, p, -30);
        toast(nm(sp) + '撞见了', '#ff9a8a');
        if (sp.id !== W.player && sp.tr.includes('记仇')) rel(sp, p).tag = 'rival';
      }
    }
  }
  didAct(wed ? 'night' : 'tryst', c, -1, true);
}
function court(c, pr) {
  const p = P();
  if (!chance(pr)) { addOp(c, p, -6); react(c, 'court', false); didAct('court', c, 2, false); return; }
  p.lov.push(c.id); c.lov.push(p.id); SFX.happy(); react(c, 'court', true);
  if (p.sp || c.sp) { addSecret('affair', p.sp ? p.id : c.id, p.sp ? c.id : p.id); addStress(p, '专一'); addStress(p, '诚实'); logLine('你与' + nm(c) + '成了情人（秘密）', '#ffb0d0'); }
  else logLine('你与' + nm(c) + '成了情人', '#ffb0d0');
  didAct('court', c, 2, true);
}
function propose(f, c, kind) {
  // one guard for every road to a wedding
  if (!f || !c || f.sp || c.sp || f.female === c.female || !canWed(c) || !canWed(f) || closeKin(f, c)) { toast('这门亲事成不了', '#dddddd'); return; }
  const wed = () => { marry(f, c); logLine(nm(f) + '与' + nm(c) + '成亲了', '#ffe08a'); SFX.happy(); addOp(c, P(), 10); react(c, 'propose', true); };
  const ok = chance(proposeChance(f, c));
  if (ok) wed();
  // a refusal can be argued once more (舌战); winning that is a yes
  else { addOp(c, P(), -3); if (!proposeRetry(f, c, wed, kind)) react(c, 'propose', false); }
  didAct(kind || 'propose', c, 2, ok);
}
function endAffair(a, b) { a.lov = a.lov.filter(x => x !== b.id); b.lov = b.lov.filter(x => x !== a.id); }
function divorce(a, b, just) {
  if (!a || !b || a.sp !== b.id) return;           // never clear a link that points somewhere else
  a.sp = null; if (b.sp === a.id) b.sp = null;
  addOp(b, a, -40);
  const mine = a.id === W.player || b.id === W.player;
  if (!just && mine) addPrest(-8);
  // whoever married in goes back to their own people
  for (const x of [a, b]) if (x.house === 'in') { x.house = null; delete x.flags.branch; delete x.flags.left; if (x.loc === 'home') x.loc = 'market'; }
  logLine(mine ? '你与' + nm(a.id === W.player ? b : a) + '和离了' : nm(a) + '与' + nm(b) + '和离了', '#dddddd');
  kinOnDivorce(a, b);
}
function expose(s) {
  const a = C(s.subj), b = C(s.other); s.exposed = true; SFX.secret();
  const spouse = a.sp && C(a.sp);
  if (spouse) { addOp(spouse, a, -60, true); if (spouse.id !== W.player && chance(.5)) divorce(spouse, a, true); }
  addOp(a, P(), -40); rel(a, P()).tag = 'rival';
  if (b) addOp(b, P(), -25);
  if (s.kid && C(s.kid)) C(s.kid).flags.bastard = true;
  addPrest(6); addStress(P(), '仁厚');
  toast('秘密传开了：' + secretText(s), '#ffb0d0');
}
// each repeat is harder; a failed attempt makes an enemy, and they may tell the town first
const blackmailDC = (s, c) => 7 + Math.floor(stat(c, 3) / 2) + 2 * (s.bmN || 0);
function blackmail(s, c) {
  const p = P(), dc = blackmailDC(s, c);
  s.bm = W.t; s.bmN = (s.bmN || 0) + 1;
  const ok = chk(3, dc);
  if (ok) {
    addFish(c.hist ? 100 : 40 + stat(c, 1) * 3); addOp(c, p, -25); addStress(p, '诚实'); addStress(p, '仁厚');
    if (c.tr.includes('记仇')) rel(c, p).tag = 'rival';
  } else {
    addPrest(-5); addOp(c, p, -40); rel(c, p).tag = 'rival';
    if (chance(.4)) { s.exposed = true; toast(nm(c) + '抢先把事情说了出去', '#ff9a8a'); } else toast(nm(c) + '不吃这一套', '#ff9a8a');
  }
  didAct('blackmail', c, 3, ok);
}
