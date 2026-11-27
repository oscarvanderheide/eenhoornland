// Inside the clothes shop: a room of its own far beside the world, in through the shop's door in the village (Oscar: "the
// store where we can buy outfits should also be like a room we enter, not us standing in the outside world").
// Pink walls, a wooden floor, a rail of dresses along the back wall, hats on a little table, a tall mirror, and the counter
// with the shopkeeper behind it.
//   the counter, the shopkeeper, the clothes    a tap: she walks to the counter, and the shop's sheet opens (shopui.js)
//   the mirror                                    a tap: she walks over, looks at herself and gives a little twirl
//   out                                            walking down off the front of the room, over the mat
import { THREE, paper, slab, blob, whiteEdge } from './kit.js';
import { cutout } from './figures.js';
import { drawWearIcon } from './kids.js';
import { PEOPLE } from './people.js';
import { SHELF } from './shopui.js';
import { roomShell, roomShot } from './rooms.js';

const W = 5.6, D = 3.4, H = 2.8;

export default {
  name: 'winkel',
  build(S) {
    const { girl, sfx } = S, root = S.root;
    const { put, box, P } = roomShell(S, { W, D, H, floor: '#d9b58a', boards: '#c39d70', wall: '#f8dde4', side: '#f4c6d4', dark: '#4a3640', skirt: '#fbf5ea', windows: [[-1.85, 1.75, .9, .8]], sky: '#bfe3ea', door: 'winkel', mat: '#e98fae',
      arrive: () => { girl.lift = 0; girl.poseName = null; } });
    // the wallpaper: rows of little white dots
    for (let r = 0; r < 5; r++) for (let i = 0; i < 12; i++) { const x = -W / 2 + .25 + i * .46 + (r % 2) * .23, y = .5 + r * .48; if (Math.abs(x + 1.85) < .62 && Math.abs(y - 1.75) < .55) continue; put(new THREE.Mesh(new THREE.CircleGeometry(.035, 8), P('#fdf1f4')), x, y, -D / 2 + .045); }
    const pic = (id, w) => { const t = new THREE.CanvasTexture(cutout(120, 120, c => drawWearIcon(c, id), null, 1.5)); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w), new THREE.MeshStandardMaterial({ map: t, alphaTest: .5, roughness: .95, side: THREE.DoubleSide })); m.castShadow = true; return m; };
    const clothes = new THREE.Group(); root.add(clothes);

    /* ---------------- the rail of dresses on the back wall, each on its hanger ---------------- */
    { const r = box(2.9, .05, .05, '#c79a66'); put(r, .2, 2.05, -D / 2 + .3, clothes); for (const s of [-1, 1]) put(box(.05, .3, .3, '#a97a4e'), .2 + s * 1.45, 2.05, -D / 2 + .16, clothes);
      ['jurkgeel', 'onesie', 'jurkregenboog', 'vleugels', 'jurkblauw'].forEach((id, i) => { const x = -.95 + i * .58;
        const hook = new THREE.Mesh(new THREE.TorusGeometry(.05, .012, 5, 10, Math.PI * 1.3), P('#8d6a48')); put(hook, x, 2.05, -D / 2 + .32, clothes);
        put(pic(id, .62), x, 1.66, -D / 2 + .34 + (i % 2) * .02, clothes); }); }
    /* ---------------- hats and little things on a low table at the left ---------------- */
    put(box(1.3, .06, .55, '#e8d5b0'), -1.85, .62, -D / 2 + .55, clothes); for (const s of [-1, 1]) put(box(.06, .6, .5, '#c79a66'), -1.85 + s * .58, .3, -D / 2 + .55, clothes);
    ['kroon', 'hoed', 'krans'].forEach((id, i) => put(pic(id, .42), -2.3 + i * .44, .88, -D / 2 + .6, clothes));
    S.wall(-1.85, -D / 2 + .55, .68, .32);
    /* ---------------- the mirror: a tall oval in a wooden frame, standing at the left front ---------------- */
    const mirror = new THREE.Group(); mirror.position.set(-2.35, 0, .35); mirror.rotation.y = .55; root.add(mirror);
    { const oval = new THREE.Mesh(new THREE.CircleGeometry(.36, 28), new THREE.MeshStandardMaterial({ color: '#dcebf0', roughness: .25, metalness: .1, emissive: '#cfe6ee', emissiveIntensity: .25 })); oval.scale.y = 1.6; oval.position.set(0, 1.05, .03); mirror.add(oval);
      const shine = new THREE.Mesh(new THREE.PlaneGeometry(.05, .5), P('#ffffff')); shine.rotation.z = -.5; shine.position.set(-.12, 1.25, .04); mirror.add(shine);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(.38, .045, 6, 28), P('#c79a66')); rim.scale.y = 1.58; rim.position.set(0, 1.05, .02); rim.castShadow = true; mirror.add(rim);
      for (const s of [-1, 1]) { const l = box(.05, .5, .05, '#a97a4e'); l.position.set(s * .22, .25, 0); mirror.add(l); } }
    S.solid({ x: -2.35, z: .35, r: .3 });
    /* ---------------- the counter, and the shopkeeper behind it ---------------- */
    const counter = new THREE.Group(); counter.position.set(1.45, 0, -.25); root.add(counter);
    { const add = (m, x, y, z) => { m.position.set(x, y, z); counter.add(m); return m; };
      add(box(1.9, .82, .55, '#d9a8b8'), 0, .41, 0); add(box(2.02, .07, .66, '#e8d5b0'), 0, .855, 0);
      for (let i = 0; i < 4; i++) add(box(.03, .6, .01, '#f4c6d4'), -.7 + i * .47, .42, .28);
      [['#f7b6cf', .9], ['#9ed9cf', .96], ['#f2c65c', .92]].forEach(([c, w], i) => add(box(.36 * w, .07, .28, c), .6, .93 + i * .075, 0));
      const bell = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), P('#e0b453')); add(bell, -.6, .89, .05);
      const k = pic('knuffel', .42); add(k, .05, 1.08, .05); const b = pic('ballon', .5); add(b, .88, 1.32, -.12); }
    S.wall(1.45, -.25, 1.0, .33); S.wall(1.45, -1.15, 1.2, .6);   // (behind the counter is hers, the shopkeeper's)
    const keeper = S.figure('winkelier', PEOPLE.winkelier); [keeper.x, keeper.z] = S.at([1.45, -.95]); keeper.floatY = keeper.y = 0; keeper.face = -1;
    let mood = 'smile', moodT = 0, opened = 0, twirls = 0, spin = 0; const FR = { smile: 0, dress: 1, wave: 2 };
    keeper.act = () => keeper.setFrame(FR[mood] || 0);
    const setMood = how => { mood = how; moodT = how === 'smile' ? 0 : 2.2; if (how === 'wave') keeper.hopV = 1.4; };
    const [cx, cz] = S.at([1.3, .45]);
    const shop = () => { if (S.playing() || document.getElementById('shopbook')) return; S.walkThen(cx, cz, () => { girl.view = 'back'; opened++; setMood('wave'); S.closet.open(setMood); }, .7); };
    keeper.onTap = shop; S.tap(counter, shop, 'toonbank'); S.tap(clothes, shop);
    const [mx, mz] = S.at([-1.75, .75]);
    S.tap(mirror, () => { if (S.playing()) return; S.walkThen(mx, mz, () => { twirls++; spin = 1; girl.hopV = 2.2; sfx.chime(); S.confetti(girl.x, girl.y + 1, girl.z, ['#f4a6c4', '#fbf7ee', '#bba6ea'], 10, S.starGeo, 1.6); }, .5); }, 'spiegel');
    // a round pink rug in the middle, and a lamp
    root.add(slab(blob(-.2, .55, 1.1, .6, 911, 36, .04), .018, .018, P('#f4b4c9'), whiteEdge)); root.add(slab(blob(-.2, .55, .7, .36, 912, 28, .04), .03, .012, P('#fbe3ea'), whiteEdge));
    const light = S.lamp(0, '#ffd7b0', 7, 1.4); light.position.set(0, 2.3, 0);   // (a lamp is placed in the set's own measure)

    return {
      start: [0, D / 2 - .95], uni: [-.9, D / 2 - .8],
      shadow: { follow: 20 },
      step({ dt }) {
        light.intensity += (1.8 - light.intensity) * Math.min(1, dt * 4);
        if (moodT > 0) { moodT -= dt; if (moodT <= 0) mood = 'smile'; }
        if (spin > 0) { spin = Math.max(0, spin - dt * 1.6); girl.view = spin > .66 ? 'back' : spin > .33 ? 'side' : 'front'; girl.face = spin > .5 ? -1 : 1; }
      },
      toys: { toonbank: { state: () => ({ coins: S.coins.have(), own: SHELF.filter(id => S.closet.owns(id)), wearing: SHELF.filter(id => S.closet.wearing(id)), open: !!document.getElementById('shopbook'), opened, mood, twirls }) } },
      shots: [roomShot('winkel', 8.0, 6.0)],
      spots: { counter: [1.45, .9, -.25], mirror: [-2.35, 1.0, .35], rail: [.2, 1.7, -D / 2 + .34] },
      places: { start: [0, D / 2 - .95], counter: [1.3, .45], mirror: [-1.75, .75] },
    };
  },
};
