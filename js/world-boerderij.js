// The village's new south corner: a pool of mud and a pig. A tap on the pig and off it trots to roll in the mud
// (its way is in world-ways.js); a muddy pig gets a wash with the watering can (the village's own toy): pour the water
// over it and it is pink again, with a happy little hop (and once a day a coin). Walking through the mud squelches.
import * as MAP from './map.js';
import * as Q from './quest.js';
import * as ART from './art.js';
import * as WILD from './art-wild.js';
import { sfx } from './audio.js';

export function createBoerderij(ctx) {
  const { THREE, scene, makeSprite, kid, burst, animals } = ctx;
  const MUD = MAP.MUD, v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const mud = makeSprite(WILD.modder(), { lean: Math.PI / 2, shadow: false, scale: 1.4 }); mud.position.set(MUD.cx, .02, MUD.cz + .2); scene.add(mud);
  const pig = () => animals.find(a => a.name === 'Varken');
  /** the can's water landed on the pig: if it was muddy it is clean now */
  function wash(c) {
    if (!c.dirty) return false; c.dirty = false; ctx.ways.look(c); sfx.sparkle(); burst(c.pos, 10, true); c.hop = 1; c.hopH = .8;
    setTimeout(() => { sfx.squeak(); if (Q.giftOnce('varken', 'munt')) { sfx.chime(5); ctx.life.bit(ART.coin(), c.pos.x, .5, c.pos.z + .1, { vy: 2.6, g: 1.5, life: 1, spin: 9 }); } }, 300);
    return true;
  }
  // with the can in her hands, next to a muddy pig, the action button pours (one rule for every input)
  ctx.addUse(() => { const c = pig(); if (!c || !c.dirty || ctx.toys.carrying() !== 'gieter' || Math.hypot(c.pos.x - kid.pos.x, c.pos.z - kid.pos.z) > 1.8) return null; return { key: 'was', art: ART.gieter(!!ctx.toys.info().water), run: () => ctx.toys.tapAnimal(c) }; });
  let squelch = 0;
  return {
    wash, mud: [MUD.cx, MUD.cz],
    update(dt) {
      if ((squelch -= dt) < 0 && kid.moving && Math.hypot(kid.pos.x - MUD.cx, (kid.pos.z - MUD.cz) * 1.6) < 1.6) { squelch = .35; sfx.pop(); ctx.life.bit(WILD.modderSpat(), kid.pos.x, .1, kid.pos.z + .1, { vx: (Math.random() - .5) * 1.5, vy: 1.6, g: 8, life: .5 }); }
    },
  };
}
