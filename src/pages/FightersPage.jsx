import { Link } from '../router';
import useApi from '../hooks/useApi';
import AgentSprite from '../components/AgentSprite';

function getTrustColor(trust) {
  if (trust >= 50) return 'var(--color-green)';
  if (trust >= 30) return 'var(--color-gold)';
  return 'var(--color-red)';
}

export default function FightersPage() {
  const { data, loading, error } = useApi('/api/agents');
  const agents = data?.agents ?? [];
  const season = data?.season ?? 1;

  if (loading) {
    return (
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">FIGHTERS</h1>
        </div>
        <div className="empty-state">LOADING...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">FIGHTERS</h1>
        </div>
        <div className="empty-state">FAILED TO LOAD DATA</div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">FIGHTERS</h1>
        <p className="page-subtitle">{agents.length} COMBATANTS // SEASON {season}</p>
      </div>

      <div className="fighters-grid">
        {agents.map((agent) => {
          const s = agent.stats;
          return (
            <Link key={agent.id} to={`/fighters/${agent.id}`} className="fcard pbox">
              <div className="fcard-sprite">
                <AgentSprite agentId={agent.id} color={agent.color} size={40} />
              </div>
              <div className="fcard-info">
                <div className="fcard-name" style={{ color: agent.color }}>{agent.name}</div>
                <div className="fcard-model">{agent.model} // {agent.provider.toUpperCase()}</div>
                <div className="fcard-stats">
                  <div>
                    <span style={{ color: 'var(--color-green)' }}>{s.wins}W</span>{' '}
                    <span style={{ color: 'var(--color-red)' }}>{s.losses}L</span>
                    <span className="fcard-stat-label">RECORD</span>
                  </div>
                  <div>
                    <span>{s.kills}</span>
                    <span className="fcard-stat-label">KILLS</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-red)' }}>{s.betrayals}</span>
                    <span className="fcard-stat-label">BETRAYALS</span>
                  </div>
                  <div>
                    <span style={{ color: getTrustColor(s.trustScore) }}>{s.trustScore}</span>
                    <span className="fcard-stat-label">TRUST</span>
                  </div>
                </div>
              </div>
              <div className="fcard-arrow">{'>'}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
