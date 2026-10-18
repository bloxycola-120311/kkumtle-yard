'use strict';
// ---------- 10. 두더지 ----------
const mole = { state: 'none', x: 0, y: 0, vx: 0, vy: 0, t: 0, timer: 0, spin: 0, scale: 1, face: 0, wanderA: 0, caught: false };
const moleSpeed = () => (BASE_SPEED * 1.05 + level * 5) * DIFF.mole;
const nextMoleTime = () => Math.max(14, rand(26, 40) - level * 2);
function startMoleWarn() {
  let x = 0, y = 0;
  for (let k = 0; k < 10; k++) {
    const a = Math.random() * Math.PI * 2;
    x = clamp(worm.x + Math.cos(a) * 460, YARD.x0 + 40, YARD.x1 - 40); y = clamp(worm.y + Math.sin(a) * 460, YARD.y0 + 40, YARD.y1 - 40);
    if (dist(x, y, worm.x, worm.y) > 330) break;
  }
  Object.assign(mole, { state: 'warn', x, y, vx: 0, vy: 0, t: 2.3, spin: 0, scale: 1, caught: false });
  banner('⚠️ 땅이 흔들려요! 두더지가 온다! 도망쳐요!', 2.6, true); SFX.warn();
}
function hurtWorm() {
  const alive = loseLife(); worm.invul = 2.5; shake = 16; SFX.hurt(); flash = 0.25;
  floatText(worm.x, worm.y - 30, L('앗! 꿈틀이 -1', 'Ouch! -1 Wiggles'), '#ffdddd', 26);
  burst(worm.x, worm.y, 16, ['#ee8f96', '#c0392b']);
  mole.state = 'leave'; mole.t = 1; mole.caught = true;
  if (!alive) { setTimeout(gameOver, 700); state = 'dying'; }
  else banner(L(`두더지에게 잡혔어요! 남은 꿈틀이 ${lives}`, `The mole got you! ${lives} Wiggles left`), 2.2, true);
}
function tailBite(i) {
  const cut = Math.min(4, worm.len - 6);
  if (cut <= 0) { hurtWorm(); return; }
  worm.len -= cut; worm.invul = 1.2; shake = 8; SFX.hurt();
  floatText(worm.segs[i].x, worm.segs[i].y, '꼬리 냠! -' + cut + '마디', '#ffdddd', 20);
  burst(worm.segs[i].x, worm.segs[i].y, 10, ['#ee8f96']);
}
function slapMole() {
  const dx = mole.x - worm.x, dy = mole.y - worm.y, d = Math.hypot(dx, dy) || 1;
  Object.assign(mole, { state: 'slapped', t: 1.6, vx: dx / d * 1100, vy: dy / d * 1100 - 200 });
  hitStop = 0.4; shake = 22; flash = 0.15; SFX.slap();
  slapFx = { x: (mole.x + worm.x) / 2, y: (mole.y + worm.y) / 2, t: 1, dir: Math.atan2(dy, dx) };
  addScore(500); stats.slaps++;
  banner('철썩!! 슈퍼 꿈틀이가 두더지를 쫓아냈다! +500', 2.6);
  burst(mole.x, mole.y, 30, ['#ffd23f', '#fff', '#ff6b6b'], 320);
  questEvent('slap', 1);
}
function updateMole(dt) {
  const m = mole;
  if (m.state === 'none') { m.timer -= dt; if (m.timer <= 0) startMoleWarn(); return; }
  if (m.state === 'warn') {
    m.t -= dt; shake = Math.max(shake, reduceMotion ? 0 : 3);
    if (Math.random() < 0.6) burst(m.x + rand(-20, 20), m.y + rand(-10, 10), 1, ['#6b4a2c', '#8a6440'], 90);
    if (m.t <= 0) { m.state = 'chase'; m.t = 12 + level; burst(m.x, m.y, 26, ['#6b4a2c', '#8a6440', '#4b3320'], 260); shake = 10; }
    return;
  }
  if (m.state === 'chase') {
    m.t -= dt;
    const flee = worm.superT > 0, hidden = worm.dive > 0;
    let tx, ty;
    if (hidden) { m.wanderA += rand(-3, 3) * dt; tx = m.x + Math.cos(m.wanderA) * 100; ty = m.y + Math.sin(m.wanderA) * 100; }
    else { tx = worm.x; ty = worm.y; }
    let dx = tx - m.x, dy = ty - m.y; const d = Math.hypot(dx, dy) || 1;
    let sp = moleSpeed(); if (flee) { dx = -dx; dy = -dy; sp *= 0.72; } if (hidden) sp *= 0.5;
    const k = Math.min(1, dt * 2.0);
    m.vx += (dx / d * sp - m.vx) * k; m.vy += (dy / d * sp - m.vy) * k;
    m.x = clamp(m.x + m.vx * dt, YARD.x0, YARD.x1); m.y = clamp(m.y + m.vy * dt, YARD.y0, YARD.y1);
    if (Math.hypot(m.vx, m.vy) > 5) m.face = Math.atan2(m.vy, m.vx);
    if (Math.random() < 0.25) particles.push({ x: m.x + rand(-16, 16), y: m.y + 18, vx: rand(-20, 20), vy: rand(-30, 0), life: 0.6, max: 0.6, c: '#6b4a2c', r: rand(2, 4) });
    if (worm.superT > 0) { if (dist(m.x, m.y, worm.x, worm.y) < 50) { slapMole(); return; } }
    else if (worm.dive <= 0 && worm.invul <= 0) {
      if (dist(m.x, m.y, worm.x, worm.y) < 36) { hurtWorm(); return; }
      for (let i = 4; i < worm.segs.length; i++) if (dist(m.x, m.y, worm.segs[i].x, worm.segs[i].y) < 26) { tailBite(i); break; }
    }
    if (m.t <= 0) {
      m.state = 'leave'; m.t = 1; m.caught = false;
      addScore(150); stats.escapes++; questEvent('escape', 1);
      banner('휴~ 두더지가 지쳐서 땅속으로 돌아갔어요! +150', 2.4);
      setTimeout(() => spawnHole(m.x, m.y), 1600);
    }
    return;
  }
  if (m.state === 'leave') {
    m.t -= dt; m.scale = Math.max(0, m.t);
    if (m.t <= 0) { m.state = 'none'; m.timer = nextMoleTime(); m.scale = 1; }
    return;
  }
  if (m.state === 'slapped') {
    m.t -= dt; m.x += m.vx * dt; m.y += m.vy * dt; m.vx *= 0.99; m.vy = m.vy * 0.99 + 300 * dt;
    m.spin += dt * 20; m.scale = Math.max(0.15, m.t / 1.6);
    if (m.t <= 0) { m.state = 'none'; m.timer = nextMoleTime() + 8; m.spin = 0; m.scale = 1; }
  }
}


