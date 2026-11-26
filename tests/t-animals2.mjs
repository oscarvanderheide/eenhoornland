// The sheet of the second batch of cut-paper animals (paper/animals2.html): PORT=9777 SERVE=8766 node cdp.mjs tests/t-animals2.mjs
// -> tmp-shots/b-animals2.png (the whole sheet), b-animals2-<name>.png (one row, twice as big), b-animals2-phone.png (the phone strip, four times as big),
//    b-animals2-small.png (every frame at phone size, three times as big), b-animals2-dolfijn-leap.png (the dolphin's three frames along one leap)
// It draws, every frame has a name and is its own drawing, and nothing is cut off by the edge of a card. ONLY=schaap,lam clips just those rows.
export default async function (t) {
  const fs = await import('node:fs'); fs.mkdirSync('tmp-shots', { recursive: true });
  await t.send('Emulation.setDeviceMetricsOverride', { width: 1500, height: 2000, deviceScaleFactor: 1, mobile: false });
  await t.go(`http://127.0.0.1:${process.env.SERVE || 8765}/paper/animals2.html`);
  for (let i = 0; i < 60 && !(await t.ev('!!window.__ready')); i++) await t.sleep(300);
  const ok = (c, m) => console.log((c ? 'ok   ' : 'FAIL ') + m);
  ok(await t.ev('!!window.__ready'), 'the sheet draws');
  const bad = await t.ev('window.__bad') || ['no checks ran'];
  ok(!bad.length, bad.length ? bad.slice(0, 12).join('; ') : 'nothing is cut off, every frame is its own drawing, every frame has a name');
  console.log('     empty units between card and canvas edge, left top right bottom (the card itself is 5): ' + JSON.stringify(await t.ev('window.__room')));
  console.log('     the same for every frame, bottom only (frames that stand on the ground should agree): ' + JSON.stringify(await t.ev('Object.fromEntries(Object.entries(window.__each || {}).map(([k, v]) => [k, v.map(r => r[3])]))')));
  // the whole sheet in one picture
  const h = await t.ev('document.documentElement.scrollHeight');
  await t.send('Emulation.setDeviceMetricsOverride', { width: 1500, height: Math.max(2000, h), deviceScaleFactor: 1, mobile: false });
  await t.sleep(300); await t.shot('tmp-shots/b-animals2.png');
  // one row at a time and the phone strip, enlarged, to judge the drawings (ONLY=schaap,lam for a few)
  const clip = async (sel, file, scale) => {
    const r = await t.ev(`(() => { const e = document.querySelector('${sel}'); if (!e) return null; const b = e.getBoundingClientRect(), w = Math.max(...[...e.children].map(c => c.getBoundingClientRect().right)) + 24; return [b.left, b.top + scrollY, w - b.left, b.height]; })()`);
    if (!r) return;
    const s = await t.send('Page.captureScreenshot', { format: 'png', clip: { x: r[0], y: r[1], width: Math.min(r[2], 1500), height: r[3] + 8, scale } });
    fs.writeFileSync(file, Buffer.from(s.result.data, 'base64'));
  };
  const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
  for (const k of await t.ev('[...document.querySelectorAll("#sheet .row")].map(e => e.id.slice(4))')) if (!only || only.includes(k)) await clip('#row-' + k, `tmp-shots/b-animals2-${k}.png`, 2);
  await clip('#phone', 'tmp-shots/b-animals2-phone.png', 4);
  // the dolphin's three frames shown in turn along one leap (the point she turns about, (128, 112) of 240, on the arc): do they read as one jump?
  await t.ev(`(() => { const cs = [...document.querySelectorAll('#row-dolfijn .fr canvas')], d = document.createElement('div'); d.id = 'leap'; d.className = 'row'; d.style.cssText = 'position:relative;height:330px;width:640px;padding:0';
    [[110, 205], [320, 105], [530, 205]].forEach(([x, y], i) => { const c = document.createElement('canvas'), s = parseFloat(cs[i].style.height); c.width = cs[i].width; c.height = cs[i].height; c.getContext('2d').drawImage(cs[i], 0, 0); c.style.cssText = 'position:absolute;width:' + s + 'px;height:' + s + 'px;left:' + (x - s * 128 / 240) + 'px;top:' + (y - s * 112 / 240) + 'px'; d.append(c); });
    document.body.append(d); })()`);
  await t.send('Emulation.setDeviceMetricsOverride', { width: 1500, height: await t.ev('document.documentElement.scrollHeight'), deviceScaleFactor: 1, mobile: false });
  await t.sleep(300); await clip('#leap', 'tmp-shots/b-animals2-dolfijn-leap.png', 2);
  // every frame at phone size (a third of the sheet's), enlarged: does each pose still read as its own?
  await t.ev('document.querySelectorAll("#sheet canvas").forEach(c => { c.style.width = parseFloat(c.style.width) / 3 + "px"; c.style.height = parseFloat(c.style.height) / 3 + "px"; })');
  await t.sleep(200); await clip('#dieren', 'tmp-shots/b-animals2-small.png', 3);
}
