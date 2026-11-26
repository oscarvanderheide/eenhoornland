// The hookshot (△, the hook button, G on the keys). It flies out on a chain the way she looks (or at what is clearly
// meant: a post across the gap, a big stone, an animal in front of her) and:
//   - catches the golden ring of a post: the chain pulls her across, over the water (the gap in the bridge to the beach)
//   - catches a big stone: it slides over to her
//   - catches an animal: it comes flying and lands in front of her (it is fine, it giggles)
//   - hits a tree or a wall: tink, and it comes back
// It lies in a chest in the forest that only turns up once the unicorn has hatched (Q.toolReady). Two stone buttons
// lie in front of the chest and a big stone beside each: whatever weighs on both buttons (a stone, an animal, the girl
// herself) opens the lid. No fail states: what is missing wiggles, and the buttons glow while they wait.
import * as Q from './quest.js';
import * as ART from './art.js';
import * as MAP from './map.js';
import { sfx, speak } from './audio.js';
import * as PX from './pixel.js';

const RANGE = 6.5, SPEED = 15;

export function createHaak(ctx, { camera }) {
  const { THREE, scene, M, kid, makeSprite, bubble } = ctx;
  const I = M.I;
  const v3 = (x, z, y = 0) => new THREE.Vector3(x, y, z);

  /* ---------------- the chain and the hook ---------------- */
  const faceCam = (art, w) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(art.width / w, art.height / w), new THREE.MeshBasicMaterial({ map: ctx.tex(art), transparent: true, alphaTest: .5, depthTest: false, depthWrite: false })); m.renderOrder = 19; m.visible = false; scene.add(m); return m; };
  const head = faceCam(ART.haakKop(), 14), links = Array.from({ length: 40 }, () => faceCam(ART.schakel(), 18));
  let shot = null;

  /* ---------------- the posts by the gap ---------------- */
  const posts = MAP.HOOK_POSTS.map(([x, z]) => {
    const art = ART.haakPaal(), m = makeSprite(art, { lean: .3, scale: .9 }); m.position.set(x + .5, 0, z + .55); m.userData.alpha = art; scene.add(m);
    ctx.solid(x, z);
    const p = { x, z, m, ring: v3(x + .5, z + .55, 1.35) };
    m.userData.tap = () => { if (!fire({ kind: 'post', obj: p, at: v3(x + .5, z + .5) })) { p.wob = .5; if (!Q.hasTool('haak')) { sfx.wrong(); bubble(kid, '?', ART.toolIcon('haak')); } } };
    ctx.pick.push(m); return p;
  });
  const gapTiles = new Set(); M.obstacles.forEach(o => { if (o.kind === 'kloof') gapTiles.add(I(o.x, o.z)); });

  /** something solid between her and there (water, the gap and low things do not count) */
  function blocked(x0, z0, x1, z1, skip) {
    const d = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(d / .2);
    for (let k = 1; k < n; k++) {
      const x = Math.floor(x0 + (x1 - x0) * k / n), z = Math.floor(z0 + (z1 - z0) * k / n), i = I(x, z);
      if (skip && skip.has(i)) continue; if (x === Math.floor(x0) && z === Math.floor(z0)) continue;
      if (ctx.walkable(x, z) || gapTiles.has(i) || M.ground[i] === MAP.SE || M.block[i] === MAP.LOW) continue;
      return true;
    }
    return false;
  }
  /** what she means: the post across the gap first, else the stone or animal most in front of her */
  function aim() {
    const kx = kid.pos.x, kz = kid.pos.z, d = ctx.lastDir && ctx.lastDir(), f = d ? { x: d.x, z: d.z } : { x: kid.face, z: 0 };
    for (const p of posts) { const dd = Math.hypot(p.x + .5 - kx, p.z + .5 - kz); if (dd > 2.2 && dd <= RANGE && !blocked(kx, kz, p.x + .5, p.z + .5, new Set([I(p.x, p.z)]))) return { kind: 'post', obj: p, at: v3(p.x + .5, p.z + .5) }; }
    let best = null, bs = .55;
    const consider = (kind, obj, x, z) => {
      const dx = x - kx, dz = z - kz, dd = Math.hypot(dx, dz); if (dd < 1.3 || dd > RANGE) return;
      const c = (dx * f.x + dz * f.z) / dd - dd * .02; if (c <= bs || blocked(kx, kz, x, z, new Set([I(Math.floor(x), Math.floor(z))]))) return;
      bs = c; best = { kind, obj, at: v3(x, z) };
    };
    for (const s of ctx.keien.stones()) if (s !== ctx.keien.holding() && s.mesh.visible) consider('stone', s, s.x + .5, s.z + .5);
    for (const a of ctx.animals) if (a.g.visible && !a.held && !a.fly && !a.cart && !a.swim && !a.isUni && !a.water && !(a.nap > 0)) consider('animal', a, a.pos.x, a.pos.z);
    return best;
  }

  /** fire (at `target`, or at what she means, or straight ahead) */
  function fire(target) {
    if (!Q.hasTool('haak') || shot || ctx.mount() || ctx.busy() || ctx.life.carrying() || ctx.keien.holding() || ctx.life.swimming()) return false;
    const t = target || aim(), from = kid.pos.clone();
    let end, kind = 'none', obj = null;
    if (t) { end = t.at; kind = t.kind; obj = t.obj; }
    else {   // straight ahead until something stops it
      const d = ctx.lastDir && ctx.lastDir(), f = d ? { x: d.x, z: d.z } : { x: kid.face, z: 0 }; let len = RANGE;
      for (let s = .4; s <= RANGE; s += .2) { const x = from.x + f.x * s, z = from.z + f.z * s; if (blocked(from.x, from.z, x, z)) { len = s - .2; kind = 'tink'; break; } }
      end = v3(from.x + f.x * len, from.z + f.z * len);
    }
    const dir = v3(end.x - from.x, end.z - from.z), len = dir.length(); if (len < .3) return false; dir.normalize();
    if (Math.abs(dir.x) > .2) kid.face = Math.sign(dir.x);
    shot = { kind, obj, dir, len, d: 0, phase: 'out' }; sfx.whoosh(); kid.hop = Math.max(kid.hop || 0, .15);
    return true;
  }
  /** where she lands after a post pulled her: the free tile beside the post nearest to where she came from */
  function landBy(p) {
    let best = null, bd = 1e9;
    for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { const x = p.x + dx, z = p.z + dz; if (!ctx.walkable(x, z)) continue; const d = Math.hypot(x + .5 - kid.pos.x, z + .5 - kid.pos.z); if (d < bd) { bd = d; best = [x, z]; } }
    return best;
  }
  function arrive() {
    const s = shot;
    if (s.kind === 'post') {
      const to = landBy(s.obj); if (!to) { s.phase = 'back'; return; }
      sfx.chime(4); s.obj.wob = .4; s.phase = 'pull'; s.to = v3(to[0] + .5, to[1] + .5); ctx.setBusy(true); return;
    }
    if (s.kind === 'stone') {
      const st = s.obj, kx = Math.floor(kid.pos.x), kz = Math.floor(kid.pos.z), sx = Math.sign(st.x - kx), sz = Math.sign(st.z - kz);
      const tries = Math.abs(st.x - kx) >= Math.abs(st.z - kz) ? [[sx, 0], [sx, sz], [0, sz || 1], [0, -(sz || 1)]] : [[0, sz], [sx, sz], [sx || 1, 0], [-(sx || 1), 0]];
      let ok = false; for (const [dx, dz] of tries) if ((dx || dz) && ctx.keien.slideTo(st, kx + dx, kz + dz, s.len / (SPEED * 1.2))) { ok = true; break; }
      if (!ok) { st.wob = .5; sfx.bonk(); }
      s.phase = 'back'; return;
    }
    if (s.kind === 'animal') { const a = s.obj; if (a.g.visible && !a.held && !a.fly) { s.carry = a; a.path = []; a.wait = 4; a.held = true; sfx[a.sound] ? sfx[a.sound]() : sfx.pop(); } s.phase = 'back'; return; }
    if (s.kind === 'tink') { sfx.bonk(); ctx.life.hitAt(kid.pos.x + s.dir.x * s.len, kid.pos.z + s.dir.z * s.len); }
    s.phase = 'back';
  }
  function hide() { head.visible = false; for (const l of links) l.visible = false; }
  function draw(hx, hz, hy) {
    const ax = kid.pos.x + kid.face * .18, az = kid.pos.z + .25, ay = .5 + (kid.lift || 0);
    head.visible = true; head.position.set(hx, hy, hz + .25); head.quaternion.copy(camera.quaternion); head.rotateZ(Math.atan2(-(hz - az), hx - ax) - Math.PI / 2);
    const len = Math.hypot(hx - ax, hz - az, hy - ay), n = Math.min(links.length, Math.floor(len / .22));
    links.forEach((l, k) => { l.visible = k < n; if (k >= n) return; const u = (k + 1) / (n + 1); l.position.set(ax + (hx - ax) * u, ay + (hy - ay) * u, az + (hz + .25 - az) * u); l.quaternion.copy(camera.quaternion); });
  }

  /* ---------------- the chest in the forest with its two buttons ---------------- */
  const [cx, cz] = M.toolSpots.haak, plates = [[cx - 1, cz + 2], [cx + 1, cz + 2]];
  const chestArt = o => ART.schatkist(o), chest = makeSprite(chestArt(false), { lean: .3, scale: .95 }); chest.position.set(cx + .5, 0, cz + .55); chest.userData.alpha = chestArt(false); scene.add(chest);
  const plateMeshes = plates.map(([x, z]) => { const m = makeSprite(ART.knop(false), { lean: Math.PI / 2, shadow: false, scale: .8 }); m.position.set(x + .5, .02, z + .5); scene.add(m); return m; });
  let shown = null, pressed = [false, false], wiggleT = 0, flyer = null;
  const waiting = () => Q.toolOut('haak') && Q.toolReady('haak');
  chest.userData.tap = () => { if (waiting()) { const w = plates.findIndex((_, k) => !pressed[k]); if (w >= 0) wiggleMissing(true); } else { chest.userData.wob = .4; sfx.pop(); } };
  ctx.pick.push(chest);
  function show() {
    const on = waiting() || Q.hasTool('haak'); if (on === shown) return; shown = on;
    chest.visible = on; plateMeshes.forEach(m => { m.visible = on; }); ctx.solid(cx, cz, on);
    setChest(Q.hasTool('haak'));
  }
  const setChest = open => { const art = chestArt(open), t = ctx.tex(art); chest.material.map = t; chest.material.emissiveMap = t; chest.material.needsUpdate = true; chest.userData.alpha = art; if (chest.customDepthMaterial) chest.customDepthMaterial.map = t; };
  const weighs = (x, z) => !!ctx.keien.at(x, z) || (Math.floor(kid.pos.x) === x && Math.floor(kid.pos.z) === z && !(kid.lift > .05) && !(kid.path[0] && kid.path[0].jump)) || ctx.animals.some(a => a.g.visible && !a.held && !a.fly && Math.floor(a.pos.x) === x && Math.floor(a.pos.z) === z);
  /** nothing happens yet: the stones that could go on the buttons wiggle (and the empty buttons bob) */
  function wiggleMissing(say) {
    const free = ctx.keien.stones().filter(s => s.tag === 'puzzle' && !plates.some(([x, z]) => s.x === x && s.z === z) && s !== ctx.keien.holding());
    for (const s of free) s.wob = .6; plateMeshes.forEach((m, k) => { if (!pressed[k]) m.userData.bob = .5; });
    if (say && free[0]) bubble(kid, '', free[0].art);
  }
  function open() {
    if (!Q.giveTool('haak')) return;                                              // saved first, shown after
    setChest(true); sfx.chime(6); sfx.tada(); ctx.burst(v3(cx + .5, cz + .5, .8), 14, true);
    const m = makeSprite(ART.toolIcon('haak'), { lean: .2, shadow: false, scale: 1.3 }); scene.add(m); flyer = { m, t: 0, from: v3(cx + .5, cz + .5, .8) };
    setTimeout(() => { bubble(kid, '!', ART.toolIcon('haak')); speak(Q.TOOLS.haak.found); }, 900);
  }

  const off = Q.on(type => { if (type === 'stage' || type === 'tool') show(); });
  show();

  return {
    fire: () => fire(),
    aim,
    shooting: () => !!shot,
    /** where the chest waits (for the map's goal marker), null once the hookshot is hers */
    spot: () => waiting() ? [cx, cz] : null,
    posts: () => posts.map(p => [p.x, p.z]),
    info: () => ({ shot: shot && { kind: shot.kind, phase: shot.phase }, pressed: pressed.slice(), chest: [cx, cz], plates, shown, open: Q.hasTool('haak') }),
    gapTile: i => gapTiles.has(i),
    update(dt, time) {
      show();
      // the buttons and the chest
      if (shown && waiting()) {
        const now = plates.map(([x, z]) => weighs(x, z));
        now.forEach((p, k) => { if (p !== pressed[k]) { const art = ART.knop(p), t = ctx.tex(art); plateMeshes[k].material.map = t; plateMeshes[k].material.needsUpdate = true; (p ? sfx.click : sfx.pop)(); } });
        pressed = now;
        if (pressed[0] && pressed[1]) open();
        else if (Math.hypot(cx + .5 - kid.pos.x, cz + 2 - kid.pos.z) < 4.5 && (wiggleT -= dt) < 0) { wiggleT = 3.5; wiggleMissing(false); }
        // the chest is the goal of the moment: it sparkles now and then
        if (Math.random() < dt * 2) ctx.life.bit(PX.sparkle('#FFF6D0'), cx + .2 + Math.random() * .6, .5 + Math.random() * .5, cz + .7, { vx: 0, vy: .5, g: 0, life: 1 });
      }
      plateMeshes.forEach(m => { const b = m.userData.bob || 0; if (b > 0) { m.userData.bob = b - dt; m.position.y = .02 + Math.abs(Math.sin(b * 12)) * .06; } });
      if (chest.userData.wob > 0) { chest.userData.wob -= dt; chest.rotation.z = Math.sin(chest.userData.wob * 40) * .05; } else chest.rotation.z = 0;
      for (const p of posts) { if (p.wob > 0) { p.wob -= dt; p.m.rotation.z = Math.sin(p.wob * 40) * .06; } else p.m.rotation.z = 0; }
      if (flyer) { flyer.t += dt * 1.3; const k = Math.min(1, flyer.t); flyer.m.position.set(flyer.from.x + (kid.pos.x - flyer.from.x) * k, flyer.from.y + Math.sin(k * Math.PI) * 1.4 + k * .4, flyer.from.z + (kid.pos.z - flyer.from.z) * k + .1); flyer.m.rotation.z = flyer.t * 10; if (k >= 1) { scene.remove(flyer.m); flyer = null; } }
      // the shot
      const s = shot; if (!s) return;
      if (s.phase === 'out') { s.d = Math.min(s.len, s.d + SPEED * dt); if (s.d >= s.len) arrive(); }
      else if (s.phase === 'back') { s.d -= SPEED * 1.3 * dt; if (s.carry) { const a = s.carry; a.pos.set(kid.pos.x + s.dir.x * Math.max(.8, s.d), 0, kid.pos.z + s.dir.z * Math.max(.8, s.d)); a.lift = .3 + Math.sin(Math.max(0, s.d) / s.len * Math.PI) * .6; }
        if (s.d <= .3) {
          if (s.carry) { const a = s.carry, x = kid.pos.x + s.dir.x * .85, z = kid.pos.z + s.dir.z * .85; a.held = false; a.lift = 0; a.pos.set(ctx.walkable(Math.floor(x), Math.floor(z)) ? x : kid.pos.x, 0, ctx.walkable(Math.floor(x), Math.floor(z)) ? z : kid.pos.z + .05); a.hop = 1; a.wait = 3; a.face = kid.pos.x >= a.pos.x ? 1 : -1; bubble(a, '!'); }
          shot = null; hide(); return;
        }
      } else if (s.phase === 'pull') {
        const to = s.to, dx = to.x - kid.pos.x, dz = to.z - kid.pos.z, l = Math.hypot(dx, dz), st = SPEED * .7 * dt;
        kid.path = []; kid.moving = true;
        if (l <= st) {
          kid.pos.set(to.x, 0, to.z); kid.lift = 0; ctx.setBusy(false); sfx.boing(); kid.hop = .5; shot = null; hide();
          const uni = ctx.uni; if (uni.g.visible && !ctx.mount()) { const t = ctx.nearestWalkable(to.x - s.dir.x * .8, to.z - s.dir.z * .8); if (t) { uni.pos.set(t[0] + .5, 0, t[1] + .5); uni.path = []; uni.hop = 1; } }   // her egg or unicorn comes along on the chain too
          return;
        }
        kid.pos.x += dx / l * st; kid.pos.z += dz / l * st; kid.lift = Math.sin(Math.min(1, 1 - l / s.len) * Math.PI) * .35;
        draw(s.obj.ring.x, s.obj.ring.z, s.obj.ring.y * .55); return;
      }
      const hx = kid.pos.x + s.dir.x * Math.max(0, s.d), hz = kid.pos.z + s.dir.z * Math.max(0, s.d);
      draw(hx, hz, s.kind === 'post' ? .55 + (s.d / s.len) * (s.obj.ring.y * .55 - .55) : .5);
    },
    dispose() { off(); for (const p of posts) ctx.solid(p.x, p.z, false); ctx.solid(cx, cz, false); },
  };
}
