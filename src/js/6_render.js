// ---------- Darstellung ----------
let cv, ctx, lcv, lctx, mcv, mctx, miniImg = null;
const V = { w: 200, h: 300, sc: 2, cx: 0, cy: 0 };

function setupCanvas() {
  cv = $('#cv'); ctx = cv.getContext('2d');
  lcv = mkCanvas(8, 8); lctx = lcv.getContext('2d');
  mcv = $('#mini'); mctx = mcv.getContext('2d');
  resize();
}
function resize() {
  const cw = window.innerWidth, ch = window.innerHeight;
  const sc = Math.max(1, Math.round(Math.min(cw, ch) / 215));
  V.sc = sc; V.w = Math.ceil(cw / sc); V.h = Math.ceil(ch / sc);
  cv.width = V.w; cv.height = V.h;
  cv.style.width = V.w * sc + 'px'; cv.style.height = V.h * sc + 'px';
  lcv.width = V.w; lcv.height = V.h;
  ctx.imageSmoothingEnabled = false;
}

function blit(img, cx, cy) {
  let sx = cx, sy = cy, sw = V.w, sh = V.h, dx = 0, dy = 0;
  if (sx < 0) { dx = -sx; sw += sx; sx = 0; }
  if (sy < 0) { dy = -sy; sh += sy; sy = 0; }
  if (sx + sw > img.width) sw = img.width - sx;
  if (sy + sh > img.height) sh = img.height - sy;
  if (sw > 0 && sh > 0) ctx.drawImage(img, sx, sy, sw, sh, dx, dy, sw, sh);
}
function drawSpr(name, x, y, flip, white, scale) {
  const s = (white ? SPRW : SPR)[name];
  if (!s) return;
  scale = scale || 1;
  const w = s.width * scale, h = s.height * scale;
  const dx = Math.round(x - w / 2), dy = Math.round(y - h);
  if (flip) { ctx.save(); ctx.translate(dx + w, dy); ctx.scale(-1, 1); ctx.drawImage(s, 0, 0, w, h); ctx.restore(); }
  else ctx.drawImage(s, dx, dy, w, h);
}
function shadow(x, y, w, z) {
  w = Math.max(4, Math.round(w * (1 - Math.min(0.5, (z || 0) / 60))));
  const hw = w >> 1;
  ctx.fillStyle = 'rgba(0,0,0,.32)';
  ctx.fillRect(x - hw + 1, y - 1, w - 2, 1);
  ctx.fillRect(x - hw, y, w, 1);
  ctx.fillRect(x - hw + 1, y + 1, w - 2, 1);
}
function explAt(x, y) {
  const tx = (x / TS) | 0, ty = (y / TS) | 0;
  return tx >= 0 && ty >= 0 && tx < M.W && ty < M.H && M.explored[ty * M.W + tx];
}

