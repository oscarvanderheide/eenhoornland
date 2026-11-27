// The log cabin's game: a colouring page (the cabin stands where the pixel game had its atelier). A tap on the easel and
// a paper sheet opens over the game, as the shop's and the game houses' do. No words and no numbers anywhere.
//   the paint pots   ten round pots down the left: a tap picks a colour (the pot lifts up)
//   the picture      a drawing of cut paper pieces with thick dark edges: a tap on a piece fills it with the colour,
//                    the paint spreading out from her finger. Every piece coloured: stars, a chime, and o.won()
//   new page         the button on the right shows the next drawing small: a tap and that one comes, clean
//   closing          the round ✕, a tap beside the sheet, Escape, or ○ on the controller (paper.js readPad: .padbook,
//                    .padcard). With a controller ✕ on a pot fills the next piece. Her picture is given to o.keep
//                    when the sheet closes, so the room can hang it on the wall
// The drawings are made in a 600 × 400 measure; the canvas is drawn larger and every tap is turned back into that measure.

const CSS = `
#artbook{position:fixed;inset:0;z-index:10;background:rgba(40,52,60,.55);display:grid;place-items:center;touch-action:none}
.at-sheet{position:relative;padding:14px;border-radius:22px;background:#f7f1e5;box-shadow:0 6px 0 #d8ccb4,0 14px 30px rgba(0,0,0,.35);max-width:calc(100vw - 24px);max-height:calc(100vh - 20px);box-sizing:border-box;display:flex;gap:12px;align-items:center}
.at-x{position:absolute;top:-14px;right:-14px;width:46px;height:46px;border-radius:50%;border:0;background:#f3ead8;box-shadow:0 3px 0 #b9a888,0 6px 12px rgba(0,0,0,.25);display:grid;place-items:center;cursor:pointer;z-index:2}
.at-x svg{width:22px;height:22px}
.at-pots{display:grid;grid-template-columns:repeat(2,auto);gap:6px}
.at-pot{--s:clamp(34px,calc((min(72vh,330px) - 24px) / 5),58px);width:var(--s);height:var(--s);border:0;padding:0;border-radius:50%;cursor:pointer;position:relative;
  background:radial-gradient(circle at 50% 50%,var(--c) 0 56%,#fbf5ea 57% 70%,#d9cbb2 71%);box-shadow:0 3px 0 #c9b998;transition:transform .12s}
.at-pot::after{content:'';position:absolute;left:30%;top:24%;width:16%;height:12%;border-radius:50%;background:rgba(255,255,255,.55)}
.at-pot:active{transform:translateY(2px);box-shadow:0 1px 0 #c9b998}
.at-pot.on{transform:translateY(-4px) scale(1.12);box-shadow:0 0 0 3px #6b5a4a,0 6px 8px rgba(0,0,0,.2)}
.at-pot.padsel{outline:4px solid #f4a6c4;outline-offset:2px}
.at-wrap{position:relative;flex:0 0 auto}
.at-page{display:block;height:min(72vh,330px);aspect-ratio:3/2;max-width:calc(100vw - 230px);object-fit:contain;background:#fffdf7;border-radius:8px;box-shadow:0 3px 0 #d8ccb4,inset 0 0 0 1px #eadfc9;touch-action:none;cursor:pointer}
.at-page.yay{animation:atyay .7s ease-in-out}
@keyframes atyay{25%{transform:rotate(-2.5deg) scale(1.03)}55%{transform:rotate(2deg) scale(1.03)}100%{transform:none}}
.at-star{position:absolute;width:22px;height:22px;margin:-11px 0 0 -11px;pointer-events:none;animation:atstar 1.1s ease-out forwards}
@keyframes atstar{0%{transform:translate(0,0) scale(.3) rotate(0);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(1.2) rotate(200deg);opacity:0}}
.at-new{width:clamp(64px,14vh,96px);aspect-ratio:3/2;border:0;padding:4px;border-radius:12px;background:#fffdf7;box-shadow:0 3px 0 #d8ccb4;cursor:pointer;flex:0 0 auto;position:relative}
.at-new img{width:100%;height:100%;display:block}
.at-new::after{content:'';position:absolute;right:-8px;bottom:-8px;width:24px;height:24px;border-radius:50%;background:#f2c65c url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M9 6l6 6-6 6' fill='none' stroke='%236b5a4a' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/70% no-repeat;box-shadow:0 2px 0 #c9a23e}
.at-new:active{transform:translateY(2px)}
.at-new.padsel{outline:4px solid #f4a6c4;outline-offset:2px}
`;
let styled = false;
const style = () => { if (styled) return; styled = true; const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); };
const X_SVG = '<svg viewBox="0 0 22 22"><path d="M5 5l12 12M17 5 5 17" stroke="#6b5a4a" stroke-width="3.4" stroke-linecap="round"/></svg>';
const STAR_SVG = c => `<svg viewBox="0 0 22 22"><path d="M11 1l2.9 6.6 7.1.6-5.4 4.7 1.6 7L11 16.2 4.8 19.9l1.6-7L1 8.2l7.1-.6z" fill="${c}" stroke="#fffdf7" stroke-width="1.2"/></svg>`;

