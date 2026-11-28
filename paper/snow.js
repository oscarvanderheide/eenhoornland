// What lives and plays on the snow island (set-sneeuw.js). Oscar: "a bonus area like a snow area with a santa and iglo's,
// penguins, reindeer, christmas trees, sleigh, snowball throwing". Everything here is only this island's own.
//   firs           snow-covered firs, a white cap with drips on every tier. A tap: it shakes and the snow puffs off
//   igloos         domes of snow blocks; their doorways glow warm in the evening
//   Santa          by the door of his workshop. A tap: ho ho ho, and he gives her a wrapped present to carry. A tap on her
//                  opens it (a teddy, a train or a drum pops out); a tap on her unicorn and it opens it
//   the sleigh     a tap and she gets in, her unicorn behind her, Santa in front; the reindeer pull it up into the sky and
//                  fly her home to the village, the camera wide and to the side; they drop her by the fountain and fly back
//   reindeer       wander by the sleigh; a tap: a happy hop, jingle bells, and it trots after her a little way
//   penguins       waddle round the igloos, now and then off to the pond to slide across it on their bellies. A tap: they
//                  flap and slide. A mother and her chick go in and out of the big igloo
//   the big tree   a Christmas tree with baubles, a garland and a star. A tap: its lights twinkle on to a tune
//   the snowman    she builds it, a ball at a time: big, middle, head, a face, arms and a scarf, a hat
//   snowballs      a tap on the heap: she makes one. With a snowball in her hands every tap throws it there, in a real
//                  arc: the snowman's hat flies off, penguins duck, reindeer hop, Santa laughs. A tap on her drops it
//   the ice        on the frozen pond she keeps gliding a little after she stops, arms out
//   snowflakes     a few slow paper flakes falling round her
import { THREE, rng, paper, card, circlePts, slab, inPoly, whiteEdge } from './kit.js';
import { CARDS5 } from './cards5.js';
import { wanderer } from './candy.js';

const G = 14;   // gravity, as everywhere in the game
const DS = { side: THREE.DoubleSide };
const mesh = (geo, col, o) => { const m = new THREE.Mesh(geo, typeof col === 'string' ? paper(col, o) : col); m.castShadow = m.receiveShadow = true; return m; };
const SNOW = '#f3f6f9', SNOW2 = '#e2eaf1';
/** the snowball in her hands, if any (snowballs()): with one, a tap on anything of this island throws it there */
let thrower = null;
/** S.tap, but with a snowball in her hands the tap throws it at `aim` ({ at(): [x, y, z] in the world, r, hit() }) */
const tapOr = (S, obj, fn, name, aim) => S.tap(obj, hit => { if (thrower && thrower.holding()) { const [x, y, z] = aim.at(); thrower.throwAt(x, y, z, aim); return; } fn(hit); }, name);
export const PUFF = ['#f6f9fb', '#dfe8f0', '#ffffff', '#cfdde9'];

/* ---------------- tunes: bells, note by note (S.sfx.note is a soft bell). Old songs, free to use ---------------- */
const TUNES = {
  jingle: { beat: .25, notes: 'E5 E5 E5:2 E5 E5 E5:2 E5 G5 C5:1.5 D5:.5 E5:4 F5 F5 F5:1.5 F5:.5 F5 E5 E5 E5:.5 E5:.5 E5 D5 D5 E5 D5:2 G5:2' },
  wish: { beat: .3, notes: 'D5 G5 G5:.5 A5:.5 G5:.5 F#5:.5 E5 E5 E5 A5 A5:.5 B5:.5 A5:.5 G5:.5 F#5 D5 D5 B5 B5:.5 C6:.5 B5:.5 A5:.5 G5 E5 D5:.5 D5:.5 E5 A5 F#5 G5:2' },
  tannenbaum: { beat: .34, notes: 'D5 G5:.75 G5:.25 G5:1.5 A5:.5 B5:.75 B5:.25 B5:1.5 B5:.5 A5 B5 C6 F#5 A5 G5:2' },
};
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const hz = n => { const m = /^([A-G])(#?)(\d)$/.exec(n); return 440 * Math.pow(2, (NOTE[m[1]] + (m[2] ? 1 : 0) + (+m[3] + 1) * 12 - 69) / 12); };
/** play a tune on bells; gives back how long it lasts, the beats (for lights to dance to), and stop() */
export function bells(S, name) {
  const T = TUNES[name], ids = [], beats = []; let at = 0;
  for (const tok of T.notes.split(' ')) { const [n, b] = tok.split(':'), f = hz(n), w = at; ids.push(setTimeout(() => S.sfx.note(f), w * 1000)); beats.push(w); at += (b ? +b : 1) * T.beat; }
  return { dur: at, beats, stop() { ids.forEach(clearTimeout); } };
}
/** a little jingle of sleigh bells */
export function jingle(S, n = 6) { const F = [1568, 1760, 2093, 2349, 1976]; for (let i = 0; i < n; i++) setTimeout(() => S.sfx.note(F[(i * 3 + n) % F.length]), i * 70); }
/** Santa's ho ho ho: three low hoots */
const hoho = S => { S.sfx.hoot(); setTimeout(() => S.sfx.hoot(), 420); };

/* ---------------- textures of the island's own ---------------- */
const canvasTex = (w, h, draw, rx = 1, ry = 1) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t; };
/** snow: near white with a blue stipple and glints */
export const snowMap = canvasTex(512, 512, (g, w, h) => { const R = rng(931); g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1600; i++) { g.fillStyle = R() < .7 ? 'rgba(150,175,205,.22)' : 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(R() * w, R() * h, .7 + R() * 1.6, 0, 7); g.fill(); }
  for (let i = 0; i < 60; i++) { g.strokeStyle = 'rgba(170,190,215,.18)'; g.lineWidth = 2; g.beginPath(); const x = R() * w, y = R() * h; g.arc(x, y, 10 + R() * 30, R() * 3, R() * 3 + 1.2); g.stroke(); } }, .3, .3);
/** ice: pale with the curves skates leave */
export const iceMap = canvasTex(512, 512, (g, w, h) => { const R = rng(932); g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 46; i++) { g.strokeStyle = R() < .5 ? 'rgba(255,255,255,.95)' : 'rgba(120,160,190,.25)'; g.lineWidth = 1.2 + R() * 1.6; g.beginPath(); const x = R() * w, y = R() * h, r = 30 + R() * 120, a = R() * 6; g.arc(x, y, r, a, a + .6 + R() * 1.4); g.stroke(); }
  for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(R() * w, R() * h, 2, 2); } }, .35, .35);
const blockMap = canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c3d3e2'; g.lineWidth = 3;
  for (let r = 0; r < 4; r++) { const y = r * 32; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); for (let x = (r % 2) * 21; x < w; x += 42) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke(); } } }, 4, 2);
const plankMap = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(90,30,30,.18)'; for (let y = 0; y < h; y += 32) g.fillRect(0, y, w, 3); }, 1, 1);

