import { S, LS } from './shared.js';

// ─── Audio state (module-local) ───────────────────────────────────────────────
let audioCtx=null,masterGain=null,bgmGain=null,sfxGain=null,bgmPlaying=false,bgmNextTime=0,bgmBeat=0,bgmScheduler=null,bgmNodes=[];


function getAudioCtx(){
  // If the browser fully closed the context (rare — long backgrounding on iOS
  // can do this), recreate it. resume() does nothing on a closed context.
  if(audioCtx && audioCtx.state==='closed'){
    audioCtx=null; masterGain=null; bgmGain=null; sfxGain=null;
  }
  if(!audioCtx){
    audioCtx=new(window.AudioContext||window.webkitAudioContext)();
    masterGain=audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    masterGain.gain.value=S.muteAudio?0:1;
    bgmGain=audioCtx.createGain();
    bgmGain.gain.value=S.bgmVol/100;
    bgmGain.connect(masterGain);
    sfxGain=audioCtx.createGain();
    sfxGain.gain.value=S.sfxVol/100;
    sfxGain.connect(masterGain);
  }
  // 'suspended' = standard pause; 'interrupted' = iOS 16+ backgrounding state.
  // Both need an explicit resume() inside a user-gesture handler to recover.
  if(audioCtx.state==='suspended' || audioCtx.state==='interrupted'){
    audioCtx.resume().catch(()=>{});
  }
  return audioCtx;
}

export function toggleMute(){
  S.muteAudio=!S.muteAudio;
  // User gesture — also use this opportunity to wake a suspended/interrupted
  // audio context. iOS PWAs in particular can only resume from within a
  // gesture handler, and the routing to speaker may also need re-unlocking
  // after a long backgrounding.
  if(audioCtx){
    if(audioCtx.state==='closed'){
      // Force recreation on next playBeep — masterGain is gone too.
      audioCtx=null; masterGain=null; bgmGain=null; sfxGain=null;
    } else if(audioCtx.state==='suspended' || audioCtx.state==='interrupted'){
      audioCtx.resume().catch(()=>{});
    }
  }
  if(masterGain)masterGain.gain.value=S.muteAudio?0:1;
  localStorage.setItem(LS.MUTE,S.muteAudio?'1':'0');
  const icon=document.getElementById('mute-icon');
  const btn=document.getElementById('btn-mute');
  if(icon)icon.textContent=S.muteAudio?'volume_off':'volume_up';
  if(btn)btn.classList.toggle('muted',S.muteAudio);
  ['ov','st'].forEach(p=>{
    const b=document.getElementById(p+'-mute-btn');
    if(b){b.textContent=S.muteAudio?'🔇 AUDIO OFF':'🔊 AUDIO ON';b.classList.toggle('muted',S.muteAudio);}
  });
}

export function updateBGMVolume(val) {
  S.bgmVol = Math.max(0, Math.min(100, Number(val)));
  if (bgmGain) bgmGain.gain.value = S.bgmVol / 100;
  localStorage.setItem(LS.BGM_VOL, S.bgmVol);
  _syncVolLabels();
}

export function updateSFXVolume(val) {
  S.sfxVol = Math.max(0, Math.min(100, Number(val)));
  if (sfxGain) sfxGain.gain.value = S.sfxVol / 100;
  localStorage.setItem(LS.SFX_VOL, S.sfxVol);
  _syncVolLabels();
}

function _syncVolLabels() {
  const icon = document.getElementById('mute-icon');
  const btn  = document.getElementById('btn-mute');
  const allMuted = S.muteAudio || (S.bgmVol === 0 && S.sfxVol === 0);
  if (icon) icon.textContent = allMuted ? 'volume_off' : S.bgmVol === 0 ? 'music_off' : 'volume_up';
  if (btn)  btn.classList.toggle('muted', allMuted);
  ['ov','st'].forEach(p => {
    const bv = document.getElementById(`${p}-bgm-val`);
    const sv = document.getElementById(`${p}-sfx-val`);
    if (bv) bv.textContent = S.bgmVol + '%';
    if (sv) sv.textContent = S.sfxVol + '%';
  });
}

