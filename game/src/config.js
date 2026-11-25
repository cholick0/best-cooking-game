// Every tuning number and colour in one place. The playfield is a fixed 1280x720 logical area;
// the renderer scales it to the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One shift lasts this long; when the timer hits zero the shift is over. */
export const SHIFT_SECONDS = 90;

/** Hearts lost for a wrong serve or an order that runs out of patience. */
export const LIVES = 3;

/** How long an order waits before the customer walks out. */
export const ORDER_PATIENCE = 26;

/** Seconds between new orders arriving; shrinks as the level rises. */
export const ORDER_INTERVAL = { start: 9, perLevel: 0.7, min: 4.5 };

/** Seconds a raw patty needs on the grill before it is cooked. */
export const GRILL_SECONDS = 3;

/** Two grill slots: two patties can cook at once. */
export const GRILL_SLOTS = 2;

/** How many orders the board holds at once. */
export const MAX_ORDERS = 3;

/** A level lasts this long; each level brings faster orders and harder dishes. */
export const LEVEL_SECONDS = 30;

/** Ingredient ids, in counter-bin order. */
export const ING = {
  BUN: 'bun',
  PATTY: 'patty',
  LETTUCE: 'lettuce',
  TOMATO: 'tomato',
  CHEESE: 'cheese',
  ONION: 'onion',
  FRIES: 'fries',
  DRINK: 'drink',
};

export const INGREDIENTS = [
  { id: ING.BUN, key: '1', name: 'Bun', color: '#e8b25a', dark: '#b97f2e' },
  { id: ING.PATTY, key: '2', name: 'Patty', color: '#8a5a33', dark: '#5d3a1e' },
  { id: ING.LETTUCE, key: '3', name: 'Lettuce', color: '#58b368', dark: '#2f7d3d' },
  { id: ING.TOMATO, key: '4', name: 'Tomato', color: '#e5534b', dark: '#a92c25' },
  { id: ING.CHEESE, key: '5', name: 'Cheese', color: '#f2c94c', dark: '#c79a17' },
  { id: ING.ONION, key: '6', name: 'Onion', color: '#b678d6', dark: '#7d45a3' },
  { id: ING.FRIES, key: '7', name: 'Fries', color: '#f6d365', dark: '#c79a17' },
  { id: ING.DRINK, key: '8', name: 'Drink', color: '#4fc3f7', dark: '#1e7fa8' },
];

/** The menu: every dish is the multiset of ingredients its ticket asks for. */
export const DISHES = [
  { name: 'Burger', needs: [ING.BUN, ING.PATTY, ING.LETTUCE, ING.TOMATO], reward: 100, minLevel: 1 },
  { name: 'Cheeseburger', needs: [ING.BUN, ING.PATTY, ING.CHEESE, ING.LETTUCE], reward: 120, minLevel: 1 },
  { name: 'Garden Salad', needs: [ING.LETTUCE, ING.TOMATO, ING.ONION], reward: 80, minLevel: 1 },
  { name: 'Big Combo', needs: [ING.BUN, ING.PATTY, ING.CHEESE, ING.FRIES, ING.DRINK], reward: 180, minLevel: 2 },
  { name: 'Double Stack', needs: [ING.BUN, ING.PATTY, ING.PATTY, ING.CHEESE, ING.TOMATO], reward: 200, minLevel: 3 },
];

/** Layout of the kitchen, in logical pixels. */
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 64 },
  board: { x: 24, y: 76, w: 1232, h: 108 },
  ticket: { w: 392, h: 92, gap: 28 },
  grill: { x: 40, y: 208, w: 400, h: 220 },
  plate: { x: 480, y: 208, w: 360, h: 220 },
  serve: { x: 880, y: 240, w: 360, h: 156 },
  bins: { x: 40, y: 460, w: 1200, h: 180, binW: 140, gap: 12 },
  hint: { x: 0, y: 668, w: 1280, h: 52 },
};

export const PALETTE = {
  wall: '#f6e3c5',
  wallTile: '#eed3ac',
  floor: '#a9713f',
  floorLine: '#96602f',
  counter: '#7a4a2b',
  counterTop: '#9c6b43',
  steel: '#8a93a3',
  steelDark: '#6b7280',
  board: '#2e2a26',
  boardEdge: '#4a3f35',
  ticket: '#fff8e7',
  ticketInk: '#3a2e22',
  plate: '#f4f6f8',
  plateRim: '#c9d2d8',
  text: '#2b2118',
  muted: '#8b7d6b',
  panel: '#fff3dd',
  red: '#e5534b',
  green: '#43a047',
  gold: '#f2c94c',
  blue: '#4fc3f7',
  flame: '#ff9f1c',
};

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'sizzle-and-serve.best';

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
