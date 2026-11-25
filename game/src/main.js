// Ember & Thyme — Night Market Kitchen: boot and game loop.
// Reads ?shot=cover|chop|grill|serve for a staged screenshot state; with no
// parameter it starts a fresh shift on the title screen.

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config.js';
import { createState, startShift, updateTimers } from './state.js';
import { drawGame } from './render.js';
import { bindInput, updateInput, updatePendingStation } from './input.js';
import { stageFor, stageFresh } from './shots.js';
import { sfx } from './audio.js';

const canvas = document.getElementById('game');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

let state;
if (shot) {
  state = stageFor(shot);
} else {
  state = createState(Math.random);
}

function restart() {
  state = stageFresh();
  state.started = true;
  sfx.click();
}

function startGame() {
  if (!state.started) {
    startShift(state);
    sfx.click();
  }
}

bindInput(canvas, state, restart, startGame);

let last = performance.now();
let lastTickSecond = -1;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (shot) {
    // Staged screenshots stay frozen in their moment: timers do not run down
    // while the shot is taken, so every render of the same preset is identical.
  } else {
    updateTimers(state, dt);
    updateInput(state, dt);
    updatePendingStation(state);
    const sec = Math.floor(state.shiftLeft);
    if (state.started && !state.over && sec !== lastTickSecond && sec <= 10 && sec > 0) {
      lastTickSecond = sec;
      sfx.tick();
    }
  }
  drawGame(ctx, state);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// Expose the live state for play-testing from the console, nothing else.
window.__emberThyme = { get state() { return state; }, restart };
