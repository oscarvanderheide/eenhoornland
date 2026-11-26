// The outline of each island, in its own set's measure. A set builds its own land from these; a neighbour builds the same
// outlines, moved, as the far shore across a bridge. So the shore she walks away from is the shore she sees behind her.
import { blob, rng } from './kit.js';

/** an outline moved to where it lies seen from another set */
export const move = (poly, dx, dz) => poly.map(([x, z]) => [x + dx, z + dz]);

/** where a place on one set lies on its neighbour: add this to it. The bridge between two sets is the same planks on both */
export const SHIFT = { 'dorp>bos': [-1.2, 17], 'bos>dorp': [1.2, -17] };

export function dorpLand() {
  // the terrace: a card with round corners (a blob would leave the street no room along its front)
  const HIGH = (() => { const R = rng(76), cx = -.1, cz = -5.05, hx = 4.5, hz = 2.15, r = 1.6, out = [];
    for (const [qx, qz, a0] of [[1, 1, 0], [-1, 1, 1], [-1, -1, 2], [1, -1, 3]]) for (let i = 0; i <= 10; i++) { const a = (a0 + i / 10) * Math.PI / 2, j = (R() - .5) * .03; out.push([cx + qx * (hx - r) + Math.cos(a) * (r + j), cz + qz * (hz - r) + Math.sin(a) * (r + j)]); }
    return out; })();
  return {
    SAND: blob(0, 0, 10.4, 8.5, 71, 80, .04), GRASS: blob(0, -.1, 9.5, 7.7, 72, 80, .04),
    SAND_S: blob(-1.2, 9.7, 6.3, 3.0, 73, 56, .05),                                              // the south: the pig's mud
    SAND_W: blob(-10.4, .3, 5.0, 4.0, 74, 56, .05), GRASS_W: blob(-10.3, .3, 4.3, 3.4, 75, 56, .05),   // the west: the duck pond
    HIGH,
    under: [[0, .1, 10.8, 8.8, 81], [-1.2, 9.8, 6.6, 3.3, 82], [-10.4, .4, 5.3, 4.3, 83]].map(([cx, cz, rx, rz, seed]) => blob(cx, cz, rx, rz, seed, 56, .04)),
    house: [.3, -5.5],
  };
}
export function bosLand() {
  return {
    SAND: blob(0, 0, 13.2, 6.6, 201, 88, .04), GRASS: blob(0, -.1, 12.4, 5.9, 202, 88, .04),
    SAND_E: blob(13.6, .3, 4.6, 5.0, 203, 56, .05), GRASS_E: blob(13.7, .3, 3.9, 4.3, 204, 56, .05),   // the east: the treehouse glade
    under: [[0, .1, 13.6, 6.9, 211], [13.6, .4, 4.9, 5.3, 212]].map(([cx, cz, rx, rz, seed]) => blob(cx, cz, rx, rz, seed, 56, .04)),
  };
}
