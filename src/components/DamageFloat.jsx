import { useEffect, useRef } from 'react';
import { GRID_SIZE } from '../state/constants';

const FLOAT_DURATION = 1200;

function getLastEventId(events) {
  return events.length > 0 ? events[events.length - 1].id : 0;
}

export default function DamageFloat({ events, agents }) {
  const containerRef = useRef(null);
  const lastSeenIdRef = useRef(getLastEventId(events));
  const agentsRef = useRef(agents);
  const timersRef = useRef(new Set());

  useEffect(() => {
    agentsRef.current = agents;
  }, [agents]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || events.length === 0) return;

    const cutoff = lastSeenIdRef.current;
    lastSeenIdRef.current = getLastEventId(events);

    for (let i = events.length - 1; i >= 0; i--) {
      const event = events[i];
      if (event.id <= cutoff) break;
      if (!event.damage || !event.target) continue;
      const target = agentsRef.current.find((a) => a.id === event.target);
      if (!target) continue;

      const isBetray = event.type === 'betray' || event.type === 'betray_kill';
      const el = document.createElement('div');
      el.className = 'damage-float';
      el.textContent = isBetray ? `BETRAYED -${event.damage}` : `-${event.damage}`;
      el.style.left = `${((target.pos[1] + 0.5) / GRID_SIZE) * 100}%`;
      el.style.top = `${((target.pos[0] + 0.5) / GRID_SIZE) * 100}%`;
      el.style.color = isBetray ? 'var(--color-gold)' : 'var(--color-red)';
      container.appendChild(el);

      const timerId = setTimeout(() => {
        el.remove();
        timersRef.current.delete(timerId);
      }, FLOAT_DURATION);
      timersRef.current.add(timerId);
    }
  }, [events]);

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current.clear();
    const container = containerRef.current;
    if (container) container.innerHTML = '';
  }, []);

  return <div ref={containerRef} className="damage-float-layer" />;
}
