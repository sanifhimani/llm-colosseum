import { parseGrudgeKey } from './game/actions.js';

const VALID_DIRECTIONS = ['N', 'S', 'E', 'W'];

export function buildPrompt(state, agent, memories = [], recentEvents = [], standings = null) {
  const others = state.agents.filter((a) => a.alive && a.id !== agent.id);
  const { zoneRadius, turn, grudges, artifacts, rules } = state;
  const gridSize = rules.gridSize;
  const turnsUntilShrink = rules.zoneShrinkInterval - (turn % rules.zoneShrinkInterval);
  const attackRange = rules.attackRange || 3;

  const allyNames = agent.alliances
    .map((id) => state.agents.find((a) => a.id === id)?.name)
    .filter(Boolean);

  const validMoves = getValidMoves(agent, state.agents, gridSize, zoneRadius);

  const opponentLines = others.map((o) => {
    const dist = Math.abs(agent.pos[0] - o.pos[0]) + Math.abs(agent.pos[1] - o.pos[1]);
    const dir = directionHint(agent.pos, o.pos);
    const allyTag = agent.alliances.includes(o.id) ? ' ALLY' : '';
    const rangeTag = dist <= attackRange ? ' IN-RANGE' : '';
    return `- ${o.name}: HP:${o.hp} POS:[${o.pos}] ${dir} DIST:${dist} TRUST:${o.trust}${allyTag}${rangeTag}`;
  });

  const activeArtifacts = artifacts.filter((a) => a.active);
  const artifactLines = activeArtifacts.map((a) => {
    const dir = directionHint(agent.pos, a.pos);
    const dist = Math.abs(agent.pos[0] - a.pos[0]) + Math.abs(agent.pos[1] - a.pos[1]);
    return `${a.name} at [${a.pos}] ${dir} DIST:${dist}`;
  });
  const artifactLine = artifactLines.length > 0 ? artifactLines.join(' | ') : 'none on map';

  const zoneInfo = buildZoneInfo(agent.pos, zoneRadius, gridSize, turnsUntilShrink, rules.zoneDamage);

  const memoryBlock = memories.length > 0
    ? memories.join('\n')
    : 'No memories from previous battles.';

  const eventBlock = recentEvents.length > 0
    ? recentEvents.join('\n')
    : 'Battle just started.';

  const seasonBlock = buildSeasonContext(agent, state.agents, standings);

  const grudgesAgainst = [];
  const grudgesFrom = [];
  for (const [key, count] of Object.entries(grudges)) {
    const { from, to } = parseGrudgeKey(key);
    const fromName = state.agents.find((a) => a.id === from)?.name;
    const toName = state.agents.find((a) => a.id === to)?.name;
    if (to === agent.id && fromName) grudgesAgainst.push(`${fromName} ${count}x`);
    if (from === agent.id && toName) grudgesFrom.push(`${toName} ${count}x`);
  }

  const actionChoices = buildActionChoices(agent, others, activeArtifacts, attackRange, validMoves);

  return [
    `ARENA BATTLE - You are ${agent.name}. Turn ${turn}. Pick ONE action.`,
    '',
    `GRID: ${gridSize}x${gridSize} (rows 0-${gridSize - 1}, cols 0-${gridSize - 1}). N=row-1, S=row+1, W=col-1, E=col+1.`,
    `YOUR STATE: HP:${agent.hp}/${agent.maxHp} POS:[${agent.pos}] TRUST:${agent.trust}`,
    `CAN MOVE: ${validMoves.length > 0 ? validMoves.join(', ') : 'none (blocked)'}`,
    `ALLIES: ${allyNames.length > 0 ? allyNames.join(', ') : 'none'}`,
    '',
    'OPPONENTS:',
    ...opponentLines,
    '',
    zoneInfo,
    `ARTIFACTS: ${artifactLine}`,
    '',
    'RECENT EVENTS:',
    eventBlock,
    '',
    'SEASON STANDINGS:',
    seasonBlock,
    '',
    'YOUR MEMORIES FROM PAST BATTLES:',
    memoryBlock,
    '',
    `GRUDGES AGAINST YOU: ${grudgesAgainst.length > 0 ? grudgesAgainst.join(', ') : 'none'}`,
    `YOUR GRUDGES: ${grudgesFrom.length > 0 ? grudgesFrom.join(', ') : 'none'}`,
    '',
    `ACTIONS: ${actionChoices}`,
    '',
    'Reply in EXACTLY this format (both lines required):',
    'THINK: {your 1-sentence inner monologue, the audience sees this}',
    'ACTION: {your choice}',
  ].join('\n');
}

