// What stands on the beach (set-strand.js): folded card, like everything she walks round or builds.
//   palm         a leaning trunk of rings and a crown of fronds. A tap: it shakes, and the first time a coconut drops
//   parasol      a striped shade on a pole
//   lighthouse   red and white on its rock. A tap lights it, a tap puts it out; lit, two beams turn. At night it is on
//   sandcastle   a heap of sand, a bucket and a spade. Every tap she builds a piece more: a tower, a second, a wall and a
//                gate, a third tower, a flag. It stays as she left it. A tap on the finished castle: she jumps on it, and
//                it is a heap again
import { THREE, rng, paper, card, circlePts, slab } from './kit.js';

const mesh = (geo, col, o) => { const m = new THREE.Mesh(geo, paper(col, o)); m.castShadow = m.receiveShadow = true; return m; };
const FROND = [[0, 0], [.22, .1], [.55, .13], [.9, .06], [1.12, -.12], [.88, -.03], [.58, .0], [.28, -.05]];

export function palm(S, x, y, z, seed = 1, h = 2.5) {
  const g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g); const R = rng(seed), lean = (R() - .5) * .7, N = 6, seg = h / N;
  let px = 0, py = 0;
  for (let i = 0; i < N; i++) { const a = lean * (i / (N - 1)), m = mesh(new THREE.CylinderGeometry(.08 - i * .006, .1 - i * .006, seg + .03, 7), i % 2 ? '#b98a5a' : '#a97a4e'); m.position.set(px + Math.sin(a) * seg / 2, py + Math.cos(a) * seg / 2, 0); m.rotation.z = -a; px += Math.sin(a) * seg; py += Math.cos(a) * seg; g.add(m); }
  const crown = new THREE.Group(); crown.position.set(px, py, 0); crown.userData.live = true; g.add(crown);
  for (let i = 0; i < 7; i++) { const hold = new THREE.Group(); hold.rotation.y = i / 7 * Math.PI * 2 + R() * .3; const lf = card(FROND, .016, paper(i % 2 ? '#7fa676' : '#93b071', { side: THREE.DoubleSide })); lf.rotation.x = -1.0; lf.rotation.z = -.18 - R() * .22; lf.scale.setScalar(.95 + R() * .3); hold.add(lf); crown.add(hold); }
  for (const [nx, nz] of [[.1, .08], [-.09, .04]]) { const c = mesh(new THREE.SphereGeometry(.085, 8, 6), '#8d6a48'); c.position.set(nx, -.1, nz); crown.add(c); }
  S.glue(crown); S.solid({ x, z, r: .14 });
  const nut = mesh(new THREE.SphereGeometry(.09, 8, 6), '#8d6a48'); nut.visible = false; nut.userData.live = true; g.add(nut);
  let wob = 0, fall = -1, nuts = 0, taps = 0; const [wx, wz] = S.at([x, z]);
  S.tap(g, () => { wob = 1; taps++; S.sfx.rustle(); if (!nuts) { nuts = 1; fall = 0; nut.visible = true; nut.position.set(px + .25, py - .15, .3); } });
  return { state: () => ({ taps, nuts }), step({ dt, tick, stepped }) {
    if (stepped) { if (wob > .03) { wob *= .8; crown.rotation.z = Math.sin(tick * 2.1) * .12 * wob; } else crown.rotation.z = 0; }
    if (fall >= 0) { fall += dt; const yy = py - .15 - 4.9 * fall * fall; if (yy <= .08) { nut.position.y = .08; fall = -1; S.sfx.thud(); S.confetti(wx + px + .25, y + .1, wz + .3, ['#ecd3a0', '#f7ecd0'], 5, undefined, 1.2); } else nut.position.y = yy; }
  } };
}

export function parasol(S, x, y, z, a = '#e98f8f', b = '#fbf5ea') {
  const g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g);
  const pole = mesh(new THREE.CylinderGeometry(.025, .025, 1.7, 6), '#efe8dc'); pole.position.y = .85; pole.rotation.z = .08; g.add(pole);
  for (let i = 0; i < 8; i++) { const s = mesh(new THREE.ConeGeometry(.95, .36, 1, 1, true, i / 8 * Math.PI * 2, Math.PI / 4), i % 2 ? a : b, { side: THREE.DoubleSide }); s.position.set(-.07, 1.72, 0); s.rotation.z = .08; g.add(s); }
  S.solid({ x, z, r: .08 });
}

