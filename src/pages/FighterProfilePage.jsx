import { useMemo } from 'react';
import { Link } from '../router';
import useApi from '../hooks/useApi';
import { formatAction } from '../utils/format';

function getTrustColor(trust) {
  if (trust >= 50) return 'var(--color-green)';
  if (trust >= 30) return 'var(--color-gold)';
  return 'var(--color-red)';
}

function parseMemory(memory) {
  const match = memory.match(/^Day (\d+):\s*(Won|Lost|Eliminated)\.\s*(.*)$/i);
  if (!match) return { day: null, won: false, text: memory };
  return {
    day: parseInt(match[1], 10),
    won: match[2].toLowerCase() === 'won',
    text: match[3],
  };
}

function getInterestingThoughts(turns, agentId, limit = 5) {
  const agentTurns = turns.filter((t) => t.agent === agentId && t.thinking);
  const interesting = agentTurns.filter((t) => {
    if (!t.event) return false;
    const type = t.event.type;
    return (
      type === 'kill' ||
      type === 'attack' ||
      type === 'alliance' ||
      type === 'ally_propose' ||
      type === 'artifact'
    );
  });
  if (interesting.length >= limit) return interesting.slice(0, limit);
  const seen = new Set(interesting);
  const remaining = agentTurns.filter((t) => !seen.has(t));
  return [...interesting, ...remaining].slice(0, limit);
}

