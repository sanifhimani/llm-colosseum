import { useRef, useEffect } from 'react';
import { CANVAS_SIZE } from '../state/constants';
import { drawFloor } from '../canvas/floor';
import { drawWalls } from '../canvas/walls';
import { drawZone } from '../canvas/zone';
import { drawArtifacts } from '../canvas/artifacts';
import { drawAlliances } from '../canvas/alliances';
import { drawAgent, drawDead, drawNametag } from '../canvas/agents';

export default function ArenaCanvas({ agents = [], artifacts = [], zoneRadius }) {
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

    function render() {
      const now = Date.now();
      const { agents, artifacts, zoneRadius } = dataRef.current;

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
        for (const agent of agents) {
          drawNametag(ctx, agent);
        }
      }

      frameRef.current = requestAnimationFrame(render);
    }

    render();

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div className="arena-wrap pbox" style={{ padding: 0, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        className="arena-canvas-el"
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
      />
    </div>
  );
}
