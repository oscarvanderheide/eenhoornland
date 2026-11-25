// The rainbow island grew two new ends. North: giant bouncy mushrooms; jump on one and she keeps bouncing, higher and
// higher, each bounce a note, until she steps off. South: a lagoon where the flamingos stand (their way of saying hello
// is in world-ways.js: one leg, and with another tap they all dance). Nothing here is needed for the adventure.
import * as MAP from './map.js';
import * as WILD from './art-wild.js';
import { sfx } from './audio.js';

export function createEiland(ctx) {
  const { scene, M, makeSprite, pick, kid, tops, burst } = ctx;
  const I = M.I;
  const shrooms = MAP.MUSHROOMS.map(([x, z], k) => {
    const art = WILD.paddo(k), m = makeSprite(art, { lean: .3, scale: 1.15 }); m.position.set(x + .5, 0, z + .55); scene.add(m);
    tops.set(I(x, z), 1.1);                                                     // she can jump on top (the crate and the stumps work the same way)
    m.userData.alpha = art; m.userData.tap = () => { sfx.boing(); sq.set(k, 1); if (Math.hypot(x + .5 - kid.pos.x, z + .5 - kid.pos.z) > 2.2) ctx.walkToTile(x, z + 1); else { const dx = x + .5 - kid.pos.x, dz = z + .6 - kid.pos.z, l = Math.hypot(dx, dz) || 1; ctx.leap({ x: dx / l, z: dz / l }); } };
    pick.push(m); return { x, z, m, k };
  });
  const sq = new Map();
  let streak = 0, was = null;
  return {
    bouncing: () => streak,
    update(dt) {
      const p = ctx.perch(), on = p && shrooms.find(s => I(s.x, s.z) === p.i);
      if (on && kid.hop <= 0) {                                                  // up again, a little higher every time
        streak = Math.min(5, streak + 1); kid.hop = 1; kid.hopH = .7 + streak * .22; sq.set(on.k, 1); sfx.boing(); sfx.chime(streak + 1); if (streak === 5) burst(kid.pos, 5, true);
      }
      if (!on) streak = 0; was = on;
      for (const s of shrooms) { const v = sq.get(s.k) || 0; if (v > 0) { const n = Math.max(0, v - dt * 3.5); sq.set(s.k, n); const w = Math.sin((1 - n) * Math.PI * 2) * n; s.m.scale.set(1.15 * (1 + w * .14), 1.15 * (1 - w * .16), 1); } }
    },
    dispose() { },
  };
}
