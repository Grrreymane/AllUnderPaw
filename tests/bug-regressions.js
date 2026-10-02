// Targeted regressions from the marriage / succession audit. Runs inside headless.cjs.
const assert = require('node:assert/strict');
let checks = 0;
const failures = [];
const check = (ok, message) => { assert.ok(ok, message); checks++; };
function test(name, fn) {
  try { fn(); console.log('PASS: ' + name); }
  catch (error) { failures.push(name + ': ' + error.message); console.log('FAIL: ' + name + ': ' + error.message); }
}
function firstHead() {
  newGame(); state = 'game'; EV.prologue().opts[0].fx();
  W.queue = []; MODAL.length = 0;
}
// Inspect the same relation chips the real character sheet draws, including its compact layout.
function sheetRelations(id) {
  const savedTxt = txt, savedFlow = chipFlow, found = {};
  let label = '';
  txt = (value, ...args) => { label = value; return savedTxt(value, ...args); };
  chipFlow = (items, ...args) => {
    if (['子女', '父母', '生父'].includes(label) && items.every(x => x && x.id)) found[label] = items.map(x => x.id);
    return savedFlow(items, ...args);
  };
  try { drawSheet({ type: 'sheet', id, ro: true }); }
  finally { txt = savedTxt; chipFlow = savedFlow; }
  return found;
}
function zhaoBirth(father) {
  firstHead();
  if (father === 'player') setPreg(C('zhaoji'), W.player);
  zhaojiWed(); giveBirth(C('zhaoji')); W.queue = []; MODAL.length = 0;
  return C('zheng');
}

test('A married Zhao Ji remains in the player household at the act transition', () => {
  firstHead();
  const bride = C(W.flags.prologueKids[1]); liBrideWed(bride); giveBirth(bride);
  const wife = C('zhaoji'); marry(P(), wife); setPreg(wife, W.player);
  const conception = JSON.stringify(wife.preg), head = W.player;
  check(wife.loc === 'home', 'The marriage starts with Zhao Ji in the household');
  W.t = 22; EV.act1end();
  check(wife.sp === head && wife.loc === 'home' && household().includes(wife), 'The act transition must not send the player wife to Lu Buwei');
  check(JSON.stringify(wife.preg) === conception, 'The act transition preserves the player pregnancy');
});

test('A secret biological father of Zheng is never treated as a queen mother', () => {
  const z = zhaoBirth('player'), father = P();
  check(!father.female && z.bio === father.id && z.dad === 'yiren', 'The test uses the actual secret player-father birth path');
  W.t = 61; W.flags.act1Done = true; HIST_NEXT.yiren();
  check(W.kingId === z.id && z.role === 'ruler', 'Zheng takes the throne');
  check(!kingsMother(father) && !royalOut(father) && !royalHead(), 'A male biological father retains the family headship');
  check(EV.chujia() === null, 'No forced royal-bride handover is offered to the father');
  check(kingsMother(C('zhaoji')), 'The actual mother is still recognized');
});

test('A crown survives save and reload before the succession choice', () => {
  startScen(3); MODAL.length = 0; W.queue = []; seizeThrone();
  const former = P();
  check(W.kingId === former.id && W.rank === 5, 'The player actually holds the crown');
  die(former);
  check(W.queue.some(q => q.ev === 'succession'), 'A succession choice is pending');
  check(saveGame(), 'The pending succession checkpoint saves');
  check(loadGame(), 'The pending succession checkpoint loads');
  check(W.kingId === former.id, 'Loading preserves the deceased dynasty king until the choice');
  const successor = heirNow(); check(!!successor, 'The family has a successor');
  takeOver(P(), successor, successor);
  check(W.kingId === successor.id && king() === successor && W.rank === 5, 'The selected family head inherits the crown after loading');
});

test('The player widow keeps her existing ordinary pregnancy', () => {
  firstHead(); W.t = 11;
  const father = P(), wife = C('zhaoji'); marry(father, wife); setPreg(wife, father.id);
  const conception = JSON.stringify(wife.preg), priorKids = new Set(wife.kids);
  die(father); takeOver(father, C(W.flags.prologueKids[2]), null); W.t = 12;
  ensureZheng();
  check(wife.sp !== 'yiren' && JSON.stringify(wife.preg) === conception, 'History cannot seize a player widow or tag her pregnancy as Zheng');
  giveBirth(wife);
  const children = wife.kids.filter(id => !priorKids.has(id)).map(C);
  check(children.length > 0 && children.every(c => !c.hist && c.id !== 'zheng' && c.dad === father.id && c.bio === father.id), 'The posthumous player children remain ordinary children with their real father');
});

