// ---------- Spielzustand & Ablauf ----------
const G = {
  state: 'title', time: 0, floor: 1, enemies: [], shots: [], pickups: [], parts: [], floaters: [], slashes: [], rings: [],
  timeLeft: 0, timeMax: 0, sealed: false, hitstop: 0, shake: 0, flash: 0,
  viewers: 120, vShow: 120, viewBase: 100, lastAction: 0, sponsorIdx: 0, pendingCrates: 0, combo: 0, comboT: 0, stillT: 0,
  goldAcc: 0, goldAccT: 0, run: null, fl: null, achieved: new Set(), seenTypes: new Set(), perkQueue: [], perkDelay: 0,
  offers: null, summary: null, boss: null, bossSeen: false, over: null, newAch: [],
};
let P = null;
const META = Object.assign({ best: 0, bestViewers: 0, runs: 0, ach: {} }, store.get('tg.meta', {}));
function saveMeta() { store.set('tg.meta', META); }

function newRun() {
  P = newPlayer();
  G.run = { kills: 0, by: {}, chests: 0, boxes: 0, potions: 0, gold: 0, sponsor: 0, dist: 0, maxCombo: 0, maxViewers: 120 };
  G.achieved = new Set(); G.seenTypes = new Set(); G.perkQueue = [];
  G.viewers = G.vShow = 120; G.sponsorIdx = 0; G.pendingCrates = 0;
  META.runs++; saveMeta();
  UI.clear();
  startFloor(1);
}

function startFloor(n) {
  G.floor = n;
  M = genMap(n);
  prerender(M);
  G.enemies = []; G.shots = []; G.pickups = []; G.parts = []; G.floaters = []; G.slashes = []; G.rings = [];
  G.boss = null; G.bossSeen = false; G.newAch = [];
  P.x = M.start.cx * TS + 8; P.y = M.start.cy * TS + 8; P.tx = P.ty = -1;
  P.inv = 1.2; P.kx = P.ky = 0; P.atkCd = 0;
  populate(n);
  G.timeMax = G.timeLeft = Math.min(140 + 12 * (n - 1) + (M.boss ? 30 : 0) + P.timeBonus + P.nextTime, 360);
  P.nextTime = 0;
  G.sealed = M.boss;
  G.viewBase = 90 * n;
  G.lastAction = G.time; G.stillT = 0; G.combo = 0; G.comboT = 0;
  G.fl = { kills: 0, dmg: 0, gold: 0, low: false, t30: false, t10: false, sealedT: -99, alarmT: 0 };
  V.cx = P.x - V.w / 2; V.cy = P.y - V.h / 2;
  Input.reset();
  G.state = 'play';
  UI.clear();
  UI.hud(true);
  $('#fade').classList.remove('on');
  if (n === 1) { Zyn.say(LINES.floor1, 2); if (META.runs <= 3) showHints(); }
  else if (M.boss) Zyn.say(fill(pick(LINES.boss), { b: G.boss.name }), 2);
  else Zyn.say(fill(pick(LINES.floor), { n }), 2);
  if (n >= 5) unlock('kellerkind');
  if (n >= 10) unlock('tief');
  saveRun();
  for (; G.pendingCrates > 0; G.pendingCrates--) dropCrate();
}

