'use strict';
// ---------- 19. 두더지 굴 (지하 러너, Geometry Dash 스타일) ----------
// 두더지를 끝까지 따돌리면 굴 입구(🕳️)가 15초 동안 남음 → 들어가면 지하 러너 시작.
// 꿈틀이는 저절로 달리고, 탭(스페이스/↑)으로 점프. 꾹 누르면 더 높이, 누르고 있으면 착지하자마자 또 점프.
// 장애물은 음악 박자(140bpm) 간격에 맞춰 놓여 있어서 리듬을 타며 넘으면 됨. 같은 레벨은 매번 같은 지형(연습하면 늘음).

let hole = null; // 마당의 굴 입구 { x, y, t }
function spawnHole(x, y) {
  if (mode !== 'yard') return;
  hole = { x, y, t: 15 };
  banner(L('🕳️ 두더지가 굴로 도망쳤어요! 15초 안에 굴로 들어가 보세요!', '🕳️ The mole ran into its tunnel! Crawl in within 15 seconds!'), 3);
}
function updateHole(dt) {
  if (!hole) return;
  hole.t -= dt;
  if (hole.t <= 0) { hole = null; return; }
  if (dist(worm.x, worm.y, hole.x, hole.y) < 42 && worm.dive <= 0) startBurrow();
}
function drawHole() {
  if (!hole) return;
  const pulse = 1 + Math.sin(time * 6) * 0.06;
  ctx.fillStyle = '#7a5532'; ctx.beginPath(); ctx.ellipse(hole.x, hole.y, 46 * pulse, 30 * pulse, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#140b05'; ctx.beginPath(); ctx.ellipse(hole.x, hole.y + 2, 32, 20, 0, 0, 7); ctx.fill();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '18px Jua, sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.fillStyle = '#ffe082';
  const t = `🕳️ ${Math.ceil(hole.t)}`; ctx.strokeText(t, hole.x, hole.y - 46 - Math.abs(Math.sin(time * 5)) * 6); ctx.fillText(t, hole.x, hole.y - 46 - Math.abs(Math.sin(time * 5)) * 6);
}

// ---- 지하 러너 ----
// 논리 화면: 높이 540. 바닥은 440 고정, 천장 높이는 구간마다 넓어졌다(60) 좁아졌다(250) 함.
const BH = 540, FLOOR = 440, CEIL = 120, PX = 210, PR = 17;
const BPM_B = 140, JUMP_V = 820, GRAV = 2600;
const CEIL_TYPES = { wide: 60, normal: 120, low: 190, narrow: 250 };
const br = { on: false };
function seeded(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// 장애물 패턴 (4박자짜리). d=난이도, low=천장이 낮아도 가능, lowOnly=낮은 천장 전용
// 위치는 박자 단위(b). 한 패턴의 장애물은 0.6~2.9박 사이에만 둬서 패턴끼리 겹치지 않게 함.
const PATTERNS = [
  { d: 0, low: true, f: (p, o) => { o.spike(p(1.5)); } },
  { d: 0, low: true, f: (p, o) => { o.block(p(1.2), p.B, 50); o.gem(p(1.7), FLOOR - 50 - 40); } },
  { d: 0, low: true, f: (p, o) => { o.spike(p(1.6)); o.gem(p(1.3), FLOOR - 95); o.gem(p(1.7), FLOOR - 120); o.gem(p(2.1), FLOOR - 95); } },
  { d: 1, low: true, f: (p, o) => { o.spike(p(1.4)); o.spike(p(1.4) + 34); } },
  { d: 1, low: false, f: (p, o) => { o.pit(p(1.2), p.B * 0.9); o.gem(p(1.65), FLOOR - 120); } },
  { d: 1, low: true, f: (p, o) => { o.rock(p(2.0)); } },
  { d: 1, low: true, f: (p, o) => { o.root(p(1.5)); o.fossil(p(1.8), FLOOR - 28); } },
  { d: 1, low: true, f: (p, o) => { o.spike(p(0.8)); o.spike(p(2.4)); } },
  { d: 2, low: true, f: (p, o) => { o.spike(p(1.2)); o.spike(p(1.2) + 34); o.spike(p(1.2) + 68); } },
  { d: 2, low: false, f: (p, o) => { o.block(p(0.8), p.B, 55); o.block(p(1.8), p.B * 1.1, 110); o.gem(p(2.3), FLOOR - 160); } },
  { d: 2, low: false, f: (p, o) => { o.pad(p(0.9)); o.block(p(1.9), p.B * 0.6, 175); o.gem(p(2.2), FLOOR - 250); } },
  { d: 2, low: false, f: (p, o) => { o.pit(p(0.8), p.B); o.spike(p(2.6)); } },
  { d: 2, low: true, f: (p, o) => { o.stal(p(1.8)); } },
  { d: 2, lowOnly: true, f: (p, o) => { o.cspike(p(0.8)); o.cspike(p(0.8) + 34); o.cspike(p(0.8) + 68); o.spike(p(2.5)); } },
  { d: 2, low: true, f: (p, o) => { o.spike(p(0.7)); o.spike(p(0.7) + 34); o.root(p(2.4)); } },
  { d: 3, low: true, f: (p, o) => { o.rock(p(1.2)); o.spike(p(2.6)); } },
  { d: 3, low: true, f: (p, o) => { o.stal(p(0.9)); o.stal(p(2.5)); } },
  { d: 3, low: false, f: (p, o) => { o.block(p(0.7), p.B * 0.6, 70); o.spike(p(1.55)); o.block(p(2.2), p.B * 0.6, 70); o.gem(p(1.7), FLOOR - 170); } },
  { d: 3, low: true, f: (p, o) => { o.spike(p(0.6)); o.spike(p(0.6) + 34); o.spike(p(0.6) + 68); o.spike(p(2.4)); o.spike(p(2.4) + 34); } },
  { d: 3, lowOnly: true, f: (p, o) => { o.cspike(p(0.7)); o.cspike(p(0.7) + 34); o.spike(p(1.9)); o.cspike(p(2.6)); o.cspike(p(2.6) + 34); } }
];
// 8박자짜리 특별 구간 (천장은 보통 높이)
const SPECIALS = [
  { d: 3, f: (p, o) => { o.portal(p(0.5)); o.cspike(p(2.4), true); o.cspike(p(2.4) + 34, true); o.block(p(4.0), p.B, 60, true); o.cspike(p(5.6), true); o.gem(p(4.5), CEIL + 110); o.portal(p(7.0)); } },
  { d: 3, f: (p, o) => { o.pit(p(0.6), p.B * 4.2); for (const b of [1.5, 2.7, 3.9]) { o.block(p(b), p.B * 0.6, 30); o.gem(p(b + 0.3), FLOOR - 90); } o.spike(p(6.2)); } },
  { d: 3, f: (p, o) => { for (const b of [0.8, 2.3, 3.8, 6.8]) o.spike(p(b)); o.spike(p(5.3)); o.spike(p(5.3) + 34); } },
  { d: 4, f: (p, o) => { o.pad(p(0.8)); o.block(p(1.8), p.B * 0.5, 175); o.pad(p(3.6)); o.block(p(4.6), p.B * 0.5, 175); o.spike(p(6.4)); o.spike(p(6.4) + 34); } },
  { d: 4, f: (p, o) => { o.portal(p(0.5)); o.cspike(p(2.5), true); o.portal(p(3.8)); o.spike(p(5.4)); o.spike(p(5.4) + 34); o.stal(p(6.9)); } }
];
function buildLevel(lv) {
  const rnd = seeded(1000 + lv * 77), B = br.v * 60 / BPM_B, objs = [], cps = [], ceil = [];
  let x = PX + 5 * B; cps.push(PX); ceil.push({ x0: -1e9, y: CEIL });
  const o = {
    spike: x => objs.push({ k: 'spike', x, w: 34 }),
    cspike: (x, base) => objs.push({ k: 'cspike', x, w: 34, base: !!base }),
    block: (x, w, h, ceilB) => objs.push({ k: 'block', x, w, h, ceil: !!ceilB }),
    pit: (x, w) => objs.push({ k: 'pit', x, w }),
    rock: meet => objs.push({ k: 'rock', x: meet + 160 * (1000 - PX) / (br.v + 160), r: 26 }),
    root: x => objs.push({ k: 'root', x, w: 40 }),
    pad: x => objs.push({ k: 'pad', x, w: 40 }),
    portal: x => objs.push({ k: 'portal', x, w: 30 }),
    stal: x => objs.push({ k: 'stal', x, w: 28, st: 'hang', fy: 0, vy: 0, t: 0 }),
    gem: (x, y) => objs.push({ k: 'gem', x, y }),
    fossil: (x, y) => objs.push({ k: 'fossil', x, y })
  };
  const n = 14 + Math.min(6, lv), maxD = Math.min(4, 3 + Math.floor((lv - 1) / 2));
  for (let i = 0; i < n; i++) {
    const d = Math.min(maxD, Math.floor(i / 2) + (lv >= 3 ? 1 : 0));
    const p = b => x + b * B; p.B = B;
    if (d >= 3 && rnd() < 0.3) {
      ceil.push({ x0: x, y: CEIL });
      const pool = SPECIALS.filter(sp => sp.d <= d);
      pool[Math.floor(rnd() * pool.length)].f(p, o);
    } else {
      const r = rnd(), ct = i < 1 ? 'normal' : r < 0.35 ? 'normal' : r < 0.55 ? 'wide' : r < 0.8 ? 'low' : 'narrow';
      const lowCeil = ct === 'low' || ct === 'narrow';
      ceil.push({ x0: x, y: CEIL_TYPES[ct] });
      for (const half of [0, 4]) {
        const q = b => x + (b + half) * B; q.B = B;
        const pool = PATTERNS.filter(pt => pt.d <= d && pt.d >= d - 1 && (lowCeil ? (pt.low || pt.lowOnly) : !pt.lowOnly));
        pool[Math.floor(rnd() * pool.length)].f(q, o);
      }
    }
    x += 8 * B;
    if (i % DIFF.cpEvery === DIFF.cpEvery - 1 && i < n - 1) { objs.push({ k: 'flag', x: x - B * 0.5 }); cps.push(x - B * 0.5); }
  }
  ceil.push({ x0: x, y: CEIL });
  objs.sort((a, b) => a.x - b.x);
  return { objs: objs.filter(q => q.k !== 'rock'), rocks: objs.filter(q => q.k === 'rock'), cps, ceil, end: x + 2 * B, B };
}
// 천장 높이: 구간이 바뀌는 곳은 0.8박 동안 비탈로 이어짐 (벽에 부딪혀 죽는 일은 없음)
function ceilAt(x) {
  const c = br.ceil; let i = 0;
  while (i < c.length - 1 && c[i + 1].x0 <= x) i++;
  const ramp = br.B * 0.8, prev = i > 0 ? c[i - 1].y : c[i].y, k = clamp((x - c[i].x0) / ramp, 0, 1);
  return lerp(prev, c[i].y, k * k * (3 - 2 * k));
}
function startBurrow() {
  const h = hole; hole = null;
  br.v = Math.max(280, Math.min(470, 360 + (level - 1) * 15 + DIFF.burrowV));
  const L0 = buildLevel(level);
  Object.assign(br, { on: true, hx: h.x, hy: h.y, ...L0, cam: 0, cp: 0, y: FLOOR - PR, vy: 0, g: 1, onGround: true, holdT: 0, rot: 0,
    dead: 0, attempts: 1, gems: 0, fossils: 0, fx: [], done: false, shown: false, t: 0, finishT: 0, beatPh: 0, lastPortal: -1, amb: [] });
  for (const q of br.objs) if (q.k === 'cspike') q.cy = q.base ? CEIL : ceilAt(q.x + 17);
  br.stals = br.objs.filter(q => q.k === 'stal');
  // 벽 속 친구들: 다른 지렁이, 개미, 딱정벌레, 거미, 반딧불이(빛벌레)
  const rnd = seeded(31 + level);
  for (let i = 0; i < 70; i++) {
    const k = ['worm', 'worm', 'ant', 'beetle', 'spider', 'glow', 'glow'][Math.floor(rnd() * 7)];
    br.amb.push({ k, x: rnd() * (br.end + 600), top: rnd() < 0.5, y: rnd(), sp: (rnd() - 0.5) * 40, ph: rnd() * 6 });
  }
  mode = 'burrow'; state = 'burrow'; jumpHeld = false;
  ['hudL', 'hudR', 'items'].forEach(id => $(id).hidden = true);
  $('flyUI').hidden = false; $('btnFire').hidden = true;
  stats.burrows = (stats.burrows || 0) + 1;
  banner(L('🕳️ 두더지 굴 탐험! 탭해서 점프 (꾹 누르면 더 높이)', '🕳️ Mole tunnel run! Tap to jump (hold to jump higher)'), 3);
  SFX.dive(); last_t = performance.now(); updateLives(false);
}
let jumpHeld = false;
function brDie() {
  if (br.dead > 0 || br.done) return;
  br.dead = 1.1; shake = 14; SFX.hurt(); flash = 0.2;
  for (let i = 0; i < 26; i++) { const a = Math.random() * 6.28, s = rand(80, 360); br.fx.push({ x: br.cam + PX, y: br.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.5, 1), c: pick(['#ee8f96', '#8a6440', '#5a3d24']), r: rand(3, 6) }); }
  const alive = loseLife();
  br.fx.push({ k: 'text', x: br.cam + PX, y: br.y - 50, t: alive ? L(`앗! 남은 꿈틀이 ${lives}`, `Oops! ${lives} Wiggles left`) : L('으앙…', 'Noooo…'), life: 1.2, c: '#ffd0d0' });
  if (!alive) { state = 'dying'; setTimeout(() => { $('flyUI').hidden = true; gameOver(); }, 1100); }
}
function brRespawn() {
  br.attempts++; br.cam = br.cps[br.cp] - PX; br.y = FLOOR - PR; br.vy = 0; br.g = 1; br.onGround = true; br.rot = 0; br.lastPortal = br.cps[br.cp];
  for (const q of br.objs) if (q.k === 'stal') Object.assign(q, { st: 'hang', fy: 0, vy: 0, t: 0 });
  br.fx.push({ k: 'text', x: br.cam + PX + 160, y: br.y - 60, t: L(`${br.attempts}번째 도전!`, `Attempt ${br.attempts}!`), life: 1.2, c: '#fff59d' });
}
function brSurfaces(px) { // 발밑 바닥 높이(floor)와 머리 위 천장 높이(ceil)
  let pit = false, floor = FLOOR, ceil = ceilAt(px);
  for (const o of br.objs) {
    if (o.x > px + 60) break;
    if (o.k === 'pit' && px > o.x + 6 && px < o.x + o.w - 6) pit = true;
  }
  if (pit) floor = 9999;
  for (const o of br.objs) {
    if (o.x > px + 60) break;
    if (o.k === 'block' && px + PR - 4 > o.x && px - PR + 4 < o.x + o.w) {
      if (!o.ceil) floor = Math.min(floor, FLOOR - o.h); else ceil = Math.max(ceil, CEIL + o.h);
    }
  }
  return { floor, ceil };
}
function updateBurrow(dt) {
  time += dt; br.t += dt;
  br.beatPh = (br.t * BPM_B / 60) % 1;
  for (const e of br.fx) { e.life -= dt; if (e.k === 'text') e.y -= 30 * dt; else { e.x += e.vx * dt; e.y += e.vy * dt; e.vy += 500 * dt; } }
  br.fx = br.fx.filter(e => e.life > 0);
  for (const a of br.amb) a.x += a.sp * dt;
  shake = Math.max(0, shake - dt * 30); flash = Math.max(0, flash - dt);
  if (br.dead > 0) { br.dead -= dt; if (br.dead <= 0 && lives > 0 && state === 'burrow') brRespawn(); return; }
  if (br.done) { br.finishT += dt; br.cam += br.v * dt * Math.max(0, 1 - br.finishT); if (br.finishT > 1.6 && !br.shown) { br.shown = true; showBurrowReward(); } return; }
  const px0 = br.cam + PX;
  br.cam += br.v * dt; const px = br.cam + PX;
  const g = br.g, holding = jumpHeld || keys.Space || keys.ArrowUp || keys.KeyW;
  if (holding && br.onGround) { br.vy = -JUMP_V * g; br.onGround = false; br.holdT = 0; tone(520, 0.08, 'square', 0.04, 820); }
  br.holdT += dt;
  const rising = br.vy * g < 0, gm = holding && rising && br.holdT < 0.25 ? 0.5 : 1;
  br.vy += GRAV * g * gm * dt; br.vy = clamp(br.vy, -1600, 1600);
  const prevY = br.y; br.y += br.vy * dt;
  const S = brSurfaces(px);
  if (g > 0) { // 보통 중력: 바닥에 서고, 천장엔 머리 콩
    if (br.y + PR >= S.floor && prevY + PR <= S.floor + 14 && br.vy >= 0) { br.y = S.floor - PR; br.vy = 0; br.onGround = true; }
    else if (br.y + PR < S.floor - 1) br.onGround = false;
    if (br.y - PR < S.ceil) { br.y = S.ceil + PR; br.vy = Math.max(0, br.vy); }
    if (br.y > BH + 60) { brDie(); return; }
  } else { // 뒤집힌 중력: 천장에 서고, 바닥엔 머리 콩
    if (br.y - PR <= S.ceil && prevY - PR >= S.ceil - 14 && br.vy <= 0) { br.y = S.ceil + PR; br.vy = 0; br.onGround = true; }
    else if (br.y - PR > S.ceil + 1) br.onGround = false;
    if (br.y + PR > FLOOR) { br.y = FLOOR - PR; br.vy = Math.min(0, br.vy); }
  }
  br.rot = br.onGround ? Math.round(br.rot / (Math.PI / 2)) * (Math.PI / 2) : br.rot + dt * 7 * g;
  for (const o of br.rocks) { // 굴러오는 바위
    o.rx = o.x - 160 * Math.max(0, (br.cam - (o.x - 1000)) / br.v);
    if (Math.abs(o.rx - px) < 80 && dist(o.rx, FLOOR - o.r, px, br.y) < o.r + PR - 6) { brDie(); return; }
  }
  for (const o of br.stals) {
    { // 종유석: 가까이 가면 흔들리다 떨어져서 바닥에 꽂힘
      const top = ceilAt(o.x + 14);
      if (o.st === 'hang' && o.x - px < 430) { o.st = 'shake'; o.t = 0.3; }
      else if (o.st === 'shake') { o.t -= dt; if (o.t <= 0) { o.st = 'fall'; o.vy = 0; } }
      else if (o.st === 'fall') { o.vy += 2600 * dt; o.fy += o.vy * dt; if (top + o.fy + 48 >= FLOOR) { o.fy = FLOOR - 48 - top; o.st = 'stuck'; shake = Math.max(shake, 5); tone(160, 0.15, 'triangle', 0.08, 80); } }
      const y0 = top + o.fy, y1 = y0 + 48;
      if (px + PR - 6 > o.x + 4 && px - PR + 6 < o.x + o.w - 4 && br.y + PR - 6 > y0 + (o.st === 'stuck' ? 10 : 0) && br.y - PR + 6 < y1) { brDie(); return; }
    }
  }
  for (const o of br.objs) {
    if (o.x > px + 80) break;
    if (o.k === 'stal') continue;
    if (o.x + (o.w || 0) < px - 60) continue;
    if (o.k === 'spike') {
      if (px + PR - 8 > o.x + 6 && px - PR + 8 < o.x + o.w - 6 && br.y + PR - 6 > FLOOR - 36) { brDie(); return; }
    } else if (o.k === 'cspike') {
      if (px + PR - 8 > o.x + 6 && px - PR + 8 < o.x + o.w - 6 && br.y - PR + 6 < o.cy + 36) { brDie(); return; }
    } else if (o.k === 'block') {
      const y0 = o.ceil ? CEIL : FLOOR - o.h, y1 = o.ceil ? CEIL + o.h : FLOOR;
      if (px + PR - 3 > o.x && px - PR + 3 < o.x + o.w && br.y + PR - 10 > y0 && br.y - PR + 10 < y1) { brDie(); return; }
    } else if (o.k === 'root') {
      if (px + PR - 6 > o.x && px - PR + 6 < o.x + o.w && br.y - PR < FLOOR - 72) { brDie(); return; }
    } else if (o.k === 'pad') {
      if (o.used !== br.attempts && Math.abs(px - (o.x + o.w / 2)) < 26 && br.onGround && g > 0) { o.used = br.attempts; br.vy = -1250; br.onGround = false; br.holdT = 1; tone(300, 0.25, 'sine', 0.1, 900); }
    } else if (o.k === 'portal') {
      if (px0 < o.x && px >= o.x && br.lastPortal !== o.x) { br.lastPortal = o.x; br.g = -br.g; br.vy *= 0.3; br.onGround = false; tone(400, 0.3, 'triangle', 0.08, br.g > 0 ? 200 : 900); br.fx.push({ k: 'text', x: px + 120, y: BH / 2, t: L('중력 뒤집기!', 'Gravity flip!'), life: 0.8, c: '#b39ddb' }); }
    } else if ((o.k === 'gem' || o.k === 'fossil') && o.got !== true) {
      if (dist(o.x, o.y, px, br.y) < 34) { o.got = true; if (o.k === 'gem') { br.gems++; addScore(50); } else { br.fossils++; addScore(150); } tone(1200, 0.08, 'triangle', 0.07, 1800); br.fx.push({ k: 'text', x: o.x, y: o.y - 20, t: o.k === 'gem' ? '💎 +50' : '🦴 +150', life: 0.8, c: '#fff' }); }
    } else if (o.k === 'flag') {
      const ci = br.cps.indexOf(o.x);
      if (px >= o.x && ci > br.cp) { br.cp = ci; br.fx.push({ k: 'text', x: o.x + 100, y: FLOOR - 120, t: L('🚩 체크포인트!', '🚩 Checkpoint!'), life: 1.2, c: '#a5d6a7' }); SFX.item(); }
    }
  }
  if (px >= br.end) { br.done = true; br.finishT = 0; SFX.award(); }
}

function showBurrowReward() {
  stats.burrowsDone = (stats.burrowsDone || 0) + 1; offerQuiz('chem'); prof.burrowDone++; saveProf();
  state = 'award';
  const got = [];
  for (const k of ['speed', 'dive', 'super']) if (inv[k] < 3) { inv[k]++; got.push(ITEMS[k].emoji); }
  const bonus = 1500 + br.gems * 50; addScore(bonus);
  $('certCard').innerHTML = `
    <div class="medal">🧰</div>
    <div class="name">${L('두더지의 비밀 창고 발견!', 'You found the mole\'s secret stash!')}</div>
    <p>${L(`두더지가 숨겨 둔 아이템을 찾았어요: <b>${got.join(' ') || '가방이 꽉 찼어요'}</b><br>💎 ${br.gems}개 · 🦴 ${br.fossils}개 · 도전 ${br.attempts}번 · 보너스 +${bonus.toLocaleString()}`, `You found the items the mole hid: <b>${got.join(' ') || 'your bag is full'}</b><br>💎 ${br.gems} · 🦴 ${br.fossils} · ${br.attempts} attempts · Bonus +${bonus.toLocaleString()}`)}</p>
    <button class="big" id="btnSurface">${L('🪱 땅 위로 뿅!', '🪱 Pop back up!')}</button>`;
  $('award').hidden = false; $('flyUI').hidden = true;
  $('btnSurface').onclick = () => { $('award').hidden = true; endBurrow(); };
  $('btnSurface').focus();
}
function endBurrow() {
  br.on = false; mode = 'yard'; state = 'play'; $('btnFire').hidden = false;
  worm.x = br.hx; worm.y = br.hy; worm.trail = []; for (let i = 0; i < 120; i++) worm.trail.push({ x: worm.x, y: worm.y + i * 2 });
  worm.invul = 2;
  addFert(br.hx, br.hy, 6, 0.6); burst(br.hx, br.hy, 40, ['#8a6440', '#9be15d', '#ffd23f'], 300); shake = 10;
  ['hudL', 'hudR', 'items'].forEach(id => $(id).hidden = false);
  banner(L('뿅! 굴에서 나오자 주변 흙이 확 살아났어요!', 'Pop! The soil around the tunnel came alive!'), 2.6);
  hudDirty = true; last_t = performance.now();
}

// ---- 지하 그리기 ----
function brView() {
  const s = Math.min(vw / 720, vh / BH);
  return { s, BW: vw / s, oy: (vh - BH * s) / 2 };
}
function drawAmbient(a, cam, BW) { // 벽 속 생물들
  const x = a.x - cam; if (x < -40 || x > BW + 40) return;
  const ct = ceilAt(a.x);
  const y = a.top ? 12 + a.y * Math.max(10, ct - 30) : FLOOR + 16 + a.y * (BH - FLOOR - 26);
  ctx.globalAlpha = 0.85;
  if (a.k === 'worm') { // 벽을 기어가는 다른 지렁이
    const dir = a.sp >= 0 ? 1 : -1;
    for (let i = 4; i >= 0; i--) { ctx.fillStyle = i % 2 ? '#e7949a' : '#d97f87'; ctx.beginPath(); ctx.arc(x - dir * i * 5, y + Math.sin(time * 6 + a.ph + i) * 2, 4.5 - i * 0.3, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(x + dir * 2, y - 1, 1, 0, 7); ctx.fill();
  } else if (a.k === 'ant') {
    for (let i = 0; i < 4; i++) { const ax = x + i * 12 + Math.sin(time * 9 + i) * 1.5; ctx.fillStyle = '#2b1a12'; ctx.beginPath(); ctx.arc(ax, y, 2.4, 0, 7); ctx.arc(ax + 3.5, y, 2, 0, 7); ctx.arc(ax - 3, y, 2.2, 0, 7); ctx.fill(); }
  } else if (a.k === 'beetle') { emoji('🪲', x, y, 16); }
  else if (a.k === 'spider') { // 천장에서 실을 타고 내려오는 거미
    const sy = Math.max(6, ct - 4) + 30 + Math.sin(time * 1.5 + a.ph) * 22;
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, Math.max(0, ct - 2)); ctx.lineTo(x, sy); ctx.stroke();
    emoji('🕷️', x, sy + 6, 18);
  } else if (a.k === 'glow') { // 빛벌레
    const b = 0.5 + 0.5 * Math.sin(time * 3 + a.ph);
    ctx.fillStyle = `rgba(140,255,220,${0.35 + b * 0.5})`; ctx.beginPath(); ctx.arc(x, y, 2.5 + b * 1.5, 0, 7); ctx.fill();
    ctx.fillStyle = `rgba(140,255,220,${0.08 + b * 0.1})`; ctx.beginPath(); ctx.arc(x, y, 10, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function renderBurrow() {
  const V = brView(), s = V.s, BW = V.BW;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#3b2616'; ctx.fillRect(0, 0, vw, vh);
  if (V.oy > 4) { // 세로 화면: 위아래는 흙 단면
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#5a3d24' : '#4b321d'; ctx.fillRect(0, i * V.oy / 6, vw, V.oy / 6 + 1); ctx.fillRect(0, vh - V.oy + i * V.oy / 6, vw, V.oy / 6 + 1); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '14px Jua, sans-serif'; ctx.fillStyle = 'rgba(255,240,200,.7)';
    ctx.fillText(L('📱 가로로 돌리면 더 크게 보여요', '📱 Turn sideways for a bigger view'), vw / 2, V.oy / 2);
  }
  const sh = reduceMotion ? 0 : shake, ox = (Math.random() - 0.5) * sh, oy2 = (Math.random() - 0.5) * sh;
  ctx.setTransform(dpr * s, 0, 0, dpr * s, ox * dpr, (V.oy + oy2) * dpr);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, BW, BH); ctx.clip();
  const cam = br.cam, beat = 1 - br.beatPh;
  // 동굴 안쪽 (박자마다 살짝 밝아짐)
  const bg = ctx.createLinearGradient(0, 0, 0, BH); bg.addColorStop(0, '#2a1a10'); bg.addColorStop(0.55, `rgb(${70 + beat * 18},${46 + beat * 12},${30 + beat * 8})`); bg.addColorStop(1, '#2a1a10');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, BW, BH);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  // 바닥 흙
  ctx.fillStyle = '#6b4a2c'; ctx.fillRect(-10, FLOOR, BW + 20, BH - FLOOR);
  ctx.fillStyle = 'rgba(0,0,0,.14)'; for (let x = -(cam % 60); x < BW; x += 60) ctx.fillRect(x, FLOOR, 30, BH - FLOOR);
  // 천장 흙 (높이가 바뀌는 모양 그대로)
  ctx.fillStyle = '#5d3f25'; ctx.beginPath(); ctx.moveTo(-10, -10);
  for (let x = -10; x <= BW + 20; x += 16) ctx.lineTo(x, ceilAt(cam + x) + Math.sin((cam + x) * 0.05) * 3);
  ctx.lineTo(BW + 20, -10); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = `rgba(255,214,120,${0.35 + beat * 0.4})`; ctx.lineWidth = 3; ctx.beginPath();
  for (let x = -10; x <= BW + 20; x += 16) { const y = ceilAt(cam + x) + Math.sin((cam + x) * 0.05) * 3; x === -10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
  ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, FLOOR); ctx.lineTo(BW, FLOOR); ctx.stroke();
  for (const a of br.amb) drawAmbient(a, cam, BW);
  // 장애물
  for (const o of br.objs.concat(br.rocks)) {
    const x = (o.k === 'rock' ? (o.rx ?? o.x) : o.x) - cam; if (x > BW + 80 || x + (o.w || 60) < -80) continue;
    if (o.k === 'spike') {
      ctx.fillStyle = '#9e9e9e'; ctx.strokeStyle = `rgba(255,255,255,${0.4 + beat * 0.5})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, FLOOR); ctx.lineTo(x + o.w / 2, FLOOR - 38); ctx.lineTo(x + o.w, FLOOR); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (o.k === 'cspike') {
      ctx.fillStyle = '#9e9e9e'; ctx.strokeStyle = `rgba(255,255,255,${0.4 + beat * 0.5})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, o.cy - 4); ctx.lineTo(x + o.w / 2, o.cy + 38); ctx.lineTo(x + o.w, o.cy - 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (o.k === 'block') {
      const y0 = o.ceil ? CEIL - 40 : FLOOR - o.h, hh = o.ceil ? o.h + 40 : o.h + (BH - FLOOR);
      ctx.fillStyle = '#8a6440'; ctx.fillRect(x, y0, o.w, hh); ctx.strokeStyle = `rgba(255,214,120,${0.4 + beat * 0.5})`; ctx.lineWidth = 3;
      ctx.strokeRect(x + 1.5, o.ceil ? CEIL - 40 : y0 + 1.5, o.w - 3, o.ceil ? o.h + 38 : o.h - 3);
      ctx.fillStyle = 'rgba(0,0,0,.15)'; for (let yy = y0 + 12; yy < y0 + hh; yy += 18) ctx.fillRect(x + 6, yy, o.w - 12, 4);
    } else if (o.k === 'pit') {
      ctx.fillStyle = '#1a0f08'; ctx.fillRect(x, FLOOR - 1, o.w, BH - FLOOR + 2);
      ctx.fillStyle = `rgba(80,160,230,${0.6 + Math.sin(time * 4) * 0.1})`; ctx.fillRect(x, FLOOR + 40, o.w, BH - FLOOR - 40);
    } else if (o.k === 'rock') {
      const ry = FLOOR - o.r; ctx.save(); ctx.translate(x, ry); ctx.rotate(-(o.x - (o.rx ?? o.x)) / o.r);
      ctx.fillStyle = '#7d7d7d'; ctx.beginPath(); ctx.arc(0, 0, o.r, 0, 7); ctx.fill(); ctx.fillStyle = '#5f5f5f'; ctx.fillRect(-o.r * 0.6, -3, o.r * 1.2, 6); ctx.restore();
    } else if (o.k === 'root') {
      const ct = ceilAt(o.x);
      ctx.strokeStyle = '#4e342e'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + o.w / 2, ct - 6); ctx.quadraticCurveTo(x - 10, (ct + FLOOR - 72) / 2, x + o.w / 2, FLOOR - 74); ctx.stroke();
      ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + o.w / 2, FLOOR - 120); ctx.lineTo(x + o.w + 10, FLOOR - 90); ctx.stroke();
    } else if (o.k === 'stal') {
      const top = ceilAt(o.x + 14), sx = x + (o.st === 'shake' ? Math.sin(time * 60) * 3 : 0), y0 = top + o.fy - 6;
      ctx.fillStyle = '#b0a59a'; ctx.strokeStyle = `rgba(255,255,255,${0.35 + beat * 0.4})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx, y0); ctx.lineTo(sx + o.w / 2, y0 + 54); ctx.lineTo(sx + o.w, y0); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (o.st === 'shake') emoji('❗', sx + o.w / 2, y0 + 70, 18);
    } else if (o.k === 'pad') { emoji('🍄', x + o.w / 2, FLOOR - 14 - (o.used === br.attempts ? 4 : 0), 34); }
    else if (o.k === 'portal') {
      ctx.strokeStyle = `hsla(${(time * 200) % 360},80%,70%,.9)`; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(x + 15, (CEIL + FLOOR) / 2, 16, (FLOOR - CEIL) / 2 - 10, 0, 0, 7); ctx.stroke();
      emoji('🔄', x + 15, (CEIL + FLOOR) / 2, 24);
    } else if ((o.k === 'gem' || o.k === 'fossil') && !o.got) emoji(o.k === 'gem' ? '💎' : '🦴', x, o.y + Math.sin(time * 4 + o.x) * 4, 26);
    else if (o.k === 'flag') emoji(br.cps.indexOf(o.x) <= br.cp ? '✅' : '🚩', x, FLOOR - 22, 30);
  }
  // 도착: 두더지 창고
  const ex = br.end - cam;
  if (ex < BW + 200) { ctx.fillStyle = 'rgba(255,214,120,.18)'; ctx.fillRect(ex, CEIL, 400, FLOOR - CEIL); emoji('🧰', ex + 120, FLOOR - 28, 52); emoji('💰', ex + 190, FLOOR - 20, 34); }
  // 꿈틀이 (광부 모자)
  if (br.dead <= 0) {
    const py = br.y, flip = br.g < 0 ? -1 : 1;
    ctx.save(); ctx.translate(PX, py); ctx.rotate(br.onGround ? 0 : br.rot); ctx.scale(1, flip);
    for (let i = 3; i >= 0; i--) { ctx.fillStyle = wormColor(i); ctx.beginPath(); ctx.arc(-i * 9, Math.sin(time * 18 + i) * (br.onGround ? 3 : 0) + 4, PR - i * 2, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(6, -2, 4.5, 0, 7); ctx.fill(); ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(7.5, -2, 2.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#f9a825'; ctx.beginPath(); ctx.arc(0, -8, 14, Math.PI, 0); ctx.fill(); ctx.fillRect(-16, -9, 32, 4);
    ctx.fillStyle = '#fffde7'; ctx.beginPath(); ctx.arc(7, -14, 4, 0, 7); ctx.fill();
    ctx.restore();
  }
  // 뒤쫓아 오는 두더지
  emoji('💢', 40, FLOOR - 70 + Math.sin(time * 8) * 4, 22);
  ctx.save(); ctx.translate(46, FLOOR - 26 + Math.abs(Math.sin(time * 10)) * -6); ctx.fillStyle = '#4a3a33'; ctx.beginPath(); ctx.ellipse(0, 0, 30, 26, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#f07a96'; ctx.beginPath(); ctx.arc(28, -2, 7, 0, 7); ctx.fill(); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(16, -10, 2.5, 0, 7); ctx.fill();
  ctx.fillStyle = '#f2a7b5'; ctx.beginPath(); ctx.ellipse(20, 14, 9, 6, 0.5, 0, 7); ctx.fill(); ctx.restore();
  // 헤드램프 빛
  const lamp = ctx.createRadialGradient(PX + 60, br.y, 60, PX + 60, br.y, 560);
  lamp.addColorStop(0, 'rgba(0,0,0,0)'); lamp.addColorStop(1, 'rgba(8,4,0,.6)');
  ctx.fillStyle = lamp; ctx.fillRect(0, 0, BW, BH);
  for (const e of br.fx) {
    ctx.globalAlpha = Math.min(1, e.life * 2);
    if (e.k === 'text') { ctx.font = '20px Jua, ' + EMOJI_FONT; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.strokeText(e.t, e.x - cam, e.y); ctx.fillStyle = e.c; ctx.fillText(e.t, e.x - cam, e.y); }
    else { ctx.fillStyle = e.c; ctx.beginPath(); ctx.arc(e.x - cam, e.y, e.r, 0, 7); ctx.fill(); }
  }
  ctx.globalAlpha = 1; ctx.restore();
  // HUD
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash * 1.6})`; ctx.fillRect(0, 0, vw, vh); }
  const pct = Math.min(100, Math.floor((br.cam + PX) / br.end * 100));
  const narrow = vw < 600, bw = Math.min(vw - (narrow ? 40 : 160), 420), bx = (vw - bw) / 2, by = narrow ? 52 : 18;
  ctx.fillStyle = 'rgba(0,0,0,.45)'; roundRect(bx, by, bw, 12, 6); ctx.fill();
  ctx.fillStyle = '#9be15d'; roundRect(bx, by, bw * pct / 100, 12, 6); ctx.fill();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '15px Jua, sans-serif'; ctx.fillStyle = '#fff';
  ctx.fillText(`${pct}%  ·  💎 ${br.gems}  ·  ${L('도전', 'Attempt')} ${br.attempts}`, vw / 2, by + 30);
}
