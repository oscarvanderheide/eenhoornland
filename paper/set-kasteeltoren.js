// The top of the castle's tower: the magic (PLAN.md "The castle: the end of the story"). Up the stairs behind the golden
// door: a round stone top with battlements, at night, under a sky full of paper stars, the moon low.
//   the stars    one shines brighter than the rest and pulses: a tap on it, and a line of light runs to it from the last
//                one, with a note (each one higher); the next one lights up. Star by star she draws a big unicorn in the sky
//   alive        the last line closes the picture: it fills with light and the unicorn is there in the sky, a shooting star
//                goes over, stars rain down on the tower and the camera goes far back. Then it is time for the feast: down
//                she goes, and the hall below wakes up (set-kasteelzaal.js)
//   out          walking down off the front: down the stairs to the hall
import { THREE, paper, slab, card, circlePts, PAPER, edgeMat, whiteEdge } from './kit.js';
import { cutout, FIGS } from './figures.js';

const R = 3.2;
/** the unicorn's head in stars, in the sky's own measure (x across, y up): horn, ear, mane, neck, chin, nose, and back to the horn */
const DOTS = [[1.5, 5.6], [.75, 4.5], [.1, 4.75], [-.6, 4.2], [-1.5, 3.4], [-1.55, 2.2], [.25, 2.35], [1.7, 3.05], [1.35, 3.95]].map(([x, y]) => [x * 1.15, y * .8 - .35]);
const NOTES = [523.3, 587.3, 659.3, 784, 880, 1046.5, 1174.7, 1318.5, 1568];

