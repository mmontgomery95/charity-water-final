// Import country data
import { allCountries, countryPeople } from './gameData.js';
// Game State
const gameState = {
    digPoints: 0,
    currentWellProgress: 0,
    wellsCompleted: 0,
    clickPower: 1,
    digsPerSecond: 0,
    wellCost: 1000,
    difficulty: null, // 'easy', 'normal', 'hard'
    upgrades: [
        {
            id: 'shovel',
            name: '🔨 Better Shovel',
            cost: 100,
            owned: 0,
            effect: null // handled in recalc
        },
        {
            id: 'volunteer',
            name: '👷 Volunteer',
            cost: 250,
            owned: 0,
            effect: null
        },
        {
            id: 'drill',
            name: '⛏️ Drill Equipment',
            cost: 500,
            owned: 0,
            effect: null
        },
        {
            id: 'grant',
            name: '💰 Funding Grant',
            cost: 1000,
            owned: 0,
            effect: null
        }
    ],
    countries: [], // Will be set and randomized at game start
    gameCompleted: false
};

// Difficulty settings
const difficultySettings = {
    easy: {
        wellCost: 500,
        scaling: {
            shovel: { base: 80, growth: 1.35 },
            volunteer: { base: 180, growth: 1.45 },
            drill: { base: 350, growth: 1.55 },
            grant: { base: 700, growth: 1.65 }
        },
        wellGrowth: 1.7,
        wellsRequired: 7
    },
    normal: {
        wellCost: 1000,
        scaling: {
            shovel: { base: 100, growth: 1.55 },
            volunteer: { base: 250, growth: 1.65 },
            drill: { base: 500, growth: 1.75 },
            grant: { base: 1000, growth: 1.85 }
        },
        wellGrowth: 2.2,
        wellsRequired: 12
    },
    hard: {
        wellCost: 2000,
        scaling: {
            shovel: { base: 120, growth: 1.75 },
            volunteer: { base: 350, growth: 1.85 },
            drill: { base: 700, growth: 2.0 },
            grant: { base: 1400, growth: 2.15 }
        },
        wellGrowth: 2.7,
        wellsRequired: 21
    }
};

// DOM Elements
const coinPopup = document.getElementById('coin-emoji-popup');
const digButton = document.getElementById('digButton');
const digPointsEl = document.getElementById('digPoints');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const wellsCompletedEl = document.getElementById('wellsCompleted');
const peopleHelpedEl = document.getElementById('peopleHelped');
const digsPerSecondEl = document.getElementById('digsPerSecond');
const clickPowerEl = document.getElementById('clickPower');
const upgradesContainer = document.getElementById('upgradesContainer');
const wellsGrid = document.getElementById('wellsGrid');
const resetButton = document.getElementById('resetButton');

if (resetButton) {
    resetButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset your progress?')) {
            localStorage.removeItem('wellBuilderSave');
            // Reset all game state fields
            gameState.digPoints = 0;
            gameState.currentWellProgress = 0;
            gameState.wellsCompleted = 0;
            gameState.clickPower = 1;
            gameState.digsPerSecond = 0;
            gameState.difficulty = null;
            // Set wellCost and upgrades to default (difficulty will set after prompt)
            gameState.wellCost = 1000;
            gameState.upgrades.forEach(upg => {
                upg.owned = 0;
                upg.cost = 100;
            });
            wellsGrid.innerHTML = '';
            recalcUpgrades();
            updateDisplay();
            renderUpgrades();
            showDifficultyPrompt();
        }
    });
}

