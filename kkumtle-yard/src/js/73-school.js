'use strict';
// ---------- 22-2. 학교 모드: 프로필(학년·반·하우스) · 버터 교수님 퀴즈 · 하우스 대항전 ----------
// - 처음 시작할 때 닉네임/학년/반(Year 7–8) 또는 하우스(Shell 이상)를 고름 → 그 학년 수준의 문제가 나옴
// - 퀴즈는 '쉬는 순간'에만 나옴(나라 도착 · 구조 성공 · 굴 보물 · 레벨업). 건너뛸 수 있고, 틀려도 벌칙 없음
// - 하우스 점수 = 퀴즈 정답(하루 20점까지) + 게임 성적(하루 15점까지) → 매주 월요일 새로 시작
// - 온라인(Supabase) 주소가 설정되면 모든 학생 기록이 모여 대항전 그래프가 됨. 설정 전에는 이 기기 기록만 보임
const SCHOOL = {
  years: [
    { id: 'Y7', name: 'Year 7', band: 'prep', group: 'class' }, { id: 'Y8', name: 'Year 8', band: 'prep', group: 'class' },
    { id: 'Shell', name: 'Shell (Y9)', band: 'shell', group: 'house' }, { id: 'Remove', name: 'Remove (Y10)', band: 'igcse', group: 'house' },
    { id: 'Hundred', name: 'Hundred (Y11)', band: 'igcse', group: 'house' }, { id: 'L6', name: 'Lower Sixth', band: 'sixth', group: 'house' }, { id: 'U6', name: 'Upper Sixth', band: 'sixth', group: 'house' }
  ],
  classes: [1, 2, 3],
  // 시니어 하우스 10개 (학교 홈페이지 기준: 데이 6 + 보딩 4). 색은 게임용으로 임의 지정(실제 하우스 색 아님)
  houses: ['Bickerton', 'Butler', 'Honan', 'Morley', 'Munawir Hill', 'Sheppard', 'Steel', 'Thompson', 'Wallace', 'Wills'],
  // 하우스 색 (패트릭 확인): 두 색 하우스는 줄무늬로 표시
  houseColors: {
    Bickerton: ['#f07c1a'], Butler: ['#2e9e44'], Honan: ['#2e9e44', '#f2c21b'], Morley: ['#f07c1a'], 'Munawir Hill': ['#f2c21b', '#d62828'],
    Sheppard: ['#2e9e44'], Steel: ['#d62828'], Thompson: ['#ec5fa4'], Wallace: ['#ec5fa4'], Wills: ['#4fb3e8', '#d62828']
  },
  api: { url: '', key: '' } // ✏️ 온라인 대항전: Supabase 주소와 공개(anon/publishable) 키
};
const houseFill = h => { const c = SCHOOL.houseColors[h] || ['#4f8a3a']; return c.length > 1 ? `repeating-linear-gradient(135deg,${c[0]} 0 10px,${c[1]} 10px 20px)` : c[0]; };
const SUBJECT_NAMES = { bio: 'Biology', chem: 'Chemistry', phys: 'Physics', geo: 'Geography', maths: 'Maths' };
const SUBJECT_ICONS = { bio: '🌱', chem: '⚗️', phys: '⚡', geo: '🌍', maths: '➗' };
const DAY_QUIZ_CAP = 20, DAY_GAME_CAP = 15;
let profile = store.get('worm_profile_school', null);
if (!profile || !profile.id) profile = null;
// 예전 자리표시 하우스(House 1–4)로 저장된 프로필은 다시 고르게 함
if (profile && SCHOOL.years.find(y => y.id === profile.year)?.group === 'house' && !SCHOOL.houses.includes(profile.house)) profile = null;
const yearOf = id => SCHOOL.years.find(y => y.id === id);
const groupLabel = p => !p ? '' : yearOf(p.year)?.group === 'class' ? `${p.year.replace('Y', '')}-${p.cls}` : p.house;

