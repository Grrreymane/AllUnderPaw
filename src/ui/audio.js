// ============================================================ audio (synthesised, no files)
let AC = null, NB = null, muted = load('mute', false);
function initAudio() {
  try {
    if (AC && AC.state === 'closed') { AC = null; NB = null; }
    if (!AC) { const A = window.AudioContext || window.webkitAudioContext; if (A) AC = new A(); }
    if (AC && AC.state === 'suspended') AC.resume();
  } catch (e) {}
}
function tone(f, d, type, v, f2, delay) {
  if (!AC || muted) return;
  try {
    const t = AC.currentTime + (delay || 0), o = AC.createOscillator(), gn = AC.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(v || .06, t + .008); gn.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(gn); gn.connect(AC.destination); o.start(t); o.stop(t + d + .03);
  } catch (e) {}
}
const SFX = {
  click() { tone(880, .04, 'triangle', .035); },
  coin() { tone(988, .06, 'square', .03); tone(1319, .1, 'square', .03, 0, .06); },
  page() { tone(330, .12, 'triangle', .04, 440); },
  happy() { [523, 659, 784].forEach((f, i) => tone(f, .14, 'triangle', .04, 0, i * .07)); },
  secret() { tone(392, .18, 'sine', .05, 370); tone(311, .3, 'sine', .04, 0, .15); },
  no() { tone(220, .12, 'square', .03, 180); },
};
// a slow pentatonic pluck, like someone idly playing a zither in the next courtyard
const SCALE = [293.7, 329.6, 392, 440, 493.9, 587.3, 659.3];
let musT = 0, musI = 0;
function music(dt) {
  if (!AC || muted || state !== 'game') return;
  musT -= dt; if (musT > 0) return;
  musT = .55 + (musI % 8 === 7 ? .6 : 0);
  const k = (musI * 5 + (musI >> 2) * 3) % SCALE.length;
  if (musI % 3 !== 2) tone(SCALE[k] * (musI % 16 < 8 ? 1 : .75), 1.1, 'triangle', .018);
  if (musI % 8 === 0) tone(146.8, 2.2, 'sine', .02);
  musI++;
}
document.addEventListener('visibilitychange', () => { try { if (!AC) return; if (document.hidden) AC.suspend(); else AC.resume(); } catch (e) {} });
window.addEventListener('pagehide', () => { try { if (AC) AC.close(); } catch (e) {} });
