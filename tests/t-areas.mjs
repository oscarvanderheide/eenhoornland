// node cdp.mjs tests/t-areas.mjs — screenshots of every island and the bridges between them (written to tmp-shots/)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  await t.go('http://127.0.0.1:8765/dev.html?go&debug');
  await t.ev(`__w.Q._reset({ stage: 'vriend' }); __w.Q.giveTool('zwaard'); __w.Q.giveTool('hamer'); 0`); await t.sleep(600);
  const spots = { dorp: [31.5, 44.5], tuin: [24.5, 47.5], brug: [40.5, 29.5], bos: [31.5, 13.5], boomgaard: [44.5, 13.5], nook: [18.5, 16.5], atelier: [23.5, 12.5], wei: [64.5, 45.5], bakkerij: [70.5, 43.5], strand: [62.5, 67.5], pier: [43.5, 70.5], kermis: [80.5, 74.5], eiland: [19.5, 70.5], kasteel: [84.5, 13.5], eenhoornwei: [79.5, 19.5], bakkerij: [95.5, 16.5] };
  for (const [name, [x, z]] of Object.entries(spots)) {
    if (process.env.ONLY && !process.env.ONLY.split(',').includes(name)) continue;
    await t.ev(`__w.placeAt(${x},${z})`); await t.sleep(2500);
    await t.shot(`tmp-shots/${name}.png`); console.log(name, JSON.stringify(await t.ev('__w.extras.info()')));
  }
}
