// node cdp.mjs tests/t-areas.mjs — screenshots of every area (written to tmp-shots/)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  await t.go('http://127.0.0.1:8765/dev.html?go&debug');
  const spots = { bos: [48.5, 14.5], boomgaard: [40.5, 19.5], nook: [58.5, 6.5], wei: [16.5, 29.5], tuin: [12.5, 28.5], strand: [15.5, 39.5], pier: [30.5, 44.5], kasteel: [54.5, 36.5], poort: [45.5, 35.5] };
  for (const [name, [x, z]] of Object.entries(spots)) {
    if (process.env.ONLY && !process.env.ONLY.split(',').includes(name)) continue;
    await t.ev(`__w.placeAt(${x},${z})`); await t.sleep(2500);
    await t.shot(`tmp-shots/${name}.png`); console.log(name, JSON.stringify(await t.ev('__w.extras.info()')));
  }
}
