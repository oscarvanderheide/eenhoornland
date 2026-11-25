// The three saves, for girls who cannot read: each save has its own colour and shows who played it and her egg or
// unicorn. Tap a save to play it (the page starts again in that save), hold the bin under one to start it afresh
// (a hold, not a tap, so it never happens by accident). Opened by the button top right and on the start screen;
// with a controller, Options.
import * as PX from './pixel.js';
import * as ART from './art.js';
import { KINDS } from './quest.js';
import { SLOTS, slot, slotKey, setSlot, freezeSaves, save } from './state.js';
import { sfx } from './audio.js';
import * as ui from './ui.js';

const HOLD = 1300;   // ms the bin must be held
const CSS = `
.saves{display:flex;flex-direction:column;gap:12px;align-items:center}
.saves-row{display:flex;gap:clamp(10px,3vw,22px);justify-content:center;align-items:flex-start}
.save-col{display:flex;flex-direction:column;align-items:center;gap:10px}
.save{width:clamp(92px,24vw,150px);height:clamp(112px,28vw,170px);border:4px solid var(--ink);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;cursor:pointer;padding:6px;box-shadow:0 5px 0 var(--ink)}
.save:active{transform:translateY(3px);box-shadow:0 2px 0 var(--ink)}
.save.cur{box-shadow:0 0 0 5px #FFD43B,0 5px 0 var(--ink);animation:qnow 2.4s ease-in-out infinite}
.save canvas{image-rendering:pixelated;display:block}
.save .empty{filter:brightness(0) invert(1) opacity(.7)}
.save .who-faces{display:flex;gap:4px;min-height:30px;align-items:flex-end}
.save-bin{position:relative;width:52px;height:52px;border-radius:50%;border:3px solid var(--ink);background:#fff;cursor:pointer;display:grid;place-items:center;touch-action:none;box-shadow:0 3px 0 var(--ink)}
.save-bin canvas{image-rendering:pixelated;position:relative}
.save-bin.hold{animation:binshake .18s linear infinite;background:#FF5C5C;box-shadow:0 0 0 9px #FF9A9A,0 3px 0 var(--ink);transition:background ${HOLD}ms linear,box-shadow ${HOLD}ms linear}
@keyframes binshake{25%{transform:rotate(-6deg)}75%{transform:rotate(6deg)}}
.save-bin.gone{visibility:hidden}
#start-saves{position:absolute;right:max(16px,env(safe-area-inset-right,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));width:64px;height:56px;padding:0;display:grid;place-items:center}
#start-saves canvas,#b-save canvas{image-rendering:pixelated}
`;
let styled = false;
const style = () => { if (styled) return; styled = true; const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); };

/** what is in save n (null when it is empty) */
export function peek(n) {
  try { const s = JSON.parse(localStorage.getItem(slotKey(n)) || 'null'); return s && s.extra && s.extra.quest ? s : null; } catch (e) { return null; }
}
const faces = { anna: 9, fenna: 11 };
const head = who => { const cv = PX[who](), c = document.createElement('canvas'); c.width = cv.width; c.height = faces[who]; c.getContext('2d').drawImage(cv, 0, 0); return PX.domSprite(c, 3); };
/** the picture of a save: her unicorn once one has hatched in it, else the egg she is looking for */
function picture(s) {
  const q = s.extra.quest, hatched = ['baby', 'vriend', 'feest'].includes(q.stage) || (q.herd && q.herd.length);
  return hatched ? ART.uniSprite(Object.assign({ body: '#FFFFFF', mane: 'rainbow', horn: '#F7C548' }, s.uni), 'idle', false, { baby: true }) : ART.egg(KINDS[q.kind] || KINDS.bos);
}

/** play save n: the page starts again in it (every module reads its state when it loads) */
export function playSlot(n) {
  if (n === slot) return;
  save(); freezeSaves(); setSlot(n);
  const u = new URL(location.href); u.searchParams.delete('slot'); location.replace(u.href);
}
/** throw save n away; the one being played starts afresh at once */
export function wipeSlot(n) {
  try { localStorage.removeItem(slotKey(n)); } catch (e) { }
  if (n === slot) { freezeSaves(); const u = new URL(location.href); u.searchParams.delete('slot'); location.replace(u.href); }
}

export function openSaves() {
  style(); if (!document.getElementById('modal').hidden) return; sfx.pop();
  const el = document.createElement('div'); el.className = 'book saves';
  el.innerHTML = `<div class="book-head"><h3>&nbsp;</h3><button class="x" data-close aria-label="Sluiten">✕</button></div><div class="saves-row"></div>`;
  const row = el.querySelector('.saves-row');
  let close = null;
  function draw() {
    row.innerHTML = '';
    for (let n = 1; n <= SLOTS; n++) {
      const s = peek(n), [col, light] = ART.SLOT_COLS[n - 1];
      const colEl = document.createElement('div'); colEl.className = 'save-col';
      const b = document.createElement('button'); b.className = 'save' + (n === slot ? ' cur' : ''); b.dataset.slot = n;
      b.setAttribute('aria-label', 'Spel ' + n); b.style.background = `linear-gradient(${light},${col})`;
      const who = document.createElement('div'); who.className = 'who-faces'; b.appendChild(who);
      if (s) {
        const w = s.extra.who; if (faces[w]) who.appendChild(head(w));
        const p = picture(s), c = PX.domSprite(p, Math.max(2, Math.floor(64 / Math.max(p.width, p.height)))); b.appendChild(c);
      } else {
        const p = ART.egg(KINDS.bos), c = PX.domSprite(p, 4); c.classList.add('empty'); b.appendChild(c);
      }
      b.onclick = () => { if (n === slot) { sfx.click(); close && close(); } else { sfx.sparkle(); playSlot(n); } };
      colEl.appendChild(b);
      // the bin: hold it until it is all red (a transition, not an animation: it must fill with 'reduce motion' on too)
      const bin = document.createElement('button'); bin.className = 'save-bin' + (s ? '' : ' gone'); bin.setAttribute('aria-label', 'Spel ' + n + ' weggooien (vasthouden)');
      bin.appendChild(PX.domSprite(ART.binIcon(), 4)); colEl.appendChild(bin);
      let timer = 0;
      const stop = () => { clearTimeout(timer); timer = 0; bin.classList.remove('hold'); };
      bin.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation(); if (timer) return; bin.classList.add('hold'); sfx.click();
        timer = setTimeout(() => { timer = 0; bin.classList.remove('hold'); sfx.pop(); wipeSlot(n); draw(); }, HOLD);
      });
      for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) bin.addEventListener(ev, stop);
      bin.addEventListener('click', e => e.stopPropagation());
      row.appendChild(colEl);
    }
  }
  draw();
  close = ui.modal(el);
}

/** the button on the start screen (the HUD has its own, see hud.js) */
export function startButton(parent) {
  style();
  const b = document.createElement('button'); b.className = 'pbtn'; b.id = 'start-saves'; b.setAttribute('aria-label', 'Ander spel');
  b.appendChild(PX.domSprite(ART.slotsIcon(slot), 3)); b.onclick = e => { e.stopPropagation(); openSaves(); }; parent.appendChild(b);
  return b;
}
export const slotIcon = () => ART.slotsIcon(slot);
