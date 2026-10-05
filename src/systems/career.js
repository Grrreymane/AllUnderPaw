// ==== SYS:career ==== 功名 · 家业
// 太阁's half of the game. A patron hands out errands (差事) that you finish with the actions you already have; errands,
// advice and service earn 功 (merit); merit, fame and a patron's favour open the next rank, and a rank pays a salary.
// Money has somewhere to go: 置产 (estates that pay every season), 名物 (treasures: fame, a sharper skill, the best
// gifts) and 大计 (decisions: a feast, a family register, a house motto, asking for office).
// For other systems (call with a typeof guard): addMerit(n, why), prestTier() → { i, n, op }, hasItem(id), gainItem(id, why),
// laterItem(id, seasons, why), estateIncome(); state W.merit, W.patron, W.job, W.items, W.estates. ACT2/3 push into JOBS
// (errands), PROMO (ranks: { to, ev, ok(), need() }) and DECISIONS (大计 rows).

// ---------------------------------------------------------- merit, rank, fame
const SALARY = [0, 6, 20, 40, 60, 100, 150];
// the merit a rank stands on (a missed errand never takes you below it); the next rank's need fills the card's bar
const RANK_NEED = [0, 0, 60, 150, 300, 500, 800];
function addMerit(n, why, quiet) {
  n = R(n || 0); if (!n || !W) return;
  const m = W.merit || 0;
  W.merit = n > 0 ? m + n : Math.max(Math.min(m, RANK_NEED[W.rank] || 0), m + n);
  if (!quiet) toast('功 ' + (n > 0 ? '+' : '') + n + (why ? ' · ' + why : ''), n > 0 ? '#ffd24a' : '#ff9a8a');
}
// fame in tiers, as in CK3: what everyone thinks of you (opinion) and how readily a family says yes (proposeChance)
const PTIER = [[0, '无名', 0, '#a89888'], [50, '有名', 5, '#9dbbd6'], [150, '名士', 10, '#9fe89a'], [300, '望族', 15, '#f0cc5c'], [500, '名动天下', 20, '#ffa07a']];
function prestTier(v) {
  if (v === undefined) v = W ? W.prest : 0;
  let i = 0; while (i + 1 < PTIER.length && v >= PTIER[i + 1][0]) i++;
  return { i, n: PTIER[i][1], op: PTIER[i][2], col: PTIER[i][3], next: i + 1 < PTIER.length ? PTIER[i + 1][0] : null };
}
const jv = (v, ...a) => typeof v === 'function' ? v(...a) : v;
// what a fame tier adds to a marriage offer, all told: its own term and the goodwill it brings (proposeChance adds opinion/100)
const tierWed = pt => pt.op + pt.i * 5;
// a list row's subtitle stops short of the button on its right
const cutS = s => fitT(s, 90, 5.5, 1);

// ---------------------------------------------------------- patron
// Who you serve: 异人 makes you his 舍人 (and writes from 咸阳 after act one); in 邯郸 平原君 takes on anyone he thinks
// well of; a 客卿 answers to the court; failing all of them, whichever lord in town likes you best (30+).
// The story acts set the king (W.patron = id).
const patron = () => { const c = W.patron && C(W.patron); return alive(c) ? c : null; };
const lordly = c => ['noble', 'minister', 'ruler'].includes(c.role);
// the lord in town (not the king) who thinks best of you, and what he thinks: [cat, opinion] or null. The door for a
// merchant without a rank (舍人) and for a 舍人 without a patron is a lord at 30+.
const LORD_OP = 30;
function bestLord() {
  const p = P(); let best = null, bv = -999;
  for (const c of Object.values(W.chars)) {
    if (!inCity(c) || !lordly(c) || c.role === 'ruler' || c.loc === 'home' || c.house === 'li' || c.house === 'in' || ageOf(c) < 16) continue;
    const v = opinion(c, p); if (v > bv) { bv = v; best = c; }
  }
  return best ? [best, bv] : null;
}
// a patron you have turned against you (or who never forgave the 告密) stops handing you errands
// (the 告密 is forgiven once you brought his wife and son home: the 护子之功 memo)
function patronLost(c) {
  const p = P(), o = opinion(c, p);
  if (c.id === 'yiren' && ((W.flags.betray && !memoOf(c, p, '护子之功')) || (c.rel[p.id] && c.rel[p.id].tag === 'rival') || (W.flags.act1Done && o < 0))) return true;
  return o < -20;
}
// a patron lost at −20 takes you back only once goodwill is back to 0 (no flicker on the edge), and says so
const patronBack = c => !patronLost(c) && opinion(c, P()) >= 0;
function updPatron() {
  // (a king serves nobody)
  if (W.kingId && W.kingId === W.player) { W.patron = null; return; }
  const pa = W.patron && C(W.patron);
  if (W.patron && (!alive(pa) || patronLost(pa))) {
    if (W.job && W.job.from === W.patron) endJob(false, alive(pa) ? nm(pa) + '不再找你' : '人不在了');
    if (alive(pa)) { logLine(nm(pa) + (inCity(pa) ? '不再照拂你' : '不再给你来信'), '#ff9a8a'); W.flags.lostPa = pa.id; }
    W.patron = null;
  }
  if (W.patron || W.rank < 1) return;
  const yr = C('yiren'), py = C('pingyuan'), k = cityRuler(), p = P(), was = W.flags.lostPa;
  if (W.rank < 2 && alive(yr) && !patronLost(yr) && (!W.flags.act1Done || opinion(yr, p) >= 20)) W.patron = 'yiren';
  else if (inCity(py) && opinion(py, p) >= 20) W.patron = 'pingyuan';
  else if (W.rank >= 2 && alive(k) && k !== p && patronBack(k)) W.patron = k.id;
  else if (W.rank < 2) { const b = bestLord(); if (b && b[1] >= LORD_OP) { W.patron = b[0].id; if (b[0].id !== was) logLine(nm(b[0]) + '把你收在了门下', '#c8e0ff'); } }
  if (W.patron && W.patron === was) { logLine(nm(C(was)) + '又肯见你了', '#9fe89a'); delete W.flags.lostPa; }
}

// ---------------------------------------------------------- 差事 (errands)
// A job: patron (who gives it; '*' = whoever offers), title (two characters for the row), task (what to do), tab (where
// you do it), due (seasons) or dueT (a fixed turn), goal { kind: didAct kind(s), target: ids | 'giver' | j => ids,
// n: times, any: failed tries count too }, check(j) → true | 'fail' for errands that are a state (备金), acts(c, j) /
// tabs(tab, j): the extra (gold) buttons it brings, reward { merit fish prest heir op fn }, ok(giver), pre(queued offer,
// giver): pick a target (q.tgt), init(j): note the state when taken on, letter: comes by post (the giver may be in
// another city), once: never offered again, line: what the giver says. ACT2 pushes court errands into JOBS.
// W.job = { id, from (the giver's id), tgt, t0, due (turn), n (times done) }.
const yrHostage = () => { const y = C('yiren'); return inCity(y) && y.loc === 'hostage' && !W.flags.escapeLead; };
const afterAdopt = () => !!(W.flags.zichu || W.heir >= 100 || W.flags.siege);
const zhengHome = () => { const z = C('zheng'); return z ? [z, C(z.mom)].filter(x => inCity(x) && x.id !== W.player && x.loc !== 'home').map(x => x.id) : []; };
// someone of note in town the giver wants you to befriend (not the one you were sent to last time, if there is anyone else)
function friendTarget(gv) {
  const p = P(), gid = gv ? gv.id : null, L = [];
  for (const c of Object.values(W.chars)) if (inCity(c) && c.loc !== 'home' && c.id !== W.player && ageOf(c) >= 16 && c.id !== gid && c.id !== W.patron && c.house !== 'li' && c.house !== 'in' &&
    !W.ret.includes(c.id) && (c.hist || ['noble', 'minister', 'general', 'ruler'].includes(c.role)) && c.role !== 'hostage' && opinion(c, p) < 40) L.push(c);
  const L2 = L.filter(c => c.id !== W.flags.lastTgt);
  return L2.length ? pick(L2) : L.length ? pick(L) : null;
}
// a 士 in town to argue with (論辩)
const shiHere = () => Object.values(W.chars).some(c => inCity(c) && c.role === 'shi' && c.loc !== 'home' && ageOf(c) >= 16 && !W.ret.includes(c.id));
const whenT = t => yearTxt(t) + SEASON[t % 4];
// a gold button to hand fish over for an errand
const payAct = (c, n, t) => mkAct({ id: 'job_pay', kind: 'jobpay', n: '送去 ' + n + ' 鱼干', ap: 0, fish: n, gold: true, hint: '差事 · ' + t,
  no: () => W.fish < n ? '鱼干不够 ' + n : '', fn: () => { if (W.fish < n) return; addFish(-n); if (reach(c)) react(c, 'gift', true); didAct('jobpay', c, -1, true); } });
