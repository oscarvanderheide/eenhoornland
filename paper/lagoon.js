// The bathing lagoon on the beach (Oscar: "the beach area actually could use a nice area where people/animals are swimming
// and where we could swim as well"). A sheltered pool of pale water in the sand, a sand bar between it and the sea, the
// lifeguard on her chair at its east end. Anybody may swim in it: she walks in with a splash, no snorkel needed.
//   the girl in the ring    paddles round in the shallow west end. A tap: she waves and laughs, the water splashes
//   the grandpa             floats on his back at the east end, eyes shut. A tap: he blows a fountain like a whale, then
//                           wiggles his toes and waves
//   the snorkel boy         swims to and fro across the middle. A tap: face in, and he is under; only the tip of his
//                           snorkel goes across the water, then he comes up and blows the water out of it
//   the seal pup            paddles round the near side. A tap: it rolls over and claps; a tap while it claps and it dives,
//                           and comes up again beside her if she is in the water
//   the rubber duck         a big yellow one to ride. A tap: she climbs on (it squeaks) and sits; the stick, the arrows or a
//                           finger on the water paddle it about; a tap on her and she slides off into the water
// The swimmers wait while she is close by and look at her (the world waits for the child). They make a sound only when tapped.
import { THREE, paper, slab, blob, inPoly, edgeDist, whiteEdge } from './kit.js';
import { CARDS4 } from './cards4.js';

const WATER = '#a6dad5', DEEP = '#8fcdcb', WET = '#dcc08f', SPLASH = ['#8fc3cc', '#f6efe2', '#bfe6e2'];

