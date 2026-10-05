// ============================================================ screen + input
const wrap = document.getElementById('wrap'), cv = document.getElementById('c'), ctx = cv.getContext('2d');
const low = mk(W_, H);
let g = low.getContext('2d');
let K = 1;
function fit() {
  const r = wrap.getBoundingClientRect(), cs = getComputedStyle(wrap);
  const aw = r.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), ah = r.height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const sc = Math.max(.5, Math.min(aw / W_, ah / H)), cw = Math.floor(W_ * sc), ch = Math.floor(H * sc);
  cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  cv.width = R(cw * dpr); cv.height = R(ch * dpr); K = cv.width / W_;
}
window.addEventListener('resize', fit); fit();
function toLogical(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W_, y: (e.clientY - r.top) / r.height * H }; }
const inR = (p, r) => p.x >= r[0] && p.x <= r[0] + r[2] && p.y >= r[1] && p.y <= r[1] + r[3];
let down = null;
// Every scrolling layer (the 人 list, each list / tree / picker window) keeps its own scroll state, so layers never
// reset each other. render() points SCR at the layer it is drawing, and afterwards at the top layer: only that one
// follows a drag or the wheel.
const newScr = () => ({ key: '', y: 0, max: 0, x: 0, maxX: 0, minY: 0 });   // x/maxX/minY only for the 2-D family tree
const PEOPLE_SCR = newScr(), NOSCR = newScr();
let SCR = NOSCR;
window.addEventListener('pointerdown', e => {
  if (shareEl || utilityEl) return;
  if (e.button === 2) { e.preventDefault(); return; }   // right click is "back" (contextmenu), never a tap
  e.preventDefault(); initAudio();
  const p = toLogical(e); down = { x: p.x, y: p.y, s: SCR, sy: SCR.y, sx: SCR.x, moved: false };
}, { passive: false });
window.addEventListener('pointermove', e => {
  if (!down) return; const p = toLogical(e), S = down.s;
  if (Math.abs(p.y - down.y) > 5 || Math.abs(p.x - down.x) > 5) down.moved = true;
  if (down.moved && S.max > 0) S.y = clamp(down.sy - (p.y - down.y), S.minY || 0, S.max);
  if (down.moved && S.maxX > 0) S.x = clamp(down.sx - (p.x - down.x), 0, S.maxX);
});
window.addEventListener('pointerup', e => { if (!down) return; const p = toLogical(e), d = down; down = null; if (!d.moved) onTap(p); });
['pointercancel', 'blur'].forEach(ev => window.addEventListener(ev, () => { down = null; }));
// right click (desktop) goes back one window; a card that wants an answer and a duel stay
window.addEventListener('contextmenu', e => {
  if (shareEl || utilityEl) return; e.preventDefault();
  const m = MODAL[MODAL.length - 1]; if (!m || state !== 'game') return;
  if (m.type === 'duel' || m.type === 'tour' || (m.type === 'event' && !(m.e.opts.length === 1 && !m.e.opts[0].hint))) return;
  if (m.type === 'event') choose(m, m.e.opts[0]); else MODAL.pop();
  SFX.click();
});
['touchstart', 'touchmove', 'touchend'].forEach(ev => window.addEventListener(ev, e => { if (!shareEl && !utilityEl && e.cancelable) e.preventDefault(); }, { passive: false }));
['selectstart', 'dragstart', 'gesturestart'].forEach(ev => window.addEventListener(ev, e => { if (!shareEl && !utilityEl) e.preventDefault(); }));
window.addEventListener('wheel', e => {
  if (utilityEl) return;
  const S = SCR;
  if (S.max > 0) S.y = clamp(S.y + e.deltaY * .3, S.minY || 0, S.max);
  if (S.maxX > 0 && e.deltaX) S.x = clamp(S.x + e.deltaX * .3, 0, S.maxX);
}, { passive: true });

let HITS = [], HCLIP = null;   // HCLIP [y0, y1]: tap areas registered inside a scrolling viewport are cut to it
function hit(x, y, w, h, fn) {
  if (DRY) return;
  if (HCLIP) { const a = Math.max(y, HCLIP[0]), b = Math.min(y + h, HCLIP[1]); if (b <= a) return; y = a; h = b - a; }
  HITS.push({ r: [x, y, w, h], fn });
}
function onTap(p) {
  if (p.x >= 162 && p.y <= 16) { muted = !muted; save('mute', muted); if (!muted) SFX.click(); return; }
  for (let i = HITS.length - 1; i >= 0; i--) if (inR(p, HITS[i].r)) { SFX.click(); HITS[i].fn(p); saveGame(); return; }
}
