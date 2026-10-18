'use strict';
// ---------- 16. 그리기 ----------
function drawHouse() {
  // 집 벽과 데크(마당 위쪽)
  ctx.fillStyle = '#d9c7a7'; ctx.fillRect(0, 0, W, 90);
  ctx.strokeStyle = 'rgba(120,90,60,.25)'; ctx.lineWidth = 2;
  for (let y = 12; y < 90; y += 16) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  // 창문과 문
  for (const x of [500, 900, 1500, 1900]) {
    ctx.fillStyle = '#7a5a3c'; ctx.fillRect(x - 64, 10, 128, 70);
    ctx.fillStyle = '#bfe3f2'; ctx.fillRect(x - 58, 16, 56, 58); ctx.fillRect(x + 2, 16, 56, 58);
  }
  ctx.fillStyle = '#7a3f22'; ctx.fillRect(W / 2 - 55, 0, 110, 90);
  ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(W / 2 + 35, 50, 6, 0, 7); ctx.fill();
  // 데크
  ctx.fillStyle = '#b07a4a'; ctx.fillRect(0, 90, W, 80);
  ctx.strokeStyle = '#8a5a32'; ctx.lineWidth = 3;
  for (let y = 90; y <= 170; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.fillStyle = '#8f3b2b'; ctx.fillRect(W / 2 - 70, 120, 140, 44);
  ctx.fillStyle = '#f6e7c8'; ctx.font = '22px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(houseSign, W / 2, 143);
  // 화분 몇 개
  for (const x of [300, 1150, 2100]) { ctx.fillStyle = '#c0643a'; ctx.fillRect(x - 18, 126, 36, 34); emoji('🌿', x, 112, 36); }
}
function drawFence() {
  ctx.strokeStyle = '#a77a4c'; ctx.lineWidth = 8;
  ctx.strokeRect(YARD.x0 - 40, YARD.y0 - 22, YARD.x1 - YARD.x0 + 80, YARD.y1 - YARD.y0 + 62);
  ctx.fillStyle = '#c99a63';
  const L = YARD.x0 - 40, R = YARD.x1 + 40, T = YARD.y0 - 22, B = YARD.y1 + 40;
  for (let x = L; x <= R; x += 60) { ctx.fillRect(x - 6, B - 26, 12, 40); }
  for (let y = T + 40; y <= B; y += 60) { ctx.fillRect(L - 6, y - 20, 12, 40); ctx.fillRect(R - 6, y - 20, 12, 40); }
}
function drawTuft(t) {
  const f = fertAt(t.x, t.y);
  const h = (6 + f * 18) * t.s, sway = Math.sin(time * 2 + t.seed * 6) * (1 + f * 2);
  const g = f < 0.2 ? '#b39a5c' : f < 0.5 ? '#7fa047' : '#4f9a3a';
  ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.beginPath();
  for (let k = -1; k <= 1; k++) { ctx.moveTo(t.x + k * 3, t.y); ctx.quadraticCurveTo(t.x + k * 5, t.y - h * 0.6, t.x + k * 7 + sway, t.y - h); }
  ctx.stroke();
  if (f > 0.62 && t.seed > 0.55) {
    ctx.fillStyle = FLOWER[Math.floor(t.seed * 100) % FLOWER.length];
    const fx = t.x + sway, fy = t.y - h - 2;
    for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; ctx.beginPath(); ctx.arc(fx + Math.cos(a) * 3.5, fy + Math.sin(a) * 3.5, 2.6, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(fx, fy, 2, 0, 7); ctx.fill();
  }
}
function plantGreen(p) { const f = clamp(fertAt(p.x, p.y, 2) * 1.3, 0, 1), w = p.wither || 0; return [lerp(lerp(150, 60, f), 150, w), lerp(lerp(150, 150, f), 110, w), lerp(lerp(80, 60, f), 55, w)]; }
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
function drawPlantLow(p) {
  const g = plantGreen(p), r = p.def.r;
  if (p.def.kind === 'tree') { // 그림자만 먼저
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 10, r * 0.95, r * 0.45, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#6b4a2e'; ctx.fillRect(p.x - 10, p.y - 20, 20, 34);
    return;
  }
  ctx.fillStyle = 'rgba(80,50,30,.35)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, r * 1.05, r * 0.7, 0, 0, 7); ctx.fill();
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * 6.28, rr = r * (p.def.kind === 'bush' ? 0.45 : 0.6);
    ctx.fillStyle = rgb([g[0] - i * 4, g[1] - i * 3, g[2]]);
    ctx.beginPath(); ctx.ellipse(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr * 0.7, r * 0.42, r * 0.32, a, 0, 7); ctx.fill();
  }
  if (p.def.kind === 'bush') { ctx.strokeStyle = '#8a6440'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x - r * .6, p.y + r * .5); ctx.lineTo(p.x - r * .6, p.y - r * .7); ctx.moveTo(p.x + r * .6, p.y + r * .5); ctx.lineTo(p.x + r * .6, p.y - r * .7); ctx.stroke(); }
  drawFruits(p);
}
function drawPlantHigh(p) {
  if (p.def.kind !== 'tree') return;
  const g = plantGreen(p), r = p.def.r;
  const under = dist(worm.x, worm.y, p.x, p.y - 30) < r;
  ctx.globalAlpha = under ? 0.55 : 1;
  const blobs = [[0, -50, 1], [-r * .5, -30, .75], [r * .5, -30, .75], [-r * .3, -78, .7], [r * .3, -78, .7]];
  blobs.forEach(([dx, dy, s], i) => { ctx.fillStyle = rgb([g[0] - i * 6, g[1] - i * 5, g[2]]); ctx.beginPath(); ctx.arc(p.x + dx, p.y + dy, r * 0.62 * s, 0, 7); ctx.fill(); });
  drawFruits(p);
  ctx.globalAlpha = 1;
}
function drawFruits(p) {
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < p.shown; i++) { const s = p.spots[i]; emoji(p.def.fruit, p.x + s.x, p.y + s.y + Math.sin(time * 2 + i) * 1.5, p.def.kind === 'tree' ? 22 : 20); }
  // 이름표
  ctx.font = '13px Jua, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.fillText(`${p.wither > 0 ? '🥀 ' : ''}${p.def.name} ${p.shown}/${p.def.max}`, p.x, p.y + p.def.r * 0.75 + 8);
  if (p.wither > 0) { ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(p.x, p.y - p.def.r - 20, 14, 0, 7); ctx.stroke(); ctx.strokeStyle = '#9be15d'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x, p.y - p.def.r - 20, 14, -Math.PI / 2, -Math.PI / 2 + (1 - p.wither) * 6.283); ctx.stroke(); emoji('🥀', p.x, p.y - p.def.r - 20, 14); }
}
function drawWorm() {
  if (drawZappedWorm()) return;
  const segs = worm.segs, n = segs.length;
  const blink = worm.invul > 0 && Math.floor(time * 12) % 2 === 0;
  ctx.globalAlpha = worm.dive > 0 ? 0.35 : blink ? 0.45 : 1;
  const sup = worm.superT > 0;
  if (sup) { // 금빛 오라
    const g = ctx.createRadialGradient(worm.x, worm.y, 5, worm.x, worm.y, 70);
    g.addColorStop(0, 'rgba(255,220,80,.55)'); g.addColorStop(1, 'rgba(255,220,80,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(worm.x, worm.y, 70, 0, 7); ctx.fill();
  }
  // 망토 (슈퍼 꿈틀이)
  if (sup && n > 7) {
    const a = segs[2], b = segs[Math.min(n - 1, 9)];
    const ang = Math.atan2(a.y - b.y, a.x - b.x), px = -Math.sin(ang), py = Math.cos(ang);
    const wave = Math.sin(time * 14) * 8;
    ctx.fillStyle = '#d62828'; ctx.strokeStyle = '#8f1515'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.x + px * 12, a.y + py * 12);
    ctx.quadraticCurveTo((a.x + b.x) / 2 + px * 26, (a.y + b.y) / 2 + py * 26 + wave, b.x + px * 30 - Math.cos(ang) * 20, b.y + py * 30 - Math.sin(ang) * 20 + wave);
    ctx.lineTo(b.x - px * 30 - Math.cos(ang) * 20, b.y - py * 30 - Math.sin(ang) * 20 - wave);
    ctx.quadraticCurveTo((a.x + b.x) / 2 - px * 26, (a.y + b.y) / 2 - py * 26 - wave, a.x - px * 12, a.y - py * 12);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  for (let i = n - 1; i >= 0; i--) {
    const s = segs[i], t = i / Math.max(1, n - 1);
    let r = lerp(13, 6, t) + (sup ? 2 : 0) + Math.sin(time * 10 - i * 0.6) * 0.6;
    let col = sup ? (i % 2 ? '#ffcf5a' : '#ffb93b') : wormColor(i);
    if (i >= 5 && i <= 7) col = sup ? '#ff9a3b' : '#d9666f'; // 환대(지렁이 띠)
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.arc(s.x - r * 0.3, s.y - r * 0.35, r * 0.4, 0, 7); ctx.fill();
  }
  // 얼굴
  const a = worm.ang, hx = worm.x, hy = worm.y, px = -Math.sin(a), py = Math.cos(a);
  for (const sgn of [-1, 1]) {
    const ex = hx + Math.cos(a) * 5 + px * 6 * sgn, ey = hy + Math.sin(a) * 5 + py * 6 * sgn;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex, ey, 4.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(ex + Math.cos(a) * 1.5, ey + Math.sin(a) * 1.5, 2.2, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,90,110,.45)'; ctx.beginPath(); ctx.arc(hx - Math.cos(a) * 2 + px * 10 * sgn, hy - Math.sin(a) * 2 + py * 10 * sgn, 2.6, 0, 7); ctx.fill();
  }
  if (hatEmoji() && !sup) { ctx.save(); ctx.translate(hx - Math.cos(a) * 4, hy - Math.sin(a) * 4 - 10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; emoji(hatEmoji(), 0, 0, 20); ctx.restore(); }
  if (sup) { // 가슴의 S 마크
    const sx = segs[Math.min(2, n - 1)].x, sy = segs[Math.min(2, n - 1)].y;
    ctx.fillStyle = '#d62828'; ctx.beginPath(); ctx.moveTo(sx, sy - 9); ctx.lineTo(sx + 9, sy); ctx.lineTo(sx, sy + 9); ctx.lineTo(sx - 9, sy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('S', sx, sy + 1);
  }
  ctx.globalAlpha = 1;
  if (worm.goo > 0) { ctx.fillStyle = 'rgba(190,225,150,.85)'; ctx.beginPath(); ctx.arc(worm.x - 3, worm.y - 4, 8, 0, 7); ctx.arc(worm.x + 5, worm.y + 2, 6, 0, 7); ctx.arc(worm.x + 1, worm.y + 9 + (2.5 - worm.goo) * 4, 3, 0, 7); ctx.fill(); }
  if (worm.dive > 0) { // 땅 위로 볼록 솟은 흙
    ctx.fillStyle = 'rgba(90,60,35,.75)';
    for (let i = 0; i < n; i += 3) { ctx.beginPath(); ctx.ellipse(segs[i].x, segs[i].y, 9, 6, 0, 0, 7); ctx.fill(); }
  }
}
function drawMole() {
  const m = mole;
  if (m.state === 'none') return;
  if (m.state === 'warn') {
    const k = 1 - m.t / 2.3;
    ctx.fillStyle = '#5b3d24'; ctx.beginPath(); ctx.ellipse(m.x, m.y, 20 + k * 22, 10 + k * 12, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#7a5532'; ctx.beginPath(); ctx.ellipse(m.x, m.y, 20 + k * 22, 6 + k * 5, 0, 0, 7); ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '22px Jua, sans-serif'; ctx.fillStyle = '#ffdad2';
    ctx.fillText('!', m.x, m.y - 40 - Math.abs(Math.sin(time * 10)) * 8);
    return;
  }
  ctx.save(); ctx.translate(m.x, m.y); ctx.scale(m.scale, m.scale); ctx.rotate(m.spin);
  const a = m.face, ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(0, 22, 32, 10, 0, 0, 7); ctx.fill();
  // 앞발(분홍 삽 같은 손)
  for (const sgn of [-1, 1]) { ctx.fillStyle = '#f2a7b5'; ctx.beginPath(); ctx.ellipse(ca * 18 + px * 24 * sgn, sa * 18 + py * 24 * sgn, 10, 7, a + sgn * 0.6, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#4a3a33'; ctx.beginPath(); ctx.ellipse(0, 0, 34, 30, a, 0, 7); ctx.fill();
  ctx.fillStyle = '#6b5a50'; ctx.beginPath(); ctx.ellipse(ca * 8, sa * 8, 22, 18, a, 0, 7); ctx.fill();
  // 코
  ctx.fillStyle = '#f07a96'; ctx.beginPath(); ctx.arc(ca * 30, sa * 30, 8, 0, 7); ctx.fill();
  for (let i = 0; i < 6; i++) { const b = i / 6 * 6.28; ctx.beginPath(); ctx.arc(ca * 30 + Math.cos(b) * 7, sa * 30 + Math.sin(b) * 7, 3, 0, 7); ctx.fill(); }
  // 눈 & 화난 눈썹
  for (const sgn of [-1, 1]) {
    const ex = ca * 16 + px * 9 * sgn, ey = sa * 16 + py * 9 * sgn;
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(ex, ey, 2.5, 0, 7); ctx.fill();
    if (m.state === 'chase' && worm.superT <= 0) { ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ex - ca * 5 + px * 4 * sgn, ey - sa * 5 + py * 4 * sgn); ctx.lineTo(ex + ca * 1 - px * 2 * sgn, ey + sa * 1 - py * 2 * sgn); ctx.stroke(); }
  }
  if (m.state === 'chase' && worm.superT > 0) { ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; emoji('💦', 26, -30, 20); }
  if (m.state === 'slapped') { ctx.fillStyle = 'rgba(255,60,60,.6)'; ctx.beginPath(); ctx.arc(px * 14, py * 14, 9, 0, 7); ctx.fill(); }
  ctx.restore();
  if (m.state === 'slapped') { ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; emoji('💫', m.x, m.y - 40 * m.scale, 26 * m.scale + 6); }
}
function drawSlapFx() {
  if (!slapFx) return;
  const f = slapFx, k = 1 - f.t;
  ctx.save(); ctx.translate(f.x, f.y);
  const s = k < 0.15 ? k / 0.15 * 1.3 : 1.3 - (k - 0.15) * 0.4;
  ctx.scale(s, s);
  // 별 모양 폭발
  ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#d62828'; ctx.lineWidth = 5; ctx.beginPath();
  for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283, r = i % 2 ? 40 : 82; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d62828'; ctx.font = '46px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('짝!!', 0, 2);
  ctx.restore();
  // 손바닥 휘두르기
  if (k < 0.5) {
    const sw = -1.2 + k / 0.5 * 2.4, r = 70;
    ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.dir + sw);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; emoji('✋', r, 0, 54); ctx.restore();
  }
}
function drawArrow(wx, wy, label, color) {
  const sx = (wx - cam.x) * zoom, sy = (wy - cam.y) * zoom, m = 46;
  if (sx > 0 && sx < vw && sy > 0 && sy < vh) return;
  const cx = vw / 2, cy = vh / 2, a = Math.atan2(sy - cy, sx - cx);
  const ex = clamp(sx, m, vw - m), ey = clamp(sy, m + 90, vh - m - 70);
  ctx.save(); ctx.translate(ex, ey); ctx.rotate(a);
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(-8, -14); ctx.lineTo(-8, 14); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; emoji(label, ex - Math.cos(a) * 22, ey - Math.sin(a) * 22, 22);
}
function drawMinimap() {
  const mw = vh < 500 ? 84 : vw < 480 ? 108 : 150, mh = mw * H / W, x = 10, y = vh - mh - 10 - 0;
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = '#b8874d'; ctx.fillRect(x - 3, y - 3, mw + 6, mh + 6);
  ctx.imageSmoothingEnabled = true; ctx.drawImage(fcv, x, y, mw, mh);
  const sc = mw / W;
  ctx.fillStyle = '#d9c7a7'; ctx.fillRect(x, y, mw, 170 * sc);
  for (const p of plants) { ctx.fillStyle = '#2f6a22'; ctx.beginPath(); ctx.arc(x + p.x * sc, y + p.y * sc, 3, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + mango.x * sc, y + mango.y * sc, 3.5, 0, 7); ctx.fill();
  for (const it of mapItems) { ctx.fillStyle = '#ffd23f'; ctx.fillRect(x + it.x * sc - 2, y + it.y * sc - 2, 4, 4); }
  for (const q of quests) if (q.type === 'visit' && !q.done) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x + q.plant.x * sc, y + q.plant.y * sc, 7, 0, 7); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1; ctx.strokeRect(x + cam.x * sc, y + cam.y * sc, vw / zoom * sc, vh / zoom * sc);
  if ((mole.state === 'chase' || mole.state === 'warn') && Math.floor(time * 6) % 2 === 0) { ctx.fillStyle = '#ff3b30'; ctx.beginPath(); ctx.arc(x + mole.x * sc, y + mole.y * sc, 4.5, 0, 7); ctx.fill(); }
  if (butter.state === 'incoming') { ctx.strokeStyle = '#ff3b30'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + butter.zx * sc, y + butter.zy * sc, Math.max(4, butter.zr * sc), 0, 7); ctx.stroke(); }
  ctx.fillStyle = worm.superT > 0 ? '#ffd23f' : '#ff8fa0'; ctx.beginPath(); ctx.arc(x + worm.x * sc, y + worm.y * sc, 4, 0, 7); ctx.fill();
  ctx.globalAlpha = 1;
}
function render() {
  if (mode === 'globe') { renderGlobe(); return; }
  if (mode === 'flight') { renderFlight(); return; }
  if (mode === 'burrow') { renderBurrow(); return; }
  if (mode === 'ending') { renderEnding(); return; }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#2b1f16'; ctx.fillRect(0, 0, vw, vh);
  const sh = reduceMotion ? 0 : shake;
  const ox = (Math.random() - 0.5) * sh, oy = (Math.random() - 0.5) * sh;
  ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, (-cam.x * zoom + ox) * dpr, (-cam.y * zoom + oy) * dpr);
  if (fertDirty) updateFertImage();
  ctx.imageSmoothingEnabled = true; ctx.drawImage(fcv, 0, 0, W, H);
  const vx0 = cam.x - 80, vy0 = cam.y - 120, vx1 = cam.x + vw / zoom + 80, vy1 = cam.y + vh / zoom + 120;
  const vis = o => o.x > vx0 && o.x < vx1 && o.y > vy0 && o.y < vy1;
  drawHouse(); drawFence();
  for (const p of pebbles) if (vis(p)) { ctx.fillStyle = 'rgba(140,130,120,.8)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * 0.7, p.a, 0, 7); ctx.fill(); }
  for (const c of castings) if (vis(c)) { ctx.fillStyle = `rgba(70,45,25,${Math.min(1, c.life / 5) * 0.8})`; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, 7); ctx.arc(c.x + 3, c.y - 2, c.r * 0.7, 0, 7); ctx.fill(); }
  for (const t of tufts) if (vis(t)) drawTuft(t);
  for (const p of plants) if (vis(p)) drawPlantLow(p);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const n of nutrients) if (vis(n)) {
    const bob = Math.sin(time * 3 + n.ph) * 2, s = 30 * n.born;
    ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(n.x, n.y + 12, 11, 4, 0, 0, 7); ctx.fill();
    emoji(n.type.emoji, n.x, n.y + bob, s);
  }
  for (const it of mapItems) if (vis(it)) {
    const pulse = 1 + Math.sin(time * 5 + it.ph) * 0.1;
    if (it.life > 5 || Math.floor(time * 6) % 2) {
      ctx.fillStyle = 'rgba(255,240,150,.35)'; ctx.beginPath(); ctx.arc(it.x, it.y, 24 * pulse, 0, 7); ctx.fill();
      emoji(ITEMS[it.kind].emoji, it.x, it.y, 34 * pulse);
    }
  }
  drawButterZone();
  drawHole();
  drawAnimalsGround();
  drawGroundCritters();
  drawWorm();
  drawMole();
  drawMango(); drawMangoZap();
  drawAnimals();
  for (const p of plants) if (vis(p)) drawPlantHigh(p);
  drawSkyStuff();
  drawButter();
  for (const p of particles) { ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
  drawSlapFx();
  for (const t of texts) {
    ctx.globalAlpha = Math.min(1, t.life * 1.5); ctx.font = t.s + 'px Jua, ' + EMOJI_FONT;
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(40,25,15,.85)'; ctx.strokeText(t.t, t.x, t.y); ctx.fillStyle = t.c; ctx.fillText(t.t, t.x, t.y);
  }
  ctx.globalAlpha = 1;

  // --- 화면 고정 효과 ---
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (raining > 0) {
    ctx.fillStyle = 'rgba(60,90,140,.16)'; ctx.fillRect(0, 0, vw, vh);
    ctx.strokeStyle = 'rgba(200,220,255,.55)'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (const d of drops) { d.y += 0.02 * d.s; if (d.y > 1) { d.y = 0; d.x = Math.random(); } const x = d.x * vw, y = d.y * vh; ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 16 * d.s); }
    ctx.stroke();
  }
  if (worm.dive > 0 && state === 'play') { ctx.fillStyle = 'rgba(60,35,15,.22)'; ctx.fillRect(0, 0, vw, vh); }
  if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash * 1.6})`; ctx.fillRect(0, 0, vw, vh); }
  if (state === 'play' || state === 'pause' || state === 'dying') {
    if (mole.state === 'chase' || mole.state === 'warn') drawArrow(mole.x, mole.y, '⚠️', '#ff3b30');
    if (hole) drawArrow(hole.x, hole.y, '🕳️', '#ffd23f');
    for (const p of plants) if (p.wither > 0.2) drawArrow(p.x, p.y, '🥀', '#ff9800');
    if (swarm) drawArrow(swarm.x, swarm.y, '🦗', '#827717');
    for (const q of quests) if (q.type === 'visit' && !q.done) drawArrow(q.plant.x, q.plant.y, q.plant.def.fruit, '#7bd35a');
    drawMinimap();
    // 남은 효과 시간
    const effects = [];
    if (worm.boost > 0) effects.push('⚡ ' + worm.boost.toFixed(1));
    if (worm.dive > 0) effects.push('🌀 ' + worm.dive.toFixed(1));
    if (worm.superT > 0) effects.push('⭐ ' + worm.superT.toFixed(1));
    if (worm.stun > 0) effects.push('💫 쪼여서 느려짐');
    if (combo > 1) effects.push('🔥 콤보 x' + Math.min(5, combo));
    if (effects.length) {
      ctx.font = '18px Jua, ' + EMOJI_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.fillStyle = '#fff';
      const t = effects.join('   '), y = vh - 95 - (vw < 480 ? 30 : 0);
      ctx.strokeText(t, vw / 2, y); ctx.fillText(t, vw / 2, y);
    }
  }
}