function populate(n) {
  const rooms = M.rooms.filter((r) => r !== M.start && !(M.boss && r === M.goal));
  if (!rooms.length) rooms.push(M.goal);
  const used = new Set([M.stairs.ty * M.W + M.stairs.tx]);
  const freeTile = (r) => {
    for (let k = 0; k < 24; k++) {
      const tx = randi(r.x + 1, r.x + r.w - 2), ty = randi(r.y + 1, r.y + r.h - 2), i = ty * M.W + tx;
      if (used.has(i) || M.tiles[i] !== T_FLOOR) continue;
      used.add(i);
      return { tx, ty };
    }
    return null;
  };
  const nc = randi(1, 2) + (n >= 3 ? 1 : 0) + (P.luck > 0 && chance(0.5) ? 1 : 0);
  for (let i = 0; i < nc; i++) {
    const p = freeTile(pick(rooms));
    if (!p) continue;
    if (n >= 3 && chance(0.22)) spawnEnemy('mimic', p.tx * TS + 8, p.ty * TS + 8);
    else M.chests.push({ tx: p.tx, ty: p.ty, x: p.tx * TS + 8, y: p.ty * TS + 8, open: false });
  }
  const pool = Object.keys(ENEMY).filter((k) => ENEMY[k].w > 0 && ENEMY[k].min <= n);
  const total = Math.min(5 + n * 2, 30);
  for (let i = 0, guard = 0; i < total && guard < 500; guard++) {
    const p = freeTile(pick(rooms));
    if (!p) continue;
    const x = p.tx * TS + 8, y = p.ty * TS + 8;
    if (Math.hypot(x - P.x, y - P.y) < 7 * TS) continue;
    spawnEnemy(wpick(pool, (k) => ENEMY[k].w * (k === 'rat' ? Math.max(0.35, 1 - n * 0.08) : 1)), x, y);
    i++;
  }
  if (M.boss) {
    const idx = Math.max(0, ((n / 3) | 0) - 1), v = BOSS_VAR[idx % BOSS_VAR.length];
    const r = M.goal;
    const e = spawnEnemy('boss', r.cx * TS + 8, (r.cy - 2) * TS + 8, { hpMul: 1 + idx * 0.7 });
    e.name = v.name; e.spr = v.spr;
    G.boss = e;
  }
}

// ---------- Spielschritt ----------
function step(dt) {
  if (G.hitstop > 0) { G.hitstop -= dt; stepFx(dt * 0.25); return; }
  G.time += dt;
  G.timeLeft -= dt;
  const tl = G.timeLeft;
  if (tl <= 30 && !G.fl.t30) { G.fl.t30 = true; Zyn.say(pick(LINES.time30), 2); }
  if (tl <= 10 && !G.fl.t10) { G.fl.t10 = true; Zyn.say(pick(LINES.time10), 2); }
  if (tl <= 10) { G.fl.alarmT -= dt; if (G.fl.alarmT <= 0) { G.fl.alarmT = 1; Sfx.play('alarm'); } }
  if (tl <= 30) {
    G.shake = Math.max(G.shake, tl < 10 ? 1.6 : 0.7);
    if (chance(dt * (tl < 10 ? 14 : 5)) && G.parts.length < 300) {
      G.parts.push({ x: V.cx + rand(0, V.w), y: V.cy + rand(-10, V.h * 0.6), vx: 0, vy: rand(20, 40), t: 0, dur: rand(0.6, 1.2), col: pick(['#6b5a7d', '#8b8ba3', '#4b3e48']), s: chance(0.3) ? 2 : 1, g: 120 });
    }
  }
  if (tl <= 0) { G.timeLeft = 0; gameOver('collapse'); return; }
  updatePlayer(dt);
  if (G.state !== 'play') return;
  updateEnemies(dt);
  updateShots(dt);
  updatePickups(dt);
  updateRings(dt);
  stepFx(dt);
  if (G.hintT > 0) {
    G.hintT -= dt;
    if (P.moving) G.hintMoved = true;
    if (Input.attack) G.hintAtk = true;
    if (G.hintT <= 0 || (G.hintMoved && G.hintAtk)) hideHints();
  }
  // Show-Mechanik
  G.comboT -= dt;
  if (G.comboT <= 0) G.combo = 0;
  if (G.goldAccT > 0) { G.goldAccT -= dt; if (G.goldAccT <= 0 && G.goldAcc) { floater(P.x, P.y - 24, '+' + G.goldAcc + ' GOLD', '#ffd23f'); G.goldAcc = 0; } }
  const idle = G.time - G.lastAction;
  if (idle > 7) G.viewers = Math.max(G.viewBase, G.viewers * (1 - (P.moving ? 0.015 : 0.05) * dt));
  if (!P.moving) {
    G.stillT += dt;
    if (G.stillT > 6) Zyn.say(pick(LINES.idle), 0);
    if (G.stillT > 10) unlock('standbild');
  } else G.stillT = 0;
  if (G.perkQueue.length) { G.perkDelay -= dt; if (G.perkDelay <= 0 && G.state === 'play') showPerk('play'); }
}

