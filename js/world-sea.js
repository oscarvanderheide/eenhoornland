// The open sea between the beach and the rainbow island: things to sail past and to meet on the way. Nothing is needed
// for the adventure. Like everything else, the sea waits for her: the creatures react when the boat comes close.
//   islets      a lighthouse (it shines at night), seals on a sandbank that clap, a palm islet with a chest (a coin a day)
//   dolphins    a pod jumps alongside the boat now and then, out on open water
//   a swimmer   floats in a ring near the pier and waves; a fishing boat with a bear sails its round and toots hello
//   a turtle    swims about and dives when the boat comes too close
//   the arrow   while the little unicorn is hungry, a rainbow arrow by the boat points to the rainbow island
// world.js hands over the same toolbox (ctx) as for world-extras.js; the boat itself is in world-play.js.
import * as ART from './art.js';
import * as MAP from './map.js';
import * as Q from './quest.js';
import { sfx } from './audio.js';

export function createSea(ctx) {
  const { THREE, scene, M, makeSprite, pick, burst, bubble, kid } = ctx;
  const rnd = (a, b) => a + Math.random() * (b - a), v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const say = (pos, text, icon) => bubble({ pos, isUni: false }, text, icon);
  const boat = () => ctx.play.boatAt(), aboard = () => ctx.play.aboard();
  const near = (x, z, d) => { const b = boat(); return Math.hypot(b.x - x, b.z - z) < d; };
  const setArt = (m, art) => { const t = ctx.tex(art); m.material.map = t; m.material.emissiveMap = t; m.material.needsUpdate = true; };
  const sea = (x, z) => M.inb(Math.floor(x), Math.floor(z)) && M.ground[M.I(Math.floor(x), Math.floor(z))] === MAP.SE && !M.deck[M.I(Math.floor(x), Math.floor(z))];

  /* ---------------- the islets ---------------- */
  const seals = [], glows = []; let chest = null, lamp = null;
  for (const it of MAP.ISLETS) {
    if (it.kind === 'vuurtoren') {
      const m = makeSprite(ART.vuurtoren(), { lean: .2, scale: 1.3 }); m.position.set(it.cx, 0, it.cz + .2); scene.add(m);
      lamp = new THREE.Sprite(new THREE.SpriteMaterial({ color: '#FFE9A8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); lamp.scale.set(3, 3, 1); lamp.position.set(it.cx, 3.1, it.cz + .5); scene.add(lamp);
      for (const dx of [-1.4, 1.5]) { const r = makeSprite(ART.propArt('rock', 2), { lean: .3 }); r.position.set(it.cx + dx, 0, it.cz + .6); scene.add(r); }
    } else if (it.kind === 'zeehonden') {
      for (const dx of [-1.6, 0, 1.5]) { const m = makeSprite(ART.hd(ART.zeehond(0)), { lean: .3, scale: .8 }); m.position.set(it.cx + dx, 0, it.cz + .3); if (dx > 0) m.scale.x = -.8; scene.add(m); seals.push({ m, clap: 0, f: 0 }); }
    } else if (it.kind === 'palmeiland') {
      const p = makeSprite(ART.propArt('palm', 3), { lean: .22, scale: 1.3 }); p.position.set(it.cx - .6, 0, it.cz); scene.add(p);
      chest = { m: makeSprite(ART.schatkist(false), { lean: .3 }), x: it.cx + .9, z: it.cz + .5, open: 0 }; chest.m.position.set(chest.x, 0, chest.z); scene.add(chest.m);
    } else { const r = makeSprite(ART.propArt('rock', 1 + Math.floor(it.cx) % 4), { lean: .3, scale: 1.2 }); r.position.set(it.cx, 0, it.cz + .3); scene.add(r); }
  }

  /* ---------------- dolphins ---------------- */
  const pod = [0, 1, 2].map(k => { const m = makeSprite(ART.dolfijn(0), { lean: .15, shadow: false, scale: 1.1 }); m.visible = false; scene.add(m); return { m, k, t: -1 }; });
  let podT = 4;
  function leap() {
    const b = boat(), side = Math.random() < .5 ? 1 : -1, dir = Math.random() < .5 ? 1 : -1, x0 = b.x - dir * 2.5, z0 = b.z + side * 2.2;
    if (![0, 2, 4].every(d => sea(x0 + dir * d, z0))) return false;
    pod.forEach((d, k) => { d.t = -k * .35; d.x0 = x0 - dir * k * .9; d.z0 = z0 + k * .25; d.dir = dir; d.m.scale.x = 1.1 * dir; });
    sfx.whoosh(); setTimeout(() => sfx.splash(), 500); return true;
  }

  /* ---------------- the swimmer, the fishing boat, the turtle ---------------- */
  const swim = { m: makeSprite(ART.zwemmer(0), { lean: .2, shadow: false }), x: 99.5, z: 75.5, wave: 0, saw: false };
  swim.m.position.set(swim.x, -.15, swim.z); scene.add(swim.m); swim.m.userData.alpha = ART.zwemmer(0);
  swim.m.userData.tap = () => { swim.wave = 1.6; sfx.splash(); say(v3(swim.x, 0, swim.z), 'Hihi! Spetter!'); ctx.life.splash(swim.x + .6, swim.z); }; pick.push(swim.m);
  const ROUTE = [[101, 47], [118, 39], [133, 47], [128, 58], [112, 56]];
  const fb = { m: makeSprite(ART.vissersboot(), { lean: .2, shadow: false, scale: 1.4 }), i: 0, x: ROUTE[0][0], z: ROUTE[0][1], dir: 1, cool: 0 };
  fb.m.position.set(fb.x, 0, fb.z); scene.add(fb.m); fb.m.userData.alpha = ART.vissersboot();
  fb.m.userData.tap = () => { sfx.toot(); say(v3(fb.x, .4, fb.z), 'Tuut tuut!'); }; pick.push(fb.m);
  const turtle = { m: makeSprite(ART.schildpad(0), { lean: .25, shadow: false }), x: 124.5, z: 72.5, a: 0, dive: 0 };
  turtle.m.position.set(turtle.x, -.08, turtle.z); scene.add(turtle.m);
  turtle.m.userData.tap = () => { turtle.dive = 4; turtle.moved = false; sfx.bubble(); }; pick.push(turtle.m);

  /* ---------------- the arrow to the rainbow island ---------------- */
  const arrow = makeSprite(ART.pijl(), { lean: Math.PI / 2 - .25, shadow: false, scale: 1.1 }); arrow.visible = false; scene.add(arrow);
  const goal = MAP.BOAT.eiland.moor;

  return {
    info: () => ({ dolphins: pod.filter(d => d.t >= 0 && d.t < 1.3).length, arrow: arrow.visible, seals: seals.filter(s => s.clap > 0).length, fishingBoat: [+fb.x.toFixed(1), +fb.z.toFixed(1)], chest: chest && chest.open > 0 }),
    leap,
    update(dt, time, active) {
      const b = boat(), on = aboard(), moving = on && ctx.play.info().moving || on && ctx.play.driving();
      // dolphins: only out on open water, only while she sails
      if (on && moving && (podT -= dt) < 0) { podT = rnd(7, 12); if (!leap()) podT = 1.5; }
      for (const d of pod) {
        if (d.t < -5) continue; d.t += dt * .8; const k = d.t;
        if (k < 0 || k > 1.3) { d.m.visible = false; if (k > 1.3) d.t = -9; continue; }
        const e = Math.min(1, k); d.m.visible = true; d.m.position.set(d.x0 + d.dir * e * 4.4, -.4 + Math.sin(e * Math.PI) * 1.5, d.z0); d.m.rotation.z = -d.dir * (e - .5) * 1.4;
        setArt(d.m, ART.dolfijn(Math.floor(time * 6 + d.k) % 2));
        if (k > .98 && !d.splashed) { d.splashed = true; ctx.life.splash(d.m.position.x, d.z0); } if (k < .1) d.splashed = false;
      }
      // seals clap when the boat comes by
      const sealNear = near(104, 61, 5.5);
      seals.forEach((s, i) => { if (sealNear && s.clap <= 0 && Math.random() < dt * 2) { s.clap = 1.5; if (i === 1) { sfx.boing(); say(v3(104, 0, 61), 'Ork ork!'); } } if (s.clap > 0) { s.clap -= dt; const f = Math.floor(s.clap * 8) % 2; if (s.f !== f) { s.f = f; setArt(s.m, ART.hd(ART.zeehond(f))); } } else if (s.f) { s.f = 0; setArt(s.m, ART.hd(ART.zeehond(0))); } });
      // the lighthouse shines at night
      if (lamp) lamp.material.opacity = ctx.night() * (.7 + Math.sin(time * 2) * .25);
      // the chest on the palm islet: sail up to it
      if (chest) { if (chest.open > 0 && (chest.open -= dt) <= 0) setArt(chest.m, ART.schatkist(false)); if (on && chest.open <= 0 && near(chest.x, chest.z + 1, 2.8)) { chest.open = 3; setArt(chest.m, ART.schatkist(true)); if (Q.giftOnce('palmkist', 'munt')) { sfx.chime(5); burst(v3(chest.x, .2, chest.z), 8); say(v3(chest.x, 0, chest.z), '', ART.coin()); } else sfx.sparkle(); } }
      // the swimmer waves when the boat comes by
      swim.m.position.y = -.15 + Math.sin(time * 2.2) * .05; swim.m.position.x = swim.x + Math.sin(time * .3) * .6;
      const sw = near(swim.x, swim.z, 4) || Math.hypot(kid.pos.x - swim.x, kid.pos.z - swim.z) < 5;
      if (sw && !swim.saw) { swim.saw = true; swim.wave = 2; say(v3(swim.x, 0, swim.z), 'Hoi!'); } if (!sw) swim.saw = false;
      if (swim.wave > 0) { swim.wave -= dt; setArt(swim.m, ART.zwemmer(Math.floor(swim.wave * 4) % 2)); } else if (swim.wave > -1) { swim.wave = -1; setArt(swim.m, ART.zwemmer(0)); }
      // the fishing boat goes round, and toots when they meet
      { const [tx, tz] = ROUTE[(fb.i + 1) % ROUTE.length], dx = tx - fb.x, dz = tz - fb.z, d = Math.hypot(dx, dz), st = 1.4 * dt; if (d < st) fb.i = (fb.i + 1) % ROUTE.length; else { fb.x += dx / d * st; fb.z += dz / d * st; if (Math.abs(dx) > .1) fb.dir = dx > 0 ? 1 : -1; } }
      fb.m.position.set(fb.x, .02 + Math.sin(time * 1.8) * .03, fb.z); fb.m.scale.x = 1.4 * fb.dir; fb.m.rotation.z = Math.sin(time * 1.4) * .03;
      if ((fb.cool -= dt) < 0 && on && near(fb.x, fb.z, 4)) { fb.cool = 12; sfx.toot(); say(v3(fb.x, .4, fb.z), 'Tuut tuut!'); ctx.life.fishJump(fb.x - fb.dir, fb.z - .6, true); }
      // the turtle paddles about, and dives when the boat comes too close
      if (turtle.dive <= 0 && on && near(turtle.x, turtle.z, 2.5)) { turtle.dive = 4; turtle.moved = false; sfx.bubble(); }
      if (turtle.dive > 0) { turtle.dive -= dt; turtle.m.visible = turtle.dive < .5 || turtle.dive > 3.5; turtle.m.position.y = turtle.dive > 3.5 ? -.08 - (4 - turtle.dive) * .5 : -.33 + (.5 - Math.max(0, turtle.dive)) * .5; if (turtle.dive <= .5 && !turtle.moved) { turtle.moved = true; turtle.a += 2; } }
      else { turtle.m.visible = true; turtle.m.position.y = -.08; }
      turtle.a += dt * .12; const nx = 124.5 + Math.cos(turtle.a) * 4, nz = 72.5 + Math.sin(turtle.a) * 2.5; turtle.m.scale.x = nx < turtle.x ? -1 : 1; turtle.x = nx; turtle.z = nz; turtle.m.position.x = nx; turtle.m.position.z = nz;
      if (turtle.dive <= 0) setArt(turtle.m, ART.schildpad(Math.floor(time * 2) % 2));
      // the arrow: only while the little unicorn waits for her fruit, and not once the island is in sight
      const want = on && Q.quest.stage === 'baby' && Math.hypot(goal[0] - b.x, goal[1] - b.z) > 9;
      arrow.visible = want;
      if (want) { const dx = goal[0] - b.x, dz = goal[1] - b.z, l = Math.hypot(dx, dz), bob = .15 + Math.sin(time * 3) * .12; arrow.position.set(b.x + dx / l * (1.9 + bob), .35, b.z + dz / l * (1.9 + bob) * .8); arrow.rotation.z = Math.atan2(-dz, dx); }
    },
  };
}
