const levels = [
  { name: 'Classroom', enemyType: 'Zombie', enemySpriteText: '🧟', enemyHp: 40, enemyDamage: 8, map: generateLevelMap('classroom') },
  { name: 'Hallway', enemyType: 'Zombie', enemySpriteText: '🧟', enemyHp: 48, enemyDamage: 10, map: generateLevelMap('hallway') },
  { name: 'Library', enemyType: 'Big Zombie', enemySpriteText: '💀', enemyHp: 70, enemyDamage: 14, map: generateLevelMap('library') },
  { name: 'Principle Office', enemyType: 'Big Zombie', enemySpriteText: '💀', enemyHp: 78, enemyDamage: 16, map: generateLevelMap('office') },
  { name: 'Cafeteria', enemyType: 'Big Zombie', enemySpriteText: '💀', enemyHp: 86, enemyDamage: 18, map: generateLevelMap('cafeteria') },
  { name: 'Gyms', enemyType: 'Big Zombie', enemySpriteText: '💀', enemyHp: 92, enemyDamage: 20, map: generateLevelMap('gyms') },
  { name: 'Yard', enemyType: 'Military Troop', enemySpriteText: '🎖️', enemyHp: 110, enemyDamage: 22, map: generateLevelMap('yard') },
];

function generateLevelMap(type) {
  const createSimpleMap = () => {
    const map = [];
    for (let y = 0; y < 9; y++) {
      const row = [];
      for (let x = 0; x < 9; x++) {
        if (x === 0 || x === 8 || y === 0 || y === 8) {
          row.push('wall');
        } else {
          row.push('floor');
        }
      }
      map.push(row);
    }
    return map;
  };

  return createSimpleMap();
}

function chunkMap(flatmap) {
  const grid = [];
  for (let y = 0; y < 9; y += 1) {
    grid.push(flatmap.slice(y * 9, y * 9 + 9));
  }
  return grid;
}

const player = {
  maxHealth: 100,
  health: 100,
  melee: 8,
  ranged: 6,
  weapon: 'Weak Melee / Weak Pistol',
  position: { x: 1, y: 1 },
};

let currentLevelIndex = 0;
let enemy = null;
let currentMap = [];
let isWaitingForUpgrade = false;
let gameOver = false;
let gameLoopInterval = null;

const mapGridEl = document.getElementById('map-grid');
const mapHintEl = document.getElementById('map-hint');

const levelNameEl = document.getElementById('level-name');
const levelCounterEl = document.getElementById('level-counter');
const playerHealthEl = document.getElementById('player-health');
const playerMeleeEl = document.getElementById('player-melee');
const playerRangedEl = document.getElementById('player-ranged');
const playerWeaponEl = document.getElementById('player-weapon');
const enemyNameEl = document.getElementById('enemy-name');
const enemyHealthEl = document.getElementById('enemy-health');
const enemyTypeEl = document.getElementById('enemy-type');
const enemySpriteEl = document.getElementById('enemy-sprite');
const messageBoxEl = document.getElementById('message-box');
const meleeButton = document.getElementById('melee-button');
const rangedButton = document.getElementById('ranged-button');
const skipButton = document.getElementById('skip-button');
const upgradePanel = document.getElementById('upgrade-panel');
const upgradeMeleeButton = document.getElementById('upgrade-melee');
const upgradeRangedButton = document.getElementById('upgrade-ranged');
const endPanel = document.getElementById('end-panel');
const endTitle = document.getElementById('end-title');
const restartButton = document.getElementById('restart-button');

function initGame() {
  currentLevelIndex = 0;
  player.health = player.maxHealth;
  player.melee = 8;
  player.ranged = 6;
  player.weapon = 'Weak Melee / Weak Pistol';
  player.position = { x: 1, y: 1 };
  gameOver = false;
  isWaitingForUpgrade = false;
  endPanel.classList.add('hidden');
  upgradePanel.classList.add('hidden');
  if (gameLoopInterval) clearInterval(gameLoopInterval);
  setEnemyForCurrentLevel();
  updateUi();
  logMessage('The school is crawling with enemies. Use the map to move and survive through 7 levels!');
  startGameLoop();
}

function setEnemyForCurrentLevel() {
  const level = levels[currentLevelIndex];
  currentMap = cloneMap(level.map);
  player.position = { x: 1, y: 1 };

  enemy = {
    name: `${level.enemyType}`,
    type: level.enemyType,
    maxHealth: level.enemyHp,
    health: level.enemyHp,
    baseDamage: level.enemyDamage,
    spriteText: level.enemySpriteText,
    position: assignEnemyStart(level.name),
  };

  enemySpriteEl.innerHTML = `<span>${enemy.spriteText}</span>`;
  mapHintEl.textContent = 'Use arrow keys to move. The enemy will chase you each turn.';
}