/** the paint: ten pots, each with its own note */
const PAINT = ['#e8505b', '#f2994b', '#f2c65c', '#9ed96e', '#5dc88a', '#8fd3e8', '#4e9cd4', '#9a7ad6', '#f58db9', '#a9784e'];
const NOTE = [523.3, 587.3, 659.3, 698.5, 784, 880, 987.8, 1046.5, 1174.7, 1318.5];
const BLANK = '#fffdf7', EDGE = '#5a4e66';

/* ---------------- the drawings: each a list of pieces (Path2D in the 600 × 400 measure), laid one over the other, and
   a few dark details drawn on top that are not pieces (an eye, a smile, feelers) ---------------- */
const P = d => new Path2D(d);
const circles = (...cs) => { const p = new Path2D(); for (const [x, y, r] of cs) { p.moveTo(x + r, y); p.arc(x, y, r, 0, Math.PI * 2); } return p; };
const oval = (x, y, rx, ry, rot = 0) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); return p; };
const box = (x, y, w, h, r = 10) => { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; };
/** a band across an oval (the fish's stripes): between x0 and x1, along the oval's top and bottom edges */
const band = (cx, cy, rx, ry, x0, x1) => { const yo = x => ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2)) * .985, p = new Path2D();
  for (let i = 0; i <= 12; i++) { const x = x0 + (x1 - x0) * i / 12; i ? p.lineTo(x, cy - yo(x)) : p.moveTo(x, cy - yo(x)); }
  for (let i = 0; i <= 12; i++) { const x = x1 - (x1 - x0) * i / 12; p.lineTo(x + Math.sin(i / 12 * Math.PI) * 8, cy + yo(x)); }
  p.closePath(); return p; };
const star = (x, y, R, r, n = 5) => { const p = new Path2D(); for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; i ? p.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q) : p.moveTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } p.closePath(); return p; };

