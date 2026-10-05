// ---- act2 content
// History's smaller moments between the calendar's big cards (杜邮 … 茅焦), the 邯郸 line (围城之后 … 平原君), what the
// court sets off by itself (太后召见, 刺客) and a 咸阳 pool (联姻, 政问 …), the news, more court errands and the people it
// all needs (CHAR2). What happens whether or not you are there (成峤 is born, 李斯 and 甘罗 find their places, 嫪毐's
// children, 茅焦) happens in the season hook; the cards only let you take part.
//   W.a2.ct (a2c()) { lisi: where 李斯 went 'you'|'lv'|'wang' · laoBy: who brought 嫪毐 in 'you'|'lv' · wait: you keep the
//     太后 waiting (忌惮+2 a season) · cut: 嫪毐 really was cut (no children, few men) · yongT · watch: you watch 雍宫 ·
//     laughed · mj: 茅焦 has been · guardZ / soldZ: 政 in 邯郸 guarded / handed over · cx: 长信侯 · fuAsk: 傅 offered · zg: 郑国 has come }
//   W.flags.canal (郑国渠: the turn it was begun) · W.flags.danFriend · W.flags.handanFoes (for act three)
const a2c = () => W.a2.ct || (W.a2.ct = {});
const zN = z => z.role === 'ruler' ? '王上' : nm(z);
const kingOp = n => { const k = king(); if (alive(k) && k.id !== W.player) addOp(k, P(), n); };
const wangAdd = n => { W.a2.wang = clamp(W.a2.wang + n, 0, 100); };
const yiAdd = n => { W.a2.yi = clamp(W.a2.yi + n, 0, 100); };
function learnSec(s) { if (!s || knows(s)) return; s.known.push(W.player); logLine('得知秘密：' + secretText(s), '#ffb0d0'); SFX.secret(); }
const affairOf = (a, b) => W.secrets.find(s => s.type === 'affair' && !s.exposed && [s.subj, s.other].includes(a.id) && [s.subj, s.other].includes(b.id)) || null;
const eunuchSec = () => W.secrets.find(s => s.type === 'eunuch' && s.subj === 'laoai' && !s.exposed) || null;
// a trait that pushes its opposite out (a lesson or a hard year changes a boy)
function giveTr(c, t) { if (!alive(c) || c.tr.includes(t)) return; const o = TR[t] && TR[t].op; c.tr = c.tr.filter(x => x !== o); c.tr.push(t); }
// a leader and the seats that lean to them think better (or worse) of you
function sideOp(k, n) { const L = LEAD[k].cat(), p = P(); if (L && L !== p) addOp(L, p, n); for (const s of courtSeats()) if (s.lean === k && s.c !== L) addOp(s.c, p, R(n / 2), true); CS.k = ''; }
// n seats come over to leader k for six years (those leaning to `from` first, then the neutral ones; only: from `from` alone)
function swingTo(k, n, from, only) {
  const L = LEAD[k].cat(); if (!L) return;
  const pri = s => s.lean === from ? 0 : !s.lean ? 1 : 2, S = courtSeats().filter(s => s.lean !== k && s.c !== L && (!only || s.lean === from)).sort((a, b) => pri(a) - pri(b));
  for (const s of S.slice(0, n)) addMemo(s.c, L, '倒向', 25, 24);
  CS.k = '';
}
// one seat leaning to k cools on its leader for four years
function cutSeat(k, L) { const S = courtSeats().filter(s => s.lean === k && s.c !== L); if (S.length) { const s = pick(S); addMemo(s.c, L, '生分', -20, 16); logLine(nm(s.c) + '和' + nm(L) + '生分了', '#c8e0ff'); } CS.k = ''; }
const generalTo = n => { for (const s of courtSeats().filter(s => s.bing && s.lean !== 'you').slice(0, n)) addMemo(s.c, P(), '同袍', 25, 24); CS.k = ''; };
const giveHookF = (id, k, why) => { if (typeof giveHook === 'function') giveHook(id, k, why); };
// (a plot can say what it is about: 子傒想在太子身后夺嗣)
{ const st2 = secretText; secretText = s => s.what && s.type === 'plot' ? nm(C(s.subj)) + s.what : st2(s); }

// ---------------------------------------------------------- people (st = [武, 政, 交, 谋])
// (韩夫人 is kept safe until 成峤 is born, then lives like anyone: see the season hook)
Object.assign(HISTD, { baiqi: 24, chengjiao: 94, lisi: 216, dan: 144, hanfuren: 120 });
for (const id of ['baiqi', 'chengjiao', 'laoai']) HIST_GONE.add(id);
Object.assign(CHAR2, {
  baiqi: { t: 22, o: { disp: '白起', sur: '白', name: '起', born: bornAt(332), role: 'general', robe: 'general', state: '秦', loc: 'camp', tr: ['勇猛', '高冷', '记仇', '兵家'], st: [20, 6, 4, 15], g: { O: ['o'], A: ['a', 'a'], S: ['S', 'S'], body: [[1, 1], [1, 0]] } } },
  // (all recessive black like 子楚: their son will be 子楚's image, next to 政's coat)
  hanfuren: { t: 24, o: { disp: '韩夫人', sur: '韩', name: '姬', female: true, born: bornAt(276), role: 'noble', robe: 'han', state: '韩', loc: 'hougong', tr: ['粘人', '嫉妒'], st: [2, 6, 9, 7], g: { O: ['o', 'o'], A: ['a', 'a'], S: ['s', 's'], B: ['B', 'B'], D: ['D', 'D'], I: ['i', 'i'] } } },
  dan: { t: 26, o: { disp: '太子丹', sur: '姬', name: '丹', born: bornAt(260), role: 'hostage', robe: 'yan', state: '燕', loc: 'hostage', tr: ['记仇', '勇猛', '粘人'], st: [6, 8, 10, 9], g: { W: ['W', 'w'] } } },
  zhengguo: { t: 64, o: { disp: '郑国', sur: '郑', name: '国', born: bornAt(295), role: 'shi', robe: 'han', state: '韩', loc: 'xtavern', tr: ['勤快', '诚实', '节制'], st: [4, 14, 6, 8], g: { D: ['d', 'd'], A: ['A', 'a'] } } },
  lisi: { t: 65, o: { disp: '李斯', sur: '李', name: '斯', born: bornAt(284), role: 'shi', robe: 'chu', state: '楚', loc: 'xtavern', tr: ['野心', '嫉妒', '勤快', '法家'], st: [3, 15, 15, 15], g: { A: ['A', 'a'], T: ['Tm', 'tb'], S: ['s', 's'], O: ['o'] } } },
  ganluo: { t: null, o: { disp: '甘罗', sur: '甘', name: '罗', born: bornAt(253), role: 'shi', robe: 'shi', state: '秦', loc: 'xtavern', tr: ['野心', '粘人'], st: [1, 6, 12, 10], g: { wit: [[1, 1], [1, 1]] } } },
  maojiao: { t: null, o: { disp: '茅焦', sur: '茅', name: '焦', born: bornAt(280), role: 'shi', robe: 'qi', state: '齐', loc: 'xtavern', tr: ['诚实', '勇猛', '节制'], st: [3, 8, 15, 9], g: { S: ['S', 'S'], A: ['a', 'a'], O: ['o'] } } },
});
// 李斯, 甘罗 and 茅焦 take their seats when the story places them (a retainer of yours is no courtier)
for (const id of ['lisi', 'ganluo', 'maojiao']) { const i = COURT.findIndex(r => r.id === id); if (i >= 0) COURT.splice(i, 1); }
const MY_XY = ['lisi', 'zhengguo', 'ganluo', 'maojiao'];
HIST_NEXT.baiqi = () => logLine('白起死在杜邮。', '#c8e0ff');
HIST_NEXT.chengjiao = () => { if (W.t <= 96) logLine('长安君成峤在屯留反了，兵败身死。', '#c8e0ff'); };
// 嫪毐's day comes with nobody from the house there to see it: the revolt fails as it did
HIST_NEXT.laoai = c => {
  const A = W.a2; if (!A || !A.laoIn) return;
  A.laoIn = false; A.laoMen = 0;
  // (the night he won the capping there was no revolt left to fail: he dies an old man, his children keep their places)
  if (A.coup === 'lao') return;
  for (const k of c.kids.map(C)) if (alive(k) && ageOf(k) < 16) { k.dieT = null; k.immortal = false; die(k, true); }
  const q = qmNpc(); if (q && cityOf(q) === 'xianyang') q.loc = 'yong';
  logLine('嫪毐在雍城作乱，兵败伏诛。太后迁往雍城。', '#c8e0ff');
};
function lisiTo(k) {
  const ls = C('lisi'); if (!alive(ls)) return; a2c().lisi = k;
  ls.loc = k === 'lv' ? 'xlvfu' : 'xpalace'; ls.role = 'minister'; ls.robe = 'qin'; addCourtier('lisi', 1, { [k]: 25 });
}
function glSeat(k) { const g = C('ganluo'); if (!alive(g)) return; g.loc = 'xpalace'; g.role = 'minister'; addCourtier('ganluo', 1, { [k]: 25 }); }
function mjSeat() { const m = C('maojiao'); if (!alive(m)) return; m.loc = 'xpalace'; m.role = 'minister'; addCourtier('maojiao', 1, { wang: 15 }); }
const qmHome = () => { const q = qmNpc(); if (q && q.loc === 'yong') { q.loc = 'hougong'; logLine('太后回了咸阳。', '#c8e0ff', true); } };
// 成峤, 子楚's son by the 韩 woman (前256), black as his father (a save from later gets him as he would have been)
function cjBirth() {
  const hf = C('hanfuren'), yr = C('yiren'); if (!alive(hf) || !yr || hf.preg) return;
  if (W.t < 27) { if (alive(yr)) setPreg(hf, yr.id, { id: 'chengjiao', name: '峤', disp: '成峤', sex: 'M' }); return; }
  mkc({ id: 'chengjiao', name: '峤', disp: '成峤', sur: '嬴', born: 27, mom: hf.id, dad: yr.id, bio: yr.id, female: false, g: breed(hf.g, yr.g, Math.random, 'M'), loc: 'hougong',
    role: 'noble', robe: 'qin', state: '秦', hist: true, immortal: true, dieT: HISTD.chengjiao, tr: randPers(Math.random, 2) });
  linkKids();
}
function cjDies() { const cj = C('chengjiao'); if (!alive(cj)) return; cj.dieT = null; cj.immortal = false; outOfCourt(cj.id); die(cj, true); }
function cjSaved() { const cj = C('chengjiao'); if (!alive(cj)) return; cj.dieT = null; cj.immortal = false; outOfCourt(cj.id); cj.loc = 'shu'; logLine('成峤回咸阳请了罪，迁往蜀地', '#c8e0ff'); }
// 嫪毐 comes to court (by: who brought him; know: you know what he is)
function laoEnter(q, by, know) {
  const lao = spawn2('laoai', 'hougong'); if (!lao) return null;
  if (q && !q.sp && !closeKin(q, lao)) qmLover(q, lao);
  const s = eunuchSec() || addSecret('eunuch', lao.id, null); if (know) learnSec(s);
  W.a2.laoIn = true; W.a2.laoMen = Math.max(1, W.a2.laoMen); a2c().laoBy = by; CS.k = '';
  return lao;
}
// the widowed 太后 at night: a grown man of the first rank (you as 相邦 or 仲父), else 吕不韦
const qmFree = q => !!q && q.female && !q.sp && q.house !== 'li' && ageOf(q) < 60;
const youFor = q => { const p = P(); return !p.female && ageOf(p) >= 16 && !closeKin(q, p) && (W.rank >= 3 || W.a2.xiang === 'you' || W.a2.zhongfu === 'you'); };
const lvFor = q => { const lv = LEAD.lv.cat(); return lv && !lv.female && !closeKin(q, lv) ? lv : null; };
function qmLover(q, c) {
  if (!q.lov.includes(c.id)) { q.lov.push(c.id); c.lov.push(q.id); }
  if (!affairOf(q, c)) addSecret('affair', c.sp ? c.id : q.id, c.sp ? q.id : c.id);
  W.a2.lonely = 0;
}

