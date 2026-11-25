// Ember & Thyme: keyboard and mouse input — movement, station use, shortcuts.
// Movement is axis-separated so the chef slides along counters instead of sticking.

import { CHEF_SPEED, CHEF_RADIUS, FLOOR, stationList, stationAtPoint } from './config.js';
import { interactAtStation, dropLastHeld } from './kitchen.js';
import { sfx, ensureAudio, toggleMute } from './audio.js';

const keys = new Set();

function collides(x, y) {
  if (x < FLOOR.x + CHEF_RADIUS || x > FLOOR.x + FLOOR.w - CHEF_RADIUS) return true;
  if (y < FLOOR.y + CHEF_RADIUS || y > FLOOR.y + FLOOR.h - CHEF_RADIUS) return true;
  // The order board is furniture: the chef walks around it, never through it.
  if (x > 16 - CHEF_RADIUS && x < 316 + CHEF_RADIUS
    && y > 196 - CHEF_RADIUS && y < 666 + CHEF_RADIUS) return true;
  for (const s of stationList()) {
    if (s.kind === 'assembly' || s.kind === 'trash') {
      // Assembly and trash sit on the floor: block them like furniture.
      if (x > s.x - CHEF_RADIUS && x < s.x + s.w + CHEF_RADIUS
        && y > s.y - CHEF_RADIUS && y < s.y + s.h + CHEF_RADIUS) return true;
    }
  }
  return false;
}

function nearestStation(chef) {
  let best = null;
  let bestD = 110;
  for (const s of stationList()) {
    const cx = Math.max(s.x, Math.min(chef.x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(chef.y, s.y + s.h));
    const d = Math.hypot(chef.x - cx, chef.y - cy);
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}

export function nearestStationFor(state) {
  return nearestStation(state.chef);
}

export function useNearestStation(state) {
  const s = nearestStation(state.chef);
  if (!s) {
    state.message = 'Dekati stasiun dulu (pantry, talenan, panggangan, meja rakit, jendela saji)';
    state.messageAt = state.time;
    return 'far';
  }
  return interactAtStation(state, s);
}

function moveChef(state, dt) {
  const chef = state.chef;
  let dx = 0; let dy = 0;
  if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
  if (keys.has('arrowright') || keys.has('d')) dx += 1;
  if (keys.has('arrowup') || keys.has('w')) dy -= 1;
  if (keys.has('arrowdown') || keys.has('s')) dy += 1;
  if (chef.target) {
    const tx = chef.target.x; const ty = chef.target.y;
    const dist = Math.hypot(tx - chef.x, ty - chef.y);
    if (dist < 8) {
      chef.target = null;
    } else {
      dx = (tx - chef.x) / dist;
      dy = (ty - chef.y) / dist;
    }
  }
  if (dx === 0 && dy === 0) { chef.moving = false; return; }
  const len = Math.hypot(dx, dy);
  dx /= len; dy /= len;
  chef.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  chef.moving = true;
  const step = CHEF_SPEED * dt;
  const nx = chef.x + dx * step;
  if (!collides(nx, chef.y)) chef.x = nx;
  const ny = chef.y + dy * step;
  if (!collides(chef.x, ny)) chef.y = ny;
}

export function updateInput(state, dt) {
  if (!state.started || state.over) return;
  moveChef(state, dt);
}

export function bindInput(canvas, state, onRestart, onStart) {
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    ensureAudio();
    if (k === 'm') {
      const m = toggleMute();
      state.message = m ? 'Suara dimatikan' : 'Suara dinyalakan';
      state.messageAt = state.time;
      return;
    }
    if (k === 'r' && state.over) { onRestart(); return; }
    if (!state.started) {
      if (k === 'enter' || k === ' ') { if (onStart) onStart(); }
      return;
    }
    if (k === 'e' || k === ' ') { useNearestStation(state); return; }
    if (k === 'q') { dropLastHeld(state); return; }
    keys.add(k);
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

  canvas.addEventListener('click', (e) => {
    ensureAudio();
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (canvas.width / rect.width);
    const py = (e.clientY - rect.top) * (canvas.height / rect.height);
    if (!state.started) { if (onStart) onStart(); return; }
    if (state.over) return;
    const station = stationAtPoint(px, py);
    if (station) {
      // Clicking a station walks the chef to its front edge, then uses it.
      const cx = station.x + station.w / 2;
      const cy = Math.max(station.y + station.h + CHEF_RADIUS + 4, FLOOR.y + CHEF_RADIUS + 2);
      state.chef.target = { x: cx, y: Math.min(cy, FLOOR.y + FLOOR.h - CHEF_RADIUS) };
      state.pendingStation = station;
      sfx.click();
      return;
    }
    state.chef.target = { x: px, y: py };
    state.pendingStation = null;
  });
}

// When a click-to-move target is reached next to a station, use that station.
export function updatePendingStation(state) {
  if (state.pendingStation && !state.chef.target) {
    const s = state.pendingStation;
    state.pendingStation = null;
    interactAtStation(state, s);
  }
}
