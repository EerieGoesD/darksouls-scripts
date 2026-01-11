// ==UserScript==
// @name         DS3 Weapon DPS Column with Real-Time Elemental Absorption and Sorting
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Adds a DPS column to the Dark Souls 3 weapons table, handles both one-handed and two-handed grips, allows real-time input of enemy elemental absorption percentages, and enables sorting of weapons by DPS.
// @match        https://soulsplanner.com/darksouls3/weaponatk
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const SELECTORS = {
        weaponTable: '#weapon-table',
        twoHandedCheckbox: '#grip',
    };

    const bpmMap = {
        oneHanded: {
            "Daggers": 150,
            "Thrusting Swords": 100,
            "Straight Swords": 100,
            "Curved Swords": 90,
            "Axes": 90,
            "Fists": 90,
            "Claws": 87,
            "Katanas": 82,
            "Spears": 75,
            "Pikes": 67,
            "Hammers": 67,
            "Halberds": 67,
            "Greatswords": 65,
            "Curved Greatswords": 62,
            "Reapers": 62,
            "Greataxes": 47,
            "Ultra Greatswords": 47,
            "Whips": 45,
            "Great Hammers": 40
        },
        twoHanded: {
            "Daggers": 120,
            "Curved Swords": 100,
            "Pierce Swords (rapiers)": 90,
            "Fists": 90,
            "Axes": 90,
            "Straight Swords": 86,
            "Claws": 86,
            "Katanas": 80,
            "Spears": 75,
            "Pikes": 75,
            "Hammers": 70,
            "Halberds": 62,
            "Curved Greatswords": 62,
            "Reapers": 62,
            "Greatswords": 58,
            "Ultra Greatswords": 50,
            "Greataxes": 46,
            "Great Hammers": 46,
            "Whips": 45
        }
    };

    // Debounce function to limit the rate of function execution
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Function to create absorption input fields
    function createAbsorptionInputs(container) {
        const absorptionContainer = document.createElement('div');
        absorptionContainer.id = 'elemental-absorption-container';
        absorptionContainer.style.marginBottom = '10px';
        absorptionContainer.style.padding = '10px';
        absorptionContainer.style.border = '1px solid #ccc';
        absorptionContainer.style.borderRadius = '5px';
        absorptionContainer.style.backgroundColor = '#f9f9f9';
        absorptionContainer.style.display = 'flex';
        absorptionContainer.style.flexWrap = 'wrap';
        absorptionContainer.style.gap = '15px';

        const title = document.createElement('h3');
        title.textContent = 'Elemental Absorption (%)';
        title.style.margin = '0 0 10px 0';
        absorptionContainer.appendChild(title);

        const elements = ['Magic', 'Fire', 'Lightning', 'Dark'];
        elements.forEach(element => {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';

            const label = document.createElement('label');
            label.textContent = `${element}: `;
            label.setAttribute('for', `absorption-${element.toLowerCase()}`);
            label.style.marginRight = '5px';
            wrapper.appendChild(label);

            const input = document.createElement('input');
            input.type = 'text';
            input.min = '-100';
            input.max = '100';
            input.value = '0';
            input.id = `absorption-${element.toLowerCase()}`;
            input.style.width = '60px';
            input.style.marginRight = '5px';
            input.style.padding = '2px 5px';
            input.style.border = '1px solid #ccc';
            input.style.borderRadius = '3px';
            wrapper.appendChild(input);

            const percentSpan = document.createElement('span');
            percentSpan.textContent = '%';
            wrapper.appendChild(percentSpan);

            absorptionContainer.appendChild(wrapper);
        });

        container.parentNode.insertBefore(absorptionContainer, container);
    }

    // Function to retrieve and clamp absorption values
    function getAbsorptionValues() {
        const magicAbsRaw = document.getElementById('absorption-magic')?.value || '0';
        const fireAbsRaw = document.getElementById('absorption-fire')?.value || '0';
        const lightningAbsRaw = document.getElementById('absorption-lightning')?.value || '0';
        const darkAbsRaw = document.getElementById('absorption-dark')?.value || '0';

        const magicAbs = parseFloat(magicAbsRaw) || 0;
        const fireAbs = parseFloat(fireAbsRaw) || 0;
        const lightningAbs = parseFloat(lightningAbsRaw) || 0;
        const darkAbs = parseFloat(darkAbsRaw) || 0;

        return {
            magic: Math.min(Math.max(magicAbs, -100), 100),
            fire: Math.min(Math.max(fireAbs, -100), 100),
            lightning: Math.min(Math.max(lightningAbs, -100), 100),
            dark: Math.min(Math.max(darkAbs, -100), 100)
        };
    }

    // Function to parse input values from attack cells
    function parseInputValue(cell) {
        if (!cell) return 0;
        const inp = cell.querySelector('input');
        if (!inp || !inp.value) return 0;
        return parseFloat(inp.value) || 0;
    }

    // Variable to track sort order
    let dpsSortAsc = true;

    // Function to check if Two-handed is active
    function isTwoHanded() {
        const twoHandedCheckbox = document.querySelector(SELECTORS.twoHandedCheckbox);
        if (!twoHandedCheckbox) {
            console.warn('Two-handed checkbox not found with selector:', SELECTORS.twoHandedCheckbox);
            return false;
        }
        const isActive = twoHandedCheckbox.checked;
        console.log(`Two-handed state: ${isActive ? 'ON' : 'OFF'}`);
        return isActive;
    }

    // Function to calculate DPS for each weapon
    function calculateDPS() {
        const weaponTable = document.querySelector(SELECTORS.weaponTable);
        if (!weaponTable) {
            console.warn('Weapon table not found with selector:', SELECTORS.weaponTable);
            return;
        }

        const absorption = getAbsorptionValues();
        let dpsHeader = weaponTable.querySelector('thead tr:last-child td.dps');
        if (!dpsHeader) {
            const theadRow = weaponTable.querySelector('thead tr:last-child');
            if (theadRow) {
                dpsHeader = document.createElement('td');
                dpsHeader.className = 'dps';
                dpsHeader.dataset.field = 'dps';
                dpsHeader.textContent = 'DPS';
                dpsHeader.style.cursor = 'pointer';
                dpsHeader.style.userSelect = 'none';
                theadRow.appendChild(dpsHeader);
            }
        }

        if (dpsHeader && !dpsHeader.dataset.sortAdded) {
            dpsHeader.addEventListener('click', () => {
                sortByDPS(weaponTable);
            });
            dpsHeader.dataset.sortAdded = 'true';
        }

        // Determine the current grip state
        const twoHanded = isTwoHanded();
        const currentBpmMap = twoHanded ? bpmMap.twoHanded : bpmMap.oneHanded;

        let currentGroup = null;
        const rows = weaponTable.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const groupCell = row.querySelector('td.group');
            if (groupCell) {
                currentGroup = groupCell.textContent.trim();
                return;
            }

            const nameCell = row.querySelector('td.name');
            if (!nameCell) return;

            let bpm = currentBpmMap[currentGroup] || 0;

            const physical = parseInputValue(row.querySelector('.physical-atk'));
            const magic = parseInputValue(row.querySelector('.magic-atk'));
            const fire = parseInputValue(row.querySelector('.fire-atk'));
            const lightning = parseInputValue(row.querySelector('.lightning-atk'));
            const dark = parseInputValue(row.querySelector('.dark-atk'));

            const adjustedMagic = magic * (1 - absorption.magic / 100);
            const adjustedFire = fire * (1 - absorption.fire / 100);
            const adjustedLightning = lightning * (1 - absorption.lightning / 100);
            const adjustedDark = dark * (1 - absorption.dark / 100);

            const totalAtk = physical + adjustedMagic + adjustedFire + adjustedLightning + adjustedDark;

            let dps = 0;
            if (bpm > 0 && totalAtk > 0) {
                dps = (totalAtk * bpm / 60).toFixed(0);
            }

            let dpsCell = row.querySelector('td.dps');
            if (!dpsCell) {
                dpsCell = document.createElement('td');
                dpsCell.className = 'dps';
                dpsCell.style.textAlign = 'right';
                dpsCell.style.paddingRight = '10px';
                const inp = document.createElement('input');
                inp.type = 'text';
                inp.disabled = true;
                inp.style.width = '60px';
                inp.style.textAlign = 'right';
                inp.style.border = 'none';
                inp.style.background = 'transparent';
                inp.style.fontWeight = 'bold';
                dpsCell.appendChild(inp);
                row.appendChild(dpsCell);
            }

            const input = dpsCell.querySelector('input');
            input.value = dps > 0 ? dps : '';
        });
    }

    // Function to sort weapons by DPS
    function sortByDPS(weaponTable) {
        const tbody = weaponTable.querySelector('tbody');
        if (!tbody) {
            console.warn('Weapon table body not found.');
            return;
        }

        const rows = Array.from(tbody.querySelectorAll('tr'));
        const groups = [];
        let currentGroup = null;
        let groupRows = [];

        rows.forEach(row => {
            const groupCell = row.querySelector('td.group');
            if (groupCell) {
                if (currentGroup !== null) {
                    groups.push({ group: currentGroup, rows: groupRows });
                }
                currentGroup = groupCell.textContent.trim();
                groupRows = [];
            } else {
                groupRows.push(row);
            }
        });
        if (currentGroup !== null) {
            groups.push({ group: currentGroup, rows: groupRows });
        }

        groups.forEach(group => {
            group.rows.sort((a, b) => {
                const aDPS = parseFloat(a.querySelector('td.dps input')?.value) || 0;
                const bDPS = parseFloat(b.querySelector('td.dps input')?.value) || 0;
                if (dpsSortAsc) {
                    return aDPS - bDPS;
                } else {
                    return bDPS - aDPS;
                }
            });
        });

        // Clear existing tbody
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }

        // Append sorted groups back to tbody
        groups.forEach(group => {
            const groupRow = document.createElement('tr');
            const groupCell = document.createElement('td');
            groupCell.className = 'group';
            // Determine colspan based on existing table structure
            const colspan = weaponTable.querySelector('thead tr:last-child td').colSpan || 1;
            groupCell.colSpan = colspan;
            groupCell.textContent = group.group;
            groupRow.appendChild(groupCell);
            tbody.appendChild(groupRow);

            group.rows.forEach(row => {
                tbody.appendChild(row);
            });
        });

        // Toggle sort order for next sort
        dpsSortAsc = !dpsSortAsc;
        updateDPSHeader(weaponTable);
    }

    // Function to update the DPS header with sort indicators
    function updateDPSHeader(weaponTable) {
        const dpsHeader = weaponTable.querySelector('thead tr:last-child td.dps');
        if (!dpsHeader) {
            console.warn('DPS header not found.');
            return;
        }

        // Clear existing content
        dpsHeader.textContent = 'DPS';

        // Add sort indicator
        const sortIndicator = document.createElement('span');
        sortIndicator.style.marginLeft = '5px';
        sortIndicator.style.fontSize = '0.8em';
        sortIndicator.textContent = dpsSortAsc ? '↑' : '↓';
        dpsHeader.appendChild(sortIndicator);
    }

    // Initialize the script after the page has fully loaded
    window.addEventListener('load', () => {
        const weaponTable = document.querySelector(SELECTORS.weaponTable);
        if (!weaponTable) {
            console.warn('Weapon table not found with selector:', SELECTORS.weaponTable);
            return;
        }

        // Create absorption inputs
        createAbsorptionInputs(weaponTable);
        calculateDPS();

        const debouncedCalculateDPS = debounce(() => {
            calculateDPS();
            sortByDPS(weaponTable);
        }, 100);

        // Observe changes to the weapon table (e.g., when weapons are updated)
        const tableObserver = new MutationObserver(() => {
            calculateDPS();
        });
        tableObserver.observe(weaponTable, { childList: true, subtree: true });

        // Set up event listener for the Two-handed checkbox
        const twoHandedCheckbox = document.querySelector(SELECTORS.twoHandedCheckbox);
        if (twoHandedCheckbox) {
            twoHandedCheckbox.addEventListener('change', () => {
                console.log('Two-handed toggle changed.');
                calculateDPS();
                sortByDPS(weaponTable);
            });
        } else {
            console.warn('Two-handed checkbox not found with selector:', SELECTORS.twoHandedCheckbox);
        }

        // Set up event listeners for absorption inputs
        const absorptionInputs = ['absorption-magic', 'absorption-fire', 'absorption-lightning', 'absorption-dark'];

        absorptionInputs.forEach(id => {
            const input = document.getElementById(id);
            if (!input) {
                console.warn(`Absorption input not found with ID: ${id}`);
                return;
            }

            // Keydown: Allow digits, one leading dash, backspace, delete, arrows
            input.addEventListener('keydown', (e) => {
                const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
                if (
                    (e.key >= '0' && e.key <= '9') ||
                    allowedKeys.includes(e.key)
                ) {
                    return;
                }

                // Allow leading dash if it's at the start and no other dash is present
                if (e.key === '-' && input.selectionStart === 0 && !input.value.includes('-')) {
                    return;
                }

                e.preventDefault();
            });

            // On input, parse and clamp if valid number
            input.addEventListener('input', () => {
                const val = input.value;
                // If value is just '-' or empty, don't parse yet
                if (val === '' || val === '-') return;

                const num = parseFloat(val);
                if (isNaN(num)) {
                    // If it's not a valid number, reset to last valid value or 0
                    input.value = '0';
                } else {
                    // Clamp
                    input.value = Math.min(Math.max(num, -100), 100).toString();
                }

                debouncedCalculateDPS();
            });
        });
    });
})();
