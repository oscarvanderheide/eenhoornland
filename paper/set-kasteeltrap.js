// The castle's tower stair (Oscar: "a door to a stairway. maybe circular stairs ... with a camera movement we should get a
// sense of scale that we are really going to climb up some tower. then everytime we go up a part we need to do some puzzle.
// maybe it gives us a key to open a gate"). A round tower cut open at the front like a doll's house, a spiral of stone
// steps round an open well, four turns high, the magic at the top (set-kasteeltoren.js).
//   in          through the door at the back of the treasure room. The camera looks up the whole tower to its top, and
//               comes down to her again. Her unicorn waits at the bottom (it is too big for the stair: nothing in the way)
//   the steps   round and up. Only the steps near her are floor (paper.js floorAt, `band`): the turns stand over each other
//   gates       a portcullis at the start of each turn above the first. Each landing has a little puzzle; it gives a key
//     1 paintings   three crooked pictures: a tap turns one a quarter; all straight and a key falls out behind them
//     2 kitten      the castle kitten hides behind the vase, the chest or the plant; found three times, it brings the key
//     3 shapes      the gate's lock is a board with a star, a heart and a moon cut out; she carries each shape to its hole
//               the key flies into the lock, turns, the gate rattles up, and the camera looks up the next turn
//   the top     a door in the wall: out onto the tower's top, under the night sky
import { THREE, paper, slab, card, PAPER } from './kit.js';
import { cutout, FIGS } from './figures.js';
import { ANIMALS2 } from './animals2.js';
import { CARDS3 } from './cards3.js';

const RW = 2.75, RI = .8, RO = 2.5, RL = 2.68, TURN = 3, PER = 11, RISE = TURN / (PER + 1), TURNS = 4, TOP = TURN * TURNS, BAND = 1.5;
const A0 = -Math.PI * .75, A1 = -Math.PI * .25, STEP = Math.PI * 1.5 / PER;   // (the landings: at the back, from A0 to A1; the steps go on from A1, round by the right, the front and the left)
const GOLD = '#e3b04b', GOLD2 = '#c9a46a';
const deg = d => d * Math.PI / 180;
const pol = (r, a) => [Math.cos(a) * r, Math.sin(a) * r];
const wedge = (a0, a1, r0, r1, n = 5) => { const p = []; for (let i = 0; i <= n; i++) p.push(pol(r1, a0 + (a1 - a0) * i / n)); for (let i = n; i >= 0; i--) p.push(pol(r0, a0 + (a1 - a0) * i / n)); return p; };
const facing = a => Math.atan2(-Math.cos(a), -Math.sin(a));   // a card on the round wall at angle a, turned to look into the tower
const tex = spec => { const t = new THREE.CanvasTexture(cutout(spec.w, spec.h, c => spec.draw(c, 0), PAPER, 1)); t.colorSpace = THREE.SRGBColorSpace; return t; };
const SHAPES = {
  ster: r => Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * .45 : r; return [Math.cos(a) * q, -Math.sin(a) * q]; }),
  hart: r => Array.from({ length: 28 }, (_, i) => { const a = i / 28 * Math.PI * 2; return [r * .06 * 16 * Math.sin(a) ** 3, r * .06 * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) + r * .1]; }),
  maan: r => { const out = []; for (let i = 0; i <= 16; i++) { const a = Math.PI * .25 + i / 16 * Math.PI * 1.5; out.push([Math.cos(a) * r, Math.sin(a) * r]); } for (let i = 16; i >= 0; i--) { const a = Math.PI * .4 + i / 16 * Math.PI * 1.2; out.push([Math.cos(a) * r * .72 - r * .32, Math.sin(a) * r * .72]); } return out; },
};
const SHAPECOL = { ster: '#f4a6c4', hart: '#e8505b', maan: '#f2c65c' };
const KINDS = ['ster', 'hart', 'maan'];

