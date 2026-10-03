// End-to-end family politics checks, injected into the game closure by tools/headless.cjs.
const assert = require('node:assert/strict');
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks++; };
function fixture() {
  newGame(); state = 'game'; MODAL.length = 0; W.queue = []; W.t = 80; W.act = 2; W.flags.act1Done = true; W.city = 'xianyang'; W.fish = 200;
  const p = mkc({ id: 'kphead', name: '家主', house: 'li', born: -100, loc: 'home', role: 'merchant', tr: [] }); W.player = p.id;
  const g = mkc({ id: 'kpgrand', name: '外祖', born: -180, hist: true, immortal: true, loc: 'xpalace', role: 'general', tr: [] });
  const w = mkc({ id: 'kpspouse', name: '妻', female: true, born: -90, dad: g.id, loc: 'home', tr: [] }); g.kids.push(w.id);
  marry(p, w);
  const a = mkc({ id: 'kpson', name: '长子', house: 'li', mom: w.id, dad: p.id, bio: p.id, born: 0, loc: 'home', tr: [] });
  const b = mkc({ id: 'kpsecond', name: '次子', house: 'li', mom: w.id, dad: p.id, bio: p.id, born: 8, loc: 'home', tr: [] });
  p.kids.push(a.id, b.id); w.kids.push(a.id, b.id);
  const kg = mkc({ id: 'kpking', name: '王', born: -160, loc: 'xpalace', role: 'ruler', hist: true, immortal: true, tr: [] }); W.kingId = kg.id;
  // This fixture jumps twenty years without season hooks; bring scheduled arrivals up to date.
  womenSync(); kinInvalidate(); return { p, g, w, a, b, kg };
}
let F = fixture();
check(heirNow() === F.a, 'Baseline legal heir is eldest adult son');
check(kinPublicTie(F.g, F.p).n === 8, 'A current marriage connects the head and spouse father');
check(kinPublicTie(F.g, F.a).n === 8, 'Public grandchildren receive the strongest live marriage or kinship connection');
check(kinBackers(F.a).some(b => b.c === F.g), 'The next generation has visible external backers');
check(kinActivePledges().length === 0, 'Marriage itself creates no inheritance promise');
const legalOrder = succCands(F.p).map(x => x[0].id).join();
const beforeRead = JSON.stringify(W);
for (let i = 0; i < 10; i++) { kinPoliticsScore(F.g, F.p); kinBackers(F.a); kinSuccessionHint(F.b); kinAgenda(); }
check(JSON.stringify(W) === beforeRead, 'Reading political and heir information never mutates the world');
const promise = kinPromise(F.g, F.b);
check(promise && heirNow() === F.a && W.law === '嫡长', 'Promising a younger candidate does not rewrite the law');
check(succCands(F.p).map(x => x[0].id).join() === legalOrder, 'Foreign support does not silently reorder candidates');
check(kinPoliticsScore(F.g, F.p) === 14, 'A negotiated promise has a separate bounded political effect');
check(kinSuccessionHint(F.b).includes('守约') && kinSuccessionHint(F.a).includes('失约'), 'Succession choices reveal actual promise consequences');
check(kinAgenda().text.includes('次子') && kinAgenda().text.includes('长子'), 'The goal explains who was promised and who is currently heir');
check(!kinPromise(F.g, F.a) && kinActivePledges().length === 1, 'A sponsor cannot be farmed into duplicate promises');
F.p.dead = W.t;
takeOver(F.p, F.b, F.a);
check(W.player === F.b.id && promise.status === 'kept', 'Actual takeOver resolves a dead head’s promise');
check(memoOf(F.g, F.b, '继承守约') === 15, 'Keeping a promise grants the new head a lasting memory');
check(W.kinPolitics.effects.some(e => e.to === F.b.id && e.from === F.g.id && e.n === 12), 'Support is attached to the new head for six years');
const once = JSON.stringify(W.kinPolitics.effects); kinOnSuccession(F.p, F.b);
check(JSON.stringify(W.kinPolitics.effects) === once, 'Repeated succession handling cannot duplicate rewards');
W.t += KIN_TERM; kinSeason();
check(!W.kinPolitics.effects.length && kinPoliticsScore(F.g, F.b) === 6, 'Temporary backing expires while public kinship remains');

