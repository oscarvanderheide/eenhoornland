// The treehouse in the big oak at the forest's east end (Oscar: "make the treehouse"). A real paper oak, thick brown trunk
// and a wide crown; up in it a deck of planks with a railing, a little hut with a red roof and a pennant, a brass
// telescope on its tripod, and a rope ladder hanging down to the ground.
//   the ladder     a tap: she walks to its foot and climbs up, rung by rung; at the top the camera steps back: she is high up
//   the telescope  a tap (up there): she looks through it, and the picture flies far out to another island, a different
//                  one each time; a moment later it comes back to her
//   down           a tap on the ladder again, or a touch: she climbs down
import { THREE, paper, card } from './kit.js';

const m3 = (geo, col, o) => { const m = new THREE.Mesh(geo, paper(col, o)); m.castShadow = m.receiveShadow = true; return m; };

export function treehouse(S, x, z, views = () => []) {   // (views: where the other islands lie; asked when needed, as they are built after this one)
  const { girl, sfx } = S, g = new THREE.Group(); g.position.set(x, 0, z); S.root.add(g);
  const add = (m, px, py, pz, to = g) => { m.position.set(px, py, pz); to.add(m); return m; };
  const DECK = 4.0, DW = 2.4, DD = 1.9, UP = DECK - 2.6;   // (Oscar: "the treehouse can even be higher")
  // the oak: a thick trunk that narrows, two branches, and a crown of big round leaf-clumps behind and above the hut
  add(m3(new THREE.CylinderGeometry(.34, .6, DECK + .1, 12), '#8d6a48'), 0, (DECK + .1) / 2, -.15);
  add(m3(new THREE.CylinderGeometry(.26, .34, 1.9, 10), '#8d6a48'), 0, DECK + 1.0, -.45);
  for (const s of [-1, 1]) { const b = m3(new THREE.CylinderGeometry(.08, .15, 1.5, 8), '#7a5a3e'); b.rotation.z = s * .95; add(b, s * .75, DECK + 1.1, -.55); }
  for (const [cx, cy, cz, r, c] of [[0, 4.9, -.7, 1.45, '#6f9a5e'], [-1.25, 4.4, -.55, 1.05, '#7fa676'], [1.3, 4.45, -.5, 1.1, '#7fa676'], [-.6, 5.5, -.9, 1.0, '#86ad6e'], [.7, 5.45, -.85, 1.0, '#6f9a5e'], [0, 4.2, -.1, .8, '#86ad6e']]) {
    const c3 = m3(new THREE.SphereGeometry(r, 14, 10), c); c3.scale.y = .78; add(c3, cx, cy + UP, cz); }
  // the deck: planks on two beams, a railing round three sides (open where the ladder comes up)
  for (let i = 0; i < 7; i++) add(m3(new THREE.BoxGeometry(DW, .07, DD / 7 - .02), i % 2 ? '#c79a66' : '#d2a774'), 0, DECK, -DD / 2 + (i + .5) * DD / 7);
  for (const s of [-1, 1]) add(m3(new THREE.BoxGeometry(.12, .14, DD), '#8d6a48'), s * (DW / 2 - .2), DECK - .1, 0);
  for (const s of [-1, 1]) { const b = m3(new THREE.BoxGeometry(.07, 1.5, .07), '#7a5a3e'); b.rotation.x = -s * .0; b.rotation.z = s * .55; add(b, s * .62, DECK - .65, -.15); }   // two struts down to the trunk
  const post = (px, pz) => add(m3(new THREE.BoxGeometry(.06, .5, .06), '#b9875a'), px, DECK + .25, pz);
  for (const px of [-DW / 2 + .05, -DW / 4, DW / 4, DW / 2 - .05]) post(px, DD / 2 - .04);
  for (const pz of [-DD / 2 + .1, 0, DD / 2 - .04]) { post(-DW / 2 + .05, pz); post(DW / 2 - .05, pz); }
  for (const [w, px] of [[DW / 2 - .38, -DW / 2 + .05 + (DW / 2 - .38) / 2], [DW / 2 - .38, DW / 2 - .05 - (DW / 2 - .38) / 2]]) add(m3(new THREE.BoxGeometry(w, .05, .05), '#b9875a'), px, DECK + .48, DD / 2 - .04);   // the front rail, open in the middle
  for (const s of [-1, 1]) add(m3(new THREE.BoxGeometry(.05, .05, DD), '#b9875a'), s * (DW / 2 - .05), DECK + .48, 0);
  // the hut at the back of the deck: plank walls, a red roof, a window, a pennant
  const hut = new THREE.Group(); hut.position.set(-.25, DECK, -.45); g.add(hut);
  add(m3(new THREE.BoxGeometry(1.2, .95, .8), '#c1905f'), 0, .48, 0, hut);
  for (let k = 0; k < 4; k++) add(m3(new THREE.BoxGeometry(1.22, .02, .82), '#a97a4e'), 0, .2 + k * .22, 0, hut);
  { const roof = m3(new THREE.ConeGeometry(.95, .6, 4), '#d9706c'); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, .72); add(roof, 0, 1.25, 0, hut); }
  add(m3(new THREE.BoxGeometry(.3, .3, .03), '#3d3452'), .25, .55, .41, hut); add(m3(new THREE.BoxGeometry(.36, .04, .05), '#7a5a3e'), .25, .38, .43, hut);
  add(m3(new THREE.CylinderGeometry(.015, .015, .7, 5), '#7a5a3e'), .05, 1.75, 0, hut);
  const flag = card([[0, 0], [.36, -.09], [0, -.18]], .01, paper('#f2c65c', { side: THREE.DoubleSide })); add(flag, .06, 2.07, 0, hut); flag.userData.live = true;
  // the telescope: a brass tube on a little tripod at the deck's right front corner, looking out
  const scope = new THREE.Group(); scope.position.set(.8, DECK + .04, .45); g.add(scope);
  for (let i = 0; i < 3; i++) { const a = i / 3 * 6.28, l = m3(new THREE.CylinderGeometry(.015, .015, .55, 5), '#7a5a3e'); l.position.set(Math.cos(a) * .1, .26, Math.sin(a) * .1); l.rotation.set(Math.sin(a) * .3, 0, -Math.cos(a) * .3); scope.add(l); }
  const tube = new THREE.Group(); tube.position.y = .55; tube.rotation.z = .35; tube.userData.live = true; scope.add(tube);
  add(m3(new THREE.CylinderGeometry(.05, .07, .6, 10), '#e0b453'), 0, 0, 0, tube).rotation.z = Math.PI / 2; add(m3(new THREE.CylinderGeometry(.075, .075, .06, 10), '#b98a3a'), .3, 0, 0, tube).rotation.z = Math.PI / 2;
  // the rope ladder: two ropes and wooden rungs, from the deck's open front down to the grass; it sways while she climbs
  const ladder = new THREE.Group(); ladder.position.set(0, DECK, DD / 2 + .02); ladder.userData.live = true; g.add(ladder);
  for (const s of [-1, 1]) add(m3(new THREE.CylinderGeometry(.015, .015, DECK, 5), '#d8c9a8'), s * .2, -DECK / 2, 0, ladder);
  const RUNGS = Math.round(DECK / .33); for (let i = 0; i < RUNGS; i++) add(m3(new THREE.BoxGeometry(.46, .04, .05), '#a97a4e'), 0, -DECK + .25 + i * (DECK - .35) / (RUNGS - 1), 0, ladder);
  S.solid({ x, z: z - .15, r: .62 });
  const [wx, wz] = S.at([x, z]), foot = [wx, wz + DD / 2 + .45], top = [wx - .2, wz + .45];
  let mode = null, t = 0, climbs = 0, looks = 0, view = -1, sway = 0;
  const LOW = { span: 7.5, tall: 5.6, min: 3, rise: -.2, riseTall: -.16, ly: 1.6, yaw: .3, dof: 1.3, range: 1.2, fx: 1, fz: 1, lag: 1 };   // climbing: from the grass, looking up the ladder past her to the deck
  const toy = { look: [wx, wz + .9], shot: null, rate: .9, lets: o => tapsUp.has(o), step(dt, inp) {
    t += dt;
    if (mode === 'up') {   // rung by rung: her back to us, the ladder swaying; the camera low on the grass, looking up
      const k = Math.min(1, t / 3.4); girl.view = 'back'; girl.x = foot[0]; girl.z = foot[1] - .45; girl.lift = DECK * k; girl.poseName = Math.floor(t / .24) % 2 ? 'up' : 'hold'; sway = .06;
      if (Math.floor(t / .24) !== Math.floor((t - dt) / .24)) sfx.click();
      if (k >= 1) { mode = 'top'; t = 0; climbs++; sfx.hop(); girl.hopV = 1.6; toy.shot = { span: 22, tall: 13, rise: .5, riseTall: .68, dof: .5, range: 3, fx: 1, fz: 1, lag: 1 }; toy.look = [wx, wz + .3]; toy.rate = 1.1; } return; }
    if (mode === 'top') { const k = Math.min(1, t / .4); girl.x = foot[0] + (top[0] - foot[0]) * k; girl.z = foot[1] - .45 + (top[1] - foot[1] + .45) * k; girl.lift = DECK + .04; girl.poseName = null; girl.view = k < 1 ? 'back' : 'front';
      if (view >= 0) { if (t > 3.2) { view = -1; t = .4; toy.look = [wx, wz + .3]; toy.shot = { span: 22, tall: 13, rise: .5, riseTall: .68, dof: .5, range: 3, fx: 1, fz: 1, lag: 1 }; } return; }
      if (inp.act || inp.x) { down(); } return; }
    if (mode === 'down') { const k = Math.min(1, t / 2.2); girl.view = 'back'; girl.x = foot[0]; girl.z = foot[1] - .45; girl.lift = DECK * (1 - k); girl.poseName = Math.floor(t / .24) % 2 ? 'up' : 'hold'; sway = .06;
      if (k >= 1) { mode = null; girl.lift = 0; girl.poseName = null; girl.view = 'front'; girl.z = foot[1]; S.stopPlay(); } }
  } };
  const down = () => { if (mode !== 'top') return; mode = 'down'; t = 0; view = -1; toy.shot = LOW; toy.look = [wx, wz + .9]; toy.rate = 1.6; sfx.hop(); };
  const look = () => { const V = views(); if (mode !== 'top' || view >= 0 || !V.length) return; view = looks++ % V.length; t = 0; sfx.swish(2); girl.view = 'side'; girl.face = 1;
    const [vx, vz] = V[view]; toy.look = [vx, vz]; toy.shot = { span: 34, tall: 22, rise: .55, riseTall: .7, dof: .1, range: 8, fx: 1, fz: 1, lag: 1 }; };
  const climb = () => { if (mode === 'top') { down(); return; } if (S.playing()) return; S.walkThen(foot[0], foot[1], () => { if (S.playing()) return; mode = 'up'; t = 0; toy.shot = LOW; toy.look = [wx, wz + .9]; toy.rate = 2.4; S.play(toy); }, 1.0); };
  const tapsUp = new Set(); for (const o of [scope, ladder]) o.traverse(m => { if (m.isMesh) tapsUp.add(m); });
  S.tap(ladder, climb, 'ladder'); S.tap(scope, () => { if (mode === 'top') look(); else climb(); }, 'telescope');
  return { toy, state: () => ({ mode, climbs, looks, view, up: mode === 'top' }), step({ dt, time }) {
    sway = Math.max(0, sway - dt * .1); ladder.rotation.x = Math.sin(time * 4) * sway; flag.rotation.y = Math.sin(time * 2.2) * .35;
  } };
}
