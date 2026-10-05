// ============================================================ world state
let W = null;                                   // the whole game (saved as JSON)
// Systems plug in through these hooks, so each one can live in its own section (see "systems" further down)
// and the core loop doesn't need to know about them.
const SYS = {
  init: [],      // (W) new game: set up the system's W fields
  load: [],      // (W) after loading a save: fill in fields that older saves lack
  season: [],    // () once per season, after lifeTick and before scheduleEvents
  yearly: [],    // () once per year (spring), after the season hooks
  life: [],      // (c) once per season for every living cat, inside lifeTick
  did: [],       // (kind, target, statIdx, ok) after the player does something (see didAct)
  acts: [],      // (c, A) add / replace / remove actions on a character sheet (A is mutable)
  tab: [],       // (tab, A) add / replace / remove actions on one of the five tabs
  stat: [],      // (c, i) -> number added to stat(c, i)
  opinion: [],   // (a, b, add) extra opinion terms: add(label, n)
  econ: [],      // (inc, cost) push [label, n] into this season's income / cost lists
  status: [],    // (c, out) CK-style status chips { n, col, d }
  sheet: [],     // (c, rows) extra info rows on a character sheet { chip, col, text, fn }
  goal: [],      // () -> { s, tab, pri } candidates for the objective line (lowest pri wins)
  widget: [],    // () -> true if it drew the top-right widget (the first one that draws wins)
  card: [],      // (p) draw extras on the player card (see the layout slots in drawCity)
  scene: [],     // (tab) draw extras over the scene backdrop of a tab
  sched: [],     // () after the historical calendar in scheduleEvents
  rows: [],      // (y) -> height drawn: rows under the top-right widget (intrigue's schemes), from y down; notices go below them
  modal: {},     // type -> draw(m): new kinds of modal windows. m.hold: a story-like window (a duel, a scheme card) — the
                 // event queue and the notices wait until it closes; m.upd(dt) animates it; m.scroll: it scrolls
};
const runSys = (k, ...a) => { for (const f of SYS[k]) f(...a); };
// Every player action reports here once its effect happened: kind is a short verb ('trade', 'gift', 'spy' ...),
// target the cat it was done to (or null), st the stat it used (0 武 1 政 2 交 3 谋, -1 none), ok whether it worked.
function didAct(kind, target, st, ok) { runSys('did', kind, target || null, st === undefined ? -1 : st, ok !== false); }
const SEASON = ['春', '夏', '秋', '冬'];
const yearOf = t => 262 - Math.floor(t / 4);
// (free mode never ends: after 前1年 comes 公元1年, there was no year 0)
const yearTxt = t => { const y = yearOf(t); return y > 0 ? '前' + y + '年' : '公元' + (1 - y) + '年'; };
const bornAt = yearBC => (262 - yearBC) * 4;
const ageOf = c => Math.floor(((c.dead !== null ? c.dead : W.t) - c.born) / 4);
const C = id => W.chars[id];
const P = () => W.chars[W.player];
const alive = c => c && c.dead === null;
const nm = c => c ? (c.disp || (c.sur + c.name)) : '？';
const ta = c => c.female ? '她' : '他';
const RANKS = ['商贾', '舍人', '客卿', '相邦', '仲父', '秦王', '皇帝'];
const STATN = ['武', '政', '交', '谋'];

// ---------------------------------------------------------- cities
// Every place (c.loc) belongs to one city; 'home' is wherever the household lives now (W.city), 'away' is nowhere you can go.
// Story acts add places and people to 咸阳/大梁 by pushing into locs.
const firstAlive = ids => { for (const id of ids) { const c = C(id); if (alive(c)) return c; } return null; };
const CITY = {
  // after 秦 takes 邯郸 (前228) the city answers to the king in 咸阳
  handan: { n: '邯郸', court: '赵王宫', mkt: '邯郸市集', gate: '邯郸城门', ruler: () => firstAlive(['zhaowang', 'daoxiang', 'zhaoqian']) || (W.t >= HISTD.zhaoqian ? CITY.xianyang.ruler() : null),
    locs: ['market', 'hostage', 'lvfu', 'tavern', 'pingyuan', 'palace', 'gate'] },
  xianyang: { n: '咸阳', court: '咸阳宫', mkt: '咸阳市', gate: '咸阳城门', ruler: () => firstAlive(['zhao', 'anguo', 'yiren', 'zheng', 'huhai', 'ziying']), locs: ['xianyang'] },
  daliang: { n: '大梁', court: '魏王宫', mkt: '大梁市', gate: '大梁城门', ruler: () => firstAlive(['anli']), locs: ['daliang'] },
};
function cityOf(c) {
  if (!c || c.loc === 'away') return null;
  if (c.loc === 'home') return W.city;
  for (const k in CITY) if (CITY[k].locs.includes(c.loc)) return k;
  return null;
}
const inCity = c => alive(c) && cityOf(c) === W.city;
const sameCity = (a, b) => !!cityOf(a) && cityOf(a) === cityOf(b);
// can you walk over and see them? (a few things, like ending an affair by letter, work from afar: those actions carry `remote`)
const reach = c => inCity(c);
// the household moves; everyone at 'home' comes along
function moveCity(city) { if (!CITY[city]) return; W.city = city; try { SCN.clear(); } catch (e) {} }

// ---------------------------------------------------------- the historical calendar of deaths (turn; t=0 is 前262春)
// A hist cat stays `immortal` (protected) until its dieT; story acts can take a death over by setting c.dieT = null.
// (政 dies in the seventh month of 前210; 子婴 is killed after the 秦亡 card of 前206 has told his surrender)
const HISTD = { zhao: 46, pingyuan: 45, anguo: 50, yiren: 61, zhaowang: 68, xinling: 76, anli: 76, lianpo: 80, xiaji: 88, lv: 108, huayang: 128, zhaoji: 136, zheng: 210, daoxiang: 106, zhaoqian: 136,
  huhai: 222, ziying: 225 };