F = fixture(); const broken = kinPromise(F.g, F.b); F.p.dead = W.t;
takeOver(F.p, F.a, F.a);
check(broken.status === 'broken' && memoOf(F.g, F.a, '继承失约') === -25, 'Choosing another heir produces a real cost');
check(kinPoliticsScore(F.g, F.a) < 0 && F.b.disc >= 25, 'The disappointed backer resists the new head and the passed-over claimant remembers');
kinOnSuccession(F.p, F.a);
check(W.kinPolitics.effects.length === 1, 'Breaking one promise is penalized only once');

F = fixture(); const hiddenBefore = [kinPublicTie(F.g, F.p).n, kinPoliticsScore(F.g, F.p), kinBackers(F.a).map(x => x.c.id).join(), kinSuccessionHint(F.a)].join('|');
const secretDad = mkc({ id: 'kphidden', name: '秘密生父', born: -120, hist: true, loc: 'xpalace', role: 'minister' });
F.a.bio = secretDad.id; addSecret('bastard', F.w.id, secretDad.id, F.a.id); secretDad.kids.push(F.a.id); kinInvalidate();
check([kinPublicTie(F.g, F.p).n, kinPoliticsScore(F.g, F.p), kinBackers(F.a).map(x => x.c.id).join(), kinSuccessionHint(F.a)].join('|') === hiddenBefore, 'Unknown biological father changes no public support or text');
check(!kinBackers(F.a).some(x => x.c === secretDad), 'Secret father is not exposed as a political backer');
check(kinPublicTie(secretDad, F.a).n === 0, 'Hidden biological relation creates no public court bonus');
F.a.flags.bastard = true; kinInvalidate();
check(heirNow() === F.b, 'Existing law still handles publicly disputed birth');

F = fixture(); divorce(F.p, F.w, true);
check(kinPublicTie(F.g, F.p).n === 4, 'Divorce weakens a marriage to public descendants, rather than erasing their family');
F.a.dead = F.b.dead = W.t; kinInvalidate();
check(kinPublicTie(F.g, F.p).n === 0, 'Without surviving descendants or marriage, the tie ends');
const grandchild = mkc({id:'kpgrandchild',name:'孙辈',dad:F.a.id,born:W.t-4,loc:'home',house:'li'}); kinInvalidate();
check(kinPublicTie(F.g, F.p).n === 4, 'A surviving public grandchild continues a deceased child’s family bridge');
grandchild.dead = W.t; kinInvalidate();
check(kinPublicTie(F.g, F.p).n === 0, 'A fully ended descendant line no longer supplies political influence');
F = fixture(); F.w.dead = W.t; F.p.sp = null; kinInvalidate();
check(kinPublicTie(F.g, F.p).n === 4, 'Widowhood preserves only the weaker public-descendant connection');

F = fixture(); const dispute = kinPromise(F.g, F.a); W.law = '择贤'; W.heirId = F.b.id; kinOnHeirChange();
check(dispute.disturbed && kinPoliticsScore(F.g, F.p) === 2, 'Changing heir turns support into pressure without changing the law back');
kinSeason(); kinSeason();
check(W.queue.filter(q => q.ev === 'kin_dispute').length === 1, 'A disagreement queues one event, not one per frame or season');
const de = EV.kin_dispute({ head: F.p.id, p: dispute.id });
check(de && de.opts.some(o => o.t.includes('备礼')), 'Dispute offers compensation as a real alternative');
const pay = de.opts.find(o => o.t.includes('备礼')); const fish0 = W.fish;
pay.fx();
check(dispute.status === 'released' && W.fish === fish0 - 60, 'Negotiated release costs the stated funds and closes the promise');
pay.fx(); check(W.fish === fish0 - 60, 'An already resolved choice cannot charge twice');
check(!EV.kin_dispute({ head: F.p.id, p: dispute.id }), 'Stale dispute cards cannot resolve a closed promise');

