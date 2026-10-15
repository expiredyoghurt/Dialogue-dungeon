// Dialogue Dungeon: tunable game data. Change numbers here, nowhere else.
export const TURN_MS = 15000;
export const need = (lv) => (lv <= 10 ? 10 : 10 + 5 * (lv - 10)); // XP to leave level lv
export const maxHp = (lv) => 10 + (lv - 1);

// slot: weapon | armor | acc | use.  atk = extra base damage, def = damage blocked per hit (min 1 taken),
// gold / xp = bonus fraction, heal = HP (potions) or HP after each win (charm). tier = first floor it can drop on.
export const ITEMS = {
  stick: { n: 'Sharpened Stick', e: '🪵', slot: 'weapon', atk: 1, price: 10, st: 1 },
  dagger: { n: 'Rusty Dagger', e: '🗡️', slot: 'weapon', atk: 2, price: 30, st: 1 },
  club: { n: 'Wooden Club', e: '🏏', slot: 'weapon', atk: 3, price: 80, st: 2 },
  handaxe: { n: 'Hand Axe', e: '🔨', slot: 'weapon', atk: 4, price: 150, st: 2 },
  sword: { n: 'Iron Sword', e: '⚔️', slot: 'weapon', atk: 5, price: 260, st: 2 },
  blade: { n: 'Steel Blade', e: '🔪', slot: 'weapon', atk: 7, price: 450, st: 3 },
  tunic: { n: 'Padded Tunic', e: '👕', slot: 'armor', def: 1, price: 15, st: 1 },
  vest: { n: 'Leather Vest', e: '🦺', slot: 'armor', def: 2, price: 45, st: 1 },
  studded: { n: 'Studded Leather', e: '🥼', slot: 'armor', def: 3, price: 120, st: 2 },
  mail: { n: 'Chain Mail', e: '⛓️', slot: 'armor', def: 4, price: 240, st: 2 },
  plate: { n: 'Plate Armour', e: '🛡️', slot: 'armor', def: 6, price: 500, st: 3 },
  locket: { n: 'Silver Locket', e: '📿', slot: 'acc', gold: 0.1, price: 40, st: 1 },
  coin: { n: 'Lucky Coin', e: '🪙', slot: 'acc', gold: 0.25, price: 80, st: 2 },
  ring: { n: 'Scholar’s Ring', e: '💍', slot: 'acc', xp: 0.2, price: 100, st: 2 },
  charm: { n: 'Healer’s Charm', e: '🧿', slot: 'acc', heal: 1, price: 90, st: 2 },
  amulet: { n: 'Sage’s Amulet', e: '📜', slot: 'acc', xp: 0.4, price: 600, st: 3 },
  signet: { n: 'Gold Signet', e: '💰', slot: 'acc', gold: 0.5, price: 700, st: 3 },
  band: { n: 'Regen Band', e: '🩹', slot: 'acc', heal: 3, price: 800, st: 3 },
  crown: { n: 'Crown of Fortune', e: '👑', slot: 'acc', gold: 1, price: 4000, st: 4 },
  scrown: { n: 'Scholar’s Crown', e: '🎓', slot: 'acc', xp: 0.8, price: 4000, st: 4 },
  pendant: { n: 'Phoenix Pendant', e: '🔥', slot: 'acc', heal: 8, price: 3500, st: 4 },
  minor: { n: 'Minor Potion', e: '💧', slot: 'use', heal: 2, price: 8, st: 1 },
  potion: { n: 'Health Potion', e: '🧪', slot: 'use', heal: 5, price: 15, st: 1 },
  bigpotion: { n: 'Big Potion', e: '⚗️', slot: 'use', heal: 12, price: 40, st: 2 },
  greater: { n: 'Greater Potion', e: '🍶', slot: 'use', heal: 20, price: 70, st: 3 },
  elixir: { n: 'Elixir', e: '🍷', slot: 'use', heal: 40, price: 150, st: 4 },
  phoenix: { n: 'Phoenix Draught', e: '🌟', slot: 'use', heal: 120, price: 450, st: 4 },
};
// Class-line gear: [id, name, emoji, attack or defence, price, shop level]. Only the Fighter / Archer / Acolyte lines can use their own.
const ladder = (fam, slot, rows) => rows.forEach(([id, n, e, v, price, st]) => (ITEMS[id] = { n, e, slot, [slot === 'weapon' ? 'atk' : 'def']: v, price, st, fam }));
ladder('fighter', 'weapon', [['axe', 'Battle Axe', '🪓', 8, 600, 3], ['greataxe', 'Great Axe', '⚒️', 10, 1000, 3], ['waraxe', 'War Axe', '🪓', 13, 1800, 4], ['ruinaxe', 'Ruinbringer Axe', '⚔️', 17, 4500, 4], ['titanaxe', 'Titan’s Cleaver', '🔱', 22, 10000, 4]]);
ladder('fighter', 'armor', [['brigand', 'Brigandine', '🥋', 7, 550, 3], ['banded', 'Banded Mail', '⛓️', 9, 900, 3], ['fullplate', 'Knight’s Plate', '🏰', 12, 1700, 4], ['dragonplate', 'Dragonscale Plate', '🐉', 18, 4200, 4], ['titanplate', 'Titan Plate', '🛡️', 25, 9500, 4]]);
ladder('archer', 'weapon', [['bow', 'Hunter’s Bow', '🏹', 8, 600, 3], ['recurve', 'Recurve Bow', '🎯', 10, 1000, 3], ['longbow', 'Longbow', '🏹', 13, 1800, 4], ['windbow', 'Windpiercer', '🌬️', 17, 4500, 4], ['starbow', 'Starfall Bow', '🌠', 22, 10000, 4]]);
ladder('archer', 'armor', [['leathers', 'Hunter’s Leathers', '🧥', 6, 450, 3], ['jerkin', 'Scout Jerkin', '🦺', 8, 800, 3], ['cloak', 'Shadow Cloak', '🌑', 11, 1500, 4], ['mantle', 'Phantom Mantle', '👻', 16, 3800, 4], ['nightcloak', 'Nightwind Cloak', '🌌', 22, 9000, 4]]);
ladder('acolyte', 'weapon', [['staff', 'Oak Staff', '🪄', 8, 600, 3], ['crystal', 'Crystal Staff', '💎', 10, 1000, 3], ['arcstaff', 'Arcane Staff', '🔱', 13, 1800, 4], ['elderstaff', 'Elder Staff', '🌳', 17, 4500, 4], ['agestaff', 'Staff of Ages', '⏳', 22, 10000, 4]]);
ladder('acolyte', 'armor', [['robe', 'Scholar’s Robe', '👘', 6, 450, 3], ['warded', 'Warded Robe', '🧿', 8, 800, 3], ['archrobe', 'Archmage Robe', '🥻', 11, 1500, 4], ['runed', 'Runed Vestments', '📜', 16, 3800, 4], ['agerobe', 'Robe of Ages', '✨', 22, 9000, 4]]);
Object.assign(ITEMS.dagger, { spd: 0.1 });
ITEMS.greataxe.spd = -0.1; ITEMS.ruinaxe.spd = -0.1; ITEMS.titanaxe.spd = -0.15;
ITEMS.swiftring = { n: 'Swift Ring', e: '💨', slot: 'acc', spd: 0.15, price: 350, st: 2 };
ITEMS.zephyr = { n: 'Zephyr Band', e: '🌪️', slot: 'acc', spd: 0.3, price: 3000, st: 4 };
for (const it of Object.values(ITEMS)) if ((it.slot === 'weapon' || it.slot === 'acc') && it.spd == null) it.spd = 0; // attack speed bonus (negative = slower)
// Classes that fight from range: they strike first, a few seconds into the fight.
export const RANGED = new Set(['archer', 'horsearcher', 'longbowman', 'ranger', 'bowknight', 'sniper', 'assassin', 'acolyte', 'mage', 'battlemage', 'elementalmage']);
// Defaults of every item. The game balance tab stores only the values a teacher changed (cfg.items) and applyItems lays them over these.
export const BASE = JSON.parse(JSON.stringify(ITEMS));
export function applyItems(cfg) {
  for (const id of Object.keys(BASE)) ITEMS[id] = { ...BASE[id], ...((cfg.items && cfg.items[id]) || {}) };
}
// Monster art: public/m/<img>.png (16-bit pixel sprites). Regular monsters are drawn from the floor bands below; dragon is the mid-boss, knight the boss.
export const MOBS = {
  slime: { n: 'Green Slime', img: 'slime', e: '👾' },
  bat: { n: 'Cave Bat', img: 'bat', e: '👾' },
  skeleton: { n: 'Skeleton Guard', img: 'skeleton', e: '👾' },
  spider: { n: 'Giant Spider', img: 'spider', e: '👾' },
  goblin: { n: 'Goblin Raider', img: 'goblin', e: '👾' },
  goblinscout: { n: 'Goblin Scout', img: 'goblinscout', e: '👾' },
  eye: { n: 'Floating Eye', img: 'eye', e: '👾' },
  golem: { n: 'Stone Golem', img: 'golem', e: '👾' },
  hydra: { n: 'Baby Hydra', img: 'hydra', e: '👾' },
  mimic: { n: 'Mimic Chest', img: 'mimic', e: '👾' },
  ghost: { n: 'Ghost', img: 'ghost', e: '👾' },
  wraith: { n: 'Hooded Wraith', img: 'wraith', e: '👾' },
  imp: { n: 'Fire Imp', img: 'imp', e: '👾' },
  snail: { n: 'Giant Snail', img: 'snail', e: '👾' },
  darkelf: { n: 'Dark Elf Archer', img: 'darkelf', e: '👾' },
  minotaur: { n: 'Minotaur', img: 'minotaur', e: '👾' },
  cerberus: { n: 'Three-headed Hound', img: 'cerberus', e: '👾' },
  orc: { n: 'Orc Brute', img: 'orc', e: '👾' },
  lizard: { n: 'Lizardman Spearman', img: 'lizard', e: '👾' },
  shade: { n: 'Shade', img: 'shade', e: '👾' },
  ooze: { n: 'Flesh Ooze', img: 'ooze', e: '👾' },
  hippo: { n: 'Pink Hippo', img: 'hippo', e: '👾' },
  troll: { n: 'Rock Troll', img: 'troll', e: '👾' },
  manticore: { n: 'Manticore', img: 'manticore', e: '👾' },
  darkmage: { n: 'Dark Mage', img: 'darkmage', e: '👾' },
  wisp: { n: 'Blue Wisp', img: 'wisp', e: '👾' },
  centipede: { n: 'Giant Centipede', img: 'centipede', e: '👾' },
  mushroom: { n: 'Mushroom Folk', img: 'mushroom', e: '👾' },
  skull: { n: 'Floating Skull', img: 'skull', e: '👾' },
  squid: { n: 'Cave Squid', img: 'squid', e: '👾' },
  armor: { n: 'Animated Armour', img: 'armor', e: '👾' },
  mole: { n: 'Cave Mole', img: 'mole', e: '👾' },
  dragon: { n: 'Green Dragon (Mid-boss)', img: 'dragon', e: '🐉', kind: 'mid' },
  knight: { n: 'Dread Knight (Mid-boss)', img: 'knight', e: '🧛', kind: 'mid' },
  monarch: { n: 'Mimic Monarch (Mid-boss)', img: 'monarch', e: '📦', kind: 'mid' },
  cyclops: { n: 'Cyclops Brawler (Mid-boss)', img: 'cyclops', e: '👁️', kind: 'mid' },
  shadowbeast: { n: 'Shadowbeast Stalker (Mid-boss)', img: 'shadowbeast', e: '🐈‍⬛', kind: 'mid' },
  warlord: { n: 'Draconic Warlord (Mid-boss)', img: 'warlord', e: '🐲', kind: 'mid' },
  matriarch: { n: 'Hydra Matriarch (Mid-boss)', img: 'matriarch', e: '🐍', kind: 'mid' },
  wyvern: { n: 'Skeletal Wyvern Trainer (Mid-boss)', img: 'wyvern', e: '💀', kind: 'mid' },
  lichacolyte: { n: 'Lich Acolyte (Mid-boss)', img: 'lichacolyte', e: '🧙', kind: 'mid' },
  paladin: { n: 'Corrupt Paladin (Mid-boss)', img: 'paladin', e: '🛡️', kind: 'mid' },
  emperor: { n: 'Mimic Emperor (Boss)', img: 'emperor', e: '📦', kind: 'boss' },
  hydraqueen: { n: 'Hydra Queen (Boss)', img: 'hydraqueen', e: '🐍', kind: 'boss' },
  overlord: { n: 'Dread Overlord (Boss)', img: 'overlord', e: '😈', kind: 'boss' },
  voidboss: { n: 'Void Elemental (Boss)', img: 'voidboss', e: '🌀', kind: 'boss' },
  lichking: { n: 'Lich King (Boss)', img: 'lichking', e: '👑', kind: 'boss' },
};

