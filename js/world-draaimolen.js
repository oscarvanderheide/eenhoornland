// The castle island's east end: a carousel of little unicorns under a striped roof. It stands still until she comes:
// a tap (or the action button in front of it) and she climbs on, the music plays and round it goes, the unicorns going
// up and down; then it slows down and she hops off. Only reachable once she can ride (the castle island), so it is a
// treat at the end of the adventure. Nothing here is needed for anything.
import * as MAP from './map.js';
import * as ART from './art.js';
import * as PX from './pixel.js';
import { sfx } from './audio.js';

export function createDraaimolen(ctx) {
  const { THREE, scene, makeSprite, pick, kid, tex, canvas, burst } = ctx;
  const C = MAP.CAROUSEL, cx = C.cx + .5, cz = C.cz + .5, v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const shadowed = m => { m.castShadow = true; m.receiveShadow = true; return m; };
  const stripes = (w, h, a, b, n) => { const [c, x] = canvas(w, h); for (let i = 0; i < w; i++) { x.fillStyle = Math.floor(i / (w / n)) % 2 ? a : b; x.fillRect(i, 0, 1, h); } return tex(c); };
  const group = new THREE.Group(); group.position.set(cx, 0, cz); scene.add(group);
  const floor = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.6, .16, 24), new THREE.MeshLambertMaterial({ color: '#FFE3F1' }))); floor.position.y = .08; group.add(floor);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.62, .1, 24, 1, true), new THREE.MeshLambertMaterial({ map: stripes(64, 4, '#FFD43B', '#FF7EB6', 16), side: THREE.DoubleSide })); rim.position.y = .1; group.add(rim);
  const pole = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, 3.6, 10), new THREE.MeshLambertMaterial({ map: stripes(16, 16, '#FFFFFF', '#FF5E9C', 4) }))); pole.position.y = 1.85; group.add(pole);
  const roof = shadowed(new THREE.Mesh(new THREE.ConeGeometry(1.75, .9, 16), new THREE.MeshLambertMaterial({ map: stripes(64, 8, '#FFF1DC', '#E85D75', 16) }))); roof.position.y = 3.95; group.add(roof);
  const edge = new THREE.Mesh(new THREE.CylinderGeometry(1.77, 1.77, .18, 16, 1, true), new THREE.MeshLambertMaterial({ map: stripes(64, 4, '#FFD43B', '#FFFFFF', 32), side: THREE.DoubleSide })); edge.position.y = 3.45; group.add(edge);
  const flag = makeSprite(PX.heart(), { lean: 0, shadow: false, scale: 1.2 }); flag.position.y = 4.4; group.add(flag);
  // the unicorns
  const LOOKS = [{ body: '#FFFFFF', mane: '#FF7EB6', horn: '#F7C548' }, { body: '#DCCBFA', mane: '#4FA3F7', horn: '#F7C548' }, { body: '#FFF0A6', mane: 'rainbow', horn: '#D3DAE6' }, { body: '#C6F1DB', mane: '#9B72E8', horn: '#FF9EC7' }];
  const rods = new THREE.MeshLambertMaterial({ color: '#F7C548' });
  const horses = LOOKS.map((look, k) => {
    const art = ART.hd(ART.uniSprite(look, 'idle', false, { baby: true })), m = makeSprite(art, { lean: .3, scale: .55 }); scene.add(m);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 3.4, 6), rods); scene.add(rod);
    m.userData.alpha = art; return { m, rod, a: k / LOOKS.length * Math.PI * 2 + .4, k };
  });
  let spin = 0, speed = 0, ride = null;
  function place(time) {
    for (const h of horses) {
      const a = h.a + spin, x = cx + Math.cos(a) * 1.1, z = cz + Math.sin(a) * .9, bob = speed > .05 ? Math.sin(time * 4 + h.k * 1.6) * .18 * Math.min(1, speed) : 0;
      h.m.position.set(x, .22 + .25 + bob, z + .05); h.m.scale.x = (-Math.sin(a) > 0 ? 1 : -1) * .55; h.rod.position.set(x, 1.75, z); h.y = .47 + bob; h.x = x; h.z = z;
    }
  }
  function go() {
    if (ride) return; ride = { t: 0, n: 0, T: 9, boost: 0, ang: null }; ctx.setBusy(true); if (ctx.mount()) ctx.setMount(null, true);
    const h = horses[0]; kid.face = 1; burst(kid.pos, 6, true); sfx.sparkle(); ride.h = h;
  }
  const near = () => Math.hypot(C.on[0] + .5 - kid.pos.x, C.on[1] + .5 - kid.pos.z) < 1.2;
  const tap = () => { sfx.pop(); if (near()) go(); else ctx.walkThen(C.on[0], C.on[1], go); };
  for (const m of [floor, roof, pole, ...horses.map(h => h.m)]) { m.userData.tap = tap; pick.push(m); }
  ctx.addUse(() => !ride && !ctx.toys.carrying() && near() ? { key: 'draaimolen', art: ART.uniSprite(LOOKS[2], 'idle', false, { baby: true }), run: go } : null);
  const TUNE = [4, 2, 0, 2, 4, 4, 4, 2, 2, 2, 4, 7, 7];
  const WATCH = (() => { const t = ctx.nearestWalkable(C.on[0] + 2, C.on[1] + 1.5); return t ? [t[0] + .5, t[1] + .5] : [C.on[0] + 2, C.on[1] + 1.5]; })();
  place(0);
  return {
    riding: () => !!ride, spin: () => spin, go, boost: () => ride ? ride.boost : 0,
    /** where her egg or unicorn waits while she rides: in front, looking on */
    watch: () => ride ? WATCH : null,
    update(dt, time) {
      if (ride) {
        const r = ride; r.t += dt;
        // stirring the stick (or the arrows) round and round winds it up: faster and faster, and it keeps going while she stirs
        const v = ctx.input ? ctx.input() : { x: 0, z: 0 };
        if (Math.hypot(v.x, v.z) > .5) { const a = Math.atan2(v.z, v.x); if (r.ang !== null) { let d = a - r.ang; d = Math.atan2(Math.sin(d), Math.cos(d)); if (Math.abs(d) < 1.6) { r.boost = Math.min(3, r.boost + Math.abs(d) * .3); if (r.boost > .3) r.T = Math.min(r.t + 3, 60, Math.max(r.T, r.t + 3)); } } r.ang = a; } else r.ang = null;
        r.boost = Math.max(0, r.boost - dt * .35); if (r.boost > 2.2 && Math.random() < dt * 6) burst(kid.pos, 1, true);
        const T = r.T; speed = (r.t < 1.2 ? r.t / 1.2 : r.t > T - 1.6 ? Math.max(0, (T - r.t) / 1.6) : 1) * (1 + r.boost);
        if (r.t > r.n * .42 / (1 + r.boost * .5) + .3 && r.t < T - 1.2) { sfx.chime(TUNE[r.n % TUNE.length]); r.n++; }   // the tune speeds up too
        kid.pos.set(r.h.x, 0, r.h.z + .02); kid.lift = r.h.y + .32; kid.zBias = .02; kid.face = r.h.m.scale.x > 0 ? 1 : -1;
        if (r.t >= T) { ride = null; speed = 0; kid.lift = 0; kid.zBias = .06; ctx.placeAt(C.on[0] + .5, C.on[1] + .6, 0, 1); kid.hop = 1; sfx.boing(); burst(kid.pos, 8, true); ctx.setBusy(false); }
      } else if (speed > 0) speed = Math.max(0, speed - dt);
      spin += dt * speed * 1.4; if (speed > 0 || ride) place(time);
    },
    dispose() { for (const h of horses) { scene.remove(h.m); scene.remove(h.rod); } },
  };
}
