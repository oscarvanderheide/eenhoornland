// What stands on the castle island (set-kasteel.js).
//   castle     a paper castle: a wall with a gate, a keep, two round towers with pointed roofs and flags. It has three
//              windows with shutters. A tap on a window: the shutters swing open and somebody looks out and says hello;
//              a little later they close again. Always the same somebody in the same window
//   carousel   a merry-go-round. A tap: she gets on, and the unicorn too, across from her. A push to the side turns it,
//              and it keeps turning (it is a real spinning thing: pushes add speed, the air takes a little away). The
//              other way slows it. A touch on her: it stops, and off they get
import { THREE, paper, card } from './kit.js';
import { ANIMALS } from './animals.js';

const mesh = (geo, col, o) => { const m = new THREE.Mesh(geo, paper(col, o)); m.castShadow = m.receiveShadow = true; return m; };
const WALL = '#f6e7d8', WALL2 = '#ecd9c6', STONE = '#d9cfc2';

export function castle(S, x, y, z) {
  const { sfx } = S, g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g); const [wx, wz] = S.at([x, z]);
  const add = (geo, col, px, py, pz, o) => { const m = mesh(geo, col, o); m.position.set(px, py, pz); g.add(m); return m; };
  const battlements = (cx, top, w, zc, n) => { for (let i = 0; i < n; i++) add(new THREE.BoxGeometry(w / n * .55, .22, .26), WALL2, cx - w / 2 + (i + .5) * w / n, top + .11, zc); };
  add(new THREE.BoxGeometry(7.4, 2.1, 1.1), WALL, 0, 1.05, 0); battlements(0, 2.1, 7.4, .42, 13);                       // the wall
  add(new THREE.BoxGeometry(2.6, 3.5, 1.5), WALL, 0, 1.75, -.25); battlements(0, 3.5, 2.6, .37, 5);                     // the keep
  const roof = add(new THREE.ConeGeometry(1.5, 1.2, 4), '#8fc3e0', 0, 4.1, -.25); roof.rotation.y = Math.PI / 4;
  for (const s of [-1, 1]) { add(new THREE.CylinderGeometry(.82, .9, 3.2, 14), WALL2, s * 3.9, 1.6, .1); add(new THREE.CylinderGeometry(.98, .98, .16, 14), STONE, s * 3.9, 3.2, .1); add(new THREE.ConeGeometry(1.02, 1.4, 14), s < 0 ? '#e98f8f' : '#bba6ea', s * 3.9, 4.0, .1); }
  // flags
  for (const [fx, fy, fz, c] of [[-3.9, 4.7, .1, '#f2c65c'], [3.9, 4.7, .1, '#f2c65c'], [0, 4.7, -.25, '#e98f8f']]) { add(new THREE.CylinderGeometry(.016, .016, .6, 4), '#8d6a48', fx, fy + .3, fz); const f = card([[0, 0], [.34, -.1], [0, -.2]], .012, paper(c, { side: THREE.DoubleSide })); f.position.set(fx + .015, fy + .6, fz); g.add(f); }
  // the gate: a dark arch, two doors of wood
  const arch = card([[-.62, 0], [-.62, .95], [-.44, 1.3], [0, 1.46], [.44, 1.3], [.62, .95], [.62, 0]], .04, paper('#8d6a48')); arch.position.set(0, 0, .56); g.add(arch);
  for (const s of [-1, 1]) { const d = card([[0, 0], [0, 1.36], [.3, 1.24], [.5, .92], [.5, 0]], .03, paper('#b98a5a')); d.position.set(s < 0 ? -.52 : .52, 0, .6); d.scale.x = s < 0 ? 1 : -1; g.add(d); }
  S.wall(x, z - .05, 3.8, .75); S.solid({ x: x - 3.9, z: z + .1, r: .95 }); S.solid({ x: x + 3.9, z: z + .1, r: .95 });
  // the windows: who lives behind each, where it is, how big its card stands there
  const wins = [['uil', -1.95, 1.2, .57, () => sfx.hoot()], ['kuiken', 1.95, 1.2, .57, () => sfx.peep()], ['eekhoorn', 0, 2.5, .52, () => sfx.yip()]].map(([kind, px, py, pz, say], i) => {
    const frame = card([[-.36, 0], [-.36, .5], [-.2, .68], [0, .74], [.2, .68], [.36, .5], [.36, 0]], .03, paper('#6f5a48')); frame.position.set(px, py, pz); g.add(frame);
    const sill = mesh(new THREE.BoxGeometry(.86, .06, .16), STONE); sill.position.set(px, py - .03, pz + .06); g.add(sill);
    const shut = [-1, 1].map(s => { const hinge = new THREE.Group(); hinge.position.set(px + s * .36, py, pz + .05); hinge.userData.live = true; const d = mesh(new THREE.BoxGeometry(.36, .62, .03), s < 0 ? '#8fc3e0' : '#8fc3e0'); d.position.set(-s * .18, .33, 0); hinge.add(d); g.add(hinge); S.glue(hinge); return { hinge, s }; });
    const f = S.figure('raam' + i, ANIMALS[kind]); f.x = wx + px; f.z = wz + pz + .02; f.floatY = f.y = y + py + .02; f.g.visible = false; const k = .5 / f.H; f.g.scale.setScalar(Math.min(1, k * 1.15));
    const hit = mesh(new THREE.BoxGeometry(.8, .8, .1), WALL); hit.position.set(px, py + .36, pz - .04); hit.visible = false; g.add(hit);
    return { f, shut, say, open: 0, t: -1, opens: 0, px, py, pz };
  });
  const at = (px, py) => wins.find(w => Math.abs(w.px - px) < .5 && Math.abs(w.py + .36 - py) < .55);
  const openIt = w => { if (!w || w.t >= 0) return; w.t = 0; w.opens++; sfx.click(); };
  // a tap anywhere on the castle opens the window nearest to where the finger was (a tap on the wall low down: the gate knocks)
  S.tap(g, hit => { const p = hit && hit.point, w = p ? at(p.x - wx, p.y - y) : null; if (w) openIt(w); else sfx.thud(); });
  wins.forEach(w => { w.f.onTap = () => { if (w.t >= 0) { w.f.hopV = 1.2; w.say(); } }; });
  return { wins, open: i => openIt(wins[i]), state: () => ({ open: wins.map(w => w.t >= 0), opens: wins.map(w => w.opens) }), step({ dt }) {
    for (const w of wins) {
      if (w.t >= 0) { w.t += dt; if (w.t > .3 && !w.f.g.visible) { w.f.g.visible = true; w.f.hopV = 1.4; w.say(); } if (w.t > 3.6) { w.t = -1; w.f.g.visible = false; } }
      const want = w.t >= 0 ? 1 : 0; w.open += (want - w.open) * Math.min(1, dt * 9); for (const q of w.shut) q.hinge.rotation.y = -q.s * w.open * 1.9;
    }
  } };
}

