// Inside the castle: the great hall, a room of its own far beside the world, in through the castle's gate. The end of the
// story (PLAN.md "The castle: the end of the story"):
//   asleep       at first the hall is pale and quiet, the banners grey. At the back a tall golden door, three empty star
//                sockets over it. Three little puzzles each give a star:
//     paintings  three portraits hang crooked; a tap turns one a quarter; all three straight: a star
//     shapes     a star, a heart and a moon lie about; three stands with the same shapes; she carries each to its own stand
//     kitten     the castle kitten hides (its tail peeks out) behind the vase, the chest or the plant; found three times: a star
//   the door     three stars in, and the golden door opens: up to the tower top (set-kasteeltoren.js), the magic
//   the feast    back from the tower the hall unfolds like a pop-up book: colour, a long table, and everybody from the islands
//                pops up round it, her sister too. Food to tap. The music box: dance mode (everybody dances; when the music
//                stops everybody freezes; a few dances), then yawns, the candles go low, the girls fall asleep, and the
//                unicorn flies them home to bed (paper.js goHome)
//   out          walking down off the front of the hall, over the mat
import { THREE, paper, slab, card, PAPER } from './kit.js';
import { roomShell, roomShot } from './rooms.js';
import { cutout, FIGS } from './figures.js';
import { ANIMALS2 } from './animals2.js';
import { ANIMALS } from './animals.js';
import { PEOPLE, PROPS } from './people.js';
import { PEOPLE2 } from './people2.js';
import { STORY } from './story.js';
import { THINGS } from './things.js';
import { CARDS3 } from './cards3.js';

const W = 9.6, D = 4.8, H = 4.0;
const GOLD = '#e3b04b', GOLD2 = '#c9a46a';
/** a picture of a card drawing as a flat texture (the portraits) */
const tex = spec => { const t = new THREE.CanvasTexture(cutout(spec.w, spec.h, c => (spec.draw)(c, 0), PAPER, 1)); t.colorSpace = THREE.SRGBColorSpace; return t; };
/** the three shapes, as outlines round 0, 0 of about radius r */
const SHAPES = {
  ster: r => Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * .45 : r; return [Math.cos(a) * q, -Math.sin(a) * q]; }),
  hart: r => Array.from({ length: 28 }, (_, i) => { const a = i / 28 * Math.PI * 2; return [r * .06 * 16 * Math.sin(a) ** 3, r * .06 * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) + r * .1]; }),
  maan: r => { const out = []; for (let i = 0; i <= 16; i++) { const a = Math.PI * .25 + i / 16 * Math.PI * 1.5; out.push([Math.cos(a) * r, Math.sin(a) * r]); } for (let i = 16; i >= 0; i--) { const a = Math.PI * .4 + i / 16 * Math.PI * 1.2; out.push([Math.cos(a) * r * .72 - r * .32, Math.sin(a) * r * .72]); } return out; },
};
const SHAPECOL = { ster: '#f4a6c4', hart: '#e8505b', maan: '#f2c65c' };

