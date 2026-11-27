// What stands on the beach (set-strand.js): folded card, like everything she walks round or builds.
//   palm         a leaning trunk of rings and a crown of fronds. A tap: it shakes, and a paper coconut drops: kick it about
//   parasol      a striped shade on a pole
//   lighthouse   red and white on its rock. A tap lights it, a tap puts it out; lit, two beams turn. At night it is on
//   sandcastle   a heap of sand, a bucket and a spade. Every tap she builds a piece more: a tower, a second, a wall and a
//                gate, a third tower, a flag. It stays as she left it. A tap on the finished castle: she jumps on it, and
//                it is a heap again
import { THREE, rng, paper, card, circlePts, slab } from './kit.js';
import { ball } from './dog.js';
import { CARDS3 } from './cards3.js';

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
  // the coconut: a paper card (cards3.js). A shake and it drops; on the sand it is a ball she can kick (Oscar: "the coconuts
  // falling from the trees should be paper. let us kick them"). Kicked far away, the next shake drops a new one
  const nut = ball(S, x + px + .25, y, z + .3, undefined, 'kokos' + seed, CARDS3.kokosnoot); nut.f.g.visible = false;
  let wob = 0, fall = -1, nuts = 0, taps = 0, down = false; const [wx, wz] = S.at([x, z]);
  S.tap(g, () => { wob = 1; taps++; S.sfx.rustle(); const away = !down || Math.hypot(nut.x - (wx + px + .25), nut.z - (wz + .3)) > 2.5; if (fall < 0 && away) { nuts++; fall = 0; down = false; nut.x = wx + px + .25; nut.z = wz + .3; nut.vx = nut.vz = nut.vy = 0; nut.f.g.visible = true; } });
  return { nut, state: () => ({ taps, nuts, down, at: [nut.x, nut.z], kicks: nut.kicks }), step({ dt, tick, stepped }) {
    if (stepped) { if (wob > .03) { wob *= .8; crown.rotation.z = Math.sin(tick * 2.1) * .12 * wob; } else crown.rotation.z = 0; }
    if (fall >= 0) { fall += dt; const yy = py - .15 - 4.9 * fall * fall; nut.f.x = nut.x; nut.f.z = nut.z; nut.f.lift = Math.max(.02, yy); nut.f.tilt = fall * 6;
      if (yy <= .05) { fall = -1; down = true; nut.lift = 0; nut.vy = 1.2; nut.kick(.3, .2, .6, 1.2); nut.kicks--; S.sfx.thud(); S.confetti(nut.x, y + .1, nut.z, ['#ecd3a0', '#f7ecd0'], 6, undefined, 1.3); } }
    else if (down) nut.step(dt);
  } };
}

export function parasol(S, x, y, z, a = '#e98f8f', b = '#fbf5ea') {
  const g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g);
  const pole = mesh(new THREE.CylinderGeometry(.025, .025, 1.7, 6), '#efe8dc'); pole.position.y = .85; pole.rotation.z = .08; g.add(pole);
  for (let i = 0; i < 8; i++) { const s = mesh(new THREE.ConeGeometry(.95, .36, 1, 1, true, i / 8 * Math.PI * 2, Math.PI / 4), i % 2 ? a : b, { side: THREE.DoubleSide }); s.position.set(-.07, 1.72, 0); s.rotation.z = .08; g.add(s); }
  S.solid({ x, z, r: .08 });
}

