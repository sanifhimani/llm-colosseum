import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { loadSeasonMeta } from './game/state.js';
import { MockAgent } from './agents/mock.js';
import { runBattle } from './battle.js';

const app = new Hono();
const port = process.env.PORT || 8080;
const DATA_DIR = new URL('../data', import.meta.url).pathname;

app.use('*', cors());

const viewers = new Set();
let activeBattle = null;
let lastBattleState = null;

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    uptime: process.uptime(),
    activeBattle: activeBattle !== null,
    viewers: viewers.size,
  });
});

app.get('/status', (c) => {
  if (activeBattle) {
    return c.json({
      status: 'live',
      turn: activeBattle.turn,
      startedAt: activeBattle.startedAt,
    });
  }
  return c.json({ status: 'idle' });
});

app.post('/api/trigger', async (c) => {
  if (activeBattle) {
    return c.json({ error: 'battle already in progress' }, 409);
  }

  startBattle();
  return c.json({ started: true });
});

function broadcast(event) {
  const message = JSON.stringify(event);
  for (const ws of viewers) {
    try {
      ws.send(message);
    } catch {
      viewers.delete(ws);
    }
  }
}

async function startBattle() {
  try {
    const meta = loadSeasonMeta(DATA_DIR);
    const agents = meta.roster.map((entry) => new MockAgent(entry));

    activeBattle = { turn: 0, startedAt: new Date().toISOString() };
    lastBattleState = null;

    console.log('[battle] starting');

    const { winner, turns } = await runBattle(meta, agents, {
      turnPauseMs: meta.rules.turnPauseMs || 0,
      onEvent(event) {
        if (event.turn !== undefined) {
          activeBattle.turn = event.turn;
        }
        if (event.state) {
          lastBattleState = event.state;
        }
        broadcast(event);
      },
    });

    console.log(`[battle] ended -- winner: ${winner?.name || 'none'} after ${turns} turns`);
  } catch (err) {
    console.error('[battle] error:', err);
  } finally {
    activeBattle = null;
    lastBattleState = null;
  }
}

const server = Bun.serve({
  port,
  fetch(req, server) {
    const url = new URL(req.url);
    if (url.pathname === '/ws/battle') {
      const upgraded = server.upgrade(req);
      if (!upgraded) {
        return new Response('WebSocket upgrade failed', { status: 400 });
      }
      return;
    }
    return app.fetch(req, { ip: server.requestIP(req) });
  },
  websocket: {
    open(ws) {
      viewers.add(ws);
      console.log(`[ws] viewer connected (${viewers.size} total)`);

      if (activeBattle && lastBattleState) {
        ws.send(JSON.stringify({ type: 'state', status: 'live', turn: activeBattle.turn, state: lastBattleState }));
      } else {
        ws.send(JSON.stringify({ type: 'status', status: 'idle' }));
      }
    },
    message() {},
    close(ws) {
      viewers.delete(ws);
      console.log(`[ws] viewer disconnected (${viewers.size} total)`);
    },
  },
});

console.log(`[engine] listening on :${server.port}`);
