import ArenaCanvas from '../components/ArenaCanvas';
import FightersPanel from '../components/FightersPanel';
import BattleLog from '../components/BattleLog';
import GrudgeMap from '../components/GrudgeMap';
import ZonePanel from '../components/ZonePanel';
import DialogueBox from '../components/DialogueBox';
import DamageFloat from '../components/DamageFloat';
import VictoryScreen from '../components/VictoryScreen';

export default function ArenaPage({ game }) {
  return (
    <div className="arena-screen">
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
