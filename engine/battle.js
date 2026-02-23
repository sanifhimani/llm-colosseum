import { createGameState, aliveAgents, isGameOver, getWinner } from './game/state.js';
import { applyMove, applyAttack, applyAlly, applyBetray, applyUseArtifact, pickRandomAction } from './game/actions.js';
import { checkZoneShrink, applyZoneDamage } from './game/zone.js';
import { buildPrompt, parseResponse, resolveAction } from './prompts.js';

const STUNNED_THINKING = 'CONNECTION LOST...';
const INVALID_THINKING = 'CONFUSED...';
const MAX_CONSECUTIVE_FAILURES = 3;
const MAX_RESPONSE_TOKENS = 150;

export async function runBattle(meta, agents, { onEvent, turnPauseMs = 0 } = {}) {
  const state = createGameState(meta);
  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a]));

  emit(onEvent, { type: 'battle_start', state: snapshotState(state) });

  let turnIndex = 0;

  while (!isGameOver(state)) {
    const alive = aliveAgents(state);
    const agent = alive[turnIndex % alive.length];
    const agentInstance = agentMap[agent.id];

    const turnResult = await executeTurn(state, agent, agentInstance);
    const event = applyTurnResult(state, agent.id, turnResult);

    emit(onEvent, {
      type: 'turn',
      turn: state.turn,
      agent: agent.id,
      action: turnResult.action,
      thinking: turnResult.thinking,
      event,
      latencyMs: turnResult.latencyMs,
      tokensUsed: turnResult.tokensUsed,
      state: snapshotState(state),
    });

    state.turn++;
    turnIndex++;

    const newRadius = checkZoneShrink(state.turn, state.zoneRadius, state.rules);
    if (newRadius !== state.zoneRadius) {
      state.zoneRadius = newRadius;
      emit(onEvent, { type: 'zone_shrink', turn: state.turn, radius: newRadius });
    }

    const zoneDmg = applyZoneDamage(state.agents, state.zoneRadius, state.rules);
    state.agents = zoneDmg.agents;
    for (const e of zoneDmg.events) {
      emit(onEvent, { type: e.type, turn: state.turn, ...e });
    }

    if (turnPauseMs > 0) {
      await sleep(turnPauseMs);
    }
  }

  const winner = getWinner(state);

  emit(onEvent, {
    type: 'battle_end',
    winner: winner ? { id: winner.id, name: winner.name, hp: winner.hp } : null,
    turns: state.turn,
    state: snapshotState(state),
  });

  return { winner, turns: state.turn, state };
}

async function executeTurn(state, agent, agentInstance) {
  if (agent.autopilot) {
    return executeAutopilot(state, agent);
  }

  const prompt = buildPrompt(state, agent);
  const callOpts = {
    timeout: state.rules.apiTimeoutMs,
    maxTokens: MAX_RESPONSE_TOKENS,
    state,
    agent,
  };
  let response;

  try {
    response = await agentInstance.call(prompt, callOpts);
  } catch {
    try {
      response = await agentInstance.call(prompt, callOpts);
    } catch {
      agent.consecutiveFailures++;
      if (agent.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        agent.autopilot = true;
      }
      return { action: { type: 'STUNNED' }, thinking: STUNNED_THINKING, latencyMs: 0 };
    }
  }

  agent.consecutiveFailures = 0;

  const parsed = parseResponse(response.text);
  if (!parsed) {
    return { action: { type: 'INVALID' }, thinking: INVALID_THINKING, latencyMs: response.latencyMs, tokensUsed: response.usage };
  }

  const resolved = resolveAction(parsed.action, state, agent);
  if (!resolved) {
    return { action: { type: 'INVALID' }, thinking: parsed.thinking, latencyMs: response.latencyMs, tokensUsed: response.usage };
  }

  return {
    action: resolved,
    thinking: parsed.thinking,
    latencyMs: response.latencyMs,
    tokensUsed: response.usage,
  };
}

function executeAutopilot(state, agent) {
  const action = pickRandomAction(agent, state.agents, state.artifacts, state.rules.attackRange);
  return { action, thinking: 'AUTOPILOT ENGAGED...', latencyMs: 0 };
}

function applyTurnResult(state, agentId, turnResult) {
  const { action } = turnResult;
  let result;

  switch (action.type) {
    case 'MOVE':
      result = applyMove(state.agents, agentId, action.direction, state.rules);
      state.agents = result.agents;
      break;
    case 'ATTACK':
      result = applyAttack(state.agents, agentId, action.target, state.grudges, state.rules);
      state.agents = result.agents;
      state.grudges = result.grudges;
      break;
    case 'ALLY':
      result = applyAlly(state.agents, agentId, action.target);
      state.agents = result.agents;
      break;
    case 'BETRAY':
      result = applyBetray(state.agents, agentId, action.target, state.grudges, state.rules);
      state.agents = result.agents;
      state.grudges = result.grudges;
      break;
    case 'USE_ARTIFACT':
      result = applyUseArtifact(state.agents, agentId, state.artifacts);
      state.agents = result.agents;
      if (result.artifacts) state.artifacts = result.artifacts;
      break;
    case 'STUNNED':
    case 'INVALID':
      break;
  }

  return result?.event || null;
}

function snapshotState(state) {
  return {
    agents: state.agents.map((a) => ({
      id: a.id,
      name: a.name,
      hp: a.hp,
      maxHp: a.maxHp,
      pos: [...a.pos],
      alive: a.alive,
      alliances: [...a.alliances],
      trust: a.trust,
    })),
    artifacts: state.artifacts.map((a) => ({
      id: a.id,
      type: a.type,
      name: a.name,
      pos: [...a.pos],
      active: a.active,
    })),
    zoneRadius: state.zoneRadius,
    turn: state.turn,
    grudges: { ...state.grudges },
  };
}

function emit(onEvent, event) {
  if (onEvent) onEvent(event);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