// ---------------------------------------------------------- the calendar
// (邯郸: 围城之后 for anyone still there with them; 燕太子 and 石头 only for the one who looks after them)
const hdC = () => !!W.flags.act1Done && W.city === 'handan' && W.act < 3, hdZ = () => hdC() && zhengInHandan();
const hdGuard = () => hdZ() && !a2c().soldZ && (W.a2.line === 'hd' || !!a2c().guardZ);
for (const [t, id, c] of [[23, 'duyou'], [24, 'hanfu'], [28, 'yifan'], [36, 'jiaotian'], [40, 'shicang'], [48, 'liangmu'], [49, 'fuwei'], [55, 'fuwei'], [53, 'dongzhou'], [56, 'mengliang'],
  [60, 'hewai'], [62, 'jiuqing'], [64, 'zhengguo'], [65, 'cangshu'], [68, 'jiaowang'], [72, 'xianlao'], [73, 'bamao'], [76, 'shiliu'], [84, 'hezong'], [85, 'yonggong'],
  [86, 'shangqing'], [88, 'dongwang'], [90, 'huixing'], [92, 'changxin'], [93, 'tunliu'], [94, 'yizi'], [95, 'jiafu'], [98, 'maojiao'],
  [22, 'shoucheng', hdZ], [26, 'yandan', hdGuard], [30, 'shitou', hdGuard], [36, 'zhaoke', hdC], [45, 'pyzu', hdC]]) a2Sched(t, id, c || null);
A2_NEWS.push([25, '西周亡了，九鼎运进了咸阳。'], [29, '范雎让出相印，燕人蔡泽做了秦相。'], [30, '蔡泽做了几个月相邦就辞了，号纲成君。'], [32, '韩王到咸阳朝秦。'],
  [45, '廉颇在鄗城大破燕军。'], [53, '东周亡了，洛阳成了三川郡。', () => !dzCard()], [66, '晋阳反了，蒙骜去平定。'], [68, '廉颇在赵国不得志，投奔了魏国。', () => !hdHere() || !alive(C('lianpo'))], [72, '蒙骜取了韩国十二座城。'],
  [80, '蒙骜取了魏国二十座城，设东郡。'], [89, '王翦入朝。'], [98, '楚考烈王死了。春申君死在棘门。']);

