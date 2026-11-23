// The unicorn race — she rides one of her unicorns against two others along the meadow. The unicorn runs by herself;
// a tap makes her jump. Jumping over a hay bale or a puddle gives her wings for a moment, running into one makes her
// stumble (and shake her head): nothing more. Everybody always reaches the finish and everybody gets a medal.
// Stars in the air and the medal turn into coins for the stall. Which unicorn she rides is hers to choose: the one of
// this adventure, or one of the old ones from the meadow in the village.
import * as ART from './art.js';
import * as Q from './quest.js';
export const meta = { id: 'race', title: 'Race' };

export function open(root, api) {
  const { PX, sfx, state } = api;
  const LW = 240, LH = 130, GY = 106, HX = 64, LEN = 2500, st = api.pixelStage(root, LW, LH), ctx = st.ctx;
  const px = (c, col, X, Y, w = 1, h = 1) => { c.fillStyle = col; c.fillRect(Math.round(X), Math.round(Y), w, h); };
  const who = state.extra.who === 'fenna' ? 'fenna' : 'anna', COLS = PX.RAINBOW;
  const EXTRA = [{ body: '#DCCBFA', mane: '#4FA3F7', horn: '#F7C548', name: 'Luna' }, { body: '#FFF0A6', mane: '#FF7EB6', horn: '#D3DAE6', name: 'Zon' }, { body: '#BFE3FF', mane: '#9B72E8', horn: '#FF9EC7', name: 'Wolk' }];
  const mounts = Q.raceMounts().length ? Q.raceMounts() : [Object.assign({}, state.uni)];
  const uni = (look, fr, blink) => ART.uniSprite(look, fr, blink, { baby: true });
  const hay = ART.propArt('hay'), log = ART.propArt('log'), tree = [PX.treeRound(1), PX.treeRound(3), PX.pine(2)];

  let phase = 'pick', t = 0, time = 0, me = null, rivals = [], obstacles = [], stars = [], parts = [], got = 0, place = 0, coins = 0, lights = 0, finished = [];
  const spark = (X, Y, n = 5, col = null) => { for (let k = 0; k < n; k++) parts.push({ x: X, y: Y, vx: (Math.random() - .5) * 60, vy: -20 - Math.random() * 40, life: .6 + Math.random() * .5, col: col || COLS[Math.floor(Math.random() * COLS.length)], g: 70 }); };

  function start(look) {
    const r = PX.rng(Date.now() & 0xffff), others = mounts.filter(m => m !== look).concat(EXTRA).slice(0, 2);
    me = { look, x: 0, y: 0, vy: 0, v: 0, boost: 0, trip: 0, step: 0, done: false, lane: 5 };
    rivals = others.map((l, k) => ({ look: l, x: k ? -30 : 30, y: 0, vy: 0, v: 0, trip: 0, step: k * .4, done: false, lane: k ? -1 : -7, ph: k * 2.4 + r() * 2, amp: 34 + k * 14 }));
    obstacles = []; stars = []; let x = 330;
    while (x < LEN - 200) { const kind = r() < .4 ? 'plas' : r() < .5 ? 'log' : 'hay'; obstacles.push({ x, kind, hit: false, cleared: false }); if (r() < .7) stars.push({ x: x + 4, y: 34, got: false }); const gap = 150 + r() * 110; if (r() < .5) stars.push({ x: x + gap / 2, y: 30 + r() * 8, got: false, pair: true }); x += gap; }
    got = 0; place = 0; coins = 0; finished = []; parts = []; phase = 'ready'; t = 0; lights = 0;
  }
  const jump = o => { if (o.y <= 0 && o.trip <= 0) { o.vy = 150; o.y = .01; return true; } return false; };

  st.canvas.addEventListener('pointerdown', e => {
    const p = st.toLocal(e);
    if (phase === 'pick') { const n = mounts.length, w = Math.min(60, (LW - 20) / n), i = Math.floor((p.x - (LW - w * n) / 2) / w); if (i >= 0 && i < n) { sfx.sparkle(); start(mounts[i]); } return; }
    if (phase === 'run') { if (jump(me)) sfx.boing(); return; }
    if (phase === 'podium' && t > 1.6) { sfx.pop(); if (mounts.length > 1) { phase = 'pick'; t = 0; } else start(mounts[0]); }
  });

  /* ---------- the race itself ---------- */
  function run(o, dt, target) {
    if (o.trip > 0) o.trip -= dt;
    o.v += (target - o.v) * Math.min(1, dt * 3); o.x += o.v * dt; o.step += dt * o.v / 60;
    if (o.y > 0 || o.vy > 0) { o.vy -= 420 * dt; o.y += o.vy * dt; if (o.y <= 0) { o.y = 0; o.vy = 0; } }
    if (!o.done && o.x >= LEN) { o.done = true; finished.push(o); }
  }
  function step(dt) {
    const base = me.done ? 0 : me.trip > 0 ? 34 : me.boost > 0 ? 122 : 92; if (me.boost > 0) me.boost -= dt;
    run(me, dt, base);
    for (const ob of obstacles) {
      const d = ob.x - me.x; if (ob.hit || ob.cleared) continue;
      if (Math.abs(d) < 9 && me.y < (ob.kind === 'plas' ? 3 : 9)) { ob.hit = true; me.trip = ob.kind === 'plas' ? .45 : .7; me.boost = 0; me.tripped = (me.tripped || 0) + 1; sfx.pop(); spark(HX + 8, GY - 6, 7, ob.kind === 'plas' ? '#8FD3FF' : '#F2C14E'); }
      else if (d < -10) { ob.cleared = true; me.boost = 1.1; sfx.chime(got % 8); spark(HX - 6, GY - 4, 4); }
    }
    for (const s of stars) if (!s.got && Math.abs(s.x - me.x) < 10 && Math.abs((GY - 16 - me.y) - (GY - s.y)) < 14) { s.got = true; got++; sfx.sparkle(); spark(HX + 4, GY - s.y, 6, '#FFD43B'); }
    // the others stay close: a little ahead, a little behind, and near the finish they let her pass unless she stumbled a lot
    const last = me.x > LEN - 420, many = (me.tripped || 0) > 3;
    rivals.forEach((o, k) => {
      const want = last ? (many && k === 0 ? 26 : -22 - k * 20) : Math.sin(time * .55 + o.ph) * o.amp + (k ? -8 : 10), gap = o.x - me.x;
      const tv = o.done ? 0 : o.trip > 0 ? 40 : Math.max(55, Math.min(132, (me.done ? 96 : me.v) + (want - gap) * 1.3));
      run(o, dt, tv);
      for (const ob of obstacles) { const d = ob.x - o.x; if (d > 0 && d < 26 && o.y <= 0 && !ob['r' + k]) { ob['r' + k] = true; if (Math.sin(ob.x * 1.7 + k) > .82) { o.trip = .6; } else jump(o); } }
    });
    if (me.done && !place) { place = finished.indexOf(me) + 1; coins = (4 - place) + Math.floor(got / 4); Q.earn(coins); sfx.tada(); }   // saved first, the party after
    if (me.done && me.v < 6 && rivals.every(o => o.done || o.x < me.x - 400)) { phase = 'podium'; t = 0; }
    if (me.done && t > 0 && rivals.some(o => !o.done)) for (const o of rivals) if (!o.done) o.x += dt * 60;
  }

  /* ---------- drawing ---------- */
  function scenery(cam) {
    for (let Y = 0; Y < GY - 14; Y++) px(ctx, PX.mix('#7CC8F2', '#D8F1FF', Y / (GY - 14)), 0, Y, LW, 1);
    px(ctx, '#FFF3B0', 196, 12, 14, 14); px(ctx, '#FFF3B0', 194, 14, 18, 10); px(ctx, '#FFF3B0', 198, 10, 10, 18);
    for (let k = 0; k < 4; k++) { const X = ((k * 97 - cam * .06) % (LW + 60) + LW + 60) % (LW + 60) - 30, Y = 14 + (k * 13) % 22; px(ctx, '#FFFFFF', X, Y, 22, 5); px(ctx, '#FFFFFF', X + 4, Y - 3, 12, 4); }
    for (let X = 0; X < LW; X++) { const wx = X + cam * .15, h = 20 + Math.sin(wx * .021) * 9 + Math.sin(wx * .05) * 4; px(ctx, '#9BD8A6', X, GY - 14 - h, 1, h + 1); }
    for (let X = 0; X < LW; X++) { const wx = X + cam * .3, h = 9 + Math.sin(wx * .033 + 2) * 6 + Math.sin(wx * .09) * 2; px(ctx, '#74C587', X, GY - 14 - h, 1, h + 1); }
    for (let k = Math.floor((cam * .5 - 40) / 70); k * 70 < cam * .5 + LW + 40; k++) { const X = k * 70 - cam * .5, a = tree[((k % 3) + 3) % 3]; PX.drawSprite(ctx, a, X, GY - 12, 1.5); }
    px(ctx, '#6CC47A', 0, GY - 14, LW, 6); px(ctx, '#E9C98A', 0, GY - 8, LW, LH - GY + 8); px(ctx, '#D4B070', 0, GY - 8, LW, 1);                    // the sandy track
    for (let k = Math.floor((cam - 20) / 26); k * 26 < cam + LW + 20; k++) { const X = k * 26 - cam; px(ctx, '#FFF6E3', X, GY - 22, 2, 12); px(ctx, '#FFF6E3', X, GY - 20, 26, 2); px(ctx, '#FFF6E3', X, GY - 15, 26, 2); }   // fence
    for (let k = Math.floor((cam - 20) / 17); k * 17 < cam + LW + 20; k++) { const X = k * 17 - cam; px(ctx, '#D9B877', X, GY + 4 + ((k * 7) % 14), 5, 1); px(ctx, '#F6DDA6', X + 8, GY - 4 + ((k * 5) % 9), 3, 1); }
    px(ctx, '#6CC47A', 0, LH - 5, LW, 5); for (let k = Math.floor((cam * 1.3 - 20) / 9); k * 9 < cam * 1.3 + LW + 20; k++) px(ctx, k % 3 ? '#4FAE6A' : '#FF9EC7', k * 9 - cam * 1.3, LH - 7 - (k % 2), 2, 3);
  }
  function arch(X) {
    for (const dx of [0, 44]) for (let Y = GY - 52; Y < GY + 2; Y++) px(ctx, Math.floor(Y / 4) % 2 ? '#FFFFFF' : '#FF5E9C', X + dx, Y, 3, 1);
    for (let a = 0; a < 44; a += 3) for (let b = 0; b < 9; b += 3) px(ctx, (a / 3 + b / 3) % 2 ? '#FFFFFF' : '#3D2B4F', X + 2 + a, GY - 52 + b, 3, 3);
  }
  function racer(o, X, rider) {
    const fr = o.v > 8 && o.y <= 0 ? (Math.floor(o.step * 4) % 2 ? 'w1' : 'w2') : o.y > 0 ? 'w1' : 'idle', Y = GY + o.lane - Math.round(o.y * .22), wob = o.trip > 0 ? Math.round(Math.sin(time * 40) * 1.5) : 0;
    ctx.fillStyle = 'rgba(90,70,30,.25)'; ctx.fillRect(Math.round(X - 13), GY + o.lane - 1, 26, 2);
    if (rider) PX.drawSprite(ctx, PX.kidSprite(who, 'idle', time % 3.1 > 2.95, Q.wearing(who)), X - 9 + wob, Y - 13, 2);
    PX.drawSprite(ctx, uni(o.look, fr, o.trip > 0), X + wob, Y, 2);
    if (o.trip > 0) for (let k = 0; k < 3; k++) { const a = time * 9 + k * 2.1; px(ctx, '#FFD43B', X + 12 + Math.cos(a) * 8, Y - 36 + Math.sin(a) * 3, 2, 2); }
    if (rider && o.boost > 0 && o.y <= 0) for (let k = 0; k < 3; k++) px(ctx, COLS[(k + Math.floor(time * 12)) % 6], X - 20 - k * 5, Y - 10 - k * 3 + Math.sin(time * 20 + k) * 2, 4, 2);
  }
  function drawRace() {
    const cam = me.x - HX; scenery(cam);
    if (LEN - cam < LW + 60) arch(LEN - cam - 4); if (cam < 80) arch(-cam + 10);
    for (const ob of obstacles) { const X = ob.x - cam; if (X < -20 || X > LW + 20) continue; if (ob.kind === 'plas') { px(ctx, '#6CC6F0', X - 9, GY + 1, 18, 4); px(ctx, '#8FD3FF', X - 7, GY, 14, 2); px(ctx, '#E8FAFF', X - 4, GY + 1, 4, 1); } else PX.drawSprite(ctx, ob.kind === 'hay' ? hay : log, X, GY + 5, 1); }
    for (const s of stars) { if (s.got) continue; const X = s.x - cam; if (X < -10 || X > LW + 10) continue; PX.drawSprite(ctx, PX.star(), X, GY - s.y + 8 + Math.round(Math.sin(time * 4 + s.x) * 2), 1); }
    for (const o of [...rivals].sort((a, b) => a.lane - b.lane)) racer(o, o.x - cam, false);
    racer(me, HX, true);
    // where everybody is: a little track along the top
    px(ctx, 'rgba(255,255,255,.75)', 30, 6, LW - 60, 3); px(ctx, '#3D2B4F', LW - 31, 3, 2, 9); px(ctx, '#FF5E9C', LW - 29, 3, 5, 4);
    for (const o of [...rivals, me]) { const X = 30 + Math.min(1, o.x / LEN) * (LW - 60); px(ctx, '#3D2B4F', X - 3, 3, 7, 7); px(ctx, o.look.body || '#FFFFFF', X - 2, 4, 5, 5); if (o === me) { px(ctx, '#FFD43B', X - 1, 0, 3, 2); px(ctx, '#FFD43B', X, 2, 1, 1); } }
    for (let k = 0; k < Math.min(got, 12); k++) px(ctx, '#FFD43B', 6 + (k % 4) * 5, 16 + Math.floor(k / 4) * 5, 3, 3);
  }
  function drawPick() {
    scenery(time * 14); const n = mounts.length, w = Math.min(60, (LW - 20) / n), x0 = (LW - w * n) / 2;
    mounts.forEach((m, i) => { const X = x0 + w * i + w / 2, hop = Math.round(Math.abs(Math.sin(time * 2.4 + i * 1.1)) * 5); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(Math.round(X - w / 2 + 3), GY - 50, Math.round(w - 6), 58); PX.drawSprite(ctx, uni(m, 'idle', time % 3 > 2.85), X, GY + 2 - hop, 2); });
    PX.drawSprite(ctx, PX.kidSprite(who, 'idle', false, Q.wearing(who)), LW / 2, LH - 1, 1);
  }
  function drawPodium() {
    scenery(LEN - HX); const order = finished.concat(rivals.filter(o => !finished.includes(o))), spots = [[LW / 2, 26], [LW / 2 - 52, 16], [LW / 2 + 52, 9]];
    spots.forEach(([X, h], k) => { px(ctx, ['#FFD43B', '#D3DAE6', '#E0965A'][k], X - 24, GY + 4 - h, 48, h + 6); px(ctx, 'rgba(255,255,255,.4)', X - 24, GY + 4 - h, 48, 2); PX.drawSprite(ctx, ART.medal(k + 1), X, GY + 6, 1); });
    order.slice(0, 3).forEach((o, k) => { const [X, h] = spots[k], hop = Math.round(Math.abs(Math.sin(time * 4 + k)) * (k ? 3 : 7)); if (o === me) PX.drawSprite(ctx, PX.kidSprite(who, 'idle', false, Q.wearing(who)), X - 5, GY + 4 - h - 13 - hop, 2); PX.drawSprite(ctx, uni(o.look, 'idle', false), X, GY + 4 - h - hop, 2); });
    for (let k = 0; k < coins; k++) { const a = Math.min(1, Math.max(0, t * 2.5 - k * .35)); if (a > 0) PX.drawSprite(ctx, ART.coin(), LW / 2 - (coins - 1) * 5 + k * 10, 22 - Math.round(Math.sin(a * Math.PI) * 6), 1); }
    if (Math.random() < .5) parts.push({ x: Math.random() * LW, y: -3, vx: (Math.random() - .5) * 14, vy: 30 + Math.random() * 30, life: 3, col: COLS[Math.floor(Math.random() * 6)], g: 0 });
    if (t > 1.6) PX.drawSprite(ctx, ART.againIcon(), LW - 22, LH - 4 - Math.round(Math.abs(Math.sin(time * 3)) * 2), 2);
  }

  st.loop((dt, tt) => {
    time = tt; t += dt;
    if (phase === 'pick') { if (mounts.length === 1) start(mounts[0]); else drawPick(); }
    if (phase === 'ready') {
      drawRace(); const n = Math.floor(t / .65); if (n !== lights && n <= 3) { lights = n; n === 3 ? sfx.chime(5) : sfx.chime(0); }
      for (let k = 0; k < 3; k++) { px(ctx, '#3D2B4F', LW / 2 - 26 + k * 18, 30, 16, 16); px(ctx, lights > k ? ['#FF6B6B', '#FFD43B', '#69DB7C'][k] : '#6A5A80', LW / 2 - 24 + k * 18, 32, 12, 12); }
      if (t > 2.2) { phase = 'run'; t = 0; }
    } else if (phase === 'run') { step(dt); if (phase === 'run') drawRace(); else drawPodium(); }
    else if (phase === 'podium') drawPodium();
    for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; if (p.life <= 0 || p.y > LH + 4) { parts.splice(i, 1); continue; } ctx.globalAlpha = Math.min(1, p.life * 2); px(ctx, p.col, p.x, p.y, 2, 2); ctx.globalAlpha = 1; }
  });
  return () => st.destroy();
}
