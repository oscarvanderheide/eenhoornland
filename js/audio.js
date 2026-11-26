// Sound effects (WebAudio), gentle background music, and Dutch text-to-speech.
let AC = null, master = null, musicBus = null;
const MUSIC = .8;   // the music stays in the background: what the child touches is what should be heard
function ac() {
  if (!AC) {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = 1; master.connect(AC.destination);
      musicBus = AC.createGain(); musicBus.gain.value = MUSIC; musicBus.connect(master);
    } catch (e) { AC = null; }
  }
  if (AC && AC.state === 'suspended') AC.resume();
  return AC;
}
export function unlock() { ac(); }

export function tone(f, t0, dur, type = 'sine', vol = .15, f2, bus) {
  const a = ac(); if (!a) return;
  const t = a.currentTime + t0, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(bus || master); o.start(t); o.stop(t + dur + .05);
}
function noise(t0, dur, vol = .1, freq = 1200) {
  const a = ac(); if (!a) return;
  const len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = a.createBufferSource(); s.buffer = buf; const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq;
  const g = a.createGain(); g.gain.value = vol; s.connect(f); f.connect(g); g.connect(master); s.start(a.currentTime + t0);
}

export const sfx = {
  chime(n = 0) { const f = [523, 587, 659, 784, 880, 1047, 1175, 1319][n % 8]; tone(f, 0, .6, 'triangle', .2); tone(f * 2, .02, .45, 'sine', .06); },
  sparkle() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * .06, .35, 'triangle', .11)); },
  pop() { tone(420, 0, .12, 'sine', .22, 900); },
  click() { tone(660, 0, .06, 'square', .05); },
  step() { tone(140, 0, .05, 'triangle', .04, 90); },
  snip() { [0, .14, .28].forEach(t => { noise(t, .05, .09, 5000); tone(1400, t, .04, 'square', .03, 900); }); },
  swish() { [0, .16].forEach(t => { noise(t, .12, .12, 2600); tone(900, t, .1, 'sine', .05, 1800); }); tone(1568, .34, .25, 'triangle', .06); },
  tug() { tone(200, 0, .25, 'triangle', .14, 150); noise(0, .2, .05, 700); },
  snore() { tone(95, 0, .7, 'sawtooth', .05, 70); noise(0, .7, .03, 300); tone(320, .8, .5, 'sine', .04, 520); },
  toot() { tone(392, 0, .28, 'square', .05); tone(392, .36, .4, 'square', .05); tone(196, 0, .7, 'triangle', .08); },
  bonk() { [0, .22].forEach(t => { tone(120, t, .18, 'triangle', .22, 60); noise(t, .08, .12, 500); }); noise(.44, .3, .1, 300); },
  boing() { tone(180, 0, .35, 'triangle', .2, 560); },
  burp() { tone(110, 0, .32, 'sawtooth', .1, 55); tone(80, .05, .3, 'square', .05, 45); noise(0, .28, .05, 260); },
  munch() { [0, .13, .26].forEach(t => { tone(160, t, .07, 'square', .05, 110); noise(t, .06, .08, 900); }); },
  purr() { tone(90, 0, .5, 'sawtooth', .035, 80); tone(660, .05, .4, 'sine', .1, 880); },
  tada() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .09, .7, 'triangle', .15)); },
  whoosh() { noise(0, .35, .12, 600); },
  splash() { noise(0, .4, .15, 1800); tone(500, 0, .2, 'sine', .08, 200); },
  brush() { noise(0, .12, .07, 3000); },
  bubble() { tone(500 + Math.random() * 500, 0, .12, 'sine', .08, 1200); },
  door() { tone(330, 0, .15, 'triangle', .1); tone(494, .1, .25, 'triangle', .1); },
  wrong() { tone(300, 0, .2, 'triangle', .1, 200); },
  bell() { [1568, 2093, 1568, 2093].forEach((f, i) => tone(f, i * .09, .22, 'triangle', .1)); },
  hoot() { tone(392, 0, .3, 'sine', .12, 370); tone(330, .38, .5, 'sine', .12, 300); },
  horn() { tone(110, 0, 1.1, 'sawtooth', .04); tone(165, 0, 1.1, 'triangle', .08); },
  squeak() { [0, .12, .24].forEach((t, i) => tone(1600 + i * 300, t, .09, 'sine', .07, 2400)); },
  // getting a tool: three quick notes up, a bright chord that rings, and a twinkle on top (our own little tune)
  fanfare() { [[392, 0], [523, .11], [659, .22]].forEach(([f, t]) => tone(f, t, .2, 'square', .05)); [784, 988, 1175].forEach(f => tone(f, .34, 1.3, 'triangle', .11)); tone(196, .34, 1.3, 'triangle', .1); [1568, 1976, 2349, 3136].forEach((f, i) => tone(f, .9 + i * .08, .5, 'sine', .05)); },
  lullaby() { [659, 587, 523, 587, 659, 659, 659].forEach((f, i) => tone(f, i * .42, .7, 'sine', .09)); },
};

