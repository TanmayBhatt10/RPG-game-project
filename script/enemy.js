// js/enemy.js
// Exports: enemies array, Enemy class, spawnEnemy

export const enemies = [];

export class Enemy {
  constructor(x, y, type, canvasWidth, canvasHeight) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = type === 'boss' ? 50 :
                  type === 'elite' ? 40 :
                  type === 'mini' ? 30 :
                  type === 'big' ? 35 : 25;
    this.color = type === 'boss' ? 'purple' :
                 type === 'elite' ? 'gold' :
                 type === 'mini' ? 'blue' :
                 type === 'big' ? 'orange' : 'red';
    this.maxHp = this.getMaxHp(1);
    this.hp = this.maxHp;
    this.flashTime = 0;
    this.dmgPopups = [];
    this.teleportCooldown = 0;
    this.shootCooldown = 0;
    this.lives = 3;
    // Boss positioning
    if (type === 'boss') {
      this.x = canvasWidth / 2;
      this.y = canvasHeight / 4;
    }
  }

  update(player, level, canvasWidth, canvasHeight, bossProjectiles) {
    if (this.type === 'boss') {
      // boss behavior: teleport & shoot
      if (this.teleportCooldown <= 0 && Math.random() < 0.015) {
        this.x = Math.random() * (canvasWidth - 100) + 50;
        this.teleportCooldown = 150;
      }
      if (this.shootCooldown <= 0) {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        for (let i = 0; i < 2; i++) {
          const spreadAngle = angle + (Math.random() - 0.5) * 0.5;
          bossProjectiles.push({
            x: this.x,
            y: this.y,
            dx: Math.cos(spreadAngle) * 5,
            dy: Math.sin(spreadAngle) * 5,
            radius: 12,
            color: "red",
            damage: 15,
            life: 200
          });
        }
        this.shootCooldown = 40;
      }
      this.teleportCooldown--;
      this.shootCooldown--;

      // Keep boss within bounds
      if (this.x < 50) this.x = 50;
      if (this.x > canvasWidth - 50) this.x = canvasWidth - 50;
      if (this.y < 50) this.y = 50;
      if (this.y > canvasHeight / 2) this.y = canvasHeight / 2;
    } else {
      let enemySpeed = level >= 5 ? 1.2 : 0.8;
      this.y += enemySpeed;
    }
    
    // Note: We don't set hp = 0 here anymore
    // Main.js will handle enemies that reach the bottom
  }

  draw(ctx) {
    if (this.type === 'boss') {
      ctx.save();
      if (this.flashTime > 0) {
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = "white";
      }

      ctx.fillStyle = "#8B00FF";
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + 40);
      ctx.lineTo(this.x - 35, this.y);
      ctx.lineTo(this.x, this.y - 40);
      ctx.lineTo(this.x + 35, this.y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#4B0082";
      ctx.fillRect(this.x - 60, this.y - 10, 30, 15);
      ctx.fillRect(this.x - 70, this.y - 20, 15, 10);
      ctx.fillRect(this.x - 75, this.y - 15, 10, 8);

      ctx.fillRect(this.x + 30, this.y - 10, 30, 15);
      ctx.fillRect(this.x + 55, this.y - 20, 15, 10);
      ctx.fillRect(this.x + 65, this.y - 15, 10, 8);

      ctx.fillStyle = "#00FF00";
      for (let i = 0; i < 5; i++) {
        const offsetX = (Math.random() - 0.5) * 10;
        const offsetY = -50 - Math.random() * 20;
        ctx.fillRect(this.x + offsetX - 3, this.y + offsetY, 6, 8);
      }

      ctx.fillStyle = "#32CD32";
      ctx.fillRect(this.x - 8, this.y - 15, 16, 20);

      // healthbar
      ctx.fillStyle = "white";
      ctx.fillRect(this.x - 40, this.y - this.radius - 20, 80, 8);
      ctx.fillStyle = "red";
      ctx.fillRect(this.x - 40, this.y - this.radius - 20, 80 * (this.hp / this.maxHp), 8);

      ctx.fillStyle = "yellow";
      ctx.font = "16px Arial";
      ctx.fillText(`Lives: ${this.lives}`, this.x - 25, this.y - this.radius - 35);
      ctx.restore();
    } else {
      ctx.fillStyle = this.flashTime > 0 ? "white" : this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();

      if (this.type === 'elite') {
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = "white";
      ctx.fillRect(this.x - 20, this.y - this.radius - 15, 40, 5);
      ctx.fillStyle = "lime";
      ctx.fillRect(this.x - 20, this.y - this.radius - 15, 40 * (this.hp / this.maxHp), 5);
    }

    // damage popups
    this.dmgPopups.forEach((pop) => {
      ctx.fillStyle = "yellow";
      ctx.font = "14px Arial";
      ctx.fillText(`-${pop.dmg}`, pop.x, pop.y - (30 - pop.timer));
      pop.timer--;
    });
    this.dmgPopups = this.dmgPopups.filter(p => p.timer > 0);
    if (this.flashTime > 0) this.flashTime--;
  }

  getMaxHp(level) {
    let baseHp;
    if (this.type === 'boss') baseHp = 200;
    else if (this.type === 'elite') baseHp = 25;
    else if (this.type === 'mini') baseHp = 20;
    else if (this.type === 'big') baseHp = 10;
    else baseHp = 3;
    return Math.ceil(baseHp + (level - 1) * 0.5);
  }
}

export function spawnEnemy(enemies, level, canvasWidth, canvasHeight) {
  // returns true if boss spawned (so main can set bossActive)
  if (level === 10) {
    // spawn boss
    enemies.length = 0; // clear other enemies
    enemies.push(new Enemy(canvasWidth / 2, canvasHeight / 4, 'boss', canvasWidth, canvasHeight));
    return true;
  }

  const x = Math.random() * canvasWidth;
  const y = -50;
  let type = 'normal';

  if ([2,5,9].includes(level)) {
    type = 'mini';
  } else if (level >= 5) {
    const rand = Math.random();
    if (rand < 0.2) type = 'elite';
    else if (rand < 0.5) type = 'mini';
    else type = 'big';
  } else {
    const rand = Math.random();
    if (rand < 0.1) type = 'elite';
    else if (rand < 0.3) type = 'big';
    else type = 'normal';
  }

  enemies.push(new Enemy(x, y, type, canvasWidth, canvasHeight));
  return false;
}