const _n=s=>440*Math.pow(2,s/12);

// ── NORMAL BGM (MARATHON): Minecraft-like Ambient (Sparse, Slow, C Major/Am) ───────────────
const BGM_MELODY=[
  // Bar 1 (C Major)
  _n(3), null, null, null,  null, null, _n(10), null,  _n(7), null, null, null,  null, null, null, null,
  // Bar 2 (F Major)
  _n(8), null, null, null,  null, null, _n(3), null,  _n(0), null, null, null,  null, null, null, null,
  // Bar 3 (G Major)
  _n(10), null, null, null,  null, null, _n(5), null,  _n(2), null, null, null,  null, null, null, null,
  // Bar 4 (C Major)
  _n(7), null, null, null,  null, null, _n(-2), null,  _n(3), null, null, null,  null, null, null, null,
  // Bar 5 (C Major higher)
  _n(15), null, null, null,  null, null, _n(10), null,  _n(7), null, null, null,  null, null, null, null,
  // Bar 6 (F Major)
  _n(12), null, null, null,  null, null, _n(8), null,  _n(3), null, null, null,  null, null, null, null,
  // Bar 7 (G Major)
  _n(14), null, null, null,  null, null, _n(10), null,  _n(5), null, null, null,  null, null, null, null,
  // Bar 8 (C Major)
  _n(15), null, null, null,  _n(7), null, null, null,  _n(10), null, null, null,  _n(3), null, null, null,
];
const BGM_HARMONY=[
  _n(-5), null, null, null, null, null, null, null,   _n(0), null, null, null, null, null, null, null,
  _n(-4), null, null, null, null, null, null, null,   _n(0), null, null, null, null, null, null, null,
  _n(-7), null, null, null, null, null, null, null,   _n(-2), null, null, null, null, null, null, null,
  _n(-9), null, null, null, null, null, null, null,   _n(-5), null, null, null, null, null, null, null,
  _n(-5), null, null, null, null, null, null, null,   _n(3), null, null, null, null, null, null, null,
  _n(-4), null, null, null, null, null, null, null,   _n(3), null, null, null, null, null, null, null,
  _n(-2), null, null, null, null, null, null, null,   _n(5), null, null, null, null, null, null, null,
  _n(-5), null, null, null, null, null, null, null,   _n(0), null, null, null, null, null, null, null,
];
const BGM_BASS_WALK=[
  _n(-21)/4, _n(-21)/4, _n(-21)/4, _n(-21)/4,
  _n(-16)/4, _n(-16)/4, _n(-16)/4, _n(-16)/4,
  _n(-14)/4, _n(-14)/4, _n(-14)/4, _n(-14)/4,
  _n(-21)/4, _n(-21)/4, _n(-21)/4, _n(-21)/4,
  _n(-21)/4, _n(-21)/4, _n(-21)/4, _n(-21)/4,
  _n(-16)/4, _n(-16)/4, _n(-16)/4, _n(-16)/4,
  _n(-14)/4, _n(-14)/4, _n(-14)/4, _n(-14)/4,
  _n(-21)/4, _n(-21)/4, _n(-21)/4, _n(-21)/4,
];
const BGM_DRUM_PAT=[0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];

