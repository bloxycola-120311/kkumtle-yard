'use strict';
// ---------- 21. 다시 하고 싶게 만드는 장치들 ----------
// ① 난이도(쉬움·보통·어려움)  ② 나라별 별 평가(⭐ 구조 · ⭐ 3분 안에 · ⭐ 꿈틀이를 하나도 안 잃고)
// ③ 오늘의 도전(날짜마다 바뀜, 성공하면 +2000)  ④ 도감(만난 친구·보물 모으기)  ⑤ 꾸미기(색·모자, 조건을 채우면 열림)
// 모두 이 기기(브라우저)에 저장됨.

// ---- ① 난이도 ----
const DIFFS = {
  easy: { icon: '🌱', name: L('쉬움', 'Easy'), mole: 0.85, lives: 5, butter: 1.4, strike: 1.5, fly: 1.35, burrowV: -40, cpEvery: 2, scoreMul: 0.8 },
  normal: { icon: '🙂', name: L('보통', 'Normal'), mole: 1, lives: 3, butter: 1, strike: 1, fly: 1, burrowV: 0, cpEvery: 4, scoreMul: 1 },
  hard: { icon: '🔥', name: L('어려움', 'Hard'), mole: 1.12, lives: 3, butter: 0.8, strike: 0.75, fly: 0.8, burrowV: 35, cpEvery: 5, scoreMul: 1.3, noRefill: true }
};
let diffKey = DIFFS[store.get('worm_diff', 'normal')] ? store.get('worm_diff', 'normal') : 'normal';
let DIFF = DIFFS[diffKey];
function buildDiffRow() {
  $('diffRow').innerHTML = Object.entries(DIFFS).map(([k, d]) => `<button class="dbtn${k === diffKey ? ' on' : ''}" data-k="${k}">${d.icon} ${d.name}</button>`).join('');
  $('diffRow').querySelectorAll('.dbtn').forEach(b => b.onclick = () => { diffKey = b.dataset.k; DIFF = DIFFS[diffKey]; store.set('worm_diff', diffKey); buildDiffRow(); SFX.item(); });
  $('diffNote').textContent = { easy: L('꿈틀이 5마리 · 적이 느려요 · 점수 ×0.8', '5 lives · slower enemies · score ×0.8'), normal: L('꿈틀이 3마리 · 기본', '3 lives · standard'), hard: L('레벨업 회복 없음 · 적이 빨라요 · 점수 ×1.3', 'No refills · faster enemies · score ×1.3') }[diffKey];
}

// ---- 기록 저장소 ----
const prof = Object.assign({ endings: 0, dailyDone: 0, burrowDone: 0 }, store.get('worm_profile', {}));
const saveProf = () => store.set('worm_profile', prof);
const starMap = store.get('worm_stars', {});
const totalStars = () => Object.values(starMap).reduce((s, v) => s + v, 0);

// ---- ② 나라별 별 평가 ----
function rateRescue(c) {
  const secs = time - (world.missionStart || time), fast = secs <= 180, safe = lives >= (world.livesAtDepart || 0);
  const n = 1 + (fast ? 1 : 0) + (safe ? 1 : 0);
  const prev = starMap[c.id] || 0; if (n > prev) { starMap[c.id] = n; store.set('worm_stars', starMap); }
  const m = Math.floor(secs / 60), s = Math.floor(secs % 60);
  return { n, isBest: n > prev, html: `<div class="stars">${'⭐'.repeat(n)}${'<span class="off">⭐</span>'.repeat(3 - n)}</div>
    <ul class="crit"><li>✅ ${L('구조 성공', 'Rescued')}</li><li>${fast ? '✅' : '⬜'} ${L(`3분 안에 (${m}분 ${s}초)`, `Within 3 min (${m}:${String(s).padStart(2, '0')})`)}</li><li>${safe ? '✅' : '⬜'} ${L('꿈틀이를 하나도 안 잃고', 'Without losing a Wiggles')}</li></ul>
    ${n > prev && prev ? `<p><b>${L('🎉 별 기록 갱신!', '🎉 New star record!')}</b></p>` : ''}` };
}

