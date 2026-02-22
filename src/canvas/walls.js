import { GRID_SIZE, CELL_SIZE, CANVAS_SIZE } from '../state/constants';

const WALL = 8;

const torchFrames = [null, null];

function buildTorchFrame(frame) {
  const size = 48;
  const offscreen = new OffscreenCanvas(size, size);
  const ctx = offscreen.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  ctx.fillStyle = '#c06000';
  ctx.fillRect(cx - 2, cy, 4, 8);

  ctx.fillStyle = frame === 0 ? '#ffcc00' : '#ff8800';
  ctx.fillRect(cx - 4, cy - 8, 8, 8);

  ctx.fillStyle = frame === 0 ? '#ff8800' : '#ffcc00';
  ctx.fillRect(cx - 2, cy - 12, 4, 6);

  const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 24);
  grad.addColorStop(0, 'rgba(255,160,0,0.25)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  return offscreen;
}

function getTorchFrame(frame) {
  if (!torchFrames[frame]) torchFrames[frame] = buildTorchFrame(frame);
  return torchFrames[frame];
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

  const frame = Math.floor(now / 250) % 2;
  const torch = getTorchFrame(frame);
  const positions = [
    [12, 12],
    [CANVAS_SIZE - 20, 12],
    [12, CANVAS_SIZE - 20],
    [CANVAS_SIZE - 20, CANVAS_SIZE - 20],
  ];
  for (const [x, y] of positions) {
    ctx.drawImage(torch, x - 24, y - 24);
  }
}
