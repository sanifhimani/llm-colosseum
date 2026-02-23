import { readFileSync } from 'fs';
import { resolve } from 'path';

const STARTING_CORNERS = [
  [1, 1],
  [1, -2],
  [-2, 1],
  [-2, -2],
];

const ARTIFACT_SPAWNS = [
  { type: 'weapon', name: 'BLADE' },
  { type: 'shield', name: 'WARD' },
  { type: 'potion', name: 'ELIXIR' },
];

const MAX_PLACEMENT_ATTEMPTS = 100;

function resolveCorner(corner, gridSize) {
  return corner.map((v) => (v < 0 ? gridSize + v : v));
}

function generateArtifactPositions(gridSize, count) {
  const positions = [];
  const used = new Set();
  const center = Math.floor(gridSize / 2);

  for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS && positions.length < count; attempt++) {
    const r = 2 + Math.floor(Math.random() * (gridSize - 4));
    const c = 2 + Math.floor(Math.random() * (gridSize - 4));
    const key = `${r},${c}`;
    const distFromCenter = Math.abs(r - center) + Math.abs(c - center);

    if (!used.has(key) && distFromCenter >= 2) {
      used.add(key);
      positions.push([r, c]);
    }
  }

  return positions;
}

export function loadSeasonMeta(dataDir, season = 1) {
  const metaPath = resolve(dataDir, `seasons/season-${season}/meta.json`);
  return JSON.parse(readFileSync(metaPath, 'utf-8'));
}

export function createGameState(meta) {
  const { roster, rules } = meta;
  const { gridSize, startHp } = rules;

  const agents = roster.map((entry, i) => ({
    id: entry.id,
    name: entry.name,
    color: entry.color,
    model: entry.model,
    provider: entry.provider,
    hp: startHp,
    maxHp: startHp,
    pos: resolveCorner(STARTING_CORNERS[i], gridSize),
    alive: true,
    alliances: [],
    trust: 50,
    pendingAlly: null,
    weaponBuff: false,
    shieldHp: 0,
    consecutiveFailures: 0,
    autopilot: false,
  }));

  const artifactPositions = generateArtifactPositions(gridSize, ARTIFACT_SPAWNS.length);
  const artifacts = ARTIFACT_SPAWNS.map((spawn, i) => ({
    id: `artifact-${spawn.type}`,
    type: spawn.type,
    name: spawn.name,
    pos: artifactPositions[i],
    active: true,
  }));

  return {
    agents,
    artifacts,
    zoneRadius: Math.floor(gridSize / 2),
    turn: 0,
    grudges: {},
    events: [],
    rules,
  };
}

export function aliveAgents(state) {
  return state.agents.filter((a) => a.alive);
}

export function isGameOver(state) {
  const alive = aliveAgents(state);
  return alive.length <= 1 || state.turn >= state.rules.maxTurns;
}

export function getWinner(state) {
  const alive = aliveAgents(state);
  if (alive.length === 1) return alive[0];
  if (alive.length === 0) return null;
  return alive.reduce((best, a) => (a.hp > best.hp ? a : best));
}