// ── CHALLENGE BGM: Fast Heroic Major Key (165 BPM) ──────────────
const CHALLENGE_MELODY=[
  // Bar 1
  _n(10), null, _n(15), null, _n(12), null, _n(10), null, _n(7), null, _n(5), null, _n(7), null, _n(10), null,
  // Bar 2
  _n(12), null, _n(15), null, _n(17), null, _n(15), null, _n(12), null, _n(15), null, _n(12), null, _n(10), null,
  // Bar 3
  _n(10), null, _n(15), null, _n(12), null, _n(10), null, _n(7), null, _n(5), null, _n(7), null, _n(10), null,
  // Bar 4
  _n(5), null, _n(3), null, _n(5), null, _n(7), null, _n(10), null, _n(7), null, _n(5), null, _n(3), null,
  // Bar 5 (Climax)
  _n(15), null, _n(19), null, _n(17), null, _n(15), null, _n(12), null, _n(10), null, _n(12), null, _n(15), null,
  // Bar 6
  _n(17), null, _n(19), null, _n(22), null, _n(19), null, _n(17), null, _n(15), null, _n(17), null, _n(15), null,
  // Bar 7
  _n(15), null, _n(19), null, _n(17), null, _n(15), null, _n(12), null, _n(10), null, _n(12), null, _n(15), null,
  // Bar 8
  _n(12), null, _n(10), null, _n(7), null, _n(5), null, _n(3), null, _n(5), null, _n(7), null, _n(10), null,
];
const CHALLENGE_HARMONY=[
  // Fast pulsing chords: C, F, C, G
  _n(3), null, _n(7), null, _n(3), null, _n(7), null, _n(3), null, _n(7), null, _n(3), null, _n(7), null,
  _n(8), null, _n(12), null, _n(8), null, _n(12), null, _n(8), null, _n(12), null, _n(8), null, _n(12), null,
  _n(3), null, _n(7), null, _n(3), null, _n(7), null, _n(3), null, _n(7), null, _n(3), null, _n(7), null,
  _n(2), null, _n(5), null, _n(2), null, _n(5), null, _n(2), null, _n(5), null, _n(2), null, _n(5), null,
  _n(7), null, _n(10), null, _n(7), null, _n(10), null, _n(7), null, _n(10), null, _n(7), null, _n(10), null,
  _n(8), null, _n(12), null, _n(8), null, _n(12), null, _n(8), null, _n(12), null, _n(8), null, _n(12), null,
  _n(7), null, _n(10), null, _n(7), null, _n(10), null, _n(7), null, _n(10), null, _n(7), null, _n(10), null,
  _n(5), null, _n(10), null, _n(5), null, _n(10), null, _n(5), null, _n(10), null, _n(5), null, _n(10), null,
];
const CHALLENGE_BASS_WALK=[
  _n(-9)/4, _n(-9)/4, _n(-9)/4, _n(-9)/4,
  _n(-4)/4, _n(-4)/4, _n(-4)/4, _n(-4)/4,
  _n(-9)/4, _n(-9)/4, _n(-9)/4, _n(-9)/4,
  _n(-7)/4, _n(-7)/4, _n(-7)/4, _n(-7)/4,
  _n(-9)/4, _n(-9)/4, _n(-9)/4, _n(-9)/4,
  _n(-4)/4, _n(-4)/4, _n(-4)/4, _n(-4)/4,
  _n(-9)/4, _n(-9)/4, _n(-9)/4, _n(-9)/4,
  _n(-7)/4, _n(-7)/4, _n(-7)/4, _n(-7)/4,
];
const CHALLENGE_DRUM_PAT=[1,0,4,0, 2,0,4,0, 1,0,4,0, 2,0,4,0];

