// Ember & Thyme: the whole mutable game state — orders, plate, timer, score.
// Nothing here touches the canvas; render.js reads this and draws it.

import {
  RECIPES, MAX_ORDERS, ORDER_PATIENCE, SHIFT_SECONDS, MAX_HAND,
  SERVE_COINS, PERFECT_BONUS, EXPIRE_PENALTY, CHEF_START,
} from './config.js';

let orderCounter = 0;

export function randomRecipe(rng) {
  return RECIPES[Math.floor(rng() * RECIPES.length)];
}

export function makeOrder(rng, now) {
  const recipe = randomRecipe(rng);
  orderCounter += 1;
  return {
    id: orderCounter,
    recipe,
    patience: ORDER_PATIENCE,
    bornAt: now,
    served: false,
  };
}

export function createState(rng) {
  return {
    rng,
    time: 0,
    shiftLeft: SHIFT_SECONDS,
    coins: 0,
    served: 0,
    lost: 0,
    combo: 0,
    bestCombo: 0,
    chef: { x: CHEF_START.x, y: CHEF_START.y, dir: 'down', moving: false, target: null },
    hand: [],
    plate: [],
    orders: [],
    chopping: null, // { item, done, total }
    grilling: null, // { item, done, total }
    message: '',
    messageAt: -99,
    over: false,
    started: false,
    nextOrderIn: 1.5,
    flashServe: 0,
  };
}

export function startShift(state) {
  state.started = true;
  state.time = 0;
  for (let i = 0; i < 2; i += 1) state.orders.push(makeOrder(state.rng, 0));
}

export function spawnOrder(state) {
  if (state.orders.length >= MAX_ORDERS) return;
  state.orders.push(makeOrder(state.rng, state.time));
}

export function plateMatchesOrder(plate, recipe) {
  if (plate.length !== recipe.steps.length) return false;
  const sortedPlate = [...plate].sort();
  const sortedSteps = [...recipe.steps].sort();
  return sortedPlate.every((step, i) => step === sortedSteps[i]);
}

export function matchingOrder(state) {
  return state.orders.find((o) => plateMatchesOrder(state.plate, o.recipe));
}

export function orderProgress(state, order) {
  const done = order.recipe.steps.filter((s) => state.plate.includes(s)).length;
  return { done, total: order.recipe.steps.length };
}

export function canTake(state) {
  return state.hand.length < MAX_HAND;
}

export function takeItem(state, item) {
  if (!canTake(state)) return false;
  state.hand.push(item);
  return true;
}

export function servePlate(state) {
  const order = matchingOrder(state);
  if (!order) return { ok: false, reason: 'no-match' };
  const quick = order.patience > ORDER_PATIENCE * 0.6;
  const earned = order.recipe.coins + SERVE_COINS + (quick ? PERFECT_BONUS : 0);
  state.coins += earned;
  state.served += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.orders = state.orders.filter((o) => o.id !== order.id);
  state.plate = [];
  state.flashServe = 1;
  state.message = quick ? `Sempurna! +${earned} koin` : `Disajikan! +${earned} koin`;
  state.messageAt = state.time;
  return { ok: true, earned, quick };
}

export function trashHand(state) {
  state.hand = [];
  state.combo = 0;
  state.message = 'Tangan dikosongkan';
  state.messageAt = state.time;
}

export function clearPlate(state) {
  state.plate = [];
  state.combo = 0;
  state.message = 'Piring dikosongkan';
  state.messageAt = state.time;
}

export function updateTimers(state, dt) {
  if (!state.started || state.over) return;
  state.time += dt;
  state.shiftLeft = Math.max(0, SHIFT_SECONDS - state.time);
  if (state.shiftLeft <= 0) {
    state.over = true;
    state.message = 'Shift selesai!';
    state.messageAt = state.time;
    return;
  }
  state.nextOrderIn -= dt;
  if (state.nextOrderIn <= 0) {
    spawnOrder(state);
    state.nextOrderIn = 6 + state.rng() * 5;
  }
  for (const order of state.orders) order.patience -= dt;
  const expired = state.orders.filter((o) => o.patience <= 0);
  if (expired.length > 0) {
    state.orders = state.orders.filter((o) => o.patience > 0);
    state.lost += expired.length;
    state.combo = 0;
    state.coins = Math.max(0, state.coins - EXPIRE_PENALTY * expired.length);
    state.message = `Pesanan hangus! -${EXPIRE_PENALTY * expired.length} koin`;
    state.messageAt = state.time;
  }
  if (state.chopping) {
    state.chopping.done += dt;
    if (state.chopping.done >= state.chopping.total) {
      takeItem(state, `${state.chopping.item}-chopped`);
      state.message = `${state.chopping.item} selesai diiris`;
      state.messageAt = state.time;
      state.chopping = null;
    }
  }
  if (state.grilling) {
    state.grilling.done += dt;
    if (state.grilling.done >= state.grilling.total) {
      takeItem(state, `${state.grilling.item}-grilled`);
      state.message = `${state.grilling.item} selesai dipanggang`;
      state.messageAt = state.time;
      state.grilling = null;
    }
  }
  if (state.flashServe > 0) state.flashServe = Math.max(0, state.flashServe - dt * 2);
}