function drawMapLayer(cx, cy) {
  ctx.fillStyle = '#0b0810'; ctx.fillRect(0, 0, V.w, V.h);
  blit(M.canvas, cx, cy);
  const tx0 = Math.max(0, Math.floor(cx / TS)), ty0 = Math.max(0, Math.floor(cy / TS));
  const tx1 = Math.min(M.W - 1, Math.floor((cx + V.w) / TS)), ty1 = Math.min(M.H - 1, Math.floor((cy + V.h) / TS));
  ctx.fillStyle = '#0b0810';
  for (let ty = ty0; ty <= ty1; ty++) {
    let run = -1;
    for (let tx = tx0; tx <= tx1 + 1; tx++) {
      const un = tx <= tx1 && !M.explored[ty * M.W + tx];
      if (un && run < 0) run = tx;
      else if (!un && run >= 0) { ctx.fillRect(run * TS - cx, ty * TS - cy, (tx - run) * TS, TS); run = -1; }
    }
  }
  for (const t of M.torches) {
    if (!M.explored[t.ty * M.W + t.tx]) continue;
    const x = t.x - cx, y = t.y - cy;
    if (x < -16 || y < -16 || x > V.w + 16 || y > V.h + 16) continue;
    ctx.drawImage(((ANIM * 7 + t.ph) | 0) % 2 ? SPR.torch_b : SPR.torch_a, Math.round(x - 8), Math.round(y - 8));
  }
}
function arrowDown(x, y, col) {
  const rows = [[2, 3], [2, 3], [0, 7], [1, 5], [2, 3], [3, 1]];
  for (let pass = 0; pass < 2; pass++) {
    ctx.fillStyle = pass ? col : '#140c1c';
    rows.forEach(([o, w], j) => ctx.fillRect(x - 3 + o + (pass ? 0 : 1), y + j + (pass ? 0 : 1), w, 1));
  }
}
function drawStairsFx(cx, cy) {
  const s = M.stairs;
  if (!M.explored[s.ty * M.W + s.tx]) return;
  const x = Math.round(s.x - cx), y = Math.round(s.y - cy);
  if (G.sealed) {
    ctx.fillStyle = '#ff4d5a';
    for (let i = -5; i <= 5; i += 5) ctx.fillRect(x + i - 1, y - 7, 2, 14);
    ctx.fillRect(x - 7, y - 3, 14, 2); ctx.fillRect(x - 7, y + 2, 14, 2);
  } else arrowDown(x, y - 18 + Math.round(Math.sin(ANIM * 5) * 2), '#8be35f');
}
function drawSlash(s, cx, cy) {
  const p = s.t / s.dur, a0 = s.a - s.arc / 2, steps = Math.ceil(s.r * s.arc * 1.2);
  const front = Math.min(1, p * 1.6);
  for (let k = 0; k <= steps; k++) {
    const q = k / steps;
    if (q > front) break;
    const a = a0 + s.arc * q, ca = Math.cos(a), sa = Math.sin(a);
    const fade = 1 - p;
    for (let rr = s.r - 3; rr <= s.r; rr++) {
      ctx.globalAlpha = fade * (rr === s.r ? 1 : 0.55);
      ctx.fillStyle = rr >= s.r - 1 ? '#ffffff' : s.col;
      ctx.fillRect(Math.round(s.x + ca * rr - cx), Math.round(s.y + sa * rr - cy), 1, 1);
    }
  }
  ctx.globalAlpha = 1;
}
function drawChute(x, y) {
  for (let dx = -11; dx <= 11; dx++) {
    const h = Math.round(Math.sqrt(121 - dx * dx) * 0.7);
    ctx.fillStyle = (((dx + 11) / 4) | 0) % 2 ? '#ff4f8b' : '#f6efff';
    ctx.fillRect(x + dx, y - 10 - h, 1, h + 1);
  }
  ctx.fillStyle = '#c2c3d6';
  for (let i = 0; i < 9; i++) {
    ctx.fillRect(Math.round(x - 10 + i * 0.5), y - 9 + i, 1, 1);
    ctx.fillRect(Math.round(x + 10 - i * 0.5), y - 9 + i, 1, 1);
  }
}