test('The public child list keeps undiscovered parentage hidden', () => {
  const z = zhaoBirth('lu'), secret = W.secrets.find(s => s.kid === z.id);
  check(secret && !secret.exposed && !knows(secret), 'The player has not discovered the father');
  check(C('lv').kids.includes(z.id), 'Biological links stay available to the actual simulation');
  check(!knownBio(z) && !visibleChildren(C('lv')).includes(z), 'Shared public relation helpers hide undiscovered parentage');
  check(!(sheetRelations('lv')['子女'] || []).includes(z.id), 'Lu Buwei does not publicly list the undiscovered secret child');
  check((sheetRelations('yiren')['子女'] || []).includes(z.id), 'The legal father continues to list the child');
  check(!(sheetRelations(z.id)['生父'] || []).includes('lv'), 'The child sheet hides the undiscovered biological father');
  secret.known.push(W.player);
  check(knownBio(z) && visibleChildren(C('lv')).includes(z), 'Shared relation helpers recognize discovered parentage');
  check((sheetRelations('lv')['子女'] || []).includes(z.id), 'A discovered child is available from the biological father sheet');
  check((sheetRelations(z.id)['生父'] || []).includes('lv'), 'A discovered biological father is available from the child sheet');
});

test('A publicly exposed parentage is readable without a private knowledge entry', () => {
  const z = zhaoBirth('lu'), secret = W.secrets.find(s => s.kid === z.id);
  secret.exposed = true;
  check(!secret.known.includes(W.player), 'The player has no personal discovery record');
  check((sheetRelations(z.id)['生父'] || []).includes('lv'), 'A publicly exposed father is visible to the player');
});

test('The surname tree does not cross an undiscovered biological link', () => {
  firstHead();
  const legal = mkc({ sur: '吕', name: '法父', born: -100 }), mother = C('zhaoji');
  const child = mkc({ sur: '吕', name: '幼子', born: 0, mom: mother.id, dad: legal.id, bio: 'lv' });
  linkKids(); const secret = addSecret('bastard', mother.id, 'lv', child.id);
  check(!knows(secret), 'The shared-surname biological link is hidden');
  const familyIds = bloodOf(C('lv')).map(c => c.id);
  check(!familyIds.includes(child.id) && !familyIds.includes(legal.id), 'The tree must not import another household through a hidden father');
  const nodes = treeLayout(C('lv')).nodes.flatMap(n => [n.c.id, ...n.ps.map(c => c.id)]);
  check(!nodes.includes(child.id) && !nodes.includes(legal.id), 'The rendered surname tree also keeps the hidden household out');
});

test('A player king and the next king retain their actual ruler identity', () => {
  startScen(3); MODAL.length = 0; W.queue = []; seizeThrone();
  check(P().role === 'ruler' && P().state === '秦', 'Taking the crown updates the underlying ruler identity');
  const former = P(), successor = heirNow(); check(!!successor, 'The crowned family has a successor');
  die(former); takeOver(former, successor, successor);
  check(W.kingId === successor.id && successor.role === 'ruler' && successor.state === '秦', 'The successor is a ruler to family and birth systems as well as the rank display');
});

test('Children born to a player king receive their actual royal household role', () => {
  startScen(3); MODAL.length = 0; W.queue = []; seizeThrone();
  check(!P().female, 'The historical preset provides a male player ruler for the paternal birth case');
  const mother = mkc({ sur: '苏', name: '王妃', female: true, born: W.t - 24 * 4 });
  marry(P(), mother); setPreg(mother, W.player); giveBirth(mother);
  check(mother.kids.length > 0 && mother.kids.map(C).every(c => c.dad === W.player && c.role === 'noble' && c.state === '秦'), 'A player ruler has noble children rather than merchant children');
});

test('An unacknowledged biological son cannot bypass a king\'s legal son', () => {
  firstHead(); W.t = 80; W.flags.act1Done = true; W.city = 'xianyang'; W.act = 2;
  // This exercises the generic succession used after alternate rulers such as Chengjiao.
  const ruler = mkc({ id: 'auditKing', sur: '嬴', name: '王', role: 'ruler', house: 'qin', loc: 'xpalace', born: W.t - 50 * 4 });
  W.kingId = ruler.id;
  const legalFather = mkc({ sur: '苏', name: '父', house: 'su', born: W.t - 50 * 4 });
  const mother = mkc({ sur: '姜', name: '氏', female: true, born: W.t - 45 * 4 });
  const secretSon = mkc({ sur: '苏', name: '私子', mom: mother.id, dad: legalFather.id, bio: ruler.id, born: W.t - 22 * 4, house: 'su' });
  const queen = mkc({ sur: '李', name: '姬', female: true, born: W.t - 40 * 4 });
  const lawfulSon = mkc({ sur: '嬴', name: '嗣', mom: queen.id, dad: ruler.id, bio: ruler.id, born: W.t - 17 * 4, house: 'qin' });
  linkKids(); const secret = addSecret('bastard', mother.id, ruler.id, secretSon.id);
  check(!knows(secret) && !secret.exposed && ruler.kids.includes(secretSon.id), 'True biological data exists but no public acknowledgment does');
  die(ruler); kingCheck();
  check(W.kingId === lawfulSon.id, 'The legal son succeeds; the unrelated household\'s secret son does not');
});

