// Y2K Portfolio Script
document.addEventListener('DOMContentLoaded', function() {
    // State
    const state = {
        currentSection: 'about',
        musicPlaying: false
    };

    // DOM elements for game
    const gameElements = {
        maze: null,
        scoreDisplay: null,
        itemsDisplay: null,
        totalItemsDisplay: null,
        levelDisplay: null,
        livesDisplay: null,
        startBtn: null,
        resetBtn: null,
        helpBtn: null,
        activePowerUpDisplay: null,
        powerUpTimerDisplay: null,
        collectedItemsDisplay: null
    };

    // DOM Elements
    const elements = {
        navBtns: document.querySelectorAll('.nav-btn'),
        sections: document.querySelectorAll('.content-section'),
        musicBtn: document.getElementById('musicBtn'),
        bgMusic: document.getElementById('bgMusic'),
        messageForm: document.getElementById('messageForm')
    };

    // ========== BUG COLLECTOR GAME ==========
    const gameState = {
        running: false,
        score: 0,
        level: 1,
        lives: 3,
        items: 0,
        totalItems: 8,
        player: { x: 1, y: 1 },
        bugs: [],
        grid: [],
        gridSize: 12,
        selectedPowerUp: null,
        activePowerUp: null,
        powerUpTimer: 0,
        powerUps: {
            speed: { uses: 0, emoji: '🍦', key: '1', active: false, timer: 0 },
            break: { uses: 0, emoji: '🍫', key: '2', active: false, timer: 0 },
            freeze: { uses: 0, emoji: '🍓', key: '3', active: false, timer: 0 }
        },
        collectedItems: [],
        gameInterval: null,
        bugMoveCounter: 0,
        // Attack system
        canAttack: true,
        attackCooldown: 0,
        attackRange: 1
    };

    // Initialize
    function init() {
        setupNavigation();
        setupMusic();
        setupForm();
        startCursorTrail();
    }

    // Navigation
    function setupNavigation() {
        elements.navBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const target = this.dataset.target;
                
                elements.navBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                showSection(target);
            });
        });
    }

    function showSection(sectionId) {
        elements.sections.forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            state.currentSection = sectionId;
            
            if (sectionId === 'design') {
                setTimeout(() => {
                    initGame();
                }, 100);
            }
        }
    }

    // ========== GAME FUNCTIONS ==========
    function initGame() {
        console.log('DEBUG: Initializing game');
        
        // Get all game elements
        gameElements.maze = document.getElementById('maze');
        gameElements.scoreDisplay = document.getElementById('score');
        gameElements.itemsDisplay = document.getElementById('items');
        gameElements.totalItemsDisplay = document.getElementById('total-items');
        gameElements.levelDisplay = document.getElementById('level');
        gameElements.livesDisplay = document.getElementById('lives');
        gameElements.startBtn = document.getElementById('start-btn');
        gameElements.resetBtn = document.getElementById('reset-btn');
        gameElements.helpBtn = document.getElementById('help-btn');
        gameElements.collectedItemsDisplay = document.getElementById('collected-items');
        
        console.log('DEBUG: Maze element:', gameElements.maze);
        
        // Setup buttons
        if (gameElements.startBtn) {
            gameElements.startBtn.addEventListener('click', startGame);
        }
        if (gameElements.resetBtn) {
            gameElements.resetBtn.addEventListener('click', resetGame);
        }
        if (gameElements.helpBtn) {
            gameElements.helpBtn.addEventListener('click', showHelp);
        }
        
        // Setup keyboard controls
        document.addEventListener('keydown', handleKeyPress);
        
        // Generate initial maze
        generateMaze();
        renderGrid();
        updateDisplays();
        
        console.log('DEBUG: Game initialized successfully');
    }

    function generateMaze() {
        const size = gameState.gridSize;
        gameState.grid = [];
        
        for (let y = 0; y < size; y++) {
            const row = [];
            for (let x = 0; x < size; x++) {
                if (x === 0 || y === 0 || x === size - 1 || y === size - 1) {
                    row.push('wall');
                } else {
                    const rand = Math.random();
                    if (rand < 0.3) {
                        row.push('wall');
                    } else if (rand < 0.4) {
                        row.push('breakable');
                    } else {
                        row.push('path');
                    }
                }
            }
            gameState.grid.push(row);
        }
        
        gameState.grid[1][1] = 'path';
        gameState.player = { x: 1, y: 1 };
        
        placeItems();
        placeBugs();
        
        console.log('DEBUG: Maze generated');
    }

    function placeItems() {
        gameState.items = 0;
        gameState.collectedItems = [];
        const items = ['{}', '[]', '</>', '();', 'fn()', '=>', '==', '!='];
        gameState.totalItems = items.length;
        
        for (let i = 0; i < items.length; i++) {
            let placed = false;
            while (!placed) {
                const x = Math.floor(Math.random() * (gameState.gridSize - 2)) + 1;
                const y = Math.floor(Math.random() * (gameState.gridSize - 2)) + 1;
                
                if (gameState.grid[y][x] === 'path') {
                    gameState.grid[y][x] = `item_${items[i]}`;
                    placed = true;
                }
            }
        }
    }

    function placeBugs() {
        gameState.bugs = [];
        const bugCount = gameState.level + 1;
        
        for (let i = 0; i < bugCount; i++) {
            let placed = false;
            while (!placed) {
                const x = Math.floor(Math.random() * (gameState.gridSize - 2)) + 1;
                const y = Math.floor(Math.random() * (gameState.gridSize - 2)) + 1;
                
                const distance = Math.abs(x - 1) + Math.abs(y - 1);
                if (gameState.grid[y][x] === 'path' && distance > 5) {
                    gameState.bugs.push({
                        x: x,
                        y: y,
                        type: i % 3 === 0 ? 'chaser' : 'random',
                        frozen: false,
                        frozenTimer: 0
                    });
                    placed = true;
                }
            }
        }
    }

    function renderGrid() {
        if (!gameElements.maze) {
            console.error('DEBUG: Maze element not found');
            return;
        }
        
        gameElements.maze.innerHTML = '';
        gameElements.maze.style.gridTemplateColumns = `repeat(${gameState.gridSize}, 1fr)`;
        
        for (let y = 0; y < gameState.gridSize; y++) {
            for (let x = 0; x < gameState.gridSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                if (x === gameState.player.x && y === gameState.player.y) {
                    cell.classList.add('player');
                    cell.textContent = '🍦';
                } else if (gameState.bugs.some(bug => bug.x === x && bug.y === y)) {
                    const bug = gameState.bugs.find(b => b.x === x && b.y === y);
                    cell.classList.add('bug');
                    if (bug.frozen) {
                        cell.classList.add('frozen');
                        cell.textContent = '❄️';
                    } else {
                        cell.textContent = '🐛';
                    }
                } else if (gameState.grid[y][x].startsWith('item_')) {
                    cell.classList.add('item');
                    cell.textContent = gameState.grid[y][x].replace('item_', '');
                } else if (gameState.grid[y][x] === 'wall') {
                    cell.classList.add('wall');
                } else if (gameState.grid[y][x] === 'breakable') {
                    cell.classList.add('breakable');
                } else {
                    cell.classList.add('path');
                }
                
                gameElements.maze.appendChild(cell);
            }
        }
        
        console.log('DEBUG: Grid rendered with', gameElements.maze.children.length, 'cells');
    }

    function handleKeyPress(e) {
        if (!gameState.running) return;
        
        let moved = false;
        let newX = gameState.player.x;
        let newY = gameState.player.y;
        
        switch(e.key.toLowerCase()) {
            case 'arrowup':
            case 'w':
                newY--;
                moved = true;
                break;
            case 'arrowdown':
            case 's':
                newY++;
                moved = true;
                break;
            case 'arrowleft':
            case 'a':
                newX--;
                moved = true;
                break;
            case 'arrowright':
            case 'd':
                newX++;
                moved = true;
                break;
            case ' ':
                // Spacebar: use power-up if selected, otherwise attack
                if (gameState.selectedPowerUp) {
                    activateSelectedPowerUp();
                } else {
                    attackBugs();
                }
                break;
            case 'k':
                attackBugs();
                break;
            case '1':
                selectPowerUp('speed');
                break;
            case '2':
                selectPowerUp('break');
                break;
            case '3':
                selectPowerUp('freeze');
                break;
            case 'r':
                resetLevel();
                break;
        }
        
        if (moved) {
            movePlayer(newX, newY);
            e.preventDefault();
        }
    }

    function movePlayer(x, y) {
        if (x < 0 || x >= gameState.gridSize || y < 0 || y >= gameState.gridSize) {
            return;
        }
        
        const cellType = gameState.grid[y][x];
        
        // Check for walls
        if (cellType === 'wall') {
            return;
        }
        
        // Check for breakable walls
        if (cellType === 'breakable') {
            if (gameState.activePowerUp === 'break') {
                gameState.grid[y][x] = 'path';
                gameState.activePowerUp = null;
                updatePowerUpDisplay();
                showNotification('WALL BROKEN!');
            } else {
                return;
            }
        }
        
        // Update player position
        gameState.player.x = x;
        gameState.player.y = y;
        
        // Check for items
        if (cellType.startsWith('item_')) {
            collectItem(x, y);
        }
        
        // Check for random power-up spawn
        if (Math.random() < 0.05 && Object.values(gameState.powerUps).every(p => p.uses === 0)) {
            spawnRandomPowerUp();
        }
        
        // Move bugs if game is running
        if (gameState.running) {
            moveBugs();
            checkBugCollision();
        }
        
        renderGrid();
        updateDisplays();
        
        if (gameState.items >= gameState.totalItems) {
            levelComplete();
        }
    }

    function moveBugs() {
        gameState.bugs.forEach(bug => {
            if (bug.frozen) {
                bug.frozenTimer--;
                if (bug.frozenTimer <= 0) {
                    bug.frozen = false;
                }
                return;
            }
            
            // Add random chance to skip movement (slower bugs)
            if (Math.random() < 0.3) {
                return;
            }
            
            if (bug.type === 'chaser') {
                // Chase player with chance
                if (Math.random() < 0.6) {
                    if (bug.x < gameState.player.x) bug.x++;
                    else if (bug.x > gameState.player.x) bug.x--;
                    if (bug.y < gameState.player.y) bug.y++;
                    else if (bug.y > gameState.player.y) bug.y--;
                }
            } else {
                // Random movement
                const directions = [
                    {x: 0, y: -1}, // up
                    {x: 1, y: 0},  // right
                    {x: 0, y: 1},  // down
                    {x: -1, y: 0}  // left
                ];
                const dir = directions[Math.floor(Math.random() * directions.length)];
                const newX = bug.x + dir.x;
                const newY = bug.y + dir.y;
                
                if (newX >= 0 && newX < gameState.gridSize && 
                    newY >= 0 && newY < gameState.gridSize &&
                    gameState.grid[newY][newX] !== 'wall') {
                    bug.x = newX;
                    bug.y = newY;
                }
            }
        });
    }

    function collectItem(x, y) {
        const itemType = gameState.grid[y][x].replace('item_', '');
        gameState.items++;
        gameState.score += 10;
        gameState.collectedItems.push(itemType);
        gameState.grid[y][x] = 'path';
        
        if (itemType === 'fn()') {
            gameState.lives++;
            showNotification('EXTRA LIFE! +1');
        }
        
        // Visual feedback
        const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
        if (cell) {
            cell.classList.add('collecting');
            setTimeout(() => {
                cell.classList.remove('collecting');
            }, 500);
        }
    }

    function checkBugCollision() {
        for (const bug of gameState.bugs) {
            if (bug.x === gameState.player.x && bug.y === gameState.player.y) {
                gameState.lives--;
                if (gameState.lives <= 0) {
                    gameOver();
                } else {
                    gameState.player.x = 1;
                    gameState.player.y = 1;
                    showNotification('OUCH! Bug hit you! -1 Life');
                    renderGrid();
                }
                break;
            }
        }
    }

    // ========== ATTACK SYSTEM ==========
    function attackBugs() {
        if (!gameState.canAttack) return;
        
        const attackPositions = [
            {x: gameState.player.x, y: gameState.player.y - 1}, // Up
            {x: gameState.player.x, y: gameState.player.y + 1}, // Down
            {x: gameState.player.x - 1, y: gameState.player.y}, // Left
            {x: gameState.player.x + 1, y: gameState.player.y}  // Right
        ];
        
        let bugsKilled = 0;
        
        // Check each adjacent position for bugs
        attackPositions.forEach(pos => {
            const bugIndex = gameState.bugs.findIndex(bug => 
                bug.x === pos.x && bug.y === pos.y
            );
            
            if (bugIndex !== -1) {
                // Remove the bug
                gameState.bugs.splice(bugIndex, 1);
                bugsKilled++;
                
                // Add score
                gameState.score += 50;
                
                // Visual effect
                const cell = document.querySelector(`.cell[data-x="${pos.x}"][data-y="${pos.y}"]`);
                if (cell) {
                    cell.classList.add('attacking');
                    setTimeout(() => {
                        cell.classList.remove('attacking');
                    }, 300);
                }
            }
        });
        
        if (bugsKilled > 0) {
            showNotification(`KILLED ${bugsKilled} BUG${bugsKilled > 1 ? 'S' : ''}! +${bugsKilled * 50} points`);
            
            // Attack cooldown
            gameState.canAttack = false;
            gameState.attackCooldown = 10;
            
            // Start cooldown timer
            const cooldownInterval = setInterval(() => {
                if (gameState.attackCooldown > 0) {
                    gameState.attackCooldown--;
                } else {
                    gameState.canAttack = true;
                    clearInterval(cooldownInterval);
                }
            }, 100);
        } else {
            showNotification('NO BUGS IN ATTACK RANGE!');
        }
        
        renderGrid();
        updateDisplays();
    }

    // ========== POWER-UP SYSTEM ==========
    function selectPowerUp(type) {
        console.log(`DEBUG: Attempting to select power-up: ${type}`);
        
        if (gameState.powerUps[type].uses > 0) {
            gameState.selectedPowerUp = type;
            console.log(`DEBUG: Successfully selected power-up: ${type}`);
            
            // Visual feedback
            playSelectSound();
            
            // Update display
            updateDisplays();
            highlightSelectedPowerUp(type);
            
            // Show notification
            const powerUpNames = {
                'speed': 'Speed Boost',
                'break': 'Break Wall', 
                'freeze': 'Freeze Bugs'
            };
            showNotification(`${powerUpNames[type]} SELECTED! Press SPACE to use`);
            
            return true;
        } else {
            console.log(`DEBUG: Cannot select ${type} - no uses available`);
            showNotification(`NO ${type.toUpperCase()} POWER-UPS AVAILABLE!`);
            return false;
        }
    }

    function activateSelectedPowerUp() {
        if (!gameState.selectedPowerUp || gameState.powerUps[gameState.selectedPowerUp].uses <= 0) {
            console.log('DEBUG: No power-up selected or no uses left');
            showNotification('NO POWER-UP SELECTED!');
            return;
        }
        
        const type = gameState.selectedPowerUp;
        
        // Use one charge
        gameState.powerUps[type].uses--;
        gameState.activePowerUp = type;
        gameState.powerUpTimer = 300; // 5 seconds
        
        console.log(`DEBUG: Activated power-up: ${type}`);
        
        // Apply effect
        switch(type) {
            case 'speed':
                activateSpeedBoost();
                break;
            case 'break':
                // Break power-up stays active until used on a wall
                showNotification('BREAK POWER READY! Move into a wall to break it');
                break;
            case 'freeze':
                activateFreeze();
                break;
        }
        
        // Clear selection
        gameState.selectedPowerUp = null;
        updateDisplays();
        updatePowerUpDisplay();
        
        // Start timer for non-break power-ups
        if (type !== 'break') {
            startPowerUpTimer();
        }
    }

    function activateSpeedBoost() {
        // Visual effect
        document.body.style.backgroundColor = 'rgba(0, 255, 255, 0.3)';
        setTimeout(() => {
            document.body.style.backgroundColor = '';
        }, 200);
        
        gameState.score += 50;
        showNotification('SPEED BOOST ACTIVATED! +50 points');
    }

    function activateFreeze() {
        gameState.bugs.forEach(bug => {
            bug.frozen = true;
            bug.frozenTimer = 180; // 3 seconds
        });
        
        showNotification('BUGS FROZEN FOR 3 SECONDS!');
    }

    function spawnRandomPowerUp() {
        const powerUps = [
            { type: 'speed', emoji: '🍦', name: 'Speed Boost' },
            { type: 'break', emoji: '🍫', name: 'Break Wall' },
            { type: 'freeze', emoji: '🍓', name: 'Freeze Bugs' }
        ];
        
        const powerUp = powerUps[Math.floor(Math.random() * powerUps.length)];
        gameState.powerUps[powerUp.type].uses++;
        
        if (!gameState.selectedPowerUp) {
            gameState.selectedPowerUp = powerUp.type;
        }
        
        showNotification(`${powerUp.name} COLLECTED! ${powerUp.emoji}`);
        updateDisplays();
    }

    function startPowerUpTimer() {
        if (gameState.powerUpTimer > 0) {
            gameState.powerUpTimer--;
            updatePowerUpDisplay();
            setTimeout(startPowerUpTimer, 1000/60);
        } else {
            gameState.activePowerUp = null;
            updatePowerUpDisplay();
        }
    }

    function updatePowerUpDisplay() {
        const display = document.getElementById('active-powerup');
        const timer = document.getElementById('powerup-timer');
        
        if (display && timer) {
            if (gameState.activePowerUp) {
                const powerUp = gameState.powerUps[gameState.activePowerUp];
                display.innerHTML = `<span class="p-icon">${powerUp.emoji}</span> ${gameState.activePowerUp.toUpperCase()}`;
                timer.textContent = Math.ceil(gameState.powerUpTimer / 60) + 's';
            } else {
                display.innerHTML = '<span class="p-icon">❌</span> None';
                timer.textContent = '--';
            }
        }
    }

    function highlightSelectedPowerUp(type) {
        document.querySelectorAll('.power-up-slot').forEach(slot => {
            slot.classList.remove('selected');
        });
        
        const selectedSlot = document.querySelector(`.power-up-slot[data-type="${type}"]`);
        if (selectedSlot) {
            selectedSlot.classList.add('selected');
        }
    }

    function playSelectSound() {
        // Visual flash for selection
        document.querySelectorAll('.power-up-slot').forEach(slot => {
            slot.style.transition = 'none';
            slot.style.transform = 'scale(1.05)';
        });
        
        setTimeout(() => {
            document.querySelectorAll('.power-up-slot').forEach(slot => {
                slot.style.transition = 'all 0.3s';
                slot.style.transform = '';
            });
        }, 100);
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'powerup-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: #0ff;
            padding: 10px 20px;
            border: 2px solid #0ff;
            border-radius: 10px;
            font-family: 'Courier New', monospace;
            z-index: 10000;
            animation: slideIn 0.5s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.5s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 500);
        }, 2000);
    }

    // ========== GAME CONTROL FUNCTIONS ==========
    function startGame() {
        if (!gameState.running) {
            gameState.running = true;
            gameElements.startBtn.textContent = 'PAUSE';
            
            // Reset attack cooldown
            gameState.canAttack = true;
            gameState.attackCooldown = 0;
            
            // Start game loop - slower updates
            gameState.gameInterval = setInterval(() => {
                if (gameState.running) {
                    // Update bug move counter for slower movement
                    gameState.bugMoveCounter++;
                    
                    // Move bugs only every 2nd tick (slower)
                    if (gameState.bugMoveCounter % 2 === 0) {
                        moveBugs();
                        checkBugCollision();
                        renderGrid();
                    }
                    
                    updateDisplays();
                }
            }, 800); // Slower update interval
            
            console.log('DEBUG: Game started with attack system');
        } else {
            gameState.running = false;
            gameElements.startBtn.textContent = 'RESUME';
            clearInterval(gameState.gameInterval);
            console.log('DEBUG: Game paused');
        }
    }

    function resetGame() {
        gameState.running = false;
        gameState.score = 0;
        gameState.level = 1;
        gameState.lives = 3;
        gameState.items = 0;
        gameState.selectedPowerUp = null;
        gameState.activePowerUp = null;
        gameState.powerUps = {
            speed: { uses: 0, emoji: '🍦', key: '1', active: false, timer: 0 },
            break: { uses: 0, emoji: '🍫', key: '2', active: false, timer: 0 },
            freeze: { uses: 0, emoji: '🍓', key: '3', active: false, timer: 0 }
        };
        gameState.collectedItems = [];
        gameState.canAttack = true;
        gameState.attackCooldown = 0;
        
        if (gameElements.startBtn) {
            gameElements.startBtn.textContent = 'START GAME';
        }
        
        if (gameState.gameInterval) {
            clearInterval(gameState.gameInterval);
        }
        
        resetLevel();
        console.log('DEBUG: Game reset');
    }

    function resetLevel() {
        generateMaze();
        renderGrid();
        updateDisplays();
    }

    function gameOver() {
        gameState.running = false;
        gameElements.startBtn.textContent = 'START GAME';
        clearInterval(gameState.gameInterval);
        
        alert(`GAME OVER!\nFinal Score: ${gameState.score}`);
        resetGame();
    }

    function levelComplete() {
        gameState.level++;
        gameState.score += 100;
        
        alert(`LEVEL ${gameState.level - 1} COMPLETE!\nScore: ${gameState.score}`);
        
        generateMaze();
        renderGrid();
        updateDisplays();
    }

    function updateDisplays() {
        if (gameElements.scoreDisplay) {
            gameElements.scoreDisplay.textContent = gameState.score;
            gameElements.itemsDisplay.textContent = gameState.items;
            gameElements.totalItemsDisplay.textContent = gameState.totalItems;
            gameElements.levelDisplay.textContent = gameState.level;
            gameElements.livesDisplay.textContent = gameState.lives;
        }
        
        // Update attack status
        const attackStatusElement = document.getElementById('attack-status');
        if (!attackStatusElement) {
            // Create attack status display if it doesn't exist
            createAttackStatusDisplay();
        } else {
            updateAttackStatus();
        }
        
        // Update power-up inventory
        updatePowerUpInventory();
        
        // Update collected items
        if (gameElements.collectedItemsDisplay) {
            gameElements.collectedItemsDisplay.innerHTML = '';
            gameState.collectedItems.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'item';
                itemEl.textContent = item;
                gameElements.collectedItemsDisplay.appendChild(itemEl);
            });
        }
    }

    function createAttackStatusDisplay() {
        const attackStatus = document.createElement('div');
        attackStatus.id = 'attack-status';
        attackStatus.style.cssText = `
            background: rgba(0, 0, 0, 0.7);
            color: #0ff;
            padding: 8px 15px;
            border: 2px solid #0ff;
            border-radius: 5px;
            font-weight: bold;
            margin-top: 10px;
            text-align: center;
        `;
        
        const gameControls = document.querySelector('.game-controls');
        if (gameControls) {
            gameControls.appendChild(attackStatus);
            updateAttackStatus();
        }
    }

    function updateAttackStatus() {
        const attackStatus = document.getElementById('attack-status');
        if (attackStatus) {
            if (gameState.canAttack) {
                attackStatus.textContent = 'ATTACK: READY (SPACE/K)';
                attackStatus.style.color = '#0f0';
                attackStatus.style.borderColor = '#0f0';
            } else {
                attackStatus.textContent = `ATTACK: COOLDOWN ${gameState.attackCooldown}`;
                attackStatus.style.color = '#f00';
                attackStatus.style.borderColor = '#f00';
            }
        }
    }

    function updatePowerUpInventory() {
        const container = document.getElementById('power-up-inventory');
        if (!container) {
            createPowerUpInventory();
            return;
        }
        
        container.innerHTML = '';
        
        for (let type in gameState.powerUps) {
            const slot = document.createElement('div');
            slot.className = `power-up-slot ${gameState.selectedPowerUp === type ? 'selected' : ''}`;
            slot.dataset.type = type;
            slot.innerHTML = `
                <div class="power-up-emoji">${gameState.powerUps[type].emoji}</div>
                <div class="power-up-key">[${gameState.powerUps[type].key}]</div>
                <div class="power-up-count">${gameState.powerUps[type].uses}</div>
            `;
            slot.style.cssText = `
                padding: 10px 15px;
                border: 2px solid ${gameState.selectedPowerUp === type ? '#0ff' : '#666'};
                border-radius: 8px;
                background: rgba(0, 0, 0, 0.7);
                text-align: center;
                min-width: 70px;
                cursor: pointer;
                transition: all 0.3s;
            `;
            
            slot.addEventListener('click', () => selectPowerUp(type));
            slot.addEventListener('mouseenter', () => {
                if (gameState.powerUps[type].uses > 0) {
                    slot.style.transform = 'scale(1.05)';
                }
            });
            slot.addEventListener('mouseleave', () => {
                slot.style.transform = '';
            });
            
            container.appendChild(slot);
        }
    }

    function createPowerUpInventory() {
        const container = document.createElement('div');
        container.id = 'power-up-inventory';
        container.style.cssText = `
            display: flex;
            gap: 15px;
            margin-top: 20px;
            justify-content: center;
            flex-wrap: wrap;
        `;
        
        const gameControls = document.querySelector('.game-controls');
        if (gameControls) {
            gameControls.appendChild(container);
            updatePowerUpInventory();
        }
    }

    function showHelp() {
        alert(`🍦 BUG COLLECTOR - HELP\n\n
GOAL: Collect all code items while avoiding bugs!\n
CONTROLS:
• Arrow Keys or WASD - Move
• SPACEBAR - Attack nearby bugs OR use selected power-up
• K - Alternative attack key
• 1, 2, 3 - Select power-up
• R - Restart level\n
POWER-UPS:
• 🍦 [1] Speed Boost - +50 points when activated
• 🍫 [2] Break Wall - Destroy breakable walls (move into wall after activating)
• 🍓 [3] Freeze Bugs - Freeze all bugs for 3 seconds\n
COMBAT:
• Press SPACE or K when next to a bug to kill it
• Attack has a short cooldown
• Each bug killed = +50 points\n
ITEMS:
• Collect {} [] </> etc. for +10 points each
• fn() gives extra life\n
TIPS:
• Bugs move slower now
• Kill bugs for bonus points!
• Breakable walls are pink/dashed
• Collect power-ups when they appear
• Plan your route carefully!`);
    }

    // ========== OTHER FUNCTIONS ==========
    function setupMusic() {
        document.addEventListener('click', function initMusic() {
            if (elements.bgMusic) {
                elements.bgMusic.volume = 0.3;
            }
            document.removeEventListener('click', initMusic);
        });
    }

    function setupForm() {
        if (elements.messageForm) {
            elements.messageForm.addEventListener('submit', function(e) {
                e.preventDefault();
                alert('Message sent! (This is a demo)');
                this.reset();
            });
        }
    }

    function startCursorTrail() {
        // Your existing cursor trail code...
    }

    // Initialize everything
    init();
});