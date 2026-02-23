import { BaseAgent } from './base.js';
import { pickRandomAction } from '../game/actions.js';

const THINKING_LINES = [
  'Analyzing the battlefield...',
  'Calculating optimal move...',
  'Trust no one in this arena.',
  'Time to make my move.',
  'The zone is closing in...',
  'This could change everything.',
  'They will never see this coming.',
  'Patience is a weapon too.',
  'Only the strong survive here.',
  'The endgame approaches.',
];

function randomThinking() {
  return THINKING_LINES[Math.floor(Math.random() * THINKING_LINES.length)];
}

function formatAction(action, agents) {
  const nameOf = (id) => agents.find((a) => a.id === id)?.name || id;

  switch (action.type) {
    case 'MOVE': return `MOVE ${action.direction}`;
    case 'ATTACK': return `ATTACK ${nameOf(action.target)}`;
    case 'ALLY': return `ALLY ${nameOf(action.target)}`;
    case 'BETRAY': return `BETRAY ${nameOf(action.target)}`;
    case 'USE_ARTIFACT': return 'USE';
    default: return 'MOVE N';
  }
}

export class MockAgent extends BaseAgent {
  constructor(config) {
    super(config);
    this.provider = 'mock';
  }

  async call(prompt, { state, agent }) {
    const action = pickRandomAction(agent, state.agents, state.artifacts);
    const text = `ACTION: ${formatAction(action, state.agents)}\nTHINK: ${randomThinking()}`;

    return {
      text,
      usage: { input: 0, output: 0 },
      latencyMs: Math.floor(Math.random() * 50),
    };
  }
}
