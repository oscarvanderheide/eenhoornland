// The game houses on the rainbow island (Oscar: "candy island has little to do. in pixel art game we had houses with
// games. lets do that as well. memory is a nice game. i also liked the thing where we could make a drawing with like
// stamps. perhaps you have nice ideas too"). Three little sweet houses, each with a picture over its door that says what
// is inside. A tap on a house: she walks to the door, and a paper sheet opens over the game (as the shop's does). No words
// and no numbers anywhere.
//   memory      twelve cards face down; turn two, a pair stays up; all pairs found: stars, a coin, and a fresh deal
//   stamps      a sheet of paper, eight stamps and five ink pads: pick, and stamp wherever she taps. Her picture is
//               kept, and hangs on the front of the house when she comes out
//   xylophone   (an idea of ours) eight rainbow bars to play freely; a tap on the bird and it plays a little tune, lighting
//               the bars; she plays it back and the bird dances, and the next tune is one note longer. Never wrong:
//               a wrong bar and the bird just plays it again
// Closing: the round ✕, a tap beside the sheet, Escape, or ○ on the controller (paper.js readPad: .padbook, .padcard).
import { THREE, paper, card, PAPER } from './kit.js';
import { cutout, FIGS } from './figures.js';
import { ANIMALS } from './animals.js';
import { ANIMALS2 } from './animals2.js';

