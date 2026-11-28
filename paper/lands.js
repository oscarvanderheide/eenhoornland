// The world: where each set stands, and which sets exist together. A set file thinks in its own measure (its own middle at
// 0, 0); the stage puts it at ORIGIN and moves everything it registers there (paper.js buildSet).
import { blob, rng } from './kit.js';

/** how spread out a set is: every place on it is this much further from the set's middle than on the pixel game's map at 0.6
 *  of a step per tile, while the things themselves keep their size. Oscar, 2026-11-26: at 1 everything felt cramped */
export const SPREAD = 1.7;
const K = SPREAD, wide = o => { for (const k of Object.keys(o)) { const v = o[k]; o[k] = Array.isArray(v[0]) && Array.isArray(v[0][0]) ? v.map(p => p.map(([x, z]) => [x * K, z * K])) : Array.isArray(v[0]) ? v.map(([x, z]) => [x * K, z * K]) : [v[0] * K, v[1] * K]; } return o; };
/** how far the forest's shore lies from the village's: the length of the bridge between them. One number: change it and the
 *  forest, the bridge and the far shot all move with it */
export const NORTH_GAP = 13;
/** and how far the meadow's shore lies from the village's, over the east bridge */
export const EAST_GAP = 12;
export const ORIGIN = { eiland: [0, 0], dorp: [0, 0], bos: [1.2 * K, -12.5 * K - NORTH_GAP], huis: [-260, 0], wei: [9.97 * K + EAST_GAP + 15.2, 2.4 * K - 2.55] };   // (the room inside her house stands far off to the side, beyond what any camera in the world can see)
/** where the theatre's hills stand when the village and the forest exist: behind the forest's north shore (on the island they stand at -16 and further) */
export const BACK = ORIGIN.bos[1] - 8.2 * K - 5 + 16;
/** The worlds: every set of a world exists at once, built at the start (a far set costs nothing while it is out of view).
 *  The first test island is a world of its own; everything else is one world, joined by bridges and doors */
export const WORLDS = [['eiland'], ['dorp', 'bos', 'huis', 'wei', 'strand', 'regenboog', 'kasteel', 'grot', 'hol', 'winkel', 'boomhut', 'blokhut', 'kasteelzaal', 'kasteeltoren', 'sneeuw']];

export function dorpLand() {
  // the terrace: a card with round corners (a blob would leave the street no room along its front)
  const HIGH = (() => { const R = rng(76), cx = -.1, cz = -5.05, hx = 4.5, hz = 2.15, r = 1.6, out = [];
    for (const [qx, qz, a0] of [[1, 1, 0], [-1, 1, 1], [-1, -1, 2], [1, -1, 3]]) for (let i = 0; i <= 10; i++) { const a = (a0 + i / 10) * Math.PI / 2, j = (R() - .5) * .03; out.push([cx + qx * (hx - r) + Math.cos(a) * (r + j), cz + qz * (hz - r) + Math.sin(a) * (r + j)]); }
    return out; })();
  return wide({
    SAND: blob(0, 0, 10.4, 8.5, 71, 80, .04), GRASS: blob(0, -.1, 9.5, 7.7, 72, 80, .04),
    SAND_S: blob(-1.2, 9.7, 6.3, 3.0, 73, 56, .05), GRASS_S: blob(-1.2, 9.6, 5.6, 2.5, 79, 56, .05),   // the south: the farm
    SAND_W: blob(-10.4, .3, 5.0, 4.0, 74, 56, .05), GRASS_W: blob(-10.3, .3, 4.3, 3.4, 75, 56, .05),   // the west: the duck pond
    HIGH,
    under: [[0, .1, 10.8, 8.8, 81], [-1.2, 9.8, 6.6, 3.3, 82], [-10.4, .4, 5.3, 4.3, 83]].map(([cx, cz, rx, rz, seed]) => blob(cx, cz, rx, rz, seed, 56, .04)),
  });
}
export function bosLand() {
  return wide({
    SAND: blob(0, 0, 15.2, 8.2, 201, 88, .04), GRASS: blob(0, -.1, 14.4, 7.5, 202, 88, .04),   // (bigger than the pixel game's forest: Oscar asked for more forest)
    SAND_E: blob(15.4, .3, 4.8, 5.4, 203, 56, .05), GRASS_E: blob(15.5, .3, 4.1, 4.7, 204, 56, .05),   // the east: the treehouse glade
    under: [[0, .1, 15.6, 8.5, 211], [15.4, .4, 5.1, 5.7, 212]].map(([cx, cz, rx, rz, seed]) => blob(cx, cz, rx, rz, seed, 56, .04)),
    bridge: [4.8, 6.9],   // where the bridge from the village lands, in the forest's own measure
  });
}

