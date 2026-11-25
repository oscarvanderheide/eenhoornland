// Every animal has its own way of saying hello, and something more if she keeps playing. Two animals per island, each
// with a little story (Oscar: fewer animals, each more interesting). A tap shows it (the first time; the next tap
// picks it up, unless the tap itself is the game). Nothing here asks for attention: an animal only does its thing when
// somebody taps it, and whatever it does it does the same way every time.
//   dorp     hondje: rolls over and wags; every third hello it digs, and once a day a coin comes up (else an old boot)
//            kip: flutters up and leaves an egg; a chick comes out and follows her       (eendjes dive in the pond)
//   bos      egel: rolls up into a ball; a tap bowls it, and what it bumps into shakes
//            uil: asleep in the daytime; a tap: one eye, oehoe; a tap while awake: stars twinkle round its head
//            eekhoorn: up the treehouse oak like a flash, waves from the platform and tosses her an acorn; a tap while it is
//            up there: another one (with a coin in it, once a day)
//   wei      schaap: every tap fluffs it up more, until poof, the wool floats away and it grows back
//            hertje: shy; stand still and it comes to nuzzle her, and flowers come up around them
//            otter: a dive into the waterfall pool, then it floats on its back with a shell; a tap then: it cracks it open
//   strand   krab: a sideways dance, then into the sand; while it dances it copies her jumps
//            meeuw: dives into the sea and brings her a fish
//   eiland   konijn: down its hole, up out of another one; tap it while it peeks out and it pops up laughing
//            flamingo: up on one leg, wobbling; a tap while it stands like that: all the flamingos dance, one after the other
//            papegaai: flies onto her shoulder and rides along, and repeats every sound she makes
//   kasteel  pauw: fans out its tail; every tap changes its colour
//            draakje: tries to roar: a smoke ring, another one, and the third time a little flame: fireworks
import * as PX from './pixel.js';
import * as ART from './art.js';
import * as AW from './art-ways.js';
import * as WILD from './art-wild.js';
import * as MAP from './map.js';
import * as Q from './quest.js';
import { sfx } from './audio.js';

