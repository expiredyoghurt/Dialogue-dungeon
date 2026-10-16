# Dialogue Dungeon v1.2.0

Arcade-RPG dialogue-writing practice on Cloudflare Workers + D1 + Durable Objects.

## What is in v1.0.0
v1.0.0 = v0.16.1 (hidden job tree, instruction and rules scaffolding) + v0.17 (Dungeon Dive co-op parties on Durable Objects).

- **Job tree is revealed step by step.** The server only sends the jobs a pupil owns plus the jobs they can unlock next (children of an owned job). Names, damage and perks of everything deeper never reach the browser (`visibleJobs()` in `src/game.js`). The teacher console still shows the full tree. In a Dungeon Dive lobby, teammates' current job names are sent so the party list reads properly (`jobName` in `src/dive.js`).
- **Instruction and scaffolding.** A Help dialog (How to play / Question types / The rules) opens from the login page, the village, solo fights and Dungeon Dive fights; a dismissible "New here?" card shows until it is first opened. Each question has a collapsible "Rules to remember" box, wrong answers show the specific rules broken (with coloured examples, as in Dialogue Dash), and the profile shows the pupil's three most-missed rules from `/api/me`. The How to play tab gains a Dungeon Dive step when a teacher has switched Dive on.
- **Dungeon Dive (co-op).** One `DiveParty` Durable Object per party (4-character code, up to 4 pupils). Off by default: a teacher turns it on under Game balance.

## What is new in v1.2.0 (XP mode)
- **XP mode toggle** (teacher console, Game balance tab, "XP mode"). *Fixed XP by monster level* (default, unchanged): XP = monster XP × level. *Monster-level XP + 50% of strike damage*: that, plus half of the damage the pupil's answer strikes took off the monster. Basic attacks don't count, and damage is what the strike actually removed (no overkill; the 1-HP "needs more correct answers" save isn't counted). Item/job XP bonuses and the gentle-start multiplier apply to the total.
- **Dungeon Dive:** the base XP from the kill is still shared equally; the strike-damage part is each pupil's own (50% of the damage their own strikes dealt). XP bonuses and the balanced-party bonus apply to each pupil's total.
- Stored as `xpMode` in the saved config (`'level'` | `'damage'`); older saved configs default to `'level'`. No database migration. 53 tests.

## What is new in v1.1.0 (Dungeon Dive balance, Game balance tab)
- **Scale monster HP with party size** toggle. Off: a monster has the same HP whatever the party size (the "extra player adds × HP" number is then ignored). On by default, as before.
- **Mid-bosses and bosses in Dungeon Dive** toggle, off by default. On: every 20th monster is a mid-boss and every 40th a boss (both numbers editable, 0 turns that kind off, a boss wins a clash). They use the solo mid-boss / boss HP, damage, rage and correct-answer settings, their own drop tables, and are picked by level like the floor leads. Pupils see ⭐ / 👑 labels and a "boss is coming" warning.
- **Dungeon Dive drop multiplier** (default ×1, 0 = no drops, max ×20). Each item's chance is capped at 10% first, then multiplied (never above 100%).
- 50 tests (6 new).

## Deploying
1. `npm install`, then `npm test` (44 tests).
2. `npx wrangler deploy`. The first deploy of v1.0.0 runs the Durable Object migration `v1` (`new_sqlite_classes: ["DiveParty"]`) automatically. Keep `wrangler.jsonc` and `wrangler.test.jsonc` as shipped.
3. Teacher console, Game balance tab, Dungeon Dive: tick **Turn on Dungeon Dive**. Until then pupils do not see the Dive card.

## Where things live
- `src/game.js` solo game, state builder, `visibleJobs()`; `src/dive.js` party mode and the `DiveParty` class; `src/gamedata.js` items, jobs, perks, balance defaults; `src/rules.js` the seven dialogue rules.
- `public/index.html` pupil app (single file); `public/teacher.js` teacher console.