// ── SPRINT BGM: Peaceful Major Key (C Major, Happy/Bouncy) ──────────────
const SPRINT_MELODY=[
  // Bar 1-4 (A Section)
  _n(15), null, _n(12), null, _n(10), null, _n(7), null, _n(10), null, _n(12), null, _n(15), null, null, null,
  _n(17), null, _n(15), null, _n(12), null, _n(10), null, _n(12), null, _n(15), null, _n(17), null, null, null,
  _n(19), null, _n(15), null, _n(12), null, _n(10), null, _n(7), null, _n(5), null, _n(3), null, null, null,
  _n(5), null, _n(7), null, _n(10), null, _n(12), null, _n(15), null, _n(17), null, _n(15), null, null, null,
  // Bar 5-8 (B Section - Higher & Energetic)
  _n(19), null, _n(24), null, _n(19), null, _n(17), null, _n(15), null, _n(17), null, _n(19), null, null, null,
  _n(17), null, _n(15), null, _n(12), null, _n(10), null, _n(12), null, _n(15), null, _n(17), null, null, null,
  _n(24), null, _n(19), null, _n(15), null, _n(12), null, _n(15), null, _n(19), null, _n(24), null, null, null,
  _n(19), null, _n(15), null, _n(12), null, _n(10), null, _n(7), null, _n(5), null, _n(3), null, null, null,
];
const SPRINT_HARMONY=[
  _n(3), null, null, null, _n(7), null, null, null, _n(3), null, null, null, _n(7), null, null, null,
  _n(5), null, null, null, _n(8), null, null, null, _n(5), null, null, null, _n(8), null, null, null,
  _n(7), null, null, null, _n(10), null, null, null, _n(3), null, null, null, _n(7), null, null, null,
  _n(5), null, null, null, _n(10), null, null, null, _n(7), null, null, null, _n(3), null, null, null,
  
  _n(10), null, null, null, _n(15), null, null, null, _n(10), null, null, null, _n(15), null, null, null,
  _n(8), null, null, null, _n(12), null, null, null, _n(8), null, null, null, _n(12), null, null, null,
  _n(7), null, null, null, _n(10), null, null, null, _n(3), null, null, null, _n(7), null, null, null,
  _n(5), null, null, null, _n(8), null, null, null, _n(3), null, null, null, _n(3), null, null, null,
];
const SPRINT_BASS_WALK=[
  _n(-9)/4, _n(-9)/4, _n(-9)/4, _n(-9)/4,  _n(-5)/4, _n(-5)/4, _n(-5)/4, _n(-5)/4,
  _n(-7)/4, _n(-7)/4, _n(-7)/4, _n(-7)/4,  _n(-5)/4, _n(-5)/4, _n(-5)/4, _n(-5)/4,
];
const SPRINT_DRUM_PAT=[1,0,3,0, 2,0,3,0, 1,0,3,0, 2,0,3,0];

// ── BLITZ/ULTRA BGM: Syncopated Techno (130 BPM) ──────────────
const BLITZ_MELODY=[
  null,_n(12),null,null, _n(12),null,_n(15),null, null,_n(15),null,_n(17), null,null,_n(17),null,
  null,_n(10),null,null, _n(10),null,_n(14),null, null,_n(14),null,_n(12), null,null,_n(12),null,
];
const BLITZ_HARMONY=[
  _n(0),null,_n(3),null, _n(7),null,_n(0),null, _n(3),null,_n(7),null, _n(10),null,_n(7),null,
  _n(-2),null,_n(2),null, _n(5),null,_n(-2),null, _n(2),null,_n(5),null, _n(8),null,_n(5),null,
];
const BLITZ_BASS_WALK=[
  _n(0)/4, _n(3)/4, _n(7)/4, _n(0)/4, _n(0)/4, _n(3)/4, _n(7)/4, _n(0)/4,
  _n(-2)/4, _n(2)/4, _n(5)/4, _n(-2)/4, _n(-2)/4, _n(2)/4, _n(5)/4, _n(-2)/4,
];
const BLITZ_DRUM_PAT=[1,4,6,4, 1,4,6,4, 1,4,6,4, 1,4,6,4];

