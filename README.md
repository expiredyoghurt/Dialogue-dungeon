
## v0.16.1 changes
- **Job tree is revealed step by step.** The server only sends the jobs a pupil owns plus the jobs they can unlock next (children of an owned job). Names, damage and perks of everything deeper never reach the browser (`visibleJobs()` in `src/game.js`). The teacher console still shows the full tree.
- **Instruction and scaffolding.** A Help dialog (How to play / Question types / The rules) opens from the login page, the village and mid-fight; a dismissible "New here?" card shows until it is first opened. Each question has a collapsible "Rules to remember" box, wrong answers show the specific rules broken (with coloured examples, as in Dialogue Dash), and the profile shows the pupil's three most-missed rules from `/api/me`.
