import { useEffect, useMemo } from 'react';
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

const WS_URL = import.meta.env.VITE_WS_URL ||
  `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/battle`;

function useMode() {
  const { search } = useLocation();
  return useMemo(() => {
    const params = new URLSearchParams(search);
    return params.get('mode') === 'demo' ? 'demo' : 'live';
  }, [search]);
}

function PageRouter({ game }) {
  const { pathname } = useLocation();

  const fighterMatch = matchRoute('/fighters/:id', pathname);
  if (fighterMatch) return <FighterProfilePage id={fighterMatch.id} />;

  if (pathname === '/standings') return <StandingsPage />;
  if (pathname === '/fighters') return <FightersPage />;
  if (pathname === '/last-battle') return <LastBattlePage />;

  return <ArenaPage game={game} />;
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
    <div className="app-shell">
      <TopNav live={game.turn > 0 && !game.victory} />
      <PageRouter game={game} />
    </div>
  );
}

export default App;
