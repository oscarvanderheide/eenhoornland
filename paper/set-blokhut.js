// Inside the log cabin in the forest: the workshop, a room of its own far beside the world (Oscar: "the log cabin cant be
// entered. it should be a game house too"). In the pixel game this was the atelier, so here she paints: log walls, a
// stone hearth with a fire, a table with pots of paint, and an easel.
//   the easel     a tap: she walks over, and the colouring sheet opens (atelier.js): pick a pot, tap a piece of the
//                 picture and it is that colour. A picture all coloured in is a coin
//   her pictures  when she closes the sheet, what she coloured hangs on the wall in a frame (three frames, the newest
//                 taking the place of the oldest)
//   the fire      a tap: it flares up and crackles
//   out           walking down off the front of the room, over the mat
import { THREE, paper, slab, card, blob, whiteEdge } from './kit.js';
import { roomShell, roomShot } from './rooms.js';
import { openColoring, pagePicture } from './atelier.js';

const W = 5.2, D = 3.3, H = 2.7;

export default {
  name: 'blokhut',
  build(S) {
    const { girl, sfx } = S, root = S.root;
    const { put, box, P } = roomShell(S, { W, D, H, floor: '#c9a77c', boards: '#ad8a60', wall: '#a97a4e', side: '#9a6e47', dark: '#33292a', windows: [[-1.6, 1.6, .8, .7]], sky: '#bfe3ea', frame: '#7a5a3e', door: 'blokhut', mat: '#b9675a' });
    // the logs: round logs laid along the back wall, one on the other
    const LOGS = ['#b9875a', '#a97a4e', '#c1905f'];
    for (let k = 0; k < 10; k++) { const y = .13 + k * .26; for (const [x0, x1] of y > 1.2 && y < 2.0 ? [[-W / 2, -2.07], [-1.13, W / 2]] : [[-W / 2, W / 2]]) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, x1 - x0, 8), P(LOGS[k % 3])); m.rotation.z = Math.PI / 2; m.castShadow = m.receiveShadow = true; put(m, (x0 + x1) / 2, y, -D / 2 + .1); } }
    for (const [x, y, r, c] of [[-1.85, 1.35, .3, '#6f9a5e'], [-1.3, 1.85, .32, '#7fa676'], [-1.35, 1.3, .2, '#86ad6e']]) put(new THREE.Mesh(new THREE.CircleGeometry(r, 14), P(c)), x, y, -D / 2 - .3);   // forest outside the window

    /* ---------------- the hearth: a stone chimney breast with a fire in it, at the right ---------------- */
    const hearth = new THREE.Group(); hearth.position.set(1.75, 0, -D / 2 + .38); root.add(hearth);
    { const stones = ['#bdb6c9', '#cfc8dc', '#a99fc0'];
      for (let r = 0; r < 9; r++) for (let i = 0; i < 4; i++) { const y = .14 + r * .28, x = -.6 + i * .4 + (r % 2) * .2; if (x > .75) continue; if (y < 1.0 && Math.abs(x) < .42) continue; const s = box(.38, .26, .3, stones[(r + i) % 3]); s.position.set(x, y, 0); hearth.add(s); }
      const back = box(.86, .95, .05, '#3d3430'); back.position.set(0, .48, -.12); hearth.add(back);
      const shelf = box(1.5, .08, .42, '#7a5a3e'); shelf.position.set(.05, 1.06, .1); hearth.add(shelf);
      for (const [x, c] of [[-.45, '#f4a6c4'], [-.25, '#9ed9cf'], [.5, '#f2c65c']]) { const j = new THREE.Mesh(new THREE.CylinderGeometry(.06, .07, .16, 10), P(c)); j.position.set(x, 1.18, .1); hearth.add(j); }
      for (const [x, rot] of [[-.12, .3], [.12, -.3]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .5, 8), P('#7a5a3e')); l.rotation.set(Math.PI / 2, 0, rot + Math.PI / 2); l.position.set(x, .08, .02); hearth.add(l); } }
    const flames = [['#f2b56b', .34, 0], ['#f2c65c', .26, .08], ['#fbe7a6', .15, -.05]].map(([c, h, dx]) => {
      const f = card([[-h * .5, 0], [-h * .3, h * .6], [0, h * 1.5], [h * .25, h * .7], [h * .5, 0]], .01, new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: .9, roughness: .9 })); f.position.set(dx, .12, .05); f.userData.live = true; hearth.add(f); return f; });
    S.wall(1.75, -D / 2 + .38, .82, .26);
    const fire = S.lamp(0, '#ffb070', 6, 1.4); fire.position.set(1.75, .8, -D / 2 + .9);   // (a lamp is placed in the set's own measure)
    let flare = 0, flares = 0;
    S.tap(hearth, () => { flare = 1; flares++; sfx.whoosh(); S.confetti(...S.at([1.75, -D / 2 + .5]).flatMap((v, i) => i ? [.6, v] : [v]), ['#f2b56b', '#f2c65c', '#fbe7a6'], 10, S.starGeo, 1.6); }, 'haard');

    /* ---------------- the table with pots of paint and brushes ---------------- */
    const table = new THREE.Group(); table.position.set(-1.65, 0, .1); root.add(table);
    { const top = box(1.2, .07, .66, '#c79a66'); top.position.y = .62; table.add(top);
      for (const sx of [-.52, .52]) for (const sz of [-.26, .26]) { const l = box(.06, .6, .06, '#9a6e47'); l.position.set(sx, .3, sz); table.add(l); }
      ['#f4a6c4', '#f2c65c', '#8fc3e0', '#9ed9a0', '#bba6ea'].forEach((c, i) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .1, 10), P('#fbf5ea')); p.position.set(-.42 + i * .2, .71, -.1 + (i % 2) * .16); table.add(p); const d = new THREE.Mesh(new THREE.CircleGeometry(.06, 10), P(c)); d.rotation.x = -Math.PI / 2; d.position.set(-.42 + i * .2, .765, -.1 + (i % 2) * .16); table.add(d); });
      for (const [x, r] of [[.2, .4], [.35, -.3]]) { const b = box(.3, .02, .03, '#7a5a3e'); b.rotation.y = r; b.position.set(x, .67, .18); table.add(b); } }
    S.wall(-1.65, .1, .66, .38);

    /* ---------------- the easel in the middle, and her pictures on the wall ---------------- */
    const easel = new THREE.Group(); easel.position.set(.15, 0, -.35); root.add(easel);
    { for (const [x, r] of [[-.36, -.12], [.36, .12]]) { const l = box(.06, 1.75, .06, '#9a6e47'); l.position.set(x, .86, 0); l.rotation.z = r; easel.add(l); }
      const back = box(.06, 1.6, .06, '#9a6e47'); back.position.set(0, .8, -.3); back.rotation.x = -.2; easel.add(back);
      const ledge = box(.95, .06, .12, '#9a6e47'); ledge.position.set(0, .62, .05); easel.add(ledge); }
    const sheetTex = new THREE.CanvasTexture(pagePicture(0, 300)); sheetTex.colorSpace = THREE.SRGBColorSpace;
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(.9, .6), new THREE.MeshStandardMaterial({ map: sheetTex, roughness: .95 })); sheet.position.set(0, .96, .08); sheet.rotation.x = -.06; sheet.castShadow = true; easel.add(sheet);
    S.solid({ x: .15, z: -.35, r: .4 });
    const frames = [[-.6, 2.0, -D / 2 + .3], [.35, 2.07, -D / 2 + .3], [1.75, 1.82, -D / 2 + .56]].map(([x, y, z]) => {   // (the third on the chimney, over the shelf)
      const g = new THREE.Group(); g.position.set(x, y, z); root.add(g);
      const fr = card([[-.42, -.3], [.42, -.3], [.42, .3], [-.42, .3]], .04, P('#f4ecdc'), P('#e0d2b8'), [[[-.36, -.24], [-.36, .24], [.36, .24], [.36, -.24]]]); g.add(fr);
      const pic = new THREE.Mesh(new THREE.PlaneGeometry(.74, .5), new THREE.MeshStandardMaterial({ color: '#fbf5ea', roughness: .95 })); pic.position.z = .01; g.add(pic);
      return { g, pic }; });
    let hung = 0, opened = 0, wins = 0;
    const hang = canvas => { const c = document.createElement('canvas'); c.width = canvas.width; c.height = canvas.height; c.getContext('2d').drawImage(canvas, 0, 0);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const f = frames[hung % frames.length], old = f.pic.material.map; f.pic.material.map = t; f.pic.material.needsUpdate = true; if (old) old.dispose(); hung++;
      sheet.material.map = t; sheet.material.needsUpdate = true;
      const [fx, fz] = S.at([f.g.position.x, f.g.position.z]); S.confetti(fx, f.g.position.y, fz + .2, ['#f4a6c4', '#f2c65c', '#9ed9cf'], 10, S.starGeo, 1.4); sfx.chime(); };
    const [ex, ez] = S.at([.15, .55]);
    const paint = () => { if (S.playing() || document.getElementById('artbook')) return; S.walkThen(ex, ez, () => { girl.view = 'back'; opened++;
      openColoring({ sfx, won: () => { wins++; S.coins.earn(ex, 1.4, ez - .6); }, keep: (url, canvas) => hang(canvas) }); }, .6); };
    S.tap(easel, paint, 'ezel'); S.tap(table, paint);
    root.add(slab(blob(.1, .75, 1.2, .6, 971, 36, .05), .018, .018, P('#c96f5e'), whiteEdge)); root.add(slab(blob(.1, .75, .8, .38, 972, 28, .05), .03, .012, P('#f2c65c'), whiteEdge));

    return {
      start: [0, D / 2 - .95], uni: [.9, D / 2 - .85],
      shadow: { follow: 20 },
      step({ dt, time }) {
        flare = Math.max(0, flare - dt * .7);
        fire.intensity += (1.5 + Math.sin(time * 9) * .15 + Math.sin(time * 13.7) * .1 + flare * 1.2 - fire.intensity) * Math.min(1, dt * 8);
        flames.forEach((f, i) => { const k = 1 + flare * .7 + Math.sin(time * (7 + i * 2.3) + i) * .12; f.scale.set(1 + Math.sin(time * 5 + i) * .06, k, 1); });
      },
      toys: { atelier: { state: () => ({ opened, hung, wins, flares, open: !!document.getElementById('artbook') }) } },
      shots: [roomShot('blokhut', 7.6, 5.8)],
      spots: { easel: [.15, 1.2, -.27], hearth: [1.75, .5, -D / 2 + .38], table: [-1.65, .7, .1] },
      places: { start: [0, D / 2 - .95], easel: [.15, .55], hearth: [1.75, -.2] },
    };
  },
};
