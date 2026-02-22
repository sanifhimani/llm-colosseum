import { useRef, useCallback, useEffect } from 'react';
import { applyMove, applyAttack, applyAlly, applyBetray, applyUseArtifact, pickRandomAction } from '../simulation/actions';
import { checkZoneShrink, applyZoneDamage } from '../simulation/zone';

const TICK_MS = 800;
const MAX_EVENTS = 500;

function resolveAction(action, state) {
  const { agents, artifacts, grudges } = state;
  switch (action.type) {
    case 'MOVE': return applyMove(agents, action.agent, action.direction);
    case 'ATTACK': return applyAttack(agents, action.agent, action.target, grudges);
    case 'ALLY': return applyAlly(agents, action.agent, action.target);
    case 'BETRAY': return applyBetray(agents, action.agent, action.target, grudges);
    case 'USE_ARTIFACT': return applyUseArtifact(agents, action.agent, artifacts);
    default: return {};
  }
}

function computeTick(prev) {
  const { agents, artifacts, zoneRadius, turn, grudges, events } = prev;
  let { eventSeq } = prev;
  const alive = agents.filter((a) => a.alive);

  if (alive.length <= 1) {
    const winner = alive[0];
    if (winner && !events.some((e) => e.type === 'victory')) {
      return {
        ...prev,
        eventSeq: eventSeq + 1,
        events: [...events.slice(-MAX_EVENTS), { id: eventSeq + 1, turn, type: 'victory', agent: winner.id }],
      };
    }
    return prev;
  }

  const agentIndex = turn % alive.length;
  const agent = alive[agentIndex];
  const action = pickRandomAction(agent, agents, artifacts);
  const result = resolveAction({ ...action, agent: agent.id }, { agents, artifacts, grudges });

  const newAgents = result.agents || agents;
  const newArtifacts = result.artifacts || artifacts;
  const newGrudges = result.grudges || grudges;
  const newTurn = turn + 1;
  const newEvents = [];

  if (result.event) {
    eventSeq++;
    newEvents.push({ id: eventSeq, ...result.event, turn: newTurn });
  }

  const newZoneRadius = checkZoneShrink(newTurn, zoneRadius);
  const zoneDmg = applyZoneDamage(newAgents, newZoneRadius);
  const finalAgents = zoneDmg.events.length > 0 ? zoneDmg.agents : newAgents;
  for (const e of zoneDmg.events) {
    eventSeq++;
    newEvents.push({ id: eventSeq, ...e, turn: newTurn });
  }

  const finalAlive = finalAgents.filter((a) => a.alive);
  if (finalAlive.length === 1) {
    eventSeq++;
    newEvents.push({ id: eventSeq, turn: newTurn, type: 'victory', agent: finalAlive[0].id });
  }

  return {
    ...prev,
    agents: finalAgents,
    artifacts: newArtifacts,
    grudges: newGrudges,
    zoneRadius: newZoneRadius,
    turn: newTurn,
    eventSeq,
    events: [...events.slice(-MAX_EVENTS), ...newEvents],
  };
}

export default function useSimulation({ agents, update }) {
  const intervalRef = useRef(null);

  const tick = useCallback(() => {
    update(computeTick);
  }, [update]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    intervalRef.current = setInterval(tick, TICK_MS);
  }, [tick, stop]);

  useEffect(() => {
    const alive = agents.filter((a) => a.alive);
    if (alive.length <= 1 && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [agents]);

  useEffect(() => () => stop(), [stop]);

  return { start, stop };
}
