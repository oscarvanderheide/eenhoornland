// node cdp.mjs tests/t-look.mjs — screenshots of the gates, tools and obstacles (tmp-shots/l-*.png)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  await t.go('http://127.0.0.1:8765/dev.html?go&debug'); await t.ev('localStorage.clear()'); await t.go('http://127.0.0.1:8765/dev.html?go&debug');
  const spots = JSON.parse(await t.ev('JSON.stringify(__w.M.toolSpots)'));
  const at = { 'bramble-n': [26.5, 8.5], 'bramble-s': [26.5, 17.5], 'boulder-bos': [48.5, 26.5], schaar: [spots.schaar[0] - 1.5, spots.schaar[1] + .5], hamer: [spots.hamer[0] - 1.5, spots.hamer[1] + .5] };
  for (const [name, [x, z]] of Object.entries(at)) { if (process.env.ONLY && !process.env.ONLY.split(',').includes(name)) continue; await t.ev(`__w.placeAt(${x},${z})`); await t.sleep(2200); await t.shot(`tmp-shots/l-${name}.png`); }
  await t.ev(`__w.placeAt(26.5,8.5)`); await t.ev(`document.querySelector('.qchip').click()`); await t.ev(`__w.Q._reset({stage:'baby'})`); await t.sleep(1500); await t.shot('tmp-shots/l-wish.png');
  await t.ev(`document.querySelector('#b-map').click()`); await t.sleep(900); await t.shot('tmp-shots/l-map.png');
}
