const levels = [
  { name: 'Classroom', enemyType: 'Zombie', enemySpriteText: '🧟', enemyHp: 40, enemyDamage: 8, enemyCount: 3, map: generateLevelMap('classroom') },
  { name: 'Hallway', enemyType: 'Zombie', enemySpriteText: '🧟', enemyHp: 48, enemyDamage: 10, enemyCount: 3, map: generateLevelMap('hallway') },
  { name: 'Library', enemyType: 'Librarian', enemySpriteText: '📚', enemyHp: 110, enemyDamage: 18, enemyCount: 1, isBoss: true, map: generateLevelMap('library') },
  { name: 'Principle Office', enemyType: 'Office Guard', enemySpriteText: '👔', enemyHp: 78, enemyDamage: 16, enemyCount: 3, map: generateLevelMap('office') },
  { name: 'Cafeteria', enemyType: 'Big Zombie', enemySpriteText: '💀', enemyHp: 86, enemyDamage: 18, enemyCount: 3, map: generateLevelMap('cafeteria') },
  { name: 'Gyms', enemyType: 'Coach', enemySpriteText: '🏋️', enemyHp: 130, enemyDamage: 22, enemyCount: 1, isBoss: true, map: generateLevelMap('gyms') },
  { name: 'Yard', enemyType: 'Military Troop', enemySpriteText: '🎖️', enemyHp: 110, enemyDamage: 22, enemyCount: 3, map: generateLevelMap('yard') },
];

