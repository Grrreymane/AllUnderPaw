// Actual, public outcomes. Never inspect biological parentage, secrets or hidden traits.
// Runtime-only snapshots are tied to their world; saved entries contain only observed facts.
const HISTORY_LIMIT = 240;
let HISTORY_FRAME = null, HISTORY_PENDING = null;
function validateHistoryEffects(d) {
  const h = d.historyEffects; if (h === undefined) return true;
  const obj = x => x && typeof x === 'object' && !Array.isArray(x);
  const str = x => typeof x === 'string' && x.length <= 6000;
  const num = x => Number.isInteger(x) && x >= 0;
  const realms = x => Array.isArray(x) && x.length <= 6 && x.every(k => Object.hasOwn(A3_REALM, k));
  const entry = e => obj(e) && num(e.id) && num(e.t) && ['head', 'name', 'title', 'text'].every(k => str(e[k])) && ['player', 'world'].includes(e.source) && realms(e.realms);
  if (!obj(h) || h.v !== 1 || !num(h.from) || !num(h.seq) || !Array.isArray(h.events) || h.events.length > HISTORY_LIMIT || !h.events.every(entry) || !Array.isArray(h.falls) || h.falls.length > 6 || !h.falls.every(e => entry(e) && Object.hasOwn(A3_REALM, e.k)) || !Array.isArray(h.pendingDeaths) || h.pendingDeaths.length > 40 || !h.pendingDeaths.every(e => obj(e) && ['who', 'title', 'head', 'name'].every(k => str(e[k])) && num(e.t) && num(e.due) && realms(e.realms))) throw new Error('存档中的天下影响记录损坏。');
  return true;
}
function historyDefaults() {
  if (!W.historyEffects) W.historyEffects = { v: 1, from: W.t, seq: 0, events: [], falls: [], pendingDeaths: [] };
  validateHistoryEffects(W);
}
SYS.init.push(historyDefaults);
SYS.load.push(historyDefaults);
const historyActive = () => W && !CATCHUP && !SAVE_SUSPENDED;
// Ordinary pick/opts windows are not included in holding(), but their decisions
// have not happened yet. Read-only lists and character sheets are safe to ignore.
const historyBusy = () => MODAL.some(m => m.hold || ['event', 'talk', 'tour', 'pick', 'opts', 'duel'].includes(m.type));
const historySign = n => (n > 0 ? '+' : '') + n;
function historySnapshot(who) {
  const selected = new Set(who || []), chars = {}, realm = {};
  for (const c of Object.values(W.chars)) {
    const own = c.house === 'li' || c.id === W.player;
    // Defending generals and selected event participants are public characters.
    if (!own && !selected.has(c.id) && !Object.values(A3_REALM).some(r => r.gen === c.id)) continue;
    chars[c.id] = { name: nm(c), own, alive: !!alive(c), health: c.health, loc: c.loc, army: !!c.flags.army, due: c.dieT, war: c.st[0] };
  }
  for (const k of A3_RK) if (W.realm && W.realm[k]) {
    const r = W.realm[k], g = a3Gen(k);
    realm[k] = { s: r.s, friend: r.friend, fallen: r.fallen, general: g ? g.id : '', generalName: g ? nm(g) : '' };
  }
  return { fish: W.fish, prest: W.prest, merit: W.merit || 0, ap: W.ap, rank: W.rank, city: W.city, guo: W.a3 ? W.a3.guo : null, yi: W.a2 ? W.a2.yi : null, mtd: W.a3 ? W.a3.mtd || 0 : 0, chars, realm };
}
function historyDiff(before, after, meta) {
  const lines = [], realms = new Set(meta.realms || []), deadlines = [];
  for (const [key, label] of [['fish', '小鱼干净变动'], ['prest', '名望净变动'], ['merit', '功劳净变动'], ['ap', '精力净变动']]) {
    const n = after[key] - before[key]; if (n) lines.push(label + historySign(n));
  }
  if (before.rank !== after.rank) lines.push('身份由' + RANKS[before.rank] + '变为' + RANKS[after.rank]);
  if (before.city !== after.city) lines.push('狸家迁至' + (CITY[after.city] ? CITY[after.city].n : after.city));
  if (before.guo !== null && after.guo !== null && before.guo !== after.guo) lines.push('秦国力净变动' + historySign(after.guo - before.guo));
  if (before.yi !== null && after.yi !== null && before.yi !== after.yi) lines.push('秦王忌惮净变动' + historySign(after.yi - before.yi));
  if (before.mtd !== after.mtd) { lines.push('攻楚战力修正由' + historySign(before.mtd) + '变为' + historySign(after.mtd)); realms.add('chu'); }
  for (const k of A3_RK) {
    const a = before.realm[k], b = after.realm[k]; if (!a || !b) continue;
    const n = A3_REALM[k].n;
    if (a.s !== b.s) { lines.push(n + '实力净变动' + historySign(b.s - a.s)); realms.add(k); }
    if (a.friend !== b.friend && b.friend > W.t) { lines.push('与' + n + '结好至' + yearTxt(b.friend) + SEASON[b.friend % 4]); realms.add(k); }
    if (a.general && !b.general) { lines.push(n + '守将' + a.generalName + '退出守备'); realms.add(k); }
    if (a.fallen === null && b.fallen !== null) { lines.push(n + '国归秦'); realms.add(k); }
  }
  for (const [id, a] of Object.entries(before.chars)) {
    const b = after.chars[id]; if (!b || !a.alive) continue;
    if (!b.alive) lines.push((a.own ? '家人' : '') + a.name + '身亡');
    else {
      if (a.own && a.health !== b.health) lines.push(a.name + '健康净变动' + historySign(b.health - a.health));
      if (a.own && a.army && !b.army && a.loc === 'away' && b.loc !== 'away') lines.push(a.name + '从军中生还' + (b.war > a.war ? '，武力+' + (b.war - a.war) : ''));
      else if (a.loc !== b.loc && (meta.who || []).includes(id)) lines.push(a.name + '去往' + (LOCN[b.loc] || b.loc));
      if (meta.sparing && (meta.who || []).includes(id)) lines.push(a.name + '在这次处置后仍在世');
      if (typeof b.due === 'number' && b.due > W.t && (a.due === null || a.due === undefined || b.due < a.due)) {
        lines.push(a.name + '面临死期，约' + (b.due - W.t) + '季后见分晓');
        deadlines.push({ who: id, due: b.due });
        for (const k of A3_RK) if (A3_REALM[k].gen === id) realms.add(k);
      }
    }
  }
  return { lines, realms: [...realms], deadlines };
}
function historyAppend(meta, text, realms) {
  historyDefaults();
  const h = W.historyEffects, p = C(meta.head || W.player);
  const e = { id: ++h.seq, t: W.t, head: meta.head || W.player, name: meta.name || (p ? nm(p) : '狸家'), source: meta.source || 'player', title: meta.title, text, realms: realms || [] };
  h.events.push(e);
  // Keep player decisions affecting the six states longer than routine news.
  while (h.events.length > HISTORY_LIMIT) {
    const ordinary = h.events.findIndex(x => x.source === 'world' || !x.realms.length);
    h.events.splice(ordinary < 0 ? 0 : ordinary, 1);
  }
  return e;
}
function historyRecord(meta, before, after, pending) {
  const diff = historyDiff(before, after, meta);
  if (!diff.lines.length && !meta.always) return null;
  let text = (meta.choice ? '选择「' + meta.choice + '」。' : '') + (diff.lines.length ? diff.lines.join('；') + '。' : '本次没有改变家资、名望、功劳、家人安危或六国局势。');
  if (pending) text += '后续处置尚未结束。';
  else if (meta.complete) text += '后续处置已结束。';
  const e = historyAppend(meta, text, diff.realms);
  for (const d of diff.deadlines) {
    const h = W.historyEffects;
    h.pendingDeaths = h.pendingDeaths.filter(x => x.who !== d.who);
    h.pendingDeaths.push({ ...d, t: W.t, title: meta.title, head: e.head, name: e.name, realms: diff.realms });
    if (h.pendingDeaths.length > 40) h.pendingDeaths.shift();
  }
  if (meta.choice && meta.always) chronicle('choice', meta.title, text, e.head);
  return e;
}
function historyFall(k, how, head) {
  if (!historyActive() || !W.realm[k] || W.realm[k].fallen === null) return;
  historyDefaults(); const h = W.historyEffects;
  if (h.falls.some(e => e.k === k)) return;
  const n = A3_REALM[k].n, own = how === 'war' || how === 'yield';
  const prefix = how === 'yield' ? '狸家主持劝降。' : how === 'war' ? '狸家主持的军事或用间行动促成灭国。' : how === 'deal' ? '后胜促成齐王交地。' : '秦军与天下局势推进至此。';
  const player = h.events.filter(e => e.source === 'player' && e.realms.includes(k)).slice(-12);
  const yearDelta = Math.floor(A3_REALM[k].fallT / 4) - Math.floor(W.t / 4);
  let text = prefix + (own ? '这次灭国之功记在狸家名下。' : '这次没有记作狸家的灭国之功。') + (yearDelta > 0 ? '比史书记载早' + yearDelta + '年。' : yearDelta < 0 ? '比史书记载晚' + (-yearDelta) + '年。' : '与史书记载同年。');
  text += player.length ? '\n此前有据可查的狸家行动：\n' + player.map(e => yearTxt(e.t) + SEASON[e.t % 4] + ' · ' + e.name + ' · ' + e.title + '：' + e.text).join('\n') : '本轮记录中没有狸家对该国的具体行动。';
  text += '\n这些记录说明实际改动过哪些局势；灭国时间还受秦军年度战事、实力恢复、守将与史实推进共同影响，不能只归因于狸家。';
  const p = C(head || W.player);
  h.falls.push({ id: ++h.seq, t: W.t, head: head || W.player, name: p ? nm(p) : '狸家', source: own ? 'player' : 'world', title: n + '国归秦', text: text.slice(0, 6000), realms: [k], k });
}
function historyRun(meta, fn) {
  if (!historyActive() || HISTORY_FRAME) return fn();
  // A picker may finish through a named action; settle earlier picker mutations first,
  // then let this action own its own result instead of counting it twice at frame end.
  if (HISTORY_PENDING) historyFlushPending(true);
  const world = W, before = historySnapshot(meta.who), frame = { world, meta, falls: [] };
  HISTORY_FRAME = frame;
  try { return fn(); }
  finally {
    HISTORY_FRAME = null;
    if (W === world && historyActive()) {
      historyRecord(meta, before, historySnapshot(meta.who), false);
      for (const f of frame.falls) historyFall(f.k, f.how, f.head);
    }
  }
}
function historyFlushPending(force) {
  const p = HISTORY_PENDING; if (!p) return;
  if (W !== p.world || !historyActive()) { HISTORY_PENDING = null; return; }
  if (!force && historyBusy()) return;
  HISTORY_PENDING = null;
  historyRun({ ...p.meta, title: p.meta.title + '·后续', choice: '', always: false }, () => {
    // Use the last immediate settlement as the baseline, not the original pre-choice state.
    historyRecord({ ...p.meta, title: p.meta.title + '·后续', choice: '', always: true, complete: !historyBusy() }, p.before, historySnapshot(p.meta.who), historyBusy());
  });
}
function historyResolveChoice(event, option, fn) {
  if (!historyActive()) return fn();
  historyFlushPending(true);
  const world = W, p = P(), meta = { title: event.title, choice: option.t, who: event.who || [], head: p.id, name: nm(p), source: 'player', always: event.opts.length > 1 && !event.noChronicle, sparing: /放.*[马走]|不杀|救下|保全|迁他|留在/.test(option.t) };
  if (HISTORY_FRAME) return fn();
  const before = historySnapshot(meta.who), frame = { world, meta, falls: [] };
  HISTORY_FRAME = frame;
  try { return fn(); }
  finally {
    HISTORY_FRAME = null;
    if (W === world && historyActive()) {
      const after = historySnapshot(meta.who), pending = historyBusy();
      historyRecord(meta, before, after, pending);
      for (const f of frame.falls) historyFall(f.k, f.how, f.head);
      if (pending) HISTORY_PENDING = { world, meta, before: after };
    }
  }
}
function historyRows(entries) {
  return entries.slice().reverse().map(e => ({ t: e.title + '：' + e.text, s: yearTxt(e.t) + SEASON[e.t % 4] + ' · ' + e.name + (e.source === 'world' ? ' · 天下消息' : ' · 狸家行动'), dot: e.source === 'world' ? '#8a6a3a' : '#b5312a', wrap: true }));
}
function openGenerationHistory(head) {
  historyDefaults(); journalDefaults(); historyFlushPending();
  const h = W.historyEffects, all = h.events.concat(h.falls), successions = W.chronicle.events.filter(e => e.kind === 'succession');
  if (head) {
    const p = C(head), rows = historyRows(all.filter(e => e.head === head));
    rows.unshift(...successions.filter(e => e.head === head).map(e => ({ t: e.title + '：' + e.text, s: yearTxt(e.t) + SEASON[e.t % 4], wrap: true })));
    openList((p ? nm(p) : '前代家主') + '这一代', rows, { empty: '从今往后的实际结算，会记在这里。', sub: '记录选择之后实际发生的变化' });
    return;
  }
  const heads = [...new Set([W.player, ...successions.slice().reverse().map(e => e.head), ...all.slice().reverse().map(e => e.head)])].filter(Boolean);
  openList('历代家主', heads.map(id => {
    const p = C(id), entries = all.filter(e => e.head === id);
    return { por: p || null, t: (p ? nm(p) : (entries[0] && entries[0].name) || '前代家主') + (id === W.player ? ' · 当家' : ''), s: entries.length + '件实际结果', close: true, fn: () => openGenerationHistory(id) };
  }), { sub: '从' + yearTxt(h.from) + '记录 · 旧事不追补' });
}
function openWorldEffects(k) {
  historyDefaults(); historyFlushPending(); const h = W.historyEffects;
  if (k && A3_REALM[k]) {
    const fall = h.falls.find(e => e.k === k), entries = h.events.filter(e => e.realms.includes(k)), rows = [];
    if (fall) rows.push(...historyRows([fall]));
    rows.push(...historyRows(entries));
    openList(A3_REALM[k].n + '国与狸家', rows, { empty: '尚无记录。预设前史与旧存档中的行动不会被补记为你的功劳。', sub: '列出实际作用；不推断唯一原因' });
    return;
  }
  openList('天下影响', A3_RK.map(id => {
    const r = W.realm && W.realm[id], fallen = r && r.fallen !== null, count = h.events.filter(e => e.source === 'player' && e.realms.includes(id)).length;
    return { t: A3_REALM[id].n + '国 · ' + (fallen ? '已归秦' : '尚存'), s: count + '件狸家行动' + (h.falls.some(e => e.k === id) ? ' · 可看灭国结算' : ''), close: true, fn: () => openWorldEffects(id) };
  }), { sub: '天下自己在推进，狸家的具体作用另记' });
}
// Plain named wrappers; existing game mechanics and RNG calls remain untouched.
{
  const camp = a3Camp, jian = a3Jian, hao = a3Hao, xiang = a3Xiang, world = a3World, ai = a3AiWar, army = a3ArmyKids, fall = fallRealm, death = die;
  a3Camp = (k, g) => historyRun({ title: '出征' + A3_REALM[k].n, realms: [k] }, () => camp(k, g));
  a3Jian = k => historyRun({ title: '离间' + A3_REALM[k].n, realms: [k] }, () => jian(k));
  a3Hao = k => historyRun({ title: '结好' + A3_REALM[k].n, realms: [k] }, () => hao(k));
  a3Xiang = k => historyRun({ title: '劝降' + A3_REALM[k].n, realms: [k] }, () => xiang(k));
  a3World = () => historyRun({ title: '秦军与列国这一年', source: 'world' }, world);
  a3AiWar = k => historyRun({ title: '秦军攻' + A3_REALM[k].n, source: 'world', realms: [k] }, () => ai(k));
  a3ArmyKids = win => historyRun({ title: '从军家人的归程', source: 'world' }, () => army(win));
  fallRealm = (k, how, g) => {
    const before = W.realm && W.realm[k] && W.realm[k].fallen;
    const result = fall(k, how, g);
    if (before === null && W.realm[k].fallen !== null && historyActive()) {
      if (HISTORY_FRAME) HISTORY_FRAME.falls.push({ k, how, head: W.player });
      else historyFall(k, how, W.player);
    }
    return result;
  };
  die = (c, quiet) => {
    if (!historyActive() || !alive(c)) return death(c, quiet);
    historyDefaults(); const was = W.historyEffects.pendingDeaths.find(x => x.who === c.id);
    const relevant = c.house === 'li' || c.id === W.player || was || Object.values(A3_REALM).some(r => r.gen === c.id);
    if (!relevant) return death(c, quiet);
    const result = historyRun({ title: was ? was.title + '·人命后果' : nm(c) + '的死讯', source: was ? 'player' : 'world', who: [c.id], head: was ? was.head : W.player, name: was && was.name, realms: was ? was.realms : [] }, () => death(c, quiet));
    if (was && !alive(c)) {
      // A dated danger becomes an observed death only now, never when the gold was paid.
      W.historyEffects.pendingDeaths = W.historyEffects.pendingDeaths.filter(x => x !== was);
    }
    return result;
  };
}
