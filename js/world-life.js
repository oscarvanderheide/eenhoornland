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

const TREES = ['tree', 'pine', 'apple', 'oak', 'palm', 'rainbowtree'], BUSHES = ['bush', 'hedge', 'rose', 'fern'];
const NUT = { tree: ART.eikel, oak: ART.eikel, pine: ART.dennenappel, palm: ART.kokosnoot };
const WHEE = ['Wiiii!', 'Joehoe!', 'Nog een keer!', 'Hihihi!', 'Hoppa!'];

export function createLife(ctx) {
  const { THREE, scene, M, tex, makeSprite, burst, bubble, kid, animals } = ctx;
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
    ctx.wobble(t, k === 'rock' ? .1 : .3); sfx.pop();
  }

  /* ---------------- picking animals up and throwing them ---------------- */
  function hold(c) { if (carried === c) carried = null; c.swim = null; c.held = true; c.fly = null; c.path = []; c.lift = .9; sfx.pop(); bubble(c, '!'); }
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
    if (carried) return throwIt(); let best = null, bd = 1.9;
    for (const c of movers()) { if (!c.g.visible || c.fly || c.cart || c.swim || c.isUni || c.dog) continue; const d = dist(c); if (d < bd) { bd = d; best = c; } }
    if (!best) return false; lift(best); return true;
  }
  function tapAnimal(c) {
    if (c.fly || c.cart || c.swim) return; if (carried === c) return void throwIt();
    if (c.uniKind) return tapHerd(c);                                                                  // an old unicorn from the meadow: she comes along
    c.path = []; c.wait = 8; c.hop = 1; c.face = kid.pos.x >= c.pos.x ? 1 : -1;                       // it waits for her
    // with what it likes in her bag she gives it that first (once a day); after that a tap lifts it, as always
    const food = Q.FAVOURITE[c.name], give = food && !c.friend && c.fedDay !== Q.quest.day && Q.have(food) > 0, act = give ? () => feed(c, food) : () => lift(c);
    if (dist(c) < 1.8) return act();
    const then = () => { if (dist(c) < 3.6) act(); };
    if (ctx.approach(Math.floor(c.pos.x), Math.floor(c.pos.z), then, true)) return;
    const t = ctx.nearestWalkable(c.pos.x, c.pos.z); if (!t || !ctx.walkThen(t[0], t[1], then)) (sfx[c.sound] || sfx.pop)();
  }
  function toss(c, vx, vz) {
    const sp = Math.hypot(vx, vz), max = 9, f = sp > max ? max / sp : 1;
    c.held = false; c.fly = { vx: vx * f, vz: vz * f, vy: 5.5, h: c.lift || .9, spin: (vx >= 0 ? -1 : 1) * (4 + sp), bounces: 0 }; if (Math.abs(vx) > .2) c.face = vx > 0 ? 1 : -1;
    sfx.whoosh(); if (!c.stone) bubble(c, WHEE[Math.floor(Math.random() * WHEE.length)]);
  }
  function stepFlight(c, dt) {
    const f = c.fly; f.vy -= 12 * dt; f.h += f.vy * dt;
    c.pos.x = THREE.MathUtils.clamp(c.pos.x + f.vx * dt, 2, M.W - 2); c.pos.z = THREE.MathUtils.clamp(c.pos.z + f.vz * dt, 2, M.H - 2);
    c.lift = Math.max(0, f.h); c.mesh.rotation.z += f.spin * dt;
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
    if (f.bounces < 2 && Math.abs(f.vy) > 2) { f.bounces++; f.vy = -f.vy * .45; f.vx *= .5; f.vz *= .5; f.h = .01; sfx.boing(); return; }
    if (c.stone) { c.fly = null; c.lift = 0; c.mesh.rotation.z = 0; sfx.pop(); for (const a of animals) if (!a.held && !a.fly && !a.cart && !a.swim && Math.hypot(a.pos.x - c.pos.x, a.pos.z - c.pos.z) < 1.6) a.hop = 1; fetchStone(c); return; }   // thud: whoever stands there jumps (and the dog runs to get it)
    const st = Q.sandAt(tx, tz); if (st >= 0) { Q.stompSand(tx, tz); burst(c.pos, 6); }   // landed on a sand tower: flat
    const col = ctx.toys && ctx.toys.paintAt(c.pos.x, c.pos.z); if (col) paint(c, col);
    c.fly = null; c.lift = 0; c.mesh.rotation.z = 0; c.hop = 1; c.lost = true; c.wait = 1.5; c.path = [];
    (sfx[c.sound] || sfx.pop)(); burst(c.pos, 5, true); for (let i = 0; i < 3; i++) bit(ART.dizzy(), c.pos.x + rnd(-.3, .3), 1, c.pos.z + .1, { vx: rnd(-.8, .8), vy: 1.2, g: 2, life: 1 });
    // thrown three times in a short while: it is so dizzy it falls over and has a little nap right there
    c.thrown = (c.thrown || []).filter(t => now() - t < 25000); c.thrown.push(now());
    if (c.thrown.length >= 3 && !c.isUni) { c.thrown = []; c.nap = 5; c.zT = .6; c.wait = 6; bubble(c, 'Zzz...'); }
  }
  function wake(c) { c.nap = 0; c.mesh.rotation.z = 0; c.hop = 1; c.wait = 1; (sfx[c.sound] || sfx.pop)(); }

  /* ---------------- friends: given what it likes, an animal walks along behind her for the rest of the day ---------------- */
  // the trail of her own footsteps, newest first: friends walk in it, one behind the other, behind the unicorn
  const friends = [], steps = [], gifts = [];
  function feed(c, food) {
    if (!Q.giveFood(food)) return lift(c);
    c.fedDay = Q.quest.day; c.wait = 99; c.path = []; kid.hop = .5; kid.face = c.pos.x >= kid.pos.x ? 1 : -1;
    const m = makeSprite(ART.itemIcon(food), { lean: .3, shadow: false, scale: .8 }); m.position.set(kid.pos.x, .9, kid.pos.z + .1); scene.add(m);
    gifts.push({ m, c, t: 0, x: kid.pos.x, z: kid.pos.z, food }); sfx.whoosh();
  }
  /** something to wear for the rest of the day, drawn on top of its own sprite (the hedgehog carries the apple on its spikes) */
  function wearOn(c, art, fx, fy) {
    const base = c.frames.idle, it = ART.hd(art), ix = Math.round(base.width * fx - it.width / 2), iy = Math.round(base.height * fy - it.height), up = Math.max(0, -iy);
    const cv = document.createElement('canvas'); cv.width = base.width; cv.height = base.height + up; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
    x.drawImage(base, 0, up); x.drawImage(it, ix, iy + up); cv.isHD = true;
    for (const k in c.texs) c.texs[k].dispose(); c.texs = {}; c.frames = { idle: cv, w1: cv, w2: cv };
    for (const k of ['idle', 'w1', 'w2']) { c.texs[k] = ctx.tex(cv); if (c.flippable) c.texs[k + 'F'] = ctx.tex(PX.flipX(cv)); }
    c.mesh.geometry = ctx.spriteGeom(cv.width / 2, cv.height / 2); if (c.ghost) c.ghost.geometry = c.mesh.geometry; c.mesh.material.map = null; c.setFrame('idle');
  }
  const DRESS = { Egel: [() => ART.appeltje(), .5, .42], Krab: [() => ART.shell(1), .5, .3] };
  function befriend(c, food) {
    sfx.munch(); c.hop = 1; burst(c.pos, 8, true); bubble(c, '', PX.heart());
    if (DRESS[c.name] && !c.dressed) { c.dressed = true; const [a, fx, fy] = DRESS[c.name]; wearOn(c, a(), fx, fy); }
    if (c.name === 'Draakje') setTimeout(() => puff(c), 600);
    if (c.friend) return; c.friend = true; c.wait = 0; c.joined = now(); friends.push(c); makeRoom();
  }
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
  function fetchStone(c) { if (c.held || c.dog || !dog || Math.hypot(dog.pos.x - c.pos.x, dog.pos.z - c.pos.z) > 8) return; startFetch('stone', c); }
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

  return {
    dispose() { offQ(); }, tapProp, splash, scare, hold, toss, bit, leaves, fishJump, tapAnimal, setDown, throwIt, grabNear, stones, carrying: () => carried, jumped, tapKid, burp, feed, friends: () => friends.slice(), hitAt, paint, fetching: () => fetch && fetch.kind, sliding: () => !!sliding,
    info: () => ({ birds: birds.filter(b => b.state === 'sit').length, flying: birds.filter(b => b.state === 'flee').length, bits: bits.length, fish: jumps.length, friends: friends.map(c => c.name), napping: animals.filter(a => a.nap > 0).map(a => a.name), pending: pending.length, power, blooms: blooms.length }),
    update(dt, time, active) {
      // her footsteps, for the friends to walk in
      if (!steps.length || Math.hypot(kid.pos.x - steps[0].x, kid.pos.z - steps[0].z) > .12) { steps.unshift({ x: kid.pos.x, z: kid.pos.z }); if (steps.length > 120) steps.pop(); }
      for (let i = gifts.length - 1; i >= 0; i--) {                              // the food flies from her hands to its mouth
        const g = gifts[i]; g.t += dt * 2.2; const k = Math.min(1, g.t); g.m.position.set(g.x + (g.c.pos.x - g.x) * k, .9 + Math.sin(k * Math.PI) * .9 - k * .4, g.z + (g.c.pos.z - g.z) * k + .1);
        if (g.t >= 1) { scene.remove(g.m); gifts.splice(i, 1); befriend(g.c, g.food); }
      }
      const lead = (ctx.uni.g.visible && ctx.mount() !== 'uni' ? 2.9 : 1.6);
      friends.forEach((c, i) => {
        if (c.held || c.fly || c.swim || c.cart || c.nap > 0) return;
        const far = Math.hypot(c.pos.x - kid.pos.x, c.pos.z - kid.pos.z);
        if (far > 9 && !ctx.busy()) { const t = ctx.nearestWalkable(kid.pos.x - kid.face * 1.2, kid.pos.z + .6); if (t) { burst(c.pos, 5); c.pos.set(t[0] + .5, 0, t[1] + .5); burst(c.pos, 6); sfx.sparkle(); } return; }   // left behind (the boat, a jump): a little magic and it is back
        const p = stepAt(lead + i * 1.05), before = c.pos.clone();
        if (p && ctx.walkable(Math.floor(p.x), Math.floor(p.z))) { const dx = p.x - c.pos.x, dz = p.z - c.pos.z, d = Math.hypot(dx, dz), v = Math.min(d, dt * 5.5); if (d > .02) { c.pos.x += dx / d * v; c.pos.z += dz / d * v; } }
        const mv = c.pos.distanceTo(before), ddx = c.pos.x - before.x; c.moving = mv > .003; if (Math.abs(ddx) > .01 && Math.abs(ddx) > mv * .35) c.face = ddx > 0 ? 1 : -1;
      });
      // an animal that wants something she has: it looks at her and shows what, once in a while when she comes close
      if (active) for (const a of animals) {
        const food = Q.FAVOURITE[a.name]; if (!food || a.friend || a.held || a.fly || a.swim || a.cart || a.fedDay === Q.quest.day || !a.g.visible) continue;
        if (dist(a) < 2.3 && (a.askT || 0) < now()) { a.askT = now() + 30000; a.face = kid.pos.x >= a.pos.x ? 1 : -1; a.hop = 1; bubble(a, '', ART.itemIcon(food)); }
      }
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
