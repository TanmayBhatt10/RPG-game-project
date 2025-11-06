
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gameOverText = document.getElementById("game-over");
const restartBtn = document.getElementById("restart-btn");

let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
let enemies = [], projectiles = [], bossProjectiles = [];
let lastSpawn = 0, spawnInterval = 1500;
let level = 1, xp = 0, xpToNext = 10, currentWeapon = 1;
let isFiring = false, fireCooldown = 0, gameOver = false;
let bossActive = false, bossLives = 3;
let lazerActive = false, lazerStartTime = 0, lazerCooldownTime = 0;

function gainXP(amount) {
    xp += amount;
    while (xp >= xpToNext && level < 10) {
    xp -= xpToNext;
    level++;
    xpToNext = Math.floor(xpToNext * 1.5);
    document.getElementById("level").textContent = level;
    document.getElementById("xpNext").textContent = xpToNext;
    updateWeaponDisplay();
    }
    document.getElementById("xp").textContent = xp;
}

document.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

document.addEventListener("mousedown", () => isFiring = true);
document.addEventListener("mouseup", () => isFiring = false);
document.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
    e.preventDefault();
    currentWeapon = (currentWeapon % 4) + 1;
    updateWeaponDisplay();
    }
});

function updateWeaponDisplay() {
    document.getElementById("weapon").textContent = currentWeapon;
    let baseDamage;
    if (level >= 10 && currentWeapon === 4) baseDamage = 10;
    else if (level >= 6 && currentWeapon === 3) baseDamage = 9;
    else if (level >= 3 && currentWeapon === 2) baseDamage = 6;
    else baseDamage = 3;
    document.getElementById("damage").textContent = baseDamage;
}

const player = {
    x: canvas.width / 2,
    y: canvas.height - 40,
    radius: 20,
    color: "cyan",
    hp: 100,
    maxHp: 100
};

class Enemy {
    constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.radius = type === 'boss' ? 50 : type === 'elite' ? 40 : type === 'mini' ? 30 : type === 'big' ? 35 : 25;
    this.color = type === 'boss' ? 'purple' : type === 'elite' ? 'gold' : type === 'mini' ? 'blue' : type === 'big' ? 'orange' : 'red';
    this.type = type;
    this.maxHp = this.getMaxHp();
    this.hp = this.maxHp;
    this.flashTime = 0;
    this.dmgPopups = [];
    this.teleportCooldown = 0;
    this.shootCooldown = 0;
    this.lives = 3; // Boss lives
    // Boss positioning
    if (type === 'boss') {
        this.x = canvas.width / 2;
        this.y = canvas.height / 4;
    }
    }

    update() {
    if (this.type === 'boss') {
        // Boss stays on screen and moves horizontally
        if (this.teleportCooldown <= 0 && Math.random() < 0.015) { // Increased teleport frequency
        this.x = Math.random() * (canvas.width - 100) + 50;
        this.teleportCooldown = 150; // Reduced cooldown
        }
        if (this.shootCooldown <= 0) {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        
        // Boss shoots faster and more projectiles
        for (let i = 0; i < 2; i++) {
            const spreadAngle = angle + (Math.random() - 0.5) * 0.5;
            bossProjectiles.push({
            x: this.x,
            y: this.y,
            dx: Math.cos(spreadAngle) * 5, // Faster projectiles
            dy: Math.sin(spreadAngle) * 5,
            radius: 12, // Larger projectiles
            color: "red",
            damage: 15, // Increased damage
            life: 200
            });
        }
        
        this.shootCooldown = 40; // Faster shooting
        }
        this.teleportCooldown--;
        this.shootCooldown--;
        
        // Keep boss within screen bounds
        if (this.x < 50) this.x = 50;
        if (this.x > canvas.width - 50) this.x = canvas.width - 50;
        if (this.y < 50) this.y = 50;
        if (this.y > canvas.height / 2) this.y = canvas.height / 2;
    } else {
        // Enemy speed increases after level 5
        let enemySpeed = level >= 5 ? 1.2 : 0.8;
        this.y += enemySpeed;
    }

    // Only non-boss enemies cause damage when reaching bottom
    if (this.y > canvas.height && this.type !== 'boss') {
        player.hp -= 10;
        if (player.hp <= 0) {
        gameOver = true;
        gameOverText.style.display = "block";
        restartBtn.style.display = "block";
        }
        this.hp = 0;
    }
    }

    draw() {
    if (this.type === 'boss') {
        // Draw custom boss sprite based on the image
        ctx.save();
        
        // Flash effect
        if (this.flashTime > 0) {
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = "white";
        }
        
        // Draw boss body (diamond shape)
        ctx.fillStyle = "#8B00FF"; // Purple
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + 40);
        ctx.lineTo(this.x - 35, this.y);
        ctx.lineTo(this.x, this.y - 40);
        ctx.lineTo(this.x + 35, this.y);
        ctx.closePath();
        ctx.fill();
        
        // Draw boss arms (left and right)
        ctx.fillStyle = "#4B0082"; // Dark purple
        // Left arm
        ctx.fillRect(this.x - 60, this.y - 10, 30, 15);
        ctx.fillRect(this.x - 70, this.y - 20, 15, 10);
        ctx.fillRect(this.x - 75, this.y - 15, 10, 8);
        // Right arm
        ctx.fillRect(this.x + 30, this.y - 10, 30, 15);
        ctx.fillRect(this.x + 55, this.y - 20, 15, 10);
        ctx.fillRect(this.x + 65, this.y - 15, 10, 8);
        
        // Draw green energy/fire effect
        ctx.fillStyle = "#00FF00"; // Bright green
        for (let i = 0; i < 5; i++) {
        const offsetX = (Math.random() - 0.5) * 10;
        const offsetY = -50 - Math.random() * 20;
        ctx.fillRect(this.x + offsetX - 3, this.y + offsetY, 6, 8);
        }
        
        // Draw bright green core
        ctx.fillStyle = "#32CD32"; // Lime green
        ctx.fillRect(this.x - 8, this.y - 15, 16, 20);
        
        // Health bar
        ctx.fillStyle = "white";
        ctx.fillRect(this.x - 40, this.y - this.radius - 20, 80, 8);
        ctx.fillStyle = "red";
        ctx.fillRect(this.x - 40, this.y - this.radius - 20, 80 * (this.hp / this.maxHp), 8);
        
        // Lives indicator
        ctx.fillStyle = "yellow";
        ctx.font = "16px Arial";
        ctx.fillText(`Lives: ${this.lives}`, this.x - 25, this.y - this.radius - 35);
        
        ctx.restore();
    } else {
        // Regular enemy drawing
        ctx.fillStyle = this.flashTime > 0 ? "white" : this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Elite enemy special visual effect
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

    // Damage popups
    this.dmgPopups.forEach((pop) => {
        ctx.fillStyle = "yellow";
        ctx.font = "14px Arial";
        ctx.fillText(`-${pop.dmg}`, pop.x, pop.y - (30 - pop.timer));
        pop.timer--;
    });
    this.dmgPopups = this.dmgPopups.filter(p => p.timer > 0);
    if (this.flashTime > 0) this.flashTime--;
    }

    getMaxHp() {
    // Base HP values with level scaling (+0.5 HP per level)
    let baseHp;
    if (this.type === 'boss') baseHp = 200; // Increased from 100
    else if (this.type === 'elite') baseHp = 25;
    else if (this.type === 'mini') baseHp = 20;
    else if (this.type === 'big') baseHp = 10;
    else baseHp = 3;
    
    return Math.ceil(baseHp + (level - 1) * 0.5);
    }
}

