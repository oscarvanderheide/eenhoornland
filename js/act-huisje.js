// Ons Huisje — the girls' bedroom. Going to bed ends the day. After the unicorn has come home to her meadow, the night
// brings a new dream: a new egg, somewhere in Eenhoornland (the first dream of all is js/dream.js).
import * as ART from './art.js';
import * as Q from './quest.js';
export const meta = { id: 'huisje', title: 'Ons Huisje' };

export function open(root, api) {
  const { PX, sfx, speak, state } = api;
  const LW = 160, LH = 120, st = api.pixelStage(root, LW, LH), ctx = st.ctx;
  const px = (c, col, X, Y, w = 1, h = 1) => { c.fillStyle = col; c.fillRect(X, Y, w, h); };

  /* ---------- room ---------- */
  function paintRoom() {
    const c = document.createElement('canvas'); c.width = LW; c.height = LH; const x = c.getContext('2d'), r = PX.rng(11);
    px(x, '#FFE3EC', 0, 0, LW, 84); for (let X = 6; X < LW; X += 12) px(x, '#FFD0E0', X, 0, 3, 84);
    for (let k = 0; k < 26; k++) { const X = Math.floor(r() * LW), Y = Math.floor(r() * 78); px(x, '#FFFFFF', X, Y, 1, 1); px(x, '#FFFFFF', X - 1, Y + 1, 3, 1); px(x, '#FFFFFF', X, Y + 2, 1, 1); }
    px(x, '#C98A5E', 0, 84, LW, 36); for (let Y = 84; Y < LH; Y += 6) { px(x, '#A9704A', 0, Y, LW, 1); for (let X = (Y % 12) * 2; X < LW; X += 24) px(x, '#A9704A', X, Y, 1, 6); }
    px(x, '#FFFFFF', 0, 80, LW, 4); px(x, '#E8C9D4', 0, 83, LW, 1);
    // rug
    for (let Y = 96; Y < 114; Y++) { const half = 34 - Math.abs(Y - 105) * .6; for (let X = Math.round(98 - half); X < 98 + half; X++) px(x, (Math.floor((X + Y) / 4) % 2) ? '#B9A3F0' : '#D9CCFF', X, Y); }
    // shelf with toys
    px(x, '#A9704A', 104, 30, 46, 3); px(x, '#7A4E33', 104, 33, 46, 1); x.drawImage(PX.star(), 108, 19); x.drawImage(PX.heart(), 122, 21); x.drawImage(PX.bunny(), 136, 16);
    // bed
    px(x, '#7A4E33', 6, 58, 6, 44); px(x, '#A9704A', 7, 59, 4, 42); px(x, '#7A4E33', 6, 54, 6, 5); px(x, '#7A4E33', 78, 78, 5, 24); px(x, '#A9704A', 79, 79, 3, 22);
    px(x, '#7A4E33', 10, 92, 70, 8); px(x, '#FFFFFF', 12, 74, 66, 18); px(x, '#EDE6F5', 12, 90, 66, 2);
    return c;
  }
  const room = paintRoom();
  const fennaHead = PX.fenna('idle', true), annaHead = PX.anna('idle', true), fennaUp = PX.fenna(), annaUp = PX.anna();
  const zArt = PX.sprite(['zzzz', '..z.', '.z..', 'zzzz'], { z: '#FFFFFF' });

  /* ---------- state ---------- */
  let phase = 'awake', t = 0, time = 0, res = null, parts = [], spoke = false, hop = 0, doneBtn = null;
  const before = { stage: Q.quest.stage, kind: Q.kind(), look: Object.assign({}, Q.companionLook()) };
  const spark = (X, Y, n = 8, hearts = false) => { for (let i = 0; i < n; i++) parts.push({ x: X + (Math.random() - .5) * 26, y: Y + (Math.random() - .5) * 18, vx: (Math.random() - .5) * 34, vy: -14 - Math.random() * 30, life: 1, art: hearts && i % 2 ? PX.heart() : PX.sparkle(i % 2 ? '#FFF6D0' : '#FFB3CC') }); };
  const CX = 122, CY = 110;   // where the companion sits (the girls stand in front of the bed)

  const tb = api.toolbar(root, [{ id: 'slapen', label: 'Slapen', icon: PX.moon(), onClick: goSleep }]);
  const hint = document.createElement('p'); hint.className = 'hint'; root.appendChild(hint);
  const setHint = s => { hint.textContent = s; };
  function goSleep() {
    if (phase !== 'awake') return;
    res = Q.sleep();                       // the new day is saved right away; the rest is only the show
    phase = 'sleep'; t = 0; tb.hidden = true; sfx.lullaby(); setHint('Sssst... welterusten!');
    speak('Welterusten, Anna en Fenna! Slaap lekker.');
  }
  function finish() {
    if (doneBtn) return; phase = 'done';
    doneBtn = document.createElement('div'); doneBtn.className = 'row'; const b = document.createElement('button'); b.className = 'btn'; b.textContent = 'Naar buiten!'; b.onclick = () => { sfx.pop(); api.close(); }; doneBtn.appendChild(b); root.appendChild(doneBtn);
  }
  function morningText() {
    const g = Q.goalText();
    if (res.type === 'newegg') return 'Goedemorgen! Jullie droomden weer van een ei. Er ligt ergens een nieuw ei in Eenhoornland! ' + g;
    return 'Goedemorgen, Anna en Fenna! ' + g;
  }

  st.canvas.addEventListener('pointerdown', e => {
    const p = st.toLocal(e);
    if (phase === 'awake') {
      if (p.x < 86 && p.y > 50 && p.y < 104) return goSleep();
      if (Math.abs(p.x - CX) < 32 && p.y > 62 && Q.hasCompanion()) { hop = 1; sfx.sparkle(); spark(CX, CY - 24, 6, true); speak(Q.quest.stage === 'ei' ? 'Tik tik! Het ei wil ook slapen.' : 'Hihihi! ' + state.uni.name + ' wil ook slapen.'); }
    } else if (phase === 'done') { spark(p.x, p.y, 4, true); sfx.pop(); }
  });

  /* ---------- drawing ---------- */
  function sky(n) { // n: 0 day .. 1 night
    const col = PX.mix('#9ED8F5', '#1C2150', n); px(ctx, '#7A4E33', 36, 16, 40, 34); px(ctx, col, 39, 19, 34, 28);
    if (n > .5) { for (const [a, b] of [[43, 23], [51, 39], [60, 26], [68, 41], [66, 22]]) px(ctx, '#FFFFFF', a, b); const mx = 44 + (phase === 'sleep' ? Math.min(1, t / 5) * 18 : 9); px(ctx, '#FFE38A', Math.round(mx), 27, 6, 6); px(ctx, col, Math.round(mx) + 2, 26, 5, 5); }
    else { px(ctx, '#FFE38A', 62, 23, 7, 7); px(ctx, '#FFFFFF', 43, 30, 11, 3); px(ctx, '#FFFFFF', 45, 28, 6, 2); px(ctx, '#7BC86C', 39, 42, 34, 5); }
    px(ctx, '#7A4E33', 55, 19, 2, 28); px(ctx, '#7A4E33', 39, 32, 34, 2); px(ctx, '#A9704A', 34, 50, 44, 3);
  }
  function drawCompanion(stage, look, kindDef, dy = 0) {
    const y = CY - Math.round(Math.abs(Math.sin(hop * Math.PI)) * 10) + dy;
    if (stage === 'ei') {
      ctx.save(); ctx.translate(CX, y - 4); ctx.rotate(Math.sin(time * 2.2) * .05); PX.drawSprite(ctx, ART.egg(kindDef), 0, 0, 2); ctx.restore();
      for (let X = -17; X <= 17; X++) { const h = 9 - Math.round(Math.abs(X) * .3); px(ctx, '#8A6A2A', CX + X, y - h + 2, 1, 1); px(ctx, (X + 40) % 3 ? '#C9A23F' : '#E9C46A', CX + X, y - h + 3, 1, h); }
    } else if (stage === 'baby' || stage === 'vriend') {
      const sleeping = phase === 'sleep' || phase === 'dawn';
      PX.drawSprite(ctx, ART.uniSprite(look, 'idle', sleeping || (time % 3.4 > 3.25), { baby: true }), CX, y, 2, true);
    }
  }
  function drawKids(inBed) {
    if (inBed) {
      px(ctx, '#FFF6FA', 15, 70, 26, 12); px(ctx, '#FFF6FA', 46, 70, 26, 12); px(ctx, '#E8D6E2', 15, 81, 26, 1); px(ctx, '#E8D6E2', 46, 81, 26, 1);
      ctx.drawImage(fennaHead, 0, 0, fennaHead.width, 12, 19, 62, fennaHead.width, 12); ctx.drawImage(annaHead, 0, 0, annaHead.width, 10, 52, 66, annaHead.width, 10);
      px(ctx, '#FF7EB6', 12, 76, 68, 18); px(ctx, '#FF9EC7', 12, 76, 68, 3); for (let X = 16; X < 78; X += 9) for (let Y = 82; Y < 92; Y += 6) px(ctx, '#FFD0E0', X + (Y % 12 ? 4 : 0), Y, 2, 2); px(ctx, '#D85C98', 12, 93, 68, 1);
    } else {
      px(ctx, '#FFF6FA', 15, 70, 26, 10); px(ctx, '#FFF6FA', 46, 70, 26, 10); px(ctx, '#FF7EB6', 12, 80, 68, 14); px(ctx, '#FF9EC7', 12, 80, 68, 3); px(ctx, '#D85C98', 12, 93, 68, 1);
      PX.drawSprite(ctx, fennaUp, 30, 114, 2); PX.drawSprite(ctx, annaUp, 62, 115, 2);
    }
  }

  st.loop((dt, tt) => {
    time = tt; t += dt; if (hop > 0) hop = Math.max(0, hop - dt * 2);
    let dark = Q.bedtime() && phase === 'awake' ? .45 : 0, n = dark ? 1 : 0;
    if (phase === 'sleep') { dark = Math.min(.72, .45 + t * .3); n = 1; if (t > 5.2) { phase = 'dawn'; t = 0; sfx.sparkle(); } }
    else if (phase === 'dawn') { dark = Math.max(0, .72 - t * .6); n = Math.max(0, 1 - t * .8); if (t > 1.4) { phase = 'reveal'; t = 0; } }
    ctx.drawImage(room, 0, 0); sky(n);
    const inBed = phase === 'sleep' || phase === 'dawn'; drawKids(inBed);
    // companion: before the night as it was, after the night as it has become
    if (phase === 'reveal' || phase === 'done') {
      if (!spoke) { spoke = true; setHint(''); speak(morningText()); if (res.type === 'morning' || res.type === 'newegg') { sfx.chime(2); spark(56, 30, 8); } }
      drawCompanion(Q.quest.stage, Q.companionLook(), Q.kind());
      if (res.type === 'newegg' && phase === 'reveal' && t < 2.5) { ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(46, 46, 15, 0, 7); ctx.fill(); PX.drawSprite(ctx, ART.egg(Q.kind()), 43, 56, 1); ctx.fillStyle = '#C2456E'; ctx.font = 'bold 13px sans-serif'; ctx.fillText('?', 51, 51); }
      if (phase === 'reveal' && t > (res.type === 'newegg' ? 2.5 : 1)) finish();
    } else drawCompanion(before.stage, before.look, before.kind);
    if (dark > 0) { ctx.fillStyle = `rgba(20,24,70,${dark})`; ctx.fillRect(0, 0, LW, LH); }
    // the night after the party: a dream of the next egg floats above the bed
    if (phase === 'sleep' && res.type === 'newegg' && t > 1.2) {
      const k = Math.min(1, (t - 1.2) / 1.2); ctx.fillStyle = '#F4F1FF';
      for (const [dx, dy, r] of [[-30, 26, 3], [-22, 18, 5]]) { ctx.beginPath(); ctx.arc(96 + dx, 34 + dy, r * k, 0, 7); ctx.fill(); }
      for (const [dx, dy, r] of [[0, 0, 22], [-18, 4, 15], [18, 4, 15], [-8, -10, 15], [10, -10, 15]]) { ctx.beginPath(); ctx.arc(96 + dx, 34 + dy, r * k, 0, 7); ctx.fill(); }
      if (k >= 1) { ctx.save(); ctx.translate(96, 48); ctx.rotate(Math.sin(time * 3) * .1); PX.drawSprite(ctx, ART.egg(Q.kind()), 0, 0, 2); ctx.restore(); if (Math.floor(t * 2) !== Math.floor((t - dt) * 2)) spark(96, 30, 3); }
    }
    if (inBed) for (let k = 0; k < 3; k++) { const a = (time * .5 + k / 3) % 1; ctx.globalAlpha = 1 - a; ctx.drawImage(zArt, 40 + k * 14 + Math.round(Math.sin(a * 6) * 2), 58 - Math.round(a * 26)); ctx.globalAlpha = 1; }
    for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= dt * .9; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 30 * dt; if (p.life <= 0) { parts.splice(i, 1); continue; } ctx.globalAlpha = Math.min(1, p.life * 2); ctx.drawImage(p.art, Math.round(p.x), Math.round(p.y)); ctx.globalAlpha = 1; }
  });

  setHint('Tik op het bed om te gaan slapen.');
  speak(Q.bedtime() ? 'Het is avond. Tijd om te slapen! Tik op het bed.' : 'Dit is jullie huisje. Tik op het bed als je wilt slapen. ' + Q.goalText());
  return () => st.destroy();
}