// ---------------------------------------------------------- 咸阳 cards
EV.duyou = () => {
  const bq = C('baiqi'), fj = qinCat('fanju'), p = P(); if (!a2Here() || !alive(bq)) return null;
  return { title: '杜邮', who: [bq.id].concat(fj ? [fj.id] : []),
    text: '白起称病，不肯再去打邯郸。秦王把他贬为士卒，赶出了咸阳。应侯的门客来问你：邯郸城里还剩多少粮？你刚从那里出来。',
    opts: [opt('「城坚粮足。白将军没说错。」', '范雎-15 · 名望+5', () => { if (fj) addOp(fj, p, -15); addPrest(5); }),
      opt('「撑不了多久了。」', '范雎+10 · 秦王+5', () => { if (fj) addOp(fj, p, 10); kingOp(5); }),
      opt('「我只知道鱼价。」', '', () => {})],
    post: () => { const b = C('baiqi'); if (alive(b)) { b.dieT = null; b.immortal = false; die(b, true); } } };
};
EV.hanfu = () => {
  const yr = C('yiren'), xj = C('xiaji'), hy = C('huayang'), hf = C('hanfuren'), q = qmNpc(), p = P(); if (!a2Here() || !alive(yr) || !alive(hf)) return null;
  const ours = q && q.house === 'li' && cityOf(q) === 'handan';
  return { title: '韩女', who: [yr.id, hf.id].concat(alive(xj) ? [xj.id] : []),
    text: `夏夫人替${nm(yr)}挑了一个韩国宗室的女子做侍妾。华阳夫人那边没说什么，只是这个月没请${nm(yr)}吃饭。`,
    opts: [opt('「恭喜公子。」', nm(xj) + '+10 · 韩夫人+10', () => { addOp(xj, p, 10); addOp(hf, p, 10); }),
      opt('「华阳夫人会怎么想？」', '华阳+10 · ' + nm(xj) + '-10', () => { addOp(hy, p, 10); addOp(xj, p, -10); }),
      ours ? opt('「' + (relTo(q) ? '我家的' + relTo(q) : '夫人') + '还在邯郸。」', nm(yr) + '-5 · ' + nm(q) + '+20', () => { addOp(yr, p, -5); addOp(q, p, 20); }) : null].filter(Boolean) };
};
// 成峤's birth: a card in 咸阳, a line in the log elsewhere
{ const b0 = EV.born; EV.born = e => {
  const k = e && e.ids && C(e.ids[0]); if (!k || k.id !== 'chengjiao') return b0(e);
  const yr = C('yiren'), xj = C('xiaji'), hf = C(k.mom), p = P();
  if (!a2Here()) { logLine('子楚的韩夫人生了个儿子，取名成峤。', '#c8e0ff', true); return null; }
  return { title: '成峤', who: [k.id].concat(hf ? [hf.id] : []).concat(alive(xj) ? [xj.id] : []),
    text: '韩夫人生了个儿子，取名成峤。夏夫人抱着他不撒手，说这孩子黑得跟他爹一个样。',
    opts: [opt('「备一份贺礼。」', '鱼干-30 · ' + (alive(xj) ? nm(xj) : '夏姬') + '+8 · ' + (alive(yr) ? nm(yr) : '子楚') + '+5', () => { addFish(-30); addOp(xj, p, 8); addOp(yr, p, 5); }, () => W.fish >= 30),
      opt('「又一位公子。」', '', () => {})] };
}; }
EV.yifan = () => {
  const fj = qinCat('fanju'), zw = king(), p = P(); if (!a2Here() || !fj) return null;
  const cz = spawn2('caize', 'xtavern');
  return { title: '一饭之德', who: [fj.id].concat(cz ? [cz.id] : []),
    text: '应侯当年举荐的王稽私通诸侯，被处死了。按秦法，举荐的人同罪。秦王还没开口，应侯已经三天没上朝。一个燕国来的说客叫蔡泽，天天在应侯府外转。',
    opts: [opt('「我去替应侯说几句。」', chkHint(2, 11) + ' · 成：范雎+25 · 败：' + nm(zw) + '-5', () => { if (chk(2, 11)) { addOp(fj, p, 25); addOp(C('huayang'), p, 5); } else kingOp(-5); }),
      cz ? opt('「燕人蔡泽，可以一见。」', '蔡泽+20', () => addOp(cz, p, 20)) : null,
      opt('「这件事我记下了。」', '握住范雎的把柄', () => giveHookF(fj.id, 'weak', '王稽案'))].filter(Boolean) };
};
EV.jiaotian = () => {
  const zw = king(), yr = C('yiren'), p = P(); if (!a2Here() || !alive(zw) || zw === p) return null;
  return { title: '雍郊', who: [zw.id].concat(alive(yr) ? [yr.id] : []),
    text: nm(zw) + '要去雍城郊祭上帝。随驾的名单上还空着几个位子。',
    opts: [opt('「请随驾。」', chkHint(2, 10) + ' · 成：' + nm(zw) + '+10 名望+6', () => { if (chk(2, 10)) { addOp(zw, p, 10); addPrest(6); } else addPrest(-2); }),
      alive(yr) ? opt('「我留在咸阳陪公子。」', nm(yr) + '+8', () => addOp(yr, p, 8)) : null,
      opt('给随驾的大臣送些路上的吃食', '鱼干-40 · 两位中立的朝臣+6', () => { addFish(-40); for (const s of courtSeats().filter(s => !s.lean).slice(0, 2)) addOp(s.c, p, 6); }, () => W.fish >= 40)].filter(Boolean) };
};
EV.shicang = () => {
  const zx = qinCat('zixi'), yr = C('yiren'), p = P(); if (!a2Here() || !zx || !alive(yr)) return null;
  const sc = spawnHist({ id: 'shicang', disp: '士仓', sur: '士', name: '仓', born: bornAt(298), role: 'shi', robe: 'shi', state: '秦', loc: 'xtavern', tr: ['狡诈', '多疑'], st: [4, 10, 12, 13] });
  return { title: '士仓', who: [sc.id, zx.id],
    text: `子傒的谋士士仓请你喝酒。他说太子百年以后，${nm(yr)}在秦国没有根，子傒有。「押错了，现在改还来得及。」`,
    opts: [opt('「公子傒有什么打算？」', chkHint(3, 11) + ' · 成：得知他们的打算', () => {
        if (!chk(3, 11)) { toast('士仓只是笑，不接话', '#dddddd'); return; }
        let s = W.secrets.find(x => x.type === 'plot' && x.subj === zx.id && !x.exposed); if (!s) { s = addSecret('plot', zx.id, sc.id); s.what = '想在太子身后夺嗣'; } learnSec(s); }),
      opt('「这些话，我会告诉' + nm(yr) + '。」', nm(yr) + '+10 · 子傒-30 · 结仇', () => { addOp(yr, p, 10); addOp(zx, p, -30); rivalOf(zx, p); }),
      opt('「酒不错。」', '鱼干+60 · 子傒+10 · 或被' + nm(yr) + '知道', () => { addFish(60); addOp(zx, p, 10); if (chance(.25)) { addOp(yr, p, -15); toast(nm(yr) + '听说了这顿酒', '#ff9a8a'); } })] };
};
EV.liangmu = () => {
  const yr = C('yiren'), hy = C('huayang'), xj = C('xiaji'), p = P(); if (!a2Here() || !alive(yr) || !alive(hy) || !alive(xj)) return null;
  return { title: '两个母亲', who: [yr.id, hy.id, xj.id],
    text: `太子每天早上要去请安。华阳王后是嫡母，夏夫人是生母，两座宫一东一西。${nm(yr)}问你先去哪边。`,
    opts: [opt('「先去华阳宫。」', '华阳+10 · ' + nm(xj) + '-10', () => { addOp(hy, p, 10); addOp(xj, p, -10); }),
      opt('「先去看生母。」', nm(xj) + '+15 · 华阳-10', () => { addOp(xj, p, 15); addOp(hy, p, -10); }),
      opt('「请两位都到太子宫来。」', chkHint(2, 12) + ' · 成：两边+5 · 败：两边-5', () => { const d = chk(2, 12) ? 5 : -5; addOp(hy, p, d); addOp(xj, p, d); })] };
};
// the boy's teacher (傅): from then on you may teach him (see teachKing). Asked once, in 前250 or (a 客卿 by then) 前249.
EV.fuwei = () => {
  const yr = C('yiren'), z = C('zheng'), p = P(), A = W.a2, X = a2c();
  if (!a2Here() || A.fu || X.fuAsk || !alive(yr) || !alive(z) || cityOf(z) !== 'xianyang' || W.rank < 2 || opinion(yr, p) < 30 || ageOf(z) >= 16) return null;
  X.fuAsk = 1;
  return { title: '傅', who: [yr.id, z.id],
    text: `${yr.role === 'ruler' ? '王上' : '太子'}要给${nm(z)}请一位傅，教他读书。宫里报上去三个名字，你是其中一个。`,
    opts: [opt('「臣愿意。」', '做' + nm(z) + '的傅 · 可以教导他 · ' + nm(z) + '+10', () => { A.fu = true; addOp(z, p, 10); logLine('你做了' + nm(z) + '的傅', '#ffe08a'); }),
      opt('「臣当不起。」', nm(yr) + '+3', () => addOp(yr, p, 3))] };
};
// (the 东周 card tells the fall of 洛阳 when it comes; the news does otherwise)
const dzCard = () => a2Here() && !!qinCat('menga') && W.rank >= 1;
EV.dongzhou = () => {
  const A = W.a2, mg = qinCat('menga'), lv = LEAD.lv.cat(), p = P(), zw = king(); if (!dzCard()) return null;
  const you = A.xiang === 'you', st = stat(p, 0) >= stat(p, 3) ? 0 : 3, fell = () => logLine('东周亡了，洛阳成了三川郡。', '#c8e0ff');
  const O = you ? [opt('「我去。」', chkHint(st, 11) + ' · 成：名望+15 鱼干+100', () => {
        if (chk(st, 11)) { addPrest(15); addOp(mg, p, 10); addFish(100); addMerit(8, '东周'); fell(); } else { addPrest(-5); logLine('洛阳没打下来。第二年蒙骜才拿下它。', '#ff9a8a'); } }),
      opt('「派蒙骜去。」', '蒙骜+10', () => { addOp(mg, p, 10); fell(); })]
    : [opt('「请随军。」', '名望+5 · 蒙骜+5' + (lv ? ' · 吕不韦+5' : ''), () => { addPrest(5); addOp(mg, p, 5); if (lv) addOp(lv, p, 5); fell(); }),
      opt('「我留在咸阳。」', (alive(zw) ? nm(zw) : '王') + '+5', () => { kingOp(5); fell(); })];
  return { title: '东周', who: [mg.id].concat(!you && lv ? [lv.id] : []),
    text: '东周君联络诸侯，要合兵打秦国。' + (you ? '朝上的人都看着你这个新相邦。' : A.xiang === 'lv' && lv ? '吕不韦请命，要领兵去洛阳。' : '王上要派人领兵去洛阳。'), opts: O };
};
EV.mengliang = () => {
  const mg = qinCat('menga'), lv = LEAD.lv.cat(), p = P(); if (!a2Here() || !mg) return null;
  return { title: '蒙骜的粮', who: [mg.id],
    text: '蒙骜在太原打赵国，派人回来催粮。管粮的说仓里不够，要等秋收。',
    opts: [opt(W.a2.fief ? '「从我的封邑先拨一批。」' : '「从我家先拨一批。」', '鱼干-80 · 蒙骜+15 · 功+4', () => { addFish(-80); addOp(mg, p, 15); addMerit(4, '军粮'); }, () => W.fish >= 80),
      opt('「按规矩，等秋收。」', '蒙骜-10 · 名望+3', () => { addOp(mg, p, -10); addPrest(3); }),
      lv ? opt('「让吕府出。」', '吕不韦-5 · 蒙骜+5', () => { addOp(lv, p, -5); addOp(mg, p, 5); }) : null].filter(Boolean) };
};
EV.hewai = () => {
  const xl = C('xinling'), mg = qinCat('menga'), p = P(), zw = king(); if (!a2Here()) return null;
  const kn = alive(zw) ? nm(zw) : '王';
  const O = [opt('「花钱，让魏王疑他。」', '鱼干-150 · ' + chkHint(3, 11) + ' · 成：名望+10', () => {
      addFish(-150); if (chk(3, 11)) { addPrest(10); addMerit(6, '反间'); if (alive(xl)) addOp(xl, p, -20, true); toast('魏王收了信陵君的兵权', '#9fe89a'); } else toast('钱花了出去，没有回音', '#dddddd'); }, () => W.fish >= 150),
    opt('「守关，等他们自己散。」', chkHint(1, 12) + ' · 成：' + kn + '+5 · 败：名望-5', () => { if (chk(1, 12)) kingOp(5); else addPrest(-5); })];
  if (alive(xl) && opinion(xl, p) >= 40) O.push(opt('「我去见信陵君。」', chkHint(2, 10) + ' · 成：名望+20 ' + kn + '+10', () => { if (chk(2, 10)) { addPrest(20); kingOp(10); addMerit(10, '退兵'); } else addPrest(-3); }));
  return { title: '河外', who: (alive(xl) ? [xl.id] : []).concat(mg ? [mg.id] : []),
    text: '信陵君回了魏国，合五国的兵在河外打败蒙骜，一路追到函谷关。咸阳城里有人开始收拾细软。', opts: O };
};
// 先王 is a month in the ground: the 太后 sends for you, or (more likely) for 吕不韦
EV.jiuqing = () => {
  const q = qmNpc(), p = P(), z = C('zheng'); if (!a2Here() || !qmFree(q) || closeKin(q, p)) return null;
  const lv = lvFor(q), me = youFor(q) && (!lv || opinion(q, p) >= opinion(q, lv));
  if (me) return { title: '旧情', who: [q.id],
    text: '先王下葬才一个月。太后宫里的人深夜来敲门，说太后睡不着，请你进宫说说话。',
    opts: [opt('「更衣，进宫。」', p.sp ? withTip('太后+25 · 私情', '专一', '诚实') : '太后+25 · 私情', () => { if (lv) endAffair(q, lv); qmLover(q, p); addOp(q, p, 25); if (p.sp) { addStress(p, '专一'); addStress(p, '诚实'); } }),
      opt('「夜深了，臣不便进宫。」', '太后-20', () => { addOp(q, p, -20); W.a2.lonely = Math.min(100, W.a2.lonely + 10); }),
      alive(z) ? opt('「这件事该让王上知道。」', '王上+10 · 太后-50 · 结仇', () => { addOp(z, p, 10); addOp(q, p, -50); rivalOf(q, p); }) : null].filter(Boolean) };
  if (!lv) return null;
  qmLover(q, lv);
  return { title: '旧情', who: [q.id, lv.id],
    text: '先王下葬才一个月。太后宫里的人深夜出了宫门，往吕府去了。第二天，吕不韦上朝来得很晚。',
    opts: [opt('「这件事我没看见。」', '', () => {}),
      opt('派人去查', chkHint(3, 10) + ' · 成：得知秘密', () => { if (chk(3, 10)) learnSec(affairOf(q, lv)); else toast('什么也没查到', '#dddddd'); })] };
};
// 郑国渠 (W.flags.canal: pays from 前242, and act three counts it)
const canal = () => { if (!W.flags.canal) { W.flags.canal = W.t; logLine('郑国开始修渠', '#c8e0ff', true); } };
EV.zhengguo = () => {
  const zg = C('zhengguo'), z = C('zheng'), p = P(); if (!a2Here() || !alive(zg)) return null;
  a2c().zg = 1;
  const spy = () => W.secrets.find(s => s.type === 'spy' && s.subj === zg.id) || addSecret('spy', zg.id, null);
  return { title: '郑国', who: [zg.id].concat(alive(z) ? [z.id] : []),
    text: '韩国送来一个水工，叫郑国，说能引泾水灌关中四万顷地。要钱，要人，要十年。',
    opts: [opt('「修。」', '鱼干-100 · 渠成以后每季鱼干+10', () => { addFish(-100); canal(); }, () => W.fish >= 100),
      opt('「韩国人的主意，信不得。」', chkHint(3, 12) + ' · 成：看穿他 · 名望+10', () => { if (chk(3, 12)) { learnSec(spy()); addPrest(10); } else { canal(); toast('没看出什么，渠照修', '#dddddd'); } }),
      opt('「让他修，派人盯着。」', '鱼干-100 · 得知他的底细', () => { addFish(-100); canal(); learnSec(spy()); }, () => W.fish >= 100)] };
};
EV.cangshu = () => {
  const ls = C('lisi'), z = C('zheng'), lv = LEAD.lv.cat(), p = P(); if (!a2Here() || !alive(ls) || a2c().lisi) return null;
  return { title: '仓鼠', who: [ls.id],
    text: '一个楚国来的小吏在你门口等了两天。他说，茅厕里的老鼠吃脏东西，见人就跑；粮仓里的老鼠吃得又肥，又不怕人。「人有没有出息，看站在哪。」',
    opts: [opt('「留下，做我的门客。」', W.ret.length >= RET_MAX ? '门客已满 ' + RET_MAX + ' 人' : '李斯做你的门客 · 日后可荐入朝', () => { if (hire(ls)) a2c().lisi = 'you'; else lisiTo('wang'); }, () => W.ret.length < RET_MAX),
      opt(lv ? '「吕府缺人。」' : '「去宫里试试。」', lv ? '李斯投吕不韦 · 吕的势+1' : '李斯入宫做郎', () => lisiTo(lv ? 'lv' : 'wang')),
      lv && alive(z) ? opt('「带他去见王上。」', '李斯做了郎 · 王上+5', () => { lisiTo('wang'); addOp(z, p, 5); }) : null].filter(Boolean) };
};
EV.jiaowang = () => {
  const z = C('zheng'), A = W.a2, p = P(); if (!a2Here() || !alive(z) || W.kingId !== 'zheng' || !(A.zhongfu === 'you' || A.fu || opinion(z, p) >= 40)) return null;
  return { title: '教王', who: [z.id],
    text: `${zN(z)}十四岁，每天上午听讲。今天他把竹简推到一边，问你：「秦国凭什么打得赢？」`,
    opts: [opt('「秦法。有功必赏，有罪必罚。」', '王上学法家 · 好感+5', () => { if (!z.tr.some(t => EDU.includes(t))) { z.tr.push('法家'); z.eduLv = 1; } else if (z.tr.includes('法家')) z.eduLv = Math.min(3, (z.eduLv || 1) + 1); addOp(z, p, 5); A.taught = W.t; }),
      opt('「秦人肯吃苦。王上要爱惜他们。」', '也许他会仁厚些 · 好感+5', () => { if (chance(.3)) giveTr(z, '仁厚'); addOp(z, p, 5); A.taught = W.t; }),
      opt('「秦王谁都不信。」', '他会多疑 · 忌惮+10', () => { giveTr(z, '多疑'); yiAdd(10); }),
      opt('「以后慢慢讲。」', '', () => {})] };
};
// 献嫪毐 (t72): how he comes in depends on who the 太后's lover is — you, 吕不韦, or (a 狸 太后) nobody tells you
EV.xianlao = () => {
  const q = qmNpc(), p = P(), z = C('zheng'), A = W.a2, lv = LEAD.lv.cat(); if (!a2Here() || !q || !alive(z) || C('laoai') || q.sp) return null;
  if (q.lov.includes(p.id) && a2c().wait) return { title: '献嫪毐', who: [q.id], text: '太后宫里的人又来了。王上十六了，宫门口有人在记你的车。',
    opts: [opt('「把他送进宫。」', '嫪毐入宫 · 你和太后断了 · 忌惮-10', () => { a2c().wait = false; endAffair(q, p); laoEnter(q, 'you', true); yiAdd(-10); addOp(q, p, 10); }),
      opt('「断了。」', '太后-30', () => { a2c().wait = false; endAffair(q, p); addOp(q, p, -30); A.lonely = Math.min(100, A.lonely + 20); })] };
  if (q.lov.includes(p.id)) return { title: '献嫪毐', who: [q.id],
    text: `太后召你越来越勤。${zN(z)}十五了，宫里已经有人在数你进宫的日子。你门下有个舍人叫嫪毐，力气大，脸也长得好。`,
    opts: [opt('「把他送进宫。」', '嫪毐入宫 · 你和太后断了 · 忌惮-10', () => { endAffair(q, p); laoEnter(q, 'you', true); yiAdd(-10); addOp(q, p, 10); }),
      opt('「断了。」', '太后-30', () => { endAffair(q, p); addOp(q, p, -30); A.lonely = Math.min(100, A.lonely + 20); }),
      opt('「再等等。」', '断之前每季忌惮+2', () => { a2c().wait = true; })] };
  if (lv && q.lov.includes(lv.id)) return { title: '献嫪毐', who: [lv.id, q.id],
    text: '吕府的人来说，吕不韦找到了一个能让太后高兴的人，叫嫪毐。缺一个人替他去宫刑官那里打点。',
    opts: [opt('「这个忙我帮。」', '吕不韦+20 · 知道嫪毐的底细', () => { addOp(lv, p, 20); endAffair(q, lv); laoEnter(q, 'you', true); }),
      opt('「记下这件事。」', '知道嫪毐的底细', () => { endAffair(q, lv); laoEnter(q, 'lv', true); }),
      opt('「这件事该让王上知道。」', '王上记你直言 · 吕和太后结仇', () => { addMemo(z, p, '直言', 15); rivalOf(lv, p); rivalOf(q, p); endAffair(q, lv); laoEnter(q, 'lv', false); })] };
  if (q.house !== 'li') return null;
  return { title: '献嫪毐', who: [q.id], pre: () => laoEnter(q, 'lv', false),
    text: `太后宫里多了一个宦官，个子很高，胡子拔得很干净。${who(q)}见你时，眼睛不看你。`,
    opts: [opt('「查。」', chkHint(3, 11) + ' · 成：知道他的底细', () => { if (chk(3, 11)) learnSec(eunuchSec()); else toast('宫里的人嘴很紧', '#dddddd'); }),
      opt('「随她。」', '', () => {}),
      opt('「把他调出宫。」', '太后-20 · 嫪毐结仇', () => { const lao = C('laoai'); addOp(q, p, -20); A.laoIn = false; if (alive(lao)) { lao.loc = 'xtavern'; endAffair(q, lao); rivalOf(lao, p); } })] };
};
EV.bamao = () => {
  const lao = C('laoai'), A = W.a2, p = P(); if (!a2Here() || !alive(lao) || !A.laoIn || a2c().laoBy !== 'you') return null;
  return { title: '拔须', who: [lao.id],
    text: '宫刑官要验身。嫪毐的胡子已经拔干净了，剩下的，要看宫刑官肯不肯睁一只眼。',
    opts: [opt('给宫刑官送一份礼', '鱼干-80 · 嫪毐+20', () => { addFish(-80); addOp(lao, p, 20); }, () => W.fish >= 80),
      opt('「那就真受刑。」', '嫪毐结仇 · 他不会有孩子了', () => { a2c().cut = true; addOp(lao, p, -30); rivalOf(lao, p); W.secrets = W.secrets.filter(s => !(s.type === 'eunuch' && s.subj === lao.id)); }),
      opt('「这事我不管了。」', '嫪毐进不了宫 · 太后寂寞', () => { const q = qmNpc(); A.laoIn = false; lao.loc = 'xtavern'; if (q) endAffair(q, lao); A.lonely = Math.min(100, A.lonely + 20); })] };
};
EV.shiliu = () => {
  const z = C('zheng'), p = P(); if (!a2Here() || !alive(z) || W.kingId !== 'zheng' || W.rank < 2) return null;
  return { title: '王上十六', who: [z.id],
    text: `${nm(z)}十六了。今天议事，他第一次开口：「这件事，为什么没有人问寡人？」满堂的人都看向你。`,
    opts: [opt('「王上问得好，请王上定。」', '王权+5 · 王上+10 · 忌惮-5', () => { wangAdd(5); addOp(z, p, 10); yiAdd(-5); }),
      opt('「王上还小，臣替王上看着。」', '王权-5 · 王上-10 · 忌惮+10', () => { wangAdd(-5); addOp(z, p, -10); yiAdd(10); }),
      opt('「以后，臣先禀王上。」', '王权+10 · 王上+15 · 你的一位朝臣改投王上', () => { wangAdd(10); addOp(z, p, 15); swingTo('wang', 1, 'you', true); })] };
};
EV.hezong = () => {
  const mg = qinCat('menga'), p = P(); if (!a2Here() || W.rank < 1) return null;
  const O = [];
  if (W.rank >= 2) O.push(opt('「我领兵去。」', withTip(chkHint(0, 12) + ' · 成：名望+20 将军归心', '胆小'), () => {
    if (chk(0, 12)) { addPrest(20); addMerit(12, '却五国'); generalTo(2); if (W.kingId === 'zheng') yiAdd(3); } else { addHealth(p, -15); addPrest(-10); toast('你退了回来', '#ff9a8a'); }
    addStress(p, '胆小'); }));
  if (mg) O.push(opt('「派蒙骜。」', '蒙骜+10', () => addOp(mg, p, 10)));
  O.push(opt('「派人去楚国，把这个纵长拆了。」', chkHint(2, 12) + ' · 成：楚系+10 名望+10', () => { if (chk(2, 12)) { sideOp('chu', 10); addPrest(10); } else toast('春申君没有见你的人', '#dddddd'); }));
  return { title: '合纵', who: mg ? [mg.id] : [], text: '楚、赵、魏、韩、燕五国合纵，春申君做纵长。赵将庞煖打到了蕞，离咸阳不到一百里。', opts: O };
};
// (the children themselves come from the season hook: this card is what you do about it)
EV.yonggong = () => {
  const q = qmNpc(), lao = C('laoai'), p = P(); if (!a2Here() || !q || !alive(lao) || !q.lov.includes(lao.id)) return null;
  return { title: '雍宫', who: [q.id, lao.id],
    text: '太后说宫里占卜不吉，要搬去雍城住。嫪毐跟去了。' + (q.preg ? '宫女们私下说，太后这几个月一直穿宽袍子。' : ''),
    opts: [opt('「替太后把话圆上。」', '太后+15 · 得知她的秘密', () => { addOp(q, p, 15); learnSec(affairOf(q, lao)); a2c().watch = true; }),
      opt('派人盯着雍宫', '鱼干-50 · 有了孩子你会知道', () => { addFish(-50); a2c().watch = true; }, () => W.fish >= 50),
      opt('「随她。」', '', () => {})] };
};
EV.shangqing = () => {
  const lv = LEAD.lv.cat(), p = P(); if (!a2Here() || W.rank < 2 || C('ganluo')) return null;
  const gl = spawn2('ganluo', lv ? 'xlvfu' : 'xtavern'); if (!gl) return null;
  const odds = pct(stat(gl, 2), 11);
  return { title: '少年上卿', who: [gl.id].concat(lv ? [lv.id] : []),
    text: (lv ? '吕不韦门下' : '客舍里') + '有个十二岁的孩子叫甘罗，是甘茂的孙子。他说不用一兵一卒，能从赵国要回五座城。' + (lv ? '吕不韦来问你的意思。' : ''),
    opts: [opt('「让他去。」', '甘罗 交 ' + R(odds * 100) + '% · 成：他做上卿 · 名望+15', () => {
        if (chance(odds)) { addPrest(15); glSeat('you'); addOp(gl, p, 15); logLine('甘罗从赵国要回了五座城，做了上卿', '#9fe89a'); } else { addPrest(-5); toast('赵王没理会一个孩子', '#dddddd'); } }),
      opt('「他太小了。」', '甘罗-10' + (lv ? ' · 他跟了吕不韦' : ''), () => { addOp(gl, p, -10); glSeat(lv ? 'lv' : 'wang'); }),
      opt('「我自己去。」', chkHint(2, 14) + ' · 成：名望+20', () => { if (chk(2, 14)) { addPrest(20); addMerit(10, '五城'); } else addPrest(-5); })] };
};
EV.dongwang = () => {
  const hy = C('huayang'), z = C('zheng'), p = P(), A = W.a2, xj = C('xiaji'); if (!a2Here() || !xj) return null;
  return { title: '东望吾子', who: [xj.id].concat(alive(hy) ? [hy.id] : []).concat(alive(z) ? [z.id] : []),
    text: '夏太后临终前说，不跟先王葬在一起，要葬在杜原东边：东望吾子，西望吾夫。华阳太后听说以后，一天没吃东西。',
    opts: [opt('「遂她的愿。」', '宗室+10 · 华阳-10', () => { A.xiajiWish = true; sideOp('zong', 10); if (alive(hy)) addOp(hy, p, -10); }),
      opt('「按礼合葬。」', '华阳+10 · 成峤的声势+5', () => { A.xiajiWish = false; if (alive(hy)) addOp(hy, p, 10); A.claim = Math.min(100, A.claim + 5); }),
      opt('「请王上定。」', '王权+5 · 王上+5', () => { wangAdd(5); if (alive(z)) addOp(z, p, 5); })] };
};
EV.huixing = () => {
  const z = C('zheng'), p = P(); if (!a2Here() || W.rank < 1) return null;
  const k = powerOf('lao') >= powerOf('zong') ? 'lao' : 'zong', L = LEAD[k].cat();
  return { title: '彗星', who: alive(z) ? [z.id] : [],
    text: '彗星先出在东方，又转到西方，前后十六天。太史说主兵灾。朝上的人都在看别人的脸色。',
    opts: [opt('「天象而已。」', '', () => {}),
      opt('「请王上大赦，安人心。」', '名望+5 · 王权+3', () => { addPrest(5); wangAdd(3); }),
      L ? opt('「这是有人要作乱。」', chkHint(3, 12) + ' · 成：' + nm(L) + '少一个人', () => { if (chk(3, 12)) cutSeat(k, L); else addPrest(-5); }) : null].filter(Boolean) };
};
EV.changxin = () => {
  const lao = LEAD.lao.cat(), q = qmNpc(), z = C('zheng'), p = P(); if (!a2Here() || !lao) return null;
  return { title: '长信侯', who: [lao.id].concat(q ? [q.id] : []),
    text: '太后下诏，封嫪毐为长信侯，赐山阳地。他的门客已经上千，宫里大小事都要先问他。',
    opts: [opt('「上书反对。」', chkHint(1, 12) + ' · 嫪毐结仇 · 成：王上+10', () => { addOp(lao, p, -30); rivalOf(lao, p); if (q) addOp(q, p, -20); if (chk(1, 12)) { if (alive(z)) addOp(z, p, 10); } else toast('奏章压在了太后宫里', '#dddddd'); }),
      opt('备礼道贺', '鱼干-60 · 嫪毐+20 · 王上-5', () => { addFish(-60); addOp(lao, p, 20); if (alive(z)) addOp(z, p, -5); }, () => W.fish >= 60),
      opt('「不说话。」', '', () => {})] };
};
// 屯留: 成峤's letter. With the 宗室 behind him (声势 50) he takes the throne, and you are 仲父 beside him (E2)
function cjLetter() {
  const cj = C('chengjiao'), z = C('zheng'), p = P(), A = W.a2;
  const s = addSecret('plot', cj.id, p.id);
  if (A.claim < 50) { cjDies(); if (chance(.5)) { yiAdd(30); if (alive(z)) s.known.push(z.id); logLine('成峤的营里搜出了你的信', '#ff9a8a'); } return; }
  W.kingId = cj.id; cj.role = 'ruler'; cj.disp = '秦王' + cj.name; cj.dieT = null; cj.immortal = false; cj.loc = 'xpalace'; outOfCourt(cj.id);
  if (alive(z)) { z.dieT = null; z.immortal = false; die(z, true); }
  if (A.laoIn) laoFalls();
  endAs('E2'); logLine('政从此没了消息。成峤坐上了王座。', '#ff9a8a');
}
EV.tunliu = () => {
  // (nobody writes to a child head: the letter's road ends in 仲父, see headOffice)
  const cj = C('chengjiao'), z = C('zheng'), p = P(), A = W.a2; if (!a2Here() || !alive(cj) || !alive(z) || W.kingId !== 'zheng' || A.end || ageOf(cj) < 14 || !alive(p) || ageOf(p) < 16) return null;
  return { title: '屯留', who: [cj.id, z.id],
    text: '长安君成峤领兵攻赵，走到屯留停了下来。一封没有署名的信送到你府上：「若王有不测，长安君愿以国事相托。」',
    opts: [opt('「回信。」', A.claim >= 50 ? '他起兵能成 · 你做仲父' : '他多半会败 · 信或被搜出', cjLetter),
      opt('「把信交给王上。」', '王上+20 · 忌惮-15 · 长安君兵败', () => { addOp(z, p, 20); yiAdd(-15); cjDies(); }),
      opt('「逼他反，再去平了他。」', withTip(chkHint(3, 12) + ' · 成：名望+15 将军归心', '仁厚'), () => { if (chk(3, 12)) { addPrest(15); generalTo(1); } else addPrest(-5); addStress(p, '仁厚'); cjDies(); }),
      opt('「劝他回来请罪。」', chkHint(2, 13) + ' · 成：保住他的命 · 王上-5', () => { if (chk(2, 13)) { cjSaved(); sideOp('zong', 10); addOp(z, p, -5); } else cjDies(); }, null, '仁厚')] };
};
EV.yizi = () => {
  const lv = LEAD.lv.cat(), A = W.a2, p = P(); if (!a2Here()) return null;
  const rs = W.ret.filter(id => alive(C(id))).length;
  if (!lv) return A.zhongfu === 'you' && rs ? { title: '一字千金', who: [p.id],
    text: '你门下的客编成了一部书，十二纪、八览、六论，二十多万字。门客们说，该挂到市门上去，旁边摆上千金。',
    opts: [opt('「挂在市门。」', '名望+20 · 忌惮+5', () => { addPrest(20); yiAdd(5); }), opt('「不必张扬。」', '忌惮-5', () => yiAdd(-5))] } : null;
  return { title: '一字千金', who: [lv.id],
    text: '《吕氏春秋》编成了，挂在咸阳的市门上，旁边摆着千金：谁能增删一个字，金子就归谁。' + (rs ? '你的门客说他挑得出错。' : '满城的人都去看，没有人敢动。'),
    opts: [rs ? opt('「让他去。」', chkHint(3, 12) + ' · 成：吕不韦少一个人 名望+8', () => { if (chk(3, 12)) { addOp(lv, p, -20); cutSeat('lv', lv); addPrest(8); } else addPrest(-5); }) : null,
      opt(rs ? '「别惹事。」' : '「去市门看一眼。」', '', () => {}),
      rs >= 3 ? opt('「我们也编一本。」', '鱼干-150 · 名望+15', () => { addFish(-150); addPrest(15); }, () => W.fish >= 150) : null].filter(Boolean) };
};
EV.jiafu = () => {
  const lao = LEAD.lao.cat(), z = C('zheng'), p = P(); if (!a2Here() || !lao || !alive(z)) return null;
  return { title: '假父', who: [lao.id],
    text: '嫪毐喝多了，跟人打起来，大喊：「我是秦王的假父，你们算什么！」一屋子的人都在看你。',
    opts: [opt('「当场压下去。」', '嫪毐+10 · 王上不会知道', () => addOp(lao, p, 10)),
      opt('让这话传到王上耳朵里', '王权+10 · 冠礼时王方多两个人', () => { wangAdd(10); const s = eunuchSec(); if (s) { if (!s.known.includes(z.id)) s.known.push(z.id); learnSec(s); } swingTo('wang', 2, 'lao'); }),
      opt('笑着附和', '嫪毐+20 · 王上日后会知道', () => { addOp(lao, p, 20); a2c().laughed = true; })] };
};
EV.maojiao = () => {
  const q = qmNpc(), z = C('zheng'), p = P(), X = a2c(); if (!a2Here() || !q || q.loc !== 'yong' || !alive(z) || W.kingId !== 'zheng' || X.mj) return null;
  const mj = spawn2('maojiao', 'xtavern'); if (!mj) return null;
  X.mj = 1;
  const pr = clamp(.5 + (stat(p, 2) - 10) * .03, .2, .85), bold = ['诚实', '勇猛'].find(t => p.tr.includes(t));
  return { title: '茅焦', who: [mj.id, z.id],
    text: '太后被迁到了雍城。为这件事去劝王上的，已经有二十七个没再回来。一个齐国人叫茅焦，来求你引他进宫。',
    opts: [opt('「我引你进去。」', '茅焦 ' + R(pr * 100) + '% · 成：太后回宫 · 败：王上-10', () => { if (chance(pr)) { qmHome(); addOp(q, p, 30); addPrest(10); mjSeat(); } else addOp(z, p, -10); }),
      opt('「你会是第二十八个。」', '', () => { if (chance(.5)) { logLine('茅焦自己进了宫。', '#c8e0ff'); qmHome(); mjSeat(); } }),
      bold ? opt('「我自己去说。」', chkHint(2, 15) + ' · 成：太后+40 名望+20 · 败：王上-30', () => {
        if (chk(2, 15)) { qmHome(); addOp(q, p, 40); addOp(z, p, 10); addPrest(20); } else { addOp(z, p, -30); yiAdd(20); } }, null, bold) : null].filter(Boolean) };
};

