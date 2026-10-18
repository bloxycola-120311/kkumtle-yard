'use strict';
// =========================================================
// 꿈틀이의 앞마당 (Wiggles' Front Yard) — HTML5 Canvas 게임
// 파일 순서대로 읽힘 (src/index.html 참고):
//   00-core    설정·도우미·소리·배경음악
//   10-land    땅(비옥도)·식물·지렁이·입력·영양분·효과
//   20-enemies 두더지·앵무새 버터·날씨
//   30-game    퀘스트·상장·HUD·게임 상태·매 프레임 계산
//   40-draw    마당 그리기
//   50-world   세계 구조 대작전 (지구본·비행)
//   60-burrow  두더지 굴 (지하 러너)
//   90-main    메인 루프·시작
// =========================================================


// ---------- 1. 기본 설정 ----------
const W = 2400, H = 1600;             // 앞마당 전체 크기(픽셀)
const CELL = 50, GW = W / CELL, GH = H / CELL;   // 흙 칸
const YARD = { x0: 70, y0: 200, x1: W - 70, y1: H - 70 }; // 지렁이가 다닐 수 있는 범위
const M_PX = 30;                      // 30픽셀 = 1m
const BASE_SPEED = 150;
const SEG_GAP = 10;
const MAX_LEN = 70;

const $ = id => document.getElementById(id);
const LANG = 'ko';                       // 영어판 빌드 때 'en'으로 바뀜
const L = (ko, en) => LANG === 'en' ? en : ko;
let houseSign = 'WELCOME', mode = 'yard'; // mode: yard / globe / flight / burrow
let lives = 3, MAX_LIVES = 3;      // 남은 꿈틀이(목숨). 0이 되면 게임 끝

const cv = $('game'), ctx = cv.getContext('2d');
let vw = 0, vh = 0, dpr = 1, zoom = 1;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  vw = window.innerWidth; vh = window.innerHeight;
  cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
  zoom = Math.max(0.7, Math.min(1.15, Math.min(vw, vh) / 560));
}
addEventListener('resize', resize); resize();

// ---------- 2. 작은 도우미 함수 ----------
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const dist = (a, b, c, d) => Math.hypot(a - c, b - d);
const lerp = (a, b, t) => a + (b - a) * t;
const angNorm = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
// 이모지 그리기: 글자색(fillStyle)이 반투명하면 이모지도 흐려지므로 항상 진한 색으로 + 살짝 그림자를 줘서 또렷하게
function emoji(e, x, y, s) {
  const fs = ctx.fillStyle; ctx.font = s + 'px ' + EMOJI_FONT; ctx.fillStyle = '#000';
  ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = Math.max(2, s * 0.08); ctx.shadowOffsetY = Math.max(1, s * 0.04);
  ctx.fillText(e, x, y);
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.fillStyle = fs;
}
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};

// ---------- 3. 소리 (Web Audio로 직접 합성 — 파일 필요 없음) ----------
let actx = null, muted = store.get('worm_muted', false);
function initAudio() {
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  if (actx && actx.state === 'suspended') actx.resume();
  if (actx && typeof musicSetup === 'function') musicSetup();
}
function tone(freq, dur, type = 'sine', vol = 0.12, slideTo = 0, delay = 0) {
  if (!actx || muted) return;
  const t0 = actx.currentTime + delay, o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0 + dur + 0.02);
}
function noise(dur, vol = 0.2) {
  if (!actx || muted) return;
  const len = Math.floor(actx.sampleRate * dur), b = actx.createBuffer(1, len, actx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = actx.createBufferSource(), g = actx.createGain(); s.buffer = b; g.gain.value = vol;
  s.connect(g).connect(actx.destination); s.start();
}
const SFX = {
  eat(c) { tone(520 + c * 60, 0.07, 'triangle', 0.1, 900 + c * 90); },
  item() { tone(660, 0.08, 'square', 0.05); tone(990, 0.12, 'square', 0.05, 0, 0.08); },
  quest() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.15, 'triangle', 0.1, 0, i * 0.09)); },
  warn() { tone(70, 0.9, 'sawtooth', 0.12, 40); noise(0.6, 0.07); },
  hurt() { tone(400, 0.35, 'square', 0.1, 90); },
  slap() { noise(0.2, 0.5); tone(260, 0.3, 'square', 0.12, 60); },
  sup() { [392, 523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.18, 'sawtooth', 0.06, 0, i * 0.07)); },
  speed() { tone(300, 0.3, 'sawtooth', 0.07, 1200); },
  dive() { tone(500, 0.4, 'sine', 0.12, 120); },
  award() { [523, 659, 784, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.12, 0, i * 0.13)); },
  lvl() { [440, 554, 659, 880].forEach((f, i) => tone(f, 0.14, 'square', 0.06, 0, i * 0.08)); },
  fruit() { tone(1200, 0.06, 'sine', 0.05, 1600); },
  chirp() { [1800, 2300, 1900, 2500].forEach((f, i) => tone(f, 0.07, 'sine', 0.07, f * 1.3, i * 0.09)); },
  happy() { [2000, 2600, 2200, 2900, 2400, 3100].forEach((f, i) => tone(f, 0.06, 'triangle', 0.08, f * 1.2, i * 0.07)); noise(0.05, 0.15); },
  sad() { tone(1600, 0.35, 'sine', 0.07, 900); }
};