// Show difficulty selection modal
function showDifficultyPrompt() {
    // Always show prompt if difficulty is not set or is null/undefined
    if (gameState.difficulty === 'easy' || gameState.difficulty === 'normal' || gameState.difficulty === 'hard') return;
    const modal = document.createElement('div');
    modal.id = 'difficulty-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0'; modal.style.left = '0';
    modal.style.width = '100vw'; modal.style.height = '100vh';
    modal.style.display = 'flex'; modal.style.alignItems = 'center'; modal.style.justifyContent = 'center';
    modal.style.zIndex = '9999';
    modal.innerHTML = `
        <div style="background: #fff; padding: 32px 40px; border-radius: 12px; text-align: center; box-shadow: 0 2px 24px #0002;">
            <h2>Choose Difficulty</h2>
            <p style="margin-bottom: 18px;">How challenging do you want your well-building journey to be?</p>
            <button id="easyBtn" style="margin: 8px; padding: 10px 24px; font-size: 16px;">Easy</button>
            <button id="normalBtn" style="margin: 8px; padding: 10px 24px; font-size: 16px;">Normal</button>
            <button id="hardBtn" style="margin: 8px; padding: 10px 24px; font-size: 16px;">Hard</button>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('easyBtn').onclick = () => selectDifficulty('easy');
    document.getElementById('normalBtn').onclick = () => selectDifficulty('normal');
    document.getElementById('hardBtn').onclick = () => selectDifficulty('hard');
}

function selectDifficulty(diff) {
    gameState.difficulty = diff;
    // Set initial well cost and upgrades
    const settings = difficultySettings[diff];
    gameState.wellCost = settings.wellCost;
    gameState.upgrades.forEach(upg => {
        upg.owned = 0;
        if (settings.scaling[upg.id]) {
            upg.cost = settings.scaling[upg.id].base;
        }
    });
    // Set countries for this game: randomize and slice to wellsRequired
    const shuffled = [...allCountries].sort(() => Math.random() - 0.5);
    gameState.countries = shuffled.slice(0, settings.wellsRequired);
    document.getElementById('difficulty-modal').remove();
    recalcUpgrades();
    updateDisplay();
    renderUpgrades();
    // Save difficulty
    localStorage.setItem('wellBuilderSave', JSON.stringify(gameState));
}

// Dig Button Click
digButton.addEventListener('click', () => {
    addDigs(gameState.clickPower);
});

// Add digs function
function addDigs(amount) {
    gameState.digPoints += amount;
    gameState.currentWellProgress += amount;
    // Check if well is completed
    if (gameState.currentWellProgress >= gameState.wellCost) {
        completeWell();
    }
    updateDisplay();
    renderUpgrades(); // Ensure upgrades update in real-time
}

// Complete Well
function completeWell() {
    gameState.wellsCompleted++;
    gameState.currentWellProgress = 0;
    // Add a special auto-dig upgrade for this well if not already added
    if (!gameState.upgrades.some(upg => upg.id === `auto${gameState.wellsCompleted}`)) {
        const country = gameState.countries[(gameState.wellsCompleted - 1) % gameState.countries.length];
        gameState.upgrades.push({
            id: `auto${gameState.wellsCompleted}`,
            name: `🤝 Helpers from ${country}`,
            cost: 0, // Ensure helpers upgrades are always free
            owned: 0,
            effect: 'auto-dig',
            available: true
        });
    }
    // Difficulty-based well cost scaling
    const diff = gameState.difficulty || 'normal';
    gameState.wellCost = Math.floor(gameState.wellCost * difficultySettings[diff].wellGrowth);

    // Add well to grid
    const countryIndex = (gameState.wellsCompleted - 1) % gameState.countries.length;
    const country = gameState.countries[countryIndex];
    const people = countryPeople[country] || 500;
    const wellCard = document.createElement('div');
    wellCard.className = 'well-card well-complete-animate';
    wellCard.innerHTML = `
        <img src="images/jerry-can.png" alt="Jerry Can" />
        <h3>${country}</h3>
        <p>${people.toLocaleString()} people served</p>
    `;
    wellsGrid.appendChild(wellCard);
    // Remove animation class after animation
    setTimeout(() => {
        wellCard.classList.remove('well-complete-animate');
    }, 700);

    // Check for all wells completed (arbitrary: 8 countries = 8 wells)
        if (gameState.wellsCompleted >= gameState.countries.length) {
            gameState.gameCompleted = true;
            showCongratulations();
        } else {
            animateWaterEmojis();
        }

    function showCongratulations() {
        // Show a modal or overlay
        const modal = document.createElement('div');
        modal.id = 'congrats-modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.7)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '99999';
        modal.innerHTML = `
            <div style="background: #fff; padding: 40px 60px; border-radius: 16px; text-align: center; box-shadow: 0 2px 32px #0004; max-width: 420px;">
                <h2>🎉 Congratulations! 🎉</h2>
                <p style="font-size:1.2rem; margin: 18px 0 24px 0;">You have built a well in every country!<br><br>Thank you for helping us to build wells in <b>${gameState.countries.length}</b> countries and helping <b>${(() => {
                    let total = 0;
                    for (let i = 0; i < gameState.countries.length; i++) {
                        const country = gameState.countries[i];
                        total += countryPeople[country] || 500;
                    }
                    return total.toLocaleString();
                })()}</b> people.</p>
                <button id="closeCongratsBtn" style="margin-top:18px; padding:10px 28px; font-size:16px; background:#2e9df7; color:#fff; border:none; border-radius:6px; cursor:pointer;">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('closeCongratsBtn').onclick = function() {
            modal.remove();
        };
    }
}


