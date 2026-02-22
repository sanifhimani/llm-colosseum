import { GRID_SIZE, CELL_SIZE, CANVAS_SIZE } from '../state/constants';

export function drawZone(ctx, zoneRadius, now) {
  const margin = (GRID_SIZE - zoneRadius * 2) / 2;
  const x1 = Math.floor(margin) * CELL_SIZE;
  const y1 = Math.floor(margin) * CELL_SIZE;
  const size = zoneRadius * 2 * CELL_SIZE;

  ctx.fillStyle = 'rgba(255,0,60,0.1)';
  ctx.fillRect(0, 0, CANVAS_SIZE, y1);
  ctx.fillRect(0, y1 + size, CANVAS_SIZE, CANVAS_SIZE - y1 - size);
  ctx.fillRect(0, y1, x1, size);
  ctx.fillRect(x1 + size, y1, CANVAS_SIZE - x1 - size, size);

  ctx.save();
  const alpha = 0.4 + 0.3 * Math.sin(now / 600);
  ctx.strokeStyle = `rgba(255,50,80,${alpha})`;
  ctx.lineWidth = 4;
  ctx.strokeRect(x1, y1, size, size);
  ctx.restore();
}
