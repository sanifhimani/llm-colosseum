const DIRECTIONS = { N: [-1, 0], S: [1, 0], E: [0, 1], W: [0, -1] };
const DIR_KEYS = Object.keys(DIRECTIONS);
const GRUDGE_SEP = '|';

const WEAPON_BUFF_DAMAGE = 10;
const SHIELD_BLOCK_HP = 20;
const POTION_HEAL_HP = 25;
const ALLY_TRUST_GAIN = 10;
const ALLY_ATTACK_TRUST_PENALTY = 15;
const BETRAY_TRUST_PENALTY = 20;

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function cloneAgents(agents) {
  return agents.map((a) => ({ ...a, pos: [...a.pos], alliances: [...a.alliances] }));
}

function cloneArtifacts(artifacts) {
  return artifacts.map((a) => ({ ...a, pos: [...a.pos] }));
}

function dissolveAlliances(agents, deadId) {
  for (const agent of agents) {
    agent.alliances = agent.alliances.filter((id) => id !== deadId);
  }
}

function grudgeKey(from, to) {
  return `${from}${GRUDGE_SEP}${to}`;
}

export function parseGrudgeKey(key) {
  const [from, to] = key.split(GRUDGE_SEP);
  return { from, to };
}

export function applyMove(agents, agentId, direction, rules) {
  const next = cloneAgents(agents);
  const agent = next.find((a) => a.id === agentId);
  const [dr, dc] = DIRECTIONS[direction];
  const nr = agent.pos[0] + dr;
  const nc = agent.pos[1] + dc;

  if (nr < 0 || nr >= rules.gridSize || nc < 0 || nc >= rules.gridSize) {
    return { agents: next };
  }

  if (next.some((a) => a.alive && a.id !== agentId && a.pos[0] === nr && a.pos[1] === nc)) {
    return { agents: next };
  }

  agent.pos = [nr, nc];
  return { agents: next, event: { type: 'move', agent: agentId, direction } };
}

export function applyAttack(agents, agentId, targetId, grudges, rules) {
  const next = cloneAgents(agents);
  const agent = next.find((a) => a.id === agentId);
  const target = next.find((a) => a.id === targetId);
  if (!target || !target.alive) return { agents: next, grudges };

  let damage = rand(rules.attackDamageMin, rules.attackDamageMax);
  if (agent.weaponBuff) {
    damage += WEAPON_BUFF_DAMAGE;
    agent.weaponBuff = false;
  }
  if (target.shieldHp > 0) {
    const blocked = Math.min(damage, target.shieldHp);
    damage -= blocked;
    target.shieldHp -= blocked;
  }

  target.hp = Math.max(0, target.hp - damage);

  if (agent.alliances.includes(targetId)) {
    agent.alliances = agent.alliances.filter((id) => id !== targetId);
    target.alliances = target.alliances.filter((id) => id !== agentId);
    agent.trust = Math.max(0, agent.trust - ALLY_ATTACK_TRUST_PENALTY);
  }

  const newGrudges = { ...grudges };
  const key = grudgeKey(agentId, targetId);
  newGrudges[key] = (newGrudges[key] || 0) + 1;

  if (target.hp <= 0) {
    target.alive = false;
    dissolveAlliances(next, targetId);
    return { agents: next, grudges: newGrudges, event: { type: 'kill', agent: agentId, target: targetId, damage } };
  }

  return { agents: next, grudges: newGrudges, event: { type: 'attack', agent: agentId, target: targetId, damage } };
}

export function applyAlly(agents, agentId, targetId) {
  const next = cloneAgents(agents);
  const agent = next.find((a) => a.id === agentId);
  const target = next.find((a) => a.id === targetId);
  if (!target || !target.alive || agent.alliances.includes(targetId)) return { agents: next };

  if (agent.alliances.length > 0) {
    const oldAlly = next.find((a) => a.id === agent.alliances[0]);
    if (oldAlly) oldAlly.alliances = oldAlly.alliances.filter((id) => id !== agentId);
    agent.alliances = [];
  }

  if (target.pendingAlly === agentId) {
    if (target.alliances.length > 0) {
      const oldAlly = next.find((a) => a.id === target.alliances[0]);
      if (oldAlly) oldAlly.alliances = oldAlly.alliances.filter((id) => id !== targetId);
      target.alliances = [];
    }
    agent.alliances = [targetId];
    target.alliances = [agentId];
    agent.pendingAlly = null;
    target.pendingAlly = null;
    agent.trust = Math.min(100, agent.trust + ALLY_TRUST_GAIN);
    target.trust = Math.min(100, target.trust + ALLY_TRUST_GAIN);
    return { agents: next, event: { type: 'alliance', agent: agentId, target: targetId } };
  }

  agent.pendingAlly = targetId;
  return { agents: next, event: { type: 'ally_propose', agent: agentId, target: targetId } };
}

