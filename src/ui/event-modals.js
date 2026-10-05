// ============================================================ modals (event, character sheet, family, pickers)
const MODAL = [];
let state = 'title', T = 0;
const busy = () => MODAL.length > 0 || (W && W.queue.length > 0);
// a story card, the guide, a conversation card or a system window marked `hold` is up: the queue and the notices wait
const holding = () => MODAL.some(m => m.type === 'event' || m.type === 'tour' || m.type === 'talk' || m.hold);
function top() { return MODAL[MODAL.length - 1]; }
const drop = m => { const i = MODAL.indexOf(m); if (i >= 0) MODAL.splice(i, 1); };
// a new or loaded game starts with no windows, notices or scroll positions left from the last one
function resetScreen() { MODAL.length = 0; TOASTS.length = 0; TPEND.length = 0; PEOPLE_SCR.key = ''; SCR = NOSCR; }
function closeTop() { MODAL.pop(); }
// ro: only to look at (opened from a picker or a story card): no actions except 族谱
function openSheet(id, ro) { MODAL.push({ type: 'sheet', id, ro: !!ro }); SFX.page(); }
function openFamily(focus, ro) { MODAL.push({ type: 'family', focus: focus || null, ro: !!ro }); }
// info(c) -> { txt, col } is shown where the opinion number usually is (e.g. a marriage chance); tapping a portrait
// opens that cat's card to look at before choosing
// (when info also gives a number v, the rows are shown best first)
function pickChar(title, list, fn, info) {
  if (!list.length) { toast('没有合适的人选', '#dddddd'); return; }
  const v = c => { const r = info && info(c); return r && typeof r.v === 'number' ? r.v : 0; };
  MODAL.push({ type: 'pick', title, list: list.map(c => c.id), show: info ? list.slice().sort((a, b) => v(b) - v(a)).map(c => c.id) : null, fn, info });
}
// '成 N%' for marriage pickers (pc = c => wedP(…)); the best chances come first
const chanceInfo = pc => c => { const v = pc(c); return { txt: '成' + R(v * 100) + '%', v, col: v >= .6 ? '#276a32' : v >= .3 ? '#5f5236' : '#a0301f' }; };
// the chance of a yes as the pickers show it: with duel's second try counted in when it is there
const wedP = (f, c) => typeof wedOdds === 'function' ? wedOdds(f, c) : proposeChance(f, c);
// opts: [{ n, fn, s (subtitle), style }]
function pickOpt(title, opts) { MODAL.push({ type: 'opts', title, opts }); }
// A scrolling list window. rows (an array, or a function returning one so it stays live):
// { por: cat, icon: canvas, dot: colour, t, s, right, col, wrap, fn, act: action, close } ; opt { close, empty, sub, onClose }
function openList(title, rows, opt) { MODAL.push({ type: 'list', title, rows, opt: opt || {} }); SFX.page(); }
// an event-style card shown now instead of through the queue (a system's own result / decision card)
function showCard(e) { if (e && W) showEvent(e); }
function showEvent(e, eventId) {
  // trait options only appear for cats who have the trait (one per label)
  const mine = traitsOf(P()), seen = new Set();
  e.opts = (e.opts || []).filter(o => (!o.tr || mine.includes(o.tr)) && !seen.has(o.t) && seen.add(o.t));
  if (!e.opts.length) e.opts = [opt('好', '', () => {})];   // a card can always be closed
  if (e.pre) e.pre(); MODAL.push({ type: 'event', e, t0: T }); SFX.page();
  if (eventId) offerStoryCG(eventId, e);
}
// where the scheme rows were last drawn, for their one-step tip (set by intrigue's rows, shown by pumpQueue)
let TIPR = null;
const SCH_TIP = '这里是计谋的进度。金条是你在办的，红底是别人冲着你来的。点开看。';
// (only what is on screen now: the escape gold and 头功 are told on the 围城 card, when they begin to matter)
const RACE_TIP = '上两条：异人对你、对吕不韦的好感。下条是立嗣功劳：金是你，紫是吕。';
function pumpQueue() {
  // story cards also wait for a conversation card (so its line and heart are seen) and for a system's hold window
  if (!W || holding()) return;
  if (!W.queue.length && !MODAL.length && !W.flags.tourDone && W.flags.elder) { W.loc = 'home'; MODAL.push({ type: 'tour', i: 0 }); return; }
  // the 立嗣 race widget gets a one-step introduction the first time it matters
  if (!W.queue.length && !MODAL.length && W.flags.tourDone && W.flags.metYiren && !W.flags.raceTip && W.act === 1 && !W.flags.act1Done && alive(C('yiren'))) {
    W.flags.raceTip = true; W.loc = 'home'; MODAL.push({ type: 'tour', i: 0, steps: [[[118, 19, 59, 45], RACE_TIP.replace(/异人/g, nm(C('yiren')))]] }); return;
  }
  if (!W.queue.length && !MODAL.length && W.flags.tourDone && TIPR && !W.flags.schTip && W.loc !== 'people') { W.flags.schTip = true; MODAL.push({ type: 'tour', i: 0, steps: [[TIPR, SCH_TIP]] }); TIPR = null; return; }
  // (a builder may open a window of its own instead of returning a card, like the 季报: the rest wait under it)
  while (W.queue.length && !holding()) {
    const q = W.queue.shift(), b = EV[q.ev];
    const e = b ? b(q) : null;
    if (e) { showEvent(e, q.ev); return; }
  }
}
function choose(m, o) {
  if (o.ok && !o.ok()) { SFX.no(); toast((o.no && o.no()) || '条件不够', '#ff9a8a'); return; }
  MODAL.splice(MODAL.indexOf(m), 1);
  for (const id of m.e.who || []) if (id !== W.player) note(C(id), m.e.title + '：' + o.t);
  historyResolveChoice(m.e, o, () => {
    o.fx && o.fx();
    if (m.e.post) m.e.post();
  });
  saveGame();
}
