// Runs inside the CURRENT index.html closure, with isolated storage and a seeded RNG.
const assert = require('node:assert/strict');
let assertions = 0;
const check = (value, message) => { assert.ok(value, message); assertions++; };
function settleTest(random = false) {
  for (let n = 0; n < 300; n++) {
    pumpQueue(); const m = top(); if (!m) return;
    if (m.type === 'event') { const options = m.e.opts.filter(x => !x.ok || x.ok()), o = random ? pick(options) : options[0]; check(o, 'Event has a legal option: ' + m.e.title); choose(m, o); }
    else if (m.type === 'duel') { MODAL.pop(); duelReport(m, false); }
    else if (m.type === 'pick') { MODAL.pop(); const c = m.list.map(C).find(alive); if (c) m.fn(c); }
    else if (m.type === 'opts') { MODAL.pop(); if (m.opts[0]) m.opts[0].fn(); }
    else { MODAL.pop(); if (m.type === 'tour') W.flags.tourDone = true; }
  }
  throw new Error('Event queue did not settle');
}
function invariant() {
  check(!!P(), 'Head exists');
  check(alive(P()), 'Head is alive after settling succession');
  check(Number.isFinite(W.fish) && W.fish >= 0, 'Fish stays finite and nonnegative');
  check(Number.isFinite(W.ap) && W.ap >= 0, 'Energy stays finite and nonnegative');
  check(W.chronicle.events.length <= 300, 'Journal is bounded');
  check(!!decodeSave(JSON.stringify(W)), 'Current world round-trips through save validation');
}
newGame(); state = 'game'; settleTest();
check(saveGame(), 'Initial save succeeds');
const first = localStorage.getItem(SAVE + 'w');
const headId = W.player;
check(W.chronicle.events.some(e => e.kind === 'succession' && e.head === headId), 'First head recorded');
const trade = tabActions('market')[0];
MODAL.length = 0; W.ap = 2; HITS = []; hit(0, 20, 20, 20, () => trade.fn()); onTap({ x: 10, y: 25 });
settleTest(); if (SAVE_STATUS.pending) saveGame();
check(JSON.parse(localStorage.getItem(SAVE + 'w')).fish === W.fish, 'A normal player action is saved without ending the season');
const beforeSeason = localStorage.getItem(SAVE + 'w');
endSeason();
check(localStorage.getItem(SAVE + 'w_bak') === beforeSeason, 'Previous season retained as backup');
settleTest(); saveGame();
const latest = localStorage.getItem(SAVE + 'w'), backup = localStorage.getItem(SAVE + 'w_bak');
const originalSet = localStorage.setItem;
localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
W.fish += 11;
check(!saveGame() && !!SAVE_STATUS.error, 'Write failure is surfaced');
check(localStorage.getItem(SAVE + 'w') === latest, 'Write failure retains last checkpoint');
check(localStorage.getItem(SAVE + 'w_bak') === backup, 'Write failure retains backup');
localStorage.setItem = originalSet;
check(saveGame() && !SAVE_STATUS.error, 'Successful retry clears warning');
const beforePending = localStorage.getItem(SAVE + 'w');
const dialog = { type: 'opts', opts: [{ n: 'choose', fn: () => {} }] }; MODAL.push(dialog); W.fish += 17;
check(!saveGame() && SAVE_STATUS.pending, 'Callback choice defers saving');
check(localStorage.getItem(SAVE + 'w') === beforePending, 'Unresolved choice does not overwrite checkpoint');
MODAL.pop(); update(0);
check(JSON.parse(localStorage.getItem(SAVE + 'w')).fish === W.fish, 'Deferred save flushes when choice completes');
settleTest(); saveGame();
const current = W, currentRaw = localStorage.getItem(SAVE + 'w');
const beforeImportBackup = localStorage.getItem(SAVE + 'w_bak');
localStorage.setItem = (key, value) => { if (key === SAVE + 'w') throw new Error('quota'); originalSet(key, value); };
assert.throws(() => replaceWorld(first)); assertions++;
check(W === current && localStorage.getItem(SAVE + 'w') === currentRaw && localStorage.getItem(SAVE + 'w_bak') === beforeImportBackup, 'Failed import rolls back backup and leaves live world untouched');
localStorage.setItem = originalSet;
for (const bad of ['{', '{}', JSON.stringify({ ...W, v: 999 }), JSON.stringify({ ...W, player: 'missing' }), JSON.stringify({ ...W, fish: 'bad' }), '{"__proto__":{}}']) {
  assert.throws(() => replaceWorld(bad)); assertions++;
  check(W === current && localStorage.getItem(SAVE + 'w') === currentRaw, 'Invalid import leaves current game untouched');
}
const old = JSON.parse(first); old.v = 1; delete old.chronicle;
const migrated = prepareWorld(decodeSave(JSON.stringify(old)));
check(migrated.v === 2 && migrated.chronicle.from === migrated.t, 'Legacy v1 save migrates and starts journal at its real date');
check(W === current, 'Previewing a legacy import does not replace live world');
replaceWorld(JSON.stringify({ format: 'all-under-paw', version: 1, world: old }));
check(W.player === old.player && W.t === old.t, 'Export envelope imports');
check(localStorage.getItem(SAVE + 'w_bak') === currentRaw, 'Import preserves previous world');
const restoreRaw = localStorage.getItem(SAVE + 'w_bak'); replaceWorld(restoreRaw);
check(W.t === current.t && W.fish === current.fish, 'Backup can be restored');
localStorage.setItem(SAVE + 'w', '{broken');
check(!loadGame(), 'Corrupt main save is rejected');
replaceWorld(localStorage.getItem(SAVE + 'w_bak'));
check(saveReady(), 'A valid backup still recovers from a corrupt main save');
for (let i = 0; i < SCEN.length; i++) {
  startScen(i); settleTest();
  check(W.t === SCEN[i].t, 'Scenario reaches its intended date: ' + SCEN[i].n);
  if (i) check(W.chronicle.from === W.t && !W.chronicle.events.length, 'Later scenario does not claim stand-in choices as player memories');
  if (i) {
    check(W.fish === SCEN[i].fish, 'Preset starts with exact published funds');
    check(C('zheng').mom === 'zhaoji' && C('zheng').bio === 'lv' && C('zheng').dad === 'yiren', 'Preset has canonical hidden parentage');
    check(!W.flags.liBride && C(W.flags.prologueKids[1]).sp !== 'yiren', 'Preset does not marry the Li sister to Yiren');
    check(!W.art || !Object.keys(W.art.seen).length, 'Preset does not unlock unseen CG');
    check(!W.a3.banBy && W.lastEcon === null, 'Preset has no accidental exile or stale economic report');
    if (i === 2) check(W.a2.xiang === 'lv' && W.a2.zhongfu === 'lv' && W.rank === 2, 'Lu holds the historical offices, not the player');
    if (i >= 4) check(W.a3.uni === 164 && A3_RK.every(k => W.realm[k].fallen === A3_REALM[k].fallT), 'Unification preset follows historical catalogue dates');
  }
  invariant(); openObjective(); render(); MODAL.length = 0; openChronicle(); render(); MODAL.length = 0;
  for (let season = 0; season < 12; season++) { W.ap = Math.max(1, W.ap); tabActions('market')[0].fn(); settleTest(); endSeason(); settleTest(); }
  invariant(); check(saveGame(), 'Scenario saves'); const t = W.t; check(loadGame() && W.t === t, 'Scenario reloads');
}
// Loading a later preset must not advance seasons or reuse a previously mutated world.
const savedEndSeason=endSeason;
endSeason=()=>{throw Error('Preset selection must not simulate seasons');};
startScen(2); const presetHead=W.player; W.fish=999999; C('zheng').mom=W.flags.prologueKids[1];
startScen(2); check(W.fish===450 && W.player===presetHead && C('zheng').mom==='zhaoji','Preset loading deep-copies an immutable start');
endSeason=savedEndSeason;
startScen(3); settleTest();
const previousKing = W.kingId; W.kingId = W.player;
check(!chapterContext().text.includes('封列侯'), 'King receives a ruling objective rather than a minister reward');
W.kingId = previousKing;
const realm = A3_RK.find(k => !rFallen(k));
check(!!realm, 'A realm remains for conquest test');
const gong = W.a3.gong || 0;
fallRealm(realm, 'yield');
check(W.a3.gong === gong + 1, 'Surrender increments actual player contribution');
check(W.chronicle.events.some(e => e.kind === 'realm' && e.text.includes('你劝降')), 'Conquest journal distinguishes player action');
settleTest();
for (let i = 0; i < 350; i++) chronicle('choice', '决策' + i, '选择' + i);
check(W.chronicle.events.filter(e => e.kind === 'choice').length === 180, 'Repeated choices have a separate cap');
check(W.chronicle.events.some(e => e.kind === 'realm'), 'Choices do not evict conquests');
startScen(0); settleTest();
const initialHead = W.player;
for (let s = 0; s < 260; s++) {
  if (W.ap > 0) { tabActions('market')[0].fn(); settleTest(); }
  endSeason(); settleTest();
  if (s % 40 === 0) invariant();
}
invariant();
check(W.player !== initialHead, 'Long run crosses a generation');
check(W.t === 260, 'Long run crosses all historical acts');
check(saveGame() && loadGame(), 'Long-run world reloads');
const dynastyBackup = localStorage.getItem(SAVE + 'w');
localStorage.setItem(SAVE + 'w_bak', dynastyBackup);
startScen(0); settleTest(); saveGame();
check(localStorage.getItem(SAVE + 'w_bak') === dynastyBackup, 'Opening succession does not immediately erase the previous dynasty backup');
for (let s = 0; s < 100; s++) {
  if (W.ap > 0) { const actions = tabActions(pick(TAB_ORDER)).filter(a => a.ap && (!a.ok || a.ok())); const a = pick(actions); if (a) a.fn(); settleTest(true); }
  endSeason(); settleTest(true); if (s % 20 === 0) invariant();
}
invariant(); check(saveGame() && loadGame(), 'Random decisions remain saveable');
console.log('PASS: ' + assertions + ' checks; six scenarios, save failure/recovery, 260-season succession and 100 seasons of random decisions.');