const histDue = c => c.dieT !== null && c.dieT !== undefined && W.t >= c.dieT;
// the ones whose date is the day they leave the story, not a death in bed: their HIST_NEXT line says what happened, no 讣告
const HIST_GONE = new Set(['zhaoqian']);
const STATC = ['#c0503a', '#c89a3a', '#4a8ac0', '#7a5aa8'];

// traits: s = stat mods [武,政,交,谋], op = opposite (clash in opinion), k = kind
const TR = {
  '勇猛': { s: [3, 0, 0, 0], op: '胆小' }, '胆小': { s: [-2, 0, 0, 1], op: '勇猛' },
  '仁厚': { s: [0, 0, 2, -1], op: '狠辣' }, '狠辣': { s: [1, 0, -1, 2], op: '仁厚' },
  '贪吃': { s: [0, -1, 0, 0], op: '节制' }, '节制': { s: [0, 1, 0, 0], op: '贪吃' },
  '粘人': { s: [0, 0, 2, 0], op: '高冷' }, '高冷': { s: [0, 0, -2, 1], op: '粘人' },
  '多疑': { s: [0, 0, -1, 2], op: '轻信' }, '轻信': { s: [0, 0, 1, -2], op: '多疑' },
  '野心': { s: [1, 1, 1, 1], op: '知足' }, '知足': { s: [0, 0, 0, 0], op: '野心' },
  '多情': { s: [0, 0, 1, 0], op: '专一' }, '专一': { s: [0, 0, 0, 0], op: '多情' },
  '诚实': { s: [0, 0, 1, -2], op: '狡诈' }, '狡诈': { s: [0, 0, 0, 3], op: '诚实' },
  '勤快': { s: [0, 2, 0, 0], op: '慵懒' }, '慵懒': { s: [0, -2, 0, 0], op: '勤快' },
  '好客': { s: [0, 0, 2, 0] }, '记仇': { s: [0, 0, -1, 1] }, '嫉妒': { s: [0, 0, -1, 1] },
  '夜猫子': { s: [0, 0, 0, 1], k: 'cat' }, '怕水': { s: [0, 0, 0, 0], k: 'cat' },
  '兵家': { s: [2, 0, 0, 0], k: 'edu' }, '法家': { s: [0, 2, 0, 0], k: 'edu' }, '纵横家': { s: [0, 0, 2, 0], k: 'edu' }, '鬼谷门生': { s: [0, 0, 0, 2], k: 'edu' },
};
const PERS = ['勇猛', '胆小', '仁厚', '狠辣', '贪吃', '节制', '粘人', '高冷', '多疑', '轻信', '野心', '知足', '多情', '专一', '诚实', '狡诈', '勤快', '慵懒', '好客', '记仇', '嫉妒'];
const EDU = ['兵家', '法家', '纵横家', '鬼谷门生'];
const CONG = {
  wit: [['愚钝', -3], ['迟钝', -1], null, ['机灵', 1], ['聪慧', 2], ['天才', 4]],
  body: [['孱弱', -3], ['体弱', -1], null, ['结实', 1], ['健壮', 2], ['虎背熊腰', 3]],
  look: [['丑怪', -2], ['其貌不扬', -1], null, ['清秀', 1], ['美貌', 2], ['倾城', 3]],
};
const congIdx = s => s <= -3 ? 0 : s === -2 ? 1 : s >= 4 ? 5 : s === 3 ? 4 : s === 2 ? 3 : 2;
// a genome never changes once a cat exists, so what it gives is worked out once (opinion() asks for it all the time)
const CONGC = new WeakMap();
function congenital(c) {
  let out = CONGC.get(c.g); if (out) return out;
  const p = phenotype(c.g); out = [];
  for (const k of ['wit', 'body', 'look']) { const e = CONG[k][congIdx(p[k])]; if (e) out.push({ n: e[0], k, v: e[1] }); }
  if (p.sickly) out.push({ n: '先天不足', k: 'body', v: -2 });
  CONGC.set(c.g, out); return out;
}
function traitsOf(c) { return c.tr.concat(congenital(c).map(t => t.n)); }
function randPers(r, n, avoid) {
  const out = [], pool = PERS.slice();
  while (out.length < n && pool.length) {
    const t = pool.splice(Math.floor(r() * pool.length), 1)[0];
    if (out.some(o => TR[o].op === t || TR[t].op === o) || (avoid && avoid.includes(t))) continue;
    out.push(t);
  }
  if (r() < .12) out.push(r() < .6 ? '夜猫子' : '怕水');
  return out;
}
function stat(c, i) {
  let v = c.st[i];
  if (i === 0 && c.preg) v -= 3;
  if (i === 0 && c.flags && c.flags.postpartum > W.t) v -= 2;
  for (const t of c.tr) if (TR[t]) v += TR[t].s[i] * (TR[t].k === 'edu' ? (c.eduLv || 1) : 1);
  for (const t of congenital(c)) { if (t.k === 'wit') v += t.v; if (t.k === 'body' && i === 0) v += t.v; if (t.k === 'look' && i === 2) v += t.v; }
  if (ageOf(c) < 16) v = Math.round(v * clamp(ageOf(c) / 16, .2, 1));
  // (retainers no longer lend the head a hidden stat bonus: they work through the 门下 seats, see SYS:intrigue)
  for (const f of SYS.stat) v += f(c, i) || 0;
  return clamp(v, 0, 30);
}
