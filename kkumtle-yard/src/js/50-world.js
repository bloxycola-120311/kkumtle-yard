'use strict';
// ---------- 18. 세계 구조 대작전 (지구본 → 버터 타고 비행 → 다른 나라 땅 살리기) ----------
const D2R = Math.PI / 180;
const LAND_PTS = (() => { // 지구 육지 지도(144×72칸)를 점으로 바꿔 둠
  const s = atob('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPQv/38HAABAAAAAAAAAAAAAwPzz//8A4AEAAAADAAAAAACA0A3w//8BAAAAB0AfAAAAAADAAy0A/P8AAABgAPwXAAEAAQIAPvYP/H8AAAAguP//7x8AwP//K9oe+B8AwH+o1///////D////398+AMCwL/8////////AP///684+AAB+P7/////////wP///wMGYAAAfP7//////38dAAb+/wd+AAAAfPz//////wEDAAH4/x9/AABAKP//////f8ABIADw/3//AQCQ+P///////8AAAADg////AwCA/////////wAAAADA//8vAgCA/////////wAAAACA//+/AAAA/6//////fwEAAADA//8PAACA1wf/////PwIAAADA//8HAADgYW//////DwEAAACA//8DAADwQPn///9/BAEAAACA//8DAAAAD+D/////yAAAAAAA/v8AAADgD8D/////IAAAAAAA+n8AAADwP9f/////AQAAAAAA/IMAAADw///3////AQAAAAAA8IEAAAD8/7+P////AAAAAAAA4AEAAAD8/79/+P9/AQAAAAAAwBEAAAD+/3//8OcHAAAAAAAAwBsYAAD8/39/4OMLAAAAAAAAAB6AAAD+//8e4IAHAQAAAAAAAHAAAAD+//8HwIAPAwAAAAAAAAAUAAD+//8JwAAOAgAAAAAAAID+AAD4//8PAIAAAAAAAAAAAAD+AQDw/f8PAAEBAAAAAAAAAAD+DwAA+P8HAIBhAAAAAAAAAAD/DwAA8P8DAABxAAAAAAAAAAD/LwAA8P8BAIBzMQAAAAAAAAD//wEA8P8AAABCwQMAAAAAAAD//wMA4P8AAAAEgAcAAAAAAAD//wMA4P8AAABABQEAAAAAAAD+/wEAwP8AAAAAEAAAAAAAAAD8/wAA4P8IAAAAMAAAAAAAAAD4/wAA4P8MAAAAfgIAAAAAAADw/wAA4H8MAAAA/gcAAAAAAADw/wAA4D8EAADA/w8AAAAAAADwPwAAwD8GAADg/x8AAAAAAADwDwAAwB8AAADA/x8AAAAAAAD4DwAAgB8AAADA/x8AAAAAAAD4BwAAgA8AAADA/x8AAAAAAAD4BwAAgAcAAADAwR8AAAAAAAD4AQAAAAAAAAAAAA8AAAAAAAD4AAAAAAAAAAAAAABAAAAAAAA8AAAAAAAAAAAAAAQgAgAAAAA4AAAAAAAAAAAAAAAQAAAAAAAcAAAAAAAAAAAAAAAIAAAAAAAcAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAABAAAAAAAAwAAAzMAAAAAAAAABgAAAAACD/j////z8AAAAAAAB4AAAg////5/////8HAAAgAH/9AAD8//////////8HAMD///8fAOD///////////8BAPz//38RMP7///////////8BAP7///8fAP////////////8AgP////////////////////8f////////////////////////////////////////////////'), GWd = 144, GHd = 72, pts = [];
  for (let r = 0; r < GHd; r++) for (let c = 0; c < GWd; c++) {
    const i = r * GWd + c;
    if (s.charCodeAt(i >> 3) & (1 << (i & 7))) {
      const la = (90 - (r + 0.5) * 180 / GHd) * D2R, lo = (-180 + (c + 0.5) * 360 / GWd) * D2R;
      pts.push([Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la), Math.abs(la)]);
    }
  }
  return pts;
})();
const HOME = { id: 'home', flag: '🏡', name: L('우리 집', 'Home'), lat: 1.43, lon: 103.6 };
// 테마: 메마른 흙 색깔(dry)과 식물(과일) 바꾸기. 다른 키는 집과 같음
const COUNTRIES = [
  { id: 'au', flag: '🇦🇺', name: L('호주', 'Australia'), place: L('아웃백', 'the Outback'), lat: -25.3, lon: 131.0,
    issue: L('오랜 가뭄으로 붉은 땅이 바짝 말랐어요', 'A long drought has baked the red earth dry'), sign: "G'DAY!",
    dry: [204, 120, 78], deco: ['🦘', '🪨', '🐨'],
    plants: { apple: [L('레몬나무', 'Lemon tree'), '🍋'], peach: [L('망고나무', 'Mango tree'), '🥭'], tomato: [L('토마토 밭', 'Tomato patch'), '🍅'], straw: [L('딸기 밭', 'Strawberry patch'), '🍓'], grape: [L('포도 덩굴', 'Grapevine'), '🍇'], melon: [L('수박 밭', 'Watermelon patch'), '🍉'] } },
  { id: 'mn', flag: '🇲🇳', name: L('몽골', 'Mongolia'), place: L('고비 사막', 'the Gobi Desert'), lat: 43.5, lon: 104.0,
    issue: L('모래바람에 초원이 사막으로 변하고 있어요', 'Sandstorms are turning grassland into desert'), sign: 'САЙН УУ!',
    dry: [212, 198, 165], deco: ['⛺', '🐎', '🐫'],
    plants: { apple: [L('비타민나무', 'Sea buckthorn'), '🟠'], peach: [L('사과나무', 'Apple tree'), '🍏'], tomato: [L('감자밭', 'Potato field'), '🥔'], straw: [L('밀밭', 'Wheat field'), '🌾'], grape: [L('블루베리 덤불', 'Blueberry bush'), '🫐'], melon: [L('양배추 밭', 'Cabbage patch'), '🥬'] } },
  { id: 'mg', flag: '🇲🇬', name: L('마다가스카르', 'Madagascar'), place: L('붉은 섬', 'the Red Island'), lat: -19.0, lon: 46.9,
    issue: L('비가 오면 붉은 흙이 바다로 씻겨 내려가요', 'Rain washes the red soil out to sea'), sign: 'TONGA SOA!',
    dry: [186, 92, 64], deco: ['🌳', '🦎', '🐒'],
    plants: { apple: [L('바나나나무', 'Banana tree'), '🍌'], peach: [L('코코넛나무', 'Coconut palm'), '🥥'], tomato: [L('카카오나무', 'Cacao tree'), '🍫'], straw: [L('파인애플 밭', 'Pineapple patch'), '🍍'], grape: [L('커피나무', 'Coffee bush'), '☕'], melon: [L('고구마 밭', 'Sweet potato patch'), '🍠'] } },
  { id: 'ne', flag: '🇳🇪', name: L('니제르', 'Niger'), place: L('사헬 지대', 'the Sahel'), lat: 16.0, lon: 8.0,
    issue: L('사하라 사막이 남쪽으로 넓어지고 있어요', 'The Sahara is creeping south'), sign: 'BIENVENUE!',
    dry: [232, 192, 122], deco: ['🐪', '🌴', '🦒'],
    plants: { apple: [L('망고나무', 'Mango tree'), '🥭'], peach: [L('오렌지나무', 'Orange tree'), '🍊'], tomato: [L('토마토 밭', 'Tomato patch'), '🍅'], straw: [L('땅콩 밭', 'Peanut patch'), '🥜'], grape: [L('수수 밭', 'Sorghum field'), '🌾'], melon: [L('수박 밭', 'Watermelon patch'), '🍉'] } },
  { id: 'cl', flag: '🇨🇱', name: L('칠레', 'Chile'), place: L('아타카마 사막', 'the Atacama Desert'), lat: -24.5, lon: -69.3,
    issue: L('세상에서 가장 메마른 사막이에요', 'The driest desert on Earth'), sign: '¡BIENVENIDOS!',
    dry: [218, 184, 156], deco: ['🌵', '🦙', '🏔️'],
    plants: { apple: [L('아보카도나무', 'Avocado tree'), '🥑'], peach: [L('체리나무', 'Cherry tree'), '🍒'], tomato: [L('토마토 밭', 'Tomato patch'), '🍅'], straw: [L('딸기 밭', 'Strawberry patch'), '🍓'], grape: [L('포도 덩굴', 'Grapevine'), '🍇'], melon: [L('옥수수 밭', 'Corn field'), '🌽'] } }
];
const HOME_DRY = C_DRY.slice();
const world = { unlocked: false, at: HOME, mission: null, rescued: [], sel: null, gLon: 103.6, gLat: 10, pendingOpen: false, intro: false };
const savedFlags = () => store.get('worm_flags', []);
function kmBetween(a, b) {
  const s = Math.sin(a.lat * D2R) * Math.sin(b.lat * D2R) + Math.cos(a.lat * D2R) * Math.cos(b.lat * D2R) * Math.cos((a.lon - b.lon) * D2R);
  return Math.round(6371 * Math.acos(clamp(s, -1, 1)));
}
const starsFor = km => km < 5000 ? 1 : km < 9000 ? 2 : 3;
function applyTheme(c) {
  C_DRY = c ? c.dry : HOME_DRY.slice();
  for (const p of plants) {
    const base = PLANT_DEFS[p.t], ov = c && c.plants[p.t];
    p.def = ov ? { ...base, name: ov[0], fruit: ov[1] } : base;
  }
  houseSign = c ? c.sign : 'WELCOME';
  fertDirty = true;
}

