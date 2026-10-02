// ============================================================ dynasty journal / objective context
// Saved text is what the player saw at the time; it never queries hidden parentage or retcons old decisions.
function journalDefaults() {
  if (!W.chronicle) W.chronicle = { from: W.t, events: [] };
}
SYS.init.push(journalDefaults);
SYS.load.push(journalDefaults);
function chronicle(kind, title, text, head) {
  if (!W || CATCHUP || SAVE_SUSPENDED) return;
  journalDefaults();
  const p = C(head || W.player), e = { t: W.t, kind, title, text, head: p ? p.id : '', name: p ? nm(p) : '狸家' }, L = W.chronicle.events;
  const last = L[L.length - 1];
  if (last && last.t === e.t && last.kind === kind && last.title === title && last.text === text) return;
  L.push(e);
  // Ordinary decisions can repeat; keep succession and conquests longer without an unbounded save.
  for (const [major, cap] of [[false, 180], [true, 120]]) {
    const matches = x => ['succession', 'realm'].includes(x.kind) === major;
    while (L.filter(matches).length > cap) L.splice(L.findIndex(matches), 1);
  }
}
function openChronicle() {
  journalDefaults();
  const J = W.chronicle, entries = J.events.slice().reverse();
  const rows = [{ t: nm(P()) + '当家 · ' + RANKS[W.rank], s: '家族 ' + family().length + ' 口 · 名望 ' + W.prest, wrap: true }];
  if (W.a3 && W.a3.gongK && W.a3.gongK.length) rows.push({ t: '狸家的灭国之功：' + W.a3.gongK.map(k => A3_REALM[k].n).join('、'), wrap: true });
  rows.push(...entries.map(e => ({ t: e.title + '：' + e.text, s: yearTxt(e.t) + SEASON[e.t % 4] + ' · ' + e.name, dot: e.kind === 'choice' ? '#8a6a3a' : '#b5312a', wrap: true })));
  if (!entries.length) rows.push({ t: '此后的关键选择，会逐件记在这里。', wrap: true });
  openList('狸家纪事', rows, { sub: '从' + yearTxt(J.from) + '记起 · 保留近180次选择与120件大事' });
}
function chapterContext() {
  if (chOn()) return { title: '乱世 · 给狸家争一个去处', text: '你已自立。募兵保住地盘，结盟能分担压力；只剩你和盟友时，可以奉他为天子，也可以继续争。', detail: '狸家兵力 ' + chF('you').s + ' · 地盘 ' + chLands('you').length + ' 块' };
  if (!W.flags.act1Done) return { title: '奇货 · 把异人送回秦国', text: '与吕不韦争立嗣之功，还要留够围城出逃的钱。异人记得谁在落魄时帮过他，这会影响狸家入秦后的起点。', detail: '立嗣之功：你 ' + W.credit.you + ' / 吕 ' + W.credit.lv + ' · 出城备金 300' };
  if (W.act < 3) {
    if (!inQin()) return { title: '去留 · 狸家的根在哪里', text: '狸家现在住在' + CITY[W.city].n + '。先照顾家人、经营家业，也留意秦国的动静；家族的去留，要看眼下的局势。', detail: '所在地：' + CITY[W.city].n + ' · 身份：' + RANKS[W.rank] };
    if (W.kingId === W.player) return { title: '王位 · 守住狸家的秦国', text: '你已坐上王位。朝臣的支持、家族的继承和秦国的局势，都要由你来照料。', detail: '你的势 ' + powerOf('you') + ' · 身份：' + RANKS[W.rank] };
    return { title: '仲父 · 在秦廷站稳脚跟', text: '差事和功劳带来官职，朝臣的支持决定你的势。政长大后，还要留意他对你的忌惮：有权，也要想好如何保住狸家。', detail: '你的势 ' + powerOf('you') + ' / 王方 ' + powerOf('wang') + ' · 忌惮 ' + W.a2.yi };
  }
  if (realmOn()) return { title: '一统 · 让天下记住狸家的功劳', text: a3Court() ? '秦军每年也会出征。你主持的战事与劝降另记灭国之功。' + (W.kingId === W.player ? '作为秦王，你可以选择先打哪国、派谁领兵，最终争取一统。' : '臣子亲手平定两国可封列侯；客卿可以先从结好、离间着手。') : '秦军正在向六国推进。狸家可以经营家业、培养子女；入秦做到客卿，才有议天下事的机会。', detail: '六国已灭 ' + a3Fell() + '/6 · 狸家灭国之功 ' + (W.a3.gong || 0) };
  return { title: '家业 · 给下一代留一条路', text: W.t >= 212 ? '天下再起波澜。家业、门客与名望足够时，可以寻找自立的机会；也可以守住家人，把这一代的积累传下去。' : '天下的局势仍在变化。给子女安排出路、选好继承人，让这一代的家业与人情接得下去。', detail: '家族 ' + family().length + ' 口 · 门客 ' + W.ret.length + ' 人 · 名望 ' + W.prest };
}
function openObjective() {
  if (!W || holding()) return;
  const c = chapterContext(), tab = hintTab();
  openList('眼下的事', [{ t: c.title, wrap: true }, { t: c.text, wrap: true }, { t: c.detail, wrap: true }, { t: objective(), wrap: true },
    ...(tab ? [{ t: '去「' + TABS[tab].n + '」看看 ›', s: '关闭此页，打开目标所在的地方', close: true, fn: () => { W.loc = tab; } }] : []),
    { t: '狸家纪事 ›', s: '回看已经做过的选择', close: true, fn: openChronicle },
    { t: '画卷图鉴 ›', s: '回看剧情插画与人物立绘', close: true, fn: openArtGallery }]);
}
