// Fishing at the end of the old pier on the beach (MAP.FISH). Walk to the end of the pier and she takes the rod and
// casts. After a little while the float bobs and splashes: a tap (anywhere, or the jump / pick-up key) and she reels in.
// What comes up is a surprise: mostly a fish (she shows it, it wriggles and flips back into the sea), sometimes an old boot
// ("bah!"), seaweed that lands on her head, a rubber duck, a shell, or once a day a bottle with a coin in it.
// Nothing can go wrong: the float waits for her as long as it takes. Walk off the pier and the rod goes back.
import * as ART from './art.js';
import * as MAP from './map.js';
import * as Q from './quest.js';
import { sfx } from './audio.js';

export function createFishing(ctx) {
  const { THREE, scene, makeSprite, pick, burst, bubble, kid } = ctx;
  const F = MAP.FISH, rnd = (a, b) => a + Math.random() * (b - a);
  const rest = new THREE.Vector3(F.pier[0] + .3, 0, F.pier[1] + .15);
  const rod = makeSprite(ART.hengel(), { lean: .25, scale: 1.2 }); rod.position.copy(rest); scene.add(rod);
  rod.userData.alpha = ART.hengel(); rod.userData.tap = () => { sfx.pop(); ctx.walkToTile(F.pier[0], F.pier[1]); }; pick.push(rod);
  const bob = makeSprite(ART.dobber(), { lean: .2, shadow: false }); bob.visible = false; scene.add(bob);
  const lineGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Array(9).fill(0), 3));
  const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: '#F4F1EE' })); line.visible = false; line.frustumCulled = false; scene.add(line);
  let st = 'off', t = 0, catchM = null, hat = null, n = 0;
  const onPier = () => Math.floor(kid.pos.x) <= F.pier[0] + 1 && Math.floor(kid.pos.z) >= F.pier[1] && Math.floor(kid.pos.z) <= F.pier[1] + 1 && Math.floor(kid.pos.x) >= F.pier[0];
  const tip = () => new THREE.Vector3(kid.pos.x - .55, 1.15 + (st === 'reel' ? .25 : 0), kid.pos.z + .05);
  const spot = new THREE.Vector3(F.spot[0], 0, F.spot[1]);

  function start() { st = 'cast'; t = 0; kid.face = -1; kid.path = []; sfx.whoosh(); }
  function stop() { st = 'off'; bob.visible = line.visible = false; rod.position.copy(rest); rod.rotation.z = 0; rod.scale.x = 1.2; }
  function reel() {
    if (st !== 'bite') return false; st = 'reel'; t = 0; sfx.whoosh(); kid.hop = .5;
    const r = Math.random(), coinOk = !Q.gotToday('fles');
    const what = r < .5 ? 'vis' : r < .64 ? 'laars' : r < .74 ? 'zeewier' : r < .84 ? 'badeend' : r < .93 ? 'schelp' : coinOk ? 'fles' : 'vis';
    const art = what === 'vis' ? ART.fish(n) : what === 'laars' ? ART.laars() : what === 'zeewier' ? ART.zeewier() : what === 'badeend' ? ART.badeend() : what === 'schelp' ? ART.shell(n) : ART.fles();
    catchM = { m: makeSprite(art, { lean: .2, shadow: false, scale: 1.2 }), what, from: bob.position.clone(), t: 0 }; scene.add(catchM.m); n++;
    return true;
  }
  function land(c) {
    const p = kid.pos.clone(); p.y = .8;
    if (c.what === 'vis') { sfx.chime(3); burst(p, 6); const f = ART.fish(n); setTimeout(() => { sfx.boing(); ctx.life.bit(f, kid.pos.x - .3, 1, kid.pos.z, { vx: -3, vy: 3.5, g: 9, life: 1.1, spin: 6 }); setTimeout(() => ctx.life.splash(kid.pos.x - 2.2, kid.pos.z), 700); }, 500); }   // a moment to look at it, then it wriggles free and flips back into the sea
    else if (c.what === 'schelp') { sfx.chime(4); bubble(kid, '!', ART.shell(0)); }
    else if (c.what === 'fles') { Q.giftOnce('fles', 'munt'); sfx.tada(); bubble(kid, '!', ART.coin()); burst(p, 10, true); }
    else if (c.what === 'laars') { sfx.boing(); bubble(kid, 'Bah!', ART.laars()); ctx.life.bit(ART.laars(), kid.pos.x - .3, 1, kid.pos.z, { vx: -3.5, vy: 3, g: 9, life: 1.2 }); setTimeout(() => ctx.life.splash(kid.pos.x - 3.8, kid.pos.z + .6), 1000); }
    else if (c.what === 'zeewier') { sfx.splash(); bubble(kid, 'Hihi!'); hat = { m: makeSprite(ART.zeewier(), { lean: .2, shadow: false, scale: 1.3 }), t: 3.5 }; scene.add(hat.m); }
    else if (c.what === 'badeend') { sfx.pop(); bubble(kid, 'Piep!', ART.badeend()); ctx.life.bit(ART.badeend(), kid.pos.x - .3, 1, kid.pos.z, { vx: -2.5, vy: 2, g: 9, life: 1 }); }
    scene.remove(c.m);
  }

  return {
    /** a tap while she is fishing: reel in if something bites (returns true if it took the tap) */
    tap: () => st === 'bite' ? reel() : st === 'reel',
    fishing: () => st !== 'off',
    info: () => ({ st, n }),
    bite: () => { if (st === 'wait') t = 99; },
    update(dt, time, active) {
      if (st === 'off') { if (active && onPier() && !kid.path.length && !ctx.mount()) start(); }
      else if (!onPier() || ctx.mount()) stop();
      if (hat) { hat.t -= dt; hat.m.position.set(kid.pos.x, kid.mesh.position.y + (ctx.who() === 'anna' ? 1.05 : 1.25), kid.pos.z + .1); if (hat.t <= 0) { scene.remove(hat.m); hat = null; sfx.pop(); } }
      if (st === 'off') return;
      t += dt; kid.face = -1;
      const tp = tip(); rod.position.set(kid.pos.x - .15, .35, kid.pos.z + .1); rod.scale.x = 1.2; rod.rotation.z = st === 'reel' ? .5 : st === 'bite' ? Math.sin(time * 30) * .06 : 0;
      if (st === 'cast') { const k = Math.min(1, t / .7); bob.visible = true; bob.position.set(tp.x + (spot.x - tp.x) * k, Math.max(-.05, tp.y + (0 - tp.y) * k + Math.sin(k * Math.PI) * 1.2), tp.z + (spot.z - tp.z) * k); if (k >= 1) { st = 'wait'; t = 0; sfx.splash(); this.wait = rnd(1.8, 4.5); } }
      else if (st === 'wait') { bob.position.set(spot.x, -.05 + Math.sin(time * 2) * .02, spot.z); if (t > (this.wait || 3)) { st = 'bite'; t = 0; sfx.splash(); bubble({ pos: spot, isUni: false }, '!'); } }
      else if (st === 'bite') { bob.position.set(spot.x, -.12 + Math.abs(Math.sin(time * 9)) * -.12, spot.z); if ((this.sp = (this.sp || 0) - dt) < 0) { this.sp = .9; ctx.life.splash(spot.x, spot.z); } }
      else if (st === 'reel' && catchM) {
        const c = catchM; c.t += dt * 1.6; const k = Math.min(1, c.t); c.m.position.set(c.from.x + (kid.pos.x - c.from.x) * k, Math.sin(k * Math.PI) * 1.8 + k * .9, c.from.z + (kid.pos.z - c.from.z) * k + .1); c.m.rotation.z = c.t * 6;
        bob.position.copy(c.m.position); if (k >= 1) { land(c); catchM = null; st = 'cast'; t = -1.2; }
      }
      if (st === 'cast' && t < 0) bob.visible = false;
      const p = lineGeo.attributes.position, b = bob.position, mid = [(tp.x + b.x) / 2, Math.min(tp.y, b.y) + (st === 'bite' || st === 'reel' ? .3 : -.15), (tp.z + b.z) / 2];
      p.setXYZ(0, tp.x, tp.y, tp.z); p.setXYZ(1, ...mid); p.setXYZ(2, b.x, b.y + .12, b.z); p.needsUpdate = true; line.visible = bob.visible;
    },
  };
}
