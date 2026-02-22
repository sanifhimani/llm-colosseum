import { GRID_SIZE, CELL_SIZE } from '../state/constants';

export function drawFloor(ctx) {
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
}