// Animate water emojis around the well visualization
function animateWaterEmojis() {
    const container = document.getElementById('water-emoji-container');
    if (!container) return;
    container.innerHTML = '';
    const emoji = '💧';
    const count = 12;
    for (let i = 0; i < count; i++) {
        const span = document.createElement('span');
        span.textContent = emoji;
        span.style.position = 'absolute';
        const angle = (2 * Math.PI * i) / count;
        const radius = 80;
        const x = 110 + Math.cos(angle) * radius;
        const y = 110 + Math.sin(angle) * radius;
        span.style.left = `${x - 16}px`;
        span.style.top = `${y - 16}px`;
        span.style.fontSize = '2rem';
        span.style.opacity = '0';
        span.style.transition = 'opacity 0.3s, transform 1s';
        container.appendChild(span);
        setTimeout(() => {
            span.style.opacity = '1';
            span.style.transform = 'scale(1.3)';
        }, 50 + i * 60);
        setTimeout(() => {
            span.style.opacity = '0';
            span.style.transform = 'scale(0.7)';
        }, 1200 + i * 30);
    }
    setTimeout(() => {
        container.innerHTML = '';
    }, 1800);
}

// Buy Upgrade
function buyUpgrade(upgradeIndex) {
    const upgrade = gameState.upgrades[upgradeIndex];
    if (gameState.digPoints >= upgrade.cost || upgrade.cost === 0) {
        if (upgrade.cost > 0) {
            gameState.digPoints -= upgrade.cost;
        }
        upgrade.owned++;
        // Play waterdrop sound for all upgrades, including auto-dig
        const waterdropAudio = document.getElementById('waterdropSound');
        if (waterdropAudio) {
            waterdropAudio.currentTime = 0;
            waterdropAudio.play();
        }
        // Only scale price for non-auto-dig upgrades
        if (upgrade.effect !== 'auto-dig') {
            const diff = gameState.difficulty || 'normal';
            const scale = difficultySettings[diff].scaling[upgrade.id];
            upgrade.cost = Math.round(scale.base * Math.pow(scale.growth, upgrade.owned));
        } else {
            upgrade.cost = 0; // Always free for helpers
        }
        recalcUpgrades();
        updateDisplay();
        renderUpgrades();
    }
}

function recalcUpgrades() {
    // Reset to base values
    gameState.clickPower = 1;
    gameState.digsPerSecond = 0;
    // Apply all upgrades with scaling
    gameState.upgrades.forEach(upg => {
        if (upg.owned >= 0) {
            if (upg.id === 'shovel') {
                for (let i = 1; i <= upg.owned; i++) gameState.clickPower += i;
            }
            if (upg.id === 'volunteer') {
                for (let i = 1; i <= upg.owned; i++) gameState.digsPerSecond += i;
            }
            if (upg.id === 'drill') {
                for (let i = 1; i <= upg.owned; i++) gameState.digsPerSecond += i * 5;
            }
            if (upg.id === 'grant') {
                for (let i = 1; i <= upg.owned; i++) gameState.clickPower += i * 10;
            }
            // Auto-dig upgrade: +5 dig/sec per well completed
            if (upg.effect === 'auto-dig' && upg.owned > 0) {
                gameState.digsPerSecond += 15;
            }
        }
    });
}

