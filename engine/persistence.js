import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { resolve } from 'path';

const MAX_MEMORIES = 10;

export function seasonDir(dataDir, season = 1) {
  return resolve(dataDir, `seasons/season-${season}`);
}

export function nextDayNumber(dataDir, season = 1) {
  const battlesDir = resolve(seasonDir(dataDir, season), 'battles');
  if (!existsSync(battlesDir)) return 1;
  const files = readdirSync(battlesDir).filter((f) => f.startsWith('day-') && f.endsWith('.json'));
  if (files.length === 0) return 1;
  const maxDay = Math.max(...files.map((f) => parseInt(f.replace('day-', '').replace('.json', ''), 10)));
  return maxDay + 1;
}

export function writeTranscript(dataDir, season, transcript) {
  const battlesDir = resolve(seasonDir(dataDir, season), 'battles');
  mkdirSync(battlesDir, { recursive: true });

  const dayStr = String(transcript.day).padStart(3, '0');
  const filePath = resolve(battlesDir, `day-${dayStr}.json`);
  writeFileSync(filePath, JSON.stringify(transcript, null, 2));
  return filePath;
}

export function buildTranscript(day, season, battleResult, turnLog, eventLog) {
  const { winner, turns: totalTurns, state } = battleResult;

  const placement = buildPlacement(state.agents, winner);

  const stats = buildStats(turnLog, eventLog, totalTurns);

  return {
    season,
    day,
    date: new Date().toISOString().split('T')[0],
    startedAt: eventLog[0]?.timestamp || new Date().toISOString(),
    endedAt: new Date().toISOString(),
    winner: winner?.id || null,
    placement,
    roster: state.agents.map((a) => ({
      id: a.id,
      model: a.model || null,
      startHp: a.maxHp,
    })),
    artifacts: state.artifacts.map((a) => ({
      type: a.type,
      name: a.name,
      pos: [...a.pos],
    })),
    turns: turnLog,
    events: eventLog.filter((e) => e.type !== 'turn' && e.type !== 'battle_start' && e.type !== 'battle_end'),
    stats,
  };
}

function buildPlacement(agents, winner) {
  const dead = agents.filter((a) => !a.alive);
  const alive = agents.filter((a) => a.alive);
  const placement = [];
  if (winner) placement.push(winner.id);
  for (const a of alive) {
    if (!winner || a.id !== winner.id) placement.push(a.id);
  }
  placement.push(...dead.map((a) => a.id).reverse());
  return placement;
}

function buildStats(turnLog, eventLog, totalTurns) {
  let totalTokensIn = 0;
  let totalTokensOut = 0;
  let totalLatency = 0;
  let apiCalls = 0;
  let timeouts = 0;
  let invalidActions = 0;
  let alliancesFormed = 0;
  let betrayals = 0;
  let artifactsUsed = 0;

  for (const t of turnLog) {
    if (t.tokensUsed) {
      totalTokensIn += t.tokensUsed.input || 0;
      totalTokensOut += t.tokensUsed.output || 0;
      apiCalls++;
    }
    totalLatency += t.latencyMs || 0;
  }

  for (const e of eventLog) {
    if (e.type === 'turn' && e.action?.type === 'STUNNED') timeouts++;
    if (e.type === 'turn' && e.action?.type === 'INVALID') invalidActions++;
    if (e.event?.type === 'alliance') alliancesFormed++;
    if (e.event?.type === 'betray' || e.event?.type === 'betray_kill') betrayals++;
    if (e.event?.type === 'artifact') artifactsUsed++;
  }

  return {
    totalTurns,
    totalApiCalls: apiCalls,
    totalTokensIn,
    totalTokensOut,
    avgLatencyMs: apiCalls > 0 ? Math.round(totalLatency / apiCalls) : 0,
    timeouts,
    invalidActions,
    alliancesFormed,
    betrayals,
    artifactsUsed,
  };
}

