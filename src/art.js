// Story artwork is optional at render time; the original pixel sprites remain a loading/error fallback.
const ART_IMAGES = new Map(), ART_DEAD = new Map(), ARTQ = [];
const STORY_GENES = {
  li1: { O: ['o'], A: ['A', 'a'], S: ['S', 's'] },
  li2: { O: ['o', 'o'], B: ['B', 'B'], A: ['A', 'a'], S: ['S', 's'], L: ['L', 'L'] },
  li3: { O: ['O'], A: ['A', 'a'] },
  chengjiao: { O: ['o'] },
};
const STORY_LOOK_LOCI = ['O', 'B', 'D', 'A', 'T', 'Sp', 'S', 'W', 'C', 'I', 'L', 'eye'];
function zhengAppearance(mom, dad) {
  // Choose a real cross from these parents, preserving paternal/maternal allele order.
  // Both routes have the same phenotype, not a cloned parental genome.
  for (let seed = 1; seed <= 512; seed++) {
    const inherited = breed(mom.g, dad.g, mulberry32(seed), 'M'), p = phenotype(inherited);
    const legal = Object.keys(ALLELES).concat(['W']).every(k => dad.g[k].includes(inherited[k][0]) && mom.g[k].includes(inherited[k][1]));
    if (legal && p.eu === 'black' && p.orange === 'none' && p.agouti && p.white === 1 && p.tabbyType === 'Tm' && p.eye === 'gold'
        && inherited.D.includes('d') && !p.allWhite && !p.silver && !p.point && !p.long) {
      return Object.fromEntries(STORY_LOOK_LOCI.map(k => [k, inherited[k]]));
    }
  }
  return null;
}
function fixStoryDesign(c, key) {
  if (key === 'zheng') {
    const mom = C(c.mom), bio = C(c.bio || c.dad);
    // Other/legacy family branches retain their actual inheritance and procedural portrait.
    if (!mom || !bio || !(mom.id === 'zhaoji' && bio.id === 'lv' || mom.flags.artIdentity === 'li2' && bio.id === 'yiren')) return;
    const appearance = zhengAppearance(mom, bio); if (!appearance) return;
    for (const [locus, alleles] of Object.entries(appearance)) c.g[locus] = alleles.slice();
    c.seed = hashStr('story-art:zheng'); c.flags.artIdentity = key; c.flags.artDesign = 2;
    return;
  }
  if (!STORY_GENES[key]) return;
  // Only appearance loci are fixed. Aptitude, health, personality and true parentage stay procedural.
  const genes = Object.assign({ B: ['B', 'b'], D: ['D', 'd'], A: ['a', 'a'], T: ['Tm', 'tb'], Sp: ['sp', 'sp'],
    S: ['s', 's'], W: ['w', 'w'], C: ['C', 'C'], I: ['i', 'i'], L: ['L', 'l'], eye: [.38, .38] }, STORY_GENES[key]);
  for (const [locus, alleles] of Object.entries(genes)) c.g[locus] = alleles.slice();
  c.seed = hashStr('story-art:' + key); c.flags.artIdentity = key; c.flags.artDesign = 2;
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
  // New artwork must never overwrite a legacy character's different coat.
  if (['li2', 'zheng'].includes(id) && (!c.flags || c.flags.artDesign !== 2)) return null;
  if (id === 'chengjiao' && coatName(phenotype(c.g)) !== '黑猫') return null;
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
  if (!ART_DEAD.has(id)) {
    // paint() supplies the game's pixel Grid, not a CanvasRenderingContext2D.
    const face = mk(192, 192), gx = face.getContext('2d');
    gx.filter = 'grayscale(1)'; gx.globalAlpha = .65;
    gx.drawImage(im, 0, 0, 192, 192);
    ART_DEAD.set(id, face);
  }
  return ART_DEAD.get(id);
}
// Draw illustrated faces at display resolution, with the same viewport and badges as the pixel UI.
function queuePortrait(im, x, y, size) {
  if (DRY) return null;
  const a = { im, x, y, w: size, h: size, clip: TCLIP && TCLIP.slice(), alpha: g.globalAlpha, smooth: true };
  ARTQ.push(a); return a;
}
function presentArtwork(target, scale) {
  for (const a of ARTQ) {
    target.save();
    target.imageSmoothingEnabled = !!a.smooth;
    if (a.smooth) target.imageSmoothingQuality = 'high';
    target.globalAlpha = a.alpha === undefined ? 1 : a.alpha;
    if (a.clip) { target.beginPath(); target.rect(...a.clip.map(v => v * scale)); target.clip(); }
    if (a.cutouts) {
      target.beginPath(); target.rect(a.x * scale, a.y * scale, a.w * scale, a.h * scale);
      for (const r of a.cutouts) target.rect(...r.map(v => v * scale));
      target.clip('evenodd');
    }
    target.drawImage(a.im, a.x * scale, a.y * scale, a.w * scale, a.h * scale);
    target.restore();
  }
  ARTQ.length = 0;
}
function drawArt(path, x, y, w, h) {
  const im = artImage(path);
  if (im.complete && im.naturalWidth) { ARTQ.push({ im, x, y, w, h }); return true; }
  rect(x, y, w, h, '#e8d4a8');
  txt(im.failed ? '画面暂未载入' : '画卷展开中…', x + w / 2, y + h / 2, 7, LABC, 'center', null);
  return false;
}
const CG_EVENT = {
  prologue: 'prologue', qihuo: 'qihuo', lvfeast: 'lvfeast', changping: 'changping', siege: 'siege', escape: 'escape',
  qiefu: 'qiefu', xianyang: 'xianyang', zhuangxiang: 'young-king', zhongfu: 'young-king', guanli: 'guanli', qingsuan: 'qingsuan',
  a3_jingke: 'jingke', a3_chengdi: 'unification', a4_daze: 'daze',
};
function storyCGFor(event, e) {
  if (SAVE_SUSPENDED || CATCHUP) return null;
  if (event === 'born' && e.title === '政' && (e.who || []).includes('zheng')) event = 'zhengborn';
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
  const x = 6, w = 168, lines = wrapT(a.caption, w - 16, 7, 1);
  const h = 154 + lines.length * 11, y = R((H - h) / 2);
  HITS = [];
  g.globalAlpha = .55; rect(0, 0, W_, H, '#0a0810'); g.globalAlpha = 1;
  paper(x, y, w, h);
  rect(x + 30, y + 6, w - 60, 12, PAL.lacq); rect(x + 30, y + 17, w - 60, 1, PAL.jiang);
  txt(a.title, 90, y + 12, 8, '#fff6dc', 'center', PAL.jiang);
  txt(yearTxt(entry.t) + SEASON[entry.t % 4], 90, y + 26, 5.5, LABC, 'center', null);
  rect(x + 5, y + 34, 158, 90, OUT);
  drawArt('art/cg/' + m.id + '.webp', x + 6, y + 35, 156, 87.75);
  lines.forEach((line, i) => txt(line, x + 8, y + 132 + i * 11, 7, '#2a1a10', 'left', null, 1, 1));
  btn(x + 6, y + h - 23, w - 12, 17, m.replay ? '回到图鉴' : '继续剧情', 'dark', () => { drop(m); saveGame(); });
  TANCH = offPaper(y, h);
}
SYS.modal.cg = drawCG;
function openCharacterArt(c) {
  const id = characterArtKey(c); if (!id) return;
  artImage('art/portraits/' + id + '.webp');
  MODAL.push({ type: 'characterArt', id: c.id, hold: true }); SFX.page();
}
SYS.modal.characterArt = m => {
  const c = C(m.id), id = characterArtKey(c); if (!id) { drop(m); return; }
  HITS = [];
  g.globalAlpha = .55; rect(0, 0, W_, H, '#0a0810'); g.globalAlpha = 1;
  paper(3, 18, 174, 300);
  btn(158, 22, 16, 14, '×', 'dark', () => drop(m));
  txt(nm(c), 90, 32, fitSize(nm(c), 120, 10), '#3a2418', 'center', null);
  txt(catLook(c).coat + ' · ' + (c.dead !== null ? '已故' : c.female ? '女' : '男'), 90, 47, 6, LABC, 'center', null);
  drawArt('art/portraits/' + id + '.webp', 12, 60, 156, 208);
  btn(60, 294, 60, 16, '返回', 'dark', () => drop(m));
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