// ---------- 10-2. 앵무새 버터 ----------
// 빨간 착륙 표시가 생기고, 카운트다운이 끝나면 버터가 그 자리에 내려앉음.
// 그때 꿈틀이가 표시 안에 있으면 버터가 신나서 콕콕! → 점수 감소 + 몸 3마디 감소 + 잠깐 느려짐
const butterImg = new Image(); let butterReady = false;
butterImg.onload = () => { butterReady = true; };
butterImg.src = 'butter.webp';
const butter = { flapPh: 0, flapN: 0, state: 'none', timer: 0, zx: 0, zy: 0, zr: 90, t: 0, total: 3, fromX: 0, fromY: 0, x: 0, y: 0, alt: 0, face: 1 };
const nextButterTime = () => Math.max(15, rand(26, 38) - level * 1.5) * DIFF.butter;
function startButter() {
  const ahead = 110 + rand(0, 80);
  butter.zx = clamp(worm.x + Math.cos(worm.ang) * ahead + rand(-50, 50), YARD.x0 + 60, YARD.x1 - 60);
  butter.zy = clamp(worm.y + Math.sin(worm.ang) * ahead + rand(-50, 50), YARD.y0 + 60, YARD.y1 - 60);
  butter.zr = Math.min(125, 85 + level * 5);
  butter.total = butter.t = Math.max(2.2, 3.3 - level * 0.12);
  const side = Math.random() < 0.5 ? -1 : 1;
  butter.fromX = butter.zx + side * 800; butter.fromY = butter.zy - 520;
  butter.face = -side; butter.state = 'incoming';
  banner('🐦 버터가 날아와요! 빨간 표시 밖으로 피하세요!', 2.4, true); SFX.chirp();
}
function butterLand() {
  const headIn = dist(worm.x, worm.y, butter.zx, butter.zy) < butter.zr + 8 ||
    worm.segs.some((sg, i) => i < 4 && dist(sg.x, sg.y, butter.zx, butter.zy) < butter.zr);
  const tailIdx = headIn ? -1 : worm.segs.findIndex((sg, i) => i >= 4 && dist(sg.x, sg.y, butter.zx, butter.zy) < butter.zr);
  const inside = headIn || tailIdx >= 0;
  burst(butter.zx, butter.zy + 20, 14, ['#8a6440', '#c9a46a'], 160);
  if (inside && worm.superT > 0) {
    butter.state = 'startled'; butter.t = 1.0; SFX.sad();
    floatText(butter.zx, butter.zy - 70, '깜짝! 슈퍼 꿈틀이다!', '#fff59d', 22);
    stats.dodges++; questEvent('dodge', 1);
  } else if (inside && worm.dive <= 0) {
    butter.state = 'happy'; butter.t = 2.2; SFX.happy(); stats.pecks++; hudDirty = true;
    const happyNotes = () => { for (let i = 0; i < 6; i++) setTimeout(() => { if (butter.state === 'happy') floatText(butter.x + rand(-40, 40), butter.y - 60, pick(['♪', '💛', '♫', '😋']), '#fff', 24); }, i * 300); };
    if (headIn) {
      const lose = Math.min(score, 100 + 50 * level); score -= lose;
      const cut = Math.max(0, Math.min(3, worm.len - 6)); worm.len -= cut;
      worm.stun = 1.6; shake = 10;
      floatText(worm.x, worm.y - 36, `콕콕! -${lose}점${cut ? ' · -' + cut + '마디' : ''}`, '#ffd0d0', 24);
      banner('🐦 버터가 신났어요! "꺄~ 지렁이다!" 콕콕!', 2.4, true);
    } else { // 꼬리 쪼기: 쪼인 곳부터 꼬리 끝까지 잘림(최대 5마디), 점수는 절반
      const sg = worm.segs[tailIdx];
      const lose = Math.min(score, Math.round((100 + 50 * level) / 2)); score -= lose;
      const cut = Math.max(0, Math.min(5, worm.len - tailIdx, worm.len - 6)); worm.len -= cut;
      worm.stun = 0.6; shake = 6;
      butter.x = sg.x; butter.y = sg.y;
      floatText(sg.x, sg.y - 30, L(`꼬리 콕! -${lose}점${cut ? ' · -' + cut + '마디' : ''}`, `Tail peck! -${lose} pts${cut ? ' · -' + cut + ' segments' : ''}`), '#ffd0d0', 22);
      banner(L('🐦 버터가 꼬리를 콕콕! "꼬리도 맛있어~"', '🐦 Butter pecked your tail! "Tails are tasty too~"'), 2.4, true);
    }
    happyNotes();
  } else {
    butter.state = 'sad'; butter.t = 1.4; SFX.sad();
    addScore(80); stats.dodges++; questEvent('dodge', 1);
    floatText(butter.zx, butter.zy - 70, '삐잉…? 어디 갔지? +80', '#fff', 22);
  }
}
function updateButter(dt) {
  const b = butter;
  if (b.state !== 'none') { // 날갯짓 속도: 날아올 때 빠르게, 착륙 직전엔 크게 천천히
    const rate = b.state === 'incoming' ? (b.t < 0.5 ? 13 : 20) : b.state === 'leave' ? 22 : b.state === 'startled' ? 26 : 24;
    const before = Math.floor(b.flapPh / (Math.PI * 2));
    b.flapPh += rate * dt;
    if (Math.floor(b.flapPh / (Math.PI * 2)) !== before && butterWing().open) {
      b.flapN++;
      if (b.state === 'incoming' || b.state === 'leave') {
        noise(0.06, 0.06);
        if (b.flapN % 2 === 0) floatText(b.x + rand(-50, 50), b.y - 50 - b.alt * 40, b.flapN % 4 === 0 ? '퍼덕!' : '퍼덕퍼덕', '#fffbe6', 16);
        particles.push({ x: b.x + rand(-30, 30), y: b.y - b.alt * 40, vx: rand(-60, 60), vy: rand(10, 60), life: 1.1, max: 1.1, c: pick(['#f4f0dc', '#c9c9cc', '#fff59d']), r: rand(2.5, 4.5) });
      }
    }
  }
  if (b.state === 'none') {
    b.timer -= dt;
    const moleBusy = mole.state === 'warn' || mole.state === 'chase';
    if (b.timer <= 0) { if (moleBusy && level < 3) b.timer = 4; else startButter(); }
    return;
  }
  if (b.state === 'incoming') {
    b.t -= dt;
    const k = 1 - Math.max(0, b.t) / b.total, e = 1 - Math.pow(1 - k, 2);
    b.x = lerp(b.fromX, b.zx, e); b.y = lerp(b.fromY, b.zy, e); b.alt = (1 - e) * 1;
    if (b.t <= 0) { b.x = b.zx; b.y = b.zy; b.alt = 0; butterLand(); }
    return;
  }
  if (b.state === 'happy') { // 꿈틀이 쪽으로 콩콩 따라오며 쪼기
    b.t -= dt;
    const dx = worm.x - b.x, dy = worm.y - b.y, d = Math.hypot(dx, dy) || 1;
    if (d > 40) { b.x += dx / d * 70 * dt; b.y += dy / d * 70 * dt; }
    if (Math.abs(dx) > 5) b.face = dx > 0 ? 1 : -1;
  } else b.t -= dt;
  if ((b.state === 'happy' || b.state === 'sad' || b.state === 'startled') && b.t <= 0) {
    b.state = 'leave'; b.t = 1.3; b.fromX = b.x; b.fromY = b.y; SFX.chirp();
  }
  if (b.state === 'leave') {
    const k = 1 - b.t / 1.3;
    b.x = b.fromX + b.face * k * 700; b.y = b.fromY - k * 520; b.alt = k;
    if (b.t <= 0) { b.state = 'none'; b.timer = nextButterTime(); }
  }
}
function drawButterZone() {
  const b = butter; if (b.state !== 'incoming') return;
  const k = Math.max(0, b.t) / b.total, pulse = 1 + Math.sin(time * 10) * 0.04;
  ctx.save(); ctx.translate(b.zx, b.zy);
  ctx.fillStyle = 'rgba(225,40,40,.22)'; ctx.beginPath(); ctx.arc(0, 0, b.zr * pulse, 0, 7); ctx.fill();
  ctx.strokeStyle = '#e02828'; ctx.lineWidth = 5; ctx.setLineDash([16, 10]); ctx.lineDashOffset = -time * 40;
  ctx.beginPath(); ctx.arc(0, 0, b.zr * pulse, 0, 7); ctx.stroke(); ctx.setLineDash([]);
  ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, b.zr * k, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-22, -22); ctx.lineTo(22, 22); ctx.moveTo(22, -22); ctx.lineTo(-22, 22); ctx.stroke();
  // 하늘에서 내려오는 버터의 그림자
  const sh = 1 - k;
  ctx.fillStyle = `rgba(0,0,0,${0.12 + sh * 0.2})`; ctx.beginPath(); ctx.ellipse(0, 10, 20 + sh * 34, 7 + sh * 10, 0, 0, 7); ctx.fill();
  ctx.font = '34px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(60,0,0,.8)'; ctx.fillStyle = '#fff';
  const n = Math.ceil(Math.max(0, b.t)); ctx.strokeText(n, 0, -b.zr - 20); ctx.fillText(n, 0, -b.zr - 20);
  ctx.restore();
}
// 날개: 사진은 날개를 접은 모습이라, 코드로 그린 회색 날개(흰 무늬 = 왕관앵무 특징)를 어깨에 붙여 퍼덕이게 함
function drawWing(len, ang, back, spread) {
  ctx.save(); ctx.rotate(ang);
  const edge = back ? '#4a4b4f' : '#5a5b5f';
  // 칼깃(긴 깃털) 7장 — 날개를 올릴수록 부채처럼 활짝
  for (let i = 6; i >= 0; i--) {
    const a = (-0.42 + i * 0.12) * (0.55 + spread * 0.6), fl = len * (0.62 + (6 - i) * 0.06);
    const bx = len * (0.18 + i * 0.03);
    ctx.save(); ctx.translate(bx, len * 0.02 * i - len * 0.05); ctx.rotate(a);
    ctx.fillStyle = back ? (i % 2 ? '#6c6d71' : '#727377') : (i % 2 ? '#8f9094' : '#9a9b9f');
    ctx.beginPath(); ctx.moveTo(0, -len * 0.05);
    ctx.quadraticCurveTo(fl * 0.6, -len * 0.085, fl, 0);
    ctx.quadraticCurveTo(fl * 0.6, len * 0.06, 0, len * 0.05); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = edge; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.moveTo(fl * 0.1, 0); ctx.lineTo(fl * 0.9, 0); ctx.stroke();
    ctx.restore();
  }
  // 덮깃 — 왕관앵무 특유의 흰 날개 무늬 + 회색 비늘무늬
  ctx.fillStyle = back ? '#bcb8a6' : '#efead6';
  ctx.beginPath(); ctx.moveTo(-len * 0.04, -len * 0.1);
  ctx.quadraticCurveTo(len * 0.3, -len * 0.2, len * 0.48, -len * 0.02);
  ctx.quadraticCurveTo(len * 0.3, len * 0.14, -len * 0.04, len * 0.1); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = edge; ctx.lineWidth = 1; ctx.stroke();
  ctx.strokeStyle = back ? '#7d7e82' : '#8e8f93'; ctx.lineWidth = 1.4;
  for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
    ctx.beginPath(); ctx.arc(len * (0.06 + i * 0.09 + r * 0.04), len * (-0.04 + r * 0.06), len * 0.035, 0.2, Math.PI - 0.2); ctx.stroke();
  }
  ctx.restore();
}
function butterWing() { // {open:0~1, ph:날갯짓 위상}
  const b = butter;
  if (b.state === 'incoming') return { open: 1, ph: b.flapPh };
  if (b.state === 'leave' || b.state === 'startled') return { open: 1, ph: b.flapPh };
  if (b.state === 'happy') return Math.sin(time * 3) > 0.2 ? { open: 1, ph: b.flapPh } : { open: 0, ph: 0 };
  return { open: 0, ph: 0 };
}
function drawButter() {
  const b = butter; if (b.state === 'none' || !butterReady) return;
  const baseW = 120, scale = 1 + b.alt * 0.6, w = baseW * scale, h = w * butterImg.height / butterImg.width;
  const wg = butterWing(), f = Math.sin(wg.ph);
  let hop = 0, rot = 0;
  if (wg.open) hop = f * 6 * scale;                       // 날갯짓에 맞춰 몸이 들썩
  if (b.state === 'incoming' || b.state === 'leave') rot = -0.12 * b.face;
  if (b.state === 'happy') { hop += -Math.abs(Math.sin(time * 12)) * 12; rot = (Math.sin(time * 16) > 0.3 ? 0.35 : 0) * b.face; }
  if (b.state === 'sad') rot = -0.1 * b.face;
  if (b.state === 'startled') hop -= Math.abs(Math.sin(time * 20)) * 20;
  if (b.alt < 0.2) { ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(b.x, b.y + h * 0.42, w * 0.32, 8, 0, 0, 7); ctx.fill(); }
  ctx.save(); ctx.translate(b.x, b.y + hop - b.alt * 40); ctx.rotate(rot); ctx.scale(b.face, 1);
  const shX = -w / 2 + w * 0.55, shY = -h / 2 + h * 0.32, L = w * 0.56;
  const angOf = ff => -Math.PI / 2 - 0.25 - (ff + 1) / 2 * 1.95; // 위로 번쩍 ↔ 뒤아래로 휙
  if (wg.open) { ctx.save(); ctx.translate(shX + 6, shY - 4); drawWing(L * 0.92, angOf(Math.sin(wg.ph + 0.25)) + 0.12, true, (1 - Math.sin(wg.ph + 0.25)) / 2); ctx.restore(); }
  ctx.drawImage(butterImg, -w / 2, -h / 2, w, h);
  if (wg.open) { ctx.save(); ctx.translate(shX, shY); drawWing(L, angOf(f), false, (1 - f) / 2); ctx.restore(); }
  ctx.restore();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (b.state === 'sad') emoji('❓', b.x, b.y - h * 0.7, 26);
  if (b.state === 'startled') emoji('❗', b.x, b.y - h * 0.7, 28);
  if (b.state === 'happy') { ctx.font = '16px Jua, sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.fillStyle = '#fff59d'; ctx.strokeText('버터', b.x, b.y + h * 0.6); ctx.fillText('버터', b.x, b.y + h * 0.6); }
}

// ---------- 11. 날씨(비) ----------
let raining = 0, rainTimer = 0; const drops = [];
for (let i = 0; i < 140; i++) drops.push({ x: Math.random(), y: Math.random(), s: rand(0.6, 1.2) });
