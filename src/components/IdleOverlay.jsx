import { useState, useEffect } from 'react';
import { Link } from '../router';
import { ROSTER } from '../state/roster';
import useApi from '../hooks/useApi';
import AgentSprite from './AgentSprite';

function formatCountdown(targetMs) {
  if (!targetMs) return '--:--:--';

  const diff = targetMs - Date.now();
  if (diff <= 0) return '--:--:--';

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return [hours, minutes, seconds]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}

function FighterRoster({ agents }) {
  return (
    <div className="idle-roster">
      {ROSTER.map((fighter) => {
        const record = agents[fighter.id];
        const wins = record?.wins ?? 0;
        const losses = record?.losses ?? 0;

        return (
          <div key={fighter.id} className="idle-fighter">
            <div className="idle-sprite">
              <AgentSprite agentId={fighter.id} color={fighter.color} />
            </div>
            <span style={{ color: fighter.color }}>{fighter.name}</span>
            <span className="idle-fighter-record">{wins}W {losses}L</span>
          </div>
        );
      })}
    </div>
  );
}

const NAV_CARDS = [
  { to: '/standings', icon: '#', title: 'STANDINGS', desc: 'SEASON RANKINGS' },
  { to: '/fighters', icon: '@', title: 'FIGHTERS', desc: 'ALL COMPETITORS' },
  { to: '/last-battle', icon: '>', title: 'LAST BATTLE', desc: 'FULL TRANSCRIPT' },
];

export default function IdleOverlay({ onSimulate, nextBattle }) {
  const targetMs = nextBattle ? new Date(nextBattle).getTime() : null;
  const [countdown, setCountdown] = useState(() => formatCountdown(targetMs));
  const { data: standings } = useApi('/api/standings');

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(formatCountdown(targetMs));
    }, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  const agents = standings?.agents ?? {};
  const season = standings?.season ?? 1;
  const totalBattles = standings?.totalBattles ?? 0;

  return (
    <div className="victory-overlay">
      <div className="idle-panel pbox pbox-gold" onClick={(e) => e.stopPropagation()}>
        <div className="idle-title">NEXT BATTLE</div>

        <div className="countdown">{countdown}</div>
        <div className="countdown-label">HOURS : MINUTES : SECONDS</div>

        <FighterRoster agents={agents} />

        <button className="idle-btn" onClick={onSimulate}>
          WATCH SIMULATION
        </button>

        <div className="idle-nav-cards">
          {NAV_CARDS.map((card) => (
            <Link key={card.to} to={card.to} className="idle-nav-card">
              <div className="idle-nav-card-icon">{card.icon}</div>
              <div className="idle-nav-card-title">{card.title}</div>
              <div className="idle-nav-card-desc">{card.desc}</div>
            </Link>
          ))}
        </div>

        <div className="idle-status">SEASON {season} // DAY {totalBattles + 1}</div>
      </div>
    </div>
  );
}
