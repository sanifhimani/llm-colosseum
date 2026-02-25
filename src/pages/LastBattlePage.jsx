import { useState, useMemo } from 'react';
import useApi from '../hooks/useApi';
import { formatAction } from '../utils/format';

const INTERESTING_EVENTS = new Set(['kill', 'attack', 'alliance', 'ally_propose', 'artifact']);

const ORDINALS = ['1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH'];

function formatDuration(startedAt, endedAt) {
  const ms = new Date(endedAt) - new Date(startedAt);
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function formatLatency(turn) {
  const latency = turn.latencyMs ? `${(turn.latencyMs / 1000).toFixed(1)}s` : null;
  const tokens = turn.tokensUsed
    ? turn.tokensUsed.input + turn.tokensUsed.output
    : 0;
  const parts = [];
  if (latency) parts.push(latency);
  if (tokens > 0) parts.push(`${tokens} tokens`);
  return parts.join(' // ');
}

export default function LastBattlePage() {
  const { data: battle, loading: battleLoading, error: battleError } = useApi('/api/last-battle');
  const { data: agentsData, loading: agentsLoading } = useApi('/api/agents');

  const [filter, setFilter] = useState('all');
  const [showAll, setShowAll] = useState(false);

  const agentMap = useMemo(() => {
    if (!agentsData?.agents) return {};
    const map = {};
    for (const agent of agentsData.agents) {
      map[agent.id] = { name: agent.name, color: agent.color, model: agent.model };
    }
    return map;
  }, [agentsData]);

  const duration = useMemo(() => {
    if (!battle) return '';
    return formatDuration(battle.startedAt, battle.endedAt);
  }, [battle]);

  const eliminationTurns = useMemo(() => {
    const turns = battle?.turns;
    if (!turns) return {};
    const map = {};
    for (const turn of turns) {
      if (turn.event?.type === 'kill' && turn.event.target) {
        map[turn.event.target] = turn.turn;
      }
    }
    return map;
  }, [battle?.turns]);

  const filteredTurns = useMemo(() => {
    const allTurns = battle?.turns;
    if (!allTurns) return [];
    let turns = allTurns;

    if (!showAll) {
      turns = turns.filter((t) => t.event && INTERESTING_EVENTS.has(t.event.type));
    }

    if (filter === 'kills') {
      turns = turns.filter((t) => t.event?.type === 'kill');
    } else if (filter !== 'all') {
      turns = turns.filter((t) => t.agent === filter);
    }

    return turns;
  }, [battle?.turns, filter, showAll]);

  const loading = battleLoading || agentsLoading;

  if (loading) {
    return (
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">LAST BATTLE</h1>
        </div>
        <div className="empty-state">LOADING...</div>
      </div>
    );
  }

  if (battleError || !battle) {
    return (
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">LAST BATTLE</h1>
        </div>
        <div className="empty-state">NO BATTLES YET</div>
      </div>
    );
  }

  const winner = battle.placement[0];
  const winnerInfo = agentMap[winner] || {};
  const totalTurns = battle.stats?.totalTurns ?? battle.turns.length;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">LAST BATTLE</h1>
        <p className="page-subtitle">
          DAY {battle.day} // {battle.date} // {duration}
        </p>
      </div>

      <div className="transcript-hero pbox">
        <div>
          <div className="transcript-winner-label">WINNER</div>
          <div className="transcript-winner-name" style={{ color: winnerInfo.color }}>
            {winnerInfo.name || winner.toUpperCase()}
          </div>
          <div className="transcript-meta" style={{ marginTop: 4 }}>
            {winnerInfo.model || battle.roster?.find((r) => r.id === winner)?.model}
          </div>
        </div>
        <div>
          <div className="placement-list" style={{ margin: 0 }}>
            {battle.placement.map((id, i) => {
              const info = agentMap[id] || {};
              return (
                <div key={id} className={`placement-item${i === 0 ? ' placement-1' : ''}`}>
                  <span className="placement-num">{ORDINALS[i]}</span>
                  <span style={{ color: info.color }}>
                    {info.name || id.toUpperCase()}
                  </span>
                  {i > 0 && eliminationTurns[id] != null && (
                    <span style={{ color: 'var(--color-dim)', fontSize: 7 }}>
                      T{eliminationTurns[id]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="transcript-summary">
        <div className="stat-box">
          <span className="stat-box-val">{totalTurns}</span>
          <span className="stat-box-lbl">TURNS</span>
        </div>
        <div className="stat-box">
          <span className="stat-box-val" style={{ color: 'var(--color-red)' }}>
            {battle.stats?.betrayals ?? 0}
          </span>
          <span className="stat-box-lbl">BETRAYALS</span>
        </div>
        <div className="stat-box">
          <span className="stat-box-val" style={{ color: 'var(--color-green)' }}>
            {battle.stats?.alliancesFormed ?? 0}
          </span>
          <span className="stat-box-lbl">ALLIANCES</span>
        </div>
        <div className="stat-box">
          <span className="stat-box-val" style={{ color: 'var(--color-gold)' }}>
            {battle.stats?.artifactsUsed ?? 0}
          </span>
          <span className="stat-box-lbl">ARTIFACTS</span>
        </div>
      </div>

      <div className="pbox" style={{ padding: 16 }}>
        <div className="section-title">TURN LOG</div>

        <div className="filter-row">
          <button
            className={`filter-btn${filter === 'all' ? ' active' : ''}`}
            onClick={() => setFilter('all')}
          >
            ALL
          </button>
          {battle.roster.map((r) => {
            const info = agentMap[r.id] || {};
            return (
              <button
                key={r.id}
                className={`filter-btn${filter === r.id ? ' active' : ''}`}
                style={{ color: filter === r.id ? undefined : info.color }}
                onClick={() => setFilter(r.id)}
              >
                {info.name || r.id.toUpperCase()}
              </button>
            );
          })}
          <button
            className={`filter-btn${filter === 'kills' ? ' active' : ''}`}
            style={{ color: filter === 'kills' ? undefined : 'var(--color-red)' }}
            onClick={() => setFilter('kills')}
          >
            KILLS ONLY
          </button>
        </div>

        {filteredTurns.map((turn) => {
          const info = agentMap[turn.agent] || {};
          const isKill = turn.event?.type === 'kill';
          const isAlliance = turn.event?.type === 'alliance';
          const latencyText = formatLatency(turn);

          let eventText = null;
          if (isKill && turn.event.target) {
            const targetName = (agentMap[turn.event.target]?.name || turn.event.target).toUpperCase();
            const placementIndex = battle.placement.indexOf(turn.event.target);
            const ordinal = placementIndex >= 0 ? ORDINALS[placementIndex] : '';
            eventText = `${targetName} ELIMINATED -- ${ordinal} PLACE`;
          } else if (isAlliance) {
            const targetName = (agentMap[turn.event.target]?.name || turn.event.target || '').toUpperCase();
            const agentName = (info.name || turn.agent).toUpperCase();
            eventText = `ALLIANCE FORMED: ${agentName} + ${targetName}`;
          }

          return (
            <div
              key={turn.turn}
              className="turn-entry"
              style={isKill ? { background: 'rgba(232, 56, 56, 0.04)' } : undefined}
            >
              <div className="turn-num">T{turn.turn}</div>
              <div className="turn-agent" style={{ color: info.color }}>
                {info.name || turn.agent.toUpperCase()}
              </div>
              <div>
                {turn.thinking && (
                  <div className="turn-thinking">"{turn.thinking}"</div>
                )}
                <div className="turn-action-text">{formatAction(turn)}</div>
                {eventText && (
                  <div className={isKill ? 'turn-event-kill' : 'turn-event-ally'}>
                    {eventText}
                  </div>
                )}
                {latencyText && (
                  <div className="turn-latency">{latencyText}</div>
                )}
              </div>
            </div>
          );
        })}

        <button
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'center',
            padding: 20,
            color: 'var(--color-dim)',
            fontSize: 7,
            fontFamily: 'var(--font-pixel)',
            letterSpacing: 1,
            cursor: 'pointer',
            background: 'none',
            border: 'none',
          }}
          onClick={() => setShowAll((prev) => !prev)}
        >
          {showAll
            ? `SHOWING ALL ${totalTurns} TURNS`
            : `SHOWING KEY MOMENTS // ${totalTurns} TOTAL TURNS`}
        </button>
      </div>
    </div>
  );
}
