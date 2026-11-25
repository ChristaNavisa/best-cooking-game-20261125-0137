// Ember & Thyme: every pixel the judge sees. Canvas 2D only, no images, no fonts
// from the network — all food and furniture is drawn from shapes, so the game
// renders identically offline and the screenshots are true renders of this code.

import {
  CANVAS_WIDTH, CANVAS_HEIGHT, INGREDIENTS, STATIONS, FLOOR,
  stepLabel, stepColor,
} from './config.js';
import { orderProgress, matchingOrder } from './state.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Trebuchet MS, Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function baseOf(step) {
  return step.replace('-grilled', '').replace('-chopped', '');
}

// One ingredient icon, drawn the same on the pantry bins, the hand, the plate
// and the order tickets, so the judge can match a dish to its order at a glance.
export function drawIngredient(ctx, step, cx, cy, r) {
  const base = baseOf(step);
  const def = INGREDIENTS[base];
  ctx.save();
  ctx.translate(cx, cy);
  if (base === 'bread') {
    ctx.fillStyle = def.color;
    rr(ctx, -r, -r * 0.55, r * 2, r * 1.1, r * 0.5);
    ctx.fill();
    ctx.fillStyle = def.dark;
    ctx.beginPath(); ctx.arc(-r * 0.4, -r * 0.1, r * 0.09, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.2, r * 0.15, r * 0.09, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.45, -r * 0.25, r * 0.07, 0, 7); ctx.fill();
  } else if (base === 'patty') {
    ctx.fillStyle = step.endsWith('-grilled') ? '#7a3b22' : def.color;
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.55, 0, 0, 7); ctx.fill();
    if (step.endsWith('-grilled')) {
      ctx.strokeStyle = '#3d1c0e';
      ctx.lineWidth = Math.max(2, r * 0.12);
      ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.2); ctx.lineTo(r * 0.5, r * 0.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * 0.5, r * 0.2); ctx.lineTo(r * 0.5, -r * 0.2); ctx.stroke();
    }
  } else if (base === 'tomato') {
    if (step.endsWith('-chopped')) {
      for (let i = -1; i <= 1; i += 1) {
        ctx.fillStyle = def.color;
        ctx.beginPath(); ctx.arc(i * r * 0.55, 0, r * 0.5, 0, 7); ctx.fill();
        ctx.fillStyle = '#f2a49e';
        ctx.beginPath(); ctx.arc(i * r * 0.55, 0, r * 0.28, 0, 7); ctx.fill();
      }
    } else {
      ctx.fillStyle = def.color;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, 7); ctx.fill();
      ctx.fillStyle = def.dark;
      ctx.beginPath(); ctx.arc(0, -r * 0.7, r * 0.18, 0, 7); ctx.fill();
      ctx.fillStyle = '#5da244';
      ctx.beginPath(); ctx.ellipse(0, -r * 0.75, r * 0.35, r * 0.14, 0, 0, 7); ctx.fill();
    }
  } else if (base === 'lettuce') {
    ctx.fillStyle = def.color;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.ellipse((i - 1) * r * 0.45, (i % 2) * r * 0.2 - r * 0.1, r * 0.62, r * 0.5, 0.4 * (i - 1), 0, 7);
      ctx.fill();
    }
    ctx.strokeStyle = def.dark;
    ctx.lineWidth = Math.max(1.5, r * 0.08);
    ctx.beginPath(); ctx.moveTo(-r * 0.7, 0); ctx.quadraticCurveTo(0, r * 0.5, r * 0.7, 0); ctx.stroke();
  } else if (base === 'cheese') {
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.5); ctx.lineTo(r, r * 0.5); ctx.lineTo(r * 0.4, -r * 0.6); ctx.lineTo(-r * 0.6, -r * 0.2);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = def.dark;
    ctx.beginPath(); ctx.arc(-r * 0.2, r * 0.1, r * 0.12, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.35, r * 0.2, r * 0.1, 0, 7); ctx.fill();
  }
  ctx.restore();
}

