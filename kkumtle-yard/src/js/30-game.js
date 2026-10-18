'use strict';
// ---------- 12. 퀘스트 & 상장 ----------
let quests = [], questsDone = 0, level = 1, score = 0, combo = 0, comboT = 0;
let stats = {};
const AWARDS = [
  { at: 15, medal: '🌱', name: '새싹 정원사상', text: '메마른 앞마당에 처음으로 새싹이 돋게 하였기에' },
  { at: 30, medal: '🌼', name: '꽃밭 지킴이상', text: '흙을 부드럽게 갈아 마당 곳곳에 꽃을 피웠기에' },
  { at: 45, medal: '🍅', name: '주렁주렁 농부상', text: '토마토와 딸기가 주렁주렁 열리도록 흙을 살렸기에' },
  { at: 60, medal: '🍎', name: '황금 과수원상', text: '사과나무와 복숭아나무를 과일로 가득 채웠기에' },
  { at: 75, medal: '🏆', name: '전설의 지렁이 대상', text: '앞마당 전체를 기름진 낙원으로 바꾸어 놓았기에' }
];
let awardIdx = 0, awardQueue = [];
const QUEST_MAKERS = {
  eat: () => { const t = pickNutrientType(); const n = Math.round(rand(3, 5) + level * 0.8); return { type: 'eat', item: t.id, n, txt: `${t.emoji} ${t.name} ${n}개 먹기` }; },
  dist: () => { const n = 50 * Math.round(rand(2, 4) + level * 0.5); return { type: 'dist', n, txt: `🐛 ${n}m 꿈틀꿈틀 이동하기` }; },
  len: () => { const n = Math.min(MAX_LEN, worm.len + Math.round(rand(5, 8))); return { type: 'len', n, txt: `📏 몸길이 ${n}마디 되기` }; },
  escape: () => ({ type: 'escape', n: 1, txt: '🏃 두더지에게서 끝까지 도망치기' }),
  slap: () => { spawnItem('super'); return { type: 'slap', n: 1, txt: '🦸 슈퍼 꿈틀이로 두더지 혼내주기' }; },
  visit: () => { const p = pick(plants); const n = 25 + level * 5; return { type: 'visit', n, plant: p, txt: `${p.def.fruit} ${p.def.name} 흙 갈아주기 (${n}m)` }; },
  combo: () => { const n = 3 + Math.min(3, level); return { type: 'combo', n, txt: `🔥 연속 먹기 콤보 x${n}` }; },
  dodge: () => ({ type: 'dodge', n: 2, txt: '🐦 버터의 착륙 지점 피하기 x2' })
};
function newQuest() {
  const active = new Set(quests.filter(q => !q.done).map(q => q.type));
  const pool = ['eat', 'eat', 'dist', 'len', 'visit', 'combo', 'escape', 'dodge'];
  if (level >= 2) pool.push('slap');
  let type, tries = 0;
  do { type = pick(pool); tries++; } while (active.has(type) && tries < 20);
  const q = QUEST_MAKERS[type](); q.p = type === 'len' ? worm.len : 0; q.done = false; q.id = Math.random();
  return q;
}
function questEvent(type, amount, extra) {
  for (const q of quests) {
    if (q.done || q.type !== type) continue;
    if (type === 'eat' && q.item !== extra) continue;
    if (type === 'len' || type === 'combo') q.p = Math.max(q.p, amount); else q.p += amount;
    if (q.p >= q.n) completeQuest(q);
  }
  hudDirty = true;
}
let questCount = 0;
function completeQuest(q) {
  q.done = true; q.p = q.n; questsDone++; questCount++;
  SFX.quest(); addScore(200 * level);
  addFert(worm.x, worm.y, 4, 0.5); burst(worm.x, worm.y, 30, ['#ffd23f', '#9be15d', '#fff'], 260);
  let reward;
  if (questCount % 4 === 0) reward = 'super'; else reward = Math.random() < 0.55 ? 'speed' : (Math.random() < 0.75 ? 'dive' : 'super');
  giveItem(reward);
  banner(`📜 퀘스트 완료! 보상: ${ITEMS[reward].emoji} ${ITEMS[reward].name}`, 2.4);
  if (questsDone % 3 === 0) setTimeout(levelUp, 900);
  setTimeout(() => { const i = quests.indexOf(q); if (i >= 0 && state !== 'title') { quests[i] = newQuest(); hudDirty = true; } }, 1200);
}
function levelUp() {
  if (state === 'title' || state === 'over') return;
  level++; SFX.lvl();
  if (lives < MAX_LIVES && !DIFF.noRefill) { lives++; updateLives(false); }
  banner(L(`🎉 마당 레벨 ${level}! 꿈틀이 회복 · 두더지가 조금 더 빨라져요`, `🎉 Yard level ${level}! +1 Wiggles · the mole got a bit faster`), 2.8);
  hudDirty = true; offerQuiz(['bio','phys','maths'][level % 3]);
  if (level >= 3 && !world.unlocked) { world.unlocked = true; setTimeout(() => openGlobe(true), 2200); }
}
function giveItem(k) {
  if (inv[k] >= 3) { addScore(100); floatText(worm.x, worm.y - 40, '가방이 꽉 찼어요 +100', '#fff', 18); }
  else inv[k]++;
  hudDirty = true;
}
function useItem(k) {
  if (state !== 'play' || inv[k] <= 0) return;
  inv[k]--; hudDirty = true;
  if (k === 'speed') { worm.boost = 4; SFX.speed(); floatText(worm.x, worm.y - 30, '⚡ 스피드 업!', '#fff59d', 24); }
  if (k === 'dive') { worm.dive = 3.5; SFX.dive(); floatText(worm.x, worm.y - 30, '🌀 땅속으로 쏙!', '#d7ccc8', 24); burst(worm.x, worm.y, 18, ['#6b4a2c', '#8a6440']); }
  if (k === 'super') {
    worm.superT = 8; worm.dive = 0; SFX.sup(); flash = 0.35; hitStop = 0.2;
    banner('⭐ 슈퍼 꿈틀이 변신! 두더지를 찾아가 싸대기를!', 2.6);
    burst(worm.x, worm.y, 40, ['#ffd23f', '#ff4d4d', '#fff'], 300);
  }
}
function addScore(n) { score += n > 0 ? Math.round(n * DIFF.scoreMul) : n; hudDirty = true; }
function checkAwards() {
  const pct = fertAvg() * 100;
  while (awardIdx < AWARDS.length && pct >= AWARDS[awardIdx].at) awardQueue.push(awardIdx++);
  if (awardQueue.length && state === 'play') showAward(awardQueue.shift());
}
function showAward(i) {
  const a = AWARDS[i]; stats.awards.push(a.medal);
  state = 'award'; SFX.award();
  const last = i === AWARDS.length - 1;
  $('certCard').innerHTML = `
    <div class="tag">상 장</div>
    <div class="medal">${a.medal}</div>
    <div class="name">${a.name}</div>
    <div class="who">앞마당 지렁이 · 꿈틀이</div>
    <p>위 지렁이는 ${a.text} 이 상장을 드립니다.<br>지금 마당 흙 비옥도 <b>${Math.round(fertAvg() * 100)}%</b>, 열린 과일 <b>${totalFruits}개</b>!</p>
    <div class="from">${new Date().getFullYear()}년 · 앞마당 과일나무 일동</div>
    ${last ? '<p><b>🎊 모든 상을 다 받았어요! 계속 놀면서 최고 점수에 도전해 보세요.</b></p>' : ''}
    <button class="big" id="btnAwardOk">고마워요! 계속 꿈틀</button>`;
  $('award').hidden = false;
  $('btnAwardOk').onclick = () => { $('award').hidden = true; state = 'play'; last_t = performance.now(); if (awardQueue.length) showAward(awardQueue.shift()); };
  $('btnAwardOk').focus();
}

