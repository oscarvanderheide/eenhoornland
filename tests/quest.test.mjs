// node tests/quest.test.mjs — plays the whole adventure several times without a browser.
import * as Q from '../js/quest.js';
import { state } from '../js/state.js';
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } };
const events = []; Q.on((t) => events.push(t));
Q._reset();
ok(Q.needsDream(), 'a new adventure starts with the dream'); Q.dreamShown(); ok(!Q.needsDream(), 'the dream is shown once');
const seen = new Set(), toolLog = [], seeds = new Set(), zones = new Set();
function step() {  // do the one thing the game asks for now, the way a child would
  const w = Q.wishes()[0]; ok(w, 'nothing to do in ' + Q.quest.stage); if (!w) return;
  ok(Q.wishText(w).length > 5, 'wish text'); ok(Q.goalText().length > 5, 'goal text');
  if (w.t === 'tool') { toolLog.push(Q.quest.cycle + ':' + Q.quest.stage + ':' + w.id); ok(Q.toolOut(w.id), w.id + ' lies in the world when asked for'); ok(Q.giveTool(w.id), 'giveTool ' + w.id); }
  else if (w.t === 'egg') { ok(!Q.hatch() && !Q.feed() && !Q.deliver(), 'nothing can be skipped'); ok(Q.foundEgg(), 'foundEgg'); }
  else if (w.t === 'star') { ok(!Q.feed() && !Q.deliver(), 'no feeding an egg'); ok(Q.hatch(), 'hatch'); ok(Q.hasUnicorn() && !Q.canRide(), 'a baby cannot be ridden yet'); }
  else if (w.t === 'fruit') { ok(Q.feed(), 'feed'); ok(Q.canRide(), 'fed: can ride'); }
  else if (w.t === 'wei') ok(Q.deliver(), 'deliver');
}
for (let cyc = 0; cyc < 12; cyc++) {
  ok(Q.quest.stage === 'zoek', 'cycle starts with zoek, got ' + Q.quest.stage); ok(!Q.bedtime(), 'no bedtime while searching');
  ok(Q.sleep().type === 'morning', 'sleeping while searching changes nothing'); ok(Q.quest.stage === 'zoek', 'still zoek');
  if (cyc === 0) { ok(Q.quest.zone === 'bos', 'the first egg lies in the forest'); ok(!Q.toolOut('schaar') && !Q.toolOut('hamer'), 'no tools lie around before the egg is found'); }
  const log = [Q.quest.kind + '@' + Q.quest.zone]; seen.add(Q.quest.kind); zones.add(Q.quest.zone); seeds.add(Q.mapSeed()); ok((Q.mapSeed() === 0) === (cyc === 0), 'only the first world has seed 0');
  Q.smash([3, 4], true); ok(Q.quest.broken.length === 2, 'smashed obstacles are remembered within a cycle, forgotten after');
  for (let n = 0; n < 12 && Q.quest.stage !== 'feest'; n++) { step(); log.push(Q.quest.stage); }
  ok(Q.bedtime() && Q.wishes().length === 0, 'bedtime after the unicorn came home');
  const r = Q.sleep(); ok(r.type === 'newegg', 'a new egg after the party'); ok(!Q.needsDream(), 'the bedroom showed the dream');
  const u = Q.quest.herd[Q.quest.herd.length - 1];
  console.log('cycle', cyc, log.join(' '), '|', u.name, u.body, u.mane);
  ok(Q.quest.herd.length === cyc + 1, 'herd grows'); ok(Q.quest.cycle === cyc + 1, 'cycle counter');
}
ok(new Set(Q.quest.herd.map(u => u.name)).size === 12, 'unique names');
console.log('tools asked for at', toolLog.join(' '));
ok(toolLog.length === 2 && toolLog[0] === '0:ei:schaar' && toolLog[1] === '0:baby:hamer', 'shears after the egg, hammer after hatching, both in the first cycle, never again');
ok(seeds.size === 12, 'every cycle has its own world'); ok(Q.neededTool() === null && Q.hasTool('hamer'), 'tools are kept'); ok(zones.size >= 4, 'later eggs hide on other islands');
// things to collect are only for fun
Q._reset({ stage: 'baby' }); const a = Q.activeSpawns('appel', 18); ok(a.length === 9, 'items lie around'); Q.collect('appel', a[0]); ok(Q.activeSpawns('appel', 18).length === 8, 'picked items are gone');
ok(Q.sleep().type === 'morning' && Q.quest.stage === 'baby' && Q.activeSpawns('appel', 18).length === 9, 'a night brings the items back and changes nothing else');
ok(Q.wishes()[0].t === 'tool' && Q.wishes()[0].id === 'hamer' && Q.toolOut('hamer') && Q.toolOut('schaar'), 'a baby without hammer is first sent to find it');
Q.collect('munt', 0); ok(Q.quest.coins === 1 && !Q.spendCoins(5) && Q.quest.coins === 1, 'coins');
ok(!Q.hasTool('rit'), 'no riding before the fruit'); Q.feed(); ok(Q.hasTool('rit'), 'riding after the fruit');
ok(['egg', 'hatch', 'fed', 'herd', 'bedtime', 'tool'].every(e => events.includes(e)), 'events fired');
console.log('kinds seen', [...seen].join(','), fail ? 'FAILED ' + fail : 'ALL OK'); process.exit(fail ? 1 : 0);