const JOBS = [
  // 异人, while he is a hostage in 邯郸
  { id: 'ditie', patron: 'yiren', title: '递帖', task: '拜会平原君', tab: 'people', due: 2, once: 1, goal: { kind: ['talk', 'pay'], target: ['pingyuan'] },
    reward: { merit: 6, op: { pingyuan: 5 } }, ok: () => yrHostage() && inCity(C('pingyuan')),
    line: '「平原君门下客多，我一个质子进不去。你替我去递个帖子。」' },
  { id: 'duanchui', patron: 'yiren', title: '断炊', task: '给异人送 40 鱼干', tab: 'home', pay: 40, due: 2, goal: { kind: 'jobpay', target: 'giver' },
    reward: { merit: 5, op: { yiren: 8 } }, ok: () => yrHostage() && !W.queue.some(q => q.ev === 'rand' && q.id === 'yirenpoor'), acts: (c, j) => c.id === j.from ? [payAct(c, 40, '断炊')] : [],
    line: '「府里又断炊了。先借我四十条鱼干，秦国的钱一到就还你。」' },
  { id: 'chuyu', patron: 'yiren', title: '楚语', task: '教异人楚语', tab: 'people', due: 3, once: 1, goal: { kind: 'chuyu', target: 'giver' }, odds: () => chkHint(2, 9),
    reward: { merit: 6, heir: 5 }, ok: () => yrHostage() && W.flags.knowHuayang && W.heir < 90,
    acts: (c, j) => c.id === j.from ? [mkAct({ id: 'job_chuyu', kind: 'chuyu', n: '教楚语', ap: 1, gold: true, hint: chkHint(2, 9) + ' · 差事',
      fn: () => { if (!spendAp(1)) return; const ok = chk(2, 9); if (!ok) toast('没教会，下回再试', '#dddddd'); react(c, 'teach', ok, ok ? '楚语' : ''); didAct('chuyu', c, 2, ok); } })] : [],
    line: '「华阳夫人是楚人。你走南闯北，会几句楚语吧？教教我。」' },
  // (only asked of someone with a fair chance: a failed 刺探 costs 吕's goodwill, and the errand is lost if it never works)
  { id: 'tanlv', patron: 'yiren', title: '探吕', task: '刺探吕不韦', tab: 'people', due: 3, once: 1, goal: { kind: 'spy', target: ['lv'] }, odds: () => chkHint(3, 11),
    reward: { merit: 8, op: { yiren: 3 } }, ok: () => yrHostage() && inCity(C('lv')) && pct(stat(P(), 3), 11) >= .25,
    line: '「吕公待我很好。可他到底图什么？你替我探一探。」' },
  { id: 'jiashu', patron: 'yiren', title: '家书', task: '替异人捎家书', tab: 'travel', due: 3, once: 1, goal: { kind: 'letter' },
    reward: { merit: 6, heir: 3, op: { xiaji: 10 } }, ok: () => yrHostage() && alive(C('xiaji')),
    tabs: tab => tab === 'travel' ? [mkAct({ id: 'job_letter', kind: 'letter', n: '替异人捎家书', ap: 1, fish: 30, gold: true, hint: '差事 · 夏姬好感+10',
      no: () => W.fish < 30 ? '鱼干不够 30' : '', fn: () => { if (W.fish < 30 || !spendAp(1)) return; addFish(-30); didAct('letter', C('xiaji'), 2, true); } })] : [],
    line: '「我娘在咸阳，好几年没有音信了。替我捎封信去。」' },
  // after the adoption, through the long wait for the escape
  { id: 'huyuan', patron: 'yiren', title: '护院', task: '招一名门客', tab: 'people', due: 3, once: 1, goal: { kind: 'hire' },
    reward: { merit: 8, op: { yiren: 5 } }, ok: () => yrHostage() && afterAdopt() && W.ret.length < RET_MAX,
    init: j => { j.base = W.ret.slice(); }, check: j => W.ret.some(id => !(j.base || []).includes(id)),
    line: '「城里对秦人越来越凶。你家里多几个能打的，我也安心些。」' },
  { id: 'tangong', patron: 'yiren', title: '探宫', task: '打听宫里的动静', tab: 'people', due: 3, once: 1, goal: { kind: 'ask', any: 1 },
    reward: { merit: 6, fn: () => logLine(W.t < 14 ? '打听到：秦军' + whenT(14) + '要围邯郸' : '打听到：赵王要在' + whenT(21) + '杀质子', '#ffe08a') },
    ok: () => yrHostage() && afterAdopt() && W.t < 20,
    line: '「宫里要是有什么动静，我得先知道。」' },
  { id: 'beijin', patron: 'yiren', title: '备金', task: '备出城的金子', tab: 'market', dueT: 22, once: 1, prog: () => Math.min(W.fish, 300) + '/300',
    reward: { merit: 12 }, ok: () => yrHostage() && afterAdopt() && W.t <= 19,
    check: () => W.flags.escapeLead ? (W.flags.escapeLead === 'you' ? true : 'fail') : W.t >= 22 ? 'fail' : false,
    line: '「赵王迟早要拿我开刀。到时候城门得用金子开，你先备着。」' },
  // 平原君 (your patron, or once he thinks well of you)
  { id: 'jianshi', patron: 'pingyuan', title: '荐士', task: '向平原君荐一名门客', tab: 'people', due: 4, goal: { kind: 'recommend', target: 'giver' },
    reward: { merit: 10, prest: 5 }, ok: () => W.ret.some(id => alive(C(id))),
    acts: (c, j) => c.id === j.from ? [mkAct({ id: 'job_jianshi', kind: 'recommend', n: '荐门客', ap: 1, gold: true, hint: '差事 · 门客归平原君门下',
      no: () => W.ret.some(id => alive(C(id))) ? '' : '你没有门客', fn: () => pickChar('荐谁给平原君？ ◆1', W.ret.map(C).filter(alive), r => {
        if (!spendAp(1)) return;
        W.ret = W.ret.filter(x => x !== r.id); r.loc = 'pingyuan'; if (r.house === 'ret') r.house = null; addOp(r, P(), 5, true);
        logLine(nm(r) + '去了平原君门下', '#c8e0ff'); didAct('recommend', c, 2, true); }) })] : [],
    line: '「我门下三千客，还缺能办事的。你那里要是有人才，荐一个给我。」' },
  { id: 'junliang', patron: 'pingyuan', title: '军粮', task: '给平原君送 100 鱼干', tab: 'home', pay: 100, due: 3, goal: { kind: 'jobpay', target: 'giver' },
    reward: { merit: 8, prest: 10 }, ok: () => W.t >= 4 && W.t <= 44, acts: (c, j) => c.id === j.from ? [payAct(c, 100, '军粮')] : [],
    line: '「前线又缺粮了。城里的商户都在凑，你家也出一份。」' },
  { id: 'qinglu', patron: 'pingyuan', title: '请鲁', task: '去请鲁仲连', tab: 'people', due: 3, once: 1, goal: { kind: 'talk', target: ['lzl'] },
    reward: { merit: 6, op: { lzl: 5 } }, ok: () => inCity(C('lzl')),
    line: '「鲁仲连不肯登我的门。你们常在酒肆碰面，替我请他过府一叙。」' },
  // 子楚's letters from 咸阳 (after act one)
  { id: 'zhaokan', patron: 'yiren', title: '照看', task: '去看看政母子', tab: 'people', due: 3, letter: 1, goal: { kind: ['talk', 'gift'], target: () => zhengHome() },
    reward: { merit: 8, op: { yiren: 5 } }, ok: () => !!W.flags.act1Done && zhengHome().length > 0,
    line: () => nm(C('yiren')) + '来信：「夫人和孩子留在邯郸，我放心不下。替我去看看他们。」' },
  { id: 'kaimeng', patron: 'yiren', title: '开蒙', task: '给政开蒙', tab: 'people', due: 4, once: 1, letter: 1, goal: { kind: 'kaimeng', target: ['zheng'] },
    reward: { merit: 10, op: { yiren: 5 } }, ok: () => { const z = C('zheng'); return !!W.flags.act1Done && inCity(z) && z.loc !== 'home' && ageOf(z) >= 5 && ageOf(z) < 13; },
    acts: c => c.id === 'zheng' ? [mkAct({ id: 'job_kaimeng', kind: 'kaimeng', n: '给政开蒙', ap: 1, gold: true, hint: '差事 · 政好感+10',
      fn: () => { if (!spendAp(1)) return; c.edu = c.edu || [0, 0, 0, 0]; c.edu[1] += 2; addOp(c, P(), 10); react(c, 'teach', true, '认字'); didAct('kaimeng', c, 1, true); } })] : [],
    line: () => nm(C('yiren')) + '来信：「政该认字了。邯郸没有好先生，你替我给他开个蒙。」' },
  { id: 'songjin', patron: 'yiren', title: '送金', task: () => '给' + nm(C('yiren')) + '送 150 鱼干', tab: 'travel', due: 4, letter: 1, goal: { kind: 'sendgold' },
    reward: { merit: 12, op: { yiren: 8 } }, ok: () => !!W.flags.act1Done && alive(C('yiren')) && !inCity(C('yiren')),
    tabs: tab => tab === 'travel' ? [mkAct({ id: 'job_gold', kind: 'sendgold', n: '托人送金', ap: 1, fish: 150, gold: true, hint: '差事 · 送去' + (CITY[cityOf(C('yiren'))] || CITY.xianyang).n,
      no: () => W.fish < 150 ? '鱼干不够 150' : '', fn: () => { if (W.fish < 150 || !spendAp(1)) return; addFish(-150); didAct('sendgold', C('yiren'), -1, true); } })] : [],
    line: () => nm(C('yiren')) + '来信：「咸阳处处要打点。你那里方便的话，送些钱来。」' },
  // from whoever gives you errands, in town (w: how often, against the others; a king and a lord don't talk alike: line(j, giver))
  { id: 'jiehao', patron: '*', title: '结好', task: j => '与' + nm(C(j.tgt)) + '走动两回', tab: 'people', due: 4, w: .3, goal: { kind: ['talk', 'gift', 'pay'], target: j => [j.tgt], n: 2 },
    reward: { merit: 6 }, ok: gv => !!friendTarget(gv), pre: (q, gv) => { const c = friendTarget(gv); q.tgt = c ? c.id : null; },
    line: (j, gv) => gv && gv.role === 'ruler' ? '「' + nm(C(j.tgt)) + '近来对' + Ime(gv) + '有些怨言。你去走动走动，替' + Ime(gv) + '听听。」' : '「' + nm(C(j.tgt)) + '这个人，往后用得着。你替我多走动走动。」' },
  { id: 'maimai', patron: '*', title: '生意', task: '跑一趟远途商队', tab: 'travel', due: 3, w: .3, goal: { kind: 'caravan' },
    reward: { merit: 5, fish: 30 }, ok: () => !siegeOn(),
    line: (j, gv) => gv && gv.role === 'ruler' ? '「' + Ime(gv) + '想知道外头的粮价和路上的情形。你的商队走一趟，回来说给' + Ime(gv) + '听。」' : '「府里开销紧。你的商队走一趟，赚的分你一份。」' },
  { id: 'shoushi', patron: '*', title: '收士', task: '招一名门客', tab: 'people', due: 4,
    reward: { merit: 6, prest: 3 }, ok: () => W.ret.length < RET_MAX, init: j => { j.base = W.ret.slice(); }, check: j => W.ret.some(id => !(j.base || []).includes(id)),
    line: (j, gv) => gv && gv.role === 'ruler' ? '「一家人撑不起一份家业。多养几个能办事的人，将来' + Ime(gv) + '也用得着。」' : '「你家里人手太少，出了事没人可用。去招个门客。」' },
  { id: 'tanting', patron: '*', title: '打听', task: '在城里打听一回', tab: 'people', due: 3, goal: { kind: 'ask', any: 1 },
    reward: { merit: 5 }, ok: () => true,
    line: (j, gv) => gv && gv.role === 'ruler' ? '「市井里在说' + Ime(gv) + '什么？你去听听，照实说。」' : '「城里近来在传什么，你替我听听。」' },
  { id: 'songli', patron: '*', title: '送礼', task: j => '给' + nm(C(j.tgt)) + '送一份礼', tab: 'people', due: 4, goal: { kind: 'gift', target: j => [j.tgt] },
    reward: { merit: 6, fish: 30 }, ok: gv => !!friendTarget(gv), pre: (q, gv) => { const c = friendTarget(gv); q.tgt = c ? c.id : null; },
    line: (j, gv) => gv && gv.role === 'ruler' ? '「替' + Ime(gv) + '给' + nm(C(j.tgt)) + '送份礼。东西你挑，不会亏了你。」' : '「替我给' + nm(C(j.tgt)) + '送份礼。东西你挑，钱我回头给你。」' },
  { id: 'lunbian', patron: '*', title: '论辩', task: '与城里的士论辩一场', tab: 'people', due: 4, goal: { kind: 'debate' },
    reward: { merit: 6, prest: 3 }, ok: () => shiHere(),
    line: (j, gv) => gv && gv.role === 'ruler' ? '「酒肆里那些士，说赵国无人。你去跟他们辩一辩。」' : '「城里来了几个能说会道的士。你去会会，别丢了我的脸。」' },
  { id: 'dayan', patron: '*', title: '大宴', task: '在家里办一场大宴', tab: 'court', due: 6, goal: { kind: 'feast' },
    reward: { merit: 8 }, ok: gv => !!gv && lordly(gv) && gv.role !== 'ruler' && W.fish >= feastCost() && !W.cool.feast,
    line: '「你家也该请请客了。城里的人，要常见面才记得你。」' },
];
const jobDef = id => JOBS.find(d => d.id === id) || null;
const jobWho = j => { const d = jobDef(j.id), w = d && d.goal && d.goal.target; return !w ? null : w === 'giver' ? [j.from] : jv(w, j); };
const jobG = j => jv(jobDef(j.id).task, j);
const jobLeft = j => Math.max(0, j.due - W.t);
const jobWhen = j => jobDef(j.id).dueT ? '出城前' : '余' + jobLeft(j) + '季';
// how far along: the errand's own count (备金 300), or n/N for the ones done in several goes
const jobProg = j => { const d = jobDef(j.id); return d.prog ? d.prog(j) : d.goal && d.goal.n > 1 ? (j.n || 0) + '/' + d.goal.n : ''; };
const jobLine = (d, j) => jv(d.line, j, C(j.from));
function rewTxt(d) {
  const r = d.reward || {}, out = [];
  if (r.merit) out.push('功+' + r.merit);
  if (r.heir && !W.flags.zichu) out.push('立嗣+' + r.heir);
  if (r.prest) out.push('名望+' + r.prest);
  if (r.fish) out.push('鱼干+' + r.fish);
  for (const id in r.op || {}) if (C(id)) out.push(nm(C(id)) + '好感+' + r.op[id]);
  return out.join(' · ');
}
// what a missed errand costs (said on the offer and on the errand's card); in act one, with the story pressing, less
const missOp = () => W.flags.act1Done ? 5 : 2;
const missTxt = gv => '误了：功-3 · ' + (gv ? nm(gv) : '') + '好感-' + missOp();
// Season start: a new errand when you hold a rank and have none (a season's rest after the last). Not in a season the
// story already fills (act one's calendar, the night of the escape), and less often once there is no higher rank here.
// who hands out errands: your patron, and 平原君 when he likes you
function jobGivers() {
  const gv = [], pa = patron(), py = C('pingyuan'), p = P();
  if (pa && pa !== p && opinion(pa, p) >= 0) gv.push(pa);
  if (inCity(py) && py !== pa && opinion(py, p) >= 20) gv.push(py);
  return gv;
}
const jobStoryBusy = () => W.act === 1 && (HIST.some(h => h[0] === W.t) || (W.flags.escapeLead && !W.flags.act1Done));
// force: you asked for one (讨差事): no roll. Returns whether an offer was queued.
function offerJob(force) {
  if (W.job || W.cool.job || W.rank < 1 || W.flags.waiting || W.queue.some(q => q.ev === 'joboffer')) return false;
  if (jobStoryBusy()) return false;
  if (!force && !chance(nextNeed() === null ? .35 : .55)) return false;
  const gv = jobGivers();
  const done = W.jobDone || {}, opts = [];
  for (const d of JOBS) for (const g of gv) {
    if ((d.patron !== '*' && d.patron !== g.id) || (!d.letter && !inCity(g))) continue;
    // (the everyday ones come round again after 16 seasons, the patron's own after 8)
    if (done[d.id] !== undefined && (d.once || W.t - done[d.id] < (d.patron === '*' ? 16 : 8))) continue;
    if (d.ok && !d.ok(g)) continue;
    opts.push([d, g]);
  }
  if (!opts.length) return false;
  // the patron's own errands come first; the everyday ones by weight
  const own = opts.filter(o => o[0].patron !== '*'), L = own.length && chance(.75) ? own : opts;
  let x = Math.random() * L.reduce((t, o) => t + (o[0].w || 1), 0), [d, g] = L[0];
  for (const o of L) { x -= o[0].w || 1; if (x <= 0) { [d, g] = o; break; } }
  const q = { ev: 'joboffer', id: d.id, from: g.id };
  if (d.pre) { d.pre(q, g); if (!q.tgt) return false; }
  W.queue.push(q); return true;
}
// 讨差事 on the 宫 tab: errands are where most 功 comes from, so you need not wait for one to be handed down
function askJobAct() {
  return mkAct({ id: 'askJob', kind: 'askJob', n: '讨差事', ap: 0, gold: !W.job && !W.cool.job && nextNeed() !== null && (W.merit || 0) < nextNeed() && jobGivers().length > 0,
    hint: (jobGivers()[0] ? '向' + nm(jobGivers()[0]) + '讨 · ' : '') + '办成记功',
    no: () => W.job ? '手上有差事了' : W.cool.job ? '刚办完一件，再等 ' + W.cool.job + ' 季' : W.queue.some(q => q.ev === 'joboffer') ? '差事已经派下来了'
      : !jobGivers().length ? '没有主公，没人派差事' : jobStoryBusy() ? '这季顾不上' : '',
    fn: () => { if (!offerJob(true)) toast('眼下没有合适的差事', '#dddddd'); else didAct('askJob', jobGivers()[0] || null, -1, true); } });
}
EV.joboffer = e => {
  const d = e && jobDef(e.id), gv = e && C(e.from);
  if (!d || !alive(gv) || W.job || W.rank < 1 || (d.ok && !d.ok(gv)) || (d.pre && !C(e.tgt))) return null;
  const j = { id: d.id, from: gv.id, tgt: e.tgt || null }, line = jobLine(d, j);
  // what to do (with the odds, when it is a roll), by when, and what it brings (only the merit when the whole list would not fit)
  const when = d.dueT ? '出城前' : d.due + '季内', task = jobG(j) + (d.odds ? '（' + d.odds() + '）' : ''), full = [task, when, rewTxt(d)].join(' · ');
  const hint = tw(full, 5.5, 1) <= 142 ? full : task + ' · ' + when + ' · 功+' + ((d.reward || {}).merit || 0);
  return { title: '差事', who: [gv.id].concat(j.tgt ? [j.tgt] : []), text: (d.letter ? '' : nm(gv) + '说：') + line + '\n' + missTxt(gv),
    opts: [opt('「这件事交给我。」', hint, () => takeJob(j)),
      opt('「近来抽不开身。」', nm(gv) + '好感-2', () => { addOp(gv, P(), -2, true); W.cool.job = 2; })] };
};
// (the card already said what the errand is: no notice)
// how a king says "I": 朕 once 秦 rules 天下
const Ime = gv => W.a3 && W.a3.uni && gv && gv.role === 'ruler' && gv.state === '秦' ? '朕' : '寡人';
function takeJob(j) {
  const d = jobDef(j.id); if (!d || W.job) return;
  j.t0 = W.t; j.due = d.dueT || W.t + d.due; j.n = 0;
  if (j.tgt) W.flags.lastTgt = j.tgt;
  if (d.init) d.init(j);
  W.job = j;
}
// ok: rewards (one line says what came of it); why: called off with no blame (the giver died, the target left town);
// else missed: 功-3, the giver -5, and it weighs on you
function endJob(ok, why) {
  const j = W.job, d = j && jobDef(j.id); W.job = null; W.cool.job = ok ? 4 : 2; if (!d) return;
  const gv = C(j.from), p = P(), g = jobG(j);
  W.jobDone = W.jobDone || {}; W.jobDone[d.id] = W.t;
  if (ok) {
    const r = d.reward || {};
    logLine('差事办妥：' + g + (rewTxt(d) ? ' · ' + rewTxt(d) : ''), '#ffe08a'); SFX.happy();
    addMerit(r.merit || 0, '差事', true);
    if (r.fish) addFish(r.fish, true);
    if (r.prest) W.prest = clamp(W.prest + r.prest, 0, 999);
    for (const id in r.op || {}) { const o = C(id); if (alive(o)) addOp(o, p, r.op[id], true); }
    if (alive(gv) && !(r.op && r.op[gv.id])) addOp(gv, p, 3, true);
    if (r.heir && !W.flags.zichu && W.heir < 100) {
      W.heir += r.heir; W.credit.you += r.heir; if (W.flags.allied) W.credit.lv += r.heir >> 1;
      if (W.heir >= 100 && !W.queue.some(q => q.ev === 'zichu')) W.queue.push({ ev: 'zichu' });
    }
    if (r.fn) r.fn(j);
  } else if (why) logLine('差事作罢：' + g + '（' + why + '）', '#dddddd', true);
  else { logLine('差事误了：' + g, '#ff9a8a'); addMerit(-3, '', true); if (alive(gv)) addOp(gv, p, -missOp(), true); addStress(p, 8, '误事'); }
}
// errands that are a state of things (a new retainer, 300 fish on the night) are checked after actions and each season
function jobCheck() {
  const j = W.job, d = j && jobDef(j.id); if (!d || !d.check) return;
  const r = d.check(j); if (r === true) endJob(true); else if (r === 'fail') endJob(false);
}
function jobTick() {
  const j = W.job, d = j && jobDef(j.id);
  if (j && !d) { W.job = null; return; }
  if (!j) return offerJob();
  if (!alive(C(j.from))) return endJob(false, '人不在了');
  const who = jobWho(j);
  if (who && who.some(id => !alive(C(id)))) return endJob(false, '人不在了');
  if (who && !who.some(id => inCity(C(id)))) return endJob(false, '人不在城里');
  jobCheck(); if (!W.job) return;
  if (W.t >= j.due) endJob(false);
}
// what you did: does it count for the errand?
function jobDid(kind, t, ok) {
  const j = W.job, d = j && jobDef(j.id);
  if (!d || !d.goal || !(ok || d.goal.any) || ![].concat(d.goal.kind).includes(kind)) return;
  const who = jobWho(j); if (who && !(t && who.includes(t.id))) return;
  j.n = (j.n || 0) + 1;
  if (j.n >= (d.goal.n || 1)) endJob(true); else toast('差事 ' + j.n + '/' + d.goal.n, '#ffe08a');
}
// where the errand is done: the sheet of the one it is about (when in reach), else its tab
function jobGoWho(j) { const w = jobWho(j), c = w && w.map(C).find(x => alive(x) && x.id !== W.player && reach(x)); return c || null; }
const jobGoTxt = (j, d) => { const c = jobGoWho(j); return c ? '去找' + nm(c) : TABS[d.tab] ? '去「' + TABS[d.tab].n + '」' : ''; };
function jobGo(j, d) { const c = d.pay ? null : jobGoWho(j); if (c) openSheet(c.id); else if (TABS[d.tab]) W.loc = d.tab; }
// the errand's card (tap its row under the top-right widget)
function jobCard() {
  const j = W.job, d = j && jobDef(j.id); if (!d) return;
  const gv = C(j.from), pg = jobProg(j);
  showCard({ title: '差事 · ' + d.title, who: alive(gv) ? [gv.id] : [],
    text: jobLine(d, j) + '\n要办：' + jobG(j) + (pg ? ' ' + pg : '') + '\n期限：' + (d.dueT ? '出城那夜' : '还剩 ' + jobLeft(j) + ' 季') + '\n办妥：' + rewTxt(d),
    opts: (d.pay ? [opt('「鱼干在这里。」', '鱼干-' + d.pay + ' · 当场办妥', () => jobPayNow(), () => W.fish >= d.pay)] : [])
      .concat([opt('「这就去办。」', d.pay ? '家里也能交：「家」的金色按钮' : jobGoTxt(j, d), () => jobGo(j, d)), opt('「这件事我办不了。」', '功-3 · ' + nm(gv) + '好感-' + missOp(), () => endJob(false))]) });
}
// an errand that only asks for fish can be paid from anywhere: on its card, or with the gold button on the 家 tab
function jobPayNow() { const j = W.job, d = j && jobDef(j.id), gv = j && C(j.from); if (!d || !d.pay || W.fish < d.pay) return; addFish(-d.pay); didAct('jobpay', gv, -1, true); }
SYS.tab.push((tab, A) => { const j = W.job, d = j && jobDef(j.id); if (tab === 'home' && d && d.pay) A.unshift(payAct(C(j.from), d.pay, d.title)); });
// the button an errand points at glows gold (run after every other system has replaced its actions)
function jobGoldActs(c, A) {
  const j = W.job, d = j && jobDef(j.id); if (!d) return;
  if (d.acts && reach(c)) for (const a of d.acts(c, j)) A.push(a);
  if (!d.goal) return;
  const ks = [].concat(d.goal.kind), who = jobWho(j);
  for (const a of A) if (ks.includes(a.kind) && (!who || who.includes(c.id))) a.gold = true;
}
function jobGoldTab(tab, A) {
  const j = W.job, d = j && jobDef(j.id); if (!d) return;
  if (d.tabs) for (const a of d.tabs(tab, j)) A.push(a);
  if (!d.goal || jobWho(j)) return;
  const ks = [].concat(d.goal.kind);
  for (const a of A) if (ks.includes(a.kind)) a.gold = true;
}
const lastHook = (k, f) => { const L = SYS[k], i = L.indexOf(f); if (i >= 0) L.splice(i, 1); L.push(f); };

