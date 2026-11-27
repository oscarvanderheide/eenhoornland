// The voyage to the rainbow island (Oscar: "we need to travel further over sea and encounter things like whales, maybe rings
// to row through, other kind of sea things"). Out on the open water between the beach's jetty and the island's:
//   the rings      seven floating rings, red and white, in a winding row along the way. Rowing through one: it turns
//                  gold with a little tune, one note higher for each; all seven on one trip and a coin
//   the whale      a big blue paper whale about halfway, a little off the way. When the boat comes near it rises, blows a
//                  fountain from its back, and slaps its tail as it goes down again. A tap on it, and it blows for her too
//   the dolphins   two dolphins that leap beside the boat now and then, for a stretch of the way
//   the bottle     a bottle bobbing on the waves with a note rolled up inside: rowing up to it she fishes it out (a coin)
//   the bell buoy  a red buoy with a bell on top: it rings as the boat goes by
//   the turtle     a sea turtle paddling slowly round in circles near the island
// All in the world's measure (S.world): they are on the water between two islands, and belong to neither.
import { THREE, paper, WATER_Y } from './kit.js';
import { ANIMALS2 } from './animals2.js';
import { CARDS3 } from './cards3.js';

const m3 = (geo, col, o) => { const m = new THREE.Mesh(geo, paper(col, o)); m.castShadow = m.receiveShadow = true; return m; };