const CSS = `
#gamebook{position:fixed;inset:0;z-index:10;background:rgba(40,52,60,.55);display:grid;place-items:center;touch-action:none}
.gm-sheet{position:relative;padding:14px;border-radius:22px;background:#f7f1e5;box-shadow:0 6px 0 #d8ccb4,0 14px 30px rgba(0,0,0,.35);max-width:calc(100vw - 24px);max-height:calc(100vh - 20px);box-sizing:border-box;display:flex;gap:12px;align-items:center}
.gm-x{position:absolute;top:-14px;right:-14px;width:46px;height:46px;border-radius:50%;border:0;background:#f3ead8;box-shadow:0 3px 0 #b9a888,0 6px 12px rgba(0,0,0,.25);display:grid;place-items:center;cursor:pointer;z-index:2}
.gm-x svg{width:22px;height:22px}
.gm-btn{width:54px;height:54px;border-radius:50%;border:0;background:#f3ead8;box-shadow:0 3px 0 #b9a888;display:grid;place-items:center;cursor:pointer;flex:0 0 auto}
.gm-btn:active{transform:translateY(2px);box-shadow:0 1px 0 #b9a888}
.gm-btn svg{width:30px;height:30px}
.padsel{outline:4px solid #f4a6c4;outline-offset:2px}
/* memory */
.mem-grid{display:grid;grid-template-columns:repeat(4,clamp(52px,min(13vw,19vh),110px));gap:8px;perspective:600px}
.mem-card{position:relative;aspect-ratio:1;border:0;padding:0;background:none;cursor:pointer;transform-style:preserve-3d;transition:transform .35s}
.mem-card.up{transform:rotateY(180deg)}
.mem-card.found{animation:mempop .5s}
@keyframes mempop{50%{transform:rotateY(180deg) scale(1.12)}}
.mem-card .face,.mem-card .back{position:absolute;inset:0;border-radius:12px;backface-visibility:hidden;box-shadow:0 3px 0 #d8ccb4;display:grid;place-items:center}
.mem-card .back{background:#f4a6c4 radial-gradient(circle at 50% 50%,#fbd9e6 0 18%,transparent 19%) 0 0/50% 50%}
.mem-card .face{background:#fffdf7;transform:rotateY(180deg)}
.mem-card .face img{width:84%;height:84%;object-fit:contain}
.mem-card.found .face{background:#e3f6e6}
/* stamps */
.st-col{display:flex;flex-direction:column;gap:6px;align-items:center}
.st-paper{background:#fffdf7;border-radius:6px;box-shadow:0 3px 0 #d8ccb4,inset 0 0 0 1px #eadfc9;touch-action:none;cursor:crosshair;height:min(72vh,330px);aspect-ratio:3/2;max-width:calc(100vw - 280px);object-fit:contain}
.st-stamps{display:grid;grid-template-columns:repeat(2,52px);gap:6px}
.st-stamp,.st-ink{border:0;border-radius:12px;background:#fffdf7;box-shadow:0 3px 0 #d8ccb4;cursor:pointer;padding:3px}
.st-stamp{width:52px;height:52px}
.st-stamp img{width:100%;height:100%;object-fit:contain}
.st-stamp.on{background:#fff3c4;box-shadow:0 0 0 3px #f2c65c,0 3px 0 #d8ccb4}
.st-ink{width:30px;height:30px;border-radius:50%}
.st-inks{display:grid;grid-template-columns:repeat(2,30px);gap:7px}
.st-ink.on{box-shadow:0 0 0 3px #6b5a4a,0 3px 0 #d8ccb4;transform:scale(1.1)}
/* xylophone */
.xy-wrap{display:flex;flex-direction:column;align-items:center;gap:8px}
.xy-bird{width:clamp(70px,16vh,110px);height:auto;cursor:pointer;transform-origin:50% 100%;border:0;background:none;padding:0}
.xy-bird img{width:100%}
.xy-bird.sing{animation:xysing .35s ease-in-out infinite alternate}
.xy-bird.dance{animation:xydance .4s ease-in-out 4 alternate}
@keyframes xysing{to{transform:rotate(-6deg) scale(1.05)}}
@keyframes xydance{0%{transform:translateY(0) rotate(-10deg)}100%{transform:translateY(-16px) rotate(10deg)}}
.xy-bars{display:flex;align-items:center;gap:6px;padding:10px 14px;border-radius:14px;background:#c79a66;box-shadow:0 4px 0 #a97a4e}
.xy-bar{width:clamp(34px,7vw,58px);border:0;border-radius:9px;cursor:pointer;box-shadow:0 3px 0 rgba(0,0,0,.18);transition:transform .08s,filter .08s;position:relative}
.xy-bar::before,.xy-bar::after{content:'';position:absolute;left:50%;width:9px;height:9px;margin-left:-4.5px;border-radius:50%;background:#fbf5ea;opacity:.8}
.xy-bar::before{top:9px}.xy-bar::after{bottom:9px}
.xy-bar.lit{transform:translateY(3px) scale(1.06);filter:brightness(1.25) saturate(1.2);box-shadow:0 0 18px 4px rgba(255,240,180,.9)}
.xy-dots{display:flex;gap:5px;min-height:14px}
.xy-dots i{width:12px;height:12px;border-radius:50%;background:#e2d6c1}
.xy-dots i.on{background:#f2c65c}
`;
let styled = false;
const style = () => { if (styled) return; styled = true; const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); };
const X_SVG = '<svg viewBox="0 0 22 22"><path d="M5 5l12 12M17 5 5 17" stroke="#6b5a4a" stroke-width="3.4" stroke-linecap="round"/></svg>';
const AGAIN_SVG = '<svg viewBox="0 0 32 32"><path d="M24 11a9 9 0 1 0 1.5 8" fill="none" stroke="#6b5a4a" stroke-width="3.4" stroke-linecap="round"/><path d="M25 4v8h-8" fill="none" stroke="#6b5a4a" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const NEW_SVG = '<svg viewBox="0 0 32 32"><path d="M8 4h11l6 6v18H8z" fill="#fffdf7" stroke="#6b5a4a" stroke-width="2.4" stroke-linejoin="round"/><path d="M19 4v6h6" fill="none" stroke="#6b5a4a" stroke-width="2.4" stroke-linejoin="round"/></svg>';
const pics = {};
/** a paper figure's first drawing as a picture (for the cards and the bird) */
const picOf = (key, spec) => pics[key] || (pics[key] = cutout(spec.w, spec.h, g => (spec.front && key === 'baby' ? spec.front : spec.draw)(g, 0), PAPER, 1));

/** the sheet over the game; returns { veil, sheet, close } */
function sheetOpen(o, cols) {
  style();
  const veil = document.createElement('div'); veil.id = 'gamebook'; veil.className = 'padbook'; if (cols) veil.dataset.cols = cols;
  const sheet = document.createElement('div'); sheet.className = 'gm-sheet'; veil.appendChild(sheet);
  const x = document.createElement('button'); x.className = 'gm-x shop-x'; x.setAttribute('aria-label', 'dicht'); x.innerHTML = X_SVG; sheet.appendChild(x);
  let shut = false; const esc = e => { if (e.key === 'Escape') close(); };
  const close = () => { if (shut) return; shut = true; veil.remove(); removeEventListener('keydown', esc); o.sfx.click(); if (o.closed) o.closed(); };
  addEventListener('keydown', esc); veil.addEventListener('pointerdown', e => { if (e.target === veil) close(); }); x.onclick = close;
  document.body.appendChild(veil); return { veil, sheet, close, isOpen: () => !shut };
}

