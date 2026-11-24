// ---------- ZYNIKA (Ansagen) ----------
const Zyn = {
  q: [], cur: null, shown: 0, hold: 0, lastAmb: -99, talk: 0, el: null, txt: null, face: null, faceState: '',
  say(text, prio) {
    if (!text) return;
    prio = prio == null ? 1 : prio;
    if (prio === 0) {
      if (this.cur || this.q.length || ANIM - this.lastAmb < 9) return;
      this.lastAmb = ANIM;
    }
    if (prio >= 2) { this.q.unshift(text); this.cur = null; Voice.stop(); }
    else this.q.push(text);
    if (this.q.length > 3) this.q.length = 3;
  },
  setFace(f) { if (this.faceState !== f) { this.faceState = f; this.face.src = sprURL(f); } },
  hide() { this.el.classList.add('off'); },
  clear() { this.q = []; this.cur = null; this.hide(); Voice.stop(); },
  update(dt) {
    if (!this.cur) {
      if (!this.q.length) { this.hide(); return; }
      this.cur = this.q.shift(); this.shown = 0; this.hold = 1.5 + this.cur.length * 0.03; this.maxHold = 14;
      this.txt.textContent = '';
      Voice.say(this.cur);
    }
    this.el.classList.remove('off');
    if (this.shown < this.cur.length) {
      this.shown = Math.min(this.cur.length, this.shown + dt * 48);
      this.txt.textContent = this.cur.slice(0, this.shown | 0);
      this.talk += dt;
      this.setFace(((this.talk * 9) | 0) % 2 ? 'zyn_b' : 'zyn_a');
    } else {
      this.setFace('zyn_a');
      this.hold -= dt; this.maxHold -= dt;
      if ((this.hold <= 0 && !Voice.speaking) || this.maxHold <= 0) this.cur = null;
    }
  },
};

const toastQ = [];
let toastBusy = 0;
function toast(icon, label, title, sub) {
  toastQ.push([icon, label, title, sub]);
  if (toastQ.length > 4) toastQ.shift();
}
function toastUpdate(dt) {
  if (toastBusy > 0) { toastBusy -= dt; return; }
  const t = toastQ.shift();
  if (!t) return;
  const box = $('#toasts');
  const d = document.createElement('div');
  d.className = 'toast';
  d.innerHTML = '<img src="' + sprURL(t[0]) + '" alt=""><div><b>' + esc(t[1]) + '</b><span>' + esc(t[2]) + '</span>' + (t[3] ? '<small>' + esc(t[3]) + '</small>' : '') + '</div>';
  box.innerHTML = '';
  box.appendChild(d);
  setTimeout(() => d.classList.add('out'), 2000);
  setTimeout(() => d.remove(), 2300);
  toastBusy = 2.3;
}

