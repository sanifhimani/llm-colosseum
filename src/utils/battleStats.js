export function extractBattleStats(events, { winnerHp, day, season } = {}) {
  let victoryIdx = -1;
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].type === 'victory') {
      victoryIdx = i;
      break;
    }
  }

  if (victoryIdx === -1) {
    return {
      winner: null,
      winnerHp: null,
      betrayedBy: [],
      day: null,
      season: null,
      victoryEventId: null,
      eliminations: [],
      totalTurns: 0,
      totalKills: 0,
      totalBetrayals: 0,
      totalAlliances: 0,
      totalArtifacts: 0,
    };
  }

  let battleStart = 0;
  for (let i = victoryIdx - 1; i >= 0; i--) {
    if (events[i].type === 'victory') {
      battleStart = i + 1;
      break;
    }
  }

  const victoryEvent = events[victoryIdx];
  const winner = { id: victoryEvent.agent, turn: victoryEvent.turn };
  const eliminations = [];
  const betrayedBy = [];
  let totalTurns = 0;
  let totalKills = 0;
  let totalBetrayals = 0;
  let totalAlliances = 0;
  let totalArtifacts = 0;

  for (let i = battleStart; i <= victoryIdx; i++) {
    const e = events[i];
    if (e.turn > totalTurns) totalTurns = e.turn;

    switch (e.type) {
      case 'kill':
        totalKills++;
        eliminations.push({
          target: e.target,
          killer: e.agent,
          turn: e.turn,
          isBetray: false,
          isZoneKill: false,
        });
        break;
      case 'betray_kill':
        totalKills++;
        totalBetrayals++;
        eliminations.push({
          target: e.target,
          killer: e.agent,
          turn: e.turn,
          isBetray: true,
          isZoneKill: false,
        });
        break;
      case 'zone_kill':
        totalKills++;
        eliminations.push({
          target: e.agent,
          killer: null,
          turn: e.turn,
          isBetray: false,
          isZoneKill: true,
        });
        break;
      case 'betray':
        totalBetrayals++;
        if (e.target === winner.id) betrayedBy.push(e.agent);
        break;
      case 'alliance':
        totalAlliances++;
        break;
      case 'artifact':
        totalArtifacts++;
        break;
    }
  }

  return {
    winner,
    winnerHp: winnerHp ?? null,
    betrayedBy,
    day: day ?? null,
    season: season ?? null,
    victoryEventId: victoryEvent.id,
    eliminations,
    totalTurns,
    totalKills,
    totalBetrayals,
    totalAlliances,
    totalArtifacts,
  };
}
