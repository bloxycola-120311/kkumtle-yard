'use strict';
// ---------- 20. 엔딩 & 명예의 전당(순위표) ----------
// 엔딩: 5개 나라를 모두 구하면 → 초록으로 변한 지구 위로 불꽃놀이 + 동물 친구들 퍼레이드 + 엔딩 크레딧
//       → 엔딩 보너스 +10,000 → 이름 등록 → 계속 놀기(끝없는 모드) 또는 처음으로
// 순위표: 이 기기(브라우저)에 상위 10개 기록 저장. 게임이 끝나면 10위 안에 들 때 이름을 적을 수 있음.
const BOARD_KEY = 'worm_board_v1';
const boardLoad = () => { const b = store.get(BOARD_KEY, []); return Array.isArray(b) ? b : []; };
function boardQualifies(sc) { const b = boardLoad(); return sc > 0 && (b.length < 10 || sc > b[b.length - 1].score); }
function boardAdd(name) {
  const b = boardLoad(), d = new Date();
  const entry = { name: (name || '').trim().slice(0, 12) || L('꿈틀이', 'Wiggles'), score, flags: (stats.rescued || []).join(''), lv: level, ending: !!stats.ending, diff: DIFF.icon,
    date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, id: Date.now() };
  b.push(entry); b.sort((x, y) => y.score - x.score); const top = b.slice(0, 10); store.set(BOARD_KEY, top); store.set('worm_name', entry.name);
  return top.findIndex(e => e.id === entry.id);
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function renderBoard(el, hi = -1) {
  const b = boardLoad();
  if (!b.length) { el.innerHTML = `<li class="empty">${L('아직 기록이 없어요. 첫 번째 주인공이 되어 보세요!', 'No records yet. Be the first!')}</li>`; return; }
  const medal = i => ['🥇', '🥈', '🥉'][i] || `${i + 1}`;
  el.innerHTML = b.map((e, i) => `<li class="${i === hi ? 'me' : ''}"><span class="rk">${medal(i)}</span><span class="nm">${e.diff || ''} ${esc(e.name)}${e.ending ? ' 🌍' : ''}<small>${esc(e.flags || '')} Lv.${e.lv} · ${esc(e.date)}</small></span><b>${Number(e.score).toLocaleString()}</b></li>`).join('');
}
let boardSaved = false;
function setupNameEntry() { // 게임 오버/엔딩 화면에 이름 칸 준비
  boardSaved = false;
  const ok = boardQualifies(score);
  $('nameRow').hidden = !ok;
  $('nameHint').textContent = ok ? L('🏆 순위에 들었어요! 이름을 적어 주세요', '🏆 You made the board! Enter your name') : L('🏆 명예의 전당', '🏆 Hall of Fame');
  $('nameIn').value = store.get('worm_name', '');
  renderBoard($('boardList'));
  if (ok) setTimeout(() => { try { $('nameIn').focus(); } catch (e) {} }, 300);
}
function saveName() {
  if (boardSaved) return; boardSaved = true;
  const i = boardAdd($('nameIn').value);
  $('nameRow').hidden = true; $('nameHint').textContent = i >= 0 ? L(`🎉 ${i + 1}위로 등록했어요!`, `🎉 Saved at #${i + 1}!`) : L('🏆 명예의 전당', '🏆 Hall of Fame');
  renderBoard($('boardList'), i); SFX.quest();
}
$('btnSaveName').textContent = L('등록', 'Save');
$('statSum').textContent = L('📊 이번 게임 기록 보기', '📊 This game\'s stats');
$('nameIn').placeholder = L('이름 (12자까지)', 'Your name (max 12)');
$('btnContinue').textContent = L('♾️ 계속 놀기', '♾️ Keep playing');
$('btnBoardT').textContent = L('🏆 순위', '🏆 Ranking');
$('btnBoardClose').textContent = L('닫기', 'Close');
$('boardTitle').textContent = L('🏆 명예의 전당', '🏆 Hall of Fame');
$('btnSkipEnd').textContent = L('건너뛰기 ▶', 'Skip ▶');
$('btnSaveName').onclick = saveName;
$('nameIn').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); saveName(); } });
$('btnBoardT').onclick = () => { renderBoard($('boardList2')); $('boardOv').hidden = false; };
$('btnBoardClose').onclick = () => { $('boardOv').hidden = true; };

