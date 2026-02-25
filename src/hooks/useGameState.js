import { useState, useCallback, useEffect, useRef } from 'react';
import { GRID_SIZE } from '../state/constants';
import { createAgents } from '../state/roster';
import { createArtifacts } from '../state/artifacts';
import { extractBattleStats } from '../utils/battleStats';

const STORAGE_KEY = 'llm-colosseum-state';

function createInitialState() {
  const saved = loadSaved();
  return {
    agents: createAgents(),
    artifacts: createArtifacts(),
    zoneRadius: GRID_SIZE / 2,
    turn: 0,
    grudges: {},
    stunnedAgents: new Set(),
    events: saved.events,
    eventSeq: saved.eventSeq,
    victory: saved.victory,
  };
}

function loadSaved() {
  const empty = { events: [], eventSeq: 0, victory: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.events)) return empty;
    const hasVictory = parsed.events.some((e) => e.type === 'victory');
    if (hasVictory) return empty;
    return {
      events: parsed.events,
      eventSeq: parsed.eventSeq || 0,
      victory: null,
    };
  } catch {
    return empty;
  }
}

function persist(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      events: state.events,
      eventSeq: state.eventSeq,
      victory: state.victory,
    }));
  } catch {}
}

function deriveVictory(next) {
  if (next.victory || next.turn === 0) return;
  const alive = next.agents.filter((a) => a.alive);
  if (alive.length > 1) return;
  const stats = extractBattleStats(next.events);
  if (stats.winner) {
    next.victory = stats;
    return;
  }
  const sole = alive[0];
  if (!sole) return;
  next.victory = {
    winner: { id: sole.id, turn: next.turn },
    victoryEventId: null,
    eliminations: [],
    totalTurns: next.turn,
    totalKills: 0,
    totalBetrayals: 0,
    totalAlliances: 0,
    totalArtifacts: 0,
  };
}

export default function useGameState() {
  const [state, setState] = useState(createInitialState);
  const prevRef = useRef({ events: state.events, victory: state.victory });
  const persistRef = useRef(true);

  useEffect(() => {
    if (!persistRef.current) return;
    if (state.events !== prevRef.current.events || state.victory !== prevRef.current.victory) {
      prevRef.current = { events: state.events, victory: state.victory };
      persist(state);
    }
  }, [state]);

  const update = useCallback((patch) => {
    setState((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
      deriveVictory(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(createInitialState);
  }, []);

  const setPersist = useCallback((enabled) => {
    persistRef.current = enabled;
  }, []);

  return { ...state, update, reset, setPersist };
}
