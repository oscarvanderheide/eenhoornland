// What makes the world feel alive, all of it just for fun: animals you can pick up and throw, birds that fly off when
// you come near or when the scarecrow is shaken, trees and bushes that shake when tapped (leaves, an apple, a startled
// bird), butterflies that follow you, fish that jump out of the sea. Nothing here is saved or needed for anything.
// world.js hands over the same toolbox (ctx) as for world-extras.js.
import * as PX from './pixel.js';
import * as ART from './art.js';
import * as MAP from './map.js';
import * as Q from './quest.js';
import { sfx } from './audio.js';
import { state, save } from './state.js';

const TREES = ['tree', 'pine', 'apple', 'oak', 'palm', 'rainbowtree', 'berk', 'bloesem', 'lolly', 'cipres'], BUSHES = ['bush', 'hedge', 'rose', 'fern', 'bol', 'wolkstruik', 'lavendel', 'zonnebloemen', 'helm', 'kristalbloem'];
const NUT = { tree: ART.eikel, oak: ART.eikel, pine: ART.dennenappel, palm: ART.kokosnoot };
const WHEE = ['Wiiii!', 'Joehoe!', 'Nog een keer!', 'Hihihi!', 'Hoppa!'];

export function createLife(ctx) {
  const { THREE, scene, M, tex, makeSprite, burst, bubble, kid, uni, animals } = ctx;
  const rnd = (a, b) => a + Math.random() * (b - a), now = () => performance.now();
  const groundAt = (x, z) => M.inb(Math.floor(x), Math.floor(z)) ? M.ground[M.I(Math.floor(x), Math.floor(z))] : MAP.SE;

  /* ---------------- little things that fall or float: leaves, apples, notes ---------------- */
  const bits = [];
  function bit(art, x, y, z, o = {}) {
    const m = makeSprite(art, { lean: .3, shadow: false, scale: o.scale || 1 }); m.position.set(x, y, z); scene.add(m);
    const b = Object.assign({ m, vx: 0, vy: 0, vz: 0, g: 6, life: 1.6, sway: 0, bounce: 0, spin: 0, t: 0 }, o); bits.push(b); if (b.grow) m.scale.setScalar(.01); return b;
  }
  const leaves = (x, z, n, top = 1.5) => { for (let i = 0; i < n; i++) bit(ART.leaf(i), x + rnd(-.6, .6), top + rnd(-.3, .4), z + .1, { vy: rnd(-.2, .4), g: 1.3, sway: rnd(2, 4), life: rnd(1.4, 2.2), spin: rnd(-3, 3) }); };

  /* ---------------- birds ---------------- */
  const birdTex = seed => { const o = {}; for (const f of ['sit', 'up', 'down']) { o[f] = tex(ART.bird(seed, f)); o[f + 'F'] = tex(PX.flipX(ART.bird(seed, f))); } return o; };
  const birdTexs = [0, 1, 2].map(birdTex), birds = [];
  function addBird(x, z, seed, temp = false) {
    const m = makeSprite(ART.bird(seed, 'sit'), { lean: .3, shadow: false, scale: .9 }); m.material = m.material.clone(); scene.add(m);
    const b = { m, seed, home: new THREE.Vector3(x, 0, z), pos: new THREE.Vector3(x, 0, z), state: 'sit', t: rnd(0, 5), dir: 1, temp, vx: 0, vz: 0, y: 0 };
    birds.push(b); return b;
  }
  function frame(b, f) { const t = birdTexs[b.seed % 3][f + (b.dir < 0 ? 'F' : '')]; if (b.m.material.map !== t) { b.m.material.map = t; b.m.material.emissiveMap = t; } }
  function flee(b, fromX, fromZ) {
    if (b.state !== 'sit') return; const a = Math.atan2(b.pos.z - fromZ, b.pos.x - fromX) + rnd(-.5, .5);
    b.state = 'flee'; b.t = 0; b.vx = Math.cos(a) * rnd(3, 4.5); b.vz = Math.sin(a) * rnd(1, 2) - 1.2; b.dir = b.vx >= 0 ? 1 : -1;
  }
  /** everything with wings within `r` of (x, z) takes off */
  function scare(x, z, r) { let n = 0; for (const b of birds) if (b.state === 'sit' && Math.hypot(b.pos.x - x, b.pos.z - z) < r) { flee(b, x, z); n++; } if (n) sfx.whoosh(); return n; }
  // a little flock in the vegetable garden (the scarecrow is supposed to keep them out), and a few birds on every island
  const G = MAP.GARDEN; for (let k = 0; k < 6; k++) addBird(G.x0 + 1.2 + k * 1.05, G.z0 + .9 + (k % 3) * 1.1, k);
  [...M.spawns.bloem.slice(0, 3), ...M.spawns.schelp.slice(0, 3), ...M.spawns.diamant.slice(0, 2)].forEach(([x, z], k) => addBird(x + .3, z + .7, k));

  /* ---------------- butterflies ---------------- */
  const flies = M.spawns.bloem.slice(8, 14).map(([x, z], k) => {
    const m = makeSprite(PX.butterfly(), { lean: .2, shadow: false, scale: .55 }); scene.add(m);
    return { m, home: new THREE.Vector3(x + .5, 0, z + .5), p: k * 1.7, r: rnd(.8, 1.6), sp: rnd(.5, .9) };
  });

  /* ---------------- fish ---------------- */
  const jumps = []; let fishT = 9;
  function fishJump(x, z, quiet = false) { if (groundAt(x, z) !== MAP.SE) return; const m = makeSprite(ART.fish(jumps.length), { lean: .1, shadow: false }); scene.add(m); jumps.push({ m, x, z, t: 0, quiet, dir: Math.random() < .5 ? 1 : -1 }); }
  /** a tap on the sea or the pond */
  function splash(x, z) {
    sfx.splash(); burst(new THREE.Vector3(x, -.4, z), 5);
    if (groundAt(x, z) === MAP.SE) fishJump(x, z); else for (const a of animals) if (a.water && !a.fly) a.hop = 1;
  }

  /* ---------------- trees, bushes and props that are tapped ---------------- */
  function tapProp(t) {
    if (!t || (t.cool || 0) > now()) return; t.cool = now() + 700;
    const x = t.px || t.x + .5, z = t.z + .5, k = t.kind;
    if (k === 'scarecrow') { ctx.wobble(t, .55); sfx.boing(); scare(x, z, 10); burst(new THREE.Vector3(x, .4, z), 4); return; }
    if (TREES.includes(k)) {
      ctx.wobble(t, k === 'oak' ? .07 : .14); sfx.brush(); leaves(x, z, k === 'pine' ? 3 : 6, 1.3 * t.sc);
      // now and then: a nut is loose and lands on her head when she gets there, or a squirrel tumbles out
      const r = Math.random();
      if (NUT[k] && r < .22 && !pending.includes(t)) { t.bonkUntil = now() + 6000; pending.push(t); }
      else if (r > .92 && k !== 'palm' && k !== 'rainbowtree') { const d = Math.random() < .5 ? 1 : -1; bit(ART.squirrel(), x + d * .3, 1.3 * t.sc, z + .2, { vx: d * 2.2, vy: 2.5, g: 10, bounce: 2, life: 1.8 }); setTimeout(sfx.pop, 380); }
      if (k === 'apple') {                                                            // one real apple a day falls out of every apple tree, to keep
        const idx = 1000 + M.trees.indexOf(t), ax = x + rnd(-.45, .45), spot = ctx.nearestWalkable(ax, z + 1);
        if (spot && t.gave !== Q.quest.day && !(Q.quest.picked.appel || []).includes(idx)) { t.gave = Q.quest.day; bit(PX.apple(), spot[0] + .5, 1.2, spot[1] + .5, { g: 9, bounce: 1, life: .75 }); setTimeout(() => ctx.extras.dropItem('appel', idx, spot[0] + .5, spot[1] + .55), 700); }
        else bit(ART.leaf(2), ax, 1.2, z + .2, { g: 4, sway: 3, life: 1.6 });
      }
      if (k === 'rainbowtree') { burst(new THREE.Vector3(x, .9, z), 8, true); ctx.extras.shakeTree(); }
      if (Math.random() < .4) { const b = addBird(x + rnd(-.4, .4), z, Math.floor(rnd(0, 3)), true); b.pos.y = b.y = 1.2 * t.sc; flee(b, x + rnd(-1, 1), z + 1); sfx.whoosh(); }
      return;
    }
    if (BUSHES.includes(k)) {
      ctx.wobble(t, .3); sfx.brush(); leaves(x, z, 3, .5);
      if (Math.random() < .14) { const d = kid.pos.x >= x ? -1 : 1; setTimeout(() => { sfx.boing(); bit(ART.kikker('jump'), x, .35, z + .25, { vx: d * 1.6, vy: 4.2, g: 11, bounce: 2, life: 1.7 }); }, 250); }   // a frog was sitting in there
      return;
    }
    if (k === 'statue') { ctx.wobble(t, .08); sfx.sparkle(); burst(new THREE.Vector3(x, .6, z), 8); return; }
    ctx.wobble(t, k === 'rock' || k.startsWith('rots') ? .1 : .3); sfx.pop();
  }

  /* ---------------- picking animals up and throwing them ---------------- */
  function hold(c) { if (c.nap > 0) { c.nap = 0; c.morning = false; c.mesh.rotation.z = 0; } if (carried === c) carried = null; c.swim = null; c.held = true; c.fly = null; c.path = []; c.lift = .9; sfx.pop(); bubble(c, '!'); }
  // a tap is enough: she walks over, lifts it above her head and carries it. A tap on the animal (or the jump button) throws it,
  // a tap on her puts it down, getting on the bike drops it in the trailer.
  let carried = null;
  /* pebbles: picked up and thrown like the animals. On land one stays where it falls; in the water it goes plop and sinks,
     and a little later the sea has washed a new one up where the old one lay. */
  const stones = M.stones.map(([x, z], k) => {
    const art = ART.kei(k), c = ctx.makeChar({ idle: art, w1: art, w2: art }, { blobW: .4, name: 'Kei', say: [], sound: 'pop' });
    c.stone = true; c.home0 = [x + .5, z + .6]; c.pos.set(c.home0[0], 0, c.home0[1]); c.ghost = ctx.seeThrough(c.mesh).children.at(-1); c.back = 0; return c;
  });
  const movers = () => animals.concat(stones);
  const dist = c => Math.hypot(c.pos.x - kid.pos.x, c.pos.z - kid.pos.z);
  function lift(c) {
    if (c.fly || c.cart || carried === c) return; if (c.nap > 0) wake(c); if (carried) setDown(); if (ctx.toys && ctx.toys.carrying()) ctx.toys.putDown(true);
    carried = c; c.held = true; c.lost = false; c.path = []; c.lift = .2; kid.hop = .5; (sfx[c.sound] || sfx.pop)(); if (!c.stone) { bubble(c, c.say[Math.floor(Math.random() * c.say.length)]); burst(c.pos, 4, true); }
  }
  function setDown() {
    const c = carried; if (!c) return false; carried = null; c.held = false; c.lift = 0; c.mesh.rotation.z = 0; c.hop = 1; c.wait = 2; sfx.pop();
    const x = kid.pos.x + .7 * kid.face, ok = c.water ? false : ctx.walkable(Math.floor(x), Math.floor(kid.pos.z)); c.pos.set(ok ? x : kid.pos.x, 0, kid.pos.z + .05); if (c.water) c.lost = true;
    return true;
  }
  function throwIt() { const c = carried; if (!c) return false; carried = null; c.pos.set(kid.pos.x, 0, kid.pos.z); c.lift = 1; toss(c, kid.face * (c.stone ? 6.5 : 4.5), rnd(-.6, .6)); kid.hop = .5; return true; }
  /** the pick-up key: throw what she holds, or lift the nearest animal or pebble within reach */
  function grabNear() {
    if (carried) return throwIt(); let best = null, bd = 1.2;
    for (const c of movers()) { if (!c.g.visible || c.fly || c.cart || c.swim || c.isUni || c.dog) continue; const d = dist(c); if (d < bd) { bd = d; best = c; } }
    if (!best) return false; lift(best); return true;
  }
  /** for the action button: the animal or pebble within reach she would lift (ducks stay in their pond; one busy with its own hello answers her jumps instead) */
  function nearMover() { let best = null, bd = 1; for (const c of movers()) { if (!c.g.visible || c.fly || c.cart || c.swim || c.isUni || c.dog || c.water || c.held || c.way) continue; const d = dist(c); if (d < bd) { bd = d; best = c; } } return best; }
  function tapAnimal(c) {
    if (c.fly || c.cart || c.swim) return; if (carried === c) return void throwIt();
    if (c.uniKind) return tapHerd(c);                                                                  // an old unicorn from the meadow: she comes along
    const ways = ctx.ways; if (c.way && ways && ways.tap(c)) return;                                   // busy with its own thing (world-ways.js)
    // it shows its own way of saying hello, and a second tap lifts it
    if (ways && ways.far(c) && dist(c) < 9 && ways.tap(c)) return;                                     // the deer, the gull and the parrot come to her
    c.path = []; c.wait = 8; c.hop = 1; c.face = kid.pos.x >= c.pos.x ? 1 : -1;                       // it waits for her
    const act = () => { if (!(ways && ways.tap(c))) lift(c); };
    if (dist(c) < 1.8) return act();
    const then = () => { if (dist(c) < 3.6) act(); };
    if (ctx.approach(Math.floor(c.pos.x), Math.floor(c.pos.z), then, true)) return;
    const t = ctx.nearestWalkable(c.pos.x, c.pos.z); if (!t || !ctx.walkThen(t[0], t[1], then)) { if (!(ways && ways.tap(c))) (sfx[c.sound] || sfx.pop)(); }   // too far to reach: it says hello from where it is
  }
  function toss(c, vx, vz) {
    if (c.nap > 0) { c.nap = 0; c.morning = false; c.mesh.rotation.z = 0; }
    const sp = Math.hypot(vx, vz), max = 9, f = sp > max ? max / sp : 1;
    c.held = false; c.fly = { vx: vx * f, vz: vz * f, vy: 5.5, h: c.lift || .9, bounces: 0 }; if (Math.abs(vx) > .2) c.face = vx > 0 ? 1 : -1;
    sfx.whoosh(); if (!c.stone) bubble(c, WHEE[Math.floor(Math.random() * WHEE.length)]);
  }
  const dustArt = PX.gridSprite(3, 2, (x, y) => y === 0 && x !== 1 ? null : '#E9DCC4', { outline: false, key: 'dust' });
  function dust(x, z, n) { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; bit(dustArt, x + Math.cos(a) * .2, .08, z + Math.sin(a) * .12 + .05, { vx: Math.cos(a) * 1.4, vy: .6, g: 1.5, life: .5 }); } }
  function stepFlight(c, dt) {
    const f = c.fly; f.vy -= 12 * dt; f.h += f.vy * dt;
    c.pos.x = THREE.MathUtils.clamp(c.pos.x + f.vx * dt, 2, M.W - 2); c.pos.z = THREE.MathUtils.clamp(c.pos.z + f.vz * dt, 2, M.H - 2);
    c.lift = Math.max(0, f.h); c.mesh.rotation.z = THREE.MathUtils.clamp(f.vy * .05, -.3, .3) * (c.face || 1);   // no somersaults: it leans a little, nose up on the way up and down on the way down
    if (f.h > 0) return;
    const tx = Math.floor(c.pos.x), tz = Math.floor(c.pos.z);
    if (!ctx.walkable(tx, tz)) {                                                   // in the water: it swims back. On a roof, in a tree: bounce on to the nearest free spot
      const g = groundAt(c.pos.x, c.pos.z), fount = Math.hypot(c.pos.x - MAP.FOUNT.cx, c.pos.z - MAP.FOUNT.cz - .3) < 1.8, wet = g === MAP.SE || g === MAP.WA || fount;
      if (fount && c.stone) {                                                     // into the fountain: a wish. The first one of the day brings up a coin
        sfx.splash(); burst(new THREE.Vector3(c.pos.x, .6, c.pos.z), 10); c.fly = null; c.lift = 0; c.mesh.rotation.z = 0; c.g.visible = false; c.back = 12;
        setTimeout(() => { sfx.sparkle(); burst(new THREE.Vector3(MAP.FOUNT.cx, 1, MAP.FOUNT.cz + .5), 12, true); if (Q.wish()) { bit(ART.coin(), MAP.FOUNT.cx, 1.4, MAP.FOUNT.cz + .9, { vx: (kid.pos.x - MAP.FOUNT.cx) * .5, vy: 4, g: 9, bounce: 2, life: 1.6 }); sfx.chime(); } }, 500); return;
      }
      if (wet && c.stone) {                                                       // plop
        sfx.splash(); sfx.bubble(); burst(new THREE.Vector3(c.pos.x, .1, c.pos.z), 5); for (let i = 0; i < 10; i++) bit(ART.drop(), c.pos.x + rnd(-.25, .25), .1, c.pos.z + .1, { vx: rnd(-1.6, 1.6), vy: rnd(2.5, 5.5), g: 10, life: 1 });
        if (g === MAP.WA) ducksLook(c.pos.x, c.pos.z);                            // in the pond: the ducks come to see if it is bread
        fishJump(c.pos.x + rnd(-1, 1), c.pos.z + rnd(-.6, .6)); c.fly = null; c.lift = 0; c.mesh.rotation.z = 0; c.g.visible = false; c.back = 12; return;
      }
      if (wet && !c.water) {
        sfx.splash(); burst(new THREE.Vector3(c.pos.x, .1, c.pos.z), 6); for (let i = 0; i < 8; i++) bit(ART.drop(), c.pos.x + rnd(-.3, .3), .1, c.pos.z + .1, { vx: rnd(-2, 2), vy: rnd(2, 4.5), g: 10, life: .9 });
        const t = ctx.nearestWalkable(c.pos.x, c.pos.z) || ctx.randomTile(c); c.fly = null; c.mesh.rotation.z = 0; c.swim = { x: t[0] + .5, z: t[1] + .5, rip: 0 }; return;
      }
      if (wet) { c.fly = null; c.lift = 0; c.mesh.rotation.z = 0; c.path = []; sfx.splash(); burst(new THREE.Vector3(c.pos.x, .1, c.pos.z), 6); return; }   // a duck is at home there
      sfx.boing(); hitAt(c.pos.x, c.pos.z);                                       // into a tree: it shakes (an apple tree lets go of its apple)
      const t = ctx.nearestWalkable(c.pos.x, c.pos.z) || ctx.randomTile(c), T = .65;
      f.vx = (t[0] + .5 - c.pos.x) / T; f.vz = (t[1] + .5 - c.pos.z) / T; f.vy = 12 * T / 2; f.h = .01; return;
    }
    if (f.bounces < 2 && Math.abs(f.vy) > 2) { f.bounces++; f.vy = -f.vy * .45; f.vx *= .5; f.vz *= .5; f.h = .01; c.squash = .6; dust(c.pos.x, c.pos.z, 3); sfx.boing(); return; }   // each bounce lower
    if (c.stone) { c.fly = null; c.lift = 0; c.mesh.rotation.z = 0; sfx.pop(); for (const a of animals) if (!a.held && !a.fly && !a.cart && !a.swim && Math.hypot(a.pos.x - c.pos.x, a.pos.z - c.pos.z) < 1.6) a.hop = 1; fetchStone(c); return; }   // thud: whoever stands there jumps (and the dog runs to get it)
    const st = Q.sandAt(tx, tz); if (st >= 0) { Q.stompSand(tx, tz); burst(c.pos, 6); }   // landed on a sand tower: flat
    const col = ctx.toys && ctx.toys.paintAt(c.pos.x, c.pos.z); if (col) paint(c, col);
    c.fly = null; c.lift = 0; c.upright = { from: Math.atan2(Math.sin(c.mesh.rotation.z), Math.cos(c.mesh.rotation.z)), t: 0 }; c.squash = 1; c.lost = true; c.wait = 1.5; c.path = [];   // lands: squashes flat, wobbles back, rolls upright
    (sfx[c.sound] || sfx.pop)(); dust(c.pos.x, c.pos.z, 6); for (let i = 0; i < 3; i++) bit(ART.dizzy(), c.pos.x + Math.cos(i * 2.1) * .3, .95, c.pos.z + .1, { vx: -Math.sin(i * 2.1) * .9, vy: .4, g: .5, life: 1.2 });
    // thrown three times in a short while: it is so dizzy it falls over and has a little nap right there
    c.thrown = (c.thrown || []).filter(t => now() - t < 25000); c.thrown.push(now());
    if (c.thrown.length >= 3 && !c.isUni) { c.thrown = []; c.nap = 5; c.zT = .6; c.wait = 6; bubble(c, 'Zzz...'); }
  }
  function wake(c) { c.nap = 0; c.mesh.rotation.z = 0; c.hop = 1; c.wait = 1; (sfx[c.sound] || sfx.pop)(); }

  /* ---------------- friends: an old unicorn from the meadow walks along behind her for the rest of the day ---------------- */
  // the trail of her own footsteps, newest first: friends walk in it, one behind the other, behind the unicorn
  const friends = [], steps = [];
  // her own unicorn always comes along, so two friends at most (an old unicorn counts as one): more is too busy to see her
  const MAX_FRIENDS = 2;
  /** a new friend joined: the one who has been with her longest goes home */
  function makeRoom() { while (friends.length > MAX_FRIENDS) goHome(friends.reduce((a, b) => (a.joined || 0) <= (b.joined || 0) ? a : b)); }
  function goHome(c) { const i = friends.indexOf(c); if (i >= 0) friends.splice(i, 1); c.friend = false; c.lost = true; c.wait = .5; c.hop = 1; bubble(c, '', PX.heart()); }
  /** a little dragon happy-sneezes a cloud of sparks */
  function puff(c) { sfx.whoosh(); for (let i = 0; i < 7; i++) bit(PX.sparkle(i % 2 ? '#FFD43B' : '#FF9E6B'), c.pos.x + c.face * .5, .7, c.pos.z + .1, { vx: c.face * rnd(1.5, 3), vy: rnd(.5, 2), g: 1, life: rnd(.6, 1) }); }
  function stepAt(d) { let acc = 0; for (let i = 0; i < steps.length - 1; i++) { const a = steps[i], b = steps[i + 1], s = Math.hypot(b.x - a.x, b.z - a.z); if (acc + s >= d) { const t = (d - acc) / (s || 1); return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }; } acc += s; } return steps.length ? steps[steps.length - 1] : null; }
  /** she jumps: her friends jump too (follow the leader) */
  function jumped() { { let best = null, bd = 1.9; for (const t of M.trees) { const d = Math.hypot((t.px || t.x + .5) - kid.pos.x, t.z + .5 - kid.pos.z); if (d < bd && TREES.includes(t.kind)) { bd = d; best = t; } } if (best) setTimeout(() => tapProp(best), 250); }   // a jump right next to a tree shakes it
    friends.forEach((c, i) => setTimeout(() => { if (c.held || c.fly || c.swim || c.nap > 0) return; c.hop = 1; if (c.name === 'Draakje') puff(c); }, 180 + i * 140)); }
  const offQ = Q.on(type => { if (type === 'day') { for (const c of [...friends]) goHome(c); unpaint(); flowerWalk = false; } });

  /* ---------------- things that do something to other things ---------------- */
  /** something hit (x, z) hard (a ball, a thrown animal): a tree there shakes, birds nearby fly up */
  function hitAt(x, z) {
    let best = null, bd = 1.3; for (const t of M.trees) { const d = Math.hypot((t.px || t.x + .5) - x, t.z + .5 - z); if (d < bd) { bd = d; best = t; } }
    if (best && TREES.concat(BUSHES).includes(best.kind)) tapProp(best); scare(x, z, 2.5);
  }
  /** paint on an animal: it keeps the colour for the rest of the day */
  const painted = [];
  function paint(c, col) {
    if (c.painted === col || c.isUni) return; c.painted = col; if (!painted.includes(c)) painted.push(c);
    const tint = new THREE.Color(PX.mix(col, '#FFFFFF', .35)); c.mesh.material.color.copy(tint); c.mesh.material.emissive.copy(tint);
    sfx.splash(); c.hop = 1; for (let i = 0; i < 6; i++) bit(PX.gridSprite(2, 2, () => col, { outline: false, key: 'spat' + col }), c.pos.x + rnd(-.3, .3), .2, c.pos.z + .1, { vx: rnd(-1.8, 1.8), vy: rnd(1.5, 3), g: 9, life: .6 });
  }
  function unpaint() { for (const c of painted) { c.painted = null; c.mesh.material.color.set('#FFFFFF'); c.mesh.material.emissive.set('#FFFFFF'); } painted.length = 0; }
  function ducksLook(x, z) { for (const a of animals) if (a.water && !a.fly && !a.held) { a.path = [new THREE.Vector3(x + rnd(-.4, .4), 0, z + rnd(-.2, .2))]; a.wait = 4; setTimeout(() => bubble(a, 'Kwak?'), 900); } }
  /* the dog plays along: a ball rolling by is chased and kicked back to her, a pebble she throws is brought back */
  const dog = animals.find(a => a.name === 'Hondje'); let fetch = null, dogCool = 0;
  const dogFree = () => dog && dog.g.visible && !dog.held && !dog.fly && !dog.swim && !dog.cart && !(dog.nap > 0) && !dog.friend;
  function startFetch(kind, o) { if (fetch || !dogFree() || now() < dogCool) return; fetch = { kind, o, t: 0, re: 0, back: false }; dog.speed = 3.2; dog.hop = 1; bubble(dog, 'Woef!'); (sfx[dog.sound] || sfx.pop)(); }
  function fetchStone(c) { if (c.held || c.dog || !dog || Math.hypot(dog.pos.x - c.pos.x, dog.pos.z - c.pos.z) > 13) return; startFetch('stone', c); }
  function endFetch(happy) {
    if (!fetch) return; const f = fetch; fetch = null; dogCool = now() + 2500; if (!dog) return; dog.speed = .9; dog.path = []; dog.wait = 2;
    if (f.kind === 'stone' && f.o.dog) { f.o.dog = false; f.o.held = false; f.o.lift = 0; f.o.pos.set(dog.pos.x + dog.face * .4, 0, dog.pos.z + .1); }
    if (happy) { dog.hop = 1; bubble(dog, '', PX.heart()); burst(dog.pos, 5, true); }
  }
  function stepFetch(dt) {
    if (!fetch) { if (dogFree() && now() > dogCool) for (const b of ctx.play.balls) { if (Math.hypot(b.vx, b.vz) > 2.5 && !b.gust && !b.float && Math.hypot(dog.pos.x - b.x, dog.pos.z - b.z) < 8) { startFetch('ball', b); break; } } return; }
    const f = fetch; f.t += dt; if (carried === f.o) { f.o.dog = false; fetch = null; dog.speed = .9; dog.path = []; dogCool = now() + 2500; return; }   // she took it from him
    if (f.t > 14 || !dogFree()) return endFetch(false);
    if (f.kind === 'ball' && (f.o.gust || f.o.float || ctx.play.wetAt(f.o.x, f.o.z))) return endFetch(false);
    if (f.kind === 'stone' && !f.back && (!f.o.g.visible || f.o.held || f.o.fly)) return endFetch(false);     // she picked it up herself
    const tx = f.back ? kid.pos.x : f.kind === 'ball' ? f.o.x : f.o.pos.x, tz = f.back ? kid.pos.z : f.kind === 'ball' ? f.o.z : f.o.pos.z, d = Math.hypot(tx - dog.pos.x, tz - dog.pos.z);
    if (f.back) { f.o.pos.set(dog.pos.x + dog.face * .35, 0, dog.pos.z + .05); f.o.lift = .25; }
    if (d < (f.back ? 1.3 : .6)) {
      if (f.kind === 'ball') { const b = f.o, k = Math.hypot(kid.pos.x - b.x, kid.pos.z - b.z); ctx.play.kickBall(b, kid.pos.x - b.x, kid.pos.z - b.z, THREE.MathUtils.clamp(k * 1.1, 3, 6.5)); return endFetch(true); }
      if (!f.back) { f.back = true; f.o.dog = true; f.o.held = true; f.re = 0; sfx.pop(); return; }
      return endFetch(true);
    }
    if ((f.re -= dt) < 0) {
      f.re = .5; dog.wait = 5; const sx = Math.floor(dog.pos.x), sz = Math.floor(dog.pos.z), ex = Math.floor(tx), ez = Math.floor(tz);
      const p = ctx.astar(sx, sz, ex, ez, (x, z) => ctx.walkable(x, z) || (x === sx && z === sz)); if (!p) return endFetch(false);
      dog.path = p.slice(1).map(([x, z]) => new THREE.Vector3(x + .5, 0, z + .5)); if (dog.path.length) dog.path[dog.path.length - 1].set(tx, 0, tz); else dog.path = [new THREE.Vector3(tx, 0, tz)];
    }
  }

  /* ---------------- the old unicorns: one comes along, and a tap on her shows what she can do ---------------- */
  // Every kind has its own power: the forest unicorn makes the woods around her shake and mushrooms pop up, the flower
  // unicorn makes flowers grow in the girl's footsteps, the rainbow unicorn slides her along a rainbow to somewhere
  // further on, the sea unicorn dives with her under the sea (near the water), the star unicorn flies her up into the clouds.
  let power = null, flowerWalk = false; const blooms = []; let lastBloom = null;
  function tapHerd(c) {
    c.face = kid.pos.x >= c.pos.x ? 1 : -1;
    const act = () => {
      if (!c.friend) { for (const f of friends.filter(f => f.uniKind)) goHome(f); c.hop = 1; sfx.sparkle(); burst(c.pos, 8, true); bubble(c, 'Kom mee!'); c.friend = true; c.wait = 0; c.path = []; c.joined = now(); friends.unshift(c); makeRoom(); return; }
      usePower(c);
    };
    if (dist(c) < 2.2 || c.friend) return act();
    if (!ctx.approach(Math.floor(c.pos.x), Math.floor(c.pos.z), () => { if (dist(c) < 3.6) act(); }, true)) { const t = ctx.nearestWalkable(c.pos.x, c.pos.z); if (!t || !ctx.walkThen(t[0], t[1], act)) act(); }
  }
  const nearSea = () => { for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) { const x = Math.floor(kid.pos.x) + dx, z = Math.floor(kid.pos.z) + dz; if (M.inb(x, z) && M.ground[M.I(x, z)] === MAP.SE && !M.deck[M.I(x, z)]) return true; } return false; };
  function usePower(c) {
    if (ctx.busy() || ctx.mount()) { if (ctx.mount()) ctx.setMount(null, true); }
    const k = c.uniKind; c.hop = 1; c.face = kid.pos.x >= c.pos.x ? 1 : -1; power = k;
    if (k === 'bos') {                                                     // the woods shake, and mushrooms pop up in a ring around them
      sfx.brush(); let n = 0; for (const t of M.trees) if (TREES.includes(t.kind) && Math.hypot((t.px || t.x + .5) - kid.pos.x, t.z + .5 - kid.pos.z) < 6 && n < 8) { const tt = t; setTimeout(() => tapProp(tt), 120 * n++); }
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, x = kid.pos.x + Math.cos(a) * 1.7, z = kid.pos.z + Math.sin(a) * 1.2; if (!ctx.walkable(Math.floor(x), Math.floor(z))) continue; setTimeout(() => { sfx.pop(); bit(PX.mushroom(), x, 0, z, { g: 0, life: 14, grow: .25 }); }, 300 + i * 110); }
      const t = ctx.nearestWalkable(kid.pos.x + 1.3, kid.pos.z + .6); if (t) setTimeout(() => ctx.extras.dropItem('paddenstoel', 3000, t[0] + .5, t[1] + .5), 1300);   // one real one a day, to keep
      return;
    }
    if (k === 'bloem') { flowerWalk = true; lastBloom = null; sfx.sparkle(); burst(kid.pos, 10, true); for (let i = 0; i < 6; i++) setTimeout(() => plantBloom(kid.pos.x + rnd(-1, 1), kid.pos.z + rnd(-.6, .6)), i * 90); return; }
    if (k === 'regenboog') return slide(c);
    if (k === 'zee') {
      if (!nearSea()) { bubble(c, '', ART.drop()); sfx.bubble(); return; }                                 // not here: the sea is what she needs
      state.extra.power = { look: c.look, kind: k }; save(); sfx.splash(); burst(kid.pos, 10); setTimeout(() => ctx.onEnter && ctx.onEnter('zee'), 600); return;
    }
    if (k === 'ster') { state.extra.power = { look: c.look, kind: k }; save(); sfx.sparkle(); for (let i = 0; i < 12; i++) bit(PX.star(), kid.pos.x + rnd(-.8, .8), .3, kid.pos.z + .1, { vy: rnd(3, 6), g: -1, life: 1.1, scale: .7 }); setTimeout(() => ctx.onEnter && ctx.onEnter('wolken'), 800); }
  }
  function plantBloom(x, z) {
    if (!ctx.walkable(Math.floor(x), Math.floor(z))) return; if (blooms.length > 70) { const o = blooms.shift(); o.bit.life = Math.min(o.bit.life, o.bit.t + .3); }
    const b = { x, z }; blooms.push(b); b.bit = bit(ART.itemArt('bloem', Math.floor(Math.random() * 5)), x, 0, z, { g: 0, life: 40, scale: .7, grow: .3, onEnd: () => { const i = blooms.indexOf(b); if (i >= 0) blooms.splice(i, 1); } });
  }
  /** along a rainbow to somewhere further on, but only where she can walk back from */
  function slide(c) {
    const sx = Math.floor(kid.pos.x), sz = Math.floor(kid.pos.z), ok = (x, z) => ctx.walkable(x, z) || (x === sx && z === sz); let to = null;
    for (let k = 0; k < 40 && !to; k++) {
      const a = (kid.face > 0 ? 0 : Math.PI) + rnd(-1.1, 1.1) + (k > 20 ? Math.PI : 0), d = rnd(8, 13), x = Math.floor(kid.pos.x + Math.cos(a) * d), z = Math.floor(kid.pos.z + Math.sin(a) * d * .7);
      if (M.inb(x, z) && ctx.walkable(x, z) && ctx.astar(sx, sz, x, z, ok, true)) to = [x + .5, z + .5];
    }
    if (!to) { bubble(c, '', PX.rainbow()); sfx.pop(); return; }
    ctx.setBusy(true); sfx.sparkle(); burst(kid.pos, 10, true); sliding = { t: 0, x0: kid.pos.x, z0: kid.pos.z, x1: to[0], z1: to[1], T: 1.5 + Math.hypot(to[0] - kid.pos.x, to[1] - kid.pos.z) * .04 };
  }
  let sliding = null;

  /* ---------------- little jokes ---------------- */
  const pending = [];                                                   // trees with a loose nut, waiting for her to come close
  function bonk(t) {
    const art = NUT[t.kind](); bit(art, kid.pos.x + rnd(-.1, .1), 2.4, kid.pos.z + .06, { g: 9, life: .45 });
    setTimeout(() => {
      sfx.bonk(); kid.hop = .6; bubble(kid, 'Au!'); bit(art, kid.pos.x, 1.2, kid.pos.z + .06, { vx: rnd(1, 1.8) * (Math.random() < .5 ? 1 : -1), vy: 2.5, g: 9, bounce: 2, life: 1.6 });
      for (let i = 0; i < 4; i++) bit(ART.dizzy(), kid.pos.x + Math.cos(i * 1.6) * .35, 1.25, kid.pos.z + .1, { vx: -Math.sin(i * 1.6) * .9, vy: .5, g: .5, life: 1.1 });
    }, 420);
  }
  let kidTaps = [], twirl = 0;
  /** tap her three times quickly and she twirls round */
  function tapKid() { kidTaps = kidTaps.filter(t => now() - t < 1800); kidTaps.push(now()); if (kidTaps.length < 3) return false; kidTaps = []; twirl = .9; sfx.sparkle(); burst(kid.pos, 10, true); return true; }
  /** the little unicorn lets out a big rainbow burp */
  function burp(c) { sfx.burp(); c.hop = 1; bubble(c, 'Boeh!'); for (let i = 0; i < 8; i++) bit(ART.burpBel(i), c.pos.x + c.face * .5 + rnd(-.2, .2), .8, c.pos.z + .1, { vx: c.face * rnd(.2, .7), vy: rnd(.4, .9), g: -.3, sway: rnd(2, 4), life: rnd(1.6, 2.4), scale: rnd(1.2, 1.8) }); }

  /* ---------------- a dip: she hops into the duck pond and stays in, paddling, as long as she likes ----------------
     In the water she is as free as on land: a tap in the water swims her there, a tap on land (or walking against the edge)
     hops her out, dripping. The ducks come to see when she lands with a splash. */
  const WATERS = { vijver: { cx: MAP.POND.cx, cz: MAP.POND.cz, r: Math.min(MAP.POND.rx, MAP.POND.rz), reach: 1.4, swim: Math.min(MAP.POND.rx, MAP.POND.rz) * .7, sink: .38 } };   // only the pond: the fountain is too small to stand in (she vanished behind its rim)
  let inWater = null, dripT = 0, paddleT = 0, wade = 0, sink = .38;
  /* ---------------- the sea: close to the shore it is shallow, and she can swim there like in the pond ----------------
     Shallow = a sea tile with land at most two tiles away (the light band of the sea shader). The open sea is for the boat.
     She only ever swims where every shore within reach is one she could have walked to from where she went in (like a
     landing when flying): a channel next to an island that is still closed is too deep, so the gates stay gates. */
  const SI = M.I, SW = M.W, seaOk = new Uint8Array(M.block.length);
  for (let z = 2; z < MAP.OUT_H - 2; z++) for (let x = 2; x < SW - 2; x++) {
    const i = SI(x, z); if (M.ground[i] !== MAP.SE || M.block[i] !== 1 || M.deck[i]) continue;
    let near = false; for (let dz = -2; dz <= 2 && !near; dz++) for (let dx = -2; dx <= 2; dx++) { if (dx * dx + dz * dz > 4) continue; const j = SI(x + dx, z + dz); if (M.ground[j] !== MAP.SE && !M.deck[j]) { near = true; break; } }
    if (near) seaOk[i] = 1;
  }
  let seaR = null, seaRT = -1e9, seaAllow = null, swimSet = null;
  /** the shallow tiles she may swim in from the land she stands on (or null) */
  function seaAllowed() {
    let kx = Math.floor(kid.pos.x), kz = Math.floor(kid.pos.z);
    if (kz >= MAP.OUT_H || !ctx.fly) return null;
    if (seaR && seaR[SI(kx, kz)] && now() - seaRT < 3000) return seaAllow;
    if (!ctx.walkable(kx, kz)) { const w = ctx.nearestWalkable(kid.pos.x, kid.pos.z); if (!w) return null; [kx, kz] = w; }
    seaR = ctx.fly.reachable(kx, kz, Q.canRide()); seaRT = now();
    const bad = new Uint8Array(seaOk.length), R = 4;                             // around every shore she could not walk to
    for (let z = 0; z < MAP.OUT_H; z++) for (let x = 0; x < SW; x++) if (!seaR[SI(x, z)] && ctx.walkable(x, z)) for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) { const X = x + dx, Z = z + dz; if (X >= 0 && Z >= 0 && X < SW && Z < MAP.OUT_H) bad[SI(X, Z)] = 1; }
    seaAllow = new Uint8Array(seaOk.length); for (let i = 0; i < seaOk.length; i++) seaAllow[i] = seaOk[i] && !bad[i];
    return seaAllow;
  }
  const canSwimAt = (x, z) => { const m = seaAllowed(); return !!m && !!m[SI(Math.floor(x), Math.floor(z))]; };
  /** the swimmable tile nearest to (px, pz) in `set`, within r tiles */
  function nearestIn(set, px, pz, r = 3) {
    const cx = Math.floor(px), cz = Math.floor(pz); let best = null, bd = 1e9;
    for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { const x = cx + dx, z = cz + dz; if (x < 0 || z < 0 || x >= SW || z >= MAP.OUT_H || !set[SI(x, z)]) continue; const d = Math.hypot(x + .5 - px, z + .5 - pz); if (d < bd) { bd = d; best = [x, z]; } }
    return best;
  }
  /** standing on the shore right next to shallow water she may swim in */
  function atShallows() { if (inWater || ctx.mount() || carried || (ctx.toys && ctx.toys.carrying()) || (ctx.keien && ctx.keien.holding())) return false; const m = seaAllowed(); if (!m) return false; const t = nearestIn(m, kid.pos.x, kid.pos.z, 1); return !!t && Math.hypot(t[0] + .5 - kid.pos.x, t[1] + .5 - kid.pos.z) < 1.25; }
  /** the way through the water to (x, z): tile by tile, so she never cuts across a headland */
  function route(kind, x, z) {
    if (kind !== 'zee') return waterAt(x, z) === kind ? [inside(kind, x, z)] : null;
    if (!swimSet) return null; const t = swimSet[SI(Math.floor(x), Math.floor(z))] ? [Math.floor(x), Math.floor(z)] : nearestIn(swimSet, x, z, 6); if (!t) return null;
    const s = [Math.floor(kid.pos.x), Math.floor(kid.pos.z)], p = ctx.astar(s[0], s[1], t[0], t[1], (X, Z) => X >= 0 && Z >= 0 && X < SW && Z < MAP.OUT_H && (!!swimSet[SI(X, Z)] || (X === s[0] && Z === s[1]))); if (!p) return null;
    const out = p.slice(1).map(([X, Z]) => new THREE.Vector3(X + .5, 0, Z + .5));
    if (swimSet[SI(Math.floor(x), Math.floor(z))]) { if (out.length) out[out.length - 1].set(x, 0, z); else out.push(new THREE.Vector3(x, 0, z)); }
    return out.length ? out : null;
  }
  /** the pond or fountain she stands next to (or null) */
  function nearWater() { for (const [k, w] of Object.entries(WATERS)) if (Math.hypot(kid.pos.x - w.cx, kid.pos.z - w.cz) < w.r + w.reach + .4) return k; return null; }
  /** the water she can swim in at (x, z), or null */
  function waterAt(x, z) { for (const [k, w] of Object.entries(WATERS)) if (Math.hypot(x - w.cx, z - w.cz) <= w.swim) return k; if (swimSet && x >= 0 && z >= 0 && swimSet[SI(Math.floor(x), Math.floor(z))]) return 'zee'; return null; }
  /** (x, z) pulled into the water she is in */
  function inside(kind, x, z) { if (kind === 'zee') { const r = route(kind, x, z); return r ? r[r.length - 1] : kid.pos.clone(); } const w = WATERS[kind], dx = x - w.cx, dz = z - w.cz, l = Math.hypot(dx, dz), m = w.swim * .92; return l <= m ? new THREE.Vector3(x, 0, z) : new THREE.Vector3(w.cx + dx / l * m, 0, w.cz + dz / l * m); }
  /** hop into the water (towards (x, z) if given); she lands with a splash and can paddle about */
  function dip(kind, x, z) {
    if (kind === 'zee') return dipSea(x, z);
    const w = WATERS[kind]; if (!w || inWater || ctx.mount() || ctx.busy()) return false;
    if (carried) setDown(); if (ctx.toys && ctx.toys.carrying()) ctx.toys.putDown(true);
    let to; if (x !== undefined && waterAt(x, z) === kind) to = inside(kind, x, z);
    else { const dx = kid.pos.x - w.cx, dz = kid.pos.z - w.cz, l = Math.hypot(dx, dz) || 1; to = new THREE.Vector3(w.cx + dx / l * w.swim * .35, 0, w.cz + dz / l * w.swim * .35); }
    to.jump = true; kid.path = [to]; kid.face = to.x >= kid.pos.x ? 1 : -1; return true;
  }
  /** into the sea: a hop to the shallow water nearest to her, then on through the water to (x, z) if given */
  function dipSea(x, z) {
    if (inWater || ctx.mount() || ctx.busy()) return false; const m = seaAllowed(); if (!m) return false;
    const goal = x !== undefined && m[SI(Math.floor(x), Math.floor(z))];
    const first = goal && Math.hypot(x - kid.pos.x, z - kid.pos.z) < 1.8 ? [Math.floor(x), Math.floor(z)] : nearestIn(m, kid.pos.x + (x !== undefined ? Math.sign(x - kid.pos.x) * .4 : 0), kid.pos.z + (z !== undefined ? Math.sign(z - kid.pos.z) * .4 : 0), 2);
    if (!first || Math.hypot(first[0] + .5 - kid.pos.x, first[1] + .5 - kid.pos.z) > 2.6) return false;
    if (carried) setDown(); if (ctx.toys && ctx.toys.carrying()) ctx.toys.putDown(true);
    swimSet = new Uint8Array(m.length); const q = [SI(...first)]; swimSet[q[0]] = 1;   // the water joined to where she lands
    for (let h = 0; h < q.length; h++) { const i = q[h], X = i % SW, Z = Math.floor(i / SW); for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const j = SI(X + dx, Z + dz); if (m[j] && !swimSet[j]) { swimSet[j] = 1; q.push(j); } } }
    const to = goal && first[0] === Math.floor(x) && first[1] === Math.floor(z) ? new THREE.Vector3(x, 0, z) : new THREE.Vector3(first[0] + .5, 0, first[1] + .5);
    to.jump = true; kid.face = to.x >= kid.pos.x ? 1 : -1;
    let rest = [];
    if (goal && swimSet[SI(Math.floor(x), Math.floor(z))] && (first[0] !== Math.floor(x) || first[1] !== Math.floor(z))) { const s = kid.pos.clone(); kid.pos.copy(to); rest = route('zee', x, z) || []; kid.pos.copy(s); }
    kid.path = [to, ...rest]; return true;
  }
  function bigSplash(x, z, n) { sfx.splash(); setTimeout(sfx.splash, 120); sfx.bubble(); burst(new THREE.Vector3(x, .2, z), 6); for (let i = 0; i < n; i++) bit(ART.drop(), x + rnd(-.3, .3), .2, z + .1, { vx: rnd(-2.6, 2.6), vy: rnd(3, 6.5), g: 10, life: 1.1 }); }
  function landed(kind) {
    bigSplash(kid.pos.x, kid.pos.z, 16); bubble(kid, 'Plons!');
    if (kind === 'vijver') for (const a of animals) if (a.water && !a.fly && !a.held) { a.hop = 1; const p = inside('vijver', kid.pos.x + rnd(-.8, .8), kid.pos.z + rnd(-.5, .5)); a.path = [p]; a.wait = 4; setTimeout(() => bubble(a, 'Kwak kwak!'), 500); }
    if (uni.g.visible) { uni.hop = 1; setTimeout(() => bubble(uni, 'Hihihi!'), 300); }
  }
  function stepWater(dt) {
    const k = ctx.mount() || sliding ? null : waterAt(kid.pos.x, kid.pos.z), jumping = kid.path[0] && kid.path[0].jump;
    if (k && !inWater && !jumping) { inWater = k; landed(k); }                  // landed in it
    else if (!k && inWater) { inWater = null; dripT = 3; setTimeout(() => bubble(kid, 'Hihi! Nat!'), 200); }   // and out again, dripping
    if (!inWater && !jumping && swimSet && !k) swimSet = null;                   // out of the sea: the next dip looks again where she may swim
    if (ctx.mount() || sliding) { wade = 0; return; }
    const was = wade; wade = inWater ? Math.min(1, wade + dt * 5) : Math.max(0, wade - dt * 5);
    if (inWater) sink = inWater === 'zee' ? .4 : WATERS[inWater].sink; if (wade > 0) kid.lift = -sink * wade + (inWater ? Math.sin(performance.now() / 260) * .04 : 0); else if (was > 0) kid.lift = 0;
    if (inWater && kid.moving && (paddleT -= dt) < 0) { paddleT = .28; sfx.bubble(); bit(ART.drop(), kid.pos.x - kid.face * .25, .1, kid.pos.z + .1, { vx: -kid.face * rnd(.5, 1.2), vy: rnd(2, 3), g: 10, life: .6 }); }
  }
  /** she jumps while in the water: a big splash */
  function splashJump() { if (!inWater) return false; kid.hop = .8; kid.hopH = .5; setTimeout(() => { if (inWater) bigSplash(kid.pos.x, kid.pos.z, 10); }, 330); return true; }
  return {
    dispose() { offQ(); }, nearWater, dip, dipping: () => !!inWater, swimming: () => inWater, lift, waterAt, inside, route, canSwimAt, nearSea: atShallows, seaInfo: () => { const m = seaAllowed(); let n = 0; if (m) for (const v of m) n += v; return { allowed: n, swim: swimSet ? swimSet.reduce((a, b) => a + b, 0) : 0 }; }, splashJump, nearMover, tapProp, splash, scare, hold, toss, bit, leaves, fishJump, tapAnimal, setDown, throwIt, grabNear, stones, carrying: () => carried, jumped, tapKid, burp, plantBloom, friends: () => friends.slice(), hitAt, paint, fetching: () => fetch && fetch.kind, sliding: () => !!sliding,
    info: () => ({ birds: birds.filter(b => b.state === 'sit').length, flying: birds.filter(b => b.state === 'flee').length, bits: bits.length, fish: jumps.length, friends: friends.map(c => c.name), napping: animals.filter(a => a.nap > 0).map(a => a.name), pending: pending.length, power, blooms: blooms.length }),
    update(dt, time, active) {
      stepWater(dt);
      if (dripT > 0) { dripT -= dt; if (Math.random() < dt * 9) bit(ART.drop(), kid.pos.x + rnd(-.25, .25), rnd(.4, 1), kid.pos.z + .1, { vx: 0, vy: 0, g: 6, life: .5 }); }   // dripping wet
      // her footsteps, for the friends to walk in
      if (!steps.length || Math.hypot(kid.pos.x - steps[0].x, kid.pos.z - steps[0].z) > .12) { steps.unshift({ x: kid.pos.x, z: kid.pos.z }); if (steps.length > 120) steps.pop(); }
      const lead = (ctx.uni.g.visible && ctx.mount() !== 'uni' ? 2.9 : 1.6);
      friends.forEach((c, i) => {
        if (c.held || c.fly || c.swim || c.cart || c.nap > 0) return;
        const far = Math.hypot(c.pos.x - kid.pos.x, c.pos.z - kid.pos.z);
        if (ctx.fly && ctx.fly.on()) return;                                      // she is up in the sky: they wait, and catch up after she lands
        if (far > 9 && !ctx.busy()) { const t = ctx.nearestWalkable(kid.pos.x - kid.face * 1.2, kid.pos.z + .6); if (t) { burst(c.pos, 5); c.pos.set(t[0] + .5, 0, t[1] + .5); burst(c.pos, 6); sfx.sparkle(); } return; }   // left behind (the boat, a jump): a little magic and it is back
        const p = stepAt(lead + i * 1.05), before = c.pos.clone();
        if (p && ctx.walkable(Math.floor(p.x), Math.floor(p.z))) { const dx = p.x - c.pos.x, dz = p.z - c.pos.z, d = Math.hypot(dx, dz), v = Math.min(d, dt * 5.5); if (d > .02) { c.pos.x += dx / d * v; c.pos.z += dz / d * v; } }
        const mv = c.pos.distanceTo(before), ddx = c.pos.x - before.x; c.moving = mv > .003; if (Math.abs(ddx) > .01 && Math.abs(ddx) > mv * .35) c.face = ddx > 0 ? 1 : -1;
      });
      for (const a of animals) if (a.morning && a.nap > 0 && dist(a) < 2.4) { a.morning = false; wake(a); bubble(a, a.say[0]); }   // still asleep this morning: she wakes it as she walks by
      for (const a of animals) if (a.nap > 0) {                                  // napping: on its side, little z's
        a.path = []; a.moving = false; a.mesh.rotation.z = a.face * 1.3; a.wait = Math.max(a.wait, 1);
        if ((a.zT -= dt) < 0) { a.zT = .9; bit(ART.zzz(), a.pos.x + .2, .6, a.pos.z + .1, { vx: .3, vy: .5, g: -.2, sway: 2, life: 1.3, scale: .8 }); }
        if ((a.nap -= dt) <= 0) wake(a);
      }
      for (let i = pending.length - 1; i >= 0; i--) { const t = pending[i]; if (t.bonkUntil < now()) { pending.splice(i, 1); continue; } if (active && Math.hypot(kid.pos.x - (t.px || t.x + .5), kid.pos.z - (t.z + .5)) < 1.7) { pending.splice(i, 1); bonk(t); } }
      stepFetch(dt);
      for (let i = friends.length - 1; i >= 0; i--) if (!animals.includes(friends[i])) friends.splice(i, 1);   // the meadow was set up anew (a new unicorn came home)
      if (flowerWalk && active && !ctx.mount()) { if (!lastBloom || Math.hypot(kid.pos.x - lastBloom.x, kid.pos.z - lastBloom.z) > .75) { lastBloom = { x: kid.pos.x, z: kid.pos.z }; plantBloom(kid.pos.x + rnd(-.25, .25), kid.pos.z + .15); } }
      if (sliding) {                                                             // down the rainbow
        const s = sliding; s.t += dt; const k = Math.min(1, s.t / s.T), e = k * k * (3 - 2 * k);
        kid.pos.set(s.x0 + (s.x1 - s.x0) * e, 0, s.z0 + (s.z1 - s.z0) * e); kid.lift = Math.sin(k * Math.PI) * 3.2; kid.face = s.x1 >= s.x0 ? 1 : -1;
        for (let j = 0; j < 2; j++) bit(PX.gridSprite(3, 2, () => PX.RAINBOW[Math.floor(Math.random() * 6)], { outline: false, key: 'rb' + j }), kid.pos.x, kid.lift + .3, kid.pos.z + .05, { g: 0, life: 1.4, vy: 0 });
        if (k >= 1) { sliding = null; kid.lift = 0; ctx.placeAt(s.x1, s.z1); ctx.setBusy(false); kid.hop = 1; sfx.boing(); burst(kid.pos, 12, true); }
      }
      if (ctx.toys) for (const c of friends) { const col = ctx.toys.paintAt(c.pos.x, c.pos.z); if (col) paint(c, col); }   // her friends walk through the paint behind her
      if (twirl > 0) { twirl -= dt; kid.face = Math.floor(twirl * 11) % 2 ? 1 : -1; if (twirl <= 0) kid.hop = .6; }
      for (const c of stones) { if (c.fly) stepFlight(c, dt); if (c.back > 0 && (c.back -= dt) <= 0) { c.pos.set(c.home0[0], 0, c.home0[1]); c.g.visible = true; c.hop = 1; burst(c.pos, 4); sfx.pop(); } c.ghost.visible = !c.held; }
      if (carried && carried.stone && ctx.mount()) setDown();
      if (carried && ctx.mount() === 'fiets') { const c = carried; carried = null; c.held = false; c.lift = 0; c.mesh.rotation.z = 0; ctx.play.tapAnimal(c); }
      else if (carried && (ctx.mount() || (ctx.toys && ctx.toys.carrying()))) setDown();
      if (carried) { const c = carried; c.pos.set(kid.pos.x, 0, kid.pos.z + .1); c.face = kid.face;   // just in front of her spot (she sorts at +.06), so it is drawn over her head, not behind it
      c.lift = Math.min(1.02, c.lift + dt * 5); c.mesh.rotation.z = Math.sin(time * 5) * .1; }
      for (const a of animals) if (a.fly) stepFlight(a, dt); else if (a.held && a !== carried) a.mesh.rotation.z = Math.sin(time * 18) * .18;
      for (const a of animals) {
        if (a.ghost) a.ghost.visible = !a.cart && !a.held && !a.swim;
        if (!a.swim) continue; const s = a.swim, dx = s.x - a.pos.x, dz = s.z - a.pos.z, d = Math.hypot(dx, dz), wetNow = [MAP.SE, MAP.WA].includes(groundAt(a.pos.x, a.pos.z));
        if (Math.abs(dx) > .05) a.face = dx > 0 ? 1 : -1; a.lift = wetNow ? -.2 + Math.sin(time * 7) * .04 : 0; a.mesh.rotation.z = wetNow ? Math.sin(time * 6) * .1 : 0;   // paddling, head above the water
        if (wetNow && (s.rip -= dt) < 0) { s.rip = .45; bit(ART.drop(), a.pos.x - a.face * .3, .05, a.pos.z + .1, { vx: -a.face * .8, vy: 1.6, g: 8, life: .45 }); sfx.bubble(); }
        if (d < .08) { a.swim = null; a.lift = 0; a.mesh.rotation.z = 0; a.hop = 1; a.wait = 1.5; a.path = []; (sfx[a.sound] || sfx.pop)(); for (let i = 0; i < 6; i++) bit(ART.drop(), a.pos.x + rnd(-.2, .2), .5, a.pos.z + .1, { vx: rnd(-1.6, 1.6), vy: rnd(1, 2.6), g: 9, life: .6 }); }   // out, and a good shake
        else { const v = Math.min(d, dt * 2.1); a.pos.x += dx / d * v; a.pos.z += dz / d * v; }
      }
      // birds: peck around, take off when she comes close, come back when it is quiet again
      for (let i = birds.length - 1; i >= 0; i--) {
        const b = birds[i]; b.t += dt;
        if (b.state === 'sit') {
          const hopY = Math.max(0, Math.sin(b.t * 3 + i)) > .96 ? .08 : 0; if (Math.floor(b.t * .4 + i) % 5 === 0 && Math.floor(b.t * .4 + i) !== Math.floor((b.t - dt) * .4 + i)) b.dir = -b.dir;
          b.m.position.set(b.pos.x, hopY, b.pos.z); b.m.scale.setScalar(.9); frame(b, 'sit');
          if (active && Math.hypot(b.pos.x - kid.pos.x, b.pos.z - kid.pos.z) < 1.7) { flee(b, kid.pos.x, kid.pos.z); sfx.whoosh(); }
        } else if (b.state === 'flee') {
          b.pos.x += b.vx * dt; b.pos.z += b.vz * dt; b.y += dt * (2.2 + b.t * 1.5); frame(b, Math.floor(b.t * 9) % 2 ? 'up' : 'down');
          b.m.position.set(b.pos.x, b.y, b.pos.z); b.m.scale.setScalar(Math.max(.05, .9 * (1 - b.t / 2.2)));
          if (b.t > 2.2) { if (b.temp) { scene.remove(b.m); b.m.material.dispose(); birds.splice(i, 1); continue; } b.state = 'away'; b.t = 0; b.m.visible = false; b.wait = rnd(7, 14); }
        } else if (b.state === 'away') {
          if (b.t > b.wait && Math.hypot(b.home.x - kid.pos.x, b.home.z - kid.pos.z) > 4) { b.state = 'back'; b.t = 0; b.m.visible = true; b.dir = Math.random() < .5 ? 1 : -1; }
        } else {                                                                     // 'back': glide down to where it sat
          const k = Math.min(1, b.t / 1.3), e = 1 - k; b.pos.copy(b.home); b.y = 0;
          b.m.position.set(b.home.x - b.dir * e * 4, e * e * 3.2, b.home.z - e * 1.5); b.m.scale.setScalar(.9 * (.3 + .7 * k)); frame(b, Math.floor(b.t * 9) % 2 ? 'up' : 'down');
          if (k >= 1) { b.state = 'sit'; b.t = 0; }
        }
      }
      // butterflies: flutter around their flowers, and around her when she walks by
      for (const f of flies) {
        const near = Math.hypot(f.home.x - kid.pos.x, f.home.z - kid.pos.z); if (near < 3.5 && near > .4) { f.home.x += (kid.pos.x - f.home.x) * dt * .8; f.home.z += (kid.pos.z - f.home.z) * dt * .8; }
        const a = time * f.sp + f.p; f.m.position.set(f.home.x + Math.cos(a) * f.r, .7 + Math.sin(a * 2.3) * .3, f.home.z + Math.sin(a * 1.3) * f.r * .6); f.m.scale.set(.55 * Math.max(.15, Math.abs(Math.sin(time * 13 + f.p))), .55, 1);
      }
      // fish: one jumps somewhere near her now and then
      fishT -= dt; if (active && fishT < 0) { fishT = rnd(14, 24); for (let k = 0; k < 12; k++) { const x = kid.pos.x + rnd(-9, 9), z = kid.pos.z + rnd(-6, 6); if (groundAt(x, z) === MAP.SE && groundAt(x + 1.5, z) === MAP.SE && groundAt(x - 1.5, z) === MAP.SE && groundAt(x, z - 1) === MAP.SE && !M.deck[M.I(Math.floor(x), Math.floor(z))]) { fishJump(x, z, true); break; } } }                    // now and then, and without a sound: the sea is alive, but it does not shout
      for (let i = jumps.length - 1; i >= 0; i--) {
        const j = jumps[i]; j.t += dt * 1.25; const k = j.t;
        j.m.position.set(j.x + j.dir * (k - .5) * 1.3, Math.sin(k * Math.PI) * 1.1 - .15, j.z); j.m.rotation.z = j.dir * (.9 - k * 1.8); j.m.scale.set(-j.dir, 1, 1);
        if (k >= 1) { if (!j.quiet) { burst(new THREE.Vector3(j.m.position.x, -.4, j.z), 3); sfx.bubble(); } scene.remove(j.m); jumps.splice(i, 1); }
      }
      // leaves, apples, stars
      for (let i = bits.length - 1; i >= 0; i--) {
        const b = bits[i]; b.t += dt; b.vy -= b.g * dt; const p = b.m.position; p.x += (b.vx + (b.sway ? Math.sin(b.t * b.sway) * .6 : 0)) * dt; p.y += b.vy * dt; p.z += b.vz * dt; b.m.rotation.z += b.spin * dt;
        if (p.y < 0) { p.y = 0; if (b.bounce > 0) { b.bounce--; b.vy = -b.vy * .45; } else { b.vy = 0; b.g = 0; b.sway = 0; b.spin = 0; } }
        if (b.t > b.life - .3) b.m.scale.setScalar(Math.max(.01, (b.life - b.t) / .3) * (b.scale || 1));
        else if (b.grow && b.t < b.grow) { const k = b.t / b.grow; b.m.scale.setScalar(Math.max(.01, (1 + Math.sin(k * Math.PI) * .3) * k * (b.scale || 1))); }   // pops up out of the ground
        else if (b.grow) b.m.scale.setScalar(b.scale || 1);
        if (b.t >= b.life) { scene.remove(b.m); bits.splice(i, 1); if (b.onEnd) b.onEnd(); }
      }
    },
  };
}
