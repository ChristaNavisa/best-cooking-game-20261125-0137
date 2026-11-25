// Ember & Thyme: what happens when the chef uses a station.
// One function per station kind; main.js and input.js call interactAtStation.

import { CHOP_SECONDS, GRILL_SECONDS } from './config.js';
import { takeItem, servePlate, trashHand, clearPlate, matchingOrder } from './state.js';
import { sfx } from './audio.js';

function nearestHandItem(state, want) {
  const idx = state.hand.indexOf(want);
  return idx;
}

export function interactAtStation(state, station) {
  if (!state.started || state.over) return 'idle';
  switch (station.kind) {
    case 'pantry': {
      if (!takeItem(state, station.item)) {
        sfx.error();
        state.message = 'Tangan penuh! Sajikan atau buang dulu';
        state.messageAt = state.time;
        return 'full';
      }
      sfx.pickup();
      state.message = `Mengambil ${station.label}`;
      state.messageAt = state.time;
      return 'pickup';
    }
    case 'chop': {
      if (state.chopping) return 'busy';
      const idx = state.hand.findIndex((h) => h === 'tomato' || h === 'lettuce');
      if (idx < 0) {
        sfx.error();
        state.message = 'Bawa tomat / selada ke talenan dulu';
        state.messageAt = state.time;
        return 'need-item';
      }
      const item = state.hand.splice(idx, 1)[0];
      state.chopping = { item, done: 0, total: CHOP_SECONDS };
      sfx.chop();
      state.message = `Mengiris ${item}...`;
      state.messageAt = state.time;
      return 'chopping';
    }
    case 'grill': {
      if (state.grilling) return 'busy';
      const idx = nearestHandItem(state, 'patty');
      if (idx < 0) {
        sfx.error();
        state.message = 'Bawa patty mentah ke panggangan dulu';
        state.messageAt = state.time;
        return 'need-item';
      }
      state.hand.splice(idx, 1);
      state.grilling = { item: 'patty', done: 0, total: GRILL_SECONDS };
      sfx.sizzle();
      state.message = 'Memanggang patty...';
      state.messageAt = state.time;
      return 'grilling';
    }
    case 'assembly': {
      if (state.hand.length === 0) {
        if (state.plate.length > 0) {
          clearPlate(state);
          sfx.click();
          return 'cleared';
        }
        sfx.error();
        state.message = 'Tangan kosong — ambil bahan dulu';
        state.messageAt = state.time;
        return 'empty';
      }
      const item = state.hand.shift();
      state.plate.push(item);
      sfx.place();
      state.message = `Merakit: ${item} di atas piring`;
      state.messageAt = state.time;
      return 'plated';
    }
    case 'serve': {
      if (state.plate.length === 0) {
        sfx.error();
        state.message = 'Piring kosong — rakit hidangan dulu';
        state.messageAt = state.time;
        return 'empty';
      }
      if (matchingOrder(state)) {
        const res = servePlate(state);
        if (res.ok) {
          sfx.serve();
          return 'served';
        }
      }
      sfx.error();
      state.message = 'Tidak ada pesanan yang cocok!';
      state.messageAt = state.time;
      return 'no-match';
    }
    case 'trash': {
      if (state.hand.length === 0 && state.plate.length === 0) return 'empty';
      trashHand(state);
      state.plate = [];
      sfx.click();
      return 'trashed';
    }
    default:
      return 'idle';
  }
}

// Keyboard shortcuts that do not need a station: drop the last held item.
export function dropLastHeld(state) {
  if (state.hand.length === 0) return false;
  state.hand.pop();
  sfx.click();
  return true;
}