// ---- 지구본 화면 ----
const gStars = Array.from({ length: 140 }, () => ({ x: Math.random(), y: Math.random(), s: Math.random() * 1.6 + 0.4, p: Math.random() * 6 }));
function openGlobe(intro) {
  if (state !== 'play') { world.pendingOpen = true; world.intro = intro; return; }
  world.pendingOpen = false; mode = 'globe'; state = 'globe'; world.sel = null;
  ['hudL', 'hudR', 'items'].forEach(id => $(id).hidden = true);
  $('gTitle').textContent = intro ? L('📡 SOS! 구조 요청이 들어왔어요!', '📡 SOS! Calls for help are coming in!') : L('🌍 어느 나라를 도와줄까요?', '🌍 Which country will you help?');
  $('gSub').textContent = L('세계 곳곳의 메마른 땅에서 꿈틀이를 부르고 있어요. 버터를 타고 날아가서 흙을 살려 주세요!', 'Dry lands around the world are calling for Wiggles. Fly there on Butter and bring the soil back to life!');
  buildGlobeList(); $('globeUI').hidden = false; SFX.chirp();
}
function buildGlobeList() {
  const list = $('gList'); list.innerHTML = '';
  for (const c of COUNTRIES) {
    const done = world.rescued.includes(c.id), here = world.at.id === c.id, km = kmBetween(world.at, c), st = starsFor(km);
    const b = document.createElement('button');
    b.className = 'gcard' + (world.sel === c ? ' sel' : ''); b.disabled = done || here;
    b.innerHTML = `<span class="gf">${c.flag}</span><span class="gt"><b>${c.name}</b> · ${c.place}<br><small>${done ? L('✅ 구조 완료', '✅ Rescued') : c.issue}</small></span><span class="gm">${L('난이도', 'Level')} ${'●'.repeat(st)}${'○'.repeat(3 - st)}<br><small>${km.toLocaleString()}km</small><br><span class="best">${starMap[c.id] ? '⭐'.repeat(starMap[c.id]) : ''}</span></span>`;
    b.onclick = () => { world.sel = c; buildGlobeList(); SFX.item(); };
    list.appendChild(b);
  }
  const fb = $('btnFly');
  fb.disabled = !world.sel;
  fb.textContent = world.sel ? L(`🐦 버터 타고 ${world.sel.name}(으)로 출발!`, `🐦 Fly to ${world.sel.name} on Butter!`) : L('나라를 골라 주세요', 'Pick a country');
}
function closeGlobe() {
  $('globeUI').hidden = true; mode = 'yard'; state = 'play';
  ['hudL', 'hudR', 'items'].forEach(id => $(id).hidden = false);
  last_t = performance.now(); hudDirty = true;
}
function projG(lat, lon, cx, cy, R) {
  const la = lat * D2R, lo = lon * D2R, x = Math.cos(la) * Math.cos(lo), y = Math.cos(la) * Math.sin(lo), z = Math.sin(la);
  const l0 = world.gLon * D2R, p0 = world.gLat * D2R, cl = Math.cos(l0), sl = Math.sin(l0), cp = Math.cos(p0), sp = Math.sin(p0);
  const x1 = x * cl + y * sl, y1 = -x * sl + y * cl, x2 = x1 * cp + z * sp, z2 = -x1 * sp + z * cp;
  return { x: cx + R * y1, y: cy - R * z2, vis: x2 > 0.02, depth: x2 };
}
function updateGlobe(dt) {
  time += dt;
  const tgt = world.sel || null;
  if (tgt) {
    const dl = angNorm((tgt.lon - world.gLon) * D2R) / D2R;
    world.gLon += dl * Math.min(1, dt * 3); world.gLat += (tgt.lat * 0.7 - world.gLat) * Math.min(1, dt * 3);
  } else { world.gLon += dt * 12; world.gLat += (12 - world.gLat) * Math.min(1, dt); }
  if (world.gLon > 180) world.gLon -= 360;
}
function renderGlobe() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const bg = ctx.createLinearGradient(0, 0, 0, vh); bg.addColorStop(0, '#0a0f2c'); bg.addColorStop(1, '#22305e');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, vw, vh);
  for (const s of gStars) { ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(time * 1.5 + s.p)); ctx.fillStyle = '#fff'; ctx.fillRect(s.x * vw, s.y * vh, s.s, s.s); }
  ctx.globalAlpha = 1;
  const panel = $('gpanel'), open = panel && !$('globeUI').hidden, side = vw > 900;
  const ph = open && !side ? panel.offsetHeight + 24 : 0, pw = open && side ? panel.offsetWidth + 32 : 0;
  const availH = Math.max(160, vh - ph), availW = vw - pw;
  const R = Math.max(70, Math.min(availW * 0.42, availH * 0.42)), cx = availW / 2, cy = Math.max(R + 14, availH / 2);
  const glow = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.25);
  glow.addColorStop(0, 'rgba(120,190,255,.45)'); glow.addColorStop(1, 'rgba(120,190,255,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, R * 1.25, 0, 7); ctx.fill();
  const oc = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R);
  oc.addColorStop(0, '#4fb3f0'); oc.addColorStop(1, '#174a8a');
  ctx.fillStyle = oc; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
  const l0 = world.gLon * D2R, p0 = world.gLat * D2R, cl = Math.cos(l0), sl = Math.sin(l0), cp = Math.cos(p0), sp = Math.sin(p0), ds = R * 0.05;
  for (const p of LAND_PTS) {
    const x1 = p[0] * cl + p[1] * sl, y1 = -p[0] * sl + p[1] * cl, x2 = x1 * cp + p[2] * sp;
    if (x2 <= 0) continue;
    const z2 = -x1 * sp + p[2] * cp, sh = 0.45 + 0.55 * x2;
    ctx.fillStyle = p[3] > 1.15 ? `rgb(${230 * sh | 0},${240 * sh | 0},${250 * sh | 0})` : `rgb(${(90 + 40 * (1 - sh)) * sh | 0},${175 * sh | 0},${85 * sh | 0})`;
    ctx.fillRect(cx + R * y1 - ds / 2, cy - R * z2 - ds / 2, ds, ds);
  }
  // 비행 경로
  if (world.sel) {
    const a = world.at, b = world.sel;
    const va = [Math.cos(a.lat * D2R) * Math.cos(a.lon * D2R), Math.cos(a.lat * D2R) * Math.sin(a.lon * D2R), Math.sin(a.lat * D2R)];
    const vb = [Math.cos(b.lat * D2R) * Math.cos(b.lon * D2R), Math.cos(b.lat * D2R) * Math.sin(b.lon * D2R), Math.sin(b.lat * D2R)];
    const om = Math.acos(clamp(va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2], -1, 1)) || 1e-6;
    let bird = null; const bt = (time * 0.35) % 1;
    for (let i = 0; i <= 60; i++) {
      const t = i / 60, s1 = Math.sin((1 - t) * om) / Math.sin(om), s2 = Math.sin(t * om) / Math.sin(om);
      const v = [va[0] * s1 + vb[0] * s2, va[1] * s1 + vb[1] * s2, va[2] * s1 + vb[2] * s2];
      const q = projG(Math.asin(v[2]) / D2R, Math.atan2(v[1], v[0]) / D2R, cx, cy, R * (1 + 0.08 * Math.sin(t * Math.PI)));
      if (q.vis && i % 2 === 0) { ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(q.x, q.y, 2.4, 0, 7); ctx.fill(); }
      if (Math.abs(t - bt) < 1 / 120 && q.vis) bird = q;
    }
    if (bird) { ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; emoji('🐦', bird.x, bird.y - 8, 20); }
  }
  // 표시: 집, SOS 나라들
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const marks = [world.at.id === 'home' ? HOME : world.at, ...COUNTRIES.filter(c => c !== world.at)];
  if (world.at.id !== 'home') marks.push(HOME);
  for (const c of marks) {
    const q = projG(c.lat, c.lon, cx, cy, R); if (!q.vis) continue;
    const done = world.rescued.includes(c.id), isHere = c === world.at, isSel = c === world.sel;
    if (c.id !== 'home' && !done && !isHere) {
      const k = (((time * 1.2 + c.lat) % 1) + 1) % 1;
      ctx.strokeStyle = `rgba(255,70,60,${1 - k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(q.x, q.y, 6 + k * 26, 0, 7); ctx.stroke();
    }
    ctx.fillStyle = isSel ? '#ffd23f' : done ? '#7bd35a' : isHere ? '#fff' : '#ff4a3d';
    ctx.beginPath(); ctx.arc(q.x, q.y, isSel ? 7 : 5, 0, 7); ctx.fill();
    emoji(isHere ? '📍' : done ? '✅' : c.flag, q.x, q.y - 20, isSel ? 26 : 20);
    ctx.font = '13px Jua, sans-serif'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.75)'; ctx.fillStyle = '#fff';
    const lbl = c.id === 'home' ? HOME.name : c.name + (c.id !== 'home' && !done && !isHere ? ' SOS' : '');
    ctx.strokeText(lbl, q.x, q.y + 15); ctx.fillText(lbl, q.x, q.y + 15);
  }
}

// ---- 비행 ----
const FH = 540; // 비행 화면 세로(논리 단위)
const fl = { on: false };
const TREATS = [
  { e: '🌾', n: L('귀리', 'Oats'), pts: 20, g: 8, w: 40 },
  { e: '🌻', n: L('해바라기씨', 'Sunflower seeds'), pts: 40, g: 12, w: 22 },
  { e: '🥦', n: L('브로콜리', 'Broccoli'), pts: 30, g: 10, w: 16 },
  { e: '🍎', n: L('사과 조각', 'Apple slice'), pts: 30, g: 10, w: 16 }
];
const POWERS = { gold: { e: '🌾', n: L('황금 기장! 세 갈래 발사', 'Golden millet! Triple shot') }, shield: { e: '🛡️', n: L('깃털 방패!', 'Feather shield!') }, heart: { e: '💛', n: L('버터 기운 +1', 'Butter energy +1') } };
function flView() { // 세로 화면이면 비행 방향을 위쪽으로 돌려서 그림
  const portrait = vh > vw * 1.05, fwdPx = portrait ? vh : vw, crossPx = portrait ? vw : vh, s = crossPx / FH;
  return { portrait, s, FW: fwdPx / s };
}
function startFlight(c) {
  $('globeUI').hidden = true;
  const km = kmBetween(world.at, c), st = starsFor(km);
  world.livesAtDepart = lives;
  Object.assign(fl, {
    on: true, c, from: world.at, km, stars: st, dur: 38 + km / 420, t: 0, prog: 0, phase: 'fly',
    x: 160, y: FH / 2, shots: [], foes: [], bullets: [], items: [], storms: [], fx: [], clouds: [], ground: [],
    fireT: 0, mouthT: 0, triple: 0, shield: 0, fever: 0, gauge: 0, invul: 0, flapPh: 0, spawnT: 1.5, itemT: 1, stormT: 9,
    geeseDone: false, arrivedShown: false, boss: null, combo: 0, comboT: 0, arriveT: 0, kills: 0, dragX: 0, dragY: 0, treats: 0, bank: 0
  });
  for (let i = 0; i < 14; i++) fl.clouds.push({ x: Math.random() * 1600, y: rand(20, 420), s: rand(0.5, 1.4), z: rand(0.25, 0.8) });
  fl.hp = 3; mode = 'flight'; state = 'flight'; fireHeld = false;
  $('flyUI').hidden = false;
  banner(L(`🐦 출발! ${c.name}까지 ${km.toLocaleString()}km — F 키로 발사! 🔥`, `🐦 Off we go! ${km.toLocaleString()}km to ${c.name} — press F to fire! 🔥`), 3.2);
  SFX.sup(); last_t = performance.now();
}
let fireHeld = false;
const FX = {
  shoot() { tone(820, 0.06, 'square', 0.035, 260); },
  caw() { tone(760, 0.16, 'sawtooth', 0.06, 380); noise(0.08, 0.06); },
  boom() { noise(0.25, 0.25); tone(140, 0.3, 'triangle', 0.12, 50); },
  munch() { tone(600, 0.05, 'triangle', 0.08, 900); tone(900, 0.06, 'triangle', 0.06, 1300, 0.05); },
  zap() { noise(0.35, 0.3); tone(90, 0.4, 'sawtooth', 0.1, 40); },
  power() { [660, 880, 1100, 1320].forEach((f, i) => tone(f, 0.1, 'square', 0.05, 0, i * 0.05)); }
};
function spawnFoe(type, x, y, extra) {
  const base = { crow: { hp: 1, r: 22, vx: -rand(170, 230) }, diver: { hp: 1, r: 22, vx: -200 }, raven: { hp: 3, r: 32, vx: -110 }, goose: { hp: 99, r: 18, vx: -150 } }[type];
  fl.foes.push({ type, x, y, by: y, ph: Math.random() * 6, amp: type === 'crow' ? rand(20, 60) : 0, shootT: rand(1, 2.2), flap: Math.random() * 6, hit: 0, ...base, ...(extra || {}) });
}
function flightWave(FW) {
  const p = fl.prog, st = fl.stars, r = Math.random();
  if (r < 0.35) { const y = rand(80, FH - 80); for (let i = 0; i < 3; i++) spawnFoe('crow', FW + 40 + i * 70, y + (i - 1) * 30); }
  else if (r < 0.55) spawnFoe('diver', FW + 40, rand(60, FH - 60));
  else if (r < 0.72 && p > 0.2) spawnFoe('raven', FW + 60, rand(90, FH - 90));
  else if (r < 0.88 && p > 0.35) { const y = rand(140, FH - 140); for (let i = 0; i < 5; i++) spawnFoe('crow', FW + 40 + Math.abs(i - 2) * 55, y + (i - 2) * 48, { amp: 0 }); }
  else spawnFoe('crow', FW + 40, rand(60, FH - 60));
  if (st >= 2 && Math.random() < 0.25) spawnFoe('diver', FW + 120, rand(60, FH - 60));
}
function startBoss(FW) {
  fl.phase = 'boss'; const hp = 36 + fl.stars * 18;
  fl.boss = { x: FW + 160, y: FH / 2, r: 66, hp, max: hp, t: 0, atkT: 2.2, atk: 0, charge: 0, flap: 0, hit: 0, enter: true };
  banner(L('👑 까마귀 대장 까옥이가 나타났다!', '👑 Captain Caw, the crow boss, appears!'), 2.8, true); FX.caw(); shake = 12;
}
function flHurt() {
  if (fl.invul > 0 || fl.fever > 0) return;
  if (fl.shield > 0) { fl.shield = 0; fl.invul = 1; FX.boom(); floatFx(fl.x, fl.y - 50, L('방패가 막았어요!', 'Shield blocked it!'), '#bfe9ff'); return; }
  fl.hp--; fl.invul = 1.6; shake = 14; flash = 0.2; SFX.hurt();
  floatFx(fl.x, fl.y - 50, L('아야! 버터 기운 -1', 'Ouch! Butter energy -1'), '#ffd0d0');
  if (fl.hp <= 0) { // 버터가 지쳐서 추락 → 꿈틀이 하나를 잃음
    featherBurst(fl.x, fl.y, 30, '#e8e4d0');
    if (loseLife()) { fl.hp = 3; fl.invul = 2.8; banner(L(`버터가 기운을 되찾았어요! 남은 꿈틀이 ${lives}`, `Butter got her energy back! ${lives} Wiggles left`), 2.4, true); }
    else { fl.phase = 'dead'; setTimeout(() => { $('flyUI').hidden = true; gameOver(); }, 900); state = 'dying'; }
  }
}
function floatFx(x, y, t, c = '#fff', s = 20) { fl.fx.push({ kind: 'text', x, y, t, c, s, life: 1.1 }); }
function featherBurst(x, y, n, col = '#1e1e26') { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, sp = rand(60, 240); fl.fx.push({ kind: 'feather', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, rot: Math.random() * 6, life: rand(0.5, 1), c: col }); } }
function killFoe(f) {
  f.dead = true; fl.kills++; stats.crows = (stats.crows || 0) + 1;
  fl.combo = fl.comboT > 0 ? fl.combo + 1 : 1; fl.comboT = 1.6;
  const pts = ({ crow: 100, diver: 120, raven: 300 }[f.type] || 100) * Math.min(5, fl.combo);
  addScore(pts); FX.caw(); featherBurst(f.x, f.y, 10);
  floatFx(f.x, f.y - 20, L(`까악! +${pts}`, `CAW! +${pts}`) + (fl.combo > 1 ? ` x${Math.min(5, fl.combo)}` : ''), fl.combo > 1 ? '#ffe082' : '#fff');
  if (Math.random() < 0.12) fl.items.push({ x: f.x, y: f.y, kind: 'treat', tr: pick(TREATS), ph: 0 });
}
function updateFlight(dt) {
  time += dt;
  const V = flView(), FW = V.FW, spd = 230;
  fl.t += dt; fl.flapPh += dt * (fl.fever > 0 ? 26 : 18);
  for (const k of ['fireT', 'mouthT', 'triple', 'shield', 'fever', 'invul', 'comboT']) fl[k] = Math.max(0, fl[k] - dt);
  if (fl.phase === 'fly') { fl.prog = Math.min(1, fl.t / fl.dur); if (fl.prog >= 1) startBoss(FW); }
  // --- 조종 ---
  if (fl.phase === 'fly' || fl.phase === 'boss') {
    let sx = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
    let sy = (keys.ArrowDown || keys.KeyS ? 1 : 0) - (keys.ArrowUp || keys.KeyW ? 1 : 0);
    if (joy.id !== null) { sx = clamp(sx + joy.vx * 1.25, -1, 1); sy = clamp(sy + joy.vy * 1.25, -1, 1); }
    let lx = sx, ly = sy; if (V.portrait) { lx = -sy; ly = sx; }
    const kspd = 380; fl.x += lx * kspd * dt; fl.y += ly * kspd * dt;
    let dx = fl.dragX / V.s, dy = fl.dragY / V.s; if (V.portrait) { const t = dx; dx = -dy; dy = t; }
    fl.x += dx * 1.15; fl.y += dy * 1.15; fl.dragX = fl.dragY = 0;
    fl.x = clamp(fl.x, 60, FW * 0.62); fl.y = clamp(fl.y, 46, FH - 46);
    if ((fireHeld || keys.KeyF || keys.Space || keys.KeyJ) && fl.fireT <= 0) {
      fl.fireT = fl.fever > 0 ? 0.08 : 0.19; fl.mouthT = 0.12; FX.shoot();
      const mx = fl.x + 62, my = fl.y - 14;
      const angs = fl.triple > 0 || fl.fever > 0 ? [-0.2, 0, 0.2] : [0];
      for (const a of angs) fl.shots.push({ x: mx, y: my, vx: Math.cos(a) * 700, vy: Math.sin(a) * 700, rb: fl.fever > 0 });
      fl.fx.push({ kind: 'text', x: mx + 10, y: my - 18, t: L('퉤!', 'Ptoo!'), c: '#fff8e1', s: 13, life: 0.35 });
    }
  }
  // --- 생성 ---
  if (fl.phase === 'fly') {
    fl.spawnT -= dt;
    if (fl.spawnT <= 0) { flightWave(FW); fl.spawnT = Math.max(0.55, 1.7 - fl.stars * 0.18 - fl.prog * 0.5) * DIFF.fly; }
    if (!fl.geeseDone && fl.prog > 0.33) { fl.geeseDone = true; for (let i = 0; i < 7; i++) spawnFoe('goose', FW + 60 + Math.abs(i - 3) * 50, 150 + (i - 3) * 34); banner(L('🪿 기러기 친구들이 응원하러 왔어요! 쏘지 마세요~', '🪿 Friendly geese are cheering you on! Don\'t shoot them~'), 2.6); }
    fl.stormT -= dt;
    if (fl.stormT <= 0 && fl.prog > 0.15 && fl.prog < 0.92) { fl.storms.push({ x: FW + 120, y: rand(50, 150), zap: 2.2, bolt: 0 }); fl.stormT = rand(14, 22) - fl.stars * 2; }
  }
  if (fl.phase === 'fly' || fl.phase === 'boss') {
    fl.itemT -= dt;
    if (fl.itemT <= 0) {
      fl.itemT = rand(0.8, 1.5);
      const r = Math.random(), y = rand(60, FH - 60);
      if (r < 0.07) fl.items.push({ x: FW + 30, y, kind: 'gold', ph: 0 });
      else if (r < 0.12) fl.items.push({ x: FW + 30, y, kind: 'shield', ph: 0 });
      else if (r < 0.15 && fl.hp < 3) fl.items.push({ x: FW + 30, y, kind: 'heart', ph: 0 });
      else { const tot = TREATS.reduce((s, t) => s + t.w, 0); let q = Math.random() * tot, tr = TREATS[0]; for (const t of TREATS) { q -= t.w; if (q <= 0) { tr = t; break; } } fl.items.push({ x: FW + 30, y, kind: 'treat', tr, ph: Math.random() * 6 }); }
    }
  }
  // --- 이동/충돌 ---
  for (const s of fl.shots) { s.x += s.vx * dt; s.y += s.vy * dt; }
  fl.shots = fl.shots.filter(s => s.x < FW + 40 && s.y > -20 && s.y < FH + 20 && !s.dead);
  for (const f of fl.foes) {
    f.flap += dt * (f.type === 'goose' ? 9 : 14); f.hit = Math.max(0, f.hit - dt);
    if (f.type === 'crow') { f.x += f.vx * dt; f.ph += dt * 3; f.y = f.by + Math.sin(f.ph) * f.amp; }
    else if (f.type === 'diver') { f.x += f.vx * dt; if (f.x < fl.x + 320 && !f.dive) { f.dive = true; f.vy = Math.sign(fl.y - f.y) * 260; f.vx = -330; } if (f.dive) f.y += f.vy * dt; }
    else if (f.type === 'raven') { f.x += f.vx * dt; f.y = f.by + Math.sin(fl.t * 2 + f.ph) * 30; f.shootT -= dt; if (f.shootT <= 0 && f.x < FW - 40) { f.shootT = 2.2; const a = Math.atan2(fl.y - f.y, fl.x - f.x); fl.bullets.push({ x: f.x - 20, y: f.y, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260 }); } }
    else if (f.type === 'goose') { f.x += f.vx * dt; if (Math.random() < 0.01) floatFx(f.x, f.y - 20, L('화이팅!', 'Go go!'), '#e3f2fd', 14); }
    for (const s of fl.shots) {
      if (s.dead || f.dead) continue;
      if (dist(s.x, s.y, f.x, f.y) < f.r + 8) {
        s.dead = true;
        if (f.type === 'goose') { addScore(-50); floatFx(f.x, f.y - 20, L('앗! 친구야! -50', 'Hey! Friend! -50'), '#ffcdd2'); f.hit = 0.3; continue; }
        f.hp--; f.hit = 0.12; featherBurst(s.x, s.y, 3); if (f.hp <= 0) killFoe(f);
      }
    }
    if (!f.dead && f.type !== 'goose' && dist(f.x, f.y, fl.x, fl.y) < f.r + 26) { if (fl.fever > 0) killFoe(f); else { flHurt(); f.dead = true; featherBurst(f.x, f.y, 8); } }
  }
  fl.foes = fl.foes.filter(f => !f.dead && f.x > -120 && f.y > -120 && f.y < FH + 120);
  for (const b of fl.bullets) { b.x += b.vx * dt; b.y += b.vy * dt; if (dist(b.x, b.y, fl.x, fl.y) < 26) { b.dead = true; flHurt(); } }
  fl.bullets = fl.bullets.filter(b => !b.dead && b.x > -30 && b.x < FW + 60 && b.y > -30 && b.y < FH + 30);
  for (const it of fl.items) {
    it.x -= spd * 0.9 * dt; it.ph += dt * 3;
    const iy = it.y + Math.sin(it.ph) * 10;
    if (dist(it.x, iy, fl.x + 30, fl.y - 10) < 44) {
      it.dead = true;
      if (it.kind === 'treat') { addScore(it.tr.pts); fl.gauge = Math.min(100, fl.gauge + it.tr.g); fl.treats++; stats.treats = (stats.treats || 0) + 1; FX.munch(); floatFx(it.x, iy - 16, `${L('냠!', 'Yum!')} ${it.tr.n} +${it.tr.pts}`, '#fffde7', 15); }
      else { FX.power(); floatFx(it.x, iy - 16, POWERS[it.kind].n, '#fff59d', 17); if (it.kind === 'gold') fl.triple = 9; if (it.kind === 'shield') fl.shield = 12; if (it.kind === 'heart') fl.hp = Math.min(3, fl.hp + 1); }
      if (fl.gauge >= 100 && fl.fever <= 0) { fl.fever = 7; fl.gauge = 0; SFX.sup(); flash = 0.25; banner(L('💛 버터 신남 폭발! 무적 + 연사!', '💛 Butter Fever! Invincible rapid fire!'), 2.4); }
    }
  }
  fl.items = fl.items.filter(i => !i.dead && i.x > -40);
  for (const st of fl.storms) {
    st.x -= spd * 0.45 * dt; st.zap -= dt;
    if (st.zap <= 0 && st.bolt <= 0) { st.bolt = 0.35; FX.zap(); shake = 6; }
    if (st.bolt > 0) { st.bolt -= dt; if (Math.abs(fl.x - st.x) < 34 && fl.y > st.y) flHurt(); if (st.bolt <= 0) st.zap = 2.6; }
  }
  fl.storms = fl.storms.filter(s => s.x > -160);
  // --- 대장 까마귀 ---
  const B = fl.boss;
  if (B && fl.phase === 'boss') {
    B.t += dt; B.flap += dt * 10; B.hit = Math.max(0, B.hit - dt);
    const homeX = FW - 150, enraged = B.hp < B.max / 2;
    if (B.enter) { B.x += (homeX - B.x) * Math.min(1, dt * 1.5); if (Math.abs(B.x - homeX) < 6) B.enter = false; }
    else if (B.charge > 0) { B.charge -= dt; B.x -= 640 * dt; if (B.x < 40) B.charge = 0; }
    else { B.x += (homeX - B.x) * Math.min(1, dt * 2); B.y = FH / 2 + Math.sin(B.t * (enraged ? 1.6 : 1.1)) * (FH / 2 - 90); }
    B.atkT -= dt;
    if (!B.enter && B.atkT <= 0 && B.charge <= 0) {
      B.atk = (B.atk + 1) % 3; B.atkT = enraged ? 1.6 : 2.3; FX.caw();
      if (B.atk === 0) { const a0 = Math.atan2(fl.y - B.y, fl.x - B.x); for (let i = -3; i <= 3; i++) fl.bullets.push({ x: B.x - 50, y: B.y, vx: Math.cos(a0 + i * 0.17) * 250, vy: Math.sin(a0 + i * 0.17) * 250 }); }
      if (B.atk === 1) { for (let i = 0; i < 3; i++) spawnFoe('crow', B.x - 20, B.y + (i - 1) * 60, { amp: 30 }); }
      if (B.atk === 2) { B.y = fl.y; B.charge = 1.6; floatFx(B.x, B.y - 80, L('까아아악!! 돌진!', 'CAAAW!! Charge!'), '#ffccbc', 18); }
    }
    for (const s of fl.shots) if (!s.dead && dist(s.x, s.y, B.x, B.y) < B.r) { s.dead = true; B.hp -= 1; B.hit = 0.08; featherBurst(s.x, s.y, 2); addScore(10); }
    if (dist(B.x, B.y, fl.x, fl.y) < B.r + 22) flHurt();
    if (B.hp <= 0) {
      fl.phase = 'arrive'; fl.arriveT = 0; addScore(3000 * fl.stars); stats.bosses = (stats.bosses || 0) + 1;
      FX.boom(); featherBurst(B.x, B.y, 50); shake = 20; flash = 0.3; fl.bullets = []; fl.foes.forEach(f => { if (f.type !== 'goose') { f.dead = true; featherBurst(f.x, f.y, 6); } });
      banner(L(`까옥이: "까악…! 다시는 안 올게…" +${(3000 * fl.stars).toLocaleString()}`, `Captain Caw: "CAW…! I'll never come back…" +${(3000 * fl.stars).toLocaleString()}`), 3);
      B.flee = true;
    }
  }
  if (B && B.flee) { B.x += 300 * dt; B.y -= 200 * dt; B.flap += dt * 20; }
  // --- 도착 ---
  if (fl.phase === 'arrive') {
    fl.arriveT += dt;
    fl.x += (FW * 0.45 - fl.x) * Math.min(1, dt * 1.2); fl.y += (FH - 150 - fl.y) * Math.min(1, dt * 0.8);
    if (fl.arriveT > 1.2 && Math.random() < 0.5) fl.fx.push({ kind: 'confetti', x: rand(0, FW), y: -10, vx: rand(-30, 30), vy: rand(80, 180), rot: Math.random() * 6, life: 3, c: pick(['#ffd23f', '#ff6b6b', '#4fc3f7', '#81c784', '#fff']) });
    if (fl.arriveT > 3.4 && !fl.arrivedShown) { fl.arrivedShown = true; showArrival(); }
  }
  // 구름/효과
  for (const c of fl.clouds) { c.x -= spd * c.z * dt; if (c.x < -300) { c.x = FW + rand(50, 400); c.y = rand(20, 420); } }
  for (const e of fl.fx) { e.life -= dt; if (e.kind === 'text') e.y -= 30 * dt; else { e.x += e.vx * dt; e.y += e.vy * dt; e.rot += dt * 5; if (e.kind === 'feather') { e.vx *= 0.96; e.vy = e.vy * 0.96 + 60 * dt; } } }
  fl.fx = fl.fx.filter(e => e.life > 0);
  shake = Math.max(0, shake - dt * 30); flash = Math.max(0, flash - dt);
}
function showArrival() {
  const c = fl.c;
  state = 'award'; SFX.award();
  $('certCard').innerHTML = `
    <div class="medal">${c.flag}</div>
    <div class="name">${L(`${c.name} 도착!`, `Arrived in ${c.name}!`)}</div>
    <div class="who">${c.sign}</div>
    <p>${L(`버터와 꿈틀이가 ${fl.km.toLocaleString()}km를 날아 ${c.place}에 도착했어요.<br>까마귀 ${fl.kills}마리를 쫓아내고 간식 ${fl.treats}개를 먹었어요!`, `Butter and Wiggles flew ${fl.km.toLocaleString()}km to ${c.place}.<br>They chased off ${fl.kills} crows and ate ${fl.treats} treats!`)}</p>
    <p><b>${L(`미션: ${c.place}의 흙을 40%까지 살려 주세요!`, `Mission: bring the soil of ${c.place} up to 40%!`)}</b></p>
    <button class="big" id="btnLand">${L('🪱 땅 살리러 가기!', '🪱 Let\'s heal the land!')}</button>`;
  $('award').hidden = false; $('flyUI').hidden = true;
  $('btnLand').onclick = () => { $('award').hidden = true; startForeignYard(c); };
  $('btnLand').focus();
}
function startForeignYard(c) {
  fl.on = false; mode = 'yard'; state = 'play'; world.at = c; world.mission = c; world.missionStart = time; offerQuiz('geo');
  applyTheme(c);
  resetFert(); worm.x = W / 2; worm.y = H / 2 + 100; worm.trail = []; for (let i = 0; i < 200; i++) worm.trail.push({ x: worm.x, y: worm.y + i * 2 });
  nutrients = []; mapItems = []; castings = []; particles = []; texts = [];
  for (let i = 0; i < 28; i++) spawnNutrient();
  Object.assign(mole, { state: 'none', timer: 30, scale: 1, spin: 0 }); Object.assign(butter, { state: 'none', timer: 40 });
  quests = []; for (let i = 0; i < 3; i++) quests.push(newQuest());
  resetCritters(false); resetWildlife(c);
  updatePlants(true); hudDirty = true; awardQueue = [];
  ['hudL', 'hudR', 'items'].forEach(id => $(id).hidden = false);
  banner(L(`${c.flag} ${c.place}의 흙을 살려 주세요! 목표 40%`, `${c.flag} Heal the soil of ${c.place}! Goal: 40%`), 3.2);
  last_t = performance.now();
}
function checkMission() {
  const c = world.mission; if (!c || state !== 'play') return;
  if (fertAvg() * 100 >= 40) {
    world.mission = null; world.rescued.push(c.id); stats.rescued = (stats.rescued || []).concat(c.flag);
    const fl0 = savedFlags(); if (!fl0.includes(c.flag)) store.set('worm_flags', fl0.concat(c.flag));
    addScore(2000 * starsFor(kmBetween(HOME, c))); offerQuiz('bio');
    state = 'award'; SFX.award();
    const all = world.rescued.length === COUNTRIES.length, rate = rateRescue(c);
    if (all) discover('earth');
    $('certCard').innerHTML = `
      <div class="tag" style="letter-spacing:.2em">${L('구조 성공', 'RESCUED')}</div>
      <div class="medal">${c.flag}</div>
      <div class="name">${L(`${c.name} 구하기 성공!`, `${c.name} is saved!`)}</div>
      ${rate.html}
      <p>${L(`${c.place}의 흙이 다시 살아났어요. 마을 사람들이 고마워하고 있어요!`, `The soil of ${c.place} is alive again. The villagers say thank you!`)}<br>${L('구조한 나라', 'Countries rescued')}: <b>${world.rescued.length} / ${COUNTRIES.length}</b></p>
      ${all ? `<p><b>${L('🌍 세계의 메마른 땅을 모두 구했어요! 진정한 지구 지킴이!', '🌍 You saved every dry land on Earth! A true Earth guardian!')}</b></p>` : ''}
      <div class="btnrow"><button class="big" id="btnNext">${all ? L('🌍 엔딩 보기', '🌍 Watch the ending') : L('🌍 다음 나라 고르기', '🌍 Pick the next country')}</button>${all ? '' : `<button class="big alt" id="btnStay">${L('여기서 더 놀기', 'Stay here')}</button>`}</div>`;
    $('award').hidden = false;
    $('btnNext').onclick = () => { $('award').hidden = true; state = 'play'; last_t = performance.now(); if (all) startEnding(); else openGlobe(false); };
    if ($('btnStay')) $('btnStay').onclick = () => { $('award').hidden = true; state = 'play'; last_t = performance.now(); };
  }
}

// ---- 비행 그리기 ----
function drawCrow(f, boss) {
  const r = boss ? f.r : f.r, fw = Math.sin(f.flap) * 0.9;
  ctx.save(); ctx.translate(f.x, f.y);
  if (f.type === 'goose') {
    ctx.fillStyle = '#eceff1'; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.2, r * 0.6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#cfd8dc'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r * 0.4, -r * 1.3 * (0.4 + Math.abs(fw))); ctx.lineTo(r * 1.0, -2); ctx.fill();
    ctx.fillStyle = '#37474f'; ctx.beginPath(); ctx.arc(-r * 1.2, -r * 0.3, r * 0.4, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff9800'; ctx.beginPath(); ctx.moveTo(-r * 1.55, -r * 0.35); ctx.lineTo(-r * 2.0, -r * 0.2); ctx.lineTo(-r * 1.55, -r * 0.1); ctx.fill();
    ctx.restore(); return;
  }
  const body = f.hit > 0 ? '#ffffff' : '#23232d';
  // 뒷날개
  ctx.fillStyle = '#15151c'; ctx.beginPath(); ctx.moveTo(-r * 0.1, -r * 0.2); ctx.lineTo(r * 0.9, -r * (0.6 + fw * 1.1)); ctx.lineTo(r * 1.1, -r * 0.1); ctx.fill();
  // 꼬리
  ctx.fillStyle = '#1a1a22'; ctx.beginPath(); ctx.moveTo(r * 0.8, 0); ctx.lineTo(r * 1.7, -r * 0.35); ctx.lineTo(r * 1.75, r * 0.35); ctx.closePath(); ctx.fill();
  // 몸
  ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.05, r * 0.72, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(90,110,200,.25)'; ctx.beginPath(); ctx.ellipse(-r * 0.1, -r * 0.25, r * 0.6, r * 0.25, 0, 0, 7); ctx.fill();
  // 머리
  ctx.fillStyle = body; ctx.beginPath(); ctx.arc(-r * 0.95, -r * 0.25, r * 0.55, 0, 7); ctx.fill();
  ctx.fillStyle = '#3d3d47'; ctx.beginPath(); ctx.moveTo(-r * 1.35, -r * 0.4); ctx.lineTo(-r * 2.05, -r * 0.12); ctx.lineTo(-r * 1.35, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-r * 1.05, -r * 0.36, r * 0.2, 0, 7); ctx.fill();
  ctx.fillStyle = boss ? '#e53935' : '#111'; ctx.beginPath(); ctx.arc(-r * 1.1, -r * 0.34, r * 0.1, 0, 7); ctx.fill();
  ctx.strokeStyle = '#000'; ctx.lineWidth = Math.max(2, r * 0.08); ctx.beginPath(); ctx.moveTo(-r * 1.3, -r * 0.6); ctx.lineTo(-r * 0.85, -r * 0.45); ctx.stroke();
  // 앞날개
  ctx.fillStyle = '#2c2c38'; ctx.beginPath(); ctx.moveTo(-r * 0.3, -r * 0.1); ctx.lineTo(r * 0.7, -r * (0.4 + fw * 1.3)); ctx.lineTo(r * 0.9, r * 0.1); ctx.closePath(); ctx.fill();
  if (boss) { ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; emoji('👑', -r * 0.9, -r * 1.0, r * 0.7); ctx.fillStyle = '#d32f2f'; ctx.fillRect(-r * 1.3, -r * 0.05, r * 0.8, r * 0.16); }
  ctx.restore();
}
function drawRiderWorm(x, y, s) { // 버터 등에 탄 꿈틀이 (고글 + 빨간 스카프)
  const wv = Math.sin(time * 14) * 4;
  ctx.strokeStyle = '#d62828'; ctx.lineWidth = 4 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x + 2 * s, y - 2 * s); ctx.quadraticCurveTo(x - 14 * s, y - 6 * s + wv, x - 28 * s, y - 2 * s - wv); ctx.stroke();
  for (let i = 4; i >= 0; i--) { ctx.fillStyle = i % 2 ? '#ee8f96' : '#e57f88'; ctx.beginPath(); ctx.arc(x - i * 6 * s, y + i * 1.5 * s, (7 - i * 0.6) * s, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#ee8f96'; ctx.beginPath(); ctx.arc(x + 4 * s, y - 8 * s, 8 * s, 0, 7); ctx.fill();
  ctx.fillStyle = '#6d4c41'; ctx.fillRect(x - 5 * s, y - 12 * s, 18 * s, 3 * s);
  for (const ox of [1, 9]) { ctx.fillStyle = '#90caf9'; ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.arc(x + ox * s, y - 10 * s, 3.6 * s, 0, 7); ctx.fill(); ctx.stroke(); }
}
function drawFlyingButter(x, y, w, opts) {
  if (!butterReady) return;
  const h = w * butterImg.height / butterImg.width, f = Math.sin(fl.flapPh);
  ctx.save(); ctx.translate(x, y + f * 4); ctx.rotate(-0.06 + (opts.tilt || 0));
  if (opts.fever) { ctx.fillStyle = `hsla(${(time * 400) % 360},90%,60%,.35)`; ctx.beginPath(); ctx.ellipse(0, 0, w * 0.6, h * 0.6, 0, 0, 7); ctx.fill(); }
  if (opts.shield) { ctx.strokeStyle = 'rgba(150,220,255,.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(0, 0, w * 0.58, h * 0.75, 0, 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(150,220,255,.15)'; ctx.fill(); }
  const shX = -w / 2 + w * 0.55, shY = -h / 2 + h * 0.32, Lw = w * 0.56;
  const angOf = ff => -Math.PI / 2 - 0.25 - (ff + 1) / 2 * 1.95;
  ctx.save(); ctx.translate(shX + 6, shY - 4); drawWing(Lw * 0.92, angOf(Math.sin(fl.flapPh + 0.25)) + 0.12, true, (1 - Math.sin(fl.flapPh + 0.25)) / 2); ctx.restore();
  ctx.drawImage(butterImg, -w / 2, -h / 2, w, h);
  if (opts.mouth) { // 부리를 쩍!
    ctx.fillStyle = '#7a1f2b'; ctx.beginPath(); ctx.moveTo(w * 0.38, -h * 0.2); ctx.lineTo(w * 0.52, -h * 0.13); ctx.lineTo(w * 0.4, -h * 0.03); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f48fb1'; ctx.beginPath(); ctx.arc(w * 0.42, -h * 0.1, h * 0.035, 0, 7); ctx.fill();
  }
  drawRiderWorm(-w * 0.02, -h * 0.4, w / 150);
  ctx.save(); ctx.translate(shX, shY); drawWing(Lw, angOf(f), false, (1 - f) / 2); ctx.restore();
  ctx.restore();
}
function uprightEmoji(V, e, x, y, s) { // 세로 화면에서도 이모지가 똑바로 보이게
  if (!V.portrait) { emoji(e, x, y, s); return; }
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 2); emoji(e, 0, 0, s); ctx.restore();
}
function uprightText(V, t, x, y, s, c) {
  ctx.save(); ctx.translate(x, y); if (V.portrait) ctx.rotate(Math.PI / 2);
  ctx.font = s + 'px Jua, ' + EMOJI_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(30,20,10,.8)'; ctx.strokeText(t, 0, 0); ctx.fillStyle = c; ctx.fillText(t, 0, 0); ctx.restore();
}
function renderFlight() {
  const V = flView(), FW = V.FW, s = V.s;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#7ec8f0'; ctx.fillRect(0, 0, vw, vh);
  const sh = reduceMotion ? 0 : shake, ox = (Math.random() - 0.5) * sh, oy = (Math.random() - 0.5) * sh;
  if (V.portrait) ctx.setTransform(0, -dpr * s, dpr * s, 0, ox * dpr, (vh + oy) * dpr);
  else ctx.setTransform(dpr * s, 0, 0, dpr * s, ox * dpr, oy * dpr);
  const p = fl.prog;
  // 하늘: 아침 → 노을
  const sky = ctx.createLinearGradient(0, 0, 0, FH);
  const top = p < 0.6 ? '#5fb7f2' : `hsl(${lerp(205, 25, (p - 0.6) / 0.4)},75%,${lerp(66, 62, (p - 0.6) / 0.4)}%)`;
  const bot = p < 0.6 ? '#cdeefe' : `hsl(${lerp(200, 40, (p - 0.6) / 0.4)},90%,${lerp(90, 80, (p - 0.6) / 0.4)}%)`;
  sky.addColorStop(0, top); sky.addColorStop(1, bot); ctx.fillStyle = sky; ctx.fillRect(-20, -20, FW + 40, FH + 40);
  ctx.fillStyle = 'rgba(255,240,170,.9)'; ctx.beginPath(); ctx.arc(FW * 0.82, 70 + p * 180, 34, 0, 7); ctx.fill();
  for (const c of fl.clouds) if (c.z < 0.5) cloudShape(c.x, c.y, c.s, 0.75);
  // 아래 풍경: 바다 → 해안 → 도착 나라 땅
  if (!V.portrait) {
  const land = fl.phase !== 'fly' || p > 0.7, gy = FH - 52 + (fl.phase === 'arrive' ? -Math.min(1, fl.arriveT / 2) * 70 : 0);
  ctx.fillStyle = land ? rgb(fl.c.dry) : '#2f86c9'; ctx.fillRect(-20, gy, FW + 40, FH - gy + 80);
  ctx.fillStyle = land ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.35)';
  const sc = (fl.t * 120) % 80;
  for (let x = -sc; x < FW + 80; x += 80) { ctx.beginPath(); ctx.ellipse(x, gy + 10, 30, 5, 0, 0, 7); ctx.fill(); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const decoSet = land ? fl.c.deco : ['⛵', '🐋', '🏝️'];
  for (let i = 0; i < 4; i++) { const x = ((i * 430 - fl.t * 120) % (FW + 400) + FW + 400) % (FW + 400) - 100; uprightEmoji(V, decoSet[i % decoSet.length], x, gy + 18, 30); }
  }
  // 번개 구름
  for (const st of fl.storms) {
    if (st.bolt > 0) { ctx.strokeStyle = '#fffde7'; ctx.lineWidth = 7; ctx.beginPath(); let yy = st.y + 30; ctx.moveTo(st.x, yy); while (yy < FH) { yy += 40; ctx.lineTo(st.x + rand(-18, 18), yy); } ctx.stroke(); ctx.fillStyle = 'rgba(255,255,200,.15)'; ctx.fillRect(st.x - 34, st.y, 68, FH); }
    else if (st.zap < 0.8) { ctx.fillStyle = `rgba(255,255,150,${0.15 + 0.15 * Math.sin(time * 40)})`; ctx.fillRect(st.x - 34, st.y, 68, FH); }
    cloudShape(st.x, st.y, 1.3, 1, '#5d6470'); if (st.zap < 0.8 || st.bolt > 0) uprightEmoji(V, '⚡', st.x, st.y + 4, 26);
  }
  // 아이템
  for (const it of fl.items) {
    const iy = it.y + Math.sin(it.ph) * 10;
    if (it.kind === 'gold') { ctx.fillStyle = 'rgba(255,210,63,.5)'; ctx.beginPath(); ctx.arc(it.x, iy, 26, 0, 7); ctx.fill(); }
    if (it.kind === 'shield' || it.kind === 'heart') { ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.arc(it.x, iy, 24, 0, 7); ctx.fill(); }
    uprightEmoji(V, it.kind === 'treat' ? it.tr.e : POWERS[it.kind].e, it.x, iy, 30);
  }
  // 적
  for (const f of fl.foes) drawCrow(f, false);
  if (fl.boss) {
    drawCrow(fl.boss, true);
  }
  for (const b of fl.bullets) { ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.atan2(b.vy, b.vx)); ctx.fillStyle = '#263238'; ctx.beginPath(); ctx.ellipse(0, 0, 13, 4, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.stroke(); ctx.restore(); }
  // 지렁이 똥 탄환
  for (const sh2 of fl.shots) {
    ctx.fillStyle = sh2.rb ? `hsl(${(sh2.x * 2) % 360},85%,55%)` : '#6b4423';
    ctx.beginPath(); ctx.arc(sh2.x, sh2.y, 7, 0, 7); ctx.arc(sh2.x - 5, sh2.y + 3, 5, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sh2.x - 12, sh2.y); ctx.lineTo(sh2.x - 26, sh2.y); ctx.stroke();
  }
  // 버터 + 꿈틀이
  const blink = fl.invul > 0 && Math.floor(time * 14) % 2 === 0;
  if (!blink && fl.phase !== 'dead') drawFlyingButter(fl.x, fl.y, 150, { mouth: fl.mouthT > 0, fever: fl.fever > 0, shield: fl.shield > 0 });
  if (fl.fever > 0 && Math.random() < 0.3) fl.fx.push({ kind: 'note', x: fl.x + 40, y: fl.y - 50, vx: rand(-20, 20), vy: -60, rot: 0, life: 1, c: pick(['♪', '♫']) });
  for (const c of fl.clouds) if (c.z >= 0.5) cloudShape(c.x, c.y, c.s, 0.55);
  // 효과
  for (const e of fl.fx) {
    ctx.globalAlpha = Math.min(1, e.life * 2);
    if (e.kind === 'feather') { ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.rot); ctx.fillStyle = e.c; ctx.beginPath(); ctx.ellipse(0, 0, 7, 2.5, 0, 0, 7); ctx.fill(); ctx.restore(); }
    else if (e.kind === 'confetti') { ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.rot); ctx.fillStyle = e.c; ctx.fillRect(-4, -2, 8, 4); ctx.restore(); }
    else if (e.kind === 'note') uprightText(V, e.c, e.x, e.y, 22, '#fff59d');
    else uprightText(V, e.t, e.x, e.y, e.s, e.c);
  }
  ctx.globalAlpha = 1;
  // --- 화면 고정 HUD ---
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash * 1.6})`; ctx.fillRect(0, 0, vw, vh); }
  const top0 = vw < 600 ? 46 : 10;
  const bw = Math.min(vw - 140, 440), bx = (vw - bw) / 2, by = top0 + 8;
  ctx.fillStyle = 'rgba(0,0,0,.35)'; roundRect(bx - 34, by - 6, bw + 68, 34, 12); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; roundRect(bx, by + 6, bw, 8, 4); ctx.fill();
  ctx.fillStyle = '#ffd23f'; roundRect(bx, by + 6, bw * (fl.phase === 'fly' ? p : 1), 8, 4); ctx.fill();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  emoji(fl.from.flag, bx - 18, by + 10, 18); emoji(fl.c.flag, bx + bw + 18, by + 10, 18); emoji('🐦', bx + bw * (fl.phase === 'fly' ? p : 1), by + 2, 18);
  ctx.font = '13px Jua, sans-serif'; ctx.fillStyle = '#fff';
  const remain = Math.round(fl.km * (1 - (fl.phase === 'fly' ? p : 1)));
  ctx.fillText(fl.phase === 'boss' ? L('👑 까마귀 대장을 물리쳐요!', '👑 Defeat the crow boss!') : L(`${fl.c.name}까지 ${remain.toLocaleString()}km`, `${remain.toLocaleString()}km to ${fl.c.name}`), vw / 2, by + 36);
  ctx.textAlign = 'left'; ctx.font = '18px ' + EMOJI_FONT;
  ctx.fillText('💛'.repeat(Math.max(0, fl.hp)) + '🤍'.repeat(Math.max(0, 3 - fl.hp)), 12, by + 66);
  ctx.font = '20px Jua, sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(score.toLocaleString(), 12, by + 94); ctx.fillStyle = '#fff'; ctx.fillText(score.toLocaleString(), 12, by + 94);
  // 버터 신남 게이지
  const gx = 12, gyy = by + 112, gw = 120;
  ctx.fillStyle = 'rgba(0,0,0,.35)'; roundRect(gx, gyy, gw, 12, 6); ctx.fill();
  ctx.fillStyle = fl.fever > 0 ? `hsl(${(time * 400) % 360},90%,60%)` : '#ffb300'; roundRect(gx, gyy, gw * (fl.fever > 0 ? fl.fever / 7 : fl.gauge / 100), 12, 6); ctx.fill();
  ctx.font = '12px Jua, sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(L('😋 버터 신남', '😋 Butter fever'), gx, gyy + 24);
  const ef = []; if (fl.triple > 0) ef.push('🌾x3 ' + fl.triple.toFixed(0)); if (fl.shield > 0) ef.push('🛡️ ' + fl.shield.toFixed(0)); if (fl.combo > 1 && fl.comboT > 0) ef.push(L('🔥 콤보 x', '🔥 Combo x') + Math.min(5, fl.combo));
  if (ef.length) { ctx.font = '14px Jua, ' + EMOJI_FONT; ctx.fillText(ef.join('  '), gx, gyy + 44); }
  if (fl.boss && fl.phase === 'boss') {
    const hw = Math.min(vw - 40, 360), hx = (vw - hw) / 2, hy = by + 50;
    ctx.fillStyle = 'rgba(0,0,0,.45)'; roundRect(hx, hy, hw, 14, 7); ctx.fill();
    ctx.fillStyle = '#e53935'; roundRect(hx, hy, hw * Math.max(0, fl.boss.hp / fl.boss.max), 14, 7); ctx.fill();
    ctx.textAlign = 'center'; ctx.font = '12px Jua, sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(L('👑 까마귀 대장 까옥이', '👑 Captain Caw'), vw / 2, hy + 7);
  }
  if (fl.phase === 'arrive' && fl.arriveT > 0.8) {
    ctx.textAlign = 'center'; ctx.font = `${Math.min(56, vw / 9)}px Jua, sans-serif`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,.6)';
    const t = L(`${fl.c.flag} ${fl.c.name} 도착!`, `${fl.c.flag} ${fl.c.name}!`); ctx.strokeText(t, vw / 2, vh * 0.42); ctx.fillStyle = '#fff'; ctx.fillText(t, vw / 2, vh * 0.42);
  }
}
function cloudShape(x, y, s, a, col = '#ffffff') {
  ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath();
  ctx.arc(x, y, 30 * s, 0, 7); ctx.arc(x + 32 * s, y - 12 * s, 38 * s, 0, 7); ctx.arc(x + 70 * s, y, 30 * s, 0, 7); ctx.arc(x + 35 * s, y + 10 * s, 32 * s, 0, 7); ctx.fill();
  ctx.globalAlpha = 1;
}
function roundRect(x, y, w, h, r) { ctx.beginPath(); r = Math.min(r, h / 2, Math.max(0, w) / 2); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