// ---------- HUD ----------
const HUDC = {};
function setT(id, v) { if (HUDC[id] !== v) { HUDC[id] = v; document.getElementById(id).textContent = v; } }
function setW(id, f) { const v = Math.round(clamp(f, 0, 1) * 1000) / 10 + '%'; if (HUDC[id] !== v) { HUDC[id] = v; document.getElementById(id).style.width = v; } }
function setC(el, cls, on) { const key = el.id + '.' + cls; if (HUDC[key] !== on) { HUDC[key] = on; el.classList.toggle(cls, on); } }
function hudUpdate(dt) {
  if (!P || G.state === 'title') return;
  setT('hpTxt', Math.ceil(P.hp) + '/' + P.maxHp);
  setW('hpFill', P.hp / P.maxHp);
  setT('lvTxt', 'LV ' + P.level);
  setW('xpFill', P.xp / P.xpNext);
  setT('timeTxt', fmtTime(G.timeLeft));
  setC($('#timer'), 'warn', G.timeLeft < 30 && G.state === 'play');
  setT('floorTxt', 'Etage ' + G.floor);
  const diff = G.viewers - G.vShow;
  G.vShow += diff * Math.min(1, dt * 4);
  if (Math.abs(diff) < 1) G.vShow = G.viewers;
  setT('viewTxt', fmt(G.vShow));
  const vt = $('#viewTxt');
  setC(vt, 'up', diff > 3); setC(vt, 'down', diff < -3);
  setT('goldTxt', fmt(P.gold));
  setT('potCnt', String(P.potions));
  setC($('#btnPot'), 'empty', P.potions <= 0);
  setT('boxCnt', String(P.boxes.length));
  setC($('#btnBox'), 'hide', P.boxes.length === 0 || G.state !== 'play');
  const icon = 'w' + P.weapon;
  if (HUDC.atkIcon !== icon) { HUDC.atkIcon = icon; $('#atkIcon').src = sprURL(icon); }
  const b = G.boss, showBoss = !!(b && !b.dead && b.aggro && G.state === 'play');
  setC($('#app'), 'bossy', showBoss);
  if (showBoss) { setT('bossName', b.name); setW('bossFill', b.hp / b.maxHp); }
}
const UI = {
  openedAt: 0,
  set(html, cls) {
    const s = $('#scr');
    s.className = cls == null ? 'dim' : cls;
    s.innerHTML = html;
    s.scrollTop = 0;
    this.openedAt = performance.now();
    const f = s.querySelector('[data-focus]') || s.querySelector('button');
    if (f && !('ontouchstart' in window)) { try { f.focus({ preventScroll: true }); } catch (e) { /* egal */ } }
  },
  clear() { const s = $('#scr'); s.innerHTML = ''; s.className = ''; },
  hud(on) {
    for (const id of ['hud', 'mini', 'pad', 'stick', 'atk', 'btnPot']) $('#' + id).classList.toggle('hide', !on);
    if (!on) { $('#btnBox').classList.add('hide'); Zyn.clear(); hideHints(); }
  },
};
function showHints() { G.hintT = 10; G.hintMoved = G.hintAtk = false; $('#hintL').classList.remove('hide'); $('#hintR').classList.remove('hide'); }
function hideHints() { G.hintT = 0; $('#hintL').classList.add('hide'); $('#hintR').classList.add('hide'); }
const img = (name, w, sc) => '<img src="' + sprURL(name, sc) + '" alt="" width="' + w + '">';

