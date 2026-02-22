import { memo } from 'react';
import { SHRINK_INTERVAL } from '../simulation/zone';

export default memo(function ZonePanel({ zoneRadius, turn, artifacts }) {
  const remainder = turn % SHRINK_INTERVAL;
  const turnsUntilShrink = remainder === 0 ? 0 : SHRINK_INTERVAL - remainder;
  const safeSize = zoneRadius * 2;
  const activeArtifacts = artifacts.filter((a) => a.active);

  return (
    <div className="pbox zone-panel">
      <div className="panel-title">{'\u25B6'} ZONE / HAZARDS</div>
      <div className="zone-content">
        <div className="zone-stat">
          <span className="zone-label">SAFE ZONE</span>
          <span className="zone-value">{safeSize}x{safeSize}</span>
        </div>
        <div className="zone-stat">
          <span className="zone-label">SHRINKS IN</span>
          <span className="zone-value zone-countdown">{turnsUntilShrink} TURNS</span>
        </div>
        <div className="zone-stat">
          <span className="zone-label">TURN</span>
          <span className="zone-value">{turn}</span>
        </div>
        {activeArtifacts.length > 0 && (
          <div className="zone-artifacts">
            <span className="zone-label">ARTIFACTS</span>
            {activeArtifacts.map((a) => (
              <div key={a.id} className="zone-artifact-item">
                <span>{a.icon}</span>
                <span>{a.name}</span>
                <span className="zone-artifact-pos">[{a.pos[0]},{a.pos[1]}]</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
