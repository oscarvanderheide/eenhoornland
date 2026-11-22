// Things to play with that are not needed for anything: a bike to ride, balls to kick, and the boat that sails
// between the beach and the rainbow island. Where they are comes from map.js; nothing here is saved.
// world.js hands over the same toolbox (ctx) as for world-extras.js.
import * as ART from './art.js';
import * as MAP from './map.js';
import { sfx, speak } from './audio.js';

export function createPlay(ctx) {
  const { THREE, scene, M, makeSprite, pick, burst, bubble, kid, uni } = ctx;
  const tileOf = v => [Math.floor(v.x), Math.floor(v.z)];

  /* ---------------- bike: tap it to get on, tap it (or her) again to get off ---------------- */
  const BS = 1.45, bike = makeSprite(ART.bike(), { lean: .25, scale: BS }); bike.position.set(MAP.BIKE[0], 0, MAP.BIKE[1]); scene.add(bike);
  let bikeFace = 1;
  bike.userData.alpha = ART.bike();
  bike.userData.tap = () => {
    if (ctx.mount() === 'fiets') { ctx.setMount(null); return; }
    const [bx, bz] = tileOf(bike.position), go = () => { if (ctx.setMount('fiets')) speak('Tring tring! Fietsen maar!'); };
    if (Math.hypot(bike.position.x - kid.pos.x, bike.position.z - kid.pos.z) < 1.6) go(); else { sfx.pop(); ctx.approach(bx, bz, go); }
  };
  pick.push(bike);

  /* ---------------- balls: walk into one and it rolls away ---------------- */
  const balls = MAP.BALLS.map(([x, z], k) => {
    const mesh = makeSprite(ART.ball(k > 0), { lean: .3, scale: k > 0 ? 1 : .9 }); scene.add(mesh);
    return { mesh, x, z, vx: 0, vz: 0, h: 0, vh: 0, r: k > 0 ? .34 : .25, spin: 0, cool: 0 };
  });
  const open = (x, z) => M.free(Math.floor(x), Math.floor(z));
  function kick(b, dx, dz, power) {
    const l = Math.hypot(dx, dz) || 1; b.vx = dx / l * power; b.vz = dz / l * power; b.vh = 2.6; b.cool = .25; sfx.boing();
    if (uni.g.visible && ctx.mount() !== 'uni' && uni.hop <= 0) uni.hop = .8;
  }
  function moveBall(b, dt) {
    if (b.cool > 0) b.cool -= dt;
    const sp = Math.hypot(b.vx, b.vz);
    if (sp > .02) {
      const nx = b.x + b.vx * dt, nz = b.z + b.vz * dt;
      if (open(nx, b.z)) b.x = nx; else { b.vx *= -.6; sfx.pop(); }
      if (open(b.x, nz)) b.z = nz; else { b.vz *= -.6; sfx.pop(); }
      const f = Math.max(0, 1 - dt * 1.4); b.vx *= f; b.vz *= f; b.spin -= b.vx * dt * 2.2;
    } else { b.vx = b.vz = 0; }
    if (b.h > 0 || b.vh > 0) { b.vh -= dt * 9; b.h += b.vh * dt; if (b.h <= 0) { b.h = 0; b.vh = b.vh < -1.2 ? -b.vh * .5 : 0; } }
    b.mesh.position.set(b.x, b.h, b.z); b.mesh.rotation.z = b.spin;
  }

  /* ---------------- the boat ---------------- */
  // Stand on the end of a pier and the boat takes you across: nothing to steer, nothing to get wrong.
  const B = MAP.BOAT, boat = makeSprite(ART.propArt('boat'), { lean: .2, shadow: false, scale: 1.5 });
  let side = 'strand', sail = null, armed = true;
  boat.position.set(B.strand.moor[0], .02, B.strand.moor[1]); scene.add(boat);
  boat.userData.alpha = ART.propArt('boat');
  boat.userData.tap = () => { if (sail) return; sfx.pop(); const d = B[sideOf(kid.pos.x, kid.pos.z)].dock; ctx.walkToTile(d[0], d[1]); };
  pick.push(boat);
  /** which shore a point is on: the rainbow island, or everything else */
  const sideOf = (x, z) => M.zone[M.I(Math.max(0, Math.min(M.W - 1, Math.floor(x))), Math.max(0, Math.min(M.H - 1, Math.floor(z))))] === 'eiland' ? 'eiland' : 'strand';
  const onDock = s => { const [x, z] = tileOf(kid.pos), d = B[s].dock; return x === d[0] && (z === d[1] || z === d[1] + 1); };
  function startSail(from) {
    const to = from === 'strand' ? 'eiland' : 'strand';
    ctx.setMount(null, true); ctx.setBusy(true); side = from; boat.position.set(B[from].moor[0], .02, B[from].moor[1]);
    sail = { t: 0, from, to, dur: 6 }; sfx.splash(); kid.sit = true;
    speak(to === 'eiland' ? 'Alle hens aan dek! We varen naar het regenboogeiland!' : 'We varen terug naar het strand!');
  }
  function endSail() {
    const s = sail; sail = null; side = s.to; armed = false; kid.sit = false; kid.lift = 0;
    const d = B[s.to].dock; ctx.placeAt(d[0] + .5, d[1] + 1, s.to === 'strand' ? 1 : -1, 0); ctx.setBusy(false); kid.hop = 1; sfx.tada(); burst(kid.pos, 8);
  }

  return {
    dispose() { },
    /** the unicorn and the bike take turns: the bike stays where she got off */
    mounted(m, was) { if (was === 'fiets') { bike.position.set(kid.pos.x + .55 * bikeFace, 0, kid.pos.z + .05); } },
    /** if (tx, tz) lies across the water from her, the pier she has to walk to; else null */
    detour(tx, tz) { const a = sideOf(kid.pos.x, kid.pos.z); return a !== sideOf(tx + .5, tz + .5) ? B[a].dock.slice() : null; },
    info: () => ({ side, sailing: !!sail, bike: [bike.position.x, bike.position.z], balls: balls.map(b => [+b.x.toFixed(2), +b.z.toFixed(2)]) }),
    kick(i, dx, dz) { kick(balls[i], dx, dz, 6); }, tapBike: () => bike.userData.tap(), tapBoat: () => boat.userData.tap(),
    update(dt, time, active) {
      // bike
      if (ctx.mount() === 'fiets') { bikeFace = kid.face; bike.position.set(kid.pos.x, kid.mesh.position.y - (kid.lift || 0), kid.pos.z + .09); bike.scale.set(BS * bikeFace, BS, 1); bike.rotation.z = 0; }
      else bike.rotation.z = Math.max(0, Math.sin(time * 1.3)) > .97 ? Math.sin(time * 40) * .08 : 0;                    // a little rattle now and then: "ride me"
      // balls
      for (const b of balls) {
        const dx = b.x - kid.pos.x, dz = b.z - kid.pos.z;
        if (active && b.cool <= 0 && Math.hypot(dx, dz) < b.r + .38) kick(b, dx, dz, kid.moving ? (ctx.mount() ? 8.5 : 6) : 3);
        moveBall(b, dt);
      }
      // boat
      if (sail) {
        const s = sail; s.t += dt; const u = Math.min(1, s.t / s.dur), e = u * u * (3 - 2 * u), a = B[s.from].moor, c = B[s.to].moor, dir = c[0] > a[0] ? 1 : -1;
        const x = a[0] + (c[0] - a[0]) * e, z = a[1] + (c[1] - a[1]) * e + Math.sin(e * Math.PI) * 2.4, bob = Math.sin(time * 3) * .04;
        boat.position.set(x, .02 + bob, z); boat.scale.set(1.5 * dir, 1.5, 1); boat.rotation.z = Math.sin(time * 2.2) * .04;
        kid.pos.set(x - dir * .3, 0, z - .12); kid.lift = .3 + bob; kid.face = dir; kid.moving = false;
        if (uni.g.visible) { uni.pos.set(x + dir * .55, 0, z - .14); uni.face = dir; uni.moving = false; uni.lift = .3 + bob; }
        if (Math.floor(s.t * 1.2) !== Math.floor((s.t - dt) * 1.2)) sfx.bubble();
        if (u >= 1) { uni.lift = 0; endSail(); }
      } else {
        boat.position.y = .02 + Math.sin(time * 2) * .03; boat.rotation.z = Math.sin(time * 1.6) * .03;
        if (!active) return;
        const here = onDock('strand') ? 'strand' : onDock('eiland') ? 'eiland' : null;
        if (!here) armed = true; else if (armed && !kid.path.length) startSail(here);
      }
    },
  };
}