// ---- 프로필 ----
function openProfile(after) {
  const p = profile || { nick: store.get('worm_name', ''), year: 'Y7', cls: 1, house: SCHOOL.houses[0] };
  const draft = { ...p };
  const render = () => {
    const y = yearOf(draft.year);
    $('pfYears').innerHTML = SCHOOL.years.map(v => `<button class="chip${v.id === draft.year ? ' on' : ''}" data-y="${v.id}">${v.name}</button>`).join('');
    $('pfGroupH').textContent = y.group === 'class' ? L('반', 'Class') : L('하우스', 'House');
    $('pfGroup').innerHTML = y.group === 'class'
      ? SCHOOL.classes.map(c => `<button class="chip${c === draft.cls ? ' on' : ''}" data-c="${c}">${draft.year.replace('Y', '')}-${c}</button>`).join('')
      : SCHOOL.houses.map((h, i) => `<button class="chip${h === draft.house ? ' on' : ''}" data-h="${esc(h)}" style="--hc:${houseFill(h)}"><i class="hdot"></i>${esc(h)}</button>`).join('');
    $('pfYears').querySelectorAll('.chip').forEach(b => b.onclick = () => { draft.year = b.dataset.y; render(); });
    $('pfGroup').querySelectorAll('.chip').forEach(b => b.onclick = () => { if (b.dataset.c) draft.cls = +b.dataset.c; else draft.house = b.dataset.h; render(); });
  };
  $('pfNick').value = draft.nick || ''; render();
  $('profileOv').hidden = false;
  $('btnPfSave').onclick = () => {
    const nick = $('pfNick').value.trim().slice(0, 12);
    if (!nick) { $('pfNick').focus(); $('pfNick').classList.add('bad'); return; }
    profile = { ...draft, nick, id: (profile && profile.id) || (Date.now().toString(36) + Math.random().toString(36).slice(2, 8)) };
    store.set('worm_profile_school', profile); store.set('worm_name', nick);
    $('profileOv').hidden = true; refreshProfileLine(); if (after) after();
  };
  $('btnPfSkip').onclick = () => { $('profileOv').hidden = true; if (after) after(); };
  $('btnPfSkip').hidden = !after;
}
function refreshProfileLine() {
  $('btnProfileT').textContent = profile ? `👤 ${profile.nick} · ${yearOf(profile.year)?.name.split(' (')[0]} · ${groupLabel(profile)}` : L('👤 학년·반 정하기', '👤 Set your year & class');
}