export function lighthouse(S, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g); const H = 3.4, bands = 5;
  for (let i = 0; i < bands; i++) { const r0 = .78 - i * .06, r1 = r0 - .06, m = mesh(new THREE.CylinderGeometry(r1, r0, H / bands, 14), i % 2 ? '#fbf5ea' : '#d9706c'); m.position.y = H / bands * (i + .5); g.add(m); }
  const deck = mesh(new THREE.CylinderGeometry(.7, .7, .08, 14), '#6f625c'); deck.position.y = H + .04; g.add(deck);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, p = mesh(new THREE.CylinderGeometry(.018, .018, .26, 4), '#6f625c'); p.position.set(Math.cos(a) * .64, H + .2, Math.sin(a) * .64); g.add(p); }
  const rail = mesh(new THREE.TorusGeometry(.64, .016, 4, 16), '#6f625c'); rail.rotation.x = Math.PI / 2; rail.position.y = H + .33; g.add(rail);
  const glass = mesh(new THREE.CylinderGeometry(.36, .36, .5, 10), '#f6dfa6'); glass.position.y = H + .33; g.add(glass);
  const glow = new THREE.Mesh(new THREE.CylinderGeometry(.37, .37, .5, 10), new THREE.MeshBasicMaterial({ color: '#fff3c4' })); glow.position.y = H + .33; glow.visible = false; glow.userData.live = true; g.add(glow);
  const roof = mesh(new THREE.ConeGeometry(.5, .45, 10), '#d9706c'); roof.position.y = H + .8; g.add(roof);
  const door = card([[-.2, 0], [-.2, .5], [-.12, .62], [0, .66], [.12, .62], [.2, .5], [.2, 0]], .03, paper('#6f625c')); door.position.set(0, 0, .775); g.add(door);
  const win = card(circlePts(.11, 3, 12), .03, paper('#f6dfa6')); win.position.set(0, H * .58, .66); g.add(win);
  // the beams: two long thin wedges of light, turning
  const beams = new THREE.Group(); beams.position.y = H + .33; beams.visible = false; beams.userData.live = true; g.add(beams);
  const wedge = new THREE.Shape([[0, -.1], [10, -1.0], [10, 1.0], [0, .1]].map(([a, b]) => new THREE.Vector2(a, b))), lightM = new THREE.MeshBasicMaterial({ color: '#fff3c4', transparent: true, opacity: .2, depthWrite: false, side: THREE.DoubleSide });
  for (const ry of [0, Math.PI]) { const b = new THREE.Mesh(new THREE.ShapeGeometry(wedge), lightM); b.rotation.x = -Math.PI / 2; const hold = new THREE.Group(); hold.rotation.y = ry; hold.rotation.z = -.3; hold.add(b); beams.add(hold); }
  S.wall(x, z, .8, .8);
  let on = false, byHand = null, taps = 0;
  S.tap(g, () => { taps++; byHand = !on; S.sfx.click(); });
  return { state: () => ({ lit: on, taps }), step({ dt, eve }) {
    const night = eve > .5; if (byHand !== null && byHand === night) byHand = null;   // (her switch holds until the day itself agrees with it)
    on = byHand !== null ? byHand : night; glow.visible = beams.visible = on; if (on) beams.rotation.y += dt * .7;
  } };
}

export function sandcastle(S, x, y, z) {
  const { girl, sfx } = S, g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g); const SAND = '#e6c98f', SAND2 = '#dcbb7c', [wx, wz] = S.at([x, z]);
  const heap = slab(circlePts(.85, 7, 20), .07, .07, paper(SAND), paper(SAND2)); g.add(heap);
  const tower = (px, pz, r, h) => { const t = new THREE.Group(); const b = mesh(new THREE.CylinderGeometry(r * .88, r, h, 10), SAND); b.position.y = h / 2; t.add(b); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2, c = mesh(new THREE.BoxGeometry(r * .5, r * .42, r * .5), SAND2); c.position.set(Math.cos(a) * r * .68, h + r * .2, Math.sin(a) * r * .68); c.rotation.y = -a; t.add(c); } t.position.set(px, .07, pz); return t; };
  const wall = (() => { const w = new THREE.Group(); const b = mesh(new THREE.BoxGeometry(1.0, .26, .16), SAND2); b.position.set(0, .2, .12); w.add(b); const gate = card([[-.1, 0], [-.1, .13], [0, .2], [.1, .13], [.1, 0]], .02, paper('#a98a5a')); gate.position.set(0, .07, .21); w.add(gate); return w; })();
  const flag = (() => { const f = new THREE.Group(); const p = mesh(new THREE.CylinderGeometry(.012, .012, .42, 4), '#8d6a48'); p.position.y = .21; f.add(p); const c = card([[0, 0], [.22, -.07], [0, -.14]], .012, paper('#e98f8f', { side: THREE.DoubleSide })); c.position.set(.01, .42, 0); f.add(c); f.position.set(0, .07 + .62, -.12); return f; })();
  const parts = [tower(-.5, .12, .2, .34), tower(.5, .12, .2, .34), wall, tower(0, -.12, .25, .58), flag];
  parts.forEach(p => { p.userData.live = true; p.visible = false; g.add(p); S.glue(p); });
  // the bucket and the spade lie beside it
  const bucket = mesh(new THREE.CylinderGeometry(.13, .1, .2, 10), '#7fbcc0'); bucket.position.set(1.05, .1, .35); g.add(bucket);
  const spade = mesh(new THREE.BoxGeometry(.05, .02, .34), '#e98f8f'); spade.position.set(1.3, .02, .1); spade.rotation.y = .5; g.add(spade);
  S.solid({ x, z, r: .5 });
  let stage = 0, built = 0, stomps = 0, t = -1, job = null;
  const show = () => parts.forEach((p, i) => { p.visible = i < stage; });
  const dust = n => S.confetti(wx, y + .3, wz + .2, ['#ecd3a0', '#f7ecd0', '#e2c58a'], n, undefined, 1.8);
  S.tap(g, () => { if (S.playing() || t >= 0) return; S.walkThen(wx - 1.2, wz + .3, () => { if (t >= 0) return; girl.view = 'side'; girl.face = 1; job = stage < parts.length ? 'build' : 'stomp'; t = 0; if (job === 'stomp') { girl.hopV = 3.4; sfx.hop(); } else { girl.hopV = 1.2; sfx.thud(); } }, 1.3); });
  return { state: () => ({ stage, built, stomps, busy: t >= 0 }), step({ dt }) {
    if (t < 0) return; t += dt;
    if (job === 'build' && t > .35) { stage++; built++; show(); dust(7); t = -1; if (stage === parts.length) { sfx.hello(); S.confetti(wx, y + 1.0, wz, ['#e98f8f', '#f2c65c', '#9ed9cf', '#bba6ea'], 16, undefined, 2.4); } else sfx.hop(); }
    else if (job === 'stomp' && t > .5) { stage = 0; stomps++; show(); dust(26); sfx.thud(); t = -1; }
  } };
}
