import { S, LS, ACHIEVEMENTS, COLS, ROWS, VANISH_ROWS, COLOR_TO_KEY, SUPPORT_URL, MAX_PARTICLES, PIECES, SPRINT_LINES, LEVEL_LINES, SCORE_TABLE, TSPIN_SCORE, TSPIN_MINI_SCORE, mulberry32, fmtTime, _getAchievements, _getLifetime, gtag, getGameMode } from './shared.js';
import { toggleMute, startBGM, stopBGM, pauseBGM, resumeBGM, sfxMove, sfxRotate, sfxHardDrop, sfxHold, sfxLineClear, sfxGameOver, sfxTSpin, sfxAchievementUnlock, applyMuteToGain, onPageHide, onPageShow, closeAudio, sfxUIHover, sfxUIClick, sfxCountdownTick, sfxCountdownGo, sfxSprintGoal, sfxDailyComplete } from './audio.js';

document.addEventListener('mouseover', (e) => {
  const btn = e.target.closest('.action-btn, .lb-tab, .toggle-btn, .mode-card, .ach-badge-wrap');
  if (btn && (!e.relatedTarget || !btn.contains(e.relatedTarget))) sfxUIHover();
});
document.addEventListener('pointerdown', (e) => {
  document.body.classList.remove('using-kb');
  if (e.target.closest('.action-btn, .lb-tab, .toggle-btn, .mode-card, .ach-badge-wrap')) sfxUIClick();
}, {passive: true});
import {
  gc, gctx, pc, ncD, ncDx, hcD, hcDx, ncM, hcM, bgc,
  measureFPS, setLowPerfMode, resetPerfHold,
  initLayout, initStars, drawBackground,
  drawBoard, drawNext, drawHold, getCellSprite,
  spawnLineClearParticles, spawnLockParticles, spawnFloatingText, spawnDropTrail, spawnHardDropParticles, updateParticles,
  applyShake, _enableKbMode, _disableKbMode,
  updateUI, updateSprintTimer, showScorePopup, updateAPMPPS,
  updateDAS, updateARR, updateSDF, updateLockDelay, updateGhost, updateColorblind, cycleAnimIntensity, _animLabel, togglePerfMode,
  triggerScreenFlash, triggerAllClearFlash, triggerLevelUpVisuals, spawnGoldBurst,
  showAchievementToast, unlockAchievement,
  openHowToPlay, closeHowToPlay, openStats, closeStats, showAchTooltip, hideAchTooltip,
} from './ui.js';
import {
  _openDonation, _donationHTML,
  submitSprintScore, submitBlitzScore, shareSprintScore, captureSprintImage,
  lbHTML, submitScore, captureGameImage, shareScore,
  loadStartLeaderboard, renderLbTab, setLbMode
} from './leaderboard.js';
import {
  showDailyGateOverlay, startDailyChallenge, togglePause, _saveGameStats, _renderGameOverScreen,
  _renderSprintScreen, _renderBlitzScreen, showStartScreen, showModeSelector, openSettings
} from './screens.js';
import { TICK_RATE, enqueueInput, resetLoop, tickLoop } from './loop.js';
import { initPWA, offlineBarGameStart, offlineBarGameEnd } from './pwa.js';

document.addEventListener('gesturestart',  e=>e.preventDefault(), {passive:false});
document.addEventListener('gesturechange', e=>e.preventDefault(), {passive:false});
document.addEventListener('touchmove', e=>{ if(e.touches.length>1) e.preventDefault(); }, {passive:false});

// ─── State ────────────────────────────────────────────────────────────────────
let canHold;
let gameOver;
let dropInterval;
let animFrame;
let bag=[];
let _countdownTimer=null;
let _prng=null;

let lastWasRotate=false;
let lastKickNonZero=false;

// ─── Keyboard guide DOM refs ───────────────────────────────────────────────────
const _keyGuide={
  move:   document.getElementById('key-move'),
  rotate: document.getElementById('key-rotate'),
  rotateCcw: document.getElementById('key-rotate-ccw'),
  rotate180: document.getElementById('key-rotate-180'),
  soft:   document.getElementById('key-soft'),
  hard:   document.getElementById('key-hard'),
  hold:   document.getElementById('key-hold'),
  pause:  document.getElementById('key-pause'),
  mute:   document.getElementById('key-mute'),
};

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const $overlay  = document.getElementById('overlay');
const $combo    = document.getElementById('combo-display');

