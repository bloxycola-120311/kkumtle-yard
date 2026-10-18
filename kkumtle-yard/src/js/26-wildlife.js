'use strict';
// ---------- 10-4. 나라별 동물 · 메뚜기 떼 · 천둥번개 ----------
// 다른 나라 마당에서는 망고 대신 그 나라 동물들이 등장해 각자 역할을 함.
//  호주: 캥거루(만지면 주머니에 태워 깡총깡총 → 착지할 때마다 흙이 갈림), 코알라(나무 위에서 자다가 유칼립투스 잎을 떨어뜨림)
//  몽골: 쌍봉낙타(돌아다니며 낙타 똥 거름을 떨어뜨림), 말 떼(가끔 한 줄로 우르르 달려옴 — 부딪히면 뻥! 대신 지나간 길은 흙이 부드러워짐)
//  마다가스카르: 여우원숭이(옆으로 깡충깡충, 먹이를 주워다 꿈틀이에게 선물), 카멜레온(숨어 있다가 혀로 지네·도마뱀을 낚아챔)
//  니제르: 단봉낙타(거름), 기린(나무 잎을 뜯어 먹다 떨어뜨림), 쇠똥구리(경단을 굴림 — 꿈틀이가 건드리면 거름 폭탄)
//  칠레: 라마(앞에 있으면 침 퉤! — 맞으면 잠깐 멈칫), 플라밍고(소금 호수에서 한 발로 서 있음)
// 메뚜기 떼: 가끔 몰려와 나무를 갉아먹어 시들게 함 → 꿈틀이가 시든 나무 주변을 돌며 흙을 살리면 회복. 망고·병아리는 메뚜기를 먹고, 슈퍼 꿈틀이는 떼를 흩어 버림. 비가 오면 도망감.
// 천둥번개: 비 올 때 번개가 칠 자리가 노랗게 표시됨. 가끔은 피하기 힘든 곳에 치기도 함 → 맞으면 뼈가 보이며 지지직! 그다음 숯검댕이.
const LOCAL_ANIMALS = { au: ['kangaroo', 'koala', 'koala'], mn: ['camel2', 'camel2', 'horses'], mg: ['lemur', 'lemur', 'chameleon'], ne: ['camel1', 'giraffe', 'beetle'], cl: ['llama', 'llama', 'flamingo'] };
const DUNG = { id: 'dung', name: L('똥 거름', 'manure'), emoji: '💩', pts: 30, fert: 0.9 };
let animals = [], swarm = null, swarmT = 80, strikes = [], strikeT = 3, scorches = [], spits = [], stampede = null, lightningTip = false;
function resetWildlife(country) {
  animals = []; swarm = null; swarmT = rand(70, 95); strikes = []; scorches = []; spits = []; stampede = null; strikeT = 3;
  mango.away = !!country;
  for (const p of plants) p.wither = 0;
  if (!country) return;
  const trees = plants.filter(p => p.def.kind === 'tree');
  for (const k of LOCAL_ANIMALS[country.id] || []) {
    const a = { k, x: rand(YARD.x0 + 200, YARD.x1 - 200), y: rand(YARD.y0 + 200, YARD.y1 - 150), face: 1, t: rand(0, 3), tx: 0, ty: 0, ph: Math.random() * 6, hop: 0, cd: 0, timer: rand(6, 12) };
    a.tx = a.x; a.ty = a.y;
    if (k === 'koala') { const tr = trees[animals.filter(q => q.k === 'koala').length % trees.length]; a.tree = tr; a.x = tr.x + rand(-20, 20); a.y = tr.y - 70; }
    if (k === 'horses') { a.timer = rand(25, 35); }
    if (k === 'beetle') { a.ball = 10; }
    if (k === 'flamingo') { a.x = YARD.x1 - 220; a.y = YARD.y1 - 160; }
    animals.push(a);
  }
}
const wanderTo = (a, sp, dt, r = 260) => {
  a.t -= dt;
  if (a.t <= 0) { a.t = rand(2, 5); a.tx = clamp(a.x + rand(-r, r), YARD.x0 + 80, YARD.x1 - 80); a.ty = clamp(a.y + rand(-r, r), YARD.y0 + 80, YARD.y1 - 60); }
  const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
  if (d > 4) { a.x += dx / d * sp * dt; a.y += dy / d * sp * dt; if (Math.abs(dx) > 3) a.face = dx > 0 ? 1 : -1; return true; }
  return false;
};
function dropNutrient(type, x, y) { nutrients.push({ x: clamp(x, YARD.x0 + 20, YARD.x1 - 20), y: clamp(y, YARD.y0 + 20, YARD.y1 - 20), type, ph: Math.random() * 6, born: 0 }); }
function updateAnimals(dt) {
  for (const a of animals) {
    a.ph += dt; a.cd = Math.max(0, a.cd - dt);
    if (a.k === 'kangaroo') {
      if (a.hop > 0) { // 깡총 뛰는 중
        a.hop -= dt; const k = 1 - a.hop / 0.55; a.x = lerp(a.hx, a.tx, k); a.y = lerp(a.hy, a.ty, k); a.air = Math.sin(k * Math.PI) * 46;
        if (a.hop <= 0) {
          a.air = 0; burst(a.x, a.y, 6, ['#a1887f', '#d7ccc8'], 90);
          if (a.rider) { addFert(a.x, a.y, 3, 0.3); floatText(a.x, a.y - 70, L('깡총! 흙이 폭신폭신', 'Boing! Soil fluffed up'), '#fff', 15); tone(300, 0.1, 'sine', 0.08, 600); }
        }
      } else {
        a.t -= dt;
        if (a.t <= 0) {
          a.t = a.rider ? 0.15 : rand(0.6, 1.6); a.hx = a.x; a.hy = a.y; a.hop = 0.55;
          let ang = Math.random() * 6.28;
          if (a.rider) { let best = 9, ba = ang; for (let i = 0; i < 6; i++) { const t = Math.random() * 6.28, f = fertAt(a.x + Math.cos(t) * 240, a.y + Math.sin(t) * 240, 1); if (f < best) { best = f; ba = t; } } ang = ba; }
          a.tx = clamp(a.x + Math.cos(ang) * (a.rider ? 230 : 180), YARD.x0 + 60, YARD.x1 - 60); a.ty = clamp(a.y + Math.sin(ang) * (a.rider ? 230 : 180), YARD.y0 + 60, YARD.y1 - 40);
          a.face = a.tx > a.x ? 1 : -1;
        }
      }
      if (a.rider) { // 주머니에 탄 꿈틀이
        a.rideT -= dt; worm.x = a.x + a.face * 6; worm.y = a.y - 30 - (a.air || 0); worm.trail.unshift({ x: worm.x, y: worm.y }); buildSegs();
        if (a.rideT <= 0) { a.rider = false; a.cd = 12; worm.invul = 1; worm.y = a.y + 10; floatText(a.x, a.y - 80, L('캥거루: 잘 가~', 'Kangaroo: See ya~'), '#fff', 15); }
      } else if (a.cd <= 0 && a.hop <= 0 && dist(a.x, a.y - 20, worm.x, worm.y) < 44 && worm.dive <= 0) {
        a.rider = true; a.rideT = 5; a.t = 0.1;
        banner(L('🦘 캥거루 주머니에 쏙! 깡총깡총 흙을 갈아 줘요', '🦘 Into the kangaroo pouch! Boing boing, tilling the soil'), 2.6); SFX.item();
      }
    } else if (a.k === 'koala') {
      a.timer -= dt;
      if (a.timer <= 0) { a.timer = rand(10, 15); dropNutrient(NUTRIENTS[0], a.x + rand(-30, 30), a.y + 110); floatText(a.x, a.y - 30, L('코알라가 유칼립투스 잎을 떨어뜨렸어요', 'The koala dropped a eucalyptus leaf'), '#e8f5e9', 14); }
    } else if (a.k === 'camel1' || a.k === 'camel2') {
      wanderTo(a, 38, dt, 300);
      a.timer -= dt; if (a.timer <= 0) { a.timer = rand(12, 18); dropNutrient(DUNG, a.x - a.face * 30, a.y + 6); floatText(a.x, a.y - 60, L('뿌직! 낙타 똥 거름', 'Plop! Camel manure'), '#d7ccc8', 15); }
    } else if (a.k === 'horses') {
      a.timer -= dt;
      if (a.timer <= 0 && !stampede) {
        a.timer = rand(30, 45);
        const dir = Math.random() < 0.5 ? 1 : -1, y = clamp(worm.y + rand(-60, 60), YARD.y0 + 80, YARD.y1 - 60);
        stampede = { y, dir, warn: 2.3, x: dir > 0 ? YARD.x0 - 200 : YARD.x1 + 200, hit: false };
        banner(L('🐎 말 떼가 달려와요! 빨간 줄에서 비켜요!', '🐎 A herd of horses is coming! Get off the red lane!'), 2.4, true); tone(90, 0.8, 'sawtooth', 0.08, 60);
      }
    } else if (a.k === 'lemur') { // 먹이를 주워다 꿈틀이 근처에 놓아 줌
      if (!a.carry) {
        let best = null, bd = 600; for (const n of nutrients) { const d = dist(a.x, a.y, n.x, n.y); if (d < bd) { bd = d; best = n; } }
        if (best) { a.tx = best.x; a.ty = best.y; if (bd < 24) { nutrients.splice(nutrients.indexOf(best), 1); a.carry = best.type; } }
      } else { a.tx = worm.x + 70; a.ty = worm.y + 40; if (dist(a.x, a.y, a.tx, a.ty) < 30) { dropNutrient(a.carry, a.x, a.y); a.carry = null; floatText(a.x, a.y - 50, L('여우원숭이가 선물을 줬어요!', 'A lemur brought you a gift!'), '#fff59d', 15); a.cd = 6; } }
      if (a.cd <= 0) { const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy); if (d > 4) { const sp = 120 * (0.4 + Math.abs(Math.sin(a.ph * 6))); a.x += dx / d * sp * dt; a.y += dy / d * sp * dt; a.face = dx > 0 ? 1 : -1; } }
    } else if (a.k === 'chameleon') {
      if (!a.tree) { a.tree = pick(plants); a.x = a.tree.x + 50; a.y = a.tree.y + 30; }
      a.tongue = Math.max(0, (a.tongue || 0) - dt);
      if (a.cd <= 0) for (const c of critters) if (!c.dead && dist(a.x, a.y, c.x, c.y) < 170) { a.tongue = 0.3; a.tx2 = c.x; a.ty2 = c.y; eatCritter(c, null); a.cd = 3; floatText(a.x, a.y - 40, L('카멜레온 혀 공격! 쏙!', 'Chameleon tongue! Zip!'), '#f8bbd0', 15); break; }
    } else if (a.k === 'giraffe') {
      if (!a.goal || a.t <= 0) { a.goal = pick(plants.filter(p => p.def.kind === 'tree')); a.t = rand(8, 14); }
      a.t -= dt; const dx = a.goal.x + 60 - a.x, dy = a.goal.y + 20 - a.y, d = Math.hypot(dx, dy);
      if (d > 8) { a.x += dx / d * 45 * dt; a.y += dy / d * 45 * dt; a.face = dx > 0 ? 1 : -1; }
      else { a.timer -= dt; if (a.timer <= 0) { a.timer = rand(5, 8); dropNutrient(NUTRIENTS[0], a.x - 40, a.y + 20); floatText(a.x, a.y - 120, L('기린이 잎을 뜯다 떨어뜨렸어요', 'The giraffe dropped some leaves'), '#e8f5e9', 14); } }
    } else if (a.k === 'beetle') { // 쇠똥구리: 경단을 굴리며 커짐
      wanderTo(a, 30, dt, 200); a.ball = Math.min(26, a.ball + dt * 0.8);
      const bx = a.x + a.face * (a.ball + 10), by = a.y;
      if (a.ball > 12 && dist(bx, by, worm.x, worm.y) < a.ball + 14) {
        addFert(bx, by, 3, 0.5 + a.ball / 60); addScore(150); burst(bx, by, 24, ['#6d4c41', '#8d6e63', '#9be15d'], 220);
        floatText(bx, by - 30, L('쇠똥구리 경단 거름 폭탄! +150', 'Dung-ball fertilizer bomb! +150'), '#fff', 16); a.ball = 4; SFX.quest();
      }
    } else if (a.k === 'llama') {
      const moving = wanderTo(a, 50, dt, 260);
      if (a.cd <= 0 && worm.dive <= 0) {
        const dx = worm.x - a.x, dy = worm.y - a.y, d = Math.hypot(dx, dy);
        if (d < 190 && dx * a.face > 0) { a.cd = 6; a.spitT = 0.25; const sx = a.x + a.face * 26, sy = a.y - 40, ex = worm.x + Math.cos(worm.ang) * 40 - sx, ey = worm.y + Math.sin(worm.ang) * 40 - sy, ed = Math.hypot(ex, ey) || 1; spits.push({ x: sx, y: sy, vx: ex / ed * 460, vy: ey / ed * 460 - 25, t: 1.2 }); floatText(a.x, a.y - 70, L('퉤!', 'Ptooey!'), '#fff', 18); noise(0.12, 0.2); }
      }
      a.spitT = Math.max(0, (a.spitT || 0) - dt); a.moving = moving;
    } else if (a.k === 'flamingo') { if (Math.random() < dt * 0.05) floatText(a.x, a.y - 60, L('끼룩', 'Honk'), '#fce4ec', 14); }
  }
  // 라마 침
  for (const s of spits) {
    s.t -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 150 * dt;
    if (dist(s.x, s.y, worm.x, worm.y) < 22 && worm.invul <= 0) { s.t = 0; worm.stun = 1.4; worm.goo = 2.5; worm.invul = 0.8; floatText(worm.x, worm.y - 30, L('으엑! 라마 침 맞았다', 'Eww! Llama spit!'), '#c5e1a5', 18); tone(200, 0.3, 'sine', 0.08, 90); }
  }
  spits = spits.filter(s => s.t > 0);
  worm.goo = Math.max(0, (worm.goo || 0) - dt);
  // 말 떼
  if (stampede) {
    const s = stampede;
    if (s.warn > 0) s.warn -= dt;
    else {
      s.x += s.dir * 700 * dt;
      addFert(s.x, s.y, 1, 0.05);
      for (let i = 0; i < 4; i++) { const hx = s.x - s.dir * i * 90; if (!s.hit && Math.abs(hx - worm.x) < 40 && Math.abs(worm.y - s.y) < 46 && worm.dive <= 0 && worm.invul <= 0 && worm.superT <= 0) {
        s.hit = true; worm.stun = 1.4; worm.invul = 1.5; const cut = Math.max(0, Math.min(2, worm.len - 6)); worm.len -= cut; const lose = Math.min(score, 80); score -= lose; hudDirty = true;
        worm.spin = 1; shake = 14; SFX.hurt(); floatText(worm.x, worm.y - 40, L(`뻥! 말 발굽에 차였어요 -${lose}점`, `Bonk! Kicked by a hoof -${lose}`), '#ffccbc', 18); } }
      if ((s.dir > 0 && s.x > YARD.x1 + 500) || (s.dir < 0 && s.x < YARD.x0 - 500)) stampede = null;
    }
  }
  worm.spin = Math.max(0, (worm.spin || 0) - dt);
}

