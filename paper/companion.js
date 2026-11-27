// A companion of the island (Oscar: "the dog should not leave the starting area. we can have different companions in each
// area"). One animal on each island can become her friend: the dog in the village (dog.js, its own), the lamb on the
// meadow, the fawn in the forest, the crab on the beach, the little dragon at the castle. Once a friend it comes along
// wherever she goes on its island, a few steps behind her; it never leaves the island: when she goes over a bridge it
// waits where she left, looking after her, and comes along again when she is back.
//   befriend(S, c, o)   c: what the animal's maker gave ({ f, step, state }); it is changed in place
//     o.byTap      the first tap makes it a friend (later taps do its own trick); otherwise o.isFriend() says when
//     o.isFriend   () => true once it has become her friend its own way (the fawn comes when she waits quietly)
//     o.speed      how fast it goes; o.gap: how far behind her it keeps; o.hop: a hop at every step (the lamb bounds)
//     o.own        false: its own step no longer runs once it is a friend (its own step would walk it back home)
//     o.hello      a sound for becoming friends

export function befriend(S, c, o = {}) {
  const { girl, sfx } = S, f = c.f, own = { tap: f.onTap, step: c.step, state: c.state };
  const speed = o.speed ?? 2.8, gap = o.gap ?? 1.2;
  let friend = false, left = null, follows = 0;
  const hearts = () => S.confetti(f.x, (f.y || 0) + .7, f.z, ['#f4a6c4', '#f8dde4', '#e98f8f'], 10, undefined, 2.3);
  const make = () => { friend = true; f.hopV = 2.8; hearts(); (o.hello || (() => sfx.chime()))(); };
  if (o.byTap !== false) f.onTap = () => { if (!friend) { make(); return; } if (own.tap) own.tap(); };
  c.state = () => ({ ...own.state(), friend, follows });
  c.step = e => {
    if (!friend) { own.step(e); if (o.isFriend && o.isFriend()) { friend = true; hearts(); } return; }
    const here = S.land(girl.x, girl.z); if (here) left = [girl.x, girl.z];
    const [tx, tz] = here ? [girl.x - girl.face * gap, girl.z + .3] : left || [f.x, f.z];
    const far = here ? Math.hypot(girl.x - f.x, girl.z - f.z) > gap + .5 : Math.hypot(tx - f.x, tz - f.z) > .35;
    if (far && !S.playing()) {
      const dx = tx - f.x, dz = tz - f.z, d = Math.hypot(dx, dz) || 1, s = Math.min(d, speed * e.dt);
      if (!S.move(f, dx / d * s, dz / d * s)) { if (d > 6 && here) { f.x = girl.x - girl.face * gap; f.z = girl.z + .3; } }   // stuck far behind: it turns up at her side
      f.walking = true; if (Math.abs(dx) > .1) f.face = Math.sign(dx); follows++;
      if (o.hop && !(f.hop > 0)) f.hopV = o.hop;
      return;
    }
    f.walking = false; f.face = girl.x < f.x ? -1 : 1;
    if (o.own !== false) own.step(e);   // standing by her: its own little life (a leap, a dance)
  };
  return c;
}