// ---------- Bildschirme ----------
function showTitle() {
  G.state = 'title';
  P = null;
  M = genMap(2); prerender(M); M.explored.fill(1);
  $('#fade').classList.remove('on');
  UI.hud(false);
  const save = store.get('tg.run', null);
  UI.set(
    '<div class="title">' +
      '<div class="logo"><span class="tag"><i class="dot"></i>LIVE</span><h1>TIEFGANG</h1><p>Die Dungeon-Show</p></div>' +
      '<div class="zq">' + img('zyn_a', 64) + '<p>' + esc(LINES.intro) + '</p></div>' +
      '<div class="menu">' +
        (save ? '<button class="b gold" data-a="cont" data-focus>Weiterspielen · Etage ' + save.floor + '</button>' : '') +
        '<button class="b" data-a="new">' + (save ? 'Neue Show starten' : 'Show starten') + '</button>' +
        '<div class="two"><button class="b alt" data-a="howto" data-v="title">So geht’s</button><button class="b alt" data-a="ach" data-v="title">Erfolge</button></div>' +
        '<div class="two"><button class="b alt" data-a="sound" data-v="title">Ton: ' + (Sfx.muted ? 'aus' : 'an') + '</button><button class="b alt" data-a="music" data-v="title">Musik: ' + (Sfx.music ? 'an' : 'aus') + '</button></div>' +
        '<button class="b alt" data-a="voice" data-v="title">Stimme: ' + Voice.label + '</button>' + voiceNote() +
      '</div>' +
      (META.best ? '<p class="rec">Rekord: Etage ' + META.best + ' · ' + fmt(META.bestViewers) + ' Zuschauer</p>' : '<p class="rec">Fortschritt wird nur in diesem Browser gespeichert.</p>') +
    '</div>', 'vig');
}
function voiceNote() {
  if (Voice.mode !== 'ki') return '';
  const s = Voice.st;
  const t = s.piper === 'loading' ? 'KI-Stimme wird geladen … ' + s.progress + ' % (einmalig, besser im WLAN)'
    : s.piper === 'ready' ? 'KI-Stimme bereit.' : s.piper === 'error' ? s.error : 'Lädt beim nächsten Antippen.';
  return '<p class="vnote" id="vnote">' + esc(t) + '</p>';
}
function refreshVoiceNote() { const n = document.getElementById('vnote'); if (n) n.outerHTML = voiceNote(); }
function showHowto(back) {
  UI.set(
    '<div class="panel"><h2>So geht’s</h2><ul class="how">' +
      '<li><b>Laufen:</b> Daumen links aufs Feld – dort erscheint der Joystick.</li>' +
      '<li><b>Angreifen:</b> rechte Bildschirmhälfte antippen oder gedrückt halten. Gezielt wird automatisch.</li>' +
      '<li><b>Ziel:</b> Finde die Treppe, bevor der Countdown abläuft – sonst stürzt die Etage ein. Die Karte oben rechts hilft.</li>' +
      '<li><b>Quote:</b> Kämpfe, Kombos und knappe Momente bringen Zuschauer. Wer rumsteht, verliert Publikum.</li>' +
      '<li><b>Sponsoren:</b> Ab bestimmten Zuschauerzahlen fallen Pakete vom Himmel. Drüberlaufen öffnet sie.</li>' +
      '<li><b>Erfolge</b> bringen Beutekisten. Öffnen über den Kisten-Knopf oder in der Werbepause.</li>' +
      '<li><b>Jede dritte Etage</b> wartet ein Boss. Die Treppe öffnet erst, wenn er erledigt ist.</li>' +
      '<li><b>Stimme:</b> ZYNIKA spricht ihre Ansagen. Im Menü wählst du zwischen Systemstimme, KI-Stimme (einmaliger Download, nur auf der GitHub-Seite) und aus.</li>' +
      '<li><b>Kein Ton?</b> Einmal ins Spiel tippen und am iPhone die Lautstärke prüfen. Musik und Effekte lassen sich im Menü getrennt abschalten.</li>' +
      '<li><b>Tastatur:</b> WASD oder Pfeile, Leertaste greift an, E trinkt, Q öffnet Kisten, P pausiert.</li>' +
    '</ul><div class="btns"><button class="b" data-a="back" data-v="' + back + '" data-focus>Zurück</button></div></div>');
}
function showAch(back) {
  const got = ACH.filter((a) => META.ach[a.id]).length;
  UI.set(
    '<div class="panel"><h2>Erfolge</h2><p class="sub">' + got + ' von ' + ACH.length + ' jemals freigeschaltet' + (G.run && back !== 'title' ? ' · diese Show: ' + G.achieved.size : '') + '</p><div class="achl">' +
      ACH.map((a) => '<div class="ach' + (META.ach[a.id] ? ' on' : '') + '">' + img(BOXI[a.tier], 32) + '<div><b>' + esc(a.name) + '</b><small>' + esc(a.desc) + '</small></div>' + (G.run && back !== 'title' && G.achieved.has(a.id) ? '<i>✓</i>' : '') + '</div>').join('') +
    '</div><div class="btns"><button class="b" data-a="back" data-v="' + back + '" data-focus>Zurück</button></div></div>');
}
function showPause() {
  if (G.state !== 'play') return;
  G.state = 'modal'; Input.reset();
  UI.set(
    '<div class="panel"><h2>Pause</h2><p class="sub">Etage ' + G.floor + ' · ' + fmt(G.viewers) + ' Zuschauer warten. Die Uhr steht.</p><div class="btns col">' +
      '<button class="b" data-a="resume" data-focus>Weiter</button>' +
      (P.boxes.length ? '<button class="b gold" data-a="boxes" data-v="play">Kisten öffnen (' + P.boxes.length + ')</button>' : '') +
      '<button class="b alt" data-a="ach" data-v="pause">Erfolge</button>' +
      '<button class="b alt" data-a="howto" data-v="pause">So geht’s</button>' +
      '<button class="b alt" data-a="sound" data-v="pause">Ton: ' + (Sfx.muted ? 'aus' : 'an') + '</button>' +
      '<button class="b alt" data-a="music" data-v="pause">Musik: ' + (Sfx.music ? 'an' : 'aus') + '</button>' +
      '<button class="b alt" data-a="voice" data-v="pause">Stimme: ' + Voice.label + '</button>' + voiceNote() +
      '<button class="b alt" data-a="giveup">Aufgeben</button>' +
    '</div></div>');
}
function showGiveup() {
  UI.set('<div class="panel"><h2>Wirklich aufgeben?</h2><p class="sub">Die Show endet, der Spielstand ist dann weg.</p><div class="btns"><button class="b alt" data-a="back" data-v="pause" data-focus>Nein, weiter</button><button class="b" data-a="quit">Ja, aufgeben</button></div></div>');
}
function resumeTo(ret) {
  if (G.perkQueue.length) { showPerk(ret); return; }
  if (ret === 'shop') { G.state = 'shop'; showShop(); return; }
  if (ret === 'over') { showGameOver(); return; }
  UI.clear(); Input.reset(); G.state = 'play';
}
function showPerk(ret) {
  const src = G.perkQueue[0];
  if (!src) { resumeTo(ret); return; }
  if (ret === 'play') G.state = 'modal';
  Input.reset();
  const avail = PERKS.filter((p) => !p.max || (P.perks[p.id] || 0) < p.max);
  G.perkChoices = shuffle(avail.slice()).slice(0, 3);
  G.perkRet = ret;
  if (src === 'level') Zyn.say(fill(pick(LINES.levelUp), { n: P.level }), 1);
  UI.set(
    '<div class="panel"><h2 class="pink">' + (src === 'level' ? 'Level ' + P.level + '!' : 'Bonus-Perk!') + '</h2><p class="sub">Such dir eine Verbesserung aus.</p><div class="cards">' +
      G.perkChoices.map((p) => '<button class="card" data-a="perk" data-v="' + p.id + '">' + img(p.icon, 40) + '<div><b>' + esc(p.name) + '</b><small>' + esc(p.desc) + (P.perks[p.id] ? ' · Stufe ' + (P.perks[p.id] + 1) : '') + '</small></div></button>').join('') +
    '</div></div>');
}
function choosePerk(id) {
  const p = PERK_BY_ID[id];
  if (!p || !G.perkQueue.length) return;
  G.perkQueue.shift();
  p.go(P);
  P.perks[id] = (P.perks[id] || 0) + 1;
  Sfx.play('levelup');
  resumeTo(G.perkRet || 'play');
}
function showBox(ret) {
  if (!P.boxes.length) { resumeTo(ret); return; }
  if (ret === 'play') { G.state = 'modal'; Input.reset(); }
  const t = P.boxes[0];
  G.boxRet = ret;
  UI.set(
    '<div class="panel center"><h2>' + TIER[t] + '-Kiste</h2><p class="sub">Noch ' + P.boxes.length + ' im Rucksack.</p>' +
      '<div class="boxbig">' + img(BOXI[t], 128, 8) + '</div>' +
      '<div class="btns"><button class="b gold" data-a="openBox" data-focus>Öffnen</button><button class="b alt" data-a="boxDone">Später</button></div></div>');
}
function openBox() {
  if (!P.boxes.length) return;
  const t = P.boxes.shift();
  const rew = rollBox(t);
  let weapon = null;
  for (const r of rew) { r.go(); if (r.weapon) weapon = r.t; }
  G.run.boxes++;
  if (G.run.boxes >= 10) unlock('kisten');
  Sfx.play('box');
  const line = weapon ? fill(LINES.weapon, { w: weapon }) : rew.some((r) => r.junk) ? LINES.junk : LINES.boxOpen[t];
  Voice.say(line);
  UI.set(
    '<div class="panel center"><h2>' + TIER[t] + '-Kiste</h2>' +
      '<div class="boxbig open">' + img(BOXI[t], 96, 8) + '</div>' +
      '<div class="rew">' + rew.map((r, i) => '<div style="animation-delay:' + i * 0.12 + 's">' + img(r.icon, 40) + '<div><b>' + esc(r.t) + '</b><small>' + esc(r.s) + '</small></div></div>').join('') + '</div>' +
      '<div class="zq small">' + img('zyn_b', 48) + '<p>' + esc(line) + '</p></div>' +
      '<div class="btns">' + (P.boxes.length ? '<button class="b gold" data-a="boxes" data-v="' + G.boxRet + '">Nächste Kiste (' + P.boxes.length + ')</button>' : '') +
      '<button class="b" data-a="boxDone" data-focus>Weiter</button></div></div>');
}
function showShop() {
  G.state = 'shop';
  UI.hud(false);
  const s = G.summary, o = G.offers;
  UI.set(
    '<div class="panel"><h2>Etage ' + s.floor + ' geschafft!</h2>' +
      '<dl class="stats"><dt>Restzeit</dt><dd>' + fmtTime(s.time) + '</dd><dt>Siege</dt><dd>' + s.kills + '</dd><dt>Gold auf der Etage</dt><dd>' + fmt(s.gold) + '</dd><dt>Abstiegs-Bonus</dt><dd>+' + fmt(s.bonus) + ' Zuschauer</dd><dt>Zuschauer jetzt</dt><dd>' + fmt(G.viewers) + '</dd></dl>' +
      (G.newAch.length ? '<div class="newach"><b>Neue Erfolge</b>' + G.newAch.map((a) => '<div>' + img(BOXI[a.tier], 24) + '<span>' + esc(a.name) + '</span><small>+ ' + TIER[a.tier] + '-Kiste</small></div>').join('') + '</div>' : '') +
      '<div class="ad"><span>Werbepause</span>präsentiert von <b>' + esc(o.sponsor.name) + '</b><small>„' + esc(o.sponsor.slogan) + '“</small></div>' +
      '<div class="cards">' + o.list.map((it, i) => {
        const can = !it.sold && it.ok() && P.gold >= it.p;
        return '<button class="card' + (it.sold ? ' sold' : '') + '" data-a="buy" data-v="' + i + '"' + (can ? '' : ' disabled') + '>' + img(it.icon, 40) + '<div><b>' + esc(it.t) + '</b><small>' + esc(it.s) + '</small></div><span class="price">' + (it.sold ? 'Gekauft' : img('coin', 16) + it.p) + '</span></button>';
      }).join('') + '</div>' +
      '<p class="wallet">Gold: <b>' + fmt(P.gold) + '</b> · Leben ' + Math.ceil(P.hp) + '/' + P.maxHp + ' · Tränke ' + P.potions + ' · ' + esc(WEAPONS[P.weapon].name) + '</p>' +
      '<div class="btns">' + (P.boxes.length ? '<button class="b gold" data-a="boxes" data-v="shop">Kisten öffnen (' + P.boxes.length + ')</button>' : '') +
      '<button class="b" data-a="next" data-focus>Weiter zu Etage ' + (G.floor + 1) + '</button></div></div>');
}
function buy(i) {
  const it = G.offers && G.offers.list[+i];
  if (!it || it.sold || !it.ok() || P.gold < it.p) return;
  P.gold -= it.p; it.go(); it.sold = true;
  Sfx.play('coin');
  showShop();
}
function showGameOver() {
  const o = G.over;
  if (!o) return;
  UI.hud(false);
  Voice.say(o.line);
  UI.set(
    '<div class="panel"><h2 class="pink">' + (o.reason === 'collapse' ? 'Eingestürzt!' : o.reason === 'quit' ? 'Aufgegeben' : 'Ausgeschieden!') + '</h2>' +
      '<div class="zq">' + img('zyn_a', 48) + '<p>' + esc(o.line) + '</p></div>' +
      '<dl class="stats"><dt>Erreichte Etage</dt><dd>' + o.floor + (o.newRec ? ' · Rekord!' : '') + '</dd><dt>Siege</dt><dd>' + G.run.kills + '</dd><dt>Höchste Quote</dt><dd>' + fmt(G.run.maxViewers) + '</dd><dt>Erfolge</dt><dd>' + G.achieved.size + '</dd><dt>Gold gesammelt</dt><dd>' + fmt(G.run.gold) + '</dd></dl>' +
      '<div class="btns"><button class="b" data-a="again" data-focus>Nochmal</button><button class="b alt" data-a="ach" data-v="over">Erfolge</button><button class="b alt" data-a="title">Zum Titel</button></div></div>');
}