function courtRiskStart() {
  startScen(2); MODAL.length = 0; W.queue = [];
  W.a2.yi = 80; P().health = 75; P().born = W.t - 40 * 4;
}
const agendaIdentity = a => a && JSON.stringify({ title: a.title, tab: a.tab, pri: a.pri });

test('The suspicion agenda offers a valid court destination and working entry', () => {
  courtRiskStart();
  const agenda = familyAgenda();
  check(agenda && agenda.tab === 'court' && !!TABS[agenda.tab], 'The court warning points to a real game tab');
  check(typeof agenda.fn === 'function', 'The warning offers a concrete action');
  agenda.fn();
  check(top() && top().type === 'pick' && top().list.length > 0, 'Following the warning opens the actual courtier selector');
  MODAL.length = 0;
});

test('A later king does not inherit Zheng\'s obsolete suspicion warning', () => {
  startScen(5); MODAL.length = 0; W.queue = []; goCity('xianyang');
  P().health = 75; P().born = W.t - 40 * 4;
  check(W.kingId === 'huhai' && !zhengKing(), 'The later preset is ruled by Hu Hai');
  W.a2.yi = 0; const ordinaryAgenda = agendaIdentity(familyAgenda());
  W.a2.yi = 80; const oldSuspicionAgenda = familyAgenda();
  check(agendaIdentity(oldSuspicionAgenda) === ordinaryAgenda, 'Obsolete Zheng suspicion cannot change the current family priority');
  check(!oldSuspicionAgenda || !!TABS[oldSuspicionAgenda.tab], 'Any remaining agenda still has a valid destination');
});

test('No customary heir is distinguished from having no available successor', () => {
  firstHead();
  const head = P(), parent = C(head.dad);
  for (const c of family()) if (c !== head && c !== parent) c.dead = W.t;
  head.born = W.t - 55 * 4; head.health = 75; parent.born = W.t - 80 * 4;
  const candidates = succCands(head).map(([c]) => c);
  check(!heirNow() && candidates.includes(parent), 'An elder remains eligible even when there is no customary heir');
  const agenda = familyAgenda(), description = [agenda.title, agenda.text, agenda.detail].join(' ');
  check(/候选|可选|可以.*(?:选择|接手)/.test(description), 'The guidance acknowledges that successor candidates still exist');
  check(!/(?:只能|只好|必须).{0,12}远房/.test(description), 'The guidance does not falsely require a distant replacement');
  const population = Object.keys(W.chars).length, choice = EV.succession();
  check(choice.opts.some(o => o.t.includes(nm(parent))) && Object.keys(W.chars).length === population, 'The real succession choice offers the existing elder without inventing a replacement');
});

test('Immediate family risks precede ordinary promises while disputes remain urgent', () => {
  courtRiskStart();
  const risk = familyAgenda(), successor = heirNow();
  const promise = kinPromise(C('lv'), successor);
  check(promise && !promise.disturbed && successor.id === promise.candidate, 'An undisputed promise supports the current heir');
  check(agendaIdentity(familyAgenda()) === agendaIdentity(risk), 'An ordinary promise cannot suppress the active royal-suspicion warning');
  promise.disturbed = true;
  const dispute = kinAgenda(), urgent = familyAgenda();
  check(urgent.title === dispute.title && urgent.pri < risk.pri, 'A genuine inheritance dispute retains priority over the court warning');

  courtRiskStart();
  const head = P(), child = heirNow();
  for (const c of family()) if (c !== head && c !== child) c.dead = W.t;
  child.dad = child.bio = head.id; child.mom = null; child.born = W.t - 8 * 4;
  delete child.flags.left; delete child.flags.disinh; delete child.flags.royal;
  head.health = 30; linkKids(); kinInvalidate();
  const minorityRisk = familyAgenda();
  check(heirNow() === child && ageOf(child) < 16, 'The ill head has only a minor successor');
  const minorPromise = kinPromise(C('lv'), child);
  check(minorPromise && !minorPromise.disturbed, 'The existing minor heir has an undisputed promise');
  check(agendaIdentity(familyAgenda()) === agendaIdentity(minorityRisk), 'The minor-succession risk is not displaced by an ordinary promise');
});

if (failures.length) throw new Error(failures.length + ' bug regressions failed:\n' + failures.join('\n'));
console.log('PASS: ' + checks + ' targeted marriage, hidden-parentage, royal-succession and family-agenda checks.');