/* ---------------- firs: a trunk, three or four tiers, a cap of snow with drips on each ---------------- */
/** an open cone whose bottom edge drips: every other point of its rim hangs lower */
function capGeo(r, h) {
  const geo = new THREE.ConeGeometry(r, h, 12, 1, true), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { if (p.getY(i) > -h / 2 + 1e-4) continue; const a = Math.atan2(p.getZ(i), p.getX(i)), k = Math.round(a / (Math.PI * 2 / 12)), d = ((k % 2) + 2) % 2 ? h * .3 : 0, f = 1 + d / h; p.setXYZ(i, p.getX(i) * f, -h / 2 - d, p.getZ(i) * f); }
  geo.computeVertexNormals(); return geo;
}
const FIRS = ['#4f7d6c', '#46705f', '#5a8a76'];
export function fir(S, x, y, z, s = 1, seed = 1) {
  const R = rng(seed), g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g);
  const sway = new THREE.Group(); sway.userData.live = true; g.add(sway);
  const col = FIRS[seed % 3], tiers = 3 + (R() < .45 ? 1 : 0), H = (2.0 + R() * .7) * s;
  const tr = mesh(new THREE.CylinderGeometry(.07 * s, .1 * s, .5 * s, 7), '#7a5a3e', DS); tr.position.y = .25 * s; sway.add(tr);
  let top = 0;
  for (let i = 0; i < tiers; i++) { const k = i / (tiers - 1), r = (.85 - k * .5) * s, ch = H * .44, base = .36 * s + i * H * (.66 / tiers);
    const c = mesh(new THREE.ConeGeometry(r, ch, 11), col, DS); c.position.y = base + ch / 2; c.rotation.y = R() * 3; sway.add(c);
    const ck = .58, cap = mesh(capGeo(r * ck + .025, ch * ck), SNOW, DS); cap.position.y = base + ch - ch * ck / 2 + .012; cap.rotation.y = R() * 3; sway.add(cap); top = base + ch; }
  S.glue(sway); S.solid({ x, z, r: .4 * s });
  const t = { x, z, top, wob: 0, sway };
  const [wx, wz] = S.at([x, z]), shake = () => { t.wob = 1; S.sfx.rustle(); S.confetti(wx, y + top * .8, wz, PUFF, 14, undefined, 1.2, true); S.confetti(wx, y + top * .5, wz + .3, PUFF, 8, undefined, 1.4); };
  tapOr(S, g, shake, null, { at: () => [wx, y + top * .55, wz], r: .75 * s, hit: shake });
  t.step = ({ dt, time }) => { if (t.wob < .01) { if (t.wob) { t.wob = 0; sway.rotation.set(0, 0, 0); } return; } t.wob *= Math.exp(-dt * 2.6); sway.rotation.z = Math.sin(time * 16) * .07 * t.wob; sway.rotation.x = Math.cos(time * 12) * .03 * t.wob; };
  return t;
}

/* ---------------- igloos ---------------- */
const doorGlow = new THREE.MeshStandardMaterial({ color: '#3e4a68', emissive: '#ffb062', emissiveIntensity: 0, roughness: .9, side: THREE.DoubleSide });
export function igloo(S, x, y, z, r) {
  const g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g);
  const blocks = paper('#eef4f9', { map: blockMap, side: THREE.DoubleSide });
  const dome = mesh(new THREE.SphereGeometry(r, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2), blocks); dome.scale.y = .84; g.add(dome);
  const tr = r * .44, tl = r * .75, tun = mesh(new THREE.CylinderGeometry(tr, tr, tl, 14, 1, true, Math.PI / 2, Math.PI), blocks); tun.rotation.x = Math.PI / 2; tun.position.set(0, 0, r * .72 + tl / 2 - .1); g.add(tun);
  const door = new THREE.Mesh(new THREE.CircleGeometry(tr * .8, 16, 0, Math.PI), doorGlow); door.position.set(0, .01, r * .72 + tl - .09); g.add(door);
  const rim = mesh(new THREE.TorusGeometry(tr * .9, .05, 6, 16, Math.PI), SNOW2); rim.position.copy(door.position); g.add(rim);
  S.solid({ x, z, r: r + .08 }); S.solid({ x, z: z + r * .72 + tl / 2, r: tr + .02 });
  return { door: [x, z + r * .72 + tl + .25], r };
}
/** the doorways of all igloos glow in the evening (one paper for all of them) */
export const iglooGlow = eve => { doorGlow.emissiveIntensity = .08 + eve * 1.5; };

/* ---------------- Santa's workshop: red planks, a roof thick with snow, icicles, a wreath, a glowing window, smoke ---------------- */
export function workshop(S, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g);
  const W = 3.6, D = 2.4, H = 2.0, RISE = 1.15, OV = .35, wall = paper('#d66a5c', { map: plankMap }), half = D / 2 + OV, a = Math.atan2(RISE, half), L = Math.hypot(half, RISE);
  const box = (w, h, d, col, px, py, pz, to = g) => { const m = mesh(new THREE.BoxGeometry(w, h, d), col); m.position.set(px, py, pz); to.add(m); return m; };
  box(W, H, D, wall, 0, H / 2, 0);
  for (const sx of [-1, 1]) { const gab = card([[-D / 2, 0], [D / 2, 0], [0, RISE * (D / 2) / half]], .06, wall); gab.rotation.y = Math.PI / 2; gab.position.set(sx * W / 2, H, 0); g.add(gab); }
  for (const sz of [1, -1]) { const s = new THREE.Group(); s.position.set(0, H + RISE / 2, sz * half / 2); s.rotation.x = sz * a; g.add(s);
    box(W + .5, .12, L + .04, '#7a4a44', 0, 0, 0, s); box(W + .42, .2, L - .06, SNOW, 0, .15, -.02 * sz, s);
    if (sz > 0) for (let i = 0; i < 9; i++) { const b = mesh(new THREE.SphereGeometry(.13 + (i % 3) * .03, 10, 6), SNOW); b.scale.y = .7; b.position.set(-W / 2 - .1 + i * (W + .2) / 8, .12, L / 2 - .02); s.add(b); } }
  // icicles under the front eave
  for (let i = 0; i < 11; i++) { const l = .14 + ((i * 7) % 5) * .05, ic = mesh(new THREE.ConeGeometry(.035, l, 6), '#d6ebf4'); ic.rotation.x = Math.PI; ic.position.set(-W / 2 + .1 + i * (W - .2) / 10, H - l / 2 - .02, half + .02 - .1); g.add(ic); }
  // the door with a wreath, the window
  box(.85, 1.35, .08, '#5f8f6a', -.75, .675, D / 2 + .02); box(.08, .08, .04, '#e6b748', -.5, .66, D / 2 + .08);
  { const wr = mesh(new THREE.TorusGeometry(.2, .065, 8, 18), '#4f7d5c'); wr.position.set(-.75, 1.02, D / 2 + .1); g.add(wr); box(.12, .1, .05, '#d9534f', -.75, .84, D / 2 + .14); for (const [bx, by] of [[-.85, 1.12], [-.62, 1.0], [-.8, .92], [-.66, 1.17]]) { const b = mesh(new THREE.SphereGeometry(.03, 6, 4), '#d9534f'); b.position.set(bx, by, D / 2 + .16); g.add(b); } }
  const pane = new THREE.MeshStandardMaterial({ color: '#4a4a5c', emissive: '#ffbf6e', emissiveIntensity: 0, roughness: .6 });
  { const wx = .8, wy = 1.15; const p = new THREE.Mesh(new THREE.BoxGeometry(.9, .7, .05), pane); p.position.set(wx, wy, D / 2 + .01); g.add(p);
    box(.98, .07, .07, '#fcf8f1', wx, wy + .36, D / 2 + .05); box(.98, .07, .07, '#fcf8f1', wx, wy - .36, D / 2 + .05); box(.07, .76, .07, '#fcf8f1', wx - .46, wy, D / 2 + .05); box(.07, .76, .07, '#fcf8f1', wx + .46, wy, D / 2 + .05); box(.06, .7, .06, '#fcf8f1', wx, wy, D / 2 + .05); box(.9, .06, .06, '#fcf8f1', wx, wy, D / 2 + .05);
    box(1.06, .1, .2, SNOW, wx, wy - .42, D / 2 + .1); }
  // the chimney, and smoke puffing from it
  box(.46, 1.1, .46, '#b65e4f', 1.05, H + .9, -.45); box(.56, .14, .56, SNOW, 1.05, H + 1.5, -.45);
  const smoke = [0, 1, 2, 3].map(i => { const m = new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 6), paper('#efeae4')); m.castShadow = false; m.userData.live = true; g.add(m); return { m, t: i * .9 }; });
  S.wall(x, z, W / 2 + .1, D / 2 + .1);
  const light = S.lamp(1, '#ffc98a', 7, 1.5); light.position.set(x + .8, y + 1.2, z + D / 2 + .6);
  return { door: [x - .75, z + D / 2 + .5], step({ dt, eve }) {
    pane.emissiveIntensity = .15 + eve * 1.6; light.intensity = eve * 2.2;
    for (const p of smoke) { p.t += dt; if (p.t > 3.6) p.t -= 3.6; const k = p.t / 3.6; p.m.position.set(1.05 + Math.sin(p.t * 1.3) * .15 + k * .5, H + 1.65 + k * 1.6, -.45); p.m.scale.setScalar(.5 + k * 1.3); p.m.visible = k < .95; }
  } };
}

