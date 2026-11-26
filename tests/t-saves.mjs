// node cdp.mjs tests/t-saves.mjs — three saves: the button top right (no map button any more), a picture per save,
// tap one to play it, the old save is slot 1, a quick tap on the bin does nothing, holding it throws a save away (tmp-shots/s-*.png)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const J = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const until = async (expr, ms = 4000) => { for (let i = 0; i < ms / 100; i++) { if (await t.ev(expr)) return true; await t.sleep(100); } return false; };
  const URL = 'http://127.0.0.1:8765/dev.html?go&debug';
  const mid = sel => J(`(r => [r.x + r.width / 2, r.y + r.height / 2])(document.querySelector('${sel}').getBoundingClientRect())`);
  const mouse = (type, [x, y]) => t.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1, pointerType: 'mouse' });
  // a save made before there were slots is the first save
  await t.go(URL); await t.ev('localStorage.clear()'); await t.go(URL); await t.sleep(1500);
  await t.ev(`__w.Q._reset({ stage: 'baby' }); 0`); await t.sleep(300);
  ok(await t.ev(`!!localStorage.getItem('eenhoornland-v1')`), 'the first save keeps the old key');
  ok(await t.ev(`!document.getElementById('b-map') && !!document.getElementById('b-save').offsetParent`), 'top right: the saves button, no map button');
  await t.click(...await mid('#b-save')); ok(await until(`document.querySelectorAll('#modal .save').length === 3`), 'three saves');
  ok(await t.ev(`document.querySelector('#modal .save[data-slot="1"]').classList.contains('cur')`), 'the one being played stands out');
  ok(await t.ev(`document.querySelectorAll('#modal .save-bin:not(.gone)').length === 1`), 'only a save with something in it has a bin');
  await t.shot('tmp-shots/s-1-saves.png');
  // tap the second: the page starts again in an empty save
  await t.click(...await mid('#modal .save[data-slot="2"]')); await t.sleep(2500); await t.go(URL.replace('?', '?x&')); await t.sleep(1000);
  ok(await t.ev(`localStorage.getItem('eenhoornland-slot')`) === '2', 'save 2 is played now');
  ok(await t.ev(`__w.Q.quest.stage`) === 'zoek', 'and it is a new game: ' + await t.ev(`__w.Q.quest.stage`));
  await t.ev(`__w.Q._reset({ stage: 'vriend' }); 0`); await t.sleep(300);
  // back to the first: it is where she left it
  await t.click(...await mid('#b-save')); await until(`document.querySelectorAll('#modal .save').length === 3`);
  await t.shot('tmp-shots/s-2-two-saves.png');
  await t.click(...await mid('#modal .save[data-slot="1"]')); await t.sleep(2500); await t.go(URL.replace('?', '?y&')); await t.sleep(1000);
  ok(await t.ev(`localStorage.getItem('eenhoornland-slot')`) === '1' && await t.ev(`__w.Q.quest.stage`) === 'baby', 'save 1 is back where she left it');
  ok(await t.ev(`JSON.parse(localStorage.getItem('eenhoornland-v1-2')).extra.quest.stage`) === 'vriend', 'and save 2 kept its own game');
  // the bin: a tap does nothing, a hold throws save 2 away
  await t.click(...await mid('#b-save')); await until(`document.querySelectorAll('#modal .save').length === 3`);
  const bin = await mid('#modal .save-col:nth-child(2) .save-bin');
  await mouse('mousePressed', bin); await t.sleep(300); await mouse('mouseReleased', bin); await t.sleep(1500);
  ok(await t.ev(`!!localStorage.getItem('eenhoornland-v1-2')`), 'a quick tap on the bin does nothing');
  await mouse('mousePressed', bin); await t.sleep(600); await t.shot('tmp-shots/s-3-holding.png'); await t.sleep(1000); await mouse('mouseReleased', bin); await t.sleep(400);
  ok(await t.ev(`!localStorage.getItem('eenhoornland-v1-2')`), 'holding the bin throws save 2 away');
  ok(await t.ev(`!!localStorage.getItem('eenhoornland-v1') && __w.Q.quest.stage === 'baby'`), 'save 1 is untouched');
  ok(await t.ev(`document.querySelector('#modal .save-col:nth-child(2) .save-bin').classList.contains('gone')`), 'the empty save has no bin any more');
  await t.shot('tmp-shots/s-4-wiped.png');
  // throwing away the save being played starts it afresh
  const bin1 = await mid('#modal .save-col:nth-child(1) .save-bin');
  await mouse('mousePressed', bin1); await t.sleep(1700); await mouse('mouseReleased', bin1); await t.sleep(2500); await t.go(URL.replace('?', '?z&')); await t.sleep(1000);
  ok(await t.ev(`__w.Q.quest.stage`) === 'zoek', 'the save being played starts afresh');
  // the start screen has the button too
  await t.go(URL.replace('?go&', '?')); await t.sleep(1500);
  ok(await t.ev(`!document.getElementById('start-saves')`), 'no second saves button at the bottom of the start screen');
  ok(await t.ev(`(() => { const b = document.getElementById('b-save').getBoundingClientRect(), e = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); return !!e && !!e.closest('#b-save'); })()`), 'the saves button top right is on top of the start screen');
  await t.click(...await mid('#b-save')); ok(await until(`!document.getElementById('modal').hidden`), 'it opens the saves over the start screen');
  await t.shot('tmp-shots/s-5-start.png');
  console.log(fail ? `${fail} FAILED` : 'ALL OK'); for (const l of t.logs.filter(l => /error|fail/i.test(l)).slice(0, 8)) console.log('  log', l);
}