// ---------------------------------------------------------- the 邯郸 line
EV.shoucheng = () => {
  const z = C('zheng'), q = qmNpc(), p = P(), zw = cityRuler(), X = a2c(); if (!hdZ() || !q || !alive(z)) return null;
  const bet = W.a2.line === 'zhao';
  return { title: '围城之后', who: [q.id, z.id],
    text: `秦军退了，赵王的人还在搜秦国人的妻儿。质子府门口日夜有人守着，${nm(q)}带着${nm(z)}，一天只敢出来一次。`,
    opts: [opt('「我派人守着这里。谁问都说是远亲。」', '每年搜城一回 · ' + chkHint(3, 9) + ' · 败则鱼干-40', () => { X.guardZ = true; addOp(q, p, 5); }),
      opt(q.house === 'li' ? '「去乡下的庄子躲一阵。」' : '「回你娘家躲一阵。」', nm(q) + '+10', () => addOp(q, p, 10)),
      bet && alive(zw) && !X.soldZ ? opt('「把他们交给赵王。」', nm(zw) + '+30 · 他们记恨一辈子', () => { addOp(zw, p, 30); addMemo(q, p, '邯郸之仇', -60); addMemo(z, p, '邯郸之仇', -60); X.soldZ = true; }) : null].filter(Boolean) };
};
EV.yandan = () => {
  const z = C('zheng'), d = C('dan'), p = P(); if (!hdGuard() || !alive(d)) return null;
  return { title: '燕太子', who: [d.id, z.id],
    text: `燕国的太子丹也在邯郸做质子，比${nm(z)}大一岁。两个孩子常在墙根下斗草。`,
    opts: [opt('「让他们一起玩。」', nm(z) + '+5 · 丹+10', () => { addOp(z, p, 5); addOp(d, p, 10); addMemo(z, d, '儿时玩伴', 20); addMemo(d, z, '儿时玩伴', 20); W.flags.danFriend = true; }),
      opt('「燕国人，离远点。」', '', () => {})] };
};
EV.shitou = () => {
  const z = C('zheng'), p = P(); if (!hdGuard()) return null;
  return { title: '石头', who: [z.id],
    text: `${nm(z)}从巷子口跑回来，额角破了。几家赵国孩子冲他扔石头，骂他秦国崽子。他没哭，只问你那几家姓什么。`,
    opts: [opt('「把那几家赶出这条巷子。」', '鱼干-30 · ' + nm(z) + '+15 · 名望-3', () => { addFish(-30); addOp(z, p, 15); addPrest(-3); W.flags.handanFoes = true; }, () => W.fish >= 30),
      opt('「忍着，他们人多。」', nm(z) + '+5 · 也许他学会节制', () => { addOp(z, p, 5); if (chance(.3)) giveTr(z, '节制'); }),
      opt('「下回打回去。」', nm(z) + '+10 · 也许他变得勇猛', () => { addOp(z, p, 10); if (chance(.3)) giveTr(z, '勇猛'); })] };
};
EV.zhaoke = () => {
  const zw = C('zhaowang'), py = C('pingyuan'), p = P(), A = W.a2; if (!hdC() || !alive(zw) || W.rank >= 2 || !['zhao', 'free'].includes(A.line)) return null;
  const bet = A.line === 'zhao'; if (!bet && opinion(zw, p) < 0) return null;
  const yr = C('yiren');
  return { title: '赵国的客卿', who: [zw.id].concat(alive(py) ? [py.id] : []),
    text: nm(zw) + '在朝上提起你：「' + (bet ? '那个替寡人盯住秦人的商人。' : '那个没跟秦人走的商人。') + '」' + (alive(py) ? '平原君' : '宫里') + '派人来问，愿不愿意做赵国的客卿。',
    opts: [opt('「愿意。」', '客卿 · 俸禄每季 20' + (alive(yr) ? ' · ' + nm(yr) + '-10' : ''), () => promote(2, alive(py) ? py : zw)),
      opt('「我只是个商人。」', '名望+3', () => addPrest(3))] };
};
EV.pyzu = () => {
  const py = C('pingyuan'), p = P(); if (!hdC() || !py || alive(py) || isFriend(py, p)) return null;
  W.queue = W.queue.filter(q => !(q.ev === 'death' && q.a === py.id));
  return { title: '平原君', who: [py.id], text: '平原君死了。他门下食客三千，送葬的人从府门一直排到城门。',
    opts: [opt('备礼去吊唁', '鱼干-20 · 名望+5', () => { addFish(-20); addPrest(5); }, () => W.fish >= 20), opt('「不去。」', '', () => {})] };
};

