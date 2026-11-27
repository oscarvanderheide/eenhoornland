// The people of the islands (drawings in people.js). Like the animals, each lives in one spot, waits for her, and answers a
// tap in a way of their own, always the same; a few have a little more to them if she keeps playing:
//   grandma     knits on a bench (dozes while nobody is near). A tap, or sitting down beside her: she waves
//   the baker   holds out a bun: it is in her hands, and whoever she taps next gets it (and munches)
//   the gardener  asleep in his wheelbarrow. A tap: up he shoots, hat in the air, and waves sleepily. A full watering can: wetter
//   the fisherman  a tap and something bites: a fish, a fish, a boot. The fish goes back into the water
//   the painter  every tap she paints on: first strokes, a rainbow, a little unicorn (and is proud); then a clean sheet
//   the accordion player  silent until tapped; then a few long soft notes out of the island's own chord, and he tips his cap
// Nobody makes a sound by themselves. Every maker takes the set's toolbox and a place in the set's own measure, and gives
// back { f, step, state } for the set to step and the tests to ask.
import { THREE, paper, card } from './kit.js';
import { PEOPLE, PROPS } from './people.js';
import { STORY } from './story.js';
import { THINGS } from './things.js';
import { EGG } from './quest.js';
import { gift } from './gear.js';

const near = (f, girl, r) => Math.hypot(f.x - girl.x, f.z - girl.z) < r;
const make = (S, name, spec, x, z, r = .34) => { const f = S.figure(name, spec), [wx, wz] = S.at([x, z]); f.x = wx; f.z = wz; if (r) S.solid({ x, z, r }); return f; };
const WATER = ['#8fd0e0', '#f6efe2', '#7fbcc0'];

/** grandma, on the right half of a bench (x, z: the bench's middle; `bench`: what props.js bench gave, so she knows when she has company) */
export function grandma(S, x, z, bench) {
  const { girl, sfx } = S, f = make(S, 'oma', PEOPLE.oma, x + .3, z + .08, 0); f.lift = .13; f.face = -1; let wave = 0, sat = false, waves = 0;
  const hello = () => { if (wave > 0) return; wave = 1.7; waves++; sfx.hello(); };
  f.onTap = hello;
  f.act = tick => f.setFrame(wave > 0 ? 2 : near(f, girl, 4) ? Math.floor(tick / 4) % 2 : 3);
  return { f, state: () => ({ frame: f.frame, waves }), step({ dt }) { if (wave > 0) wave -= dt; const now = !!bench && bench.state().mode === 'sit'; if (now && !sat) hello(); sat = now; } };
}

/** the baker, with his tray */
export function baker(S, x, z) {
  const { girl, sfx } = S, f = make(S, 'bakker', PEOPLE.bakker, x, z), bun = S.figure('broodje', PROPS.broodje), me = {}; bun.g.visible = false;
  let mode = null, t = 0, held = false, given = 0;
  const down = () => { held = false; bun.g.visible = false; girl.poseName = null; };   // (put down, it is simply gone: the baker has more)
  S.offer(who => { if (!held) return false; down(); S.hands.free(me); given++; who.hopV = 2.6; sfx.munch(); S.confetti(who.x, (who.y || 0) + .6, who.z, ['#e8c58f', '#d9a066', '#f6efe2'], 8, undefined, 1.6); if (who === f) { mode = 'laugh'; t = 0; } return 'broodje'; });
  f.onTap = () => { if (S.playing() || mode) return; S.walkThen(f.x + 1.05, f.z + .12, () => { if (mode) return; girl.view = 'side'; girl.face = -1; mode = 'give'; t = 0; sfx.hop(); }, 1.2); };
  f.act = () => f.setFrame(mode === 'give' ? 1 : mode === 'laugh' ? 2 : 0);
  return { f, state: () => ({ frame: f.frame, held, given }), step({ dt }) {
    if (mode) { t += dt; if (mode === 'give' && t > .7) { S.hands.take(me, down); held = true; mode = 'laugh'; t = 0; f.hopV = 1.6; sfx.hello(); } else if (mode === 'laugh' && t > 1.3) mode = null; }
    if (held) { bun.g.visible = !S.playing(); if (bun.g.visible) { girl.poseName = 'hold'; const h = S.hand(); bun.x = h.x + girl.face * .06; bun.z = h.z + .05; bun.floatY = bun.y = h.y - .08; } }
  } };
}

