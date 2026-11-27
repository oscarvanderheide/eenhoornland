// The voyage to the rainbow island (Oscar: "we need to travel further over sea and encounter things like whales, maybe rings
// to row through, other kind of sea things"). Out on the open water between the beach's jetty and the island's:
//   the rings      seven floating rings, red and white, in a winding row along the way. Rowing through one: it turns
//                  gold with a little tune, one note higher for each; all seven on one trip and a coin
//   the whale      a big blue whale about halfway, a little off the way. When the boat comes near it rises, blows a
//                  fountain from its back, and slaps its tail as it goes down again. A tap on it, and it blows for her too
//   the dolphins   two dolphins that come and leap beside the boat for a stretch of the way
//   the bottle     a bottle bobbing on the waves with a note rolled up inside: rowing up to it she fishes it out (a coin)
//   the bell buoy  a red buoy with a bell on top: it rings as the boat goes by
//   the turtle     a sea turtle paddling slowly round in circles near the island
// All in the world's measure (S.world): they are on the water between two islands, and belong to neither.
import { THREE, paper, WATER_Y } from './kit.js';
import { ANIMALS2 } from './animals2.js';

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
    const k = .12 + i * .115, p = along(k, Math.sin(i * 1.25) * 4.5), g = new THREE.Group(); g.position.set(p.x, WATER_Y + .25, p.z); S.world(g);
    const q = along(Math.min(1, k + .02), Math.sin(i * 1.25 + .3) * 4.5); g.rotation.y = Math.atan2(q.x - p.x, q.z - p.z);   // it faces the way, so the boat goes through
    const parts = []; for (let s = 0; s < 8; s++) { const m = new THREE.Mesh(new THREE.TorusGeometry(1.05, .12, 8, 8, Math.PI / 4), s % 2 ? white : red); m.rotation.z = s * Math.PI / 4; m.castShadow = true; g.add(m); parts.push(m); }
    return { g, p, parts, done: false, wob: 0 };
  });
  let passed = 0, trips = -1, allRings = 0;

  /* ---------------- the whale ---------------- */
  const wp = along(.5, -8.5), whale = new THREE.Group(); whale.position.set(wp.x, WATER_Y - 1.4, wp.z); whale.rotation.y = Math.atan2(ux, uz) + Math.PI / 2; S.world(whale);
  { const back = m3(new THREE.SphereGeometry(1.3, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), '#5f86b0'); back.scale.set(2.3, .8, 1); whale.add(back);
    const belly = m3(new THREE.SphereGeometry(1.31, 20, 6, 0, Math.PI * 2, Math.PI * .42, Math.PI * .08), '#e8eef2'); belly.scale.set(2.3, .8, 1); whale.add(belly);
    for (const s of [-1, 1]) { const eye = m3(new THREE.SphereGeometry(.09, 8, 6), '#2b2733'); eye.position.set(1.85, .45, s * .62); whale.add(eye); const w = m3(new THREE.SphereGeometry(.05, 6, 4), '#ffffff'); w.position.set(1.9, .5, s * .66); whale.add(w); }
    const tail = new THREE.Group(); tail.position.set(-3.0, .1, 0); whale.add(tail); whale.userData.tail = tail;
    const stalk = m3(new THREE.CylinderGeometry(.18, .32, .9, 10), '#5f86b0'); stalk.rotation.z = Math.PI / 2; stalk.position.x = .2; tail.add(stalk);
    for (const s of [-1, 1]) { const fin = m3(new THREE.SphereGeometry(.55, 12, 6), '#5f86b0'); fin.scale.set(.5, .12, 1.25); fin.position.set(-.35, .1, s * .5); fin.rotation.y = s * .5; tail.add(fin); }
    for (const s of [-1, 1]) { const fl = m3(new THREE.SphereGeometry(.45, 10, 6), '#56799f'); fl.scale.set(1, .12, .5); fl.position.set(.9, .2, s * 1.05); fl.rotation.y = -s * .6; whale.add(fl); } }
  const W = { t: -1, up: 0, blows: 0, met: false };
  const blow = () => { W.blows++; sfx.whoosh(); const top = new THREE.Vector3(.9, 1.15, 0).applyMatrix4(whale.matrixWorld);
    for (let i = 0; i < 4; i++) setTimeout(() => S.confetti(top.x, top.y, top.z, ['#cfeaf0', '#ffffff', '#9fd3e0'], 14, undefined, 4.2), i * 120); };
  S.tap(whale, () => { if (W.up > .5) blow(); else W.t = 0; }, 'walvis');

  /* ---------------- the dolphins ---------------- */
  const dolphins = [0, 1].map(i => { const f = S.figure('zeedolfijn' + i, ANIMALS2.dolfijn); f.thing = true; f.g.visible = false; f.g.scale.setScalar(1.25); return { f, t: -1 - i * .7 }; });

  /* ---------------- the bottle ---------------- */
  const bp = along(.33, 5.5), bottle = new THREE.Group(); bottle.position.set(bp.x, WATER_Y + .05, bp.z); S.world(bottle);
  { const glass = m3(new THREE.CylinderGeometry(.14, .16, .55, 12), '#9fd8b8'); glass.rotation.z = 1.2; bottle.add(glass);
    const neck = m3(new THREE.CylinderGeometry(.06, .1, .2, 10), '#9fd8b8'); neck.rotation.z = 1.2; neck.position.set(.3, .11, 0); bottle.add(neck);
    const cork = m3(new THREE.CylinderGeometry(.06, .06, .08, 8), '#b98f5c'); cork.rotation.z = 1.2; cork.position.set(.4, .15, 0); bottle.add(cork);
    const note = m3(new THREE.CylinderGeometry(.07, .07, .3, 8), '#fbf5ea'); note.rotation.z = 1.2; bottle.add(note); }
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

  return { state: () => ({ rings: rings.map(r => r.done), passed, allRings, whale: { up: W.up > .5, blows: W.blows, at: [wp.x, wp.z] }, fished, rang, ringsAt: rings.map(r => [r.p.x, r.p.z]), bottle: [bp.x, bp.z], buoy: [yp.x, yp.z] }),
    step({ dt, time }) {
      const fs = ferry.state(), bt = boatAt();
      // a new trip: the rings are red and white again
      if (fs.crossings !== trips) { trips = fs.crossings; passed = 0; for (const r of rings) { r.done = false; r.parts.forEach((m, s) => m.material = s % 2 ? white : red); } }
      for (const r of rings) {
        r.g.position.y = WATER_Y + .25 + Math.sin(time * 1.4 + r.p.x) * .06; r.wob = Math.max(0, r.wob - dt); r.g.rotation.z = Math.sin(r.wob * 14) * r.wob * .25;
        if (!r.done && sailing() && near(r.p, 1.0)) { r.done = true; r.wob = 1; passed++; for (const m of r.parts) m.material = gold; sfx.note(523 * Math.pow(2, (passed - 1) / 7 * 1.2));
          S.confetti(r.p.x, WATER_Y + 1.1, r.p.z, ['#f2c65c', '#fbf5ea', '#e8505b'], 14, S.starGeo, 2.4);
          if (passed === rings.length) { allRings++; sfx.chime(); S.coins.reward('ringen', bt.x, WATER_Y + 1.4, bt.z); S.confetti(bt.x, WATER_Y + 1.4, bt.z, ['#e98f8f', '#f2b56b', '#f2d86b', '#9ed9a0', '#8fc3e0', '#bba6ea'], 30, S.starGeo, 3.2); } }
      }
      // the whale: up when the boat comes near (or when tapped), a blow, a while to look at it, then down with a slap of its tail
      if (W.t < 0 && sailing() && near(wp, 11)) W.t = 0;
      if (W.t >= 0) { W.t += dt; const up = W.t < 1.2 ? W.t / 1.2 : W.t < 6.5 ? 1 : Math.max(0, 1 - (W.t - 6.5) / 1.4); W.up = up;
        if (W.t - dt < 1.5 && W.t >= 1.5) { blow(); if (!W.met) { W.met = true; S.coins.reward('walvis', wp.x, WATER_Y + 1.6, wp.z); } }
        if (W.t - dt < 4.2 && W.t >= 4.2) blow();
        if (W.t - dt < 6.6 && W.t >= 6.6) { sfx.splash(); const tp = new THREE.Vector3(-3.4, .4, 0).applyMatrix4(whale.matrixWorld); S.confetti(tp.x, WATER_Y + .3, tp.z, ['#cfeaf0', '#ffffff'], 22, undefined, 3.4); }
        whale.userData.tail.rotation.z = W.t > 5.8 && W.t < 7 ? Math.sin((W.t - 5.8) * 4) * .9 : Math.sin(time * 1.3) * .12;
        if (W.t > 8 + (near(wp, 11) ? 6 : 0)) W.t = -1; }
      whale.position.y = WATER_Y - 1.25 + W.up * 1.1 + Math.sin(time) * .04 * W.up; whale.visible = W.up > .01;
      // the dolphins: leaping beside the boat for the middle stretch of the way
      const k = ((bt.x - A.x) * ux + (bt.z - A.z) * uz) / L, fx = Math.cos(bt.a), fz = -Math.sin(bt.a);
      for (const [i, d] of dolphins.entries()) {
        if (!(sailing() && k > .2 && k < .8 && bt.v > 1)) { d.f.g.visible = false; d.t = -1 - i * .7; continue; }
        d.t += dt; if (d.t < 0) { d.f.g.visible = false; continue; }
        const q = d.t / 1.1; if (q >= 1) { d.t = -.4 - Math.random() * .8; d.f.g.visible = false; if (Math.random() < .6) sfx.splash(); continue; }
        const side = i ? -2.2 : 2.4, ahead = 1.5 + q * 2.2;
        d.f.g.visible = true; d.f.x = bt.x + fx * ahead - fz * side; d.f.z = bt.z + fz * ahead + fx * side; d.f.floatY = d.f.y = WATER_Y - .3 + Math.sin(q * Math.PI) * 1.3; d.f.face = fx >= 0 ? 1 : -1; d.f.lean = (.5 - q) * 1.6 * d.f.face;
        d.f.act = () => d.f.setFrame(q < .35 ? 0 : q < .65 ? 1 : 2);
      }
      // the bottle: bobbing, and fished out when the boat comes alongside
      if (!fished) { bottle.position.y = WATER_Y + .05 + Math.sin(time * 2) * .05; bottle.rotation.y = time * .3; bottle.rotation.x = Math.sin(time * 1.7) * .2;
        if (sailing() && near(bp, 1.7)) { fished = true; sfx.splash(); bottle.visible = false; S.confetti(bp.x, WATER_Y + .8, bp.z, ['#9fd8b8', '#fbf5ea', '#f2c65c'], 16, S.starGeo, 2.6); S.coins.earn(bp.x, WATER_Y + 1, bp.z); } }
      // the bell buoy: it rings as the boat goes by
      if (sailing() && near(yp, 2.6) && ringT <= 0 && time - (buoy.userData.last || -9) > 4) { buoy.userData.last = time; ringT = 1.2; sfx.note(1046); setTimeout(() => sfx.note(784), 260); rang++; }
      ringT = Math.max(0, ringT - dt); buoy.rotation.z = Math.sin(time * 1.2) * .06 + Math.sin(ringT * 18) * ringT * .2; buoy.position.y = WATER_Y + Math.sin(time * 1.6) * .05; buoy.userData.bell.rotation.z = Math.sin(ringT * 22) * ringT * .5;
      // the turtle, paddling round
      ta += dt * .25; turtle.x = tc.x + Math.cos(ta) * 2.6; turtle.z = tc.z + Math.sin(ta) * 1.6; turtle.floatY = turtle.y = WATER_Y - .18; turtle.face = -Math.sin(ta) >= 0 ? 1 : -1; turtle.walking = true;
    } };
}
