import { useEffect, useMemo } from 'react';
import TitleBar from './components/TitleBar';
import ArenaCanvas from './components/ArenaCanvas';
import FightersPanel from './components/FightersPanel';
import BattleLog from './components/BattleLog';
import GrudgeMap from './components/GrudgeMap';
import ZonePanel from './components/ZonePanel';
import DialogueBox from './components/DialogueBox';
import DamageFloat from './components/DamageFloat';
import useGameState from './hooks/useGameState';
import useSimulation from './hooks/useSimulation';
import useBattleSocket from './hooks/useBattleSocket';

const WS_URL = import.meta.env.VITE_WS_URL ||
  `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/battle`;

function useMode() {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') === 'demo' ? 'demo' : 'live';
  }, []);
}

function App() {
  const mode = useMode();
  const game = useGameState();

  const { start } = useSimulation(game);
  const isDev = import.meta.env.DEV;
  useBattleSocket(game, mode === 'live' ? WS_URL : null, { autoTrigger: isDev });

  useEffect(() => {
    if (mode === 'demo') start();
  }, [mode, start]);

  return (
    <div className="screen">
      <TitleBar mode={mode} />

      <div className="main-area">
        <FightersPanel agents={game.agents} />

        <div className="arena-col">
          <ArenaCanvas agents={game.agents} artifacts={game.artifacts} zoneRadius={game.zoneRadius}>
            <DamageFloat events={game.events} agents={game.agents} />
          </ArenaCanvas>
          <DialogueBox events={game.events} agents={game.agents} turn={game.turn} />
        </div>

        <div className="right-panels">
          <ZonePanel zoneRadius={game.zoneRadius} turn={game.turn} artifacts={game.artifacts} />
          <GrudgeMap grudges={game.grudges} />
          <BattleLog events={game.events} />
        </div>
      </div>
    </div>
  );
}

export default App;
