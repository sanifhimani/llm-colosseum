import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, matchRoute } from './router';
import TopNav from './components/TopNav';
import ArenaPage from './pages/ArenaPage';
import StandingsPage from './pages/StandingsPage';
import FightersPage from './pages/FightersPage';
import FighterProfilePage from './pages/FighterProfilePage';
import LastBattlePage from './pages/LastBattlePage';
import useGameState from './hooks/useGameState';
import useSimulation from './hooks/useSimulation';
import useBattleSocket from './hooks/useBattleSocket';
import useSchedule from './hooks/useSchedule';
import { updatePageTitle } from './utils/ogTags';

const WS_URL = import.meta.env.VITE_WS_URL ||
  `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/battle`;

function useMode() {
  const { search } = useLocation();
  return useMemo(() => {
    const params = new URLSearchParams(search);
    return params.get('mode') === 'demo' ? 'demo' : 'live';
  }, [search]);
}

function PageRouter({ game, onSimulate, onDismiss, nextBattle, simulating }) {
  const { pathname } = useLocation();

  const fighterMatch = matchRoute('/fighters/:id', pathname);
  if (fighterMatch) return <FighterProfilePage id={fighterMatch.id} />;

  if (pathname === '/standings') return <StandingsPage />;
  if (pathname === '/fighters') return <FightersPage />;
  if (pathname === '/last-battle') return <LastBattlePage />;

  return <ArenaPage game={game} onSimulate={onSimulate} onDismiss={onDismiss} nextBattle={nextBattle} simulating={simulating} />;
}

function App() {
  const mode = useMode();
  const { pathname } = useLocation();
  const game = useGameState();
  const schedule = useSchedule();
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    updatePageTitle(pathname);
  }, [pathname]);

  const { reset, setPersist } = game;
  const { start, restart } = useSimulation(game);
  useBattleSocket(game, mode === 'live' ? WS_URL : null);

  useEffect(() => {
    if (mode === 'demo') start();
  }, [mode, start]);

  const handleSimulate = useCallback(() => {
    setPersist(false);
    setSimulating(true);
    reset();
    restart();
  }, [setPersist, reset, restart]);

  const handleDismiss = useCallback(() => {
    setSimulating(false);
    setPersist(true);
    reset();
  }, [setPersist, reset]);

  const battleActive = game.turn > 0 && !game.victory;

  return (
    <div className="app-shell">
      <TopNav live={!simulating && battleActive} simulating={simulating && battleActive} />
      <PageRouter game={game} onSimulate={handleSimulate} onDismiss={handleDismiss} nextBattle={schedule.nextBattle} simulating={simulating} />
    </div>
  );
}

export default App;
