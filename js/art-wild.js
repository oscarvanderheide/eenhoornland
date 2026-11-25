// Art for the bigger world: the unicorn's wings and the sky she flies through (world-fly.js), and the new places and
// animals of every island. Same conventions as pixel.js: a <canvas>, anchored bottom-centre, 1px soft outline.
import { sprite, gridSprite, mix, OUT, flipX } from './pixel.js';

const EYE = '#2B1E3A';
const memo = new Map();
const cached = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };

/* ---------------- flying ---------------- */
/** one wing seen from the side, feathers in the colour of her mane: a round shoulder and three rows of feathers that
 *  fan out backwards. f: 0 up, 1 level, 2 down (the root, bottom-left, sits on her back) */
export const wing = (mane, f = 0) => cached('wing' + mane + f, () => {
  const RB = ['#FF6B6B', '#FFA94D', '#FFD43B', '#69DB7C', '#4DABF7', '#9775FA'];
  const lt = '#FFFFFF', md = mane === 'rainbow' ? '#FFE3F1' : mix(mane, '#ffffff', .78), dk = mane === 'rainbow' ? null : mix(mane, '#ffffff', .35);
  const ang = [-.95, -.25, .45][f], len = [14, 15, 12][f];
  const W2 = 18, H2 = 14, ox = 2.5, oy = H2 - 3.5;            // the shoulder
  return gridSprite(W2, H2, (x, y) => {
    const dx = x + .5 - ox, dy = y + .5 - oy, ca = Math.cos(ang), sa = Math.sin(ang);
    const u = dx * ca + dy * sa, v = -dx * sa + dy * ca;       // u along the wing, v across it (negative = leading edge)
    if (u < -1.5 || u > len) return null;
    const lead = -2.6 + u * .05, trail = 1.2 + u * .42 - (u > len - 4 ? (u - (len - 4)) * .9 : 0);
    if (v < lead || v > trail) return null;
    const row = v < lead + 1.6 ? 0 : v < (lead + trail) / 2 + .6 ? 1 : 2;
    const scal = Math.floor(u / 2.4), tip = (u % 2.4) > 1.7 && row === 2;
    if (row === 0) return lt;
    if (row === 1) return (scal % 2) ? md : lt;
    if (mane === 'rainbow') return RB[(scal + 6) % 6];
    return tip ? dk : (scal % 2 ? md : dk);
  });
});
/** the button that takes off: a little wing */
export const flyIcon = () => cached('flyIcon', () => sprite([
  '.........bb.', '......bbbww.', '....bbwwwww.', '..bbwwwwwww.', '.bwwwwwwww..', 'bwwwwwwwb...', 'wwwwbwwb....', '.wwb.wb.....',
], { b: '#9BC8F5', w: '#FFFFFF' }));
/** the button that lands: an arrow down onto grass */
export const landIcon = () => cached('landIcon', () => sprite([
  '...yyy...', '...yyy...', '...yyy...', '.yyyyyyy.', '..yyyyy..', '...yyy...', '....y....', 'ggggggggg', 'gGgggGggg',
], { y: '#FFD43B', g: '#69DB7C', G: '#3EBF6E' }));
/** a soft cloud to fly through */
export const wolk = (k = 0) => cached('wolk' + k, () => {
  const w = 30 + k * 6, h = 12 + (k % 2) * 3, bumps = [[.2, .62, .22], [.42, .42, .3], [.66, .5, .26], [.85, .7, .16], [.5, .75, .3]];
  return gridSprite(w, h, (x, y) => {
    let inside = false, top = 1; for (const [bx, by, r] of bumps) { const d = Math.hypot((x + .5) / w - bx, ((y + .5) / h - by) * h / w * 1.6); if (d < r * .9) { inside = true; top = Math.min(top, (y + .5) / h - by + r); } }
    if (!inside) return null; return y > h * .72 ? '#E4ECF8' : y > h * .55 ? '#F2F6FC' : '#FFFFFF';
  }, { outline: '#C8D6EC' });
});

