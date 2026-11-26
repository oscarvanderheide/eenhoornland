// Big stones: each island has a few of its own rocks lying loose (the same rocks that grow along its shores, ART.ISLE.rots).
// ✕ or R1 next to one: she lifts it over her head (it is heavy: she walks slower and cannot jump with it); ✕ again puts it
// down in front of her. A stone that lies somewhere is a thing to jump on (a `top`), so the girls can build their own
// little parkour, also with an animal in their arms. Where each stone lies is kept (per world, state.extra.keien).
// The hookshot (world-haak.js) pulls a stone to her. A stone is solid at runtime (ctx.solid), so it can never be put
// where it would cut a way in two.
import * as ART from './art.js';
import * as Q from './quest.js';
import { state, save } from './state.js';
import { sfx } from './audio.js';

const H = .34;   // how high the top of a stone is

export function createKeien(ctx) {
  const { THREE, scene, M, kid, makeSprite } = ctx;
  const I = M.I;
  const key = 'w' + Q.mapSeed();
  const kept = ((state.extra.keien = state.extra.keien || {})[key] = (state.extra.keien[key] || {}));
  for (const k of Object.keys(state.extra.keien)) if (k !== key) delete state.extra.keien[k];   // an old world's stones are gone with it
  const stones = [];
  let held = null;

  const freeTile = (x, z) => M.inb(x, z) && ctx.walkable(x, z) && !ctx.tops.has(I(x, z)) && !stones.some(s => s !== held && s.x === x && s.z === z);
  /** lay stone s on tile (x, z): solid, a top; false when it would cut a way in two */
  function lay(s, x, z) {
    if (!freeTile(x, z) || !ctx.solid(x, z)) return false;
    s.x = x; s.z = z; ctx.tops.set(I(x, z), H); s.mesh.position.set(x + .5, 0, z + .55); s.mesh.rotation.z = 0;
    return true;
  }
  function lift(s) {
    ctx.solid(s.x, s.z, false); ctx.tops.delete(I(s.x, s.z));
    if (ctx.life.carrying()) ctx.life.setDown(); if (ctx.toys && ctx.toys.carrying()) ctx.toys.putDown(true);
    held = s; s.up = 0; kid.hop = .3; sfx.tug(); ctx.burst(new THREE.Vector3(s.x + .5, .1, s.z + .5), 4);
  }
  /** put it down in front of her (or beside her, wherever there is room) */
  function putDown() {
    const s = held; if (!s) return false;
    const fx = Math.abs(kid.face) ? kid.face : 1, kx = Math.floor(kid.pos.x), kz = Math.floor(kid.pos.z);
    const d = ctx.lastDir && ctx.lastDir(); const dx = d && Math.abs(d.z) > Math.abs(d.x) ? 0 : Math.sign(d && Math.abs(d.x) > .3 ? d.x : fx), dz = d && Math.abs(d.z) > Math.abs(d.x) ? Math.sign(d.z) : 0;
    for (const [ox, oz] of [[dx, dz], [0, 1], [0, -1], [fx, 0], [-fx, 0], [fx, 1], [-fx, 1], [fx, -1], [-fx, -1]]) {
      if (!ox && !oz) continue; const x = kx + ox, z = kz + oz;
      if (lay(s, x, z)) { held = null; kept[s.id] = [x, z]; save(); sfx.bonk(); kid.hop = .3; ctx.burst(new THREE.Vector3(x + .5, .05, z + .5), 6); return true; }
    }
    s.wob = .5; sfx.wrong && sfx.wrong(); return false;                              // no room anywhere: it wiggles, she keeps it
  }
  /** a stone the hookshot pulled: it slides to the tile next to her */
  function slideTo(s, x, z, dur = .25) {
    if (s === held) return false;
    ctx.solid(s.x, s.z, false); ctx.tops.delete(I(s.x, s.z)); const ox = s.x, oz = s.z;
    if (!lay(s, x, z)) { lay(s, ox, oz); return false; }
    kept[s.id] = [x, z]; save(); s.slide = { from: new THREE.Vector3(ox + .5, 0, oz + .55), t: 0, sp: 1 / Math.max(.1, dur) }; return true;
  }

  // the stones of this world: from map.js, or where the girls left them
  (M.bigStones || []).forEach(([x, z, zone, tag], k) => {
    const art = ART.propArt('rots-' + zone, 1 + (k % 3)), mesh = makeSprite(art, { lean: .3, scale: ART.propScale('rots-' + zone) * 1.05 });
    mesh.userData.alpha = art; scene.add(mesh);
    const s = { id: k, x, z, zone, tag, mesh, art, wob: 0, up: 0 };
    const at = kept[k]; if (!(at && lay(s, at[0], at[1])) && !lay(s, x, z)) {
      const t = ctx.nearestWalkable(x + .5, z + .5); if (!(t && lay(s, t[0], t[1]))) { mesh.visible = false; return; }
    }
    mesh.userData.tap = () => ctx.approach(s.x, s.z, () => { if (held !== s && Math.hypot(s.x + .5 - kid.pos.x, s.z + .5 - kid.pos.z) < 1.6 && !kid.lift) lift(s); });
    ctx.pick.push(mesh); stones.push(s);
  });

  /** the stone she would lift right here: next to her, not the one she stands on */
  function nearStone() {
    if (held || ctx.mount() || kid.lift) return null; let best = null, bd = 1.25;
    for (const s of stones) { const d = Math.hypot(s.x + .5 - kid.pos.x, s.z + .5 - kid.pos.z); if (d < bd) { bd = d; best = s; } }
    return best;
  }

  return {
    holding: () => held,
    nearStone,
    lift, putDown, slideTo,
    stones: () => stones,
    at: (x, z) => stones.find(s => s !== held && s.x === x && s.z === z) || null,
    /** for the action button: put down the one she holds, or lift the one next to her */
    use() {
      if (held) return { key: 'putkei', art: held.art, run: putDown };
      const s = nearStone(); return s ? { key: 'kei', art: s.art, run: () => lift(s) } : null;
    },
    info: () => ({ held: held ? held.id : null, stones: stones.map(s => [s.x, s.z]) }),
    update(dt, time) {
      for (const s of stones) {
        if (s === held) {
          s.up = Math.min(1, s.up + dt * 4);
          s.mesh.position.set(kid.pos.x, (1.0 + (kid.lift || 0)) * s.up + Math.abs(Math.sin(time * 6)) * .03 * s.up, kid.pos.z + .1);   // over her head, a little in front so it is drawn over her
          s.mesh.rotation.z = Math.sin(time * 6) * .03;
          continue;
        }
        if (s.slide) { s.slide.t = Math.min(1, s.slide.t + dt * s.slide.sp); if (s.slide.t >= 1) sfx.bonk(); const k = s.slide.t; s.mesh.position.lerpVectors(s.slide.from, new THREE.Vector3(s.x + .5, 0, s.z + .55), k); s.mesh.rotation.z = Math.sin(k * Math.PI) * .2; if (k >= 1) s.slide = null; }
        if (s.wob > 0) { s.wob -= dt; s.mesh.rotation.z = Math.sin(s.wob * 40) * .08; if (s.wob <= 0) s.mesh.rotation.z = 0; }
      }
    },
    dispose() { for (const s of stones) { scene.remove(s.mesh); ctx.solid(s.x, s.z, false); } },
  };
}
