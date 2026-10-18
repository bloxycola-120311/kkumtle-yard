'use strict';
// ---------- 4. 땅(비옥도) ----------
// 마당을 50px 칸으로 나눠 칸마다 0~1의 '비옥도'를 저장. 작은 캔버스에 칠한 뒤 크게 늘려 그리면 부드럽게 번져 보임.
const fert = new Float32Array(GW * GH);
const fcv = document.createElement('canvas'); fcv.width = GW; fcv.height = GH;
const fctx = fcv.getContext('2d'); const fimg = fctx.createImageData(GW, GH);
let fertDirty = true;
const yardCells = [];
for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
  const cx = gx * CELL + CELL / 2, cy = gy * CELL + CELL / 2;
  if (cx > YARD.x0 && cx < YARD.x1 && cy > YARD.y0 && cy < YARD.y1) yardCells.push(gy * GW + gx);
}
const inYardCell = new Uint8Array(GW * GH); yardCells.forEach(i => inYardCell[i] = 1);
let C_DRY = [222, 199, 150], C_RICH = [104, 70, 42], C_LUSH = [70, 96, 44];
function fertColor(t) {
  if (t < 0.6) { const k = t / 0.6; return [lerp(C_DRY[0], C_RICH[0], k), lerp(C_DRY[1], C_RICH[1], k), lerp(C_DRY[2], C_RICH[2], k)]; }
  const k = (t - 0.6) / 0.4; return [lerp(C_RICH[0], C_LUSH[0], k), lerp(C_RICH[1], C_LUSH[1], k), lerp(C_RICH[2], C_LUSH[2], k)];
}
function updateFertImage() {
  const d = fimg.data;
  for (let i = 0; i < GW * GH; i++) {
    const c = inYardCell[i] ? fertColor(fert[i]) : [196, 178, 140];
    d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255;
  }
  fctx.putImageData(fimg, 0, 0); fertDirty = false;
}
function addFert(x, y, r, amount) {
  const gx0 = Math.floor(x / CELL), gy0 = Math.floor(y / CELL), R = Math.ceil(r);
  for (let gy = gy0 - R; gy <= gy0 + R; gy++) for (let gx = gx0 - R; gx <= gx0 + R; gx++) {
    if (gx < 0 || gy < 0 || gx >= GW || gy >= GH) continue;
    const i = gy * GW + gx; if (!inYardCell[i]) continue;
    const d = Math.hypot(gx - gx0, gy - gy0); if (d > r) continue;
    fert[i] = Math.min(1, fert[i] + amount * (1 - d / (r + 1)));
  }
  fertDirty = true;
}
function fertAt(x, y, r = 0) {
  const gx0 = Math.floor(x / CELL), gy0 = Math.floor(y / CELL);
  if (r === 0) { if (gx0 < 0 || gy0 < 0 || gx0 >= GW || gy0 >= GH) return 0; return fert[gy0 * GW + gx0]; }
  let s = 0, n = 0;
  for (let gy = gy0 - r; gy <= gy0 + r; gy++) for (let gx = gx0 - r; gx <= gx0 + r; gx++) {
    if (gx < 0 || gy < 0 || gx >= GW || gy >= GH) continue;
    const i = gy * GW + gx; if (!inYardCell[i]) continue; s += fert[i]; n++;
  }
  return n ? s / n : 0;
}
function fertAvg() { let s = 0; for (const i of yardCells) s += fert[i]; return s / yardCells.length; }
function resetFert() { fert.fill(0); for (const i of yardCells) fert[i] = Math.random() * 0.1; fertDirty = true; }

// 마당 장식(풀 포기, 조약돌) — 비옥도에 따라 풀이 자라고 꽃이 핌
const tufts = [], pebbles = [];
for (let i = 0; i < 320; i++) tufts.push({ x: rand(YARD.x0, YARD.x1), y: rand(YARD.y0, YARD.y1), s: rand(0.7, 1.3), seed: Math.random() });
for (let i = 0; i < 70; i++) pebbles.push({ x: rand(YARD.x0, YARD.x1), y: rand(YARD.y0, YARD.y1), r: rand(3, 8), a: rand(0, 3) });
const FLOWER = ['#f26d7d', '#ffd23f', '#ffffff', '#b07cf2', '#ff9f43'];