const MOVE_DELTAS = { N: [-1, 0], S: [1, 0], E: [0, 1], W: [0, -1] };

function getValidMoves(agent, agents, gridSize, zoneRadius) {
  const margin = Math.floor((gridSize - zoneRadius * 2) / 2);
  const minSafe = margin;
  const maxSafe = gridSize - margin - 1;

  const valid = [];
  for (const [dir, [dr, dc]] of Object.entries(MOVE_DELTAS)) {
    const nr = agent.pos[0] + dr;
    const nc = agent.pos[1] + dc;
    if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) continue;
    if (agents.some((a) => a.alive && a.id !== agent.id && a.pos[0] === nr && a.pos[1] === nc)) continue;
    const leavesZone = nr < minSafe || nr > maxSafe || nc < minSafe || nc > maxSafe;
    valid.push(leavesZone ? `${dir}(DANGER:red zone!)` : dir);
  }
  return valid;
}

function directionHint(from, to) {
  const dr = to[0] - from[0];
  const dc = to[1] - from[1];
  const parts = [];
  if (dr < 0) parts.push(`${Math.abs(dr)}N`);
  if (dr > 0) parts.push(`${dr}S`);
  if (dc < 0) parts.push(`${Math.abs(dc)}W`);
  if (dc > 0) parts.push(`${dc}E`);
  return parts.length > 0 ? `(${parts.join(',')})` : '(same cell)';
}

function buildZoneInfo(pos, zoneRadius, gridSize, turnsUntilShrink, zoneDamage) {
  const margin = Math.floor((gridSize - zoneRadius * 2) / 2);
  const minSafe = margin;
  const maxSafe = gridSize - margin - 1;
  const inZone = pos[0] >= minSafe && pos[0] <= maxSafe && pos[1] >= minSafe && pos[1] <= maxSafe;

  const lines = [`ZONE: safe rows ${minSafe}-${maxSafe}, cols ${minSafe}-${maxSafe}. Shrinks in ${turnsUntilShrink} turns.`];

  if (inZone) {
    lines.push('You are INSIDE the safe zone.');
  } else {
    const escDirs = [];
    if (pos[0] < minSafe) escDirs.push('S');
    if (pos[0] > maxSafe) escDirs.push('N');
    if (pos[1] < minSafe) escDirs.push('E');
    if (pos[1] > maxSafe) escDirs.push('W');
    lines.push(`WARNING: You are OUTSIDE the safe zone! You lose ${zoneDamage} HP every turn. Move ${escDirs.join('+')} to get back in!`);
  }

  return lines.join('\n');
}

function buildActionChoices(agent, others, activeArtifacts, attackRange, validMoves) {
  const parts = [];

  if (validMoves.length > 0) {
    parts.push(`MOVE ${validMoves.join('/')}`);
  }

  const inRange = others.filter((o) => {
    const dist = Math.abs(agent.pos[0] - o.pos[0]) + Math.abs(agent.pos[1] - o.pos[1]);
    return dist <= attackRange;
  });

  if (inRange.length > 0) {
    parts.push(`ATTACK ${inRange.map((o) => o.name).join('/')}`);
  }

  const nonAllies = others.filter((o) => !agent.alliances.includes(o.id));
  if (nonAllies.length > 0) {
    parts.push(`ALLY ${nonAllies.map((o) => o.name).join('/')}`);
  }

  const alliesInRange = others.filter((o) => {
    if (!agent.alliances.includes(o.id)) return false;
    const dist = Math.abs(agent.pos[0] - o.pos[0]) + Math.abs(agent.pos[1] - o.pos[1]);
    return dist <= attackRange;
  });
  if (alliesInRange.length > 0) {
    parts.push(`BETRAY ${alliesInRange.map((o) => o.name).join('/')}`);
  }

  const onArtifact = activeArtifacts.find((a) => a.pos[0] === agent.pos[0] && a.pos[1] === agent.pos[1]);
  if (onArtifact) {
    parts.push(`USE ${onArtifact.name}`);
  }

  return parts.join(' | ');
}