/** the gardener, asleep in his wheelbarrow. `can`: the farm's watering can (farm.js), for the wet way of waking him */
export function gardener(S, x, z, can) {
  const { girl, sfx } = S, f = make(S, 'tuinman', PEOPLE.tuinman, x, z, .5); let mode = null, t = 0, woke = 0, wet = 0;
  const wake = water => { mode = 'jump'; t = 0; woke++; f.hopV = water ? 3.4 : 2.4; sfx.boing(); if (water) { wet++; sfx.splash(); S.confetti(f.x, .9, f.z, WATER, 18, undefined, 2.8); } };
  f.onTap = () => {
    if (S.playing() || mode) return;
    if (can && can.holding() && can.full()) { const side = girl.x < f.x ? -1 : 1; S.walkThen(f.x + side * 1.2, f.z + .12, () => { if (!mode && can.pourThen(() => wake(true))) girl.face = -side; }, 1.2); return; }
    wake(false);
  };
  f.act = tick => f.setFrame(mode === 'jump' ? 2 : mode === 'wave' ? 3 : near(f, girl, 4.5) ? Math.floor(tick / 8) % 2 : 0);
  return { f, state: () => ({ frame: f.frame, woke, wet }), step({ dt }) { if (!mode) return; t += dt; if (mode === 'jump' && t > 1.0) { mode = 'wave'; t = 0; sfx.hello(); } else if (mode === 'wave' && t > 2.4) mode = null; } };
}

/** the fisherman on his crate; `face` -1: his line hangs to the left of him */
export function fisher(S, x, z, face = -1) {
  const { sfx } = S, f = make(S, 'visser', PEOPLE.visser, x, z, .4); f.face = face; let mode = null, t = 0, n = 0;
  const lineX = () => f.x + face * (PEOPLE.visser.line / PEOPLE.visser.w - .5) * f.W, plop = k => { sfx.splash(); S.confetti(lineX(), .12, f.z, WATER, k, undefined, 1.4); };
  f.onTap = () => { if (mode) return; mode = 'bite'; t = 0; plop(6); };
  f.act = () => f.setFrame(mode === 'bite' ? 1 : mode === 'fish' ? 2 : mode === 'boot' ? 3 : 0);
  return { f, state: () => ({ frame: f.frame, caught: n, mode }), step({ dt }) {
    if (!mode) return; t += dt;
    if (mode === 'bite' && t > .9) { n++; mode = n % 3 ? 'fish' : 'boot'; t = 0; f.hopV = 1.4; if (n % 3) sfx.hop(); else sfx.boing(); }
    else if (mode !== 'bite' && t > 2.4) { if (mode === 'fish') plop(10); mode = null; }   // the fish goes back into the water
  } };
}

/** the painter and her easel (the easel stands to her right) */
export function painter(S, x, z) {
  const { girl, sfx } = S, f = make(S, 'schilder', PEOPLE.schilder, x, z), ez = make(S, 'ezel', PROPS.ezel, x + 1.05, z - .05, .3); let mode = null, t = 0, pic = 0, done = 0;
  const paint = () => { if (mode) return; if (pic === 3) { pic = 0; sfx.rustle(); } mode = 'paint'; t = 0; sfx.swish(3); };
  f.onTap = paint; ez.onTap = paint;
  f.act = tick => f.setFrame(mode === 'paint' ? Math.floor(tick / 2) % 2 : mode === 'proud' ? 3 : near(f, girl, 3.5) ? 2 : 0);
  ez.act = () => ez.setFrame(pic);
  return { f, state: () => ({ frame: f.frame, pic, done }), step({ dt }) {
    if (!mode) return; t += dt;
    if (mode === 'paint' && t > 1.3) { pic++; ez.hopV = 1.2; if (pic === 3) { mode = 'proud'; t = 0; done++; f.hopV = 2.4; sfx.chime(); S.confetti(ez.x, 1.0, ez.z, ['#e98f8f', '#f2c65c', '#9ed9cf', '#bba6ea'], 18, undefined, 2.4); } else { mode = null; sfx.hop(); } }
    else if (mode === 'proud' && t > 2.4) mode = null;
  } };
}

