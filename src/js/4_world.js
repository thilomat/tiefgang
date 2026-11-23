// ---------- Karte ----------
const T_VOID = 0, T_FLOOR = 1, T_WALL = 2;
const DIRS8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
let M = null;

function tileAt(tx, ty) { return tx < 0 || ty < 0 || tx >= M.W || ty >= M.H ? T_VOID : M.tiles[ty * M.W + tx]; }
function solidT(tx, ty) { return tileAt(tx, ty) !== T_FLOOR; }
function mkRoom(x, y, w, h) { return { x, y, w, h, cx: x + (w >> 1), cy: y + (h >> 1) }; }

function bfs(W, H, tiles, sx, sy) {
  const d = new Int32Array(W * H).fill(-1), q = new Int32Array(W * H);
  let h = 0, t = 0;
  const s = sy * W + sx;
  if (tiles[s] !== T_FLOOR) return d;
  d[s] = 0; q[t++] = s;
  while (h < t) {
    const i = q[h++], x = i % W, y = (i / W) | 0, nd = d[i] + 1;
    if (x > 0 && tiles[i - 1] === T_FLOOR && d[i - 1] < 0) { d[i - 1] = nd; q[t++] = i - 1; }
    if (x < W - 1 && tiles[i + 1] === T_FLOOR && d[i + 1] < 0) { d[i + 1] = nd; q[t++] = i + 1; }
    if (y > 0 && tiles[i - W] === T_FLOOR && d[i - W] < 0) { d[i - W] = nd; q[t++] = i - W; }
    if (y < H - 1 && tiles[i + W] === T_FLOOR && d[i + W] < 0) { d[i + W] = nd; q[t++] = i + W; }
  }
  return d;
}

function corridor(t, W, a, b) {
  let x = a.cx, y = a.cy;
  const carve = (cx, cy) => { for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) t[(cy + dy) * W + cx + dx] = T_FLOOR; };
  if (chance(0.5)) {
    while (x !== b.cx) { carve(x, y); x += Math.sign(b.cx - x); }
    while (y !== b.cy) { carve(x, y); y += Math.sign(b.cy - y); }
  } else {
    while (y !== b.cy) { carve(x, y); y += Math.sign(b.cy - y); }
    while (x !== b.cx) { carve(x, y); x += Math.sign(b.cx - x); }
  }
  carve(x, y);
}

function genMap(floor) {
  const boss = floor % 3 === 0;
  const W = Math.min(36 + floor * 3, 64), H = Math.min(40 + floor * 3, 70);
  const tiles = new Uint8Array(W * H);
  const rooms = [];
  const want = Math.min(6 + floor, 13);
  const free = (x, y, w, h) => !rooms.some((o) => x < o.x + o.w + 3 && x + w + 3 > o.x && y < o.y + o.h + 3 && y + h + 3 > o.y);
  if (boss) { const w = 13, h = 11; rooms.push(mkRoom(randi(2, W - w - 3), randi(2, H - h - 3), w, h)); }
  for (let tries = 0; rooms.length < want && tries < 900; tries++) {
    const w = randi(6, 10), h = randi(5, 8), x = randi(2, W - w - 3), y = randi(2, H - h - 3);
    if (free(x, y, w, h)) rooms.push(mkRoom(x, y, w, h));
  }
  for (const r of rooms) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) tiles[y * W + x] = T_FLOOR;
  // Räume verbinden (minimaler Spannbaum + ein paar Schleifen)
  const n = rooms.length, edges = [], inT = rooms.map((_, i) => i === 0);
  for (let k = 1; k < n; k++) {
    let best = null, bd = Infinity;
    for (let i = 0; i < n; i++) if (inT[i]) for (let j = 0; j < n; j++) if (!inT[j]) {
      const d = Math.abs(rooms[i].cx - rooms[j].cx) + Math.abs(rooms[i].cy - rooms[j].cy);
      if (d < bd) { bd = d; best = [i, j]; }
    }
    inT[best[1]] = true; edges.push(best);
  }
  for (let k = 0; k < ((n / 3) | 0); k++) { const i = randi(0, n - 1), j = randi(0, n - 1); if (i !== j) edges.push([i, j]); }
  for (const [i, j] of edges) corridor(tiles, W, rooms[i], rooms[j]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (tiles[y * W + x] !== T_VOID) continue;
    let near = false;
    for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < W && yy < H && tiles[yy * W + xx] === T_FLOOR) { near = true; break; }
    }
    if (near) tiles[y * W + x] = T_WALL;
  }
  const m = { W, H, tiles, rooms, boss, explored: new Uint8Array(W * H), flowD: null, chests: [], decals: [], torches: [], dirty: true };
  let start, goal;
  if (boss) {
    goal = rooms[0];
    const d = bfs(W, H, tiles, goal.cx, goal.cy);
    start = rooms[1] || rooms[0];
    for (const r of rooms) if (r !== goal && d[r.cy * W + r.cx] > d[start.cy * W + start.cx]) start = r;
  } else {
    start = pick(rooms);
    const d = bfs(W, H, tiles, start.cx, start.cy);
    goal = rooms[0];
    for (const r of rooms) if (d[r.cy * W + r.cx] > d[goal.cy * W + goal.cx]) goal = r;
  }
  m.start = start; m.goal = goal;
  m.stairs = { tx: goal.cx, ty: goal.cy, x: goal.cx * TS + 8, y: goal.cy * TS + 8 };
  for (const r of rooms) {
    const cand = [];
    for (let x = r.x + 1; x < r.x + r.w - 1; x++) if (tiles[(r.y - 1) * W + x] === T_WALL && tiles[r.y * W + x] === T_FLOOR) cand.push(x);
    shuffle(cand);
    const used = [], k = r.w > 8 ? 2 : 1;
    for (const x of cand) {
      if (used.length >= k) break;
      if (used.some((u) => Math.abs(u - x) < 3)) continue;
      used.push(x);
      m.torches.push({ tx: x, ty: r.y - 1, x: x * TS + 8, y: (r.y - 1) * TS + 8, ph: Math.random() * 10 });
    }
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (tiles[y * W + x] === T_FLOOR && chance(0.03) && !(x === goal.cx && y === goal.cy)) m.decals.push({ tx: x, ty: y });
  }
  return m;
}