// ---------------------------------------------------------- cards the court sets off
EV.qmcall = () => {
  const q = qmNpc(), p = P(); if (!a2Here() || !qmFree(q) || !youFor(q) || q.lov.includes(p.id)) return null;
  const rec = !C('laoai') && W.t >= 62 && W.t < 96 && alive(C('zheng'));
  return { title: '太后召见', who: [q.id],
    text: '太后派人送来一盒点心，盒底压着一片竹简：今夜宫门不锁。',
    opts: [opt('「今夜进宫。」', p.sp ? withTip('太后+20 · 私情', '专一', '诚实') : '太后+20 · 私情', () => { qmLover(q, p); addOp(q, p, 20); if (p.sp) { addStress(p, '专一'); addStress(p, '诚实'); } }),
      opt('「臣病了。」', '太后-15', () => addOp(q, p, -15)),
      rec ? opt('「荐一个人给太后。」', '嫪毐入宫 · 知道他的底细', () => { laoEnter(q, 'you', true); addOp(q, p, 5); }) : null].filter(Boolean) };
};
// 刺客 (e.a: who sent him): a leader who hates you (−60) tries it once in a while
EV.a2cike = e => {
  const L = e && C(e.a), p = P(); if (!a2Here() || !alive(L) || !alive(p)) return null;
  const gd = W.ret.map(C).filter(c => alive(c) && stat(c, 0) >= 12).sort((a, b) => stat(b, 0) - stat(a, 0))[0];
  const caught = () => { const s = addSecret('murder', L.id, p.id); s.try = true; s.known = [L.id]; learnSec(s); };
  return { title: '刺客', who: [], text: '半夜，院墙上有动静。你睡的那间屋子，窗纸破了一个洞。',
    opts: [opt('自己去看', withTip(chkHint(0, 11) + ' · 败：受伤', '胆小'), () => {
        if (chk(0, 11)) toast('那人翻墙跑了', '#9fe89a'); else { if (typeof addWound === 'function') addWound(p); else addHealth(p, -25); toast('你受了伤', '#ff9a8a'); } addStress(p, '胆小'); }),
      gd ? opt('叫醒' + nm(gd), '必成 · ' + nm(gd) + '+10', () => { addOp(gd, p, 10); toast(nm(gd) + '把那人赶走了', '#9fe89a'); }) : null,
      opt('你本来就没睡', '抓到活口 · 知道是谁派的', caught, null, '夜猫子')].filter(Boolean) };
};
// what an 出使 may bring home
EV.x2_zhu = () => ({ title: '回程', who: [], text: '回程路上，韩国的相国私下塞给你一盒珠子，托你在秦王面前替韩国说句好话。',
  opts: [opt('收下', withTip('鱼干+80 · 也许有人告发', '诚实'), () => { addFish(80); addStress(P(), '诚实'); if (chance(.25)) { addPrest(-8); toast('朝上有人说你收了韩国的钱', '#ff9a8a'); } }),
    opt('「这盒子请收回去。」', '名望+5', () => addPrest(5))] });
