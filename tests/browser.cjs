'use strict';
// Optional real-browser checks: install Playwright locally or set PAW_PLAYWRIGHT to an existing package.
const { chromium } = require(process.env.PAW_PLAYWRIGHT || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), out = path.join(root, '.test-output');
fs.mkdirSync(out, { recursive: true });
const hook = `const reviewSetItem = Storage.prototype.setItem; window.__review = {
  start(i) { closeUtility(); MODAL.length = 0; startScen(i); scenSettle(); MODAL.length = 0; W.flags.tourDone = true; W.flags.raceTip = true; saveGame(); render(); },
  world: () => JSON.parse(JSON.stringify(W)),
  cgStart() { closeUtility(); newGame(); state='game'; saveGame(); pumpQueue(); render(); },
  modal: () => top() && { type:top().type, title:top().e && top().e.title, id:top().id },
  cgHit: () => HITS[0].r,
  artReady: path => { const im=ART_IMAGES.get(path); return !!(im && im.complete && im.naturalWidth); },
  facesReady: () => { const faces=[...ART_IMAGES].filter(([p])=>p.startsWith('art/faces/')); return faces.length>0 && faces.every(([,im])=>im.complete && im.naturalWidth); },
  cgSeen: () => Object.keys(W.art.seen),
  artGallery() { MODAL.length=0; W.queue=[]; openArtGallery(); render(); },
  castGallery() { MODAL.length=0; W.queue=[]; openCastGallery(); render(); },
  familyTree() { MODAL.length=0; W.queue=[]; openFamily(); render(); },
  share() { makeShare('狸家'); },
  cast(id) { MODAL.length=0; W.queue=[]; openSheet(id || W.flags.prologueKids[1]); render(); },
  deadCast() { const c=C(W.flags.prologueKids[1]); c.dead=W.t; MODAL.length=0; W.queue=[]; openSheet(c.id); render(); },
  deadFacePixels() {
    const c=C(W.flags.prologueKids[1]), im=illustratedPortrait(c), same=im===illustratedPortrait(c);
    const pixels=im.getContext('2d').getImageData(0,0,im.width,im.height).data;
    let visible=0, colored=0, maxAlpha=0;
    for(let i=0;i<pixels.length;i+=4) { maxAlpha=Math.max(maxAlpha,pixels[i+3]); if(pixels[i+3]>100) { visible++; if(Math.max(pixels[i],pixels[i+1],pixels[i+2])-Math.min(pixels[i],pixels[i+1],pixels[i+2])>2) colored++; } }
    return {visible,colored,maxAlpha,same};
  },
  missingCG() { MODAL.length=0; W.queue=[]; ART_IMAGES.delete('art/cg/qihuo.webp'); W.art.seen.qihuo={t:W.t,title:'奇货'}; openCG('qihuo'); render(); },
  artFailed: () => !!ART_IMAGES.get('art/cg/qihuo.webp').failed,
  journal() { MODAL.length = 0; openChronicle(); render(); },
  conquest() { const k = A3_RK.find(k => !rFallen(k)); if (k) fallRealm(k, 'yield'); scenSettle(); MODAL.length = 0; },
  close() { MODAL.length = 0; closeUtility(); render(); },
  saves() { openSaveManager(); },
  season() { endSeason(); scenSettle(); MODAL.length = 0; saveGame(); },
  choice() { showCard({ title: '等待选择', text: '此时刷新应回到之前的完整进度。', opts: [opt('继续', '', () => { W.fish += 7; }), opt('等等', '', () => {})] }); saveGame(); },
  failSave() { Storage.prototype.setItem = () => { throw Error('quota'); }; W.fish += 3; saveGame(); },
  allowSave() { Storage.prototype.setItem = reviewSetItem; },
  corrupt() { localStorage.setItem('all-under-paw-w', '{broken'); state = 'title'; TSAVE = undefined; render(); }
};`;
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/review.html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace('/*TEST_HOOK*/', hook)); return;
  }
  const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', file.endsWith('.woff2') ? 'font/woff2' : file.endsWith('.jpg') ? 'image/jpeg' : 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.PAW_BROWSER ? { executablePath: process.env.PAW_BROWSER } : {}) });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const tap = async (x, y) => { const box = await page.locator('#c').boundingBox(); await page.mouse.click(box.x + box.width * x / 180, box.y + box.height * y / 320); };
    const tapCG = async () => { const [x,y,w,h] = await page.evaluate(() => window.__review.cgHit()); await tap(x+w/2,y+h/2); };
    const shot = async name => { await page.evaluate(() => document.fonts.ready); await page.screenshot({ path: path.join(out, name + '.png') }); };
    await page.goto('http://127.0.0.1:' + server.address().port + '/review.html');
    await page.waitForFunction(() => window.__gameBooted);
    await shot('title');
    await tap(20, 10);
    await page.getByRole('dialog', { name: '狸家存档' }).waitFor();
    assert.equal(await page.getByRole('button', { name: '导出当前存档' }).isDisabled(), true);
    await page.getByRole('button', { name: '回到游戏' }).click();
    await page.evaluate(() => window.__review.start(0));
    await page.waitForTimeout(80); await tap(50, 38); await shot('objective-act1');
    await page.evaluate(() => { window.__review.close(); window.__review.start(3); });
    await page.waitForTimeout(80); await tap(50, 38); await shot('objective-act3');
    await page.evaluate(() => { window.__review.close(); window.__review.conquest(); window.__review.journal(); }); await shot('chronicle');
    await page.evaluate(() => { window.__review.close(); window.__review.season(); window.__review.saves(); });
    await page.getByRole('dialog').waitFor(); await shot('save-manager');
    assert.ok(!(await page.getByRole('button', { name: '恢复备份' }).isDisabled()));
    const before = await page.evaluate(() => window.__review.world());
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出当前存档' }).click();
    const download = await downloadPromise; await download.saveAs(path.join(out, 'export.json'));
    const exported = JSON.parse(fs.readFileSync(path.join(out, 'export.json'), 'utf8'));
    assert.equal(exported.world.t, before.t);
    await page.locator('input[type=file]').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{bad') });
    await page.getByRole('status').filter({ hasText: '损坏' }).waitFor();
    assert.equal((await page.evaluate(() => window.__review.world())).fish, before.fish);
    exported.world.fish += 123;
    await page.locator('input[type=file]').setInputFiles({ name: 'valid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) });
    await page.getByRole('button', { name: '确认导入' }).waitFor();
    assert.equal((await page.evaluate(() => window.__review.world())).fish, before.fish);
    await shot('import-confirm');
    await page.getByRole('button', { name: '确认导入' }).click();
    assert.equal((await page.evaluate(() => window.__review.world())).fish, before.fish + 123);
    await page.evaluate(() => window.__review.saves());
    await page.getByRole('button', { name: '恢复备份' }).click();
    await page.getByRole('button', { name: '确认恢复' }).click();
    assert.equal((await page.evaluate(() => window.__review.world())).fish, before.fish);
    await page.evaluate(() => window.__review.corrupt());
    await page.waitForTimeout(80); await tap(90, 275);
    await page.getByRole('dialog').waitFor();
    await page.getByRole('button', { name: '恢复备份' }).click();
    await page.getByRole('button', { name: '确认恢复' }).click();
    assert.equal((await page.evaluate(() => window.__review.world())).fish, before.fish + 123);
    await page.evaluate(() => { window.__review.choice(); });
    const checkpoint = await page.evaluate(() => localStorage.getItem('all-under-paw-w'));
    await page.reload(); await page.waitForFunction(() => window.__gameBooted); await tap(90, 275);
    assert.equal((await page.evaluate(() => window.__review.world())).fish, JSON.parse(checkpoint).fish);
    await page.evaluate(() => window.__review.saves());
    await page.setViewportSize({ width: 320, height: 568 }); await shot('save-small-phone');
    assert.ok(await page.locator('.save-panel').evaluate(el => el.getBoundingClientRect().bottom <= innerHeight));
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').count(), 0);
    await page.evaluate(() => { window.__review.close(); window.__review.failSave(); window.__review.saves(); });
    await page.getByRole('status').filter({ hasText: '进度未能保存' }).waitFor();
    const failedWorld = await page.evaluate(() => window.__review.world());
    const failedDownloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出当前存档' }).click();
    await (await failedDownloadPromise).saveAs(path.join(out, 'unsaved-export.json'));
    assert.equal(JSON.parse(fs.readFileSync(path.join(out, 'unsaved-export.json'), 'utf8')).world.fish, failedWorld.fish);
    await page.evaluate(() => window.__review.allowSave());
    await page.getByRole('button', { name: '立即保存' }).click();
    await page.getByRole('status').filter({ hasText: '当前进度已保存' }).waitFor();
    await page.evaluate(() => window.__review.cgStart());
    await page.setViewportSize({width:390,height:844});
    await page.waitForFunction(() => window.__review.artReady('art/cg/prologue.webp'));
    assert.equal((await page.evaluate(() => window.__review.modal())).type,'cg');
    await shot('cg-prologue');
    assert.equal(await page.getByRole('dialog').count(),0);
    await tapCG();
    assert.equal((await page.evaluate(() => window.__review.modal())).title,'三问');
    await shot('cg-original-choice');
    await page.evaluate(() => window.__review.cast());
    await page.waitForFunction(() => window.__review.artReady('art/faces/li2.webp'));
    await shot('character-sheet');
    await page.waitForTimeout(100); await tap(40,55);
    await page.waitForFunction(() => window.__review.artReady('art/portraits/li2.webp'));
    await shot('character-standing');
    await page.setViewportSize({width:320,height:568}); await shot('character-small-phone');
    assert.equal(await page.getByRole('dialog').count(),0);
    await tap(90,302);
    assert.equal((await page.evaluate(() => window.__review.modal())).type,'sheet');
    await page.waitForTimeout(100); await tap(40,55); await page.waitForTimeout(100); await tap(166,29);
    assert.equal((await page.evaluate(() => window.__review.modal())).type,'sheet');
    await page.evaluate(() => window.__review.artGallery()); await shot('art-gallery');
    assert.deepEqual(await page.evaluate(() => window.__review.cgSeen()),['prologue']);
    await page.evaluate(() => window.__review.castGallery());
    await page.waitForFunction(() => window.__review.facesReady());
    await shot('faces-clear');
    await page.mouse.wheel(0,190); await page.waitForTimeout(150); await shot('faces-scrolled');
    await page.evaluate(() => window.__review.deadCast()); await shot('face-deceased');
    const deadFace=await page.evaluate(() => window.__review.deadFacePixels());
    assert.ok(deadFace.visible>1000); assert.equal(deadFace.colored,0);
    assert.ok(deadFace.maxAlpha>=160 && deadFace.maxAlpha<=170); assert.ok(deadFace.same);
    await page.evaluate(() => window.__review.familyTree()); await shot('faces-family');
    await page.evaluate(() => window.__review.share());
    await page.getByAltText('战绩').waitFor();
    assert.ok(await page.getByAltText('战绩').evaluate(im => im.naturalWidth === 720));
    await page.reload(); await page.waitForFunction(() => window.__gameBooted);
    await page.evaluate(() => window.__review.start(0));
    await page.route('**/art/cg/qihuo.webp',route=>route.abort());
    await page.evaluate(() => window.__review.missingCG());
    await page.waitForFunction(() => window.__review.artFailed()); await shot('cg-missing-image');
    await page.waitForTimeout(100); await tapCG();
    assert.notEqual((await page.evaluate(() => window.__review.modal()))?.type,'cg');
    assert.equal(await page.locator('#game-err').count(), 0);
    assert.deepEqual(errors, []);
    console.log('PASS: real browser; save/recovery/journal, paper CG window and original choices, portrait sheet/standing view and both close buttons, clear faces/list scrolling/family/share, gallery locks, failed-image fallback, 320px layout.');
  } finally { if (browser) await browser.close(); await new Promise(r => server.close(r)); }
})().catch(e => { console.error(e); process.exitCode = 1; });