function prerender(m) {
  const c = mkCanvas(m.W * TS, m.H * TS), x = c.getContext('2d');
  x.fillStyle = '#0b0810'; x.fillRect(0, 0, c.width, c.height);
  const at = (tx, ty) => (tx < 0 || ty < 0 || tx >= m.W || ty >= m.H ? T_VOID : m.tiles[ty * m.W + tx]);
  for (let ty = 0; ty < m.H; ty++) for (let tx = 0; tx < m.W; tx++) {
    const t = at(tx, ty), X = tx * TS, Y = ty * TS;
    const hsh = (Math.imul(tx, 73856093) ^ Math.imul(ty, 19349663)) >>> 0;
    if (t === T_FLOOR) {
      const v = hsh % 100;
      x.drawImage(TILE.floor[v < 7 ? 2 : v < 13 ? 3 : v & 1], X, Y);
      if (at(tx, ty - 1) === T_WALL) { x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(X, Y, TS, 3); x.fillStyle = 'rgba(0,0,0,.14)'; x.fillRect(X, Y + 3, TS, 3); }
      if (at(tx - 1, ty) === T_WALL) { x.fillStyle = 'rgba(0,0,0,.16)'; x.fillRect(X, Y, 2, TS); }
    } else if (t === T_WALL) {
      x.drawImage(at(tx, ty + 1) === T_FLOOR ? TILE.front[hsh % 3] : TILE.top, X, Y);
      x.fillStyle = '#7a6889';
      if (at(tx - 1, ty) === T_FLOOR) x.fillRect(X, Y, 1, TS);
      if (at(tx + 1, ty) === T_FLOOR) x.fillRect(X + TS - 1, Y, 1, TS);
      if (at(tx, ty - 1) === T_FLOOR) x.fillRect(X, Y, TS, 1);
    }
  }
  for (const d of m.decals) x.drawImage(SPR.bones, d.tx * TS, d.ty * TS);
  x.drawImage(SPR.stairs, m.stairs.tx * TS, m.stairs.ty * TS);
  m.canvas = c;
}

