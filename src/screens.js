import { S, LS, SPRINT_LINES, fmtTime, _getLifetime } from './shared.js';
import { pauseBGM, resumeBGM, stopBGM, toggleMute } from './audio.js';
import {
  updateDAS, updateARR, updateSDF, updateLockDelay, updateGhost, updateColorblind,
  cycleAnimIntensity, _animLabel, openHowToPlay, openStats, unlockAchievement,
  togglePerfMode
} from './ui.js';
import {
  _donationHTML, submitScore, submitSprintScore,
  renderLbTab, setLbMode, loadStartLeaderboard
} from './leaderboard.js';
import {
  startGame, startSprintMode, startBlitzMode, startFlowMode,
  startMarathonMode, launchDailyChallenge,
  pauseGameTiming, resumeGameTiming, stopGameAndReset, resumeWithCountdown
} from './game.js';
import { pwaInstallBtnHTML, onPWAGameOver, offlineBarGameEnd, hidePWASheet } from './pwa.js';

const $overlay = document.getElementById('overlay');

function rollNumber(el, val, dur) {
  if (!el) return;
  const start = performance.now();
  function update(t) {
    const p = Math.min(1, (t - start) / dur);
    const easeOutExp = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
    el.textContent = Math.floor(easeOutExp * val).toLocaleString();
    if (p < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

let _gateTimer = null;

export function showDailyGateOverlay(todayStr) {
  clearInterval(_gateTimer);
  const updateCountdown = () => {
    const now = new Date();
    // Daily challenge is global (same puzzle + board worldwide) and resets at
    // UTC midnight. Count down to UTC midnight so the timer matches the actual
    // server-side reset — not the device's local midnight.
    const nextMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const diffMs = nextMidnight - now;
    if (diffMs <= 0) {
      clearInterval(_gateTimer);
      showStartScreen();
      return;
    }
    const hrs = String(Math.floor(diffMs / 3600000)).padStart(2, '0');
    const mins = String(Math.floor((diffMs % 3600000) / 60000)).padStart(2, '0');
    const secs = String(Math.floor((diffMs % 60000) / 1000)).padStart(2, '0');
    const countEl = document.getElementById('daily-countdown');
    if (countEl) countEl.textContent = `${hrs}:${mins}:${secs}`;
  };

  $overlay.innerHTML = `
    <div class="glass-panel">
      <h1 class="daily-header">🏆 DAILY CHALLENGE</h1>
      <div class="daily-icon">🏅</div>
      <div class="daily-completed-lbl">
        CHALLENGE COMPLETED FOR TODAY!<br>COME BACK TOMORROW.
      </div>
      <div class="daily-countdown-lbl">NEXT CHALLENGE IN</div>
      <div id="daily-countdown" style="font-size:24px;font-weight:900;color:var(--cyan);text-shadow:0 0 10px var(--cyan);margin-bottom:20px;letter-spacing:1.5px">--:--:--</div>
      <button class="action-btn full-width" onclick="showModeSelector()">BACK</button>
    </div>
  `;
  $overlay.style.display = 'flex';
  updateCountdown();
  _gateTimer = setInterval(updateCountdown, 1000);
}

export function startDailyChallenge() {
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  if (localStorage.getItem(LS.DAILY_DATE) === todayStr) {
    showDailyGateOverlay(todayStr);
    return;
  }

  $overlay.innerHTML = `
    <div class="glass-panel">
      <h1 class="daily-header">🏆 DAILY CHALLENGE</h1>
      <div class="daily-icon pulse">🛰️</div>
      <div class="daily-subtitle">SAME BLOCKS FOR EVERYONE!</div>

      <div class="briefing-card">
        <p style="color:#ff7700;font-weight:900;letter-spacing:1px">[WELCOME TO THE DAILY MISSION!]</p>
        <p>Today, every player in the whole world will get the <strong>exact same blocks</strong> in the same order!</p>
        <p style="color:var(--cyan)">Luck doesn't matter today! Only your real skills will make you number one on the leaderboard.</p>
      </div>

      <div class="warning-card">
        ⚠️ Warning: You can only play ONCE today!<br>
        Once you start, there are no retries!
      </div>

      <div class="btn-row main-actions">
        <button class="action-btn" id="daily-launch-btn" onclick="launchDailyChallenge()">START CHALLENGE</button>
        <button class="action-btn ghost" onclick="showModeSelector()">GO BACK</button>
      </div>
    </div>
  `;
  $overlay.style.display = 'flex';
}

function _settingsHTML(p, showPWA=true) {
  return `
    <div class="sg-label">AUDIO</div>
    <div class="settings-row">
      <span class="settings-lbl">BGM</span>
      <input type="range" class="neon-range" min="0" max="100" value="${S.bgmVol}" oninput="updateBGMVolume(this.value)">
      <span class="settings-val" id="${p}-bgm-val">${S.bgmVol}%</span>
    </div>
    <div class="settings-row">
      <span class="settings-lbl">SFX</span>
      <input type="range" class="neon-range" min="0" max="100" value="${S.sfxVol}" oninput="updateSFXVolume(this.value)">
      <span class="settings-val" id="${p}-sfx-val">${S.sfxVol}%</span>
    </div>
    <button class="toggle-btn${S.muteAudio?' muted':''}" id="${p}-mute-btn" onclick="toggleMute()">${S.muteAudio?'🔇 MUTE ALL':'🔊 MUTE ALL'}</button>

    <div class="sg-sep"></div>
    <div class="sg-label">VISUAL</div>
    <button class="toggle-btn${S.ghostVisible?'':' muted'}" id="${p}-ghost-btn" onclick="updateGhost()">${S.ghostVisible?'👻 GHOST ON':'👻 GHOST OFF'}</button>
    <button class="toggle-btn${S.animIntensity==='off'?' muted':''}" id="${p}-anim-btn" onclick="cycleAnimIntensity()">${_animLabel()}</button>
    <button class="toggle-btn${S.colorblindMode?' cb-active':' muted'}" id="${p}-cb-btn" onclick="updateColorblind()">${S.colorblindMode?'🔳 CB MODE ON':'🔳 CB MODE OFF'}</button>

    <div class="sg-sep"></div>
    <div class="sg-label">CONTROLS</div>
    <div class="settings-row">
      <span class="settings-lbl">DAS</span>
      <input type="range" class="neon-range" min="50" max="300" value="${S.das}" oninput="updateDAS(this.value)">
      <span class="settings-val" id="${p}-das-val">${S.das}ms</span>
    </div>
    <div class="settings-row">
      <span class="settings-lbl">ARR</span>
      <input type="range" class="neon-range" min="0" max="100" value="${S.arr}" oninput="updateARR(this.value)">
      <span class="settings-val" id="${p}-arr-val">${S.arr}ms</span>
    </div>
    <div class="settings-row">
      <span class="settings-lbl">SDF</span>
      <input type="range" class="neon-range" min="0" max="40" value="${S.sdf}" oninput="updateSDF(this.value)">
      <span class="settings-val" id="${p}-sdf-val">${S.sdf===0?'∞':S.sdf+'x'}</span>
    </div>
    <div class="settings-row">
      <span class="settings-lbl">LOCK</span>
      <input type="range" class="neon-range" min="100" max="1000" step="50" value="${S.lockMs}" oninput="updateLockDelay(this.value)">
      <span class="settings-val" id="${p}-lock-val">${S.lockMs}ms</span>
    </div>

    <div class="sg-sep"></div>
    <div class="sg-label">PERFORMANCE & SYSTEM</div>
    ${'vibrate' in navigator ? `<button class="toggle-btn${S.hapticEnabled?'':' muted'}" id="${p}-haptic-btn" onclick="toggleHaptic()">${S.hapticEnabled?'📳 HAPTIC ON':'📳 HAPTIC OFF'}</button>` : ''}
    <button class="toggle-btn${S.lowPerfMode?' lowspec-on':' muted'}" id="${p}-perf-btn" onclick="togglePerfMode()">${S.lowPerfMode?'⚡ LOW-SPEC MODE: ON':'⚡ LOW-SPEC MODE: OFF'}</button>
    ${showPWA?`<button class="toggle-btn${_notifBtnClass()}" id="${p}-notif-btn" onclick="window._pwaNotifToggle()">${_notifBtnLabel()}</button>
    ${pwaInstallBtnHTML(p)}`:''}
  `;
}

function _notifBtnClass() {
  if (!('Notification' in window)) return ' muted';
  if (Notification.permission === 'granted') return '';
  return ' muted';
}

function _notifBtnLabel() {
  if (!('Notification' in window)) return '🔔 NOTIFICATIONS: N/A';
  if (Notification.permission === 'granted') return '🔔 NOTIFICATIONS: ON';
  if (Notification.permission === 'denied') return '🔔 NOTIFICATIONS: OFF';
  return '🔔 NOTIFICATIONS: OFF';
}

export function openSettings() {
  $overlay.innerHTML=`
    <div class="glass-panel">
      <h1 class="pause-header">SETTINGS</h1>
      <div class="settings-box">${_settingsHTML('st')}</div>
      <button class="action-btn full-width" onclick="showStartScreen()">BACK</button>
    </div>`;
  $overlay.style.display='flex';
}

export function togglePause(){
  if(!S.gameRunning)return;
  S.gamePaused=!S.gamePaused;
  if(S.gamePaused){
    pauseGameTiming();
    pauseBGM();
    $overlay.innerHTML=`
      <div class="glass-panel">
        <h1 class="pause-header">PAUSED</h1>
        <div class="settings-box">${_settingsHTML('ov',false)}</div>
        <button class="action-btn full-width" onclick="togglePause()">RESUME</button>
        <button class="action-btn ghost full-width restart" onclick="showStartScreen()">RESTART</button>
      </div>`;
    $overlay.style.display='flex';
  } else {
    resumeBGM();
    $overlay.style.display='none';
    resumeWithCountdown();
  }
}

export function _saveGameStats() {
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  if (S.isDailyMode) localStorage.setItem(LS.DAILY_DATE, todayStr);

  const isNewBest = S.score > S.hiScore;
  if (isNewBest) { S.hiScore = S.score; localStorage.setItem(LS.HI, S.hiScore); }

  const hist = JSON.parse(localStorage.getItem(LS.HISTORY) || '[]');
  hist.unshift({ score:S.score, lines:S.lines, level:S.level, date: Date.now() });
  localStorage.setItem(LS.HISTORY, JSON.stringify(hist.slice(0, 5)));

  const prevStreak = parseInt(localStorage.getItem(LS.STREAK) || '0');
  const newStreak = S.score >= 5000 ? prevStreak + 1 : 0;
  localStorage.setItem(LS.STREAK, newStreak);

  const storedMaxCombo = parseInt(localStorage.getItem(LS.MAX_COMBO) || '0');
  if (S.maxCombo > storedMaxCombo) localStorage.setItem(LS.MAX_COMBO, S.maxCombo);
  const displayMaxCombo = Math.max(S.maxCombo, storedMaxCombo);

  let totalGames = parseInt(localStorage.getItem(LS.TOTAL_GAMES) || '0');
  let totalScore = parseInt(localStorage.getItem(LS.TOTAL_SCORE) || '0');
  let bestLevel  = parseInt(localStorage.getItem(LS.BEST_LEVEL)  || '0');
  let totalLines = parseInt(localStorage.getItem(LS.TOTAL_LINES) || '0');
  let maxLines   = parseInt(localStorage.getItem(LS.MAX_LINES)   || '0');

  const isBestLevel = S.level > 0 && S.level >= bestLevel;
  const isBestCombo = S.maxCombo > 0 && S.maxCombo >= storedMaxCombo;
  const isBestLines = S.lines > 0 && S.lines >= maxLines;

  totalGames += 1; totalScore += S.score;
  if (S.level > bestLevel) bestLevel = S.level;
  totalLines += S.lines;
  if (S.lines > maxLines) maxLines = S.lines;

  localStorage.setItem(LS.TOTAL_GAMES, totalGames);
  localStorage.setItem(LS.TOTAL_SCORE, totalScore);
  localStorage.setItem(LS.BEST_LEVEL,  bestLevel);
  localStorage.setItem(LS.TOTAL_LINES, totalLines);
  localStorage.setItem(LS.MAX_LINES,   maxLines);

  const lifetime = _getLifetime();
  lifetime.totalGames = (lifetime.totalGames || 0) + 1;
  localStorage.setItem(LS.LIFETIME, JSON.stringify(lifetime));

  unlockAchievement('first_game');
  if (lifetime.totalGames >= 10) unlockAchievement('games_10');
  if (lifetime.totalGames >= 50) unlockAchievement('games_50');
  if (S.isDailyMode) unlockAchievement('daily_challenge_1');
  if (newStreak >= 5) unlockAchievement('streak_5');

  return { isNewBest, newStreak, displayMaxCombo, isBestLevel, isBestCombo, isBestLines };
}

export function _renderGameOverScreen({ isNewBest, newStreak, displayMaxCombo, isBestLevel, isBestCombo, isBestLines }) {
  offlineBarGameEnd();
  const savedName = localStorage.getItem(LS.NAME) || '';

  let pbBadges = [];
  if (S.isDailyMode) {
    pbBadges.push(`<div class="pb-badge score-pb">🏅 DAILY CHALLENGE</div>`);
  } else {
    if (isNewBest)  pbBadges.push(`<div class="pb-badge score-pb">🏆 RECORD SCORE</div>`);
    if (isBestLevel) pbBadges.push(`<div class="pb-badge level-pb">👑 RECORD LEVEL: L${S.level}</div>`);
    if (isBestLines) pbBadges.push(`<div class="pb-badge lines-pb">🎯 RECORD LINES: ${S.lines}</div>`);
    if (isBestCombo) pbBadges.push(`<div class="pb-badge combo-pb">⚡ RECORD COMBO: x${S.maxCombo}</div>`);
  }

  let badgesHTML = '';
  if (pbBadges.length > 0 || newStreak > 0) {
    badgesHTML = `<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">
      ${!S.isDailyMode && newStreak > 0 ? `<div class="streak-badge">🔥 ${newStreak} STREAK</div>` : ''}
      ${pbBadges.join(' ')}
    </div>`;
  } else if (displayMaxCombo > 1) {
    badgesHTML = `<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">
      <div class="combo-badge">⚡ x${displayMaxCombo} BEST COMBO</div>
    </div>`;
  }

  $overlay.innerHTML = `
    <div class="glass-panel">
      <h1 class="game-over-header">${S.isDailyMode ? 'DAILY CHALLENGE' : 'GAME OVER'}</h1>
      ${!S.isDailyMode && isNewBest ? '<div class="new-best-badge">★ NEW BEST ★</div>' : ''}
      
      <div class="game-over-stats">
        <div class="stat-item">
          <span class="stat-label">SCORE</span>
          <span class="stat-val" id="gov-score-val">0</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">BEST</span>
          <span class="stat-val highlight" id="gov-hi-val">0</span>
        </div>
      </div>

      ${badgesHTML ? `<div style="width:100%;margin-bottom:18px">${badgesHTML}</div>` : ''}
      
      ${(() => {
        // Real board by mode (no NPC inflation). S.targets as last resort.
        const c = S._lbCache || {};
        let ref = [];
        if (S.isBlitzMode) {
          ref = c.blitzBoard && c.blitzBoard.length ? c.blitzBoard
              : c.blitzDailyBoard && c.blitzDailyBoard.length ? c.blitzDailyBoard : [];
        } else if (S.isDailyMode) {
          ref = c.challengeAlltimeBoard && c.challengeAlltimeBoard.length ? c.challengeAlltimeBoard
              : c.challengeBoard && c.challengeBoard.length ? c.challengeBoard : [];
        } else {
          ref = c.board && c.board.length ? c.board
              : c.dailyBoard && c.dailyBoard.length ? c.dailyBoard : [];
        }
        // fallback: S.targets has at minimum NPC warmup (always non-empty after game start)
        if (!ref.length && S.targets && S.targets.length) ref = S.targets;
        if (!ref.length) return '';
        const sorted = [...ref].sort((a, b) => b.score - a.score);
        const above = sorted.filter(e => e.score > S.score).length;
        const estRank = above + 1;
        const estPct = Math.max(1, Math.ceil(estRank / sorted.length * 100));
        const top1 = sorted[0] ? sorted[0].score : null;
        const gap = top1 && S.score < top1 ? top1 - S.score : null;
        return `<div style="text-align:center;margin-bottom:14px;line-height:1.8">
          <div style="font-size:10px;letter-spacing:2px;color:#ffe600;opacity:0.85">~#${estRank} · TOP ${estPct}%</div>
          ${gap ? `<div style="font-size:9px;letter-spacing:1px;color:rgba(255,255,255,0.3)">${gap.toLocaleString()} PTS FROM #1</div>` : '<div style="font-size:9px;letter-spacing:2px;color:#ffe600">👑 #1</div>'}
        </div>`;
      })()}
      <div style="width:100%">
        <input id="lb-name" class="neon-input" maxlength="12" placeholder="ENTER NAME" value="${savedName}" autocomplete="off" spellcheck="false">
        <div class="btn-row sub-actions">
          <button id="lb-submit-btn" class="action-btn sm" onclick="submitScore()">SUBMIT</button>
          <button class="action-btn sm ghost" onclick="showStartScreen()">PLAY AGAIN</button>
        </div>
      </div>
      <div id="lb-result" style="margin-top:14px;width:100%;display:flex;flex-direction:column;align-items:center"></div>
      ${_donationHTML()}
    </div>`;
  $overlay.style.display = 'flex';
  rollNumber(document.getElementById('gov-score-val'), S.score, 1400);
  rollNumber(document.getElementById('gov-hi-val'), S.hiScore, 1400);
  const inp = document.getElementById('lb-name');
  if (!('ontouchstart' in window)) {
    inp.focus(); inp.select();
  }
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') submitScore(); });
  onPWAGameOver();
}

export function _renderBlitzScreen(score, isNewBest, prevBest) {
  offlineBarGameEnd();
  const savedName=localStorage.getItem(LS.NAME)||'';
  const prevBestLine=prevBest>0&&!isNewBest
    ?`<div style="font-size:8px;letter-spacing:1.5px;color:rgba(255,255,255,0.3);margin-bottom:10px">BEST: ${prevBest.toLocaleString()}</div>`:'';

  $overlay.innerHTML=`
    <div class="glass-panel">
      <h1 class="game-over-header" style="margin-bottom:8px !important;color:var(--mode-blitz);text-shadow:0 0 20px var(--mode-blitz)">🔥 BLITZ OVER!</h1>
      ${isNewBest?'<div class="new-best-badge">★ NEW BEST ★</div>':prevBestLine}

      <div class="game-over-stats" style="padding:16px 12px">
        <div style="font-size:9px;letter-spacing:3px;color:rgba(255,200,0,0.6);margin-bottom:6px">FINAL SCORE</div>
        <div style="font-size:40px;font-weight:900;color:#ffe600;text-shadow:0 0 20px rgba(255,230,0,0.7);letter-spacing:2px;font-family:monospace;line-height:1.2">${score.toLocaleString()}</div>
      </div>

      <div style="width:100%">
        <input id="lb-name" class="neon-input" maxlength="12" placeholder="ENTER NAME" value="${savedName}" autocomplete="off" spellcheck="false" ${score<=0?'style="display:none"':''}>
        <div class="btn-row sub-actions">
          ${score>0?`<button id="lb-submit-btn" class="action-btn sm" onclick="submitBlitzScore(${score})">SUBMIT</button>`:''}
          <button class="action-btn sm ghost" onclick="startBlitzMode()">RETRY</button>
        </div>
      </div>
      <div id="lb-result" style="margin-top:14px;width:100%;display:flex;flex-direction:column;align-items:center"></div>
      ${_donationHTML()}
    </div>`;
  $overlay.style.display='flex';
  const inp=document.getElementById('lb-name');
  if (!('ontouchstart' in window)) {
    inp.focus(); inp.select();
  }
  inp.addEventListener('keydown',e=>{if(e.key==='Enter')submitBlitzScore(score);});
  onPWAGameOver();
}

export function _renderSprintScreen(timeMs, isNewBest, prevBest) {
  offlineBarGameEnd();
  const savedName=localStorage.getItem(LS.NAME)||'';
  const lpm=Math.round(SPRINT_LINES/(timeMs/60000));
  const prevBestLine=prevBest>0&&!isNewBest
    ?`<div style="font-size:8px;letter-spacing:1.5px;color:rgba(255,255,255,0.3);margin-bottom:10px">BEST: ${fmtTime(prevBest)}</div>`:'';

  $overlay.innerHTML=`
    <div class="glass-panel">
      <h1 class="game-over-header sprint-header-anim" style="margin-bottom:8px !important">🏁 SPRINT COMPLETE!</h1>
      ${isNewBest?'<div class="new-best-badge">★ NEW BEST ★</div>':prevBestLine}
      
      <div class="game-over-stats" style="padding:16px 12px">
        <div style="font-size:9px;letter-spacing:3px;color:rgba(0,200,255,0.6);margin-bottom:6px">FINISH TIME</div>
        <div style="font-size:40px;font-weight:900;color:#ffe600;text-shadow:0 0 20px rgba(255,230,0,0.7);letter-spacing:2px;font-family:monospace;line-height:1.2">${fmtTime(timeMs)}</div>
        <div style="font-size:10px;letter-spacing:2px;color:rgba(255,255,255,0.55);margin-top:8px">${lpm} LPM</div>
      </div>

      <div style="width:100%">
        <input id="lb-name" class="neon-input" maxlength="12" placeholder="ENTER NAME" value="${savedName}" autocomplete="off" spellcheck="false">
        <div class="btn-row sub-actions">
          <button id="lb-submit-btn" class="action-btn sm" onclick="submitSprintScore(${timeMs})">SUBMIT</button>
          <button class="action-btn sm ghost" onclick="showStartScreen()">PLAY AGAIN</button>
        </div>
      </div>
      <div id="lb-result" style="margin-top:14px;width:100%;display:flex;flex-direction:column;align-items:center"></div>
      ${_donationHTML()}
    </div>`;
  $overlay.style.display='flex';
  const inp=document.getElementById('lb-name');
  if (!('ontouchstart' in window)) {
    inp.focus(); inp.select();
  }
  inp.addEventListener('keydown',e=>{if(e.key==='Enter')submitSprintScore(timeMs);});
  onPWAGameOver();
}

export function showStartScreen(){
  offlineBarGameEnd();
  // Flow has no game-over screen — capture best cumulative score when the player exits
  if(S.isFlowMode && S.score>(S._flowHiScore||0)){
    S._flowHiScore=S.score;
    localStorage.setItem(LS.FLOW_HI, S.score);
  }
  S.isDailyMode=false;
  S.isSprintMode=false;
  S.isBlitzMode=false;
  S.isFlowMode=false;
  if(_gateTimer) { clearInterval(_gateTimer); _gateTimer=null; }
  stopGameAndReset();
  
  const psl=document.getElementById('panel-score-label');
  const lsl=document.getElementById('lines-sub-label');
  if(psl)psl.textContent='SCORE';
  if(lsl)lsl.textContent='CLEARED';
  
  stopBGM();
  $overlay.innerHTML=`
    <div class="glass-panel">
      <h1>GLOWTRIS</h1>
      <div id="start-lb">
        <div class="lb-mode-toggle">
          <button id="lb-mode-marathon" class="lb-tab ${S.lbMode==='marathon'?'active':''}" onclick="setLbMode('marathon')">MARATHON</button>
          <button id="lb-mode-sprint" class="lb-tab ${S.lbMode==='sprint'?'active':''}" onclick="setLbMode('sprint')">⚡ SPRINT</button>
          <button id="lb-mode-daily" class="lb-tab ${S.lbMode==='daily'?'active':''}" onclick="setLbMode('daily')">🏆 DAILY</button>
          <button id="lb-mode-blitz" class="lb-tab ${S.lbMode==='blitz'?'active':''}" onclick="setLbMode('blitz')">🔥 BLITZ</button>
        </div>
        <div class="lb-tabs-container lb-tabs">
          ${S.lbMode==='daily' ? `
            <button class="lb-tab active" data-tab="challenge" onclick="renderLbTab('challenge')">TODAY</button>
            <button class="lb-tab" data-tab="challenge-all" onclick="renderLbTab('challenge-all')">ALL TIME</button>
          ` : S.lbMode==='sprint' ? `
            <button class="lb-tab active" data-tab="sprint-daily" onclick="renderLbTab('sprint-daily')">TODAY</button>
            <button class="lb-tab" data-tab="sprint-weekly" onclick="renderLbTab('sprint-weekly')">WEEKLY</button>
            <button class="lb-tab" data-tab="sprint-all" onclick="renderLbTab('sprint-all')">ALL TIME</button>
          ` : `
            <button class="lb-tab active" data-tab="daily" onclick="renderLbTab('daily')">TODAY</button>
            <button class="lb-tab" data-tab="weekly" onclick="renderLbTab('weekly')">WEEKLY</button>
            <button class="lb-tab" data-tab="all" onclick="renderLbTab('all')">ALL TIME</button>
          `}
        </div>
        <div class="lb-inner" style="display:flex; align-items:center; justify-content:center;">
          <div style="color:rgba(0,200,255,0.4); font-size:12px; letter-spacing:4px; animation:text-pulse 1.5s ease-in-out infinite;">LOADING...</div>
        </div>
      </div>
      <div class="btn-row main-actions">
        <button class="action-btn play-btn" onclick="showModeSelector()">PLAY</button>
      </div>
      <div class="btn-row sub-actions">
        <button class="action-btn ghost" onclick="openHowToPlay()">HOW TO PLAY</button>
        <button class="action-btn ghost" onclick="openStats()">STATS</button>
      </div>
      <div class="btn-row sub-actions">
        <button class="action-btn ghost full-width" onclick="openSettings()">SETTINGS</button>
      </div>
      ${_donationHTML()}
      <div class="footer-links-wrap">
        <div style="margin-bottom: 6px;">
          <a href="/privacy.html" class="footer-link">PRIVACY</a>
          <span style="color:rgba(255,255,255,0.12)">·</span>
          <a href="/terms.html" class="footer-link">TERMS</a>
          <span style="color:rgba(255,255,255,0.12)">·</span>
          <a href="/changelog.html" class="footer-link">CHANGELOG</a>
        </div>
        <div style="margin-top: 6px;">
          <a href="https://blog.glowtris.com" class="footer-link" style="color:var(--cyan); font-weight:700;" target="_blank" rel="noopener">BLOG</a>
        </div>
      </div>
    </div>`;
  $overlay.style.display='flex';
  setTimeout(loadStartLeaderboard, 100);
  onPWAGameOver();
}

export function showModeSelector(){
  hidePWASheet();
  const noRec='<span style="color:rgba(255,255,255,0.3)">No record yet</span>';

  const hiS=parseInt(localStorage.getItem(LS.HI)||'0');
  const marathonBest=hiS>0?`<span style="color:rgba(0,255,136,0.8)">Best: ${hiS.toLocaleString()}</span>`:noRec;

  const flowHi=parseInt(localStorage.getItem(LS.FLOW_HI)||'0');
  const flowBest=flowHi>0?`<span style="color:rgba(160,0,255,0.8)">Best: ${flowHi.toLocaleString()}</span>`:noRec;

  const sprintBest=S._sprintHiTime>0?`<span style="color:rgba(0,200,255,0.8)">Best: ${fmtTime(S._sprintHiTime)}</span>`:noRec;

  const blitzHi=parseInt(localStorage.getItem(LS.BLITZ_HI)||'0');
  const blitzBest=blitzHi>0?`<span style="color:rgba(255,208,0,0.8)">Best: ${blitzHi.toLocaleString()}</span>`:noRec;

  const todayStr=new Date().toISOString().slice(0,10).replace(/-/g,'');
  const dailyDone=localStorage.getItem(LS.DAILY_DATE)===todayStr;
  const dailySub=dailyDone?'<span style="color:rgba(255,230,0,0.75)">✓ Completed today</span>':'<span style="color:rgba(255,255,255,0.3)">Not played today</span>';

  $overlay.innerHTML=`
    <div class="glass-panel">
      <h1 style="font-size:15px;margin-bottom:12px;letter-spacing:3px">SELECT MODE</h1>

      <div style="width:100%;display:flex;flex-direction:column;gap:10px;margin-bottom:12px">

        <!-- ENDLESS -->
        <div class="mode-group-label">♾️ ENDLESS</div>
        <div class="mode-group">
          <div class="mode-card marathon" tabindex="0" onclick="startMarathonMode()">
            <div class="mode-icon">🎮</div>
            <div class="mode-info">
              <div class="mode-name">MARATHON</div>
              <div class="mode-desc">No time limit — how high can you go?</div>
              <div class="mode-best">${marathonBest}</div>
            </div>
            <div class="mode-arrow">›</div>
          </div>
          <div class="mode-card flow" tabindex="0" onclick="startFlowMode()">
            <div class="mode-icon">🌊</div>
            <div class="mode-info">
              <div class="mode-name">FLOW</div>
              <div class="mode-desc">Never lose — the board resets and you keep scoring.</div>
              <div class="mode-best">${flowBest}</div>
            </div>
            <div class="mode-arrow">›</div>
          </div>
        </div>

        <!-- SPEED -->
        <div class="mode-group-label">⚡ SPEED</div>
        <div class="mode-group">
          <div class="mode-card sprint" tabindex="0" onclick="startSprintMode()">
            <div class="mode-icon">⚡</div>
            <div class="mode-info">
              <div class="mode-name">SPRINT 40L</div>
              <div class="mode-desc">Clear 40 lines. Fastest time wins.</div>
              <div class="mode-best">${sprintBest}</div>
            </div>
            <div class="mode-arrow">›</div>
          </div>
          <div class="mode-card blitz" tabindex="0" onclick="startBlitzMode()">
            <div class="mode-icon">⏱️</div>
            <div class="mode-info">
              <div class="mode-name">BLITZ</div>
              <div class="mode-desc">Score as high as possible in 2 minutes.</div>
              <div class="mode-best">${blitzBest}</div>
            </div>
            <div class="mode-arrow">›</div>
          </div>
        </div>

        <!-- CHALLENGE -->
        <div class="mode-group-label">🏆 CHALLENGE</div>
        <div class="mode-group">
          <div class="mode-card daily" tabindex="0" onclick="startDailyChallenge()">
            <div class="mode-icon">🏆</div>
            <div class="mode-info">
              <div class="mode-name">DAILY CHALLENGE</div>
              <div class="mode-desc">Same piece sequence for everyone — pure skill.</div>
              <div class="mode-best">${dailySub}</div>
            </div>
            <div class="mode-arrow">›</div>
        </div>

      </div>

      <button class="action-btn ghost full-width" onclick="showStartScreen()">← BACK</button>
    </div>`;
  $overlay.style.display='flex';
}