// Jobs: d = base damage, p = parent job. (Acolyte is the "apprentice mage" step.) Numbers are first-pass; tune freely.
export const JOBS = {
  villager: { n: 'Villager', e: '🧑‍🌾', d: 1 },
  adventurer: { n: 'Adventurer', e: '🧭', d: 2, p: 'villager' },
  fighter: { n: 'Fighter', e: '🥊', d: 4, p: 'adventurer' },
  archer: { n: 'Archer', e: '🏹', d: 3, p: 'adventurer' },
  acolyte: { n: 'Acolyte', e: '📖', d: 2, p: 'adventurer' },
  swordsman: { n: 'Swordsman', e: '⚔️', d: 6, p: 'fighter' },
  brawler: { n: 'Brawler', e: '👊', d: 6, p: 'fighter' },
  horsearcher: { n: 'Horse Archer', e: '🏇', d: 5, p: 'archer' },
  longbowman: { n: 'Longbowman', e: '🎯', d: 5, p: 'archer' },
  mage: { n: 'Mage', e: '🔮', d: 4, p: 'acolyte' },
  cleric: { n: 'Cleric', e: '✨', d: 3, p: 'acolyte' },
  knight: { n: 'Knight', e: '🛡️', d: 9, p: 'swordsman' },
  swordmaster: { n: 'Sword Master', e: '🗡️', d: 10, p: 'swordsman' },
  berserker: { n: 'Berserker', e: '😡', d: 11, p: 'brawler' },
  monk: { n: 'Monk', e: '🧘', d: 9, p: 'brawler' },
  ranger: { n: 'Ranger', e: '🌲', d: 8, p: 'horsearcher' },
  bowknight: { n: 'Bow Knight', e: '🐎', d: 9, p: 'horsearcher' },
  sniper: { n: 'Sniper', e: '🔭', d: 9, p: 'longbowman' },
  assassin: { n: 'Assassin', e: '🥷', d: 10, p: 'longbowman' },
  battlemage: { n: 'Battle Mage', e: '⚡', d: 8, p: 'mage' },
  elementalmage: { n: 'Elemental Mage', e: '🔥', d: 9, p: 'mage' },
  priest: { n: 'Priest', e: '🙏', d: 6, p: 'cleric' },
  paladin: { n: 'Paladin', e: '⚜️', d: 8, p: 'cleric' },
};
// Job points: levels 10, 20, 40, 60, then every 20 levels. Each point unlocks one job whose parent you already have.
export const points = (lv) => [10, 20, 40, 60].filter((x) => lv >= x).length + (lv >= 80 ? Math.floor((lv - 60) / 20) : 0);