export default {
  name: 'kasteelzaal',
  build(S) {
    const { girl, uni, sfx } = S, root = S.root, had = k => S.coins.had(k), mark = k => S.coins.had(k, true);
    let awakeK = 0, unfolding = -1;   // 0 asleep (pale), 1 the feast's colours
    const { put, box, rect, P } = roomShell(S, { W, D, H, floor: '#ece4dc', wall: '#f0e6da', side: '#e4d6c6', dark: '#3a2f3a', skirt: '#d9c3a8', windows: [[-3.6, 2.9, .7, 1.0], [3.6, 2.9, .7, 1.0]], openings: [[0, 1.4, 2.5]], sky: '#bfe3ea', frame: GOLD2, door: 'kasteelzaal', mat: '#d9534f',
      arrive: () => { girl.lift = 0; girl.poseName = null; } });
    const lerpMat = (m, a, b) => ({ m, a: new THREE.Color(a), b: new THREE.Color(b) });
    const fades = [];
    // the tiles and the carpet: pale while the castle sleeps, pink and red at the feast
    const tileM = paper('#e2dbe0'); fades.push(lerpMat(tileM, '#e2dbe0', '#f4c9d4'));
    for (let i = 0; i < 16; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2) root.add(slab(rect(-W / 2 + i * W / 16, -D / 2 + j * D / 8, -W / 2 + (i + 1) * W / 16, -D / 2 + (j + 1) * D / 8), .004, .004, tileM, tileM));
    const rugM = paper('#bfa9a6'); fades.push(lerpMat(rugM, '#bfa9a6', '#c9433f'));
    root.add(slab(rect(-.62, -D / 2 + .5, .62, D / 2 - .1), .012, .008, P(GOLD), P(GOLD))); root.add(slab(rect(-.52, -D / 2 + .5, .52, D / 2 - .1), .02, .008, rugM, rugM));
    // banners: grey, until the magic
    for (const [x, c] of [[-2.2, '#5f86b0'], [2.2, '#9a5fb0'], [-4.4, '#e98f8f'], [4.4, '#9ed9a0']]) { const m = paper('#c9c4cc'); fades.push(lerpMat(m, '#c9c4cc', c)); put(card([[-.3, 0], [.3, 0], [.3, -1.6], [0, -1.3], [-.3, -1.6]], .02, m), x, 3.85, -D / 2 + .08); put(new THREE.Mesh(new THREE.CircleGeometry(.15, 16), P('#f2c65c')), x, 3.15, -D / 2 + .11); }

    /* ---------------- the golden door, and the three star sockets over it ---------------- */
    put(card([[-.85, 0], [-.85, 2.55], [-.4, 2.95], [0, 3.05], [.4, 2.95], [.85, 2.55], [.85, 0]], .06, P(GOLD), P(GOLD2), [[[-.7, .02], [.7, .02], [.7, 2.5], [0, 2.85], [-.7, 2.5]].reverse()]), 0, 0, -D / 2 + .07);
    put(new THREE.Mesh(new THREE.PlaneGeometry(1.6, 3), P('#3a2f3a')), 0, 1.4, -D / 2 - .5);   // (behind the door: the stairs up in the dark)
    for (let i = 0; i < 5; i++) put(box(1.3, .1, .4, '#6f6082'), 0, .1 + i * .32, -D / 2 - .2 - i * .3);
    const leaves = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(s * .7, 0, -D / 2 + .1); g.userData.live = true; root.add(g);
      const l = card([[0, .02], [-s * .7, .02], [-s * .7, 2.48], [0, 2.48]].map(([x, y]) => [x, y]), .05, P('#d9a43e'), P(GOLD2)); g.add(l);
      for (const y of [.6, 1.5]) { const p = card([[-s * .12, y], [-s * .58, y], [-s * .58, y + .7], [-s * .12, y + .7]], .02, P('#f2c65c')); p.position.z = .04; g.add(p); }
      const knob = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), P('#fbf5ea')); knob.position.set(-s * .58, 1.2, .07); g.add(knob); return { g, s }; });
    const doorWall = S.wall(0, -D / 2 + .25, .8, .2); let doorOpen = 0;
    S.door('toren', [-.6, -D / 2 + .02, .6, -D / 2 + .4], [0, -D / 2 + 1.1], [0, -1], false, () => { girl.lift = 0; girl.poseName = null; if (S.shared.unfoldNext && unfolding < 0) { S.shared.unfoldNext = false; unfold(); } });
    // the three star holes: in a round golden plate on the floor before the door, where she can see the stars land (above the door they were out of the picture)
    const PZ = -D / 2 + .85, SOCK = [[-.42, PZ + .08], [0, PZ - .1], [.42, PZ + .08]], starShape = card(SHAPES.ster(.17), .03, P(GOLD));
    { const plate = new THREE.Mesh(new THREE.CircleGeometry(.75, 28), P(GOLD2)); plate.rotation.x = -Math.PI / 2; put(plate, 0, .025, PZ); const rim = new THREE.Mesh(new THREE.RingGeometry(.72, .78, 28), P(GOLD)); rim.rotation.x = -Math.PI / 2; put(rim, 0, .03, PZ); }
    const sockets = SOCK.map(([x, z]) => { const hole = new THREE.Mesh(starShape.geometry, P('#6f6082')); hole.rotation.x = -Math.PI / 2; hole.scale.set(1.08, 1.08, .3); put(hole, x, .03, z); return { x, z, star: null }; });
    const starMat = new THREE.MeshStandardMaterial({ color: '#f2c65c', emissive: '#f2c65c', emissiveIntensity: .6, roughness: .6 });
    const flying = [];
    /** a star for socket `i`: from where it was earned (the set's measure) up to the door, or straight there (`now`) */
    const giveStar = (i, from, now = false) => {
      if (sockets[i].star) return; mark('ster-' + i);
      const st = new THREE.Mesh(starShape.geometry, starMat); st.castShadow = true; root.add(st); sockets[i].star = st;
      st.rotation.x = -Math.PI / 2; if (now) { st.position.set(SOCK[i][0], .06, SOCK[i][1]); return; }
      st.position.set(...from); flying.push({ st, from: [...from], to: [SOCK[i][0], .06, SOCK[i][1]], t: 0 }); sfx.chime();
    };
    const stars = () => sockets.filter(q => q.star).length;

    /* ---------------- puzzle 1: the crooked paintings ---------------- */
    const PICS = [FIGS.grown, ANIMALS2.draakje, ANIMALS2.pauw];
    const paints = PICS.map((spec, i) => {
      const x = [-3.5, -2.35, -1.2][i], y = 2.0, g = new THREE.Group(); g.position.set(x, y, -D / 2 + .1); g.userData.live = true; root.add(g);
      g.add(card([[-.42, -.42], [.42, -.42], [.42, .42], [-.42, .42]], .05, P(GOLD2), P(GOLD2), [[[-.34, -.34], [-.34, .34], [.34, .34], [.34, -.34]]]));
      const k = Math.min(.66 / spec.w, .66 / spec.h), pic = new THREE.Mesh(new THREE.PlaneGeometry(spec.w * k, spec.h * k), new THREE.MeshStandardMaterial({ map: tex(spec), alphaTest: .5, roughness: .95 }));
      const bg = new THREE.Mesh(new THREE.PlaneGeometry(.68, .68), P(['#cfe8ee', '#f6e3c8', '#e2f0d8'][i])); bg.position.z = .01; g.add(bg); pic.position.z = .02; g.add(pic);
      const q = { g, x, q: [1, 2, 3][i], rot: [1, 2, 3][i], turns: 0 }; g.rotation.z = -q.rot * Math.PI / 2;
      S.tap(g, () => { if (q.q % 4 === 0 && paintsDone) return; S.walkThen(...S.at([x, -D / 2 + 1.3]), () => { }, 3); q.q++; q.turns++; sfx.click(); }, 'schilderij' + i);
      return q; });
    let paintsDone = false;

    /* ---------------- puzzle 2: the shapes and their stands ---------------- */
    const KINDS = ['ster', 'hart', 'maan'];
    const stands = KINDS.map((k, i) => { const x = [2.1, 3.0, 3.9][i], z = -D / 2 + .8, g = new THREE.Group(); g.position.set(x, 0, z); root.add(g);
      const c = new THREE.Mesh(new THREE.CylinderGeometry(.28, .32, .72, 14), P('#e8d5b0')); c.position.y = .36; c.castShadow = c.receiveShadow = true; g.add(c);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(.33, .33, .06, 14), P(GOLD2)); top.position.y = .75; g.add(top);
      const sign = card(SHAPES[k](.16), .02, P(GOLD)); sign.position.set(0, .4, .3); g.add(sign);
      S.solid({ x, z, r: .34 }); return { k, x, z, g, block: null }; });
    const blocks = KINDS.map((k, i) => { const g = new THREE.Group(); g.userData.live = true; root.add(g);
      const m = card(SHAPES[k](.24), .12, P(SHAPECOL[k]), P('#fbf5ea')); m.position.y = .26; m.castShadow = true; g.add(m);
      const at = [[-1.6, 1.5], [1.6, 1.7], [-3.9, -.2]][i]; g.position.set(at[0], 0, at[1]); return { k, g, at, held: false, on: null, wob: 0 }; });
    let holding = null; const me = {};
    const dropBlock = () => { if (!holding) return; const b = holding; holding = null; b.held = false; girl.poseName = null; b.at = [girl.x - S.at([0, 0])[0] + girl.face * .45, girl.z - S.at([0, 0])[1] + .15]; };
    blocks.forEach((b, i) => S.tap(b.g, () => { if (b.on || holding === b || S.playing()) return; S.walkThen(...S.at([b.at[0] - .4, b.at[1] + .2]), () => { if (holding) { const h = holding; dropBlock(); S.hands.free(me); } S.hands.take(me, dropBlock); holding = b; b.held = true; sfx.hop(); }, .9); }, 'vorm' + i));
    stands.forEach((st, i) => S.tap(st.g, () => { if (!holding || st.block) return; S.walkThen(...S.at([st.x, st.z + .75]), () => { if (!holding) return; const b = holding;
      if (b.k === st.k) { holding = null; b.held = false; S.hands.free(me); girl.poseName = null; b.on = st; st.block = b; sfx.chime(); S.confetti(...S.at([st.x, st.z]).flatMap((v, j) => j ? [1.1, v] : [v]), [SHAPECOL[b.k], '#fbf5ea'], 10, S.starGeo, 1.8);
        if (stands.every(q => q.block)) setTimeout(() => giveStar(1, [3.0, 1.4, -D / 2 + .8]), 600); }
      else { b.wob = 1; sfx.peep(); } }, .9); }, 'standaard' + i));

    /* ---------------- puzzle 3: the kitten hiding ---------------- */
    const HIDES = [[-4.25, .7, 'vaas'], [-4.05, -1.65, 'kist'], [4.35, .25, 'plant']];   // (at the sides and in a back corner: nothing big in front of the camera)
    const hideG = HIDES.map(([x, z, kind]) => { const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g);
      if (kind === 'vaas') { const v = new THREE.Mesh(new THREE.LatheGeometry([[.05, 0], [.3, .1], [.38, .45], [.3, .8], [.18, .95], [.24, 1.05]].map(([a, b]) => new THREE.Vector2(a, b)), 18), P('#8fc3e0')); v.castShadow = true; g.add(v); const band = new THREE.Mesh(new THREE.TorusGeometry(.37, .03, 6, 18), P('#fbf5ea')); band.rotation.x = Math.PI / 2; band.position.y = .45; g.add(band); }
      if (kind === 'kist') { const c = box(.8, .45, .5, '#b9875a'); c.position.y = .23; g.add(c); const l = box(.84, .12, .54, '#9a6e47'); l.position.y = .5; g.add(l); for (const s of [-.28, .28]) { const b2 = box(.06, .6, .56, GOLD); b2.position.set(s, .3, 0); g.add(b2); } }
      if (kind === 'plant') { const pot = new THREE.Mesh(new THREE.CylinderGeometry(.24, .18, .4, 12), P('#d9706c')); pot.position.y = .2; pot.castShadow = true; g.add(pot); for (const [dx, dy, r] of [[0, .75, .32], [-.2, .6, .24], [.2, .62, .26], [0, 1.0, .22]]) { const b2 = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), P('#7fa676')); b2.position.set(dx, dy, 0); b2.castShadow = true; g.add(b2); } }
      S.solid({ x, z, r: .42 }); return g; });
    const kit = S.figure('poes', CARDS3.poes), tail = S.figure('poesstaart', CARDS3.staart); kit.g.visible = false; tail.thing = true;
    let hideAt = 0, found = 0, kitOut = -1, kitDone = false;
    const placeTail = () => { const [x, z] = HIDES[hideAt]; [tail.x, tail.z] = S.at([x + .42, z - .05]); tail.face = 1; };
    kit.act = () => kit.setFrame(kitOut >= 0 && kitOut < 1.2 ? 1 : 0); tail.act = tick => tail.setFrame(Math.floor(tick / 6) % 2);
    const findKit = () => { if (kitOut >= 0 || kitDone) return; const [x, z] = HIDES[hideAt]; S.walkThen(...S.at([x + .2, z + .8]), () => { if (kitOut >= 0) return; found++; kitOut = 0; tail.g.visible = false; kit.g.visible = true; [kit.x, kit.z] = S.at([x + .3, z + .45]); kit.hopV = 3; sfx.meow(); S.confetti(kit.x, .6, kit.z, ['#f2b56b', '#fbf5ea', '#f4a6c4'], 10, S.starGeo, 1.8); }, 1.4); };
    hideG.forEach((g, i) => S.tap(g, () => { if (i === hideAt) findKit(); else { g.userData.wob = 1; sfx.peep(); } }, HIDES[i][2]));
    tail.onTap = findKit;

    /* ---------------- the feast: the table, the food, everybody ---------------- */
    const feast = new THREE.Group(); feast.visible = false; root.add(feast);
    const table = new THREE.Group(); table.position.set(0, 0, -.55); feast.add(table);
    { const top = box(6.4, .08, 1.0, '#fbf5ea'); top.position.y = .78; table.add(top); const hem = box(6.42, .2, 1.02, '#f4a6c4'); hem.position.y = .68; table.add(hem);
      for (const sx of [-3.0, 3.0]) for (const sz of [-.4, .4]) { const l = box(.08, .7, .08, '#9a6e47'); l.position.set(sx, .35, sz); table.add(l); }
      // a big cake in the middle: three layers, cream, a cherry
      for (const [r, h, y, c] of [[.42, .22, .93, '#f8dde4'], [.32, .2, 1.14, '#fbf5ea'], [.22, .18, 1.33, '#f4a6c4']]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 18), P(c)); l.position.y = y; l.castShadow = true; table.add(l); }
      const ch = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), P('#e8505b')); ch.position.y = 1.48; table.add(ch); }
    const tableWall = S.wall(0, -.55, 0, .55);   // (no wall until the table is there: before the feast it stood invisible in the way to the door)
    const FOOD = [['broodje', PROPS.broodje], ['appel', THINGS.appel], ['peer', THINGS.peer], ['ijsje', CARDS3.ijsje], ['spin', CARDS3.spin], ['appel', THINGS.appel]];
    const food = FOOD.map(([n, spec], i) => { const f = S.figure('feest-' + n + i, spec); f.thing = true; f.g.visible = false; const x = [-2.5, -1.6, -.8, .9, 1.7, 2.6][i]; [f.x, f.z] = S.at([x, -.35]); f.floatY = f.y = .82; f.face = 1;
      const q = { f, x, gone: 0 }; f.onTap = () => { if (q.gone > 0) return; S.walkThen(...S.at([x, .4]), () => { q.gone = 6; f.g.visible = false; sfx.munch(); girl.hopV = 2; S.confetti(f.x, 1.1, f.z, ['#f4a6c4', '#f2c65c', '#9ed9cf'], 8, S.starGeo, 1.6); }, .9); }; return q; });
    // everybody from the islands, behind the table and at its ends: [name, drawing, x, z, frame to stand in, frame to dance in]
    const GUESTS = [['bakker', PEOPLE.bakker, -2.9, -1.45, 2, 0], ['winkelier', PEOPLE.winkelier, -1.9, -1.45, 2, 0], ['heks', STORY.heks, -.9, -1.5, 3, 2], ['harpist', PEOPLE2.harpist, .9, -1.45, 0, 1],
      ['schilder', PEOPLE.schilder, 1.9, -1.45, 3, 0], ['ijsverkoper', CARDS3.ijsverkoper, 2.9, -1.45, 3, 0], ['fluitist', PEOPLE2.fluitist, -3.75, -.75, 0, 1], ['trompetter', PEOPLE2.trompetter, 3.8, -.95, 0, 1],
      ['gitarist', PEOPLE2.gitarist, -3.5, .45, 0, 1], ['suikerspin', CARDS3.suikerspin, 3.7, .0, 2, 1], ['kind', CARDS3.kind, -1.2, .9, 3, 0], ['muzikant', PEOPLE.muzikant, 2.3, .65, 0, 1],
      ['hond', ANIMALS.hond, -2.2, 1.3, 0, 0], ['pauw', ANIMALS2.pauw, 3.1, 1.3, 0, 0], ['draakje', ANIMALS2.draakje, 1.4, 1.5, 0, 0], ['lam', ANIMALS2.lam, -1.7, 1.95, 0, 0], ['alpaca', CARDS3.alpaca, -3.2, 1.55, 0, 3], ['eend', ANIMALS.eend, 3.5, 1.95, 0, 0]];
    const guests = GUESTS.map(([n, spec, x, z, rest, dance], i) => { const f = S.figure('feest-' + n, spec); f.g.visible = false; [f.x, f.z] = S.at([x, z]); f.face = x > 0 ? -1 : 1; f.thing = false;
      const q = { f, rest, dance, pop: -1, ph: i * .37 }; f.act = tick => f.setFrame(dancing && !frozen ? (Math.floor((tick + i * 3) / 4) % 2 ? q.dance : q.rest) : q.rest); f.onTap = () => { f.hopV = 2.4; sfx.hello(); }; return q; });
    const garland = new THREE.Group(); garland.scale.x = .01; feast.add(garland);
    for (let i = 0; i < 18; i++) { const x = -4.3 + i * .5; const c = card([[-.16, 0], [.16, 0], [0, -.34]], .01, P(['#f4a6c4', '#f2c65c', '#9ed9cf', '#bba6ea'][i % 4]), null); c.position.set(x, 3.55 - Math.sin(i / 17 * Math.PI) * .3, -D / 2 + .3); garland.add(c); }

    /* ---------------- the music box: dance mode ---------------- */
    const gram = new THREE.Group(); gram.position.set(4.25, 0, 1.6); root.add(gram);
    { const b = box(.55, .35, .45, '#9a6e47'); b.position.y = .55; gram.add(b); const leg = new THREE.Mesh(new THREE.CylinderGeometry(.12, .18, .38, 10), P('#7a5a3e')); leg.position.y = .19; gram.add(leg);
      const horn = new THREE.Mesh(new THREE.ConeGeometry(.32, .7, 16, 1, true), P(GOLD, { side: THREE.DoubleSide })); horn.position.set(.15, 1.05, -.05); horn.rotation.z = -.9; horn.castShadow = true; gram.add(horn);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .02, 18), P('#33262E')); disc.position.y = .74; disc.userData.live = true; gram.add(disc); gram.userData.disc = disc; }
    S.solid({ x: 4.25, z: 1.6, r: .35 });
    let wasHere = false, ended = false, dancing = false, frozen = false, round = 0, dt0 = 0, song = null, sleepy = -1, dances = 0;
    const startRound = () => { round++; frozen = false; dt0 = 0; song = sfx.song('dans', 'guitar'); };
    S.tap(gram, () => { if (!awake() || sleepy >= 0) return; if (!dancing) { dancing = true; round = 0; dances++; startRound(); } else if (frozen) startRound(); }, 'muziekdoos');

    /* ---------------- the chandelier ---------------- */
    const ch = new THREE.Group(); ch.position.set(0, 3.4, .2); root.add(ch);
    const flame = new THREE.MeshStandardMaterial({ color: '#ffd98a', emissive: '#ffb84d', emissiveIntensity: 1.4, roughness: .8 });
    { const ring = new THREE.Mesh(new THREE.TorusGeometry(.7, .04, 6, 24), P(GOLD)); ring.rotation.x = Math.PI / 2; ch.add(ring); const chain = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, 1, 4), P(GOLD2)); chain.position.y = .5; ch.add(chain);
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, c = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .16, 6), P('#fbf5ea')); c.position.set(Math.cos(a) * .7, .1, Math.sin(a) * .7); ch.add(c); const f = new THREE.Mesh(new THREE.SphereGeometry(.035, 6, 5), flame); f.scale.y = 1.6; f.position.set(Math.cos(a) * .7, .22, Math.sin(a) * .7); ch.add(f); } }
    const light = S.lamp(0, '#ffcf8a', 10, 1.3); light.position.set(0, 3.2, .2); let candles = 1;

    /* ---------------- waking: the pop-up unfolding, after the tower's magic ---------------- */
    const awake = () => had('magie');
    const unfoldToy = { look: S.at([0, -.3]), rate: .8, shot: { span: 10.5, tall: 7.4, rise: .3, riseTall: .42, fx: 1, fz: 1, lag: 1 }, step() { } };
    const unfold = () => { unfolding = 0; [girl.x, girl.z] = S.at([-.3, 1.35]); girl.face = 1; if (uni && !uni.away) [uni.x, uni.z] = S.at([-1.3, 1.7]); S.play(unfoldToy); sfx.song('fanfare', 'trumpet'); const z = S.zus(); if (z) z.out = true; };   // (in front of the table, where she sees it all happen)
    const setAwake = k => { awakeK = k; for (const q of fades) q.m.color.lerpColors(q.a, q.b, k); };
    setAwake(0);

    return {
      start: [0, D / 2 - .95], uni: [-.9, D / 2 - .85],
      shadow: { follow: 20 },
      step({ dt, time }) {
        // a new beginning (the story starts again after the flight home, paper.js goHome): the hall sleeps again, the puzzles undone
        for (let i = 0; i < 3; i++) if (sockets[i].star && !had('ster-' + i) && !flying.length) { root.remove(sockets[i].star); sockets[i].star = null;
          if (i === 0) { paintsDone = false; paints.forEach((q, k) => { q.q = q.rot = [1, 2, 3][k]; }); }
          if (i === 1) { for (const b of blocks) { b.on = null; b.held = false; b.at = [[-1.6, 1.5], [1.6, 1.7], [-3.9, -.2]][KINDS.indexOf(b.k)]; } for (const st of stands) st.block = null; }
          if (i === 2) { found = 0; hideAt = 0; kitDone = false; kitOut = -1; kit.g.visible = false; } }
        if (!awake() && awakeK > 0 && unfolding < 0) { setAwake(0); feast.visible = false; table.scale.y = .01; garland.scale.x = .01; for (const q of guests) { q.f.g.visible = false; q.pop = -1; } for (const q of food) q.f.g.visible = false; dancing = false; frozen = false; sleepy = -1; }
        // the puzzles, once solved in this save, stay solved
        for (let i = 0; i < 3; i++) if (had('ster-' + i) && !sockets[i].star) giveStar(i, null, true);
        // the paintings turn to where they are asked; all straight: a star
        for (const q of paints) { q.rot += (q.q - q.rot) * Math.min(1, dt * 8); q.g.rotation.z = -q.rot * Math.PI / 2; }
        if (sockets[0].star) { paintsDone = true; for (const q of paints) q.q = Math.ceil(q.q / 4) * 4; }
        if (!paintsDone && paints.every(q => q.q % 4 === 0) && paints.every(q => Math.abs(q.rot - q.q) < .02)) { paintsDone = true; sfx.hello(); for (const q of paints) S.confetti(...S.at([q.x, -D / 2 + .3]).flatMap((v, j) => j ? [2.0, v] : [v]), ['#f2c65c', '#fbf5ea'], 8, S.starGeo, 1.6); setTimeout(() => giveStar(0, [-2.35, 2.0, -D / 2 + .2]), 700); }
        // the blocks: lying, carried, wobbling, on their stands
        for (const b of blocks) {
          if (sockets[1].star && !b.on) { const st = stands.find(q => q.k === b.k); b.on = st; st.block = b; }
          if (b.on) { b.g.position.set(b.on.x, .78, b.on.z); b.g.rotation.y = Math.sin(time + b.on.x) * .2; }
          else if (b.held && !S.playing()) { const h = S.hand(), [ox, oz] = S.at([0, 0]); girl.poseName = 'hold'; b.g.position.set(h.x - ox + girl.face * .1, h.y - .3, h.z - oz + .05); b.g.rotation.z = Math.sin(b.wob * 20) * b.wob * .4; }
          else { b.g.position.set(b.at[0], 0, b.at[1]); b.g.rotation.z = 0; }
          b.wob = Math.max(0, b.wob - dt * 1.5);
        }
        // the kitten: out for a moment when found, then off to hide again; three times and it brings a star
        if (sockets[2].star) { kitDone = true; tail.g.visible = false; kit.g.visible = !awake(); [kit.x, kit.z] = S.at([-3.4, -1.2]); }
        else if (kitOut >= 0) { kitOut += dt; if (kitOut > 1.8) { kitOut = -1; kit.g.visible = false;
          if (found >= 3) { kitDone = true; kit.g.visible = true; [kit.x, kit.z] = S.at([-3.4, -1.2]); kit.hopV = 2.6; sfx.meow(); giveStar(2, [-3.4, .8, -1.2]); }
          else { hideAt = (hideAt + 1) % HIDES.length; placeTail(); tail.g.visible = true; } } }
        else if (!kitDone) { tail.g.visible = true; placeTail(); }
        for (const g of hideG) { g.userData.wob = Math.max(0, (g.userData.wob || 0) - dt * 2); g.rotation.z = Math.sin((g.userData.wob || 0) * 18) * (g.userData.wob || 0) * .08; }
        // stars flying to the door
        for (let i = flying.length - 1; i >= 0; i--) { const f = flying[i]; f.t += dt; const k = Math.min(1, f.t / 1.3), e = k * k * (3 - 2 * k);
          f.st.position.set(f.from[0] + (f.to[0] - f.from[0]) * e, f.from[1] + (f.to[1] - f.from[1]) * e + Math.sin(k * Math.PI) * 1.2, f.from[2] + (f.to[2] - f.from[2]) * e); f.st.rotation.z = k * 6.283; f.st.rotation.x = -Math.PI / 2 * k;
          if (k >= 1) { flying.splice(i, 1); sfx.note(784); S.confetti(...S.at([f.to[0], f.to[2]]).flatMap((v, j) => j ? [f.to[1], v] : [v]), ['#f2c65c', '#fbf5ea'], 10, S.starGeo, 1.6); } }
        // the golden door opens when all three stars are in
        const open = stars() === 3 && !flying.length ? 1 : 0; doorOpen += (open - doorOpen) * Math.min(1, dt * 2); for (const l of leaves) l.g.rotation.y = l.s * doorOpen * 1.5; doorWall[2] = open ? 0 : .8;
        starMat.emissiveIntensity = .6 + Math.sin(time * 3) * .2;
        tableWall[2] = feast.visible && table.scale.y > .5 ? 3.25 : 0;
        // the unfolding: colour, the table, the garland, everybody popping up, one by one
        if (unfolding >= 0) { unfolding += dt; const u = unfolding;
          setAwake(Math.min(1, u / 2)); feast.visible = true; const tk = Math.min(1, Math.max(0, (u - .6) / .6)); table.scale.set(1, Math.max(.01, tk * (1 + Math.sin(tk * Math.PI) * .15)), 1); garland.scale.x = Math.max(.01, Math.min(1, (u - 1.2) / .8));
          guests.forEach((q, i) => { const at = 2 + i * .22; if (u > at && q.pop < 0) { q.pop = 0; q.f.g.visible = true; q.f.hopV = 3; sfx.click(); S.confetti(q.f.x, 1.2, q.f.z, ['#f4a6c4', '#f2c65c', '#9ed9cf', '#bba6ea'], 6, S.starGeo, 1.4); } });
          if (u > 2 + guests.length * .22 + .3) food.forEach(q => { q.f.g.visible = q.gone <= 0; });
          const z = S.zus(); if (z) { [z.x, z.z] = S.at([.7, 1.4]); z.face = -1; }
          if (u > 2 + guests.length * .22 + 1.4) { unfolding = -1; mark('feest'); S.stopPlay(); sfx.chime(); } }
        else if (awake() && awakeK < 1 && !S.shared.unfoldNext) { setAwake(1); feast.visible = true; table.scale.y = 1; garland.scale.x = 1; for (const q of guests) q.f.g.visible = true; food.forEach(q => { q.f.g.visible = true; }); const z = S.zus(); if (z && S.where() === 'kasteelzaal') { z.out = true; [z.x, z.z] = S.at([.7, 1.4]); } }
        // the paintings, blocks, stands and kitten have done their work: at the feast they make room
        for (const st of stands) st.g.visible = !awake() || unfolding >= 0; for (const b of blocks) b.g.visible = !awake() || unfolding >= 0;
        for (const q of food) if (q.gone > 0) { q.gone -= dt; if (q.gone <= 0) { q.f.g.visible = true; q.f.hopV = 1.2; } }
        // dance mode: everybody dances while the music plays; when it stops, everybody freezes; after three dances, yawns
        const z = S.zus();
        if (dancing) { dt0 += dt; gram.userData.disc.rotation.y += frozen ? 0 : dt * 4;
          if (!frozen && dt0 > 6.5) { frozen = true; dt0 = 0; if (song && song.stop) song.stop(); }
          else if (frozen && dt0 > 2.4) { if (round >= 3) { dancing = false; frozen = false; sleepy = 0; } else startRound(); }
          for (const q of guests) { if (!q.f.g.visible) continue; if (!frozen) { const b = (time * 2.2 + q.ph) % 1; if (b < dt * 2.2 && !(q.f.hop > 0)) q.f.hopV = 2.2; q.f.lean = Math.sin(time * 4.4 + q.ph * 6) * .12; if (Math.floor(time * 1.1 + q.ph) % 2 === 0) q.f.face = Math.sign(Math.sin(time * 1.1 + q.ph)) || 1; } }
          if (!S.playing() && !girl.walking) { if (!frozen) { const beat = Math.floor(time * 2.2); girl.view = ['front', 'side', 'front', 'back'][beat % 4]; girl.poseName = beat % 2 ? 'up' : null; if ((time * 2.2) % 1 < dt * 2.2) girl.hopV = 2; } else girl.poseName = 'up'; }
          if (z && z.out) { if (!frozen) { const beat = Math.floor(time * 2.2 + .5); z.view = ['side', 'front', 'back', 'front'][beat % 4]; z.poseName = beat % 2 ? null : 'up'; if ((time * 2.2 + .5) % 1 < dt * 2.2) z.hopV = 2; } else z.poseName = 'up'; } }
        else { if (!S.playing() && girl.poseName === 'up' && sleepy < 0) girl.poseName = null; for (const q of guests) q.f.lean *= Math.exp(-dt * 4); }
        // her sister comes along to the feast, and goes home to bed when she leaves the castle (not when the unicorn flies them both)
        const here = S.where() === 'kasteelzaal'; if (z && wasHere && !here && !ended) { z.out = false; z.poseName = null; } if (here && !wasHere) ended = false; wasHere = here;
        // sleepy: the candles go low, the girls sit down and their eyes close; then home to bed
        if (sleepy >= 0) { const was = sleepy; sleepy += dt; candles = Math.max(.25, 1 - sleepy / 4);
          if (was < .3 && sleepy >= .3) { S.night(); sfx.song('twinkle', 'musicbox'); for (const q of guests) { q.f.lean = 0; } }
          if (sleepy > 1) { girl.poseName = 'sit'; girl.view = 'front'; if (z && z.out) { z.poseName = 'sit'; z.view = 'front'; } }
          if (sleepy > 3.2) { girl.asleep = true; if (z) z.dozing = true; for (const q of guests) q.f.lean = Math.sin(time * .8 + q.ph) * .05; }
          if (was < 6.5 && sleepy >= 6.5) { sleepy = -1; candles = 1; ended = true; S.ending(); } }
        light.intensity += ((candles * 2.1) - light.intensity) * Math.min(1, dt * 3); flame.emissiveIntensity = (1.2 + Math.sin(time * 11) * .15) * candles;
      },
      toys: { zaal: { solve: () => { for (let i = 0; i < 3; i++) giveStar(i, null, true); }, state: () => ({ stars: stars(), paints: paints.map(q => ((q.q % 4) + 4) % 4), shapes: stands.map(q => !!q.block), holding: holding ? holding.k : null, found, hideAt, door: doorOpen > .5, awake: awake(), unfolding: unfolding >= 0, dancing, frozen, round, sleepy: sleepy >= 0, dances, guests: guests.filter(q => q.f.g.visible).length }) } },
      shots: [{ ...roomShot('kasteelzaal', 9.0, 6.8), fx: .55 }],
      spots: { door: [0, 1.2, -D / 2 + .1], paint0: [-3.5, 2.0, -D / 2 + .1], paint1: [-2.35, 2.0, -D / 2 + .1], paint2: [-1.2, 2.0, -D / 2 + .1], stand0: [2.1, .5, -D / 2 + .8], stand1: [3.0, .5, -D / 2 + .8], stand2: [3.9, .5, -D / 2 + .8],
        block0: [-1.6, .25, 1.5], block1: [1.6, .25, 1.7], block2: [-3.9, .25, -.2], vaas: [-4.25, .5, .7], kist: [-4.05, .4, -1.65], plant: [4.35, .6, .25], muziekdoos: [4.25, .7, 1.6] },
      places: { start: [0, D / 2 - .95], door: [0, -D / 2 + 1.1], paintings: [-2.35, -D / 2 + 1.3], stands: [3.0, -D / 2 + 1.6], musicbox: [3.6, 2.0] },
    };
  },
};
