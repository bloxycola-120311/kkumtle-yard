'use strict';
// ---------- 10-3. 마당 친구들: 닭 망고, 병아리, 도마뱀, 지네, 달걀 ----------
// 망고(닭): 마당을 돌아다니다 눈앞에 있는 건 뭐든 쫌. 지네·도마뱀(맛있음) > 두더지 > 꿈틀이 > 영양분 순서로 노림.
//   → 두더지를 망고 앞으로 유인하면 망고가 두더지를 쪼아서 쫓아냄 (이이제이!). 대신 꿈틀이도 쪼일 수 있음.
//   먹을수록 뚱뚱해지고, 배가 부르면 달걀을 낳음.
// 달걀: 꿈틀이가 건드리면 깨지면서 '달걀 껍질 칼슘' → 주변 흙 확 살아남 + 점수 + 가끔 아이템.
//       그냥 두면 25초 뒤 병아리가 태어남 → 병아리는 지네·도마뱀만 쪼아 먹는 착한 도우미(최대 3마리).
// 도마뱀: 영양분과 달걀을 훔쳐 먹는 도둑. 꿈틀이가 부딪히면 꼬리를 끊고 도망(꼬리는 보너스).
// 지네: 꿈틀이를 노리는 사냥꾼. 물리면 독 때문에 느려지고 3마디가 잘림.
const mangoImg = new Image(); let mangoReady = false;
mangoImg.onload = () => { mangoReady = true; };
mangoImg.src = 'mango.webp';
const mango = { x: 600, y: 900, face: 1, mode: 'wander', t: 0, tx: 600, ty: 900, fat: 0, peck: 0, peckCD: 0, target: null, walk: 0, moving: false, layT: 0, wormCD: 0, say: '', sayT: 0, look: 0 };
let critters = [], eggs = [], chicks = [], tails = [], mangoTipShown = false;
const CLUCK = () => { tone(520, 0.07, 'square', 0.045, 760); tone(600, 0.08, 'square', 0.04, 820, 0.09); };
function mangoSay(t, d = 1.4) { mango.say = t; mango.sayT = d; }
function resetCritters(demo) {
  Object.assign(mango, { x: rand(500, 1900), y: rand(500, 1300), face: 1, mode: 'wander', t: 0, fat: 0, peck: 0, peckCD: 0, target: null, layT: 0, wormCD: 0, sayT: 0 });
  mango.tx = mango.x; mango.ty = mango.y;
  critters = []; eggs = []; chicks = []; tails = [];
  for (let i = 0; i < 2; i++) spawnCritter('lizard'); spawnCritter('centipede');
  if (!demo) setTimeout(() => spawnCritter('centipede'), 40000);
}
function edgeSpot() {
  const side = Math.floor(Math.random() * 4);
  return side === 0 ? { x: YARD.x0 + 20, y: rand(YARD.y0, YARD.y1) } : side === 1 ? { x: YARD.x1 - 20, y: rand(YARD.y0, YARD.y1) } : side === 2 ? { x: rand(YARD.x0, YARD.x1), y: YARD.y1 - 20 } : { x: rand(YARD.x0, YARD.x1), y: YARD.y0 + 20 };
}
function spawnCritter(kind) {
  const s = edgeSpot();
  if (kind === 'lizard') critters.push({ kind, x: s.x, y: s.y, ang: Math.random() * 6.28, sp: 0, idle: rand(0.5, 2), tail: true, tailT: 0, walk: 0, flee: 0 });
  else critters.push({ kind, x: s.x, y: s.y, ang: Math.random() * 6.28, trail: [], walk: 0, biteCD: 0, wob: Math.random() * 6 });
}
function eatCritter(c, by) {
  c.dead = true; burst(c.x, c.y, 10, ['#6d4c41', '#a1887f']);
  setTimeout(() => spawnCritter(c.kind), rand(14000, 22000));
  if (by === mango) { mango.fat += 2; mangoSay(L('꿀꺽!', 'Gulp!')); CLUCK(); }
  else floatText(c.x, c.y - 20, L('병아리 냠!', 'Chick snack!'), '#fff59d', 16);
}
function updateCritters(dt, demo) {
  const m = mango;
  // ----- 망고 (다른 나라에서는 집에서 기다림) -----
  if (!m.away) {
  m.peckCD = Math.max(0, m.peckCD - dt); m.wormCD = Math.max(0, m.wormCD - dt); m.sayT = Math.max(0, m.sayT - dt);
  if (m.mode === 'lay') {
    m.layT -= dt; m.moving = false;
    if (m.layT <= 0) {
      m.mode = 'wander'; m.fat = 0;
      eggs.push({ x: m.x - m.face * 40, y: m.y + 6, t: 25 });
      floatText(m.x, m.y - 90, L('🥚 망고가 달걀을 낳았어요!', '🥚 Mango laid an egg!'), '#fffde7', 18); SFX.item();
    }
  } else if (m.peck > 0) {
    m.peck -= dt; m.moving = false;
    if (m.peck <= 0.17 && !m.hit) { m.hit = true; mangoPeckHit(demo); }
  } else {
    m.look -= dt;
    if (m.look <= 0) { m.look = 0.25; m.target = mangoFindTarget(demo); }
    let tx = m.tx, ty = m.ty, sp = 70;
    if (m.target) { tx = m.target.x; ty = m.target.y; sp = m.target.kind === 'worm' ? 125 : 160; m.t += dt; if (m.t > 4.5) { m.target = null; m.t = 0; m.look = 1.5; } }
    else { m.t -= dt; if (m.t <= 0) { m.t = rand(2.5, 5); const r = Math.random(); if (r < 0.3) { m.tx = m.x; m.ty = m.y; mangoSay(pick([L('꼬꼬?', 'Bawk?'), L('꼬오~', 'Cluck~'), L('콕콕', 'Peck peck')])); } else { m.tx = rand(YARD.x0 + 80, YARD.x1 - 80); m.ty = rand(YARD.y0 + 80, YARD.y1 - 60); } } }
    const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy);
    if (m.target && d < 40 && m.peckCD <= 0) { m.peck = 0.35; m.hit = false; m.peckCD = 0.8; m.face = dx >= 0 ? 1 : -1; }
    else if (d > 6) { m.x += dx / d * sp * dt; m.y += dy / d * sp * dt; m.moving = true; if (Math.abs(dx) > 4) m.face = dx > 0 ? 1 : -1; }
    else m.moving = false;
    if (m.fat >= 6 && !m.target) { m.mode = 'lay'; m.layT = 2.2; mangoSay(L('꼬꼬댁! 꼬꼬댁!', 'Bawk bawk BAWK!'), 2); [600, 700, 650, 900].forEach((f, i) => tone(f, 0.12, 'square', 0.05, f * 1.2, i * 0.15)); }
  }
  m.x = clamp(m.x, YARD.x0 + 30, YARD.x1 - 30); m.y = clamp(m.y, YARD.y0 + 40, YARD.y1 - 10);
  if (m.moving) m.walk += dt * (m.target ? 16 : 10);
  }
  // ----- 도마뱀 · 지네 -----
  for (const c of critters) {
    if (c.dead) continue;
    if (c.kind === 'lizard') {
      c.flee = Math.max(0, c.flee - dt);
      if (!c.tail) { c.tailT -= dt; if (c.tailT <= 0) c.tail = true; }
      c.idle -= dt;
      if (c.idle <= 0 || c.flee > 0) {
        let tgt = null, bd = 420;
        if (c.flee <= 0) { for (const n of nutrients) { const d = dist(c.x, c.y, n.x, n.y); if (d < bd) { bd = d; tgt = n; } } for (const e of eggs) { const d = dist(c.x, c.y, e.x, e.y); if (d < bd) { bd = d; tgt = e; } } }
        if (c.flee > 0) c.ang = Math.atan2(c.y - worm.y, c.x - worm.x) + Math.sin(time * 6) * 0.3;
        else if (tgt) c.ang = Math.atan2(tgt.y - c.y, tgt.x - c.x);
        else if (Math.random() < dt) c.ang += rand(-1.5, 1.5);
        const sp = c.flee > 0 ? 300 : 190;
        c.x += Math.cos(c.ang) * sp * dt; c.y += Math.sin(c.ang) * sp * dt; c.walk += dt * 22;
        if (c.idle < -rand(0.8, 1.6) && c.flee <= 0) c.idle = rand(0.8, 2.2);
        if (tgt && dist(c.x, c.y, tgt.x, tgt.y) < 22) {
          const ni = nutrients.indexOf(tgt), ei = eggs.indexOf(tgt);
          if (ni >= 0) { nutrients.splice(ni, 1); if (!demo) floatText(c.x, c.y - 20, L('🦎 도마뱀이 먹이를 훔쳤어요!', '🦎 A lizard stole the food!'), '#e8f5e9', 15); }
          if (ei >= 0) { eggs.splice(ei, 1); if (!demo) floatText(c.x, c.y - 20, L('🦎 도마뱀이 달걀을 훔쳐 먹었어요!', '🦎 A lizard ate the egg!'), '#e8f5e9', 15); }
          c.idle = rand(1, 2);
        }
      }
      if (!demo && c.flee <= 0 && dist(c.x, c.y, worm.x, worm.y) < 30) {
        c.flee = 2.5;
        if (c.tail) { c.tail = false; c.tailT = 20; tails.push({ x: c.x - Math.cos(c.ang) * 20, y: c.y - Math.sin(c.ang) * 20, t: 5, ph: 0 });
          floatText(c.x, c.y - 26, L('도마뱀이 꼬리를 끊고 도망쳤어요!', 'The lizard dropped its tail and ran!'), '#fff', 16); }
      }
    } else { // 지네
      c.biteCD = Math.max(0, c.biteCD - dt); c.wob += dt * 5;
      const dw = dist(c.x, c.y, worm.x, worm.y), hunt = !demo && dw < 280 && worm.dive <= 0 && c.biteCD <= 0;
      const want = hunt ? Math.atan2(worm.y - c.y, worm.x - c.x) : c.ang + Math.sin(c.wob * 0.7) * 0.6 * dt * 4;
      c.ang += clamp(angNorm(want - c.ang), -2.5 * dt, 2.5 * dt);
      const sp = hunt ? 105 : 70;
      c.x += Math.cos(c.ang) * sp * dt; c.y += Math.sin(c.ang) * sp * dt; c.walk += dt * 30;
      c.trail.unshift({ x: c.x, y: c.y }); if (c.trail.length > 46) c.trail.length = 46;
      if (!demo && dw < 26 && c.biteCD <= 0) {
        if (worm.superT > 0) { eatCritter(c, null); floatText(c.x, c.y - 20, L('슈퍼 꿈틀이가 지네를 물리쳤다!', 'Super Wiggles beat the centipede!'), '#fff59d', 16); addScore(150); continue; }
        if (worm.invul <= 0) {
          c.biteCD = 4; const cut = Math.max(0, Math.min(3, worm.len - 6)); worm.len -= cut; worm.stun = 1.8; worm.invul = 1;
          const lose = Math.min(score, 100); score -= lose; hudDirty = true; SFX.hurt(); shake = 8;
          floatText(worm.x, worm.y - 30, L(`지네에게 물렸어요! 독 때문에 느려져요 -${lose}점`, `Centipede bite! Poison slows you -${lose}`), '#ffccbc', 18);
        }
      }
    }
    if (c.x < YARD.x0 || c.x > YARD.x1) c.ang = Math.PI - c.ang;
    if (c.y < YARD.y0 || c.y > YARD.y1) c.ang = -c.ang;
    c.x = clamp(c.x, YARD.x0, YARD.x1); c.y = clamp(c.y, YARD.y0, YARD.y1);
  }
  critters = critters.filter(c => !c.dead);
  // ----- 잘린 꼬리 -----
  for (const tl of tails) { tl.t -= dt; tl.ph += dt * 20; if (!demo && dist(tl.x, tl.y, worm.x, worm.y) < 28) { tl.t = 0; addScore(100); floatText(tl.x, tl.y - 16, L('꼬리 발견! +100', 'Found a tail! +100'), '#fff', 16); } }
  tails = tails.filter(t => t.t > 0);
  // ----- 달걀 -----
  for (const e of eggs) {
    e.t -= dt;
    if (!demo && dist(e.x, e.y, worm.x, worm.y) < 30) { // 꿈틀이가 깸 → 달걀 껍질 칼슘
      e.dead = true; addFert(e.x, e.y, 4, 0.55); addScore(200); burst(e.x, e.y, 22, ['#fffde7', '#ffe082', '#ffffff'], 200); SFX.quest();
      let msg = L('🥚 달걀 껍질 칼슘! 흙이 좋아졌어요 +200', '🥚 Eggshell calcium! Richer soil +200');
      if (Math.random() < 0.35) { const k = pick(['speed', 'dive', 'super']); giveItem(k); msg += ' ' + ITEMS[k].emoji; }
      floatText(e.x, e.y - 24, msg, '#fffde7', 17); stats.eggs = (stats.eggs || 0) + 1;
    } else if (e.t <= 0) {
      e.dead = true;
      if (chicks.length < 3) { chicks.push({ x: e.x, y: e.y, ang: 0, walk: 0, peck: 0, tx: e.x, ty: e.y, t: 0 }); floatText(e.x, e.y - 24, L('🐣 병아리가 태어났어요! 벌레를 잡아 줄 거예요', '🐣 A chick hatched! It will catch bugs for you'), '#fff59d', 17); tone(1400, 0.1, 'sine', 0.06, 1800); tone(1600, 0.1, 'sine', 0.06, 2000, 0.12); }
      else { addFert(e.x, e.y, 3, 0.4); }
    }
  }
  eggs = eggs.filter(e => !e.dead);
  // ----- 병아리 (지네·도마뱀만 잡는 도우미) -----
  for (const ch of chicks) {
    ch.peck = Math.max(0, ch.peck - dt);
    let tgt = null, bd = 220;
    for (const c of critters) { const d = dist(ch.x, ch.y, c.x, c.y); if (d < bd) { bd = d; tgt = c; } }
    let tx, ty, sp;
    if (tgt) { tx = tgt.x; ty = tgt.y; sp = 150; if (bd < 22) { eatCritter(tgt, ch); ch.peck = 0.3; } }
    else { ch.t -= dt; if (ch.t <= 0) { ch.t = rand(1, 3); ch.tx = mango.x + rand(-90, 90); ch.ty = mango.y + rand(10, 70); } tx = ch.tx; ty = ch.ty; sp = 90; }
    const dx = tx - ch.x, dy = ty - ch.y, d = Math.hypot(dx, dy);
    if (d > 4) { ch.x += dx / d * sp * dt; ch.y += dy / d * sp * dt; ch.walk += dt * 18; ch.ang = dx >= 0 ? 1 : -1; }
  }
  critters = critters.filter(c => !c.dead);
  // 첫 두더지 등장 때 이이제이 힌트
  if (!demo && !mangoTipShown && mole.state === 'chase') { mangoTipShown = true; setTimeout(() => banner(L('💡 두더지를 닭 망고 앞으로 유인해 보세요! 망고가 쪼아 줄지도?', '💡 Lure the mole in front of Mango the hen — she might peck it!'), 3), 2500); }
}
function mangoFindTarget(demo) {
  const m = mango, cands = [];
  const inFront = (x, y, r) => { const dx = x - m.x, dy = y - m.y; return Math.hypot(dx, dy) < r && dx * m.face > -40; };
  for (const c of critters) if (inFront(c.x, c.y, 260)) cands.push({ kind: c.kind, ref: c, x: c.x, y: c.y, pri: 4 });
  if (mole.state === 'chase' && inFront(mole.x, mole.y, 280)) cands.push({ kind: 'mole', x: mole.x, y: mole.y, pri: 3 });
  if (!demo && worm.dive <= 0 && worm.superT <= 0 && m.wormCD <= 0 && inFront(worm.x, worm.y, 200)) cands.push({ kind: 'worm', x: worm.x, y: worm.y, pri: 2 });
  if (Math.random() < 0.4) for (const n of nutrients) if (inFront(n.x, n.y, 150)) cands.push({ kind: 'food', ref: n, x: n.x, y: n.y, pri: 1 });
  if (!cands.length) return null;
  cands.sort((a, b) => b.pri - a.pri || dist(a.x, a.y, m.x, m.y) - dist(b.x, b.y, m.x, m.y));
  const t = cands[0];
  if (t.kind === 'worm') { t.x = worm.x; t.y = worm.y; }
  if (t.kind === 'mole') { t.x = mole.x; t.y = mole.y; }
  if (!m.target || m.target.kind !== t.kind) { m.t = 0; if (t.kind === 'worm') mangoSay(L('꼬꼬! 지렁이다!', 'Bawk! A worm!')); if (t.kind === 'mole') mangoSay(L('꼬꼬꼬! 이 녀석!', 'BAWK! You!')); }
  return t;
}
function mangoPeckHit(demo) {
  const m = mango, t = m.target; if (!t) return;
  const bx = m.x + m.face * 40, by = m.y - 6;
  floatText(bx, by - 30, L('콕!', 'Peck!'), '#fff', 18); CLUCK();
  if ((t.kind === 'lizard' || t.kind === 'centipede') && !t.ref.dead && dist(bx, by, t.ref.x, t.ref.y) < 60) { eatCritter(t.ref, m); m.target = null; return; }
  if (t.kind === 'mole' && mole.state === 'chase' && dist(bx, by, mole.x, mole.y) < 70) {
    mole.state = 'leave'; mole.t = 1; mole.caught = false; shake = 10; m.fat += 1; m.target = null;
    burst(mole.x, mole.y, 20, ['#fff', '#ffd23f', '#6b4a2c'], 240);
    addScore(300); stats.escapes++; stats.mangoMole = (stats.mangoMole || 0) + 1; questEvent('escape', 1);
    banner(L('🐔 망고가 두더지를 콕! 이이제이 작전 성공! +300', '🐔 Mango pecked the mole! Your plan worked! +300'), 2.8);
    const mx = mole.x, my = mole.y; setTimeout(() => spawnHole(mx, my), 1200);
    return;
  }
  if (t.kind === 'worm' && !demo && worm.dive <= 0 && worm.superT <= 0 && worm.invul <= 0 && dist(bx, by, worm.x, worm.y) < 60) {
    const lose = Math.min(score, 80 + 20 * level); score -= lose; hudDirty = true;
    const cut = Math.max(0, Math.min(2, worm.len - 6)); worm.len -= cut; worm.stun = 0.9; worm.invul = 1.2; shake = 6; SFX.hurt();
    floatText(worm.x, worm.y - 34, L(`망고에게 콕! -${lose}점`, `Pecked by Mango! -${lose}`), '#ffd0d0', 20);
    m.wormCD = 7; m.target = null; mangoSay(L('꼬꼬~ 맛있다', 'Cluck~ tasty'));
    return;
  }
  if (t.kind === 'food' && t.ref && nutrients.includes(t.ref) && dist(bx, by, t.ref.x, t.ref.y) < 60) { nutrients.splice(nutrients.indexOf(t.ref), 1); m.fat += 1; m.target = null; return; }
  m.target = null;
}