function updateUi() {
  const level = levels[currentLevelIndex];
  levelNameEl.textContent = level.name;
  levelCounterEl.textContent = `Level ${currentLevelIndex + 1} / 7`;
  playerHealthEl.textContent = player.health;
  playerMeleeEl.textContent = player.melee;
  playerRangedEl.textContent = player.ranged;
  playerWeaponEl.textContent = player.weapon;
  enemyNameEl.textContent = enemy.name;
  enemyHealthEl.textContent = enemy.health;
  enemyTypeEl.textContent = enemy.type;
  const disabled = gameOver || isWaitingForUpgrade;
  meleeButton.disabled = disabled;
  rangedButton.disabled = disabled;
  skipButton.disabled = disabled;
  renderMap();
}

function cloneMap(map) {
  return map.map(row => row.slice());
}

function assignEnemyStart(levelName) {
  switch (levelName) {
    case 'Classroom':
      return { x: 7, y: 7 };
    case 'Hallway':
      return { x: 7, y: 1 };
    case 'Library':
      return { x: 7, y: 7 };
    case 'Principle Office':
      return { x: 7, y: 6 };
    case 'Cafeteria':
      return { x: 7, y: 7 };
    case 'Gyms':
      return { x: 7, y: 1 };
    case 'Yard':
      return { x: 7, y: 7 };
    default:
      return { x: 7, y: 7 };
  }
}

function renderMap() {
  mapGridEl.innerHTML = '';
  const totalRows = currentMap.length;
  const totalCols = currentMap[0]?.length || 0;

  currentMap.forEach((row, y) => {
    row.forEach((cellType, x) => {
      const cell = document.createElement('div');
      cell.className = `map-cell ${cellType}`;

      if (player.position.x === x && player.position.y === y) {
        cell.classList.add('player');
      }
      if (enemy.position.x === x && enemy.position.y === y) {
        cell.classList.add('enemy');
      }

      mapGridEl.appendChild(cell);
    });
  });
}

function logMessage(message, type = 'info') {
  const prefix = type === 'danger' ? '⚠️ ' : type === 'success' ? '✅ ' : '';
  const paragraph = document.createElement('p');
  paragraph.textContent = prefix + message;
  messageBoxEl.prepend(paragraph);
  while (messageBoxEl.children.length > 8) {
    messageBoxEl.removeChild(messageBoxEl.lastChild);
  }
}

function movePlayer(direction) {
  if (gameOver || isWaitingForUpgrade) return;
  const nextPos = { ...player.position };

  if (direction === 'up') nextPos.y -= 1;
  if (direction === 'down') nextPos.y += 1;
  if (direction === 'left') nextPos.x -= 1;
  if (direction === 'right') nextPos.x += 1;

  if (!canMoveTo(nextPos.x, nextPos.y)) {
    return;
  }

  player.position = nextPos;
  updateUi();
}

function canMoveTo(x, y) {
  return (
    y >= 0 &&
    y < currentMap.length &&
    x >= 0 &&
    x < currentMap[0].length &&
    currentMap[y][x] !== 'wall'
  );
}

function handlePlayerAction(action) {
  if (gameOver || isWaitingForUpgrade) return;

  let damage = 0;
  let actionDescription = '';

  const dx = Math.abs(player.position.x - enemy.position.x);
  const dy = Math.abs(player.position.y - enemy.position.y);
  const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);

  if (isAdjacent && action === 'melee') {
    damage = player.melee + 2;
    actionDescription = `You melee the nearby enemy for ${damage} damage.`;
  } else if (action === 'ranged') {
    damage = player.ranged;
    actionDescription = `You fire your ranged weapon at the enemy for ${damage} damage.`;
  } else if (action === 'melee') {
    return;
  } else {
    return;
  }

  if (damage > 0) {
    enemy.health = Math.max(0, enemy.health - damage);
    logMessage(actionDescription, 'success');
    updateUi();

    if (enemy.health <= 0) {
      handleEnemyDefeated();
    }
  }
}

function enemyMoveTowardPlayer() {
  if (gameOver || isWaitingForUpgrade) return;
  const dx = player.position.x - enemy.position.x;
  const dy = player.position.y - enemy.position.y;
  const nextPos = { ...enemy.position };

  if (Math.abs(dx) > Math.abs(dy)) {
    nextPos.x += Math.sign(dx);
  } else {
    nextPos.y += Math.sign(dy);
  }

  if (canMoveTo(nextPos.x, nextPos.y)) {
    enemy.position = nextPos;
  }
}

