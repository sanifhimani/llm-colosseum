import { Hono } from 'hono';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { seasonDir } from '../persistence.js';

export function createDataRoutes(dataDir) {
  const app = new Hono();

  function readJson(filePath) {
    if (!existsSync(filePath)) return null;
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  }

  function currentSeason() {
    const schedule = readJson(resolve(dataDir, 'schedule.json'));
    return schedule?.currentSeason || 1;
  }

  app.get('/standings', (c) => {
    const season = currentSeason();
    const standings = readJson(resolve(seasonDir(dataDir, season), 'standings.json'));
    if (!standings) return c.json({ error: 'no standings found' }, 404);
    return c.json(standings);
  });

  app.get('/agents', (c) => {
    const season = currentSeason();
    const meta = readJson(resolve(seasonDir(dataDir, season), 'meta.json'));
    if (!meta) return c.json({ error: 'no season data found' }, 404);

    const standings = readJson(resolve(seasonDir(dataDir, season), 'standings.json'));

    const agents = meta.roster.map((entry) => {
      const stats = standings?.agents?.[entry.id] || {};
      const memory = readJson(resolve(seasonDir(dataDir, season), 'memories', `${entry.id}.json`));

      return {
        id: entry.id,
        name: entry.name,
        model: entry.model,
        provider: entry.provider,
        color: entry.color,
        stats: {
          wins: stats.wins || 0,
          losses: stats.losses || 0,
          kills: stats.kills || 0,
          deaths: stats.deaths || 0,
          betrayals: stats.betrayals || 0,
          avgPlacement: stats.avgPlacement || 0,
          currentStreak: stats.currentStreak || 0,
          trustScore: stats.trustScore || 50,
        },
        memorySummary: memory?.memories?.slice(-3) || [],
      };
    });

    return c.json({ season, agents });
  });

  app.get('/agents/:id', (c) => {
    const season = currentSeason();
    const { id } = c.req.param();

    const meta = readJson(resolve(seasonDir(dataDir, season), 'meta.json'));
    if (!meta) return c.json({ error: 'no season data found' }, 404);

    const rosterEntry = meta.roster.find((r) => r.id === id);
    if (!rosterEntry) return c.json({ error: 'agent not found' }, 404);

    const standings = readJson(resolve(seasonDir(dataDir, season), 'standings.json'));
    const stats = standings?.agents?.[id] || {};
    const memory = readJson(resolve(seasonDir(dataDir, season), 'memories', `${id}.json`));

    const headToHead = {};
    if (standings?.headToHead) {
      for (const [key, record] of Object.entries(standings.headToHead)) {
        const parts = key.split('_vs_');
        if (parts[0] !== id && parts[1] !== id) continue;
        const opponent = parts[0] === id ? parts[1] : parts[0];
        headToHead[opponent] = {
          kills: record[id] || 0,
          deaths: record[opponent] || 0,
        };
      }
    }

    return c.json({
      id: rosterEntry.id,
      name: rosterEntry.name,
      model: rosterEntry.model,
      provider: rosterEntry.provider,
      color: rosterEntry.color,
      stats: {
        wins: stats.wins || 0,
        losses: stats.losses || 0,
        kills: stats.kills || 0,
        deaths: stats.deaths || 0,
        betrayals: stats.betrayals || 0,
        betrayed: stats.betrayed || 0,
        damageDealt: stats.damageDealt || 0,
        damageTaken: stats.damageTaken || 0,
        alliancesFormed: stats.alliancesFormed || 0,
        artifactsUsed: stats.artifactsUsed || 0,
        turnsPlayed: stats.turnsPlayed || 0,
        avgPlacement: stats.avgPlacement || 0,
        currentStreak: stats.currentStreak || 0,
        longestStreak: stats.longestStreak || 0,
        trustScore: stats.trustScore || 50,
      },
      memories: memory?.memories || [],
      grudges: memory?.grudges || {},
      trustScores: memory?.trustScores || {},
      headToHead,
    });
  });

  app.get('/last-battle', (c) => {
    const season = currentSeason();
    const battlesDir = resolve(seasonDir(dataDir, season), 'battles');

    if (!existsSync(battlesDir)) return c.json({ error: 'no battles yet' }, 404);

    const files = readdirSync(battlesDir)
      .filter((f) => f.startsWith('day-') && f.endsWith('.json'))
      .sort();

    if (files.length === 0) return c.json({ error: 'no battles yet' }, 404);

    const latest = readJson(resolve(battlesDir, files[files.length - 1]));
    return c.json(latest);
  });

  app.get('/schedule', (c) => {
    const schedule = readJson(resolve(dataDir, 'schedule.json'));
    if (!schedule) return c.json({ error: 'no schedule found' }, 404);

    const season = schedule.currentSeason || 1;
    const meta = readJson(resolve(seasonDir(dataDir, season), 'meta.json'));
    const standings = readJson(resolve(seasonDir(dataDir, season), 'standings.json'));

    const nextBattle = computeNextBattleTime(schedule);

    return c.json({
      season,
      seasonName: meta?.name || null,
      status: meta?.status || 'unknown',
      totalBattles: standings?.totalBattles || 0,
      nextBattle,
      timezone: schedule.timezone,
      enabled: schedule.enabled,
    });
  });

  return app;
}

function computeNextBattleTime(schedule) {
  const now = new Date();
  const weekdayHour = parseInt(schedule.weekday?.split(':')[0] || '18', 10);
  const weekdayMin = parseInt(schedule.weekday?.split(':')[1] || '0', 10);
  const weekendHour = parseInt(schedule.weekend?.split(':')[0] || '14', 10);
  const weekendMin = parseInt(schedule.weekend?.split(':')[1] || '0', 10);

  for (let offset = 0; offset <= 7; offset++) {
    const candidate = new Date(now);
    candidate.setDate(candidate.getDate() + offset);

    const dow = candidate.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const hour = isWeekend ? weekendHour : weekdayHour;
    const min = isWeekend ? weekendMin : weekdayMin;

    candidate.setHours(hour, min, 0, 0);

    if (candidate > now) {
      return candidate.toISOString();
    }
  }

  return null;
}
