import { GRID_SIZE } from '../state/constants';

const DIRECTIONS = { N: [-1, 0], S: [1, 0], E: [0, 1], W: [0, -1] };
const DIR_KEYS = Object.keys(DIRECTIONS);

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

export function applyMove(agents, agentId, direction) {
  const next = cloneAgents(agents);
  const agent = next.find((a) => a.id === agentId);
  const [dr, dc] = DIRECTIONS[direction];
  const nr = agent.pos[0] + dr;
  const nc = agent.pos[1] + dc;

  if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) {
    return { agents: next };
  }

  if (next.some((a) => a.alive && a.id !== agentId && a.pos[0] === nr && a.pos[1] === nc)) {
    return { agents: next };
  }

  agent.pos = [nr, nc];
  return { agents: next, event: { type: 'move', agent: agentId, direction } };
}

export function applyAttack(agents, agentId, targetId, grudges) {
  const next = cloneAgents(agents);
  const agent = next.find((a) => a.id === agentId);
  const target = next.find((a) => a.id === targetId);
  if (!target || !target.alive) return { agents: next, grudges };

  let damage = rand(8, 30);
  if (agent.weaponBuff) {
    damage += 10;
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
    agent.trust = Math.max(0, agent.trust - 15);
  }

  const newGrudges = { ...grudges };

  if (target.hp <= 0) {
    target.alive = false;
    dissolveAlliances(next, targetId);
    const key = `${agentId}->${targetId}`;
    newGrudges[key] = (newGrudges[key] || 0) + 1;
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
    agent.trust = Math.min(100, agent.trust + 10);
    target.trust = Math.min(100, target.trust + 10);
    return { agents: next, event: { type: 'alliance', agent: agentId, target: targetId } };
  }

  agent.pendingAlly = targetId;
  return { agents: next, event: { type: 'ally_propose', agent: agentId, target: targetId } };
}

export function applyBetray(agents, agentId, targetId, grudges) {
  const next = cloneAgents(agents);
  const agent = next.find((a) => a.id === agentId);
  const target = next.find((a) => a.id === targetId);
  if (!target || !target.alive || !agent.alliances.includes(targetId)) return { agents: next, grudges };

  const damage = rand(15, 35);
  target.hp = Math.max(0, target.hp - damage);
  agent.alliances = agent.alliances.filter((id) => id !== targetId);
  target.alliances = target.alliances.filter((id) => id !== agentId);
  agent.trust = Math.max(0, agent.trust - 20);

  const newGrudges = { ...grudges };
  const key = `${agentId}->${targetId}`;
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
  if (artifact.type === 'shield') agent.shieldHp = 20;
  if (artifact.type === 'potion') agent.hp = Math.min(agent.maxHp, agent.hp + 25);

  return { agents: next, artifacts: newArtifacts, event: { type: 'artifact', agent: agentId, artifact: artifact.name } };
}

export function pickRandomAction(agent, agents, artifacts) {
  const alive = agents.filter((a) => a.alive && a.id !== agent.id);
  if (alive.length === 0) return { type: 'MOVE', direction: DIR_KEYS[rand(0, 3)] };

  const onArtifact = artifacts.some((a) => a.active && a.pos[0] === agent.pos[0] && a.pos[1] === agent.pos[1]);
  if (onArtifact && Math.random() < 0.8) return { type: 'USE_ARTIFACT' };

  if (agent.alliances.length > 0 && Math.random() < 0.15) {
    return { type: 'BETRAY', target: agent.alliances[0] };
  }

  const proposer = alive.find((a) => a.pendingAlly === agent.id);
  if (proposer && Math.random() < 0.7) return { type: 'ALLY', target: proposer.id };

  if (agent.alliances.length === 0 && alive.length > 1 && Math.random() < 0.2) {
    return { type: 'ALLY', target: alive[rand(0, alive.length - 1)].id };
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
    const dr = nearest.pos[0] > agent.pos[0] ? 'S' : nearest.pos[0] < agent.pos[0] ? 'N' : null;
    const dc = nearest.pos[1] > agent.pos[1] ? 'E' : nearest.pos[1] < agent.pos[1] ? 'W' : null;
    const dirs = [dr, dc].filter(Boolean);
    if (dirs.length > 0) return { type: 'MOVE', direction: dirs[rand(0, dirs.length - 1)] };
  }

  return { type: 'MOVE', direction: DIR_KEYS[rand(0, 3)] };
}