EV.x2_li = () => {
  const id = pick(['bianzhong', 'shujin', 'tongjing', 'chuxiu']), it = typeof MEIWU === 'object' && MEIWU[id]; if (!it) return null;
  return { title: '回程', who: [], text: '你出使' + pick(['楚国', '魏国', '齐国']) + '，那边的国君很客气，临走送了你' + it.d + '。',
    opts: [opt('「收下。」', '得到' + it.n, () => gainItem(id, '出使')), opt('「转献给王上。」', '王上+10', () => kingOp(10))] };
};
A2_ENVOY.push('x2_zhu', 'x2_li');

// ---------------------------------------------------------- the 咸阳 pool
// a general's house asks for one of your children (a son or daughter of the general when the ages allow)
const lyGen = () => ['mengwu', 'menga', 'wangjian'].map(qinCat).find(Boolean) || null;
const lyKids = () => adults(kinPool()).filter(c => !c.sp && c.id !== W.player && c.loc === 'home' && inCity(c) && canWed(c) && ageOf(c) <= 30);
RANDOM.push(
  { id: 'xy_lianyin', w: 2, cd: 40, ok: () => inQin() && W.act >= 2 && !!lyGen() && lyKids().length > 0, b: () => {
    const g = lyGen(), kid = pick(lyKids()), f = !kid.female, sex = f ? 'F' : 'M';
    let born = clamp(kid.born + Math.floor(Math.random() * 16) - 8, W.t - 4 * 28, W.t - 4 * 17);
    const own = born >= g.born + 4 * 18 && born <= W.t;
    const c = mkc({ sur: g.sur, name: pick(f ? GIV_F : GIV_M), female: f, born, loc: 'xmarket', role: 'noble', robe: 'qin', state: '秦', dad: own ? g.id : undefined,
      g: breed(randGenome(Math.random, 'F'), g.g, Math.random, sex) });
    if (own) g.kids.push(c.id);
    return { title: '联姻', who: [g.id, c.id, kid.id],
      text: `${nm(g)}托人来说亲，想让${own ? '他的' + (f ? '女儿' : '儿子') : g.sur + '家的'}${nm(c)}和${who(kid)}结为夫妻。`,
      opts: [opt('「好。」', '成亲 · ' + nm(g) + '「姻亲」+20', () => { marry(kid, c); kinOnMarriage(kid, c, g); logLine(nm(kid) + '与' + nm(c) + '成亲了', '#ffe08a'); addMemo(g, P(), '姻亲', 20); SFX.happy(); }, () => !kid.sp && !c.sp && alive(kid)),
        opt('「高攀不起。」', nm(g) + '-5', () => { addOp(g, P(), -5); g.kids = g.kids.filter(x => x !== c.id); delete W.chars[c.id]; })] }; } },
  { id: 'xy_zhengwen', w: 3, cd: 12, ok: () => { const z = C('zheng'); return inQin() && W.act === 2 && W.rank >= 2 && alive(z) && reach(z) && ageOf(z) >= 8 && ageOf(z) <= 20 && z.loc !== 'hougong'; }, b: () => {
    const z = C('zheng'), p = P(), q = qm(), lv = LEAD.lv.cat();
    const sec = q && W.secrets.find(s => !s.exposed && (s.type === 'affair' || s.type === 'bastard') && [s.subj, s.other].includes(q.id) && !s.known.includes(z.id));
    const X = a2c(), asked = X.asked || (X.asked = []);
    let Q = [['「商君替秦国做了那么多事，为什么落得那样？」', null], ['「赵国人为什么恨秦国？」', null]];
    if (sec) Q.push(['「母亲夜里为什么不让人进她的宫？」', sec]);
    if (lv && W.a2.zhongfu === 'lv') Q.push(['「仲父的门客，为什么比寡人的还多？」', null]);
    if (alive(C('huayang')) && alive(C('xiaji'))) Q.push(['「两位祖母为什么不说话？」', null]);
    if (Q.some(q => !asked.includes(q[0]))) Q = Q.filter(q => !asked.includes(q[0]));
    const [ask, s] = pick(Q); if (!asked.includes(ask)) asked.push(ask);
    return { title: '政问', who: [z.id], text: nm(z) + (ageOf(z) < 14 ? '拉住你的袖子：' : '退朝以后把你留下，问：') + ask,
      opts: [opt(ageOf(z) < 16 ? '「王上长大就懂了。」' : '「这事，王上不必知道。」', '王上-5', () => addOp(z, p, -5)),
        opt('「说实话。」', '王上+10' + (s ? ' · 他会知道太后的事' : ''), () => { addOp(z, p, 10); if (s && !s.known.includes(z.id)) s.known.push(z.id); }),
        opt('「这话别再问别人。」', '王上+5 · 也许他会多疑', () => { addOp(z, p, 5); if (chance(.2)) giveTr(z, '多疑'); })] }; } },
  // 商君's law: two grown sons under one roof pay double (分异)
  { id: 'xy_fenyi', w: 2, cd: 40, ok: () => inQin() && household().filter(c => c.house === 'li' && !c.female && ageOf(c) >= 16 && c.id !== W.player).length >= 2, b: () => {
    const h = typeof heirNow === 'function' ? heirNow() : heirOf(), sons = household().filter(c => c.house === 'li' && !c.female && ageOf(c) >= 16 && c.id !== W.player);
    const out = sons.filter(c => c !== h && c !== heirOf() && !c.sp).sort((a, b) => b.born - a.born)[0];
    return { title: '分异', who: out ? [out.id] : [], text: '里正上门来查户。按秦法，家里有两个成年的儿子却不分家的，赋税加倍。',
      opts: [opt('「照交。」', '鱼干-40', () => addFish(-40)),
        out ? opt('让' + nm(out) + '搬出去住', ta(out) + '另立门户', () => { out.flags.branch = true; out.loc = 'xmarket'; logLine(nm(out) + '搬出狸宅，另立了门户', '#dddddd'); }) : null].filter(Boolean) }; } },
  { id: 'xy_keshe', w: 2, cd: 40, ok: () => inQin(), b: () => {
    const f = chance(.3), c = mkc({ sur: pick(SURS), name: pick(f ? GIV_F : GIV_M), female: f, born: W.t - 4 * (20 + Math.floor(Math.random() * 12)), loc: 'xtavern', role: 'shi', robe: 'shi', state: '魏' });
    return { title: '客舍', who: [c.id], text: `天黑以后，一个叫${nm(c)}的外乡人来敲门。按秦法，客舍不收没有凭证的人，${ta(c)}在街上转了半夜。`,
      opts: [opt('「进来吧。」', ta(c) + '好感+20 · 若是逃犯，你家连坐', () => { addOp(c, P(), 20); if (chance(.15)) { addFish(-40); toast('第二天里正找上门来，罚了鱼干', '#ff9a8a'); } }),
        opt('「按规矩，不收。」', '', () => {})] }; } },
  { id: 'xy_wei', w: 2, cd: 40, ok: () => inQin() && W.fish >= 60, b: () => ({ title: '渭水', who: [], text: pick(['渭水涨了一夜，市东的仓进了水。', '连下了半个月的雨，渭水漫过了堤，你家的货栈泡在水里。']),
    opts: [opt('连夜把货搬出来', chkHint(0, 9) + ' · 败则鱼干-50', () => { if (chk(0, 9)) toast('大半搬了出来', '#9fe89a'); else addFish(-50); }), opt('「认了。」', '鱼干-30', () => addFish(-30))] }) },
);

