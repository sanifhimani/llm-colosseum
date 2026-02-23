import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { loadSeasonMeta } from './game/state.js';
import { createAgentsFromRoster } from './agents/factory.js';
import { runBattle } from './battle.js';
import { nextDayNumber, buildTranscript, writeTranscript, updateStandings, updateMemory } from './persistence.js';

const useMock = process.env.USE_MOCK === 'true';

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
    const agents = createAgentsFromRoster(meta.roster, { useMock });

    activeBattle = { turn: 0, startedAt: new Date().toISOString() };
    lastBattleState = null;

    const eventLog = [];
    const turnLog = [];

    console.log('[battle] starting');

    const battleResult = await runBattle(meta, agents, {
      turnPauseMs: meta.rules.turnPauseMs || 0,
      onEvent(event) {
        if (event.turn !== undefined) {
          activeBattle.turn = event.turn;
        }
        if (event.state) {
          lastBattleState = event.state;
        }
        eventLog.push({ ...event, timestamp: new Date().toISOString() });
        if (event.type === 'turn') {
          turnLog.push({
            turn: event.turn,
            agent: event.agent,
            action: event.action,
            thinking: event.thinking,
            event: event.event,
            latencyMs: event.latencyMs,
            tokensUsed: event.tokensUsed,
          });
        }
        broadcast(event);
      },
    });

    const { winner, turns } = battleResult;
    console.log(`[battle] ended -- winner: ${winner?.name || 'none'} after ${turns} turns`);

    try {
      const day = nextDayNumber(DATA_DIR, meta.season);
      const transcript = buildTranscript(day, meta.season, battleResult, turnLog, eventLog);
      const filePath = writeTranscript(DATA_DIR, meta.season, transcript);
      console.log(`[persist] transcript written: ${filePath}`);

      updateStandings(DATA_DIR, meta.season, battleResult.state, winner, eventLog);
      console.log('[persist] standings updated');

      for (const agent of battleResult.state.agents) {
        const won = winner && agent.id === winner.id;
        updateMemory(DATA_DIR, meta.season, agent.id, day, won, battleResult.state);
      }
      console.log('[persist] memories updated');
    } catch (err) {
      console.error('[persist] error:', err);
    }
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