const ACT = {
  new() { newRun(); },
  cont() { if (!loadRun()) newRun(); },
  howto(v) { showHowto(v || 'title'); },
  ach(v) { showAch(v || 'title'); },
  back(v) {
    if (v === 'pause') { G.state = 'play'; showPause(); }
    else if (v === 'shop') showShop();
    else if (v === 'over') showGameOver();
    else showTitle();
  },
  sound(v) { Sfx.toggle(); if (v === 'pause') { G.state = 'play'; showPause(); } else showTitle(); },
  music(v) { Sfx.toggleMusic(); if (v === 'pause') { G.state = 'play'; showPause(); } else showTitle(); },
  voice(v) {
    Voice.cycle(refreshVoiceNote);
    if (v === 'pause') { G.state = 'play'; showPause(); } else showTitle();
    if (Voice.mode !== 'off') setTimeout(() => Voice.say(Voice.mode === 'ki' && Voice.st.piper !== 'ready' ? 'Moment, ich mache mich hübsch. Bis dahin klinge ich so.' : 'Testansage. Hier spricht ZYNIKA.'), 300);
  },
  resume() { resumeTo('play'); },
  giveup() { showGiveup(); },
  quit() { gameOver('quit'); },
  boxes(v) { showBox(v); },
  openBox() { openBox(); },
  boxDone() { resumeTo(G.boxRet || 'play'); },
  perk(v) { choosePerk(v); },
  buy(v) { buy(v); },
  next() { nextFloor(); },
  again() { newRun(); },
  title() { showTitle(); },
};

