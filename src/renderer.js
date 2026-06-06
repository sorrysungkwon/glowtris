import { Application, Graphics, Text, TextStyle } from 'pixi.js';
import { S, COLS, ROWS } from './shared.js';

// ─── Internal state ───────────────────────────────────────────────────────────
let _app  = null;
let _gfx  = null; // board + pieces Graphics (cleared each frame)
let _cdGfx = null; // countdown effects Graphics
let _cdText = null; // countdown number/GO Text

export let pixiCanvas  = null;
export let pixiEnabled = false;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hexToN(hex) {
  return parseInt(hex.replace('#', ''), 16);
}

// Fast HSL→hex for rainbow border
function hslToN(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h * 12) % 12;
    return Math.round((l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)) * 255);
  };
  return (f(0) << 16) | (f(8) << 8) | f(4);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
export async function initPixiRenderer(oldCanvas) {
  try {
    const W = oldCanvas.width  || COLS * (S.CELL || 30);
    const H = oldCanvas.height || ROWS * (S.CELL || 30);

    const app = new Application();
    await app.init({
      width:            W,
      height:           H,
      backgroundAlpha:  0,  // transparent — board bg drawn manually
      antialias:        false,
      autoDensity:      false,
      preference:       'webgl',
    });
    app.ticker.stop(); // manual render via RAF in ui.js

    // Graphics layer (redrawn every frame)
    _gfx   = new Graphics();
    _cdGfx = new Graphics();

    // Countdown text
    _cdText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily:  'Orbitron, monospace',
        fontWeight:  '900',
        fontSize:    60,
        fill:        '#00c8ff',
        align:       'center',
        dropShadow:  { color: '#00c8ff', blur: 30, alpha: 0.9, distance: 0 },
      }),
    });
    _cdText.anchor.set(0.5, 0.5);
    _cdText.visible = false;

    app.stage.addChild(_gfx);
    app.stage.addChild(_cdGfx);
    app.stage.addChild(_cdText);

    // ── DOM swap ──────────────────────────────────────────────────────────────
    const newCanvas = app.canvas;
    newCanvas.id            = oldCanvas.id;
    newCanvas.style.cssText = oldCanvas.style.cssText;
    // Copy inline width/height so layout is identical
    newCanvas.style.width   = (oldCanvas.style.width  || W + 'px');
    newCanvas.style.height  = (oldCanvas.style.height || H + 'px');
    // Preserve touch handling
    newCanvas.style.touchAction = 'none';

    oldCanvas.parentNode.insertBefore(newCanvas, oldCanvas);
    oldCanvas.remove();

    _app          = app;
    pixiCanvas    = newCanvas;
    pixiEnabled   = true;

    return newCanvas; // ui.js assigns this to gc
  } catch (e) {
    console.warn('[v0.5] PixiJS unavailable, using Canvas2D:', e.message);
    return null;
  }
}

// ─── Resize ───────────────────────────────────────────────────────────────────
export function resizePixiRenderer(w, h) {
  if (!_app) return;
  _app.renderer.resize(w, h);
  if (pixiCanvas) {
    pixiCanvas.style.width  = w + 'px';
    pixiCanvas.style.height = h + 'px';
  }
}