// ---- 메뚜기 떼 ----
function startSwarm() {
  const targets = plants.slice().sort(() => Math.random() - 0.5).slice(0, 3), s = edgeSpot();
  swarm = { x: s.x, y: s.y, targets, ti: 0, eatT: 0, hp: 60, bugs: Array.from({ length: 70 }, () => ({ a: Math.random() * 6.28, r: rand(5, 70), sp: rand(2, 5), z: Math.random() })), leaving: false };
  banner(L('🦗 메뚜기 떼가 몰려와요! 나무를 갉아먹을 거예요', '🦗 A locust swarm is coming! It will chew up the trees'), 2.8, true);
  noise(1.2, 0.05);
}
function updateSwarm(dt) {
  if (!swarm) {
    if (level < 2 || raining > 0) return;
    swarmT -= dt; if (swarmT <= 0) { swarmT = rand(80, 110); startSwarm(); }
    return;
  }
  const s = swarm;
  if (raining > 0 && !s.leaving) { s.leaving = true; banner(L('🌧️ 비가 오자 메뚜기 떼가 도망갔어요!', '🌧️ The rain chased the locusts away!'), 2.2); }
  let tx, ty;
  if (s.leaving || s.ti >= s.targets.length) { s.leaving = true; const e = s.exit || (s.exit = edgeSpot()); tx = e.x + (e.x < W / 2 ? -400 : 400); ty = e.y; }
  else { const p = s.targets[s.ti]; tx = p.x; ty = p.y - 30; }
  const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy);
  if (d > 20) { s.x += dx / d * 170 * dt; s.y += dy / d * 170 * dt; }
  else if (!s.leaving) { // 나무를 갉아먹는 중
    const p = s.targets[s.ti]; s.eatT += dt;
    p.wither = Math.min(1, (p.wither || 0) + dt * 0.11); addFert(p.x, p.y, 2, -0.015 * dt);
    if (Math.random() < dt * 8) particles.push({ x: p.x + rand(-40, 40), y: p.y - 40 + rand(-20, 20), vx: rand(-20, 20), vy: rand(20, 60), life: 1.2, max: 1.2, c: '#8d6e3f', r: 3 });
    if (s.eatT > 9) { s.eatT = 0; s.ti++; floatText(p.x, p.y - 90, L('🥀 나무가 시들었어요! 주변 흙을 살려 주세요', '🥀 The tree is wilting! Heal the soil around it'), '#ffe0b2', 16); }
  }
  if ((s.leaving && d < 30) || s.hp <= 0) { if (s.hp <= 0) banner(L('🦗 메뚜기 떼가 사라졌어요!', '🦗 The locust swarm is gone!'), 2); swarm = null; return; }
  // 망고·병아리가 메뚜기를 먹음, 슈퍼 꿈틀이는 떼를 흩어 버림
  if (!mango.away && dist(mango.x, mango.y - 30, s.x, s.y) < 130) { s.hp -= dt * 8; mango.fat += dt * 0.6; if (Math.random() < dt * 3) mangoSay(L('메뚜기 냠냠!', 'Locust snacks!')); }
  for (const ch of chicks) if (dist(ch.x, ch.y, s.x, s.y) < 110) s.hp -= dt * 3;
  if (worm.superT > 0 && dist(worm.x, worm.y, s.x, s.y) < 110 && !s.leaving) { s.leaving = true; addScore(300); banner(L('⭐ 슈퍼 꿈틀이가 메뚜기 떼를 흩어 버렸다! +300', '⭐ Super Wiggles scattered the locusts! +300'), 2.4); }
  for (const b of s.bugs) b.a += b.sp * dt;
}
function updateWither(dt) { // 시든 나무 살리기: 꿈틀이가 주변(130px)에 머물면 회복
  for (const p of plants) {
    if (!(p.wither > 0)) continue;
    const eaten = swarm && !swarm.leaving && swarm.targets[swarm.ti] === p;
    if (!eaten && dist(worm.x, worm.y, p.x, p.y) < 130) {
      p.wither = Math.max(0, p.wither - dt * 0.1); addFert(worm.x, worm.y, 1.2, 0.1 * dt);
      if (Math.random() < dt * 6) particles.push({ x: p.x + rand(-40, 40), y: p.y - 30, vx: 0, vy: -40, life: 0.8, max: 0.8, c: '#9be15d', r: 3 });
      if (p.wither <= 0) { stats.healed = (stats.healed || 0) + 1; addScore(300); SFX.quest(); burst(p.x, p.y - 40, 26, ['#9be15d', '#ffd23f', '#fff'], 220); floatText(p.x, p.y - 100, L(`🌳 ${p.def.name}이(가) 다시 살아났어요! +300`, `🌳 The ${p.def.name} is healthy again! +300`), '#fff', 18); }
    }
  }
}

