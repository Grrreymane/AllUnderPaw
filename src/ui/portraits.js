// ---------------------------------------------------------- portraits on screen
function drawPortrait(c, x, y, s, frameCol) {
  s = s || 1;
  rect(x - 1, y - 1, 32 * s + 2, 32 * s + 2, OUT);
  rect(x, y, 32 * s, 32 * s, frameCol || (c.house === 'li' ? '#e8d4a8' : c.state === '秦' ? '#d8c8c8' : '#d4dcc4'));
  const im = illustratedPortrait(c);
  if (im) return queuePortrait(im, x, y, 32 * s);
  g.drawImage(portrait(c), x, y, 32 * s, 32 * s);
}
function opCol(v) { return v >= 40 ? '#276a32' : v >= 10 ? '#3f6a1c' : v > -10 ? '#5f5236' : v > -40 ? '#96461a' : '#a0301f'; }
const LABC = '#7a5a3a';   // small labels and hints on the paper

function drawEvent(m) {
  const e = m.e, x = 6, w = 168;
  const who = (e.who || []).map(C).filter(Boolean).slice(0, 4);
  const lines = wrapT(e.text, w - 16, 7, 1);
  const optH = e.opts.map(o => o.hint ? 22 : 17);
  const ph = who.length ? 44 : 0;
  const h = 24 + ph + lines.length * 11 + 6 + optH.reduce((a, b) => a + b + 3, 0) + 6;
  const y = clamp(R((H - h) / 2), 18, H - h - 2);
  g.globalAlpha = .55; rect(0, 0, W_, H, '#0a0810'); g.globalAlpha = 1;
  HITS = [];
  paper(x, y, w, h);
  rect(x + 30, y + 6, w - 60, 12, PAL.lacq); rect(x + 30, y + 17, w - 60, 1, PAL.jiang);
  txt(e.title, x + w / 2, y + 12, 8, '#fff6dc', 'center', PAL.jiang);
  let cy = y + 22;
  if (who.length) {
    const gap = 38, sx = x + w / 2 - (who.length * gap - 6) / 2;
    // a portrait opens that cat's card to look at; the story card waits underneath
    who.forEach((c, i) => { drawPortrait(c, sx + i * gap, cy, 1); txt(nm(c), sx + i * gap + 16, cy + 38, 5.5, '#4a3020', 'center', null); hit(sx + i * gap, cy, 32, 32, () => openSheet(c.id, true)); });
    cy += ph;
  }
  lines.forEach((l, i) => txt(l, x + 8, cy + 5 + i * 11, 7, '#2a1a10', 'left', null, 1, 1));
  cy += lines.length * 11 + 6;
  e.opts.forEach((o, i) => {
    const ok = !o.ok || o.ok(), cw = o.tr ? tw(o.tr, 5.5) + 6 : 0;
    btn(x + 6, cy, w - 12, optH[i], o.t, ok ? (o.look || (o.tr ? 'gold' : 'dark')) : 'off', () => choose(m, o), o.hint || null, cw ? cw + 4 : 0);
    if (o.tr) { rect(x + w - 9 - cw, cy + 3, cw, 9, traitCol(o.tr)); txt(o.tr, x + w - 9 - cw / 2, cy + 7.5, 5.5, '#ffffff', 'center', null); }
    cy += optH[i] + 3;
  });
}
function statRow(c, x, y) {
  for (let i = 0; i < 4; i++) {
    rect(x + i * 24, y, 9, 9, STATC[i]); txt(STATN[i], x + i * 24 + 4.5, y + 4.5, 6, '#ffffff', 'center', null);
    txt(stat(c, i), x + i * 24 + 11, y + 4.5, 6.5, '#3a2418', 'left', null);
  }
}
function chip(s, x, y, col, fn) {
  const w = tw(s, 6) + 6; rect(x, y, w, 10, OUT); rect(x + 1, y + 1, w - 2, 8, col); txt(s, x + w / 2, y + 5, 6, '#ffffff', 'center', null);
  if (fn) hit(x - 1, y - 1, w + 3, 12, fn);   // the tap area fills the chip's whole cell
  return w;
}
// chips in rows from x0 to xMax; past maxRows the rest hides behind a '+N' chip that calls more(rest). Returns the next row's y.
function chipFlow(items, x0, y, xMax, lab, colOf, onTap, maxRows, more) {
  if (!items.length) return y;
  let x = x0, row = 1;
  for (let i = 0; i < items.length; i++) {
    const it = items[i], w = tw(lab(it), 6) + 6, after = items.length - i - 1, last = row >= maxRows;
    if (x > x0 && x + w + (last && after ? tw('+' + after, 6) + 9 : 0) > xMax) {
      if (!last) { x = x0; y += 12; row++; i--; continue; }
      const rest = items.slice(i); chip('+' + rest.length, x, y, '#5a4a60', more ? () => more(rest) : null); return y + 12;
    }
    chip(lab(it), x, y, colOf(it), onTap ? () => onTap(it) : null); x += w + 3;
  }
  return y + 12;
}
// What each trait does, for the card you get by tapping its chip: the stat changes come from TR, the rest is written here.
const TRD = {
  勇猛: '敢上前。有专属的硬气选项；选了退缩的路会心烦。', 胆小: '怕事。勒索、揭发、比剑、行刺都让他心烦；比剑时守得稳。',
  仁厚: '心软。做狠事（揭发、囤粮高价卖、行刺）会心烦。', 狠辣: '下得去手。有专属的狠选项；做了宿敌更可能行刺。',
  贪吃: '收到鱼干多 5 点好感；家里鱼干不到 30 会心烦。', 节制: '不贪口腹。',
  粘人: '容易亲近；一年没人陪会心烦，陪伴时消得多。', 高冷: '话少，难亲近。',
  多疑: '更容易撞破配偶的私情；装作不知道会心烦。', 轻信: '容易相信人。',
  野心: '四项都高一点；一年名望不涨会心烦；被越过继承更记恨，出走会去投对头。', 知足: '不争。',
  多情: '容易动心、容易出轨（三倍）；幽会让他舒心。', 专一: '不容易出轨（三成）、难勾引；自己偷情会心烦。',
  诚实: '说谎、勒索、偷情会心烦。', 狡诈: '有专属的诈术选项；做了宿敌会构陷你。',
  勤快: '每季多 1 点精力；精力没用完会心烦。', 慵懒: '每季少 1 点精力。',
  好客: '可以多交一位知己。', 记仇: '得罪了就成宿敌（被勒索、被撞破私情）。', 嫉妒: '见不得别人好。',
  夜猫子: '夜里的事有专属选项；比剑善闪。', 怕水: '猫的本性，没什么用。',
  兵家: '成年时所学。每颗星 武+2。', 法家: '成年时所学。每颗星 政+2。', 纵横家: '成年时所学。每颗星 交+2。', 鬼谷门生: '成年时所学。每颗星 谋+2。',
  舔毛成癖: '崩溃后落下的。每季多消 15 心烦，心烦时健康-2。', 暴食: '崩溃后落下的。每季多消 15 心烦，心烦时鱼干-10。',
  夜游: '崩溃后落下的。每季多消 15 心烦。', 拆家: '崩溃后落下的。每季多消 15 心烦，心烦时家人好感-3。',
  豪商: '一辈子挣够了一千鱼干。', 清望: '名望到过名士。', 情种: '有过三个情人。', 伤疤: '受过伤。', 跛足: '受过重伤。',
  先天不足: '天生的。更容易早逝。',
};
function traitCard(t, c) {
  const L = [], T0 = TR[t];
  if (T0 && T0.s.some(v => v)) L.push(T0.s.map((v, i) => v ? STATN[i] + (v > 0 ? '+' : '') + v + (T0.k === 'edu' ? '/星' : '') : '').filter(Boolean).join(' '));
  for (const k in CONG) { const e = CONG[k].find(x => x && x[0] === t); if (e) L.push('天生的，会遗传。' + (k === 'wit' ? '四项' : k === 'body' ? '武' : '交') + (e[1] > 0 ? '+' : '') + e[1]
    + (k === 'look' ? ' · 别人对' + ta(c) + '好感' + (e[1] > 0 ? '+' : '') + e[1] * 4 : k === 'body' ? (e[1] < 0 ? ' · 寿命短' : e[1] >= 2 ? ' · 寿命长' : '') : '')); }
  if (TRD[t]) L.push(TRD[t]);
  if (T0 && T0.op) L.push('和「' + T0.op + '」的人互相看不惯（好感-7）；同是「' + t + '」的好感+5。');
  showCard({ title: t, who: [], text: L.join('\n') || '没什么特别的。', opts: [opt('知道了', '', () => {})] });
}
function traitCol(t) { if (EDU.includes(t)) return '#3f8a5e'; if (TR[t] && TR[t].k === 'cat') return '#c06a8a'; if (!TR[t]) return '#4a78a8'; return '#8a6a3a'; }