// ---------------------------------------------------------- promotion
// the next rank and what it takes: need() → [[label, have, need], …]. ACT2 pushes the 秦 ranks.
// In 邯郸 someone speaks for you at court: your patron if they are a lord here, else 平原君, else you face the king alone.
const keqingBy = () => {
  const pa = patron(), py = C('pingyuan'), k = cityRuler();
  if (pa && inCity(pa) && lordly(pa) && pa.state === '赵') return pa;
  return inCity(py) ? py : alive(k) && k.state === '赵' && inCity(k) ? k : null;
};
const PROMO = [
  { to: 2, ev: 'keqing', ok: () => W.rank === 1 && W.city === 'handan' && !!W.flags.act1Done && !!keqingBy(),
    need: () => { const r = keqingBy(); return [['功', W.merit || 0, 60], ['望', W.prest, 50], [r ? nm(r) : '举荐', r ? opinion(r, P()) : 0, 50]]; } },
];
const nextPromo = () => PROMO.find(x => x.ok()) || null;
// the merit the next rank asks for, when there is a next rank to rise to here (else null)
const nextNeed = () => W.rank >= 1 && PROMO.some(x => x.to === W.rank + 1) ? RANK_NEED[W.rank + 1] : null;
const promoReady = () => { const x = nextPromo(); return !!x && x.need().every(([, v, n]) => v >= n); };
const promoTxt = () => {
  const x = nextPromo();
  if (!x) return W.rank < 1 ? '先做上舍人' : W.rank === 1 && !W.flags.act1Done ? '第一幕之后，由平原君举荐' : '眼下没有更高的位置';
  // (what is missing first: a list row cuts the tail off)
  const L = x.need(); return L.filter(([, v, n]) => v < n).concat(L.filter(([, v, n]) => v >= n)).map(([l, v, n]) => l + ' ' + Math.min(v, n) + '/' + n).join(' · ');
};
function promote(n, by) {
  if (W.rank >= n) return;
  W.rank = n; PORT.clear(); MINI.clear(); SFX.happy(); addPrest(10);
  // (a rank 赵 gave counts for nothing in 秦: ACT2's enterQin)
  if (W.city === 'handan') W.flags.zhaoRank = true; else delete W.flags.zhaoRank;
  logLine('你做了' + ({ handan: '赵国的', xianyang: '秦国的', daliang: '魏国的' }[W.city] || '') + RANKS[n], '#ffe08a');
  if (by) W.patron = by.id;
  // 子楚 hears that his man in 邯郸 now serves 赵
  const yr = C('yiren'); if (n === 2 && W.city === 'handan' && alive(yr) && W.flags.act1Done && !inCity(yr)) addMemo(yr, P(), '仕赵', -10);
}
EV.keqing = () => {
  const r = keqingBy(), k = cityRuler(); if (W.rank !== 1 || !r || !alive(k)) return null;
  // (serving 赵 costs you with 子楚 in 咸阳, see promote)
  const yr = C('yiren'), zc = W.city === 'handan' && alive(yr) && W.flags.act1Done && !inCity(yr);
  return { title: '客卿', who: [r.id].concat(k !== r ? [k.id] : []),
    text: (k !== r ? nm(r) + '在' + nm(k) + '面前举荐了你。' : '') + nm(k) + '在朝上召见你，赐了冠带：「你为赵国出过力。从今往后，你是寡人的客卿。」',
    opts: [opt('「谢大王。」', '身份：客卿 · 俸禄每季 20 · 名望+10' + (zc ? ' · ' + nm(yr) + '好感-10' : ''), () => promote(2, r)), opt('「臣只是个商人。」', '名望+3', () => { addPrest(3); W.cool.promo = 8; })] };
};
// the way to a first rank, in words: in act one 异人 (35+ makes you his 舍人), after it a lord in town at 30+
function doorTxt() {
  if (!W.flags.act1Done) { const yr = C('yiren'); return alive(yr) ? nm(yr) + '好感到 35，会请你做舍人' : '城里的权贵好感到 ' + LORD_OP + '，会请你做舍人'; }
  const b = bestLord(); return '权贵好感到 ' + LORD_OP + '，会请你做舍人' + (b ? ' · 最近的：' + nm(b[0]) + ' ' + b[1] + '/' + LORD_OP : '');
}
// after act one, a merchant with no rank can still find a door: the lord in town who thinks best of you (e.a), 30+
EV.pymenke = e => {
  const c = C((e && e.a) || 'pingyuan'); if (W.rank >= 1 || !inCity(c) || opinion(c, P()) < LORD_OP) return null;
  const text = c.id === 'pingyuan' ? '平原君派人请你过府。他门下食客三千，缺一个懂买卖的人。「你若愿意，来做我的舍人。」'
    : nm(c) + '派人请你过府。' + ta(c) + '府上缺一个懂买卖的人。「你若愿意，来做我的舍人。」';
  return { title: '门下', who: [c.id], text,
    opts: [opt('「愿为君上效力。」', '身份：舍人 · 俸禄每季 6 · 可接差事', () => { W.rank = Math.max(W.rank, 1); W.patron = c.id; PORT.clear(); MINI.clear(); SFX.happy(); logLine('你做了' + nm(c) + '的舍人', '#ffe08a'); }),
      opt('「狸家的铺子离不开人。」', '', () => { W.cool.pymenke = 12; })] };
};
// 献策 on the 宫 tab: to your patron if you can reach them, else to the ruler here
function adviseTo() { const pa = patron(); return pa && reach(pa) ? pa : alive(cityRuler()) ? cityRuler() : null; }
const adviseSt = () => stat(P(), 1) >= stat(P(), 3) ? 1 : 3;
function adviseAct() {
  const st = adviseSt(), t = adviseTo();
  return mkAct({ id: 'advise', kind: 'advise', n: '献策', ap: 1, hint: chkHint(st, 10) + ' · 功+4 望+6' + (t ? ' · 献给' + nm(t) : ''),
    no: () => W.rank < 1 ? '要先当上舍人' : W.cool.advise ? '刚献过策，再等 ' + W.cool.advise + ' 季' : !adviseTo() ? '没有人可献策' : '',
    fn: () => {
      const to = adviseTo(); if (!to || !spendAp(1)) return;
      const s = adviseSt(), ok = chk(s, 10); W.cool.advise = 2;
      if (ok) { addPrest(6); addMerit(4, '献策'); addOp(to, P(), 3, true); toast(nm(to) + '采纳了你的策论', '#9fe89a'); } else toast(nm(to) + '听完，没有说话', '#dddddd');
      didAct('advise', to, s, ok);
    } });
}