const PICTURES = [
  {   /* the unicorn in the meadow, under the sun */
    pieces: () => [
      circles([80, 78, 46]),
      P('M0 330 Q150 292 300 320 T600 308 L600 400 L0 400 Z'),
      P('M212 240 L246 240 L248 348 L214 348 Z M258 244 L292 244 L292 350 L258 350 Z'),
      P('M352 244 L386 244 L388 350 L354 350 Z M398 240 L432 240 L430 346 L396 346 Z'),
      P('M212 212 C150 196 118 262 150 312 C166 282 186 262 214 250 Z'),
      oval(322, 228, 124, 64),
      P('M378 222 L416 128 L470 146 L442 244 Z'),
      oval(478, 134, 58, 40, .28),
      P('M446 104 L454 60 L476 98 Z'),
      P('M484 102 L520 26 L506 108 Z'),
      P('M446 92 C402 96 394 150 380 176 C368 202 372 228 386 244 C398 216 404 190 420 168 C432 150 448 128 462 112 Z'),
    ],
    deco(g) { g.fillStyle = EDGE; g.beginPath(); g.arc(497, 128, 7, 0, 7); g.fill(); g.lineWidth = 4; g.strokeStyle = EDGE; g.lineCap = 'round'; g.beginPath(); g.arc(510, 146, 12, .3, 1.8); g.stroke();
      for (const [x, y] of [[40, 24], [120, 18], [148, 66], [128, 126], [36, 128], [18, 78]]) { g.beginPath(); g.moveTo(80 + (x - 80) * .78, 78 + (y - 78) * .78); g.lineTo(x, y); g.stroke(); } },
  },
  {   /* the little house, the tree beside it, a cloud and the sun */
    pieces: () => [
      circles([520, 74, 44]),
      circles([110, 84, 30], [148, 66, 36], [188, 86, 28]),
      P('M0 328 Q140 300 300 318 T600 314 L600 400 L0 400 Z'),
      box(88, 196, 40, 136, 8),
      circles([108, 164, 58], [62, 200, 40], [154, 204, 42]),
      box(402, 92, 34, 74, 4),
      box(252, 190, 206, 146, 6),
      P('M226 198 L355 92 L484 198 Z'),
      box(318, 252, 58, 84, 22),
      box(398, 220, 46, 46, 6),
    ],
    deco(g) { g.strokeStyle = EDGE; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(421, 222); g.lineTo(421, 264); g.moveTo(400, 243); g.lineTo(442, 243); g.stroke();
      g.fillStyle = EDGE; g.beginPath(); g.arc(364, 298, 6, 0, 7); g.fill(); },
  },
  {   /* the fish in the sea, with a starfish and seaweed */
    pieces: () => [
      P('M0 340 Q160 316 320 336 T600 330 L600 400 L0 400 Z'),
      P('M520 340 C500 300 540 270 518 230 C500 196 536 170 522 140 L548 140 C562 170 528 196 546 230 C568 270 528 300 550 340 Z'),
      star(470, 350, 42, 19),
      circles([462, 96, 26], [498, 56, 19], [446, 40, 14]),
      P('M168 198 C130 150 90 120 60 112 C80 160 80 236 60 288 C92 280 130 250 168 204 Z'),
      P('M230 122 C260 60 330 50 380 112 Z'),
      P('M260 280 C280 330 320 336 340 284 Z'),
      oval(300, 200, 150, 96),
      band(300, 200, 150, 96, 216, 250),
      band(300, 200, 150, 96, 286, 320),
      circles([386, 178, 22]),
    ],
    deco(g) { g.fillStyle = EDGE; g.beginPath(); g.arc(390, 178, 9, 0, 7); g.fill(); g.strokeStyle = EDGE; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.arc(424, 214, 16, 2.3, 3.4); g.stroke(); },
  },
  {   /* the butterfly over a flower */
    pieces: () => [
      circles([96, 300, 26], [128, 322, 26], [118, 358, 26], [76, 358, 26], [64, 322, 26]),
      circles([96, 336, 22]),
      P('M324 192 C250 58 146 70 162 162 C172 220 262 216 324 202 Z'),
      P('M336 192 C410 58 514 70 498 162 C488 220 398 216 336 202 Z'),
      P('M324 208 C258 218 196 272 232 322 C268 352 314 282 324 228 Z'),
      P('M336 208 C402 218 464 272 428 322 C392 352 346 282 336 228 Z'),
      circles([230, 146, 28]),
      circles([430, 146, 28]),
      oval(330, 220, 17, 78),
      circles([330, 132, 24]),
    ],
    deco(g) { g.strokeStyle = EDGE; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(320, 112); g.quadraticCurveTo(300, 70, 282, 66); g.moveTo(340, 112); g.quadraticCurveTo(360, 70, 378, 66); g.stroke();
      g.fillStyle = EDGE; for (const x of [282, 378]) { g.beginPath(); g.arc(x, 66, 8, 0, 7); g.fill(); } for (const x of [322, 338]) { g.beginPath(); g.arc(x, 128, 4.5, 0, 7); g.fill(); } },
  },
];
/** how many drawings there are */
export const PAGES = PICTURES.length;
const piecesOf = new Map();
const piecesFor = i => piecesOf.get(i) || (piecesOf.set(i, PICTURES[i].pieces()), piecesOf.get(i));