// ---------- Kollision & Sicht ----------
function boxHit(x, y, hw, hh) {
  const x0 = Math.floor((x - hw) / TS), x1 = Math.floor((x + hw - 0.01) / TS);
  const y0 = Math.floor((y - hh) / TS), y1 = Math.floor((y + hh - 0.01) / TS);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (solidT(tx, ty)) return true;
  return false;
}
function slide(e, axis, amt) {
  for (let o = 1; o <= 5; o++) for (const s of [-1, 1]) {
    const nx = axis === 'x' ? e.x + s * o : e.x + amt;
    const ny = axis === 'y' ? e.y + s * o : e.y + amt;
    if (!boxHit(nx, ny, e.hw, e.hh)) { if (axis === 'x') e.x += s * 0.8; else e.y += s * 0.8; return; }
  }
}
function moveBox(e, dx, dy, nudge) {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 2));
  const sx = dx / steps, sy = dy / steps;
  let hit = false;
  for (let i = 0; i < steps; i++) {
    if (sx) { if (!boxHit(e.x + sx, e.y, e.hw, e.hh)) e.x += sx; else { hit = true; if (nudge && Math.abs(sy) < 0.05) slide(e, 'y', sx); } }
    if (sy) { if (!boxHit(e.x, e.y + sy, e.hw, e.hh)) e.y += sy; else { hit = true; if (nudge && Math.abs(sx) < 0.05) slide(e, 'x', sy); } }
  }
  return hit;
}
function los(x0, y0, x1, y1) {
  let tx = Math.floor(x0 / TS), ty = Math.floor(y0 / TS);
  const ex = Math.floor(x1 / TS), ey = Math.floor(y1 / TS);
  const dx = Math.abs(ex - tx), dy = -Math.abs(ey - ty), sx = tx < ex ? 1 : -1, sy = ty < ey ? 1 : -1;
  let err = dx + dy;
  for (let n = 0; n < 90; n++) {
    if (solidT(tx, ty)) return false;
    if (tx === ex && ty === ey) return true;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; tx += sx; }
    if (e2 <= dx) { err += dx; ty += sy; }
  }
  return false;
}
function losT(tx, ty, ex, ey) {
  const dx = Math.abs(ex - tx), dy = -Math.abs(ey - ty), sx = tx < ex ? 1 : -1, sy = ty < ey ? 1 : -1;
  let err = dx + dy;
  for (let n = 0; n < 40; n++) {
    if (tx === ex && ty === ey) return true;
    if (n > 0 && solidT(tx, ty)) return false;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; tx += sx; }
    if (e2 <= dx) { err += dx; ty += sy; }
  }
  return false;
}
function explore(cx, cy, R) {
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
    if (dx * dx + dy * dy > R * R + 1) continue;
    const tx = cx + dx, ty = cy + dy;
    if (tx < 0 || ty < 0 || tx >= M.W || ty >= M.H) continue;
    const i = ty * M.W + tx;
    if (M.explored[i]) continue;
    if (losT(cx, cy, tx, ty)) { M.explored[i] = 1; M.dirty = true; }
  }
}
function flowNext(e) {
  const D = M.flowD;
  if (!D) return null;
  const tx = (e.x / TS) | 0, ty = (e.y / TS) | 0;
  let best = D[ty * M.W + tx], bx = -1, by = -1;
  if (best < 0) best = 1e9;
  for (const [ox, oy] of DIRS8) {
    const nx = tx + ox, ny = ty + oy;
    if (solidT(nx, ny)) continue;
    if (ox && oy && (solidT(tx + ox, ty) || solidT(tx, ty + oy))) continue;
    const v = D[ny * M.W + nx];
    if (v >= 0 && v < best) { best = v; bx = nx; by = ny; }
  }
  return bx < 0 ? null : { x: bx * TS + 8, y: by * TS + 8 };
}

// ---------- Effekte ----------
function floater(x, y, text, col, sc, dur) { if (G.floaters.length < 40) G.floaters.push({ x, y, text, col, sc: sc || 1, t: 0, dur: dur || 0.9 }); }
function sparks(x, y, n, col) {
  for (let i = 0; i < n && G.parts.length < 320; i++) {
    const a = Math.random() * TAU, s = rand(30, 90);
    G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, t: 0, dur: rand(0.18, 0.42), col, s: 1, g: 160 });
  }
}
function puff(x, y, cols, n) {
  for (let i = 0; i < (n || 14) && G.parts.length < 320; i++) {
    const a = Math.random() * TAU, s = rand(10, 55);
    G.parts.push({ x: x + rand(-3, 3), y: y + rand(-3, 3), vx: Math.cos(a) * s, vy: Math.sin(a) * s - 15, t: 0, dur: rand(0.3, 0.7), col: pick(cols), s: chance(0.3) ? 2 : 1, g: 40 });
  }
}
const PUFF_COL = {
  rat: ['#9c8a7a', '#6b5b4e', '#c2c3d6'], slime: ['#8be35f', '#3fa34d', '#c9ffb0'], bat: ['#b36bd6', '#6a3a8c'],
  mush: ['#e2434b', '#ece3c8', '#f4f4f4'], skel: ['#ece3c8', '#b3a682', '#4a4f6e'], mimic: ['#9a6a44', '#ffd23f', '#5e3d27'],
  boss: ['#8be35f', '#3fa34d', '#ffd23f', '#f4f4f4'],
};

// ---------- Spieler ----------
function newPlayer() {
  return {
    x: 0, y: 0, hw: 4, hh: 3, tx: -1, ty: -1, face: 0, hp: 30, maxHp: 30, level: 1, xp: 0, xpNext: 12,
    weapon: 0, sharpen: 0, potions: 2, gold: 0, boxes: [], atkCd: 0, inv: 0, kx: 0, ky: 0, walkT: 0, moving: false,
    dmgMul: 1, speedMul: 1, atkMul: 1, rangeMul: 1, crit: 0.08, lifeOnKill: 0, magnet: 22, goldMul: 1, viewMul: 1,
    timeBonus: 0, armor: 0, luck: 0, perks: {}, nextTime: 0,
  };
}

