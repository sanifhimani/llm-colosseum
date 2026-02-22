import { GRID_SIZE, CELL_SIZE, CANVAS_SIZE } from '../state/constants';

let cache = null;

function buildFloor() {
  const offscreen = new OffscreenCanvas(CANVAS_SIZE, CANVAS_SIZE);
  const ctx = offscreen.getContext('2d');

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const x = c * CELL_SIZE;
      const y = r * CELL_SIZE;
      ctx.fillStyle = (r + c) % 2 === 0 ? '#7a6040' : '#6a5030';
      ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      ctx.fillStyle = '#4a3820';
      ctx.fillRect(x, y, CELL_SIZE, 1);
      ctx.fillRect(x, y, 1, CELL_SIZE);
    }
  }

  return offscreen;
}

export function drawFloor(ctx) {
  if (!cache) cache = buildFloor();
  ctx.drawImage(cache, 0, 0);
}
