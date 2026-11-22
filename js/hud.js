// Quest HUD: today's wishes as picture chips (top-left), coins, bedtime button, and the island map.
// Everything is spoken when tapped — the players cannot read yet.
import * as PX from './pixel.js';
import * as ART from './art.js';
import * as MAP from './map.js';
import * as Q from './quest.js';
import { sfx, speak } from './audio.js';
import * as ui from './ui.js';

const ACT_ICON = { stal: () => PX.heart(), bakkerij: () => PX.cake(), kermis: () => PX.star(), atelier: () => PX.butterfly() };
const CSS = `
#quest{position:absolute;z-index:5;left:max(12px,env(safe-area-inset-left,0px));top:calc(50px + env(safe-area-inset-top,0px));display:flex;flex-wrap:wrap;gap:6px;max-width:min(70vw,420px);align-items:center}
.qchip{font-family:var(--f-pixel);font-weight:700;font-size:1.1rem;color:var(--ink);cursor:pointer;display:flex;align-items:center;gap:6px;min-height:46px;padding:4px 10px 4px 7px;
  background:var(--paper);border:3px solid var(--ink);border-radius:8px;box-shadow:inset -3px -3px 0 var(--paper2),0 3px 0 var(--ink)}
.qchip:active{transform:translateY(2px)}
.qchip canvas{image-rendering:pixelated;display:block}
.qchip.done{background:#C9F2D2;box-shadow:inset -3px -3px 0 #9ADBA9,0 3px 0 var(--ink)}
.qchip.locked{opacity:.6}
.qchip.coins{background:#FFF3C4;box-shadow:inset -3px -3px 0 #F2D675,0 3px 0 var(--ink)}
.qchip.bed{background:var(--lilac);color:#fff;font-size:1.25rem;padding-right:14px;box-shadow:inset -3px -3px 0 #8E74D6,0 3px 0 var(--ink);animation:qpulse 1.1s ease-in-out infinite;text-shadow:1px 1px 0 var(--ink)}
.qchip.bump{animation:qbump .45s cubic-bezier(.22,1,.36,1)}
@keyframes qpulse{50%{transform:scale(1.08)}}
@keyframes qbump{0%{transform:scale(1)}40%{transform:scale(1.25)}100%{transform:scale(1)}}
.kaart{display:flex;flex-direction:column;gap:10px;width:min(520px,calc(100vw - 76px))}
.kaart-map{position:relative;border:3px solid var(--ink);border-radius:6px;overflow:hidden;line-height:0}
.kaart-map canvas{width:100%;height:auto;image-rendering:pixelated;display:block}
.kaart-pin{position:absolute;transform:translate(-50%,-50%);font-family:var(--f-pixel);font-weight:700;font-size:.9rem;line-height:1.1;color:var(--ink);cursor:pointer;display:flex;align-items:center;gap:4px;
  padding:4px 7px;background:var(--paper);border:3px solid var(--ink);border-radius:8px;box-shadow:0 3px 0 var(--ink);white-space:nowrap}
.kaart-pin canvas{image-rendering:pixelated}
.kaart-me{position:absolute;transform:translate(-50%,-85%);pointer-events:none;animation:bob 1s ease-in-out infinite;z-index:2}
.kaart-egg{position:absolute;transform:translate(-50%,-50%);pointer-events:none;animation:qpulse 1s ease-in-out infinite;font-family:var(--f-pixel);font-weight:700;font-size:1.6rem;color:#fff;text-shadow:2px 2px 0 var(--ink),-2px 2px 0 var(--ink),2px -2px 0 var(--ink),-2px -2px 0 var(--ink)}
@media (max-width:640px){#quest{top:calc(60px + env(safe-area-inset-top,0px));max-width:92vw}.qchip{min-height:40px;font-size:1rem;padding:3px 7px 3px 5px}.kaart-pin span{display:none}}
`;
const fit = (cv, px) => { const s = Math.max(1, Math.floor(px / Math.max(cv.width, cv.height))); const c = PX.domSprite(cv, s); return c; };

