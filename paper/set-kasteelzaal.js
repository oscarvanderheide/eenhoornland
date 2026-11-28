// Inside the castle: the great hall, a room of its own far beside the world, in through the castle's gate. The end of the
// story (PLAN.md "The castle: the end of the story"):
//   the hall     the castle's people live here, each with a few funny things to do, one more at every tap (Oscar: "some
//                sort of hall with some characters with funny/cute interactions (like a knight, a jester, a lady)")
//     knight     salutes; then his visor clangs shut and he stumbles about blind; then he bows and his plume flops over
//     jester     juggles three balls; then a cartwheel and he walks about on his hands; then a bow, tongue out
//     lady       curtsies (and she curtsies back); then she blows her a kiss, a heart floats over; then she giggles behind her fan
//     paintings  a tap and a portrait swings crooked, and back
//   the door     the golden door at the back opens when she comes near: the treasure room (set-schatkamer.js), and from
//                there the tower's stair (set-kasteeltrap.js) up to the magic at the top (set-kasteeltoren.js)
//   the feast    back from the tower the hall unfolds like a pop-up book: colour, a long table, and everybody from the islands
//                pops up round it, her sister too. Food to tap. The music box: dance mode. The table folds away, everybody
//                makes a ring round the middle and cheers, and in the middle dance the girls, the witch and her unicorn;
//                when the music stops everybody freezes; three dances, then yawns, the candles go low, the girls fall
//                asleep, and the unicorn flies them home to bed (paper.js goHome)
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
import { CARDS6 } from './cards6.js';

const W = 9.6, D = 4.8, H = 4.0;
const GOLD = '#e3b04b', GOLD2 = '#c9a46a';
/** a picture of a card drawing as a flat texture (the portraits) */
const tex = spec => { const t = new THREE.CanvasTexture(cutout(spec.w, spec.h, c => (spec.draw)(c, 0), PAPER, 1)); t.colorSpace = THREE.SRGBColorSpace; return t; };
const MID = [0, .45];   // the middle of the dance