/** draw drawing `page` with its pieces' colours into g (in the 600 × 400 measure, scaled by k). A piece is laid like cut
 *  paper: its dark edge first, then its colour over the inner half of the edge, so a piece over another covers that one's
 *  line, and pieces that are several shapes (a cloud) show one outline round all of them. `fill`: [index, colour, x, y, r]
 *  while paint is spreading in a piece from where she tapped */
function render(g, page, colors, k, fill = null) {
  const pieces = piecesFor(page);
  g.setTransform(k, 0, 0, k, 0, 0); g.fillStyle = BLANK; g.fillRect(0, 0, 600, 400);
  g.lineJoin = 'round'; g.lineCap = 'round';
  pieces.forEach((p, i) => {
    g.lineWidth = 11; g.strokeStyle = EDGE; g.stroke(p);
    g.fillStyle = colors[i] || BLANK; g.fill(p);
    if (fill && fill[0] === i) { g.save(); g.clip(p); g.fillStyle = fill[1]; g.beginPath(); g.arc(fill[2], fill[3], fill[4], 0, Math.PI * 2); g.fill(); g.restore(); }
    if (colors[i] || (fill && fill[0] === i)) { g.save(); g.clip(p); g.fillStyle = 'rgba(255,255,255,.16)'; g.translate(-5, -5); g.fill(p); g.restore(); }   // a little light along each coloured piece's upper edge: paper, not flat paint
  });
  PICTURES[page].deco(g);
  g.setTransform(1, 0, 0, 1, 0, 0);
}
/** a drawing's empty outline as a canvas, `px` wide (for the easel in the room, or the new-page button) */
export function pagePicture(page, px = 300, colors = []) { const c = document.createElement('canvas'); c.width = px; c.height = Math.round(px * 2 / 3); render(c.getContext('2d'), page % PAGES, colors, px / 600); return c; }

/** where she was: which drawing, and its colours, while the game is loaded (so the sheet opens where she left it) */
const kept = { page: 0, colors: {} };