/** getWorld() returns the world api once it has loaded (or null) */
export function createHud(getWorld) {
  const game = document.getElementById('game');
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const panel = document.createElement('div'); panel.id = 'quest'; game.appendChild(panel);
  const night = document.getElementById('b-night'); if (night) night.hidden = true;     // evening now comes by itself when the wishes are done
  const mapBtn = document.createElement('button'); mapBtn.className = 'hbtn'; mapBtn.id = 'b-map'; mapBtn.setAttribute('aria-label', 'Kaart'); mapBtn.appendChild(PX.domSprite(ART.mapIcon(), 3));
  const tr = document.querySelector('.hud.tr'); tr.insertBefore(mapBtn, tr.firstChild); mapBtn.onclick = openMap;

  let lastSig = {};
  function chip(cls, icon, text, onTap, key) {
    const b = document.createElement('button'); b.className = 'qchip ' + cls; if (icon) b.appendChild(fit(icon, 30));
    if (text) { const s = document.createElement('span'); s.textContent = text; b.appendChild(s); }
    b.onclick = () => { sfx.click(); onTap(); };
    if (key) { const sig = text + cls; if (lastSig[key] !== undefined && lastSig[key] !== sig) b.classList.add('bump'); lastSig[key] = sig; }
    panel.appendChild(b); return b;
  }
  function render() {
    panel.innerHTML = '';
    if (Q.bedtime()) chip('bed', ART.bedIcon(), 'Slapen', goToBed, 'bed'); else delete lastSig.bed;
    Q.wishes().forEach((w, i) => {
      const fin = Q.done(w), locked = w.t === 'wei' && !Q.weiOpen();
      const icon = w.t === 'item' ? ART.itemIcon(w.id) : w.t === 'act' ? (ACT_ICON[w.id] || PX.star)() : w.t === 'egg' ? ART.egg(Q.kind()) : PX.unicorn(Q.companionLook());
      const text = fin ? '✓' : w.t === 'egg' ? '?' : w.need > 1 ? w.have + '/' + w.need : '';
      chip((fin ? 'done' : '') + (locked ? ' locked' : ''), icon, text, () => speak(Q.wishText(w)), Q.quest.stage + i);
    });
    chip('coins', ART.coin(), String(Q.quest.coins), () => speak(Q.quest.coins >= Q.FOUNTAIN_PRICE ? 'Je hebt ' + Q.quest.coins + ' muntjes! Tik op de fontein in het dorp en doe een wens.' : 'Je hebt ' + (Q.quest.coins === 1 ? 'één muntje' : Q.quest.coins + ' muntjes') + '. Met ' + Q.FOUNTAIN_PRICE + ' muntjes mag je een wens doen bij de fontein.'), 'coins');
  }
  function goToBed() { const w = getWorld(); speak('Naar het huisje, lekker slapen!'); if (w && !ui.activityOpen()) w.walkToBuilding('huisje'); }

  /* ---------- island map ---------- */
  function openMap() {
    const world = getWorld(); if (!world) return; sfx.pop();
    const el = document.createElement('div'); el.className = 'book kaart';
    el.innerHTML = `<div class="book-head"><h3>Kaart</h3><button class="x" data-close aria-label="Sluiten">✕</button></div><div class="kaart-map"></div>`;
    const box = el.querySelector('.kaart-map'), src = world.groundCanvas;
    const cv = document.createElement('canvas'); cv.width = MAP.W * 8; cv.height = MAP.H * 8; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(src, 0, 0, cv.width, cv.height);
    // the sea, and roofs so the map reads at a glance
    for (let z = 0; z < MAP.H * 8; z++) for (let px = 0; px < MAP.W * 8; px += 1) if (z / 8 > MAP.shoreZ(px / 8)) { x.fillStyle = ((px >> 2) + (z >> 2)) % 7 === 0 ? '#BFEFFF' : '#5AB4E6'; x.fillRect(px, z, 1, 1); }
    const roof = (x0, z0, w, d, col) => { x.fillStyle = '#2B1E3A'; x.fillRect(x0 * 8 - 1, z0 * 8 - 1, w * 8 + 2, d * 8 + 2); x.fillStyle = col; x.fillRect(x0 * 8, z0 * 8, w * 8, d * 8); };
    roof(3, 3, 5, 4, '#7A4A3A'); roof(21, 3, 5, 4, '#4A6FB8'); roof(3, 12, 5, 4, '#D16A93'); roof(12, 2, 5, 4, '#E8616B'); roof(21, 11, 5, 5, '#E85D75'); roof(MAP.CASTLE.x, MAP.CASTLE.z, MAP.CASTLE.w, MAP.CASTLE.d, '#B9B2CF');
    box.appendChild(cv);
    const at = (el2, tx, tz) => { el2.style.left = (tx + .5) / MAP.W * 100 + '%'; el2.style.top = (tz + .5) / MAP.H * 100 + '%'; box.appendChild(el2); };
    let close = null;
    const pin = (label, icon, tx, tz, go, say) => {
      const b = document.createElement('button'); b.className = 'kaart-pin'; b.setAttribute('aria-label', label); b.appendChild(fit(icon, 22)); const s = document.createElement('span'); s.textContent = label; b.appendChild(s);
      b.onclick = e => { e.stopPropagation(); sfx.pop(); close && close(); speak(say); go(); }; at(b, tx, tz);
    };
    const P = MAP.PLACES, walk = p => () => world.walkToTile(p.tile[0], p.tile[1]);
    pin('Dorp', PX.treeRound(2), 15, 19, walk(P.dorp), 'Naar het dorp!'); pin('Huisje', ART.bedIcon(), 14, 2, () => world.walkToBuilding('huisje'), 'Naar het huisje!');
    pin('Bos', PX.pine(1), 46, 6, walk(P.bos), 'Naar het bos!'); pin('Wei', PX.heart(), 24, 28.5, walk(P.wei), 'Naar de eenhoornwei!');
    pin('Tuin', PX.carrot(), 6, 28, walk(P.tuin), 'Naar de moestuin!'); pin('Strand', ART.shell(0), 12, 39.5, walk(P.strand), 'Naar het strand!'); pin('Kasteel', PX.crown(), 54, 31, walk(P.kasteel), 'Naar het kasteel!');
    if (Q.quest.stage === 'zoek') { const c = { bloem: [8, 21], bos: [38, 12], zee: [26, 39.5], kasteel: [57, 37] }[Q.quest.zone] || [8, 21]; const e = document.createElement('div'); e.className = 'kaart-egg'; e.appendChild(fit(ART.egg(Q.kind()), 28)); e.insertAdjacentText('beforeend', '?'); e.style.display = 'flex'; e.style.alignItems = 'center'; at(e, c[0], c[1]); }
    const me = document.createElement('div'); me.className = 'kaart-me'; me.appendChild(fit(PX.anna(), 34)); const [mx, mz] = world.pos(); at(me, mx - .5, mz - .5);
    close = ui.modal(el);
    speak(Q.quest.stage === 'zoek' ? 'Dit is de kaart. Waar zou het ei liggen? Tik op een plek om erheen te lopen!' : 'Dit is de kaart van Eenhoornland. Tik op een plek om erheen te lopen!');
  }

  Q.on(type => { if (type === 'change') render(); });
  render();
  return { render, openMap, goToBed };
}
