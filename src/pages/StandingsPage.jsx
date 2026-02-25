import { useMemo } from 'react';
import { Link } from '../router';
import useApi from '../hooks/useApi';

function getTrustColor(trust) {
  if (trust >= 50) return 'var(--color-green)';
  if (trust >= 30) return 'var(--color-gold)';
  return 'var(--color-red)';
}

function formatStreak(streak) {
  if (streak === 0) return { text: '--', color: 'var(--color-dim)' };
  if (streak > 0) return { text: `W${streak}`, color: 'var(--color-green)' };
  return { text: `L${Math.abs(streak)}`, color: 'var(--color-red)' };
}

function getH2hKills(headToHead, rowId, colId) {
  const key = [rowId, colId].sort().join('_vs_');
  const matchup = headToHead[key];
  if (!matchup) return 0;
  return matchup[rowId] ?? 0;
}

function getH2hClass(headToHead, rowId, colId) {
  const myKills = getH2hKills(headToHead, rowId, colId);
  const theirKills = getH2hKills(headToHead, colId, rowId);
  if (myKills > theirKills) return 'h2h-cell h2h-win';
  if (myKills < theirKills) return 'h2h-cell h2h-loss';
  return 'h2h-cell';
}

function Leaderboard({ agents }) {
  return (
    <div className="pbox" style={{ padding: 16, marginBottom: 16 }}>
      <table className="standings-table">
        <thead>
          <tr>
            <th>#</th>
            <th>FIGHTER</th>
            <th>RECORD</th>
            <th>KILLS</th>
            <th>DEATHS</th>
            <th>BETRAYALS</th>
            <th>TRUST</th>
            <th>AVG PLACE</th>
            <th>STREAK</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent, i) => {
            const rank = i + 1;
            const s = agent.stats;
            const streak = formatStreak(s.currentStreak);
            const trustColor = getTrustColor(s.trustScore);

            return (
              <tr key={agent.id}>
                <td>
                  <span className={`standings-rank${rank > 2 ? ' standings-rank-dim' : ''}`}>
                    {rank}
                  </span>
                </td>
                <td>
                  <Link to={`/fighters/${agent.id}`} className="standings-name-link">
                    <span className="standings-name" style={{ color: agent.color }}>
                      {agent.name}
                    </span>
                    <span className="standings-model">{agent.model}</span>
                  </Link>
                </td>
                <td>
                  <span className="standings-record">{s.wins}W</span>
                  {' '}
                  <span className="standings-record-loss">{s.losses}L</span>
                </td>
                <td className="standings-stat">{s.kills}</td>
                <td className="standings-stat">{s.deaths}</td>
                <td className="standings-stat-bad">{s.betrayals}</td>
                <td>
                  <div className="standings-trust-bar">
                    <div
                      className="standings-trust-fill"
                      style={{ width: `${s.trustScore}%`, background: trustColor }}
                    />
                  </div>
                  <span style={{ color: trustColor, fontSize: 7, marginLeft: 4 }}>
                    {s.trustScore}
                  </span>
                </td>
                <td className="standings-stat">{s.avgPlacement.toFixed(1)}</td>
                <td style={{ color: streak.color }}>{streak.text}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HeadToHead({ agents, headToHead }) {
  return (
    <div className="pbox" style={{ padding: 16 }}>
      <div className="section-title">HEAD-TO-HEAD KILLS</div>
      <div className="section-label" style={{ marginBottom: 12 }}>
        ROW = KILLER // COLUMN = VICTIM
      </div>
      <div
        className="h2h-grid"
        style={{ gridTemplateColumns: `repeat(${agents.length + 1}, 1fr)` }}
      >
        <div className="h2h-header" />
        {agents.map((agent) => (
          <div key={`col-${agent.id}`} className="h2h-header" style={{ color: agent.color }}>
            {agent.name}
          </div>
        ))}

        {agents.map((row) => (
          <div key={`row-${row.id}`} style={{ display: 'contents' }}>
            <div className="h2h-header" style={{ color: row.color }}>{row.name}</div>
            {agents.map((col) => {
              if (row.id === col.id) {
                return (
                  <div key={`${row.id}-${col.id}`} className="h2h-cell h2h-self">--</div>
                );
              }
              const kills = getH2hKills(headToHead, row.id, col.id);
              return (
                <div
                  key={`${row.id}-${col.id}`}
                  className={getH2hClass(headToHead, row.id, col.id)}
                >
                  {kills}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StandingsPage() {
  const { data: agentsData, loading: agentsLoading, error: agentsError } = useApi('/api/agents');
  const { data: standingsData, loading: standingsLoading, error: standingsError } = useApi('/api/standings');

  const totalBattles = standingsData?.totalBattles ?? 0;
  const headToHead = standingsData?.headToHead ?? {};

  const sorted = useMemo(() => {
    const agents = agentsData?.agents ?? [];
    return [...agents].sort((a, b) => {
      if (b.stats.wins !== a.stats.wins) return b.stats.wins - a.stats.wins;
      return a.stats.avgPlacement - b.stats.avgPlacement;
    });
  }, [agentsData]);

  const loading = agentsLoading || standingsLoading;
  const error = agentsError || standingsError;

  if (loading) {
    return (
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">STANDINGS</h1>
        </div>
        <div className="empty-state">LOADING...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">STANDINGS</h1>
        </div>
        <div className="empty-state">FAILED TO LOAD DATA</div>
      </div>
    );
  }

  if (totalBattles === 0) {
    return (
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">STANDINGS</h1>
          <p className="page-subtitle">SEASON {standingsData?.season ?? 1}</p>
        </div>
        <div className="empty-state">No battles played yet</div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">STANDINGS</h1>
        <p className="page-subtitle">
          SEASON {standingsData.season} // {totalBattles} BATTLE{totalBattles !== 1 ? 'S' : ''} PLAYED
        </p>
      </div>

      <Leaderboard agents={sorted} />
      <HeadToHead agents={sorted} headToHead={headToHead} />
    </div>
  );
}
