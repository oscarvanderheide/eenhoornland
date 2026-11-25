// The open sea between the beach and the rainbow island: things to sail past and to play with on the way. Nothing is
// needed for the adventure. Like everything else, the sea waits for her: nothing calls out, things answer a tap (also
// from the boat: world.js hands a tap on any of these to them instead of steering).
//   islets      a lighthouse (a tap and its lamp turns, at night it shines), seals on a sandbank that play ball (tap a
//               seal and the ball flies to it), a palm islet with a chest (a coin a day)
//   jellyfish   five of them in a row, each sings its own note and glows when tapped: a xylophone in the sea
//   dolphins    a pod jumps alongside the boat now and then; tap one and it does a flip, and the others follow
//   a swimmer   floats in a ring near the pier and splashes; a fishing boat with a bear: tap it and he throws her a fish
//   a turtle    swims its slow round; tap it and it comes to swim beside the boat for a while
//   the arrow   while the little unicorn is hungry, a rainbow arrow by the boat points to the rainbow island
// world.js hands over the same toolbox (ctx) as for world-extras.js; the boat itself is in world-play.js.
import * as PX from './pixel.js';
import * as ART from './art.js';
import * as AW from './art-ways.js';
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
  /** a thing at sea that answers a tap, from the shore or from the boat */
  const tappable = (m, art, fn) => { m.userData.alpha = art; m.userData.tap = fn; m.userData.sea = true; pick.push(m); return m; };
  /** where she is: in the boat, or on her feet */
  const herAt = () => aboard() ? boat() : { x: kid.pos.x, z: kid.pos.z };

  /** soft light: a round glow for the lamp, a long fading fan for its beam */
  function glowTex() { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }
  function beamTex() { const c = document.createElement('canvas'); c.width = 128; c.height = 32; const x = c.getContext('2d'); for (let i = 0; i < 128; i++) { const a = (1 - i / 128) ** 1.5, g = x.createLinearGradient(0, 0, 0, 32); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(i, 16 - 4 - i / 10, 1, 8 + i / 5); } return new THREE.CanvasTexture(c); }

  /* ---------------- the islets ---------------- */
  const seals = [], ball = { m: null, at: 1, fly: null, bounce: 0 }; let chest = null, lamp = null, beam = null, lampT = 0;
  for (const it of MAP.ISLETS) {
    if (it.kind === 'vuurtoren') {
      const art = ART.vuurtoren(), m = makeSprite(art, { lean: .2, scale: 1.3 }); m.position.set(it.cx, 0, it.cz + .2); scene.add(m);
      lamp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#FFE9A8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); lamp.scale.set(3, 3, 1); lamp.position.set(it.cx, 3.1, it.cz + .5); scene.add(lamp);
      // the beam: a long soft fan of light that turns round when the lamp is lit by a tap
      const g = new THREE.PlaneGeometry(10, 3); g.translate(5, 0, 0);
      beam = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: beamTex(), color: '#FFF3C4', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      beam.position.set(it.cx, 3.1, it.cz + .5); beam.rotation.x = -Math.PI / 2; scene.add(beam);
      tappable(m, art, () => { lampT = 6; sfx.horn(); burst(v3(it.cx, 2.2, it.cz + .5), 6); });
      for (const dx of [-1.4, 1.5]) { const r = makeSprite(ART.propArt('rock', 2), { lean: .3 }); r.position.set(it.cx + dx, 0, it.cz + .6); scene.add(r); }
    } else if (it.kind === 'zeehonden') {
      [-1.6, 0, 1.5].forEach((dx, i) => {
        const art = ART.hd(ART.zeehond(0)), m = makeSprite(art, { lean: .3, scale: .8 }); m.position.set(it.cx + dx, 0, it.cz + .3); if (dx > 0) m.scale.x = -.8; scene.add(m);
        const s = { m, x: it.cx + dx, z: it.cz + .3, clap: 0, f: 0, hop: 0 }; seals.push(s); tappable(m, art, () => throwTo(i));
      });
      ball.m = makeSprite(AW.zeeBal(), { lean: .2, shadow: false, scale: .9 }); scene.add(ball.m);
    } else if (it.kind === 'palmeiland') {
      const p = makeSprite(ART.propArt('palm', 3), { lean: .22, scale: 1.3 }); p.position.set(it.cx - .6, 0, it.cz); scene.add(p);
      chest = { m: makeSprite(ART.schatkist(false), { lean: .3 }), x: it.cx + .9, z: it.cz + .5, open: 0 }; chest.m.position.set(chest.x, 0, chest.z); scene.add(chest.m);
    } else { const r = makeSprite(ART.propArt('rock', 1 + Math.floor(it.cx) % 4), { lean: .3, scale: 1.2 }); r.position.set(it.cx, 0, it.cz + .3); scene.add(r); }
  }
  const sealNose = s => v3(s.x + (s.m.scale.x < 0 ? -.3 : .3), .62, s.z + .05);
  /** the seals play ball: a tap on a seal and the ball flies to it (a tap on the one that has it: it bounces it up high) */
  function throwTo(i) {
    if (!seals.length || ball.fly) return; const from = seals[ball.at], to = seals[i]; sfx.boing();
    ball.fly = { a: sealNose(from), b: sealNose(to), t: 0, T: i === ball.at ? .9 : .8, H: i === ball.at ? 2.2 : 1.6, to: i };
    from.hop = 1; for (const s of seals) if (s !== from && s !== to) s.clap = 1.2;
  }

  /* ---------------- jellyfish: a row of notes ---------------- */
  const JELLY = ['#FF8FB1', '#FFB86B', '#FFE066', '#8FE0A8', '#8FB8FF'], jellies = [];
  JELLY.forEach((col, i) => {
    const x = 105 + i * 1.6, z = 48 - Math.sin(i / 4 * Math.PI) * .9; if (!sea(x, z)) return;
    const art = AW.kwal(col), m = makeSprite(art, { lean: .2, shadow: false, scale: .75 }); m.material = m.material.clone(); m.position.set(x, -.15, z); scene.add(m);
    const j = { m, x, z, col, i, lit: 0, ph: i * 1.3 }; jellies.push(j);
    tappable(m, art, () => { j.lit = 1; setArt(m, AW.kwal(col, true)); sfx.chime([0, 1, 2, 3, 4][i]); burst(v3(x, .4, z), 3); });
  });

  /* ---------------- dolphins ---------------- */
  const pod = [0, 1, 2].map(k => { const art = ART.dolfijn(0), m = makeSprite(art, { lean: .15, shadow: false, scale: 1.1 }); m.visible = false; scene.add(m); const d = { m, k, t: -9 }; tappable(m, art, () => flip(d)); return d; });
  let podT = 4, playful = 0;
  function leap() {
    const b = boat(), side = Math.random() < .5 ? 1 : -1, dir = Math.random() < .5 ? 1 : -1, x0 = b.x - dir * 2.5, z0 = b.z + side * 2.2;
    if (![0, 2, 4].every(d => sea(x0 + dir * d, z0))) return false;
    pod.forEach((d, k) => { d.t = -k * .35; d.x0 = x0 - dir * k * .9; d.z0 = z0 + k * .25; d.dir = dir; d.m.scale.x = 1.1 * dir; d.flip = 0; });
    sfx.whoosh(); setTimeout(() => sfx.splash(), 500); return true;
  }
  /** a tap on a leaping dolphin: it turns a somersault, squeaks, and the pod keeps playing round the boat for a while */
  function flip(d) { if (d.t < 0 || d.t > 1.2 || d.flip) return; d.flip = 1; sfx.squeak(); playful = 20; podT = Math.min(podT, 2.5); }

  /* ---------------- the swimmer, the fishing boat, the turtle ---------------- */
  const swim = { m: makeSprite(ART.zwemmer(0), { lean: .2, shadow: false }), x: 99.5, z: 75.5, wave: 0, saw: false };
  swim.m.position.set(swim.x, -.15, swim.z); scene.add(swim.m);
  tappable(swim.m, ART.zwemmer(0), () => { swim.wave = 1.6; sfx.splash(); say(v3(swim.x, 0, swim.z), 'Hihi! Spetter!'); ctx.life.splash(swim.x + .6, swim.z); });
  const ROUTE = MAP.BOAT_ROUTE;
  const fb = { m: makeSprite(ART.vissersboot(), { lean: .2, shadow: false, scale: 1.4 }), i: 0, x: ROUTE[0][0], z: ROUTE[0][1], dir: 1, cool: 0, stop: 0 };
  fb.m.position.set(fb.x, 0, fb.z); scene.add(fb.m);
  const tossed = [];
  tappable(fb.m, ART.vissersboot(), () => {         // the bear stops, toots, and throws a fish: to her when she is close, otherwise it jumps back into the sea
    sfx.toot(); fb.stop = 2.5; const h = herAt(), gift = Math.hypot(h.x - fb.x, h.z - fb.z) < 9;
    const m = makeSprite(ART.fish(0), { lean: .2, shadow: false, scale: .7 }); scene.add(m);
    tossed.push({ m, a: v3(fb.x, .9, fb.z), b: gift ? v3(h.x, .9, h.z + .1) : v3(fb.x + fb.dir * 2.2, -.2, fb.z + .8), t: 0, gift });
  });
  const turtle = { m: makeSprite(ART.schildpad(0), { lean: .25, shadow: false }), x: 124.5, z: 72.5, a: 0, dive: 0, with: 0 };
  turtle.m.position.set(turtle.x, -.08, turtle.z); scene.add(turtle.m);
  tappable(turtle.m, ART.schildpad(0), () => { if (turtle.dive > 0) return; sfx.bubble(); turtle.hop = 1; if (aboard()) { turtle.with = 25; say(v3(turtle.x, 0, turtle.z), '', PX.heart()); } });

  /* ---------------- the arrow to the rainbow island ---------------- */
  const arrow = makeSprite(ART.pijl(), { lean: Math.PI / 2 - .25, shadow: false, scale: 1.1 }); arrow.visible = false; scene.add(arrow);
  const goal = MAP.BOAT.eiland.moor;

  return {
    info: () => ({ tossed: tossed.length, dolphins: pod.filter(d => d.t >= 0 && d.t < 1.3).length, arrow: arrow.visible, seals: seals.filter(s => s.clap > 0).length, ball: ball.at, ballFlying: !!ball.fly, fishingBoat: [+fb.x.toFixed(1), +fb.z.toFixed(1)], chest: chest && chest.open > 0, jellies: jellies.map(j => +j.lit.toFixed(2)), turtleWith: turtle.with > 0, turtle: [+turtle.x.toFixed(1), +turtle.z.toFixed(1)], lamp: lampT > 0, playful: playful > 0 }),
    leap, throwTo, tapJelly: i => jellies[i] && jellies[i].m.userData.tap(), tapTurtle: () => turtle.m.userData.tap(), tapBoat: () => fb.m.userData.tap(), tapLamp: () => lamp && beam && (lampT = 6), flipAny: () => { const d = pod.find(d => d.t >= 0 && d.t < 1.2); if (d) flip(d); return !!d; },
    update(dt, time, active) {
      const b = boat(), on = aboard(), moving = on && ctx.play.info().moving || on && ctx.play.driving();
      // dolphins: only out on open water, only while she sails (more often while they are playing with her)
      playful = Math.max(0, playful - dt);
      if (on && (moving || playful > 0) && (podT -= dt) < 0) { podT = playful > 0 ? rnd(2.5, 4) : rnd(7, 12); if (!leap()) podT = 1.5; }
      for (const d of pod) {
        if (d.t < -5) continue; d.t += dt * .8; const k = d.t;
        if (k < 0 || k > 1.3) { d.m.visible = false; if (k > 1.3) d.t = -9; continue; }
        const e = Math.min(1, k), H = d.flip ? 2.3 : 1.5; d.m.visible = true; d.m.position.set(d.x0 + d.dir * e * 4.4, -.4 + Math.sin(e * Math.PI) * H, d.z0);
        d.m.rotation.z = d.flip ? -d.dir * e * Math.PI * 2 : -d.dir * (e - .5) * 1.4;
        setArt(d.m, ART.dolfijn(Math.floor(time * 6 + d.k) % 2));
        if (k > .98 && !d.splashed) { d.splashed = true; ctx.life.splash(d.m.position.x, d.z0); if (d.flip) { burst(v3(d.m.position.x, 0, d.z0), 8); sfx.splash(); } } if (k < .1) d.splashed = false;
      }
      // the seals' ball: it lies on a nose, flies when a seal is tapped, and the one that catches it is pleased
      if (ball.m) {
        if (ball.fly) {
          const f = ball.fly; f.t += dt; const k = Math.min(1, f.t / f.T); ball.m.position.set(f.a.x + (f.b.x - f.a.x) * k, f.a.y + (f.b.y - f.a.y) * k + Math.sin(k * Math.PI) * f.H, f.a.z + (f.b.z - f.a.z) * k + .05); ball.m.rotation.z -= dt * 8;
          if (k >= 1) { ball.fly = null; ball.at = f.to; const s = seals[f.to]; s.hop = 1; s.clap = 1.4; sfx.pop(); if (Math.random() < .5) setTimeout(sfx.boing, 120); }
        } else { const p = sealNose(seals[ball.at]); ball.m.position.set(p.x, p.y + Math.max(0, Math.sin(seals[ball.at].hop * Math.PI)) * .3, p.z); }
      }
      { const n = near(104, 61, 6); if (n && !ball.saw && !ball.fly && seals.length) seals[ball.at].hop = 1; ball.saw = n; }   // the boat comes by: the one with the ball bounces it once, as if to ask
      seals.forEach(s => {
        s.hop = Math.max(0, s.hop - dt * 2.5); s.m.position.y = Math.sin(s.hop * Math.PI) * .25;
        if (s.clap > 0) { s.clap -= dt; const f = Math.floor(s.clap * 8) % 2; if (s.f !== f) { s.f = f; setArt(s.m, ART.hd(ART.zeehond(f))); } } else if (s.f) { s.f = 0; setArt(s.m, ART.hd(ART.zeehond(0))); }
      });
      // the lighthouse: a tap turns its beam round for a while; at night the lamp shines softly
      if (lamp) { lampT = Math.max(0, lampT - dt); const on = Math.min(1, lampT); lamp.material.opacity = Math.max(ctx.night() * (.7 + Math.sin(time * 2) * .25), on * .8); beam.material.opacity = on * .55; beam.rotation.z = time * 1.6; }
      // the jellyfish: float gently in place, and the one that sang glows for a little while
      for (const j of jellies) { j.m.position.y = -.15 + Math.sin(time * 1.1 + j.ph) * .04 + j.lit * .25; if (j.lit > 0) { j.lit = Math.max(0, j.lit - dt * .35); if (j.lit === 0) setArt(j.m, AW.kwal(j.col)); } j.m.scale.set(.75 * (1 + j.lit * .15), .75 * (1 + j.lit * .15), 1); }
      // the chest on the palm islet: sail up to it
      if (chest) { if (chest.open > 0 && (chest.open -= dt) <= 0) setArt(chest.m, ART.schatkist(false)); if (on && chest.open <= 0 && near(chest.x, chest.z + 1, 2.8)) { chest.open = 3; setArt(chest.m, ART.schatkist(true)); if (Q.giftOnce('palmkist', 'munt')) { sfx.chime(5); burst(v3(chest.x, .2, chest.z), 8); say(v3(chest.x, 0, chest.z), '', ART.coin()); } else sfx.sparkle(); } }
      // the swimmer waves (no words) when the boat comes by
      swim.m.position.y = -.15 + Math.sin(time * 2.2) * .05; swim.m.position.x = swim.x + Math.sin(time * .3) * .6;
      const sw = near(swim.x, swim.z, 4) || Math.hypot(kid.pos.x - swim.x, kid.pos.z - swim.z) < 5;
      if (sw && !swim.saw) { swim.saw = true; swim.wave = 2; } if (!sw) swim.saw = false;
      if (swim.wave > 0) { swim.wave -= dt; setArt(swim.m, ART.zwemmer(Math.floor(swim.wave * 4) % 2)); } else if (swim.wave > -1) { swim.wave = -1; setArt(swim.m, ART.zwemmer(0)); }
      // the fishing boat goes round (it stops a moment when it throws a fish)
      fb.stop = Math.max(0, fb.stop - dt);
      if (!fb.stop) { const [tx, tz] = ROUTE[(fb.i + 1) % ROUTE.length], dx = tx - fb.x, dz = tz - fb.z, d = Math.hypot(dx, dz), st = 1.4 * dt; if (d < st) fb.i = (fb.i + 1) % ROUTE.length; else { fb.x += dx / d * st; fb.z += dz / d * st; if (Math.abs(dx) > .1) fb.dir = dx > 0 ? 1 : -1; } }
      fb.m.position.set(fb.x, .02 + Math.sin(time * 1.8) * .03, fb.z); fb.m.scale.x = 1.4 * fb.dir; fb.m.rotation.z = Math.sin(time * 1.4) * .03;
      for (let i = tossed.length - 1; i >= 0; i--) {
        const f = tossed[i]; f.t += dt * 1.1; const k = Math.min(1, f.t); if (f.gift) { const h = herAt(); f.b.set(h.x, .9, h.z + .1); }
        f.m.position.set(f.a.x + (f.b.x - f.a.x) * k, f.a.y + (f.b.y - f.a.y) * k + Math.sin(k * Math.PI) * 2, f.a.z + (f.b.z - f.a.z) * k); f.m.rotation.z += dt * 7;
        if (k >= 1) { scene.remove(f.m); tossed.splice(i, 1); if (f.gift) { sfx.chime(3); kid.hop = .5; burst(kid.pos, 6, true); bubble(kid, '', ART.fish(0)); } else { ctx.life.splash(f.b.x, f.b.z); ctx.life.fishJump(f.b.x + .5, f.b.z, true); } }
      }
      // the turtle paddles its round; tapped from the boat it comes along beside her for a while, then swims back
      turtle.hop = Math.max(0, (turtle.hop || 0) - dt * 2);
      if (turtle.with > 0 && on) {
        turtle.with -= dt; const tx = b.x - 1.3, tz = b.z + 1.1, dx = tx - turtle.x, dz = tz - turtle.z, d = Math.hypot(dx, dz);
        if (sea(tx, tz) && d > .1) { const v = Math.min(d, dt * Math.max(1, d * 1.2)); turtle.x += dx / d * v; turtle.z += dz / d * v; if (Math.abs(dx) > .05) turtle.m.scale.x = dx < 0 ? -1 : 1; }
        if (turtle.with <= 0) turtle.back = true;
      } else {
        if (turtle.with > 0) { turtle.with = 0; turtle.back = true; }
        const nx = 124.5 + Math.cos(turtle.a) * 4, nz = 72.5 + Math.sin(turtle.a) * 2.5;
        if (turtle.back) { const dx = nx - turtle.x, dz = nz - turtle.z, d = Math.hypot(dx, dz); if (d < .2) turtle.back = false; else { const v = Math.min(d, dt * 1.2); turtle.x += dx / d * v; turtle.z += dz / d * v; turtle.m.scale.x = dx < 0 ? -1 : 1; } }
        else { turtle.a += dt * .12; turtle.m.scale.x = nx < turtle.x ? -1 : 1; turtle.x = nx; turtle.z = nz; }
      }
      // it dives when the boat sails straight at it without stopping (not when it is swimming along)
      if (turtle.dive <= 0 && turtle.with <= 0 && on && moving && near(turtle.x, turtle.z, 1.6)) { turtle.dive = 4; turtle.moved = false; sfx.bubble(); }
      if (turtle.dive > 0) { turtle.dive -= dt; turtle.m.visible = turtle.dive < .5 || turtle.dive > 3.5; turtle.m.position.y = turtle.dive > 3.5 ? -.08 - (4 - turtle.dive) * .5 : -.33 + (.5 - Math.max(0, turtle.dive)) * .5; if (turtle.dive <= .5 && !turtle.moved) { turtle.moved = true; turtle.a += 2; turtle.back = true; } }
      else { turtle.m.visible = true; turtle.m.position.y = -.08 + Math.sin(turtle.hop * Math.PI) * .25; }
      turtle.m.position.x = turtle.x; turtle.m.position.z = turtle.z;
      if (turtle.dive <= 0) setArt(turtle.m, ART.schildpad(Math.floor(time * (turtle.with > 0 ? 3 : 2)) % 2));
      // the arrow: only while the little unicorn waits for her fruit, and not once the island is in sight
      const want = on && Q.quest.stage === 'baby' && Math.hypot(goal[0] - b.x, goal[1] - b.z) > 9;
      arrow.visible = want;
      if (want) { const dx = goal[0] - b.x, dz = goal[1] - b.z, l = Math.hypot(dx, dz), bob = .15 + Math.sin(time * 3) * .12; arrow.position.set(b.x + dx / l * (1.9 + bob), .35, b.z + dz / l * (1.9 + bob) * .8); arrow.rotation.z = Math.atan2(-dz, dx); }
    },
  };
}
