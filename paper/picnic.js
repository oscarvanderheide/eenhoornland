// The picnic in the forest clearing: a checked cloth with a basket on it. A tap and she sits down on it; then whoever of
// the forest's animals has been asked comes over and sits with her (they have a way to come: the hedgehog trundles, the
// squirrel runs). When she gets up (a push, or a touch) they go home. Nothing is won: it is company.
import { THREE, paper, slab } from './kit.js';

export function picnic(S, x, y, z, guests) {
  const { girl, sfx } = S, g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g);
  const W = 2.2, D = 1.5, rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
  g.add(slab(rect(-W / 2, -D / 2, W / 2, D / 2), .03, .03, paper('#d9706c'), paper('#c05f5c')));
  for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) { const q = slab(rect(-W / 2 + i * W / 6 + .02, -D / 2 + j * D / 4 + .02, -W / 2 + (i + 1) * W / 6 - .02, -D / 2 + (j + 1) * D / 4 - .02), .036, .006, paper('#fbf5ea'), paper('#fbf5ea')); q.castShadow = false; g.add(q); }
  const add = (m, px, py, pz) => { m.position.set(px, py, pz); m.castShadow = true; g.add(m); return m; };
  add(new THREE.Mesh(new THREE.CylinderGeometry(.2, .16, .2, 12), paper('#c79a66')), .55, .13, -.3);                       // the basket
  { const h = new THREE.Mesh(new THREE.TorusGeometry(.18, .02, 5, 12, Math.PI), paper('#a97a4e')); add(h, .55, .23, -.3); }
  add(new THREE.Mesh(new THREE.CylinderGeometry(.19, .19, .012, 14), paper('#fbf5ea')), -.5, .045, -.25);                   // a plate
  for (const [ax, az, c] of [[-.56, -.3, '#d9706c'], [-.42, -.2, '#e6b748'], [.2, -.45, '#d9706c']]) add(new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), paper(c)), ax, .11, az);
  const [wx, wz] = S.at([x, z]); let mode = null, t = 0, sits = 0, cheered = false;
  const seats = [[wx - 1.25, wz - .15], [wx + 1.3, wz + .1]];
  const toy = { rest: true, look: [wx, wz + .4], step(dt, inp) {
    t += dt;
    if (mode === 'on') { const k = Math.min(1, t / .3); girl.x = wx - .1; girl.z = wz + .35 + (1 - k) * .6; girl.lift = .03 * k + Math.sin(k * Math.PI) * .25; girl.poseName = k > .5 ? 'sit' : null; girl.view = 'side'; girl.face = 1;
      if (k >= 1) { mode = 'sit'; t = 0; sits++; cheered = false; sfx.hop(); guests.forEach((q, i) => q.guest.invite(seats[i % seats.length])); } return; }
    if (mode === 'sit') { girl.lift = .03; girl.poseName = 'sit';
      if (!cheered && guests.every(q => q.guest.there())) { cheered = true; sfx.chime(); S.confetti(wx, y + .9, wz, ['#f4a6c4', '#f8dde4', '#f2c65c'], 12, undefined, 2.2); }   // everybody is here
      if (inp.act || inp.x) { mode = 'off'; t = 0; guests.forEach(q => q.guest.leave()); } return; }
    const k = Math.min(1, t / .28); girl.z = wz + .35 + k * .65; girl.lift = Math.sin(k * Math.PI) * .2; girl.poseName = null; if (k >= 1) { girl.lift = 0; mode = null; S.stopPlay(); }
  } };
  S.tap(g, () => { if (S.playing()) return; S.walkThen(wx - .1, wz + .95, () => { if (S.playing()) return; mode = 'on'; t = 0; S.play(toy); }, 1.1); });
  return { toy, state: () => ({ mode, sits, cheered, there: guests.map(q => q.guest.there()) }) };
}
