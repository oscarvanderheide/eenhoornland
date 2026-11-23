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
  if (cyc === 0) { ok(Q.quest.zone === 'bos', 'the first egg lies in the forest'); ok(Q.toolOut('zwaard') && Q.toolOut('hamer') && !Q.neededTool(), 'the sword and the hammer wait from the start, but nobody asks for them before the egg is found'); }
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
ok(toolLog.length === 2 && toolLog[0] === '0:ei:zwaard' && toolLog[1] === '0:baby:hamer', 'shears after the egg, hammer after hatching, both in the first cycle, never again');
ok(seeds.size === 12, 'every cycle has its own world'); ok(Q.neededTool() === null && Q.hasTool('hamer'), 'tools are kept'); ok(zones.size >= 4, 'later eggs hide on other islands');
// things to collect are only for fun
Q._reset({ stage: 'baby' }); const N = Q.DAILY.schelp, a = Q.activeSpawns('schelp', 26); ok(a.length === N, 'items lie around'); Q.collect('schelp', a[0]); ok(Q.activeSpawns('schelp', 26).length === N - 1, 'picked items are gone');
ok(Q.sleep().type === 'morning' && Q.quest.stage === 'baby' && Q.activeSpawns('schelp', 26).length === N, 'a night brings the items back and changes nothing else');
ok(Q.activeSpawns('appel', 18).length === 0, 'apples do not lie around: they fall out of the trees');
// what is found can be traded at the stall, and each sister wears her own things
ok(Q.have('schelp') === 1 && !Q.canBuy('ketting') && !Q.buy('ketting', 'anna'), 'one shell does not make a necklace');
for (let k = 1; k < 4; k++) Q.collect('schelp', a[k]); ok(Q.canBuy('ketting') && Q.buy('ketting', 'anna'), 'four shells do'); ok(Q.have('schelp') === 0 && Q.owns('ketting') && !Q.buy('ketting', 'anna'), 'paid, owned, and not sold twice');
ok(Q.wearing('anna').neck === 'ketting' && !Q.wearing('fenna').neck, 'the girl who bought it has it on'); ok(Q.wear('ketting', 'fenna') && Q.wearing('fenna').neck === 'ketting', 'her sister can put it on too');
ok(Q.wear('ketting', 'anna') && !Q.wearing('anna').neck, 'and take it off again'); ok(!Q.wear('kroon', 'anna'), 'nothing is worn that is not owned');
for (const it of Q.SHOP) for (const t of Object.keys(it.cost)) ok(t === 'munt' || t in Q.ITEMS, it.id + ' costs something that exists');
// the flower pots and the sand castles stay the way they were left
ok(Q.plant(0) === 0 && !Q.pluck(0), 'a seed cannot be picked'); for (let k = 0; k < Q.PLANT_MAX; k++) ok(Q.water(0), 'watering grows it'); ok(!Q.water(0) && Q.plant(0) === Q.PLANT_MAX, 'in bloom');
ok(Q.pluck(0) && Q.plant(0) === 0 && Q.have('bloem') === 1, 'a picked flower goes into the bag and the pot starts again');
ok(Q.buildSand(60, 72) === 1 && Q.buildSand(60, 72) === 2 && Q.buildSand(60, 72) === 3 && Q.buildSand(60, 72) === 0, 'a sand tower grows three high'); for (let k = 0; k < 12; k++) Q.buildSand(40 + k, 70); ok(Q.quest.sand.length === Q.SAND_MOST, 'the oldest towers make room');
ok(Q.stompSand(51, 70) && !Q.stompSand(51, 70), 'jumping on a tower flattens it'); Q.earn(2);
ok(Q.wishes()[0].t === 'tool' && Q.wishes()[0].id === 'hamer' && Q.toolOut('hamer') && Q.toolOut('zwaard'), 'a baby without hammer is first sent to find it');
Q.collect('munt', 0); ok(Q.quest.coins === 3 && !Q.spendCoins(5) && Q.quest.coins === 3, 'coins'); ok(Q.buy('ballon', 'fenna') && Q.quest.coins === 1 && Q.wearing('fenna').hand === 'ballon', 'coins buy a balloon');
ok(!Q.hasTool('rit'), 'no riding before the fruit'); Q.feed(); ok(Q.hasTool('rit'), 'riding after the fruit');
ok(['egg', 'hatch', 'fed', 'herd', 'bedtime', 'tool'].every(e => events.includes(e)), 'events fired');
console.log('kinds seen', [...seen].join(','), fail ? 'FAILED ' + fail : 'ALL OK'); process.exit(fail ? 1 : 0);