// A promise can conflict from the moment it is made, without a later change to the legal heir.
F = fixture(); const freshConflict = kinPromise(F.g, F.b); openKinPolitics();
const negotiationRow = top().rows.find(r => r.t.startsWith(freshConflict.sponsorName + '支持' + freshConflict.candidateName));
check(!freshConflict.disturbed && negotiationRow.close && typeof negotiationRow.fn === 'function', 'A newly conflicting promise has a working manual negotiation entry');
negotiationRow.fn();
const manualEvent = top().e; manualEvent.opts.find(o => o.t.includes('备礼')).fx();
check(freshConflict.status === 'released' && W.fish === 140 && heirNow() === F.a, 'The visible manual entry reaches paid release without changing legal inheritance');
F = fixture(); const restated = kinPromise(F.g, F.b);
W.queue.push({ev:'kin_dispute',p:restated.id,head:W.player});
EV.kin_dispute({head:W.player,p:restated.id}).opts.find(o => o.t.includes('旧约仍在')).fx();
W.t += 13; kinSeason();
check(restated.status === 'active' && !restated.disturbed && !W.queue.some(q => q.ev === 'kin_dispute') && !!EV.kin_dispute({head:W.player,p:restated.id}),
  'Restating a conflict clears queued disputes and avoids seasonal repetition while retaining manual negotiation');

F = fixture(); let req = EV.kin_request({ head: F.p.id, g: F.g.id, k: F.b.id });
check(req && req.opts.length === 4, 'An alternate candidate offers promise, lawful compromise, education, and refusal');
const lawful = req.opts.find(o => o.t.includes('备礼')); lawful.fx();
check(kinActivePledges()[0].candidate === F.a.id && W.fish === 140 && heirNow() === F.a, 'Paying to support the lawful heir records exactly that promise');
check(!EV.kin_request({ head: F.p.id, g: F.g.id, k: F.b.id }), 'A promised sponsor is not immediately asked for another pledge');
F = fixture(); req = EV.kin_request({ head: F.p.id, g: F.g.id, k: F.b.id }); req.opts[req.opts.length - 1].fx();
check(!kinActivePledges().length && W.kinPolitics.cool[F.g.id] > W.t, 'Refusal records no secret promise and has a cooldown');
F = fixture(); req = EV.kin_request({ head: F.p.id, g: F.g.id, k: F.b.id }); W.fish = 0; req.opts.find(o => o.t.includes('备礼')).fx();
check(!kinActivePledges().length && W.fish === 0, 'Insufficient funds cannot buy a hidden commitment');

F = fixture(); const cancelled = kinPromise(F.g, F.b); F.b.dead = W.t; kinSeason();
check(cancelled.status === 'void' && !W.kinPolitics.effects.length, 'A promised child dying does not falsely count as betrayal');
F = fixture(); const abandoned = kinPromise(F.g, F.b); F.g.dead = W.t; kinSeason();
check(abandoned.status === 'void' && !W.kinPolitics.effects.length, 'A dead sponsor cannot keep changing court alignment');

F = fixture(); const snapshot = JSON.parse(JSON.stringify(W)); delete snapshot.kinPolitics;
const loaded = prepareWorld(decodeSave(JSON.stringify(snapshot)));
check(loaded.kinPolitics.pledges.length === 0 && loaded.kinPolitics.effects.length === 0, 'Loading an older married family invents no commitments or rewards');
check(loaded.chronicle.events.length === snapshot.chronicle.events.length, 'Migration invents no retrospective family history');
check(validateKinPolitics(loaded), 'Default migration produces a validated structure');
for (const mutate of [d => d.kinPolitics.pledges = {}, d => d.kinPolitics.cool = [], d => d.kinPolitics.effects.push({from:'a',to:'b',n:NaN,until:2,reason:'x'}), d => d.kinPolitics.marriages = Array(129).fill({a:'a',b:'b',t:0,end:null,patron:null})]) {
  const d = JSON.parse(JSON.stringify(loaded)); mutate(d); check(!validateKinPolitics(d), 'Malformed or unbounded political state is rejected');
}
F = fixture(); kinPromise(F.g, F.b); const saved = JSON.stringify(W);
const dangling = JSON.parse(saved); delete dangling.chars[F.g.id];
check(!validateKinPolitics(dangling), 'Active pledges cannot refer to missing characters in a save');
const duplicate = JSON.parse(saved); duplicate.kinPolitics.pledges.push(Object.assign({}, duplicate.kinPolitics.pledges[0], {id:'kp99'}));
check(!validateKinPolitics(duplicate), 'A save cannot duplicate one sponsor into multiple active promises');
activateWorld(prepareWorld(decodeSave(saved)));
check(kinActivePledges().length === 1 && kinActivePledges()[0].candidate === F.b.id, 'An explicit promise survives save and reload exactly once');
check(JSON.stringify(W.kinPolitics) === JSON.stringify(JSON.parse(saved).kinPolitics), 'Reload does not resolve, renew, or alter a pledge');

