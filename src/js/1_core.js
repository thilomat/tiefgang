'use strict';
// ---------- Grundlagen ----------
const TS = 16;
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const chance = (p) => Math.random() < p;
const fmt = (n) => Math.round(n).toLocaleString('de-DE');
const fmtTime = (s) => {
  s = Math.max(0, Math.ceil(s));
  const m = (s / 60) | 0, r = s % 60;
  return m + ':' + (r < 10 ? '0' : '') + r;
};
const angDiff = (a, b) => {
  let d = a - b;
  while (d > Math.PI) d -= TAU;
  while (d < -Math.PI) d += TAU;
  return d;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fill = (tpl, o) => tpl.replace(/\{(\w+)\}/g, (_, k) => (o[k] != null ? o[k] : ''));
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function wpick(items, wf) {
  let tot = 0;
  for (const it of items) tot += wf(it);
  let r = Math.random() * tot;
  for (const it of items) { r -= wf(it); if (r <= 0) return it; }
  return items[items.length - 1];
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* kein Speicher */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* egal */ } },
};
const $ = (s) => document.querySelector(s);
const REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
let ANIM = 0; // laufende Animationszeit in Sekunden (läuft immer)

// ---------- Sound (synthetisch, WebAudio) ----------
const Sfx = (() => {
  let ac = null, out = null, nbuf = null;
  let muted = !!store.get('tg.mute', false);
  const last = {};
  function init() {
    try {
      if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ac = new AC();
        out = ac.createGain();
        out.gain.value = muted ? 0 : 0.5;
        out.connect(ac.destination);
        const len = (ac.sampleRate * 1.6) | 0;
        nbuf = ac.createBuffer(1, len, ac.sampleRate);
        const d = nbuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ac.state === 'suspended') ac.resume().catch(() => {});
    } catch (e) { ac = null; }
  }
  function env(g, t0, vol, dur) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  }
  function tone(f, dur, type, vol, f2, delay) {
    const t0 = ac.currentTime + (delay || 0);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    env(g, t0, vol, dur);
    o.connect(g); g.connect(out);
    o.start(t0); o.stop(t0 + dur + 0.03);
  }
  function noise(dur, vol, freq, delay, f2) {
    const t0 = ac.currentTime + (delay || 0);
    const s = ac.createBufferSource(); s.buffer = nbuf;
    const fl = ac.createBiquadFilter(); fl.type = 'lowpass';
    fl.frequency.setValueAtTime(freq, t0);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    const g = ac.createGain(); env(g, t0, vol, dur);
    s.connect(fl); fl.connect(g); g.connect(out);
    s.start(t0, Math.random() * 0.3); s.stop(t0 + dur + 0.03);
  }
  const S = {
    swing() { noise(0.09, 0.12, 2600, 0, 700); },
    hit() { tone(190, 0.07, 'square', 0.16, 90); noise(0.05, 0.16, 3200); },
    crit() { tone(560, 0.07, 'square', 0.15, 240); noise(0.12, 0.22, 4200); },
    kill() { tone(320, 0.1, 'square', 0.16, 70); noise(0.16, 0.18, 1600, 0.02, 300); },
    hurt() { tone(170, 0.2, 'sawtooth', 0.22, 60); },
    coin() { tone(988, 0.05, 'square', 0.09); tone(1319, 0.09, 'square', 0.09, null, 0.05); },
    potion() { tone(420, 0.1, 'sine', 0.25, 840); tone(630, 0.12, 'sine', 0.2, 1260, 0.09); },
    levelup() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'square', 0.12, null, i * 0.08)); },
    box() { [660, 880, 1320, 1760].forEach((f, i) => tone(f, 0.1, 'triangle', 0.2, null, i * 0.06)); },
    ach() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.14, 'square', 0.1, null, i * 0.07)); },
    alarm() { tone(880, 0.12, 'square', 0.12); tone(660, 0.12, 'square', 0.12, null, 0.14); },
    stairs() { [523, 392, 330, 262].forEach((f, i) => tone(f, 0.14, 'triangle', 0.22, null, i * 0.1)); },
    sponsor() { tone(700, 0.35, 'sine', 0.18, 1400); tone(1400, 0.3, 'sine', 0.12, 700, 0.3); },
    boss() { tone(90, 0.7, 'sawtooth', 0.28, 40); noise(0.5, 0.2, 500, 0, 120); },
    slam() { noise(0.35, 0.35, 450, 0, 80); tone(70, 0.35, 'sine', 0.4, 30); },
    spit() { noise(0.07, 0.12, 5200, 0, 1500); },
    click() { tone(660, 0.035, 'square', 0.08); },
    die() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.2, 'sawtooth', 0.15, null, i * 0.15)); },
    collapse() { noise(1.3, 0.45, 700, 0, 90); tone(55, 1.2, 'sawtooth', 0.3, 30); },
  };
  return {
    init,
    play(n) {
      if (!ac || muted || !S[n]) return;
      const now = performance.now();
      if (last[n] && now - last[n] < 45) return;
      last[n] = now;
      try { S[n](); } catch (e) { /* Ton egal */ }
    },
    get muted() { return muted; },
    toggle() {
      muted = !muted;
      store.set('tg.mute', muted);
      if (out) out.gain.value = muted ? 0 : 0.5;
      return muted;
    },
  };
})();
