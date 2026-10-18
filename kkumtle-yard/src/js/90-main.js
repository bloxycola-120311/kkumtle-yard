'use strict';
// ---------- 17. 메인 루프 ----------
let musicLayerT = 0;
function updateMusicScene() {
  let sc = 'explore', urgent = false;
  if (state === 'title') sc = 'lobby';
  else if (mode === 'ending' || (state === 'over' && stats.ending)) sc = 'ending';
  else if (state === 'over') sc = 'over';
  else if (mode === 'globe') sc = 'globe';
  else if (mode === 'burrow') { sc = br.done ? 'arrive' : 'burrow'; urgent = true; }
  else if (mode === 'flight') { sc = fl.phase === 'boss' ? 'boss' : fl.phase === 'arrive' ? 'arrive' : fl.fever > 0 ? 'super' : 'sky'; urgent = true; }
  else if (worm.superT > 0) { sc = 'super'; urgent = true; }
  else if (mole.state === 'chase') { sc = 'chase'; urgent = true; }
  else if (mole.state === 'warn' || butter.state === 'incoming') { sc = 'tension'; urgent = true; }
  setMusicScene(sc, urgent);
  musicMuffle(state === 'pause' || state === 'award' || (state === 'play' && worm.dive > 0));
  musicLayerT -= 1 / 60;
  if (musicLayerT <= 0) { musicLayerT = 1; const pct = fertAvg() * 100; music.layers = 1 + (pct >= 12) + (pct >= 30) + (pct >= 45) + (pct >= 60); music.rain = raining > 0; }
}
function loop(now) {
  requestAnimationFrame(loop);
  let dt = Math.min(0.05, (now - last_t) / 1000); last_t = now;
  if (bannerTimer > 0) { bannerTimer -= dt; if (bannerTimer <= 0) $('banner').className = ''; }
  if (world.pendingOpen && state === 'play' && mode === 'yard') openGlobe(world.intro);
  maybeShowQueuedQuiz();
  if (joy.id !== null && !joyMode()) joyEnd();
  { const el = $('joy'); const show = joyMode() && matchMedia('(pointer:coarse)').matches; if (el.hidden === show) el.hidden = !show; }
  if (mode === 'globe' && state === 'globe') updateGlobe(dt);
  else if (mode === 'flight' && (state === 'flight' || state === 'dying')) updateFlight(dt);
  else if (mode === 'burrow' && (state === 'burrow' || state === 'dying')) updateBurrow(dt);
  else if (mode === 'ending') { if (state === 'ending') updateEnding(dt); else { time += dt; for (const p of ending.fw) p.life -= dt; } }
  else if (mode === 'yard' && (state === 'play' || state === 'dying')) {
    const sdt = hitStop > 0 ? dt * 0.12 : dt; hitStop = Math.max(0, hitStop - dt);
    update(sdt, false);
    hudT -= dt; if (hudDirty && hudT <= 0) { updateHUD(); hudT = 0.12; }
  } else if (state === 'title') update(dt, true);
  metaTick(dt);
  updateMusicScene();
  render();
}
goTitle();
requestAnimationFrame(loop);
// 테스트/디버그용 (브라우저 콘솔에서 사용 가능)
window.__worm = { get state() { return state; }, openQuiz, openProfile, openHouseBoard, get profile() { return profile; }, ledger, QUIZ_BANK, start: startGame, inv, worm, mole, fertAvg, useItem, startMoleWarn, startButter, fertAll(v) { for (const i of yardCells) fert[i] = v; fertDirty = true; }, startEnding, finishEnding, boardLoad, get score() { return score; }, setScore(v) { score = v; }, gameOver, get animals() { return animals; }, startSwarm, get swarm() { return swarm; }, get strikes() { return strikes; }, plants, startForeignYard, setRain(v) { raining = v; }, mango, get critters() { return critters; }, get eggs() { return eggs; }, get chicks() { return chicks; }, spawnHole, get hole() { return hole; }, br, startBurrow, get lives() { return lives; }, butter, openGlobe, startFlight, COUNTRIES, fl, world, get mode() { return mode; }, levelUp, renderSong, get musicScene() { return music.scene; }, sim(sec) { for (let i = 0; i < sec * 60; i++) update(1 / 60, true); return fertAvg(); } };
