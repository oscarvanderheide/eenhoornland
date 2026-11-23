// The two big moments of the adventure, shown from the side on the whole screen so there is time to look and be amazed:
// the fallen star warming the egg until the little unicorn comes out, and the rainbow fruit that makes her strong
// enough to carry a girl — which ends with the girl climbing on her back and galloping off, so nobody has to be told
// how riding works. No words; a tap goes on to the next part, the arrow skips. (The opening dream is js/dream.js.)
import * as Q from './quest.js';
import * as PX from './pixel.js';
import * as ART from './art.js';
import { pixelStage } from './ui.js';
import { sfx, speak } from './audio.js';
const Qw = who => Q.wearing(who);   // the scenes show her the way she is dressed today

const CSS = `
#scene{position:absolute;inset:0;z-index:25;background:#0E1236;display:flex;flex-direction:column;opacity:0;transition:opacity .35s}
#scene.in{opacity:1}
#scene .pstage{flex:1;min-height:0}
#scene .pstage canvas{border-color:#2B1E3A;background:#9ED8F5}
#scene .skip{position:absolute;right:max(14px,env(safe-area-inset-right,0px));bottom:calc(14px + env(safe-area-inset-bottom,0px));width:64px;height:64px;border-radius:50%;font-size:1.6rem;padding:0;line-height:1}
`;
let styled = false;
// Everything is placed in a 320×240 box (GY = the ground); the canvas is bigger than that box on all sides so the
// characters do not fill the screen: FW×FH pixels, with the box starting at (OX, OY).
const LW = 320, LH = 240, GY = 204, FW = 480, FH = 360, OX = 80, OY = 96, X0 = -OX, Y0 = -OY;
const hd = ART.hd;

/** runs a list of scenes: durations[i] seconds each; draw(k) is called every frame with k = {scene, t, dt, time, first, ctx, spark, D, px} */
function run(host, durations, draw) {
  if (!styled) { styled = true; const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); }
  return new Promise(resolve => {
    const el = document.createElement('div'); el.id = 'scene'; host.appendChild(el);
    const st = pixelStage(el, FW, FH), ctx = st.ctx;
    const skip = document.createElement('button'); skip.className = 'hbtn skip'; skip.setAttribute('aria-label', 'Overslaan'); skip.textContent = '▶▶'; el.appendChild(skip);
    requestAnimationFrame(() => el.classList.add('in'));
    let scene = 0, t = 0, done = false, shown = -1; const parts = [];
    const k = {
      ctx, scene: 0, t: 0, dt: 0, time: 0, first: false,
      px(col, X, Y, w = 1, h = 1) { ctx.fillStyle = col; ctx.fillRect(Math.round(X), Math.round(Y), w, h); },
      /** draw a sprite with twice the pixels, anchored bottom-centre; s = size of one of those pixels */
      D(cv, x, y, s = 2, flip = false, rot = 0) { if (rot) { ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(rot); PX.drawSprite(ctx, hd(cv), 0, 0, s, flip); ctx.restore(); } else PX.drawSprite(ctx, hd(cv), x, y, s, flip); },
      spark(X, Y, n = 8, hearts = false, spread = 40) { for (let i = 0; i < n; i++) parts.push({ x: X + (Math.random() - .5) * spread, y: Y + (Math.random() - .5) * spread * .6, vx: (Math.random() - .5) * 60, vy: -20 - Math.random() * 55, life: 1, art: hd(hearts && i % 2 ? PX.heart() : PX.sparkle(i % 2 ? '#FFF6D0' : '#FFB3CC')) }); },
    };
    const next = () => { if (done) return; scene++; t = 0; if (scene >= durations.length) finish(); };
    function finish() { if (done) return; done = true; el.classList.remove('in'); setTimeout(() => { st.destroy(); el.remove(); resolve(); }, 330); }
    el.addEventListener('pointerdown', e => { if (e.target === skip) return; if (t > .4) { sfx.pop(); next(); } });
    skip.onclick = () => { sfx.pop(); finish(); };
    st.loop((dt, time) => {
      if (done) return; t += dt; Object.assign(k, { scene, t, dt, time, first: shown !== scene }); shown = scene;
      ctx.setTransform(1, 0, 0, 1, OX, OY); draw(k);
      for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= dt * .8; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 60 * dt; if (p.life <= 0) { parts.splice(i, 1); continue; } ctx.globalAlpha = Math.min(1, p.life * 2); ctx.drawImage(p.art, Math.round(p.x), Math.round(p.y)); ctx.globalAlpha = 1; }
      ctx.setTransform(1, 0, 0, 1, 0, 0); if (t > durations[scene]) next();
    });
  });
}
const ease = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
/** every `per` seconds, once */
const every = (k, per, off = 0) => Math.floor((k.t + off) / per) !== Math.floor((k.t - k.dt + off) / per);
function rainbow(ctx, cx, cy, r, amount, width = 4) { for (let i = 0; i < 6; i++) { ctx.strokeStyle = PX.RAINBOW[i]; ctx.lineWidth = width; ctx.beginPath(); ctx.arc(cx, cy, r - i * width, Math.PI, Math.PI + Math.PI * amount); ctx.stroke(); } }
function glow(ctx, x, y, r, col, a) { const g = ctx.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }

/* ------------------------------------------------------------------ */
/** the flower meadow: sky, hills, grass, flowers */
function meadow(k, scroll = 0) {
  const { px, ctx } = k;
  for (let y = Y0; y < GY; y += 4) px(PX.mix('#8FD0F5', '#E4F7FF', (y - Y0) / (GY - Y0)), X0, y, FW, 4);
  px('#FFF3A8', 262, 26, 22, 22); px('#FFE38A', 266, 30, 14, 14);
  for (const [cx, w, h, col] of [[-40, 130, 52, '#8ACF7C'], [70, 150, 46, '#9BD98A'], [230, 190, 60, '#8ACF7C'], [370, 140, 44, '#9BD98A']]) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, GY - 18, w, h, 0, Math.PI, 0); ctx.fill(); }
  px('#7BC86C', X0, GY - 20, FW, FH); px('#6DB862', X0, GY - 20, FW, 2);
  const fc = ['#FF7EB6', '#FFFFFF', '#FFD43B', '#B9A3F0', '#FF9E6B'];
  for (let i = 0; i < 80; i++) { const x = ((i * 67 + 13 - scroll * (1 + (i % 3) * .3)) % (FW + 20) + FW + 20) % (FW + 20) - 10 + X0, y = GY - 14 + (i * 29) % 70; px('#4E9A51', x, y + 2, 1, 3); px(fc[i % 5], x - 1, y, 3, 3); px('#FFF3A8', x, y + 1); }
}
/** the fallen star: a little face, glowing */
function star(k, x, y, s = 3, rot = 0) { glow(k.ctx, x, y - 16, 34 + Math.sin(k.time * 4) * 4, '255,240,170', .55); k.D(ART.warmItem(Q.quest.kind), x, y, s, false, rot); }