export function carousel(S, x, y, z) {
  const { girl, uni, sfx } = S, g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g); const R = 1.25, [wx, wz] = S.at([x, z]);
  const base = mesh(new THREE.CylinderGeometry(1.75, 1.85, .16, 24), '#f6e7d8'); base.position.y = .08; g.add(base);
  const col = mesh(new THREE.CylinderGeometry(.2, .24, 2.5, 12), '#f2c65c'); col.position.y = 1.25; g.add(col);
  const spin = new THREE.Group(); spin.userData.live = true; g.add(spin);
  const ring = mesh(new THREE.CylinderGeometry(1.62, 1.62, .06, 24), '#e98f8f'); ring.position.y = .19; spin.add(ring);
  const seats = ['#9ed9cf', '#f4a6c4', '#f2c65c', '#bba6ea', '#8fc3e0', '#f2b56b'];
  seats.forEach((c, i) => { const a = i / 6 * Math.PI * 2, px = Math.cos(a) * R, pz = Math.sin(a) * R; const pole = mesh(new THREE.CylinderGeometry(.022, .022, 2.2, 5), '#fbf5ea'); pole.position.set(px, 1.3, pz); spin.add(pole); if (i % 3 === 0) return; const seat = mesh(new THREE.BoxGeometry(.5, .16, .22), c); seat.position.set(px, .62 + (i % 2) * .16, pz); seat.rotation.y = -a + Math.PI / 2; spin.add(seat); const head = mesh(new THREE.BoxGeometry(.14, .26, .16), c); head.position.set(px - Math.sin(a) * .26, .8 + (i % 2) * .16, pz + Math.cos(a) * .26); head.rotation.y = -a + Math.PI / 2; spin.add(head); });
  for (let i = 0; i < 12; i++) { const s = mesh(new THREE.ConeGeometry(1.95, .75, 1, 1, true, i / 12 * Math.PI * 2, Math.PI / 6), i % 2 ? '#fbf5ea' : '#e98f8f', { side: THREE.DoubleSide }); s.position.y = 2.78; spin.add(s); }
  const top = mesh(new THREE.SphereGeometry(.13, 10, 8), '#f2c65c'); top.position.y = 3.2; spin.add(top);
  S.glue(spin); S.solid({ x, z, r: 1.85 });
  let a = 0, w = 0, mode = null, t = 0, turns = 0, sound = 0, from = null, ufrom = null, leave = false, fastest = 0;
  const pos = th => [wx + Math.cos(th) * R, wz + Math.sin(th) * R], bob = th => .46 + Math.sin(th * 2 + a) * .0;
  const ride = k => {
    const th = Math.PI / 2 + a, [gx, gz] = pos(th), [ux, uz] = pos(th + Math.PI);
    girl.x = from[0] + (gx - from[0]) * k; girl.z = from[1] + (gz - from[1]) * k; girl.lift = .52 * k + Math.sin(k * Math.PI) * .35; girl.view = 'side'; girl.poseName = k > .6 ? 'sit' : null; if (Math.abs(w) > .2) girl.face = Math.sign(-Math.sin(th) * w) || 1;
    uni.busy = true; uni.walking = false; uni.x = ufrom[0] + (ux - ufrom[0]) * k; uni.z = ufrom[1] + (uz - ufrom[1]) * k; uni.lift = .36 * k + Math.sin(k * Math.PI) * .45; if (Math.abs(w) > .2) uni.face = Math.sign(Math.sin(th) * w) || 1;
  };
  const toy = { look: [wx, wz + .4], step(dt, inp) {
    t += dt; spin.rotation.y = -a;
    if (mode === 'on') { const k = Math.min(1, t / .4); ride(k); if (k >= 1) { mode = 'ride'; sfx.hop(); } return; }
    if (mode === 'off') { const k = Math.min(1, t / .35), th = Math.PI / 2 + a, [ox, oz] = [wx + Math.cos(th) * 2.35, wz + Math.sin(th) * 2.35], [px, pz] = pos(th), [uox, uoz] = [wx + Math.cos(th + Math.PI) * 2.3, wz + Math.sin(th + Math.PI) * 2.3], [upx, upz] = pos(th + Math.PI);
      girl.x = px + (ox - px) * k; girl.z = pz + (oz - pz) * k; girl.lift = .52 * (1 - k) + Math.sin(k * Math.PI) * .3; girl.poseName = null; uni.x = upx + (uox - upx) * k; uni.z = upz + (uoz - upz) * k; uni.lift = .36 * (1 - k) + Math.sin(k * Math.PI) * .35;
      if (k >= 1) { mode = null; S.stopPlay(); } return; }
    if (inp.act) leave = true;
    w += inp.x * 2.4 * dt; w -= w * (leave ? 3.2 : .22) * dt; w = Math.max(-4.2, Math.min(4.2, w)); a += w * dt; turns += Math.abs(w) * dt / (Math.PI * 2); fastest = Math.max(fastest, Math.abs(w));
    sound -= dt * Math.abs(w); if (sound <= 0 && Math.abs(w) > 1) { sound = 3.2; sfx.whirr(); }
    if (Math.abs(w) > 3) S.confetti(...pos(Math.PI / 2 + a - Math.sign(w) * .3).flatMap((v, i) => i ? [y + 1.2, v] : [v]), ['#f4a6c4', '#f2c65c', '#9ed9cf', '#bba6ea'], 1, S.starGeo, .8);
    ride(1);
    if (leave && Math.abs(w) < .25) { const th = Math.PI / 2 + a; if (S.free(wx + Math.cos(th) * 2.35, wz + Math.sin(th) * 2.35, y) && S.free(wx + Math.cos(th + Math.PI) * 2.3, wz + Math.sin(th + Math.PI) * 2.3, y)) { leave = false; w = 0; mode = 'off'; t = 0; } else w = .5; }   // (stopped where one of them could not step off: a little further round)
  } };
  S.tap(g, () => { if (S.playing()) return; const th = Math.PI / 2 + a; S.walkThen(wx + Math.cos(th) * 2.35, wz + Math.sin(th) * 2.35, () => { if (S.playing()) return; mode = 'on'; t = 0; w = 0; leave = false; from = [girl.x, girl.z]; ufrom = [uni.x, uni.z]; S.play(toy); }, 1.3); });
  return { toy, state: () => ({ mode, w, turns, fastest }), step() { if (!mode) spin.rotation.y = -a; } };
}