/* ---------------- bos: the treehouse, the zipline, the squirrel ---------------- */
/** a giant old oak with a little wooden house in its crown and a ladder up the trunk (anchored bottom-centre, 3 tiles wide) */
export const boomhut = () => cached('boomhut', () => {
  const w = 56, h = 84, r = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;
  return gridSprite(w, h, (x, y) => {
    const cx = x + .5 - w / 2;
    // the crown: three big leafy blobs behind and around the house
    const blobs = [[-14, 22, 15], [14, 20, 15], [0, 12, 16], [-6, 30, 12], [8, 31, 12]];
    let leaf = false, edge = false; for (const [bx, by, br] of blobs) { const d = Math.hypot(cx - bx, y + .5 - by); if (d < br) { leaf = true; if (d > br - 1.6) edge = true; } }
    // the house: walls y 24..40, roof 15..24, x -11..11
    const hx = Math.abs(cx);
    if (y >= 15 && y < 25 && hx <= (y - 14) * 1.25) return y === 15 || hx > (y - 14) * 1.25 - 1.3 ? '#8E3B46' : (Math.floor(y / 2) % 2 ? '#C2525E' : '#B04654');   // red roof
    if (y >= 25 && y <= 40 && hx <= 11) {
      if (y === 40) return '#6B4126';
      if (hx <= 3.5 && y >= 31 && y <= 39) return y === 31 || hx > 2.8 ? '#5A3620' : '#3D2414';                     // the little door
      if (hx >= 6 && hx <= 9.5 && y >= 28 && y <= 32) return hx < 6.8 || hx > 8.8 || y === 28 || y === 32 ? '#5A3620' : y < 30 ? '#FFE9A8' : '#FFD27A';   // windows, warm light
      return Math.floor((y - 25) / 3) % 2 ? '#C9965E' : '#B8844F';                                                    // planks
    }
    if (y >= 40 && y <= 42 && hx <= 14) return y === 40 ? '#8A5A33' : '#6B4126';                                       // the platform
    if (y > 42 && y <= 44 && (hx > 11 && hx < 14) && (x % 3 === 0)) return '#6B4126';
    // the trunk with roots
    const tw = y > 76 ? 7 + (y - 76) * 1.1 : 6;
    if (y >= 34 && Math.abs(cx + 1) <= tw) {
      // the ladder on the front of the trunk
      if (y > 43 && Math.abs(cx - 2) <= 3) return Math.abs(cx - 2) > 2.2 ? '#E0B47A' : (y % 4 === 0 ? '#E0B47A' : null) || ((r(x, y) % 5) ? '#7A4F2E' : '#6A4227');
      return (r(x, y) % 9 === 0) ? '#5C3A22' : Math.abs(cx + 1) > tw - 1.5 ? '#5C3A22' : x % 5 === 0 ? '#6A4227' : '#7A4F2E';
    }
    if (leaf) return edge ? '#3E8E4E' : (r(x, y) % 7 === 0 ? '#8FD06A' : (r(x, y) % 5 === 0 ? '#4FA85A' : '#62BC62'));
    return null;
  });
});
/** the pole the zipline ends at, with a little landing platform and a tyre to hold */
export const ziplinePaal = () => cached('ziplinePaal', () => sprite([
  '....ww....', '....bb....', '...bbbb...', '....bb....', '....bb....', '....bb....', '....bb....', '....bb....', '....bb....', '....bb....',
  '....bb....', '....bb....', '....bb....', '....bb....', '....bb....', '....bb....', '....bb....', '....bb....', 'pppppppppp', 'PbPPbbPPbP',
  '.b......b.', '.b......b.', '.b......b.',
], { w: '#FFFFFF', b: '#8A5A33', p: '#D6A674', P: '#B8844F' }));
/** what she hangs on, sliding down the rope */
export const katrol = () => cached('katrol', () => sprite(['.gg.', 'g..g', '.gg.', '.rr.', 'r..r', 'r..r', '.rr.'], { g: '#9AA5B8', r: '#FF7EB6' }));
/** the squirrel: f 0 sitting with its tail up, 1 running, 2 eating a nut */
export const eekhoorn = (f = 0) => cached('eekhoorn' + f, () => flipX(sprite(f === 1 ? [
  '........TT.', '.......TttT', '..o.o..TttT', '.oooo...TtT', 'ooko.o.TtT.', 'ooooooooT..', '.cooooooo..', '..o..o.o...',
] : [
  '.o.o...TT..', '.oooo.TttT.', 'ookoo.TtttT', 'oooocTTtttT', '.coccoTtttT', '.cnccooTttT', '.occcoo.TT.', '.oo..oo....',
], { o: '#D9733A', T: '#B8582A', t: '#F29A5C', c: '#FCE3C0', k: EYE, n: f === 2 ? '#8A5A33' : '#FCE3C0' })));
/** an acorn */
export const eikel = () => cached('eikel', () => sprite(['.bb.', 'bBBb', 'gggg', 'gGgg', '.gg.'], { b: '#8A5A33', B: '#A9784F', g: '#C99A4E', G: '#E0B46A' }));

