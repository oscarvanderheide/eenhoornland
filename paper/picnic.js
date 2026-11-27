// The picnic in the forest clearing: a checked cloth with a basket of apples and a little bowl of hazelnuts on it. A tap on
// the cloth and she sits down on it; then whoever of the forest's animals has been asked comes over and sits with her
// (they have a way to come: the hedgehog trundles, the squirrel runs). When she gets up (a push, or a touch) they go home.
// Nothing is won: it is company.
//   the apples    a tap (sitting, or she sits down first): she takes one and eats it, in three crunchy bites
//   the nuts      a tap: she cracks a hazelnut open and pops it in her mouth; her guests hop for one too
import { THREE, paper, slab } from './kit.js';
import { THINGS } from './things.js';

export function picnic(S, x, y, z, guests) {
  const { girl, sfx } = S, g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g);
  const W = 2.2, D = 1.5, rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
  g.add(slab(rect(-W / 2, -D / 2, W / 2, D / 2), .03, .03, paper('#d9706c'), paper('#c05f5c')));
  for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) { const q = slab(rect(-W / 2 + i * W / 6 + .02, -D / 2 + j * D / 4 + .02, -W / 2 + (i + 1) * W / 6 - .02, -D / 2 + (j + 1) * D / 4 - .02), .036, .006, paper('#fbf5ea'), paper('#fbf5ea')); q.castShadow = false; g.add(q); }
  // the food: cut-paper cards like everything she holds (Oscar: "let the apples and food and whatnot ... all be paper style"): the basket of apples, a bowl of hazelnuts, an apple and a pear on the cloth
  const [cx0, cz0] = S.at([x, z]), card2 = (name, spec, dx, dz, up = 0) => { const f = S.figure(name, spec); f.x = cx0 + dx; f.z = cz0 + dz; f.floatY = f.y = y + .04 + up; f.thing = true; return f; };
  const basket = card2('appels', THINGS.mand, -.62, -.42), bowl = card2('noten', THINGS.schaal, -.78, .22);
  card2('picknickappel0', THINGS.appel, .5, -.38); card2('picknickpeer', THINGS.peer, .7, -.3);
  const [wx, wz] = S.at([x, z]); let mode = null, t = 0, sits = 0, cheered = false, eat = null, apples = 0, nuts = 0;
  const seats = [[wx - 1.25, wz - .15], [wx + 1.3, wz + .1]];
  const appleF = S.figure('picknickappel', THINGS.appel), nutF = S.figure('picknicknoot', THINGS.noot); appleF.g.visible = nutF.g.visible = false;
  const food = new Set(); for (const o of [basket, bowl]) o.g.traverse(m => { if (m.isMesh) food.add(m); });
  const crumbs = (c, n = 5) => { const h = S.head(); S.confetti(h.x + girl.face * .12, h.y - .25, h.z + .05, c, n, undefined, 1.3); };
  /* eating, while she sits: what she holds goes up to her mouth and gets smaller bite by bite */
  const stepEat = dt => {
    if (!eat) return; eat.t += dt; const F = eat.kind === 'appel' ? appleF : nutF, hd = S.hand(), h = S.head(), k = Math.min(1, eat.t / .35);
    F.g.visible = true; F.x = hd.x + girl.face * .1; F.z = hd.z + .06; F.floatY = F.y = hd.y + (h.y - .32 - hd.y) * k; F.face = girl.face;
    if (eat.kind === 'appel') { const bites = Math.floor((eat.t - .35) / .5); if (bites > eat.n && bites <= 3) { eat.n = bites; sfx.munch(); crumbs(['#f6efe2', '#d9574f', '#f1e2c0']); F.g.scale.setScalar(1 - bites * .26); } if (eat.t > 2.1) { done(F); apples++; } }
    else { if (eat.t > .5 && !eat.cracked) { eat.cracked = true; sfx.click(); F.setFrame(1); crumbs(['#8a5e3a', '#9a6a40'], 4); } if (eat.t > 1.1 && eat.n < 1) { eat.n = 1; sfx.munch(); F.g.scale.setScalar(.5); for (const q of guests) if (q.guest.there()) { q.f.hopV = 2.2; } } if (eat.t > 1.5) { done(F); nuts++; } }
  };
  const done = F => { F.g.visible = false; F.g.scale.setScalar(1); F.setFrame(0); eat = null; girl.hopV = 1.2; S.confetti(girl.x, girl.y + 1.1, girl.z, ['#f4a6c4', '#f8dde4'], 5, undefined, 1.6); };
  const toy = { rest: true, look: [wx, wz + .4], lets: o => food.has(o), step(dt, inp) {
    t += dt;
    if (mode === 'on') { const k = Math.min(1, t / .3); girl.x = wx - .1; girl.z = wz + .35 + (1 - k) * .6; girl.lift = .03 * k + Math.sin(k * Math.PI) * .25; girl.poseName = k > .5 ? 'sit' : null; girl.view = 'side'; girl.face = 1;
      if (k >= 1) { mode = 'sit'; t = 0; sits++; cheered = false; sfx.hop(); guests.forEach((q, i) => q.guest.invite(seats[i % seats.length])); } return; }
    if (mode === 'sit') { girl.lift = .03; girl.poseName = 'sit'; stepEat(dt);
      if (!cheered && guests.every(q => q.guest.there())) { cheered = true; sfx.chime(); S.confetti(wx, y + .9, wz, ['#f4a6c4', '#f8dde4', '#f2c65c'], 12, undefined, 2.2); }   // everybody is here
      if (inp.act || inp.x) { mode = 'off'; t = 0; guests.forEach(q => q.guest.leave()); if (eat) { (eat.kind === 'appel' ? appleF : nutF).g.visible = false; eat = null; } } return; }
    const k = Math.min(1, t / .28); girl.z = wz + .35 + k * .65; girl.lift = Math.sin(k * Math.PI) * .2; girl.poseName = null; if (k >= 1) { girl.lift = 0; mode = null; S.stopPlay(); }
  } };
  const sitDown = then => { if (S.playing()) return; S.walkThen(wx - .1, wz + .95, () => { if (S.playing()) return; mode = 'on'; t = 0; S.play(toy); if (then) setTimeout(then, 450); }, 1.1); };
  const take = kind => () => { if (mode === 'sit') { if (!eat) { eat = { kind, t: 0, n: 0 }; sfx.hop(); } } else if (!S.playing()) sitDown(take(kind)); };
  S.tap(g, () => sitDown());
  basket.onTap = take('appel'); bowl.onTap = take('noot');
  return { toy, state: () => ({ mode, sits, cheered, there: guests.map(q => q.guest.there()), eating: eat ? eat.kind : null, apples, nuts }) };
}