/* ---------------- memory ---------------- */
const MEMO = () => [['eend', ANIMALS.eend], ['uil', ANIMALS.uil], ['krab', ANIMALS2.krab], ['flamingo', ANIMALS2.flamingo], ['konijn', ANIMALS2.konijn], ['baby', FIGS.baby]];
export function openMemory(o) {
  if (document.getElementById('gamebook')) return null;
  const S = sheetOpen(o, 4), grid = document.createElement('div'); grid.className = 'mem-grid'; S.sheet.appendChild(grid);
  const again = document.createElement('button'); again.className = 'gm-btn padcard'; again.innerHTML = AGAIN_SVG; again.setAttribute('aria-label', 'opnieuw'); S.sheet.appendChild(again);
  let up = [], busy = false, found = 0, wins = 0;
  const deal = () => {
    grid.replaceChildren(); up = []; found = 0; busy = false;
    const deck = MEMO().flatMap(p => [p, p]); for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    for (const [key, spec] of deck) {
      const b = document.createElement('button'); b.className = 'mem-card padcard'; b.dataset.key = key; b.setAttribute('aria-label', 'kaart');
      const back = document.createElement('div'); back.className = 'back'; const face = document.createElement('div'); face.className = 'face'; const im = new Image(); im.src = picOf(key, spec).toDataURL(); face.appendChild(im); b.append(back, face);
      b.onclick = () => {
        if (busy || b.classList.contains('up')) return; b.classList.add('up'); up.push(b); o.sfx.click();
        if (up.length < 2) return;
        const [p, q] = up; up = [];
        if (p.dataset.key === q.dataset.key) { setTimeout(() => { p.classList.add('found'); q.classList.add('found'); o.sfx.chime(); found++;
          if (found === 6) { wins++; o.won('memory'); setTimeout(() => { if (S.isOpen()) deal(); }, 2600); } }, 380); }
        else { busy = true; setTimeout(() => { p.classList.remove('up'); q.classList.remove('up'); busy = false; o.sfx.peep(); }, 1100); }
      };
      grid.appendChild(b);
    }
  };
  again.onclick = () => { o.sfx.swish(1); deal(); };
  deal(); o.sfx.chime();
  return { close: S.close, state: () => ({ found, wins, cards: [...grid.querySelectorAll('.mem-card')].map(c => c.dataset.key) }) };
}

