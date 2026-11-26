// The beach's little islands (MAP.HOPS): a row of sandy patches in the sea west of the south beach, deep water in between.
// Each has a hook post (drawn and pulled by world-haak.js), so with the hookshot she hops from the beach to the first,
// from one to the next, and on the last one coins lie in the sand round a palm (back every day, like the castle hall's).
// A little starfish and a shell or two lie on the small ones, just to look at.
import * as MAP from './map.js';
import * as ART from './art.js';
import * as Q from './quest.js';
import { sfx } from './audio.js';

export function createHops(ctx) {
  const { THREE, scene, makeSprite, kid } = ctx;
  const H = MAP.HOPS, last = H.isles.find(h => h.coins), meshes = [];
  const add = (art, x, z, o = {}) => { const m = makeSprite(art, Object.assign({ lean: .3 }, o)); m.position.set(x, 0, z); scene.add(m); meshes.push(m); return m; };
  // a palm at the back of the coin island, a starfish on each small one
  add(ART.propArt('palm', 2), last.x0 + 2.5, last.z0 + .7); ctx.solid(last.x0 + 2, last.z0);   // (a palm stands: she walks round it)
  H.isles.filter(h => !h.coins).forEach((h, k) => add(ART.starfish(), h.x0 + .3 + k * 2, h.z1 + .5, { lean: 1.3, shadow: false, scale: .8 }));

  // the coins: a ring round the middle of the last island
  const cx = (last.x0 + last.x1 + 1) / 2 - .5, cz = (last.z0 + last.z1 + 1) / 2 + .2, SPOTS = [];
  for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; SPOTS.push([cx + Math.cos(a) * 1.9, cz + Math.sin(a) * 1.15]); }
  const coins = [], rising = [];
  function sync() {
    for (const c of coins) scene.remove(c.m); coins.length = 0;
    const got = Q.quest.picked.munt || [];
    SPOTS.forEach(([x, z], k) => { if (got.includes(3200 + k)) return; const m = makeSprite(ART.coin(), { lean: .3, shadow: false }); m.position.set(x, .25, z); scene.add(m); coins.push({ m, x, z, k, ph: k * .8 }); });
  }
  const off = Q.on(type => { if (type === 'day') sync(); });
  sync();

  return {
    info: () => ({ coins: coins.length, spots: SPOTS }),
    update(dt, time, act) {
      for (const c of coins) { const near = Math.abs(c.x - kid.pos.x) < 4 && Math.abs(c.z - kid.pos.z) < 4; c.m.scale.x = near ? Math.max(.15, Math.abs(Math.cos(time * 2 + c.ph))) : 1; }
      for (let i = rising.length - 1; i >= 0; i--) { const f = rising[i]; f.t += dt * 1.3; f.m.position.y = .25 + f.t * 1.6; f.m.scale.x = Math.cos(f.t * 10) * 1.2; if (f.t >= 1) { scene.remove(f.m); rising.splice(i, 1); } }
      if (!act) return;
      for (let i = coins.length - 1; i >= 0; i--) { const c = coins[i]; if (Math.abs(c.x - kid.pos.x) < .7 && Math.abs(c.z - kid.pos.z) < .7) { coins.splice(i, 1); rising.push({ m: c.m, t: 0 }); Q.collect('munt', 3200 + c.k); sfx.chime(5 + (i % 3)); } }
    },
    dispose() { off(); for (const m of meshes) scene.remove(m); for (const c of coins) scene.remove(c.m); },
  };
}