// ---------------------------------------------------------- court errands
JOBS.push(
  { id: 'q_zhenzai', patron: '*', title: '赈灾', task: '捐 100 鱼干赈灾', tab: 'home', pay: 100, due: 3, w: .5, goal: { kind: 'jobpay', target: 'giver' },
    reward: { merit: 10, prest: 5 }, ok: gv => a2Here() && W.rank >= 1 && !!gv && gv.role === 'ruler' && gv.id !== W.player, acts: (c, j) => c.id === j.from ? [payAct(c, 100, '赈灾')] : [],
    line: '「关中旱了，仓里的粮不够分。你们做买卖的手里有鱼干，拿些出来。」' },
  { id: 'q_peidu', patron: '*', title: '伴读', task: j => '教导' + nm(C('zheng')) + '一回', tab: 'people', due: 3, w: .6, goal: { kind: 'teachKing', target: ['zheng'] },
    reward: { merit: 8 }, ok: gv => { const z = C('zheng'); return a2Here() && !!gv && gv !== z && alive(z) && reach(z) && ageOf(z) < 22 && W.rank >= 2 && (W.rank >= 3 || !!W.a2.fu); },
    line: () => '「' + zN(C('zheng')) + '近来不肯读书。你去讲一回，他听你的。」' },
  { id: 'q_tanlao', patron: '*', title: '探嫪', task: '刺探嫪毐', tab: 'people', due: 3, w: .5, goal: { kind: 'spy', target: ['laoai'] }, odds: () => chkHint(3, 11),
    reward: { merit: 10 }, ok: gv => a2Here() && !!LEAD.lao.cat() && !!gv && gv.id !== 'laoai' && pct(stat(P(), 3), 11) >= .25,
    line: '「长信侯府上天天有人进出。你去看看，都是些什么人。」' },
);

