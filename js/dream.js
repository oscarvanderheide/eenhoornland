// The dream that starts the adventure: the girl is asleep, dreams of a mysterious glowing egg in the forest and of the
// little unicorn that comes out of it, then wakes up and goes outside to find out if it is real.
// A full-screen pixel cutscene without words; a tap goes on to the next scene, the arrow skips it altogether.
import * as PX from './pixel.js';
import * as ART from './art.js';
import { pixelStage } from './ui.js';
import { sfx, speak } from './audio.js';

const CSS = `
#dream{position:absolute;inset:0;z-index:25;background:#0E1236;display:flex;flex-direction:column;opacity:0;transition:opacity .5s}
#dream.in{opacity:1}
#dream .pstage{flex:1;min-height:0}
#dream .pstage canvas{border-color:#2B1E3A;background:#141A45}
#dream .skip{position:absolute;right:max(14px,env(safe-area-inset-right,0px));bottom:calc(14px + env(safe-area-inset-bottom,0px));width:64px;height:64px;border-radius:50%;font-size:1.6rem;padding:0;line-height:1}
`;
let styled = false;
const SCENES = [3, 1.4, 4.2, 1.5, 4.2, 1.4, 3];   // asleep · the bubble grows · the egg · it cracks · the unicorn · the bubble pops, morning · awake
const LW = 160, LH = 120;

