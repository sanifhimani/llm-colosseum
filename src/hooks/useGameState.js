import { useState, useCallback } from 'react';
import { GRID_SIZE } from '../state/constants';
import { createAgents } from '../state/roster';
import { createArtifacts } from '../state/artifacts';

function createInitialState() {
  return {
    agents: createAgents(),
    artifacts: createArtifacts(),
    zoneRadius: GRID_SIZE / 2,
    turn: 0,
    grudges: {},
    events: [],
    eventSeq: 0,
  };
}

export default function useGameState() {
  const [state, setState] = useState(createInitialState);

  const update = useCallback((patch) => {
    setState((prev) => (typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setState(createInitialState);
  }, []);

  return { ...state, update, reset };
}
