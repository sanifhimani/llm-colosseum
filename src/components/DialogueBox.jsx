import { memo, useRef, useEffect, useState } from 'react';
import { drawAgentSprite } from '../utils/sprites';
import { formatEvent } from '../utils/events';

function getLastEventId(events) {
  return events.length > 0 ? events[events.length - 1].id : 0;
}

const Portrait = memo(function Portrait({ agentId, color }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 28, 28);
    drawAgentSprite(ctx, agentId, 4, 4, 2.5, color);
  }, [agentId, color]);

  return (
    <canvas
      ref={canvasRef}
      width={28}
      height={28}
      style={{ imageRendering: 'pixelated', flexShrink: 0 }}
    />
  );
});

export default function DialogueBox({ events, agents, turn }) {
  const [displayed, setDisplayed] = useState('');
  const [activeEvent, setActiveEvent] = useState(null);
  const baselineIdRef = useRef(getLastEventId(events));

  const lastEvent = events.length > 0 ? events[events.length - 1] : null;
  const isNew = lastEvent && lastEvent.id > baselineIdRef.current;

  useEffect(() => {
    if (events.length === 0) {
      baselineIdRef.current = 0;
      setActiveEvent(null);
      setDisplayed('');
    }
  }, [events.length]);

  useEffect(() => {
    if (!isNew || !lastEvent) return;
    setActiveEvent(lastEvent);
    const { msg } = formatEvent(lastEvent);
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(msg.slice(0, i));
      if (i >= msg.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [lastEvent?.id, isNew, lastEvent]);

  const agent = activeEvent?.agent ? agents.find((a) => a.id === activeEvent.agent) : null;

  return (
    <div className="pbox dialogue-box">
      <div className="dialogue-left">
        {agent ? (
          <>
            <Portrait agentId={agent.id} color={agent.color} />
            <div className="dialogue-content">
              <span className="dialogue-name" style={{ color: agent.color }}>{agent.name}</span>
              <span className="dialogue-text">
                {displayed}
                <span className="dialogue-cursor">_</span>
              </span>
            </div>
          </>
        ) : (
          <span className="dialogue-text dialogue-waiting">Waiting for battle...</span>
        )}
      </div>
      <span className="dialogue-turn">TURN {turn}</span>
    </div>
  );
}