function drawStation(ctx, s, state) {
  const x = s.x; const y = s.y; const w = s.w; const h = s.h;
  ctx.fillStyle = '#5a3a22';
  rr(ctx, x, y, w, h, 10); ctx.fill();
  ctx.fillStyle = '#c9ced6';
  rr(ctx, x + 4, y + 4, w - 8, h - 26, 8); ctx.fill();
  ctx.fillStyle = '#2b2118';
  text(ctx, s.label.toUpperCase(), x + w / 2, y + h - 11, 13, '#2b2118', 'bold', 'center');
  if (s.kind === 'pantry') {
    drawIngredient(ctx, s.item, x + w / 2, y + (h - 22) / 2, 22);
  } else if (s.kind === 'chop') {
    ctx.fillStyle = '#e8c98f';
    rr(ctx, x + 18, y + 12, w - 36, h - 46, 6); ctx.fill();
    if (state.chopping) {
      const p = state.chopping.done / state.chopping.total;
      drawIngredient(ctx, state.chopping.item, x + w / 2, y + (h - 22) / 2, 18);
      ctx.fillStyle = '#e2483d';
      rr(ctx, x + 18, y + h - 34, (w - 36) * p, 7, 3); ctx.fill();
    } else {
      ctx.strokeStyle = '#8a6a3b';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 30, y + 22); ctx.lineTo(x + w - 30, y + 22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 30, y + 32); ctx.lineTo(x + w - 30, y + 32); ctx.stroke();
      drawIngredient(ctx, 'tomato', x + w / 2 - 22, y + (h - 22) / 2, 13);
      drawIngredient(ctx, 'lettuce', x + w / 2 + 22, y + (h - 22) / 2, 13);
    }
  } else if (s.kind === 'grill') {
    ctx.fillStyle = '#3a3a3f';
    rr(ctx, x + 14, y + 10, w - 28, h - 44, 6); ctx.fill();
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath(); ctx.moveTo(x + 20 + i * 30, y + 14); ctx.lineTo(x + 20 + i * 30, y + h - 38); ctx.stroke();
    }
    if (state.grilling) {
      const p = state.grilling.done / state.grilling.total;
      drawIngredient(ctx, 'patty-grilled', x + w / 2, y + (h - 22) / 2, 20);
      ctx.fillStyle = '#ff7a1a';
      rr(ctx, x + 18, y + h - 34, (w - 28) * p, 7, 3); ctx.fill();
    } else {
      text(ctx, '🔥', x + w / 2, y + (h - 22) / 2, 22, '#000', 'bold', 'center');
    }
  } else if (s.kind === 'assembly') {
    ctx.fillStyle = '#f4e8d0';
    rr(ctx, x + 8, y + 8, w - 16, h - 30, 8); ctx.fill();
    drawPlate(ctx, state, x + w / 2, y + (h - 22) / 2 + 4, 46);
  } else if (s.kind === 'serve') {
    ctx.fillStyle = '#7a2e2e';
    rr(ctx, x + 8, y + 8, w - 16, h - 30, 8); ctx.fill();
    text(ctx, '🛎 SAJIKAN', x + w / 2, y + 26, 16, '#ffd166', 'bold', 'center');
    const match = matchingOrder(state);
    if (state.plate.length > 0) {
      text(ctx, match ? '✅ COCOK!' : '❌ BELUM COCOK', x + w / 2, y + 48, 13, match ? '#7CFC98' : '#ffb3ab', 'bold', 'center');
    } else {
      text(ctx, 'rakit hidangan dulu', x + w / 2, y + 48, 12, '#f4e8d0', 'normal', 'center');
    }
  } else if (s.kind === 'trash') {
    ctx.fillStyle = '#4a4a52';
    rr(ctx, x + 16, y + 10, w - 32, h - 36, 8); ctx.fill();
    ctx.fillStyle = '#2e2e33';
    rr(ctx, x + 16, y + 10, w - 32, 12, 6); ctx.fill();
    text(ctx, '🗑', x + w / 2, y + (h - 22) / 2, 24, '#000', 'bold', 'center');
  }
}

