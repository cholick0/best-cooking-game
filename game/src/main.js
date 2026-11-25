// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s steps
// (several in a slow frame, none in a fast one), and the renderer paints what is there. The game
// moves between four screens: title, play, paused and game over.
//
// ?seed=N fixes the order pattern. ?shot=start|play|serve|end (with &seed=N) stages that scene
// instead of running the loop, paints it twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, LIVES, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_EXPIRED, EVENT_OVER, EVENT_SERVED, EVENT_WRONG } from './world.js';
import { ACTION_CLEAR, ACTION_CONFIRM, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, zones } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const ZONES = zones();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function inRect(point, rect) {
  return point && point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes and each serve.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce(`Playing. ${LIVES} hearts. Serve the orders before time runs out.`);
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(`Shift over. Score ${world.state.score}. Best ${best}.`);
  }

  /** A click while playing: bins add ingredients, grill slots take cooked patties, serve serves. */
  function handleClick(point) {
    if (!point || screen !== SCREEN_PLAY) return false;
    for (const bin of ZONES.bins) {
      if (inRect(point, bin)) {
        world.addIngredient(bin.id);
        return true;
      }
    }
    for (const slot of ZONES.grillSlots) {
      if (inRect(point, slot)) {
        world.takeFromGrill(slot.index);
        return true;
      }
    }
    if (inRect(point, ZONES.serve)) {
      const events = world.serve();
      if (events & EVENT_OVER) endGame();
      else if (events & EVENT_SERVED) announce(world.state.message);
      else if (events & EVENT_WRONG) announce(world.state.message);
      return true;
    }
    if (inRect(point, ZONES.clear)) {
      world.clearPlate();
      return true;
    }
    return false;
  }

  function handleActions() {
    const actions = input.takeActions();
    const click = input.takeClick();
    for (const id of input.takeIngredients()) {
      if (screen === SCREEN_PLAY) world.addIngredient(id);
    }
    if (actions & ACTION_CLEAR && screen === SCREEN_PLAY) world.clearPlate();
    if (click && screen === SCREEN_PLAY) handleClick(click);
    if (click && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) startGame();
    if (actions & ACTION_CONFIRM && screen === SCREEN_PLAY) {
      // Space/Enter while playing serves the plate.
      const events = world.serve();
      if (events & EVENT_OVER) endGame();
      else if (events & EVENT_SERVED) announce(world.state.message);
      else if (events & EVENT_WRONG) announce(world.state.message);
    }
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) startGame();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) return;
    const events = world.step(STEP, { serve: false, clear: false });
    if (events & EVENT_SERVED) announce(world.state.message);
    else if (events & EVENT_WRONG) announce(world.state.message);
    else if (events & EVENT_EXPIRED) announce(world.state.message);
    if (events & EVENT_OVER) endGame();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting orders expire unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Sizzle and Serve. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