// ---------- 5. 과일 식물 ----------
const PLANT_DEFS = {
  apple: { name: '사과나무', fruit: '🍎', max: 10, kind: 'tree', r: 82 },
  peach: { name: '복숭아나무', fruit: '🍑', max: 8, kind: 'tree', r: 74 },
  tomato: { name: '토마토 밭', fruit: '🍅', max: 8, kind: 'bush', r: 50 },
  straw: { name: '딸기 밭', fruit: '🍓', max: 10, kind: 'patch', r: 54 },
  grape: { name: '포도 덩굴', fruit: '🍇', max: 7, kind: 'bush', r: 52 },
  melon: { name: '수박 밭', fruit: '🍉', max: 4, kind: 'patch', r: 58 }
};
const plants = [
  ['apple', 340, 480], ['peach', 2060, 480], ['tomato', 820, 780], ['straw', 1560, 720], ['grape', 1960, 1290],
  ['tomato', 470, 1290], ['straw', 1180, 1140], ['melon', 1240, 430], ['apple', 1700, 1080]
].map(([t, x, y]) => {
  const def = PLANT_DEFS[t], spots = [];
  for (let i = 0; i < def.max; i++) {
    const a = i / def.max * Math.PI * 2 + rand(-0.3, 0.3), rr = def.r * (def.kind === 'tree' ? rand(0.35, 0.8) : rand(0.3, 0.75));
    spots.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr * 0.8 - (def.kind === 'tree' ? 40 : 0) });
  }
  return { t, x, y, def, spots, shown: 0 };
});
let totalFruits = 0;
function updatePlants(silent) {
  totalFruits = 0;
  for (const p of plants) {
    const local = clamp((fertAt(p.x, p.y, 3) - 0.12) / 0.75, 0, 1);
    const n = Math.round(local * p.def.max * (1 - (p.wither || 0)));
    if (n > p.shown && !silent) { floatText(p.x, p.y - 70, '+' + p.def.fruit, '#fff', 26); SFX.fruit(); burst(p.x, p.y - 40, 8, ['#ffd23f', '#fff']); }
    p.shown = n; totalFruits += n;
  }
}

// ---------- 6. 지렁이 ----------
const worm = { x: 0, y: 0, ang: 0, len: 10, trail: [], segs: [], invul: 0, boost: 0, dive: 0, superT: 0, castT: 0, stun: 0 };
function resetWorm() {
  Object.assign(worm, { x: W / 2, y: H / 2 + 100, ang: -Math.PI / 2, len: 10, trail: [], segs: [], invul: 0, boost: 0, dive: 0, superT: 0, castT: 0, stun: 0 });
  for (let i = 0; i < 200; i++) worm.trail.push({ x: worm.x, y: worm.y + i * 2 });
}
function buildSegs() {
  const segs = [{ x: worm.x, y: worm.y }]; let acc = 0, need = SEG_GAP;
  const tr = worm.trail;
  for (let i = 1; i < tr.length && segs.length < worm.len; i++) {
    const d = dist(tr[i - 1].x, tr[i - 1].y, tr[i].x, tr[i].y); acc += d;
    while (acc >= need && segs.length < worm.len) { segs.push({ x: tr[i].x, y: tr[i].y }); need += SEG_GAP; }
  }
  // 흔적 길이 정리
  let total = 0, cut = tr.length;
  for (let i = 1; i < tr.length; i++) { total += dist(tr[i - 1].x, tr[i - 1].y, tr[i].x, tr[i].y); if (total > worm.len * SEG_GAP + 60) { cut = i; break; } }
  tr.length = cut;
  worm.segs = segs;
}

// ---------- 7. 입력(키보드 / 마우스 / 터치) ----------
const keys = {};
const pointer = { active: false, x: 0, y: 0, mouse: false };
addEventListener('keydown', e => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return; // 이름 입력 중엔 게임 키 무시
  keys[e.code] = true;
  if (state === 'play') {
    if (e.code === 'Digit1') useItem('speed');
    if (e.code === 'Digit2') useItem('dive');
    if (e.code === 'Digit3' || e.code === 'Space') useItem('super');
    if (e.code === 'KeyP' || e.code === 'Escape') setPause(true);
  } else if ((state === 'flight' || state === 'burrow') && (e.code === 'KeyP' || e.code === 'Escape')) setPause(true);
  else if (state === 'pause' && (e.code === 'KeyP' || e.code === 'Escape')) setPause(false);
  if (e.code === 'KeyM') toggleMute();
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
});
addEventListener('keyup', e => { keys[e.code] = false; });
// 가상 조이스틱 (휴대폰): 화면 아무 데나 엄지를 대고 밀면 그 방향으로 감 → 손가락이 지렁이를 가리지 않음
const JOY_R = 56, joy = { id: null, ox: 0, oy: 0, x: 0, y: 0, vx: 0, vy: 0 };
const joyMode = () => (mode === 'yard' && state === 'play') || (mode === 'flight' && fl.on && state === 'flight');
function joyShow() {
  const el = $('joy'); if (!el) return;
  const on = joy.id !== null;
  el.classList.toggle('on', on);
  if (on) { el.style.left = joy.ox + 'px'; el.style.top = joy.oy + 'px'; el.style.bottom = el.style.right = ''; }
  else { el.style.left = el.style.top = ''; }
  $('joyKnob').style.transform = `translate(${joy.vx * JOY_R}px,${joy.vy * JOY_R}px)`;
}
function joyMove(x, y) {
  let dx = x - joy.ox, dy = y - joy.oy; const d = Math.hypot(dx, dy);
  if (d > JOY_R) { dx *= JOY_R / d; dy *= JOY_R / d; }
  joy.vx = dx / JOY_R; joy.vy = dy / JOY_R; joyShow();
}
function joyEnd(e) { if (joy.id !== null && (!e || e.pointerId === joy.id)) { joy.id = null; joy.vx = joy.vy = 0; joyShow(); } }
cv.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'mouse' && joyMode() && joy.id === null) {
    initAudio(); joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY; joy.vx = joy.vy = 0; joyShow();
    try { cv.setPointerCapture(e.pointerId); } catch (_) {} e.stopImmediatePropagation(); return;
  }
}, true);
cv.addEventListener('pointermove', e => { if (e.pointerId === joy.id) { joyMove(e.clientX, e.clientY); e.stopImmediatePropagation(); } }, true);
['pointerup', 'pointercancel'].forEach(ev => cv.addEventListener(ev, e => { if (e.pointerId === joy.id) { joyEnd(e); e.stopImmediatePropagation(); } }, true));
cv.addEventListener('pointerdown', e => { initAudio(); pointer.active = true; pointer.mouse = e.pointerType === 'mouse'; pointer.x = e.clientX; pointer.y = e.clientY; try { cv.setPointerCapture(e.pointerId); } catch (_) {} });
cv.addEventListener('pointermove', e => { if (mode === 'flight' && fl.on && (e.pointerType !== 'mouse' || (e.buttons & 1))) { fl.dragX += e.clientX - pointer.x; fl.dragY += e.clientY - pointer.y; } pointer.x = e.clientX; pointer.y = e.clientY; if (e.pointerType === 'mouse') { pointer.mouse = true; pointer.active = true; } });
cv.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') pointer.active = false; });
cv.addEventListener('pointercancel', () => { pointer.active = false; });
cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') pointer.active = false; });