function spawnEnemy() {
    if (bossActive) return;
    
    // Increase spawn rate after level 5
    let currentSpawnInterval = level >= 5 ? 1000 : 1500;
    if (Date.now() - lastSpawn < currentSpawnInterval) return;
    
    const x = Math.random() * canvas.width;
    const y = -50;
    let type = 'normal';
    
    if ([2, 5, 9].includes(level)) {
    type = 'mini';
    } else if (level === 10) {
    type = 'boss';
    bossActive = true;
    bossLives = 3; // Reset boss lives
    // Clear all other enemies when boss spawns
    enemies = enemies.filter(e => e.type === 'boss');
    } else if (level >= 5) {
    // After level 5, no more red enemies
    const rand = Math.random();
    if (rand < 0.2) type = 'elite';      // 20% chance for elite (gold)
    else if (rand < 0.5) type = 'mini';  // 30% chance for mini (blue)
    else type = 'big';                   // 50% chance for big (orange)
    } else {
    // Before level 5, include red enemies
    const rand = Math.random();
    if (rand < 0.1) type = 'elite';      // 10% chance for elite
    else if (rand < 0.3) type = 'big';   // 20% chance for big
    else type = 'normal';                // 70% chance for normal (red)
    }
    
    enemies.push(new Enemy(x, y, type));
}

function updatePlayer() {
    const dx = mouse.x - player.x;
    const dy = mouse.y - player.y;
    player.x += dx * 1.0;
    player.y += dy * 1.0;
}

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.fillRect(player.x - 30, player.y + 30, 60, 6);
    ctx.fillStyle = "lime";
    ctx.fillRect(player.x - 30, player.y + 30, 60 * (player.hp / player.maxHp), 6);
}

