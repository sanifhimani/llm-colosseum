import { ROSTER } from '../state/roster';
import { drawAgentSprite } from './sprites';

const AGENT_MAP = Object.fromEntries(ROSTER.map((r) => [r.id, r]));

const WIDTH = 1200;
const HEIGHT = 628;
const BG = '#0b0c1a';
const GOLD = '#f0c020';
const DIM = '#4a5070';
const WHITE = '#e8e8f0';
const BORDER_COLOR = '#3a6ea8';
const FONT = '"Press Start 2P", monospace';

function drawPixelBorder(ctx) {
  ctx.strokeStyle = BORDER_COLOR;
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, WIDTH - 24, HEIGHT - 24);
  ctx.strokeStyle = '#1a3a5c';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, WIDTH - 40, HEIGHT - 40);
}

function createCanvas() {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(WIDTH, HEIGHT);
  }
  const el = document.createElement('canvas');
  el.width = WIDTH;
  el.height = HEIGHT;
  return el;
}

function canvasToBlob(canvas) {
  if (canvas.convertToBlob) return canvas.convertToBlob({ type: 'image/png' });
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

export async function generateShareCard({ winner, eliminations, totalTurns, totalBetrayals, totalAlliances, totalArtifacts }) {
  await document.fonts.ready;

  const canvas = createCanvas();
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawPixelBorder(ctx);

  ctx.font = `18px ${FONT}`;
  ctx.fillStyle = GOLD;
  ctx.textAlign = 'center';
  ctx.fillText('LLM COLOSSEUM', WIDTH / 2, 60);

  if (!winner) {
    return canvasToBlob(canvas);
  }

  const agent = AGENT_MAP[winner.id];
  const spriteScale = 8;
  const spriteX = (WIDTH / 2) - (7 * spriteScale) / 2;
  const spriteY = 85;

  ctx.imageSmoothingEnabled = false;
  drawAgentSprite(ctx, winner.id, spriteX, spriteY, spriteScale, agent?.color || WHITE);

  const winnerName = agent?.name || winner.id.toUpperCase();
  ctx.font = `20px ${FONT}`;
  ctx.fillStyle = GOLD;
  ctx.textAlign = 'center';
  ctx.fillText(`WINNER: ${winnerName}`, WIDTH / 2, spriteY + 8 * spriteScale + 30);

  if (agent?.model) {
    ctx.font = `10px ${FONT}`;
    ctx.fillStyle = DIM;
    ctx.fillText(agent.model, WIDTH / 2, spriteY + 8 * spriteScale + 50);
  }

  let elimY = spriteY + 8 * spriteScale + 80;
  ctx.font = `10px ${FONT}`;
  ctx.fillStyle = DIM;
  ctx.textAlign = 'center';
  ctx.fillText('ELIMINATION ORDER', WIDTH / 2, elimY);
  elimY += 24;

  for (const elim of eliminations) {
    const targetAgent = AGENT_MAP[elim.target];
    const targetName = targetAgent?.name || elim.target.toUpperCase();
    const targetColor = targetAgent?.color || WHITE;

    let killerText;
    if (elim.isZoneKill) {
      killerText = 'ZONE';
    } else {
      const killerAgent = AGENT_MAP[elim.killer];
      const prefix = elim.isBetray ? 'BETRAYED BY ' : 'BY ';
      killerText = prefix + (killerAgent?.name || elim.killer.toUpperCase());
    }

    ctx.textAlign = 'center';
    ctx.font = `10px ${FONT}`;
    ctx.fillStyle = targetColor;
    ctx.fillText(targetName, WIDTH / 2 - 140, elimY);

    ctx.fillStyle = DIM;
    ctx.fillText(`T${elim.turn}`, WIDTH / 2, elimY);

    ctx.fillStyle = WHITE;
    ctx.font = `9px ${FONT}`;
    ctx.fillText(killerText, WIDTH / 2 + 160, elimY);

    elimY += 22;
  }

  const statsY = HEIGHT - 60;
  const stats = [
    `${totalTurns} TURNS`,
    `${totalBetrayals} BETRAYALS`,
    `${totalAlliances} ALLIANCES`,
    `${totalArtifacts} ARTIFACTS`,
  ];
  ctx.font = `8px ${FONT}`;
  ctx.fillStyle = DIM;
  ctx.textAlign = 'center';
  ctx.fillText(stats.join('  //  '), WIDTH / 2, statsY);

  ctx.font = `8px ${FONT}`;
  ctx.fillStyle = '#2a3050';
  ctx.fillText('llmcolosseum.dev', WIDTH / 2, HEIGHT - 28);

  return canvasToBlob(canvas);
}
