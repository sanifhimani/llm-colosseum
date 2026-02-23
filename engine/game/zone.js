function isInSafeZone(pos, zoneRadius, gridSize) {
  const margin = Math.floor((gridSize - zoneRadius * 2) / 2);
  return pos[0] >= margin && pos[0] < gridSize - margin && pos[1] >= margin && pos[1] < gridSize - margin;
}

export function checkZoneShrink(turn, currentRadius, rules) {
  const { zoneShrinkInterval, minZoneRadius } = rules;
  if (turn > 0 && turn % zoneShrinkInterval === 0 && currentRadius > minZoneRadius) {
    return currentRadius - 1;
  }
  return currentRadius;
}

export function applyZoneDamage(agents, zoneRadius, rules) {
  const { gridSize, zoneDamage } = rules;
  const events = [];
  const next = agents.map((a) => {
    if (!a.alive || isInSafeZone(a.pos, zoneRadius, gridSize)) {
      return { ...a, pos: [...a.pos], alliances: [...a.alliances] };
    }
    const hp = Math.max(0, a.hp - zoneDamage);
    const alive = hp > 0;
    if (!alive) events.push({ type: 'zone_kill', agent: a.id, damage: zoneDamage });
    else events.push({ type: 'zone_damage', agent: a.id, damage: zoneDamage });
    return { ...a, hp, alive, pos: [...a.pos], alliances: [...a.alliances] };
  });
  return { agents: next, events };
}
