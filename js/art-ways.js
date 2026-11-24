// Art for the ways of the animals (world-ways.js) and the things to do at sea (world-sea.js): each picture belongs
// to one animal or one place. Same conventions as pixel.js: a <canvas>, anchored bottom-centre, 1px soft outline.
import { sprite, gridSprite } from './pixel.js';

const EYE = '#2B1E3A';
const memo = new Map();
const cached = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };

/* ---------------- dorp ---------------- */
/** a rabbit hole: a dark mouth in a ring of dug-up earth (lies flat on the ground) */
export const hol = () => cached('hol', () => gridSprite(12, 6, (x, y) => {
  const d = ((x + .5 - 6) / 6) ** 2 + ((y + .5 - 3) / 3) ** 2, i = ((x + .5 - 6) / 3.8) ** 2 + ((y + .5 - 3.2) / 1.8) ** 2;
  return i <= 1 ? (y < 3 ? '#3B2A22' : '#53392C') : d <= 1 ? ((x + y) % 3 ? '#A9784F' : '#8C5E3C') : null;
}));
/** just the ears and the eyes of the rabbit, peeking out of a hole */
export const konijnKop = () => cached('konijnKop', () => sprite(['.w...w.', '.wp.pw.', '.wp.pw.', '.wwwww.', 'wkwwwkw', 'wwwnwww'], { w: '#FFFFFF', p: '#FFB3CC', k: EYE, n: '#FF7EB6' }));
/** a hen's egg, and the chick that comes out of it */
export const kipEi = (crack = 0) => cached('kipEi' + crack, () => sprite(crack ? ['.ee.', 'ekke', 'eeke', 'eeee', '.ee.'] : ['.ee.', 'eeee', 'eeee', 'eeee', '.ee.'], { e: '#FFF3DC', k: '#B89C7A' }));
export const kuiken = (f = 0) => cached('kuiken' + f, () => sprite(f ? ['..yy...', '.yyky..', '.yyyoo.', 'yyyyy..', 'yyyyy..', '.o.o...'] : ['..yy...', '.yyky..', '.yyyoo.', 'yyyyy..', '.yyyy..', '..o.o..'], { y: '#FFE066', k: EYE, o: '#FF9E3B' }));

/* ---------------- bos ---------------- */
/** the hedgehog rolled up into a spiky ball */
export const egelBal = () => cached('egelBal', () => gridSprite(10, 9, (x, y) => {
  const d = Math.hypot(x + .5 - 5, y + .5 - 4.8);
  if (d > 4.6) return null; if (d > 3.9) return (x + y) % 2 ? '#5E3B22' : null;
  if (x === 6 && y === 5) return '#F2D2A9';
  return (x * 3 + y * 5) % 7 < 2 ? '#5E3B22' : '#8B5E3C';
}));
/** the owl with its eyes shut: asleep in the daytime */
export const uilSlaap = () => cached('uilSlaap', () => sprite([
  'B.......B', 'BBbbbbbBB', 'bBBBbBBBb', 'bkkkbkkkb', 'bwwwywwwb', 'bbbbybbbb', 'bBcccccBb', 'BbcCcCcbB', 'BbcccccbB', '.bcCcCcb.', '..ccccc..', '..o...o..',
], { b: '#A9784F', B: '#7A5236', c: '#F2D9B0', C: '#C9A27A', w: '#FFF6E3', k: EYE, y: '#F5B83D', o: '#F5A623' }));

/* ---------------- wei ---------------- */
/** a tuft of wool that floats away */
export const wol = (k = 0) => cached('wol' + k % 2, () => gridSprite(5 + k % 2, 4, (x, y) => (Math.hypot(x + .5 - 2.6, y + .5 - 2.2) < 2.3 ? (x + y) % 3 ? '#FFFFFF' : '#ECE9F2' : null)));

/* ---------------- kasteel ---------------- */
/** the peacock with its tail down: it only fans it out when somebody comes to see */
export const pauwDicht = () => cached('pauwDicht', () => sprite([
  '..y.y........',
  '...b.........',
  '..bbb........',
  '.bwkb........',
  'nbbbb........',
  '..bbb........',
  '..bbb........',
  '..bbbb.......',
  '.bbbbbbGG....',
  '.bbbbbbBGGG..',
  '..bbbbBBGLGGG',
  '...bbbB.GGoGe',
  '....l.l...GGG',
  '...ll.ll.....',
], { G: '#2A9A70', L: '#7FE0B0', o: '#F5C84C', e: '#2F4FB0', b: '#3F7FE0', B: '#2E5FB8', y: '#FFD43B', w: '#FFFFFF', k: EYE, n: '#C9B89A', l: '#8C7E8E' }));
/** a smoke ring from the little dragon */
export const rookring = () => cached('rookring', () => gridSprite(9, 6, (x, y) => { const d = ((x + .5 - 4.5) / 4.3) ** 2 + ((y + .5 - 3) / 2.8) ** 2; return d <= 1 && d > .38 ? (y < 3 ? '#F4F1EE' : '#D9D3DE') : null; }, { outline: false }));

/* ---------------- strand ---------------- */
/** the crab dug into the sand: a little mound with two eyes on stalks */
export const krabZand = () => cached('krabZand', () => sprite(['.k...k.', '.r...r.', '..sss..', '.sSsss.', 'sssSsss'], { k: EYE, r: '#F0625A', s: '#F3DFA6', S: '#E2C27E' }, { outline: '#C9A86A' }));

/* ---------------- zee ---------------- */
/** a jellyfish: a soft dome with ribbons. lit = it glows and sings its note */
export const kwal = (col, lit = false) => cached('kwal' + col + lit, () => gridSprite(9, 11, (x, y) => {
  if (y < 5) { const d = ((x + .5 - 4.5) / 4.5) ** 2 + ((y + .5 - 5) / 5) ** 2; if (d > 1) return null; return lit ? (d < .35 ? '#FFFFFF' : col) : d < .3 ? '#F5F0FF' : mixA(col); }
  if (y === 5) return x > 0 && x < 8 ? (lit ? col : mixA(col)) : null;
  const k = [1, 3, 5, 7].indexOf(x + ((y >> 1) % 2 ? 1 : 0) - 0); return k >= 0 && y < 10 + (x % 2) ? (lit ? col : mixA(col)) : null;
}, { outline: lit ? '#FFFFFF' : dark(col) }));
const dark = col => { const n = parseInt(col.slice(1), 16), f = v => Math.round(v * .55).toString(16).padStart(2, '0'); return '#' + f(n >> 16) + f(n >> 8 & 255) + f(n & 255); };
const mixA = col => { const n = parseInt(col.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255, f = v => Math.round(v + (230 - v) * .45).toString(16).padStart(2, '0'); return '#' + f(r) + f(g) + f(b); };
/** the seals' ball */
export const zeeBal = () => cached('zeeBal', () => gridSprite(6, 6, (x, y) => { const d = Math.hypot(x + .5 - 3, y + .5 - 3); if (d > 2.9) return null; const a = Math.atan2(y + .5 - 3, x + .5 - 3); return d < 1 ? '#FFFFFF' : ['#FF5E7E', '#FFD43B', '#4FA3F7'][Math.floor((a + Math.PI) / (Math.PI * 2 / 3)) % 3]; }));
