// js/main.js
import { inputState, initInput } from './input.js';
import { player, initPlayer, updatePlayer, drawPlayer } from './player.js';
import { enemies, spawnEnemy } from './enemy.js';
import { projectiles, bossProjectiles, fireWeapon, updateProjectilesAndCollisions, laserState } from './projectiles.js';
import { updateWeaponDisplay, updateXPUI, gainXP } from './ui.js';

// State container for game-level values
const state = {
  level: 1,
  xp: 0,
  xpToNext: 10,
  gameOver: false,
  bossActive: false,
  bossLives: 3,
  lastSpawnTime: 0
};

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

  // Update & draw enemies
  // Pass bossProjectiles array so boss can push bullets into it
  enemies.forEach(enemy => enemy.update(player, state.level, canvas.width, canvas.height, bossProjectiles));
  // filter enemies preserving boss while lives >0
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.hp <= 0 && !(e.type === 'boss' && e.lives > 0)) {
      // remove fully dead non-boss or boss with no lives
      enemies.splice(i, 1);
    }
  }
  enemies.forEach(enemy => enemy.draw(ctx));

  // Only fire when mouse button is pressed
  if (inputState.isFiring) {
    const firingState = { level: state.level, fireCooldown: state.fireCooldown || 0 };
    fireWeapon(firingState, inputState, canvas.width, canvas.height, ctx);
    state.fireCooldown = firingState.fireCooldown;
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

  requestAnimationFrame(animate);
}

// start loop
requestAnimationFrame(animate);