function fireWeapon() {
    // Handle weapon 4 laser mechanics
    if (level >= 10 && currentWeapon === 4) {
    const currentTime = Date.now();
    
    // Check if in cooldown period
    if (lazerCooldownTime > currentTime) return;
    
    if (isFiring) {
        if (!lazerActive) {
        lazerActive = true;
        lazerStartTime = currentTime;
        }
        
        // Check if laser has been active for 5 seconds
        if (currentTime - lazerStartTime >= 5000) {
        lazerActive = false;
        lazerCooldownTime = currentTime + 3000; // 3 second cooldown
        return;
        }
        
        // Calculate the direction from player to mouse
        const dx = mouse.x - canvas.width / 2;
        const dy = mouse.y - canvas.height;
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        const unitX = dx / magnitude;
        const unitY = dy / magnitude;
        
        // Extend the laser far beyond the mouse position
        const extensionDistance = Math.max(canvas.width, canvas.height) * 2;
        const endX = canvas.width / 2 + unitX * extensionDistance;
        const endY = canvas.height + unitY * extensionDistance;
        
        // Draw laser beam
        ctx.strokeStyle = "magenta";
        ctx.lineWidth = 8;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "magenta";
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Damage enemies hit by laser
        enemies.forEach(enemy => {
        if (enemy.hp <= 0) return;
        
        // Check if enemy intersects with laser line
        const lineDistance = distanceToLine(
            enemy.x, enemy.y,
            canvas.width / 2, canvas.height,
            endX, endY
        );
        
        if (lineDistance < enemy.radius) {
            enemy.hp -= 10 * 0.1; // Fixed damage, no level scaling
            enemy.flashTime = 2;
            if (Math.random() < 0.1) { // Show damage popup occasionally
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
        lazerActive = false;
    }
    return;
    }
    
    // Regular weapon firing
    if (fireCooldown > 0) {
    fireCooldown--;
    return;
    }
    
    const originX = canvas.width / 2;
    const originY = canvas.height;
    const angle = Math.atan2(mouse.y - originY, mouse.x - originX);

    let color = "aqua", radius = 6, speed = 15, damage = 3;
    
    // Base damage calculation - no level scaling
    let baseDamage;
    if (level >= 6 && currentWeapon === 3) {
    color = "lime"; radius = 8; baseDamage = 9; fireCooldown = 5;
    } else if (level >= 3 && currentWeapon === 2) {
    color = "orange"; radius = 7; baseDamage = 6; fireCooldown = 7;
    } else {
    color = "aqua"; radius = 6; baseDamage = 3; fireCooldown = 9;
    }
    
    // No level scaling applied to damage
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

// Helper function to calculate distance from point to line
function distanceToLine(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;
    if (param < 0) {
    xx = x1;
    yy = y1;
    } else if (param > 1) {
    xx = x2;
    yy = y2;
    } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

function updateProjectiles() {
    if (isFiring) fireWeapon();

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
            // Different XP rewards based on enemy type
            let xpReward;
            if (enemy.type === 'boss') {
            // Boss loses a life
            enemy.lives--;
            if (enemy.lives > 0) {
                // Respawn boss with full HP
                enemy.hp = enemy.maxHp;
                enemy.flashTime = 30; // Longer invincibility flash
                xpReward = 10; // Partial XP for defeating a life
            } else {
                // Boss completely defeated
                bossActive = false;
                xpReward = 50; // Big XP reward for final defeat
                console.log("Boss completely defeated!");
            }
            } else if (enemy.type === 'elite') xpReward = 10;       // Gold enemies
            else if (enemy.type === 'mini') xpReward = 5;    // Blue enemies
            else if (enemy.type === 'big') xpReward = 3;     // Orange enemies  
            else xpReward = 1;                               // Red enemies
            
            gainXP(xpReward);
        }
        }
    });
    });

    bossProjectiles.forEach(bp => {
    const dx = player.x - bp.x;
    const dy = player.y - bp.y;
    const dist = Math.hypot(dx, dy);
    if (dist < player.radius + bp.radius) {
        player.hp -= bp.damage;
        bp.life = 0;
        if (player.hp <= 0) {
        gameOver = true;
        gameOverText.style.display = "block";
        restartBtn.style.display = "block";
        }
    }
    });

    projectiles = projectiles.filter(p => p.life > 0);
    bossProjectiles = bossProjectiles.filter(p => p.life > 0);
}

function animate(timestamp) {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updatePlayer();
    drawPlayer();

    if (timestamp - lastSpawn > (level >= 5 ? 1000 : 1500)) {
    spawnEnemy();
    lastSpawn = timestamp;
    }

    enemies = enemies.filter(e => e.hp > 0 || (e.type === 'boss' && e.lives > 0));
    enemies.forEach(enemy => {
    enemy.update();
    enemy.draw();
    });

    updateProjectiles();
    requestAnimationFrame(animate);
}

restartBtn.onclick = () => location.reload();
updateWeaponDisplay(); // Initialize weapon display
requestAnimationFrame(animate);
