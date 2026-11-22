// Island layout as pure data (no rendering, no DOM) so it can be checked in node: `node tests/map.test.mjs`.
// Village (dorp) keeps its original coordinates; the island grows east (bos, kasteel) and south (wei, strand).
export const W = 64, H = 48;
export const GR = 0, PA = 1, WA = 2, PL = 3, SA = 4, SE = 5, FO = 6, CO = 7, SO = 8, BW = 9; // grass path pond plaza sand sea forest cobble soil boardwalk
export const POND = { cx: 10, cz: 12, rx: 1.95, rz: 1.85 };
export const FOUNT = { cx: 15, cz: 12 };
export const START = [14.5, 15.5];
export const LANTERNS = [[2, 9], [11, 9], [18, 9], [27, 9], [11, 15], [18, 15], [9, 18], [20, 18]];
export const PEN = { x0: 18, z0: 25, x1: 29, z1: 32, gate: [[18, 28], [18, 29]] };   // unicorn meadow: fence on the perimeter tiles
export const GARDEN = { x0: 5, z0: 26, x1: 11, z1: 30 };                              // carrot patch
export const CASTLE = { x: 50, z: 27, w: 9, d: 6, door: [54, 33] };
export const PIER = { x0: 30, z0: 41, x1: 31, z1: 46 };
export const CLEARING = { cx: 49.5, cz: 11.5, rx: 4.2, rz: 3.2 };
export const ORCHARD = { cx: 40, cz: 18, rx: 3.6, rz: 3.2 };
export const NOOK = { cx: 58.5, cz: 5.5, rx: 2.6, rz: 2.4 };
/** places you can ask to walk to (map screen, signposts) */
export const PLACES = {
  dorp: { name: 'Dorp', tile: [14, 15] }, bos: { name: 'Bos', tile: [48, 12] }, wei: { name: 'Eenhoornwei', tile: [17, 28] },
  tuin: { name: 'Moestuin', tile: [12, 28] }, strand: { name: 'Strand', tile: [15, 38] }, kasteel: { name: 'Kasteel', tile: [54, 35] },
};

/** the sea starts south of this wavy line */
export const shoreZ = x => 42.4 + Math.sin(x * .45) * .7 + Math.sin(x * .17 + 1) * .5;
export function zoneAt(x, z) { if (z < 24) return x < 28 ? 'dorp' : 'bos'; if (x >= 43) return 'kasteel'; return z < 34 ? 'wei' : 'strand'; }
export const inPen = (x, z) => x > PEN.x0 && x < PEN.x1 && z > PEN.z0 && z < PEN.z1;

