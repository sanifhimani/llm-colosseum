import { ROSTER } from '../state/roster';
import { drawAgentSprite } from './sprites';

const AGENT_MAP = Object.fromEntries(ROSTER.map((r) => [r.id, r]));

const WIDTH = 1200;
const HEIGHT = 628;
const BG = '#0e1530';
const DIM = '#4a5070';
const WHITE = '#e8e8f0';
const INNER_BORDER = '#1a3a5c';
const RED = '#e83838';
const FONT = '"Press Start 2P", monospace';

const CONTENT_PAD_X = 48;
const LEFT_WIDTH = 380;
const LEFT_CENTER = CONTENT_PAD_X + LEFT_WIDTH / 2;
const RIGHT_X = CONTENT_PAD_X + LEFT_WIDTH + 40;
const RIGHT_END = WIDTH - CONTENT_PAD_X;

function agentName(id) {
  return AGENT_MAP[id]?.name || id.toUpperCase();
}

function generateNarrative(stats) {
  const { winner, eliminations, totalTurns, winnerHp, betrayedBy } = stats;
  if (!winner) return null;

  const finalElim = eliminations[eliminations.length - 1];
  if (finalElim && finalElim.isBetray && finalElim.killer === winner.id) {
    return `BETRAYED ${agentName(finalElim.target)} TO WIN IT ALL`;
  }

  if (winnerHp && winnerHp <= 15) {
    return `WON WITH JUST ${winnerHp}HP LEFT`;
  }

  const winnerKills = eliminations.filter((e) => e.killer === winner.id);
  const zoneKills = eliminations.filter((e) => e.isZoneKill);
  if (winnerKills.length === 3 && zoneKills.length === 0) {
    return 'ELIMINATED ALL 3 OPPONENTS';
  }

  if (betrayedBy && betrayedBy.length > 0) {
    return `GOT BETRAYED BY ${agentName(betrayedBy[0])} AND STILL WON`;
  }

  return `${winnerKills.length} KILLS IN ${totalTurns} TURNS`;
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

function drawScanlines(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  for (let y = 3; y < HEIGHT; y += 4) {
    ctx.fillRect(0, y, WIDTH, 1);
  }
  ctx.restore();
}

function drawGlow(ctx, accent) {
  const gradient = ctx.createRadialGradient(WIDTH / 2, -50, 0, WIDTH / 2, -50, 350);
  gradient.addColorStop(0, accent);
  gradient.addColorStop(1, 'transparent');
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, 350);
  ctx.restore();
}

function drawBorders(ctx, accent) {
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, WIDTH - 12, HEIGHT - 12);

  ctx.strokeStyle = INNER_BORDER;
  ctx.lineWidth = 2;
  ctx.strokeRect(14, 14, WIDTH - 28, HEIGHT - 28);
}

function drawHeader(ctx, stats) {
  ctx.font = `9px ${FONT}`;
  ctx.fillStyle = DIM;
  ctx.letterSpacing = '2px';
  ctx.textAlign = 'left';
  ctx.fillText('LLM COLOSSEUM', CONTENT_PAD_X, 44);
  ctx.textAlign = 'right';
  const seasonNum = stats.season || '1';
  const dayLabel = stats.day ? ` // D${stats.day}` : '';
  ctx.fillText(`S${seasonNum}${dayLabel}`, RIGHT_END, 44);
  ctx.letterSpacing = '0px';
}

function drawTextSpaced(ctx, text, x, y, spacing) {
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';

  const chars = text.split('');
  let totalWidth = 0;
  for (const ch of chars) {
    totalWidth += ctx.measureText(ch).width + spacing;
  }
  totalWidth -= spacing;

  let cx = x - totalWidth / 2;
  for (const ch of chars) {
    const charWidth = ctx.measureText(ch).width;
    ctx.fillText(ch, cx, y);
    cx += charWidth + spacing;
  }

  ctx.textAlign = prevAlign;
}

function measureLeftColumn() {
  const spriteH = 8 * 14;
  const gapAfterSprite = 40;
  const nameH = 32;
  const gapAfterName = 20;
  const tagH = 12;
  const gapAfterTag = 14;
  const modelH = 9;
  const gapAfterModel = 28;
  const losersH = 32;
  return spriteH + gapAfterSprite + nameH + gapAfterName + tagH + gapAfterTag + modelH + gapAfterModel + losersH;
}

