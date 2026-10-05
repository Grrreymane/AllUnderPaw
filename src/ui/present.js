// ============================================================ present: pixel layer + crisp text
function present() {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 1;
  ctx.drawImage(low, 0, 0, W_, H, 0, 0, W_ * K, H * K);
  presentArtwork(ctx, K);
  for (const t of TQ) {
    const c = textSprite(t), tw_ = c.w - 2 * c.pad;
    if (t.clip) { ctx.save(); ctx.beginPath(); ctx.rect(t.clip[0] * K, t.clip[1] * K, t.clip[2] * K, t.clip[3] * K); ctx.clip(); }
    ctx.globalAlpha = t.alpha; ctx.drawImage(c.cv, R(t.x * K - c.pad - (t.align === 'center' ? tw_ / 2 : t.align === 'right' ? tw_ : 0)), R(t.y * K - c.h / 2));
    if (t.clip) ctx.restore();
  }
  ctx.globalAlpha = 1;
}
const TXC = new Map();
function textSprite(t) {
  const key = t.s + '|' + t.size + '|' + t.col + '|' + t.stroke + '|' + K + '|' + t.f;
  let c = TXC.get(key); if (c) return c;
  if (TXC.size > 600) TXC.clear();
  const m = document.createElement('canvas'), x = m.getContext('2d'), font = t.size * K + 'px ' + (t.f ? BODY : FONT);
  const r = t.stroke ? Math.max(.75, t.size * .14) * K : 0, pad = Math.ceil(r) + 2;
  x.font = font; m.width = Math.ceil(x.measureText(t.s).width) + pad * 2; m.height = Math.ceil(t.size * K * 1.5) + pad * 2;
  x.font = font; x.textBaseline = 'middle'; x.textAlign = 'left';
  const oy = m.height / 2;
  if (t.stroke) { x.fillStyle = t.stroke; for (const f of [1, .55]) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; x.fillText(t.s, pad + Math.cos(a) * r * f, oy + Math.sin(a) * r * f); } }
  x.fillStyle = t.col; x.fillText(t.s, pad, oy);
  c = { cv: m, w: m.width, h: m.height, pad }; TXC.set(key, c); return c;
}
try { if (document.fonts) { document.fonts.addEventListener('loadingdone', () => TXC.clear()); document.fonts.ready.then(() => TXC.clear()); } } catch (e) {}
const ALLTEXT = [...new Set((SCRIPT_TEXT.match(/[^\x00-\x7f]/g) || []))].join('') + '0123456789+-/!?';
try { if (document.fonts && document.fonts.load) document.fonts.load('12px "Fusion Pixel"', ALLTEXT).catch(() => {}); } catch (e) {}
