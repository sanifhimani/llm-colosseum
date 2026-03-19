import { resolve } from 'path';
import { existsSync } from 'fs';

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/bun';

import { loadSeasonMeta } from './game/state.js';
import { createAgentsFromRoster } from './agents/factory.js';
import { runBattle } from './battle.js';
import { nextDayNumber, buildTranscript, writeTranscript, updateStandings, updateMemory, loadMemories, loadStandings } from './persistence.js';
import { createDataRoutes } from './routes/data.js';
import { startScheduler, stopScheduler } from './scheduler.js';
import { initGit, commitAndPush } from './git.js';

const useMock = process.env.USE_MOCK === 'true';

const app = new Hono();
const port = process.env.PORT || 8080;
const DATA_DIR = new URL('../data', import.meta.url).pathname;
const REPO_ROOT = resolve(DATA_DIR, '..');

await initGit(REPO_ROOT);

app.use('*', cors({
  origin: ['https://llmcolosseum.dev', 'http://localhost:5173'],
}));
app.route('/api', createDataRoutes(DATA_DIR));

const DIST_DIR = resolve(DATA_DIR, '..', 'dist');
if (existsSync(DIST_DIR)) {
  app.use('/*', serveStatic({ root: '../dist' }));
  app.get('*', serveStatic({ root: '../dist', path: '/index.html' }));
}

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
  const adminToken = process.env.ADMIN_TOKEN;
  if (adminToken) {
    const auth = c.req.header('Authorization');
    if (auth !== `Bearer ${adminToken}`) {
      return c.json({ error: 'unauthorized' }, 401);
    }
  }

  if (activeBattle) {
    return c.json({ error: 'battle already in progress' }, 409);
  }

  activeBattle = { turn: 0, startedAt: new Date().toISOString() };
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
    const memories = loadMemories(DATA_DIR, meta.season);
    const standings = loadStandings(DATA_DIR, meta.season);

    if (!activeBattle) {
      activeBattle = { turn: 0, startedAt: new Date().toISOString() };
    }
    lastBattleState = null;

    const day = nextDayNumber(DATA_DIR, meta.season);
    const eventLog = [];
    const turnLog = [];

    const memCount = Object.values(memories).reduce((sum, m) => sum + m.length, 0);
    console.log(`[battle] starting day ${day} (${useMock ? 'mock' : 'live'} agents, ${memCount} total memories loaded)`);

    const battleResult = await runBattle(meta, agents, {
      turnPauseMs: meta.rules.turnPauseMs || 0,
      memories,
      standings,
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
        if (event.type === 'battle_end') {
          broadcast({ ...event, day, season: meta.season });
        } else {
          broadcast(event);
        }
      },
    });

    const { winner, turns } = battleResult;
    console.log(`[battle] ended -- winner: ${winner?.name || 'none'} after ${turns} turns`);

    try {
      const transcript = buildTranscript(day, meta.season, battleResult, turnLog, eventLog);
      const filePath = writeTranscript(DATA_DIR, meta.season, transcript);
      console.log(`[persist] transcript written: ${filePath}`);

      updateStandings(DATA_DIR, meta.season, battleResult.state, winner, eventLog);
      console.log('[persist] standings updated');

      for (const agent of battleResult.state.agents) {
        const won = winner && agent.id === winner.id;
        updateMemory(DATA_DIR, meta.season, agent.id, day, won, battleResult.state, turnLog, eventLog);
      }
      console.log('[persist] memories updated');

      const winnerName = winner?.name || 'draw';
      await commitAndPush(REPO_ROOT, `data: day ${day} - ${winnerName} wins`);
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

console.log(`[engine] listening on :${server.port} (${useMock ? 'MOCK' : 'LIVE'} mode)`);

startScheduler(DATA_DIR, () => {
  if (!activeBattle) startBattle();
});

process.on('SIGTERM', async () => {
  console.log('[engine] SIGTERM received, shutting down');
  stopScheduler();

  const deadline = Date.now() + 120_000;
  while (activeBattle && Date.now() < deadline) {
    await Bun.sleep(1000);
  }

  if (activeBattle) {
    console.log('[engine] battle still active after 120s, forcing exit');
  }

  try {
    await commitAndPush(REPO_ROOT, 'data: shutdown commit');
  } catch {
  }

  server.stop();
  process.exit(0);
});
