// ---------------------------------------------------------- family and random events
// taking a secret child into the house: fix every link so the tree, the household and the siblings agree
function claimKid(k) {
  const p = P(), od = C(k.dad);
  if (od && od.id !== W.player) od.kids = od.kids.filter(x => x !== k.id);
  k.dad = W.player; k.house = 'li'; k.sur = '狸'; k.loc = 'home'; delete k.flags.branch;
  if (!p.kids.includes(k.id)) p.kids.push(k.id);
  W.secrets = W.secrets.filter(q => q.kid !== k.id);        // no longer a secret: the child is openly yours
  PORT.clear(); MINI.clear();
}
EV.born = e => {
  const ks = e.ids.map(C).filter(Boolean); if (!ks.length) return null;
  const mom = C(ks[0].mom);
  if (ks[0].id === 'zheng') return EV.zhengborn();
  const k0 = ks[0], p = P();
  const litter = ks.length > 1 ? `一胎${ks.length}个孩子` : k0.female ? '一个女儿' : '一个儿子';
  const names = ks.map(k => nm(k) + '（' + catLook(k).coat + '）').join('、');
  if (mom && mom.id === W.player) {
    const bio = k0.bio !== k0.dad && C(k0.bio), hus = bio && C(k0.dad);
    return { title: '降生', who: ks.map(k => k.id).slice(0, 3).concat([mom.id]).slice(0, 4),
      text: `你生下了${litter}：${names}。` + (bio ? `孩子的生父是${nm(bio)}。` + (hus && alive(hus) ? `${nm(hus)}抱着孩子，没有起疑。` : '') : ''),
      opts: [opt('「好孩子。」', '', () => {})] };
  }
  if (k0.bio === W.player && k0.dad !== W.player) {
    const hus = C(k0.dad);
    return { title: '降生', who: ks.map(k => k.id).slice(0, 2).concat([mom.id]),
      text: `${nm(mom)}生下了${litter}：${names}。${hus && alive(hus) ? nm(hus) + '在门外等了一夜，' : ''}你算了算日子。`,
      opts: [opt('托人送去一笔钱', '鱼干-50 · ' + nm(mom) + '好感+15', () => { addFish(-50); addOp(mom, p, 15); }, () => W.fish >= 50),
        opt('当作不知道', '', () => {}),
        opt('「这是我的骨肉。」', '名望-10 · 孩子改姓狸 · 秘密公开', () => { addPrest(-10); for (const k of ks) claimKid(k); if (hus && alive(hus)) { addOp(hus, p, -50); rel(hus, p).tag = 'rival'; } })] };
  }
  // (if your spouse's child isn't yours you won't know yet — the fur may tell at one year old)
  return { title: '降生', who: ks.map(k => k.id).slice(0, 3).concat([mom.id]).slice(0, 4),
    text: `${who(mom)}生下了${litter}：${names}。`,
    opts: [opt(ks.some(k => k.dad === W.player) ? '「好孩子。」' : '好', '', () => {})] };
};
EV.pregnant = e => {
  const m = C(e.a); if (!alive(m) || !m.preg) return null;
  const p = P(), f = C(m.preg.f), mine = m.preg.f === W.player;
  if (m.id === W.player) return { title: '有孕', who: [m.id].concat(f ? [f.id] : []),
    text: `你有了身孕，约莫三季后临盆。${f && m.sp !== f.id ? '孩子的父亲是' + nm(f) + '。这件事，只有你们两个知道。' : ''}`,
    opts: [opt('好好养着', '', () => {}), opt('少出门走动', '心烦-10', () => addStress(p, -10, '静养'))] };
  if (m.sp === W.player) return { title: '有孕', who: [m.id],
    text: mine ? `${who(m)}告诉你，${ta(m)}有了身孕。` : `${who(m)}告诉你，${ta(m)}有了身孕。你算了算日子，这阵子你并不常在家。`,
    opts: [opt('「好。」', ta(m) + '好感+10', () => addOp(m, p, 10)), opt('推掉外面的事，多陪陪' + ta(m), ta(m) + '好感+20 · 下季精力-1', () => { addOp(m, p, 20); W.flags.skipAp = true; })] };
  if (mine) return { title: '有孕', who: [m.id],
    text: m.sp ? `${nm(m)}托人带话：${ta(m)}有了身孕。${nm(C(m.sp))}以为是自己的。你算了算日子。` : `${nm(m)}告诉你，${ta(m)}有了你的孩子。`,
    opts: m.sp ? [opt('什么也不说', '', () => {}), opt('托人送些补品', '鱼干-30 · ' + ta(m) + '好感+10', () => { addFish(-30); addOp(m, p, 10); }, () => W.fish >= 30)]
      : [opt('「我们成亲吧。」', '成亲', () => { if (!p.sp && !m.sp && canWed(m)) { marry(p, m); logLine('你与' + nm(m) + '成亲了', '#ffe08a'); } }, () => !p.sp && !m.sp && canWed(m)),
        opt('「孩子我会认。」', '', () => {}), opt('装作没听见', ta(m) + '好感-30', () => addOp(m, p, -30))] };
  return { title: '有孕', who: [m.id], text: `${who(m)}有了身孕。`, opts: [opt('好', '', () => {})] };
};
EV.death = e => {
  const c = C(e.a); if (!c) return null;
  const name = e.rel !== undefined ? (e.rel ? '你的' + e.rel : '') + nm(c) : who(c), p = P(), fr = !!p && isFriend(c, p);
  // a friend: you go to the funeral yourself
  const O = [opt('安息吧', '', () => {})];
  if (fr) O.unshift(opt('亲自去吊唁', '名望+3 · 心烦↓', () => { addPrest(3); relieve(p, 10, '吊唁'); }));
  // (c.flags.cause: how they died, when it wasn't age or illness, e.g. a knife in the night)
  return { title: '讣告', who: [c.id], text: `${name}${c.flags.cause || '去世了'}，享年${ageOf(c)}岁。` + (fr ? '你们是多年的挚友。' : ''), opts: O };
};
EV.coming = e => {
  const c = C(e.a); if (!alive(c)) return null;
  const edu = c.tr.find(t => EDU.includes(t)), rite = c.female ? '笄礼' : '冠礼';
  return { title: rite, who: [c.id], text: `${c.id === W.player ? '你' : who(c)}今年十六，行了${rite}。\n所学：${edu}（${'★'.repeat(c.eduLv || 1)}）\n性情：${c.tr.filter(t => !EDU.includes(t)).join('、')}`, opts: [opt('好', '', () => {})] };
};
EV.furclue = e => {
  const k = C(e.a); if (!alive(k)) return null;
  const mom = C(k.mom), dad = C(k.dad), bio = C(k.bio), p = P(); if (!mom) return null;
  const s = W.secrets.find(x => x.kid === k.id);
  const why = CLUE_TXT[e.why] || '毛色和爹娘都对不上';
  const learn = () => { if (s && !knows(s)) { s.known.push(W.player); logLine('得知秘密：' + secretText(s), '#ffb0d0'); SFX.secret(); } };
  if (dad && dad.id === W.player) {   // you are the one being fooled
    const wed = alive(mom) && p.sp === mom.id;
    const O = [opt('「这孩子是谁的？」', '得知秘密' + (wed ? ' · 夫妻失和' : ''), () => { learn(); if (wed) { addOp(mom, p, -20); addOp(p, mom, -40, true); } }),
      opt('「是我的孩子。」', '名望+3 · 孩子好感+10', () => { if (wed) addOp(mom, p, 20); addOp(k, p, 10); addPrest(3); })];
    if (wed) O.push(opt('「我早该想到。」', '得知秘密 · 与' + ta(mom) + '和离', () => { learn(); divorce(p, mom, true); }, null, '记仇'));
    O.push(opt('什么也不说', stressTip('多疑'), () => { addStress(p, '多疑'); }));
    return { title: '毛色', who: [k.id, mom.id],
      text: `${who(k)}满一岁，换了毛。${why}。` + (wed ? `你看向${who(mom)}，${ta(mom)}避开了你的目光。` : `你想起了${alive(mom) ? '' : '已故的'}${nm(mom)}。`),
      opts: O };
  }
  if (mom.id === W.player) {          // your own secret is showing, and your husband is looking
    if (!alive(dad)) return null;
    const O = [opt('「随了我娘家的人。」', chkHint(3, 10), () => { if (!chk(3, 10)) { if (s && !s.known.includes(dad.id)) s.known.push(dad.id); addOp(dad, p, -40); toast(nm(dad) + '不信', '#ff9a8a'); if (dad.tr.includes('记仇')) rel(dad, p).tag = 'rival'; } })];
    if (alive(bio) && bio.id !== W.player) O.push(opt('托人给' + nm(bio) + '送一笔钱，让' + ta(bio) + '闭嘴', '鱼干-60 · 守住秘密', () => { addFish(-60); if (s) s.known = s.known.filter(x => x === W.player || x === bio.id); }, () => W.fish >= 60));
    O.push(opt('「孩子不是你的。」', '秘密公开 · ' + nm(dad) + '好感-50 · 名望-10', () => { if (s) s.exposed = true; addOp(dad, p, -50); addPrest(-10); if (chance(.5)) divorce(p, dad, true); }));
    return { title: '毛色', who: [k.id, dad.id], text: `${who(k)}满一岁，换了毛。${why}。${nm(dad)}抱着孩子看了很久。`, opts: O };
  }
  if (bio && bio.id === W.player) {   // your secret child is showing
    return { title: '毛色', who: [k.id, mom.id],
      text: `${nm(mom)}家的孩子${nm(k)}满一岁了。${why}。坊间开始有人拿眼睛打量你。`,
      opts: [opt('给' + ta(mom) + '家一笔钱，让他们搬走', '鱼干-60', () => { addFish(-60); if (s) s.known = s.known.filter(x => x === W.player || x === mom.id); }, () => W.fish >= 60),
        opt('「是我的骨肉。」', '名望-10 · 孩子改姓狸', () => { addPrest(-10); const od = alive(dad) && dad.id !== W.player ? dad : null; claimKid(k); if (od) { addOp(od, p, -50); rel(od, p).tag = 'rival'; } }),
        opt('「与我何干？」', chkHint(3, 10), () => { if (!chk(3, 10) && s) { s.exposed = true; addPrest(-8); if (dad) addOp(dad, p, -40); } })] };
  }
  return { title: '毛色', who: [k.id, mom.id].concat(dad ? [dad.id] : []),
    text: `${nm(mom)}家的${nm(k)}满一岁了。${why}。街坊们嘴上不说，心里都有数。`,
    opts: [opt('记下这件事', s && !knows(s) ? '得知秘密' : '', learn)] };
};
EV.leave = e => {
  const c = C(e.a); if (!alive(c) || c.loc !== 'home' || c.flags.left || ageOf(c) < 16) return null;
  return { title: '出走', who: [c.id], text: `${who(c)}收拾了行李，说这个家已经没有${ta(c)}的位置。${c.tr.includes('野心') ? '有人看见' + ta(c) + '往吕府去了。' : ''}`,
    opts: [opt('「留下来。」', duelHint('舌战', c), () => startDuel('舌战', c, win => {
        if (win) { c.disc = Math.max(0, c.disc - 30); addOp(c, P(), 15); c.flags.stay = W.t + 16; } else if (alive(c) && c.loc === 'home' && !c.flags.left) leaveHome(c); },
      { why: '胜：' + ta(c) + '留下 · 好感+15 · 败：' + ta(c) + '离家' })),
      opt('「随你。」', '', () => leaveHome(c))] };
};
// a relative who walks out stays in the tree (and can still inherit if nobody else is left), but no longer lives or eats at home
function leaveHome(c) {
  c.loc = c.tr.includes('野心') && alive(C('lv')) && cityOf(C('lv')) === W.city ? 'lvfu' : 'tavern'; c.flags.left = true;
  rel(c, P()).tag = 'rival'; c.disc = 0; delete c.flags.passed;
  const sp = c.sp && C(c.sp); if (alive(sp) && sp.house === 'in' && sp.loc === 'home') { sp.loc = c.loc; sp.flags.left = true; }
  logLine(nm(c) + '离开了狸宅', '#ff9a8a'); addStress(P(), 15, '家人出走');
  homeTick();
}
// 心烦 at 100: the way you let it out sticks as a coping trait (心烦 fades faster from then on, at a price; see growth)
EV.breakdown = () => {
  const p = P(); if (!alive(p) || (p.stress || 0) < 100) return null;
  const cope = (t, f) => () => { f(); p.stress = 30; gainTrait(p, t, COPE[t]); };
  // each way out sticks as a trait: the hint says what it costs now, and what it costs from then on
  const h = (now, t) => now + ' · 得「' + t + '」：' + COPE[t];
  return { title: '心烦', who: [p.id], text: '你已经好几夜没合眼了。家里的人都绕着你走。\n怎么熬过去，就会成了习惯。从此心烦消得快些。',
    opts: [opt('一遍一遍地舔毛', h('健康-10', '舔毛成癖'), cope('舔毛成癖', () => addHealth(p, -10))),
      opt('吃，一直吃', h('鱼干-40', '暴食'), cope('暴食', () => addFish(-40))),
      opt('半夜出门，走远一点', h('下季精力-1', '夜游'), cope('夜游', () => { W.flags.skipAp = true; })),
      opt('砸东西', h('家人好感-5', '拆家'), cope('拆家', () => { for (const c of household()) addOp(c, p, -5); }))] };
};
// a 流言 scheme has run its course (e.a = whose, e.tg = about whom; old saves queue it bare: 吕不韦 about you).
// 鲁仲连's 说情 (social's useShield) stops it before it spreads.
EV.rumor = e => {
  const o = C((e && e.a) || 'lv'), t = (e && e.tg && C(e.tg)) || P(); if (!o || !t) return null;
  if (typeof useShield === 'function' && useShield()) { logLine(nm(o) + '放出的流言没传开', '#c8e0ff', true); return null; }
  // talk about you gets under your skin
  if (t.id === W.player) addStress(t, 10, '流言');
  if (o.id === 'lv' && t.id === W.player && !W.flags.act1Done) return { title: '流言', who: ['lv'],
    text: '城里在传狸家的鱼干掺了沙子。话是从吕府下人的嘴里出来的，质子府那边也听说了。',
    opts: [opt('拿钱堵住这些嘴', '鱼干-40', () => addFish(-40), () => W.fish >= 40),
      opt('让人也说说吕家', chkHint(3, 13), () => { if (chk(3, 13)) { addOp(C('yiren'), C('lv'), -8, true); toast('吕家的名声也坏了', '#c8e0ff'); } else { addPrest(-6); addOp(C('yiren'), P(), -5); } }, null, '狡诈'),
      opt('当面去问吕不韦', '吕不韦好感-10 · 流言平息', () => { addOp(C('lv'), P(), -10); }, null, '勇猛'),
      opt('「随他们说。」', '名望-5 · 异人好感-6', () => { addPrest(-5); addOp(C('yiren'), P(), -6); })] };
  const you = t.id === W.player;
  // what the town says depends on what there is to say
  const sp = you && t.sp && C(t.sp), h = you && typeof heirNow === 'function' ? heirNow() : null;
  const say = ['城里在传狸家的鱼干掺了沙子。', '城里在传狸家的秤不准，短斤少两。'];
  if (W.soc && W.soc.owe) say.push('城里在传狸家借了钱不还。');
  if (W.rank >= 2) say.push('城里在传你的' + RANKS[W.rank] + '是花钱买来的。');
  if (alive(sp)) say.push('城里在传你的' + relTo(sp) + '跟人不清不楚。');
  if (alive(h) && ageOf(h) >= 12) say.push('城里在传' + nm(h) + '不成器，狸家早晚败在' + ta(h) + '手里。');
  return { title: '流言', who: you ? [o.id] : [o.id, t.id],
    text: (you ? pick(say) : `城里在传${who(t)}的闲话，说得很难听。`) + `话头是从${nm(o)}那边起的。`,
    opts: [opt('拿钱堵住这些嘴', '鱼干-40', () => addFish(-40), () => W.fish >= 40),
      opt('让人也说说' + nm(o), chkHint(3, 13) + ' · 败则名望-6', () => { if (chk(3, 13)) { addOp(o, P(), -5, true); toast(nm(o) + '的名声也坏了', '#c8e0ff'); } else addPrest(-6); }, null, '狡诈'),
      opt('当面去问' + nm(o), ta(o) + '好感-10 · 流言平息', () => addOp(o, P(), -10), null, '勇猛'),
      opt('「随他们说。」', '名望-10', () => addPrest(-10))] };
};
// the spouse, only if they live in the same city as you
const spHere = () => { const s = P().sp && C(P().sp); return inCity(s) ? s : null; };
// an affair of your spouse's (with someone other than you) that you haven't found out about
const spAffair = () => { const s = spHere(); return s && W.secrets.find(x => x.type === 'affair' && !x.exposed && (x.subj === s.id || x.other === s.id) && x.subj !== W.player && x.other !== W.player && !knows(x) && alive(C(x.subj)) && alive(C(x.other))); };
const kidsAtHome = () => household().filter(c => ageOf(c) >= 3 && ageOf(c) < 16);
const guoKin = () => { const p = P(); return adults(kinPool()).filter(c => !c.sp && c.id !== W.player && c.id !== p.mom && c.id !== p.dad && ageOf(c) <= 40 && canWed(c) && inCity(c)); };
const RANDOM = [
  { id: 'mold', w: 3, cd: 40, ok: () => W.fish >= 80, b: () => ({ title: '霉', who: [], text: '连下了七天雨，库房里的鱼干生了霉。',
    opts: [opt('便宜卖掉', '鱼干-30', () => addFish(-30)), opt('挑出来晒一晒', chkHint(1, 8) + ' · 败则鱼干-60', () => { if (!chk(1, 8)) addFish(-60); else toast('大半救回来了', '#9fe89a'); })] }) },
  { id: 'guozong', w: 2, cd: 24, ok: () => W.city === 'handan' && alive(C('guozong')), b: () => {
    // the first time is news; after that he just keeps undercutting you
    const n = W.flags.guoN = (W.flags.guoN || 0) + 1;
    return { title: '同行', who: ['guozong'], text: n === 1 ? '郭纵靠冶铁发的家，近来也做起了鱼干买卖，价钱比你低三成。' : pick(['郭纵又压了价，市上的主顾都往他那边跑。', '郭纵的伙计在你铺子门口吆喝，说他家的鱼干多给一成。']),
      opts: [opt('跟着降价', '鱼干-40', () => addFish(-40)), opt('登门拜访', chkHint(2, 10), () => { if (chk(2, 10)) addOp(C('guozong'), P(), 20); else addOp(C('guozong'), P(), -10); }),
        opt('派人往他的仓里放老鼠', chkHint(3, 10), () => { if (chk(3, 10)) { addFish(40); addOp(C('guozong'), P(), -20, true); } else addPrest(-10); }, null, '狡诈')] }; } },
  { id: 'thief', w: 2, cd: 40, b: () => duelThief() },
  { id: 'guest', w: 2, ok: () => W.ret.length < RET_MAX, b: () => {
    const female = chance(.4), c = mkc({ sur: pick(SURS), name: pick(female ? GIV_F : GIV_M), female, born: W.t - 4 * (20 + Math.floor(Math.random() * 14)), loc: 'tavern', role: 'shi', robe: 'shi' });
    const best = c.st.indexOf(Math.max(...c.st)); c.st[best] += 4;
    const skill = ['会使剑', '会算账', '能说会道', '消息灵通'][best];
    return { title: '门客', who: [c.id], text: `一个叫${nm(c)}的${catLook(c).coat}在你家门口等了三天。${ta(c)}说自己${skill}，想在你门下做事，一天两顿饭就够。`,
      opts: [opt('「留下吧。」', '每季 6 鱼干 · 已有门客 ' + W.ret.length + ' 人', () => hire(c)), opt('打发' + ta(c) + '走', '', () => {})] }; } },
  { id: 'kidsfight', w: 3, ok: () => kidsAtHome().length >= 2, b: () => {
    const ks = kidsAtHome(), a = pick(ks), b = pick(ks.filter(x => x !== a));
    return { title: '争执', who: [a.id, b.id], text: `${who(a)}和${who(b)}为了一条鱼打了起来，都说是自己先看见的。`,
      opts: [opt('向着' + nm(a), '', () => { addOp(a, P(), 10); addOp(b, P(), -10); }), opt('向着' + nm(b), '', () => { addOp(b, P(), 10); addOp(a, P(), -10); }), opt('两个都罚', '', () => { addOp(a, P(), -2); addOp(b, P(), -2); })] }; } },
  { id: 'lonely', w: 3, ok: () => { const s = spHere(); return s && opinion(s, P()) < 15; }, b: () => {
    const s = spHere();
    return { title: '冷落', who: [s.id], text: `${who(s)}这些天没怎么跟你说话。`,
      opts: [opt('陪' + ta(s) + '一个下午', '好感+15', () => addOp(s, P(), 15)), opt('送' + ta(s) + '一串珠子', '鱼干-30 · 好感+20', () => { addFish(-30); addOp(s, P(), 20); }, () => W.fish >= 30), opt('由' + ta(s) + '去', '好感-10', () => addOp(s, P(), -10))] }; } },
  { id: 'crush', w: 3, ok: () => crushCands().length > 0, b: () => {
    const c = crushCand(), p = P(); if (!c) return null;
    const free = !p.sp && !c.sp;
    const O = [opt('回应' + ta(c), free ? '成为情人' : withTip('私情 · 秘密', '专一'), () => { p.lov.push(c.id); c.lov.push(p.id); if (!free) { addSecret('affair', p.sp ? p.id : c.id, p.sp ? c.id : p.id); addStress(p, '专一'); } SFX.happy(); })];
    if (free && ageOf(p) >= 16 && !c.hist) O.push(opt('上门提亲', R(wedP(p, c) * 100) + '% 答应', () => propose(p, c)));
    O.push(opt('装作不懂', '好感-10', () => addOp(c, p, -10)));
    return { title: '来客', who: [c.id], text: `${who(c)}最近常来你家，来了也说不出有什么事。`, opts: O }; } },
  { id: 'suspect', w: 4, ok: () => !!spHere() && P().lov.some(id => alive(C(id))), b: () => {
    const p = P(), s = spHere(), lov = p.lov.map(C).find(alive);
    // the affair you are hiding (made on the spot if it started before the wedding)
    let aff = W.secrets.find(x => x.type === 'affair' && (x.subj === W.player || x.other === W.player) && !x.exposed);
    const hers = W.secrets.find(x => x.type === 'affair' && (x.subj === s.id || x.other === s.id) && x.subj !== W.player && x.other !== W.player && !x.exposed && knows(x));
    const O = [opt('「你闻错了。」', chkHint(3, 9) + ' · 败则' + ta(s) + '好感-40', () => { if (!chk(3, 9)) { aff = aff || (lov && addSecret('affair', W.player, lov.id)); if (aff && !aff.known.includes(s.id)) aff.known.push(s.id); addOp(s, p, -40); toast(nm(s) + '知道了', '#ff9a8a'); } else addOp(s, p, -5); }),
      opt('「是我对不起你。」', '好感-25 · 断绝私情', () => { addOp(s, p, -25); for (const id of p.lov.slice()) endAffair(p, C(id)); })];
    if (hers) { const o = C(hers.subj === s.id ? hers.other : hers.subj); O.push(opt('「你和' + nm(o) + '，又是怎么回事？」', '互相握着把柄', () => { addOp(s, p, -10); toast(nm(s) + '不说话了', '#c8e0ff'); })); }
    return { title: '味道', who: [s.id], text: `${who(s)}在你的衣服上闻到了别人的味道。`, opts: O }; } },
  { id: 'cousin', w: 3, ok: () => !!spAffair(), b: () => {
    const s = spHere(), sc = spAffair(); if (!s || !sc) return null;
    const l = C(sc.subj === s.id ? sc.other : sc.subj);
    const see = () => { if (!knows(sc)) { sc.known.push(W.player); logLine('得知秘密：' + secretText(sc), '#ffb0d0'); SFX.secret(); } };
    return { title: l.female ? '表妹' : '表哥', who: [s.id], text: `${who(s)}这阵子常说去市集，回来时身上没有鱼腥味，倒沾着别家的毛。`,
      opts: [opt('跟去看看', chkHint(3, 9), () => { if (chk(3, 9)) see(); else toast('跟丢了', '#dddddd'); }), opt('算了', '', () => {}), opt('派人盯着' + ta(s), '得知秘密', see, null, '多疑')] }; } },
  { id: 'catnip', w: 2, cd: 40, b: () => ({ title: '薄荷草', who: [], text: '西边来的商队带了一种叫薄荷草的东西，说家里人闻了会高兴。',
    opts: [opt('买一捆回家', '鱼干-30 · 家人好感+6 · 心烦-30', () => { addFish(-30); useBohe(); }, () => W.fish >= 30), opt('不买', '', () => {})] }) },
  // (not while his own errand for the same thing is on offer or running: one hungry season, one card)
  { id: 'yirenpoor', w: 3, ok: () => W.city === 'handan' && alive(C('yiren')) && C('yiren').loc === 'hostage' && W.flags.metYiren && !W.flags.zichu && !W.flags.escapeLead &&
    !(W.job && W.job.id === 'duanchui') && !W.queue.some(q => q.ev === 'joboffer' && q.id === 'duanchui'), b: () => ({ title: '断粮', who: ['yiren'], text: '异人派人来说，秦国的月钱又没到，府里已经三天没见荤腥了。',
    opts: [opt('送去一篓鱼干', '鱼干-50 · 好感+15', () => { addFish(-50); addOp(C('yiren'), P(), 15); }, () => W.fish >= 50), opt('「我手头也紧。」', '好感-5', () => addOp(C('yiren'), P(), -5))] }) },
  { id: 'yirenhome', w: 2, ok: () => W.city === 'handan' && alive(C('yiren')) && C('yiren').loc === 'hostage' && W.flags.metYiren && !W.flags.escapeLead, b: () => {
    const O = [opt('陪他喝酒', chkHint(2, 8) + ' · 好感+12', () => { if (chk(2, 8)) addOp(C('yiren'), P(), 12); else addOp(C('yiren'), P(), 3); })];
    if (W.flags.knowHuayang && W.heir < 100) O.push(opt('「华阳夫人是楚人。公子不妨学几句楚语。」', '立嗣+6', () => { W.heir += 6; W.credit.you += 6; addOp(C('yiren'), P(), 4); if (W.heir >= 100 && !W.flags.zichu) W.queue.push({ ev: 'zichu' }); }));
    O.push(opt('换个话题', '', () => {}));
    return { title: '母亲', who: ['yiren', 'xiaji'], text: '异人说起他的母亲夏姬。夏姬在太子宫里不得宠，他来邯郸这么多年，她只托人带过一次话。', opts: O }; } },
  { id: 'lvprobe', w: 2, ok: () => W.city === 'handan' && alive(C('lv')) && C('lv').loc === 'lvfu' && W.t > 3 && !W.flags.escapeLead && !W.flags.act1Done, b: () => ({ title: '一叙', who: ['lv'], text: '吕不韦请你过府一叙。菜很好，他一直给你夹菜，自己没怎么动筷子。',
    opts: [opt('有什么说什么', '吕不韦好感+10', () => addOp(C('lv'), P(), 10)), opt('只谈风月', chkHint(3, 11) + ' · 让他放下戒心', () => { if (chk(3, 11)) { W.flags.lvCareless = true; toast('吕不韦不再留意你', '#c8e0ff'); } }),
      opt('「家里还有事。」', '好感-5', () => addOp(C('lv'), P(), -5))] }) },
  { id: 'pyfeast', w: 2, ok: () => W.city === 'handan' && alive(C('pingyuan')), b: () => ({ title: '平原君的宴', who: ['pingyuan'], text: '平原君大宴宾客。在邯郸，能坐进平原君家的堂上，就算有了名声。',
    opts: [opt('带着礼去', '鱼干-30 · 名望+8 · 平原君好感+10', () => { addFish(-30); addPrest(8); addOp(C('pingyuan'), P(), 10); }, () => W.fish >= 30), opt('不去', '', () => {})] }) },
  { id: 'lame', w: 2, once: true, ok: () => W.city === 'handan' && W.t >= 8 && alive(C('pingyuan')), b: () => ({ title: '一笑', who: ['pingyuan'], text: '平原君的宠姬在楼上看见邻家的跛子打水，笑出了声。此后一年，门客走了一半。平原君问你：「为一笑就要我处置她，不过分吗？」',
    opts: [opt('「宁失一人，不失天下士。」', '名望+5 · 平原君好感+5', () => { addPrest(5); addOp(C('pingyuan'), P(), 5); }), opt('「此事不值得。」', '平原君好感+5', () => addOp(C('pingyuan'), P(), 5))] }) },
  { id: 'guoprop', w: 2, ok: () => W.city === 'handan' && alive(C('guozong')) && guoKin().length > 0, b: () => {
    const gz = C('guozong'), kin = guoKin().sort((a, b) => b.born - a.born)[0];
    const cand = mkc({ sur: '郭', name: pick(kin.female ? GIV_M : GIV_F), female: !kin.female, born: kin.born + Math.floor(Math.random() * 16) - 8, loc: 'market', role: 'merchant', robe: 'merchant', dad: 'guozong' });
    if (ageOf(cand) < 16) cand.born = W.t - 4 * 16 - Math.floor(Math.random() * 8);
    // 郭纵's own child only if the ages work and they aren't related; otherwise someone of his clan
    const son = cand.born >= gz.born + 4 * 18 && !closeKin(kin, cand);
    if (son) gz.kids.push(cand.id); else cand.dad = cand.bio = null;
    return { title: '说亲', who: ['guozong', cand.id, kin.id], text: `郭纵托人来说亲，想让${son ? '他家的' : '郭家的'}${nm(cand)}和${who(kin)}结为夫妻，陪一车鱼干。`,
      opts: [opt('「好。」', '鱼干+100 · 郭纵好感+20', () => { marry(kin, cand); logLine(nm(kin) + '与' + nm(cand) + '成亲了', '#ffe08a'); addFish(100); addOp(gz, P(), 20); }, () => !kin.sp && !cand.sp && alive(kin)),
        opt('「高攀不起。」', '郭纵好感-5', () => { addOp(gz, P(), -5); gz.kids = gz.kids.filter(x => x !== cand.id); delete W.chars[cand.id]; })] }; } },
];
// someone (not of your own clan or household) who has been coming round a lot
function crushCands() {
  const p = P(); if (ageOf(p) < 16) return [];
  return Object.values(W.chars).filter(c => alive(c) && c.id !== p.id && ageOf(c) >= 16 && c.female !== p.female && !closeKin(c, p) && c.sp !== p.id && !p.lov.includes(c.id) &&
    inCity(c) && c.loc !== 'home' && c.house !== 'li' && c.house !== 'in' && !W.ret.includes(c.id) && c.role !== 'ruler' && canWed(c) && opinion(c, p) >= 35);
}
function crushCand() { const l = crushCands(); return l.length ? pick(l) : null; }
// historical calendar (turn -> event)
const HIST = [[1, 'shangdang'], [2, 'lvfeast'], [3, 'huayang'], [4, 'lianpo'], [8, 'zhaokuo'], [9, 'meiji'], [10, 'changping'], [14, 'siege'], [16, 'maosui'], [17, 'dimian'], [20, 'qiefu'], [21, 'escape']];
// seasons before a random event can come back (flavour ones carry a longer `cd`)
const RAND_COOL = 16;
function scheduleEvents() {
  if (W.act === 1) for (const [t, id] of HIST) if (t === W.t) W.queue.push({ ev: id });
  runSys('sched');
  if (W.act === 1 && W.t >= 22 && !W.flags.act1Done && !W.queue.some(q => q.ev === 'act1end')) W.queue.push({ ev: 'act1end' });
  if (W.flags.siege && W.t === 21) W.flags.siegeOver = true;
  const yr = C('yiren');
  if (!W.cool.sheren && W.rank === 0 && alive(yr) && yr.loc === 'hostage' && !W.flags.escapeLead && opinion(yr, P()) >= 35) W.queue.push({ ev: 'sheren' });
  if (!W.flags.waiting && chance(.55)) {
    const held = new Set(W.queue.concat(W.later || []).filter(q => q.ev === 'rand').map(q => q.id));
    const pool = RANDOM.filter(r => (!r.ok || r.ok()) && !(r.once && W.done[r.id]) && !W.cool['r_' + r.id] && !held.has(r.id));
    let tot = pool.reduce((s, r) => s + r.w, 0), x = Math.random() * tot;
    for (const r of pool) { x -= r.w; if (x <= 0) { W.queue.push({ ev: 'rand', id: r.id }); W.cool['r_' + r.id] = r.cd || RAND_COOL; break; } }
  }
}
EV.rand = e => { const r = RANDOM.find(x => x.id === e.id); if (!r || (r.ok && !r.ok())) return null; W.done[r.id] = 1; W.cool['r_' + r.id] = r.cd || RAND_COOL; return r.b(); };
// The order of a season's cards: a new head first, then the story, then the rest, and the 季报 last. Cards nobody needs
// to see this very season (an errand offer, a friend's request or friendship, a random happening) wait a season when a
// story card or two other cards are already there, and at most one of them comes a season.
const STORY_EV = new Set(HIST.map(h => h[1]).concat(['hide', 'act1end', 'zichu']));
const LATER_EV = new Set(['joboffer', 'fask', 'zhiji', 'rand']);
function orderQueue() {
  const Q = W.queue, succ = Q.filter(q => q.ev === 'succession'), story = Q.filter(q => STORY_EV.has(q.ev)), last = Q.filter(q => q.ev === 'jibao');
  const rest = Q.filter(q => q.ev !== 'succession' && !STORY_EV.has(q.ev) && q.ev !== 'jibao'), hard = rest.filter(q => !LATER_EV.has(q.ev)).length;
  const keep = [], later = [];
  for (const q of rest) {
    if (!LATER_EV.has(q.ev)) keep.push(q);
    else if (story.length || hard >= 2 || keep.some(k => LATER_EV.has(k.ev))) later.push(q);
    else keep.push(q);
  }
  W.queue = succ.concat(story, keep, last);
  // (one of each kind waits at most: a newer one replaces it)
  for (const q of later) W.later = (W.later || []).filter(x => x.ev !== q.ev).concat([q]);
}