/* ---------------- wei: the waterfall, the stepping stones, the frog ---------------- */
/** a flat stepping stone in the stream (lies on the water) */
export const stapsteen = (k = 0) => cached('stapsteen' + k, () => gridSprite(14, 10, (x, y) => {
  const d = ((x + .5 - 7) / 6.6) ** 2 + ((y + .5 - 5) / 4.4) ** 2; if (d > 1) return null;
  const n = ((x * 7 + y * 13 + k * 5) % 11); return y < 4 && d < .7 ? (n < 3 ? '#E6E9F2' : '#D2D6E2') : d > .78 ? '#8E93A8' : n < 2 ? '#C3C8D6' : '#B4B9C8';
}));
/** the frog: 0 sitting, 1 mid-jump, 2 croaking with its throat blown up */
export const kikker = (f = 0) => cached('kikker' + f, () => sprite(f === 1 ? [
  '..ww.ww..', '.wkgwkg..', '.ggggggg.', 'gglllllgg', 'g.ggggg.g', 'g.......g',
] : f === 2 ? [
  '.ww...ww.', 'wkgg.gkgw', 'ggggggggg', 'gYYYYYYYg', '.gYYYYYg.', 'ggg...ggg',
] : [
  '.ww...ww.', 'wkgg.gkgw', 'ggggggggg', 'gggrrrggg', '.glllllg.', 'ggg...ggg',
], { g: '#5DBB4F', l: '#A8E07A', w: '#FFFFFF', k: EYE, r: '#E8616B', Y: '#F2F7C8' }));
/** a lily pad with a pink flower */
export const lelie = (k = 0) => cached('lelie' + k, () => gridSprite(12, 7, (x, y) => {
  const d = ((x + .5 - 6) / 5.8) ** 2 + ((y + .5 - 3.5) / 3.3) ** 2; if (d > 1) return null;
  if (k % 2 === 0 && Math.abs(x - 7.5) < 1.6 && Math.abs(y - 2.5) < 1.2) return (x + y) % 2 ? '#FFB3D9' : '#FF7EB6';
  if (x > 5 && x < 8 && y > 3) return null; return d > .75 ? '#3E8E4E' : (x + y) % 4 ? '#5DBB4F' : '#4FA85A';
}));
/** the dark opening behind the curtain of water */
export const watervalMond = () => cached('watervalMond', () => gridSprite(30, 26, (x, y) => {
  const cx = Math.abs(x + .5 - 15), top = 4 + (cx / 15) ** 2 * 20; if (y < top) return null;
  return y < top + 2 ? '#3E6E88' : y > 23 ? '#2C4A63' : '#1E3247';
}, { outline: false }));

/* ---------------- dorp: the pig in the mud ---------------- */
/** the pig: clean pink, or (dirty) covered in mud. f 1: rolling on its back */
export const varken = (f = 0, dirty = false) => cached('varken' + f + dirty, () => {
  const rows = f === 1 ? [
    '..p......p...', '.ppp....ppp..', '.ppppppppppp.', 'pppppppppppnn', 'ppppppppppnkn', '.ppppppppppp.', '..e.......e..',
  ] : [
    '.........ee..', '.t.......epe.', 'tt.pppppppppp', '.ppppppppppkp', '.pppppppppnnnn', '.pppppppppnkkn', '..pppppppppnn.', '..pp.pp..pp.p.', '..pp.pp..pp.pp',
  ];
  const mud = (x, y) => dirty && (Math.sin(x * 1.3 + y * .7) + Math.sin(y * 1.9 - x * .5) + Math.sin(x * .6 + 2) > .7);
  return gridSprite(Math.max(...rows.map(r => r.length)), rows.length, (x, y) => {
    const ch = rows[y][x]; if (!ch || ch === '.') return null;
    if (ch === 'k') return EYE; if (ch === 'n') return '#F27BA0'; if (ch === 't') return '#F59AB8'; if (ch === 'e') return '#F27BA0';
    return mud(x, y) ? ((x + y) % 2 ? '#8A5A33' : '#6E4426') : (y < 3 ? '#FFC2D6' : '#FFADC8');
  });
});
/** the mud pool (lies flat) */
export const modder = () => cached('modder', () => gridSprite(30, 14, (x, y) => {
  const d = ((x + .5 - 15) / 14.5) ** 2 + ((y + .5 - 7) / 6.6) ** 2; if (d > 1) return null;
  const n = Math.sin(x * .9 + y * 1.7) + Math.sin(x * .37 - y * 2.1);
  return d > .8 ? '#9A6A3E' : n > 1.1 ? '#A87A4A' : n > -.4 ? '#7A4F2E' : '#6A4227';
}));
/** a blob of mud flying through the air */
export const modderSpat = () => cached('modderSpat', () => sprite(['.mm.', 'mMmm', 'mmm.'], { m: '#7A4F2E', M: '#A87A4A' }));

