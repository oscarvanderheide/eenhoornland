// The treehouse in the forest (bos): a giant oak in its own glade with a little red-roofed house in the crown. The ladder
// is a door (MAP.ROOMS.hut, a room like the cave); inside are a telescope that looks out over the islands, the
// squirrel's pile of acorns, and at the back the platform of the zipline: she grabs the handle and whooshes all the way
// down over the water to a pole in the village (MAP.ZIP). Nothing here is needed for the adventure.
// world.js hands over the same toolbox (ctx) as for the other world-*.js files, plus ctx.peek (the camera looks
// somewhere else for a moment) and ctx.setBusy.
import * as MAP from './map.js';
import * as PX from './pixel.js';
import * as Q from './quest.js';
import * as WILD from './art-wild.js';
import * as ART from './art.js';
import { sfx } from './audio.js';

export function createBoomhut(ctx) {
  const { THREE, scene, makeSprite, pick, burst, bubble, kid, tex } = ctx;
  const R = MAP.ROOMS.hut, Z = MAP.ZIP, T = MAP.TREEHOUSE, v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const near = (x, z, r) => Math.hypot(x - kid.pos.x, z - kid.pos.z) < r;

  /* ---------------- outside: the oak, the rope, the pole ---------------- */
  const LEAN = .3, SC = 1.15, art = WILD.boomhut();
  const oak = makeSprite(art, { lean: LEAN, scale: SC }); oak.position.set(Z.from[0], 0, Z.from[1]); scene.add(oak);
  oak.userData.alpha = art; oak.userData.tap = () => { sfx.pop(); ctx.walkToTile(R.door[0], R.door[1]); }; pick.push(oak);
  // where on the sprite the platform is: 41 px up from the bottom, a little left of the trunk
  const up = h => [h * Math.cos(LEAN), -h * Math.sin(LEAN)];
  const [ay, az] = up(43 / 16 * SC), A = v3(Z.from[0] - 1.0, ay, Z.from[1] + az);
  const pole = makeSprite(WILD.ziplinePaal(), { lean: .25, scale: 1.5 }); pole.position.set(Z.pole[0] + .5, 0, Z.pole[1] + .9); scene.add(pole);
  const [by, bz] = [21 / 16 * 1.5 * Math.cos(.25), -21 / 16 * 1.5 * Math.sin(.25)], B = v3(Z.pole[0] + .5, by, Z.pole[1] + .9 + bz);
  const sag = t => Math.sin(t * Math.PI) * .55;
  const ropeAt = t => v3(A.x + (B.x - A.x) * t, A.y + (B.y - A.y) * t - sag(t), A.z + (B.z - A.z) * t);
  const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 13 }, (_, k) => ropeAt(k / 12))), 48, .028, 5, false), new THREE.MeshLambertMaterial({ color: '#5A3A22' }));
  rope.castShadow = true; scene.add(rope);
  const handle = makeSprite(WILD.katrol(), { lean: 0, shadow: false, scale: 1.1 }); scene.add(handle); handle.visible = false;

  /* ---------------- the ride ---------------- */
  let ride = null;
  function zip() {
    if (ride) return; ride = { t: 0, wait: .35 }; ctx.setBusy(true); if (ctx.mount()) ctx.setMount(null, true);
    ctx.fade(() => { ctx.placeAt(A.x, A.z + .05, 1, 0); kid.face = B.x > A.x ? 1 : -1; handle.visible = true; sfx.whoosh(); });
  }
  function stepRide(dt) {
    const r = ride; if (r.wait > 0) { r.wait -= dt; return; }
    const T0 = 3.4; r.t = Math.min(1, r.t + dt / T0); const e = r.t < .15 ? r.t * r.t / .3 : .075 + (r.t - .15) / .85 * .925;   // a slow start, then whoosh
    const p = ropeAt(e), swing = Math.sin(r.t * 18) * .05 * (1 - r.t);
    kid.pos.set(p.x, 0, p.z + .02); kid.lift = Math.max(0, p.y - 1.02); kid.setFrame('jump'); kid.mesh.rotation.z = swing;
    handle.position.set(p.x, p.y - .3, p.z + .03);
    if (Math.floor(r.t * 10) !== r.n) { r.n = Math.floor(r.t * 10); if (r.n === 2) bubble(kid, 'Wiii!', PX.heart()); }
    if (r.t >= 1) {                                                              // let go, a little hop down onto the grass
      handle.visible = false; kid.mesh.rotation.z = 0; kid.lift = 0; ride = null;
      ctx.placeAt(Z.to[0], Z.to[1], -1, 0); kid.hop = 1; kid.squash = .6; sfx.boing(); burst(kid.pos, 10, true); ctx.setBusy(false);
    }
  }

  /* ---------------- inside: the platform at the back, the telescope, the acorns ---------------- */
  // the zipline door is in the left wall at the front, the way the rope runs off outside (to the south-west)
  const out = makeSprite(WILD.zipDeur(), { lean: Math.PI / 2, shadow: false, scale: 1.1 }); out.rotation.set(0, Math.PI / 2, 0); out.position.set(R.x0 + .03, 0, R.zip[1] + .5); scene.add(out);
  out.userData.alpha = WILD.zipDeur(); out.userData.tap = () => { sfx.pop(); ctx.walkToTile(R.zip[0], R.zip[1]); }; pick.push(out);
  // the telescope stands at the big window in the back wall: each look shows another island, the way a bird would see it
  const SX = R.x1 - .5, SZ = R.z0 + .75;
  const win = makeSprite(WILD.raamGroot(), { lean: 0, shadow: false, scale: 1.15 }); win.position.set(SX - .1, .55, R.z0 + .02); scene.add(win);
  const scope = makeSprite(WILD.telescoop(), { lean: .3, scale: 1.05 }); scope.position.set(SX, 0, SZ); scene.add(scope); ctx.solid(Math.floor(SX), Math.floor(SZ));
  const VIEWS = ['kasteel', 'eiland', 'strand', 'wei', 'dorp'].map(k => [MAP.PLACES[k].tile[0] + .5, MAP.PLACES[k].tile[1] + .5]); let view = 0;
  const look = () => { kid.face = -1; sfx.click(); const [x, z] = VIEWS[view++ % VIEWS.length]; ctx.peek(x, z, 3.2); };
  scope.userData.alpha = WILD.telescoop(); scope.userData.tap = () => { sfx.pop(); if (near(SX, SZ + 1, 1.3)) look(); else ctx.approach(Math.floor(SX), Math.floor(SZ) + 1, look); }; pick.push(scope);
  // the squirrel's store: a tap and the acorns tumble out; once a day there is a coin among them
  const pile = makeSprite(WILD.eikels(), { lean: .3, scale: 1 }); const PX0 = R.x1 - .2, PZ0 = R.z1 - .4; pile.position.set(PX0, 0, PZ0); scene.add(pile); ctx.solid(Math.floor(PX0), Math.floor(PZ0));
  const rolling = [];
  const spill = () => {
    pile.userData.wob = .5; sfx.pop();
    for (let i = 0; i < 6; i++) { const m = makeSprite(WILD.eikel(), { lean: .3, shadow: false, scale: .9 }); m.position.set(PX0, .3, PZ0 + .1); scene.add(m); rolling.push({ m, vx: -.8 - Math.random() * 1.6, vz: (Math.random() - .3) * 1.2, vy: 2 + Math.random() * 1.5, t: 0 }); }
    if (Q.giftOnce('eikels', 'munt')) setTimeout(() => { sfx.chime(5); const c = makeSprite(ART.coin(), { lean: .2, shadow: false, scale: 1.1 }); c.position.set(PX0 - .6, .5, PZ0 + .2); scene.add(c); rolling.push({ m: c, coin: true, t: 0 }); }, 350);
  };
  pile.userData.alpha = WILD.eikels(); pile.userData.tap = () => { if (near(PX0, PZ0, 1.6)) spill(); else ctx.approach(Math.floor(PX0) - 1, Math.floor(PZ0), spill); }; pick.push(pile);

  // a rug, and a hammock to swing in: a tap and she climbs in, rocks, dozes a little and hops out again
  const rug = makeSprite(WILD.kleed(), { lean: Math.PI / 2, shadow: false, scale: 1.3 }); rug.position.set((R.x0 + R.x1 + 1) / 2, .02, (R.z0 + R.z1) / 2 + 1.2); scene.add(rug);
  const HX = R.x0 + 4.5, HZ = R.z0 + .8, ham = makeSprite(WILD.hangmat(), { lean: .3, scale: 1.2 }); ham.position.set(HX, 0, HZ); scene.add(ham); ctx.solid(Math.floor(HX) - 1, Math.floor(HZ)); ctx.solid(Math.floor(HX), Math.floor(HZ)); ctx.solid(Math.floor(HX) + 1, Math.floor(HZ));
  let nap = null;
  const swing = () => { if (nap || ride) return; nap = { t: 0, x0: kid.pos.x, z0: kid.pos.z }; ctx.setBusy(true); sfx.purr(); };
  ham.userData.alpha = WILD.hangmat(); ham.userData.tap = () => { sfx.pop(); if (near(HX, HZ + 1, 1.6)) swing(); else ctx.approach(Math.floor(HX), Math.floor(HZ) + 1, swing); }; pick.push(ham);
  function stepNap(dt, time) {
    const n = nap; n.t += dt; const k = Math.min(1, n.t / .4), out = n.t > 4.2;
    const s = Math.sin(n.t * 2.4) * .18 * Math.min(1, n.t);
    kid.pos.set(HX + s * .6, 0, HZ + .12); kid.lift = out ? Math.max(0, .42 * (1 - (n.t - 4.2) / .3)) : .42 * k; ham.rotation.z = s * .25; kid.mesh.rotation.z = s * .6;
    if (n.t > 1.4 && Math.floor(n.t / .9) !== n.z && !out) { n.z = Math.floor(n.t / .9); ctx.life.bit(ART.zzz(), kid.pos.x + .2, 1.2, kid.pos.z + .1, { vx: .3, vy: .5, g: -.2, sway: 2, life: 1.3, scale: .8 }); }
    if (n.t >= 4.5) { nap = null; ham.rotation.z = 0; kid.mesh.rotation.z = 0; kid.lift = 0; ctx.placeAt(HX + .5, HZ + 1.2, 0, 1); kid.hop = 1; sfx.boing(); ctx.setBusy(false); }
  }

  // one rule for every input: right next to the telescope, the hammock or the acorns the action button uses them
  ctx.addUse(() => {
    if (MAP.roomAt(Math.floor(kid.pos.x), Math.floor(kid.pos.z)) !== 'hut' || nap || ride) return null; if (ctx.toys.carrying()) return null;
    if (near(SX, SZ + .8, 1.2)) return { key: 'kijker', art: WILD.telescoop(), run: look };
    if (near(HX, HZ + .9, 1.5)) return { key: 'hangmat', art: WILD.hangmat(), run: swing };
    if (near(PX0, PZ0, 1.4)) return { key: 'eikels', art: WILD.eikel(), run: spill };
    return null;
  });
  return {
    zip, riding: () => !!ride, napping: () => !!nap, swing,
    info: () => ({ riding: !!ride, view, A: [A.x, A.y, A.z], B: [B.x, B.y, B.z] }),
    update(dt, time) {
      if (ride) stepRide(dt); if (nap) stepNap(dt, time);
      if (pile.userData.wob > 0) { pile.userData.wob -= dt; pile.rotation.z = Math.sin(pile.userData.wob * 40) * .06; } else pile.rotation.z = 0;
      for (let i = rolling.length - 1; i >= 0; i--) {
        const r = rolling[i]; r.t += dt;
        if (r.coin) { r.m.position.y = .5 + r.t * 1.4; r.m.scale.x = Math.cos(r.t * 10) * 1.1; if (r.t > 1) { scene.remove(r.m); rolling.splice(i, 1); } continue; }
        r.vy -= 9 * dt; r.m.position.x += r.vx * dt; r.m.position.z += r.vz * dt; r.m.position.y = Math.max(.02, r.m.position.y + r.vy * dt); if (r.m.position.y <= .02) { r.vy = Math.abs(r.vy) * .4; r.vx *= .7; r.vz *= .7; }
        if (r.t > 2.4) { r.m.scale.setScalar(Math.max(.01, .9 * (3 - r.t) / .6)); if (r.t > 3) { scene.remove(r.m); rolling.splice(i, 1); } }
      }
    },
    dispose() { for (const r of rolling) scene.remove(r.m); },
  };
}
