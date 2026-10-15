// Dialogue Dungeon game API. The server owns all combat state; the browser only displays it.
import { HttpError, json, readJson, int } from './util.js';
import * as pupil from './pupil.js';
import { TURN_MS, TOP_FLOOR, MAX_DROP, DEFAULT_CFG, cfgFrom, hpFor, floorInfo, need, maxHp, ITEMS, MOBS, JOBS, points, canUse, shopFor, stageOf, perksOf, mhOf, canEquip, PERKS, BASE, applyItems, RANGED } from './gamedata.js';

const rnd = (n) => Math.floor(Math.random() * n);
const shopLv = (pl) => Math.min(stageOf(JSON.parse(pl.jobs)), JSON.parse(pl.floor_kills || '{}').sl || 1);
const pick = (a) => a[rnd(a.length)];
// A floor is cleared when its monster count (rolled on first entry, stored as fk['n'+floor]) has been defeated.
const cleared = (fk, n) => fk['n' + n] != null && (fk[n] || 0) >= fk['n' + n];
const needFor = (n, cfg) => {
  const b = cfg.floors.find((x) => n <= x.upTo) || cfg.floors[cfg.floors.length - 1];
  return b.min + rnd(b.max - b.min + 1);
};
const db = (env) => env.DB;

async function getPlayer(env, p) {
  await db(env).prepare('INSERT OR IGNORE INTO g_player (pupil_id) VALUES (?1)').bind(p.id).run();
  return db(env).prepare('SELECT * FROM g_player WHERE pupil_id = ?1').bind(p.id).first();
}
const save = (env, pl) =>
  db(env)
    .prepare('UPDATE g_player SET level=?2,xp=?3,hp=?4,gold=?5,run_gold=?6,weapon=?7,armor=?8,acc=?9,floor_kills=?10,kills=?11,job=?12,jobs=?13,potion=?14,auto=?15 WHERE pupil_id=?1')
    .bind(pl.pupil_id, pl.level, pl.xp, pl.hp, pl.gold, pl.run_gold, pl.weapon, pl.armor, pl.acc, pl.floor_kills, pl.kills, pl.job, pl.jobs, pl.potion, pl.auto)
    .run();
async function inv(env, id) {
  const rows = (await db(env).prepare('SELECT item, qty FROM g_inv WHERE pupil_id = ?1 AND qty > 0').bind(id).all()).results || [];
  return Object.fromEntries(rows.map((r) => [r.item, r.qty]));
}
const addItem = (env, id, item, d = 1) =>
  db(env).prepare('INSERT INTO g_inv (pupil_id, item, qty) VALUES (?1, ?2, ?3) ON CONFLICT(pupil_id, item) DO UPDATE SET qty = qty + ?3').bind(id, item, d).run();
const gear = (pl, cfg) => {
  const own = (id) => (ITEMS[id] && canEquip(ITEMS[id], pl.job) ? ITEMS[id] : {});
  const w = own(pl.weapon), a = own(pl.armor), c = own(pl.acc), P = perksOf(pl.job, cfg);
  return { atk: (JOBS[pl.job]?.d || 1) + (w.atk || 0), def: (a.def || 0) + (P.dr || 0), gold: (c.gold || 0) + (P.gold || 0), xp: (c.xp || 0) + (P.xp || 0), heal: c.heal || 0, ip: Math.round((cfg.speed.turn * 1000) / (1 + Math.min(cfg.speed.cap, Math.max(-0.5, (w.spd || 0) + (c.spd || 0) + (P.spd || 0))))), P };
};
// perk damage multiplier: rage below half HP, extra damage against mid-bosses and bosses
const dmgMult = (pl, f, P, cfg) => 1 + (pl.hp < mhOf(pl, cfg) / 2 ? P.rage || 0 : 0) + (MOBS[f.mob] && MOBS[f.mob].kind ? P.boss || 0 : 0);

export async function getCfg(env) {
  const r = await db(env).prepare("SELECT v FROM g_config WHERE k = 'cfg'").first();
  const cfg = cfgFrom(r ? JSON.parse(r.v) : null);
  applyItems(cfg); // item prices and stats come from the game balance tab
  return cfg;
}

