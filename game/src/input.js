// Keyboard and pointer input. One-shot presses (start, pause, serve, clear) are queued as bit
// flags and taken once by the loop, so a press between two frames is never lost and never counted
// twice. Number keys queue ingredients; a pointer press only records the click position — clicks
// never count as a confirm, so clicking empty kitchen never serves by accident.
import { INGREDIENTS } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_CLEAR = 4;

const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const CLEAR = new Set(['KeyC']);

export function createInput(target) {
  let actions = 0;
  let click = null;
  const ingredientKeys = new Map(INGREDIENTS.map((ing) => [ing.key, ing.id]));
  const pressedIngredients = [];

  window.addEventListener('keydown', (event) => {
    if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (CLEAR.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CLEAR;
    } else if (event.code.startsWith('Digit')) {
      const id = ingredientKeys.get(event.code.slice(5));
      if (id && !event.repeat) pressedIngredients.push(id);
    } else {
      return;
    }
    event.preventDefault();
  });

  target.addEventListener('pointerdown', (event) => {
    const rect = target.getBoundingClientRect();
    // The canvas is scaled to the window; map back to the 1280x720 logical field.
    const scale = Math.min(rect.width / 1280, rect.height / 720);
    const offsetX = (rect.width - 1280 * scale) / 2;
    const offsetY = (rect.height - 720 * scale) / 2;
    click = {
      x: (event.clientX - rect.left - offsetX) / scale,
      y: (event.clientY - rect.top - offsetY) / scale,
    };
  });

  // A key released while the tab is hidden never sends keyup: nothing held is tracked here.
  window.addEventListener('blur', () => {
    pressedIngredients.length = 0;
  });

  return {
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** Ingredient ids pressed by number key since the last call. */
    takeIngredients() {
      const taken = [...pressedIngredients];
      pressedIngredients.length = 0;
      return taken;
    },
    /** The last click in logical coordinates, or null. */
    takeClick() {
      const taken = click;
      click = null;
      return taken;
    },
  };
}