// ---------- Zuschauer, Gold, Erfahrung ----------
function addViewers(n, action) {
  if (action) G.lastAction = G.time;
  G.viewers += n * P.viewMul * (1 + 0.35 * (G.floor - 1));
  trackViewers();
}
function sponsorAt(i) {
  const T = [700, 1800, 3500, 6000, 9500, 14000, 20000, 28000, 38000, 50000];
  return i < T.length ? T[i] : Math.round(T[T.length - 1] * Math.pow(1.3, i - T.length + 1));
}
function trackViewers() {
  if (G.viewers > G.run.maxViewers) G.run.maxViewers = G.viewers;
  if (G.viewers >= 10000) unlock('quote');
  while (G.viewers >= sponsorAt(G.sponsorIdx)) {
    G.sponsorIdx++;
    if (G.state === 'play') dropCrate(); else G.pendingCrates++;
  }
}
function addGold(v) {
  P.gold += v; G.run.gold += v;
  if (G.fl) G.fl.gold += v;
  if (G.run.gold >= 300) unlock('goldesel');
}
function giveXP(n) {
  P.xp += n;
  while (P.xp >= P.xpNext) {
    P.xp -= P.xpNext;
    P.level++;
    P.xpNext = Math.round(P.xpNext * 1.42 + 5);
    P.maxHp += 4;
    healPlayer(Math.round(P.maxHp * 0.25), false);
    G.perkQueue.push('level');
    G.perkDelay = 0.6;
    floater(P.x, P.y - 34, 'LEVEL UP!', '#7fe0ff', 1, 1.4);
    sparks(P.x, P.y - 8, 16, '#7fe0ff');
    Sfx.play('levelup');
  }
}

// ---------- Erfolge ----------
function unlock(id) {
  if (!G.run || G.achieved.has(id)) return;
  const a = ACH_BY_ID[id];
  if (!a) return;
  G.achieved.add(id);
  META.ach[id] = 1; saveMeta();
  P.boxes.push(a.tier);
  if (G.state === 'play') {
    toast(BOXI[a.tier], 'Erfolg freigeschaltet', a.name, '+ ' + TIER[a.tier] + '-Kiste');
    Zyn.say(a.line, 1);
  } else G.newAch.push(a);
  G.viewers += 250 * P.viewMul * (1 + 0.35 * (G.floor - 1));
  G.lastAction = G.time;
  trackViewers();
  Sfx.play('ach');
}

