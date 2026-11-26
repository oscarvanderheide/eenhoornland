// The castle — behind the gate lies a walled garden under the evening sky, and in it the rainbow is asleep.
// Six closed flowers stand in the grass, one for every colour. Tap one and the unicorn trots over and touches it with her
// horn: it opens, sings its note, and its colour rises into the sky. When all six are open the rainbow is whole: that is
// the party (quest.js `bloom`, saved first, shown after). Nothing can go wrong, and what is open stays open.
// Then her family comes for her: a mama unicorn and the unicorns of earlier adventures slide down the rainbow, cuddle
// her, and everybody (the girl too) walks home over the rainbow; the world goes on at the meadow in the village, where
// she now lives and can be visited (state.extra.homeWalk, main.js -> world.homeArrive). So she is never just gone.
// After that the garden is a toy: every flower is a note, the dragon on the wall blows hearts.
// The golden door in the tower leads back into the castle hall (world-rooms.js), where the coins and the chest are now.
import * as ART from './art.js';
import * as Q from './quest.js';
export const meta = { id: 'kasteel', title: 'Kasteel' };

export function open(root, api) {
  const { PX, sfx, state } = api;
  const LW = 220, LH = 130, GY = 92, CX = 110, st = api.pixelStage(root, LW, LH), ctx = st.ctx;
  const px = (c, col, X, Y, w = 1, h = 1) => { c.fillStyle = col; c.fillRect(Math.round(X), Math.round(Y), w, h); };
  const who = state.extra.who === 'fenna' ? 'fenna' : 'anna', N = Q.BLOOMS, COLS = PX.RAINBOW;
  const withUni = Q.canRide();                                                    // she came riding; after the party the unicorn stays for as long as they are here
  const look = Object.assign({}, state.uni);

  /* ---------- the garden, painted once ---------- */
  const back = document.createElement('canvas'); back.width = LW; back.height = LH;
  {
    const x = back.getContext('2d'), r = PX.rng(77);
    for (let Y = 0; Y < GY; Y++) px(x, PX.mix('#2A2466', '#F29BC0', Math.pow(Y / GY, 1.7)), 0, Y, LW, 1);          // evening sky
    for (let k = 0; k < 46; k++) { const X = Math.floor(r() * LW), Y = Math.floor(r() * 44); px(x, r() < .3 ? '#FFE9A8' : '#FFFFFF', X, Y); if (r() < .2) { px(x, '#FFFFFF', X - 1, Y, 3, 1); px(x, '#FFFFFF', X, Y - 1, 1, 3); } }
    px(x, '#FFF3C4', 24, 10, 9, 9); px(x, '#FFF3C4', 23, 12, 11, 5); px(x, '#FFF3C4', 26, 9, 5, 11); px(x, '#F2DC9A', 28, 12, 2, 2); px(x, '#F2DC9A', 25, 15, 2, 1);   // moon
    const stone = (X0, Y0, w, h) => { px(x, '#CFC8E6', X0, Y0, w, h); for (let Y = Y0; Y < Y0 + h; Y += 6) { px(x, '#A9A1C8', X0, Y + 5, w, 1); for (let X = X0 + ((Y - Y0) / 6 % 2) * 6; X < X0 + w; X += 12) px(x, '#A9A1C8', X, Y, 1, 5); } };
    stone(0, 48, LW, GY - 48); for (let X = 2; X < LW; X += 12) stone(X, 43, 7, 5);                                // the garden wall with battlements
    for (const X0 of [0, LW - 30]) {                                                                              // two towers
      stone(X0, 20, 30, GY - 20); for (let k = 0; k < 13; k++) px(x, k % 2 ? '#7E6BD0' : '#9B8AE8', X0 - 3 + k, 19 - k, 36 - k * 2, 1); px(x, '#5E4A3A', X0 + 14, 0, 1, 8); px(x, '#FFD43B', X0 + 15, 1, 5, 3);
      px(x, '#3D2B6B', X0 + 11, 32, 8, 12); px(x, '#FFD48A', X0 + 12, 33, 6, 10); px(x, '#3D2B6B', X0 + 14, 33, 1, 10);
    }
    px(x, '#F7C548', 6, 64, 18, 28); px(x, '#F7C548', 8, 62, 14, 2); px(x, '#5A3A1E', 8, 66, 14, 26); px(x, '#3A2412', 8, 64, 14, 2); for (const [a, b] of [[10, 86], [14, 88], [18, 85], [12, 82], [17, 80]]) { px(x, '#FFD43B', a, b, 3, 3); px(x, '#FFF3A8', a, b, 1, 1); }   // the golden door to the treasure room
    for (const X0 of [48, 104, 160]) { px(x, '#8F88B5', X0 - 1, 57, 14, 23); px(x, '#3D2B6B', X0, 58, 12, 22); px(x, '#FFD48A', X0 + 1, 59, 10, 20); px(x, '#FFE9B8', X0 + 2, 60, 3, 8); px(x, '#3D2B6B', X0 + 5, 59, 1, 20); px(x, '#3D2B6B', X0 + 1, 68, 10, 1); }   // warm windows
    for (let k = 0; k < 150; k++) { const X = Math.floor(r() * LW), Y = 48 + Math.floor(r() * r() * 30); px(x, r() < .5 ? '#3E9A5C' : '#5DC88A', X, Y, 2, 2); if (r() < .12) px(x, '#FF9EC7', X, Y); }   // ivy with little roses
    for (let Y = GY; Y < LH; Y++) px(x, PX.mix('#4FAE6A', '#7BD489', (Y - GY) / (LH - GY)), 0, Y, LW, 1);          // the lawn
    for (let k = 0; k < 220; k++) { const X = Math.floor(r() * LW), Y = GY + 1 + Math.floor(r() * (LH - GY - 2)); px(x, r() < .5 ? '#3E9A5C' : '#A6E6A0', X, Y, 1, 2); }
    for (let k = 0; k < 26; k++) { const X = Math.floor(r() * LW), Y = GY + 3 + Math.floor(r() * (LH - GY - 6)); px(x, ['#FFFFFF', '#FFE08A', '#FFC8DD'][k % 3], X, Y, 2, 1); px(x, ['#FFFFFF', '#FFE08A', '#FFC8DD'][k % 3], X, Y - 1, 1, 3); }
    px(x, '#3E8E57', 0, GY, LW, 1);
  }
  // one canvas per colour band of the rainbow, so a band can grow from left to right
  const R0 = 72, BW = 5, bands = COLS.slice(0, N).map((col, i) => {
    const c = document.createElement('canvas'); c.width = R0 * 2; c.height = R0; const x = c.getContext('2d'), ro = R0 - i * BW, ri = ro - BW;
    for (let Y = 0; Y < R0; Y++) for (let X = 0; X < R0 * 2; X++) { const d = Math.hypot(X + .5 - R0, Y + .5 - R0); if (d <= ro && d > ri) px(x, d > ro - 1 ? PX.mix(col, '#FFFFFF', .35) : col, X, Y); }
    return c;
  });

  /* ---------- who and what is in the garden ---------- */
  const flowers = Array.from({ length: N }, (_, i) => ({ i, x: 35 + i * 30, y: 109 + (i % 2) * 4, open: Q.bloomed(i) ? 1 : 0, grow: Q.bloomed(i) ? 1 : 0, wig: 0, sing: 0 }));
  const hero = { x: 46, y: 125, to: 46, face: 1, hop: 0, step: 0, job: null };     // the unicorn (with the girl beside her), or the girl alone
  const dragon = { x: 196, y: 48, hop: 0 }, dragonArt = ART.dragon();
  const parts = [], flies = Array.from({ length: 9 }, (_, k) => ({ x: 20 + k * 22, y: 60 + (k * 37) % 40, p: k * 1.3 }));
  let room = 'tuin', fade = 0, time = 0, doors = 0, party = 0, whole = flowers.every(f => f.open), glow = whole ? 1 : 0;
  /* ---------- her family (only right after the party): a mama and the unicorns of earlier adventures ---------- */
  let home = -1, partied = false;
  const family = [{ look: { body: '#FFF6FB', mane: look.mane, horn: '#F7C548' }, big: true }].concat(Q.quest.herd.slice(0, -1).slice(-3).map(u => ({ look: u, big: false })))
    .map((f, k) => Object.assign(f, { k, x: -30, y: -30, face: 1, hop: 0, art: ART.uniSprite(f.look, 'idle', false, { baby: !f.big }), w1: ART.uniSprite(f.look, 'w1', false, { baby: !f.big }), w2: ART.uniSprite(f.look, 'w2', false, { baby: !f.big }) }));
  const RR = R0 - 3 * BW, arc = a => [CX + Math.cos(a) * RR, GY + Math.sin(a) * RR];   // the middle of the rainbow: a = PI is its left foot, 1.5 PI the top, 2 PI the right foot
  function stepHome(dt) {
    const t = home += dt;
    family.forEach((f, k) => {
      const t0 = k * .55;
      if (t < 2.6 + t0) {                                                          // whee, down the rainbow from the top to its left foot
        const u = Math.max(0, Math.min(1, (t - t0) / 1.6)), [x, y] = arc(Math.PI * (1.5 - .5 * u * u));
        f.x = x; f.y = Math.min(hero.y, y + 4); f.face = -1; f.move = u > 0 && u < 1; if (u > 0 && u < 1 && Math.random() < dt * 14) spark(f.x, f.y - 6, 1);
        if (u >= 1) { const goal = hero.x - 30 - k * 24; f.y = hero.y; f.face = goal > f.x ? 1 : -1; f.x += Math.sign(goal - f.x) * Math.min(Math.abs(goal - f.x), dt * 70); f.move = Math.abs(goal - f.x) > .5; }
      } else if (t < 6.2) {                                                        // a cuddle: hearts, everybody hops
        f.face = 1; f.move = false; if (Math.floor(t * 2.2 + k) !== Math.floor((t - dt) * 2.2 + k)) { f.hop = 1; if (k === 0) { heart(f.x + 14, f.y - 34); hero.hop = 1; sfx.chime(k + 2); } }
      } else {                                                                     // home together, over the rainbow: up from its left foot, over the top, away
        const u = Math.min(1, (t - 6.2 - k * .35) / 3.4), [x, y] = arc(Math.PI * (1 + Math.max(0, u)));
        if (u > 0) { f.x = x; f.y = y + 4; f.face = 1; f.move = true; }
      }
      if (f.hop > 0) f.hop = Math.max(0, f.hop - dt * 2.4);
    });
    if (t > 6.2) { const u = Math.min(1, (t - 7.6) / 3.4); if (u > 0) { const [x, y] = arc(Math.PI * (1 + u)); hero.x = hero.to = x; hero.y = y + 4; hero.face = 1; hero.step += dt; } else { hero.to = family[0].x; } }
    if (t > 9.6) fadeOut = Math.min(1, fadeOut + dt * .7);
    if (t > 11.2 && !closed) { closed = true; state.extra.homeWalk = Q.quest.cycle; api.save(); api.close(); }   // the world goes on at the meadow in the village
  }
  let fadeOut = 0, closed = false;
  function drawFamily() {
    if (home < 0) return;
    for (const f of family) {
      if (f.y < -20) continue; const lift = Math.round(Math.abs(Math.sin(f.hop * Math.PI)) * 7), fr = f.move ? (Math.floor(time * 7 + f.k) % 2 ? f.w1 : f.w2) : f.art;
      ctx.fillStyle = 'rgba(30,60,50,.25)'; if (f.y >= hero.y - 1) ctx.fillRect(Math.round(f.x - 12), f.y - 1, 24, 2);
      PX.drawSprite(ctx, fr, f.x, f.y - lift, 2, f.face < 0);
    }
  }
  const spark = (X, Y, n = 5, col = null) => { for (let k = 0; k < n; k++) parts.push({ x: X, y: Y, vx: (Math.random() - .5) * 46, vy: -18 - Math.random() * 34, life: .7 + Math.random() * .5, col: col || COLS[Math.floor(Math.random() * COLS.length)], g: 46 }); };
  const heart = (X, Y) => parts.push({ x: X, y: Y, vx: (Math.random() - .5) * 10, vy: -16, life: 1.3, art: PX.heart(), g: 0 });

  function wake(f) {
    const res = Q.bloom(f.i); f.open = 1; f.wig = 1; f.sing = 1; sfx.chime(f.i); spark(f.x, f.y - 18, 8, COLS[f.i]);
    if (res.whole) { whole = true; party = 7; setTimeout(() => sfx.tada(), 450); }
  }
  function tapFlower(f) {
    if (f.open) { f.wig = 1; f.sing = 1; sfx.chime(f.i); spark(f.x, f.y - 18, 3, COLS[f.i]); if (Math.abs(hero.x - f.x) < 60) hero.hop = Math.max(hero.hop, .6); return; }
    sfx.pop(); f.wig = .6; hero.job = f; hero.to = f.x - (withUni ? 17 : 10);        // she goes to it; it opens when she gets there
  }
  /* ---------- the treasure room ---------- */
  const FLOOR = 118, heapY = X => FLOOR - 6 - Math.max(0, 30 * Math.exp(-(((X - 150) / 52) ** 2)) + 9 * Math.exp(-(((X - 70) / 22) ** 2)));
  const vault = document.createElement('canvas'); vault.width = LW; vault.height = LH;
  {
    const x = vault.getContext('2d'), r = PX.rng(31);
    px(x, '#5B4A78', 0, 0, LW, LH); for (let Y = 0; Y < LH; Y += 8) { px(x, '#463861', 0, Y + 7, LW, 1); for (let X = (Y / 8 % 2) * 8; X < LW; X += 16) px(x, '#463861', X, Y, 1, 7); }
    for (const X0 of [70, 150]) for (let k = 0; k < 40; k++) { ctx.globalAlpha = 1; x.fillStyle = `rgba(255,200,110,${.02 + (40 - k) * .0016})`; x.beginPath(); x.arc(X0, 40, k * 1.6, 0, 7); x.fill(); }   // torch light
    for (const X0 of [70, 150]) { px(x, '#3A2412', X0 - 1, 40, 3, 12); px(x, '#8A5A3A', X0 - 3, 38, 7, 3); }
    px(x, '#3A2E52', 0, FLOOR - 2, LW, LH - FLOOR + 2); px(x, '#6E5C92', 0, FLOOR - 2, LW, 1);
    px(x, '#F7C548', 2, 62, 24, FLOOR - 64); px(x, '#F7C548', 5, 59, 18, 3); px(x, '#2A2466', 5, 64, 18, FLOOR - 66); px(x, '#2A2466', 7, 62, 14, 2); px(x, '#4FAE6A', 5, 104, 18, FLOOR - 106); px(x, '#FFFFFF', 9, 70); px(x, '#FFFFFF', 17, 78); px(x, '#FFE9A8', 13, 88);   // the way back: the garden under the stars
    const coin = ART.coin(), side = ART.coinSide(), gem = PX.gem(), crown = PX.crown();
    for (let k = 0; k < 520; k++) { const X = 34 + r() * (LW - 38), top = heapY(X), Y = top + r() * r() * (FLOOR + 6 - top); x.drawImage(r() < .7 ? coin : side, Math.round(X - 3), Math.round(Y - 3)); }
    for (let k = 0; k < 9; k++) { const X = 60 + r() * 150; x.drawImage(k % 4 === 3 ? crown : gem, Math.round(X), Math.round(heapY(X) + 2 + r() * 8)); }
  }
  const chest = { x: 112, open: 0, wig: 0 }, coinArt = ART.coin(), coinSide = ART.coinSide();
  const fountain = (X, Y, n = 12) => { for (let k = 0; k < n; k++) parts.push({ x: X, y: Y, vx: (Math.random() - .5) * 90, vy: -70 - Math.random() * 80, life: 2, art: Math.random() < .5 ? coinArt : coinSide, g: 260, coin: true }); };
  function goRoom(to) { room = to; fade = 1; hero.job = null; hero.x = hero.to = to === 'schat' ? 34 : 30; hero.face = 1; sfx.sparkle(); parts.length = 0; }
  function tapTreasure(p) {
    if (p.x < 28 && p.y > 56) { sfx.pop(); hero.job = { door: 'tuin' }; hero.to = 16; return; }
    if (Math.abs(p.x - chest.x) < 16 && p.y > FLOOR - 40 && p.y < FLOOR - 8) {                // the chest: three real coins a day, and always a surprise
      chest.open = 1.6; chest.wig = 1; const k = [0, 1, 2].find(i => !(Q.quest.picked.munt || []).includes(700 + i));
      if (k !== undefined) { Q.collect('munt', 700 + k); sfx.chime(5); parts.push({ x: chest.x, y: FLOOR - 34, vx: 0, vy: -46, life: 1.6, art: coinArt, g: 30, s: 3 }); spark(chest.x, FLOOR - 34, 8, '#FFD43B'); }
      else { sfx.sparkle(); spark(chest.x, FLOOR - 30, 12); heart(chest.x, FLOOR - 36); }
      return;
    }
    if (Math.abs(p.x - hero.x) < 18 && p.y > hero.y - 34) { hero.hop = 1; sfx.boing(); setTimeout(() => { sfx.chime(4); fountain(hero.x, hero.y - 6, 14); }, 380); return; }   // she jumps into the coins
    if (p.y > heapY(p.x) - 6 && p.x > 30) { sfx.chime(3 + Math.floor(Math.random() * 4)); sfx.pop(); fountain(p.x, Math.max(p.y, heapY(p.x)), 12); hero.to = Math.max(34, Math.min(LW - 20, p.x - 16)); return; }
    sfx.pop(); spark(p.x, p.y, 4, '#FFD43B');
  }
  function drawTreasure(dt) {
    ctx.drawImage(vault, 0, 0);
    for (const X0 of [70, 150]) { const f = Math.sin(time * 11 + X0) * 1.2; px(ctx, '#FF9A3C', X0 - 2, 31 + f * .3, 5, 8); px(ctx, '#FFD43B', X0 - 1, 33 + f * .5, 3, 6); px(ctx, '#FFF3A8', X0, 35, 1, 3); }
    for (let k = 0; k < 14; k++) { const X = 40 + (k * 53) % 176, Y = heapY(X) + 3 + (k * 17) % 14; if (Math.sin(time * 3 + k * 1.9) > .72) { px(ctx, '#FFFFFF', X - 2, Y, 5, 1); px(ctx, '#FFFFFF', X, Y - 2, 1, 5); } }   // glints
    if (chest.open > 0) chest.open = Math.max(0, chest.open - dt); if (chest.wig > 0) chest.wig = Math.max(0, chest.wig - dt * 2);
    const cx = chest.x + Math.round(Math.sin(chest.wig * 20) * 2 * chest.wig), cy = FLOOR - 12, up = chest.open > 0 ? 7 : 0;
    px(ctx, '#2B1E3A', cx - 13, cy - 11, 26, 20); px(ctx, '#A0603A', cx - 12, cy - 10, 24, 18); px(ctx, '#7A4428', cx - 12, cy + 4, 24, 4); px(ctx, '#F7C548', cx - 12, cy - 2, 24, 2); px(ctx, '#F7C548', cx - 2, cy - 4, 4, 6);
    if (up) { px(ctx, '#3A2412', cx - 12, cy - 10, 24, 7); px(ctx, '#FFD43B', cx - 10, cy - 8, 20, 5); px(ctx, '#FFF3A8', cx - 6, cy - 8, 3, 2); }
    px(ctx, '#2B1E3A', cx - 13, cy - 16 - up, 26, 6); px(ctx, '#B87248', cx - 12, cy - 15 - up, 24, 5); px(ctx, '#F7C548', cx - 12, cy - 12 - up, 24, 1);
  }

  st.canvas.addEventListener('pointerdown', e => {
    const p = st.toLocal(e); if (doors < 1) { doors = Math.max(doors, .7); return; }
    if (fade > .5) return; if (room === 'schat') return tapTreasure(p);
    if (p.x < 28 && p.y > 58 && p.y < 98) { sfx.door(); document.querySelector('#act-close') && document.querySelector('#act-close').click(); return; }   // back into the hall
    for (const f of flowers) if (Math.abs(p.x - f.x) < 13 && p.y > f.y - 34 && p.y < f.y + 6) return tapFlower(f);
    if (Math.abs(p.x - dragon.x) < 14 && Math.abs(p.y - (dragon.y - 8)) < 14) { dragon.hop = 1; sfx.boing(); for (let k = 0; k < 3; k++) setTimeout(() => heart(dragon.x - 10 - k * 5, dragon.y - 10), k * 140); return; }
    if (Math.abs(p.x - hero.x) < 22 && p.y > hero.y - 34) { hero.hop = 1; sfx.sparkle(); heart(hero.x, hero.y - 30); return; }
    if (p.y < 30 && Math.abs(p.x - 28) < 12) { sfx.chime(7); spark(28, 14, 6, '#FFF3C4'); return; }                      // the moon
    if (whole && p.y < GY && Math.hypot(p.x - CX, p.y - GY) < R0 + 4 && Math.hypot(p.x - CX, p.y - GY) > R0 - N * BW - 4) { const i = Math.max(0, Math.min(N - 1, Math.floor((R0 - Math.hypot(p.x - CX, p.y - GY)) / BW))); flowers[i].wig = 1; flowers[i].sing = 1; sfx.chime(i); spark(p.x, p.y, 4, COLS[i]); return; }
    for (const f of flies) if (Math.hypot(f.x - p.x, f.y - p.y) < 30) { f.x += (f.x - p.x) * .8; f.y += (f.y - p.y) * .8; }   // fireflies dart away
    sfx.pop(); spark(p.x, p.y, 4);
  });

  /* ---------- drawing ---------- */
  function drawFlower(f) {
    const col = COLS[f.i], sway = Math.sin(time * 1.4 + f.i) * 1 + Math.sin(f.wig * Math.PI * 4) * 3 * f.wig, hx = f.x + sway * (.4 + f.grow * .6), h = 12 + f.grow * 9, hy = f.y - h;
    for (let k = 0; k < h; k++) px(ctx, '#2F8F52', f.x + sway * (k / h) * (.4 + f.grow * .6), f.y - k, 2, 1);
    px(ctx, '#3EA865', f.x - 4, f.y - 6, 4, 2); px(ctx, '#3EA865', f.x + 2, f.y - 9, 4, 2);
    if (f.grow < .15) {                                                           // asleep: a closed bud that hangs its head, breathing
      const b = Math.sin(time * 1.8 + f.i * 2) > .2 ? 1 : 0, dim = PX.mix(col, '#6A6090', .3); px(ctx, '#2B1E3A', hx - 4, hy - 3 - b, 10, 12 + b); px(ctx, dim, hx - 3, hy - 2 - b, 8, 10 + b); px(ctx, PX.mix(col, '#FFFFFF', .35), hx - 2, hy - 1 - b, 2, 5); px(ctx, PX.mix(dim, '#2B1E3A', .3), hx + 1, hy - 2 - b, 1, 10 + b); px(ctx, '#2F8F52', hx - 3, hy + 6, 8, 2);
      const z = (time * .5 + f.i * .37) % 1; ctx.globalAlpha = 1 - z; px(ctx, '#FFFFFF', hx + 6 + z * 4, hy - 6 - z * 9, 3, 1); px(ctx, '#FFFFFF', hx + 7 + z * 4, hy - 5 - z * 9, 1, 1); px(ctx, '#FFFFFF', hx + 6 + z * 4, hy - 4 - z * 9, 3, 1); ctx.globalAlpha = 1;   // z z z
      return;
    }
    const R = 2 + f.grow * 6 + (f.sing > 0 ? Math.sin(f.sing * Math.PI) * 2 : 0);
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + time * .25, X = hx + 1 + Math.cos(a) * R * .75, Y = hy + Math.sin(a) * R * .75, s = Math.max(2, Math.round(R * .85)); px(ctx, col, X - s / 2, Y - s / 2, s, s); px(ctx, PX.mix(col, '#FFFFFF', .45), X - s / 2, Y - s / 2, Math.ceil(s / 2), 1); }
    const c = Math.max(2, Math.round(R * .7)); px(ctx, '#FFE08A', hx + 1 - c / 2, hy - c / 2, c, c); if (f.grow > .8) { px(ctx, '#5A3A1E', hx - 1, hy - 1); px(ctx, '#5A3A1E', hx + 2, hy - 1); px(ctx, '#C2456E', hx, hy + 1, 2, 1); }   // a little face
  }
  function drawHero() {
    const lift = Math.round(Math.abs(Math.sin(hero.hop * Math.PI * (party > 0 ? 2 : 1))) * 9), moving = Math.abs(hero.to - hero.x) > .5, fr = moving ? (Math.floor(hero.step * 7) % 2 ? 'w1' : 'w2') : 'idle', blink = time % 3.3 > 3.15;
    ctx.fillStyle = 'rgba(30,60,50,.25)'; ctx.fillRect(Math.round(hero.x - (withUni ? 16 : 7)), hero.y - 1, withUni ? 32 : 14, 2);
    if (withUni) {
      PX.drawSprite(ctx, PX.kidSprite(who, fr, blink, Q.wearing(who)), hero.x - 13 * hero.face, hero.y - 1 - Math.round(lift * .6), 2, hero.face < 0);
      PX.drawSprite(ctx, ART.uniSprite(look, fr === 'idle' ? 'idle' : fr, blink, { baby: true }), hero.x + 4 * hero.face, hero.y - lift, 2, hero.face < 0);
    } else PX.drawSprite(ctx, PX.kidSprite(who, lift > 2 ? 'jump' : fr, blink, Q.wearing(who)), hero.x, hero.y - lift, 2, hero.face < 0);
  }

  function drawParts(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt;
      if (p.life <= 0 || p.y > LH + 4 || (p.coin && p.vy > 0 && p.y > heapY(p.x) + 4)) { parts.splice(i, 1); continue; }   // a thrown coin lands back in the heap
      ctx.globalAlpha = p.coin ? 1 : Math.min(1, p.life * 2);
      if (p.art) { const sc = p.s || 1; ctx.drawImage(p.art, Math.round(p.x - p.art.width * sc / 2), Math.round(p.y), p.art.width * sc, p.art.height * sc); } else { px(ctx, p.col, p.x, p.y, 2, 2); if (p.big) { px(ctx, p.col, p.x - 1, p.y, 4, 2); px(ctx, p.col, p.x, p.y - 1, 2, 4); } }
      ctx.globalAlpha = 1;
    }
  }
  st.loop((dt, tt) => {
    time = tt; if (doors < 1) { const was = doors; doors = Math.min(1, doors + dt * .75); if (was === 0) sfx.sparkle(); }
    // she walks to the flower that was tapped and wakes it
    const d = hero.to - hero.x; if (Math.abs(d) > .5) { hero.face = d > 0 ? 1 : -1; hero.x += Math.sign(d) * Math.min(Math.abs(d), dt * 95); hero.step += dt; }
    else if (hero.job && hero.job.door) goRoom(hero.job.door);
    else if (hero.job) { const f = hero.job; hero.job = null; hero.face = 1; hero.hop = 1; if (!f.open) wake(f); }
    if (hero.hop > 0) hero.hop = Math.max(0, hero.hop - dt * (party > 0 ? 1.1 : 2)); if (dragon.hop > 0) dragon.hop = Math.max(0, dragon.hop - dt * 2);
    for (const f of flowers) { if (f.open && f.grow < 1) f.grow = Math.min(1, f.grow + dt * 1.6); if (f.wig > 0) f.wig = Math.max(0, f.wig - dt * 1.5); if (f.sing > 0) f.sing = Math.max(0, f.sing - dt * 2.2); }
    if (whole && glow < 1) glow = Math.min(1, glow + dt * .5);
    if (party > 0) partied = true;
    if (partied && party <= 0 && home < 0 && withUni && family.length) { home = 0; sfx.sparkle(); }   // after the party her family comes for her
    if (home >= 0) stepHome(dt);
    if (party > 0) {                                                              // the rainbow is whole: stars rain down, everybody dances
      party -= dt; if (hero.hop <= 0) hero.hop = 1; if (Math.random() < dt * 22) parts.push({ x: Math.random() * LW, y: -4, vx: (Math.random() - .5) * 12, vy: 26 + Math.random() * 30, life: 3.2, col: COLS[Math.floor(Math.random() * COLS.length)], g: 0, big: Math.random() < .4 });
      if (Math.floor(party * 1.6) !== Math.floor((party + dt) * 1.6)) { const f = flowers[Math.floor(Math.random() * N)]; f.wig = 1; f.sing = 1; sfx.chime(f.i); dragon.hop = 1; if (withUni) heart(hero.x + 8, hero.y - 30); }
    }

    if (fade > 0) fade = Math.max(0, fade - dt * 1.6);
    if (room === 'schat') { drawTreasure(dt); drawHero(); drawParts(dt); if (fade > 0) { ctx.fillStyle = `rgba(255,236,170,${fade})`; ctx.fillRect(0, 0, LW, LH); } return; }
    ctx.drawImage(back, 0, 0);
    { const b = Math.round(Math.sin(time * 2.2) * 2); PX.drawSprite(ctx, coinArt, 15, 58 + b, 1); if (Math.sin(time * 4) > .2) { px(ctx, '#FFFFFF', 22, 50 + b, 1, 3); px(ctx, '#FFFFFF', 21, 51 + b, 3, 1); } }   // what is behind the golden door
    // the rainbow: every open flower holds up its own colour
    flowers.forEach((f, i) => {
      if (f.grow <= 0) return; const w = Math.round(R0 * 2 * Math.min(1, f.grow * 1.15)); ctx.globalAlpha = .82 + (f.sing > 0 ? .18 : 0) + (whole ? Math.sin(time * 2 + i) * .08 : 0); ctx.globalAlpha = Math.min(1, ctx.globalAlpha);
      ctx.drawImage(bands[i], 0, 0, w, R0, CX - R0, GY - R0, w, R0); ctx.globalAlpha = 1;
    });
    if (whole) for (let k = 0; k < 10; k++) { const a = Math.PI * (1 + ((time * .12 + k * .1) % 1)), rr = R0 - 2 - ((k * 7) % (N * BW - 3)); if (Math.sin(time * 5 + k * 2) > .3) px(ctx, '#FFFFFF', CX + Math.cos(a) * rr, GY + Math.sin(a) * rr, 2, 2); }
    // the dragon on the wall
    PX.drawSprite(ctx, dragonArt, dragon.x, dragon.y - Math.round(Math.abs(Math.sin(dragon.hop * Math.PI)) * 7), 2, true);
    for (const f of flies) { f.x += Math.sin(time * .7 + f.p) * dt * 9; f.y += Math.cos(time * .9 + f.p * 2) * dt * 6; f.x = (f.x + LW) % LW; f.y = Math.max(34, Math.min(GY + 26, f.y)); const on = Math.sin(time * 2.4 + f.p * 3) > -.2; if (on) { px(ctx, '#FFF6B0', f.x, f.y, 2, 2); ctx.globalAlpha = .35; px(ctx, '#FFF6B0', f.x - 1, f.y - 1, 4, 4); ctx.globalAlpha = 1; } }
    for (const f of flowers) drawFlower(f);
    drawFamily();
    drawHero();
    if (fadeOut > 0) { ctx.fillStyle = `rgba(20,16,48,${fadeOut})`; ctx.fillRect(0, 0, LW, LH); }
    drawParts(dt); if (fade > 0) { ctx.fillStyle = `rgba(255,236,170,${fade})`; ctx.fillRect(0, 0, LW, LH); }
    if (glow > 0 && party > 0) { ctx.fillStyle = `rgba(255,240,200,${Math.max(0, (party - 6) * .5)})`; ctx.fillRect(0, 0, LW, LH); }
    // the gate swings open on the garden
    if (doors < 1) {
      const k = doors * doors, half = Math.round(LW / 2 * (1 - k));
      for (const [X0, w] of [[0, half], [LW - half, half]]) { if (w <= 0) continue; px(ctx, '#8A5A3A', X0, 0, w, LH); for (let X = X0 + (X0 ? 0 : w % 14); X < X0 + w; X += 14) px(ctx, '#6E4630', X, 0, 1, LH); px(ctx, '#F7C548', X0, 24, w, 3); px(ctx, '#F7C548', X0, LH - 30, w, 3); }
      if (half > 4) { px(ctx, '#F7C548', half - 6, 62, 4, 6); px(ctx, '#F7C548', LW - half + 2, 62, 4, 6); }
      ctx.fillStyle = `rgba(255,244,200,${(1 - k) * .5})`; ctx.fillRect(half, 0, LW - half * 2, LH);
    }
  });
  return () => st.destroy();
}