export default {
  name: 'kasteelzaal',
  build(S) {
    const { girl, uni, sfx } = S, root = S.root, had = k => S.coins.had(k), mark = k => S.coins.had(k, true);
    let awakeK = 0, unfolding = -1;   // 0 the hall as it is, 1 the feast's colours
    const { put, box, rect, P } = roomShell(S, { W, D, H, floor: '#ece4dc', wall: '#f0e6da', side: '#e4d6c6', dark: '#3a2f3a', skirt: '#d9c3a8', windows: [[-3.6, 2.9, .7, 1.0], [3.6, 2.9, .7, 1.0]], openings: [[0, 1.4, 2.5]], sky: '#bfe3ea', frame: GOLD2, door: 'kasteelzaal', mat: '#d9534f',
      arrive: () => { girl.lift = 0; girl.poseName = null; } });
    const local = () => { const [ox, oz] = S.at([0, 0]); return [girl.x - ox, girl.z - oz]; };
    const lerpMat = (m, a, b) => ({ m, a: new THREE.Color(a), b: new THREE.Color(b) });
    const fades = [];
    // the tiles and the carpet: soft at first, pink and red at the feast
    const tileM = paper('#e8dde2'); fades.push(lerpMat(tileM, '#e8dde2', '#f4c9d4'));
    for (let i = 0; i < 16; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2) root.add(slab(rect(-W / 2 + i * W / 16, -D / 2 + j * D / 8, -W / 2 + (i + 1) * W / 16, -D / 2 + (j + 1) * D / 8), .004, .004, tileM, tileM));
    const rugM = paper('#c98480'); fades.push(lerpMat(rugM, '#c98480', '#c9433f'));
    root.add(slab(rect(-.62, -D / 2 + .5, .62, D / 2 - .1), .012, .008, P(GOLD), P(GOLD))); root.add(slab(rect(-.52, -D / 2 + .5, .52, D / 2 - .1), .02, .008, rugM, rugM));
    for (const [x, c] of [[-2.2, '#5f86b0'], [2.2, '#9a5fb0'], [-4.4, '#e98f8f'], [4.4, '#9ed9a0']]) { const m = paper(c); put(card([[-.3, 0], [.3, 0], [.3, -1.6], [0, -1.3], [-.3, -1.6]], .02, m), x, 3.85, -D / 2 + .08); put(new THREE.Mesh(new THREE.CircleGeometry(.15, 16), P('#f2c65c')), x, 3.15, -D / 2 + .11); }

    /* ---------------- the golden door to the treasure room: it opens when she comes near ---------------- */
    put(card([[-.85, 0], [-.85, 2.55], [-.4, 2.95], [0, 3.05], [.4, 2.95], [.85, 2.55], [.85, 0]], .06, P(GOLD), P(GOLD2), [[[-.7, .02], [.7, .02], [.7, 2.5], [0, 2.85], [-.7, 2.5]].reverse()]), 0, 0, -D / 2 + .07);
    put(new THREE.Mesh(new THREE.PlaneGeometry(1.6, 3), new THREE.MeshBasicMaterial({ color: '#7a5a2e' })), 0, 1.4, -D / 2 - .6);   // (behind the door: the warm gold of the treasure room)
    for (const [x, y, r] of [[-.35, .25, .35], [.3, .18, .28], [0, .1, .45]]) { const h = new THREE.Mesh(new THREE.ConeGeometry(r, r * .9, 14), new THREE.MeshStandardMaterial({ color: '#f2c65c', emissive: '#c98f1e', emissiveIntensity: .5 })); h.position.set(x, y + r * .2, -D / 2 - .45); root.add(h); }
    const leaves = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(s * .7, 0, -D / 2 + .1); g.userData.live = true; root.add(g);
      g.add(card([[0, .02], [-s * .7, .02], [-s * .7, 2.48], [0, 2.48]], .05, P('#d9a43e'), P(GOLD2)));
      for (const y of [.6, 1.5]) { const p = card([[-s * .12, y], [-s * .58, y], [-s * .58, y + .7], [-s * .12, y + .7]], .02, P('#f2c65c')); p.position.z = .04; g.add(p); }
      const knob = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), P('#fbf5ea')); knob.position.set(-s * .58, 1.2, .07); g.add(knob); return { g, s }; });
    let doorOpen = 0;
    S.door('schatkamer', [-.6, -D / 2 + .02, .6, -D / 2 + .4], [0, -D / 2 + 1.1], [0, -1], false, () => { girl.lift = 0; girl.poseName = null; });
    // back from the tower's top, after the magic: a cut straight to here, and the hall unfolds (the door's zone is nowhere: only S.through gets here)
    S.door('feest', [-90, -90, -89, -89], [-.3, 1.35], [0, -1], false, () => { girl.lift = 0; girl.poseName = null; if (S.shared.unfoldNext && unfolding < 0) { S.shared.unfoldNext = false; unfold(); } });

    /* ---------------- the portraits: a tap swings one crooked, and back ---------------- */
    const paints = [FIGS.grown, ANIMALS2.draakje, ANIMALS2.pauw].map((spec, i) => {
      const x = [-3.5, -2.35, -1.2][i], g = new THREE.Group(); g.position.set(x, 2.0, -D / 2 + .1); g.userData.live = true; root.add(g);
      g.add(card([[-.42, -.42], [.42, -.42], [.42, .42], [-.42, .42]], .05, P(GOLD2), P(GOLD2), [[[-.34, -.34], [-.34, .34], [.34, .34], [.34, -.34]]]));
      const k = Math.min(.66 / spec.w, .66 / spec.h), pic = new THREE.Mesh(new THREE.PlaneGeometry(spec.w * k, spec.h * k), new THREE.MeshStandardMaterial({ map: tex(spec), alphaTest: .5, roughness: .95 }));
      const bg = new THREE.Mesh(new THREE.PlaneGeometry(.68, .68), P(['#cfe8ee', '#f6e3c8', '#e2f0d8'][i])); bg.position.z = .01; g.add(bg); pic.position.z = .02; g.add(pic);
      const q = { g, sw: 0 }; S.tap(g, () => { q.sw = 1; sfx.click(); }, 'schilderij' + i); return q; });

    /* ---------------- the castle's people ---------------- */
    const FOLK = [['ridder', -1.35, -1.55, 1], ['nar', 2.7, .1, -1], ['jonkvrouw', -3.1, .05, 1]];
    const folk = FOLK.map(([n, x, z, face]) => { const f = S.figure(n, CARDS6[n]); [f.x, f.z] = S.at([x, z]); f.face = face; f.floatY = f.y = 0;
      const q = { n, f, home: [x, z], face, taps: 0, how: null, t: 0, frame: 0, dx: 0 }; f.act = () => f.setFrame(q.frame); return q; });
    const [knight, jester, lady] = folk;
    // the jester's three balls, and the lady's heart
    const balls = ['#f2c65c', '#bba6ea', '#9ed9cf'].map(c => { const m = new THREE.Mesh(new THREE.SphereGeometry(.08, 10, 8), P(c)); m.visible = false; m.userData.live = true; m.castShadow = true; root.add(m); return m; });
    const heartM = card(Array.from({ length: 28 }, (_, i) => { const a = i / 28 * Math.PI * 2; return [.012 * 16 * Math.sin(a) ** 3, .012 * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a))]; }), .02, P('#f4a6c4'));
    heartM.visible = false; heartM.userData.live = true; root.add(heartM);
    const near = q => { const [hx, hz] = q.home, s = hx > 0 ? -1 : 1; return S.at([hx + s * .95, hz + .45]); };
    const DO = {
      ridder: ['salute', 'clang', 'bow'], nar: ['juggle', 'flip', 'bow'], jonkvrouw: ['curtsy', 'kiss', 'giggle'],
    };
    const begin = q => { const how = DO[q.n][q.taps % 3]; q.taps++; q.how = how; q.t = 0;
      if (how === 'salute') { sfx.hello(); }
      if (how === 'clang') { sfx.clang(); }
      if (how === 'bow') { sfx[q.n === 'nar' ? 'giggle' : 'hello'](); if (q.n === 'nar') sfx.jingle(); }
      if (how === 'juggle') { sfx.jingle(); }
      if (how === 'flip') { q.f.hopV = 4.2; sfx.boing(); sfx.jingle(); }
      if (how === 'curtsy') { sfx.hello(); }
      if (how === 'kiss') { sfx.chime(); }
      if (how === 'giggle') { sfx.giggle(); } };
    for (const q of folk) q.f.onTap = () => { if (q.how || S.playing() || dancing || sleepy >= 0) return; begin(q); if (Math.hypot(girl.x - q.f.x, girl.z - q.f.z) > 2.6) S.walkThen(...near(q), () => { girl.face = Math.sign(q.f.x - girl.x) || 1; }, .5); };
    const stepFolk = (dt, time) => {
      for (const q of folk) { const f = q.f; if (dancing || unfolding >= 0) { q.how = null; continue; }
        if (!q.how) { q.frame = 0; f.lean *= Math.exp(-dt * 6); continue; }
        q.t += dt; const t = q.t;
        if (q.how === 'salute') { q.frame = 1; if (t > 1.6) q.how = null; }
        else if (q.how === 'clang') { q.frame = 2;   // blind: he stumbles left and right, arms out, and finds his way back
          const s = Math.sin(t * 3.2); q.dx = s * .45; f.lean = Math.sin(t * 7) * .12; f.face = Math.cos(t * 3.2) > 0 ? 1 : -1; if (t > .8 && Math.floor(t * 2.4) !== Math.floor((t - dt) * 2.4)) sfx.thud();
          if (t > 2.6) { q.dx *= .8; } if (t > 3.0) { q.how = null; q.dx = 0; f.face = q.face; f.hopV = 2.2; sfx.clang(); } }
        else if (q.how === 'bow') { q.frame = 3; if (q.n === 'nar' && t < .1) S.confetti(f.x, 1.6, f.z, ['#f4a6c4', '#9ed9cf', '#f2c65c'], 8, S.starGeo, 1.4); if (t > 1.6) q.how = null; }
        else if (q.how === 'juggle') { q.frame = 1; balls.forEach((b, i) => { const ph = (t * 1.6 + i / 3) % 1, side = Math.floor(t * 1.6 + i / 3) % 2 ? 1 : -1; b.visible = true;
            const [ox, oz] = S.at([0, 0]); b.position.set(f.x - ox + (ph - .5) * .5 * side + f.face * .12, 1.25 + Math.sin(ph * Math.PI) * .75, f.z - oz + .1); });
          if (t > 3.2) { q.how = null; for (const b of balls) b.visible = false; } }
        else if (q.how === 'flip') {   // a cartwheel up, then he walks on his hands, then over again onto his feet
          if (t < .55) { q.frame = 0; f.lean = -(t / .55) * Math.PI * 2 * q.face; }
          else if (t < 2.6) { q.frame = 2; f.lean = 0; q.dx = Math.sin((t - .55) * 2.2) * .5; if (Math.floor(t * 3) !== Math.floor((t - dt) * 3)) sfx.jingle(); }
          else if (t < 2.62) { f.hopV = 4.2; sfx.boing(); }
          else if (t < 3.2) { q.frame = 0; f.lean = -((t - 2.62) / .58) * Math.PI * 2 * q.face; }
          else { f.lean = 0; q.dx = 0; q.how = null; S.confetti(f.x, 1.2, f.z, ['#f4a6c4', '#9ed9cf'], 8, S.starGeo, 1.4); } }
        else if (q.how === 'curtsy') { q.frame = 1; if (t > .35 && t - dt <= .35 && Math.hypot(girl.x - f.x, girl.z - f.z) < 3.2) { girl.hopV = 1.4; girl.face = Math.sign(f.x - girl.x) || 1; } if (t > 1.8) q.how = null; }
        else if (q.how === 'kiss') { q.frame = 2; const k = Math.min(1, Math.max(0, (t - .3) / 1.4)), [ox, oz] = S.at([0, 0]);
          heartM.visible = t > .3 && k < 1; heartM.position.set(f.x - ox + (girl.x - f.x) * k, 1.4 + Math.sin(k * Math.PI) * .5 + (girl.y + .9 - 1.4) * k, f.z - oz + (girl.z - f.z) * k + .1); heartM.scale.setScalar(1 + Math.sin(t * 9) * .15);
          if (k >= 1 && t - dt < 1.7) { girl.hopV = 2.8; sfx.chime(); S.confetti(girl.x, girl.y + 1.1, girl.z, ['#f4a6c4', '#f8dde4', '#e8505b'], 12, S.starGeo, 1.6); }
          if (t > 2.4) { q.how = null; heartM.visible = false; } }
        else if (q.how === 'giggle') { q.frame = 3; f.lean = Math.sin(t * 14) * .05; if (t > 1.8) { q.how = null; f.lean = 0; } }
        if (!q.how) q.frame = 0;
        const [x, z] = S.at([q.home[0] + q.dx, q.home[1]]); f.x = x; f.z = z; }
    };
    S.solid({ x: knight.home[0], z: knight.home[1], r: .35 }); S.solid({ x: lady.home[0], z: lady.home[1], r: .35 }); S.solid({ x: jester.home[0], z: jester.home[1], r: .35 });

    /* ---------------- the feast: the table, the food, everybody ---------------- */
    const feast = new THREE.Group(); feast.visible = false; root.add(feast);
    // two long tables, the red carpet running between them to the golden door (the treasure room stays open at the feast)
    const TZ = -1.0, table = new THREE.Group(); table.position.set(0, 0, TZ); feast.add(table);
    for (const s of [-1, 1]) { const cx = s * 2.2, top = box(2.6, .08, .9, '#fbf5ea'); top.position.set(cx, .78, 0); table.add(top); const hem = box(2.62, .2, .92, '#f4a6c4'); hem.position.set(cx, .68, 0); table.add(hem);
      for (const sx of [-1.2, 1.2]) for (const sz of [-.35, .35]) { const l = box(.08, .7, .08, '#9a6e47'); l.position.set(cx + sx, .35, sz); table.add(l); } }
    for (const [r, h, y, c] of [[.4, .22, .93, '#f8dde4'], [.3, .2, 1.14, '#fbf5ea'], [.2, .18, 1.33, '#f4a6c4']]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 18), P(c)); l.position.set(2.2, y, 0); l.castShadow = true; table.add(l); }
    { const ch = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), P('#e8505b')); ch.position.set(2.2, 1.48, 0); table.add(ch); }
    const tableWalls = [S.wall(-2.2, TZ, 0, .5), S.wall(2.2, TZ, 0, .5)];   // (no walls until the tables are there)
    const FOOD = [['broodje', PROPS.broodje], ['appel', THINGS.appel], ['peer', THINGS.peer], ['ijsje', CARDS3.ijsje], ['spin', CARDS3.spin], ['appel', THINGS.appel]];
    const food = FOOD.map(([n, spec], i) => { const f = S.figure('feest-' + n + i, spec); f.thing = true; f.g.visible = false; const x = [-3.1, -2.4, -1.7, -1.1, 1.3, 3.1][i]; [f.x, f.z] = S.at([x, TZ + .2]); f.floatY = f.y = .82; f.face = 1;
      const q = { f, x, gone: 0 }; f.onTap = () => { if (q.gone > 0 || dancing) return; S.walkThen(...S.at([x, TZ + .95]), () => { q.gone = 6; f.g.visible = false; sfx.munch(); girl.hopV = 2; S.confetti(f.x, 1.1, f.z, ['#f4a6c4', '#f2c65c', '#9ed9cf'], 8, S.starGeo, 1.6); }, .9); }; return q; });
    // everybody from the islands, behind the table and at its ends: [name, drawing, x, z, frame to stand in, frame to cheer in]
    const GUESTS = [['bakker', PEOPLE.bakker, -2.7, -1.75, 2, 0], ['winkelier', PEOPLE.winkelier, -1.8, -1.75, 2, 0], ['heks', STORY.heks, -.9, -1.8, 3, 2], ['harpist', PEOPLE2.harpist, .9, -1.75, 0, 1],
      ['schilder', PEOPLE.schilder, 1.8, -1.75, 3, 0], ['ijsverkoper', CARDS3.ijsverkoper, 2.7, -1.75, 3, 0], ['fluitist', PEOPLE2.fluitist, -3.7, -1.0, 0, 1], ['trompetter', PEOPLE2.trompetter, 3.75, -1.1, 0, 1],
      ['gitarist', PEOPLE2.gitarist, -3.9, .2, 0, 1], ['suikerspin', CARDS3.suikerspin, 3.95, -.1, 2, 1], ['kind', CARDS3.kind, -1.4, .35, 3, 0], ['muzikant', PEOPLE.muzikant, 1.9, .5, 0, 1],
      ['hond', ANIMALS.hond, -2.2, .95, 0, 0], ['pauw', ANIMALS2.pauw, 3.1, 1.05, 0, 0], ['draakje', ANIMALS2.draakje, 1.2, 1.25, 0, 0], ['lam', ANIMALS2.lam, -1.7, 1.75, 0, 0], ['alpaca', CARDS3.alpaca, -3.3, 1.4, 0, 3], ['eend', ANIMALS.eend, 3.6, 1.85, 0, 0]];
    const guests = GUESTS.map(([n, spec, x, z, rest, dance], i) => { const f = S.figure('feest-' + n, spec); f.g.visible = false; [f.x, f.z] = S.at([x, z]); f.face = x > 0 ? -1 : 1; f.thing = false;
      const q = { n, f, rest, dance, pop: -1, ph: i * .37, seat: [x, z], ring: null }; f.act = tick => f.setFrame(dancing && !frozen ? (Math.floor((tick + i * 3) / 4) % 2 ? q.dance : q.rest) : q.rest); f.onTap = () => { f.hopV = 2.4; sfx.hello(); }; return q; });
    const witch = guests.find(q => q.n === 'heks');
    const garland = new THREE.Group(); garland.scale.x = .01; feast.add(garland);
    for (let i = 0; i < 18; i++) { const x = -4.3 + i * .5; const c = card([[-.16, 0], [.16, 0], [0, -.34]], .01, P(['#f4a6c4', '#f2c65c', '#9ed9cf', '#bba6ea'][i % 4]), null); c.position.set(x, 3.55 - Math.sin(i / 17 * Math.PI) * .3, -D / 2 + .3); garland.add(c); }
    // the ring for the dance: everybody (the castle's people too) round the middle, in two rows, open towards the camera
    const ringers = [...guests.filter(q => q !== witch).map(q => ({ f: q.f, q })), ...folk.map(q => ({ f: q.f, folk: q }))];
    ringers.forEach((r, i) => { const n = ringers.length, a = Math.PI * (.93 + i / (n - 1) * 1.14), row = i % 2 ? .45 : 0; r.at = [MID[0] + Math.cos(a) * (3.55 + row), MID[1] + Math.sin(a) * (1.45 + row * .55)]; r.ph = i * .41; });

    /* ---------------- the music box: dance mode ---------------- */
    const gram = new THREE.Group(); gram.position.set(4.25, 0, 1.6); root.add(gram);
    { const b = box(.55, .35, .45, '#9a6e47'); b.position.y = .55; gram.add(b); const leg = new THREE.Mesh(new THREE.CylinderGeometry(.12, .18, .38, 10), P('#7a5a3e')); leg.position.y = .19; gram.add(leg);
      const horn = new THREE.Mesh(new THREE.ConeGeometry(.32, .7, 16, 1, true), P(GOLD, { side: THREE.DoubleSide })); horn.position.set(.15, 1.05, -.05); horn.rotation.z = -.9; horn.castShadow = true; gram.add(horn);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .02, 18), P('#33262E')); disc.position.y = .74; disc.userData.live = true; gram.add(disc); gram.userData.disc = disc; }
    S.solid({ x: 4.25, z: 1.6, r: .35 });
    let wasHere = false, ended = false, dancing = false, frozen = false, round = 0, dt0 = 0, song = null, sleepy = -1, dances = 0, gather = 0, plain = null;
    const startRound = () => { round++; frozen = false; dt0 = 0; song = sfx.song('dans', 'guitar'); if (round > 1) { sfx.cheer(); S.confetti(...S.at(MID).flatMap((v, j) => j ? [2.2, v] : [v]), ['#f4a6c4', '#f2c65c', '#9ed9cf', '#bba6ea'], 18, S.starGeo, 2.4); } };
    const startDance = () => { dancing = true; round = 0; dances++; gather = 0; for (const r of ringers) { r.from = [r.f.x, r.f.z]; } witch.from = [witch.f.x, witch.f.z];
      for (const q of folk) { q.how = null; q.dx = 0; q.f.lean = 0; for (const b of balls) b.visible = false; heartM.visible = false; }
      [girl.x, girl.z] = S.at([MID[0] - .7, MID[1] + .35]); girl.hopV = 3; const z = S.zus(); if (z && z.out) { [z.x, z.z] = S.at([MID[0] + .7, MID[1] + .35]); z.hopV = 3; }
      sfx.cheer(); startRound(); };
    S.tap(gram, () => { if (sleepy >= 0) return; if (!awake()) { if (!plain) { plain = sfx.song('twinkle', 'musicbox'); setTimeout(() => { plain = null; }, 9000); jester.f.hopV = 2; } return; } if (!dancing) startDance(); else if (frozen) startRound(); }, 'muziekdoos');

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
    const ease = k => k * k * (3 - 2 * k);

    return {
      start: [0, D / 2 - .95], uni: [-.9, D / 2 - .85],
      shadow: { follow: 20 },
      step({ dt, time }) {
        // a new beginning (the story starts again after the flight home, paper.js goHome): no feast, everybody back in place
        if (!awake() && awakeK > 0 && unfolding < 0) { setAwake(0); feast.visible = false; table.scale.y = .01; garland.scale.x = .01; for (const q of guests) { q.f.g.visible = false; q.pop = -1; [q.f.x, q.f.z] = S.at(q.seat); } for (const q of food) q.f.g.visible = false; dancing = false; frozen = false; sleepy = -1; }
        // the golden door opens when she comes near it
        const [lx, lz] = local(), open = Math.hypot(lx, lz + D / 2) < 2.4 && !dancing ? 1 : 0; doorOpen += (open - doorOpen) * Math.min(1, dt * 3); for (const l of leaves) l.g.rotation.y = l.s * doorOpen * 1.5;
        for (const q of paints) { q.sw = Math.max(0, q.sw - dt * .7); q.g.rotation.z = Math.sin(q.sw * 14) * q.sw * .35; }
        stepFolk(dt, time);
        for (const w of tableWalls) w[2] = feast.visible && table.scale.y > .5 ? 1.35 : 0;
        // the unfolding: colour, the table, the garland, everybody popping up, one by one
        if (unfolding >= 0) { unfolding += dt; const u = unfolding;
          setAwake(Math.min(1, u / 2)); feast.visible = true; const tk = Math.min(1, Math.max(0, (u - .6) / .6)); table.scale.set(1, Math.max(.01, tk * (1 + Math.sin(tk * Math.PI) * .15)), 1); garland.scale.x = Math.max(.01, Math.min(1, (u - 1.2) / .8));
          guests.forEach((q, i) => { const at = 2 + i * .22; if (u > at && q.pop < 0) { q.pop = 0; q.f.g.visible = true; [q.f.x, q.f.z] = S.at(q.seat); q.f.hopV = 3; sfx.click(); S.confetti(q.f.x, 1.2, q.f.z, ['#f4a6c4', '#f2c65c', '#9ed9cf', '#bba6ea'], 6, S.starGeo, 1.4); } });
          if (u > 2 + guests.length * .22 + .3) food.forEach(q => { q.f.g.visible = q.gone <= 0; });
          const z = S.zus(); if (z) { [z.x, z.z] = S.at([.7, 1.4]); z.face = -1; }
          if (u > 2 + guests.length * .22 + 1.4) { unfolding = -1; mark('feest'); S.stopPlay(); sfx.chime(); } }
        else if (awake() && awakeK < 1 && !S.shared.unfoldNext) { setAwake(1); feast.visible = true; table.scale.y = 1; garland.scale.x = 1; for (const q of guests) q.f.g.visible = true; food.forEach(q => { q.f.g.visible = true; }); const z = S.zus(); if (z && S.where() === 'kasteelzaal') { z.out = true; [z.x, z.z] = S.at([.7, 1.4]); } }
        for (const q of food) if (q.gone > 0) { q.gone -= dt; if (q.gone <= 0 && !dancing) { q.f.g.visible = true; q.f.hopV = 1.2; } }
        // dance mode: the table folds away, everybody makes a ring and cheers, the girls, the witch and her unicorn dance in the middle
        const z = S.zus();
        if (dancing) { dt0 += dt; gather = Math.min(1, gather + dt / 1.2); const g = ease(gather); gram.userData.disc.rotation.y += frozen ? 0 : dt * 4;
          table.scale.y = Math.max(.01, 1 - gather * 1.4); for (const q of food) q.f.g.visible = false;
          if (!frozen && dt0 > 6.5) { frozen = true; dt0 = 0; if (song && song.stop) song.stop(); }
          else if (frozen && dt0 > 2.4) { if (round >= 3) { dancing = false; frozen = false; sleepy = 0; if (uni) uni.busy = false; } else startRound(); }
          // the ring: everybody walks to their place, then cheers on the beat (hops, sways), and freezes when the music stops
          for (const r of ringers) { const f = r.f; if (!f.g.visible && r.q) continue; const [tx, tz] = S.at(r.at); f.x = r.from[0] + (tx - r.from[0]) * g; f.z = r.from[1] + (tz - r.from[1]) * g; const [mx, mz] = S.at(MID);
            if (gather >= 1 && !frozen) { const b = (time * 2.2 + r.ph) % 1; if (b < dt * 2.2 && !(f.hop > 0)) f.hopV = 1.6 + (r.ph % 1) * 1.2; f.lean = Math.sin(time * 4.4 + r.ph * 6) * .1; f.face = Math.sign(mx - f.x) || 1; if (r.folk) r.folk.frame = Math.floor(time * 2.2 + r.ph) % 2 ? (r.folk.n === 'nar' ? 1 : r.folk.n === 'ridder' ? 1 : 3) : 0; }
            else if (gather < 1) f.face = Math.sign(tx - r.from[0]) || f.face; }
          if (!frozen && gather >= 1 && Math.floor(time / 2.6) !== Math.floor((time - dt) / 2.6)) { Math.floor(time / 2.6) % 2 ? sfx.clap() : sfx.cheer(); }
          // the witch: into the middle, she dances too
          { const f = witch.f, [tx, tz] = S.at([MID[0], MID[1] - .45]); f.x = witch.from[0] + (tx - witch.from[0]) * g; f.z = witch.from[1] + (tz - witch.from[1]) * g;
            if (!frozen && gather >= 1) { const b = (time * 2.2 + .25) % 1; if (b < dt * 2.2) f.hopV = 2.6; f.face = Math.floor(time * 1.1) % 2 ? 1 : -1; f.lean = Math.sin(time * 4.4) * .16; } }
          // her unicorn: in the middle, prancing round
          if (uni && !uni.away) { uni.busy = true; const a = time * 1.3, [ux, uz] = S.at([MID[0] + 1.55 + (frozen ? 0 : Math.cos(a) * .25), MID[1] + .05 + (frozen ? 0 : Math.sin(a) * .15)]); if (!frozen) { uni.x += (ux - uni.x) * Math.min(1, dt * 4); uni.z += (uz - uni.z) * Math.min(1, dt * 4); if ((time * 2.2) % 1 < dt * 2.2) uni.hopV = 2.4; uni.face = Math.floor(time * 1.1 + .5) % 2 ? 1 : -1; } }
          if (!S.playing() && !girl.walking) { if (!frozen) { const beat = Math.floor(time * 2.2); girl.view = ['front', 'side', 'front', 'back'][beat % 4]; girl.poseName = beat % 2 ? 'up' : null; if ((time * 2.2) % 1 < dt * 2.2) girl.hopV = 2; } else girl.poseName = 'up'; }
          if (z && z.out) { if (!frozen) { const beat = Math.floor(time * 2.2 + .5); z.view = ['side', 'front', 'back', 'front'][beat % 4]; z.poseName = beat % 2 ? null : 'up'; if ((time * 2.2 + .5) % 1 < dt * 2.2) z.hopV = 2; } else z.poseName = 'up'; } }
        else { if (!S.playing() && girl.poseName === 'up' && sleepy < 0) girl.poseName = null; for (const q of guests) q.f.lean *= Math.exp(-dt * 4); }
        // her sister comes along to the feast, and goes home to bed when she leaves the castle (not when the unicorn flies them both)
        const here = S.where() === 'kasteelzaal'; if (z && wasHere && !here && !ended) { z.out = false; z.poseName = null; }
        if (wasHere && !here && dancing) { dancing = false; frozen = false; gather = 0; if (song && song.stop) song.stop(); if (uni) uni.busy = false; table.scale.y = 1;   // (she walked out in the middle of a dance: it stops, and everybody goes back to the table)
          for (const q of guests) [q.f.x, q.f.z] = S.at(q.seat); for (const q of folk) { [q.f.x, q.f.z] = S.at(q.home); q.f.face = q.face; } } if (here && !wasHere) ended = false; wasHere = here;
        // sleepy: the candles go low, the girls sit down and their eyes close; then home to bed
        if (sleepy >= 0) { const was = sleepy; sleepy += dt; candles = Math.max(.25, 1 - sleepy / 4);
          if (was < .3 && sleepy >= .3) { S.night(); sfx.song('twinkle', 'musicbox'); for (const r of ringers) r.f.lean = 0; witch.f.lean = 0; }
          if (sleepy > 1) { girl.poseName = 'sit'; girl.view = 'front'; if (z && z.out) { z.poseName = 'sit'; z.view = 'front'; } }
          if (sleepy > 3.2) { girl.asleep = true; if (z) z.dozing = true; for (const r of ringers) r.f.lean = Math.sin(time * .8 + r.ph) * .05; }
          if (was < 6.5 && sleepy >= 6.5) { sleepy = -1; candles = 1; ended = true; table.scale.y = 1; for (const q of folk) { [q.f.x, q.f.z] = S.at(q.home); q.f.face = q.face; } S.ending(); } }
        light.intensity += ((candles * 2.1) - light.intensity) * Math.min(1, dt * 3); flame.emissiveIntensity = (1.2 + Math.sin(time * 11) * .15) * candles;
      },
      toys: { zaal: { state: () => ({ door: doorOpen > .5, awake: awake(), unfolding: unfolding >= 0, dancing, frozen, round, sleepy: sleepy >= 0, dances, guests: guests.filter(q => q.f.g.visible).length, folk: folk.map(q => [q.n, q.taps, q.how]), gather: +gather.toFixed(2) }) } },
      shots: [{ ...roomShot('kasteelzaal', 9.0, 6.8), fx: .55 }],
      spots: { door: [0, 1.2, -D / 2 + .1], paint0: [-3.5, 2.0, -D / 2 + .1], paint1: [-2.35, 2.0, -D / 2 + .1], paint2: [-1.2, 2.0, -D / 2 + .1], muziekdoos: [4.25, .7, 1.6] },
      places: { start: [0, D / 2 - .95], door: [0, -D / 2 + 1.1], knight: [-.4, -1.1], jester: [1.75, .55], lady: [-2.15, .5], musicbox: [3.6, 2.0] },
    };
  },
};
