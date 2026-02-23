import { parseGrudgeKey } from './game/actions.js';

const VALID_DIRECTIONS = ['N', 'S', 'E', 'W'];

export function buildPrompt(state, agent, memories = []) {
  const others = state.agents.filter((a) => a.alive && a.id !== agent.id);
  const { zoneRadius, turn, grudges, artifacts, rules } = state;
  const turnsUntilShrink = rules.zoneShrinkInterval - (turn % rules.zoneShrinkInterval);
  const safeSize = zoneRadius * 2;

  const allyNames = agent.alliances
    .map((id) => state.agents.find((a) => a.id === id)?.name)
    .filter(Boolean);

  const attackRange = rules.attackRange || 3;

  const opponentLines = others.map((o) => {
    const dist = Math.abs(agent.pos[0] - o.pos[0]) + Math.abs(agent.pos[1] - o.pos[1]);
    const allyTag = agent.alliances.includes(o.id) ? ' ALLY' : '';
    const rangeTag = dist <= attackRange ? ' IN-RANGE' : '';
    return `- ${o.name}: HP:${o.hp} POS:[${o.pos}] DIST:${dist} TRUST:${o.trust}${allyTag}${rangeTag}`;
  });

  const activeArtifacts = artifacts.filter((a) => a.active);
  const artifactLine = activeArtifacts.length > 0
    ? activeArtifacts.map((a) => `${a.name} at [${a.pos}]`).join(' | ')
    : 'none on map';

  const memoryBlock = memories.length > 0
    ? memories.join('\n')
    : 'No memories yet.';

  const grudgesAgainst = [];
  const grudgesFrom = [];
  for (const [key, count] of Object.entries(grudges)) {
    const { from, to } = parseGrudgeKey(key);
    const fromName = state.agents.find((a) => a.id === from)?.name;
    const toName = state.agents.find((a) => a.id === to)?.name;
    if (to === agent.id && fromName) grudgesAgainst.push(`${fromName} ${count}x`);
    if (from === agent.id && toName) grudgesFrom.push(`${toName} ${count}x`);
  }

  const actionChoices = buildActionChoices(agent, others, activeArtifacts, attackRange);

  return [
    `ARENA BATTLE - You are ${agent.name}. Pick ONE action.`,
    '',
    `STATE: HP:${agent.hp}/${agent.maxHp} POS:[${agent.pos}] TRUST:${agent.trust} RANGE:${attackRange}`,
    `ALLIES: ${allyNames.length > 0 ? allyNames.join(', ') : 'none'}`,
    'OPPONENTS:',
    ...opponentLines,
    `ZONE: safe ${safeSize}x${safeSize}, shrinks in ${turnsUntilShrink} turns`,
    `ARTIFACTS: ${artifactLine}`,
    '',
    'YOUR MEMORIES:',
    memoryBlock,
    '',
    `GRUDGES AGAINST YOU: ${grudgesAgainst.length > 0 ? grudgesAgainst.join(', ') : 'none'}`,
    `YOUR GRUDGES: ${grudgesFrom.length > 0 ? grudgesFrom.join(', ') : 'none'}`,
    '',
    `ACTIONS: ${actionChoices}`,
    '',
    'Reply EXACTLY:',
    'ACTION: {your choice}',
    'THINK: {1 sentence, shown to audience as your inner monologue}',
  ].join('\n');
}

function buildActionChoices(agent, others, activeArtifacts, attackRange) {
  const parts = ['MOVE N/S/E/W'];

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

  if (activeArtifacts.length > 0) {
    parts.push(`USE ${activeArtifacts.map((a) => a.name).join('/')}`);
  }

  return parts.join(' | ');
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