// ---- ③ 오늘의 도전 ----
const DAILY = [
  { ko: '두더지를 3번 따돌리기', en: 'Escape the mole 3 times', ok: () => stats.escapes >= 3 },
  { ko: '망고가 두더지를 쪼게 만들기', en: 'Get Mango to peck the mole', ok: () => (stats.mangoMole || 0) >= 1 },
  { ko: '까마귀 30마리 쫓아내기', en: 'Chase off 30 crows', ok: () => (stats.crows || 0) >= 30 },
  { ko: '두더지 굴 끝까지 가기', en: 'Finish a mole tunnel', ok: () => (stats.burrowsDone || 0) >= 1 },
  { ko: '달걀 2개 깨기', en: 'Crack 2 eggs', ok: () => (stats.eggs || 0) >= 2 },
  { ko: '시든 나무 2그루 살리기', en: 'Heal 2 wilted trees', ok: () => (stats.healed || 0) >= 2 },
  { ko: '한 마당의 흙을 50%까지 살리기', en: 'Get one yard to 50% soil', ok: () => mode === 'yard' && fertAvg() >= 0.5 },
  { ko: '콤보 x5 만들기', en: 'Hit a x5 combo', ok: () => (stats.maxCombo || 0) >= 5 },
  { ko: '마당 레벨 4 달성', en: 'Reach yard level 4', ok: () => level >= 4 },
  { ko: '번개를 한 번도 안 맞고 나라 1곳 구하기', en: 'Rescue a country without being struck by lightning', ok: () => (stats.rescued || []).length >= 1 && !(stats.zaps > 0) },
  { ko: '슈퍼 꿈틀이로 두더지 2번 혼내주기', en: 'Slap the mole twice as Super Wiggles', ok: () => stats.slaps >= 2 },
  { ko: '버터의 착륙을 3번 피하기', en: 'Dodge Butter\'s landing 3 times', ok: () => stats.dodges >= 3 }
];
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
function todayDaily() { const s = todayStr(); let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 100003; return DAILY[h % DAILY.length]; }
const dailyDoneToday = () => store.get('worm_daily_date', '') === todayStr();
function showDailyBox() {
  const d = todayDaily(), done = dailyDoneToday();
  $('dailyBox').innerHTML = `<b>📅 ${L('오늘의 도전', "Today's challenge")}</b> ${done ? '✅' : ''}<br>${L(d.ko, d.en)} <small>${done ? L('— 오늘 성공했어요!', '— done today!') : L('— 성공하면 +2,000', '— +2,000 if you do it')}</small>`;
}
function checkDaily() {
  if (dailyDoneToday() || state === 'title') return;
  const d = todayDaily();
  if (d.ok()) {
    store.set('worm_daily_date', todayStr()); prof.dailyDone++; saveProf();
    addScore(2000); SFX.award(); banner(L(`📅 오늘의 도전 성공! "${d.ko}" +2,000`, `📅 Daily challenge done! "${d.en}" +2,000`), 3.2);
    discover('daily');
  }
}