// ---------------------------------------------------------- 置产 (estates, at most four kinds)
// n: the investment, w: the place (for the fire and theft card)
// (all but the granary grow three levels, each costing half as much again: money has somewhere to go as the house grows)
const ESTATES = {
  shop: { n: '扩铺', w: '铺子', p: 200, max: 3, inc: lv => R(10 * lv * (siegeOn() ? .5 : 1)), s: '铺面每级每季 +10，可扩三级' },
  tavern: { n: '酒肆股', w: '酒肆', p: 250, max: 3, inc: lv => 8 * lv, s: '每季 +8 · 打听刺探更灵 · 可扩三级' },
  granary: { n: '粮仓', w: '粮仓', p: 300, inc: () => siegeOn() ? 45 : 5, s: '每季 +5 · 围城时 +45，家用全免' },
  iron: { n: '铁坊股', w: '铁坊', p: 400, max: 3, inc: lv => (W.t >= 4 && W.t <= 21 ? 25 : 10) * lv, s: '打仗的年头每季 +25，平时 +10 · 可扩三级',
    need: () => { const g = C('guozong'); return !alive(g) ? '郭纵不在了' : opinion(g, P()) < 40 ? '郭纵好感需 40' : ''; } },
  farm: { n: '田庄', w: '田庄', p: 600, max: 3, inc: lv => 20 * lv, s: '每季 +20 · 可扩三级' },
};
const estKinds = () => Object.keys(W.estates).filter(k => W.estates[k] > 0);
// four kinds for a merchant, all five once you hold a rank
const estMax = () => Math.min(Object.keys(ESTATES).length, 4 + (W.rank >= 1 ? 1 : 0));
const estPrice = k => R(ESTATES[k].p * Math.pow(1.5, W.estates[k] || 0) * (typeof hasPerk === 'function' && hasPerk('陶朱') ? .7 : 1));
// a 账房 on the council keeps the books: estates pay ×(1 + 政/20)
function estMult() { const a = typeof councilSeat === 'function' ? councilSeat('账房') : null; return a ? 1 + stat(a, 1) / 20 : 1; }
const estInc = k => (W.estDown[k] || 0) > W.t ? 0 : R(ESTATES[k].inc(W.estates[k]) * estMult());
function estateIncome() { return W && W.estates ? estKinds().reduce((t, k) => t + estInc(k), 0) : 0; }
function estNo(k) {
  const E = ESTATES[k], lv = W.estates[k] || 0;
  if (!lv && estKinds().length >= estMax()) return '最多' + estMax() + '处产业' + (W.rank < 1 ? '（当上舍人可置五处）' : '');
  if (lv >= (E.max || 1)) return '已经到顶';
  const r = E.need && E.need(); if (r) return r;
  return W.fish < estPrice(k) ? '鱼干不够 ' + estPrice(k) : '';
}
function buyEstate(k) {
  if (estNo(k)) return;
  const E = ESTATES[k], lv = W.estates[k] || 0;
  addFish(-estPrice(k)); W.estates[k] = lv + 1; SFX.coin();
  logLine(lv ? E.n + '到了 ' + (lv + 1) + ' 级' : '置下' + E.n, '#ffe08a');
  if (k === 'granary' && siegeOn()) W.flags.stock = true;
  didAct('estate', null, 1, true);
}
function openEstates() {
  W.flags.estSeen = true;
  openList('置产', () => Object.keys(ESTATES).map(k => {
    const E = ESTATES[k], lv = W.estates[k] || 0, down = (W.estDown[k] || 0) > W.t, more = !lv || lv < (E.max || 1);
    const s = down ? '停了，还要 ' + (W.estDown[k] - W.t) + ' 季' : lv ? '每季 +' + estInc(k) + (more ? ' · 再扩 +' + (R(E.inc(lv + 1) * estMult()) - estInc(k)) : '') : E.s;
    return { icon: icoEst(k), t: E.n + (E.max && lv ? ' ' + lv + '级' : ''), s: more ? cutS(s) : s,
      act: more ? mkAct({ id: 'est_' + k, n: lv ? '扩' : '买', ap: 0, fish: estPrice(k), no: () => estNo(k), fn: () => buyEstate(k) }) : null,
      right: more ? null : '已置', col: '#276a32' };
  }), { get sub() { const a = typeof councilSeat === 'function' && councilSeat('账房'); return '产业每季 +' + estateIncome() + ' · 最多' + estMax() + '处' + (a ? ' · 账房' + nm(a) + ' ×' + estMult().toFixed(2) : ''); } });
}
EV.estfire = e => {
  const k = e && e.k, E = ESTATES[k]; if (!E || !W.estates[k]) return null;
  const fire = k === 'granary' || k === 'farm' || chance(.5);
  // a watchman in the house catches the thief
  if (!fire && ((typeof hasPerk === 'function' && hasPerk('家丁')) || (typeof councilSeat === 'function' && councilSeat('家丁头')))) { logLine('家丁在' + E.w + '抓住了一个贼', '#9fe89a'); return null; }
  return { title: fire ? '走水' : '失窃', who: [],
    text: fire ? '夜里' + E.w + '走了水，烧了半边。' : E.w + '的账上少了一大笔，管账的伙计不见了。',
    opts: [opt('认了', E.w + '四季没有进项', () => { W.estDown[k] = W.t + 4; }),
      Object.assign(opt('花 50 修好', '鱼干-50', () => addFish(-50), () => W.fish >= 50), { no: () => '鱼干不够 50' })] };
};

