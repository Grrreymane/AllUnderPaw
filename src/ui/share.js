// ============================================================ share card: the ending as a tall postcard (180x320 saved at 4x)
const SHARE_URL = 'https://grrreymane.github.io/AllUnderPaw/';
const QR = ['11111110000010101111101111111', '10000010001101011010001000001', '10111010111110011010101011101', '10111010111010110100101011101', '10111010111000101001101011101', '10000010100100010000101000001', '11111110101010101010101111111', '00000000101010011000000000000', '10111110011011110101001111100', '10100101001010001011111110001', '00000010011100010110100000000', '11101100011100101011100011010', '10000110100001100110000101100', '00111100100000101111101110001', '11111111000011111100011001100', '10000000100010111011100010010', '00111110101111011101000101100', '11010001101001011111011110101', '10101011001011110010101000100', '10100000110000111000100010010', '10101011110000000100111110111', '00000000100110001110100011111', '11111110010100010101101011100', '10000010100010011001100010000', '10111010110010000110111110111', '10111010101011001110100101111', '10111010101000111101111111110', '10000010001101110000110101010', '11111110101000010001000110100'];   // python D:/Minigame/_workflow/tools/qr_matrix.py <url>
function drawQR(qx, qy) {
  g.fillStyle = OUT; g.fillRect(qx - 4, qy - 4, QR.length + 8, QR.length + 8); g.fillStyle = '#ffffff'; g.fillRect(qx - 3, qy - 3, QR.length + 6, QR.length + 6);
  g.fillStyle = OUT; QR.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === '1') g.fillRect(qx + x, qy + y, 1, 1); });
}
function makeShare(title) {
  try {
    TQ.length = 0; ARTQ.length = 0; g.clearRect(0, 0, W_, H);
    ['#3a1418', '#4a1c1e', '#5a2624', '#6a302a'].forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * 80, W_, 80); });
    txt('一喵天下', 90, 20, 14, '#ffe08a'); txt(title, 90, 40, 9, '#f2ead4');
    const p = P(), A = W.a3 || {};
    if (p) { drawPortrait(p, 58, 52, 2); txt(nm(p) + ' · ' + RANKS[W.rank], 90, 128, 8, '#ffe08a'); }
    const L = [A.uni ? '前' + yearOf(A.uni) + '年，天下一统' : '六国已灭 ' + (W.realm ? a3Fell() : 0) + '/6', A.gong ? '你亲手灭了 ' + A.gong + ' 国' : '',
      '狸家 ' + family().length + ' 口 · 名望 ' + W.prest + ' · ' + prestTier().n, '鱼干 ' + W.fish].filter(Boolean);
    L.forEach((s, i) => txt(s, 90, 148 + i * 13, 7, '#f2ead4'));
    // the six states and the year each fell
    if (W.realm) A3_RK.forEach((k, i) => { const r = W.realm[k], f = r.fallen !== null; txt(A3_REALM[k].n + (f ? ' 前' + yearOf(r.fallen) : ' —'), 34 + (i % 3) * 56, 216 + Math.floor(i / 3) * 13, 6.5, f ? '#ffb0a0' : '#a89888'); });
    drawQR(12, 280);
    txt('扫码，一起来玩', 50, 289, 8.5, '#ffffff', 'left');
    txt(SHARE_URL.replace(/^https?:\/\//, '').replace(/\/$/, ''), 50, 303, 6, '#9fe8ff', 'left');
    const S2 = 4, out = mk(W_ * S2, H * S2), o = out.getContext('2d'), k0 = K;
    o.imageSmoothingEnabled = false; o.drawImage(low, 0, 0, W_ * S2, H * S2);
    presentArtwork(o, S2);
    K = S2;
    for (const t of TQ) { const c = textSprite(t), w_ = c.w - 2 * c.pad; o.globalAlpha = t.alpha; o.drawImage(c.cv, R(t.x * K - c.pad - (t.align === 'center' ? w_ / 2 : t.align === 'right' ? w_ : 0)), R(t.y * K - c.h / 2)); }
    o.globalAlpha = 1; K = k0; TQ.length = 0; g.clearRect(0, 0, W_, H);
    showShare(out, '我在一喵天下里走到了「' + title + '」，你也来试试：');
  } catch (e) { toast('战绩图没画出来', '#ff9a8a'); }
}
let shareEl = null;
function showShare(cvs, msg) {
  const url = cvs.toDataURL('image/png'), name = SAVE + Date.now().toString(36) + '.png';
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;inset:0;z-index:10;background:rgba(6,10,24,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px;box-sizing:border-box;touch-action:auto;color:#fff;font:15px ' + FONT;
  const img = document.createElement('img');
  img.src = url; img.alt = '战绩';
  img.style.cssText = 'max-width:100%;max-height:70vh;image-rendering:pixelated;border:3px solid #1b1b2f;border-radius:4px;-webkit-touch-callout:default;-webkit-user-select:auto;user-select:auto';
  const tip = document.createElement('div'); tip.textContent = '手机上可以长按图片保存'; tip.style.opacity = '.8';
  const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;justify-content:center';
  const btn = (label, bg, fn) => { const b = document.createElement('button'); b.textContent = label; b.style.cssText = 'font:16px ' + FONT + ';color:#fff;background:' + bg + ';border:2px solid #1b1b2f;border-radius:4px;padding:8px 18px;cursor:pointer'; b.onclick = fn; row.appendChild(b); };
  btn('保存图片', '#48b858', () => { const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); });
  try {
    cvs.toBlob(blob => {
      if (!blob || typeof navigator === 'undefined' || !navigator.canShare) return;
      const file = new File([blob], name, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) btn('分享给朋友', '#4a88e0', () => { navigator.share({ files: [file], title: '一喵天下', text: msg + SHARE_URL }).catch(() => {}); });
    });
  } catch (e) {}
  btn('关闭', '#8a8a9a', () => { el.remove(); shareEl = null; });
  el.appendChild(img); el.appendChild(tip); el.appendChild(row);
  document.body.appendChild(el); shareEl = el;
}
