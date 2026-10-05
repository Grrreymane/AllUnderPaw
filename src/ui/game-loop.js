// ============================================================ loop
function update(dt) {
  if (utilityEl) return;
  T += dt;
  // a conversation card leaves by itself after a while; windows from systems may animate (m.upd)
  for (const m of MODAL.slice()) { if (m.type === 'talk' && T - m.t0 > 3.2) drop(m); else if (m.upd) m.upd(dt); }
  // notices wait while a story card, the guide, a conversation or a hold window is on screen, so they never cover it;
  // three at a time, and they go faster while more are waiting
  if (!holding()) {
    while (TOASTS.length < 3 && TPEND.length) TOASTS.push(TPEND.shift());
    const sp = 1 + Math.min(2, TPEND.length * .3);
    for (let i = TOASTS.length - 1; i >= 0; i--) { TOASTS[i].life -= dt * sp; if (TOASTS[i].life <= 0) TOASTS.splice(i, 1); }
  }
  historyFlushPending();
  if (SAVE_STATUS.pending && saveReady()) saveGame();
  if (state === 'game') { pumpQueue(); if (W.news.length && !TPEND.length && TOASTS.length < 3) toast(W.news.shift(), '#f2ead4'); }
  music(dt);
}
// the built-in windows; a system adds its own kinds with SYS.modal[type] = draw(m) (and m.upd(dt) if it animates;
// m.hold if the story queue and notices must wait under it, like a duel started from an event option)
const DRAWM = { event: drawEvent, sheet: drawSheet, family: drawFamily, pick: drawPick, opts: drawOpts, why: drawWhy, talk: drawTalk, tour: drawTour, list: drawList, acts: drawActs };
const SCROLLM = new Set(['family', 'pick', 'list', 'acts']);
function render() {
  TQ.length = 0; ARTQ.length = 0; HITS = []; TCLIP = HCLIP = null; DRY = false;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, cv.width, cv.height);
  g.imageSmoothingEnabled = false; g.globalAlpha = 1;
  if (state === 'title') drawTitleArt(); else rect(0, 0, W_, H, '#2a2030');
  if (state === 'title') { SCR = NOSCR; drawTitle(); }
  else {
    SCR = PEOPLE_SCR;
    drawCity();
    for (const m of MODAL.slice()) {
      layerBreak();
      SCR = m.scr || (m.scr = newScr());
      const f = DRAWM[m.type];
      if (f) f(m);
      else if (SYS.modal[m.type]) { if (!m.pass) HITS = []; TANCH = [20, 1]; SYS.modal[m.type](m); }
      else drop(m);   // a window nobody can draw must not block the game
    }
    // only the top layer scrolls
    const t = top();
    SCR = t ? (SCROLLM.has(t.type) || t.scroll ? t.scr : NOSCR) : (W.loc === 'people' ? PEOPLE_SCR : NOSCR);
    NOSCR.max = NOSCR.maxX = 0;
  }
  layerBreak();
  const keepHits = HITS; drawTopBar(); HITS = keepHits;
  if (!holding()) drawToasts();
  present();
}
// Text is drawn crisp on top of the pixel layer, so every modal starts a new layer: flush what's below first.
function layerBreak() { present(); g.clearRect(0, 0, W_, H); TQ.length = 0; }