// Render Upgrades
function renderUpgrades() {
    upgradesContainer.innerHTML = '';
    gameState.upgrades.forEach((upgrade, index) => {
        // Only show auto-dig upgrade if it is available, not owned, and the corresponding well has been completed
        if (upgrade.effect === 'auto-dig') {
            // Extract well number from id, e.g., "auto3" -> 3
            const match = /^auto(\d+)$/.exec(upgrade.id);
            const wellNum = match ? parseInt(match[1], 10) : null;
            // Always set cost to 0 for helpers upgrades
            upgrade.cost = 0;
            if (
                !upgrade.available ||
                upgrade.owned > 0 ||
                wellNum === null ||
                gameState.wellsCompleted < wellNum
            ) return;
        }
        const canAfford = gameState.digPoints >= upgrade.cost;
        const nextOwned = upgrade.owned + 1;
        let nextEffect = '';
        if (upgrade.id === 'shovel') {
            nextEffect = `Next: +${nextOwned} dig per click`;
        } else if (upgrade.id === 'volunteer') {
            nextEffect = `Next: +${nextOwned} dig per second`;
        } else if (upgrade.id === 'drill') {
            nextEffect = `Next: +${nextOwned * 5} dig per second`;
        } else if (upgrade.id === 'grant') {
            nextEffect = `Next: +${nextOwned * 10} dig per click`;
        } else if (upgrade.effect === 'auto-dig') {
            nextEffect = `+15 dig per second`;
        }
        const upgradeDiv = document.createElement('div');
        upgradeDiv.className = 'upgrade-item';
        upgradeDiv.innerHTML = `
            <div class="upgrade-header">
                <span><strong>${upgrade.name}</strong></span>
                <span style="background: #159a48; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${upgrade.cost} pts</span>
            </div>
            <p style="font-size: 12px; color: #2e9df7; margin-bottom: 8px;">${nextEffect}</p>
            <p style="font-size: 11px; color: #999; margin-bottom: 8px;">Owned: ${upgrade.owned}</p>
        `;
        const button = document.createElement('button');
        button.className = 'upgrade-button';
        button.textContent = 'Purchase';
    // Always enable button for cost 0 upgrades (auto-dig)
    if (!canAfford && upgrade.cost > 0) button.disabled = true;
        button.addEventListener('click', () => {
            buyUpgrade(index);
            // Animate the button itself
            button.classList.add('animate');
            setTimeout(() => {
                button.classList.remove('animate');
            }, 700);
        });
        upgradeDiv.appendChild(button);
        upgradesContainer.appendChild(upgradeDiv);
    });
}

// Update Display
function updateDisplay() {
    digPointsEl.textContent = Math.floor(gameState.digPoints);
    wellsCompletedEl.textContent = gameState.wellsCompleted;
    // Sum people helped for completed wells
    let totalHelped = 0;
    for (let i = 0; i < gameState.wellsCompleted; i++) {
        const country = gameState.countries[i];
        totalHelped += countryPeople[country] || 500;
    }
    peopleHelpedEl.textContent = totalHelped.toLocaleString();
    digsPerSecondEl.textContent = gameState.digsPerSecond;
    clickPowerEl.textContent = `+${gameState.clickPower} dig per click`;
    // Update progress bar
    const progressPercent = (gameState.currentWellProgress / gameState.wellCost) * 100;
    progressBar.style.width = progressPercent + '%';
    progressText.textContent = `${Math.floor(gameState.currentWellProgress)} / ${gameState.wellCost} digs`;

    // Well.svg progress logic
    const wellSvg = document.getElementById('wellSvg');
    if (wellSvg) {
        // Opacity from 0.0 (start) to 0.7 (complete)
        wellSvg.style.opacity = 0.0 + 0.7 * (progressPercent / 100);
    }
}