function handleEnemyDefeated() {
  logMessage(`Enemy defeated! You cleared ${levels[currentLevelIndex].name}.`, 'success');
  currentLevelIndex += 1;
  if (currentLevelIndex >= levels.length) {
    finishGame(true);
    return;
  }
  isWaitingForUpgrade = true;
  if (gameLoopInterval) clearInterval(gameLoopInterval);
  updateUi();
  upgradePanel.classList.remove('hidden');
  logMessage('Choose an upgrade before the next level.', 'info');
}

function chooseEnemyMove() {
  const roll = Math.random();
  if (enemy.type === 'Zombie') {
    return roll < 0.65 ? 'Swipe' : 'Lunge';
  }
  if (enemy.type === 'Big Zombie') {
    return roll < 0.5 ? 'Heavy Slam' : 'Stomp';
  }
  return roll < 0.6 ? 'Rifle Shot' : 'Bayonet Strike';
}

function handleUpgrade(choice) {
  if (!isWaitingForUpgrade) return;
  if (choice === 'melee') {
    player.melee += 4;
    player.weapon = 'Sharpened Melee / Weak Pistol';
    logMessage('Melee upgraded! Your strikes are stronger now.', 'success');
  } else {
    player.ranged += 4;
    player.weapon = 'Weak Melee / Improved Rifle';
    logMessage('Ranged upgraded! Your shots pack more punch.', 'success');
  }

  player.health = Math.min(player.maxHealth, player.health + 18);
  logMessage('You heal a little between fights and enter the next level ready.', 'info');
  isWaitingForUpgrade = false;
  upgradePanel.classList.add('hidden');
  setEnemyForCurrentLevel();
  updateUi();
  startGameLoop();
}

function finishGame(victory) {
  gameOver = true;
  if (gameLoopInterval) clearInterval(gameLoopInterval);
  endPanel.classList.remove('hidden');
  if (victory) {
    endTitle.textContent = 'You survived all levels! Victory!';
    logMessage('You cleared the final level and escaped the zombie school!', 'success');
  } else {
    endTitle.textContent = 'You were defeated...';
    logMessage('The monsters proved too strong this time. Try again.', 'danger');
  }
  updateUi();
}

function startGameLoop() {
  if (gameLoopInterval) clearInterval(gameLoopInterval);
  gameLoopInterval = setInterval(() => {
    if (gameOver || isWaitingForUpgrade) return;
    
    enemyMoveTowardPlayer();
    
    const dx = Math.abs(player.position.x - enemy.position.x);
    const dy = Math.abs(player.position.y - enemy.position.y);
    const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
    
    if (isAdjacent) {
      const move = chooseEnemyMove();
      let damage = 0;
      let text = '';

      if (enemy.type === 'Zombie') {
        if (move === 'Swipe') {
          damage = enemy.baseDamage;
          text = `Zombie uses Swipe for ${damage} damage.`;
        } else {
          damage = enemy.baseDamage + 4;
          text = `Zombie lunges forward with a Lunge for ${damage} damage.`;
        }
      } else if (enemy.type === 'Big Zombie') {
        if (move === 'Heavy Slam') {
          damage = enemy.baseDamage + 6;
          text = `Big Zombie slams the ground for ${damage} damage.`;
        } else {
          damage = enemy.baseDamage + 4;
          text = `Big Zombie stomps you, dealing ${damage} damage!`;
        }
      } else {
        if (move === 'Rifle Shot') {
          damage = enemy.baseDamage + 6;
          text = `Military Troop lands a Rifle Shot for ${damage} damage.`;
        } else {
          damage = enemy.baseDamage + 2;
          text = `Military Troop does a Bayonet Strike for ${damage} damage.`;
        }
      }

      player.health = Math.max(0, player.health - damage);
      logMessage(text, 'danger');
      
      if (player.health <= 0) {
        finishGame(false);
        return;
      }
    }
    
    updateUi();
  }, 500);
}

meleeButton.addEventListener('click', () => handlePlayerAction('melee'));
rangedButton.addEventListener('click', () => handlePlayerAction('ranged'));
skipButton.addEventListener('click', () => handlePlayerAction('skip'));
upgradeMeleeButton.addEventListener('click', () => handleUpgrade('melee'));
upgradeRangedButton.addEventListener('click', () => handleUpgrade('ranged'));
restartButton.addEventListener('click', initGame);

document.addEventListener('keydown', (event) => {
  if (gameOver || isWaitingForUpgrade) return;
  const key = event.key.toLowerCase();

  if (key === 'arrowup' || key === 'w') {
    movePlayer('up');
  }
  if (key === 'arrowdown' || key === 's') {
    movePlayer('down');
  }
  if (key === 'arrowleft' || key === 'a') {
    movePlayer('left');
  }
  if (key === 'arrowright' || key === 'd') {
    movePlayer('right');
  }
});

document.addEventListener('DOMContentLoaded', initGame);
