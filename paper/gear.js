// Her tools: things of the adventure that are hers for good once she has them (the stage keeps which: S.gear).
//   snorkel   flippers and a snorkel. With them, light water (a pond, the pool under the waterfall) can be walked into,
//             and she swims: up to her shoulders in it, the mask on, slower. The dark sea stays shut
//   hook      the hookshot: a hook on a chain. A tap on a post across a gap, and it pulls her over
// A tool is given in a moment of its own (give): it flies up from where it was, she holds it over her head, stars.
// The cards are drawn here; the stage wears the mask on her (paper.js), the sets say where each tool is found and used.
import { THREE, paper } from './kit.js';
import { P, C, piece, ink, line } from './cut.js';

export const SNORKEL = { w: 120, h: 150, frames: 1, size: .5, thing: true, draw(g) {
  piece(g, '#f2b56b', C(92, 100, 92, 34, 6.5)); piece(g, '#f2b56b', C(92, 100, 74, 108, 6)); piece(g, '#e98f8f', C(92, 34, 92, 22, 8.5), .5);            // the tube, its bend to her mouth, its red top
  piece(g, '#5f9fae', P([[16, 62], [26, 52], [74, 52], [84, 62], [84, 84], [74, 94], [26, 94], [16, 84]]));                                              // the mask
  piece(g, '#cfeaf0', P([[24, 64], [30, 59], [70, 59], [76, 64], [76, 82], [70, 87], [30, 87], [24, 82]]), .4);
  ink(g, '#ffffff', P([[30, 64], [44, 62], [36, 72]]));
} };
export const FLIPPERS = { w: 150, h: 90, frames: 1, size: .26, thing: true, draw(g) {
  for (const [x, c] of [[40, '#9ed9cf'], [104, '#7fbcc0']]) { piece(g, c, P([[x - 8, 14], [x + 8, 14], [x + 26, 70], [x + 10, 78], [x, 70], [x - 10, 78], [x - 26, 70]])); line(g, '#5f9fae', 2.4, [[x, 28], [x, 66]]); }
} };
export const HOOK = { w: 170, h: 120, frames: 1, size: .42, thing: true, draw(g) {
  piece(g, '#b98a5a', C(28, 92, 78, 60, 9, 8)); piece(g, '#8d6a48', C(20, 98, 34, 88, 10), .5);                                                           // the grip
  piece(g, '#cbc5d6', C(78, 60, 112, 40, 6)); piece(g, '#bdb6c9', P([[104, 22], [150, 18], [142, 30], [156, 44], [134, 46], [128, 62], [112, 50]]));       // the shaft and the hook's head
  for (const [x, y] of [[52, 96], [66, 102], [80, 98]]) piece(g, '#d9d2c4', C(x, y, x + .1, y, 6), .4);                                                    // a few links of its chain
} };

/** The moment a tool becomes hers. Made while the set is built (a card cannot be made later): gift(S, name, spec) gives
 *  back give(from, done). `from`: [x, y, z] in the world, where it comes up from. It flies up and over to her, she holds
 *  it over her head, stars; `done` when it is over. She is busy meanwhile (a toy of its own). */
export function gift(S, name, spec) {
  const { girl, sfx } = S, f = S.figure(name, spec); f.g.visible = false;
  return (from, done) => {
    let t = 0, rang = false; f.g.visible = true; f.x = from[0]; f.z = from[2]; f.floatY = f.y = from[1];
    const toy = { look: [girl.x, girl.z], step(dt) {
      t += dt; const top = S.head(), k = Math.min(1, t / .9), e = k * k * (3 - 2 * k);
      f.x = from[0] + (top.x - from[0]) * e; f.z = from[2] + (top.z + .05 - from[2]) * e; f.floatY = f.y = from[1] + (top.y + .14 - from[1]) * e + Math.sin(k * Math.PI) * 1.1;
      girl.view = 'front'; girl.poseName = k > .7 ? 'up' : null;
      if (!rang && k >= 1) { rang = true; sfx.chime(); S.confetti(top.x, top.y + .5, top.z, ['#f2a7c0', '#b9a3e8', '#9fd8d0', '#eac15a'], 22, S.starGeo, 2.8); }
      if (t > 2.7) { f.g.visible = false; girl.poseName = null; S.stopPlay(); if (done) done(); }
    } };
    S.play(toy);
  };
}

/** A gap in a bridge that runs north-south: the planks are gone between z0 and z1 (the set's measure; `x` the bridge's
 *  middle, `deck` its height). At each lip stands a post with a ring. A tap on a post: without the hookshot it shakes and
 *  shows what is wanted; with it she walks to the lip, throws the hook over to the far post, and is pulled across in an
 *  arc; the unicorn comes flying after. Both ways, every time: the gap stays a gap. (`mend(planks)` lays the planks for
 *  the tests' walk-everywhere check.) */