function drawPlayer(cx, cy) {
  const x = Math.round(P.x - cx), y = Math.round(P.y - cy) + P.hh + 1;
  shadow(x, y - 1, 10);
  if (G.state === 'over') return;
  if (P.inv > 0 && ((ANIM * 18) | 0) % 2) return;
  const fr = P.moving ? ((P.walkT * 7) | 0) % 2 : 0;
  drawSpr(fr ? 'hero_b' : 'hero_a', x, y - fr, Math.cos(P.face) < 0, false);
}
function enemySprite(e) {
  switch (e.type) {
    case 'rat': return ((e.t * 8) | 0) % 2 ? 'rat_b' : 'rat_a';
    case 'slime': return e.z > 1 ? 'slime_a' : ((e.t * 3) | 0) % 2 ? 'slime_b' : 'slime_a';
    case 'bat': return ((e.t * 10) | 0) % 2 ? 'bat_b' : 'bat_a';
    case 'mush': return e.puff > 0 ? 'mush_b' : 'mush_a';
    case 'skel': return e.dash > 0 || ((e.t * 5) | 0) % 2 ? 'skel_b' : 'skel_a';
    case 'mimic': return e.dormant ? 'chest' : ((e.t * 6) | 0) % 2 ? 'mimic' : 'chest';
    case 'boss': return e.spr + (e.z > 1 ? '_a' : ((e.t * 3) | 0) % 2 ? '_b' : '_a');
  }
  return 'rat_a';
}
function drawEnemy(e, cx, cy) {
  if (!explAt(e.x, e.y)) return;
  const x = Math.round(e.x - cx), y = Math.round(e.y - cy) + e.hh + 1;
  if (x < -40 || x > V.w + 40 || y < -50 || y > V.h + 60) return;
  const boss = e.type === 'boss', sc = boss ? 2 : 1, z = Math.round(e.z || 0);
  shadow(x, y - 1, boss ? 26 : e.type === 'bat' ? 7 : 11, e.z);
  let yy = y - z;
  if (e.dormant && (ANIM + e.seed) % 3.2 < 0.15) yy -= 1;
  const white = e.flash > 0 || (e.wind > 0 && ((ANIM * 16) | 0) % 2);
  drawSpr(enemySprite(e), x, yy, e.face < 0, white, sc);
  if (boss) drawSpr('crown', x, yy - 19, false, false, 2);
  else if (e.hp < e.maxHp && !e.dormant) {
    const w = 12, f = Math.max(0, e.hp / e.maxHp), top = yy - (e.type === 'rat' ? 10 : 17);
    ctx.fillStyle = '#140c1c'; ctx.fillRect(x - 6, top, w, 3);
    ctx.fillStyle = '#e2434b'; ctx.fillRect(x - 5, top + 1, Math.max(1, Math.round((w - 2) * f)), 1);
  }
}
function drawCrate(c, cx, cy) {
  const x = Math.round(c.x - cx), y = Math.round(c.y - cy) + c.hh + 1;
  shadow(x, y - 1, 13, c.z);
  const yy = y - Math.round(c.z);
  if (c.z > 0) drawChute(x, yy - 12);
  drawSpr('crate', x, yy, false, false);
}

