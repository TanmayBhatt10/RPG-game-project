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
      
      const scale = 3; // Size multiplier for the pixel art
      const px = (x, y, color, w = 1, h = 1) => {
        ctx.fillStyle = color;
        ctx.fillRect(this.x + (x * scale) - 40, this.y + (y * scale) - 50, w * scale, h * scale);
      };

      if (this.flashTime > 0) {
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.1) * 0.5;
      }

      // Black body outline and base
      px(4, 6, '#000', 3, 1);   // top head
      px(3, 7, '#000', 5, 1);
      px(2, 8, '#000', 7, 1);
      px(2, 9, '#000', 7, 2);
      px(1, 11, '#000', 9, 2);
      px(2, 13, '#000', 7, 3);
      px(3, 16, '#000', 5, 2);
      px(1, 18, '#000', 2, 3);  // left leg
      px(8, 18, '#000', 2, 3);  // right leg

      // Cyan/teal flames on head
      px(4, 2, '#00FFFF', 1, 2);
      px(5, 1, '#00FFFF', 1, 1);
      px(6, 2, '#00FFFF', 1, 3);
      px(7, 4, '#00FFFF', 1, 1);

      // Cyan body fill
      px(4, 7, '#00CED1', 3, 1);
      px(3, 8, '#00CED1', 5, 1);
      px(3, 9, '#00CED1', 5, 2);
      px(2, 11, '#00CED1', 7, 2);
      px(3, 13, '#00CED1', 5, 3);
      px(4, 16, '#00CED1', 3, 2);

      // Dark cyan shading
      px(5, 8, '#008B8B', 2, 1);
      px(4, 9, '#008B8B', 4, 1);
      px(5, 10, '#008B8B', 2, 1);
      px(3, 11, '#008B8B', 5, 1);
      px(4, 12, '#008B8B', 3, 1);

      // Green eyes
      px(4, 9, '#00FF00', 1, 1);
      px(6, 9, '#00FF00', 1, 1);

      // White highlights on body
      px(2, 18, '#FFFFFF', 1, 2);  // left leg
      px(3, 18, '#FFFFFF', 1, 1);
      px(7, 18, '#FFFFFF', 1, 1);  // right leg
      px(8, 18, '#FFFFFF', 1, 2);

      // Arms/claws
      px(0, 13, '#000', 2, 2);   // left arm
      px(0, 15, '#000', 1, 1);
      px(9, 13, '#000', 2, 2);   // right arm
      px(10, 15, '#000', 1, 1);

      ctx.globalAlpha = 1;

      // healthbar
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(this.x - 45, this.y - this.radius - 25, 90, 10);
      ctx.fillStyle = "white";
      ctx.fillRect(this.x - 43, this.y - this.radius - 23, 86, 6);
      ctx.fillStyle = this.hp / this.maxHp > 0.5 ? "#00FF00" : this.hp / this.maxHp > 0.25 ? "#FFFF00" : "#FF0000";
      ctx.fillRect(this.x - 43, this.y - this.radius - 23, 86 * (this.hp / this.maxHp), 6);

      ctx.fillStyle = "yellow";
      ctx.font = "bold 18px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`Lives: ${this.lives}`, this.x, this.y - this.radius - 35);
      ctx.textAlign = "left";
      
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