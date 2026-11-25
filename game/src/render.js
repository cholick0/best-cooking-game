// Everything the player sees: the kitchen, the order board, the grill, the plate mid-assembly,
// the ingredient counter, the timer and the screens. The playfield is a fixed 1280x720 logical
// area; the renderer scales it to the window. No game rules live here — only drawing.
import { FIELD, FONT, ING, INGREDIENTS, LAYOUT, PALETTE } from './config.js';
import { plateMatches } from './world.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_OVER = 3;

const BIN_W = 140;
const BIN_GAP = 12;

/** Clickable zones, shared with input handling: bins, grill slots, serve and clear. */
export function zones() {
  const bins = INGREDIENTS.map((ing, index) => ({
    id: ing.id,
    x: LAYOUT.bins.x + index * (BIN_W + BIN_GAP),
    y: LAYOUT.bins.y,
    w: BIN_W,
    h: 128,
  }));
  const grillSlots = [0, 1].map((index) => ({
    index,
    x: LAYOUT.grill.x + 24 + index * 190,
    y: LAYOUT.grill.y + 64,
    w: 160,
    h: 110,
  }));
  return {
    bins,
    grillSlots,
    serve: { ...LAYOUT.serve },
    clear: { x: LAYOUT.plate.x, y: LAYOUT.plate.y + LAYOUT.plate.h + 6, w: 170, h: 30 },
    plate: { ...LAYOUT.plate },
  };
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function heart(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s, y, x - s * 0.4, y - s * 0.9, x, y - s * 0.25);
  ctx.bezierCurveTo(x + s * 0.4, y - s * 0.9, x + s, y, x, y + s * 0.9);
  ctx.fill();
}

function text(ctx, str, x, y, size, color, align = 'left', weight = '700') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

