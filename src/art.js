// Story artwork is optional at render time; the original pixel sprites remain a loading/error fallback.
const ART_IMAGES = new Map(), ART_DEAD = new Map(), ARTQ = [];
const STORY_GENES = {
  li1: { O: ['o'], A: ['A', 'a'], S: ['S', 's'] },
  li2: { O: ['o', 'o'], D: ['d', 'd'] },
  li3: { O: ['O'], A: ['A', 'a'] },
  zheng: { O: ['o'] }, chengjiao: { O: ['o'] },
};
function fixStoryDesign(c, key) {
  if (!STORY_GENES[key]) return;
  // Only appearance loci are fixed. Aptitude, health, personality and true parentage stay procedural.
  const genes = Object.assign({ B: ['B', 'b'], D: ['D', 'd'], A: ['a', 'a'], T: ['Tm', 'tb'], Sp: ['sp', 'sp'],
    S: ['s', 's'], W: ['w', 'w'], C: ['C', 'C'], I: ['i', 'i'], L: ['L', 'l'], eye: [.38, .38] }, STORY_GENES[key]);
  for (const [locus, alleles] of Object.entries(genes)) c.g[locus] = alleles.slice();
  c.seed = hashStr('story-art:' + key); c.flags.artIdentity = key;
}
function artDefaults() {
  const seen = W.art && W.art.seen;
  W.art = { seen: {} };
  if (seen && typeof seen === 'object' && !Array.isArray(seen)) for (const id of Object.keys(STORY_CG)) {
    const e = seen[id];
    if (e && Number.isInteger(e.t) && e.t >= 0 && e.t <= W.t) W.art.seen[id] = { t: e.t, title: typeof e.title === 'string' ? e.title.slice(0, 40) : STORY_CG[id].title };
  }
}
SYS.init.push(artDefaults);
SYS.load.push(artDefaults);
function artImage(path) {
  let im = ART_IMAGES.get(path);
  if (!im) { im = new Image(); im.onerror = () => { im.failed = true; }; im.src = path; ART_IMAGES.set(path, im); }
  return im;
}
function characterArtKey(c) {
  if (!c) return null;
  let id = c.flags && c.flags.artIdentity;
  if (!id && c.hist && ART_CAST[c.id]) id = c.id;
  if (!id || !ART_CAST[id]) return null;
  // Legacy saves keep their original genes and descendants. Never draw a black 政 over a different old coat.
  if (['zheng', 'chengjiao'].includes(id) && coatName(phenotype(c.g)) !== '黑猫') return null;
  if (id === 'zheng') return ageOf(c) < 3 ? 'zheng-baby' : ageOf(c) < 16 ? 'zheng-young' : 'zheng';
  if (ageOf(c) < 16) return null;
  if (id === 'yiren' && c.role === 'ruler') return 'yiren-king';
  if (id === 'zhaoji' && /太后|王后/.test(c.disp || '')) return 'zhaoji-queen';
  if (id === 'li2' && W.kingId === 'zheng' && C('zheng') && C('zheng').mom === c.id) return 'li2-queen';
  return id;
}
function illustratedPortrait(c) {
  const id = characterArtKey(c); if (!id) return null;
  const im = artImage('art/faces/' + id + '.webp');
  if (!im.complete || !im.naturalWidth) return null;
  if (c.dead === null) return im;
  if (!ART_DEAD.has(id)) ART_DEAD.set(id, paint(192, 192, gx => { gx.filter = 'grayscale(1)'; gx.globalAlpha = .65; gx.drawImage(im, 0, 0, 192, 192); }));
  return ART_DEAD.get(id);
}
function drawArt(path, x, y, w, h) {
  const im = artImage(path);
  if (im.complete && im.naturalWidth) { ARTQ.push({ im, x, y, w, h }); return true; }
  rect(x, y, w, h, '#171b26');
  txt(im.failed ? '画面暂未载入' : '画卷展开中…', x + w / 2, y + h / 2, 7, '#d9c8a0', 'center', null);
  return false;
}
const CG_EVENT = {
  prologue: 'prologue', qihuo: 'qihuo', lvfeast: 'lvfeast', changping: 'changping', siege: 'siege', escape: 'escape',
  qiefu: 'qiefu', xianyang: 'xianyang', zhuangxiang: 'young-king', zhongfu: 'young-king', guanli: 'guanli', qingsuan: 'qingsuan',
  a3_jingke: 'jingke', a3_chengdi: 'unification', a4_daze: 'daze',
};
function storyCGFor(event, e) {
  if (SAVE_SUSPENDED || CATCHUP) return null;
  if (event === 'zhengborn') {
    const z = C('zheng'), mom = z && C(z.mom);
    if (!z || !characterArtKey(z) || !mom) return null;
    return mom.id === 'zhaoji' ? 'zheng-zhao' : mom.flags.artIdentity === 'li2' ? 'zheng-li' : null;
  }
  const id = CG_EVENT[event]; if (!id) return null;
  if (['young-king', 'guanli', 'qingsuan', 'jingke'].includes(id)) {
    const z = C('zheng');
    if (!alive(z) || !characterArtKey(z) || W.kingId !== 'zheng') return null;
    if (id === 'qingsuan' && e.title !== '清算') return null;
  }
  return id;
}
function offerStoryCG(event, e) {
  const id = storyCGFor(event, e); if (!id || !STORY_CG[id]) return;
  if (!W.art) artDefaults();
  if (W.art.seen[id]) return;
  W.art.seen[id] = { t: W.t, title: e.title };
  // The event is already underneath this modal: dismissing the picture cannot lose its choices or callbacks.
  openCG(id, false);
}
function openCG(id, replay = true) {
  if (!STORY_CG[id] || !W.art || !W.art.seen[id]) return;
  artImage('art/cg/' + id + '.webp');
  MODAL.push({ type: 'cg', id, replay, hold: true }); SFX.page();
}
function drawCG(m) {
  const a = STORY_CG[m.id], entry = W.art.seen[m.id];
  rect(0, 16, 180, 304, '#111521');
  rect(12, 33, 156, 1, '#67563b');
  txt('一 喵 天 下  ·  史 卷', 90, 29, 6, '#c9aa70', 'center', null);
  txt(a.title, 90, 53, 14, '#f3dfac', 'center', '#282130');
  txt(yearTxt(entry.t) + SEASON[entry.t % 4], 90, 69, 6, '#a3a6af', 'center', null);
  rect(4, 82, 172, 99, '#8b7044');
  drawArt('art/cg/' + m.id + '.webp', 6, 84, 168, 94.5);
  const lines = wrapT(a.caption, 150, 8, 1);
  lines.forEach((line, i) => txt(line, 90, 202 + i * 13, 8, '#e9ddc5', 'center', null, 1, 1));
  btn(34, 239, 112, 19, '展开画卷', 'dark', () => openArtZoom('art/cg/' + m.id + '.webp', a.title));
  btn(20, 270, 140, 24, m.replay ? '回到图鉴' : '继续剧情', 'gold', () => { drop(m); saveGame(); });
  txt(m.replay ? '曾经的这一刻' : '已收入画卷图鉴', 90, 307, 5.5, '#a3a6af', 'center', null);
}
SYS.modal.cg = drawCG;
function openCharacterArt(c) {
  const id = characterArtKey(c); if (!id) return;
  artImage('art/portraits/' + id + '.webp');
  MODAL.push({ type: 'characterArt', id: c.id, hold: true }); SFX.page();
}
SYS.modal.characterArt = m => {
  const c = C(m.id), id = characterArtKey(c); if (!id) { drop(m); return; }
  rect(0, 16, 180, 304, '#171b26');
  rect(12, 23, 156, 1, '#806845');
  txt(nm(c), 90, 39, 12, '#f3dfac', 'center', null);
  txt(catLook(c).coat + ' · ' + (c.dead !== null ? '已故' : c.female ? '女' : '男'), 90, 56, 6, '#c1baa9', 'center', null);
  drawArt('art/portraits/' + id + '.webp', 21, 64, 138, 184);
  btn(24, 255, 132, 19, '查看完整立绘', 'dark', () => openArtZoom('art/portraits/' + id + '.webp', nm(c)));
  btn(24, 285, 132, 21, '返回', 'gold', () => drop(m));
};
function openArtGallery() {
  if (!W.art) artDefaults();
  const unlocked = Object.keys(STORY_CG).filter(id => W.art.seen[id]);
  const rows = [{ t: '人物立绘 ›', s: '查看已经登场的人物', fn: openCastGallery }, ...Object.keys(STORY_CG).map(id => {
    const a = STORY_CG[id], e = W.art.seen[id];
    return e ? { t: a.title + ' ›', s: yearTxt(e.t) + SEASON[e.t % 4] + ' · ' + a.caption, wrap: true, fn: () => openCG(id) }
      : { t: '未展开的画卷', s: '在重要事件中解锁', col: '#958873' };
  })];
  openList('画卷图鉴', rows, { sub: '已解锁 ' + unlocked.length + ' / ' + Object.keys(STORY_CG).length + ' · 仅记录亲历的剧情' });
}
function openCastGallery() {
  const cats = Object.values(W.chars).filter(c => characterArtKey(c) && c.born <= W.t);
  openList('人物立绘', cats.map(c => ({ por: c, t: nm(c) + ' ›', s: catLook(c).coat + ' · ' + (c.dead !== null ? '已故' : ROLEN[c.role] || '狸家'), fn: () => openCharacterArt(c) })), { sub: '已登场 ' + cats.length + ' 位 · 点击查看全身像' });
}
function openArtZoom(path, title) {
  closeUtility();
  const root = document.createElement('div'), panel = document.createElement('div');
  root.className = 'save-overlay'; panel.className = 'art-panel';
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', title);
  const heading = document.createElement('h2'), im = document.createElement('img'), close = document.createElement('button');
  heading.textContent = title; im.alt = title; im.src = path; close.textContent = '返回游戏'; close.onclick = closeUtility;
  panel.appendChild(heading); panel.appendChild(im); panel.appendChild(close); root.appendChild(panel);
  root.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); closeUtility(); } if (e.key === 'Tab') { e.preventDefault(); close.focus(); } });
  document.body.appendChild(root); utilityEl = root; down = null; close.focus();
}