/** the accordion player on his stool */
export function player(S, x, z) {
  const { sfx } = S, f = make(S, 'muzikant', PEOPLE.muzikant, x, z);
  const notes = [0, 1, 2].map(i => { const n = S.figure('noot' + i, PROPS.noot); n.g.visible = false; n.act = () => n.setFrame(i % 2); return { n, t: -1, side: 1 }; });
  let mode = null, t = 0, plays = 0, next = 0, sent = 0;
  f.onTap = () => { if (mode) return; mode = 'play'; t = 0; next = .25; plays++; sfx.squeeze(); };
  f.act = tick => f.setFrame(mode === 'play' ? [0, 1, 2, 1][Math.floor(tick / 3) % 4] : mode === 'bow' ? 3 : 2);
  return { f, state: () => ({ frame: f.frame, plays, playing: mode === 'play', notes: notes.filter(q => q.t >= 0).length }), step({ dt }) {
    for (const q of notes) if (q.t >= 0) { q.t += dt; const k = q.t / 1.9; q.n.x = f.x + q.side * (.4 + k * .55) + Math.sin(q.t * 3) * .08; q.n.z = f.z + .06; q.n.floatY = q.n.y = 1.15 + k * 1.2; if (k >= 1) { q.t = -1; q.n.g.visible = false; } }
    if (!mode) return; t += dt;
    if (mode === 'play') { next -= dt; if (next <= 0) { next = .95; const q = notes.find(q => q.t < 0); if (q) { q.t = 0; q.side = sent++ % 2 ? 1 : -1; q.n.g.visible = true; } } if (t > 4.9) { mode = 'bow'; t = 0; f.hopV = 1.2; } }
    else if (t > 1.4) mode = null;
  } };
}

/** Any other musician (the guitar on the beach, the harp in the forest, the flute on the meadow, the herald at the castle):
 *  silent until tapped; then they play for a few seconds (frames `o.play`, taking turns), notes float up from `o.from`
 *  ([dx, dy] from the card's middle bottom), and they end with frame `o.end` (a bow, a wave). At rest: frame `o.rest`.
 *  `o.sound` makes the music (one of the stage's soft instruments); `o.lift` seats them on something. */
export function musician(S, name, spec, note, x, z, o) {
  const f = make(S, name, spec, x, z, o.solid ?? .34); if (o.lift) f.lift = o.lift; if (o.face) f.face = o.face; if (o.sink) f.sink = o.sink;
  const notes = [0, 1, 2].map(i => { const n = S.figure(name + 'noot' + i, note); n.g.visible = false; n.act = () => n.setFrame(i % 2); return { n, t: -1, side: 1 }; });
  const from = o.from || [.3, 1.1], long = o.long || 4.8; let mode = null, t = 0, plays = 0, next = 0, sent = 0;
  f.onTap = () => { if (mode) return; mode = 'play'; t = 0; next = .25; plays++; o.sound(); };
  f.act = tick => f.setFrame(mode === 'play' ? o.play[Math.floor(tick / 3) % o.play.length] : mode === 'end' ? o.end : o.rest);
  return { f, state: () => ({ frame: f.frame, plays, playing: mode === 'play', notes: notes.filter(q => q.t >= 0).length }), step({ dt }) {
    for (const q of notes) if (q.t >= 0) { q.t += dt; const k = q.t / 1.9; q.n.x = f.x + f.face * from[0] + q.side * k * .5 + Math.sin(q.t * 3) * .08; q.n.z = f.z + .06; q.n.floatY = q.n.y = (f.y || 0) + (f.lift || 0) + from[1] + k * 1.2; if (k >= 1) { q.t = -1; q.n.g.visible = false; } }
    if (!mode) return; t += dt;
    if (mode === 'play') { next -= dt; if (next <= 0) { next = .95; const q = notes.find(q => q.t < 0); if (q) { q.t = 0; q.side = sent++ % 2 ? 1 : -1; q.n.g.visible = true; } } if (t > long) { mode = 'end'; t = 0; f.hopV = 1.2; } }
    else if (t > 1.4) mode = null;
  } };
}

