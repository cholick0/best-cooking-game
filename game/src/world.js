// The game's rules and state, with no drawing and no browser in it: orders on the board, the
// grill, the plate mid-assembly, the shift timer, hearts, score and levels. step() advances one
// fixed step and returns what happened as bit flags, so the caller can react without the world
// knowing about screens or sound. Nothing here allocates after createWorld returns.
import {
  DISHES,
  GRILL_SECONDS,
  GRILL_SLOTS,
  ING,
  LEVEL_SECONDS,
  LIVES,
  MAX_ORDERS,
  ORDER_INTERVAL,
  ORDER_PATIENCE,
  SHIFT_SECONDS,
} from './config.js';

export const EVENT_SERVED = 1;
export const EVENT_WRONG = 2;
export const EVENT_EXPIRED = 4;
export const EVENT_GRILL_READY = 8;
export const EVENT_OVER = 16;

/** A multiset of ingredient ids, as a sorted string, so two plates compare by contents. */
export function plateKey(items) {
  return [...items].sort().join(',');
}

/** True when the plate holds exactly the dish's ingredients, no more and no less. */
export function plateMatches(plate, dish) {
  return plateKey(plate) === plateKey(dish.needs);
}

function pickDish(random, level) {
  const pool = DISHES.filter((dish) => dish.minLevel <= level);
  return pool[Math.floor(random() * pool.length)];
}

export function createWorld(random) {
  const orders = [];
  const grill = [];
  for (let index = 0; index < GRILL_SLOTS; index += 1) {
    grill.push({ state: 'empty', t: 0 });
  }
  const state = {
    orders,
    grill,
    plate: [],
    score: 0,
    coins: 0,
    hearts: LIVES,
    combo: 0,
    level: 1,
    elapsed: 0,
    timeLeft: SHIFT_SECONDS,
    spawnTimer: 2,
    served: 0,
    wrong: 0,
    servedDish: null,
    serveFlash: 0,
    message: '',
    messageT: 0,
  };

  function spawnOrder() {
    if (orders.length >= MAX_ORDERS) return;
    const dish = pickDish(random, state.level);
    orders.push({ dish, patience: ORDER_PATIENCE, maxPatience: ORDER_PATIENCE, id: state.served + orders.length + state.wrong + 1 });
  }

  function reset() {
    orders.length = 0;
    for (const slot of grill) {
      slot.state = 'empty';
      slot.t = 0;
    }
    state.plate.length = 0;
    state.score = 0;
    state.coins = 0;
    state.hearts = LIVES;
    state.combo = 0;
    state.level = 1;
    state.elapsed = 0;
    state.timeLeft = SHIFT_SECONDS;
    state.spawnTimer = 2;
    state.served = 0;
    state.wrong = 0;
    state.servedDish = null;
    state.serveFlash = 0;
    state.message = '';
    state.messageT = 0;
    spawnOrder();
    spawnOrder();
  }

  function setMessage(text) {
    state.message = text;
    state.messageT = 2.2;
  }

  /** Click an ingredient bin: a patty goes on the grill, everything else straight to the plate. */
  function addIngredient(id) {
    if (id === ING.PATTY) {
      const slot = grill.find((s) => s.state === 'empty');
      if (!slot) {
        setMessage('Grill is full!');
        return false;
      }
      slot.state = 'cooking';
      slot.t = 0;
      return true;
    }
    if (state.plate.length >= 6) {
      setMessage('Plate is full — serve or clear it!');
      return false;
    }
    state.plate.push(id);
    return true;
  }

  /** Click a grill slot: take a cooked patty onto the plate. */
  function takeFromGrill(index) {
    const slot = grill[index];
    if (!slot || slot.state !== 'done') return false;
    if (state.plate.length >= 6) {
      setMessage('Plate is full — serve or clear it!');
      return false;
    }
    slot.state = 'empty';
    slot.t = 0;
    state.plate.push(ING.PATTY);
    return true;
  }

  function clearPlate() {
    state.plate.length = 0;
  }

  /** Serve the plate: it must match an order's dish exactly, or a heart is lost. */
  function serve() {
    if (state.plate.length === 0) {
      setMessage('Nothing on the plate yet!');
      return 0;
    }
    const matchIndex = orders.findIndex((order) => plateMatches(state.plate, order.dish));
    if (matchIndex === -1) {
      state.hearts -= 1;
      state.wrong += 1;
      state.combo = 0;
      state.plate.length = 0;
      setMessage('Wrong dish! The customer sent it back.');
      return EVENT_WRONG | (state.hearts <= 0 ? EVENT_OVER : 0);
    }
    const order = orders[matchIndex];
    const timeBonus = Math.round((order.patience / order.maxPatience) * 40);
    const gained = order.dish.reward + timeBonus + state.combo * 10;
    state.score += gained;
    state.coins += Math.round(gained / 10);
    state.combo += 1;
    state.served += 1;
    state.servedDish = order.dish.name;
    state.serveFlash = 1.2;
    orders.splice(matchIndex, 1);
    state.plate.length = 0;
    setMessage(`Served ${order.dish.name}! +${gained}`);
    return EVENT_SERVED;
  }

  function step(dt, actions) {
    let events = 0;
    if (state.timeLeft <= 0 || state.hearts <= 0) return EVENT_OVER;
    state.elapsed += dt;
    state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);
    state.level = 1 + Math.floor(state.elapsed / LEVEL_SECONDS);
    if (state.messageT > 0) state.messageT -= dt;
    if (state.serveFlash > 0) state.serveFlash -= dt;

    // New orders keep arriving while the board has room.
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnOrder();
      const interval = Math.max(
        ORDER_INTERVAL.min,
        ORDER_INTERVAL.start - ORDER_INTERVAL.perLevel * (state.level - 1),
      );
      state.spawnTimer = interval;
    }

    // Orders lose patience; an expired order costs a heart.
    for (let index = orders.length - 1; index >= 0; index -= 1) {
      orders[index].patience -= dt;
      if (orders[index].patience <= 0) {
        orders.splice(index, 1);
        state.hearts -= 1;
        state.combo = 0;
        events |= EVENT_EXPIRED;
        setMessage('An order walked out!');
        if (state.hearts <= 0) return events | EVENT_OVER;
      }
    }

    // Patties cook on the grill.
    for (const slot of grill) {
      if (slot.state === 'cooking') {
        slot.t += dt;
        if (slot.t >= GRILL_SECONDS) {
          slot.state = 'done';
          slot.t = GRILL_SECONDS;
          events |= EVENT_GRILL_READY;
        }
      }
    }

    if (actions.serve) events |= serve();
    if (actions.clear) clearPlate();
    if (state.timeLeft <= 0) events |= EVENT_OVER;
    return events;
  }

  return {
    state,
    reset,
    step,
    addIngredient,
    takeFromGrill,
    clearPlate,
    serve,
    spawnOrder,
  };
}
