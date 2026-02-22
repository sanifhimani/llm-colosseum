import { useEffect, useRef } from 'react';
import { GRID_SIZE } from '../state/constants';

const FLOAT_DURATION = 1200;

export default function DamageFloat({ events, agents }) {
  const containerRef = useRef(null);
  const lastIndexRef = useRef(0);
  const agentsRef = useRef(agents);
  const timersRef = useRef([]);

  useEffect(() => {
    agentsRef.current = agents;
  }, [agents]);

  useEffect(() => {
    if (events.length === 0) { lastIndexRef.current = 0; return; }
    if (events.length <= lastIndexRef.current) return;
    const container = containerRef.current;
    if (!container) return;

    const startIdx = lastIndexRef.current;
    lastIndexRef.current = events.length;

    for (let i = startIdx; i < events.length; i++) {
      const event = events[i];
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
        timersRef.current = timersRef.current.filter((id) => id !== timerId);
      }, FLOAT_DURATION);
      timersRef.current.push(timerId);
    }
  }, [events]);

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    const container = containerRef.current;
    if (container) container.innerHTML = '';
  }, []);

  return <div ref={containerRef} className="damage-float-layer" />;
}