/* ---------------- ice lanterns: a block of ice with a candle in it, lit in the evening ---------------- */
const lanternGlow = new THREE.MeshStandardMaterial({ color: '#e4f0f6', emissive: '#ffc77a', emissiveIntensity: 0, roughness: .5 });
export function iceLantern(S, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(.3, .34, .3), lanternGlow); m.position.set(x, y + .17, z); m.rotation.y = .5; m.castShadow = m.receiveShadow = true; S.root.add(m);
  const cap = mesh(new THREE.SphereGeometry(.17, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), SNOW); cap.scale.y = .5; cap.position.set(x, y + .34, z); S.root.add(cap);
  S.solid({ x, z, r: .2 });
}
export const lanternsLit = (eve, dt) => { lanternGlow.emissiveIntensity += ((eve > .3 ? 1.4 : .22) - lanternGlow.emissiveIntensity) * Math.min(1, dt * 3); };

/* ---------------- the big Christmas tree ---------------- */
export function christmasTree(S, x, y, z) {
  const { sfx } = S, [wx, wz] = S.at([x, z]), g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g);
  const TIERS = 5, yb = i => .5 + i * .72, CH = 1.35, Rr = i => 1.6 - i * .29;
  { const t = mesh(new THREE.CylinderGeometry(.14, .18, .7, 8), '#7a5a3e'); t.position.y = .35; g.add(t); }
  for (let i = 0; i < TIERS; i++) { const c = mesh(new THREE.ConeGeometry(Rr(i), CH, 14), i % 2 ? '#3f7f5a' : '#468a63'); c.position.y = yb(i) + CH / 2; c.rotation.y = i; g.add(c); }
  // the garland: a gold strip winding up round it
  { const pts = []; for (let k = 0; k <= 160; k++) { const t = k / 160, yy = .9 + t * 3.5, a = t * Math.PI * 2 * 3.3, r = Math.max(.12, 1.5 * (1 - (yy - .6) / 4.2)) + .05; pts.push(new THREE.Vector3(Math.cos(a) * r, yy, Math.sin(a) * r)); }
    g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, .03, 5), '#f2c65c')); }
  // on a tier, a fraction u up it, at angle a: a point just outside its cone
  const onTier = (i, u, a, out = .04) => { const r = Rr(i) * (1 - u) + out; return [Math.cos(a) * r, yb(i) + u * CH, Math.sin(a) * r]; };
  const R = rng(941), BAUBLES = ['#e0605a', '#f2c65c', '#f4a6c4', '#8fc3e0', '#fcf8f1'];
  for (let i = 0; i < TIERS; i++) for (let k = 0; k < 7 - i; k++) { const [bx, by, bz] = onTier(i, .2 + R() * .12, k / (7 - i) * 6.283 + i * .7, .06); const b = mesh(new THREE.SphereGeometry(.12 - i * .012, 12, 8), BAUBLES[(k + i) % BAUBLES.length]); b.position.set(bx, by, bz); g.add(b); }
  // the lights: three kinds that take turns; glowing paper beads
  const LIGHTS = ['#ffd37a', '#ff9b8a', '#a8e0ff'].map(c => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0, roughness: .6 }));
  let n = 0; for (let i = 0; i < TIERS; i++) for (let k = 0; k < 10 - i; k++) { const [lx, ly, lz] = onTier(i, .45 + (k % 2) * .18, k / (10 - i) * 6.283 + i * 1.3 + .3, .03); const l = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), LIGHTS[n++ % 3]); l.position.set(lx, ly, lz); g.add(l); }
  // presents under it
  for (const [px, pz, w, h, c, rb, a] of [[-.9, 1.1, .5, .38, '#e98f8f', '#f2c65c', .3], [.2, 1.45, .42, .3, '#9ed9cf', '#f4a6c4', -.2], [.95, .9, .56, .44, '#bba6ea', '#fcf8f1', .5], [-.35, 1.6, .3, .26, '#f2c65c', '#e0605a', .1]]) {
    const b = new THREE.Group(); b.position.set(px, 0, pz); b.rotation.y = a; g.add(b); const bx = mesh(new THREE.BoxGeometry(w, h, w * .9), c); bx.position.y = h / 2; b.add(bx);
    for (const r of [0, Math.PI / 2]) { const st = mesh(new THREE.BoxGeometry(w + .02, h + .02, .08), rb); st.position.y = h / 2; st.rotation.y = r; b.add(st); }
    const bow = mesh(new THREE.TorusGeometry(.07, .025, 6, 10), rb); bow.position.y = h + .05; b.add(bow); }
  // the star: a live piece of its own, turning slowly when it shines
  const starMat = new THREE.MeshStandardMaterial({ color: '#f2c65c', emissive: '#ffd36b', emissiveIntensity: 0, roughness: .7 });
  const STAR = []; for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .14 : .34; STAR.push([Math.cos(a) * r, Math.sin(a) * r]); }
  const star = new THREE.Group(); star.userData.live = true; star.position.set(0, yb(TIERS - 1) + CH + .22, 0); g.add(star);
  { const sm = card(STAR, .07, starMat, paper('#cf9c35')); star.add(sm); }
  S.solid({ x, z, r: 1.55 });
  const light = S.lamp(0, '#ffd9a0', 8, 1.4); light.position.set(x, y + 2.4, z + 1.8);
  let lit = 0, song = null, t = 0, songs = 0, plays = 0, night = false;
  const ORDER = ['jingle', 'wish', 'tannenbaum'];
  const play = () => {
    if (song && t < song.dur) return; plays++;
    song = bells(S, ORDER[songs++ % ORDER.length]); t = 0; lit = 1;
    S.confetti(wx, y + 5, wz, ['#f2c65c', '#fcf8f1', '#ffd37a'], 16, S.starGeo, 2.2); S.coins.reward('kerstboom', wx, y + 5.2, wz);
  };
  // a snowball against it: the lights flicker, a bauble rings
  let flick = 0; tapOr(S, g, play, 'kerstboom', { at: () => [wx, y + 2.0, wz + .4], r: 1.3, hit: () => { flick = .6; sfx.note(1568); setTimeout(() => sfx.note(2093), 120); S.confetti(wx, y + 2.4, wz + .9, PUFF, 10, undefined, 1.6); } });
  return { state: () => ({ lit: lit > 0, playing: !!song && t < song.dur, plays }), step({ dt, eve, time }) {
    t += dt; if (eve > .5 && !night) { night = true; lit = 1; } else if (eve < .5 && night) { night = false; }
    const singing = song && t < song.dur;
    if (!singing && !night && lit > 0 && t > (song ? song.dur : 0) + 25) lit = 0;   // by day the lights go out again a while after the tune
    let beat = 0; if (singing) { for (const b of song.beats) if (b <= t) beat++; }
    flick = Math.max(0, flick - dt);
    LIGHTS.forEach((m, i) => { const want = flick > 0 ? (Math.floor(flick * 20 + i) % 2 ? 2.4 : 0) : !lit ? 0 : singing ? ((beat + i) % 3 === 0 ? 3.2 : 1.0) : 1.4 + .8 * Math.sin(time * 1.7 + i * 2.1); m.emissiveIntensity += (want - m.emissiveIntensity) * Math.min(1, dt * 10); });
    starMat.emissiveIntensity += ((lit ? (singing ? 1.6 + Math.sin(time * 8) * .4 : 1.2) : .05) - starMat.emissiveIntensity) * Math.min(1, dt * 6);
    star.rotation.y += dt * (singing ? 2.4 : lit ? .5 : 0);
    light.intensity = lit ? (1.0 + eve * 1.6) : 0;
  } };
}

