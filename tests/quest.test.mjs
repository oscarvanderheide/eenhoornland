// node tests/quest.test.mjs — plays the whole loop several times without a browser.
import * as Q from '../js/quest.js';
import { state } from '../js/state.js';
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } };
const TOTAL = { bloem: 34, appel: 18, paddenstoel: 20, schelp: 22, wortel: 14, diamant: 10, munt: 44 };
const events = []; Q.on((t) => events.push(t));
Q._reset();
function grant() { // fulfil every wish the way a child would
  for (let guard = 0; guard < 50 && !Q.allDone(); guard++) {
    const w = Q.wishes().find(w => !Q.done(w) && (w.t !== 'wei' || Q.weiOpen())); ok(w, 'no grantable wish in ' + Q.quest.stage); if (!w) break;
    ok(Q.wishText(w).length > 5, 'wish text'); ok(Q.goalText().length > 5, 'goal text');
    if (w.t === 'egg') ok(Q.foundEgg(), 'foundEgg');
    else if (w.t === 'act') ok(Q.activityDone(w.id), 'activityDone ' + w.id);
    else if (w.t === 'wei') ok(Q.deliver(), 'deliver');
    else { const a = Q.activeSpawns(w.id, TOTAL[w.id]); ok(a.length >= w.need - w.have, `not enough ${w.id} lying around: ${a.length} for ${w.need - w.have}`); Q.collect(w.id, a[0]); }
  }
}
const seen = new Set();
for (let cyc = 0; cyc < 12; cyc++) {
  ok(Q.quest.stage === 'zoek', 'cycle starts with zoek, got ' + Q.quest.stage); ok(!Q.bedtime(), 'no bedtime while searching');
  ok(Q.sleep().type === 'morning', 'sleeping while searching changes nothing'); ok(Q.quest.stage === 'zoek', 'still zoek');
  const log = [Q.quest.kind]; seen.add(Q.quest.kind);
  for (let d = 0; d < 12 && !(Q.quest.stage === 'zoek' && d > 0); d++) {
    grant(); ok(Q.bedtime(), 'bedtime after wishes in ' + Q.quest.stage);
    if (Q.quest.stage === 'baby') { const before = Q.wishes().length; }
    const r = Q.sleep(); log.push(r.type + '>' + r.stage);
  }
  const u = Q.quest.herd[Q.quest.herd.length - 1];
  console.log('cycle', cyc, log.join(' '), '|', u.name, u.body, u.mane, u.mark || '-', u.wings ? 'wings' : '');
  ok(Q.quest.herd.length === cyc + 1, 'herd grows'); ok(Q.quest.cycle === cyc + 1, 'cycle counter');
}
ok(new Set(Q.quest.herd.map(u => u.name)).size === 12, 'unique names');
// sleeping with unfinished wishes keeps progress and stage
Q._reset({ stage: 'baby' }); const a = Q.activeSpawns('appel', 18); Q.collect('appel', a[0]); const r = Q.sleep();
ok(r.type === 'morning' && Q.quest.stage === 'baby' && Q.wishes()[0].have === 1, 'unfinished day keeps progress');
ok(Q.activeSpawns('appel', 18).length === 9, 'items respawn next day');
Q.collect('munt', 0); ok(Q.quest.coins === 1 && !Q.spendCoins(5) && Q.quest.coins === 1, 'coins');
ok(events.includes('bedtime') && events.includes('wish') && events.includes('herd'), 'events fired');
console.log('kinds seen', [...seen].join(','), fail ? 'FAILED ' + fail : 'ALL OK'); process.exit(fail ? 1 : 0);
