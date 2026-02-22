import { memo } from 'react';
import { parseGrudgeKey } from '../simulation/actions';

export default memo(function GrudgeMap({ grudges }) {
  const entries = Object.entries(grudges);

  return (
    <div className="pbox grudge-panel">
      <div className="panel-title">{'\u25B6'} GRUDGE MAP</div>
      <div className="grudge-list">
        {entries.length === 0 && (
          <div className="grudge-empty">No grudges yet</div>
        )}
        {entries.map(([key, count]) => {
          const { from, to } = parseGrudgeKey(key);
          return (
            <div key={key} className="grudge-entry">
              <span className="grudge-from">{from.toUpperCase()}</span>
              <span className="grudge-arrow">{'\u2192'}</span>
              <span className="grudge-to">{to.toUpperCase()}</span>
              <span className="grudge-count">{count}x</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