/* ---------------- the snowman she builds ---------------- */
// a small ball lies there to begin with. Every tap: the next piece. The finished one's hat flies off when a snowball hits it
export function snowman(S, x, y, z) {
  const { girl, sfx } = S, [wx, wz] = S.at([x, z]), g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g);
  const part = build => { const p = new THREE.Group(); p.userData.live = true; p.visible = false; build(p); g.add(p); S.glue(p); return p; };
  const ball = (p, r, py) => { const m = mesh(new THREE.SphereGeometry(r, 18, 12), SNOW); m.scale.y = .92; m.position.y = py; p.add(m); };
  const seed = part(p => ball(p, .17, .15));
  const parts = [
    part(p => ball(p, .5, .44)),
    part(p => ball(p, .36, 1.1)),
    part(p => ball(p, .27, 1.6)),
    part(p => { for (const ex of [-.1, .1]) { const e = mesh(new THREE.SphereGeometry(.037, 8, 6), '#3b3238'); e.position.set(ex, 1.66, .235); p.add(e); }
      const nose = mesh(new THREE.ConeGeometry(.05, .3, 8), '#e2803e'); nose.rotation.x = Math.PI / 2; nose.position.set(0, 1.58, .38); p.add(nose);
      for (let i = 0; i < 5; i++) { const m = mesh(new THREE.SphereGeometry(.022, 6, 4), '#3b3238'); const a = Math.PI * (.2 + i * .15); m.position.set(Math.cos(a) * .17, 1.52 - Math.sin(a) * .06 - .02, .23); p.add(m); }
      for (const by of [1.0, 1.18]) { const m = mesh(new THREE.SphereGeometry(.035, 8, 6), '#3b3238'); m.position.set(0, by, .345); p.add(m); } }),
    part(p => { for (const sx of [-1, 1]) { const st = mesh(new THREE.CylinderGeometry(.022, .03, .7, 5), '#7a5a3e'); st.position.set(sx * .58, 1.25, 0); st.rotation.z = sx * -1.0; p.add(st); const tw = mesh(new THREE.CylinderGeometry(.015, .02, .18, 4), '#7a5a3e'); tw.position.set(sx * .78, 1.47, 0); tw.rotation.z = sx * -.3; p.add(tw); }
      const sc = mesh(new THREE.TorusGeometry(.24, .07, 8, 18), '#e0605a'); sc.rotation.x = Math.PI / 2; sc.position.y = 1.37; p.add(sc); const tail = mesh(new THREE.BoxGeometry(.13, .36, .05), '#e0605a'); tail.position.set(.16, 1.2, .22); tail.rotation.z = .25; p.add(tail);
      for (const yy of [1.1, 1.2]) { const st = mesh(new THREE.BoxGeometry(.135, .04, .055), '#f2c65c'); st.position.set(.16 + (yy - 1.1) * .25, yy, .23); st.rotation.z = .25; p.add(st); } }),
  ];
  // the hat: its own piece, so it can fly off
  const hat = new THREE.Group(); hat.userData.live = true; hat.visible = false; g.add(hat);
  { const brim = mesh(new THREE.CylinderGeometry(.27, .27, .035, 18), '#4b3d3d'); hat.add(brim); const crown = mesh(new THREE.CylinderGeometry(.17, .18, .3, 16), '#4b3d3d'); crown.position.y = .16; hat.add(crown); const band = mesh(new THREE.CylinderGeometry(.185, .185, .06, 16), '#e0605a'); band.position.y = .05; hat.add(band); S.glue(hat); }
  const HAT0 = [0, 1.83, 0], STAGES = parts.length + 1;
  hat.position.set(...HAT0); hat.rotation.z = -.12;
  S.solid({ x, z, r: .55 });
  let stage = 0, built = 0, t = -1, job = null, wig = 0, grow = null, fly = null, off = 0, knocks = 0, back = -1, home = -1, from = null;
  const show = () => { seed.visible = stage === 0; parts.forEach((p, i) => { p.visible = i < stage; }); hat.visible = stage >= STAGES; };
  show();
  const puff = (py, n = 10) => S.confetti(wx, y + py, wz + .2, PUFF, n, undefined, 1.8);
  const tapped = () => {
    if (S.playing() || t >= 0) return;
    S.walkThen(wx + 1.05, wz + .55, () => { if (t >= 0) return; girl.view = 'side'; girl.face = -1; job = stage < STAGES ? 'build' : 'hug'; t = 0; girl.hopV = job === 'build' ? 1.4 : 2.6; sfx.hop(); }, 1.3);
  };
  tapOr(S, g, tapped, 'sneeuwpop', { at: () => [wx, y + (stage >= 3 ? 1.6 : stage ? .5 : .2), wz], r: .3, hit: yy => me.hit(yy) });
  const me = {
    state: () => ({ stage, done: stage >= STAGES, built, knocks, hat: fly ? 'flying' : off || home >= 0 ? 'off' : stage >= STAGES ? 'on' : 'none' }),
    /** where a snowball can hit it (the world's measure): its balls as spheres */
    spheres: () => [[.5, .44], [.36, 1.1], [.27, 1.6], [.24, 1.86]].slice(0, Math.min(stage, 3) + (stage >= STAGES && !fly && !off && home < 0 ? 1 : 0)).map(([r, py]) => [wx, y + py, wz, r]),
    hit(py) {
      wig = 1; puff(Math.max(.3, py - y), 12);
      if (stage >= STAGES && !fly && !off && home < 0) { knocks++; fly = { x: 0, y: HAT0[1], z: 0, vx: (Math.random() < .5 ? -1 : 1) * (.9 + Math.random() * .6), vy: 4.2, vz: .6, spin: (Math.random() - .5) * 14 }; sfx.boing(); }
      else sfx.thud();
    },
    step({ dt }) {
      if (t >= 0) { t += dt;
        if (job === 'build' && t > .35) { t = -1; stage++; built++; show(); const p = stage < STAGES ? parts[stage - 1] : hat; grow = { p, k: 0 }; puff(stage < 3 ? .3 : 1.2, 9);
          if (stage === STAGES) { sfx.chime(); jingle(S, 8); S.confetti(wx, y + 2.2, wz, ['#e0605a', '#f2c65c', '#9ed9cf', '#fcf8f1'], 18, S.starGeo, 2.4); S.coins.reward('sneeuwpop', wx, y + 2.4, wz); } else sfx.thud(); }
        else if (job === 'hug' && t > .3) { t = -1; wig = 1; sfx.boing(); jingle(S, 4); if (!fly && !off && home < 0) back = 0; } }
      if (grow) { grow.k = Math.min(1, grow.k + dt / .32); const k = grow.k, s = k < 1 ? .4 + .75 * k - .15 * Math.sin(k * Math.PI) : 1; grow.p.scale.setScalar(s); if (k >= 1) { grow.p.scale.setScalar(1); grow = null; } }
      if (wig > 0) { wig = Math.max(0, wig - dt * 1.4); g.rotation.z = Math.sin(wig * 22) * .07 * wig; }
      if (back >= 0 && !fly && !off && home < 0) { back += dt; hat.position.y = HAT0[1] + Math.sin(Math.min(1, back / .45) * Math.PI) * .35; if (back > .45) { back = -1; hat.position.y = HAT0[1]; } }
      if (fly) { const f = fly; f.vy -= G * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.z += f.vz * dt; hat.rotation.z += f.spin * dt;
        if (f.y <= .02 && f.vy < 0) { if (f.vy < -3) { f.vy *= -.35; f.vx *= .5; f.vz *= .5; f.spin *= .4; sfx.thud(); } else { f.y = .02; fly = null; off = 2.0; hat.rotation.z = 0; } }
        hat.position.set(f.x, f.y, f.z); return; }
      // lying in the snow a moment; then, in a hop, back onto its head
      if (off > 0) { off -= dt; if (off <= 0) { off = 0; home = 0; from = hat.position.clone(); } }
      if (home >= 0) { home += dt; const k = Math.min(1, home / .55); hat.position.set(from.x + (HAT0[0] - from.x) * k, from.y + (HAT0[1] - from.y) * k + Math.sin(k * Math.PI) * .9, from.z + (HAT0[2] - from.z) * k); hat.rotation.z = -.12 * k + (1 - k) * 6.283 * k;
        if (k >= 1) { home = -1; hat.rotation.z = -.12; sfx.boing(); wig = .6; } }
    },
  };
  return me;
}