/* ---------------- stamps ---------------- */
const INKS = ['#e8505b', '#f2994b', '#f2c65c', '#5dc88a', '#4e9cd4', '#9a7ad6', '#f58db9', '#5a4e66'];
/** a stamp is a shape (a path) or a figure's silhouette; drawn in `ink` about (0, 0), about 1 across */
const SHAPES = {
  hart: g => { g.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2; g.lineTo(.5 * Math.sin(a) ** 3, -.034 * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a))); } g.fill(); },
  ster: g => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .22 : .5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); },
  bloem: g => { for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; g.beginPath(); g.arc(Math.cos(a) * .26, Math.sin(a) * .26, .2, 0, Math.PI * 2); g.fill(); } g.save(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(0, 0, .1, 0, Math.PI * 2); g.fill(); g.restore(); },
  zon: g => { g.beginPath(); g.arc(0, 0, .25, 0, Math.PI * 2); g.fill(); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.beginPath(); g.moveTo(Math.cos(a - .14) * .32, Math.sin(a - .14) * .32); g.lineTo(Math.cos(a) * .5, Math.sin(a) * .5); g.lineTo(Math.cos(a + .14) * .32, Math.sin(a + .14) * .32); g.fill(); } },
};
const SILS = () => [['eenhoorn', FIGS.baby], ['eend', ANIMALS.eend], ['konijn', ANIMALS2.konijn], ['vis', ANIMALS2.dolfijn]];
function stampCanvas(kind, ink, px) {
  const c = document.createElement('canvas'); c.width = c.height = px; const g = c.getContext('2d'); g.fillStyle = ink;
  if (SHAPES[kind]) { g.translate(px / 2, px / 2); g.scale(px * .9, px * .9); SHAPES[kind](g); }
  else { const [, spec] = SILS().find(([k]) => k === kind), im = picOf(kind, spec), k = Math.min(px / im.width, px / im.height) * .95; g.drawImage(im, (px - im.width * k) / 2, (px - im.height * k) / 2, im.width * k, im.height * k); g.globalCompositeOperation = 'source-in'; g.fillRect(0, 0, px, px); }
  // a rubber stamp never prints quite evenly: little specks where no ink came
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < px * 1.2; i++) { g.globalAlpha = .3 + Math.random() * .5; g.fillRect(Math.random() * px, Math.random() * px, 1 + Math.random() * 2, 1 + Math.random() * 2); }
  return c;
}
export function openStamps(o) {
  if (document.getElementById('gamebook')) return null;
  const S = sheetOpen(o, 2), left = document.createElement('div'); left.className = 'st-col'; const stamps = document.createElement('div'); stamps.className = 'st-stamps'; left.appendChild(stamps);
  const pad = document.createElement('canvas'); pad.className = 'st-paper'; pad.width = 900; pad.height = 600;
  const right = document.createElement('div'); right.className = 'st-col';
  const fresh = document.createElement('button'); fresh.className = 'gm-btn padcard'; fresh.innerHTML = NEW_SVG; fresh.setAttribute('aria-label', 'nieuw blad');
  S.sheet.append(left, pad, right);
  const pg = pad.getContext('2d'); if (o.picture) pg.drawImage(o.picture, 0, 0); else { pg.fillStyle = '#fffdf7'; pg.fillRect(0, 0, 900, 600); }
  let kind = 'hart', ink = INKS[0], n = 0;
  const kinds = [...Object.keys(SHAPES), ...SILS().map(([k]) => k)];
  const sb = kinds.map(k => { const b = document.createElement('button'); b.className = 'st-stamp padcard' + (k === kind ? ' on' : ''); b.setAttribute('aria-label', k); const im = new Image(); im.src = stampCanvas(k, '#6b5a4a', 96).toDataURL(); b.appendChild(im);
    b.onclick = () => { kind = k; sb.forEach(q => q.classList.toggle('on', q === b)); o.sfx.click(); if (b.classList.contains('padsel')) stampAt(150 + Math.random() * 600, 120 + Math.random() * 360); }; stamps.appendChild(b); return b; });
  const inks = document.createElement('div'); inks.className = 'st-inks'; right.appendChild(inks);
  const ib = INKS.map(c => { const b = document.createElement('button'); b.className = 'st-ink padcard' + (c === ink ? ' on' : ''); b.style.background = c; b.setAttribute('aria-label', 'inkt');
    b.onclick = () => { ink = c; ib.forEach(q => q.classList.toggle('on', q === b)); o.sfx.click(); }; inks.appendChild(b); return b; });
  right.appendChild(fresh);
  function stampAt(x, y) {
    const size = 120 + Math.random() * 30, st = stampCanvas(kind, ink, Math.round(size));
    pg.save(); pg.translate(x, y); pg.rotate((Math.random() - .5) * .5); pg.globalAlpha = .92; pg.drawImage(st, -size / 2, -size / 2); pg.restore(); n++; o.sfx.thud();
    if (n === 12) o.won('stamps');
  }
  pad.addEventListener('pointerdown', e => { const r = pad.getBoundingClientRect(); stampAt((e.clientX - r.left) / r.width * 900, (e.clientY - r.top) / r.height * 600); });
  fresh.onclick = () => { pg.fillStyle = '#fffdf7'; pg.fillRect(0, 0, 900, 600); n = 0; o.sfx.swish(1); };
  o.closed = () => { o.keep(pad); };   // her picture: kept, and hung on the house
  o.sfx.chime();
  return { close: S.close, state: () => ({ kind, ink, stamped: n }), stampAt };
}