function generateLevelMap(type) {
  const createSimpleMap = () => {
    const map = [];
    const size = 30;
    for (let y = 0; y < size; y++) {
      const row = [];
      for (let x = 0; x < size; x++) {
        if (x === 0 || x === size - 1 || y === 0 || y === size - 1) {
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
  const size = 30;
  for (let y = 0; y < size; y += 1) {
    grid.push(flatmap.slice(y * size, y * size + size));
  }
  return grid;
}

const player = {
  name: 'Gary',
  maxHealth: 100,
  health: 100,
  melee: 8,
  ranged: 6,
  meleeLevel: 1,
  gunLevel: 1,
  weapon: 'Gun 1 / Melee 1',
  position: { x: 1, y: 1 },
};

function getWeaponLabel() {
  return `Gun ${player.gunLevel} / Melee ${player.meleeLevel}`;
}

function getEnemySpriteForLevel(levelName) {
  switch (levelName) {
    case 'Classroom':
    case 'Hallway':
      return 'characters/zombie.png';
    case 'Library':
      return 'characters/libarian.png';
    case 'Principle Office':
      return 'characters/coach.png';
    case 'Cafeteria':
      return 'characters/buffzombie.png';
    case 'Gyms':
      return 'characters/buffzombie.png';
    case 'Yard':
      return 'characters/soldier.png';
    default:
      return 'characters/zombie.png';
  }
}

function setArenaBackground(levelName) {
  const levelBackgrounds = {
    'Classroom': 'backgrounds/classroom.png',
    'Hallway': 'backgrounds/hallway.png',
    'Library': 'backgrounds/library.png',
    'Principle Office': 'backgrounds/principles office.png',
    'Cafeteria': 'backgrounds/caff.png',
    'Gyms': 'backgrounds/gym.png',
    'Yard': 'backgrounds/yard.png',
  };

  const backgroundUrl = levelBackgrounds[levelName] || 'backgrounds/classroom.png';
  if (arenaEl) {
    arenaEl.style.backgroundImage = `url('${backgroundUrl}')`;
    arenaEl.style.backgroundSize = 'cover';
    arenaEl.style.backgroundPosition = 'center';
  }
  if (sceneShellEl) {
    sceneShellEl.style.backgroundImage = `url('${backgroundUrl}')`;
    sceneShellEl.style.backgroundSize = 'cover';
    sceneShellEl.style.backgroundPosition = 'center';
    sceneShellEl.style.backgroundRepeat = 'no-repeat';
  }
}

let currentLevelIndex = 0;
let enemies = [];
let currentMap = [];
let isWaitingForUpgrade = false;
let gameOver = false;
let gameLoopInterval = null;
let isShootCooldown = false;
const shootCooldownMs = 600;

const mapHintEl = document.getElementById('map-hint');
const arenaEl = document.querySelector('.arena');
const sceneShellEl = document.getElementById('scene-shell');
const playerCharacterEl = document.getElementById('player-character');
const weaponSpriteEl = document.getElementById('weapon-sprite');
const enemyCharacterEl = document.getElementById('enemy-characters');
const meleeUpgradePreviewEl = document.getElementById('melee-upgrade-preview');
const rangedUpgradePreviewEl = document.getElementById('ranged-upgrade-preview');
const upgradeNameBoxEl = document.getElementById('upgrade-name-box');
const meleeUpgradeNameEl = document.getElementById('melee-upgrade-name');
const rangedUpgradeNameEl = document.getElementById('ranged-upgrade-name');
const finalPopupEl = document.getElementById('final-popup');
const finalRestartButton = document.getElementById('final-restart-button');

const levelNameEl = document.getElementById('level-name');
const levelCounterEl = document.getElementById('level-counter');
const playerNameEl = document.getElementById('player-name');
const playerHealthEl = document.getElementById('player-health');
const playerMeleeEl = document.getElementById('player-melee');
const playerRangedEl = document.getElementById('player-ranged');
const playerWeaponEl = document.getElementById('player-weapon');
const enemyNameEl = document.getElementById('enemy-name');
const enemyHealthEl = document.getElementById('enemy-health');
const enemyTypeEl = document.getElementById('enemy-type');
const messageBoxEl = document.getElementById('message-box');
const meleeButton = document.getElementById('melee-button');
const rangedButton = document.getElementById('ranged-button');
const upgradeMeleeButton = document.getElementById('upgrade-melee');
const upgradeRangedButton = document.getElementById('upgrade-ranged');
const upgradeOverlay = document.getElementById('upgrade-overlay');
const endPanel = document.getElementById('end-panel');
const endTitle = document.getElementById('end-title');
const restartButton = document.getElementById('restart-button');

function initGame() {
  currentLevelIndex = 0;
  player.health = player.maxHealth;
  player.melee = 8;
  player.ranged = 6;
  player.meleeLevel = 1;
  player.gunLevel = 1;
  player.weapon = getWeaponLabel();
  player.position = { x: 1, y: 1 };
  gameOver = false;
  isWaitingForUpgrade = false;
  endPanel.classList.add('hidden');
  upgradeOverlay.classList.add('hidden');
  if (gameLoopInterval) clearInterval(gameLoopInterval);
  finalPopupEl?.classList.add('hidden');
  setEnemyForCurrentLevel();
  updateUi();
  logMessage('The school is crawling with enemies. Use the map to move and survive through 7 levels!');
  startGameLoop();
}

function setEnemyForCurrentLevel() {
  const level = levels[currentLevelIndex];
  currentMap = cloneMap(level.map);
  player.position = { x: 1, y: 1 };

  const count = level.enemyCount || 1;
  const positions = assignEnemyStarts(level.name, count);
  enemies = positions.map((position, index) => ({
    name: `${level.enemyType}`,
    type: level.enemyType,
    maxHealth: level.enemyHp,
    health: level.enemyHp,
    baseDamage: level.enemyDamage,
    position,
    spriteImage: getEnemySpriteForLevel(level.name),
    id: `${level.enemyType.toLowerCase().replace(/\s+/g, '-')}-${index}`,
  }));

  setArenaBackground(level.name);
  mapHintEl.textContent = 'Use arrow keys to move. The enemy will chase you each turn.';
}

function updateUi() {
  const level = levels[currentLevelIndex];
  levelNameEl.textContent = level.name;
  levelCounterEl.textContent = `Level ${currentLevelIndex + 1} / 7`;
  playerNameEl.textContent = player.name;
  playerHealthEl.textContent = player.health;
  playerMeleeEl.textContent = player.melee;
  playerRangedEl.textContent = player.ranged;
  playerWeaponEl.textContent = player.weapon;
  const aliveEnemies = enemies.filter((enemy) => enemy.health > 0);
  enemyNameEl.textContent = aliveEnemies.length > 1 ? `${aliveEnemies.length} enemies` : aliveEnemies[0]?.name || 'None';
  enemyHealthEl.textContent = aliveEnemies.reduce((total, enemy) => total + enemy.health, 0);
  enemyTypeEl.textContent = aliveEnemies.length > 1 ? 'Multiple' : aliveEnemies[0]?.type || '---';
  const disabled = gameOver || isWaitingForUpgrade;
  meleeButton.disabled = disabled;
  rangedButton.disabled = disabled || isShootCooldown;
  renderScene();
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
      return { x: 14, y: 14 };
    case 'Principle Office':
      return { x: 7, y: 6 };
    case 'Cafeteria':
      return { x: 7, y: 7 };
    case 'Gyms':
      return { x: 14, y: 14 };
    case 'Yard':
      return { x: 7, y: 7 };
    default:
      return { x: 7, y: 7 };
  }
}

function assignEnemyStarts(levelName, count) {
  const first = assignEnemyStart(levelName);
  const positions = [first];
  const offsets = [{ x: 2, y: 0 }, { x: -2, y: 0 }, { x: 0, y: 2 }, { x: 0, y: -2 }];

  for (let i = 1; i < count; i += 1) {
    const offset = offsets[(i - 1) % offsets.length];
    positions.push({
      x: Math.max(1, Math.min(28, first.x + offset.x * Math.ceil(i / offsets.length))),
      y: Math.max(1, Math.min(28, first.y + offset.y * Math.ceil(i / offsets.length))),
    });
  }

  return positions;
}

function renderScene() {
  if (!sceneShellEl) return;
  const totalRows = currentMap.length;
  const totalCols = currentMap[0]?.length || 1;
  const playerX = (player.position.x / (totalCols - 1)) * 100;
  const playerY = (player.position.y / (totalRows - 1)) * 100;
  playerCharacterEl.style.left = `${playerX}%`;
  playerCharacterEl.style.top = `${playerY}%`;

  enemyCharacterEl.innerHTML = '';
  enemies.forEach((enemyObj) => {
    if (enemyObj.health <= 0) return;
    const enemyEl = document.createElement('div');
    enemyEl.className = 'scene-character enemy';
    enemyEl.style.left = `${(enemyObj.position.x / (totalCols - 1)) * 100}%`;
    enemyEl.style.top = `${(enemyObj.position.y / (totalRows - 1)) * 100}%`;
    const img = document.createElement('img');
    img.src = enemyObj.spriteImage;
    img.alt = enemyObj.name;
    enemyEl.appendChild(img);
    enemyCharacterEl.appendChild(enemyEl);
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

function isEnemyAt(x, y, ignoreId = null) {
  return enemies.some((enemy) => {
    if (enemy.health <= 0) return false;
    if (ignoreId && enemy.id === ignoreId) return false;
    return enemy.position.x === x && enemy.position.y === y;
  });
}

function canMoveTo(x, y, ignoreId = null) {
  return (
    y >= 0 &&
    y < currentMap.length &&
    x >= 0 &&
    x < currentMap[0].length &&
    currentMap[y][x] !== 'wall' &&
    !isEnemyAt(x, y, ignoreId) &&
    !(player.position.x === x && player.position.y === y)
  );
}

function applyMeleeKnockback(enemy) {
  const dx = enemy.position.x - player.position.x;
  const dy = enemy.position.y - player.position.y;
  if (Math.abs(dx) + Math.abs(dy) !== 1) return;

  const knockbackX = enemy.position.x + Math.sign(dx);
  const knockbackY = enemy.position.y + Math.sign(dy);

  if (canMoveTo(knockbackX, knockbackY) && !isEnemyAt(knockbackX, knockbackY)) {
    enemy.position = { x: knockbackX, y: knockbackY };
    logMessage(`${enemy.name} is knocked back!`, 'success');
  }
}

function getNextMeleeSprite() {
  const nextLevel = Math.min(player.meleeLevel + 1, 7);
  return `weapons/melee${nextLevel}.png`;
}

function getNextRangedSprite() {
  const nextGunLevel = Math.min(player.gunLevel + 1, 7);
  if (nextGunLevel === 1) return 'weapons/paperbullet.png';
  if (nextGunLevel >= 7) return 'weapons/goldbullet.png';
  return 'weapons/bullet.png';
}

function updateUpgradePreview() {
  const nextMeleeLevel = Math.min(player.meleeLevel + 1, 7);
  const nextGunLevel = Math.min(player.gunLevel + 1, 7);
  const isMeleeFinalUpgrade = nextMeleeLevel === 7;
  const isRangedFinalUpgrade = nextGunLevel === 7;
  const showNameBox = isMeleeFinalUpgrade || isRangedFinalUpgrade;

  if (meleeUpgradePreviewEl) {
    meleeUpgradePreviewEl.querySelector('img').src = getNextMeleeSprite();
    meleeUpgradePreviewEl.querySelector('p').textContent = isMeleeFinalUpgrade ? 'Diamond is Unbreakable' : `Melee → Level ${nextMeleeLevel}`;
  }
  if (rangedUpgradePreviewEl) {
    rangedUpgradePreviewEl.querySelector('img').src = getNextRangedSprite();
    rangedUpgradePreviewEl.querySelector('p').textContent = isRangedFinalUpgrade ? 'Golden Wind' : `Ranged → Gun ${nextGunLevel}`;
  }
  if (upgradeNameBoxEl && meleeUpgradeNameEl && rangedUpgradeNameEl) {
    if (showNameBox) {
      upgradeNameBoxEl.classList.remove('hidden');
      meleeUpgradeNameEl.textContent = isMeleeFinalUpgrade ? 'Diamond is Unbreakable' : `Melee Level ${nextMeleeLevel}`;
      rangedUpgradeNameEl.textContent = isRangedFinalUpgrade ? 'Golden Wind' : `Ranged Gun ${nextGunLevel}`;
    } else {
      upgradeNameBoxEl.classList.add('hidden');
    }
  }
}

function getNearestEnemy() {
  return enemies
    .filter((enemy) => enemy.health > 0)
    .sort((a, b) => {
      const da = Math.abs(player.position.x - a.position.x) + Math.abs(player.position.y - a.position.y);
      const db = Math.abs(player.position.x - b.position.x) + Math.abs(player.position.y - b.position.y);
      return da - db;
    })[0];
}

function getPlayerBulletSprite() {
  if (player.gunLevel === 1) {
    return 'weapons/paperbullet.png';
  }
  if (player.gunLevel >= 7) {
    return 'weapons/goldbullet.png';
  }
  return 'weapons/bullet.png';
}

function getPlayerWeaponSprite(action) {
  if (action === 'ranged') {
    return getPlayerBulletSprite();
  }
  return `weapons/melee${player.meleeLevel}.png`;
}

function showWeaponUse(action) {
  if (!weaponSpriteEl || !sceneShellEl) return;
  const totalRows = currentMap.length;
  const totalCols = currentMap[0]?.length || 1;
  const playerX = (player.position.x / (totalCols - 1)) * 100;
  const playerY = (player.position.y / (totalRows - 1)) * 100;
  weaponSpriteEl.innerHTML = `<img src="${getPlayerWeaponSprite(action)}" alt="Weapon">`;
  weaponSpriteEl.style.left = `${playerX}%`;
  weaponSpriteEl.style.top = `${playerY}%`;
  weaponSpriteEl.classList.add('active');

  setTimeout(() => {
    weaponSpriteEl.classList.remove('active');
  }, 250);
}

function handlePlayerAction(action) {
  if (gameOver || isWaitingForUpgrade) return;
  if (action === 'ranged' && isShootCooldown) {
    logMessage('Ranged weapon is cooling down.', 'info');
    return;
  }

  const target = getNearestEnemy();
  if (!target) return;

  let damage = 0;
  let actionDescription = '';

  const dx = Math.abs(player.position.x - target.position.x);
  const dy = Math.abs(player.position.y - target.position.y);
  const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);

  if (isAdjacent && action === 'melee') {
    damage = player.melee + 4;
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
    showWeaponUse(action);
    if (action === 'melee') {
      applyMeleeKnockback(target);
    }
    if (action === 'ranged') {
      showProjectile(player.position, target.position, getPlayerBulletSprite());
      isShootCooldown = true;
      rangedButton.disabled = true;
      setTimeout(() => {
        isShootCooldown = false;
        updateUi();
      }, shootCooldownMs);
    }

    target.health = Math.max(0, target.health - damage);
    logMessage(actionDescription, 'success');
    if (target.health <= 0) {
      logMessage(`${target.name} down!`, 'success');
    }
    updateUi();

    if (enemies.filter((enemy) => enemy.health > 0).length === 0) {
      handleEnemyDefeated();
    }
  }
}

function enemyMoveTowardPlayer() {
  if (gameOver || isWaitingForUpgrade) return;

  const occupied = new Set(
    enemies
      .filter((enemyObj) => enemyObj.health > 0)
      .map((enemyObj) => `${enemyObj.position.x},${enemyObj.position.y}`)
  );
  const planned = new Set();

  enemies.forEach((enemyObj) => {
    if (enemyObj.health <= 0) return;
    const dx = player.position.x - enemyObj.position.x;
    const dy = player.position.y - enemyObj.position.y;
    const nextPos = { ...enemyObj.position };

    if (Math.abs(dx) > Math.abs(dy)) {
      nextPos.x += Math.sign(dx);
    } else {
      nextPos.y += Math.sign(dy);
    }

    const key = `${nextPos.x},${nextPos.y}`;
    if (canMoveTo(nextPos.x, nextPos.y, enemyObj.id) && !planned.has(key) && !occupied.has(key)) {
      planned.add(key);
      occupied.delete(`${enemyObj.position.x},${enemyObj.position.y}`);
      enemyObj.position = nextPos;
    }
  });
}

function handleEnemyDefeated() {
  logMessage(`All enemies defeated! You cleared ${levels[currentLevelIndex].name}.`, 'success');
  currentLevelIndex += 1;
  if (currentLevelIndex >= levels.length) {
    finishGame(true);
    return;
  }
  isWaitingForUpgrade = true;
  if (gameLoopInterval) clearInterval(gameLoopInterval);
  updateUi();
  updateUpgradePreview();
  upgradeOverlay.classList.remove('hidden');
  logMessage('Choose an upgrade before the next level.', 'info');
}

function chooseEnemyMove(type) {
  const roll = Math.random();
  if (type === 'Zombie') {
    return roll < 0.65 ? 'Swipe' : 'Lunge';
  }
  if (type === 'Big Zombie') {
    return roll < 0.5 ? 'Heavy Slam' : 'Stomp';
  }
  if (type === 'Coach') {
    return roll < 0.55 ? 'Heavy Slam' : 'Power Strike';
  }
  if (type === 'Librarian') {
    return roll < 0.6 ? 'Shush' : 'Book Toss';
  }
  return roll < 0.6 ? 'Rifle Shot' : 'Bayonet Strike';
}

function handleUpgrade(choice) {
  if (!isWaitingForUpgrade) return;
  if (choice === 'melee') {
    player.meleeLevel += 1;
    player.melee += 4;
    player.weapon = getWeaponLabel();
    logMessage('Melee upgraded! Your strikes are stronger now.', 'success');
  } else {
    player.gunLevel += 1;
    player.ranged += 4;
    player.weapon = getWeaponLabel();
    logMessage('Ranged upgraded! Your shots pack more punch.', 'success');
  }

  player.health = Math.min(player.maxHealth, player.health + 18);
  logMessage('You heal a little between fights and enter the next level ready.', 'info');
  isWaitingForUpgrade = false;
  upgradeOverlay.classList.add('hidden');
  setEnemyForCurrentLevel();
  updateUi();
  startGameLoop();
}

function showProjectile(from, to, sprite) {
  if (!sceneShellEl) return;
  const totalRows = currentMap.length;
  const totalCols = currentMap[0]?.length || 1;
  const rect = sceneShellEl.getBoundingClientRect();
  const fromX = (from.x / (totalCols - 1)) * rect.width;
  const fromY = (from.y / (totalRows - 1)) * rect.height;
  const toX = (to.x / (totalCols - 1)) * rect.width;
  const toY = (to.y / (totalRows - 1)) * rect.height;
  const projectile = document.createElement('div');
  projectile.className = 'projectile';
  projectile.style.left = `${fromX}px`;
  projectile.style.top = `${fromY}px`;
  projectile.style.backgroundImage = `url('${sprite}')`;
  sceneShellEl.appendChild(projectile);

  requestAnimationFrame(() => {
    projectile.style.left = `${toX}px`;
    projectile.style.top = `${toY}px`;
  });

  setTimeout(() => {
    projectile.remove();
  }, 420);
}

function finishGame(victory) {
  gameOver = true;
  if (gameLoopInterval) clearInterval(gameLoopInterval);
  endPanel.classList.remove('hidden');
  if (victory) {
    endTitle.textContent = 'You survived all levels! Victory!';
    logMessage('You cleared the final level and escaped the zombie school!', 'success');
    finalPopupEl.classList.remove('hidden');
    endPanel.classList.add('hidden');
  } else {
    endTitle.textContent = 'You were defeated...';
    logMessage('The monsters proved too strong this time. Try again.', 'danger');
    endPanel.classList.remove('hidden');
  }
  updateUi();
}

function startGameLoop() {
  if (gameLoopInterval) clearInterval(gameLoopInterval);
  gameLoopInterval = setInterval(() => {
    if (gameOver || isWaitingForUpgrade) return;
    
    enemyMoveTowardPlayer();
    
    const adjacentEnemies = enemies.filter((enemyObj) => {
      const dx = Math.abs(player.position.x - enemyObj.position.x);
      const dy = Math.abs(player.position.y - enemyObj.position.y);
      return enemyObj.health > 0 && (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
    });
    
    adjacentEnemies.forEach((enemyObj) => {
      const move = chooseEnemyMove(enemyObj.type);
      let damage = 0;
      let text = '';

      if (enemyObj.type === 'Zombie') {
        if (move === 'Swipe') {
          damage = enemyObj.baseDamage;
          text = `Zombie uses Swipe for ${damage} damage.`;
        } else {
          damage = enemyObj.baseDamage + 4;
          text = `Zombie lunges forward with a Lunge for ${damage} damage.`;
        }
      } else if (enemyObj.type === 'Big Zombie') {
        if (move === 'Heavy Slam') {
          damage = enemyObj.baseDamage + 6;
          text = `Big Zombie slams the ground for ${damage} damage.`;
        } else {
          damage = enemyObj.baseDamage + 4;
          text = `Big Zombie stomps you, dealing ${damage} damage!`;
        }
      } else if (enemyObj.type === 'Coach') {
        if (move === 'Heavy Slam') {
          damage = enemyObj.baseDamage + 8;
          text = `Coach charges with a Heavy Slam for ${damage} damage.`;
        } else {
          damage = enemyObj.baseDamage + 5;
          text = `Coach closes in with a brutal strike for ${damage} damage!`;
        }
      } else if (enemyObj.type === 'Librarian') {
        if (move === 'Shush') {
          damage = enemyObj.baseDamage + 4;
          text = `Librarian forces silence with Shush for ${damage} damage.`;
        } else {
          damage = enemyObj.baseDamage + 6;
          text = `Librarian throws a stack of books for ${damage} damage!`;
        }
      } else {
        if (move === 'Rifle Shot') {
          damage = enemyObj.baseDamage + 6;
          text = `${enemyObj.type} lands a Rifle Shot for ${damage} damage.`;
          showProjectile(enemyObj.position, player.position);
        } else {
          damage = enemyObj.baseDamage + 2;
          text = `${enemyObj.type} does a Bayonet Strike for ${damage} damage.`;
        }
      }

      player.health = Math.max(0, player.health - damage);
      logMessage(text, 'danger');
    });
    
    if (player.health <= 0) {
      finishGame(false);
      return;
    }
    
    updateUi();
  }, 500);
}

meleeButton.addEventListener('click', () => handlePlayerAction('melee'));
rangedButton.addEventListener('click', () => handlePlayerAction('ranged'));
upgradeMeleeButton.addEventListener('click', () => handleUpgrade('melee'));
upgradeRangedButton.addEventListener('click', () => handleUpgrade('ranged'));
restartButton.addEventListener('click', initGame);
finalRestartButton.addEventListener('click', initGame);

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
  if (key === '1') {
    handlePlayerAction('melee');
  }
  if (key === '2') {
    handlePlayerAction('ranged');
  }
});

document.addEventListener('DOMContentLoaded', initGame);
