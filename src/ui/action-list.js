// ---------------------------------------------------------- the action renderer (tabs, character cards, group lists)
// ◆ per point of energy top-right, the fish cost beside them, the hint underneath — or, when it can't be done, why not
// (tapping it then says so). danger: red, and one confirm first. gold: the thing to do now. open: always tappable (menus).
function actState(a) {
  const can = !a.ok || a.ok(), apOk = a.open || W.ap >= (a.ap || 0);
  return { on: !!a.open || (can && apOk), can, why: !can ? ((a.no && a.no()) || '') : !apOk ? '这季没有精力了' : '' };
}
function runAct(a, o) {
  const go = () => { if (o && o.pre) o.pre(); a.fn(); };
  if (a.danger) pickOpt((o && o.who ? nm(o.who) + '：' : '') + a.n + '？', [{ n: a.n, s: a.danger, style: 'red', fn: go }]);
  else go();
}
// o: { who: the cat it is done to (confirm title), pre: run first (e.g. close the list it sits in) }
function actBtn(a, x, y, w, h, o) {
  const st = actState(a), style = !st.on ? 'off' : a.look || (a.danger ? 'red' : a.gold ? 'gold' : 'jade');
  const sub = st.can ? a.hint || a.danger : st.why || a.hint || a.danger;
  btnFrame(x, y, w, h, style);
  let bx = x + w - 3;
  if (!a.open) for (let k = 0; k < (a.ap || 0); k++) { bx -= 6; img(ICON.ap, bx, y + 3); }
  if (a.fish) { bx -= 2; txt(a.fish, bx, y + 5.5, 5.5, '#ffe08a', 'right', OUT); bx -= tw(String(a.fish), 5.5) + 16; img(ICON.fish, bx, y + 2); }
  const ls = sub ? 7 : 7.5;
  txt(a.n, x + 6, sub ? y + h / 2 - 3.5 : y + h / 2 - .5, fitSize(a.n, bx - x - 9, ls), '#ffffff', 'left', OUT);
  // a hint too long for the button first loses its ' · ' separators, then shrinks a little, and only then is cut
  if (sub) { let hs = sub, fs = 5.5; if (tw(hs, fs, 1) > w - 12) hs = hs.replace(/ · /g, ' '); if (tw(hs, fs, 1) > w - 12) fs = 5;
    txt(fitT(hs, w - 12, fs, 1), x + 6, y + h / 2 + 4.5, fs, subCol(style), 'left', null, 1, 1); }
  hit(x, y, w, h, () => { if (!st.on) { SFX.no(); toast(st.why || '现在做不了', '#ff9a8a'); return; } runAct(a, o); });
}