// ---- 엔딩 ----
const ending = { t: 0, fw: [], fwT: 0, done: false, bonus: false };
const PARADE = ['🦘', '🐨', '🐫', '🐎', '🐒', '🦎', '🐪', '🦒', '🪲', '🦙', '🦩', '🐥', '🐥'];
function creditLines() {
  return [
    ['h', L('꿈틀이의 앞마당', "Wiggles' Front Yard")],
    ['p', L('메마른 땅 다섯 곳이 모두 다시 초록빛이 되었어요', 'All five dry lands are green again')],
    ['s', ''],
    ['p', `${L('구조한 나라', 'Countries rescued')}  ${(stats.rescued || []).join(' ')}`],
    ['p', `${L('점수', 'Score')}  ${score.toLocaleString()}`],
    ['p', `${L('완료한 퀘스트', 'Quests done')}  ${questsDone}  ·  ${L('쫓아낸 까마귀', 'Crows chased off')}  ${stats.crows || 0}`],
    ['p', `${L('두더지 굴 탐험', 'Mole tunnels')}  ${stats.burrows || 0}  ·  ${L('번개 맞음', 'Lightning hits')}  ${stats.zaps || 0}`],
    ['s', ''],
    ['h2', L('출연', 'Starring')],
    ['p', L('꿈틀이 · 앵무새 버터 · 닭 망고 · 두더지', 'Wiggles · Butter the cockatiel · Mango the hen · the Mole')],
    ['p', L('까마귀 대장 까옥이 · 그리고 세계의 동물 친구들', 'Captain Caw · and animal friends around the world')],
    ['s', ''],
    ['h2', L('만든 사람', 'Made by')],
    ['p', 'Patrick & Henry'],
    ['s', ''],
    ['p', L('지렁이는 정말로 흙을 살리는 일꾼이에요.', 'Earthworms really do bring soil back to life.')],
    ['p', L('오늘 마당에서 지렁이를 만나면 인사해 주세요 🪱', 'Say hi if you meet one in your yard today 🪱')]
  ];
}
function startEnding() {
  $('award').hidden = true; ['hudL', 'hudR', 'items', 'flyUI', 'globeUI'].forEach(id => $(id).hidden = true);
  world.sel = null; stats.ending = true;
  if (!ending.bonus) { ending.bonus = true; addScore(10000); }
  mode = 'ending'; state = 'ending'; Object.assign(ending, { t: 0, fw: [], fwT: 0, done: false, lines: creditLines() });
  $('endUI').hidden = false;
}
function updateEnding(dt) {
  time += dt; ending.t += dt; world.gLon += dt * 18; world.gLat += (15 - world.gLat) * Math.min(1, dt);
  ending.fwT -= dt;
  if (ending.fwT <= 0) { // 불꽃놀이
    ending.fwT = rand(0.25, 0.6); const x = rand(0.1, 0.9) * vw, y = rand(0.08, 0.45) * vh, hue = Math.floor(rand(0, 360));
    for (let i = 0; i < 40; i++) { const a = i / 40 * 6.283, s = rand(80, 220); ending.fw.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.9, 1.5), c: `hsl(${hue + rand(-20, 20)},90%,65%)` }); }
    tone(rand(500, 900), 0.15, 'sine', 0.03, rand(1000, 1600)); noise(0.15, 0.06);
  }
  for (const p of ending.fw) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 90 * dt; p.vx *= 0.99; }
  ending.fw = ending.fw.filter(p => p.life > 0);
  if (ending.t > 30 && !ending.done) finishEnding();
}
function renderEnding() {
  renderGlobe(); // 초록 지구 (모든 나라에 ✅)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (const p of ending.fw) { ctx.globalAlpha = Math.min(1, p.life); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, 2.6, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
  // 퍼레이드: 버터, 망고, 꿈틀이, 그리고 동물 친구들이 화면 아래를 행진
  const gy = vh - 46, sp = 70, span = (PARADE.length + 4) * 64;
  const off = (ending.t * sp) % (span + vw) - span;
  let x = off;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(40,120,50,.85)'; ctx.fillRect(0, gy + 18, vw, vh - gy);
  const hop = i => -Math.abs(Math.sin(ending.t * 6 + i)) * 10;
  for (let i = 0; i < 3; i++) { ctx.fillStyle = i % 2 ? '#ee8f96' : '#e57f88'; ctx.beginPath(); ctx.arc(x - i * 11, gy + 6 + hop(0) * 0.5, 11 - i, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(x + 4, gy + 2, 2, 0, 7); ctx.fill();
  x -= 80;
  if (butterReady) { const w = 90, h = w * butterImg.height / butterImg.width; ctx.drawImage(butterImg, x - w / 2, gy - h / 2 - 20 + Math.sin(ending.t * 8) * 6, w, h); }
  x -= 100;
  if (mangoReady) { const w = 80, h = w * mangoImg.height / mangoImg.width; ctx.drawImage(mangoImg, x - w / 2, gy + 12 - h + hop(2) * 0.4, w, h); }
  x -= 80;
  PARADE.forEach((e, i) => { ctx.save(); ctx.translate(x - i * 64, gy + hop(i + 3)); ctx.scale(-1, 1); emoji(e, 0, 0, 40); ctx.restore(); });
  // 엔딩 크레딧 (아래에서 위로)
  const lh = 34, top = vh * 0.62 - ending.t * 38;
  ending.lines.forEach(([k, t], i) => {
    const y = top + i * lh; if (y < -40 || y > vh - 80) return;
    ctx.font = k === 'h' ? `${Math.min(46, vw / 12)}px Jua, sans-serif` : k === 'h2' ? '22px Jua, sans-serif' : '17px "Gowun Dodum", Jua, sans-serif';
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.65)'; ctx.fillStyle = k === 'h' ? '#ffe082' : k === 'h2' ? '#a5d6a7' : '#fff';
    ctx.strokeText(t, vw / 2, y); ctx.fillText(t, vw / 2, y);
  });
}
function finishEnding() {
  ending.done = true; $('endUI').hidden = true; prof.endings++; saveProf(); discover('earth');
  state = 'over';
  $('overTitle').textContent = L('🌍 지구를 살렸어요! 엔딩 보너스 +10,000', '🌍 You saved the Earth! Ending bonus +10,000');
  $('overStats').innerHTML = [[L('최종 점수', 'Final score'), score.toLocaleString()], [L('구조한 나라', 'Countries rescued'), (stats.rescued || []).join(' ')], [L('완료한 퀘스트', 'Quests done'), questsDone], [L('받은 상장', 'Awards'), stats.awards.join(' ') || '-']]
    .map(r => `<span>${r[0]}</span><b>${r[1]}</b>`).join('');
  const best = store.get('worm_best', 0); if (score > best) store.set('worm_best', score);
  $('overBest').textContent = L('최고 점수 ', 'Best score ') + Math.max(best, score).toLocaleString();
  $('btnContinue').hidden = false; $('over').hidden = false;
  setupNameEntry();
}
function continueEndless() { // 엔딩 뒤에도 계속 놀기
  $('over').hidden = true; $('btnContinue').hidden = true; $('endUI').hidden = true;
  mode = 'yard'; state = 'play'; ['hudL', 'hudR', 'items', 'lives'].forEach(id => $(id).hidden = false);
  banner(L('♾️ 끝없는 모드! 최고 점수에 도전해 보세요', '♾️ Endless mode! Go for the high score'), 3);
  hudDirty = true; last_t = performance.now();
}
$('btnContinue').onclick = continueEndless;
$('btnSkipEnd').onclick = () => { if (!ending.done) finishEnding(); };
