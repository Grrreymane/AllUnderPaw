// Persistence stays separate from gameplay. tools/sync-inline.cjs embeds this file in index.html.
const SAVE_STATUS = { error: '', pending: false };
let SAVE_SUSPENDED = 0, utilityEl = null;
const SAVE_LIMIT = 5 * 1024 * 1024;
const saveReady = () => W && state === 'game' && !MODAL.some(m => m.hold || ['event', 'duel', 'pick', 'opts'].includes(m.type));
function readSlot(key) {
  try { return localStorage.getItem(SAVE + key); }
  catch (e) { saveProblem('浏览器不允许读取存档。可以尝试导入此前导出的文件。'); return null; }
}
function saveProblem(message) {
  if (SAVE_STATUS.error !== message) toast(message, '#ff9a8a');
  SAVE_STATUS.error = message;
}
function decodeSave(raw) {
  if (typeof raw !== 'string' || !raw.length || raw.length > SAVE_LIMIT) throw new Error('存档为空或超过 5 MB。');
  let d;
  try { d = JSON.parse(raw, (k, v) => { if (['__proto__', 'prototype', 'constructor'].includes(k)) throw new Error(); return v; }); }
  catch (e) { throw new Error('文件内容损坏，无法读取。'); }
  if (d && d.format) {
    if (d.format !== 'all-under-paw' || d.version !== 1) throw new Error('这不是可识别的一喵天下存档。');
    d = d.world;
  }
  const obj = x => x && typeof x === 'object' && !Array.isArray(x);
  const strings = x => Array.isArray(x) && x.every(s => typeof s === 'string');
  const number = (x, min = 0) => typeof x === 'number' && Number.isFinite(x) && x >= min;
  if (!obj(d) || ![1, 2].includes(d.v === undefined ? 1 : d.v)) throw new Error('存档版本不支持，请使用对应版本的游戏。');
  if (!obj(d.chars) || !obj(d.flags) || !Number.isInteger(d.t) || d.t < 0 || !number(d.fish) || !number(d.prest) || !number(d.ap) || !Number.isInteger(d.nid) || d.nid < 1 || !Number.isInteger(d.rank) || d.rank < 0 || d.rank >= RANKS.length || ![1, 1.5, 2, 3, 4].includes(d.act) || !obj(d.credit) || !number(d.credit.you) || !number(d.credit.lv) || !number(d.heir)) throw new Error('存档缺少必要的家族或回合信息。');
  const cats = Object.entries(d.chars);
  if (!cats.length || cats.length > 20000 || !obj(d.chars[d.player])) throw new Error('存档找不到家主。');
  for (const [id, c] of cats) {
    if (!obj(c) || c.id !== id || !obj(c.g) || !Array.isArray(c.st) || c.st.length !== 4 || !c.st.every(v => number(v, -100)) || !strings(c.tr) || !number(c.born, -10000000) || !number(c.health) || typeof c.name !== 'string' || typeof c.sur !== 'string' || typeof c.loc !== 'string') throw new Error('存档中的人物资料不完整。');
    for (const k of ['B', 'D', 'A', 'T', 'Sp', 'S', 'W', 'C', 'I', 'L']) if (!strings(c.g[k]) || c.g[k].length !== 2) throw new Error('存档中的毛色资料不完整。');
    if (!strings(c.g.O) || ![1, 2].includes(c.g.O.length)) throw new Error('存档中的毛色资料不完整。');
    for (const k of ['eye', 'size', 'ear', 'whisk']) if (!Array.isArray(c.g[k]) || c.g[k].length !== 2 || !c.g[k].every(v => number(v, -100))) throw new Error('存档中的外观资料不完整。');
    for (const k of ['wit', 'body', 'look', 'hid']) if (!Array.isArray(c.g[k]) || !c.g[k].length || !c.g[k].every(p => Array.isArray(p) && p.length === 2 && p.every(v => number(v, -100)))) throw new Error('存档中的遗传资料不完整。');
    for (const k of ['lov', 'kids']) if (c[k] !== undefined && !strings(c[k])) throw new Error('存档中的亲属资料不完整。');
    for (const k of ['rel', 'flags']) if (c[k] !== undefined && !obj(c[k])) throw new Error('存档中的人物状态不完整。');
  }
  for (const k of ['ret', 'secrets', 'queue', 'news', 'log', 'later']) if (d[k] !== undefined && !Array.isArray(d[k])) throw new Error('存档中的消息资料不完整。');
  for (const k of ['cool', 'done', 'a2', 'a3']) if (d[k] !== undefined && !obj(d[k])) throw new Error('存档中的剧情资料不完整。');
  if (d.chronicle && (!obj(d.chronicle) || !number(d.chronicle.from) || !Array.isArray(d.chronicle.events) || d.chronicle.events.length > 300 || !d.chronicle.events.every(e => obj(e) && number(e.t) && ['choice', 'succession', 'realm', 'kinship'].includes(e.kind) && ['title', 'text', 'head', 'name'].every(k => typeof e[k] === 'string')))) throw new Error('存档中的纪事资料损坏。');
  if (!validateKinPolitics(d)) throw new Error('存档中的姻亲约定损坏。');
  validateHistoryEffects(d);
  return d;
}
function validSlot(raw) { try { return decodeSave(raw); } catch (e) { return null; } }
function writeWorld(raw, rotate = true) {
  try {
    const previous = localStorage.getItem(SAVE + 'w');
    if (previous === raw) { SAVE_STATUS.error = ''; SAVE_STATUS.pending = false; return true; }
    const old = previous && validSlot(previous), next = decodeSave(raw);
    // Preserve the previous season, rather than overwriting the backup on every click.
    if (rotate && old && old.t !== next.t) localStorage.setItem(SAVE + 'w_bak', previous);
    localStorage.setItem(SAVE + 'w', raw);
    SAVE_STATUS.error = ''; SAVE_STATUS.pending = false; TSAVE = undefined;
    reportProgress();
    return true;
  } catch (e) {
    saveProblem('进度未能保存。点左上角日期，导出存档留底。');
    // Retry on the next action or explicit save, not on every animation frame.
    SAVE_STATUS.pending = false;
    return false;
  }
}
function saveGame() {
  if (SAVE_SUSPENDED || !W || state !== 'game') return false;
  historyFlushPending();
  if (!saveReady()) { SAVE_STATUS.pending = true; return false; }
  return writeWorld(JSON.stringify(W));
}
// Validate and migrate a detached world before replacing a live one. Failed imports never write to storage.
function prepareWorld(d) {
  const before = W, windows = MODAL.slice(), notices = TOASTS.slice(), pending = TPEND.slice();
  SAVE_SUSPENDED++;
  try {
    W = d;
    W.cool = W.cool || {}; W.done = W.done || {}; W.news = W.news || []; W.ret = W.ret || []; W.secrets = W.secrets || []; W.queue = W.queue || [];
    for (const c of Object.values(W.chars)) { c.lov = c.lov || []; c.kids = c.kids || []; c.rel = c.rel || {}; c.flags = c.flags || {}; if (c.dead === undefined) c.dead = null; }
    if (!TABS[W.loc]) W.loc = 'home';
    linkKids();
    { const b = W.flags.liBride && C(W.flags.liBride); if (b && alive(b) && !C('zheng') && !b.preg && b.sp === 'yiren' && ageOf(b) <= 40) b.preg = { f: 'yiren', sp: 'yiren', due: W.t + 2, id: 'zheng', name: '政', disp: '政', sex: 'M' }; }
    if ((W.v || 1) < 2) migrate2();
    { const y = C('yiren'); if (y && W.flags.act1Done && y.role === 'hostage') { y.role = 'noble'; if (y.robe === 'qinPoor') y.robe = 'qin'; } }
    LOOKC.clear(); PORT.clear(); MINI.clear(); SCN.clear();
    runSys('load', W);
    histCatchUp();
    // Exercise read paths used by the first frame before accepting an imported world.
    if (!P() || !CITY[W.city]) throw new Error('存档中的家主或所在地无法识别。');
    stat(P(), 0); household(); topGoal();
    return W;
  } finally {
    W = before; SAVE_SUSPENDED--;
    MODAL.splice(0, MODAL.length, ...windows); TOASTS.splice(0, TOASTS.length, ...notices); TPEND.splice(0, TPEND.length, ...pending);
    LOOKC.clear(); PORT.clear(); MINI.clear(); SCN.clear(); NOTE_K = -1; FARC.t = -1;
  }
}
function activateWorld(d) {
  W = d; state = 'game'; resetScreen(); SAVE_STATUS.pending = false; scenOpen = false;
  LOOKC.clear(); PORT.clear(); MINI.clear(); SCN.clear(); NOTE_K = -1; FARC.t = -1; logSeen = logKey(); TSAVE = undefined;
  reportProgress();
}
// AI Made Games platform: inside the site's in-site player, report a one-line progress summary
// that shows as "your save" on the game page. Does nothing when the game runs anywhere else.
var platformEmbed = window.parent !== window, platformTimer = 0, platformLast = '';
function reportProgress() {
  if (!platformEmbed) return;
  clearTimeout(platformTimer);
  platformTimer = setTimeout(() => {
    const text = W && state === 'game' ? '狸家已到' + yearTxt(W.t) + ' · 官至' + RANKS[W.rank] : '';
    if (!text || text === platformLast) return;
    platformLast = text;
    // The platform's English edition ships a translation runtime; translate the line there too.
    const shown = window.GameI18n ? window.GameI18n.translate(text) : text;
    try { window.parent.postMessage({ source: 'aimadegames', v: 1, type: 'progress', text: shown.slice(0, 120) }, '*'); } catch (e) {}
  }, 1500);
}
function loadGame() {
  try {
    const d = prepareWorld(decodeSave(readSlot('w')));
    activateWorld(d); SAVE_STATUS.error = ''; return true;
  } catch (e) { saveProblem('存档读不出来。可在存档页恢复备份或导入文件。'); return false; }
}
function replaceWorld(raw) {
  if (state === 'game' && !saveReady()) throw new Error('请先完成当前选择，再更换存档。');
  const d = prepareWorld(decodeSave(raw)), encoded = JSON.stringify(d);
  // Retain the live world, including unsaved moves, before committing the replacement.
  const previous = state === 'game' && W ? JSON.stringify(W) : readSlot('w');
  const oldBackup = readSlot('w_bak');
  try {
    if (previous && validSlot(previous)) localStorage.setItem(SAVE + 'w_bak', previous);
    localStorage.setItem(SAVE + 'w', encoded);
  } catch (e) {
    try { if (oldBackup === null) localStorage.removeItem(SAVE + 'w_bak'); else localStorage.setItem(SAVE + 'w_bak', oldBackup); } catch (ignored) {}
    throw new Error('浏览器未能保存。当前进度没有被替换，请先导出留底。');
  }
  activateWorld(d); SAVE_STATUS.error = ''; return true;
}
function saveSummary(d) { const p = d.chars[d.player]; return yearTxt(d.t) + SEASON[d.t % 4] + ' · ' + (p.disp || p.sur + p.name) + ' · ' + RANKS[d.rank]; }
function exportWorld() {
  if (state === 'game' && !saveReady()) throw new Error('请先完成当前选择，再导出这一刻的进度。');
  const d = state === 'game' && W ? W : decodeSave(readSlot('w'));
  const raw = JSON.stringify({ format: 'all-under-paw', version: 1, exportedAt: new Date().toISOString(), world: d });
  const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' })), a = document.createElement('a');
  a.href = url; a.download = '一喵天下-' + yearTxt(d.t) + SEASON[d.t % 4] + '.json'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function closeUtility() {
  if (!utilityEl) return;
  utilityEl.remove(); utilityEl = null; down = null; cv.focus();
}
function openSaveManager() {
  if (utilityEl) return;
  if (state === 'game' && !saveReady()) { toast('请先完成当前选择，再打开存档', '#ffe08a'); return; }
  const root = document.createElement('div'); root.className = 'save-overlay';
  const panel = document.createElement('section'); panel.className = 'save-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', '狸家存档');
  const add = (tag, text, parent = panel) => { const el = document.createElement(tag); el.textContent = text; parent.appendChild(el); return el; };
  add('h2', '狸家存档');
  const current = state === 'game' && W ? W : validSlot(readSlot('w')), backupRaw = readSlot('w_bak'), backup = validSlot(backupRaw);
  add('p', current ? saveSummary(current) : '没有可读取的当前存档。');
  add('p', '进度保存在这台设备的浏览器里。导出一份，可以换设备继续，也能在清理浏览器前留底。').className = 'save-note';
  const status = add('p', SAVE_STATUS.error || '完成行动、选择和换季后自动保存。'), actions = add('div', '');
  status.setAttribute('role', 'status'); status.className = 'save-status'; actions.className = 'save-actions';
  const button = (label, fn, parent = actions) => { const b = add('button', label, parent); b.type = 'button'; b.onclick = () => { try { fn(); } catch (e) { status.textContent = e.message || '操作没有完成，请保留原来的存档。'; } }; return b; };
  const exportButton = button('导出当前存档', () => { exportWorld(); status.textContent = '已交给浏览器下载，请保留好这份文件。'; }); exportButton.disabled = !current;
  if (state === 'game') button('立即保存', () => { const ok = saveGame(); status.textContent = ok ? '当前进度已保存。' : SAVE_STATUS.error || '请先完成当前选择。'; });
  const confirmArea = add('div', ''); confirmArea.className = 'save-confirm';
  const offer = (raw, label) => {
    const d = prepareWorld(decodeSave(raw));
    confirmArea.replaceChildren(); add('p', label + '：' + saveSummary(d), confirmArea);
    add('p', '确认后替换当前进度。当前进度会保留为备份。', confirmArea);
    button('确认' + label, () => { replaceWorld(raw); closeUtility(); toast('已载入存档', '#ffe08a'); }, confirmArea);
    button('取消', () => { confirmArea.replaceChildren(); }, confirmArea);
  };
  button('导入存档文件', () => { file.value = ''; file.click(); });
  const file = document.createElement('input'); file.type = 'file'; file.accept = '.json,application/json'; file.hidden = true; panel.appendChild(file);
  let importRequest = 0;
  file.onchange = async () => {
    const f = file.files && file.files[0], request = ++importRequest; if (!f) return;
    try {
      if (f.size > SAVE_LIMIT) throw new Error('文件超过 5 MB，请选择游戏导出的存档。');
      const raw = await f.text(); if (utilityEl !== root || request !== importRequest) return;
      offer(raw, '导入'); status.textContent = '文件检查通过。确认前，当前进度不会改变。';
    } catch (e) { if (utilityEl === root) { confirmArea.replaceChildren(); status.textContent = e.message; } }
  };
  add('p', backup ? '备份：' + saveSummary(backup) : backupRaw ? '备份无法读取，请保留此前导出的文件。' : '过完一季后会保留上一季的备份。').className = 'save-note';
  const restore = button('恢复备份', () => offer(backupRaw, '恢复')); restore.disabled = !backup;
  const close = button('回到游戏', closeUtility); close.className = 'save-close';
  root.appendChild(panel); document.body.appendChild(root); utilityEl = root; down = null;
  root.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); closeUtility(); }
    if (e.key === 'Tab') {
      const focusable = [...panel.querySelectorAll('button:not(:disabled)')], first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  close.focus();
}
window.addEventListener('pagehide', () => { if (saveReady()) saveGame(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && saveReady()) saveGame(); });