// ---------- 8. 영양분 & 아이템 ----------
const NUTRIENTS = [
  { id: 'leaf', name: '낙엽', emoji: '🍂', w: 36, pts: 10, fert: 0.4 },
  { id: 'coffee', name: '커피 찌꺼기', emoji: '☕', w: 18, pts: 15, fert: 0.5 },
  { id: 'egg', name: '달걀 껍질', emoji: '🥚', w: 18, pts: 15, fert: 0.5 },
  { id: 'banana', name: '바나나 껍질', emoji: '🍌', w: 16, pts: 20, fert: 0.55 },
  { id: 'carrot', name: '당근 꼭지', emoji: '🥕', w: 12, pts: 25, fert: 0.6 }
];
const NUT_BY_ID = Object.fromEntries(NUTRIENTS.map(n => [n.id, n]));
function pickNutrientType() {
  const tot = NUTRIENTS.reduce((s, n) => s + n.w, 0); let r = Math.random() * tot;
  for (const n of NUTRIENTS) { r -= n.w; if (r <= 0) return n; } return NUTRIENTS[0];
}
const ITEMS = {
  speed: { emoji: '⚡', name: '스피드 업 패키지', w: 50 },
  dive: { emoji: '🌀', name: '땅굴 숨기', w: 34 },
  super: { emoji: '⭐', name: '슈퍼 꿈틀이 캡슐', w: 16 }
};
let nutrients = [], mapItems = [], castings = [];
const inv = { speed: 0, dive: 0, super: 0 };
function randomSpot(avoidR = 160) {
  let best = null, bf = 9;
  for (let k = 0; k < 5; k++) {
    const x = rand(YARD.x0 + 30, YARD.x1 - 30), y = rand(YARD.y0 + 30, YARD.y1 - 30);
    if (dist(x, y, worm.x, worm.y) < avoidR) continue;
    const f = fertAt(x, y, 1) + Math.random() * 0.15; // 메마른 곳에 더 잘 생김
    if (f < bf) { bf = f; best = { x, y }; }
  }
  return best || { x: rand(YARD.x0 + 30, YARD.x1 - 30), y: rand(YARD.y0 + 30, YARD.y1 - 30) };
}
function spawnNutrient(type) { const s = randomSpot(); nutrients.push({ ...s, type: type || pickNutrientType(), ph: Math.random() * 6, born: 0 }); }
function spawnItem(kind) {
  if (!kind) { const tot = Object.values(ITEMS).reduce((s, v) => s + v.w, 0); let r = Math.random() * tot; for (const k in ITEMS) { r -= ITEMS[k].w; if (r <= 0) { kind = k; break; } } }
  const s = randomSpot(220); mapItems.push({ ...s, kind: kind || 'speed', ph: Math.random() * 6, life: 30 });
}

// ---------- 9. 효과(파티클, 떠오르는 글씨, 배너) ----------
let particles = [], texts = [], shake = 0, flash = 0, hitStop = 0, slapFx = null;
function burst(x, y, n, colors, spd = 160) {
  for (let i = 0; i < n && particles.length < 500; i++) {
    const a = Math.random() * Math.PI * 2, s = rand(spd * 0.3, spd);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.4, 0.9), max: 0.9, c: pick(colors), r: rand(2, 5) });
  }
}
function floatText(x, y, t, c = '#fff', s = 22) { texts.push({ x, y, t, c, s, life: 1.2 }); }
let bannerTimer = 0;
function banner(msg, dur = 2.2, alert = false) {
  const b = $('banner'); b.textContent = msg; b.className = 'show' + (alert ? ' alert' : ''); bannerTimer = dur;
}
