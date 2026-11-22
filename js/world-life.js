// What makes the world feel alive, all of it just for fun: animals you can pick up and throw, birds that fly off when
// you come near or when the scarecrow is shaken, trees and bushes that shake when tapped (leaves, an apple, a startled
// bird), butterflies that follow you, fish that jump out of the sea. Nothing here is saved or needed for anything.
// world.js hands over the same toolbox (ctx) as for world-extras.js.
import * as PX from './pixel.js';
import * as ART from './art.js';
import * as MAP from './map.js';
import * as Q from './quest.js';
import { sfx } from './audio.js';

const TREES = ['tree', 'pine', 'apple', 'oak', 'palm', 'rainbowtree'], BUSHES = ['bush', 'hedge', 'rose', 'fern'];
const WHEE = ['Wiiii!', 'Joehoe!', 'Nog een keer!', 'Hihihi!', 'Hoppa!'];

export function createLife(ctx) {
  const { THREE, scene, M, tex, makeSprite, burst, bubble, kid, animals } = ctx;
  const rnd = (a, b) => a + Math.random() * (b - a), now = () => performance.now();
  const groundAt = (x, z) => M.inb(Math.floor(x), Math.floor(z)) ? M.ground[M.I(Math.floor(x), Math.floor(z))] : MAP.SE;

  /* ---------------- little things that fall or float: leaves, apples, notes ---------------- */
  const bits = [];
  function bit(art, x, y, z, o = {}) {
    const m = makeSprite(art, { lean: .3, shadow: false, scale: o.scale || 1 }); m.position.set(x, y, z); scene.add(m);
    bits.push(Object.assign({ m, vx: 0, vy: 0, vz: 0, g: 6, life: 1.6, sway: 0, bounce: 0, spin: 0, t: 0 }, o));
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
      if (k === 'apple') {                                                            // one real apple a day falls out of every apple tree, to keep
        const idx = 1000 + M.trees.indexOf(t), ax = x + rnd(-.45, .45), spot = ctx.nearestWalkable(ax, z + 1);
        if (spot && t.gave !== Q.quest.day && !(Q.quest.picked.appel || []).includes(idx)) { t.gave = Q.quest.day; bit(PX.apple(), spot[0] + .5, 1.2, spot[1] + .5, { g: 9, bounce: 1, life: .75 }); setTimeout(() => ctx.extras.dropItem('appel', idx, spot[0] + .5, spot[1] + .55), 700); }
        else bit(ART.leaf(2), ax, 1.2, z + .2, { g: 4, sway: 3, life: 1.6 });
      }
      if (k === 'rainbowtree') burst(new THREE.Vector3(x, .9, z), 8, true);
      if (Math.random() < .4) { const b = addBird(x + rnd(-.4, .4), z, Math.floor(rnd(0, 3)), true); b.pos.y = b.y = 1.2 * t.sc; flee(b, x + rnd(-1, 1), z + 1); sfx.whoosh(); }
      return;
    }
    if (BUSHES.includes(k)) { ctx.wobble(t, .3); sfx.brush(); leaves(x, z, 3, .5); return; }
    if (k === 'statue') { ctx.wobble(t, .08); sfx.sparkle(); burst(new THREE.Vector3(x, .6, z), 8); return; }
    ctx.wobble(t, k === 'rock' ? .1 : .3); sfx.pop();
  }

  /* ---------------- picking animals up and throwing them ---------------- */
  function hold(c) { c.held = true; c.fly = null; c.path = []; c.lift = .9; sfx.pop(); bubble(c, '!'); }
  function toss(c, vx, vz) {
    const sp = Math.hypot(vx, vz), max = 9, f = sp > max ? max / sp : 1;
    c.held = false; c.fly = { vx: vx * f, vz: vz * f, vy: 5.5, h: c.lift || .9, spin: (vx >= 0 ? -1 : 1) * (4 + sp), bounces: 0 }; if (Math.abs(vx) > .2) c.face = vx > 0 ? 1 : -1;
    sfx.whoosh(); bubble(c, WHEE[Math.floor(Math.random() * WHEE.length)]);
  }
  function stepFlight(c, dt) {
    const f = c.fly; f.vy -= 12 * dt; f.h += f.vy * dt;
    c.pos.x = THREE.MathUtils.clamp(c.pos.x + f.vx * dt, 2, M.W - 2); c.pos.z = THREE.MathUtils.clamp(c.pos.z + f.vz * dt, 2, M.H - 2);
    c.lift = Math.max(0, f.h); c.mesh.rotation.z += f.spin * dt;
    if (f.h > 0) return;
    const tx = Math.floor(c.pos.x), tz = Math.floor(c.pos.z);
    if (!ctx.walkable(tx, tz)) {                                                   // in the water, on a roof, in a tree: bounce on to the nearest free spot
      const g = groundAt(c.pos.x, c.pos.z), wet = g === MAP.SE || g === MAP.WA; if (wet) { sfx.splash(); burst(new THREE.Vector3(c.pos.x, -.3, c.pos.z), 6); } else sfx.boing();
      const t = ctx.nearestWalkable(c.pos.x, c.pos.z) || ctx.randomTile(c), T = .65;
      f.vx = (t[0] + .5 - c.pos.x) / T; f.vz = (t[1] + .5 - c.pos.z) / T; f.vy = 12 * T / 2; f.h = .01; return;
    }
    if (f.bounces < 2 && Math.abs(f.vy) > 2) { f.bounces++; f.vy = -f.vy * .45; f.vx *= .5; f.vz *= .5; f.h = .01; sfx.boing(); return; }
    c.fly = null; c.lift = 0; c.mesh.rotation.z = 0; c.hop = 1; c.lost = true; c.wait = 1.5; c.path = [];
    (sfx[c.sound] || sfx.pop)(); burst(c.pos, 5, true); for (let i = 0; i < 3; i++) bit(ART.dizzy(), c.pos.x + rnd(-.3, .3), 1, c.pos.z + .1, { vx: rnd(-.8, .8), vy: 1.2, g: 2, life: 1 });
  }

  return {
    dispose() { }, tapProp, splash, scare, hold, toss, bit, leaves, fishJump,
    info: () => ({ birds: birds.filter(b => b.state === 'sit').length, flying: birds.filter(b => b.state === 'flee').length, bits: bits.length, fish: jumps.length }),
    update(dt, time, active) {
      for (const a of animals) if (a.fly) stepFlight(a, dt); else if (a.held) a.mesh.rotation.z = Math.sin(time * 18) * .18;
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
        if (b.t >= b.life) { scene.remove(b.m); bits.splice(i, 1); }
      }
    },
  };
}
