import { CELL_SIZE } from '../state/constants';
import { drawAgentSprite } from '../utils/sprites';
import { getHpColor } from '../utils/hp';

const SPRITE_SCALE = 2.5;
const SPRITE_WIDTH = 8;
const SPRITE_HEIGHT = 10;

export function drawAgent(ctx, agent, stunned = false) {
  if (!agent.alive) return;

  const [r, c] = agent.pos;
  const x = c * CELL_SIZE;
  const y = r * CELL_SIZE;
  const cx = x + CELL_SIZE / 2;
  const cy = y + CELL_SIZE / 2;

  if (stunned) {
    const blink = Math.sin(Date.now() / 150) * 0.5 + 0.5;
    ctx.save();
    ctx.globalAlpha = 0.25 + blink * 0.35;
  }

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(cx - 10, cy + 10, 20, 6);

  const px = cx - (SPRITE_WIDTH * SPRITE_SCALE) / 2;
  const py = cy - (SPRITE_HEIGHT * SPRITE_SCALE) / 2;
  drawAgentSprite(ctx, agent.id, px, py, SPRITE_SCALE, agent.color);

  const barWidth = CELL_SIZE - 8;
  const bx = x + 4;
  const by = y + CELL_SIZE - 10;
  const pct = agent.hp / agent.maxHp;
  const barColor = getHpColor(pct);

  ctx.fillStyle = '#111';
  ctx.fillRect(bx, by, barWidth, 5);
  ctx.fillStyle = barColor;
  ctx.fillRect(bx, by, barWidth * pct, 5);
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx, by, barWidth, 5);

  if (stunned) {
    ctx.restore();
  }
}

export function drawDead(ctx, agent) {
  const [r, c] = agent.pos;
  const cx = c * CELL_SIZE + CELL_SIZE / 2;
  const cy = r * CELL_SIZE + CELL_SIZE / 2;

  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#888';
  ctx.fillRect(cx - 6, cy - 6, 12, 10);
  ctx.fillStyle = '#111';
  ctx.fillRect(cx - 4, cy - 4, 3, 3);
  ctx.fillRect(cx + 1, cy - 4, 3, 3);
  ctx.fillRect(cx - 1, cy + 2, 2, 2);
  ctx.restore();
}

export function drawThinking(ctx, agent, now) {
  const [r, c] = agent.pos;
  const cx = c * CELL_SIZE + CELL_SIZE / 2;
  const cy = r * CELL_SIZE;

  const dotCount = 3;
  const dotSize = 3;
  const gap = 6;
  const startX = cx - ((dotCount - 1) * gap) / 2;
  const baseY = cy + 2;

  ctx.save();
  for (let i = 0; i < dotCount; i++) {
    const phase = (now / 300 + i) % dotCount;
    const alpha = phase < 1 ? 1.0 : 0.3;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = agent.color;
    ctx.fillRect(startX + i * gap - dotSize / 2, baseY - dotSize / 2, dotSize, dotSize);
  }
  ctx.restore();
}

export function drawStunned(ctx, agent, now) {
  const [r, c] = agent.pos;
  const cx = c * CELL_SIZE + CELL_SIZE / 2;
  const cy = r * CELL_SIZE;

  const flash = Math.floor(now / 400) % 2 === 0;
  const alpha = flash ? 1.0 : 0.4;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = '7px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e83838';
  ctx.fillText('X X', cx, cy + 4);
  ctx.restore();
}

export function drawNametags(ctx, agents) {
  ctx.save();
  ctx.font = '5px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  for (const agent of agents) {
    const [r, c] = agent.pos;
    const cx = c * CELL_SIZE + CELL_SIZE / 2;
    const cy = r * CELL_SIZE + 4;
    const name = agent.name.split(' ')[0];

    ctx.globalAlpha = agent.alive ? 1 : 0.35;

    const measured = ctx.measureText(name);
    const width = measured.width + 4;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(cx - width / 2, cy, width, 8);
    ctx.fillStyle = agent.alive ? agent.color : '#888';
    ctx.fillText(name, cx, cy + 1);
  }

  ctx.restore();
}