/* ---------------- strand: the sea turtle and her nest ---------------- */
export const schildpad = (f = 0) => cached('schildpad' + f, () => sprite([
  '....ssss......', '...sSsSss.....', '..sSssssSs.hh.', '.sssSssSsshhkh', 'lsssssssssshhh.', '.l..l...l..l..'.slice(0, 14), f ? '..l......l....' : '.l...l..l..l..',
].map(r => r.padEnd(15, '.').slice(0, 15)), { s: '#4F9A6A', S: '#7CC28C', h: '#9ED29A', k: EYE, l: '#7CC28C' }));
export const babySchildpad = (f = 0) => cached('babySchild' + f, () => sprite(f ? ['.ss..', 'sSshh', '.l.lk'] : ['.ss..', 'sSshh', 'l.l.k'], { s: '#4F9A6A', S: '#7CC28C', h: '#9ED29A', l: '#7CC28C', k: EYE }));
/** the nest: a little mound of sand with eggs peeking out */
export const nest = (eggs = true) => cached('nest' + eggs, () => gridSprite(16, 7, (x, y) => {
  const d = ((x + .5 - 8) / 7.8) ** 2 + ((y + .5 - 7) / 6.5) ** 2; if (d > 1) return null;
  if (eggs && y >= 2 && y <= 3 && [5, 8, 11].some(c => Math.abs(x - c) <= .6)) return '#FFF6E3';
  return y < 2 ? '#FBE3B0' : (x * 3 + y * 7) % 5 ? '#EFCF92' : '#E2BD7C';
}));

/* ---------------- eiland: the flamingos ---------------- */
/** f 0 on two legs, 1 on one leg, 2 head under its wing (asleep) */
export const flamingo = (f = 0) => cached('flamingo' + f, () => flipX(sprite([
  f === 2 ? '.........' : '..pp.....', f === 2 ? '.........' : '.pkpb....', f === 2 ? '.........' : '...pbB...', f === 2 ? '.........' : '...p.....', f === 2 ? '.........' : '...p.....',
  f === 2 ? '..ppp....' : '...pp....', '..pppppp.', '.pppPPppp', '.ppPPPPpp', '..pppppp.', '....l....', '....l....', f === 1 ? '....ll...' : '...l.l...', f === 1 ? '....l.l..' : '...l.l...', f === 1 ? '....l....' : '...l.l...', f === 1 ? '...ll....' : '..ll.ll..',
], { p: '#FF9EC7', P: '#FF7EB6', k: EYE, b: '#FFFFFF', B: '#2B1E3A', l: '#E8616B' })));

/* ---------------- inside the treehouse ---------------- */
/** the opening at the back onto the zipline platform: blue sky, leaves, and the rope with its pink handle */
export const zipDeur = () => cached('zipDeur', () => gridSprite(22, 34, (x, y) => {
  const cx = Math.abs(x + .5 - 11);
  if (cx > 10 || y < 2) return null;
  if (cx > 8.6 || y < 4) return '#6B4126';                                                    // the frame
  if (y === 4 + Math.floor((x * 7) % 3) && false) return null;
  const ry = 9 + Math.round((x - 3) * .35); if (Math.abs(y - ry) < 1 && x > 1) return '#5A3A22';   // the rope going out
  if (x >= 13 && x <= 15 && y >= ry + 1 && y <= ry + 6) return (y === ry + 1) ? '#9AA5B8' : (x === 13 || x === 15 || y === ry + 6) ? '#FF7EB6' : null;
  if (y > 27) return y === 28 ? '#8A5A33' : '#B8844F';                                          // the platform boards
  const leaf = Math.sin(x * 1.3 + y * .7) + Math.sin(y * 1.1 - x * .4) > 1.1 && (y > 18 || cx > 5);
  return leaf ? ((x + y) % 3 ? '#62BC62' : '#8FD06A') : y < 14 ? '#BFE8FF' : '#9FD8F5';
}));
/** a brass telescope on three legs, pointing out of the window */
export const telescoop = () => cached('telescoop', () => sprite([
  '..........bb', '........bbBb', '......bbBbb.', '....bbBbb...', '...gbBbb....', '..ggbb......', '...gg.......', '...g.g......', '..g...g.....', '..g...g.....', '.g.....g....', '.g.....g....',
], { b: '#E0B046', B: '#FFE08A', g: '#6B4126' }));
/** the squirrel's pile of acorns */
export const eikels = () => cached('eikels', () => gridSprite(16, 9, (x, y) => {
  const d = ((x + .5 - 8) / 7.8) ** 2 + ((y + .5 - 9) / 8.4) ** 2; if (d > 1) return null;
  const cx = (x % 4), cy = (y + Math.floor(x / 4)) % 4; return cy === 0 ? (cx < 3 ? '#8A5A33' : '#6B4126') : cx === 3 ? '#B07A3A' : cy === 1 ? '#E0B46A' : '#C99A4E';
}));
/** a striped hammock between two hooks (seen from the front) */
export const hangmat = () => cached('hangmat', () => gridSprite(30, 14, (x, y) => {
  if ((x < 2 || x > 27) && y < 13) return x === 0 || x === 29 ? null : '#6B4126';                 // the posts
  const sag = 4 + Math.sin((x - 2) / 25 * Math.PI) * 6; if (x < 2 || x > 27) return null;
  if (y < sag - 2 || y > sag + 1) return (Math.abs(y - (2 + (sag - 4) * .3)) < .6 && (x < 6 || x > 23)) ? '#E8D5B0' : null;   // the ropes to the hooks
  return Math.floor(x / 3) % 2 ? '#FF9EC7' : '#FFFFFF';
}));
/** a round rag rug (lies flat) */
export const kleed = () => cached('kleed', () => gridSprite(30, 18, (x, y) => {
  const d = ((x + .5 - 15) / 14.6) ** 2 + ((y + .5 - 9) / 8.6) ** 2; if (d > 1) return null;
  const ring = Math.floor(Math.sqrt(d) * 5); return ['#FFD43B', '#FF9EC7', '#69DB7C', '#4DABF7', '#FF7EB6'][ring] || '#FF7EB6';
}));