// ---------- Boss, Treppe, Ende ----------
function bossDefeated(e) {
  G.sealed = false;
  P.boxes.push(2);
  G.viewers += 3000; trackViewers();
  G.shake = Math.max(G.shake, 8);
  unlock('koenig');
  Zyn.say(LINES.bossDead, 2);
  floater(M.stairs.x, M.stairs.y - 18, 'OFFEN!', '#8be35f', 1, 2);
}
function onStairs() {
  if (G.sealed) {
    if (G.time - G.fl.sealedT > 5) {
      G.fl.sealedT = G.time;
      Zyn.say(fill(pick(LINES.sealed), { b: G.boss ? G.boss.name : 'der Boss' }), 1);
      floater(M.stairs.x, M.stairs.y - 16, 'VERSIEGELT', '#ff4d5a');
    }
    return;
  }
  descend();
}
function descend() {
  G.state = 'trans';
  Input.reset();
  Sfx.play('stairs');
  const tl = G.timeLeft;
  if (G.fl.dmg === 0) unlock('kratzer');
  if (tl < 10) unlock('treppenwitz');
  if (tl > 90) unlock('frueh');
  if (G.fl.kills === 0) unlock('pazifist');
  const bonus = Math.round(120 * G.floor + tl * 5);
  G.viewers += bonus; trackViewers();
  G.summary = { floor: G.floor, time: tl, kills: G.fl.kills, gold: G.fl.gold, bonus };
  Zyn.say(pick(LINES.stairs), 2);
  $('#fade').classList.add('on');
  setTimeout(() => {
    if (G.state !== 'trans') return;
    G.offers = makeOffers();
    showShop();
  }, 750);
}
function nextFloor() {
  G.summary = null;
  startFloor(G.floor + 1);
}
function gameOver(reason) {
  if (G.state === 'over') return;
  G.state = 'over';
  Input.reset();
  const newRec = G.floor > META.best;
  META.best = Math.max(META.best, G.floor);
  META.bestViewers = Math.max(META.bestViewers, Math.round(G.run.maxViewers));
  saveMeta();
  store.del('tg.run');
  const line = reason === 'collapse' ? pick(LINES.collapse) : reason === 'quit' ? LINES.quit : pick(LINES.death);
  G.over = { reason, floor: G.floor, newRec, line };
  if (reason === 'collapse') { Sfx.play('collapse'); G.shake = 12; }
  else if (reason === 'dead') Sfx.play('die');
  setTimeout(showGameOver, reason === 'quit' ? 60 : 1500);
}

// ---------- Beutekisten ----------
function rollBox(tier) {
  const L = P.luck;
  const g = (a, b) => Math.round(randi(a, b) * (1 + 0.25 * (G.floor - 1)));
  const R = {
    potion: (n) => ({ icon: 'potion', t: n > 1 ? n + ' Heiltränke' : 'Heiltrank', s: 'Ab in den Rucksack.', go() { P.potions = Math.min(9, P.potions + n); } }),
    gold: (n) => ({ icon: 'coin', t: n + ' Gold', s: 'Glänzt. Riecht nach Keller.', go() { addGold(n); } }),
    sharp: (n) => ({ icon: 'i_sword', t: 'Schärfstein', s: '+' + n + ' Waffenschaden', go() { P.sharpen += n; } }),
    hp: (n) => ({ icon: 'heart', t: 'Kraftriegel', s: '+' + n + ' Max-Leben', go() { P.maxHp += n; P.hp += n; } }),
    time: (n) => ({ icon: 'i_glass', t: 'Zeitkapsel', s: '+' + n + ' Sekunden', go() { if (G.state === 'shop') P.nextTime += n; else G.timeLeft += n; } }),
    weapon: (k) => {
      const wi = Math.min(WEAPONS.length - 1, P.weapon + k);
      if (wi <= P.weapon) return R.sharp(3);
      const w = WEAPONS[wi];
      return { icon: 'w' + wi, t: w.name, s: w.desc, weapon: true, go() { if (wi > P.weapon) P.weapon = wi; } };
    },
    perk: () => ({ icon: 'i_star', t: 'Perk nach Wahl', s: 'Gleich darfst du wählen.', go() { G.perkQueue.push('box'); } }),
    junk: () => { const j = pick(JUNK); return { icon: 'i_sock', t: j.name, s: j.text + ' Verkauft für 2 Gold.', junk: true, go() { addGold(2); } }; },
  };
  const out = [];
  if (tier === 0) {
    const r = Math.random() + L * 0.08;
    out.push(r < 0.2 ? R.junk() : r < 0.5 ? R.potion(1) : r < 0.8 ? R.gold(g(12, 26)) : R.sharp(1));
  } else if (tier === 1) {
    out.push(chance(0.5) ? R.potion(2) : R.gold(g(30, 55)));
    const r = Math.random() + L * 0.08;
    out.push(r < 0.12 ? R.junk() : r < 0.4 ? R.time(25) : r < 0.7 ? R.hp(6) : r < 0.9 ? R.sharp(2) : R.weapon(1));
  } else if (tier === 2) {
    const r = Math.random();
    out.push(r < 0.4 ? R.weapon(1) : r < 0.7 ? R.perk() : r < 0.88 ? R.hp(12) : R.gold(g(80, 130)));
    out.push(R.potion(1));
  } else {
    out.push(R.weapon(2)); out.push(R.perk()); out.push(R.gold(g(150, 220)));
  }
  return out;
}

