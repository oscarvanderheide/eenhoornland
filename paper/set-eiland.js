// The test island as a set: the first thing built in the paper look, and the picture every change to the stage is checked
// against (tests/t-paper-look.mjs). A set is `{ name, build(S) }`: build puts everything it makes under S.root with the
// stage's toolbox S, and gives back where she starts, what it does every frame and what the tests may ask it by name.
import { THREE, rng, lerp, paper, slab, card, blob, inPoly, edgeDist, edgeMat, whiteEdge, circlePts, grassMap, grassBump, sandMap, sandBump, WATER_Y } from './kit.js';
import { cottage } from './props.js';

// the lamp's bulb glows: made once and kept, so loading the set again compiles nothing new
const bulbMat = new THREE.MeshStandardMaterial({ color: '#fff3d6', emissive: '#ffcf86', emissiveIntensity: .4 });
const woolGeo = new THREE.CircleGeometry(.07, 8);

/* ---------------- the animals that live here ---------------- */
const blobPath = (g, pts) => { g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.closePath(); };
const ell = (g, x, y, rx, ry, col, rot = 0) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fill(); };
const poly = (g, pts, col) => { g.fillStyle = col; blobPath(g, pts); g.fill(); };
const limb = (g, x1, y1, x2, y2, wdt, col) => { g.strokeStyle = col; g.lineWidth = wdt; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };

// the sheep: a cloud of cream wool with a dark face (facing right)
function drawSheep(g, f) {
  const sw = f === 1 ? 1 : f === 2 ? -1 : 0, wool = '#f4ecdc', wool2 = '#e2d6c1', face = '#4b3d3d';
  for (const x of [44, 58, 90, 104]) limb(g, x, 112, x + sw * 3, 140, 9, face);
  for (const [x, y, r] of [[40, 92, 20], [58, 78, 22], [80, 74, 22], [100, 84, 20], [104, 102, 17], [82, 108, 20], [58, 108, 20], [38, 106, 17]]) ell(g, x + 2, y + 4, r, r, wool2);
  for (const [x, y, r] of [[40, 90, 20], [58, 76, 22], [80, 72, 22], [100, 82, 20], [102, 100, 17], [80, 104, 20], [58, 104, 20], [38, 102, 17], [70, 90, 26]]) ell(g, x, y, r, r, wool);
  ell(g, 118, 82, 15, 19, face, -.4);
  ell(g, 104, 66, 9, 5, face, -.6);
  ell(g, 124, 78, 3, 3.6, '#f6efe2'); ell(g, 125, 77, 1.6, 1.8, '#2a2020');
  for (const [x, y, r] of [[110, 62, 9], [120, 60, 8]]) ell(g, x, y, r, r, wool);
}
// the duck: a mustard paper duck, floating (facing left)
function drawDuck(g, f) {
  ell(g, 66, 70, 38, 22, '#e6b748');
  poly(g, [[94, 66], [118, 50], [112, 72], [100, 80]], '#e6b748');
  ell(g, 70, 74, 22, 12, '#cf9c35', .15);
  ell(g, 40, 38, 20, 19, '#ecc257');
  poly(g, [[22, 38], [4, 42 + (f ? 2 : 0)], [22, 47]], '#e2803e');
  ell(g, 34, 33, 3.4, 4, '#2a2020'); ell(g, 35, 32, 1.2, 1.2, '#fff');
}

