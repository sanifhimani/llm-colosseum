import { useCallback, useState } from 'react';
import { ROSTER } from '../state/roster';
import { generateShareCard } from '../utils/shareCard';
import AgentSprite from './AgentSprite';

const AGENT_MAP = Object.fromEntries(ROSTER.map((r) => [r.id, r]));

export default function VictoryScreen({ stats, onDismiss, simulating = false }) {
  const [sharing, setSharing] = useState(false);
  const { winner, eliminations, totalTurns, totalBetrayals, totalAlliances, totalArtifacts } = stats;

  const agent = winner ? AGENT_MAP[winner.id] : null;
  const winnerName = agent?.name || winner?.id?.toUpperCase() || 'UNKNOWN';
  const winnerColor = agent?.color || '#e8e8f0';

  const handleShare = useCallback(async () => {
    setSharing(true);
    try {
      const blob = await generateShareCard(stats);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'llm-colosseum-result.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      const tweetText = encodeURIComponent(
        `${winnerName} won the LLM Colosseum battle in ${totalTurns} turns! #LLMColosseum\n\nhttps://llmcolosseum.dev`
      );
      window.open(`https://x.com/intent/tweet?text=${tweetText}`, '_blank');
    } catch {
    } finally {
      setSharing(false);
    }
  }, [stats, winnerName, totalTurns]);

  if (!winner) return null;

  return (
    <div className="victory-overlay" onClick={onDismiss}>
      <div className="victory-panel pbox pbox-gold" onClick={(e) => e.stopPropagation()}>
        <AgentSprite agentId={winner.id} color={winnerColor} />

        <div className="victory-title" style={{ color: winnerColor }}>
          WINNER: {winnerName}
        </div>

        {agent?.model && (
          <div style={{ fontSize: '8px', color: 'var(--color-dim)', letterSpacing: '1px' }}>
            {agent.model}
          </div>
        )}

        <div className="victory-elim-list">
          {eliminations.map((elim, i) => {
            const target = AGENT_MAP[elim.target];
            const targetName = target?.name || elim.target.toUpperCase();
            const targetColor = target?.color || 'var(--color-white)';

            let killerText;
            if (elim.isZoneKill) {
              killerText = 'ZONE';
            } else {
              const killer = AGENT_MAP[elim.killer];
              const prefix = elim.isBetray ? 'BETRAYED BY ' : 'BY ';
              killerText = prefix + (killer?.name || elim.killer.toUpperCase());
            }

            return (
              <div key={i} className="victory-elim-row">
                <span style={{ color: targetColor }}>{targetName}</span>
                <span style={{ color: 'var(--color-dim)' }}>T{elim.turn}</span>
                <span style={{ color: 'var(--color-white)', fontSize: '7px' }}>{killerText}</span>
              </div>
            );
          })}
        </div>

        <div className="victory-stats">
          <span>{totalTurns} TURNS</span>
          <span>{totalBetrayals} BETRAYALS</span>
          <span>{totalAlliances} ALLIANCES</span>
          <span>{totalArtifacts} ARTIFACTS</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          {!simulating && (
            <button className="victory-btn" onClick={handleShare} disabled={sharing}>
              {sharing ? 'SHARING...' : 'SHARE'}
            </button>
          )}
          <button className="victory-btn victory-btn-dim" onClick={onDismiss}>
            {simulating ? 'BACK' : 'DISMISS'}
          </button>
        </div>
      </div>
    </div>
  );
}
