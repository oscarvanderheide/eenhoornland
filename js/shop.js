// The stall on the village square. No words and no numbers: every card shows a thing to wear and, under it, what it is
// made of, one little picture for every flower / shell / coin it takes. The ones she already has are bright, the ones
// still to find are faint. A tap trades (if she has enough), puts on or takes off. The girl on the left shows the result.
import * as PX from './pixel.js';
import * as ART from './art.js';
import * as Q from './quest.js';
import { sfx } from './audio.js';
import * as ui from './ui.js';

const CSS = `
.winkel{display:flex;gap:14px;align-items:stretch;width:min(680px,calc(100vw - 70px));max-height:calc(100vh - 90px)}
#modal .card:has(.winkel){max-width:min(760px,100%)}
.winkel canvas{image-rendering:pixelated}
.wk-me{flex:0 0 30%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;position:relative;border:3px solid var(--ink);border-radius:8px;background:linear-gradient(#CDEBFA 0 72%,#9ED98F 72%);padding:10px 6px 14px;min-height:200px;overflow:hidden}
.wk-me .kid{transform-origin:50% 100%}
.wk-me .kid.hup{animation:wkhup .5s cubic-bezier(.3,1.5,.5,1)}
.wk-me .bal{position:absolute;left:14%;top:8%;animation:bob 2.4s ease-in-out infinite}
@keyframes wkhup{0%{transform:scale(1,1)}30%{transform:scale(.9,1.14) translateY(-18px)}60%{transform:scale(1.08,.9)}100%{transform:scale(1,1)}}
.wk-side{flex:1;display:flex;flex-direction:column;gap:8px;min-width:0}
.wk-top{display:flex;justify-content:flex-end}
.wk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px;overflow:auto;padding:2px 2px 6px}
.wk{display:flex;flex-direction:column;align-items:center;justify-content:space-between;gap:6px;min-height:104px;padding:8px 4px 6px;cursor:pointer;background:#fff;border:3px solid var(--ink);border-radius:8px;box-shadow:0 3px 0 var(--ink)}
.wk:active{transform:translateY(2px);box-shadow:0 1px 0 var(--ink)}
.wk .cost{display:flex;flex-wrap:wrap;justify-content:center;gap:2px;min-height:18px}
.wk .cost canvas{opacity:.38;filter:saturate(.35)}
.wk .cost canvas.has{opacity:1;filter:none}
.wk.kan{background:#FFF3C4;box-shadow:0 0 0 3px #FFD43B,0 3px 0 var(--ink)}
.wk.own{background:#F3EEFF}
.wk.on{background:#C9F2D2;box-shadow:0 0 0 3px #5DC88A,0 3px 0 var(--ink)}
.wk.nee{animation:wob .5s ease-in-out}
.wk.nee .cost canvas:not(.has){animation:qpulse .5s ease-in-out 2;opacity:.6}
@media (max-width:640px){.winkel{flex-direction:column;width:calc(100vw - 60px)}.wk-me{flex:0 0 auto;min-height:130px;flex-direction:row;justify-content:center}.wk-grid{grid-template-columns:repeat(auto-fill,minmax(74px,1fr))}.wk{min-height:88px}}
`;
const fit = (cv, px) => PX.domSprite(cv, Math.max(1, Math.floor(px / Math.max(cv.width, cv.height))));
let styled = false;

/** getWho() says which girl is playing */
export function openShop(getWho) {
  if (!document.getElementById('modal').hidden) return;
  if (!styled) { styled = true; const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); }
  const who = getWho(), el = document.createElement('div'); el.className = 'winkel';
  el.innerHTML = `<div class="wk-me"></div><div class="wk-side"><div class="wk-top"><button class="x" data-close aria-label="Sluiten">✕</button></div><div class="wk-grid"></div></div>`;
  const me = el.querySelector('.wk-me'), grid = el.querySelector('.wk-grid');
  function drawMe(hup) {
    me.innerHTML = ''; const w = Q.wearing(who), kid = PX.domSprite(ART.hd(PX.kidSprite(who, 'idle', false, w)), innerWidth < 640 ? 3 : 5); kid.className = 'kid' + (hup ? ' hup' : ''); me.appendChild(kid);
    if (w.hand === 'ballon') { const b = PX.domSprite(PX.balloon('#FF6B6B'), 5); b.className = 'bal'; me.appendChild(b); }
  }
  function drawCards() {
    grid.innerHTML = '';
    for (const it of Q.SHOP) {
      const own = Q.owns(it.id), on = Q.wearing(who)[it.slot] === it.id, b = document.createElement('button');
      b.className = 'wk' + (own ? ' own' : Q.canBuy(it.id) ? ' kan' : '') + (on ? ' on' : ''); b.dataset.id = it.id; b.setAttribute('aria-label', it.id); b.setAttribute('aria-pressed', on);
      b.appendChild(fit(ART.wearIcon(it.id), 46));
      const cost = document.createElement('div'); cost.className = 'cost';
      if (!own) for (const [t, n] of Object.entries(it.cost)) for (let k = 0; k < n; k++) { const c = fit(t === 'munt' ? ART.coin() : ART.itemIcon(t), 18); if (k < Q.have(t)) c.className = 'has'; cost.appendChild(c); }
      b.appendChild(cost);
      b.onclick = () => {
        if (Q.owns(it.id)) { Q.wear(it.id, who); sfx.pop(); drawCards(); drawMe(true); }
        else if (Q.buy(it.id, who)) { sfx.tada(); drawCards(); drawMe(true); }            // saved first (quest.js), shown after
        else { sfx.pop(); b.classList.remove('nee'); void b.offsetWidth; b.classList.add('nee'); }   // not enough yet: the missing ones light up
      };
      grid.appendChild(b);
    }
  }
  drawMe(false); drawCards(); sfx.door();
  return ui.modal(el);
}