// ---------- 13. HUD(화면 글씨) ----------
let hudDirty = true, hudT = 0;
function updateHUD() {
  $('lvl').textContent = 'Lv.' + level;
  $('score').textContent = score.toLocaleString();
  $('fruit').textContent = '🍎 ' + totalFruits;
  const pct = Math.round(fertAvg() * 100);
  $('fertFill').style.width = pct + '%';
  $('fertTxt').textContent = '흙 비옥도 ' + pct + '%';
  $('lenTxt').textContent = worm.len + '마디';
  $('btnGlobe').hidden = !world.unlocked;
  $('missionRow').hidden = !world.mission;
  if (world.mission) $('missionTxt').textContent = L(`${world.mission.flag} 구조 미션: 흙 ${pct}% / 40%`, `${world.mission.flag} Rescue mission: soil ${pct}% / 40%`);
  $('distTxt').textContent = Math.floor(stats.dist) + 'm 이동';
  $('qdone').textContent = '완료 ' + questsDone;
  $('quests').innerHTML = quests.map(q => {
    const p = Math.min(q.p, q.n), shown = q.type === 'dist' || q.type === 'visit' ? Math.floor(p) : p;
    return `<li class="${q.done ? 'done' : ''}"><span class="qp">${q.done ? '✔' : shown + '/' + q.n}</span>${q.txt}<div class="qb"><i style="width:${p / q.n * 100}%"></i></div></li>`;
  }).join('');
  for (const k of ['speed', 'dive', 'super']) {
    const b = $('it-' + k); b.querySelector('.cnt').textContent = inv[k];
    b.classList.toggle('empty', inv[k] === 0);
    if (k === 'super') b.classList.toggle('ready-super', inv[k] > 0 && (mole.state === 'chase' || mole.state === 'warn'));
  }
  hudDirty = false;
}
// 두 손가락 동시 조작: 다른 손가락이 조이스틱을 잡고 있으면 'click'이 안 생김 → 누르는 순간(pointerdown)에 바로 사용
for (const k of ['speed', 'dive', 'super']) {
  const b = $('it-' + k);
  b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); initAudio(); useItem(k); b.classList.add('press'); setTimeout(() => b.classList.remove('press'), 150); });
  b.addEventListener('click', e => { if (e.detail === 0) useItem(k); e.currentTarget.blur(); }); // 키보드(Enter)용
}

