// node cdp.mjs tests/t-tools.mjs — jumping over a log, being stopped by brambles, finding the shears and the hammer,
// cutting and smashing the gates. Screenshots go to tmp-shots/t-*.png.
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const js = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const shot = n => t.shot(`tmp-shots/t-${n}.png`);
  /** wait until Anna stands still (headless WebGL is slow) */
  const arrive = async (max = 60) => { for (let i = 0; i < max; i++) { await t.sleep(500); if (!(await js('__w.info().path'))) break; } await t.sleep(700); return js('__w.info().pos'); };
  await t.go('http://127.0.0.1:8765/dev.html?go&debug'); await t.ev('localStorage.clear()'); await t.go('http://127.0.0.1:8765/dev.html?go&debug');
  const blk = (x, z) => js(`__w.M.block[__w.M.I(${x},${z})]`);
  const obs = await js('__w.M.obstacles'), spots = await js('__w.M.toolSpots');
  ok(obs.length > 20 && (await js('__w.tools.info().lying')).length === 2, 'obstacles stand, both tools lie somewhere');
  ok(!!(await t.ev(`!!document.querySelector('#b-jump')`)), 'jump button is there');

  // --- jump: the logs across the path south of the village
  ok(await blk(14, 23) === 2, 'log on the path');
  await t.ev('__w.placeAt(14.5,21.5)'); await t.sleep(1500); await shot('1-log');
  ok(await js('__w.walkTo(14,25)') === true, 'a path over the log exists');
  let hop = 0, fhop = 0; for (let i = 0; i < 80; i++) { await t.sleep(120); hop = Math.max(hop, await js('__w.kid.mesh.position.y')); fhop = Math.max(fhop, await js('__w.uni.mesh.position.y')); if (hop > .3 && i % 2 === 0 && !fs.existsSync('tmp-shots/t-2-jump.png')) await shot('2-jump'); if (!(await js('__w.info().path')) && i > 10) break; }
  let p = await arrive(); ok(p[1] > 24 && p[1] < 26, 'Anna landed behind the log ' + p); ok(hop > .3, 'she was in the air (' + hop.toFixed(2) + ')');
  await t.sleep(1500); const f = await js('[__w.uni.pos.x,__w.uni.pos.z]'); ok(await blk(Math.floor(f[0]), Math.floor(f[1])) === 0, 'the follower does not stand on the log ' + f.map(v => v.toFixed(1)));
  ok(await js('__w.walkTo(14,21)') === true, 'and back'); p = await arrive(); ok(p[1] < 22.6, 'back over the log ' + p); ok(fhop > .2 || (await js('__w.uni.pos.z')) < 23, 'the follower follows');
  await t.ev('__w.jump()'); await t.sleep(200); ok(await js('__w.kid.hop') > 0, 'jump button hops on the spot');

  // --- brambles without shears
  await t.ev('__w.placeAt(25.5,8.5)'); await t.sleep(800);
  ok(await js('__w.walkTo(33,8)') === true, 'walking towards the forest goes up to the brambles'); p = await arrive();
  ok(p[0] < 28 && p[0] > 26.4 && await blk(28, 8) === 3, 'stopped at the brambles ' + p); ok(await t.ev(`!!document.querySelector('.bubble canvas')`), 'bubble shows the missing tool'); await shot('3-brambles');
  ok((await js('__w.Q.neededTool()')) === null, 'no tool wish while searching for a village egg');

  // --- find the shears, cut the gate
  await t.ev(`__w.placeAt(${spots.schaar[0] + .5},${spots.schaar[1] + 1.4})`); await t.sleep(1500); await shot('4-shears-lying');
  await t.ev(`__w.placeAt(${spots.schaar[0] + .5},${spots.schaar[1] + .5})`); await t.sleep(1500);
  ok(await js(`__w.Q.hasTool('schaar')`) && (await js('__w.tools.info().lying')).length === 1 && await t.ev(`document.querySelectorAll('#tools .qchip').length`) === 1, 'shears found, shown in the tool row'); await shot('5-shears-found');
  await t.ev('__w.placeAt(25.5,8.5)'); await t.sleep(800); await t.ev('__w.walkTo(33,8)'); await arrive(); await t.sleep(800);
  ok(await blk(28, 8) === 0 && await blk(28, 7) === 0 && await blk(28, 16) === 3, 'this gate is cut (both tiles), the other one still stands'); await shot('6-gate-cut');
  ok(await js('__w.walkTo(33,8)') === true, 'now the way is free'); p = await arrive(); ok(p[0] > 32, 'Anna is in the forest ' + p);
  await t.go('http://127.0.0.1:8765/dev.html?go&debug'); ok(await blk(28, 8) === 0 && await js(`__w.Q.hasTool('schaar')`), 'still cut and owned after a reload');

  // --- a loose bramble gives a coin when tapped
  const loose = obs.findIndex(o => o.kind === 'bramble' && !o.gate), lo = obs[loose], coins = await js('__w.Q.quest.coins');
  await t.ev(`__w.placeAt(${lo.x + 1.5},${lo.z + 2.5})`); await t.sleep(1500);
  const [sx, sy] = await js(`__w.screen(${lo.x + .5},.4,${lo.z + .6})`); await shot('7-loose-bramble'); await t.click(sx, sy); await arrive();
  ok(await blk(lo.x, lo.z) === 0 && await js('__w.Q.quest.coins') === coins + 1, 'tapping a loose bramble cuts it and gives a coin');

  // --- hammer: boulders before the castle
  await t.ev('__w.placeAt(41.5,35.5)'); await t.sleep(1500); await shot('8-boulders'); await t.ev('__w.walkTo(54,35)'); p = await arrive();
  ok(p[0] < 42 && await blk(42, 35) === 3, 'stopped at the boulders ' + p);
  await t.ev(`__w.placeAt(${spots.hamer[0] + .5},${spots.hamer[1] + 1.4})`); await t.sleep(1500); await shot('9-hammer-lying');
  await t.ev(`__w.placeAt(${spots.hamer[0] + .5},${spots.hamer[1] + .5})`); await t.sleep(1500); ok(await js(`__w.Q.hasTool('hamer')`), 'hammer found');
  await t.ev('__w.placeAt(41.5,35.5)'); await t.sleep(800); await t.ev('__w.walkTo(54,35)'); await arrive(); await t.sleep(800);
  ok(await blk(42, 35) === 0 && await blk(42, 36) === 0, 'boulders smashed'); await t.ev('__w.walkTo(54,35)'); p = await arrive(); ok(p[0] > 53, 'Anna is at the castle ' + p); await shot('10-castle');

  // --- keyboard: walking into a log hops over it
  await t.ev('__w.placeAt(14.5,22.5)'); await t.sleep(800); await t.key('ArrowDown', 6000); p = await arrive(4);
  ok(p[1] > 24, 'arrow key down carried her over the log ' + p);
  ok(!t.logs.some(l => /EXC|Error/.test(l)), 'no page errors');
  console.log(fail ? 'FAILED ' + fail : 'TOOLS OK');
}
