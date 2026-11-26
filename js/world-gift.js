// Getting a tool (the sword out of its stone, the hookshot out of its chest) is a moment: the tool flies up out of where it
// was, she lifts it high over her head with both arms, rays of light turn behind it, a little fanfare plays, and then it
// is hers. She is busy for the moment (nothing else moves her), driven from update(), so closing or pausing never
// leaves her stuck: the tool itself was saved before the moment starts.
import * as PX from './pixel.js';
import { sfx } from './audio.js';

const FLY = .6, HOLD = 2.6, END = .45;

export function createGift(ctx) {
  const { THREE, scene, kid } = ctx;
  const rayTex = (() => {
    const [c, x] = ctx.canvas(96, 96); x.translate(48, 48);
    for (let k = 0; k < 12; k++) { x.rotate(Math.PI / 6); x.fillStyle = k % 2 ? 'rgba(255,246,190,.85)' : 'rgba(255,214,90,.75)'; x.beginPath(); x.moveTo(0, 0); x.lineTo(-7, -47); x.lineTo(7, -47); x.closePath(); x.fill(); }
    const g = x.createRadialGradient(0, 0, 0, 0, 0, 22); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,240,180,0)'); x.fillStyle = g; x.fillRect(-48, -48, 96, 96);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const rays = new THREE.Sprite(new THREE.SpriteMaterial({ map: rayTex, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }));
  rays.renderOrder = 30; rays.visible = false; scene.add(rays);
  const item = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false }));
  item.renderOrder = 31; item.visible = false; scene.add(item);
  let g = null;

  /** the moment: `art` is the tool's picture, `from` where it flies up out of (a Vector3), `done` runs at the end */
  function give(art, from, done) {
    if (g) { g.queue = (g.queue || []).concat([[art, from, done]]); return; }
    const t = ctx.tex(art); item.material.map = t; item.material.needsUpdate = true;
    const w = art.width / 14, h = art.height / 14; item.userData.size = [w, h];
    g = { t: 0, from: (from || kid.pos).clone(), done, played: false };
    if (!from) g.from.y = 1.2;
    ctx.setBusy(true); kid.path = []; kid.moving = false;
    item.visible = true; item.scale.set(w * .4, h * .4, 1); item.position.copy(g.from);
  }
  function overHead() { return new THREE.Vector3(kid.pos.x, 1.55 + (kid.lift || 0), kid.pos.z + .12); }

  return {
    give,
    active: () => !!g,
    update(dt, time) {
      if (!g) return;
      g.t += dt; const t = g.t, top = overHead(), [w, h] = item.userData.size;
      if (t < FLY) {                                                                    // up out of the chest (or the stone), over to her
        const k = t / FLY, e = 1 - (1 - k) * (1 - k);
        item.position.set(g.from.x + (top.x - g.from.x) * e, g.from.y + (top.y - g.from.y) * e + Math.sin(k * Math.PI) * .9, g.from.z + (top.z - g.from.z) * e);
        item.scale.set(w * (.4 + .6 * k), h * (.4 + .6 * k), 1); item.material.rotation = (1 - k) * 6;
        if (k > .55 && kid.pose !== 'up') { kid.pose = 'up'; kid.hop = .35; }
        return;
      }
      kid.pose = 'up';
      if (!g.played) { g.played = true; sfx.fanfare(); ctx.burst(top, 16, true); rays.visible = true; }
      const hold = t - FLY;
      item.material.rotation = 0; item.position.copy(top); item.position.y += Math.sin(hold * 5) * .03;
      const grow = Math.min(1, hold * 3);
      rays.position.set(top.x, top.y, top.z - .02); rays.scale.setScalar((1.5 + Math.sin(hold * 3) * .12) * grow); rays.material.rotation = hold * .9; rays.material.opacity = grow;
      if (Math.random() < dt * 9) ctx.life.bit(PX.sparkle(Math.random() < .5 ? '#FFF6D0' : '#FFD43B'), top.x + (Math.random() - .5) * 1.4, top.y + (Math.random() - .3) * .9, top.z + .2, { vx: 0, vy: .4, g: 0, life: .8 });
      if (hold > HOLD) {                                                                 // into her pocket: the tool shrinks away, the light goes out
        const k = Math.min(1, (hold - HOLD) / END);
        item.scale.set(w * (1 - k), h * (1 - k), 1); item.position.y -= k * .5; rays.material.opacity = 1 - k;
        if (k >= 1) {
          item.visible = rays.visible = false; kid.pose = null; ctx.setBusy(false); kid.hop = .3;
          const d = g.done, q = g.queue; g = null; d && d();
          if (q && q.length) { const [a, f, dn] = q.shift(); give(a, f, dn); if (g) g.queue = q; }
        }
      }
    },
    dispose() { scene.remove(rays); scene.remove(item); if (g) { kid.pose = null; ctx.setBusy(false); } },
  };
}
