// Up in the clouds — only the star unicorn can fly her here (tap her when she walks along). She flies where she is
// tapped. Clouds bounce when she flies into them and rain a little when tapped (fly under the rain and a rainbow
// appears), the sleepy moon yawns, a bear waves from a balloon and throws confetti, birds scatter, and the stars she
// catches become coins (a few a day). A tap on the ground far below flies her home. Nothing can go wrong.
import * as Q from './quest.js';
import * as ART from './art.js';
export const meta = { id: 'wolken', title: 'In de wolken' };

export function open(root, api) {
  const { PX, sfx, state } = api;
  const LW = 240, LH = 130, st = api.pixelStage(root, LW, LH), ctx = st.ctx;
  const px = (c, col, X, Y, w = 1, h = 1) => { c.fillStyle = col; c.fillRect(Math.round(X), Math.round(Y), w, h); };
  const who = state.extra.who === 'fenna' ? 'fenna' : 'anna';
  const look = (state.extra.power && state.extra.power.look) || state.uni;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const me = { x: 50, y: 70, tx: 50, ty: 70, face: 1 }, parts = [], trail = [];
  const clouds = [[40, 34, 1], [120, 24, 1.3], [196, 44, 1], [86, 70, .9], [170, 86, 1.1]].map(([x, y, s]) => ({ x, y, s, squash: 0, rain: 0 }));
  const stars = [], birds = [...Array(5)].map((_, i) => ({ x: 150 + i * 9, y: 60 + (i % 2) * 5, vx: 0, vy: 0, scare: 0, ph: i }));
  const moon = { x: 216, y: 18, awake: 0 }, balloon = { x: -20, y: 56, wave: 0 }, drops = [];
  let rainbow = 0, caught = 0, starT = 0;
  const near = (o, x, y, r) => Math.hypot(o.x - x, o.y - y) < r;
  function pop(x, y, n = 6, cols = PX.RAINBOW) { for (let k = 0; k < n; k++) parts.push({ x, y, vx: rnd(-35, 35), vy: rnd(-40, 5), g: 50, life: rnd(.6, 1.2), col: cols[k % cols.length] }); }

  function tap(p) {
    if (p.y > LH - 10) { sfx.whoosh(); me.ty = LH + 30; me.tx = p.x; setTimeout(() => api.close(), 800); return; }     // the ground far below: home
    if (near(moon, p.x, p.y, 12)) { if (moon.awake <= 0) sfx.purr(); moon.awake = 2.4; return; }
    if (near({ x: balloon.x, y: balloon.y - 10 }, p.x, p.y, 16)) { balloon.wave = 1.5; sfx.tada(); pop(balloon.x, balloon.y, 14); return; }
    for (const c of clouds) if (Math.abs(p.x - c.x) < 18 * c.s && Math.abs(p.y - c.y) < 8 * c.s) { c.squash = 1; c.rain = 2.5; sfx.boing(); return; }
    me.tx = Math.max(12, Math.min(LW - 12, p.x)); me.ty = Math.max(20, Math.min(LH - 16, p.y)); sfx.click();
  }
  st.canvas.addEventListener('pointerdown', e => tap(st.toLocal(e)));

  function step(dt, t) {
    const dx = me.tx - me.x, dy = me.ty - me.y, d = Math.hypot(dx, dy), v = Math.min(d, dt * 70);
    if (d > .5) { me.x += dx / d * v; me.y += dy / d * v; if (Math.abs(dx) > 1) me.face = dx > 0 ? 1 : -1; }
    if (Math.random() < dt * 20) trail.push({ x: me.x - me.face * 12, y: me.y - 6 + rnd(-3, 3), life: .6, col: PX.RAINBOW[Math.floor(t * 10) % 6] });
    for (const c of clouds) { if (c.squash > 0) c.squash = Math.max(0, c.squash - dt * 2.5); if (c.rain > 0) { c.rain -= dt; if (Math.random() < dt * 30) drops.push({ x: c.x + rnd(-14, 14) * c.s, y: c.y + 6, vy: 60 }); }
      if (near(c, me.x, me.y - 8, 14 * c.s) && c.squash <= 0) { c.squash = .8; sfx.boing(); me.ty = Math.min(LH - 16, me.y + 12); } }
    for (let i = drops.length - 1; i >= 0; i--) { const r = drops[i]; r.y += r.vy * dt; if (Math.abs(r.x - me.x) < 10 && Math.abs(r.y - (me.y - 10)) < 8 && rainbow <= 0) { rainbow = 4; sfx.sparkle(); } if (r.y > LH) drops.splice(i, 1); }
    if (rainbow > 0) rainbow -= dt;
    // stars drift by now and then; catching them makes coins (three a day, after that they just sparkle)
    if ((starT -= dt) < 0 && stars.length < 4) { starT = rnd(1.5, 3); stars.push({ x: LW + 6, y: rnd(16, LH - 30), ph: rnd(0, 6) }); }
    for (let i = stars.length - 1; i >= 0; i--) { const s = stars[i]; s.x -= dt * 22; if (near(s, me.x, me.y - 8, 12)) { stars.splice(i, 1); caught++; sfx.chime(caught % 8); pop(s.x, s.y, 7, ['#FFD43B', '#FFF3A8']); if (caught % 4 === 0 && Q.giftOnce('ster' + caught / 4, 'munt')) { sfx.tada(); pop(me.x, me.y - 20, 10, ['#FFD43B']); } continue; } if (s.x < -8) stars.splice(i, 1); }
    for (const b of birds) { const hx = 150 + Math.sin(t * .4) * 40 + b.ph * 7, hy = 64 + Math.sin(t * .7 + b.ph) * 8;
      if (near(b, me.x, me.y - 8, 16) && b.scare <= 0) { const a = Math.atan2(b.y - me.y, b.x - me.x); b.vx = Math.cos(a) * 80; b.vy = Math.sin(a) * 80 - 20; b.scare = 1.3; }
      if (b.scare > 0) { b.scare -= dt; b.x += b.vx * dt; b.y += b.vy * dt; } else { b.x += (hx - b.x) * dt * 1.5; b.y += (hy - b.y) * dt * 1.5; } }
    if (moon.awake > 0) moon.awake -= dt;
    balloon.x += dt * 7; if (balloon.x > LW + 30) balloon.x = -30; if (balloon.wave > 0) balloon.wave -= dt;
  }

  function cloud(c) { const sq = Math.sin(c.squash * Math.PI) * .25, w = 18 * c.s * (1 + sq), h = 7 * c.s * (1 - sq);
    ctx.fillStyle = c.rain > 0 ? '#E3EAF5' : '#FFFFFF'; for (const [ox, oy, r] of [[-.6, .2, .55], [0, -.2, .8], [.6, .1, .6]]) { ctx.beginPath(); ctx.ellipse(c.x + ox * w, c.y + oy * h, r * w * .7, r * h * 1.4, 0, 0, 7); ctx.fill(); }
    px(ctx, '#2B1E3A', c.x - 5, c.y - 1, 1, 2); px(ctx, '#2B1E3A', c.x + 4, c.y - 1, 1, 2); if (c.squash > .1) px(ctx, '#FF9EC7', c.x - 1, c.y + 2, 3, 2); }
  function draw(t) {
    for (let Y = 0; Y < LH; Y++) px(ctx, PX.mix('#9FD8F5', '#FFE3EC', Y / LH), 0, Y, LW, 1);
    for (let X = 0; X < LW; X++) { const h = 6 + Math.sin(X * .05) * 3 + Math.sin(X * .13) * 1.5; px(ctx, '#9BD8A6', X, LH - h, 1, h); }                              // the land, far below
    for (let k = 0; k < 6; k++) px(ctx, ['#FF7EB6', '#FFD43B', '#4DABF7'][k % 3], (k * 41 + 12) % LW, LH - 4 - (k % 2), 2, 2);
    if (rainbow > 0) { ctx.globalAlpha = Math.min(1, rainbow); PX.RAINBOW.forEach((c, k) => { ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(LW / 2, LH + 20, 110 - k * 3, Math.PI, 0); ctx.stroke(); }); ctx.globalAlpha = 1; }
    // moon: asleep, until she taps it
    { const X = moon.x, Y = moon.y; ctx.fillStyle = '#FFF3A8'; ctx.beginPath(); ctx.arc(X, Y, 10, 0, 7); ctx.fill(); ctx.fillStyle = '#FFE48A'; ctx.beginPath(); ctx.arc(X + 3, Y + 3, 3, 0, 7); ctx.fill();
      if (moon.awake > 0) { px(ctx, '#2B1E3A', X - 5, Y - 3, 2, 2); px(ctx, '#2B1E3A', X + 2, Y - 3, 2, 2); const o = moon.awake > 1.2 ? Math.round(Math.sin((2.4 - moon.awake) * 2.6) * 3) + 1 : 1; px(ctx, '#C0567A', X - 2, Y + 2, 4, o); }
      else { px(ctx, '#2B1E3A', X - 6, Y - 2, 3, 1); px(ctx, '#2B1E3A', X + 2, Y - 2, 3, 1); px(ctx, '#C0567A', X - 1, Y + 3, 2, 1); const z = (t * .6) % 1; ctx.globalAlpha = 1 - z; PX.drawSprite(ctx, ART.zzz(), X - 14, Y - 6 - z * 10, 1); ctx.globalAlpha = 1; } }
    for (const c of clouds) cloud(c);
    for (const r of drops) px(ctx, '#6CC6F0', r.x, r.y, 1, 3);
    for (const s of stars) PX.drawSprite(ctx, PX.star(), s.x, s.y + 4 + Math.round(Math.sin(t * 4 + s.ph) * 2), 1);
    for (const b of birds) { const up = Math.floor(t * 8 + b.ph) % 2; px(ctx, '#3D2B4F', b.x - 3, b.y - (up ? 1 : 0), 3, 1); px(ctx, '#3D2B4F', b.x + 1, b.y - (up ? 1 : 0), 3, 1); px(ctx, '#3D2B4F', b.x, b.y, 1, 1); }
    // hot-air balloon with a bear in the basket
    { const X = balloon.x, Y = balloon.y + Math.sin(t) * 2; PX.RAINBOW.forEach((c, k) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(X, Y - 22, 13 - k * 2, 14, 0, 0, 7); ctx.fill(); });
      px(ctx, '#8A5A3B', X - 6, Y - 9, 1, 8); px(ctx, '#8A5A3B', X + 5, Y - 9, 1, 8); px(ctx, '#B5823F', X - 6, Y - 2, 12, 6); px(ctx, '#C9773F', X - 3, Y - 6, 6, 5); px(ctx, '#2B1E3A', X - 2, Y - 5, 1, 1); px(ctx, '#2B1E3A', X + 1, Y - 5, 1, 1); px(ctx, '#C9773F', X - 4, Y - 7, 2, 2); px(ctx, '#C9773F', X + 2, Y - 7, 2, 2);
      if (balloon.wave > 0) px(ctx, '#C9773F', X + 4, Y - 9 - Math.round(Math.abs(Math.sin(t * 14)) * 3), 2, 4); }
    for (const p of trail) { ctx.globalAlpha = Math.max(0, p.life / .6); px(ctx, p.col, p.x, p.y, 2, 2); } ctx.globalAlpha = 1;
    const bob = Math.sin(t * 2.5) * 2, uni = ART.uniSprite(look, 'w1', false, { baby: true }), kid = PX.kidSprite(who, 'idle', t % 3 > 2.9, Q.wearing(who));
    { const flap = Math.sin(t * 9), wx = me.x - me.face * 2, wy = me.y + bob - 20; for (let k = 0; k < 4; k++) { const len = 9 - k * 2, up = Math.round(flap * (3 + k)); px(ctx, k % 2 ? '#FFFFFF' : '#E3EAF5', wx - me.face * (k * 2), wy - k * 2 - up, me.face * -len || -len, 2); } }   // little wings, flapping
    PX.drawSprite(ctx, me.face < 0 ? PX.flipX(kid) : kid, me.x - me.face * 5, me.y + bob - 13, 2); PX.drawSprite(ctx, me.face < 0 ? PX.flipX(uni) : uni, me.x, me.y + bob, 2);
    for (const p of parts) { ctx.globalAlpha = Math.min(1, p.life * 2); px(ctx, p.col, p.x, p.y, 2, 2); } ctx.globalAlpha = 1;
  }
  st.loop((dt, t) => {
    step(dt, t);
    for (let i = trail.length - 1; i >= 0; i--) { trail[i].life -= dt; if (trail[i].life <= 0) trail.splice(i, 1); }
    for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; if (p.life <= 0) parts.splice(i, 1); }
    draw(t);
  });
  sfx.whoosh();
  if (new URLSearchParams(location.search).has('debug')) window.__wolk = { me, moon, clouds, balloon, stars, birds, caught: () => caught, rainbow: () => rainbow, tap: (x, y) => tap({ x, y }) };
  return () => { st.destroy(); if (window.__wolk) delete window.__wolk; };
}