// ---------------------------------------------------------- succession
// The heir (heirNow: the head's pick or the law's) comes first, in gold, then up to 3 more by custom (succCands);
// '其他人…' opens the whole clan. The new head is set up in takeOver (growth's 家法: prestige, regency, grief).
EV.succession = () => {
  const old = P(); if (!old) return null;
  let cands = succCands(old).map(x => x[0]);
  if (!cands.length) {
    const g = randGenome(Math.random, 'M');
    const c = mkc({ sur: '狸', name: pick(GIV_M), born: W.t - 4 * 20, house: 'li', loc: 'home', role: 'merchant', g });
    cands = [c];
    logLine('狸家没有后人了。族里从乡下请来一个远房侄子。', '#f2ead4');
  }
  const h = heirNow(old);
  let show = (h ? [h] : []).concat(cands.filter(c => c !== h)).slice(0, 4);
  // if the list is all children while a grown relative exists, offer the best grown one too
  if (show.every(c => ageOf(c) < 16)) { const ad = cands.find(c => ageOf(c) >= 16); if (ad && !show.includes(ad)) show = show.slice(0, 3).concat([ad]); }
  const rest = cands.filter(c => !show.includes(c));
  const O = show.map(c => Object.assign(opt(nm(c) + '（' + ageOf(c) + '岁 ' + (c.female ? '女' : '男') + '）',
    (c === h ? '嗣 · ' : '') + traitsOf(c).slice(0, c === h ? 2 : 3).join(' ') + ' · ' + STATN.map((s, i) => s + stat(c, i)).join(' ') + (kinSuccessionHint(c) ? ' · ' + kinSuccessionHint(c) : ''), () => takeOver(old, c, h)), { look: c === h ? 'gold' : null }));
  // the picker holds the queue; backing out of it brings this card back (the card is queued again first)
  if (rest.length) O.push(opt('其他人…', '还有 ' + rest.length + ' 人', () => {
    W.queue.unshift({ ev: 'succession' });
    pickChar('谁来当家？', cands, c => { W.queue = W.queue.filter(q => q.ev !== 'succession'); takeOver(old, c, h); }, succInfo(old, h));
    const m = top(); if (m && m.type === 'pick') m.hold = true;
  }));
  const why = !h ? '' : W.law === '择贤' && W.heirId === h.id ? `${ta(old)}生前立了${nm(h)}为嗣。` : `按规矩，该是${nm(h)}。`;
  return { title: '家主', who: [old.id], big: true, text: `${nm(old)}${old.flags.cause || '去世了'}，享年${ageOf(old)}岁。狸家要有新的家主。` + why, opts: O };
};
