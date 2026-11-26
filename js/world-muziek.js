// The flower meadow's musician: a cricket on a stump playing the fiddle (MAP.MUSIC), with a log bench beside it.
// It only plays while she is near (the world waits for her), softly, and louder the closer she comes. A tap on the
// cricket, ✕ next to it, or a tap on the log: she sits down on the log to listen. Then the tune is a little louder,
// the background music steps back, notes float up, and the animals of the meadow (and her unicorn) come over, sit
// round and listen too. When she gets up they stay a moment and then wander off again.
import * as MAP from './map.js';
import * as WILD from './art-wild.js';
import { tone, duckMusic } from './audio.js';

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
// a little waltz (3/4): [midi, beats]; 0 is a rest
const TUNE = [[72, 1], [76, 1], [79, 1], [77, 2], [76, 1], [74, 2], [72, 1], [71, 2], [67, 1],
  [69, 1], [72, 1], [76, 1], [74, 2], [72, 1], [71, 3], [72, 1], [76, 1], [79, 1], [81, 2], [79, 1],
  [77, 1], [76, 1], [74, 1], [72, 2], [74, 1], [76, 2], [74, 1], [72, 3], [0, 3]];
const BASS = [48, 53, 55, 48, 45, 50, 55, 48];   // one low note at the start of every bar
const BEAT = .42, HEAR = 10;

export function createMuziek(ctx) {
  const { THREE, scene, makeSprite, pick, kid, animals, M } = ctx;
  const S = MAP.MUSIC, bench = MAP.BENCHES.find(b => b.log), I = M.I;
  const art = [WILD.krekel(0), WILD.krekel(1)];
  const mesh = makeSprite(art[0], { lean: .3, scale: .85 }); mesh.position.set(S.x + .5, 0, S.z + .55); mesh.userData.alpha = art[0]; scene.add(mesh);
  const texs = art.map(a => ctx.tex(a));
  const listening = () => { const i = ctx.seated(); return i >= 0 && Math.floor(i / M.W) === bench.z && (i % M.W === bench.x || i % M.W === bench.x + 1); };
  const sitDown = () => ctx.bank.sitOn(bench);
  mesh.userData.tap = () => { flourish = .6; sitDown(); }; pick.push(mesh);
  ctx.addUse(() => !listening() && !ctx.toys.carrying() && Math.hypot(S.x + .5 - kid.pos.x, S.z + .5 - kid.pos.z) < 1.6 ? { key: 'muziek', art: art[0], run: () => { flourish = .6; sitDown(); } } : null);

  // where the audience sits: round the front of the log and the stump
  const SEATS = [[-1.5, 1.6], [3.2, 1.5], [-1, 2.6], [1.2, 2.7], [2.8, 2.6], [.2, 3.4], [-2.3, .4]].map(([dx, dz]) => [bench.x + dx, bench.z + dz]).filter(([x, z]) => ctx.walkable(Math.floor(x), Math.floor(z)));
  let t = 0, note = 0, nextAt = 0, beatN = 0, bow = 0, flourish = 0, was = false, crowd = [], noteT = 0;

  function gather() {
    const near = animals.filter(a => a.g.visible && !a.held && !a.fly && !a.swim && !a.water && !a.way && !a.cart && !a.friend && Math.hypot(a.pos.x - S.x, a.pos.z - S.z) < 16);
    crowd = near.slice(0, SEATS.length);
    crowd.forEach((a, k) => { const [x, z] = SEATS[k]; a.path = [new THREE.Vector3(x + .5, 0, z + .5)]; a.wait = 999; a.listen = true; });
  }
  function scatter() { for (const a of crowd) { a.listen = false; a.wait = 2 + Math.random() * 4; } crowd = []; }

  return {
    listening, sitDown,
    info: () => ({ listening: listening(), crowd: crowd.map(a => a.name), playing: t > 0, seats: SEATS.length }),
    update(dt) {
      const d = Math.hypot(kid.pos.x - S.x - .5, kid.pos.z - S.z - .5), on = listening();
      if (on !== was) { was = on; duckMusic(on); if (on) gather(); else scatter(); }
      for (const a of crowd) { if (!a.path.length && a.listen) { a.face = a.pos.x < S.x + .5 ? 1 : -1; a.moving = false; } }
      if (d > HEAR && !on) { t = 0; nextAt = 0; note = 0; beatN = 0; return; }                          // too far away: it rests, bow down
      // the tune: louder the closer she is, and a little louder still when she sits and listens
      const vol = on ? .1 : .055 * Math.max(0, 1 - d / HEAR);
      t += dt;
      while (t >= nextAt) {
        const [m, beats] = TUNE[note % TUNE.length];
        if (m) { tone(mtof(m), 0, BEAT * beats * .95, 'triangle', vol); tone(mtof(m + 12), .01, BEAT * beats * .6, 'sine', vol * .25); }
        if (beatN % 3 === 0) tone(mtof(BASS[(beatN / 3) % BASS.length]), 0, BEAT * 2.6, 'sine', vol * .8);   // a low note at the start of every bar
        nextAt += BEAT * beats; beatN += beats; note++; bow = 1 - bow;
        const tx = texs[bow]; mesh.material.map = tx; mesh.material.emissiveMap = tx; mesh.material.needsUpdate = true;
      }
      mesh.position.y = flourish > 0 ? Math.abs(Math.sin(flourish * 12)) * .12 : 0; flourish = Math.max(0, flourish - dt);
      mesh.rotation.z = Math.sin(t * Math.PI / (BEAT * 3)) * .05;                // it sways in three
      if (on && (noteT -= dt) < 0) { noteT = .7; ctx.life.bit(WILD.noot(note), S.x + .2 + Math.random() * .4, 1.2, S.z + .7, { vx: -.2 + Math.random() * .4, vy: .45, g: -.1, sway: 2, life: 2.2, scale: .8 }); }
    },
    dispose() { scatter(); if (was) duckMusic(false); },
  };
}
