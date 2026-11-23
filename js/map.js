// The world as pure data (no rendering, no DOM) so it can be checked in node: `node tests/map.test.mjs`.
// Eenhoornland is a handful of separate islands in the sea. Each island is one area; the only ways between them are
// narrow wooden bridges (closed by brambles, boulders or a hole only a unicorn can jump) and one boat.
export const W = 150, H = 112;
/** the islands lie in rows 0..OUT_H-1; below that, under the sea, is solid rock with the places you walk into (ROOMS) */
export const OUT_H = 84, ROCK_Z = 88;
export const GR = 0, PA = 1, WA = 2, PL = 3, SA = 4, SE = 5, FO = 6, CO = 7, SO = 8, BW = 9, CV = 10, HF = 11, RK = 12; // grass path pond plaza sand sea forest cobble soil boardwalk, cave floor, hall floor, rock
/** every island: centre and half-sizes of a rounded rectangle with a wobbly edge */
export const ISLES = {
  dorp: { cx: 31, cz: 42, rx: 16, rz: 13 },
  bos: { cx: 33, cz: 14, rx: 21, rz: 10 },
  wei: { cx: 71, cz: 43, rx: 15, rz: 11 },
  strand: { cx: 66, cz: 71, rx: 24, rz: 7 },
  eiland: { cx: 132, cz: 66, rx: 9, rz: 6 },                    // far out in the open sea to the east: a voyage to get there
  kasteel: { cx: 84, cz: 14, rx: 17, rz: 10 },
};
const ZONES = Object.keys(ISLES);
const metric = (s, x, z) => Math.abs((x - s.cx) / s.rx) ** 2.6 + Math.abs((z - s.cz) / s.rz) ** 2.6;
const wobble = (s, x, z) => { const a = Math.atan2(z - s.cz, x - s.cx); return .07 * Math.sin(a * 5 + s.cx) + .05 * Math.sin(a * 9 + s.cz); };
/** the island a point belongs to (bridges and sea count for the nearest one) */
export function zoneAt(x, z) { let best = 'dorp', bd = 1e9; for (const k of ZONES) { const d = metric(ISLES[k], x, z); if (d < bd) { bd = d; best = k; } } return best; }
const onLand = (x, z) => ZONES.some(k => metric(ISLES[k], x + .5, z + .5) <= 1 + wobble(ISLES[k], x + .5, z + .5));

export const POND = { cx: 27, cz: 41, rx: 1.95, rz: 1.85 };
export const FOUNT = { cx: 32, cz: 41 };
export const START = [31.5, 36.6];                                                    // at her own front door: every day begins at home
export const LANTERNS = [[19, 38], [28, 38], [35, 38], [44, 38], [28, 44], [35, 44], [26, 47], [44, 43]];
export const GARDEN = { x0: 21, z0: 48, x1: 27, z1: 51 };                              // carrot patch
export const CLEARING = { cx: 30, cz: 12.5, rx: 4.6, rz: 3.4 };
export const ORCHARD = { cx: 45, cz: 12, rx: 3.6, rz: 3.2 };
export const NOOK = { cx: 16.5, cz: 16.5, rx: 2.6, rz: 2.4 };
export const CASTLE = { x: 80, z: 5, w: 9, d: 6, door: [84, 11] };
/** Places to walk into, Zelda style: a real room with walls, reached through a door in the world.
 *  `x0..x1, z0..z1` is the floor, `in` where she arrives, `exit` the tile in the south wall that leads back out to `out`,
 *  `door` the tile in the world that leads in. The cave is in the forest (the first egg lies there); the hall is inside
 *  the castle, with the coins, and its back door (`garden`) leads to the castle garden (act-kasteel.js). */
