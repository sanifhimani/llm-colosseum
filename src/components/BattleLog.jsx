import { memo, useRef, useEffect } from 'react';
import { formatEvent } from '../utils/events';

export default memo(function BattleLog({ events }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    if (isNearBottom) el.scrollTop = el.scrollHeight;
  }, [events.length]);

  return (
    <div className="pbox log-panel">
      <div className="panel-title">{'\u25B6'} BATTLE LOG</div>
      <div className="log-scroll" ref={scrollRef}>
        {events.length === 0 && (
          <div className="log-empty">Waiting for battle...</div>
        )}
        {events.map((event) => {
          const { msg, color } = formatEvent(event);
          return (
            <div key={event.id} className="log-entry" style={{ color }}>
              <span className="log-turn">T{event.turn}</span>
              <span>{msg}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