function updatePlayer(dt) {
  const v = Input.vec();
  const mag = Math.hypot(v.x, v.y);
  P.moving = mag > 0.12;
  const spd = 64 * P.speedMul;
  let dx = 0, dy = 0;
  if (P.moving) { P.face = Math.atan2(v.y, v.x); P.walkT += dt * (0.5 + mag * 0.7); dx = v.x * spd * dt; dy = v.y * spd * dt; }
  dx += P.kx * dt; dy += P.ky * dt;
  const f = Math.pow(0.0008, dt); P.kx *= f; P.ky *= f;
  if (Math.abs(P.kx) + Math.abs(P.ky) < 3) P.kx = P.ky = 0;
  const ox = P.x, oy = P.y;
  if (dx || dy) moveBox(P, dx, dy, true);
  const moved = Math.hypot(P.x - ox, P.y - oy);
  G.run.dist += moved;
  if (G.run.dist > 16000) unlock('marathon');
  if (P.moving && moved > 0.2 && chance(dt * 6) && G.parts.length < 300) G.parts.push({ x: P.x + rand(-2, 2), y: P.y + 3, vx: rand(-8, 8), vy: rand(-12, -4), t: 0, dur: 0.35, col: '#6b5a7d', s: 1, g: 0 });
  P.atkCd -= dt; P.inv -= dt;
  if (Input.attack) playerAttack();
  const tx = (P.x / TS) | 0, ty = (P.y / TS) | 0;
  if (tx !== P.tx || ty !== P.ty) {
    P.tx = tx; P.ty = ty;
    explore(tx, ty, 6);
    M.flowD = bfs(M.W, M.H, M.tiles, tx, ty);
  }
  for (const c of M.chests) if (!c.open && Math.abs(P.x - c.x) < 10 && Math.abs(P.y - c.y) < 10) openChest(c);
  const s = M.stairs;
  if (Math.abs(P.x - s.x) < 7 && Math.abs(P.y - s.y) < 7) onStairs();
}

function playerAttack() {
  if (P.atkCd > 0) return;
  const w = WEAPONS[P.weapon];
  P.atkCd = w.cd / P.atkMul;
  const range = w.range * P.rangeMul, arc = (w.arc * Math.PI) / 180;
  let best = null, bd = range * 1.9;
  for (const e of G.enemies) {
    if (e.dead || e.dormant || e.air) continue;
    const d = Math.hypot(e.x - P.x, e.y - P.y) - e.hw;
    if (d < bd && los(P.x, P.y, e.x, e.y)) { bd = d; best = e; }
  }
  if (best) P.face = Math.atan2(best.y - P.y, best.x - P.x);
  const cx = P.x, cy = P.y - 4;
  G.slashes.push({ x: cx, y: cy, a: P.face, arc, r: range, t: 0, dur: 0.16, col: w.col });
  let hits = 0, kills = 0;
  for (const e of G.enemies) {
    if (e.dead || e.air) continue;
    const ex = e.x, ey = e.y - (e.type === 'boss' ? 8 : 4) - (e.z || 0) * 0.5;
    const ddx = ex - cx, ddy = ey - cy, d = Math.hypot(ddx, ddy) - e.hw;
    if (d > range) continue;
    if (d > 4 && Math.abs(angDiff(Math.atan2(ddy, ddx), P.face)) > arc / 2) continue;
    let dmg = (w.dmg + P.sharpen) * P.dmgMul * rand(0.85, 1.15);
    const crit = Math.random() < P.crit;
    if (crit) dmg *= 2;
    hits++;
    if (hitEnemy(e, Math.max(1, Math.round(dmg)), crit, Math.atan2(ddy, ddx), w.knock)) kills++;
  }
  Sfx.play(hits ? 'hit' : 'swing');
  if (kills >= 2) unlock('doppel');
}

function hurtPlayer(dmg, sx, sy) {
  if (P.inv > 0 || G.state !== 'play') return;
  dmg = Math.max(1, Math.round(dmg * (1 - P.armor)));
  P.hp -= dmg; P.inv = 0.75; G.fl.dmg += dmg;
  const a = Math.atan2(P.y - sy, P.x - sx);
  P.kx += Math.cos(a) * 150; P.ky += Math.sin(a) * 150;
  G.shake = Math.max(G.shake, 4); G.flash = 0.3;
  Sfx.play('hurt');
  try { if (navigator.vibrate) navigator.vibrate(25); } catch (e) { /* egal */ }
  floater(P.x, P.y - 22, '-' + dmg, '#ff4d5a');
  addViewers(6, true);
  if (P.hp <= 0) { P.hp = 0; puff(P.x, P.y - 6, ['#2ec4b6', '#e2434b', '#f2c49b', '#f4f4f4'], 26); gameOver('dead'); return; }
  if (P.hp <= P.maxHp * 0.1) unlock('messer');
  if (P.hp <= P.maxHp * 0.3 && !G.fl.low) { G.fl.low = true; Zyn.say(pick(LINES.lowHp), 1); addViewers(120, true); }
}
function healPlayer(h, show) {
  const before = P.hp;
  P.hp = Math.min(P.maxHp, P.hp + h);
  if (show && P.hp > before) floater(P.x, P.y - 22, '+' + Math.round(P.hp - before), '#8be35f');
}
function drinkPotion() {
  if (G.state !== 'play' || !P) return;
  if (P.potions <= 0) { Zyn.say(LINES.noPotion, 0); Sfx.play('click'); return; }
  if (P.hp >= P.maxHp) { floater(P.x, P.y - 22, 'VOLL', '#c2c3d6'); return; }
  P.potions--;
  healPlayer(Math.max(12, Math.round(P.maxHp * 0.4)), true);
  G.run.potions++;
  Sfx.play('potion');
  sparks(P.x, P.y - 8, 10, '#8be35f');
  if (G.run.potions >= 5) unlock('durst');
  if (chance(0.35)) Zyn.say(pick(LINES.potion), 0);
}

