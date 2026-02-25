import { useRef, useEffect } from 'react';
import { CANVAS_SIZE } from '../state/constants';
import { drawFloor } from '../canvas/floor';
import { drawWalls } from '../canvas/walls';
import { drawZone } from '../canvas/zone';
import { drawArtifacts } from '../canvas/artifacts';
import { drawAlliances } from '../canvas/alliances';
import { drawAgent, drawDead, drawNametags, drawThinking, drawStunned } from '../canvas/agents';

function renderFrame(ctx, data) {
  const now = Date.now();
  const { agents, artifacts, zoneRadius, thinkingAgent, stunnedAgents } = data;

  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  drawFloor(ctx);

  if (zoneRadius != null) {
    drawZone(ctx, zoneRadius, now);
  }

  if (artifacts.length > 0) {
    drawArtifacts(ctx, artifacts, now);
  }

  drawWalls(ctx, now);

  if (agents.length > 0) {
    drawAlliances(ctx, agents);
    for (const agent of agents) {
      if (agent.alive) {
        const isStunned = stunnedAgents?.has(agent.id);
        drawAgent(ctx, agent, isStunned);
        if (isStunned) {
          drawStunned(ctx, agent, now);
        } else if (agent.id === thinkingAgent) {
          drawThinking(ctx, agent, now);
        }
      } else {
        drawDead(ctx, agent);
      }
    }
    drawNametags(ctx, agents);
  }
}

export default function ArenaCanvas({ agents = [], artifacts = [], zoneRadius, active, thinkingAgent, stunnedAgents, children }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const dataRef = useRef({ agents, artifacts, zoneRadius, thinkingAgent, stunnedAgents });

  useEffect(() => {
    dataRef.current = { agents, artifacts, zoneRadius, thinkingAgent, stunnedAgents };
  }, [agents, artifacts, zoneRadius, thinkingAgent, stunnedAgents]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    if (!active) {
      renderFrame(ctx, dataRef.current);
      return;
    }

    function loop() {
      renderFrame(ctx, dataRef.current);
      frameRef.current = requestAnimationFrame(loop);
    }

    loop();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [active]);

  return (
    <div className="arena-wrap pbox" style={{ padding: 0, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        className="arena-canvas-el"
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
      />
      {children}
    </div>
  );
}
