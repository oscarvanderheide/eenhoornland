// Sound effects (WebAudio), gentle background music, and Dutch text-to-speech.
let AC = null, master = null, musicBus = null;
function ac() {
  if (!AC) {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = 1; master.connect(AC.destination);
      musicBus = AC.createGain(); musicBus.gain.value = 1; musicBus.connect(master);
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
  bonk() { [0, .22].forEach(t => { tone(120, t, .18, 'triangle', .22, 60); noise(t, .08, .12, 500); }); noise(.44, .3, .1, 300); },
  boing() { tone(180, 0, .35, 'triangle', .2, 560); },
  munch() { [0, .13, .26].forEach(t => { tone(160, t, .07, 'square', .05, 110); noise(t, .06, .08, 900); }); },
  purr() { tone(90, 0, .5, 'sawtooth', .035, 80); tone(660, .05, .4, 'sine', .1, 880); },
  tada() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .09, .7, 'triangle', .15)); },
  whoosh() { noise(0, .35, .12, 600); },
  splash() { noise(0, .4, .15, 1800); tone(500, 0, .2, 'sine', .08, 200); },
  brush() { noise(0, .12, .07, 3000); },
  bubble() { tone(500 + Math.random() * 500, 0, .12, 'sine', .08, 1200); },
  door() { tone(330, 0, .15, 'triangle', .1); tone(494, .1, .25, 'triangle', .1); },
  wrong() { tone(300, 0, .2, 'triangle', .1, 200); },
  lullaby() { [659, 587, 523, 587, 659, 659, 659].forEach((f, i) => tone(f, i * .42, .7, 'sine', .09)); },
};

/* ---------- background music: tiny step sequencer ---------- */
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const SONGS = {
  day: { tempo: .26, mel: [72, 0, 76, 79, 81, 0, 79, 76, 74, 0, 77, 81, 79, 0, 0, 0, 72, 0, 76, 79, 84, 0, 83, 79, 81, 79, 76, 74, 72, 0, 0, 0], bass: [48, 55, 53, 55, 48, 55, 53, 43] },
  night: { tempo: .4, mel: [76, 0, 74, 72, 0, 0, 67, 0, 69, 0, 72, 74, 72, 0, 0, 0, 76, 0, 79, 76, 74, 0, 72, 0, 74, 0, 72, 69, 67, 0, 0, 0], bass: [45, 52, 48, 43, 45, 52, 41, 43] },
};
let musicOn = true, mood = 'day', step = 0, nextT = 0, timer = null;
function schedule() {
  const a = ac(); if (!a || !musicOn) return;
  const song = SONGS[mood];
  while (nextT < a.currentTime + .3) {
    const m = song.mel[step % song.mel.length];
    const t0 = nextT - a.currentTime;
    if (m) { tone(mtof(m), t0, song.tempo * 1.6, 'triangle', .035, 0, musicBus); tone(mtof(m + 12), t0, song.tempo, 'sine', .01, 0, musicBus); }
    if (step % 4 === 0) { const b = song.bass[(step / 4) % song.bass.length]; tone(mtof(b), t0, song.tempo * 3.5, 'sine', .05, 0, musicBus); }
    step++; nextT += song.tempo;
  }
}
export function startMusic() {
  const a = ac(); if (!a || timer) return;
  nextT = a.currentTime + .2; timer = setInterval(schedule, 100);
}
export function setMusic(on) {
  musicOn = on; if (musicBus) musicBus.gain.value = on ? 1 : 0;
  if (on) { const a = ac(); if (a) nextT = Math.max(nextT, a.currentTime + .1); }
}
export function setMood(m) { if (SONGS[m]) { mood = m; step = 0; } }
export function duckMusic(on) { if (musicBus) musicBus.gain.value = musicOn ? (on ? .35 : 1) : 0; }

/* ---------- speech ---------- */
export let voiceOn = true;
let nlVoice = null, tok = 0;
const hasTTS = typeof window !== 'undefined' && 'speechSynthesis' in window;
function pickVoice() {
  const vs = speechSynthesis.getVoices().filter(v => /^nl/i.test(v.lang));
  nlVoice = vs.find(v => /nl[-_]NL/i.test(v.lang) && /(premium|enhanced|verbeterd|natural)/i.test(v.name)) || vs.find(v => /nl[-_]NL/i.test(v.lang)) || vs[0] || null;
}
if (hasTTS) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
export function setVoice(on) { voiceOn = on; if (!on) stopSpeech(); }
export function stopSpeech() { tok++; if (hasTTS) speechSynthesis.cancel(); }
/** speak Dutch text; onword(charIndex) for read-along highlighting; onend() when finished */
export function speak(text, onword, onend) {
  const my = ++tok;
  if (!voiceOn || !hasTTS) { if (onend) setTimeout(onend, 50); return; }
  speechSynthesis.cancel();
  setTimeout(() => {
    if (my !== tok) return;
    const u = new SpeechSynthesisUtterance(text); u.lang = 'nl-NL'; if (nlVoice) u.voice = nlVoice; u.rate = .92; u.pitch = 1.12;
    if (onword) u.onboundary = e => { if (my === tok && (!e.name || e.name === 'word')) onword(e.charIndex); };
    u.onend = () => { if (my === tok) { duckMusic(false); onend && onend(); } };
    duckMusic(true);
    speechSynthesis.speak(u);
  }, 60);
}