// ---- ④ 도감 ----
const DEX = [
  ['worm', '🪱', L('꿈틀이', 'Wiggles'), 'f'], ['butter', '🐦', L('앵무새 버터', 'Butter'), 'f'], ['mango', '🐔', L('닭 망고', 'Mango'), 'f'], ['chick', '🐥', L('병아리', 'Chick'), 'f'],
  ['mole', '🕳️', L('두더지', 'Mole'), 'y'], ['lizard', '🦎', L('도마뱀', 'Lizard'), 'y'], ['centipede', '🐛', L('지네', 'Centipede'), 'y'], ['locust', '🦗', L('메뚜기 떼', 'Locusts'), 'y'],
  ['crow', '🪶', L('까마귀', 'Crow'), 'y'], ['boss', '👑', L('까마귀 대장 까옥이', 'Captain Caw'), 'y'], ['goose', '🪿', L('기러기 친구들', 'Geese'), 'y'],
  ['kangaroo', '🦘', L('캥거루', 'Kangaroo'), 'w'], ['koala', '🐨', L('코알라', 'Koala'), 'w'], ['camel2', '🐫', L('쌍봉낙타', 'Bactrian camel'), 'w'], ['horses', '🐎', L('몽골 말', 'Mongolian horses'), 'w'],
  ['lemur', '🐒', L('여우원숭이', 'Lemur'), 'w'], ['chameleon', '🦎', L('카멜레온', 'Chameleon'), 'w'], ['camel1', '🐪', L('단봉낙타', 'Dromedary'), 'w'], ['giraffe', '🦒', L('기린', 'Giraffe'), 'w'],
  ['beetle', '🪲', L('쇠똥구리', 'Dung beetle'), 'w'], ['llama', '🦙', L('라마', 'Llama'), 'w'], ['flamingo', '🦩', L('플라밍고', 'Flamingo'), 'w'],
  ['gem', '💎', L('지하 보석', 'Cave gem'), 't'], ['fossil', '🦴', L('화석', 'Fossil'), 't'], ['daily', '📅', L('오늘의 도전 배지', 'Daily badge'), 't'], ['earth', '🌍', L('지구 지킴이', 'Earth guardian'), 't']
];
const dex = new Set(store.get('worm_dex', ['worm']));
function discover(id) {
  if (dex.has(id)) return; dex.add(id); store.set('worm_dex', [...dex]);
  const e = DEX.find(d => d[0] === id); if (!e) return;
  if (state !== 'title') { const t = L(`📖 도감에 새 친구! ${e[1]} ${e[2]}`, `📖 New in your collection! ${e[1]} ${e[2]}`); if (mode === 'yard') floatText(worm.x, worm.y - 60, t, '#fff59d', 17); else banner(t, 2); tone(1320, 0.08, 'triangle', 0.06, 1760); }
}
function renderDex() {
  const groups = [['f', L('우리 집 친구', 'Home friends')], ['y', L('마당과 하늘의 말썽꾸러기', 'Troublemakers')], ['w', L('세계의 동물', 'World animals')], ['t', L('보물과 배지', 'Treasures & badges')]];
  $('dexCount').textContent = `${DEX.filter(d => dex.has(d[0])).length} / ${DEX.length}`;
  $('dexGrid').innerHTML = groups.map(([g, t]) => `<h3>${t}</h3><div class="dexrow">${DEX.filter(d => d[3] === g).map(d => dex.has(d[0]) ? `<div class="dx"><span>${d[1]}</span><small>${d[2]}</small></div>` : `<div class="dx no"><span>❓</span><small>???</small></div>`).join('')}</div>`).join('');
}
let dexT = 0;
function dexScan(dt) { // 가까이 있는 친구들을 도감에 등록
  dexT -= dt; if (dexT > 0) return; dexT = 0.5;
  if (mode === 'yard' && state === 'play') {
    const near = (x, y) => dist(x, y, worm.x, worm.y) < 650;
    if (!mango.away && near(mango.x, mango.y)) discover('mango');
    for (const c of critters) if (near(c.x, c.y)) discover(c.kind);
    for (const ch of chicks) if (near(ch.x, ch.y)) discover('chick');
    for (const a of animals) if (near(a.x, a.y)) discover(a.k);
    if (mole.state === 'chase' && near(mole.x, mole.y)) discover('mole');
    if (butter.state !== 'none' && butter.state !== 'incoming') discover('butter');
    if (swarm && near(swarm.x, swarm.y)) discover('locust');
  } else if (mode === 'flight' && fl.on) {
    if (fl.kills > 0) discover('crow');
    if (fl.boss) discover('boss');
    if (fl.foes.some(f => f.type === 'goose')) discover('goose');
    discover('butter');
  } else if (mode === 'burrow' && br.on) { if (br.gems > 0) discover('gem'); if (br.fossils > 0) discover('fossil'); }
}