// ---------- 14. 게임 상태 ----------
let state = 'title', time = 0, last_t = performance.now();
let fertCheckT = 0, nutSpawnT = 0, itemSpawnT = 0;
const cam = { x: 0, y: 0 };
function resetGame(demo) {
  resetFert(); resetWorm();
  nutrients = []; mapItems = []; castings = []; particles = []; texts = [];
  for (let i = 0; i < 28; i++) spawnNutrient();
  inv.speed = 1; inv.dive = 1; inv.super = 0;
  level = 1; score = 0; combo = 0; comboT = 0; questsDone = 0; questCount = 0; awardIdx = 0; awardQueue = [];
  stats = { dist: 0, eaten: 0, slaps: 0, escapes: 0, dodges: 0, pecks: 0, awards: [], crows: 0, treats: 0, bosses: 0, rescued: [] };
  Object.assign(world, { unlocked: false, at: HOME, mission: null, rescued: [], sel: null, pendingOpen: false }); applyTheme(null); mode = 'yard'; fl.on = false;
  $('globeUI').hidden = true; $('flyUI').hidden = true; $('btnFire').hidden = false;
  MAX_LIVES = DIFF.lives; lives = MAX_LIVES; ending.bonus = false; $('btnContinue').hidden = true; $('endUI').hidden = true; hole = null; br.on = false; updateLives(false);
  Object.assign(butter, { state: 'none', timer: demo ? 1e9 : 45 });
  Object.assign(mole, { state: 'none', timer: demo ? 1e9 : 30, scale: 1, spin: 0 });
  raining = 0; rainTimer = rand(45, 60);
  itemSpawnT = 8; slapFx = null;
  quests = [];
  if (!demo) for (let i = 0; i < 3; i++) quests.push(newQuest());
  resetCritters(demo); resetWildlife(null); mangoTipShown = false;
  updatePlants(true); hudDirty = true;
  cam.x = worm.x - vw / zoom / 2; cam.y = worm.y - vh / zoom / 2;
}
function startGame() {
  initAudio(); resetGame(false); state = 'play';
  ['title', 'over', 'pause', 'award'].forEach(id => $(id).hidden = true);
  ['hudL', 'hudR', 'items', 'lives'].forEach(id => $(id).hidden = false);
  if (matchMedia('(pointer:coarse)').matches) banner(L('👍 화면 아무 데나 엄지를 대고 밀어 보세요 — 조이스틱처럼 움직여요!', '👍 Put your thumb anywhere and slide — it works like a joystick!'), 4);
  else banner('화면을 누르거나 마우스로 꿈틀이를 움직여 보세요!', 3.5);
  last_t = performance.now();
}
function goTitle() {
  resetGame(true); state = 'title';
  ['over', 'pause', 'award', 'hudL', 'hudR', 'items', 'lives', 'endUI', 'boardOv', 'dexOv', 'looks'].forEach(id => $(id).hidden = true);
  $('title').hidden = false; refreshTitleMeta();
  const best = store.get('worm_best', 0), flags = savedFlags(); $('bestTxt').textContent = (best ? `최고 점수 ${best.toLocaleString()}점` : '') + (flags.length ? L(' · 구조한 나라 ', ' · Rescued ') + flags.join(' ') : '');
}
// 남은 꿈틀이(목숨) 표시: 화면 왼쪽 위 지렁이 아이콘
const WORM_ICON = '<svg viewBox="0 0 36 22" aria-hidden="true"><path d="M4 16 C8 6 13 21 18 12 S26 4 29 9" stroke="currentColor" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="29" cy="9" r="5" fill="currentColor"/><circle cx="30.6" cy="7.8" r="1.7" fill="#fff"/><circle cx="31.1" cy="7.9" r=".85" fill="#222"/></svg>';
$('hudR').querySelector('h3').addEventListener('pointerdown', e => { e.preventDefault(); const m = $('hudR').classList.toggle('mini'); store.set('worm_quest_mini', m); });
if (store.get('worm_quest_mini', false)) $('hudR').classList.add('mini');
function updateLives(anim) {
  const el = $('lives'); let h = '';
  for (let i = 0; i < Math.max(MAX_LIVES, lives); i++) h += `<span class="life${i < lives ? '' : ' lost'}${anim && i === lives ? ' pop' : ''}">${WORM_ICON}</span>`;
  el.innerHTML = h; el.setAttribute('aria-label', L(`남은 꿈틀이 ${lives}`, `${lives} Wiggles left`));
}
function loseLife() { if (window.__godmode) { updateLives(true); return true; } lives = Math.max(0, lives - 1); updateLives(true); return lives > 0; }
let pausedFrom = 'play';
function setPause(p) {
  if (p && (state === 'play' || state === 'flight' || state === 'burrow')) { pausedFrom = state; state = 'pause'; fireHeld = false; $('pause').hidden = false; }
  else if (!p && state === 'pause') { state = pausedFrom; $('pause').hidden = true; last_t = performance.now(); }
}
function gameOver() {
  state = 'over'; const _hp = gamePointsAtEnd(); if (_hp) setTimeout(() => banner(`🏰 ${groupLabel(profile)} +${_hp}`, 3), 300);
  const best = store.get('worm_best', 0), isBest = score > best;
  if (isBest) store.set('worm_best', score);
  $('overTitle').textContent = isBest ? '🎉 새 최고 기록!' : '꿈틀이가 지쳤어요…';
  const rows = [['점수', score.toLocaleString() + '점'], ['흙 비옥도', Math.round(fertAvg() * 100) + '%'], ['열린 과일', totalFruits + '개'],
    ['이동 거리', Math.floor(stats.dist) + 'm'], ['먹은 영양분', stats.eaten + '개'], ['완료한 퀘스트', questsDone + '개'],
    ['두더지 따돌림', stats.escapes + '번'], ['두더지 싸대기', stats.slaps + '번'], ['버터 피하기', stats.dodges + '번'], ['버터에게 콕콕', stats.pecks + '번'], ['받은 상장', stats.awards.join(' ') || '없음'], [L('쫓아낸 까마귀', 'Crows chased off'), stats.crows], [L('두더지 굴 탐험', 'Mole tunnels'), stats.burrows || 0], [L('망고의 이이제이', 'Moles pecked by Mango'), stats.mangoMole || 0], [L('번개 맞음', 'Struck by lightning'), stats.zaps || 0], [L('깨뜨린 달걀', 'Eggs cracked'), stats.eggs || 0], [L('구조한 나라', 'Countries rescued'), stats.rescued.join(' ') || '-']];
  $('overStats').innerHTML = rows.map(r => `<span>${r[0]}</span><b>${r[1]}</b>`).join('');
  $('overBest').textContent = '최고 점수 ' + Math.max(best, score).toLocaleString() + '점';
  $('over').hidden = false; $('items').hidden = true; $('flyUI').hidden = true; $('btnContinue').hidden = true;
  setupNameEntry();
}
function toggleMute() { muted = !muted; store.set('worm_muted', muted); $('btnMute').textContent = muted ? '🔇' : '🔊'; musicVolume(); }
function refreshMusicBtn() { $('btnMusic').style.opacity = music.on ? 1 : 0.4; $('btnMusicT').textContent = music.on ? '🎵 음악 켜짐' : '🎵 음악 꺼짐'; }
function toggleMusic() { music.on = !music.on; store.set('worm_music', music.on); musicStart(); musicVolume(); refreshMusicBtn(); }
$('btnMusic').onclick = e => { toggleMusic(); e.currentTarget.blur(); };
$('btnMusicT').onclick = e => { toggleMusic(); e.currentTarget.blur(); };
refreshMusicBtn();
$('btnGlobe').onclick = e => { e.currentTarget.blur(); if (state === 'play') openGlobe(false); };
$('btnGlobeBack').onclick = () => closeGlobe();
$('btnFly').onclick = () => { if (world.sel) startFlight(world.sel); };
$('btnFlyPause').onclick = e => { e.currentTarget.blur(); setPause(true); };
$('btnGlobeBack').textContent = L('마당으로 돌아가기', 'Back to the yard');
$('fireLbl').textContent = L('발사 (F)', 'FIRE (F)');
$('btnGlobe').setAttribute('aria-label', L('세계 지도', 'World map'));
$('btnFire').setAttribute('aria-label', L('발사', 'Fire'));
$('btnFlyPause').setAttribute('aria-label', L('일시정지', 'Pause'));
(() => { const b = $('btnFire'), on = e => { e.preventDefault(); initAudio(); fireHeld = true; b.classList.add('on'); }, off = () => { fireHeld = false; b.classList.remove('on'); };
  b.addEventListener('pointerdown', on); ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => b.addEventListener(ev, off)); })();