function measureRightColumn(elimCount) {
  const narrativeBlock = 56;
  const gapAfterNarrative = 36;
  const killFeedH = elimCount * 36;
  const gapAfterKillFeed = 36;
  const statsH = 10;
  return narrativeBlock + gapAfterNarrative + killFeedH + gapAfterKillFeed + statsH;
}

function drawWinnerSprite(ctx, winnerId, accent, startY) {
  const spriteScale = 14;
  const spriteW = 7 * spriteScale;
  const spriteH = 8 * spriteScale;
  const spriteX = LEFT_CENTER - spriteW / 2;

  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 50;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.ellipse(LEFT_CENTER, startY + spriteH + 4, 45, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  ctx.imageSmoothingEnabled = false;
  drawAgentSprite(ctx, winnerId, spriteX, startY, spriteScale, accent);

  return startY + spriteH;
}

function drawWinnerInfo(ctx, agent, accent, spriteBottom) {
  let y = spriteBottom + 40;

  ctx.font = `32px ${FONT}`;
  ctx.fillStyle = accent;
  ctx.textAlign = 'center';
  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 30;
  drawTextSpaced(ctx, agent.name, LEFT_CENTER, y, 14);
  ctx.shadowBlur = 0;
  ctx.restore();
  y += 32 + 20;

  ctx.font = `12px ${FONT}`;
  ctx.fillStyle = WHITE;
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.letterSpacing = '3px';
  ctx.textAlign = 'center';
  ctx.fillText('WINS THE COLOSSEUM', LEFT_CENTER, y);
  ctx.letterSpacing = '0px';
  ctx.restore();
  y += 12 + 14;

  if (agent.model) {
    ctx.font = `9px ${FONT}`;
    ctx.fillStyle = DIM;
    ctx.letterSpacing = '1px';
    ctx.textAlign = 'center';
    ctx.fillText(agent.model, LEFT_CENTER, y);
    ctx.letterSpacing = '0px';
  }
  y += 9 + 28;

  return y;
}

function drawLosers(ctx, winnerId, y) {
  const losers = ROSTER.filter((r) => r.id !== winnerId);
  const loserWidth = 100;
  const gap = 16;
  const totalWidth = losers.length * loserWidth + (losers.length - 1) * gap;
  let lx = LEFT_CENTER - totalWidth / 2;

  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.imageSmoothingEnabled = false;

  for (const loser of losers) {
    const spriteScale = 4;
    const spriteW = 7 * spriteScale;
    const spriteH = 8 * spriteScale;

    drawAgentSprite(ctx, loser.id, lx, y, spriteScale, loser.color);

    ctx.font = `8px ${FONT}`;
    ctx.fillStyle = WHITE;
    ctx.textAlign = 'left';
    ctx.letterSpacing = '1px';
    ctx.fillText(loser.name, lx + spriteW + 6, y + spriteH / 2 + 3);
    ctx.letterSpacing = '0px';

    lx += loserWidth + gap;
  }

  ctx.restore();
}

function drawNarrative(ctx, text, accent, y) {
  const ruleX1 = RIGHT_X;
  const ruleX2 = RIGHT_END;

  ctx.strokeStyle = INNER_BORDER;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ruleX1, y);
  ctx.lineTo(ruleX2, y);
  ctx.stroke();

  const textY = y + 34;
  ctx.font = `14px ${FONT}`;
  ctx.fillStyle = accent;
  ctx.textAlign = 'left';
  ctx.letterSpacing = '2px';
  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 20;
  ctx.fillText(text, RIGHT_X, textY);
  ctx.shadowBlur = 0;
  ctx.restore();
  ctx.letterSpacing = '0px';

  const bottomRule = textY + 22;
  ctx.strokeStyle = INNER_BORDER;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ruleX1, bottomRule);
  ctx.lineTo(ruleX2, bottomRule);
  ctx.stroke();

  return bottomRule;
}

