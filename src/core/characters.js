// ---------------------------------------------------------- characters
function mkc(o) {
  const id = o.id || ('c' + (W.nid++));
  const fixed = !!o.id;
  const r = fixed ? mulberry32(hashStr(id + '#g')) : Math.random;
  for (const k in o) if (o[k] === undefined) delete o[k];
  const c = Object.assign({ id, sur: '', name: '', female: false, born: -100, dead: null, mom: null, dad: null, bio: null, sp: null, lov: [], kids: [],
    rel: {}, role: 'commoner', robe: null, state: '赵', loc: 'market', house: null, tr: [], st: null, health: 75, stress: 0, disc: 0, hist: false, immortal: false, dieT: null, flags: {} }, o);
  c.seed = o.seed || (fixed ? hashStr(id + '#s') : (Math.random() * 4294967295) >>> 0);
  const base = randGenome(r, c.female ? 'F' : 'M');
  c.g = o.g ? Object.assign(base, o.g) : base;
  fixStoryDesign(c, ['zheng', 'chengjiao'].includes(id) ? id : c.flags.artIdentity);
  if (!c.st) c.st = [0, 0, 0, 0].map(() => 2 + Math.floor(r() * 7));
  if (!o.tr) c.tr = randPers(r, 3);
  if (!c.bio) c.bio = c.dad;
  W.chars[id] = c; return c;
}
const G_SOLID_BLACK = { O: ['o'], B: ['B', 'b'], D: ['D', 'd'], A: ['a', 'a'], S: ['s', 's'], W: ['w', 'w'], C: ['C', 'C'], I: ['i', 'i'], L: ['L', 'l'] };
function makeHistory() {
  // 秦 (off-stage in 咸阳 during act one)
  mkc({ id: 'zhao', disp: '秦昭王', sur: '嬴', name: '稷', born: bornAt(325), role: 'ruler', robe: 'qin', state: '秦', loc: 'xianyang', hist: true, immortal: true, tr: ['野心', '多疑', '勇猛'], st: [14, 12, 10, 14] });
  mkc({ id: 'anguo', disp: '安国君', sur: '嬴', name: '柱', born: bornAt(302), dad: 'zhao', role: 'noble', robe: 'qin', state: '秦', loc: 'xianyang', hist: true, immortal: true, tr: ['多情', '轻信', '慵懒'], st: [5, 7, 8, 4] });
  mkc({ id: 'huayang', disp: '华阳夫人', sur: '芈', name: '华阳', female: true, born: bornAt(292), role: 'noble', robe: 'chu', state: '秦', loc: 'xianyang', hist: true, immortal: true, flags: { barren: true }, tr: ['粘人', '嫉妒', '好客'], st: [2, 8, 14, 10],
    g: { O: ['O', 'o'], S: ['S', 'S'], A: ['a', 'a'], look: [[1, 1], [1, 0]] } });
  mkc({ id: 'xiaji', disp: '夏姬', sur: '夏', name: '姬', female: true, born: bornAt(300), role: 'noble', robe: 'qin', state: '秦', loc: 'xianyang', hist: true, immortal: true, tr: ['知足', '仁厚'], st: [2, 6, 7, 5],
    g: { O: ['o', 'o'], A: ['a', 'a'], S: ['s', 's'], B: ['B', 'b'], D: ['D', 'd'] } });
  mkc({ id: 'zixi', disp: '子傒', sur: '嬴', name: '傒', born: bornAt(284), dad: 'anguo', role: 'noble', robe: 'qin', state: '秦', loc: 'xianyang', hist: true, immortal: true, tr: ['野心', '高冷'], st: [8, 9, 7, 9] });
  C('anguo').sp = 'huayang'; C('huayang').sp = 'anguo';
  // the rival and the prize
  mkc({ id: 'lv', disp: '吕不韦', sur: '吕', name: '不韦', born: bornAt(292), role: 'merchant', robe: 'lv', state: '卫', loc: 'lvfu', hist: true, immortal: true, tr: ['野心', '狡诈', '好客'], st: [3, 15, 15, 17],
    g: { O: ['o'], B: ['B', 'B'], D: ['D', 'd'], A: ['A', 'a'], T: ['Tm', 'tb'], S: ['S', 's'], W: ['w', 'w'], C: ['C', 'C'], I: ['i', 'i'], L: ['L', 'L'] } });
  mkc({ id: 'yiren', disp: '异人', sur: '嬴', name: '异人', born: bornAt(281), dad: 'anguo', mom: 'xiaji', role: 'hostage', robe: 'qinPoor', state: '秦', loc: 'hostage', hist: true, immortal: true, tr: ['胆小', '粘人', '专一'], st: [4, 7, 9, 6], g: G_SOLID_BLACK });
  mkc({ id: 'zhaoji', disp: '赵姬', sur: '赵', name: '姬', female: true, born: bornAt(280), role: 'dancer', robe: 'dancer', state: '赵', loc: 'lvfu', hist: true, immortal: true, tr: ['多情', '粘人', '野心'], st: [2, 5, 12, 8],
    g: { O: ['o', 'o'], B: ['B', 'B'], D: ['d', 'd'], A: ['a', 'a'], S: ['s', 's'], W: ['w', 'w'], C: ['C', 'C'], I: ['i', 'i'], L: ['L', 'l'], look: [[1, 1], [1, 0]] } });
  C('zhaoji').lov.push('lv'); C('lv').lov.push('zhaoji');
  // 赵
  mkc({ id: 'zhaowang', disp: '赵孝成王', sur: '赵', name: '丹', born: bornAt(283), role: 'ruler', robe: 'zhaoKing', loc: 'palace', hist: true, immortal: true, tr: ['轻信', '野心'], st: [6, 7, 8, 5], g: { O: ['O'], A: ['A', 'a'] } });
  mkc({ id: 'pingyuan', disp: '平原君', sur: '赵', name: '胜', born: bornAt(308), role: 'noble', robe: 'zhao', loc: 'pingyuan', hist: true, immortal: true, tr: ['好客', '轻信', '野心'], st: [5, 10, 15, 8], g: { O: ['O'], S: ['S', 's'] } });
  mkc({ id: 'maosui', disp: '毛遂', sur: '毛', name: '遂', born: bornAt(300), role: 'shi', robe: 'shi', loc: 'pingyuan', hist: true, immortal: true, tr: ['勇猛', '诚实', '高冷'], st: [9, 6, 13, 9], g: { O: ['o'], A: ['a', 'a'], S: ['S', 's'], B: ['B', 'B'], D: ['D', 'D'] } });
  mkc({ id: 'lianpo', disp: '廉颇', sur: '廉', name: '颇', born: bornAt(327), role: 'general', robe: 'general', loc: 'palace', hist: true, immortal: true, tr: ['勇猛', '记仇', '诚实'], st: [18, 8, 6, 10], g: { A: ['A', 'A'], D: ['d', 'd'], O: ['o'] } });
  mkc({ id: 'zhaokuo', disp: '赵括', sur: '赵', name: '括', born: bornAt(290), role: 'noble', robe: 'zhao', loc: 'tavern', hist: true, immortal: true, tr: ['野心', '轻信', '好客'], st: [9, 6, 10, 5], g: { O: ['O'] } });
  mkc({ id: 'lzl', disp: '鲁仲连', sur: '鲁', name: '仲连', born: bornAt(305), role: 'shi', robe: 'shi', state: '齐', loc: 'tavern', hist: true, immortal: true, tr: ['高冷', '诚实', '知足'], st: [5, 8, 16, 12], g: { W: ['W', 'w'] } });
  mkc({ id: 'guozong', disp: '郭纵', sur: '郭', name: '纵', born: bornAt(305), role: 'merchant', robe: 'merchant', loc: 'market', hist: true, immortal: true, tr: ['勤快', '记仇', '狡诈'], st: [5, 16, 8, 11] });
  mkc({ id: 'xinling', disp: '信陵君', sur: '魏', name: '无忌', born: bornAt(300), role: 'noble', robe: 'wei', state: '魏', loc: 'daliang', hist: true, immortal: true, tr: ['仁厚', '好客', '勇猛'], st: [12, 10, 16, 11], g: { O: ['o'], A: ['a', 'a'], B: ['B', 'B'], D: ['D', 'D'], S: ['S', 's'] } });
  // the royal lines behind them (the dead show up greyed in family trees), per docs/history.md
  const anc = (o) => mkc(Object.assign({ hist: true, immortal: true, loc: 'xianyang', tr: ['野心'] }, o));
  anc({ id: 'qinhui', disp: '秦惠文王', sur: '嬴', name: '驷', born: bornAt(356), dead: bornAt(311), role: 'ruler', robe: 'qin', state: '秦' });
  anc({ id: 'xuan', disp: '宣太后', sur: '芈', name: '八子', female: true, born: bornAt(345), dead: bornAt(265), role: 'noble', robe: 'chu', state: '秦', tr: ['多情', '狠辣'] });
  anc({ id: 'daozi', disp: '悼太子', sur: '嬴', name: '悼', born: bornAt(305), dead: bornAt(267), dad: 'zhao', role: 'noble', robe: 'qin', state: '秦' });
  C('zhao').dad = 'qinhui'; C('zhao').mom = 'xuan'; C('qinhui').sp = 'xuan'; C('xuan').sp = 'qinhui';
  anc({ id: 'wuling', disp: '赵武灵王', sur: '赵', name: '雍', born: bornAt(340), dead: bornAt(295), role: 'ruler', robe: 'zhaoKing', state: '赵', loc: 'palace', tr: ['勇猛', '野心'] });
  anc({ id: 'huiwen', disp: '赵惠文王', sur: '赵', name: '何', born: bornAt(310), dead: bornAt(266), dad: 'wuling', role: 'ruler', robe: 'zhaoKing', state: '赵', loc: 'palace', tr: ['仁厚'] });
  anc({ id: 'weihou', disp: '赵威后', sur: '齐', name: '后', female: true, born: bornAt(300), dead: bornAt(265), role: 'noble', robe: 'zhao', state: '赵', loc: 'palace', tr: ['粘人', '多疑'] });
  C('huiwen').sp = 'weihou'; C('weihou').sp = 'huiwen';
  C('zhaowang').dad = 'huiwen'; C('zhaowang').mom = 'weihou';
  C('pingyuan').dad = 'wuling';
  mkc({ id: 'changanz', disp: '赵长安君', sur: '赵', name: '长安', born: bornAt(278), dad: 'huiwen', mom: 'weihou', role: 'noble', robe: 'zhao', loc: 'palace', hist: true, immortal: true, tr: ['慵懒', '粘人'], st: [4, 5, 7, 4] });
  anc({ id: 'zhaoshe', disp: '马服君', sur: '赵', name: '奢', born: bornAt(320), dead: bornAt(264), role: 'general', robe: 'general', state: '赵', loc: 'palace', tr: ['勇猛', '诚实'] });
  C('zhaokuo').dad = 'zhaoshe';
  anc({ id: 'weizhao', disp: '魏昭王', sur: '魏', name: '遬', born: bornAt(325), dead: bornAt(277), role: 'ruler', robe: 'wei', state: '魏', loc: 'daliang' });
  mkc({ id: 'anli', disp: '魏安釐王', sur: '魏', name: '圉', born: bornAt(305), dad: 'weizhao', role: 'ruler', robe: 'wei', state: '魏', loc: 'daliang', hist: true, immortal: true, tr: ['多疑', '胆小'], st: [5, 8, 8, 7] });
  C('xinling').dad = 'weizhao';
  mkc({ id: 'pyfuren', disp: '平原君夫人', sur: '魏', name: '姬', female: true, born: bornAt(302), dad: 'weizhao', role: 'noble', robe: 'wei', state: '魏', loc: 'pingyuan', hist: true, immortal: true, tr: ['仁厚', '粘人'], st: [2, 7, 10, 6] });
  C('pingyuan').sp = 'pyfuren'; C('pyfuren').sp = 'pingyuan';
  for (const id in HISTD) if (C(id)) C(id).dieT = HISTD[id];
}
function makeLiFamily() {
  const pa = mkc({ sur: '狸', name: '厚', born: bornAt(317), role: 'merchant', house: 'li', loc: 'home', tr: ['勤快', '节制', '诚实'], st: [4, 12, 8, 7], health: 40,
    g: { O: ['o'], A: ['A', 'a'], B: ['B', 'B'], S: ['S', 's'], D: ['D', 'd'] } });
  const ma = mkc({ sur: '田', name: '桑', female: true, born: bornAt(312), role: 'commoner', house: 'in', loc: 'home', tr: ['仁厚', '粘人'], st: [2, 8, 9, 6],
    g: { O: ['O', 'o'], A: ['A', 'a'], S: ['s', 's'], D: ['D', 'd'] } });
  pa.sp = ma.id; ma.sp = pa.id;
  const bias = [[['勇猛', '诚实'], 0], [['狡诈', '野心'], 3], [['好客', '粘人'], 2]];
  const sexes = ['M', 'F', 'M'], born = [bornAt(290), bornAt(287), bornAt(284)];
  const kids = [];
  for (let i = 0; i < 3; i++) {
    const g = breed(ma.g, pa.g, Math.random, sexes[i]);
    const k = mkc({ sur: '狸', name: '', female: sexes[i] === 'F', born: born[i], mom: ma.id, dad: pa.id, role: 'merchant', house: 'li', loc: 'home', g, tr: bias[i][0].slice(), flags: { artIdentity: 'li' + (i + 1) } });
    k.name = orderName(k);
    k.st[bias[i][1]] += 4;
    if (Math.random() < .5) { const x = pick(['贪吃', '勤快', '多情', '记仇', '夜猫子']); if (!k.tr.includes(x) && !k.tr.some(t => TR[t].op === x)) k.tr.push(x); }
    pa.kids.push(k.id); ma.kids.push(k.id); kids.push(k);
  }
  W.player = pa.id;
  W.flags.prologueKids = kids.map(k => k.id);
}
function makeLocals() {
  // a handful of single cats around town: future spouses, lovers and retainers
  const spots = ['market', 'market', 'tavern', 'tavern', 'pingyuan', 'market', 'tavern', 'lvfu'];
  spots.forEach((loc, i) => {
    const female = i % 2 === 0, sur = pick(SURS);
    const c = mkc({ sur, name: pick(female ? GIV_F : GIV_M), female, born: bornAt(292 - Math.floor(Math.random() * 12)), loc,
      role: loc === 'pingyuan' ? 'shi' : loc === 'tavern' && !female ? 'shi' : 'commoner', robe: loc === 'pingyuan' ? 'shi' : null });
    if (c.role === 'commoner' && chance(.4)) c.role = 'merchant';
  });
}
// parents set by id (historical figures) also need the child listed on their side, or trees can't walk down
function linkKids() {
  for (const c of Object.values(W.chars)) { if (!c.bio) c.bio = c.dad; }
  for (const c of Object.values(W.chars)) for (const pid of [c.dad, c.mom, c.bio]) { const pa = pid && C(pid); if (pa && !pa.kids.includes(c.id)) pa.kids.push(c.id); }
}
function newGame() {
  LOOKC.clear(); PORT.clear(); MINI.clear();
  resetScreen();
  W = { v: 2, t: 0, fish: 200, prest: 10, ap: 2, chars: {}, nid: 1, player: null, secrets: [], flags: {}, heir: 0, credit: { you: 0, lv: 0 }, loc: 'home',
    rank: 0, ret: [], queue: [], news: [], log: [], city: 'handan', lastEcon: null, act: 1, done: {}, cool: {} };
  makeHistory(); makeLiFamily(); makeLocals(); linkKids();
  W.queue.push({ ev: 'prologue' });
  runSys('init', W);
}