function drawLight(cx, cy, title) {
  const dark = title ? 0.6 : Math.min(0.9, 0.8 + G.floor * 0.012);
  lctx.globalCompositeOperation = 'source-over';
  lctx.clearRect(0, 0, V.w, V.h);
  lctx.fillStyle = 'rgba(8,4,12,' + dark + ')';
  lctx.fillRect(0, 0, V.w, V.h);
  lctx.globalCompositeOperation = 'destination-out';
  const L = (x, y, r, a) => {
    if (x < -r || y < -r || x > V.w + r || y > V.h + r) return;
    const g = lctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(0,0,0,' + a + ')');
    g.addColorStop(0.55, 'rgba(0,0,0,' + a * 0.75 + ')');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    lctx.fillStyle = g;
    lctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  if (P && !title) L(P.x - cx, P.y - 6 - cy, 84 + Math.sin(ANIM * 9) * 1.5, 1);
  for (const t of M.torches) if (title || M.explored[t.ty * M.W + t.tx]) L(t.x - cx, t.y + 6 - cy, 46 + Math.sin(ANIM * 11 + t.ph) * 2, 0.95);
  if (!title) {
    const s = M.stairs;
    if (M.explored[s.ty * M.W + s.tx]) L(s.x - cx, s.y - cy, 30, 0.85);
    for (const c of G.pickups) if (c.kind === 'crate') L(c.x - cx, c.y - c.z - 8 - cy, 24, 0.85);
    for (const s2 of G.shots) L(s2.x - cx, s2.y - cy, 12, 0.7);
  } else L(V.w / 2, V.h * 0.42, Math.max(V.w, V.h) * 0.45, 0.55);
  ctx.drawImage(lcv, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  for (const t of M.torches) {
    if (!title && !M.explored[t.ty * M.W + t.tx]) continue;
    const x = t.x - cx, y = t.y + 4 - cy;
    if (x < -40 || y < -40 || x > V.w + 40 || y > V.h + 40) continue;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 40);
    g.addColorStop(0, 'rgba(255,140,60,.16)'); g.addColorStop(1, 'rgba(255,140,60,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 40, y - 40, 80, 80);
  }
  ctx.globalCompositeOperation = 'source-over';
}

function renderGame(dt) {
  const vw = V.w, vh = V.h;
  const tx = P.x - vw / 2, ty = P.y - vh * (vh > vw ? 0.47 : 0.5);
  const k = Math.min(1, dt * 7);
  V.cx += (tx - V.cx) * k; V.cy += (ty - V.cy) * k;
  const mw = M.W * TS, mh = M.H * TS;
  V.cx = mw > vw ? clamp(V.cx, -8, mw - vw + 8) : (mw - vw) / 2;
  V.cy = mh > vh ? clamp(V.cy, -60, mh - vh + 80) : (mh - vh) / 2;
  let sx = 0, sy = 0;
  if (G.shake > 0) { const s = G.shake * (REDUCED ? 0.3 : 1); sx = rand(-s, s); sy = rand(-s, s); }
  const cx = Math.round(V.cx + sx), cy = Math.round(V.cy + sy);
  drawMapLayer(cx, cy);
  drawStairsFx(cx, cy);
  for (const c of M.chests) {
    if (!M.explored[c.ty * M.W + c.tx]) continue;
    ctx.drawImage(c.open ? SPR.chest_open : SPR.chest, c.tx * TS - cx, c.ty * TS - cy);
  }
  for (const c of G.pickups) {
    if (c.kind === 'crate') continue;
    const x = Math.round(c.x - cx), y = Math.round(c.y - cy);
    if (x < -10 || y < -10 || x > vw + 10 || y > vh + 10) continue;
    shadow(x, y + 2, c.kind === 'coin' ? 5 : 8, c.z);
    if (c.kind === 'coin') ctx.drawImage(SPR.coin, x - 4, y - 5 - Math.round(c.z));
    else drawSpr('potion', x, y + 3 - Math.round(c.z), false, false);
  }
  const actors = G.enemies.filter((e) => !e.dead);
  actors.push(P);
  for (const c of G.pickups) if (c.kind === 'crate') actors.push(c);
  actors.sort((a, b) => a.y - b.y);
  for (const a of actors) {
    if (a === P) drawPlayer(cx, cy);
    else if (a.kind === 'crate') drawCrate(a, cx, cy);
    else drawEnemy(a, cx, cy);
  }
  for (const e of G.enemies) {
    if (e.type !== 'boss' || e.jump <= 0) continue;
    const x = Math.round(e.jx - cx), y = Math.round(e.jy - cy) + 4, rad = 40;
    ctx.globalAlpha = 0.35 + 0.35 * Math.abs(Math.sin(ANIM * 14));
    ctx.fillStyle = '#ff4d5a';
    for (let i = 0; i < 64; i++) { const a = (i / 64) * TAU; ctx.fillRect(Math.round(x + Math.cos(a) * rad), Math.round(y + Math.sin(a) * rad * 0.6), 1, 1); }
    ctx.globalAlpha = 1;
  }
  for (const s of G.shots) {
    const x = Math.round(s.x - cx), y = Math.round(s.y - cy);
    ctx.fillStyle = '#140c1c'; ctx.fillRect(x - 2, y - 2, 5, 5);
    ctx.fillStyle = '#c8e05a'; ctx.fillRect(x - 1, y - 1, 3, 3);
    ctx.fillStyle = '#f4ffc0'; ctx.fillRect(x, y - 1, 1, 1);
  }
  for (const s of G.slashes) drawSlash(s, cx, cy);
  for (const r of G.rings) {
    const p = r.t / r.dur, rad = r.max * p, n = Math.ceil(rad * 4);
    ctx.globalAlpha = 1 - p; ctx.fillStyle = '#f6efff';
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU; ctx.fillRect(Math.round(r.x + Math.cos(a) * rad - cx), Math.round(r.y + Math.sin(a) * rad * 0.6 - cy), 1, 1); }
    ctx.globalAlpha = 1;
  }
  for (const p of G.parts) {
    ctx.globalAlpha = Math.min(1, 2 * (1 - p.t / p.dur));
    ctx.fillStyle = p.col;
    ctx.fillRect(Math.round(p.x - cx), Math.round(p.y - cy), p.s, p.s);
  }
  ctx.globalAlpha = 1;
  drawLight(cx, cy, false);
  // leuchtende Augen im Dunkeln
  for (const e of G.enemies) {
    if (!e.aggro || e.dormant || e.dead) continue;
    if (Math.hypot(e.x - P.x, e.y - P.y) < 70 || !explAt(e.x, e.y)) continue;
    const x = Math.round(e.x - cx), y = Math.round(e.y - cy) - (e.type === 'boss' ? 16 : 7) - Math.round(e.z || 0);
    ctx.fillStyle = '#ff4d5a';
    ctx.fillRect(x - 2, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1);
  }
  for (const f of G.floaters) {
    const p = f.t / f.dur;
    ctx.globalAlpha = p > 0.7 ? (1 - p) / 0.3 : 1;
    drawText(ctx, f.text, f.x - cx, f.y - cy - p * 16, f.col, f.sc);
  }
  ctx.globalAlpha = 1;
  // Pfeil zur Treppe, wenn sie schon entdeckt, aber außer Sicht ist
  const s = M.stairs;
  if (M.explored[s.ty * M.W + s.tx] && !G.sealed) {
    const x = s.x - cx, y = s.y - cy, m = 14;
    const top = Math.round(88 / V.sc), bot = vh - Math.round(150 / V.sc);
    if (x < m || x > vw - m || y < top || y > bot) {
      const ox = vw / 2, oy = vh * 0.47, a = Math.atan2(y - oy, x - ox);
      const ex = clamp(ox + Math.cos(a) * vw, m, vw - m), ey = clamp(oy + Math.sin(a) * vh, top, bot);
      ctx.save(); ctx.translate(Math.round(ex), Math.round(ey)); ctx.rotate(a);
      ctx.fillStyle = '#140c1c'; ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(-5, -6); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#8be35f'; ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-4, -4); ctx.lineTo(-4, 4); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
  if (G.flash > 0) { ctx.fillStyle = 'rgba(255,40,60,' + G.flash * 0.45 + ')'; ctx.fillRect(0, 0, vw, vh); }
  if (G.state === 'play' && G.timeLeft < 30) {
    const a = 0.12 + Math.sin(ANIM * (G.timeLeft < 10 ? 12 : 6)) * 0.08;
    ctx.fillStyle = 'rgba(255,30,50,' + a + ')';
    ctx.fillRect(0, 0, vw, 4); ctx.fillRect(0, vh - 4, vw, 4); ctx.fillRect(0, 0, 4, vh); ctx.fillRect(vw - 4, 0, 4, vh);
  }
}

function renderTitle() {
  const t = ANIM * 0.08, mw = M.W * TS, mh = M.H * TS;
  V.cx = mw / 2 - V.w / 2 + Math.cos(t) * mw * 0.28;
  V.cy = mh / 2 - V.h / 2 + Math.sin(t * 1.3) * mh * 0.22;
  const cx = Math.round(V.cx), cy = Math.round(V.cy);
  drawMapLayer(cx, cy);
  drawLight(cx, cy, true);
}

function drawMini() {
  if (!M || G.state === 'title') return;
  if (mcv.width !== M.W || mcv.height !== M.H || !miniImg) {
    mcv.width = M.W; mcv.height = M.H;
    miniImg = mctx.createImageData(M.W, M.H);
    mcv.style.height = Math.round((80 * M.H) / M.W) + 'px';
    M.dirty = true;
  }
  if (M.dirty) {
    const d = miniImg.data;
    for (let i = 0; i < M.W * M.H; i++) {
      const o = i * 4;
      if (!M.explored[i]) { d[o + 3] = 0; continue; }
      if (M.tiles[i] === T_FLOOR) { d[o] = 96; d[o + 1] = 80; d[o + 2] = 110; } else { d[o] = 44; d[o + 1] = 34; d[o + 2] = 54; }
      d[o + 3] = 255;
    }
    M.dirty = false;
  }
  mctx.putImageData(miniImg, 0, 0);
  const s = M.stairs;
  if (M.explored[s.ty * M.W + s.tx]) { mctx.fillStyle = G.sealed ? '#ff4d5a' : '#8be35f'; mctx.fillRect(s.tx - 1, s.ty - 1, 3, 3); }
  mctx.fillStyle = '#ffd23f';
  for (const c of M.chests) if (!c.open && M.explored[c.ty * M.W + c.tx]) mctx.fillRect(c.tx, c.ty, 1, 1);
  for (const c of G.pickups) if (c.kind === 'crate') mctx.fillRect((c.x / TS) | 0, (c.y / TS) | 0, 2, 2);
  if (P && ((ANIM * 3) | 0) % 2 === 0) { mctx.fillStyle = '#ffffff'; mctx.fillRect(((P.x / TS) | 0) - 1, ((P.y / TS) | 0) - 1, 2, 2); }
}