function drawKillFeed(ctx, eliminations, accent, startY) {
  let y = startY;
  const ROW_HEIGHT = 36;

  for (const elim of eliminations) {
    const isBetray = elim.isBetray;
    const iconColor = isBetray ? RED : accent;
    const nameColor = isBetray ? RED : WHITE;
    const methodColor = isBetray ? RED : DIM;
    const icon = isBetray ? '!' : 'x';

    ctx.font = `8px ${FONT}`;
    ctx.fillStyle = iconColor;
    ctx.textAlign = 'left';
    ctx.fillText(icon, RIGHT_X, y);

    const targetAgent = AGENT_MAP[elim.target];
    const targetName = targetAgent?.name || elim.target.toUpperCase();

    ctx.font = `10px ${FONT}`;
    ctx.fillStyle = nameColor;
    ctx.letterSpacing = '1px';
    ctx.fillText(targetName, RIGHT_X + 22, y);
    ctx.letterSpacing = '0px';

    let method;
    if (elim.isZoneKill) {
      method = 'ZONE KILL';
    } else if (elim.isBetray) {
      method = 'BETRAYED';
    } else {
      method = 'ELIMINATED';
    }

    ctx.font = `9px ${FONT}`;
    ctx.fillStyle = methodColor;
    ctx.fillText(method, RIGHT_X + 220, y);

    ctx.fillStyle = DIM;
    ctx.font = `9px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(`T${elim.turn}`, RIGHT_END, y);
    ctx.textAlign = 'left';

    y += ROW_HEIGHT;
  }

  return y;
}

function drawStatsBar(ctx, stats, accent, y) {
  const items = [
    [stats.totalTurns, 'TURNS'],
    [stats.totalBetrayals, stats.totalBetrayals === 1 ? 'BETRAYAL' : 'BETRAYALS'],
    [stats.totalAlliances, stats.totalAlliances === 1 ? 'ALLIANCE' : 'ALLIANCES'],
    [stats.totalKills, stats.totalKills === 1 ? 'KILL' : 'KILLS'],
  ];

  ctx.font = `9px ${FONT}`;
  ctx.letterSpacing = '1px';
  let x = RIGHT_X;

  for (let i = 0; i < items.length; i++) {
    const [val, label] = items[i];

    ctx.fillStyle = accent;
    ctx.textAlign = 'left';
    const valText = String(val);
    ctx.fillText(valText, x, y);
    const valWidth = ctx.measureText(valText).width;

    ctx.fillStyle = DIM;
    ctx.fillText(` ${label}`, x + valWidth, y);
    const labelWidth = ctx.measureText(` ${label}`).width;

    x += valWidth + labelWidth + 28;
  }

  ctx.letterSpacing = '0px';
}

function drawFooter(ctx) {
  ctx.font = `8px ${FONT}`;
  ctx.fillStyle = DIM;
  ctx.textAlign = 'center';
  ctx.letterSpacing = '3px';
  ctx.fillText('llmcolosseum.dev', WIDTH / 2, HEIGHT - 20);
  ctx.letterSpacing = '0px';
}

export async function generateShareCard(stats) {
  await document.fonts.ready;

  const canvas = createCanvas();
  const ctx = canvas.getContext('2d');

  const { winner, eliminations } = stats;
  const agent = winner ? AGENT_MAP[winner.id] : null;
  const accent = agent?.color || WHITE;

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawGlow(ctx, accent);
  drawBorders(ctx, accent);
  drawHeader(ctx, stats);

  if (!winner || !agent) {
    drawScanlines(ctx);
    return canvasToBlob(canvas);
  }

  const bodyTop = 65;
  const bodyBottom = 585;
  const bodyH = bodyBottom - bodyTop;

  const leftH = measureLeftColumn();
  const rightH = measureRightColumn(eliminations.length);
  const contentH = Math.max(leftH, rightH);
  const startY = bodyTop + (bodyH - contentH) / 2;

  const spriteBottom = drawWinnerSprite(ctx, winner.id, accent, startY);
  const losersY = drawWinnerInfo(ctx, agent, accent, spriteBottom);
  drawLosers(ctx, winner.id, losersY);

  const rightStartY = bodyTop + (bodyH - rightH) / 2;
  const narrative = generateNarrative(stats);
  const narrativeBottom = drawNarrative(ctx, narrative, accent, rightStartY);
  const killFeedBottom = drawKillFeed(ctx, eliminations, accent, narrativeBottom + 36);
  drawStatsBar(ctx, stats, accent, killFeedBottom + 36);
  drawFooter(ctx);

  drawScanlines(ctx);

  return canvasToBlob(canvas);
}