/* ---------------- snowballs ---------------- */
// `targets()`: what a snowball can hit, each { at(): [x, y, z] in the world, r, hit(y), duck?(ball) }
export function snowballs(S, x, y, z, targets, extent) {
  const { girl, sfx } = S, [wx, wz] = S.at([x, z]), me = {};
  // the heap: a pile of snow with a few balls ready on top
  const heap = new THREE.Group(); heap.position.set(x, y, z); S.root.add(heap);
  for (const [hx, hz, r, s] of [[0, 0, .62, .55], [-.45, .2, .42, .5], [.42, .12, .38, .55], [.05, -.32, .4, .6]]) { const m = mesh(new THREE.SphereGeometry(r, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), SNOW); m.scale.y = s; m.position.set(hx, 0, hz); heap.add(m); }
  for (const [bx, by, bz] of [[.05, .38, .12], [-.22, .3, .3], [.3, .28, .3], [.5, .12, .55], [-.55, .1, .5]]) { const b = mesh(new THREE.SphereGeometry(.1, 10, 8), '#eef3f8'); b.position.set(bx, by, bz); heap.add(b); }
  S.solid({ x, z, r: .7 });
  // two snowballs: one in her hands while the other flies
  const balls = [0, 1].map(i => { const f = S.figure('sneeuwbal' + (i || ''), CARDS5.sneeuwbal); f.g.visible = false; const b = { f, fly: null }; f.onTap = () => { if (held === b) throwAt(girl.x + girl.face * 4, .1, girl.z + .3); }; return b; });
  let held = null, made = 0, thrown = 0, hits = 0, scoop = -1, again = -1, aimed = null;
  // the finger's place on the snow while she holds one: a sheet nobody sees, over the whole island, there only then (a
  // second little sheet far above keeps its middle out of the way of the controller's nearest-thing and the near-miss finder)
  const field = new THREE.Group(); field.userData.live = true; field.visible = false; S.root.add(field);
  { const inv = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }), [x0, z0, x1, z1] = extent;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), inv); p.rotation.x = -Math.PI / 2; p.position.set((x0 + x1) / 2, y + .06, (z0 + z1) / 2); p.castShadow = p.receiveShadow = false; field.add(p);
    const q = new THREE.Mesh(new THREE.PlaneGeometry(.1, .1), inv); q.rotation.x = -Math.PI / 2; q.position.set((x0 + x1) / 2, 400, (z0 + z1) / 2); field.add(q); }
  const drop = () => { if (!held) return; const b = held; held = null; S.hands.free(me); field.visible = false; girl.poseName = null; b.f.g.visible = false; S.confetti(girl.x + girl.face * .3, girl.y + .3, girl.z + .1, PUFF, 7, undefined, 1.2); sfx.rustle(); };
  const take = () => { const b = balls.find(q => !q.fly && q !== held); if (!b) return; S.hands.take(me, drop); held = b; made++; b.f.g.visible = true; field.visible = true; sfx.hop(); };
  const make = () => { if (held || scoop >= 0 || S.playing()) return; S.walkThen(wx + .95, wz + .7, () => { if (held || S.playing()) return; scoop = 0; girl.face = -1; girl.view = 'side'; S.confetti(wx + .5, y + .2, wz + .5, PUFF, 6, undefined, 1.2); sfx.rustle(); }, 1.2); };
  /** throw what she holds at a spot in the world (as high as `ty`); `who`: a target that was aimed at */
  const throwAt = (tx, ty, tz, who = null) => {
    if (!held || S.playing()) return false;
    const b = held; held = null; S.hands.free(me); field.visible = false; thrown++;
    const h = S.hand(), sx = h.x, sy = h.y + .15, sz = h.z; let dx = tx - sx, dz = tz - sz, d = Math.hypot(dx, dz);
    if (d > 9) { tx = sx + dx / d * 9; tz = sz + dz / d * 9; dx = tx - sx; dz = tz - sz; d = 9; ty = (S.heightAt(tx, tz) ?? 0) + .1; }
    const T = .42 + d * .055; b.fly = { x: sx, y: sy, z: sz, vx: dx / T, vz: dz / T, vy: (ty - sy + .5 * G * T * T) / T, t: 0, T, who, ducked: new Set() };
    if (Math.abs(dx) > .1) girl.face = Math.sign(dx); girl.view = 'side'; girl.poseName = 'up'; again = 0; aimed = who; sfx.swish(3);
    return true;
  };
  me.throwAt = throwAt; thrower = { holding: () => !!held, throwAt };
  S.tap(heap, () => { if (held) throwAt(wx, y + .5, wz); else make(); }, 'sneeuwhoop');
  S.tap(field, hit => { if (!held) return; if (hit && hit.point) throwAt(hit.point.x, (S.heightAt(hit.point.x, hit.point.z) ?? 0) + .12, hit.point.z); else throwAt(girl.x + girl.face * 4, .1, girl.z); });
  // a tap on anybody while she holds one: thrown at them
  S.offer(to => { if (!held) return null; const tg = targets().find(q => q.f === to); throwAt(to.x, (to.y || 0) + to.H * .55, to.z, tg || null); return 'sneeuwbal'; });
  const splats = [];
  const splat = (px, py, pz) => { S.confetti(px, py + .1, pz, PUFF, 12, undefined, 2.2); sfx.rustle();
    const h = S.heightAt(px, pz); if (h === null || Math.abs(h - py) > .3) return;
    const m = new THREE.Mesh(new THREE.CircleGeometry(.22, 10), paper('#ffffff')); m.rotation.x = -Math.PI / 2; m.position.set(px - S.at([0, 0])[0], h + .02, pz - S.at([0, 0])[1]); m.receiveShadow = true; m.userData.live = true; S.root.add(m); splats.push({ m, t: 0 }); if (splats.length > 8) { const o = splats.shift(); S.root.remove(o.m); o.m.geometry.dispose(); } };
  return { throwAt, holding: () => !!held, state: () => ({ held: !!held, made, thrown, hits, flying: balls.filter(b => b.fly).length, field: field.visible, ball: held ? [held.f.x, held.f.y + held.f.H / 2, held.f.z] : null }), step({ dt }) {
    if (scoop >= 0) { scoop += dt; girl.poseName = 'sit'; if (scoop > .45) { scoop = -1; girl.poseName = null; take(); } }
    if (held && S.where() !== 'sneeuw' && !S.playing()) drop();   // (carried off the island, by the sleigh: it melts away)
    if (held) { if (!S.playing()) { if (again < 0 || again > .25) girl.poseName = 'hold'; const h = S.hand(); held.f.x = h.x + girl.face * .06; held.f.z = h.z + .16; held.f.floatY = held.f.y = h.y - held.f.H * .5; held.f.face = 1; held.f.g.visible = true; } else held.f.g.visible = false; }
    if (again >= 0) { again += dt; if (again > .28 && girl.poseName === 'up') girl.poseName = null;
      // still by the heap: she makes the next one by herself
      if (again > .55) { again = -1; if (!held && !S.playing() && Math.hypot(girl.x - wx, girl.z - wz) < 1.9) { scoop = 0; sfx.rustle(); } } }
    for (const b of balls) { const q = b.fly; if (!q) continue; q.t += dt;
      q.vy -= G * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
      b.f.x = q.x; b.f.z = q.z; b.f.floatY = b.f.y = q.y - b.f.H * .5; b.f.g.visible = true; b.f.tilt = (b.f.tilt || 0) + dt * 9;
      let hit = null;
      for (const tg of q.who && q.who.at && !q.who.f ? [...targets(), q.who] : targets()) { const [tx, ty, tz] = tg.at(), dd = Math.hypot(q.x - tx, q.y - ty, q.z - tz);
        if (tg.duck && !q.ducked.has(tg.f) && Math.hypot(q.x - tx, q.z - tz) < 2.2 && q.vy < 3) { q.ducked.add(tg.f); if (tg.duck()) continue; }
        if (dd < tg.r) { hit = tg; break; } }
      const ground = S.heightAt(q.x, q.z);
      if (hit) { b.fly = null; b.f.g.visible = false; hits++; hit.hit(q.y); S.confetti(q.x, q.y, q.z, PUFF, 14, undefined, 2.4); sfx.rustle(); continue; }
      if ((ground !== null && q.y <= ground + .08) || q.y < -1.2 || q.t > 4) { b.fly = null; b.f.g.visible = false; if (ground === null) { sfx.splash(); S.confetti(q.x, -.5, q.z, ['#cfeaf0', '#f6efe2'], 8, undefined, 1.6); } else splat(q.x, ground, q.z); } }
  } };
}

