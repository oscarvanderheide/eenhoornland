// Things in the way, and the tools for them: logs and puddles to jump over (the jumping itself is movement, so it
// lives in world.js), brambles to cut with the shears, boulders to smash with the hammer, and the two tools that lie
// somewhere on the island until the girls find them. Where everything stands comes from map.js, what has been
// found or broken is remembered by quest.js. world.js hands over the same toolbox (ctx) as for world-extras.js.
import * as ART from './art.js';
import * as Q from './quest.js';
import { sfx, speak } from './audio.js';

const FREE = { schaar: 'Knip knip knip! De brug naar de bloemenwei is vrij!', hamer: 'Boem boem! De brug naar het strand is vrij!' };
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

  /** Anna stands next to obstacle `i`: cut or smash it, or say which tool is missing */
  function use(i) {
    const o = M.obstacles[i]; if (!o || !meshes.has(i)) return;
    const here = new THREE.Vector3(o.x + .5, 0, o.z + .5);
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
    for (const k of group) { const p = M.obstacles[k], m = meshes.get(k); M.block[M.I(p.x, p.z)] = 0; meshes.delete(k); const pi = pick.indexOf(m); if (pi >= 0) pick.splice(pi, 1); fading.push({ m, t: 0 }); burst(new THREE.Vector3(p.x + .5, 0, p.z + .5), 6); }
    Q.smash(group, !o.gate);                                                         // saved first, animated after
    (o.tool === 'schaar' ? sfx.snip : sfx.bonk)(); kid.hop = .7; bubble(kid, '', ART.toolIcon(o.tool));
    if (o.gate) speak(FREE[o.tool]);
    else { const c = makeSprite(ART.coin(), { lean: .3, shadow: false }); c.position.copy(here); c.position.y = .3; scene.add(c); rising.push({ m: c, t: 0 }); sfx.chime(5); }
  }
  let wobble = null;

  /* ---------------- the tools, lying somewhere until they are found ---------------- */
  const glowTex = (() => { const [c, x] = canvas(32, 32), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,220,240,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 32); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const lying = {};
  function syncTools() {
    for (const id of Object.keys(Q.TOOLS)) {
      const out = Q.toolOut(id), l = lying[id];                                      // the shears only turn up once there is an egg, the hammer once it has hatched
      if (!out && l) { scene.remove(l.mesh, l.glow); delete lying[id]; }
      if (out && !l) {
        const [x, z] = M.toolSpots[id], mesh = makeSprite(ART.toolIcon(id), { lean: .3, scale: 1.25 });
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#FFE3F1', transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending }));
        mesh.position.set(x + .5, .2, z + .5); glow.position.set(x + .5, .7, z + .6); scene.add(mesh, glow); lying[id] = { mesh, glow, x: x + .5, z: z + .5 };
      }
    }
  }
  function find(id) {
    if (!Q.giveTool(id)) return;                                                     // the 'tool' event below removes it from the ground
    sfx.tada(); kid.hop = 1; burst(kid.pos, 12, true); bubble(kid, '!', ART.toolIcon(id)); speak(Q.TOOLS[id].found);
  }
  const off = Q.on((type, d) => { if (type === 'tool' || type === 'stage') syncTools(); if (type === 'stage' && d === 'feest') mend(); });
  syncTools();

  return {
    use, dispose: off,
    /** the thing to cut or smash on this tile, if any */
    useAt(x, z) { const i = indexAt(x, z); if (i >= 0) use(i); },
    spot: id => lying[id] ? [lying[id].x, lying[id].z] : null,
    /** the gates that still stand (one entry per gate), for the map */
    gates: () => { const seen = new Set(), out = []; M.obstacles.forEach((o, i) => { if (!o.gate || !meshes.has(i) || !M.block[M.I(o.x, o.z)] || seen.has(o.g)) return; seen.add(o.g); out.push({ kind: o.kind, x: o.x + 1, z: o.z + .5 }); }); return out; },
    info: () => ({ standing: meshes.size, lying: Object.keys(lying) }),
    update(dt, time, active) {
      for (let i = fading.length - 1; i >= 0; i--) { const f = fading[i]; f.t += dt * 3; f.m.scale.setScalar(Math.max(.01, 1.1 * (1 - f.t))); f.m.rotation.z = f.t * .8; if (f.t >= 1) { scene.remove(f.m); fading.splice(i, 1); } }
      for (let i = rising.length - 1; i >= 0; i--) { const f = rising[i]; f.t += dt * 1.6; f.m.position.y = .3 + f.t * 1.4; f.m.scale.x = Math.cos(f.t * 9); if (f.t >= 1) { scene.remove(f.m); rising.splice(i, 1); } }
      if (wobble) { wobble.t -= dt; wobble.mesh.rotation.z = wobble.t > 0 ? Math.sin(wobble.t * 40) * .12 : 0; if (wobble.t <= 0) wobble = null; }
      for (const id in lying) {
        const l = lying[id]; l.mesh.position.y = .25 + Math.sin(time * 2.6) * .1; l.mesh.rotation.z = Math.sin(time * 1.7) * .15;
        const s = 1.9 + Math.sin(time * 3) * .3; l.glow.scale.set(s, s, 1); l.glow.material.opacity = .5 + Math.sin(time * 3) * .25;
        if (active && Math.abs(l.x - kid.pos.x) < .8 && Math.abs(l.z - kid.pos.z) < .8) find(id);
      }
    },
  };
}