export default {
  name: 'eiland',
  build(S) {
    const { girl, sfx, confetti } = S, scene = S.root;
    const lollipop = S.lollipop, pine = S.pine;

    /* ---------------- the island ---------------- */
    const SAND = blob(0, 0, 7.6, 5.1, 21);
    const GRASS = blob(-.1, -.2, 6.5, 4.2, 22);
    const HILL = blob(2.7, -2.1, 2.5, 1.45, 23, 48, .05);
    const H_SAND = -.32, H_GRASS = 0, H_HILL = .48;
    scene.add(slab(SAND, H_SAND, .55, paper('#ecd3a0', { map: sandMap, bump: sandBump }), edgeMat));
    scene.add(slab(GRASS, H_GRASS, .32, paper('#a3bf76', { map: grassMap, bump: grassBump }), edgeMat));
    scene.add(slab(HILL, H_HILL, .48, paper('#bccb84', { map: grassMap, bump: grassBump }), edgeMat));
    // a lower, darker card under everything so the island reads as a thick stack
    scene.add(slab(blob(0, .1, 7.9, 5.3, 24), H_SAND - .5, .5, paper('#8b7a62'), edgeMat));

    // stairs: three card steps from the meadow up the hill (the walk rule allows steps of a third of a layer)
    const hillFront = (() => { let z = -9; for (let t = -1; t <= 0; t += .002) { const zz = -2.1 + 1.45 * 1.2 * (1 + t); if (inPoly(HILL, 2.3, zz)) z = zz; } return z; })();
    const STAIRS = [];
    for (let i = 0; i < 3; i++) {
      const z0 = hillFront + .05 + (2 - i) * .42, h = (i + 1) * .16 - .02;
      const pts = [[1.75, z0], [2.85, z0], [2.85, z0 - .5], [1.75, z0 - .5]];
      const s = slab(pts, h, h + .02, paper('#d9c6a2'), edgeMat); scene.add(s);
      STAIRS.push({ x0: 1.75, x1: 2.85, z0: z0 - .5, z1: z0, h });
    }
    // the jetty: card planks on matchstick posts, out over the sea
    const JETTY = { x0: 3.1, x1: 3.95, z0: 3.4, z1: 7.4, h: -.2 };
    {
      const plankMat = paper('#c79a66'), postMat = paper('#8d6a48');
      for (let z = JETTY.z0; z < JETTY.z1; z += .32) {
        const p = slab([[JETTY.x0 - .05, z], [JETTY.x1 + .05, z], [JETTY.x1 + .05, z + .28], [JETTY.x0 - .05, z + .28]], JETTY.h, .06, plankMat, edgeMat);
        p.rotation.y = (Math.sin(z * 9) * .012); scene.add(p);
      }
      for (const z of [4.6, 6.0, 7.25]) for (const x of [JETTY.x0, JETTY.x1]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.6, 8), postMat); post.position.set(x, JETTY.h - .6, z); post.castShadow = true; scene.add(post);
      }
    }

    // the sea: rows of wavy card round the sand
    S.sea({ land: [SAND] });

    // where she can stand: the first floor that holds the spot counts
    for (const s of STAIRS) S.floorBox(s.h, s.x0, s.z0, s.x1, s.z1);
    S.floor(H_HILL, HILL); S.floor(H_GRASS, GRASS); S.floorBox(JETTY.h, JETTY.x0, JETTY.z0 - .4, JETTY.x1, JETTY.z1); S.floor(H_SAND, SAND, .22);

    /* ---------------- trees, flowers ---------------- */
    lollipop(-5.1, -1.4, H_GRASS, .62, '#93b071', '#b3c98d', 1);
    lollipop(-.3, -2.9, H_GRASS, .72, '#d8b35a', '#e8cd85', 2, 1.45);
    lollipop(5.4, .2, H_GRASS, .55, '#d9806c', '#e9a48f', 3, 1.1);
    lollipop(-4.0, 2.4, H_GRASS, .45, '#93b071', '#b3c98d', 4, .9);
    pine(2.0, -2.7, H_HILL, 1.7, '#6f9670');
    pine(3.6, -2.2, H_HILL, 1.35, '#7fa676');
    pine(4.1, -2.9, H_HILL, 1.9, '#5f8665');

    // paper flowers and grass tufts
    {
      const R = rng(31), flowerCols = ['#f2efe6', '#e98f8f', '#f2c65c', '#b9a3e0'];
      const petals = []; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; for (let j = 0; j <= 6; j++) { const b = a - .5 + j / 6; petals.push([Math.cos(b) * (.07 + .05 * Math.sin((j / 6) * Math.PI)), Math.sin(b) * (.07 + .05 * Math.sin((j / 6) * Math.PI))]); } }
      const tuftPts = [[-.16, 0], [-.12, .2], [-.06, .05], [0, .26], [.05, .05], [.12, .22], [.16, 0]];
      const stemMat = paper('#6f8f55');
      for (let i = 0; i < 70; i++) {
        const x = -6 + R() * 12, z = -4 + R() * 8;
        if (!inPoly(GRASS, x, z) || edgeDist(GRASS, x, z) < .3 || inPoly(HILL, x, z) && edgeDist(HILL, x, z) < .25) continue;
        if (x > -4 && x < -1 && z > -2.4 && z < .3) continue;   // not in the house
        const y = inPoly(HILL, x, z) ? H_HILL : H_GRASS;
        if (i % 2) {
          const t = card(tuftPts, .02, paper(R() < .5 ? '#86a466' : '#9bb877')); t.position.set(x, y, z); t.rotation.y = R() * .6 - .3; t.scale.setScalar(.8 + R() * .5); scene.add(t);
        } else {
          const f = new THREE.Group(); f.position.set(x, y, z); scene.add(f);
          const stem = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .28, 4), stemMat); stem.position.y = .14; f.add(stem);
          const fl = card(petals, .02, paper(flowerCols[Math.floor(R() * 4)])); fl.position.y = .3; f.add(fl);
          const mid = new THREE.Mesh(new THREE.CircleGeometry(.035, 10), paper('#e2a13c')); mid.position.set(0, .3, .012); f.add(mid);
          f.rotation.y = R() * .5 - .25;
        }
      }
    }

    // a lamp on the jetty
    const lampLight = S.lamp(0, '#ffc77a', 5, 2); lampLight.position.set(JETTY.x1 - .05, JETTY.h + 1.45, JETTY.z1 - .35);
    {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(.035, .04, 1.4, 8), paper('#3e3a3a')); post.position.set(JETTY.x1 - .05, JETTY.h + .7, JETTY.z1 - .35); post.castShadow = true; scene.add(post);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(.1, 14, 10), bulbMat); bulb.position.set(JETTY.x1 - .05, JETTY.h + 1.42, JETTY.z1 - .35); scene.add(bulb);
      const hat = new THREE.Mesh(new THREE.ConeGeometry(.16, .14, 12, 1, true), paper('#3e3a3a', { side: THREE.DoubleSide })); hat.position.copy(bulb.position).y += .12; hat.castShadow = true; scene.add(hat);
    }

    const HOUSE = cottage(S, -2.55, H_GRASS, -1.15);
    // a path of paper stepping stones from the door into the meadow
    { const R = rng(51); for (let i = 0; i < 5; i++) { const st = slab(circlePts(.2 + R() * .05, 60 + i, 14).map(([x, z]) => [x * 1.2, z]), H_GRASS + .025, .025, paper('#e6dccb'), whiteEdge); st.position.set(HOUSE.x + .1 + i * .32 + (R() - .5) * .1, 0, HOUSE.z + HOUSE.d / 2 + .5 + i * .42); scene.add(st); } }

    /* ---------------- who lives here, and what they do when tapped (always the same) ---------------- */
    const mama = S.figure('mama', S.FIGS.grown);
    const sheep = S.figure('sheep', { w: 140, h: 150, draw: drawSheep, frames: 3, size: .95 });
    const duck = S.figure('duck', { w: 125, h: 100, draw: drawDuck, frames: 2, size: .7 });
    mama.x = .6; mama.z = -1.2; mama.face = 1;
    S.solid({ x: mama.x, z: mama.z, r: .55, fig: mama });
    sheep.x = 3.7; sheep.z = 1.1; sheep.face = -1;
    duck.x = 4.9; duck.z = 5.6; duck.face = 1; duck.y = duck.floatY = WATER_Y;
    S.solid({ x: sheep.x, z: sheep.z, r: .42, fig: sheep });
    sheep.onTap = () => { sheep.hopV = 3.6; sheep.face = girl.x < sheep.x ? -1 : 1; sfx.bleat(); confetti(sheep.x, .5, sheep.z, ['#f4ecdc', '#e2d6c1', '#fbf7f0'], 9, woolGeo, 1.6); };
    duck.onTap = () => { if (!(duck.dive > 0)) { duck.dive = 1.2; sfx.splash(); setTimeout(() => { sfx.quack(); duck.face *= -1; confetti(duck.x, WATER_Y + .2, duck.z + .1, ['#8fc3cc', '#f6efe2'], 10, S.bitGeo, 2.6); }, 700); } };
    mama.onTap = () => { mama.hopV = 2.4; sfx.neigh(); confetti(mama.x + .3, 1.6, mama.z, ['#f2a7c0', '#b9a3e8', '#9fd8d0', '#eac15a'], 14, S.starGeo, 2.2); };
    // the duck bobs, and goes under when it dives (in stop-motion steps)
    duck.act = tick => { const dv = duck.dive > 0 ? Math.sin(Math.max(0, Math.min(1, 1 - (duck.dive - .1) / 1.1)) * Math.PI) : 0; duck.sink = dv * .55; duck.tilt = Math.sin(tick * .4) * .04; duck.setFrame(duck.dive > 0 ? 1 : 0); };

    return {
      start: [.8, 2.2], uni: [-.4, 2.6],
      /** every frame: the door, the lamps, and who looks at her */
      step({ dt, eve }) {
        if (Math.hypot(girl.x - sheep.x, girl.z - sheep.z) < 2) sheep.face = girl.x < sheep.x ? -1 : 1;
        if (Math.hypot(girl.x - mama.x, girl.z - mama.z) < 2.5) mama.face = girl.x < mama.x ? -1 : 1;
        HOUSE.step({ dt, eve });
        lampLight.intensity = lerp(.0, 2.2, eve); bulbMat.emissiveIntensity = lerp(.4, 2.2, eve);
      },
      names: { house: HOUSE.toggle },
      spots: { house: [HOUSE.x + .5, 1.2, HOUSE.z + HOUSE.d / 2] },
      info: () => ({ door: HOUSE.open }),
    };
  },
};
