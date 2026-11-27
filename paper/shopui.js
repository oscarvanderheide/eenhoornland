// The clothes shop's counter (Oscar: "the washline with clothes to buy is a cute idea but its really difficult for my kids
// to understand. we really need a shop with a vendor"). At the counter a big paper sheet opens over the game, as the
// pixel game's shop did: on the left a mirror with her in it, on the right a card for every thing to wear. No words and no
// numbers: under each card its price in coins, the ones she has bright, the ones still missing faint.
//   a tap on a card   not hers yet and enough coins: the coins fly from her row to the card, and she has it on at once
//                     not enough: the card wobbles and the missing coins blink
//                     hers already: on, or off again (a little heart on the card says it is hers)
//   closing           the round ✕, a tap beside the sheet, Escape, or ○ on the controller (paper.js readPad: .padbook)
import { cutout, drawKid } from './figures.js';
import { drawWearIcon } from './kids.js';
import { PAPER } from './kit.js';

/** the order on the shelf: the onesie first (Oscar asked for it), the dresses, then the small things */
export const SHELF = ['onesie', 'jurkregenboog', 'jurkgeel', 'jurkblauw', 'kroon', 'strik', 'krans', 'hoed', 'ketting', 'knuffel', 'ballon', 'vleugels'];
const CSS = `
#shopbook{position:fixed;inset:0;z-index:10;background:rgba(40,52,60,.55);display:grid;place-items:center;touch-action:none}
.shop-sheet{position:relative;display:flex;gap:14px;align-items:stretch;padding:14px;border-radius:22px;background:#f7f1e5;box-shadow:0 6px 0 #d8ccb4,0 14px 30px rgba(0,0,0,.35);
  max-width:calc(100vw - 24px);max-height:calc(100vh - 20px);box-sizing:border-box}
.shop-mirror{flex:0 0 auto;width:clamp(110px,20vw,190px);border-radius:50% / 42%;border:9px solid #c79a66;box-shadow:inset 0 0 0 4px #e8d5b0,0 4px 0 #a97a4e;
  background:radial-gradient(ellipse at 40% 30%,#ffffff,#dcebf0 70%);display:flex;align-items:flex-end;justify-content:center;overflow:hidden}
.shop-mirror img{width:86%;margin-bottom:6%;transform-origin:50% 100%}
.shop-mirror img.hup{animation:shophup .5s cubic-bezier(.3,1.5,.5,1)}
@keyframes shophup{0%{transform:scale(1)}30%{transform:scale(.92,1.1) translateY(-12px)}60%{transform:scale(1.06,.94)}100%{transform:scale(1)}}
.shop-grid{display:grid;grid-template-columns:repeat(6,clamp(62px,10.5vw,96px));grid-auto-rows:1fr;gap:8px;align-content:center}
.shop-card{position:relative;border:0;border-radius:14px;background:#fffdf7;box-shadow:0 3px 0 #d8ccb4;padding:4px 2px 6px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;cursor:pointer;min-height:clamp(84px,15vw,128px)}
.shop-card:active{transform:translateY(2px);box-shadow:0 1px 0 #d8ccb4}
.shop-card img.icon{width:82%;aspect-ratio:1}
.shop-card.can{background:#fff6cf;box-shadow:0 0 0 3px #f2c65c,0 3px 0 #d8ccb4}
.shop-card.own{background:#f6eefb}
.shop-card.on{background:#e3f6e6;box-shadow:0 0 0 4px #8fd0a0,0 3px 0 #d8ccb4}
.shop-card.padsel{transform:translateY(-4px) scale(1.06);box-shadow:0 0 0 4px #f4a6c4,0 6px 10px rgba(0,0,0,.2)}
.shop-card.no{animation:shopno .45s ease-in-out}
@keyframes shopno{20%{transform:rotate(-7deg)}50%{transform:rotate(6deg)}80%{transform:rotate(-3deg)}}
.shop-cost{display:flex;justify-content:center;min-height:16px;padding-left:9px}
.shop-cost img{width:16px;height:16px;margin-left:-9px;opacity:.3;filter:saturate(.2)}
.shop-cost img.has{opacity:1;filter:drop-shadow(0 1px 1px rgba(0,0,0,.25))}
.shop-card.no .shop-cost img:not(.has){animation:shopblink .3s ease-in-out 3}
@keyframes shopblink{50%{opacity:.9;transform:scale(1.3)}}
.shop-heart{width:20px;height:18px}
.shop-x{position:absolute;top:-14px;right:-14px;width:46px;height:46px;border-radius:50%;border:0;background:#f3ead8;box-shadow:0 3px 0 #b9a888,0 6px 12px rgba(0,0,0,.25);display:grid;place-items:center;cursor:pointer}
.shop-x svg{width:22px;height:22px}
`;
const HEART = '<svg class="shop-heart" viewBox="0 0 20 18"><path d="M10 17 2.2 9.4A4.6 4.6 0 0 1 10 3.6a4.6 4.6 0 0 1 7.8 5.8z" fill="#f58db9" stroke="#fffdf7" stroke-width="1.5"/></svg>';
const icons = {};
const iconOf = id => icons[id] || (icons[id] = cutout(120, 120, g => drawWearIcon(g, id), PAPER, 1).toDataURL());
let styled = false;