// ---------- Eingabe ----------
const joy = { id: null, ox: 0, oy: 0 };
const atkIds = new Set();
const Input = {
  mx: 0, my: 0, keys: {}, atkTouch: false,
  get attack() { return this.atkTouch || !!this.keys.Space || !!this.keys.KeyJ || !!this.keys.KeyK; },
  vec() {
    const k = this.keys;
    const kx = (k.ArrowRight || k.KeyD ? 1 : 0) - (k.ArrowLeft || k.KeyA ? 1 : 0);
    const ky = (k.ArrowDown || k.KeyS ? 1 : 0) - (k.ArrowUp || k.KeyW ? 1 : 0);
    if (kx || ky) { const l = Math.hypot(kx, ky); return { x: kx / l, y: ky / l }; }
    return { x: this.mx, y: this.my };
  },
  reset() {
    this.mx = this.my = 0; this.atkTouch = false; this.keys = {};
    joy.id = null; atkIds.clear();
    stickHome();
    const a = $('#atk'); if (a) a.classList.remove('on');
  },
};
function stickHome() {
  const s = $('#stick');
  if (!s) return;
  s.classList.remove('on');
  s.style.left = ''; s.style.top = ''; s.style.bottom = '';
  $('#knob').style.transform = '';
}
function setupInput() {
  const pad = $('#pad'), stick = $('#stick'), knob = $('#knob'), atk = $('#atk');
  const R = 46;
  pad.addEventListener('pointerdown', (e) => {
    if (G.state !== 'play') return;
    e.preventDefault();
    Sfx.init(); Voice.unlock();
    if (e.clientX < window.innerWidth * 0.5) {
      if (joy.id !== null) return;
      joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY;
      stick.classList.add('on');
      stick.style.left = joy.ox + 'px'; stick.style.top = joy.oy + 'px'; stick.style.bottom = 'auto';
      knob.style.transform = '';
    } else {
      atkIds.add(e.pointerId);
      Input.atkTouch = true;
      atk.classList.add('on');
    }
    try { pad.setPointerCapture(e.pointerId); } catch (err) { /* egal */ }
  });
  pad.addEventListener('pointermove', (e) => {
    if (e.pointerId !== joy.id) return;
    e.preventDefault();
    let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy;
    let l = Math.hypot(dx, dy);
    if (l > R * 1.25) {
      const pull = l - R * 1.25;
      joy.ox += (dx / l) * pull; joy.oy += (dy / l) * pull;
      stick.style.left = joy.ox + 'px'; stick.style.top = joy.oy + 'px';
      dx = e.clientX - joy.ox; dy = e.clientY - joy.oy; l = Math.hypot(dx, dy);
    }
    const kl = Math.min(l, R), ux = l ? dx / l : 0, uy = l ? dy / l : 0;
    knob.style.transform = 'translate(' + (ux * kl).toFixed(1) + 'px,' + (uy * kl).toFixed(1) + 'px)';
    const m = Math.min(1, l / R);
    if (m < 0.18) { Input.mx = 0; Input.my = 0; } else { Input.mx = ux * m; Input.my = uy * m; }
  });
  const end = (e) => {
    if (e.pointerId === joy.id) { joy.id = null; Input.mx = 0; Input.my = 0; stickHome(); }
    if (atkIds.delete(e.pointerId) && atkIds.size === 0) { Input.atkTouch = false; atk.classList.remove('on'); }
  };
  pad.addEventListener('pointerup', end);
  pad.addEventListener('pointercancel', end);
  const btn = (id, fn) => $(id).addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); Sfx.init(); fn(); });
  btn('#btnPot', drinkPotion);
  btn('#btnBox', () => { if (G.state === 'play' && P.boxes.length) showBox('play'); });
  btn('#btnPause', () => { if (G.state === 'play') showPause(); });
  window.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'BUTTON' && (e.code === 'Space' || e.code === 'Enter') && G.state !== 'play') return;
    Input.keys[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (G.state === 'play') {
      if (e.code === 'KeyE') drinkPotion();
      if (e.code === 'KeyQ' && P.boxes.length) showBox('play');
      if (e.code === 'KeyP' || e.code === 'Escape') showPause();
    } else if (G.state === 'modal' && (e.code === 'KeyP' || e.code === 'Escape') && $('#scr [data-a="resume"]')) resumeTo('play');
    Sfx.init();
  });
  window.addEventListener('keyup', (e) => { Input.keys[e.code] = false; });
  window.addEventListener('blur', () => { Input.reset(); if (G.state === 'play') showPause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.state === 'play') showPause(); });
  $('#scr').addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]');
    if (!b || b.disabled) return;
    if (performance.now() - UI.openedAt < 280) return;
    Sfx.init(); Voice.unlock(); Sfx.play('click');
    const f = ACT[b.dataset.a];
    if (f) f(b.dataset.v);
  });
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));
}