/* ---------------- Santa, and the present he gives ---------------- */
export function santa(S, x, z) {
  const { girl, uni, sfx } = S, f = S.figure('kerstman', CARDS5.kerstman), [wx, wz] = S.at([x, z]); f.x = wx; f.z = wz; f.face = 1; S.solid({ x, z, r: .5 });
  const box = S.figure('cadeau', CARDS5.cadeau), toy = S.figure('verrassing', CARDS5.verrassing); box.g.visible = toy.g.visible = false;
  const me = {}; let mode = null, t = 0, held = false, given = 0, opened = 0, laughs = 0, open = null, away = false;
  const paper0 = () => (given - 1) % 3;
  /** open the present where it is: the lid flies, sparkles, and what is inside pops up */
  const unwrap = (px, pz, py) => { held = false; girl.poseName = null; opened++; box.x = px; box.z = pz; box.floatY = box.y = py; box.face = 1; box.setFrame(paper0() * 2 + 1); box.g.visible = true;
    toy.setFrame((opened - 1) % 3); toy.x = px; toy.z = pz + .03; toy.floatY = toy.y = py + .1; toy.face = 1; toy.g.visible = true; toy.hopV = 4.2;
    open = { t: 0 }; sfx.boing(); setTimeout(() => sfx.chime(), 200); S.confetti(px, py + .5, pz, ['#f2c65c', '#f4a6c4', '#9ed9cf', '#fcf8f1'], 18, S.starGeo, 2.6); S.coins.reward('kerstcadeau', px, py + 1.2, pz); };
  const openHere = () => unwrap(girl.x + girl.face * .55, girl.z + .12, girl.y);
  box.onTap = () => { if (held && !S.playing()) { S.hands.free(me); openHere(); } };   // (a finger on the box in her hands opens it too)
  S.offer(to => { if (!held || to !== uni) return null; S.hands.free(me); uni.hopV = 3; sfx.neigh(); unwrap(uni.x + uni.face * .7, uni.z + .15, uni.y || 0); return 'cadeau'; });
  f.onTap = () => { if (S.playing() || mode || away) return; if (held) { mode = 'laugh'; t = 0; laughs++; hoho(S); return; }
    S.walkThen(wx + 1.35, wz + .55, () => { if (mode) return; girl.face = -1; girl.view = 'side'; mode = 'laugh'; t = 0; laughs++; hoho(S); jingle(S, 5); }, 1.0); };
  f.act = () => f.setFrame(mode === 'laugh' ? 1 : mode === 'give' ? 2 : mode === 'wave' ? 3 : 0);
  return { f, state: () => ({ mode, held, given, opened, laughs, frame: f.frame, away }), holding: () => held,
    /** a snowball hit him: he laughs */
    hit() { if (away) return; mode = 'laugh'; t = .2; laughs++; f.hopV = 2; hoho(S); },
    away(on) { away = on; f.g.visible = !on; },
    step({ dt }) {
      if (mode) { t += dt;
        if (mode === 'laugh' && t > 1.3) { if (!held && Math.hypot(girl.x - wx, girl.z - wz) < 2.2 && !open) { mode = 'give'; t = 0; sfx.peep(); given++; box.setFrame(paper0() * 2); box.g.visible = true; } else mode = null; }
        else if (mode === 'give' && t > .7) { mode = 'wave'; t = 0; held = true; S.hands.take(me, openHere); sfx.hop(); }
        else if (mode === 'wave' && t > 1.4) mode = null; }
      if (mode === 'give') { box.x = f.x + f.W * .42; box.z = f.z + .05; box.floatY = box.y = (f.y || 0) + f.H * .38; box.face = 1; box.g.visible = true; }
      else if (held) { if (!S.playing()) { girl.poseName = 'hold'; const h = S.hand(); box.x = h.x + girl.face * .04; box.z = h.z + .05; box.floatY = box.y = h.y - box.H * .55; box.face = 1; box.g.visible = true; } else box.g.visible = false; }
      else if (open) { open.t += dt; if (open.t > 3.2) { open = null; box.g.visible = toy.g.visible = false; S.confetti(box.x, box.y + .3, box.z, PUFF, 10, undefined, 1.4); } }
      else if (mode !== 'give') box.g.visible = false;
    } };
}

/* ---------------- penguins ---------------- */
// `area`: where they wander (the set's measure, [x0, z0, x1, z1]); `pond`: the ice (the world's measure); `door`: the big
// igloo's doorway (the set's measure), where the mother and her chick go in and out
export function penguins(S, area, pond, door, slideFrom) {
  const { sfx } = S, at = p => S.at(p), R = rng(951);
  const inArea = () => at([area[0] + R() * (area[2] - area[0]), area[1] + R() * (area[3] - area[1])]);
  const make = (name, spec, kind) => { const f = S.figure(name, spec), [x, z] = inArea(); f.x = x; f.z = z; f.face = R() < .5 ? 1 : -1; const p = { f, kind, mode: 'wait', t: R() * 2, goal: null, vx: 0, vz: 0, step: 0, flaps: 0, slides: 0, ducks: 0, inside: false, wait: 1 + R() * 3, next: 6 + R() * 10 };
    f.act = tick => f.setFrame(p.mode === 'flap' ? 3 : p.mode === 'slide' ? 4 : p.mode === 'duck' ? 5 : f.walking ? 1 + (Math.floor(tick / 2) % 2) : 0);
    f.onTap = () => { if (p.inside || p.mode === 'flap') return; p.mode = 'flap'; p.t = 0; p.flaps++; f.hopV = 2.4; sfx.peep(); setTimeout(() => sfx.peep(), 140); S.confetti(f.x, (f.y || 0) + .5, f.z, PUFF, 6, undefined, 1.4); };
    return p; };
  const flock = [make('pinguin', CARDS5.pinguin, 'slider'), make('pinguin2', CARDS5.pinguin, 'slider'), make('pinguin3', CARDS5.pinguin, 'slider'), make('pinguin4', CARDS5.pinguin, 'mother'), make('pinguinkuiken', CARDS5.pinguinkuiken, 'chick')];
  const mother = flock[3], chick = flock[4], [dx0, dz0] = at(door);
  flock[1].next = 2.5;   // (one of them goes for a slide soon after she comes)
  const onIce = (x, z) => inPoly(pond, x, z);
  const walkTo = (p, tx, tz, dt, v = .65) => { const f = p.f, dx = tx - f.x, dz = tz - f.z, d = Math.hypot(dx, dz); if (d < .12) { f.walking = false; return true; } const s = Math.min(d, v * dt); f.walking = S.move(f, dx / d * s, dz / d * s); if (Math.abs(dx) > .04) f.face = Math.sign(dx); if (!f.walking) { p.stuck = (p.stuck || 0) + dt; if (p.stuck > 1.5) { p.stuck = 0; return true; } } else p.stuck = 0; return false; };
  const slide = (p, vx, vz) => { p.mode = 'slide'; p.t = 0; p.vx = vx; p.vz = vz; p.slides++; p.f.walking = false; p.f.face = vx >= 0 ? 1 : -1; S.sfx.swish(2); };
  const stepOne = (p, dt) => {
    const f = p.f; p.t += dt;
    if (p.inside) { f.g.visible = false; return; }
    if (p.mode === 'flap') { f.walking = false; if (p.t > .9) slide(p, f.face * 2.2, .4); return; }
    if (p.mode === 'duck') { f.walking = false; if (p.t > 1.0) { p.mode = 'wait'; p.t = 0; p.wait = .6; f.hopV = 1.4; } return; }
    if (p.mode === 'slide') {
      const ice = onIce(f.x, f.z), k = ice ? .32 : 2.6; p.vx *= Math.exp(-k * dt); p.vz *= Math.exp(-k * dt);
      const ok = S.move(f, p.vx * dt, p.vz * dt); f.walking = false;
      if (ice && Math.random() < dt * 6) S.confetti(f.x - f.face * .3, (f.y || 0) + .05, f.z, ['#ffffff', '#dceaf2'], 1, undefined, .6);
      if (!ok || Math.hypot(p.vx, p.vz) < .18) { p.mode = 'wait'; p.t = 0; p.wait = 1 + Math.random() * 1.5; f.hopV = 1.6; }
      return; }
    if (p.mode === 'toice') { if (walkTo(p, p.goal[0], p.goal[1], dt, .9)) { slide(p, (Math.random() - .5) * .8, 2.6 + Math.random() * .5); } return; }
    if (p.mode === 'walk') { if (walkTo(p, p.goal[0], p.goal[1], dt)) { p.mode = 'wait'; p.t = 0; p.wait = 1.2 + Math.random() * 3; } return; }
    // waiting: then off somewhere. A slider now and then goes for a slide on the ice
    f.walking = false; if (p.t < p.wait) return;
    p.next -= p.t; p.t = 0;
    if (p.kind === 'slider' && p.next <= 0) { p.next = 12 + Math.random() * 14; const s = slideFrom[Math.floor(Math.random() * slideFrom.length)]; p.goal = at(s); p.mode = 'toice'; return; }
    // after a slide, back up to the igloos
    p.goal = inArea(); p.mode = 'walk';
  };
  // the mother and her chick: out for a while, then in through the doorway, inside a while, out again
  let fam = { phase: 'out', t: 0, ins: 0 };
  const stepFamily = dt => {
    fam.t += dt;
    if (fam.phase === 'out') { stepOne(mother, dt); if (fam.t > 14 && mother.mode === 'wait') { fam.phase = 'going'; fam.t = 0; } }
    else if (fam.phase === 'going') { mother.mode = 'walk'; if (walkTo(mother, dx0, dz0, dt) || fam.t > 12) { fam.phase = 'in'; fam.t = 0; fam.ins++; mother.inside = chick.inside = true; mother.f.g.visible = chick.f.g.visible = false; } }
    else if (fam.phase === 'in') { if (fam.t > 7) { fam.phase = 'out'; fam.t = 0; mother.inside = chick.inside = false; mother.f.g.visible = chick.f.g.visible = true; mother.f.x = dx0; mother.f.z = dz0; chick.f.x = dx0 - .3; chick.f.z = dz0 + .05; mother.mode = 'walk'; mother.goal = [dx0 + (Math.random() - .5) * 3, dz0 + 1.2 + Math.random()]; mother.f.hopV = 1.6; sfx.peep(); } }
    // the chick keeps close behind its mother (unless it is busy with its own flap or slide)
    if (!chick.inside) { if (chick.mode === 'flap' || chick.mode === 'slide' || chick.mode === 'duck') stepOne(chick, dt);
      else { chick.mode = 'walk'; const tx = mother.f.x - mother.f.face * .55, tz = mother.f.z + .15; if (Math.hypot(tx - chick.f.x, tz - chick.f.z) > .25) walkTo(chick, tx, tz, dt, 1.0); else { chick.f.walking = false; chick.mode = 'wait'; } } }
  };
  return { flock, state: () => ({ slides: flock.reduce((n, p) => n + p.slides, 0), flaps: flock.reduce((n, p) => n + p.flaps, 0), ducks: flock.reduce((n, p) => n + p.ducks, 0), family: fam.phase, ins: fam.ins, modes: flock.map(p => p.mode) }),
    /** as targets for snowballs: they duck when one comes at them */
    targets: () => flock.filter(p => !p.inside).map(p => ({ f: p.f, at: () => [p.f.x, (p.f.y || 0) + p.f.H * (p.mode === 'duck' ? .3 : .55), p.f.z], r: p.mode === 'duck' ? .12 : .3,
      duck: () => { if (p.mode === 'slide') return false; p.mode = 'duck'; p.t = 0; p.ducks++; S.sfx.peep(); return true; }, hit: () => { p.f.onTap(); } })),
    step({ dt }) { for (const p of flock) if (p !== mother && p !== chick) stepOne(p, dt); stepFamily(dt); } };
}

