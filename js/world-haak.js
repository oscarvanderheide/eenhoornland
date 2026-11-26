// The hookshot (△, the hook button, G on the keys). It flies out on a chain the way she looks (or at what is clearly
// meant: a post across the gap, a big stone, an animal in front of her) and:
//   - catches the golden ring of a post: the chain pulls her across, over the water (the gap in the bridge to the beach,
//     the beach's little islands, the stream in the waterfall's cave: MAP.HOOK_POSTS and MAP.HOOK_LINKS). She means the
//     post across the water that she faces, never one on her own side
//   - catches a big stone: the chain pulls her over to it (she lands beside it; never somewhere she could not walk to)
//   - catches an animal: it comes flying and lands in front of her (it is fine, it giggles)
//   - hits a tree or a wall: tink, and it comes back
// It lies in a chest at the end of the cave behind the waterfall (world-waterval.js), from the moment the unicorn has
// hatched (Q.toolReady).
import * as Q from './quest.js';
import * as ART from './art.js';
import * as MAP from './map.js';
import { sfx, speak } from './audio.js';
import * as PX from './pixel.js';

const RANGE = 6.5, POST_RANGE = 10, SPEED = 15;

export function createHaak(ctx, { camera }) {
  const { THREE, scene, M, kid, makeSprite, bubble } = ctx;
  const I = M.I;
  const v3 = (x, z, y = 0) => new THREE.Vector3(x, y, z);

  /* ---------------- the chain and the hook ---------------- */
  const faceCam = (art, w) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(art.width / w, art.height / w), new THREE.MeshBasicMaterial({ map: ctx.tex(art), transparent: true, alphaTest: .5, depthTest: false, depthWrite: false })); m.renderOrder = 19; m.visible = false; scene.add(m); return m; };
  const head = faceCam(ART.haakKop(), 14), links = Array.from({ length: 40 }, () => faceCam(ART.schakel(), 18));
  let shot = null;

  /* ---------------- the posts by the gap ---------------- */
  const spots = []; for (const p of [...MAP.HOOK_POSTS, ...MAP.HOOK_LINKS.flat()]) if (!spots.some(q => q[0] === p[0] && q[1] === p[1])) spots.push(p);
  const posts = spots.map(([x, z]) => {
    const art = ART.haakPaal(), m = makeSprite(art, { lean: .3, scale: .9 }); m.position.set(x + .5, 0, z + .55); m.userData.alpha = art; scene.add(m);
    ctx.solid(x, z);
    const p = { x, z, m, ring: v3(x + .5, z + .55, 1.35) };
    m.userData.tap = () => { if (!fire({ kind: 'post', obj: p, at: v3(x + .5, z + .5) })) { p.wob = .5; if (!Q.hasTool('haak')) { sfx.wrong(); bubble(kid, '?', ART.toolIcon('haak')); } } };
    ctx.pick.push(m); return p;
  });
  const postTiles = new Set(posts.map(p => I(p.x, p.z)));
  const gapTiles = new Set(); M.obstacles.forEach(o => { if (o.kind === 'kloof') gapTiles.add(I(o.x, o.z)); });
  { const V = MAP.ROOMS.val; for (let z = V.z0; z <= V.z1; z++) for (let x = V.stream.x0; x <= V.stream.x1; x++) gapTiles.add(I(x, z)); }   // the stream in the waterfall's cave
  // the pairs of posts she can be pulled between, as tiles: from beside one post to beside the other (world-fly.js asks)
  const beside = ([x, z]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => [x + dx, z + dz]).filter(([X, Z]) => M.inb(X, Z) && !M.block[I(X, Z)]).map(([X, Z]) => I(X, Z));
  const hookTo = new Map(); for (const [a, b] of MAP.HOOK_LINKS) { const A = beside(a), B = beside(b); for (const i of A) hookTo.set(i, (hookTo.get(i) || []).concat(B)); for (const i of B) hookTo.set(i, (hookTo.get(i) || []).concat(A)); }
  /** water (or a gap) lies between her and there: the post is across, not on her own side */
  function across(x0, z0, x1, z1) {
    const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / .2);
    for (let k = 1; k < n; k++) { const x = Math.floor(x0 + (x1 - x0) * k / n), z = Math.floor(z0 + (z1 - z0) * k / n), i = I(x, z); if (gapTiles.has(i) || (M.ground[i] === MAP.SE && M.block[i])) return true; }
    return false;
  }

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
    let post = null, ps = -9;   // the post across the water she faces most
    for (const p of posts) {
      const dx = p.x + .5 - kx, dz = p.z + .5 - kz, dd = Math.hypot(dx, dz); if (dd <= 2.2 || dd > POST_RANGE || !across(kx, kz, p.x + .5, p.z + .5) || blocked(kx, kz, p.x + .5, p.z + .5, postTiles)) continue;   // (a post is thin: the chain passes the one beside her)
      const sc = (dx * f.x + dz * f.z) / dd - dd * .01; if (sc > -.25 && sc > ps) { ps = sc; post = p; }   // never one behind her
    }
    if (post) return { kind: 'post', obj: post, at: v3(post.x + .5, post.z + .5) };
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
  function landBy(p, ok) {
    let best = null, bd = 1e9;
    for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { const x = p.x + dx, z = p.z + dz; if (!ctx.walkable(x, z) || (ok && !ok[I(x, z)])) continue; const d = Math.hypot(x + .5 - kid.pos.x, z + .5 - kid.pos.z); if (d < bd) { bd = d; best = [x, z]; } }
    return best;
  }
  function arrive() {
    const s = shot;
    if (s.kind === 'post') {
      const to = landBy(s.obj); if (!to) { s.phase = 'back'; return; }
      sfx.chime(4); s.obj.wob = .4; s.phase = 'pull'; s.ring = s.obj.ring; s.to = v3(to[0] + .5, to[1] + .5); ctx.setBusy(true); return;
    }
    if (s.kind === 'stone') {   // the stone stays put: she is pulled over to it, onto the free side nearest her
      const st = s.obj, ok = ctx.fly && ctx.fly.reachable(Math.floor(kid.pos.x), Math.floor(kid.pos.z), Q.canRide()), to = landBy(st, ok);
      st.wob = .4; sfx.bonk();
      if (!to || Math.hypot(to[0] + .5 - kid.pos.x, to[1] + .5 - kid.pos.z) < .5) { s.phase = 'back'; return; }
      s.phase = 'pull'; s.ring = v3(st.x + .5, st.z + .55, .9); s.to = v3(to[0] + .5, to[1] + .5); ctx.setBusy(true); return;
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

  const off = () => {};

  return {
    fire: () => fire(),
    aim,
    shooting: () => !!shot,
    /** where the hookshot waits (for the map's goal marker): the waterfall's cave; null once it is hers */
    spot: () => ctx.val ? ctx.val.spot() : null,
    /** the tiles the hookshot pulls her to from tile i (beside a post across the water) */
    linksFrom: i => hookTo.get(i) || [],
    posts: () => posts.map(p => [p.x, p.z]),
    info: () => ({ shot: shot && { kind: shot.kind, phase: shot.phase }, open: Q.hasTool('haak'), posts: posts.map(p => [p.x, p.z]) }),
    gapTile: i => gapTiles.has(i),
    update(dt, time) {
      for (const p of posts) { if (p.wob > 0) { p.wob -= dt; p.m.rotation.z = Math.sin(p.wob * 40) * .06; } else p.m.rotation.z = 0; }
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
        draw(s.ring.x, s.ring.z, s.ring.y * .55); return;
      }
      const hx = kid.pos.x + s.dir.x * Math.max(0, s.d), hz = kid.pos.z + s.dir.z * Math.max(0, s.d);
      draw(hx, hz, s.kind === 'post' ? .55 + (s.d / s.len) * (s.obj.ring.y * .55 - .55) : .5);
    },
    dispose() { off(); for (const p of posts) ctx.solid(p.x, p.z, false); },
  };
}