// ---------- 3-2. 배경음악 (상황에 따라 바뀌는 '적응형' 음악) ----------
// Doors처럼 상황마다 곡이 바뀜: 로비 → 탐험(흙이 좋아질수록 악기가 하나씩 늘어남) → 위기(두더지 경고/버터 접근)
// → 추격(두더지) → 영웅(슈퍼 꿈틀이) / 땅굴·일시정지 중엔 벽장에 숨은 것처럼 소리가 먹먹해짐. 모든 곡은 코드로 직접 작곡·합성.
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const music = { on: store.get('worm_music', true), scene: null, pending: null, urgent: false, step: 0, bar: 0, nextTime: 0, bus: null, filter: null, timer: null, layers: 1, rain: false, done: false };
let noiseBuf = null;
function musicSetup() {
  if (!actx || music.bus) return;
  music.filter = actx.createBiquadFilter(); music.filter.type = 'lowpass'; music.filter.frequency.value = 16000; music.filter.Q.value = 0.7;
  music.bus = actx.createGain(); music.bus.gain.value = (music.on && !muted) ? 0.22 : 0;
  music.bus.connect(music.filter).connect(actx.destination);
  const len = actx.sampleRate; noiseBuf = actx.createBuffer(1, len, actx.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  music.nextTime = actx.currentTime + 0.1;
  music.timer = setInterval(musicTick, 25);
}
function musicVolume() { if (music.bus) music.bus.gain.setTargetAtTime((music.on && !muted) ? 0.22 : 0, actx.currentTime, 0.15); }
function musicMuffle(m) { if (music.muf === m) return; music.muf = m; if (music.filter) music.filter.frequency.setTargetAtTime(m ? 650 : 16000, actx.currentTime, 0.12); }
function setMusicScene(name, urgent) {
  if (name === music.scene || name === music.pending) return;
  if (!music.scene) { music.scene = name; music.step = 0; music.bar = 0; music.done = false; return; }
  music.pending = name; music.urgent = !!urgent;
}
// --- 악기들 ---
function env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
function osc(type, f, t, dur, out, detune = 0) { const o = actx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = detune; o.connect(out); o.start(t); o.stop(t + dur + 0.05); return o; }
function play(inst, m, t, dur, vol = 1) {
  const f = mtof(m), g = actx.createGain(); g.connect(music.bus);
  switch (inst) {
    case 'pluck': { env(g, t, 0.005, 0.22 * vol, dur * 0.9); const lp = actx.createBiquadFilter(); lp.frequency.value = 2400; lp.connect(g); osc('triangle', f, t, dur, lp); osc('square', f, t, dur * 0.4, lp).frequency.value = f; break; }
    case 'marimba': { env(g, t, 0.003, 0.3 * vol, Math.min(0.6, dur)); osc('sine', f, t, 0.7, g); const g2 = actx.createGain(); g2.connect(music.bus); env(g2, t, 0.002, 0.08 * vol, 0.08); osc('sine', f * 4, t, 0.1, g2); break; }
    case 'bell': { env(g, t, 0.004, 0.12 * vol, 1.4); osc('sine', f, t, 1.5, g); const g2 = actx.createGain(); g2.connect(music.bus); env(g2, t, 0.004, 0.05 * vol, 0.5); osc('sine', f * 2.76, t, 0.6, g2); break; }
    case 'bass': { env(g, t, 0.008, 0.42 * vol, dur * 0.95); const lp = actx.createBiquadFilter(); lp.frequency.value = 700; lp.connect(g); osc('triangle', f, t, dur, lp); osc('square', f, t, dur, lp).detune.value = 5; break; }
    case 'pad': { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05 * vol, t + 0.12); g.gain.linearRampToValueAtTime(0.0001, t + dur); const lp = actx.createBiquadFilter(); lp.frequency.value = 1400; lp.connect(g); osc('sawtooth', f, t, dur, lp, -8); osc('sawtooth', f, t, dur, lp, 8); break; }
    case 'rhodes': { env(g, t, 0.006, 0.13 * vol, dur * 1.2); osc('sine', f, t, dur * 1.3, g); const g2 = actx.createGain(); g2.connect(music.bus); env(g2, t, 0.004, 0.04 * vol, 0.25); osc('sine', f * 2, t, 0.3, g2); break; }
    case 'lead': { env(g, t, 0.01, 0.1 * vol, dur * 0.9); const lp = actx.createBiquadFilter(); lp.frequency.value = 3200; lp.connect(g); const o = osc('square', f, t, dur, lp); const lfo = actx.createOscillator(), lg = actx.createGain(); lfo.frequency.value = 6; lg.gain.value = f * 0.012; lfo.connect(lg).connect(o.frequency); lfo.start(t); lfo.stop(t + dur + 0.05); osc('square', f, t, dur, lp, 7); break; }
    case 'brass': { env(g, t, 0.03, 0.13 * vol, dur * 0.95); const lp = actx.createBiquadFilter(); lp.frequency.setValueAtTime(500, t); lp.frequency.exponentialRampToValueAtTime(2800, t + 0.08); lp.frequency.exponentialRampToValueAtTime(1200, t + dur); lp.connect(g); osc('sawtooth', f, t, dur, lp, -6); osc('sawtooth', f, t, dur, lp, 6); break; }
    case 'stab': { env(g, t, 0.004, 0.09 * vol, 0.12); const lp = actx.createBiquadFilter(); lp.frequency.value = 2600; lp.connect(g); osc('sawtooth', f, t, 0.15, lp, -5); osc('sawtooth', f, t, 0.15, lp, 5); break; }
    case 'chip': { env(g, t, 0.003, 0.09 * vol, dur * 0.85); osc('square', f, t, dur, g); break; }
    case 'pizz': { env(g, t, 0.002, 0.2 * vol, 0.12); osc('triangle', f, t, 0.15, g); break; }
  }
}
function drum(kind, t, vol = 1) {
  const g = actx.createGain(); g.connect(music.bus);
  if (kind === 'kick') { env(g, t, 0.002, 0.7 * vol, 0.28); const o = actx.createOscillator(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.15); o.connect(g); o.start(t); o.stop(t + 0.35); return; }
  const s = actx.createBufferSource(); s.buffer = noiseBuf; const f = actx.createBiquadFilter(); s.connect(f).connect(g);
  if (kind === 'snare') { f.type = 'bandpass'; f.frequency.value = 1800; env(g, t, 0.002, 0.35 * vol, 0.16); osc('triangle', 190, t, 0.1, g); }
  if (kind === 'hat') { f.type = 'highpass'; f.frequency.value = 7500; env(g, t, 0.001, 0.12 * vol, 0.04); }
  if (kind === 'ohat') { f.type = 'highpass'; f.frequency.value = 6500; env(g, t, 0.002, 0.1 * vol, 0.22); }
  if (kind === 'shaker') { f.type = 'bandpass'; f.frequency.value = 6000; env(g, t, 0.01, 0.06 * vol, 0.06); }
  if (kind === 'tick') { f.type = 'bandpass'; f.frequency.value = 3500; f.Q.value = 8; env(g, t, 0.001, 0.25 * vol, 0.03); }
  if (kind === 'crash') { f.type = 'highpass'; f.frequency.value = 4000; env(g, t, 0.003, 0.18 * vol, 1.4); }
  if (kind === 'riser') { f.type = 'bandpass'; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(8000, t + 0.5); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25 * vol, t + 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55); }
  s.start(t); s.stop(t + 1.6);
}
// 멜로디 표기: [몇 번째 16분음표, 음(MIDI), 길이(16분음표 개수)]
const SONGS = {
  // 로비: 엘리베이터에서 기다리는 느낌의 느긋한 라운지 (F장조)
  lobby: { bpm: 100, swing: 0.3, bars: 4,
    chords: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [53, 55, 59, 62]],
    walk: [[41, 45, 48, 47], [40, 43, 47, 45], [38, 41, 45, 44], [43, 47, 50, 42]],
    mel: [[[0, 72, 3], [4, 69, 2], [6, 72, 2], [8, 76, 6]], [[0, 74, 3], [4, 71, 2], [6, 74, 2], [8, 79, 6]],
          [[0, 77, 3], [4, 74, 2], [6, 72, 2], [8, 69, 6]], [[0, 71, 2], [2, 74, 2], [4, 77, 2], [6, 76, 2], [8, 74, 8]]],
    step(b, s, t, sd) {
      const B = b % 4;
      if (s % 4 === 0) play('bass', this.walk[B][s / 4], t, sd * 3.6);
      if (s === 0 || s === 6 || s === 11) this.chords[B].forEach(m => play('rhodes', m, t, sd * (s === 0 ? 5 : 3), 0.9));
      if (s % 2 === 0) drum('shaker', t, s % 4 === 0 ? 1 : 0.6);
      if (b % 8 >= 4) for (const [st, m, l] of this.mel[B]) if (st === s) play('marimba', m, t, sd * l, 0.9);
    } },
  // 탐험: 밝고 통통 튀는 기본 곡 (G장조, I–V–vi–IV). 흙이 좋아질수록 악기 층이 늘어남
  explore: { bpm: 116, swing: 0.12, bars: 8,
    chords: [[55, 59, 62], [57, 62, 66], [55, 59, 64], [55, 60, 64]], roots: [43, 38, 40, 36],
    melA: [[[0, 71, 2], [2, 74, 2], [4, 79, 4], [10, 76, 2], [12, 74, 4]], [[0, 69, 2], [2, 74, 2], [4, 78, 4], [10, 76, 2], [12, 74, 4]],
           [[0, 71, 2], [2, 76, 2], [4, 79, 3], [8, 83, 4], [12, 79, 2], [14, 76, 2]], [[0, 76, 4], [4, 74, 2], [6, 72, 2], [8, 74, 6], [14, 71, 2]]],
    melB: [[[0, 79, 2], [2, 78, 2], [4, 79, 2], [6, 83, 6], [12, 81, 4]], [[0, 78, 4], [4, 76, 2], [6, 74, 2], [8, 78, 4], [12, 81, 4]],
           [[0, 79, 2], [2, 76, 2], [4, 71, 4], [8, 74, 2], [10, 76, 2], [12, 79, 4]], [[0, 72, 2], [2, 74, 2], [4, 76, 4], [8, 74, 4], [12, 71, 4]]],
    counter: [83, 81, 79, 76],
    step(b, s, t, sd) {
      const B = b % 4, L = music.layers, ch = this.chords[B], r = this.roots[B];
      if (s === 0 || s === 8) play('bass', r, t, sd * 3); if (s === 6 || s === 14) play('bass', r + 12, t, sd * 1.5, 0.8);
      if (s % 4 === 2) ch.forEach(m => play('pluck', m + 12, t, sd * 1.5, 0.55));
      if (s % 2 === 0) drum('hat', t, s % 4 === 0 ? 0.5 : 0.9);
      const mel = (b % 8 < 4 ? this.melA : this.melB)[B];
      for (const [st, m, l] of mel) if (st === s) play('marimba', m, t, sd * l);
      if (L >= 2) { if (s === 0 || s === 8 || s === 10) drum('kick', t, 0.8); if (s === 4 || s === 12) drum('snare', t, 0.6); }
      if (L >= 3 && s === 0) play('bell', this.counter[B] + 12, t, sd * 14, 0.8);
      if (L >= 4 && s % 2 === 1) play('pluck', ch[(s >> 1) % 3] + 24, t, sd * 0.8, 0.25);
      if (L >= 5 && (s === 0 || s === 8)) ch.forEach(m => play('pad', m, t, sd * 8, 0.8));
      if (music.rain && s % 4 === 3 && Math.random() < 0.5) play('bell', 84 + [0, 2, 4, 7, 9][Math.floor(Math.random() * 5)], t, sd * 4, 0.5);
    } },
  // 위기: 두더지 경고·버터 접근. 몰래 다가오는 듯한 장난스러운 긴장감, 2마디마다 반음씩 올라감
  tension: { bpm: 116, swing: 0, bars: 8,
    step(b, s, t, sd) {
      const up = Math.floor(b / 2) % 4;
      if (s % 2 === 0) play('bass', 40 + up, t, sd * 1.4, 0.9);
      const pat = [76, 79, 76, 75, 76, 79, 81, 79];
      if (s % 2 === 0) play('pizz', pat[(s >> 1) % 8] + up, t, sd, 0.9);
      drum('tick', t, s % 4 === 0 ? 0.9 : 0.35);
      if (s === 0) drum('kick', t, 0.7);
      if (b % 2 === 1 && s === 8) drum('riser', t, 0.6);
    } },
  // 추격: 두더지에게 쫓길 때. 빠르고 신나게 달리는 록 (A장조, I–♭VII–IV–I)
  chase: { bpm: 160, swing: 0, bars: 4,
    chords: [[57, 61, 64], [55, 59, 62], [57, 62, 66], [57, 61, 64]], roots: [45, 43, 38, 45],
    mel: [[[0, 76, 2], [2, 76, 2], [4, 81, 4], [8, 80, 2], [10, 81, 2], [12, 83, 4]], [[0, 83, 2], [2, 81, 2], [4, 79, 4], [8, 76, 4], [12, 74, 4]],
          [[0, 74, 2], [2, 76, 2], [4, 78, 4], [8, 81, 4], [12, 78, 4]], [[0, 76, 4], [4, 81, 2], [6, 80, 2], [8, 81, 8]]],
    step(b, s, t, sd) {
      const B = b % 4;
      if (s % 2 === 0) play('bass', this.roots[B] + (s % 8 === 6 ? 12 : 0), t, sd * 1.6);
      if ([0, 3, 6, 8, 11, 14].includes(s)) this.chords[B].forEach(m => play('stab', m + 12, t, sd));
      if (s % 4 === 0) drum('kick', t); if (s === 4 || s === 12) drum('snare', t, 0.8);
      drum('hat', t, s % 2 ? 0.5 : 0.8); if (s % 4 === 2) drum('ohat', t, 0.6);
      if (b % 8 >= 2) for (const [st, m, l] of this.mel[B]) if (st === s) play('lead', m, t, sd * l);
      if (b % 4 === 0 && s === 0) drum('crash', t);
    } },
  // 영웅: 슈퍼 꿈틀이 변신! 금관 팡파르 행진곡 (C장조, I–♭VI–♭VII–I)
  super: { bpm: 136, swing: 0, bars: 4,
    chords: [[60, 64, 67], [56, 60, 63], [58, 62, 65], [60, 64, 67]], roots: [36, 44, 46, 48],
    mel: [[[0, 67, 2], [2, 72, 2], [4, 76, 6], [12, 74, 2], [14, 76, 2]], [[0, 75, 6], [6, 72, 2], [8, 68, 8]],
          [[0, 74, 3], [4, 77, 3], [8, 82, 6], [14, 81, 2]], [[0, 84, 12], [12, 79, 4]]],
    step(b, s, t, sd) {
      const B = b % 4;
      if (s === 0 || s === 8) play('bass', this.roots[B], t, sd * 6); if (s === 12) play('bass', this.roots[B] + 7, t, sd * 3);
      if (s === 0) this.chords[B].forEach(m => play('pad', m, t, sd * 16, 1.2));
      if (s === 0 || s === 8) drum('kick', t); if (s === 4 || s === 12) drum('snare', t, 0.9);
      if (s >= 12) drum('snare', t, 0.35); drum('hat', t, 0.35);
      for (const [st, m, l] of this.mel[B]) if (st === s) play('brass', m, t, sd * l);
      if (B === 0 && s === 0) drum('crash', t);
    } },
  // 지구본: 우주에서 지구를 내려다보는 신비롭고 따뜻한 느낌 (D장조, 84bpm)
  globe: { bpm: 84, swing: 0, bars: 4,
    chords: [[62, 66, 69, 73], [59, 62, 66, 69], [55, 59, 62, 66], [57, 62, 64, 69]], roots: [38, 35, 43, 45],
    step(b, s, t, sd) {
      const B = b % 4, ch = this.chords[B];
      if (s === 0) { play('bass', this.roots[B], t, sd * 15, 0.7); ch.forEach(m => play('pad', m, t, sd * 16, 1)); }
      if (s % 2 === 0) { const arp = [0, 1, 2, 3, 2, 1, 2, 3]; play('bell', ch[arp[s / 2]] + 12, t, sd * 4, 0.55); }
      if (s === 10 && b % 2) play('marimba', ch[3] + 12, t, sd * 4, 0.6);
    } },
  // 하늘 여행: 8비트 게임기 느낌의 신나는 비행곡 (F장조, 152bpm)
  sky: { bpm: 152, swing: 0, bars: 8,
    chords: [[65, 69, 72], [60, 64, 67], [62, 65, 69], [58, 62, 65]], roots: [41, 36, 38, 34],
    mel: [[[0, 72, 2], [2, 77, 2], [4, 81, 4], [8, 79, 2], [10, 77, 2], [12, 79, 4]], [[0, 76, 2], [2, 79, 2], [4, 84, 4], [8, 81, 2], [10, 79, 2], [12, 76, 4]],
          [[0, 74, 2], [2, 77, 2], [4, 81, 4], [8, 84, 4], [12, 81, 4]], [[0, 82, 4], [4, 81, 2], [6, 79, 2], [8, 77, 6], [14, 79, 2]]],
    step(b, s, t, sd) {
      const B = b % 4, ch = this.chords[B];
      if (s % 2 === 0) play('bass', this.roots[B] + (s % 4 === 2 ? 12 : 0), t, sd * 1.6, 0.8);
      play('chip', ch[s % 3] + 12, t, sd * 0.8, 0.45);
      if (s === 0 || s === 8) drum('kick', t, 0.8); if (s === 4 || s === 12) drum('snare', t, 0.6); if (s % 2 === 0) drum('hat', t, 0.6);
      const mel = this.mel[B];
      if (b % 8 < 4) { for (const [st, m, l] of mel) if (st === s) play('lead', m, t, sd * l, 0.9); }
      else { for (const [st, m, l] of mel) if (st === s) play('chip', m + 12, t, sd * l, 0.7); if (s === 0) play('bell', ch[2] + 24, t, sd * 8, 0.6); }
    } },
  // 대장 까마귀: 긴박하지만 신나는 결투곡 (D단조, 168bpm, i–VI–VII–i)
  boss: { bpm: 168, swing: 0, bars: 4,
    chords: [[62, 65, 69], [58, 62, 65], [60, 64, 67], [62, 65, 69]], roots: [38, 34, 36, 38],
    mel: [[[0, 74, 2], [2, 77, 2], [4, 81, 2], [6, 77, 2], [8, 86, 4], [12, 84, 4]], [[0, 82, 2], [2, 81, 2], [4, 77, 4], [8, 74, 4], [12, 77, 4]],
          [[0, 79, 2], [2, 81, 2], [4, 84, 4], [8, 88, 4], [12, 84, 4]], [[0, 86, 6], [6, 84, 2], [8, 81, 8]]],
    step(b, s, t, sd) {
      const B = b % 4;
      play('bass', this.roots[B] + (s % 4 === 3 ? 12 : 0), t, sd * 0.9, 0.9);
      if ([0, 3, 6, 10, 12].includes(s)) this.chords[B].forEach(m => play('stab', m + 12, t, sd));
      if (s % 4 === 0) drum('kick', t); if (s === 4 || s === 12) drum('snare', t, 0.9); drum('hat', t, s % 2 ? 0.4 : 0.8);
      if (b % 8 >= 2) for (const [st, m, l] of this.mel[B]) if (st === s) play('lead', m, t, sd * l);
      if (B === 0 && s === 0) drum('crash', t, 0.8);
    } },
  // 도착: 짧은 승리 팡파르 (한 번만)
  arrive: { bpm: 120, swing: 0, bars: 3, once: true,
    step(b, s, t, sd) {
      const seq = [[[0, 72, 2], [2, 76, 2], [4, 79, 2], [6, 84, 6], [12, 79, 2], [14, 84, 2]], [[0, 88, 12]], []][b] || [];
      for (const [st, m, l] of seq) if (st === s) { play('brass', m, t, sd * l); play('chip', m + 12, t, sd * l, 0.5); }
      if (s === 0 && b < 2) { [60, 64, 67].forEach(m => play('pad', m, t, sd * 16, 1.2)); drum('crash', t); drum('kick', t); }
      if (b === 0 && s % 2 === 0) drum('snare', t, 0.3 + s * 0.04);
    } },
  // 두더지 굴: Geometry Dash 느낌의 신나는 일렉트로 (A단조→밝은 진행 vi–IV–I–V, 140bpm). 장애물이 이 박자에 맞춰 놓여 있음
  burrow: { bpm: 140, swing: 0, bars: 8,
    chords: [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]], roots: [45, 41, 48, 43],
    mel: [[[0, 76, 2], [2, 79, 2], [4, 81, 3], [8, 79, 2], [10, 76, 2], [12, 74, 4]], [[0, 72, 2], [2, 74, 2], [4, 76, 3], [8, 77, 2], [10, 76, 2], [12, 72, 4]],
          [[0, 76, 2], [2, 79, 2], [4, 84, 3], [8, 83, 2], [10, 79, 2], [12, 76, 4]], [[0, 74, 3], [4, 79, 3], [8, 83, 4], [12, 81, 4]]],
    step(b, s, t, sd) {
      const B = b % 4, ch = this.chords[B];
      if (s % 4 === 0) drum('kick', t); if (s % 4 === 2) { drum('ohat', t, 0.7); play('bass', this.roots[B], t, sd * 1.8); }
      if (s === 4 || s === 12) drum('snare', t, 0.7); drum('hat', t, 0.35);
      if (s % 4 === 2) ch.forEach(m => play('stab', m + 12, t, sd, 0.8));
      play('chip', ch[[0, 1, 2, 1][s % 4]] + 24, t, sd * 0.7, 0.35);
      if (b % 8 >= 2) for (const [st, m, l] of this.mel[B]) if (st === s) play('lead', m, t, sd * l, 0.9);
      if (B === 0 && s === 0) drum('crash', t, 0.6);
    } },
  // 엔딩: 지구를 살린 축하 행진곡 (C장조, I–V–vi–IV, 116bpm)
  ending: { bpm: 116, swing: 0, bars: 8,
    chords: [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]], roots: [36, 43, 45, 41],
    mel: [[[0, 76, 4], [4, 79, 4], [8, 84, 6], [14, 83, 2]], [[0, 83, 4], [4, 79, 4], [8, 74, 8]], [[0, 72, 4], [4, 76, 4], [8, 81, 6], [14, 79, 2]], [[0, 77, 4], [4, 76, 4], [8, 72, 8]]],
    step(b, s, t, sd) {
      const B = b % 4, ch = this.chords[B];
      if (s === 0) { ch.forEach(m => play('pad', m, t, sd * 16, 1.1)); play('bass', this.roots[B], t, sd * 7); }
      if (s === 8) play('bass', this.roots[B] + 7, t, sd * 7);
      if (s === 0 || s === 8) drum('kick', t, 0.8); if (s === 4 || s === 12) drum('snare', t, 0.6); if (s % 2 === 0) drum('hat', t, 0.4);
      if (s % 4 === 2) play('bell', ch[(s >> 2) % 3] + 24, t, sd * 4, 0.5);
      for (const [st, m, l] of this.mel[B]) if (st === s) { play('brass', m, t, sd * l); if (b % 8 >= 4) play('chip', m + 12, t, sd * l, 0.35); }
      if (B === 0 && s === 0) drum('crash', t, 0.6);
    } },
  // 게임 오버: "뿌뿌뿌 뿌~" 하고 한 번만 연주
  over: { bpm: 96, swing: 0, bars: 2, once: true,
    step(b, s, t, sd) {
      const seq = b === 0 ? [[0, 67, 3], [4, 66, 3], [8, 65, 3], [12, 64, 4]] : [[0, 64, 12]];
      for (const [st, m, l] of seq) if (st === s) { play('lead', m, t, sd * l, 0.9); play('bass', m - 24, t, sd * l, 0.8); }
      if (b === 1 && s === 0) [60, 64, 67].forEach(m => play('pad', m - 12, t, sd * 12));
    } }
};
function musicTick() {
  if (!actx || !music.scene) return;
  if (actx.currentTime - music.nextTime > 1) music.nextTime = actx.currentTime + 0.05; // 탭 이동 후 밀린 박자 버리기
  while (music.nextTime < actx.currentTime + 0.12) {
    // 곡 바꾸기: 급하면 다음 박(4분음표), 아니면 다음 마디 첫 박에서
    if (music.pending && (music.step === 0 || (music.urgent && music.step % 4 === 0))) {
      const prev = music.scene; music.scene = music.pending; music.pending = null; music.step = 0; music.bar = 0; music.done = false;
      if (music.scene === 'chase' || music.scene === 'super') { drum('crash', music.nextTime); drum('kick', music.nextTime); }
      if (prev === 'chase' && music.scene === 'explore') drum('crash', music.nextTime, 0.6);
    }
    const song = SONGS[music.scene], sd = 60 / song.bpm / 4;
    let t = music.nextTime; if (music.step % 4 === 2) t += sd * song.swing;
    if (!music.done && music.on && !muted) { try { song.step(music.bar, music.step, t, sd); } catch (e) {} }
    music.nextTime += sd; music.step++;
    if (music.step >= 16) { music.step = 0; music.bar++; if (song.once && music.bar >= song.bars) music.done = true; }
  }
}
function musicStart() { initAudio(); musicSetup(); }
// 미리듣기용: 곡 하나를 오프라인으로 녹음 (개발 도구)
async function renderSong(name, seconds, layers = 5) {
  const saved = { actx, bus: music.bus, filter: music.filter, scene: music.scene, step: music.step, bar: music.bar, nextTime: music.nextTime, layers: music.layers, pending: music.pending, done: music.done };
  const off = new OfflineAudioContext(1, Math.ceil(44100 * seconds), 44100);
  actx = off; music.bus = null; clearInterval(music.timer);
  music.filter = off.createBiquadFilter(); music.filter.frequency.value = 16000;
  music.bus = off.createGain(); music.bus.gain.value = 0.22; music.bus.connect(music.filter).connect(off.destination);
  const len = off.sampleRate; noiseBuf = off.createBuffer(1, len, off.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  Object.assign(music, { scene: name, pending: null, step: 0, bar: 0, nextTime: 0.05, layers, done: false });
  const mOn = music.on, mu = muted; music.on = true; muted = false;
  while (music.nextTime < seconds - 0.2) { const song = SONGS[music.scene], sd = 60 / song.bpm / 4; let t = music.nextTime; if (music.step % 4 === 2) t += sd * song.swing; if (!music.done) song.step(music.bar, music.step, t, sd); music.nextTime += sd; music.step++; if (music.step >= 16) { music.step = 0; music.bar++; if (song.once && music.bar >= song.bars) music.done = true; } }
  const buf = await off.startRendering();
  music.on = mOn; muted = mu; actx = saved.actx; Object.assign(music, saved); music.bus = saved.bus; music.filter = saved.filter;
  if (actx && music.bus) music.timer = setInterval(musicTick, 25);
  return Array.from(buf.getChannelData(0));
}
