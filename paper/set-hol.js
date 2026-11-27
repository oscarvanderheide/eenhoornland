// The egg's cave: in through the dark mouth in the forest's rock (S.door). A room of its own far beside the world.
// Not scary (Oscar): warm sand-coloured stone, moss, glowing mushrooms, fireflies, a soft amber light that goes with her.
// Four chambers in a row, left to right, and three things to work out; nothing can go wrong and nothing is timed:
//   1. three big mushrooms: a tap lights one (it sings); all three alight, and the curtain of vines lifts
//   2. a round stone in a groove: walk into it and it rolls; rolled onto the golden plate, the stone door sinks away
//   3. a sunbeam falls from the roof onto a crystal: a tap turns the crystal and the beam swings to the next thing. On the
//      moon painted on the wall nothing happens; on the bud a flower opens; on the sun-stone the petal door opens
//   4. the nest, and in it the egg. A tap: she takes it, holds it up, and from then on it hops along behind her
import { THREE, paper, slab, card, blob, circlePts, edgeMat, whiteEdge } from './kit.js';
import { EGG } from './quest.js';
import { gift } from './gear.js';

const W = 16.4, D = 4.6;
const COL = { dark: '#3a2f33', floor: '#e6cfb2', floor2: '#d4b894', rock: '#d9b896', rock2: '#e8cdb0', rock3: '#c4a27e', moss: '#9fbf8a', moss2: '#86a86e', vine: '#7fa676', vine2: '#93b071', stone: '#cbbfae', stone2: '#b3a595', gold: '#f2c65c', twig: '#a97a4e' };
const NOTES = [392, 523.3, 659.3];