F = fixture(); addCourtier(F.g.id, 2, {}, true); F.g.rel[F.p.id] = { op: -100 }; kinInvalidate();
check(leanOf(F.g, {}) !== 'you', 'A marriage does not force a hostile general to become an ally');
check(!EV.kin_request({head:F.p.id,g:F.g.id,k:F.a.id}), 'A hostile backer cannot be forced into a friendly negotiation');
F.g.rel[F.p.id] = { op: 10 }; F.g.rel[F.kg.id] = { op: 20 }; kinInvalidate();
const seat = courtSeats().find(s => s.c === F.g), gap = courtGap(seat), prior = F.g.rel[F.p.id].op;
if (gap) { F.g.rel[F.p.id].op = prior + gap; kinInvalidate(); check(leanOf(F.g, {}) === 'you', 'The court gap includes the same family score used for the actual side'); }
else check(leanOf(F.g, {}) === 'you', 'Already aligned courtier has no artificial family gap');
const heirBefore = heirNow(); kinPromise(F.g, F.b);
check(heirNow() === heirBefore && Math.abs(kinPoliticsScore(F.g, F.p)) <= 20, 'Even a politically supported competing heir cannot seize legal inheritance');

F = fixture(); const unrelated = mkc({id:'kpintroduced',name:'族女',female:true,born:-20,loc:'xmarket',role:'noble'});
marry(F.b, unrelated); kinOnMarriage(F.b, unrelated, F.g);
check(!unrelated.dad && !unrelated.mom, 'A marriage introducer is never fabricated into a biological or legal parent');
check(W.kinPolitics.marriages.some(m => m.patron === F.g.id && [m.a,m.b].includes(unrelated.id)), 'A non-parent marriage introducer has an explicit, distinct record');
const neutral = mkc({id:'kpsame',name:'同姓',sur:F.g.sur,hist:true,born:-50,loc:'xpalace',role:'general'});
check(!kinBackers(F.b).some(x => x.c === neutral), 'Sharing a surname alone does not establish kinship or backing');
kinOnMarriage(F.b, unrelated, neutral);
check(kinBackers(F.b).some(x => x.c === neutral && x.reason === '媒家'), 'A recorded introducer can speak for a marriage without invented ancestry');
divorce(F.b, unrelated, true);
check(!kinBackers(F.b).some(x => x.c === neutral), 'A childless ended marriage also ends the introducer’s political connection');

F = fixture();
const ancestor = mkc({id:'kpcgrand',name:'祖父',born:-240}), uncle = mkc({id:'kpcuncle',name:'伯父',dad:ancestor.id,born:-150}), aunt = mkc({id:'kpcaunt',name:'姑母',female:true,dad:ancestor.id,born:-145});
const cousinA = mkc({id:'kpcousinA',name:'表兄',dad:uncle.id,born:-60,house:'li',loc:'home'}), cousinB = mkc({id:'kpcousinB',name:'表妹',female:true,mom:aunt.id,born:-55,loc:'home'});
kinInvalidate();
check(!closeKin(cousinA,cousinB) && kinPublicTie(cousinA,cousinB).n === 6, 'First cousins are publicly related but are allowed to marry by the existing game rules');
marry(cousinA,cousinB);
check(kinPublicTie(cousinA,cousinB).n === 8, 'A legal cousin marriage takes the strongest relationship value instead of stopping at kinship');

F = fixture(); const oldHead = F.p; kinPromise(F.g, F.b); F.p.flags.royal = true;
handOver(F.p, F.b);
check(W.player === F.b.id && W.kinPolitics.pledges[0].status === 'kept', 'Royal marriage handover follows the same promise rules as death');
check(!W.queue.some(q => ['kin_request','kin_dispute'].includes(q.ev) && q.head === oldHead.id), 'Old-head negotiations cannot leak into the new generation');
console.log('kinship politics:', checks, 'checks passed');
done();
