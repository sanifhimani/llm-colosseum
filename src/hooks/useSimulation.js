import { useState, useRef, useCallback, useEffect } from 'react';
import { applyMove, applyAttack, applyAlly, applyBetray, applyUseArtifact, pickRandomAction } from '../simulation/actions';
import { checkZoneShrink, applyZoneDamage } from '../simulation/zone';

const TICK_MS = 800;

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

export default function useSimulation({ agents, artifacts, zoneRadius, turn, grudges, update }) {
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  const stateRef = useRef({ agents, artifacts, zoneRadius, turn, grudges });

  useEffect(() => {
    stateRef.current = { agents, artifacts, zoneRadius, turn, grudges };
  }, [agents, artifacts, zoneRadius, turn, grudges]);

  const tick = useCallback(() => {
    const state = stateRef.current;
    const alive = state.agents.filter((a) => a.alive);

    if (alive.length <= 1) {
      setRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      const winner = alive[0];
      if (winner) {
        update((prev) => ({
          ...prev,
          events: [...prev.events, { turn: state.turn, type: 'victory', agent: winner.id }],
        }));
      }
      return;
    }

    const agentIndex = state.turn % alive.length;
    const agent = alive[agentIndex];
    const action = pickRandomAction(agent, state.agents, state.artifacts);
    const result = resolveAction({ ...action, agent: agent.id }, state);

    const newAgents = result.agents || state.agents;
    const newArtifacts = result.artifacts || state.artifacts;
    const newGrudges = result.grudges || state.grudges;
    const newTurn = state.turn + 1;
    const newEvents = [];

    if (result.event) newEvents.push({ ...result.event, turn: newTurn });

    let newZoneRadius = state.zoneRadius;
    const newAlive = newAgents.filter((a) => a.alive);
    if (newAlive.length > 0 && newTurn % newAlive.length === 0) {
      newZoneRadius = checkZoneShrink(newTurn, state.zoneRadius);
      const zoneDmg = applyZoneDamage(newAgents, newZoneRadius);
      if (zoneDmg.events.length > 0) {
        newEvents.push(...zoneDmg.events.map((e) => ({ ...e, turn: newTurn })));
        update((prev) => ({
          ...prev,
          agents: zoneDmg.agents,
          artifacts: newArtifacts,
          grudges: newGrudges,
          zoneRadius: newZoneRadius,
          turn: newTurn,
          events: [...prev.events, ...newEvents],
        }));
        return;
      }
    }

    update((prev) => ({
      ...prev,
      agents: newAgents,
      artifacts: newArtifacts,
      grudges: newGrudges,
      zoneRadius: newZoneRadius,
      turn: newTurn,
      events: [...prev.events, ...newEvents],
    }));
  }, [update]);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    setRunning(true);
    intervalRef.current = setInterval(tick, TICK_MS);
  }, [tick]);

  const stop = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { running, start, stop };
}
