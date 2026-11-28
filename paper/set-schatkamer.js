// The castle's treasure room (Oscar: "then a room that leads into the treasure room with some coins. should really feel like
// a separate room. and then a door to a stairway"). In from the great hall through its golden door; a low vaulted room,
// warm with gold: heaps of coins, chests along the walls, gems on the shelves, a crown on a cushion. At the back a little
// door to the tower's stair (set-kasteeltrap.js).
//   the chests     a tap: she walks over, the lid flies open, coins spill out and are hers (each chest once a story round)
//   the gold heap  a tap: it slides and jingles, coins roll off it (one now and then), and the first time one is hers
//   the crown      a tap: she walks to it and it floats onto her head; she twirls; it floats back to its cushion
//   the gems       a tap: they sparkle and ring, each its own note
//   coins          a few lie about on the floor
//   the stair      through the little door at the back
import { THREE, paper, slab, card, blob, whiteEdge } from './kit.js';
import { roomShell, roomShot } from './rooms.js';

const W = 6.6, D = 3.8, H = 3.2;
const GOLD = '#e3b04b', GOLD2 = '#c9a46a', COIN = '#f2c65c';

export default {
  name: 'schatkamer',
  build(S) {
    const { girl, sfx } = S, root = S.root, had = k => S.coins.had(k), mark = k => S.coins.had(k, true);
    const { put, box, P } = roomShell(S, { W, D, H, floor: '#d8c9b8', boards: null, wall: '#8a6f9a', side: '#7b5f8c', dark: '#2e2635', skirt: GOLD2, windows: [], openings: [[2.1, 1.2, 2.1]], frame: GOLD2, door: 'schatkamer', mat: '#d9534f',
      arrive: () => { girl.lift = 0; girl.poseName = null; } });
    const local = () => { const [ox, oz] = S.at([0, 0]); return [girl.x - ox, girl.z - oz]; };
    const goldM = new THREE.MeshStandardMaterial({ color: COIN, emissive: '#c98f1e', emissiveIntensity: .35, roughness: .45, metalness: .25 });
    const coinGeo = new THREE.CylinderGeometry(.1, .1, .025, 14);
    // the walls: a pattern of little gold diamonds, and arches painted on the back wall
    for (let r = 0; r < 5; r++) for (let i = 0; i < 14; i++) { const x = -W / 2 + .25 + i * .47 + (r % 2) * .23, y = .55 + r * .55; if (Math.abs(x - 2.1) < .75 && y < 2.3) continue; const d = new THREE.Mesh(new THREE.CircleGeometry(.05, 4), P('#d9b864')); put(d, x, y, -D / 2 + .045); }
    for (const x of [-2.0, -.4]) put(card([[-.55, 0], [.55, 0], [.55, 1.7], ...Array.from({ length: 9 }, (_, i) => { const t = i / 8 * Math.PI; return [Math.cos(t) * .55, 1.7 + Math.sin(t) * .55]; }), [-.55, 1.7]], .02, P('#7b5f8c'), P(GOLD2)), x, 0, -D / 2 + .05);
    // the little door to the stair: an arch of gold round the opening, the first steps going up in the dark behind it
    put(card([[-.72, 0], [-.72, 2.1], [-.4, 2.4], [0, 2.5], [.4, 2.4], [.72, 2.1], [.72, 0]], .06, P(GOLD), P(GOLD2), [[[-.6, .02], [.6, .02], [.6, 2.08], [0, 2.38], [-.6, 2.08]].reverse()]), 2.1, 0, -D / 2 + .07);
    for (let i = 0; i < 6; i++) put(box(1.1, .1, .36, '#6f6082'), 2.1 + i * .08, .1 + i * .3, -D / 2 - .25 - i * .28);
    S.door('trap', [1.5, -D / 2 + .02, 2.7, -D / 2 + .4], [2.1, -D / 2 + 1.1], [0, -1], false, () => { girl.lift = 0; girl.poseName = null; });

    /* ---------------- the gold heaps: in the back corners, coins all over them ---------------- */
    const heaps = [[-2.6, -1.25, .9, .55], [.6, -1.35, .6, .38]].map(([x, z, r, h], hi) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.userData.live = true; root.add(g);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 18, 1), goldM); cone.scale.z = .7; cone.position.y = h / 2; cone.castShadow = true; g.add(cone);
      for (let i = 0; i < 26; i++) { const a = i * 2.4, rr = (i % 7) / 7 * r * .9, c = new THREE.Mesh(coinGeo, goldM); c.position.set(Math.cos(a) * rr, h * (1 - rr / r) + .01, Math.sin(a) * rr * .7); c.rotation.set((i % 3 - 1) * .5, 0, (i % 5 - 2) * .3); g.add(c); }
      S.solid({ x, z, r: r * .8 }); return { g, x, z, r, h, wob: 0, hi }; });
    const rolling = [];
    const slide = q => { q.wob = 1; sfx.jingle(); for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(coinGeo, goldM); c.userData.live = true; root.add(c); const a = Math.PI * (.3 + Math.random() * .4); rolling.push({ c, x: q.x, y: q.h * .8, z: q.z, vx: Math.cos(a) * 1.4 * (Math.random() < .5 ? -1 : 1), vz: Math.sin(a) * 1.2, vy: 1.2, t: 0 }); } };
    heaps.forEach(q => S.tap(q.g, () => { slide(q); const [x, z] = S.at([q.x, q.z + q.r]); S.coins.reward('goudberg', x, .8, z); }, q.hi ? 'goudbergje' : 'goudberg'));

    /* ---------------- the chests: three along the walls ---------------- */
    const CHESTS = [[-3.0, .3, .9], [-1.2, -1.45, 0], [3.05, .5, -.9]];   // [x, z, turned]
    const chests = CHESTS.map(([x, z, ry], i) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; root.add(g);
      const c = box(.8, .45, .5, '#9a5f3e'); c.position.y = .23; g.add(c);
      for (const s of [-.3, .3]) { const b = box(.06, .47, .52, GOLD); b.position.set(s, .235, 0); g.add(b); }
      const inside = new THREE.Mesh(new THREE.PlaneGeometry(.72, .42), goldM); inside.rotation.x = -Math.PI / 2; inside.position.y = .4; g.add(inside);
      for (let k = 0; k < 6; k++) { const cc = new THREE.Mesh(coinGeo, goldM); cc.position.set(-.25 + k * .1, .43, (k % 2) * .08 - .04); g.add(cc); }
      const lid = new THREE.Group(); lid.position.set(0, .45, -.25); lid.userData.live = true; g.add(lid);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, .8, 12, 1, false, 0, Math.PI), P('#b06d48')); top.rotation.z = Math.PI / 2; top.position.set(0, 0, .25); top.castShadow = true; lid.add(top);
      for (const s of [-.3, .3]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.26, .26, .06, 12, 1, false, 0, Math.PI), P(GOLD)); b.rotation.z = Math.PI / 2; b.position.set(s, 0, .25); lid.add(b); }
      const lock = box(.12, .14, .04, GOLD); lock.position.set(0, -.02, .5); lid.add(lock);
      S.solid({ x, z, r: .42 }); const [sx, sz] = [x + Math.sin(ry) * .85, z + Math.cos(ry) * .85];
      const q = { g, lid, open: had('kist-' + i) ? 1 : 0, opening: 0, i, at: [sx, sz] };
      S.tap(g, () => { if (S.playing()) return; S.walkThen(...S.at(q.at), () => { if (had('kist-' + i)) { q.opening = .6; sfx.jingle(); return; } mark('kist-' + i); q.opening = 1; sfx.door(1); setTimeout(() => sfx.jingle(), 250);
        const [wx, wz] = S.at([x, z]); S.confetti(wx, .7, wz, [COIN, '#fbf5ea', '#e0a93a'], 16, S.starGeo, 2.2); setTimeout(() => S.coins.earn(wx, .6, wz, 3), 450); girl.hopV = 2.4; }, .5); }, 'kist' + i);
      return q; });

    /* ---------------- the crown on its cushion, on a little pillar in the middle of the back ---------------- */
    const CX = -.4, CZ = -1.35;
    { const pil = new THREE.Mesh(new THREE.CylinderGeometry(.22, .26, .7, 14), P('#e8d5b0')); pil.position.set(CX, .35, CZ); pil.castShadow = true; root.add(pil);
      const cush = new THREE.Mesh(new THREE.SphereGeometry(.24, 14, 8), P('#c9433f')); cush.scale.set(1.2, .4, 1); cush.position.set(CX, .78, CZ); root.add(cush); }
    S.solid({ x: CX, z: CZ, r: .32 });
    const crown = new THREE.Group(); crown.userData.live = true; root.add(crown);
    { const band = new THREE.Mesh(new THREE.CylinderGeometry(.17, .17, .1, 16, 1, true), new THREE.MeshStandardMaterial({ color: COIN, emissive: '#c98f1e', emissiveIntensity: .35, roughness: .45, side: THREE.DoubleSide })); band.position.y = .05; crown.add(band);
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2, t = new THREE.Mesh(new THREE.ConeGeometry(.045, .12, 6), goldM); t.position.set(Math.cos(a) * .16, .15, Math.sin(a) * .16); crown.add(t); const gem = new THREE.Mesh(new THREE.SphereGeometry(.025, 6, 5), P(['#e8505b', '#5f86b0', '#9ed9a0', '#bba6ea', '#f4a6c4'][i])); gem.position.set(Math.cos(a) * .172, .05, Math.sin(a) * .172); crown.add(gem); } }
    let crownT = -1, crowns = 0; const [cpx, cpz] = [CX, CZ + .75];
    S.tap(crown, () => { if (crownT >= 0 || S.playing()) return; S.walkThen(...S.at([cpx, cpz]), () => { crownT = 0; crowns++; sfx.chime(); girl.view = 'front'; }, .4); }, 'kroon');

    /* ---------------- the gems: on two shelves on the side walls ---------------- */
    const GEMS = ['#e8505b', '#5f86b0', '#9ed9a0', '#bba6ea', '#f4a6c4', '#9ed9cf'], NOTES = [659.3, 784, 880, 1046.5, 1174.7, 1318.5];
    const gems = [];
    for (const [sx, s] of [[-W / 2 + .45, 1], [W / 2 - .45, -1]]) { const sh = box(1.2, .06, .3, '#7a5a3e'); sh.rotation.y = s * (Math.PI / 2 - .28); put(sh, sx, 1.35, -.6);
      for (let i = 0; i < 3; i++) { const c = GEMS[gems.length], m = new THREE.Mesh(new THREE.OctahedronGeometry(.12, 0), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: .3, roughness: .3 })); m.scale.y = 1.3; m.userData.live = true; put(m, sx + s * .05, 1.52, -.98 + i * .38); const q = { m, k: gems.length, ring: 0 }; gems.push(q); } }
    const gemTap = () => { gems.forEach((q, i) => setTimeout(() => { q.ring = 1; sfx.note(NOTES[i]); }, i * 140)); };
    for (const q of gems) S.tap(q.m, gemTap, q.k ? null : 'edelstenen');

    /* ---------------- coins lying about, and the light ---------------- */
    for (const [cx, cz] of [[-1.6, .9], [1.3, .6], [2.6, -.5], [-.3, 1.1]]) S.coinAt(cx, cz);
    root.add(slab(blob(.1, .55, 1.4, .7, 931, 36, .04), .018, .018, P('#c9433f'), whiteEdge)); root.add(slab(blob(.1, .55, 1.0, .45, 932, 28, .04), .03, .012, P('#e3b04b'), whiteEdge));
    const light = S.lamp(0, '#ffcf7a', 8, 1.3); light.position.set(-.5, 2.6, .2);

    return {
      start: [0, D / 2 - .95], uni: [-.9, D / 2 - .8],
      shadow: { follow: 20 },
      step({ dt, time }) {
        light.intensity += (2.0 - light.intensity) * Math.min(1, dt * 3);
        goldM.emissiveIntensity = .32 + Math.sin(time * 2) * .06;
        for (const q of heaps) { q.wob = Math.max(0, q.wob - dt * 1.6); q.g.rotation.z = Math.sin(q.wob * 22) * q.wob * .05; q.g.scale.y = 1 - Math.sin(q.wob * Math.PI) * .06; }
        for (let i = rolling.length - 1; i >= 0; i--) { const r = rolling[i]; r.t += dt; r.vy -= 9 * dt; r.x += r.vx * dt; r.z += r.vz * dt; r.y = Math.max(.02, r.y + r.vy * dt); if (r.y <= .02) { r.vx *= .9; r.vz *= .9; r.vy = Math.abs(r.vy) > 1 ? -r.vy * .3 : 0; }
          r.c.position.set(r.x, r.y, r.z); r.c.rotation.x += dt * 9; if (r.t > 1.6) { r.c.scale.setScalar(Math.max(.01, 1 - (r.t - 1.6) * 3)); if (r.t > 1.95) { root.remove(r.c); rolling.splice(i, 1); } } }
        // a new story round (after the flight home): the chests are shut again and full
        for (const q of chests) { if (!had('kist-' + q.i) && q.open > .5 && q.opening <= 0) q.open = 0;
          if (q.opening > 0) { q.opening = Math.max(0, q.opening - dt * 1.4); q.open = Math.min(1, q.open + dt * 4); } q.lid.rotation.x = -q.open * 1.9 + (q.opening > 0 ? Math.sin(q.opening * 30) * .06 : 0); }
        // the crown: up from its cushion onto her head, a twirl, and back
        if (crownT >= 0) { crownT += dt; const h = S.head(), [ox, oz] = S.at([0, 0]), home = new THREE.Vector3(CX, .9, CZ), on = new THREE.Vector3(h.x - ox, h.y - .04, h.z - oz + .02);
          const k = crownT < .8 ? crownT / .8 : crownT < 3.4 ? 1 : Math.max(0, 1 - (crownT - 3.4) / .8), e = k * k * (3 - 2 * k);
          crown.position.lerpVectors(home, on, e); crown.position.y += Math.sin(e * Math.PI) * .5; crown.rotation.y = crownT * 2;
          if (crownT > 1 && crownT < 2.6) { const s = (crownT - 1) / 1.6; girl.view = s < .25 ? 'side' : s < .5 ? 'back' : s < .75 ? 'side' : 'front'; girl.face = s < .5 ? 1 : -1; if (Math.floor(crownT * 4) !== Math.floor((crownT - dt) * 4)) S.confetti(girl.x, girl.y + 1.3, girl.z, [COIN, '#fbf5ea', '#f4a6c4'], 4, S.starGeo, 1.4); }
          if (crownT > 4.2) crownT = -1; }
        else { crown.position.set(CX, .9, CZ); crown.rotation.y = time * .4; }
        for (const q of gems) { q.ring = Math.max(0, q.ring - dt * 1.5); q.m.rotation.y = time * .8 + q.k + q.ring * 8; q.m.material.emissiveIntensity = .3 + q.ring * 1.2; q.m.scale.setScalar(1 + q.ring * .25); q.m.scale.y *= 1.3; }
      },
      toys: { schat: { state: () => ({ chests: chests.map(q => had('kist-' + q.i)), crown: crownT >= 0, crowns, coins: S.coins.have(), heap: had('goudberg') }) } },
      shots: [roomShot('schatkamer', 8.8, 6.4)],
      spots: { kist0: [-3.0, .4, .3], kist1: [-1.2, .4, -1.45], kist2: [3.05, .4, .5], kroon: [CX, .95, CZ], goudberg: [-2.6, .4, -1.25], stair: [2.1, 1.0, -D / 2 + .1] },
      places: { start: [0, D / 2 - .95], stair: [2.1, -D / 2 + 1.1], crown: [cpx, cpz] },
    };
  },
};