// ── Drum synthesis (noise buffer, created lazily per AudioContext) ─────────
let _drumBuffer=null,_drumBufCtx=null;
function _getDrumBuf(){
  if(_drumBuffer&&_drumBufCtx===audioCtx)return _drumBuffer;
  if(!audioCtx)return null;
  const sz=Math.ceil(audioCtx.sampleRate*0.15);
  _drumBuffer=audioCtx.createBuffer(1,sz,audioCtx.sampleRate);
  const d=_drumBuffer.getChannelData(0);
  for(let i=0;i<sz;i++)d[i]=Math.random()*2-1;
  _drumBufCtx=audioCtx;
  return _drumBuffer;
}
// Register all nodes in a BGM voice: track in bgmNodes[] and disconnect ALL on end.
// Previously only the source node was tracked; GainNode/BiquadFilterNode companions
// were never disconnected, leaking the entire AudioContext routing graph over time.
function _bgmRegister(src, ...rest){
  const all=[src,...rest];
  bgmNodes.push(...all);
  src.onended=()=>{
    all.forEach(n=>{
      try{n.disconnect();}catch(e){}
      const i=bgmNodes.indexOf(n);if(i!==-1)bgmNodes.splice(i,1);
    });
  };
}
function bgmDst(){return bgmGain||masterGain;}
function sfxDst(){return sfxGain||masterGain;}

function bgmScheduleKick(t){
  const osc=audioCtx.createOscillator(),g=audioCtx.createGain();
  osc.connect(g);g.connect(bgmDst());
  osc.type='sine';
  osc.frequency.setValueAtTime(110,t);
  osc.frequency.exponentialRampToValueAtTime(40,t+0.12);
  g.gain.setValueAtTime(0.35,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+0.14);
  osc.start(t);osc.stop(t+0.15);
  _bgmRegister(osc,g);
}
function bgmScheduleSnare(t){
  const buf=_getDrumBuf();if(!buf)return;
  const src=audioCtx.createBufferSource(),filt=audioCtx.createBiquadFilter(),g=audioCtx.createGain();
  src.buffer=buf;src.connect(filt);filt.connect(g);g.connect(bgmDst());
  filt.type='bandpass';filt.frequency.value=3500;filt.Q.value=0.5;
  g.gain.setValueAtTime(0.18,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+0.09);
  src.start(t);src.stop(t+0.1);
  _bgmRegister(src,filt,g);
}
function bgmScheduleHihat(t){
  const buf=_getDrumBuf();if(!buf)return;
  const src=audioCtx.createBufferSource(),filt=audioCtx.createBiquadFilter(),g=audioCtx.createGain();
  src.buffer=buf;src.connect(filt);filt.connect(g);g.connect(bgmDst());
  filt.type='highpass';filt.frequency.value=9000;
  g.gain.setValueAtTime(0.07,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+0.03);
  src.start(t);src.stop(t+0.04);
  _bgmRegister(src,filt,g);
}

function getBGMBeat(){
  let baseBpm = 112;
  if (S.isSprintMode) baseBpm = 135;
  else if (S.isBlitzMode) baseBpm = 130;
  else if (S.isDailyMode) baseBpm = 165;
  const bpm = Math.min(210, baseBpm + (S.level || 1) * 5);
  return 60/bpm/4;
}

// type param: 'square'=melody (bright), 'triangle'=harmony/bass (warm)
function bgmScheduleNote(freq,t,dur,vol,type='square'){
  const ctx=audioCtx;
  const osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.connect(gain);gain.connect(bgmDst());
  osc.type=type;osc.frequency.setValueAtTime(freq,t);
  gain.gain.setValueAtTime(vol,t);
  gain.gain.exponentialRampToValueAtTime(0.001,t+dur*0.9);
  osc.start(t);osc.stop(t+dur);
  _bgmRegister(osc,gain);
}