// ─── Per-frame board render ───────────────────────────────────────────────────
export function drawBoardPixi(visX, visY, getGhostY) {
  if (!_app || !_gfx) return;

  const g = _gfx;
  g.clear();

  const cs = S.CELL;
  const W  = COLS * cs;
  const H  = ROWS * cs;

  // ── Background ──────────────────────────────────────────────────────────────
  g.rect(0, 0, W, H).fill({ color: 0x00000f, alpha: 0.88 });

  // ── Animated grid ───────────────────────────────────────────────────────────
  const gridA = 0.05 + 0.03 * Math.sin(Date.now() / 400);
  // Horizontal + vertical lines
  for (let r = 0; r <= ROWS; r++) g.moveTo(0, r * cs).lineTo(W, r * cs);
  for (let c = 0; c <= COLS; c++) g.moveTo(c * cs, 0).lineTo(c * cs, H);
  g.stroke({ color: 0x00c8ff, width: 1, alpha: gridA });
  // Dot intersections (batched into one fill call)
  for (let r = 1; r < ROWS; r++) {
    for (let c = 1; c < COLS; c++) {
      g.rect(c * cs - 0.5, r * cs - 0.5, 1, 1);
    }
  }
  g.fill({ color: 0x00ffff, alpha: gridA * 3 });

  // ── Placed cells ────────────────────────────────────────────────────────────
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!S.board[r][c]) continue;
      if (S.flashLines.has(r)) {
        const t = 1 - S.flashTimer / 12;
        g.rect(c * cs + 1, r * cs + 1, cs - 2, cs - 2)
          .fill({ color: 0xffffff, alpha: 0.5 + 0.5 * Math.sin(t * Math.PI * 4) });
      } else {
        g.rect(c * cs + 1, r * cs + 1, cs - 2, cs - 2)
          .fill({ color: hexToN(S.board[r][c]), alpha: 0.9 });
      }
    }
  }

  // ── Active piece + ghost ─────────────────────────────────────────────────────
  if (S.gameRunning && !S.gamePaused && S.current) {
    const pc = hexToN(S.current.color);

    // Ghost
    const ghostY = getGhostY();
    if (S.ghostVisible && ghostY !== S.current.y) {
      for (let row = 0; row < S.current.shape.length; row++) {
        for (let col = 0; col < S.current.shape[row].length; col++) {
          if (!S.current.shape[row][col]) continue;
          const gx = (visX + col) * cs, gy = (ghostY + row) * cs;
          g.rect(gx + 2, gy + 2, cs - 4, cs - 4).fill({ color: pc, alpha: 0.06 });
          g.rect(gx + 2, gy + 2, cs - 4, cs - 4).stroke({ color: pc, width: 1.5, alpha: 0.32 });
        }
      }
      // Alignment laser dashes
      let minCol = COLS, maxCol = -1;
      for (let row = 0; row < S.current.shape.length; row++) {
        for (let col = 0; col < S.current.shape[row].length; col++) {
          if (S.current.shape[row][col]) { if (col < minCol) minCol = col; if (col > maxCol) maxCol = col; }
        }
      }
      const lx = (visX + minCol) * cs, rx = (visX + maxCol + 1) * cs;
      const y0 = (visY + S.current.shape.length) * cs, y1 = ghostY * cs;
      // Dashed lines via short segments
      const dashLen = 4, gapLen = 4;
      for (let y = y0; y > y1; y -= dashLen + gapLen) {
        const seg = Math.min(dashLen, y - y1);
        g.moveTo(lx, y).lineTo(lx, y - seg);
        g.moveTo(rx, y).lineTo(rx, y - seg);
      }
      g.stroke({ color: pc, width: 1, alpha: 0.09 });
    }

    // Lock delay indicator
    if (S.lockActive && S.lockTimer > 0) {
      const pct = S.lockTimer / S.lockMs;
      for (let row = 0; row < S.current.shape.length; row++) {
        for (let col = 0; col < S.current.shape[row].length; col++) {
          if (!S.current.shape[row][col]) continue;
          g.rect((visX + col) * cs + 1, (visY + row) * cs + 1, cs - 2, cs - 2)
            .fill({ color: pc, alpha: 0.18 * pct });
        }
      }
      const bY = (visY + S.current.shape.length) * cs - 3;
      g.rect(visX * cs, bY, S.current.shape[0].length * cs * pct, 3)
        .fill({ color: pc, alpha: 0.75 });
    }

    // Current piece cells
    for (let row = 0; row < S.current.shape.length; row++) {
      for (let col = 0; col < S.current.shape[row].length; col++) {
        if (!S.current.shape[row][col]) continue;
        g.rect((visX + col) * cs + 1, (visY + row) * cs + 1, cs - 2, cs - 2)
          .fill({ color: pc, alpha: 0.9 });
      }
    }

    // Border color sync (callers update gc.style directly; PixiJS canvas has same id)
  }

  // ── Overlay effects ──────────────────────────────────────────────────────────
  if (S.comboFlash > 0 && !S.lowPerfMode) {
    g.rect(0, 0, W, H).fill({ color: hexToN(S.comboFlashColor), alpha: (S.comboFlash / 15) * 0.28 });
  }

  if (S.rainbowBorder > 0 && !S.lowPerfMode) {
    const hue = (Date.now() / 4) % 360;
    const a   = (S.rainbowBorder / 45) * 0.9;
    g.rect(3, 3, W - 6, H - 6).stroke({ color: hslToN(hue, 100, 65), width: 5, alpha: a });
  }

  if (S.gameRunning && !S.gamePaused && !S.lowPerfMode) {
    let topRow = ROWS;
    for (let r = 0; r < ROWS; r++) { if (S.board[r].some(v => v !== null)) { topRow = r; break; } }
    const danger = Math.floor(ROWS * 0.25);
    if (topRow < danger) {
      S.dangerPulse++;
      const speed  = 0.06 + ((danger - topRow) / danger) * 0.1;
      const intens = (danger - topRow) / danger;
      const alpha  = (0.12 + intens * 0.18) * (0.5 + 0.5 * Math.sin(S.dangerPulse * speed));
      g.rect(0, 0, W, H).fill({ color: 0xff1133, alpha });
    } else { S.dangerPulse = 0; }
  } else if (S.lowPerfMode) { S.dangerPulse = 0; }

  if (S.levelUpScanline > 0 && !S.lowPerfMode) {
    const y = S.levelUpScanline * H;
    g.rect(0, y - 10, W, 20).fill({ color: 0x00c8ff, alpha: 0.9 });
    S.levelUpScanline += 0.022;
    if (S.levelUpScanline >= 1.0) S.levelUpScanline = 0;
  }

  // ── Countdown overlay ────────────────────────────────────────────────────────
  if (S._countdownVal > 0 || S._countdownGo > 0) {
    _drawCountdown(g, W, H);
  } else {
    _cdText.visible = false;
    _cdGfx.clear();
  }

  _app.renderer.render(_app.stage);
}