// ---------- Gegner ----------
function spawnEnemy(type, x, y, opt) {
  opt = opt || {};
  const d = ENEMY[type], f = G.floor;
  const hp = Math.round(d.hp * (1 + 0.24 * (f - 1)) * (opt.hpMul || 1));
  const e = {
    type, d, x, y, hw: d.hw, hh: d.hh, hp, maxHp: hp, dmg: Math.round(d.dmg * (1 + 0.12 * (f - 1))),
    spd: d.spd * (1 + 0.025 * Math.min(f - 1, 12)), t: Math.random() * 10, seed: Math.random() * 10,
    flash: 0, kx: 0, ky: 0, atkCd: 0.6, cd: rand(0.6, 2), aggro: false, face: 1, z: 0, wx: 0, wy: 0, wt: 0,
    dormant: type === 'mimic', dead: false, hopT: rand(0, 1), hop: 0, wind: 0, dash: 0, dir: 0,
    jump: 0, jumpDur: 0.9, jumpCd: 3, split: 0, air: false, puff: 0, spr: type, name: d.name,
  };
  G.enemies.push(e);
  return e;
}
function steer(e, spd, dt, wob) {
  let tx, ty;
  if (los(e.x, e.y, P.x, P.y)) { tx = P.x; ty = P.y; }
  else {
    const nx = flowNext(e);
    if (!nx) return;
    tx = nx.x; ty = nx.y;
  }
  let a = Math.atan2(ty - e.y, tx - e.x);
  if (wob) a += Math.sin(e.t * 7 + e.seed) * wob;
  moveBox(e, Math.cos(a) * spd * dt, Math.sin(a) * spd * dt);
}
function wander(e, dt) {
  if (e.type === 'mimic' || e.type === 'boss') return;
  e.wt -= dt;
  if (e.wt <= 0) {
    e.wt = rand(1, 2.5);
    const a = Math.random() * TAU, m = chance(0.4) ? 0 : 1;
    e.wx = Math.cos(a) * m; e.wy = Math.sin(a) * m;
  }
  const s = e.spd * 0.35;
  if (moveBox(e, e.wx * s * dt, e.wy * s * dt)) e.wt = 0;
  if (e.wx) e.face = e.wx < 0 ? -1 : 1;
  if (e.type === 'bat') e.z = 7 + Math.sin(e.t * 9) * 2;
}
const AI = {
  chase(e, dt) { steer(e, e.spd, dt, 0.35); },
  hop(e, dt) {
    e.hopT -= dt;
    if (e.hop <= 0 && e.hopT <= 0) { e.hop = 0.4; e.hopT = rand(0.8, 1.2); }
    if (e.hop > 0) {
      e.hop -= dt;
      steer(e, e.spd * 2.6, dt);
      e.z = Math.sin(clamp(1 - e.hop / 0.4, 0, 1) * Math.PI) * 5;
      if (e.hop <= 0) e.z = 0;
    }
  },
  flutter(e, dt, dx, dy) {
    if (los(e.x, e.y, P.x, P.y)) {
      const a = Math.atan2(dy, dx) + Math.sin(e.t * 5 + e.seed) * 0.9;
      moveBox(e, Math.cos(a) * e.spd * dt, Math.sin(a) * e.spd * dt);
    } else steer(e, e.spd, dt);
    e.z = 7 + Math.sin(e.t * 9) * 2;
  },
  shooter(e, dt, dx, dy, d) {
    e.puff -= dt;
    if (d < 115 && los(e.x, e.y, P.x, P.y)) {
      if (d < 46) moveBox(e, (-dx / d) * e.spd * dt, (-dy / d) * e.spd * dt);
      if (e.cd <= 0) {
        e.cd = 2.4; e.puff = 0.3;
        const a = Math.atan2(dy, dx);
        G.shots.push({ x: e.x, y: e.y - 6, vx: Math.cos(a) * 72, vy: Math.sin(a) * 72, t: 0, life: 2.4, dmg: e.dmg });
        Sfx.play('spit');
      }
    } else steer(e, e.spd * 1.6, dt);
  },
  lunge(e, dt, dx, dy, d) {
    if (e.wind > 0) { e.wind -= dt; if (e.wind <= 0) { e.dash = 0.28; e.dir = Math.atan2(dy, dx); } return; }
    if (e.dash > 0) { e.dash -= dt; moveBox(e, Math.cos(e.dir) * e.spd * 4.2 * dt, Math.sin(e.dir) * e.spd * 4.2 * dt); return; }
    if (d < 42 && e.cd <= 0 && los(e.x, e.y, P.x, P.y)) { e.wind = 0.45; e.cd = 2.2; return; }
    steer(e, e.spd, dt);
  },
  mimic(e, dt, dx, dy, d) {
    if (e.dormant) { if (d < 26) wakeMimic(e); return; }
    AI.lunge(e, dt, dx, dy, d);
  },
  boss(e, dt, dx, dy, d) {
    if (e.jump > 0) {
      e.jump -= dt;
      const p = clamp(1 - e.jump / e.jumpDur, 0, 1);
      e.z = Math.sin(p * Math.PI) * 26; e.air = e.z > 6;
      const k = Math.min(1, dt * 3.2);
      moveBox(e, (e.jx - e.x) * k, (e.jy - e.y) * k);
      if (e.jump <= 0) { e.z = 0; e.air = false; slam(e); }
      return;
    }
    e.jumpCd -= dt;
    if (e.jumpCd <= 0 && d < 150) { e.jump = e.jumpDur; e.jx = P.x; e.jy = P.y; e.jumpCd = rand(3.5, 5); Sfx.play('boss'); return; }
    e.hopT -= dt;
    if (e.hop <= 0 && e.hopT <= 0) { e.hop = 0.45; e.hopT = rand(0.7, 1.1); }
    if (e.hop > 0) { e.hop -= dt; steer(e, e.spd * 2.4, dt); e.z = Math.sin(clamp(1 - e.hop / 0.45, 0, 1) * Math.PI) * 6; if (e.hop <= 0) e.z = 0; }
    const frac = e.hp / e.maxHp;
    while (e.split < 2 && frac < 1 - (e.split + 1) * 0.34) {
      e.split++;
      for (let i = 0; i < 2; i++) {
        const m = spawnEnemy('slime', e.x + rand(-14, 14), e.y + rand(-8, 8));
        if (boxHit(m.x, m.y, m.hw, m.hh)) { m.x = e.x; m.y = e.y; }
        m.aggro = true;
      }
      puff(e.x, e.y - 10, PUFF_COL.boss, 16);
    }
  },
};
function slam(e) {
  G.rings.push({ x: e.x, y: e.y, t: 0, dur: 0.4, max: 46 });
  G.shake = Math.max(G.shake, 6);
  Sfx.play('slam');
  puff(e.x, e.y, ['#6b5a7d', '#8b8ba3', '#3fa34d'], 18);
  if (Math.hypot(P.x - e.x, P.y - e.y) < 40) hurtPlayer(Math.round(e.dmg * 1.3), e.x, e.y);
}
function wakeMimic(e) {
  if (!e.dormant) return;
  e.dormant = false; e.aggro = true; e.cd = 0.5;
  Sfx.play('boss'); G.shake = Math.max(G.shake, 3);
  floater(e.x, e.y - 22, 'HAPPS!', '#ff4d5a');
  seen(e);
}
function seen(e) {
  if (e.type === 'boss') {
    if (!G.bossSeen) { G.bossSeen = true; Zyn.say(fill(LINES.bossSeen, { b: e.name }), 2); Sfx.play('boss'); G.shake = Math.max(G.shake, 5); }
    return;
  }
  if (!G.seenTypes.has(e.type)) { G.seenTypes.add(e.type); const l = LINES.firstSeen[e.type]; if (l) Zyn.say(l, 1); }
}

