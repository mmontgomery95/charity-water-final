// Game State
const gameState = {
    digPoints: 0,
    currentWellProgress: 0,
    wellsCompleted: 0,
    clickPower: 1,
    digsPerSecond: 0,
    wellCost: 1000,
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
    countries: ['Ethiopia', 'Uganda', 'India', 'Cambodia', 'Nepal', 'Tanzania', 'Rwanda', 'Malawi']
};

// DOM Elements
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
            gameState.wellCost = 1000;
            gameState.upgrades.forEach(upg => {
                upg.owned = 0;
                if (upg.id === 'shovel') upg.cost = 100;
                if (upg.id === 'volunteer') upg.cost = 250;
                if (upg.id === 'drill') upg.cost = 500;
                if (upg.id === 'grant') upg.cost = 1000;
            });
            // Remove all wells from grid
            wellsGrid.innerHTML = '';
            recalcUpgrades();
            updateDisplay();
            renderUpgrades();
        }
    });
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
    gameState.wellCost = Math.floor(gameState.wellCost * 2.2); // Increase difficulty more greatly

    // Add well to grid
    const countryIndex = (gameState.wellsCompleted - 1) % gameState.countries.length;
    const country = gameState.countries[countryIndex];
    const wellCard = document.createElement('div');
    wellCard.className = 'well-card well-complete-animate';
    wellCard.innerHTML = `
        <h3>${country}</h3>
        <p>500 people served</p>
    `;
    wellsGrid.appendChild(wellCard);
    // Remove animation class after animation
    setTimeout(() => {
        wellCard.classList.remove('well-complete-animate');
    }, 700);

    // Check for all wells completed (arbitrary: 8 countries = 8 wells)
    if (gameState.wellsCompleted >= gameState.countries.length) {
        showCelebration('Congratulations! You have built a well in every country! 🌍🎉');
    } else {
        // Small celebration for each well
        showWellCelebration();
    }
}

function showWellCelebration() {
    const celebration = document.getElementById('celebration');
    const message = document.getElementById('celebration-message');
    if (celebration && message) {
        message.textContent = 'Well Completed! 💧';
        celebration.style.display = 'flex';
        launchConfetti();
        setTimeout(() => {
            celebration.style.display = 'none';
        }, 1800);
    }
}

function showCelebration(msg) {
    const celebration = document.getElementById('celebration');
    const message = document.getElementById('celebration-message');
    if (celebration && message) {
        message.textContent = msg;
        celebration.style.display = 'flex';
        launchConfetti();
    }
}

function launchConfetti() {
    const confetti = document.getElementById('confetti');
    if (!confetti) return;
    confetti.innerHTML = '';
    const colors = ['#4A90E2', '#28a745', '#FFD700', '#FF69B4', '#FF6347'];
    for (let i = 0; i < 80; i++) {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.width = '12px';
        div.style.height = '12px';
        div.style.borderRadius = '50%';
        div.style.background = colors[Math.floor(Math.random()*colors.length)];
        div.style.left = Math.random()*100 + 'vw';
        div.style.top = '-20px';
        div.style.opacity = 0.8;
        div.style.transform = `scale(${0.7 + Math.random()*0.6})`;
        div.style.transition = 'top 1.5s cubic-bezier(.36,1.56,.64,1), left 1.5s linear, opacity 1.5s linear';
        confetti.appendChild(div);
        setTimeout(() => {
            div.style.top = 80 + 20*Math.random() + 'vh';
            div.style.left = (parseFloat(div.style.left) + (Math.random()-0.5)*200) + 'px';
            div.style.opacity = 0;
        }, 10);
    }
    setTimeout(() => { confetti.innerHTML = ''; }, 1800);
}

// Buy Upgrade
function buyUpgrade(upgradeIndex) {
    const upgrade = gameState.upgrades[upgradeIndex];
    if (gameState.digPoints >= upgrade.cost) {
        gameState.digPoints -= upgrade.cost;
        upgrade.owned++;
        // Exponential price scaling
    let baseCost = 100;
    let growth = 1.55;
    if (upgrade.id === 'shovel') { baseCost = 100; growth = 1.55; }
    if (upgrade.id === 'volunteer') { baseCost = 250; growth = 1.65; }
    if (upgrade.id === 'drill') { baseCost = 500; growth = 1.75; }
    if (upgrade.id === 'grant') { baseCost = 1000; growth = 1.85; }
    upgrade.cost = Math.round(baseCost * Math.pow(growth, upgrade.owned));
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
                // +1, +2, +3, ...
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
        }
    });
}

// Render Upgrades
function renderUpgrades() {
    upgradesContainer.innerHTML = '';
    gameState.upgrades.forEach((upgrade, index) => {
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
        }
        const upgradeDiv = document.createElement('div');
        upgradeDiv.className = 'upgrade-item';
        upgradeDiv.innerHTML = `
            <div class="upgrade-header">
                <span><strong>${upgrade.name}</strong></span>
                <span style="background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${upgrade.cost} pts</span>
            </div>
            <p style="font-size: 12px; color: #007bff; margin-bottom: 8px;">${nextEffect}</p>
            <p style="font-size: 11px; color: #999; margin-bottom: 8px;">Owned: ${upgrade.owned}</p>
        `;
        const button = document.createElement('button');
        button.className = 'upgrade-button';
        button.textContent = 'Purchase';
        if (!canAfford) button.disabled = true;
        button.addEventListener('click', () => buyUpgrade(index));
        upgradeDiv.appendChild(button);
        upgradesContainer.appendChild(upgradeDiv);
    });
}

// Update Display
function updateDisplay() {
    digPointsEl.textContent = Math.floor(gameState.digPoints);
    wellsCompletedEl.textContent = gameState.wellsCompleted;
    peopleHelpedEl.textContent = (gameState.wellsCompleted * 500).toLocaleString();
    digsPerSecondEl.textContent = gameState.digsPerSecond;
    clickPowerEl.textContent = `+${gameState.clickPower} dig per click`;
    
    // Update progress bar
    const progressPercent = (gameState.currentWellProgress / gameState.wellCost) * 100;
    progressBar.style.width = progressPercent + '%';
    progressText.textContent = `${Math.floor(gameState.currentWellProgress)} / ${gameState.wellCost} digs`;
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
        recalcUpgrades();
        // Rebuild wells grid
        for (let i = 0; i < gameState.wellsCompleted; i++) {
            const countryIndex = i % gameState.countries.length;
            const country = gameState.countries[countryIndex];
            const wellCard = document.createElement('div');
            wellCard.className = 'well-card';
            wellCard.innerHTML = `
                <h3>${country}</h3>
                <p>500 people served</p>
            `;
            wellsGrid.appendChild(wellCard);
        }
    }
}

// Initialize game
loadGame();
recalcUpgrades();
renderUpgrades();
updateDisplay();