export function updateStandings(dataDir, season, state, winner, eventLog) {
  const filePath = resolve(seasonDir(dataDir, season), 'standings.json');
  const standings = JSON.parse(readFileSync(filePath, 'utf-8'));

  standings.totalBattles++;
  standings.lastUpdated = new Date().toISOString();

  const placement = buildPlacement(state.agents, winner);

  for (const agent of state.agents) {
    const s = standings.agents[agent.id];
    if (!s) continue;

    const isWinner = winner && agent.id === winner.id;
    if (isWinner) {
      s.wins++;
      s.currentStreak = Math.max(1, s.currentStreak + 1);
      s.longestStreak = Math.max(s.longestStreak, s.currentStreak);
    } else {
      s.losses++;
      s.currentStreak = Math.min(-1, s.currentStreak - 1);
    }

    if (!agent.alive) s.deaths++;
    s.trustScore = agent.trust;

    const pos = placement.indexOf(agent.id) + 1;
    const prevTotal = s.avgPlacement * (standings.totalBattles - 1);
    s.avgPlacement = Math.round(((prevTotal + pos) / standings.totalBattles) * 100) / 100;
  }

  const agentTurnCounts = {};
  for (const e of eventLog) {
    if (e.type !== 'turn') continue;
    const aid = e.agent;
    agentTurnCounts[aid] = (agentTurnCounts[aid] || 0) + 1;

    const s = standings.agents[aid];
    if (!s) continue;

    const ev = e.event;
    if (!ev) continue;

    if (ev.type === 'attack' || ev.type === 'kill') s.damageDealt += ev.damage || 0;
    if (ev.type === 'betray' || ev.type === 'betray_kill') {
      s.damageDealt += ev.damage || 0;
      s.betrayals++;
    }
    if (ev.type === 'kill' || ev.type === 'betray_kill') s.kills++;
    if (ev.type === 'alliance') s.alliancesFormed++;
    if (ev.type === 'artifact') s.artifactsUsed++;

    if (ev.target) {
      const ts = standings.agents[ev.target];
      if (ts && (ev.type === 'attack' || ev.type === 'kill')) ts.damageTaken += ev.damage || 0;
      if (ts && (ev.type === 'betray' || ev.type === 'betray_kill')) {
        ts.damageTaken += ev.damage || 0;
        ts.betrayed++;
      }
    }
  }

  for (const [aid, count] of Object.entries(agentTurnCounts)) {
    if (standings.agents[aid]) standings.agents[aid].turnsPlayed += count;
  }

  updateHeadToHead(standings, eventLog);

  writeFileSync(filePath, JSON.stringify(standings, null, 2));
  return standings;
}

function updateHeadToHead(standings, eventLog) {
  for (const e of eventLog) {
    if (e.type !== 'turn') continue;
    const ev = e.event;
    if (!ev || (ev.type !== 'kill' && ev.type !== 'betray_kill')) continue;

    const pair = [e.agent, ev.target].sort();
    const key = `${pair[0]}_vs_${pair[1]}`;

    if (!standings.headToHead[key]) {
      standings.headToHead[key] = { [pair[0]]: 0, [pair[1]]: 0 };
    }
    standings.headToHead[key][e.agent]++;
  }
}

export function updateMemory(dataDir, season, agentId, battleDay, won, state) {
  const filePath = resolve(seasonDir(dataDir, season), 'memories', `${agentId}.json`);
  const memory = JSON.parse(readFileSync(filePath, 'utf-8'));

  memory.totalBattles++;
  if (won) memory.record.wins++;
  else memory.record.losses++;

  const summary = generateMemorySummary(agentId, battleDay, won, state);
  memory.memories.push(summary);
  if (memory.memories.length > MAX_MEMORIES) {
    memory.memories = [memory.memories[0], ...memory.memories.slice(-(MAX_MEMORIES - 1))];
  }

  const agent = state.agents.find((a) => a.id === agentId);
  for (const other of state.agents) {
    if (other.id === agentId) continue;
    memory.trustScores[other.id] = agent?.trust || 50;
  }

  const grudgeEntries = Object.entries(state.grudges);
  for (const [key, count] of grudgeEntries) {
    const [from, to] = key.split('|');
    if (from === agentId) {
      memory.grudges[to] = (memory.grudges[to] || 0) + count;
    }
  }

  memory.lastUpdated = new Date().toISOString();
  writeFileSync(filePath, JSON.stringify(memory, null, 2));
  return memory;
}

function generateMemorySummary(agentId, day, won, state) {
  const agent = state.agents.find((a) => a.id === agentId);
  const result = won ? 'Won' : agent?.alive ? `Survived (${agent.hp} HP)` : 'Eliminated';

  const allies = agent?.alliances || [];
  const allyNames = allies.map((id) => state.agents.find((a) => a.id === id)?.name).filter(Boolean);

  const fought = Object.keys(state.grudges)
    .filter((key) => key.split('|')[0] === agentId)
    .map((key) => state.agents.find((a) => a.id === key.split('|')[1])?.name)
    .filter(Boolean);

  const parts = [`Day ${day}: ${result}.`];
  if (allyNames.length > 0) parts.push(`Allied with ${allyNames.join(', ')}.`);
  if (fought.length > 0) parts.push(`Fought ${fought.join(', ')}.`);

  return parts.join(' ');
}