function bgmScheduleLoop(){
  if(!bgmPlaying||!audioCtx)return;
  // Guard: if tab was hidden, audioCtx.currentTime may have jumped far ahead of
  // bgmNextTime — clamp to avoid scheduling a massive backlog of nodes at once.
  if(bgmNextTime < audioCtx.currentTime - 0.2) bgmNextTime=audioCtx.currentTime;
  
  let melody = BGM_MELODY, harmony = BGM_HARMONY, bassWalk = BGM_BASS_WALK, drumPat = BGM_DRUM_PAT;
  if (S.isSprintMode) {
    melody = SPRINT_MELODY; harmony = SPRINT_HARMONY; bassWalk = SPRINT_BASS_WALK; drumPat = SPRINT_DRUM_PAT;
  } else if (S.isBlitzMode) {
    melody = BLITZ_MELODY; harmony = BLITZ_HARMONY; bassWalk = BLITZ_BASS_WALK; drumPat = BLITZ_DRUM_PAT;
  } else if (S.isDailyMode) {
    melody = CHALLENGE_MELODY; harmony = CHALLENGE_HARMONY; bassWalk = CHALLENGE_BASS_WALK; drumPat = CHALLENGE_DRUM_PAT;
  }
  
  while(bgmNextTime<audioCtx.currentTime+0.5){
    const beat=getBGMBeat();
    const idx=bgmBeat%melody.length;
    // Melody: square wave, lead voice
    const mf=melody[idx];
    if(mf)bgmScheduleNote(mf,bgmNextTime,beat*0.8,0.12);
    // Harmony: triangle wave, softer colour
    const hf=harmony[idx];
    if(hf)bgmScheduleNote(hf,bgmNextTime,beat*0.8,0.07,'triangle');
    // Walking bass: triangle, every quarter-note (4 steps)
    if(bgmBeat%4===0){
      const bassIdx=Math.floor(bgmBeat/4)%bassWalk.length;
      bgmScheduleNote(bassWalk[bassIdx],bgmNextTime,beat*3.6,0.10,'triangle');
    }
    // Drums (bit-flags: bit0=kick, bit1=snare, bit2=hihat — combinable)
    const d=drumPat[bgmBeat%16];
    if(d&1)bgmScheduleKick(bgmNextTime);
    if(d&2)bgmScheduleSnare(bgmNextTime);
    if(d&4)bgmScheduleHihat(bgmNextTime);
    bgmNextTime+=beat;
    bgmBeat++;
    if(bgmBeat>=melody.length)bgmBeat=0;
  }
  bgmScheduler=setTimeout(bgmScheduleLoop,100);
}

export async function startBGM(){
  stopBGM();
  const ctx=getAudioCtx();
  if(ctx.state!=='running')await ctx.resume();
  bgmPlaying=true;bgmBeat=0;
  bgmNextTime=ctx.currentTime+0.1;
  bgmScheduleLoop();
}

export function stopBGM(){
  bgmPlaying=false;
  if(bgmScheduler){clearTimeout(bgmScheduler);bgmScheduler=null;}
  const nodes=[...bgmNodes];bgmNodes=[];
  // stop() only works on scheduled sources; disconnect() works on all AudioNodes.
  // Both calls are wrapped in try/catch: stop() throws on GainNode/BiquadFilterNode,
  // disconnect() throws if already disconnected — either way we want to continue.
  nodes.forEach(n=>{try{n.stop(audioCtx.currentTime+0.01);}catch(e){} try{n.disconnect();}catch(e){}});
}

export function pauseBGM(){
  stopBGM();
}
export async function resumeBGM(){
  if(!audioCtx) return;
  // Await the resume — without this we read audioCtx.currentTime while the
  // context is still suspended, get a stale value, and schedule a burst of
  // notes that play in the past (i.e. silently). 'interrupted' is iOS 16+.
  if(audioCtx.state==='suspended' || audioCtx.state==='interrupted'){
    try { await audioCtx.resume(); } catch(e) {}
  }
  // If the context never returned to 'running' (rare iOS edge case), bail.
  if(audioCtx.state !== 'running') return;
  bgmPlaying = true;
  bgmNextTime = audioCtx.currentTime + 0.1;
  bgmScheduleLoop();
}

// ─── SFX Pre-rendering & playback (ARCH-005) ──────────────────────────────
const _sfxCache = {};

