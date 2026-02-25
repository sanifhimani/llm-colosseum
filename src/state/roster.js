import { GRID_SIZE } from './constants';

const START_HP = 100;

const STARTING_POSITIONS = {
  claude: [1, 1],
  gpt: [1, GRID_SIZE - 2],
  gemini: [GRID_SIZE - 2, 1],
  grok: [GRID_SIZE - 2, GRID_SIZE - 2],
};

export const ROSTER = [
  { id: 'claude', name: 'CLAUDE', color: '#e07820', model: 'claude-opus-4-6' },
  { id: 'gpt', name: 'GPT', color: '#20c090', model: 'gpt-5.2' },
  { id: 'gemini', name: 'GEMINI', color: '#4090f0', model: 'gemini-3.1-pro-preview' },
  { id: 'grok', name: 'GROK', color: '#a0a0a8', model: 'grok-4-1-fast-non-reasoning' },
];

export function createAgents() {
  return ROSTER.map((entry) => ({
    ...entry,
    hp: START_HP,
    maxHp: START_HP,
    pos: [...STARTING_POSITIONS[entry.id]],
    alive: true,
    alliances: [],
    trust: 50,
    pendingAlly: null,
    weaponBuff: false,
    shieldHp: 0,
  }));
}