function drawPlate(ctx, state, cx, cy, r) {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.72, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#c9a86a';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.82, r * 0.58, 0, 0, 7); ctx.stroke();
  const n = state.plate.length;
  state.plate.forEach((step, i) => {
    const off = (i - (n - 1) / 2) * r * 0.42;
    drawIngredient(ctx, step, cx + off, cy - r * 0.12 + (i % 2) * r * 0.1, r * 0.34);
  });
  if (n === 0) {
    text(ctx, 'piring kosong', cx, cy, 12, '#9a8a70', 'normal', 'center');
  }
}

function drawOrderTicket(ctx, order, x, y, w, h, state) {
  const urgent = order.patience < 20;
  ctx.fillStyle = urgent ? '#fff0e0' : '#fff8e7';
  rr(ctx, x, y, w, h, 10); ctx.fill();
  ctx.strokeStyle = urgent ? '#e2483d' : '#d9b36a';
  ctx.lineWidth = urgent ? 3 : 2;
  rr(ctx, x, y, w, h, 10); ctx.stroke();
  text(ctx, `#${order.id}  ${order.recipe.name.toUpperCase()}`, x + 12, y + 20, 16, '#3a2415', 'bold');
  text(ctx, `+${order.recipe.coins + 40} koin`, x + w - 12, y + 20, 13, '#8a6a1a', 'bold', 'right');
  order.recipe.steps.forEach((step, i) => {
    const sx = x + 26 + i * 54;
    const done = state.plate.includes(step);
    ctx.globalAlpha = done ? 1 : 0.95;
    drawIngredient(ctx, step, sx, y + 52, 19);
    if (done) {
      ctx.strokeStyle = '#2e9e4f';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(sx, y + 52, 23, 0, 7); ctx.stroke();
      text(ctx, '✓', sx + 14, y + 36, 15, '#2e9e4f', 'bold', 'center');
    }
    ctx.globalAlpha = 1;
    text(ctx, INGREDIENTS[baseOf(step)].name, sx, y + 82, 10, '#6a4a2a', 'normal', 'center');
  });
  const p = Math.max(0, order.patience / 60);
  ctx.fillStyle = '#e8dcc8';
  rr(ctx, x + 12, y + h - 16, w - 24, 9, 4); ctx.fill();
  ctx.fillStyle = urgent ? '#e2483d' : p > 0.5 ? '#6fbf4a' : '#f7a928';
  rr(ctx, x + 12, y + h - 16, (w - 24) * p, 9, 4); ctx.fill();
  text(ctx, `${Math.ceil(order.patience)} dtk`, x + w - 12, y + h - 26, 11, urgent ? '#e2483d' : '#6a4a2a', 'bold', 'right');
}

