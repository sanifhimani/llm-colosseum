import { CELL_SIZE } from '../state/constants';

export function drawAlliances(ctx, agents) {
  const drawn = new Set();

  for (const agent of agents) {
    if (!agent.alive) continue;

    for (const allyId of agent.alliances) {
      const key = [agent.id, allyId].sort().join('-');
      if (drawn.has(key)) continue;
      drawn.add(key);

      const ally = agents.find((a) => a.id === allyId);
      if (!ally || !ally.alive) continue;

      const x1 = agent.pos[1] * CELL_SIZE + CELL_SIZE / 2;
      const y1 = agent.pos[0] * CELL_SIZE + CELL_SIZE / 2;
      const x2 = ally.pos[1] * CELL_SIZE + CELL_SIZE / 2;
      const y2 = ally.pos[0] * CELL_SIZE + CELL_SIZE / 2;

      ctx.strokeStyle = '#38e858aa';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}