/* ---------- background: a few soft notes now and then, never the same twice ---------- */
// There is no tune. A tune on a loop is heard a hundred times in an afternoon; this is closer to a wind chime: single
// notes from a five-note scale, wandering by small steps, with silences in between that are longer than the notes,
// over a low note that changes once in a long while. Nothing in it can get stuck in your head.
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const SONGS = {
  day: { scale: [60, 62, 64, 67, 69, 72, 74, 76, 79], roots: [48, 53, 45, 55], gap: [1.1, 3.4], len: 2.6, vol: .03 },
  night: { scale: [57, 60, 62, 64, 67, 69, 72, 74], roots: [45, 41, 48, 43], gap: [2, 5], len: 3.6, vol: .024 },
};
let musicOn = true, mood = 'day', step = 0, nextT = 0, timer = null, at = 4, rootT = 0, root = 0;
const rnd = (a, b) => a + Math.random() * (b - a);
function schedule() {
  const a = ac(); if (!a || !musicOn) return;
  const song = SONGS[mood];
  while (nextT < a.currentTime + .3) {
    const t0 = Math.max(0, nextT - a.currentTime);
    at = Math.max(0, Math.min(song.scale.length - 1, at + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)]));   // a small step up or down
    const m = song.scale[at];
    tone(mtof(m), t0, song.len, 'sine', song.vol, 0, musicBus);
    if (Math.random() < .3) tone(mtof(song.scale[Math.max(0, at - 2)]), t0 + rnd(.25, .6), song.len, 'sine', song.vol * .7, 0, musicBus);   // sometimes a second note answers
    if (nextT >= rootT) { root = (root + 1 + Math.floor(Math.random() * (song.roots.length - 1))) % song.roots.length; tone(mtof(song.roots[root]), t0, 9, 'sine', song.vol * .9, 0, musicBus); rootT = nextT + rnd(9, 16); }
    step++; nextT += rnd(song.gap[0], song.gap[1]) * (step % 7 === 0 ? 2.2 : 1);                                   // and now and then a long breath
  }
}
export function startMusic() {
  const a = ac(); if (!a || timer) return;
  nextT = a.currentTime + .2; timer = setInterval(schedule, 100);
}
export function setMusic(on) {
  musicOn = on; if (musicBus) musicBus.gain.value = on ? MUSIC : 0;
  if (on) { const a = ac(); if (a) nextT = Math.max(nextT, a.currentTime + .1); }
}
export function setMood(m) { if (SONGS[m] && m !== mood) { mood = m; step = 0; at = 3; rootT = 0; } }
export function duckMusic(on) { if (musicBus) musicBus.gain.value = musicOn ? (on ? .35 * MUSIC : MUSIC) : 0; }

/* ---------- speech ---------- */
// The voice is switched off: the speech that browsers have built in sounds too bad. All calls to speak() stay in place
// (they cost nothing) so a recorded or better voice can be plugged in here later.
export let voiceOn = false;
let nlVoice = null, tok = 0;
const hasTTS = typeof window !== 'undefined' && 'speechSynthesis' in window;
function pickVoice() {
  const vs = speechSynthesis.getVoices().filter(v => /^nl/i.test(v.lang));
  // the voices come from the device and differ a lot: take the most natural one it has (the plain built-in ones sound like a robot)
  const score = v => (/premium|natural|neural|siri/i.test(v.name) ? 40 : /enhanced|verbeterd/i.test(v.name) ? 30 : /^google/i.test(v.name) ? 25 : 0) + (/nl[-_]NL/i.test(v.lang) ? 5 : 0) + (/claire|ellen|google/i.test(v.name) ? 2 : 0);
  nlVoice = vs.sort((x, y) => score(y) - score(x))[0] || null;
}
if (hasTTS) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
export function setVoice(on) { voiceOn = false; if (!on) stopSpeech(); }
export function stopSpeech() { tok++; if (hasTTS) speechSynthesis.cancel(); }
/** speak Dutch text; onword(charIndex) for read-along highlighting; onend() when finished */
export function speak(text, onword, onend) {
  const my = ++tok;
  if (!voiceOn || !hasTTS) { if (onend) setTimeout(onend, 50); return; }
  speechSynthesis.cancel();
  setTimeout(() => {
    if (my !== tok) return;
    const u = new SpeechSynthesisUtterance(text); u.lang = 'nl-NL'; if (nlVoice) u.voice = nlVoice; u.rate = .95;   // no raised pitch: it makes the built-in voices sound even more artificial
    if (onword) u.onboundary = e => { if (my === tok && (!e.name || e.name === 'word')) onword(e.charIndex); };
    u.onend = () => { if (my === tok) { duckMusic(false); onend && onend(); } };
    duckMusic(true);
    speechSynthesis.speak(u);
  }, 60);
}
