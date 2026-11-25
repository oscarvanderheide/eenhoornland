// Things in the way, and the tools for them: logs and puddles to jump over (the jumping itself is movement, so it
// lives in world.js), brambles to cut with the shears, boulders to smash with the hammer, and the two tools that lie
// somewhere on the island until the girls find them. Where everything stands comes from map.js, what has been
// found or broken is remembered by quest.js. world.js hands over the same toolbox (ctx) as for world-extras.js.
import * as ART from './art.js';
import * as Q from './quest.js';
import * as PX from './pixel.js';
import { sfx, speak } from './audio.js';

const FREE = { zwaard: 'Zwiep zwiep! De brug naar de bloemenwei is vrij!', hamer: 'Boem boem! De brug naar het strand is vrij!' };
const GAP_SAY = 'O jee, de brug is kapot! Alleen een eenhoorn kan over het gat springen.';

export function createTools(ctx) {
  const { THREE, scene, M, canvas, makeSprite, pick, burst, bubble, kid, uni } = ctx;
  const meshes = new Map();       // obstacle index -> mesh (only what still stands)
  const fading = [], rising = [];

  /* ---------------- obstacles ---------------- */
  M.obstacles.forEach((o, i) => {
    if (o.type === 'break' && Q.quest.broken.includes(i)) { M.block[M.I(o.x, o.z)] = 0; return; }
    const flat = o.kind === 'plas' || o.type === 'gap', mended = o.type === 'gap' && Q.quest.stage === 'feest';
    if (mended) M.block[M.I(o.x, o.z)] = 0;
    const mesh = makeSprite(ART.propArt(mended ? 'regenboogbrug' : o.kind, 1 + (o.x + o.z) % 2), { lean: flat ? Math.PI / 2 : .25, shadow: !flat, scale: o.type === 'break' ? 1.1 : 1 });
    mesh.position.set(o.x + .5, o.type === 'gap' ? .06 : flat ? .02 : 0, o.z + (o.type === 'gap' ? 1.06 : flat ? .94 : .62)); scene.add(mesh); meshes.set(i, mesh);
    if (o.type !== 'low') { mesh.userData.tap = () => M.block[M.I(o.x, o.z)] ? ctx.approach(o.x, o.z, () => use(i)) : ctx.walkToTile(o.x, o.z); pick.push(mesh); }
  });
  const indexAt = (x, z) => M.obstacles.findIndex((o, i) => o.x === x && o.z === z && meshes.has(i) && o.type !== 'low');
  /** when the unicorn has come home, a rainbow mends the bridge so the girls can walk back to bed */
  function mend() {
    M.obstacles.forEach((o, i) => { if (o.type !== 'gap' || !M.block[M.I(o.x, o.z)]) return; M.block[M.I(o.x, o.z)] = 0; const m = meshes.get(i), t = ctx.tex(ART.propArt('regenboogbrug')); m.material = m.material.clone(); m.material.map = t; m.material.emissiveMap = t; m.customDepthMaterial.map = t; burst(new THREE.Vector3(o.x + .5, 0, o.z + .5), 8); });
  }

  /** Anna stands next to obstacle `i`: cut or smash it, or say which tool is missing. The sword is never used by itself:
   *  `slashed` is the sword's own slash landing on it (world-sword.js); a tap on the bramble makes her slash (`ask`), walking
   *  into it only wiggles it and shows the sword (□) in a bubble */
  let hintT = 0;
  function use(i, slashed = false, ask = true) {
    const o = M.obstacles[i]; if (!o || !meshes.has(i)) return;
    const here = new THREE.Vector3(o.x + .5, 0, o.z + .5);
    if (o.tool === 'zwaard' && !slashed && Q.hasTool('zwaard')) {
      if (ask && ctx.sword) { ctx.sword.swing({ x: here.x - kid.pos.x, z: here.z - kid.pos.z }); return; }
      wobble = { mesh: meshes.get(i), t: .4 }; const now = performance.now(); if (now - hintT > 3000) { hintT = now; bubble(kid, '', ART.toolIcon('zwaard')); } return;
    }
    kid.face = here.x >= kid.pos.x ? 1 : -1;
    if (o.type === 'gap') {                                                          // riding, she simply jumps it (that is movement, see world.js)
      if (!M.block[M.I(o.x, o.z)] || ctx.mount() === 'uni') return;
      // nobody has to work out how: if the unicorn can carry her, the girl climbs on by herself and over they go
      const kx = Math.floor(kid.pos.x), kz = Math.floor(kid.pos.z);
      if (Q.canRide() && uni.g.visible && ctx.setMount('uni')) { speak('Hup, op de rug van ' + Q.uniName() + '! Spring!'); ctx.walkToTile(kx + (o.x - kx) * 2, kz + (o.z - kz) * 2); return; }
      sfx.wrong(); bubble(kid, '?', ART.foodItem(Q.quest.kind)); speak(GAP_SAY); return;
    }
    if (!Q.hasTool(o.tool)) { sfx.wrong(); bubble(kid, '?', ART.toolIcon(o.tool)); speak(Q.TOOLS[o.tool].need); wobble = { mesh: meshes.get(i), t: .5 }; return; }
    const group = M.obstacles.map((p, k) => k).filter(k => meshes.has(k) && M.obstacles[k].type === 'break' && M.obstacles[k].g === o.g);
    for (const k of group) { const p = M.obstacles[k], m = meshes.get(k); M.block[M.I(p.x, p.z)] = 0; meshes.delete(k); const pi = pick.indexOf(m); if (pi >= 0) pick.splice(pi, 1); fading.push({ m, t: -.55 }); setTimeout(() => burst(new THREE.Vector3(p.x + .5, 0, p.z + .5), 6), 550); }   // it falls apart when the swing gets there
    Q.smash(group, !o.gate);                                                         // saved first, animated after
    if (o.tool === 'zwaard') sfx.snip();
    else { sfx.bonk(); kid.hop = .7; const m = makeSprite(ART.toolIcon(o.tool), { lean: .2, shadow: false, scale: 1.2 }); scene.add(m); swings.push({ m, t: 0 }); }   // the hammer comes down (the sword makes its own slash)
    if (o.gate) speak(FREE[o.tool]);
    else { const c = makeSprite(ART.coin(), { lean: .3, shadow: false }); c.position.copy(here); c.position.y = .3; scene.add(c); rising.push({ m: c, t: 0 }); sfx.chime(5); }
  }
  let wobble = null;

  /* ---------------- the tools: nothing just lies around ---------------- */
  // The sword turns up in a stone in the village once the egg is found: walk up to it and she tugs, tugs harder, and
  // on the third tug it pops out and she tumbles over. The hammer turns up next to a gnome asleep in the forest once
  // the unicorn has hatched: walk up to him and he wakes with a start, yawns, and hands it over. Before that the stone
  // is empty and the gnome sleeps with nothing beside him; while a tool waits it glows, because it is the goal.
  const holders = {}, flyers = [], swings = [];
  const waiting = id => Q.toolReady(id) && !Q.hasTool(id);
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,250,215,1)'); r.addColorStop(.35, 'rgba(255,226,122,.55)'); r.addColorStop(1, 'rgba(255,200,90,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const sparkle = PX.sparkle('#FFF6D0');
  function makeHolder(id) {
    const [x, z] = M.toolSpots[id], art = id === 'zwaard' ? ART.zwaardSteen(waiting(id)) : ART.kabouter(Q.hasTool(id));
    const mesh = makeSprite(art, { lean: .3, scale: id === 'zwaard' ? .72 : 1.15 }); mesh.position.set(x + .5, 0, z + .55); mesh.userData.alpha = art; scene.add(mesh);
    const h = holders[id] = { id, mesh, x: x + .5, z: z + .5, step: Q.hasTool(id) ? 9 : 0, t: 0, near: false, zz: 0, spark: 0 };
    const tap = () => { sfx.pop(); if (!waiting(id) && h.step === 0) { h.wob = .3; return; } if (Math.hypot(h.x - kid.pos.x, h.z - kid.pos.z) < 1.3) start(h); else ctx.approach(x, z, () => start(h)); };
    mesh.userData.tap = tap; pick.push(mesh);
    ctx.solid(x, z);                                                               // the stone (and the gnome) is a thing: she walks up to it, not through it
    if (id === 'hamer') { const ha = ART.hamerGroot(); h.tool = makeSprite(ha, { lean: .3, scale: 1.1 }); h.tool.position.set(x + 1.45, 0, z + .5); h.tool.userData.alpha = ha; h.tool.userData.tap = tap; scene.add(h.tool); pick.push(h.tool); }
    h.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    h.glow.position.set(id === 'zwaard' ? x + .5 : x + 1.45, id === 'zwaard' ? .62 : .75, z + .45); scene.add(h.glow);
    show(h);
  }
  /** the tool is there (and glows) only while it waits for her */
  function show(h) {
    const w = waiting(h.id); h.glow.visible = w; if (h.tool) h.tool.visible = w && h.step < 4;
    if (h.tool) ctx.solid(Math.floor(h.tool.position.x), Math.floor(h.tool.position.z), h.tool.visible);   // the big hammer stands there like a post while it waits
    if (h.id === 'zwaard' && h.step === 0) setArt(h, ART.zwaardSteen(w));
  }
  const setArt = (h, art) => { const t = ctx.tex(art); h.mesh.material.map = t; h.mesh.material.emissiveMap = t; h.mesh.material.needsUpdate = true; h.mesh.userData.alpha = art; if (h.mesh.customDepthMaterial) h.mesh.customDepthMaterial.map = t; };
  /** begin the little scene (or, once it is done, a wave / a wobble) */
  function start(h) {
    if (h.step === 0 && !waiting(h.id)) { h.wob = .3; return; }
    if (h.step === 9) { if (h.id === 'hamer') { h.wave = .6; sfx.pop(); bubble(kid, 'Hoi!'); } else { h.wob = .4; sfx.tug(); } return; }
    if (h.step === 0 && h.id === 'zwaard') {                                       // the sword: a scene from the side where she pulls it out herself (cutscene.js playPull)
      h.step = 9; kid.path = []; kid.face = h.x >= kid.pos.x ? 1 : -1; const got = Q.giveTool('zwaard');   // saved first, shown after
      setArt(h, ART.zwaardSteen(false)); h.glow.visible = false;
      ctx.show('pull').then(() => { if (!got) return; sfx.sparkle(); burst(kid.pos, 12, true); bubble(kid, '!', ART.toolIcon('zwaard')); speak(Q.TOOLS.zwaard.found); kid.hop = .6; });
      return;
    }
    if (h.step === 0) { h.step = 1; h.t = 0; kid.path = []; kid.face = h.x >= kid.pos.x ? 1 : -1; }
  }
  function give(id, from) {
    if (!Q.giveTool(id)) return;
    const m = makeSprite(ART.toolIcon(id), { lean: .2, shadow: false, scale: 1.3 }); scene.add(m); flyers.push({ m, t: 0, from: from.clone() });
    sfx.tada(); burst(kid.pos, 12, true); bubble(kid, '!', ART.toolIcon(id)); speak(Q.TOOLS[id].found);
  }
  function stepHolder(h, dt, active) {
    const d = Math.hypot(h.x - kid.pos.x, h.z - kid.pos.z);
    if (active && h.step === 0 && d < 1.05 && waiting(h.id)) start(h);
    if (h.glow.visible) {                                                          // the goal of the moment: a soft pulsing light and a sparkle now and then
      const k = Math.sin(performance.now() / 1000 * 3); h.glow.material.opacity = .55 + .25 * k; h.glow.scale.setScalar((h.id === 'zwaard' ? 1.3 : 2) * (1 + .08 * k));
      if ((h.spark -= dt) < 0) { h.spark = .45; ctx.life.bit(sparkle, h.glow.position.x + (Math.random() - .5) * .7, h.glow.position.y - .3 + Math.random() * .6, h.z + .15, { vx: 0, vy: .6, g: 0, life: 1.1 }); }
    }
    if (h.wob > 0) { h.wob -= dt; h.mesh.rotation.z = Math.sin(h.wob * 50) * .05; } else if (h.step < 2) h.mesh.rotation.z = 0;
    if (h.wave > 0) { h.wave -= dt; h.mesh.position.y = Math.abs(Math.sin(h.wave * 10)) * .15; }
    if (h.id === 'hamer' && h.step === 0 && d < 6 && (h.zz -= dt) < 0) { h.zz = 1.4; sfx.snore && d < 3 && sfx.snore(); ctx.life.bit(ART.zzz(), h.x + .2, .6, h.z + .1, { vx: .35, vy: .5, g: 0, life: 1.6 }); }   // only snores when she is close: the world waits for her
    if (h.step === 0 || h.step === 9) return;
    h.t += dt; kid.path = []; kid.face = h.x >= kid.pos.x ? 1 : -1;
    if (h.id === 'zwaard') {
      // tug ... tug harder ... pop!
      const beats = [[.1, () => { sfx.tug(); kid.hop = .3; h.wob = .35; bubble(kid, 'Hmpf!'); }], [1.0, () => { sfx.tug(); kid.hop = .45; h.wob = .5; bubble(kid, 'Hmmmpf!!'); if (uni.g.visible) uni.hop = 1; }],
        [2.0, () => { sfx.swish(); sfx.boing(); setArt(h, ART.zwaardSteen(false)); h.glow.visible = false; kid.hop = 1; kid.hopH = .7; burst(new THREE.Vector3(h.x, .6, h.z), 10); give('zwaard', new THREE.Vector3(h.x, 1, h.z)); }],
        [2.6, () => { sfx.pop(); bubble(kid, 'Hihihi!'); }]];
      for (let k = h.step - 1; k < beats.length && h.t >= beats[k][0]; k++) { beats[k][1](); h.step = k + 2; }
      if (h.t > 2.0 && h.t < 2.9) kid.mesh.rotation.z = -kid.face * Math.sin(Math.min(1, (h.t - 2) / .45) * Math.PI) * .9; else kid.mesh.rotation.z = 0;   // she tumbles over backwards
      if (h.step > beats.length) { h.step = 9; kid.mesh.rotation.z = 0; }
    } else {
      // he wakes with a start, yawns, stands up and hands over the hammer
      const beats = [[.1, () => { sfx.boing(); setArt(h, ART.kabouter(true)); h.jump = 1; bubble(kid, '!'); }], [.9, () => { sfx.purr(); bubble(kid, 'Goedemorgen!'); }],
        [1.8, () => { sfx.sparkle(); h.tool.visible = false; ctx.solid(Math.floor(h.tool.position.x), Math.floor(h.tool.position.z), false); h.glow.visible = false; give('hamer', new THREE.Vector3(h.x + .95, .8, h.z)); }], [2.6, () => { h.wave = .6; }]];
      for (let k = h.step - 1; k < beats.length && h.t >= beats[k][0]; k++) { beats[k][1](); h.step = k + 2; }
      if (h.jump > 0) { h.jump = Math.max(0, h.jump - dt * 2.2); h.mesh.position.y = Math.sin((1 - h.jump) * Math.PI) * .6; }
      if (h.step > beats.length) h.step = 9;
    }
  }
  makeHolder('zwaard'); makeHolder('hamer');
  const off = Q.on((type, d) => { if (type === 'stage') { if (d === 'feest') mend(); for (const id in holders) show(holders[id]); } });

  return {
    use, dispose: off,
    /** the thing to cut or smash on this tile, if any */
    useAt(x, z, ask = false) { const i = indexAt(x, z); if (i >= 0) use(i, false, ask); },
    /** where the tool still waits for her (null once she has it) */
    spot: id => holders[id] && waiting(id) ? [holders[id].x, holders[id].z] : null,
    /** the gates that still stand (one entry per gate), for the map */
    gates: () => { const seen = new Set(), out = []; M.obstacles.forEach((o, i) => { if (!o.gate || !meshes.has(i) || !M.block[M.I(o.x, o.z)] || seen.has(o.g)) return; seen.add(o.g); out.push({ kind: o.kind, x: o.x + 1, z: o.z + .5 }); }); return out; },
    /** for the action button: a tool to use on the bramble or boulder in reach, the tool waiting for her, or the gnome to say hello to */
    nearAction() {
      const d = (x, z) => Math.hypot(x - kid.pos.x, z - kid.pos.z);
      for (const h of Object.values(holders)) {
        if (h.step === 0 && waiting(h.id) && d(h.x, h.z) < 1.8) return { key: 'tool' + h.id, icon: ART.toolIcon(h.id), run: () => start(h) };
        if (h.id === 'hamer' && h.step === 9 && d(h.x, h.z) < 1.5) return { key: 'gnome', icon: ART.talkIcon(), run: () => start(h) };
      }
      let best = -1, bd = 1.7;   // (not the sword: it has its own button)
      M.obstacles.forEach((o, i) => { if (o.type !== 'break' || !meshes.has(i) || !Q.hasTool(o.tool) || o.tool === 'zwaard') return; const k = d(o.x + .5, o.z + .5); if (k < bd) { bd = k; best = i; } });
      if (best >= 0) { const o = M.obstacles[best]; return { key: 'use' + o.tool, icon: ART.toolIcon(o.tool), run: () => use(best) }; }
      return null;
    },
    info: () => ({ standing: meshes.size, waiting: Object.keys(holders).filter(id => !Q.hasTool(id)) }),
    update(dt, time, active) {
      for (let i = fading.length - 1; i >= 0; i--) { const f = fading[i]; f.t += dt * 3; if (f.t < 0) { f.m.rotation.z = Math.sin(f.t * 40) * .04; continue; } f.m.scale.setScalar(Math.max(.01, 1.1 * (1 - f.t))); f.m.rotation.z = f.t * .8; if (f.t >= 1) { scene.remove(f.m); fading.splice(i, 1); } }
      for (let i = rising.length - 1; i >= 0; i--) { const f = rising[i]; f.t += dt * 1.6; f.m.position.y = .3 + f.t * 1.4; f.m.scale.x = Math.cos(f.t * 9); if (f.t >= 1) { scene.remove(f.m); rising.splice(i, 1); } }
      if (wobble) { wobble.t -= dt; wobble.mesh.rotation.z = wobble.t > 0 ? Math.sin(wobble.t * 40) * .12 : 0; if (wobble.t <= 0) wobble = null; }
      for (const id in holders) stepHolder(holders[id], dt, active);
      // the swing: a wind-up, then a big arc that lingers a moment
      for (let i = swings.length - 1; i >= 0; i--) { const w = swings[i]; w.t += dt * .95; const e = w.t < .35 ? -Math.sin(w.t / .35 * Math.PI / 2) * .35 : Math.min(1, (w.t - .35) / .3) ** 1.5; const a = w.sword ? 1.4 - e * 2.6 : .9 - Math.max(0, e) * 1.8;; w.m.position.set(kid.pos.x + kid.face * (.3 + Math.cos(a) * .35), .55 + Math.sin(a) * .45, kid.pos.z + .12); w.m.rotation.z = (a - .6) * -kid.face; w.m.scale.x = 1.2 * kid.face; if (w.t >= 1) { scene.remove(w.m); swings.splice(i, 1); } }
      for (let i = flyers.length - 1; i >= 0; i--) { const f = flyers[i]; f.t += dt * 1.4; const k = Math.min(1, f.t); f.m.position.set(f.from.x + (kid.pos.x - f.from.x) * k, f.from.y + Math.sin(k * Math.PI) * 1.4 + k * .8, f.from.z + (kid.pos.z - f.from.z) * k + .1); f.m.rotation.z = f.t * 12; if (f.t > 1.4) { scene.remove(f.m); flyers.splice(i, 1); } }
    },
  };
}