// ---------------------------------------------------------- 名物 (treasures of the house)
// p: price; st: a stat it sharpens for the head (the best one of each stat counts); k: one character for the 好 chip;
// use: spent on the spot (薄荷草); rare: never on the stall (和氏璧 comes from the story: gainItem('hsb'))
// d: what lies on the stall, as a noun phrase ('市集的摊子上摆着' + d)
const MEIWU = {
  chuxiu: { n: '楚绣', k: '绣', p: 90, d: '一幅楚地的绣品' },
  zhaojian: { n: '赵剑', k: '剑', p: 120, st: [1, 0, 0, 0], d: '一把邯郸匠人打的剑' },
  sunzi: { n: '《孙子》', k: '书', p: 100, st: [0, 0, 0, 1], d: '一卷竹简，十三篇的《孙子》' },
  bi: { n: '玉璧', k: '玉', p: 200, d: '一块青白玉璧' },
  yeming: { n: '夜明珠', k: '珠', p: 300, d: '一颗夜里会发光的珠子' },
  shujin: { n: '蜀锦', k: '锦', p: 80, d: '一匹蜀地来的锦缎' },
  bianzhong: { n: '编钟', k: '钟', p: 250, d: '一套青铜编钟' },
  tongjing: { n: '铜镜', k: '镜', p: 60, d: '一面磨得很亮的铜镜' },
  bohe: { n: '薄荷草', k: '草', p: 30, use: 1, d: '一捆薄荷草' },
  hsb: { n: '和氏璧', k: '璧', p: 600, rare: 1, d: '天下闻名的和氏璧' },
};
// who likes what: the famous by history, everyone else by station (stable per cat)
const LIKE = { huayang: 'chuxiu', xuan: 'chuxiu', yiren: 'chuxiu', lianpo: 'zhaojian', zhaokuo: 'zhaojian', guozong: 'zhaojian', lzl: 'sunzi', maosui: 'sunzi', zheng: 'sunzi',
  pingyuan: 'bi', zhaowang: 'bi', zhao: 'bi', anli: 'bi', zixi: 'bi', lv: 'yeming', guokai: 'yeming', zhaoji: 'shujin', pyfuren: 'shujin', xiaji: 'shujin', daoxiang: 'shujin',
  xinling: 'bianzhong', changanz: 'bianzhong', anguo: 'bianzhong' };
const LIKE_BY = { shi: ['sunzi', 'zhaojian', 'tongjing'], merchant: ['yeming', 'bi', 'tongjing'], noble: ['bi', 'bianzhong', 'shujin'], ruler: ['bi', 'bianzhong'], minister: ['bi', 'yeming'],
  general: ['zhaojian', 'sunzi'], dancer: ['shujin', 'tongjing'], hostage: ['chuxiu'], commoner: ['tongjing', 'shujin', 'zhaojian'] };