async function _renderBuffer(key, instructions, totalDur) {
  if (_sfxCache[key]) return _sfxCache[key];
  const sr = 44100;
  const length = Math.max(1, Math.ceil(sr * totalDur));
  const octx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, length, sr);
  
  for (const {f, t, d, v, delay=0, fe=null} of instructions) {
    const osc = octx.createOscillator(), gain = octx.createGain();
    osc.connect(gain); gain.connect(octx.destination);
    osc.type = t; 
    osc.frequency.setValueAtTime(f, delay);
    if (fe) osc.frequency.exponentialRampToValueAtTime(fe, delay + d);
    gain.gain.setValueAtTime(v, delay);
    gain.gain.exponentialRampToValueAtTime(0.001, delay + d);
    osc.start(delay); osc.stop(delay + d);
  }
  
  _sfxCache[key] = await octx.startRendering();
  return _sfxCache[key];
}

export async function preDecodeSFX() {
  const reqs = [
    { k:'move', d:0.05, i:[{f:220, t:'square', d:0.04, v:0.1}] },
    { k:'rotate', d:0.08, i:[{f:330, t:'square', d:0.05, v:0.12}, {f:440, t:'square', d:0.04, v:0.08, delay:0.03}] },
    { k:'hardDrop', d:0.2, i:[{f:80, t:'sawtooth', d:0.15, v:0.45}, {f:180, t:'sawtooth', d:0.06, v:0.35, delay:0.02, fe:60}, {f:800, t:'square', d:0.03, v:0.18, delay:0.01}] },
    { k:'hold', d:0.12, i:[{f:392, t:'square', d:0.06, v:0.15}, {f:523, t:'square', d:0.05, v:0.12, delay:0.05}] },
    { k:'tspin', d:0.25, i:[{f:880, t:'square', d:0.07, v:0.22}, {f:1046, t:'square', d:0.06, v:0.18, delay:0.06}, {f:1318, t:'sawtooth', d:0.14, v:0.28, delay:0.1}] },
    { k:'uiHover', d:0.05, i:[{f:800, t:'sine', d:0.04, v:0.02}] },
    { k:'uiClick', d:0.08, i:[{f:1200, t:'square', d:0.05, v:0.04}, {f:1600, t:'sine', d:0.05, v:0.03, delay:0.02}] },
    { k:'countdownTap', d:0.05, i:[{f:440, t:'square', d:0.13, v:0.18}] },
    { k:'countdown3', d:0.05, i:[{f:440, t:'square', d:0.13, v:0.18}] },
    { k:'countdown2', d:0.05, i:[{f:550, t:'square', d:0.13, v:0.18}] },
    { k:'countdown1', d:0.05, i:[{f:660, t:'square', d:0.13, v:0.18}] },
    { k:'countdownGo', d:0.2, i:[523,659,784].map((f,i) => ({f, t:'sawtooth', d:0.16, v:0.3, delay:i*0.04})) },
    { k:'sprintGoal', d:0.5, i:[523,659,784,1047].map((f,i) => ({f, t:'sawtooth', d:0.18, v:0.28, delay:i*0.06+0.3})) },
    { k:'dailyComplete', d:0.5, i:[523,659,784,1047,1319].map((f,i) => ({f, t:'sawtooth', d:0.18, v:0.28, delay:i*0.07+0.1})) },
    { k:'allClear', d:0.5, i:[523,659,784,880,1047,1319].map((f,i) => ({f, t:'sawtooth', d:0.22, v:0.35, delay:i*0.07})) },
    { k:'levelUp', d:0.4, i:[261,329,392,523,659,784].map((f,i) => ({f, t:'square', d:0.16, v:0.22, delay:i*0.05})) },
  ];
  
  // Line clears
  for (let n=1; n<=4; n++) {
    if (n >= 4) reqs.push({ k:`clear4`, d:0.5, i:[523,659,784,1047].map((f,i) => ({f, t:'sawtooth', d:0.2, v:0.3, delay:i*0.08})) });
    else reqs.push({ k:`clear${n}`, d:0.3, i:[440,523,659].slice(0,n).map((f,i) => ({f, t:'square', d:0.12, v:0.25, delay:i*0.05})) });
  }

  // Game over
  const goInsts = [392,349,329,261].map((f,i) => ({f, t:'sawtooth', d:0.28, v:0.38, delay:i*0.18}));
  goInsts.push({f:130, t:'sawtooth', d:0.6, v:0.3, delay:0.75});
  reqs.push({ k:'gameOver', d:1.4, i:goInsts });

  // Achievement
  const achInsts = [];
  [523,659,784,1047].forEach((f, i) => {
    achInsts.push({f, t:'sine', d:0.25, v:0.22, delay:i*0.05});
    achInsts.push({f:f*2, t:'square', d:0.1, v:0.06, delay:i*0.05+0.02});
  });
  reqs.push({ k:'achievement', d:0.45, i:achInsts });

  await Promise.all(reqs.map(r => _renderBuffer(r.k, r.i, r.d)));
}

