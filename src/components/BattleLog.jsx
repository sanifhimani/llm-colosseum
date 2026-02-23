import { memo, useRef, useEffect } from 'react';
import { formatEvent } from '../utils/events';

export default memo(function BattleLog({ events }) {
  const endRef = useRef(null);
  const stickRef = useRef(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (events.length === 0) {
      stickRef.current = true;
      return;
    }
    if (stickRef.current) {
      endRef.current?.scrollIntoView();
    }
  }, [events.length]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  }

  return (
    <div className="pbox log-panel">
      <div className="panel-title">{'\u25B6'} BATTLE LOG</div>
      <div className="log-scroll" ref={scrollRef} onScroll={handleScroll}>
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
        <div ref={endRef} />
      </div>
    </div>
  );
});