/* ---------------- the waterfall: the otter, the singing crystals ---------------- */
/** the otter: 0 standing on the bank, 1 floating on its back with a shell on its tummy, 2 diving (just the tail) */
export const otter = (f = 0) => cached('otter' + f, () => flipX(sprite(f === 1 ? [
  '....ss.......', '.bb.sSs...bb.', 'bkbbbbbbbbbbb', 'bbbcccccccbbb', '.bbbbbbbbbbb.', '..b.......b..',
] : f === 2 ? [
  '.....b', '....bb', '...bb.', '..bb..', '.bb...', 'bb....',
] : [
  '.bb.......', 'bkbb......', 'bbnbb.....', '.bcbbbb...', '..ccbbbbb.', '..cbbbbbbb', '..bb.bb..b', '..b..b...b',
], { b: '#8A5A3B', c: '#D9B08A', k: EYE, n: '#3B2A22', s: '#FFE3EC', S: '#FF9EC7' })));
/** a singing crystal (xylophone), in one colour of the rainbow; lit glows white at the top */
export const zingkristal = (col, lit = false) => cached('zing' + col + lit, () => gridSprite(9, 20, (x, y) => {
  const cx = Math.abs(x + .5 - 4.5), top = 3 + cx * 1.6; if (y < top) return null; if (cx > 4) return null;
  if (y > 17) return cx < 4 ? '#5E6E86' : null;                                                        // a little stone foot
  const lt = mix(col, '#ffffff', lit ? .75 : .45), dk = mix(col, '#2B1E3A', .15);
  return x < 3 ? lt : x > 5 ? dk : (lit && y < 9 ? '#FFFFFF' : col);
}));

/* ---------------- eiland: giant bouncy mushrooms ---------------- */
/** a giant mushroom with a springy cap in one of three candy colours */
export const paddo = (k = 0) => cached('paddo' + k, () => {
  const cap = ['#FF6B9E', '#9B72E8', '#4DABF7'][k % 3], dk = mix(cap, '#2B1E3A', .25), lt = mix(cap, '#ffffff', .35);
  return gridSprite(26, 24, (x, y) => {
    const cx = x + .5 - 13;
    if (y < 13) { const d = (cx / 12.6) ** 2 + ((y + .5 - 13) / 12) ** 2; if (d > 1) return null; if (y > 10) return dk;
      const dots = [[-6, 5], [3, 3], [7, 8], [-2, 9], [-9, 9]].some(([a, b]) => Math.hypot(cx - a, y - b) < 1.8); return dots ? '#FFFFFF' : y < 4 && cx < 0 ? lt : cap; }
    if (Math.abs(cx) < 4.2 - (y > 21 ? -1 : 0)) return Math.abs(cx) > 3.4 ? '#E8D8C0' : (y === 13 ? '#D9C6A8' : '#FFF6E3');   // the stem
    return null;
  });
});