function updateEnemies(dt) {
  const E = G.enemies;
  for (const e of E) {
    if (e.dead) continue;
    e.t += dt; e.flash -= dt; e.atkCd -= dt; e.cd -= dt;
    if (e.kx || e.ky) {
      moveBox(e, e.kx * dt, e.ky * dt);
      const f = Math.pow(0.002, dt); e.kx *= f; e.ky *= f;
      if (Math.abs(e.kx) + Math.abs(e.ky) < 4) e.kx = e.ky = 0;
    }
    const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 0.01;
    if (!e.aggro && !e.dormant) {
      if (d < e.d.sight && los(e.x, e.y, P.x, P.y)) { e.aggro = true; seen(e); }
      else { wander(e, dt); continue; }
    }
    if (e.aggro && !e.dormant && e.type !== 'boss' && M.flowD) {
      const fd = M.flowD[((e.y / TS) | 0) * M.W + ((e.x / TS) | 0)];
      if (fd > 32 || fd < 0) { e.aggro = false; continue; }
    }
    AI[e.d.ai](e, dt, dx, dy, d);
    if (e.dead) continue;
    if (!e.dormant && !e.air && d < e.hw + P.hw + 3 && e.atkCd <= 0) { hurtPlayer(e.dmg, e.x, e.y); e.atkCd = 0.9; }
    if (!e.dormant && Math.abs(dx) > 1) e.face = dx < 0 ? -1 : 1;
  }
  for (let i = 0; i < E.length; i++) {
    const a = E[i];
    if (a.dead || a.dormant) continue;
    for (let j = i + 1; j < E.length; j++) {
      const b = E[j];
      if (b.dead || b.dormant) continue;
      const dx = b.x - a.x, dy = b.y - a.y, min = a.hw + b.hw, d2 = dx * dx + dy * dy;
      if (d2 < min * min && d2 > 0.0001) {
        const d = Math.sqrt(d2), push = (min - d) * 0.25, ux = dx / d, uy = dy / d;
        moveBox(a, -ux * push, -uy * push); moveBox(b, ux * push, uy * push);
      }
    }
  }
  G.enemies = E.filter((e) => !e.dead);
}