function likeOf(c) { if (!c) return null; if (LIKE[c.id]) return LIKE[c.id]; const L = LIKE_BY[c.role] || LIKE_BY.commoner; return L[hashStr(c.id + '#like') % L.length]; }
function hasItem(id) { return !!W && Array.isArray(W.items) && W.items.includes(id); }
function gainItem(id, why) { if (!MEIWU[id] || !W) return; W.items.push(id); logLine('得到' + MEIWU[id].n + (why ? '（' + why + '）' : ''), '#ffe08a'); }
// a thank-you that arrives dt seasons later (the story events that earn one call this)
function laterItem(id, dt, why) { if (W) (W.flags.gifts = W.flags.gifts || []).push([W.t + dt, id, why]); }
// fame from what stands on the shelf: +1 a season for each kind, at most +3. Treasures keep up a house's standing
// up to 100 (有名); past that, fame has to come from deeds (else every house drifts into the top tiers on its own)
const ITEM_FAME = 100;
const itemPrest = () => W.prest < ITEM_FAME ? Math.min(3, new Set(W.items).size) : 0;
const giftBase = id => Math.min(60, R(MEIWU[id].p / 6));
const giftVal = (c, id) => Math.min(60, R(MEIWU[id].p / 6 * (likeOf(c) === id ? 1.5 : 1)));
const grand = c => ['ruler', 'noble'].includes(c.role);
// fame: each kind counts once, the first three kinds only (fame=false: this one adds none)
function itemFx(id, fame) {
  const it = MEIWU[id];
  if (it.use) return '家人好感+6 · 心烦↓';
  return [W.prest < ITEM_FAME && fame !== false ? '每季名望+1' : '', it.st ? STATN[it.st.findIndex(v => v > 0)] + '+1' : '', '送礼好感+' + giftBase(id)].filter(Boolean).join(' · ');
}
function rollStall() {
  if (!chance(.6)) { W.stall = null; return; }
  const ids = Object.keys(MEIWU).filter(k => !MEIWU[k].rare), fresh = ids.filter(k => !hasItem(k));
  const id = pick(fresh.length && chance(.8) ? fresh : ids);
  W.stall = { id, p: R(MEIWU[id].p * rand(.8, 1.3)) };
}
function stallCard() {
  const s = W.stall, it = s && MEIWU[s.id]; if (!it) return;
  const fame = hasItem(s.id) || new Set(W.items).size < 3;
  showCard({ title: '名物', who: [], text: '市集的摊子上摆着' + it.d + '。' + (it.use ? '' : '\n送给喜欢它的人，好感再多一半。'),
    opts: [Object.assign(opt('买下', '鱼干-' + s.p + ' · ' + itemFx(s.id, fame && !hasItem(s.id)), buyItem, () => W.fish >= s.p), { no: () => '鱼干不够 ' + s.p }), opt('不买', '', () => {})] });
}
function buyItem() {
  const s = W.stall, it = s && MEIWU[s.id]; if (!it || W.fish < s.p) return;
  addFish(-s.p); W.stall = null;
  if (it.use) { useBohe(); return; }
  W.items.push(s.id); logLine('买下' + it.n, '#ffe08a'); didAct('buy', null, 1, true);
}
function useBohe() {
  const p = P(); for (const c of household()) addOp(c, p, 6, true);
  // (growth keeps stress 0–100 and brings its own addStress(c, n, why); before that it is 0–3)
  if (typeof hasPerk === 'function') addStress(p, -30, '薄荷草'); else p.stress = 0;
  toast('一家人都舒坦了', '#9fe89a'); didAct('catnip', null, -1, true);
}
const sellP = id => R(MEIWU[id].p * .6);
function sellItem(id) { const i = W.items.indexOf(id); if (i < 0) return; W.items.splice(i, 1); addFish(sellP(id)); logLine('卖了' + MEIWU[id].n, '#dddddd', true); }
function openTreasures() {
  // (only the first piece of each of the first three kinds adds fame)
  const famous = () => { const ks = [...new Set(W.items)].slice(0, 3); return (id, i) => ks.includes(id) && W.items.indexOf(id) === i; };
  openList('名物', () => { const f = famous(); return W.items.map((id, i) => ({ icon: icoItem(id), t: MEIWU[id].n, s: cutS(itemFx(id, f(id, i))),
    act: mkAct({ id: 'sell_' + i, n: '卖', ap: 0, hint: '+' + sellP(id), danger: MEIWU[id].n + ' · 得' + sellP(id) + '鱼干 · 不能反悔', fn: () => sellItem(id) }) })); },
    { get sub() { return '每季名望+' + itemPrest() + '（最多三件，' + ITEM_FAME + '为止）· 送礼在人物卡上'; }, empty: '家里还没有名物。市集的摊子上偶尔有卖的。' });
}
// 送礼 turns into a small menu once the house has something better than fish to give
function giftMenu(c, A) {
  const i = A.findIndex(a => a.id === 'gift'); if (i < 0) return;
  const items = [...new Set(W.items)].filter(id => MEIWU[id] && !MEIWU[id].use); if (!items.length) return;
  const p = P(), hostage = c.id === 'yiren' && c.loc === 'hostage', giftN = (hostage ? 15 : 10) + (c.tr.includes('贪吃') ? 5 : 0);
  const known = c.flags.likeK, fish = () => {
    if (W.fish < 30) { toast('鱼干不够 30', '#ff9a8a'); SFX.no(); return; }
    if (!spendAp(1)) return; addFish(-30); addOp(c, p, giftN); react(c, 'gift', true); if (hostage) { W.flags.metYiren = true; lvNotice(); } didAct('gift', c, 2, true);
  };
  A[i] = mkAct({ id: 'gift', kind: 'gift', n: '送礼', ap: 1, hint: '鱼干或名物', no: () => '',
    fn: () => pickOpt('送' + nm(c) + '什么？ ◆1', [{ n: '小鱼干 30 · 好感+' + giftN, style: W.fish < 30 ? 'off' : 'jade', fn: fish }].concat(items.map(id => ({
      n: MEIWU[id].n + ' · 好感+' + (known ? giftVal(c, id) : giftBase(id)), style: known && likeOf(c) === id ? 'gold' : 'jade',
      s: [known && likeOf(c) === id ? ta(c) + '喜欢这个' : '', grand(c) ? '名望+' + Math.max(1, R(MEIWU[id].p / 50)) : ''].filter(Boolean).join(' · ') || null,
      fn: () => giveItem(c, id) })))) });
}
function giveItem(c, id) {
  if (!hasItem(id) || !spendAp(1)) return;
  W.items.splice(W.items.indexOf(id), 1);
  const p = P(), it = MEIWU[id], liked = likeOf(c) === id;
  addOp(c, p, giftVal(c, id)); if (grand(c)) addPrest(Math.max(1, R(it.p / 50)));
  if (liked) { c.flags.likeK = 1; toast(nm(c) + '正喜欢' + it.n, '#9fe89a'); }
  if (state === 'game') MODAL.push({ type: 'talk', c: c.id, line: sayLine(c, 'gift', true), note: '收下了' + it.n, ok: true, fx: 'heart', t0: T });
  if (c.id === 'yiren' && c.loc === 'hostage') { W.flags.metYiren = true; lvNotice(); }
  didAct('gift', c, 2, true);
}
// what a cat likes comes out in conversation (25%) or through 打听 (50%, about someone in town)
function learnLike(c, how) {
  if (!c || !alive(c) || c.id === W.player || c.flags.likeK || !MEIWU[likeOf(c)]) return false;
  c.flags.likeK = 1; logLine((how || '') + nm(c) + '喜欢' + MEIWU[likeOf(c)].n, '#c8e0ff'); return true;
}
function hearLike() {
  const L = townsfolk().filter(c => ageOf(c) >= 16 && !c.flags.likeK && (c.hist || c.role !== 'commoner'));
  if (L.length) learnLike(pick(L), '打听到：');
}
// a share in the tavern: what 打听/刺探 miss, the regulars sometimes let slip (+15% in all)
function tavernTip(kind, t) {
  const hua = kind === 'ask' && !W.flags.knowHuayang && W.act === 1, p = pct(stat(P(), 3), kind === 'spy' ? 11 : hua ? 5 : 10);
  if (!chance(Math.min(1, .15 / Math.max(.05, 1 - p)))) return;
  if (hua) { W.flags.knowHuayang = true; logLine('酒肆里有人说：华阳夫人无子', '#ffe08a'); logLine('解锁：行「遣使咸阳」', '#c8e0ff'); return; }
  if (discoverSecret(kind === 'spy' && t ? [t.id] : null, 0, true)) toast('酒肆里有人说漏了嘴', '#c8e0ff');
}
// a 楚绣 goes to 咸阳 with the next envoy: 华阳夫人 is from 楚
function chuxiuEnvoy() {
  if (!hasItem('chuxiu') || W.flags.zichu || W.heir >= 100) return;
  W.items.splice(W.items.indexOf('chuxiu'), 1);
  W.heir += 10; W.credit.you += 10; if (W.flags.allied) W.credit.lv += 5;
  addOp(C('huayang'), P(), 8, true); logLine('使者把楚绣献给了华阳夫人 · 立嗣+10', '#ffe08a');
  if (W.heir >= 100 && !W.flags.zichu && !W.queue.some(q => q.ev === 'zichu')) W.queue.push({ ev: 'zichu' });
}

// ---------------------------------------------------------- 大计 (decisions on the 宫 tab; ACT2/3 push rows)
// a row: { id, show(), ico(), t, s, act() → action, close }
const MOTTO = ['勤快', '诚实', '勇猛', '狡诈'];
// a feast in a famous house has to be a bigger one
const feastCost = () => 150 * (1 + prestTier().i);
function doFeast() {
  const cost = feastCost(); if (W.fish < cost || W.cool.feast) return;
  addFish(-cost); W.cool.feast = 8;
  const bell = hasItem('bianzhong'), p = P();
  const L = townsfolk().filter(c => ageOf(c) >= 16 && c.house !== 'li' && (c.hist || ['noble', 'minister', 'general', 'ruler', 'shi'].includes(c.role)) && opinion(c, p) > -20);
  const guests = L.map(c => [c, (c.hist ? 0 : 1) + Math.random()]).sort((a, b) => a[1] - b[1]).slice(0, 3).map(x => x[0]);
  addPrest(15 + (bell ? 5 : 0));
  for (const c of guests) addMemo(c, p, '赴宴', 15 + (bell ? 5 : 0), 12);
  // a feast brings people to the door
  if (chance(.3)) { const r = crushCands().length ? 'crush' : W.ret.length < RET_MAX ? 'guest' : null; if (r) W.queue.push({ ev: 'rand', id: r }); }
  showCard({ title: '大宴', who: guests.map(c => c.id),
    text: guests.length ? '狸家大宴宾客，' + guests.map(nm).join('、') + '都来了。' + (bell ? '堂上的编钟响了一夜。' : '') : '狸家大宴宾客。城里有头有脸的，一个也没来。',
    opts: [opt('好', '', () => {})] });
  didAct('feast', null, 2, true);
}
function doPedigree() {
  if (W.fish < 200 || W.cool.pedigree) return;
  addFish(-200); W.cool.pedigree = 40; addPrest(10);
  for (const c of family()) if (c.id !== W.player) addMemo(c, P(), '修谱', 10, 20);
  logLine('狸氏家谱修成了', '#ffe08a'); didAct('pedigree', null, 1, true);
}
// a house motto takes a known name (100) and spends some of it (50)
const MOTTO_NEED = 100, MOTTO_COST = 50;
function doMotto() {
  pickOpt('狸家立什么家训？', MOTTO.map(t => ({ n: t + (W.motto === t ? '（现行）' : ''), s: '名望-' + MOTTO_COST + ' · 新生的狸三成随此', style: W.motto === t ? 'off' : 'jade',
    fn: () => { if (W.prest < MOTTO_NEED || W.motto === t) return; addPrest(-MOTTO_COST); W.motto = t; W.mottoT = W.t; logLine('狸家立了家训：' + t, '#ffe08a'); } })));
}
const DECISIONS = [
  { id: 'office', show: () => !W.kingId || W.kingId !== W.player, ico: () => icoDec('office'), t: () => { const x = nextPromo(); return '求官' + (x ? ' · ' + RANKS[x.to] : ''); }, s: promoTxt, close: true,
    act: () => mkAct({ id: 'd_office', n: '办', ap: 0, no: () => promoReady() ? (W.cool.promo ? '再等 ' + W.cool.promo + ' 季' : '') : '条件未齐', fn: () => { const x = nextPromo(), e = x && EV[x.ev](); if (e) showCard(e); } }) },
  { id: 'feast', ico: () => icoDec('feast'), t: '大宴', s: () => '鱼干' + feastCost() + ' · 名望+15 · 三位名流+15', close: true,
    act: () => mkAct({ id: 'd_feast', n: '办', ap: 0, no: () => W.cool.feast ? '再等 ' + W.cool.feast + ' 季' : W.fish < feastCost() ? '鱼干不够 ' + feastCost() : '', fn: doFeast }) },
  { id: 'pedigree', ico: () => ICON.scroll, t: '修家谱', s: '鱼干200 · 族人好感+10 · 名望+10',
    act: () => mkAct({ id: 'd_ped', n: '办', ap: 0, no: () => W.cool.pedigree ? '再等 ' + W.cool.pedigree + ' 季' : W.fish < 200 ? '鱼干不够 200' : '', fn: doPedigree }) },
  { id: 'motto', ico: () => icoDec('motto'), t: () => '立家训' + (W.motto ? ' · 现为' + W.motto : ''), s: '名望-' + MOTTO_COST + ' · 新生的狸三成随家训', close: true,
    act: () => mkAct({ id: 'd_motto', n: '办', ap: 0, look: W.prest >= MOTTO_NEED ? 'red' : null, no: () => W.prest < MOTTO_NEED ? '名望不足 ' + MOTTO_NEED : '', fn: doMotto }) },
  // the succession law belongs to the growth system (W.law); switching it costs fame, once per head
  { id: 'law', show: () => typeof W.law === 'string', ico: () => ICON.seal, t: () => '改家法 · ' + (W.law === '择贤' ? '立嫡长' : '择贤'), s: '名望100 · 一代家主只能改一次',
    act: () => mkAct({ id: 'd_law', n: '办', ap: 0, danger: '名望-100', no: () => W.flags.lawBy === W.player ? '这一代改过了' : W.prest < 100 ? '名望不足 100' : '',
      fn: () => { if (W.prest < 100 || W.flags.lawBy === W.player) return; addPrest(-100); W.law = W.law === '择贤' ? '嫡长' : '择贤';
        W.flags.lawBy = W.player; kinOnHeirChange(); logLine('狸家改了家法：' + (W.law === '择贤' ? '择贤而立' : '立嫡立长'), '#ffe08a'); } }) },
];
function openDecisions() {
  openList('大计', () => DECISIONS.filter(d => !d.show || d.show()).map(d => ({ icon: d.ico(), t: jv(d.t), s: cutS(jv(d.s)), act: d.act(), close: d.close })),
    { get sub() { return '名望 ' + W.prest + ' · ' + prestTier().n + ' · 鱼干 ' + W.fish; } });
}
// the 功名 card: tap the rank line or the merit bar on the player card
function openCareer() {
  const pt = prestTier(), need = nextNeed(), pa = patron(), j = W.job, d = j && jobDef(j.id);
  const rows = [
    { icon: icoDec('office'), t: '身份：' + RANKS[W.rank], right: '俸禄 ' + (SALARY[W.rank] || 0) + '/季', col: '#276a32' },
    { t: '功 ' + (W.merit || 0) + (need ? ' / ' + need : ''), s: need ? '差事、献策、进言都记功' : W.rank ? '功每满 ' + MERIT_GIFT + '，主公有赏' : '' },
    { t: '名望 ' + W.prest + ' · ' + pt.n, s: '众人好感+' + pt.op + ' · 提亲+' + tierWed(pt) + '%' + (pt.next ? ' · ' + pt.next + ' 升一档' : '') },
    pa ? { por: pa, t: '主公 ' + nm(pa), s: '对你 ' + opinion(pa, P()), fn: () => openSheet(pa.id, true) } : { t: '主公：无', s: (W.rank ? '权贵好感到 ' + LORD_OP + '，会收你在门下' + (bestLord() ? ' · 最近的：' + nm(bestLord()[0]) + ' ' + bestLord()[1] + '/' + LORD_OP : '') : doorTxt()) },
    d ? { icon: icoJob(), t: '差事 · ' + d.title, s: jobG(j) + ' · ' + jobWhen(j), fn: jobCard, close: true } : { icon: icoJob(), t: '差事：无', s: !W.rank ? '当上舍人才有差事' : jobGivers().length ? '主公会派差事 · 也可去宫里讨' : '有了主公才有差事' },
    { icon: icoDec('office'), t: '求官', s: promoTxt(), fn: openDecisions },
    { icon: icoEst('shop'), t: '产业', right: '+' + estateIncome() + '/季', col: '#276a32', fn: openEstates },
    { icon: icoItem(W.items[0] || 'bi'), t: '名物', right: W.items.length + ' 件', fn: openTreasures },
  ];
  openList('功名', rows);
}