/** o: { kid(), worn(), owns(id), wearing(id), have(), pay(n, [sx, sy], done) -> bool, buy(id), put(id), coin (an image url), prices, sfx, keeper(how) } */
export function openShop(o) {
  if (document.getElementById('shopbook')) return null;
  if (!styled) { styled = true; const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); }
  const veil = document.createElement('div'); veil.id = 'shopbook'; veil.className = 'padbook'; veil.dataset.cols = 6;
  const sheet = document.createElement('div'); sheet.className = 'shop-sheet'; veil.appendChild(sheet);
  const mirror = document.createElement('div'); mirror.className = 'shop-mirror'; const me = new Image(); mirror.appendChild(me); sheet.appendChild(mirror);
  const grid = document.createElement('div'); grid.className = 'shop-grid'; sheet.appendChild(grid);
  const x = document.createElement('button'); x.className = 'shop-x'; x.setAttribute('aria-label', 'dicht');
  x.innerHTML = '<svg viewBox="0 0 22 22"><path d="M5 5l12 12M17 5 5 17" stroke="#6b5a4a" stroke-width="3.4" stroke-linecap="round"/></svg>'; sheet.appendChild(x);
  let busy = false;
  const drawMe = hup => { me.src = cutout(200, 276, g => drawKid(g, o.kid(), { view: 'front', wear: o.worn() }), PAPER, 1.5).toDataURL(); me.className = ''; if (hup) { void me.offsetWidth; me.className = 'hup'; } };
  const cards = SHELF.map(id => {
    const b = document.createElement('button'); b.className = 'shop-card padcard'; b.setAttribute('aria-label', id); b.dataset.id = id;
    const ic = new Image(); ic.className = 'icon'; ic.src = iconOf(id); b.appendChild(ic);
    const cost = document.createElement('div'); cost.className = 'shop-cost'; b.appendChild(cost);
    b.onclick = () => {
      if (busy) return;
      if (o.owns(id)) { o.put(id); o.sfx.click(); drawMe(true); show(); return; }
      const r = b.getBoundingClientRect();
      if (o.pay(o.prices[id], [r.left + r.width / 2, r.top + r.height * .4], () => { busy = false; o.buy(id); o.sfx.chime(); o.keeper('wave'); drawMe(true); show(); })) { busy = true; o.keeper('dress'); show(); return; }
      o.sfx.peep(); b.classList.remove('no'); void b.offsetWidth; b.classList.add('no');
    };
    grid.appendChild(b); return { id, b, cost };
  });
  function show() {
    const have = o.have();
    for (const { id, b, cost } of cards) {
      const own = o.owns(id), on = own && o.wearing(id), n = o.prices[id];
      b.classList.toggle('own', own); b.classList.toggle('on', on); b.classList.toggle('can', !own && have >= n);
      if (own) cost.innerHTML = HEART;
      else { cost.replaceChildren(...[...Array(n)].map((_, k) => { const im = new Image(); im.src = o.coin; if (k < have) im.className = 'has'; return im; })); }
    }
  }
  const close = () => { veil.remove(); removeEventListener('keydown', esc); o.sfx.click(); o.keeper('smile'); };
  const esc = e => { if (e.key === 'Escape') close(); };
  addEventListener('keydown', esc);
  veil.addEventListener('pointerdown', e => { if (e.target === veil) close(); });
  x.onclick = close;
  drawMe(false); show(); document.body.appendChild(veil); o.sfx.chime(); o.keeper('wave');
  return { close, refresh: () => { drawMe(false); show(); } };
}
