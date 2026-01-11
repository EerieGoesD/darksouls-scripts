// ==UserScript==
// @name         DS1 – APS + R1 Damage Type Data
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Provides APS (attacks per second), primary R1 physical damage type, Black Knight flags, and boss stats for DS1
// @match        https://soulsplanner.com/darksouls/weaponatk*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // --- APS data ---
  const APS_BY_WEAPON = {
    "Demon's Spear": { '1H_R1': 1.29, '2H_R1': 1.35 },
    'Hand Axe': { '1H_R1': 1.57, '2H_R1': 1.62 },
    'Black Knight Greataxe': { '1H_R1': 0.88, '2H_R1': 0.91 },
    'Broadsword': { '1H_R1': 1.52, '2H_R1': 1.40 },
    "Quelaag's Furysword": { '1H_R1': 1.33, '2H_R1': 1.56 },
    'Longsword': { '1H_R1': 1.52, '2H_R1': 1.40 },
    'Shortsword': { '1H_R1': 1.52, '2H_R1': 1.40 },
    'Blacksmith Giant Hammer': { '1H_R1': 0.95, '2H_R1': 0.95 },
    'Great Lord Greatsword': { '1H_R1': 1.01, '2H_R1': 0.91 },
    'Barbed Straight Sword': { '1H_R1': 1.52, '2H_R1': 1.40 },
    'Gravelord Sword': { '1H_R1': 1.05, '2H_R1': 1.07 },
    'Man-serpent Greatsword': { '1H_R1': 0.91, '2H_R1': 0.83 },
    'Stone Greatsword': { '1H_R1': 0.91, '2H_R1': 0.83 },
    'Sunlight Straight Sword': { '1H_R1': 1.33, '2H_R1': 1.23 },
    'Dark Sword': { '1H_R1': 1.33, '2H_R1': 1.23 },
    'Dragon Bone Fist': { '1H_R1': 1.47 },
    'Bastard Sword': { '1H_R1': 1.01, '2H_R1': 0.91 },
    'Caestus': { '1H_R1': 1.61 },
    'Black Knight Sword': { '1H_R1': 0.91, '2H_R1': 0.83 },
    'Falchion': { '1H_R1': 1.52, '2H_R1': 1.79 },
    "Giant's Halberd": { '1H_R1': 0.88, '2H_R1': 0.92 },
    'Claymore': { '1H_R1': 1.01, '2H_R1': 0.91 },
    'Dagger': { '1H_R1': 2.19, '2H_R1': 2.22 },
    'Black Knight Halberd': { '1H_R1': 0.88, '2H_R1': 0.92 },
    'Washing Pole': { '1H_R1': 1.25, '2H_R1': 1.30 },
    'Shotel': { '1H_R1': 1.52, '2H_R1': 1.79 },
    'Scimitar': { '1H_R1': 1.52, '2H_R1': 1.79 },
    'Balder Side Sword': { '1H_R1': 1.52, '2H_R1': 1.40 },
    'Titanite Catch Pole': { '1H_R1': 0.93, '2H_R1': 1.00 },
    "Demon's Greataxe": { '2H_R1': 0.67 },
    'Rapier': { '1H_R1': 1.59, '2H_R1': 1.50 },
    'Murakumo': { '1H_R1': 1.05, '2H_R1': 1.07 },
    'Obsidian Greatsword': { '1H_R1': 0.91, '2H_R1': 0.83 },
    'Parrying Dagger': { '1H_R1': 2.19, '2H_R1': 2.22 },
    'Claw': { '1H_R1': 1.61 },
    'Halberd': { '1H_R1': 0.97, '2H_R1': 1.04 },
    'Greataxe': { '1H_R1': 0.69, '2H_R1': 0.69 },
    "Gargoyle's Halberd": { '1H_R1': 0.93, '2H_R1': 1.00 },
    'Pike': { '1H_R1': 1.29, '2H_R1': 1.35 },
    'Mace': { '1H_R1': 0.95, '2H_R1': 0.95 },
    'Uchigatana': { '1H_R1': 1.38, '2H_R1': 1.46 },
    'Four-Pronged Plow': { '1H_R1': 1.29, '2H_R1': 1.35 },
    'Reinforced Club': { '1H_R1': 0.95, '2H_R1': 0.95 },
    'Demon Great Machete': { '1H_R1': 0.63, '2H_R1': 0.70 },
    'Pickaxe': { '1H_R1': 0.95, '2H_R1': 0.95 },
    'Server': { '1H_R1': 1.05, '2H_R1': 1.07 },
    'Butcher Knife': { '1H_R1': 0.93, '2H_R1': 0.93 },
    'Golem Axe': { '1H_R1': 0.93, '2H_R1': 0.93 },
    'Chaos Blade': { '1H_R1': 1.38, '2H_R1': 1.46 },
    'Winged Spear': { '1H_R1': 1.29, '2H_R1': 1.35 },
    'Drake Sword': { '1H_R1': 1.33, '2H_R1': 1.23 },
    'Ghost Blade': { '1H_R1': 2.19, '2H_R1': 2.22 },
    'Jagged Ghost Blade': { '1H_R1': 1.52, '2H_R1': 1.79 },
    'Battle Axe': { '1H_R1': 1.00, '2H_R1': 1.00 },
    'Partizan': { '1H_R1': 1.29, '2H_R1': 1.35 },
    'Spear': { '1H_R1': 1.29, '2H_R1': 1.35 },
    'Dragon King Greataxe': { '2H_R1': 0.67 },
    'Flamberge': { '1H_R1': 1.01, '2H_R1': 0.91 },
    'Estoc': { '1H_R1': 1.35, '2H_R1': 1.33 },
    'Lifehunt Scythe': { '1H_R1': 1.02, '2H_R1': 1.00 },
    'Zweihander': { '1H_R1': 0.67, '2H_R1': 0.75 },
    'Greatsword': { '1H_R1': 0.67, '2H_R1': 0.75 },
    'Warpick': { '1H_R1': 0.95, '2H_R1': 0.95 },
    'Great Scythe': { '1H_R1': 1.02, '2H_R1': 1.00 },
    "Bandit's Knife": { '1H_R1': 1.82, '2H_R1': 1.86 },
    'Black Knight Greatsword': { '1H_R1': 0.63, '2H_R1': 0.70 },
    'Club': { '1H_R1': 0.95, '2H_R1': 0.95 },
    'Great Club': { '1H_R1': 0.57, '2H_R1': 0.66 },
    'Blacksmith Hammer': { '1H_R1': 0.95, '2H_R1': 0.95 },
    'Dragon Greatsword': { '1H_R1': 0.63, '2H_R1': 0.70 },
    'Scythe': { '1H_R1': 0.93, '2H_R1': 1.00 },
    'Hammer of Vamos': { '1H_R1': 0.95, '2H_R1': 0.95 },
    'Stone Greataxe': { '2H_R1': 0.67 },
    'Large Club': { '1H_R1': 0.57, '2H_R1': 0.66 },
    'Morning Star': { '1H_R1': 0.95, '2H_R1': 0.95 },
    'Lucerne': { '1H_R1': 0.80, '2H_R1': 0.81 },
    "Demon's Great Hammer": { '1H_R1': 0.55, '2H_R1': 0.62 },
    'Gargoyle Tail Axe': { '1H_R1': 1.00, '2H_R1': 1.00 },
    'Mail Breaker': { '1H_R1': 1.59, '2H_R1': 1.50 },
    'Crystal Straight Sword': { '1H_R1': 1.33, '2H_R1': 1.23 },
    'Dragon Tooth': { '1H_R1': 0.55, '2H_R1': 0.62 },
    'Dark Hand': { '1H_R1': 1.61, '2H_R1': 0.45 },
    'Crystal Greatsword': { '1H_R1': 0.91, '2H_R1': 0.83 },
    'Whip': { '1H_R1': 0.83, '2H_R1': 0.85 },
    'Broken Straight Sword': { '1H_R1': 1.52, '2H_R1': 1.40 },
    'Notched Whip': { '1H_R1': 0.83, '2H_R1': 0.85 },
    'Guardian Tail': { '1H_R1': 0.77, '2H_R1': 0.79 },
    'Heavy Crossbow': { '1H_R1': 0.56, '2H_R1': 0.48 },
    'Light Crossbow': { '1H_R1': 0.56, '2H_R1': 0.48 },
    'Composite Bow': { '2H_R1': 0.61 },
    'Avelyn': { '1H_R1': 0.45 },
    'Sniper Crossbow': { '1H_R1': 0.31, '2H_R1': 0.30 },
    'Short Bow': { '2H_R1': 0.61 },
    'Long Bow': { '2H_R1': 0.52 },
    'Longbow':  { '2H_R1': 0.52 },
    'Straight Sword Hilt': { '1H_R1': 1.52, '2H_R1': 1.40 },
    'Black Bow of Pharis': { '2H_R1': 0.52 },
    'Bare Fist': { '1H_R1': 1.61 },
    'Painting Guardian Sword': { '1H_R1': 1.52, '2H_R1': 1.79 },
    'Iaito': { '1H_R1': 1.38, '2H_R1': 1.46 },
    "Ricard's Rapier": { '1H_R1': 1.59, '2H_R1': 1.50 },
    "Silver Knight Straight Sword": { '1H_R1': 1.33, '2H_R1': 1.23 },
    "Priscilla's Dagger": { '1H_R1': 1.82, '2H_R1': 1.86 },
    'Silver Knight Spear': { '1H_R1': 1.29, '2H_R1': 1.35 },
    'Dark Silver Tracer': { '1H_R1': 1.82, '2H_R1': 1.86 },
    'Gold Tracer': { /* no clean R1 APS */ },
    'Grant': { '1H_R1': 0.55, '2H_R1': 0.62 },
    'Shield Poke Spear': { '1H_R1': 1.09 },
    'Shield Poke Thrusting Sword': { '1H_R1': 1.09 },
    "Smough's Hammer": { '1H_R1': 0.55, '2H_R1': 0.62 },
    "Channeler's Trident": { '1H_R1': 1.29, '2H_R1': 1.35 },
    "Velka's Rapier": { '1H_R1': 1.59, '2H_R1': 1.50 },
    "Astora's Straight Sword": { '1H_R1': 1.52, '2H_R1': 1.40 },
    'Abyss Greatsword': { '1H_R1': 0.91, '2H_R1': 0.83 },
    'Moonlight Butterfly Horn': { '1H_R1': 1.29, '2H_R1': 1.35 },
    'Dragonform Fists': { '1H_R1': 1.12 },
    'Crescent Axe': { '1H_R1': 0.93, '2H_R1': 0.93 },
    'Dragonslayer Spear': { '1H_R1': 1.29, '2H_R1': 1.35 },
    'Moonlight Greatsword': { '1H_R1': 1.01, '2H_R1': 0.91 },
    'Greatsword of Artorias': { '1H_R1': 0.91, '2H_R1': 0.83 },
    'Greatsword of Artorias Cursed': { '1H_R1': 0.91, '2H_R1': 0.83 },
    'Darkmoon Bow': { '2H_R1': 0.61 },
    'Dragonslayer Greatbow': { '2H_R1': 0.32 },
    "Gough's Greatbow": { '2H_R1': 0.32 }
  };

  // --- Damage type CSV (for primary physical type extraction) ---
  const DMG_TYPE_CSV = `
Name,Damage Type
Astora's Straight Sword,Regular/Thrust/Magic
Balder Side Sword,Regular/Thrust
Barbed Straight Sword,Regular/Thrust
Broadsword,Regular
Broken Straight Sword,Regular/Thrust
Crystal Straight Sword,Regular/Thrust
Darksword,Regular
Drake Sword,Regular
Longsword,Regular/Thrust
Shortsword,Regular/Thrust
Silver Knight Straight Sword,Regular
Straight Sword Hilt,Regular/Thrust
Sunlight Straight Sword,Regular/Thrust
Abyss Greatsword,Regular
Bastard Sword,Regular
Black Knight Sword,Regular/Thrust
Claymore,Regular/Thrust
Crystal Greatsword,Regular
Flamberge,Slash
Great Lord Greatsword,Regular
Greatsword of Artorias,Regular/Thrust/Magic
Greatsword of Artorias Cursed,Regular/Thrust
Man-serpent Greatsword,Regular
Moonlight Greatsword,Magic
Obsidian Greatsword,Regular
Stone Greatsword,Regular/Magic
Black Knight Greatsword,Regular/Thrust
Demon Great Machete,Regular
Dragon Greatsword,Regular
Greatsword,Regular/Thrust
Zweihander,Regular
Falchion,Slash
Gold Tracer,Slash
Jagged Ghost Blade,Slash/Thrust
Painting Guardian Sword,Slash
Quelaag's Furysword,Slash/Fire
Scimitar,Slash
Shotel,Slash
Gravelord Sword,Slash/Thrust
Murakumo,Slash
Server,Slash
Estoc,Regular/Thrust
Mail Breaker,Thrust
Rapier,Thrust
Ricard's Rapier,Thrust
Velka's Rapier,Regular/Thrust/Magic
Chaos Blade,Slash
Iaito,Slash
Uchigatana,Slash/Thrust
Washing Pole,Slash/Thrust
Battle Axe,Regular
Butcher Knife,Regular
Crescent Axe,Regular/Magic
Gargoyle Tail Axe,Regular
Golem Axe,Regular
Hand Axe,Regular
Black Knight Greataxe,Regular
Demon's Greataxe,Regular
Dragon King Greataxe,Regular
Greataxe,Regular
Stone Greataxe,Regular
Channeler's Trident,Thrust/Magic
Demon's Spear,Thrust/Lightning
Dragonslayer Spear,Thrust/Lightning
Four-Pronged Plow,Thrust
Moonlight Butterfly Horn,Magic
Partizan,Thrust/Regular
Pike,Thrust
Silver Knight Spear,Thrust/Regular
Spear,Thrust
Winged Spear,Thrust
Black Knight Halberd,Slash
Gargoyle's Halberd,Regular
Giant's Halberd,Regular/Thrust/Lightning
Great Scythe,Slash
Halberd,Regular/Thrust
Lifehunt Scythe,Slash
Lucerne,Thrust
Scythe,Slash
Titanite Catch Pole,Regular/Magic
Blacksmith Giant Hammer,Strike/Lightning
Blacksmith Hammer,Strike
Club,Strike
Hammer of Vamos,Strike/Fire
Mace,Strike
Morning Star,Strike
Pickaxe,Thrust
Reinforced Club,Strike
Warpick,Thrust
Demon's Great Hammer,Strike
Dragon Tooth,Strike
Grant,Strike/Magic
Great Club,Strike
Large Club,Strike
Smough's Hammer,Strike
Bandit's Knife,Slash
Dagger,Slash/Thrust
Dark Silver Tracer,Slash/Thrust
Ghost Blade,Slash/Thrust
Parrying Dagger,Slash/Thrust
Priscilla's Dagger,Slash
Fists,Strike
Caestus,Strike
Claw,Slash
Dark Hand,Strike
Dragon Bone Fist,Strike
Guardian Tail,Regular
Notched Whip,Regular
Whip,Regular
`.trim();

  const PHYS_TYPE_BY_WEAPON = {};

  DMG_TYPE_CSV.split('\n').slice(1).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const commaIdx = trimmed.indexOf(',');
    if (commaIdx === -1) return;

    const name = trimmed.slice(0, commaIdx).trim();
    const typeStr = trimmed.slice(commaIdx + 1).trim();
    const parts = typeStr.split('/');

    let phys = 'Regular';
    for (const p of parts) {
      const t = p.trim();
      if (t === 'Regular' || t === 'Strike' || t === 'Slash' || t === 'Thrust') {
        phys = t;
        break;
      }
    }
    PHYS_TYPE_BY_WEAPON[name] = phys;
  });

  // Extra mappings for naming differences
  PHYS_TYPE_BY_WEAPON['Bare Fist'] = 'Strike';
  PHYS_TYPE_BY_WEAPON['Dragonform Fists'] = 'Strike';

  // --- Black Knight weapon flags ---
  const BLACK_KNIGHT_WEAPONS = {
    'Black Knight Greataxe': true,
    'Black Knight Greatsword': true,
    'Black Knight Sword': true,
    'Black Knight Halberd': true,
    'Black Knight Shield': true
  };

  // --- Boss data ---
  // bossBleedPercent: fixed 10% for all bosses (bleed cap)
  const DS1_BOSSES = {
    asylum_demon: {
      key: 'asylum_demon',
      name: 'Asylum Demon',
      reg: 83, strike: 83, slash: 83, thrust: 83,
      magic: 62, fire: 66, light: 54,
      bleedRes: 75,
      hp: 813,
      bossBleedPercent: 10,
      chaosDemon: true,
      occultWeak: false
    },
    taurus_demon: {
      key: 'taurus_demon',
      name: 'Taurus Demon',
      reg: 103, strike: 103, slash: 103, thrust: 103,
      magic: 77, fire: 88, light: 67,
      bleedRes: 150,
      hp: 1215,
      bossBleedPercent: 10,
      chaosDemon: false,
      occultWeak: false
    },
    bell_gargoyles: {
      key: 'bell_gargoyles',
      name: 'Bell Gargoyles (total)',
      reg: 133, strike: 133, slash: 133, thrust: 133,
      magic: 103, fire: 98, light: 104,
      bleedRes: 230,
      hp: 999 + 480, // 1479
      bossBleedPercent: 10,
      chaosDemon: false,
      occultWeak: false
    },
    moonlight_butterfly: {
      key: 'moonlight_butterfly',
      name: 'Moonlight Butterfly',
      reg: 184, strike: 184, slash: 184, thrust: 184,
      magic: 230, fire: 110, light: 148,
      bleedRes: Infinity,
      hp: 1506,
      bossBleedPercent: 10,
      chaosDemon: false,
      occultWeak: false
    },
    capra_demon: {
      key: 'capra_demon',
      name: 'Capra Demon',
      reg: 159, strike: 159, slash: 159, thrust: 159,
      magic: 119, fire: 127, light: 106,
      bleedRes: 220,
      hp: 1176,
      bossBleedPercent: 10,
      chaosDemon: true,
      occultWeak: false
    },
    gaping_dragon: {
      key: 'gaping_dragon',
      name: 'Gaping Dragon',
      reg: 167, strike: 167, slash: 167, thrust: 167,
      magic: 117, fire: 108, light: 84,
      bleedRes: 118,
      hp: 4660,
      bossBleedPercent: 10,
      chaosDemon: false,
      occultWeak: false
    },
    stray_demon: {
      key: 'stray_demon',
      name: 'Stray Demon',
      reg: 258, strike: 323, slash: 194, thrust: 258,
      magic: 195, fire: 207, light: 168,
      bleedRes: 75,
      hp: 5250,
      bossBleedPercent: 10,
      chaosDemon: true,
      occultWeak: false
    },
    quelaag: {
      key: 'quelaag',
      name: 'Chaos Witch Quelaag',
      reg: 255, strike: 255, slash: 255, thrust: 255,
      magic: 229, fire: Infinity, light: 205,
      bleedRes: 110,
      hp: 3139,
      bossBleedPercent: 10,
      chaosDemon: false,
      occultWeak: false
    },
    sif: {
      key: 'sif',
      name: 'Sif, the Great Grey Wolf',
      reg: 260, strike: 260, slash: 260, thrust: 260,
      magic: 195, fire: 182, light: 195,
      bleedRes: 200,
      hp: 3432,
      bossBleedPercent: 10,
      chaosDemon: false,
      occultWeak: false
    },
    iron_golem: {
      key: 'iron_golem',
      name: 'Iron Golem',
      reg: 408, strike: 306, slash: 510, thrust: 408,
      magic: 326, fire: 305, light: 245,
      bleedRes: Infinity,
      hp: 2880,
      bossBleedPercent: 10,
      chaosDemon: false,
      occultWeak: false
    },
    ornstein: {
      key: 'ornstein',
      name: 'Ornstein',
      reg: 349, strike: 349, slash: 349, thrust: 349,
      magic: 226, fire: 263, light: 1747,
      bleedRes: 240,
      hp: 1642,
      bossBleedPercent: 10,
      chaosDemon: false,
      occultWeak: true
    },
    super_ornstein: {
      key: 'super_ornstein',
      name: 'Super Ornstein',
      reg: 339, strike: 339, slash: 339, thrust: 339,
      magic: 221, fire: 256, light: 1657,
      bleedRes: 240,
      hp: 2981,
      bossBleedPercent: 10,
      chaosDemon: false,
      occultWeak: true
    },
    smough: {
      key: 'smough',
      name: 'Smough',
      reg: 180, strike: 224, slash: 180, thrust: 180,
      magic: 153, fire: 125, light: 108,
      bleedRes: 120,
      hp: 2645,
      bossBleedPercent: 10,
      chaosDemon: false,
      occultWeak: false
    },
    super_smough: {
      key: 'super_smough',
      name: 'Super Smough',
      reg: 180, strike: 224, slash: 180, thrust: 180,
      magic: 153, fire: 125, light: 359,
      bleedRes: 120,
      hp: 4094,
      bossBleedPercent: 10,
      chaosDemon: false,
      occultWeak: false
    },
    crossbreed_priscilla: {
      key: 'crossbreed_priscilla',
      name: 'Crossbreed Priscilla',
      reg: 324, strike: 324, slash: 324, thrust: 324,
      magic: 291, fire: 195, light: 195,
      bleedRes: 125,
      hp: 2300,
      bossBleedPercent: 10,
      chaosDemon: false,
      occultWeak: false
    },
    gwyndolin: {
      key: 'gwyndolin',
      name: 'Dark Sun Gwyndolin',
      reg: 251, strike: 251, slash: 251, thrust: 251,
      magic: 251, fire: 155, light: 251,
      bleedRes: 160,
      hp: 2011,
      bossBleedPercent: 10,
      chaosDemon: false,
      occultWeak: false
    },
    pinwheel: {
      key: 'pinwheel',
      name: 'Pinwheel',
      reg: 151, strike: 151, slash: 151, thrust: 151,
      magic: 128, fire: 121, light: 99,
      bleedRes: 200,
      hp: 1326,
      bossBleedPercent: 10,
      chaosDemon: false,
      occultWeak: false
    },
    nito: {
      key: 'nito',
      name: 'Gravelord Nito',
      reg: 317, strike: 317, slash: 317, thrust: 317,
      magic: 238, fire: 221, light: 317,
      bleedRes: Infinity,
      hp: 4317,
      bossBleedPercent: 10,
      chaosDemon: false,
      occultWeak: false
    },
    seath: {
      key: 'seath',
      name: 'Seath the Scaleless',
      reg: 345, strike: 345, slash: 345, thrust: 345,
      magic: 690, fire: 207, light: 207,
      bleedRes: Infinity,
      hp: 5525,
      bossBleedPercent: 10,
      chaosDemon: false,
      occultWeak: false
    },
    four_kings: {
      key: 'four_kings',
      name: 'The Four Kings (total)',
      reg: 299, strike: 299, slash: 299, thrust: 299,
      magic: 205, fire: 192, light: 177,
      bleedRes: Infinity,
      hp: 9412,
      bossBleedPercent: 10,
      chaosDemon: false,
      occultWeak: false
    },
    ceaseless_discharge: {
      key: 'ceaseless_discharge',
      name: 'Ceaseless Discharge',
      reg: 315, strike: 315, slash: 315, thrust: 315,
      magic: 220, fire: Infinity, light: 252,
      bleedRes: Infinity,
      hp: 4200,
      bossBleedPercent: 10,
      chaosDemon: false,
      occultWeak: false
    },
    centipede_demon: {
      key: 'centipede_demon',
      name: 'Centipede Demon',
      reg: 269, strike: 269, slash: 269, thrust: 269,
      magic: 174, fire: Infinity, light: 215,
      bleedRes: 195,
      hp: 3432,
      bossBleedPercent: 10,
      chaosDemon: true,
      occultWeak: false
    },
    demon_firesage: {
      key: 'demon_firesage',
      name: 'Demon Firesage',
      reg: 255, strike: 318, slash: 191, thrust: 255,
      magic: 192, fire: 203, light: 166,
      bleedRes: 75,
      hp: 5448,
      bossBleedPercent: 10,
      chaosDemon: true,
      occultWeak: false
    },
    bed_of_chaos: {
      key: 'bed_of_chaos',
      name: 'Bed of Chaos',
      reg: 0, strike: 0, slash: 0, thrust: 0,
      magic: 0, fire: 0, light: 0,
      bleedRes: Infinity,
      hp: 1,
      bossBleedPercent: 10,
      chaosDemon: false,
      occultWeak: false
    },
    sanctuary_guardian: {
      key: 'sanctuary_guardian',
      name: 'Sanctuary Guardian',
      reg: 300, strike: 300, slash: 300, thrust: 300,
      magic: 768, fire: 480, light: 1056,
      bleedRes: 100,
      hp: 2560,
      bossBleedPercent: 10,
      chaosDemon: false,
      occultWeak: false
    },
    artorias: {
      key: 'artorias',
      name: 'Artorias the Abysswalker',
      reg: 399, strike: 359, slash: 479, thrust: 479,
      magic: 687, fire: 636, light: 591,
      bleedRes: Infinity,
      hp: 3750,
      bossBleedPercent: 10,
      chaosDemon: false,
      occultWeak: false
    },
    kalameet: {
      key: 'kalameet',
      name: 'Black Dragon Kalameet',
      reg: 468, strike: 374, slash: 468, thrust: 468,
      magic: 900, fire: 900, light: 762,
      bleedRes: 333,
      hp: 5400,
      bossBleedPercent: 10,
      chaosDemon: false,
      occultWeak: false
    },
    manus: {
      key: 'manus',
      name: 'Manus, Father of the Abyss',
      reg: 324, strike: 324, slash: 324, thrust: 324,
      magic: 768, fire: 624, light: 720,
      bleedRes: Infinity,
      hp: 6665,
      bossBleedPercent: 10,
      chaosDemon: false,
      occultWeak: false
    },
    gwyn: {
      key: 'gwyn',
      name: 'Gwyn, Lord of Cinder',
      reg: 354, strike: 354, slash: 354, thrust: 354,
      magic: 267, fire: 249, light: 1770,
      bleedRes: Infinity,
      hp: 4185,
      bossBleedPercent: 10,
      chaosDemon: false,
      occultWeak: true
    }
  };

  // Expose globals for the DPS script
  window.DS1_APS_BY_WEAPON = APS_BY_WEAPON;
  window.DS1_PHYS_TYPE_BY_WEAPON = PHYS_TYPE_BY_WEAPON;
  window.DS1_BLACK_KNIGHT_WEAPONS = BLACK_KNIGHT_WEAPONS;
  window.DS1_BOSSES = DS1_BOSSES;
})();
