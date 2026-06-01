// ─── Decoupled fixed-timestep game loop (ARCH-001) ───────────────────────────
// One RAF still drives the render frame, but logic advances on a 1ms tick that
// is independent of the monitor refresh rate. Inputs carry a performance.now()
// timestamp (ARCH-002) and are simulated in their true chronological order
// during the tick window they actually arrived in.

export const TICK_RATE = 1; // ms — 1000Hz logic tick
const ACCUMULATOR_CAP = 250; // ms — guard against tab-focus catch-up storms

const inputQueue = [];
let lastTickTs = 0;
let accumulator = 0;

export function enqueueInput(code, type) {
  inputQueue.push({ code, type, t: performance.now() });
}

export function resetLoop(now) {
  lastTickTs = now;
  accumulator = 0;
  inputQueue.length = 0;
}

// Called once per RAF. `now` is the RAF timestamp.
// callbacks = { onInput({code,type,t}), onTick(dt) }
export function tickLoop(now, callbacks) {
  if (lastTickTs === 0) lastTickTs = now;
  accumulator += now - lastTickTs;
  lastTickTs = now;
  if (accumulator > ACCUMULATOR_CAP) accumulator = ACCUMULATOR_CAP;

  // Stable timestamp ordering even if listeners fired out of order.
  if (inputQueue.length > 1) inputQueue.sort((a, b) => a.t - b.t);

  while (accumulator >= TICK_RATE) {
    accumulator -= TICK_RATE;
    const tickEndTs = now - accumulator;
    while (inputQueue.length && inputQueue[0].t <= tickEndTs) {
      callbacks.onInput(inputQueue.shift());
    }
    callbacks.onTick(TICK_RATE);
  }
}
