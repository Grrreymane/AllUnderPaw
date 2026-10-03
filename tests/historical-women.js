// Exercise actual creation, relationship actions, inheritance and save migration.
const assert = require('node:assert/strict');
let checks = 0;
const check = (v, why) => { assert.ok(v, why); checks++; };
const reset = () => { newGame(); state = 'game'; EV.prologue().opts[0].fx(); MODAL.length = 0; W.queue = []; W.flags.tourDone = true; };
reset();
check(Object.keys(WOMEN_CAST).length === 8, 'Eight distinct women have biographies and appearance schedules');
check(alive(C('ruji')) && alive(C('baqing')), 'The opening period already has new women, including a marriage candidate');
check(!C('lvzhi') && !C('yuji') && !C('xufu'), 'Later women are not spawned decades before their adulthood');
check(C('ruji').sp === 'anli' && C('anli').sp === 'ruji', 'Ru Ji starts with the recorded Wei court relationship');
check(!C('baqing').sp && canWed(C('baqing')), 'Ba Qing is a widow who can choose a new marriage');
const before = JSON.stringify(C('baqing'));
womenSync(); womenSync();
check(JSON.stringify(C('baqing')) === before, 'Repeated hooks leave an existing character untouched');
check(peopleActions().some(a => a.id === 'womenRoster'), 'The existing people tab exposes the roster');
openWomenRoster(); check(top().type === 'list' && top().rows.length === 8, 'The roster uses an ordinary paper list'); MODAL.length = 0;
for (const id of Object.keys(WOMEN_CAST)) {
  const d = WOMEN_CAST[id];
  check(d.born - d.enter >= 18, id + ' is an adult at first appearance');
  check(d.fact && d.adapt && d.source, id + ' separates documented history from game adaptation');
  const missing = C(id); if (missing) delete W.chars[id];
  W.t = bornAt(d.enter) - 1; womenSync(); check(!C(id), id + ' cannot appear before her entry season');
  W.t++; womenSync(); check(alive(C(id)) && ageOf(C(id)) >= 18 && characterArtKey(C(id)) === id, id + ' has a portrait on schedule');
  const c = C(id); c.dead = W.t; womenSync(); check(C(id) === c && !alive(c), id + ' is never resurrected on a season hook');
}
for (const i of [1, 2, 3, 4, 5]) {
  startScen(i); MODAL.length = 0; W.queue = [];
  for (const [id, d] of Object.entries(WOMEN_CAST)) {
    const expected = W.t >= bornAt(d.enter) && W.t < bornAt(d.last);
    check(!!C(id) === expected, 'Preset ' + i + ' creates exactly the women of its period: ' + id);
  }
  if (i === 2) check(C('liyuanmei').sp === 'kaolie', 'The 247 preset keeps Lady Li’s historical court marriage');
  if (i === 3) check(!C('liyuanmei').sp, 'The 237 preset makes Lady Li widowed rather than resurrecting King Kaolie');
  if (i === 5) check(C('lvzhi').sp === 'liuji' && C('liuji').sp === 'lvzhi', 'The Qin-collapse preset keeps Lu Zhi and Liu Ji together');
}
reset(); moveCity('shu'); W.ap = 3; W.fish = 100;
const woman = C('baqing'), visitor = W.flags.prologueKids.map(C).find(c => !c.female && c !== P());
visitor.born = W.t - 20 * 4; visitor.loc = 'home';
check(matchCands(visitor).includes(woman), 'The normal family matchmaker includes eligible historical women');
check(charActions(woman).some(a => a.id === 'propose') && charActions(woman).some(a => a.id === 'womenVisit'), 'Existing proposal and family-visit actions are reachable');
const op0 = woman.rel[visitor.id] ? woman.rel[visitor.id].op : 0, player0 = woman.rel[W.player] ? woman.rel[W.player].op : 0;
womenVisit(woman, visitor); const event = top(), gift = event.e.opts.find(o => o.t.includes('备礼'));
choose(event, gift);
check(W.fish === 70 && W.ap === 2, 'A real visit spends exactly one action and the selected gift');
check(woman.rel[visitor.id].op === op0 + 10 && (woman.rel[W.player] ? woman.rel[W.player].op : 0) === player0, 'Affection belongs to the selected family visitor, not automatically the head');
check(!womenVisitReady(woman, visitor) && !woman.sp && !woman.lov.includes(visitor.id), 'A social visit has a cooldown and does not force a romance or wedding');
gift.fx(); check(W.fish === 70 && W.ap === 2, 'A stale visit choice cannot charge twice');
W.cool[womenVisitKey(woman, visitor)] = 0; W.ap = 3;
womenVisit(woman, visitor); const stale = top().e.opts[0]; visitor.loc = 'daliang'; stale.fx();
check(W.ap === 3, 'A visitor leaving town invalidates a pending visit without cost'); MODAL.length = 0; visitor.loc = 'home';
const rng0 = Math.random; Math.random = () => 0;
try { propose(visitor, woman); } finally { Math.random = rng0; }
check(woman.sp === visitor.id && visitor.sp === woman.id, 'A successful normal proposal marries the named woman to the chosen family member');
const genes = JSON.stringify(woman.g); setPreg(woman, visitor.id); const pregnancy = JSON.stringify(woman.preg);
womenSync(); activateWorld(prepareWorld(decodeSave(JSON.stringify(W))));
check(JSON.stringify(C('baqing').g) === genes && JSON.stringify(C('baqing').preg) === pregnancy && C('baqing').sp === visitor.id, 'Save/load and roster migration preserve an existing marriage, pregnancy and genome');
const mom = C('baqing'), dad = C(visitor.id), idsBefore = new Set(Object.keys(W.chars)); giveBirth(mom);
const babies = Object.values(W.chars).filter(c => !idsBefore.has(c.id) && c.mom === mom.id);
check(babies.length > 0 && babies.every(c => c.bio === dad.id && c.dad === dad.id && !c.hist && !characterArtKey(c)), 'Her children use ordinary parent data, names and procedural portraits');
check(babies.every(c => ['B', 'D', 'A', 'S'].every(k => dad.g[k].includes(c.g[k][0]) && mom.g[k].includes(c.g[k][1]))), 'Children inherit actual alleles from both parents');
reset(); W.t = bornAt(219); const lover = a3Spawn('liuji', 'daliang'); lover.lov.push(W.player); P().lov.push(lover.id); womenSync();
check(!C('lvzhi').sp && lover.lov.includes(W.player), 'Adding Lu Zhi to an old world does not take an existing player lover away');
reset(); W.t = bornAt(209); womenSync(); moveCity('daliang');
const lu = C('lvzhi'); check(!charActions(lu).some(a => a.id === 'propose'), 'A married historical woman cannot be directly proposed to');
const oldGenes = JSON.stringify(C('yuji').g); C('yuji').g.O = ['o', 'o']; const changed = JSON.stringify(C('yuji').g); womenSync();
check(oldGenes !== changed && JSON.stringify(C('yuji').g) === changed, 'Existing world genes are never corrected to fit the illustration');
const dead = C('yuji'); dead.dead = W.t; womenSync(); check(C('yuji') === dead && !alive(dead), 'A dead added woman remains dead after migration');
console.log('Historical women:', checks, 'checks passed.');
done();
