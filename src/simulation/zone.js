import { GRID_SIZE } from '../state/constants';

const SHRINK_INTERVAL = 30;
const MIN_RADIUS = 3;
const ZONE_DAMAGE = 5;

function isInSafeZone(pos, zoneRadius) {
  const margin = (GRID_SIZE - zoneRadius * 2) / 2;
  return pos[0] >= margin && pos[0] < GRID_SIZE - margin && pos[1] >= margin && pos[1] < GRID_SIZE - margin;
}

export function checkZoneShrink(turn, currentRadius) {
  if (turn > 0 && turn % SHRINK_INTERVAL === 0 && currentRadius > MIN_RADIUS) {
    return currentRadius - 1;
  }
  return currentRadius;
}

export function applyZoneDamage(agents, zoneRadius) {
  const events = [];
  const next = agents.map((a) => {
    if (!a.alive || isInSafeZone(a.pos, zoneRadius)) return a;
    const hp = Math.max(0, a.hp - ZONE_DAMAGE);
    const alive = hp > 0;
    if (!alive) events.push({ type: 'zone_kill', agent: a.id, damage: ZONE_DAMAGE });
    else events.push({ type: 'zone_damage', agent: a.id, damage: ZONE_DAMAGE });
    return { ...a, hp, alive, pos: [...a.pos], alliances: [...a.alliances] };
  });
  return { agents: next, events };
}
