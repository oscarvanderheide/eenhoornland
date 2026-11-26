// The sword: never automatic, always a slash she makes herself (□ on a controller, the sword button, F on the keys,
// or a tap on a bramble: she walks up and slashes it). A quick white arc in front of her, the way she last walked:
// grass and flowers in it are cut (they grow back after a while, now and then a coin hides under a tuft), brambles
// fall, trees shake, animals jump up. Cut grass is not saved: by the next visit it has grown back anyway.
import * as Q from './quest.js';
import * as ART from './art.js';
import * as PX from './pixel.js';
import { sfx } from './audio.js';

const REGROW = [70, 120];   // seconds before a cut tuft or flower comes back
const T = .26;              // the slash, in seconds

export function createSword(ctx, { camera, cuttables, lastDir }) {
  const { THREE, scene, kid, M } = ctx;
  const I = M.I;
  // the slash arc: a card that faces the camera and turns in its own plane
  const arcTex = ctx.tex(ART.slashArc());
  const arc = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: arcTex, transparent: true, depthTest: false, depthWrite: false, opacity: 0 }));
  arc.renderOrder = 20; arc.visible = false; scene.add(arc);
  // the sword in her hand: the picture is drawn diagonally (grip bottom left, tip top right), so the card is shifted until
  // the grip sits on the pivot, and the pivot (her hand) is what turns
  const bladeArt = ART.toolIcon('zwaard'), BW = bladeArt.width / 17, BH = bladeArt.height / 17;
  const bladeCard = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshBasicMaterial({ map: ctx.tex(bladeArt), transparent: true, alphaTest: .5, depthTest: false, depthWrite: false }));
  bladeCard.position.set(-(1.5 / bladeArt.width - .5) * BW, -(.5 - 6.5 / bladeArt.height) * BH, 0); bladeCard.renderOrder = 21;
  const blade = new THREE.Group(); blade.add(bladeCard); blade.visible = false; scene.add(blade);
  let sw = null, cool = 0, count = 0;
  const regrow = [];
  const hidden = new THREE.Matrix4().makeScale(0, 0, 0), tmp = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3();
  const bitCache = new Map();
  const leaf = inst => {
    if (!bitCache.has(inst)) { const cv = inst.userData.alpha, x = cv.getContext('2d'); let col = '#6BBF59'; const d = x.getImageData(0, 0, cv.width, cv.height).data; for (let k = d.length - 4; k >= 0; k -= 4 * 3) if (d[k + 3] > 200 && d[k] + d[k + 1] + d[k + 2] > 120) { col = `rgb(${d[k]},${d[k + 1]},${d[k + 2]})`; break; } bitCache.set(inst, PX.gridSprite(2, 2, () => col, { outline: false })); }
    return bitCache.get(inst);
  };

  /** the direction of the slash: the way she walks or last walked, else the way she looks */
  function dirNow(to) {
    if (to) { const l = Math.hypot(to.x, to.z) || 1; return { x: to.x / l, z: to.z / l }; }
    // a bramble right next to her: that is what she means (a child standing still should not have to aim)
    let best = null, bd = 1.7; M.obstacles.forEach(o => { if (o.type !== 'break' || o.tool !== 'zwaard' || !M.block[I(o.x, o.z)]) return; const k = Math.hypot(o.x + .5 - kid.pos.x, o.z + .5 - kid.pos.z); if (k < bd) { bd = k; best = o; } });
    if (best) return dirNow({ x: best.x + .5 - kid.pos.x, z: best.z + .5 - kid.pos.z });
    const d = lastDir(); if (d && (Math.abs(d.x) < .2 || Math.sign(d.x) === kid.face)) return { x: d.x, z: d.z };   // the way she last walked (unless she turned round since)
    return { x: kid.face, z: 0 };
  }
  /** slash now (towards `to`, a direction, if given). Returns false when she has no sword. */
  function swing(to) {
    if (!Q.hasTool('zwaard') || cool > 0) return false;
    const d = dirNow(to); if (Math.abs(d.x) > .2) kid.face = Math.sign(d.x);
    sw = { t: 0, d, hit: false }; cool = T + .06; count++; kid.squash = Math.max(kid.squash || 0, .25); sfx.swish();
    arc.visible = blade.visible = true; return true;
  }
  /** everything in the arc gets it */
  function strike(d) {
    const cx = kid.pos.x + d.x * .75, cz = kid.pos.z + d.z * .75, R = .95;
    const inArc = (x, z) => Math.hypot(x - cx, z - cz) < R;
    let cut = 0;
    for (let tz = Math.floor(cz - R); tz <= Math.floor(cz + R); tz++) for (let tx = Math.floor(cx - R); tx <= Math.floor(cx + R); tx++) {
      const list = cuttables.get(I(tx, tz)); if (!list) continue;
      for (const e of list) {
        if (e.cut || !inArc(e.x, e.z)) continue;
        e.cut = true; e.inst.setMatrixAt(e.i, hidden); e.inst.instanceMatrix.needsUpdate = true; cut++;
        regrow.push({ e, at: performance.now() / 1000 + REGROW[0] + Math.random() * (REGROW[1] - REGROW[0]), k: -1 });
        for (let n = 0; n < 3; n++) ctx.life.bit(leaf(e.inst), e.x + (Math.random() - .5) * .2, .15, e.z, { vx: d.x * 1.2 + (Math.random() - .5) * 2, vy: 1.6 + Math.random() * 1.6, g: 8, life: .7 });
        if (Math.random() < .045) {   // now and then a coin was hiding in the grass
          Q.earn(1); sfx.chime(5); ctx.life.bit(ART.coin(), e.x, .3, e.z + .1, { vx: 0, vy: 3.2, g: 7, life: .9 });
        }
      }
    }
    if (cut) sfx.snip();
    // brambles: the same as the tool always did (tools.use with the slash already made)
    M.obstacles.forEach((o, i) => { if (o.type === 'break' && o.tool === 'zwaard' && inArc(o.x + .5, o.z + .5)) ctx.tools.use(i, true); });
    // a tree or bush in the way shakes, animals jump up
    ctx.life.hitAt(cx, cz);
    for (const a of ctx.animals) if (a.g.visible && !a.held && !a.isUni && Math.hypot(a.pos.x - cx, a.pos.z - cz) < R) { a.hop = 1; a.wait = Math.max(a.wait || 0, 1.5); }
  }

  return {
    swing,
    swinging: () => !!sw,
    info: () => ({ cut: regrow.length, swinging: !!sw, count }),
    update(dt) {
      cool = Math.max(0, cool - dt);
      if (sw) {
        if (!sw.hold) sw.t += dt; const k = Math.min(1, sw.t / T), d = sw.d;
        if (!sw.hit && k > .3) { sw.hit = true; strike(d); }
        // the arc: in front of her, turned towards the slash, it grows and fades
        const ang = Math.atan2(-d.z, d.x), y = .42 + (kid.lift || 0);
        arc.position.set(kid.pos.x + d.x * .55, y + Math.max(0, -d.z) * .15, kid.pos.z + d.z * .45 + .2);
        arc.quaternion.copy(camera.quaternion); arc.rotateZ(ang);
        arc.material.opacity = k < .35 ? k / .35 : 1 - (k - .35) / .65; arc.scale.setScalar(.65 + .45 * Math.min(1, k / .4));
        // she holds it by the grip and slashes: her hand stays at her side, the blade turns round it from up high
        // down through the arc (always top to bottom, whichever way she faces)
        const down = Math.cos(ang) >= 0 ? 1 : -1, e = 1 - Math.pow(1 - Math.min(1, k * 1.3), 3);
        const a = ang + down * (1.7 - 3.2 * e);
        blade.position.set(kid.pos.x + kid.face * .16 + d.x * .08, y - .04 + d.z * -.04, kid.pos.z + .25);
        blade.quaternion.copy(camera.quaternion); blade.rotateZ(a - Math.PI / 4);
        if (k >= 1) { sw = null; arc.visible = blade.visible = false; }
      }
      // cut grass grows back: a little later it pops up again
      const now = performance.now() / 1000;
      for (let i = regrow.length - 1; i >= 0; i--) {
        const r = regrow[i]; if (now < r.at) continue;
        r.k = Math.min(1, r.k < 0 ? 0 : r.k + dt * 1.6); r.e.m.decompose(v, q, s); const g = r.k < 1 ? Math.sin(r.k * Math.PI / 2) * (1 + .15 * Math.sin(r.k * Math.PI)) : 1;
        tmp.compose(v, q, s.multiplyScalar(g)); r.e.inst.setMatrixAt(r.e.i, tmp); r.e.inst.instanceMatrix.needsUpdate = true;
        if (r.k >= 1) { r.e.cut = false; regrow.splice(i, 1); }
      }
    },
    /** tests: hold the slash still at k (0..1) to look at it; pose(null) lets it go */
    pose(k) { if (k == null) { if (sw) sw.hold = false; return; } sw = { t: k * T, d: dirNow(), hit: true, hold: true }; arc.visible = blade.visible = true; },
    /** tests: grow everything back at once */
    regrowNow() { for (const r of regrow) r.at = 0; },
  };
}