let glowT = null, beamT = null;
/** a soft round glow: bright in the middle, gone at the edge */
function glowTex() { if (glowT) return glowT; const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.18, 'rgba(255,240,210,.75)'); r.addColorStop(.5, 'rgba(255,220,170,.22)'); r.addColorStop(1, 'rgba(255,210,160,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  glowT = new THREE.CanvasTexture(c); glowT.colorSpace = THREE.SRGBColorSpace; return glowT; }
/** a beam: strong at the lamp (the cone's tip, the top of the texture), fading to nothing at its far end and at its sides */
function beamTex() { if (beamT) return beamT; const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d'), v = g.createLinearGradient(0, 0, 0, 256);
  v.addColorStop(0, 'rgba(255,255,255,.9)'); v.addColorStop(.25, 'rgba(255,255,255,.35)'); v.addColorStop(.7, 'rgba(255,255,255,.08)'); v.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = v; g.fillRect(0, 0, 64, 256);
  beamT = new THREE.CanvasTexture(c); beamT.colorSpace = THREE.SRGBColorSpace; return beamT; }
export function lighthouse(S, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g); const H = 3.4, bands = 5;
  for (let i = 0; i < bands; i++) { const r0 = .78 - i * .06, r1 = r0 - .06, m = mesh(new THREE.CylinderGeometry(r1, r0, H / bands, 14), i % 2 ? '#fbf5ea' : '#d9706c'); m.position.y = H / bands * (i + .5); g.add(m); }
  const deck = mesh(new THREE.CylinderGeometry(.7, .7, .08, 14), '#6f625c'); deck.position.y = H + .04; g.add(deck);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, p = mesh(new THREE.CylinderGeometry(.018, .018, .26, 4), '#6f625c'); p.position.set(Math.cos(a) * .64, H + .2, Math.sin(a) * .64); g.add(p); }
  const rail = mesh(new THREE.TorusGeometry(.64, .016, 4, 16), '#6f625c'); rail.rotation.x = Math.PI / 2; rail.position.y = H + .33; g.add(rail);
  // the lamp room: glass that glows when it is lit, as the street lamps do, and a soft halo round it
  const glassM = new THREE.MeshStandardMaterial({ color: '#f6dfa6', emissive: '#ffcf86', emissiveIntensity: 0, roughness: .6 });
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(.36, .36, .5, 12), glassM); glass.position.y = H + .33; glass.userData.live = true; g.add(glass);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#ffd9a0', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.set(3.2, 3.2, 1); halo.position.y = H + .35; halo.userData.live = true; g.add(halo);
  const roof = mesh(new THREE.ConeGeometry(.5, .45, 10), '#d9706c'); roof.position.y = H + .8; g.add(roof);
  const door = card([[-.2, 0], [-.2, .5], [-.12, .62], [0, .66], [.12, .62], [.2, .5], [.2, 0]], .03, paper('#6f625c')); door.position.set(0, 0, .775); g.add(door);
  const win = card(circlePts(.11, 3, 12), .03, paper('#f6dfa6')); win.position.set(0, H * .58, .66); g.add(win);
  // the beams: two long soft cones of light that fade out as they go, turning slowly (no hard edges: light, not paper)
  const beams = new THREE.Group(); beams.position.y = H + .33; beams.visible = false; beams.userData.live = true; g.add(beams);
  const beamM = new THREE.MeshBasicMaterial({ map: beamTex(), color: '#ffe2b0', transparent: true, opacity: .55, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  for (const ry of [0, Math.PI]) { const cone = new THREE.Mesh(new THREE.ConeGeometry(1.5, 9, 24, 1, true), beamM); cone.rotation.z = Math.PI / 2; cone.position.x = 4.5; const hold = new THREE.Group(); hold.rotation.y = ry; hold.rotation.z = -.1; hold.add(cone); beams.add(hold); }
  // and a real light, like a street lamp's: it lights the rock, the sand and her when she is near
  const lamp = S.lamp(4, '#ffc98a', 11, 1.3); lamp.position.set(x, y + H + .35, z); let glow = 0;   // (a lamp is placed in the set's own measure)
  S.wall(x, z, .8, .8);
  let on = false, byHand = null, taps = 0;
  S.tap(g, () => { taps++; byHand = !on; S.sfx.click(); });
  return { state: () => ({ lit: on, taps }), step({ dt, eve }) {
    const night = eve > .5; if (byHand !== null && byHand === night) byHand = null;   // (her switch holds until the day itself agrees with it)
    on = byHand !== null ? byHand : night; glow += ((on ? 1 : 0) - glow) * Math.min(1, dt * 4);
    glassM.emissiveIntensity = glow * 2.2; halo.material.opacity = glow * (.55 + Math.sin(performance.now() / 700) * .05); lamp.intensity = glow * 3.2; beams.visible = glow > .02; beamM.opacity = glow * .5; if (beams.visible) beams.rotation.y += dt * .6;
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