// ─── Bag / Pieces ─────────────────────────────────────────────────────────────
function refillBag(){bag=[...Object.keys(PIECES)];for(let i=bag.length-1;i>0;i--){const randVal=_prng?_prng():Math.random();const j=Math.floor(randVal*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}}
function nextFromBag(){if(!bag.length)refillBag();return bag.pop();}
function makePiece(key){const d=PIECES[key];return{key,shape:d.shape.map(r=>[...r]),color:d.color,x:Math.floor((COLS-d.shape[0].length)/2),y:-VANISH_ROWS,rot:0};}

// SRS kick tables — canvas y-down (wiki y-up values with y negated)
const KICKS_JLSTZ = {
  '0>1':[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '1>0':[[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '1>2':[[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '2>1':[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '2>3':[[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '3>2':[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '3>0':[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '0>3':[[0,0],[1,0],[1,-1],[0,2],[1,2]],
};
const KICKS_I = {
  '0>1':[[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
  '1>0':[[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
  '1>2':[[0,0],[-1,0],[2,0],[-1,-2],[2,1]],
  '2>1':[[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
  '2>3':[[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
  '3>2':[[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
  '3>0':[[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
  '0>3':[[0,0],[-1,0],[2,0],[-1,-2],[2,1]],
};
// 180° rotation kicks — competitive-standard pattern (max ±1 vertical).
// Horizontal nudge is tried before any vertical lift so a piece on the floor
// doesn't shoot up 2 cells when 180° is pressed. A 1-cell net drift over a
// 180→180 pair is inherent to SRS+ (basic kick is always tried first, so
// 2>0 stays in place after 0>2 lifted) and is accepted by the standard.
const KICKS_180 = {
  '0>2': [[0,0], [1,0], [-1,0], [0,-1], [1,-1], [-1,-1]],  // N→S: horiz first, up 1 last
  '2>0': [[0,0], [-1,0], [1,0], [0,1], [-1,1], [1,1]],     // S→N: horiz first, down 1 last
  '1>3': [[0,0], [0,-1], [1,-1], [-1,-1], [1,0], [-1,0]],  // E→W
  '3>1': [[0,0], [0,-1], [-1,-1], [1,-1], [-1,0], [1,0]],  // W→E
};

// ─── Board / Logic ────────────────────────────────────────────────────────────
function createBoard(){return Array.from({length:ROWS},()=>Array(COLS).fill(null));}

function validPos(piece,ox=0,oy=0,shape=null){
  const s=shape||piece.shape;
  for(let r=0;r<s.length;r++) for(let c=0;c<s[r].length;c++){
    if(!s[r][c])continue;
    const nx=piece.x+c+ox, ny=piece.y+r+oy;
    if(nx<0||nx>=COLS||ny>=ROWS)return false;
    if(ny>=0&&S.board[ny][nx])return false;
  }
  return true;
}

function rotateCW(shape){const R=shape.length,C=shape[0].length;return Array.from({length:C},(_,c)=>Array.from({length:R},(_,r)=>shape[R-1-r][c]));}
function rotateCCW(shape){const R=shape.length,C=shape[0].length;return Array.from({length:C},(_,c)=>Array.from({length:R},(_,r)=>shape[r][C-1-c]));}

function _tryRotate(newShape, fromRot, toRot, is180 = false) {
  const key = `${fromRot}>${toRot}`;
  let kicks;
  if (is180) {
    kicks = KICKS_180;
  } else {
    kicks = S.current.key === 'I' ? KICKS_I : S.current.key === 'O' ? [[0,0]] : KICKS_JLSTZ;
  }
  const table = kicks[key] || [[0,0]];
  for (let _ki = 0; _ki < table.length; _ki++) {
    const [dx, dy] = table[_ki];
    if (validPos(S.current, dx, dy, newShape)) {
      S.current.shape = newShape;
      S.current.x += dx;
      S.current.y += dy;
      S.current.rot = toRot;
      if (S.current.y > S.lowestY) { S.lowestY = S.current.y; S.lockResets = 0; }
      cancelLock(); lastWasRotate=true; lastKickNonZero=(_ki>0); sfxRotate();
      return true;
    }
  }
  return false;
}

function rotatePiece(dir = 1) { // 1 = CW, -1 = CCW, 2 = 180
  if (!S.current) return;
  const from = S.current.rot;
  const to = (from + dir + 4) % 4;
  let newShape;
  if (dir === 1) newShape = rotateCW(S.current.shape);
  else if (dir === -1) newShape = rotateCCW(S.current.shape);
  else if (dir === 2) newShape = rotateCW(rotateCW(S.current.shape));

  _tryRotate(newShape, from, to, dir === 2);
}

function cancelLock(){
  if (S.lockActive) {
    if (S.lockResets < 15) {
      S.lockActive = false; S.lockTimer = 0; S.lockResets++;
    }
  } else {
    S.lockActive = false; S.lockTimer = 0;
  }
}

function lockPiece(){
  const tspin=checkAllSpin();
  S.lockActive=false;S.lockTimer=0;
  S._pieceCount++;
  for(let r=0;r<S.current.shape.length;r++) for(let c=0;c<S.current.shape[r].length;c++){
    if(!S.current.shape[r][c])continue;
    const y=S.current.y+r;
    if(y<0){topOut();return;}
    S.board[y][S.current.x+c]=S.current.color;
  }
  const cleared=[];
  for(let r=ROWS-1;r>=0;r--){if(S.board[r].every(v=>v!==null))cleared.push(r);}
  if(cleared.length>0){
    S.flashLines=new Set(cleared);S.flashTimer=12;S.combo++;if(S.combo>S.maxCombo)S.maxCombo=S.combo;
    const mul=S.combo>1?S.combo:1;
    const basePts=(tspin==='full'||tspin==='allspin')
      ?TSPIN_SCORE[Math.min(cleared.length,3)]*S.level*mul
      :tspin==='mini'
      ?TSPIN_MINI_SCORE[Math.min(cleared.length,2)]*S.level*mul
      :SCORE_TABLE[Math.min(cleared.length,4)]*S.level*mul;
    const isDifficult=cleared.length===4||!!tspin;
    const b2bBonus=isDifficult&&S.b2b;
    const pts=b2bBonus?Math.floor(basePts*1.5):basePts;
    if(isDifficult){S.b2b=true;}else{S.b2b=false;}
    sfxLineClear(cleared.length);
    if(tspin){sfxTSpin();if(S.animIntensity==='full'){S.shakeFrames=Math.max(S.shakeFrames,12+cleared.length*6);S.shakeMag=Math.max(S.shakeMag,0.55);}}
    if(S.combo>1&&S.animIntensity!=='off'){
      S.comboFlash=15 + (S.combo>=4 ? 15 : 0);
      S.comboFlashColor=S.combo>=5?'#ff0080':S.combo>=3?'#a000ff':'#00c8ff';
      if(S.combo>=4 && S.animIntensity==='full') {
        S.shakeFrames=Math.max(S.shakeFrames, 10 + S.combo*3);
        S.shakeMag=Math.max(S.shakeMag, Math.min(2.5, S.combo*0.35));
        S.shakeAllDir=true;
      }
    }
    addScore(pts,cleared.length,tspin,b2bBonus);
    S.lines+=cleared.length;

    // Update lifetime stats and achievements (in-memory cache — no JSON.parse per line clear)
    const lifetime = _getLifetime();
    lifetime.totalLines = (lifetime.totalLines || 0) + cleared.length;
    if (cleared.length === 4) {
      lifetime.totalGlowtris = (lifetime.totalGlowtris || 0) + 1;
      unlockAchievement('glowtris_1');
    }
    localStorage.setItem(LS.LIFETIME, JSON.stringify(lifetime));

    if (tspin==='full'||tspin==='mini') {
      unlockAchievement('tspin_1');
      if (cleared.length === 3 && tspin==='full') unlockAchievement('tspin_triple');
    }
    if (S.combo >= 5) unlockAchievement('combo_5');
    if (S.combo >= 10) unlockAchievement('combo_10');
    if (lifetime.totalLines >= 100) unlockAchievement('lines_100');
    if (lifetime.totalLines >= 1000) unlockAchievement('lines_1000');

    const cy = (cleared[0] + cleared[cleared.length-1]) / 2 * S.CELL;
    spawnFloatingText(`+${pts}`, COLS/2*S.CELL, cy, '#00c8ff', 16);

    const nextLvl=Math.floor(S.lines/LEVEL_LINES)+1;
    if(nextLvl > S.level){
      S.level=nextLvl;
      spawnFloatingText(`LEVEL UP!`, COLS/2*S.CELL, ROWS/2*S.CELL, '#ffe600', 24);
      triggerLevelUpVisuals();
      if(S.level>=5) unlockAchievement('level_5');
      if(S.level>=10) unlockAchievement('level_10');
      if(S.level>=15) unlockAchievement('level_15');
    }
    dropInterval=Math.max(80,800-(S.level-1)*70);
    updateUI();
    const snap=[...cleared];
    setTimeout(()=>{
      // Guard: if game was reset before this fires bail out immediately.
      if(!S.gameRunning&&!gameOver)return;
      for(const r of snap.slice().sort((a,b)=>a-b)){S.board.splice(r,1);S.board.unshift(Array(COLS).fill(null));}
      spawnLineClearParticles(snap, tspin, false);
      if(snap.length>=4&&!tspin&&S.animIntensity==='full'){S.shakeFrames=25;S.shakeMag=0.7;}
      if(snap.length>=4){triggerScreenFlash();if(S.animIntensity!=='off')S.rainbowBorder=45;}
      // All-clear bonus: board completely empty
      if(S.board.every(row=>row.every(v=>v===null))){
        const bonus=2000*S.level;
        addScore(bonus,0,false);
        showScorePopup(bonus,-1,false); // -1 signals all-clear
        triggerAllClearFlash();
        spawnLineClearParticles(snap, false, true);
        unlockAchievement('all_clear');
      }
      S.flashLines=new Set();
      // Sprint end: check AFTER board splice so the cleared board is visible
      if(S.isSprintMode&&S.lines>=SPRINT_LINES){endSprint();return;}
      spawnPiece();
    },120);
  } else {
    if(tspin==='full'){sfxTSpin();addScore(TSPIN_SCORE[0]*S.level,0,'full');S.b2b=true;unlockAchievement('tspin_1');}
    else if(tspin==='mini'){sfxTSpin();S.b2b=true;unlockAchievement('tspin_1');}
    else{S.combo=0;S.b2b=false;$combo.textContent='';}
  }
  lastWasRotate=false;lastKickNonZero=false;
  spawnLockParticles(S.current);
  S.current = null;
  // In sprint mode, capture end time immediately when 40 lines reached.
  if(S.isSprintMode&&S.lines>=SPRINT_LINES){S._sprintEndTime=performance.now();return;}
  if(cleared.length === 0) spawnPiece();
}

function addScore(pts,n,tspin=false,b2b=false){
  S.score+=pts;
  // In sprint/flow modes score is cosmetic only — don't update marathon hi-score or achievements
  if(!S.isSprintMode&&!S.isFlowMode){
    if(S.score>S.hiScore){S.hiScore=S.score;localStorage.setItem(LS.HI,S.hiScore);}
    if(S.score>=50000)unlockAchievement('score_50k');
    if(S.score>=100000)unlockAchievement('score_100k');
    if(S.score>=250000)unlockAchievement('score_250k');
  }
  updateUI();showScorePopup(pts,n,tspin,b2b);
}

function spawnPiece(fromHold = false){
  lastWasRotate=false;lastKickNonZero=false;

  // IHS (Initial Hold System)
  if (!fromHold && canHold && (KEYS['KeyC'] || KEYS['ShiftLeft'] || KEYS['ShiftRight'])) {
    if (!S.held) {
      S.held = makePiece(S.next[0].key);
      S.next.shift(); S.next.push(makePiece(nextFromBag()));
      S.current = makePiece(S.next[0].key);
      S.next.shift(); S.next.push(makePiece(nextFromBag()));
    } else {
      S.current = makePiece(S.held.key);
      S.held = makePiece(S.next[0].key);
      S.next.shift(); S.next.push(makePiece(nextFromBag()));
    }
    canHold = false;
    sfxHold();
    drawHold();
  } else {
    S.current = makePiece(S.next.shift().key);
    S.next.push(makePiece(nextFromBag()));
    // Only reset canHold if this spawn was not triggered by a mid-game Hold
    if (!fromHold) canHold = true;
  }
  
  // IRS (Initial Rotation System) + pendingRot from inputs that arrived while
  // S.current was null (line-clear pause). pendingRot takes priority because
  // it represents an explicit tap, not just a held key.
  let rotShape = null, rotState = S.current.rot, irsDir = 0;
  if (S.pendingRot === 1)      irsDir = 1;
  else if (S.pendingRot === -1) irsDir = -1;
  else if (S.pendingRot === 2)  irsDir = 2;
  else if (KEYS['ArrowUp'] || KEYS['KeyX']) irsDir = 1;
  else if (KEYS['KeyZ'])                    irsDir = -1;
  else if (KEYS['KeyA'])                    irsDir = 2;
  S.pendingRot = 0;

  // IMS: fire buffered left/right from line-clear window
  if (S.pendingMove !== 0) {
    if (S.pendingMove === -1) { moveX(-1); S.dasCharge.left  = S.das; }
    else                      { moveX(1);  S.dasCharge.right = S.das; }
    S.pendingMove = 0;
  }

  if (irsDir === 1)       { rotShape = rotateCW(S.current.shape);                   rotState = (rotState + 1) % 4; S.current.irsDir = 1; }
  else if (irsDir === -1) { rotShape = rotateCCW(S.current.shape);                  rotState = (rotState + 3) % 4; S.current.irsDir = -1; }
  else if (irsDir === 2)  { rotShape = rotateCW(rotateCW(S.current.shape));         rotState = (rotState + 2) % 4; S.current.irsDir = 2; }

  if (rotShape && validPos(S.current, 0, 0, rotShape)) {
    S.current.shape = rotShape; S.current.rot = rotState;
  }
  
  S.current.justSpawned = true;
  S.lowestY = S.current.y; S.lockResets = 0; S.dcdTimer = S.dcd || 0;
  if (!S._gameStartTs) S._gameStartTs = performance.now();
  drawNext();if(!validPos(S.current))topOut();
}

function holdPiece(){
  if(!canHold||!S.gameRunning||S.gamePaused||!S.current||S._countdownVal)return;
  if(!S.held){S.held=makePiece(S.current.key);spawnPiece(true);}
  else{const t=S.current.key;S.current=makePiece(S.held.key);S.held=makePiece(t);if(!validPos(S.current)){topOut();return;}}
  S.lowestY = S.current.y; S.lockResets = 0;
  canHold=false;cancelLock();drawHold();
}

// ─── Ghost ────────────────────────────────────────────────────────────────────
function getGhostY(){let d=0;while(validPos(S.current,0,d+1))d++;return S.current.y+d;}

// ─── T-spin ───────────────────────────────────────────────────────────────────
function checkTSpin(){
  if(!S.current||S.current.key!=='T'||!lastWasRotate)return false;
  const x=S.current.x,y=S.current.y;
  // Corners of the T-piece 3x3 bounding box (TL, TR, BL, BR).
  const corners=[[x,y],[x+2,y],[x,y+2],[x+2,y+2]];
  function blocked(cx,cy){return cx<0||cx>=COLS||cy>=ROWS||(cy>=0&&S.board[cy][cx]);}
  const f=corners.map(([cx,cy])=>blocked(cx,cy)?1:0);
  if(f[0]+f[1]+f[2]+f[3]<3)return false;
  // The two "front" corners depend on the T's current orientation (rot):
  //   rot 0 (N, point up)    → top corners    [TL, TR]    = [0, 1]
  //   rot 1 (E, point right) → right corners  [TR, BR]    = [1, 3]
  //   rot 2 (S, point down)  → bottom corners [BL, BR]    = [2, 3]
  //   rot 3 (W, point left)  → left corners   [TL, BL]    = [0, 2]
  const fronts=[[0,1],[1,3],[2,3],[0,2]];
  const front=fronts[S.current.rot];
  const frontFilled=f[front[0]]+f[front[1]];
  if(frontFilled===2)return'full';
  if(frontFilled===1)return'mini';
  // Both back corners filled, no front → 3-corner rule: counts as mini
  return 'mini';
}

function checkAllSpin(){
  if(!S.current||!lastWasRotate)return false;
  if(S.current.key==='T')return checkTSpin();
  if(S.current.key==='O')return false;
  return lastKickNonZero?'allspin':false;
}

// ─── Keyboard ─────────────────────────────────────────────────────────────────
const KEYS={};

function updateKeyGuideState(code, isPressed) {
  let el = null;
  if (code === 'ArrowLeft' || code === 'ArrowRight') el = _keyGuide.move;
  else if (code === 'ArrowUp' || code === 'KeyX')   el = _keyGuide.rotate;
  else if (code === 'KeyZ' || code === 'ControlLeft' || code === 'ControlRight') el = _keyGuide.rotateCcw;
  else if (code === 'KeyA') el = _keyGuide.rotate180;
  else if (code === 'ArrowDown') el = _keyGuide.soft;
  else if (code === 'Space')                          el = _keyGuide.hard;
  else if (code === 'KeyC' || code === 'ShiftLeft')   el = _keyGuide.hold;
  else if (code === 'KeyP' || code === 'Escape')      el = _keyGuide.pause;
  else if (code === 'KeyM')                           el = _keyGuide.mute;
  if (el) el.classList.toggle('key-pressed', isPressed);
}
function handleUINavigation(e) {
  const overlay = document.getElementById('overlay');
  const help = document.getElementById('htp-overlay');
  const stats = document.getElementById('stats-overlay');
  const donation = document.getElementById('donation-modal');

  let activeOverlay = null;
  if (donation) activeOverlay = donation;
  else if (help && help.style.display === 'flex') activeOverlay = help;
  else if (stats && stats.style.display === 'flex') activeOverlay = stats;
  else if (overlay && overlay.style.display === 'flex') activeOverlay = overlay;

  if (!activeOverlay) return false;
  
  const active = document.activeElement;

  if (e.code === 'Escape' || e.code === 'Backspace') {
    if (e.code === 'Backspace' && active && active.tagName === 'INPUT' && active.type === 'text') return false;
    
    const btn = Array.from(activeOverlay.querySelectorAll('button')).find(b => {
      const t = b.textContent.toUpperCase();
      return b.classList.contains('close-btn') || b.classList.contains('cancel') || t.includes('BACK') || t === 'RESUME' || t === 'CANCEL';
    });
    if (btn) {
      e.preventDefault();
      sfxUIClick();
      btn.click();
      return true;
    }
  }

  if (active && active.tagName === 'INPUT' && active.type === 'text') {
    if (e.code !== 'Tab' && e.code !== 'Enter' && e.code !== 'Escape') return false;
    if (e.code === 'Enter') {
      // Let the keydown bubble up or just return false so the input handles it
      return false; 
    }
  }

  const isDown = e.code === 'ArrowDown';
  const isUp   = e.code === 'ArrowUp';
  const isRight= e.code === 'ArrowRight';
  const isLeft = e.code === 'ArrowLeft';

  const scrollable = activeOverlay.querySelector('#htp-scroll, #stats-scroll');
  if (scrollable && (isDown || isUp)) {
    scrollable.scrollTop += isDown ? 60 : -60;
    e.preventDefault();
    return true;
  }

  const focusables = Array.from(activeOverlay.querySelectorAll('button, input, a[href], [tabindex="0"]'))
    .filter(el => el.offsetWidth > 0 && el.offsetHeight > 0 && !el.disabled);
  
  if (focusables.length === 0) return false;
  let idx = focusables.indexOf(active);
  const oldIdx = idx;

  if (isDown || isRight || (e.code === 'Tab' && !e.shiftKey)) {
    if (active && active.type === 'range' && (isLeft || isRight)) return false;
    e.preventDefault();
    idx = (idx + 1) % focusables.length;
    focusables[idx].focus();
    if (idx !== oldIdx) sfxUIHover();
    return true;
  }
  if (isUp || isLeft || (e.code === 'Tab' && e.shiftKey)) {
    if (active && active.type === 'range' && (isLeft || isRight)) return false;
    e.preventDefault();
    idx = idx <= 0 ? focusables.length - 1 : idx - 1;
    focusables[idx].focus();
    if (idx !== oldIdx) sfxUIHover();
    return true;
  }
  if (e.code === 'Enter' || e.code === 'Space') {
    if (active && focusables.includes(active) && active.tagName !== 'INPUT') {
      e.preventDefault();
      sfxUIClick();
      active.click();
      return true;
    }
  }
  return false;
}

document.addEventListener('keydown',e=>{
  document.body.classList.add('using-kb');
  if(e.code==='KeyM') toggleMute();
  if (handleUINavigation(e)) return;
  updateKeyGuideState(e.code, true);
  if(!S._kbMode && window.matchMedia('(any-pointer:coarse)').matches) _enableKbMode();
  if(KEYS[e.code])return;KEYS[e.code]=true;
  if(!S.gameRunning)return;
  if(e.code==='KeyP' || e.code==='Escape'){togglePause();return;}
  if(S.gamePaused||S._countdownVal)return;
  if(e.code==='ArrowDown'||e.code==='Space') e.preventDefault();
  enqueueInput(e.code, 'down');
});
document.addEventListener('keyup',e=>{
  updateKeyGuideState(e.code, false);
  KEYS[e.code]=false;
});

// ─── Tick callbacks ───────────────────────────────────────────────────────────
function processInput(input){
  if(input.type!=='down')return;

  // During the 120ms line-clear pause S.current is null. Rotation taps in this
  // window would be silently dropped, so we buffer the intent for the next
  // spawn (acts like IRS even after the player released the key).
  if (!S.current) {
    if (input.code === 'ArrowUp' || input.code === 'KeyX') S.pendingRot = 1;
    else if (input.code === 'KeyZ' || input.code === 'ControlLeft' || input.code === 'ControlRight') S.pendingRot = -1;
    else if (input.code === 'KeyA') S.pendingRot = 2;
    else if (input.code === 'ArrowLeft')  S.pendingMove = -1;
    else if (input.code === 'ArrowRight') S.pendingMove =  1;
    return;
  }

  if (S.current.justSpawned) {
    if ((input.code === 'ArrowUp' || input.code === 'KeyX') && S.current.irsDir === 1) return;
    if ((input.code === 'KeyZ' || input.code === 'ControlLeft' || input.code === 'ControlRight') && S.current.irsDir === -1) return;
    if (input.code === 'KeyA' && S.current.irsDir === 2) return;
  }

  switch(input.code){
    case'ArrowLeft':  moveX(-1); S.dasCharge.left=0;  S._actionCount++; break;
    case'ArrowRight': moveX(1);  S.dasCharge.right=0; S._actionCount++; break;
    case'ArrowDown':  /* handled in gameTick */        S._actionCount++; break;
    case'ArrowUp':case'KeyX': rotatePiece(1);         S._actionCount++; break;
    case'KeyZ':case'ControlLeft':case'ControlRight': rotatePiece(-1);   S._actionCount++; break;
    case'KeyA': rotatePiece(2);                        S._actionCount++; break;
    case'Space':      hardDrop();                      S._actionCount++; break;
    case'KeyC':case'ShiftLeft': holdPiece();           S._actionCount++; break;
  }
}

// DAS/ARR pulses fire when held duration crosses S.das + n*S.arr boundaries.
// First ARR pulse fires at S.das + S.arr, matching the previous setTimeout/setInterval timing.
function _tickDAS(slot, key, action, dt){
  if(!KEYS[key]){S.dasCharge[slot]=0;return;}
  if(S.dcdTimer > 0) return; // Prevent DAS from accumulating/firing during DCD
  const prev=S.dasCharge[slot];
  S.dasCharge[slot]+=dt;
  if(S.dasCharge[slot]<S.das)return;
  const arr=Math.max(1,S.arr);
  const pulsesPrev=Math.floor(Math.max(0,prev-S.das)/arr);
  const pulsesNow =Math.floor((S.dasCharge[slot]-S.das)/arr);
  for(let i=pulsesPrev;i<pulsesNow;i++) action();
}

function gameTick(dt){
  if(!S.gameRunning||S.gamePaused||!S.current||S._countdownVal)return;
  S.current.justSpawned = false;
  if(S.dcdTimer > 0) S.dcdTimer = Math.max(0, S.dcdTimer - dt);
  if(S.lockActive){
    // If the piece slid into open air (e.g. after hitting the 15-reset cap),
    // drop the lock immediately instead of locking mid-air.
    if(validPos(S.current,0,1)){
      S.lockActive=false; S.lockTimer=0;
    }else{
      S.lockTimer-=dt;
      if(S.lockTimer<=0){lockPiece();return;}
    }
  }
  if(!S.lockActive){
    let gTimer=dt;
    if(KEYS['ArrowDown']){
      if(S.sdf===0){
        const gy=getGhostY();
        if(S.current.y<gy){
          S.score+=(gy-S.current.y); S.current.y=gy;
          if (S.current.y > S.lowestY) { S.lowestY = S.current.y; S.lockResets = 0; }
          spawnDropTrail(S.current); cancelLock(); lastWasRotate=false;lastKickNonZero=false; updateUI();
        }
        gTimer=dropInterval;
      }else{
        gTimer+=dt*S.sdf;
      }
    }
    S.gravityTimer+=gTimer;
    while(S.gravityTimer>=dropInterval){
      S.gravityTimer-=dropInterval;
      if(validPos(S.current,0,1)){
        S.current.y++;
        if (S.current.y > S.lowestY) { S.lowestY = S.current.y; S.lockResets = 0; }
        if(KEYS['ArrowDown'])S.score+=1;
        spawnDropTrail(S.current);
        if(S.gravityTimer<dropInterval) updateUI();
      }
      else{S.lockActive=true;S.lockTimer=S.lockMs;S.gravityTimer=0; updateUI(); break;}
    }
  }
  _tickDAS('left', 'ArrowLeft', ()=>moveX(-1), dt);
  _tickDAS('right','ArrowRight',()=>moveX(1),  dt);
}

function moveX(d){if(!S.current)return;if(validPos(S.current,d)){S.current.x+=d;cancelLock();lastWasRotate=false;lastKickNonZero=false;sfxMove();}}
function hardDrop(){
  if(!S.current)return;
  let d=0;while(validPos(S.current,0,1)){S.current.y++;d++;}
  S.score+=d*2;updateUI();
  if(S.animIntensity==='full'){S.shakeFrames=Math.min(12,5+Math.floor(d*0.45));S.shakeMag=2.8;S.shakeAllDir=true;}
  spawnHardDropParticles(S.current);
  sfxHardDrop();
  lockPiece();
}

// ─── Touch buttons ────────────────────────────────────────────────────────────
function makeTouchBtn(id,onPress,mode='repeat',keyTarget=null){
  const el=document.getElementById(id);if(!el)return;
  let iv=null,to=null,on=false;
  function press(e){
    e.preventDefault();e.stopPropagation();if(on)return;on=true;el.classList.add('pressed');
    if(!S.gameRunning&&mode!=='any')return;if((S.gamePaused||S._countdownVal)&&mode!=='any')return;
    if(keyTarget) KEYS[keyTarget] = true;
    if(onPress) onPress();
    if(mode==='repeat'){to=setTimeout(()=>{iv=setInterval(()=>{if(S.gameRunning&&!S.gamePaused&&!S._countdownVal&&onPress)onPress();},S.arr);},S.das);}
  }
  function rel(e){
    if(e)e.preventDefault();if(!on)return;on=false;el.classList.remove('pressed');
    if(keyTarget) KEYS[keyTarget] = false;
    clearTimeout(to);clearInterval(iv);to=null;iv=null;
  }
  el.addEventListener('touchstart',press,{passive:false});
  el.addEventListener('touchend',rel,{passive:false});
  el.addEventListener('touchcancel',rel,{passive:false});
  el.addEventListener('mousedown',press);
  el.addEventListener('mouseup',rel);
  el.addEventListener('mouseleave',rel);
}

// D-pad: container-level handler so the finger can slide between buttons
// (left ↔ right ↔ down ↔ drop) without lifting. Each button has a `press`
// (initial action on activation) and a `keyTarget` (sets KEYS[code] so the
// tick-based DAS handles the held-state automatically — same path as keyboard).
function makeDpadSlide(containerSelector, buttons){
  const container = document.querySelector(containerSelector);
  if (!container) return;
  let activeId = null;
  let touchId  = null;

  function btnAt(x, y){
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const btn = el.closest('.tbtn');
    return btn && buttons[btn.id] ? btn.id : null;
  }
  function gateOpen(){
    return S.gameRunning && !S.gamePaused && !S._countdownVal;
  }
  function activate(id){
    if (id === activeId) return;
    if (activeId) deactivate();
    if (!id) return;
    activeId = id;
    const el = document.getElementById(id);
    if (el) el.classList.add('pressed');
    if (!gateOpen()) return;
    const cfg = buttons[id];
    if (cfg.keyTarget) KEYS[cfg.keyTarget] = true;
    if (cfg.press) cfg.press();
  }
  function deactivate(){
    if (!activeId) return;
    const id = activeId;
    const el = document.getElementById(id);
    if (el) el.classList.remove('pressed');
    const cfg = buttons[id];
    if (cfg.keyTarget) KEYS[cfg.keyTarget] = false;
    activeId = null;
  }

  container.addEventListener('touchstart', (e) => {
    if (touchId !== null) return;       // ignore secondary touches
    e.preventDefault();
    const t = e.changedTouches[0];
    touchId = t.identifier;
    activate(btnAt(t.clientX, t.clientY));
  }, { passive: false });

  container.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === touchId) {
        e.preventDefault();
        activate(btnAt(t.clientX, t.clientY));
        break;
      }
    }
  }, { passive: false });

  function endTouch(e){
    for (const t of e.changedTouches) {
      if (t.identifier === touchId) {
        touchId = null;
        deactivate();
        break;
      }
    }
  }
  container.addEventListener('touchend',    endTouch, { passive: false });
  container.addEventListener('touchcancel', endTouch, { passive: false });

  // Mouse fallback (desktop testing only).
  container.addEventListener('mousedown', (e) => {
    const id = btnAt(e.clientX, e.clientY);
    if (!id) return;
    e.preventDefault();
    activate(id);
    const move = (ev) => activate(btnAt(ev.clientX, ev.clientY));
    const up   = () => { deactivate(); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  });
}

makeDpadSlide('.nes-dpad', {
  'btn-left':  { press: () => { moveX(-1); S.dasCharge.left = 0; },  keyTarget: 'ArrowLeft'  },
  'btn-right': { press: () => { moveX(1);  S.dasCharge.right = 0; }, keyTarget: 'ArrowRight' },
  'btn-soft':  { press: () => { S.dasCharge.down = 0; },              keyTarget: 'ArrowDown'  },
  'btn-drop':  { press: () => hardDrop() },
});

makeTouchBtn('btn-rotate',()=>rotatePiece(1),'game');
makeTouchBtn('btn-rotate-ccw',()=>rotatePiece(-1),'game');
makeTouchBtn('btn-rotate-180',()=>rotatePiece(2),'game');
makeTouchBtn('btn-hold',  ()=>holdPiece(),'game');
makeTouchBtn('btn-pause', ()=>togglePause(),'any');

// ─── Game loop ────────────────────────────────────────────────────────────────
// RAF drives rendering; logic advances on a fixed 1ms tick inside tickLoop.
let lastFrameTs = 0;
let _apmPpsTimer = 0;
function gameLoop(ts){
  if (!lastFrameTs) lastFrameTs = ts;
  const dt = ts - lastFrameTs;
  lastFrameTs = ts;
  const dtFactor = Math.min(dt / 16.666, 3); // 1.0 at 60Hz, 0.41 at 144Hz. Cap at 3 for lag spikes.

  measureFPS(ts);
  tickLoop(ts, { onInput: processInput, onTick: gameTick });
  drawBackground(dtFactor);
  if((S.isSprintMode||S.isBlitzMode)&&S.gameRunning&&!S.gamePaused&&!S._countdownVal)updateSprintTimer();
  _apmPpsTimer+=dt; if(_apmPpsTimer>=1000){_apmPpsTimer=0;if(S.gameRunning&&!S.gamePaused)updateAPMPPS();}
  drawBoard(dtFactor);
  updateParticles(dtFactor);
  applyShake(dtFactor);
  animFrame=requestAnimationFrame(gameLoop);
}

// ─── Game control ─────────────────────────────────────────────────────────────
function loadSettings(){
  S.muteAudio=localStorage.getItem(LS.MUTE)==='1';
  S.das=parseInt(localStorage.getItem(LS.DAS)||'150');
  S.arr=parseInt(localStorage.getItem(LS.ARR)||'33');
  S.sdf=parseInt(localStorage.getItem(LS.SDF)||'40');
  S.dcd=parseInt(localStorage.getItem(LS.DCD)||'16');
  S.lockMs=parseInt(localStorage.getItem(LS.LOCK)||'500');
  S.ghostVisible=localStorage.getItem(LS.GHOST)!=='0';
  S.colorblindMode=localStorage.getItem(LS.COLORBLIND)==='1';
  S.animIntensity=localStorage.getItem(LS.ANIM)||'full';
  const icon=document.getElementById('mute-icon');
  const btn=document.getElementById('btn-mute');
  if(icon)icon.textContent=S.muteAudio?'volume_off':'volume_up';
  if(btn)btn.classList.toggle('muted',S.muteAudio);
  applyMuteToGain();
}

export function startGame(){
  offlineBarGameStart();
  $overlay.style.display='none';
  $combo.textContent='';
  // Reset display synchronously so overlay-hide and value-reset happen in the
  // same JS task — prevents a one-frame flash of the previous score/timer.
  S.score=0; S.lines=0; S.level=1; S._sprintStartTime=0;
  updateUI();
  if(S.isSprintMode)updateSprintTimer();
  setTimeout(_doStartGame, 0);
}
function _doStartGame(){
  loadSettings();
  if (!S.isDailyMode) { _prng = null; }
  const savedPerf = localStorage.getItem(LS.LOW_PERF)==='1';
  if(!S._perfLocked && !savedPerf){ setLowPerfMode(false); }
  else { setLowPerfMode(true); }
  resetPerfHold(S._perfLocked, savedPerf);
  // Sprites are pre-warmed at idle time (page load); this is a fast cache hit
  for(const k of Object.keys(PIECES))getCellSprite(PIECES[k].color);
  S.board=createBoard();S.score=0;S.lines=0;S.level=1;S.combo=0;S.maxCombo=0;dropInterval=800;S.b2b=false;
  S.particles=[];S.shakeFrames=0;S.shakeMag=0.4;S.shakeAllDir=false;S.flashLines=new Set();S.flashTimer=0;
  S.lockTimer=0;S.lockActive=false;lastWasRotate=false;lastKickNonZero=false;S.rainbowBorder=0;S.comboFlash=0;S.comboFlashColor='#00c8ff';S.dangerPulse=0;S.levelUpScanline=0;
  S.gravityTimer=0;S.dasCharge={left:0,right:0,down:0};S.pendingRot=0;S.pendingMove=0;
  S._actionCount=0;S._pieceCount=0;S._gameStartTs=0;
  S.hiScore=parseInt(localStorage.getItem(LS.HI)||'0');
  bag=[];refillBag();S.next=[];for(let i=0;i<3;i++)S.next.push(makePiece(nextFromBag()));S.held=null;canHold=true;
  S.gameRunning=true;S.gamePaused=false;gameOver=false;
  gtag('game_start', { game_mode: getGameMode() });

  // ── Sprint & Time Attack init ──────────────────────────────────────────────
  const psl=document.getElementById('panel-score-label');
  const lsl=document.getElementById('lines-sub-label');
  const isTimeAttack = S.isBlitzMode;
  
  if(S.isSprintMode){
    S._sprintHiTime=parseInt(localStorage.getItem(LS.SPRINT_HI)||'0');
    S._sprintEndTime=0;S._sprintStartTime=0;
    if(psl)psl.textContent='TIME';
    if(lsl)lsl.textContent='LEFT';
  } else if(isTimeAttack) {
    S._blitzHiScore = parseInt(localStorage.getItem(LS.BLITZ_HI)||'0');
    S._timeAttackStartTime = 0;
    if(psl)psl.textContent='TIME';
    if(lsl)lsl.textContent='SCORE';
  } else {
    if(psl)psl.textContent='SCORE';
    if(lsl)lsl.textContent='CLEARED';
  }

  if(S.isFlowMode){
    S._flowHiScore=parseInt(localStorage.getItem(LS.FLOW_HI)||'0');
    S._flowRounds=0; _flowCollapsing=false;
  }

  spawnPiece();drawNext();drawHold();updateUI();
  if(S.isSprintMode || isTimeAttack)updateSprintTimer();
  if(animFrame)cancelAnimationFrame(animFrame);
  resetLoop(performance.now());
  startBGM();
  animFrame=requestAnimationFrame(gameLoop);
  startCountdown(()=>{
    S.gravityTimer=0;
    if(S.isSprintMode)S._sprintStartTime=performance.now();
    if(S.isBlitzMode)S._timeAttackStartTime=performance.now();
  });
}

export function launchDailyChallenge() {
  document.getElementById('overlay').style.display = 'none';
  S.isSprintMode=false;
  S.isBlitzMode=false;
  S.isFlowMode=false;
  S.isDailyMode=true;
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  _prng = mulberry32(parseInt(todayStr, 10));
  startGame();
}

let _sprintPauseTs = 0;

export function pauseGameTiming() {
  if (S.isSprintMode && S._sprintStartTime > 0) _sprintPauseTs = performance.now();
  if (_countdownTimer) { clearInterval(_countdownTimer); _countdownTimer = null; }
}

export function resumeGameTiming() {
  if (S.isSprintMode && _sprintPauseTs > 0) {
    S._sprintStartTime += performance.now() - _sprintPauseTs;
    _sprintPauseTs = 0;
  }
  resetLoop(performance.now());
}

// Unpause with countdown. Resets the loop immediately (prevents tick accumulation),
// then runs 3-2-1. Sprint timer compensation is deferred to countdown end so the
// 3 countdown seconds are also excluded from sprint time.
export function resumeWithCountdown() {
  resetLoop(performance.now());
  startCountdown(() => {
    if (S.isSprintMode && _sprintPauseTs > 0) {
      S._sprintStartTime += performance.now() - _sprintPauseTs;
      _sprintPauseTs = 0;
    }
  });
}

export function startCountdown(onComplete) {
  S._countdownGo=0;
  S._countdownVal=3;
  S._countdownTs=performance.now();
  if (_countdownTimer) clearInterval(_countdownTimer);
  if(!S.muteAudio) sfxCountdownTick(3);
  _countdownTimer=setInterval(()=>{
    S._countdownVal--;
    S._countdownTs=performance.now();
    if(S._countdownVal<=0){
      clearInterval(_countdownTimer);_countdownTimer=null;S._countdownVal=0;
      S._countdownGo=55;
      if(onComplete)onComplete();
      if(!S.muteAudio) sfxCountdownGo();
    }else{
      if(!S.muteAudio) sfxCountdownTick(S._countdownVal);
    }
  },1000);
}

export function stopGameAndReset() {
  clearInterval(_countdownTimer); _countdownTimer=null;
  S._countdownVal=0; S._countdownGo=0; S.gamePaused=false;
  S.gameRunning=false;
  if(animFrame){cancelAnimationFrame(animFrame);animFrame=null;}
  animFrame=requestAnimationFrame(function bgOnly(ts){drawBackground();if(!S.gameRunning)animFrame=requestAnimationFrame(bgOnly);});
}

function endGame(){
  S.gameRunning=false;gameOver=true;
  stopBGM();sfxGameOver();

  // Sprint top-out: show "SPRINT FAILED" without saving marathon stats
  if(S.isSprintMode){
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
      if(!S.board[r][c])continue;
      const a=Math.random()*Math.PI*2,sp=Math.random()*6+2;
      S.particles.push({x:(c+.5)*S.CELL,y:(r+.5)*S.CELL,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2,life:1,decay:Math.random()*.01+.005,color:S.board[r][c],size:Math.random()*5+3,type:'spark'});
    }
    S.shakeFrames=40;S.shakeMag=0.7;
    setTimeout(()=>{
      $overlay.innerHTML=`
        <div class="glass-panel">
          <h1 style="font-size:20px;margin-bottom:18px">SPRINT FAILED</h1>
          <div style="width:100%;text-align:center;margin-bottom:22px">
            <div class="sub" style="margin-bottom:3px">${Math.max(0,SPRINT_LINES-S.lines)} LINES REMAINING</div>
          </div>
          <div class="btn-row" style="gap:6px;width:100%">
            <button class="action-btn sm" style="flex:1" onclick="startSprintMode()">RETRY</button>
            <button class="action-btn sm ghost" style="flex:1" onclick="showStartScreen()">BACK</button>
          </div>
        </div>`;
      $overlay.style.display='flex';
    },600);
    return;
  }

  const stats = _saveGameStats();
  gtag('game_over', { game_mode: getGameMode(), score: S.score, lines: S.lines, level: S.level, is_new_best: stats.isNewBest });

  // Explode all board pieces into spark particles
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
    if(!S.board[r][c])continue;
    const a=Math.random()*Math.PI*2,sp=Math.random()*6+2;
    S.particles.push({x:(c+.5)*S.CELL,y:(r+.5)*S.CELL,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2,life:1,decay:Math.random()*.01+.005,color:S.board[r][c],size:Math.random()*5+3,type:'spark'});
  }
  S.shakeFrames=40;S.shakeMag=0.7;

  if(stats.isNewBest){
    sfxSprintGoal();
    for(let i=0;i<60;i++){
      const a=Math.random()*Math.PI*2,sp=Math.random()*10+3;
      S.particles.push({x:(Math.random()*COLS)*S.CELL,y:(Math.random()*ROWS*0.5)*S.CELL,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,decay:Math.random()*.01+.005,color:['#ffe600','#ffaa00','#ffffff'][Math.floor(Math.random()*3)],size:Math.random()*6+2,type:'star'});
    }
  }

  setTimeout(() => _renderGameOverScreen(stats), 600);
}

// ─── Top-out router ─────────────────────────────────────────────────────────────
// Flow is an endless mode: a top-out collapses the board and continues instead of
// ending the run. Every other mode ends normally.
function topOut(){
  if(S.isFlowMode) flowCollapse();
  else endGame();
}

// ─── Flow (endless) ─────────────────────────────────────────────────────────────
let _flowCollapsing = false;
function flowCollapse(){
  if(_flowCollapsing) return;      // guard against re-entry during the wipe window
  _flowCollapsing = true;
  S._flowRounds++;

  // Persist best cumulative score reached so far
  if(S.score > S._flowHiScore){ S._flowHiScore = S.score; localStorage.setItem(LS.FLOW_HI, S.score); }

  // Explode the stacked board into spark particles, then shake + flash
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
    if(!S.board[r][c])continue;
    const a=Math.random()*Math.PI*2,sp=Math.random()*6+2;
    S.particles.push({x:(c+.5)*S.CELL,y:(r+.5)*S.CELL,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2,life:1,decay:Math.random()*.01+.005,color:S.board[r][c],size:Math.random()*5+3,type:'spark'});
  }
  S.shakeFrames=40;S.shakeMag=0.7;
  if(S.animIntensity!=='off') triggerScreenFlash();
  sfxGameOver();
  S.current=null;          // hide the active piece during the collapse window

  // After the explosion plays, wipe the board and resume the same run
  setTimeout(()=>{
    // Bail if the run ended or the player switched modes during the wipe window
    if(!S.gameRunning || !S.isFlowMode){ _flowCollapsing=false; return; }
    S.board=createBoard();
    S.combo=0;S.b2b=false;S.flashLines=new Set();S.flashTimer=0;
    S.lockActive=false;S.lockTimer=0;S.gravityTimer=0;
    spawnFloatingText(`ROUND ${S._flowRounds+1}`, COLS/2*S.CELL, ROWS/2*S.CELL, '#a000ff', 24);
    spawnPiece();
    updateUI();
    _flowCollapsing=false;
  },500);
}

// ─── Sprint ───────────────────────────────────────────────────────────────────
function endSprint(){
  const timeMs=Math.round(S._sprintEndTime-S._sprintStartTime);
  S.gameRunning=false;gameOver=true;
  stopBGM();
  sfxSprintGoal();

  const prevBest=S._sprintHiTime;
  const isNewBest=prevBest===0||timeMs<prevBest;
  if(isNewBest){S._sprintHiTime=timeMs;localStorage.setItem(LS.SPRINT_HI,timeMs);}
  gtag('game_over', { game_mode: 'sprint', time_ms: timeMs, is_new_best: isNewBest });
  unlockAchievement('sprint_finish');

  if(S.animIntensity!=='off'){
    if(isNewBest){
      triggerAllClearFlash();
      spawnGoldBurst((COLS/2)*S.CELL, (ROWS/2)*S.CELL);
      spawnGoldBurst((COLS/2)*S.CELL - 60, (ROWS/2)*S.CELL + 40);
      spawnGoldBurst((COLS/2)*S.CELL + 60, (ROWS/2)*S.CELL - 20);
    } else {
      triggerScreenFlash();
      spawnGoldBurst((COLS/2)*S.CELL, (ROWS/2)*S.CELL);
    }

    for(let i=0;i<60;i++){
      const a=Math.random()*Math.PI*2,sp=Math.random()*10+3;
      S.particles.push({x:(Math.random()*COLS)*S.CELL,y:(Math.random()*ROWS*0.5)*S.CELL,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,decay:Math.random()*.01+.005,color:['#00ff88','#00c8ff','#ffe600','#ffffff'][Math.floor(Math.random()*4)],size:Math.random()*6+2,type:'star'});
    }
  }
  sfxSprintGoal();
  setTimeout(()=>_renderSprintScreen(timeMs,isNewBest,prevBest),600);
}

// ─── Time Attack (Blitz) ──────────────────────────────────────────────────────
export function endTimeAttack(){
  S.gameRunning=false;gameOver=true;
  stopBGM();
  sfxSprintGoal();

  const prevBest = S._blitzHiScore;
  const isNewBest = S.score > prevBest;
  
  if(isNewBest){
    S._blitzHiScore = S.score; localStorage.setItem(LS.BLITZ_HI, S.score);
  }

  if(S.animIntensity!=='off'){
    if(isNewBest){
      triggerAllClearFlash();
      spawnGoldBurst((COLS/2)*S.CELL, (ROWS/2)*S.CELL);
      spawnGoldBurst((COLS/2)*S.CELL - 60, (ROWS/2)*S.CELL + 40);
      spawnGoldBurst((COLS/2)*S.CELL + 60, (ROWS/2)*S.CELL - 20);
    } else {
      triggerScreenFlash();
      spawnGoldBurst((COLS/2)*S.CELL, (ROWS/2)*S.CELL);
    }
    for(let i=0;i<60;i++){
      const a=Math.random()*Math.PI*2,sp=Math.random()*10+3;
      S.particles.push({x:(Math.random()*COLS)*S.CELL,y:(Math.random()*ROWS*0.5)*S.CELL,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,decay:Math.random()*.01+.005,color:['#ff2040','#cc00ff','#ffe600','#ffffff'][Math.floor(Math.random()*4)],size:Math.random()*6+2,type:'star'});
    }
  }

  setTimeout(() => _renderBlitzScreen(S.score, isNewBest, prevBest), 600);
}

export function startSprintMode(){
  S.isSprintMode=true;
  S.isBlitzMode=false;
  S.isDailyMode=false;
  S.isFlowMode=false;
  startGame();
}

export function startBlitzMode(){
  S.isSprintMode=false;
  S.isBlitzMode=true;
  S.isDailyMode=false;
  S.isFlowMode=false;
  startGame();
}

export function startMarathonMode(){
  S.isSprintMode=false;
  S.isBlitzMode=false;
  S.isDailyMode=false;
  S.isFlowMode=false;
  startGame();
}

export function startFlowMode(){
  S.isSprintMode=false;
  S.isBlitzMode=false;
  S.isDailyMode=false;
  S.isFlowMode=true;
  startGame();
}

// ─── Init ─────────────────────────────────────────────────────────────────────
// Initialize shared visual state
S.flashLines = new Set();

initLayout();
initStars();
loadSettings();


S.hiScore=parseInt(localStorage.getItem(LS.HI)||'0');
const $hiScore  = document.getElementById('hi-score');
const $hiScoreM = document.getElementById('hi-score-m');
if($hiScore)$hiScore.textContent=S.hiScore.toLocaleString();
if($hiScoreM)$hiScoreM.textContent=S.hiScore.toLocaleString();
setTimeout(() => {
  fetch('/api/maintenance').then(r=>r.json()).then(data=>{
    if(!data||!data.time)return;
    const el=document.getElementById('maintenance-bar');
    if(!el)return;
    const t=data.time?new Date(data.time).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'';
    document.getElementById('maintenance-text').textContent=t?`⚠ ${data.msg} — ${t}`:`⚠ ${data.msg}`;
    el.style.display='block';
  }).catch(()=>{});
}, 100);

document.fonts.ready.then(() => {
  initPWA();
  animFrame=requestAnimationFrame(function bgOnly(ts){drawBackground();if(!S.gameRunning)animFrame=requestAnimationFrame(bgOnly);});
  showStartScreen();
  const mode = new URLSearchParams(window.location.search).get('mode');
  if (mode === 'marathon') setTimeout(startMarathonMode, 100);
  else if (mode === 'sprint') setTimeout(startSprintMode, 100);
  else if (mode === 'daily') setTimeout(startDailyChallenge, 100);
  else if (mode === 'flow') setTimeout(startFlowMode, 100);
});
// Pre-warm cell sprites during idle so startGame() click doesn't block (INP fix)
(window.requestIdleCallback||function(cb){setTimeout(cb,200);})(function(){
  for(var k in PIECES)getCellSprite(PIECES[k].color);
},{timeout:8000});

// ─── Memory / resource lifecycle ─────────────────────────────────────────────
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){onPageHide();}else{onPageShow();}
});
window.addEventListener('beforeunload',()=>{
  closeAudio();
  if(animFrame){cancelAnimationFrame(animFrame);animFrame=null;}
});

// ─── Error monitoring ─────────────────────────────────────────────────────────
const _VERSION = 'v0.3.3';
window.onerror = function(msg, src, line, col, err) {
  console.error('[glowtris ' + _VERSION + '] uncaught error', {
    msg, src: src ? src.replace(window.location.origin, '') : src, line, col,
    stack: err && err.stack ? err.stack.split('\n').slice(0, 5).join('\n') : null,
  });
};
window.onunhandledrejection = function(e) {
  const reason = e.reason;
  console.error('[glowtris ' + _VERSION + '] unhandled rejection', {
    msg: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error && reason.stack ? reason.stack.split('\n').slice(0, 5).join('\n') : null,
  });
};

// ─── Expose functions needed by inline onclick handlers ───────────────────────
// esbuild bundles to IIFE — functions are not global by default.
// HTML template uses onclick="fn()" style which requires window.fn.
Object.assign(window, {
  startGame, startSprintMode, startBlitzMode, startDailyChallenge, launchDailyChallenge,
  startFlowMode, startMarathonMode,
  togglePause, showStartScreen, showModeSelector, openSettings,
  submitScore, submitSprintScore, submitBlitzScore, shareScore, shareSprintScore,
  renderLbTab, setLbMode, loadStartLeaderboard,
  toggleMute, updateDAS, updateARR, updateSDF, updateLockDelay,
  updateGhost, updateColorblind, cycleAnimIntensity, togglePerfMode,
  openHowToPlay, closeHowToPlay, openStats, closeStats,
  showAchTooltip, hideAchTooltip,
  _openDonation,
});