/* ---------------- reindeer ---------------- */
export const reindeer = (S, spots, name) => { const r = wanderer(S, CARDS5.rendier, spots, name, () => jingle(S, 5)); r.home = spots; return r; };

/* ---------------- the sleigh, and the flight home ---------------- */
// `home()`: where in the village she gets out (the world's measure); `deer`: the reindeer (reindeer()); `santa`: santa()
export function sleigh(S, x, z, theSanta, deer, home) {
  const { girl, uni, sfx } = S, f = S.figure('slee', CARDS5.slee), [hx, hz] = S.at([x, z]); f.x = hx; f.z = hz; f.face = 1; f.thing = true;
  S.solid({ x, z, r: .55 }); S.solid({ x: x + .9, z, r: .45 }); S.solid({ x: x - .9, z, r: .45 });
  const reins = deer.map(() => { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: '#8d4a3e' })); l.frustumCulled = false; l.visible = false; S.world(l); return l; });
  let mode = null, t = 0, k = 0, path = null, flights = 0, land = null, alt = 0, sx = hx, sz = hz, last = 0, ay = 0;
  const acts = deer.map(d => d.f.act);
  const ALT = 5.6, DUR = 14;
  // the card's own left-right and away from the camera, in the world (every card turns to face the camera)
  const axes = () => { const ry = f.g.rotation.y; return { rx: Math.cos(ry), rz: -Math.sin(ry), bx: -Math.sin(ry), bz: -Math.cos(ry) }; };
  const bez = (p0, p1, p2, p3, u) => { const v = 1 - u; return v * v * v * p0 + 3 * v * v * u * p1 + 3 * v * u * u * p2 + u * u * u * p3; };
  const ease = u => u * u * (3 - 2 * u);
  /** where the sleigh is and how high, `u` along the way */
  const along = u => { const [x0, z0, x3, z3] = path; return [bez(x0, x0 + 5, x3 + 7, x3, u), bez(z0, z0 + 14, z3 - 22, z3, u)]; };
  /** place the sleigh, her, her unicorn and the reindeer for this moment */
  const seat = (px, pz, a, deerOn, t2, riders = true) => {
    sx = px; sz = pz; f.x = px; f.z = pz; f.floatY = f.y = a; f.face = 1; const A = axes();
    if (riders) {
    girl.x = px - A.rx * .3 + A.bx * .1; girl.z = pz - A.rz * .3 + A.bz * .1; girl.lift = a + .5 - girl.y; girl.poseName = 'sit'; girl.view = 'side'; girl.face = 1;
    uni.x = px - A.rx * 1.1 + A.bx * .22; uni.z = pz - A.rz * 1.1 + A.bz * .22; uni.lift = a + .36 - (uni.y || 0); uni.face = 1; uni.view = 'side'; uni.walking = false; }
    if (!deerOn) return;
    deer.forEach((d, i) => { const ahead = 2.1 + i * 1.35, side = i % 2 ? .3 : -.25, bob = Math.sin(t2 * 7 + i * 1.7) * .12; d.f.x = px + A.rx * ahead + A.bx * side; d.f.z = pz + A.rz * ahead + A.bz * side; d.f.floatY = d.f.y = a + .25 + bob; d.f.face = 1; d.f.walking = false;
      const p = reins[i].geometry.attributes.position, hy = a + .95, dy = d.f.y + .62; p.setXYZ(0, px + A.rx * .95, hy, pz + A.rz * .95); p.setXYZ(1, d.f.x - A.rx * .3, dy, d.f.z - A.rz * .3); p.needsUpdate = true; reins[i].visible = true; });
  };
  const toy = { look: [hx, hz], rate: .8, shot: { span: 12, tall: 8, rise: .3, riseTall: .42, dof: .8, range: 2, fx: 1, fz: 1, lag: 1, yaw: -.5 }, at: () => [sx, sz], step(dt, inp) {
    t += dt;
    if (mode === 'board') {   // she hops in, her unicorn behind her, Santa in front; the reindeer line up
      const q = Math.min(1, t / .9), A = axes();
      girl.view = 'side'; girl.face = 1;
      if (q < 1) { girl.lift = Math.sin(q * Math.PI) * .6 + q * .5; uni.lift = Math.sin(q * Math.PI) * .5 + q * .36; girl.poseName = q > .6 ? 'sit' : null; }
      girl.x += ((hx - A.rx * .3 + A.bx * .1) - girl.x) * Math.min(1, dt * 8); girl.z += ((hz - A.rz * .3 + A.bz * .1) - girl.z) * Math.min(1, dt * 8);
      uni.x += ((hx - A.rx * 1.1 + A.bx * .22) - uni.x) * Math.min(1, dt * 6); uni.z += ((hz - A.rz * 1.1 + A.bz * .22) - uni.z) * Math.min(1, dt * 6); uni.face = 1;
      deer.forEach((d, i) => { const tx = hx + A.rx * (2.1 + i * 1.35) + A.bx * (i % 2 ? .3 : -.25), tz = hz + A.rz * (2.1 + i * 1.35) + A.bz * (i % 2 ? .3 : -.25); d.f.x += (tx - d.f.x) * Math.min(1, dt * 3); d.f.z += (tz - d.f.z) * Math.min(1, dt * 3); d.f.face = 1; });
      if (t > 1.4) { mode = 'fly'; t = 0; k = 0; flights++; f.setFrame(1); jingle(S, 10); sfx.whoosh(); const [lx, lz] = home(); land = [lx, lz]; path = [hx, hz, lx - 1.2, lz - .1]; deer.forEach(d => { d.f.act = () => d.f.setFrame(4); }); toy.shot = { span: 19, tall: 12, rise: .3, riseTall: .38, dof: .25, range: 5, fx: 1, fz: 1, lag: 1, yaw: -1.15, ly: 0 }; toy.rate = 1.3; }
      return; }
    if (mode === 'fly') {
      k = Math.min(1, t / DUR); const u = ease(k), [px, pz] = along(u);
      alt = k < .22 ? ALT * ease(k / .22) : k > .8 ? ALT * (1 - ease((k - .8) / .2)) : ALT + Math.sin(t * 1.3) * .25;
      const gy = k > .95 ? (S.heightAt(px, pz) ?? 0) : 0; seat(px, pz, Math.max(gy, alt + gy * (alt < .3 ? 1 : 0)), true, t);
      toy.look = [px + 1.4 * axes().rx, pz + 1.4 * axes().rz]; toy.shot.ly = alt * .82;
      if (t - last > .18 && alt > .5) { last = t; S.confetti(px - axes().rx * 1.3, alt + .4, pz - axes().rz * 1.3, ['#f2c65c', '#fcf8f1', '#ffd37a'], 2, S.starGeo, .4, true); }
      if (Math.floor(t / 2.4) !== Math.floor((t - dt) / 2.4)) jingle(S, 4);
      if (k >= 1) { mode = 'out'; t = 0; f.setFrame(2); sfx.thud(); toy.rate = .8; toy.shot = { span: 12, tall: 8, rise: .3, riseTall: .42, dof: .8, range: 2, fx: 1, fz: 1, lag: 1, yaw: -.4 }; }
      return; }
    if (mode === 'out') {   // she hops out onto the village's ground, her unicorn beside her; Santa waves
      const q = Math.min(1, t / .6), [lx, lz] = land; seat(sx, sz, f.y, true, 0);
      girl.x = girl.x + (lx - girl.x) * q; girl.z = girl.z + (lz - girl.z) * q; girl.lift = (1 - q) * (girl.lift) + Math.sin(q * Math.PI) * .5; girl.poseName = q > .4 ? null : 'sit';
      if (q >= 1) { mode = 'away'; t = 0; ay = f.y; S.stopPlay(); girl.x = lx; girl.z = lz; girl.view = 'front';
        const spot = [[lx - .9, lz + .2], [lx + .9, lz + .2], [lx, lz + .8], [lx, lz - .8]].find(([ux, uz]) => S.heightAt(ux, uz) !== null && S.free(ux, uz, S.heightAt(ux, uz))) || [lx - .9, lz]; uni.x = spot[0]; uni.z = spot[1]; uni.lift = 0; uni.hopV = 2.4; girl.hopV = 2.6; sfx.neigh(); hoho(S);
        S.confetti(lx, (S.heightAt(lx, lz) ?? 0) + .8, lz, ['#e0605a', '#f2c65c', '#9ed9cf', '#fcf8f1'], 16, S.starGeo, 2.4); S.coins.reward('slee', lx, 2, lz); }
    }
  } };
  const go = () => { if (S.playing() || mode) return; S.walkThen(hx - .4, hz + .9, () => { if (S.playing() || mode) return; mode = 'board'; t = 0; toy.rate = .8; toy.shot = { span: 12, tall: 8, rise: .3, riseTall: .42, dof: .8, range: 2, fx: 1, fz: 1, lag: 1, yaw: -.5 }; S.play(toy); theSanta.away(true); f.setFrame(1); hoho(S); sfx.hop(); }, 1.4); };
  f.onTap = go;
  return { f, toy, state: () => ({ mode, flights, k: +k.toFixed(2), alt: +alt.toFixed(2), at: [sx, sz], land }), busy: () => !!mode, step({ dt }) {
    if (mode !== 'away') return; t += dt;
    // back home: Santa waves, then up and away north; far off, home again as if it never left
    if (t > 1.3) { f.setFrame(1); ay += dt * (1 + t * .5); sz -= dt * 8; }
    seat(sx, sz, ay, true, t, false);
    if (t > 9) { mode = null; f.setFrame(0); f.x = hx; f.z = hz; f.floatY = undefined; f.y = 0; sx = hx; sz = hz; reins.forEach(r => { r.visible = false; });
      deer.forEach((d, i) => { d.f.act = acts[i]; d.f.floatY = undefined; const [dx, dz] = S.at(d.home[i % d.home.length]); d.f.x = dx; d.f.z = dz; d.f.y = 0; }); theSanta.away(false); }
  } };
}