/** the lagoon round (cx, cz), rx by rz (the set's measure), its water at height `y` (the sand's) */
export function lagoon(S, { y, cx, cz, rx, rz, seed = 571 }) {
  const { girl, sfx } = S, [ox, oz] = S.at([0, 0]), W = ([x, z]) => [x + ox, z + oz];
  const pts = blob(cx, cz, rx, rz, seed, 48, .04), grow = (p, d) => p.map(([x, z]) => { const dx = x - cx, dz = (z - cz) * rx / rz, l = Math.hypot(dx, dz) || 1; return [x + dx / l * d, z + dz / l * d * rz / rx]; });
  /* ---------------- the water: wet sand round it, the pale sheet with a white paper edge, a deeper middle ---------------- */
  S.root.add(slab(grow(pts, .2), y + .007, .007, paper(WET), paper(WET)));
  S.root.add(slab(pts, y + .022, .022, paper(WATER), whiteEdge));
  S.root.add(slab(pts.map(([x, z]) => [cx + (x - cx) * .62, cz + (z - cz) * .55]), y + .026, .004, paper(DEEP), paper(DEEP)));
  S.water(y, pts, true);   // open water: anybody swims here (paper.js: S.water)
  const TOP = y + .022, inside = (x, z, m = .45) => inPoly(pts, x, z) && edgeDist(pts, x, z) > m;   // (the set's measure)
  const near = (f, d) => Math.hypot(girl.x - f.x, girl.z - f.z) < d, local = (x, z) => [x - ox, z - oz];
  const inWater = () => !girl.lift && inside(...local(girl.x, girl.z), 0);
  /** a card floating in the water: its drawing's waterline `wl` (drawing units from the top) at the surface */
  const floater = (name, spec, wl) => { const f = S.figure(name, spec); f.base = TOP - (spec.h - wl) / spec.h * spec.size + .012; f.floatY = f.y = f.base; return f; };
  const bob = (f, time, ph, a = .014) => { f.floatY = f.base + Math.sin(time * 1.7 + ph) * a; };
  const splash = (x, z, n = 10, v = 2.2, up = .2) => S.confetti(x, TOP + up, z + .05, SPLASH, n, undefined, v);

  /* ---------------- who swims here ---------------- */
  // each goes round its own loop (`way(u)`: a place in the set's measure); it waits while she is close, and looks at her
  const swimmer = (name, spec, wl, way, speed, o = {}) => {
    const f = floater(name, spec, wl), q = { f, u: o.u || 0, mode: null, t: 0, taps: 0, wait: false, way, speed };
    [f.x, f.z] = W(way(q.u)); f.face = o.face || 1;
    q.go = dt => {   // along its loop, facing the way it goes
      const [x0] = W(way(q.u)); q.u += speed * dt; const [x, z] = W(way(q.u)); f.x = x; f.z = z; if (!o.face && Math.abs(x - x0) > 1e-4) f.face = Math.sign(x - x0);
    };
    q.look = () => { if (!o.face && Math.abs(girl.x - f.x) > .1) f.face = Math.sign(girl.x - f.x); };   // (the grandpa on his back does not turn round)
    q.idle = dt => { q.wait = near(f, 1.3); if (q.wait) q.look(); else q.go(dt); };
    return q;
  };
  const loop = (x, z, ax, az) => u => [x + Math.cos(u) * ax, z + Math.sin(u) * az];
  const L = rx / 3.05, Z = rz / 1.42;   // (the loops were laid out for a lagoon of 3.05 by 1.42)

  // they are laid out so the tall stand behind the small: the duck by the far bank, the swimmers before it, the pup nearest
  // the girl in the ring: round and round in the west end
  const kid = swimmer('zwemkind', CARDS4.zwemkind, 150, loop(cx - 2.2 * L, cz + .2 * Z, .42 * L, .28 * Z), .5);
  kid.f.onTap = () => { if (kid.mode) return; kid.mode = 'wave'; kid.t = 0; kid.taps++; kid.look(); kid.f.hopV = 1.6; sfx.hello(); splash(kid.f.x, kid.f.z, 12, 2.4, .3); };
  kid.f.act = tick => kid.f.setFrame(kid.mode === 'wave' ? 3 : kid.wait ? 0 : 1 + (Math.floor(tick / 4) % 2));

  // the grandpa on his back: hardly moves, turning slowly in the east end
  const pa = swimmer('drijver', CARDS4.drijver, 178, loop(cx + 1.85 * L, cz + .2 * Z, .2, .1), .1, { face: -1 });
  pa.f.onTap = () => { if (pa.mode) return; pa.mode = 'spout'; pa.t = 0; pa.taps++; sfx.whoosh(); };
  pa.f.act = () => pa.f.setFrame(pa.mode === 'spout' ? 1 : pa.mode === 'wiggle' ? 2 : 0);

  // the snorkel boy: to and fro across the middle; under water, only the tip of his snorkel goes along
  const A = [cx - .6 * L, cz - .05 * Z], B = [cx + .55 * L, cz];
  const fro = u => { const k = (1 - Math.cos(u)) / 2; return [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k + Math.sin(u * 2) * .06]; };
  const boy = swimmer('snorkelaar', CARDS4.snorkelaar, 194, fro, .38, { u: 2 });
  boy.f.onTap = () => { if (boy.mode) return; boy.mode = 'in'; boy.t = 0; boy.taps++; boy.from = boy.u; sfx.splash(); splash(boy.f.x, boy.f.z, 8, 1.8); };
  boy.f.act = () => boy.f.setFrame(boy.mode === 'in' ? 1 : boy.mode === 'under' ? 3 : boy.mode === 'up' ? 2 : 0);

  // the seal pup: round the near side
  const pup = swimmer('zeehondje', CARDS4.zeehondje, 116, loop(cx - .2 * L, cz + .85 * Z, 1.1 * L, .18 * Z), .55, { u: 1 });
  pup.f.onTap = () => {
    if (pup.mode === 'clap' && pup.t > .3) { pup.mode = 'dive'; pup.t = 0; pup.dives = (pup.dives || 0) + 1; sfx.splash(); splash(pup.f.x, pup.f.z, 12, 2.6); return; }
    if (pup.mode) return; pup.mode = 'clap'; pup.t = 0; pup.taps++; pup.look(); pup.f.hopV = 1.4; sfx.yip(); setTimeout(() => sfx.yip(), 260);
  };
  pup.f.act = tick => pup.f.setFrame(pup.mode === 'clap' ? (Math.floor(tick / 2) % 2 ? 1 : 0) : pup.mode === 'dive' ? 2 : 0);

  const swimmers = [kid, pa, boy, pup];
  const stepSwimmers = (dt, time) => {
    for (const [i, q] of swimmers.entries()) { const f = q.f; bob(f, time, i * 1.9); f.g.visible = true; f.sink = 0;
      if (!q.mode) { q.idle(dt); continue; }
      q.t += dt;
      if (q === kid && q.t > 1.8) q.mode = null;
      if (q === pa) { if (q.mode === 'spout') { if (Math.floor(q.t / .4) !== Math.floor((q.t - dt) / .4) && q.t < 1.4) { const p = f.point([270, 30]); S.confetti(p.x, p.y, p.z + .05, SPLASH, 6, undefined, 1.6); } if (q.t > 1.7) { q.mode = 'wiggle'; q.t = 0; f.hopV = 1.2; sfx.hello(); splash(f.x - f.face * .7, f.z, 6, 1.6); } }
        else if (q.t > 1.3) q.mode = null; }
      if (q === boy) {
        if (q.mode === 'in') { f.sink = Math.max(0, q.t - .25) * .6; if (q.t > .5) { q.mode = 'under'; q.t = 0; } }
        else if (q.mode === 'under') {   // the snorkel's tip crosses to the other end of his way
          q.u = q.from + Math.PI * Math.min(1, q.t / 2.4); const [x, z] = W(fro(q.u)), dx = x - f.x; if (Math.abs(dx) > 1e-4) f.face = Math.sign(dx); f.x = x; f.z = z;
          if (Math.floor(q.t / .5) !== Math.floor((q.t - dt) / .5)) S.confetti(f.x + f.face * .2, TOP + .1, f.z + .05, ['#f6efe2', '#cfeaf0'], 3, undefined, .9);
          if (q.t > 2.4) { q.mode = 'up'; q.t = 0; q.look(); f.hopV = 2.2; sfx.whoosh(); setTimeout(() => sfx.splash(), 120); const p = f.point([60, 70]); S.confetti(p.x, p.y, p.z + .05, SPLASH, 12, undefined, 2.4); } }
        else if (q.mode === 'up' && q.t > 1.5) q.mode = null; }
      if (q === pup) {
        if (q.mode === 'clap') { if (q.t > 1.8) q.mode = null; }
        else if (q.mode === 'dive') {
          if (q.t > .45 && q.t < 1.6) f.g.visible = false;
          if (q.t > .45 && !q.moved) {   // under: it comes up beside her if she is in the water, else across the lagoon
            q.moved = true; const [lx, lz] = local(girl.x, girl.z), by = [lx + (girl.face || 1) * .9, lz + .35];
            if (inWater() && inside(...by, .25)) { [f.x, f.z] = W(by); q.home = true; } else { q.u += Math.PI; [f.x, f.z] = W(q.way(q.u)); q.home = false; } }
          if (q.t > 1.6) { q.mode = q.home ? 'back' : null; q.t = 0; q.moved = q.home = false; q.look(); f.hopV = 2; sfx.yip(); splash(f.x, f.z, 10, 2.2); } }
        else if (q.mode === 'back') {   // (it came up beside her: it stays while she is there, then swims back onto its loop)
          q.wait = near(f, 1.6); if (q.wait) q.look();
          else { const [x, z] = W(q.way(q.u)), dx = x - f.x, dz = z - f.z, d = Math.hypot(dx, dz); if (d < .05) q.mode = null; else { const st = Math.min(d, .9 * dt); f.x += dx / d * st; f.z += dz / d * st; if (Math.abs(dx) > .02) f.face = Math.sign(dx); } } }
      }
    }
  };

  /* ---------------- the big rubber duck: she climbs on and paddles it about ---------------- */
  const duck = floater('badeend', CARDS4.badeend, 184), SEAT = .25, SPEED = 1.5;
  let mode = null, t = 0, vx = 0, vz = 0, rides = 0, bumps = 0, squeak = 0, from = null, alone = 0;
  const HOME = W([cx - 1.3 * L, cz - .6 * Z]); [duck.x, duck.z] = HOME; duck.face = 1;   // (it waits by the west end of the far bank: the tallest thing in the water, behind the swimmers)
  const seatAt = () => [duck.x - duck.face * .08, duck.z + .07];   // she sits in its middle, in front of its card
  const seat = () => { const [sx, sz] = seatAt(); girl.x = sx; girl.z = sz; girl.lift = TOP + SEAT - girl.y; girl.poseName = 'sit'; girl.view = 'side'; girl.face = duck.face; };
  const toy = { steer: true, look: [0, 0], at: () => [duck.x, duck.z],
    lets: o => swimmers.some(q => q.f.mesh === o),   // (from the duck she can still tap who swims by)
    step(dt, inp) {
    t += dt; toy.look = [duck.x, duck.z];
    if (mode === 'in') {   // she climbs up onto its back
      const k = Math.min(1, t / .5), [sx, sz] = seatAt(); girl.x = from[0] + (sx - from[0]) * k; girl.z = from[1] + (sz - from[1]) * k;
      girl.lift = Math.max(.001, Math.sin(k * Math.PI) * .45 + (TOP + SEAT - girl.y) * k); girl.poseName = k > .5 ? 'sit' : null; girl.view = 'side'; girl.face = duck.face;
      if (k >= 1) { mode = 'ride'; t = 0; vx = vz = 0; }
      return; }
    if (mode === 'ride') {
      const m = inp.move || (inp.x ? [inp.x, 0] : inp.y ? [0, inp.y] : null);   // (a finger close beside her steers too: that way on the screen)
      if (m) { const k = Math.min(1, dt * 2.4); vx += (m[0] * SPEED - vx) * k; vz += (m[1] * SPEED - vz) * k; } else { const k = Math.exp(-dt * 1.4); vx *= k; vz *= k; }
      // the edge: it slides along it, or bumps softly back (a way that leads away from the edge is always open)
      const room = (x, z) => { const [lx, lz] = local(x, z); return inPoly(pts, lx, lz) ? edgeDist(pts, lx, lz) : -1; }, r0 = room(duck.x, duck.z), fits = (x, z) => { const r = room(x, z); return r > .5 || r > r0 + 1e-4; };
      const nx = duck.x + vx * dt, nz = duck.z + vz * dt, sp = Math.hypot(vx, vz);
      if (fits(nx, nz)) { duck.x = nx; duck.z = nz; } else if (fits(nx, duck.z)) { duck.x = nx; vz = 0; } else if (fits(duck.x, nz)) { duck.z = nz; vx = 0; }
      else { if (sp > .7) { bumps++; sfx.thud(); splash(nx, nz, 6, 1.4); } vx *= -.25; vz *= -.25; }
      if (Math.abs(vx) > .15) duck.face = Math.sign(vx);
      if (sp > .5 && Math.floor(t * 1.5) !== Math.floor((t - dt) * 1.5)) { sfx.swish(1); splash(duck.x - duck.face * .6, duck.z, 4, 1.1, .1); }
      seat();
      if (inp.act) { mode = 'off'; t = 0; from = [girl.x, girl.z]; sfx.hop(); }   // a tap on her: off she slides
      return; }
    if (mode === 'off') {   // she slides off its side, towards the camera, into the water
      const k = Math.min(1, t / .45), [lx, lz] = local(from[0], from[1] + .6), to = inside(lx, lz, .15) ? [from[0], from[1] + .6] : [from[0] + duck.face * .9, from[1] - .1];
      girl.x = from[0] + (to[0] - from[0]) * k; girl.z = from[1] + (to[1] - from[1]) * k; girl.lift = Math.max(0, (TOP + SEAT - girl.y) * (1 - k) + Math.sin(k * Math.PI) * .25); girl.poseName = null;
      if (k >= 1) { mode = null; S.stopPlay(); } }
  } };
  const board = () => {
    if (S.playing() || mode) return;
    const side = girl.x < duck.x ? -1 : 1;
    S.walkThen(duck.x + side * .75, duck.z + .2, () => { if (S.playing() || mode) return; mode = 'in'; t = 0; rides++; from = [girl.x, girl.z]; squeak = .45; sfx.boing(); setTimeout(() => sfx.peep(), 120); S.play(toy); }, 1.1);
  };
  duck.onTap = board;
  duck.act = () => duck.setFrame(squeak > 0 ? 1 : 0);

  const waders = [], wet = new Map();
  return {
    pts, toy,
    /** somebody of this island who may walk into the water (the crab): there, they sit in it up to their middle */
    wade: f => { waders.push(f); },
    /** is this spot (the set's measure) in the lagoon or on its wet rim? (no holes dug there, no shells laid) */
    has: (x, z) => inPoly(pts, x, z) || edgeDist(pts, x, z) < .35,
    toys: { zwemkind: { f: kid.f, state: () => ({ mode: kid.mode, taps: kid.taps, frame: kid.f.frame, at: [kid.f.x, kid.f.z] }) },
      drijver: { f: pa.f, state: () => ({ mode: pa.mode, taps: pa.taps, frame: pa.f.frame, at: [pa.f.x, pa.f.z] }) },
      snorkelaar: { f: boy.f, state: () => ({ mode: boy.mode, taps: boy.taps, frame: boy.f.frame, sink: boy.f.sink, at: [boy.f.x, boy.f.z] }) },
      zeehondje: { f: pup.f, state: () => ({ mode: pup.mode, taps: pup.taps, dives: pup.dives || 0, frame: pup.f.frame, shown: pup.f.g.visible, at: [pup.f.x, pup.f.z] }) },
      badeend: { toy, state: () => ({ mode, rides, bumps, at: [duck.x, duck.z], face: duck.face, frame: duck.frame }) } },
    places: { lagoon: [cx - .4 * L, cz - rz - .55], swim: [cx, cz], duck: [cx - 1.3 * L, cz - .6 * Z] },
    /** the camera by the lagoon: a little lower and closer */
    shot: { name: 'lagune', zone: [cx - rx - .15, cz - rz - 1.1, cx + rx + .3, cz + rz + 1.2], span: 11.5, tall: 7, rise: .26 },
    step({ dt, time }) {
      stepSwimmers(dt, time);
      if (squeak > 0) squeak -= dt;
      bob(duck, time, 4.2, mode === 'ride' ? .02 : .012);
      // left out in the water, it drifts slowly back to its place by the bank once she has swum off (so it never hides the swimmers for long)
      alone = mode || near(duck, 2.5) ? 0 : alone + dt; const hx = HOME[0] - duck.x, hz = HOME[1] - duck.z, hd = Math.hypot(hx, hz);
      if (alone > 4 && hd > .05) { const st = Math.min(hd, .3 * dt); duck.x += hx / hd * st; duck.z += hz / hd * st; if (Math.abs(hx) > .05) duck.face = Math.sign(hx); }
      // who wanders into the water from the sand (the crab, following her) is in it up to its middle, with a splash
      for (const f of waders) { const w = inPoly(pts, ...local(f.x, f.z)); f.sink = w ? f.H * .42 : 0; if (w !== wet.get(f)) { if (wet.has(f)) splash(f.x, f.z, 6, 1.6); wet.set(f, w); } }
      if (mode === 'ride') duck.lean = Math.sin(time * 2.2) * .03 - vx * .02; else duck.lean = Math.sin(time * 1.3) * .02;
    },
  };
}