export const TOP_FLOOR = 100;
export const MAX_DROP = 0.1; // no drop rate may exceed 10%
// Teacher-adjustable balance (game balance tab). hp: monster HP = base + the HP gain of each level from 2 up, by tier.
// def: gold = goldMin..goldMax x monster level, xp = xp x level, dmg = monster damage per hit = level x dmg. mobs[id] can override gold/xp and sets drops {item: rate}.
export const DEFAULT_CFG = {
  hp: { base: 5, tiers: [{ upTo: 20, per: 1 }, { upTo: 50, per: 2 }, { upTo: 100, per: 3 }] },
  def: { goldMin: 1, goldMax: 3, xp: 2, dmg: 0.5 },
  // monsters per floor: first range with floor <= upTo; rolled once per pupil per floor
  floors: [{ upTo: 10, min: 5, max: 5 }, { upTo: 20, min: 5, max: 7 }, { upTo: 30, min: 6, max: 8 }, { upTo: 40, min: 6, max: 9 }, { upTo: 50, min: 7, max: 10 }, { upTo: 60, min: 7, max: 12 }, { upTo: 70, min: 8, max: 12 }, { upTo: 80, min: 9, max: 13 }, { upTo: 90, min: 10, max: 14 }, { upTo: 100, min: 10, max: 15 }],
  // bosses: HP and damage multipliers on a regular monster of the same level; the boss hits rageDmg x once below 50% HP
  boss: { midHp: 3, midDmg: 1.5, bossHp: 5, bossDmg: 1.5, rageDmg: 2, lo: 0.5, hi: 1.25 }, // lo/hi: each mid-boss or boss hit is a random lo-hi share of its maximum damage
  // job perks (all adjustable): xp/gold/hp/potion/boss/crit/rage are fractions, dr/heal/skip/mult/first are plain numbers.
  // Stage 3 jobs use only their own entry; top-tier jobs add their parent's entry on top of their own.
  // gold price to upgrade the village shop to level 2, 3 and 4 (a pupil also needs the matching job)
  shopCost: [100, 400, 2500],
  // combat timing: seconds between normal attacks; the monster's first attack comes `offset` s earlier; ranged classes strike first after `ranged` s;
  // cap = largest attack-speed bonus (1 = +100%); monster = the monsters' own attack-speed bonus
  speed: { turn: 15, offset: 1, ranged: 5, cap: 1, monster: 0 },
  items: {}, // teacher overrides of item price / shop level / attack / defence / gold / xp / heal
  perks: {
    villager: { xp: 0.2 },
    fighter: { dr: 1 }, swordsman: { mult: 0.5 }, knight: { dr: 2, hp: 0.1 }, swordmaster: { mult: 0.5 },
    brawler: { hp: 0.1, spd: 0.15 }, berserker: { rage: 0.5, spd: 0.1 }, monk: { heal: 2, spd: 0.1 },
    archer: { skip: 1, spd: 0.1 }, horsearcher: { gold: 0.15, spd: 0.1 }, ranger: { gold: 0.1, xp: 0.1, spd: 0.1 }, bowknight: { boss: 0.25, spd: 0.1 },
    longbowman: { crit: 0.15 }, sniper: { crit: 0.1 }, assassin: { first: 2, dbl: 0.25, spd: 0.15 },
    acolyte: { potion: 0.25 }, mage: { mult: 0.5 }, battlemage: { mult: 0.5 }, elementalmage: { crit: 0.2 },
    cleric: { heal: 1 }, priest: { heal: 2, potion: 0.5 }, paladin: { dr: 2 },
  },
  mobs: {}, // filled in below from the floor bands
};
export const cfgFrom = (raw) => {
  const c = JSON.parse(JSON.stringify(DEFAULT_CFG));
  if (raw) {
    Object.assign(c.hp, raw.hp || {});
    Object.assign(c.def, raw.def || {});
    Object.assign(c.boss, raw.boss || {});
    if (raw.perks) c.perks = raw.perks;
    if (raw.shopCost) c.shopCost = raw.shopCost;
    if (raw.items) c.items = raw.items;
    Object.assign(c.speed, raw.speed || {});
    if (raw.mobs) c.mobs = raw.mobs;
    if (raw.floors && raw.floors.length) c.floors = raw.floors;
  }
  for (const k of Object.keys(MOBS)) c.mobs[k] = c.mobs[k] || { drops: {} };
  return c;
};
export function hpFor(lv, cfg) {
  const t = cfg.hp.tiers;
  let h = cfg.hp.base;
  for (let k = 2; k <= lv; k++) h += (t.find((x) => k <= x.upTo) || t[t.length - 1]).per;
  return h;
}
// 100 floors; monsters on floor N are level 1..N; every 5th floor ends with a mid-boss and every 10th with a boss (both level N).
// Which mid-boss / boss waits at the end of each 5th / 10th floor (floors 5, 15, ... 95 and 10, 20, ... 100); the bosses repeat, tougher each time as floor level rises.
const MIDS = ['monarch', 'cyclops', 'dragon', 'shadowbeast', 'warlord', 'matriarch', 'wyvern', 'lichacolyte', 'paladin', 'knight'];
const BOSSES = ['emperor', 'hydraqueen', 'overlord', 'voidboss', 'lichking'];
const BANDS = [
  [10, 'Cellar', ['slime', 'mole', 'snail', 'mushroom', 'bat', 'hippo']],
  [25, 'Tunnels', ['spider', 'centipede', 'ooze', 'squid', 'goblinscout', 'wisp', 'bat', 'slime']],
  [45, 'Goblin Warren', ['goblin', 'goblinscout', 'imp', 'lizard', 'orc', 'darkelf', 'mimic', 'eye']],
  [70, 'Bone Halls', ['skeleton', 'ghost', 'wraith', 'skull', 'shade', 'darkmage', 'wisp', 'cerberus']],
  [100, 'Dread Keep', ['minotaur', 'troll', 'golem', 'armor', 'hydra', 'manticore', 'cerberus', 'eye']],
];
// starting drop rates per floor band (teachers change them per monster on the Game balance tab)
const BAND_DROPS = [
  { minor: 0.1, potion: 0.05, stick: 0.05, tunic: 0.05 },
  { potion: 0.1, dagger: 0.05, vest: 0.05, locket: 0.04, club: 0.03 },
  { potion: 0.08, bigpotion: 0.06, club: 0.05, studded: 0.04, coin: 0.03, handaxe: 0.03, swiftring: 0.03 },
  { bigpotion: 0.08, greater: 0.05, sword: 0.04, mail: 0.04, ring: 0.03, charm: 0.03 },
  { greater: 0.08, blade: 0.04, plate: 0.04, band: 0.03, amulet: 0.03, signet: 0.03 },
];
BANDS.forEach(([, , ids], i) => ids.forEach((id) => { if (!DEFAULT_CFG.mobs[id]) DEFAULT_CFG.mobs[id] = { drops: BAND_DROPS[i] }; }));
const MID_DROPS = [
  { bigpotion: 0.1, sword: 0.08, mail: 0.08, coin: 0.06 },
  { greater: 0.1, blade: 0.08, plate: 0.08, ring: 0.06, swiftring: 0.06 },
  { greater: 0.1, elixir: 0.08, plate: 0.08, signet: 0.08, amulet: 0.08, band: 0.06 },
];
MIDS.forEach((id, i) => { DEFAULT_CFG.mobs[id] = { drops: MID_DROPS[i < 2 ? 0 : i < 5 ? 1 : 2] }; });
BOSSES.forEach((id) => { DEFAULT_CFG.mobs[id] = { drops: { elixir: 0.1, phoenix: 0.08, pendant: 0.05, crown: 0.04, scrown: 0.04, zephyr: 0.05, waraxe: 0.05, longbow: 0.05, arcstaff: 0.05, fullplate: 0.05 } }; });
export function floorInfo(n) {
  const b = BANDS.find((x) => n <= x[0]);
  const boss = n % 10 === 0, mid = n % 5 === 0 && !boss;
  return { n: `${b[1]} · Floor ${n}`, mobs: b[2], lv: [1, n], boss, mid, lead: boss ? BOSSES[(n / 10 - 1) % BOSSES.length] : mid ? MIDS[(n - 5) / 10] : null };
}