export default {
  name: 'kasteeltrap',
  build(S) {
    const { girl, uni, sfx } = S, root = S.root, P = c => paper(c), had = k => S.coins.had(k), mark = k => S.coins.had(k, true);
    const put = (m, x, y, z, to = root) => { m.position.set(x, y, z); to.add(m); return m; };
    const box = (w, h, d, c) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), P(c)); m.castShadow = m.receiveShadow = true; return m; };
    const local = () => { const [ox, oz] = S.at([0, 0]); return [girl.x - ox, girl.z - oz]; };

    /* ---------------- the tower: the dark it stands in, the round wall at the back, the floor at the bottom ---------------- */
    const table = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), P('#2e2635')); table.rotation.x = -Math.PI / 2; table.position.y = -.06; root.add(table);
    put(new THREE.Mesh(new THREE.PlaneGeometry(40, 40), P('#2e2635')), 0, 10, -RW - 1.2);
    const WALL_H = TOP + 2.2;
    { const wall = new THREE.Mesh(new THREE.CylinderGeometry(RW + .08, RW + .08, WALL_H, 48, 1, true, Math.PI / 2 - .3, Math.PI + .6), paper('#d7cfdc', { side: THREE.DoubleSide })); wall.position.y = WALL_H / 2; wall.receiveShadow = true; root.add(wall);
      for (const a of [Math.PI / 2 - .3, Math.PI * 1.5 + .3]) { const e = box(.2, WALL_H, .3, '#b9aec4'); e.position.set(Math.sin(a) * (RW + .1), WALL_H / 2, Math.cos(a) * (RW + .1)); e.rotation.y = a; root.add(e); }   // (the cut edges of the wall: its thickness shows)
      // stones: a few lighter and darker blocks on the wall, row by row
      for (let r = 0; r < WALL_H / .55; r++) for (let i = 0; i < 7; i++) { if ((r * 7 + i) % 3) continue; const a = deg(-172 + i * 27 + (r % 2) * 13), y = .3 + r * .55; const st = card([[-.26, -.12], [.26, -.12], [.26, .12], [-.26, .12]], .02, P((r + i) % 2 ? '#cbc2d1' : '#e0d9e4')); st.rotation.y = facing(a); put(st, ...[pol(RW, a)].map(([x, z]) => [x, y, z])[0]); } }
    // the bottom: a round floor, and a doorstep at the front where she comes in
    root.add(slab([...Array(40)].map((_, i) => pol(RL + .05, i / 40 * Math.PI * 2)), 0, .12, P('#cdbfae'), P('#a8957f')));
    root.add(slab([[-1.7, 2.2], [1.7, 2.2], [1.7, 3.7], [-1.7, 3.7]], 0, .12, P('#cdbfae'), P('#a8957f')));
    root.add(slab([[-.5, 3.0], [.5, 3.0], [.5, 3.6], [-.5, 3.6]], .015, .01, P('#d9534f'), P('#d9534f')));   // (the red mat: the way out)

    /* ---------------- the steps and the landings ---------------- */
    const pieces = [];
    for (let k = 0; k < TURNS; k++) for (let i = 1; i <= PER; i++) pieces.push({ k, i, idx: k * 12 + i, h: k * TURN + i * RISE, a0: A1 + (i - 1) * STEP, a1: A1 + i * STEP, r1: RO });
    for (let k = 1; k <= TURNS; k++) pieces.push({ k, i: 0, idx: k * 12, h: k * TURN, a0: A0, a1: A1, r1: RL, landing: true });
    for (const p of pieces) {
      const g = new THREE.Group(); g.userData.live = true; root.add(g); p.g = g;
      const top = p.landing ? P('#c9b39a') : P(p.i % 2 ? '#ddd5e0' : '#cfc6d6');
      g.add(slab(wedge(p.a0, p.a1, RI, p.r1, p.landing ? 10 : 4), p.h, p.landing ? .3 : .22, top, P(p.landing ? '#9d8670' : '#a99fb2')));
      if (p.landing) g.add(slab(wedge(p.a0 + .12, p.a1 - .12, RI + .3, p.r1 - .3, 10), p.h + .012, .01, P(['#9a5fb0', '#5f86b0', '#e98f8f', '#9ed9a0'][p.k - 1]), P('#fbf5ea')));   // (a rug on each landing, its own colour)
      p.f = S.floor(p.h, wedge(p.a0 - .004, p.a1 + .004, RI - .2, p.r1, 4), 0, BAND);   // (the floor reaches a little further in than the step shows: a wobble on the inner edge must not drop her off it)
      const [cx, cz] = pol((RI + p.r1) / 2, (p.a0 + p.a1) / 2); p.c = [cx, cz]; p.front = cz > .3;
      S.tap(g, hit => walkTo(p, hit), p.landing ? 'overloop' + p.k : null);
    }
    S.floor(null, [...Array(24)].map((_, i) => pol(1.0, i / 24 * Math.PI * 2)));   // (the middle at the bottom is a basin of water: at the bottom too she goes round, never across under the open well, where the steps' inner edges are)
    S.floor(0, [...Array(40)].map((_, i) => pol(RL, i / 40 * Math.PI * 2)));
    { const rim = new THREE.Mesh(new THREE.CylinderGeometry(.74, .78, .32, 24), P('#bdb6c9')); rim.position.y = .16; rim.castShadow = rim.receiveShadow = true; root.add(rim);
      const water = new THREE.Mesh(new THREE.CircleGeometry(.62, 24), P('#8fc3e0')); water.rotation.x = -Math.PI / 2; water.position.y = .3; root.add(water);
      for (let i = 0; i < 3; i++) { const l = new THREE.Mesh(new THREE.CircleGeometry(.1, 10), P('#9ed9a0')); l.rotation.x = -Math.PI / 2; l.position.set(Math.cos(i * 2.1) * .32, .31, Math.sin(i * 2.1) * .32); root.add(l); } }   // (a few lily pads on it)
    S.floor(0, [[-1.7, 2.2], [1.7, 2.2], [1.7, 3.75], [-1.7, 3.75]]);
    /** a tap on a step or a landing: she goes there, or (when it is far up or down) as far as the stair goes towards it */
    /** a tap on a step or a landing: she goes there by the stair itself, step by step along their middles (and at the bottom
     *  round the floor to the first step), never by a short cut the finding of ways might take across the open well. Not past
     *  a gate that is down; and as far as the next landing up or down at a time */
    const byIdx = i => pieces.find(o => o.idx === i), GROUND_IN = A1 - .14;
    function walkTo(p, hit) {
      if (S.playing()) return;
      const cur = Math.round(girl.y / RISE), shut = gates.find(g => g.lift < .6 && g.k * 12 >= cur - 1), [lx, lz] = local();
      const want = Math.max(Math.floor((cur - 1) / 12) * 12, Math.min(Math.ceil((cur + 1) / 12) * 12, p.idx, shut ? shut.k * 12 : 99));
      const way = [];
      if (cur === 0 && want > 0) {   // at the bottom: round the floor (the way the low steps leave free) to the foot of the stair
        let a = Math.atan2(lz, lx); const to = GROUND_IN + Math.PI * 2 * Math.ceil((a - GROUND_IN) / (Math.PI * 2) + .001);
        for (a += .45; a < to; a += .45) way.push(pol(1.8, a)); way.push(pol(1.8, GROUND_IN)); }
      for (let i = cur + Math.sign(want - cur); want !== cur && i !== want + Math.sign(want - cur); i += Math.sign(want - cur)) { const q = byIdx(i); if (q) way.push(q.landing ? pol(1.75, (q.a0 + q.a1) / 2) : q.c); else if (i === 0) way.push(pol(1.8, GROUND_IN)); }
      if (want === p.idx && hit && hit.point && (p.idx > 0 || cur > 0)) { const [ox, oz] = S.at([0, 0]); let x = hit.point.x - ox, z = hit.point.z - oz;   // (the last bit: where the finger was, but inside that step)
        const mid = (p.a0 + p.a1) / 2, half = (p.a1 - p.a0) / 2 - .04, d = Math.max(-half, Math.min(half, Math.atan2(Math.sin(Math.atan2(z, x) - mid), Math.cos(Math.atan2(z, x) - mid)))), r = Math.max(1.2, Math.min(p.r1 - .25, Math.hypot(x, z)));
        if (way.length) way[way.length - 1] = pol(r, mid + d); else way.push(pol(r, mid + d)); }
      if (!way.length) return;
      const go = k => { if (k >= way.length) return; S.walkThen(...S.at(way[k]), () => go(k + 1), .3); };
      go(0);
    }
    // the windows: painted views that climb from the hills to the clouds to the evening
    const VIEWS = [['#bfe3ea', '#9ed9a0'], ['#bfe3ea', '#fbf5ea'], ['#cbd3ef', '#fbf5ea'], ['#e8c6d8', '#f8dde4'], ['#8f8fc7', '#f6e7b8']];
    for (let k = 0; k <= TURNS; k++) for (const a of [deg(-158), deg(-22)]) { if (k === TURNS && a < -1) continue; const y = k * TURN + 1.75, w = new THREE.Group(); w.rotation.y = facing(a); put(w, ...[pol(RW - .03, a)].map(([x, z]) => [x, y, z])[0]);
      const arch = (r, h) => [[-r, -h], [r, -h], [r, h * .35], ...Array.from({ length: 9 }, (_, i) => { const t = i / 8 * Math.PI; return [Math.cos(t) * r, h * .35 + Math.sin(t) * r]; }), [-r, h * .35]];
      w.add(card(arch(.34, .45), .03, P(GOLD2))); const v = card(arch(.27, .38), .02, P(VIEWS[k][0])); v.position.z = .02; w.add(v);
      const [sky, thing] = VIEWS[k];   // what shows through: a green hill down low, clouds higher up, the moon at the top
      if (k === 0) { const hill = card([[-.27, -.38], [.27, -.38], [.27, -.18], [.1, -.08], [-.12, -.12], [-.27, -.2]], .01, P(thing)); hill.position.z = .035; w.add(hill); }
      else if (k < 4) { const cl = new THREE.Mesh(new THREE.CircleGeometry(.11, 14), P(thing)); cl.scale.x = 1.7; cl.position.set((k % 2 ? -.06 : .07), .02, .035); w.add(cl); }
      else { const m = new THREE.Mesh(new THREE.CircleGeometry(.1, 16), new THREE.MeshBasicMaterial({ color: thing })); m.position.set(.05, .1, .035); w.add(m); } }
    // torches by each landing
    const flame = new THREE.MeshStandardMaterial({ color: '#ffd98a', emissive: '#ffb84d', emissiveIntensity: 1.4, roughness: .8 }), flames = [];
    for (let k = 0; k <= TURNS; k++) { const a = deg(-104), [x, z] = pol(RW - .1, a), y = k * TURN + 1.45; const st = box(.06, .3, .06, '#7a5a3e'); put(st, x, y, z); const f = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), flame); f.scale.y = 1.6; put(f, x, y + .24, z); f.userData.live = true; flames.push(f); }

    /* ---------------- the gates: a portcullis at the start of turns 1, 2, 3 ---------------- */
    const gates = [1, 2, 3].map(k => {
      const g = new THREE.Group(); g.userData.live = true; g.rotation.y = -A1; g.position.y = k * TURN; root.add(g);
      for (let x = RI + .12; x < RO; x += .21) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1.35, 6), P('#5d5468')); b.position.set(x, .68, 0); b.castShadow = true; g.add(b); const tip = new THREE.Mesh(new THREE.ConeGeometry(.05, .12, 6), P('#5d5468')); tip.rotation.x = Math.PI; tip.position.set(x, -.02, 0); g.add(tip); }   // (low bars: drawn up, the gate stays under the landing above)
      for (const y of [.4, .95, 1.32]) { const b = box(RO - RI, .06, .06, '#5d5468'); b.position.set((RI + RO) / 2, y, 0); g.add(b); }
      const mid = (RI + RO) / 2, plate = new THREE.Group(); plate.position.set(mid, .95, 0); g.add(plate);
      if (k < 3) { plate.add(card([[-.24, -.3], [.24, -.3], [.24, .2], [0, .32], [-.24, .2]], .07, P(GOLD), P(GOLD2))); const hole = card([[-.04, -.18], [.04, -.18], [.04, -.02], [.08, .04], [.04, .1], [-.04, .1], [-.08, .04], [-.04, -.02]], .08, P('#3a2f3a')); hole.position.z = 0; plate.add(hole); }
      else { plate.add(card([[-.78, -.26], [.78, -.26], [.78, .26], [-.78, .26]], .06, P('#c79a66'), P('#9a6e47'), KINDS.map((s, j) => SHAPES[s](.17).map(([x, y]) => [x + (j - 1) * .5, y]).reverse()))); }
      const first = pieces.find(p => p.k === k && p.i === 1); first.f.off = true;
      return { k, g, plate, first, open: 0, lift: 0, keyIn: false }; });
    const gateOpen = k => had('poort-' + k);
    const lockAt = gate => { const mid = (RI + RO) / 2, [x, z] = pol(mid, A1); return [x, gate.k * TURN + .95, z]; };

    /* ---------------- a key: from where it is found, through the air into its gate's lock; it turns, the gate goes up ---------------- */
    const keyMat = new THREE.MeshStandardMaterial({ color: '#f2c65c', emissive: '#e3b04b', emissiveIntensity: .5, roughness: .5 });
    const makeKey = () => { const g = new THREE.Group(); const ring = new THREE.Mesh(new THREE.TorusGeometry(.1, .03, 8, 18), keyMat); ring.position.x = -.2; g.add(ring); const shaft = new THREE.Mesh(new THREE.BoxGeometry(.32, .05, .04), keyMat); g.add(shaft); for (const [x, h] of [[.1, .09], [.15, .06]]) { const t = new THREE.Mesh(new THREE.BoxGeometry(.035, h, .04), keyMat); t.position.set(x, -h / 2, 0); g.add(t); } g.castShadow = true; g.userData.live = true; root.add(g); return g; };
    const keys = [];
    const sendKey = (gate, from) => { if (gate.keyIn || gateOpen(gate.k)) return; gate.keyIn = true; keys.push({ gate, g: makeKey(), from, to: lockAt(gate), t: 0 }); sfx.chime(); };
    let lookingUp = null;
    const lookUp = gate => {   // the gate is up: the camera looks up the turn it opens, then gives the picture back
      const t0 = { t: 0 }, base = gate.k * TURN; const toy = { look: S.at([0, 0]), rate: 2.2, shot: { fy: 0, ly: base + 1.2, span: 9, tall: 9, rise: .12, riseTall: .2, fx: 0, fz: 0, lag: 1, dof: .15, range: 6 },
        step(dt, inp) { t0.t += dt; toy.shot.ly = base + 1.2 + Math.min(1, t0.t / 1.4) * 2.4; if (t0.t > 2.6 || (t0.t > .6 && (inp.x || inp.y || inp.act))) { S.stopPlay(); lookingUp = null; } } };
      if (!S.playing()) { S.play(toy); lookingUp = toy; } };

    /* ---------------- landing 1: the crooked paintings ---------------- */
    const H1 = TURN, PICS = [FIGS.grown, ANIMALS2.draakje, ANIMALS2.pauw], PA = [deg(-116), deg(-90), deg(-64)];
    const paints = PICS.map((spec, i) => {
      const a = PA[i], [x, z] = pol(RW - .07, a), outer = new THREE.Group(); outer.rotation.y = facing(a); put(outer, x, H1 + 1.85, z);
      const g = new THREE.Group(); g.userData.live = true; outer.add(g);
      g.add(card([[-.4, -.4], [.4, -.4], [.4, .4], [-.4, .4]], .05, P(GOLD2), P(GOLD2), [[[-.32, -.32], [-.32, .32], [.32, .32], [.32, -.32]]]));
      const k = Math.min(.62 / spec.w, .62 / spec.h), pic = new THREE.Mesh(new THREE.PlaneGeometry(spec.w * k, spec.h * k), new THREE.MeshStandardMaterial({ map: tex(spec), alphaTest: .5, roughness: .95 }));
      const bg = new THREE.Mesh(new THREE.PlaneGeometry(.64, .64), P(['#cfe8ee', '#f6e3c8', '#e2f0d8'][i])); bg.position.z = .01; g.add(bg); pic.position.z = .02; g.add(pic);
      const q = { g, a, q: [1, 2, 3][i], rot: [1, 2, 3][i], turns: 0 }; g.rotation.z = -q.rot * Math.PI / 2;
      S.tap(g, () => { if (paintsDone || S.playing()) return; if (Math.abs(girl.y - H1) > .5) { walkTo(pieces.find(p => p.idx === 12), null); return; } S.walkThen(...S.at(pol(1.7, a)), () => { }, 3); q.q++; q.turns++; sfx.click(); }, 'trap-schilderij' + i);
      return q; });
    let paintsDone = false;

    /* ---------------- landing 2: the kitten hiding ---------------- */
    const H2 = TURN * 2, HA = [deg(-130), deg(-108), deg(-86)], HIDES = ['vaas', 'kist', 'plant'];   // (away from the gate: the next turn's first steps, beside it, would stand in front of a hiding place there)
    const hideG = HIDES.map((kind, i) => { const [x, z] = pol(2.2, HA[i]), g = new THREE.Group(); g.position.set(x, H2, z); g.rotation.y = facing(HA[i]); g.userData.live = true; root.add(g);
      if (kind === 'vaas') { const v = new THREE.Mesh(new THREE.LatheGeometry([[.05, 0], [.26, .09], [.33, .4], [.26, .72], [.16, .85], [.21, .94]].map(([a, b]) => new THREE.Vector2(a, b)), 18), P('#8fc3e0')); v.castShadow = true; g.add(v); const band = new THREE.Mesh(new THREE.TorusGeometry(.32, .03, 6, 18), P('#fbf5ea')); band.rotation.x = Math.PI / 2; band.position.y = .4; g.add(band); }
      if (kind === 'kist') { const c = box(.7, .4, .44, '#b9875a'); c.position.y = .2; g.add(c); const l = box(.74, .11, .48, '#9a6e47'); l.position.y = .45; g.add(l); for (const s of [-.24, .24]) { const b2 = box(.05, .54, .5, GOLD); b2.position.set(s, .27, 0); g.add(b2); } }
      if (kind === 'plant') { const pot = new THREE.Mesh(new THREE.CylinderGeometry(.22, .16, .36, 12), P('#d9706c')); pot.position.y = .18; pot.castShadow = true; g.add(pot); for (const [dx, dy, r] of [[0, .68, .29], [-.18, .55, .22], [.18, .57, .24], [0, .9, .2]]) { const b2 = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), P('#7fa676')); b2.position.set(dx, dy, 0); b2.castShadow = true; g.add(b2); } }
      return g; });
    const kit = S.figure('trap-poes', CARDS3.poes), tail = S.figure('trap-staart', CARDS3.staart); kit.g.visible = false; tail.thing = true; kit.floatY = kit.y = H2; tail.floatY = tail.y = H2;
    let hideAt = 0, found = 0, kitOut = -1, kitDone = false;
    const TOPS = [.8, .42, .95], placeTail = () => { const [x, z] = pol(2.42, HA[hideAt] + .05); [tail.x, tail.z] = S.at([x, z]); tail.floatY = tail.y = H2 + TOPS[hideAt] - .12; tail.face = 1; };   // (its tail sticks up out of the top of the one it hides behind: never between two)
    kit.act = () => kit.setFrame(kitOut >= 0 && kitOut < 1.2 ? 1 : 0); tail.act = tick => tail.setFrame(Math.floor(tick / 6) % 2);
    const findKit = () => { if (kitOut >= 0 || kitDone || S.playing()) return; if (Math.abs(girl.y - H2) > .5) { walkTo(pieces.find(p => p.idx === 24), null); return; }
      const a = HA[hideAt]; S.walkThen(...S.at(pol(1.45, a)), () => { if (kitOut >= 0) return; found++; kitOut = 0; tail.g.visible = false; kit.g.visible = true; [kit.x, kit.z] = S.at(pol(1.85, a + .12)); kit.hopV = 3; sfx.meow(); S.confetti(kit.x, H2 + .6, kit.z, ['#f2b56b', '#fbf5ea', '#f4a6c4'], 10, S.starGeo, 1.8); }, .6); };
    hideG.forEach((g, i) => S.tap(g, () => { if (i === hideAt) findKit(); else { g.userData.wob = 1; sfx.peep(); } }, 'trap-' + HIDES[i]));
    tail.onTap = findKit;

    /* ---------------- landing 3: the shapes for the lock ---------------- */
    const H3 = TURN * 3, BLOCK_AT = [pol(2.15, deg(-128)), pol(1.3, deg(-112)), pol(2.2, deg(-100))];   // (away from the gate: where she stands to put one in must not be in front of the next)
    const blocks = KINDS.map((k, i) => { const g = new THREE.Group(); g.userData.live = true; root.add(g);
      const m = card(SHAPES[k](.22), .12, P(SHAPECOL[k]), P('#fbf5ea')); m.position.y = .24; m.castShadow = true; g.add(m);
      return { k, g, at: [...BLOCK_AT[i]], held: false, on: false, wob: 0 }; });
    let holding = null; const me = {};
    const dropBlock = () => { if (!holding) return; const b = holding; holding = null; b.held = false; girl.poseName = null; const [x, z] = local(); b.at = [x + girl.face * .35, z + .12]; };
    blocks.forEach((b, i) => S.tap(b.g, () => { if (b.on || holding === b || S.playing()) return; if (Math.abs(girl.y - H3) > .5) { walkTo(pieces.find(p => p.idx === 36), null); return; }
      const ba = Math.atan2(b.at[1], b.at[0]), br = Math.hypot(b.at[0], b.at[1]); S.walkThen(...S.at(pol(Math.max(1.15, br - .5), Math.max(A0 + .1, Math.min(A1 - .1, ba)))), () => { if (holding) { dropBlock(); S.hands.free(me); } S.hands.take(me, dropBlock); holding = b; b.held = true; sfx.hop(); }, .7); }, 'vorm' + i));   // (she goes to it from the landing's side, never from the step below)
    // the lock: a tap on the gate with a shape in her hands, and the shape goes into its own hole (the three holes are too close
    // together, seen along the gate, to be tapped one by one)
    const holeAt = j => { const r = (RI + RO) / 2 + (j - 1) * .5, [x, z] = pol(r, A1); return [x, H3 + .95, z]; };
    S.tap(gates[2].g, () => { if (!holding || S.playing()) { if (!holding && !gateOpen(3)) { gates[2].g.userData.wob = 1; sfx.peep(); } return; } const [sx, sz] = pol(1.75, A1 - .3);
      S.walkThen(...S.at([sx, sz]), () => { if (!holding) return; const b = holding, k = KINDS.indexOf(b.k), [x, , z] = holeAt(k);
        holding = null; b.held = false; S.hands.free(me); girl.poseName = null; b.on = true; b.slot = 0; sfx.chime(); S.confetti(...S.at([x, z]).flatMap((v, i) => i ? [H3 + 1, v] : [v]), [SHAPECOL[b.k], '#fbf5ea'], 10, S.starGeo, 1.6);
        if (blocks.every(q => q.on)) setTimeout(() => openGate(gates[2]), 900); }, .5); }, 'slot');

    /* ---------------- opening a gate ---------------- */
    const openGate = gate => { if (gateOpen(gate.k)) return; mark('poort-' + gate.k); gate.open = .001; sfx.rattle(); };

    /* ---------------- the top: a door out onto the tower's top ---------------- */
    { const a = deg(-90), [x, z] = pol(RW - .04, a), d = new THREE.Group(); d.rotation.y = facing(a); put(d, x, TOP, z);
      const arch = (r, h) => [[-r, 0], [r, 0], [r, h], ...Array.from({ length: 9 }, (_, i) => { const t = i / 8 * Math.PI; return [Math.cos(t) * r, h + Math.sin(t) * r]; }), [-r, h]];
      d.add(card(arch(.62, 1.2), .05, P(GOLD2))); const leaf = card(arch(.52, 1.15), .05, P('#3a2f3a')); leaf.position.z = .02; d.add(leaf);
      for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.CircleGeometry(.025 + (i % 2) * .015, 6), new THREE.MeshBasicMaterial({ color: '#fbf5ea' })); s.position.set(-.3 + (i * .17) % .6, .5 + (i * .37) % 1.1, .05); d.add(s); } }   // (through the open door: the night, and stars)
    S.door('toren', [-.7, -RW - .2, .7, -RW + .52], [0, -1.6], [0, -1], false, () => { girl.y = TOP; girl.lift = 0; girl.poseName = null; }, TOP);

    /* ---------------- in from the treasure room; her unicorn waits at the bottom ---------------- */
    const PARK = [-1.3, 3.2];   // (at the left of the doorstep: the stair starts at the right, and a tap on its first steps must not land on the unicorn)
    const intro = { t: 0, look: S.at([0, 0]), rate: 2.4, shot: { fy: 0, ly: 1, span: 9.5, tall: 10, rise: .06, riseTall: .12, fx: 0, fz: 0, lag: 1, dof: .12, range: 8 },
      step(dt, inp) { const t = intro.t += dt, e = x => x * x * (3 - 2 * x);
        if (t < .9) { intro.shot.ly = 1; intro.shot.rise = .06; }
        else if (t < 3.9) { const k = e((t - .9) / 3); intro.shot.ly = 1 + k * (TOP + .6); intro.shot.rise = .06 - k * .2; }
        else if (t < 5.0) { intro.shot.ly = TOP + 1.6; }
        else { const k = e(Math.min(1, (t - 5) / 2)); intro.shot.ly = TOP + 1.6 - k * (TOP + .6); intro.shot.rise = -.14 + k * .32; if (t > 7.1) S.stopPlay(); }
        if (t > 1 && (inp.x || inp.y || inp.act)) S.stopPlay(); } };
    S.door('trap', [-1.0, 3.35, 1.0, 3.8], [0, 2.75], [0, 1], false, () => { girl.lift = 0; girl.poseName = null; girl.y = 0; [uni.x, uni.z] = S.at(PARK); intro.t = 0; if (!had('trap-gezien')) { mark('trap-gezien'); S.play(intro); } }, 0);
    let parked = false, wasAway = false, onLand = false;
    const light = S.lamp(0, '#ffd7a0', 8, 1.3), light2 = S.lamp(1, '#c8d0ff', 7, 1.4);

    return {
      start: [0, 2.75], uni: PARK,
      shadow: { follow: 20 },
      step({ dt, time }) {
        const here = S.where() === 'kasteeltrap', [lx, lz] = local();
        // the unicorn waits at the bottom while she climbs (it would only be in the way on the stair, and it is too big for it)
        if (here && uni) { if (!parked) wasAway = !!uni.away; parked = true; uni.waits = true; uni.busy = true; [uni.x, uni.z] = S.at(PARK); uni.floatY = 0; uni.face = -1; uni.away = girl.y > 1.4; }
        else if (parked && uni) { parked = false; uni.waits = false; uni.busy = false; uni.floatY = undefined; uni.away = wasAway; }
        // the steps in front that stand higher than she is, between her and the camera, fold out of the way
        const wide = S.playing() === intro || (!!lookingUp && S.playing() === lookingUp);   // (and those far above or below, out of the picture, are not drawn: unless the camera looks up the tower)
        const onLanding = onLand = girl.y > 1 && Math.abs(girl.y - Math.round(girl.y / TURN) * TURN) < .3;   // (on a landing, where the puzzles are: every higher step in front goes, so all of the landing shows; elsewhere only those right in front of her)
        for (const p of pieces) { const hide = here && p.front && p.h > girl.y + .45 && (onLanding || (lz < p.c[1] - .2 && Math.abs(p.c[0] - lx) < 1.6)), far = here && !wide && (p.h > girl.y + 4.2 || p.h < girl.y - 3.2); p.g.visible = !hide && !far; }
        light.position.set(lx, girl.y + 2.2, lz + .6); light.intensity += (1.7 - light.intensity) * Math.min(1, dt * 3);
        light2.position.set(0, TOP + 1, -1); light2.intensity = girl.y > TOP - 3 ? 1.2 : 0;
        for (const [i, f] of flames.entries()) f.scale.y = 1.6 + Math.sin(time * 9 + i) * .2;
        // a new beginning (after the flight home): the gates are down again and the puzzles undone
        for (const gate of gates) if (!gateOpen(gate.k) && (gate.lift > 0 || !gate.first.f.off)) { gate.lift = 0; gate.open = 0; gate.keyIn = false; gate.first.f.off = true; gate.g.position.y = gate.k * TURN;
          if (gate.k === 1) { paintsDone = false; paints.forEach((q, i) => { q.q = q.rot = [1, 2, 3][i]; }); }
          if (gate.k === 2) { found = 0; hideAt = 0; kitDone = false; kitOut = -1; kit.g.visible = false; }
          if (gate.k === 3) for (const [i, b] of blocks.entries()) { b.on = false; b.held = false; b.at = [...BLOCK_AT[i]]; } }
        // the gates: up when open (at once if they were opened before, in this save)
        for (const gate of gates) {
          if (gateOpen(gate.k) && !gate.open) { gate.open = 1; gate.lift = 1; gate.keyIn = true; }
          if (gate.open > 0 && gate.open < 1) { gate.open = Math.min(1, gate.open + dt / 1.6); gate.lift = gate.open * gate.open * (3 - 2 * gate.open); if (gate.open >= 1) lookUp(gate); }
          gate.g.position.y = gate.k * TURN + gate.lift * 1.45; gate.first.f.off = gate.lift < .6;
          gate.g.position.x = gate.open > 0 && gate.open < 1 ? Math.sin(time * 40) * .012 : 0; const w = gate.g.userData.wob || 0; if (w > 0) { gate.g.userData.wob = Math.max(0, w - dt * 2); gate.g.position.x += Math.sin(w * 30) * w * .03; } }
        // keys on their way
        for (let i = keys.length - 1; i >= 0; i--) { const q = keys[i]; q.t += dt; const k = Math.min(1, q.t / 1.5), e = k * k * (3 - 2 * k);
          if (k < 1) { q.g.position.set(q.from[0] + (q.to[0] - q.from[0]) * e, q.from[1] + (q.to[1] - q.from[1]) * e + Math.sin(k * Math.PI) * .9, q.from[2] + (q.to[2] - q.from[2]) * e); q.g.rotation.set(0, -A1 + Math.PI / 2, k * 6.283); }
          else { q.g.position.set(...q.to); q.g.rotation.set(Math.min(1, (q.t - 1.5) / .5) * Math.PI / 2, -A1 + Math.PI / 2, 0); if (q.t > 1.5 && q.t - dt <= 1.5) sfx.click(); if (q.t > 2.1) { root.remove(q.g); keys.splice(i, 1); openGate(q.gate); } } }
        // the paintings turn to where they are asked; all straight: a key falls out behind the middle one
        for (const q of paints) { q.rot += (q.q - q.rot) * Math.min(1, dt * 8); q.g.rotation.z = -q.rot * Math.PI / 2; }
        if (gateOpen(1) && !paintsDone) { paintsDone = true; for (const q of paints) q.q = q.rot = Math.ceil(q.q / 4) * 4; }
        if (!paintsDone && paints.every(q => q.q % 4 === 0) && paints.every(q => Math.abs(q.rot - q.q) < .02)) { paintsDone = true; sfx.hello(); const [x, z] = pol(RW - .2, PA[1]); S.confetti(...S.at([x, z]).flatMap((v, j) => j ? [H1 + 1.85, v] : [v]), ['#f2c65c', '#fbf5ea'], 14, S.starGeo, 1.8); setTimeout(() => sendKey(gates[0], [x, H1 + 1.4, z]), 600); }
        // the kitten: out for a moment when found, then off to hide again; three times and it brings the key
        if (gateOpen(2) || kitDone) { kitDone = true; tail.g.visible = false; kit.g.visible = true; if (kitOut < 0) [kit.x, kit.z] = S.at(pol(1.5, A1 - .25)); }
        if (kitOut >= 0) { kitOut += dt; if (kitOut > 1.8) { kitOut = -1;
          if (found >= 3) { kitDone = true; kit.hopV = 2.6; sfx.meow(); const [x, z] = pol(1.5, A1 - .25); [kit.x, kit.z] = S.at([x, z]); sendKey(gates[1], [x, H2 + .5, z]); }
          else { kit.g.visible = false; hideAt = (hideAt + 1) % HIDES.length; placeTail(); tail.g.visible = true; } } }
        else if (!kitDone) { tail.g.visible = true; placeTail(); }
        for (const g of hideG) { g.userData.wob = Math.max(0, (g.userData.wob || 0) - dt * 2); g.rotation.z = Math.sin((g.userData.wob || 0) * 18) * (g.userData.wob || 0) * .08; }
        // the shapes: lying, carried, wobbling, in the lock
        for (const [i, b] of blocks.entries()) {
          if (gateOpen(3)) b.on = true;
          if (b.on) { const [x, y, z] = holeAt(KINDS.indexOf(b.k)); const gy = gates[2].lift * 1.45; b.slot = Math.min(1, (b.slot ?? 1) + dt * 2.5); const e = b.slot * b.slot * (3 - 2 * b.slot), [ox, oz] = S.at([0, 0]), from = b.from || [girl.x - ox, girl.y + .9, girl.z - oz]; if (b.slot < 1 && !b.from) b.from = from; if (b.slot >= 1) b.from = null;
            b.g.position.set(from[0] + (x - from[0]) * e, from[1] + (y - .24 + gy - from[1]) * e + Math.sin(e * Math.PI) * .4, from[2] + (z - from[2]) * e); b.g.rotation.set(0, -A1 + Math.PI / 2, 0); }
          else if (b.held && !S.playing()) { const h = S.hand(), [ox, oz] = S.at([0, 0]); girl.poseName = 'hold'; b.g.position.set(h.x - ox + girl.face * .1, h.y - .3, h.z - oz + .05); b.g.rotation.set(0, 0, Math.sin(b.wob * 20) * b.wob * .4); }
          else { b.g.position.set(b.at[0], H3, b.at[1]); b.g.rotation.set(0, 0, 0); }
          b.wob = Math.max(0, b.wob - dt * 1.5); }
        if (!here && holding) { dropBlock(); S.hands.free(me); }
      },
      toys: { trap: { solve: k => { for (const g of gates) if (!k || g.k === k) openGate(g); }, state: () => ({ y: +girl.y.toFixed(2), onLand, hidden: pieces.filter(p => !p.g.visible).map(p => p.idx), step: Math.round(girl.y / RISE), gates: gates.map(g => gateOpen(g.k)), lifted: gates.map(g => +g.lift.toFixed(2)), paints: paints.map(q => ((q.q % 4) + 4) % 4), found, hideAt, shapes: blocks.map(b => b.on), holding: holding ? holding.k : null, keys: keys.length, uniWaits: !!uni.waits }) } },
      shots: [{ name: 'trap', ax: 0, az: 0, fx: .2, fy: 1, fz: .2, lag: 1, span: 8.6, tall: 8.5, rise: .2, riseTall: .3, ly: .45, dof: .2, range: 5 }],
      spots: { paint0: [...pol(RW - .07, PA[0])].flatMap((v, i) => i ? [H1 + 1.85, v] : [v]), paint1: [...pol(RW - .07, PA[1])].flatMap((v, i) => i ? [H1 + 1.85, v] : [v]), paint2: [...pol(RW - .07, PA[2])].flatMap((v, i) => i ? [H1 + 1.85, v] : [v]) },
      places: { start: [0, 2.75], landing1: pol(1.7, deg(-90)), landing2: pol(1.7, deg(-90)), landing3: pol(1.7, deg(-90)), top: [0, -1.6] },
    };
  },
};