// 첫 터치/클릭/키 입력 때 소리 시작 (브라우저는 사용자가 한 번 눌러야 소리를 허락함)
['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, () => musicStart(), { once: false, passive: true }));
$('btnMute').textContent = muted ? '🔇' : '🔊';
$('btnMute').onclick = e => { toggleMute(); e.currentTarget.blur(); };
$('btnPause').onclick = e => { setPause(true); e.currentTarget.blur(); };
$('btnResume').onclick = () => setPause(false);
$('btnQuit').onclick = goTitle;
$('btnStart').onclick = startGame;
$('btnRetry').onclick = startGame;
$('btnHome').onclick = goTitle;
document.addEventListener('visibilitychange', () => { if (document.hidden) { setPause(true); if (actx) actx.suspend(); } else if (actx) actx.resume(); });

// ---------- 15. 업데이트(매 프레임 계산) ----------
function update(dt, demo) {
  time += dt;
  // --- 지렁이 방향 정하기 ---
  let target = null;
  if (demo) {
    let best = null, bd = 1e9;
    for (const n of nutrients) { const d = dist(worm.x, worm.y, n.x, n.y); if (d < bd) { bd = d; best = n; } }
    if (best) target = Math.atan2(best.y - worm.y, best.x - worm.x) + Math.sin(time * 2) * 0.4;
  } else {
    const kx = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
    const ky = (keys.ArrowDown || keys.KeyS ? 1 : 0) - (keys.ArrowUp || keys.KeyW ? 1 : 0);
    if (kx || ky) target = Math.atan2(ky, kx);
    else if (joy.id !== null) { if (joy.vx * joy.vx + joy.vy * joy.vy > 0.04) target = Math.atan2(joy.vy, joy.vx); }
    else if (pointer.active) {
      const sx = (worm.x - cam.x) * zoom, sy = (worm.y - cam.y) * zoom, dx = pointer.x - sx, dy = pointer.y - sy;
      if (dx * dx + dy * dy > 20 * 20) target = Math.atan2(dy, dx);
    }
  }
  const turn = worm.superT > 0 ? 6.5 : 4.8;
  if (target !== null) { const d = angNorm(target - worm.ang); worm.ang += clamp(d, -turn * dt, turn * dt); }
  const sp = BASE_SPEED * (worm.boost > 0 ? 1.75 : 1) * (worm.superT > 0 ? 1.5 : 1) * (raining > 0 ? 1.15 : 1) * (worm.stun > 0 ? 0.5 : 1) * (worm.zap > 2.5 ? 0 : 1);
  let nx = worm.x + Math.cos(worm.ang) * sp * dt, ny = worm.y + Math.sin(worm.ang) * sp * dt;
  if (target === null) { // 아무것도 안 누르면 벽에서 튕김
    if (nx < YARD.x0 || nx > YARD.x1) worm.ang = Math.PI - worm.ang;
    if (ny < YARD.y0 || ny > YARD.y1) worm.ang = -worm.ang;
  }
  nx = clamp(nx, YARD.x0, YARD.x1); ny = clamp(ny, YARD.y0, YARD.y1);
  const moved = dist(worm.x, worm.y, nx, ny);
  worm.x = nx; worm.y = ny;
  if (moved > 0.5) worm.trail.unshift({ x: nx, y: ny });
  buildSegs();
  // 흙 갈기: 머리가 지나가는 자리가 조금씩 비옥해짐
  addFert(worm.x, worm.y, 1.3, 0.14 * dt * (worm.superT > 0 ? 2 : 1));
  // 분변토(지렁이 똥) — 실제로 흙을 좋게 만드는 지렁이의 선물
  worm.castT -= dt;
  if (worm.castT <= 0 && worm.segs.length > 2) {
    const t = worm.segs[worm.segs.length - 1]; castings.push({ x: t.x, y: t.y, life: 25, r: rand(3, 5) });
    addFert(t.x, t.y, 1, 0.06); worm.castT = 1.5;
  }
  for (const k of ['invul', 'boost', 'dive', 'superT', 'stun']) worm[k] = Math.max(0, worm[k] - dt);
  if (worm.boost > 0 && Math.random() < 0.6) particles.push({ x: worm.x, y: worm.y, vx: rand(-30, 30), vy: rand(-30, 30), life: 0.4, max: 0.4, c: '#fff59d', r: 3 });
  if (worm.superT > 0 && Math.random() < 0.8) particles.push({ x: worm.x + rand(-10, 10), y: worm.y + rand(-10, 10), vx: rand(-40, 40), vy: rand(-60, 0), life: 0.5, max: 0.5, c: pick(['#ffd23f', '#fff', '#ff6b6b']), r: rand(2, 4) });

  if (!demo) {
    stats.dist += moved / M_PX;
    questEvent('dist', moved / M_PX);
    for (const q of quests) if (!q.done && q.type === 'visit' && dist(worm.x, worm.y, q.plant.x, q.plant.y) < 220) { q.p += moved / M_PX; addFert(worm.x, worm.y, 1.5, 0.15 * dt); if (q.p >= q.n) completeQuest(q); }
    questEvent('len', worm.len);
    updateHole(dt);
  }

  // --- 영양분 먹기 ---
  comboT -= dt; if (comboT <= 0) combo = 0;
  for (let i = nutrients.length - 1; i >= 0; i--) {
    const n = nutrients[i]; n.born = Math.min(1, n.born + dt * 3);
    if (dist(worm.x, worm.y, n.x, n.y) < 32) {
      nutrients.splice(i, 1);
      worm.len = Math.min(MAX_LEN, worm.len + 1);
      addFert(n.x, n.y, 2, n.type.fert * 0.6);
      burst(n.x, n.y, 10, ['#9be15d', '#ffd23f', '#8a6440']);
      if (!demo) {
        combo++; comboT = 2.4; const mult = Math.min(5, combo); stats.maxCombo = Math.max(stats.maxCombo || 0, combo);
        const pts = n.type.pts * mult; addScore(pts); stats.eaten++;
        floatText(n.x, n.y - 10, `+${pts}${mult > 1 ? ' 콤보x' + mult : ''}`, mult > 1 ? '#ffe082' : '#fff', mult > 1 ? 22 : 18);
        SFX.eat(Math.min(combo, 8));
        questEvent('eat', 1, n.type.id); questEvent('combo', combo);
      }
    }
  }
  const target_n = raining > 0 ? 48 : 28;
  nutSpawnT -= dt;
  if (nutrients.length < target_n && nutSpawnT <= 0) { spawnNutrient(); nutSpawnT = raining > 0 ? 0.12 : 0.7; }

  if (!demo) {
    // --- 아이템 줍기 ---
    itemSpawnT -= dt;
    if (itemSpawnT <= 0) { if (mapItems.length < 3) spawnItem(); itemSpawnT = rand(10, 16); }
    for (let i = mapItems.length - 1; i >= 0; i--) {
      const it = mapItems[i]; it.life -= dt;
      if (dist(worm.x, worm.y, it.x, it.y) < 36) {
        mapItems.splice(i, 1); giveItem(it.kind); SFX.item();
        floatText(it.x, it.y - 20, ITEMS[it.kind].emoji + ' ' + ITEMS[it.kind].name + ' 획득!', '#fff', 18);
      } else if (it.life <= 0) mapItems.splice(i, 1);
    }
    // --- 두더지 ---
    updateMole(dt);
    updateButter(dt);
    // --- 비 ---
    if (raining > 0) { raining -= dt; addFert(rand(YARD.x0, YARD.x1), rand(YARD.y0, YARD.y1), 1, 0.05); if (raining <= 0) { rainTimer = rand(50, 70); banner('☀️ 비가 그쳤어요', 1.6); } }
    else { rainTimer -= dt; if (rainTimer <= 0) { raining = 18; strikeT = 4; banner('🌧️ 비가 와요! 지렁이 신나는 날 — 영양분이 쏟아져요!', 2.8); setTimeout(() => { if (raining > 0) banner(L('⛈️ 천둥번개! 노란 표시가 뜨면 얼른 피해요', '⛈️ Thunderstorm! Dodge the yellow marks'), 2.6, true); }, 3200); } }
    // --- 비옥도/과일/상장 ---
    fertCheckT -= dt;
    if (fertCheckT <= 0) { fertCheckT = 0.5; updatePlants(false); checkAwards(); checkMission(); hudDirty = true; }
  }

  updateCritters(dt, demo);
  if (!demo) updateWildlife(dt);
  for (let i = castings.length - 1; i >= 0; i--) { castings[i].life -= dt; if (castings[i].life <= 0) castings.splice(i, 1); }
  for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94; if (p.life <= 0) particles.splice(i, 1); }
  for (let i = texts.length - 1; i >= 0; i--) { const t = texts[i]; t.life -= dt; t.y -= 28 * dt; if (t.life <= 0) texts.splice(i, 1); }
  if (slapFx) { slapFx.t -= dt; if (slapFx.t <= 0) slapFx = null; }
  shake = Math.max(0, shake - dt * 30); flash = Math.max(0, flash - dt);

  // --- 카메라 ---
  const viewW = vw / zoom, viewH = vh / zoom;
  const tx = viewW >= W ? (W - viewW) / 2 : clamp(worm.x - viewW / 2, 0, W - viewW);
  const ty = viewH >= H ? (H - viewH) / 2 : clamp(worm.y - viewH / 2, 0, H - viewH);
  const k = Math.min(1, dt * 5); cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
}