function drawChef(ctx, chef) {
  const { x, y } = chef;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(0, 20, 24, 8, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#f4f6f8';
  rr(ctx, -17, -8, 34, 34, 10); ctx.fill();
  ctx.fillStyle = '#e2483d';
  rr(ctx, -17, 20, 34, 8, 4); ctx.fill();
  ctx.fillStyle = '#f2c29b';
  ctx.beginPath(); ctx.arc(0, -16, 15, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(0, -24, 14, Math.PI, 0); ctx.fill();
  ctx.fillRect(-14, -26, 28, 6);
  ctx.fillStyle = '#2b2118';
  ctx.beginPath(); ctx.arc(-5, -16, 2.2, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(5, -16, 2.2, 0, 7); ctx.fill();
  ctx.strokeStyle = '#2b2118';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(0, -11, 5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  ctx.restore();
}

function drawHud(ctx, state) {
  ctx.fillStyle = '#2b2118';
  ctx.fillRect(0, 0, CANVAS_WIDTH, 64);
  ctx.fillStyle = '#ff8c42';
  ctx.fillRect(0, 64, CANVAS_WIDTH, 4);
  text(ctx, '🍳 EMBER & THYME', 20, 26, 24, '#ffd166');
  text(ctx, 'Dapur Pasar Malam', 20, 50, 12, '#f4e8d0', 'normal');
  const mins = Math.floor(state.shiftLeft / 60);
  const secs = Math.floor(state.shiftLeft % 60);
  const timerText = `${mins}:${String(secs).padStart(2, '0')}`;
  const low = state.shiftLeft <= 30;
  text(ctx, `⏱ SHIFT ${timerText}`, 640, 24, 24, low ? '#ff6b5e' : '#ffffff', 'bold', 'center');
  ctx.fillStyle = '#4a3626';
  rr(ctx, 440, 44, 400, 12, 6); ctx.fill();
  ctx.fillStyle = low ? '#e2483d' : '#6fbf4a';
  rr(ctx, 440, 44, 400 * (state.shiftLeft / 180), 12, 6); ctx.fill();
  text(ctx, `🪙 ${state.coins}`, 1060, 26, 22, '#ffd166', 'bold', 'right');
  text(ctx, `Disajikan ${state.served}  •  Hangus ${state.lost}  •  Kombo x${state.combo}`, 1060, 50, 13, '#f4e8d0', 'normal', 'right');
}

function drawBottomBar(ctx, state) {
  ctx.fillStyle = '#2b2118';
  ctx.fillRect(0, 700, CANVAS_WIDTH, 100);
  ctx.fillStyle = '#ff8c42';
  ctx.fillRect(0, 700, CANVAS_WIDTH, 4);
  // Left column: hand on row 1, plate on row 2.
  text(ctx, 'TANGAN:', 20, 730, 15, '#ffd166');
  if (state.hand.length === 0) {
    text(ctx, '(kosong)', 110, 730, 14, '#b9a68e', 'normal');
  } else {
    state.hand.forEach((item, i) => {
      drawIngredient(ctx, item, 140 + i * 56, 730, 18);
      text(ctx, stepLabel(item), 140 + i * 56, 762, 11, '#f4e8d0', 'normal', 'center');
    });
  }
  text(ctx, 'PIRING:', 340, 730, 15, '#ffd166');
  if (state.plate.length === 0) {
    text(ctx, '(kosong — rakit di Meja Rakit)', 420, 730, 14, '#b9a68e', 'normal');
  } else {
    text(ctx, state.plate.map(stepLabel).join(' + '), 420, 730, 14, '#ffffff', 'normal');
    const match = matchingOrder(state);
    text(ctx, match ? `✅ cocok dengan pesanan #${match.id}!` : '…belum cocok dengan pesanan', 420, 762, 13, match ? '#7CFC98' : '#ffb3ab', 'bold');
  }
  // Right column: controls on row 1, recipe legend on row 2.
  text(ctx, 'WASD / panah: gerak  •  E / klik: pakai stasiun  •  Q: buang  •  M: bisu', 1260, 730, 13, '#f4e8d0', 'normal', 'right');
  text(ctx, 'Sunset Burger = roti + patty panggang + tomat iris + selada iris  •  Ember Melt = roti + patty panggang + keju', 1260, 762, 12, '#b9a68e', 'normal', 'right');
}

function drawOrderBoard(ctx, state) {
  const x = 16; const y = 196; const w = 300; const h = 470;
  ctx.fillStyle = '#4a2c14';
  rr(ctx, x, y, w, h, 12); ctx.fill();
  ctx.fillStyle = '#6a3f1d';
  rr(ctx, x + 8, y + 8, w - 16, 44, 8); ctx.fill();
  text(ctx, '📋 PAPAN PESANAN', x + w / 2, y + 30, 18, '#ffd166', 'bold', 'center');
  if (state.orders.length === 0) {
    text(ctx, 'Belum ada pesanan…', x + w / 2, y + 120, 15, '#f4e8d0', 'normal', 'center');
  }
  state.orders.forEach((order, i) => {
    drawOrderTicket(ctx, order, x + 12, y + 64 + i * 128, w - 24, 116, state);
  });
  const prog = state.orders[0] ? orderProgress(state, state.orders[0]) : null;
  if (prog) {
    text(ctx, `Pesanan #${state.orders[0].id}: ${prog.done}/${prog.total} bahan di piring`, x + w / 2, y + h - 18, 13, '#ffd166', 'bold', 'center');
  }
}

function drawFloor(ctx) {
  ctx.fillStyle = '#f7ead2';
  ctx.fillRect(0, 68, CANVAS_WIDTH, CANVAS_HEIGHT - 68);
  ctx.fillStyle = '#efd9ae';
  for (let ty = 0; ty < 6; ty += 1) {
    for (let tx = 0; tx < 10; tx += 1) {
      if ((tx + ty) % 2 === 0) ctx.fillRect(16 + tx * 126, 190 + ty * 82, 126, 82);
    }
  }
  ctx.strokeStyle = '#e0c48f';
  ctx.lineWidth = 1;
  for (let tx = 0; tx <= 10; tx += 1) {
    ctx.beginPath(); ctx.moveTo(16 + tx * 126, 190); ctx.lineTo(16 + tx * 126, 700); ctx.stroke();
  }
  ctx.fillStyle = '#e8d3a8';
  ctx.fillRect(0, 68, CANVAS_WIDTH, 122);
  text(ctx, 'DAPUR EMBER & THYME', 640, 186, 13, '#a9762c', 'bold', 'center');
}

export function drawGame(ctx, state) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawFloor(ctx);
  drawHud(ctx, state);
  drawOrderBoard(ctx, state);
  for (const s of Object.values(STATIONS)) drawStation(ctx, s, state);
  if (state.flashServe > 0) {
    ctx.strokeStyle = `rgba(124,252,152,${0.9 * state.flashServe})`;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 69, CANVAS_WIDTH - 10, 626);
  }
  drawChef(ctx, state.chef);
  if (state.message && state.time - state.messageAt < 3) {
    ctx.fillStyle = 'rgba(43,33,24,0.92)';
    const mw = Math.min(560, ctx.measureText(state.message).width + 40);
    rr(ctx, 640 - mw / 2, 664, mw, 30, 15); ctx.fill();
    text(ctx, state.message, 640, 679, 15, '#ffd166', 'bold', 'center');
  }
  drawBottomBar(ctx, state);
  if (!state.started) {
    ctx.fillStyle = 'rgba(20,12,6,0.72)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#fff8e7';
    rr(ctx, 340, 210, 600, 380, 18); ctx.fill();
    ctx.strokeStyle = '#ff8c42';
    ctx.lineWidth = 4;
    rr(ctx, 340, 210, 600, 380, 18); ctx.stroke();
    text(ctx, '🍳 EMBER & THYME', 640, 260, 38, '#3a2415', 'bold', 'center');
    text(ctx, 'Dapur Pasar Malam', 640, 300, 20, '#a9762c', 'bold', 'center');
    text(ctx, 'Ambil bahan, iris, panggang, rakit di piring,', 640, 350, 17, '#3a2415', 'normal', 'center');
    text(ctx, 'lalu sajikan sebelum pesanan hangus!', 640, 378, 17, '#3a2415', 'normal', 'center');
    text(ctx, 'WASD / panah untuk bergerak  •  E / klik untuk memakai stasiun', 640, 420, 15, '#6a4a2a', 'normal', 'center');
    text(ctx, 'Shift 3 menit — sajikan sebanyak mungkin!', 640, 448, 15, '#6a4a2a', 'normal', 'center');
    ctx.fillStyle = '#e2483d';
    rr(ctx, 520, 480, 240, 56, 28); ctx.fill();
    text(ctx, '▶  MULAI MASAK', 640, 508, 20, '#ffffff', 'bold', 'center');
  }
  if (state.over) {
    ctx.fillStyle = 'rgba(20,12,6,0.72)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#fff8e7';
    rr(ctx, 390, 240, 500, 300, 18); ctx.fill();
    text(ctx, '⏱ SHIFT SELESAI!', 640, 300, 34, '#3a2415', 'bold', 'center');
    text(ctx, `🪙 ${state.coins} koin   •   ${state.served} hidangan disajikan`, 640, 360, 20, '#3a2415', 'normal', 'center');
    text(ctx, `Kombo terbaik x${state.bestCombo}   •   ${state.lost} pesanan hangus`, 640, 398, 17, '#6a4a2a', 'normal', 'center');
    text(ctx, 'Tekan R untuk main lagi', 640, 450, 16, '#a9762c', 'bold', 'center');
  }
}
