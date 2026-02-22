import { useRef, useEffect, useState } from 'react';
import { drawAgentSprite } from '../utils/sprites';

function MiniSprite({ agentId, color, alive }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 20, 20);
    if (!alive) ctx.globalAlpha = 0.35;
    drawAgentSprite(ctx, agentId, 3, 2, 2, color);
    ctx.globalAlpha = 1;
  }, [agentId, color, alive]);

  return (
    <canvas
      ref={canvasRef}
      width={20}
      height={20}
      style={{ imageRendering: 'pixelated', flexShrink: 0 }}
    />
  );
}

function HpBar({ hp, maxHp }) {
  const pct = hp / maxHp;
  const color = pct > 0.6 ? 'var(--color-green)' : pct > 0.3 ? 'var(--color-gold)' : 'var(--color-red)';

  return (
    <div className="fighter-hp-bar">
      <div className="fighter-hp-fill" style={{ width: `${pct * 100}%`, background: color }} />
    </div>
  );
}

function TrustStars({ trust }) {
  const filled = Math.round(Math.max(1, Math.min(5, trust)));
  return (
    <span className="fighter-trust">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < filled ? 'var(--color-gold)' : 'var(--color-dim)' }}>
          {'\u2605'}
        </span>
      ))}
    </span>
  );
}

function AllyTags({ alliances, agents }) {
  if (alliances.length === 0) return null;

  return (
    <div className="fighter-allies">
      {alliances.map((allyId) => {
        const ally = agents.find((a) => a.id === allyId);
        if (!ally) return null;
        return (
          <span key={allyId} className="fighter-ally-tag" style={{ borderColor: ally.color }}>
            {ally.name}
          </span>
        );
      })}
    </div>
  );
}

export default function FightersPanel({ agents }) {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <div className="pbox" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-title">{'\u25B6'} FIGHTERS</div>
      <div className="fighters-list">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={`fighter-card${selectedId === agent.id ? ' selected' : ''}${!agent.alive ? ' dead' : ''}`}
            onClick={() => setSelectedId(selectedId === agent.id ? null : agent.id)}
          >
            <div className="fighter-header">
              <MiniSprite agentId={agent.id} color={agent.color} alive={agent.alive} />
              <div className="fighter-info">
                <span className="fighter-name" style={{ color: agent.color }}>{agent.name}</span>
                <TrustStars trust={agent.trust} />
              </div>
              <span className="fighter-hp-text">
                {agent.alive ? `${agent.hp}/${agent.maxHp}` : 'DEAD'}
              </span>
            </div>
            <HpBar hp={agent.hp} maxHp={agent.maxHp} />
            <AllyTags alliances={agent.alliances} agents={agents} />
          </div>
        ))}
      </div>
    </div>
  );
}
