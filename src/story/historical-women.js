// Attested women, with explicitly adapted ages/travel and ordinary relationship mechanics.
// New characters alone receive a fixed visual genome. Loads never rewrite an existing person.
const WOMEN_CAST = {
  ruji: { n: '如姬', sur: '如', name: '姬', born: 286, enter: 262, last: 220, loc: 'daliang', state: '魏', role: 'noble', robe: 'wei', tr: ['勇猛', '记仇', '仁厚'], st: [7, 6, 13, 12],
    coat: 'blackwhite', source: '史记·魏公子列传', fact: '魏安釐王的宠姬。她感念信陵君为父报仇之恩，在窃符救赵中取得虎符。',
    adapt: '生卒年不详。游戏设前262年二十四岁，居大梁；保留与魏王的初始关系。魏王去世后能否再结姻缘，由当时的关系决定。',
    partner: { id: 'anli', from: 262, until: 243 },
    topic: ['一诺千金', '如姬把一枚小小的符节放在案上。她问：若旧日受过恩，今日回报却有风险，你还肯不肯赴约？', 2, 9, '认真说清如何践诺'] },
  baqing: { n: '巴清', sur: '巴', name: '清', born: 282, enter: 262, last: 210, loc: 'shu', state: '秦', role: 'merchant', robe: 'qin', tr: ['勤快', '节制', '多疑'], st: [3, 17, 10, 14],
    coat: 'silver', source: '史记·货殖列传', fact: '巴地寡妇清经营丹砂家业，以财自卫，受到秦始皇礼遇。巴是地望，清是她留下的名字。',
    adapt: '生卒年与早年经历不详。游戏设她前262年二十岁，已独立掌家，寓居可前往的蜀。再次成婚属于玩家改写的分支，产业不会随婚姻白送。',
    topic: ['丹砂账簿', '清把运费、损耗和护送的钱分成三笔。她不在乎来客说得多好听，只想知道这一趟货怎样才能平安回本。', 1, 10, '逐项核算这笔生意'] },
  liyuanmei: { n: '李园妹', sur: '李', name: '氏', born: 270, enter: 250, last: 205, loc: 'tavern', state: '赵', role: 'noble', robe: 'chu', tr: ['野心', '狡诈', '高冷'], st: [3, 10, 13, 16],
    coat: 'chocolate', source: '史记·春申君列传', fact: '史书称她为赵人李园的妹妹，记载了她与春申君、楚考烈王及楚国继承之争的关系，未留下可靠的个人名字。',
    adapt: '年龄、相遇与离楚旅居是游戏改编。前250年在邯郸出场；晚期开局在大梁。婚姻与生育只按本局数据，不把既有孩子补写成楚王。',
    partner: { id: 'kaolie', from: 248, until: 238, n: '楚考烈王', sur: '芈', name: '完', born: 303, state: '楚' },
    topic: ['留一条退路', '李氏收起竹简，问来客：一时得势固然可喜，若明日换了主事的人，你给家里留过退路吗？', 3, 10, '推演局势与退路'] },
  lvzhi: { n: '吕雉', sur: '吕', name: '雉', born: 241, enter: 223, last: 180, loc: 'daliang', state: '楚', role: 'noble', robe: 'chu', tr: ['勤快', '野心', '记仇'], st: [6, 16, 11, 15],
    coat: 'calico', source: '史记·高祖本纪、吕太后本纪', fact: '吕雉出自吕公之家，在刘邦尚未显贵时成为其妻，后来参与汉初政局。',
    adapt: '出生年采用常见推定。游戏前223年成年出场，吕氏暂寓大梁是旅居改编；晚期开局保留刘季婚配。未出嫁时可以结交、提亲。',
    partner: { id: 'liuji', from: 220, until: 195 },
    topic: ['把家撑起来', '吕雉听完来客的志向，把话题拉回了仓里的粮、家里的老小和来年要用的钱。她想知道谁会把说过的话办成。', 1, 10, '谈一份能落地的持家安排'] },
  yuji: { n: '虞姬', sur: '虞', name: '姬', born: 232, enter: 214, last: 175, loc: 'daliang', state: '楚', role: 'dancer', robe: 'chu', tr: ['勇猛', '专一', '仁厚'], st: [11, 5, 13, 8],
    coat: 'cream', source: '史记·项羽本纪', fact: '史书记载项羽身边有名虞的美人，常随行。她的生年、早年经历与后来许多细节并无确切记载。',
    adapt: '游戏设前214年十八岁，在大梁结识；剑与衣饰是人物设计。晚于前208年的新载入前史保留项羽关系，不强制自尽或覆盖玩家婚姻。',
    partner: { id: 'xiangyu', from: 208, until: 202, n: '项羽', sur: '项', name: '籍', born: 232, state: '楚' },
    topic: ['乱世相伴', '虞姬说，兵荒马乱时，承诺陪伴很容易，真正留下来很难。她请来客讲讲，遇上危急会怎样护住同行的人。', 0, 9, '谈护送与应变'] },
  boji: { n: '薄姬', sur: '薄', name: '姬', born: 230, enter: 212, last: 155, loc: 'daliang', state: '魏', role: 'commoner', robe: 'wei', tr: ['知足', '节制', '仁厚'], st: [2, 12, 10, 12],
    coat: 'bluewhite', source: '史记·外戚世家', fact: '薄姬母亲出自魏王宗家，曾在魏豹宫中，后来成为汉文帝之母。史书还记下她与管夫人、赵子儿的旧约。',
    adapt: '生年不详。游戏设前212年十八岁，在大梁出场；晚期开局保留当时的魏豹关系。与狸家所生的孩子照常取名、遗传，不强制成为刘恒。',
    partner: { id: 'weibao', from: 208, until: 204, n: '魏豹', sur: '魏', name: '豹', born: 250, state: '魏' },
    topic: ['旧交莫忘', '薄姬整理着线束，说起旧日相识的人。她问：如果有朝一日家里富贵了，那些未能同行的人还会有个落脚处吗？', 2, 8, '认真安排接济旧交'] },
  qiji: { n: '戚姬', sur: '戚', name: '姬', born: 230, enter: 212, last: 185, loc: 'henan', state: '齐', role: 'dancer', robe: 'dancer', tr: ['多情', '好客', '野心'], st: [3, 6, 17, 9],
    coat: 'orangewhite', source: '史记·吕太后本纪、外戚世家', fact: '戚夫人是刘邦宠姬、赵王如意之母，卷入汉初的继承争端。',
    adapt: '生年不详。游戏设前212年十八岁，以女乐身份旅居河南；舞具和早年相遇为改编。后续婚恋由本局推进，不预定如意出生或她的结局。',
    topic: ['一曲之外', '戚姬放下拍板。她更愿意听人说这曲子哪里好，而不是一句空泛的夸赞。她想被认真听见。', 2, 9, '细谈曲子的节奏与心意'] },
  xufu: { n: '许负', sur: '许', name: '负', born: 229, enter: 211, last: 165, loc: 'henan', state: '魏', role: 'shi', robe: 'shi', tr: ['高冷', '多疑', '诚实'], st: [2, 10, 11, 17],
    coat: 'black', source: '史记·外戚世家；三国志注引汉魏春秋', fact: '许负在有关薄姬的记载中以相者出现，古注称其为河内温县妇人。她的相术故事也带有传说色彩。',
    adapt: '生年不取民间神异传说作定论。游戏设前211年十八岁，在河南一带游历；观察、谋略是能力设计，不保证预言成真。',
    topic: ['听言观行', '许负把竹简合上，说相貌之外还要看人怎样做事。她请来客从几桩小事里判断，一个许下重诺的人是否可信。', 3, 10, '逐条分析言行的破绽'] }
};
const WOMEN_COATS = {
  blackwhite: { S: ['S', 's'] }, silver: { A: ['A', 'a'], I: ['I', 'i'], eye: [.72, .72] },
  chocolate: { B: ['b', 'b'] }, calico: { O: ['O', 'o'], S: ['S', 's'] },
  cream: { O: ['O', 'O'], D: ['d', 'd'], A: ['A', 'a'], S: ['S', 's'] },
  bluewhite: { D: ['d', 'd'], S: ['S', 's'], eye: [.72, .72] },
  orangewhite: { O: ['O', 'O'], S: ['S', 's'] }, black: { eye: [.72, .72] }
};
function womenGenome(key) {
  return JSON.parse(JSON.stringify(Object.assign({ O: ['o', 'o'], B: ['B', 'B'], D: ['D', 'D'], A: ['a', 'a'], T: ['Tm', 'tb'], Sp: ['sp', 'sp'], S: ['s', 's'], W: ['w', 'w'], C: ['C', 'C'], I: ['i', 'i'], L: ['L', 'L'], eye: [.38, .38] }, WOMEN_COATS[key])));
}
function womenFreeToSeed(c) {
  return alive(c) && c.id !== W.player && !c.sp && !c.preg && !c.kids.length && !c.lov.length && !['li', 'in', 'ret'].includes(c.house) && !(c.rel[W.player] && c.rel[W.player].op > 0);
}
function womenSeedPartner(c, d) {
  const p = d.partner; if (!p || W.t < bornAt(p.from) || W.t >= bornAt(p.until) || !womenFreeToSeed(c)) return;
  let other = C(p.id);
  if (!other && p.id === 'liuji') other = a3Spawn('liuji', c.loc);
  if (!other && p.n) other = mkc({ id: p.id, disp: p.n, sur: p.sur, name: p.name, born: bornAt(p.born), hist: true, role: p.id === 'xiangyu' ? 'general' : 'noble', state: p.state, loc: c.loc, tr: ['野心', '勇猛'], st: [12, 8, 10, 10], immortal: true, dieT: bornAt(p.until) });
  if (!womenFreeToSeed(other)) return;
  // Only establish newly added background. Never call marry() to dissolve an existing union.
  c.sp = other.id; other.sp = c.id; c.flags.womenPastPartner = other.id;
  kinOnMarriage(c, other);
}
function womenSync(announce = false) {
  if (!W) return;
  for (const [id, d] of Object.entries(WOMEN_CAST)) {
    if (C(id) || W.t < bornAt(d.enter) || W.t >= bornAt(d.last)) continue;
    const loc = id === 'liyuanmei' && W.t >= bornAt(238) ? 'daliang' : d.loc;
    const c = mkc({ id, disp: d.n, sur: d.sur, name: d.name, female: true, born: bornAt(d.born), hist: true, loc, role: d.role, robe: d.robe, state: d.state, tr: d.tr.slice(), st: d.st.slice(), g: womenGenome(d.coat), flags: { womenCast: 1 } });
    womenSeedPartner(c, d);
    if (announce && !CATCHUP && !SAVE_SUSPENDED) logLine(d.n + '在' + CITY[cityOf(c)].n + '一带出现。可到「人·人物寻访」查看。', '#c8e0ff', true);
  }
}
function womenKin(c) { return kinPool().filter(f => alive(f) && ageOf(f) >= 16 && f !== c && inCity(f)); }
function womenVisitKey(c, f) { return 'wv_' + c.id + '_' + f.id; }
function womenVisitReady(c, f) { return alive(c) && ageOf(c) >= 18 && reach(c) && womenKin(c).includes(f) && !W.cool[womenVisitKey(c, f)]; }
function womenVisit(c, f) {
  const d = c && WOMEN_CAST[c.id]; if (!d || !womenVisitReady(c, f)) return;
  const [title, text, skill, dc, answer] = d.topic, pr = pct(stat(f, skill), dc), head = W.player;
  const ready = () => W.player === head && womenVisitReady(c, f) && W.ap >= 1;
  const finish = (gift) => {
    if (!ready() || gift && W.fish < 30 || !spendAp(1)) return;
    if (gift) addFish(-30);
    const ok = gift || chance(pr), gain = gift ? 10 : ok ? 12 : 3;
    addOp(c, f, gain, true); addOp(f, c, Math.ceil(gain / 2), true);
    W.cool[womenVisitKey(c, f)] = 4;
    const result = nm(f) + '与' + nm(c) + (gift ? '备礼相见' : ok ? '谈得投契' : '见了一面，还需多些了解') + '，对方好感+' + gain + '。';
    logLine(result, '#c8e0ff'); chronicle('choice', title, result);
    didAct('womenVisit', c, f === P() ? skill : -1, ok);
  };
  showEvent({ title, who: [c.id, f.id], text: text + '\n这次由' + nm(f) + '来拜访。结识不等于许婚，之后仍要看双方的心意。', opts: [
    opt(answer, '精力-1 · ' + STATN[skill] + '成' + R(pr * 100) + '% · 好感+12，未成+3', () => finish(false), ready),
    opt('备礼，先听她说', '精力-1 · 鱼干-30 · 对方对来客好感+10', () => finish(true), () => ready() && W.fish >= 30),
    opt('改日再来', '不花精力和鱼干', () => {})
  ], noChronicle: true }, 'women_visit');
}
function womenStatus(c) {
  if (!alive(c)) return '已故';
  const sp = C(c.sp);
  return alive(sp) ? '配偶：' + nm(sp) : c.sp ? '配偶不在身边' : canWed(c) ? '可结交、示好或提亲' : '可结交；婚配受身份限制';
}
function openWomenBio(id) {
  const d = WOMEN_CAST[id], c = C(id); if (!d) return;
  const rows = [{ t: d.fact, wrap: true }, { t: '依据：' + d.source, wrap: true }, { t: '游戏改编：' + d.adapt, wrap: true }];
  if (c) rows.push({ t: womenStatus(c), wrap: true }, { t: '查看' + d.n + ' ›', close: true, fn: () => openSheet(c.id) });
  openList(d.n + ' · 生平', rows);
}
function openWomenRoster() {
  const rows = [];
  for (const [id, d] of Object.entries(WOMEN_CAST)) {
    const c = C(id), city = c && cityOf(c);
    rows.push({ por: c || null, t: d.n + (alive(c) ? ' · ' + ageOf(c) + '岁' : c ? ' · 已故' : ''),
      s: c ? (city ? CITY[city].n + ' · ' : '') + womenStatus(c) : W.t < bornAt(d.enter) ? '前' + d.enter + '年出场 · ' + CITY[Object.keys(CITY).find(k => CITY[k].locs.includes(d.loc))].n : '本局未相遇，已过登场时期',
      close: true, fn: () => c ? openSheet(id) : openWomenBio(id) });
  }
  openList('人物寻访', rows, { sub: '为自己或家人结识 · 年龄与旅居详见生平' });
}
SYS.init.push(() => womenSync());
SYS.load.push(() => womenSync());
SYS.season.push(() => womenSync(true));
SYS.sheet.push((c, rows) => { if (WOMEN_CAST[c.id]) rows.push({ chip: '生平', col: '#8a5a10', text: WOMEN_CAST[c.id].topic[0] + ' · 查看生平 ›', fn: () => openWomenBio(c.id) }); });
SYS.acts.push((c, acts) => {
  if (!WOMEN_CAST[c.id] || !alive(c) || c === P() || !reach(c)) return;
  acts.push(mkAct({ id: 'womenVisit', n: '登门结识', ap: 1, grp: '友', hint: '自己或家人赴约 · 按各自好感结交',
    no: () => womenKin(c).some(f => womenVisitReady(c, f)) ? '' : '家人需成年同城，且四季内未拜访',
    fn: () => pickChar('让谁去结识' + nm(c) + '？', womenKin(c).filter(f => womenVisitReady(c, f)), f => womenVisit(c, f)) }));
});
SYS.tab.push((tab, acts) => { if (tab === 'people') acts.push(mkAct({ id: 'womenRoster', n: '寻访', ap: 0, hint: '各时期的女性名人 · 结识与提亲', fn: openWomenRoster })); });
