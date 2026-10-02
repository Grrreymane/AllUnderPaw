// Injected into the game closure by tools/headless.cjs.
const assert = require('node:assert/strict');
let checks = 0;
const check = (ok, why) => { assert.ok(ok, why); checks++; };
function fresh() { newGame(); state = 'game'; MODAL.length = 0; W.queue.length = 0; }
function last() { return W.historyEffects.events[W.historyEffects.events.length - 1]; }
function resolve(title, label, fn, who) {
  const option = opt(label, '提示鱼干-999 · 可能获胜', fn);
  historyResolveChoice({ title, who: who || [], opts: [option, opt('不办', '', () => {})] }, option, fn);
}
fresh();
W.fish = 20; W.prest = 2;
resolve('实付校验', '试一试', () => { addFish(-50); addPrest(-10); });
check(last().text.includes('小鱼干净变动-20') && last().text.includes('名望净变动-2'), 'Clamped actual net settlement is recorded');
check(!last().text.includes('999') && !last().text.includes('可能获胜'), 'Hints and odds are not reported as realized results');
check(W.chronicle.events.at(-1).text === last().text, 'Existing chronicle receives realized choice text');
// No snapshot reads private biological parentage, even if it is impossible to access.
const hidden = P();
Object.defineProperty(hidden, 'bio', { configurable: true, get() { throw new Error('Private biological field leaked'); } });
resolve('公开结果', '继续', () => addPrest(1));
check(last().text.includes('名望净变动+1'), 'Observation needs no hidden parentage');
delete hidden.bio;
// Deferred pick/duel result: pay now, outcome later; never account for either twice.
W.fish = 200; W.prest = 50;
resolve('议价', '找个人谈', () => { addFish(-30); MODAL.push({ type: 'pick' }); });
check(last().text.includes('小鱼干净变动-30') && last().text.includes('尚未结束'), 'Pending picker records only immediate cost');
const count = W.historyEffects.events.length;
addPrest(6); historyFlushPending();
check(W.historyEffects.events.length === count, 'Pending result waits while a blocking picker exists');
MODAL.length = 0; historyFlushPending();
check(last().title === '议价·后续' && last().text.includes('名望净变动+6') && !last().text.includes('小鱼干'), 'Picker completion records only the later delta');
const complete = W.historyEffects.events.length; historyFlushPending();
check(W.historyEffects.events.length === complete, 'Flush is idempotent');
resolve('再议价', '再挑一次', () => MODAL.push({ type: 'opts' }));
addFish(-7); saveGame();
check(last().title === '再议价' && !last().text.includes('小鱼干净变动-7'), 'The save hook does not flush unresolved ordinary opts windows');
MODAL.length = 0; openList('只读资料', [], {}); saveGame();
check(last().title === '再议价·后续' && last().text.includes('小鱼干净变动-7'), 'Read-only lists allow the completed action to settle and save');
MODAL.length = 0;
resolve('不再挑选', '看看人选', () => MODAL.push({ type: 'pick' }));
MODAL.length = 0; historyFlushPending();
check(last().title === '不再挑选·后续' && last().text.includes('后续处置已结束'), 'Cancellation with no numerical change still closes its pending record');
resolve('尚未结束的旧世界', '等待', () => MODAL.push({ type: 'pick', hold: true }));
fresh(); addPrest(50); historyFlushPending();
check(W.historyEffects.events.length === 0, 'Pending snapshots never attach to a replacement world');
// Actual choose(), rather than only the lower-level wrapper, writes one settled result.
const actualOption = opt('支付', '鱼干-5', () => addFish(-5));
showCard({ title: '真实选择结算', who: [], opts: [actualOption, opt('不支付', '', () => {})] });
choose(top(), actualOption);
check(last().title === '真实选择结算' && last().text.includes('小鱼干净变动-5') && W.chronicle.events.filter(e => e.title === '真实选择结算').length === 1, 'The integrated choose hook records one actual result');
fresh(); W.fish = 1000;
resolve('换季前议价', '选择货物', () => { addFish(-10); MODAL.push({ type: 'pick' }); });
MODAL.length = 0; addFish(-7); endSeason();
const beforeSeason = W.historyEffects.events.find(e => e.title === '换季前议价·后续');
check(beforeSeason && beforeSeason.t === 0 && beforeSeason.text.includes('小鱼干净变动-7'), 'Closing a picker and advancing immediately settles before next-season income');
// Military fixtures use actual action functions, overriding only success checks/RNG.
function realmFixture() {
  fresh(); W.flags.act1Done = true; W.act = 3; W.t = 120; W.city = 'xianyang'; W.loc = 'home'; W.rank = 3; W.ap = 20; W.fish = 1000; W.prest = 50;
  W.a3 = W.a3 || {}; W.a3.guo = 100; W.a3.uni = null; W.realm = null; a3Realm();
  P().loc = 'home'; W.cool = {};
}
realmFixture();
const oldChk = chk; chk = () => true;
const oldStrength = W.realm.han.s;
a3Jian('han');
check(W.realm.han.s === oldStrength - 8 && last().realms.includes('han') && last().text.includes('韩实力净变动-8'), 'Successful actual intrigue records its concrete state impact');
check(last().text.includes('小鱼干净变动-150'), 'Intrigue records actual gold spent');
W.cool = {}; W.ap = 20; chk = () => false;
a3Jian('wei');
check(last().text.includes('小鱼干净变动-150') && last().text.includes('名望净变动-3') && !last().text.includes('魏实力净变动'), 'Failed intrigue cannot become a fictitious weakening');
chk = () => true; W.cool = {}; W.ap = 20;
a3Hao('qi');
check(last().text.includes('与齐结好至') && W.realm.qi.friend === W.t + 16, 'Diplomacy records the real pact expiration');
W.realm.han.s = 1; W.cool = {}; W.ap = 20;
a3Xiang('han');
const fall = W.historyEffects.falls.find(e => e.k === 'han');
check(fall && fall.source === 'player' && fall.text.includes('狸家主持劝降') && fall.text.includes('灭国之功记在狸家'), 'Actual surrender receives direct conquest credit');
check(fall.text.includes('离间韩') && fall.text.includes('韩实力净变动-8') && fall.text.includes('劝降韩'), 'Fall summary includes both previous actions and the settling action');
check(fall.text.includes('不能只归因于狸家'), 'Contribution chronology does not claim a unique causal explanation');
const oldFalls = W.historyEffects.falls.length; fallRealm('han', 'ai');
check(W.historyEffects.falls.length === oldFalls, 'Repeated conquest calls cannot duplicate summaries');
fallRealm('wei', 'ai');
const wei = W.historyEffects.falls.find(e => e.k === 'wei');
check(wei.source === 'world' && wei.text.includes('没有记作狸家') && wei.text.includes('名望净变动-3'), 'Automated conquest stays world progress even after a failed player action');
chk = oldChk;
// Soldiers are recorded by observed deaths/returns, not by the battle win flag alone.
realmFixture();
const c = family().find(c => c !== P()); c.loc = 'away'; c.flags.army = 1;
const oldRandom = Math.random; Math.random = () => .01;
a3ArmyKids(true);
check(!alive(c) && last().text.includes(nm(c) + '身亡'), 'A victorious campaign can still record an actual family death');
const survivor = family().find(c => c !== P()); survivor.loc = 'away'; survivor.flags.army = 1;
Math.random = () => .95; a3ArmyKids(false); Math.random = oldRandom;
check(alive(survivor) && last().text.includes(nm(survivor) + '从军中生还') && last().text.includes('名望净变动+10'), 'A losing campaign can still record a survivor and actual merit return');
// A public future danger must not be called a death until die really happens.
realmFixture(); spawnLimu(); const lm = C('limu');
if (!lm) throw new Error('Scenario fixture needs Li Mu');
lm.dead = null; lm.dieT = null;
resolve('郭开的金子', '送一箱金子去', () => { addFish(-150); lm.dieT = W.t + 2; }, ['limu']);
check(last().text.includes('面临死期') && !last().text.includes('身亡') && W.historyEffects.pendingDeaths.length === 1, 'Promised assassination is stored as a danger, not an already completed death');
W.t += 2; die(lm, true);
check(last().title === '郭开的金子·人命后果' && last().text.includes('李牧身亡') && W.historyEffects.pendingDeaths.length === 0, 'Actual later death resolves its earlier dated danger');
// A direct action that closes a pending picker must not also be counted at frame end.
realmFixture(); chk = () => true;
resolve('先选目标', '继续', () => MODAL.push({ type: 'pick', hold: true }));
MODAL.length = 0; a3Jian('han'); historyFlushPending(); chk = oldChk;
check(W.historyEffects.events.filter(e => e.text.includes('小鱼干净变动-150')).length === 1, 'Named action and pending-modal bookkeeping cannot double count one payment');
// Old saves start with empty evidence, and strict saved shape validation rejects corruption.
delete W.historyEffects; historyDefaults();
check(W.historyEffects.from === W.t && !W.historyEffects.events.length, 'Old save migration does not invent past player contributions');
check(validateHistoryEffects(W), 'New history round-trips validation');
const corrupt = JSON.parse(JSON.stringify(W)); corrupt.historyEffects.events.push({ id: 1, t: 0, title: 'x' });
assert.throws(() => validateHistoryEffects(corrupt)); checks++;
for (let i = 0; i < HISTORY_LIMIT + 20; i++) historyAppend({ title: '记录' + i }, '已结算。', []);
check(W.historyEffects.events.length === HISTORY_LIMIT && validateHistoryEffects(W), 'Result history has a bounded validated save size');
const historyBefore = JSON.stringify(W.historyEffects);
SAVE_SUSPENDED++; resolve('预设生成', '继续', () => addPrest(1)); SAVE_SUSPENDED--;
check(JSON.stringify(W.historyEffects) === historyBefore, 'Preset construction and suspended saves generate no play history');
CATCHUP++; resolve('追补史实', '继续', () => addPrest(1)); CATCHUP--;
check(JSON.stringify(W.historyEffects) === historyBefore, 'Historical catchup generates no fictitious decisions');
MODAL.length = 0; openGenerationHistory(); check(top().type === 'list' && top().title === '历代家主', 'Generation entry uses the existing paper list');
MODAL.length = 0; openWorldEffects(); check(top().type === 'list' && top().title === '天下影响' && top().rows.length === 6, 'World effects entry uses the existing six-state paper list');
console.log('History effects: ' + checks + ' checks passed.');