// ---------------------------------------------------------- icons (made on first use: icons() runs after all code)
const ITEM_ART = {
  chuxiu: [['RRRRRRR', 'RGRRRGR', 'RRGRGRR', 'RRRGRRR', 'RRGRGRR', 'RGRRRGR', 'RRRRRRR'], { R: '#b5312a', G: '#f0cc5c' }],
  zhaojian: [['......L', '.....L.', '....L..', '.G.L...', '..G....', '.B.G...', 'B......'], { L: '#dfe6ee', G: '#f0cc5c', B: '#7a4a30' }],
  sunzi: [['YDYDYDY', 'YDYDYDY', 'RRRRRRR', 'YDYDYDY', 'YDYDYDY', 'RRRRRRR', 'YDYDYDY'], { Y: '#e8c878', D: '#a88848', R: '#b5312a' }],
  bi: [['..JJJ..', '.JJJJJ.', 'JJJ.JJJ', 'JJ...JJ', 'JJJ.JJJ', '.JJJJJ.', '..JJJ..'], { J: '#a9c9a4' }],
  yeming: [['...Y...', '..WWW..', '.WWLWW.', 'YWLWWWY', '.WWWWW.', '..WWW..', '...Y...'], { W: '#d8ecff', L: '#ffffff', Y: '#ffe14a' }],
  shujin: [['BBBBBBB', 'BGBGBGB', 'BBBBBBB', 'GBGBGBG', 'BBBBBBB', 'BGBGBGB', 'BBBBBBB'], { B: '#4f78a8', G: '#9ccb98' }],
  bianzhong: [['DDDDDDD', 'D.Z.Z.D', 'DZZZZZD', 'DZZZZZD', 'DZZ.ZZD', 'D.....D', 'D.....D'], { D: '#5e3524', Z: '#c29a52' }],
  tongjing: [['..ZZZ..', '.ZLLLZ.', 'ZLLWLLZ', 'ZLLLLLZ', 'ZLLLLLZ', '.ZLLLZ.', '..ZZZ..'], { Z: '#7d5a2e', L: '#e0c080', W: '#fff6dc' }],
  bohe: [['...G...', '..GGG..', '.GGGGG.', 'G.GGG.G', '..GGG..', '...D...', '...D...'], { G: '#6fb05a', D: '#3f8a5e' }],
  hsb: [['..WWW..', '.WJJJW.', 'WJJ.JJW', 'WJ...JW', 'WJJ.JJW', '.WJJJW.', '..WWW..'], { W: '#f4f0e8', J: '#dde6c8' }],
};
const EST_ART = {
  shop: [['..XXX..', '.XXXXX.', 'XXXXXXX', '.RRRRR.', '.W.D.W.', '.W.D.W.', '.WWDWW.'], { X: '#4d4e57', R: '#b5312a', W: '#c7a574', D: '#5e3524' }],
  tavern: [['RR.....', 'RR.JJ..', 'R.JJJJ.', '..JJJJ.', '..JJJJ.', '...JJ..', '..JJJJ.'], { R: '#b5312a', J: '#8a5a3a' }],
  granary: [['...X...', '..XXX..', '.XXXXX.', '.WWWWW.', '.WYYYW.', '.WYYYW.', '.WWWWW.'], { X: '#4d4e57', W: '#c7a574', Y: '#e8c060' }],
  iron: [['.......', 'XXXXXX.', '.XXXXXX', '...XX..', '...XX..', '.XXXXX.', 'RR.....'], { X: '#6a6a78', R: '#e0513c' }],
  farm: [['GGGGGGG', 'E.E.E.E', 'GGGGGGG', 'E.E.E.E', 'GGGGGGG', 'E.E.E.E', 'GGGGGGG'], { G: '#6fb05a', E: '#8f6d48' }],
};
const DEC_ART = {
  office: [['..XXX..', '..XXX..', '.XXXXX.', 'GGGGGGG', '.J...J.'], { X: '#16121a', G: '#f0cc5c', J: '#a9c9a4' }],
  feast: [['.W.W.W.', '.......', 'RRRRRRR', 'RYYYYYR', '.RRRRR.', '..DDD..'], { W: '#f2ead4', R: '#b5312a', Y: '#f0cc5c', D: '#5e3524' }],
  motto: [['DDDDDDD', 'DYYYYYD', 'DY.Y.YD', 'DYYYYYD', 'DDDDDDD', '.D...D.'], { D: '#5e3524', Y: '#f0cc5c' }],
};
const icoOf = (pre, art, id) => ICON[pre + id] || (ICON[pre + id] = rows(art[id][0], art[id][1]));
const icoItem = id => icoOf('mw_', ITEM_ART, ITEM_ART[id] ? id : 'bi');
const icoEst = id => icoOf('es_', EST_ART, id);
const icoDec = id => icoOf('dc_', DEC_ART, id);