// ---------- Werbepause (Shop) ----------
function makeOffers() {
  const f = G.floor + 1, sc = (b) => Math.round(b * (1 + 0.12 * (f - 2)));
  const all = [
    { icon: 'potion', t: 'Heiltrank', s: 'Heilt 40 % Leben', p: sc(18), ok: () => P.potions < 9, go() { P.potions++; } },
    { icon: 'potion', t: 'Trank-Dreierpack', s: '3 Heiltränke', p: sc(45), ok: () => P.potions <= 6, go() { P.potions += 3; } },
    { icon: 'heart', t: 'Volle Heilung', s: 'Sofort volles Leben', p: sc(24), ok: () => P.hp < P.maxHp, go() { P.hp = P.maxHp; } },
    { icon: 'i_sword', t: 'Schärfstein', s: '+2 Waffenschaden', p: sc(40), ok: () => true, go() { P.sharpen += 2; } },
    { icon: 'heart', t: 'Kraftriegel', s: '+8 Max-Leben', p: sc(45), ok: () => true, go() { P.maxHp += 8; P.hp += 8; } },
    { icon: 'i_glass', t: 'Zeitkapsel', s: '+30 Sek. auf der nächsten Etage', p: sc(30), ok: () => true, go() { P.nextTime += 30; } },
    { icon: 'box_b', t: 'Bronze-Kiste', s: 'Zufallsbeute', p: sc(28), ok: () => true, go() { P.boxes.push(0); } },
    { icon: 'box_s', t: 'Silber-Kiste', s: 'Bessere Zufallsbeute', p: sc(65), ok: () => true, go() { P.boxes.push(1); } },
  ];
  const list = [all[0]];
  if (P.weapon < WEAPONS.length - 2 && chance(0.65)) {
    const wi = P.weapon + 1, w = WEAPONS[wi];
    list.push({ icon: 'w' + wi, t: w.name, s: w.desc, p: sc(70 + 40 * P.weapon), ok: () => P.weapon < wi, go() { P.weapon = wi; } });
  }
  for (const o of shuffle(all.slice(1))) if (list.length < 4) list.push(o);
  return { sponsor: pick(SPONSORS), list, line: pick(LINES.shop) };
}

// ---------- Speichern ----------
const PKEYS = ['hp', 'maxHp', 'level', 'xp', 'xpNext', 'weapon', 'sharpen', 'potions', 'gold', 'boxes', 'dmgMul', 'speedMul', 'atkMul', 'rangeMul', 'crit', 'lifeOnKill', 'magnet', 'goldMul', 'viewMul', 'timeBonus', 'armor', 'luck', 'perks', 'nextTime'];
function saveRun() {
  if (!P) return;
  const p = {};
  for (const k of PKEYS) p[k] = P[k];
  store.set('tg.run', { v: 1, floor: G.floor, p, viewers: G.viewers, sponsorIdx: G.sponsorIdx, run: G.run, ach: [...G.achieved], seen: [...G.seenTypes] });
}
function loadRun() {
  const s = store.get('tg.run', null);
  if (!s || s.v !== 1 || !s.p) return false;
  P = newPlayer();
  Object.assign(P, s.p);
  G.viewers = G.vShow = s.viewers || 120;
  G.sponsorIdx = s.sponsorIdx || 0;
  G.pendingCrates = 0;
  G.run = s.run;
  G.achieved = new Set(s.ach || []);
  G.seenTypes = new Set(s.seen || []);
  G.perkQueue = [];
  UI.clear();
  startFloor(s.floor);
  return true;
}
