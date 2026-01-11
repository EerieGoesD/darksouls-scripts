// ==UserScript==
// @name         DS1 – DPS R1 Column (Direct + Bleed, Phys Types, Boss Presets, BK + Occult, NG)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  DPS R1 column using APS + DS1-style defenses (Reg/Str/Sl/Th + Mag/Fire/Lgt) and Bleed contribution, sortable. Supports boss presets, NG HP, +20% vs Chaos Demon for Black Knight weapons, and +20% vs Occult-weak enemies for Occult weapons.
// @match        https://soulsplanner.com/darksouls/weaponatk*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  function waitForAPSData(callback) {
    const check = setInterval(() => {
      if (window.DS1_APS_BY_WEAPON) {
        clearInterval(check);
        callback(window.DS1_APS_BY_WEAPON);
      }
    }, 100);
  }

  waitForAPSData(function (APS_BY_WEAPON) {
    const BASE_NAMES = Object.keys(APS_BY_WEAPON).sort((a, b) => b.length - a.length);

    const BOSSES = window.DS1_BOSSES || {};
    const BLACK_KNIGHT_WEAPONS = window.DS1_BLACK_KNIGHT_WEAPONS || {
      'Black Knight Greataxe': true,
      'Black Knight Greatsword': true,
      'Black Knight Sword': true,
      'Black Knight Halberd': true,
      'Black Knight Shield': true
    };

    // HP per NG-cycle for each boss
    const BOSS_HP_BY_NG = {
      asylum_demon:   { 'NG': 813,   'NG+': 2195, 'NG+6': 2744 },
      taurus_demon:   { 'NG': 1215,  'NG+': 3162, 'NG+6': 3953 },
      bell_gargoyles: { 'NG': 1479,  'NG+': 3699, 'NG+6': 4623 },
      moonlight_butterfly: { 'NG': 1506, 'NG+': 3449, 'NG+6': 4311 },
      capra_demon:    { 'NG': 1176,  'NG+': 2940, 'NG+6': 3675 },
      gaping_dragon:  { 'NG': 4660,  'NG+': 8947, 'NG+6': 11183 },
      stray_demon:    { 'NG': 5250,  'NG+': 8242, 'NG+6': 10303 },
      quelaag:        { 'NG': 3139,  'NG+': 6027, 'NG+6': 7534 },
      sif:            { 'NG': 3432,  'NG+': 5800, 'NG+6': 7250 },
      iron_golem:     { 'NG': 2880,  'NG+': 5270, 'NG+6': 6588 },
      ornstein:       { 'NG': 1642,  'NG+': 2873, 'NG+6': 3592 },
      super_ornstein: { 'NG': 2981,  'NG+': 5218, 'NG+6': 6523 },
      smough:         { 'NG': 2645,  'NG+': 4630, 'NG+6': 5788 },
      super_smough:   { 'NG': 4094,  'NG+': 7166, 'NG+6': 8957 },
      crossbreed_priscilla: { 'NG': 2300, 'NG+': 3611, 'NG+6': 4513 },
      gwyndolin:      { 'NG': 2011,  'NG+': 3520, 'NG+6': 4400 },
      pinwheel:       { 'NG': 1326,  'NG+': 2691 }, // NG+6 HP not provided
      nito:           { 'NG': 4317,  'NG+': 7076, 'NG+6': 8845 },
      seath:          { 'NG': 5525,  'NG+': 8674, 'NG+6': 10842 },
      four_kings:     { 'NG': 9412,  'NG+': 16061, 'NG+6': 20077 },
      ceaseless_discharge: { 'NG': 4200, 'NG+': 6720, 'NG+6': 8400 },
      centipede_demon: { 'NG': 3432, 'NG+': 5491, 'NG+6': 6864 },
      demon_firesage: { 'NG': 5448,  'NG+': 8716, 'NG+6': 11216 },
      bed_of_chaos:   { 'NG': 1,     'NG+': 3,    'NG+6': 4 },
      sanctuary_guardian: { 'NG': 2560, 'NG+': 4019, 'NG+6': 7921 },
      artorias:       { 'NG': 3750,  'NG+': 5887, 'NG+6': 7359 },
      kalameet:       { 'NG': 5400,  'NG+': 8478, 'NG+6': 10597 },
      manus:          { 'NG': 6665,  'NG+': 10464, 'NG+6': 13080 },
      gwyn:           { 'NG': 4185,  'NG+': 6444, 'NG+6': 8056 }
    };

    const NG_LABELS = ['NG', 'NG+', 'NG+6'];

    // Per-weapon bleed percentage vs regular enemies (not bosses)
    const BLEED_PERCENT_BY_WEAPON = {
      "Bandit's Knife": 30,
      "Barbed Straight Sword": 30,
      "Chaos Blade": 30,
      "Claw": 30,
      "Flamberge": 30,
      "Gold Tracer": 30,
      "Great Scythe": 30,
      "Iaito": 30,
      "Jagged Ghost Blade": 30,
      "Morning Star": 30,
      "Notched Whip": 30,
      "Painting Guardian Sword": 30,
      "Reinforced Club": 30,
      "Spiked Shield": 30,
      "Uchigatana": 30,
      "Washing Pole": 30,
      "Priscilla's Dagger": 50,
      "Lifehunt Scythe": 50
    };

    const CHAOS_DEMON_MULT = 1.2;   // +20% with Black Knight weapons
    const OCCULT_WEAK_MULT = 1.2;   // +20% with Occult weapons

    function findBaseWeapon(rawName) {
      if (!rawName) return null;
      const name = rawName.trim();
      for (const base of BASE_NAMES) {
        if (name.startsWith(base)) return base;
      }
      return null;
    }

    // ---- Damage type strings ----
    const DAMAGE_TYPES = {
      "Astora's Straight Sword": "Regular/Thrust/Magic",
      "Balder Side Sword": "Regular/Thrust",
      "Barbed Straight Sword": "Regular/Thrust",
      "Broadsword": "Regular",
      "Broken Straight Sword": "Regular/Thrust",
      "Crystal Straight Sword": "Regular/Thrust",
      "Darksword": "Regular",
      "Drake Sword": "Regular",
      "Longsword": "Regular/Thrust",
      "Shortsword": "Regular/Thrust",
      "Silver Knight Straight Sword": "Regular",
      "Straight Sword Hilt": "Regular/Thrust",
      "Sunlight Straight Sword": "Regular/Thrust",

      "Abyss Greatsword": "Regular",
      "Bastard Sword": "Regular",
      "Black Knight Sword": "Regular/Thrust",
      "Claymore": "Regular/Thrust",
      "Crystal Greatsword": "Regular",
      "Flamberge": "Slash",
      "Great Lord Greatsword": "Regular",
      "Greatsword of Artorias": "Regular/Thrust/Magic",
      "Greatsword of Artorias Cursed": "Regular/Thrust",
      "Man-serpent Greatsword": "Regular",
      "Moonlight Greatsword": "Magic",
      "Obsidian Greatsword": "Regular",
      "Stone Greatsword": "Regular/Magic",
      "Black Knight Greatsword": "Regular/Thrust",
      "Demon Great Machete": "Regular",
      "Dragon Greatsword": "Regular",
      "Greatsword": "Regular/Thrust",
      "Zweihander": "Regular",

      "Falchion": "Slash",
      "Gold Tracer": "Slash",
      "Jagged Ghost Blade": "Slash/Thrust",
      "Painting Guardian Sword": "Slash",
      "Quelaag's Furysword": "Slash/Fire",
      "Scimitar": "Slash",
      "Shotel": "Slash",
      "Gravelord Sword": "Slash/Thrust",
      "Murakumo": "Slash",
      "Server": "Slash",

      "Estoc": "Regular/Thrust",
      "Mail Breaker": "Thrust",
      "Rapier": "Thrust",
      "Ricard's Rapier": "Thrust",
      "Velka's Rapier": "Regular/Thrust/Magic",

      "Chaos Blade": "Slash",
      "Iaito": "Slash",
      "Uchigatana": "Slash/Thrust",
      "Washing Pole": "Slash/Thrust",

      "Battle Axe": "Regular",
      "Butcher Knife": "Regular",
      "Crescent Axe": "Regular/Magic",
      "Gargoyle Tail Axe": "Regular",
      "Golem Axe": "Regular",
      "Hand Axe": "Regular",
      "Black Knight Greataxe": "Regular",
      "Demon's Greataxe": "Regular",
      "Dragon King Greataxe": "Regular",
      "Greataxe": "Regular",
      "Stone Greataxe": "Regular",

      "Channeler's Trident": "Thrust/Magic",
      "Demon's Spear": "Thrust/Lightning",
      "Dragonslayer Spear": "Thrust/Lightning",
      "Four-Pronged Plow": "Thrust",
      "Moonlight Butterfly Horn": "Magic",
      "Partizan": "Thrust/Regular",
      "Pike": "Thrust",
      "Silver Knight Spear": "Thrust/Regular",
      "Spear": "Thrust",
      "Winged Spear": "Thrust",

      "Black Knight Halberd": "Slash",
      "Gargoyle's Halberd": "Regular",
      "Giant's Halberd": "Regular/Thrust/Lightning",
      "Great Scythe": "Slash",
      "Halberd": "Regular/Thrust",
      "Lifehunt Scythe": "Slash",
      "Lucerne": "Thrust",
      "Scythe": "Slash",
      "Titanite Catch Pole": "Regular/Magic",

      "Blacksmith Giant Hammer": "Strike/Lightning",
      "Blacksmith Hammer": "Strike",
      "Club": "Strike",
      "Hammer of Vamos": "Strike/Fire",
      "Mace": "Strike",
      "Morning Star": "Strike",
      "Pickaxe": "Thrust",
      "Reinforced Club": "Strike",
      "Warpick": "Thrust",
      "Demon's Great Hammer": "Strike",
      "Dragon Tooth": "Strike",
      "Grant": "Strike/Magic",
      "Great Club": "Strike",
      "Large Club": "Strike",
      "Smough's Hammer": "Strike",

      "Bandit's Knife": "Slash",
      "Dagger": "Slash/Thrust",
      "Dark Silver Tracer": "Slash/Thrust",
      "Ghost Blade": "Slash/Thrust",
      "Parrying Dagger": "Slash/Thrust",
      "Priscilla's Dagger": "Slash",

      "Bare Fist": "Strike",
      "Caestus": "Strike",
      "Claw": "Slash",
      "Dark Hand": "Strike",
      "Dragon Bone Fist": "Strike",
      "Guardian Tail": "Regular",
      "Notched Whip": "Regular",
      "Whip": "Regular"
    };

    function getPhysicalType(baseName) {
      const s = DAMAGE_TYPES[baseName];
      if (!s) return 'regular';
      const parts = s.split('/');
      for (const part of parts) {
        const p = part.trim().toLowerCase();
        if (p === 'regular' || p === 'strike' || p === 'slash' || p === 'thrust') {
          return p;
        }
      }
      return 'regular';
    }

    // ---- UI: enemy inputs + boss + NG ----

    function createDefenseInputs(table) {
      if (document.getElementById('ds1-defense-container')) return;

      const box = document.createElement('div');
      box.id = 'ds1-defense-container';
      box.style.marginBottom = '10px';
      box.style.padding = '8px 10px';
      box.style.border = '1px solid #ccc';
      box.style.borderRadius = '4px';
      box.style.background = '#f9f9f9';
      box.style.display = 'inline-flex';
      box.style.flexWrap = 'wrap';
      box.style.gap = '12px';
      box.style.alignItems = 'center';

      const title = document.createElement('span');
      title.textContent = 'Boss/Enemy:';
      title.style.fontWeight = 'bold';
      title.style.marginRight = '10px';
      box.appendChild(title);

      // Boss dropdown
      const bossWrap = document.createElement('label');
      bossWrap.style.display = 'inline-flex';
      bossWrap.style.alignItems = 'center';
      bossWrap.style.gap = '4px';
      bossWrap.style.fontSize = '12px';

      const bossSelect = document.createElement('select');
      bossSelect.id = 'ds1-boss-select';
      bossSelect.style.padding = '1px 4px';
      bossSelect.style.border = '1px solid #ccc';
      bossSelect.style.borderRadius = '3px';
      bossSelect.style.fontSize = '12px';

      const optNone = document.createElement('option');
      optNone.value = '';
      optNone.textContent = 'Custom / Free Input';
      bossSelect.appendChild(optNone);

      Object.keys(BOSSES).forEach(key => {
        const b = BOSSES[key];
        if (!b || !b.name) return;
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = b.name;
        bossSelect.appendChild(opt);
      });

      bossWrap.appendChild(bossSelect);
      box.appendChild(bossWrap);

      // NG-cycle dropdown
      const ngWrap = document.createElement('label');
      ngWrap.style.display = 'inline-flex';
      ngWrap.style.alignItems = 'center';
      ngWrap.style.gap = '4px';
      ngWrap.style.fontSize = '12px';

      const ngSelect = document.createElement('select');
      ngSelect.id = 'ds1-ng-select';
      ngSelect.style.padding = '1px 4px';
      ngSelect.style.border = '1px solid #ccc';
      ngSelect.style.borderRadius = '3px';
      ngSelect.style.fontSize = '12px';

      NG_LABELS.forEach(label => {
        const opt = document.createElement('option');
        opt.value = label;
        opt.textContent = label;
        ngSelect.appendChild(opt);
      });

      ngWrap.appendChild(ngSelect);
      box.appendChild(ngWrap);

      // Boss info line
      const bossInfo = document.createElement('div');
      bossInfo.id = 'ds1-boss-info';
      bossInfo.style.fontSize = '11px';
      bossInfo.style.marginTop = '4px';
      bossInfo.style.width = '100%';
      bossInfo.style.flexBasis = '100%';
      box.appendChild(bossInfo);

      const defs = [
        { id: 'ds1-def-reg',    label: 'Regular' },
        { id: 'ds1-def-strike', label: 'Strike' },
        { id: 'ds1-def-slash',  label: 'Slash'  },
        { id: 'ds1-def-thrust', label: 'Thrust' },
        { id: 'ds1-def-magic',  label: 'Magic' },
        { id: 'ds1-def-fire',   label: 'Fire' },
        { id: 'ds1-def-light',  label: 'Lightning' },
        { id: 'ds1-aux-bleed',  label: 'Bleed' },
        { id: 'ds1-enemy-hp',   label: 'HP' },
        { id: 'ds1-bleed-percent', label: 'Bleed%' }
      ];

      defs.forEach(d => {
        const wrap = document.createElement('label');
        wrap.style.display = 'inline-flex';
        wrap.style.alignItems = 'center';
        wrap.style.gap = '4px';
        wrap.style.fontSize = '12px';

        const span = document.createElement('span');
        span.textContent = d.label + ':';
        wrap.appendChild(span);

        const input = document.createElement('input');
        input.id = d.id;
        input.type = 'text';
        input.value = d.id === 'ds1-bleed-percent' ? '30' : '0';
        input.style.width = '60px';
        input.style.padding = '1px 4px';
        input.style.border = '1px solid #ccc';
        input.style.borderRadius = '3px';
        input.style.textAlign = 'right';
        wrap.appendChild(input);

        box.appendChild(wrap);
      });

      // Chaos Demon checkbox
      const chaosDiv = document.createElement('div');
      chaosDiv.style.marginLeft = '12px';

      const chaosInput = document.createElement('input');
      chaosInput.id = 'ds1-chaos-bonus';
      chaosInput.type = 'checkbox';

      const chaosLabel = document.createElement('label');
      chaosLabel.htmlFor = 'ds1-chaos-bonus';
      chaosLabel.textContent = 'Chaos Demon (+20% w/ Black Knight weapons)';

      chaosDiv.appendChild(chaosInput);
      chaosDiv.appendChild(chaosLabel);
      box.appendChild(chaosDiv);

      // Occult-weak checkbox
      const occultDiv = document.createElement('div');
      occultDiv.style.marginLeft = '12px';

      const occultInput = document.createElement('input');
      occultInput.id = 'ds1-occult-weak';
      occultInput.type = 'checkbox';

      const occultLabel = document.createElement('label');
      occultLabel.htmlFor = 'ds1-occult-weak';
      occultLabel.textContent = 'Occult-weak (+20% w/ Occult weapons)';

      occultDiv.appendChild(occultInput);
      occultDiv.appendChild(occultLabel);
      box.appendChild(occultDiv);

      table.parentNode.insertBefore(box, table);

      function setBossInfo(bossKey, ngLabel) {
        const infoEl = document.getElementById('ds1-boss-info');
        if (!infoEl) return;
        if (!bossKey) {
          infoEl.textContent = '';
          return;
        }
        const boss = BOSSES[bossKey];
        if (!boss) {
          infoEl.textContent = '';
          return;
        }

        const hpMap = BOSS_HP_BY_NG[bossKey];
        let hpText = '';
        if (hpMap && ngLabel && hpMap[ngLabel] != null) {
          hpText = `HP (${ngLabel}): ${hpMap[ngLabel]}`;
        } else if (typeof boss.hp === 'number') {
          hpText = `HP: ${boss.hp}`;
        }

        const parts = [];
        parts.push(boss.name);
        if (hpText) parts.push(hpText);
        parts.push(`Phys: ${boss.reg}`);
        parts.push(`Slash: ${boss.slash}`);
        parts.push(`Strike: ${boss.strike}`);
        parts.push(`Thrust: ${boss.thrust}`);
        parts.push(`Magic: ${boss.magic}`);
        parts.push(`Fire: ${boss.fire}`);
        parts.push(`Lightning: ${boss.light}`);
        parts.push(`BleedRes: ${boss.bleedRes === Infinity ? '∞' : boss.bleedRes}`);
        parts.push(`Boss Bleed%: ${boss.bossBleedPercent ?? 10}`);
        if (boss.chaosDemon) {
          parts.push('Chaos Demon (+20% Black Knight dmg)');
        }
        if (boss.occultWeak) {
          parts.push('Occult-weak (+20% Occult dmg)');
        }

        infoEl.textContent = parts.join(' | ');
      }

      // Apply boss preset + NG to inputs
      function applyBossPreset(bossKey, ngLabel) {
        const boss = BOSSES[bossKey];
        if (!boss) {
          setBossInfo(null, null);
          return;
        }

        const setVal = (id, val) => {
          const el = document.getElementById(id);
          if (!el) return;
          el.value = (val != null ? String(val) : '0');
        };

        setVal('ds1-def-reg', boss.reg);
        setVal('ds1-def-strike', boss.strike);
        setVal('ds1-def-slash', boss.slash);
        setVal('ds1-def-thrust', boss.thrust);
        setVal('ds1-def-magic', boss.magic);
        setVal('ds1-def-fire', boss.fire);
        setVal('ds1-def-light', boss.light);
        setVal('ds1-aux-bleed', boss.bleedRes);

        // Fixed boss bleed cap (10%) unless overridden in data
        const bossBleedPercent = (typeof boss.bossBleedPercent === 'number') ? boss.bossBleedPercent : 10;
        setVal('ds1-bleed-percent', bossBleedPercent);

        // HP by NG
        let hpVal = boss.hp;
        const hpMap = BOSS_HP_BY_NG[bossKey];
        if (hpMap && ngLabel && hpMap[ngLabel] != null) {
          hpVal = hpMap[ngLabel];
        }
        if (hpVal != null) {
          setVal('ds1-enemy-hp', hpVal);
        }

        const chaosEl = document.getElementById('ds1-chaos-bonus');
        if (chaosEl) {
          chaosEl.checked = !!boss.chaosDemon;
        }

        const occultEl = document.getElementById('ds1-occult-weak');
        if (occultEl) {
          occultEl.checked = !!boss.occultWeak;
        }

        setBossInfo(bossKey, ngLabel);
      }

      const recalcDebounced = debounce(() => {
        const tbl = document.getElementById('weapon-table');
        if (!tbl) return;
        recalc(tbl);
        const dir = tbl.dataset.dpsSort;
        if (dir === 'asc' || dir === 'desc') {
          sortByDps(tbl, dir === 'asc');
        }
      }, 150);

      bossSelect.addEventListener('change', () => {
        const bossKey = bossSelect.value;
        const ngLabel = ngSelect.value;
        if (!bossKey) {
          setBossInfo(null, null);
        } else {
          applyBossPreset(bossKey, ngLabel);
        }
        recalcDebounced();
      });

      ngSelect.addEventListener('change', () => {
        const bossKey = bossSelect.value;
        const ngLabel = ngSelect.value;
        if (bossKey) {
          applyBossPreset(bossKey, ngLabel);
        }
        recalcDebounced();
      });

      defs.forEach(d => {
        const input = document.getElementById(d.id);
        if (!input) return;

        input.addEventListener('keydown', e => {
          const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
          if ((e.key >= '0' && e.key <= '9') || allowed.includes(e.key)) return;
          if (e.key === '-' && input.selectionStart === 0 && !input.value.includes('-')) return;
          e.preventDefault();
        });

        input.addEventListener('input', () => {
          const v = input.value;
          if (v === '' || v === '-') return;
          const n = parseFloat(v);
          input.value = isNaN(n) ? '0' : n.toString();
          recalcDebounced();
        });
      });

      chaosInput.addEventListener('change', () => {
        recalcDebounced();
      });

      occultInput.addEventListener('change', () => {
        recalcDebounced();
      });
    }

    function getEnemyValues() {
      function read(id) {
        const el = document.getElementById(id);
        if (!el) return 0;
        const n = parseFloat(el.value);
        return isNaN(n) ? 0 : n;
      }
      return {
        reg:          read('ds1-def-reg'),
        strike:       read('ds1-def-strike'),
        slash:        read('ds1-def-slash'),
        thrust:       read('ds1-def-thrust'),
        magic:        read('ds1-def-magic'),
        fire:         read('ds1-def-fire'),
        light:        read('ds1-def-light'),
        bleedRes:     read('ds1-aux-bleed'),
        hp:           read('ds1-enemy-hp'),
        bleedPercent: read('ds1-bleed-percent')
      };
    }

    function damageAfterDefense(atk, def) {
      atk = Math.max(0, atk);
      def = Math.max(0, def);

      if (atk <= 0) return 0;
      if (def <= 0) return atk;

      let dmg;
      if (atk < def) {
        dmg = 0.4 * (Math.pow(atk, 3) / Math.pow(def, 2))
            - 0.09 * (Math.pow(atk, 2) / def)
            + 0.1 * atk;
      } else {
        dmg = atk - 0.79 * def * Math.exp(-0.27 * def / atk);
      }

      if (!isFinite(dmg) || dmg < 0) return 0;
      return dmg;
    }

    function updateDpsHeaderArrow(table) {
      const th = table.querySelector('td.__dps_header');
      if (!th) return;
      const arrowSpan = th.querySelector('span.__dps_arrow');
      if (!arrowSpan) return;
      const dir = table.dataset.dpsSort || '';
      arrowSpan.textContent = dir === 'asc' ? '▲' : dir === 'desc' ? '▼' : '';
    }

    function sortByDps(table, asc) {
      const tbody = table.querySelector('tbody');
      if (!tbody) return;
      const rows = Array.from(tbody.querySelectorAll('tr'));

      rows.sort((a, b) => {
        const da = parseFloat((a.querySelector('td.__dps_cell') || {}).textContent || '');
        const db = parseFloat((b.querySelector('td.__dps_cell') || {}).textContent || '');

        const va = isNaN(da) ? -Infinity : da;
        const vb = isNaN(db) ? -Infinity : db;

        return asc ? va - vb : vb - va;
      });

      rows.forEach(r => tbody.appendChild(r));
    }

    function debounce(fn, wait) {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(null, args), wait);
      };
    }

    function parseValueFromCell(row, className) {
      const cell = row.querySelector('td.' + className);
      if (!cell) return 0;
      const inp = cell.querySelector('input');
      const raw = inp ? (inp.value || inp.getAttribute('value') || '').trim() : '';
      const n = parseFloat(raw);
      return isNaN(n) ? 0 : n;
    }

    function setupOnce() {
      const table = document.getElementById('weapon-table');
      if (!table) return null;
      if (table.dataset.ds1DpsInit === '1') return table;
      table.dataset.ds1DpsInit = '1';

      const thead = table.querySelector('thead');
      const tbody = table.querySelector('tbody');
      if (!thead || !tbody) return null;

      const headerRows = thead.querySelectorAll('tr');
      if (headerRows.length < 2) return null;
      const headerRow = headerRows[1];

      const th = document.createElement('td');
      th.className = '__dps_header';
      th.style.fontWeight = 'bold';
      th.style.cursor = 'pointer';

      const labelSpan = document.createElement('span');
      labelSpan.className = '__dps_label';
      labelSpan.textContent = 'DPS R1';

      const arrowSpan = document.createElement('span');
      arrowSpan.className = '__dps_arrow';
      arrowSpan.style.marginLeft = '4px';
      arrowSpan.style.fontSize = '0.8em';

      th.appendChild(labelSpan);
      th.appendChild(arrowSpan);
      headerRow.appendChild(th);

      table.dataset.dpsSort = '';

      th.addEventListener('click', () => {
        const current = table.dataset.dpsSort;
        const next = current === 'asc' ? 'desc' : 'asc';
        table.dataset.dpsSort = next;
        updateDpsHeaderArrow(table);
        sortByDps(table, next === 'asc');
      });

      return table;
    }

    function recalc(table) {
      const tbody = table.querySelector('tbody');
      if (!tbody) return;

      const grip = document.getElementById('grip');
      const isTwoHanded = grip ? grip.checked : false;

      const dpsHeader = table.querySelector('td.__dps_header');
      if (dpsHeader) {
        const labelSpan = dpsHeader.querySelector('span.__dps_label');
        if (labelSpan) {
          labelSpan.textContent = isTwoHanded ? 'DPS 2H R1' : 'DPS 1H R1';
        }
      }

      const env = getEnemyValues();
      const chaosEl = document.getElementById('ds1-chaos-bonus');
      const chaosBonusOn = !!(chaosEl && chaosEl.checked);

      const occultEl = document.getElementById('ds1-occult-weak');
      const occultWeakOn = !!(occultEl && occultEl.checked);

      const bossSelect = document.getElementById('ds1-boss-select');
      const currentBossKey = bossSelect ? bossSelect.value : '';
      const isBossContext = !!(currentBossKey && BOSSES[currentBossKey]);

      const rows = tbody.querySelectorAll('tr');
      rows.forEach(row => {
        const cells = row.children;
        if (!cells.length) return;
        if (cells[0].classList.contains('group')) return;

        const rawName = (cells[0].textContent || '').trim();
        const baseName = findBaseWeapon(rawName);
        const apsSet = baseName ? APS_BY_WEAPON[baseName] : null;

        let dpsCell = row.querySelector('td.__dps_cell');
        if (!dpsCell) {
          dpsCell = document.createElement('td');
          dpsCell.className = '__dps_cell';
          row.appendChild(dpsCell);
        }
        dpsCell.textContent = '';

        if (!apsSet) return;

        const aps = isTwoHanded ? apsSet['2H_R1'] : apsSet['1H_R1'];
        if (aps == null || aps <= 0) return;

        const physAtk = parseValueFromCell(row, 'physical-atk');
        const magAtk  = parseValueFromCell(row, 'magic-atk');
        const fireAtk = parseValueFromCell(row, 'fire-atk');
        const lghtAtk = parseValueFromCell(row, 'lightning-atk');

        if (physAtk + magAtk + fireAtk + lghtAtk <= 0) return;

        const physType = getPhysicalType(baseName);
        let physDef = env.reg;
        if (physType === 'strike') physDef = env.strike;
        else if (physType === 'slash') physDef = env.slash;
        else if (physType === 'thrust') physDef = env.thrust;

        let dph = 0;
        if (physAtk > 0) dph += damageAfterDefense(physAtk, physDef);
        if (magAtk  > 0) dph += damageAfterDefense(magAtk,  env.magic);
        if (fireAtk > 0) dph += damageAfterDefense(fireAtk, env.fire);
        if (lghtAtk > 0) dph += damageAfterDefense(lghtAtk, env.light);

        if (dph <= 0) return;

        let totalDps = dph * aps;

        // ---- Bleed DPS ----
        const bleedAux = parseValueFromCell(row, 'bleed-aux');

        let effectiveBleedPercent = env.bleedPercent;

        if (isBossContext) {
          const boss = BOSSES[currentBossKey];
          if (boss && typeof boss.bossBleedPercent === 'number') {
            effectiveBleedPercent = boss.bossBleedPercent;
          } else {
            effectiveBleedPercent = 10;
          }
        } else {
          if (baseName && Object.prototype.hasOwnProperty.call(BLEED_PERCENT_BY_WEAPON, baseName)) {
            effectiveBleedPercent = BLEED_PERCENT_BY_WEAPON[baseName];
          }
        }

        if (
          bleedAux > 0 &&
          env.bleedRes > 0 &&
          env.hp > 0 &&
          effectiveBleedPercent > 0
        ) {
          const hitsToBleed = Math.max(1, env.bleedRes / bleedAux);
          if (isFinite(hitsToBleed) && hitsToBleed > 0) {
            const bleedDamage = env.hp * (effectiveBleedPercent / 100);
            const bleedDps = bleedDamage * aps / hitsToBleed;
            if (isFinite(bleedDps) && bleedDps > 0) {
              totalDps += bleedDps;
            }
          }
        }

        // ---- Chaos Demon BK bonus ----
        if (chaosBonusOn && baseName && BLACK_KNIGHT_WEAPONS[baseName]) {
          totalDps *= CHAOS_DEMON_MULT;
        }

        // ---- Occult-weak bonus (requires Occult weapon) ----
        const occultAux = parseValueFromCell(row, 'occult-aux');
        if (occultWeakOn && occultAux > 0) {
          totalDps *= OCCULT_WEAK_MULT;
        }

        dpsCell.textContent = totalDps.toFixed(2);
      });

      updateDpsHeaderArrow(table);
    }

    const waitInterval = setInterval(() => {
      const table = document.getElementById('weapon-table');
      const tbody = table && table.querySelector('tbody');
      if (table && tbody && tbody.querySelector('tr')) {
        clearInterval(waitInterval);
        const readyTable = setupOnce();
        if (!readyTable) return;

        createDefenseInputs(readyTable);

        setInterval(() => recalc(readyTable), 1000);

        const grip = document.getElementById('grip');
        if (grip) {
          grip.addEventListener('change', () => recalc(readyTable));
        }

        recalc(readyTable);
      }
    }, 300);
  });
})();
