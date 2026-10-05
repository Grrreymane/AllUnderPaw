// ============================================================ 吕不韦 plays the same game
function aiLv() {
  const lv = C('lv'), yr = C('yiren');
  if (!alive(lv) || !alive(yr) || W.flags.act1Done) return;
  if (W.t === 0) { addOp(yr, lv, 12, true); return; }
  const ol = opinion(yr, lv);
  // 吕不韦 is rich: he courts the hostage and lobbies 咸阳 in the same season
  if (ol < 45) addOp(yr, lv, 4 + Math.floor(Math.random() * 4), true);
  if (W.t >= 2 && ol >= 20 && W.heir < 100) {
    const d = RACE.lv[0] + Math.floor(Math.random() * RACE.lv[1]);
    W.heir += d; W.credit.lv += d; addOp(C('huayang'), lv, 3, true);
    if (W.flags.metYiren) W.news.push('吕不韦的人又去了咸阳。吕的立嗣功劳 +' + d);
    if (W.flags.allied) W.credit.you += d >> 1;
  }
  // once he sees you as a rival, his people start talking about your shop: a 流言 scheme that takes a few seasons and
  // can be found out and 揭穿'd before it lands (EV.rumor is the card when it does)
  const rival = !W.flags.allied && (W.flags.lvRival || opinion(yr, P()) > ol - 8 || W.credit.you > W.credit.lv * .6);
  if (rival && W.t > 3 && chance(W.flags.lvCareless ? .08 : W.flags.lvRival ? .3 : .2) && !W.cool.rumor && W.schemes && !W.schemes.some(s => s.owner === 'lv') && holdsHook('lv') !== 'strong') {
    startScheme('流言', P(), { owner: 'lv', rate: 30 + Math.floor(Math.random() * 6) }); W.cool.rumor = 4;
  }
  if (W.heir >= 100 && !W.flags.zichu) W.queue.push({ ev: 'zichu' });
}
// The 立嗣 race in one table: an envoy costs `fish` and brings base + 交/jiao + (异人's opinion of you)/op;
// 吕不韦 sends lv[0] + 0..lv[1]-1 every season once 异人 likes him (20+); paying for the gate on the night of the escape
// is worth esc to you (lvEsc when 吕不韦 pays). Tuned with the balance harness.
const RACE = { fish: 70, base: 3, jiao: 5, op: 35, lv: [4, 4], esc: 30, lvEsc: 20 };
const sendGain = () => RACE.base + Math.floor(stat(P(), 2) / RACE.jiao) + Math.floor(clamp(opinion(C('yiren'), P()), 0, 100) / RACE.op);