// ---------------------------------------------------------- hooks
SYS.init.push(W => { W.a2.ct = {}; });
SYS.load.push(W => {
  if (!W.a2) return; if (!W.a2.ct) W.a2.ct = {};
  // (a build that seated them from the static table: keep them seated)
  for (const id of ['lisi', 'ganluo', 'maojiao']) { const c = C(id); if (alive(c) && c.loc === 'xpalace' && !W.a2.cx.some(r => r.id === id) && !W.a2.recs.includes(id)) addCourtier(id, 1); }
});
SYS.econ.push(inc => { if (W.flags.canal && W.t >= 80 && inQin() && W.rank >= 1) inc.push(['郑国渠', 10]); });
SYS.season.push(() => {
  const A = W.a2; if (!A || !W.flags.act1Done) return;
  const X = a2c(), p = P(), q = qmNpc(), t = W.t, lao = C('laoai');
  if (t >= 24 && t < 93 && !C('chengjiao')) cjBirth();
  const cj = C('chengjiao'), hf = C('hanfuren');
  if (alive(cj) && cj.loc === 'hougong' && ageOf(cj) >= 16) cj.loc = 'xpalace';
  if (alive(hf) && hf.immortal && (cj || t >= 93)) { hf.immortal = false; hf.dieT = null; }
  // 郑国 comes with a secret only the 韩 king knows
  const zg = C('zhengguo'); if (alive(zg) && !W.secrets.some(s => s.type === 'spy' && s.subj === zg.id)) addSecret('spy', zg.id, null);
  // (the canal is dug as history has it unless you were there to argue it down)
  if (t >= 65 && alive(zg) && !X.zg) { X.zg = 1; canal(); }
  // (a hist cat sent off in 邯郸's words — 'tavern' — stays in 咸阳)
  for (const id of MY_XY) { const c = C(id); if (alive(c) && c.loc !== 'home' && HD_LOCS.has(c.loc)) c.loc = CITY.xianyang.at[c.loc] || 'xtavern'; }
  // those who come to 咸阳 without you there to meet them find their places as history has it
  if (t >= 66 && alive(C('lisi')) && !X.lisi) lisiTo(LEAD.lv.cat() ? 'lv' : 'wang');
  if (t >= 87 && t < 100 && !C('ganluo') && spawn2('ganluo', 'xpalace')) glSeat(LEAD.lv.cat() ? 'lv' : 'wang');
  // 长信侯 (前239): the court starts to ask him first
  if (t >= 92 && !X.cx && A.laoIn && alive(lao)) { X.cx = 1; lao.role = 'noble'; swingTo('lao', 2); }
  if (X.cut) A.laoMen = Math.min(A.laoMen, 2);
  // 雍宫: two children of 嫪毐's (from 前241), unless he really was cut
  const yongN = alive(lao) ? lao.kids.filter(id => C(id)).length : 0;
  if (q && alive(lao) && q.lov.includes(lao.id) && !X.cut && t >= 85 && t < 96 && !q.preg && t >= (X.yongT || 0) && ageOf(q) <= 40 && yongN < 2) { setPreg(q, lao.id); X.yongT = t + 4; }
  // (a third one of his the season's own roll gave her never comes to term: history has two)
  if (q && q.preg && q.preg.f === 'laoai' && yongN >= 2) q.preg = null;
  // (no father to deceive: the child is the proof of the affair, which a watcher learns)
  if (alive(lao)) for (const k of lao.kids.map(C)) if (alive(k) && !k.flags.yong) {
    k.flags.yong = 1; k.disp = '雍宫的孩子'; const m = C(k.mom);
    if (X.watch && m) { learnSec(affairOf(m, lao)); logLine('雍宫里多了一个孩子', '#ffb0d0', true); }
  }
  // you keep the 太后 waiting, and 政 is counting the nights
  if (X.wait) { if (q && q.lov.includes(W.player) && W.kingId === 'zheng') yiAdd(2); else X.wait = false; }
  if (X.wait && !X.wait2 && t >= 76 && a2Here() && !C('laoai') && !W.queue.some(x => x.ev === 'xianlao')) { X.wait2 = 1; W.queue.push({ ev: 'xianlao' }); }
  // 廉颇 leaves 赵 for 魏 (前244)
  if (t === 68) { const lp = C('lianpo'); if (alive(lp) && cityOf(lp) === 'handan') lp.loc = 'daliang'; }
  if (X.laughed && !A.laoIn && !X.laughDone) { X.laughDone = 1; const z = C('zheng'); if (alive(z) && alive(p)) addMemo(z, p, '附和嫪毐', -15); }
  // a lonely 太后 sends for someone
  if (a2Here() && q && A.lonely >= 50 && !W.cool.qmcall && W.kingId !== W.player) {
    W.cool.qmcall = 8;
    const lv = lvFor(q);
    if (qmFree(q) && youFor(q) && !q.lov.includes(W.player)) W.queue.push({ ev: 'qmcall' });
    else if (qmFree(q) && lv) qmLover(q, lv);
    else if (!C('laoai') && t >= 62 && t < 96 && alive(C('zheng'))) laoEnter(q, 'lv', false);
  }
  // a leader who hates you enough sends someone over the wall
  if (a2Here() && alive(p) && W.rank >= 1 && !W.cool.a2cike) for (const k of ['lv', 'zong', 'lao', 'chu']) {
    const L = LEAD[k].cat(); if (!L || L.id === W.player) continue;
    if (opinion(L, p) <= -60 && chance(.25)) { W.queue.push({ ev: 'a2cike', a: L.id }); W.cool.a2cike = 8; break; }
  }
  // 茅焦 (前238): the 太后 comes back from 雍城 whether or not you took him in
  if (t >= 99 && t < 104 && q && q.loc === 'yong' && W.kingId === 'zheng' && !X.mj) { X.mj = 1; if (spawn2('maojiao', 'xpalace')) mjSeat(); logLine('齐人茅焦进宫劝谏。', '#c8e0ff', !inQin()); qmHome(); }
});
// the 赵 soldiers come searching once a year while you hide 政 and his mother (you can't lose them, only fish and face)
SYS.yearly.push(() => {
  const X = W.a2 && W.a2.ct; if (!X || !X.guardZ || !zhengInHandan() || W.city !== 'handan' || W.t >= 47) return;
  if (chk(3, 9)) logLine('赵兵来搜过一回，什么也没找到', '#c8e0ff', true);
  else { addFish(-40, true); addPrest(-5); logLine('赵兵又来搜了一回。你花了 40 鱼干打发他们走', '#ff9a8a'); }
});
// ---- end act2
