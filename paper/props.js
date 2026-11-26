// Things that stand on more than one set, built from the kit. Each takes the set's toolbox S and where to stand.
import { THREE, lerp, paper, slab, card, edgeMat } from './kit.js';

// window panes glow when the lamp inside is on: one material, made once and kept
const paneMat = new THREE.MeshStandardMaterial({ color: '#3b3a45', emissive: '#ffbf6e', emissiveIntensity: 0, roughness: .6 });

/** her house: folded card, a door that opens, a lamp inside (it uses the set's second lamp). A tap opens or shuts the door
 *  and puts the light on or off. Gives back its size, toggle(), open (0 or 1) and step() for the set to call every frame. */
export function cottage(S, x, y, z) {
  const HOUSE = { x, z, w: 2.4, d: 1.8, h: 1.8 };
  const house = new THREE.Group(); house.position.set(x, y, z); S.root.add(house);
  const inLight = S.lamp(1, '#ffb866', 4, 1.4); inLight.position.set(x, y + 1.0, z);
  let door, doorOpen = 0, doorTarget = 0, lightOn = false;
  {
    const { w, d, h } = HOUSE, T = .07;
    const wallMat = paper('#e4a596', { side: THREE.DoubleSide }), roofMat = paper('#4f8f8c'), trimMat = paper('#f4ecdc');
    const win = (cx, cy, ww = .42, hh = .46) => [[cx - ww / 2, cy - hh / 2], [cx + ww / 2, cy - hh / 2], [cx + ww / 2, cy + hh / 2], [cx - ww / 2, cy + hh / 2]];
    const frame = (wall, cx, cy, ww = .42, hh = .46, z = T / 2 + .005) => {
      // a white card frame with a cross, and a dark pane behind it that glows when the lamp is on
      const outer = win(cx, cy, ww + .14, hh + .14), inner = win(cx, cy, ww, hh);
      const f = card(outer, .025, trimMat, trimMat, [inner.slice().reverse()]); f.position.z = z; wall.add(f);
      const bar1 = card(win(cx, cy, ww, .045), .02, trimMat); bar1.position.z = z; wall.add(bar1);
      const bar2 = card(win(cx, cy, .045, hh), .02, trimMat); bar2.position.z = z; wall.add(bar2);
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(ww, hh), paneMat); pane.position.set(cx, cy, -T / 2 - .01); wall.add(pane);
    };
    // front: a door and two windows; the gable is part of the same sheet
    const front = new THREE.Group(); front.position.z = d / 2; house.add(front);
    const frontPts = [[-w / 2, 0], [w / 2, 0], [w / 2, h], [0, h + .75], [-w / 2, h]];
    const doorHole = [[-.27, .02], [.27, .02], [.27, 1.25], [-.27, 1.25]];
    front.add(card(frontPts, T, wallMat, edgeMat, [doorHole.slice().reverse(), win(-.78, 1.05).reverse(), win(.78, 1.05).reverse()]));
    frame(front, -.78, 1.05); frame(front, .78, 1.05);
    const dGroup = new THREE.Group(); dGroup.position.set(-.27, 0, .02); dGroup.userData.live = true; front.add(dGroup);
    door = card([[0, .02], [.54, .02], [.54, 1.23], [0, 1.23]], .05, paper('#3f6f77'), edgeMat); dGroup.add(door);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), paper('#e2b04a')); knob.position.set(.45, .62, .04); dGroup.add(knob);
    door = dGroup;
    const back = card(frontPts, T, wallMat, edgeMat, [win(-.5, .95).reverse()]); back.position.z = -d / 2; house.add(back);
    const sidePts = [[-d / 2, 0], [d / 2, 0], [d / 2, h], [-d / 2, h]];
    for (const s of [-1, 1]) {
      const side = new THREE.Group(); side.position.x = s * w / 2; side.rotation.y = s * Math.PI / 2; house.add(side);
      side.add(card(sidePts, T, wallMat, edgeMat, [win(0, 1.05, .5, .46).reverse()])); frame(side, 0, 1.05, .5, .46);
    }
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(w - .1, d - .1), paper('#c9a77c')); floor.rotation.x = -Math.PI / 2; floor.position.y = .01; floor.receiveShadow = true; house.add(floor);
    // the roof: two sheets folded over the ridge, with an overhang
    const slope = Math.hypot(w / 2 + .18, .75 + .1);
    for (const s of [-1, 1]) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(slope, .07, d + .4), [edgeMat, edgeMat, roofMat, roofMat, edgeMat, edgeMat]);
      r.position.set(s * (w / 4 + .04), h + .75 / 2 + .02, 0); r.rotation.z = -s * Math.atan2(.75 + .1, w / 2 + .18); r.castShadow = r.receiveShadow = true; house.add(r);
      // scalloped tiles: strips of slightly darker card along the roof
      for (let i = 0; i < 3; i++) {
        const strip = new THREE.Mesh(new THREE.BoxGeometry(.03, .02, d + .38), paper('#437e7b'));
        strip.position.set(s * (w / 4 + .04) + s * (-.35 + i * .35) * Math.cos(Math.atan2(.85, w / 2 + .18)), h + .75 / 2 + .06 - (i - 1) * .35 * Math.sin(Math.atan2(.85, w / 2 + .18)), 0);
        strip.rotation.z = r.rotation.z; house.add(strip);
      }
    }
    const chim = new THREE.Mesh(new THREE.BoxGeometry(.3, .6, .3), [edgeMat, edgeMat, paper('#b9675a'), paper('#b9675a'), paper('#c9776a'), paper('#c9776a')]);
    chim.position.set(.6, h + .75, -.3); chim.castShadow = true; house.add(chim);
    // flower boxes under the front windows, with paper flowers
    for (const cx of [-.78, .78]) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(.6, .14, .14), [edgeMat, edgeMat, paper('#7a5a3e'), edgeMat, paper('#8d6a48'), edgeMat]);
      box.position.set(cx, .72, d / 2 + .1); box.castShadow = true; house.add(box);
      for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.CircleGeometry(.065, 10), paper(['#e98f8f', '#f2efe6', '#f2c65c', '#b9a3e0'][(i + (cx > 0 ? 2 : 0)) % 4])); f.position.set(cx - .22 + i * .15, .86 + (i % 2) * .04, d / 2 + .13); house.add(f); }
    }
    // curtains: two little triangles of patterned paper behind each front window
    const curtain = paper('#f3e3c8', { side: THREE.DoubleSide });
    for (const cx of [-.78, .78]) for (const sd of [-1, 1]) {
      const c = card([[0, 0], [sd * .2, 0], [0, -.42]], .01, curtain); c.position.set(cx - sd * .21, 1.27, d / 2 - T / 2 - .03); house.add(c);
    }
    // a little doorstep and a flower box
    const step = slab([[-.4, d / 2], [.4, d / 2], [.4, d / 2 + .28], [-.4, d / 2 + .28]], .08, .08, paper('#d9c6a2'), edgeMat); house.add(step);
  }
  const toggle = () => { doorTarget = doorTarget ? 0 : 1; lightOn = !!doorTarget; S.sfx.door(doorTarget); };
  S.tap(house, toggle);
  S.wall(x, z, HOUSE.w / 2 + .15, HOUSE.d / 2 + .12);
  return { ...HOUSE, toggle, get open() { return doorTarget; },
    step({ dt, eve }) {
      doorOpen += (doorTarget - doorOpen) * Math.min(1, dt * 6); door.rotation.y = -doorOpen * 1.7;
      inLight.intensity = lerp(inLight.intensity, (lightOn ? 1 : 0) * lerp(1.6, 2.6, eve), Math.min(1, dt * 5));
      paneMat.emissiveIntensity = lerp(.08, .3, eve) + inLight.intensity / 2.2;
    } };
}