export const ROOMS = {
  grot: { x0: 20, z0: 97, x1: 34, z1: 107, in: [27, 106], exit: [27, 108], door: [36, 6], out: [36.5, 7.6], egg: [27, 99] },
  hal: { x0: 58, z0: 96, x1: 82, z1: 107, in: [70, 106], exit: [70, 108], door: [84, 11], out: [84.5, 12.6], garden: [70, 95] },
};
export const CAVE = { x0: 32, z0: 4, x1: 40, z1: 6 };                                   // the rock the cave mouth is in (ROOMS.grot.door)
export const roomAt = (x, z) => Object.keys(ROOMS).find(k => { const r = ROOMS[k]; return x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1 + 1; }) || null;
export const PEN = { x0: 33, z0: 47, x1: 42, z1: 51, gate: [[37, 47], [38, 47]] };    // dorp: the meadow where the unicorns of earlier adventures live (fence on the perimeter tiles, the gate is always open)
export const RACE = [44.5, 47.5];                                                     // dorp: the arch where the unicorn race starts
/** the boat sails between the two piers; `dock` is where you stand to step in, `moor` where the boat floats */
export const BOAT = { strand: { dock: [95, 70], moor: [96.6, 71] }, eiland: { dock: [117, 65], moor: [115.4, 66] } };
export const RAINBOW_TREE = [129, 64];
/** little islands in the open sea that nobody walks on, each with something on it to sail past */
export const ISLETS = [
  { kind: 'vuurtoren', cx: 109, cz: 41, rx: 2.2, rz: 1.6 },   // a lighthouse
  { kind: 'zeehonden', cx: 104, cz: 61, rx: 3, rz: 1.3 },     // a sandbank with seals
  { kind: 'palmeiland', cx: 139, cz: 40, rx: 2.4, rz: 1.7 },  // one palm and a treasure chest
  { kind: 'rots', cx: 121, cz: 50, rx: 1.4, rz: 1 }, { kind: 'rots', cx: 98, cz: 78, rx: 1.2, rz: .9 }, { kind: 'rots', cx: 126, cz: 79, rx: 1.5, rz: 1 }, { kind: 'rots', cx: 117, cz: 31, rx: 1.3, rz: .9 },
];
export const isletAt = (x, z) => ISLETS.find(i => ((x + .5 - i.cx) / i.rx) ** 2 + ((z + .5 - i.cz) / i.rz) ** 2 <= 1) || null;
export const BIKE = [42.5, 43.5];                                                     // not at the front door: the morning starts quiet
export const BALLS = [[22.5, 42.5], [58.5, 72.5]];
/* ---- every island has a toy of its own (world-toys.js, world-play.js); none of it is needed for the adventure ---- */
export const STALL = { x: 36, z: 40, w: 2 };                                          // dorp: the stall where found things are traded for things to wear
export const POTS = [[29.5, 35.45], [30.45, 35.45], [32.55, 35.45], [33.5, 35.45]];   // dorp: flower pots at the front door
export const CAN = [28.4, 35.6];                                                      // dorp: the watering can (filled at the pond or the fountain)
export const RAMPS = [[24.5, 37], [25.5, 46], [61.5, 46.2]];                          // dorp and wei: only a bike takes off from these
export const HIDES = [[28, 15], [33, 11], [27, 11], [43, 13], [47, 12], [21, 12], [32, 15]];   // bos: bushes somebody hides in
export const KITE = [62.5, 44.4];                                                     // wei: a kite for the wind
export const BUCKET = [57.5, 70.5];                                                   // strand: a bucket for sand towers
export const PAINT = [[137.5, 65.5], [135.5, 68.5], [133.5, 64.5]];                      // eiland: red, yellow and blue puddles
/** the part of the sea the boat sails on: marked with buoys, so nobody sails off the map */
export const LAGOON = { x0: 92, z0: 27, x1: 146, z1: 81 };
export const WHALE = [113.5, 73.5];
/** the old pier at the west end of the beach: where you fish (world-toys.js) */
export const FISH = { pier: [39, 70], spot: [36.5, 71] };
/** the houses you can go into: one on every island that has people */
export const HOUSES = {
  huisje: { x: 29, z: 31, w: 5, d: 4 },                  // dorp
  atelier: { x: 21, z: 6, w: 5, d: 4 },                  // bos
  bakkerij: { x: 68, z: 37, w: 5, d: 4 },                // wei
  kermis: { tent: true, cx: 80.5, cz: 70.5, r: 2.15 },   // strand
  stal: { x: 93, z: 11, w: 5, d: 4 },                    // kasteel: the castle stable, where a unicorn that can be ridden is fed, washed and brushed
};
export const houseRect = h => h.tent ? [Math.floor(h.cx) - 2, Math.floor(h.cz) - 2, Math.floor(h.cx) + 2, Math.floor(h.cz) + 2] : [h.x, h.z, h.x + h.w - 1, h.z + h.d - 1];
export const houseDoor = h => h.tent ? [Math.floor(h.cx), Math.floor(h.cz) + 3] : [h.x + Math.floor(h.w / 2), h.z + h.d];
/** places you can ask to walk to (map screen) */
export const PLACES = {
  dorp: { name: 'Dorp', tile: [31, 44] }, bos: { name: 'Bos', tile: [31, 13] }, wei: { name: 'Bloemenwei', tile: [64, 45] },
  strand: { name: 'Strand', tile: [62, 67] }, eiland: { name: 'Regenboogeiland', tile: [134, 67] }, kasteel: { name: 'Kasteel', tile: [84, 13] },
};
export const inPen = (x, z) => x > PEN.x0 && x < PEN.x1 && z > PEN.z0 && z < PEN.z1;

function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/** block[] values: 0 free, 1 solid, LOW can be jumped over, BREAK is removed with a tool, GAP only a ridden unicorn jumps */
export const LOW = 2, BREAK = 3, GAP = 4;
export const TOOL_FOR = { bramble: 'zwaard', boulder: 'hamer', gat: 'rit' };

/** Builds the world. `seed` 0 is the first, hand-tuned one; every later cycle passes a new seed, which reshuffles
 *  everything outside the village. A seed that fails `validate` is skipped. */