export function createWays(ctx) {
  const { THREE, scene, M, makeSprite, bubble, burst, kid, animals } = ctx;
  const rnd = (a, b) => a + Math.random() * (b - a), now = () => performance.now(), v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const bit = (...a) => ctx.life.bit(...a);
  const dist = (c, x = kid.pos.x, z = kid.pos.z) => Math.hypot(c.pos.x - x, c.pos.z - z);
  const texs = new Map(), texOf = cv => { if (!texs.has(cv)) texs.set(cv, ctx.tex(cv)); return texs.get(cv); };
  const sound = c => (sfx[c.sound] || sfx.pop)();

  /** show another picture on a character for a while (`null` puts its own back) */
  function wear(c, art) {
    if (!c.own) c.own = { texs: c.texs, geom: c.mesh.geometry };
    if (!art) { c.texs = c.own.texs; c.mesh.geometry = c.own.geom; c.own = null; c.mesh.material.map = null; c.setFrame('idle'); return; }
    const hd = ART.hd(art), t = texOf(hd), tf = texOf(PX.flipX(hd)); c.texs = { idle: t, w1: t, w2: t, idleF: tf, w1F: tf, w2F: tf };
    c.mesh.geometry = ctx.spriteGeom(hd.width / 2, hd.height / 2); if (c.ghost) c.ghost.geometry = c.mesh.geometry; c.mesh.material.map = null; c.setFrame('idle');
  }
  const tileNear = (x, z, r0, r1, home) => {
    for (let k = 0; k < 40; k++) {
      const a = rnd(0, Math.PI * 2), d = rnd(r0, r1), tx = Math.floor(x + Math.cos(a) * d), tz = Math.floor(z + Math.sin(a) * d * .7);
      if (!ctx.walkable(tx, tz)) continue; if (home && (tx < home[0] - 1 || tx > home[2] + 1 || tz < home[1] - 1 || tz > home[3] + 1)) continue; return [tx + .5, tz + .5];
    }
    return null;
  };
  /** an arc from where it is to (x, z): a leap, a flight */
  const leapTo = (c, x, z, T = .7, H = 1) => { c.way.leap = { x0: c.pos.x, z0: c.pos.z, x1: x, z1: z, t: 0, T, H }; if (Math.abs(x - c.pos.x) > .05) c.face = x > c.pos.x ? 1 : -1; };
  function stepLeap(c, dt) {
    const l = c.way.leap; if (!l) return true; l.t += dt; const k = Math.min(1, l.t / l.T);
    c.pos.set(l.x0 + (l.x1 - l.x0) * k, 0, l.z0 + (l.z1 - l.z0) * k); c.lift = Math.sin(k * Math.PI) * l.H + (l.y0 || 0) * (1 - k) + (l.y1 || 0) * k;
    if (k >= 1) { c.way.leap = null; return true; } return false;
  }
  const floaty = [];   // things that drift up and grow: smoke rings, tufts of wool
  function drift(art, x, y, z, o = {}) { const m = makeSprite(art, { lean: .2, shadow: false, scale: o.s0 || .6 }); m.position.set(x, y, z); scene.add(m); floaty.push(Object.assign({ m, t: 0, life: 2.4, vx: 0, vy: .5, s0: .6, s1: 1.4, sway: 0 }, o)); }

  /* ---------------- the ways, one per kind of animal ---------------- */
  // each `start(c)` sets c.way = { kind, t, ... }; `step(c, dt)` runs it and returns true when it is over.
  // `again(c)`: what a tap does while it is still going (or soon after); return false to let the tap pick it up.
  const holes = [];
  function hole(x, z) { const m = makeSprite(AW.hol(), { lean: 1.45, shadow: false, scale: .8 }); m.position.set(x, .02, z + .05); scene.add(m); holes.push({ m, t: 0 }); while (holes.length > 2) scene.remove(holes.shift().m); }
  const chicks = [];
  const OAK = [MAP.ZIP.from[0] + .35, MAP.ZIP.from[1] + .12], TOP = 2.75;
  function acorn(c, gift) {                                                      // tossed down from the platform to her feet
    const tx = kid.pos.x + rnd(-.3, .3), tz = kid.pos.z + .15, T = .8;
    bit(WILD.eikel(), c.pos.x, TOP + .3, c.pos.z + .05, { vx: (tx - c.pos.x) / T, vz: (tz - c.pos.z) / T, vy: 2.2, g: 9, bounce: 1, life: 1.6, spin: 6 });
    setTimeout(() => { sfx.pop(); kid.hop = .5; if (gift && Q.giftOnce('eekhoorn', 'munt')) { sfx.chime(5); bit(ART.coin(), tx, .4, tz, { vy: 2.4, g: 1.5, life: 1, spin: 9 }); } else bubble(kid, '', WILD.eikel()); }, T * 1000);
  }
  const POOL = MAP.FALLS.pool;
  const W = {
    Flamingo: {   // up on one leg, wobble wobble; a tap while it stands like that and the whole flock dances in turn
      start(c) { c.way = { kind: 'been', t: 0 }; wear(c, WILD.flamingo(1)); sfx.pop(); c.hop = .4; c.hopH = .15; },
      step(c, dt) { const w = c.way; w.t += dt; c.mesh.rotation.z = Math.sin(w.t * 7) * .06 * (w.dance ? 2.5 : 1); if (w.dance && Math.floor(w.t * 2.5) !== w.beat && w.t < 3) { w.beat = Math.floor(w.t * 2.5); c.hop = 1; c.hopH = .35; c.face = -c.face; } if (w.t < (w.dance ? 3.4 : 2.6)) return false; c.mesh.rotation.z = 0; wear(c, null); return true; },
      again(c) {
        if (c.way.dance) return true; const flock = animals.filter(a => a.name === 'Flamingo' && a.g.visible && !a.held && !a.fly);
        flock.forEach((a, i) => setTimeout(() => { if (!a.way) W.Flamingo.start(a); a.way.dance = true; a.way.t = 0; sfx.chime([0, 2, 4, 7][i % 4]); if (i === flock.length - 1) setTimeout(() => { sfx.tada(); for (const b of flock) burst(b.pos, 4, true); }, 900); }, i * 260));
        return true;
      },
      repeat: true,
    },
    Otter: {    // splash into the pool, float round on its back with a shell on its tummy, and back onto the bank
      start(c) { const side = c.pos.x < POOL.cx ? -1 : 1; c.way = { kind: 'otter', t: 0, home: [c.pos.x, c.pos.z] }; wear(c, WILD.otter(2)); sfx.squeak(); leapTo(c, POOL.cx + side * 1.6, POOL.cz - .1, .55, .9); },
      step(c, dt) {
        const w = c.way; w.t += dt;
        if (w.t < .6) { stepLeap(c, dt); return false; }
        if (!w.in) { w.in = true; sfx.splash(); for (let i = 0; i < 6; i++) bit(ART.drop(), c.pos.x + rnd(-.3, .3), .2, c.pos.z + .1, { vx: rnd(-1.4, 1.4), vy: rnd(2, 3.5), g: 9, life: .6 }); wear(c, WILD.otter(1)); c.lift = -.04; w.x0 = c.pos.x; }
        if (w.t < 5) { c.pos.x = w.x0 + Math.sin((w.t - .6) * 1.1) * .45; c.face = Math.cos((w.t - .6) * 1.1) > 0 ? 1 : -1; c.lift = -.04 + Math.sin(w.t * 3) * .03; return false; }
        if (!w.out) { w.out = true; wear(c, WILD.otter(0)); c.lift = 0; const to = tileNear(POOL.cx, POOL.cz + 2.6, 0, 1.5, c.home) || w.home; leapTo(c, to[0], to[1], .55, .8); sfx.splash(); }
        return stepLeap(c, dt) ? (wear(c, null), true) : false;
      },
      again(c) { const w = c.way; if (!w.in || w.out || w.cracked) return true; w.cracked = true; w.t = Math.min(w.t, 3.4); c.hop = 1; c.hopH = .3; sfx.click(); setTimeout(() => { sfx.click(); burst(c.pos, 6, true); if (Q.giftOnce('otter', 'munt')) { sfx.chime(5); bit(ART.coin(), c.pos.x, .4, c.pos.z + .1, { vy: 2.6, g: 1.5, life: 1, spin: 9 }); } }, 300); return true; },
      repeat: true,
    },
    Eekhoorn: {   // dashes to the oak, scurries up the trunk, waves from the treehouse and tosses down an acorn; then back down
      start(c) { c.way = { kind: 'eek', t: 0, home: [c.pos.x, c.pos.z] }; wear(c, WILD.eekhoorn(1)); sfx.squeak(); leapTo(c, OAK[0], OAK[1], .5, .5); },
      step(c, dt) {
        const w = c.way; w.t += dt;
        if (w.t < .55) { stepLeap(c, dt); return false; }
        if (w.t < 1.35) { c.lift = TOP * (w.t - .55) / .8; c.sq = [1, 1]; if (!w.up) { w.up = true; sfx.squeak(); } return false; }   // up the trunk
        if (w.t < 3.4) { c.lift = TOP; if (!w.top) { w.top = true; wear(c, WILD.eekhoorn(0)); c.face = kid.pos.x > c.pos.x ? 1 : -1; c.hop = 1; c.hopH = .25; setTimeout(() => acorn(c, false), 300); } return false; }
        if (w.t < 4.1) { if (!w.down) { w.down = true; wear(c, WILD.eekhoorn(1)); } c.lift = TOP * (1 - (w.t - 3.4) / .7); return false; }
        if (!w.back) { w.back = true; c.lift = 0; const to = tileNear(OAK[0], OAK[1] + 1.5, 1, 2.5, c.home) || w.home; leapTo(c, to[0], to[1], .5, .5); }
        if (!stepLeap(c, dt)) return false;
        wear(c, null); c.lift = 0; return true;
      },
      again(c) { const w = c.way; if (!w.top || w.down || w.second) return true; w.second = true; w.t = Math.min(w.t, 2.2); c.hop = 1; sfx.squeak(); setTimeout(() => acorn(c, true), 250); return true; },
      repeat: true,
    },
    Konijn: {   // down its hole, up out of another one a little further
      start(c) { c.way = { kind: 'hol', t: 0 }; c.hop = 1; sfx.boing(); hole(c.pos.x, c.pos.z); c.way.to = tileNear(c.pos.x, c.pos.z, 2, 4, c.home); },
      step(c, dt) {
        const w = c.way; w.t += dt;
        if (w.t < .7) { c.sq = [1, Math.max(.02, 1 - Math.max(0, w.t - .25) / .45)]; if (w.t > .3 && !w.dust) { w.dust = true; for (let i = 0; i < 5; i++) bit(PX.gridSprite(2, 2, () => '#A9784F', { outline: false, key: 'aarde' }), c.pos.x + rnd(-.3, .3), .1, c.pos.z + .1, { vx: rnd(-1.5, 1.5), vy: rnd(2, 3.5), g: 10, life: .7 }); } return false; }
        if (!w.moved) { w.moved = true; c.g.visible = false; if (w.to) { c.pos.set(w.to[0], 0, w.to[1]); hole(c.pos.x, c.pos.z); } }
        if (w.t > 1.6 && !w.peek) { w.peek = makeSprite(AW.konijnKop(), { lean: .3, shadow: false, scale: .9 }); w.peek.position.set(c.pos.x, 0, c.pos.z + .06); scene.add(w.peek); sfx.pop(); }
        if (w.peek) { w.peek.scale.set(.9, .9 * Math.min(1, (w.t - 1.6) * 3), 1); w.peek.position.y = w.t > 2.4 && w.t < 2.9 ? .02 * Math.abs(Math.sin(w.t * 50)) : 0; }   // up it comes, and the nose twitches
        if (w.t < 3.1) return false;
        if (w.peek) scene.remove(w.peek); c.g.visible = true; c.sq = null; c.hop = 1; c.hopH = w.found ? 1.1 : .6; sfx.boing(); if (w.found) bubble(c, '', PX.heart()); return true;
      },
      again(c) {   // caught peeking out: it pops up laughing, hearts, and is ready for another round
        const w = c.way; if (!w.peek || w.found) return true;
        w.found = true; w.t = 3.1; sfx.chime(5); burst(c.pos, 8, true); return true;
      },
      repeat: true,
    },
    Hondje: {   // rolls right over, then sits and wags. Every third hello it digs instead: a coin once a day, else an old boot
      start(c) { c.hellos = (c.hellos || 0) + 1; if (c.hellos % 3 === 0) { c.way = { kind: 'graaf', t: 0 }; sound(c); return; } c.way = { kind: 'rol', t: 0 }; c.hop = 1; c.hopH = .5; sfx.boing(); },
      step(c, dt) {
        const w = c.way; w.t += dt;
        if (w.kind === 'graaf') {
          c.sq = [1, 1 + Math.sin(w.t * 26) * .08]; c.face = Math.floor(w.t * 3) % 2 ? 1 : -1;
          if (Math.random() < dt * 14) { sfx.brush(); bit(PX.gridSprite(2, 2, () => '#A9784F', { outline: false, key: 'aarde' }), c.pos.x - c.face * .3, .15, c.pos.z + .1, { vx: -c.face * rnd(1, 2.5), vy: rnd(1.5, 3), g: 10, life: .6 }); }
          if (w.t > 1.6 && !w.found) { w.found = true; c.sq = null; c.hop = 1; const coin = Q.giftOnce('hondmunt', 'munt'); sfx[coin ? 'tada' : 'boing'](); bit(coin ? ART.coin() : ART.laars(), c.pos.x, .3, c.pos.z + .15, { vy: 4, g: 9, bounce: 1, life: 1.6 }); bubble(c, '!'); if (coin) burst(c.pos, 8, true); }
          return w.t > 2.6;
        }
        const k = Math.min(1, w.t / .8);
        c.mesh.rotation.z = -c.face * k * Math.PI * 2;
        if (k >= 1) { c.mesh.rotation.z = 0; if (!w.wag) { w.wag = true; sound(c); bubble(c, '', PX.heart()); } c.sq = [1 + Math.sin(w.t * 30) * .05, 1]; }
        if (w.t < 2.2) return false; c.sq = null; return true;
      },
    },
    Kip: {      // flutters up, feathers everywhere, and once a day there is an egg where she sat. A chick comes out of it
      start(c) {
        c.way = { kind: 'ei', t: 0 }; c.hop = 1; c.hopH = .8; sfx.pop(); setTimeout(sfx.pop, 140);
        for (let i = 0; i < 4; i++) bit(ART.feather(), c.pos.x + rnd(-.3, .3), .7, c.pos.z + .1, { vx: rnd(-.6, .6), vy: rnd(.6, 1.4), g: .6, sway: rnd(2, 4), life: rnd(1.6, 2.4), spin: rnd(-2, 2), scale: .7 });
        if (c.eggDay !== Q.quest.day && !chicks.some(h => h.hen === c)) { c.eggDay = Q.quest.day; const e = { hen: c, x: c.pos.x, z: c.pos.z, t: 0, m: makeSprite(AW.kipEi(), { lean: .3, scale: 1.1 }) }; e.m.position.set(e.x, 0, e.z + .02); scene.add(e.m); chicks.push(e); leapTo(c, c.pos.x + c.face * .8, c.pos.z, .45, .5); }
      },
      step(c, dt) { c.way.t += dt; stepLeap(c, dt); return c.way.t > .6; },
    },
    Eendje: {   // a dive in the pond, bubbles, and up again with a shake
      start(c) { c.way = { kind: 'duik', t: 0 }; sfx.splash(); },
      step(c, dt) {
        const w = c.way; w.t += dt; const k = Math.min(1, w.t / .25), back = Math.max(0, Math.min(1, (w.t - 1.6) / .25));
        c.sq = [1 + .15 * k * (1 - back), Math.max(.02, 1 - .98 * k * (1 - back))];   // down it goes, under the water
        if (w.t > .3 && w.t < 1.6 && Math.random() < dt * 5) { bit(ART.drop(), c.pos.x + rnd(-.2, .2), .05, c.pos.z + .1, { vy: rnd(.6, 1.2), g: 2, life: .5, scale: .6 }); if (Math.random() < .4) sfx.bubble(); }
        if (w.t > 1.6 && !w.up) { w.up = true; sfx.pop(); bubble(c, 'Kwak!'); for (let i = 0; i < 6; i++) bit(ART.drop(), c.pos.x + rnd(-.2, .2), .4, c.pos.z + .1, { vx: rnd(-1.5, 1.5), vy: rnd(1, 2.5), g: 9, life: .6 }); }
        if (w.t < 1.9) return false; c.sq = null; c.hop = 1; return true;
      },
    },
    Hertje: { far: true,   // shy: if she rushes up it leaps away; if she stands still it comes to nuzzle her (see `update` too)
      start(c) {
        c.way = { kind: 'hert', t: 0 };
        if (ctx.mount()) { const to = tileNear(c.pos.x, c.pos.z, 2.5, 4, c.home); if (to) leapTo(c, to[0], to[1], .9, 1.1); sfx.whoosh(); c.way.shy = true; }
        else nuzzle(c);
      },
      step(c, dt) {
        const w = c.way; w.t += dt; if (w.shy) return stepLeap(c, dt);
        if (w.walk) { const d = dist(c); const dx = kid.pos.x - c.pos.x, dz = kid.pos.z - c.pos.z, v = Math.min(d - .9, dt * 1.2), nx = c.pos.x + dx / d * v, nz = c.pos.z + dz / d * v;
        if (d > .95 && w.t < 9 && ctx.walkable(Math.floor(nx), Math.floor(nz))) { c.pos.x = nx; c.pos.z = nz; c.moving = true; c.face = dx > 0 ? 1 : -1; return false; } w.walk = false; w.at = w.t; c.moving = false; if (d > 2.2) return true; c.face = kid.pos.x >= c.pos.x ? 1 : -1; kid.face = -c.face; sfx.purr(); bubble(c, '', PX.heart()); burst(c.pos, 5, true);
          const mx = (c.pos.x + kid.pos.x) / 2, mz = (c.pos.z + kid.pos.z) / 2; for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; setTimeout(() => { ctx.life.plantBloom(mx + Math.cos(a) * 1.1, mz + Math.sin(a) * .7 + .1); if (i % 2) sfx.chime(i); }, 300 + i * 140); } }   // flowers come up all around them
        const u = w.t - w.at; c.mesh.rotation.z = -c.face * Math.max(0, Math.sin(u * 4)) * .12;   // nuzzles her
        return u > 2.4;
      },
    },
    Egel: {     // curls up into a ball; a tap on the ball rolls it away; after a while it peeks out and uncurls
      start(c) { c.way = { kind: 'bal', t: 0, quiet: 0 }; wear(c, AW.egelBal()); c.squash = .6; sfx.pop(); },
      step(c, dt) {
        const w = c.way; w.t += dt; w.quiet += dt;
        const r = w.roll; if (r) { r.t += dt; const k = Math.min(1, r.t / r.T), e = 1 - (1 - k) ** 2; const x = r.x0 + (r.x1 - r.x0) * e, z = r.z0 + (r.z1 - r.z0) * e; c.pos.set(x, 0, z); c.mesh.rotation.z -= r.dir * dt * 9 * (1 - k); if (k >= 1) { w.roll = null; c.mesh.rotation.z = 0; ctx.life.hitAt(c.pos.x + r.dir * .6, c.pos.z); } }
        if (w.quiet < 5.5) return false; wear(c, null); c.mesh.rotation.z = 0; c.hop = 1; bubble(c, 'Snuf snuf!'); sound(c); return true;
      },
      again(c) {
        const w = c.way; w.quiet = 0; const dir = c.pos.x >= kid.pos.x ? 1 : -1; let to = null;
        for (const d of [2.6, 1.8, 1]) { const x = c.pos.x + dir * d, z = c.pos.z + rnd(-.4, .4); if (ctx.walkable(Math.floor(x), Math.floor(z))) { to = [x, z]; break; } }
        if (!to) { c.squash = .8; sfx.boing(); ctx.life.hitAt(c.pos.x + dir * .8, c.pos.z); return true; }   // bonk: whatever it bumps into shakes
        w.roll = { x0: c.pos.x, z0: c.pos.z, x1: to[0], z1: to[1], t: 0, T: .9, dir }; sfx.whoosh(); return true;
      },
      repeat: true,
    },
    Uil: {      // asleep in the daytime: a tap opens its eyes, it turns its head right round, says oehoe and dozes off again
      start(c) { c.way = { kind: 'uil', t: 0 }; wear(c, null); c.hop = 1; sfx.hoot(); bubble(c, 'Oehoe!'); },
      again(c) { const w = c.way; w.t = Math.min(w.t, 1.6); c.hop = 1; sfx.hoot(); sfx.sparkle(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; bit(PX.sparkle(i % 2 ? '#FFF3A8' : '#FFFFFF'), c.pos.x + Math.cos(a) * .45, .9 + Math.sin(a) * .3, c.pos.z + .12, { vx: -Math.sin(a) * .8, vy: Math.cos(a) * .5, g: 0, life: 1.2 }); } return true; },
      repeat: true,
      step(c, dt) { const w = c.way; w.t += dt; if (w.t > .5 && w.t < 1.5) c.face = Math.floor(w.t * 6) % 2 ? 1 : -1; if (w.t < 3) return false; if (ctx.night() < .5) { wear(c, AW.uilSlaap()); bit(ART.zzz(), c.pos.x + .2, .7, c.pos.z + .1, { vx: .3, vy: .5, g: -.2, sway: 2, life: 1.3, scale: .8 }); } return true; },
    },
    Schaap: {   // every tap makes the wool fluffier; on the fifth, poof: it floats off in tufts and the sheep is all skinny. It grows back
      start(c) { c.way = { kind: 'wol', t: 0 }; this.again(c); },
      step(c, dt) { const w = c.way; w.t += dt; return w.t > 6; },
      again(c) {
        c.way.t = 0; c.fluff = (c.fluff || 0) + 1; c.hop = 1; c.hopH = .25;
        if (c.fluff < 5) { c.wool = 1 + c.fluff * .12; c.squash = .35; sfx.boing(); if (c.fluff === 4) bubble(c, 'Bèèè?'); return true; }
        c.fluff = 0; c.wool = .78; c.squash = 1; sfx.whoosh(); setTimeout(sfx.sparkle, 200); bubble(c, 'Bèèè!');
        for (let i = 0; i < 9; i++) drift(AW.wol(i), c.pos.x + rnd(-.5, .5), rnd(.3, .9), c.pos.z + .1, { vx: rnd(-.5, .5), vy: rnd(.35, .7), life: rnd(3, 4.5), s0: .7, s1: 1.1, sway: rnd(1, 2) });
        return true;
      },
      repeat: true,
    },
    Krab: {     // a little sideways dance (click clack), then it digs itself into the sand. A tap gets it out again
      start(c) { c.way = { kind: 'krab', t: 0, x0: c.pos.x }; },
      step(c, dt) {
        const w = c.way; w.t += dt;
        if (w.t < 1.8) { const s = Math.floor(w.t * 4); if (s !== w.s) { w.s = s; sfx.click(); c.hop = .4; c.hopH = .12; } c.pos.x = w.x0 + Math.sin(w.t * Math.PI * 2.2) * .35; return false; }
        if (!w.dug) { w.dug = true; c.pos.x = w.x0; wear(c, AW.krabZand()); sfx.brush(); for (let i = 0; i < 6; i++) bit(PX.gridSprite(2, 2, () => '#F3DFA6', { outline: false, key: 'zand' }), c.pos.x + rnd(-.3, .3), .1, c.pos.z + .1, { vx: rnd(-1.6, 1.6), vy: rnd(2, 3), g: 10, life: .6 }); }
        return w.t > (w.out || 40) || (w.t > 4 && dist(c) > 7 && (w.out = w.t, true));
      },
      again(c) { const w = c.way; if (!w.dug) return true; w.out = w.t; return true; },
      end(c) { if (c.own) { wear(c, null); c.hop = 1; sfx.pop(); bubble(c, 'Klik klak!'); for (let i = 0; i < 5; i++) bit(PX.gridSprite(2, 2, () => '#F3DFA6', { outline: false, key: 'zand' }), c.pos.x + rnd(-.3, .3), .2, c.pos.z + .1, { vx: rnd(-1.6, 1.6), vy: rnd(2, 3), g: 10, life: .6 }); } },
      repeat: true,
    },
    Meeuw: { far: true,    // flies out over the sea, dives, and brings her a fish (one a day for her bag; after that it eats the fish itself)
      start(c) {
        let sea = null; for (let r = 2; r < 13 && !sea; r++) for (let k = 0; k < 24 && !sea; k++) { const a = k / 24 * Math.PI * 2, x = Math.floor(c.pos.x + Math.cos(a) * r), z = Math.floor(c.pos.z + Math.sin(a) * r); if (M.inb(x, z) && M.ground[M.I(x, z)] === MAP.SE && !M.deck[M.I(x, z)]) sea = [x + .5, z + .5]; }
        c.way = { kind: 'vis', t: 0, sea, from: [c.pos.x, c.pos.z] }; sound(c); bubble(c, 'Kraa!');
        if (sea) { leapTo(c, sea[0], sea[1], .6 + Math.hypot(sea[0] - c.pos.x, sea[1] - c.pos.z) * .1, 2); c.way.leap.y1 = 0; } else c.hop = 1;
      },
      step(c, dt) {
        const w = c.way; w.t += dt; if (!w.sea) return w.t > .6;
        if (w.phase === undefined) { c.mesh.rotation.z = Math.sin(w.t * 14) * .2; if (!stepLeap(c, dt)) return false; w.phase = 0; ctx.life.splash(c.pos.x, c.pos.z); c.g.visible = false; w.at = w.t; }
        if (w.phase === 0 && w.t - w.at > .6) { w.phase = 1; c.g.visible = true; c.lift = 0; sfx.splash(); leapTo(c, kid.pos.x - kid.face * .9, kid.pos.z + .1, .8 + Math.hypot(kid.pos.x - c.pos.x, kid.pos.z - c.pos.z) * .1, 2.2); w.fish = makeSprite(ART.fish(1), { lean: .2, shadow: false, scale: .6 }); scene.add(w.fish); }
        if (w.phase === 1) {
          c.mesh.rotation.z = Math.sin(w.t * 14) * .2; if (w.fish) w.fish.position.set(c.pos.x + c.face * .35, (c.lift || 0) + .35, c.pos.z + .12);
          if (!stepLeap(c, dt)) return false; c.mesh.rotation.z = 0; w.phase = 2; w.at = w.t; c.face = kid.pos.x >= c.pos.x ? 1 : -1; scene.remove(w.fish); w.fish = null;
          if (Q.giftOnce('meeuwvis', 'vis')) { sfx.chime(3); bubble(kid, '', ART.fish(1)); burst(kid.pos, 6, true); }
          else { sfx.munch(); bubble(c, 'Hap!'); }
        }
        return w.phase === 2 && w.t - w.at > 1;
      },
    },
    Papegaai: { far: true, // flies onto her shoulder and rides along, flapping when she jumps. A tap on it (or on her) sends it home
      start(c) { c.way = { kind: 'schouder', t: 0, on: false }; sound(c); bubble(c, 'Hallo hallo!'); leapTo(c, kid.pos.x, kid.pos.z + .12, .8, 1.6); c.way.leap.y1 = 1.05; },
      step(c, dt) {
        const w = c.way; w.t += dt; if (w.kind === 'heen') { c.mesh.rotation.z = Math.sin(w.t * 16) * .15; if (!stepLeap(c, dt)) return false; c.mesh.rotation.z = 0; return true; }
        if (!w.on) { c.mesh.rotation.z = Math.sin(w.t * 16) * .15; c.way.leap && (c.way.leap.x1 = kid.pos.x - kid.face * .28, c.way.leap.z1 = kid.pos.z + .12); if (!stepLeap(c, dt)) return false; w.on = true; c.mesh.rotation.z = 0; sfx.pop(); }
        c.pos.set(kid.pos.x - kid.face * .28, 0, kid.pos.z + .12); c.lift = 1.02 + (kid.mesh.position.y || 0); c.face = kid.face;
        if (w.home || ctx.mount() || ctx.busy() || M.zone[M.I(Math.floor(kid.pos.x), Math.floor(kid.pos.z))] !== 'eiland') {   // home it flies (it lives on the island)
          const t = ctx.randomTile(c); c.way = { kind: 'heen', t: 0 }; leapTo(c, t[0] + .5, t[1] + .5, 1, 1.4); c.way.leap.y0 = c.lift; c.lift = 0; c.way.home = true; sound(c);
        }
        return false;
      },
      again(c) { if (c.way.kind === 'schouder' && c.way.on) c.way.home = true; return true; },
      repeat: true,
    },
    Pauw: {     // the tail goes up in a big fan of eyes; it turns to show both sides; after a while it folds it again
      start(c) { c.way = { kind: 'staart', t: 0, n: 0 }; wear(c, null); c.squash = .8; sfx.sparkle(); burst(c.pos, 6); },
      step(c, dt) { const w = c.way; w.t += dt; if (w.t > 1 && w.t < 2.6) c.face = Math.floor((w.t - 1) / .8) % 2 ? 1 : -1; if (w.t < 5) return false; wear(c, AW.pauwDicht()); c.squash = .4; sfx.brush(); c.mesh.material.color.set('#FFFFFF'); return true; },
      again(c) { const w = c.way; w.t = Math.min(w.t, 1); w.n++; c.squash = .5; sfx.chime(w.n % 8); burst(c.pos, 4); c.mesh.material.color.set(PX.mix(PX.RAINBOW[w.n % 6], '#FFFFFF', .35)); return true; },   // every tap: a new colour
      repeat: true,
    },
    Draakje: {  // tries to roar, and out comes a smoke ring. Then another. The third time, a little sneeze of sparks
      start(c) { c.way = { kind: 'rook', t: 0, n: 0 }; this.again(c); },
      step(c, dt) { c.way.t += dt; return c.way.t > 2.5; },
      again(c) {
        const w = c.way; w.t = 0; w.n++; c.hop = 1; c.hopH = .2; c.squash = .5;
        if (w.n % 3) { sfx.whoosh(); drift(AW.rookring(), c.pos.x + c.face * .5, .75, c.pos.z + .1, { vx: c.face * .25, vy: .55, life: 2.8, s0: .8, s1: 2.4 }); }
        else {   // a real little flame! up it goes, and pops into fireworks
          sfx.whoosh(); bubble(c, '!'); const x = c.pos.x + c.face * .4, z = c.pos.z + .1; bit(PX.sparkle('#FF9E6B'), x, .8, z, { vy: 5, g: 0, life: .7 });
          setTimeout(() => { sfx.tada(); for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; bit(PX.sparkle(PX.RAINBOW[i % 6]), x, 4.2, z, { vx: Math.cos(a) * 2.2, vy: Math.sin(a) * 2.2, g: 1.5, life: rnd(1, 1.6) }); } c.hop = 1; c.hopH = .6; }, 700);
        }
        return true;
      },
      repeat: true,
    },
  };
  // at rest: the peacock keeps its tail down, the owl sleeps in the daytime
  for (const c of animals) { if (c.name === 'Pauw') wear(c, AW.pauwDicht()); }
  const owl = animals.find(a => a.name === 'Uil'); let owlAwake = null;
  function syncOwl() { if (!owl || owl.way) return; const awake = ctx.night() > .5; if (awake === owlAwake) return; owlAwake = awake; wear(owl, awake ? null : AW.uilSlaap()); }

  function nuzzle(c) { c.way = { kind: 'hert', t: 0, walk: true }; sfx.pop(); }

  /** the parrot on her shoulder says it again: the sound she just made, a moment later, with a little note */
  function echo(play) {
    const p = animals.find(a => a.name === 'Papegaai' && a.way && a.way.kind === 'schouder' && a.way.on); if (!p) return;
    setTimeout(() => { if (!p.way || !p.way.on) return; play(); p.hop = .5; bit(ART.note(Math.floor(rnd(0, 3))), p.pos.x, 1.6, p.pos.z + .1, { vy: .6, g: 0, sway: 2, life: 1, scale: .7 }); }, 450);
  }
  let kidHop = 0;
  /** a tap on an animal (she is next to it): its own way. false = nothing special, so it is picked up */
  function tap(c) {
    if (c.name !== 'Papegaai') echo(() => sound(c));
    const w = W[c.name]; if (!w || c.uniKind || c.friend) return false;
    if (c.way) { if (w.again) return w.again(c); return true; }                    // still busy with its thing
    if (!w.repeat && c.wayAt && now() - c.wayAt < 6000) return false;              // a second tap: picked up, as always
    c.path = []; c.moving = false; c.face = kid.pos.x >= c.pos.x ? 1 : -1; c.wayAt = now(); w.start(c); return true;
  }
  function end(c) {
    const w = W[c.name]; if (w && w.end) w.end(c); c.way = null; c.wayAt = now(); c.wait = 2; c.sq = null; c.g.visible = true;
    if (!ctx.walkable(Math.floor(c.pos.x), Math.floor(c.pos.z)) && !c.water) { const t = ctx.nearestWalkable(c.pos.x, c.pos.z); if (t) { c.pos.set(t[0] + .5, 0, t[1] + .5); c.hop = 1; } }   // off a tree trunk, out of the sea: onto the nearest free spot
  }
  /** something else needs it (picked up, thrown, it went home): stop at once and put its own picture back */
  function stop(c) { if (!c.way) return; const w = c.way; if (w.peek) scene.remove(w.peek); if (w.fish) scene.remove(w.fish); c.way = null; c.sq = null; c.g.visible = true; c.wayAt = now(); wear(c, rest(c)); }
  /** the picture it has when it is doing nothing: the peacock's tail down, the owl asleep in the daytime */
  const rest = c => c.name === 'Pauw' ? AW.pauwDicht() : c === owl && !owlAwake ? AW.uilSlaap() : null;

  const offQ = Q.on(type => { if (type === 'day') { for (const h of chicks) { scene.remove(h.m); if (h.chick) scene.remove(h.chick); } chicks.length = 0; for (const c of animals) if (c.name === 'Schaap') { c.fluff = 0; c.wool = 1; } } });
  let still = 0, deerCool = 0;

  return {
    tap, stop, busy: c => !!c.way, far: c => !!(W[c.name] && W[c.name].far && !c.friend && !c.uniKind),
    dispose() { offQ(); for (const h of holes) scene.remove(h.m); for (const f of floaty) scene.remove(f.m); for (const h of chicks) { scene.remove(h.m); if (h.chick) scene.remove(h.chick); } },
    info: () => ({ ways: animals.filter(a => a.way).map(a => a.name + ':' + a.way.kind), chicks: chicks.filter(h => h.chick).length, eggs: chicks.filter(h => !h.chick).length, holes: holes.length, wool: animals.filter(a => a.name === 'Schaap').map(a => +(a.wool || 1).toFixed(2)), owl: owl ? (owlAwake ? 'awake' : 'asleep') : null }),
    update(dt, time, active) {
      syncOwl();
      for (const c of animals) if (c.way) { if (c.held || c.fly || c.swim || c.cart) { stop(c); continue; } if (W[c.name].step(c, dt)) end(c); }
      // the sheep's wool grows back slowly after a shearing; a fluffed up sheep slowly settles
      for (const c of animals) if (c.name === 'Schaap') { const d = 1 - (c.wool || 1); if (!c.way && d) { c.wool += Math.sign(d) * Math.min(Math.abs(d), dt * (d > 0 ? .012 : .02)); if (c.wool === 1) c.fluff = 0; } c.baseScale = c.wool || 1; }
      // chicks: the egg wobbles, cracks and a chick hops out; then it toddles after its mother
      for (const h of chicks) {
        h.t += dt;
        if (!h.chick) { h.m.rotation.z = h.t > 3 ? Math.sin(h.t * 18) * .15 * Math.min(1, h.t - 3) : 0; if (h.t > 5 && !h.cracked) { h.cracked = true; const t = texOf(AW.kipEi(1)); h.m.material.map = t; h.m.material.emissiveMap = t; sfx.pop(); }
          if (h.t > 6.5) { scene.remove(h.m); h.chick = makeSprite(AW.kuiken(0), { lean: .3, scale: .8 }); h.chick.material = h.chick.material.clone(); h.cx = h.x; h.cz = h.z; h.chick.position.set(h.x, 0, h.z); scene.add(h.chick); sfx.sparkle(); burst(v3(h.x, 0, h.z), 6, true); h.hop = 1; }
          continue; }
        const hen = h.hen, tx = hen.pos.x - hen.face * .55, tz = hen.pos.z + .08, dx = tx - h.cx, dz = tz - h.cz, d = Math.hypot(dx, dz), on = hen.g.visible && !hen.held && !hen.fly;
        if (on && d > .15) { const v = Math.min(d, dt * Math.max(.8, d * 1.6)); h.cx += dx / d * v; h.cz += dz / d * v; h.walk = (h.walk || 0) + dt; } else h.walk = 0;
        h.hop = Math.max(0, (h.hop || 0) - dt * 3); const f = h.walk ? Math.floor(h.walk * 8) % 2 : 0;
        const art = AW.kuiken(f), t = texOf(art); if (h.chick.material.map !== t) { h.chick.material.map = t; h.chick.material.emissiveMap = t; }
        h.chick.position.set(h.cx, Math.sin(h.hop * Math.PI) * .3, h.cz); h.chick.scale.x = (dx < -.01 ? -1 : dx > .01 ? 1 : Math.sign(h.chick.scale.x) || 1) * .8;
      }
      // smoke rings and wool: drift up, grow, fade
      for (let i = floaty.length - 1; i >= 0; i--) { const f = floaty[i]; f.t += dt; const k = f.t / f.life; f.m.position.x += (f.vx + (f.sway ? Math.sin(f.t * f.sway) * .3 : 0)) * dt; f.m.position.y += f.vy * dt; f.m.scale.setScalar((f.s0 + (f.s1 - f.s0) * k) * (k > .8 ? (1 - k) / .2 : 1)); if (k >= 1) { scene.remove(f.m); floaty.splice(i, 1); } }
      // she jumps: a dancing crab jumps along, the parrot on her shoulder says boing too
      if (kid.hop > .8 && kidHop <= .8) {
        echo(() => sfx.boing());
        for (const c of animals) if (c.name === 'Krab' && c.way && !c.way.dug && dist(c) < 4) { c.way.t = Math.min(c.way.t, .9); setTimeout(() => { c.hop = 1; c.hopH = .55; sfx.click(); }, 180); }
      }
      kidHop = kid.hop;
      // the deer: stand still near it for a while and it comes to say hello by itself (only the deer; only now and then)
      const deer = animals.find(a => a.name === 'Hertje');
      if (deer && active && !deer.way && !deer.held && !deer.fly && !deer.friend && deer.g.visible) {
        if (!kid.moving && !ctx.mount() && dist(deer) < 4.5 && dist(deer) > 1.2) still += dt; else still = 0;
        if (still > 3.5 && now() > deerCool) { still = 0; deerCool = now() + 90000; deer.path = []; deer.wayAt = now(); nuzzle(deer); }
      }
    },
  };
}
