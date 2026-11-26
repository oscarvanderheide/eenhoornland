// Things to play with that are not needed for anything: a bike (with a bell and a trailer for animals), balls to kick, and the boat: it takes her to the rainbow island when that is where she wants to go,
// and otherwise she sails it herself around the lagoon, inside the buoys. Where things are comes from map.js.
// world.js hands over the same toolbox (ctx) as for world-extras.js.
import * as ART from './art.js';
import * as MAP from './map.js';
import * as PX from './pixel.js';
import * as Q from './quest.js';
import { sfx, speak } from './audio.js';

export function createPlay(ctx) {
  const { THREE, scene, M, makeSprite, pick, burst, bubble, kid, uni, animals } = ctx;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const tileOf = v => [Math.floor(v.x), Math.floor(v.z)];

  /* ---------------- bike: tap it to get on, tap it (or her) again to get off ---------------- */
  const BS = 1.1, bike = makeSprite(ART.bike(), { lean: .25, scale: BS }); bike.position.set(MAP.BIKE[0], 0, MAP.BIKE[1]); scene.add(bike);
  let bikeFace = 1;
  bike.userData.alpha = ART.bike();
  bike.userData.tap = () => {
    if (ctx.mount() === 'fiets') { ctx.setMount(null); return; }
    const [bx, bz] = tileOf(bike.position), go = () => { if (ctx.setMount('fiets')) speak('Tring tring! Fietsen maar!'); };
    if (Math.hypot(bike.position.x - kid.pos.x, bike.position.z - kid.pos.z) < 1.6) go(); else { sfx.pop(); ctx.approach(bx, bz, go); }
  };
  pick.push(bike);

  /* the trailer: on the bike, tap an animal and it hops in for a ride (two fit); tap it again, or get off, and out it hops */
  const cart = makeSprite(ART.bak(), { lean: .25, scale: 1.1 }); scene.add(cart); cart.userData.alpha = ART.bak();
  cart.userData.tap = () => { sfx.pop(); if (riders.length) hopOut(riders[0]); else bike.userData.tap(); }; pick.push(cart);
  const riders = [], cartP = new THREE.Vector3(MAP.BIKE[0] - 1.05, 0, MAP.BIKE[1]);
  function hopIn(c) { if (riders.length >= 2) hopOut(riders[0]); c.cart = { t: 0, from: c.pos.clone() }; c.path = []; c.fly = null; riders.push(c); sfx.boing(); bubble(c, '!'); }
  function hopOut(c) {
    const i = riders.indexOf(c); if (i < 0) return; riders.splice(i, 1); c.cart = null; c.lift = 0;
    const t = ctx.nearestWalkable(cartP.x, cartP.z + .9) || [Math.floor(kid.pos.x), Math.floor(kid.pos.z)]; c.pos.set(t[0] + .5, 0, t[1] + .5); c.hop = 1; c.lost = true; c.wait = 1.5; (sfx[c.sound] || sfx.pop)();
  }
  /* hump bridges on the paths: on the bike she goes over with a happy little hop (on foot they are just a bump) */
  const streamer = makeSprite(ART.linten(0), { lean: .2, shadow: false }); streamer.visible = false; scene.add(streamer);
  let flip = 0, hint = 0;

  /* ---------------- balls: walk into one and it rolls away ---------------- */
  const balls = MAP.BALLS.map(([x, z], k) => {
    const mesh = ctx.seeThrough(makeSprite(ART.ball(k > 0), { lean: .3, scale: k > 0 ? 1 : .9 })); scene.add(mesh);
    return { mesh, x, z, vx: 0, vz: 0, h: 0, vh: 0, r: k > 0 ? .34 : .25, spin: 0, cool: 0 };
  });
  const wetAt = (x, z) => { const X = Math.floor(x), Z = Math.floor(z); return X > 2 && Z > 2 && X < MAP.W - 3 && Z < MAP.H - 3 && [MAP.SE, MAP.WA].includes(M.ground[M.I(X, Z)]) && !M.deck[M.I(X, Z)]; };
  const open = (x, z) => M.free(Math.floor(x), Math.floor(z)) || wetAt(x, z);     // a ball may roll into the water: the wind brings it back
  const gustArt = PX.gridSprite(6, 1, () => '#FFFFFF', { outline: false, key: 'gust' });
  function kick(b, dx, dz, power) {
    const l = Math.hypot(dx, dz) || 1; b.vx = dx / l * power; b.vz = dz / l * power; b.vh = 2.6; b.cool = .25; sfx.boing();
    if (uni.g.visible && ctx.mount() !== 'uni' && uni.hop <= 0) uni.hop = .8;
  }
  function moveBall(b, dt) {
    if (b.cool > 0) b.cool -= dt;
    if (b.gust) {                                                                  // a gust of wind carries it back to the shore in one long bounce
      const g = b.gust; g.t += dt; const k = Math.min(1, g.t / g.T); b.x = g.x0 + (g.x1 - g.x0) * k; b.z = g.z0 + (g.z1 - g.z0) * k; b.h = Math.sin(k * Math.PI) * 1.3; b.spin -= dt * 9 * Math.sign(g.x1 - g.x0 || 1);
      if (k >= 1) { b.gust = null; b.h = 0; b.vh = 2; b.vx = (g.x1 - g.x0) / g.T * .25; b.vz = (g.z1 - g.z0) / g.T * .25; b.float = 0; sfx.boing(); }
      b.mesh.position.set(b.x, b.h, b.z); b.mesh.rotation.z = b.spin; return;
    }
    if (wetAt(b.x, b.z) && b.h <= 0) {                                             // floating: it bobs for a moment, then the wind comes
      if (!b.float) { b.float = .001; sfx.splash(); burst(new THREE.Vector3(b.x, .1, b.z), 5); } b.float += dt; b.vx *= Math.max(0, 1 - dt * 4); b.vz *= Math.max(0, 1 - dt * 4); b.x += b.vx * dt; b.z += b.vz * dt;
      if (b.float > 1.1) {
        const t = ctx.nearestWalkable(b.x, b.z) || [Math.floor(kid.pos.x), Math.floor(kid.pos.z)], x1 = t[0] + .5, z1 = t[1] + .5, d = Math.hypot(x1 - b.x, z1 - b.z) || 1;
        b.gust = { t: 0, T: Math.min(1.6, .6 + d * .12), x0: b.x, z0: b.z, x1, z1 }; sfx.whoosh();
        for (let i = 0; i < 7; i++) ctx.life.bit(gustArt, b.x - (x1 - b.x) / d * rnd(.3, 1.4) + rnd(-.3, .3), rnd(.2, .9), b.z - (z1 - b.z) / d * rnd(.3, 1.4) + .1, { vx: (x1 - b.x) / d * rnd(4, 6), vz: (z1 - b.z) / d * rnd(4, 6), vy: 0, g: 0, life: rnd(.4, .8) });
      }
      b.mesh.position.set(b.x, -.06 + Math.sin(b.float * 6) * .04, b.z); b.mesh.rotation.z = Math.sin(b.float * 3) * .2; return;
    }
    const sp = Math.hypot(b.vx, b.vz);
    if (sp > .02) {
      const nx = b.x + b.vx * dt, nz = b.z + b.vz * dt;
      if (open(nx, b.z)) b.x = nx; else { if (sp > 2) ctx.life.hitAt(nx, b.z); b.vx *= -.6; sfx.pop(); }      // a hard kick against a tree shakes it
      if (open(b.x, nz)) b.z = nz; else { if (sp > 2) ctx.life.hitAt(b.x, nz); b.vz *= -.6; sfx.pop(); }
      if (sp > 1.4) for (const a of animals) { if (a.held || a.fly || a.cart || a.swim || a.water || a.hop > 0) continue; const ax = b.x - a.pos.x, az = b.z - a.pos.z, d = Math.hypot(ax, az); if (d < .5) { a.hop = 1; a.face = ax > 0 ? 1 : -1; (sfx[a.sound] || sfx.pop)(); const l = d || 1; b.vx = ax / l * sp * .6; b.vz = az / l * sp * .6; } }   // whoever stands in the way jumps aside
      const f = Math.max(0, 1 - dt * 1.4); b.vx *= f; b.vz *= f; b.spin -= b.vx * dt * 2.2;
    } else { b.vx = b.vz = 0; }
    if (b.h > 0 || b.vh > 0) { b.vh -= dt * 9; b.h += b.vh * dt; if (b.h <= 0) { b.h = 0; b.vh = b.vh < -1.2 ? -b.vh * .5 : 0; } }
    b.mesh.position.set(b.x, b.h, b.z); b.mesh.rotation.z = b.spin;
  }

  /* ---------------- the boat ---------------- */
  // Step onto the end of a pier and she is in the boat. If she was on her way to the other side, it takes her there by
  // itself. Otherwise it pushes off a little and waits: a tap on the water sails there, a tap on land sails to the pier
  // on that side and she walks on. The boat only sails inside the buoys (MAP.LAGOON), so nobody gets lost at sea.
  const B = MAP.BOAT, L = MAP.LAGOON, boat = makeSprite(ART.propArt('boat'), { lean: .2, shadow: false, scale: 1.5 });
  let side = 'strand', aboard = false, armed = true, pending = null, route = [], landing = null, dir = -1, fishT = 2, wake = 0, fromDock = 'strand', clearOfDock = false, drivenAt = 0;
  /** steering with the keys: the boat goes where the arrows point, and sailing up to a pier is landing there */
  function drive(kx, kz, dt) {
    if (!aboard || (!kx && !kz)) return; route = []; landing = null; drivenAt = performance.now();
    const l = Math.hypot(kx, kz), st = 3.6 * dt, nx = bp.x + kx / l * st, nz = bp.z + kz / l * st, ok = (x, z) => sailable(Math.floor(x), Math.floor(z)) || Object.values(B).some(b => Math.hypot(x - b.moor[0], z - b.moor[1]) < .9);
    if (kx) dir = kx > 0 ? 1 : -1;
    if (ok(nx, bp.z)) bp.x = nx; if (ok(bp.x, nz)) bp.z = nz;
    if ((wake -= dt) < 0) { wake = .8; sfx.bubble(); }
    for (const s of Object.keys(B)) { const d = Math.hypot(bp.x - B[s].moor[0], bp.z - B[s].moor[1]); if (d > 2.5 && s === fromDock) clearOfDock = true; if (d < 1 && (s !== fromDock || clearOfDock)) { disembark(s, null); return; } }
  }
  const bp = new THREE.Vector3(B.strand.moor[0], 0, B.strand.moor[1]);
  boat.position.set(bp.x, .02, bp.z); scene.add(boat);
  boat.userData.alpha = ART.propArt('boat');
  boat.userData.tap = () => { sfx.pop(); if (aboard) { kid.hop = .5; return; } const d = B[sideOf(kid.pos.x, kid.pos.z)].dock; ctx.walkToTile(d[0], d[1]); };
  pick.push(boat);
  /** which shore a point is on: the rainbow island, or everything else */
  const sideOf = (x, z) => M.zone[M.I(Math.max(0, Math.min(M.W - 1, Math.floor(x))), Math.max(0, Math.min(M.H - 1, Math.floor(z))))] === 'eiland' ? 'eiland' : 'strand';
  const onDock = s => { const [x, z] = tileOf(kid.pos), d = B[s].dock; return x === d[0] && (z === d[1] || z === d[1] + 1); };
  const sailable = (x, z) => x >= L.x0 && x <= L.x1 && z >= L.z0 && z <= L.z1 && M.ground[M.I(x, z)] === MAP.SE && !M.deck[M.I(x, z)] && !M.inland[M.I(x, z)];
  const clearSea = (ax, az, bx, bz) => { const n = Math.ceil(Math.hypot(bx - ax, bz - az) / .25); for (let i = 0; i <= n; i++) { const x = ax + (bx - ax) * i / n, z = az + (bz - az) * i / n; if (!sailable(Math.floor(x), Math.floor(z)) || !sailable(Math.floor(x + .3), Math.floor(z)) || !sailable(Math.floor(x - .3), Math.floor(z))) return false; } return true; };
  /** the sailable tile nearest to a point */
  function nearestSea(px, pz) { let best = null, bd = 1e9; const x0 = Math.floor(px), z0 = Math.floor(pz); for (let r = 0; r < 30 && !best; r++) for (let z = z0 - r; z <= z0 + r; z++) for (let x = x0 - r; x <= x0 + r; x++) { if (!sailable(x, z)) continue; const d = Math.hypot(x + .5 - px, z + .5 - pz); if (d < bd) { bd = d; best = [x, z]; } } return best; }
  /** sail to a tile (the last stretch optionally to an exact point, like a mooring) */
  function sailTo(tx, tz, exact = null) {
    const s = nearestSea(bp.x, bp.z); if (!s) return false;
    const p = ctx.astar(s[0], s[1], tx, tz, sailable); if (!p) return false;
    const pts = p.map(([x, z]) => [x + .5, z + .5]); if (exact) pts.push(exact);
    route = []; let cur = [bp.x, bp.z], i = 0;
    while (i < pts.length) { let j = pts.length - 1; while (j > i && !(clearSea(cur[0], cur[1], pts[j][0], pts[j][1]) || (exact && j === pts.length - 1 && j - 1 === i))) j--; route.push(pts[j]); cur = pts[j]; i = j + 1; }
    return true;
  }
  const moorTile = s => [Math.floor(B[s].moor[0]), Math.floor(B[s].moor[1])];
  /** sail to the pier on that side, get out, and (if `then`) walk on to that tile */
  function land(s, then = null) { const t = moorTile(s); if (sailTo(t[0], t[1], B[s].moor)) landing = { side: s, then }; else disembark(s, then); }
  function board(from) {
    ctx.setMount(null, true); ctx.setBusy(true); aboard = true; side = from; kid.sit = true; bp.set(B[from].moor[0], 0, B[from].moor[1]); route = []; landing = null; sfx.splash();
    // she sails it herself (keys or taps): it only pushes off a little, so it is plain that this thing sails
    { const t = nearestSea(bp.x + (from === 'strand' ? 4 : -4), bp.z - 3); if (t) sailTo(t[0], t[1]); }
    pending = null; fromDock = from; clearOfDock = false; speak('Alle hens aan dek! Waar varen we heen?');
  }
  function disembark(s, then) {
    aboard = false; armed = false; side = s; landing = null; route = []; kid.sit = false; kid.lift = 0; uni.lift = 0; bp.set(B[s].moor[0], 0, B[s].moor[1]);
    const d = B[s].dock; ctx.placeAt(d[0] + .5, d[1] + 1, s === 'strand' ? -1 : 1, 0); ctx.setBusy(false); kid.hop = 1; sfx.tada(); burst(kid.pos, 8);   // the unicorn lands on the pier, on the side of the land
    if (then) ctx.walkToTile(then[0], then[1]);
  }
  /** a tap while she is in the boat */
  function steer(px, pz) {
    if (!aboard) return; const tx = Math.floor(px), tz = Math.floor(pz);
    if (Math.hypot(px - MAP.WHALE[0], pz - MAP.WHALE[1]) < 1.3 && Math.hypot(bp.x - MAP.WHALE[0], bp.z - MAP.WHALE[1]) < 7) whaleUp();   // a tap on the shadow itself, when she is near enough to see it
    if (M.inb(tx, tz) && M.ground[M.I(tx, tz)] !== MAP.SE || M.inb(tx, tz) && M.deck[M.I(tx, tz)]) {         // land or a pier: go ashore on that side
      const s = sideOf(px, pz), onPier = M.deck[M.I(tx, tz)] || !ctx.walkable(tx, tz); sfx.click(); land(s, onPier ? null : [tx, tz]); return;
    }
    const t = sailable(tx, tz) ? [tx, tz] : nearestSea(Math.max(L.x0, Math.min(L.x1, px)), Math.max(L.z0, Math.min(L.z1, pz)));   // beyond the buoys: as far as the buoys
    if (t && sailTo(t[0], t[1], sailable(tx, tz) ? [px, pz] : null)) { landing = null; sfx.click(); ctx.showMarker(sailable(tx, tz) ? px : t[0] + .5, sailable(tx, tz) ? pz : t[1] + .5); }
  }
  /* buoys around the lagoon */
  {
    const spots = []; for (let x = L.x0; x <= L.x1; x += 3) for (const z of [L.z0, L.z1]) if (sailable(x, z)) spots.push([x + .5, z + .5]); for (let z = L.z0 + 3; z < L.z1; z += 3) for (const x of [L.x0, L.x1]) if (sailable(x, z)) spots.push([x + .5, z + .5]);
    const art = ART.boei(), inst = new THREE.InstancedMesh(ctx.spriteGeom(art.width, art.height), ctx.spriteMat(ctx.tex(art)), spots.length), d = new THREE.Object3D();
    spots.forEach(([x, z], i) => { d.position.set(x, -.08, z); d.rotation.set(-.25, 0, 0); d.updateMatrix(); inst.setMatrixAt(i, d.matrix); }); scene.add(inst);
  }
  /* little chests float in the lagoon: sail into one for a coin (three a day) */
  const chests = [];
  function syncChests() {
    for (const c of chests) scene.remove(c.m); chests.length = 0;
    const r = PX.rng((Q.quest.seed | 0) + Q.quest.day * 977), got = Q.quest.picked.munt || [];
    for (let k = 0, guard = 0; k < 3 && guard < 200; guard++) {
      const x = L.x0 + 2 + Math.floor(r() * (L.x1 - L.x0 - 3)), z = L.z0 + 1 + Math.floor(r() * (L.z1 - L.z0 - 2));
      if (![[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => sailable(x + dx, z + dz))) continue; const idx = 500 + k++;
      if (got.includes(idx)) continue; const m = makeSprite(ART.kistje(), { lean: .2, shadow: false }); m.position.set(x + .5, -.1, z + .5); scene.add(m); chests.push({ m, idx, x: x + .5, z: z + .5 });
    }
  }
  const rising = [];
  /* the whale: a shadow under the water until the boat comes close, or somebody taps it */
  const W0 = MAP.WHALE, shadow = makeSprite(ART.walvisschaduw(), { lean: Math.PI / 2, shadow: false }), whale = makeSprite(ART.walvis(), { lean: .2, shadow: false, scale: 1.5 });
  shadow.position.set(W0[0], .07, W0[1] + .4); scene.add(shadow); whale.position.set(W0[0], -2, W0[1]); whale.visible = false; scene.add(whale);
  shadow.userData.alpha = ART.walvisschaduw(); shadow.userData.tap = () => whaleUp(); pick.push(shadow);
  let whaleT = -1, whaleCool = 0, spoutT = 0;
  function whaleUp() {
    if (whaleT >= 0 || whaleCool > 0) return false; whaleT = 0; whale.visible = true; sfx.splash(); sfx.boing();
    if (aboard && Math.hypot(bp.x - W0[0], bp.z - W0[1]) < 3.2) setTimeout(() => { sfx.whoosh(); if (Q.giftOnce('walvis', 'munt')) { sfx.chime(5); ctx.life.bit(ART.coin(), W0[0] - .35, 2.4, W0[1] + .1, { vx: (bp.x - W0[0]) * .8, vy: 3, g: 6, life: 1.2, spin: 9 }); } }, 900);   // up on the spout: wheee (and once a day a coin in the spray)
    return true;
  }
  const off = Q.on(type => { if (type === 'day' || type === 'stage') syncChests(); });
  syncChests();

  return {
    dispose: off,
    /** the unicorn and the bike take turns: the bike stays where she got off */
    mounted(m, was) { if (was === 'fiets') { bike.position.set(kid.pos.x + .55 * bikeFace, 0, kid.pos.z + .05); bike.rotation.z = 0; flip = 0; for (const c of [...riders]) hopOut(c); } },
    /** if (tx, tz) lies across the water from her, the pier she has to walk to; else null */
    detour(tx, tz) { const a = sideOf(kid.pos.x, kid.pos.z); return a !== sideOf(tx + .5, tz + .5) ? B[a].dock.slice() : null; },
    /** where she was going when she set off for the pier (world.js): the boat takes her on */
    wants(t) { pending = t; },
    aboard: () => aboard, steer, whaleUp, drive, boatAt: () => bp, driving: () => performance.now() - drivenAt < 200,
    /** on the bike the jump button is the bell: birds fly up and every animal nearby looks */
    bell() { sfx.bell(); ctx.life.scare(kid.pos.x, kid.pos.z, 7); for (const a of animals) if (!a.cart && !a.fly && !a.held && Math.hypot(a.pos.x - kid.pos.x, a.pos.z - kid.pos.z) < 6) { a.hop = 1; a.face = kid.pos.x >= a.pos.x ? 1 : -1; } },
    /** on the bike, a tap on an animal: into the trailer (or out again). Returns true if it handled the tap. */
    tapAnimal(c) { if (ctx.mount() !== 'fiets') return false; if (c.cart) hopOut(c); else hopIn(c); return true; },
    info: () => ({ side, sailing: aboard, moving: route.length > 0, boat: [+bp.x.toFixed(2), +bp.z.toFixed(2)], bike: [bike.position.x, bike.position.z], balls: balls.map(b => [+b.x.toFixed(2), +b.z.toFixed(2)]), riders: riders.length, chests: chests.map(c => [c.x, c.z]), whale: whaleT >= 0, flip: flip > 0 }),
    kick(i, dx, dz) { kick(balls[i], dx, dz, 6); }, balls, kickBall: kick, wetAt, bikeNear: () => ctx.mount() !== 'fiets' && Math.hypot(bike.position.x - kid.pos.x, bike.position.z - kid.pos.z) < 1.6, tapBike: () => bike.userData.tap(), tapBoat: () => boat.userData.tap(),
    update(dt, time, active) {
      // bike, trailer
      const riding = ctx.mount() === 'fiets';
      if (riding) {
        bikeFace = kid.face; bike.position.set(kid.pos.x, kid.mesh.position.y - (kid.lift || 0), kid.pos.z + .09); bike.scale.set(BS * bikeFace, BS, 1);
        if (flip > 0) { flip = Math.max(0, flip - dt * 2.5); bike.rotation.z = bikeFace * Math.sin((1 - flip) * Math.PI) * .28; if (flip <= 0) { bike.rotation.z = 0; sfx.pop(); } } else bike.rotation.z = kid.moving ? Math.sin(time * 14) * .02 : 0;   // a little wheelie over the hump
        streamer.visible = true; streamer.position.set(bike.position.x + bikeFace * .62, bike.position.y + .62, bike.position.z + .02); streamer.scale.x = -bikeFace; const sf = kid.moving ? Math.floor(time * 10) % 2 : 0; if (streamer.userData.f !== sf) { streamer.userData.f = sf; const t = ctx.tex(ART.linten(sf)); streamer.material.map = t; streamer.material.emissiveMap = t; }
      } else { streamer.visible = false; hint = Math.max(0, hint - dt); bike.rotation.z = hint > 0 ? Math.sin(hint * 40) * .1 : 0; }          // it only rattles when a hump asks for it
      const cx = bike.position.x - bikeFace * 1.05, k = Math.min(1, dt * 14); cartP.x += (cx - cartP.x) * k; cartP.z += (bike.position.z + .1 - cartP.z) * k;
      cart.position.set(cartP.x, riding ? Math.max(0, bike.position.y) * .6 : 0, cartP.z); cart.scale.set(1.1 * bikeFace, 1.1, 1);
      riders.forEach((c, i) => {
        const tx = cartP.x + (riders.length > 1 ? (i ? .22 : -.22) : 0), tz = cartP.z - .16;   // behind the side of the trailer: they sit in it
        if (c.cart.t < 1) { c.cart.t = Math.min(1, c.cart.t + dt * 2.2); const e = c.cart.t; c.pos.set(c.cart.from.x + (tx - c.cart.from.x) * e, 0, c.cart.from.z + (tz - c.cart.from.z) * e); c.lift = .22 * e + Math.sin(e * Math.PI) * 1.2; if (e >= 1) { sfx.pop(); (sfx[c.sound] || sfx.pop)(); } }
        else { c.pos.set(tx, 0, tz); c.lift = .22 + cart.position.y; c.face = bikeFace; }
      });
      // balls
      for (const b of balls) {
        const dx = b.x - kid.pos.x, dz = b.z - kid.pos.z;
        if (active && b.cool <= 0 && Math.hypot(dx, dz) < b.r + .38) kick(b, dx, dz, kid.moving ? (ctx.mount() ? 8.5 : 6) : 3);
        moveBall(b, dt);
      }
      // whale
      whaleCool -= dt;
      if (whaleT >= 0) {
        whaleT += dt; const up = Math.min(1, whaleT / .7), down = whaleT > 2.6 ? Math.min(1, (whaleT - 2.6) / .8) : 0, y = -1.1 + 1.05 * (up * (2 - up)) - down * 1.1;
        whale.position.y = y; whale.rotation.z = Math.sin(whaleT * 2) * .04;
        if (whaleT > .6 && whaleT < 2.3 && (spoutT -= dt) < 0) { spoutT = .07; ctx.life.bit(ART.drop(), W0[0] - .35 + rnd(-.1, .1), y + 1.15, W0[1] + .05, { vx: rnd(-.9, .9), vy: rnd(4, 5.5), g: 8, life: 1.3 }); if (Math.random() < .25) sfx.bubble(); }
        if (whaleT > 3.4) { whaleT = -1; whaleCool = 4; whale.visible = false; }
      }
      // boat
      const lifted = whaleT >= 0 && Math.hypot(bp.x - W0[0], bp.z - W0[1]) < 3.2, bob = Math.sin(time * 2) * .03 + (lifted ? Math.sin(Math.min(1, Math.max(0, whaleT - .3) / 1.9) * Math.PI) * 1.1 : 0);   // close by, the spout lifts the boat right up
      if (aboard) {
        if (route.length) {
          const [tx, tz] = route[0], dx = tx - bp.x, dz = tz - bp.z, d = Math.hypot(dx, dz), st = 3.3 * dt; if (Math.abs(dx) > .05) dir = dx > 0 ? 1 : -1;
          if (d <= st) { bp.x = tx; bp.z = tz; route.shift(); } else { bp.x += dx / d * st; bp.z += dz / d * st; }
          if ((wake -= dt) < 0) { wake = .8; sfx.bubble(); } if ((fishT -= dt) < 0) { fishT = rnd(2.5, 4.5); ctx.life.fishJump(bp.x + dir * 1.6, bp.z - 1.2, true); }
          if (!route.length && landing) { const l = landing; disembark(l.side, l.then); }
        }
        if (aboard) {
          kid.pos.set(bp.x - dir * .3, 0, bp.z - .12); kid.lift = .3 + bob; kid.face = dir; kid.moving = false;
          if (uni.g.visible) { uni.pos.set(bp.x + dir * .55, 0, bp.z - .14); uni.face = dir; uni.moving = false; uni.lift = .3 + bob; }
          if (active || true) { if (Math.hypot(bp.x - W0[0], bp.z - W0[1]) < 2.6) whaleUp(); for (let i = chests.length - 1; i >= 0; i--) { const c = chests[i]; if (Math.hypot(c.x - bp.x, c.z - bp.z) < 1.1) { chests.splice(i, 1); Q.collect('munt', c.idx); sfx.chime(5); rising.push({ m: c.m, t: 0 }); kid.hop = .5; } } }
        }
      } else if (active) {
        const here = onDock('strand') ? 'strand' : onDock('eiland') ? 'eiland' : null;
        if (!here) armed = true; else if (armed && !kid.path.length) board(here);
      }
      boat.position.set(bp.x, .02 + bob, bp.z); boat.scale.set(1.5 * dir, 1.5, 1); boat.rotation.z = Math.sin(time * 1.6) * .03;
      for (const c of chests) c.m.position.y = -.1 + Math.sin(time * 1.8 + c.x) * .03;
      for (let i = rising.length - 1; i >= 0; i--) { const f = rising[i]; f.t += dt * 1.6; f.m.position.y = f.t * 1.4; f.m.scale.setScalar(Math.max(.01, 1 - f.t * f.t)); if (f.t >= 1) { scene.remove(f.m); rising.splice(i, 1); } }
    },
  };
}
