// Under the sea — only the sea unicorn can take her here (tap her when she walks along, near the water). She swims where
// she is tapped. Everything down here answers a touch, always the same way: the fish turn and follow her, the octopus
// squirts ink and hides, the pufferfish puffs up, the clam opens (its pearl goes into her bag once a day), the chest
// pops open (a coin once a day), the turtle waves. A tap on the surface brings her back up. Nothing can go wrong.
import * as ART from './art.js';
import * as Q from './quest.js';
export const meta = { id: 'zee', title: 'Onder de zee' };

export function open(root, api) {
  const { PX, sfx, state } = api;
  const LW = 240, LH = 130, SAND = 114, st = api.pixelStage(root, LW, LH), ctx = st.ctx;
  const px = (c, col, X, Y, w = 1, h = 1) => { c.fillStyle = col; c.fillRect(Math.round(X), Math.round(Y), w, h); };
  const who = state.extra.who === 'fenna' ? 'fenna' : 'anna';
  const look = (state.extra.power && state.extra.power.look) || state.uni;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const me = { x: 60, y: 60, tx: 60, ty: 60, face: 1 };
  const parts = [], bubbles = [];
  const fishCol = ['#FFD43B', '#FF9E6B', '#69DB7C', '#FF7EB6', '#8FD3FF', '#B9A3F0'];
  const fish = [...Array(8)].map((_, i) => ({ x: 150 + rnd(-20, 20), y: 40 + rnd(-12, 12), vx: 0, vy: 0, col: fishCol[i % 6], ph: i * .9, scare: 0 }));
  let school = { x: 160, y: 42, follow: 0 };
  const octo = { x: 196, y: SAND - 16, ink: 0, hide: 0 }, puffer = { x: 104, y: 74, puff: 0, ph: 0 }, clam = { x: 132, y: SAND - 3, open: 0, pearl: false };
  const chest = { x: 26, y: SAND - 2, open: 0 }, turtle = { x: -30, y: 28, wave: 0 }, inks = [];
  const weeds = [12, 48, 84, 160, 176, 222].map((x, i) => ({ x, h: 14 + (i * 7) % 12, push: 0 }));

  const near = (o, x, y, r) => Math.hypot(o.x - x, o.y - y) < r;
  function pop(x, y, n = 6, col) { for (let k = 0; k < n; k++) parts.push({ x, y, vx: rnd(-30, 30), vy: rnd(-40, -10), life: rnd(.5, 1), col: col || PX.RAINBOW[k % 6] }); }
  function tap(p) {
    if (p.y < 9) { sfx.splash(); me.ty = -10; me.tx = p.x; setTimeout(() => api.close(), 700); return; }      // the surface: back up
    if (near(octo, p.x, p.y, 13) && octo.hide <= 0) { octo.ink = 1; octo.hide = 2.6; sfx.whoosh(); for (let k = 0; k < 9; k++) inks.push({ x: octo.x + rnd(-6, 6), y: octo.y - 4 + rnd(-6, 4), r: rnd(3, 6), life: rnd(1.4, 2.2) }); return; }
    if (near(puffer, p.x, p.y, 10)) { if (puffer.puff < .5) sfx.boing(); puffer.puff = 1; return; }
    if (near(clam, p.x, p.y, 10)) {
      if (clam.open > .5 && clam.pearl) { clam.pearl = false; if (Q.giftOnce('parel', 'diamant')) { sfx.tada(); pop(clam.x, clam.y - 6, 10, '#FFFFFF'); } return; }
      clam.open = 1; clam.pearl = !Q.gotToday('parel'); sfx.pop(); if (!clam.pearl) for (let k = 0; k < 5; k++) bubbles.push({ x: clam.x + rnd(-3, 3), y: clam.y - 4, r: rnd(1, 2.5) });
      return;
    }
    if (near(chest, p.x, p.y, 12)) { if (chest.open <= 0) { chest.open = 1; sfx.door(); if (Q.giftOnce('kist', 'munt')) { sfx.chime(4); pop(chest.x, chest.y - 10, 8, '#FFD43B'); chest.coin = 1; } for (let k = 0; k < 6; k++) bubbles.push({ x: chest.x + rnd(-6, 6), y: chest.y - 8, r: rnd(1, 3) }); } return; }
    if (near(turtle, p.x, p.y, 14)) { turtle.wave = 1.2; sfx.sparkle(); bubbles.push({ x: turtle.x + 10, y: turtle.y - 3, r: 4, ring: true }); return; }
    if (near(school, p.x, p.y, 20)) { school.follow = 6; sfx.chime(2); return; }                                    // the fish come along for a while
    me.tx = Math.max(10, Math.min(LW - 10, p.x)); me.ty = Math.max(14, Math.min(SAND - 8, p.y)); sfx.bubble();
  }
  st.canvas.addEventListener('pointerdown', e => tap(st.toLocal(e)));

  function step(dt, t) {
    const dx = me.tx - me.x, dy = me.ty - me.y, d = Math.hypot(dx, dy), v = Math.min(d, dt * 55);
    if (d > .5) { me.x += dx / d * v; me.y += dy / d * v; if (Math.abs(dx) > 1) me.face = dx > 0 ? 1 : -1; if (Math.random() < dt * 8) bubbles.push({ x: me.x - me.face * 10, y: me.y - 18, r: rnd(.8, 2) }); }
    // the school: drifts about, scatters when she swims into it, comes along when tapped
    if (school.follow > 0) { school.follow -= dt; school.x += (me.x - me.face * 24 - school.x) * dt * 1.5; school.y += (me.y - 8 - school.y) * dt * 1.5; }
    else { school.x = 160 + Math.sin(t * .3) * 40; school.y = 44 + Math.sin(t * .5) * 12; }
    for (const f of fish) {
      const hx = school.x + Math.cos(t * 1.3 + f.ph) * 12, hy = school.y + Math.sin(t * 1.7 + f.ph) * 7;
      if (near(f, me.x, me.y - 10, 16) && school.follow <= 0) { const a = Math.atan2(f.y - me.y + 10, f.x - me.x); f.vx = Math.cos(a) * 70; f.vy = Math.sin(a) * 70; if (f.scare <= 0) sfx.bubble(); f.scare = 1.2; }
      if (f.scare > 0) { f.scare -= dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 1 - dt * 2; f.vy *= 1 - dt * 2; }
      else { f.x += (hx - f.x) * dt * 2; f.y += (hy - f.y) * dt * 2; }
      f.dir = (hx - f.x) + (f.vx || 0) * (f.scare > 0 ? 1 : 0) >= 0 ? 1 : -1; f.y = Math.max(12, Math.min(SAND - 6, f.y));
    }
    if (octo.hide > 0) octo.hide -= dt; if (puffer.puff > 0) puffer.puff = Math.max(0, puffer.puff - dt * .35); puffer.ph += dt;
    if (clam.open > 0 && !clam.pearl) clam.open = Math.max(0, clam.open - dt * .4);
    if (chest.open > 0) chest.open = Math.max(0, chest.open - dt * .12); if (chest.coin > 0) chest.coin = Math.max(0, chest.coin - dt * .8);
    turtle.x += dt * 9; if (turtle.x > LW + 40) turtle.x = -40; if (turtle.wave > 0) turtle.wave -= dt;
    for (const w of weeds) { if (Math.abs(w.x - me.x) < 10 && me.y > SAND - w.h - 20) w.push = Math.min(1, w.push + dt * 4); else w.push = Math.max(0, w.push - dt); }
    for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; b.y -= dt * (b.ring ? 14 : 22); b.x += Math.sin(t * 4 + i) * dt * 6; if (b.ring) b.r += dt * 2; if (b.y < 8) bubbles.splice(i, 1); }
    for (let i = inks.length - 1; i >= 0; i--) { const k = inks[i]; k.life -= dt; k.r += dt * 4; k.y -= dt * 3; if (k.life <= 0) inks.splice(i, 1); }
  }

  /* ---------- drawing ---------- */
  const sprFish = col => PX.gridSprite(9, 5, (x, y) => { const body = ((x - 3.5) / 3.5) ** 2 + ((y - 2) / 2.3) ** 2 <= 1, tail = x >= 7 && Math.abs(y - 2) <= x - 7; return x === 1 && y === 1 ? '#2B1E3A' : body ? (y === 3 ? PX.mix(col, '#FFFFFF', .4) : col) : tail ? PX.mix(col, '#2B1E3A', .15) : null; }, { key: 'zfish' + col });
  function scene(t) {
    for (let Y = 0; Y < LH; Y++) px(ctx, PX.mix('#5EC4F0', '#1D4E9E', Math.min(1, Y / SAND)), 0, Y, LW, 1);
    ctx.globalAlpha = .12; for (let k = 0; k < 5; k++) { const X = (k * 53 + Math.sin(t * .4 + k) * 8) % LW; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(X, 0); ctx.lineTo(X + 10, 0); ctx.lineTo(X + 34, SAND); ctx.lineTo(X + 18, SAND); ctx.fill(); } ctx.globalAlpha = 1;   // light from above
    for (let X = 0; X < LW; X += 2) px(ctx, (X / 2) % 5 ? '#BEEBFF' : '#FFFFFF', X, 2 + Math.round(Math.sin(t * 2 + X * .2)), 2, 1);                       // the surface
    px(ctx, '#E9C98A', 0, SAND, LW, LH - SAND); px(ctx, '#D4B070', 0, SAND, LW, 1); for (let k = 0; k < 26; k++) px(ctx, k % 3 ? '#D9B877' : '#FFB3CC', (k * 37) % LW, SAND + 3 + (k * 5) % 12, 2, 1);
    PX.drawSprite(ctx, ART.starfish(), 70, LH - 6, 1); PX.drawSprite(ctx, ART.shell(2), 214, LH - 4, 1);
    for (const w of weeds) for (let y = 0; y < w.h; y++) px(ctx, y % 4 < 2 ? '#3FAF6A' : '#5DC88A', w.x + Math.sin(t * 1.6 + y * .4 + w.x) * (1 + y * .08) + w.push * y * .5, SAND - y, 3, 1);
  }
  function draw(t) {
    scene(t);
    // rock and octopus
    px(ctx, '#8B90A4', octo.x - 16, SAND - 8, 32, 8); px(ctx, '#B4B9C8', octo.x - 12, SAND - 11, 24, 4); px(ctx, '#DCE0EA', octo.x - 8, SAND - 11, 8, 1);
    if (octo.hide <= 0 || octo.hide < .4) {
      const Y = octo.y - (octo.hide > 0 ? 0 : Math.abs(Math.sin(t * 2)) * 2);
      ctx.fillStyle = '#FF7E9E'; ctx.beginPath(); ctx.arc(octo.x, Y - 6, 7, Math.PI, 0); ctx.fill(); px(ctx, '#FF7E9E', octo.x - 7, Y - 6, 14, 4);
      for (let k = 0; k < 4; k++) px(ctx, '#FF5E86', octo.x - 7 + k * 4 + Math.round(Math.sin(t * 4 + k)), Y - 2, 2, 4);
      px(ctx, '#2B1E3A', octo.x - 4, Y - 8, 2, 2); px(ctx, '#2B1E3A', octo.x + 2, Y - 8, 2, 2); px(ctx, '#FFFFFF', octo.x - 4, Y - 8, 1, 1); px(ctx, '#FFFFFF', octo.x + 2, Y - 8, 1, 1);
    } else if (octo.hide < 1.2) { px(ctx, '#FF7E9E', octo.x + 9, SAND - 13, 5, 3); px(ctx, '#2B1E3A', octo.x + 11, SAND - 13, 1, 1); }   // peeking out
    for (const k of inks) { ctx.globalAlpha = Math.min(.8, k.life * .6); ctx.fillStyle = '#3D2B4F'; ctx.beginPath(); ctx.arc(k.x, k.y, k.r, 0, 7); ctx.fill(); } ctx.globalAlpha = 1;
    // clam
    { const o = clam.open, X = clam.x, Y = clam.y; px(ctx, '#D9CCFF', X - 9, Y - 3, 18, 3); if (o > .2) { px(ctx, '#FFB3CC', X - 7, Y - 4, 14, 1); if (clam.pearl) { px(ctx, '#FFFFFF', X - 2, Y - 7, 4, 4); px(ctx, '#E3EAF5', X, Y - 5, 2, 2); } }
      const lift = Math.round(o * 8); px(ctx, '#B9A3F0', X - 9, Y - 6 - lift, 18, 3); for (let k = 0; k < 4; k++) px(ctx, '#9B72E8', X - 7 + k * 4, Y - 6 - lift, 1, 3); }
    // chest
    { const X = chest.x, Y = chest.y, o = chest.open > 0; px(ctx, '#8A5A3B', X - 11, Y - 9, 22, 9); px(ctx, '#B5823F', X - 10, Y - 8, 20, 7); px(ctx, '#FFD43B', X - 1, Y - 7, 2, 3);
      if (o) { px(ctx, '#8A5A3B', X - 11, Y - 18, 22, 3); px(ctx, '#FFD43B', X - 8, Y - 10, 16, 2); } else px(ctx, '#8A5A3B', X - 11, Y - 12, 22, 3);
      if (chest.coin > 0) PX.drawSprite(ctx, ART.coin(), X, Y - 14 - (1 - chest.coin) * 20, 1); }
    // turtle
    { const X = turtle.x, Y = turtle.y + Math.sin(t) * 2; ctx.fillStyle = '#5DB35A'; ctx.beginPath(); ctx.ellipse(X, Y, 10, 6, 0, Math.PI, 0); ctx.fill(); px(ctx, '#3F8A4A', X - 10, Y, 20, 2);
      for (let k = 0; k < 3; k++) px(ctx, '#8BD48A', X - 6 + k * 5, Y - 4, 3, 2); px(ctx, '#A6E39A', X + 10, Y - 4, 6, 4); px(ctx, '#2B1E3A', X + 13, Y - 3, 1, 1);
      const fl = turtle.wave > 0 ? Math.round(Math.sin(t * 16) * 3) : Math.round(Math.sin(t * 3)); px(ctx, '#A6E39A', X + 3, Y + 2 + fl, 5, 2); px(ctx, '#A6E39A', X - 9, Y + 2 - fl, 4, 2); }
    // pufferfish
    { const r = 4 + puffer.puff * 6, X = puffer.x + Math.sin(puffer.ph * .7) * 6, Y = puffer.y + Math.sin(puffer.ph) * 3; ctx.fillStyle = '#FFC94D'; ctx.beginPath(); ctx.arc(X, Y, r, 0, 7); ctx.fill();
      if (puffer.puff > .3) for (let k = 0; k < 10; k++) { const a = k / 10 * 6.28; px(ctx, '#E0A020', X + Math.cos(a) * (r + 1), Y + Math.sin(a) * (r + 1), 1, 1); }
      px(ctx, '#2B1E3A', X + r * .4, Y - r * .3, 1 + (puffer.puff > .3), 1 + (puffer.puff > .3)); px(ctx, '#FF9E6B', X + r - 1, Y + 1, 2, 1); px(ctx, '#FFE8A8', X - r * .5, Y + r * .3, r * .8, 1); px(ctx, '#E0A020', X - r - 3, Y - 1, 3, 3); }
    for (const f of fish) { const s = sprFish(f.col); PX.drawSprite(ctx, f.dir > 0 ? PX.flipX(s) : s, f.x, f.y + 3, 1); }
    // her, on the sea unicorn, swimming
    const bob = Math.sin(t * 3) * 1.5, X = me.x, Y = me.y + bob, uni = ART.uniSprite(look, Math.floor(t * 4) % 2 ? 'w1' : 'w2', false, { baby: true }), kid = PX.kidSprite(who, 'idle', t % 3 > 2.9, Q.wearing(who));
    PX.drawSprite(ctx, me.face < 0 ? PX.flipX(kid) : kid, X - me.face * 5, Y - 13, 2); PX.drawSprite(ctx, me.face < 0 ? PX.flipX(uni) : uni, X, Y, 2);
    for (const b of bubbles) { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(Math.round(b.x), Math.round(b.y), b.r, 0, 7); ctx.stroke(); }
    for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= 1 / 60; p.x += p.vx / 60; p.y += p.vy / 60; if (p.life <= 0) { parts.splice(i, 1); continue; } ctx.globalAlpha = Math.min(1, p.life * 2); px(ctx, p.col, p.x, p.y, 2, 2); ctx.globalAlpha = 1; }
  }
  st.loop((dt, t) => { step(dt, t); draw(t); });
  sfx.splash();
  if (new URLSearchParams(location.search).has('debug')) window.__zee = { me, octo, puffer, clam, chest, turtle, school, fish, tap: (x, y) => tap({ x, y }) };
  return () => { st.destroy(); if (window.__zee) delete window.__zee; };
}