// ---- 천둥번개 ----
function updateStorm(dt) {
  for (const sc of scorches) sc.t -= dt; scorches = scorches.filter(s => s.t > 0);
  for (const st of strikes) {
    st.t -= dt;
    if (!st.hit && st.t <= 0) { st.hit = true; st.bolt = 0.28; lightningHit(st); }
    if (st.hit) st.bolt -= dt;
  }
  strikes = strikes.filter(s => !s.hit || s.bolt > 0);
  if (raining <= 0) return;
  strikeT -= dt;
  if (strikeT <= 0) {
    strikeT = rand(2.2, 3.8) * DIFF.strike;
    const r = Math.random(); let x, y, warn = 1.2, rad = 60;
    if (r < 0.12) { // 피하기 어려운 번개: 꿈틀이가 갈 곳을 노리고 짧게 예고
      x = worm.x + Math.cos(worm.ang) * 90; y = worm.y + Math.sin(worm.ang) * 90; warn = 0.5; rad = 95;
    } else if (r < 0.35) { x = worm.x; y = worm.y; }
    else { const a = Math.random() * 6.28, d = rand(120, 380); x = worm.x + Math.cos(a) * d; y = worm.y + Math.sin(a) * d; }
    strikes.push({ x: clamp(x, YARD.x0, YARD.x1), y: clamp(y, YARD.y0, YARD.y1), t: warn, max: warn, rad, hit: false, path: null });
  }
}
function lightningHit(st) {
  flash = 0.35; shake = 12;
  const pts = []; let y = st.y - 900, x = st.x + rand(-60, 60);
  while (y < st.y) { pts.push([x, y]); y += rand(50, 90); x += rand(-45, 45); }
  pts.push([st.x, st.y]); st.path = pts;
  const dly = Math.min(0.6, dist(st.x, st.y, worm.x, worm.y) / 1500);
  noise(0.25, 0.4); setTimeout(() => { tone(55, 1.2, 'sawtooth', 0.12, 30); noise(1.0, 0.18); }, dly * 1000);
  scorches.push({ x: st.x, y: st.y, t: 6 });
  addFert(st.x, st.y, 2, 0.3);
  if (!lightningTip) { lightningTip = true; setTimeout(() => banner(L('⚡ 번개는 공기 속 질소를 흙에 넣어 줘요. 번개 맞은 자리는 흙이 좋아져요!', '⚡ Lightning puts nitrogen from the air into the soil. The spot it hits gets richer!'), 3.2), 900); }
  burst(st.x, st.y, 20, ['#fff59d', '#ffffff', '#90caf9'], 260);
  if (dist(st.x, st.y, worm.x, worm.y) < st.rad && worm.dive <= 0) {
    if (worm.superT > 0) { worm.superT += 3; floatText(worm.x, worm.y - 40, L('⚡ 슈퍼 충전! +3초', '⚡ Super recharge! +3s'), '#fff59d', 20); }
    else {
      worm.zap = 3.5; worm.invul = 3.5; const cut = Math.max(0, Math.min(1, worm.len - 6)); worm.len -= cut; const lose = Math.min(score, 50); score -= lose; hudDirty = true;
      stats.zaps = (stats.zaps || 0) + 1;
      tone(70, 1.0, 'sawtooth', 0.1, 75); for (let i = 0; i < 8; i++) tone(rand(600, 1400), 0.05, 'square', 0.04, 0, i * 0.11);
      floatText(worm.x, worm.y - 50, L(`지지지지직!! -${lose}점`, `BZZZZT!! -${lose}`), '#fff59d', 26);
    }
  }
  if (!mango.away && dist(st.x, st.y, mango.x, mango.y) < st.rad + 20) { mango.zap = 2.5; mangoSay(L('꼬꼬댁!!! 뜨거워!', 'BAWWK!!! Hot hot!'), 2); }
  for (const c of critters) if (!c.dead && dist(st.x, st.y, c.x, c.y) < st.rad) eatCritter(c, null);
}
function updateWildlife(dt) {
  updateAnimals(dt); updateSwarm(dt); updateWither(dt); updateStorm(dt);
  mango.zap = Math.max(0, (mango.zap || 0) - dt);
  worm.zap = Math.max(0, (worm.zap || 0) - dt);
}

