# Dialogue Dungeon v1.4.0

Arcade-RPG dialogue-writing practice on Cloudflare Workers + D1 + Durable Objects.

## What is in v1.0.0
v1.0.0 = v0.16.1 (hidden job tree, instruction and rules scaffolding) + v0.17 (Dungeon Dive co-op parties on Durable Objects).

- **Job tree is revealed step by step.** The server only sends the jobs a pupil owns plus the jobs they can unlock next (children of an owned job). Names, damage and perks of everything deeper never reach the browser (`visibleJobs()` in `src/game.js`). The teacher console still shows the full tree. In a Dungeon Dive lobby, teammates' current job names are sent so the party list reads properly (`jobName` in `src/dive.js`).
- **Instruction and scaffolding.** A Help dialog (How to play / Question types / The rules) opens from the login page, the village, solo fights and Dungeon Dive fights; a dismissible "New here?" card shows until it is first opened. Each question has a collapsible "Rules to remember" box, wrong answers show the specific rules broken (with coloured examples, as in Dialogue Dash), and the profile shows the pupil's three most-missed rules from `/api/me`. The How to play tab gains a Dungeon Dive step when a teacher has switched Dive on.
- **Dungeon Dive (co-op).** One `DiveParty` Durable Object per party (4-character code, up to 4 pupils). Off by default: a teacher turns it on under Game balance.

## What is new in v1.4.0 (The Hush: story mode)
A narrative that puts pupils in the world of Parley and gives them a reason to go down. They are apprentice Voice-bearers whose correctly written dialogue still rings true, and only true speech can hurt the Hollowed.
- **Ten acts, two scenes each** (about 80 words or fewer, P3 to P6 reading level, British spelling). The **Calling** plays in the village when a pupil reaches Level 10, 20 … 100 and points to the next boss floor. The **Reckoning** plays on the victory screen after the boss on Floor 10, 20 … 100 (the Act 10 Reckoning is a seal-or-mend choice, and both paths end with Mend). A **prologue** plays on a pupil's first visit so the premise is there from Level 1, and an **epilogue** after Floor 100 leaves the story open (a staircase to Floor 101, a letter from another silent village).
- **Order is protected.** A Reckoning needs both the cleared boss floor *and* the matching level, so it never plays before its Calling. A pupil who dives fast waits for the level; a pupil who levels without descending sees only Callings, each with a "reach Floor N" objective. If the Calling arrives after the boss is already beaten, both play together, with the Reckoning marked "looking back".
- **Mid-boss notes** on floors 5, 15 … 95 show as a found-note card on the victory screen.
- **Village "The Hush" card:** a "Voices restored" bar for Elder Wren and for Parley, the next objective, and the **📖 The story so far...** button. It lists every unlocked part by act and ends with "Continue through the dungeon to unlock more."
- **In-world rules:** the fight screen says steel alone can't finish a Hollowed creature (the must-answer rule); a defeat says "The Hush takes what you carry, never what you've learned"; respawn is "the Hollow knits itself shut behind you"; Dungeon Dive is a Chorus; Quip the lantern-sprite gives the hints. From Floor 60 the bosses show as Echoes ("Echo of the Mimic Emperor" …) and Floor 100 is **The Hushbinder** (still the Lich King sprite).
- **Teacher switch:** Game balance tab, "Story: The Hush". Off hides every scene, the card and the Echo names. Pupils' progress is kept while it is off.
- **No database migration.** What is unlocked is worked out from level and cleared floors. Which scenes a pupil has been shown is stored in their existing `floor_kills` JSON (`sty`). Scene text only leaves the server once unlocked (`POST /api/game/story`), like the job tree. 75 tests.
- **Pupil stats tab (beta testing):** teacher console, "Pupil stats". Lists every pupil (class, level, XP, HP, gold, job, floors cleared, kills, last seen), filter by class or search, CSV download. **Edit** changes level, XP, HP, gold, gold in pack, kills, floors cleared, shop level, active job and unlocked jobs, equipped gear and the bag, and can replay a pupil's story or reset them to a new player. Saving ends any fight in progress. Behind the normal teacher sign-in only (no second password). Code: `src/players.js`, routes `/api/t/players`. Edits are validated (XP below the level's need, jobs need their parent job, gear must fit the slot and job) and logged to the Worker log.
- **Files:** `src/story.js` (all the text, unlock rules, boss names), `public/story.js` (pupil screens), small hooks in `src/game.js`, `src/gamedata.js`, `public/index.html` and `public/teacher.js`.
- **To expand:** add an act to `ACTS` in `src/story.js` (level and floor are 10 × the act), raise `TOP_FLOOR`, and add notes to `NOTES`. Open threads: the Deep Verse (Floor 101+), other silent villages, the Hushbinder's origin, new classes or skills sent out by the mended Chorus, and Ilse and the Archivist's redemption.

## What is new in v1.3.0 (pupil feedback)
- **💬 Feedback button** for pupils in the village, in solo fights and in Dungeon Dive. A pupil picks Difficulty / Idea / Problem / Other, optionally rates the difficulty (too easy / about right / too hard) and writes up to 600 characters.
- **Teacher console, new Feedback tab:** newest first, filter by New / Done and by type, shows the pupil's name and class plus the context the server recorded (level, job, and floor and monster if they were mid-fight). Mark done / reopen, delete, or clear everything marked done. Difficulty ratings are totalled at the top.
- Limits: 5 notes per pupil per hour and 15 per day. Guests can send feedback too. Pupils can't see anyone else's feedback.
- New `feedback` table, created automatically on first use (also added to `game-schema.sql`), so **no migration step** is needed. `src/feedback.js` holds the code. 57 tests.

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
1. `npm install`, then `npm test` (75 tests).
2. `npx wrangler deploy`. The first deploy of v1.0.0 runs the Durable Object migration `v1` (`new_sqlite_classes: ["DiveParty"]`) automatically. Keep `wrangler.jsonc` and `wrangler.test.jsonc` as shipped.
3. Teacher console, Game balance tab, Dungeon Dive: tick **Turn on Dungeon Dive**. Until then pupils do not see the Dive card.

## Where things live
- `src/game.js` solo game, state builder, `visibleJobs()`; `src/dive.js` party mode and the `DiveParty` class; `src/gamedata.js` items, jobs, perks, balance defaults; `src/rules.js` the seven dialogue rules.
- `public/index.html` pupil app; `public/story.js` story screens (loaded by index.html); `src/story.js` story text and unlock rules; `public/teacher.js` teacher console.
