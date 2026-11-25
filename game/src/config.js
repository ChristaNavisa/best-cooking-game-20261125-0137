// Ember & Thyme — Night Market Kitchen: shared constants, ingredients and recipes.
// Every value the rest of the game reads lives here, so a recipe change is one edit.

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 800;

export const SHIFT_SECONDS = 180;
export const MAX_ORDERS = 3;
export const MAX_HAND = 3;

export const CHOP_SECONDS = 2.0;
export const GRILL_SECONDS = 4.0;

export const ORDER_PATIENCE = 60;
export const SERVE_COINS = 40;
export const PERFECT_BONUS = 15;
export const EXPIRE_PENALTY = 10;

// Ingredient ids are the single source of truth for art, pantry bins and recipes.
export const INGREDIENTS = {
  bread:   { name: 'Roti',        color: '#e8b25a', dark: '#a9762c', needs: 'none',  chop: false },
  patty:   { name: 'Patty',       color: '#b0613f', dark: '#6e3520', needs: 'grill', chop: false },
  tomato:  { name: 'Tomat',       color: '#e2483d', dark: '#8f1f18', needs: 'chop',  chop: true },
  lettuce: { name: 'Selada',      color: '#6fbf4a', dark: '#3d7a24', needs: 'chop',  chop: true },
  cheese:  { name: 'Keju',        color: '#f7c948', dark: '#b98a12', needs: 'none',  chop: false },
};

// A recipe step is an ingredient id plus the state it must be in when plated.
export const RECIPES = [
  {
    id: 'sunset-burger',
    name: 'Sunset Burger',
    steps: ['bread', 'patty-grilled', 'tomato-chopped', 'lettuce-chopped'],
    coins: 55,
    color: '#ff8c42',
  },
  {
    id: 'ember-melt',
    name: 'Ember Melt',
    steps: ['bread', 'patty-grilled', 'cheese'],
    coins: 45,
    color: '#e2483d',
  },
  {
    id: 'garden-stack',
    name: 'Garden Stack',
    steps: ['bread', 'lettuce-chopped', 'tomato-chopped', 'cheese'],
    coins: 40,
    color: '#6fbf4a',
  },
  {
    id: 'crisp-salad',
    name: 'Crisp Salad',
    steps: ['lettuce-chopped', 'tomato-chopped', 'cheese'],
    coins: 35,
    color: '#7fc8a9',
  },
];

// Human-readable step labels, shared by the order board and the assembly counter.
export function stepLabel(step) {
  if (step.endsWith('-grilled')) return INGREDIENTS[step.replace('-grilled', '')].name + ' panggang';
  if (step.endsWith('-chopped')) return INGREDIENTS[step.replace('-chopped', '')].name + ' iris';
  return INGREDIENTS[step].name;
}

export function stepColor(step) {
  const base = step.replace('-grilled', '').replace('-chopped', '');
  return INGREDIENTS[base].color;
}

// Kitchen geometry, in canvas pixels. Counters hug the walls; the floor is free.
export const STATIONS = {
  pantryTomato:  { x: 24,  y: 96,  w: 110, h: 76, kind: 'pantry', item: 'tomato',  label: 'Tomat' },
  pantryLettuce: { x: 146, y: 96,  w: 110, h: 76, kind: 'pantry', item: 'lettuce', label: 'Selada' },
  pantryCheese:  { x: 268, y: 96,  w: 110, h: 76, kind: 'pantry', item: 'cheese',  label: 'Keju' },
  pantryBread:   { x: 390, y: 96,  w: 110, h: 76, kind: 'pantry', item: 'bread',   label: 'Roti' },
  pantryPatty:   { x: 512, y: 96,  w: 110, h: 76, kind: 'pantry', item: 'patty',   label: 'Patty' },
  chopping:      { x: 668, y: 96,  w: 150, h: 76, kind: 'chop',   label: 'Talenan' },
  grill:         { x: 850, y: 96,  w: 170, h: 76, kind: 'grill',  label: 'Panggangan' },
  assembly:      { x: 480, y: 400, w: 320, h: 110, kind: 'assembly', label: 'Meja Rakit' },
  serveWindow:   { x: 1040, y: 96, w: 216, h: 76, kind: 'serve',  label: 'Jendela Saji' },
  trash:         { x: 1040, y: 400, w: 110, h: 90, kind: 'trash', label: 'Tong Sampah' },
};

export const CHEF_START = { x: 640, y: 620 };
export const CHEF_RADIUS = 22;
export const CHEF_SPEED = 260;

export const FLOOR = { x: 16, y: 190, w: 1248, h: 480 };

export function stationList() {
  return Object.entries(STATIONS).map(([id, s]) => ({ id, ...s }));
}

export function stationAtPoint(px, py) {
  for (const s of stationList()) {
    if (px >= s.x && px <= s.x + s.w && py >= s.y && py <= s.y + s.h) return s;
  }
  return null;
}
