import { useState, useCallback, useEffect, useRef } from 'react';
import { GRID_SIZE } from '../state/constants';
import { createAgents } from '../state/roster';
import { createArtifacts } from '../state/artifacts';

const STORAGE_KEY = 'llm-colosseum-events';

function createInitialState() {
  const events = loadEvents();
  const maxId = events.reduce((max, e) => Math.max(max, e.id || 0), 0);
  return {
    agents: createAgents(),
    artifacts: createArtifacts(),
    zoneRadius: GRID_SIZE / 2,
    turn: 0,
    grudges: {},
    events,
    eventSeq: maxId,
  };
}

function loadEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveEvents(events) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // storage full or unavailable
  }
}

export default function useGameState() {
  const [state, setState] = useState(createInitialState);
  const prevEventsRef = useRef(state.events);

  useEffect(() => {
    if (state.events !== prevEventsRef.current) {
      prevEventsRef.current = state.events;
      saveEvents(state.events);
    }
  }, [state.events]);

  const update = useCallback((patch) => {
    setState((prev) => (typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(createInitialState);
  }, []);

  return { ...state, update, reset };
}