function buildSeasonContext(agent, allAgents, standings) {
  if (!standings || standings.totalBattles === 0) return 'First battle of the season.';

  const nameMap = Object.fromEntries(allAgents.map((a) => [a.id, a.name]));
  const lines = [];

  const myStats = standings.agents[agent.id];
  if (myStats) {
    lines.push(`Your record: ${myStats.wins}W-${myStats.losses}L, ${myStats.kills} kills, ${myStats.deaths} deaths`);
  }

  const otherIds = allAgents.filter((a) => a.id !== agent.id).map((a) => a.id);
  for (const id of otherIds) {
    const s = standings.agents[id];
    if (!s) continue;
    const tags = [];
    if (s.betrayals > 0) tags.push(`${s.betrayals} betrayals`);
    if (s.kills > 0) tags.push(`${s.kills} kills`);
    lines.push(`${nameMap[id]}: ${s.wins}W-${s.losses}L${tags.length > 0 ? ` (${tags.join(', ')})` : ''}`);
  }

  for (const [key, record] of Object.entries(standings.headToHead || {})) {
    const ids = key.split('_vs_');
    if (!ids.includes(agent.id)) continue;
    const opponentId = ids[0] === agent.id ? ids[1] : ids[0];
    const myKills = record[agent.id] || 0;
    const theirKills = record[opponentId] || 0;
    if (myKills > 0 || theirKills > 0) {
      lines.push(`H2H vs ${nameMap[opponentId]}: you killed them ${myKills}x, they killed you ${theirKills}x`);
    }
  }

  return lines.join('\n');
}

export function parseResponse(text) {
  if (!text || typeof text !== 'string') return null;

  let actionRaw = null;
  let thinking = null;

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    const upper = trimmed.toUpperCase();

    if (!actionRaw && upper.startsWith('ACTION:')) {
      actionRaw = trimmed.slice(trimmed.indexOf(':') + 1).trim();
    }
    if (!thinking && upper.startsWith('THINK:')) {
      thinking = trimmed.slice(trimmed.indexOf(':') + 1).trim();
    }
  }

  if (!actionRaw) return null;

  const action = parseActionString(actionRaw);
  if (!action) return null;

  return { action, thinking: thinking || '' };
}

function parseActionString(raw) {
  const parts = raw.trim().split(/\s+/);
  if (parts.length === 0) return null;

  const type = parts[0].toUpperCase();

  switch (type) {
    case 'MOVE': {
      const direction = parts[1]?.toUpperCase();
      if (!direction || !VALID_DIRECTIONS.includes(direction)) return null;
      return { type: 'MOVE', direction };
    }
    case 'ATTACK':
    case 'ALLY':
    case 'BETRAY': {
      const target = parts[1]?.toUpperCase();
      if (!target) return null;
      return { type, target };
    }
    case 'USE':
      return { type: 'USE_ARTIFACT' };
    default:
      return null;
  }
}

export function resolveAction(parsed, state, agent) {
  const others = state.agents.filter((a) => a.alive && a.id !== agent.id);
  const nameToId = Object.fromEntries(state.agents.map((a) => [a.name, a.id]));

  switch (parsed.type) {
    case 'MOVE':
      if (!VALID_DIRECTIONS.includes(parsed.direction)) return null;
      return { type: 'MOVE', direction: parsed.direction };

    case 'ATTACK': {
      const targetId = nameToId[parsed.target];
      if (!targetId || !others.some((a) => a.id === targetId)) return null;
      const target = state.agents.find((a) => a.id === targetId);
      const dist = Math.abs(agent.pos[0] - target.pos[0]) + Math.abs(agent.pos[1] - target.pos[1]);
      if (dist > (state.rules.attackRange || 3)) return null;
      return { type: 'ATTACK', target: targetId };
    }

    case 'ALLY': {
      const targetId = nameToId[parsed.target];
      if (!targetId || !others.some((a) => a.id === targetId)) return null;
      if (agent.alliances.includes(targetId)) return null;
      return { type: 'ALLY', target: targetId };
    }

    case 'BETRAY': {
      const targetId = nameToId[parsed.target];
      if (!targetId || !agent.alliances.includes(targetId)) return null;
      const target = state.agents.find((a) => a.id === targetId);
      const dist = Math.abs(agent.pos[0] - target.pos[0]) + Math.abs(agent.pos[1] - target.pos[1]);
      if (dist > (state.rules.attackRange || 3)) return null;
      return { type: 'BETRAY', target: targetId };
    }

    case 'USE_ARTIFACT': {
      const onArtifact = state.artifacts.some((a) => a.active && a.pos[0] === agent.pos[0] && a.pos[1] === agent.pos[1]);
      if (!onArtifact) return null;
      return { type: 'USE_ARTIFACT' };
    }

    default:
      return null;
  }
}
