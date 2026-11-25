// Ember & Thyme: deterministic staging presets for the screenshots.
// Each preset arranges a real, playable state — orders on the board, ingredients
// on the counters, a dish mid-assembly, a running timer and a plate ready to
// serve — then the game keeps running from there. Nothing here is an image edit.

import { RECIPES } from './config.js';
import { createState, startShift, makeOrder } from './state.js';

function seededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function baseState(seed) {
  const rng = seededRng(seed);
  const state = createState(rng);
  state.started = true;
  state.time = 42;
  state.shiftLeft = 180 - 42;
  state.coins = 185;
  state.served = 3;
  state.combo = 2;
  state.bestCombo = 3;
  state.orders = [];
  return state;
}

function orderWith(state, recipeId, patience) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  const order = makeOrder(state.rng, state.time);
  order.recipe = recipe;
  order.patience = patience;
  state.orders.push(order);
  return order;
}

// Cover: everything the bounty asks to see, in one frame.
export function stageCover() {
  const state = baseState(7);
  orderWith(state, 'sunset-burger', 44);
  orderWith(state, 'ember-melt', 31);
  orderWith(state, 'garden-stack', 52);
  state.plate = ['bread', 'patty-grilled', 'tomato-chopped'];
  state.hand = ['lettuce-chopped'];
  state.chef = { x: 640, y: 600, dir: 'up', moving: false, target: null };
  state.message = 'Merakit: tomat iris di atas piring';
  state.messageAt = state.time;
  return state;
}

// Chopping in progress at the board, with a queue of orders behind it.
export function stageChop() {
  const state = baseState(21);
  orderWith(state, 'garden-stack', 48);
  orderWith(state, 'crisp-salad', 26);
  state.chopping = { item: 'tomato', done: 1.1, total: 2.0 };
  state.hand = ['lettuce'];
  state.plate = ['bread', 'lettuce-chopped'];
  state.chef = { x: 743, y: 220, dir: 'up', moving: false, target: null };
  state.message = 'Mengiris tomat...';
  state.messageAt = state.time;
  return state;
}

// Patty on the grill, plate waiting, serve window lit.
export function stageGrill() {
  const state = baseState(42);
  orderWith(state, 'sunset-burger', 38);
  orderWith(state, 'ember-melt', 55);
  state.grilling = { item: 'patty', done: 2.6, total: 4.0 };
  state.hand = ['cheese'];
  state.plate = ['bread', 'tomato-chopped', 'lettuce-chopped'];
  state.chef = { x: 935, y: 220, dir: 'up', moving: false, target: null };
  state.message = 'Memanggang patty...';
  state.messageAt = state.time;
  return state;
}

// The serve moment: a finished dish matches the top order.
export function stageServe() {
  const state = baseState(99);
  orderWith(state, 'ember-melt', 47);
  orderWith(state, 'crisp-salad', 33);
  state.plate = ['bread', 'patty-grilled', 'cheese'];
  state.hand = [];
  state.chef = { x: 1148, y: 220, dir: 'up', moving: false, target: null };
  state.flashServe = 0.8;
  state.message = '✅ cocok dengan pesanan #1!';
  state.messageAt = state.time;
  return state;
}

export function stageFor(name) {
  switch (name) {
    case 'chop': return stageChop();
    case 'grill': return stageGrill();
    case 'serve': return stageServe();
    case 'cover':
    default: return stageCover();
  }
}

// A plain fresh shift with no preset, for real play.
export function stageFresh() {
  const state = createState(Math.random);
  startShift(state);
  return state;
}