function playSFX(key) {
  if (S.muteAudio) return;
  const ctx = getAudioCtx();
  if (ctx.state !== 'running' || !_sfxCache[key]) return;
  const src = ctx.createBufferSource();
  src.buffer = _sfxCache[key];
  src.connect(sfxDst());
  src.start(ctx.currentTime);
}

export function sfxMove(){ playSFX('move'); }
export function sfxRotate(){ playSFX('rotate'); }
export function sfxHardDrop(){ playSFX('hardDrop'); }
export function sfxHold(){ playSFX('hold'); }
export function sfxLineClear(n){ playSFX(`clear${Math.min(4, n)}`); }
export function sfxGameOver(){ playSFX('gameOver'); }
export function sfxTSpin(){ playSFX('tspin'); }
export function sfxUIHover(){ playSFX('uiHover'); }
export function sfxAchievementUnlock(){ playSFX('achievement'); }
export function sfxCountdownTap(){ playSFX('countdownTap'); }
export function sfxCountdownTick(val){ playSFX(`countdown${val}`) || playSFX('countdown3'); }
export function sfxCountdownGo(){ playSFX('countdownGo'); }
export function sfxSprintGoal(){ playSFX('sprintGoal'); }
export function sfxDailyComplete(){ playSFX('dailyComplete'); }
export function sfxAllClear(){ playSFX('allClear'); }
export function sfxLevelUp(){ playSFX('levelUp'); }

let _lastUIClick = 0;
export function sfxUIClick(){
  const now = performance.now();
  if (now - _lastUIClick < 50) return;
  _lastUIClick = now;
  playSFX('uiClick');
}

// ─── Lifecycle helpers ────────────────────────────────────────────────────────
export function applyMuteToGain(){
  if(masterGain)masterGain.gain.value=S.muteAudio?0:1;
}
export function onPageHide(){pauseBGM();}
export function onPageShow(){
  // Try to wake suspended/interrupted contexts so the next gesture (mute,
  // RESUME, hover SFX) sees a running ctx. iOS may still ignore this without
  // a user gesture; the gesture-driven resume in toggleMute / togglePause
  // covers that.
  if(audioCtx && (audioCtx.state==='suspended' || audioCtx.state==='interrupted')){
    audioCtx.resume().catch(()=>{});
  }
  if(S.gameRunning && !S.gamePaused) resumeBGM();
}
export function closeAudio(){
  stopBGM();
  if(audioCtx){audioCtx.close();audioCtx=null;masterGain=null;}
}

// Kick off pre-rendering immediately
if (window.OfflineAudioContext || window.webkitOfflineAudioContext) {
  preDecodeSFX().catch(e => console.warn('SFX pre-render failed:', e));
}