// ---- ⑤ 꾸미기 ----
const LOOKS = {
  color: [
    { id: 'pink', name: L('분홍', 'Pink'), need: () => true, cond: '' },
    { id: 'green', name: L('새싹 초록', 'Sprout green'), need: () => totalStars() >= 5, cond: L('별 5개 모으기', 'Collect 5 stars') },
    { id: 'blue', name: L('하늘 파랑', 'Sky blue'), need: () => prof.dailyDone >= 3, cond: L('오늘의 도전 3번 성공', 'Finish 3 daily challenges') },
    { id: 'rainbow', name: L('무지개', 'Rainbow'), need: () => dex.size >= 12, cond: L('도감 12칸 채우기', 'Fill 12 collection slots') },
    { id: 'gold', name: L('황금', 'Gold'), need: () => prof.endings >= 1, cond: L('엔딩 보기', 'See the ending') }
  ],
  hat: [
    { id: 'none', name: L('없음', 'None'), e: '', need: () => true, cond: '' },
    { id: 'bow', name: L('리본', 'Bow'), e: '🎀', need: () => true, cond: '' },
    { id: 'straw', name: L('밀짚모자', 'Straw hat'), e: '👒', need: () => prof.dailyDone >= 1, cond: L('오늘의 도전 1번 성공', 'Finish 1 daily challenge') },
    { id: 'miner', name: L('광부 헬멧', 'Miner helmet'), e: '⛑️', need: () => prof.burrowDone >= 1, cond: L('두더지 굴 끝까지 가기', 'Finish a mole tunnel') },
    { id: 'tophat', name: L('신사 모자', 'Top hat'), e: '🎩', need: () => store.get('worm_best', 0) >= 30000, cond: L('최고 점수 30,000', 'Best score 30,000') },
    { id: 'flower', name: L('꽃 핀', 'Flower'), e: '🌸', need: () => dex.size >= 18, cond: L('도감 18칸 채우기', 'Fill 18 collection slots') },
    { id: 'crown', name: L('왕관', 'Crown'), e: '👑', need: () => totalStars() >= 15, cond: L('모든 나라 별 3개', '3 stars in every country') }
  ]
};
const look = Object.assign({ color: 'pink', hat: 'none' }, store.get('worm_look', {}));
function wormColor(i) { // 꿈틀이 몸 색
  switch (look.color) {
    case 'green': return i % 2 ? '#8fd37f' : '#73c162';
    case 'blue': return i % 2 ? '#86c9f0' : '#64b2e3';
    case 'rainbow': return `hsl(${(i * 28 + time * 80) % 360},80%,68%)`;
    case 'gold': return i % 2 ? '#ffd76a' : '#f2bd3d';
    default: return i % 2 ? '#ee8f96' : '#e57f88';
  }
}
const hatEmoji = () => (LOOKS.hat.find(h => h.id === look.hat) || {}).e || '';
function renderLooks() {
  const row = (kind) => LOOKS[kind].map(o => { const ok = o.need(), on = look[kind] === o.id;
    const sw = kind === 'color' ? `<i class="sw sw-${o.id}"></i>` : `<span class="he">${o.e || '🚫'}</span>`;
    return `<button class="lk${on ? ' on' : ''}${ok ? '' : ' locked'}" data-kind="${kind}" data-id="${o.id}" ${ok ? '' : 'disabled'}>${sw}<b>${o.name}</b>${ok ? '' : `<small>🔒 ${o.cond}</small>`}</button>`; }).join('');
  $('lookColors').innerHTML = row('color'); $('lookHats').innerHTML = row('hat');
  document.querySelectorAll('#looks .lk').forEach(b => b.onclick = () => { look[b.dataset.kind] = b.dataset.id; store.set('worm_look', look); renderLooks(); SFX.item(); });
}

// ---- 화면 연결 ----
function refreshTitleMeta() { buildDiffRow(); showDailyBox(); }
$('btnDexT').onclick = () => { renderDex(); $('dexOv').hidden = false; };
$('btnDexClose').onclick = () => { $('dexOv').hidden = true; };
$('btnLookT').onclick = () => { renderLooks(); $('looks').hidden = false; };
$('btnLookClose').onclick = () => { $('looks').hidden = true; };
$('btnDexT').textContent = L('📖 도감', '📖 Collection');
$('btnLookT').textContent = L('🎨 꾸미기', '🎨 Style');
$('dexTitle').textContent = L('📖 꿈틀이 도감', '📖 Wiggles Collection');
$('lookTitle').textContent = L('🎨 꿈틀이 꾸미기', '🎨 Style Wiggles');
$('lookColorH').textContent = L('몸 색깔', 'Body color');
$('lookHatH').textContent = L('모자', 'Hat');
$('btnDexClose').textContent = L('닫기', 'Close'); $('btnLookClose').textContent = L('닫기', 'Close');
$('howSum').textContent = L('📘 게임 방법 보기', '📘 How to play');
let metaT = 0;
function metaTick(dt) { dexScan(dt); metaT -= dt; if (metaT <= 0) { metaT = 0.5; checkDaily(); } }
