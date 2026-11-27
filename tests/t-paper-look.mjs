// The look of the paper island, kept: six still screenshots (day and evening; desktop, phone lying down as Oscar holds it,
// phone upright) with the stop-motion clock standing, to compare before and after a change that must not alter the picture.
//   PRE=ref node cdp.mjs tests/t-paper-look.mjs     before the change  -> tmp-shots/ref-*.png
//   node cdp.mjs tests/t-paper-look.mjs             after it           -> tmp-shots/now-*.png, compared with ref-*
// A pixel counts as changed when a colour channel moved by more than 24 of 255 (the film grain moves it by about 9).
// Passes under MAX percent of the picture (default 0.02: two untouched runs differ in 0.001, a lost duck in far more).
export default async function (t) {
  const port = process.env.SERVE || 8765, fs = await import('node:fs'); fs.mkdirSync('tmp-shots', { recursive: true });
  const pre = process.env.PRE || 'now', q = process.env.Q || '?set=eiland', max = +(process.env.MAX || .02);
  const ok = (c, m) => console.log((c ? 'ok   ' : 'FAIL ') + m);
  for (const [name, m] of [['desk', { width: 1200, height: 750, deviceScaleFactor: 1, mobile: false }], ['land', { width: 750, height: 313, deviceScaleFactor: 2, mobile: true }], ['phone', { width: 393, height: 852, deviceScaleFactor: 2, mobile: true }]]) {
    await t.send('Emulation.setDeviceMetricsOverride', m);
    await t.go(`http://127.0.0.1:${port}/paper/${q}`);
    for (let i = 0; i < 20 && !(await t.ev('!!window.__p')); i++) await t.sleep(500);
    await t.ev('__p.still(true); __p.placeAt(.2, 1.9)'); await t.sleep(3500); await t.shot(`tmp-shots/${pre}-${name}-day.png`);
    await t.ev('__p.evening(true)'); await t.sleep(2500); await t.shot(`tmp-shots/${pre}-${name}-eve.png`);
    if (pre !== 'ref') for (const part of ['day', 'eve']) {
      const d = await t.ev(`(async () => {
        const load = u => new Promise((res, rej) => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const g = c.getContext('2d'); g.drawImage(i, 0, 0); res(g.getImageData(0, 0, c.width, c.height)); }; i.onerror = () => rej(new Error('no ' + u)); i.src = u + '?' + Date.now(); });
        try { const a = await load('/tmp-shots/ref-${name}-${part}.png'), b = await load('/tmp-shots/${pre}-${name}-${part}.png');
          if (a.width !== b.width || a.height !== b.height) return 'sizes differ';
          let n = 0, sum = 0; for (let i = 0; i < a.data.length; i += 4) { const d = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2])); sum += d; if (d > 24) n++; }
          return [n / (a.data.length / 4) * 100, sum / (a.data.length / 4)]; } catch (e) { return String(e.message || e); }
      })()`);
      ok(Array.isArray(d) && d[0] < max, `${name} ${part}: ` + (Array.isArray(d) ? `${d[0].toFixed(3)}% of the picture changed (mean step ${d[1].toFixed(2)} of 255)` : d));
    }
  }
}