/* ---------------- falling snowflakes ---------------- */
export function flakes(S, n = 36) {
  const shape = new THREE.Shape(); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, r = i % 2 ? .028 : .075; (i ? shape.lineTo : shape.moveTo).call(shape, Math.cos(a) * r, Math.sin(a) * r); }
  const im = new THREE.InstancedMesh(new THREE.ShapeGeometry(shape), paper('#fbfdff', DS), n); im.userData.live = true; im.frustumCulled = false; im.castShadow = false; S.root.add(im);
  const R = rng(961), q = [...Array(n)].map(() => ({ x: (R() - .5) * 20, y: R() * 7, z: (R() - .5) * 13, v: .3 + R() * .35, ph: R() * 6, s: .7 + R() * .6, spin: R() * 3 })), o = new THREE.Object3D();
  return { step({ dt, time }) {
    const here = S.where() === 'sneeuw'; im.visible = here; if (!here) return;
    const [ox, oz] = S.at([0, 0]), cx = S.girl.x - ox, cz = S.girl.z - oz;
    q.forEach((p, i) => { p.y -= p.v * dt; if (p.y < 0) { p.y = 6.5 + Math.random(); p.x = (Math.random() - .5) * 20; p.z = (Math.random() - .5) * 13; }
      o.position.set(cx + p.x + Math.sin(time * .7 + p.ph) * .35, p.y, cz + p.z); o.rotation.set(time * .5 + p.ph, p.spin + time * .3, p.ph); o.scale.setScalar(p.s); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
    im.instanceMatrix.needsUpdate = true;
  } };
}

/* ---------------- the ice: she keeps gliding a little after she stops ---------------- */
export function iceGlide(S, pond) {
  const { girl, sfx } = S; let px = null, pz = null, vx = 0, vz = 0, gliding = false, glides = 0, posed = false, walked = 0, still = 0;
  const stop = () => { if (gliding) { gliding = false; if (posed) { if (girl.poseName === 'up') girl.poseName = null; girl.lean = 0; posed = false; } } vx = vz = 0; };
  return { state: () => ({ gliding, glides, v: +Math.hypot(vx, vz).toFixed(2) }), step({ dt, time }) {
    if (S.playing() || girl.lift > .01 || dt <= 0) { stop(); px = null; return; }
    const on = inPoly(pond, girl.x, girl.z);
    if (girl.walking) { walked += dt; still = 0; if (px !== null) { const k = Math.min(1, dt * 10); vx += ((girl.x - px) / dt - vx) * k; vz += ((girl.z - pz) / dt - vz) * k; } if (gliding) stop(); }
    else if (on && Math.hypot(vx, vz) > .2 && (gliding || (walked > .3 && (still += dt) > .03))) {   // (only after a real walk, and once she has really stopped: not at a corner of her way)
      if (!gliding) { gliding = true; glides++; walked = 0; sfx.swish(1.5); }
      vx *= Math.exp(-1.15 * dt); vz *= Math.exp(-1.15 * dt);
      if (!S.move(girl, vx * dt, vz * dt)) stop();
      else { if (!S.hands.busy({}) && girl.poseName !== 'hold') { girl.poseName = 'up'; posed = true; girl.lean = Math.sin(time * 5) * .06; } if (Math.random() < dt * 8) S.confetti(girl.x, girl.y + .03, girl.z + .05, ['#ffffff', '#dceaf2'], 1, undefined, .5); }
    } else { if (!girl.walking && !on) walked = 0; if (!girl.walking && Math.hypot(vx, vz) <= .2) still = 0; if (gliding) stop(); else if (!girl.walking && !(on && Math.hypot(vx, vz) > .2)) { vx = vz = 0; } }
    px = girl.x; pz = girl.z;
  } };
}
