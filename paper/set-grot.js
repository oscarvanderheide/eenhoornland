// The cave behind the waterfall: a room of its own, far beside the world, like her bedroom (a door is a cut: S.door).
// She gets in by swimming under the fall in the meadow's pool, so only with the snorkel. A friendly cave: pale lilac
// stone, crystals that each sing a note and glow, a pool of light. In the middle stands a chest: a tap and it opens, and
// the hookshot is hers. She leaves through the water at the front.
import { THREE, paper, slab, card, blob, circlePts, edgeMat, whiteEdge } from './kit.js';
import { gift, HOOK } from './gear.js';

const W = 6.6, D = 4.2;
const COL = { dark: '#3d3550', floor: '#cfc8dc', floor2: '#bdb6c9', rock: '#a99fc0', rock2: '#b9b0cc', rock3: '#978daf', water: '#8fc3cc', wood: '#b9875a', wood2: '#9a6e47', gold: '#f2c65c', moss: '#9fbf8a' };
const NOTES = [392, 440, 523.3, 587.3, 659.3, 784], CRYS = ['#f4a6c4', '#bba6ea', '#8fc3e0', '#9ed9cf', '#f2d86b', '#f2b56b'];

export default {
  name: 'grot',
  build(S) {
    const root = S.root, P = c => paper(COL[c] || c), { girl, sfx } = S;
    const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
    const table = new THREE.Mesh(new THREE.PlaneGeometry(40, 26), P('dark')); table.rotation.x = -Math.PI / 2; table.position.set(0, -.06, 0); root.add(table);
    const behind = new THREE.Mesh(new THREE.PlaneGeometry(40, 16), P('dark')); behind.position.set(0, 6, -D / 2 - 1.6); root.add(behind);
    root.add(slab(blob(0, 0, W / 2, D / 2, 801, 48, .05), 0, .14, P('floor'), P('floor2')));
    root.add(slab(blob(0, D / 2 - .5, 1.5, .62, 802, 28, .06), .02, .02, P('water'), whiteEdge));                       // the water she came in by: the way out
    // the walls: three rows of rock, cut wavy, one behind the other; and rocks at the sides
    const wavy = (w, h, seed, amp) => { const pts = [[-w / 2, 0]]; for (let i = 0; i <= 24; i++) { const x = -w / 2 + i / 24 * w; pts.push([x, h + Math.sin(i * .9 + seed) * amp + Math.sin(i * .37 + seed * 2) * amp * .7]); } pts.push([w / 2, 0]); return pts; };
    [[W + 3.2, 3.4, 1, .22, 'rock3', -D / 2 - .7], [W + 2.2, 2.6, 2, .2, 'rock', -D / 2 - .35], [W + 1.0, 1.7, 3, .16, 'rock2', -D / 2 + .02]].forEach(([w, h, sd, amp, c, z]) => { const m = card(wavy(w, h, sd, amp), .1, P(c), edgeMat); m.position.set(0, 0, z); root.add(m); });
    for (const s of [-1, 1]) { const m = card(wavy(D + 1.4, 2.3, 5 + s, .2), .1, P('rock'), edgeMat); m.rotation.y = s * (Math.PI / 2 - .3); m.position.set(s * (W / 2 + .5), 0, -.1); root.add(m); }
    for (const [x, z, r, c] of [[-2.6, -1.2, .42, 'rock2'], [2.7, -1.0, .5, 'rock'], [-2.9, .9, .3, 'rock3'], [2.2, 1.3, .26, 'rock2']]) { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 9, 7), P(c)); b.scale.y = .7; b.position.set(x, r * .4, z); b.castShadow = b.receiveShadow = true; root.add(b); S.solid({ x, z, r: r * .9 }); }
    S.floor(0, blob(0, 0, W / 2 - .15, D / 2 - .12, 801, 48, .05));
    S.door('waterval', [-1.5, D / 2 - .42, 1.5, D / 2 + .3], [0, D / 2 - 1.15], [0, 1], true);

    // the crystals along the back: each sings its note and glows for a moment
    const crystals = CRYS.map((c, i) => {
      const g = new THREE.Group(), x = -2.5 + i * 1.0, z = -D / 2 + .5 + (i % 2) * .22; g.position.set(x, 0, z); g.userData.live = true; root.add(g);
      const mat = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: .35, roughness: .5, flatShading: true });
      for (const [dx, h, r, lean] of [[0, .9 + (i % 3) * .2, .16, 0], [-.17, .5, .11, .3], [.16, .58, .1, -.28]]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0, r, h, 5), mat); m.position.set(dx, h / 2, 0); m.rotation.z = lean; m.castShadow = true; g.add(m); }
      S.solid({ x, z, r: .22 });
      const q = { g, mat, glow: 0, x, z }; S.tap(g, () => { q.glow = 1; sung++; sfx.note(NOTES[i]); S.confetti(...S.at([x, z]).flatMap((v, k) => k ? [1.0, v] : [v]), [c, '#fbf7ee'], 6, S.starGeo, 1.6); }); return q;
    });
    let sung = 0;
    const light = S.lamp(0, '#d9c8ff', 7.5, 1.3); light.position.set(0, 2.2, 0);   // (a lamp is placed in the set's own measure: in the world's it was far off, and never lit)

    // the chest, on a low stone in the middle
    { const dais = slab(circlePts(.75, 811, 18), .1, .1, P('rock2'), P('rock')); dais.position.set(0, 0, -.55); root.add(dais); }
    const chest = new THREE.Group(); chest.position.set(0, .1, -.55); root.add(chest);
    const box = (w, h, d, c, x, y, z, parent = chest) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), P(c)); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
    box(.8, .36, .5, 'wood', 0, .18, 0); for (const sx of [-.3, .3]) box(.07, .38, .52, 'gold', sx, .19, 0); box(.12, .12, .04, 'gold', 0, .26, .26);
    const lid = new THREE.Group(); lid.position.set(0, .36, -.25); lid.userData.live = true; chest.add(lid);
    box(.84, .14, .54, 'wood2', 0, .07, .25, lid); for (const sx of [-.3, .3]) box(.07, .16, .56, 'gold', sx, .07, .25, lid); S.glue(lid);
    S.solid({ x: 0, z: -.55, r: .5 });
    const [cx, cz] = S.at([0, -.55]), present = gift(S, 'haak', HOOK); let open = 0, opened = false, busy = false;
    S.tap(chest, () => { if (S.playing() || opened || busy) return; busy = true; S.walkThen(cx, cz + 1.0, () => { opened = true; sfx.click(); setTimeout(() => { if (!S.gear.hook) present([cx, .7, cz], () => { S.gear.hook = true; S.coins.reward('haak', S.girl.x, S.girl.y + 1.1, S.girl.z); }); }, 450); }, 1.2); });

    return {
      start: [0, D / 2 - 1.15], uni: [.9, D / 2 - 1.0],
      shadow: { follow: 20 },
      step({ dt }) {
        if (S.gear.hook) opened = true;   // (hers already: the chest stands open and empty)
        open += ((opened ? 1 : 0) - open) * Math.min(1, dt * 7); lid.rotation.x = -open * 1.9;
        light.intensity += (1.7 - light.intensity) * Math.min(1, dt * 4);
        for (const q of crystals) { if (q.glow > .01) q.glow *= Math.exp(-dt * 1.6); q.mat.emissiveIntensity = .35 + q.glow * 1.6; }
      },
      toys: { kist: { state: () => ({ opened, hook: S.gear.hook, sung }) } },
      shots: [{ name: 'grot', ax: 0, az: -.1, fx: .3, fy: .2, fz: .25, lag: 1, span: 8.6, tall: 6.4, rise: .36, riseTall: .5 }],
      spots: { kist: [.33, .42, -.3], kristal: [-2.5, .6, -D / 2 + .5] },
      places: { start: [0, D / 2 - 1.15], chest: [0, .6], left: [-1.6, .2] },
    };
  },
};
