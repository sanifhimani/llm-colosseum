import { useEffect, useMemo } from 'react';
import TitleBar from './components/TitleBar';
import ArenaCanvas from './components/ArenaCanvas';
import FightersPanel from './components/FightersPanel';
import BattleLog from './components/BattleLog';
import GrudgeMap from './components/GrudgeMap';
import ZonePanel from './components/ZonePanel';
import DialogueBox from './components/DialogueBox';
import DamageFloat from './components/DamageFloat';
import VictoryScreen from './components/VictoryScreen';
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
  useBattleSocket(game, mode === 'live' ? WS_URL : null);

  useEffect(() => {
    if (mode === 'demo') start();
  }, [mode, start]);

  return (
    <div className="screen">
      <TitleBar battleActive={game.turn > 0 && !game.victory} />

      <div className="main-area">
        <FightersPanel agents={game.agents} />

        <div className="arena-col">
          <ArenaCanvas agents={game.agents} artifacts={game.artifacts} zoneRadius={game.zoneRadius} active={game.turn > 0 && !game.victory}>
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

      {game.victory && (
        <VictoryScreen
          stats={game.victory}
          onDismiss={game.reset}
        />
      )}
    </div>
  );
}

export default App;