/** One ingredient's icon, drawn from shapes at (cx, cy) with the given radius. */
export function drawIngredientIcon(ctx, id, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  if (id === ING.BUN) {
    ctx.fillStyle = '#e8b25a';
    ctx.beginPath();
    ctx.arc(0, r * 0.25, r, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d99a3d';
    ctx.fillRect(-r, r * 0.2, r * 2, r * 0.28);
    ctx.fillStyle = '#fff3d6';
    ctx.beginPath();
    ctx.arc(-r * 0.4, -r * 0.35, r * 0.12, 0, Math.PI * 2);
    ctx.arc(r * 0.35, -r * 0.5, r * 0.12, 0, Math.PI * 2);
    ctx.arc(r * 0.05, -r * 0.15, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === ING.PATTY) {
    ctx.fillStyle = '#8a5a33';
    rr(ctx, -r, -r * 0.45, r * 2, r * 0.9, r * 0.35);
    ctx.fill();
    ctx.fillStyle = '#6b4423';
    ctx.beginPath();
    ctx.arc(-r * 0.4, 0, r * 0.14, 0, Math.PI * 2);
    ctx.arc(r * 0.3, -r * 0.1, r * 0.14, 0, Math.PI * 2);
    ctx.arc(r * 0.05, r * 0.18, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === ING.LETTUCE) {
    ctx.fillStyle = '#58b368';
    ctx.beginPath();
    for (let i = 0; i < 3; i += 1) {
      ctx.arc(-r * 0.6 + i * r * 0.6, 0, r * 0.42, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.strokeStyle = '#2f7d3d';
    ctx.lineWidth = r * 0.08;
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, r * 0.1);
    ctx.quadraticCurveTo(0, r * 0.55, r * 0.8, r * 0.1);
    ctx.stroke();
  } else if (id === ING.TOMATO) {
    ctx.fillStyle = '#e5534b';
    ctx.beginPath();
    ctx.arc(0, r * 0.1, r * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#43a047';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.7);
    ctx.lineTo(-r * 0.35, -r * 0.25);
    ctx.lineTo(r * 0.35, -r * 0.25);
    ctx.closePath();
    ctx.fill();
  } else if (id === ING.CHEESE) {
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.7);
    ctx.lineTo(r, r * 0.7);
    ctx.lineTo(0, -r * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c79a17';
    ctx.beginPath();
    ctx.arc(-r * 0.25, r * 0.25, r * 0.14, 0, Math.PI * 2);
    ctx.arc(r * 0.3, r * 0.35, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === ING.ONION) {
    ctx.strokeStyle = '#b678d6';
    ctx.lineWidth = r * 0.22;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#7d45a3';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === ING.FRIES) {
    ctx.fillStyle = '#e5534b';
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, -r * 0.1);
    ctx.lineTo(r * 0.7, -r * 0.1);
    ctx.lineTo(r * 0.5, r * 0.85);
    ctx.lineTo(-r * 0.5, r * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f6d365';
    for (let i = -1; i <= 1; i += 1) {
      ctx.fillRect(i * r * 0.42 - r * 0.14, -r * 0.95, r * 0.28, r * 0.95);
    }
  } else if (id === ING.DRINK) {
    ctx.fillStyle = '#4fc3f7';
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, -r * 0.7);
    ctx.lineTo(r * 0.55, -r * 0.7);
    ctx.lineTo(r * 0.4, r * 0.85);
    ctx.lineTo(-r * 0.4, r * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8f7ff';
    ctx.fillRect(-r * 0.65, -r * 0.85, r * 1.3, r * 0.22);
    ctx.strokeStyle = '#e5534b';
    ctx.lineWidth = r * 0.14;
    ctx.beginPath();
    ctx.moveTo(r * 0.15, -r * 0.75);
    ctx.lineTo(r * 0.45, -r * 1.35);
    ctx.stroke();
  }
  ctx.restore();
}

function drawKitchen(ctx) {
  // Tiled wall.
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = PALETTE.wallTile;
  const tile = 64;
  for (let y = 0; y < 200; y += tile) {
    for (let x = (y / tile) % 2 === 0 ? 0 : -tile / 2; x < FIELD.width; x += tile) {
      ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);
    }
  }
  // Floor.
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 448, FIELD.width, 272);
  ctx.fillStyle = PALETTE.floorLine;
  for (let y = 448; y < FIELD.height; y += 56) ctx.fillRect(0, y, FIELD.width, 3);
  // Wooden counter top under the work area.
  ctx.fillStyle = PALETTE.counterTop;
  ctx.fillRect(24, 440, 1232, 16);
  ctx.fillStyle = PALETTE.counter;
  ctx.fillRect(24, 456, 1232, 8);
}

function drawTopBar(ctx, state) {
  const bar = LAYOUT.topBar;
  ctx.fillStyle = PALETTE.board;
  ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
  text(ctx, 'SIZZLE & SERVE', 24, 34, 30, '#ffd98a');
  text(ctx, `SCORE ${state.score}`, 330, 34, 24, '#ffffff');
  // Coins.
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.arc(520, 32, 13, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, '$', 520, 33, 18, '#7a5b00', 'center');
  text(ctx, `${state.coins}`, 540, 34, 24, '#ffffff');
  // Shift timer.
  const total = 90;
  const frac = Math.max(0, state.timeLeft / total);
  const tx = 620;
  text(ctx, 'TIME', tx, 20, 14, '#cbb9a3');
  ctx.fillStyle = '#4a3f35';
  rr(ctx, tx, 30, 220, 16, 8);
  ctx.fill();
  ctx.fillStyle = frac > 0.3 ? PALETTE.green : PALETTE.red;
  rr(ctx, tx, 30, 220 * frac, 16, 8);
  ctx.fill();
  const mm = Math.floor(state.timeLeft / 60);
  const ss = String(Math.floor(state.timeLeft % 60)).padStart(2, '0');
  text(ctx, `${mm}:${ss}`, tx + 232, 38, 22, '#ffffff');
  // Hearts.
  for (let i = 0; i < 3; i += 1) {
    heart(ctx, 910 + i * 34, 32, 13, i < state.hearts ? PALETTE.red : '#5a5148');
  }
  text(ctx, `LEVEL ${state.level}`, 1010, 34, 22, '#ffd98a');
  if (state.combo > 1) text(ctx, `COMBO x${state.combo}`, 1256, 34, 20, PALETTE.gold, 'right');
}

function drawOrders(ctx, state) {
  const board = LAYOUT.board;
  ctx.fillStyle = PALETTE.board;
  rr(ctx, board.x, board.y, board.w, board.h, 12);
  ctx.fill();
  ctx.strokeStyle = PALETTE.boardEdge;
  ctx.lineWidth = 3;
  rr(ctx, board.x, board.y, board.w, board.h, 12);
  ctx.stroke();
  text(ctx, 'ORDER BOARD', board.x + 14, board.y + 18, 15, '#cbb9a3');
  if (state.orders.length === 0) {
    text(ctx, 'No orders — the lunch rush is coming…', board.x + 200, board.y + 62, 20, '#fff8e7');
    return;
  }
  state.orders.forEach((order, index) => {
    const x = board.x + 14 + index * (LAYOUT.ticket.w + LAYOUT.ticket.gap);
    const y = board.y + 8;
    ctx.fillStyle = PALETTE.ticket;
    rr(ctx, x, y, LAYOUT.ticket.w, LAYOUT.ticket.h, 10);
    ctx.fill();
    const dish = order.dish;
    text(ctx, dish.name.toUpperCase(), x + 14, y + 20, 21, PALETTE.ticketInk);
    text(ctx, `+$${dish.reward}`, x + LAYOUT.ticket.w - 14, y + 20, 20, '#2f7d3d', 'right');
    dish.needs.forEach((id, i) => {
      drawIngredientIcon(ctx, id, x + 30 + i * 44, y + 56, 16);
    });
    // Patience bar.
    const frac = Math.max(0, order.patience / order.maxPatience);
    ctx.fillStyle = '#e0d3bd';
    rr(ctx, x + 14, y + 76, LAYOUT.ticket.w - 28, 8, 4);
    ctx.fill();
    ctx.fillStyle = frac > 0.4 ? PALETTE.green : PALETTE.red;
    rr(ctx, x + 14, y + 76, (LAYOUT.ticket.w - 28) * frac, 8, 4);
    ctx.fill();
  });
}

function drawGrill(ctx, state) {
  const g = LAYOUT.grill;
  ctx.fillStyle = PALETTE.steelDark;
  rr(ctx, g.x, g.y, g.w, g.h, 12);
  ctx.fill();
  text(ctx, 'GRILL — click Patty, take it when done', g.x + 16, g.y + 22, 15, '#dfe5ea');
  state.grill.forEach((slot, index) => {
    const x = g.x + 24 + index * 190;
    const y = g.y + 64;
    ctx.fillStyle = '#22262e';
    rr(ctx, x, y, 160, 110, 10);
    ctx.fill();
    ctx.strokeStyle = '#565e6b';
    ctx.lineWidth = 2;
    for (let i = 1; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x + 10, y + i * 26);
      ctx.lineTo(x + 150, y + i * 26);
      ctx.stroke();
    }
    if (slot.state === 'cooking') {
      // Flame glow and a patty mid-cook.
      ctx.fillStyle = PALETTE.flame;
      ctx.globalAlpha = 0.35 + 0.2 * Math.sin(Date.now() / 150);
      ctx.beginPath();
      ctx.ellipse(x + 80, y + 60, 62, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#8a5a33';
      rr(ctx, x + 40, y + 40, 80, 36, 14);
      ctx.fill();
      const frac = slot.t / 3;
      ctx.fillStyle = '#3a4048';
      rr(ctx, x + 20, y + 88, 120, 10, 5);
      ctx.fill();
      ctx.fillStyle = PALETTE.flame;
      rr(ctx, x + 20, y + 88, 120 * frac, 10, 5);
      ctx.fill();
      text(ctx, 'COOKING…', x + 80, y + 122, 13, '#ffb74d', 'center');
    } else if (slot.state === 'done') {
      ctx.fillStyle = '#5d3a1e';
      rr(ctx, x + 40, y + 36, 80, 40, 14);
      ctx.fill();
      ctx.fillStyle = '#3f2712';
      ctx.beginPath();
      ctx.arc(x + 62, y + 56, 5, 0, Math.PI * 2);
      ctx.arc(x + 98, y + 52, 5, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, 'READY — CLICK!', x + 80, y + 122, 14, '#7ee787', 'center');
    } else {
      text(ctx, 'empty slot', x + 80, y + 56, 15, '#7d8590', 'center');
    }
  });
}

function drawPlate(ctx, state) {
  const p = LAYOUT.plate;
  ctx.fillStyle = PALETTE.panel;
  rr(ctx, p.x, p.y, p.w, p.h, 12);
  ctx.fill();
  text(ctx, 'PLATE', p.x + 16, p.y + 22, 15, PALETTE.muted);
  // The plate itself.
  const cx = p.x + p.w / 2;
  const cy = p.y + 132;
  ctx.fillStyle = PALETTE.plateRim;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 150, 62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.plate;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 132, 52, 0, 0, Math.PI * 2);
  ctx.fill();
  if (state.plate.length === 0) {
    text(ctx, 'Click ingredients below', cx, cy - 6, 16, PALETTE.muted, 'center');
    text(ctx, 'to build the dish', cx, cy + 16, 16, PALETTE.muted, 'center');
  } else {
    // Stack the ingredients bottom to top on the plate.
    const layers = state.plate;
    const baseY = cy + 18;
    layers.forEach((id, i) => {
      const y = baseY - i * 17;
      const w = 210 - Math.abs(i - layers.length / 2) * 4;
      if (id === ING.BUN) {
        ctx.fillStyle = '#e8b25a';
        ctx.beginPath();
        ctx.ellipse(cx, y, w / 2, 15, 0, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#d99a3d';
        ctx.fillRect(cx - w / 2, y - 2, w, 6);
      } else if (id === ING.PATTY) {
        ctx.fillStyle = '#8a5a33';
        rr(ctx, cx - w / 2, y - 12, w, 20, 9);
        ctx.fill();
      } else if (id === ING.LETTUCE) {
        ctx.fillStyle = '#58b368';
        for (let k = 0; k < 4; k += 1) {
          ctx.beginPath();
          ctx.arc(cx - w / 2 + 22 + k * 52, y - 2, 24, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (id === ING.TOMATO) {
        ctx.fillStyle = '#e5534b';
        rr(ctx, cx - w / 2, y - 12, w, 18, 8);
        ctx.fill();
      } else if (id === ING.CHEESE) {
        ctx.fillStyle = '#f2c94c';
        ctx.beginPath();
        ctx.moveTo(cx - w / 2, y + 4);
        ctx.lineTo(cx + w / 2, y + 4);
        ctx.lineTo(cx, y - 14);
        ctx.closePath();
        ctx.fill();
      } else if (id === ING.ONION) {
        ctx.strokeStyle = '#b678d6';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(cx - w * 0.28, y - 2, 16, 0, Math.PI * 2);
        ctx.arc(cx + w * 0.28, y - 2, 16, 0, Math.PI * 2);
        ctx.stroke();
      } else if (id === ING.FRIES) {
        ctx.fillStyle = '#f6d365';
        for (let k = -2; k <= 2; k += 1) {
          ctx.fillRect(cx + k * 26 - 7, y - 26, 14, 30);
        }
        ctx.fillStyle = '#e5534b';
        ctx.fillRect(cx - w / 2, y - 2, w, 10);
      } else if (id === ING.DRINK) {
        ctx.fillStyle = '#4fc3f7';
        rr(ctx, cx + w / 2 - 34, y - 52, 30, 52, 6);
        ctx.fill();
        ctx.strokeStyle = '#e5534b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx + w / 2 - 19, y - 50);
        ctx.lineTo(cx + w / 2 - 8, y - 68);
        ctx.stroke();
      }
    });
    // Top bun cap when the stack starts with a bun.
    if (layers[0] === ING.BUN) {
      ctx.fillStyle = '#e8b25a';
      ctx.beginPath();
      ctx.ellipse(cx, baseY - layers.length * 17 + 4, 108, 16, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
    }
  }
  // Clear button.
  const clear = zones().clear;
  ctx.fillStyle = '#e8e0d2';
  rr(ctx, clear.x, clear.y, clear.w, clear.h, 8);
  ctx.fill();
  text(ctx, 'CLEAR  [C]', clear.x + clear.w / 2, clear.y + 16, 14, PALETTE.text, 'center');
}

function drawServe(ctx, state) {
  const s = LAYOUT.serve;
  const ready = state.plate.length > 0 && state.orders.some((order) => plateMatches(state.plate, order.dish));
  const pulse = ready ? 0.75 + 0.25 * Math.sin(Date.now() / 180) : 1;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = ready ? '#2e9e4f' : '#5a5148';
  rr(ctx, s.x, s.y, s.w, s.h, 16);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = ready ? '#a5e8b4' : '#8b7d6b';
  ctx.lineWidth = 3;
  rr(ctx, s.x, s.y, s.w, s.h, 16);
  ctx.stroke();
  text(ctx, 'SERVE!', s.x + s.w / 2, s.y + 52, 40, '#ffffff', 'center');
  text(ctx, ready ? 'This dish matches an order!' : 'Match a ticket, then serve', s.x + s.w / 2, s.y + 100, 17, ready ? '#d9f7df' : '#d8cfc2', 'center');
  text(ctx, '[SPACE]', s.x + s.w / 2, s.y + 128, 15, '#ffffff', 'center');
}

function drawBins(ctx) {
  const bins = zones().bins;
  ctx.fillStyle = 'rgba(46, 42, 38, 0.85)';
  rr(ctx, LAYOUT.bins.x - 12, LAYOUT.bins.y - 34, LAYOUT.bins.w + 24, 178, 12);
  ctx.fill();
  text(ctx, 'INGREDIENTS — click a bin or press its key', LAYOUT.bins.x, LAYOUT.bins.y - 16, 16, '#ffd98a');
  INGREDIENTS.forEach((ing, index) => {
    const b = bins[index];
    ctx.fillStyle = ing.color;
    rr(ctx, b.x, b.y, b.w, b.h, 12);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    rr(ctx, b.x, b.y + b.h - 34, b.w, 34, 10);
    ctx.fill();
    // A white disc behind the icon so it reads against its own coloured bin.
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.arc(b.x + b.w / 2, b.y + 52, 40, 0, Math.PI * 2);
    ctx.fill();
    drawIngredientIcon(ctx, ing.id, b.x + b.w / 2, b.y + 52, 30);
    text(ctx, ing.name, b.x + b.w / 2, b.y + 108, 16, '#ffffff', 'center');
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    rr(ctx, b.x + 6, b.y + 6, 26, 22, 6);
    ctx.fill();
    text(ctx, ing.key, b.x + 19, b.y + 18, 14, '#ffffff', 'center');
  });
}

function drawHint(ctx) {
  const h = LAYOUT.hint;
  ctx.fillStyle = 'rgba(46, 42, 38, 0.9)';
  ctx.fillRect(h.x, h.y, h.w, h.h);
  text(ctx, '1–8 ingredients  •  SPACE serve  •  C clear plate  •  P pause  •  Click the grill to take a cooked patty', 24, h.y + 26, 17, '#ffe9c4');
}

function drawMessage(ctx, state) {
  if (state.messageT > 0 && state.message) {
    ctx.fillStyle = 'rgba(46, 42, 38, 0.88)';
    const w = ctx.measureText(state.message).width + 320;
    rr(ctx, FIELD.width / 2 - 260, 196, 520, 40, 10);
    ctx.fill();
    text(ctx, state.message, FIELD.width / 2, 217, 19, '#ffe9c4', 'center');
  }
  if (state.serveFlash > 0) {
    ctx.fillStyle = `rgba(67, 160, 71, ${Math.min(0.35, state.serveFlash * 0.3)})`;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }
}

function dim(ctx) {
  ctx.fillStyle = 'rgba(20, 14, 10, 0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = PALETTE.panel;
  rr(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = '#d9b380';
  ctx.lineWidth = 3;
  rr(ctx, x, y, w, h, 18);
  ctx.stroke();
}

function drawTitle(ctx, state, best) {
  panel(ctx, 290, 130, 700, 460);
  text(ctx, 'SIZZLE & SERVE', 640, 210, 58, '#c2410c', 'center');
  text(ctx, 'The 90-second lunch rush', 640, 262, 26, PALETTE.text, 'center');
  text(ctx, 'Orders pile up on the board. Grill the patties,', 640, 322, 21, PALETTE.text, 'center');
  text(ctx, 'stack the plate to match a ticket, and serve it', 640, 352, 21, PALETTE.text, 'center');
  text(ctx, 'before the customer walks out!', 640, 382, 21, PALETTE.text, 'center');
  drawIngredientIcon(ctx, ING.BUN, 520, 440, 26);
  drawIngredientIcon(ctx, ING.PATTY, 600, 440, 26);
  drawIngredientIcon(ctx, ING.LETTUCE, 680, 440, 26);
  drawIngredientIcon(ctx, ING.TOMATO, 760, 440, 26);
  text(ctx, 'PRESS SPACE OR CLICK TO START', 640, 512, 24, '#2f7d3d', 'center');
  if (best > 0) text(ctx, `Best score: ${best}`, 640, 552, 19, PALETTE.muted, 'center');
}

function drawPaused(ctx) {
  dim(ctx);
  panel(ctx, 440, 260, 400, 160);
  text(ctx, 'PAUSED', 640, 318, 44, PALETTE.text, 'center');
  text(ctx, 'Press P to keep cooking', 640, 372, 20, PALETTE.muted, 'center');
}

function drawOver(ctx, state, best) {
  dim(ctx);
  panel(ctx, 340, 150, 600, 420);
  text(ctx, 'SHIFT OVER!', 640, 222, 52, '#c2410c', 'center');
  text(ctx, `Score: ${state.score}`, 640, 300, 30, PALETTE.text, 'center');
  text(ctx, `Dishes served: ${state.served}   •   Coins: ${state.coins}`, 640, 348, 22, PALETTE.text, 'center');
  text(ctx, `Best score: ${Math.max(best, state.score)}`, 640, 388, 22, PALETTE.muted, 'center');
  if (state.score >= best && state.score > 0) text(ctx, 'New best!', 640, 424, 22, '#2f7d3d', 'center');
  text(ctx, 'PRESS SPACE TO PLAY AGAIN', 640, 500, 24, '#2f7d3d', 'center');
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth || FIELD.width;
    const h = canvas.clientHeight || FIELD.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    ctx.setTransform(scale, 0, 0, scale, (canvas.width - FIELD.width * scale) / 2, (canvas.height - FIELD.height * scale) / 2);
  }

  fit();
  window.addEventListener('resize', fit);

  return {
    draw(state, screen, best) {
      fit();
      ctx.clearRect(0, 0, FIELD.width, FIELD.height);
      drawKitchen(ctx);
      drawTopBar(ctx, state);
      drawOrders(ctx, state);
      drawGrill(ctx, state);
      drawPlate(ctx, state);
      drawServe(ctx, state);
      drawBins(ctx);
      drawHint(ctx);
      drawMessage(ctx, state);
      if (screen === SCREEN_TITLE) drawTitle(ctx, state, best);
      else if (screen === SCREEN_PAUSED) drawPaused(ctx);
      else if (screen === SCREEN_OVER) drawOver(ctx, state, best);
    },
  };
}
