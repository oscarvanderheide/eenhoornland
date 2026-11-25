// Benches in the village (MAP.BENCHES): two on the north shore of the duck pond, one by the fountain. A tap on a bench,
// the action button next to it, or walking into it from the front and up she hops and sits down (the seat is a "top" in
// world.js, so every step, tap or button press gets her off again, nothing can keep her there). After a moment she swings
// her legs. On a pond bench the ducks paddle over to see her.
import * as MAP from './map.js';
import * as PX from './pixel.js';
import { sfx } from './audio.js';

/** the bench as a small picture for the action button */
export const benchIcon = () => PX.sprite([
  '.kkkkkkkkkkkk.', '.kwwwwwwwwwwk.', '.kkkkkkkkkkkk.', '.kwwwwwwwwwwk.', '.kkkkkkkkkkkk.',
  'kkkkkkkkkkkkkk', 'kWWWWWWWWWWWWk', 'kkkkkkkkkkkkkk', '.ii........ii.', '.ii........ii.',
], { k: '#8A5A3B', w: '#D9A066', W: '#E8B878', i: '#5E4A6A' }, { key: 'bankicoon' });

export function createBank(ctx) {
  const { THREE, scene, pick, kid, canvas, tex, animals, M } = ctx;
  const W = MAP.W, P = MAP.POND;
  // planks: honey wood with a darker grain, drawn as pixels like everything else
  const [pc, px] = canvas(32, 4); for (let y = 0; y < 4; y++) for (let x = 0; x < 32; x++) { px.fillStyle = y === 3 ? '#9C6A3E' : y === 0 ? '#EBC08A' : (x * 7 + y * 3) % 11 === 0 ? '#B98250' : '#D9A066'; px.fillRect(x, y, 1, 1); }
  const wood = new THREE.MeshLambertMaterial({ map: tex(pc) }), iron = new THREE.MeshLambertMaterial({ color: '#5E4A6A' });
  const icon = benchIcon(), benches = [];
  for (const b of MAP.BENCHES) {
    const g = new THREE.Group(); g.position.set(b.cx, 0, b.z); scene.add(g);
    const box = (w, h, d, x, y, z, mat, rx = 0) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.x = rx; m.castShadow = m.receiveShadow = true;
      m.userData.tap = () => sitOn(b); m.userData.icon = icon; m.userData.bench = true; g.add(m); pick.push(m); return m;
    };
    for (const z of [.3, .44, .58]) box(1.7, .05, .12, 0, .27, z, wood);                       // the seat
    for (const y of [.44, .6]) box(1.7, .1, .045, 0, y, .21 - (y - .44) * .2, wood, -.18);     // the back, leaning a little
    for (const x of [-.8, .8]) {
      box(.06, .26, .06, x, .13, .62, iron); box(.06, .26, .06, x, .13, .28, iron);              // legs
      box(.06, .5, .06, x, .44, .2, iron, -.18); box(.07, .045, .46, x, .43, .44, iron);       // the back post and an armrest
    }
    benches.push(b);
  }
  const benchOf = i => benches.find(b => Math.floor(i / W) === b.z && (i % W === b.x || i % W === b.x + 1));
  const nearPond = b => Math.hypot(b.cx - P.cx, b.cz - P.cz) < 5;
  /** up onto the half of the bench nearest to her; from further away she walks to the front of it first */
  function sitOn(b) {
    const here = ctx.seated(), x = Math.abs(kid.pos.x - (b.x + .5)) <= Math.abs(kid.pos.x - (b.x + 1.5)) ? b.x : b.x + 1;
    if (here >= 0) { const on = benchOf(here); if (on === b) { const other = here % W === b.x ? b.x + 1 : b.x; sfx.pop(); ctx.hopOnto(other, b.z); return; } }   // already sitting here: shuffle over to the other end
    const fx = x + .5, fz = b.z + 1.5;
    if (Math.hypot(kid.pos.x - fx, kid.pos.z - fz) < 1.3 && kid.pos.z > b.z + 1) { ctx.hopOnto(x, b.z); return; }
    ctx.walkThen(x, b.z + 1, () => ctx.hopOnto(x, b.z));
  }
  // one rule for every input: next to a bench (in front of it) the action button sits her down
  ctx.addUse(() => {
    if (ctx.seated() >= 0 || ctx.toys.carrying()) return null;
    for (const b of benches) if (kid.pos.z > b.z + .9 && kid.pos.z < b.z + 2.1 && kid.pos.x > b.x - .2 && kid.pos.x < b.x + 2.2) return { key: 'bank', art: icon, run: () => sitOn(b) };
    return null;
  });
  return {
    benches, sitOn, icon,
    /** walking into a bench from the front sits her down (world.js bump) */
    bumpAt(x, z, iz) { const b = benches.find(b => b.z === z && (x === b.x || x === b.x + 1)); if (!b || iz >= 0) return false; ctx.hopOnto(x, z); return true; },
    /** she just sat down on tile i */
    sat(i) {
      const b = benchOf(i); if (!b || !nearPond(b)) return;
      for (const a of animals) if (a.water && !a.fly && !a.held && a.g.visible) {   // the ducks come to see who is there
        const tx = Math.max(P.cx - P.rx + .7, Math.min(P.cx + P.rx - .7, (i % W) + .5 + (Math.random() - .5))), tz = P.cz - P.rz * .45 + Math.random() * .3;
        if (M.ground[Math.floor(tz) * W + Math.floor(tx)] === MAP.WA) { a.path = [new THREE.Vector3(tx, 0, tz)]; a.wait = 5; }
      }
      setTimeout(() => sfx.pop(), 700);
    },
    update() { },
  };
}