export function hookGap(S, x, z0, z1, deck, planks) {
  const { girl, uni, sfx } = S, [wx, wa] = S.at([x, z0]), wb = S.at([x, z1])[1], mid = (wa + wb) / 2, origin = S.at([0, 0]);
  const wall = S.wall(x, (z0 + z1) / 2, .95, (z1 - z0) / 2 - .05), tops = [], posts = new THREE.Group(); S.root.add(posts);
  [z0 - .3, z1 + .3].forEach(z => { const p = new THREE.Mesh(new THREE.CylinderGeometry(.07, .08, 2.6, 8), paper('#8d6a48')); p.position.set(x + .82, deck - .1, z); p.castShadow = true; posts.add(p); const r = new THREE.Mesh(new THREE.TorusGeometry(.13, .035, 6, 14), paper('#f2c65c')); r.position.set(x + .82, deck + 1.32, z); r.castShadow = true; posts.add(r); tops.push(new THREE.Vector3(wx + .82, deck + 1.32, S.at([x, z])[1])); });
  const wish = S.figure('haakwens', HOOK); wish.g.visible = false; wish.act = () => wish.setFrame(0);
  const rope = new THREE.Mesh(new THREE.BoxGeometry(.03, .03, 1), paper('#d9d2c4')); rope.userData.live = true; rope.visible = false; S.root.add(rope);
  const head = new THREE.Mesh(new THREE.ConeGeometry(.07, .2, 6), paper('#bdb6c9')); head.userData.live = true; head.visible = false; S.root.add(head);
  const span = (a, b) => { rope.position.copy(a).lerp(b, .5); rope.position.x -= origin[0]; rope.position.z -= origin[1]; rope.scale.z = Math.max(.01, a.distanceTo(b)); rope.lookAt(b.x, b.y, b.z); head.position.set(b.x - origin[0], b.y, b.z - origin[1]); rope.visible = head.visible = true; };
  let mode = null, t = 0, from = 0, to = 0, ufrom = null, far = null, crossings = 0, show = 0, wishes = 0, mended = false; const tip = new THREE.Vector3();
  const toy = { look: [wx, mid], step(dt) {
    t += dt; const hand = S.hand(); girl.x = wx; girl.view = to < from ? 'back' : 'front'; girl.poseName = 'up';
    if (mode === 'throw') { const k = Math.min(1, t / .28); span(hand, tip.copy(hand).lerp(far, k)); if (k >= 1) { mode = 'pull'; t = 0; sfx.click(); } return; }
    const k = Math.min(1, t / .8), e = k * k * (3 - 2 * k), uk = Math.max(0, Math.min(1, (t - .25) / .8)), ue = uk * uk * (3 - 2 * uk), utoZ = to + (to > from ? .95 : -.95);
    girl.z = from + (to - from) * e; girl.lift = Math.sin(k * Math.PI) * .75; if (k < 1) span(S.hand(), far); else rope.visible = head.visible = false;
    if (!uni.away) { uni.busy = true; uni.walking = false; uni.x = ufrom[0] + (wx - ufrom[0]) * ue; uni.z = ufrom[1] + (utoZ - ufrom[1]) * ue; uni.lift = Math.sin(uk * Math.PI) * 1.0; }
    if (k >= 1 && (uk >= 1 || uni.away)) { girl.lift = 0; girl.poseName = null; uni.lift = 0; crossings++; mode = null; girl.hopV = 1.6; sfx.thud(); S.stopPlay(); }
  } };
  const tap = () => {
    if (S.playing() || mended) return;
    if (!S.gear.hook) { show = 2.6; wishes++; wish.hopV = 2.2; sfx.rustle(); const side = girl.z < mid ? 0 : 1; wish.x = tops[side].x; wish.z = tops[side].z + .05; wish.floatY = wish.y = deck + 1.75; return; }
    const side = girl.z < mid ? 0 : 1, lip = side ? wb + .6 : wa - .6;
    S.walkThen(wx, lip, () => { if (S.playing()) return; from = lip; to = side ? wa - .65 : wb + .65; far = tops[1 - side]; ufrom = [uni.x, uni.z]; mode = 'throw'; t = 0; sfx.swish(3); S.play(toy); }, 1.2);
  };
  S.tap(posts, tap);
  return { toy, tap, mend() { mended = true; wall[2] = 0; if (planks) planks.visible = true; }, state: () => ({ crossings, wishes, wishing: show > 0, mended, busy: !!mode }), step({ dt }) { if (show > 0) { show -= dt; wish.g.visible = show > 0; } } };
}
