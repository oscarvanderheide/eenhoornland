// The south beach (strand): the sea turtle's nest in the dunes. A tap on the nest and the eggs crack: the little
// turtles scramble out and waddle down to the sea, each one with a splash. The mother turtle (world-ways.js) lays new
// eggs when she is tapped and the nest is empty. A real little loop, and it can go round as often as they like.
import * as MAP from './map.js';
import * as WILD from './art-wild.js';
import * as ART from './art.js';
import { sfx } from './audio.js';

export function createStrand(ctx) {
  const { THREE, scene, M, makeSprite, pick, kid, burst, tex } = ctx;
  const [NX, NZ] = MAP.NEST, I = M.I, v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  let eggs = true;
  const nest = makeSprite(WILD.nest(true), { lean: .5, shadow: false, scale: 1.2 }); nest.position.set(NX + .5, 0, NZ + .5); scene.add(nest);
  const tNest = [tex(WILD.nest(false)), tex(WILD.nest(true))];
  const setNest = on => { eggs = on; nest.material.map = tNest[on ? 1 : 0]; nest.material.emissiveMap = nest.material.map; };
  const babies = [];
  /** where the sea is, straight down the beach from x */
  function seaBelow(x) { for (let z = NZ; z < MAP.OUT_H; z++) { const g = M.ground[I(Math.floor(x), z)]; if (g === MAP.SE && !M.inland[I(Math.floor(x), z)]) return z + .3; } return NZ + 3; }
  function hatch() {
    if (!eggs) { nest.userData.wob = .4; sfx.pop(); return false; }
    setNest(false); sfx.pop(); setTimeout(sfx.sparkle, 200); burst(v3(NX + .5, .2, NZ + .5), 6, true);
    for (let k = 0; k < 4; k++) {
      const m = makeSprite(WILD.babySchildpad(0), { lean: .3, shadow: false, scale: .9 }); m.material = m.material.clone(); const x = NX + .5 + (k - 1.5) * .45; m.position.set(x, 0, NZ + .55); scene.add(m);
      babies.push({ m, x, z: NZ + .55, to: seaBelow(x + (k - 1.5) * .3), wait: .3 + k * .35, t: 0, dx: (k - 1.5) * .12 });
    }
    return true;
  }
  nest.userData.tap = () => { if (Math.hypot(NX + .5 - kid.pos.x, NZ + .5 - kid.pos.z) < 1.8) hatch(); else ctx.approach(NX, NZ - 1, hatch); }; pick.push(nest);
  nest.userData.alpha = WILD.nest(true);
  ctx.addUse(() => !ctx.toys.carrying() && Math.hypot(NX + .5 - kid.pos.x, NZ + .5 - kid.pos.z) < 1.4 && eggs ? { key: 'nest', art: WILD.nest(true), run: hatch } : null);
  const ft = [tex(WILD.babySchildpad(0)), tex(WILD.babySchildpad(1))];
  return {
    eggs: () => eggs, hatch, lay() { if (eggs) return false; setNest(true); sfx.pop(); burst(v3(NX + .5, .2, NZ + .5), 5); return true; },
    nest: [NX + .5, NZ + .5], babies: () => babies.length,
    update(dt, time) {
      if (nest.userData.wob > 0) { nest.userData.wob -= dt; nest.rotation.z = Math.sin(nest.userData.wob * 40) * .05; } else nest.rotation.z = 0;
      for (let i = babies.length - 1; i >= 0; i--) {
        const b = babies[i]; if ((b.wait -= dt) > 0) { b.m.position.y = .05 * Math.abs(Math.sin(time * 20)); continue; }
        b.t += dt; b.z += dt * .9; b.x += b.dx * dt; b.m.position.set(b.x, 0, b.z);
        const f = Math.floor(time * 8 + i) % 2; if (b.m.material.map !== ft[f]) { b.m.material.map = ft[f]; b.m.material.emissiveMap = ft[f]; }
        if (b.z >= b.to) { sfx.splash(); ctx.life.bit(ART.drop(), b.x, .1, b.z, { vy: 2, g: 9, life: .5 }); scene.remove(b.m); babies.splice(i, 1); }
      }
    },
    dispose() { for (const b of babies) scene.remove(b.m); },
  };
}
