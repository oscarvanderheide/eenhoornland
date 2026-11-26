// The dog, and the ball that is hers to fetch. The dog waits where it lives until she comes: it never calls her.
//   close by     it gets up and looks at her
//   a tap        hello: a hop, two barks, and from then on it comes along with her (over the bridge, into the house)
//   she stops    it sits down beside her
//   a tap again  it rolls over on its back
//   the ball     a tap on the ball and she kicks it; it really rolls and bounces off things. The dog runs after it,
//                brings it back and drops it at her feet. Walking into the ball nudges it along
import { THREE, paper } from './kit.js';
import { ANIMALS } from './animals.js';

/** a ball that rolls: kicked by a tap (she walks up to it first) or nudged by walking into it */
export function ball(S, x, y, z, color = '#e98f8f') {
  const { girl, sfx } = S, R = .17, [wx, wz] = S.at([x, z]);
  const g = new THREE.Group(); g.userData.live = true; g.position.set(x, y + R, z); S.root.add(g);
  const m = new THREE.Mesh(new THREE.SphereGeometry(R, 16, 12), paper(color)); m.castShadow = true; g.add(m);
  { const band = new THREE.Mesh(new THREE.TorusGeometry(R * .99, .022, 6, 20), paper('#f6efe2')); band.rotation.x = Math.PI / 2; m.add(band); }
  const b = { x: wx, z: wz, vx: 0, vz: 0, lift: 0, vy: 0, held: null, kicks: 0 };
  const kick = (dx, dz, power = 5.2, up = 2.6) => { const l = Math.hypot(dx, dz) || 1; b.vx = dx / l * power; b.vz = dz / l * power; b.vy = up; b.held = null; b.kicks++; sfx.boing(); };
  S.tap(g, () => { if (b.held || S.playing()) return; const dx = b.x - girl.x, dz = b.z - girl.z, d = Math.hypot(dx, dz) || 1; S.walkThen(b.x - dx / d * .45, b.z - dz / d * .45, () => kick(b.x - girl.x, b.z - girl.z), .9); });
  b.kick = kick;
  b.step = dt => {
    if (b.held) { const f = b.held; b.x = f.x + f.face * .34; b.z = f.z + .02; b.lift = .22; b.vx = b.vz = b.vy = 0; }
    else {
      if (girl.walking && !S.playing() && Math.hypot(girl.x - b.x, girl.z - b.z) < .34 && Math.hypot(b.vx, b.vz) < 1) kick(b.x - girl.x, b.z - girl.z, 2.4, .8);   // walking into it nudges it
      const h = S.heightAt(b.x, b.z) ?? 0;
      // it rolls on, and bounces off whatever she could not walk through either (walls, the pond, the edge of the land)
      const nx = b.x + b.vx * dt, nz = b.z + b.vz * dt;
      if (S.free(nx, b.z, h, null)) b.x = nx; else b.vx *= -.55;
      if (S.free(b.x, nz, h, null)) b.z = nz; else b.vz *= -.55;
      const drag = Math.exp(-(b.lift > .01 ? .4 : 1.9) * dt); b.vx *= drag; b.vz *= drag; if (Math.hypot(b.vx, b.vz) < .12) b.vx = b.vz = 0;
      b.vy -= 9.8 * dt; b.lift += b.vy * dt; if (b.lift <= 0) { b.lift = 0; if (b.vy < -1.4) { b.vy *= -.45; sfx.thud(); } else b.vy = 0; }
    }
    const [lx, lz] = [b.x - S.at([0, 0])[0], b.z - S.at([0, 0])[1]], gy = (S.heightAt(b.x, b.z) ?? y);
    g.position.set(lx, gy + R + b.lift, lz); m.rotation.z -= b.vx * dt / R; m.rotation.x += b.vz * dt / R;
  };
  b.moving = () => !b.held && Math.hypot(b.vx, b.vz) > .4;
  return b;
}

export function dog(S, x, z, theBall = null) {
  const { girl, sfx } = S, f = S.figure('hond', ANIMALS.hond), [hx, hz] = S.at([x, z]);
  f.x = hx; f.z = hz; f.face = 1;
  let mode = 'wait', t = 0, still = 0, hellos = 0;
  const dist = (ax, az) => Math.hypot(f.x - ax, f.z - az);
  const bark = () => { sfx.bark(); setTimeout(() => sfx.bark(), 170); };
  const hearts = () => S.confetti(f.x, f.y + .7, f.z, ['#f4a6c4', '#f8dde4', '#e98f8f'], 9, undefined, 2.3);
  /** run towards a spot, round things where it can; true once it is there */
  const runTo = (tx, tz, dt, speed = 3.3, near = .25) => {
    const dx = tx - f.x, dz = tz - f.z, d = Math.hypot(dx, dz); if (d < near) { f.walking = false; return true; }
    const s = Math.min(speed, 1 + d * 2.2) * dt; f.walking = S.move(f, dx / d * s, dz / d * s); if (Math.abs(dx) > .15) f.face = Math.sign(dx);
    if (!f.walking && d > 5) { f.x = girl.x - girl.face * .8; f.z = girl.z + .25; }   // stuck far behind (a wall between): it turns up at her side
    return false;
  };
  f.onTap = () => {
    if (mode === 'fetch' || mode === 'bring') return;
    f.hopV = 3.2; hellos++; hearts();
    if (mode === 'wait') { bark(); mode = 'follow'; f.follows = true; t = 0; }
    else { mode = 'roll'; t = 0; sfx.yip(); }   // already her friend: belly up
  };
  /** which drawing: 0 stand, 1 and 2 trot, 3 sit with her tongue out, 4 on her back */
  f.act = tick => { f.setFrame(mode === 'roll' ? 4 : f.walking ? 1 + (Math.floor(tick / 2) % 2) : still > 1.4 ? 3 : 0); };
  const step = ({ dt }) => {
    t += dt;
    if (mode === 'wait') { f.walking = false; still = dist(girl.x, girl.z) < 3 ? 0 : 9; if (still === 0) f.face = girl.x < f.x ? -1 : 1; return; }   // sitting, until she is close: then up and looking at her
    if (mode === 'roll') { f.walking = false; if (t > 1.5) { mode = 'follow'; still = 0; } return; }
    if (theBall && mode === 'follow' && theBall.moving() && dist(theBall.x, theBall.z) < 14) { mode = 'fetch'; t = 0; sfx.yip(); }
    if (mode === 'fetch') {   // after the ball; picks it up once it has nearly stopped rolling
      if (runTo(theBall.x - f.face * .3, theBall.z, dt, 4.4, .45) && !theBall.moving()) { theBall.held = f; mode = 'bring'; t = 0; }
      if (t > 9) mode = 'follow'; return;
    }
    if (mode === 'bring') {   // back to her, and down at her feet
      if (runTo(girl.x + girl.face * .75, girl.z + .15, dt, 3.8, .3) || t > 9) { theBall.held = null; theBall.x = f.x + f.face * .4; theBall.z = f.z + .05; theBall.vy = 1.6; f.hopV = 2.6; bark(); mode = 'follow'; still = 0; }
      return;
    }
    // coming along: a few steps behind her, sitting down when she has stood still for a while
    const d = dist(girl.x, girl.z);
    if (d > 1.7 && !S.playing()) { runTo(girl.x - girl.face * 1.1, girl.z + .35, dt, 3.3, .5); still = 0; } else { f.walking = false; still += dt; if (d < 2.5) f.face = girl.x < f.x ? -1 : 1; }
  };
  return { f, step, state: () => ({ mode, hellos, still, frame: f.frame, at: [f.x, f.z] }) };
}
