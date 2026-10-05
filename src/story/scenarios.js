const SCEN = [
  { n: '前262年 · 奇货', s: '邯郸 · 结识质子异人', t: 0 },
  { n: '前257年 · 入秦', s: '舍人 · 鱼干300 · 赵姬为子楚妻', t: 22, fish: 300, rank: 1 },
  { n: '前247年 · 仲父', s: '客卿 · 鱼干450 · 吕不韦为仲父', t: 62, fish: 450, rank: 2 },
  { n: '前237年 · 一统', s: '客卿 · 鱼干600 · 政亲政，六国未灭', t: 101, fish: 600, rank: 2 },
  { n: '前221年 · 尾声', s: '客卿 · 鱼干600 · 始皇帝已统一六国', t: 165, fish: 600 },
  { n: '前209年 · 乱世', s: '邯郸 · 鱼干800 · 二世在位，乱世初起', t: 215, fish: 800, zili: 1 },
];
function scenSettle() {
  for (let n = 0; n < 80; n++) {
    pumpQueue(); const m = MODAL[MODAL.length - 1]; if (!m) break;
    if (m.type === 'event') { const o = m.e.opts.filter(x => !x.ok || x.ok()); choose(m, o[0] || m.e.opts[0]); }
    else if (m.type === 'tour') { MODAL.pop(); W.flags.tourDone = true; }
    else MODAL.pop();
  }
}
function startScen(i) {
  const S = SCEN[i]; if (!S) return;
  if (!S.t) { newGame(); state = 'game'; saveGame(); return; }
  try {
    const preset = JSON.parse(JSON.stringify(SCEN_PRESETS[i]));
    const next = prepareWorld(decodeSave(JSON.stringify(preset)));
    activateWorld(next);
    logLine('从「' + S.n + '」开始，沿用预设前史。', '#ffe08a');
    saveGame();
  } catch (e) { saveProblem('预设开局未能载入：' + String(e.message || e)); }
}
let scenOpen = false;
function drawScen() {
  g.globalAlpha = .6; rect(0, 0, W_, H, '#0a0810'); g.globalAlpha = 1;
  paper(10, 40, 160, 240);
  txt('选剧本', 90, 54, 9, '#3a2418', 'center', null);
  SCEN.forEach((S, i) => btn(18, 66 + i * 30, 144, 26, S.n, i ? 'dark' : 'red', () => {
    const oldSave = readSlot('w');
    if (oldSave && validSlot(oldSave)) { try { localStorage.setItem(SAVE + 'w_bak', oldSave); } catch (e) { saveProblem('旧档未能备份，请先到存档页导出留底。'); return; } }
    TSAVE = undefined; scenOpen = false; startScen(i);
  }, S.s));
  btn(60, 256, 60, 16, '返回', 'dark', () => { scenOpen = false; });
  txt('后期为预设前史，进入后由你续写', 90, 250, 5.5, '#7a5a3a', 'center', null, 1, 1);
}
