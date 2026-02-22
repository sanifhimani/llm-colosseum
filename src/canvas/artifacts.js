import { CELL_SIZE } from '../state/constants';

export function drawArtifacts(ctx, artifacts, now) {
  for (const artifact of artifacts) {
    if (!artifact.active) continue;

    const [r, c] = artifact.pos;
    const x = c * CELL_SIZE;
    const y = r * CELL_SIZE;
    const cx = x + CELL_SIZE / 2;
    const cy = y + CELL_SIZE / 2;

    const alpha = 0.3 + 0.2 * Math.sin(now / 400);
    ctx.fillStyle = `rgba(100,200,255,${alpha})`;
    ctx.fillRect(x + 4, y + 4, CELL_SIZE - 8, CELL_SIZE - 8);

    ctx.font = `${CELL_SIZE * 0.5}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(artifact.icon, cx, cy);
  }
}