/** who: 'anna' | 'fenna'; kindDef: the egg of this dream (Q.kind()); look: the unicorn in the dream. Resolves when it is over. */
export function playDream(host, who, kindDef, look = { body: '#FFFFFF', mane: 'rainbow', horn: '#F7C548' }) {
  if (!styled) { styled = true; const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); }
  return new Promise(resolve => {
    const el = document.createElement('div'); el.id = 'dream'; host.appendChild(el);
    const st = pixelStage(el, LW, LH), ctx = st.ctx;
    const skip = document.createElement('button'); skip.className = 'hbtn skip'; skip.setAttribute('aria-label', 'Overslaan'); skip.textContent = '▶▶'; el.appendChild(skip);
    requestAnimationFrame(() => el.classList.add('in'));
    const px = (col, X, Y, w = 1, h = 1) => { ctx.fillStyle = col; ctx.fillRect(Math.round(X), Math.round(Y), w, h); };
    const head = PX[who]('idle', true), up = PX[who](), headH = who === 'anna' ? 10 : 12;
    const egg = ART.egg(kindDef), eggTop = ART.egg(kindDef, 'top'), eggBot = ART.egg(kindDef, 'bottom');
    const uni = f => ART.uniSprite(look, f, false, { baby: true });
    const zArt = PX.sprite(['zzzz', '..z.', '.z..', 'zzzz'], { z: '#FFFFFF' });
    const stars = [...Array(26)].map((_, k) => [(k * 53) % LW, (k * 37) % 70, k % 3]);

    let scene = 0, t = 0, time = 0, done = false, parts = [], said = -1;
    const spark = (X, Y, n = 8, hearts = false) => { for (let i = 0; i < n; i++) parts.push({ x: X + (Math.random() - .5) * 22, y: Y + (Math.random() - .5) * 14, vx: (Math.random() - .5) * 30, vy: -10 - Math.random() * 26, life: 1, art: hearts && i % 2 ? PX.heart() : PX.sparkle(i % 2 ? '#FFF6D0' : '#FFB3CC') }); };
    const SAY = ['Sssst... ' + (who === 'anna' ? 'Anna' : 'Fenna') + ' slaapt. En ze droomt...', '', 'Diep in het bos ligt een geheimzinnig ei. Het geeft licht!', 'Krak!', 'Er komt een kleine eenhoorn uit het ei!', '', 'Wat een mooie droom! Zou het ei echt bestaan? Kom, we gaan naar buiten!'];
    function next() { if (done) return; scene++; t = 0; if (scene >= SCENES.length) finish(); }
    function finish() { if (done) return; done = true; el.classList.remove('in'); setTimeout(() => { st.destroy(); el.remove(); resolve(); }, 450); }
    el.addEventListener('pointerdown', e => { if (e.target === skip) return; if (t > .35) { sfx.pop(); next(); } });
    skip.onclick = () => { sfx.pop(); finish(); };

    /* ---------- the bedroom ---------- */
    function room(night) {   // night 1 → 0
      px(PX.mix('#FFE3EC', '#2A2550', night * .78), 0, 0, LW, 84);
      for (let X = 6; X < LW; X += 12) px(PX.mix('#FFD0E0', '#30295C', night * .78), X, 0, 3, 84);
      px(PX.mix('#C98A5E', '#2B2148', night * .75), 0, 84, LW, 36); px(PX.mix('#FFFFFF', '#4A4580', night * .8), 0, 80, LW, 4);
      // window
      const sky = PX.mix('#9ED8F5', '#141A45', night); px('#5E3A24', 16, 14, 40, 36); px(sky, 19, 17, 34, 30);
      if (night > .5) { for (const [a, b] of [[23, 21], [31, 39], [24, 40], [48, 41], [28, 26]]) px('#FFFFFF', a, b); ctx.fillStyle = '#FFE38A'; ctx.beginPath(); ctx.arc(45, 24, 4.5, 0, 7); ctx.fill(); ctx.fillStyle = sky; ctx.beginPath(); ctx.arc(47, 22.5, 4, 0, 7); ctx.fill(); }
      else { px('#FFE38A', 42, 21, 8, 8); px('#FFFFFF', 22, 28, 12, 3); px('#FFFFFF', 24, 26, 7, 2); px('#7BC86C', 19, 41, 34, 6); }
      px('#5E3A24', 35, 17, 2, 30); px('#5E3A24', 19, 31, 34, 2); px('#7A4E33', 14, 50, 44, 3);
      // bed (seen from the side, head on the left)
      px('#5E3A24', 20, 72, 6, 34); px('#5E3A24', 108, 84, 5, 22); px('#7A4E33', 24, 98, 86, 6);
      px(PX.mix('#FFFFFF', '#8E8AC0', night * .6), 26, 82, 82, 16);
    }
    function bedGirl(asleep) {
      px('#FFF6FA', 28, 78, 26, 10);                                                                   // pillow
      if (asleep) {
        ctx.drawImage(head, 0, 0, head.width, headH, 34, 80 - headH + 2, head.width, headH);
        px('#FF7EB6', 44, 84, 64, 14); px('#FF9EC7', 44, 84, 64, 3); for (let X = 50; X < 104; X += 9) px('#FFD0E0', X, 90, 2, 2);
        for (let k = 0; k < 3; k++) { const a = (time * .5 + k / 3) % 1; ctx.globalAlpha = 1 - a; ctx.drawImage(zArt, 48 + k * 9 + Math.round(Math.sin(a * 6) * 2), 70 - Math.round(a * 24)); ctx.globalAlpha = 1; }
      } else { px('#FF7EB6', 40, 86, 68, 12); px('#FF9EC7', 40, 86, 68, 3); }
    }
    /* ---------- the dream bubble ---------- */
    const BX = 104, BY = 40;
    function bubble(k) {   // k 0..1: how far it has grown
      for (const [dx, dy, r] of [[-44, 34, 2.5], [-36, 26, 4], [-27, 17, 5.5]]) if (k > .15) { ctx.fillStyle = '#F4F1FF'; ctx.beginPath(); ctx.arc(BX + dx, BY + dy, r * Math.min(1, k * 2), 0, 7); ctx.fill(); }
      if (k < .3) return false;
      const s = Math.min(1, (k - .3) / .7); ctx.save(); ctx.translate(BX, BY); ctx.scale(s, s);
      ctx.fillStyle = '#F4F1FF'; for (const [dx, dy, r] of [[0, 0, 30], [-26, 6, 20], [26, 6, 20], [-14, -14, 20], [16, -15, 20], [0, 16, 22]]) { ctx.beginPath(); ctx.arc(dx, dy, r, 0, 7); ctx.fill(); }
      ctx.beginPath(); ctx.rect(-40, -24, 80, 46); ctx.clip();
      return true;   // the caller draws the dream and restores
    }
    function forest() {
      px('#1F2A5C', -40, -24, 80, 46); for (const [a, b] of [[-30, -18], [-8, -21], [14, -17], [31, -20], [24, -8]]) px('#FFFFFF', a, b);
      px('#2F6B4F', -40, 10, 80, 12); px('#3A8346', -40, 10, 80, 2);
      for (const [X, sd] of [[-31, 1], [30, 2], [-17, 3]]) PX.drawSprite(ctx, PX.pine(sd), X, 13, 1);
    }

    st.loop((dt, tt) => {
      time = tt; t += dt;
      if (said !== scene) { said = scene; if (SAY[scene]) speak(SAY[scene]); if (scene === 0) sfx.lullaby(); if (scene === 1 || scene === 2) sfx.sparkle(); if (scene === 4) { sfx.tada(); spark(BX, BY, 14, true); } if (scene === 5) { sfx.pop(); spark(BX, BY, 18); } if (scene === 6) sfx.chime(4); }
      const morning = scene < 5 ? 0 : scene === 5 ? Math.min(1, t / SCENES[5]) : 1;
      room(1 - morning);
      if (scene < 6) bedGirl(true);
      else { bedGirl(false); const hop = Math.abs(Math.sin(Math.min(t, 1.2) * 5)) * 5; PX.drawSprite(ctx, up, 124, 112 - hop, 2); if (t > .5) { const b = Math.min(1, (t - .5) * 4); ctx.save(); ctx.translate(124, 62 - hop); ctx.scale(b, b); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(0, 0, 13, 0, 7); ctx.fill(); PX.drawSprite(ctx, egg, -3, 8, 1); ctx.fillStyle = '#C2456E'; ctx.font = 'bold 12px sans-serif'; ctx.fillText('?', 5, 5); ctx.restore(); } }
      // the dream
      const grow = scene === 0 ? 0 : scene === 1 ? t / SCENES[1] : scene < 5 ? 1 : scene === 5 ? Math.max(0, 1 - t * 3) : 0;
      if (grow > 0 && bubble(grow)) {
        forest();
        if (scene <= 3) {
          const shake = scene === 3 ? Math.sin(t * 34) * .25 * Math.min(1, t * 2) : Math.sin(time * 2.4) * .08;
          const glow = ctx.createRadialGradient(0, 2, 2, 0, 2, 22); glow.addColorStop(0, 'rgba(255,245,190,' + (.55 + Math.sin(time * 3) * .2) + ')'); glow.addColorStop(1, 'rgba(255,245,190,0)'); ctx.fillStyle = glow; ctx.fillRect(-24, -22, 48, 48);
          ctx.save(); ctx.translate(0, 13); ctx.rotate(shake); PX.drawSprite(ctx, egg, 0, 0, 1.5); ctx.restore();
          if (scene === 3 && Math.floor(t * 5) !== Math.floor((t - dt) * 5)) sfx.pop();
        } else {
          const k = Math.min(1, t * 1.5), hop = Math.abs(Math.sin(t * 4.5)) * 5, f = Math.floor(t * 6) % 2 ? 'w1' : 'w2';
          PX.drawSprite(ctx, eggBot, -22 - k * 6, 14, 1); PX.drawSprite(ctx, eggTop, 24 + k * 6, 14, 1);
          ctx.strokeStyle = 'rgba(255,255,255,.0)'; for (let i = 0; i < 6; i++) { ctx.strokeStyle = PX.RAINBOW[i]; ctx.globalAlpha = Math.min(.9, t * .6); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 14, 36 - i * 2, Math.PI, 0); ctx.stroke(); } ctx.globalAlpha = 1;
          PX.drawSprite(ctx, uni(t < .4 ? 'idle' : f), Math.sin(t * 1.5) * 8, 13 - hop, 1.5, Math.cos(t * 1.5) < 0);
          if (Math.floor(t * 2) !== Math.floor((t - dt) * 2)) spark(BX + Math.sin(t * 1.5) * 8, BY - 4, 4, true);
        }
        ctx.restore();
      }
      for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= dt * .9; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 30 * dt; if (p.life <= 0) { parts.splice(i, 1); continue; } ctx.globalAlpha = Math.min(1, p.life * 2); ctx.drawImage(p.art, Math.round(p.x), Math.round(p.y)); ctx.globalAlpha = 1; }
      if (!done && t > SCENES[scene]) next();
    });
  });
}