export function applyBetray(agents, agentId, targetId, grudges, rules) {
  const next = cloneAgents(agents);
  const agent = next.find((a) => a.id === agentId);
  const target = next.find((a) => a.id === targetId);
  if (!target || !target.alive || !agent.alliances.includes(targetId)) return { agents: next, grudges };

  const damage = rand(rules.betrayDamageMin, rules.betrayDamageMax);
  target.hp = Math.max(0, target.hp - damage);
  agent.alliances = agent.alliances.filter((id) => id !== targetId);
  target.alliances = target.alliances.filter((id) => id !== agentId);
  agent.trust = Math.max(0, agent.trust - BETRAY_TRUST_PENALTY);

  const newGrudges = { ...grudges };
  const key = grudgeKey(agentId, targetId);
  newGrudges[key] = (newGrudges[key] || 0) + 1;

  if (target.hp <= 0) {
    target.alive = false;
    dissolveAlliances(next, targetId);
    return { agents: next, grudges: newGrudges, event: { type: 'betray_kill', agent: agentId, target: targetId, damage } };
  }

  return { agents: next, grudges: newGrudges, event: { type: 'betray', agent: agentId, target: targetId, damage } };
}

export function applyUseArtifact(agents, agentId, artifacts) {
  const next = cloneAgents(agents);
  const agent = next.find((a) => a.id === agentId);
  const newArtifacts = cloneArtifacts(artifacts);
  const artifact = newArtifacts.find((a) => a.active && a.pos[0] === agent.pos[0] && a.pos[1] === agent.pos[1]);
  if (!artifact) return { agents: next, artifacts: newArtifacts };

  artifact.active = false;

  if (artifact.type === 'weapon') agent.weaponBuff = true;
  if (artifact.type === 'shield') agent.shieldHp = SHIELD_BLOCK_HP;
  if (artifact.type === 'potion') agent.hp = Math.min(agent.maxHp, agent.hp + POTION_HEAL_HP);

  return { agents: next, artifacts: newArtifacts, event: { type: 'artifact', agent: agentId, artifact: artifact.name } };
}

export function pickRandomAction(agent, agents, artifacts) {
  const alive = agents.filter((a) => a.alive && a.id !== agent.id);
  if (alive.length === 0) return { type: 'MOVE', direction: DIR_KEYS[rand(0, 3)] };

  const onArtifact = artifacts.some((a) => a.active && a.pos[0] === agent.pos[0] && a.pos[1] === agent.pos[1]);
  if (onArtifact) return { type: 'USE_ARTIFACT' };

  const closestArtifact = nearestArtifact(agent, artifacts);
  if (closestArtifact.artifact && closestArtifact.dist <= 4 && Math.random() < 0.6) {
    return { type: 'MOVE', direction: moveToward(agent.pos, closestArtifact.artifact.pos) };
  }

  if (agent.alliances.length > 0 && Math.random() < 0.15) {
    return { type: 'BETRAY', target: agent.alliances[0] };
  }

  const proposer = alive.find((a) => a.pendingAlly === agent.id);
  if (proposer && Math.random() < 0.7) return { type: 'ALLY', target: proposer.id };

  if (agent.alliances.length === 0 && Math.random() < 0.2) {
    const unallied = alive.filter((a) => a.alliances.length === 0);
    if (unallied.length > 0) {
      return { type: 'ALLY', target: unallied[rand(0, unallied.length - 1)].id };
    }
  }

  if (Math.random() < 0.45) {
    const nonAllies = alive.filter((a) => !agent.alliances.includes(a.id));
    const targets = nonAllies.length > 0 ? nonAllies : alive;
    return { type: 'ATTACK', target: targets[rand(0, targets.length - 1)].id };
  }

  const nearest = alive.reduce((best, a) => {
    const dist = Math.abs(a.pos[0] - agent.pos[0]) + Math.abs(a.pos[1] - agent.pos[1]);
    return dist < best.dist ? { id: a.id, pos: a.pos, dist } : best;
  }, { dist: Infinity });

  if (nearest.dist > 2) {
    return { type: 'MOVE', direction: moveToward(agent.pos, nearest.pos) };
  }

  return { type: 'MOVE', direction: DIR_KEYS[rand(0, 3)] };
}

function moveToward(from, to) {
  const dr = to[0] > from[0] ? 'S' : to[0] < from[0] ? 'N' : null;
  const dc = to[1] > from[1] ? 'E' : to[1] < from[1] ? 'W' : null;
  const dirs = [dr, dc].filter(Boolean);
  return dirs.length > 0 ? dirs[rand(0, dirs.length - 1)] : DIR_KEYS[rand(0, 3)];
}

function nearestArtifact(agent, artifacts) {
  let best = null;
  let bestDist = Infinity;
  for (const a of artifacts) {
    if (!a.active) continue;
    const dist = Math.abs(a.pos[0] - agent.pos[0]) + Math.abs(a.pos[1] - agent.pos[1]);
    if (dist < bestDist) {
      best = a;
      bestDist = dist;
    }
  }
  return { artifact: best, dist: bestDist };
}