export function buildMap(opts = {}) {
  opts = { solids: Object.values(HOUSES).map(houseRect), keep: Object.values(HOUSES).map(houseDoor).concat([CASTLE.door]), ...opts };
  let seed = opts.seed | 0, m = null; const skipped = [];
  for (let k = 0; k < 12; k++) { m = _build({ ...opts, seed }); m.problems = validate(m, opts.keep || []); if (!m.problems.length) break; skipped.push(...m.problems); seed = (seed + 7919) | 0; }
  m.skipped = skipped; return m;
}
export function _build({ solids = [], keep = [], seed = 0 } = {}) {
  const ground = new Uint8Array(W * H), block = new Uint8Array(W * H), deck = new Uint8Array(W * H), zone = new Array(W * H);
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
  const keepSet = new Set(keep.concat(Object.values(PLACES).map(p => p.tile), [BOAT.strand.dock, BOAT.eiland.dock], BALLS.map(b => [Math.floor(b[0]), Math.floor(b[1])]), [[Math.floor(BIKE[0]), Math.floor(BIKE[1])], [Math.floor(START[0]), Math.floor(START[1])], [RAINBOW_TREE[0] + 1, RAINBOW_TREE[1] + 1], [RAINBOW_TREE[0], RAINBOW_TREE[1] + 1], [RAINBOW_TREE[0] + 1, RAINBOW_TREE[1]]],
    [...POTS, CAN, KITE, BUCKET, ...RAMPS, ...PEN.gate, [PEN.gate[0][0], PEN.gate[0][1] - 1], [RACE[0], RACE[1] - 1], RACE, [RACE[0], RACE[1] + 1], ROOMS.grot.door, [ROOMS.grot.door[0], ROOMS.grot.door[1] + 1], [ROOMS.grot.door[0], ROOMS.grot.door[1] + 2], [STALL.x, STALL.z + 1], [STALL.x + 1, STALL.z + 1], [27, 35], [28, 36], [58, 70], [57, 71]].map(([x, z]) => [Math.floor(x), Math.floor(z)])).map(([x, z]) => I(x, z)));

  /* ---- the islands in the sea ---- */
  for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
    const i = I(x, z);
    if (z >= ROCK_Z) { const rm = roomAt(x, z); zone[i] = rm || 'rots'; ground[i] = RK; block[i] = 1; continue; }   // rooms are carved out below
    const zn = zone[i] = zoneAt(x + .5, z + .5);
    if (isletAt(x, z) && !onLand(x, z)) { ground[i] = SA; block[i] = 1; zone[i] = 'zee'; continue; }   // seen, never walked on
    if (!onLand(x, z) || x < 4 || z < 4 || x >= W - 4 || z >= OUT_H - 4) { ground[i] = SE; block[i] = 1; continue; }
    ground[i] = zn === 'bos' ? FO : zn === 'strand' ? SA : zn === 'eiland' ? (metric(ISLES.eiland, x + .5, z + .5) < .42 ? GR : SA) : GR;
  }
  /* ---- the rooms under the rock ---- */
  for (const [k, r] of Object.entries(ROOMS)) {
    for (let z = r.z0; z <= r.z1; z++) for (let x = r.x0; x <= r.x1; x++) { ground[I(x, z)] = k === 'grot' ? CV : HF; block[I(x, z)] = 0; }
    ground[I(...r.exit)] = k === 'grot' ? CV : HF; block[I(...r.exit)] = 0;
  }
  const sea = (x, z) => !inb(x, z) || ground[I(x, z)] === SE;
  const rim = new Uint8Array(W * H);                              // a strip of beach around every island
  for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) if (!sea(x, z) && (sea(x + 1, z) || sea(x - 1, z) || sea(x, z + 1) || sea(x, z - 1) || sea(x + 1, z + 1) || sea(x - 1, z - 1) || sea(x + 1, z - 1) || sea(x - 1, z + 1))) rim[I(x, z)] = 1;
  for (let i = 0; i < W * H; i++) if (rim[i] && ground[i] !== RK && ground[i] !== CV && ground[i] !== HF) ground[i] = SA;

  /* ---- dorp ---- */
  rect(20, 36, 43, 37, PA); rect(31, 35, 32, 50, PA); rect(20, 45, 46, 46, PA); rect(29, 39, 34, 43, PL); rect(40, 31, 41, 35, PA); rect(28, 49, 30, 50, PA);
  for (let z = 30; z < 54; z++) for (let x = 16; x < 46; x++) if (((x + .5 - POND.cx) / POND.rx) ** 2 + ((z + .5 - POND.cz) / POND.rz) ** 2 <= 1) { ground[I(x, z)] = WA; block[I(x, z)] = 1; }
  rect(GARDEN.x0, GARDEN.z0, GARDEN.x1, GARDEN.z1, SO);
  /* ---- bos ---- */
  disc(CLEARING, GR); disc(ORCHARD, GR); disc(NOOK, GR);
  trail([[41, 23.5], [41, 19.5], [37.5, 16], [34, 13.5]]);
  trail([[41, 19.5], [43.5, 16], [44.5, 14]]);
  disc({ cx: 23.5, cz: 11.6, rx: 4.4, rz: 2.3 }, GR); trail([[26, 12.5], [23.5, 11.5]]);          // the atelier's glade
  trail([[26, 13.5], [21.5, 15.5], [18.5, 16.5]], .7);
  trail([[32, 11.5], [34.5, 9], [36.5, 7.5]], .75);                                              // up to the cave in the rock
  for (let z = CAVE.z0; z <= CAVE.z1 + 1; z++) for (let x = CAVE.x0; x <= CAVE.x1; x++) if (ground[I(x, z)] === SE) ground[I(x, z)] = FO;
  /* ---- wei ---- */
  trail([[57, 46], [65, 46], [70.5, 43.5], [70.5, 41.5]]); trail([[71, 44], [71, 53.5]]); trail([[71, 43.5], [76, 39], [77, 33.5]]);
  /* ---- strand ---- */
  rect(70, 64, 71, 66, BW); rect(46, 66, 86, 67, BW); rect(44, 68, 45, 71, BW); rect(46, 68, 47, 69, BW); rect(79, 68, 80, 68, BW); rect(83, 68, 84, 73, BW); rect(80, 73, 82, 73, BW);
  /* ---- eiland ---- */
  trail([[123.5, 66], [128, 66.5], [134, 67]], .7);
  /* ---- kasteel ---- */
  rect(76, 13, 77, 23, PA); rect(78, 11, 91, 14, CO); rect(89, 15, 96, 16, CO); rect(83, 15, 86, 21, CO);

  /* ---- bridges and piers lie on the water ---- */
  const plank = (x0, z0, x1, z1) => { for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) { if (ground[I(x, z)] === SE) deck[I(x, z)] = 1; ground[I(x, z)] = BW; block[I(x, z)] = 0; } };   // deck: planks over open water
  plank(40, 23, 41, 31); plank(46, 45, 57, 46); plank(70, 53, 71, 65); plank(76, 23, 77, 33);
  plank(39, 70, 44, 71);                                            // the old pier: now the fishing spot
  rect(85, 70, 88, 71, BW); plank(88, 70, 95, 71); plank(117, 65, 123, 66);   // the boat: from the east end of the beach to the rainbow island
  const bridgeTiles = new Set(); for (let i = 0; i < W * H; i++) if (ground[i] === BW) bridgeTiles.add(i);

  /* ---- solid things ---- */
  const solid = (x0, z0, x1, z1) => { for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (inb(x, z)) block[I(x, z)] = 1; };
  for (const s of solids) solid(...s);
  solid(31, 40, 32, 41);                                         // fountain
  solid(STALL.x, STALL.z, STALL.x + STALL.w - 1, STALL.z);       // the stall
  for (const [x, z] of LANTERNS) block[I(x, z)] = 1;
  solid(CASTLE.x, CASTLE.z, CASTLE.x + CASTLE.w - 1, CASTLE.z + CASTLE.d - 1);
  solid(CAVE.x0, CAVE.z0, CAVE.x1, CAVE.z1); block[I(...ROOMS.grot.door)] = 0;                   // the rock, with the dark mouth of the cave in it
  for (let z = PEN.z0; z <= PEN.z1; z++) for (let x = PEN.x0; x <= PEN.x1; x++) { if (ground[I(x, z)] === SA) ground[I(x, z)] = GR; if ((x === PEN.x0 || x === PEN.x1 || z === PEN.z0 || z === PEN.z1) && !PEN.gate.some(g => g[0] === x && g[1] === z)) block[I(x, z)] = 1; }
  const structural = block.slice();                               // everything that is not vegetation

  /* ---- what closes the bridges ---- */
  const trees = [], obstacles = [];
  const gate = (kind, tiles) => { const g = obstacles.length; for (const [x, z] of tiles) { obstacles.push({ kind, type: kind === 'gat' ? 'gap' : 'break', tool: TOOL_FOR[kind], x, z, gate: true, g }); block[I(x, z)] = kind === 'gat' ? GAP : BREAK; if (kind === 'gat') { ground[I(x, z)] = SE; deck[I(x, z)] = 0; } } };
  gate('bramble', [[49, 45], [49, 46]]);                          // dorp -> wei
  gate('boulder', [[70, 58], [71, 58]]);                          // wei -> strand
  gate('gat', [[76, 28], [77, 28]]);                              // wei -> kasteel: the bridge is broken

  /* ---- fixed props (blocked, drawn as billboards) ---- */
  const prop = (kind, x, z, seed = 1) => { if (!inb(x, z) || block[I(x, z)] || keepSet.has(I(x, z))) return; const g = ground[I(x, z)]; if (g === PA || g === BW || g === PL || g === SE) return; trees.push({ kind, x, z, seed, fixed: true }); block[I(x, z)] = 1; };
  [[43, 10], [47, 10], [42, 14], [48, 14], [45, 9], [33, 9], [27, 16]].forEach(([x, z], k) => prop('apple', x, z, k + 1));
  prop('oak', 30, 10); prop('stump', 26, 10); prop('stump', 15, 14); prop('log', 34, 15);
  prop('scarecrow', 20, 49); prop('sign', 42, 34, 2); prop('sign', 45, 44, 1); prop('sign', 72, 51, 3); prop('sign', 78, 34, 4);
  prop('umbrella', 52, 70); prop('sandcastle', 60, 71); prop('umbrella', 72, 72, 2);
  prop('statue', 84, 13); prop('flag', 78, 10); prop('flag', 90, 10, 2); prop('flag', 79, 15); prop('flag', 88, 15, 2);
  prop('trough', 40, 50); prop('hay', 35, 50); prop('hay', 98, 13); prop('trough', 92, 16);
  prop('rainbowtree', RAINBOW_TREE[0], RAINBOW_TREE[1]);
  for (let x = 69; x <= 75; x += 2) prop('hedge', x, 17, x);

  /* ---- the furniture of the rooms (blocks, like trees; drawn by art.js propArt) ---- */
  { const g = ROOMS.grot, h = ROOMS.hal;
    for (const [x, z] of [[21, 98], [22, 104], [33, 98], [33, 105], [24, 101], [31, 102], [20, 106], [34, 101]]) prop('druipsteen', x, z, x + z);
    for (const [x, z] of [[20, 101], [29, 98], [34, 103], [25, 98]]) prop('kristal', x, z, x * 3 + z);
    for (const [x, z] of [[61, 96], [66, 96], [74, 96], [79, 96]]) prop('harnas', x, z, x);
    for (const [x, z] of [[64, 100], [76, 100], [64, 104], [76, 104]]) prop('zuil', x, z);
    for (const [x, z] of [[58, 98], [82, 98], [58, 106], [82, 106], [59, 97]]) prop('muntberg', x, z, x + z);
    block[I(...h.garden)] = 0; ground[I(...h.garden)] = HF; }

  /* ---- vegetation ---- */
  const rDorp = mulberry(20251122), rOut = mulberry((20251122 ^ Math.imul(seed, 2654435761)) | 0);   // the village never changes
  const pd = new Int16Array(W * H).fill(99);                      // distance to the nearest path / clearing
  { const q = []; for (let i = 0; i < W * H; i++) { const g = ground[i]; if (g === PA || g === PL || g === CO || g === BW || (g === GR && zone[i] === 'bos')) { pd[i] = 0; q.push(i); } } for (let h = 0; h < q.length; h++) { const i = q[h], x = i % W, z = Math.floor(i / W); for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Z = z + dz; if (inb(X, Z) && pd[I(X, Z)] > pd[i] + 1) { pd[I(X, Z)] = pd[i] + 1; q.push(I(X, Z)); } } } }
  const plain = g => g === GR || g === FO || g === SA;
  const nearBusy = (x, z, rad) => { for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) { const X = x + dx, Z = z + dz; if (!inb(X, Z)) continue; if (!plain(ground[I(X, Z)]) || block[I(X, Z)] || keepSet.has(I(X, Z))) return true; } return false; };
  const nearBridge = (x, z) => { for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inb(x + dx, z + dz) && bridgeTiles.has(I(x + dx, z + dz))) return true; return false; };
  for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
    const i = I(x, z), g = ground[i]; if (block[i] || keepSet.has(i) || !plain(g) || inPen(x, z) || nearBridge(x, z)) continue;
    const zn = zone[i], beach = zn === 'strand' || zn === 'eiland'; let kind = null;
    const r = zn === 'dorp' ? rDorp : rOut;
    const inFront = [[0, -1], [0, -2], [0, -3], [-1, -1], [1, -1], [-1, -2], [1, -2]].some(([dx, dz]) => inb(x + dx, z + dz) && pd[I(x + dx, z + dz)] === 0);   // a tree here would hide whoever walks the trail behind it
    // every island has plants of its own (VEG): nothing grows on two islands
    if (g === SA) { if (rim[i]) { if (r() < (beach ? .22 : zn === 'bos' ? .5 : .34)) kind = 'rots-' + (zn === 'eiland' || zn === 'zee' ? 'eiland' : zn); } else if (zn === 'strand' && !nearBusy(x, z, 1) && r() < .1) kind = r() < .55 ? 'palm' : 'helm'; else if (zn === 'eiland' && !nearBusy(x, z, 1) && r() < .05) kind = 'kristalbloem'; }
    else if (g === FO) { if (r() < (inFront ? .03 : pd[i] <= 2 ? .13 : .58)) kind = r() < .55 ? 'pine' : 'berk'; }
    else if (zn === 'bos') { /* clearings stay open */ }
    else if (zn === 'dorp') { if (!nearBusy(x, z, 1) && !inFront && r() < .17) kind = r() < .35 ? 'bol' : 'tree'; }
    else if (zn === 'wei') { if (!nearBusy(x, z, 1) && !inFront && r() < .06) kind = r() < .5 ? 'bloesem' : 'zonnebloemen'; }
    else if (zn === 'kasteel') { if (!nearBusy(x, z, 1) && !inFront && r() < .12) kind = r() < .4 ? 'rose' : r() < .6 ? 'cipres' : 'lavendel'; }
    else if (zn === 'eiland') { if (!nearBusy(x, z, 1) && r() < .1) kind = r() < .45 ? 'lolly' : 'wolkstruik'; }
    if (kind) { trees.push({ kind, x, z, seed: Math.floor(r() * 6) + 1 }); block[i] = 1; }
  }

  const r = rOut;
  const free = (x, z) => inb(x, z) && !block[I(x, z)];
  const hides = (x, z) => inb(x, z) && block[I(x, z)] === 1 && ground[I(x, z)] !== SE;   // something tall stands here
  const pick = (n, pred, minDist) => {
    const c = []; for (let z = 1; z < OUT_H - 1; z++) for (let x = 1; x < W - 1; x++) if (free(x, z) && !keepSet.has(I(x, z)) && !hides(x, z + 1) && pred(x, z, ground[I(x, z)], zone[I(x, z)])) c.push([x, z]);
    for (let k = c.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1));[c[k], c[j]] = [c[j], c[k]]; }
    const out = []; for (const p of c) { if (out.length >= n) break; if (out.every(o => Math.hypot(o[0] - p[0], o[1] - p[1]) >= minDist)) out.push(p); }
    return out;
  };
  const clearView = (x, z) => { for (let dz = 1; dz <= 3; dz++) for (let dx = -1; dx <= 1; dx++) if (hides(x + dx, z + dz)) return false; return true; };   // nothing tall between it and the camera
  const farFromStart = (x, z) => Math.hypot(x - START[0], z - START[1]) > 7;

  /* ---- things to jump over (logs, puddles) and loose things to cut or smash for a coin ---- */
  const open4 = (x, z) => free(x - 1, z) && free(x + 1, z) && free(x, z - 1) && free(x, z + 1);
  const puddles = [];                                             // rain puddles block nothing: they are for jumping in (world-toys.js)
  const low = (x, z, kind) => { if (!free(x, z) || keepSet.has(I(x, z))) return; if (kind === 'plas') { puddles.push([x, z]); keepSet.add(I(x, z)); return; } obstacles.push({ kind, type: 'low', x, z }); block[I(x, z)] = LOW; };
  low(40, 27, 'log'); low(41, 27, 'log');                         // on the bridge to the forest: the first jump
  low(22, 37, 'plas');                                            // one puddle in the whole world, in the village: more is just clutter
  for (const [x, z] of pick(3, (x, z, g, zn) => g === PA && zn === 'bos' && open4(x, z), 7)) low(x, z, 'log');
  for (const [x, z] of pick(3, (x, z, g, zn) => g === FO && !rim[I(x, z)] && open4(x, z), 6)) low(x, z, 'log');
  const loose = (kind, n, pred) => { for (const [x, z] of pick(n, (x, z, g, zn) => plain(g) && pred(zn) && !inPen(x, z) && !nearBusy(x, z, 1), 5)) { obstacles.push({ kind, type: 'break', tool: TOOL_FOR[kind], x, z, gate: false, g: obstacles.length }); block[I(x, z)] = BREAK; } };
  loose('bramble', 4, zn => zn === 'bos' || zn === 'wei'); loose('boulder', 4, zn => zn === 'strand' || zn === 'kasteel' || zn === 'eiland');

  /* ---- reachability: walking, jumping over LOW tiles, passing BREAK tiles you own the tool for, riding over the gap, the boat ---- */
  const toolAt = new Map(obstacles.filter(o => o.type !== 'low').map(o => [I(o.x, o.z), o.tool]));
  const docks = [I(...BOAT.strand.dock), I(...BOAT.eiland.dock)];
  const links = new Map(); for (const r of Object.values(ROOMS)) { links.set(I(...r.door), I(...r.in)); links.set(I(...r.exit), I(...r.door)); }   // walking through a door
  const flood = tools => {
    const re = new Uint8Array(W * H), s = I(Math.floor(START[0]), Math.floor(START[1])), q = [s]; re[s] = 1;
    const add = j => { if (!re[j]) { re[j] = 1; q.push(j); } };
    for (let h = 0; h < q.length; h++) {
      const i = q[h], x = i % W, z = Math.floor(i / W);
      if (i === docks[0]) add(docks[1]); if (i === docks[1]) add(docks[0]); if (links.has(i)) add(links.get(i));
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        let X = x + dx, Z = z + dz; if (!inb(X, Z)) continue; let j = I(X, Z);
        if (block[j] === LOW || (block[j] === GAP && tools.rit)) { X += dx; Z += dz; if (!inb(X, Z)) continue; j = I(X, Z); if (block[j]) continue; }
        else if (block[j] && !(block[j] === BREAK && tools[toolAt.get(j)])) continue;
        add(j);
      }
    }
    return re;
  };
  // everything walkable must be reachable in the end; pockets get filled in
  const reach = flood({ zwaard: 1, hamer: 1, rit: 1 });
  const FILL = { dorp: 'bol', bos: 'fern', wei: 'zonnebloemen', strand: 'helm', eiland: 'wolkstruik', kasteel: 'lavendel' };
  for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { const i = I(x, z); if (!block[i] && !reach[i]) { block[i] = 1; const g = ground[i], zn = zone[i]; trees.push({ kind: g === SA ? 'rots-' + (zn === 'zee' ? 'eiland' : zn) : g === FO ? 'fern' : FILL[zn] || 'fern', x, z, seed: 1 + (x * 7 + z * 3) % 6 }); } }
  // a log that lost its landing spot to a filled pocket becomes an ordinary bush
  for (let k = obstacles.length - 1; k >= 0; k--) { const o = obstacles[k]; if (o.type !== 'low' || (free(o.x - 1, o.z) && free(o.x + 1, o.z)) || (free(o.x, o.z - 1) && free(o.x, o.z + 1))) continue; obstacles.splice(k, 1); block[I(o.x, o.z)] = 1; trees.push({ kind: 'fern', x: o.x, z: o.z, seed: 1 + (o.x + o.z) % 6 }); }
  const reach0 = flood({}), reach1 = flood({ zwaard: 1 }), reach2 = flood({ zwaard: 1, hamer: 1 });   // no tools / shears / shears and hammer
  const at = (m, x, z) => !!m[I(x, z)];

  /* ---- where the tools lie: the shears in the village, the hammer in the forest ---- */
  const toolSpots = {
    zwaard: pick(1, (x, z, g, zn) => g === GR && zn === 'dorp' && at(reach0, x, z) && farFromStart(x, z) && !nearBusy(x, z, 1) && clearView(x, z), 0)[0] || [24, 47],
    hamer: pick(1, (x, z, g, zn) => zn === 'bos' && x < 28 && at(reach0, x, z) && open4(x, z) && clearView(x, z), 0)[0] || [18, 16],
  };
  /* ---- the fallen star that hatches the egg lies somewhere deep in the flower meadow ---- */
  const starSpots = pick(5, (x, z, g, zn) => g === GR && zn === 'wei' && x > 73 && at(reach1, x, z) && open4(x, z) && clearView(x, z), 3);

  /* ---- pebbles to pick up and throw: on the sand of every island, three of them in the village ---- */
  const stones = pick(3, (x, z, g, zn) => g === SA && zn === 'dorp' && at(reach0, x, z) && clearView(x, z), 5).concat(pick(8, (x, z, g, zn) => g === SA && zn !== 'dorp' && at(reach, x, z) && clearView(x, z), 9));

  /* ---- spawn spots for collectibles & egg hiding places ---- */
  const isTree = (x, z) => inb(x, z) && block[I(x, z)] && !structural[I(x, z)] && ground[I(x, z)] !== SE;
  const nextTo = (x, z, f) => f(x + 1, z) || f(x - 1, z) || f(x, z + 1) || f(x, z - 1);
  const appleAt = new Set(trees.filter(t => t.kind === 'apple').map(t => I(t.x, t.z)));
  const spawns = {
    bloem: pick(44, (x, z, g, zn) => g === GR && !inPen(x, z) && (zn === 'dorp' || zn === 'wei'), 2.2),
    appel: pick(18, (x, z, g) => g !== PA && nextTo(x, z, (X, Z) => appleAt.has(I(X, Z))) || (g !== PA && [[1, 1], [-1, 1], [1, -1], [-1, -1]].some(([dx, dz]) => appleAt.has(I(x + dx, z + dz)))), 1),
    paddenstoel: pick(22, (x, z, g) => g === FO, 2.6),
    schelp: pick(26, (x, z, g, zn) => g === SA && (zn === 'strand' || zn === 'eiland'), 2.4),
    wortel: pick(14, (x, z, g) => g === SO && (x - GARDEN.x0) % 2 === 0, 1),
    diamant: pick(12, (x, z, g, zn) => (zn === 'kasteel' || zn === 'eiland') && g !== PA && g !== BW && !inPen(x, z), 3.2),
    munt: pick(60, (x, z, g) => g !== SO && !inPen(x, z) && farFromStart(x, z), 5),
  };
  const need = { dorp: reach0, bos: reach0, wei: reach1, strand: reach2, eiland: reach2 };
  const hidden = zn => pick(7, (x, z, g, zo) => plain(g) && zo === zn && at(need[zn], x, z) && farFromStart(x, z) && !nearBridge(x, z) && nextTo(x, z, isTree) && !hides(x, z + 2), 5);
  const eggSpots = { dorp: hidden('dorp'), bos: [ROOMS.grot.egg], wei: hidden('wei'), strand: hidden('strand'), eiland: hidden('eiland') };   // a forest egg always lies in the cave

  return { W, H, seed, ground, block, deck, zone, trees, obstacles, puddles, stones, toolSpots, starSpots, spawns, eggSpots, reach, reach0, reach1, reach2, I, inb, free };
}