/** o: { sfx, won(), keep(dataUrl, canvas), page? }; returns { close, state(), fill(i, colour?), next() } or null if a sheet is open */
export function openColoring(o) {
  if (document.getElementById('artbook')) return null;
  style();
  const veil = document.createElement('div'); veil.id = 'artbook'; veil.className = 'padbook'; veil.dataset.cols = 2;
  const sheet = document.createElement('div'); sheet.className = 'at-sheet'; veil.appendChild(sheet);
  const x = document.createElement('button'); x.className = 'at-x shop-x'; x.setAttribute('aria-label', 'dicht'); x.innerHTML = X_SVG; sheet.appendChild(x);
  const pots = document.createElement('div'); pots.className = 'at-pots';
  const wrap = document.createElement('div'); wrap.className = 'at-wrap';
  const cv = document.createElement('canvas'); cv.className = 'at-page'; cv.width = 1200; cv.height = 800; wrap.appendChild(cv);
  const nb = document.createElement('button'); nb.className = 'at-new padcard'; nb.setAttribute('aria-label', 'nieuwe tekening'); const nbi = new Image(); nb.appendChild(nbi);
  sheet.append(pots, wrap, nb);
  const g = cv.getContext('2d'), K = cv.width / 600;
  let page = (o.page ?? kept.page) % PAGES, colors = kept.colors[page] || [], color = 0, anim = null, wins = 0, done = false, next = 0, shut = false;
  if (colors.length && piecesFor(page).every((_, i) => colors[i])) colors = [];   // (finished last time: a clean one)
  const draw = () => render(g, page, colors, K, anim && [anim.i, anim.col, anim.x, anim.y, anim.r]);
  const showNext = () => { nbi.src = pagePicture((page + 1) % PAGES, 180).toDataURL(); };
  const potEls = PAINT.map((c, i) => { const b = document.createElement('button'); b.className = 'at-pot padcard' + (i === color ? ' on' : ''); b.style.setProperty('--c', c); b.setAttribute('aria-label', 'verf');
    b.onclick = () => { const viaPad = b.classList.contains('padsel'); color = i; potEls.forEach(q => q.classList.toggle('on', q === b)); o.sfx.click();
      if (viaPad) { const n = piecesFor(page).length; let j = next; for (let k = 0; k < n && colors[j % n]; k++) j++; paint(j % n, 300, 200); next = (j + 1) % n; } };   // (with a controller: ✕ on a pot fills the next piece)
    pots.appendChild(b); return b; });
  function stars() {
    const r = cv.getBoundingClientRect(), w = wrap.getBoundingClientRect();
    for (let i = 0; i < 14; i++) { const s = document.createElement('div'); s.className = 'at-star'; s.innerHTML = STAR_SVG(PAINT[i % PAINT.length]);
      s.style.left = (r.left - w.left + r.width / 2) + 'px'; s.style.top = (r.top - w.top + r.height / 2) + 'px'; const a = i / 14 * Math.PI * 2;
      s.style.setProperty('--dx', Math.cos(a) * r.width * .55 + 'px'); s.style.setProperty('--dy', Math.sin(a) * r.height * .6 + 'px'); s.style.animationDelay = (i % 3) * 60 + 'ms'; wrap.appendChild(s); setTimeout(() => s.remove(), 1400); }
    cv.classList.remove('yay'); void cv.offsetWidth; cv.classList.add('yay');
  }
  function paint(i, px, py) {
    if (anim) { colors[anim.i] = anim.col; anim = null; }
    const col = PAINT[color]; if (colors[i] === col) { o.sfx.peep(); return; }
    o.sfx.note(NOTE[color]);
    anim = { i, col, x: px, y: py, r: 0, t0: performance.now() };
    const grow = () => { if (!anim || anim.i !== i || shut) return; const k = Math.min(1, (performance.now() - anim.t0) / 260); anim.r = 20 + k * 620; draw();
      if (k < 1) requestAnimationFrame(grow); else { colors[i] = col; anim = null; draw(); check(); } };
    requestAnimationFrame(grow);
  }
  function check() {
    kept.page = page; kept.colors[page] = colors;
    if (done || !piecesFor(page).every((_, i) => colors[i])) return;
    done = true; wins++; o.sfx.chime(); stars(); if (o.won) o.won('coloring');
  }
  cv.addEventListener('pointerdown', e => {
    const r = cv.getBoundingClientRect(), cx = (e.clientX - r.left) / r.width * cv.width, cy = (e.clientY - r.top) / r.height * cv.height, pieces = piecesFor(page);
    g.setTransform(K, 0, 0, K, 0, 0); g.lineWidth = 11;
    let hit = -1; for (let i = pieces.length - 1; i >= 0; i--) if (g.isPointInPath(pieces[i], cx, cy)) { hit = i; break; }
    if (hit < 0) for (let i = pieces.length - 1; i >= 0; i--) if (g.isPointInStroke(pieces[i], cx, cy)) { hit = i; break; }   // (right on a line: the piece whose edge it is)
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (hit >= 0) paint(hit, cx / K, cy / K);
  });
  const turn = () => { if (anim) { colors[anim.i] = anim.col; anim = null; } page = (page + 1) % PAGES; colors = []; done = false; next = 0; kept.page = page; kept.colors[page] = colors; o.sfx.swish(1); draw(); showNext(); };
  nb.onclick = turn;
  const esc = e => { if (e.key === 'Escape') close(); };
  function close() {
    if (shut) return; shut = true; if (anim) { colors[anim.i] = anim.col; anim = null; draw(); }
    kept.page = page; kept.colors[page] = colors; veil.remove(); removeEventListener('keydown', esc); o.sfx.click();
    if (o.keep && colors.some(Boolean)) o.keep(cv.toDataURL('image/png'), cv);
    if (o.closed) o.closed();
  }
  addEventListener('keydown', esc); veil.addEventListener('pointerdown', e => { if (e.target === veil) close(); }); x.onclick = close;
  document.body.appendChild(veil); draw(); showNext(); o.sfx.chime();
  return { close, next: turn,
    fill: (i, c = color) => { color = c; potEls.forEach((q, j) => q.classList.toggle('on', j === c)); paint(i, 300, 200); },
    state: () => ({ page, pieces: piecesFor(page).length, colored: piecesFor(page).filter((_, i) => colors[i]).length, wins, done, color }) };
}