// ---------- Hauptschleife ----------
let lastTs = 0;
function frame(ts) {
  let dt = lastTs ? (ts - lastTs) / 1000 : 0.016;
  lastTs = ts;
  if (dt > 0.05) dt = 0.05;
  if (dt < 0) dt = 0;
  ANIM += dt;
  try {
    if (G.state === 'play') step(dt);
    else if (G.state === 'trans' || G.state === 'over') stepFx(dt);
    if (G.state === 'title') renderTitle();
    else if (M && P) renderGame(dt);
    if (G.state === 'play' || G.state === 'trans' || G.state === 'over') Zyn.update(dt); else Zyn.hide();
    Sfx.setMusic(G.state === 'play' || G.state === 'modal' || G.state === 'shop' || G.state === 'trans', G.state === 'play' && G.timeLeft < 30);
    hudUpdate(dt);
    toastUpdate(dt);
    drawMini();
  } catch (err) {
    console.error(err);
  }
  requestAnimationFrame(frame);
}
function boot() {
  buildArt();
  $('#icHeart').src = sprURL('heart');
  $('#icGlass').src = sprURL('i_glass');
  $('#icEye').src = sprURL('i_eye');
  $('#icCoin').src = sprURL('coin');
  $('#potIcon').src = sprURL('potion');
  $('#boxIcon').src = sprURL('box_g');
  Zyn.el = $('#zyn'); Zyn.txt = $('#zynTxt'); Zyn.face = $('#zynFace');
  Zyn.setFace('zyn_a');
  setupCanvas();
  setupInput();
  showTitle();
  requestAnimationFrame(frame);
  window.__TG = { G, get P() { return P; }, get M() { return M; }, startFloor, unlock, giveXP, showBox, showShop, makeOffers, descend, gameOver, step, Input, bfs, los, boxHit, drink: drinkPotion };
}
boot();