export function voyage(S, ferry) {
  const { girl, sfx } = S, st = ferry.state(), [A, B] = st.moors.map(([x, z]) => ({ x, z }));
  const dx = B.x - A.x, dz = B.z - A.z, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, nx = -uz, nz = ux;
  /** a place along the way: k from the beach (0) to the island (1), `side` steps off the line (+ to the right going out) */
  const along = (k, side = 0) => ({ x: A.x + dx * k + nx * side, z: A.z + dz * k + nz * side });
  const boatAt = () => ferry.boat, sailing = () => ferry.state().mode === 'sail';
  const near = (p, r) => Math.hypot(boatAt().x - p.x, boatAt().z - p.z) < r;

  /* ---------------- the rings ---------------- */
  const gold = paper('#f2c65c'), red = paper('#e8505b'), white = paper('#fbf5ea');
  const rings = [0, 1, 2, 3, 4, 5, 6].map(i => {
    const k = .12 + i * .115, p = along(k, Math.sin(i * 1.25) * 4.5), g = new THREE.Group(); g.position.set(p.x, WATER_Y + .15, p.z); S.world(g);
    const q = along(Math.min(1, k + .02), Math.sin(i * 1.25 + .3) * 4.5); g.rotation.y = Math.atan2(q.x - p.x, q.z - p.z);   // it faces the way, so the boat goes through
    const parts = []; for (let s = 0; s < 8; s++) { const m = new THREE.Mesh(new THREE.TorusGeometry(2.05, .17, 8, 10, Math.PI / 4), s % 2 ? white : red); m.rotation.z = s * Math.PI / 4; m.castShadow = true; g.add(m); parts.push(m); }   // (big enough for the boat with her unicorn standing in it: Oscar saw it go through the ring)
    return { g, p, parts, done: false, wob: 0 };
  });
  let passed = 0, trips = -1, allRings = 0, cineT = 0;

  /* ---------------- the whale: a big paper card (cards3.js), rising out of the water ---------------- */
  const wp = along(.5, -8.5), whale = S.figure('walvis', CARDS3.walvis); whale.thing = true; whale.x = wp.x; whale.z = wp.z; whale.face = ux >= 0 ? 1 : -1; whale.g.visible = false;
  const W = { t: -1, up: 0, blows: 0, met: false, blowT: 0 };
  const spout = () => new THREE.Vector3(whale.x + whale.face * whale.W * .18, whale.y + whale.H * .95, whale.z + .1);
  const blow = () => { W.blows++; W.blowT = 1.3; sfx.whoosh(); const top = spout(); for (let i = 0; i < 4; i++) setTimeout(() => S.confetti(top.x, top.y, top.z, ['#cfeaf0', '#ffffff', '#9fd3e0'], 12, undefined, 3.6), i * 120); };
  whale.onTap = () => { if (W.up > .5 && W.t < 5.6) blow(); else if (W.t < 0) W.t = 0; };
  whale.act = () => whale.setFrame(W.t > 5.8 ? 2 : W.blowT > 0 ? 1 : 0);

  /* ---------------- the dolphins ---------------- */
  const dolphins = [0, 1].map(i => { const f = S.figure('zeedolfijn' + i, ANIMALS2.dolfijn); f.thing = true; f.g.visible = false; f.g.scale.setScalar(1.25); return { f, t: -1.5 - i * 1.6, leap: null }; });

  /* ---------------- the bottle: a paper card (cards3.js), bobbing on the waves ---------------- */
  const bp = along(.3, 5.5), bottle = S.figure('fles', CARDS3.fles); bottle.thing = true; bottle.x = bp.x; bottle.z = bp.z; bottle.face = 1;
  let fished = false;

  /* ---------------- the bell buoy ---------------- */
  const yp = along(.66, -3.2), buoy = new THREE.Group(); buoy.position.set(yp.x, WATER_Y, yp.z); S.world(buoy);
  { const float = m3(new THREE.CylinderGeometry(.42, .5, .5, 14), '#e8505b'); float.position.y = .1; buoy.add(float);
    const band = m3(new THREE.CylinderGeometry(.43, .45, .14, 14), '#fbf5ea'); band.position.y = .2; buoy.add(band);
    for (let i = 0; i < 3; i++) { const a = i / 3 * 6.283, leg = m3(new THREE.CylinderGeometry(.03, .03, 1.0, 5), '#8d6a48'); leg.position.set(Math.cos(a) * .2, .8, Math.sin(a) * .2); leg.rotation.set(Math.sin(a) * .2, 0, -Math.cos(a) * .2); buoy.add(leg); }
    const bell = m3(new THREE.CylinderGeometry(.08, .2, .3, 12, 1, true), '#e0b453', { side: THREE.DoubleSide }); bell.position.y = 1.25; buoy.add(bell); buoy.userData.bell = bell; }
  let rang = 0, ringT = 0;
  S.tap(buoy, () => { ringT = 1.2; sfx.note(1046); setTimeout(() => sfx.note(784), 260); rang++; }, 'boei');

  /* ---------------- the turtle ---------------- */
  const turtle = S.figure('zeeschildpad', ANIMALS2.schildpad); turtle.thing = true; turtle.g.scale.setScalar(1.3); const tc = along(.88, 5);
  let ta = 0; turtle.onTap = () => { turtle.hopV = 2; sfx.peep(); };

  return { state: () => ({ rings: rings.map(r => r.done), passed, allRings, whale: { up: W.up > .5, blows: W.blows, at: [wp.x, wp.z], frame: whale.frame }, fished, rang, ringsAt: rings.map(r => [r.p.x, r.p.z]), bottle: [bp.x, bp.z], buoy: [yp.x, yp.z] }),
    step({ dt, time }) {
      const fs = ferry.state(), bt = boatAt();
      if (cineT > 0) { cineT -= dt; if (cineT <= 0) ferry.cine(null); }
      // a new trip: the rings are red and white again
      if (fs.crossings !== trips) { trips = fs.crossings; passed = 0; for (const r of rings) { r.done = false; r.parts.forEach((m, s) => m.material = s % 2 ? white : red); } }
      for (const r of rings) {
        r.g.position.y = WATER_Y + .15 + Math.sin(time * 1.4 + r.p.x) * .06; r.wob = Math.max(0, r.wob - dt); r.g.rotation.z = Math.sin(r.wob * 14) * r.wob * .25;
        if (!r.done && sailing() && near(r.p, 1.8)) { r.done = true; r.wob = 1; passed++; for (const m of r.parts) m.material = gold; sfx.note(523 * Math.pow(2, (passed - 1) / 7 * 1.2));
          S.confetti(r.p.x, WATER_Y + 1.1, r.p.z, ['#f2c65c', '#fbf5ea', '#e8505b'], 14, S.starGeo, 2.4);
          if (passed === rings.length && S.shared.island && S.shared.island.rise()) { const [ix, iz] = S.shared.island.middle;   // all seven: the island rises out of the sea, and the camera goes far back to watch
            ferry.cine({ look: [(bt.x + ix * 2) / 3, (bt.z + iz * 2) / 3], shot: { span: 64, tall: 38, rise: .34, riseTall: .5, dof: .1, range: 12, fx: 1, fz: 1, lag: 1 }, rate: .5 }); cineT = 7.5; }
          if (passed === rings.length) { allRings++; sfx.chime(); S.coins.reward('ringen', bt.x, WATER_Y + 1.4, bt.z); S.confetti(bt.x, WATER_Y + 1.4, bt.z, ['#e98f8f', '#f2b56b', '#f2d86b', '#9ed9a0', '#8fc3e0', '#bba6ea'], 30, S.starGeo, 3.2); } }
      }
      // the whale: up when the boat comes near (or when tapped), a blow, a while to look at it, then down with its tail up
      if (W.t < 0 && sailing() && near(wp, 11)) W.t = 0;
      W.blowT = Math.max(0, W.blowT - dt);
      if (W.t >= 0) { W.t += dt;
        if (W.t - dt < 1.5 && W.t >= 1.5) { blow(); if (!W.met) { W.met = true; S.coins.reward('walvis', wp.x, WATER_Y + 1.6, wp.z); } }
        if (W.t - dt < 4.2 && W.t >= 4.2) blow();
        if (W.t - dt < 5.8 && W.t >= 5.8) sfx.splash();
        if (W.t - dt < 7.0 && W.t >= 7.0) { sfx.splash(); S.confetti(wp.x, WATER_Y + .3, wp.z, ['#cfeaf0', '#ffffff'], 22, undefined, 3.4); }
        // up over 1.2 s, there till 5.6; then only its tail, rising and going down again by 7.4
        W.up = W.t < 1.2 ? W.t / 1.2 : W.t < 5.6 ? 1 : W.t < 5.8 ? 1 - (W.t - 5.6) / .2 : W.t < 6.4 ? (W.t - 5.8) / .6 : Math.max(0, 1 - (W.t - 6.4) / 1.0);
        if (W.t > 9 + (near(wp, 11) ? 6 : 0)) W.t = -1; }
      whale.g.visible = W.up > .01; whale.floatY = whale.y = WATER_Y - whale.H * (.9 - .86 * W.up) + Math.sin(time) * .04 * W.up;   // (its belly line, at the card's foot, on the water)
      // the dolphins: leaping beside the boat for the middle stretch of the way. Each leap is laid down in the water where it
      // starts, along the way the boat was going then: steering does not swing them about (Oscar: "when i steer the boat, they
      // also change their jumping direction and that feels weird"). One leap at a time each, unhurried, with a rest between
      const k = ((bt.x - A.x) * ux + (bt.z - A.z) * uz) / L, fx = Math.cos(bt.a), fz = -Math.sin(bt.a);
      for (const [i, d] of dolphins.entries()) {
        const onWay = sailing() && bt.v > 1 && ((k > .12 && k < .26) || (k > .74 && k < .88)) && W.t < 0 && !near(wp, 16);   // (Oscar: "when the whale is there no dolphins please": early on, and late, never by the whale)
        if (!d.leap) { d.f.g.visible = false; if (!onWay) { d.t = -1.5 - i * 1.6; continue; } d.t += dt; if (d.t < 0) continue;
          const side = i ? -2.3 : 2.5; d.leap = { x: bt.x + fx * 1.2 - fz * side, z: bt.z + fz * 1.2 + fx * side, dx: fx, dz: fz, v: Math.max(1.5, bt.v) + .5, t: 0 }; sfx.splash(); S.confetti(d.leap.x, WATER_Y + .1, d.leap.z, ['#cfeaf0', '#f6efe2'], 6, undefined, 1.4); }
        const q = d.leap; q.t += dt; const u = q.t / 1.6;
        if (u >= 1) { d.leap = null; d.t = -1.8 - Math.random() * 1.6; d.f.g.visible = false; sfx.splash(); S.confetti(d.f.x, WATER_Y + .1, d.f.z, ['#cfeaf0', '#f6efe2'], 8, undefined, 1.6); continue; }
        const face = q.dx >= 0 ? 1 : -1;
        d.f.g.visible = true; d.f.x = q.x + q.dx * q.v * q.t; d.f.z = q.z + q.dz * q.v * q.t; d.f.floatY = d.f.y = WATER_Y - .3 + Math.sin(u * Math.PI) * 1.2; d.f.face = face; d.f.lean = (.5 - u) * 1.4 * face;
        d.f.act = () => d.f.setFrame(u < .35 ? 0 : u < .65 ? 1 : 2);
      }
      // the bottle: bobbing, and fished out when the boat comes alongside
      if (!fished) { bottle.floatY = bottle.y = WATER_Y - .18 + Math.sin(time * 2) * .05; bottle.lean = Math.sin(time * 1.7) * .25;
        if (sailing() && near(bp, 1.7)) { fished = true; sfx.splash(); bottle.g.visible = false; S.confetti(bp.x, WATER_Y + .8, bp.z, ['#9fd8b8', '#fbf5ea', '#f2c65c'], 16, S.starGeo, 2.6); S.coins.earn(bp.x, WATER_Y + 1, bp.z); } }
      // the bell buoy: it rings as the boat goes by
      if (sailing() && near(yp, 2.6) && ringT <= 0 && time - (buoy.userData.last || -9) > 4) { buoy.userData.last = time; ringT = 1.2; sfx.note(1046); setTimeout(() => sfx.note(784), 260); rang++; }
      ringT = Math.max(0, ringT - dt); buoy.rotation.z = Math.sin(time * 1.2) * .06 + Math.sin(ringT * 18) * ringT * .2; buoy.position.y = WATER_Y + Math.sin(time * 1.6) * .05; buoy.userData.bell.rotation.z = Math.sin(ringT * 22) * ringT * .5;
      // the turtle, paddling round
      ta += dt * .25; turtle.x = tc.x + Math.cos(ta) * 2.6; turtle.z = tc.z + Math.sin(ta) * 1.6; turtle.floatY = turtle.y = WATER_Y - .18; turtle.face = -Math.sin(ta) >= 0 ? 1 : -1; turtle.walking = true;
    } };
}