/* ---------------- the xylophone and the bird ---------------- */
const BARS = [['#e8505b', 523.3], ['#f2994b', 587.3], ['#f2c65c', 659.3], ['#9ed96e', 698.5], ['#5dc88a', 784], ['#4e9cd4', 880], ['#7c74d8', 987.8], ['#c27ad6', 1046.5]];
export function openXylophone(o) {
  if (document.getElementById('gamebook')) return null;
  const S = sheetOpen(o, 9), wrap = document.createElement('div'); wrap.className = 'xy-wrap'; S.sheet.appendChild(wrap);
  const bird = document.createElement('button'); bird.className = 'xy-bird padcard'; bird.setAttribute('aria-label', 'vogel'); const bi = new Image(); bi.src = picOf('papegaai', ANIMALS2.papegaai).toDataURL(); bird.appendChild(bi);
  const dots = document.createElement('div'); dots.className = 'xy-dots';
  const bars = document.createElement('div'); bars.className = 'xy-bars';
  wrap.append(bird, dots, bars);
  let tune = [], heard = [], playing = false, len = 3, rounds = 0;
  const light = (i, ms = 260) => { const b = barEls[i]; b.classList.add('lit'); o.sfx.note(BARS[i][1]); setTimeout(() => b.classList.remove('lit'), ms); };
  const barEls = BARS.map(([c], i) => { const b = document.createElement('button'); b.className = 'xy-bar padcard'; b.style.background = c; b.style.height = (150 - i * 11) + 'px'; b.setAttribute('aria-label', 'toon');
    b.onclick = () => { if (playing) return; light(i); if (!tune.length) return; heard.push(i); showDots();
      if (heard[heard.length - 1] !== tune[heard.length - 1]) { heard = []; setTimeout(() => sing(), 700); return; }   // not that one: the bird plays it again
      if (heard.length === tune.length) { rounds++; bird.classList.add('dance'); o.sfx.chime(); setTimeout(() => bird.classList.remove('dance'), 1700); if (tune.length >= 4) o.won('xylophone'); tune = []; heard = []; len = Math.min(8, len + 1); setTimeout(showDots, 300); } };
    bars.appendChild(b); return b; });
  const showDots = () => { dots.replaceChildren(...tune.map((_, i) => { const d = document.createElement('i'); if (i < heard.length) d.className = 'on'; return d; })); };
  // the bird's tune: steps up and down the bars, never a jump too far for small hands
  const newTune = () => { const t = [Math.floor(Math.random() * 5)]; while (t.length < len) { let n = t[t.length - 1] + [-2, -1, 1, 2][Math.floor(Math.random() * 4)]; n = Math.max(0, Math.min(7, n)); t.push(n); } return t; };
  function sing() { if (playing) return; if (!tune.length) tune = newTune(); heard = []; showDots(); playing = true; bird.classList.add('sing');
    tune.forEach((n, k) => setTimeout(() => light(n, 380), 350 + k * 520)); setTimeout(() => { playing = false; bird.classList.remove('sing'); }, 350 + tune.length * 520); }
  bird.onclick = () => sing();
  o.sfx.chime();
  return { close: S.close, state: () => ({ tune: [...tune], heard: [...heard], rounds, playing }), play: i => barEls[i].click(), sing };
}

/* ---------------- the houses ---------------- */
/** the picture over each door: two cards (one turned), a stamp with a heart, the bird on its bars */
export function signFor(kind) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const rr = (x, y, w, h, r, col, rot = 0) => { g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(rot); g.fillStyle = col; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, r); g.fill(); g.restore(); };
  if (kind === 'memory') { rr(18, 26, 50, 70, 9, '#f4a6c4', -.18); rr(60, 30, 50, 70, 9, '#fffdf7', .14); rr(62, 32, 46, 66, 8, '#fffdf7', .14); g.drawImage(stampCanvas('hart', '#e8505b', 40), 66, 44); }
  if (kind === 'stamps') { rr(40, 18, 48, 34, 8, '#c79a66'); rr(56, 50, 16, 22, 4, '#a97a4e'); rr(30, 70, 68, 16, 5, '#5a4e66'); g.drawImage(stampCanvas('hart', '#e8505b', 44), 42, 82); }
  if (kind === 'xylophone') { BARS.forEach(([col], i) => rr(14 + i * 13, 40 + i * 4, 11, 78 - i * 8, 4, col)); g.drawImage(picOf('papegaai', ANIMALS2.papegaai), 70, 4, 50, 56); }
  return c;
}