// ---------------------------------------------------------- hooks
function careerDefaults() {
  if (typeof W.merit !== 'number') W.merit = 0;
  if (W.patron === undefined) W.patron = null;
  if (W.job === undefined) W.job = null;
  if (!W.jobDone) W.jobDone = {};
  if (!Array.isArray(W.items)) W.items = [];
  if (W.stall === undefined) W.stall = null;
  if (!W.estates) W.estates = {};
  if (!W.estDown) W.estDown = {};
  if (W.motto === undefined) W.motto = null;
  // the errand's gold marks go on last, after other systems have replaced their actions
  lastHook('acts', jobGoldActs); lastHook('tab', jobGoldTab);
}
SYS.init.push(careerDefaults);
SYS.load.push(careerDefaults);
SYS.econ.push((inc, cost) => {
  const s = SALARY[W.rank] || 0; if (s) inc.push(['俸禄', s]);
  for (const k of estKinds()) inc.push([ESTATES[k].n + ((W.estDown[k] || 0) > W.t ? '（停）' : k === 'granary' && siegeOn() ? '（围城）' : k === 'shop' && siegeOn() ? '（围城减半）' : ''), estInc(k)]);
  // a granary feeds the house through the siege
  // (growth's 精打细算 already saved a fifth of that upkeep: nothing left to save)
  if (W.estates.granary && siegeOn()) { const i = cost.findIndex(x => x[0] === '家用'); if (i >= 0) { cost[i] = ['家用（吃粮仓）', 0]; const j = inc.findIndex(x => x[0] === '精打细算'); if (j >= 0) inc.splice(j, 1); } }
});
SYS.stat.push((c, i) => {
  if (c.id !== W.player || !W.items || !W.items.length) return 0;
  let b = 0; for (const id of W.items) { const it = MEIWU[id]; if (it && it.st && it.st[i] > b) b = it.st[i]; }
  return b;
});
// merit past the top rank there is to reach here: every MERIT_GIFT more, the patron sends a treasure (or fish, once the
// shelf has every kind); W.flags.mPaid is the merit already rewarded
const MERIT_GIFT = 50;
function meritGifts() {
  if (W.rank < 1 || nextNeed() !== null) { delete W.flags.mPaid; return; }
  const pa = patron(); if (W.flags.mPaid === undefined) W.flags.mPaid = W.merit || 0;
  while ((W.merit || 0) - W.flags.mPaid >= MERIT_GIFT) {
    W.flags.mPaid += MERIT_GIFT;
    const ids = Object.keys(MEIWU).filter(k => !MEIWU[k].rare && !MEIWU[k].use && !hasItem(k)), from = pa ? nm(pa) : '宫里';
    if (ids.length) gainItem(pick(ids), from + '赏的'); else { addFish(50, true); logLine(from + '赏了你 50 鱼干', '#ffe08a'); }
  }
}
SYS.season.push(() => {
  updPatron();
  if (W.items.length) W.prest = Math.min(Math.max(W.prest, ITEM_FAME), W.prest + itemPrest());
  if (W.flags.gifts) { for (const [t, id, why] of W.flags.gifts) if (W.t >= t) gainItem(id, why); W.flags.gifts = W.flags.gifts.filter(g => W.t < g[0]); if (!W.flags.gifts.length) delete W.flags.gifts; }
  // fame at the top takes keeping up: past 望族 and again past 名动天下 it fades one more a season (the core fades it past
  // 150), and past 150 a hundredth of the excess besides, so a great name has to be earned again and again
  if (W.prest > 300) W.prest--; if (W.prest > 500) W.prest--;
  if (W.prest > 150) W.prest -= Math.floor((W.prest - 150) / 100);
  if (W.estates.granary && siegeOn()) W.flags.stock = true;
  rollStall();
  meritGifts();
  // promotion and the door to a first rank come as cards (before any errand); declining one waits a while
  const x = nextPromo();
  if (x && promoReady() && !W.cool.promo && !W.queue.some(q => q.ev === x.ev)) { W.queue.push({ ev: x.ev }); W.cool.promo = 4; }
  const b = W.flags.act1Done && W.rank === 0 && !W.cool.pymenke && !W.queue.some(q => q.ev === 'pymenke') ? bestLord() : null;
  if (b && b[1] >= LORD_OP) { W.queue.push({ ev: 'pymenke', a: b[0].id }); W.cool.pymenke = 4; }
  // a merchant house this big is in 郭纵's way: he takes it as a rival (once, unless he is your friend)
  const gz = C('guozong');
  if (!W.flags.guoRival && inCity(gz) && (estKinds().length >= 2 || W.rank >= 2)) { W.flags.guoRival = true; if (!isRival(gz, P()) && !isFriend(gz, P()) && opinion(gz, P()) < 40) W.queue.push({ ev: 'guorival' }); }
  jobTick();
});
EV.guorival = () => {
  const gz = C('guozong'), p = P(); if (!inCity(gz) || !p || isFriend(gz, p) || isRival(gz, p)) return null;
  return { title: '同行', who: [gz.id], text: '郭纵在酒肆里对人说，狸家的生意做得太大，抢了他的饭碗。他的伙计开始在城里打听你家的事。',
    opts: [opt('「生意各做各的。」', ta(gz) + '成了你的宿敌', () => { if (typeof makeRival === 'function') makeRival(gz, p); else rel(gz, p).tag = 'rival'; }),
      opt('登门送一份礼', '鱼干-80 · ' + ta(gz) + '好感+20', () => { addFish(-80); addOp(gz, p, 20); }, () => W.fish >= 80)] };
};
// fire and theft: at most one card a year, 5% for each estate
SYS.yearly.push(() => { for (const k of estKinds()) if (!((W.estDown[k] || 0) > W.t) && chance(.05)) { W.queue.push({ ev: 'estfire', k }); break; } });
// the house motto: a 狸 kitten born after it was set takes it 30% of the time
SYS.life.push(c => {
  if (!W.motto || c.house !== 'li' || c.flags.motto !== undefined || c.born < (W.mottoT || 0) || !TR[W.motto]) return;
  c.flags.motto = 0;
  if (!chance(.3) || c.tr.includes(W.motto)) return;
  c.tr = c.tr.filter(t => t !== TR[W.motto].op); c.tr.push(W.motto); c.flags.motto = 1;
});
SYS.did.push((kind, t, st, ok) => {
  if (kind === 'lobby') { addMerit(2, '遣使'); chuxiuEnvoy(); }
  if (kind === 'talk' && t && chance(.25)) learnLike(t);
  if (kind === 'ask') { if (chance(.5)) hearLike(); if (!ok && W.estates.tavern) tavernTip('ask'); }
  if (kind === 'spy' && !ok && t && W.estates.tavern) tavernTip('spy', t);
  jobDid(kind, t, ok);
  jobCheck();
});
SYS.acts.push(giftMenu);
SYS.tab.push((tab, A) => {
  if (tab === 'market') {
    A.push(mkAct({ id: 'estate', n: '置产', ap: 0, open: true, hint: estKinds().length ? '产业每季 +' + estateIncome() : '置下产业，每季分红', fn: openEstates }));
    // what the stall has this season (the button is the way in; the thing on the stall is only to look at)
    const st = W.stall, it = st && MEIWU[st.id];
    if (it) A.push(mkAct({ id: 'stall', n: '名物 · ' + it.n, ap: 0, fish: st.p, open: true, hint: itemFx(st.id, !hasItem(st.id) && new Set(W.items).size < 3), fn: stallCard }));
  }
  if (tab === 'court') {
    A.push(adviseAct());
    if (W.rank >= 1 && W.kingId !== W.player) A.push(askJobAct());
    const ready = promoReady(), wait = W.cool.promo;
    A.push(mkAct({ id: 'decide', n: '大计', ap: 0, open: true, gold: ready && !wait, hint: ready ? (wait ? '求官 · 再等 ' + wait + ' 季' : '求官的条件齐了') : W.kingId && W.kingId === W.player ? '大宴 · 家谱 · 家训' : '求官 · 大宴 · 家谱 · 家训', fn: openDecisions }));
  }
  // the envoy takes a 楚绣 along
  const lb = tab === 'travel' && hasItem('chuxiu') && A.find(a => a.id === 'lobby');
  if (lb) lb.hint = lb.hint.replace(/^立嗣\+(\d+)/, (m, d) => '立嗣+' + (+d + 10) + '（楚绣）');
});
// your own card: fame tier, fame and merit (tap for the 功名 card); anyone else's: their taste, once you know it
const TIERC = ['#6a6268', '#4f78a8', '#3f8a5e', '#94562f', '#b5312a'];
SYS.sheet.push((c, rows) => {
  if (c.id === W.player) { const pt = prestTier(); rows.push({ chip: pt.n, col: TIERC[pt.i], text: '名望 ' + W.prest + ' · 功 ' + (W.merit || 0) + ' · ' + RANKS[W.rank] + ' ›', fn: openCareer }); return; }
  if (!alive(c) || !c.flags.likeK) return;
  const id = likeOf(c), it = MEIWU[id]; if (!it) return;
  rows.push({ chip: '好：' + it.k, col: '#3f8a5e', text: it.n + (hasItem(id) ? ' · 家里有一件' : '') });
});
SYS.goal.push(() => {
  const j = W.job, d = j && jobDef(j.id);
  // (after act one an errand about to run out goes before everything: missing it costs; in act one the story comes
  // first, and a missed errand costs less there, see endJob)
  // (in act one only its last season: the story's line keeps the goal until then)
  if (d) { const pg = jobProg(j); return { s: '差事：' + jobG(j) + (pg ? ' ' + pg : '') + ' · ' + jobWhen(j) + '（' + TABS[d.tab].n + '）', pri: !d.dueT && jobLeft(j) <= 1 ? 9 : 20 }; }
  if (promoReady() && !W.cool.promo) return { s: '目标：求官，升' + RANKS[nextPromo().to] + '（宫 · 大计）', pri: 25 };
  // money lying idle: land and shares pay every season (until you have looked at the 置产 list once)
  if (W.flags.act1Done && !W.flags.estSeen && W.fish >= 250 && estKinds().length < estMax() && Object.keys(ESTATES).some(k => !W.estates[k] && !estNo(k))) return { s: '目标：置产，每季分红（市）', pri: 88 };
  return null;
});
// the errand's row under the top-right widget
// (ROW_H tall; the floor lim keeps the rows off the scene's cats and the stall)
const ROW_H = 13;
const icoJob = () => ICON.job || (ICON.job = rows(['WWWWWWW', 'WLWWWLW', 'WWLWLWW', 'WWWRWWW', 'WWWWWWW'], { W: '#f2ead4', L: '#8a7a6a', R: '#e0513c' }));
SYS.rows.push((y, lim) => {
  const j = W.job, d = j && jobDef(j.id); if (!d || (lim && y + ROW_H - 1 > lim)) return 0;
  rect(118, y, 59, ROW_H - 1, 'rgba(22,18,26,.8)'); img(icoJob(), 119, y + 2);
  const late = !d.dueT && jobLeft(j) <= 1, pg = jobProg(j), tb = TABS[d.tab] ? TABS[d.tab].n : '';
  // (the tab it is done in, at the right edge)
  txt(fitT(d.title + ' ' + (pg ? pg + ' ' : '') + jobWhen(j), tb ? 39 : 47, 5.5), 129, y + 6, 5.5, late ? '#ff9a8a' : '#ffe08a', 'left', null);
  if (tb) txt(tb, 175, y + 6, 5.5, '#a8c8ff', 'right', null);
  hit(118, y, 59, ROW_H + 1, jobCard);
  return ROW_H;
});
// player card: the merit bar (y152–153) and the fame tier after the name; tap the rank line for the 功名 card
SYS.card.push(p => {
  const need = nextNeed(), base = RANK_NEED[W.rank] || 0, m = W.merit || 0;
  rect(42, 152, 94, 2, '#3a3040');
  if (need) rect(42, 152, R(94 * clamp((m - base) / (need - base), 0, 1)), 2, '#e8b040');
  else if (W.rank) rect(42, 152, 94, 2, '#7d5a2e');
  const pt = prestTier(), nx = R(42 + tw(nm(p), 8) + 4);
  if (nx + tw(pt.n, 5.5) < 138) { txt(pt.n, nx, 138.5, 5.5, pt.col, 'left', OUT); hit(nx - 2, 131, tw(pt.n, 5.5) + 5, 14, () => toast('名望 ' + W.prest + ' · ' + pt.n + '：众人好感+' + pt.op + ' · 提亲+' + tierWed(pt) + '%', '#c8e0ff')); }
  hit(40, 142, 54, 14, openCareer);
});
// scenes: the 博古架 at home, the treasure on the blue stall and the estates' pennants in the market
SYS.scene.push(tab => {
  if (tab === 'home') {
    const x = 34, y = 72;
    rect(x, y, 22, 25, OUT); rect(x + 1, y + 1, 20, 23, '#4a2e1e'); rect(x + 1, y + 11, 20, 1, PAL.ochre); rect(x + 1, y + 22, 20, 2, PAL.ochre);
    W.items.slice(0, 4).forEach((id, i) => img(icoItem(id), x + 1 + (i & 1) * 10, y + 2 + (i >> 1) * 11));
    hit(x, y, 22, 25, openTreasures);
  }
  if (tab === 'market') {
    estKinds().forEach((k, i) => { rect(10 + i * 9, 73, 1, 9, PAL.wood); rect(11 + i * 9, 73, 5, 4, (W.estDown[k] || 0) > W.t ? '#6a6268' : PAL.ochre); });
    // the treasure on the blue stall's counter, below the rows under the widget (the 市 tab's 名物 button buys it)
    const s = W.stall, it = s && MEIWU[s.id];
    if (it) { const y = 96 + R(Math.sin(T * 2.5)); img(icoItem(s.id), 152, y); txt(s.p, 150, y + 4.5, 5.5, '#ffe08a', 'right', OUT); }
  }
});
// ---- end career