/** What is wrong with a generated world (empty = fine). Used to skip bad seeds and by tests/map.test.mjs. */
export function validate(m, keep = []) {
  const bad = [], I = m.I, ok = (c, msg) => { if (!c) bad.push(msg); };
  for (const [k, v] of Object.entries(m.spawns)) { ok(v.length >= 8, k + ' has too few spots'); for (const [x, z] of v) ok(m.reach[I(x, z)] && !m.block[I(x, z)], k + ' spot unreachable ' + x + ',' + z); }
  const mask = { dorp: m.reach0, bos: m.reach0, wei: m.reach1, strand: m.reach2, eiland: m.reach2 };
  for (const [k, v] of Object.entries(m.eggSpots)) { ok(v.length >= (k === 'bos' ? 1 : 3), 'egg ' + k + ' too few'); for (const [x, z] of v) ok(mask[k][I(x, z)], 'egg spot unreachable ' + k + ' ' + x + ',' + z); }
  for (const [x, z] of keep) ok(m.reach[I(x, z)], 'door unreachable ' + x + ',' + z);
  for (const [k, p] of Object.entries(PLACES)) ok(m.reach[I(...p.tile)] && !m.block[I(...p.tile)], 'place unreachable ' + k);
  for (const g of PEN.gate) ok(m.reach0[I(...g)], 'the unicorn meadow must be open from the start');
  ok(m.reach0[I(PEN.x0 + 3, PEN.z0 + 2)], 'pen interior unreachable'); ok(m.reach0[I(Math.floor(RACE[0]), Math.floor(RACE[1]) - 1)], 'race arch unreachable');
  ok(m.reach[I(...CASTLE.door)] && !m.reach2[I(...CASTLE.door)], 'the castle door must need the unicorn');
  // the adventure in order: egg and hammer in the forest, shears in the village, star behind the brambles, fruit over the sea
  const free = ([x, z]) => !m.block[I(x, z)];
  ok(m.reach0[I(...m.toolSpots.zwaard)] && free(m.toolSpots.zwaard), 'shears unreachable'); ok(m.reach0[I(...m.toolSpots.hamer)] && free(m.toolSpots.hamer), 'hammer unreachable');
  ok(m.starSpots.length >= 3, 'too few star spots'); for (const s of m.starSpots) ok(m.reach1[I(...s)] && !m.reach0[I(...s)], 'star spot must lie behind the brambles');
  ok(m.reach2[I(...BOAT.strand.dock)] && !m.reach1[I(...BOAT.strand.dock)], 'boat must lie behind the boulders'); ok(m.reach2[I(...BOAT.eiland.dock)], 'island pier unreachable');
  ok(m.reach2[I(RAINBOW_TREE[0] + 1, RAINBOW_TREE[1] + 1)], 'rainbow tree unreachable');
  ok(m.reach0[I(Math.floor(BIKE[0]), Math.floor(BIKE[1]))], 'bike unreachable'); for (const b of BALLS) ok(m.reach[I(Math.floor(b[0]), Math.floor(b[1]))], 'ball unreachable');
  // the toys: everything a child sees must be reachable, in the part of the world it belongs to
  const T = ([x, z]) => I(Math.floor(x), Math.floor(z));
  for (const p of [...POTS, CAN, [STALL.x, STALL.z + 1]]) ok(m.reach0[T(p)] && !m.block[T(p)], 'village toy unreachable ' + p);
  ok(m.reach1[T(KITE)] && !m.block[T(KITE)], 'kite unreachable'); ok(m.reach2[T(BUCKET)] && !m.block[T(BUCKET)], 'bucket unreachable');
  for (const p of RAMPS) ok(m.reach[T(p)] && !m.block[T(p)], 'ramp unreachable ' + p);
  let sail = 0; for (let z = LAGOON.z0; z <= LAGOON.z1; z++) for (let x = LAGOON.x0; x <= LAGOON.x1; x++) if (m.ground[I(x, z)] === SE && !m.deck[I(x, z)]) sail++;
  ok(sail > 300, 'the lagoon is too small to sail on'); ok(m.ground[T(WHALE)] === SE, 'the whale lies on land');
  let leak0 = 0, leak1 = 0, leak2 = 0, un = 0, home = 0;
  for (let i = 0; i < m.block.length; i++) {
    const zn = m.zone[i]; if (m.ground[i] === BW) continue;      // bridges belong to both sides
    if (m.reach0[i] && zn !== 'dorp' && zn !== 'bos' && zn !== 'grot') leak0++; if (m.reach1[i] && (zn === 'strand' || zn === 'eiland' || zn === 'kasteel')) leak1++; if (m.reach2[i] && zn === 'kasteel') leak2++;
    if (!m.block[i] && !m.reach[i]) un++; if (!m.block[i] && !m.reach0[i] && (zn === 'dorp' || zn === 'bos' || zn === 'grot')) home++;
  }
  ok(!leak0, leak0 + ' tiles beyond the brambles reachable without tools'); ok(!leak1, leak1 + ' tiles beyond the boulders reachable without the hammer'); ok(!leak2, leak2 + ' castle tiles reachable without riding');
  ok(!un, un + ' walkable-but-unreachable tiles'); ok(!home, home + ' village/forest tiles need a tool');
  for (const t of ['zwaard', 'hamer', 'rit']) ok(m.obstacles.some(o => o.gate && o.tool === t), 'no gate for ' + t);
  for (const o of m.obstacles) if (o.type === 'low') ok([[1, 0], [0, 1]].some(([dx, dz]) => !m.block[I(o.x + dx, o.z + dz)] && !m.block[I(o.x - dx, o.z - dz)]), 'cannot jump over ' + o.x + ',' + o.z);
  return bad;
}