function hitEnemy(e, dmg, crit, ang, knock) {
  if (e.dead) return false;
  if (e.dormant) wakeMimic(e);
  e.hp -= dmg; e.flash = 0.12; e.aggro = true;
  const kb = knock * (e.type === 'boss' ? 0.12 : 1);
  e.kx += Math.cos(ang) * kb; e.ky += Math.sin(ang) * kb;
  floater(e.x, e.y - 20 - (e.type === 'boss' ? 14 : 0), String(dmg), crit ? '#ffd23f' : '#ffffff', crit ? 2 : 1);
  sparks(e.x, e.y - 6, crit ? 10 : 5, crit ? '#ffd23f' : '#ffffff');
  addViewers(crit ? 8 : 2, true);
  if (crit) { G.shake = Math.max(G.shake, 3); G.hitstop = Math.max(G.hitstop, 0.05); Sfx.play('crit'); }
  if (e.hp <= 0) { killEnemy(e); return true; }
  return false;
}
function killEnemy(e) {
  e.dead = true;
  G.run.kills++; G.fl.kills++;
  G.run.by[e.type] = (G.run.by[e.type] || 0) + 1;
  G.combo = G.comboT > 0 ? G.combo + 1 : 1;
  G.comboT = 2.5;
  G.run.maxCombo = Math.max(G.run.maxCombo, G.combo);
  if (G.combo >= 3) { floater(P.x, P.y - 30, 'KOMBO X' + G.combo, '#ff7ab8', 1, 1.1); if (G.combo === 3) Zyn.say(pick(LINES.combo), 0); }
  if (G.combo >= 5) unlock('kombo');
  const [g0, g1] = e.d.gold;
  dropCoins(e.x, e.y, Math.max(1, Math.round(randi(g0, g1) * (1 + 0.15 * (G.floor - 1)) * P.goldMul)));
  if (e.type === 'boss' || chance(0.07 + P.luck * 0.02)) dropPotion(e.x, e.y);
  giveXP(Math.round(e.d.xp * (1 + 0.1 * (G.floor - 1))));
  addViewers((10 + e.d.xp * 2) * G.combo, true);
  if (P.lifeOnKill) healPlayer(P.lifeOnKill, true);
  puff(e.x, e.y - 6, PUFF_COL[e.type] || PUFF_COL.rat, e.type === 'boss' ? 40 : 14);
  Sfx.play('kill');
  G.hitstop = Math.max(G.hitstop, 0.03);
  unlock('ersttaeter');
  if ((G.run.by.rat || 0) >= 15) unlock('kammer');
  if ((G.run.by.slime || 0) >= 10) unlock('glibber');
  if (e.type === 'skel') unlock('paragraf');
  if (e.type === 'mimic') unlock('mimikry');
  if (e.type === 'boss') bossDefeated(e);
}

// ---------- Geschosse, Beute, Truhen ----------
function updateShots(dt) {
  for (const s of G.shots) {
    s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt;
    if (s.t > s.life || solidT((s.x / TS) | 0, (s.y / TS) | 0)) { s.dead = true; sparks(s.x, s.y, 4, '#c8e05a'); continue; }
    if (Math.abs(s.x - P.x) < 6 && Math.abs(s.y - (P.y - 4)) < 7) { s.dead = true; hurtPlayer(s.dmg, s.x - s.vx, s.y - s.vy); sparks(s.x, s.y, 6, '#c8e05a'); }
  }
  G.shots = G.shots.filter((s) => !s.dead);
}
function updateRings(dt) { for (const r of G.rings) r.t += dt; G.rings = G.rings.filter((r) => r.t < r.dur); }

