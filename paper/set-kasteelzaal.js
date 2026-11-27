// Inside the castle: the great hall, a room of its own far beside the world, in through the castle's gate (Oscar: "i cant
// seem to enter the castle"). A floor of pink and cream tiles, a red carpet from the door to the throne, two tall windows,
// banners, a chandelier of candles.
//   the throne       a tap: she walks up the carpet, climbs onto it and sits; a fanfare, and sparkles round her like a crown
//                    (any push and she gets down again)
//   the music box    a golden box on a stand: a tap and it plays Für Elise, and she and her unicorn dance to it
//   the chandelier   a tap: the candles go out, or are lit again
//   out              walking down off the front of the hall, over the mat
import { THREE, paper, slab, card } from './kit.js';
import { roomShell, roomShot } from './rooms.js';

const W = 7.4, D = 4.2, H = 3.8;

export default {
  name: 'kasteelzaal',
  build(S) {
    const { girl, uni, sfx } = S, root = S.root;
    const { put, box, rect, P } = roomShell(S, { W, D, H, floor: '#efe2d2', wall: '#f3e3d0', side: '#e8d2bd', dark: '#3a2f3a', skirt: '#d9c3a8', windows: [[-2.6, 2.1, .8, 1.5], [2.6, 2.1, .8, 1.5]], sky: '#bfe3ea', frame: '#c9a46a', door: 'kasteelzaal', mat: '#d9534f',
      arrive: () => { girl.lift = 0; girl.poseName = null; } });
    // the tiles, pink and cream, and the red carpet with a gold edge from the door to the throne
    for (let i = 0; i < 12; i++) for (let j = 0; j < 7; j++) if ((i + j) % 2) root.add(slab(rect(-W / 2 + i * W / 12, -D / 2 + j * D / 7, -W / 2 + (i + 1) * W / 12, -D / 2 + (j + 1) * D / 7), .004, .004, P('#f4c9d4'), P('#f4c9d4')));
    root.add(slab(rect(-.62, -D / 2 + 1.0, .62, D / 2 - .1), .012, .008, P('#e3b04b'), P('#e3b04b'))); root.add(slab(rect(-.52, -D / 2 + 1.0, .52, D / 2 - .1), .02, .008, P('#c9433f'), P('#c9433f')));
    // banners on the back wall: a swallow-tailed strip each, with a golden sun
    for (const [x, c] of [[-1.35, '#5f86b0'], [1.35, '#9a5fb0']]) { put(card([[-.28, 0], [.28, 0], [.28, -1.5], [0, -1.2], [-.28, -1.5]], .02, P(c)), x, 3.2, -D / 2 + .08); put(new THREE.Mesh(new THREE.CircleGeometry(.15, 16), P('#f2c65c')), x, 2.55, -D / 2 + .11); put(box(.7, .05, .05, '#c9a46a'), x, 3.22, -D / 2 + .1); }

    /* ---------------- the throne on its dais ---------------- */
    const throne = new THREE.Group(); throne.position.set(0, 0, -D / 2 + .65); root.add(throne);
    { const add = (m, x, y, z) => { m.position.set(x, y, z); throne.add(m); return m; };
      add(box(2.2, .14, 1.3, '#d9c3a8'), 0, .07, .1); add(box(1.6, .14, 1.0, '#e8d5b0'), 0, .21, .05);                     // two steps up
      add(box(.9, .42, .7, '#c9433f'), 0, .49, 0); add(box(.96, .1, .76, '#e3b04b'), 0, .73, 0);                            // the seat
      for (const s of [-1, 1]) { add(box(.12, .35, .7, '#e3b04b'), s * .48, .9, 0); add(new THREE.Mesh(new THREE.SphereGeometry(.08, 10, 8), P('#f2c65c')), s * .48, 1.1, .3); }
      const back = card([[-.5, 0], [.5, 0], [.5, 1.3], [.3, 1.5], [0, 1.75], [-.3, 1.5], [-.5, 1.3]], .08, P('#e3b04b')); add(back, 0, .7, -.36);
      const pad = card([[-.36, 0], [.36, 0], [.36, 1.05], [0, 1.3], [-.36, 1.05]], .04, P('#c9433f')); add(pad, 0, .82, -.3);
      add(new THREE.Mesh(new THREE.CircleGeometry(.13, 5), P('#f6dfa6')), 0, 2.2, -.3); }
    S.wall(0, -D / 2 + .65, 1.1, .7);
    const [tx, tz] = S.at([0, -D / 2 + .65]); let sits = 0, sitT = -1;
    const sitToy = { look: [tx, tz + 1], rest: true, mode: 'on', t: 0, step(dt, inp) {
      const q = sitToy; q.t += dt;
      if (q.mode === 'on') { const k = Math.min(1, q.t / .45); girl.x = tx; girl.z = tz + 1.35 - .95 * k; girl.lift = .78 * k + Math.sin(k * Math.PI) * .3; girl.poseName = k > .6 ? 'sit' : null; girl.view = k > .6 ? 'front' : 'back';
        if (k >= 1) { q.mode = 'sit'; q.t = 0; sits++; sitT = 0; sfx.song('fanfare', 'trumpet'); S.coins.reward('troon', tx, 2.4, tz); } return; }
      if (q.mode === 'sit') { girl.lift = .78; girl.poseName = 'sit'; girl.view = 'front';
        if (q.t > .6 && (inp.act || inp.x || inp.y)) { q.mode = 'off'; q.t = 0; } return; }
      const k = Math.min(1, q.t / .4); girl.z = tz + .4 + .95 * k; girl.lift = .78 * (1 - k) + Math.sin(k * Math.PI) * .25; girl.poseName = null; girl.view = 'front';
      if (k >= 1) { girl.lift = 0; S.stopPlay(); } } };
    S.tap(throne, () => { if (S.playing()) return; S.walkThen(tx, tz + 1.35, () => { if (S.playing()) return; sitToy.mode = 'on'; sitToy.t = 0; S.play(sitToy); }, .5); }, 'troon');

    /* ---------------- the music box on its stand ---------------- */
    const mb = new THREE.Group(); mb.position.set(2.5, 0, .6); root.add(mb);
    { const add = (m, x, y, z) => { m.position.set(x, y, z); mb.add(m); return m; };
      add(new THREE.Mesh(new THREE.CylinderGeometry(.16, .22, .8, 10), P('#e8d5b0')), 0, .4, 0); add(box(.6, .3, .42, '#e3b04b'), 0, .95, 0); add(box(.64, .05, .46, '#c9a46a'), 0, 1.12, 0);
      const key = add(box(.04, .16, .16, '#c9a46a'), .33, .97, 0); key.userData.live = true; mb.userData.key = key;
      const dancer = new THREE.Group(); dancer.position.set(0, 1.15, 0); dancer.userData.live = true; mb.add(dancer); mb.userData.dancer = dancer;
      const skirt = new THREE.Mesh(new THREE.ConeGeometry(.12, .12, 12), P('#f4a6c4')); skirt.position.y = .1; dancer.add(skirt); const body = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 6), P('#f6dfc4')); body.position.y = .22; dancer.add(body); }
    S.solid({ x: 2.5, z: .6, r: .35 });
    const [bx, bz] = S.at([1.7, 1.1]); let playing = -1, plays = 0, song = null;
    S.tap(mb, () => { if (playing >= 0) return; S.walkThen(bx, bz, () => { if (playing >= 0) return; song = sfx.song('elise', 'musicbox'); playing = 0; plays++; girl.view = 'front'; }, .6); }, 'speeldoos');

    /* ---------------- the chandelier ---------------- */
    const ch = new THREE.Group(); ch.position.set(0, 3.0, .2); root.add(ch);
    const flame = new THREE.MeshStandardMaterial({ color: '#ffd98a', emissive: '#ffb84d', emissiveIntensity: 1.4, roughness: .8 });
    { const ring = new THREE.Mesh(new THREE.TorusGeometry(.55, .04, 6, 24), P('#e3b04b')); ring.rotation.x = Math.PI / 2; ch.add(ring); const chain = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, 1, 4), P('#c9a46a')); chain.position.y = .5; ch.add(chain);
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, c = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .16, 6), P('#fbf5ea')); c.position.set(Math.cos(a) * .55, .1, Math.sin(a) * .55); ch.add(c); const f = new THREE.Mesh(new THREE.SphereGeometry(.035, 6, 5), flame); f.scale.y = 1.6; f.position.set(Math.cos(a) * .55, .22, Math.sin(a) * .55); ch.add(f); } }
    const light = S.lamp(0, '#ffcf8a', 9, 1.3); light.position.set(0, 2.8, .2); let lit = true;
    S.tap(ch, () => { lit = !lit; sfx.click(); }, 'kroonluchter');

    return {
      start: [0, D / 2 - .95], uni: [-.9, D / 2 - .85],
      shadow: { follow: 20 },
      step({ dt, time }) {
        light.intensity += ((lit ? 2.1 : .2) - light.intensity) * Math.min(1, dt * 6); flame.emissiveIntensity = lit ? 1.4 + Math.sin(time * 11) * .15 : 0;
        if (sitT >= 0) { sitT += dt; if (Math.floor(sitT / .3) !== Math.floor((sitT - dt) / .3) && sitT < 2.4) S.confetti(girl.x, girl.y + 1.55, girl.z + .1, ['#f2c65c', '#fbf5ea', '#f4a6c4'], 5, S.starGeo, 1.2); if (sitT > 2.4) sitT = -1; }
        // the music box plays: the little dancer turns, and she and her unicorn dance
        if (playing >= 0) { playing += dt; mb.userData.dancer.rotation.y += dt * 3; mb.userData.key.rotation.x -= dt * 2;
          if (!S.playing()) { const beat = Math.floor(playing / .52); girl.view = ['front', 'side', 'back', 'side'][beat % 4]; girl.face = beat % 4 === 3 ? -1 : 1; if (beat !== Math.floor((playing - dt) / .52)) { girl.hopV = 1.6; if (uni && !uni.away) uni.hopV = 2; } }
          if (playing > ((song && song.dur) || 8) + .3 || (girl.walking && playing > .5)) { playing = -1; if (song && song.stop) song.stop(); song = null; girl.view = 'front'; } }
      },
      toys: { zaal: { state: () => ({ sits, plays, dancing: playing >= 0, lit, sitting: S.playing() === sitToy && sitToy.mode === 'sit' }) } },
      shots: [roomShot('kasteelzaal', 9.2, 6.8)],
      spots: { throne: [0, 1.1, -D / 2 + .65], musicbox: [2.5, 1.0, .6], chandelier: [0, 3.0, .2] },
      places: { start: [0, D / 2 - .95], throne: [0, -D / 2 + 2.0], musicbox: [1.7, 1.1] },
    };
  },
};
