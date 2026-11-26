// Inside her house: the girls' bedroom, built like a doll's house with the front wall taken off. It stands far beside
// the world (lands.js ORIGIN), out of every other shot; her front door in the village is a cut to here (S.door).
// Two beds, a lamp between them, a rug, a window. She leaves by walking down over the doormat at the front.
import { THREE, paper, slab, card, blob, edgeMat, whiteEdge } from './kit.js';

const W = 5.4, D = 3.3, H = 2.7;   // the room: wide, deep, high
const COL = { floor: '#cda97c', wall: '#bfd9cf', wall2: '#a9c9be', skirt: '#f4ecdc', dark: '#43363a', wood: '#b9875a', wood2: '#9a6e47', sheet: '#fbf5ea', pink: '#f4a6c4', yellow: '#f2c65c', rug: '#e98f8f', rug2: '#f6dfc4', sky: '#9fcfd8', frame: '#f4ecdc', mat: '#b98f5c', shade: '#f6dfa6' };
const bulbMat = new THREE.MeshStandardMaterial({ color: '#fff3d6', emissive: '#ffcf86', emissiveIntensity: 1.6 });

export default {
  name: 'huis',
  build(S) {
    const root = S.root, P = c => paper(COL[c]), { girl, sfx } = S;
    const put = (m, x, y, z) => { m.position.set(x, y, z); root.add(m); return m; };
    const box = (w, h, d, c) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), P(c)); m.castShadow = m.receiveShadow = true; return m; };
    const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

    /* ---------------- the box: a dark table, the floor, three walls ---------------- */
    const table = new THREE.Mesh(new THREE.PlaneGeometry(40, 26), P('dark')); table.rotation.x = -Math.PI / 2; table.position.set(0, -.06, 0); table.receiveShadow = true; root.add(table);
    const behind = new THREE.Mesh(new THREE.PlaneGeometry(40, 16), P('dark')); behind.position.set(0, 6, -D / 2 - 1.2); root.add(behind);
    root.add(slab(rect(-W / 2, -D / 2, W / 2, D / 2), 0, .12, P('floor'), edgeMat));
    for (let i = 1; i < 6; i++) { const z = -D / 2 + i * D / 6; const l = slab(rect(-W / 2, z - .012, W / 2, z + .012), .004, .004, paper('#b7925f'), paper('#b7925f')); l.castShadow = false; root.add(l); }   // the gaps between the floorboards
    // the back wall with a window, and the two side walls opened a little like a toy theatre
    const win = [[-.55, 1.15], [.55, 1.15], [.55, 2.05], [-.55, 2.05]];
    const back = card([[-W / 2, 0], [W / 2, 0], [W / 2, H], [-W / 2, H]], .08, P('wall'), edgeMat, [win.slice().reverse()]); put(back, 0, 0, -D / 2);
    put(card([[-W / 2, 0], [W / 2, 0], [W / 2, .16], [-W / 2, .16]], .03, P('skirt')), 0, 0, -D / 2 + .06);
    { const sky = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.1), P('sky')); put(sky, 0, 1.6, -D / 2 - .12);
      const fr = card([[-.64, 1.06], [.64, 1.06], [.64, 2.14], [-.64, 2.14]], .03, P('frame'), P('frame'), [win.slice().reverse()]); put(fr, 0, 0, -D / 2 + .06);
      put(card([[-.03, 1.15], [.03, 1.15], [.03, 2.05], [-.03, 2.05]], .02, P('frame')), 0, 0, -D / 2 + .06); put(card([[-.55, 1.57], [.55, 1.57], [.55, 1.63], [-.55, 1.63]], .02, P('frame')), 0, 0, -D / 2 + .06);
      for (const s of [-1, 1]) put(card([[0, 0], [s * .34, 0], [s * .22, -.5], [s * .3, -1.0], [0, -1.02]], .015, paper('#f3c9d3', { side: THREE.DoubleSide })), -s * .66, 2.16, -D / 2 + .1); }   // curtains
    for (const s of [-1, 1]) { const side = card([[-D / 2, 0], [D / 2, 0], [D / 2, H], [-D / 2, H]], .08, P('wall2'), edgeMat); side.rotation.y = s * (Math.PI / 2 - .28); put(side, s * (W / 2 + .42), 0, 0); }
    // a picture on the wall: a heart cut from pink paper
    { put(card([[-.3, -.26], [.3, -.26], [.3, .26], [-.3, .26]], .03, P('frame')), -1.75, 1.75, -D / 2 + .06);
      const heart = []; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; heart.push([.17 * Math.sin(a) ** 3, .012 * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a))]); }
      put(card(heart, .02, P('pink')), -1.75, 1.76, -D / 2 + .09); }

    /* ---------------- two beds, the lamp between them, the rug ---------------- */
    const beds = {};
    for (const [who, s, quilt] of [['anna', -1, 'pink'], ['fenna', 1, 'yellow']]) {
      const g = new THREE.Group(); g.position.set(s * 1.72, 0, -D / 2 + .62); root.add(g);
      const add = (m, x, y, z) => { m.position.set(x, y, z); g.add(m); return m; };
      add(box(1.6, .26, .9, 'wood'), 0, .2, 0); for (const lx of [-.72, .72]) for (const lz of [-.38, .38]) add(box(.09, .14, .09, 'wood2'), lx, .07, lz);
      add(box(.1, .78, .94, 'wood2'), s * .8, .46, 0);                                                    // the headboard, at the wall's end
      add(box(1.52, .12, .84, 'sheet'), 0, .39, 0);
      add(box(1.0, .1, .88, quilt), -s * .27, .43, 0);                                                    // the quilt, in her colour
      const pil = new THREE.Mesh(new THREE.SphereGeometry(.2, 12, 8), P('sheet')); pil.scale.set(1.25, .45, 1.5); pil.castShadow = true; add(pil, s * .5, .5, 0);
      S.wall(s * 1.72, -D / 2 + .62, .86, .5);
      beds[who] = { g, x: s * 1.72, z: -D / 2 + .62, side: s };
    }
    put(box(.5, .46, .42, 'wood'), 0, .23, -D / 2 + .3); S.wall(0, -D / 2 + .3, .3, .26);
    const lampG = new THREE.Group(); lampG.position.set(0, .46, -D / 2 + .3); root.add(lampG);
    { const foot = new THREE.Mesh(new THREE.CylinderGeometry(.03, .09, .26, 10), P('wood2')); foot.position.y = .13; lampG.add(foot);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), bulbMat); bulb.position.y = .3; lampG.add(bulb);
      const shade = new THREE.Mesh(new THREE.CylinderGeometry(.12, .2, .22, 14, 1, true), paper(COL.shade, { side: THREE.DoubleSide, extra: { emissive: '#f2b866', emissiveIntensity: .35 } })); shade.position.y = .34; lampG.add(shade); }
    const light = S.lamp(0, '#ffc98a', 5.5, 1.5); light.position.set(0, 1.05, -D / 2 + .5); let lit = true;
    S.tap(lampG, () => { lit = !lit; sfx.click(); });
    root.add(slab(blob(0, .35, 1.25, .8, 301, 40, .05), .018, .018, P('rug'), whiteEdge)); root.add(slab(blob(0, .35, .85, .5, 302, 32, .05), .03, .012, P('rug2'), whiteEdge));
    root.add(slab(rect(-.5, D / 2 - .42, .5, D / 2 - .08), .02, .02, P('mat'), whiteEdge));                 // the doormat: the way out

    S.floor(0, rect(-W / 2 + .05, -D / 2 + .1, W / 2 - .05, D / 2 - .02));
    S.door('voordeur', [-W / 2, D / 2 - .3, W / 2, D / 2 + .1], [0, D / 2 - .95], [0, 1]);   // walking down off the front of the room, anywhere along it, is the way out (the mat only shows it)

    /* ---------------- a bed is a toy: she hops on and shuts her eyes; any push or a touch and she is up again ---------------- */
    const bedToy = b => {
      let mode = 'on', t = 0; const [bx, bz] = S.at([b.x, b.z]);
      const toy = { look: S.at([b.x * .5, 0]), step(dt, inp) {
        t += dt;
        if (mode === 'on') { const k = Math.min(1, t / .32); girl.x = bx - b.side * .25; girl.z = bz + (1 - k) * .75; girl.lift = .5 * k + Math.sin(k * Math.PI) * .3; girl.poseName = k > .5 ? 'sit' : null; girl.view = 'side'; girl.face = -b.side; if (k >= 1) { mode = 'bed'; t = 0; sfx.hop(); } return; }
        if (mode === 'bed') { girl.lift = .5; girl.poseName = 'sit'; girl.asleep = t > 1.1; if (inp.act || inp.x) { mode = 'off'; t = 0; girl.asleep = false; } return; }
        const k = Math.min(1, t / .3); girl.z = bz + k * .78; girl.lift = .5 * (1 - k) + Math.sin(k * Math.PI) * .25; girl.poseName = null;
        if (k >= 1) { girl.lift = 0; S.stopPlay(); }
      } };
      return () => { if (S.playing()) return; S.walkThen(bx - b.side * .25, bz + .78, () => { if (S.playing()) return; mode = 'on'; t = 0; S.play(toy); }, 1.2); };
    };
    for (const b of Object.values(beds)) S.tap(b.g, bedToy(b));

    return {
      start: [0, D / 2 - .95], uni: [.9, D / 2 - .8],
      shadow: { follow: 20 },
      step({ dt }) { light.intensity += ((lit ? 1.9 : 0) - light.intensity) * Math.min(1, dt * 6); bulbMat.emissiveIntensity = lit ? 1.6 : .15; },
      shots: [{ name: 'kamer', ax: 0, az: -.1, fx: .3, fy: .2, fz: .25, lag: 1, span: 7.4, tall: 5.6, rise: .36, riseTall: .5 }],
      spots: { bed: [beds.anna.x, .6, beds.anna.z], lamp: [0, .8, -D / 2 + .3] },
      places: { start: [0, D / 2 - .95], bed: [beds.anna.x + .25, beds.anna.z + .78], middle: [0, .2] },
      info: () => ({ lit }),
    };
  },
};