export default {
  name: 'hol',
  build(S) {
    const root = S.root, P = c => paper(COL[c] || c), { girl, sfx } = S;
    const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
    const at = (x, y, z) => { const [wx, wz] = S.at([x, z]); return [wx, y, wz]; };
    const table = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), P('dark')); table.rotation.x = -Math.PI / 2; table.position.set(0, -.06, 0); root.add(table);
    const behind = new THREE.Mesh(new THREE.PlaneGeometry(60, 18), P('dark')); behind.position.set(0, 7, -D / 2 - 1.8); root.add(behind);
    // the floor: a long room with round corners, its edge a little uneven
    const FLOOR = []; for (let i = 0; i < 72; i++) { const a = i / 72 * 6.283, c = Math.cos(a), sn = Math.sin(a), k = 1 + .02 * Math.cos(a * 11); FLOOR.push([Math.sign(c) * Math.pow(Math.abs(c), .35) * W / 2 * k, Math.sign(sn) * Math.pow(Math.abs(sn), .6) * D / 2 * k]); }
    root.add(slab(FLOOR, 0, .14, P('floor'), P('floor2')));
    for (const [x, z, rx, rz, c] of [[-6.6, -1.4, 1.3, .6, 'moss'], [-2.0, 1.5, 1.1, .5, 'moss2'], [2.9, -1.6, 1.2, .5, 'moss'], [6.4, -.3, 1.5, 1.0, 'moss2'], [.2, -1.7, .8, .4, 'moss']]) root.add(slab(blob(x, z, rx, rz, 900 + Math.round(x * 3), 22, .1), .02, .02, P(c), P(c)));
    // the walls: rows of rock, cut wavy, one behind the other
    const wavy = (w, h, seed, amp) => { const pts = [[-w / 2, 0]]; for (let i = 0; i <= 36; i++) { const x = -w / 2 + i / 36 * w; pts.push([x, h + Math.sin(i * .7 + seed) * amp + Math.sin(i * .31 + seed * 2) * amp * .7]); } pts.push([w / 2, 0]); return pts; };
    [[W + 4, 3.5, 1, .24, 'rock3', -D / 2 - .75], [W + 2.6, 2.7, 2, .22, 'rock', -D / 2 - .4], [W + 1.2, 1.75, 3, .16, 'rock2', -D / 2 - .05]].forEach(([w, h, sd, amp, c, z]) => { const m = card(wavy(w, h, sd, amp), .1, P(c), edgeMat); m.position.set(0, 0, z); root.add(m); });
    for (const s of [-1, 1]) { const m = card(wavy(D + 1.6, 2.4, 5 + s, .2), .1, P('rock'), edgeMat); m.rotation.y = s * (Math.PI / 2 - .3); m.position.set(s * (W / 2 + .5), 0, -.1); root.add(m); }
    S.floor(0, FLOOR.map(([x, z]) => [x * .975, z * .93]));
    root.add(slab(rect(-7.2, D / 2 - .95, -5.8, D / 2 - .45), .02, .02, P('moss2'), whiteEdge));                 // the mat of moss at the way out
    S.door('eihol', [-7.4, D / 2 - .75, -5.6, D / 2 + .3], [-6.9, D / 2 - 1.5], [0, 1], true);

    /* ---------------- little glowing mushrooms and fireflies: the cave's own light ---------------- */
    const glowMat = c => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: .7, roughness: .7 });
    for (const [x, z, r, c] of [[-7.4, -1.7, .1, '#bfe9c9'], [-3.0, -1.9, .12, '#f6e3a0'], [-1.2, -1.95, .09, '#bfe9c9'], [1.0, -1.9, .11, '#f4c6d4'], [5.2, -1.9, .1, '#f6e3a0'], [7.3, -1.2, .12, '#bfe9c9'], [-.6, 1.9, .09, '#f6e3a0'], [3.9, 1.9, .1, '#bfe9c9']]) {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(r * .3, r * .4, r * 1.4, 6), P('#fbf5ea')); st.position.set(x, r * .7, z); root.add(st);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(r, 9, 6, 0, 6.283, 0, Math.PI / 2), glowMat(c)); cap.scale.y = .7; cap.position.set(x, r * 1.4, z); root.add(cap); }
    const flies = new THREE.Group(); flies.userData.live = true; root.add(flies); const flyMat = new THREE.MeshBasicMaterial({ color: '#fff3b0' });
    const bugs = [...Array(11)].map((_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.03, 6, 5), flyMat); flies.add(m); return { m, x: -7 + i * 1.4, y: 1 + (i % 3) * .45, z: -1.2 + (i % 4) * .7, p: i * 1.9 }; });
    const light = S.lamp(0, '#ffd9a0', 9, 1.2);

    /* ---------------- the gates ---------------- */
    const GX = [-3.5, .7, 4.7], walls = GX.map(x => S.wall(x, 0, .26, D / 2 + .2)), open = [0, 0, 0], opened = [false, false, false];
    const unlock = i => { if (opened[i]) return; opened[i] = true; walls[i][2] = 0; sfx.hello(); S.confetti(...at(GX[i], 1.2, 0), ['#f6e3a0', '#bfe9c9', '#fbf5ea'], 16, S.starGeo, 2.2); };
    // 1: a curtain of vines hanging from a root
    const vines = new THREE.Group(); vines.position.set(GX[0], 0, 0); vines.userData.live = true; root.add(vines);
    { const beam = new THREE.Mesh(new THREE.CylinderGeometry(.09, .11, D + .6, 7), P('twig')); beam.rotation.x = Math.PI / 2; beam.position.y = 2.35; beam.castShadow = true; vines.add(beam);
      for (let i = 0; i < 13; i++) { const z = -D / 2 + .25 + i * (D - .5) / 12, h = 2.2 + (i % 3) * .08, hold = new THREE.Group(); hold.position.set((i % 2) * .08 - .04, 2.32, z); const v = card([[-.11, 0], [.11, 0], [.14, -h * .5], [.05, -h], [-.08, -h * .96], [-.15, -h * .45]], .02, paper(i % 2 ? COL.vine : COL.vine2, { side: THREE.DoubleSide })); v.rotation.y = Math.PI / 2; hold.add(v);
        for (let k = 0; k < 3; k++) { const lf = card([[0, 0], [.12, .05], [.2, 0], [.12, -.05]], .012, paper(COL.moss, { side: THREE.DoubleSide })); lf.position.set(0, -.4 - k * .55, (k % 2 ? .12 : -.12)); lf.rotation.y = Math.PI / 2; hold.add(lf); } vines.add(hold); } }
    // 2: a door of stone
    const door = new THREE.Group(); door.position.set(GX[1], 0, 0); door.userData.live = true; root.add(door);
    { const pts = [[-D / 2 - .1, 0]]; for (let i = 0; i <= 14; i++) { const a = Math.PI - i / 14 * Math.PI; pts.push([Math.cos(a) * (D / 2 + .1), 1.5 + Math.sin(a) * .85]); } pts.push([D / 2 + .1, 0]); const m = card(pts, .3, P('stone'), P('stone2')); m.rotation.y = Math.PI / 2; m.position.x = -.15; m.castShadow = true; door.add(m);
      const sw = card(circlePts(.32, 5, 20).map(([x, y], i) => [x * (1 + .12 * Math.cos(i * 1.57)), y * (1 + .12 * Math.cos(i * 1.57))]), .03, P('stone2')); sw.rotation.y = -Math.PI / 2; sw.position.set(-.17, 1.3, 0); door.add(sw); }
    // 3: two big petals
    const petals = [-1, 1].map(s => { const hold = new THREE.Group(); hold.position.set(GX[2], 0, s * (D / 2 + .1)); hold.userData.live = true; root.add(hold); const pts = [[0, 0]]; for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI / 2; pts.push([Math.sin(a) * (D / 2 + .15), 2.5 * Math.cos(a) * (1 - .25 * Math.sin(a * 2)) + (i === 12 ? 0 : 0)]); } pts.push([D / 2 + .15, 0]);
      const m = card(pts.map(([x, y]) => [x, y]), .06, paper(s < 0 ? '#f4a6c4' : '#f8c6d8', { side: THREE.DoubleSide }), paper('#e98f8f')); m.rotation.y = s < 0 ? -Math.PI / 2 : Math.PI / 2; m.castShadow = true; hold.add(m); S.glue(hold); return { hold, s }; });
    const sunMat = new THREE.MeshStandardMaterial({ color: '#e8cdb0', emissive: '#f2c65c', emissiveIntensity: 0, roughness: .8 });
    { const pts = []; for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283, r = i % 2 ? .3 : .44; pts.push([Math.cos(a) * r, Math.sin(a) * r]); } const sun = new THREE.Mesh(new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))), { depth: .06, bevelEnabled: false }), sunMat); sun.rotation.y = -Math.PI / 2; sun.position.set(GX[2] - .32, 2.75, 0); root.add(sun); }
    S.glue(vines); S.glue(door);

    /* ---------------- 1: the three mushrooms ---------------- */
    const shrooms = [[-5.95, -1.3, .34, '#f4a6c4'], [-5.1, -1.55, .42, '#f6e3a0'], [-4.3, -.75, .3, '#bfe9c9']].map(([x, z, r, c], i) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.userData.live = true; root.add(g); const mat = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: .05, roughness: .8 });
      const st = new THREE.Mesh(new THREE.CylinderGeometry(r * .3, r * .4, r * 1.5, 9), P('#fbf5ea')); st.position.y = r * .75; st.castShadow = true; g.add(st);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 8, 0, 6.283, 0, Math.PI / 2), mat); cap.scale.y = .68; cap.position.y = r * 1.5; cap.castShadow = true; g.add(cap);
      for (const [a, e] of [[.5, .55], [2.4, .8], [4.2, .5], [5.4, .95]]) { const d = new THREE.Mesh(new THREE.SphereGeometry(r * .14, 7, 5), P('#fbf7ee')); d.scale.y = .35; d.position.set(Math.cos(a) * Math.sin(e) * r * .92, r * 1.5 + Math.cos(e) * r * .68, Math.sin(a) * Math.sin(e) * r * .92); g.add(d); }
      S.solid({ x, z, r: r * .5 });
      const q = { g, mat, lit: false, squash: 0, t: 0 };
      S.tap(g, () => { q.squash = 1; q.t = 0; sfx.note(NOTES[i]); if (!q.lit) { q.lit = true; S.confetti(...at(x, r * 2, z), [c, '#fbf7ee'], 8, S.starGeo, 1.8); if (shrooms.every(o => o.lit)) unlock(0); } });
      return q; });

    /* ---------------- 2: the stone in its groove, and the plate ---------------- */
    const GZ = .55, X0 = -2.6, X1 = -.25, R = .4;
    root.add(slab(rect(X0 - .5, GZ - .3, X1 + .5, GZ + .3), .012, .012, P('floor2'), P('floor2')));
    const plate = new THREE.Group(); plate.position.set(X1, 0, GZ); plate.userData.live = true; root.add(plate); { const p = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .06, 20), P('gold')); p.position.y = .045; plate.add(p); const q = new THREE.Mesh(new THREE.CylinderGeometry(.36, .36, .07, 20), P('stone')); q.position.y = .045; plate.add(q); S.glue(plate); }
    const stone = new THREE.Group(); stone.userData.live = true; root.add(stone); { const b = new THREE.Mesh(new THREE.SphereGeometry(R, 14, 10), P('stone')); b.castShadow = true; stone.add(b); for (const [a, e] of [[.6, 1.0], [2.6, 1.8], [4.4, .8]]) { const d = new THREE.Mesh(new THREE.SphereGeometry(.09, 6, 5), P('moss')); d.scale.z = .3; d.position.set(Math.cos(a) * Math.sin(e) * R, Math.cos(e) * R, Math.sin(a) * Math.sin(e) * R); d.lookAt(0, 0, 0); stone.add(d); } S.glue(stone); }
    let sx = X0, rolled = 0, onPlate = false; const sWall = S.wall(sx, GZ, R, R), [gwx, gwz] = S.at([0, GZ]), wx0 = S.at([0, 0])[0];

    /* ---------------- 3: the sunbeam and the crystal ---------------- */
    const CX = 2.5, CZ = -.55, CY = 1.0, TARGETS = [[1.3, 1.75, -D / 2 + .1], [3.5, .12, 1.3], [GX[2] - .35, 2.75, 0]];
    const stand = new THREE.Group(); stand.position.set(CX, 0, CZ); root.add(stand); { const ped = new THREE.Mesh(new THREE.CylinderGeometry(.24, .34, .72, 10), P('stone')); ped.position.y = .36; ped.castShadow = true; stand.add(ped); S.solid({ x: CX, z: CZ, r: .34 }); }
    const lightM = new THREE.MeshBasicMaterial({ color: '#fff3c4', transparent: true, opacity: .26, depthWrite: false, side: THREE.DoubleSide });
    { const fall = new THREE.Mesh(new THREE.CylinderGeometry(.14, .3, 4.2, 12, 1, true), lightM); fall.position.set(CX, CY + 2.1, CZ); fall.userData.live = true; root.add(fall); }
    const crystal = new THREE.Group(); crystal.position.set(CX, CY, CZ); crystal.userData.live = true; root.add(crystal); { const mat = new THREE.MeshStandardMaterial({ color: '#cfeaf0', emissive: '#fff3c4', emissiveIntensity: .6, roughness: .3, flatShading: true }); const up = new THREE.Mesh(new THREE.ConeGeometry(.2, .36, 6), mat); up.position.y = .18; crystal.add(up); const dn = new THREE.Mesh(new THREE.ConeGeometry(.2, .28, 6), mat); dn.rotation.x = Math.PI; dn.position.y = -.14; crystal.add(dn); }
    const beam = new THREE.Group(); beam.position.set(CX, CY, CZ); beam.userData.live = true; root.add(beam); { const m = new THREE.Mesh(new THREE.CylinderGeometry(.16, .05, 1, 10, 1, true), lightM); m.rotation.x = Math.PI / 2; m.position.z = .5; beam.add(m); }
    const aim = i => { const [tx, ty, tz] = TARGETS[i], o = new THREE.Object3D(); o.position.copy(beam.position); root.add(o); o.lookAt(...at(tx, ty, tz)); root.remove(o); return { q: o.quaternion.clone(), len: Math.hypot(tx - CX, ty - CY, tz - CZ) }; };
    let dir = 0, turns = 0, turnT = 1, fromQ = null, bloom = 0, bud = null, aims = null;
    // the moon on the back wall; the bud on the floor
    { const moon = card(circlePts(.34, 8, 22), .03, P('#f6efe2')); moon.position.set(TARGETS[0][0], TARGETS[0][1], -D / 2 + .08); root.add(moon); const bite = card(circlePts(.27, 9, 20), .035, P('rock2')); bite.position.set(TARGETS[0][0] + .16, TARGETS[0][1] + .08, -D / 2 + .09); root.add(bite); }
    { bud = new THREE.Group(); bud.position.set(TARGETS[1][0], 0, TARGETS[1][2]); bud.userData.live = true; root.add(bud); const st = new THREE.Mesh(new THREE.CylinderGeometry(.02, .025, .22, 5), P('moss2')); st.position.y = .11; bud.add(st);
      bud.petals = [...Array(6)].map((_, i) => { const hold = new THREE.Group(); hold.position.y = .22; hold.rotation.y = i / 6 * 6.283; const pt = card([[0, 0], [.07, .1], [0, .26], [-.07, .1]], .012, paper(i % 2 ? '#f4a6c4' : '#f8dde4', { side: THREE.DoubleSide })); hold.add(pt); bud.add(hold); return pt; }); }
    const turn = () => { if (turnT < 1) return; fromQ = beam.quaternion.clone(); dir = (dir + 1) % 3; turns++; turnT = 0; sfx.click(); };
    S.tap(crystal, turn); S.tap(stand, turn);

    /* ---------------- 4: the nest and the egg ---------------- */
    const NX = 6.5, NZ = -.25;
    { const nest = new THREE.Group(); nest.position.set(NX, 0, NZ); root.add(nest); const base = new THREE.Mesh(new THREE.CylinderGeometry(.62, .7, .16, 16), P('moss2')); base.position.y = .08; nest.add(base);
      for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, t = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .5, 5), P(i % 2 ? 'twig' : '#8d6a48')); t.position.set(Math.cos(a) * .6, .2, Math.sin(a) * .6); t.rotation.set(Math.PI / 2, 0, a + .5); nest.add(t); } }
    const nestEgg = S.figure('nestei', EGG), [nwx, nwz] = S.at([NX, NZ]), present = gift(S, 'eicadeau', EGG); nestEgg.x = nwx; nestEgg.z = nwz + .05; nestEgg.floatY = nestEgg.y = .17; let taking = false, glowT = 0;
    nestEgg.act = tick => { nestEgg.setFrame(0); nestEgg.tilt = Math.sin(tick * .5) * .05; };
    nestEgg.onTap = () => { if (S.playing() || taking || S.quest.stage !== 'zoek') return; taking = true; S.walkThen(nwx - 1.0, nwz + .35, () => { nestEgg.g.visible = false; present([nwx, .5, nwz], () => { S.findEgg(nwx - .2, nwz + .5); taking = false; }); }, 1.3); };

    const openAll = () => { for (const q of shrooms) q.lit = true; for (let i = 0; i < 3; i++) { opened[i] = true; walls[i][2] = 0; } sx = X1; onPlate = true; dir = 2; turnT = 1; };
    return {
      start: [-6.9, D / 2 - 1.5], uni: [-6.1, D / 2 - 1.4],
      shadow: { follow: 20 },
      step({ dt, time, eve }) {
        if (!(dt > 0)) return;
        if (S.quest.stage !== 'zoek' && S.quest.stage !== 'dream') { nestEgg.g.visible = false; if (!opened[2]) openAll(); }
        light.position.set(girl.x, 2.3, S.at([0, .6])[1]); light.intensity += (1.5 + (eve || 0) * 1.3 - light.intensity) * Math.min(1, dt * 4);
        for (const b of bugs) b.m.position.set(b.x + Math.sin(time * .5 + b.p) * .7, b.y + Math.sin(time * .8 + b.p * 2) * .25, b.z + Math.cos(time * .4 + b.p) * .5);
        // 1
        for (const q of shrooms) { q.mat.emissiveIntensity += ((q.lit ? .95 : .05) - q.mat.emissiveIntensity) * Math.min(1, dt * 5); if (q.squash > .01) { q.t += dt; q.squash *= Math.exp(-dt * 5); const k = Math.sin(q.t * 20) * q.squash; q.g.scale.set(1 + k * .12, 1 - k * .2, 1 + k * .12); } else q.g.scale.set(1, 1, 1); }
        // 2: she walks into the stone and it rolls, along its groove only
        if (!onPlate && !S.playing()) { const p = S.pushing(), lx = girl.x - wx0, near = Math.abs(girl.z - gwz) < .6;
          const push = near && p[0] > .5 && lx > sx - R - .5 && lx < sx - R + .12 ? 1 : near && p[0] < -.5 && lx < sx + R + .5 && lx > sx + R - .12 ? -1 : 0;
          if (push) { const nx = Math.max(X0, Math.min(X1, sx + push * 1.25 * dt)); rolled += nx - sx; if (Math.floor(Math.abs(rolled) / .6) !== Math.floor(Math.abs(rolled - (nx - sx)) / .6)) sfx.thud(); sx = nx; if (sx >= X1 - .01) { onPlate = true; sfx.click(); unlock(1); } } }
        sWall[0] = wx0 + sx; stone.position.set(sx, R + (onPlate ? -.02 : 0), GZ); stone.rotation.z = -sx / R; plate.position.y += ((onPlate ? -.03 : 0) - plate.position.y) * Math.min(1, dt * 8);
        // 3
        if (!aims) aims = [0, 1, 2].map(aim);
        if (turnT < 1) { turnT = Math.min(1, turnT + dt / .55); const e = turnT * turnT * (3 - 2 * turnT); beam.quaternion.copy(fromQ).slerp(aims[dir].q, e); crystal.rotation.y += dt * 6; if (turnT >= 1) { if (dir === 2) unlock(2); else if (dir === 1) sfx.hop(); } }
        else beam.quaternion.copy(aims[dir].q);
        beam.scale.set(1, 1, aims[dir].len); bloom += ((dir === 1 && turnT >= 1 ? 1 : 0) - bloom) * Math.min(1, dt * 3); bud.petals.forEach(pt => { pt.rotation.x = .15 + bloom * 1.0; });
        sunMat.emissiveIntensity += ((dir === 2 && turnT >= 1 ? 1.1 : 0) - sunMat.emissiveIntensity) * Math.min(1, dt * 4);
        // the gates
        for (let i = 0; i < 3; i++) open[i] += ((opened[i] ? 1 : 0) - open[i]) * Math.min(1, dt * 3.5);
        vines.position.y = open[0] * 2.3; door.position.y = -open[1] * 2.6; for (const { hold, s } of petals) hold.rotation.y = s * open[2] * 1.45;
        // the egg glows a little in its nest
        glowT += dt;
      },
      toys: { hol: { openGate: openAll, state: () => ({ lit: shrooms.map(q => q.lit), stone: sx, onPlate, dir, turns, opened: [...opened], egg: nestEgg.g.visible, taking }) } },
      shots: [{ name: 'hol', span: 10.5, tall: 6.6, rise: .36, riseTall: .5 }],
      spots: { uit: [-6.5, .03, D / 2 - .7], zwam0: [-5.95, .5, -1.3], zwam1: [-5.1, .62, -1.55], zwam2: [-4.3, .45, -.75], kristal2: [CX, CY + .12, CZ], nest: [NX, .4, NZ] },
      places: { start: [-6.9, D / 2 - 1.5], one: [-5.2, .2], two: [-1.5, -.6], three: [2.6, .9], nest: [5.7, .4] },
    };
  },
};
