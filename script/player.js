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

  // HP bar under player
  ctx.fillStyle = "white";
  ctx.fillRect(player.x - 30, player.y + 30, 60, 6);
  ctx.fillStyle = "lime";
  ctx.fillRect(player.x - 30, player.y + 30, 60 * (player.hp / player.maxHp), 6);
}