const m3 = (geo, col, o) => { const m = new THREE.Mesh(geo, paper(col, o)); m.castShadow = m.receiveShadow = true; return m; };
const HOUSE = {
  memory: { wall: '#bfe3f2', roof: '#f4a6c4', trim: '#fbf5ea', open: openMemory },
  stamps: { wall: '#fde3b8', roof: '#9ed9cf', trim: '#fbf5ea', open: openStamps },
  xylophone: { wall: '#e3d6f6', roof: '#f2c65c', trim: '#fbf5ea', open: openXylophone },
};
/** a sweet little house at (x, z) with its door to the south. o: { name, kind, sign: a canvas for over the door, sfx, won(kind) } */
export function gameHouse(S, x, z, y, kind, sign = signFor(kind)) {
  const { girl, sfx } = S, H = HOUSE[kind], g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g);
  const W = 2.3, D = 1.8, HT = 1.6;
  const body = m3(new THREE.BoxGeometry(W, HT, D), H.wall); body.position.y = HT / 2; g.add(body);
  // the roof: two slopes with a thick white icing edge dripping over the front
  for (const s of [-1, 1]) { const r = m3(new THREE.BoxGeometry(W + .3, .12, D * .62), H.roof); r.position.set(0, HT + .42, s * D * .27); r.rotation.x = s * .72; g.add(r); }
  { const ice = card([[-W / 2 - .15, 0], [W / 2 + .15, 0], ...Array.from({ length: 9 }, (_, i) => { const px = W / 2 + .15 - (i + .5) * (W + .3) / 9; return [px, i % 2 ? -.22 : -.12]; })], .03, paper(H.trim)); ice.position.set(0, HT + .05, D / 2 + .02); g.add(ice); }
  { const gable = card([[-W / 2, 0], [W / 2, 0], [0, .78]], .04, paper(H.wall)); gable.position.set(0, HT, D / 2 - .01); g.add(gable); }
  // the door, a round window each side, and the picture over the door that says what is inside
  { const door = card([[-.3, 0], [.3, 0], [.3, .75], [.22, .92], [0, 1.0], [-.22, .92], [-.3, .75]], .04, paper('#c79a66')); door.position.set(0, 0, D / 2 + .01); g.add(door);
    const knob = m3(new THREE.SphereGeometry(.04, 8, 6), '#e0b453'); knob.position.set(.18, .5, D / 2 + .06); g.add(knob);
    for (const s of [-1, 1]) { const w = m3(new THREE.CylinderGeometry(.2, .2, .04, 18), '#fbf5ea'); w.rotation.x = Math.PI / 2; w.position.set(s * .72, .95, D / 2 + .01); g.add(w); const gl = m3(new THREE.CylinderGeometry(.15, .15, .05, 18), '#8fc3e0'); gl.rotation.x = Math.PI / 2; gl.position.set(s * .72, .95, D / 2 + .02); g.add(gl); } }
  const board = m3(new THREE.CylinderGeometry(.36, .36, .05, 24), '#fbf5ea'); board.rotation.x = Math.PI / 2; board.position.set(0, HT + .38, D / 2 + .08); g.add(board);
  { const t = new THREE.CanvasTexture(sign); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(.56, .56), new THREE.MeshStandardMaterial({ map: t, alphaTest: .4, roughness: .9 })); m.position.set(0, HT + .38, D / 2 + .115); g.add(m); }
  // (the stamp house: her last picture hangs on its wall beside the door)
  let frame = null; const hang = c => { if (!frame) { frame = new THREE.Mesh(new THREE.PlaneGeometry(.66, .44), new THREE.MeshStandardMaterial({ roughness: .9 })); frame.position.set(-.72, .95, D / 2 + .04); const b = m3(new THREE.BoxGeometry(.74, .52, .03), '#c79a66'); b.position.set(-.72, .95, D / 2 + .02); g.add(b, frame); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; if (frame.material.map) frame.material.map.dispose(); frame.material.map = t; frame.material.needsUpdate = true; };
  S.wall(x, z, W / 2 + .1, D / 2 + .1); S.solid({ x, z, r: .2 });
  const [fx, fz] = S.at([x, z + D / 2 + .7]); let opened = 0, sheet = null, picture = null, wins = 0;
  const o = { sfx, won: () => { wins++; const [wx, wz] = S.at([x, z + D / 2]); S.coins.earn(wx, y + 2, wz); },
    keep: pad => { picture = pad; const small = document.createElement('canvas'); small.width = 300; small.height = 200; small.getContext('2d').drawImage(pad, 0, 0, 300, 200); hang(small); } };
  const enter = () => { if (S.playing() || document.getElementById('gamebook') || document.getElementById('shopbook')) return;
    S.walkThen(fx, fz, () => { girl.view = 'back'; opened++; sfx.door(1); sheet = H.open({ ...o, picture }); setTimeout(() => sfx.door(0), 300); }, .9); };
  S.tap(g, enter, 'huisje-' + kind);
  return { state: () => ({ opened, wins, open: !!document.getElementById('gamebook'), game: sheet && sheet.state ? sheet.state() : null, hung: !!frame }), sheet: () => sheet, places: { door: [x, z + D / 2 + .7] } };
}