// Auto-digging (passive income)
setInterval(() => {
    if (gameState.digsPerSecond > 0) {
        addDigs(gameState.digsPerSecond);
    } else {
        // Even if no passive, still update upgrades for UI responsiveness
        renderUpgrades();
    }
}, 1000);

// Save game every 5 seconds
setInterval(() => {
    localStorage.setItem('wellBuilderSave', JSON.stringify(gameState));
}, 5000);

// Load saved game
function loadGame() {
    const saved = localStorage.getItem('wellBuilderSave');
    if (saved) {
        const savedState = JSON.parse(saved);
        Object.assign(gameState, savedState);
        // If difficulty not set, prompt
        if (!gameState.difficulty) {
            showDifficultyPrompt();
            return;
        }
        recalcUpgrades();
        // Rebuild wells grid
        for (let i = 0; i < gameState.wellsCompleted; i++) {
            const countryIndex = i % gameState.countries.length;
            const country = gameState.countries[countryIndex];
            const people = gameState.countryPeople[country] || 500;
            const wellCard = document.createElement('div');
            wellCard.className = 'well-card';
            wellCard.innerHTML = `
                <img src="images/jerry-can.png" alt="Jerry Can" />
                <h3>${country}</h3>
                <p>${people.toLocaleString()} people served</p>
            `;
            wellsGrid.appendChild(wellCard);
        }
            if (gameState.gameCompleted) {
                showCongratulations();
            }
    } else {
        showDifficultyPrompt();
    }
}

// Initialize game
// Coin popup logic
function showCoinPopup() {
    if (!coinPopup) return;
    if (coinPopup.style.animation && coinPopup.style.animation !== 'none') return; // Only one at a time
    // Random position (avoid edges)
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const x = Math.random() * (vw - 80) + 40;
    const y = Math.random() * (vh - 180) + 80;
    coinPopup.style.left = `${x}px`;
    coinPopup.style.top = `${y}px`;
    coinPopup.textContent = '🪙';
    coinPopup.style.opacity = '1';
    coinPopup.style.display = 'block';
    coinPopup.style.animation = 'coinFade 7s ease forwards';
    setTimeout(() => {
        coinPopup.style.opacity = '0';
        coinPopup.style.display = 'none';
        coinPopup.style.animation = 'none';
    }, 7000);
}

coinPopup.onclick = function() {
    coinPopup.style.display = 'none';
    // Play coin sound
    const coinAudio = document.getElementById('coinSound');
    if (coinAudio) {
        coinAudio.currentTime = 0;
        coinAudio.play();
    }
    // Award dig points based on progress and difficulty
    let base = Math.max(10, Math.floor(gameState.currentWellProgress / 10));
    let diff = gameState.difficulty || 'normal';
    let multiplier = (diff === 'easy') ? 1 : (diff === 'normal') ? 2 : 3;
    let award = base * multiplier;
    gameState.digPoints += award;
    updateDisplay();
    // Optionally show a quick floating text
    const float = document.createElement('div');
    float.textContent = `+${award} digs!`;
    float.style.position = 'fixed';
    float.style.left = coinPopup.style.left;
    float.style.top = coinPopup.style.top;
    float.style.fontSize = '1.5rem';
    float.style.color = '#ffc907';
    float.style.zIndex = '2100';
    float.style.pointerEvents = 'none';
    float.style.transition = 'opacity 1s, transform 1s';
    float.style.opacity = '1';
    float.style.transform = 'translateY(-20px)';
    document.body.appendChild(float);
    setTimeout(() => {
        float.style.opacity = '0';
        float.style.transform = 'translateY(-60px)';
    }, 100);
    setTimeout(() => {
        document.body.removeChild(float);
    }, 1200);
}

// Randomly show coin popup every 20-40 seconds
setInterval(() => {
    if (Math.random() < 0.04) { // ~1 in 25 chance per second
        showCoinPopup();
    }
}, 1000);
loadGame();

initCountries();
loadGame();
recalcUpgrades();
renderUpgrades();
updateDisplay();