// ---- 하우스 점수 기록 (이 기기) ----
const weekKey = () => { const d = new Date(); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
function ledger() { const l = store.get('worm_ledger', {}); if (l.week !== weekKey()) return { week: weekKey(), day: todayStr(), quizDay: 0, gameDay: 0, quizWeek: 0, gameWeek: 0, answered: 0, correct: 0 }; if (l.day !== todayStr()) { l.day = todayStr(); l.quizDay = 0; l.gameDay = 0; } return l; }
function addHousePoints(kind, pts, extra) {
  if (!profile || pts <= 0) return 0;
  const l = ledger(); let got = 0;
  if (kind === 'quiz') { got = Math.min(pts, DAY_QUIZ_CAP - l.quizDay); l.quizDay += got; l.quizWeek += got; }
  else { got = Math.min(pts, DAY_GAME_CAP - l.gameDay); l.gameDay += got; l.gameWeek += got; }
  store.set('worm_ledger', l);
  if (got > 0) apiCall('add_points', { p_player: profile.id, p_nick: profile.nick, p_year: profile.year, p_group: groupLabel(profile), p_kind: kind, p_points: got, p_extra: extra || null });
  return got;
}
function gamePointsAtEnd() { // 게임이 끝날 때: 점수 3,000점당 1점 + 구조한 나라 2점씩 + 엔딩 5점
  const pts = Math.floor(score / 3000) + (stats.rescued || []).length * 2 + (stats.ending ? 5 : 0);
  return addHousePoints('game', pts, { score });
}

// ---- 온라인 연결 (설정 전에는 아무것도 하지 않음) ----
async function apiCall(fn, body) {
  if (!SCHOOL.api.url || !SCHOOL.api.key) return null;
  try {
    const r = await fetch(`${SCHOOL.api.url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: SCHOOL.api.key, Authorization: `Bearer ${SCHOOL.api.key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
    if (!r.ok) return null; return await r.json();
  } catch (e) { return null; }
}

// ---- 버터 교수님 퀴즈 ----
let quizQueue = null, quizBack = null, quizCur = null;
function pickQuestion(subject) {
  const band = profile ? yearOf(profile.year)?.band : 'prep';
  let pool = QUIZ_BANK.map((q, i) => ({ ...q, i })).filter(q => q.b === band);
  if (subject && pool.some(q => q.s === subject)) pool = pool.filter(q => q.s === subject);
  const seen = store.get('worm_quiz_seen', []);
  const fresh = pool.filter(q => !seen.includes(q.i));
  const list = fresh.length ? fresh : pool;
  const q = list[Math.floor(Math.random() * list.length)];
  store.set('worm_quiz_seen', [...seen.filter(i => i !== q.i), q.i].slice(-120));
  return q;
}
function offerQuiz(subject) { if (profile) quizQueue = { subject }; } // 다음에 쉬는 순간(마당 플레이 중)에 나옴
function maybeShowQueuedQuiz() { if (quizQueue && state === 'play' && mode === 'yard') { const s = quizQueue.subject; quizQueue = null; setTimeout(() => { if (state === 'play') openQuiz(s); }, 600); } }
function openQuiz(subject) {
  const q = pickQuestion(subject); quizCur = q;
  quizBack = state; if (state === 'play' || state === 'flight' || state === 'burrow') state = 'quiz';
  const opts = q.a.map((t, k) => ({ t, ok: k === 0 })).sort(() => Math.random() - 0.5);
  $('qzSub').innerHTML = `${SUBJECT_ICONS[q.s]} ${SUBJECT_NAMES[q.s]} · ${profile ? yearOf(profile.year).name : ''}`;
  $('qzQ').textContent = q.q;
  $('qzOpts').innerHTML = opts.map((o, k) => `<button class="qopt" data-k="${k}">${esc(o.t)}</button>`).join('');
  $('qzFeed').hidden = true; $('btnQzNext').hidden = true; $('btnQzSkip').hidden = false;
  $('qzOpts').querySelectorAll('.qopt').forEach(b => b.onclick = () => answerQuiz(opts, +b.dataset.k));
  $('quizOv').hidden = false; tone(1500, 0.1, 'sine', 0.06, 2100);
}
function answerQuiz(opts, k) {
  const ok = opts[k].ok, l = ledger(); l.answered++; if (ok) l.correct++; store.set('worm_ledger', l);
  $('qzOpts').querySelectorAll('.qopt').forEach((b, i) => { b.disabled = true; if (opts[i].ok) b.classList.add('right'); else if (i === k) b.classList.add('wrong'); });
  let msg;
  if (ok) {
    addScore(500); const hp = addHousePoints('quiz', 1, { q: quizCur.i });
    stats.quizRight = (stats.quizRight || 0) + 1; SFX.quest();
    msg = `✅ ${L('정답!', 'Correct!')} +500${hp ? ` · 🏰 ${groupLabel(profile)} +${hp}` : (profile ? ` · ${L('오늘 하우스 점수 한도 도달', 'Daily house cap reached')}` : '')}`;
  } else { SFX.sad(); msg = `💡 ${L('아쉬워요! 다음엔 맞힐 거예요', 'Not quite — next time!')}`; }
  $('qzFeed').innerHTML = `<b>${msg}</b><br>${esc(quizCur.e)}`;
  $('qzFeed').hidden = false; $('btnQzNext').hidden = false; $('btnQzSkip').hidden = true; $('btnQzNext').focus();
}
function closeQuiz() { $('quizOv').hidden = true; if (state === 'quiz') state = quizBack || 'play'; else if (state === 'pause') $('pause').hidden = false; last_t = performance.now(); }
$('btnQzNext').onclick = closeQuiz; $('btnQzSkip').onclick = closeQuiz;

// ---- 하우스 대항전 ----
let boardTab = 'house';
async function openHouseBoard() {
  $('houseOv').hidden = false; await renderHouseBoard();
}
async function renderHouseBoard() {
  const l = ledger(), online = !!(SCHOOL.api.url && SCHOOL.api.key);
  document.querySelectorAll('#houseTabs .chip').forEach(b => b.classList.toggle('on', b.dataset.t === boardTab));
  let rows = null;
  if (online) rows = await apiCall(boardTab === 'house' ? 'board_houses' : boardTab === 'class' ? 'board_classes' : 'board_players', { p_week: l.week });
  let html = '';
  if (boardTab === 'me') {
    html = `<div class="mine"><b>${profile ? `${esc(profile.nick)} · ${esc(groupLabel(profile))}` : L('프로필을 먼저 정해 주세요', 'Set your profile first')}</b>
      <p>${L('이번 주 내가 보탠 점수', 'My points this week')}: <b>${l.quizWeek + l.gameWeek}</b> (${L('퀴즈', 'Quiz')} ${l.quizWeek} · ${L('게임', 'Game')} ${l.gameWeek})</p>
      <p>${L('오늘', 'Today')}: ${L('퀴즈', 'Quiz')} ${l.quizDay}/${DAY_QUIZ_CAP} · ${L('게임', 'Game')} ${l.gameDay}/${DAY_GAME_CAP}</p>
      <p>${L('이번 주 정답률', 'Accuracy this week')}: ${l.answered ? Math.round(l.correct / l.answered * 100) : 0}% (${l.correct}/${l.answered})</p></div>`;
  } else {
    let data;
    if (rows && rows.length) data = rows.map(r => ({ name: r.name, pts: r.points }));
    else if (boardTab === 'house') data = SCHOOL.houses.map(h => ({ name: h, pts: profile && profile.house === h && yearOf(profile.year).group === 'house' ? l.quizWeek + l.gameWeek : 0 }));
    else if (boardTab === 'class') data = ['Y7', 'Y8'].flatMap(y => SCHOOL.classes.map(c => ({ name: `${y.replace('Y', '')}-${c}`, pts: profile && profile.year === y && profile.cls === c ? l.quizWeek + l.gameWeek : 0 })));
    else data = profile ? [{ name: `${profile.nick} (${groupLabel(profile)})`, pts: l.quizWeek + l.gameWeek }] : [];
    data.sort((a, b) => b.pts - a.pts);
    const max = Math.max(1, ...data.map(d => d.pts));
    html = data.length ? data.map((d, i) => { const col = houseFill(d.name);
      return `<div class="hbar"><span class="hn">${d.pts > 0 && ['🥇', '🥈', '🥉'][i] || i + 1} ${esc(d.name)}</span><span class="ht"><i style="width:${d.pts / max * 100}%;background:${col}"></i></span><b>${d.pts}</b></div>`; }).join('') : `<p>${L('아직 기록이 없어요', 'No records yet')}</p>`;
  }
  $('houseBody').innerHTML = html;
  $('houseNote').textContent = online ? L('매주 월요일에 새로 시작해요 · 퀴즈는 하루 20점, 게임은 하루 15점까지 하우스 점수로 들어가요', 'Resets every Monday · up to 20 quiz points and 15 game points per day count')
    : L('⚠️ 아직 온라인 연결 전이라 이 기기 기록만 보여요. 연결되면 모든 학생의 점수가 모여요.', '⚠️ Not online yet, so only this device is shown. Once connected, everyone\'s points add up.');
}
document.querySelectorAll('#houseTabs .chip').forEach(b => b.onclick = () => { boardTab = b.dataset.t; renderHouseBoard(); });
$('btnHouseClose').onclick = () => { $('houseOv').hidden = true; };
$('btnHouseT').onclick = openHouseBoard;
$('btnProfileT').onclick = () => openProfile(null);
$('btnQuizP').onclick = () => { if (!profile) { $('pause').hidden = true; openProfile(() => { $('pause').hidden = false; }); return; } $('pause').hidden = true; openQuiz(null); };
// 라벨
$('pfTitle').textContent = L('👤 나는 누구?', '👤 Who are you?');
$('pfNickH').textContent = L('닉네임 (실명 대신 별명을 써 주세요)', 'Nickname (please use a nickname, not your real name)');
$('pfNick').placeholder = L('예: 꿈틀대장', 'e.g. WormKing');
$('pfYearH').textContent = L('학년', 'Year');
$('btnPfSave').textContent = L('저장하고 시작', 'Save & start');
$('btnPfSkip').textContent = L('나중에', 'Later');
$('qzTitle').textContent = L('🦜 버터 교수님의 퀴즈', "🦜 Professor Butter's Quiz");
$('btnQzSkip').textContent = L('건너뛰기', 'Skip');
$('btnQzNext').textContent = L('계속하기', 'Continue');
$('houseTitle').textContent = L('🏰 이번 주 대항전', '🏰 This week\'s contest');
$('btnHouseT').textContent = L('🏰 대항전', '🏰 Houses');
$('btnHouseClose').textContent = L('닫기', 'Close');
$('btnQuizP').textContent = L('📚 퀴즈 한 문제', '📚 One quiz question');
document.querySelector('#houseTabs [data-t="house"]').textContent = L('하우스', 'Houses');
document.querySelector('#houseTabs [data-t="class"]').textContent = L('Year 7·8 반', 'Year 7–8 classes');
document.querySelector('#houseTabs [data-t="players"]').textContent = L('개인', 'Players');
document.querySelector('#houseTabs [data-t="me"]').textContent = L('내 기여', 'Me');
$('btnStart').onclick = () => profile ? startGame() : openProfile(startGame);
refreshProfileLine();
