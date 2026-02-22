import { useEffect } from 'react';
import TitleBar from './components/TitleBar';
import ArenaCanvas from './components/ArenaCanvas';
import FightersPanel from './components/FightersPanel';
import useGameState from './hooks/useGameState';
import useSimulation from './hooks/useSimulation';

function App() {
  const game = useGameState();
  const { start } = useSimulation(game);

  useEffect(() => { start(); }, [start]);

  return (
    <div className="screen">
      <TitleBar />

      <div className="main-area">
        <FightersPanel agents={game.agents} />

        <ArenaCanvas agents={game.agents} artifacts={game.artifacts} zoneRadius={game.zoneRadius} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="pbox" style={{ overflow: 'hidden' }}>
            <div className="panel-title">{'\u25B6'} BATTLE LOG</div>
          </div>
          <div className="pbox" style={{ overflow: 'hidden' }}>
            <div className="panel-title">{'\u25B6'} GRUDGE MAP</div>
          </div>
          <div className="pbox" style={{ overflow: 'hidden' }}>
            <div className="panel-title">{'\u25B6'} ZONE / HAZARDS</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