// ----- 그리기 -----
function drawLizard(c) {
  ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.ang);
  const sw = Math.sin(c.walk) * 0.5;
  ctx.strokeStyle = '#5d7f2e'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (const [lx, side] of [[8, 1], [8, -1], [-8, 1], [-8, -1]]) { ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx + 6 * Math.cos(side * (1.2 + sw)), side * 10); ctx.stroke(); }
  if (c.tail) { ctx.strokeStyle = '#6f9a3a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.quadraticCurveTo(-24, Math.sin(c.walk * 0.5) * 8, -38, Math.sin(c.walk * 0.5 + 1) * 6); ctx.stroke(); }
  ctx.fillStyle = '#7cb342'; ctx.beginPath(); ctx.ellipse(0, 0, 15, 6.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#8bc34a'; ctx.beginPath(); ctx.ellipse(16, 0, 7, 5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#3e5f1c'; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(i * 6, 0, 1.6, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(19, -3, 1.4, 0, 7); ctx.arc(19, 3, 1.4, 0, 7); ctx.fill();
  ctx.restore();
}
function drawCentipede(c) {
  const tr = c.trail;
  for (let i = Math.min(tr.length - 1, 44); i >= 0; i -= 4) {
    const p = tr[i], q = tr[Math.max(0, i - 2)], a = Math.atan2(q.y - p.y, q.x - p.x), px = -Math.sin(a), py = Math.cos(a), lg = Math.sin(c.walk + i) * 3;
    ctx.strokeStyle = '#5d2e1a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(p.x + px * 9 + lg, p.y + py * 9); ctx.lineTo(p.x - px * 9 - lg, p.y - py * 9); ctx.stroke();
    ctx.fillStyle = i % 8 ? '#a0461f' : '#7a3214'; ctx.beginPath(); ctx.arc(p.x, p.y, 5.5, 0, 7); ctx.fill();
  }
  ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.ang);
  ctx.fillStyle = '#5d2410'; ctx.beginPath(); ctx.arc(2, 0, 6.5, 0, 7); ctx.fill();
  ctx.strokeStyle = '#3e1a0b'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(6, -3); ctx.quadraticCurveTo(14, -10, 18, -12); ctx.moveTo(6, 3); ctx.quadraticCurveTo(14, 10, 18, 12); ctx.stroke();
  ctx.fillStyle = '#ffeb3b'; ctx.beginPath(); ctx.arc(5, -2.5, 1.3, 0, 7); ctx.arc(5, 2.5, 1.3, 0, 7); ctx.fill();
  ctx.restore();
}
function drawChick(ch) {
  const bob = Math.abs(Math.sin(ch.walk)) * 2;
  ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(ch.x, ch.y + 2, 9, 3, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffe14d'; ctx.beginPath(); ctx.arc(ch.x, ch.y - 9 - bob, 9, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(ch.x + ch.ang * 6, ch.y - 17 - bob, 6, 0, 7); ctx.fill();
  ctx.fillStyle = '#ff9800'; ctx.beginPath(); ctx.moveTo(ch.x + ch.ang * 11, ch.y - 18 - bob); ctx.lineTo(ch.x + ch.ang * 16, ch.y - 16 - bob + (ch.peck > 0 ? 3 : 0)); ctx.lineTo(ch.x + ch.ang * 11, ch.y - 14 - bob); ctx.fill();
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(ch.x + ch.ang * 8, ch.y - 18 - bob, 1.3, 0, 7); ctx.fill();
}
function drawEgg(e) {
  const wob = e.t < 6 ? Math.sin(time * 20) * 0.15 : 0;
  ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(wob);
  ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(0, 4, 10, 3.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff8e6'; ctx.beginPath(); ctx.ellipse(0, -8, 9, 12, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#d7c9a8'; ctx.lineWidth = 1; ctx.stroke();
  if (e.t < 12) { ctx.strokeStyle = '#8d6e63'; ctx.beginPath(); ctx.moveTo(-6, -9); ctx.lineTo(-2, -6); ctx.lineTo(1, -10); ctx.lineTo(5, -7); ctx.stroke(); }
  ctx.restore();
}
function drawMango() {
  if (!mangoReady || mango.away) return;
  const m = mango, sc = 1 + Math.min(m.fat, 7) * 0.05, w = 112 * sc, h = w * mangoImg.height / mangoImg.width, legL = m.mode === 'lay' ? 4 : 24;
  const sw = m.moving ? Math.sin(m.walk) * 0.55 : 0;
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(m.x, m.y + 2, w * 0.36, 9, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(m.x, m.y); ctx.scale(m.face, 1);
  // 다리 (사진에서 풀에 가려진 다리를 코드로 다시 그림)
  const hipY = -legL;
  for (const [hx, ph] of [[-w * 0.05, 0], [w * 0.12, Math.PI]]) {
    const a = m.moving ? Math.sin(m.walk + ph) * 0.55 : 0, fx = hx + Math.sin(a) * legL, fy = hipY + Math.cos(a) * legL;
    ctx.strokeStyle = '#e8b04a'; ctx.lineCap = 'round'; ctx.lineWidth = 4.5 * sc;
    ctx.beginPath(); ctx.moveTo(hx, hipY - 4); ctx.lineTo(fx, fy); ctx.stroke();
    ctx.lineWidth = 2.6 * sc; ctx.beginPath();
    ctx.moveTo(fx, fy); ctx.lineTo(fx + 11 * sc, fy + 1); ctx.moveTo(fx, fy); ctx.lineTo(fx + 8 * sc, fy + 5); ctx.moveTo(fx, fy); ctx.lineTo(fx + 3 * sc, fy + 6); ctx.moveTo(fx, fy); ctx.lineTo(fx - 6 * sc, fy + 2); ctx.stroke();
  }
  // 몸 (쪼을 때는 앞으로 숙임)
  const pk = m.peck > 0 ? Math.sin((1 - m.peck / 0.35) * Math.PI) * 0.55 : 0;
  const bob = m.moving ? Math.abs(Math.sin(m.walk)) * 2 : 0;
  ctx.translate(w * 0.1, hipY + 4 - bob); ctx.rotate(pk);
  if (m.zap > 0) ctx.filter = 'brightness(0.45) contrast(1.4)';
  ctx.drawImage(mangoImg, -w * 0.6, -h, w, h);
  ctx.filter = 'none';
  ctx.restore();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (m.sayT > 0 && m.say) { ctx.font = '15px Jua, sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.fillStyle = '#fff'; ctx.strokeText(m.say, m.x, m.y - h - legL - 12); ctx.fillText(m.say, m.x, m.y - h - legL - 12); }
}
function drawGroundCritters() {
  for (const e of eggs) drawEgg(e);
  for (const tl of tails) { ctx.strokeStyle = '#6f9a3a'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(tl.x - 10, tl.y); ctx.quadraticCurveTo(tl.x, tl.y + Math.sin(tl.ph) * 9, tl.x + 12, tl.y + Math.sin(tl.ph + 2) * 5); ctx.stroke(); }
  for (const c of critters) c.kind === 'lizard' ? drawLizard(c) : drawCentipede(c);
  for (const ch of chicks) drawChick(ch);
}
