// The screenshot scenes behind ?shot=start|play|serve|end. Each one stages a real game state
// through the world's own API — spawning orders, grilling a patty, stacking the plate — so the
// frame is what a short game really looks like and the same seed always gives the same frame.
import { ING } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function stagePlay(world, score, timeLeft, plate, grillDone) {
  const state = world.state;
  world.reset();
  state.score = score;
  state.coins = Math.round(score / 10);
  state.elapsed = 90 - timeLeft;
  state.timeLeft = timeLeft;
  state.served = Math.floor(score / 110);
  // Two orders on the board, from the world's own spawn.
  state.orders.length = 0;
  world.spawnOrder();
  world.spawnOrder();
  // A patty on the grill: cooking or done.
  if (grillDone) {
    world.addIngredient(ING.PATTY);
    state.grill[0].state = 'done';
    state.grill[0].t = 3;
  } else {
    world.addIngredient(ING.PATTY);
    state.grill[0].t = 1.8;
  }
  for (const id of plate) state.plate.push(id);
  return state;
}

export function stageShot(name, world) {
  if (name === 'play') {
    stagePlay(world, 240, 62, [ING.BUN, ING.PATTY, ING.LETTUCE], false);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'serve') {
    // Plate holds a full burger and the first order is a burger: the serve button lights up.
    const state = world.state;
    world.reset();
    state.score = 350;
    state.coins = 35;
    state.elapsed = 42;
    state.timeLeft = 48;
    state.served = 3;
    state.orders.length = 0;
    state.orders.push({ dish: { name: 'Burger', needs: [ING.BUN, ING.PATTY, ING.LETTUCE, ING.TOMATO], reward: 100 }, patience: 18, maxPatience: 26, id: 1 });
    world.spawnOrder();
    state.plate.push(ING.BUN, ING.PATTY, ING.LETTUCE, ING.TOMATO);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'end') {
    const state = world.state;
    world.reset();
    state.score = 1240;
    state.coins = 124;
    state.served = 9;
    state.wrong = 1;
    state.elapsed = 90;
    state.timeLeft = 0;
    state.hearts = 2;
    return { screen: SCREEN_OVER, best: 1240 };
  }
  // start (and anything else): a fresh board, title over the kitchen.
  world.reset();
  return { screen: SCREEN_TITLE, best: 0 };
}
