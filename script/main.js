// js/main.js
import { inputState, initInput } from './input.js';
import { player, initPlayer, updatePlayer, drawPlayer , drawHealthBar } from './player.js';
import { enemies, spawnEnemy } from './enemy.js';
import { projectiles, bossProjectiles, fireWeapon, updateProjectilesAndCollisions, laserState } from './projectiles.js';
import { updateWeaponDisplay, updateXPUI, gainXP } from './ui.js';

let gameStarted = false

// State container for game-level values
const state = {
  level: 1,
  xp: 0,
  xpToNext: 10,
  gameOver: false,
  bossActive: false,
  bossLives: 3,
  lastSpawnTime: 0,
  fireCooldown: 0  // Added: initialize fireCooldown
};

//start button
const startScreen = document.getElementById("start-screen");
const startBtn = document.getElementById("start-btn");

// Canvas setup
export const canvas = document.getElementById("gameCanvas");
export const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// DOM elements used by original script
const gameOverText = document.getElementById("game-over");
const restartBtn = document.getElementById("restart-btn");

// initialize input listeners
initInput();
initPlayer(canvas.width, canvas.height);

// helper callbacks
function onGainXP(amount) {
  const leveled = gainXP(amount, state);
  updateWeaponDisplay(inputState, state);
  if (leveled) {
    // if we hit level 10, you might want to do something (boss unlocks etc)
    // currently handled by spawn logic
  }
}

function onPlayerDamaged(amount) {
  // optional: show damage UI, sound, etc
  // if hp reaches 0, game over handled in onGameOver
}

function onGameOver() {
  state.gameOver = true;
  if (gameOverText) gameOverText.style.display = "block";
  if (restartBtn) restartBtn.style.display = "block";
}

// restart button handler
if (restartBtn) restartBtn.onclick = () => location.reload();

// initialize UI
updateWeaponDisplay(inputState, state);
updateXPUI(state);

//start button
if (startBtn) {
  startBtn.onclick = () => {
    gameStarted = true;
    if (startScreen) startScreen.style.display = "none";
    state.lastSpawnTime = performance.now(); // Initialize spawn timer
    requestAnimationFrame(animate);
  };
}

// main animate loop
function animate(timestamp) {
  if (state.gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Player
  updatePlayer(inputState);
  drawPlayer(ctx);

  // Spawn logic (based on timestamp)
  // spawn interval lower when level >=5
  const spawnInterval = state.level >= 5 ? 1000 : 1500;
  if (!state.bossActive && (timestamp - state.lastSpawnTime > spawnInterval)) {
    const bossSpawned = spawnEnemy(enemies, state.level, canvas.width, canvas.height);
    if (bossSpawned) {
      state.bossActive = true;
      state.bossLives = 3;
    }
    state.lastSpawnTime = timestamp;
  }

  // Update enemies first
  // Pass bossProjectiles array so boss can push bullets into it
  enemies.forEach(enemy => enemy.update(player, state.level, canvas.width, canvas.height, bossProjectiles));
  
  // Filter out dead enemies and handle bottom-reached enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    
    // Check if non-boss enemy reached bottom (y > canvas.height means it escaped)
    if (e.y > canvas.height && e.type !== 'boss') {
      player.hp -= 10;
      onPlayerDamaged(10);
      enemies.splice(i, 1); // Remove the enemy
      if (player.hp <= 0) {
        onGameOver();
        return;
      }
      continue;
    }
    
    // Remove dead enemies (but preserve boss with remaining lives)
    if (e.hp <= 0 && !(e.type === 'boss' && e.lives > 0)) {
      enemies.splice(i, 1);
    }
  }
  enemies.forEach(enemy => enemy.draw(ctx));
  
  // Check for victory: level 10, no enemies left, boss was active but defeated
  if (state.level === 10 && enemies.length === 0 && !state.bossActive) {
    state.gameOver = true;
    if (gameOverText) {
      gameOverText.textContent = "🎉 VICTORY! 🎉";
      gameOverText.style.color = "lime";
      gameOverText.style.textShadow = "0 0 20px lime";
      gameOverText.style.display = "block";
    }
    if (restartBtn) restartBtn.style.display = "block";
    return;
  }

  // Only fire when mouse button is pressed
  if (inputState.isFiring) {
    const firingState = { level: state.level, fireCooldown: state.fireCooldown };
    fireWeapon(firingState, inputState, canvas.width, canvas.height, ctx);
    state.fireCooldown = firingState.fireCooldown;
  } else {
    // Decrease cooldown even when not firing
    if (state.fireCooldown > 0) state.fireCooldown--;
  }

  // Update projectiles, collisions, rendering
  updateProjectilesAndCollisions(
    ctx, canvas.width, canvas.height,
    player,
    (amount) => onGainXP(amount),
    (amount) => onPlayerDamaged(amount),
    () => onGameOver()
  );

  // End condition: if bossActive is false and there is a boss-type enemy removed fully, ensure reset
  // If the boss was defeated, spawnEnemy logic will not re-spawn boss until level 10 again.
  state.bossActive = enemies.some(e => e.type === 'boss' && e.lives > 0);
  
  // Draw health bar at fixed position (top right) - draw last so it's on top
  drawHealthBar(ctx, canvas.width);
  
  requestAnimationFrame(animate);
}