/* ---------------- the witch of the forest ---------------- */
/** A kind little witch, stirring a pot (Oscar: "dont make her look too scary ... a story element to be able to progress to
 *  the meadow"). The pot stands at her right (x, z is where she stands).
 *    before the egg is found   a tap: she asks to see an egg (its card shows above the pot)
 *    with the egg behind her   a tap: she shows what the potion still wants, each as a card above the pot: a flower, an
 *                              apple, and water from the watering can. A tap on her (or on the pot) with one of them in
 *                              her hands puts it in: a puff, and the brew changes colour
 *    all three in              she stirs hard, the pot boils over in stars, and the potion flies up: it is hers (S.gear.potion)
 *  The potion makes the brambles on the bridge to the meadow bloom (props.js bramble, set-dorp.js). */
export function witch(S, x, z) {
  const { girl, sfx } = S, f = make(S, 'heks', STORY.heks, x, z, .34), [px, pz] = [x + 1.02, z - .04], [wpx, wpz] = S.at([px, pz]);
  // the pot: round and plum-coloured on three little legs over a paper fire; what is in it shows on top
  const pot = new THREE.Group(); pot.position.set(px, f.y || 0, pz); S.root.add(pot);
  const body = new THREE.Mesh(new THREE.SphereGeometry(.46, 16, 10, 0, 6.283, Math.PI * .22, Math.PI * .78), paper('#8a6f9c')); body.position.y = .5; body.castShadow = true; pot.add(body);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.37, .05, 6, 18), paper('#6f5a80')); rim.rotation.x = Math.PI / 2; rim.position.y = .84; pot.add(rim);
  for (let i = 0; i < 3; i++) { const a = i / 3 * 6.283 + .5, l = new THREE.Mesh(new THREE.CylinderGeometry(.04, .03, .2, 5), paper('#6f5a80')); l.position.set(Math.cos(a) * .3, .1, Math.sin(a) * .3); pot.add(l); }
  for (const [dx, c, h] of [[-.14, '#f2b56b', .26], [.02, '#f2d86b', .34], [.16, '#e98f8f', .22]]) { const fl = card([[-.09, 0], [-.06, h * .5], [0, h], [.06, h * .5], [.09, 0]], .02, paper(c, { side: THREE.DoubleSide, extra: { emissive: c, emissiveIntensity: .5 } })); fl.position.set(dx, 0, .32); pot.add(fl); }
  const brewM = new THREE.MeshStandardMaterial({ color: '#bfe9c9', emissive: '#bfe9c9', emissiveIntensity: .35, roughness: .5 }), brew = new THREE.Mesh(new THREE.CircleGeometry(.36, 18), brewM); brew.rotation.x = -Math.PI / 2; brew.position.y = .83; brew.userData.live = true; pot.add(brew);
  S.solid({ x: px, z: pz, r: .5 });
  const WANT = [['bloem', null], ['appel', THINGS.appel], ['water', THINGS.gieter]], COLS = ['#bfe9c9', '#f6e3a0', '#f8c6d8', '#f4a6c4'], have = { bloem: false, appel: false, water: false };
  // the wish cards: an egg; a flower (a little paper one of its own), an apple, the full can
  const FLOWER = { w: 90, h: 110, frames: 1, size: .32, thing: true, draw: THINGS.bloem ? THINGS.bloem.draw : (g => { g.save(); g.fillStyle = '#6f8f55'; g.fillRect(42, 52, 6, 50); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; g.fillStyle = '#e98f8f'; g.beginPath(); g.arc(45 + Math.cos(a) * 17, 38 + Math.sin(a) * 17, 12, 0, 6.283); g.fill(); } g.fillStyle = '#f2c65c'; g.beginPath(); g.arc(45, 38, 10, 0, 6.283); g.fill(); g.restore(); }) };
  const eggWish = S.figure('heksei', EGG), wishes = { bloem: S.figure('heksbloem', FLOWER), appel: S.figure('heksappel', THINGS.appel), water: S.figure('hekswater', THINGS.gieter) };
  wishes.water.act = () => wishes.water.setFrame(1); for (const w of [eggWish, ...Object.values(wishes)]) { w.g.visible = false; w.thing = true; w.z = wpz + .08; }
  wishes.bloem.g.scale.setScalar(1.5); wishes.appel.g.scale.setScalar(2.3); eggWish.g.scale.setScalar(.9);
  const present = gift(S, 'drankje', STORY.drankje);
  let mode = null, t = 0, show = 0, asks = 0, made = false, puff = 0;
  const count = () => Object.values(have).filter(Boolean).length;
  const put = kind => { have[kind] = true; puff = 1; f.hopV = 1.6; sfx.splash(); S.confetti(wpx, (f.y || 0) + 1.1, wpz, [COLS[count()], '#fbf7ee'], 14, S.starGeo, 2.2); if (count() === 3) { mode = 'brew'; t = 0; show = 0; } else { mode = 'glad'; t = 0; } };
  f.onGift = kind => { if (made || mode === 'brew') { mode = 'glad'; t = 0; return; } if (kind in have && !have[kind] && S.quest.stage !== 'zoek' && S.quest.stage !== 'dream') put(kind); else { mode = 'glad'; t = 0; } };
  const tap = () => {
    if (S.playing() || mode === 'brew') return;
    const can = S.shared.can, egg = S.quest.stage !== 'zoek' && S.quest.stage !== 'dream';
    if (made || S.gear.potion) { mode = 'glad'; t = 0; sfx.hello(); return; }
    if (egg && !have.water && can && can.holding()) { if (can.full()) { S.walkThen(wpx - .15, wpz + 1.0, () => { girl.view = 'back'; can.pourThen(() => put('water')); }, 1.3); return; } }
    mode = 'ask'; t = 0; show = 2.8; asks++; sfx.hello();
  };
  f.onTap = tap; S.tap(pot, () => { if (!S.give(f)) tap(); });
  f.act = tick => f.setFrame(mode === 'ask' ? 2 : mode === 'glad' ? 3 : mode === 'brew' ? Math.floor(tick / 2) % 2 : near(f, girl, 5) ? Math.floor(tick / 6) % 2 : 0);
  return { f, state: () => ({ frame: f.frame, mode, asks, have: { ...have }, made, potion: S.gear.potion, wishing: show > 0 }), step({ dt, time }) {
    const egg = S.quest.stage !== 'zoek' && S.quest.stage !== 'dream', y0 = (f.y || 0);
    brewM.color.set(COLS[count()]); brewM.emissive.set(COLS[count()]); brew.position.y = .83 + Math.sin(time * 3) * .012; if (puff > 0) puff = Math.max(0, puff - dt * 2); brew.scale.setScalar(1 + puff * .12);
    if (show > 0) show -= dt;
    const on = show > 0; eggWish.g.visible = on && !egg; if (eggWish.g.visible) { eggWish.x = wpx; eggWish.floatY = eggWish.y = y0 + 1.5 + Math.sin(time * 3) * .04; }
    const missing = Object.keys(wishes).filter(k => !have[k]); Object.entries(wishes).forEach(([k, w]) => { const i = missing.indexOf(k); w.g.visible = on && egg && !made && i >= 0; if (w.g.visible) { w.x = wpx + (i - (missing.length - 1) / 2) * .72; w.floatY = w.y = y0 + 1.5 + Math.sin(time * 3 + i) * .04; } });
    if (!mode) return; t += dt;
    if (mode === 'brew') { if (Math.floor(t * 6) !== Math.floor((t - dt) * 6)) S.confetti(wpx, y0 + 1.0, wpz, COLS, 3, S.starGeo, 1.8); if (t > 2.0 && !S.playing()) { made = true; mode = 'glad'; t = 0; sfx.chime(); present([wpx, y0 + 1.0, wpz], () => { S.gear.potion = true; }); } }
    else if (t > (mode === 'ask' ? 2.8 : 1.6)) mode = null;
  } };
}
