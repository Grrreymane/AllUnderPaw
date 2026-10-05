function drawTitle() {
  g.clearRect(0, 0, W_, H);
  for (let y = 244; y < H; y++) { g.globalAlpha = Math.min(.8, (y - 244) / 30); g.fillStyle = '#120c14'; g.fillRect(0, y, W_, 1); }
  g.globalAlpha = 1;
  // the title rises out of the setting sun; the buttons sit on the dark field below
  txt('一喵天下', 90, 128, 24, '#fff2c0', 'center', PAL.jiang);
  txt('All Under Paw', 90, 148, 8, '#fff6dc', 'center', OUT);
  // (read once, as a string: the title only needs to know there is a save; loadGame parses it on the tap)
  if (TSAVE === undefined) { try { TSAVE = localStorage.getItem(SAVE + 'w'); } catch (e) { TSAVE = null; } }
  if (TSAVE) {
    btn(40, 266, 100, 19, '继续', 'red', () => { if (loadGame()) state = 'game'; else openSaveManager(); });
    // starting over wipes the dynasty: it takes a second tap within 3 s, and the old save is kept as a backup
    const armed = T - resetT < 3;
    btn(40, 290, 100, 14, armed ? '再点一次：旧档会被覆盖' : '重新开始', armed ? 'red' : 'dark', () => {
      if (!armed) { resetT = T; return; }
      resetT = -9; scenOpen = true;
    });
  } else btn(40, 272, 100, 22, '开始', 'red', () => { scenOpen = true; });
  txt('前262年，邯郸。押宝一位落魄的秦国质子。', 90, 312, 5.5, '#b8a8b8', 'center', null, 1, 1);
  TANCH = [262, -1];
  if (scenOpen) { layerBreak(); HITS = []; drawScen(); }
}
let resetT = -9, TSAVE;
function drawToasts() {
  // TANCH[2..3]: a narrower band (centre x, width); a notice too long for it uses the full width
  const [y0, dir, bx, bw] = TANCH;
  TOASTS.forEach((t, i) => {
    const nar = bw && tw(t.s, 5.5) + 10 <= bw, cx = nar ? bx : 90, mw = nar ? bw : 176;
    const a = Math.min(1, t.life * 2), sz = fitSize(t.s, mw - 8, 7), w = Math.min(mw, tw(t.s, sz) + 10), y = dir > 0 ? y0 + i * 12 : y0 - 11 - i * 12;
    g.globalAlpha = a * .8; rect(R(cx - w / 2), y, R(w), 11, '#16121a'); g.globalAlpha = 1;
    txt(t.s, cx, y + 5.5, sz, t.col, 'center', null, a);
  });
}
