import { GRID_SIZE, CELL_SIZE, CANVAS_SIZE } from '../state/constants';

const WALL = 8;

function drawTorch(ctx, x, y, now) {
  const frame = Math.floor(now / 250) % 2;

  ctx.fillStyle = '#c06000';
  ctx.fillRect(x - 2, y, 4, 8);

  ctx.fillStyle = frame === 0 ? '#ffcc00' : '#ff8800';
  ctx.fillRect(x - 4, y - 8, 8, 8);

  ctx.fillStyle = frame === 0 ? '#ff8800' : '#ffcc00';
  ctx.fillRect(x - 2, y - 12, 4, 6);

  const grad = ctx.createRadialGradient(x, y, 2, x, y, 24);
  grad.addColorStop(0, 'rgba(255,160,0,0.25)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(x - 24, y - 24, 48, 48);
}

export function drawWalls(ctx, now) {
  ctx.fillStyle = '#2a2a3a';
  ctx.fillRect(0, 0, CANVAS_SIZE, WALL);
  ctx.fillRect(0, CANVAS_SIZE - WALL, CANVAS_SIZE, WALL);
  ctx.fillRect(0, 0, WALL, CANVAS_SIZE);
  ctx.fillRect(CANVAS_SIZE - WALL, 0, WALL, CANVAS_SIZE);

  ctx.fillStyle = '#1a1a2a';
  for (let i = 0; i < GRID_SIZE; i++) {
    const pos = i * CELL_SIZE;
    ctx.fillRect(pos, 0, 2, WALL);
    ctx.fillRect(pos, CANVAS_SIZE - WALL, 2, WALL);
    ctx.fillRect(0, pos, WALL, 2);
    ctx.fillRect(CANVAS_SIZE - WALL, pos, WALL, 2);
  }

  drawTorch(ctx, 12, 12, now);
  drawTorch(ctx, CANVAS_SIZE - 20, 12, now);
  drawTorch(ctx, 12, CANVAS_SIZE - 20, now);
  drawTorch(ctx, CANVAS_SIZE - 20, CANVAS_SIZE - 20, now);
}