export default function FighterProfilePage({ id }) {
  const {
    data: agent,
    loading: agentLoading,
    error: agentError,
  } = useApi(`/api/agents/${id}`);
  const { data: battle, loading: battleLoading } = useApi('/api/last-battle');

  const memories = useMemo(
    () => (agent?.memories || []).map(parseMemory),
    [agent?.memories]
  );
  const grudges = useMemo(
    () => Object.entries(agent?.grudges || {}),
    [agent?.grudges]
  );
  const trustScores = useMemo(
    () => Object.entries(agent?.trustScores || {}),
    [agent?.trustScores]
  );
  const h2h = useMemo(
    () => Object.entries(agent?.headToHead || {}),
    [agent?.headToHead]
  );
  const thoughts = useMemo(
    () => (battle?.turns ? getInterestingThoughts(battle.turns, id) : []),
    [battle, id]
  );

  const loading = agentLoading || battleLoading;

  if (loading) {
    return (
      <div className="page-content">
        <Link to="/fighters" className="profile-back">
          {'\u2190'} BACK TO FIGHTERS
        </Link>
        <div className="page-header">
          <h1 className="page-title">{id.toUpperCase()}</h1>
        </div>
        <div className="empty-state">LOADING...</div>
      </div>
    );
  }

  if (agentError || !agent) {
    return (
      <div className="page-content">
        <Link to="/fighters" className="profile-back">
          {'\u2190'} BACK TO FIGHTERS
        </Link>
        <div className="page-header">
          <h1 className="page-title">{id.toUpperCase()}</h1>
        </div>
        <div className="empty-state">FAILED TO LOAD DATA</div>
      </div>
    );
  }

  const s = agent.stats;
  const hasBattles = s.wins + s.losses > 0;

  return (
    <div className="page-content">
      <Link to="/fighters" className="profile-back">
        {'\u2190'} BACK TO FIGHTERS
      </Link>

      <div className="pbox" style={{ padding: 16, marginBottom: 12 }}>
        <div className="profile-header">
          <div className="profile-sprite" style={{ color: agent.color }}>
            {agent.name.charAt(0)}
          </div>
          <div className="profile-info">
            <div className="profile-name" style={{ color: agent.color }}>
              {agent.name}
            </div>
            <div className="profile-model">
              {agent.model} // {agent.provider.toUpperCase()}
            </div>
            <div className="profile-record">
              <span style={{ color: 'var(--color-green)' }}>{s.wins}W</span>{' '}
              <span style={{ color: 'var(--color-red)' }}>{s.losses}L</span>
            </div>
          </div>
        </div>

        <div className="stat-grid">
          <div className="stat-box">
            <span className="stat-box-val">{s.kills}</span>
            <span className="stat-box-lbl">KILLS</span>
          </div>
          <div className="stat-box">
            <span className="stat-box-val">{s.deaths}</span>
            <span className="stat-box-lbl">DEATHS</span>
          </div>
          <div className="stat-box">
            <span className="stat-box-val" style={{ color: 'var(--color-red)' }}>
              {s.betrayals}
            </span>
            <span className="stat-box-lbl">BETRAYALS</span>
          </div>
          <div className="stat-box">
            <span className="stat-box-val">{s.alliancesFormed ?? 0}</span>
            <span className="stat-box-lbl">ALLIANCES</span>
          </div>
          <div className="stat-box">
            <span
              className="stat-box-val"
              style={{ color: getTrustColor(s.trustScore) }}
            >
              {s.trustScore}
            </span>
            <span className="stat-box-lbl">TRUST SCORE</span>
          </div>
          <div className="stat-box">
            <span className="stat-box-val" style={{ color: 'var(--color-gold)' }}>
              {(s.avgPlacement || 0).toFixed(1)}
            </span>
            <span className="stat-box-lbl">AVG PLACE</span>
          </div>
          <div className="stat-box">
            <span className="stat-box-val" style={{ color: 'var(--color-green)' }}>
              {s.longestStreak ?? 0}
            </span>
            <span className="stat-box-lbl">WIN STREAK</span>
          </div>
          <div className="stat-box">
            <span className="stat-box-val">{s.artifactsUsed ?? 0}</span>
            <span className="stat-box-lbl">ARTIFACTS</span>
          </div>
        </div>
      </div>

      {hasBattles ? (
        <div className="profile-grid">
          <div>
            <div className="pbox" style={{ padding: 14, marginBottom: 12 }}>
              <div className="section-title">BATTLE MEMORIES</div>
              {memories.length > 0 ? (
                memories.map((mem, i) => (
                  <div
                    key={i}
                    className={`memory-entry ${mem.won ? 'memory-win' : 'memory-loss'}`}
                  >
                    {mem.day !== null && (
                      <span className="memory-day">DAY {mem.day}:</span>
                    )}{' '}
                    <span className="memory-text">{mem.text}</span>
                  </div>
                ))
              ) : (
                <div
                  className="empty-state"
                  style={{ padding: '16px 0' }}
                >
                  No memories recorded
                </div>
              )}
            </div>

            <div className="pbox" style={{ padding: 14 }}>
              <div className="section-title">GRUDGES</div>
              {grudges.length > 0 ? (
                grudges.map(([target, count]) => (
                  <div key={target} className="grudge-row">
                    <span style={{ flex: 1 }}>{target.toUpperCase()}</span>
                    <span style={{ color: 'var(--color-dim)', fontSize: 7 }}>
                      GRUDGE
                    </span>
                    <span style={{ flex: 1, textAlign: 'right', color: 'var(--color-red)' }}>
                      x{Math.abs(count)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="section-empty">
                  No grudges
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <div className="section-title">TRUST TOWARD OTHERS</div>
                {trustScores.length > 0 ? (
                  trustScores.map(([target, score]) => (
                    <div key={target} className="trust-row">
                      <span>{target.toUpperCase()}</span>
                      <span style={{ color: getTrustColor(score) }}>
                        {score}
                      </span>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      fontSize: 7,
                      color: 'var(--color-dim)',
                      padding: '8px 0',
                    }}
                  >
                    No trust data
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="pbox" style={{ padding: 14, marginBottom: 12 }}>
              <div className="section-title">LATEST THOUGHTS</div>
              {battle && (
                <div className="section-label" style={{ marginBottom: 10 }}>
                  FROM DAY {battle.day} BATTLE
                </div>
              )}
              {thoughts.length > 0 ? (
                thoughts.map((turn, i) => (
                  <div key={i} className="thinking-box">
                    <span className="thinking-turn">TURN {turn.turn}</span>
                    {turn.thinking}
                    <span className="thinking-action">
                      {formatAction(turn)}
                    </span>
                  </div>
                ))
              ) : (
                <div
                  className="empty-state"
                  style={{ padding: '16px 0' }}
                >
                  No thoughts recorded
                </div>
              )}
            </div>

            <div className="pbox" style={{ padding: 14 }}>
              <div className="section-title">HEAD-TO-HEAD</div>
              {h2h.length > 0 ? (
                h2h.map(([opponent, record]) => (
                  <div key={opponent} className="grudge-row">
                    <span>VS {opponent.toUpperCase()}</span>
                    <span style={{ color: 'var(--color-green)' }}>
                      {record.kills} KILL{record.kills !== 1 ? 'S' : ''}
                    </span>
                    <span style={{ color: 'var(--color-red)' }}>
                      {record.deaths} DEATH{record.deaths !== 1 ? 'S' : ''}
                    </span>
                  </div>
                ))
              ) : (
                <div className="section-empty">
                  No head-to-head data
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state">No battle data yet</div>
      )}
    </div>
  );
}