function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/** solids: [[x0,z0,x1,z1],...] building footprints; keep: [[x,z],...] tiles that must stay free (doors) */
export function buildMap({ solids = [], keep = [] } = {}) {
  const ground = new Uint8Array(W * H), block = new Uint8Array(W * H);
  const I = (x, z) => z * W + x, inb = (x, z) => x >= 0 && z >= 0 && x < W && z < H;
  const set = (x, z, t) => { if (inb(x, z) && ground[I(x, z)] !== SE) ground[I(x, z)] = t; };
  const rect = (x0, z0, x1, z1, t) => { for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) set(x, z, t); };
  const disc = (c, t) => { for (let z = Math.floor(c.cz - c.rz); z <= Math.ceil(c.cz + c.rz); z++) for (let x = Math.floor(c.cx - c.rx); x <= Math.ceil(c.cx + c.rx); x++) if (((x + .5 - c.cx) / c.rx) ** 2 + ((z + .5 - c.cz) / c.rz) ** 2 <= 1) set(x, z, t); };
  const trail = (pts, r = .85, t = PA) => {
    for (let k = 0; k < pts.length - 1; k++) {
      const [ax, az] = pts[k], [bx, bz] = pts[k + 1]; const n = Math.ceil(Math.hypot(bx - ax, bz - az) * 4);
      for (let s = 0; s <= n; s++) { const px = ax + (bx - ax) * s / n, pz = az + (bz - az) * s / n; for (let z = Math.floor(pz - r); z <= Math.floor(pz + r); z++) for (let x = Math.floor(px - r); x <= Math.floor(px + r); x++) if ((x + .5 - px) ** 2 + (z + .5 - pz) ** 2 <= r * r) set(x, z, t); }
    }
  };
  const keepSet = new Set(keep.map(([x, z]) => I(x, z)));

  /* ---- base ground + sea ---- */
  for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
    const zn = zoneAt(x, z), s = shoreZ(x + .5);
    let t = zn === 'bos' ? FO : zn === 'strand' ? SA : GR;
    if (z + .5 > s) { t = SE; block[I(x, z)] = 1; } else if (z + .5 > s - 3.2) t = SA;
    ground[I(x, z)] = t;
  }
  /* ---- dorp ---- */
  rect(3, 7, 26, 8, PA); rect(14, 6, 15, 21, PA); rect(3, 16, 26, 17, PA); rect(12, 10, 17, 14, PL);
  for (let z = 0; z < 24; z++) for (let x = 0; x < 28; x++) if (((x + .5 - POND.cx) / POND.rx) ** 2 + ((z + .5 - POND.cz) / POND.rz) ** 2 <= 1) { ground[I(x, z)] = WA; block[I(x, z)] = 1; }
  /* ---- bos ---- */
  disc(CLEARING, GR); disc(ORCHARD, GR); disc(NOOK, GR);
  trail([[26, 8], [36, 8], [40, 6.5], [44, 8.5], [47, 11]]);
  trail([[26, 17], [33, 17], [37, 18.5], [40, 18]]); trail([[43, 17], [45.5, 15], [47, 13]]);
  trail([[49.5, 14], [49.5, 20], [48.5, 24], [48.5, 33]]);
  trail([[53, 11], [56, 8.5], [58, 6.5]], .7);
  /* ---- wei + moestuin ---- */
  rect(14, 22, 15, 34, PA); rect(16, 28, 18, 29, PA); rect(12, 28, 13, 29, PA);
  rect(GARDEN.x0, GARDEN.z0, GARDEN.x1, GARDEN.z1, SO);
  /* ---- strand ---- */
  rect(14, 35, 15, 37, BW); rect(16, 35, 45, 36, BW);
  for (let z = PIER.z0; z <= PIER.z1; z++) for (let x = PIER.x0; x <= PIER.x1; x++) { ground[I(x, z)] = BW; block[I(x, z)] = 0; }
  rect(30, 37, 31, 40, BW);
  /* ---- kasteel ---- */
  rect(46, 33, 61, 38, CO); rect(46, 35, 46, 36, CO);

  /* ---- solid things ---- */
  const solid = (x0, z0, x1, z1) => { for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (inb(x, z)) block[I(x, z)] = 1; };
  for (const s of solids) solid(...s);
  solid(14, 11, 15, 12);                                         // fountain
  for (const [x, z] of LANTERNS) block[I(x, z)] = 1;
  solid(CASTLE.x, CASTLE.z, CASTLE.x + CASTLE.w - 1, CASTLE.z + CASTLE.d - 1);
  for (let z = PEN.z0; z <= PEN.z1; z++) for (let x = PEN.x0; x <= PEN.x1; x++) if ((x === PEN.x0 || x === PEN.x1 || z === PEN.z0 || z === PEN.z1) && !PEN.gate.some(g => g[0] === x && g[1] === z)) block[I(x, z)] = 1;
  const structural = block.slice();                               // everything that is not vegetation

  /* ---- fixed props (blocked, drawn as billboards) ---- */
  const trees = [];
  const prop = (kind, x, z, seed = 1) => { if (!inb(x, z) || block[I(x, z)] || keepSet.has(I(x, z))) return; const g = ground[I(x, z)]; if (g === PA || g === BW || g === PL) return; trees.push({ kind, x, z, seed, fixed: true }); block[I(x, z)] = 1; };
  [[38, 15], [42, 15], [37, 20], [42, 21], [40, 16], [47, 9], [52, 14]].forEach(([x, z], k) => prop('apple', x, z, k + 1));
  prop('oak', 50, 10); prop('stump', 46, 13); prop('stump', 57, 4); prop('log', 53, 13);
  prop('scarecrow', 8, 25); prop('sign', 16, 27, 1); prop('sign', 27, 6, 2); prop('sign', 16, 34, 3); prop('sign', 44, 34, 4);
  prop('umbrella', 6, 38); prop('sandcastle', 22, 39); prop('boat', 36, 40); prop('umbrella', 26, 38, 2);
  prop('statue', 54, 36); prop('flag', 46, 34); prop('flag', 46, 37, 2); prop('flag', 49, 33); prop('flag', 59, 33, 2);
  prop('trough', 27, 27); prop('hay', 20, 26);
  for (let x = 47; x <= 61; x += 2) if (x !== 53 && x !== 55) prop('hedge', x, 39, x);

  /* ---- vegetation ---- */
  const r = mulberry(20251122);
  const pd = new Int16Array(W * H).fill(99);                      // distance to the nearest path / clearing
  { const q = []; for (let i = 0; i < W * H; i++) { const g = ground[i]; if (g === PA || g === PL || g === CO || g === BW || (g === GR && zoneAt(i % W, Math.floor(i / W)) === 'bos')) { pd[i] = 0; q.push(i); } } for (let h = 0; h < q.length; h++) { const i = q[h], x = i % W, z = Math.floor(i / W); for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Z = z + dz; if (inb(X, Z) && pd[I(X, Z)] > pd[i] + 1) { pd[I(X, Z)] = pd[i] + 1; q.push(I(X, Z)); } } } }
  const plain = g => g === GR || g === FO || g === SA;
  const nearBusy = (x, z, rad) => { for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) { const X = x + dx, Z = z + dz; if (!inb(X, Z)) continue; if (!plain(ground[I(X, Z)]) || block[I(X, Z)] || keepSet.has(I(X, Z))) return true; } return false; };
  for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
    const i = I(x, z), g = ground[i]; if (block[i] || keepSet.has(i) || !plain(g) || inPen(x, z)) continue;
    const zn = zoneAt(x, z), edge = z <= 1 || x <= 1 || x >= W - 2; let kind = null;
    if (g === SA) { if (edge) { if (r() < .75) kind = 'rock'; } else if (zn === 'strand' && z <= 40 && !nearBusy(x, z, 1) && r() < .06) kind = 'palm'; }
    else if (edge) { if (r() < .9) kind = r() < .45 ? 'pine' : 'tree'; }
    else if (g === FO) { const inFront = [[0, -1], [0, -2], [-1, -1], [1, -1]].some(([dx, dz]) => inb(x + dx, z + dz) && pd[I(x + dx, z + dz)] === 0);   // a tree here would hide whoever walks the trail behind it
      if (r() < (inFront ? .03 : pd[i] <= 2 ? .13 : .58)) kind = r() < .5 ? 'pine' : 'tree'; }
    else if (zn === 'bos') { /* clearings stay open */ }
    else if (zn === 'dorp') { if (z >= 22) { if (r() < .45) kind = 'bush'; } else if (z >= 2 && z <= 20 && !nearBusy(x, z, 1) && r() < .2) kind = z > 18 ? 'bush' : (r() < .3 ? 'pine' : 'tree'); }
    else if (zn === 'wei') { if (!nearBusy(x, z, 1) && r() < .07) kind = r() < .5 ? 'tree' : 'bush'; }
    else if (zn === 'kasteel') { if (!nearBusy(x, z, 1) && r() < .12) kind = r() < .55 ? 'rose' : 'tree'; }
    if (kind) { trees.push({ kind, x, z, seed: Math.floor(r() * 6) + 1 }); block[i] = 1; }
  }

  /* ---- reachability: everything walkable must be reachable from the start; pockets get filled in ---- */
  const reach = new Uint8Array(W * H);
  { const s = I(Math.floor(START[0]), Math.floor(START[1])); const q = [s]; reach[s] = 1; for (let h = 0; h < q.length; h++) { const i = q[h], x = i % W, z = Math.floor(i / W); for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Z = z + dz; if (inb(X, Z) && !block[I(X, Z)] && !reach[I(X, Z)]) { reach[I(X, Z)] = 1; q.push(I(X, Z)); } } } }
  for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { const i = I(x, z); if (!block[i] && !reach[i]) { block[i] = 1; const g = ground[i]; trees.push({ kind: g === SA ? 'rock' : g === FO ? 'fern' : 'bush', x, z, seed: 1 + (x * 7 + z * 3) % 6 }); } }
  const free = (x, z) => inb(x, z) && !block[I(x, z)];

  /* ---- spawn spots for collectibles & egg hiding places ---- */
  const hides = (x, z) => inb(x, z) && block[I(x, z)] && ground[I(x, z)] !== SE;   // something tall stands here
  const pick = (n, pred, minDist) => {
    const c = []; for (let z = 1; z < H - 1; z++) for (let x = 1; x < W - 1; x++) if (free(x, z) && !keepSet.has(I(x, z)) && !hides(x, z + 1) && pred(x, z, ground[I(x, z)])) c.push([x, z]);
    for (let k = c.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1));[c[k], c[j]] = [c[j], c[k]]; }
    const out = []; for (const p of c) { if (out.length >= n) break; if (out.every(o => Math.hypot(o[0] - p[0], o[1] - p[1]) >= minDist)) out.push(p); }
    return out;
  };
  const isTree = (x, z) => inb(x, z) && block[I(x, z)] && !structural[I(x, z)];
  const nextTo = (x, z, f) => f(x + 1, z) || f(x - 1, z) || f(x, z + 1) || f(x, z - 1);
  const appleAt = new Set(trees.filter(t => t.kind === 'apple').map(t => I(t.x, t.z)));
  const farFromStart = (x, z) => Math.hypot(x - START[0], z - START[1]) > 7;
  const spawns = {
    bloem: pick(34, (x, z, g) => g === GR && !inPen(x, z) && (zoneAt(x, z) === 'dorp' || zoneAt(x, z) === 'wei'), 2.2),
    appel: pick(18, (x, z, g) => g !== PA && nextTo(x, z, (X, Z) => appleAt.has(I(X, Z))) || (g !== PA && [[1, 1], [-1, 1], [1, -1], [-1, -1]].some(([dx, dz]) => appleAt.has(I(x + dx, z + dz)))), 1),
    paddenstoel: pick(20, (x, z, g) => g === FO, 2.6),
    schelp: pick(22, (x, z, g) => g === SA && zoneAt(x, z) === 'strand' && z >= 37, 2.4),
    wortel: pick(14, (x, z, g) => g === SO && (x - GARDEN.x0) % 2 === 0, 1),
    diamant: pick(10, (x, z, g) => zoneAt(x, z) === 'kasteel' && g !== PA && z > 25, 3.2),
    munt: pick(44, (x, z, g) => g !== SO && !inPen(x, z) && farFromStart(x, z), 5),
  };
  const hidden = zn => pick(7, (x, z, g) => plain(g) && zoneAt(x, z) === zn && !inPen(x, z) && farFromStart(x, z) && nextTo(x, z, isTree) && !hides(x, z + 2), 5);
  const eggSpots = { bloem: hidden('dorp').concat(hidden('wei')), bos: hidden('bos'), zee: pick(7, (x, z, g) => g === SA && zoneAt(x, z) === 'strand' && z >= 38, 5).concat([[30, 45]]), kasteel: hidden('kasteel') };

  return { W, H, ground, block, trees, spawns, eggSpots, reach, I, inb, free };
}