// Countdown: dim + ring + text
const CDCOLORS = { 3: '#ff3355', 2: '#ffaa00', 1: '#00c8ff' };

function _drawCountdown(g, W, H) {
  const isGo  = S._countdownGo > 0;
  const color = isGo ? '#00ff88' : (CDCOLORS[S._countdownVal] || '#00c8ff');
  const frac  = isGo
    ? 1 - S._countdownGo / 55
    : Math.min(1, (performance.now() - S._countdownTs) / 1000);

  const alpha = isGo
    ? Math.max(0, 1 - (frac - 0.6) / 0.4)
    : (frac < 0.75 ? 1 : Math.max(0, 1 - (frac - 0.75) / 0.25));

  const scale = isGo
    ? (1 + 0.4 * (1 - frac))
    : Math.max(0.9, 1.7 - frac * 0.8);

  const cx = W / 2, cy = H / 2;
  const cg = _cdGfx;
  cg.clear();

  // Dim overlay
  if (S._countdownVal > 0) {
    const dimA = Math.min(0.6, 0.6 * (frac < 0.8 ? 1 : (1 - (frac - 0.8) / 0.2)));
    cg.rect(0, 0, W, H).fill({ color: 0x000008, alpha: dimA });
  }

  // Flash pulse on number change
  if (!isGo && frac < 0.06) {
    cg.rect(0, 0, W, H).fill({ color: hexToN(color), alpha: (1 - frac / 0.06) * 0.18 });
  }

  // Expanding rings
  if (!isGo) {
    const ringR  = Math.min(cy * 0.8, 30 + frac * cy * 0.9);
    const ringA  = Math.max(0, 0.9 - frac * 0.9);
    const ringR2 = Math.min(cy * 0.85, 10 + frac * cy * 1.1);
    const ringA2 = Math.max(0, 0.5 - frac * 0.5);
    cg.circle(cx, cy, ringR).stroke({ color: hexToN(color), width: 2.5, alpha: ringA });
    cg.circle(cx, cy, ringR2).stroke({ color: hexToN(color), width: 1.5, alpha: ringA2 });
  }

  // Text
  const text     = isGo ? 'GO!' : String(S._countdownVal);
  const fontSize = Math.floor(W * (isGo ? 0.44 : 0.54));

  _cdText.visible  = alpha > 0.01;
  _cdText.text     = text;
  _cdText.alpha    = alpha;
  _cdText.scale.set(scale);
  _cdText.position.set(cx, cy);
  _cdText.style.fontSize    = fontSize;
  _cdText.style.fill        = color;
  _cdText.style.dropShadow  = { color, blur: 80, alpha: 1, distance: 0 };

  if (S._countdownGo > 0) S._countdownGo--;
}
