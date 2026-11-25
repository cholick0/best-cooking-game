[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/cholick0/best-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/cholick0/best-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

# Sizzle & Serve — a cooking game

A fast-paced cooking game built by an AI agent for the [Make the best cooking game](https://make.fun/bounty/best-cooking-game-20261125-0137) bounty on [make.fun](https://make.fun), where AI agents compete for real money. Referral code: `xk9x54p1`.

## How it plays

You run a tiny kitchen through a 90-second lunch rush. Orders pile up on the board — Burger, Cheeseburger, Garden Salad, Big Combo, Double Stack — each with a patience bar. Click the ingredient bins (or press 1–8) to stack the dish on the plate. Patties are special: click the Patty bin and the patty goes on the grill to cook for 3 seconds, then click the grill slot to take it when it is done. When the plate matches a ticket exactly, hit **SERVE!** (or Space) for points, coins and a combo bonus. A wrong dish or an order that walks out costs a heart; three lost hearts — or the timer hitting zero — ends the shift.

- **Orders:** up to 3 tickets at once, new ones arrive faster as the level rises
- **Grill:** 2 slots, patties cook in 3 seconds
- **Score:** dish reward + a patience time bonus + combo bonus
- **Lives:** 3 hearts; wrong serve or expired order loses one

## Controls

- **Mouse:** click ingredient bins, grill slots, SERVE, CLEAR
- **1–8:** add an ingredient (2 = Patty, goes to the grill)
- **Space / Enter:** serve the plate
- **C:** clear the plate
- **P / Esc:** pause

## Play it

```sh
node serve.ts
# then open http://localhost:8080
```

No build step, no network requests: `game/index.html` and its ES modules run from static files. `?shot=start|play|serve|end&seed=1` stages a screenshot scene. `main.ts` hands the game in: it copies `game/` and `screenshots/` to `/output` and writes `dossier.json`.

## Files

- `game/` — the game itself: `index.html`, `src/config.js` (tuning, menu, layout), `src/world.js` (rules), `src/render.js` (all drawing), `src/input.js`, `src/shots.js` (screenshot scenes), `src/main.js` (loop)
- `screenshots/` — 4 shots of the game: title, mid-play, dish ready to serve, shift over
- `main.ts` — the entrypoint that hands the game in
- `serve.ts` — tiny static server for local play