export default {
  name: 'kasteeltoren',
  build(S) {
    const { girl, uni, sfx } = S, root = S.root, P = c => paper(c);
    // the tower's top: a round stone floor, the dark below, battlements round the back, the stair's hatch at the front
    const table = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.MeshBasicMaterial({ color: '#232b48' })); table.rotation.x = -Math.PI / 2; table.position.y = -.06; root.add(table);
    root.add(slab(circlePts(R, 961, 40), 0, .3, P('#cfc8d6'), P('#b3abc0')));
    for (let i = 0; i < 9; i++) { const a = Math.PI * (1.05 + i * .1), x = Math.cos(a) * (R - .15), z = Math.sin(a) * (R - .15), m = new THREE.Mesh(new THREE.BoxGeometry(.5, i % 2 ? .55 : .8, .3), P(i % 2 ? '#c4bccf' : '#d6d0de')); m.position.set(x, (i % 2 ? .55 : .8) / 2, z); m.rotation.y = -a + Math.PI / 2; m.castShadow = true; root.add(m); }
    root.add(slab([[-.55, R - .9], [.55, R - .9], [.55, R - .2], [-.55, R - .2]], .012, .01, P('#4a3f5c'), P('#4a3f5c')));   // the hatch to the stairs
    S.floor(0, circlePts(R - .25, 961, 40));
    S.door('toren', [-R, R - .6, R, R + .3], [0, R - 1.3], [0, 1]);
    // the night sky: a big dark card, a moon, little stars everywhere
    const SKY_Z = -R - 1.2;
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(26, 14), new THREE.MeshBasicMaterial({ color: '#26304f' })); sky.position.set(0, 4.5, SKY_Z - .2); root.add(sky);
    const moon = card(circlePts(.55, 962, 26), .02, new THREE.MeshBasicMaterial({ color: '#f6e7b8' })); moon.position.set(-4.6, 4.6, SKY_Z); root.add(moon);
    const twinkle = []; for (let i = 0; i < 70; i++) { const x = ((i * 37) % 100) / 100 * 22 - 11, y = 1.6 + ((i * 53) % 100) / 100 * 8.5; const m = new THREE.Mesh(new THREE.CircleGeometry(.025 + (i % 3) * .015, 6), new THREE.MeshBasicMaterial({ color: '#fbf5ea', transparent: true })); m.position.set(x, y, SKY_Z - .1); root.add(m); twinkle.push(m); }
    // the picture's stars: bigger, four points; the next one to tap shines and pulses
    const star4 = r => { const p = []; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + Math.PI / 2, q = i % 2 ? r * .38 : r; p.push([Math.cos(a) * q, Math.sin(a) * q]); } return p; };
    const lit = c => new THREE.MeshBasicMaterial({ color: c, transparent: true });
    const big = DOTS.map(([x, y], i) => { const g = new THREE.Group(); g.position.set(x, y, SKY_Z + .05); g.userData.live = true; root.add(g);
      const s = card(star4(.22), .01, lit('#fff3c4')); g.add(s); const glow = new THREE.Mesh(new THREE.CircleGeometry(.34, 20), lit('#ffe9a8')); glow.material.opacity = 0; glow.position.z = -.01; g.add(glow);
      const hit = new THREE.Mesh(new THREE.CircleGeometry(.6, 12), new THREE.MeshBasicMaterial({ visible: false })); g.add(hit); return { g, s, glow, x, y }; });
    const lines = []; let next = 0, done = -1, made = 0, first = true;
    const lineTo = (a, b) => { const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), m = new THREE.Mesh(new THREE.PlaneGeometry(1, .07), lit('#ffe9a8')); m.position.set(a.x, a.y, SKY_Z + .03); m.rotation.z = Math.atan2(dy, dx); root.add(m); lines.push({ m, a, L, t: 0 }); };
    big.forEach((b, i) => S.tap(b.g, () => {
      if (i !== next || done >= 0) { if (done < 0) { b.g.userData.wob = 1; sfx.peep(); } return; }
      sfx.note(NOTES[i]); b.glow.material.opacity = .6; S.confetti(...S.at([b.x, SKY_Z + .3]).flatMap((v, j) => j ? [b.y, v] : [v]), ['#fff3c4', '#ffe9a8'], 6, S.starGeo, 1.2);
      if (i > 0) lineTo(big[i - 1], b); next++;
      if (next === big.length) { lineTo(big[big.length - 1], big[1]); done = 0; made++; } }, 'ster' + i));
    // the picture that comes alive: her unicorn's own drawing, glowing, filling the outline
    const tex = new THREE.CanvasTexture(cutout(FIGS.grown.w, FIGS.grown.h, c => FIGS.grown.draw(c, 0), PAPER, 1)); tex.colorSpace = THREE.SRGBColorSpace;
    const alive = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6 * FIGS.grown.h / FIGS.grown.w), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false })); alive.position.set(.1, 2.75, SKY_Z + .02); alive.scale.y = .85; alive.scale.x = -1; root.add(alive);
    const shoot = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .06), lit('#fff8dc')); shoot.visible = false; root.add(shoot);
    const light = S.lamp(0, '#c8d0ff', 9, 1.3); light.position.set(0, 3, 0);
    // the magic: the camera goes back, the stars rain, then down to the feast
    const magic = { look: S.at([0, SKY_Z + 1.5]), rate: .5, shot: { span: 13, tall: 10, rise: .1, riseTall: .16, ly: 2.2, dof: .2, range: 6, fx: 1, fz: 1, lag: 1 }, step() { } };
    const look = { span: 10.5, tall: 8, rise: .1, riseTall: .16, ly: 1.5, dof: .25, range: 5 };

    return {
      start: [0, R - 1.3], uni: [-1.0, R - 1.6],
      shadow: { follow: 20 },
      step({ dt, time }) {
        if (first) { first = false; if (S.coins.had('magie')) { next = big.length; for (let i = 1; i < big.length; i++) lineTo(big[i - 1], big[i]); lineTo(big[big.length - 1], big[1]); for (const l of lines) l.t = 1; done = 99; } }   // (drawn before, in this save: the picture is there)
        light.intensity += (1.6 - light.intensity) * Math.min(1, dt * 3);
        for (const [i, m] of twinkle.entries()) m.material.opacity = .55 + Math.sin(time * (1 + i % 4) + i) * .35;
        big.forEach((b, i) => { const want = i === next && done < 0 ? .4 + Math.sin(time * 5) * .25 : i < next || done >= 0 ? .3 : 0; b.glow.material.opacity += (want - b.glow.material.opacity) * Math.min(1, dt * 6); b.s.scale.setScalar(i === next && done < 0 ? 1.25 + Math.sin(time * 5) * .2 : 1);
          b.g.userData.wob = Math.max(0, (b.g.userData.wob || 0) - dt * 2); b.g.rotation.z = Math.sin((b.g.userData.wob || 0) * 16) * (b.g.userData.wob || 0) * .3; });
        for (const l of lines) { l.t = Math.min(1, l.t + dt * 2.2); l.m.scale.x = Math.max(.001, l.L * l.t); l.m.position.set(l.a.x + Math.cos(l.m.rotation.z) * l.L * l.t / 2, l.a.y + Math.sin(l.m.rotation.z) * l.L * l.t / 2, SKY_Z + .03); }
        // her unicorn's horn glows while she draws
        if (uni && !uni.away && done < 0 && Math.floor(time * 3) !== Math.floor((time - dt) * 3)) S.confetti(uni.x + uni.face * .55, (uni.y || 0) + 1.75, uni.z + .05, ['#fff3c4', '#e2d8f4'], 2, S.starGeo, .8);
        if (done >= 90) alive.material.opacity = .9;
        else if (done >= 0) { const was = done; done += dt;
          if (was < .6 && done >= .6) { S.play(magic); sfx.chime(); sfx.song('twinkle', 'musicbox'); if (uni && !uni.away) { uni.hopV = 3; sfx.neigh(); } }
          alive.material.opacity = Math.min(.9, Math.max(0, (done - .6) / 1.6));
          if (done > 2.2 && done < 3.4) { const k = (done - 2.2) / 1.2; shoot.visible = true; shoot.position.set(6 - k * 12, 7.5 - k * 3, SKY_Z + .1); shoot.rotation.z = .24; } else shoot.visible = false;
          if (done > 2.8 && done < 6 && Math.floor(done * 5) !== Math.floor((done - dt) * 5)) { const [x, z] = S.at([(Math.random() - .5) * 5, (Math.random() - .5) * 3]); S.confetti(x, 4.5, z, ['#fff3c4', '#f4a6c4', '#9ed9cf', '#bba6ea', '#f2c65c'], 10, S.starGeo, 1.4); }
          if (was < 6.4 && done >= 6.4) { S.coins.had('magie', true); S.shared.unfoldNext = true; S.coins.reward('magie-sterren', girl.x, girl.y + 1.4, girl.z); S.stopPlay(); S.through('toren'); } }   // (down to the hall, which wakes up: set-kasteelzaal.js)
        else alive.material.opacity = 0;
      },
      toys: { toren: { state: () => ({ next, of: big.length, done: done >= 0, made, magic: S.coins.had('magie') }) } },
      shots: [{ name: 'toren', ax: 0, az: 0, fx: .3, fy: .2, fz: .2, lag: 1, ...look }],
      spots: Object.fromEntries(big.map((b, i) => ['ster' + i, [b.x, b.y, SKY_Z + .05]])),
      places: { start: [0, R - 1.3], middle: [0, 0] },
    };
  },
};
