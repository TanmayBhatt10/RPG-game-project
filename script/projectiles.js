// js/projectiles.js
import { distanceToLine } from './utils.js';
import { enemies } from './enemy.js';

export let projectiles = [];
export let bossProjectiles = [];

// weapon laser state container
export const laserState = {
  active: false,
  startTime: 0,
  cooldownUntil: 0
};

/**
 * Fire weapon (pushes projectile(s) into projectiles or draws laser)
 * - state: { level, currentWeapon, isFiring } (you can pass inputState and main state)
 * - origin is centered at canvasWidth/2, canvasHeight
 *
 * This function may draw the laser directly if laser is active. Because drawing requires ctx,
 * we accept ctx and canvas dims.
 */
export function fireWeapon(state, inputState, canvasWidth, canvasHeight, ctx) {
  // LASER (weapon 4) - only when level >= 10 and currentWeapon === 4
  if (state.level >= 10 && inputState.currentWeapon === 4) {
    const currentTime = Date.now();

    if (laserState.cooldownUntil > currentTime) return;

    if (inputState.isFiring) {
      if (!laserState.active) {
        laserState.active = true;
        laserState.startTime = currentTime;
      }

      if (currentTime - laserState.startTime >= 5000) {
        laserState.active = false;
        laserState.cooldownUntil = currentTime + 3000;
        return;
      }

      // Calculate laser vector (from bottom center to mouse)
      const dx = inputState.mouse.x - (canvasWidth / 2);
      const dy = inputState.mouse.y - (canvasHeight);
      const magnitude = Math.sqrt(dx * dx + dy * dy) || 1;
      const unitX = dx / magnitude;
      const unitY = dy / magnitude;

      const extensionDistance = Math.max(canvasWidth, canvasHeight) * 2;
      const endX = canvasWidth / 2 + unitX * extensionDistance;
      const endY = canvasHeight + unitY * extensionDistance;

      // draw laser beam
      ctx.strokeStyle = "magenta";
      ctx.lineWidth = 8;
      ctx.shadowBlur = 20;
      ctx.shadowColor = "magenta";
      ctx.beginPath();
      ctx.moveTo(canvasWidth / 2, canvasHeight);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Damage enemies hit
      enemies.forEach(enemy => {
        if (enemy.hp <= 0) return;
        const lineDistance = distanceToLine(enemy.x, enemy.y, canvasWidth / 2, canvasHeight, endX, endY);
        if (lineDistance < enemy.radius) {
          enemy.hp -= 10 * 0.1; // fixed small damage
          enemy.flashTime = 2;
          if (Math.random() < 0.1) {
            enemy.dmgPopups.push({
              dmg: Math.floor(10 * 0.1),
              timer: 20,
              x: enemy.x,
              y: enemy.y
            });
          }
        }
      });
    } else {
      laserState.active = false;
    }
    return;
  }

  // Regular projectiles:
  // simple rate limiting stored on state as fireCooldown
  if (!state.fireCooldown) state.fireCooldown = 0;
  if (state.fireCooldown > 0) {
    state.fireCooldown--;
    return;
  }

  const originX = canvasWidth / 2;
  const originY = canvasHeight;
  const angle = Math.atan2(inputState.mouse.y - originY, inputState.mouse.x - originX);

  let color = "aqua", radius = 6, speed = 15, damage = 3;

  let baseDamage;
  if (state.level >= 6 && inputState.currentWeapon === 3) {
    color = "lime"; radius = 8; baseDamage = 9; state.fireCooldown = 5;
  } else if (state.level >= 3 && inputState.currentWeapon === 2) {
    color = "orange"; radius = 7; baseDamage = 6; state.fireCooldown = 7;
  } else {
    color = "aqua"; radius = 6; baseDamage = 3; state.fireCooldown = 9;
  }

  damage = baseDamage;

  projectiles.push({
    x: originX,
    y: originY,
    dx: Math.cos(angle) * speed,
    dy: Math.sin(angle) * speed,
    radius,
    color,
    damage,
    life: 100
  });
}

/**
 * updateProjectiles:
 * - draws projectiles & bossProjectiles
 * - handles collisions with enemies and player
 * - mutation: projectiles and bossProjectiles arrays
 * - calls callbacks: gainXP(amount), onPlayerDamaged(amount) and onGameOver()
 */
export function updateProjectilesAndCollisions(ctx, canvasWidth, canvasHeight, player, gainXP, onPlayerDamaged, onGameOver) {
  // move & render both projectile types
  [...projectiles, ...bossProjectiles].forEach(p => {
    p.x += p.dx;
    p.y += p.dy;
    p.life--;

    ctx.beginPath();
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = p.color;
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  // projectile hits enemy
  enemies.forEach(enemy => {
    projectiles.forEach(p => {
      const dx = enemy.x - p.x;
      const dy = enemy.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < enemy.radius + p.radius && enemy.hp > 0) {
        enemy.hp -= p.damage;
        enemy.flashTime = 5;
        enemy.dmgPopups.push({ dmg: p.damage, timer: 30, x: enemy.x, y: enemy.y });
        p.life = 0;
        if (enemy.hp <= 0) {
          // XP rewards
          let xpReward;
          if (enemy.type === 'boss') {
            enemy.lives--;
            if (enemy.lives > 0) {
              enemy.hp = enemy.maxHp;
              enemy.flashTime = 30;
              xpReward = 10;
            } else {
              // boss fully dead
              xpReward = 50;
            }
          } else if (enemy.type === 'elite') xpReward = 11;
          else if (enemy.type === 'mini') xpReward = 6;
          else if (enemy.type === 'big') xpReward = 3;
          else xpReward = 1;
          gainXP(xpReward);
        }
      }
    });
  });

  // bossProjectiles hitting player
  bossProjectiles.forEach(bp => {
    const dx = player.x - bp.x;
    const dy = player.y - bp.y;
    const dist = Math.hypot(dx, dy);
    if (dist < player.radius + bp.radius) {
      player.hp -= bp.damage;
      bp.life = 0;
      onPlayerDamaged(bp.damage);
      if (player.hp <= 0) {
        onGameOver();
      }
    }
  });

  // enemies that hit bottom should damage player
  // (we already set their hp=0 when crossing bottom inside Enemy.update)
  enemies.forEach(enemy => {
    if (enemy.y > canvasHeight && enemy.type !== 'boss') {
      // reduce player hp by 10 (same as original)
      player.hp -= 10;
      if (player.hp <= 0) {
        onGameOver();
      }
    }
  });

  projectiles = projectiles.filter(p => p.life > 0);
  bossProjectiles = bossProjectiles.filter(p => p.life > 0);
}
