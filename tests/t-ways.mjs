// node cdp.mjs tests/t-ways.mjs — every animal's own way of saying hello, and the things at sea that answer a tap from
// the boat (tmp-shots/w-*.png). ONLY=dorp,bos,wei,strand,eiland,kasteel,zee to limit.
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const J = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const until = async (expr, ms = 30000) => { for (let i = 0; i < ms * 3 / 300; i++) { if (await t.ev(expr)) return true; await t.sleep(300); } return false; };
  const only = (process.env.ONLY || '').split(',').filter(Boolean), run = k => !only.length || only.includes(k);
  const URL = 'http://127.0.0.1:8765/dev.html?go&debug';
  await t.go(URL); await t.ev('localStorage.clear()'); await t.go(URL); await t.sleep(1500);
  await t.ev(`__w.Q._reset({ stage: 'vriend' }); __w.Q.giveTool('schaar'); __w.Q.giveTool('hamer'); 0`); await t.sleep(500);
  const shot = n => t.shot(`tmp-shots/w-${n}.png`);
  const A = name => `__w.animals.find(a => a.name === '${name}')`;
  const doing = (name, kind, ms = 10000) => until(`(${A(name)}.way || {}).kind === '${kind}'`, ms);
  /** put her next to the animal (on a free tile), with the animal standing still */
  async function meet(name, dx = 1.2) {
    await t.ev(`(a => { a.path = []; a.wait = 30; const t = __w.extras && __w.walkable(Math.floor(a.pos.x + ${dx}), Math.floor(a.pos.z)) ? [a.pos.x + ${dx}, a.pos.z] : (() => { for (const [x, z] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1]]) if (__w.walkable(Math.floor(a.pos.x) + x, Math.floor(a.pos.z) + z)) return [Math.floor(a.pos.x) + x + .5, Math.floor(a.pos.z) + z + .5]; })(); __w.placeAt(t[0], t[1]); __w.setMount(null, true); })(${A(name)}); 0`);
    await t.sleep(900);
  }
  const tap = name => t.ev(`__w.life.tapAnimal(${A(name)}); 0`);

  if (run('dorp')) {
    await meet('Hondje'); await tap('Hondje'); await t.sleep(400); ok(await doing('Hondje', 'rol'), 'the puppy rolls over'); await shot('4-dog'); ok(await until(`!${A('Hondje')}.way`, 6000), 'and wags');
    await t.ev(`(a => { a.hellos = 2; a.wayAt = 0; })(${A('Hondje')}); 0`); const c0 = await t.ev('__w.Q.quest.coins'); await tap('Hondje'); ok(await doing('Hondje', 'graaf'), 'every third hello the puppy digs'); await t.sleep(600); await shot('4b-dog-digs'); ok(await until(`__w.Q.quest.coins === ${'${c0 + 1}'}`, 6000), 'and digs up a coin (once a day)');
    await meet('Kip'); await tap('Kip'); ok(await until(`__w.ways.info().eggs === 1`, 6000), 'the hen leaves an egg'); await shot('5-hen');
    ok(await until(`__w.ways.info().chicks === 1`, 40000), 'a chick hatches'); await t.ev(`(a => { a.wait = 0; })(${A('Kip')})`); await t.sleep(4000); await shot('6-chick');
    await tap('Kip'); await t.ev(`__w.life.setDown && __w.life.setDown()`); await t.sleep(1500); ok((await J('__w.ways.info()')).eggs === 0, 'only one egg a day');
    await t.ev(`(a => { a.path = []; a.wait = 30; a.pos.set(__w.MAP.POND.cx + .7, 0, __w.MAP.POND.cz + .6); const t = __w.extras && [[2,1],[2,0],[1,2],[0,2],[2,2],[-2,1]].find(([x, z]) => __w.walkable(Math.floor(__w.MAP.POND.cx) + x, Math.floor(__w.MAP.POND.cz) + z)); __w.placeAt(Math.floor(__w.MAP.POND.cx) + t[0] + .5, Math.floor(__w.MAP.POND.cz) + t[1] + .5); })(${A('Eendje')}); 0`); await t.sleep(600);
    await tap('Eendje'); ok(await until(`(${A('Eendje')}.way || {}).kind === 'duik'`, 8000), 'a duck goes bottoms up'); await t.sleep(150); await shot('7-duck'); ok(await until(`!${A('Eendje')}.way`, 5000), 'and comes up again');
  }
  if (run('bos')) {
    await meet('Egel'); await tap('Egel'); await t.sleep(400); ok(await doing('Egel', 'bal'), 'the hedgehog rolls up'); await shot('9-hedgehog-ball');
    const x0 = await t.ev(`${A('Egel')}.pos.x`); await tap('Egel'); await t.sleep(1300); ok(Math.abs(await t.ev(`${A('Egel')}.pos.x`) - x0) > .5, 'a tap rolls the ball'); await shot('10-rolled');
    ok(await until(`!${A('Egel')}.way`, 12000), 'it uncurls after a while');
    ok((await J('__w.ways.info()')).owl === 'asleep', 'the owl sleeps in the daytime'); await meet('Uil'); await shot('11-owl-asleep'); await tap('Uil'); await t.sleep(600); ok(await doing('Uil', 'uil'), 'a tap: it opens its eyes'); await shot('12-owl-awake'); ok(await until(`!${A('Uil')}.way`, 6000) && (await J('__w.ways.info()')).owl === 'asleep', 'and dozes off again');
    await meet('Uil'); await tap('Uil'); await t.sleep(300); await tap('Uil'); await t.sleep(300); ok(!(await t.ev(`__w.life.carrying() === ${A('Uil')}`)), 'a tap while it is awake: stars, not lifted'); await shot('12b-owl-stars');
  }
  if (run('wei')) {
    await meet('Schaap'); for (let k = 0; k < 4; k++) { await tap('Schaap'); await t.sleep(350); }
    ok((await J('__w.ways.info()')).wool.some(w => w > 1.3), 'four taps: a very fluffy sheep'); await shot('13-fluffy');
    await tap('Schaap'); await t.sleep(600); ok((await J('__w.ways.info()')).wool.some(w => w < .85), 'the fifth: poof, the wool floats off'); await shot('14-shorn');
    // the deer: tapped from a little way off it comes to her
    await t.ev(`(a => { a.path = []; a.wait = 30; for (const [x, z] of [[4,0],[-4,0],[3,1],[-3,1],[3,-1],[0,3]]) if (__w.walkable(Math.floor(a.pos.x) + x, Math.floor(a.pos.z) + z)) { __w.placeAt(Math.floor(a.pos.x) + x + .5, Math.floor(a.pos.z) + z + .5); break; } })(${A('Hertje')}); 0`); await t.sleep(1000);
    const d0 = await t.ev(`Math.hypot(${A('Hertje')}.pos.x - __w.kid.pos.x, ${A('Hertje')}.pos.z - __w.kid.pos.z)`);
    await tap('Hertje'); ok(await doing('Hertje', 'hert'), 'the deer comes over'); ok(await until(`!${A('Hertje')}.way`, 14000), 'and nuzzles her');
    ok(await t.ev(`Math.hypot(${A('Hertje')}.pos.x - __w.kid.pos.x, ${A('Hertje')}.pos.z - __w.kid.pos.z)`) < Math.min(d0, 2.3), 'it stands next to her now (' + d0.toFixed(1) + ' → close)');
    await t.sleep(900); await shot('14b-deer-flowers');
  }
  if (run('strand')) {
    await meet('Krab'); await tap('Krab'); await t.sleep(900); ok(await doing('Krab', 'krab'), 'the crab dances'); await shot('15-crab-dance'); await t.sleep(1500); await shot('16-crab-sand');
    await until(`!!${A('Krab')}.own`, 8000); await tap('Krab'); ok(await until(`!${A('Krab')}.way`, 3000), 'a tap gets it out of the sand');
    await tap('Krab'); await t.sleep(500); await t.ev('__w.jump()'); ok(await until(`${A('Krab')}.hop > 0`, 1500), 'she jumps: the dancing crab jumps along'); await t.sleep(1500);
    await meet('Meeuw'); await tap('Meeuw'); ok(await doing('Meeuw', 'vis'), 'the gull flies off to fish'); await t.sleep(1300); await shot('17-gull-dives');
    ok(await until(`!${A('Meeuw')}.way`, 9000), 'and comes back'); ok(await t.ev(`__w.Q.gotToday('meeuwvis')`), 'with a fish for her'); await shot('18-gull-back');
  }
  if (run('eiland')) {
    await meet('Konijn'); await tap('Konijn'); ok(await doing('Konijn', 'hol'), 'the rabbit goes down its hole'); ok(await until(`!${A('Konijn')}.g.visible`, 5000), 'it is gone underground'); await shot('1-rabbit-gone'); await until(`!!(${A('Konijn')}.way || {}).peek`, 5000); await t.sleep(500); await t.sleep(900); await shot('2-rabbit-peeks'); ok(await until(`!${A('Konijn')}.way && ${A('Konijn')}.g.visible`, 6000), 'and comes up out of another hole');
    ok((await J('__w.ways.info()')).holes === 2, 'two holes');
    await until(`!${A('Konijn')}.way`, 6000);   // (taps are its game now: catch it peeking; a drag still lifts it)
    await t.sleep(400); await tap('Konijn'); await t.sleep(300); ok(await doing('Konijn', 'hol'), 'down again'); ok(await until(`!!(${A('Konijn')}.way || {}).peek`, 5000), 'it peeks out'); await tap('Konijn'); ok(await until(`(${A('Konijn')}.way || {}).found || !${A('Konijn')}.way`, 3000), 'tapped while peeking: found!'); await t.sleep(300); await shot('2b-rabbit-found'); await t.sleep(1500);
    await meet('Papegaai'); await tap('Papegaai'); ok(await until(`(${A('Papegaai')}.way || {}).on`, 5000), 'the parrot lands on her shoulder'); await t.ev(`__w.walkTo(Math.floor(__w.kid.pos.x) - 2, Math.floor(__w.kid.pos.z))`); await t.sleep(2500); await shot('19-parrot');
    ok(await t.ev(`Math.hypot(${A('Papegaai')}.pos.x - __w.kid.pos.x, ${A('Papegaai')}.pos.z - __w.kid.pos.z) < .6`), 'it rides along');
    await tap('Papegaai'); ok(await until(`!${A('Papegaai')}.way`, 5000), 'a tap and it flies home');
  }
  if (run('kasteel')) {
    await meet('Pauw'); await tap('Pauw'); await t.sleep(500); await tap('Pauw'); await t.sleep(300); ok(await t.ev(`${A('Pauw')}.mesh.material.color.getHexString() !== 'ffffff'`), 'every tap: a new colour'); await shot('21b-peacock-colour'); await until(`!${A('Pauw')}.way`, 8000);
    await meet('Pauw'); await shot('20-peacock-tail-down'); await tap('Pauw'); await t.sleep(700); ok(await doing('Pauw', 'staart'), 'the peacock fans out its tail'); await shot('21-peacock-fan'); ok(await until(`!${A('Pauw')}.way`, 8000), 'and folds it again');
    await meet('Draakje'); await tap('Draakje'); await t.sleep(900); ok(await doing('Draakje', 'rook'), 'the dragon blows a smoke ring'); await shot('22-smoke-ring');
    await tap('Draakje'); await t.sleep(300); await tap('Draakje'); await t.sleep(1000); await shot('22b-fireworks'); ok(await t.ev('__w.life.info().bits') > 8, 'the third time: a flame, and fireworks');
  }
  ok(await t.ev(`!__w.animals.some(a => a.g.visible === false && !a.way && !a.cart && a.name !== 'Kikker')`), 'every animal is visible again ' + await t.ev(`__w.animals.filter(a => a.g.visible === false && !a.way && !a.cart && a.name !== 'Kikker').map(a => a.name).join()`));
  if (run('zee')) {   // from the boat
    const P = async (x, z) => { await t.ev(`__w.placeAt(${x}, ${z})`); };
    await P(91.5, 70.5); await t.sleep(600); await P(95.5, 70.5); ok(await until(`__w.play.info().sailing`, 10000), 'into the boat'); await until(`!__w.play.info().moving`, 30000);
    await t.ev(`__w.play.steer(103.5, 64.5)`); ok(await until(`!__w.play.info().moving`, 60000), 'sailed to the seals'); await t.sleep(800); await shot('23-seals');
    const sp = await J(`__w.screen(102.4, .5, 61.3)`); await t.click(sp[0], sp[1]); await t.sleep(200);
    ok(await t.ev(`__w.sea.info().ballFlying || __w.sea.info().ball === 0`), 'a tap on a seal from the boat: the ball flies to it (the boat does not sail off)'); await t.sleep(400); await shot('24-ball'); ok(!(await t.ev('__w.play.info().moving')), 'the boat stays put');
    await until(`!__w.sea.info().ballFlying`, 3000);
    await t.ev(`__w.play.steer(108, 50.5)`); ok(await until(`!__w.play.info().moving`, 60000), 'sailed to the jellyfish'); await t.sleep(600);
    const n = (await J('__w.sea.info()')).jellies.length; ok(n >= 4, n + ' jellyfish');
    for (let i = 0; i < n; i++) { await t.ev(`__w.sea.tapJelly(${i})`); await t.sleep(250); } await shot('25-jellies'); ok((await J('__w.sea.info()')).jellies.every(v => v > 0), 'each one glows when it sings');
    await t.ev(`__w.sea.tapLamp()`); await t.sleep(900); await shot('26-lighthouse'); await t.sleep(900); await shot('26b-lighthouse');
    await t.ev(`__w.play.steer(121, 70)`); await until(`!__w.play.info().moving`, 60000); await t.ev(`__w.sea.tapTurtle()`); ok((await J('__w.sea.info()')).turtleWith, 'the turtle comes to swim along');
    await t.ev(`__w.play.steer(112, 67)`); await t.sleep(5000); ok(await t.ev(`(() => { const b = __w.play.info().boat; return Math.hypot(b[0] - __w.sea.info().turtle[0], b[1] - __w.sea.info().turtle[1]) < 4; })()`), 'and stays by the boat'); await shot('27-turtle');
    await t.ev(`__w.sea.tapBoat()`); await t.sleep(300); ok((await J('__w.sea.info()')).tossed > 0, 'the bear throws a fish'); await t.sleep(2200);
  }
  ok(!t.logs.some(l => /EXC|Error/.test(l)), 'no page errors ' + t.logs.filter(l => /EXC|Error/.test(l)).join('|'));
  console.log(fail ? 'FAILED ' + fail : 'WAYS OK');
}