// ---- 그리기 ----
function drawAnimalsGround() {
  for (const sc of scorches) { ctx.globalAlpha = Math.min(1, sc.t / 2) * 0.5; ctx.fillStyle = '#2b2b2b'; ctx.beginPath(); ctx.ellipse(sc.x, sc.y, 38, 22, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
  for (const st of strikes) if (!st.hit) { // 번개 칠 자리 표시
    const k = Math.max(0, st.t) / st.max, fl = Math.floor(time * 12) % 2;
    ctx.fillStyle = `rgba(255,235,59,${0.15 + (1 - k) * 0.25})`; ctx.beginPath(); ctx.arc(st.x, st.y, st.rad, 0, 7); ctx.fill();
    ctx.strokeStyle = fl ? '#fff59d' : '#fbc02d'; ctx.lineWidth = 4; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.arc(st.x, st.y, st.rad, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(st.x, st.y, st.rad * k, 0, 7); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; emoji('⚡', st.x, st.y, 30);
  }
  if (stampede) { // 말 떼 경로
    const s = stampede;
    ctx.fillStyle = `rgba(229,57,53,${s.warn > 0 ? 0.18 + 0.12 * Math.sin(time * 14) : 0.1})`; ctx.fillRect(YARD.x0 - 40, s.y - 46, YARD.x1 - YARD.x0 + 80, 92);
    if (s.warn > 0) { ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (let x = YARD.x0 + 100; x < YARD.x1; x += 260) emoji(s.dir > 0 ? '➡️' : '⬅️', x, s.y, 28); }
  }
  for (const a of animals) if (a.k === 'flamingo') { ctx.fillStyle = 'rgba(225,240,245,.85)'; ctx.beginPath(); ctx.ellipse(a.x, a.y + 10, 110, 40, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(a.x - 30, a.y + 4, 40, 10, 0, 0, 7); ctx.fill(); }
}
function animalEmoji(a, e, size, lift = 0) {
  ctx.save(); ctx.translate(a.x, a.y - size * 0.45 - lift); ctx.scale(-a.face, 1); // 이모지는 보통 왼쪽을 봄
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; emoji(e, 0, 0, size); ctx.restore();
}
function drawAnimals() {
  for (const a of animals) {
    if (a.k !== 'koala') { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(a.x, a.y + 2, a.k === 'giraffe' ? 34 : 22, 7, 0, 0, 7); ctx.fill(); }
    if (a.k === 'kangaroo') { animalEmoji(a, '🦘', 60, a.air || 0); if (a.rider) { ctx.textAlign = 'center'; emoji('🪱', a.x + a.face * 8, a.y - 32 - (a.air || 0), 18); } }
    else if (a.k === 'koala') { animalEmoji(a, '🐨', 34); ctx.font = '14px Jua, sans-serif'; ctx.fillStyle = '#e3f2fd'; ctx.fillText('z', a.x + 18, a.y - 40 - (time * 10 % 20)); }
    else if (a.k === 'camel1') animalEmoji(a, '🐪', 64, Math.abs(Math.sin(a.ph * 4)) * 2);
    else if (a.k === 'camel2') animalEmoji(a, '🐫', 64, Math.abs(Math.sin(a.ph * 4)) * 2);
    else if (a.k === 'lemur') { animalEmoji(a, '🐒', 40, Math.abs(Math.sin(a.ph * 6)) * 16); if (a.carry) { ctx.textAlign = 'center'; emoji(a.carry.emoji, a.x, a.y - 60 - Math.abs(Math.sin(a.ph * 6)) * 16, 20); } }
    else if (a.k === 'chameleon') {
      ctx.globalAlpha = 0.45 + 0.25 * Math.sin(a.ph); animalEmoji(a, '🦎', 36); ctx.globalAlpha = 1;
      if (a.tongue > 0) { ctx.strokeStyle = '#ec407a'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a.x, a.y - 16); ctx.lineTo(lerp(a.x, a.tx2, a.tongue / 0.3), lerp(a.y - 16, a.ty2, a.tongue / 0.3)); ctx.stroke(); }
    }
    else if (a.k === 'giraffe') animalEmoji(a, '🦒', 96, Math.abs(Math.sin(a.ph * 3)) * 2);
    else if (a.k === 'beetle') { const bx = a.x + a.face * (a.ball + 10); ctx.fillStyle = '#6d4c41'; ctx.beginPath(); ctx.arc(bx, a.y - a.ball * 0.6, a.ball * 0.7, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.beginPath(); ctx.arc(bx - 3, a.y - a.ball * 0.8, a.ball * 0.25, 0, 7); ctx.fill(); animalEmoji(a, '🪲', 24); }
    else if (a.k === 'llama') { animalEmoji(a, '🦙', 58, a.moving ? Math.abs(Math.sin(a.ph * 6)) * 3 : 0); }
    else if (a.k === 'flamingo') animalEmoji(a, '🦩', 54, Math.sin(a.ph) * 2);
  }
  for (const s of spits) { ctx.fillStyle = 'rgba(200,230,170,.9)'; ctx.beginPath(); ctx.arc(s.x, s.y, 7, 0, 7); ctx.arc(s.x - s.vx * 0.02, s.y - s.vy * 0.02, 5, 0, 7); ctx.fill(); }
  if (stampede && stampede.warn <= 0) for (let i = 0; i < 4; i++) {
    const hx = stampede.x - stampede.dir * i * 90; ctx.save(); ctx.translate(hx, stampede.y - 30 - Math.abs(Math.sin(time * 18 + i)) * 10); ctx.scale(-stampede.dir, 1); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; emoji('🐎', 0, 0, 64); ctx.restore();
    if (Math.random() < 0.5) particles.push({ x: hx, y: stampede.y + rand(-10, 10), vx: -stampede.dir * rand(40, 120), vy: rand(-40, 0), life: 0.6, max: 0.6, c: '#a1887f', r: rand(3, 6) });
  }
}
function drawSkyStuff() { // 메뚜기 떼 · 번개 줄기 (나무보다 위)
  if (swarm) {
    const s = swarm;
    for (const b of s.bugs) { const r = b.r * (s.hp / 60 * 0.5 + 0.5), x = s.x + Math.cos(b.a) * r, y = s.y + Math.sin(b.a * 1.3) * r * 0.6 - 20; ctx.fillStyle = b.z > 0.5 ? '#7c8b2a' : '#5d6b1a'; ctx.beginPath(); ctx.ellipse(x, y, 5, 2.4, b.a, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 3, y - 2); ctx.lineTo(x + 2, y - 5 * Math.abs(Math.sin(time * 40 + b.a))); ctx.stroke(); }
  }
  for (const st of strikes) if (st.hit && st.path) {
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 7; ctx.shadowColor = '#90caf9'; ctx.shadowBlur = 20; ctx.beginPath();
    st.path.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = '#e3f2fd'; ctx.stroke(); ctx.shadowBlur = 0;
  }
}
// 감전된 꿈틀이: 처음 1초는 뼈가 보이며 번쩍번쩍, 그다음은 숯검댕이 + 연기 + 뻗친 머리
function drawZappedWorm() {
  const z = worm.zap; if (z <= 0) return false;
  const segs = worm.segs, n = segs.length, shock = z > 2.5, skel = shock && Math.floor(time * 14) % 2 === 0;
  const jx = () => shock ? rand(-3, 3) : 0;
  for (let i = n - 1; i >= 0; i--) {
    const s = segs[i], r = lerp(13, 6, i / Math.max(1, n - 1));
    const x = s.x + jx(), y = s.y + jx();
    ctx.fillStyle = skel ? '#111' : shock ? '#fff59d' : '#4a3b35';
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    if (skel) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - r * 0.6, y); ctx.lineTo(x + r * 0.6, y); ctx.moveTo(x, y - r * 0.6); ctx.lineTo(x, y + r * 0.6); ctx.stroke(); }
  }
  const hx = worm.x, hy = worm.y;
  if (skel) { // 해골 얼굴
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx, hy, 9, 0, 7); ctx.fill();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2; for (const sx of [-4, 4]) { ctx.beginPath(); ctx.moveTo(hx + sx - 2, hy - 4); ctx.lineTo(hx + sx + 2, hy); ctx.moveTo(hx + sx + 2, hy - 4); ctx.lineTo(hx + sx - 2, hy); ctx.stroke(); }
  } else { // 뻗친 머리 + 하얀 눈
    ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(hx + i * 3, hy - 10); ctx.lineTo(hx + i * 5, hy - 22 - Math.abs(i) * -1 + (i % 2) * 4); ctx.stroke(); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx - 4, hy - 2, 3.4, 0, 7); ctx.arc(hx + 4, hy - 2, 3.4, 0, 7); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(hx - 4, hy - 2, 1.4, 0, 7); ctx.arc(hx + 4, hy - 2, 1.4, 0, 7); ctx.fill();
    if (Math.random() < 0.25) particles.push({ x: hx + rand(-8, 8), y: hy - 14, vx: rand(-10, 10), vy: -50, life: 1, max: 1, c: 'rgba(120,120,120,.7)', r: rand(4, 7) });
  }
  if (shock) { // 전기 줄기
    ctx.strokeStyle = Math.random() < 0.5 ? '#e3f2fd' : '#fff59d'; ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) { ctx.beginPath(); let px = hx + rand(-20, 20), py = hy + rand(-20, 20); ctx.moveTo(px, py); for (let j = 0; j < 4; j++) { px += rand(-14, 14); py += rand(-14, 14); ctx.lineTo(px, py); } ctx.stroke(); }
  }
  return true;
}
function drawMangoZap() { // 망고 감전: 깃털이 부스스 + 연기
  if (!(mango.zap > 0) || mango.away) return;
  if (Math.random() < 0.3) particles.push({ x: mango.x + rand(-30, 30), y: mango.y - 70, vx: rand(-30, 30), vy: -40, life: 1, max: 1, c: Math.random() < 0.5 ? 'rgba(120,120,120,.7)' : '#fffde7', r: rand(3, 6) });
}