/** The star warms the egg and the unicorn is born. who: 'anna' | 'fenna'; kindDef: the egg; look: the unicorn that comes out. */
export function playHatch(host, who, kindDef, look) {
  const girl = f => PX.kidSprite(who, f, false, Qw(who)), egg = ART.egg(kindDef), top = ART.egg(kindDef, 'top'), bot = ART.egg(kindDef, 'bottom');
  const uni = (f, sleep = false) => ART.uniSprite(look, f, sleep, { baby: true });
  const EX = 188, GX = 62;
  const SAY = ['Brr, het ei heeft het koud. Kijk, daar komt ' + Q.WARM[Q.quest.kind] + '!', 'Het ei wordt lekker warm.', 'Het ei beweegt! Tik, tik, tik...', '', 'Krak! Een kleine eenhoorn! Hallo ' + look.name + '!', look.name + ' vindt jou lief!'];
  return run(host, [3, 3.2, 3.4, 1, 5, 4], k => {
    const { ctx, scene, t, time, px, D, spark } = k;
    if (k.first) { if (SAY[scene]) speak(SAY[scene]); [sfx.sparkle, () => sfx.chime(3), sfx.pop, sfx.whoosh, sfx.tada, sfx.sparkle][scene](); }
    meadow(k);
    const hopG = scene >= 2 ? Math.abs(Math.sin(time * (scene === 4 ? 7 : 5))) * (scene === 3 ? 0 : 7) : 0;
    D(girl(scene >= 2 && hopG > 4 ? 'jump' : 'idle'), GX, GY - hopG, 3, false);
    if (scene === 0) {                                                             // cold: the egg shivers, the star comes down
      const sh = Math.sin(time * 40) * 1.2; D(egg, EX + sh, GY, 3);
      for (let i = 0; i < 3; i++) if (Math.floor(time * 4 + i) % 3 === 0) { px('#BFE3FF', EX - 44 - i * 5, GY - 60 + i * 16, 8, 2); px('#BFE3FF', EX + 38 + i * 5, GY - 54 + i * 16, 8, 2); }
      const u = ease(t / 2.6), sx = 330 - u * 136, sy = 14 + u * 66 + Math.sin(time * 3) * 4; star(k, sx, sy + 30, 3, Math.sin(time * 2) * .2); if (every(k, .12)) spark(sx + 14, sy + 6, 1, false, 8);
    } else if (scene === 1) {                                                      // warm: the star hugs the egg
      const sy = 84 + Math.sin(time * 3) * 5; glow(ctx, EX, GY - 50, 50 + ease(t / 2) * 46, '255,214,150', .25 + ease(t / 2) * .4);
      for (let i = 0; i < 3; i++) { const r = ((t * 26 + i * 22) % 66) + 20; ctx.strokeStyle = `rgba(255,236,170,${1 - (r - 20) / 66})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(EX, GY - 54, r, 0, 7); ctx.stroke(); }
      D(egg, EX, GY - Math.abs(Math.sin(time * 2)) * 2, 3); star(k, EX + 2, sy + 4, 3, Math.sin(time * 5) * .12); if (every(k, .7)) { spark(EX, GY - 80, 3, true, 50); sfx.chime(Math.floor(t * 1.4) % 6); }
    } else if (scene === 2) {                                                      // it wobbles harder and harder, cracks appear
      const amp = .05 + ease(t / 3.2) * .3, rot = Math.sin(t * (6 + t * 5)) * amp; glow(ctx, EX, GY - 50, 96, '255,214,150', .6);
      D(egg, EX, GY, 3, false, rot);
      ctx.save(); ctx.translate(EX, GY); ctx.rotate(rot); ctx.strokeStyle = '#2B1E3A'; ctx.lineWidth = 2; ctx.beginPath(); const n = Math.floor(ease(t / 2.8) * 9); for (let i = 0; i <= n; i++) { const X = -36 + i * 8, Y = -56 + (i % 2 ? -7 : 5); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); } ctx.stroke(); ctx.restore();
      if (every(k, Math.max(.22, .7 - t * .15))) { sfx.pop(); spark(EX + (Math.random() - .5) * 50, GY - 60, 2, false, 10); }
      star(k, EX + 60 + Math.sin(time * 2) * 6, 70 + Math.cos(time * 3) * 6, 2);
    } else if (scene === 3) {                                                      // a flash of light
      D(egg, EX, GY, 3); const r = ease(t / .8) * 420; glow(ctx, EX, GY - 54, Math.max(8, r), '255,255,255', 1); ctx.fillStyle = `rgba(255,255,255,${ease(t / .9)})`; ctx.fillRect(X0, Y0, FW, FH);
    } else {                                                                       // born! and then: friends
      const born = scene === 4, u = born ? t : 99;
      rainbow(ctx, 160, GY - 16, 150, born ? ease((t - .6) / 2.2) : 1, 5);
      const ux = born ? EX : EX - ease(t / 2.2) * 62, rise = born ? (1 - ease(u / 1.2)) * 26 : 0, hop = born ? (u > 1.6 ? Math.abs(Math.sin((u - 1.6) * 5)) * 12 : 0) : Math.abs(Math.sin(t * 8)) * 5;
      const fl = u * 1.4; D(top, EX + 44 + Math.min(34, fl * 40), GY - Math.max(0, Math.sin(Math.min(1, fl) * Math.PI) * 50), 3, false, Math.min(1, fl) * 2.4);
      const f = born ? 'idle' : (t < 2.2 ? (Math.floor(t * 8) % 2 ? 'w1' : 'w2') : 'idle');
      if (born) { ctx.save(); ctx.beginPath(); ctx.rect(X0, Y0, FW, GY - 22 - Y0); ctx.clip(); D(uni(f, u < 1.5 && Math.floor(u * 5) % 2 === 0), ux, GY - 12 + rise - hop, 3, true); ctx.restore(); D(bot, EX, GY, 3); }
      else { D(bot, EX + 6, GY, 3); D(uni(f, time % 2.5 > 2.3), ux, GY - hop, 3, true); }
      star(k, 250 + Math.cos(time * 2.5) * 30, 60 + Math.sin(time * 2.5) * 16, 2, Math.sin(time * 5) * .3);
      if (born && every(k, .45)) spark(EX + (Math.random() - .5) * 120, GY - 90, 4, u > 1.5, 60);
      if (born && every(k, 1.2, .6) && u > 1.6) sfx.sparkle();
      if (!born && every(k, .5)) spark((ux + GX) / 2, GY - 70, 3, true, 30);
      if (born && t < .7) { ctx.fillStyle = `rgba(255,255,255,${1 - t / .7})`; ctx.fillRect(X0, Y0, FW, FH); }
    }
  });
}

/* ------------------------------------------------------------------ */
/** the rainbow island: sea, sand, and the rainbow tree on the right */
function island(k, scroll = 0) {
  const { px, ctx, time, D } = k;
  for (let y = Y0; y < 120; y += 4) px(PX.mix('#8FD0F5', '#E4F7FF', (y - Y0) / (120 - Y0)), X0, y, FW, 4);
  px('#3E9AD6', X0, 120, FW, 60); for (let i = 0; i < 60; i++) { const x = (i * 53 + Math.floor(time * 6) * (i % 3)) % FW + X0, y = 124 + (i * 17) % 50; px(i % 4 ? '#6CC6F0' : '#FFFFFF', x, y, 6 + (i % 3) * 3, 2); }
  px('#F5E2AE', X0, GY - 26, FW, FH); px('#FFF6D8', X0, GY - 26, FW, 2); ctx.fillStyle = '#7BC86C'; ctx.beginPath(); ctx.ellipse(170 - scroll, GY + 26, 230, 40, 0, 0, 7); ctx.fill();
  for (let i = 0; i < 26; i++) { const x = ((i * 71 + 9 - scroll * 1.5) % (FW + 20) + FW + 20) % (FW + 20) - 10 + X0, y = GY - 8 + (i * 23) % 60; px(i % 2 ? '#FFB3CC' : '#FF9E6B', x, y, 4, 3); }
  D(ART.propArt('rainbowtree'), 266 - scroll * 2, GY + 2, 3);
}

/** She eats the rainbow fruit, grows strong, and the girl rides away on her back. */
export function playFeed(host, who, look) {
  const girl = f => PX.kidSprite(who, f, false, Qw(who)), uni = (f, sleep = false) => ART.uniSprite(look, f, sleep, { baby: true }), fruit = ART.foodItem(Q.quest.kind);
  const FX = 222, FY = 112;   // where the fruit hangs
  const SAY = [look.name + ' heeft honger. Kijk, daar hangen ' + Q.FOOD[Q.quest.kind] + '!', 'Pluk het maar!', 'Hap, hap, hap. Mmm!', 'Wat gebeurt er? ' + look.name + ' wordt sterk!', 'Kijk eens hoe sterk ze is!', 'Klim maar op haar rug. Hup, daar gaan we!'];
  return run(host, [3, 2.6, 3.4, 4.4, 2.4, 5], k => {
    const { ctx, scene, t, time, px, D, spark } = k;
    if (k.first) { if (SAY[scene]) speak(SAY[scene]); [sfx.bubble, sfx.boing, sfx.munch, sfx.sparkle, sfx.tada, sfx.boing][scene](); }
    const gallop = scene === 5 && t > 1.3, scroll = gallop ? (t - 1.3) * 150 : 0;
    island(k, scroll);
    let gx = 14, gy = GY, ux = 132, uy = GY, us = 3, gf = 'idle', uf = 'idle', fx = FX, fy = FY, fs = 3, showFruit = true;
    if (scene === 0) {                                                             // hungry: she looks up at the fruit
      ux += Math.sin(time * 14) * (t % 1.2 < .4 ? 1.5 : 0); if (every(k, 1.2)) sfx.bubble();
      ctx.fillStyle = '#FFFFFF'; for (const [dx, dy, r] of [[18, -108, 4], [26, -122, 6], [40, -146, 19]]) { ctx.beginPath(); ctx.arc(ux + dx, GY + dy, r, 0, 7); ctx.fill(); } D(fruit, ux + 40, GY - 134 + Math.sin(time * 4) * 2, 2);
      glow(ctx, FX, FY - 14, 30 + Math.sin(time * 4) * 5, '255,220,240', .7);
    } else if (scene === 1) {                                                      // the girl picks it
      const u = ease(t / 1.2); gx = 14 + u * 186; gf = t < 1.2 ? (Math.floor(t * 8) % 2 ? 'w1' : 'w2') : 'jump'; const j = t > 1.2 ? Math.sin(Math.min(1, (t - 1.2) / .7) * Math.PI) * 46 : 0; gy = GY - j;
      if (t > 1.55) { const d = ease((t - 1.55) / .6); fx = FX + (gx + 20 - FX) * d; fy = FY + (GY - 46 - FY) * d - j * (1 - d); if (k.t - k.dt <= 1.55) sfx.pop(); } glow(ctx, fx, fy - 14, 28, '255,220,240', .6);
    } else if (scene === 2) {                                                      // she eats it, bite by bite
      gx = 200; ux = 132 - ease(t / .8) * 20; uf = t < .8 ? (Math.floor(t * 8) % 2 ? 'w1' : 'w2') : 'idle'; const bites = Math.min(4, Math.floor(Math.max(0, t - .9) / .55));
      fs = 3 - bites * .6; fx = gx - 40; fy = GY - 44; showFruit = bites < 4; uy = GY - (t > .9 ? Math.abs(Math.sin((t - .9) * 5.7)) * 4 : 0);
      if (t > .9 && every(k, .55, -.9) && bites <= 4) { sfx.munch(); spark(fx - 8, fy - 10, 3, false, 14); }
    } else if (scene === 3) {                                                      // the rainbow goes round and round her: she floats, glows, gets stronger
      gx = 212; ux = 106; const u = ease(t / 3.6), lift = Math.sin(Math.min(1, t / 3.8) * Math.PI) * 26; uy = GY - lift; us = 3 + u * .9; showFruit = false; gf = Math.floor(t * 3) % 2 ? 'jump' : 'idle'; gy = GY - (gf === 'jump' ? 6 : 0);
      glow(ctx, ux, uy - 50, 70 + Math.sin(time * 6) * 8, '255,255,255', .5 + u * .3);
      for (let i = 0; i < 6; i++) for (let s = 0; s < 14; s++) { const a = time * 4 + i * 1.05 + s * .16, r = 62 - s * 1.2, y = uy - 50 + Math.sin(a * .9 + i) * 44; px(PX.RAINBOW[i], ux + Math.cos(a) * r - 2, y - 2, 5, 5); }
      if (every(k, .5)) { spark(ux, uy - 60, 5, false, 90); sfx.chime(Math.floor(t * 2) % 8); }
    } else if (scene === 4) {                                                      // proud and strong; she bows down: climb on!
      gx = 212; ux = 106; us = 3.9; showFruit = false; const st = Math.abs(Math.sin(t * 9)) * (t < 1.1 ? 8 : 0); uy = GY - st + (t > 1.4 ? ease((t - 1.4) / .5) * 5 : 0); if (t < 1.1 && every(k, .35)) sfx.step();
      glow(ctx, ux + 34, uy - 108, 16 + Math.sin(time * 8) * 4, '255,240,170', .9); if (every(k, .6)) spark(ux + 34, uy - 104, 3, false, 16);
      gf = t > 1.4 && Math.floor(t * 4) % 2 ? 'jump' : 'idle'; gy = GY - (gf === 'jump' ? 6 : 0);
    } else {                                                                       // up she goes — and off they gallop
      us = 3.9; showFruit = false; ux = gallop ? 150 : 106; const seatX = ux - 26, seatY = GY - 46;
      if (!gallop) { const u = ease(t / 1.1); gx = 212 + (seatX - 212) * u; gy = GY + (seatY - GY) * u - Math.sin(u * Math.PI) * 44; gf = u < 1 ? 'jump' : 'idle'; if (k.t - k.dt < 1.1 && t >= 1.1) { sfx.tada(); spark(seatX, seatY - 60, 10, true, 50); } }
      else {
        const b = Math.abs(Math.sin(t * 11)) * 7; uy = GY - b; gx = seatX; gy = seatY - b; uf = Math.floor(t * 9) % 2 ? 'w1' : 'w2';
        for (let i = 0; i < 6; i++) px(PX.RAINBOW[i], X0, GY - 70 + i * 5 - b * .5, ux - 50 - X0, 5);
        for (let i = 0; i < 5; i++) px('#FFFFFF', X0 + FW - ((time * 420 + i * 97) % (FW + 60)), 40 + i * 30, 30, 2);
        if (every(k, .3)) { sfx.step(); spark(ux - 70, GY - 60, 2, true, 30); }
      }
      // sitting: the girl is drawn first, the unicorn in front of her legs
      D(girl(gf), gx, gy, 3, false); D(uni(uf), ux, uy, us, false);
      return;
    }
    D(uni(uf, scene === 2 && t > .9 && Math.floor(t * 7) % 2 === 0), ux, uy, us, false);
    D(girl(gf), gx, gy, 3, false);
    if (showFruit) D(fruit, fx, fy, fs);
  });
}