// Shop level follows the deepest job the pupil has unlocked: villager 1, adventurer 2, branch / middle classes 3, top-tier classes 4.
// Items with fam can only be bought and used by the Fighter, Archer or Acolyte line.
export const chain = (job) => { const c = []; for (let j = job; j; j = JOBS[j] && JOBS[j].p) c.push(j); return c; };
export const stageOf = (jobs) => [1, 2, 3, 3, 4][Math.max(...jobs.map((j) => chain(j).length - 1))];
export const canUse = (it, jobs) => !it.fam || jobs.some((j) => chain(j).includes(it.fam));
export const shopFor = (jobs, lv) => Object.entries(ITEMS).filter(([, i]) => i.st && i.st <= lv && canUse(i, jobs)).map(([id]) => id);

// [key, label, isPercent]
export const PERKS = [['xp', 'XP bonus %', 1], ['gold', 'Gold bonus %', 1], ['dr', 'Damage absorbed per hit', 0], ['hp', 'Max HP bonus %', 1], ['mult', 'Bonus strike extra ×', 0], ['heal', 'HP healed per correct answer', 0], ['potion', 'Potion healing bonus %', 1], ['skip', 'Monster hits skipped per fight', 0], ['boss', 'Damage vs mid-bosses and bosses %', 1], ['crit', 'Double-strike chance %', 1], ['first', 'First correct answer of a fight ×', 0], ['rage', 'Damage below 50% HP %', 1], ['spd', 'Attack speed %', 1], ['dbl', 'Regular-attack double-damage chance %', 1]];
// A top-tier job (4 steps below villager) keeps the perk of the class it came from; everything else has only its own perk.
export const perksOf = (job, cfg) => {
  const out = {};
  const add = (id) => { for (const [k, v] of Object.entries(cfg.perks[id] || {})) out[k] = (out[k] || 0) + v; };
  add(job);
  if (chain(job).length === 5) add(JOBS[job].p);
  return out;
};
export const mhOf = (pl, cfg) => Math.round(maxHp(pl.level) * (1 + (perksOf(pl.job, cfg).hp || 0)));
// The Adventurer can use any stage 3 weapon, whatever the line.
export const canEquip = (it, job) => canUse(it, [job]) || (job === 'adventurer' && it.slot === 'weapon' && it.st === 3);
