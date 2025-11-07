// js/player.js
export const player = {
  x: 0,
  y: 0,
  radius: 20,
  color: "cyan",
  hp: 100,
  maxHp: 100
};

// update player position toward input mouse (smooth)
export function initPlayer(canvasWidth, canvasHeight) {
  player.x = canvasWidth / 2;
  player.y = canvasHeight - 40;
}

// inputState.mouse passed from main
export function updatePlayer(inputState) {
  const dx = inputState.mouse.x - player.x;
  const dy = inputState.mouse.y - player.y;
  player.x += dx * 1.0;
  player.y += dy * 1.0;
}

export function drawPlayer(ctx) {
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();
}

// New function to draw health bar at fixed position
export function drawHealthBar(ctx, canvasWidth) {
  const barWidth = 200;
  const barHeight = 25;
  const padding = 20;
  const x = canvasWidth - barWidth - padding;
  const y = padding;

  // Save context state
  ctx.save();

  // Background (border)
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.fillRect(x - 3, y - 3, barWidth + 6, barHeight + 6);

  // White background
  ctx.fillStyle = "white";
  ctx.fillRect(x, y, barWidth, barHeight);

  // Health bar (green/yellow/red based on HP)
  const healthPercent = Math.max(0, player.hp / player.maxHp);
  let healthColor;
  if (healthPercent > 0.6) healthColor = "#00FF00";
  else if (healthPercent > 0.3) healthColor = "#FFFF00";
  else healthColor = "#FF0000";

  ctx.fillStyle = healthColor;
  ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

  // Health text
  ctx.fillStyle = "black";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`HP: ${Math.max(0, Math.floor(player.hp))} / ${player.maxHp}`, x + barWidth / 2, y + barHeight / 2);

  // Restore context state
  ctx.restore();
}