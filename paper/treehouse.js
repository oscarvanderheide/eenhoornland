// The treehouse in the big oak at the forest's east end (Oscar: "make the treehouse"). A real paper oak, thick brown trunk
// and a wide crown; up in it a deck of planks with a railing, a little hut with a red roof and a pennant, a brass
// telescope on its tripod, and a rope ladder hanging down to the ground.
//   the ladder     she climbs it herself (Oscar: "i want to climb manually by holding up"): walking into its foot, or a tap on
//                  it, and she takes hold; holding up (the stick, an arrow, a finger above her) climbs rung by rung, holding
//                  down climbs down, letting go she just hangs there; down at the foot, down again and she lets go. At the
//                  top the camera steps back: she is high up
//   the telescope  a tap (up there): she looks through it, and the picture flies far out to another island, a different
//                  one each time; a moment later it comes back to her
//   down           a tap (or ○) up there: she takes hold of the ladder again, and climbs down holding down
//   the zipline    (Oscar: "the zipline back to starting island would be fun") a cable from a post at the deck's corner, over
//                  the forest and the water, to a post in the village. A tap on its hand-bar (up there): she takes hold and
//                  whizzes down it, the camera wide and following, the unicorn flying after; she drops onto a soft mat in
//                  the village. The bar slides back up by itself
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
  const [wx, wz] = S.at([x, z]), foot = [wx, wz + DD / 2 + .45], top = [wx - .2, wz + .45], onLadder = wz + DD / 2 + .14;   // (climbing she is just in front of the ladder, not behind it)
  let mode = null, t = 0, climbs = 0, looks = 0, view = -1, sway = 0, rides = 0, back = -1, h = 0, rung = 0;
  /* the zipline: from a post at the deck's front right corner to the village's post (set-dorp.js gives where it stands) */
  const ZT = 5.6, uni = S.uni;
  let end = null, A = null, B = null, at = null;
  add(m3(new THREE.CylinderGeometry(.05, .06, 2.2, 6), '#7a5a3e'), DW / 2 - .15, DECK + 1.1, DD / 2 - .1);   // the cable's post on the deck
  const bar = new THREE.Group(); bar.visible = false; S.root.add(bar);   // (in the world's measure once the cable is laid: see lay)
  { const wheel = m3(new THREE.CylinderGeometry(.07, .07, .05, 12), '#e0b453'); wheel.rotation.x = Math.PI / 2; bar.add(wheel);
    for (const s of [-1, 1]) { const r = m3(new THREE.CylinderGeometry(.012, .012, .62, 4), '#d8c9a8'); r.position.set(s * .2, -.33, 0); r.rotation.z = -s * .3; bar.add(r); }
    const grip = m3(new THREE.CylinderGeometry(.035, .035, .55, 8), '#d9706c'); grip.rotation.z = Math.PI / 2; grip.position.y = -.62; bar.add(grip); }
  /** the cable: laid once the village (built after this island when the game starts here) has said where its post is */
  const lay = () => {
    end = S.shared.zipEnd; if (!end) return;
    A = new THREE.Vector3(...[S.at([x + DW / 2 - .15, z + DD / 2 - .1])].map(([ax, az]) => [ax, DECK + 2.15, az])[0]); B = new THREE.Vector3(end.top[0], end.top[2], end.top[1]);
    at = p => { const v = A.clone().lerp(B, p); v.y -= .9 * Math.sin(Math.PI * p); return v; };
    const curve = new THREE.CatmullRomCurve3(Array.from({ length: 25 }, (_, i) => at(i / 24)));
    const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, .018, 5), paper('#5a4e66')); cable.castShadow = true; S.world(cable);
    S.world(bar); bar.visible = true; barTo(.012);
  };
  const barTo = p => { bar.position.copy(at(p)); };
  const LOW = { span: 7.5, tall: 5.6, min: 3, rise: -.2, riseTall: -.16, ly: 1.6, yaw: .3, dof: 1.3, range: 1.2, fx: 1, fz: 1, lag: 1 };   // climbing: from the grass, looking up the ladder past her to the deck
  const toy = { look: [wx, wz + .9], shot: null, rate: .9, lets: o => tapsUp.has(o), step(dt, inp) {
    t += dt;
    if (mode === 'grab') {   // to the corner, and up on her toes to the bar
      const k = Math.min(1, t / .45), h = at(.012); girl.x = top[0] + (h.x - top[0]) * k; girl.z = top[1] + (h.z + .05 - top[1]) * k; girl.lift = DECK + .04 + Math.sin(k * Math.PI) * .25; girl.poseName = 'up'; girl.view = 'front';
      if (k >= 1) { mode = 'zip'; t = 0; rides++; sfx.whoosh(); toy.rate = 1.6; toy.shot = { span: 15, tall: 10, rise: .4, riseTall: .55, ly: 0, dof: .35, range: 4, fx: 1, fz: 1, lag: 1 }; } return; }
    if (mode === 'zip') {   // down the cable: slow at first, then whizzing, a little slower again at the end
      const k = Math.min(1, t / ZT), p = .012 + .975 * k * k * (3 - 2 * k), v = at(Math.min(.987, p));
      barTo(Math.min(.987, p)); girl.poseName = 'up'; { const h = S.hand(); girl.x += v.x - h.x; girl.z = v.z + .05; girl.lift = (girl.lift || 0) + (v.y - .64 - h.y); }   // her hands on the grip (measured: the pose decides where they are)
      girl.view = 'side'; girl.face = Math.sign(B.x - A.x) || 1; girl.lean = Math.sin(t * 3) * .06;
      toy.look = [girl.x, girl.z]; toy.shot.ly = Math.max(0, girl.lift * .75);
      if (uni && !uni.away) { const u = at(Math.max(.012, Math.min(.987, p) - .05)); uni.busy = true; uni.x = u.x; uni.z = u.z + .1; uni.lift = u.y - 1.6 - uni.y + Math.sin(t * 5) * .1; uni.face = girl.face; }
      if (Math.floor(t * 1.4) !== Math.floor((t - dt) * 1.4)) sfx.swish(1);
      if (k >= 1) { mode = 'drop'; t = 0; } return; }
    if (mode === 'drop') {   // she lets go, onto the mat
      const k = Math.min(1, t / .4), [mx, mz] = end.at, h0 = at(.987); girl.x = h0.x + (mx - h0.x) * k; girl.z = h0.z + .05 + (mz - h0.z - .05) * k; girl.lean = 0;
      girl.lift = Math.max(0, (h0.y - .62 - 1.2 - girl.y) * (1 - k) + Math.sin(k * Math.PI) * .3); girl.poseName = k < .6 ? 'up' : null;
      if (uni && !uni.away) { uni.x = mx - 1.0; uni.z = mz + .2; uni.lift = Math.max(0, uni.lift * (1 - k)); }
      if (k >= 1) { mode = null; girl.lift = 0; girl.poseName = null; girl.view = 'front'; sfx.thud(); S.coins.reward('tokkel', girl.x, girl.y + 1.2, girl.z); girl.hopV = 2.4; S.confetti(girl.x, girl.y + .6, girl.z, ['#f4a6c4', '#f2c65c', '#9ed9cf'], 14, S.starGeo, 2.2); if (uni && !uni.away) { uni.lift = 0; uni.hopV = 3; } back = 0; toy.shot = null; S.stopPlay(); } return; }
    if (mode === 'ladder') {   // on the ladder, her back to us: up while she holds up, down while she holds down, still when she lets go; the camera low on the grass, looking up
      const v = -(inp.y || 0) * 1.35, was = h; h = Math.max(0, Math.min(DECK, h + v * dt)); girl.view = 'back'; girl.x = foot[0]; girl.z = onLadder; girl.lift = h;
      if (v) { rung += Math.abs(h - was); girl.poseName = Math.floor(rung / .3) % 2 ? 'up' : 'hold'; sway = .06; if (Math.floor(rung / .3) !== Math.floor((rung - Math.abs(h - was)) / .3)) sfx.click(); }
      if (h <= 0 && v < 0 && t > .3) { mode = null; girl.lift = 0; girl.poseName = null; girl.view = 'front'; girl.z = foot[1]; S.stopPlay(); return; }   // at the foot, down again: off
      if (h <= 0 && (inp.x || inp.act) && t > .3) { mode = null; girl.lift = 0; girl.poseName = null; girl.z = foot[1]; S.stopPlay(); return; }
      if (h >= DECK) { mode = 'top'; t = 0; climbs++; sfx.hop(); girl.hopV = 1.6; toy.shot = { span: 22, tall: 13, rise: .5, riseTall: .68, dof: .5, range: 3, fx: 1, fz: 1, lag: 1 }; toy.look = [wx, wz + .3]; toy.rate = 1.1; } return; }
    if (mode === 'top') { const k = Math.min(1, t / .4); girl.x = foot[0] + (top[0] - foot[0]) * k; girl.z = onLadder + (top[1] - onLadder) * k; girl.lift = DECK + .04; girl.poseName = null; girl.view = k < 1 ? 'back' : 'front';
      if (view >= 0) { if (t > 3.2) { view = -1; t = .4; toy.look = [wx, wz + .3]; toy.shot = { span: 22, tall: 13, rise: .5, riseTall: .68, dof: .5, range: 3, fx: 1, fz: 1, lag: 1 }; } return; }
      if (inp.act || inp.x || inp.y > 0) { down(); } return; }
  } };
  const down = () => { if (mode !== 'top') return; mode = 'ladder'; h = DECK - .05; t = 0; view = -1; toy.shot = LOW; toy.look = [wx, wz + .9]; toy.rate = 1.6; sfx.hop(); };
  const look = () => { const V = views(); if (mode !== 'top' || view >= 0 || !V.length) return; view = looks++ % V.length; t = 0; sfx.swish(2); girl.view = 'side'; girl.face = 1;
    const [vx, vz] = V[view]; toy.look = [vx, vz]; toy.shot = { span: 34, tall: 22, rise: .55, riseTall: .7, dof: .1, range: 8, fx: 1, fz: 1, lag: 1 }; };
  const begin = () => { if (S.playing() || mode) return; mode = 'ladder'; h = 0; rung = 0; t = 0; toy.shot = LOW; toy.look = [wx, wz + .9]; toy.rate = 2.4; S.play(toy); girl.view = 'back'; sfx.hop(); };
  const climb = () => { if (mode === 'top') { down(); return; } if (S.playing()) return; S.walkThen(foot[0], foot[1], begin, 1.0); };
  const tapsUp = new Set(); for (const o of [scope, ladder, bar]) o.traverse(m => { if (m.isMesh) tapsUp.add(m); });
  toy.pad = { x: () => { if (mode === 'top') look(); }, tri: () => { if (mode === 'top' && view < 0 && back < 0 && A) { mode = 'grab'; t = 0; sfx.hop(); } } };   // with a controller, up there: ✕ the telescope, △ the zipline (○ climbs down)
  S.tap(bar, () => { if (!A) return; if (mode === 'top' && view < 0 && back < 0) { mode = 'grab'; t = 0; sfx.hop(); } else if (!mode) climb(); }, 'zipline');
  S.tap(ladder, climb, 'ladder'); S.tap(scope, () => { if (mode === 'top') look(); else climb(); }, 'telescope');
  return { toy, state: () => ({ mode, climbs, looks, view, up: mode === 'top', rides, h }), step({ dt, time }) {
    if (!A && !end) lay();
    // walking into the foot of the ladder she takes hold of it, as a tap on it does
    if (!mode && !S.playing() && Math.hypot(girl.x - foot[0], girl.z - foot[1]) < .6) { const p = S.pushing(); if (p[1] < -.6) begin(); }
    if (back >= 0) { back += dt; const k = Math.min(1, back / 3.5); barTo(.987 - (.987 - .012) * k * k * (3 - 2 * k)); if (k >= 1) back = -1; }   // the bar slides back up by itself
    sway = Math.max(0, sway - dt * .1); ladder.rotation.x = Math.sin(time * 4) * sway; flag.rotation.y = Math.sin(time * 2.2) * .35;
  } };
}