/** the meadow, in its own measure (made at its real size: not spread again) */
export function weiLand() {
  return {
    SAND: blob(0, 0, 15.6, 11.6, 401, 96, .04), GRASS: blob(0, -.1, 14.8, 10.8, 402, 96, .04),
    SAND_E: blob(21.5, -2, 10.3, 10, 403, 72, .05), GRASS_E: blob(21.6, -2, 9.5, 9.2, 404, 72, .05),   // the east: the waterfall
    HILL: blob(-5, -5.4, 5.2, 3.4, 405, 56, .05), TOP: blob(-6.4, -6.4, 2.6, 1.6, 406, 40, .05),       // the windy hill and its top
    bridge: [-14.3, 2.55],   // where the bridge from the village lands
  };
}

/** how far the beach's shore lies from the meadow's, over the south bridge */
export const SOUTH_GAP = 12;
ORIGIN.strand = [ORIGIN.wei[0] - .5, ORIGIN.wei[1] + 11.0 + SOUTH_GAP + 9.0];
/** the beach, in its own measure (made at its real size). `bridge`: the bridge from the meadow, this set's own, running north */
export function strandLand() {
  return {
    SAND: blob(0, 0, 15.5, 9.2, 501, 96, .04), DUNE: blob(-7.2, -3.6, 5.6, 3.2, 502, 56, .05),      // the beach; a green dune in the north-west
    ROCK: blob(11.4, -3.4, 2.5, 1.9, 503, 36, .06), SEALROCK: blob(5.4, 14.4, 1.05, .75, 504, 24, .07),   // the lighthouse's rock; the seal's rock, out by the pier's end
    bridge: { x0: -.6, x1: .6, z0: -9.0 - SOUTH_GAP - .6, z1: -8.3 },
  };
}

/** the rainbow island, far out at sea south-east of the beach (Oscar: "candy island shouldnt be so close. we need to travel
 *  further over sea and encounter things"; "candy island is also very small"). She gets there in the boat, steering it
 *  herself (boat.js), past the things of the voyage (voyage.js). Made at its real size, and bigger than it was.
 *  `bridge`: where its jetty runs out to the west (no bridge any more; the name is kept for the jetty and its shot) */
export const VOYAGE = 50;   // how far the island's shore lies from the beach's, over the water
ORIGIN.regenboog = [ORIGIN.strand[0] + 15.0 + VOYAGE + 21.0, ORIGIN.strand[1] + 20];
export function regenboogLand() {
  return {
    SAND: blob(0, 0, 21.6, 15.2, 601, 120, .04), GRASS: blob(0, -.1, 20.8, 14.4, 602, 120, .04), POND: blob(9.24, 3.64, 2.5, 1.7, 603, 32, .06),   // (bigger again, and everything on it further apart: Oscar, "candy island still feels cramped")
    bridge: { x0: -23.8, x1: -20.4, z0: -.6, z1: .6 },
  };
}

/** the castle's island, east of the meadow's waterfall over a long bridge (its own, running west). Made at its real size */
ORIGIN.kasteel = [ORIGIN.wei[0] + 30.7 + 12 + 10.9, ORIGIN.wei[1] - 2.1];
export function kasteelLand() {
  return {
    SAND: blob(0, 0, 15.2, 11.6, 701, 96, .04), GRASS: blob(0, -.1, 14.4, 10.8, 702, 96, .04),   // (bigger: Oscar found it cramped)
    bridge: { x0: -(10.9 + 12 + .2), x1: -10.3, z0: -.6, z1: .6 },
  };
}

/** the cave behind the waterfall: a room far beside the world, like her bedroom */
ORIGIN.grot = [-260, 70];

/** the egg's cave in the forest: a room far beside the world */
ORIGIN.hol = [-260, 140];

/** rooms far beside the world, each in through a door: the clothes shop in the village, the room up in the treehouse, the log cabin's workshop */
ORIGIN.winkel = [-260, 210]; ORIGIN.boomhut = [-260, 260]; ORIGIN.blokhut = [-260, 310]; ORIGIN.kasteelzaal = [-260, 370]; ORIGIN.kasteeltoren = [-260, 430];

/** the snow island: a bonus far out in the north, beyond the forest, over open sea (only the flying unicorn gets there, and
 *  Santa's sleigh brings her back). Made at its real size (set-sneeuw.js) */
ORIGIN.sneeuw = [ORIGIN.bos[0] + 6, ORIGIN.bos[1] - 62];
export function sneeuwLand() {
  return { SNOW: blob(0, 0, 17.5, 12.5, 901, 110, .04), ICE: blob(0, .2, 16.6, 11.6, 902, 110, .04) };
}
