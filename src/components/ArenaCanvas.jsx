import { useRef, useEffect } from 'react';
import { CANVAS_SIZE } from '../state/constants';
import { drawFloor } from '../canvas/floor';
import { drawWalls } from '../canvas/walls';
import { drawZone } from '../canvas/zone';
import { drawArtifacts } from '../canvas/artifacts';
import { drawAlliances } from '../canvas/alliances';
import { drawAgent, drawDead, drawNametags } from '../canvas/agents';

function renderFrame(ctx, data) {
  const now = Date.now();
  const { agents, artifacts, zoneRadius } = data;

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
        drawAgent(ctx, agent);
      } else {
        drawDead(ctx, agent);
      }
    }
    drawNametags(ctx, agents);
  }
}

export default function ArenaCanvas({ agents = [], artifacts = [], zoneRadius, active, children }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const dataRef = useRef({ agents, artifacts, zoneRadius });

  useEffect(() => {
    dataRef.current = { agents, artifacts, zoneRadius };
  }, [agents, artifacts, zoneRadius]);

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
  }, [active, agents, artifacts, zoneRadius]);

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
