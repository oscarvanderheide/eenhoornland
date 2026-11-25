// Every island has a toy of its own. None of it is needed for the adventure, none of it can go wrong, and nothing here
// moves until a child does something:
//   dorp     a watering can (filled at the pond or the fountain) and flower pots that grow, a stall where coins buy
//            things to wear
//   bos      somebody is hiding in the bushes
//   wei      a kite that flies when you run, dandelions to blow
//   strand   a bucket for sand towers (jump on them to flatten them)
//   eiland   puddles of paint: coloured footprints, and two colours make a third
//   kasteel  tap the castle and somebody looks out of a window
// The bike's trailer and the boat live in world-play.js; the playground (swing, slide) is world-speeltuin.js. What should stay the way the children left it (the
// plants, the sand towers, what they bought) is saved by quest.js first and drawn after.
import * as PX from './pixel.js';
import * as ART from './art.js';
import * as MAP from './map.js';
import * as Q from './quest.js';
import { sfx } from './audio.js';

export function createToys(ctx) {
  const { THREE, scene, M, tex, makeSprite, pick, burst, bubble, kid, animals } = ctx;
  const rnd = (a, b) => a + Math.random() * (b - a), v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const near = (x, z, r) => Math.hypot(x - kid.pos.x, z - kid.pos.z) < r;
  const zoneOf = (x, z) => M.zone[M.I(x, z)];
  const texs = new Map(), texOf = art => { if (!texs.has(art)) texs.set(art, tex(art)); return texs.get(art); };
  /** give a sprite another picture */
  function setArt(mesh, art) { const t = texOf(art); mesh.material.map = t; mesh.material.emissiveMap = t; mesh.customDepthMaterial.map = t; mesh.geometry = ctx.spriteGeom(art.width, art.height); mesh.userData.alpha = art; }
  const sprite = (art, x, z, o = {}) => { const m = makeSprite(art, { lean: .3, ...o }); m.position.set(x, o.y || 0, z); m.userData.alpha = art; scene.add(m); return m; };
  const tappable = (m, fn) => { m.userData.tap = fn; pick.push(m); return m; };
  const bit = (...a) => ctx.life.bit(...a);
  /** squash and stretch for a moment: the way everything here says "you touched me" */
  const pops = [];
  function pop(o, amp = .3) { o.pop = 0; o.amp = amp; if (!pops.includes(o)) pops.push(o); }

  /* ================= things she can carry: watering can, bucket, kite ================= */
  const things = {}; let carry = null;
  function thing(id, art, [x, z], scale = 1.1) {
    const t = things[id] = { id, art, m: sprite(art, x, z, { scale }), x, z, scale, tilt: 0 };
    tappable(t.m, () => { if (carry === t) return putDown(); sfx.pop(); pop(t); near(t.x, t.z, 1.5) ? take(t) : ctx.approach(Math.floor(t.x), Math.floor(t.z), () => take(t)); });
    return t;
  }
  function take(t) { if (carry === t) return; if (carry) putDown(true); carry = t; t.m.castShadow = false; kid.hop = .5; sfx.pop(); if (t === kite) { sfx.whoosh(); kiteP.set(kid.pos.x, .4, kid.pos.z); } }
  function putDown(quiet = false) {
    const t = carry; if (!t) return;
    if (!quiet && t === bucket) { const a = sandAhead(); if (a) { build(a[0], a[1]); return; } }   // on the sand, "put it down" is: flip it over, a tower
    carry = null;
    let x = kid.pos.x + kid.face * .55, z = kid.pos.z + .12; if (!ctx.walkable(Math.floor(x), Math.floor(z))) { x = kid.pos.x; z = kid.pos.z + .05; }
    t.x = x; t.z = z; t.m.position.set(x, 0, z); t.m.rotation.set(-.3, 0, 0); t.m.scale.set(t.scale, t.scale, 1); t.m.castShadow = true; t.tilt = 0; pop(t); if (!quiet) sfx.pop();
    if (t === kite) { line.visible = false; for (const b of tail) b.m.visible = false; }
  }
  const can = thing('gieter', ART.gieter(false), MAP.CAN), bucket = thing('emmer', ART.emmer(), MAP.BUCKET), kite = thing('vlieger', ART.vlieger(), MAP.KITE, 1.2);
  can.water = 0;

  /* ================= dorp: water makes the flower pots grow ================= */
  const P = MAP.POND, F = MAP.FOUNT;
  function fill() {
    if (carry !== can || can.water >= 3) return false;
    can.water = 3; setArt(can.m, ART.gieter(true)); sfx.splash(); sfx.bubble(); kid.hop = .6; kid.hopH = .45; can.tilt = .8; pop(can, .5); bubble(kid, '', ART.gieter(true)); setTimeout(() => sfx.chime(5), 250);   // glug glug: she dips it in, it is full, and she shows it
    for (let i = 0; i < 4; i++) bit(ART.drop(), kid.pos.x + kid.face * .4 + rnd(-.2, .2), .7, kid.pos.z + .15, { vx: rnd(-.8, .8), vy: rnd(1.5, 2.5), g: 7, life: .7 }); return true;
  }
  /** tip the can over (x, z). Returns false, with a hint where water comes from, when it is empty. */
  function pour(x, z) {
    kid.face = x >= kid.pos.x ? 1 : -1;
    if (!can.water) { can.tilt = .5; sfx.pop(); bit(ART.drop(), kid.pos.x + kid.face * .7, .6, kid.pos.z + .15, { g: 5, life: .6 }); bubble(kid, '', ART.drop()); return false; }
    can.water--; can.tilt = .9; sfx.splash(); if (!can.water) setArt(can.m, ART.gieter(false));
    for (let i = 0; i < 7; i++) setTimeout(() => bit(ART.drop(), x + rnd(-.2, .2), .75, z + .1, { vx: rnd(-.3, .3), vy: 0, g: 6, life: .55 }), i * 70);
    return true;
  }
  const pots = MAP.POTS.map(([x, z], i) => {
    const p = { i, x, z, m: sprite(ART.pot(Q.plant(i), i), x, z, { scale: 1.25 }) };
    tappable(p.m, () => { pop(p, .15); near(p.x, p.z + .5, 1.4) ? usePot(p) : ctx.approach(Math.floor(p.x), Math.floor(p.z), () => usePot(p)); });
    ctx.solid(Math.floor(x), Math.floor(z));                                          // a pot stands in the way: she walks up to it, not into it
    return p;
  });
  function usePot(p) {
    const st = Q.plant(p.i), here = v3(p.x, .5, p.z);
    if (carry === can && !can.water && st < Q.PLANT_MAX) {                             // no water in it: off to the fountain first, then back to this pot
      sfx.pop(); bubble(kid, '', ART.drop()); fetching = p;
      ctx.approach(Math.floor(F.cx), Math.floor(F.cz), () => {}); return;
    }
    if (carry === can && st < Q.PLANT_MAX) {
      if (performance.now() - lastPour < 900) return;                                 // one pour at a time (walking up and a tap can both ask)
      if (!pour(p.x, p.z)) return; lastPour = performance.now();
      setTimeout(() => {
        if (Q.water(p.i)) { setArt(p.m, ART.pot(Q.plant(p.i), p.i)); pop(p, .45); sfx.chime(Q.plant(p.i) * 2); if (Q.plant(p.i) >= Q.PLANT_MAX) { sfx.sparkle(); burst(here, 8, true); } }
        else { pop(p, .3); sfx.chime(7); burst(here, 4, true); }                    // already in bloom: it simply likes the water
      }, 450);
    } else if (st >= Q.PLANT_MAX) {                                                   // picked: she smells it... and sneezes, and the petals fly everywhere
      kid.face = p.x >= kid.pos.x ? 1 : -1; Q.pluck(p.i); setArt(p.m, ART.pot(0, p.i)); pop(p, .4); sfx.chime(4);
      const fl = ART.itemArt('bloem', [1, 0, 2, 4][p.i % 4]), f = bit(fl, kid.pos.x + kid.face * .3, .75, kid.pos.z + .15, { g: 0, life: 1.4 });
      setTimeout(() => { sfx.boing(); kid.hop = 1; kid.hopH = .5; f.life = 0; bubble(kid, '!');
        for (let i = 0; i < 12; i++) bit(PX.gridSprite(2, 2, () => ['#FF8FB1', '#FFD43B', '#FFFFFF'][i % 3], { outline: false, key: 'petal' + (i % 3) }), kid.pos.x + kid.face * .3, .8, kid.pos.z + .15, { vx: kid.face * rnd(.5, 3), vy: rnd(.5, 2.5), g: .8, sway: rnd(2, 4), life: rnd(1.2, 2) });
      }, 900);
    } else { sfx.pop(); bubble(kid, '', ART.gieter(true)); pop(can, .5); }              // it is thirsty: the can wiggles (and glows)
  }
  /** the flower pot right in front of her (or null) */
  const potNear = (r = 1.25) => pots.map(p => [p, Math.hypot(p.x - kid.pos.x, p.z + .3 - kid.pos.z)]).filter(([, d]) => d < r).sort((a, b) => a[1] - b[1]).map(([p]) => p)[0] || null;
  let lastPour = -1e9;
  const syncPots = () => { for (const p of pots) setArt(p.m, ART.pot(Q.plant(p.i), p.i)); };

  /* ================= strand: sand towers ================= */
  const towers = new Map(), sandOK = (x, z) => M.inb(x, z) && M.ground[M.I(x, z)] === MAP.SA && zoneOf(x, z) === 'strand' && ctx.walkable(x, z);
  function syncSand() {
    const want = new Map(Q.quest.sand.map(([x, z, l]) => [x + ',' + z, [x, z, l]]));
    for (const [k, t] of towers) if (!want.has(k)) { scene.remove(t.m); const i = pick.indexOf(t.m); if (i >= 0) pick.splice(i, 1); towers.delete(k); }
    for (const [k, [x, z, l]] of want) {
      let t = towers.get(k);
      if (!t) { t = { x, z, l, m: sprite(ART.zandtoren(l), x + .5, z + .6, { scale: 1.15 }) }; towers.set(k, t); tappable(t.m, () => tapTower(t)); pop(t, .5); }
      else if (t.l !== l) { t.l = l; setArt(t.m, ART.zandtoren(l)); pop(t, .5); }
    }
  }
  function build(x, z) {
    kid.face = x + .5 >= kid.pos.x ? 1 : -1; bucket.tilt = .7;
    const l = Q.buildSand(x, z); if (!l) { const t = towers.get(x + ',' + z); if (t) pop(t, .2); sfx.pop(); return; }
    syncSand(); sfx.brush(); sfx.pop(); kid.hop = .4;
    for (let i = 0; i < 5; i++) bit(sandGrain, x + .5 + rnd(-.4, .4), .3, z + .7, { vx: rnd(-1, 1), vy: rnd(1, 2), g: 7, life: .6 });
    if (l >= Q.SAND_MAX) { sfx.sparkle(); burst(v3(x + .5, .6, z + .6), 8); }
  }
  const sandGrain = PX.gridSprite(2, 2, () => '#E8C88E', { outline: false });
  function tapTower(t) {
    if (carry === bucket) { ctx.approach(t.x, t.z, () => build(t.x, t.z)); return; }
    pop(t, .25); sfx.pop(); if (t.l < Q.SAND_MAX) { bubble(kid, '', ART.emmer()); pop(bucket, .5); }
  }
  /** with the bucket: the sand tile in front of her where a (taller) tower can go, or null */
  function sandAhead() {
    if (carry !== bucket) return null;
    for (const t of towers.values()) if (t.l < Q.SAND_MAX && near(t.x + .5, t.z + .5, 1.2)) return [t.x, t.z];
    const x = Math.floor(kid.pos.x + kid.face * 1.05), z = Math.floor(kid.pos.z), t = towers.get(x + ',' + z);
    return sandOK(x, z) && (!t || t.l < Q.SAND_MAX) ? [x, z] : null;
  }
  /** a tap on the ground: with the bucket in her hands, a tap on the sand builds a tower there */
  function tapGround(x, z) {
    if (carry !== bucket || !sandOK(x, z)) return false;
    sfx.click(); ctx.showMarker(x + .5, z + .5); ctx.approach(x, z, () => build(x, z)); return true;
  }
  /** the jump button: jumping next to a sand tower flattens it (and nobody minds) */
  /* ================= everywhere: rain puddles. Walk through one and it splashes a little, jump in it and it splashes a lot ================= */
  const pools = M.puddles.map(([x, z]) => ({ x: x + .5, z: z + .5, m: sprite(ART.propArt('plas'), x + .5, z + .94, { lean: Math.PI / 2, shadow: false, y: .02 }), in: false }));
  for (const p of pools) tappable(p.m, () => ctx.walkToTile(Math.floor(p.x), Math.floor(p.z)));
  function splash(p, big) {
    sfx.splash(); pop(p, big ? .45 : .2); if (big) { sfx.bubble(); burst(v3(p.x, .2, p.z), 6); }
    for (let i = 0; i < (big ? 16 : 5); i++) bit(ART.drop(), p.x + rnd(-.35, .35), .12, p.z + .12, { vx: rnd(-1, 1) * (big ? 3.2 : 1.4), vy: rnd(1.5, big ? 5.5 : 2.6), g: 10, life: big ? 1 : .6 });
    if (big) for (const a of animals) if (!a.held && !a.fly && !a.cart && Math.hypot(a.pos.x - p.x, a.pos.z - p.z) < 3.5) { a.hop = 1; a.face = a.pos.x >= p.x ? 1 : -1; }   // whoever stands close gets wet and jumps
  }
  /** a puddle or sand tower to jump on right here (the action button jumps then) */
  const stompable = () => pools.some(p => near(p.x, p.z, .75)) || [...towers.values()].some(t => near(t.x + .5, t.z + .5, 1.15));
  function stomp() {
    for (const p of pools) if (near(p.x, p.z, .75)) { setTimeout(() => splash(p, true), 330); return true; }
    for (const t of towers.values()) if (near(t.x + .5, t.z + .5, 1.15)) {
      setTimeout(() => {
        if (!Q.stompSand(t.x, t.z)) return; syncSand(); sfx.whoosh(); sfx.brush();
        for (let i = 0; i < 12; i++) bit(sandGrain, t.x + .5 + rnd(-.4, .4), rnd(.1, .7), t.z + .7, { vx: rnd(-2.5, 2.5), vy: rnd(1, 3.5), g: 8, life: .8 });
      }, 300); return true;
    }
    return false;
  }

  /* ================= bos: who is hiding in the bushes? ================= */
  const hides = MAP.HIDES.map(([x, z], k) => {
    let t = ctx.walkable(x, z) ? [x, z] : ctx.nearestWalkable(x + .5, z + .5); if (!t || zoneOf(t[0], t[1]) !== 'bos') return null;
    // a bush is solid: she walks round it. Where that would close a way, it stands a tile further (the world is reshuffled every cycle)
    const spot = [[0, 0], [0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]].map(([dx, dz]) => [t[0] + dx, t[1] + dz]).find(([a, b]) => ctx.walkable(a, b) && zoneOf(a, b) === 'bos' && ctx.solid(a, b)); if (spot) t = spot;
    const h = { x: t[0] + .5, z: t[1] + .62, m: sprite(PX.bush(2 + k % 3), t[0] + .5, t[1] + .62, { lean: .25, scale: 1.2 }), who: null };
    tappable(h.m, () => rustle(h, true)); return h;
  }).filter(Boolean);
  const HIDERS = [[ART.squirrel(), 'pop'], [PX.hedgehog(), 'pop'], [PX.bunny(), 'boing']];
  const hiders = hides.length < 4 ? [] : HIDERS.map(([art, snd], k) => {
    const h = { m: sprite(ART.hd(art), 0, 0, { lean: .25, shadow: false, scale: .5 }), snd, at: hides[k * 2], state: 'hid', t: rnd(0, 3), peek: 0, pos: v3(0, 0, 0), dir: 1 };
    h.at.who = h; return h;
  });
  function rustle(hide, tapped) {
    pop(hide, .35); sfx.brush(); ctx.life.leaves(hide.x, hide.z, 3, .5);
    const h = hide.who; if (!h || h.state !== 'hid') return;
    // found! Out she jumps, laughs, and runs off to hide somewhere else
    h.state = 'out'; h.t = 0; h.dir = kid.pos.x > hide.x ? -1 : 1; h.from = v3(hide.x, .3, hide.z - .1); h.to = v3(hide.x + h.dir * .9, 0, hide.z + .5);
    hide.who = null; sfx[h.snd](); sfx.chime(6); burst(v3(hide.x, .8, hide.z), 6, true); if (tapped) kid.hop = .5;
  }

  /* ================= wei: a kite, and dandelions ================= */
  const kiteP = v3(0, 0, 0), lineGeo = new THREE.BufferGeometry().setFromPoints([v3(0, 0, 0), v3(0, 1, 0)]);
  const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: '#FFFFFF' })); line.visible = false; line.frustumCulled = false; scene.add(line);
  const tail = [0, 1, 2].map(k => ({ m: sprite(ART.strikje(k), 0, 0, { lean: 0, shadow: false, scale: .8 }), p: v3(0, 0, 0) })); for (const b of tail) b.m.visible = false;
  const weiSpots = M.spawns.bloem.filter(([x, z]) => zoneOf(x, z) === 'wei');
  const puffs = weiSpots.slice(-7).map(([x, z]) => { const d = { x: x + .5, z: z + .6, full: true, back: 0, m: sprite(ART.pluis(true), x + .5, z + .6, { shadow: false, scale: 1.1 }) }; tappable(d.m, () => near(d.x, d.z, 1.3) ? blow(d) : ctx.approach(Math.floor(d.x), Math.floor(d.z), () => blow(d))); return d; });
  function blow(d) {
    pop(d, .3); if (!d.full) return; d.full = false; d.back = 40; setArt(d.m, ART.pluis(false)); sfx.brush();
    for (let i = 0; i < 9; i++) bit(ART.pluisje(), d.x + rnd(-.15, .15), .45 + rnd(0, .15), d.z + .05, { vx: rnd(.4, 1.6), vy: rnd(.3, 1), g: -.25, sway: rnd(1.5, 3), life: rnd(2, 3.4) });
  }

  /* ================= eiland: puddles of paint ================= */
  const MIX = { '0,1': '#FF9A3C', '1,2': '#5DC88A', '0,2': '#9B72E8' };
  const puddles = MAP.PAINT.map(([x, z], k) => {
    const t = ctx.walkable(Math.floor(x), Math.floor(z)) ? [Math.floor(x), Math.floor(z)] : ctx.nearestWalkable(x, z); if (!t) return null;
    const m = sprite(ART.verfplas(ART.PAINTS[k]), t[0] + .5, t[1] + .94, { lean: Math.PI / 2, shadow: false, y: .022 });
    const p = { k, x: t[0] + .5, z: t[1] + .5, m, in: false }; tappable(m, () => ctx.walkToTile(t[0], t[1])); return p;
  }).filter(Boolean);
  const NP = 110, printGeo = new THREE.PlaneGeometry(.2, .3); printGeo.rotateX(-Math.PI / 2);
  const prints = new THREE.InstancedMesh(printGeo, new THREE.MeshBasicMaterial({ color: '#FFFFFF' }), NP), printAt = [], pd = new THREE.Object3D(), pc = new THREE.Color();
  for (let i = 0; i < NP; i++) { pd.position.set(0, -5, 0); pd.updateMatrix(); prints.setMatrixAt(i, pd.matrix); prints.setColorAt(i, pc.set('#FFFFFF')); printAt.push(null); }
  prints.frustumCulled = false; scene.add(prints);
  let paint = null, printI = 0, lastPrint = v3(0, 0, 0), side = 1, clock = 0;
  function stepIn(p) {
    const fresh = !paint || paint.left <= 0 || paint.base.includes(p.k);
    if (fresh) paint = { base: [p.k], left: 45, n: 0 }; else { paint.base.push(p.k); paint.left = 45; }
    sfx.splash(); kid.hop = .4; pop(p, .25);
    for (let i = 0; i < 6; i++) bit(PX.gridSprite(2, 2, () => ART.PAINTS[p.k], { outline: false, key: 'spat' + p.k }), p.x + rnd(-.3, .3), .15, p.z + .1, { vx: rnd(-1.8, 1.8), vy: rnd(1.5, 3), g: 9, life: .6 });
    if (paint.base.length >= 3) { sfx.sparkle(); burst(v3(p.x, .5, p.z), 8); }      // all three: a rainbow
  }
  const paintCol = () => paint.base.length >= 3 ? PX.RAINBOW[paint.n % 6] : paint.base.length === 2 ? MIX[[...paint.base].sort().join(',')] : ART.PAINTS[paint.base[0]];
  function stamp(dx, dz) {
    const l = Math.hypot(dx, dz) || 1, i = printI++ % NP; side = -side; paint.left--; paint.n++;
    printAt[i] = { x: kid.pos.x - dz / l * .13 * side, z: kid.pos.z + dx / l * .13 * side + .12, a: Math.atan2(dx, dz), born: clock };
    prints.setColorAt(i, pc.set(paintCol())); prints.instanceColor.needsUpdate = true;
  }

  /* ================= kasteel: somebody looks out of a window ================= */
  // (the two windows beside the gate, and three places on top of the wall; the outer windows are behind the towers)
  const C = MAP.CASTLE, WINS = [[.34, 1.42, .3, .04], [.66, 1.42, .3, .04], [.25, 2.72, .42, -.3], [.5, 2.72, .42, -.3], [.75, 2.72, .42, -.3]].map(([f, y, s, dz]) => ({ x: C.x + C.w * f, y, s, z: C.z + C.d + dz, busy: null }));
  const PEEK = [[PX.cat(), 'purr'], [ART.dragon(), 'boing'], [PX.bunny(), 'boing'], [PX.duck(), 'pop'], [PX.puppy(), 'boing'], [PX.cat('#F5B83D'), 'purr']];
  const peekers = []; let peekN = Math.floor(Math.random() * PEEK.length);
  /** h: where the castle was tapped (the nearest free window answers) */
  function peek(h) {
    const hx = h && h.point ? h.point.x : C.x + C.w * Math.random(), free = WINS.filter(w => !w.busy).sort((a, b) => Math.abs(a.x - hx) - Math.abs(b.x - hx));
    if (!free.length) return; const w = free[0], [art, snd] = PEEK[peekN++ % PEEK.length];
    const m = sprite(ART.hd(art), w.x, w.z, { lean: 0, shadow: false, scale: w.s, y: w.y }); m.material = m.material.clone(); m.material.emissiveIntensity = .6;
    w.busy = { m, t: 0, w, base: w.s }; peekers.push(w.busy); sfx[snd](); sfx.chime(peekN % 8);
  }

  /* ================= dorp: the stall ================= */
  // a real little booth (boxes, so it has depth): a dark back wall with bunting, a painted counter, white posts and a
  // striped awning. The snowy owl stands on the counter in front, with the crown and the bow beside her, so all three
  // stand out against the dark wall. A tap on any of it opens the stall (from right in front of it)
  const S = MAP.STALL, booth = new THREE.Group(), stall = { m: booth };
  booth.position.set(S.x + S.w / 2, 0, S.z + .5); scene.add(booth);
  let stallT = 3;
  const openStall = () => ctx.onShop();
  function visitStall() {
    sfx.pop(); pop(stall, .08);
    const at = Math.floor(kid.pos.z) === S.z + 1 && Math.floor(kid.pos.x) >= S.x && Math.floor(kid.pos.x) < S.x + S.w;
    at ? openStall() : ctx.walkThen(S.x + (kid.pos.x > S.x + 1 ? 1 : 0), S.z + 1, openStall);
  }
  const face = (art, opts = {}) => new THREE.MeshLambertMaterial({ map: tex(art), alphaTest: .5, ...opts });
  const white = new THREE.MeshLambertMaterial({ color: '#F4EDE4' }), plum = new THREE.MeshLambertMaterial({ color: '#3B2A4E' }), mint = new THREE.MeshLambertMaterial({ color: '#A8E6CF' });
  function part(w, h, d, x, y, z, mat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w / 16, h / 16, d / 16), mat); m.position.set(x / 16, y / 16, z / 16);
    m.castShadow = m.receiveShadow = true; booth.add(m); tappable(m, visitStall); m.userData.icon = ART.uil(); return m;
  }
  part(34, 32, 2, 0, 16, -6, [white, white, plum, white, face(ART.kraamWand()), white]);                      // back wall
  part(34, 10, 13, 0, 5, 1.5, [mint, mint, new THREE.MeshLambertMaterial({ color: '#FFFFFF' }), mint, face(ART.kraamToonbank()), mint]);   // counter
  for (const x of [-16, 16]) { part(2, 40, 2, x, 20, 7, white); part(2, 40, 2, x, 20, -5, white); }        // posts
  const awn = face(ART.kraamLuifel(), { side: THREE.DoubleSide }), stripes = new THREE.MeshLambertMaterial({ color: '#FF7EB6' });
  const roof = part(36, 2, 15, 0, 41, 1, [stripes, stripes, awn, stripes, stripes, stripes]); roof.rotation.x = .18;   // the awning slopes down to the front
  const edge = tex(ART.kraamLuifel()); edge.repeat.set(1, .5);   // only the scalloped bottom of the awning hangs down at the front
  const valance = new THREE.Mesh(new THREE.PlaneGeometry(36 / 16, 5 / 16), new THREE.MeshLambertMaterial({ map: edge, alphaTest: .5, side: THREE.DoubleSide })); valance.position.set(0, 38 / 16, 8.6 / 16); valance.castShadow = true; booth.add(valance); tappable(valance, visitStall);
  const owl = makeSprite(ART.hd(ART.uil()), { lean: .15, scale: .5 }); owl.position.set(0, 10 / 16, 4 / 16); booth.add(owl); tappable(owl, visitStall); owl.userData.alpha = ART.hd(ART.uil());
  for (const [art, x] of [[ART.wearIcon('kroon'), -.66], [ART.wearIcon('strik'), .66]]) {             // the things she can buy, on the counter
    const m = makeSprite(ART.hd(art), { lean: .2, scale: .5 * 1.1 }); m.position.set(x, 10 / 16, 5 / 16); booth.add(m); tappable(m, visitStall); m.userData.alpha = ART.hd(art);
  }
  /* the balloon from the stall floats along above her */
  const balloon = { m: sprite(PX.balloon('#FF6B6B'), 0, 0, { lean: .15, shadow: false, scale: 1.1 }), p: v3(kid.pos.x, 1.6, kid.pos.z), up: 0 };
  tappable(balloon.m, () => { balloon.up = 1; sfx.boing(); });

  /* ================= what to do next shows itself ================= */
  // While she is near the watering can or the bucket, the next step of that toy glows softly: the can; with an empty
  // can, the fountain; with water in it, a thirsty pot; the bucket; with the bucket, a see-through tower on the sand
  // in front of her. Nothing has to be worked out, and only the toy she is next to shows anything.
  let fetching = null;
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,250,215,1)'); r.addColorStop(.35, 'rgba(255,226,122,.5)'); r.addColorStop(1, 'rgba(255,200,90,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const beckon = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true })); beckon.visible = false; beckon.renderOrder = 5; scene.add(beckon);
  /** the tower that would stand there, as a dotted white outline: clearly "not there yet" */
  const ghostArt = l => PX.gridSprite(ART.zandtoren(l).width, ART.zandtoren(l).height, (() => { const c = ART.zandtoren(l), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, a = (x, y) => x >= 0 && y >= 0 && x < c.width && y < c.height && d[(y * c.width + x) * 4 + 3] > 0;
    return (x, y) => !a(x, y) ? null : (!a(x - 1, y) || !a(x + 1, y) || !a(x, y - 1) || !a(x, y + 1)) ? '#FFFFFF' : (x + y) % 2 === 0 ? '#FFF1CF' : null; })(), { outline: false, key: 'ghost' + l });
  const ghost = makeSprite(ghostArt(1), { lean: .3, shadow: false, scale: 1.15 }); ghost.visible = false; scene.add(ghost);
  function nextStep() {
    if (carry === can) {
      if (!can.water) return near(P.cx, P.cz, 4) ? null : [F.cx, 1.1, F.cz + .3, 2.4];
      const thirsty = pots.filter(p => Q.plant(p.i) < Q.PLANT_MAX).sort((a, b) => Math.hypot(a.x - kid.pos.x, a.z - kid.pos.z) - Math.hypot(b.x - kid.pos.x, b.z - kid.pos.z))[0];
      return thirsty ? [thirsty.x, .55, thirsty.z - .05, 1.3] : null;
    }
    if (!carry && near(can.x, can.z, 6) && pots.some(p => Q.plant(p.i) < Q.PLANT_MAX)) return [can.x, .4, can.z - .05, 1.3];
    if (!carry && near(bucket.x, bucket.z, 6)) return [bucket.x, .4, bucket.z - .05, 1.3];
    return null;
  }

  const off = Q.on(type => { if (type === 'garden' || type === 'day') syncPots(); if (type === 'sand' || type === 'day' || type === 'stage') syncSand(); });
  syncSand();

  return {
    dispose: off, peek, stomp, stompable, tapGround, putDown, fountain: fill,
    /** the colour of the paint puddle at (x, z), or null (world-life.js: animals that land or walk in it) */
    paintAt: (x, z) => { const p = puddles.find(p => Math.abs(p.x - x) < .8 && Math.abs(p.z - z) < .55); return p ? ART.PAINTS[p.k] : null; },
    carrying: () => carry && carry.id,
    /** for the action button: the picture of what she carries, or of the thing she could pick up here (or null) */
    carryArt: () => carry && carry.art, nearArt() { for (const t of Object.values(things)) if (t !== carry && near(t.x, t.z, 1.5)) return t.art; return null; },
    /** dev / tests */
    nearUse() { if (carry !== can) return null; const p = potNear(1.4); return p ? { key: 'water', art: ART.gieter(!!can.water), run: () => usePot(p) } : null; },
    bumpAt(x, z) { if (carry !== can) return false; const p = pots.find(p => Math.floor(p.x) === x && Math.floor(p.z) === z); if (!p) return false; usePot(p); return true; },
    nearest() { let b = null; for (const t of Object.values(things)) { if (t === carry) continue; const d = Math.hypot(t.x - kid.pos.x, t.z - kid.pos.z); if (d < 1.5 && (!b || d < b.d)) b = { id: t.id, art: t.art, d }; } return b; },
    take: id => take(things[id]), takeNear() { for (const t of Object.values(things)) if (t !== carry && near(t.x, t.z, 1.5)) { take(t); return true; } return false; }, usePot: i => usePot(pots[i]), build, rustle: i => rustle(hides[i], true), blow: i => blow(puffs[i]), openStall,
    info: () => ({ ahead: sandAhead(), carry: carry && carry.id, water: can.water, pots: pots.map(p => Q.plant(p.i)), towers: [...towers.values()].map(t => [t.x, t.z, t.l]), hides: hides.map(h => [h.x, h.z, !!h.who]), hiders: hiders.map(h => h.state), puffs: puffs.map(d => [d.x, d.z, d.full]), puddles: puddles.map(p => [p.x, p.z]), paint: paint && { base: paint.base, left: paint.left }, prints: printAt.filter(Boolean).length, peekers: peekers.length, kite: [kiteP.x, kiteP.y, kiteP.z], things: Object.values(things).map(t => [t.id, t.x, t.z]) }),
    /** with a full can in her hands, a tap on an animal waters it. Returns true if it handled the tap. */
    tapAnimal(c) {
      if (carry !== can) return false; if (!near(c.pos.x, c.pos.z, 2.2)) { ctx.approach(Math.floor(c.pos.x), Math.floor(c.pos.z), () => this.tapAnimal(c)); return true; }
      if (!pour(c.pos.x, c.pos.z)) return true;
      setTimeout(() => {
        (sfx[c.sound] || sfx.pop)(); c.hop = 1;
        if (c.water) { c.hopH = .6; burst(c.pos, 6, true); }                           // ducks love it
        else if (c.name === 'Varken' && c.dirty && ctx.farm) ctx.farm.wash(c);       // the muddy pig: clean and pink again
        else if (c.name === 'Poes') { c.hopH = 1.1; bubble(c, '!'); const t = ctx.randomTile(c); c.path = [v3(t[0] + .5, 0, t[1] + .5)]; c.wait = 3; }   // cats do not
        else { c.shake = .7; for (let i = 0; i < 6; i++) bit(ART.drop(), c.pos.x, .5, c.pos.z + .1, { vx: rnd(-2, 2), vy: rnd(1, 2.5), g: 8, life: .6 }); }
      }, 450); return true;
    },
    update(dt, time, active) {
      clock += dt;
      for (let i = pops.length - 1; i >= 0; i--) { const o = pops[i]; o.pop = Math.min(1, o.pop + dt * 2.4); const q = Math.sin(o.pop * Math.PI * 3) * o.amp * (1 - o.pop), s = o.scale || o.m.userData.s0 || (o.m.userData.s0 = o.m.scale.y); if (o !== carry) o.m.scale.set(s * (1 + q) * Math.sign(o.m.scale.x || 1), s * (1 - q), 1); if (o.pop >= 1) pops.splice(i, 1); }
      for (const a of animals) if (a.shake > 0) { a.shake -= dt; a.mesh.rotation.z = a.shake > 0 ? Math.sin(a.shake * 45) * .25 : 0; }
      /* in her hands */
      if (carry && carry !== kite) {
        const t = carry; t.tilt = Math.max(0, t.tilt - dt); t.x = kid.pos.x; t.z = kid.pos.z;
        t.m.position.set(kid.pos.x + kid.face * .4, kid.mesh.position.y + .26, kid.pos.z + (kid.zBias || 0) + .03); t.m.scale.set(-kid.face * t.scale * .85, t.scale * .85, 1); t.m.rotation.z = kid.face * -Math.min(1, t.tilt * 3) * .9;
        if (active && t === can && can.water < 3 && (Math.hypot((kid.pos.x - P.cx) / (P.rx + 1.1), (kid.pos.z - P.cz) / (P.rz + 1.1)) < 1 || Math.hypot(kid.pos.x - F.cx, kid.pos.z - F.cz - .6) < 1.9)) fill();
      }
      // with water in the can, coming up to a thirsty pot waters it by itself (as the can fills by itself at the water): a pour, a pause, a pour
      if (active && carry === can && can.water && !fetching && !kid.moving && !kid.path.length && performance.now() - lastPour > 1300) { const p = potNear(1.15); if (p && Q.plant(p.i) < Q.PLANT_MAX) usePot(p); }
      if (fetching && carry === can && can.water) { const p = fetching; fetching = null; setTimeout(() => near(p.x, p.z + .5, 1.4) ? usePot(p) : ctx.approach(Math.floor(p.x), Math.floor(p.z), () => usePot(p)), 350); }
      if (carry !== can) fetching = null;
      { const n = active ? nextStep() : null; beckon.visible = !!n; if (n) { const k = Math.sin(time * 3); beckon.position.set(n[0], n[1], n[2]); beckon.scale.setScalar(n[3] * (1 + .08 * k)); beckon.material.opacity = .5 + .22 * k; } }
      { const a = active && !kid.moving ? sandAhead() : null; ghost.visible = !!a; if (a) { const t = towers.get(a[0] + ',' + a[1]), l = t ? t.l + 1 : 1; if (ghost.userData.l !== l) { setArt(ghost, ghostArt(l)); ghost.userData.l = l; } ghost.position.set(a[0] + .5, 0, a[1] + .62 + (t ? .02 : 0)); ghost.position.y = Math.abs(Math.sin(time * 3)) * .05; } }
      /* the kite: up when she runs, down when she stands */
      if (carry === kite) {
        const fast = ctx.mount() ? 1.35 : 1, h = kid.moving ? 2.5 * fast : 1.25, k = Math.min(1, dt * 2.2);
        kiteP.x += (kid.pos.x - kid.face * (kid.moving ? 1.9 : .9) - kiteP.x) * k; kiteP.y += (h + Math.sin(time * 2.1) * .12 - kiteP.y) * k; kiteP.z += (kid.pos.z - .25 - kiteP.z) * k;
        kite.x = kid.pos.x; kite.z = kid.pos.z; kite.m.position.copy(kiteP); kite.m.rotation.set(-.2, 0, Math.sin(time * 2.6) * .16 - kid.face * .25); kite.m.scale.set(kite.scale, kite.scale, 1);
        const a = lineGeo.attributes.position; a.setXYZ(0, kid.pos.x + kid.face * .25, kid.mesh.position.y + .5, kid.pos.z + .05); a.setXYZ(1, kiteP.x, kiteP.y + .05, kiteP.z); a.needsUpdate = true; line.visible = true;
        let px = kiteP.x, py = kiteP.y, pz = kiteP.z; tail.forEach((b, i) => { const kk = Math.min(1, dt * (9 - i * 2)); b.p.x += (px + Math.sin(time * 5 + i) * .06 - b.p.x) * kk; b.p.y += (py - .26 - b.p.y) * kk; b.p.z += (pz - b.p.z) * kk; b.m.position.copy(b.p); b.m.visible = true; px = b.p.x; py = b.p.y; pz = b.p.z; });
      }
      /* hide and seek */
      for (const h of hiders) {
        h.t += dt; const hide = h.at;
        if (h.state === 'hid') {                                                      // only her ears show; she cannot keep quite still when someone is near
          const close = active && near(hide.x, hide.z, 5.5); h.peek = Math.max(0, h.peek - dt * 1.6);
          if (close && h.t > 3.2) { h.t = rnd(0, 1.2); h.peek = 1; pop(hide, .12); if (near(hide.x, hide.z, 3.5)) sfx.brush(); }
          h.m.position.set(hide.x, .2 + Math.sin(Math.min(1, h.peek) * Math.PI) * .22, hide.z - .1); h.m.scale.set(.5 * h.dir, .5, 1); h.m.rotation.z = 0;
          if (active && near(hide.x, hide.z, .95)) rustle(hide, false);   // bumping into the bush (it is solid) finds who hides in it
        } else if (h.state === 'out') {
          const k = Math.min(1, h.t / .45); h.pos.lerpVectors(h.from, h.to, k); h.m.position.set(h.pos.x, h.pos.y + Math.sin(k * Math.PI) * 1.1, h.pos.z); h.m.scale.set(.5 * h.dir, .5, 1); h.m.rotation.z = -h.dir * k * Math.PI * 2;
          if (k >= 1) { h.state = 'laugh'; h.t = 0; h.m.rotation.z = 0; bubble({ pos: h.pos, isUni: false }, '', PX.heart()); }
        } else if (h.state === 'laugh') {
          h.m.position.y = Math.abs(Math.sin(h.t * 9)) * .22;
          if (h.t > 1.3) { const free = hides.filter(x => !x.who && x !== h.at && !near(x.x, x.z, 3)); h.at = free.length ? free[Math.floor(Math.random() * free.length)] : hides.find(x => !x.who) || h.at; h.at.who = h; h.state = 'run'; h.t = 0; h.from = h.pos.clone(); h.dir = h.at.x >= h.pos.x ? 1 : -1; h.dur = Math.max(.5, h.from.distanceTo(v3(h.at.x, 0, h.at.z)) / 5.5); }
        } else {                                                                      // 'run': hop, hop, hop, and into the next bush
          const k = Math.min(1, h.t / h.dur); h.pos.lerpVectors(h.from, v3(h.at.x, 0, h.at.z - .1), k); h.m.position.set(h.pos.x, Math.abs(Math.sin(h.t * 11)) * .3 + (k > .9 ? (k - .9) * 2 : 0), h.pos.z); h.m.scale.set(.5 * h.dir, .5, 1);
          if (k >= 1) { h.state = 'hid'; h.t = 0; h.peek = 0; pop(h.at, .3); if (near(h.at.x, h.at.z, 7)) sfx.brush(); }
        }
      }
      /* dandelions grow back */
      for (const d of puffs) { if (!d.full && (d.back -= dt) < 0 && !near(d.x, d.z, 4)) { d.full = true; setArt(d.m, ART.pluis(true)); } else if (active && d.full && near(d.x, d.z, .6)) blow(d); }
      /* paint */
      if (active) for (const p of pools) { const inside = near(p.x, p.z, .6); if (inside && !p.in) splash(p, false); p.in = inside; }
      if (active) for (const p of puddles) { const inside = near(p.x, p.z, .62); if (inside && !p.in) stepIn(p); p.in = inside; }
      if (paint && paint.left > 0 && active && kid.hop <= 0) { const dx = kid.pos.x - lastPrint.x, dz = kid.pos.z - lastPrint.z, gap = ctx.mount() === 'fiets' ? .17 : .4; if (dx * dx + dz * dz > gap * gap) { stamp(dx, dz); lastPrint.copy(kid.pos); } } else if (!paint || paint.left <= 0) lastPrint.copy(kid.pos);
      for (let i = 0; i < NP; i++) { const p = printAt[i]; if (!p) continue; const age = clock - p.born, s = age < 40 ? 1 : Math.max(0, 1 - (age - 40) / 6); pd.position.set(p.x, .021, p.z); pd.rotation.set(0, p.a, 0); pd.scale.setScalar(Math.max(.001, s)); pd.updateMatrix(); prints.setMatrixAt(i, pd.matrix); if (s <= 0) printAt[i] = null; }
      prints.instanceMatrix.needsUpdate = true;
      /* castle windows */
      for (let i = peekers.length - 1; i >= 0; i--) {
        const p = peekers[i]; p.t += dt; const up = Math.min(1, p.t / .22), down = p.t > 2.3 ? Math.max(0, 1 - (p.t - 2.3) / .2) : 1, s = p.base * up * down;
        p.m.scale.set(Math.max(.001, s), Math.max(.001, s), 1); p.m.rotation.z = Math.sin(p.t * 7) * .22 * down; p.m.position.y = p.w.y + Math.abs(Math.sin(p.t * 5)) * .04;
        if (p.t > 2.5) { scene.remove(p.m); p.m.material.dispose(); p.w.busy = null; peekers.splice(i, 1); }
      }
      /* the stall waves when she could trade something */
      stallT -= dt; if (stallT < 0) { stallT = 5; if (active && near(S.x + 1, S.z + 1, 9) && Q.SHOP.some(it => Q.canBuy(it.id))) { pop(stall, .07); burst(v3(S.x + 1, 1.5, S.z + 1), 3); } }
      /* the balloon */
      const hasB = Q.wearing(ctx.who()).hand === 'ballon'; balloon.m.visible = hasB;
      if (hasB) { const b = balloon, k = Math.min(1, dt * 4); b.up = Math.max(0, b.up - dt * .8); b.p.x += (kid.pos.x - kid.face * .38 - b.p.x) * k; b.p.z += (kid.pos.z - .06 - b.p.z) * k; b.p.y += (kid.mesh.position.y + 1.05 + Math.sin(b.up * Math.PI) * .9 + Math.sin(time * 1.7) * .04 - b.p.y) * k; b.m.position.copy(b.p); b.m.rotation.z = (b.p.x - (kid.pos.x - kid.face * .38)) * .5; }
    },
  };
}