export async function configView(env) {
  const cfg = await getCfg(env);
  return json({ cfg, items: ITEMS, mobs: MOBS, perkDefs: PERKS, jobs: JOBS, preview: [1, 5, 10, 20, 50, 100].map((l) => [l, hpFor(l, cfg)]) });
}

export async function configSave(request, env) {
  const b = await readJson(request);
  const n = (v, lo, hi, d) => ((v = Number(v)), Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
  const tiers = (Array.isArray(b.hp?.tiers) ? b.hp.tiers : []).map((t) => ({ upTo: Math.round(n(t.upTo, 0, 1000, 0)), per: Math.round(n(t.per, 0, 1000, 0)) })).filter((t) => t.upTo >= 1).sort((a, c) => a.upTo - c.upTo);
  if (!tiers.length) throw new HttpError(400, 'Add at least one HP tier.');
  const floors = (Array.isArray(b.floors) ? b.floors : []).map((x) => { const mn = Math.round(n(x.min, 1, 200, 1)); return { upTo: Math.round(n(x.upTo, 0, 1000, 0)), min: mn, max: Math.max(mn, Math.round(n(x.max, 1, 200, mn))) }; }).filter((x) => x.upTo >= 1).sort((a, c) => a.upTo - c.upTo);
  if (!floors.length) throw new HttpError(400, 'Add at least one floor range.');
  const D = DEFAULT_CFG.def;
  const out = { hp: { base: Math.round(n(b.hp?.base, 1, 100000, 5)), tiers }, floors, def: { goldMin: n(b.def?.goldMin, 0, 1000, D.goldMin), goldMax: n(b.def?.goldMax, 0, 1000, D.goldMax), xp: n(b.def?.xp, 0, 1000, D.xp), dmg: n(b.def?.dmg, 0, 10, D.dmg) }, mobs: {} };
  out.def.goldMax = Math.max(out.def.goldMax, out.def.goldMin);
  const B = DEFAULT_CFG.boss;
  out.boss = { midHp: n(b.boss?.midHp, 1, 100, B.midHp), midDmg: n(b.boss?.midDmg, 0, 20, B.midDmg), bossHp: n(b.boss?.bossHp, 1, 100, B.bossHp), bossDmg: n(b.boss?.bossDmg, 0, 20, B.bossDmg), rageDmg: n(b.boss?.rageDmg, 0, 20, B.rageDmg), lo: n(b.boss?.lo, 0, 10, B.lo), hi: n(b.boss?.hi, 0, 10, B.hi) };
  out.boss.hi = Math.max(out.boss.hi, out.boss.lo);
  out.shopCost = [0, 1, 2].map((i) => Math.round(n(b.shopCost && b.shopCost[i], 0, 1e7, DEFAULT_CFG.shopCost[i])));
  const S0 = DEFAULT_CFG.speed, turn = n(b.speed?.turn, 2, 120, S0.turn);
  out.speed = { turn, offset: n(b.speed?.offset, 0, turn - 1, S0.offset), ranged: n(b.speed?.ranged, 0, 60, S0.ranged), cap: n(b.speed?.cap, 0, 5, S0.cap), monster: n(b.speed?.monster, -0.5, 5, S0.monster) };
  out.perks = {};
  for (const id of Object.keys(JOBS)) {
    const o = {};
    for (const [k] of PERKS) { const v = Number((b.perks && b.perks[id] || {})[k]); if (v > 0) o[k] = Math.min(v, 100); }
    if (Object.keys(o).length) out.perks[id] = o;
  }
  for (const id of Object.keys(MOBS)) {
    const m = (b.mobs && b.mobs[id]) || {}, o = { drops: {} };
    for (const k of ['goldMin', 'goldMax', 'xp']) if (m[k] != null) o[k] = n(m[k], 0, 1000, 0);
    for (const [item, r] of Object.entries(m.drops || {})) if (ITEMS[item] && Number(r) > 0) o.drops[item] = Math.min(MAX_DROP, n(r, 0, 1, 0));
    out.mobs[id] = o;
  }
  out.items = {};
  const LIM = { st: [1, 4], price: [0, 1e7], atk: [0, 1000], def: [0, 1000], gold: [0, 100], xp: [0, 100], heal: [0, 1000], spd: [-1, 5] };
  for (const [id, base] of Object.entries(BASE)) {
    const o = {}, v0 = (b.items && b.items[id]) || {};
    for (const [k, [lo, hi]] of Object.entries(LIM)) {
      if (base[k] == null || v0[k] == null || !Number.isFinite(Number(v0[k]))) continue;
      const x = k === 'gold' || k === 'xp' || k === 'spd' ? n(v0[k], lo, hi, base[k]) : Math.round(n(v0[k], lo, hi, base[k]));
      if (x !== base[k]) o[k] = x;
    }
    if (Object.keys(o).length) out.items[id] = o;
  }
  await db(env).prepare("INSERT INTO g_config (k, v) VALUES ('cfg', ?1) ON CONFLICT(k) DO UPDATE SET v = ?1").bind(JSON.stringify(out)).run();
  return json({ ok: true });
}

// Which question modes a floor may use: floors 1-10 mode 1; 11-50 modes 1-2; 51-100 modes 1-3.
// Each floor tracks (fk['m'+floor], a bitmask) which modes it has served, and leans harder toward the missing ones
// as the floor runs out of monsters, so every allowed mode shows up at least once per floor.
const modesFor = (floor) => (floor <= 10 ? [1] : floor <= 50 ? [1, 2] : [1, 2, 3]);
async function nextQuestion(env, p, exclude, floor, pl) {
  const allowed = modesFor(floor);
  const fk = JSON.parse(pl.floor_kills || '{}');
  const seen = fk['m' + floor] || 0, need = fk['n' + floor], done = fk[floor] || 0;
  const missing = allowed.filter((m) => !(seen & (1 << m)));
  const farming = need != null && done >= need;
  let modes = allowed;
  if (missing.length && !farming && (done >= (need || 1) - 1 || Math.random() < Math.max(0.35, (done + 1) / (need || 1)))) modes = missing;
  const v = pupil.visibleSql(p);
  for (const mode of [pick(modes), ...allowed]) {
    const rows = (await db(env).prepare(`SELECT id, mode, data FROM questions WHERE ${v.where} AND mode = ${mode} ORDER BY RANDOM() LIMIT 10`).bind(...v.binds).all()).results || [];
    for (const q of rows) {
      if (q.id === exclude && rows.length > 1) continue;
      const payload = pupil.payloadFor(q.mode, JSON.parse(q.data));
      if (!payload) continue;
      fk['m' + floor] = seen | (1 << mode);
      pl.floor_kills = JSON.stringify(fk);
      await save(env, pl);
      return { id: q.id, mode: q.mode, p: payload };
    }
  }
  return null;
}

// Plays out, in time order, every hit that has come due since the last visit. Pupil and monster each have their own
// attack timer (p_next / m_next), so attack speed, ranged first strikes and the monster's earlier first attack all fall out of it.
// The hits are returned too, so the browser can animate them one by one.
export function sim(pl, f, cfg, pot, now) {
  const g = gear(pl, cfg), kind = MOBS[f.mob] && MOBS[f.mob].kind, b = cfg.boss, ev = [], mh = mhOf(pl, cfg);
  const im = (cfg.speed.turn * 1000) / (1 + cfg.speed.monster), floorT = now - 3 * cfg.speed.turn * 1000; // an idle tab only owes ~3 turns
  f.p_next = Math.max(f.p_next, floorT);
  f.m_next = Math.max(f.m_next, floorT);
  for (let i = 0; i < 60; i++) {
    const who = f.p_next <= f.m_next ? 'p' : 'm', t = who === 'p' ? f.p_next : f.m_next;
    if (t > now) break;
    if (who === 'p') {
      const pmax = Math.max(1, Math.round(g.atk * dmgMult(pl, f, g.P, cfg)));
      let d = 1 + rnd(pmax), x = 0; // a random 1 to the pupil's maximum
      if (g.P.dbl && Math.random() < g.P.dbl) { d *= 2; x = 1; } // assassin: double damage on regular attacks
      f.mob_hp -= d;
      ev.push({ t, who, d, x, mh: Math.max(0, f.mob_hp), ph: pl.hp });
      if (f.mob_hp <= 0) return { res: 'win', ev };
      f.p_next += g.ip;
    } else {
      const mult = kind === 'mid' ? b.midDmg : kind === 'boss' ? (f.mob_hp < f.mob_max * 0.5 ? b.rageDmg : b.bossDmg) : 1;
      const fk = JSON.parse(pl.floor_kills || '{}');
      let d = 0;
      if (fk.sk > 0) {
        fk.sk--; // archer perk: the monster's first hit(s) in a fight are skipped
        pl.floor_kills = JSON.stringify(fk);
      } else {
        const mmax = Math.ceil(f.level * cfg.def.dmg * mult);
        const roll = kind ? Math.round(mmax * (b.lo + Math.random() * (b.hi - b.lo))) : 1 + rnd(Math.max(1, mmax));
        d = Math.max(1, roll - g.def);
        pl.hp -= d;
      }
      ev.push({ t, who, d, mh: f.mob_hp, ph: Math.max(0, pl.hp) });
      if (pl.hp <= 0) return { res: 'lose', ev };
      if (pl.auto && pot.qty > 0 && pl.hp * 10 < mh * 3) {
        const h = Math.min(mh, pl.hp + pot.heal) - pl.hp;
        pl.hp += h; pot.qty--; pot.used++;
        ev.push({ t, who: 'pot', d: h, mh: f.mob_hp, ph: pl.hp });
      }
      f.m_next += im;
    }
  }
  return { res: null, ev };
}

async function finish(env, p, pl, f, res) {
  const cfg = await getCfg(env);
  await db(env).prepare('DELETE FROM g_fight WHERE pupil_id = ?1').bind(p.id).run();
  if (res === 'lose') {
    const lost = pl.run_gold;
    pl.run_gold = 0;
    pl.hp = mhOf(pl, cfg);
    await save(env, pl);
    return { result: 'lose', lost, floor: f.floor };
  }
  const g = gear(pl, cfg);
  const out = { result: 'win', floor: f.floor, levelUps: 0 };
  const mc = cfg.mobs[f.mob] || {}, d = { ...cfg.def, ...mc };
  const lo = d.goldMin * f.level, hi = Math.max(lo, d.goldMax * f.level);
  out.gold = Math.max(1, Math.round((lo + Math.random() * (hi - lo)) * (1 + g.gold)));
  out.xp = Math.round(d.xp * f.level * (1 + g.xp));
  pl.run_gold += out.gold;
  pl.xp += out.xp;
  pl.kills++;
  while (pl.xp >= need(pl.level)) {
    pl.xp -= need(pl.level);
    pl.level++;
    pl.hp++;
    out.levelUps++;
  }
  pl.hp = Math.min(mhOf(pl, cfg), pl.hp + g.heal);
  const fk = JSON.parse(pl.floor_kills || '{}');
  fk[f.floor] = (fk[f.floor] || 0) + 1;
  if (fk['n' + f.floor] != null && fk[f.floor] === fk['n' + f.floor]) out.stairs = f.floor;
  pl.floor_kills = JSON.stringify(fk);
  out.drops = [];
  const have = await inv(env, p.id);
  for (const [id, rate] of Object.entries(mc.drops || {})) {
    const it = ITEMS[id];
    if (!it || Math.random() >= Math.min(rate, MAX_DROP)) continue;
    if (it.slot !== 'use' && have[id]) {
      const v = Math.floor(it.price / 2);
      pl.run_gold += v;
      out.drops.push({ id, dup: v });
    } else {
      await addItem(env, p.id, id);
      have[id] = 1;
      out.drops.push({ id });
    }
  }
  await save(env, pl);
  return out;
}

async function load(env, p) {
  const pl = await getPlayer(env, p);
  let f = await db(env).prepare('SELECT * FROM g_fight WHERE pupil_id = ?1').bind(p.id).first();
  let ended = null, events = [];
  if (f) {
    const cfg = await getCfg(env), now = Date.now();
    if (!f.p_next) { // fight created before the attack timers existed
      f.p_next = now + gear(pl, cfg).ip;
      f.m_next = now + cfg.speed.turn * 1000 - cfg.speed.offset * 1000;
      await db(env).prepare('UPDATE g_fight SET p_next = ?2, m_next = ?3 WHERE pupil_id = ?1').bind(p.id, f.p_next, f.m_next).run();
    }
    if (Math.min(f.p_next, f.m_next) <= now) {
      const it = ITEMS[pl.potion];
      const pot = { qty: it ? (await inv(env, p.id))[pl.potion] || 0 : 0, heal: it ? Math.round(it.heal * (1 + (perksOf(pl.job, cfg).potion || 0))) : 0, used: 0 };
      const r = sim(pl, f, cfg, pot, now);
      events = r.ev;
      if (pot.used) await addItem(env, p.id, pl.potion, -pot.used);
      if (r.res) {
        ended = await finish(env, p, pl, f, r.res);
        ended.potions = pot.used;
        f = null;
      } else {
        await save(env, pl);
        await db(env).prepare('UPDATE g_fight SET mob_hp = ?2, p_next = ?3, m_next = ?4 WHERE pupil_id = ?1').bind(p.id, f.mob_hp, Math.round(f.p_next), Math.round(f.m_next)).run();
      }
    }
  }
  return { pl, f, ended, events };
}

async function view(env, p, extra = {}) {
  const pl = await getPlayer(env, p);
  const f = await db(env).prepare('SELECT * FROM g_fight WHERE pupil_id = ?1').bind(p.id).first();
  const cfg = await getCfg(env);
  const g = gear(pl, cfg);
  const fk = JSON.parse(pl.floor_kills || '{}');
  let top = 1;
  while (top < TOP_FLOOR && cleared(fk, top)) top++;
  let fight = null;
  if (f) {
    let q = null;
    const row = await db(env).prepare('SELECT id, mode, data FROM questions WHERE id = ?1 AND active = 1').bind(f.qid).first();
    if (row) {
      const payload = pupil.payloadFor(row.mode, JSON.parse(row.data));
      if (payload) q = { id: row.id, mode: row.mode, p: payload };
    }
    if (!q) {
      q = await nextQuestion(env, p, f.qid, f.floor, pl);
      if (q) await db(env).prepare('UPDATE g_fight SET qid = ?2 WHERE pupil_id = ?1').bind(p.id, q.id).run();
    }
    const m = MOBS[f.mob] || MOBS.slime; // (fights saved before the monster change fall back to a slime)
    fight = { name: m.n, e: m.e, img: m.img || null, level: f.level, mobHp: f.mob_hp, mobMax: f.mob_max, floor: f.floor, kind: m.kind || null, rage: m.kind === 'boss' && f.mob_hp < f.mob_max * 0.5, kills: fk[f.floor] || 0, need: fk['n' + f.floor], pNext: f.p_next, mNext: f.m_next, ip: g.ip, im: Math.round((cfg.speed.turn * 1000) / (1 + cfg.speed.monster)), ranged: RANGED.has(pl.job), now: Date.now(), q };
  }
  return json({
    me: { name: p.name, level: pl.level, xp: pl.xp, need: need(pl.level), hp: pl.hp, maxHp: mhOf(pl, cfg), gold: pl.gold, runGold: pl.run_gold, weapon: pl.weapon, armor: pl.armor, acc: pl.acc, kills: pl.kills, atk: g.atk, def: g.def, job: pl.job, jobs: JSON.parse(pl.jobs), free: points(pl.level) - (JSON.parse(pl.jobs).length - 1), potion: pl.potion, auto: pl.auto, base: JOBS[pl.job].d, perks: g.P, stage: shopLv(pl), stageMax: stageOf(JSON.parse(pl.jobs)) },
    inv: await inv(env, p.id),
    floors: { max: top, kills: fk, total: TOP_FLOOR },
    items: ITEMS,
    jobTree: JOBS,
    perkDefs: PERKS,
    jobPerks: cfg.perks,
    shop: shopFor(JSON.parse(pl.jobs), shopLv(pl)),
    shopCost: cfg.shopCost,
    fight,
    ...extra,
  });
}

async function start(env, p, pl, f, body) {
  if (f) return;
  const n = int(body.floor, 1);
  const fl = n >= 1 && n <= TOP_FLOOR ? floorInfo(n) : null;
  const fk = JSON.parse(pl.floor_kills || '{}');
  if (!fl || (n > 1 && !cleared(fk, n - 1))) throw new HttpError(403, 'That floor is still locked.');
  const cfg = await getCfg(env);
  if (fk['n' + n] == null) {
    fk['n' + n] = needFor(n, cfg);
    pl.floor_kills = JSON.stringify(fk);
    await save(env, pl);
  }
  const last = (fl.boss || fl.mid) && (fk[n] || 0) === fk['n' + n] - 1; // the last monster of every 5th (mid-boss) and 10th (boss) floor
  const mob = last ? fl.lead : pick(fl.mobs);
  const lv = last ? n : 1 + rnd(n);
  const hp = Math.round(hpFor(lv, cfg) * ({ mid: cfg.boss.midHp, boss: cfg.boss.bossHp }[MOBS[mob].kind] || 1));
  fk.fs = 0; // per-fight perk counters: first-strike used, monster hits left to skip
  fk.sk = perksOf(pl.job, cfg).skip || 0;
  pl.floor_kills = JSON.stringify(fk);
  const now = Date.now(); // ranged classes strike first, a few seconds in; the monster's first attack comes a little before a normal one
  const pn = Math.round(RANGED.has(pl.job) ? now + cfg.speed.ranged * 1000 : now + gear(pl, cfg).ip);
  const mn = Math.round(now + (cfg.speed.turn * 1000) / (1 + cfg.speed.monster) - cfg.speed.offset * 1000);
  const q = await nextQuestion(env, p, 0, n, pl);
  if (!q) throw new HttpError(503, 'There are no questions yet. Ask your teacher to add some.');
  await db(env)
    .prepare('INSERT INTO g_fight (pupil_id, mob, level, mob_hp, mob_max, floor, last_tick, qid, p_next, m_next) VALUES (?1,?2,?3,?4,?4,?5,?6,?7,?8,?9)')
    .bind(p.id, mob, lv, hp, n, now, q.id, pn, mn)
    .run();
}

// Back to the village: the pack's gold is banked and HP is restored.
async function leave(env, p, pl, f) {
  const cfg = await getCfg(env);
  if (f) await db(env).prepare('DELETE FROM g_fight WHERE pupil_id = ?1').bind(p.id).run();
  pl.gold += pl.run_gold;
  pl.run_gold = 0;
  pl.hp = mhOf(pl, cfg);
  await save(env, pl);
}

async function buy(env, p, pl, f, body) {
  if (f) throw new HttpError(409, 'Return to the village first.');
  const it = ITEMS[body.item];
  if (!it || !shopFor(JSON.parse(pl.jobs), shopLv(pl)).includes(body.item)) throw new HttpError(400, 'The shop doesn’t sell that yet.');
  if (pl.gold < it.price) throw new HttpError(400, 'Not enough gold.');
  const have = await inv(env, p.id);
  if (it.slot !== 'use' && have[body.item]) throw new HttpError(400, 'You already own that.');
  if (it.slot === 'use' && (have[body.item] || 0) >= 9) throw new HttpError(400, 'You can’t carry any more of those.');
  pl.gold -= it.price;
  await save(env, pl);
  await addItem(env, p.id, body.item);
}

async function upgrade(env, pl, f) {
  if (f) throw new HttpError(409, 'Return to the village first.');
  const fk = JSON.parse(pl.floor_kills || '{}'), lv = shopLv(pl), cfg = await getCfg(env);
  if (lv >= 4) throw new HttpError(400, 'The shop is fully upgraded.');
  if (lv >= stageOf(JSON.parse(pl.jobs))) throw new HttpError(400, 'Unlock a higher job first.');
  const cost = cfg.shopCost[lv - 1];
  if (pl.gold < cost) throw new HttpError(400, 'Not enough gold.');
  pl.gold -= cost;
  fk.sl = lv + 1;
  pl.floor_kills = JSON.stringify(fk);
  await save(env, pl);
}

async function slot(env, p, pl, f, body) {
  if (f) throw new HttpError(409, 'Return to the village first.');
  const s = body.slot;
  if (!['weapon', 'armor', 'acc', 'potion'].includes(s)) throw new HttpError(400, 'Unknown slot.');
  if (body.item) {
    const it = ITEMS[body.item];
    if (!it || it.slot !== (s === 'potion' ? 'use' : s) || !(await inv(env, p.id))[body.item]) throw new HttpError(400, 'You don’t have that.');
    if (!canEquip(it, pl.job)) throw new HttpError(400, 'Your current job can’t use that.');
  }
  pl[s] = body.item || null;
  await save(env, pl);
}

async function jobAct(env, pl, f, a, body) {
  if (f) throw new HttpError(409, 'Return to the village first.');
  const js = JSON.parse(pl.jobs);
  const j = JOBS[body.job];
  if (!j) throw new HttpError(400, 'Unknown job.');
  if (a === 'job') {
    if (!js.includes(body.job)) throw new HttpError(400, 'You haven’t unlocked that job.');
  } else {
    if (js.includes(body.job) || !js.includes(j.p)) throw new HttpError(400, 'That job isn’t available yet.');
    if (points(pl.level) - (js.length - 1) < 1) throw new HttpError(400, 'You have no job point to spend yet.');
    js.push(body.job);
    pl.jobs = JSON.stringify(js);
  }
  pl.job = body.job;
  await save(env, pl);
}

async function use(env, p, pl, body) {
  const cfg = await getCfg(env);
  const it = ITEMS[body.item];
  if (!it || it.slot !== 'use' || !(await inv(env, p.id))[body.item]) throw new HttpError(400, 'You don’t have that.');
  pl.hp = Math.min(mhOf(pl, cfg), pl.hp + Math.round(it.heal * (1 + (perksOf(pl.job, cfg).potion || 0))));
  await save(env, pl);
  await addItem(env, p.id, body.item, -1);
}

async function answer(request, env, p, pl, f, body, events) {
  if (!f || int(body.qid, 0) !== f.qid) throw new HttpError(409, 'That question belongs to a monster that is gone.');
  const r = await (await pupil.answer(new Request(request.url, { method: 'POST', body: JSON.stringify(body) }), env, p)).json();
  const done = r.phase === 2 || (r.phase === undefined && (r.correct || r.final));
  if (!done) return view(env, p, { answer: r, done: false, events });
  const extra = { answer: r, done: true, events };
  let res = null;
  const cfg = await getCfg(env);
  if (r.correct) {
    const g = gear(pl, cfg), P = g.P, fk = JSON.parse(pl.floor_kills || '{}');
    let bonus = (3 + (P.mult || 0)) * g.atk * dmgMult(pl, f, P, cfg);
    if (P.first && !fk.fs) bonus *= P.first; // first correct answer of the fight
    if (Math.random() < (P.crit || 0)) { bonus *= 2; extra.crit = 1; } // double strike
    fk.fs = 1;
    pl.floor_kills = JSON.stringify(fk);
    extra.bonus = Math.round(bonus);
    f.mob_hp -= extra.bonus;
    pl.hp = Math.min(mhOf(pl, cfg), pl.hp + Math.round(P.heal || 0));
    if (f.mob_hp <= 0) res = 'win';
  }
  if (res) extra.ended = await finish(env, p, pl, f, res);
  else {
    await save(env, pl);
    const q = await nextQuestion(env, p, f.qid, f.floor, pl);
    await db(env).prepare('UPDATE g_fight SET mob_hp = ?2, qid = ?3 WHERE pupil_id = ?1').bind(p.id, f.mob_hp, q ? q.id : f.qid).run();
  }
  return view(env, p, extra);
}

export async function route(request, env, p, path, m) {
  const a = path.slice('/api/game/'.length);
  if (!['state', 'sync', 'start', 'answer', 'buy', 'slot', 'job', 'unlock', 'auto', 'use', 'upgrade', 'leave'].includes(a)) throw new HttpError(404, 'Not found.');
  if ((a === 'state') !== (m === 'GET')) throw new HttpError(405, 'Wrong method.');
  const body = m === 'POST' ? await readJson(request) : {};
  await getCfg(env);
  const { pl, f, ended, events } = await load(env, p);
  if (ended && a !== 'leave') return view(env, p, { ended, events });
  switch (a) {
    case 'state': if (!f && pl.run_gold > 0) await leave(env, p, pl, null); break;
    case 'start': await start(env, p, pl, f, body); break;
    case 'leave': await leave(env, p, pl, f); break;
    case 'buy': await buy(env, p, pl, f, body); break;
    case 'slot': await slot(env, p, pl, f, body); break;
    case 'job': case 'unlock': await jobAct(env, pl, f, a, body); break;
    case 'upgrade': await upgrade(env, pl, f); break;
    case 'auto': pl.auto = body.on ? 1 : 0; await save(env, pl); break;
    case 'use': await use(env, p, pl, body); break;
    case 'answer': return answer(request, env, p, pl, f, body, events);
  }
  return view(env, p, { events });
}
