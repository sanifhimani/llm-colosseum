import { useRef, useEffect } from 'react';
import { drawAgentSprite } from '../utils/sprites';

export default function AgentSprite({ agentId, color, size = 32 }) {
  const canvasRef = useRef(null);
  const scale = size / 8;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAgentSprite(ctx, agentId, 2, 1, scale, color);
  }, [agentId, color, scale]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size + 4}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