function spawnCoin(x, y, v) {
  const a = Math.random() * TAU, s = rand(20, 55);
  G.pickups.push({ kind: 'coin', v, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, z: 2, vz: rand(60, 100), t: 0, hw: 2, hh: 2 });
}
function dropCoins(x, y, n) {
  let left = n, cnt = 0;
  while (left > 0 && cnt < 10) { const v = left >= 25 ? 10 : left >= 8 ? 5 : 1; left -= v; cnt++; spawnCoin(x, y, v); }
  if (left > 0) spawnCoin(x, y, left);
}
function dropPotion(x, y) {
  const a = Math.random() * TAU;
  G.pickups.push({ kind: 'potion', x, y, vx: Math.cos(a) * 30, vy: Math.sin(a) * 30, z: 2, vz: 90, t: 0, hw: 3, hh: 3 });
}
function updatePickups(dt) {
  for (const c of G.pickups) {
    c.t += dt;
    if (c.kind === 'crate') {
      if (c.z > 0) { c.z = Math.max(0, c.z - 46 * dt); if (c.z === 0) { puff(c.x, c.y, ['#6b5a7d', '#8b8ba3'], 10); Sfx.play('hit'); } continue; }
      if (Math.abs(P.x - c.x) < 11 && Math.abs(P.y - c.y) < 11) { openCrate(c); c.dead = true; }
      continue;
    }
    if (c.vz || c.z > 0) {
      c.z += c.vz * dt; c.vz -= 260 * dt;
      if (c.z <= 0) { c.z = 0; c.vz = -c.vz * 0.4; if (Math.abs(c.vz) < 25) c.vz = 0; }
    }
    if (c.vx || c.vy) {
      moveBox(c, c.vx * dt, c.vy * dt);
      const f = Math.pow(0.03, dt); c.vx *= f; c.vy *= f;
      if (Math.abs(c.vx) + Math.abs(c.vy) < 2) c.vx = c.vy = 0;
    }
    const dx = P.x - c.x, dy = P.y - c.y, d = Math.hypot(dx, dy) || 0.01;
    if (c.t > 0.35 && d < P.magnet) { const s = 110 + (P.magnet - d) * 5; c.x += (dx / d) * s * dt; c.y += (dy / d) * s * dt; }
    if (d < 7 && c.t > 0.25) { if (collect(c)) c.dead = true; }
  }
  G.pickups = G.pickups.filter((c) => !c.dead);
}
function collect(c) {
  if (c.kind === 'coin') {
    addGold(c.v);
    G.goldAcc += c.v; G.goldAccT = 0.35;
    Sfx.play('coin');
    return true;
  }
  if (c.kind === 'potion') {
    if (P.potions >= 9) return false;
    P.potions++;
    floater(P.x, P.y - 22, '+TRANK', '#ff7a85');
    Sfx.play('coin'); addViewers(4, true);
    return true;
  }
  return false;
}
function openChest(c) {
  c.open = true;
  G.run.chests++;
  dropCoins(c.x, c.y, Math.round(randi(10, 22) * (1 + 0.25 * (G.floor - 1)) * P.goldMul));
  if (chance(0.3)) dropPotion(c.x, c.y);
  if (chance(0.12 + 0.06 * P.luck)) { P.boxes.push(0); floater(c.x, c.y - 22, 'BEUTEKISTE!', '#ffd23f'); }
  Sfx.play('box'); addViewers(25, true);
  sparks(c.x, c.y - 6, 12, '#ffd23f');
  if (G.run.chests >= 5) unlock('schatz');
  Zyn.say(pick(LINES.chest), 0);
}
function dropCrate() {
  let x = P.x, y = P.y + 20;
  for (let k = 0; k < 40; k++) {
    const a = Math.random() * TAU, r = rand(26, 52);
    const nx = P.x + Math.cos(a) * r, ny = P.y + Math.sin(a) * r;
    if (!boxHit(nx, ny, 7, 6) && los(P.x, P.y, nx, ny)) { x = nx; y = ny; break; }
  }
  if (boxHit(x, y, 6, 5)) { x = P.x; y = P.y; }
  G.pickups.push({ kind: 'crate', x, y, z: 90, t: 0, sponsor: pick(SPONSORS), hw: 6, hh: 5 });
  floater(P.x, P.y - 30, 'SPONSOR!', '#ffd23f', 1, 1.2);
  Sfx.play('sponsor');
}
function openCrate(c) {
  const s = c.sponsor, roll = Math.random();
  let txt;
  if (roll < 0.34) { P.potions = Math.min(9, P.potions + 1); txt = '+1 TRANK'; }
  else if (roll < 0.6) { const g = Math.round(randi(15, 35) * (1 + 0.3 * (G.floor - 1))); addGold(g); txt = '+' + g + ' GOLD'; }
  else if (roll < 0.78) { G.timeLeft += 20; txt = '+20 SEK'; }
  else { P.boxes.push(G.floor >= 4 && chance(0.4) ? 1 : 0); txt = 'BEUTEKISTE'; }
  floater(c.x, c.y - 24, txt, '#ffd23f', 1, 1.3);
  sparks(c.x, c.y - 8, 14, '#ffd23f');
  Zyn.say(fill(LINES.sponsor, { s: s.name, slogan: s.slogan }), 1);
  G.run.sponsor++;
  if (G.run.sponsor >= 3) unlock('sponsor');
  Sfx.play('box'); addViewers(80, true);
}

function stepFx(dt) {
  for (const p of G.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; }
  G.parts = G.parts.filter((p) => p.t < p.dur);
  for (const f of G.floaters) f.t += dt;
  G.floaters = G.floaters.filter((f) => f.t < f.dur);
  for (const s of G.slashes) s.t += dt;
  G.slashes = G.slashes.filter((s) => s.t < s.dur);
  G.shake = Math.max(0, G.shake - dt * 18);
  G.flash = Math.max(0, G.flash - dt * 2.5);
}
