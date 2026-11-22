// De Stal — take care of your own unicorn: feed, brush, bath, play, sleep, and recolour it.
export const meta = { id: 'stal', title: 'De Stal' };

export function open(root, api) {
  const { PX, sfx, speak, state, save } = api;
  const LW = 160, LH = 120, S = 3;
  const st = api.pixelStage(root, LW, LH);
  const ctx = st.ctx;

  /* ---------- extra sprites ---------- */
  const brushArt = PX.sprite(['......bb', '.....bb.', 'pppppb..', 'pppppp..', 'wwwwww..', 'w.w.w...'], { b: '#A0704E', p: '#FF7EB6', w: '#FFF6E3' });
  const ballArt = PX.gridSprite(9, 9, (x, y) => { const d = Math.hypot(x - 4, y - 4); if (d > 4.4) return null; if (x - y > 2 && x - y < 5) return '#FFFFFF'; return d < 2 && x < 4 && y < 4 ? '#FF9A9A' : (x + y > 9 ? '#D63F5C' : '#FF5E7A'); });
  const zArt = PX.sprite(['zzzz', '..z.', '.z..', 'zzzz'], { z: '#FFFFFF' });
  const bubbleArt = PX.gridSprite(5, 5, (x, y) => { const d = Math.hypot(x - 2, y - 2); return d <= 2.4 ? (d > 1.4 ? '#BFE8FF' : (x === 1 && y === 1 ? '#FFFFFF' : null)) : null; }, { outline: false });
  const crumbArt = PX.gridSprite(2, 2, () => '#C98A4B', { outline: false });
  const mudCol = '#8B5E3C', mudCol2 = '#6E4630';
  const tubArt = PX.gridSprite(56, 14, (x, y) => { if (y < 2) return '#CFEFFF'; const inset = y > 10 ? (y - 10) : 0; if (x < inset || x > 55 - inset) return null; if (y === 4 || y === 10) return '#5E3A24'; return x % 7 === 0 ? '#8A5A3B' : '#A97450'; });
  const foods = [PX.apple(), PX.carrot()];

  /* ---------- background (barn) ---------- */
  let bg = null;
  function paintBg() {
    const c = document.createElement('canvas'); c.width = LW; c.height = LH; const x = c.getContext('2d');
    const r = PX.rng(7); const px = (col, X, Y, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(X, Y, w, h); };
    px('#B8744E', 0, 0, LW, LH);
    for (let X = 0; X < LW; X += 10) { px('#9A5C3C', X, 0, 1, 92); px('#C9875E', X + 1, 0, 1, 92); }
    for (let k = 0; k < 120; k++) px(r() < .5 ? '#A9663F' : '#C58259', Math.floor(r() * LW), Math.floor(r() * 90), 1, 2);
    px('#6E4024', 0, 0, LW, 8); px('#8A5232', 0, 1, LW, 1); for (let X = 4; X < LW; X += 20) px('#5A321C', X, 2, 2, 2);
    px('#6E4024', 0, 8, LW, 2);
    // window
    const night = state.night; px('#5A321C', 14, 18, 34, 28); px(night ? '#1C2150' : '#9ED8F5', 17, 21, 28, 22);
    if (night) { px('#FFE38A', 36, 24, 5, 5); px('#1C2150', 38, 23, 4, 4); [[20, 25], [26, 35], [32, 30], [42, 38]].forEach(([a, b]) => px('#FFFFFF', a, b)); }
    else { px('#FFFFFF', 21, 28, 9, 3); px('#FFFFFF', 23, 26, 5, 2); px('#FFE38A', 38, 24, 5, 5); px('#7BC86C', 17, 39, 28, 4); }
    px('#5A321C', 30, 21, 2, 22); px('#5A321C', 17, 31, 28, 2); px('#7A4A30', 12, 46, 38, 3);
    // horseshoe + name plank
    px('#5A321C', 118, 16, 34, 12); px('#E9C46A', 119, 17, 32, 10); for (let k = 0; k < 4; k++) px(PX.RAINBOW[k + 1], 124 + k * 6, 20, 4, 4);
    const hs = PX.gridSprite(11, 11, (X, Y) => { const d = Math.hypot(X - 5, Y - 4); return (d >= 3 && d <= 5 && Y <= 8) ? (Y % 3 === 0 ? '#E8E8F0' : '#B8BCCB') : null; }); x.drawImage(hs, 128, 32);
    // hay pile & bucket
    for (let Y = 70; Y < 96; Y++) { const half = (Y - 70) * 1.3; for (let X = 0; X < 24 + half; X++) px(((X + Y * 3) % 5 === 0) ? '#C9A23F' : ((X * 7 + Y) % 11 === 0 ? '#FFF1A8' : '#E9C46A'), X, Y); }
    // floor
    px('#E2B861', 0, 92, LW, LH - 92); px('#7A4A30', 0, 92, LW, 2);
    for (let k = 0; k < 220; k++) { const X = Math.floor(r() * LW), Y = 94 + Math.floor(r() * 26); px(r() < .5 ? '#C99A45' : '#F2D37E', X, Y, 2 + Math.floor(r() * 3), 1); }
    px('#7A5236', 138, 80, 16, 14); px('#A0704E', 139, 81, 14, 12); px('#5E3A24', 138, 84, 16, 1); px('#5E3A24', 138, 90, 16, 1); px('#E8484A', 142, 78, 4, 3); px('#FF8C42', 147, 77, 3, 4);
    bg = c;
  }
  paintBg();

  /* ---------- unicorn ---------- */
  const UX = 82, UY = 106;
  let uniArt, uniSleep, bodyPix = [];
  function buildUni() {
    uniArt = api.uniArt ? api.uniArt(false) : PX.unicorn(state.uni); uniSleep = api.uniArt ? api.uniArt(true) : PX.unicorn(state.uni, 'idle', true);
    const d = uniArt.getContext('2d').getImageData(0, 0, uniArt.width, uniArt.height).data; const [R, G, B] = PX.rgb(state.uni.body); bodyPix = [];
    for (let y = 0; y < uniArt.height; y++) for (let x = 0; x < uniArt.width; x++) { const i = (y * uniArt.width + x) * 4; if (d[i + 3] && d[i] === R && d[i + 1] === G && d[i + 2] === B) bodyPix.push([x, y]); }
  }
  buildUni();
  const uniBox = () => ({ x: UX - uniArt.width * S / 2, y: UY - uniArt.height * S, w: uniArt.width * S, h: uniArt.height * S });
  // callers pass spots on the grown sprite (28x22); a foal is a smaller sprite, so named spots scale with it. Mud is stored in real pixels.
  const toScreen = (sx, sy) => { const b = uniBox(); return [b.x + sx * S + S / 2, b.y + sy * S + S / 2]; };
  const spot = (sx, sy) => toScreen(sx * uniArt.width / 28, sy * uniArt.height / 22);
  let mud = [];
  function addMud(n) {
    mud = []; const pool = bodyPix.slice();
    for (let k = 0; k < n && pool.length; k++) { const i = Math.floor(Math.random() * pool.length); const p = pool.splice(i, 1)[0]; if (mud.some(m => Math.abs(m[0] - p[0]) + Math.abs(m[1] - p[1]) < 4)) { k--; continue; } mud.push(p); }
  }
  addMud(6);

  /* ---------- state ---------- */
  const done = new Set(); let mode = null; let sleeping = false, sleepT = 0, jumpT = 0, squash = 0, happyT = 0, blinkT = 3, time = 0, brushing = false, brushMoves = 0;
  let food = null, ball = null, tub = null, parts = [], cursor = null, rewarding = false;
  const add = p => parts.push(Object.assign({ vx: 0, vy: -12, life: 1, g: 0 }, p));
  function sparkle(x, y, n = 6, art) { for (let i = 0; i < n; i++) add({ x: x + (Math.random() - .5) * 20, y: y + (Math.random() - .5) * 14, vx: (Math.random() - .5) * 30, vy: -10 - Math.random() * 25, art: art || (i % 3 ? PX.sparkle(i % 2 ? '#FFF6D0' : '#FFB3CC') : PX.heart()), life: 1 }); }
  function count(id, msg) {
    if (msg) speak(msg);
    if (done.has(id)) return; done.add(id); sfx.chime(done.size);
    if (done.size >= 5 && !rewarding) {
      rewarding = true; happyT = 2.5; const [hx, hy] = spot(14, 8); for (let k = 0; k < 4; k++) setTimeout(() => sparkle(hx, hy, 8), k * 250);
      setTimeout(() => { api.reward(state.uni.name + ' is helemaal blij!').then(() => { done.clear(); rewarding = false; addMud(5); }); }, 1600);
    }
  }

  /* ---------- tools ---------- */
  const tb = api.toolbar(root, [
    { id: 'eten', label: 'Eten', icon: PX.apple(), onClick: () => doFeed() },
    { id: 'borstel', label: 'Borstelen', icon: brushArt, onClick: () => setMode('borstel') },
    { id: 'bad', label: 'In bad', icon: PX.duck(), onClick: () => doBath() },
    { id: 'spelen', label: 'Spelen', icon: ballArt, onClick: () => doPlay() },
    { id: 'slapen', label: 'Slapen', icon: PX.moon(), onClick: () => doSleep() },
    { id: 'kleur', label: 'Kleuren', icon: PX.rainbow(), onClick: () => toggleColors() },
  ]);
  const colors = document.createElement('div'); colors.className = 'stal-colors'; colors.hidden = true; root.appendChild(colors);
  const style = document.createElement('style'); style.textContent = `
    .stal-colors{display:flex;flex-direction:column;gap:8px;align-items:center}
    .stal-colors .lab{font-weight:700;color:#6B5A7D;font-size:.95rem}
    .stal-colors .sws{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
    .stal-colors .sw{width:44px;height:44px;border:3px solid #2B1E3A;border-radius:6px;cursor:pointer;box-shadow:0 3px 0 #2B1E3A}
    .stal-colors .sw[aria-pressed="true"]{outline:3px solid #FF5E9C;outline-offset:2px}
    .stal-colors .chip{font-family:inherit;font-weight:700;font-size:1rem;padding:8px 12px;border:3px solid #2B1E3A;border-radius:6px;background:#fff;cursor:pointer;box-shadow:0 3px 0 #2B1E3A}
    .stal-colors .chip[aria-pressed="true"]{background:#FFD166}`;
  root.appendChild(style);
  function setMode(m) {
    if (sleeping) wake();
    mode = mode === m ? null : m; tb.setActive(mode); cursor = null;
    if (mode === 'borstel') { brushMoves = 0; speak(mud.length ? 'Borstel de modder weg! Wrijf over ' + state.uni.name + '.' : 'Borstel ' + state.uni.name + ' maar lekker!'); }
  }
  function doFeed() {
    if (sleeping) wake(); tb.setActive('eten'); mode = null; if (food) return;
    const art = foods[Math.floor(Math.random() * 2)]; const [mx, my] = spot(24, 10);
    food = { art, x: LW + 10, y: 40, tx: mx + 6, ty: my, t: 0, eaten: 0 }; sfx.whoosh(); speak(art === foods[0] ? 'Een appel!' : 'Een wortel!');
  }
  function doBath() {
    if (sleeping) wake(); tb.setActive('bad'); mode = null; tub = { t: 0 }; sfx.splash(); speak('Splash! Lekker in bad!');
  }
  function doPlay() {
    if (sleeping) wake(); tb.setActive('spelen'); mode = null;
    ball = { x: -6, y: 70, vx: 55, vy: -40, kicks: 0, jumps: 0 }; sfx.boing(); speak('Vang de bal!');
  }
  function doSleep() {
    if (sleeping) return wake(); tb.setActive('slapen'); mode = null; sleeping = true; sleepT = 0; sfx.lullaby(); speak('Slaap lekker, ' + state.uni.name + '. Tik als ze wakker mag worden.');
  }
  function wake() {
    if (!sleeping) return; sleeping = false; tb.setActive(null); sfx.sparkle(); const [hx, hy] = spot(18, 6); sparkle(hx, hy, 6);
    if (sleepT > 2) count('slapen', 'Goedemorgen, ' + state.uni.name + '! Goed geslapen!'); else speak('Goedemorgen!');
  }
  function toggleColors() {
    if (!colors.hidden) { colors.hidden = true; tb.setActive(null); return; }
    tb.setActive('kleur'); renderColors(); colors.hidden = false; speak('Kies de kleuren van je eenhoorn!'); colors.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function renderColors() {
    const row = (lab, key, list) => `<div class="lab">${lab}</div><div class="sws">${list.map(([n, v]) => `<button class="sw" data-k="${key}" data-v="${v}" data-n="${n}" aria-label="${n}" aria-pressed="${state.uni[key] === v}" style="background:${v === 'rainbow' ? 'linear-gradient(90deg,#FF6B6B,#FFA94D,#FFD43B,#69DB7C,#4DABF7,#9775FA)' : v}"></button>`).join('')}</div>`;
    const names = ['Sterretje', 'Wolkje', 'Glitter', 'Pluisje', 'Bloem', 'Regenboog'];
    colors.innerHTML = row('Kleur', 'body', PX.UNI_BODY) + row('Manen', 'mane', PX.UNI_MANE) + row('Hoorn', 'horn', PX.UNI_HORN) +
      `<div class="lab">Naam</div><div class="sws">${names.map(n => `<button class="chip" data-name="${n}" aria-pressed="${state.uni.name === n}">${n}</button>`).join('')}</div>`;
    colors.querySelectorAll('.sw').forEach(b => b.onclick = () => {
      state.uni[b.dataset.k] = b.dataset.v; save(); buildUni(); addMud(Math.min(mud.length, 6));
      colors.querySelectorAll(`.sw[data-k="${b.dataset.k}"]`).forEach(x => x.setAttribute('aria-pressed', x === b)); sfx.sparkle(); speak(b.dataset.n + '!');
      const [hx, hy] = spot(14, 10); sparkle(hx, hy, 8); jumpT = 1; count('kleur');
    });
    colors.querySelectorAll('.chip').forEach(b => b.onclick = () => { state.uni.name = b.dataset.name; save(); colors.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', x === b)); sfx.pop(); speak('Hoi! Ik heet ' + state.uni.name + '!'); jumpT = 1; });
  }

  /* ---------- pointer ---------- */
  const cv = st.canvas;
  function hitUni(p) { const b = uniBox(); return p.x > b.x + 6 && p.x < b.x + b.w - 6 && p.y > b.y + 6 && p.y < b.y + b.h; }
  function brushAt(p) {
    cursor = p; if (!hitUni(p)) return;
    brushMoves++; if (brushMoves % 4 === 0) { sfx.brush(); add({ x: p.x, y: p.y, vy: -15, art: PX.sparkle('#FFF6D0'), life: .7 }); }
    for (let i = mud.length - 1; i >= 0; i--) { const [mx, my] = toScreen(...mud[i]); if (Math.hypot(mx - p.x, my - p.y) < 9) { mud.splice(i, 1); sfx.sparkle(); sparkle(mx, my, 4); if (!mud.length) count('borstel', 'Wat ben je mooi en schoon!'); } }
    if (!mud.length && brushMoves > 40 && !done.has('borstel')) count('borstel', 'Wat een zachte manen!');
    if (brushMoves % 30 === 0) sfx.purr();
  }
  const onDown = e => {
    const p = st.toLocal(e); cv.setPointerCapture(e.pointerId);
    if (sleeping) { if (sleepT > 1) wake(); return; }
    if (mode === 'borstel') { brushing = true; brushAt(p); return; }
    if (ball && Math.hypot(ball.x - p.x, ball.y - p.y) < 14) { ball.vx = (ball.x < UX ? 1 : -1) * (50 + Math.random() * 30); ball.vy = -70; ball.kicks++; sfx.boing(); return; }
    if (hitUni(p)) { jumpT = 1; sfx.sparkle(); sparkle(p.x, p.y, 5); speak(['Hihihi!', 'Ik vind jou lief!', 'Kriebel kriebel!'][Math.floor(Math.random() * 3)]); }
  };
  const onMove = e => { if (mode === 'borstel') { const p = st.toLocal(e); if (brushing || e.pointerType === 'mouse') { cursor = p; if (brushing) brushAt(p); } } };
  const onUp = () => { brushing = false; };
  cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);

  /* ---------- loop ---------- */
  st.loop((dt) => {
    time += dt; blinkT -= dt; if (blinkT < -.15) blinkT = 2 + Math.random() * 3;
    if (sleeping) sleepT += dt;
    ctx.drawImage(bg, 0, 0);
    // unicorn
    if (jumpT > 0) jumpT = Math.max(0, jumpT - dt * 2.2);
    if (happyT > 0) { happyT -= dt; if (jumpT <= 0) jumpT = 1; }
    if (squash > 0) squash = Math.max(0, squash - dt * 4);
    const jy = Math.round(Math.sin((1 - jumpT) * Math.PI) * 16 * (jumpT > 0 ? 1 : 0));
    const bob = sleeping ? Math.round(Math.sin(time * 1.5)) : (Math.sin(time * 3) > .6 ? -1 : 0);
    const art = sleeping || blinkT < 0 ? uniSleep : uniArt; const b = uniBox();
    ctx.fillStyle = 'rgba(60,30,20,.25)'; ctx.fillRect(b.x + 14, UY - 3, b.w - 28, 4);
    const sh = squash > 0 ? Math.round(squash * 4) : 0;
    ctx.drawImage(art, Math.round(b.x), Math.round(b.y - jy + bob + sh), b.w, b.h - sh);
    for (const [sx, sy] of mud) { const [mx, my] = toScreen(sx, sy); const y = my - jy + bob; ctx.fillStyle = mudCol; ctx.fillRect(Math.round(mx - 4), Math.round(y - 3), 7, 6); ctx.fillStyle = mudCol2; ctx.fillRect(Math.round(mx - 1), Math.round(y), 3, 2); ctx.fillRect(Math.round(mx + 3), Math.round(y + 2), 2, 2); }
    // tub + bubbles
    if (tub) {
      tub.t += dt; ctx.drawImage(tubArt, Math.round(UX - 29), UY - 15);
      if (Math.random() < dt * 14) { add({ x: UX - 30 + Math.random() * 60, y: UY - 12, vy: -18 - Math.random() * 18, vx: (Math.random() - .5) * 8, art: bubbleArt, life: 1.4 }); if (Math.random() < .4) sfx.bubble(); }
      if (tub.t > 1.2 && mud.length) { const m = mud.pop(); const [mx, my] = toScreen(...m); sparkle(mx, my, 3); tub.t = .9; }
      if (tub.t > 3.6) { tub = null; tb.setActive(null); count('bad', 'Helemaal schoon! Wat ruik je lekker.'); }
    }
    // food
    if (food) {
      food.t += dt;
      if (food.t < .9) { const k = food.t / .9; food.x += (food.tx - food.x) * Math.min(1, dt * 6); food.y = 40 + (food.ty - 40) * k - Math.sin(k * Math.PI) * 25; }
      else { const step = Math.floor((food.t - .9) / .45); if (step > food.eaten && food.eaten < 3) { food.eaten = step; sfx.munch(); squash = 1; for (let i = 0; i < 4; i++) add({ x: food.x, y: food.y, vx: (Math.random() - .5) * 40, vy: -20, g: 120, art: crumbArt, life: .8 }); } if (food.t > 2.6) { food = null; tb.setActive(null); count('eten', ['Mmm, lekker!', 'Smikkel smikkel!', 'Nog een keer? Mmm!'][Math.floor(Math.random() * 3)]); } }
      if (food) { const fa = food.art; const cut = food.eaten / 3; if (cut < 1) ctx.drawImage(fa, 0, 0, fa.width, fa.height * (1 - cut), Math.round(food.x - fa.width), Math.round(food.y - fa.height), fa.width * 2, Math.round(fa.height * 2 * (1 - cut))); }
    }
    // ball
    if (ball) {
      ball.vy += 160 * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt;
      if (ball.y > UY - 5) { ball.y = UY - 5; ball.vy = -Math.abs(ball.vy) * .72; if (Math.abs(ball.vy) > 25) sfx.click(); if (Math.abs(ball.vy) < 30) ball.vy = -85; }
      if (ball.x < 5) { ball.x = 5; ball.vx = Math.abs(ball.vx); } if (ball.x > LW - 5) { ball.x = LW - 5; ball.vx = -Math.abs(ball.vx); }
      if (Math.abs(ball.x - UX) < 22 && jumpT <= 0 && ball.y > 60) { jumpT = 1; ball.jumps++; sfx.boing(); if (ball.jumps === 3) count('spelen', 'Hoera! Spelen is leuk!'); }
      ctx.drawImage(ballArt, Math.round(ball.x - 9), Math.round(ball.y - 9), 18, 18);
      if (ball.jumps >= 6) { ball = null; tb.setActive(null); }
    }
    // particles
    for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= dt; p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.life <= 0) { parts.splice(i, 1); continue; } ctx.globalAlpha = Math.min(1, p.life * 2); ctx.drawImage(p.art, Math.round(p.x - p.art.width / 2), Math.round(p.y - p.art.height / 2)); ctx.globalAlpha = 1; }
    // sleep overlay
    if (sleeping) {
      ctx.fillStyle = `rgba(20,24,70,${Math.min(.55, sleepT * .5)})`; ctx.fillRect(0, 0, LW, LH);
      const [hx, hy] = spot(20, 3);
      for (let k = 0; k < 3; k++) { const ph = (time * .5 + k / 3) % 1; ctx.globalAlpha = 1 - ph; ctx.drawImage(zArt, Math.round(hx + ph * 18 + k * 2), Math.round(hy - ph * 30), zArt.width * (1 + k * .5) | 0, zArt.height * (1 + k * .5) | 0); } ctx.globalAlpha = 1;
    }
    // brush cursor
    if (mode === 'borstel' && cursor) ctx.drawImage(brushArt, Math.round(cursor.x - 4), Math.round(cursor.y - 14), brushArt.width * 2, brushArt.height * 2);
    // hearts meter
    for (let k = 0; k < 5; k++) { const h = PX.heart(k < done.size ? '#FF5E9C' : '#D9C9CF'); ctx.drawImage(h, 4 + k * 12, LH - 14); }
  });

  speak('Welkom in de stal! Hier woont ' + state.uni.name + '. Zorg goed voor je eenhoorn: geef eten, borstel de modder weg, of doe haar in bad!');
  return () => { st.destroy(); cv.removeEventListener('pointerdown', onDown); };
}
